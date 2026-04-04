# Architecture

## Overview

Agent Orch is a TypeScript monorepo framework for AI agent orchestration. It provides a layered, composable architecture that enables building sophisticated agent workflows while maintaining a clean separation of concerns.

## Data Flow

The primary data flow follows a streaming pipeline:

```
User Input
  → AgentOrch.chatStream()
    → PatternRunner
      → Agent.runStream()
        → LLM.runStream()
          → StreamEvents
```

Every layer in this pipeline produces and forwards `StreamEvent` objects via `AsyncGenerator`. The caller receives a unified event stream regardless of how many agents, tools, or nested patterns are involved beneath the surface.

## Layer Diagram

The framework is organized into five layers, each building on the one below:

```
┌─────────────────────────────────────┐
│              cli                    │  CLI entry point & commands
├─────────────────────────────────────┤
│            appkit                   │  High-level AgentOrch API
├─────────────────────────────────────┤
│             orch                    │  Orchestration patterns
│  (SingleAgent / PlannerExecutor /   │  (PatternRunner, PatternFactory,
│         Reflextion)                 │   TaskGraph)
├─────────────────────────────────────┤
│       react-agent / llm            │  Agent ReAct loop & LLM providers
├─────────────────────────────────────┤
│             core                    │  Shared types, events, tools,
│                                     │  utilities
└─────────────────────────────────────┘
```

### Core

The foundation layer. Defines shared interfaces (`StreamEvent`, `Tool`, `ToolResult`, `Message`), the event type system, and common utilities. All other packages depend on `core`.

### LLM / React-Agent

The `llm` package provides the provider-agnostic `LLM` interface and concrete implementations (e.g., `OpenAILLM`). The `react-agent` package implements the `Agent` class — the ReAct (Reason + Act) loop that drives tool-calling agents.

### Orch

The orchestration layer. Contains three patterns — `SingleAgent`, `PlannerExecutor`, and `Reflextion` — that compose one or more agents into higher-level workflows. `PatternFactory` selects the appropriate runner based on configuration.

### Appkit

The application-level API. `AgentOrch` is the primary entry point, wiring together configuration, LLM providers, tools, and orchestration patterns into a single `chatStream()` method.

### CLI

The command-line interface. Parses arguments, loads configuration, and invokes `AgentOrch` to run interactive or scripted agent sessions.

## Design Principles

### Streaming-First

`AsyncGenerator` is the universal transport across the entire framework. Every component — from `LLM.runStream()` to `PatternRunner.run()` to `AgentOrch.chatStream()` — yields events incrementally. This ensures low time-to-first-token and enables real-time UIs without buffering.

### Event-Driven

The system defines 15 distinct event types spanning agent lifecycle, LLM streaming, tool execution, and orchestration coordination. Consumers can subscribe to specific event types or process the full stream. `StreamEventCollector` provides pub/sub capabilities for decoupled event handling.

### Provider-Agnostic

The `LLM` interface abstracts away provider differences. Switching from one model provider to another requires only a configuration change — no code modifications. The `createLLM()` factory parses a `"provider/model"` string and returns the appropriate implementation.

### Composable Patterns

Orchestration patterns are composable building blocks. A `PlannerExecutor` can spawn tasks that themselves use `Reflextion` or nested `PlannerExecutor` patterns. This recursive composition enables arbitrarily complex agent workflows from simple, well-tested primitives.
