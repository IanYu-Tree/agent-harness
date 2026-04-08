[**Agent Orch API Reference**](../../../index.md)

***

[Agent Orch API Reference](../../../index.md) / [@agent-orch/orch](../index.md) / TaskGraph

# Class: TaskGraph

Defined in: patterns/planner-executor/task-graph.ts:23

## Constructors

### Constructor

> **new TaskGraph**(): `TaskGraph`

#### Returns

`TaskGraph`

## Methods

### addTasks()

> **addTasks**(`tasks`): `void`

Defined in: patterns/planner-executor/task-graph.ts:26

#### Parameters

##### tasks

[`TaskInput`](../type-aliases/TaskInput.md)[]

#### Returns

`void`

***

### getAllTasks()

> **getAllTasks**(): [`TaskNode`](../interfaces/TaskNode.md)[]

Defined in: patterns/planner-executor/task-graph.ts:133

#### Returns

[`TaskNode`](../interfaces/TaskNode.md)[]

***

### getDependencyResults()

> **getDependencyResults**(`taskId`): `object`[]

Defined in: patterns/planner-executor/task-graph.ts:120

#### Parameters

##### taskId

`string`

#### Returns

`object`[]

***

### getReadyTasks()

> **getReadyTasks**(): [`TaskNode`](../interfaces/TaskNode.md)[]

Defined in: patterns/planner-executor/task-graph.ts:86

#### Returns

[`TaskNode`](../interfaces/TaskNode.md)[]

***

### getSummary()

> **getSummary**(): [`TaskSummary`](../interfaces/TaskSummary.md)

Defined in: patterns/planner-executor/task-graph.ts:151

#### Returns

[`TaskSummary`](../interfaces/TaskSummary.md)

***

### getTask()

> **getTask**(`taskId`): [`TaskNode`](../interfaces/TaskNode.md) \| `undefined`

Defined in: patterns/planner-executor/task-graph.ts:129

#### Parameters

##### taskId

`string`

#### Returns

[`TaskNode`](../interfaces/TaskNode.md) \| `undefined`

***

### hasFailures()

> **hasFailures**(): `boolean`

Defined in: patterns/planner-executor/task-graph.ts:144

#### Returns

`boolean`

***

### isAllDone()

> **isAllDone**(): `boolean`

Defined in: patterns/planner-executor/task-graph.ts:137

#### Returns

`boolean`

***

### markCompleted()

> **markCompleted**(`taskId`, `result`): `void`

Defined in: patterns/planner-executor/task-graph.ts:104

#### Parameters

##### taskId

`string`

##### result

`string`

#### Returns

`void`

***

### markFailed()

> **markFailed**(`taskId`, `error`): `void`

Defined in: patterns/planner-executor/task-graph.ts:112

#### Parameters

##### taskId

`string`

##### error

`string`

#### Returns

`void`

***

### markRunning()

> **markRunning**(`taskId`): `void`

Defined in: patterns/planner-executor/task-graph.ts:99

#### Parameters

##### taskId

`string`

#### Returns

`void`

***

### validate()

> **validate**(): `object`

Defined in: patterns/planner-executor/task-graph.ts:35

#### Returns

`object`

##### errors

> **errors**: `string`[]

##### valid

> **valid**: `boolean`
