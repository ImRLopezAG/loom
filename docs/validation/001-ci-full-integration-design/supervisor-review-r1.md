# Independent executable-source review R1

**NOTAPPROVED — three P2 findings.** This is a source/API/security review, not Linux execution evidence, authorization to run, or a causal fix for either original failure.

Reviewed HEAD `43599002a0da6e5db887c35cf221d018e6975c77`, complete 1,210-line `linux-full-integration.py`, SHA-256 `6b1aa6ecc864373f3cfea04b42c1d7a639225c3c22ce2c7f1366d5472e139939`. Line references below refer to this frozen source unless another file is named. Only this receipt was written. No target import, syntax check, parser execution, build, test, lint, type check, DB/probe/browser/collector/CI work, overlay application, workflow edit, shipping, or delegation occurred. Read/hash/git operations and read-only upstream source inspection supplied the evidence.

## Findings

### P2-1 — Successful Turbo task framing is parsed in the downloaded-log format, not the captured process format

**Location:** `linux-full-integration.py:805`, `:812`, `:820`–`:825`; consequences at `:1107`–`:1114`.

`task_body` recognizes a plain task name or `##[group]` followed by the name. Its next-task boundary similarly strips only `##[group]`. However, the supervisor captures Turbo's process bytes directly at lines 471–477, before GitHub interprets workflow commands. Turbo 2.11.6's GitHub vendor emits **`::group::{group_name}`** and **`::endgroup::`** for successful groups, and a plain ANSI-colored name for failed groups. The `##[group]` spelling seen in retained downloaded GitHub logs is not the emitted GitHub process framing.

