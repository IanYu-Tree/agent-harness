# agent-harness
这是一个 Agent 的"线束/驾驭框架"——把 LLM、工具、协作模式等复杂组件统一编排和控制。

## 框架设计理念分析


| 维度 | 设计特点 |
|------|----------|
| **抽象层（Core）** | 定义了 Agent、Tool、LLM Client、Event、Message、Session 等核心抽象，是协议无关的纯接口层 |
| **Pattern 系统** | 提供了多种 Agent 协作模式：Single、MainSub、PlannerExecutor、Reflexion、Workflow、Team、A2A、ADKServer |
| **流式协议** | 支持多种流式协议（AI SDK、AG-UI、ADK），统一内部事件模型 |
| **双语言** | TypeScript + Python 1:1 映射，同一套抽象 |
| **可组合** | Pattern 可以嵌套组合（子 Pattern），像积木一样搭建复杂 Agent 系统 |
| **生命周期** | 完整的 Agent 生命周期管理（init → run → interrupt → resume → destroy → reset） |
| **可观测** | 内置 OpenTelemetry 可观测性支持 |

**核心比喻：这是一个 Agent 的"线束/驾驭框架"——把 LLM、工具、协作模式等复杂组件统一编排和控制。**
