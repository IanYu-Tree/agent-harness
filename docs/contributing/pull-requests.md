# Pull Requests

This guide describes the pull request workflow for contributing to Agent Orch.

## Branch Naming

Always branch from `main`. Use the following naming conventions:

| Prefix      | Purpose                          | Example                      |
| ----------- | -------------------------------- | ---------------------------- |
| `feature/*` | New functionality                | `feature/streaming-events`   |
| `fix/*`     | Bug fixes                        | `fix/compression-retry-loop` |
| `docs/*`    | Documentation changes            | `docs/tool-confirmation`     |

```bash
git checkout main
git pull origin main
git checkout -b feature/my-feature
```

## Before Submitting

Ensure all checks pass locally before opening a pull request:

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm lint
```

All four commands must exit with zero errors. CI will run the same checks automatically, but catching issues locally saves review cycles.

## Changesets

Agent Orch uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog generation. Every pull request that affects published packages must include a changeset.

Generate a changeset:

```bash
pnpm changeset
```

You will be prompted to:

1. Select the packages affected by your change.
2. Choose the semver bump type (`patch`, `minor`, `major`).
3. Write a short summary of the change.

This creates a markdown file in the `.changeset/` directory. Commit it alongside your code changes.

## Commit Messages

Write clear, concise commit messages:

- Use the imperative mood: "Add streaming support" not "Added streaming support."
- Keep the subject line under 72 characters.
- Reference related issues when applicable: "Fix retry logic (#42)."

## Opening the Pull Request

1. Push your branch to the remote.
2. Open a pull request against `main`.
3. Fill in the PR template with a description of the change, motivation, and testing steps.
4. Request a review from at least one maintainer.

## CI Pipeline

The following checks run automatically on every pull request:

| Check       | Command          | Description                     |
| ----------- | ---------------- | ------------------------------- |
| Build       | `pnpm build`     | Compiles all packages           |
| Tests       | `pnpm test`      | Runs the full test suite        |
| Types       | `pnpm typecheck` | Validates TypeScript types      |
| Lint        | `pnpm lint`      | Enforces code quality rules     |

All checks must pass before a pull request can be merged.

## Review Process

- Address all reviewer comments before requesting re-review.
- Use fixup commits during review; they will be squashed on merge.
- Keep pull requests focused — one feature or fix per PR.

## Merging

Maintainers merge approved pull requests using squash-and-merge. The changeset bot will handle version bumps and changelog updates on the next release cycle.
