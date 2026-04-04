# @agent-orch/tool

Built-in reusable tools for agents in the Agent Orch framework. Provides ready-made tool implementations that can be injected into any agent.

## Available Tools

### Todo Tools

Task management tools for agents to track and organize work.

| Tool | Description |
|------|-------------|
| `setTodo` | Create or update a todo item |
| `getTodo` | Retrieve current todo list state |

## Installation

```bash
pnpm add @agent-orch/tool
```

## Key API

| Export | Description |
|--------|-------------|
| `setTodo` | Tool definition for creating/updating todos |
| `getTodo` | Tool definition for reading todos |

## Usage

```typescript
import { setTodo, getTodo } from "@agent-orch/tool";

const agent = new Agent({
  llm,
  tools: [setTodo, getTodo, ...otherTools],
  systemPrompt: "You are a helpful assistant.",
});
```

Each tool conforms to the `Tool` interface from `@agent-orch/core` and can be passed directly into any agent's tool array.

## Dependencies

| Package | Purpose |
|---------|---------|
| `@agent-orch/core` | Core `Tool` type and interfaces |
| `zod` | Runtime schema validation for tool inputs |

## Documentation

See the [Agent Orch docs](../../../README.md) for full framework documentation.
