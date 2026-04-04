import { describe, it, expect, vi } from 'vitest';
import { type StreamEvent, type FinishReason, type AgentConfig, type OrchConfig, type LLM, type Message } from '@agent-orch/core';
import { MockMessage, createMockFactory } from '@agent-orch/core/testing';
import type { PatternDeps } from '../types.js';
import { PatternFactory } from '../factory/pattern-factory.js';

function createMockExecutorLLM(): LLM {
  return {
    messageFactory: createMockFactory(),
    async *runStream(params) {
      yield { type: 'llm:chunk', timestamp: Date.now(), data: { content: 'Here is my output' } } as StreamEvent;
      return {
        reason: { type: 'end' } as FinishReason,
        messages: [...params.messages],
      };
    },
  };
}

function createMockCriticLLM(passOnRound: number): { llm: LLM; getLLMCallCount: () => number } {
  let roundCount = 0;
  let llmCallCount = 0;
  return {
    getLLMCallCount: () => llmCallCount,
    llm: {
      messageFactory: createMockFactory(),
      async *runStream(params) {
        llmCallCount++;
        const isToolResultFollowUp = params.messages.some((m) => m.isToolResult());
        if (isToolResultFollowUp) {
          yield { type: 'llm:chunk', timestamp: Date.now(), data: { content: 'Done reviewing.' } } as StreamEvent;
          return {
            reason: { type: 'end' } as FinishReason,
            messages: [...params.messages],
          };
        }

        roundCount++;
        const passed = roundCount >= passOnRound;
        yield { type: 'llm:chunk', timestamp: Date.now(), data: { content: 'Reviewing...' } } as StreamEvent;
        return {
          reason: { type: 'tool' } as FinishReason,
          messages: [
            ...params.messages,
            new MockMessage({
              role: 'tool_call',
              content: '',
              toolCalls: [{ id: `fc_${roundCount}`, name: 'set_feedback', arguments: JSON.stringify({ feedback: passed ? 'Looks good!' : 'Needs improvement', passed }) }],
            }),
          ],
        };
      },
    },
  };
}

function createTestConfig(): OrchConfig {
  return {
    id: 'ref-1',
    type: 'reflextion',
    agents: {
      executor: {
        agentId: 'executor',
        prompt: 'You are an executor.',
        llmConfig: { modelId: 'openai/executor-model' },
      } as AgentConfig,
      critic: {
        agentId: 'critic',
        prompt: 'You are a critic.',
        llmConfig: { modelId: 'openai/critic-model' },
      } as AgentConfig,
    },
    options: { maxRounds: 3 },
  };
}

async function runPattern(pattern: ReturnType<PatternFactory['create']>) {
  const gen = pattern.run([{ type: 'text', text: 'write code' }], {
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

describe('ReflextionPattern', () => {
  it('should run reflextion loop and pass', async () => {
    const executorLLM = createMockExecutorLLM();
    const { llm: criticLLM } = createMockCriticLLM(1);

    const deps: PatternDeps = {
      createLLM: vi.fn().mockImplementation((config) => {
        if (config.modelId.includes('executor')) return executorLLM;
        return criticLLM;
      }),
    };

    const config = createTestConfig();
    const factory = new PatternFactory(deps);
    const pattern = factory.create(config);

    const { events, result } = await runPattern(pattern);

    expect(events.some((e) => e.type === 'pattern:start')).toBe(true);
    expect(events.some((e) => e.type === 'pattern:end')).toBe(true);
    expect(result.reason.type).toBe('end');
  });

  it('should interrupt critic early when set_feedback(passed=true)', async () => {
    const executorLLM = createMockExecutorLLM();
    const { llm: criticLLM, getLLMCallCount } = createMockCriticLLM(1);

    const createLLMSpy = vi.fn().mockImplementation((config) => {
      if (config.modelId.includes('executor')) return executorLLM;
      return criticLLM;
    });

    const deps: PatternDeps = {
      createLLM: createLLMSpy,
    };

    const config = createTestConfig();
    const factory = new PatternFactory(deps);
    const pattern = factory.create(config);

    const { events, result } = await runPattern(pattern);

    expect(result.reason.type).toBe('end');

    const criticLLMCallCount = getLLMCallCount();
    expect(criticLLMCallCount).toBeLessThanOrEqual(1);
  });

  it('should not interrupt critic when set_feedback(passed=false)', async () => {
    const executorLLM = createMockExecutorLLM();
    const { llm: criticLLM, getLLMCallCount } = createMockCriticLLM(2);

    const deps: PatternDeps = {
      createLLM: vi.fn().mockImplementation((config) => {
        if (config.modelId.includes('executor')) return executorLLM;
        return criticLLM;
      }),
    };

    const config = createTestConfig();
    const factory = new PatternFactory(deps);
    const pattern = factory.create(config);

    const { result } = await runPattern(pattern);

    expect(result.reason.type).toBe('end');
    expect(getLLMCallCount()).toBeGreaterThan(2);
  });

  it('should load history messages into executor on first round', async () => {
    const receivedMessages: Message[][] = [];

    const executorLLM: LLM = {
      messageFactory: createMockFactory(),
      async *runStream(params) {
        receivedMessages.push([...params.messages]);
        yield { type: 'llm:chunk', timestamp: Date.now(), data: { content: 'Here is my output' } } as StreamEvent;
        return {
          reason: { type: 'end' } as FinishReason,
          messages: [...params.messages],
        };
      },
    };

    const { llm: criticLLM } = createMockCriticLLM(1);

    const deps: PatternDeps = {
      createLLM: vi.fn().mockImplementation((config) => {
        if (config.modelId.includes('executor')) return executorLLM;
        return criticLLM;
      }),
    };

    const config = createTestConfig();
    const factory = new PatternFactory(deps);
    const pattern = factory.create(config);

    const gen = pattern.run([{ type: 'text', text: 'write code' }], {
      eventPublisher: vi.fn(),
      historyMessages: [
        { role: 'user', content: 'earlier request' },
        { role: 'assistant', content: 'earlier response' },
      ],
    });

    while (true) {
      const { done } = await gen.next();
      if (done) break;
    }

    const msgs = receivedMessages[0];
    expect(msgs.some((m) => m.isUser() && m.content === 'earlier request')).toBe(true);
    expect(msgs.some((m) => m.isAssistant() && m.content === 'earlier response')).toBe(true);
  });
});
