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
