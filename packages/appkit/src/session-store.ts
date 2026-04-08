import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { SessionData, SessionSummary, ChatMessage } from './types.js';

const SESSION_FILE_EXT = '.json';

export class SessionStore {
  private dir: string;
  private cache: Map<string, SessionData> = new Map();

  constructor(dir: string) {
    this.dir = dir;
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, { recursive: true });
    }
  }

  private filePath(sessionId: string): string {
    return join(this.dir, `${sessionId}${SESSION_FILE_EXT}`);
  }

  create(orchId: string, title?: string): SessionData {
    const session: SessionData = {
      id: randomUUID(),
      orchId,
      title: title ?? `Session ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.cache.set(session.id, session);
    this.save(session);
    return session;
  }

  load(sessionId: string): SessionData | null {
    const cached = this.cache.get(sessionId);
    if (cached) return cached;
    const fp = this.filePath(sessionId);
    if (!existsSync(fp)) return null;
    try {
      const raw = readFileSync(fp, 'utf-8');
      const session = JSON.parse(raw) as SessionData;
      this.cache.set(sessionId, session);
      return session;
    } catch {
      return null;
    }
  }

  save(session: SessionData): void {
    session.updatedAt = Date.now();
    this.cache.set(session.id, session);
    writeFileSync(this.filePath(session.id), JSON.stringify(session, null, 2), 'utf-8');
  }

  delete(sessionId: string): boolean {
    this.cache.delete(sessionId);
    const fp = this.filePath(sessionId);
    if (!existsSync(fp)) return false;
    unlinkSync(fp);
    return true;
  }

  list(): SessionSummary[] {
    if (!existsSync(this.dir)) return [];
    const files = readdirSync(this.dir).filter(f => f.endsWith(SESSION_FILE_EXT));
    const summaries: SessionSummary[] = [];

    for (const file of files) {
      try {
        const raw = readFileSync(join(this.dir, file), 'utf-8');
        const data = JSON.parse(raw) as SessionData;
        summaries.push({
          id: data.id,
          orchId: data.orchId,
          title: data.title,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          messageCount: data.messages.length,
        });
      } catch {
        // skip corrupted files
      }
    }

    return summaries.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  addMessage(sessionId: string, message: ChatMessage): void {
    const session = this.load(sessionId);
    if (!session) return;
    session.messages.push(message);
    this.save(session);
  }

  updateTitle(sessionId: string, title: string): void {
    const session = this.load(sessionId);
    if (!session) return;
    session.title = title;
    this.save(session);
  }
}
