import { z } from 'zod';
import type { Tool, ToolContext } from '@agent-orch/core';
import type { TodoItem } from './types.js';

const GetTodoParams = z.object({});

export function createGetTodoTool(): Tool<typeof GetTodoParams> {
  return {
    name: 'get_todo',
    description: 'Get the current todo list.',
    parameters: GetTodoParams,
    execute: async (_params: z.infer<typeof GetTodoParams>, context: ToolContext) => {
      const todoStore = (context.ctx.todoStore as TodoItem[] | undefined) ?? [];
      return { content: JSON.stringify({ todos: todoStore }) };
    },
  };
}
