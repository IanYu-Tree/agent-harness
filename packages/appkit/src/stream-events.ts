/**
 * Incremental stream events for efficient streaming.
 *
 * These events represent only the changes (deltas) in the stream,
 * eliminating the need for callers to compute diffs.
 */

import type { ToolItemState } from './types.js';

/**
 * Text delta event - emitted when new text content is added
 */
export interface TextDeltaEvent {
  type: 'text_delta';
  /** Stable UUID for this text item */
  itemId: string;
  /** Agent that produced this content */
  agentId?: string;
  /** The new text that was just added (not the full text) */
  delta: string;
  /** Full text for validation/debugging */
  fullText: string;
}

/**
 * Tool start event - emitted when a tool execution begins
 */
export interface ToolStartEvent {
  type: 'tool_start';
  /** Unique ID for this tool call */
  toolId: string;
  /** Agent that initiated this tool call */
  agentId?: string;
  /** Tool name */
  name: string;
  /** Tool arguments (JSON string) */
  arguments: string;
}

/**
 * Tool end event - emitted when a tool execution completes
 */
export interface ToolEndEvent {
  type: 'tool_end';
  /** Unique ID for this tool call */
  toolId: string;
  /** Agent that initiated this tool call */
  agentId?: string;
  /** Tool execution result */
  result: string;
}

/**
 * Thinking event - emitted when agent produces reasoning
 */
export interface ThinkingEvent {
  type: 'thinking';
  /** Agent that produced this thought */
  agentId?: string;
  /** The reasoning content */
  thought: string;
}

/**
 * Spinner event - emitted to show processing state
 */
export interface SpinnerEvent {
  type: 'spinner';
  /** Agent that is processing */
  agentId?: string;
  /** Spinner label */
  label: string;
}

/**
 * Stream completed event
 */
export interface StreamCompletedEvent {
  type: 'completed';
}

/**
 * Stream error event
 */
export interface StreamErrorEvent {
  type: 'error';
  error: string;
}

/**
 * Union type for all stream delta events
 */
export type StreamDeltaEvent =
  | TextDeltaEvent
  | ToolStartEvent
  | ToolEndEvent
  | ThinkingEvent
  | SpinnerEvent
  | StreamCompletedEvent
  | StreamErrorEvent;

/**
 * Callback type for handling delta events
 */
export type DeltaEventHandler = (event: StreamDeltaEvent) => void | Promise<void>;
