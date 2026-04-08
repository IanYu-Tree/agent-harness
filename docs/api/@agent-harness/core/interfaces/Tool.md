[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/core](../index.md) / Tool

# Interface: Tool\<TParams\>

Defined in: types/tool.ts:5

## Type Parameters

### TParams

`TParams` *extends* `z.ZodType` = `any`

## Properties

### description

> **description**: `string`

Defined in: types/tool.ts:7

***

### execute

> **execute**: (`params`, `context`) => `Promise`\<[`ToolResult`](ToolResult.md)\>

Defined in: types/tool.ts:9

#### Parameters

##### params

`TypeOf`\<`TParams`\>

##### context

[`ToolContext`](ToolContext.md)

#### Returns

`Promise`\<[`ToolResult`](ToolResult.md)\>

***

### name

> **name**: `string`

Defined in: types/tool.ts:6

***

### parameters

> **parameters**: `TParams`

Defined in: types/tool.ts:8
