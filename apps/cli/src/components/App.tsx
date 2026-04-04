import React, { useState, useEffect, useMemo } from 'react';
import { Box, Static, useInput, useStdout } from 'ink';
import type { AgentOrch, SessionSummary } from '@agent-orch/appkit';
import type { HistoryItem, AppMode } from '../types.js';
import { chatMessagesToHistoryItems, resetIdCounter } from '../utils/historyConverter.js';
import { HistoryItemDisplay } from './HistoryItemDisplay.js';
import { useStreamHandler } from '../hooks/useStreamHandler.js';
import { useCommands, SLASH_COMMANDS } from '../hooks/useCommands.js';
import { Composer } from './Composer.js';
import { DebugPanel } from './DebugPanel.js';
import { OrchSelector } from './OrchSelector.js';
import { SessionManager } from './SessionManager.js';

export interface AppProps {
  orch: AgentOrch;
}

export const App: React.FC<AppProps> = ({ orch }) => {
  const [mode, setMode] = useState<AppMode>('chat');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [sessionTitle, setSessionTitle] = useState<string | undefined>();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [debugVisible, setDebugVisible] = useState(false);
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);

  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns ?? 80;

  const activeOrch = orch.getActiveOrch();
  const orchName = activeOrch?.name ?? 'Unknown';

  useEffect(() => {
    resetIdCounter();
    const store = orch.getSessionStore();
    const list = store.list();
    if (list.length > 0) {
      const latest = list[0];
      const session = store.load(latest.id);
      if (session) {
        orch.setActiveSessionId(session.id);
        orch.switchOrch(session.orchId);
        setHistoryItems(chatMessagesToHistoryItems(session.messages));
        setSessionTitle(session.title);
      }
    }
  }, [orch]);

  const { isStreaming, pendingItems, submitMessage } = useStreamHandler(
    orch,
    setHistoryItems,
    setSessionTitle,
  );

  useEffect(() => {
    if (!isStreaming && queuedMessage) {
      submitMessage(queuedMessage);
      setQueuedMessage(null);
    }
  }, [isStreaming, queuedMessage, submitMessage]);

  const commandActions = useMemo(() => ({
    setMode,
    setHistoryItems,
    setSessionTitle,
    setSessions,
    debugVisible,
    setDebugVisible,
  }), [debugVisible]);

  const { handleCommand, handleOrchSelect, handleSessionLoad, handleSessionDelete, handleOrchPathInput } = useCommands(
    orch,
    commandActions,
  );

  useInput((_input, key) => {
    if (key.escape && mode !== 'chat') {
      if (mode === 'inputOrchPath') {
        setHistoryItems(prev => [...prev, { type: 'info', id: Date.now(), text: 'Orch load cancelled.' }]);
      }
      setMode('chat');
    }
  });

  const handleSubmit = (value: string) => {
    if (value.startsWith('/')) {
      handleCommand(value);
    } else {
      submitMessage(value);
    }
  };

  const handleQueue = (msg: string) => {
    setQueuedMessage(msg);
  };

  return (
    <Box flexDirection="column">
      <Static items={historyItems}>
        {(item) => (
          <Box key={item.id}>
            <HistoryItemDisplay item={item} width={terminalWidth} />
          </Box>
        )}
      </Static>

      <Box flexDirection="column">
        {pendingItems.map((item) => (
          <HistoryItemDisplay key={item.id} item={item} width={terminalWidth} />
        ))}

        {(mode === 'chat' || mode === 'inputOrchPath') && (
          <Composer
            onSubmit={mode === 'inputOrchPath' ? handleOrchPathInput : handleSubmit}
            isStreaming={isStreaming}
            orchName={orchName}
            sessionTitle={sessionTitle}
            commands={SLASH_COMMANDS}
            queuedMessage={queuedMessage}
            onQueue={handleQueue}
            placeholder={mode === 'inputOrchPath' ? 'Enter path to orch file...' : undefined}
            prompt={mode === 'inputOrchPath' ? 'Path:' : undefined}
          />
        )}

        {mode === 'selectOrch' && (
          <OrchSelector
            orchs={orch.listOrchs()}
            onSelect={(orchId) => handleOrchSelect(orchId)}
            onCancel={() => setMode('chat')}
          />
        )}

        {mode === 'sessionLoad' && (
          <SessionManager
            sessions={sessions}
            mode="load"
            onSelect={handleSessionLoad}
            onCancel={() => setMode('chat')}
          />
        )}

        {mode === 'sessionDelete' && (
          <SessionManager
            sessions={sessions}
            mode="delete"
            onSelect={handleSessionDelete}
            onCancel={() => setMode('chat')}
          />
        )}

        {debugVisible && <DebugPanel />}
      </Box>
    </Box>
  );
};
