import type { OrchEntry } from '@agent-orch/appkit';
import type { Tool } from '@agent-orch/core';
import { shellTool } from '../tools/shell.js';

export function createSingleAgentDemo(tools: Tool[] = []): OrchEntry {
  return {
    id: 'single',
    name: 'Single Agent',
    description: 'A single ReAct agent with tool calling',
    config: {
      id: 'single-orch',
      type: 'singleAgent',
      agents: {
        agent: {
          agentId: 'assistant',
          prompt: 'You are a helpful AI assistant. You can use tools to help the user. Be concise and direct in your responses.',
          llmConfig: {
            modelId: process.env.BOT_MODEL ?? 'openai/gpt-4o',
            apiKey: process.env.BOT_API_KEY,
            baseUrl: process.env.BOT_BASE_URL,
          },
          tools: [shellTool as unknown as Tool, ...tools],
        },
      },
    },
  };
}
