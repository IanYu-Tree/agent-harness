import type { z } from 'zod';
import type { CTX } from './agent.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Tool<TParams extends z.ZodType = any> {
  name: string;
  description: string;
  parameters: TParams;
  execute: (params: z.infer<TParams>, context: ToolContext) => Promise<ToolResult>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ToolResult {
  content: string;
  isError?: boolean;
}

export interface ToolContext {
  agentId: string;
  ctx: CTX;
}

export interface ToolCallRecord {
  name: string;
  arguments: string;
  result: string;
}
