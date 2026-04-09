import type * as acp from '@agentclientprotocol/sdk';
import { PROTOCOL_VERSION } from '@agentclientprotocol/sdk/dist/schema/index.js';
import type { AgentOrch, ChatMessage } from '@agent-orch/appkit';
import { ChatStreamProcessor } from '@agent-orch/appkit';
import type { StreamDeltaEvent } from '@agent-orch/appkit';
import type { SessionData } from '@agent-orch/appkit';

interface Session {
  id: string;
  cwd: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  additionalDirectories?: string[];
  mcpServers?: acp.McpServer[];
  storeSessionId?: string;
  orchId?: string;
  abortController?: AbortController;
}

/**
 * AgentOrchACP - ACP Protocol implementation for Agent Orchestration
 *
 * This class bridges the Agent Orchestration framework with the
 * Agent Client Protocol (ACP) for IDE integration.
 */
export class AgentOrchACP implements acp.Agent {
  private orch: AgentOrch;
  private sessions: Map<string, Session> = new Map();
  private processor: ChatStreamProcessor;
  private connection?: acp.AgentSideConnection;
  private activeStreams: Map<string, AbortController> = new Map();

  constructor(orch: AgentOrch, connection?: acp.AgentSideConnection) {
    this.orch = orch;
    this.processor = new ChatStreamProcessor();
    this.connection = connection;
  }

  async initialize(params: acp.InitializeRequest): Promise<acp.InitializeResponse> {
    // Validate protocol version compatibility
    const requestedVersion = params.protocolVersion;
    if (typeof requestedVersion === 'number' && requestedVersion < 1) {
      // Protocol version too old, but we'll still work with it
      console.warn(`Warning: Client requested protocol version ${requestedVersion}, using version ${PROTOCOL_VERSION}`);
    }

    return {
      protocolVersion: PROTOCOL_VERSION,
      agentCapabilities: {
        promptCapabilities: {
          streaming: true,
        },
        mcpCapabilities: {
          tools: true,
        },
        loadSession: true,
        listSessions: true,
        session: {
          resume: true,
          close: true,
        },
      },
    };
  }

  async authenticate(_params: acp.AuthenticateRequest): Promise<acp.AuthenticateResponse> {
    return {};
  }

  async newSession(params: acp.NewSessionRequest): Promise<acp.NewSessionResponse> {
    const store = this.orch.getSessionStore();
    const orchId = this.orch.getActiveOrch()?.id ?? 'single';

    // First create the store session to get the ID
    // Use Store's ID as ACP sessionId to ensure they match
    const storeSession = store.create(orchId, 'New Session');
    const sessionId = storeSession.id;

    const session: Session = {
      id: sessionId,
      cwd: params.cwd,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      additionalDirectories: params.additionalDirectories ?? undefined,
      mcpServers: params.mcpServers ?? undefined,
      storeSessionId: sessionId,
      orchId,
    };
    this.sessions.set(sessionId, session);

    return {
      sessionId,
    };
  }

