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

Tests create and clean up their own schemas, databases and roles. Missing database configuration is reported as skipped. Run browser checks with the same connection and `bun run test:browser` after installing Chromium with `bunx --no-install playwright install chromium` from `packages/e2e`.

## CI and release gates

The CI workflow runs a frozen Bun install, builds, TypeScript 7, unit tests, formatting/Oxlint, PostgreSQL 18 integration tests, packed Bun/Node 24 consumers and browser tests. It moves generated build outputs aside and restores them through Turbo before consumer tests. Pull requests receive no provider or publication credentials; checkout credentials are not persisted.

The manual **Neon backend acceptance** workflow runs only from the default branch and uses the `neon-acceptance` environment. Configure its `LOOM_CLOUD_PROJECT_ID` variable and `NEON_API_KEY` secret, and restrict environment deployment to the default branch with maintainer approval. With either value absent, it reports cloud acceptance as skipped. With both present, it creates an expiring schema-only branch, verifies database permissions and a real Functions release, and deletes and checks the absence of its branch even after test failure. Expiration bounds resource lifetime if the runner is lost.

Database acceptance, SDK target discovery and a service/worker Functions release have passed locally against a disposable Neon branch using a temporary project-scoped API key. The copied tasks example also passed authenticated operations, mutation replay, ownership isolation, invalid-token rejection and two-browser subscriptions with reconnect and account switching. The branch and key were removed and their absence verified afterward. Intermittent deployment health failures remain under investigation; storage events and GitHub-hosted workflow execution remain unverified. Local Functions testing requires `LOOM_CLOUD_FUNCTIONS=1` in addition to the project, disposable branch and API key variables, plus installed Playwright Chromium. Hosted execution requires a remote repository and configured environment.

The manual release workflow deliberately fails with an explicit publication-disabled message. It has no checkout, registry credentials or write permissions. Namespace, owner, license review and publishing credentials must be settled before a reviewed CI publication workflow replaces that gate. No local publication is part of development verification.

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
