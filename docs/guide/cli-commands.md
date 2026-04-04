# CLI Commands

The Agent Orch CLI provides an interactive terminal interface for chatting with AI agents. It supports streaming responses, tool execution, session management, and dynamic orch loading.

## Slash Commands

All commands start with `/`:

| Command | Description |
|---------|-------------|
| `/orch` | Open the orch selection menu to switch between orchestration modes |
| `/orch-load <path>` | Load a custom orchestration configuration from a JS/TS file |
| `/session-new` | Create a new chat session |
| `/session` | Load a previously saved session |
| `/session-delete` | Delete a saved session |
| `/debug` | Toggle the debug log panel |
| `/help` | Show available commands |
| `/exit` | Exit the application (also `/quit`) |

## Dynamic Orch Loading

The `/orch-load` command allows you to load custom orchestration configurations at runtime without restarting the CLI.

### Supported Export Formats

```typescript
// Option 1: Default export function
export default function createOrch(): OrchEntry {
  return {
    id: "custom",
    name: "Custom Agent",
    config: { /* ... */ },
  };
}

// Option 2: Default export object
export default {
  id: "custom",
  name: "Custom Agent",
  config: { /* ... */ },
} as OrchEntry;

// Option 3: Named export 'orch'
export const orch: OrchEntry = {
  id: "custom",
  name: "Custom Agent",
  config: { /* ... */ },
};

// Option 4: Named export 'createOrch'
export function createOrch(): OrchEntry {
  return {
    id: "custom",
    name: "Custom Agent",
    config: { /* ... */ },
  };
}
```

### Example Usage

```bash
# Load a custom orch from the examples directory
/orch-load ./examples/custom-orch.ts

# Now select it
/orch
# → Select "Custom Research Agent" from the list
```

## Session Management

Sessions are automatically saved to `~/.agent-orch/sessions/`. Each session tracks:
- Conversation history
- Active orchestration mode
- Creation and update timestamps

Use `/session` to browse and load previous conversations.

## Debug Panel

Toggle the debug panel with `/debug` to view:
- Log messages from all log levels (debug, info, warn, error)
- Agent execution traces
- Tool call details

Press `Escape` to close the debug panel or any other modal.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Close current modal/menu |
| `Ctrl+C` | Exit the application |
| `Tab` | Accept autocomplete suggestion |
| `↑/↓` | Navigate command history |
