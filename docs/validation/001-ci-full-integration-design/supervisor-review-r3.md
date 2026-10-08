# Full-integration supervisor R3 source review

**APPROVED — SOURCE ONLY.** No actionable finding remains in the frozen complete R3 supervisor and its bounded design composition. Both R2 P2 findings are resolved at source. This is one independently owned implementation/API/security review, not a new full-branch roster, Linux execution acceptance, permission to apply the workflow, or shipping approval.

## Scope and method

Reviewed at HEAD `43599002a0da6e5db887c35cf221d018e6975c77`. Read the complete 1395-line `linux-full-integration.py`, the complete old 845-line `../001-ci-linux-design/linux-diagnostic.py`, full new R1/R2 rejection receipts, R1/R2/R3 source/freeze documents, scope, R2/R3 responses and exact patches. Compared archived R1/R2 source with the complete current source through the full textual differences, including the unchanged composition. Read the protocol, design review, manifest, design freeze, authoring script as text, all eight overlay sources, instrumentation patch and proposed workflow; inspected the live graph/source context. Read the old design proposal/review, source receipt, supervisor R1/R2/R3 receipts and responses, and the referenced feature and CI history described below.

Applied the code-review skill's correctness, API, security, reliability and evidence criteria within the explicit leaf-review restrictions. Read applicable instructions; no `.codegraph/` index exists. Only read/hash/git/text inspection occurred. No reviewed Python or application code was imported or executed; no parser/syntax check, compilation, test, lint, typecheck, build, DB/probe/browser/collector, Linux/remote/CI operation, overlay application, commit or push occurred. No delegation or continuation of old backing threads occurred. This receipt is the sole reviewer write. The pre-existing untracked task document was preserved.

## Findings and R2 dispositions

There are **zero new actionable findings**. Exact references below are to frozen R3 `linux-full-integration.py` unless another path is named. Historical severities and consequences remain recorded rather than being erased by approval.

1. **R2 P2, rootless lifecycle filtering — resolved.** Archived R2 lines 708–729 filtered built lifecycle rows through `rootHash`, dropping legitimate `flush()` → ready/run observations outside the root ALS context. R3 lines 712–741 select a root-bearing creation from observed, unambiguous built PIDs and then collect the exact `(pid, helper instance, coordinator)` cohort across all built records. Rootless lifecycle records can therefore join their creation. Duplicate creation or contradictory explicit roots produce identity errors; lines 752 and 830 propagate those errors into every revision and prevent successful-install evidence. The watcher remains tied to the same root/PID/helper instance and precedes creation (737–740). This does not merge coordinator counters from separate module instances or accept an unrelated explicit root. Revision and terminal requirements remain intact.

2. **R2 P2, premature latest settlement boundary — resolved with an explicitly limited claim.** Archived R2 lines 850–860 required successful completion and cleared failure at predicate wait-end, which occurs before the original `running.settled` await. Legal execution can install → pass the poll → emit wait-end → finish retirement/admission → emit success/end. R3 lines 851–860 still require the matching passing poll and wait-end hashes; lines 873–878 separately require the prepared generation version and the unique same-PID successful replacement installed between the phase lower bound and that poll. That installation is already bound to its exact root/coordinator/helper instance/revision through lines 725–834. Its admission completion, non-aborted success and revision end remain mandatory. R3 lines 865–868 now require a unique later same-fixture/root `dev.cleanup.begin`, ordered after wait-end, and bound that same revision's end by this marker.

   The unchanged overlay's outer cleanup-begin marker precedes its final teardown. It can occur after subsequent fixture work, including earlier stop/restart activity. It consequently proves only that the matched earlier replacement revision ended successfully by the observed pre-outer-teardown boundary. It does **not** prove the exact return from `running.settled`, the instant failure became null, or completion of fixture assertions. R3 explicitly separates `predicateObserved`, `revisionSettlementObserved`, `settlementBoundary` and `fixtureAssertionsProved: false` (843–847, 883–884). A later revision cannot substitute merely because it has the same version: it must also have installed before the selected poll, be a replacement, satisfy its own complete successful lifecycle, and be the sole match. Missing/ambiguous boundary or terminal remains incomplete. Recovery retains its stronger explicit `dev.recovery.settled` marker, same active version and `failed: false` (865–871). Original runner outcome remains separate. No marker/design change was needed or made.

