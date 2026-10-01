# Search U1: native defaults and four-level schema typing

Plan: [relational search and pagination](../plans/2026-09-29-2003-feat-relational-search-pagination-plan.md), U1, KTD2/KTD13/KTD14. U1 remains incomplete; dependent U2–U8 have not begun.

## Schema-derived results

The [fixture](../../packages/tests/fixtures/search-schema.ts) compiles a real Loom schema and native Drizzle graph. Drizzle's exported `BuildQueryResult` derives its row types. There are no handwritten row DTOs, consumer casts, or suppression annotations in the new assertions.

The [positive type assertions](../../packages/tests/types/search-schema.test-d.ts) establish:

- Exact title-only and done-only root fields.
- Four relation edges: task → optional project → required organization → teams → members. Selected fields and one/many cardinalities remain exact at every level.
- Native M2M task → labels returns label objects without junction fields.
- Branded task IDs, Date, bigint and decimal strings retain their schema types.
- Filtering a required one relation can produce null.
- Conditional selections produce a union; widened optional selections do not invent guaranteed fields.

This is a native schema/graph proof, not acceptance of generated dependent clients, runtime filtering, sorting, pagination, or database execution.

## Reproduced incompatibility

Six [native observer tests](../../packages/tests/unit/search-options.test.ts) characterize the following behavior under each of global QueryClient defaults, key-specific defaults, and scoped oRPC utility defaults:

1. Cache a title-only page, then start a done-only request with a distinct native key. While the request is pending, `keepPreviousData` supplies the title-only page. Its rows have no `done` property. A second pending request reuses the same placeholder callback/result. After the actual done page arrives, placeholder status clears and the selected field is present.
2. Configure title-only `initialData`, then create an observer for done-only input. Its non-placeholder result immediately contains the title-only page.

The runtime fixture types its result honestly as a union. Separate positive compiler assertions show that native QueryClient accepts these global/key defaults even when a native procedure's exact, schema-derived output declares `done: boolean`.

Installed TanStack Query 5.103.2 merges defaults in `QueryClient.defaultQueryOptions` before the observer sees them. `QueryObserver` also memoizes placeholder results when the callback reference is unchanged. Installed oRPC 2.0.0-beta.40 copies supplied/scoped options into its returned options; when no per-call data option exists, it does not shadow QueryClient defaults. These are client-side operations; server output validation cannot repair them.

Restricting the generated method's placeholder callback types can reject unsafe per-call callbacks. Specialized scoped utility types could similarly constrain scoped defaults. Neither constrains global/key defaults installed separately through the caller's native QueryClient. Thus type-only generated declarations cannot establish the complete KTD13 guarantee while keeping the agreed runtime unchanged. P113–P115 are failing acceptance boundaries, although the characterization tests pass.

## Decision needed before runtime implementation

Recommended amendment: allow a small search-specific options adapter around native oRPC options. Keep the public `rpc.tasks.search.queryOptions(...)`, `infiniteOptions(...)`, and streaming `liveOptions(...)` surface and native TanStack cache/transport. The adapter would explicitly shadow inherited `initialData`/`placeholderData`, accept those controls per call with selected-output validation, and validate reused data against the current descriptor before exposing it. Per-call placeholder callbacks must not reuse a memoized result from a different projection. This changes runtime behavior and must pass new packed/observer tests before U1 can pass.

The alternative is to declare global/key cache data overrides caller-owned, outside Loom's guarantee. That changes KTD13's promised coverage. Neither amendment has been applied. No runtime adapter, replacement query system, or weaker public output type has been introduced.

## Verification and review

- Six focused native observer tests passed; the full suite passed 300 tests across 73 files.
- TS7 assertions passed with `exactOptionalPropertyTypes` both true and false.
- Workspace typecheck passed all 18 tasks, including required build dependencies; root Oxlint/anti-slop passed.
- The existing packed search characterization passed in 5.72 seconds. It still establishes the native fixed-output gap, not positive generated selection typing.
- A full test-package TS7 run with extended diagnostics took 3.547 seconds, checked 3,208 files, and reported 2,268,127 instantiations and 955,066 KB memory. This includes dependencies and unrelated tests; it is not an isolated graph benchmark or performance improvement claim.
- Simplification reviewed reuse, quality and efficiency sequentially under the user's tool mapping. The fixture reuses native graph/result types; observer tests use deferred requests and deterministic state checks with cleanup. No further simplification was needed.
- Code review followed ce-code-review's lite path for this test-only diff, with supplementary inline security review. Checked exact assertion scope, native option/default precedence, repeated placeholder reuse, settlement and observer/cache cleanup, strict fixture input validation, and absence of credentials, cloud mutation, SQL execution or production API changes. No code defect remains in the bounded proof diff. This is a single-context review, not independent certification.

No Neon resources were accessed or changed. Filtering/sorting operators, runtime four-level loading, cursor traversal, live windows and hosted acceptance remain unexecuted because U1 gates those units. The implementation goal remains active pending the API decision above.
