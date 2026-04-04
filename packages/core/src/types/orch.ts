import type { AgentConfig } from './agent.js';

export type OrchType = 'singleAgent' | 'plannerExecutor' | 'reflextion';

export interface OrchConfig {
  id: string;
  type: OrchType;
  agents: Record<string, AgentConfig | OrchConfig>;
  options?: Record<string, unknown>;
}

export function isOrchConfig(config: AgentConfig | OrchConfig): config is OrchConfig {
  return 'type' in config && !('agentId' in config);
}
