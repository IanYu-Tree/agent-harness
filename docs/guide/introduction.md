# Introduction

## What is Agent Orch?

Agent Orch is a orch framework for orchestrating AI Agents — unifying LLMs, tools, and collaboration patterns under one control plane. It provides a unified runtime for building, composing, and deploying AI agents that leverage large language models (LLMs) with tool-calling capabilities.

Whether you need a single conversational agent or a complex multi-agent system with planning and reflection, Agent Orch gives you a consistent, streaming-first API to bring it all together.

## Why Agent Orch?

- **Build from Scratch** — Use it to easily implement the agent orchestration layer, enabling lower-cost, higher-quality Agent Orch engineering.
- **Atomic Design** — Packages like LLM, ReAct Agent, and Tool can be used independently. Start simple with a single package, compose the full orch as you grow.
- **Business-Adaptive** — Different businesses need different harnesses. Flexible orchestration nesting lets you build the system that fits your specific use case.

## Design Principles

- **Atomic**: ReAct Agent, each Tool, AppKit — all published as standalone packages. Pick what you need, grow organically.
- **Template-based**: Built-in orchestration templates (SingleAgent, PlannerExecutor, Reflextion) provide battle-tested patterns for reuse.

## Key Principles

### Streaming-First

Every orchestration in Agent Orch is built on `AsyncGenerator`. Events flow from the LLM through the orchestration layer to your application as they are produced — no buffering, no waiting for the full response. This enables real-time UIs, low-latency pipelines, and efficient resource usage.

### Pluggable

The framework is designed around well-defined interfaces. LLM providers, tools, and orchestration patterns are all swappable. Bring your own model provider, register custom tools, or implement an entirely new orchestration strategy — the system adapts to you.

### Composable

Orchestrations can be nested recursively. An agent inside a planner-executor pattern can itself be another orchestration containing multiple sub-agents. This recursive composition lets you model arbitrarily complex workflows without special-casing.

## Core Features

| Feature | Description |
| --- | --- |
| **3 Orchestration Patterns** | `singleAgent` for simple agent loops, `plannerExecutor` for plan-then-act workflows, and `reflexion` for self-evaluating agents that iteratively improve. |
| **Streaming Events** | A rich event protocol (`llm:chunk`, `llm:reasoning`, `tool:start`, `tool:end`, `orch:spawn`, `orch:complete`, etc.) that gives full observability into every step of execution. |
| **Tool System** | Declarative tool definitions with Zod-based parameter schemas, automatic JSON-Schema generation for LLM function calling, and built-in tools for common tasks. |
| **Auto Compression** | Automatic conversation history compression that summarises older messages when the context window approaches its limit, keeping agents running indefinitely without manual intervention. |

## Next Steps

- [Getting Started](./getting-started.md) — install the framework and run your first agent.
- [Project Structure](./project-structure.md) — understand how the monorepo is organized.
- [Configuration](./configuration.md) — learn about all available configuration options.
