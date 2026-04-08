# Configuration

Agent Orch is configured through a single `HarnessConfig` object, typically created with the `defineConfig` helper for type safety and autocompletion.

## HarnessConfig

The top-level configuration interface.

| Field | Type | Description |
| --- | --- | --- |
| `orchs` | `OrchEntry[]` | Array of orchestration entries available to the orch. |
| `defaultOrchId` | `string` | ID of the orchestration to use when none is specified at runtime. |
| `globalTools` | `Tool[]` | Tools injected into every agent across all orchestrations. |
| `defaultLLMConfig` | `LLMConfig` | Fallback LLM settings applied when an agent does not specify its own. |
| `sessionDir` | `string` | Directory path for persisting session history and checkpoints. |

## OrchConfig

Defines a single orchestration — one of three supported patterns.

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique orchestration identifier. |
| `type` | `"singleAgent" \| "plannerExecutor" \| "reflextion"` | Orchestration pattern. |
| `agents` | `Record<string, AgentConfig \| OrchConfig>` | Named map of agents (or nested orchestrations) participating in this pattern. |
| `options` | `object` | Pattern-specific options (e.g. max reflection rounds for `reflextion`). |

Because the `agents` map accepts both `AgentConfig` and `OrchConfig`, orchestrations can be nested recursively to model complex workflows.

## OrchEntry

Wraps an `OrchConfig` with metadata for the orch.

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique entry identifier. |
| `name` | `string` | Display name for the orchestration. |
| `description` | `string?` | Optional description. |
| `config` | `OrchConfig` | The orchestration configuration. |

## AgentConfig

Configuration for a single ReAct agent.

| Field | Type | Description |
| --- | --- | --- |
| `agentId` | `string` | Unique agent identifier within its orchestration. |
| `prompt` | `string \| ((ctx: CTX) => string)` | System prompt — either a static string or a function that receives runtime context. |
| `desc` | `string?` | Optional description of the agent. |
| `tools` | `Tool[]` | Tools available to this agent. |
| `hooks` | `Hook[]` | Lifecycle hooks (`beforeLLM`, `afterLLM`). |
| `llmConfig` | `LLMConfig` | Agent-specific LLM settings (overrides `defaultLLMConfig`). |
| `maxTurns` | `number` | Maximum number of ReAct loop iterations before the agent is forced to stop. |

## LLMConfig

Settings for the underlying LLM provider connection.

| Field | Type | Description |
| --- | --- | --- |
| `modelId` | `string` | Model identifier in `"provider/model"` format. See [LLM Providers](../concepts/llm-providers.md#model-id-format) for details. |
| `apiKey` | `string` | API key for authentication. Falls back to provider-specific env vars (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`). |
| `baseUrl` | `string` | Base URL for the provider API. Falls back to `BOT_BASE_URL` or provider-specific env vars. |
| `temperature` | `number` | Sampling temperature (0–2). |
| `maxTokens` | `number` | Maximum number of tokens to generate per response. |

## Full Example

```typescript
import { defineConfig } from "@agent-orch/appkit";
import { createSetTodoTool, createGetTodoTool } from "@agent-orch/tool";

const setTodo = createSetTodoTool();
const getTodo = createGetTodoTool();

export default defineConfig({
  // See https://github.com/IanYu-Tree/agent-orch/blob/main/docs/concepts/llm-providers.md
  // for supported providers and model IDs
  defaultLLMConfig: {
    modelId: "openai/gpt-4o",
    // Or use Anthropic: modelId: "anthropic/claude-3-5-sonnet-20241022",
    temperature: 0.7,
    maxTokens: 4096,
  },

  globalTools: [getTodo],

  orchs: [
    {
      id: "assistant",
      name: "Coding Assistant",
      config: {
        id: "assistant",
        type: "singleAgent",
        agents: {
          main: {
            agentId: "main",
            prompt: "You are a helpful coding assistant.",
            tools: [setTodo],
            llmConfig: { modelId: "openai/gpt-4o" },
            maxTurns: 20,
          },
        },
      },
    },
    {
      id: "researcher",
      name: "Research Assistant",
      config: {
        id: "researcher",
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
            tools: [setTodo],
            llmConfig: { modelId: "openai/gpt-4o" },
            maxTurns: 30,
          },
        },
      },
    },
    {
      id: "writer",
      name: "Writing Assistant",
      config: {
        id: "writer",
        type: "reflextion",
        agents: {
          actor: {
            agentId: "actor",
            prompt: "Draft a response to the user's writing request.",
            llmConfig: { modelId: "openai/gpt-4o" },
          },
          evaluator: {
            agentId: "evaluator",
            prompt: "Evaluate the draft and provide specific, actionable feedback.",
            llmConfig: { modelId: "openai/gpt-4o" },
          },
        },
        options: { maxReflections: 3 },
      },
    },
  ],

  defaultOrchId: "assistant",
  sessionDir: "./.sessions",
});
```

## Runtime Configuration Loading

In addition to static configuration, you can dynamically register orch entries at runtime using the CLI's `/orch-load` command or programmatically via the `AgentOrch` API.

### CLI Dynamic Loading

```bash
# In the CLI REPL
/orch-load ./my-orch.ts
/orch  # Select from the updated list
```

The loaded file can export:

| Export | Type | Description |
| --- | --- | --- |
| `default` | `OrchEntry \| () => OrchEntry` | Default export (function or object) |
| `orch` | `OrchEntry` | Named export object |
| `createOrch` | `() => OrchEntry` | Named export function |

### Programmatic Registration

```typescript
const orch = new AgentOrch(config);

// Register a new orch entry
orch.registerOrch({
  id: "dynamic",
  name: "Dynamic Orch",
  config: { /* ... */ },
});

// Switch to it
orch.switchOrch("dynamic");

// Remove it later
orch.unregisterOrch("dynamic");
```

## Next Steps

- [Getting Started](./getting-started.md) — see a minimal working example.
- [Project Structure](./project-structure.md) — understand the package layout.
- [LLM Providers](../concepts/llm-providers.md) — detailed documentation for each supported provider.
