[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/llm](../index.md) / OpenAIMessageFactory

# Class: OpenAIMessageFactory

Defined in: packages/llm/src/providers/openai/openai-message.ts:37

## Implements

- [`MessageFactory`](../../core/interfaces/MessageFactory.md)

## Constructors

### Constructor

> **new OpenAIMessageFactory**(): `OpenAIMessageFactory`

#### Returns

`OpenAIMessageFactory`

## Methods

### assistant()

> **assistant**(`content`): [`Message`](../../core/classes/Message.md)

Defined in: packages/llm/src/providers/openai/openai-message.ts:54

#### Parameters

##### content

`string`

#### Returns

[`Message`](../../core/classes/Message.md)

#### Implementation of

[`MessageFactory`](../../core/interfaces/MessageFactory.md).[`assistant`](../../core/interfaces/MessageFactory.md#assistant)

***

### fromOutputItem()

> **fromOutputItem**(`outputItem`): [`Message`](../../core/classes/Message.md)

Defined in: packages/llm/src/providers/openai/openai-message.ts:84

#### Parameters

##### outputItem

`ResponseOutputItem`

#### Returns

[`Message`](../../core/classes/Message.md)

***

### fromRawUserInput()

> **fromRawUserInput**(`content`, `raw`): [`Message`](../../core/classes/Message.md)

Defined in: packages/llm/src/providers/openai/openai-message.ts:80

#### Parameters

##### content

`string`

##### raw

`ResponseInputItem`

#### Returns

[`Message`](../../core/classes/Message.md)

***

### system()

> **system**(`content`): [`Message`](../../core/classes/Message.md)

Defined in: packages/llm/src/providers/openai/openai-message.ts:38

#### Parameters

##### content

`string`

#### Returns

[`Message`](../../core/classes/Message.md)

#### Implementation of

[`MessageFactory`](../../core/interfaces/MessageFactory.md).[`system`](../../core/interfaces/MessageFactory.md#system)

***

### toolCall()

> **toolCall**(`toolCalls`, `raw?`): [`Message`](../../core/classes/Message.md)

Defined in: packages/llm/src/providers/openai/openai-message.ts:62

#### Parameters

##### toolCalls

[`ToolCall`](../../core/interfaces/ToolCall.md)[]

##### raw?

`unknown`

#### Returns

[`Message`](../../core/classes/Message.md)

#### Implementation of

[`MessageFactory`](../../core/interfaces/MessageFactory.md).[`toolCall`](../../core/interfaces/MessageFactory.md#toolcall)

***

### toolResult()

> **toolResult**(`toolCallId`, `content`): [`Message`](../../core/classes/Message.md)

Defined in: packages/llm/src/providers/openai/openai-message.ts:71

#### Parameters

##### toolCallId

`string`

##### content

`string`

#### Returns

[`Message`](../../core/classes/Message.md)

#### Implementation of

[`MessageFactory`](../../core/interfaces/MessageFactory.md).[`toolResult`](../../core/interfaces/MessageFactory.md#toolresult)

***

### user()

> **user**(`content`): [`Message`](../../core/classes/Message.md)

Defined in: packages/llm/src/providers/openai/openai-message.ts:46

#### Parameters

##### content

`string`

#### Returns

[`Message`](../../core/classes/Message.md)

#### Implementation of

[`MessageFactory`](../../core/interfaces/MessageFactory.md).[`user`](../../core/interfaces/MessageFactory.md#user)
