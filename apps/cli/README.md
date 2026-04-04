# @agent-orch/cli

A terminal-based chat interface for Agent Orch, built with [Ink](https://github.com/vadimdemedes/ink) (React for CLI).

## Features

- **Interactive Chat** — Stream responses from AI agents in real-time
- **Multiple Orchestration Modes** — Switch between SingleAgent, PlannerExecutor, and Reflextion patterns
- **Dynamic Orch Loading** — Load custom orchestration configurations from JS/TS files at runtime
- **Session Management** — Persist and resume conversations
- **Tool Execution** — Built-in shell tool with confirmation support
- **Debug Panel** — Toggle debug logs to inspect agent execution

## Installation

```bash
pnpm install
pnpm build
```

## Usage

Start the CLI:

```bash
pnpm start
# or
pnpm dev  # watch mode
```

### Environment Variables

Create a `.env` file:

```env
# Required: API key (provider-specific env vars also work)
BOT_API_KEY=your_api_key_here
# Or use: OPENAI_API_KEY=your_key
# Or use: ANTHROPIC_API_KEY=your_key

# Optional: Model configuration
BOT_MODEL=openai/gpt-4o
# Or use Anthropic: BOT_MODEL=anthropic/claude-3-5-sonnet-20241022
BOT_BASE_URL=https://api.openai.com/v1
```

See [LLM Providers](../../docs/concepts/llm-providers.md) for all supported providers and model IDs.

## Slash Commands

Once inside the CLI, use these commands:

| Command | Description |
|---------|-------------|
| `/orch` | Switch orchestration mode |
| `/orch-load <path>` | Load custom orch from JS/TS file |
| `/session-new` | Create new session |
| `/session` | Load saved session |
| `/session-delete` | Delete a session |
| `/debug` | Toggle debug panel |
| `/help` | Show available commands |
| `/exit` | Exit the application |

## Dynamic Orch Loading

Load custom orchestration configurations without restarting:

```
/orch-load ./examples/custom-orch.ts
```

Supported export formats in your config file:

```typescript
// Option 1: Default export function
export default function createOrch(): OrchEntry {
  return {
    id: "custom",
    name: "Custom Agent",
    config: { /* ... */ },
  };
}

// Option 2: Named export 'orch'
export const orch: OrchEntry = {
  id: "custom",
  name: "Custom Agent",
  config: { /* ... */ },
};

// Option 3: Named export 'createOrch'
export function createOrch(): OrchEntry {
  return { /* ... */ };
}
```

After loading, switch to your custom mode with `/orch`.

## Examples

See the `examples/` directory for sample configurations:

- `custom-orch.ts` — Single agent configuration
- `custom-planner-executor.ts` — Multi-agent planner-executor pattern

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close modal/menu |
| `Ctrl+C` | Exit application |
| `Tab` | Accept autocomplete |
| `↑/↓` | Navigate history |

## Project Structure

```
src/
├── builtin-orchs/      # Built-in orchestration configurations
│   ├── index.ts
│   ├── single-agent-demo.ts
│   └── planner-executor-demo.ts
├── components/         # React components for Ink UI
│   ├── App.tsx
│   ├── Composer.tsx
│   ├── OrchSelector.tsx
│   └── ...
├── hooks/              # React hooks
│   ├── useCommands.ts
│   └── useStreamHandler.ts
├── tools/              # Built-in tools
│   └── shell.ts
├── utils/              # Utilities
│   ├── historyConverter.ts
│   └── loadUserOrch.ts
├── examples/           # Example custom configurations
│   ├── custom-orch.ts
│   └── custom-planner-executor.ts
├── index.tsx           # Entry point
└── types.ts            # Type definitions
```

## License

MIT
