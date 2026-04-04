import type {
  Tool,
  CTX,
  Hook,
  FinishReason,
  StreamEvent,
  AgentConfig,
  UserInput,
  ToolCall,
  ToolResult,
  Message,
  LLM,
} from '@agent-orch/core';
import { microcompact, compact, isLengthError } from './compression.js';
import type { ConfirmationRequest, ConfirmationResult, ConfirmationEvent, WaitFn } from './confirmation.js';

const DEFAULT_MAX_TURNS = 20;

export class Agent {
  messages: Message[];
  tools: Tool[];
  ctx: CTX;
  private llm: LLM;
  private hooks: Hook[];
  private maxTurns: number;
  private systemPrompt: string;
  private agentId: string;
  private _interrupted = false;
  private pendingConfirmation: {
    resolve: (result: ConfirmationResult) => void;
    request: ConfirmationRequest;
  } | null = null;

  constructor(options: { llm: LLM; config: AgentConfig; ctx?: CTX }) {
    this.llm = options.llm;
    this.agentId = options.config.agentId;
    this.tools = options.config.tools ?? [];
    this.hooks = options.config.hooks ?? [];
    this.maxTurns = options.config.maxTurns ?? DEFAULT_MAX_TURNS;
    this.ctx = options.ctx ?? {};

    const prompt = options.config.prompt;
    this.systemPrompt = typeof prompt === 'function' ? prompt(this.ctx) : prompt;

    this.messages = [
      this.llm.messageFactory.system(this.systemPrompt),
    ];
  }

  resolve(result: ConfirmationResult): void {
    if (!this.pendingConfirmation) {
      throw new Error('No pending confirmation to resolve');
    }
    this.pendingConfirmation.resolve(result);
    this.pendingConfirmation = null;
  }

  interrupt(): void {
    this._interrupted = true;
  }

  async *runStream(
    userInput: UserInput,
  ): AsyncGenerator<StreamEvent | ConfirmationEvent, { reason: FinishReason; messages: Message[] }> {
    const now = () => Date.now();
    this._interrupted = false;

    yield {
      type: 'agent:start',
      timestamp: now(),
      agentId: this.agentId,
      data: { agentId: this.agentId },
    };

    let currentInput = userInput;
    let autoCompressAttempt = 0;

    for (let turn = 0; turn < this.maxTurns; turn++) {
      for (const hook of this.hooks) {
        if (hook.beforeLLM) {
          await hook.beforeLLM(this);
        }
      }

      const prevLength = this.messages.length;

      const gen = this.llm.runStream({
        messages: this.messages,
        userInput: currentInput,
        tools: this.tools.length > 0 ? this.tools : undefined,
      });

      let turnResult: { reason: FinishReason; messages: Message[] } | undefined;

      while (true) {
        const { value, done } = await gen.next();
        if (done) {
          turnResult = value as { reason: FinishReason; messages: Message[] };
          break;
        }
        yield { ...value, agentId: this.agentId };
      }

      if (!turnResult) {
        const reason: FinishReason = { type: 'error', msg: 'No result from LLM' };
        yield { type: 'agent:error', timestamp: now(), agentId: this.agentId, data: { reason } };
        return { reason, messages: this.messages };
      }

      this.messages = turnResult.messages;

      for (const hook of this.hooks) {
        if (hook.afterLLM) {
          await hook.afterLLM(this);
        }
      }

      currentInput = [];

      if (turnResult.reason.type === 'tool') {
        const toolCalls = this.extractToolCalls(this.messages, prevLength);
        const toolResults: Message[] = [];

        for (const toolCall of toolCalls) {
          for (const hook of this.hooks) {
            if (hook.beforeToolExecution) {
              await hook.beforeToolExecution(this, {
                toolName: toolCall.name,
                toolCallId: toolCall.id,
                arguments: toolCall.arguments,
              });
            }
          }

          if (this._interrupted) break;

          yield {
            type: 'tool:start',
            timestamp: now(),
            agentId: this.agentId,
            data: { name: toolCall.name, arguments: toolCall.arguments },
          };

          const toolGen = this.executeToolWithConfirmation(toolCall);

          let result: ToolResult;
          while (true) {
            const { value, done } = await toolGen.next();
            if (done) {
              result = value;
              break;
            }
            yield value;
          }

          yield {
            type: 'tool:end',
            timestamp: now(),
            agentId: this.agentId,
            data: { name: toolCall.name, result },
          };

          toolResults.push(this.llm.messageFactory.toolResult(toolCall.id, result.content));

          for (const hook of this.hooks) {
            if (hook.afterToolExecution) {
              await hook.afterToolExecution(this, {
                toolName: toolCall.name,
                toolCallId: toolCall.id,
                arguments: toolCall.arguments,
                result,
              });
            }
          }

          if (this._interrupted) break;
        }

        this.messages = [...this.messages, ...toolResults];

        if (this._interrupted) {
          const reason: FinishReason = { type: 'end', msg: 'interrupted' };
          yield {
            type: 'agent:end',
            timestamp: now(),
            agentId: this.agentId,
            data: { reason },
          };
          return { reason, messages: this.messages };
        }

        autoCompressAttempt = 0;
        continue;
      }

      if (turnResult.reason.type === 'end') {
        yield {
          type: 'agent:end',
          timestamp: now(),
          agentId: this.agentId,
          data: { reason: turnResult.reason },
        };
        return { reason: turnResult.reason, messages: this.messages };
      }

      if (turnResult.reason.type === 'error') {
        if (isLengthError(turnResult.reason.msg) && autoCompressAttempt < 2) {
          autoCompressAttempt++;
          if (autoCompressAttempt === 1) {
            this.messages = microcompact(this.messages);
          } else {
            this.messages = await compact(this.messages, this.llm, this.systemPrompt);
          }
          continue;
        }

        yield {
          type: 'agent:error',
          timestamp: now(),
          agentId: this.agentId,
          data: { reason: turnResult.reason },
        };
        return { reason: turnResult.reason, messages: this.messages };
      }
    }

    const reason: FinishReason = { type: 'end', msg: 'max_turns_reached' };
    yield {
      type: 'agent:end',
      timestamp: now(),
      agentId: this.agentId,
      data: { reason },
    };
    return { reason, messages: this.messages };
  }

