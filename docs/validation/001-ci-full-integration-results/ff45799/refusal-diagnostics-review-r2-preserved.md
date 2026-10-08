# Refusal diagnostics R2 — independent implementation/API/security source review

**NOT APPROVED. One outstanding P2: optional allocation failure can replace the primary refusal, and the initial fallback allocation can leave an inaccurate `not_observed` status.** This verdict applies only to the frozen bounded refusal-diagnostics composition below. It is not a production diagnosis, runtime acceptance, or shipping decision.

Reviewer ownership: `001-ci-refusal-diagnostics-source-review-r2`, Astra low, one independent replacement reviewer. The prior refusal R1 was cancelled with result available, no pending children and terminal status cancelled; its cause is unknown. I read the cancellation receipt and original dispatch receipt. `refusal-diagnostics-review-r1.md` is absent. Its interim commentary is not a verdict or approval. This is a fresh review, not continuation of its backing storage.

## Scope, method, and exact bytes

Reviewed at HEAD `ff45799a74da37a224657f80e4e0b904d7cf0427`; read-only merge-base inspection returned unchanged BASE `43599002a0da6e5db887c35cf221d018e6975c77`. Read supplied worktree instructions and CLAUDE.md; no root AGENTS.md or CodeGraph index exists. Applied ce-code-review and its output guidance as a leaf within the explicit source-only restrictions. No nested reviewer or runtime machinery was used.

Read the complete actual refusal diff, source receipt, refusal freeze, current supervisor, consumed freeze, archive comparison, and surrounding helpers, check_pins, main, ownership, restoration, schema validation, receipt fallback and publication. Read the full task/design protocol and specified old Linux and full-integration R1/R2/R3 reviews/responses, source-scope/source receipts, manifests/freezes, historical correction patches and all eight overlay sources. Read checkout-history reviews/responses/dispatch and result receipts, ff45799 result/inventory and both raw run/artifact/result/journal receipts, plus earlier startup/resource/final-head history receipts. Raw archives/logs were hashed; archive listings and relevant log evidence were inspected. The archived prechange supervisor and consumed freeze compare byte-identically with HEAD versions; the actual current source/freeze diff matches the frozen patch. Reading old corrections does not reapprove unrelated historical implementation.

| Frozen file | Verified SHA-256 |
| --- | --- |
| `docs/validation/001-ci-full-integration-design/linux-full-integration.py` | `8c935e5fdaf14a3a56e123583d09599de1d595998e5ef12ec0c360ec0f7f6d0a` |
| `docs/validation/001-ci-full-integration-design/supervisor-freeze-r3.json` | `e9952284824ccbcbcffef486112d8999ad37e2a9b4bdcc185c446bf9ed34a4d7` |
| `docs/validation/001-ci-full-integration-design/linux-full-integration-before-refusal-diagnostics.py` | `fcb662b252941cc730f1ff1ddfb2b0fc067fb2b2a1e6098d5b508c2cb4033708` |
| `docs/validation/001-ci-full-integration-design/supervisor-freeze-before-refusal-diagnostics.json` | `2beda4f8c99d9e35a818981014d1efba8053ffadc1b490ad1a08488ad6e83aa6` |
| `docs/validation/001-ci-full-integration-results/ff45799/refusal-diagnostics-r1.patch` | `7e073a17c0ed58c114db8760caf9bc901216524eab8378240424b04e212c67eb` |
| `docs/validation/001-ci-full-integration-results/ff45799/refusal-diagnostics-source-r1.md` | `b5d598dcc7c4732a4f80a12c018323b8b7ced86f4095cb4413d189e4a590515a` |
| `docs/validation/001-ci-full-integration-results/ff45799/inventory-r1.json` | `3c30df13e81caf92feffc4d720fedd8c3dd4ded78757947356c6a66570070aa1` |
| `.github/workflows/ci.yml` | `a19d52d896594b6982bf29c15d6f2133c7af3aa5285e7ad809385c5b9f0b283a` |

The refusal freeze itself hashes to `e25c46c26a842610645ae5cdabbfd3f7ddbe7c7f3e92ae7c57faa2e72de6760f`. All 29 original artifact pins, 13 design pins, six BASE input hashes, eight overlay hashes and seven live preimages verified. The new live helper is absent, including as a symlink. All 13 ff45799 inventory entries verified. No approval is implied for unpinned new changes, including the separately modified task document. Consumed freeze changes only the necessary supervisor hash; the workflow postimage guard remains `a19d52...`, with baseline and ancestry checks intact.

## P2 — contain the entire optional invocation and establish a nonallocating fallback

**Location:** `docs/validation/001-ci-full-integration-design/linux-full-integration.py:183-185`, with `:152-153`, `:172-174`, `:1278` and `:1385-1386`.

