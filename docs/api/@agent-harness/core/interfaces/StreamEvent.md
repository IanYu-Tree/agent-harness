[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/core](../index.md) / StreamEvent

# Interface: StreamEvent

Defined in: types/event.ts:41

## Properties

### agentId?

> `optional` **agentId?**: `string`

Defined in: types/event.ts:44

***

### data

> **data**: \{ `agentId`: `string`; \} \| \{ `reason`: [`FinishReason`](FinishReason.md); \} \| \{ `reason`: [`FinishReason`](FinishReason.md); \} \| \{ `model`: `string`; \} \| \{ `content`: `string`; \} \| \{ `content`: `string`; \} \| \{ `error?`: `string`; `status?`: `string`; \} \| \{ `arguments`: `string`; `name`: `string`; \} \| \{ `name`: `string`; `result`: [`ToolResult`](ToolResult.md); \} \| `Record`\<`string`, `unknown`\> \| \{ `executorId`: `string`; `task`: `string`; \} \| \{ `executorId`: `string`; `reason`: `unknown`; \} \| \{ `dependencies`: `string`[]; `executorId`: `string`; `task`: `string`; `taskId`: `string`; \} \| \{ `executorId`: `string`; `result`: `string`; `taskId`: `string`; \} \| \{ `error`: `string`; `executorId`: `string`; `taskId`: `string`; \}

Defined in: types/event.ts:46

***

### patternId?

> `optional` **patternId?**: `string`

Defined in: types/event.ts:45

***

### timestamp

> **timestamp**: `number`

Defined in: types/event.ts:43

***

### type

> **type**: [`StreamEventType`](../type-aliases/StreamEventType.md)

Defined in: types/event.ts:42
