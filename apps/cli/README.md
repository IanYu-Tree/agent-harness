# @agent-orch/cli

[![npm](https://img.shields.io/npm/v/@agent-orch/cli)](https://www.npmjs.com/package/@agent-orch/cli)
[![ACP](https://img.shields.io/badge/ACP-Protocol%20Ready-purple.svg)](https://agentclientprotocol.com)

Command-line interface for Agent Orch with **ACP (Agent Client Protocol)** support.

Built with [Ink](https://github.com/vadimdemedes/ink) (React for CLI).

## 🚀 Features

- **Interactive TUI** — Terminal-based chat with streaming responses
- **ACP Server** — stdio/HTTP modes for IDE integration (VS Code, Cursor, Windsurf)
- **Auto-Loading Orchs** — Configure orchestrations via JSON, loaded automatically
- **Session Management** — Persistent sessions with file-based storage
- **Dynamic Orch Loading** — Load custom orchestrations at runtime

## 📦 Installation

```bash
npm install -g @agent-orch/cli
# or
pnpm add -g @agent-orch/cli
```

## 🎮 Usage

### Interactive Mode (TUI)

```bash
agent-orch
# or
npx @agent-orch/cli
```

**Slash Commands:**

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

### ACP Server Mode

```bash
# stdio mode (for IDE integration)
agent-orch acp

# HTTP mode (for web clients)
agent-orch acp --http --port=3000
```

#### HTTP API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/acp/initialize` | POST | Initialize ACP connection |
| `/acp/session/new` | POST | Create new session |
| `/acp/session/:id/prompt` | POST | Send prompt |
| `/acp/session/:id/mode` | POST | Switch orchestration mode |
| `/acp/orchs` | GET | List available orchestrations |
| `/acp/sessions` | GET | List active sessions |

## ⚙️ Configuration

Create `~/.agent-orch/.agent-orch.json`:

```json
{
  "llm": {
    "apiKey": "sk-your-api-key",
    "modelId": "openai/gpt-4o",
    "baseUrl": "optional-custom-endpoint"
  },
  "defaultOrchId": "single",
  "orchs": [
    {
      "id": "my-custom",
      "path": "./path/to/my-orch.ts"
    }
  ]
}
```

Or use environment variables:

```env
BOT_API_KEY=your_api_key
BOT_MODEL=openai/gpt-4o
BOT_BASE_URL=https://api.openai.com/v1
```

### Custom Orchestration Example

```typescript
// my-orch.ts
import type { OrchEntry } from '@agent-orch/appkit';

export default function createMyOrch(): OrchEntry {
  return {
    id: 'my-custom',
    name: 'My Custom Orch',
    description: 'A custom orchestration',
    config: {
      id: 'my-orch',
      type: 'singleAgent',
      agents: {
        agent: {
          agentId: 'assistant',
          prompt: 'You are a helpful assistant.',
          llmConfig: {
            modelId: process.env.BOT_MODEL ?? 'openai/gpt-4o',
            apiKey: process.env.BOT_API_KEY,
          },
          tools: [],
        },
      },
    },
  };
}
```

## 🔌 ACP Protocol

This CLI implements the [Agent Client Protocol](https://agentclientprotocol.com), enabling integration with ACP-compatible IDEs.

### Supported Methods

| Method | Description |
|--------|-------------|
| `initialize` | Protocol initialization |
| `session/new` | Create new session |
| `session/prompt` | Send prompt (streaming) |
| `session/cancel` | Cancel ongoing prompt |
| `session/load` | Load existing session |
| `session/list` | List all sessions |
| `session/resume` | Resume a session |
| `session/close` | Close a session |
| `session/set_mode` | Switch orchestration mode |

### Streaming Events

- `agent_message_chunk` — Text content chunks with `messageId`
- `agent_thought_chunk` — Reasoning/thinking content
- `tool_call` — Tool execution started
- `tool_call_update` — Tool execution completed

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run locally
node dist/index.js

# Run ACP server
node dist/index.js acp

# Watch mode
pnpm dev
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close modal/menu |
| `Ctrl+C` | Exit application |
| `Tab` | Accept autocomplete |
| `↑/↓` | Navigate history |

## 📄 License

MIT
