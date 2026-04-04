# Coding Standards

This document outlines the coding conventions enforced across the Agent Orch monorepo.

## TypeScript Configuration

- **Strict mode** is enabled in all packages (`"strict": true`).
- **Target**: ES2022.
- **Module system**: ESM (`"type": "module"` in every `package.json`).

All code must pass `pnpm typecheck` with zero errors.

## Linting and Formatting

| Tool       | Version | Configuration          |
| ---------- | ------- | ---------------------- |
| ESLint     | 9       | Flat config (`eslint.config.js`) |
| Prettier   | 3       | Shared config at repo root       |

Run both before committing:

```bash
pnpm lint
pnpm format
```

ESLint and Prettier are configured to work together without conflicts. Formatting rules are handled exclusively by Prettier; ESLint focuses on code quality and correctness.

## Naming Conventions

| Construct           | Convention   | Example                  |
| ------------------- | ------------ | ------------------------ |
| Classes             | PascalCase   | `PatternRunner`          |
| Types / Interfaces  | PascalCase   | `AgentConfig`            |
| Functions            | camelCase    | `createAgent`            |
| Variables            | camelCase    | `maxRetries`             |
| Constants            | camelCase    | `defaultTimeout`         |
| File names           | kebab-case   | `pattern-runner.ts`      |
| Directory names      | kebab-case   | `custom-tools/`          |

## Exports

Every package exposes its public API through barrel files (`index.ts`). Internal modules should not be imported directly by consumers.

```typescript
// packages/core/src/index.ts
export { Agent } from "./agent.js";
export { PatternFactory } from "./pattern-factory.js";
export type { AgentConfig, OrchConfig } from "./types.js";
```

Use explicit named exports. Avoid default exports.

## Runtime Validation

Use Zod for all runtime validation, including tool parameter schemas, configuration parsing, and external data ingestion. Do not use hand-written type guards where Zod schemas can be applied.

```typescript
import { z } from "zod";

const AgentConfigSchema = z.object({
  model: z.string(),
  systemPrompt: z.string(),
  tools: z.array(ToolSchema).optional(),
});
```

## Code Comments

Do not add comments unless they explain complex or non-obvious logic. Self-documenting code through clear naming and small functions is preferred over inline commentary.

## Error Handling

- Throw typed errors extending a base `HarnessError` class.
- Never swallow errors silently.
- Use `Result`-style returns for expected failure paths in tool execution.

## Dependencies

- Minimize external dependencies.
- Vet all new dependencies for maintenance status and bundle size.
- Pin exact versions in `package.json` to avoid unexpected upgrades.
