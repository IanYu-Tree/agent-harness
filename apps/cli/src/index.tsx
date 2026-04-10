#!/usr/bin/env node
import 'dotenv/config';
import React from 'react';
import { render } from 'ink';
import { setGlobalLogHandler, setGlobalMinLevel } from '@agent-orch/core';
import { AgentOrch } from '@agent-orch/appkit';
import type { OrchEntry } from '@agent-orch/appkit';
import { App } from './components/App.js';
import { getDefaultOrchs } from './builtin-orchs/index.js';
import { logStore } from './log-store.js';
import { startACPServer, startStdioACPServer } from './acp-server/index.js';
import { loadUserConfig, getMergedLLMConfig, getConfigPath, loadOrchEntries } from './config/index.js';

process.on('uncaughtException', (err) => {
  logStore.push('error', 'process', String(err));
});

process.on('unhandledRejection', (reason) => {
  logStore.push('error', 'process', String(reason));
});

setGlobalLogHandler((level, prefix, message) => {
  logStore.push(level, prefix, message);
});
setGlobalMinLevel('info');

async function main() {
  // 加载用户配置
  const userConfig = loadUserConfig();
  const llmConfig = getMergedLLMConfig(userConfig);

  // 检查 API key
  if (!llmConfig.apiKey) {
    console.error(`Error: API key not found.`);
    console.error(`Please set one of the following:`);
    console.error(`  1. Add "llm.apiKey" to ${getConfigPath()}`);
    console.error(`  2. Set BOT_API_KEY or OPENAI_API_KEY environment variable`);
    process.exit(1);
  }

  // 构建 orchs 列表
  const orchs: OrchEntry[] = [];

  // 1. 添加内置 orchs
  orchs.push(...getDefaultOrchs(llmConfig));

  // 2. 从配置文件加载自定义 orchs
  if (userConfig.orchs && userConfig.orchs.length > 0) {
    const loadedOrchs = await loadOrchEntries(userConfig.orchs);
    orchs.push(...loadedOrchs);
  }

  // 3. 兼容旧版配置 (customOrchs)
  if (userConfig.customOrchs && userConfig.customOrchs.length > 0) {
    console.warn('Warning: "customOrchs" is deprecated. Use "orchs" with id/path objects instead.');
    const { loadUserOrch } = await import('./utils/loadUserOrch.js');
    for (const filePath of userConfig.customOrchs) {
      try {
        const tempOrch = new AgentOrch({ orchs: [], defaultLLMConfig: llmConfig });
        await loadUserOrch(tempOrch, filePath);
        const loaded = tempOrch.listOrchs();
        if (loaded.length > 0) {
          const lastOrch = loaded[loaded.length - 1];
          const fullEntry = (tempOrch as unknown as { config: { orchs: OrchEntry[] } }).config.orchs.find(
            (o: OrchEntry) => o.id === lastOrch.id
          );
          if (fullEntry) {
            orchs.push(fullEntry);
          }
        }
      } catch (error) {
        console.warn(`Failed to load custom orch from '${filePath}':`, error);
      }
    }
  }

  // 验证 defaultOrchId 是否存在
  const defaultOrchId = userConfig.defaultOrchId ?? orchs[0]?.id ?? '';
  if (defaultOrchId && !orchs.find(o => o.id === defaultOrchId)) {
    console.warn(`Warning: defaultOrchId '${defaultOrchId}' not found in available orchs.`);
    console.warn(`Available orchs: ${orchs.map(o => o.id).join(', ')}`);
  }

  // 创建共享的 AgentOrch 实例
  const orch = new AgentOrch({
    orchs,
    defaultOrchId,
    defaultLLMConfig: llmConfig,
  });

  // 检查命令行参数
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'acp') {
    // 启动 ACP Server
    if (args.includes('--http')) {
      // HTTP 模式（用于浏览器/Web 客户端）
      const portArg = args.find(arg => arg.startsWith('--port='));
      const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3000;
      startACPServer({ port, orch });
    } else {
      // stdio 模式（用于 IDE MCP/ACP 连接）
      startStdioACPServer({ orch });
    }
  } else if (command === 'web') {
    // 启动 Web Server (保留原有逻辑)
    console.log('Web server mode not yet implemented. Use "acp" command instead.');
    process.exit(1);
  } else {
    // 启动 TUI (默认)
    render(React.createElement(App, { orch }));
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
