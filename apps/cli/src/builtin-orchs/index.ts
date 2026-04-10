import type { OrchEntry, LLMConfig } from '@agent-orch/appkit';
import { createSingleAgentDemo } from './single-agent-demo.js';
import { createPlannerExecutorDemo } from './planner-executor-demo.js';

export function getDefaultOrchs(llmConfig?: LLMConfig): OrchEntry[] {
  return [
    createSingleAgentDemo(llmConfig),
    createPlannerExecutorDemo(llmConfig),
  ];
}
