import type { AgentConfig, OrchConfig, StreamEvent, FinishReason, UserInput, Tool, Message, LLM } from '@agent-orch/core';
import { drainGenerator } from '@agent-orch/core';
import { Agent } from '@agent-orch/react-agent';
import type { PatternRunner, PatternRunContext, PatternDeps } from '../../types.js';
import type { PatternFactory } from '../../factory/pattern-factory.js';
import { createPlannerTools } from './spawn-executor-tool.js';

export class PlannerExecutorPattern implements PatternRunner {
  id: string;
  private config: OrchConfig;
  private deps: PatternDeps;
  private factory: PatternFactory;
  private plannerAgent: Agent | null = null;
  private plannerLLM: LLM | null = null;

  constructor(id: string, config: OrchConfig, deps: PatternDeps, factory: PatternFactory) {
    this.id = id;
    this.config = config;
    this.deps = deps;
    this.factory = factory;

    if (!config.agents.planner) {
      throw new Error(`PlannerExecutor "${id}" requires an agent with key "planner"`);
    }
    const executorKeys = Object.keys(config.agents).filter((k) => k !== 'planner');
    if (executorKeys.length === 0) {
      throw new Error(`PlannerExecutor "${id}" requires at least one executor agent`);
    }
  }

  private getOrCreatePlanner(ctx: PatternRunContext): { agent: Agent; isNew: boolean } {
    if (this.plannerAgent) return { agent: this.plannerAgent, isNew: false };

    const plannerConfig = this.config.agents.planner as AgentConfig;
    const executors: Record<string, AgentConfig | OrchConfig> = {};
    for (const [key, value] of Object.entries(this.config.agents)) {
      if (key !== 'planner') {
        executors[key] = value as AgentConfig | OrchConfig;
      }
    }

    const plannerTools: Tool[] = [
      ...(plannerConfig.tools ?? []),
      ...createPlannerTools(this.factory, executors, this.deps),
    ];

    this.plannerLLM = this.deps.createLLM(plannerConfig.llmConfig);
    this.plannerAgent = new Agent({
      llm: this.plannerLLM,
      config: { ...plannerConfig, tools: plannerTools },
      ctx: { eventPublisher: ctx.eventPublisher, patternId: this.id },
    });

    return { agent: this.plannerAgent, isNew: true };
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
      data: { pattern: 'plannerExecutor' },
    };

    const { agent, isNew } = this.getOrCreatePlanner(ctx);

    if (isNew && ctx.historyMessages?.length && this.plannerLLM) {
      const factory = this.plannerLLM.messageFactory;
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
