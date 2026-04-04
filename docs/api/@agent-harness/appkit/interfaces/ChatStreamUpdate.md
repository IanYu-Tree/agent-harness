[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/appkit](../index.md) / ChatStreamUpdate

# Interface: ChatStreamUpdate

Defined in: types.ts:66

## Properties

### error?

> `optional` **error?**: `string`

Defined in: types.ts:70

***

### finalizedMessages?

> `optional` **finalizedMessages?**: [`ChatMessage`](ChatMessage.md)[]

Defined in: types.ts:69

***

### pendingItems

> **pendingItems**: [`StreamItem`](../type-aliases/StreamItem.md)[]

Defined in: types.ts:68

***

### type

> **type**: `"error"` \| `"items-changed"` \| `"items-finalized"`

Defined in: types.ts:67
