import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  Message,
  type StreamEvent,
  type FinishReason,
  type AgentConfig,
  type OrchConfig,
  type MessageRole,
  type MessageFactory,
  type ToolCall,
  type LLM,
} from '@agent-orch/core';
import { defineConfig } from '../define-config.js';
import { SessionStore } from '../session-store.js';
import { AgentOrch } from '../orch.js';
import type { HarnessConfig, OrchEntry } from '../types.js';

class MockMessage extends Message {
  private _role: MessageRole;
  private _content: string;
  private _raw: unknown;

  constructor(params: { role: MessageRole; content: string; raw?: unknown }) {
    super();
    this._role = params.role;
    this._content = params.content;
    this._raw = params.raw ?? {};
  }

  get role(): MessageRole { return this._role; }
  get content(): string { return this._content; }
  toRaw(): unknown { return this._raw; }
}

const mockMessageFactory: MessageFactory = {
  system: (content: string) => new MockMessage({ role: 'system', content }),
  user: (content: string) => new MockMessage({ role: 'user', content }),
  assistant: (content: string) => new MockMessage({ role: 'assistant', content }),
  toolCall: (toolCalls: ToolCall[], raw?: unknown) => new MockMessage({ role: 'tool_call', content: '', raw }),
  toolResult: (toolCallId: string, content: string) => new MockMessage({ role: 'tool_result', content }),
};

describe('defineConfig', () => {
  it('should return config as-is', () => {
    const config: HarnessConfig = {
      orchs: [{ id: 'test', name: 'Test', config: { id: 'o', type: 'singleAgent', agents: {} } }],
    };
    expect(defineConfig(config)).toBe(config);
  });
});

describe('SessionStore', () => {
  let dir: string;
  let store: SessionStore;

  beforeEach(() => {
    dir = join(tmpdir(), `agent-orch-test-${Date.now()}`);
    store = new SessionStore(dir);
  });

  afterEach(() => {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should create and load a session', () => {
    const session = store.create('orch1', 'My Session');
    expect(session.orchId).toBe('orch1');
    expect(session.title).toBe('My Session');
    expect(session.messages).toEqual([]);

    const loaded = store.load(session.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe(session.id);
    expect(loaded!.title).toBe('My Session');
  });

  it('should add messages to session', () => {
    const session = store.create('orch1');
    store.addMessage(session.id, { role: 'user', content: 'hello', timestamp: Date.now() });
    store.addMessage(session.id, { role: 'assistant', content: 'hi', timestamp: Date.now() });

    const loaded = store.load(session.id);
    expect(loaded!.messages).toHaveLength(2);
    expect(loaded!.messages[0].content).toBe('hello');
    expect(loaded!.messages[1].content).toBe('hi');
  });

  it('should list sessions sorted by updatedAt desc', () => {
    const s1 = store.create('orch1', 'First');
    const s2 = store.create('orch1', 'Second');

    store.addMessage(s1.id, { role: 'user', content: 'msg', timestamp: Date.now() });

    const list = store.list();
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(s1.id);
    expect(list[0].messageCount).toBe(1);
  });

  it('should delete a session', () => {
    const session = store.create('orch1');
    expect(store.delete(session.id)).toBe(true);
    expect(store.load(session.id)).toBeNull();
    expect(store.delete(session.id)).toBe(false);
  });

  it('should update title', () => {
    const session = store.create('orch1', 'Old Title');
    store.updateTitle(session.id, 'New Title');

    const loaded = store.load(session.id);
    expect(loaded!.title).toBe('New Title');
  });

  it('should return null for non-existent session', () => {
    expect(store.load('non-existent')).toBeNull();
  });
});

describe('AgentOrch', () => {
  const sampleOrch: OrchEntry = {
    id: 'test-orch',
    name: 'Test Orch',
    config: {
      id: 'test-config',
      type: 'singleAgent',
      agents: {
        agent: {
          agentId: 'test-agent',
          prompt: 'You are a test agent.',
          llmConfig: { modelId: 'openai/gpt-4o' },
        },
      },
    },
  };

  it('should list orchs', () => {
    const orch = new AgentOrch({
      orchs: [sampleOrch],
      sessionDir: join(tmpdir(), `ah-test-${Date.now()}`),
    });
    const list = orch.listOrchs();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('test-orch');
    expect(list[0].name).toBe('Test Orch');
  });

  it('should switch orch', () => {
    const orch = new AgentOrch({
      orchs: [
        sampleOrch,
        { id: 'orch2', name: 'Orch 2', config: { id: 'o2', type: 'singleAgent', agents: {} } },
      ],
      sessionDir: join(tmpdir(), `ah-test-${Date.now()}`),
    });
    expect(orch.getActiveOrchId()).toBe('test-orch');
    expect(orch.switchOrch('orch2')).toBe(true);
    expect(orch.getActiveOrchId()).toBe('orch2');
    expect(orch.switchOrch('non-existent')).toBe(false);
  });

  it('should manage active session', () => {
    const orch = new AgentOrch({
      orchs: [sampleOrch],
      sessionDir: join(tmpdir(), `ah-test-${Date.now()}`),
    });
    expect(orch.getActiveSessionId()).toBeNull();
    orch.setActiveSessionId('some-id');
    expect(orch.getActiveSessionId()).toBe('some-id');
  });
});
