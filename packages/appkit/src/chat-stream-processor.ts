import type { StreamEvent, ToolCallRecord } from '@agent-orch/core';
import { isEventType, type StreamEventCollector } from '@agent-orch/core';
import type { ChatMessage, ChatStreamUpdate, ContentPart, StreamItem, ToolItemState } from './types.js';

interface AgentAccumulator {
  agentId: string;
  reasoning: string;
  content: string;
  tools: ToolItemState[];
  toolRecords: ToolCallRecord[];
  contentParts: ContentPart[];
  lastPartType: 'text' | 'tool' | null;
}

let nextStreamId = -1;

function allocateStreamId(): number {
  return nextStreamId--;
}

export function resetStreamIdCounter(): void {
  nextStreamId = -1;
}

export class ChatStreamProcessor {
  private getOrCreateAgent(agents: Map<string, AgentAccumulator>, agentId: string): AgentAccumulator {
    let agent = agents.get(agentId);
    if (!agent) {
      agent = { agentId, reasoning: '', content: '', tools: [], toolRecords: [], contentParts: [], lastPartType: null };
      agents.set(agentId, agent);
    }
    return agent;
  }

  private buildPendingItems(agents: Map<string, AgentAccumulator>): StreamItem[] {
    const items: StreamItem[] = [];

    for (const agent of agents.values()) {
      const agentId = agent.agentId === 'default' ? undefined : agent.agentId;

      if (agent.reasoning) {
        items.push({ type: 'thinking', id: allocateStreamId(), agentId, thought: agent.reasoning });
      }

      for (const part of agent.contentParts) {
        if (part.type === 'text' && part.text) {
          items.push({ type: 'assistant', id: allocateStreamId(), agentId, text: part.text });
        } else if (part.type === 'tool_calls' && part.toolCalls.length > 0) {
          items.push({
            type: 'tool_group', id: allocateStreamId(), agentId,
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
        items.push({ type: 'tool_group', id: allocateStreamId(), agentId, tools: [...runningTools] });
      }

      if (!agent.reasoning && agent.contentParts.length === 0 && agent.tools.length === 0) {
        items.push({ type: 'spinner', id: allocateStreamId(), label: `${agentId ?? 'AI'} thinking...` });
      }
    }

    if (agents.size === 0) {
      items.push({ type: 'spinner', id: allocateStreamId(), label: 'processing...' });
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

  async processStream(
    stream: AsyncGenerator<StreamEvent, void>,
    onUpdate: (update: ChatStreamUpdate) => void,
    eventCollector?: StreamEventCollector,
  ): Promise<ChatMessage[]> {
    const agents = new Map<string, AgentAccumulator>();
    let errorInfo = '';
    resetStreamIdCounter();

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
}
