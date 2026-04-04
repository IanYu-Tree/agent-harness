import { z } from 'zod';
import type { Tool, ToolContext } from '@agent-orch/core';
import { generateId } from '@agent-orch/core';
import type { TodoItem } from './types.js';

const SetTodoParams = z.object({
  id: z.string().optional().describe('todo item ID, auto-generated if not provided'),
  content: z.string().describe('todo content'),
  status: z
    .enum(['pending', 'in_progress', 'completed'])
    .optional()
    .default('pending')
    .describe('status'),
});

export function createSetTodoTool(): Tool<typeof SetTodoParams> {
  return {
    name: 'set_todo',
    description: 'Create or update a todo item. You can set content and status.',
    parameters: SetTodoParams,
    execute: async (params: z.infer<typeof SetTodoParams>, context: ToolContext) => {
      const todoStore = (context.ctx.todoStore as TodoItem[] | undefined) ?? [];
      context.ctx.todoStore = todoStore;

      const id = params.id ?? generateId();
      const existing = todoStore.findIndex((t) => t.id === id);

      if (existing >= 0) {
        todoStore[existing] = { ...todoStore[existing], ...params, id };
        return { content: JSON.stringify({ action: 'updated', todo: todoStore[existing] }) };
      }

      const newItem: TodoItem = { id, content: params.content, status: params.status ?? 'pending' };
      todoStore.push(newItem);
      return { content: JSON.stringify({ action: 'created', todo: newItem }) };
    },
  };
}
