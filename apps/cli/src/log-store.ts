import type { LogLevel } from '@agent-orch/core';

export interface LogEntry {
  level: LogLevel;
  prefix: string;
  message: string;
  timestamp: number;
}

type LogListener = (entry: LogEntry) => void;

const MAX_ENTRIES = 200;

class LogStore {
  private entries: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();

  push(level: LogLevel, prefix: string, message: string): void {
    const entry: LogEntry = { level, prefix, message, timestamp: Date.now() };
    this.entries.push(entry);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES);
    }
    this.listeners.forEach((fn) => fn(entry));
  }

  getAll(): LogEntry[] {
    return this.entries;
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  clear(): void {
    this.entries = [];
  }
}

export const logStore = new LogStore();
