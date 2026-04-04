# Nested Orchestration

Agent Orch supports recursive orchestration — any agent slot within an `OrchConfig` can itself be another `OrchConfig`, enabling deeply composable multi-agent systems.

## Concept

In a standard orchestration config, each entry in the `agents` map is an `AgentConfig`. With nested orchestration, an entry can alternatively be a full `OrchConfig`, which is itself an orchestration pattern containing multiple agents.

```typescript
type AgentSlot = AgentConfig | OrchConfig;

interface OrchConfig {
  pattern: string;
  agents: Record<string, AgentSlot>;
}
```

## Type Guard

Use the `isOrchConfig()` type guard to distinguish between agent configs and orchestration configs at runtime:

```typescript
import { isOrchConfig } from "@agent-orch/core";

if (isOrchConfig(config.agents["executor"])) {
  // This slot is a nested orchestration
} else {
  // This slot is a single agent
}
```

## Example: PlannerExecutor with Reflexion

A common use case is a PlannerExecutor pattern where the planner is a single agent but the executor is a Reflexion pattern that iteratively refines its output.

```typescript
const orchConfig: OrchConfig = {
  pattern: "planner-executor",
  agents: {
    planner: {
      model: "gpt-4o",
      systemPrompt: "Break the task into discrete steps.",
    },
    executor: {
      pattern: "reflexion",
      agents: {
        actor: {
          model: "gpt-4o",
          systemPrompt: "Execute the given step to the best of your ability.",
        },
        evaluator: {
          model: "gpt-4o",
          systemPrompt: "Evaluate the output and suggest improvements.",
        },
      },
    },
  },
};
```

When the PlannerExecutor pattern delegates a step to the executor, it triggers a full Reflexion loop — the actor produces output, the evaluator critiques it, and the cycle repeats until the evaluator is satisfied.

## How It Works Internally

`PatternFactory` handles nested configs transparently:

1. When creating agents from an `OrchConfig`, the factory iterates over the `agents` map.
2. For each entry, it checks `isOrchConfig()`.
3. If the entry is an `AgentConfig`, a single agent is created.
4. If the entry is an `OrchConfig`, the factory recursively creates a sub-orchestration and wraps it as a callable agent.

This means patterns do not need special handling for nested orchestrations — `PatternFactory` abstracts the recursion away.

## Use Cases

- **Multi-step tasks with iterative refinement** — Each step in a plan is executed through a Reflexion loop.
- **Hierarchical review** — A top-level coordinator delegates to sub-teams, each running their own orchestration pattern.
- **Domain-specific pipelines** — Different stages of a pipeline use different patterns (e.g., sequential research, parallel generation, reflexive editing).

## Depth Limits

Recursive nesting has no hard-coded depth limit, but practical constraints apply:

- Each nesting level multiplies the number of LLM calls.
- Context propagation adds latency at each level.
- Debugging deeply nested orchestrations requires structured logging.

Set a reasonable depth based on your latency and cost budget, and use `StreamEvent` logging to maintain observability across levels.
