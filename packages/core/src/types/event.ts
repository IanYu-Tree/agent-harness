import type { FinishReason } from './finish-reason.js';
import type { ToolResult } from './tool.js';

export type StreamEventType =
  | 'agent:start'
  | 'agent:end'
  | 'agent:error'
  | 'llm:start'
  | 'llm:chunk'
  | 'llm:reasoning'
  | 'llm:end'
  | 'tool:start'
  | 'tool:end'
  | 'pattern:start'
  | 'pattern:end'
  | 'orch:spawn'
  | 'orch:complete'
  | 'orch:task_start'
  | 'orch:task_complete'
  | 'orch:task_failed';

export interface StreamEventDataMap {
  'agent:start': { agentId: string };
  'agent:end': { reason: FinishReason };
  'agent:error': { reason: FinishReason };
  'llm:start': { model: string };
  'llm:chunk': { content: string };
  'llm:reasoning': { content: string };
  'llm:end': { status?: string; error?: string };
  'tool:start': { name: string; arguments: string };
  'tool:end': { name: string; result: ToolResult };
  'pattern:start': Record<string, unknown>;
  'pattern:end': Record<string, unknown>;
  'orch:spawn': { executorId: string; task: string };
  'orch:complete': { executorId: string; reason: unknown };
  'orch:task_start': { executorId: string; taskId: string; task: string; dependencies: string[] };
  'orch:task_complete': { executorId: string; taskId: string; result: string };
  'orch:task_failed': { executorId: string; taskId: string; error: string };
}

export interface StreamEvent {
  type: StreamEventType;
  timestamp: number;
  agentId?: string;
  patternId?: string;
  data: StreamEventDataMap[StreamEventType];
}

export type TypedStreamEvent<K extends StreamEventType = StreamEventType> = {
  type: K;
  timestamp: number;
  agentId?: string;
  patternId?: string;
  data: StreamEventDataMap[K];
};

export function isEventType<K extends StreamEventType>(
  event: StreamEvent,
  type: K,
): event is StreamEvent & TypedStreamEvent<K> {
  return event.type === type;
}
