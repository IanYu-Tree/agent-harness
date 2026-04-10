import type { StreamEvent, ToolCallRecord } from '@agent-orch/core';
import { isEventType, type StreamEventCollector } from '@agent-orch/core';
import type { ChatMessage, ChatStreamUpdate, ContentPart, StreamItem, ToolItemState } from './types.js';
import type { StreamDeltaEvent, DeltaEventHandler } from './stream-events.js';
import { randomUUID } from 'crypto';

interface AgentAccumulator {
  agentId: string;
  reasoning: string;
  content: string;
  tools: ToolItemState[];
  toolRecords: ToolCallRecord[];
  contentParts: ContentPart[];
  lastPartType: 'text' | 'tool' | null;
}

export class ChatStreamProcessor {
  private getOrCreateAgent(agents: Map<string, AgentAccumulator>, agentId: string): AgentAccumulator {
    let agent = agents.get(agentId);
    if (!agent) {
      agent = {
        agentId,
        reasoning: '',
        content: '',
        tools: [],
        toolRecords: [],
        contentParts: [],
        lastPartType: null,
      };
      agents.set(agentId, agent);
    }
    return agent;
  }

  private buildPendingItems(agents: Map<string, AgentAccumulator>): StreamItem[] {
    const items: StreamItem[] = [];

    for (const agent of agents.values()) {
      const agentId = agent.agentId === 'default' ? undefined : agent.agentId;

      if (agent.reasoning) {
        items.push({ type: 'thinking', id: -1, agentId, thought: agent.reasoning });
      }

      for (const part of agent.contentParts) {
        if (part.type === 'text' && part.text) {
          items.push({ type: 'assistant', id: -2, agentId, text: part.text });
        } else if (part.type === 'tool_calls' && part.toolCalls.length > 0) {
          items.push({
            type: 'tool_group',
            id: -3,
            agentId,
            tools: part.toolCalls.map(tc => ({
              name: tc.name,
              arguments: tc.arguments,
              status: 'success' as const,
              result: tc.result,
            })),
          });
        }
      }

      const runningTools = agent.tools.filter(t => t.status === 'running' || t.status === 'pending');
      if (runningTools.length > 0) {
        items.push({ type: 'tool_group', id: -4, agentId, tools: [...runningTools] });
      }

      if (!agent.reasoning && agent.contentParts.length === 0 && agent.tools.length === 0) {
        items.push({ type: 'spinner', id: -5, label: `${agentId ?? 'AI'} thinking...` });
      }
    }

    if (agents.size === 0) {
      items.push({ type: 'spinner', id: -6, label: 'processing...' });
    }

    return items;
  }

  private handleEvent(
    event: StreamEvent,
    agents: Map<string, AgentAccumulator>,
    onUpdate: (update: ChatStreamUpdate) => void,
  ): string {
    const agentId = event.agentId ?? 'default';
    let errorInfo = '';

    if (isEventType(event, 'agent:start')) {
      this.getOrCreateAgent(agents, agentId);
      onUpdate({ type: 'items-changed', pendingItems: this.buildPendingItems(agents) });
    }

    if (isEventType(event, 'llm:reasoning')) {
      const agent = this.getOrCreateAgent(agents, agentId);
      agent.reasoning += event.data.content;
      onUpdate({ type: 'items-changed', pendingItems: this.buildPendingItems(agents) });
    }

    if (isEventType(event, 'llm:chunk')) {
      const agent = this.getOrCreateAgent(agents, agentId);
      agent.content += event.data.content;
      if (agent.lastPartType !== 'text') {
        agent.contentParts.push({ type: 'text', text: '' });
        agent.lastPartType = 'text';
      }
      const lastPart = agent.contentParts[agent.contentParts.length - 1];
      if (lastPart.type === 'text') {
        lastPart.text += event.data.content;
      }
      onUpdate({ type: 'items-changed', pendingItems: this.buildPendingItems(agents) });
    }

    if (isEventType(event, 'tool:start')) {
      const agent = this.getOrCreateAgent(agents, agentId);
      agent.tools.push({
        name: event.data.name,
        arguments: event.data.arguments,
        status: 'running',
      });
      onUpdate({ type: 'items-changed', pendingItems: this.buildPendingItems(agents) });
    }

    if (isEventType(event, 'tool:end')) {
      const agent = this.getOrCreateAgent(agents, agentId);
      const resultStr = event.data.result.content;
      const toolIdx = agent.tools.findIndex(t => t.name === event.data.name && t.status === 'running');
      let toolArgs = '';
      if (toolIdx >= 0) {
        toolArgs = agent.tools[toolIdx].arguments;
        agent.tools[toolIdx].status = 'success';
        agent.tools[toolIdx].result = resultStr;
      }
      const toolRecord: ToolCallRecord = { name: event.data.name, arguments: toolArgs, result: resultStr };
      agent.toolRecords.push(toolRecord);
      if (agent.lastPartType !== 'tool') {
        agent.contentParts.push({ type: 'tool_calls', toolCalls: [] });
        agent.lastPartType = 'tool';
      }
      const lastPart = agent.contentParts[agent.contentParts.length - 1];
      if (lastPart.type === 'tool_calls') {
        lastPart.toolCalls.push(toolRecord);
      }
      onUpdate({ type: 'items-changed', pendingItems: this.buildPendingItems(agents) });
    }

    if (isEventType(event, 'llm:end')) {
      const agent = this.getOrCreateAgent(agents, agentId);
      agent.reasoning = '';
      onUpdate({ type: 'items-changed', pendingItems: this.buildPendingItems(agents) });
      if (event.data.error) {
        errorInfo = `LLM Error: ${event.data.error}`;
      }
    }

    if (isEventType(event, 'agent:error') && event.data.reason) {
      errorInfo = `Agent Error: ${event.data.reason.msg ?? JSON.stringify(event.data.reason)}`;
    }

    return errorInfo;
  }

