import type { AgentConfig, StreamEvent, FinishReason, UserInput, Message, LLM } from '@agent-orch/core';
import { drainGenerator } from '@agent-orch/core';
import { Agent } from '@agent-orch/react-agent';
import type { PatternRunner, PatternRunContext, PatternDeps } from '../../types.js';

export class SingleAgentPattern implements PatternRunner {
  readonly id: string;
  private agentConfig: AgentConfig;
  private deps: PatternDeps;
  private agent: Agent | null = null;
  private llmInstance: LLM | null = null;

  constructor(id: string, agentConfig: AgentConfig, deps: PatternDeps) {
    this.id = id;
    this.agentConfig = agentConfig;
    this.deps = deps;
  }

  private getOrCreateAgent(ctx: PatternRunContext): { agent: Agent; isNew: boolean } {
    if (this.agent) return { agent: this.agent, isNew: false };
    this.llmInstance = this.deps.createLLM(this.agentConfig.llmConfig);
    this.agent = new Agent({
      llm: this.llmInstance,
      config: this.agentConfig,
      ctx: { eventPublisher: ctx.eventPublisher },
    });
    return { agent: this.agent, isNew: true };
  }

  async *run(
    userInput: UserInput,
    ctx: PatternRunContext,
  ): AsyncGenerator<StreamEvent, { reason: FinishReason }> {
    const now = () => Date.now();

    yield {
      type: 'pattern:start',
      timestamp: now(),
      patternId: this.id,
      data: { pattern: 'singleAgent', agentId: this.agentConfig.agentId },
    };

    const { agent, isNew } = this.getOrCreateAgent(ctx);

    if (isNew && ctx.historyMessages && ctx.historyMessages.length > 0 && this.llmInstance) {
      const factory = this.llmInstance.messageFactory;
      for (const msg of ctx.historyMessages) {
        if (msg.role === 'user') {
          agent.messages.push(factory.user(msg.content));
        } else if (msg.role === 'assistant') {
          agent.messages.push(factory.assistant(msg.content));
        }
      }
    }

    const result = yield* drainGenerator(agent.runStream(userInput) as AsyncGenerator<StreamEvent, { reason: FinishReason; messages: Message[] }>);

    yield {
      type: 'pattern:end',
      timestamp: now(),
      patternId: this.id,
      data: { reason: result?.reason },
    };

    return { reason: result?.reason ?? { type: 'error', msg: 'No result' } };
  }
}
