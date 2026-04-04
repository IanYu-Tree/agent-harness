[**Agent Orch API Reference**](../../index.md)

***

[Agent Orch API Reference](../../index.md) / @agent-orch/core

# @agent-orch/core

Core types, interfaces, and utility functions for the Agent Orch framework. This package has no workspace dependencies and serves as the foundation layer that all other packages build upon.

## Installation

```bash
pnpm add @agent-orch/core
```

## Key API

### Types & Interfaces

| Export | Description |
|--------|-------------|
| `AgentConfig` | Configuration for an agent instance |
| `OrchConfig` | Configuration for orchestration patterns |
| `Tool` | Tool definition interface |
| `StreamEvent` | Union of 15 event types emitted during agent execution |
| `Message` | Conversation message type |
| `LLMConfig` | LLM provider configuration |
| `FinishReason` | Enum of possible finish reasons |

### Utilities

| Export | Description |
|--------|-------------|
| `StreamEventCollector` | Collects and aggregates stream events |
| `AsyncEventGenerator` | Async generator wrapper for stream events |
| `Logger` | Structured logger utility |
| `retry` | Retry utility with configurable backoff |

## Usage

```typescript
import type { AgentConfig, Tool, StreamEvent } from "@agent-orch/core";
import { StreamEventCollector, Logger, retry } from "@agent-orch/core";

const collector = new StreamEventCollector();

for await (const event of stream) {
  collector.push(event);
}

const result = collector.getResult();
```

```typescript
import { retry } from "@agent-orch/core";

const data = await retry(() => fetchData(), { maxAttempts: 3 });
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `zod` | Runtime schema validation |

## Documentation

See the [Agent Orch docs](../../../README.md) for full framework documentation.

## Classes

- [AsyncEventGenerator](classes/AsyncEventGenerator.md)
- [Message](classes/Message.md)
- [StreamEventCollector](classes/StreamEventCollector.md)

## Interfaces

- [AgentConfig](interfaces/AgentConfig.md)
- [AgentInstance](interfaces/AgentInstance.md)
- [BeforeToolExecutionContext](interfaces/BeforeToolExecutionContext.md)
- [CTX](interfaces/CTX.md)
- [FinishReason](interfaces/FinishReason.md)
- [HistoryMessage](interfaces/HistoryMessage.md)
- [Hook](interfaces/Hook.md)
- [ImageInput](interfaces/ImageInput.md)
- [LLM](interfaces/LLM.md)
- [LLMConfig](interfaces/LLMConfig.md)
- [Logger](interfaces/Logger.md)
- [MessageFactory](interfaces/MessageFactory.md)
- [OrchConfig](interfaces/OrchConfig.md)
- [RetryOptions](interfaces/RetryOptions.md)
- [StreamEvent](interfaces/StreamEvent.md)
- [StreamEventDataMap](interfaces/StreamEventDataMap.md)
- [TextInput](interfaces/TextInput.md)
- [Tool](interfaces/Tool.md)
- [ToolCall](interfaces/ToolCall.md)
- [ToolCallRecord](interfaces/ToolCallRecord.md)
- [ToolContext](interfaces/ToolContext.md)
- [ToolExecutionContext](interfaces/ToolExecutionContext.md)
- [ToolResult](interfaces/ToolResult.md)

## Type Aliases

- [LogHandler](type-aliases/LogHandler.md)
- [LogLevel](type-aliases/LogLevel.md)
- [MessageRole](type-aliases/MessageRole.md)
- [OrchType](type-aliases/OrchType.md)
- [StreamEventType](type-aliases/StreamEventType.md)
- [TypedStreamEvent](type-aliases/TypedStreamEvent.md)
- [UserInput](type-aliases/UserInput.md)

## Functions

- [consumeGenerator](functions/consumeGenerator.md)
- [createLogger](functions/createLogger.md)
- [drainGenerator](functions/drainGenerator.md)
- [generateId](functions/generateId.md)
- [isEventType](functions/isEventType.md)
- [isOrchConfig](functions/isOrchConfig.md)
- [resetGlobalLogHandler](functions/resetGlobalLogHandler.md)
- [retry](functions/retry.md)
- [setGlobalLogHandler](functions/setGlobalLogHandler.md)
