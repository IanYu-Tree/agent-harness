import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, ToolUseBlock } from '@anthropic-ai/sdk/resources/messages';
import type { FinishReason, StreamEvent, Tool, UserInput, Message, MessageFactory, LLMConfig } from '@agent-orch/core';
import { createLogger } from '@agent-orch/core';
import type { LLM } from '../../types.js';
import { userInputToMessageParam } from './message-utils.js';
import { convertToolsToAnthropic } from './tool-utils.js';
import { AnthropicMessageFactory } from './anthropic-message.js';

const logger = createLogger('LLM');

export class AnthropicLLM implements LLM {
  readonly messageFactory: MessageFactory;
  private client: Anthropic;
  private model: string;
  private temperature?: number;
  private maxTokens?: number;
  private factory: AnthropicMessageFactory;

  constructor(options: LLMConfig) {
    const [, ...modelParts] = options.modelId.split('/');
    this.model = modelParts.join('/') || options.modelId;
    this.temperature = options.temperature;
    this.maxTokens = options.maxTokens;
    this.client = new Anthropic({
      apiKey: options.apiKey,
      baseURL: options.baseUrl,
    });
    this.factory = new AnthropicMessageFactory();
    this.messageFactory = this.factory;
  }

  async *runStream(params: {
    messages: Message[];
    userInput: UserInput;
    tools?: Tool[];
  }): AsyncGenerator<StreamEvent, { reason: FinishReason; messages: Message[] }> {
    const messageParams: MessageParam[] = [];
    let systemPrompt: string | undefined;

    // Convert messages to Anthropic format
    for (const msg of params.messages) {
      if (msg.role === 'system') {
        // Anthropic API supports system prompt as a separate parameter
        systemPrompt = msg.content;
      } else {
        messageParams.push(msg.toRaw() as MessageParam);
      }
    }

    // Add user input
    if (params.userInput.length > 0) {
      messageParams.push(userInputToMessageParam(params.userInput));
    }

    const requestParams: Anthropic.MessageStreamParams = {
      model: this.model,
      max_tokens: this.maxTokens ?? 16384,
      messages: messageParams,
      stream: true,
    };

    // Add system prompt if present
    if (systemPrompt) {
      requestParams.system = systemPrompt;
    }

    if (this.temperature !== undefined) {
      requestParams.temperature = this.temperature;
    }
    if (params.tools && params.tools.length > 0) {
      requestParams.tools = convertToolsToAnthropic(params.tools);
    }

    const now = () => Date.now();
    const toolCalls: Map<string, { id: string; name: string; arguments: string }> = new Map();
    const contentBlocks: Anthropic.Messages.ContentBlock[] = [];

    yield { type: 'llm:start', timestamp: now(), data: { model: this.model } };

    try {
      logger.debug('requestParams', requestParams);
      const stream = this.client.messages.stream(requestParams);

      for await (const event of stream) {
        logger.debug(`event type=${event.type}`);

        switch (event.type) {
          case 'content_block_delta':
            if (event.delta.type === 'text_delta') {
              yield {
                type: 'llm:chunk',
                timestamp: now(),
                data: { content: event.delta.text },
              };
            } else if (event.delta.type === 'thinking_delta') {
              yield {
                type: 'llm:reasoning',
                timestamp: now(),
                data: { content: event.delta.thinking },
              };
            } else if (event.delta.type === 'input_json_delta') {
              // Accumulate tool arguments
              const block = contentBlocks[event.index];
              if (block && block.type === 'tool_use') {
                const existing = toolCalls.get(block.id);
                if (existing) {
                  existing.arguments += event.delta.partial_json;
                }
              }
            }
            break;

          case 'content_block_start':
            if (event.content_block.type === 'tool_use') {
              const toolUse = event.content_block as ToolUseBlock;
              contentBlocks[event.index] = toolUse;
              toolCalls.set(toolUse.id, {
                id: toolUse.id,
                name: toolUse.name,
                arguments: '',
              });
            } else if (event.content_block.type === 'text') {
              contentBlocks[event.index] = event.content_block;
            } else if (event.content_block.type === 'thinking') {
              contentBlocks[event.index] = event.content_block;
            }
            break;

          case 'content_block_stop':
            // Content block is complete
            break;
        }
      }

      const finalMessage = await stream.finalMessage();
      logger.debug(`finalMessage stop_reason=${finalMessage.stop_reason}`);

      // Build new messages list
      const newMessages: Message[] = [...params.messages];

      if (params.userInput.length > 0) {
        const userText = params.userInput
          .filter(i => i.type === 'text')
          .map(i => i.text)
          .join('\n');
        newMessages.push(this.factory.fromRawUserInput(
          userText,
          userInputToMessageParam(params.userInput),
        ));
      }

      // Add assistant response message
      newMessages.push(this.factory.fromContentBlocks(finalMessage.content));

      // Determine finish reason
      let reason: FinishReason;

      if (finalMessage.stop_reason === 'max_tokens') {
        reason = { type: 'error', msg: 'max_tokens_reached' };
      } else if (toolCalls.size > 0) {
        reason = { type: 'tool' };
      } else {
        reason = { type: 'end' };
      }

      yield { type: 'llm:end', timestamp: now(), data: { status: finalMessage.stop_reason || 'completed' } };

      logger.debug(`completed: reason=${JSON.stringify(reason)}, contentBlocks=${finalMessage.content.length}, toolCalls=${toolCalls.size}`);

      return { reason, messages: newMessages };

    } catch (error) {
      yield { type: 'llm:end', timestamp: now(), data: { error: String(error) } };
      return {
        reason: { type: 'error', msg: String(error) },
        messages: [...params.messages],
      };
    }
  }
}