  private finalize(
    agents: Map<string, AgentAccumulator>,
    errorInfo: string,
    onUpdate: (update: ChatStreamUpdate) => void,
  ): ChatMessage[] {
    const finalizedMessages: ChatMessage[] = [];
    let hasContent = false;

    for (const agent of agents.values()) {
      const agentId = agent.agentId === 'default' ? undefined : agent.agentId;

      if (agent.content || agent.toolRecords.length > 0) {
        hasContent = true;
        finalizedMessages.push({
          role: 'assistant',
          content: agent.content,
          timestamp: Date.now(),
          agentId,
          toolCalls: agent.toolRecords.length > 0 ? agent.toolRecords : undefined,
          contentParts: agent.contentParts.length > 0 ? agent.contentParts : undefined,
        });
      }
    }

    if (!hasContent && errorInfo) {
      finalizedMessages.push({
        role: 'system',
        content: errorInfo,
        timestamp: Date.now(),
      });
    }

    onUpdate({
      type: 'items-finalized',
      pendingItems: [],
      finalizedMessages,
    });

    return finalizedMessages;
  }

  /**
   * Legacy API: Process stream with full snapshots.
   * @deprecated Use processIncremental for better performance
   */
  async processStream(
    stream: AsyncGenerator<StreamEvent, void>,
    onUpdate: (update: ChatStreamUpdate) => void,
    eventCollector?: StreamEventCollector,
  ): Promise<ChatMessage[]> {
    const agents = new Map<string, AgentAccumulator>();
    let errorInfo = '';

    try {
      if (eventCollector) {
        const subId = eventCollector.subscribe((event) => {
          const err = this.handleEvent(event, agents, onUpdate);
          if (err) errorInfo = err;
        });

        try {
          for await (const _event of stream) {
          }
        } finally {
          eventCollector.unsubscribe(subId);
        }
      } else {
        for await (const event of stream) {
          const err = this.handleEvent(event, agents, onUpdate);
          if (err) errorInfo = err;
        }
      }

      return this.finalize(agents, errorInfo, onUpdate);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      const errorMessage: ChatMessage = {
        role: 'system',
        content: `Error: ${errMsg}`,
        timestamp: Date.now(),
      };
      onUpdate({
        type: 'error',
        pendingItems: [],
        error: errMsg,
        finalizedMessages: [errorMessage],
      });
      return [errorMessage];
    }
  }

  // ==================== NEW INCREMENTAL API ====================

