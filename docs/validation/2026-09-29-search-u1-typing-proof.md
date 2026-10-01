# Relational search U1: native oRPC projection typing proof

Date: 2026-09-29. Scope: U1 of [the search and pagination plan](../plans/2026-09-29-2003-feat-relational-search-pagination-plan.md). No search executor, pagination implementation, migration, or deployment was added.

## Result

**KTD2 is blocked with the installed versions.** Exact client-selected projections do not survive the generated raw client or native oRPC query, infinite, and live options. This does not satisfy R4 or AE1. Dependent U2–U8 work has not started.

An input selecting `title` and `labels.name` still returns the contract's fixed output: `title?: string`, `labels?: { name?: string }[]`, and accessible unselected properties. A type-only generic raw-client declaration successfully makes those selected values required and rejects an unselected property. Passing that declaration to unmodified upstream `createTanstackQueryUtils` loses the input/output relationship again.

The tests now characterize this incompatibility. Their green status means the failure was reproduced and isolated, **not that the proposed search API passed acceptance**. No broad optional result was adopted as a production fallback.

## Version boundary

| Dependency                         | Tested version                                     |
| ---------------------------------- | -------------------------------------------------- |
| Loom                               | Packed public package, 0.0.0, current working tree |
| TypeScript                         | 7.0.2                                              |
| oRPC / native TanStack integration | 2.0.0-beta.40                                      |
| TanStack React Query               | 5.103.2                                            |
| Drizzle ORM                        | 1.0.0-rc.4                                         |
| Valibot                            | 1.5.0                                              |
| React                              | 19.3.0                                             |
| Bun                                | 1.4.2                                              |

The installed `@orpc/tanstack-query/dist/index.d.ts` declares `ProcedureUtils<TContext, TInput, TOutput, TError>` with one fixed `TOutput`. `queryOptions`, `infiniteOptions`, and `liveOptions` use that output; their option-level generics cover selection callbacks, initial data, and page parameters, rather than evaluating output from a literal request input. `RouterUtils` extracts a single input and output from each client function. Its plugin hooks modify options, without replacing this return-type relationship.

Loom's generated `api.d.ts` uses `RouterContractClient<PublicContract, RpcCallContext>` and `RouterUtils<Client>`. Ordinary code generation therefore preserves the native fixed-output behavior. This is an observed limitation of these pins and tested declarations, not a claim about every possible future oRPC API.

## Reproduction

- [Workspace type fixture](../../packages/tests/types/search-contracts.test-d.ts): declared wire envelope, positive scalar/brand checks, negative projection checks, and the type-only generic comparison. There is no generic runtime implementation or consumer cast hiding a failed inference.
- [Packed integration fixture](../../packages/e2e/integration/packed-search.test.ts): builds on the compiled package, packs and installs it in an isolated temporary consumer, initializes an app, generates contracts and a real Drizzle M2M schema graph, and imports its generated client into the same TS7 assertions. The utility is imported directly from upstream oRPC in this consumer.

Before adding expected-error annotations, TS7 rejected required title and nested label assignments and accepted an unselected property. The packed test removes only the annotated projection-gap expectations and requires exactly four `TS2322` errors and one `TS2339` error. Missing dependencies, invalid generated declarations, and additional compiler errors cannot satisfy that check. All other negative validation and brand assertions remain enabled.

The packed graph has tasks, labels, and a junction table with Drizzle's native `through` relation. Its handlers return empty fixture pages; generation success proves graph/client compatibility only, not database traversal or pagination execution.

## Scenario evidence

| Scenario | Evidence and acceptance status                                                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P001     | **Fails exact projection inference.** Selected title remains optional and unselected done remains readable. The broader two-root-field matrix was not expanded after this failure.                                                                      |
| P002     | **Partial characterization.** Nullable-one and many shapes survive the fixed output; selected nested fields remain optional. Exact one-relation selection is unexecuted.                                                                                |
| P003     | **Fails exact nested inference.** Generated M2M graph is accepted; selected label name remains optional. No database traversal was executed.                                                                                                            |
| P004     | **Partial type evidence.** Task ID brand, nullable object, Date and bigint declarations remain intact. Decimal and transport round trips are unexecuted.                                                                                                |
| P005     | **Fails.** Query, infinite, live and tagged cache results retain the fixed output. Native select callbacks remain available but do not repair request-dependent inference.                                                                              |
| P006     | **Fails selected-shape rejection.** Initial and placeholder rows can contain an unselected done value. Wrong scalar types are correctly rejected.                                                                                                       |
| P007     | **Partial.** Suspense query/live and suspense infinite consumers have defined fixed-output data; exact selected output still fails.                                                                                                                     |
| P008     | **Type check passes.** Native skipToken, enabled, retry and staleTime controls compile without a wrapper. Browser hook behavior was not executed.                                                                                                       |
| P009     | **Fails; KTD2 blocks further work.** Packed generated raw client and the best-case generic declaration both lose dependent inference through native utility creation.                                                                                   |
| P010     | **Bundle check passes.** Actual generated browser entry bundles and retains its public service URL; the tested junction/schema, database credential and Node/PostgreSQL driver markers are absent. No browser network/session acceptance was performed. |

P011–P107 are unexecuted. No Neon database was contacted for this compiler compatibility gate.

## Validation and review

- Public `apps/loom` package build: passed, with existing Zod declaration and client-directive bundler warnings.
- Workspace typecheck: passed, 18 tasks; example and docs builds included by task dependencies.
- `packages/tests` and `packages/e2e` typechecks: passed.
- Packed search proof: passed, including expected rejection and actual generated browser bundling.
- Unit suite: 294/294 passed across 72 files on rerun. Initial concurrent run had one 5-second auth-provider import timeout; no source or timeout setting was changed.
- Oxlint, including anti-slop rules, and formatting checks for the two proof files: passed.

Sequential review in the main thread covered correctness, test sufficiency, repository standards, security, reuse, quality and efficiency. No independent reviewer was dispatched, following the workspace instruction. Review changes removed assertion/spread lint violations, restricted the packed failure check to the five expected diagnostics, and bundled the actual generated API instead of executing a type-only fixture. No remaining actionable finding was identified in this proof's files. Production search authorization, SQL safety, tenancy and performance remain unreviewed because their implementation has not begun.

## Decision required before continuation

The current requirements combine exact client-selected output with unmodified native option utility typing. The proof does not establish a supported mechanism satisfying both.

1. Keep client-selected projections and the familiar native `.queryOptions()`, `.infiniteOptions()` and `.liveOptions()` syntax; authorize a separate proof of an upstream type extension or generated selection-aware declaration layer. It must still delegate native runtime behavior and prove every selected result and override before implementation proceeds. This is not yet proven.
2. Keep unmodified upstream typing and let server contracts declare fixed projections. This is already compatible with native options, but explicitly changes R4's client-selected projection requirement.

Neither alternative has been implemented or silently substituted into the plan.
