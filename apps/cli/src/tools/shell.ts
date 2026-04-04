import { z } from 'zod';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { Tool, ToolContext, ToolResult } from '@agent-orch/core';

const execAsync = promisify(exec);

const ShellParams = z.object({
  command: z.string().describe('The shell command to execute'),
});

const MAX_OUTPUT_LENGTH = 10000;
const TIMEOUT_MS = 30000;

export const shellTool: Tool<typeof ShellParams> = {
  name: 'shell',
  description: 'Execute a shell command and return its output. Use this to run terminal commands, read files, list directories, etc.',
  parameters: ShellParams,
  execute: async (params: z.infer<typeof ShellParams>, _context: ToolContext): Promise<ToolResult> => {
    try {
      const { stdout, stderr } = await execAsync(params.command, {
        timeout: TIMEOUT_MS,
        maxBuffer: 1024 * 1024,
        env: { ...process.env, PAGER: 'cat' },
      });

      let output = '';
      if (stdout) output += stdout;
      if (stderr) output += (output ? '\n--- stderr ---\n' : '') + stderr;

      if (!output) output = '(no output)';
      if (output.length > MAX_OUTPUT_LENGTH) {
        output = output.slice(0, MAX_OUTPUT_LENGTH) + `\n... (truncated, total ${output.length} chars)`;
      }

      return { content: output };
    } catch (error: unknown) {
      const err = error as { message?: string; stderr?: string; code?: number };
      const msg = err.stderr || err.message || 'Unknown error';
      return { content: msg.slice(0, MAX_OUTPUT_LENGTH), isError: true };
    }
  },
};
