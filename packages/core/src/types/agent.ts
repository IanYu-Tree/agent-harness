import type { Message } from './message.js';
import type { Tool, ToolResult } from './tool.js';
import type { StreamEvent } from './event.js';
import type { LLMConfig } from './llm-config.js';

export interface CTX {
  userInput?: string;
  eventPublisher?: (event: StreamEvent) => void;
  patternId?: string;
  [key: string]: unknown;
}

export interface ToolExecutionContext {
  toolName: string;
  toolCallId: string;
  arguments: string;
  result: ToolResult;
}

export interface BeforeToolExecutionContext {
  toolName: string;
  toolCallId: string;
  arguments: string;
}

export interface Hook {
  beforeLLM?: (agent: AgentInstance) => Promise<void>;
  afterLLM?: (agent: AgentInstance) => Promise<void>;
  beforeToolExecution?: (agent: AgentInstance, toolCtx: BeforeToolExecutionContext) => Promise<void>;
  afterToolExecution?: (agent: AgentInstance, toolCtx: ToolExecutionContext) => Promise<void>;
}

export interface AgentInstance {
  messages: Message[];
  tools: Tool[];
  ctx: CTX;
  interrupt: () => void;
}

export interface AgentConfig {
  agentId: string;
  tools?: Tool[];
  prompt: string | ((ctx: CTX) => string);
  desc?: string;
  hooks?: Hook[];
  llmConfig: LLMConfig;
  maxTurns?: number;
}