The failed descriptor predicate is computed first, but `record_preflight_refusal(*refusal, info, limit)` executes before `require(valid, "file_type_or_bound")` and outside caller-side exception containment. The recorder's internal `try` cannot catch an allocation failure during starred argument assembly or function entry before that `try` begins. A recoverable `MemoryError` at that boundary escapes to main's generic exception handler, which records `supervisor_error`; the unchanged primary refusal is never raised. This is an optional diagnostic operation changing the authoritative failure reason, precisely the failure isolation the brief requires.

There is a second hole in the same fallback contract: the first statement inside the recorder allocates a fresh `{"status": "unavailable"}` dictionary. If that allocation fails, its exception is swallowed, but the initial report value remains `{"status": "not_observed"}`. The comment that unavailable was installed before collecting optional detail is not true on that path. The descriptor refusal was observed, yet neither bounded detail nor the required fixed unavailable status is recorded.

**Consequence:** under a recoverable optional allocation failure, the receipt can lose `file_type_or_bound` or falsely retain `not_observed`. The implementation otherwise catches failures while building/serializing detail, but that narrower protection does not cover these boundary allocations. This is a source-derived failure scenario, not an executed reproduction or a claim that total process memory exhaustion can always be survived.

**Concrete correction:** reuse an already allocated status container to establish fixed `unavailable` before fallible optional detail work; enclose the entire optional invocation, including argument preparation, in caller-side exception containment; always proceed to the original `require(valid, "file_type_or_bound")`. Replace the status with observed detail only after validation and bounded serialization succeed. Preserve fixed strings, no exception text, and all existing descriptor checks. Do not weaken the predicate, budgets or refusal order. No fix was made in this review.

## Remaining implementation/API/security assessment

The fixed map covers all wrapped check_pins reads: freeze, supervisor, 13 design files, artifact files, baseline/live inputs, graph inputs, Turbo dependency and manifest. Set comparison found no missing consumed path. Eight fixed stages and 38 file IDs avoid publishing caller paths. Stage/file membership, exact non-boolean integer validation and nonnegative signed-63-bit limits constrain descriptor fields; `regular` is boolean and failed predicates are distinct fixed values. The compact serialized observed record is explicitly bounded to 1024 bytes. No payload, environment or exception text is added. These properties do not cure the P2 invocation/fallback gap.

`regular_bytes` still opens with O_NOFOLLOW, derives type/link/size from fstat on that descriptor, requires regular/single-link/within-bound before reading, reads at most limit+1 and rejects excess. Recording occurs only on the existing aggregate predicate failure, before the same refusal. Source-path, open, fstat, hashing and ancestry failures can lack descriptor detail; this is not complete provenance. In particular, earlier source_path guards may reject before this hook. Guard ordering and hash/baseline/ancestry semantics are unchanged.

The report consumer is the internal result writer. The new field is not passed through the separate strict trace-record schema. `result_receipt` retains `preflightRefusal` in its compact fallback when detail exceeds the receipt limit; the field itself is bounded. Fallback status remains incomplete and cannot turn unknown/nonzero original status into green. Final publication still requires allowed names, regular single-link files, descriptor/lstat identity agreement, per-file/count/aggregate bounds and repeated inventory before atomic publication. The patch introduces no alternate raw console publication or path-based bypass. Optional serialization failure after successfully establishing unavailable is contained. Whole-receipt serialization/publication still has its existing failure limits; this review does not promise publication under arbitrary filesystem or process failure.

`check_pins(report)` remains before source capture, version commands, overlay application and workload. Unknown/live ownership still blocks restoration and dependent work/publication. Original root exit remains separate and authoritative; unknown counts remain null. No public production API, backend, dependency installation, platform behavior, workflow permission or native test behavior changes. One original `bun run test:integration` graph retains `^build`, cache policy and all eight temporary overlays, including Turbo passThroughEnv tracing. No selected retry, separate build or force was introduced. Strict original 5000 ms tests and 2000 ms shutdown remain. Expected 279/124/two-skip counts are validation expectations, never substitute defaults.

## Prior findings and responses — disposition retained

