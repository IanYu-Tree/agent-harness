# Tools

## Overview

Tools are the mechanism by which agents interact with the outside world. Each tool defines a name, description, parameter schema, and an execute function. The agent's LLM decides when and how to call tools based on the tool definitions provided in its configuration.

## Tool Interface

```typescript
interface Tool {
  name: string
  description: string
  parameters: ZodSchema
  execute(params: unknown, context: ToolContext): Promise<ToolResult>
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Unique identifier for the tool. Used by the LLM to reference the tool in tool calls. |
| `description` | `string` | Human-readable description of what the tool does. Included in the LLM prompt to guide tool selection. |
| `parameters` | `ZodSchema` | A Zod schema defining the expected input parameters. Used for validation and for generating the JSON Schema sent to the LLM. |
| `execute` | `function` | The implementation. Receives validated parameters and a `ToolContext`, returns a `ToolResult`. |

## ToolContext

```typescript
interface ToolContext {
  agentId: string
  ctx: CTX
}
```

| Field | Type | Description |
|-------|------|-------------|
| `agentId` | `string` | The ID of the agent that invoked the tool. |
| `ctx` | `CTX` | The shared context object passed through the system. Provides access to session state, external clients, and other shared resources. |

## ToolResult

```typescript
interface ToolResult {
  content: string
  isError?: boolean
}
```

| Field | Type | Description |
|-------|------|-------------|
| `content` | `string` | The output of the tool execution. Returned to the agent as a tool result message. |
| `isError` | `boolean?` | If `true`, indicates the tool execution failed. The agent will see the content as an error message and may retry or adjust its approach. |

## ToolCall

```typescript
interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier for this specific tool call instance. Used to correlate calls with results. |
| `name` | `string` | The name of the tool to invoke. |
| `arguments` | `Record<string, unknown>` | The arguments to pass to the tool, as determined by the LLM. |

## Built-in Tools

Agent Orch ships with two built-in tools for task tracking:

### set-todo

Creates or updates a todo item. Useful for agents that need to track progress on multi-step tasks.

### get-todo

Retrieves the current list of todo items. Allows the agent to review outstanding work and prioritize next steps.

## Creating a Custom Tool

Here is an example of defining a custom tool with a Zod parameter schema:

```typescript
import { z } from "zod"
import { Tool, ToolContext, ToolResult } from "@agent-orch/core"

const weatherTool: Tool = {
  name: "get-weather",
  description: "Get the current weather for a given city.",
  parameters: z.object({
    city: z.string().describe("The city name to look up weather for."),
    units: z
      .enum(["celsius", "fahrenheit"])
      .optional()
      .default("celsius")
      .describe("Temperature unit.")
  }),
  async execute(params, context: ToolContext): Promise<ToolResult> {
    const { city, units } = params as { city: string; units: string }

    const response = await fetch(
      `https://api.weather.example.com/current?city=${encodeURIComponent(city)}&units=${units}`
    )

    if (!response.ok) {
      return { content: `Failed to fetch weather for ${city}.`, isError: true }
    }

    const data = await response.json()
    return {
      content: `Weather in ${city}: ${data.temperature}° ${units}, ${data.condition}.`
    }
  }
}
```

### Key Points

- **Zod schemas** are used for parameter definitions. They provide runtime validation and generate the JSON Schema that the LLM uses to understand the tool's expected input.
- **ToolContext** gives tools access to the invoking agent's ID and the shared `CTX` object, enabling stateful behavior without global state.
- **ToolResult** is always a string-based response. For structured data, serialize it as JSON within the `content` field.
- **Error handling** — Return `{ isError: true }` rather than throwing exceptions. This allows the agent to handle errors gracefully within the ReAct loop.
