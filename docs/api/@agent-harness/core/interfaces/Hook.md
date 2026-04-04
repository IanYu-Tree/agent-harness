[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/core](../index.md) / Hook

# Interface: Hook

Defined in: types/agent.ts:26

## Properties

### afterLLM?

> `optional` **afterLLM?**: (`agent`) => `Promise`\<`void`\>

Defined in: types/agent.ts:28

#### Parameters

##### agent

[`AgentInstance`](AgentInstance.md)

#### Returns

`Promise`\<`void`\>

***

### afterToolExecution?

> `optional` **afterToolExecution?**: (`agent`, `toolCtx`) => `Promise`\<`void`\>

Defined in: types/agent.ts:30

#### Parameters

##### agent

[`AgentInstance`](AgentInstance.md)

##### toolCtx

[`ToolExecutionContext`](ToolExecutionContext.md)

#### Returns

`Promise`\<`void`\>

***

### beforeLLM?

> `optional` **beforeLLM?**: (`agent`) => `Promise`\<`void`\>

Defined in: types/agent.ts:27

#### Parameters

##### agent

[`AgentInstance`](AgentInstance.md)

#### Returns

`Promise`\<`void`\>

***

### beforeToolExecution?

> `optional` **beforeToolExecution?**: (`agent`, `toolCtx`) => `Promise`\<`void`\>

Defined in: types/agent.ts:29

#### Parameters

##### agent

[`AgentInstance`](AgentInstance.md)

##### toolCtx

[`BeforeToolExecutionContext`](BeforeToolExecutionContext.md)

#### Returns

`Promise`\<`void`\>
