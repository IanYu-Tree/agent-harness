import type { OrchConfig, Tool, LLMConfig, ToolCallRecord } from '@agent-orch/core';

export interface HarnessConfig {
  orchs: OrchEntry[];
  defaultOrchId?: string;
  globalTools?: Tool[];
  defaultLLMConfig?: Partial<LLMConfig>;
  sessionDir?: string;
}

export interface OrchEntry {
  id: string;
  name: string;
  description?: string;
  config: OrchConfig;
}

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'tool_calls'; toolCalls: ToolCallRecord[] };

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agentId?: string;
  toolCalls?: ToolCallRecord[];
  contentParts?: ContentPart[];
}

export interface SessionData {
  id: string;
  orchId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface SessionSummary {
  id: string;
  orchId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

export type ToolStatus = 'pending' | 'running' | 'success' | 'error';

export interface ToolItemState {
  name: string;
  arguments: string;
  status: ToolStatus;
  result?: string;
}

export type StreamItem =
  | { type: 'user'; id: number; text: string }
  | { type: 'assistant'; id: number; agentId?: string; text: string }
  | { type: 'thinking'; id: number; agentId?: string; thought: string }
  | { type: 'tool_group'; id: number; agentId?: string; tools: ToolItemState[] }
  | { type: 'error'; id: number; text: string }
  | { type: 'spinner'; id: number; label: string };

export interface ChatStreamUpdate {
  type: 'items-changed' | 'items-finalized' | 'error';
  pendingItems: StreamItem[];
  finalizedMessages?: ChatMessage[];
  error?: string;
}
