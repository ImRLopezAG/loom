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

U7 commit: `4f2746c`.

## U8 — Hono component HTTP

Component HTTP uses explicit anonymous, verified-user, or signed-webhook policies. Exact bounded original bytes reach the verifier before handler validation; verifier and authorization callbacks access only their mounted environment before SDK acquisition. Native socket upgrade stays ahead of Hono. Generated handlers have typed services, internal calls, tables, validators, and environment. Nested component routes are permitted with exact-route collision checks. Immutable fetch/redirect responses retain their body and status.

Independent security review found no ingress bypass and requested assembled lifetime and secret-isolation tests. Those pass against PostgreSQL: rejected sibling signatures initialize no SDK, and shutdown drains a timed-out handler before disposal. Independent correctness review found missing authorization environment scope and immutable-response header mutation; both were fixed and re-reviewed with no remaining blocking findings. Simplification retained the explicit body-reader and lifecycle boundaries.

Verification: isolated U8 build and package/Node/browser typechecks pass; four native HTTP/generated-consumer/assembled PostgreSQL integration tests pass. Seven HTTP unit tests and existing WebSocket/storage regressions pass. Final combined U8/U9 verification before splitting commits passed 259 unit tests, 21 focused integration tests, workspace typecheck (16 tasks), and anti-slop lint. U9 source was preserved outside the checkout temporarily so this commit was checked independently. Webhook deduplication remains component-owned; the fixture demonstrates it without claiming vendor certification. No Neon acceptance is claimed yet.

U8 commit: `dfcdc08`.

## U9 — scoped durable work, storage, and live dependencies

Durable envelopes, scheduler keys, worker targets, and replay identities carry canonical mount scope. Nested scheduling stays inside the shared transaction. Component crons and storage declarations join generated runtime/deployment resources; duplicate cron identities fail before connecting. Scoped storage uses bounded hashed ownership identities, preserves sibling isolation, dispatches callbacks from persisted intent ownership, and rejects removed mounts. Quarantine cancels inherited component jobs.

Live snapshots union child revision dependencies under concurrent calls and include root authorization revisions. Unrelated component changes do not invalidate a subscription. One restricted notification connection listens to all mounted namespaces. Database/scheduler options are cached once per scope and share one transaction connection identity.

Independent review found and verified fixes for four issues: per-procedure connection wrappers broke nested calls; component snapshots missed root authorization revisions; concatenated storage deployments exceeded accepted lengths; component cron IDs could overwrite root IDs. Actual-runtime PostgreSQL regressions prove joint transactions/rollback, scoped scheduling, and membership-only revocation closing a child stream. Boundary tests cover long identifiers and early collision rejection. Simplification removed redundant event references and repeated scheduler construction.

Verification: 259 unit tests/64 files, 21 focused integrations/92 assertions, 16 workspace typecheck/build tasks, and anti-slop lint passed for the final assembled U8/U9 source. Additional generated-resource test verifies two mounted cron targets and shared bucket provisioning, then rejects a colliding root cron. The restored-source build, package/Node/browser typechecks, and lint passed before commit. U10-U12 and real Neon acceptance remain outstanding; inherited finalized-file reads still require the live branch test.

U9 commit: `144b789`.

## U10 — compiled external component packages

Published components attach a versioned descriptor to their inferred definition. Consumer generation resolves declared exports through the installation, including nested transitive packages and package-subpath entries. Each mount rebinds generated facades and sibling helpers into its own schema/RPC context. Generated declarations reference public package entries; consumer generation never writes installed packages. A package-local content hash includes private compiled helpers and excludes nested dependency installations, whose mounted descriptors are hashed independently.

Proof-first packed tests exposed nonportable declaration emission (private Field/ProjectService names and expanded RPC types), virtual-entry interception in Bun resolver hooks, and nested dependency relocation assumptions. Public named types and generated builder annotations preserve inference without expansion. Resolver filters avoid Bun's virtual entry and rebind bare package imports, including helpers outside a descriptor's entry subpath. A real package tarball test now compiles both SDK-only and stateful artifacts with vp, removes authoring trees, installs nested-only SDK dependencies, generates two mounts, compiles positive/negative client types, verifies installed files remain unchanged, changes an unlisted helper and observes a new generation hash, and rejects server exports in a browser build.

