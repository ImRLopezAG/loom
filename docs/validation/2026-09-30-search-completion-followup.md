# Relational search completion follow-up

Status: both follow-up completion gates and current-source acceptance passed. This receipt supersedes the unconditional completion statement in the [U8 receipt](2026-09-30-search-u8-hosted-acceptance.md) with the evidence and limits below. The accepted [plan](../plans/2026-09-29-2003-feat-relational-search-pagination-plan.md) and native public API remain unchanged. Safe source hashes, static results, provider acceptance, review, and cleanup evidence are persisted in the [follow-up Neon receipt](2026-09-30-search-followup-neon-receipt.json).

## Scope and completed gates

The audit at `9d9225c536c3b80555cc6ab541db0b2b9b2fd36f` found two missing completion gates: the complete component migration regression (R18 / U6–U8), and cancellation/deadline proof while real search SQL was running (R10 / R16 / R18 / KTD12 / U5 / P075). The follow-up closes those gates without revising the accepted API or reimplementing the feature.

| Check                                                                    | Result                                                     | Diagnostic record                     |
| ------------------------------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------- |
| Complete component migration suite                                       | Six passes, zero failures, 45 assertions; 224.24 seconds   | `component-migration-result.json`     |
| Initial search plus generic, RPC, and component transaction regressions  | Five passes, zero failures, 148 assertions; 75.34 seconds  | `cancellation-result.json`            |
| Queued connection reuse red/green regression                             | Red observed; one green pass, zero failures, 57 assertions | `queued-reuse-result.json`            |
| Current search, direct cancellation, and pooled cancellation regressions | Three passes, zero failures, 129 assertions; 63.18 seconds | `repair-source-checks.json`           |
| Current strict direct and direct-TLS pooled regressions                  | Two passes, zero failures, 72 assertions; 29.45 seconds    | `repair-source-checks.json`           |
| Independent current-artifact direct/pooled cancellation verification     | All nine cases passed                                      | `peer-p1-current-green-verifier.json` |

Diagnostic records are under `/tmp/loom-search-followup-20260930`; the durable JSON receipt preserves their safe results. The verified disposable target was PostgreSQL 18.6, project `late-moon-69483649`, branch `br-holy-hall-awodpdgg`, endpoint `ep-still-art-awvx081r`.

The component repair grants its temporary restricted runtime role to the fixture owner so `SET ROLE` succeeds. The role remains `NOLOGIN` with restricted authority, and runtime DDL remains denied. The three remote workflows have explicit 180-second budgets; they measured 48.36, 87.43, and 88.07 seconds, with hundreds of completed SQL round trips. The original implicit five-second timeout could leave unfinished lock work, and an isolated 60-second run continued making progress until timeout. Existing upgrade, recovery, clone-adoption, activation, and authority assertions remain unchanged. This repair changes test setup and budgets only.

The runtime repair carries the invocation signal privately to the native database transaction, rejects with the original abort reason, revokes captured database authority, and consumes late callback outcomes. The original blocked-root test failed its 3,500-millisecond bound before the repair. Root and count tests observe actual blocked SQL before cancellation; a native 100-millisecond deadline starts after the count lock is observed. They cover deliberately unawaited count work, no late page publication, no remaining active or idle transaction before unlocking, and a fresh authorized count through the single-slot pool. Suspended callbacks and queued acquisition reject within 1,500 milliseconds, with late SQL denied and queued callbacks never entered. A fixture-only role grant repairs legacy RPC cleanup.

## Confirmed review findings and repairs

The independent peer's original **P1** finding was confirmed: disposing the client socket alone left SQL and locks alive behind the supported Neon transaction pooler. Sleep and held-lock tests reproduced that failure with both default and zero connection-check intervals. The repair sends a native PostgreSQL CancelRequest while the original pooler mapping remains alive, preserves the acquired TLS settings, rejects the caller immediately, and discards the client after bounded cleanup.

Independent verification binds the current source and compiled server artifact across nine direct and pooled cases, including actual direct TLS negotiation. Owned transactions and locks cleared before observer cleanup in 460–704 milliseconds; exact abort reasons, no late publication, fresh same-pool transactions, and restricted runtime authority were verified. The verifier executed with Bun 1.4.2; installed Node 24.21.0 is recorded without claiming Node-native test execution.

The original **P2** finding was also confirmed: an aborted queued acquisition destroyed a clean connection received before `BEGIN`. The red test observed a replacement backend PID. The repaired path returns that clean connection for reuse; green tests prove the same PID and zero pool removals. The final canonical search regression retains these checks.

The original Claude peer reviewed the initial seven-file snapshot, including those two defects. It did not review the later TLS cancellation helper. A supplemental independent security reviewer inspected that helper and current lifecycle; nine synthetic transport/schema probes passed, and the separate actual nine-case verifier established direct/pooled behavior. The canonical review records both original findings as confirmed and resolved, with zero current actionable findings and a current-source verdict of **Ready to merge**. Its local nine-lens coverage ran inline and does not represent nine independent agents.

