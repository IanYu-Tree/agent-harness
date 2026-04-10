---
"@agent-orch/cli": minor
"@agent-orch/appkit": minor
---

## 🚀 ACP Protocol Support - IDE Integration Ready!

We're excited to announce full support for the **Agent Client Protocol (ACP)** — an open standard for integrating AI agents with IDEs like VS Code, Cursor, and Windsurf!

### ✨ New Features

#### ACP Server Implementation
- **Dual Transport Modes**: stdio (for IDE plugins) and HTTP (for web clients)
- **Full Protocol Compliance**: Implements initialize, sessions, prompts, tool calls
- **Real-time Streaming**: Incremental text deltas with UUID-based deduplication to prevent duplication
- **Session Management**: Create, load, list, resume, and close sessions with persistence

#### Auto-Loading Orchestrations
- **JSON Config Based**: Define orchestrations in `~/.agent-orch/.agent-orch.json`
- **Dynamic Loading**: Automatically loads orchs from file paths on startup
- **Hot Swappable**: Switch between orchestration patterns mid-conversation

#### Enhanced Streaming
- **Text Deltas**: Efficient incremental streaming with `messageId` tracking
- **Thinking Streams**: Separate reasoning display from final output
- **Tool Lifecycle**: Full tool call start/end notifications

### 📦 Affected Packages

- `@agent-orch/cli`: Added ACP server (`acp` command)
- `@agent-orch/appkit`: Added streaming utilities and session store

### 🛠️ Usage

```bash
# Start ACP server
npx @agent-orch/cli acp

# Or with HTTP mode
npx @agent-orch/cli acp --http --port=3000
```

Configure your orchestrations:

```json
{
  "llm": { "apiKey": "sk-...", "modelId": "openai/gpt-4o" },
  "defaultOrchId": "single",
  "orchs": [
    { "id": "custom", "path": "./my-orch.ts" }
  ]
}
```

### 🔗 Learn More

- [ACP Protocol](https://agentclientprotocol.com)
- [Documentation](https://github.com/IanYu-Tree/agent-orch#readme)

---

**Full Changelog**: https://github.com/IanYu-Tree/agent-orch/compare/v0.1.0...v0.2.0
