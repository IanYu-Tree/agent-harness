import { useCallback, useRef } from 'react';
import { useApp } from 'ink';
import type { AgentOrch, SessionSummary, OrchEntry } from '@agent-orch/appkit';
import type { HistoryItem, AppMode, SlashCommandDef } from '../types.js';
import { chatMessagesToHistoryItems, allocateId } from '../utils/historyConverter.js';
import { loadUserOrch } from '../utils/loadUserOrch.js';

export const SLASH_COMMANDS: SlashCommandDef[] = [
  { name: '/orch', description: 'Switch orchestration mode' },
  { name: '/orch-load', description: 'Load orch from JS file (args: <path>)' },
  { name: '/session-new', description: 'Create a new session' },
  { name: '/session', description: 'Load a saved session' },
  { name: '/session-delete', description: 'Delete a session' },
  { name: '/debug', description: 'Toggle debug log panel' },
  { name: '/help', description: 'Show this help' },
  { name: '/exit', description: 'Exit the application' },
];

interface CommandActions {
  setMode: (mode: AppMode) => void;
  setHistoryItems: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  setSessionTitle: (title: string | undefined) => void;
  setSessions: (sessions: SessionSummary[]) => void;
  debugVisible: boolean;
  setDebugVisible: (v: boolean) => void;
}

interface ParsedCommand {
  name: string;
  args: string;
}

function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  const spaceIndex = trimmed.indexOf(' ');

  if (spaceIndex === -1) {
    return { name: trimmed.toLowerCase(), args: '' };
  }

  return {
    name: trimmed.slice(0, spaceIndex).toLowerCase(),
    args: trimmed.slice(spaceIndex + 1).trim(),
  };
}

export function useCommands(orch: AgentOrch, actions: CommandActions) {
  const { exit } = useApp();
  const debugRef = useRef(actions.debugVisible);
  debugRef.current = actions.debugVisible;

  const switchToOrch = useCallback((orchId: string) => {
    orch.clearRunnerCache();
    orch.switchOrch(orchId);

    const sessionId = orch.getActiveSessionId();
    if (sessionId) {
      const store = orch.getSessionStore();
      const session = store.load(sessionId);
      if (session) {
        session.orchId = orchId;
        store.save(session);
      }
    }

    actions.setHistoryItems(prev => [
      ...prev,
      { type: 'info', id: allocateId(), text: `Switched to: ${orch.getActiveOrch()?.name ?? orchId}` },
    ]);
  }, [orch, actions]);

  const handleCommand = useCallback((cmd: string) => {
    const { name, args } = parseCommand(cmd);

    switch (name) {
      case '/orch':
        actions.setMode('selectOrch');
        break;

      case '/orch-load':
        if (!args) {
          actions.setMode('inputOrchPath');
        } else {
          loadUserOrch(orch, args)
            .then((entry: OrchEntry) => {
              actions.setHistoryItems(prev => [
                ...prev,
                { type: 'info', id: allocateId(), text: `Loaded orch: ${entry.name} (${entry.id})` },
              ]);
              switchToOrch(entry.id);
            })
            .catch((err: unknown) => {
              actions.setHistoryItems(prev => [
                ...prev,
                { type: 'error', id: allocateId(), text: `Failed to load orch: ${err instanceof Error ? err.message : String(err)}` },
              ]);
            });
        }
        break;

      case '/session-new': {
        const store = orch.getSessionStore();
        orch.clearRunnerCache();
        const session = store.create(orch.getActiveOrchId());
        orch.setActiveSessionId(session.id);
        actions.setHistoryItems([]);
        actions.setSessionTitle(session.title);
        actions.setHistoryItems([
          { type: 'info', id: allocateId(), text: `New session created: ${session.title}` },
        ]);
        break;
      }

      case '/session': {
        const store = orch.getSessionStore();
        actions.setSessions(store.list());
        actions.setMode('sessionLoad');
        break;
      }

      case '/session-delete': {
        const store = orch.getSessionStore();
        actions.setSessions(store.list());
        actions.setMode('sessionDelete');
        break;
      }

      case '/help':
        actions.setHistoryItems(prev => [
          ...prev,
          { type: 'help', id: allocateId(), commands: SLASH_COMMANDS },
        ]);
        break;

      case '/debug':
        actions.setDebugVisible(!debugRef.current);
        break;

      case '/exit':
      case '/quit':
        exit();
        break;

      default:
        actions.setHistoryItems(prev => [
          ...prev,
          { type: 'error', id: allocateId(), text: `Unknown command: ${cmd}. Type /help for available commands.` },
        ]);
    }
  }, [orch, exit, actions, switchToOrch]);

  const handleOrchSelect = useCallback((orchId: string) => {
    switchToOrch(orchId);
    actions.setMode('chat');
  }, [switchToOrch, actions]);

  const handleSessionLoad = useCallback((sessionId: string) => {
    const store = orch.getSessionStore();
    orch.clearRunnerCache();
    const session = store.load(sessionId);
    if (session) {
      orch.setActiveSessionId(session.id);
      actions.setHistoryItems(chatMessagesToHistoryItems(session.messages));
      actions.setSessionTitle(session.title);
      orch.switchOrch(session.orchId);
    }
    actions.setMode('chat');
  }, [orch, actions]);

  const handleSessionDelete = useCallback((sessionId: string) => {
    const store = orch.getSessionStore();
    orch.clearRunnerCache(sessionId);
    store.delete(sessionId);
    if (orch.getActiveSessionId() === sessionId) {
      orch.setActiveSessionId(null);
      actions.setHistoryItems([]);
      actions.setSessionTitle(undefined);
    }
    actions.setHistoryItems(prev => [
      ...prev,
      { type: 'info', id: allocateId(), text: 'Session deleted.' },
    ]);
    actions.setMode('chat');
  }, [orch, actions]);

  const handleOrchPathInput = useCallback((path: string) => {
    if (!path.trim()) {
      actions.setHistoryItems(prev => [
        ...prev,
        { type: 'error', id: allocateId(), text: 'Path cannot be empty. Operation cancelled.' },
      ]);
      actions.setMode('chat');
      return;
    }

    loadUserOrch(orch, path.trim())
      .then((entry: OrchEntry) => {
        actions.setHistoryItems(prev => [
          ...prev,
          { type: 'info', id: allocateId(), text: `Loaded orch: ${entry.name} (${entry.id})` },
        ]);
        switchToOrch(entry.id);
        actions.setMode('chat');
      })
      .catch((err: unknown) => {
        actions.setHistoryItems(prev => [
          ...prev,
          { type: 'error', id: allocateId(), text: `Failed to load orch: ${err instanceof Error ? err.message : String(err)}` },
        ]);
        actions.setMode('chat');
      });
  }, [orch, actions, switchToOrch]);

  return { handleCommand, handleOrchSelect, handleSessionLoad, handleSessionDelete, handleOrchPathInput };
}
