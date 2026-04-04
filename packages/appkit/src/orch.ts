import type {
  AgentConfig,
  OrchConfig,
  StreamEvent,
  Tool,
  LLMConfig,
  UserInput,
  LLM,
  HistoryMessage,
} from '@agent-orch/core';
import { StreamEventCollector, isOrchConfig } from '@agent-orch/core';
import { createLLM } from '@agent-orch/llm';
import { PatternFactory } from '@agent-orch/orch';
import type { PatternRunner } from '@agent-orch/orch';
import type { HarnessConfig, OrchEntry, ChatMessage } from './types.js';
import { SessionStore } from './session-store.js';
import { join } from 'node:path';
import { homedir } from 'node:os';

const DEFAULT_SESSION_DIR = join(homedir(), '.agent-orch', 'sessions');

interface CachedRunner {
  runner: PatternRunner;
  orchId: string;
}

export class AgentOrch {
  private config: HarnessConfig;
  private activeOrchId: string;
  private eventCollector: StreamEventCollector;
  private sessionStore: SessionStore;
  private activeSessionId: string | null = null;
  private runnerCache: Map<string, CachedRunner> = new Map();
  private factory: PatternFactory;

  constructor(config: HarnessConfig) {
    this.config = config;
    this.activeOrchId = config.defaultOrchId ?? config.orchs[0]?.id ?? '';
    this.eventCollector = new StreamEventCollector();
    this.sessionStore = new SessionStore(config.sessionDir ?? DEFAULT_SESSION_DIR);

    const makeLLM = (llmConfig: LLMConfig): LLM => {
      const merged: LLMConfig = { ...this.config.defaultLLMConfig, ...llmConfig };
      return createLLM(merged);
    };

    this.factory = new PatternFactory({
      createLLM: makeLLM,
    });
  }

  listOrchs(): Pick<OrchEntry, 'id' | 'name' | 'description'>[] {
    return this.config.orchs.map(({ id, name, description }) => ({ id, name, description }));
  }

  getActiveOrchId(): string {
    return this.activeOrchId;
  }

  getActiveOrch(): OrchEntry | undefined {
    return this.config.orchs.find(o => o.id === this.activeOrchId);
  }

  switchOrch(orchId: string): boolean {
    const entry = this.config.orchs.find(o => o.id === orchId);
    if (!entry) return false;
    this.activeOrchId = orchId;
    return true;
  }

  registerOrch(entry: OrchEntry): boolean {
    const existingIndex = this.config.orchs.findIndex(o => o.id === entry.id);
    if (existingIndex >= 0) {
      this.config.orchs[existingIndex] = entry;
    } else {
      this.config.orchs.push(entry);
    }
    return true;
  }

  unregisterOrch(orchId: string): boolean {
    const initialLength = this.config.orchs.length;
    this.config.orchs = this.config.orchs.filter(o => o.id !== orchId);
    return this.config.orchs.length < initialLength;
  }

  getSessionStore(): SessionStore {
    return this.sessionStore;
  }

  getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  setActiveSessionId(sessionId: string | null): void {
    this.activeSessionId = sessionId;
  }

  getEventCollector(): StreamEventCollector {
    return this.eventCollector;
  }

  private getOrCreateRunner(sessionId: string, orchEntry: OrchEntry): PatternRunner {
    const cached = this.runnerCache.get(sessionId);
    if (cached && cached.orchId === orchEntry.id) {
      return cached.runner;
    }
    const orchConfig = this.injectGlobalTools(orchEntry.config);
    const runner = this.factory.create(orchConfig);
    this.runnerCache.set(sessionId, { runner, orchId: orchEntry.id });
    return runner;
  }

  clearRunnerCache(sessionId?: string): void {
    if (sessionId) {
      this.runnerCache.delete(sessionId);
    } else {
      this.runnerCache.clear();
    }
  }

  async *chatStream(userInput: string): AsyncGenerator<StreamEvent, void> {
    const orchEntry = this.getActiveOrch();
    if (!orchEntry) {
      yield {
        type: 'agent:error',
        timestamp: Date.now(),
        data: { reason: { type: 'error', msg: `No orch found with id: ${this.activeOrchId}` } },
      } as StreamEvent;
      return;
    }

    const sessionId = this.activeSessionId ?? '__ephemeral__';
    const runner = this.getOrCreateRunner(sessionId, orchEntry);
    const input: UserInput = [{ type: 'text', text: userInput }];

    // Load history without the current user input - let LLM provider handle it
    const historyMessages: HistoryMessage[] = [];
    if (this.activeSessionId) {
      const session = this.sessionStore.load(this.activeSessionId);
      if (session) {
        for (const msg of session.messages) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            historyMessages.push({ role: msg.role, content: msg.content });
          }
        }
      }
    }

    const gen = runner.run(input, {
      eventPublisher: (event: StreamEvent) => this.eventCollector.publish(event),
      historyMessages: historyMessages.length > 0 ? historyMessages : undefined,
    });

    while (true) {
      const { value, done } = await gen.next();
      if (done) break;
      this.eventCollector.publish(value);
      yield value;
    }
  }

  saveSessionMessages(messages: ChatMessage[]): void {
    if (!this.activeSessionId) return;
    for (const msg of messages) {
      this.sessionStore.addMessage(this.activeSessionId, msg);
    }
  }

  private injectGlobalTools(orchConfig: OrchConfig): OrchConfig {
    const globalTools = this.config.globalTools;
    if (!globalTools || globalTools.length === 0) return orchConfig;

    const cloned: OrchConfig = { ...orchConfig, agents: { ...orchConfig.agents } };
    for (const key of Object.keys(cloned.agents)) {
      const agentOrOrch = cloned.agents[key];
      if (isOrchConfig(agentOrOrch)) {
        cloned.agents[key] = this.injectGlobalTools(agentOrOrch);
      } else {
        const agentConfig = agentOrOrch as AgentConfig;
        cloned.agents[key] = {
          ...agentConfig,
          tools: [...(agentConfig.tools ?? []), ...globalTools],
        };
      }
    }
    return cloned;
  }
}
