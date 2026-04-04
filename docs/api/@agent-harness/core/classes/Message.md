[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/core](../index.md) / Message

# Abstract Class: Message

Defined in: types/message.ts:10

## Extended by

- [`OpenAIMessage`](../../llm/classes/OpenAIMessage.md)

## Constructors

### Constructor

> **new Message**(): `Message`

#### Returns

`Message`

## Accessors

### content

#### Get Signature

> **get** `abstract` **content**(): `string`

Defined in: types/message.ts:12

##### Returns

`string`

***

### role

#### Get Signature

> **get** `abstract` **role**(): [`MessageRole`](../type-aliases/MessageRole.md)

Defined in: types/message.ts:11

##### Returns

[`MessageRole`](../type-aliases/MessageRole.md)

## Methods

### getToolCallId()

> **getToolCallId**(): `string` \| `undefined`

Defined in: types/message.ts:21

#### Returns

`string` \| `undefined`

***

### getToolCalls()

> **getToolCalls**(): [`ToolCall`](../interfaces/ToolCall.md)[]

Defined in: types/message.ts:20

#### Returns

[`ToolCall`](../interfaces/ToolCall.md)[]

***

### isAssistant()

> **isAssistant**(): `boolean`

Defined in: types/message.ts:16

#### Returns

`boolean`

***

### isSystem()

> **isSystem**(): `boolean`

Defined in: types/message.ts:14

#### Returns

`boolean`

***

### isToolCall()

> **isToolCall**(): `boolean`

Defined in: types/message.ts:17

#### Returns

`boolean`

***

### isToolResult()

> **isToolResult**(): `boolean`

Defined in: types/message.ts:18

#### Returns

`boolean`

***

### isUser()

> **isUser**(): `boolean`

Defined in: types/message.ts:15

#### Returns

`boolean`

***

### toRaw()

> `abstract` **toRaw**(): `unknown`

Defined in: types/message.ts:23

#### Returns

`unknown`
