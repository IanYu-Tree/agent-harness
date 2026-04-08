[**Agent Orch API Reference**](../../index.md)

***

[Agent Orch API Reference](../../index.md) / @agent-orch/react-agent

# @agent-orch/react-agent

ReAct (Reason + Act) agent runtime for the Agent Orch framework. Implements the core agent loop: **LLM call → tool execution → repeat until done**.

## Features

- Automatic context compression (microcompact + compact)
- Tool confirmation mechanism (human-in-the-loop via wait/resolve)
- Configurable max turns (default 20)
- Before/after LLM hooks for custom logic injection

## Installation

```bash
pnpm add @agent-orch/react-agent
```

## Key API

| Export | Description |
|--------|-------------|
| `Agent` | Main agent class implementing the ReAct loop |

### Agent

The `Agent` class exposes a `runStream()` method that returns an `AsyncGenerator<StreamEvent>`, emitting events as the agent reasons and acts.

## Usage

```typescript
import { Agent } from "@agent-orch/react-agent";

const agent = new Agent({
  llm,
  tools,
  systemPrompt: "You are a helpful assistant.",
  maxTurns: 20,
});

const stream = agent.runStream(messages);

for await (const event of stream) {
  switch (event.type) {
    case "text_delta":
      process.stdout.write(event.delta);
      break;
    case "tool_call":
      console.log(`Calling ${event.name}...`);
      break;
  }
}
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@agent-orch/core` | Core types, interfaces, and stream events |

## Documentation

See the [Agent Orch docs](../../../README.md) for full framework documentation.

## Classes

- [Agent](classes/Agent.md)

## Interfaces

- [ConfirmationEvent](interfaces/ConfirmationEvent.md)
- [ConfirmationRequest](interfaces/ConfirmationRequest.md)
- [ConfirmationResult](interfaces/ConfirmationResult.md)

## Type Aliases

- [WaitFn](type-aliases/WaitFn.md)

## Functions

- [compact](functions/compact.md)
- [isLengthError](functions/isLengthError.md)
- [microcompact](functions/microcompact.md)
