[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/core](../index.md) / AsyncEventGenerator

# Class: AsyncEventGenerator\<T\>

Defined in: async-event-generator.ts:1

## Type Parameters

### T

`T`

## Constructors

### Constructor

> **new AsyncEventGenerator**\<`T`\>(): `AsyncEventGenerator`\<`T`\>

#### Returns

`AsyncEventGenerator`\<`T`\>

## Methods

### done()

> **done**(`taskId`): `void`

Defined in: async-event-generator.ts:23

#### Parameters

##### taskId

`string`

#### Returns

`void`

***

### eventGenerator()

> **eventGenerator**(`taskId`): `AsyncGenerator`\<`T`, `void`, `unknown`\>

Defined in: async-event-generator.ts:54

#### Parameters

##### taskId

`string`

#### Returns

`AsyncGenerator`\<`T`, `void`, `unknown`\>

***

### isRunning()

> **isRunning**(`taskId`): `boolean`

Defined in: async-event-generator.ts:47

#### Parameters

##### taskId

`string`

#### Returns

`boolean`

***

### onEvent()

> **onEvent**(`event`): `void`

Defined in: async-event-generator.ts:8

#### Parameters

##### event

`T`

#### Returns

`void`

***

### start()

> **start**(): `void`

Defined in: async-event-generator.ts:19

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: async-event-generator.ts:37

#### Returns

`void`
