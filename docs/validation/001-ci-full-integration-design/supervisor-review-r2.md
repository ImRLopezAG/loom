# Frozen executable supervisor R2 — independent source review

**Terminal verdict: NOT APPROVED. Two P2 correctness findings remain.**

This is a new, bounded review of the complete frozen R2 composition, not a continuation of the earlier review or inherited approval. It covers implementation, API use, ownership, publication/privacy and evidence semantics. Approval, if subsequently obtained, would be source-only and would require a separate decision before any remote execution.

## Scope and integrity

Reviewed the complete 1,376-line `linux-full-integration.py`, complete exact `supervisor-r2.patch`, R2 source note and responses, full R1 rejection, R1 scope/source/freeze, full design protocol/review/manifest/freeze, authoring script as text, instrumentation patch, eight overlay postimages and workflow proposal. Reviewed the previous Linux design/proposal/source receipt, supervisor reviews R1/R2/R3 and responses R2/R3, and complete 845-line old supervisor. Historical feature/remediation, startup, final-head and Linux-results receipts were considered as evidence with their stated limits, not substituted for current acceptance.

Read/hash/git/text inspection only. No imports, syntax or parser execution, tests, builds, types, lint, database/probes, browser, collector, CI, remote execution, overlay/workflow application, commit or push occurred. No delegation occurred. The only authored file is this receipt. No `.codegraph/` exists at the worktree root. Unrelated untracked work is preserved.

Verified SHA-256:

| Artifact | SHA-256 |
| --- | --- |
| Complete R2 executable | `1b250152976b987e5ecc86e43bdad974dae463e2f3f04c4bdfe5087e774abd32` |
| R2 freeze | `453f9fcb545b9890f80396af0b82015e4b09b0aad71202344bcf6eaf67ce912d` |
| Archived full R1 executable | `6b1aa6ecc864373f3cfea04b42c1d7a639225c3c22ce2c7f1366d5472e139939` |
| Old Linux diagnostic executable | `dcb5338b159451c1bcdffa8e14efa1c756107bbdfcc900d6d81701e5e31584f6` |
| Design freeze | `6b875755c833171cb29cbc2015969fc5ceed9b7130f6bbc4c197bbfc21445ba1` |
| Full R1 supervisor freeze | `45a8c3552347bb811d7a81eaf28b032413541f40b4c85f80c920964143011861` |

All 23 R2 artifact pins, all 13 design pins, six input pins and eight overlay hashes matched. All seven live preimage hashes matched the manifest; the new live helper is absent, including as a symlink. Live source and workflow remain unchanged. HEAD is `43599002a0da6e5db887c35cf221d018e6975c77`; tracked git diff is empty. The R2 patch body matches the actual archived-R1-to-R2 difference (excluding the two diff timestamp headers); both bodies hash to `5543db697f581bd0c363744b14bf676d865f5dd4db7f7a92148cabf914a50c35`. The design manifest's `executableSupervisorAuthored:false` is historical design-freeze metadata, not a statement about current source acceptance. The proposed workflow was read, not applied; its declared postimage is not a runtime receipt.

## Findings

### P2 — Root filtering discards valid lifecycle records produced by `flush()`

**Location:** `linux-full-integration.py:708–712,727–729` (consequence at 735–741).

R2 first reduces every built record to those carrying the target `rootHash`, then forms coordinator cohorts from that reduced set. The overlay does not guarantee root context for every coordinator call. In `overlay/apps/loom/src/tooling/dev/watcher.ts:41`, `ciScope` covers coordinator creation; initial invalidation is separately scoped at line 75, but line 83 returns the unbound `coordinator.flush`. `overlay/apps/loom/src/tooling/dev/ci-trace.ts:49–52` uses `AsyncLocalStorage.run`; it does not bind returned methods to that scope.

When the fixture calls `flush()` before the pending debounce timer fires, `overlay/apps/loom/src/tooling/dev/coordinator.ts:109–111` invokes `ready()` directly in the caller's context. That invokes `begin()/run()` (85–89,73–79). Lifecycle records at 57,60,63,67 carry coordinator/revision but no explicit root; the update scope at 59 adds coordinator/revision only. The development update itself emits root-bearing records. Thus the supervisor can retain `update.begin` while dropping its actual `revision.begin`, terminal and end, reporting `orphan_revision_evidence`/`target_revision_missing`. The fixture's initial malformed-schema flush is a legitimate observed failure path, not missing instrumentation. The public project wrapper returns the development handle without binding its methods (`apps/loom/src/tooling/dev/project.ts:101–104`).

