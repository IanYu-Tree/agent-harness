import { z } from 'zod';
import type { Tool, ToolContext, ToolResult, AgentConfig, OrchConfig, UserInput, StreamEvent } from '@agent-orch/core';
import { isOrchConfig, consumeGenerator, isEventType } from '@agent-orch/core';
import type { PatternRunner, PatternDeps } from '../../types.js';
import type { PatternFactory } from '../../factory/pattern-factory.js';
import { SingleAgentPattern } from '../single-agent/single-agent-pattern.js';
import { TaskGraph, type TaskNode, type TaskSummary } from './task-graph.js';

const SubmitPlanParams = z.object({
  tasks: z.array(z.object({
    id: z.string().describe('Unique task identifier, e.g. "task_1"'),
    description: z.string().describe('Clear description of what this task should accomplish'),
    dependencies: z.array(z.string()).describe('IDs of tasks that must complete before this one. Use empty array [] if none'),
    executor: z.string().nullable().describe('ID of the executor to use for this task. Use null to use the default executor'),
  })).describe('Array of tasks forming an execution plan with dependencies'),
});

const GetProgressParams = z.object({});

function getExecutorDescription(id: string, config: AgentConfig | OrchConfig): string {
  if (isOrchConfig(config)) {
    return `"${id}" (nested ${config.type} pattern)`;
  }
  return config.desc ? `"${id}": ${config.desc}` : `"${id}"`;
}

function buildSubmitPlanDescription(executors: Record<string, AgentConfig | OrchConfig>): string {
  const lines = [
    'Submit a structured execution plan as a list of tasks with dependencies.',
    'Tasks will be executed in dependency order. Each task spawns an executor that receives',
    'the task description, dependency results, and overall progress as context.',
    '',
    'Available executors:',
  ];

  for (const [id, config] of Object.entries(executors)) {
    lines.push(`- ${getExecutorDescription(id, config)}`);
  }

  return lines.join('\n');
}

function buildExecutorInput(
  task: TaskNode,
  depResults: Array<{ id: string; description: string; result: string }>,
  summary: TaskSummary,
): string {
  let input = `## Your Task\n${task.description}\n\n`;
  input += `## Task Progress\nCompleted: ${summary.completed}/${summary.total} | Current: ${task.id}\n\n`;

  if (depResults.length > 0) {
    input += `## Dependency Results\nThe following predecessor tasks have been completed. Use their results as context:\n\n`;
    for (const dep of depResults) {
      input += `### [${dep.id}] ${dep.description}\nResult: ${dep.result}\n\n`;
    }
  }

  input += `## Instructions\nFocus solely on your assigned task. Your output will be used by downstream tasks.`;
  return input;
}

function formatResults(taskGraph: TaskGraph): string {
  const tasks = taskGraph.getAllTasks();
  const summary = taskGraph.getSummary();

  let output = `## Execution Summary\n`;
  output += `Total: ${summary.total} | Completed: ${summary.completed} | Failed: ${summary.failed}\n\n`;

  for (const task of tasks) {
    output += `### [${task.id}] ${task.description}\n`;
    output += `Status: ${task.status}\n`;
    if (task.executor) output += `Executor: ${task.executor}\n`;
    if (task.result) output += `Result: ${task.result}\n`;
    if (task.error) output += `Error: ${task.error}\n`;
    output += '\n';
  }

  return output;
}

async function runSingleExecutor(
  factory: PatternFactory,
  executorConfig: AgentConfig | OrchConfig,
  deps: PatternDeps,
  input: string,
  context: ToolContext,
): Promise<string> {
  const eventPublisher = context.ctx.eventPublisher as ((event: StreamEvent) => void) | undefined;

  let runner: PatternRunner;
  if (isOrchConfig(executorConfig)) {
    runner = factory.create(executorConfig);
  } else {
    runner = new SingleAgentPattern(
      `executor_${Date.now()}`,
      executorConfig,
      deps,
    );
  }

  const taskInput: UserInput = [{ type: 'text', text: input }];
  let lastContent = '';

  await consumeGenerator(
    runner.run(taskInput, {
      eventPublisher: eventPublisher ?? (() => {}),
      parentPatternId: context.ctx.patternId,
    }),
    (event) => {
      eventPublisher?.(event);
      if (isEventType(event, 'llm:chunk')) {
        if (event.data.content) {
          lastContent += event.data.content;
        }
      }
    },
  );

  return lastContent || 'Executor completed the task.';
}

