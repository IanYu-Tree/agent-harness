[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/react-agent](../index.md) / Agent

# Class: Agent

Defined in: agent.ts:19

## Constructors

### Constructor

> **new Agent**(`options`): `Agent`

Defined in: agent.ts:34

#### Parameters

##### options

###### config

[`AgentConfig`](../../core/interfaces/AgentConfig.md)

###### ctx?

[`CTX`](../../core/interfaces/CTX.md)

###### llm

[`LLM`](../../core/interfaces/LLM.md)

#### Returns

`Agent`

## Properties

### ctx

> **ctx**: [`CTX`](../../core/interfaces/CTX.md)

Defined in: agent.ts:22

***

### messages

> **messages**: [`Message`](../../core/classes/Message.md)[]

Defined in: agent.ts:20

***

### tools

> **tools**: [`Tool`](../../core/interfaces/Tool.md)\<`any`\>[]

Defined in: agent.ts:21

## Methods

### compactMessages()

> **compactMessages**(): `Promise`\<`void`\>

Defined in: agent.ts:304

#### Returns

`Promise`\<`void`\>

***

### interrupt()

> **interrupt**(): `void`

Defined in: agent.ts:58

#### Returns

`void`

***

### microcompactMessages()

> **microcompactMessages**(): `Promise`\<`void`\>

Defined in: agent.ts:300

#### Returns

`Promise`\<`void`\>

***

### resolve()

> **resolve**(`result`): `void`

Defined in: agent.ts:50

#### Parameters

##### result

[`ConfirmationResult`](../interfaces/ConfirmationResult.md)

#### Returns

`void`

***

### runStream()

> **runStream**(`userInput`): `AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md) \| [`ConfirmationEvent`](../interfaces/ConfirmationEvent.md), \{ `messages`: [`Message`](../../core/classes/Message.md)[]; `reason`: [`FinishReason`](../../core/interfaces/FinishReason.md); \}\>

Defined in: agent.ts:62

#### Parameters

##### userInput

[`UserInput`](../../core/type-aliases/UserInput.md)

#### Returns

`AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md) \| [`ConfirmationEvent`](../interfaces/ConfirmationEvent.md), \{ `messages`: [`Message`](../../core/classes/Message.md)[]; `reason`: [`FinishReason`](../../core/interfaces/FinishReason.md); \}\>
