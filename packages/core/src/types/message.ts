import type { ToolCall } from './tool.js';

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool_call' | 'tool_result';

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export abstract class Message {
  abstract get role(): MessageRole;
  abstract get content(): string;

  isSystem(): boolean { return this.role === 'system'; }
  isUser(): boolean { return this.role === 'user'; }
  isAssistant(): boolean { return this.role === 'assistant'; }
  isToolCall(): boolean { return this.role === 'tool_call'; }
  isToolResult(): boolean { return this.role === 'tool_result'; }

  getToolCalls(): ToolCall[] { return []; }
  getToolCallId(): string | undefined { return undefined; }

  abstract toRaw(): unknown;
}

export interface MessageFactory {
  system(content: string): Message;
  user(content: string): Message;
  assistant(content: string): Message;
  toolCall(toolCalls: ToolCall[], raw?: unknown): Message;
  toolResult(toolCallId: string, content: string): Message;
}