**Consequence:** A valid complete trace can lose its revision rows and become diagnostically incomplete. Lines 1277–1281 and 1365 can turn an otherwise successful root run into supervisor failure; on a red run the original nonzero remains preserved but useful lineage is misclassified. This is a source-supported possible ordering, not a claim about observed Linux timing.

**Required correction:** Anchor the coordinator to the target root using its root-bearing creation and exact built PID/instance/coordinator identity, then admit its rootless lifecycle records by that identity while rejecting contradictory explicit roots. Alternatively, explicitly propagate root scope through all relevant entry points in a separately reviewed overlay change. Do not join unrelated coordinators or weaken terminal requirements.

### P2 — Latest predicate is incorrectly treated as an already-settled revision boundary

**Location:** `linux-full-integration.py:850–860`.

For latest progression, `upper` is `dev.latest.wait.end`; R2 demands both `failed:false` at that point and the matching successful revision's end no later than that point. The original predicate only waits for active-version equality. In `overlay/packages/e2e/integration/dev.test.ts:293–302`, `dev.latest.wait.end` is emitted before `await running.settled()` and the subsequent failure assertion.

The source explicitly permits installation before retirement completion. `overlay/apps/loom/src/tooling/dev/development.ts:130–143` publishes `active.installed` in the activation callback while `server.replace()` remains awaited. `apps/loom/src/tooling/dev/server.ts:89–107` changes current runtime and starts asynchronous `previous.stop()`, invokes publication, then awaits retirement. Only afterward can admission end and coordinator success/end occur (`overlay/.../coordinator.ts:59–67`). A legal sequence is install, passing poll, wait end, admission end, revision success/end, settled return. R2 rejects that fully observed successful sequence. A previous failure may also remain visible until coordinator success clears it; predicate equality itself promises neither settlement nor cleared failure.

**Consequence:** Valid latest-generation evidence can be falsely incomplete even when the unchanged test passes, causing the same supervisor failure described above. This is not evidence that either native CI red had this cause.

**Required correction:** Keep predicate observation and subsequent revision settlement separate. Correlate the unique same-identity/version installation before the passing poll, then validate its terminal outcome against a justified later boundary. If a latest-settled fixture marker is needed, make that a separately scoped design/overlay revision after the unchanged settled await. Do not interpret `finally` as success or remove the required successful terminal/admission evidence.

## R1 response dispositions

1. **Reporter framing: addressed at source level.** Lines 925–990 recognize raw `::group::`/`::endgroup::`, ANSI-stripped plain failure headers, nested groups, exact tasks and top-level summaries. Successful dependency-build recognition requires group closure and cache evidence. Ambiguous or absent framing stays unavailable. This review did not execute the parser or verify actual Linux/Turbo framing or cache behavior.
2. **Reconstruction expansion/bounds: addressed at source level.** Lines 608–696 use compact output and pair-aware prewrite line/file/aggregate accounting, including missing-cost/truncation handling and explicit incomplete prefixes. Four one-MiB metadata slots are reserved alongside the eight-MiB trace allowance; 64 trace files plus four metadata files remain below 80. The bounded-detail result fallback at 1065–1083 retains original exit and restoration state. Final nofollow/identity/single-link inventories remain at 1086–1102 and 1341–1353. Ordinary red/partial validated evidence can be published after ownership/restoration gates; unsafe or invalid publication remains withheld. This is not proof against actual disk/FD exhaustion or interrupted writes.
3. **Global-existence lineage: not fully resolved.** R2 materially improves identity/revision ordering, applicable stage prefixes/checks, initial/replacement/unchanged paths, failed/cancelled/unfinished outcomes, and admission/install/end requirements. Candidate/active/expected values are compared within the generation-version hash domain; source-content hash is not equated to version hash. Recovery uses its later settled marker, and unreachable later stages remain incomplete with earlier evidence retained. However, the two findings above invalidate the full-composition completeness claim. Prior response acceptance does not dispose of them.

## Complete-composition checks retained

