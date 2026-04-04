import { describe, it, expect, vi } from 'vitest';
import { type StreamEvent, type FinishReason, type AgentConfig, type OrchConfig, type LLM, type Message } from '@agent-orch/core';
import { MockMessage, createMockFactory } from '@agent-orch/core/testing';
import type { PatternDeps } from '../types.js';
import { PatternFactory } from '../factory/pattern-factory.js';
import { TaskGraph } from '../patterns/planner-executor/task-graph.js';

function createMockLLMForPlanner(plan?: object): LLM {
  let callCount = 0;
  const factory = createMockFactory();
  const defaultPlan = {
    tasks: [
      { id: 'task_1', description: 'do step 1', dependencies: [] },
      { id: 'task_2', description: 'do step 2', dependencies: ['task_1'] },
    ],
  };
  return {
    messageFactory: factory,
    async *runStream(params) {
      callCount++;
      if (callCount === 1) {
        yield { type: 'llm:chunk', timestamp: Date.now(), data: { content: 'Planning...' } } as StreamEvent;
        return {
          reason: { type: 'tool' } as FinishReason,
          messages: [
            ...params.messages,
            new MockMessage({
              role: 'tool_call',
              content: '',
              toolCalls: [{ id: 'fc_1', name: 'submit_plan', arguments: JSON.stringify(plan ?? defaultPlan) }],
            }),
          ],
        };
      }
      yield { type: 'llm:chunk', timestamp: Date.now(), data: { content: 'Done' } } as StreamEvent;
      return {
        reason: { type: 'end' } as FinishReason,
        messages: [...params.messages],
      };
    },
  };
}

function createMockLLMForExecutor(content = 'Executed task'): LLM {
  return {
    messageFactory: createMockFactory(),
    async *runStream(params) {
      yield { type: 'llm:chunk', timestamp: Date.now(), data: { content } } as StreamEvent;
      return {
        reason: { type: 'end' } as FinishReason,
        messages: [...params.messages],
      };
    },
  };
}

function createTestSetup(plan?: object) {
  const plannerLLM = createMockLLMForPlanner(plan);
  const executorLLM = createMockLLMForExecutor();

  const deps: PatternDeps = {
    createLLM: vi.fn().mockImplementation((config) => {
      if (config.modelId.includes('planner')) return plannerLLM;
      return executorLLM;
    }),
  };

  const config: OrchConfig = {
    id: 'pe-1',
    type: 'plannerExecutor',
    agents: {
      planner: {
        agentId: 'planner',
        prompt: 'You are a planner.',
        llmConfig: { modelId: 'openai/planner-model' },
      } as AgentConfig,
      executor: {
        agentId: 'executor',
        prompt: 'You are an executor.',
        llmConfig: { modelId: 'openai/executor-model' },
      } as AgentConfig,
    },
  };

  return { deps, config };
}

async function runPattern(pattern: ReturnType<PatternFactory['create']>) {
  const gen = pattern.run([{ type: 'text', text: 'build a feature' }], {
    eventPublisher: vi.fn(),
  });

  const events: StreamEvent[] = [];
  let result: { reason: FinishReason };

  while (true) {
    const { value, done } = await gen.next();
    if (done) {
      result = value;
      break;
    }
    events.push(value);
  }

  return { events, result: result! };
}

