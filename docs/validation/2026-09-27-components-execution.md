# Components execution evidence

Plan: [Components, Internal Calls, and SDK Services](../plans/2026-09-27-0947-feat-components-internals-sdk-services-plan.md).

Started on `feat/orpc-effect-core` at `a433504`. Existing README edits and untracked earlier plans/explainers are excluded. Existing unpushed commits are not authority to publish. U1–U4 implementation and review ran sequentially under the initial AGENTS instructions. The user subsequently authorized multiple agents; independent reviews and parallel implementation are identified per unit below.

The goal tool refused a new objective because the previous package/auth goal remains paused. No goal was falsely marked complete to replace it. This record tracks the new implementation separately.

## U1 — definitions and mount graph

Added explicit `defineComponent` / `app.use`, typed Standard Schema options, opaque mount references, distinct named instances, and graph sealing. Compilation evaluates neither environment validators nor SDK factories. Nested mounts expand by instance path; duplicate/reserved names, cycles, forged definitions/references, and dependencies outside the owning scope fail closed. Existing application RPC behavior remains unchanged.

Evidence strategy: wrote five graph tests before implementation; observed all five fail because `defineComponent` was absent. Positive and negative compilation fixtures exercise required, defaulted, and invalid options through compiled `loom` exports. Existing application-definition tests cover the no-component path.

Simplification: applied ce-simplify-code reuse, quality, and efficiency lenses inline. Removed the duplicated registration field declaration by sharing it with graph nodes. Retained provenance checks and the separate definition/reference registries; they enforce different boundaries.

Code/security review: ce-code-review lenses for correctness, standards, testing, maintainability, API contracts, security, and adversarial composition ran inline. Checked mount identity, cross-application references, sibling-only dependency resolution, graph atomicity, prototype-sensitive keys, no factory execution, and unchanged app context. Strengthened coverage for failed compilation leaving declarations writable and copied-definition rejection. No remaining actionable U1 finding. This is a unit review, not acceptance of later runtime/codegen units. Runtime option validation belongs to U2; scope capabilities belong to U3–U9.

Verification: workspace build (7 tasks), workspace typecheck (16 tasks), all 235 unit tests (60 files), and root Oxlint passed. Re-ran the 7 focused tests after final review edits; all passed. Scoped formatting and diff checks passed. The pre-existing README trailing blank line remains untouched. Inline review receipt: `/tmp/loom-components-u1-review/review.json`.

U1 commit: `ad072f0`.

## U2 — typed environment bindings

`app.env` and component definition `env` now contain opaque typed configuration references; validator declarations remain separately available as `environmentSchema`. Runtime initialization seals the graph, validates the application and each mounted instance, awaits Standard Schema validators, and validates options/defaults. Explicit bindings use the immediate parent's validated output and are revalidated by the child. Runtime scope access rejects other definitions and access outside initialization/invocation scopes. The Neon release path continues reading schema declarations rather than symbolic references.

Evidence strategy: four new tests failed before implementation (missing readers, ignored bindings and missing validation); expanded to six covering nested bindings, foreign/forged references, cross-scope access, missing instance paths, invalid JS options, defaults, asynchronous validation, isolation, and redaction. Type fixtures reject incompatible transformed output bindings and treating symbolic references as strings.

Simplification and code/security review ran inline using the same ce-simplify-code and ce-code-review lenses as U1. Checked source-property ownership, reference provenance, parent scope ownership, async context isolation, child revalidation, and secret-free errors. No independent-review claim. Root anti-slop initially rejected untyped dictionaries; replaced them with Standard Schema-derived environment outputs. No remaining actionable U2 finding. Generated facade emission and complete component deployment discovery remain U3 obligations; no claim of deployed component support yet.

Verification: workspace build (7 tasks), workspace typecheck (16 tasks), all 241 unit tests (61 files), and root lint passed. Final scoped format/type checks follow the final annotation-only lint fix.

U2 commit: `028c627`.

## U3 — local scope discovery and generation

Explicit mounts now resolve local setup modules into distinct source scopes. SDK-only components need no schema/contracts, while RPC components receive generated setup, contract, schema, server, and RPC facades with explicit registration types. Two different component schemas compile in the same consumer program without ambient registration merging. Runtime environment getters resolve the active scope; generation does not initialize services or read secrets. Neon release discovery includes unbound mounted declarations, preserves parent bindings, and validates every declaration sharing an environment source.

Verification includes fresh generation, repeated mounts, ignored unmounted definitions, deterministic regeneration, stale facade removal, preservation after invalid source, mixed Valibot input/Zod output, and positive/negative consumer compilation. Native schema libraries compose their own object fields; Standard Schema interoperation occurs at the oRPC boundary. Existing application declarations retain deferred ambient type resolution after a declaration-emission regression was caught and fixed.

