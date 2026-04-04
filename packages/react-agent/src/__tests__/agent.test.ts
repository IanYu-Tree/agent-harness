import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { Message, type MessageFactory, type MessageRole, type ToolCall, type StreamEvent, type FinishReason, type Tool, type LLM } from '@agent-orch/core';
import { MockMessage, createMockFactory } from '@agent-orch/core/testing';
import { Agent } from '../agent.js';
import type { ConfirmationEvent, ConfirmationResult } from '../confirmation.js';

type AgentEvent = StreamEvent | ConfirmationEvent;

function createMockLLM(
  factory: MessageFactory,
  responses: Array<{ events: StreamEvent[]; reason: FinishReason; messages?: Message[] }>,
): LLM {
  let callIndex = 0;
  return {
    messageFactory: factory,
    async *runStream(params) {
      const response = responses[callIndex] ?? responses[responses.length - 1];
      callIndex++;
      for (const event of response.events) {
        yield event;
      }
      return {
        reason: response.reason,
        messages: response.messages ?? [...params.messages],
      };
    },
  };
}

const defaultConfig = {
  agentId: 'test-agent',
  prompt: 'You are a test agent.',
  llmConfig: { modelId: 'openai/gpt-4o', apiKey: 'test' },
};

describe('Agent', () => {
  it('should complete a simple conversation', async () => {
    const factory = createMockFactory();
    const llm = createMockLLM(factory, [
      {
        events: [
          { type: 'llm:chunk', timestamp: Date.now(), data: { content: 'Hello!' } },
        ],
        reason: { type: 'end' },
        messages: [
          new MockMessage({ role: 'system', content: 'You are a test agent.' }),
          new MockMessage({ role: 'user', content: 'hi' }),
          new MockMessage({ role: 'assistant', content: 'Hello!' }),
        ],
      },
    ]);

    const agent = new Agent({ llm, config: defaultConfig });
    const gen = agent.runStream([{ type: 'text', text: 'hi' }]);

    const events: AgentEvent[] = [];
    let result: any;

    while (true) {
      const { value, done } = await gen.next();
      if (done) {
        result = value;
        break;
      }
      events.push(value);
    }

    expect(result.reason.type).toBe('end');
    expect(events.some((e) => e.type === 'agent:start')).toBe(true);
    expect(events.some((e) => e.type === 'llm:chunk')).toBe(true);
    expect(events.some((e) => e.type === 'agent:end')).toBe(true);
  });

  it('should execute tools and continue loop', async () => {
    const factory = createMockFactory();
    const toolFn = vi.fn().mockResolvedValue({ content: '42' });
    const tools: Tool[] = [
      {
        name: 'test_tool',
        description: 'Test tool',
        parameters: z.object({}),
        execute: toolFn,
      },
    ];

    const llm = createMockLLM(factory, [
      {
        events: [],
        reason: { type: 'tool' },
        messages: [
          new MockMessage({ role: 'system', content: 'sys' }),
          new MockMessage({ role: 'tool_call', content: '', toolCalls: [{ id: 'call_1', name: 'test_tool', arguments: '{}' }] }),
        ],
      },
      {
        events: [],
        reason: { type: 'end' },
        messages: [
          new MockMessage({ role: 'system', content: 'sys' }),
          new MockMessage({ role: 'tool_call', content: '', toolCalls: [{ id: 'call_1', name: 'test_tool', arguments: '{}' }] }),
          new MockMessage({ role: 'tool_result', content: '42', toolCallId: 'call_1' }),
          new MockMessage({ role: 'assistant', content: 'The answer is 42' }),
        ],
      },
    ]);

    const agent = new Agent({ llm, config: { ...defaultConfig, tools } });
    const gen = agent.runStream([{ type: 'text', text: 'run test_tool' }]);

    const events: AgentEvent[] = [];
    let result: any;

    while (true) {
      const { value, done } = await gen.next();
      if (done) {
        result = value;
        break;
      }
      events.push(value);
    }

    expect(result.reason.type).toBe('end');
    expect(events.some((e) => e.type === 'tool:start')).toBe(true);
    expect(events.some((e) => e.type === 'tool:end')).toBe(true);
    expect(toolFn).toHaveBeenCalled();
  });

  it('should respect maxTurns limit', async () => {
    const factory = createMockFactory();
    const llm = createMockLLM(factory, [
      {
        events: [],
        reason: { type: 'tool' },
        messages: [
          new MockMessage({ role: 'system', content: 'sys' }),
          new MockMessage({ role: 'tool_call', content: '', toolCalls: [{ id: 'call_1', name: 'noop', arguments: '{}' }] }),
        ],
      },
    ]);

    const agent = new Agent({
      llm,
      config: {
        ...defaultConfig,
        maxTurns: 2,
        tools: [
          {
            name: 'noop',
            description: 'No-op',
            parameters: z.object({}),
            execute: async () => ({ content: 'ok' }),
          },
        ],
      },
    });

    const gen = agent.runStream([{ type: 'text', text: 'loop' }]);
    let result: any;

    while (true) {
      const { value, done } = await gen.next();
      if (done) {
        result = value;
        break;
      }
    }

    expect(result.reason.msg).toBe('max_turns_reached');
  });

  it('should call lifecycle hooks', async () => {
    const factory = createMockFactory();
    const beforeLLM = vi.fn();
    const afterLLM = vi.fn();

    const llm = createMockLLM(factory, [
      {
        events: [],
        reason: { type: 'end' },
        messages: [
          new MockMessage({ role: 'system', content: 'sys' }),
          new MockMessage({ role: 'assistant', content: 'ok' }),
        ],
      },
    ]);

    const agent = new Agent({
      llm,
      config: {
        ...defaultConfig,
        hooks: [{ beforeLLM, afterLLM }],
      },
    });

    const gen = agent.runStream([{ type: 'text', text: 'test' }]);
    while (true) {
      const { done } = await gen.next();
      if (done) break;
    }

    expect(beforeLLM).toHaveBeenCalledTimes(1);
    expect(afterLLM).toHaveBeenCalledTimes(1);
  });

  it('should handle tool not found gracefully', async () => {
    const factory = createMockFactory();
    const llm = createMockLLM(factory, [
      {
        events: [],
        reason: { type: 'tool' },
        messages: [
          new MockMessage({ role: 'system', content: 'sys' }),
          new MockMessage({ role: 'tool_call', content: '', toolCalls: [{ id: 'call_1', name: 'nonexistent', arguments: '{}' }] }),
        ],
      },
      {
        events: [],
        reason: { type: 'end' },
        messages: [
          new MockMessage({ role: 'system', content: 'sys' }),
          new MockMessage({ role: 'assistant', content: 'ok' }),
        ],
      },
    ]);

    const agent = new Agent({ llm, config: defaultConfig });
    const gen = agent.runStream([{ type: 'text', text: 'test' }]);

    const events: AgentEvent[] = [];
    while (true) {
      const { value, done } = await gen.next();
      if (done) break;
      events.push(value);
    }

    const toolEnd = events.find((e) => e.type === 'tool:end');
    expect(toolEnd).toBeDefined();
    expect((toolEnd!.data as any).result.isError).toBe(true);
  });

  it('should work normally when tool does not call wait', async () => {
    const factory = createMockFactory();
    const toolFn = vi.fn().mockResolvedValue({ content: 'done' });
    const tools: Tool[] = [
      {
        name: 'simple_tool',
        description: 'Simple tool',
        parameters: z.object({}),
        execute: toolFn,
      },
    ];

    const llm = createMockLLM(factory, [
      {
        events: [],
        reason: { type: 'tool' },
        messages: [
          new MockMessage({ role: 'system', content: 'sys' }),
          new MockMessage({ role: 'tool_call', content: '', toolCalls: [{ id: 'call_1', name: 'simple_tool', arguments: '{}' }] }),
        ],
      },
      {
        events: [],
        reason: { type: 'end' },
        messages: [
          new MockMessage({ role: 'system', content: 'sys' }),
          new MockMessage({ role: 'assistant', content: 'ok' }),
        ],
      },
    ]);

    const agent = new Agent({ llm, config: { ...defaultConfig, tools } });
    const gen = agent.runStream([{ type: 'text', text: 'test' }]);

    const events: AgentEvent[] = [];
    let result: any;

    while (true) {
      const { value, done } = await gen.next();
      if (done) {
        result = value;
        break;
      }
      events.push(value);
    }

    expect(result.reason.type).toBe('end');
    expect(events.some((e) => e.type === 'tool:start')).toBe(true);
    expect(events.some((e) => e.type === 'tool:end')).toBe(true);
    expect(events.every((e) => e.type !== 'tool:confirmation')).toBe(true);
    expect(toolFn).toHaveBeenCalled();
  });

  it('should yield tool:confirmation when tool calls wait and resume on resolve', async () => {
    const factory = createMockFactory();
    let capturedResult: ConfirmationResult | undefined;

    const tools: Tool[] = [
      {
        name: 'confirm_tool',
        description: 'Tool that requires confirmation',
        parameters: z.object({}),
        execute: async (_params, context) => {
          const wait = context.ctx.wait as (data?: unknown) => Promise<ConfirmationResult>;
          const confirmation = await wait({ action: 'delete file' });
          capturedResult = confirmation;
          if (confirmation.approved) {
            return { content: 'confirmed and executed' };
          }
          return { content: 'rejected by user' };
        },
      },
    ];

    const llm = createMockLLM(factory, [
      {
        events: [],
        reason: { type: 'tool' },
        messages: [
          new MockMessage({ role: 'system', content: 'sys' }),
          new MockMessage({ role: 'tool_call', content: '', toolCalls: [{ id: 'call_1', name: 'confirm_tool', arguments: '{}' }] }),
        ],
      },
      {
        events: [],
        reason: { type: 'end' },
        messages: [
          new MockMessage({ role: 'system', content: 'sys' }),
          new MockMessage({ role: 'assistant', content: 'done' }),
        ],
      },
    ]);

    const agent = new Agent({ llm, config: { ...defaultConfig, tools } });
    const gen = agent.runStream([{ type: 'text', text: 'do something' }]);

    const events: AgentEvent[] = [];

    let confirmationReceived = false;
    while (true) {
      const { value, done } = await gen.next();
      if (done) break;
      events.push(value);

      if (value.type === 'tool:confirmation') {
        confirmationReceived = true;
        const confirmEvent = value as ConfirmationEvent;
        expect(confirmEvent.data.request.toolName).toBe('confirm_tool');
        expect(confirmEvent.data.request.data).toEqual({ action: 'delete file' });
        agent.resolve({ approved: true, feedback: 'go ahead' });
      }
    }

    expect(confirmationReceived).toBe(true);
    expect(capturedResult).toEqual({ approved: true, feedback: 'go ahead' });

    const toolEnd = events.find((e) => e.type === 'tool:end');
    expect(toolEnd).toBeDefined();
    expect((toolEnd!.data as any).result.content).toBe('confirmed and executed');
  });

  it('should pass rejection to tool when resolve with approved=false', async () => {
    const factory = createMockFactory();
    let capturedResult: ConfirmationResult | undefined;

    const tools: Tool[] = [
      {
        name: 'confirm_tool',
        description: 'Tool that requires confirmation',
        parameters: z.object({}),
        execute: async (_params, context) => {
          const wait = context.ctx.wait as (data?: unknown) => Promise<ConfirmationResult>;
          const confirmation = await wait();
          capturedResult = confirmation;
          if (!confirmation.approved) {
            return { content: `rejected: ${confirmation.feedback}`, isError: true };
          }
          return { content: 'ok' };
        },
      },
    ];

    const llm = createMockLLM(factory, [
      {
        events: [],
        reason: { type: 'tool' },
        messages: [
          new MockMessage({ role: 'system', content: 'sys' }),
          new MockMessage({ role: 'tool_call', content: '', toolCalls: [{ id: 'call_1', name: 'confirm_tool', arguments: '{}' }] }),
        ],
      },
      {
        events: [],
        reason: { type: 'end' },
        messages: [
          new MockMessage({ role: 'system', content: 'sys' }),
          new MockMessage({ role: 'assistant', content: 'ok' }),
        ],
      },
    ]);

    const agent = new Agent({ llm, config: { ...defaultConfig, tools } });
    const gen = agent.runStream([{ type: 'text', text: 'test' }]);

    const events: AgentEvent[] = [];

    while (true) {
      const { value, done } = await gen.next();
      if (done) break;
      events.push(value);

      if (value.type === 'tool:confirmation') {
        agent.resolve({ approved: false, feedback: 'not allowed' });
      }
    }

    expect(capturedResult).toEqual({ approved: false, feedback: 'not allowed' });

    const toolEnd = events.find((e) => e.type === 'tool:end');
    expect(toolEnd).toBeDefined();
    expect((toolEnd!.data as any).result.content).toBe('rejected: not allowed');
    expect((toolEnd!.data as any).result.isError).toBe(true);
  });

  it('should throw when resolve is called without pending confirmation', () => {
    const factory = createMockFactory();
    const llm = createMockLLM(factory, []);
    const agent = new Agent({ llm, config: defaultConfig });

    expect(() => agent.resolve({ approved: true })).toThrow('No pending confirmation to resolve');
  });

  it('should stop immediately when interrupt is called via afterToolExecution hook', async () => {
    const factory = createMockFactory();
    let llmCallCount = 0;

    const llm: LLM = {
      messageFactory: factory,
      async *runStream(params) {
        llmCallCount++;
        if (llmCallCount === 1) {
          return {
            reason: { type: 'tool' } as FinishReason,
            messages: [
              ...params.messages,
              new MockMessage({
                role: 'tool_call',
                content: '',
                toolCalls: [{ id: 'call_1', name: 'my_tool', arguments: '{}' }],
              }),
            ],
          };
        }
        return {
          reason: { type: 'end' } as FinishReason,
          messages: [...params.messages],
        };
      },
    };

    const tools: Tool[] = [
      {
        name: 'my_tool',
        description: 'Test tool',
        parameters: z.object({}),
        execute: async () => ({ content: 'done' }),
      },
    ];

    const agent = new Agent({
      llm,
      config: {
        ...defaultConfig,
        tools,
        hooks: [{
          afterToolExecution: async (agentIns) => {
            agentIns.interrupt();
          },
        }],
      },
    });

    const gen = agent.runStream([{ type: 'text', text: 'test' }]);
    let result: any;

    while (true) {
      const { value, done } = await gen.next();
      if (done) {
        result = value;
        break;
      }
    }

    expect(llmCallCount).toBe(1);
    expect(result.reason.type).toBe('end');
    expect(result.reason.msg).toBe('interrupted');
  });
});
