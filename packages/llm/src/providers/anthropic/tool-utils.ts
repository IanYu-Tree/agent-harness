import type { Tool } from '@agent-orch/core';
import type { Tool as AnthropicTool } from '@anthropic-ai/sdk/resources/messages';
import { zodToJsonSchema } from 'zod-to-json-schema';

export function convertToolsToAnthropic(tools: Tool[]): AnthropicTool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: zodToJsonSchema(tool.parameters) as AnthropicTool['input_schema'],
  }));
}
