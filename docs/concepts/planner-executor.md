# PlannerExecutor Pattern

## Overview

The `PlannerExecutor` pattern separates planning from execution. A **planner agent** analyzes the user's request, decomposes it into a structured task graph with dependencies, and then **executor agents** carry out each task. Tasks that do not depend on each other can run in parallel, enabling efficient handling of complex, multi-step workloads.

## How It Works

```
User Input
  → Planner Agent
    → submit_plan(tasks)
      → TaskGraph (DAG validation)
        → Execute tasks in dependency order
          → Executor Agent per task
            → Results flow back to Planner
              → get_progress() for status
```

### Step by Step

1. **Planning** — The planner agent receives the user's input along with its system prompt. It analyzes the request and calls the `submit_plan` tool with a list of tasks and their dependencies.
2. **DAG Validation** — The `TaskGraph` validates the submitted plan. It performs topological sorting and cycle detection to ensure the dependency graph is a valid DAG (Directed Acyclic Graph). If cycles are detected, the plan is rejected and the planner must revise it.
3. **Task Execution** — Tasks are executed in dependency order. When all of a task's dependencies are complete, it becomes eligible for execution. Multiple independent tasks run concurrently.
4. **Executor Agents** — Each task spawns an executor agent (or a nested orchestration pattern) that carries out the work. The executor receives the task description and any context from completed dependencies.
5. **Progress Tracking** — The planner can call `get_progress` at any time to inspect the current state of all tasks — which are pending, running, completed, or failed.
6. **Completion** — Once all tasks are complete (or a task fails without recovery), the planner produces the final response.

## Planner Tools

The planner agent is automatically equipped with two built-in tools:

### submit_plan

Submits a task list that forms the execution plan.

```typescript
submit_plan({
  tasks: [
    { id: "research", description: "Research the topic", dependencies: [] },
    { id: "outline", description: "Create an outline", dependencies: ["research"] },
    { id: "draft", description: "Write the first draft", dependencies: ["outline"] },
    { id: "review", description: "Review and polish", dependencies: ["draft"] }
  ]
})
```

Each task specifies:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier for the task. |
| `description` | `string` | What the executor agent should accomplish. |
| `dependencies` | `string[]` | IDs of tasks that must complete before this one starts. |

### get_progress

Returns the current status of all tasks in the plan, including their state (`pending`, `running`, `completed`, `failed`) and any output or error information.

## TaskGraph

The `TaskGraph` is the internal data structure that manages the execution plan:

- **Topological Sort** — Determines a valid execution order respecting all dependencies.
- **Cycle Detection** — Rejects plans with circular dependencies.
- **Concurrency Control** — Identifies tasks whose dependencies are all satisfied and schedules them for parallel execution.
- **State Tracking** — Maintains the lifecycle state of every task.

## Configuration

```typescript
const config: OrchConfig = {
  id: "research",
  type: "plannerExecutor",
  agents: {
    planner: {
      agentId: "planner",
      prompt: "Break down the user's research question into actionable steps.",
      llmConfig: { modelId: "openai/gpt-4o", temperature: 0.2 },
    },
    executor: {
      agentId: "executor",
      prompt: "Execute the plan step by step, using tools as needed.",
      llmConfig: { modelId: "openai/gpt-4o" },
      maxTurns: 30,
    },
  },
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier for this orchestration config. |
| `type` | `"plannerExecutor"` | Selects the PlannerExecutor pattern. |
| `agents` | `Record<string, AgentConfig>` | A record of agent configurations. Expects `planner` and `executor` entries. |

## Events

The PlannerExecutor pattern emits orchestration-level events in addition to standard agent events:

| Event | Description |
|-------|-------------|
| `orch:spawn` | An executor agent has been spawned for a task. |
| `orch:task_start` | A task has begun execution. |
| `orch:task_complete` | A task has finished successfully. |
| `orch:task_failed` | A task has failed. |
| `orch:complete` | All tasks in the plan have completed. |

## Use Cases

- Multi-step research and synthesis workflows.
- Code generation pipelines (design → implement → test).
- Data processing with dependent transformation stages.
- Any task that naturally decomposes into a dependency graph.
