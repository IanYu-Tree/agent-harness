import { describe, it, expect, vi } from 'vitest';
import { type StreamEvent, type FinishReason, type AgentConfig, type OrchConfig, type LLM } from '@agent-orch/core';
import { MockMessage, createMockFactory } from '@agent-orch/core/testing';
import type { PatternDeps } from '../types.js';
import { PatternFactory } from '../factory/pattern-factory.js';
import { SingleAgentPattern } from '../patterns/single-agent/single-agent-pattern.js';
import { PlannerExecutorPattern } from '../patterns/planner-executor/planner-executor-pattern.js';
import { ReflextionPattern } from '../patterns/reflextion/reflextion-pattern.js';

function createMockDeps(): PatternDeps {
  return {
    createLLM: vi.fn().mockReturnValue({
      messageFactory: createMockFactory(),
      async *runStream(params: any) {
        yield { type: 'llm:chunk', timestamp: Date.now(), data: { content: 'ok' } } as StreamEvent;
        return {
          reason: { type: 'end' } as FinishReason,
          messages: [...params.messages],
        };
      },
    } as LLM),
  };
}

describe('PatternFactory', () => {
  it('should create SingleAgentPattern', () => {
    const deps = createMockDeps();
    const factory = new PatternFactory(deps);
    const config: OrchConfig = {
      id: 'sa-1',
      type: 'singleAgent',
      agents: {
        agent: {
          agentId: 'agent-1',
          prompt: 'test',
          llmConfig: { modelId: 'openai/gpt-4o' },
        } as AgentConfig,
      },
    };

    const runner = factory.create(config);
    expect(runner).toBeInstanceOf(SingleAgentPattern);
    expect(runner.id).toBe('sa-1');
  });

  it('should create PlannerExecutorPattern', () => {
    const deps = createMockDeps();
    const factory = new PatternFactory(deps);
    const config: OrchConfig = {
      id: 'pe-1',
      type: 'plannerExecutor',
      agents: {
        planner: { agentId: 'planner', prompt: 'plan', llmConfig: { modelId: 'openai/gpt-4o' } } as AgentConfig,
        executor: { agentId: 'executor', prompt: 'exec', llmConfig: { modelId: 'openai/gpt-4o' } } as AgentConfig,
      },
    };

    const runner = factory.create(config);
    expect(runner).toBeInstanceOf(PlannerExecutorPattern);
  });

  it('should create ReflextionPattern', () => {
    const deps = createMockDeps();
    const factory = new PatternFactory(deps);
    const config: OrchConfig = {
      id: 'ref-1',
      type: 'reflextion',
      agents: {
        executor: { agentId: 'executor', prompt: 'exec', llmConfig: { modelId: 'openai/gpt-4o' } } as AgentConfig,
        critic: { agentId: 'critic', prompt: 'critique', llmConfig: { modelId: 'openai/gpt-4o' } } as AgentConfig,
      },
    };

    const runner = factory.create(config);
    expect(runner).toBeInstanceOf(ReflextionPattern);
  });

  it('should throw for unsupported pattern type', () => {
    const deps = createMockDeps();
    const factory = new PatternFactory(deps);
    const config = {
      id: 'unknown-1',
      type: 'unknown' as any,
      agents: {},
    };

    expect(() => factory.create(config)).toThrow('Unsupported pattern type');
  });

  it('should resolve nested OrchConfig via resolveAgent', () => {
    const deps = createMockDeps();
    const factory = new PatternFactory(deps);

    const agentConfig: AgentConfig = {
      agentId: 'a1',
      prompt: 'test',
      llmConfig: { modelId: 'openai/gpt-4o' },
    };

    const orchConfig: OrchConfig = {
      id: 'nested-1',
      type: 'singleAgent',
      agents: { agent: agentConfig },
    };

    const resolved1 = factory.resolveAgent(agentConfig);
    expect(resolved1).toBe(agentConfig);

    const resolved2 = factory.resolveAgent(orchConfig);
    expect(resolved2).toBeInstanceOf(SingleAgentPattern);
  });
});
