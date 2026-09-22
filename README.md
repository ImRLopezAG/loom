# Loom

A schema-first reactive TypeScript backend framework for PostgreSQL and Neon. Implementation is in progress; the current milestone establishes the workspace and dependency compatibility fixtures. The framework CLI and application lifecycle are not implemented yet.

## Development

Use Bun 1.4.2 and Node 24.

```sh
bun install --frozen-lockfile
bun run check
bun run --cwd apps/docs dev
```

`bun run check` runs builds, typechecks, central unit tests, and root Oxlint through Turborepo. Browser and deployed server code are checked separately from Bun tooling. All 15 generic anti-slop rules and the optional Effect rule are enabled.

Database integration requires a disposable PostgreSQL 18 database:

```sh
LOOM_TEST_DATABASE_URL=postgresql://user:password@localhost:5432/loom_test bun run test:integration
```

Tests create and clean up their own schemas. Missing database configuration is reported as skipped. Cloud acceptance requires an explicitly selected disposable Neon target and has not run.

## Workspace

- `apps/loom`: CLI composition root.
- `apps/docs`: Astro with Fumadocs React islands.
- `packages/core`: compiled server, client, React, and Neon exports.
- `packages/tooling`: configuration, migration, and deployment tooling.
- `packages/ts-config`: strict Bun, Node, and browser presets.
- `packages/tests`: unit tests and TypeScript contracts.
- `packages/e2e`: database, browser, and provider tests.
- `packages/examples/tasks` and `packages/examples/jobs-storage`: consumer application workspaces.

See [the framework plan](docs/plans/2026-09-22-1141-feat-loom-full-framework-plan.md), [execution evidence](docs/architecture/execution.md), and [compatibility baseline](docs/architecture/compatibility.md). The [Drizzle patch](patches/README.md) enables explicit programmatic rename hints while refusing unresolved ambiguity. Package names remain private placeholders; no registry publication is enabled.
