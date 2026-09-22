# Framework implementation evidence

Canonical plan: `docs/plans/2026-09-22-1141-feat-loom-full-framework-plan.md`.
Execution uses the current Codex session with an active goal, sequentially per project instructions. No external model or worker route is selected.

## Starting state

The supplied folder was a Bun starter without Git. Git initialization was authorized, and the supplied starter and conversation/plan were preserved in commit `fa443b7` on `feat/loom-framework`. No remote is configured. Package namespace and publication remain undecided.

## Workspace foundation (U1)

Nine workspaces are declared, including two independent example packages. Core and tooling export compiled ESM and declarations; Node, browser, and Bun TypeScript presets separate ambient APIs. Astro receives its supported preset when its integration is installed.

Oxlint and @oxlint/plugins are both pinned at 1.85.0. All 15 generic anti-slop rules are errors. The plugin is vendored in `tools/oxlint/anti-slop`; agent assets and vendored code are excluded. Lint is a Turbo root task per the official Oxc guide. Effect rules will be enabled when the validator compatibility fixture adds Effect as a direct dependency.

Configuration-only work uses install/build/typecheck/lint and task-graph smoke verification instead of synthetic unit tests. The central test command intentionally fails until real tests exist. Empty module entry points reserve package boundaries; they do not claim implemented framework APIs.

Observed: frozen install, library builds, seven package typechecks and root lint passed. Turbo discovered all nine workspaces. After removing two generated JS artifacts, a second build restored both from cache (2/2 hits). Browser-only typechecking passed without Node or Bun ambient types. Root Turbo lint reported zero warnings and errors.

## Remaining units

U2 local compatibility: Standard Schema tests passed for four vendors; Drizzle additive/rename generation and ambiguity rejection passed; PostgreSQL 18 generated migration replay, references, RQB v2, UUIDv7, milliseconds, and populated rename passed. Node 24 imported compiled exports without Bun globals, and a fresh directory installed a packed core artifact and imported server/client/React exports. Astro/Fumadocs build and check passed after pinning TypeScript 6.0.3. The user authorized the narrow Drizzle patch after reproduction. See compatibility.md for exact versions and provider acceptance still required.

U3-U20 remain unimplemented; no runtime, migration, browser, cloud, capacity, or release acceptance is claimed by workspace smoke checks.