Simplification ran inline with reuse/quality/efficiency lenses: shared source traversal replaces duplicate scanning, generic contract factories support both scopes, and owned facade directory replacement removes bespoke stale-file pruning. Security/correctness/API/testing/standards review checked symlinks, ownership markers, private client import rejection, environment aliasing, prototype-safe graph validation, and non-execution of SDK factories. Reviews are sequential main-thread reviews, not independent corroboration. One security finding rejected a symlinked components directory before scanning. Compiled external artifacts remain U10; runtime callers and instance database namespaces remain U4–U9. This phase does not claim those capabilities are operational.

Checks: workspace build (7 tasks), workspace typecheck (16 tasks), all 241 unit tests (61 files), application/component generation integration tests, environment deployment tests, and root anti-slop lint. Final focused checks are rerun after the directory safety fix. Component facades are replaced as complete owned directories with rollback on rename failure; abrupt process termination between filesystem renames is not claimed to be atomic across the entire workspace.

U3 commit: `68f0126`.

## U4 — native scoped callers and explicit visibility

Runtime graphs now bind private and exported component routers separately, inject request-bound native oRPC callers, and retain private procedures outside public HTTP/WebSocket/OpenAPI router projections. `context.internal` is typed from private contracts. Generated `context.components.<name>.rpc` types include child mounts and explicitly bound siblings, including mount-specific dependency unions. Application `app.use(component, { public: "namespace" })` explicitly projects exported RPCs; backend-only mounts and private contracts remain absent from public client types. Native TanStack query options retain their upstream types. Generated runtime entries carry scope identity; component-private procedures do not accidentally enter the application job registry.

Five focused unit tests cover native input/output validation, declared errors, exact context, inactive/cross-request callers, Promise/Effect parity, cancellation, invalid graphs and immutable visibility snapshots. The assembled graph test exercises parent -> exported child -> private child, with private and exported dispatch separated from explicit public projections. Consumer compilation tests cover mounted callers, sibling capabilities, unavailable tables/private APIs, explicit native browser options, and conflicting public prefixes. PostgreSQL regression checks exercised the existing runtime, transaction and explicit live-query paths: 4 tests, 139 assertions passed. This does not yet prove cross-component transactions or live dependency unions; those remain U5/U9.

Simplification: consolidated child/sibling dependency resolution into one helper used by declaration and runtime emission. Code/security/API/testing/standards/maintainability review ran sequentially inline. Fixed a vacuous proxy-enumeration test by checking inaccessible properties directly; added runtime and generator checks for public-prefix conflicts and invalid projections. Fixed artifact compatibility by advancing the generator version. The interrupted broad check left empty generation locks; verified no generator was running before removing only those abandoned empty directories. No unrelated source changes were included.

Verification: workspace typecheck (16 tasks), all 246 unit tests (62 files), root Oxlint anti-slop, consumer generation/compilation, and assembled graph tests passed. Final focused checks follow the prefix-validation addition. Service lifecycle, cross-scope database adapters, durable scope identities, namespace migration, external packages, and Neon component acceptance remain subsequent units. Reviews here are main-thread reviews, not independent agent corroboration.

U4 commit: `dbd88ba`.

## U5 — shared transactions and execution authority

Scoped relation adapters now use the owning PostgreSQL client and transaction, with the same invocation guard and connection lifetime. Native internal calls register pending work before oRPC's first asynchronous validation step. The outer owner drains descendants before committing; caught or unawaited child failures abort the transaction. The first database failure is retained so later public error redaction cannot erase its retryable SQLSTATE.

Evidence: the initial cross-relation test failed on the old relation-identity restriction. PostgreSQL tests now demonstrate identical transaction IDs, child RQB access, joint commit/rollback, caught child and input-validation failure rollback, awaited/unawaited work, read-only escalation rejection, cancellation rollback, retained child query/prepared-query rejection, and pool reuse. An independently identified assembled-runtime retry regression failed with INTERNAL_SERVER_ERROR before first-cause retention; it now retries twice as one unit for both awaited/unawaited calls and commits only the successful attempt. Automatic handlers execute once under an injected serialization conflict. Service acquisition guards remain U7, where services are introduced.

The user authorized multiple agents for continued execution. Independent correctness and security agents reviewed U5. The correctness finding above was fixed and re-reviewed; security reported no concrete finding and suggested the additional lifetime/authority tests. ce-simplify-code reuse, quality, and efficiency lenses ran through agents (remaining lenses reused reviewer threads after the harness refused additional threads). Removed an unused relation assertion and combined relation/factory metadata into one WeakMap; rejected a typeof simplification because it violates repository anti-slop rules. No safety checks were removed. Two quality changes applied, zero reuse/efficiency changes.

Verification: workspace typecheck/build dependencies (16 tasks), all 246 unit tests (62 files), five focused runtime/PostgreSQL integration tests (82 assertions), e2e typecheck, and root Oxlint. Final lint and scoped diff checks run immediately before commit. No Neon component acceptance is claimed here.