Simplification receipts are `simplify-reuse.md`, `simplify-quality.md`, and `simplify-efficiency.md`. Reuse and quality ran sequentially in one reviewer context. The optional `Promise.withResolvers` suggestion was withdrawn because the core TypeScript library target does not support it. The initial static efficiency pass did not identify the queued churn later found and repaired from the independent peer review.

## Exact current-source acceptance

The current validation ran after both review repairs. A forced full build, full typecheck, lint, all 344 unit tests in 80 files, and formatting of the nine scoped files passed. Lint retains three existing warnings. Source and compiled artifact hashes did not change during validation. The exact hashes are in the durable receipt; `current-final-results.json` records the original run at source revision `7f3477e669b2510696f64e94ff7fbcc1de876c99` plus the reviewed working-tree delta.

One genuine hosted run of that current artifact passed three tests and 17 checks, with nine deployment POST responses returning 201 and no control-plane errors. The recorded 400/500/503 application responses are expected negative test cases. Accepted version: `313c2f3ea854e949b0f1a8829d04abcf64563acac3a789928fb3f68e6233868e`; artifact: `d65ef415ca76eb3e03a09a80dcc1a420a134c3e7f36f112e7e731b9a24cfe825`.

Hosted checks cover finite cursor continuity and isolation, four relation edges, Effect, output and budget rejection, two hosted WebSocket windows, external root/child/junction commits, authorization revocation on both replicas, representative 2,000-root/24,000-junction performance, key rotation restart, and missing-key startup refusal. This current-source run used one attempt without automatic retry.

The earlier hosted follow-up accepted a different artifact before the queued-reuse and pooler repairs; it is retained as historical evidence only. Its first attempt failed at release submission with a masked generic error whose underlying cause remains unknown. A passing instrumented retry does not establish that failure was transient or provider-caused.

Finite `queryOptions` still accepts the selection object. Native `infiniteOptions` still accepts `(pageParam) => contractInput` with `initialPageParam` and `getNextPageParam`. The earlier native `InfiniteQueryObserver` differential probe passed two cases and ten assertions, preserving callback input, cursor forwarding, accumulated pages/page parameters, and null termination. It adds client mechanics evidence, not database or hosted evidence.

## Retained acceptance and limits

Previous packed consumer and browser checks remain historical evidence in the [U8 receipt](2026-09-30-search-u8-hosted-acceptance.md), [scenario matrix](2026-09-30-search-u8-scenarios.md), and [original provider receipt](2026-09-30-search-u8-neon-receipt.json). Those boundaries were not rerun in this follow-up. Hosted cold replica continuation proves finite cursor behavior; it does not establish a hosted streaming-anchor restart. SSR rendering and browser lifecycle checks remain separate layers. Performance samples are observations, not latency guarantees.

Cancellation transport failure or timeout can prevent remote SQL from stopping; local cleanup is bounded to two seconds and reports a generic cancellation error. Cancellation cannot undo an already applied commit, and caller rejection does not prove rollback. No deterministic acquired `BEGIN` or in-flight `COMMIT` test, arbitrary external-effect preemption, real certificate-rejection test, or real cancellation-network outage test is claimed. Synthetic timeout/error probes and actual acquired TLS behavior have separate evidence. The private cancellation adapter validates the installed `pg` 8.23.0 boundary; driver upgrades require renewed compatibility verification.

Two search-owned formatting issues were corrected in `subscriptions.test.ts` and the generated `task-labels-search/plan.json`; parsed migration identifiers and snapshots are unchanged, and all eight subscription tests passed. The initial full root formatter reported 11 files before those corrections. The root check was not rerun globally: unrelated committed documentation and dirty documentation/generated staging files remain preserved. The final formatting pass covers only the nine authorized follow-up files.

## Review, cleanup, and commits

The canonical review artifacts are `review.json` and `metadata.json` under `/tmp/compound-engineering-501/ce-code-review/20261001-002103-b514a7eb`; their safe verdicts, coverage qualifications, and hashes are persisted in the durable receipt. Code review remains scoped to this completion delta; it does not reassess every requirement or historical implementation unit.

Component, cancellation, and queue-reuse fixtures were absent after their runs. Hosted owned Functions were removed, runtime roles were `NOLOGIN`, and no active or idle transactions remained. Password clearing cannot independently be proved through masked `pg_roles`. The owned disposable branch was deleted after identity, protection, Function, transaction, and role checks; a fresh project branch list confirms its absence. The secure connection file was removed. Final cleanup is persisted in the durable receipt.

The component fixture repair is committed as `7f3477e` (`test(components): validate migration lifecycle on Neon`). The runtime and transaction tests are committed as `37914bd` (`fix(server): cancel active database invocations (U5)`), with validated source hashes unchanged. The evidence commit is the commit containing these receipts; it is not self-referenced here. No unrelated plans, documentation, branding, generated staging work, or pre-existing index entries were changed by the receipt work.
