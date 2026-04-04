import type { OrchEntry } from '@agent-orch/appkit';
import type { Tool } from '@agent-orch/core';

/**
 * Custom Orchestration Pattern Example
 *
 * Usage:
 * 1. In the CLI, run: /orch-load ./examples/custom-orch.ts
 * 2. Then switch to the mode: /orch -> select "Custom Research Agent"
 *
 * Supports multiple export formats:
 * - export default createOrch()
 * - export default createOrch (function, will be called)
 * - export const orch = {...}
 * - export const createOrch = () => {...}
 */

export default function createOrch(): OrchEntry {
  return {
    id: 'custom-research',
    name: 'Custom Research Agent',
    description: 'A custom single agent for research tasks',
    config: {
      id: 'custom-research-orch',
      type: 'singleAgent',
      agents: {
        agent: {
          agentId: 'researcher',
          prompt: [
            'You are a research assistant specialized in technology and programming.',
            'Your tasks:',
            '1. Analyze technical questions thoroughly',
            '2. Provide well-structured answers with examples',
            '3. When unsure, acknowledge limitations',
            '4. Always cite your reasoning',
          ].join('\n'),
          llmConfig: {
            modelId: process.env.BOT_MODEL ?? 'openai/gpt-4o',
            apiKey: process.env.BOT_API_KEY,
            baseUrl: process.env.BOT_BASE_URL,
          },
          // tools: [], // Add custom tools here
        },
      },
    },
  };
}