## Prior new-supervisor findings

| Prior finding | Disposition in complete R3 | Retained consequence/limit |
| --- | --- | --- |
| R1 P2: downloaded `##[group]` framing used for raw Turbo output | Source-resolved in R2 and retained at 944–1009: raw `::group::`/`::endgroup::`, exact task, nested-aware top-level summary, successful build-group closure and cache observation | Actual Linux reporter framing/cache behavior has not been executed or accepted. Ambiguous/missing summaries cannot become defaults. |
| R1 P2: spaced reconstruction could exceed file/aggregate budgets | Source-resolved in R2 and retained at 608–696, 1084–1121: compact stage/cost pairs, bounds before pair writes, incomplete bounded prefix, four reserved metadata slots, bounded result fallback preserving actual exit/restoration | No raw upload or larger limits. Partial evidence remains partial; final inventories still gate publication. |
| R1 P2: global stage presence could falsely imply complete lineage | Source-resolved by the cumulative R2/R3 changes at 699–893 | Root/identity/revision/order/check/admission/version joins replace global presence. The two R2 defects above were genuine follow-up blockers, now resolved at source. |

Failed, cancelled, unchanged, initial, replacement and unfinished paths remain distinct (744–834). Earlier failed/cancelled prefixes do not owe later success stages. Successful replacements do owe admission completion and matching candidate/active generation versions. Source-content hashes are not generation-version hashes. A `finally` marker alone proves neither predicate success nor successful revision completion. An early credential red makes later latest progression incomplete; it does not erase the useful validated prefix.

## Old supervisor findings and unchanged composition

All old findings were reassessed against the complete current implementation, not accepted solely because the R3 patch leaves those sections unchanged.

| Historical finding | Current source disposition |
| --- | --- |
| Old R1 P2: normal ownership/journal cap can prevent cleanup | Resolved and retained: journal failure is contained (170–204); emergency cleanup is independent (330–424). Overflow/failure still makes evidence incomplete. |
| Old R1 P2: PID reuse, reaping and trace attribution | Resolved within observed-lifetime limits: `(pid,start ticks)`, retained pidfds, pidfd wait and explicit ambiguity (207–424); trace attribution requires observed unambiguous PID. Fast unobserved lifetimes remain unproved. |
| Old R1 P2: late bounds and hardlinks | Resolved and strengthened: post-cleanup inventory, no-follow/single-link descriptor validation, record/file/aggregate bounds before publication, repeated final inventory (537–696, 1105–1121, 1360–1375). |
| Old R2 P2: repeated TERM acquisition consumes KILL headroom | Resolved and retained at 330–424: existing retained handles are signalled before bounded further acquisition; emergency handles survive TERM through KILL/reap and final closure. |
| Old R2 P2: direct `Popen` root status can be stolen | Resolved and retained at 290–300, 441–445: immediate root identity outside capped discovery and exclusion of unreaped numeric root from fallback reaping; `Popen` exclusively owns its root wait/status. |
| Old R3 SOURCE approval | Retained as historical source approval only; it never established a Linux run and does not transfer runtime acceptance to this larger supervisor. |

The 256 normal/4096 emergency bounds remain; a lower OS descriptor limit can still restrict observation/cleanup. Unknown ownership is not zero descendants. Cleanup audits known and direct descendants; forced cleanup/incomplete observation cannot produce complete evidence. Backup hashes/modes, helper absence and source/dist restoration are handled in `finally` only after the ownership audits (1305–1350). Unknown live ownership withholds unsafe restoration. Restoration is scoped, not a bulk reset of unrelated work. Result fallback and publication failures do not replace an already observed nonzero original root outcome (1273–1276, 1380–1384).

