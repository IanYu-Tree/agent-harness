# Orchestration Patterns

## Overview

Orchestration patterns define how one or more agents collaborate to accomplish a task. Agent Orch provides three built-in patterns, each suited to different problem structures. All patterns are implemented as `PatternRunner` instances and return an `AsyncGenerator<StreamEvent>` from their `run()` method.

## Pattern Comparison

| Pattern | Complexity | Agents | Best For |
|---------|-----------|--------|----------|
| **SingleAgent** | Low | 1 | General-purpose chat, simple tool use, single-focus tasks. |
| **PlannerExecutor** | High | 1 planner + N executors | Complex multi-step tasks with dependencies, parallel workloads, DAG-structured plans. |
| **Reflextion** | Medium | 1 executor + 1 critic | Iterative refinement, quality-sensitive outputs, tasks requiring review cycles. |

## PatternFactory

`PatternFactory` is the entry point for creating pattern runners. It inspects the `OrchConfig.type` field and returns the corresponding `PatternRunner` implementation:

```typescript
const runner = PatternFactory.create(orchConfig, llm, tools, ctx)
```

| `type` Value | Runner Created |
|--------------|----------------|
| `"singleAgent"` | `SingleAgentRunner` |
| `"plannerExecutor"` | `PlannerExecutorRunner` |
| `"reflextion"` | `ReflextionRunner` |

## PatternRunner Interface

All patterns implement the same interface:

```typescript
interface PatternRunner {
  run(input: string | Message[]): AsyncGenerator<StreamEvent>
}
```

This uniform interface means the orchestration layer is transparent to consumers — whether a single agent or a complex multi-agent DAG is running behind the scenes, the caller receives the same `StreamEvent` stream.

## When to Use Each Pattern

### SingleAgent

Choose `SingleAgent` when:

- The task can be handled by one agent with access to the right tools.
- You need a straightforward conversational assistant.
- Latency and simplicity are priorities.

### PlannerExecutor

Choose `PlannerExecutor` when:

- The task naturally decomposes into subtasks with dependencies.
- Subtasks can be executed in parallel where the dependency graph allows.
- You need visibility into task progress and individual task outcomes.
- The problem benefits from a planning phase before execution.

### Reflextion

Choose `Reflextion` when:

- Output quality matters more than speed.
- The task benefits from iterative review and revision (e.g., writing, code generation).
- You want a critic agent to validate or score the executor's output.
- A feedback loop can meaningfully improve results across iterations.

## Composability

Patterns are composable. A `PlannerExecutor` can spawn executor tasks that themselves run as `Reflextion` patterns or even nested `PlannerExecutor` patterns. This enables building arbitrarily sophisticated workflows from simple, well-defined building blocks.

## Event Propagation

Each pattern wraps its internal agent events with pattern-level events (`pattern:start`, `pattern:end`) and, where applicable, orchestration events (`orch:spawn`, `orch:complete`, `orch:task_start`, `orch:task_complete`, `orch:task_failed`). This gives consumers full visibility into both the high-level orchestration flow and the low-level agent activity.
