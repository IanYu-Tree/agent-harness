[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/appkit](../index.md) / AgentOrch

# Class: AgentOrch

Defined in: orch.ts:27

## Constructors

### Constructor

> **new AgentOrch**(`config`): `AgentOrch`

Defined in: orch.ts:36

#### Parameters

##### config

[`HarnessConfig`](../interfaces/HarnessConfig.md)

#### Returns

`AgentOrch`

## Methods

### chatStream()

> **chatStream**(`userInput`): `AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md), `void`\>

Defined in: orch.ts:106

#### Parameters

##### userInput

`string`

#### Returns

`AsyncGenerator`\<[`StreamEvent`](../../core/interfaces/StreamEvent.md), `void`\>

***

### clearRunnerCache()

> **clearRunnerCache**(`sessionId?`): `void`

Defined in: orch.ts:98

#### Parameters

##### sessionId?

`string`

#### Returns

`void`

***

### getActiveOrch()

> **getActiveOrch**(): [`OrchEntry`](../interfaces/OrchEntry.md) \| `undefined`

Defined in: orch.ts:60

#### Returns

[`OrchEntry`](../interfaces/OrchEntry.md) \| `undefined`

***

### getActiveOrchId()

> **getActiveOrchId**(): `string`

Defined in: orch.ts:56

#### Returns

`string`

***

### getActiveSessionId()

> **getActiveSessionId**(): `string` \| `null`

Defined in: orch.ts:75

#### Returns

`string` \| `null`

***

### getEventCollector()

> **getEventCollector**(): [`StreamEventCollector`](../../core/classes/StreamEventCollector.md)

Defined in: orch.ts:83

#### Returns

[`StreamEventCollector`](../../core/classes/StreamEventCollector.md)

***

### getSessionStore()

> **getSessionStore**(): [`SessionStore`](SessionStore.md)

Defined in: orch.ts:71

#### Returns

[`SessionStore`](SessionStore.md)

***

### listOrchs()

> **listOrchs**(): `Pick`\<[`OrchEntry`](../interfaces/OrchEntry.md), `"name"` \| `"id"` \| `"description"`\>[]

Defined in: orch.ts:52

#### Returns

`Pick`\<[`OrchEntry`](../interfaces/OrchEntry.md), `"name"` \| `"id"` \| `"description"`\>[]

***

### saveSessionMessages()

> **saveSessionMessages**(`messages`): `void`

Defined in: orch.ts:154

#### Parameters

##### messages

[`ChatMessage`](../interfaces/ChatMessage.md)[]

#### Returns

`void`

***

### setActiveSessionId()

> **setActiveSessionId**(`sessionId`): `void`

Defined in: orch.ts:79

#### Parameters

##### sessionId

`string` \| `null`

#### Returns

`void`

***

### registerOrch()

> **registerOrch**(`entry`): `boolean`

Defined in: orch.ts:70

Dynamically register a new orch entry at runtime.

#### Parameters

##### entry

[`OrchEntry`](../interfaces/OrchEntry.md)

The orch entry to register.

#### Returns

`boolean`

Returns `true` if registration succeeded (or updated existing entry).

***

### switchOrch()

> **switchOrch**(`orchId`): `boolean`

Defined in: orch.ts:64

#### Parameters

##### orchId

`string`

#### Returns

`boolean`

***

### unregisterOrch()

> **unregisterOrch**(`orchId`): `boolean`

Defined in: orch.ts:82

Remove an orch entry from the registry.

#### Parameters

##### orchId

`string`

The ID of the orch to unregister.

#### Returns

`boolean`

Returns `true` if an entry was removed.
