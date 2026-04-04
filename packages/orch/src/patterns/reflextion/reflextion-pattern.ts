import type { AgentConfig, OrchConfig, StreamEvent, FinishReason, UserInput, Tool, Hook, Message } from '@agent-orch/core';
import { isOrchConfig, drainGenerator, isEventType } from '@agent-orch/core';
import { Agent } from '@agent-orch/react-agent';
import type { PatternRunner, PatternRunContext, PatternDeps } from '../../types.js';
import type { PatternFactory } from '../../factory/pattern-factory.js';
import { FeedbackStore } from './feedback-store.js';
import { createSetFeedbackTool, createGetFeedbackTool } from './feedback-tools.js';

const DEFAULT_MAX_ROUNDS = 3;

function formatMessagesForCritic(messages: Message[]): string {
  const parts: string[] = [];
  for (const msg of messages) {
    if (msg.isAssistant() && msg.content) {
      parts.push(`[Assistant]\n${msg.content}`);
    } else if (msg.isToolCall()) {
      for (const tc of msg.getToolCalls()) {
        parts.push(`[Tool Call: ${tc.name}]\nArguments: ${tc.arguments}`);
      }
    } else if (msg.isToolResult()) {
      parts.push(`[Tool Result]\n${msg.content}`);
    }
  }
  return parts.join('\n\n');
}

function injectToolIntoOrchConfig(orchConfig: OrchConfig, tool: Tool): OrchConfig {
  const cloned: OrchConfig = { ...orchConfig, agents: { ...orchConfig.agents } };
  for (const key of Object.keys(cloned.agents)) {
    const agentOrOrch = cloned.agents[key];
    if (isOrchConfig(agentOrOrch)) {
      cloned.agents[key] = injectToolIntoOrchConfig(agentOrOrch, tool);
    } else {
      const agentConfig = agentOrOrch as AgentConfig;
      cloned.agents[key] = {
        ...agentConfig,
        tools: [...(agentConfig.tools ?? []), tool],
      };
    }
  }
  return cloned;
}

function injectHookIntoOrchConfig(orchConfig: OrchConfig, hook: Hook): OrchConfig {
  const cloned: OrchConfig = { ...orchConfig, agents: { ...orchConfig.agents } };
  for (const key of Object.keys(cloned.agents)) {
    const agentOrOrch = cloned.agents[key];
    if (isOrchConfig(agentOrOrch)) {
      cloned.agents[key] = injectHookIntoOrchConfig(agentOrOrch, hook);
    } else {
      const agentConfig = agentOrOrch as AgentConfig;
      cloned.agents[key] = {
        ...agentConfig,
        hooks: [...(agentConfig.hooks ?? []), hook],
      };
    }
  }
  return cloned;
}

export class ReflextionPattern implements PatternRunner {
  id: string;
  private config: OrchConfig;
  private deps: PatternDeps;
  private factory: PatternFactory;
  private maxRounds: number;

  constructor(id: string, config: OrchConfig, deps: PatternDeps, factory: PatternFactory) {
    this.id = id;
    this.config = config;
    this.deps = deps;
    this.factory = factory;
    this.maxRounds = (config.options?.maxRounds as number) ?? DEFAULT_MAX_ROUNDS;

    if (!config.agents.executor) {
      throw new Error(`Reflextion "${id}" requires an agent with key "executor"`);
    }
    if (!config.agents.critic) {
      throw new Error(`Reflextion "${id}" requires an agent with key "critic"`);
    }
  }

  async *run(
    userInput: UserInput,
    ctx: PatternRunContext,
  ): AsyncGenerator<StreamEvent, { reason: FinishReason }> {
    const now = () => Date.now();
    const feedbackStore = new FeedbackStore();

    yield {
      type: 'pattern:start',
      timestamp: now(),
      patternId: this.id,
      data: { pattern: 'reflextion', maxRounds: this.maxRounds },
    };

    const executorConfig = this.config.agents.executor;
    const criticConfig = this.config.agents.critic;

    for (let round = 0; this.maxRounds === 0 || round < this.maxRounds; round++) {
      feedbackStore.nextRound();

      const executorOutput = yield* this.runExecutor(
        executorConfig,
        userInput,
        feedbackStore,
        ctx,
      );
      feedbackStore.setExecutorOutput(executorOutput);

      yield* this.runCritic(criticConfig, executorOutput, feedbackStore, ctx);

      if (feedbackStore.passed) {
        break;
      }
    }

    yield {
      type: 'pattern:end',
      timestamp: now(),
      patternId: this.id,
      data: { passed: feedbackStore.passed, rounds: feedbackStore.round },
    };

    return { reason: { type: 'end' } };
  }

