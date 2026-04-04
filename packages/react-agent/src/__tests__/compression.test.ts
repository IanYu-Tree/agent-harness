import { describe, it, expect } from 'vitest';
import { Message, type MessageFactory, type MessageRole, type ToolCall, type StreamEvent, type FinishReason, type LLM } from '@agent-orch/core';
import { MockMessage, createMockFactory } from '@agent-orch/core/testing';
import { isLengthError, microcompact, compact } from '../compression.js';

describe('isLengthError', () => {
  it('should detect context_length_exceeded', () => {
    expect(isLengthError('context_length_exceeded')).toBe(true);
  });

  it('should detect max_tokens', () => {
    expect(isLengthError('max_tokens limit reached')).toBe(true);
  });

  it('should detect maximum context length', () => {
    expect(isLengthError('This model has a maximum context length of 8192')).toBe(true);
  });

  it('should return false for unrelated errors and handle undefined', () => {
    expect(isLengthError('rate limit exceeded')).toBe(false);
    expect(isLengthError('authentication failed')).toBe(false);
    expect(isLengthError(undefined)).toBe(false);
  });
});

describe('microcompact', () => {
  it('should preserve short messages', () => {
    const messages: Message[] = [
      new MockMessage({ role: 'system', content: 'You are helpful' }),
      new MockMessage({ role: 'user', content: 'Hi' }),
      new MockMessage({ role: 'assistant', content: 'Hello' }),
    ];
    const result = microcompact(messages, 3);
    expect(result).toHaveLength(3);
  });

  it('should remove old tool results when above threshold', () => {
    const messages: Message[] = [
      new MockMessage({ role: 'system', content: 'sys' }),
      new MockMessage({ role: 'user', content: 'u1' }),
      new MockMessage({ role: 'assistant', content: 'a1' }),
      new MockMessage({ role: 'tool_result', content: 'tool1', toolCallId: 'c1' }),
      new MockMessage({ role: 'user', content: 'u2' }),
      new MockMessage({ role: 'assistant', content: 'a2' }),
      new MockMessage({ role: 'tool_result', content: 'tool2', toolCallId: 'c2' }),
      new MockMessage({ role: 'user', content: 'u3' }),
      new MockMessage({ role: 'assistant', content: 'a3' }),
      new MockMessage({ role: 'user', content: 'u4' }),
      new MockMessage({ role: 'assistant', content: 'a4' }),
    ];
    const result = microcompact(messages, 2);
    expect(result.length).toBeLessThan(messages.length);

    const toolMsgs = result.filter((m) => m.isToolResult());
    expect(toolMsgs.length).toBeLessThanOrEqual(1);
  });

  it('should always keep system messages', () => {
    const messages: Message[] = [
      new MockMessage({ role: 'system', content: 'sys' }),
      new MockMessage({ role: 'user', content: 'u1' }),
      new MockMessage({ role: 'assistant', content: 'a1' }),
      new MockMessage({ role: 'tool_result', content: 'tool1', toolCallId: 'c1' }),
      new MockMessage({ role: 'user', content: 'u2' }),
      new MockMessage({ role: 'assistant', content: 'a2' }),
      new MockMessage({ role: 'user', content: 'u3' }),
      new MockMessage({ role: 'assistant', content: 'a3' }),
      new MockMessage({ role: 'user', content: 'u4' }),
      new MockMessage({ role: 'assistant', content: 'a4' }),
    ];
    const result = microcompact(messages, 2);
    const systemMsgs = result.filter((m) => m.isSystem());
    expect(systemMsgs).toHaveLength(1);
  });
});

describe('compact', () => {
  it('should use LLM to summarize conversation', async () => {
    const factory = createMockFactory();
    const llm: LLM = {
      messageFactory: factory,
      async *runStream() {
        yield { type: 'llm:chunk', timestamp: Date.now(), data: { content: 'Summary of conversation.' } } as StreamEvent;
        return {
          reason: { type: 'end' } as FinishReason,
          messages: [],
        };
      },
    };

    const messages: Message[] = [
      new MockMessage({ role: 'system', content: 'sys' }),
      new MockMessage({ role: 'user', content: 'u1' }),
      new MockMessage({ role: 'assistant', content: 'a1' }),
      new MockMessage({ role: 'user', content: 'u2' }),
      new MockMessage({ role: 'assistant', content: 'a2' }),
    ];

    const result = await compact(messages, llm, 'sys');
    expect(result.length).toBe(2);
    expect(result[0].isSystem()).toBe(true);
    expect(result[1].content).toContain('Summary of conversation.');
  });
});
