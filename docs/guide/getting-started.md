# Getting Started

## Prerequisites

| Requirement | Version |
| --- | --- |
| Node.js | >= 20 |
| pnpm | latest recommended |

## Installation

Install the application-level package from npm:

```bash
pnpm add @agent-orch/appkit
```

`@agent-orch/appkit` re-exports everything you need to define configurations, create a orch instance, and stream agent responses.

## Quick Example

```typescript
import { defineConfig, AgentOrch } from "@agent-orch/appkit";

const config = defineConfig({
  defaultLLMConfig: {
    modelId: "openai/gpt-4o",
  },
  orchs: [
    {
      id: "chat",
      name: "Chat Assistant",
      config: {
        id: "chat",
        type: "singleAgent",
        agents: {
          main: {
            agentId: "main",
            prompt: "You are a helpful assistant.",
            llmConfig: { modelId: "openai/gpt-4o" },
          },
        },
      },
    },
  ],
  defaultOrchId: "chat",
});

const orch = new AgentOrch(config);

async function main() {
  const stream = orch.chatStream("What is the capital of France?");

  for await (const event of stream) {
    if (event.type === "llm:chunk") {
      process.stdout.write(event.data.content);
    }
  }
}

main();
```

The `chatStream` method returns an `AsyncGenerator` that yields typed events. You can filter on `event.type` to handle tokens, tool calls, orchestration lifecycle events, and more.

## Environment Variables

Agent Orch reads LLM credentials from environment variables. You can use the generic form or provider-specific variables:

| Variable | Provider-Specific | Description |
| --- | --- | --- |
| `BOT_MODEL` | `OPENAI_MODEL`, `ANTHROPIC_MODEL` | Default model identifier (e.g. `openai/gpt-4o`, `anthropic/claude-3-5-sonnet-20241022`) |
| `BOT_API_KEY` | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | API key for the LLM provider |
| `BOT_BASE_URL` | `OPENAI_BASE_URL` | Base URL for the LLM API endpoint |

Environment variables are used as fallbacks when the corresponding field is not set in `LLMConfig`. See [LLM Providers](../concepts/llm-providers.md) for provider-specific details.

## Running the CLI

The repository ships with a terminal-based chat application you can use for quick experimentation:

```bash
git clone https://github.com/IanYu-Tree/agent-orch.git
cd agent-orch

pnpm install
pnpm build

cd apps/cli
pnpm dev
```

The CLI connects to the orchestration you define in your configuration file and renders streaming output directly in the terminal.

### Loading Custom Orch Configurations at Runtime

The CLI supports loading custom orchestration configurations from JavaScript/TypeScript files at runtime:

```bash
# In the CLI, load a custom orch configuration
/orch-load ./my-custom-orch.ts
```

Your configuration file can export the orch entry in several ways:

```typescript
// my-custom-orch.ts
import type { OrchEntry } from "@agent-orch/appkit";

// Option 1: Default export function
export default function createOrch(): OrchEntry {
  return {
    id: "custom-research",
    name: "Custom Research Agent",
    config: {
      id: "custom-orch",
      type: "singleAgent",
      agents: {
        agent: {
          agentId: "researcher",
          prompt: "You are a research assistant...",
          llmConfig: { modelId: "openai/gpt-4o" },
        },
      },
    },
  };
}

// Option 2: Named export
export const orch: OrchEntry = { /* ... */ };
```

After loading, switch to your custom mode with `/orch` and select it from the list.

See the `examples/` directory in `apps/cli` for complete samples.

## Next Steps

- [Project Structure](./project-structure.md) — explore the monorepo layout and package responsibilities.
- [Configuration](./configuration.md) — dive deeper into all configuration options.
- [LLM Providers](../concepts/llm-providers.md) — see all supported providers and their configuration options.
