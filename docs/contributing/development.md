# Development Setup

This guide covers everything you need to get the Agent Orch monorepo running locally.

## Prerequisites

| Requirement | Version    |
| ----------- | ---------- |
| Node.js     | >= 20      |
| pnpm        | 9.15.0     |

Install pnpm at the required version if you don't already have it:

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

## Getting Started

Clone the repository and install dependencies:

```bash
git clone https://github.com/IanYu-Tree/agent-orch.git
cd agent-orch
pnpm install
```

Build all packages:

```bash
pnpm build
```

## Development Commands

| Command          | Description                                   |
| ---------------- | --------------------------------------------- |
| `pnpm build`     | Build all packages in dependency order         |
| `pnpm dev`       | Start all packages in watch mode               |
| `pnpm test`      | Run the full test suite                        |
| `pnpm typecheck` | Run TypeScript type checking across all packages |
| `pnpm lint`      | Run ESLint across all packages                 |

## Dev Mode

For active development, use watch mode to automatically rebuild on changes:

```bash
pnpm dev
```

This starts the TypeScript compiler in watch mode for every package, rebuilding incrementally as you edit source files.

## Turborepo

The project uses Turborepo for task orchestration. Turborepo manages the dependency graph between packages and runs tasks in the correct order with full build caching.

Key benefits:

- **Parallel execution** — Independent packages build simultaneously.
- **Build caching** — Unchanged packages are not rebuilt, significantly speeding up repeated builds.
- **Dependency awareness** — Tasks run only after their upstream dependencies have completed.

The Turborepo pipeline is configured in `turbo.json` at the repository root.

## Project Structure

```
agent-orch/
├── packages/
│   ├── core/          # Core framework: agents, patterns, tools
│   ├── providers/     # LLM provider integrations
│   └── cli/           # Command-line interface
├── apps/
│   └── playground/    # Development playground and examples
├── turbo.json         # Turborepo configuration
├── pnpm-workspace.yaml
└── package.json
```

## Troubleshooting

If you encounter stale build artifacts, clean and rebuild:

```bash
pnpm clean
pnpm install
pnpm build
```

If type errors appear after pulling new changes, ensure all packages are rebuilt before running `pnpm typecheck`.