Evidence: pinned upstream [Turbo 2.11.6 vendor definitions, lines 263–283](https://github.com/vercel/turborepo/blob/v2.11.6/crates/turborepo-ci/src/vendors.rs#L263-L283), and [group completion, lines 145–177](https://github.com/vercel/turborepo/blob/v2.11.6/crates/turborepo-log/src/grouping.rs#L145-L177). This was a source comparison; no parser or Turbo command was executed.

**Consequence:** the successful `kello:build` group is unavailable to this parser, so `dependencyBuild.observed` remains false. A successful integration group likewise loses its full summary; a failed plain integration header can be recognized while the successful prerequisite build is still missed. Thus a valid run cannot establish the required provenance/completeness through these successful raw groups. Recognizing nested Bun file groups in downloaded logs does not cure the outer raw-header mismatch.

**Required fix:** recognize the actual raw GitHub group commands and plain colored failure headers, delimit exact Turbo tasks without treating nested Bun file groups as task boundaries, and retain explicit ambiguous/unavailable states. Establish successful dependency-build terminal evidence as required by the protocol, not merely a cache hit/miss announcement. Keep the original native `cache:false` reporter text (`cache bypass, force executing …`); it is not an added force flag. Do not introduce expected-count defaults or select the last nested summary. Source repair must receive fresh review; execution remains separately authorized.

### P2-2 — Reconstruction can make an in-bound trace unpublishable and discard all safe partial evidence

**Location:** `linux-full-integration.py:669`–`:676`, `:919`–`:927`, `:1182`–`:1190`; helper `overlay/apps/loom/src/tooling/dev/ci-trace.ts:58`–`:73`.

The helper emits compact `JSON.stringify` records and reserves 8,192 bytes before its 1 MiB file limit. The supervisor reconstructs every validated record using Python's default, spaced `json.dumps(record, sort_keys=True)`. Across thousands of ordinary/cost records, the added separator spaces exceed that reserve. A valid source file near its limit, including a valid truncated prefix, can therefore reconstruct to more than 1 MiB. The writer checks line size and the aggregate 8 MiB budget but never the reconstructed file's 1 MiB budget.

**Consequence:** `publication_inventory` later rejects the oversized reconstructed file and the single atomic publication fails. All other safe traces and `result.json` are withheld, even after proven clean ownership and restoration. Aggregate expansion can also throw during reconstruction. This correctly refuses an oversized upload, but unnecessarily loses precisely the ordinary-red/truncated-prefix evidence the protocol says to preserve. This is a static bound counterexample, not a claim that a historical run reached the limit.

**Required fix:** reconstruct compactly and enforce per-file, per-line, and aggregate output budgets before writing; when necessary, retain a bounded validated prefix with explicit incompleteness. Account for stage/cost pairing. Ensure a safe bounded prefix and synthetic result can still publish after clean ownership. Do not increase protocol limits, upload raw input, or fabricate missing records. The final no-follow/link/identity checks must remain.

### P2-3 — “Complete” built lineage does not require the revision/admission lifecycle it claims to reconcile

**Location:** `linux-full-integration.py:708`–`:728`, `:735`–`:747`, `:1107`–`:1114`.

Revision rows report `ended`, but a false value never adds an incomplete reason. No requirement checks `revision.check` or replacement `admission.begin/install/end`. The three required pipeline stages can come from different revisions of the coordinator; an initial installation can satisfy the global `active.installed` existence check even when the replacement admission chain is missing. Fixture checks are sets of stage names, not a join from recovery/latest progression to the corresponding built revision and generation-version evidence. In particular, `dev.latest.wait.end` is emitted in `finally` and is not proof of successful settlement.

**Consequence:** a syntactically valid trace set with a target root, coordinator, revision beginnings, global update/candidate/active stage presence and fixture-stage sets can return `lineage.complete=true` while containing no replacement admission evidence or an unclosed revision. `buildProvenanceObserved` can then certify weaker evidence than the protocol's target-root/coordinator/revision/admission contract. P2-1 currently masks this on ordinary successful raw groups; fixing framing alone would expose it. The original nonzero exit is still preserved, so this is false diagnostic completeness, not a demonstrated red-to-green conversion.

**Required fix:** define and check path-sensitive lifecycle requirements joined by the target root, built helper identity, coordinator and revision, including ordered replacement admission and same-domain candidate/active version evidence. Distinguish initial installation from replacement, success from failure/cancellation, and incomplete observation from a causal diagnosis. Report missing terminal/admission evidence explicitly and keep the valid prefix. Do not require a failed/cancelled revision to succeed or require later latest-generation stages after the original credential-recovery failure. Do not equate source-content hashes with generation-version hashes, or infer success from a `finally` marker.

## Frozen scope and integrity evidence

All checks matched at closing:

- Supervisor freeze: 17 artifact pins plus the executable's separate self pin; freeze SHA-256 `45a8c3552347bb811d7a81eaf28b032413541f40b4c85f80c920964143011861`.
- Design freeze: all 13 artifact pins and six input pins; all eight complete overlay postimages; all seven live existing-file preimages; new live helper absent, including no symlink.
- The baseline workflow matches `git show 43599002:.github/workflows/ci.yml` and SHA-256 `60786a50329f66a2a65bc7eace1043474319ad6ec4f1aef109875055a4efd0ed`. The proposed replacement constructed in memory matches the independently frozen future postimage `e8ff22ffd7e533e392e142e8dd20823e84cbc277e30b041565d51800343b8edb`. No local workflow mutation occurred.
- Parsed original/overlay Turbo objects are equal after removing only the added task-local `KELLO_CI_STAGE_DIRECTORY` pass-through name. No separate build, selected rerun, graph filter, force flag, concurrency, policy, or deadline alteration is introduced.
- All 18 old R3 artifact pins match; the full 845-line old executable is SHA-256 `dcb5338b159451c1bcdffa8e14efa1c756107bbdfcc900d6d81701e5e31584f6`. All five final-head evidence pins also match.

Read in full: the new executable, published source scope, source receipt, supervisor/design freezes, protocol, design review, manifest, eight overlays, authoring source, instrumentation patch and workflow proposal; the six graph/config inputs; old proposal/design review, supervisor source receipt, supervisor reviews R1/R2/R3, responses R2/R3, and entire old R3 executable. Reviewed final-head/results receipts and referenced startup/remediation/research/review history, including retained failure locations and summaries. Prior design/source approvals were treated as evidence to challenge, not inherited executable acceptance.

## Previous findings and retained ownership protections

| Prior finding | New composition assessment |
| --- | --- |
| Old supervisor R1: cleanup cap/journal failure prevents cleanup | Retained. Journal failures are contained at 170–204; cleanup has a separate emergency path at 330–424, independent of normal discovery/journal capacity. |
| R1: PID reuse and reaping attribution | Retained. Start-tick identities, fresh ancestry verification and pidfds at 229–319 distinguish lifetimes. Trace PID attribution requires an unambiguous observed lifetime. Unobserved fast children remain unknown, not attributed by PID alone. |
| R1: late global bounds and hardlinks | Retained rejection protections at 537–550, 625–680, 919–935 and 1175–1187. Final inventories, descriptor identity, regular-file and single-link checks remain. P2-2 concerns safe evidence availability, not permission to publish oversized/hardlinked data. |
| R2: repeated TERM acquisition exhausts KILL headroom | Retained. Emergency handles persist across phases, existing handles are signaled before acquisition limits, and closes occur after cleanup. The 4,096 emergency acquisition/FD budget is not an OS guarantee; lower FD limits remain an explicit incomplete path, alongside the 256 normal-lifetime cap and root handle. |
| R2: Popen root status stolen by generic reaper | Retained. Immediate root lifetime registration at 441–445 precedes journal/discovery; 294–300 excludes the root from generic reaping using identity and the live numeric-root guard. Popen owns its wait status. Main records the returned direct-root exit at 1088–1089 before trace/report validators. |

The independent cleanup/final audits block restoration and publication when ownership is unknown. Forced cleanup is incomplete even if final observed counts reach zero. Applied state is set before overlay writes; source bytes/modes and hash-verified dist backup are restored only after the ownership gates. Unexpected tracked drift is recorded and fails, not bulk-reset. Nonzero original exit remains nonzero through later validation failures; unavailable exit cannot become green. These are source properties, not observed Linux cleanup/restoration results or guarantees under SIGKILL/job cancellation.

The earlier feature R1 findings remain accounted for: JSONL self-invalidation, prohibited suppression/validation patterns, and the real-clock shutdown oracle had scoped remediations and subsequent review. The R2 privacy objection to the replacement validation approach was followed by the accepted pure-predicate correction; shutdown R2's unexpectedly successful-session cleanup gap was addressed by ownership on resolution and reviewed in R3. Cleanup-only and simultaneous-failure behavior and the explicitly scoped Node type update retain their historical receipts. No production implementation was changed or revalidated here, and none of those approvals cures these new supervisor findings.

## Original experiment and unresolved historical evidence

The proposed workload remains exactly one original root `bun run test:integration` graph: root Turbo, original `^build`, then e2e Bun. Source/static-marker/cache-log evidence alone does not prove that this graph produced or restored the executed target built helper. Runtime identity/root/coordinator/revision evidence and a successful dependency task must actually be observed. Counts 279/124/two named skips are reconciliation expectations, never defaults or a substitute for runner evidence.

Both 435 failures remain unresolved. PR run 37711969466/job113099700093 reported 275 pass / 2 skip / 2 fail; push 37711966045/job113099690504 reported 276 / 2 / 1. Both had passed ALL20 and 500 units. Both provisioning failures retained the original eight-child fixture and default 5,000 ms deadline, with one reported dangling process. The PR development failure is original `dev.test.ts:234`, `active?.version !== second` after restored credentials and the expanded rewrite; it is not the later malformed-edit `failure === null` wait. The development case's 90,000 ms limit, internal deadlines and production strict 2,000 ms semantics remain unchanged.

Both 0dbb reds and both 142 startup reds remain historical unresolved evidence. Three macOS selected-case nonreproductions do not reproduce Linux or supply missing stage deltas: passing reporter output suppressed those stages. The sole Luna research's invalid-protocol explanation was corrected (supported `otlp-http-json`, imports preceding endpoint validation); there is no established cold-loader, flake, resource-policy fix or peak-89-worker conclusion.

27da's two ordinary CI greens (277 pass / 2 skip / 0 fail, browser 14, root ALL20/500) do not transfer to 435. Failure-only diagnostics and upload **NEVER RAN**; empty artifact results and ordinary teardown prove no supervisor descendant/restoration behavior. The baseline-adoption and pooler-cancellation skips remain unresolved coverage. Original ALL20/native/packed/browser/provider gates and their existing success dependencies are preserved by the proposal; stages suppressed by an original red remain unaccepted, not waived.

## Privacy, limits and disposition

Schema reconstruction is finite and rejects arbitrary fields; published records use finite labels, integers, UUIDs and hashes rather than paths, arguments, credentials, SQL, payloads or error text. Raw merged console stays private and is teed to the original GitHub console, not placed in `publish/`. The proposal retains 4 KiB records, 4,096 helper events plus reserved truncation handling, 1 MiB files, 64 trace files/8 MiB trace aggregate, 32 MiB workload console, 80 publication files/12 MiB aggregate, 1,800-second supervisor ceiling and existing two-second cleanup phases. The existing 30-minute job ceiling may preempt any final receipt. Bounds and privacy must not be relaxed to resolve these findings.

Source review cannot establish actual Bun/Turbo reporter behavior in this invocation, Linux pidfd/reaping correctness, observer timing cost, build-cache acceptance, provider results, successful restoration, or upload. No original red was reproduced or fixed. The unrelated untracked `docs/tasks/001-ci-full-integration-design.md` was preserved; tracked diff remained empty. This receipt is the sole owned mutation. Correct the three findings in a separately authorized source revision and obtain a fresh frozen-source review before any remote execution decision.
