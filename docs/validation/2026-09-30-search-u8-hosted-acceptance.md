# U8: hosted relational search acceptance

Status: complete for the accepted relational-search scope, including the approved U1 cache-safety amendment. U1-U7 each have their own committed validation receipt. This receipt closes U8; it does not claim every unrelated integration in the repository passed.

## Delivered behavior

The compiled schema and Drizzle relation graph produce the contract validators, handler search context, and selection-aware generated raw client/native options. Finite forward/backward traversal hides ordering keys, keeps exact numeric codecs, and optionally counts authorized roots in the same transaction. Explicit streaming contracts publish one coherent current loaded window, including their first result. Direct, M2M, optional/filtered one relations, and four relation edges are covered.

Consumers keep native `queryOptions`, `infiniteOptions`, and `liveOptions`. The approved search-only adapter validates supplied initial/placeholder data and shadows inherited data defaults. Unrelated procedures retain native behavior. Reconstructing utilities directly with upstream `createTanstackQueryUtils` has the documented fixed-output typing limit. Intentionally colliding custom keys and arbitrary external cache writes remain caller responsibility.

The tasks example adds labels and a junction through an additive generated migration in `_generated/migrations`. Checked docs cover policy, contract, handler, generated client, finite/live/suspense/SSR usage, budgets, counts, child pagination, and finite versus live consistency.

## Executed checks

| Boundary                                                              | Result                                                                                                       | Local diagnostic record                 |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| Production/docs build                                                 | 8/8 tasks passed                                                                                             | `/tmp/loom-u8-build-budget-fix.log`     |
| TS7 workspace checks                                                  | 18/18 tasks passed                                                                                           | `/tmp/loom-u8-typecheck-acceptance.log` |
| VitePlus unit suite                                                   | 344 tests in 80 files passed                                                                                 | `/tmp/loom-u8-unit-last.log`            |
| Oxlint/type-aware anti-slop                                           | Passed; three unrelated/pre-existing warnings                                                                | `/tmp/loom-u8-lint-acceptance.log`      |
| Six real Neon search suites                                           | 6 passed, 431 Bun assertions                                                                                 | `/tmp/loom-u8-neon-final.log`           |
| Independent child endpoint traversal                                  | Passed; 83 Bun assertions plus Node assertions                                                               | `/tmp/loom-u8-child-final.log`          |
| Installed generated API, codec changes, unmounted client reachability | Passed with both exact-optional compiler settings; actual negative TS7 compilation; no positive suppressions | `/tmp/loom-u8-codec-unmount2.log`       |
| Real Neon detached search component data                              | Passed, retaining roots, labels and junctions                                                                | `/tmp/loom-u8-search-unmount-final.log` |
| Packed Next.js and TanStack Start                                     | Independent consumer builds passed                                                                           | `/tmp/loom-u8-frameworks-final.log`     |
| Watcher, slow WebSocket peer, finite/live browser                     | 6 tests passed                                                                                               | `/tmp/loom-u8-regression-complete.log`  |
| Required hosted cloud runner                                          | 3 tests passed; no skips accepted                                                                            | `/tmp/loom-u8-cloud-diagnostic.log`     |

The installed-package test also runs concurrent identity-isolated finite prefetch/dehydrate/hydrate and renders a native live hook on the server without opening a subscription. Browser tests separately prove finite/suspense/live first-value loading, replacement cancellation, and projection/identity isolation. This is layered SSR/browser evidence, not a claim of one complete Next/Start hydrated browser journey.

## Hosted target and evidence

The target was an owned schema-only disposable PostgreSQL 18 branch in Loom project `late-moon-69483649`: branch `br-wispy-dew-awdp5g3y`, named `loom-acceptance-search-20260930`, endpoint `ep-shy-sky-aw6q8t6z`. The runner verified the endpoint against the supplied migration connection and refused protected/default or mismatched targets.

The normal packed release path generated/applied migrations, provisioned the shared branch cursor key and deployed separate restricted runtime credentials. Two independently deployed service Functions, `loomlivea` and `loomliveb`, exercised native HTTP and WebSocket behavior. The [redacted provider receipt](2026-09-30-search-u8-neon-receipt.json) records actual version/artifact/deployment identities and these 17 checks:

