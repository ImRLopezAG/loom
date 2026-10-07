# R2 shutdown oracle source review

Verdict: **REJECTED** — one bounded test-cleanup correction required. The deadline oracle itself is supported by source inspection.

Reviewer: independent gpt-6-astra, low effort. Scope: current `packages/tests/unit/diagnostics-telemetry.test.ts` versus `5dc3a8f8`, with surrounding session/output/OTLP and installed dependency source read-only. No delegation or source edits. This receipt is the only file written.

## Finding

**P2 — Register an unexpectedly successful competing session before asserting rejection.** `packages/tests/unit/diagnostics-telemetry.test.ts:292-294` passes `startDiagnostics(...)` directly to `.rejects`. If the ownership regression this assertion targets permits startup at 1999 ms, the promise resolves with a live output session, then the assertion fails without recording that session in `cleanups`. The afterEach hook only stops registered sessions (lines 13-16). Restoring mocks/timers does not remove that session's diagnostics-channel subscriptions or its global ownership token. The original session's token-checked release cannot release the replacement token. Subsequent cases can consequently fail with `DIAGNOSTICS_ALREADY_ACTIVE` while the leaked listener remains subscribed. This is a source-supported failure-path defect, not an observed current runtime failure.

Bounded fix: register any successful result before the rejection assertion, for example `startDiagnostics(...).then(own)`, preserving the exact rejection assertion and 1999/2000 boundaries. Do not swallow the unexpected success or weaken the assertion. Review the revised source, then queue execution with root.

## Source assessment

- Both original `<2000` assertions remain. The isolated final attempt aborts at 1000 simulated ms. The periodic request is explicitly 100 ms old at stop, leaving 900 ms before its request timeout and another 1000 ms for the final attempt: expected completion 1900 ms. No scheduling tolerance was introduced.
- The added exact-boundary case is not circular: the fake transport reacts only to the production AbortSignal, never to an injected stop deadline. It delays first-abort rejection by 500 ms, yielding settlement/final request at stop+1400. The production deadline must abort the second request at stop+2000, before its ordinary stop+2400 request timeout.
- The queued 1024 ingress records require 16 batches of 64 (`session.ts:85-96`). Installed Vitest 5.0.1's bundled fake timers schedule nested zero-delay timers one ms later (`dist/chunks/index.m3L2HgmY.js:4947`), so exporter.stop is reached after positive elapsed time. Resetting the exporter budget there would move cancellation beyond 2000; the exact assertion would detect that. The session deadline callback cannot repair that mutation because `finishExport` is already latched (`session.ts:79-82`). This is a source counterfactual, not an executed mutation test.
- `advanceTimersByTimeAsync` delegates to `tickAsync` (installed chunk lines 6790-6791); asynchronous ticking yields through a native timer after each callback to allow native Promise callbacks (lines 5840-5844). This supports the real serialization Promise chain, `startFlight` deferred send/finally cleanup, delayed rejection, final serialization and stop completion being observed at the intended fake timestamps. Effect serialization remains real; only fetch and listed clock APIs are replaced. No stubbed serializer or manually incremented failure counter creates the asserted output.
- Two independent request-body captures, two abort timestamps, two production failure counts, maximum-one pending transport, cumulative RPC totals 1/1025, export-loss total 1 in the final body, ownership denial at 1999, replacement acceptance after 2000 and stable old-session snapshots provide substantive assertions. The pending flight is awaited before the second send; the delayed first rejection is explicitly observable through the zero-failure assertion before settlement.
- `finally` restores global fetch mocks and real timers for ordinary assertion failures whose registered cleanup settles. The unregistered-success path above remains a gap in owner cleanup. No guarantee is claimed for arbitrary production cleanup hangs.
- Existing real HTTP tests in this file remain, including periodic recovery and final cumulative export. Separate unchanged `diagnostics-otlp.test.ts:396-462` retains real disconnect-during-stop, hung-body cancellation with a short absolute deadline, and in-flight plus final-response timeout coverage. Replaced session timing cases therefore do not remove all real HTTP cancellation coverage. The separate existing 2400-ms exporter assertion was not changed or treated as satisfying the strict session assertions.
- Socket union narrowing now uses Effect's real `Schema.is(Schema.String)` predicate; installed Effect 4.0.0 `SchemaParser.ts:138` exposes a type guard. The prohibited suppression was removed without casts, replacement suppression, configuration changes or lint evasion found in this scoped diff.
- No production API/type/DiagnosticsOptions changes occur in the assigned diff; public consumer tests remain separate. No metrics mapping, 68/128 bound, hostile-payload projection, privacy containment, production deadline, existing assertion or test timeout was weakened in this scope. Concurrent standards/watcher modifications are not accepted by this receipt.

## Evidence and limits

Read `CLAUDE.md`, root `/Users/angel/dev/loom/AGENTS.md`, the plan's provenance and shutdown requirements, R1 `review.json`, `validator-verdicts.json`, and `deadline-worker.md`. Original R1 findings remain frozen; this is not a new full-feature review or missing-reviewer claim. The worker's predicted green remains unexecuted.

SHA-256 of inspected current source:

```
4917538535ffdee9fc1a701dea88d5d310589da1da4aabc8d6523827a7065695  packages/tests/unit/diagnostics-telemetry.test.ts
ed70cd43664b2f333fa92f4676b50510bc4b406ffed50ed2c6fde959d9acc0a6  apps/loom/src/tooling/diagnostics/session.ts
fea8353a0f1a2e25360d5fe7d076f22f6d70997d2d56fb906acbbf2e86761631  apps/loom/src/tooling/diagnostics/otlp.ts
ecfc131b6af638984b9000623a4de45f5f338a6de6d1d877189f00e8db808aa0  apps/loom/src/tooling/diagnostics/output.ts
```

No tests, typecheck, lint, format, build, browser, server, database, collector, reproduction, app execution or runtime probe ran. Pending gates: bounded cleanup fix and source re-review; root-authorized canonical verification including timer/serialization behavior and real HTTP tests; full final implementation/API/security review after canonical verification. Retain the command cleanup-error coverage gap and all earlier phase evidence limits. No commit, push or shipping acceptance.
