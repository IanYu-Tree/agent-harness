[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/orch](../index.md) / FeedbackStore

# Class: FeedbackStore

Defined in: patterns/reflextion/feedback-store.ts:1

## Constructors

### Constructor

> **new FeedbackStore**(): `FeedbackStore`

#### Returns

`FeedbackStore`

## Properties

### executorOutput

> **executorOutput**: `string` = `''`

Defined in: patterns/reflextion/feedback-store.ts:5

***

### feedback

> **feedback**: `string` = `''`

Defined in: patterns/reflextion/feedback-store.ts:2

***

### passed

> **passed**: `boolean` = `false`

Defined in: patterns/reflextion/feedback-store.ts:3

***

### round

> **round**: `number` = `0`

Defined in: patterns/reflextion/feedback-store.ts:4

## Methods

### getFeedback()

> **getFeedback**(): `object`

Defined in: patterns/reflextion/feedback-store.ts:12

#### Returns

`object`

##### feedback

> **feedback**: `string`

##### passed

> **passed**: `boolean`

##### round

> **round**: `number`

***

### nextRound()

> **nextRound**(): `void`

Defined in: patterns/reflextion/feedback-store.ts:24

#### Returns

`void`

***

### setExecutorOutput()

> **setExecutorOutput**(`output`): `void`

Defined in: patterns/reflextion/feedback-store.ts:20

#### Parameters

##### output

`string`

#### Returns

`void`

***

### setFeedback()

> **setFeedback**(`feedback`, `passed`): `void`

Defined in: patterns/reflextion/feedback-store.ts:7

#### Parameters

##### feedback

`string`

##### passed

`boolean`

#### Returns

`void`
