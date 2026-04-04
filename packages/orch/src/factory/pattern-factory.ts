import type { AgentConfig, OrchConfig } from '@agent-orch/core';
import { isOrchConfig } from '@agent-orch/core';
import type { PatternRunner, PatternDeps } from '../types.js';
import { SingleAgentPattern } from '../patterns/single-agent/single-agent-pattern.js';
import { PlannerExecutorPattern } from '../patterns/planner-executor/planner-executor-pattern.js';
import { ReflextionPattern } from '../patterns/reflextion/reflextion-pattern.js';

export class PatternFactory {
  constructor(private deps: PatternDeps) {}

  create(config: OrchConfig): PatternRunner {
    switch (config.type) {
      case 'singleAgent': {
        const agentKey = Object.keys(config.agents)[0];
        const agentConfig = config.agents[agentKey] as AgentConfig;
        return new SingleAgentPattern(config.id, agentConfig, this.deps);
      }
      case 'plannerExecutor':
        return new PlannerExecutorPattern(config.id, config, this.deps, this);
      case 'reflextion':
        return new ReflextionPattern(config.id, config, this.deps, this);
      default:
        throw new Error(`Unsupported pattern type: ${config.type}`);
    }
  }

  resolveAgent(agentOrOrch: AgentConfig | OrchConfig): AgentConfig | PatternRunner {
    if (isOrchConfig(agentOrOrch)) {
      return this.create(agentOrOrch);
    }
    return agentOrOrch;
  }
}
