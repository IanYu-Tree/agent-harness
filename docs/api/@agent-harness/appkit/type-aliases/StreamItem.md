[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/appkit](../index.md) / StreamItem

# Type Alias: StreamItem

> **StreamItem** = \{ `id`: `number`; `text`: `string`; `type`: `"user"`; \} \| \{ `agentId?`: `string`; `id`: `number`; `text`: `string`; `type`: `"assistant"`; \} \| \{ `agentId?`: `string`; `id`: `number`; `thought`: `string`; `type`: `"thinking"`; \} \| \{ `agentId?`: `string`; `id`: `number`; `tools`: [`ToolItemState`](../interfaces/ToolItemState.md)[]; `type`: `"tool_group"`; \} \| \{ `id`: `number`; `text`: `string`; `type`: `"error"`; \} \| \{ `id`: `number`; `label`: `string`; `type`: `"spinner"`; \}

Defined in: types.ts:58