Storage research follow-up for U9/U12: Neon GA uses native top-level buckets (preview.buckets deprecated). Existing Loom provisions private buckets through the API and consumes injected AWS credentials. Preserve one declaration source. Test inherited finalized-file reads after branching: current branch-prefixed paths/intent filters may reject inherited objects. This remains an unverified code-based finding until the real fork/read test.


## U6 — component namespaces and migration ownership

Each mount now compiles its schema, authored relations, and procedures against a fresh namespace binding. Physical names depend on canonical mount identity, with a readable prefix and hash; relocating source files does not change identity. Ownership is persisted and detached instances retain their schemas and history. Explicitly authored empty schemas remain migration scopes, so removing the final table produces a destructive migration requiring review rather than silently skipping it.

Migration generation, status, development synchronization, compatibility declarations, release preparation, and activation inspect every required scope. Component histories live under `_generated/migrations/components`. Component-only changes no longer require a fake application migration. Generation preserves the primary artifact fields and reports all changed scopes. Status uses one owned database connection. Schema-only adoption verifies source ownership and all scope fingerprints and restores histories together, including detached ownership.

Evidence: repeated-mount authored relations resolve to distinct native tables; PostgreSQL tests prove independent rows, restricted runtime grants, additive upgrades, idempotent reruns, retained data/history on unmount, and rejection of ownership reassignment. A real local release-database transaction fails on a second component's NOT NULL migration, leaves activation unavailable, and resumes after row repair. A simulated schema-only clone in another local database proves multi-scope adoption, idempotency, and forged-ownership rejection. This simulation is not Neon acceptance.

Independent migration review found framework-only history divergence incorrectly blocked component release planning. A shared readiness predicate and regression fix it. Parent review restored migration CLI error codes and found component-only generation attempted an unchanged app migration; the added regression now passes. Existing migration CLI integration passed. Full-source namespace bundling initially lost default exports and introduced a static Bun import into Node tooling; consumer generation and the unit suite caught both, and both were corrected.

ce-simplify-code agents reviewed reuse, quality, and efficiency. Applied two quality changes (shared generated-reference resolution and inline development iteration) and two efficiency changes (single-connection status and ownership writes only on state transitions). Deferred batched ownership/catalog reads because preserving error order is more valuable than the unmeasured optimization. Ownership validation and locks remain intact.

Verification so far: 252 unit tests, 14 focused component generation/runtime/PostgreSQL tests (93 assertions), package runtime typechecks, compiled consumer SDK overload checks, and root anti-slop lint passed. Final workspace typecheck completed all 16 tasks. Independent rereview approved U6 with no remaining findings. Lint was rerun after the build completed because the concurrent attempt observed temporarily absent compiled exports. No production resources changed.


U6 commit: `f57aa52`.

## U7 — SDK services and Effect lifecycle

Component factories accept validated env/options and only declared dependency service capabilities. Sync, Promise, and scoped Effect factories retain their exact SDK object, method receivers, overloads, and Effect failures. Generated local and parent contexts expose those service types. Shared initialization runs outside request async context, coalesces concurrent acquisition per instance/generation, disposes partial failed acquisition, allows recovery, and releases resources after generation shutdown drains callers. Factories use captured env/options; ambient generated env reads during deferred Effect execution are not part of the initializer contract.

Runtime middleware authorizes before acquisition. Explicit retryable and live invocations receive denied service capabilities even after successful warmup; nested calls cannot widen that policy. One cancelled requester does not cancel another request's shared acquisition. Successfully initialized dependency trees avoid repeated traversal, while policy and generation checks remain mandatory.

Evidence: six unit lifecycle tests cover coalescing, native receivers, overrides, failure cleanup/recovery, identity isolation, replacement generations, shutdown, and partial-acquisition interruption. Compiled type fixtures cover native overloads, mixed sync/Effect return inference, invalid scalar Promise returns, and rejection of per-request Effect dependencies. A generated consumer initially failed because createComponentRpc omitted the service context generic; its local and mounted overload assertions now pass. Assembled graph tests cover distinct mount options/env defaults, dependency ordering, non-database and database authorization denial before initialization, cancellation sharing, cached live denial, and cached retryable/nested denial with handler-entry counters.

An independent security review reported no concrete vulnerability and requested stronger assembled tests; those tests were added and passed on PostgreSQL. ce-simplify-code agents completed reuse, quality, and efficiency reviews. Applied one type-alias reuse and one warmed-initialization fast path with access checks retained; no per-method vendor proxy introduced. Independent final correctness review returned no findings, residual risks, or testing gaps.

Verification: 252 unit tests across 63 files; 14 focused component integration tests with 93 assertions; workspace typecheck/build dependencies (16 tasks), runtime Node/browser presets, generated consumer compilation, and anti-slop lint passed. Lint's initial concurrent-build attempt was invalidated by temporarily missing dist declarations and passed when rerun after build. No live provider SDK account acceptance or Neon component acceptance is claimed in this unit.
