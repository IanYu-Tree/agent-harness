import OpenAI from 'openai';
import type { FinishReason, StreamEvent, Tool, UserInput, Message, MessageFactory, LLMConfig } from '@agent-orch/core';
import { createLogger } from '@agent-orch/core';
import type { LLM } from '../../types.js';
import { userInputToResponseInput } from './message-utils.js';
import { convertToolsToOpenAI } from './tool-utils.js';
import { OpenAIMessageFactory } from './openai-message.js';

type ResponseInputItem = OpenAI.Responses.ResponseInputItem;
type ResponseStreamEvent = OpenAI.Responses.ResponseStreamEvent;

const logger = createLogger('LLM');

export class OpenAILLM implements LLM {
  readonly messageFactory: MessageFactory;
  private client: OpenAI;
  private model: string;
  private temperature?: number;
  private maxTokens?: number;
  private factory: OpenAIMessageFactory;

  constructor(options: LLMConfig) {
    const [, ...modelParts] = options.modelId.split('/');
    this.model = modelParts.join('/') || options.modelId;
    this.temperature = options.temperature;
    this.maxTokens = options.maxTokens;
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseUrl,
    });
    this.factory = new OpenAIMessageFactory();
    this.messageFactory = this.factory;
  }

  async *runStream(params: {
    messages: Message[];
    userInput: UserInput;
    tools?: Tool[];
  }): AsyncGenerator<StreamEvent, { reason: FinishReason; messages: Message[] }> {
    const input: ResponseInputItem[] = params.messages.map(msg => msg.toRaw() as ResponseInputItem);

    if (params.userInput.length > 0) {
      input.push(userInputToResponseInput(params.userInput));
    }

    const requestParams: OpenAI.Responses.ResponseCreateParamsStreaming = {
      model: this.model,
      input,
      stream: true,
    };

    if (this.temperature !== undefined) {
      requestParams.temperature = this.temperature;
    }
    if (this.maxTokens !== undefined) {
      requestParams.max_output_tokens = this.maxTokens;
    }
    if (params.tools && params.tools.length > 0) {
      requestParams.tools = convertToolsToOpenAI(params.tools) as unknown as OpenAI.Responses.Tool[];
    }

    const now = () => Date.now();
    let completedResponse: OpenAI.Responses.Response | undefined;
    const functionCalls: Map<number, { id: string; name: string; arguments: string; callId: string }> =
      new Map();

    yield { type: 'llm:start', timestamp: now(), data: { model: this.model } };

    try {
      logger.debug('requestParams', requestParams);
      const stream = await this.client.responses.create(requestParams);

      for await (const event of stream as AsyncIterable<ResponseStreamEvent>) {
        logger.debug(`event type=${event.type}`);
        switch (event.type) {
          case 'response.output_text.delta':
            yield {
              type: 'llm:chunk',
              timestamp: now(),
              data: { content: event.delta },
            };
            break;

          case 'response.reasoning.delta':
          case 'response.reasoning_summary.delta':
          case 'response.reasoning_summary_text.delta':
            if (event.delta) {
              yield {
                type: 'llm:reasoning',
                timestamp: now(),
                data: { content: String(event.delta) },
              };
            }
            break;

          case 'response.function_call_arguments.delta':
            if (functionCalls.has(event.output_index)) {
              functionCalls.get(event.output_index)!.arguments += event.delta;
            }
            break;

          case 'response.function_call_arguments.done':
            if (functionCalls.has(event.output_index)) {
              functionCalls.get(event.output_index)!.arguments = event.arguments;
            }
            break;

          case 'response.output_item.added':
            if (event.item.type === 'function_call') {
              functionCalls.set(event.output_index, {
                id: event.item.id ?? '',
                name: event.item.name,
                arguments: '',
                callId: event.item.call_id,
              });
            }
            break;

          case 'response.completed':
            completedResponse = event.response;
            break;
        }
      }
    } catch (error) {
      yield { type: 'llm:end', timestamp: now(), data: { error: String(error) } };
      return {
        reason: { type: 'error', msg: String(error) },
        messages: [...params.messages],
      };
    }

    if (!completedResponse) {
      logger.warn('No completed response received');
      yield { type: 'llm:end', timestamp: now(), data: { error: 'no_response' } };
      return {
        reason: { type: 'error', msg: 'No response received' },
        messages: [...params.messages],
      };
    }

    const newMessages: Message[] = [...params.messages];

    if (params.userInput.length > 0) {
      const userText = params.userInput
        .filter(i => i.type === 'text')
        .map(i => i.text)
        .join('\n');
      newMessages.push(this.factory.fromRawUserInput(
        userText,
        userInputToResponseInput(params.userInput),
      ));
    }

    for (const outputItem of completedResponse.output) {
      newMessages.push(this.factory.fromOutputItem(outputItem));
    }

    let reason: FinishReason;

    if (completedResponse.status === 'incomplete') {
      reason = { type: 'error', msg: 'context_length_exceeded' };
    } else if (functionCalls.size > 0) {
      reason = { type: 'tool' };
    } else {
      reason = { type: 'end' };
    }

    yield { type: 'llm:end', timestamp: now(), data: { status: completedResponse.status } };

    logger.debug(`completed: reason=${JSON.stringify(reason)}, outputItems=${completedResponse.output.length}, functionCalls=${functionCalls.size}`);

    return { reason, messages: newMessages };
  }
}
