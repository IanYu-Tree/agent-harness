# Custom Patterns

Orchestration patterns define how agents collaborate. Agent Orch ships with several built-in patterns, but you can create your own by implementing the `PatternRunner` interface.

## PatternRunner Interface

Every pattern must implement the `PatternRunner` interface:

```typescript
import { PatternRunner, StreamEvent } from "@agent-orch/core";

interface PatternRunner {
  run(input: string): AsyncGenerator<StreamEvent>;
}
```

The `run()` method accepts the user input and returns an `AsyncGenerator` that yields `StreamEvent` objects as the orchestration progresses. This streaming design enables real-time observation of agent interactions.

## Creating a Custom Pattern

### 1. Implement the Runner

```typescript
import {
  PatternRunner,
  StreamEvent,
  PatternFactory,
  OrchConfig,
} from "@agent-orch/core";

class RoundRobinPattern implements PatternRunner {
  private agents;

  constructor(config: OrchConfig) {
    this.agents = Object.entries(config.agents).map(([id, agentConfig]) =>
      PatternFactory.createAgent(id, agentConfig)
    );
  }

  async *run(input: string): AsyncGenerator<StreamEvent> {
    let currentInput = input;

    for (const agent of this.agents) {
      yield { type: "agent:start", agentId: agent.id };

      const response = await agent.invoke(currentInput);

      yield { type: "agent:message", agentId: agent.id, content: response };
      yield { type: "agent:end", agentId: agent.id };

      currentInput = response;
    }

    yield { type: "pattern:complete", finalOutput: currentInput };
  }
}
```

### 2. Register with PatternFactory

```typescript
PatternFactory.register("round-robin", (config: OrchConfig) => {
  return new RoundRobinPattern(config);
});
```

### 3. Use in Configuration

```typescript
const orchConfig: OrchConfig = {
  pattern: "round-robin",
  agents: {
    researcher: { model: "gpt-4o", systemPrompt: "You research topics." },
    writer: { model: "gpt-4o", systemPrompt: "You write articles." },
    editor: { model: "gpt-4o", systemPrompt: "You edit for clarity." },
  },
};
```

## StreamEvent Types

| Event Type          | Description                              |
| ------------------- | ---------------------------------------- |
| `agent:start`       | An agent has begun processing            |
| `agent:message`     | An agent produced output                 |
| `agent:end`         | An agent has finished processing         |
| `tool:call`         | A tool invocation was initiated          |
| `tool:result`       | A tool returned a result                 |
| `tool:confirmation` | A tool is awaiting user confirmation     |
| `pattern:complete`  | The orchestration pattern has finished   |

## Runtime Registration

You can dynamically register orch configurations at runtime in the CLI:

```typescript
// custom-pattern.ts
import type { OrchEntry } from "@agent-orch/appkit";

export const orch: OrchEntry = {
  id: "my-pattern",
  name: "My Custom Pattern",
  description: "A custom orchestration pattern",
  config: {
    id: "my-orch",
    type: "singleAgent", // or your custom pattern type
    agents: {
      agent: {
        agentId: "assistant",
        prompt: "You are a helpful assistant.",
        llmConfig: { modelId: "openai/gpt-4o" },
      },
    },
  },
};
```

Load it in the CLI:

```
/orch-load ./custom-pattern.ts
/orch  # Select your custom pattern from the list
```

## Best Practices

- Use `PatternFactory.createAgent()` to instantiate agents so that nested orchestration configs are handled correctly.
- Yield events at meaningful boundaries so consumers can observe progress.
- Handle agent errors gracefully within the generator rather than letting them propagate uncaught.
- Keep patterns stateless across runs — store per-run state in local variables within `run()`.
