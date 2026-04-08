import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { Message, type StreamEvent, type Tool, type UserInput, type MessageRole, type MessageFactory, type ToolCall } from '@agent-orch/core';
import { MockMessage, createMockFactory } from '@agent-orch/core/testing';
import { OpenAILLM } from '../providers/openai/openai-llm.js';
import { userInputToResponseInput } from '../providers/openai/message-utils.js';
import { convertToolsToOpenAI } from '../providers/openai/tool-utils.js';
import { createLLM } from '../create-llm.js';

vi.mock('openai', () => {
  const MockOpenAI = vi.fn().mockImplementation(() => ({
    responses: {
      create: vi.fn(),
    },
  }));
  return { default: MockOpenAI };
});

function createMockStream(events: Array<{ type: string; [key: string]: unknown }>) {
  return {
    [Symbol.asyncIterator]() {
      let index = 0;
      return {
        async next() {
          if (index < events.length) {
            return { value: events[index++], done: false };
          }
          return { value: undefined, done: true };
        },
      };
    },
  };
}

describe('userInputToResponseInput', () => {
  it('should convert text input to user message', () => {
    const input: UserInput = [{ type: 'text', text: 'hello' }];
    const result = userInputToResponseInput(input);
    expect(result).toEqual({ role: 'user', content: 'hello' });
  });

  it('should convert image input to multipart content', () => {
    const input: UserInput = [
      { type: 'text', text: 'describe this' },
      { type: 'image_url', imageUrl: { url: 'https://example.com/img.png' } },
    ];
    const result = userInputToResponseInput(input);
    expect(result).toEqual({
      role: 'user',
      content: [
        { type: 'input_text', text: 'describe this' },
        { type: 'input_image', image_url: 'https://example.com/img.png', detail: 'auto' },
      ],
    });
  });
});

describe('convertToolsToOpenAI', () => {
  it('should convert tools with zod schemas', () => {
    const tools: Tool[] = [
      {
        name: 'get_weather',
        description: 'Get weather for a city',
        parameters: z.object({ city: z.string() }),
        execute: async () => ({ content: 'sunny' }),
      },
    ];
    const result = convertToolsToOpenAI(tools);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('type', 'function');
    expect(result[0]).toHaveProperty('function');
  });
});

describe('OpenAILLM', () => {
  let llm: OpenAILLM;

  beforeEach(() => {
    llm = new OpenAILLM({
      modelId: 'openai/gpt-4o',
      apiKey: 'test-key',
    });
  });

  it('should stream text response and return end reason', async () => {
    const mockStream = createMockStream([
      { type: 'response.output_text.delta', delta: 'Hello', content_index: 0, item_id: 'item_1', output_index: 0, sequence_number: 1 },
      { type: 'response.output_text.delta', delta: ' world', content_index: 0, item_id: 'item_1', output_index: 0, sequence_number: 2 },
      {
        type: 'response.completed',
        response: {
          id: 'resp_1',
          status: 'completed',
          output: [
            {
              type: 'message',
              id: 'msg_1',
              role: 'assistant',
              content: [{ type: 'output_text', text: 'Hello world' }],
            },
          ],
        },
      },
    ]);

    const client = (llm as any).client;
    client.responses.create.mockResolvedValue(mockStream);

    const gen = llm.runStream({
      messages: [] as Message[],
      userInput: [{ type: 'text', text: 'hi' }],
    });

    const events: StreamEvent[] = [];
    let result: { reason: any; messages: Message[] } | undefined;

    while (true) {
      const { value, done } = await gen.next();
      if (done) {
        result = value as any;
        break;
      }
      events.push(value);
    }

    expect(events.some((e) => e.type === 'llm:start')).toBe(true);
    expect(events.some((e) => e.type === 'llm:chunk')).toBe(true);
    expect(events.some((e) => e.type === 'llm:end')).toBe(true);
    expect(result!.reason.type).toBe('end');
    expect(result!.messages.length).toBeGreaterThan(0);
  });

  it('should detect tool calls and return tool reason', async () => {
    const mockStream = createMockStream([
      {
        type: 'response.output_item.added',
        output_index: 0,
        item: { type: 'function_call', id: 'fc_1', name: 'get_weather', call_id: 'call_1' },
      },
      {
        type: 'response.function_call_arguments.delta',
        output_index: 0,
        delta: '{"city":',
        item_id: 'fc_1',
        sequence_number: 1,
      },
      {
        type: 'response.function_call_arguments.done',
        output_index: 0,
        arguments: '{"city":"SF"}',
        item_id: 'fc_1',
        sequence_number: 2,
      },
      {
        type: 'response.completed',
        response: {
          id: 'resp_2',
          status: 'completed',
          output: [
            {
              type: 'function_call',
              id: 'fc_1',
              name: 'get_weather',
              arguments: '{"city":"SF"}',
              call_id: 'call_1',
            },
          ],
        },
      },
    ]);

    const client = (llm as any).client;
    client.responses.create.mockResolvedValue(mockStream);

    const gen = llm.runStream({
      messages: [] as Message[],
      userInput: [{ type: 'text', text: 'weather in SF' }],
      tools: [
        {
          name: 'get_weather',
          description: 'Get weather',
          parameters: z.object({ city: z.string() }),
          execute: async () => ({ content: 'sunny' }),
        },
      ],
    });

    let result: any;
    while (true) {
      const { value, done } = await gen.next();
      if (done) {
        result = value;
        break;
      }
    }

    expect(result.reason.type).toBe('tool');
  });

  it('should return error reason on incomplete response', async () => {
    const mockStream = createMockStream([
      {
        type: 'response.completed',
        response: {
          id: 'resp_3',
          status: 'incomplete',
          output: [],
        },
      },
    ]);

    const client = (llm as any).client;
    client.responses.create.mockResolvedValue(mockStream);

    const gen = llm.runStream({
      messages: [] as Message[],
      userInput: [{ type: 'text', text: 'long prompt' }],
    });

    let result: any;
    while (true) {
      const { value, done } = await gen.next();
      if (done) {
        result = value;
        break;
      }
    }

    expect(result.reason.type).toBe('error');
    expect(result.reason.msg).toBe('context_length_exceeded');
  });

  it('should handle stream errors', async () => {
    const client = (llm as any).client;
    client.responses.create.mockRejectedValue(new Error('API Error'));

    const gen = llm.runStream({
      messages: [] as Message[],
      userInput: [{ type: 'text', text: 'test' }],
    });

    let result: any;
    while (true) {
      const { value, done } = await gen.next();
      if (done) {
        result = value;
        break;
      }
    }

    expect(result.reason.type).toBe('error');
  });
});

describe('createLLM', () => {
  it('should create OpenAI LLM for openai provider', () => {
    const llm = createLLM({ modelId: 'openai/gpt-4o', apiKey: 'test' });
    expect(llm).toBeDefined();
  });

  it('should throw for unsupported provider', () => {
    expect(() => createLLM({ modelId: 'unknown/model' })).toThrow('Unsupported LLM provider');
  });
});
