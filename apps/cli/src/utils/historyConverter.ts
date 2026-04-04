import type { ChatMessage } from '@agent-orch/appkit';
import type { HistoryItem } from '../types.js';

let nextId = 1;

export function resetIdCounter(): void {
  nextId = 1;
}

export function allocateId(): number {
  return nextId++;
}

export function chatMessagesToHistoryItems(messages: ChatMessage[]): HistoryItem[] {
  const items: HistoryItem[] = [];
  for (const msg of messages) {
    if (msg.role === 'user') {
      items.push({ type: 'user', id: allocateId(), text: msg.content });
    } else if (msg.role === 'assistant') {
      if (msg.contentParts && msg.contentParts.length > 0) {
        for (const part of msg.contentParts) {
          if (part.type === 'text' && part.text) {
            items.push({
              type: 'assistant',
              id: allocateId(),
              agentId: msg.agentId,
              text: part.text,
            });
          } else if (part.type === 'tool_calls' && part.toolCalls.length > 0) {
            items.push({
              type: 'tool_group',
              id: allocateId(),
              agentId: msg.agentId,
              tools: part.toolCalls.map(tc => ({
                name: tc.name,
                arguments: tc.arguments,
                status: 'success' as const,
                result: tc.result,
              })),
            });
          }
        }
      } else {
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          items.push({
            type: 'tool_group',
            id: allocateId(),
            agentId: msg.agentId,
            tools: msg.toolCalls.map(tc => ({
              name: tc.name,
              arguments: tc.arguments,
              status: 'success' as const,
              result: tc.result,
            })),
          });
        }
        if (msg.content) {
          items.push({
            type: 'assistant',
            id: allocateId(),
            agentId: msg.agentId,
            text: msg.content,
          });
        }
      }
    } else if (msg.role === 'system') {
      items.push({ type: 'info', id: allocateId(), text: msg.content });
    }
  }
  return items;
}
