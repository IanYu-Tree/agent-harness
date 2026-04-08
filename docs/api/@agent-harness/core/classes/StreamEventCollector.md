[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/core](../index.md) / StreamEventCollector

# Class: StreamEventCollector

Defined in: stream-event-collector.ts:3

## Constructors

### Constructor

> **new StreamEventCollector**(): `StreamEventCollector`

#### Returns

`StreamEventCollector`

## Properties

### eventBuffer

> **eventBuffer**: [`StreamEvent`](../interfaces/StreamEvent.md)[] = `[]`

Defined in: stream-event-collector.ts:4

***

### observers

> **observers**: `object`[] = `[]`

Defined in: stream-event-collector.ts:5

#### filter?

> `optional` **filter?**: (`event`) => `boolean`

##### Parameters

###### event

[`StreamEvent`](../interfaces/StreamEvent.md)

##### Returns

`boolean`

#### observer

> **observer**: (`event`) => `void`

##### Parameters

###### event

[`StreamEvent`](../interfaces/StreamEvent.md)

##### Returns

`void`

#### subId

> **subId**: `string`

## Methods

### publish()

> **publish**(`event`): `void`

Defined in: stream-event-collector.ts:24

#### Parameters

##### event

[`StreamEvent`](../interfaces/StreamEvent.md)

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: stream-event-collector.ts:33

#### Returns

`void`

***

### subscribe()

> **subscribe**(`observer`, `filter?`): `string`

Defined in: stream-event-collector.ts:11

#### Parameters

##### observer

(`event`) => `void`

##### filter?

(`event`) => `boolean`

#### Returns

`string`

***

### unsubscribe()

> **unsubscribe**(`subId`): `void`

Defined in: stream-event-collector.ts:20

#### Parameters

##### subId

`string`

#### Returns

`void`
