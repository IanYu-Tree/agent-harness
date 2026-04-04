[**Agent Orch API Reference**](../../index.md)

***

[Agent Orch API Reference](../../index.md) / @agent-orch/orch

# @agent-orch/orch

Orchestration patterns engine for the Agent Orch framework. Supports three built-in patterns for composing agents into more powerful workflows.

## Patterns

| Pattern | Description |
|---------|-------------|
| **SingleAgent** | Simple pass-through — runs a single agent directly |
| **PlannerExecutor** | DAG-based task planning with `submit_plan` / `get_progress` tools. Includes topological sort and cycle detection |
| **Reflextion** | Executor + critic loop with feedback. Configurable max iterations for self-improvement |

All patterns support **recursive nesting** — any executor can itself be another orchestration pattern.

## Installation

```bash
pnpm add @agent-orch/orch
```

## Key API

| Export | Description |
|--------|-------------|
| `PatternFactory` | Creates pattern instances from config |
| `SingleAgentPattern` | Single agent pass-through pattern |
| `PlannerExecutorPattern` | DAG-based planner + parallel executors |
| `ReflextionPattern` | Executor–critic feedback loop |
| `TaskGraph` | DAG data structure with topological sort and cycle detection |

## Usage

```typescript
import { PatternFactory } from "@agent-orch/orch";

const pattern = PatternFactory.create({
  type: "planner-executor",
  planner: { llm, systemPrompt: "Break tasks into subtasks." },
  executor: { llm, tools, systemPrompt: "Execute the assigned task." },
});

const stream = pattern.runStream(messages);

for await (const event of stream) {
  console.log(event);
}
```

```typescript
const reflextion = PatternFactory.create({
  type: "reflextion",
  executor: { llm, tools, systemPrompt: "Solve the problem." },
  critic: { llm, systemPrompt: "Review and provide feedback." },
  maxIterations: 3,
});
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@agent-orch/core` | Core types and stream events |
| `@agent-orch/react-agent` | ReAct agent runtime |
| `zod` | Runtime schema validation |

## Documentation

See the [Agent Orch docs](../../../README.md) for full framework documentation.

## Classes

- [FeedbackStore](classes/FeedbackStore.md)
- [PatternFactory](classes/PatternFactory.md)
- [PlannerExecutorPattern](classes/PlannerExecutorPattern.md)
- [ReflextionPattern](classes/ReflextionPattern.md)
- [SingleAgentPattern](classes/SingleAgentPattern.md)
- [TaskGraph](classes/TaskGraph.md)

## Interfaces

- [PatternDeps](interfaces/PatternDeps.md)
- [PatternRunContext](interfaces/PatternRunContext.md)
- [PatternRunner](interfaces/PatternRunner.md)
- [TaskNode](interfaces/TaskNode.md)
- [TaskSummary](interfaces/TaskSummary.md)

## Type Aliases

- [TaskInput](type-aliases/TaskInput.md)
- [TaskStatus](type-aliases/TaskStatus.md)

## Functions

- [createGetFeedbackTool](functions/createGetFeedbackTool.md)
- [createPlannerTools](functions/createPlannerTools.md)
- [createSetFeedbackTool](functions/createSetFeedbackTool.md)
- [~~createSpawnExecutorTool~~](functions/createSpawnExecutorTool.md)
