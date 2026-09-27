# Components execution evidence

Plan: [Components, Internal Calls, and SDK Services](../plans/2026-09-27-0947-feat-components-internals-sdk-services-plan.md).

Started on `feat/orpc-effect-core` at `a433504`. Existing README edits and untracked earlier plans/explainers are excluded. Existing unpushed commits are not authority to publish. Implementation and review run sequentially in the main session under the user's AGENTS instructions; reviews do not claim independent corroboration.

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
