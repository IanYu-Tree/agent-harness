[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/orch](../index.md) / ReflextionPattern

# Class: ReflextionPattern

Defined in: patterns/reflextion/reflextion-pattern.ts:45

## Implements

- [`PatternRunner`](../interfaces/PatternRunner.md)

## Constructors

### Constructor

> **new ReflextionPattern**(`id`, `config`, `deps`, `factory`): `ReflextionPattern`

Defined in: patterns/reflextion/reflextion-pattern.ts:52

#### Parameters

##### id

`string`

##### config

[`OrchConfig`](../../core/interfaces/OrchConfig.md)

##### deps

[`PatternDeps`](../interfaces/PatternDeps.md)

##### factory

[`PatternFactory`](PatternFactory.md)

#### Returns

`ReflextionPattern`

## Properties

### id

> **id**: `string`

Defined in: patterns/reflextion/reflextion-pattern.ts:46

#### Implementation of

[`PatternRunner`](../interfaces/PatternRunner.md).[`id`](../interfaces/PatternRunner.md#id)

## Methods

### run()

> **run**(`userInput`, `ctx`): `AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md), \{ `reason`: [`FinishReason`](../../core/interfaces/FinishReason.md); \}\>

Defined in: patterns/reflextion/reflextion-pattern.ts:67

#### Parameters

##### userInput

[`UserInput`](../../core/type-aliases/UserInput.md)

##### ctx

[`PatternRunContext`](../interfaces/PatternRunContext.md)

#### Returns

`AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md), \{ `reason`: [`FinishReason`](../../core/interfaces/FinishReason.md); \}\>

#### Implementation of

[`PatternRunner`](../interfaces/PatternRunner.md).[`run`](../interfaces/PatternRunner.md#run)
