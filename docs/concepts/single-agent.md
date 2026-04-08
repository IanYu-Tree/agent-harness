# SingleAgent Pattern

## Overview

The `SingleAgent` pattern is the simplest orchestration pattern in Agent Orch. It creates a single `Agent` instance and forwards all of its stream events directly to the caller. This pattern is the default choice for straightforward conversational assistants and single-focus tasks.

## How It Works

```
User Input
  → SingleAgentRunner.run()
    → Agent.runStream()
      → StreamEvents (forwarded as-is)
```

The runner:

1. Receives user input via `run()`.
2. Passes the input to the underlying `Agent.runStream()`.
3. Yields every `StreamEvent` produced by the agent without transformation.

There is no planning phase, no critic, and no task decomposition. The agent operates autonomously within its configured tool set and system prompt.

## Agent Reuse

Within a session, the `Agent` instance is **reused across calls**. This means the agent's message history persists between invocations, enabling multi-turn conversations where the agent retains context from prior exchanges.

## Configuration

```typescript
const config: OrchConfig = {
  id: "chat",
  type: "singleAgent",
  agents: {
    main: {
      agentId: "main",
      prompt: "You are a helpful assistant.",
      llmConfig: { modelId: "openai/gpt-4o" },
      maxTurns: 20,
    },
  },
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier for this orchestration config. |
| `type` | `"singleAgent"` | Selects the SingleAgent pattern. |
| `agents` | `Record<string, AgentConfig>` | A record of agent configurations. For SingleAgent, typically contains one entry. |

## Use Cases

- **General-purpose assistant** — A chatbot that answers questions, performs web searches, and uses tools as needed.
- **Focused tool agent** — An agent with a narrow tool set designed for a specific domain (e.g., database queries, file manipulation).
- **Rapid prototyping** — The fastest way to get an agent running when you do not need multi-agent coordination.

## Limitations

- No task decomposition or parallel execution.
- No built-in quality review loop.
- All responsibility falls on a single agent — if the task exceeds the agent's capability or context window, there is no fallback mechanism beyond message compression.

For tasks that require planning, parallelism, or iterative refinement, consider [PlannerExecutor](./planner-executor.md) or [Reflextion](./reflextion.md).