## Workload, API, privacy and publication

- The single workload remains `bun run test:integration` (39, 1270), using the original Turbo graph and e2e Bun command. The eight temporary overlays include only the task-local `KELLO_CI_STAGE_DIRECTORY` passthrough addition to Turbo configuration; `^build`, original args and cache policy are retained and checked (1139–1173). No selected-case run, separate build, cache forcing, concurrency/policy change, testcase deadline increase or internal development timeout change was introduced. Original 5000-ms test deadlines, strict 2000-ms diagnostics shutdown and all native/packed/browser/provider gates remain obligations.
- Built-source/cache provenance requires observed reporter/build status plus actual built-helper watcher/coordinator/revision execution (1290–1299). Static dist markers are supporting inventory, not execution proof; source-only observations or replay do not suffice. Counts 279 total / 124 files / two named skips are reconciliation requirements, not assumed results.
- Indexed provisioning observations preserve the eight original invocation lifecycles and join start/spawn/exit/await with observed child identity (896–930). A recorded exit or finally stage is not promoted to a successful assertion. Missing/ambiguous child lifetime evidence stays incomplete.
- Helper/validator schemas admit synthetic finite fields for watcher, revisions, cancellation, lock, admission, root/version and indexed child lifecycle. Raw console stays private. No SQL, payload, credentials, argv or arbitrary error text is published. Schema duplicate-key/field/type validation, source/built identity, sequence and stage/cost pairing remain required (553–696). Finite result/journal metadata is separately bounded and allowlisted (1048–1121).
- Limits remain 4 KiB per record, 4096 events plus truncation, 1 MiB per file, 64 trace files/8 MiB trace aggregate, 80 publication files/12 MiB publication aggregate, and 32 MiB private console. Publication is validated-only, after cleanup, with final inventory and single-link checks before rename. The 1800-second ceiling does not extend the existing 30-minute job; job termination can preempt cleanup.
- The proposed workflow launcher replacement/upload is **unapplied**. Live source/config/workflow preimages are unchanged. `manifest.json`'s `executableSupervisorAuthored: false` is frozen historical design metadata, not a statement that the now-reviewed executable is absent. The proposed workflow postimage is a frozen expected future image, not the current live workflow.

## Earlier feature and CI evidence retained

Read the original feature R1 findings/validator and referenced correction/final receipts. R1 P1 JSONL self-invalidating watcher was addressed by exact canonical owned-file exclusion; R1 P2 suppressions/privacy correction retained descriptor-only validation. Privacy R2's genuine Effect-runner objection was resolved by R3 pure Predicate guards. R1 P2 real-clock shutdown evidence was replaced without relaxing strict bounds; shutdown R2's unexpected-success ownership gap was resolved by registering `.then(own)` before the rejection assertion. Command cleanup-error coverage and exact expanded Node24 dependency corrections have their separate historical receipts. The Node26 diagnosis correction remains: Node26 does define `on`/`once`; mixed generations were the recorded issue. These are retained dispositions, not a fresh production or full-feature revalidation by this review.

Read `001-ci-final-head` and `001-ci-linux-results` receipts plus startup research/matrix/latest history. Both 142 startup reds and both 0dbb latest/provision reds remain genuine. Three macOS selected nonreproductions and absent stages in a passing reporter are not a Linux reproduction or stage proof. The sole Luna invalid-protocol premise was corrected: `otlp-http-json` is supported and import precedes endpoint validation. No cold-load, flake, or peak-89-worker cause is established.

