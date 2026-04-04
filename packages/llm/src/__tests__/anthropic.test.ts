import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { Message, type StreamEvent, type Tool, type UserInput, type MessageRole, type MessageFactory, type ToolCall } from '@agent-orch/core';
import { AnthropicLLM } from '../providers/anthropic/anthropic-llm.js';
import { userInputToMessageParam } from '../providers/anthropic/message-utils.js';
import { convertToolsToAnthropic } from '../providers/anthropic/tool-utils.js';
import { createLLM } from '../create-llm.js';

vi.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = vi.fn().mockImplementation(() => ({
    messages: {
      stream: vi.fn(),
    },
  }));
  return { default: MockAnthropic };
});

function createMockStream(events: Array<{ type: string; [key: string]: unknown }>) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const event of events) {
        yield event;
      }
    },
    async finalMessage() {
      // Find the last message_stop event or return a default message
      const stopEvent = events.find(e => e.type === 'message_stop');
      return {
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello world', citations: null }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 5, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
        model: 'claude-3-5-sonnet-20241022',
      };
    },
  };
}

describe('userInputToMessageParam', () => {
  it('should convert text input to user message', () => {
    const input: UserInput = [{ type: 'text', text: 'hello' }];
    const result = userInputToMessageParam(input);
    expect(result).toEqual({ role: 'user', content: 'hello' });
  });

  it('should convert image input to multipart content', () => {
    const input: UserInput = [
      { type: 'text', text: 'describe this' },
      { type: 'image_url', imageUrl: { url: 'https://example.com/img.png' } },
    ];
    const result = userInputToMessageParam(input);
    expect(result).toEqual({
      role: 'user',
      content: [
        { type: 'text', text: 'describe this' },
        { type: 'image', source: { type: 'url', url: 'https://example.com/img.png' } },
      ],
    });
  });
});

describe('convertToolsToAnthropic', () => {
  it('should convert tools with zod schemas', () => {
    const tools: Tool[] = [
      {
        name: 'get_weather',
        description: 'Get weather for a city',
        parameters: z.object({ city: z.string() }),
        execute: async () => ({ content: 'sunny' }),
      },
    ];
    const result = convertToolsToAnthropic(tools);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('name', 'get_weather');
    expect(result[0]).toHaveProperty('description', 'Get weather for a city');
    expect(result[0]).toHaveProperty('input_schema');
    expect(result[0].input_schema).toHaveProperty('type', 'object');
  });
});

describe('AnthropicLLM', () => {
  let llm: AnthropicLLM;

  beforeEach(() => {
    llm = new AnthropicLLM({
      modelId: 'anthropic/claude-3-5-sonnet-20241022',
      apiKey: 'test-key',
    });
  });

  it('should stream text response and return end reason', async () => {
    const mockStream = createMockStream([
      { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '', citations: null } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hello' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: ' world' } },
      { type: 'content_block_stop', index: 0 },
      { type: 'message_stop' },
    ]);

    const client = (llm as any).client;
    client.messages.stream.mockReturnValue(mockStream);

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
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'tool_use', id: 'toolu_123', name: 'get_weather', input: {} },
      },
      { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"city":' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '"SF"}' } },
      { type: 'content_block_stop', index: 0 },
      { type: 'message_stop' },
    ]);

    // Override finalMessage to return a message with tool_use
    mockStream.finalMessage = async () => ({
      id: 'msg_2',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'tool_use', id: 'toolu_123', name: 'get_weather', input: { city: 'SF' } }] as unknown as [{ type: 'text'; text: string; citations: null }],
      stop_reason: 'tool_use',
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 20, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      model: 'claude-3-5-sonnet-20241022',
    });

    const client = (llm as any).client;
    client.messages.stream.mockReturnValue(mockStream);

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

  it('should return error reason on max_tokens', async () => {
    const mockStream = createMockStream([
      { type: 'message_stop' },
    ]);

    mockStream.finalMessage = async () => ({
      id: 'msg_3',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: '', citations: null }],
      stop_reason: 'max_tokens',
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 4096, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      model: 'claude-3-5-sonnet-20241022',
    });

    const client = (llm as any).client;
    client.messages.stream.mockReturnValue(mockStream);

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
    expect(result.reason.msg).toBe('max_tokens_reached');
  });

  it('should handle stream errors', async () => {
    const client = (llm as any).client;
    client.messages.stream.mockImplementation(() => {
      throw new Error('API Error');
    });

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

  it('should stream thinking/reasoning content', async () => {
    const mockStream = createMockStream([
      { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: 'Let me' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: ' think about this...' } },
      { type: 'content_block_stop', index: 0 },
      { type: 'content_block_start', index: 1, content_block: { type: 'text', text: '', citations: null } },
      { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'Final answer' } },
      { type: 'content_block_stop', index: 1 },
      { type: 'message_stop' },
    ]);

    const client = (llm as any).client;
    client.messages.stream.mockReturnValue(mockStream);

    const gen = llm.runStream({
      messages: [] as Message[],
      userInput: [{ type: 'text', text: 'solve this problem' }],
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

    const reasoningEvents = events.filter((e) => e.type === 'llm:reasoning');
    expect(reasoningEvents).toHaveLength(2);
    expect(reasoningEvents[0]).toMatchObject({
      type: 'llm:reasoning',
      data: { content: 'Let me' },
    });
    expect(reasoningEvents[1]).toMatchObject({
      type: 'llm:reasoning',
      data: { content: ' think about this...' },
    });

    const chunkEvents = events.filter((e) => e.type === 'llm:chunk');
    expect(chunkEvents).toHaveLength(1);
    expect(chunkEvents[0]).toMatchObject({
      type: 'llm:chunk',
      data: { content: 'Final answer' },
    });
  });
});

describe('createLLM with anthropic', () => {
  it('should create Anthropic LLM for anthropic provider', () => {
    const llm = createLLM({ modelId: 'anthropic/claude-3-5-sonnet-20241022', apiKey: 'test' });
    expect(llm).toBeDefined();
    expect(llm.constructor.name).toBe('AnthropicLLM');
  });
});
