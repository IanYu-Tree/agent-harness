import type { StreamItem } from '@agent-orch/appkit';

export interface SlashCommandDef {
  name: string;
  description: string;
}

export type HistoryItem =
  | StreamItem
  | { type: 'info'; id: number; text: string; color?: string }
  | { type: 'help'; id: number; commands: SlashCommandDef[] };

export type AppMode = 'chat' | 'selectOrch' | 'sessionLoad' | 'sessionDelete' | 'inputOrchPath';
