import { Readable, Writable } from 'node:stream';
import * as acp from '@agentclientprotocol/sdk';
import { PROTOCOL_VERSION } from '@agentclientprotocol/sdk/dist/schema/index.js';
import type { AgentOrch, ChatMessage } from '@agent-orch/appkit';
import { ChatStreamProcessor } from '@agent-orch/appkit';

interface Session {
  id: string;
  cwd: string;
  storeSessionId: string;
  orchId: string;
  abortController?: AbortController;
}

class AgentOrchACP implements acp.Agent {
  private orch: AgentOrch;
  private sessions: Map<string, Session> = new Map();
  private processor: ChatStreamProcessor;
  private connection?: acp.AgentSideConnection;

  constructor(orch: AgentOrch, connection: acp.AgentSideConnection) {
    this.orch = orch;
    this.processor = new ChatStreamProcessor();
    this.connection = connection;
  }

  async initialize(_params: acp.InitializeRequest): Promise<acp.InitializeResponse> {
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

  async authenticate(_params: acp.AuthenticateRequest): Promise<acp.AuthenticateResponse> {
    return {};
  }

  async newSession(params: acp.NewSessionRequest): Promise<acp.NewSessionResponse> {
    const sessionId = crypto.randomUUID();

    // 创建 AgentOrch 会话
    const store = this.orch.getSessionStore();
    const orchId = this.orch.getActiveOrch()?.id ?? 'single';
    const storeSessionId = store.create(orchId, 'ACP Session');

    const session: Session = {
      id: sessionId,
      cwd: params.cwd,
      storeSessionId,
      orchId,
    };
    this.sessions.set(sessionId, session);

    return {
      sessionId,
      title: 'ACP Session',
    };
  }

  async prompt(params: acp.PromptRequest): Promise<acp.PromptResponse> {
    const { sessionId, prompt } = params;
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // 获取用户输入
    const userMessage = prompt.find((p: acp.ContentBlock) => p.type === 'text')?.text ?? '';
    if (!userMessage.trim()) {
      return { stopReason: 'end_turn' };
    }

    // 设置当前会话
    this.orch.setActiveSessionId(session.storeSessionId);

    // 创建 AbortController 用于取消
    session.abortController = new AbortController();

    try {
      // 开始流式处理
      const gen = this.orch.chatStream(userMessage);

      const finalizedMessages = await this.processor.processStream(
        gen,
        async (update) => {
          if (session.abortController?.signal.aborted) {
            return;
          }

          if (update.type === 'items-changed' && this.connection) {
            // 发送流式更新
            for (const item of update.pendingItems) {
              if (item.type === 'assistant') {
                await this.connection.sessionUpdate({
                  sessionId,
                  update: {
                    sessionUpdate: 'agent_message_chunk',
                    content: {
                      type: 'text',
                      text: item.text,
                    },
                  },
                });
              } else if (item.type === 'thinking') {
                await this.connection.sessionUpdate({
                  sessionId,
                  update: {
                    sessionUpdate: 'agent_message_chunk',
                    content: {
                      type: 'text',
                      text: `\n[Thinking] ${item.thought}\n`,
                    },
                  },
                });
              } else if (item.type === 'tool_group') {
                for (const tool of item.tools) {
                  await this.connection.sessionUpdate({
                    sessionId,
                    update: {
                      sessionUpdate: 'tool_call',
                      toolCallId: tool.name,
                      title: tool.name,
                      kind: 'read',
                      status: tool.status === 'running' ? 'pending' : 'completed',
                      rawInput: tool.arguments ? JSON.parse(tool.arguments) : {},
                    },
                  });
                }
              }
            }
          }
        },
        this.orch.getEventCollector()
      );

      // 保存消息
      this.orch.saveSessionMessages(finalizedMessages);

      return { stopReason: 'end_turn' };
    } catch (error) {
      if (session.abortController?.signal.aborted) {
        return { stopReason: 'cancelled' };
      }
      throw error;
    } finally {
      session.abortController = undefined;
    }
  }

  async cancel(params: acp.CancelNotification): Promise<void> {
    const { sessionId } = params;
    const session = this.sessions.get(sessionId);
    if (session?.abortController) {
      session.abortController.abort();
    }
  }

  async setSessionMode(params: acp.SetSessionModeRequest): Promise<acp.SetSessionModeResponse> {
    const { sessionId, modeId } = params;
    const session = this.sessions.get(sessionId);

    if (session) {
      const success = this.orch.switchOrch(modeId);
      if (success) {
        session.orchId = modeId;
      }
    }

    return {
      modeId,
      availableModes: this.orch.listOrchs().map(o => ({
        id: o.id,
        name: o.name ?? o.id,
      })),
    };
  }

  async setSessionConfigOption(
    _params: acp.SetSessionConfigOptionRequest
  ): Promise<acp.SetSessionConfigOptionResponse> {
    return {
      options: [],
    };
  }
}

export interface StdioACPServerOptions {
  orch: AgentOrch;
}

export function startStdioACPServer(options: StdioACPServerOptions): void {
  const { orch } = options;

  // 创建 stdio 流
  const input = Writable.toWeb(process.stdout);
  const output = Readable.toWeb(process.stdin);
  const stream = acp.ndJsonStream(input, output);

  // 创建 AgentSideConnection
  const connection = new acp.AgentSideConnection(
    (conn) => new AgentOrchACP(orch, conn),
    stream
  );

  // 连接会在 stream 结束时自动关闭
  connection.closed.then(() => {
    process.exit(0);
  });
}
