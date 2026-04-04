import type { OrchEntry } from '@agent-orch/appkit';

/**
 * Custom Planner-Executor Orchestration Pattern Example
 *
 * This example demonstrates how to configure a custom multi-agent orchestration pattern
 */

export const orch: OrchEntry = {
  id: 'custom-planner',
  name: 'Custom Planner Pattern',
  description: 'Custom planner-executor with specific prompts',
  config: {
    id: 'custom-planner-orch',
    type: 'plannerExecutor',
    agents: {
      planner: {
        agentId: 'planner',
        prompt: [
          'You are a task planner for a coding project.',
          'Given a user request, create a detailed implementation plan.',
          'Each step should be clear and actionable.',
          'Use the submit_plan tool to submit your plan.',
        ].join('\n'),
        llmConfig: {
          modelId: process.env.BOT_MODEL ?? 'openai/gpt-4o',
          apiKey: process.env.BOT_API_KEY,
          baseUrl: process.env.BOT_BASE_URL,
        },
      },
      executor: {
        agentId: 'executor',
        prompt: [
          'You are a skilled software developer.',
          'Your job is to implement the specific task assigned to you.',
          'Write clean, well-documented code.',
          'If you encounter issues, report them clearly.',
        ].join('\n'),
        llmConfig: {
          modelId: process.env.BOT_MODEL ?? 'openai/gpt-4o',
          apiKey: process.env.BOT_API_KEY,
          baseUrl: process.env.BOT_BASE_URL,
        },
      },
    },
  },
};
