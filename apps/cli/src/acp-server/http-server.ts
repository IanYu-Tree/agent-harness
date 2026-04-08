import express from 'express';
import cors from 'cors';
import type { AgentOrch } from '@agent-orch/appkit';
import { ChatStreamProcessor } from '@agent-orch/appkit';
import type * as acp from '@agentclientprotocol/sdk';
import { AgentOrchACP } from './agent-impl.js';

export interface ACPServerOptions {
  port: number;
  orch: AgentOrch;
}

// 简化的 HTTP 传输 ACP Server
// 由于 ACP SDK 主要支持 stdio，这里实现一个自定义的 HTTP API
// 遵循 ACP 协议的语义，但使用 HTTP 传输

export function startACPServer(options: ACPServerOptions): void {
  const { port, orch } = options;
  const app = express();
  const agent = new AgentOrchACP(orch);

  // Middleware
  app.use(cors());
  app.use(express.json());

  // 存储活跃会话
  const activeSessions = new Map<string, {
    sessionId: string;
    cwd: string;
    orchId: string;
    storeSessionId: string;
  }>();

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', protocol: 'acp', version: '0.1.0' });
  });

  // Initialize - 获取 agent 能力
  app.post('/acp/initialize', async (_req, res) => {
    try {
      const response = await agent.initialize({
        protocolVersion: '0.1.0',
        clientCapabilities: {},
      });
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Create new session
  app.post('/acp/session/new', async (req, res) => {
    try {
      const { cwd, mcpServers = [] } = req.body;
      const response = await agent.newSession({
        cwd: cwd || process.cwd(),
        mcpServers,
      });

      // 保存会话信息
      const store = orch.getSessionStore();
      const orchId = orch.getActiveOrch()?.id ?? 'single';
      const storeSessionId = store.create(orchId, 'ACP Session');

      activeSessions.set(response.sessionId, {
        sessionId: response.sessionId,
        cwd: cwd || process.cwd(),
        orchId,
        storeSessionId,
      });

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // List available orchestration modes
  app.get('/acp/orchs', (_req, res) => {
    const orchs = orch.listOrchs();
    res.json({ orchs });
  });

  // Switch orchestration mode
  app.post('/acp/session/:sessionId/mode', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { modeId } = req.body;

      const session = activeSessions.get(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const success = orch.switchOrch(modeId);
      if (success) {
        session.orchId = modeId;
      }

      res.json({
        success,
        modeId,
        availableModes: orch.listOrchs(),
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // SSE endpoint for streaming
  app.get('/acp/session/:sessionId/stream', (req, res) => {
    const { sessionId } = req.params;

    const session = activeSessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // 设置 SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 发送初始消息
    res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

    // 保存响应对象以便后续发送消息
    (session as unknown as Record<string, unknown>).sseResponse = res;

    req.on('close', () => {
      // 清理
    });
  });

  // Send prompt
  app.post('/acp/session/:sessionId/prompt', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { prompt, includeContext } = req.body;

      const session = activeSessions.get(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // 设置当前会话
      orch.setActiveSessionId(session.storeSessionId);

      // 获取用户输入
      const userMessage = prompt.find((p: acp.ContentBlock) => p.type === 'text')?.text ?? '';
      if (!userMessage.trim()) {
        res.json({ stopReason: 'complete' });
        return;
      }

      // 获取 SSE 响应对象
      const sseRes = (session as unknown as Record<string, express.Response>).sseResponse;

      // 开始流式处理
      const gen = orch.chatStream(userMessage);
      const processor = new ChatStreamProcessor();

      const finalizedMessages = await processor.processStream(gen, (update) => {
        if (update.type === 'items-changed' && sseRes) {
          // 发送流式更新
          for (const item of update.pendingItems) {
            sseRes.write(`data: ${JSON.stringify({ type: 'item', item })}\n\n`);
          }
        }

        if (update.type === 'items-finalized' || update.type === 'error') {
          if (sseRes) {
            sseRes.write(`data: ${JSON.stringify({ type: 'finalized', messages: update.finalizedMessages })}\n\n`);
          }
        }
      }, orch.getEventCollector());

      // 保存消息
      orch.saveSessionMessages(finalizedMessages);

      res.json({ stopReason: 'complete' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: errorMessage, stopReason: 'error' });
    }
  });

  // Cancel ongoing prompt
  app.post('/acp/session/:sessionId/cancel', async (req, res) => {
    try {
      const { sessionId } = req.params;
      await agent.cancel({ sessionId });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // List sessions
  app.get('/acp/sessions', (_req, res) => {
    const sessions = Array.from(activeSessions.values()).map(s => ({
      sessionId: s.sessionId,
      cwd: s.cwd,
      orchId: s.orchId,
    }));
    res.json({ sessions });
  });

  // Get session messages
  app.get('/acp/session/:sessionId/messages', (req, res) => {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const store = orch.getSessionStore();
    const sessionData = store.load(session.storeSessionId);

    if (!sessionData) {
      res.status(404).json({ error: 'Session data not found' });
      return;
    }

    res.json({ messages: sessionData.messages });
  });

  // Start server
  app.listen(port, () => {
    console.log(`🚀 ACP Server running at http://localhost:${port}`);
    console.log(`   Health check: http://localhost:${port}/health`);
  });
}
