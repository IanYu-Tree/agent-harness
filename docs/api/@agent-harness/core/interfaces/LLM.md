[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/core](../index.md) / LLM

# Interface: LLM

Defined in: types/llm.ts:8

## Properties

### messageFactory

> `readonly` **messageFactory**: [`MessageFactory`](MessageFactory.md)

Defined in: types/llm.ts:9

## Methods

### runStream()

> **runStream**(`params`): `AsyncGenerator`\<[`StreamEvent`](StreamEvent.md), \{ `messages`: [`Message`](../classes/Message.md)[]; `reason`: [`FinishReason`](FinishReason.md); \}\>

Defined in: types/llm.ts:10

#### Parameters

##### params

###### messages

[`Message`](../classes/Message.md)[]

###### tools?

[`Tool`](Tool.md)\<`any`\>[]

###### userInput

[`UserInput`](../type-aliases/UserInput.md)

#### Returns

`AsyncGenerator`\<[`StreamEvent`](StreamEvent.md), \{ `messages`: [`Message`](../classes/Message.md)[]; `reason`: [`FinishReason`](FinishReason.md); \}\>
