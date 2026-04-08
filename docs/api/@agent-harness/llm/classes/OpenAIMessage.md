[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/llm](../index.md) / OpenAIMessage

# Class: OpenAIMessage

Defined in: packages/llm/src/providers/openai/openai-message.ts:6

## Extends

- [`Message`](../../core/classes/Message.md)

## Constructors

### Constructor

> **new OpenAIMessage**(`params`): `OpenAIMessage`

Defined in: packages/llm/src/providers/openai/openai-message.ts:13

#### Parameters

##### params

###### content

`string`

###### raw

`ResponseInputItem`

###### role

[`MessageRole`](../../core/type-aliases/MessageRole.md)

###### toolCallId?

`string`

###### toolCalls?

[`ToolCall`](../../core/interfaces/ToolCall.md)[]

#### Returns

`OpenAIMessage`

#### Overrides

[`Message`](../../core/classes/Message.md).[`constructor`](../../core/classes/Message.md#constructor)

## Accessors

### content

#### Get Signature

> **get** **content**(): `string`

Defined in: packages/llm/src/providers/openai/openai-message.ts:29

##### Returns

`string`

#### Overrides

[`Message`](../../core/classes/Message.md).[`content`](../../core/classes/Message.md#content)

***

### role

#### Get Signature

> **get** **role**(): [`MessageRole`](../../core/type-aliases/MessageRole.md)

Defined in: packages/llm/src/providers/openai/openai-message.ts:28

##### Returns

[`MessageRole`](../../core/type-aliases/MessageRole.md)

#### Overrides

[`Message`](../../core/classes/Message.md).[`role`](../../core/classes/Message.md#role)

## Methods

### getToolCallId()

> **getToolCallId**(): `string` \| `undefined`

Defined in: packages/llm/src/providers/openai/openai-message.ts:32

#### Returns

`string` \| `undefined`

#### Overrides

[`Message`](../../core/classes/Message.md).[`getToolCallId`](../../core/classes/Message.md#gettoolcallid)

***

### getToolCalls()

> **getToolCalls**(): [`ToolCall`](../../core/interfaces/ToolCall.md)[]

Defined in: packages/llm/src/providers/openai/openai-message.ts:31

#### Returns

[`ToolCall`](../../core/interfaces/ToolCall.md)[]

#### Overrides

[`Message`](../../core/classes/Message.md).[`getToolCalls`](../../core/classes/Message.md#gettoolcalls)

***

### isAssistant()

> **isAssistant**(): `boolean`

Defined in: packages/core/src/types/message.ts:16

#### Returns

`boolean`

#### Inherited from

[`Message`](../../core/classes/Message.md).[`isAssistant`](../../core/classes/Message.md#isassistant)

***

### isSystem()

> **isSystem**(): `boolean`

Defined in: packages/core/src/types/message.ts:14

#### Returns

`boolean`

#### Inherited from

[`Message`](../../core/classes/Message.md).[`isSystem`](../../core/classes/Message.md#issystem)

***

### isToolCall()

> **isToolCall**(): `boolean`

Defined in: packages/core/src/types/message.ts:17

#### Returns

`boolean`

#### Inherited from

[`Message`](../../core/classes/Message.md).[`isToolCall`](../../core/classes/Message.md#istoolcall)

***

### isToolResult()

> **isToolResult**(): `boolean`

Defined in: packages/core/src/types/message.ts:18

#### Returns

`boolean`

#### Inherited from

[`Message`](../../core/classes/Message.md).[`isToolResult`](../../core/classes/Message.md#istoolresult)

***

### isUser()

> **isUser**(): `boolean`

Defined in: packages/core/src/types/message.ts:15

#### Returns

`boolean`

#### Inherited from

[`Message`](../../core/classes/Message.md).[`isUser`](../../core/classes/Message.md#isuser)

***

### toRaw()

> **toRaw**(): `ResponseInputItem`

Defined in: packages/llm/src/providers/openai/openai-message.ts:34

#### Returns

`ResponseInputItem`

#### Overrides

[`Message`](../../core/classes/Message.md).[`toRaw`](../../core/classes/Message.md#toraw)
