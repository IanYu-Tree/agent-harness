import type OpenAI from 'openai';
import { Message, type MessageRole, type ToolCall, type MessageFactory } from '@agent-orch/core';

type ResponseInputItem = OpenAI.Responses.ResponseInputItem;

export class OpenAIMessage extends Message {
  private _role: MessageRole;
  private _content: string;
  private _raw: ResponseInputItem;
  private _toolCalls?: ToolCall[];
  private _toolCallId?: string;

  constructor(params: {
    role: MessageRole;
    content: string;
    raw: ResponseInputItem;
    toolCalls?: ToolCall[];
    toolCallId?: string;
  }) {
    super();
    this._role = params.role;
    this._content = params.content;
    this._raw = params.raw;
    this._toolCalls = params.toolCalls;
    this._toolCallId = params.toolCallId;
  }

  get role(): MessageRole { return this._role; }
  get content(): string { return this._content; }

  getToolCalls(): ToolCall[] { return this._toolCalls ?? []; }
  getToolCallId(): string | undefined { return this._toolCallId; }

  toRaw(): ResponseInputItem { return this._raw; }
}

export class OpenAIMessageFactory implements MessageFactory {
  system(content: string): Message {
    return new OpenAIMessage({
      role: 'system',
      content,
      raw: { role: 'system', content },
    });
  }

  user(content: string): Message {
    return new OpenAIMessage({
      role: 'user',
      content,
      raw: { role: 'user', content },
    });
  }

  assistant(content: string): Message {
    return new OpenAIMessage({
      role: 'assistant',
      content,
      raw: { role: 'assistant', content },
    });
  }

  toolCall(toolCalls: ToolCall[], raw?: unknown): Message {
    return new OpenAIMessage({
      role: 'tool_call',
      content: '',
      raw: (raw as ResponseInputItem) ?? { role: 'assistant', content: '' },
      toolCalls,
    });
  }

  toolResult(toolCallId: string, content: string): Message {
    return new OpenAIMessage({
      role: 'tool_result',
      content,
      raw: { type: 'function_call_output', call_id: toolCallId, output: content },
      toolCallId,
    });
  }

  fromRawUserInput(content: string, raw: ResponseInputItem): Message {
    return new OpenAIMessage({ role: 'user', content, raw });
  }

  fromOutputItem(outputItem: OpenAI.Responses.ResponseOutputItem): Message {
    if (outputItem.type === 'message') {
      const textContent = outputItem.content
        .filter((c): c is OpenAI.Responses.ResponseOutputText => c.type === 'output_text')
        .map(c => c.text)
        .join('');
      return new OpenAIMessage({
        role: 'assistant',
        content: textContent,
        raw: outputItem as unknown as ResponseInputItem,
      });
    } else if (outputItem.type === 'function_call') {
      return new OpenAIMessage({
        role: 'tool_call',
        content: '',
        raw: outputItem as unknown as ResponseInputItem,
        toolCalls: [{
          id: outputItem.call_id,
          name: outputItem.name,
          arguments: outputItem.arguments,
        }],
      });
    }
    return new OpenAIMessage({
      role: 'assistant',
      content: '',
      raw: outputItem as unknown as ResponseInputItem,
    });
  }
}