- M2M finite results and exact count against the database oracle.
- Cross-replica/cold finite cursor continuation and backward traversal.
- Identity-bound cursor rejection.
- Four relation edges and Effect search service.
- Malformed output refusal and typed nested-row/encoded-output budgets.
- Two hosted WebSocket loaded windows.
- External root, child and junction commits.
- Authorization-only revocation on both replicas.
- Representative indexed-root, count, M2M and deep-relation workloads.
- Hosted key rotation restart and missing-key startup refusal.

With 2,000 roots and 24,000 junction rows, three measured requests per workload ranged approximately from 146-378 ms for indexed root pages, 142-144 ms for exact counts, 2,823-2,837 ms for 50 roots with 12 labels each, and 152-212 ms for four relation edges. These are observed timings, not performance guarantees or claimed improvements. The retained EXPLAIN records describe root/count/junction oracle SQL, not the complete generated Drizzle projection SQL. The stress junction lacked a foreign-key access index; documentation makes index selection explicit.

## Review, fixes and simplification

Ten review lenses ran sequentially in the main thread under the supplied AGENTS mapping: correctness, security, API contract, testing, performance, reliability, data migration, maintainability, frontend races, and repository standards. They are not independent local reviewers. Simplification examined reuse, quality and efficiency, preserving authorization/output checks and reusing the existing graph, native options, deployment helpers and shared HTTP status map.

An independent supervised Claude CLI review confirmed `claude-opus-5-5`. Low effort was requested; actual effort was unverified. Its initial snapshot predates the final follow-up tests/fixes. Those follow-ups received inline review, not another claimed independent review.

The peer's P2 finding #1 was confirmed and fixed: failed acceptance now always deletes only the preflight-owned Function slugs and makes its fresh runtime role `NOLOGIN PASSWORD NULL`. A deliberate failure after both service deployments caused the required runner to fail; subsequent provider/database inspection proved zero owned Functions remained and the failed role could not log in. The subsequent successful required runner proved rerun recovery.

The peer also identified a possible preflight budget inconsistency. A discriminating test reproduced it, then the traversal preflight was changed to emit the declared budget error before inspecting further output. The complete 344-test suite and hosted budget checks passed afterward. Its preference to fully validate oversized malformed output before enforcing budgets was rejected: validation must stop at the configured traversal bound, publish nothing, and return a budget failure rather than perform unbounded shape inspection.

The final scenario audit additionally tested child endpoint paging, string-to-boolean codec regeneration, unmounted public reachability, and retention of detached search component root/child/junction data. The [P001-P130 ownership matrix](2026-09-30-search-u8-scenarios.md) distinguishes complementary test layers and their limits.

The final infinite-query example uses `initialPageParam: null` with an explicitly typed native input callback. TS7 and the documentation build passed after removing the unnecessary first-page object; the docs explain how TanStack forwards the returned cursor through oRPC.

Review run: `/tmp/compound-engineering-501/ce-code-review/20260930-190009-6e0f0dbe/review.json`. No actionable search findings remain.

## Failure accounting and scope limits

A preceding final-release deployment attempt failed during normal release deployment. It did not count as acceptance; the required diagnostic rerun passed all three cloud tests. Cleanup runs on both outcomes. The injected teardown-failure test is an expected failure and is not included in successful feature counts.

A supplementary legacy `component-migrations.test.ts` run was outside the search-specific acceptance suites. It reported a Neon `SET ROLE` permission assumption and timeouts in old multi-scope/clone recovery tests; it is not claimed passing. That file was left unchanged. The applicable search unmount scenario has its own actual Neon assertions instead. Search fixture transactions use explicitly granted restricted runtime roles.

Finite pages observe separate request snapshots, so cross-request writes can move rows across a boundary; live windows replace a current snapshot and do not replay history. Exact counts and high relation fanout can be expensive. Existing revision polling remains the invalidation mechanism. No new authentication provider, frozen browsing transaction, arbitrary SQL interface, ranked full-text engine, or global cache safety guarantee was added.

Only unit-owned source, fixtures, generated migrations and these validation records are included in U8. Unrelated documentation/branding work remains in the working tree. Provider inspection confirmed zero Functions before deletion, and a subsequent SDK read confirmed the owned disposable branch was removed. Its URLs in the receipt are historical evidence, not running examples.
