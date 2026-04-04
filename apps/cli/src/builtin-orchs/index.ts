import type { OrchEntry } from '@agent-orch/appkit';
import { createSingleAgentDemo } from './single-agent-demo.js';
import { createPlannerExecutorDemo } from './planner-executor-demo.js';

export function getDefaultOrchs(): OrchEntry[] {
  return [
    createSingleAgentDemo(),
    createPlannerExecutorDemo(),
  ];
}
