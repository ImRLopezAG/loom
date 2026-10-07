# R3 shutdown correction source review

Verdict: **APPROVED FOR SOURCE ONLY**. No actionable finding remains in this bounded correction. This is not execution, whole-feature acceptance, or permission to ship.

## Scope and criteria

Independent leaf review of `packages/tests/unit/diagnostics-telemetry.test.ts` against base `5dc3a8f8adf96cc315af45a5ac8f6c6f9577d4b2`, including the full deadline diff and the R2 failure-path objection. Read `CLAUDE.md`, `/Users/angel/dev/loom/AGENTS.md`, the plan's shutdown/public contract and acceptance gates, and the original full R1 `review.json`, `validator-verdicts.json`, `deadline-worker.md`, and full R2 `shutdown-oracle.md`. Applied the actual ce-code-review skill's correctness, testing, API-contract, security, reliability and standards criteria as a leaf; no orchestration. No `.codegraph/` directory is present. CE config is absent, so the default artifact root is `docs`; the user specified this sole output path.

Intent: replace the scheduling-sensitive shutdown evidence without changing the production deadline, native serialization, public API, finite payload/privacy boundaries, or failure assertions; ensure a failed ownership assertion cannot leak the session it unexpectedly creates.

## R2 disposition and failure-path cleanup

The sole R2 P2 is resolved at telemetry test lines 292-294: `startDiagnostics(...).then(own)` now precedes the unchanged `.rejects.toThrow(/^DIAGNOSTICS_ALREADY_ACTIVE$/)`. On expected rejection, `own` is not called and the assertion still verifies the exact error. On unexpected success, `own` synchronously records `session.stop()` in `cleanups` before forwarding the same session to the assertion; the assertion still fails. It neither swallows success nor alters ownership behavior.

The hook (lines 11-21) stops registered sessions in reverse order, advances fake time while the production stop settles, and restores mocks and real timers in `finally`. Thus an unexpectedly successful replacement is stopped before the original registered session. Production stop unsubscribes both channel listeners and releases only its own token (`session.ts`); a late original stop cannot delete a replacement token. This closes the particular owner/listener leak and cascading failure identified in R2. It does not claim resilience to arbitrary broken/hanging production cleanup.

Byte-level source comparison: removing only this `.then(own)` in a read-only stream reproduces the exact R2 telemetry SHA-256 `4917538535ffdee9fc1a701dea88d5d310589da1da4aabc8d6523827a7065695`. Current telemetry matches the host-supplied hash. Session, OTLP and output hashes also match R2. No other correction since R2 is present in these sources.

## Deadline and transport reasoning

- Both original strict `toBeLessThan(2000)` assertions remain (lines 195 and 240). Final-only completion is asserted at 1000 simulated ms. With the periodic request explicitly aged 100 ms, its remaining 900 ms plus the final request's 1000 ms yields asserted completion at 1900 ms. The original 10010-ms wall-clock sleep and approximately 10-ms scheduling margin are removed; no 2400-ms tolerance replaces either assertion.
- The additional queued-ingress case retains 1024 queued observations, a 500-ms first-abort settlement delay, denial at stop+1999 and release at stop+2000. The first request aborts at +900, settles at +1400, and only then can the final request begin. Its ordinary request timeout would be +2400; the production shared deadline must cut it short at +2000. The fake transport does not know or implement the session deadline: it rejects only when the actual production AbortSignal fires, optionally delaying the first rejection.
- `session.ts:79-96` drains 64 observations per batch and passes the original absolute deadline to the exporter. Installed Vitest 5.0.1's bundled timer implementation schedules nested zero-delay timers one ms later (chunk line 4947), making the 16 drain batches consume positive simulated time. A fresh exporter budget after drain would therefore miss the exact +2000 assertion. The session deadline cannot mask that error because `finishExport` is already latched. This is source counterfactual reasoning, not an executed mutation test.
- The installed `advanceTimersByTimeAsync` delegates to `tickAsync` (chunk lines 6790-6791); async ticking yields via the original timer after each callback so native Promise reactions can run (lines 5840-5844). This supports observation of the deferred send, serialization, fetch rejection, flight `finally`, final send and owner release at the asserted fake timestamps. Actual scheduling behavior under the canonical runner remains unverified.
- Production `serializeMetrics` still executes `Effect.runPromise` with the real `OtlpSerialization.layerJson`; installed Effect 4.0.0 routes metrics to `HttpBody.jsonUnsafe`. Captured ArrayBuffer bodies are decoded from actual serialized bytes. No metrics snapshot, serializer, failure counter, AbortController, session or exporter is stubbed. Only fetch and the explicitly listed clocks are replaced.
- The assertions retain two bodies, two aborts, two production export failures, maximum one pending transport, cumulative RPC counts 1/1025, final export-loss count 1, an unaborted second signal at 1999, both signals aborted at 2000, zero pending requests/timers, replacement acceptance, and stable old-session snapshots. The zero-failure check before delayed settlement makes abort initiation distinct from settled flight cleanup.
- Real HTTP coverage remains in this file (final cumulative export, periodic recovery, output interactions), and unchanged `diagnostics-otlp.test.ts:396-462` retains disconnect-during-stop, hung response-body cancellation and in-flight/final-response timeout cases. Its pre-existing 2400-ms assertion is neither changed nor accepted as evidence for the strict session assertions. Fake fetch does not prove native sockets, response-reader cancellation, or collector acceptance.

