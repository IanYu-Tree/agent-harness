[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/appkit](../index.md) / ChatStreamProcessor

# Class: ChatStreamProcessor

Defined in: chat-stream-processor.ts:25

## Constructors

### Constructor

> **new ChatStreamProcessor**(): `ChatStreamProcessor`

#### Returns

`ChatStreamProcessor`

## Methods

### processStream()

> **processStream**(`stream`, `onUpdate`, `eventCollector?`): `Promise`\<[`ChatMessage`](../interfaces/ChatMessage.md)[]\>

Defined in: chat-stream-processor.ts:188

#### Parameters

##### stream

`AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md), `void`\>

##### onUpdate

(`update`) => `void`

##### eventCollector?

[`StreamEventCollector`](../../core/classes/StreamEventCollector.md)

#### Returns

`Promise`\<[`ChatMessage`](../interfaces/ChatMessage.md)[]\>