1. **Old Linux R1 ownership-cap/journal:** later source separates emergency cleanup from normal discovery capacity and contains journal failure. Unknown ownership still blocks restoration; logging cannot be required for signaling.
2. **Old Linux R1 PID reuse:** later source uses PID/start-tick lifetimes, pidfds, P_PIDFD adopted-child reaping and ambiguous attribution. Fast unseen lifetimes remain unproved.
3. **Old Linux R1 late bounds/hardlinks:** later source performs final descriptor identity/single-link/size validation, cumulative bounds, private staging and repeated post-cleanup inventory.
4. **Old Linux R2 repeated TERM:** R3 retains emergency handles across TERM/KILL/reap and visits acquired handles before new acquisition caps. KILL/reap headroom must remain.
5. **Old Linux R2 root Popen status theft:** R3 captures root identity immediately and retains unreaped numeric-root fallback; Popen exclusively owns direct-root status. Old R3 was source-only approval, never Linux workload proof.
6. **Full supervisor R1 raw Turbo framing/dependency-build proof:** R2 recognizes raw nested group framing and requires successful dependency-build closure. This is a source correction, not demonstrated cache/reporter/runtime acceptance.
7. **Full supervisor R1 expanded publication losing partial evidence:** R2 uses compact pairs, prewrite budgets, valid bounded prefixes, metadata headroom and compact fallback without widening publication limits.
8. **Full supervisor R1 incomplete path-insensitive lineage:** R2 adds path-sensitive identity/revision/admission/version joins. Its subsequent two R2 rejections remain genuine findings, not retroactive approvals.
9. **Full supervisor R2 rootless lifecycle omission:** R3 anchors rootless lifecycle records through exact root-bearing creation, built PID/helper instance/coordinator and rejects contradictory explicit roots.
10. **Full supervisor R2 premature terminal demand:** R3 distinguishes passing predicate observation from later matched successful same-revision admission/settlement before outer fixture cleanup. Finally is not success. Initial/replacement/failed/cancelled remain distinct. No exact settled-await-return or assertion inference is justified.
11. **Checkout-history R1 postimage mismatch:** R2 updates only the consumed expected workflow hash to actual `a19d52...` and archives the previous freeze. Guards were preserved; approval was source-only. The first git-show attribution remains inference from ordering, whereas generic `git_read_failed` was directly observed.
12. **Refusal-diagnostics R1:** cancelled, no verdict and no review receipt. No inherited approval or finding disposition exists. The P2 above is this replacement review's finding.

Earlier feature history remains separate: canonical owned JSONL forwarding addressed self-invalidation; the Effect-runner privacy objection was corrected with pure Predicate guards; strict shutdown timing retained its oracle and R3 corrected successful-session cleanup; command cleanup-error coverage and the separately scoped Node-type pin remain historical remediation. This bounded review neither reopens nor freshly accepts those phases.

## Runtime history remains red or incomplete

Both 142 startup runs retain original 5000 ms reds. Three local selected passes did not reproduce them and lacked stage deltas; resolved reporter behavior remains uncertain. The protocol research correction is retained. There is no simultaneous-89-worker evidence or established cold-loader/flake explanation.

The 0dbb cap-two/serial resource policy is separate from causality; both development/provisioning reds remain. The 27da ordinary green is 277 pass/two named skips; selected supervisor and upload never ran. Baseline adoption and pooler cancellation/lock-release remain skipped coverage. At 435, PR remains 275 pass/two skip/two fail, including credential recovery `active.version !== second` at original dev.test.ts:234 and provisioning 5000 ms; push remains 276/two/one at provisioning. Later gates remain untouched.

The 2ac runs `37718616829` and `37718611038` failed preflight `git_read_failed`; depth-zero checkout addressed history availability at source without weakening guards. In exact ff45799 runs `37720331784` / job `113126269069` and `37720335759` / job `113126282020`, full-history checkout actually occurred, ALL20/500-unit and restore-build 8/8 were green, but supervisor exited 1 with `file_type_or_bound`. Both ZIPs contain only result.json 422 bytes and supervisor.jsonl 133 bytes. Original exit, workload, lineage and provisioning are null; before/after hashes are empty. `restored:true` is the no-application path; the empty direct-child audit is preflight-only. Neither proves exercised restoration, descendants or the workload.

The aggregate regular/link-count/size predicate identifies neither failed path nor failed subpredicate in those existing receipts. Installed Turbo is a candidate; Bun Linux hardlink documentation does not establish pinned Bun 1.4.2 inode evidence. No cause is established and this patch is not a production fix.

## Explicit source-only limits and terminal handback

Linux pidfd/subreaper recovery, workload ownership, restoration and full trace publication remain unexercised. Capacity is 256 normal plus 4096 emergency handles/attempts and the direct root; lower OS FD limits and fast unseen children can yield incomplete evidence. Journal failure must not defeat cleanup; unknown/live ownership must continue to block restoration/dependent work/publication. Sampling and async ancestry do not prove exhaustive births or causality; source and generation-version hashes remain different domains.

Bounds remain 4 KiB/record, 4096 events with truncation reserve, 1 MiB/file, 64 traces/8 MiB aggregate, 80 publication files/12 MiB aggregate, 32 MiB private console, 1 MiB receipt and at most 1024 bytes of new optional observed detail. Observer overhead, omitted timing costs, non-fsync trace durability, truncation and missing evidence remain limitations. The 30-minute job can preempt cleanup; the 1800-second supervisor ceiling does not extend it. Runner loss, cancellation, filesystem failure and irrecoverable resource exhaustion can prevent publication.

Only source/document/history/data reads, local Git/hash/byte comparisons, archive directory inspection and this receipt write occurred. No source changes, reviewed-code import or syntax execution, test/build/lint/typecheck, DB/probe/install, overlay/workflow change, remote CI, commit/push or delegation occurred. All other edits were preserved. No relevant memory facts were used.

**Terminal verdict: NOT APPROVED — one P2 requiring a bounded source correction and fresh review. Sole reviewer-written file: this receipt. No shipping or runtime acceptance.**