describe('PlannerExecutorPattern', () => {
  it('should run planner-executor flow with submit_plan', async () => {
    const { deps, config } = createTestSetup();
    const factory = new PatternFactory(deps);
    const pattern = factory.create(config);

    const { events, result } = await runPattern(pattern);

    expect(events.some((e) => e.type === 'pattern:start')).toBe(true);
    expect(events.some((e) => e.type === 'pattern:end')).toBe(true);
    expect(result.reason.type).toBe('end');
  });

  it('should support multiple executors with executor selection per task', async () => {
    const plan = {
      tasks: [
        { id: 'task_1', description: 'write code', dependencies: [], executor: 'coder' },
        { id: 'task_2', description: 'research topic', dependencies: [], executor: 'researcher' },
        { id: 'task_3', description: 'combine results', dependencies: ['task_1', 'task_2'], executor: 'coder' },
      ],
    };

    const plannerLLM = createMockLLMForPlanner(plan);
    const coderLLM = createMockLLMForExecutor('Code output');
    const researcherLLM = createMockLLMForExecutor('Research output');

    const deps: PatternDeps = {
      createLLM: vi.fn().mockImplementation((config) => {
        if (config.modelId.includes('planner')) return plannerLLM;
        if (config.modelId.includes('coder')) return coderLLM;
        if (config.modelId.includes('researcher')) return researcherLLM;
        return coderLLM;
      }),
    };

    const config: OrchConfig = {
      id: 'pe-multi',
      type: 'plannerExecutor',
      agents: {
        planner: {
          agentId: 'planner',
          prompt: 'You are a planner.',
          llmConfig: { modelId: 'openai/planner-model' },
        } as AgentConfig,
        coder: {
          agentId: 'coder',
          prompt: 'You write code.',
          desc: 'Coding executor that writes and tests code',
          llmConfig: { modelId: 'openai/coder-model' },
        } as AgentConfig,
        researcher: {
          agentId: 'researcher',
          prompt: 'You do research.',
          desc: 'Research executor that gathers information',
          llmConfig: { modelId: 'openai/researcher-model' },
        } as AgentConfig,
      },
    };

    const factory = new PatternFactory(deps);
    const pattern = factory.create(config);
    const { events, result } = await runPattern(pattern);

    expect(result.reason.type).toBe('end');
    expect(events.some((e) => e.type === 'pattern:start')).toBe(true);
    expect(events.some((e) => e.type === 'pattern:end')).toBe(true);
  });

  it('should reject plan with unknown executor id', async () => {
    const plan = {
      tasks: [
        { id: 'task_1', description: 'do something', dependencies: [], executor: 'nonexistent' },
      ],
    };

    const { deps, config } = createTestSetup(plan);
    const factory = new PatternFactory(deps);
    const pattern = factory.create(config);
    const { result } = await runPattern(pattern);

    expect(result.reason.type).toBe('end');
  });

  it('should require at least one executor agent', () => {
    const deps: PatternDeps = {
      createLLM: vi.fn(),
    };

    const config: OrchConfig = {
      id: 'pe-no-executor',
      type: 'plannerExecutor',
      agents: {
        planner: {
          agentId: 'planner',
          prompt: 'You are a planner.',
          llmConfig: { modelId: 'openai/planner-model' },
        } as AgentConfig,
      },
    };

    const factory = new PatternFactory(deps);
    expect(() => factory.create(config)).toThrow('at least one executor');
  });

  it('should load history messages into planner agent', async () => {
    const receivedMessages: Message[][] = [];

    const plannerLLM: LLM = {
      messageFactory: createMockFactory(),
      async *runStream(params) {
        receivedMessages.push([...params.messages]);
        yield { type: 'llm:chunk', timestamp: Date.now(), data: { content: 'Done' } } as StreamEvent;
        return {
          reason: { type: 'end' } as FinishReason,
          messages: [...params.messages],
        };
      },
    };

    const deps: PatternDeps = {
      createLLM: vi.fn().mockReturnValue(plannerLLM),
    };

    const config: OrchConfig = {
      id: 'pe-history',
      type: 'plannerExecutor',
      agents: {
        planner: {
          agentId: 'planner',
          prompt: 'You are a planner.',
          llmConfig: { modelId: 'openai/planner-model' },
        } as AgentConfig,
        executor: {
          agentId: 'executor',
          prompt: 'You are an executor.',
          llmConfig: { modelId: 'openai/executor-model' },
        } as AgentConfig,
      },
    };

    const factory = new PatternFactory(deps);
    const pattern = factory.create(config);

    const gen = pattern.run([{ type: 'text', text: 'do something' }], {
      eventPublisher: vi.fn(),
      historyMessages: [
        { role: 'user', content: 'previous question' },
        { role: 'assistant', content: 'previous answer' },
      ],
    });

    while (true) {
      const { done } = await gen.next();
      if (done) break;
    }

    const msgs = receivedMessages[0];
    expect(msgs.some((m) => m.isUser() && m.content === 'previous question')).toBe(true);
    expect(msgs.some((m) => m.isAssistant() && m.content === 'previous answer')).toBe(true);
  });
});

