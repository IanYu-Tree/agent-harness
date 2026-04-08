import { describe, it, expect } from 'vitest';
import type { ToolContext, CTX } from '@agent-orch/core';
import { createSetTodoTool } from '../todo/set-todo.js';
import { createGetTodoTool } from '../todo/get-todo.js';
import type { TodoItem } from '../todo/types.js';

function createContext(): ToolContext {
  const ctx: CTX = {};
  return { agentId: 'test-agent', ctx };
}

describe('SetTodo', () => {
  const setTodo = createSetTodoTool();

  it('should create a new todo item', async () => {
    const context = createContext();
    const result = await setTodo.execute({ content: 'Buy milk', status: 'pending' }, context);
    const parsed = JSON.parse(result.content);
    expect(parsed.action).toBe('created');
    expect(parsed.todo.content).toBe('Buy milk');
    expect(parsed.todo.status).toBe('pending');
    expect(parsed.todo.id).toBeDefined();
  });

  it('should update existing todo item', async () => {
    const context = createContext();
    const result1 = await setTodo.execute({ content: 'Buy milk', status: 'pending' }, context);
    const id = JSON.parse(result1.content).todo.id;

    const result2 = await setTodo.execute({ id, content: 'Buy milk', status: 'completed' }, context);
    const parsed = JSON.parse(result2.content);
    expect(parsed.action).toBe('updated');
    expect(parsed.todo.status).toBe('completed');
  });

  it('should validate parameters with zod', () => {
    const result = setTodo.parameters.safeParse({ content: 'valid' });
    expect(result.success).toBe(true);

    const invalid = setTodo.parameters.safeParse({});
    expect(invalid.success).toBe(false);
  });

  it('should default status to pending via zod parse', () => {
    const result = setTodo.parameters.parse({ content: 'Test' });
    expect(result.status).toBe('pending');
  });
});

describe('GetTodo', () => {
  const setTodo = createSetTodoTool();
  const getTodo = createGetTodoTool();

  it('should return empty list when no todos', async () => {
    const context = createContext();
    const result = await getTodo.execute({}, context);
    const parsed = JSON.parse(result.content);
    expect(parsed.todos).toEqual([]);
  });

  it('should return all todos', async () => {
    const context = createContext();
    await setTodo.execute({ content: 'Task 1', status: 'pending' }, context);
    await setTodo.execute({ content: 'Task 2', status: 'in_progress' }, context);

    const result = await getTodo.execute({}, context);
    const parsed = JSON.parse(result.content);
    expect(parsed.todos).toHaveLength(2);
    expect(parsed.todos[0].content).toBe('Task 1');
    expect(parsed.todos[1].content).toBe('Task 2');
  });
});

describe('Todo Store Consistency', () => {
  const setTodo = createSetTodoTool();
  const getTodo = createGetTodoTool();

  it('should maintain state across multiple operations', async () => {
    const context = createContext();

    await setTodo.execute({ content: 'A', status: 'pending' }, context);
    await setTodo.execute({ content: 'B', status: 'pending' }, context);

    let result = await getTodo.execute({}, context);
    let todos: TodoItem[] = JSON.parse(result.content).todos;
    expect(todos).toHaveLength(2);

    await setTodo.execute({ id: todos[0].id, content: 'A', status: 'completed' }, context);

    result = await getTodo.execute({}, context);
    todos = JSON.parse(result.content).todos;
    expect(todos[0].status).toBe('completed');
    expect(todos[1].status).toBe('pending');
  });
});