Independent correctness/security review identified bare-import bypass and incomplete helper hashing; both were fixed. Rereview found a package-subpath variant, also fixed and tested. Final bounded review reported no remaining concrete blocker. Three ce-simplify-code agents reviewed reuse, quality, and efficiency. Applied shared package-name parsing, Node filesystem copy reuse, and per-load published-entry resolution caching. Deferred cross-load digest caching because unchanged metadata cannot prove unchanged contents; deterministic safety checks remain.

Authoritative expanded test passes with the production Neon buildFunctionBundle nodejs24/esbuild archive extracted into a separate directory without application node_modules. Native HTTP calls under Node 24 against PostgreSQL 18 return distinct mounted namespaces and SDK results. This is local production-artifact verification, not deployed Neon acceptance. Descriptor unit tests reject unsupported versions and traversal. Full unit suite: 261 tests across 65 files passed; package/Node/browser/e2e typechecks and Oxlint passed before final workspace verification. Final workspace and focused codegen checks are recorded below after completion. U11 and U12 remain outstanding.

Final U10 checks: workspace typecheck/build dependencies completed all 16 tasks; five focused codegen tests passed (16 assertions); final root Oxlint and scoped diff whitespace checks passed. Production archive/native PostgreSQL packed test passed in 4.76 seconds. All cloud claims remain deferred to U12.

U10 commit: `8e344ac`.

## U11 — independent applications, SDK recipes, and development parity

Tasks, Next, and TanStack Start now mount their own independent components. The new journal CSR example uses native oRPC options, Valibot/Zod contracts, Effect/Promise implementations, a private insert, verified owner predicates, and explicit live streaming. Official WorkOS, Clerk, and Auth0 SDK recipes preserve native method types; provider-account acceptance remains deferred. Documentation covers explicit mounts, typed environment references, private callers, and optional signed synchronization. Existing signed HTTP integration fixtures cover that boundary; there is no claim of vendor webhook certification.

The browser acceptance fixture now exercises the official Neon SDK protocol with opaque session cookies and its JWT response header. Local test certificates are trusted only by fixture consumers. This is local protocol acceptance, not managed Neon Auth acceptance. Resource cleanup covers backend/auth/frontend acquisition failures. The shared loaded-project runtime projection removes duplicated scope/exposure assembly from fixtures and the dev server.

Development parity inspection found root-only runtime registration and HTTP composition. A focused signed-route test failed with 404 before the fix and passes afterward. Development now uses the shared component graph, production HTTP composition, all migration-scope history/catalog/permission checks, component cron schedules, and scoped procedure upgrade inventory. New PG18 tests verify exported-to-private component calls and private-route denial. The original development runtime regression passes. Dedicated component-only drift/cron scenarios remain for the final acceptance review.

Verification: all 18 workspace typecheck/build tasks passed; 261 unit tests across 65 files passed; the six focused browser scenarios passed with 50 assertions. The broader browser suite passed nine tests and found a missing query-core link in the packed-client fixture; that fixture was corrected and its failed test reran successfully. The three final development tests passed with nine assertions. E2E typecheck, anti-slop lint, and scoped formatting passed. Mobile journal screenshot inspected: no overflow, visible validation error, pause/resume controls and isolated entries.

Simplification: three independent reuse/quality/efficiency reviews completed. Applied shared runtime graph projection and removed unused example service infrastructure. Kept resume invalidation because removing it demonstrably prevents a fresh native live subscription (infinite stale time). Kept snapshot invalidation as fallback behavior. Quadratic dependency lookup is reserved for U12's required 1/10/50 measurements rather than an unmeasured rewrite.

Code/security review: independent source reviews found cleanup gaps, stale pause snapshots, unused services, and a wrong documentation validator import; all were corrected. Checked owner+issuer filters, private insertion identity, scoped HTTP verification, SDK environment isolation, opaque session cookies, WebSocket forwarding, and generated client boundaries. No unresolved exploitable finding retained. Full ce-code-review invocation failed after two reviewer launches hit the harness agent limit, including after worker completion; peer work was reaped. Code review: skipped (ce-code-review unavailable) — formal failed receipt at `/tmp/compound-engineering-501/ce-code-review/u11-5db459f9/review.json`; supplemental independent review and main-thread diff/security scan completed, not represented as a full multi-persona receipt. U12 remains required before overall completion.