  async prompt(params: acp.PromptRequest): Promise<acp.PromptResponse> {
    const { sessionId, prompt } = params;
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const userMessage = prompt.find(p => p.type === 'text')?.text ?? '';
    if (!userMessage.trim()) {
      return { stopReason: 'end_turn' };
    }

    const storeSessionId = session.storeSessionId;
    if (!storeSessionId) {
      throw new Error(`Session store ID not found: ${sessionId}`);
    }
    this.orch.setActiveSessionId(storeSessionId);

    const abortController = new AbortController();
    this.activeStreams.set(sessionId, abortController);

    try {
      const gen = this.orch.chatStream(userMessage);

      // Use the new incremental API - no more manual delta tracking!
      const finalizedMessages = await this.processor.processIncremental(
        gen,
        async (event: StreamDeltaEvent) => {
          if (abortController.signal.aborted) {
            return;
          }

          if (!this.connection) {
            return;
          }

          try {
            switch (event.type) {
              case 'text_delta': {
                // Directly send the delta - Processor already computed it
                // Include messageId so IDE can correctly merge chunks
                await this.connection.sessionUpdate({
                  sessionId,
                  update: {
                    sessionUpdate: 'agent_message_chunk',
                    messageId: event.itemId,
                    content: {
                      type: 'text',
                      text: event.delta,
                    },
                  },
                });
                break;
              }

              case 'thinking': {
                // Use agent_thought_chunk for thinking content
                await this.connection.sessionUpdate({
                  sessionId,
                  update: {
                    sessionUpdate: 'agent_thought_chunk',
                    messageId: event.agentId ? `${event.agentId}-thought` : 'thought',
                    content: {
                      type: 'text',
                      text: event.thought,
                    },
                  },
                });
                break;
              }

              case 'tool_start': {
                await this.connection.sessionUpdate({
                  sessionId,
                  update: {
                    sessionUpdate: 'tool_call',
                    toolCallId: event.toolId,
                    title: event.name,
                    kind: 'read',
                    status: 'in_progress',
                    rawInput: event.arguments ? JSON.parse(event.arguments) : {},
                  },
                });
                break;
              }

              case 'tool_end': {
                await this.connection.sessionUpdate({
                  sessionId,
                  update: {
                    sessionUpdate: 'tool_call_update',
                    toolCallId: event.toolId,
                    status: 'completed',
                  },
                });
                break;
              }

              case 'completed':
              case 'error':
                // Stream completion is handled by return value
                break;
            }
          } catch (error) {
            // Connection errors during streaming are non-fatal
            console.error('Error sending ACP update:', error);
          }
        },
        this.orch.getEventCollector()
      );

      this.orch.saveSessionMessages(finalizedMessages);

      return { stopReason: 'end_turn' };
    } catch (error) {
      if (abortController.signal.aborted) {
        return { stopReason: 'cancelled' };
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Log error but don't include in response - PromptResponse only has stopReason
      console.error('Prompt error:', errorMessage);
      return {
        stopReason: 'end_turn',
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
    const { modeId } = params;
    const success = this.orch.switchOrch(modeId);

    return {
      modeId: success ? modeId : this.orch.getActiveOrchId(),
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

  async loadSession(params: acp.LoadSessionRequest): Promise<acp.LoadSessionResponse> {
    const { sessionId } = params;

    // First check if session is already in memory
    let session = this.sessions.get(sessionId);
    let sessionData: SessionData | null = null;

    if (!session) {
      // Try to restore from SessionStore by looking up the session ID
      const store = this.orch.getSessionStore();
      sessionData = store.load(sessionId);

      if (sessionData) {
        // Recreate session object from stored data
        session = {
          id: sessionId,
          cwd: params.cwd ?? process.cwd(),
          title: sessionData.title ?? 'Restored Session',
          createdAt: sessionData.createdAt,
          updatedAt: sessionData.updatedAt,
          storeSessionId: sessionId,
          orchId: sessionData.orchId,
        };
        this.sessions.set(sessionId, session);
      }
    }

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Restore the session state in orch
    if (session.storeSessionId) {
      this.orch.setActiveSessionId(session.storeSessionId);
    }

    // Stream conversation history to client via notifications
    if (this.connection && sessionData?.messages) {
      await this.streamMessageHistory(sessionId, sessionData.messages);
    }

    return {};
  }

  /**
   * Stream conversation history to client via session/update notifications
   */
  private async streamMessageHistory(
    sessionId: string,
    messages: ChatMessage[]
  ): Promise<void> {
    if (!this.connection) return;

    for (const message of messages) {
      try {
        if (message.role === 'user') {
          // Send user message
          await this.connection.sessionUpdate({
            sessionId,
            update: {
              sessionUpdate: 'user_message_chunk',
              content: {
                type: 'text',
                text: message.content,
              },
            },
          });
        } else if (message.role === 'assistant') {
          // Send assistant message - use a unique messageId based on timestamp
          const messageId = `msg-${message.timestamp}`;
          await this.connection.sessionUpdate({
            sessionId,
            update: {
              sessionUpdate: 'agent_message_chunk',
              messageId,
              content: {
                type: 'text',
                text: message.content,
              },
            },
          });

          // Send tool calls if present
          if (message.toolCalls && message.toolCalls.length > 0) {
            for (const toolCall of message.toolCalls) {
              const toolCallId = `tool-${toolCall.name}-${message.timestamp}`;
              await this.connection.sessionUpdate({
                sessionId,
                update: {
                  sessionUpdate: 'tool_call',
                  toolCallId,
                  title: toolCall.name,
                  kind: 'read',
                  status: 'completed',
                  rawInput: toolCall.arguments ? JSON.parse(toolCall.arguments) : {},
                  rawOutput: toolCall.result,
                },
              });
            }
          }
        }
      } catch (error) {
        console.error('Error streaming message history:', error);
        // Continue with next message
      }
    }
  }

  async listSessions(_params: acp.ListSessionsRequest): Promise<acp.ListSessionsResponse> {
    const sessions: acp.SessionInfo[] = [];

    for (const [sessionId, session] of this.sessions) {
      sessions.push({
        sessionId,
        cwd: session.cwd,
        title: session.title ?? 'Session',
        updatedAt: new Date(session.updatedAt).toISOString(),
      });
    }

    // Also check the store for any sessions we don't know about
    const store = this.orch.getSessionStore();
    const allSessionSummaries = store.list();

    for (const summary of allSessionSummaries) {
      // Skip if we already have this session
      if (this.sessions.has(summary.id)) {
        continue;
      }

      sessions.push({
        sessionId: summary.id,
        cwd: process.cwd(),
        title: summary.title ?? 'Stored Session',
        updatedAt: new Date(summary.updatedAt).toISOString(),
      });
    }

    return {
      sessions,
      hasMore: false,
    };
  }

  async unstable_resumeSession(params: acp.ResumeSessionRequest): Promise<acp.ResumeSessionResponse> {
    const { sessionId } = params;

    // First check if session is already in memory
    let session = this.sessions.get(sessionId);

    if (!session) {
      // Try to restore from SessionStore
      const store = this.orch.getSessionStore();
      const sessionData = store.load(sessionId);

      if (sessionData) {
        // Recreate session object from stored data
        session = {
          id: sessionId,
          cwd: params.cwd ?? process.cwd(),
          title: sessionData.title ?? 'Resumed Session',
          createdAt: sessionData.createdAt,
          updatedAt: sessionData.updatedAt,
          storeSessionId: sessionId,
          orchId: sessionData.orchId,
        };
        this.sessions.set(sessionId, session);
      }
    }

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Restore the session state in orch
    if (session.storeSessionId) {
      this.orch.setActiveSessionId(session.storeSessionId);
    }

    return {};
  }

  async unstable_closeSession(params: acp.CloseSessionRequest): Promise<acp.CloseSessionResponse> {
    const { sessionId } = params;

    const session = this.sessions.get(sessionId);
    if (session) {
      // Cancel any active operations
      await this.cancel({ sessionId });

      // Remove from our sessions map
      this.sessions.delete(sessionId);
    }

    return {};
  }
}