The ordinary 27da result was 277 pass / two skip / zero fail, browser 14 and ALL 20 tasks / 500 tests green, but diagnostic/upload were not run and artifacts were empty. It supplies no Linux diagnostic proof. At exact 435, PR run `37711969466` / job `113099700093` was 275/2/2: original `dev.test.ts:234` credential recovery predicate `active.version !== second`, plus provisioning 5000 ms. Push `37711966045` / job `113099690504` was 276/2/1, provisioning 5000 ms. The credential failure was not the later failure-null assertion. One dangling child was reported; ALL 20/500 were green and later gates skipped. Baseline-adoption and pooler-cancellation skips remain unresolved; provider/full-feature acceptance remains absent. None of these observations establishes the current cause.

## Pin verification

All **29 R3 artifact pins**, **13 design pins**, **six input pins**, **eight overlay hashes**, and **seven live preimage hashes** matched by read-only SHA-256 checks, including a closing recheck. The live helper is absent as both an ordinary path and a symlink, including a dangling symlink. All 18 old R3 freeze entries also matched. Full exact per-path pin sets are retained in the verified `supervisor-freeze-r3.json`, `freeze-r1.json` and `manifest.json`; no pin file was rewritten.

```text
fcb662b252941cc730f1ff1ddfb2b0fc067fb2b2a1e6098d5b508c2cb4033708  linux-full-integration.py
458b7bfaf1eacf0d242d74ca6fc930259a73f2fd46f01fb0d3d13f8fc83be64a  supervisor-freeze-r3.json
af6051635a97b696a823bd3f67266324abaa8cecdecaf911d7f8351a618d8ca5  supervisor-r3.patch
1b250152976b987e5ecc86e43bdad974dae463e2f3f04c4bdfe5087e774abd32  linux-full-integration-r2.py
453f9fcb545b9890f80396af0b82015e4b09b0aad71202344bcf6eaf67ce912d  supervisor-freeze-r2.json
495ef05930dbabe36fbfb903865ce00146b2096f09ab98c9ae32cef195ac9eb4  supervisor-review-r2.md
6b1aa6ecc864373f3cfea04b42c1d7a639225c3c22ce2c7f1366d5472e139939  linux-full-integration-r1.py
45a8c3552347bb811d7a81eaf28b032413541f40b4c85f80c920964143011861  supervisor-freeze-r1.json
6b875755c833171cb29cbc2015969fc5ceed9b7130f6bbc4c197bbfc21445ba1  freeze-r1.json
0b3de92b08bf9b2f052ed5bffd61a3690cd82a3ac4ac93385401b64ccf0f4454  manifest.json
dcb5338b159451c1bcdffa8e14efa1c756107bbdfcc900d6d81701e5e31584f6  ../001-ci-linux-design/linux-diagnostic.py
60786a50329f66a2a65bc7eace1043474319ad6ec4f1aef109875055a4efd0ed  live .github/workflows/ci.yml
```

The actual archived-R2-to-R3 diff body matches `supervisor-r3.patch` after excluding only the two timestamp-bearing diff headers; both bodies hash to `1b9333cd11d5a23f4883ff05833bfa20f24a8591b51efaac909814963865ef93`. The frozen proposed workflow postimage is `e8ff22ffd7e533e392e142e8dd20823e84cbc277e30b041565d51800343b8edb`; it was read as a declared pin, not applied or independently materialized in this review.

## Explicit limits and terminal verdict

Read/hash verification is not execution. Linux reporter/cache behavior, pidfd/subreaper behavior, descendant coverage, observer cost, actual restoration and upload remain **UNVERIFIED**. Observed process identities do not prove fast unobserved lifetimes. Bounded partial traces and source reasoning cannot establish original test assertions, provider behavior or acceptance. The later latest boundary deliberately does not prove exact settled-await return. Existing job timeout can prevent cleanup. No new runtime, workflow application, shipping or production authority is conveyed.

**APPROVED — frozen R3 source composition only; no outstanding actionable source finding.**
