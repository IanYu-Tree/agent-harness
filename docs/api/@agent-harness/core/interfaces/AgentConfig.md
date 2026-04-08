[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/core](../index.md) / AgentConfig

# Interface: AgentConfig

Defined in: types/agent.ts:40

## Properties

### agentId

> **agentId**: `string`

Defined in: types/agent.ts:41

***

### desc?

> `optional` **desc?**: `string`

Defined in: types/agent.ts:44

***

### hooks?

> `optional` **hooks?**: [`Hook`](Hook.md)[]

Defined in: types/agent.ts:45

***

### llmConfig

> **llmConfig**: [`LLMConfig`](LLMConfig.md)

Defined in: types/agent.ts:46

***

### maxTurns?

> `optional` **maxTurns?**: `number`

Defined in: types/agent.ts:47

***

### prompt

> **prompt**: `string` \| ((`ctx`) => `string`)

Defined in: types/agent.ts:43

***

### tools?

> `optional` **tools?**: [`Tool`](Tool.md)\<`any`\>[]

Defined in: types/agent.ts:42
