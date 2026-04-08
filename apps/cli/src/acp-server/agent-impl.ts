import type * as acp from '@agentclientprotocol/sdk';
import { PROTOCOL_VERSION } from '@agentclientprotocol/sdk/dist/schema/index.js';
import type { AgentOrch, StreamItem, ChatMessage } from '@agent-orch/appkit';
import { ChatStreamProcessor } from '@agent-orch/appkit';
import { randomUUID } from 'crypto';

interface Session {
  id: string;
  cwd: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
}

export class AgentOrchACP implements acp.Agent {
  private orch: AgentOrch;
  private sessions: Map<string, Session> = new Map();
  private processor: ChatStreamProcessor;
  private activeStreams: Map<string, AbortController> = new Map();

  constructor(orch: AgentOrch) {
    this.orch = orch;
    this.processor = new ChatStreamProcessor();
  }

  async initialize(params: acp.InitializeRequest): Promise<acp.InitializeResponse> {
    return {
      protocolVersion: String(PROTOCOL_VERSION),
      agentCapabilities: {
        promptCapabilities: {
          streaming: true,
        },
        mcpCapabilities: {
          tools: true,
        },
      },
    };
  }

  async authenticate(params: acp.AuthenticateRequest): Promise<acp.AuthenticateResponse> {
    // 无需认证
    return {};
  }

  async newSession(params: acp.NewSessionRequest): Promise<acp.NewSessionResponse> {
    const sessionId = randomUUID();
    const session: Session = {
      id: sessionId,
      cwd: params.cwd,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.sessions.set(sessionId, session);

    // 创建 AgentOrch 会话
    const store = this.orch.getSessionStore();
    const orchId = this.orch.getActiveOrch()?.id ?? 'single';
    const storeSessionId = store.create(orchId, 'New Session');

    // 保存映射关系
    (session as unknown as Record<string, string>).storeSessionId = storeSessionId;

    return {
      sessionId,
      title: 'New Session',
    };
  }

  async prompt(params: acp.PromptRequest): Promise<acp.PromptResponse> {
    const { sessionId, prompt } = params;
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // 获取用户输入
    const userMessage = prompt.find(p => p.type === 'text')?.text ?? '';
    if (!userMessage.trim()) {
      return { stopReason: 'complete' };
    }

    // 获取 storeSessionId
    const storeSessionId = (session as unknown as Record<string, string>).storeSessionId;
    this.orch.setActiveSessionId(storeSessionId);

    // 创建 AbortController 用于取消
    const abortController = new AbortController();
    this.activeStreams.set(sessionId, abortController);

    try {
      // 处理流
      const gen = this.orch.chatStream(userMessage);

      await this.processor.processStream(gen, (update) => {
        if (abortController.signal.aborted) {
          return;
        }

        if (update.type === 'items-changed') {
          // 流式输出更新
          // 这里需要通过某种方式通知客户端，但 ACP SDK 的 HTTP 传输需要特殊处理
        }

        if (update.type === 'items-finalized' || update.type === 'error') {
          // 流结束
        }
      }, this.orch.getEventCollector());

      return { stopReason: 'complete' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        stopReason: 'error',
        error: errorMessage,
      };
    } finally {
      this.activeStreams.delete(sessionId);
    }
  }

  async cancel(params: acp.CancelNotification): Promise<void> {
    const { sessionId } = params;
    const controller = this.activeStreams.get(sessionId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(sessionId);
    }
  }

  async setSessionMode(params: acp.SetSessionModeRequest): Promise<acp.SetSessionModeResponse> {
    // 切换编排模式
    const { sessionId, modeId } = params;

    // AgentOrch 支持切换 orch
    const success = this.orch.switchOrch(modeId);

    return {
      modeId,
      availableModes: this.orch.listOrchs().map(o => ({
        id: o.id,
        name: o.name,
      })),
    };
  }

  async setSessionConfigOption(params: acp.SetSessionConfigOptionRequest): Promise<acp.SetSessionConfigOptionResponse> {
    return {
      options: [],
    };
  }
}
