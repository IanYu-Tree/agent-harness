# @agent-orch/llm

LLM provider implementations with a unified interface for the Agent Orch framework. Currently supports OpenAI (using the Responses API with streaming) and Anthropic (using the Messages API with streaming).

## Installation

```bash
pnpm add @agent-orch/llm
```

## Key API

| Export | Description |
|--------|-------------|
| `createLLM` | Factory function that creates an LLM instance from a model ID |
| `OpenAILLM` | OpenAI provider implementation with streaming support |
| `AnthropicLLM` | Anthropic provider implementation with streaming support |

## Usage

```typescript
import { createLLM } from "@agent-orch/llm";

const llm = createLLM({
  modelId: "openai/gpt-4o",
  apiKey: process.env.OPENAI_API_KEY,
});

const stream = llm.stream(messages, tools);

for await (const event of stream) {
  console.log(event);
}
```

The `modelId` format is `"provider/model"` — the prefix selects the provider and the suffix is passed as the model name.

### Supported Providers

| Provider | Prefix | Example |
|----------|--------|---------|
| OpenAI | `openai/` | `openai/gpt-4o` |
| Anthropic | `anthropic/` | `anthropic/claude-3-5-sonnet-20241022` |

## Dependencies

| Package | Purpose |
|---------|---------|
| `@agent-orch/core` | Core types and interfaces |
| `openai` | Official OpenAI SDK |
| `@anthropic-ai/sdk` | Official Anthropic SDK |
| `zod` | Runtime schema validation |
| `zod-to-json-schema` | Zod to JSON Schema conversion |

## Documentation

See the [Agent Orch docs](../../../README.md) for full framework documentation.
