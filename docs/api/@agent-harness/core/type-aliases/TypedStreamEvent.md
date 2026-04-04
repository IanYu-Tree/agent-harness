[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/core](../index.md) / TypedStreamEvent

# Type Alias: TypedStreamEvent\<K\>

> **TypedStreamEvent**\<`K`\> = `object`

Defined in: types/event.ts:49

## Type Parameters

### K

`K` *extends* [`StreamEventType`](StreamEventType.md) = [`StreamEventType`](StreamEventType.md)

## Properties

### agentId?

> `optional` **agentId?**: `string`

Defined in: types/event.ts:52

***

### data

> **data**: [`StreamEventDataMap`](../interfaces/StreamEventDataMap.md)\[`K`\]

Defined in: types/event.ts:54

***

### patternId?

> `optional` **patternId?**: `string`

Defined in: types/event.ts:53

***

### timestamp

> **timestamp**: `number`

Defined in: types/event.ts:51

***

### type

> **type**: `K`

Defined in: types/event.ts:50
