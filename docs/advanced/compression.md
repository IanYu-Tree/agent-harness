# Message Compression

Long-running agent conversations can exceed the model's context window. Agent Orch provides two compression strategies that activate automatically when a `context_length_exceeded` error occurs.

## Compression Strategies

### 1. Microcompact (First Attempt)

Microcompact is the lighter strategy applied on the first context overflow. It removes old `tool_result` messages from the conversation history while preserving the most recent N turns.

**What it does:**

- Scans the message history from oldest to newest.
- Removes `tool_result` messages that fall outside the recent turn window.
- Keeps the system prompt, recent user/assistant turns, and all non-tool-result messages intact.

This is often sufficient to free enough context space without losing conversational coherence.

### 2. Compact (Second Attempt)

If microcompact does not free enough space and a second `context_length_exceeded` error occurs, the compact strategy engages. This is a more aggressive approach that uses the LLM itself to summarize the conversation.

**What it does:**

- Sends the older portion of the conversation to the LLM with a summarization prompt.
- Receives a condensed summary of the key points, decisions, and state.
- Replaces the old messages with a single summary message.
- Retains the system prompt and recent turns verbatim.

## Auto-Compression Flow

```
User message
    │
    ▼
Agent invoke
    │
    ├── Success → continue normally
    │
    └── context_length_exceeded
            │
            ▼
        Microcompact (attempt 1)
            │
            ├── Success → retry with trimmed history
            │
            └── context_length_exceeded
                    │
                    ▼
                Compact (attempt 2)
                    │
                    ├── Success → retry with summarized history
                    │
                    └── Failure → throw error
```

Auto-compression attempts up to 2 recovery cycles. If the conversation still exceeds the limit after both strategies, the error is thrown to the caller.

## Manual Compression

You can invoke either strategy manually at any point during a conversation:

```typescript
await agent.microcompactMessages();

await agent.compactMessages();
```

This is useful when you want to proactively manage context size rather than waiting for an overflow error.

## Configuration

| Option              | Type     | Default | Description                                   |
| ------------------- | -------- | ------- | --------------------------------------------- |
| `recentTurnsToKeep` | `number` | `4`     | Number of recent turns preserved by microcompact |
| `autoCompress`      | `boolean`| `true`  | Enable or disable automatic compression       |

## Best Practices

- Prefer microcompact for conversations with heavy tool usage where results become stale.
- Use compact when conversations involve extensive reasoning that benefits from summarization.
- Monitor compression events via `StreamEvent` to track when context is being trimmed.
- For latency-sensitive applications, consider calling `microcompactMessages()` proactively between task boundaries.
