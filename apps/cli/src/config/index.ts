import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { LLMConfig } from '@agent-orch/core';

export interface OrchConfigEntry {
  /** Unique identifier for the orch */
  id: string;
  /** Path to the orch file (relative to config file or absolute) */
  path: string;
}

export interface UserConfig {
  llm?: {
    apiKey?: string;
    modelId?: string;
    baseUrl?: string;
  };
  defaultOrchId?: string;
  /** @deprecated Use 'orchs' instead */
  customOrchs?: string[];
  /** Orch configurations - each with id and file path */
  orchs?: OrchConfigEntry[];
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

/**
 * Load orch entries from config file paths
 * @param orchConfigs - Array of orch config entries with id and path
 * @returns Array of loaded OrchEntry objects
 */
export async function loadOrchEntries(
  orchConfigs: OrchConfigEntry[],
): Promise<Array<{ id: string; name: string; description?: string; config: unknown }>> {
  const entries: Array<{ id: string; name: string; description?: string; config: unknown }> = [];

  for (const orchConfig of orchConfigs) {
    try {
      const entry = await loadOrchFromPath(orchConfig.path);
      // Override the id from config file
      entry.id = orchConfig.id;
      entries.push(entry);
    } catch (error) {
      console.warn(`Failed to load orch '${orchConfig.id}' from '${orchConfig.path}':`, error);
    }
  }

  return entries;
}

/**
 * Load a single orch from file path
 */
async function loadOrchFromPath(
  filePath: string,
): Promise<{ id: string; name: string; description?: string; config: unknown }> {
  const { pathToFileURL } = await import('node:url');
  const { resolve, dirname } = await import('node:path');

  // Resolve relative to config file location
  const configDir = dirname(CONFIG_FILE);
  const absolutePath = resolve(filePath.startsWith('.') ? configDir : process.cwd(), filePath);
  const fileUrl = pathToFileURL(absolutePath).href;

  // Clear import cache for hot-reloading support
  const module = await import(fileUrl);

  // Support both default export and named export
  const factory = module.default || module.createOrch || module.orch;

  if (!factory) {
    throw new Error(
      `No valid export found. Expected default export, named export "createOrch", or "orch".`,
    );
  }

  let entry: { id: string; name: string; description?: string; config: unknown };

  if (typeof factory === 'function') {
    entry = await factory();
  } else {
    entry = factory as { id: string; name: string; description?: string; config: unknown };
  }

  // Validate the entry has required fields
  if (!entry.name || !entry.config) {
    throw new Error(`Invalid orch entry. Must have name and config properties.`);
  }

  return entry;
}
