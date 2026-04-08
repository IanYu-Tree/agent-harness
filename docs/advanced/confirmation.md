# Tool Confirmation

Agent Orch supports a human-in-the-loop mechanism that allows tools to pause execution and request user confirmation before proceeding with potentially dangerous operations.

## How It Works

The confirmation flow uses a promise-based pause/resume pattern:

1. A tool calls `ctx.wait(data?)` during execution.
2. Execution suspends and the framework yields a `tool:confirmation` event.
3. External code inspects the confirmation request and calls `agent.resolve()`.
4. The tool resumes based on the approval decision.

## Requesting Confirmation

Inside a tool's `execute` function, call `ctx.wait()` to pause and await approval:

```typescript
const deleteFileTool: Tool = {
  name: "delete_file",
  description: "Deletes a file at the specified path.",
  parameters: z.object({
    path: z.string().describe("Absolute path to the file to delete"),
  }),
  execute: async (params, ctx: ToolContext): Promise<ToolResult> => {
    const approval = await ctx.wait({
      action: "delete_file",
      path: params.path,
      message: `About to delete ${params.path}. Approve?`,
    });

    if (!approval.approved) {
      return { content: "File deletion was cancelled by the user." };
    }

    await fs.unlink(params.path);
    return { content: `Deleted ${params.path} successfully.` };
  },
};
```

The optional `data` argument passed to `ctx.wait()` is included in the `tool:confirmation` event, giving the consumer enough context to present a meaningful prompt.

## Resolving Confirmations

When a `tool:confirmation` event is received, call `agent.resolve()` to continue execution:

```typescript
for await (const event of orchestrator.run(input)) {
  if (event.type === "tool:confirmation") {
    const userApproved = await promptUser(event.data.message);
    event.agent.resolve({ approved: userApproved });
  }
}
```

The `resolve()` method accepts an object with at minimum an `approved` boolean. You can include additional fields that the tool can read from the returned approval object.

## Event Structure

The `tool:confirmation` event contains:

| Field     | Type     | Description                                        |
| --------- | -------- | -------------------------------------------------- |
| `type`    | `string` | Always `"tool:confirmation"`                       |
| `agentId` | `string` | The agent that invoked the tool                    |
| `toolName`| `string` | Name of the tool requesting confirmation           |
| `data`    | `unknown`| Optional payload passed to `ctx.wait()`            |
| `agent`   | `Agent`  | Reference to the agent, used to call `resolve()`   |

## Use Cases

- **File system operations** — Confirm before deleting or overwriting files.
- **External API calls** — Approve requests that incur costs or have side effects.
- **Database mutations** — Gate destructive queries behind user approval.
- **Deployment actions** — Require sign-off before pushing to production.

## Best Practices

- Always provide descriptive `data` in `ctx.wait()` so the consumer can render a useful prompt.
- Handle the case where `approved` is `false` gracefully and return an informative `ToolResult`.
- Set reasonable timeouts on the consumer side to avoid indefinitely suspended agents.
- Use confirmation selectively — requiring approval for every tool call degrades the agent experience.
