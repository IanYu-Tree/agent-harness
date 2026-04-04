import type { MessageParam, ToolUseBlock, ToolResultBlockParam, TextBlock, ThinkingBlock } from '@anthropic-ai/sdk/resources/messages';
import type { ContentBlock } from '@anthropic-ai/sdk/resources/messages';
import { Message, type MessageRole, type ToolCall, type MessageFactory } from '@agent-orch/core';

export class AnthropicMessage extends Message {
  private _role: MessageRole;
  private _content: string;
  private _raw: MessageParam;
  private _toolCalls?: ToolCall[];
  private _toolCallId?: string;

  constructor(params: {
    role: MessageRole;
    content: string;
    raw: MessageParam;
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

  toRaw(): MessageParam { return this._raw; }
}

export class AnthropicMessageFactory implements MessageFactory {
  system(content: string): Message {
    return new AnthropicMessage({
      role: 'system',
      content,
      raw: { role: 'user', content: `System: ${content}` },
    });
  }

  user(content: string): Message {
    return new AnthropicMessage({
      role: 'user',
      content,
      raw: { role: 'user', content },
    });
  }

  assistant(content: string): Message {
    return new AnthropicMessage({
      role: 'assistant',
      content,
      raw: { role: 'assistant', content },
    });
  }

  toolCall(toolCalls: ToolCall[], raw?: unknown): Message {
    const toolUseBlocks: ToolUseBlock[] = toolCalls.map(tc => ({
      type: 'tool_use',
      id: tc.id,
      name: tc.name,
      input: JSON.parse(tc.arguments || '{}'),
    }));
    return new AnthropicMessage({
      role: 'tool_call',
      content: '',
      raw: { role: 'assistant', content: toolUseBlocks },
      toolCalls,
    });
  }

  toolResult(toolCallId: string, content: string): Message {
    const toolResultBlock: ToolResultBlockParam = {
      type: 'tool_result',
      tool_use_id: toolCallId,
      content,
    };
    return new AnthropicMessage({
      role: 'tool_result',
      content,
      raw: { role: 'user', content: [toolResultBlock] },
      toolCallId,
    });
  }

  fromRawUserInput(content: string, raw: MessageParam): Message {
    return new AnthropicMessage({ role: 'user', content, raw });
  }

  fromContentBlocks(contentBlocks: ContentBlock[]): Message {
    const textContent = contentBlocks
      .filter((c): c is TextBlock => c.type === 'text')
      .map(c => c.text)
      .join('');

    const thinkingContent = contentBlocks
      .filter((c): c is ThinkingBlock => c.type === 'thinking')
      .map(c => c.thinking)
      .join('');

    const toolCalls: ToolCall[] = contentBlocks
      .filter((c): c is ToolUseBlock => c.type === 'tool_use')
      .map(c => ({
        id: c.id,
        name: c.name,
        arguments: JSON.stringify(c.input),
      }));

    // Combine thinking and text content for display
    const combinedContent = thinkingContent
      ? `<thinking>${thinkingContent}</thinking>\n${textContent}`
      : textContent;

    if (toolCalls.length > 0) {
      return new AnthropicMessage({
        role: 'tool_call',
        content: combinedContent,
        raw: { role: 'assistant', content: contentBlocks },
        toolCalls,
      });
    }

    return new AnthropicMessage({
      role: 'assistant',
      content: combinedContent,
      raw: { role: 'assistant', content: combinedContent || '' },
    });
  }
}
