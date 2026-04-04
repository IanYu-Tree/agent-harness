# Reflextion Pattern

## Overview

The `Reflextion` pattern implements an iterative refinement loop using two agents: an **executor** that generates output and a **critic** that reviews it. The critic provides structured feedback, and if the output does not meet the quality bar, the executor revises its work. This cycle continues until the critic approves the output or the maximum number of rounds is reached.

## How It Works

```
User Input
  → Executor Agent (generate output)
    → Critic Agent (review output)
      → set_feedback({ passed, feedback })
        ├── passed=true  → Loop ends, return output
        └── passed=false → Executor revises (next round)
```

### Step by Step

1. **Executor Generates** — The executor agent receives the user's input and produces an initial output.
2. **Critic Reviews** — The critic agent receives the executor's output and evaluates it against quality criteria defined in its system prompt.
3. **Feedback Decision** — The critic calls the `set_feedback` tool with a structured verdict.
4. **Iterate or Finish** — If `passed` is `true`, the loop ends and the executor's output is returned. If `passed` is `false`, the feedback is appended to the executor's context, and it generates a revised output.
5. **Max Rounds** — If the maximum number of rounds is reached without approval, the loop ends with the last executor output.

## set_feedback Tool

The critic agent is automatically equipped with the `set_feedback` tool:

```typescript
set_feedback({
  passed: false,
  feedback: "The introduction lacks a clear thesis statement. The third paragraph repeats information from the first."
})
```

| Field | Type | Description |
|-------|------|-------------|
| `passed` | `boolean` | Whether the output meets the quality bar. |
| `feedback` | `string` | Specific, actionable feedback for the executor. Only meaningful when `passed` is `false`. |

## FeedbackStore

The `FeedbackStore` tracks all feedback across rounds within a session. This provides:

- A history of all critic assessments.
- Visibility into how the output evolved across iterations.
- Context for the executor so it can see prior feedback and avoid repeating mistakes.

## Configuration

```typescript
const config: OrchConfig = {
  id: "writer",
  type: "reflextion",
  agents: {
    executor: {
      agentId: "executor",
      prompt: "Draft a response to the user's writing request.",
      llmConfig: { modelId: "openai/gpt-4o" },
      maxTurns: 10,
    },
    critic: {
      agentId: "critic",
      prompt: "Evaluate clarity, accuracy, and style. Provide specific feedback.",
      llmConfig: { modelId: "openai/gpt-4o" },
      maxTurns: 5,
    },
  },
  options: { maxRounds: 3 },
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier for this orchestration config. |
| `type` | `"reflextion"` | Selects the Reflextion pattern. |
| `agents` | `Record<string, AgentConfig>` | A record of agent configurations. Expects `executor` and `critic` entries. |
| `options` | `Record<string, unknown>` | Pattern-specific options. `maxRounds` controls maximum refinement iterations (defaults to **3**). |

## Round Lifecycle

Each round emits events that allow consumers to track refinement progress:

| Round Phase | Events Emitted |
|-------------|---------------|
| Executor runs | `agent:start`, `llm:*`, `tool:*`, `agent:end` |
| Critic reviews | `agent:start`, `llm:*`, `tool:start` (set_feedback), `tool:end`, `agent:end` |
| Round boundary | `pattern:start` / `pattern:end` wrapping the full cycle |

## Use Cases

- **Content writing** — Draft, review, and refine articles or documentation.
- **Code generation** — Generate code, review for correctness and style, then revise.
- **Data extraction** — Extract structured data, validate against a schema, and correct errors.
- **Translation** — Translate text, review for accuracy and fluency, and improve.

## When to Prefer Reflextion

Reflextion is most effective when:

- A clear quality rubric can be expressed in the critic's system prompt.
- The task benefits from iterative improvement rather than a single pass.
- The cost of additional LLM calls is justified by the quality improvement.
- You want an auditable trail of feedback and revisions.
