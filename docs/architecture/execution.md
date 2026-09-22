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

U2 local compatibility: Standard Schema tests passed for four vendors; Drizzle additive/rename generation and ambiguity rejection passed; PostgreSQL 18 generated migration replay, references, RQB v2, UUIDv7, milliseconds, and populated rename passed. Node 24 imported compiled exports without Bun globals, and a fresh directory installed a packed core artifact and imported server/client/React exports. Astro/Fumadocs build and check passed in a TypeScript 6 probe. The user subsequently required TypeScript 7; all workspace manifests now pin 7.0.2, and docs use Astro sync plus tsc and build, with missing Astro-specific semantic diagnostics recorded in compatibility.md. The user authorized the narrow Drizzle patch after reproduction. See compatibility.md for exact versions and provider acceptance still required.

## Schema compiler (U3)

Implemented immutable field/table declarations and structural metadata, deterministic fingerprints, native Drizzle tables, branded entity IDs, forward/circular references, fixed SQL naming, numeric precision, JSON, enum check constraints, composite indexes and uniqueness. PostgreSQL owns UUIDv7 and bigint millisecond defaults. Migration bootstrap statements install triggers rejecting system-field updates; safe-integer decoding rejects overflowing timestamps.

Evidence: new schema tests first failed on the missing public export, then passed after implementation. Consumer type fixtures reject wrong-entity IDs, missing required fields, invalid enums/defaults and unknown index fields. An actual PostgreSQL migration replay caught parameterized DDL literals, fixed with Drizzle literal encoding. Direct SQL checks verify FK restrictions, enum constraints and system-field immutability. Mutable author inputs are snapshotted. Full workspace check passed (13 tasks, 9 unit tests); PostgreSQL/Node integration passed (8 tests). No casts are needed in consumers.

The compact object grammar cannot detect a JavaScript duplicate key that was already overwritten before the callback returns; TypeScript diagnoses duplicate literal keys. Distinct entity/field names that map to the same SQL identifier are rejected. Enum storage is native text plus a database CHECK constraint, avoiding separately mutable PostgreSQL enum types. Trigger installation is an explicit migration operation; runtime startup does not install it.

## Validation boundaries (U4)

Fields accept Standard Schema v1 validators without vendor introspection. Derived storage, insert, patch, command and public interfaces preserve validator input versus storage output types. Valibot 1.5.0 is the internal storage/wire parser; author validators remain vendor-independent. Normalized field and cross-field outputs are checked again against storage and allowed keys. Server/system writes and unknown keys are rejected. Public masks default empty and can explicitly include system IDs. Patch omission remains unchanged; explicit undefined is rejected; insert-only validator defaults are supported. Bigint and numeric precision use strings on the wire; dates become ISO strings and unsafe wire integers/nonfinite numbers fail.

Evidence: validation exports failed before implementation; strengthened insert-default tests failed before fixing omission handling. Runtime and type fixtures cover four vendors, async issues, transformed output rejection, all masks, opt-in system projection, cross-field checks and attempted mask widening. Full check passed (13 tasks, 18 unit tests); database/Node integration remained green (8 tests). Structural fingerprints intentionally omit validator implementation; build/content identity must account for validation-code changes in U6.

U5-U20 remain unimplemented; no full runtime, migration lifecycle, browser, cloud, capacity, or release acceptance is claimed by these checks.
