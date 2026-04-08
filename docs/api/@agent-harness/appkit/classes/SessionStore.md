[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/appkit](../index.md) / SessionStore

# Class: SessionStore

Defined in: session-store.ts:8

## Constructors

### Constructor

> **new SessionStore**(`dir`): `SessionStore`

Defined in: session-store.ts:12

#### Parameters

##### dir

`string`

#### Returns

`SessionStore`

## Methods

### addMessage()

> **addMessage**(`sessionId`, `message`): `void`

Defined in: session-store.ts:91

#### Parameters

##### sessionId

`string`

##### message

[`ChatMessage`](../interfaces/ChatMessage.md)

#### Returns

`void`

***

### create()

> **create**(`orchId`, `title?`): [`SessionData`](../interfaces/SessionData.md)

Defined in: session-store.ts:23

#### Parameters

##### orchId

`string`

##### title?

`string`

#### Returns

[`SessionData`](../interfaces/SessionData.md)

***

### delete()

> **delete**(`sessionId`): `boolean`

Defined in: session-store.ts:58

#### Parameters

##### sessionId

`string`

#### Returns

`boolean`

***

### list()

> **list**(): [`SessionSummary`](../interfaces/SessionSummary.md)[]

Defined in: session-store.ts:66

#### Returns

[`SessionSummary`](../interfaces/SessionSummary.md)[]

***

### load()

> **load**(`sessionId`): [`SessionData`](../interfaces/SessionData.md) \| `null`

Defined in: session-store.ts:37

#### Parameters

##### sessionId

`string`

#### Returns

[`SessionData`](../interfaces/SessionData.md) \| `null`

***

### save()

> **save**(`session`): `void`

Defined in: session-store.ts:52

#### Parameters

##### session

[`SessionData`](../interfaces/SessionData.md)

#### Returns

`void`

***

### updateTitle()

> **updateTitle**(`sessionId`, `title`): `void`

Defined in: session-store.ts:98

#### Parameters

##### sessionId

`string`

##### title

`string`

#### Returns

`void`