describe('TaskGraph', () => {
  it('should add tasks and track status', () => {
    const graph = new TaskGraph();
    graph.addTasks([
      { id: 't1', description: 'task 1', dependencies: [] },
      { id: 't2', description: 'task 2', dependencies: ['t1'] },
    ]);

    const summary = graph.getSummary();
    expect(summary.total).toBe(2);
    expect(summary.pending).toBe(2);
    expect(summary.completed).toBe(0);
  });

  it('should return ready tasks based on dependency completion', () => {
    const graph = new TaskGraph();
    graph.addTasks([
      { id: 't1', description: 'task 1', dependencies: [] },
      { id: 't2', description: 'task 2', dependencies: ['t1'] },
      { id: 't3', description: 'task 3', dependencies: [] },
    ]);

    let ready = graph.getReadyTasks();
    expect(ready.map((t) => t.id).sort()).toEqual(['t1', 't3']);

    graph.markRunning('t1');
    graph.markCompleted('t1', 'result 1');

    ready = graph.getReadyTasks();
    expect(ready.map((t) => t.id).sort()).toEqual(['t2', 't3']);
  });

  it('should detect circular dependencies', () => {
    const graph = new TaskGraph();
    graph.addTasks([
      { id: 't1', description: 'task 1', dependencies: ['t2'] },
      { id: 't2', description: 'task 2', dependencies: ['t1'] },
    ]);

    const validation = graph.validate();
    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toContain('Circular dependency');
  });

  it('should detect unknown dependency references', () => {
    const graph = new TaskGraph();
    graph.addTasks([
      { id: 't1', description: 'task 1', dependencies: ['nonexistent'] },
    ]);

    const validation = graph.validate();
    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toContain('unknown task');
  });

  it('should report dependency results', () => {
    const graph = new TaskGraph();
    graph.addTasks([
      { id: 't1', description: 'task 1', dependencies: [] },
      { id: 't2', description: 'task 2', dependencies: ['t1'] },
    ]);

    graph.markRunning('t1');
    graph.markCompleted('t1', 'result of task 1');

    const depResults = graph.getDependencyResults('t2');
    expect(depResults).toEqual([
      { id: 't1', description: 'task 1', result: 'result of task 1' },
    ]);
  });

  it('should correctly report isAllDone', () => {
    const graph = new TaskGraph();
    graph.addTasks([
      { id: 't1', description: 'task 1', dependencies: [] },
      { id: 't2', description: 'task 2', dependencies: [] },
    ]);

    expect(graph.isAllDone()).toBe(false);

    graph.markRunning('t1');
    graph.markCompleted('t1', 'done');
    expect(graph.isAllDone()).toBe(false);

    graph.markRunning('t2');
    graph.markFailed('t2', 'error');
    expect(graph.isAllDone()).toBe(true);
    expect(graph.hasFailures()).toBe(true);
  });

  it('should validate a valid DAG', () => {
    const graph = new TaskGraph();
    graph.addTasks([
      { id: 't1', description: 'task 1', dependencies: [] },
      { id: 't2', description: 'task 2', dependencies: ['t1'] },
      { id: 't3', description: 'task 3', dependencies: ['t1'] },
      { id: 't4', description: 'task 4', dependencies: ['t2', 't3'] },
    ]);

    const validation = graph.validate();
    expect(validation.valid).toBe(true);
  });

  it('should support incremental task addition', () => {
    const graph = new TaskGraph();
    graph.addTasks([
      { id: 't1', description: 'task 1', dependencies: [] },
    ]);

    graph.markRunning('t1');
    graph.markCompleted('t1', 'done');

    graph.addTasks([
      { id: 't2', description: 'task 2', dependencies: ['t1'] },
    ]);

    const validation = graph.validate();
    expect(validation.valid).toBe(true);

    const ready = graph.getReadyTasks();
    expect(ready.map((t) => t.id)).toEqual(['t2']);
  });

  it('should store executor field on tasks', () => {
    const graph = new TaskGraph();
    graph.addTasks([
      { id: 't1', description: 'task 1', dependencies: [], executor: 'coder' },
      { id: 't2', description: 'task 2', dependencies: [], executor: 'researcher' },
    ]);

    expect(graph.getTask('t1')?.executor).toBe('coder');
    expect(graph.getTask('t2')?.executor).toBe('researcher');
  });
});
