[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/orch](../index.md) / PlannerExecutorPattern

# Class: PlannerExecutorPattern

Defined in: patterns/planner-executor/planner-executor-pattern.ts:8

## Implements

- [`PatternRunner`](../interfaces/PatternRunner.md)

## Constructors

### Constructor

> **new PlannerExecutorPattern**(`id`, `config`, `deps`, `factory`): `PlannerExecutorPattern`

Defined in: patterns/planner-executor/planner-executor-pattern.ts:14

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

`PlannerExecutorPattern`

## Properties

### id

> **id**: `string`

Defined in: patterns/planner-executor/planner-executor-pattern.ts:9

#### Implementation of

[`PatternRunner`](../interfaces/PatternRunner.md).[`id`](../interfaces/PatternRunner.md#id)

## Methods

### run()

> **run**(`userInput`, `ctx`): `AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md), \{ `reason`: [`FinishReason`](../../core/interfaces/FinishReason.md); \}\>

Defined in: patterns/planner-executor/planner-executor-pattern.ts:29

#### Parameters

##### userInput

[`UserInput`](../../core/type-aliases/UserInput.md)

##### ctx

[`PatternRunContext`](../interfaces/PatternRunContext.md)

#### Returns

`AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md), \{ `reason`: [`FinishReason`](../../core/interfaces/FinishReason.md); \}\>

#### Implementation of

[`PatternRunner`](../interfaces/PatternRunner.md).[`run`](../interfaces/PatternRunner.md#run)
