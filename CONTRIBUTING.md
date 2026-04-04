# Contributing to Agent Orch

Thank you for your interest in contributing to Agent Orch! This guide will help you get started.

## Prerequisites

- **Node.js** >= 20
- **pnpm** 9.15.0

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/IanYu-Tree/agent-orch.git
   cd agent-orch
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the project:

   ```bash
   pnpm build
   ```

## Project Structure

This project is organized as a monorepo with the following layout:

- **`packages/`** — Shared libraries
  - `core` — Core utilities and shared types
  - `llm` — LLM provider integrations
  - `react-agent` — ReAct agent implementation
  - `orch` — Orchestration layer
  - `tool` — Tool definitions and registry
  - `appkit` — Application toolkit and helpers
- **`apps/`** — Applications
  - `cli` — Command-line interface

## Development Workflow

1. Create a new branch from `main`:

   ```bash
   git checkout -b feat/your-feature
   ```

2. Make your changes.

3. Build:

   ```bash
   pnpm build
   ```

4. Run tests:

   ```bash
   pnpm test
   ```

5. Run type checking:

   ```bash
   pnpm typecheck
   ```

6. Run linting:

   ```bash
   pnpm lint
   ```

## Build System

- **Turborepo** — Task orchestration across the monorepo
- **Rslib** — Library bundling with ESM + CJS dual output
- **Vitest** — Unit and integration testing

## Code Style

- TypeScript strict mode is enabled across all packages.
- **ESLint 9** and **Prettier 3** are used for linting and formatting.
- Follow existing patterns and conventions found in the codebase.

## Pull Request Process

1. Create a feature branch from `main`.
2. Write clear, descriptive commit messages.
3. Ensure all CI checks pass (`build`, `test`, `typecheck`, `lint`).
4. Open a pull request and request a review from a maintainer.

## Adding a New Package

1. Follow the structure of an existing package under `packages/`.
2. Add an `rslib.config.ts` for build configuration.
3. Register the package in `pnpm-workspace.yaml`.
