[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/orch](../index.md) / PatternRunner

# Interface: PatternRunner

Defined in: types.ts:3

## Properties

### id

> **id**: `string`

Defined in: types.ts:4

## Methods

### run()

> **run**(`userInput`, `ctx`): `AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md), \{ `reason`: [`FinishReason`](../../core/interfaces/FinishReason.md); \}\>

Defined in: types.ts:5

#### Parameters

##### userInput

[`UserInput`](../../core/type-aliases/UserInput.md)

##### ctx

[`PatternRunContext`](PatternRunContext.md)

#### Returns

`AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md), \{ `reason`: [`FinishReason`](../../core/interfaces/FinishReason.md); \}\>