  /**
   * Process stream with incremental delta events.
   *
   * This method maintains internal state and only emits events for actual changes,
   * eliminating the need for callers to compute diffs.
   *
   * @param stream - The event stream from LLM
   * @param onDelta - Callback for delta events (only called when there's new data)
   * @param eventCollector - Optional event collector for external events
   * @returns Finalized messages when stream completes
   */
  async processIncremental(
    stream: AsyncGenerator<StreamEvent, void>,
    onDelta: DeltaEventHandler,
    eventCollector?: StreamEventCollector,
  ): Promise<ChatMessage[]> {
    // Internal state tracking: key is UUID string
    const state = new Map<string, { fullText: string; sentLength: number }>();
    const toolState = new Map<string, { name: string; args: string; started: boolean; ended: boolean }>();
    const agents = new Map<string, AgentAccumulator>();
    let errorInfo = '';

    // Helper to get or create agent
    const getOrCreateAgent = (agentId: string): AgentAccumulator => {
      let agent = agents.get(agentId);
      if (!agent) {
        agent = {
          agentId,
          reasoning: '',
          content: '',
          tools: [],
          toolRecords: [],
          contentParts: [],
          lastPartType: null,
        };
        agents.set(agentId, agent);
      }
      return agent;
    };

    // Helper to handle events and emit deltas
    const handleEventForDelta = async (event: StreamEvent): Promise<void> => {
      const agentId = event.agentId ?? 'default';

      if (isEventType(event, 'agent:start')) {
        getOrCreateAgent(agentId);
        await onDelta({ type: 'spinner', agentId, label: `${agentId} starting...` });
      }

      if (isEventType(event, 'llm:reasoning')) {
        const agent = getOrCreateAgent(agentId);
        agent.reasoning += event.data.content;
        await onDelta({
          type: 'thinking',
          agentId,
          thought: event.data.content,
        });
      }

      if (isEventType(event, 'llm:chunk')) {
        const agent = getOrCreateAgent(agentId);
        const isNewPart = agent.lastPartType !== 'text';
        let itemId: string;

        if (isNewPart) {
          // Generate new UUID for new text part
          itemId = randomUUID();
          agent.contentParts.push({ type: 'text', text: '', itemId });
          agent.lastPartType = 'text';
          // Initialize state for new item
          state.set(itemId, { fullText: '', sentLength: 0 });
        } else {
          // Get existing itemId from last content part
          const lastPart = agent.contentParts[agent.contentParts.length - 1];
          itemId = lastPart.type === 'text' ? (lastPart.itemId ?? randomUUID()) : randomUUID();
          if (lastPart.type === 'text' && !lastPart.itemId) {
            lastPart.itemId = itemId;
          }
        }

        const lastPart = agent.contentParts[agent.contentParts.length - 1];
        if (lastPart.type === 'text') {
          lastPart.text += event.data.content;
          agent.content += event.data.content;
        }

        // Update state and compute delta
        const current = state.get(itemId) ?? { fullText: '', sentLength: 0 };
        if (lastPart.type === 'text') {
          current.fullText = lastPart.text;
        }

        const delta = current.fullText.slice(current.sentLength);
        if (delta) {
          await onDelta({
            type: 'text_delta',
            itemId,
            agentId: agentId === 'default' ? undefined : agentId,
            delta,
            fullText: current.fullText,
          });
          current.sentLength = current.fullText.length;
          state.set(itemId, current);
        }
      }

      if (isEventType(event, 'tool:start')) {
        const agent = getOrCreateAgent(agentId);
        const toolId = randomUUID();

        agent.tools.push({
          name: event.data.name,
          arguments: event.data.arguments,
          status: 'running',
        });

        toolState.set(toolId, {
          name: event.data.name,
          args: event.data.arguments,
          started: true,
          ended: false,
        });

        await onDelta({
          type: 'tool_start',
          toolId,
          agentId: agentId === 'default' ? undefined : agentId,
          name: event.data.name,
          arguments: event.data.arguments,
        });
      }

      if (isEventType(event, 'tool:end')) {
        const agent = getOrCreateAgent(agentId);
        const resultStr = event.data.result.content;

        // Find the running tool and its toolId from toolState
        const toolIdx = agent.tools.findIndex(t => t.name === event.data.name && t.status === 'running');
        let toolArgs = '';
        let toolId = '';

        if (toolIdx >= 0) {
          toolArgs = agent.tools[toolIdx].arguments;
          agent.tools[toolIdx].status = 'success';
          agent.tools[toolIdx].result = resultStr;

          // Find matching tool state by name and not ended
          for (const [id, ts] of toolState) {
            if (ts.name === event.data.name && !ts.ended) {
              toolId = id;
              ts.ended = true;
              break;
            }
          }
        }

        // Add to content parts
        const toolRecord: ToolCallRecord = { name: event.data.name, arguments: toolArgs, result: resultStr };
        agent.toolRecords.push(toolRecord);
        if (agent.lastPartType !== 'tool') {
          agent.contentParts.push({ type: 'tool_calls', toolCalls: [] });
          agent.lastPartType = 'tool';
        }
        const lastPart = agent.contentParts[agent.contentParts.length - 1];
        if (lastPart.type === 'tool_calls') {
          lastPart.toolCalls.push(toolRecord);
        }

        if (toolId) {
          await onDelta({
            type: 'tool_end',
            toolId,
            agentId: agentId === 'default' ? undefined : agentId,
            result: resultStr,
          });
        }
      }

      if (isEventType(event, 'llm:end')) {
        const agent = getOrCreateAgent(agentId);
        agent.reasoning = '';
        if (event.data.error) {
          errorInfo = `LLM Error: ${event.data.error}`;
        }
      }

      if (isEventType(event, 'agent:error') && event.data.reason) {
        errorInfo = `Agent Error: ${event.data.reason.msg ?? JSON.stringify(event.data.reason)}`;
      }
    };

    // Process the stream
    try {
      if (eventCollector) {
        const subId = eventCollector.subscribe(async (event) => {
          await handleEventForDelta(event);
        });

        try {
          for await (const _event of stream) {
          }
        } finally {
          eventCollector.unsubscribe(subId);
        }
      } else {
        for await (const event of stream) {
          await handleEventForDelta(event);
        }
      }

      // Emit completion event
      await onDelta({ type: 'completed' });

      // Return finalized messages
      return this.finalize(agents, errorInfo, (update) => {
        // Bridge to legacy update format if needed
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      await onDelta({ type: 'error', error: errMsg });

      const errorMessage: ChatMessage = {
        role: 'system',
        content: `Error: ${errMsg}`,
        timestamp: Date.now(),
      };
      return [errorMessage];
    }
  }
}
