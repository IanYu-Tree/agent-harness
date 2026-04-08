import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { LLMConfig } from '@agent-orch/core';

export interface UserConfig {
  llm?: {
    apiKey?: string;
    modelId?: string;
    baseUrl?: string;
  };
  defaultOrchId?: string;
  customOrchs?: string[];
}

const CONFIG_DIR = join(homedir(), '.agent-orch');
const CONFIG_FILE = join(CONFIG_DIR, '.agent-orch.json');

export function loadUserConfig(): UserConfig {
  if (!existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    console.warn('Warning: Failed to parse .agent-orch.json');
    return {};
  }
}

export function getMergedLLMConfig(userConfig: UserConfig): LLMConfig {
  return {
    modelId: userConfig.llm?.modelId ?? process.env.BOT_MODEL ?? process.env.OPENAI_MODEL_ID ?? 'openai/gpt-4o',
    apiKey: userConfig.llm?.apiKey ?? process.env.BOT_API_KEY ?? process.env.OPENAI_API_KEY ?? '',
    baseUrl: userConfig.llm?.baseUrl ?? process.env.BOT_BASE_URL ?? process.env.OPENAI_BASE_URL,
  };
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
