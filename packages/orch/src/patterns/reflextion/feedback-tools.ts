import { z } from 'zod';
import type { Tool, ToolContext, ToolResult } from '@agent-orch/core';
import type { FeedbackStore } from './feedback-store.js';

const SetFeedbackParams = z.object({
  feedback: z.string().describe('Feedback content for the current execution result'),
  passed: z.boolean().describe('Whether the result passes review'),
});

const GetFeedbackParams = z.object({});

export function createSetFeedbackTool(store: FeedbackStore): Tool<typeof SetFeedbackParams> {
  return {
    name: 'set_feedback',
    description: 'Provide feedback on the executor output. Set passed=true if the result meets requirements.',
    parameters: SetFeedbackParams,
    execute: async (params: z.infer<typeof SetFeedbackParams>, _context: ToolContext): Promise<ToolResult> => {
      store.setFeedback(params.feedback, params.passed);
      return {
        content: JSON.stringify({
          action: 'feedback_set',
          passed: params.passed,
          round: store.round,
        }),
      };
    },
  };
}

export function createGetFeedbackTool(store: FeedbackStore): Tool<typeof GetFeedbackParams> {
  return {
    name: 'get_feedback',
    description: 'Get the feedback from the previous review round.',
    parameters: GetFeedbackParams,
    execute: async (_params: z.infer<typeof GetFeedbackParams>, _context: ToolContext): Promise<ToolResult> => {
      const feedback = store.getFeedback();
      return { content: JSON.stringify(feedback) };
    },
  };
}
