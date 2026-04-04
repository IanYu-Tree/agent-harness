---
layout: home

hero:
  name: Agent Orch
  text: AI Agent Orchestration Framework
  tagline: A orch framework for orchestrating AI Agents — unifying LLMs, tools, and collaboration patterns under one control plane
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/IanYu-Tree/agent-orch

features:
  - title: Multiple Orchestration Patterns
    details: Choose from SingleAgent, PlannerExecutor (DAG-based task planning), or Reflextion (self-critique loop) patterns — or nest them recursively.
  - title: Streaming Events
    details: Full streaming event system with 16 event types via AsyncGenerator. Real-time updates for LLM chunks, tool execution, orchestration state, and llm:reasoning for real-time thinking/reasoning display.
  - title: Pluggable Tool System
    details: Define tools with Zod schema validation. Built-in tool confirmation mechanism for human-in-the-loop workflows.
  - title: LLM Provider Abstraction
    details: Unified LLM interface with provider-specific implementations. Currently supports OpenAI with streaming via the Responses API.
  - title: Automatic Context Compression
    details: Two-level automatic compression when context limits are reached — microcompact (trim old tool results) and compact (LLM-generated summaries).
  - title: Session Persistence
    details: File-based session storage with full conversation history. Switch between orchestration modes at runtime.
  - title: Runtime Orch Loading
    details: Load custom orchestration configurations from JS/TS files at runtime via CLI. Iterate on patterns without restarting.
  - title: Rich Message Abstraction
    details: Provider-agnostic Message abstract class with MessageFactory for clean dependency inversion. Switch LLM providers without touching agent or orchestration code.
---
