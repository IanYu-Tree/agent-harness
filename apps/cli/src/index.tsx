#!/usr/bin/env node
import 'dotenv/config';
import React from 'react';
import { render } from 'ink';
import { setGlobalLogHandler, setGlobalMinLevel } from '@agent-orch/core';
import { AgentOrch } from '@agent-orch/appkit';
import { App } from './components/App.js';
import { getDefaultOrchs } from './builtin-orchs/index.js';
import { logStore } from './log-store.js';
import { startACPServer, startStdioACPServer } from './acp-server/index.js';
import { loadUserConfig, getMergedLLMConfig, getConfigPath } from './config/index.js';

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

// 创建共享的 AgentOrch 实例
const orch = new AgentOrch({
  orchs: getDefaultOrchs(llmConfig),
  defaultOrchId: userConfig.defaultOrchId ?? 'single',
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
