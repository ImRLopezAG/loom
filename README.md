# Loom

A schema-first reactive TypeScript backend framework for PostgreSQL and Neon. Implementation is in progress. Schema compilation, validation, native database access, generated contracts, and migration CLI operations have local verification. Development lifecycle, deployed runtime, and provider acceptance remain in progress.

## Development

Use Bun 1.4.2 and Node 24.

```sh
bun install --frozen-lockfile
bun run check
bun run --cwd apps/docs dev
```

`bun run check` runs library builds, typechecks, unit tests, and Vite+ static checks through Turborepo. Vite+ 1.0.0-rc.0 provides Oxlint, Oxfmt, Vitest, and the library packager; TypeScript is pinned to 7.0.2. Browser and deployed server code are checked separately from Bun tooling. All 15 generic anti-slop rules and the optional Effect rule are enabled.

Source imports are extensionless (`from "./module"`) with TypeScript bundler resolution. `vp pack` produces Node-compatible ESM and declarations. Use `bun run format` to format owned files; historical plans and vendored assets are excluded. Astro retains its framework build command, and integration tests run under Bun for the CLI bundling APIs.

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
