#!/usr/bin/env node
import 'dotenv/config';
import React from 'react';
import { render } from 'ink';
import { setGlobalLogHandler, setGlobalMinLevel } from '@agent-orch/core';
import { AgentOrch } from '@agent-orch/appkit';
import { App } from './components/App.js';
import { getDefaultOrchs } from './builtin-orchs/index.js';
import { logStore } from './log-store.js';

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

const apiKey = process.env.BOT_API_KEY || process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Error: API key not found. Please set BOT_API_KEY or OPENAI_API_KEY environment variable.');
  process.exit(1);
}

const orch = new AgentOrch({
  orchs: getDefaultOrchs(),
  defaultOrchId: 'single',
  defaultLLMConfig: {
    modelId: process.env.BOT_MODEL ?? process.env.OPENAI_MODEL_ID ?? 'openai/gpt-4o',
    apiKey: apiKey,
    baseUrl: process.env.BOT_BASE_URL ?? process.env.OPENAI_BASE_URL,
  },
});

render(React.createElement(App, { orch }));
