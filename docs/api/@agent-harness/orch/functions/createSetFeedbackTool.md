[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/orch](../index.md) / createSetFeedbackTool

# Function: createSetFeedbackTool()

> **createSetFeedbackTool**(`store`): [`Tool`](../../core/interfaces/Tool.md)\<`ZodObject`\<\{ `feedback`: `ZodString`; `passed`: `ZodBoolean`; \}, `"strip"`, `ZodTypeAny`, \{ `feedback`: `string`; `passed`: `boolean`; \}, \{ `feedback`: `string`; `passed`: `boolean`; \}\>\>

Defined in: patterns/reflextion/feedback-tools.ts:12

## Parameters

### store

[`FeedbackStore`](../classes/FeedbackStore.md)

## Returns

[`Tool`](../../core/interfaces/Tool.md)\<`ZodObject`\<\{ `feedback`: `ZodString`; `passed`: `ZodBoolean`; \}, `"strip"`, `ZodTypeAny`, \{ `feedback`: `string`; `passed`: `boolean`; \}, \{ `feedback`: `string`; `passed`: `boolean`; \}\>\>
