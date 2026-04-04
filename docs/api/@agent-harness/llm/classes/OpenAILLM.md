[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/llm](../index.md) / OpenAILLM

# Class: OpenAILLM

Defined in: packages/llm/src/providers/openai/openai-llm.ts:14

## Implements

- [`LLM`](../interfaces/LLM.md)

## Constructors

### Constructor

> **new OpenAILLM**(`options`): `OpenAILLM`

Defined in: packages/llm/src/providers/openai/openai-llm.ts:22

#### Parameters

##### options

[`LLMConfig`](../../core/interfaces/LLMConfig.md)

#### Returns

`OpenAILLM`

## Properties

### messageFactory

> `readonly` **messageFactory**: [`MessageFactory`](../../core/interfaces/MessageFactory.md)

Defined in: packages/llm/src/providers/openai/openai-llm.ts:15

#### Implementation of

[`LLM`](../interfaces/LLM.md).[`messageFactory`](../interfaces/LLM.md#messagefactory)

## Methods

### runStream()

> **runStream**(`params`): `AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md), \{ `messages`: [`Message`](../../core/classes/Message.md)[]; `reason`: [`FinishReason`](../../core/interfaces/FinishReason.md); \}\>

Defined in: packages/llm/src/providers/openai/openai-llm.ts:35

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

#### Implementation of

[`LLM`](../interfaces/LLM.md).[`runStream`](../interfaces/LLM.md#runstream)
