[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/orch](../index.md) / SingleAgentPattern

# Class: SingleAgentPattern

Defined in: patterns/single-agent/single-agent-pattern.ts:6

## Implements

- [`PatternRunner`](../interfaces/PatternRunner.md)

## Constructors

### Constructor

> **new SingleAgentPattern**(`id`, `agentConfig`, `deps`): `SingleAgentPattern`

Defined in: patterns/single-agent/single-agent-pattern.ts:13

#### Parameters

##### id

`string`

##### agentConfig

[`AgentConfig`](../../core/interfaces/AgentConfig.md)

##### deps

[`PatternDeps`](../interfaces/PatternDeps.md)

#### Returns

`SingleAgentPattern`

## Properties

### id

> `readonly` **id**: `string`

Defined in: patterns/single-agent/single-agent-pattern.ts:7

#### Implementation of

[`PatternRunner`](../interfaces/PatternRunner.md).[`id`](../interfaces/PatternRunner.md#id)

## Methods

### run()

> **run**(`userInput`, `ctx`): `AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md), \{ `reason`: [`FinishReason`](../../core/interfaces/FinishReason.md); \}\>

Defined in: patterns/single-agent/single-agent-pattern.ts:30

#### Parameters

##### userInput

[`UserInput`](../../core/type-aliases/UserInput.md)

##### ctx

[`PatternRunContext`](../interfaces/PatternRunContext.md)

#### Returns

`AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md), \{ `reason`: [`FinishReason`](../../core/interfaces/FinishReason.md); \}\>

#### Implementation of

[`PatternRunner`](../interfaces/PatternRunner.md).[`run`](../interfaces/PatternRunner.md#run)