function resolveExecutor(
  executors: Record<string, AgentConfig | OrchConfig>,
  executorId?: string | null,
): { config: AgentConfig | OrchConfig; id: string } | { error: string } {
  const defaultId = Object.keys(executors)[0];

  if (!executorId) {
    return { config: executors[defaultId], id: defaultId };
  }

  if (!executors[executorId]) {
    const available = Object.keys(executors).map((k) => `"${k}"`).join(', ');
    return { error: `Unknown executor "${executorId}". Available executors: ${available}` };
  }

  return { config: executors[executorId], id: executorId };
}

function createSubmitPlanTool(
  taskGraph: TaskGraph,
  factory: PatternFactory,
  executors: Record<string, AgentConfig | OrchConfig>,
  deps: PatternDeps,
): Tool<typeof SubmitPlanParams> {
  return {
    name: 'submit_plan',
    description: buildSubmitPlanDescription(executors),
    parameters: SubmitPlanParams,
    execute: async (params: z.infer<typeof SubmitPlanParams>, context: ToolContext): Promise<ToolResult> => {
      const eventPublisher = context.ctx.eventPublisher as ((event: StreamEvent) => void) | undefined;

      try {
        for (const task of params.tasks) {
          if (task.executor) {
            const resolved = resolveExecutor(executors, task.executor);
            if ('error' in resolved) {
              return { content: `Invalid plan: ${resolved.error}`, isError: true };
            }
          }
        }

        taskGraph.addTasks(params.tasks.map((t) => ({
          ...t,
          executor: t.executor ?? undefined,
        })));

        const validation = taskGraph.validate();
        if (!validation.valid) {
          return { content: `Invalid plan: ${validation.errors.join('; ')}`, isError: true };
        }

        while (!taskGraph.isAllDone()) {
          const readyTasks = taskGraph.getReadyTasks();
          if (readyTasks.length === 0) {
            return {
              content: `Deadlock detected: some tasks cannot proceed due to failed dependencies.\n\n${formatResults(taskGraph)}`,
              isError: true,
            };
          }

          for (const task of readyTasks) {
            taskGraph.markRunning(task.id);

            const resolved = resolveExecutor(executors, task.executor);
            if ('error' in resolved) {
              taskGraph.markFailed(task.id, resolved.error);
              continue;
            }

            const executorInstanceId = `${resolved.id}_${task.id}_${Date.now()}`;

            eventPublisher?.({
              type: 'orch:task_start',
              timestamp: Date.now(),
              data: { executorId: executorInstanceId, taskId: task.id, task: task.description, dependencies: task.dependencies },
            });

            const depResults = taskGraph.getDependencyResults(task.id);
            const summary = taskGraph.getSummary();
            const enrichedInput = buildExecutorInput(task, depResults, summary);

            try {
              const result = await runSingleExecutor(factory, resolved.config, deps, enrichedInput, context);
              taskGraph.markCompleted(task.id, result);

              eventPublisher?.({
                type: 'orch:task_complete',
                timestamp: Date.now(),
                data: { executorId: executorInstanceId, taskId: task.id, result },
              });
            } catch (error) {
              taskGraph.markFailed(task.id, String(error));

              eventPublisher?.({
                type: 'orch:task_failed',
                timestamp: Date.now(),
                data: { executorId: executorInstanceId, taskId: task.id, error: String(error) },
              });
            }
          }
        }

        return { content: formatResults(taskGraph) };
      } catch (error) {
        return { content: `Plan execution error: ${String(error)}`, isError: true };
      }
    },
  };
}

function createGetProgressTool(
  taskGraph: TaskGraph,
): Tool<typeof GetProgressParams> {
  return {
    name: 'get_progress',
    description: 'Get the current progress and results of all tasks in the execution plan.',
    parameters: GetProgressParams,
    execute: async (): Promise<ToolResult> => {
      return { content: formatResults(taskGraph) };
    },
  };
}

export function createPlannerTools(
  factory: PatternFactory,
  executors: Record<string, AgentConfig | OrchConfig>,
  deps: PatternDeps,
): Tool[] {
  const taskGraph = new TaskGraph();
  return [
    createSubmitPlanTool(taskGraph, factory, executors, deps),
    createGetProgressTool(taskGraph),
  ];
}

/** @deprecated Use createPlannerTools instead */
export function createSpawnExecutorTool(
  factory: PatternFactory,
  executors: Record<string, AgentConfig | OrchConfig>,
  deps: PatternDeps,
): Tool {
  return createPlannerTools(factory, executors, deps)[0];
}
