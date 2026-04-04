import type { FinishReason } from './finish-reason.js';
import type { StreamEvent } from './event.js';
import type { Tool } from './tool.js';
import type { UserInput } from './user-input.js';
import type { Message } from './message.js';
import type { MessageFactory } from './message.js';

export interface LLM {
  readonly messageFactory: MessageFactory;
  runStream(params: {
    messages: Message[];
    userInput: UserInput;
    tools?: Tool[];
  }): AsyncGenerator<StreamEvent, { reason: FinishReason; messages: Message[] }>;
}
