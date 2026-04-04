[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/llm](../index.md) / LLM

# Interface: LLM

Defined in: packages/core/src/types/llm.ts:8

## Properties

### messageFactory

> `readonly` **messageFactory**: [`MessageFactory`](../../core/interfaces/MessageFactory.md)

Defined in: packages/core/src/types/llm.ts:9

## Methods

### runStream()

> **runStream**(`params`): `AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md), \{ `messages`: [`Message`](../../core/classes/Message.md)[]; `reason`: [`FinishReason`](../../core/interfaces/FinishReason.md); \}\>

Defined in: packages/core/src/types/llm.ts:10

#### Parameters

##### params

###### messages

[`Message`](../../core/classes/Message.md)[]

###### tools?

[`Tool`](../../core/interfaces/Tool.md)\<`any`\>[]

###### userInput

[`UserInput`](../../core/type-aliases/UserInput.md)

#### Returns

`AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md), \{ `messages`: [`Message`](../../core/classes/Message.md)[]; `reason`: [`FinishReason`](../../core/interfaces/FinishReason.md); \}\>