  private async *runExecutor(
    config: AgentConfig | OrchConfig,
    userInput: UserInput,
    feedbackStore: FeedbackStore,
    ctx: PatternRunContext,
  ): AsyncGenerator<StreamEvent, string> {
    const getFeedbackTool = createGetFeedbackTool(feedbackStore);

    const enhancedInput: UserInput = feedbackStore.round > 1
      ? [
          ...userInput,
          {
            type: 'text',
            text: `\n[Previous feedback round ${feedbackStore.round - 1}]: ${feedbackStore.feedback}`,
          },
        ]
      : userInput;

    if (isOrchConfig(config)) {
      const injected = injectToolIntoOrchConfig(config, getFeedbackTool);
      const runner = this.factory.create(injected);
      const gen = runner.run(enhancedInput, {
        eventPublisher: ctx.eventPublisher,
        parentPatternId: this.id,
        historyMessages: feedbackStore.round === 1 ? ctx.historyMessages : undefined,
      });

      let output = '';
      const toolCalls: { name: string; arguments: string; result?: string; isError?: boolean }[] = [];

      while (true) {
        const { value, done } = await gen.next();
        if (done) break;
        if (isEventType(value, 'llm:chunk')) {
          if (value.data.content) output += value.data.content;
        }
        if (isEventType(value, 'tool:start')) {
          toolCalls.push({ name: value.data.name, arguments: value.data.arguments });
        }
        if (isEventType(value, 'tool:end')) {
          const pending = toolCalls.find(tc => tc.name === value.data.name && tc.result === undefined);
          if (pending) {
            pending.result = value.data.result.content;
            pending.isError = value.data.result.isError;
          }
        }
        yield value;
      }

      const parts: string[] = [];
      if (output) parts.push(output);
      for (const tc of toolCalls) {
        parts.push(`[Tool Call: ${tc.name}]\nArguments: ${tc.arguments}`);
        if (tc.result !== undefined) {
          parts.push(`[Tool Result]${tc.isError ? ' (Error)' : ''}\n${tc.result}`);
        }
      }
      return parts.join('\n\n');
    } else {
      const agentConfig = config as AgentConfig;
      const llm = this.deps.createLLM(agentConfig.llmConfig);
      const executorTools: Tool[] = [...(agentConfig.tools ?? []), getFeedbackTool];

      const agent = new Agent({
        llm,
        config: { ...agentConfig, tools: executorTools },
        ctx: { eventPublisher: ctx.eventPublisher, patternId: this.id },
      });

      if (feedbackStore.round === 1 && ctx.historyMessages?.length) {
        const msgFactory = llm.messageFactory;
        for (const msg of ctx.historyMessages) {
          if (msg.role === 'user') {
            agent.messages.push(msgFactory.user(msg.content));
          } else if (msg.role === 'assistant') {
            agent.messages.push(msgFactory.assistant(msg.content));
          }
        }
      }

      const gen = agent.runStream(enhancedInput) as AsyncGenerator<StreamEvent, { reason: FinishReason; messages: Message[] }>;
      let result: { reason: FinishReason; messages: Message[] } | undefined;

      while (true) {
        const { value, done } = await gen.next();
        if (done) {
          result = value;
          break;
        }
        yield value;
      }

      return formatMessagesForCritic(result?.messages ?? []);
    }
  }

  private async *runCritic(
    config: AgentConfig | OrchConfig,
    executorOutput: string,
    feedbackStore: FeedbackStore,
    ctx: PatternRunContext,
  ): AsyncGenerator<StreamEvent, void> {
    const setFeedbackTool = createSetFeedbackTool(feedbackStore);

    const interruptHook: Hook = {
      afterToolExecution: async (agentIns, toolCtx) => {
        if (toolCtx.toolName === 'set_feedback' && feedbackStore.passed) {
          agentIns.interrupt();
        }
      },
    };

    if (isOrchConfig(config)) {
      let injected = injectToolIntoOrchConfig(config, setFeedbackTool);
      injected = injectHookIntoOrchConfig(injected, interruptHook);
      const runner = this.factory.create(injected);
      const criticInput: UserInput = [
        { type: 'text', text: `Review the following output and provide feedback using set_feedback tool:\n\n${executorOutput}` },
      ];
      yield* drainGenerator(runner.run(criticInput, {
        eventPublisher: ctx.eventPublisher,
        parentPatternId: this.id,
      }));
    } else {
      const agentConfig = config as AgentConfig;
      const llm = this.deps.createLLM(agentConfig.llmConfig);
      const criticTools: Tool[] = [...(agentConfig.tools ?? []), setFeedbackTool];
      const criticHooks: Hook[] = [...(agentConfig.hooks ?? []), interruptHook];

      const agent = new Agent({
        llm,
        config: { ...agentConfig, tools: criticTools, hooks: criticHooks },
        ctx: { eventPublisher: ctx.eventPublisher, patternId: this.id },
      });

      const criticInput: UserInput = [
        { type: 'text', text: `Review the following output and provide feedback using set_feedback tool:\n\n${executorOutput}` },
      ];
      yield* drainGenerator(agent.runStream(criticInput) as AsyncGenerator<StreamEvent, { reason: FinishReason; messages: Message[] }>);
    }
  }
}
