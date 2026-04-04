# Agent

## Overview

The `Agent` class, provided by the `react-agent` package, is the fundamental execution unit in Agent Orch. It implements a ReAct (Reason + Act) loop that alternates between calling an LLM and executing tools until a task is complete.

## ReAct Loop

Each invocation of `runStream()` drives the following loop:

```
┌──────────────┐
│  LLM Call     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Check Finish  │
│   Reason      │
└──────┬───────┘
       │
  ┌────┴─────┐
  │          │
  ▼          ▼
tool      end/error
  │          │
  ▼          ▼
┌────────┐  ┌────────┐
│Execute │  │ Stop   │
│ Tools  │  │ Loop   │
└───┬────┘  └────────┘
    │
    ▼
 Continue
 (next turn)
```

1. **LLM Call** — The agent sends the current message history to the LLM via `LLM.runStream()`.
2. **Check Finish Reason** — The LLM response includes a finish reason indicating why generation stopped.
3. **Tool Use** — If the finish reason is `tool`, the agent extracts tool calls, executes them in parallel, appends results to the message history, and continues to the next turn.
4. **End** — If the finish reason is `end`, the loop terminates.
5. **Error** — If the finish reason is `error`, the agent attempts message compression to reduce context size, then retries. If compression does not resolve the issue, the error is propagated.

## Constructor

```typescript
const agent = new Agent(llm, config, ctx?)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `llm` | `LLM` | The language model instance to use for inference. |
| `config` | `AgentConfig` | Agent configuration including system prompt, tools, and limits. |
| `ctx` | `CTX` (optional) | Shared context object accessible by tools and hooks. |

## runStream()

```typescript
runStream(input: string | Message[]): AsyncGenerator<StreamEvent | ConfirmationEvent>
```

The primary method for running the agent. Accepts either a plain string (converted to a user message) or an array of `Message` objects. Returns an `AsyncGenerator` that yields `StreamEvent` and `ConfirmationEvent` objects as the agent progresses through the ReAct loop.

## Max Turns

The agent enforces a maximum number of turns to prevent runaway loops. The default limit is **20 turns**. Each turn consists of one LLM call and any resulting tool executions. When the limit is reached, the agent stops and emits an `agent:end` event.

## Hooks

Hooks allow injecting custom logic at key points in the ReAct loop:

| Hook | Trigger | Use Case |
|------|---------|----------|
| `beforeLLM` | Before each LLM call | Modify messages, inject context, log requests. |
| `afterLLM` | After each LLM response | Inspect responses, collect metrics, transform output. |

Hooks receive the current agent state and can modify the message list in place.

## Message Management

The agent maintains an internal message history throughout a session. Messages are appended as the conversation progresses — user inputs, assistant responses, and tool results all become part of the history. When context limits are approached, the agent can apply compression strategies to trim older messages while preserving essential context.

## CTX (Shared Context)

`CTX` is an optional shared context object passed to the agent at construction time. It is made available to:

- Tools via `ToolContext.ctx`
- Hooks via the agent state
- Nested patterns when the agent participates in orchestration

This allows stateful data (e.g., user preferences, session metadata, external service clients) to flow through the system without tight coupling.
