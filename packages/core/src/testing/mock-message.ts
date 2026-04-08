import { Message, type MessageRole, type MessageFactory, type ToolCall } from '../types/index.js';

export class MockMessage extends Message {
  private _role: MessageRole;
  private _content: string;
  private _raw: unknown;
  private _toolCalls: ToolCall[];
  private _toolCallId?: string;

  constructor(params: { role: MessageRole; content: string; raw?: unknown; toolCalls?: ToolCall[]; toolCallId?: string }) {
    super();
    this._role = params.role;
    this._content = params.content;
    this._raw = params.raw ?? null;
    this._toolCalls = params.toolCalls ?? [];
    this._toolCallId = params.toolCallId;
  }

  get role() { return this._role; }
  get content() { return this._content; }
  getToolCalls() { return this._toolCalls; }
  getToolCallId() { return this._toolCallId; }
  toRaw() { return this._raw; }
}

export function createMockFactory(): MessageFactory {
  return {
    system: (content) => new MockMessage({ role: 'system', content }),
    user: (content) => new MockMessage({ role: 'user', content }),
    assistant: (content) => new MockMessage({ role: 'assistant', content }),
    toolCall: (toolCalls, raw) => new MockMessage({ role: 'tool_call', content: '', toolCalls, raw }),
    toolResult: (toolCallId, content) => new MockMessage({ role: 'tool_result', content, toolCallId }),
  };
}
