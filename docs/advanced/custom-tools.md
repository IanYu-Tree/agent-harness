# Custom Tools

Agent Orch provides a flexible tool system that lets you extend agent capabilities with custom tools. Each tool uses a Zod schema for parameter validation, ensuring type safety at both compile time and runtime.

## Tool Interface

Every tool implements the `Tool` interface, which consists of a name, description, a Zod parameter schema, and an async execute function.

```typescript
import { z } from "zod";
import { Tool, ToolContext, ToolResult } from "@agent-orch/core";

const weatherTool: Tool = {
  name: "get_weather",
  description: "Retrieves the current weather for a given city.",
  parameters: z.object({
    city: z.string().describe("The city name to look up weather for"),
    units: z.enum(["celsius", "fahrenheit"]).default("celsius"),
  }),
  execute: async (params, ctx: ToolContext): Promise<ToolResult> => {
    const response = await fetch(
      `https://api.weather.example.com/v1/current?city=${params.city}&units=${params.units}`
    );
    const data = await response.json();

    return {
      content: `Weather in ${params.city}: ${data.temperature}° ${params.units}, ${data.condition}`,
    };
  },
};
```

## Step-by-Step

### 1. Define the Zod Schema

Use `z.object()` to declare the parameters your tool accepts. Add `.describe()` calls to each field so the LLM understands what to provide.

### 2. Create the Tool Object

Construct an object satisfying the `Tool` interface:

| Field         | Type                                          | Description                          |
| ------------- | --------------------------------------------- | ------------------------------------ |
| `name`        | `string`                                      | Unique identifier for the tool       |
| `description` | `string`                                      | Natural-language purpose of the tool |
| `parameters`  | `ZodObject`                                   | Zod schema for input validation      |
| `execute`     | `(params, ctx: ToolContext) => Promise<ToolResult>` | Async function that runs the tool    |

### 3. Register the Tool

Add the tool to the `tools` array in your `AgentConfig`:

```typescript
const agentConfig: AgentConfig = {
  model: "gpt-4o",
  systemPrompt: "You are a helpful weather assistant.",
  tools: [weatherTool],
};
```

## ToolContext

The `ToolContext` object is passed as the second argument to every `execute` call and provides:

- **`agentId`** — The unique identifier of the agent invoking the tool.
- **`ctx`** — A shared context map accessible across all tools within the same orchestration run, useful for passing state between tool invocations.

## ToolResult

The `execute` function must return a `ToolResult`:

| Field     | Type      | Required | Description                                      |
| --------- | --------- | -------- | ------------------------------------------------ |
| `content` | `string`  | Yes      | The textual result returned to the agent          |
| `isError` | `boolean` | No       | When `true`, signals the agent that an error occurred |

```typescript
return { content: "Something went wrong.", isError: true };
```

## Best Practices

- Keep tool names short and descriptive using `snake_case`.
- Write clear descriptions — the LLM relies on them to decide when and how to call your tool.
- Validate external responses before returning them as `content`.
- Use `isError: true` for recoverable failures so the agent can retry or adjust its approach.
- Leverage the shared `ctx` map for cross-tool state rather than module-level variables.
