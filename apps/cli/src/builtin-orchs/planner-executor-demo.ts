import type { OrchEntry } from '@agent-orch/appkit';
import type { Tool } from '@agent-orch/core';
import { shellTool } from '../tools/shell.js';

export function createPlannerExecutorDemo(tools: Tool[] = []): OrchEntry {
  const allTools = [shellTool as unknown as Tool, ...tools];

  return {
    id: 'planner-executor',
    name: 'Planner Executor Pattern',
    description: 'PlannerExecutor with nested Reflextion (multi-agent orchestration)',
    config: {
      id: 'planner-executor-orch',
      type: 'plannerExecutor',
      agents: {
        planner: {
          agentId: 'planner-agent',
          prompt: [
            'You are a task planning agent.',
            'Given a user request, break it down into concrete, actionable steps.',
            'Use the submit_plan tool to submit a structured plan. Each task can specify which executor to use.',
            'After all steps are completed, provide a final summary to the user.',
          ].join('\n'),
          llmConfig: {
            modelId: process.env.BOT_MODEL ?? 'openai/gpt-4o',
            apiKey: process.env.BOT_API_KEY,
            baseUrl: process.env.BOT_BASE_URL,
          },
        },
        coder: {
          id: 'executor-reflextion',
          type: 'reflextion',
          options: { maxRounds: 3 },
          agents: {
            executor: {
              agentId: 'exec-agent',
              prompt: [
                'You are an execution agent that performs specific tasks.',
                'Use the available tools (like shell) to accomplish your assigned task.',
                'If previous feedback is provided, incorporate it to improve your work.',
                'Be thorough and verify your results.',
              ].join('\n'),
              llmConfig: {
                modelId: process.env.BOT_MODEL ?? 'openai/gpt-4o',
                apiKey: process.env.BOT_API_KEY,
                baseUrl: process.env.BOT_BASE_URL,
              },
              tools: allTools,
            },
            critic: {
              agentId: 'critic-agent',
              prompt: [
                'You are a quality assurance critic.',
                'Review the executor output and evaluate if the task was completed correctly.',
                'Use set_feedback to provide your assessment:',
                '- Set passed=true if the work meets quality standards',
                '- Set passed=false with specific feedback if improvements are needed',
                'Be constructive and specific in your feedback.',
              ].join('\n'),
              llmConfig: {
                modelId: process.env.BOT_MODEL ?? 'openai/gpt-4o',
                apiKey: process.env.BOT_API_KEY,
                baseUrl: process.env.BOT_BASE_URL,
              },
            },
          },
        },
      },
    },
  };
}
