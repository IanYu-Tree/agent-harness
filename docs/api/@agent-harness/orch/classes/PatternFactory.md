[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/orch](../index.md) / PatternFactory

# Class: PatternFactory

Defined in: factory/pattern-factory.ts:8

## Constructors

### Constructor

> **new PatternFactory**(`deps`): `PatternFactory`

Defined in: factory/pattern-factory.ts:9

#### Parameters

##### deps

[`PatternDeps`](../interfaces/PatternDeps.md)

#### Returns

`PatternFactory`

## Methods

### create()

> **create**(`config`): [`PatternRunner`](../interfaces/PatternRunner.md)

Defined in: factory/pattern-factory.ts:11

#### Parameters

##### config

[`OrchConfig`](../../core/interfaces/OrchConfig.md)

#### Returns

[`PatternRunner`](../interfaces/PatternRunner.md)

***

### resolveAgent()

> **resolveAgent**(`agentOrOrch`): [`AgentConfig`](../../core/interfaces/AgentConfig.md) \| [`PatternRunner`](../interfaces/PatternRunner.md)

Defined in: factory/pattern-factory.ts:27

#### Parameters

##### agentOrOrch

[`AgentConfig`](../../core/interfaces/AgentConfig.md) \| [`OrchConfig`](../../core/interfaces/OrchConfig.md)

#### Returns

[`AgentConfig`](../../core/interfaces/AgentConfig.md) \| [`PatternRunner`](../interfaces/PatternRunner.md)
