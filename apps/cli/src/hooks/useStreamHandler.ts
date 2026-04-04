import { useState, useCallback, useMemo } from 'react';
import type { AgentOrch, StreamItem } from '@agent-orch/appkit';
import { ChatStreamProcessor } from '@agent-orch/appkit';
import type { HistoryItem } from '../types.js';
import { chatMessagesToHistoryItems, allocateId } from '../utils/historyConverter.js';

interface StreamHandlerResult {
  isStreaming: boolean;
  pendingItems: StreamItem[];
  submitMessage: (value: string) => void;
}

export function useStreamHandler(
  orch: AgentOrch,
  setHistoryItems: React.Dispatch<React.SetStateAction<HistoryItem[]>>,
  setSessionTitle: (title: string | undefined) => void,
): StreamHandlerResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingItems, setPendingItems] = useState<StreamItem[]>([]);
  const processor = useMemo(() => new ChatStreamProcessor(), []);

  const submitMessage = useCallback(async (value: string) => {
    if (!orch.getActiveOrch()) return;

    if (!orch.getActiveSessionId()) {
      const store = orch.getSessionStore();
      const orchId = orch.getActiveOrch()!.id;
      const sessionId = store.create(orchId, value.slice(0, 50));
      orch.setActiveSessionId(sessionId);
      const session = store.load(sessionId);
      if (session) setSessionTitle(session.title);
    }

    const userItem: HistoryItem = { type: 'user', id: allocateId(), text: value };
    setHistoryItems(prev => [...prev, userItem]);

    setIsStreaming(true);

    const gen = orch.chatStream(value);
    const finalizedMessages = await processor.processStream(gen, (update) => {
      if (update.type === 'items-changed') {
        setPendingItems(update.pendingItems);
      }
      if (update.type === 'items-finalized' || update.type === 'error') {
        if (update.finalizedMessages) {
          const newItems = chatMessagesToHistoryItems(update.finalizedMessages);
          setHistoryItems(prev => [...prev, ...newItems]);
        }
        setPendingItems([]);
        setIsStreaming(false);
      }
    }, orch.getEventCollector());

    orch.saveSessionMessages(finalizedMessages);
  }, [orch, setHistoryItems, setSessionTitle, processor]);

  return { isStreaming, pendingItems, submitMessage };
}