  private async *executeToolWithConfirmation(
    toolCall: ToolCall,
  ): AsyncGenerator<ConfirmationEvent, ToolResult> {
    const tool = this.tools.find((t) => t.name === toolCall.name);
    if (!tool) {
      return { content: `Tool not found: ${toolCall.name}`, isError: true };
    }

    try {
      const rawArgs = JSON.parse(toolCall.arguments);
      const parsedArgs = tool.parameters.parse(rawArgs);

      let waitCalledResolve: () => void;
      const waitCalledPromise = new Promise<void>((r) => {
        waitCalledResolve = r;
      });

      const waitFn: WaitFn = (data?: unknown) => {
        return new Promise<ConfirmationResult>((resolve) => {
          this.pendingConfirmation = {
            resolve,
            request: {
              toolCallId: toolCall.id,
              toolName: toolCall.name,
              arguments: toolCall.arguments,
              data,
            },
          };
          waitCalledResolve!();
        });
      };

      const ctxWithWait = { ...this.ctx, wait: waitFn };
      const executePromise = tool.execute(parsedArgs, { agentId: this.agentId, ctx: ctxWithWait });

      const raceResult = await Promise.race([
        executePromise.then((r) => ({ type: 'completed' as const, result: r })),
        waitCalledPromise.then(() => ({ type: 'waiting' as const })),
      ]);

      if (raceResult.type === 'completed') {
        return raceResult.result;
      }

      yield {
        type: 'tool:confirmation' as const,
        timestamp: Date.now(),
        agentId: this.agentId,
        data: { request: this.pendingConfirmation!.request },
      };

      return await executePromise;
    } catch (error) {
      return { content: `Tool execution error: ${String(error)}`, isError: true };
    }
  }

  private extractToolCalls(messages: Message[], previousLength: number): ToolCall[] {
    return messages.slice(previousLength)
      .filter(msg => msg.isToolCall())
      .flatMap(msg => msg.getToolCalls());
  }

  async microcompactMessages(): Promise<void> {
    this.messages = microcompact(this.messages);
  }

  async compactMessages(): Promise<void> {
    this.messages = await compact(this.messages, this.llm, this.systemPrompt);
  }
}