## API, security and standards

The deadline diff introduces no production API, event/type, observer, option, payload, metric mapping, queue/series/byte bound, privacy or cancellation weakening. The global fetch spy is test-local and restored; no public injectable transport or test toggle is added. Existing assertion thresholds and test timeouts are preserved. Socket narrowing replaces a prohibited suppression with Effect's actual `Schema.is(Schema.String)` guard (`SchemaParser.ts:138`); no replacement suppression, cast or configuration evasion is introduced. Sibling production changes are not approved by this receipt.

## Retained original review record

The original full R1 roster remains: correctness, security, api-contract, testing, reliability, adversarial, project-standards, maintainability, performance, agent-native. R1 loaded all ten outputs, including both agent-native prose receipts; its malformed-return bookkeeping did not mean a missing reviewer. No new full-branch review or cross-model claim is made here.

All original confirmed findings are retained: **#1 P1** JSONL writes invalidate active development updates; **#2 P2** prohibited anti-slop suppressions; **#3 P2** the real-clock shared-deadline test race. This receipt approves only the source correction for #3 and its R2 cleanup follow-up. #1 and #2 have separate source reviews and are not closed here. The command cleanup-error coverage gap remains a separate acceptance obligation: original-error precedence, cleanup-only failure, and release of diagnostics/file ownership and signal listeners need their authorized evidence. Prior historical collector/U6/root/native receipts, formattingR1red and transient docs Vite limits retain their original provenance; they are not fresh runs or whole-feature approval.

## Hashes and evidence limits

SHA-256 of inspected sources:

```text
454fec29dd1172ef0400e3f962f1dab77ad0b6b08000d6093fadacb4af1f3bb7  packages/tests/unit/diagnostics-telemetry.test.ts
ed70cd43664b2f333fa92f4676b50510bc4b406ffed50ed2c6fde959d9acc0a6  apps/loom/src/tooling/diagnostics/session.ts
fea8353a0f1a2e25360d5fe7d076f22f6d70997d2d56fb906acbbf2e86761631  apps/loom/src/tooling/diagnostics/otlp.ts
ecfc131b6af638984b9000623a4de45f5f338a6de6d1d877189f00e8db808aa0  apps/loom/src/tooling/diagnostics/output.ts
f56631635acaf90deb3b99e037afd8a2431ef685781ae3aa1109bb33d1d02702  installed Vitest 5.0.1 dist/chunks/index.m3L2HgmY.js
48bf8d787350597063074b99cf8f24028a3acd31ee85e68014c53dec36f87529  installed Effect 4.0.0 src/observability/OtlpSerialization.ts
```

Only changed path by this reviewer: `docs/tasks/001-reviews/r2/shutdown-oracle-r3.md`. Other edits were preserved. Only source/document reads, git inspection, source hashing and this artifact write occurred. No tests, typecheck, lint, formatter, build, app/runtime probe, browser, database, collector, server, reproduction, commit or shipping operation ran. Root has not granted execution; the 006 exclusive window remains respected.

Mandatory remaining gates: root-authorized canonical tests/checks, including the exact fake-timer/real-serialization lifecycle and preserved real HTTP coverage; then final integrated implementation/API/security review. Worker-predicted green and this source approval are not substitutes for those gates. No ship.
