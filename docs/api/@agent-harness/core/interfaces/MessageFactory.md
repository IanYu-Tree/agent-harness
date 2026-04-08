[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/core](../index.md) / MessageFactory

# Interface: MessageFactory

Defined in: types/message.ts:26

## Methods

### assistant()

> **assistant**(`content`): [`Message`](../classes/Message.md)

Defined in: types/message.ts:29

#### Parameters

##### content

`string`

#### Returns

[`Message`](../classes/Message.md)

***

### system()

> **system**(`content`): [`Message`](../classes/Message.md)

Defined in: types/message.ts:27

#### Parameters

##### content

`string`

#### Returns

[`Message`](../classes/Message.md)

***

### toolCall()

> **toolCall**(`toolCalls`, `raw?`): [`Message`](../classes/Message.md)

Defined in: types/message.ts:30

#### Parameters

##### toolCalls

[`ToolCall`](ToolCall.md)[]

##### raw?

`unknown`

#### Returns

[`Message`](../classes/Message.md)

***

### toolResult()

> **toolResult**(`toolCallId`, `content`): [`Message`](../classes/Message.md)

Defined in: types/message.ts:31

#### Parameters

##### toolCallId

`string`

##### content

`string`

#### Returns

[`Message`](../classes/Message.md)

***

### user()

> **user**(`content`): [`Message`](../classes/Message.md)

Defined in: types/message.ts:28

#### Parameters

##### content

`string`

#### Returns

[`Message`](../classes/Message.md)
