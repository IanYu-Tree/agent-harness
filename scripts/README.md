# Publish Scripts

Publish scripts for Agent Orch packages, supporting all packages under `packages/` and `apps/cli`.

## Features

- ✅ Publish single or all packages (`-p` / `--package`)
- ✅ Version bump support (`--bump patch|minor|major`)
- ✅ Support beta releases (`-b` / `--beta`)
- ✅ Support custom npm tags (`-t` / `--tag`)
- ✅ Auto-replace workspace dependencies with actual versions
- ✅ Auto-skip already published versions (no error)
- ✅ Dry run mode (`--dry-run`)
- ✅ Publish in dependency order (core → tool/llm → orch → appkit → cli/react-agent)

## Usage

### Publish Single Package

```bash
node scripts/publish.mjs -p core
```

### Version Bump

```bash
# Bump patch version (0.0.1 -> 0.0.2)
node scripts/publish.mjs -p core --bump patch

# Bump minor version (0.0.1 -> 0.1.0)
node scripts/publish.mjs -p core --bump minor

# Bump major version (0.0.1 -> 1.0.0)
node scripts/publish.mjs -p core --bump major
```

### Publish Beta Version

```bash
# Automatically appends -beta.0 suffix
node scripts/publish.mjs -p llm -b

# If current version is 0.0.1, publishes as 0.0.1-beta.0
# Subsequent releases increment to 0.0.1-beta.1, etc.
```

### Publish All Packages

```bash
# Publish all packages in dependency order
node scripts/publish.mjs -p all

# Publish all as beta
node scripts/publish.mjs -p all -b
```

### Custom Tag

```bash
# Publish to 'next' tag
node scripts/publish.mjs -p cli -t next

# Publish to 'alpha' tag
node scripts/publish.mjs -p core -t alpha
```

### Dry Run

```bash
# Preview what would happen without actually publishing
node scripts/publish.mjs -p llm --dry-run
node scripts/publish.mjs -p all -b --dry-run
```

## Supported Packages

| Package | Path | Description |
|---------|------|-------------|
| `core` | `packages/core` | Core types and interfaces |
| `llm` | `packages/llm` | LLM provider implementations |
| `appkit` | `packages/appkit` | Application development kit |
| `orch` | `packages/orch` | Orchestration patterns |
| `tool` | `packages/tool` | Built-in tools |
| `react-agent` | `packages/react-agent` | React Agent components |
| `cli` | `apps/cli` | CLI application |
| `all` | - | Publish all packages |

## Publish Order

When using `-p all`, packages are published in this order to ensure correct dependency resolution:

```
core → tool → llm → orch → appkit → react-agent → cli
```

## Requirements

- Node.js >= 20
- pnpm >= 9
- npm login (required for publishing to npm)

## Notes

1. **Workspace Dependency Replacement**: The script automatically replaces `workspace:*` dependencies with actual versions (e.g., `^0.0.1`)
2. **Version Restoration**: After publishing (beta or bump), the package.json version is restored to the original version
3. **Auto Skip**: If a version is already published to npm, the script automatically skips without error
4. **Auto Build**: Automatically runs `pnpm build` before publishing

## Example Workflows

### Version Bump and Release

```bash
# Bump patch version and publish
node scripts/publish.mjs -p core --bump patch

# Bump minor version and publish all packages
node scripts/publish.mjs -p all --bump minor
```

### Release Production Version

```bash
# Build all packages
pnpm build

# Publish individual packages
node scripts/publish.mjs -p core
node scripts/publish.mjs -p llm

# Or publish all at once
node scripts/publish.mjs -p all
```

### Release Beta Version

```bash
# Publish beta version of llm package
node scripts/publish.mjs -p llm -b

# Users can install with
pnpm add @agent-orch/llm@beta
```

### Preview Release

```bash
# Dry run to see what would happen
node scripts/publish.mjs -p all -b --dry-run
```
