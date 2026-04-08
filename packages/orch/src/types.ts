import type { StreamEvent, FinishReason, UserInput, LLMConfig, LLM, HistoryMessage } from '@agent-orch/core';

export interface PatternRunner {
  id: string;
  run(userInput: UserInput, ctx: PatternRunContext): AsyncGenerator<StreamEvent, { reason: FinishReason }>;
}

export interface PatternRunContext {
  eventPublisher: (event: StreamEvent) => void;
  parentPatternId?: string;
  historyMessages?: HistoryMessage[];
}

export interface PatternDeps {
  createLLM: (config: LLMConfig) => LLM;
}
