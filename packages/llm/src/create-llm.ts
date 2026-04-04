import type { LLMConfig } from '@agent-orch/core';
import type { LLM } from './types.js';
import { OpenAILLM } from './providers/openai/index.js';
import { AnthropicLLM } from './providers/anthropic/index.js';

export function createLLM(config: LLMConfig): LLM {
  const [provider] = config.modelId.split('/');
  switch (provider) {
    case 'openai':
      return new OpenAILLM(config);
    case 'anthropic':
      return new AnthropicLLM(config);
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}
