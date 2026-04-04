import type { Tool } from '@agent-orch/core';
import { zodResponsesFunction } from 'openai/helpers/zod';

export function convertToolsToOpenAI(tools: Tool[]) {
  return tools.map((tool) =>
    zodResponsesFunction({
      name: tool.name,
      parameters: tool.parameters,
      description: tool.description,
    }),
  );
}
