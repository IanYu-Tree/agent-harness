# LLM Providers

## Overview

Agent Orch abstracts language model providers behind a unified `LLM` interface. This provider-agnostic design allows switching between models and providers through configuration alone, with no changes to agent or orchestration code.

## LLM Interface

```typescript
interface LLM {
  runStream(messages: Message[], tools?: Tool[]): AsyncGenerator<StreamEvent>
}
```

The `runStream()` method is the single entry point for all LLM interactions. It accepts a message history and an optional list of tools, and returns an `AsyncGenerator` that yields `StreamEvent` objects as the model produces output.

### Event Flow

A typical `runStream()` call produces the following event sequence:

```
llm:start → llm:chunk → llm:chunk → ... → llm:end
```

- **`llm:start`** — Emitted once when the inference call begins. Contains the model ID and input message count.
- **`llm:chunk`** — Emitted for each streaming token or partial tool call. Contains incremental text or tool call deltas.
- **`llm:end`** — Emitted once when inference completes. Contains the full assembled response, finish reason, and usage metadata.

## MessageFactory

`MessageFactory` creates provider-specific message objects from the framework's internal `Message` format. Different providers have different message schemas (e.g., OpenAI uses `role`/`content` objects, while other providers may differ). `MessageFactory` handles these transformations so that the rest of the framework operates on a single, canonical message type.

```typescript
interface MessageFactory {
  system(content: string): Message
  user(content: string): Message
  assistant(content: string): Message
  toolCall(toolCalls: ToolCall[], raw?: unknown): Message
  toolResult(toolCallId: string, content: string): Message
}
```

The factory is accessed via `llm.messageFactory`:

```typescript
const messages = llm.messageFactory.system("You are a helpful assistant.")
```

## createLLM Factory

The `createLLM()` factory function is the recommended way to instantiate an LLM. It parses a `modelId` string in `"provider/model"` format and returns the appropriate provider implementation:

```typescript
const llm = createLLM({
  modelId: "openai/gpt-4o",
  apiKey: process.env.OPENAI_API_KEY
})
```

### Model ID Format

```
provider/model
```

| Segment | Example | Description |
|---------|---------|-------------|
| `provider` | `openai` | Identifies the LLM provider. Determines which implementation class is instantiated. |
| `model` | `gpt-4o` | The specific model name passed to the provider's API. |

Examples:

- `openai/gpt-4o`
- `openai/gpt-4o-mini`
- `openai/o1`
- `anthropic/claude-3-5-sonnet-20241022`
- `anthropic/claude-3-opus-20240229`

## Supported Providers

### OpenAILLM

The `OpenAILLM` class is the built-in provider for OpenAI-compatible APIs.

**Key Implementation Details:**

- **Responses API** — Uses OpenAI's **Responses API**, not the Chat Completions API. The Responses API provides a more structured streaming format with built-in tool use support.
- **Streaming** — Responses are streamed using server-sent events. Each chunk is parsed and emitted as an `llm:chunk` event.
- **Tool Calls** — When the model decides to call a tool, the streaming response includes tool call deltas that are assembled into complete `ToolCall` objects by the time `llm:end` is emitted.

### AnthropicLLM

The `AnthropicLLM` class provides support for Anthropic's Claude models.

**Key Implementation Details:**

- **Messages API** — Uses Anthropic's **Messages API** with streaming support.
- **Streaming** — Responses are streamed with `content_block_delta` events for text and `input_json_delta` events for tool arguments.
- **Tool Calls** — Claude models use `tool_use` content blocks. Tool arguments are streamed as partial JSON and assembled incrementally.
- **Environment Variables** — Falls back to `ANTHROPIC_API_KEY` if `apiKey` is not provided in config.

## LLMConfig

```typescript
interface LLMConfig {
  modelId: string
  apiKey?: string
  baseUrl?: string
  temperature?: number
  maxTokens?: number
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `modelId` | `string` | — | Required. The `"provider/model"` identifier. |
| `apiKey` | `string?` | `undefined` | API key for authentication. Can also be set via environment variables. |
| `baseUrl` | `string?` | Provider default | Override the base URL for the API. Useful for proxies, self-hosted models, or compatible third-party endpoints. |
| `temperature` | `number?` | Provider default | Sampling temperature. Higher values produce more creative output; lower values produce more deterministic output. |
| `maxTokens` | `number?` | Provider default | Maximum number of tokens to generate in the response. |

## Custom Providers

To add a new LLM provider, implement the `LLM` interface:

1. Create a class that implements `runStream()`.
2. Yield `llm:start`, `llm:chunk`, and `llm:end` events following the standard event contract.
3. Register the provider in the `createLLM()` factory so it can be referenced by its provider prefix.

The streaming-first design ensures that any provider — whether it supports native streaming or requires polling — can be adapted to the framework's `AsyncGenerator` pattern.
