# Stream Events

## Overview

Stream events are the universal communication mechanism in Agent Orch. Every component — from LLM providers to orchestration patterns — produces `StreamEvent` objects via `AsyncGenerator`. The system defines 16 event types that provide full visibility into agent lifecycle, LLM streaming, tool execution, and orchestration coordination.

## Event Types

### Agent Events

| Type | Description |
|------|-------------|
| `agent:start` | An agent has begun processing. Includes the agent ID and input. |
| `agent:end` | An agent has finished processing. Includes the final output. |
| `agent:error` | An agent encountered an unrecoverable error. Includes error details. |

### LLM Events

| Type | Description |
|------|-------------|
| `llm:start` | An LLM inference call has begun. Includes model ID and message count. |
| `llm:chunk` | A streaming chunk has been received from the LLM. Contains partial text or tool call deltas. |
| `llm:reasoning` | A reasoning/thinking chunk from the LLM. Contains partial reasoning text for models that support chain-of-thought. |
| `llm:end` | An LLM inference call has completed. Includes the full response and finish reason. |

### Tool Events

| Type | Description |
|------|-------------|
| `tool:start` | A tool execution has begun. Includes tool name, call ID, and arguments. |
| `tool:end` | A tool execution has completed. Includes the tool result and whether it was an error. |

### Pattern Events

| Type | Description |
|------|-------------|
| `pattern:start` | An orchestration pattern has begun running. Includes the pattern type and ID. |
| `pattern:end` | An orchestration pattern has finished. Includes the final outcome. |

### Orchestration Events

| Type | Description |
|------|-------------|
| `orch:spawn` | A child agent or nested pattern has been spawned by an orchestrator. |
| `orch:complete` | An orchestration workflow has fully completed (all tasks done). |
| `orch:task_start` | A specific task within a plan has begun execution. |
| `orch:task_complete` | A specific task within a plan has finished successfully. |
| `orch:task_failed` | A specific task within a plan has failed. Includes error information. |

## StreamEvent Interface

```typescript
interface StreamEvent {
  type: StreamEventType
  timestamp: number
  agentId?: string
  patternId?: string
  data: StreamEventDataMap[StreamEventType]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `StreamEventType` | One of the 16 event type identifiers (e.g., `"llm:chunk"`). |
| `timestamp` | `number` | Unix timestamp in milliseconds when the event was created. |
| `agentId` | `string?` | The ID of the agent that produced this event, if applicable. |
| `patternId` | `string?` | The ID of the orchestration pattern, if applicable. |
| `data` | `StreamEventDataMap[StreamEventType]` | Event-specific payload. Type varies by event type, with full type safety via StreamEventDataMap. |

## TypedStreamEvent

For type-safe access to event data, use `TypedStreamEvent<T>`:

```typescript
type TypedStreamEvent<T extends StreamEvent["type"]> = Extract<StreamEvent, { type: T }>
```

This narrows the `data` field to the specific shape associated with the given event type, enabling compile-time checks and autocompletion.

## Type Guard

The `isEventType()` utility provides runtime type narrowing:

```typescript
function isEventType<T extends StreamEvent["type"]>(
  event: StreamEvent,
  type: T
): event is TypedStreamEvent<T>
```

Usage:

```typescript
for await (const event of orch.chatStream(input)) {
  if (isEventType(event, "llm:chunk")) {
    process.stdout.write(event.data.content)
  }
}
```

## StreamEventCollector

`StreamEventCollector` provides pub/sub capabilities for decoupled event handling:

```typescript
const collector = new StreamEventCollector()

const subId = collector.subscribe(
  (event) => console.log(`Tool called: ${event.data}`),
  (event) => event.type === "tool:start"
)

collector.publish(event)
```

This allows multiple independent consumers to react to events without modifying the core streaming pipeline.

## Consuming Events

The primary way to consume events is by iterating over the `AsyncGenerator` returned by `chatStream()`:

```typescript
const orch = new AgentOrch(config)

for await (const event of orch.chatStream("Summarize this document")) {
  switch (event.type) {
    case "llm:chunk":
      process.stdout.write(event.data.content)
      break
    case "tool:start":
      console.log(`\nUsing tool: ${event.data.name}`)
      break
    case "agent:end":
      console.log("\nAgent finished.")
      break
    case "agent:error":
      console.error(`Error: ${event.data.reason}`)
      break
  }
}
```

Events arrive in chronological order. Nested patterns emit their events inline within the parent stream, so a single `for await` loop captures the complete execution trace.
