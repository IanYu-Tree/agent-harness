[**Agent Orch API Reference**](../../index.md)

***

[Agent Orch API Reference](../../index.md) / @agent-orch/llm

# @agent-orch/llm

LLM provider implementations with a unified interface for the Agent Orch framework. Currently supports OpenAI (using the Responses API with streaming).

## Installation

```bash
pnpm add @agent-orch/llm
```

## Key API

| Export | Description |
|--------|-------------|
| `createLLM` | Factory function that creates an LLM instance from a model ID |
| `OpenAILLM` | OpenAI provider implementation with streaming support |

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

## Dependencies

| Package | Purpose |
|---------|---------|
| `@agent-orch/core` | Core types and interfaces |
| `openai` | Official OpenAI SDK |
| `zod` | Runtime schema validation |

## Documentation

See the [Agent Orch docs](../../../README.md) for full framework documentation.

## Classes

- [OpenAILLM](classes/OpenAILLM.md)
- [OpenAIMessage](classes/OpenAIMessage.md)
- [OpenAIMessageFactory](classes/OpenAIMessageFactory.md)

## Interfaces

- [LLM](interfaces/LLM.md)

## Functions

- [convertToolsToOpenAI](functions/convertToolsToOpenAI.md)
- [createLLM](functions/createLLM.md)
- [userInputToResponseInput](functions/userInputToResponseInput.md)
