[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/core](../index.md) / StreamEventDataMap

# Interface: StreamEventDataMap

Defined in: types/event.ts:22

## Properties

### agent:end

> **agent:end**: `object`

Defined in: types/event.ts:24

#### reason

> **reason**: [`FinishReason`](FinishReason.md)

***

### agent:error

> **agent:error**: `object`

Defined in: types/event.ts:25

#### reason

> **reason**: [`FinishReason`](FinishReason.md)

***

### agent:start

> **agent:start**: `object`

Defined in: types/event.ts:23

#### agentId

> **agentId**: `string`

***

### llm:chunk

> **llm:chunk**: `object`

Defined in: types/event.ts:27

#### content

> **content**: `string`

***

### llm:end

> **llm:end**: `object`

Defined in: types/event.ts:29

#### error?

> `optional` **error?**: `string`

#### status?

> `optional` **status?**: `string`

***

### llm:reasoning

> **llm:reasoning**: `object`

Defined in: types/event.ts:28

#### content

> **content**: `string`

***

### llm:start

> **llm:start**: `object`

Defined in: types/event.ts:26

#### model

> **model**: `string`

***

### orch:complete

> **orch:complete**: `object`

Defined in: types/event.ts:35

#### executorId

> **executorId**: `string`

#### reason

> **reason**: `unknown`

***

### orch:spawn

> **orch:spawn**: `object`

Defined in: types/event.ts:34

#### executorId

> **executorId**: `string`

#### task

> **task**: `string`

***

### orch:task\_complete

> **orch:task\_complete**: `object`

Defined in: types/event.ts:37

#### executorId

> **executorId**: `string`

#### result

> **result**: `string`

#### taskId

> **taskId**: `string`

***

### orch:task\_failed

> **orch:task\_failed**: `object`

Defined in: types/event.ts:38

#### error

> **error**: `string`

#### executorId

> **executorId**: `string`

#### taskId

> **taskId**: `string`

***

### orch:task\_start

> **orch:task\_start**: `object`

Defined in: types/event.ts:36

#### dependencies

> **dependencies**: `string`[]

#### executorId

> **executorId**: `string`

#### task

> **task**: `string`

#### taskId

> **taskId**: `string`

***

### pattern:end

> **pattern:end**: `Record`\<`string`, `unknown`\>

Defined in: types/event.ts:33

***

### pattern:start

> **pattern:start**: `Record`\<`string`, `unknown`\>

Defined in: types/event.ts:32

***

### tool:end

> **tool:end**: `object`

Defined in: types/event.ts:31

#### name

> **name**: `string`

#### result

> **result**: [`ToolResult`](ToolResult.md)

***

### tool:start

> **tool:start**: `object`

Defined in: types/event.ts:30

#### arguments

> **arguments**: `string`

#### name

> **name**: `string`
