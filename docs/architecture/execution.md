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

## Relations and database access (U5)

Runtime connection creation accepts native Relations v2 definitions over the exact compiled table identities. It rejects mismatched schemas, unsupported protocols and invalid pool sizes before opening a socket, then verifies PostgreSQL 18 before returning a native Drizzle database and its pool. Connections use small bounded pools and explicit cleanup. Idle pool failures publish a payload-free diagnostics-channel event. No migration credential or DDL is used in this path.

Evidence: unit tests first failed on the absent connection export. The PostgreSQL fixture exercises self-relations, distinct author/reviewer references, a many-to-many junction, relation filters, nested projection, ordering and a repeatable-read read-only transaction. Type fixtures retain nullable relations and reject unknown filters. Full check passed (13 tasks, 20 unit tests); 9 PostgreSQL/Node integration tests passed.

At the U3-U5 boundary, ce-simplify-code's three prompt assets were reviewed sequentially per workspace instructions. Reuse: no behavior-equivalent duplication worth extracting (0 applied). Quality: replaced nested boundary-selection expressions with explicit branches (2 applied). Efficiency: replaced repeated relation-target array construction/scans with one Set (1 applied). Per-validation normalized-boundary caching was skipped as low value (1 skipped). Existing validation and safety checks were preserved; full checks above ran after the changes. This is simplification evidence, not the final ce-code-review receipt.

## Configuration and generated contracts (U6, partial)

Implemented strict versioned configuration, bounded defaults, path containment, registered public/internal function definitions, deterministic discovery and content-versioned generated contracts. The CLI currently supports init, generate, schema inspect, schema diff, migrations generate and doctor, with structured/human output and stable usage/project-error exit codes. Initialization preserves existing files and rejects escaping backend symlinks. Executable project errors are not echoed, since arbitrary messages can contain credentials.

Generated public references contain only identity metadata; type-only imports preserve argument/return validator contracts. Internal references and server registry are separate artifacts. Complete generations are staged before an atomic current-link replacement. Stable JS/declaration wrappers and equal-depth generation directories preserve TypeScript 7 and runtime resolution. Build identity includes bundled configuration and source, package manifest and Bun lockfile. Repeated generation verifies existing artifacts before activation.

Evidence: configuration/discovery tests first failed on missing exports. Integration caught and fixed initialization through an escaping symlink, Bun output-directory resolution, and TypeScript's logical symlink-relative imports. Four CLI integration tests pass (33 assertions), including a fresh TypeScript 7 consumer, browser bundling without internal references, source-change invalidation, failed-generation preservation, real CLI success, sanitized errors and usage exit codes. Full workspace check passes (13 tasks, 23 unit tests). Astro build/typecheck initially raced over Vite's dependency cache; the docs typecheck now depends on its build in Turbo.

U6 is not complete: dev, migration application/status and deployment commands depend on U7/U8/U14. Concurrent generation coordination remains part of U8.

## Migration planning (U7, partial)

The adapter owns the pinned Drizzle snapshot/diff entry points; no subprocess or independent SQL diff engine is used. Snapshot identities are structural hashes rather than random Drizzle IDs. The planner accepts an explicit baseline, generates SQL through Drizzle and classifies structural changes conservatively: nullable/defaulted additions can be automatic, while required backfills, constraint validation, type changes, deletions and unsupported changes require review. Concurrent indexes are marked nontransactional. Explicit renames preserve data but still require review.

Evidence: three planner tests failed on missing exports before implementation, then passed (13 assertions). An actual PostgreSQL 18 fixture creates the application namespace, applies an initial baseline, inserts a row, expands the live schema and verifies that planning against the original baseline retains the release addition. Explicit rename preserves the populated row; subsequent planning produces no SQL. A subprocess test verifies that resolver progress does not pollute stdout. The narrow patch now uses Drizzle's existing async context for noninteractive, quiet resolution. A fresh standalone consumer installed the patch, verified ambiguous rejection and explicit rename through both ESM and CommonJS under Node 24, and passed frozen install. Full workspace check passes (13 tasks, 26 unit tests, zero lint warnings).

Artifact persistence now writes complete SQL/plan directories through staging and an atomic rename under an exclusive filesystem generation lock. Reads validate the pinned supported snapshot vocabulary, recompute full artifact and structural hashes, compare the SQL file, and reconstruct one connected history from an empty baseline. Source-control review establishes trust; hashes detect edits, not malicious replacement of both content and hashes. Unsupported snapshot entities fail closed. The CLI accepts explicit rename hints from a project-relative JSON file and labels diff output as committed-baseline planning.

Additional evidence: complex snapshot round-trips cover foreign keys, enums, uniqueness, composite indexes, numeric and JSON fields. Tests reject duplicate baselines, altered SQL and changed snapshots. CLI subprocess tests generate readable release artifacts and subsequently report an empty diff. Four planner tests pass (17 assertions), and four CLI tests pass (41 assertions).

Database bootstrap now uses a dedicated PostgreSQL 18 migration session, bounded lock/statement waits and a transaction-scoped bootstrap lock. Framework metadata version/hash history is separate from application migration history. Bootstrap creates a NOLOGIN runtime role, rejects administrative authority and other role memberships, and denies runtime/public metadata access. Credential provisioning for that role remains provider work; this fixture exercises it with SET ROLE. Per-schema default-privilege revokes cannot override PostgreSQL's global defaults, so concrete function grants are revoked when artifacts are applied rather than relying on that ineffective setting ([PostgreSQL default privileges](https://www.postgresql.org/docs/18/sql-alterdefaultprivileges.html)).

Application migration execution takes a session advisory lock on a dedicated connection, reads and validates artifacts under the lock, checks applied history against both Loom and ORM ledgers, and checks catalog drift. Drizzle's exported programmatic ORM migrator runs within an outer transaction; its nested transaction is a savepoint. SQL, system-field triggers, explicit runtime DML grants and both history entries commit together. Changes requiring review require the exact artifact hash. Nontransactional changes currently fail closed pending their recovery runner. Catalog evidence includes relations, columns, constraints, indexes, triggers, routines, policies, grants, views, sequence definitions and types, excluding row contents and sequence counters.

Evidence: bootstrap tests failed on the missing export before implementation. A follow-up inherited-role test reproduced excessive authority before the guard was fixed. Bootstrap/drift integration tests pass (12 assertions). The runner integration test (written after the first runner implementation) passes 13 assertions: concurrent callers apply once, runtime cannot alter schema or mutate system fields, unreviewed changes stop, a populated required-field failure rolls back both schema and history, backfill/retry succeeds, fresh replay converges on the upgraded catalog, and external DDL stops execution. The workspace check passes with TypeScript 7 and zero lint warnings.

U7 still needs custom/nontransactional SQL handling and CLI application/status integration. U8 must recheck source fingerprints under its development-sync lock. U8-U20 remain unimplemented; no full runtime, development lifecycle, browser interaction, cloud, capacity, or release acceptance is claimed by these checks.
