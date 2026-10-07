# Final phase evidence review

Task: `node:delegated-task:command%3Amcp%3A583aba27-23ff-4583-add7-a3bb37e882cc%3Adelegate-task%3A001-remediation-final-phase-evidence-r1`

**APPROVED — final local phase/requirements/testing acceptance.** No remaining P1/P2 finding or missing required local gate identified. This accepts the reviewed correction tree and recorded host evidence; commit, PR registration, and decided CI remain the shipping tail.

Reviewed base `1590e4ec272cf4fc32bcaeb7123d94b2ac789fa1`, accepted HEAD `5dc3a8f8adf96cc315af45a5ac8f6c6f9577d4b2`, and current corrections. All **34 source pins** in `docs/validation/001-remediation/frozen-source.json` matched, including a final recheck. All **27 log hashes and byte counts** matched `log-inventory.json`. Existing `dev-runtime.test.ts` and `dev-watcher.test.ts` remain byte-identical to HEAD.

Read applicable instructions, original/refined plans and research, R1 report/validator/underlying returns and roster, worker responses, R2/R3 correction receipts, remediation journal, formatting evidence, relevant source and host logs. No CodeGraph index exists. No files were changed and no tests, builds, checks, runtime probes, delegation, or shipping operations were performed.

**Original findings and follow-up objections**

- **R1 #1, P1 — closed.** `apps/loom/src/cli.ts:362` canonicalizes the output parent before exclusive creation and forwards ownership through private helpers. `apps/loom/src/tooling/dev/watcher.ts:41` resolves the owned file; line 47 excludes only its exact path before invalidation. Missing filenames remain conservative and existing generated/ownership ignores remain intact. Public options and tooling exports are unchanged. The real watcher fixture proves idle preparation during continuing file writes, activation through a symlinked root, and observation of sibling/same-basename/directory changes. The source CLI fixture proves failed-edit recovery, old-generation availability, changed results at the same URL, exactly three native RPC records, continuing output, and cleanup. Both executed successfully in `native-r2.log`.
- **R1 #2, P2 — closed.** `apps/loom/src/tooling/diagnostics/project.ts:23` uses pure Predicate guards; descriptor-only finite projection remains intact. Prohibited suppressions were removed without replacement configuration weakening. Privacy R2’s Effect-runner objection remains recorded and is resolved by the R3 change. Final root/static checks and standalone lint passed.
- **R1 #3, P2 — closed.** `packages/tests/unit/diagnostics-telemetry.test.ts:195` and `:240` retain both strict `<2000` assertions. The additional case at `:259` drains 1024 queued observations, delays first-abort settlement, denies ownership at 1999 ms, and requires cancellation/release at 2000 ms. Actual serialized bodies, production AbortSignals, failure counts, cumulative values, and single-flight behavior supply causal assertions. No deadline is implemented by the fake transport. Real HTTP cancellation coverage remains.
- **Shutdown R2 cleanup objection — closed.** At telemetry test `:292`, `.then(own)` registers an unexpectedly successful competing session before the unchanged rejection assertion. The failure still fails the test while registered cleanup prevents the identified owner/listener leak.
- **Command cleanup coverage gap — closed.** `packages/tests/unit/diagnostics-dev-command.test.ts:20` covers cleanup-only and double failure under both signals, asserting exact error identity, one stop, file closure, subscriber/listener removal, replacement ownership, and no false stopped report. Development startup is intentionally mocked for this command-level failure oracle; native behavior is covered separately.

The original ten-lens review remains the full-branch review. Its timing-tolerance suggestion was not adopted; malformed-return bookkeeping does not indicate a missing reviewer.

**Requirements and evidence acceptance**

U1/U2 retain exhaustive privacy projection, bounded queues/output, loss accounting, ownership and supported late-settlement behavior. U3 now covers the previously missing file/watcher/CLI composition and command cleanup failures. U4/U5 retain private cumulative metrics and bounded transport. The collector oracle at `packages/e2e/integration/diagnostics-otlp.test.ts:498` identifies a new final export from the current resource/session, then compares all **68 distinct tuples**, values, units, temporality, histogram bounds/buckets/count/sum and stable start provenance against independently constructed expectations. It does not accept HTTP 200 or aggregate name counts alone. U6 retains isolated packed public types/runtime and browser exclusion checks.

Inspected final host evidence:

- `root-check-r3.log`: **20/20 successful, zero cached**, 89 files/500 unit tests, 77.167 seconds; configured builds/types and static checks passed.
- `native-r2.log`: **30 passes across eight files**, 31.52 seconds.
- `packed-r1.log`: **2 passes**, 13.21 seconds; source confirms isolated package installation, public declarations, native Bun/Node24 execution, and browser bundle exclusions.
- `browser-r1.log`: **6 passes, 32 assertions**, 7.83 seconds.
- `collector-r1.log`: **5 passes**, 13.54 seconds; pinned collector 0.156.0, full mapping oracle, native availability during exporter failure, and Bun/Node bridge.
- `lint-r1.log`: host-recorded exit 0; one unchanged `search-transactions.test.ts:90` warning.
- `cleanup-r2.log`: host-recorded exit 0; correct `kello_test`/180006 target, only `pgbouncer`/`public`, empty owned schemas/roles/other sessions, preserved helper.

No required skips are reported. Exit attribution comes from `command-results.json` and host receipts; this reviewer did not execute those commands.

Both genuine dependency reds remain retained: unit type failure in root R1, then e2e type failure in root R2 despite 500 unit passes. Inspected traces show mixed Node24/26 before correction and primary Node24 resolution afterward. Node26 does define `on`/`once`; the earlier contrary diagnosis is corrected. The combined dependency change is exactly four additions across two manifests and workspace lock entries. Earlier R1 approval is not expanded to cover the later e2e pin.

Formatting evidence covers nine owned files: six TypeScript AST-preserving changes, two unchanged parsed JSON values, and one Markdown formatting change. Before-content hashes and final hashes match; I inspected the proof mechanism without rerunning it.

Residual limits remain explicit: collector pass logs attest execution of the inspected decoded-data assertions, rather than retaining a standalone decoded export here; old U5 missing logs remain historical receipts; prior Vite transience remains recorded; browser remediation results add no new visual claim. Cleanup describes the released host window, not current infrastructure owned by 004. Any new runtime investigation requires a new grant. No hosted-provider, combined-feature, production, or PR/CI acceptance is inferred.