The source still launches one root `bun run test:integration` workload (39,1251), preserving the root Turbo `^build` then e2e Bun graph. Graph comparison at 1141–1149 permits only the task-local `KELLO_CI_STAGE_DIRECTORY` passthrough addition. No selected cases, separate build, force flag, cache-policy/concurrency change, assertion removal, or original deadline/default-5000/strict-2000 change is introduced. Counts 279/124/two named skips are reconciliation checks at 1271–1273, never defaults. Build acceptance combines reporter execution/cache evidence and actual target-root built-instance lineage, not just source/static markers.

The prior ownership fixes remain composed in the new source: retained PID/start identity and pidfds, immediate root identity before discovery (441–445), root reaping reserved for its `Popen` even when initial stat capture fails (294–300), and emergency retained handles outside capped normal discovery (330–424). Normal 256 and emergency 4096 limits and lower OS FD limits can still force incompleteness. Existing handles are signalled before further acquisition; repeated TERM discovery does not consume all KILL opportunity. Ambiguous/reused PIDs and unknown fast children are not promoted to proven ownership. Journal failures are contained (170–204) and do not disable cleanup. Forced cleanup is not diagnostic acceptance.

The direct root result is retained before validation (1254–1258), and its nonzero remains authoritative (1361–1365). Lifetime audits precede restoration and publication (1288–1295,1343–1347). Unsafe/unknown descendants block restoration/publication. Backup hashes/modes, an applied flag before eight writes, helper absence, source/dist restoration and post-restoration comparisons remain at 1206–1241 and 1296–1327; there is no blanket reset of unrelated work. Late trace inventories and descriptor identity checks remain, including hardlink rejection.

Schema reconstruction only admits bounded finite fields. Raw console remains private rather than entering the proposed uploaded publish directory. Limits remain 4 KiB records, 4096 helper events with reserved truncation handling, one MiB per file, 64 trace files/eight MiB trace aggregate, 80 publish files/12 MiB aggregate, 32 MiB console and 1800 seconds supervisor ceiling. Indexed provisioning PID/start/exit/cleanup evidence remains subject to lifetime attribution and missing-evidence incompleteness. No additional source-level security or API blocker was identified beyond the correctness findings; this is not an assurance of runtime security.

## Historical evidence and limits

The old supervisor R1 cleanup-cap/journal, PID reuse/reaping and late-bounds/hardlink objections, R2 repeated-TERM/KILL-headroom and root-status objections, and R3 source approval were reviewed as separate history. R3 never established a Linux run. Earlier feature findings concerning JSONL self-invalidation, prohibited suppression/privacy validation and real-clock shutdown/cleanup ownership retain their scoped responses: privacy R2 was corrected to the pure predicate; shutdown R2's resolved-session ownership gap was corrected in R3; exact Node 24 type pins have separate receipts. None is inherited as current execution proof.

The CI record remains unchanged: both 142 startup reds; both 0dbb latest-generation/provision reds; three macOS selected nonreproductions with absent passing-reporter stages. The Luna invalid-protocol premise was corrected (`otlp-http-json` is supported and import precedes endpoint validation). No cold-load, flake, cause or peak-89 inference follows.

At 27da, ordinary CI reported 277 pass/two skip/zero fail, browser 14 and ALL 20/500 green; diagnostic/upload were not run and artifacts were empty. At exact 435, PR run 37711969466/job 113099700093 reported 275 pass/two skip/two fail: original `dev.test.ts:234` credential-recovery `active.version !== second` and provisioning's 5000-ms deadline. Push run 37711966045/job 113099690504 reported 276 pass/two skip/one fail at provisioning. Original reports included one dangling child. Both had ALL 20/500 green and later gates skipped. The credential wait is not the later malformed-edit failure-null assertion. Baseline-adoption and pooler-cancellation skips remain unresolved; no provider or full-feature acceptance follows.

No actual Linux reporter/cache, pidfd, descendant containment, restoration, bounded publication or overhead behavior was proven here. Instrumentation/log observation can perturb timing. The existing 30-minute job ceiling can preempt cleanup despite the 1800-second supervisor ceiling. Missing evidence must remain incomplete. The proposed workflow and all temporary surfaces remain unapplied. **R2 is NOT APPROVED for source acceptance until both P2 findings are resolved and the revised complete composition is independently reviewed.**
