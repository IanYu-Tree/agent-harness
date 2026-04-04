[**Agent Orch API Reference**](../../index.md)

***

[Agent Orch API Reference](../../index.md) / @agent-orch/appkit

# @agent-orch/appkit

High-level application API that assembles the full Agent Orch system. Provides the main entry point for building agent-powered applications.

## Features

- `AgentOrch` class as the single entry point
- `defineConfig` helper for type-safe configuration
- `SessionStore` for file-based session persistence (`~/.agent-orch/sessions/`)
- Runtime orchestration pattern switching
- Global tool injection across all agents
- Runner caching for efficient reuse

## Installation

```bash
pnpm add @agent-orch/appkit
```

## Key API

| Export | Description |
|--------|-------------|
| `AgentOrch` | Main class — assembles LLM, agents, orchestration, and tools |
| `defineConfig` | Type-safe configuration helper |
| `SessionStore` | File-based session persistence manager |

## Usage

```typescript
import { AgentOrch, defineConfig } from "@agent-orch/appkit";

const config = defineConfig({
  llm: { modelId: "openai/gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  orch: { type: "single-agent" },
  tools: [myCustomTool],
  systemPrompt: "You are a helpful assistant.",
});

const orch = new AgentOrch(config);

const stream = orch.chatStream("What can you help me with?");

for await (const event of stream) {
  switch (event.type) {
    case "text_delta":
      process.stdout.write(event.delta);
      break;
    case "finish":
      console.log("\nDone:", event.reason);
      break;
  }
}
```

### Session Persistence

```typescript
import { SessionStore } from "@agent-orch/appkit";

const store = new SessionStore();
const session = await store.load(sessionId);
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@agent-orch/core` | Core types and interfaces |
| `@agent-orch/llm` | LLM provider implementations |
| `@agent-orch/orch` | Orchestration patterns |

## Documentation

See the [Agent Orch docs](../../../README.md) for full framework documentation.

## Classes

- [AgentOrch](classes/AgentOrch.md)
- [ChatStreamProcessor](classes/ChatStreamProcessor.md)
- [SessionStore](classes/SessionStore.md)

## Interfaces

- [ChatMessage](interfaces/ChatMessage.md)
- [ChatStreamUpdate](interfaces/ChatStreamUpdate.md)
- [HarnessConfig](interfaces/HarnessConfig.md)
- [OrchEntry](interfaces/OrchEntry.md)
- [SessionData](interfaces/SessionData.md)
- [SessionSummary](interfaces/SessionSummary.md)
- [ToolItemState](interfaces/ToolItemState.md)

## Type Aliases

- [ContentPart](type-aliases/ContentPart.md)
- [StreamItem](type-aliases/StreamItem.md)
- [ToolStatus](type-aliases/ToolStatus.md)

## Functions

- [defineConfig](functions/defineConfig.md)
