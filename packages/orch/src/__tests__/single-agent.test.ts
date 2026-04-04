import { describe, it, expect, vi } from 'vitest';
import { type StreamEvent, type FinishReason, type AgentConfig, type LLM } from '@agent-orch/core';
import { MockMessage, createMockFactory } from '@agent-orch/core/testing';
import type { PatternDeps } from '../types.js';
import { SingleAgentPattern } from '../patterns/single-agent/single-agent-pattern.js';

function createMockLLM(): LLM {
  return {
    messageFactory: createMockFactory(),
    async *runStream(params) {
      yield { type: 'llm:chunk', timestamp: Date.now(), data: { content: 'Hello' } } as StreamEvent;
      return {
        reason: { type: 'end' } as FinishReason,
        messages: [...params.messages],
      };
    },
  };
}

function createMockDeps(): PatternDeps {
  return {
    createLLM: vi.fn().mockReturnValue(createMockLLM()),
  };
}

const agentConfig: AgentConfig = {
  agentId: 'test-single',
  prompt: 'You are a test agent.',
  llmConfig: { modelId: 'openai/gpt-4o', apiKey: 'test' },
};

describe('SingleAgentPattern', () => {
  it('should run agent and yield pattern events', async () => {
    const deps = createMockDeps();
    const pattern = new SingleAgentPattern('pattern-1', agentConfig, deps);

    const gen = pattern.run([{ type: 'text', text: 'hello' }], {
      eventPublisher: vi.fn(),
    });

    const events: StreamEvent[] = [];
    let result: any;

    while (true) {
      const { value, done } = await gen.next();
      if (done) {
        result = value;
        break;
      }
      events.push(value);
    }

    expect(events.some((e) => e.type === 'pattern:start')).toBe(true);
    expect(events.some((e) => e.type === 'pattern:end')).toBe(true);
    expect(result.reason.type).toBe('end');
    expect(deps.createLLM).toHaveBeenCalled();
  });
});
