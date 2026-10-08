# Installed dependency metadata contract — independent source review R1

**APPROVED SOURCE DESIGN ONLY.** No blocking implementation/API/security source finding identified in the exact unapplied proposal, under its explicit completed-frozen-install and cooperative no-writer assumption. This approval does not authorize implementation, consumed-freeze mutation, workflow or overlay application, execution, installation, CI, or shipping. It is not cause, workload, cleanup, restoration, lineage, feature or PR acceptance.

Review identity: `round001-ci-dependency-metadata-contract-review-r1` (dispatch client request `001-ci-dependency-metadata-contract-review-r1`). One fresh independent Astra-low review in the assigned thread; no nested agents. Reviewed HEAD: `2b65387ec6293980828274202d10d2471ec00386`. Worktree: `/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility`.

## Exact scope, method and hashes

Read the complete `proposal.md`, `caller-inventory.md`, `proposal.patch` and `freeze-r1.json`; the complete unchanged 1481-line supervisor; its full orchestration, preflight, optional recorder, process ownership, traces, graph, restoration and publication paths; and the historical findings and responses described below. Compared preserved source revisions through their exact text differences and read the overlay protocol, manifest, freezes, authoring/instrumentation text and all eight overlay sources. Read the current and earlier retained receipt/inventory/run/artifact data, pertinent raw log evidence and linked historical outcome/research documents. This was source/text/history/hash/archive-byte inspection, not execution of any inspected source or helper.

All **6 proposal pins and 46 preserved pins** match the proposal freeze, including a closing pre-receipt recheck. The conceptual source hash was independently reproduced by streaming unchanged source slices and the exact added hunk text directly into SHA-256. No patched source file was materialized; no patch command or application-language parser was run.

| Object | Exact SHA-256 |
| --- | --- |
| Proposal freeze | `6b685c0e3f9d227187f8b7879a604e5ddbe59df5906aa755fd0ed932f98cdfb9` |
| Proposal document | `f99cf9cebe6ebb4e9cd8bfe708c0860c01e851776d0b0f349c2f1b78a75b2a77` |
| Exact unapplied patch | `b941dad98c93d2845409300a232e373014225ef348ec96bd6f4a6460b148e1e6` |
| Caller inventory | `68a67963bf1ff3d5f73fe9b53fab81b311867b49363e29c1231764ee7a01fae8` |
| Conceptual proposed supervisor, hash-only composition | `fa1416c9cd419a354eba794b260362e2f06741f04468d908f01cfb7a78c67f5d` |
| Unchanged live supervisor | `e5f42c9bb6cf2d0360d84b974f38ffa8784c6387bb6da8e4679bfe89214097d0` |
| Unchanged consumed supervisor freeze | `bfd0132ab58da2aed3bcf68166902233145a4ebbc9e75425b8ab430598751b21` |
| Unchanged workflow | `a19d52d896594b6982bf29c15d6f2133c7af3aa5285e7ad809385c5b9f0b283a` |
| Current result narrative | `5e4cf9fde9599f22fc12fd3a719e3ef1615c399fdbdf936caa334c05944bc4c8` |
| Current inventory | `ef6dfc15613936b84aa7bf8e26376c9e25bbc1154815f1909c2d434c27e782dd` |
| Refusal R3 source-review receipt | `a6fe0fd3c40fc7be8311ba842d5a5c49c260e7d414170fbe8df0591f047df9e5` |

The unchanged consumed freeze deliberately still describes the live supervisor. Applying this patch alone would not make a deployable frozen artifact: self-hash coordination and preservation of history would require separate authorized work. This is disclosed by the proposal and is not concealed implementation readiness.

## Exact hunk assessment

Line references below use the 72-line `proposal.patch`; unchanged-source references use `docs/validation/001-ci-full-integration-design/linux-full-integration.py` at the live hash above.

**Specificity and API boundary — no finding.** Patch lines 22–26 hard-code `ROOT / "node_modules/turbo/package.json"` and the 1 MiB policy; `installed_turbo_metadata(report)` has no path, limit, dependency-prefix or allow-hardlinks parameter. Lines 67–69 replace exactly the single preflight metadata subread and require an object with exact `name == "turbo"` and `version == "2.11.6"`. Duplicate-key rejection remains `unique_json`. Missing/wrong identity refuses; package self-description is not presented as a signature. The helper returns bytes privately within the diagnostic artifact. No exported Kello API, package export, public typing, application implementation or original test assertion changes.

The apparent moved `return data` at patch lines 19/58 does not change `regular_bytes`: the original function still returns after its original bound check, and the new helper returns after its own checks. The strict descriptor predicate in unchanged source lines 176–192 remains `nlink == 1`. The proposal neither branches that guard on report metadata nor supplies a general exception flag.

**Descriptor and bounded-content contract — no finding within the stated assumption.** Patch lines 25–29 resolve the parent within checkout/node_modules, reject a symlink leaf by lstat, and open read-only with `O_NOFOLLOW | O_NONBLOCK`. The no-follow flag covers a raced leaf symlink; nonblocking open avoids waiting for a FIFO writer before rejecting its type. Descriptor fstat at lines 31–32 requires a regular file, positive link count and size in `[0, MIB]` before reading. Zero links and nonregular descriptors are refused. An empty regular file can satisfy this metadata predicate but cannot satisfy the subsequent required JSON/package identity.

Lines 40–57 compare device, inode, complete mode, link count, size, mtime_ns and ctime_ns across initial pathname lstat, before/middle/after fstat and final pathname lstat. Both reads are through the same open descriptor, bounded at MiB+1, must equal initial size and fit MiB, and must produce the same SHA-256. The final resolved parent string must equal the initial one. Ordinary observable replacement, unlink/link-count drift, truncation/growth, mode/timestamp drift, or differing byte sequences cannot be returned as accepted metadata. Atime exclusion is appropriate for a reader. Accepted bytes remain bounded; the second buffer and at most an extra MiB+1 read are disclosed costs, not changed file or publication budgets.

**Race/lifetime limits — explicit retained limitation, not an immutability proof.** The parent is resolved by pathname twice; it is not held by a pinned directory descriptor or checked for directory inode identity. The component walks, fstats, lstats, reads and hash comparisons are not one atomic snapshot. Temporary retarget-and-restore, adversarial alias writes between observations, timestamp-resolution limitations, and later mutation after the last observation/close are not excluded. `O_NOFOLLOW` protects the final component, not every parent component. The repeated hash is a comparison of two observations, not an independently trusted package digest. No alias locks, external writer exclusion, installation-origin attestation, executable-resolution proof or authentication of immutability exists. Impact: this contract cannot safely be advertised as protection against arbitrary concurrent writers or as lifetime integrity of the later executable. Correction required for this proposal: none, because its descriptor/writer sections expressly limit the claim and require no writes during both read and workload. Any stronger future claim would require a separately reviewed contract; this receipt supplies none.

**Finite refusal causality — no finding.** Patch lines 8–12 change only the conjunction `(stage == "dependency", file_id == "file_35")` to `link_count_not_positive`; every other identity continues to report `link_count_not_one`. This correctly avoids calling nlink=2 a failing predicate when the new metadata reader rejects size or regularity. The finite IDs do not drive the underlying generic reader's acceptance. Zero-link valid-range metadata can identify that predicate. Negative or out-of-range optional integers are rejected by the existing recorder validation rather than serialized as observed detail. A negative size therefore cannot become a successful metadata read, even though its optional detail remains unavailable.

**Optional error ownership and privacy — no finding.** Patch lines 33–39 retain the R3 design: mark the already-established container unavailable and encompass the entire recorder call, including argument assembly/entry, in caller containment; then unconditionally perform the primary `require(valid, "file_type_or_bound")`. The recorder's own range/schema validation and compact serialization bound remain unchanged (live lines 149–173); `observed` is assigned only after the <=1024-byte candidate is validated. There is no replacement fallback-dictionary allocation before the primary refusal. The established report container is created before `check_pins` in main.

Parent/leaf/open/resolve failures may happen before descriptor detail exists. Stability failures after a valid descriptor may also lack an observed refusal record. That is disclosed and acceptable: absence of optional detail does not mean that metadata was accepted. The new fixed reasons are `dependency_parent_invalid`, `dependency_symlink`, `dependency_identity_changed` and `dependency_read_changed`; open/resolve exceptions still enter existing fixed generic error handling. No path, inode, hash, exception text, environment value, SQL or package payload is added to publication. No diagnostic success can override a primary failure. This analysis does not claim optional diagnostics are infallible under process termination or arbitrary interpreter failure.

## Complete strict-reader inventory and unchanged composition

Verified all **14 syntactic `regular_bytes` calls** against the whole source, not only the changed call. The inventory's original line references are accurate:

| Live line | Remaining strict read |
| --- | --- |
| 219 | Regular dist entries: current tree, private backup, restored tree; 128 MiB/file |
| 1102 | Bun configuration, including home/XDG surfaces; 65536 bytes |
| 1128 | Private supervisor journal; 1 MiB |
| 1196 | Each allowed publication file; 1 MiB plus aggregate/count checks |
| 1211 | Static dist JavaScript marker scan; 128 MiB/file, 256 MiB total |
| 1223 | Fixed preflight wrapper, all remaining indirect callers |
| 1316 | Existing live source preimages; 1 MiB |
| 1321 | Overlay hash validation; 1 MiB |
| 1332 | Private version-command output; 1000 bytes |
| 1349 | Overlay bytes copied into live source; 1 MiB |
| 1350 | Applied source hash verification; 1 MiB |
| 1369 | Private original integration console; 32 MiB |
| 1416 | Restored source hashes; 1 MiB |
| 1429 | Final source hash inventory; 1 MiB |

The indirect wrapper covers consumed freeze, self, design freeze, 29 artifact pins, six pinned input identities with independently pinned workflow postimage, root/e2e package JSON, original/overlay Turbo configuration, and manifest. Only the old line-1254 installed Turbo subread leaves that wrapper. All other indirect reads remain single-link. `source_path` (202–207), `trace_inventory` (616 onward), the custom descriptor trace reader (687 onward), and publication's own lstat/identity inventories remain strict. Existing tree-manifest symlink entry handling is not a newly admitted regular hardlink. Git/proc reads and existing parsers do not acquire the exception.

The original BASE `43599002a0da6e5db887c35cf221d018e6975c77`, ancestry, pinned input/artifact/self hashes, exact scripts and graph checks remain in `check_pins` (1219–1258). One original root `bun run test:integration` still invokes `turbo run test:integration` and `bun test ./integration`, with `^build`, integration cache=false and the exact trace-only passthrough comparison. No separate build, force, selected retry, timeout relaxation, environment expansion or cache rewrite is proposed. All eight temporary overlays, including `turbo.json` task passthrough, are preserved by exact hashes.

Unchanged downstream obligations remain substantive: executed built/source/target-root/coordinator/revision lineage and indexed provisioning child evidence, not a static marker alone; 279/124/2 as reconciliation expectations rather than defaults; actual original root exit authoritative; unknown counts null; `(pid,starttick)` lifetime/pidfd ownership; Popen-only root reaping; retained escalation/reaping headroom; telemetry failures unable to defeat cleanup; and unknown/live ownership blocking restoration, dependent work and publication.

Capacity remains 256 normal plus 4096 emergency and direct root, with OS descriptor limits and unseen fast children unresolved limitations. All final owned-file single-link/descriptor-identity/late-bound gates stay intact. Limits remain 4 KiB records, 4096 events, 1 MiB/file, 64 traces/8 MiB, 80 publication files/12 MiB, private console 32 MiB, receipt 1 MiB and optional refusal 1024 bytes. The 30-minute job can preempt cleanup; this proposal adds no time. None of these source obligations has become new runtime evidence.

## Full-history findings and response dispositions

The full original findings and responses were read; the following dispositions preserve their chronology and rejected/cancelled status. Historical approval is not inherited by the metadata adaptation: its exact changed and unchanged composition was reviewed above.

1. **Earlier selected diagnostic, R1 P2 capacity/journal cleanup obstruction.** `001-ci-linux-design/supervisor-review-r1.md` rejected cleanup tied to capped discovery or successful journal output. Responses R2 separated emergency cleanup and contained telemetry; R3 retained that design. Disposition: source correction remains present in current ownership/journal paths; untouched by this patch. Full-suite capacity and Linux behavior remain unproved.
2. **Earlier R1 P2 PID reuse, reaping and attribution.** R2 accepted lifetime keys, fresh ancestry verification, pidfd signaling/adopted-child reaping and ambiguous-PID refusal. Disposition: current lifetime ownership still required; numeric PID alone never proves attribution, and fast unobserved births remain unknown.
3. **Earlier R1 P2 late trace bounds and hardlinks.** R2 accepted post-cleanup inventories, descriptor/link/size checks, cumulative bounds and repeated private/publication inventories. Disposition: metadata-specific relaxation does not reach traces, backups, dist, restoration or publication. All strict final checks remain. No blanket hardlink waiver is inferred.
4. **Earlier R2 P2 repeated TERM exhausting KILL/reap capacity.** R3 responses retain emergency handles and revisit them before capacity checks. Disposition: corrected source remains, including escalation under later acquisition failures; capacity/OS-FD limits remain. This review did not execute Linux cleanup.
5. **Earlier R2 P2 direct-root Popen status theft.** R3 acquires root lifetime before journaling/capped discovery and preserves unreaped root fallback while leaving root wait ownership to Popen. Disposition: source correction preserved, no runtime acceptance. Old R3 was source-only and its selected-case orchestration never authorized the full-suite adaptation.
6. **Full-integration design R1.** `001-ci-full-integration-design/review-r1.md` approved exact design/overlays only, with resource/observer/partial-prefix/lineage/exit/restoration/privacy limits. Disposition: preserved. Authoring text, source scope, protocol and eight overlays still preserve native APIs/assertions/deadlines. This is not executable or Linux acceptance inherited from design approval.
7. **Full supervisor R1 P2 raw Turbo framing and dependency-build proof.** R1 rejected rendered `##[group]` assumptions and nonterminal build attribution. Responses R2/source use raw `::group::`, nested-depth handling, exact task bodies and successful closed build group/cache evidence. Disposition: preserved in reporter/build checks; current metadata read cannot substitute for those runtime observations.
8. **Full supervisor R1 P2 reconstruction losing bounded partial publication.** R2 introduced compact stage/cost pairs, prewrite per-file/aggregate checks, bounded prefix retention and receipt headroom/fallback. Disposition: preserved, including no orphan stage publication and no upload of raw console. New metadata buffers do not enlarge publication allowances.
9. **Full supervisor R1 P2 incomplete path-sensitive lineage.** R2 added lifecycle, prerequisite/check, version, cancellation and initial/replacement/unchanged path joins, and distinguished predicate from finally markers. Disposition: source correction retained with R3 refinements below; no global stage-presence shortcut restored.
10. **Full supervisor R2 P2 rootless lifecycle filtering.** R3 responses/source anchor exact target-root coordinator creation to built PID/instance/coordinator, include legitimate rootless lifecycle rows within that identity, and reject explicit conflicting roots. Disposition: preserved; source-only correction, not executed lineage proof.
11. **Full supervisor R2 P2 premature latest terminal predicate.** R3 separates predicate observation from successful same-revision admission/settlement by the later boundary before fixture cleanup. Disposition: preserved. `finally` is not success; initial/replacement/failed/cancelled remain distinct; no await-return or fixture assertion proof is claimed (`fixtureAssertionsProved` remains false).
12. **Checkout-history R1 P2 expected-workflow hash mismatch.** The depth-zero checkout proposal changed live workflow bytes while retaining an incompatible expected hash. R2 response/dispatch archived the old source and corrected only the expected workflow postimage. Disposition: corrected source-only receipt retained; no base/script/graph guard was removed. At `2ac`, generic `git_read_failed` was observed, while attribution to first `git show BASE` was inferred. This review does not convert that inference into direct evidence.
13. **ff45799 refusal R1 cancellation.** Read the cancelled receipt and dispatch records. The missing/ENOENT intended receipt and interim commentary are not a terminal verdict; cancellation cause is unknown. Disposition: remains cancelled, neither approved nor silently superseded with retroactive approval.
14. **Refusal R2 P2 optional argument assembly/entry outside containment.** Read full R2 and responses R3. Internal recorder catch alone could not preserve the primary refusal if call assembly/entry failed. Disposition: R3 wraps the whole optional call, and the new helper follows that same correction at patch lines 34–38.
15. **Refusal R2 P2 fallback allocation leaving `not_observed`.** R3 reuses the established container for unavailable before optional work instead of allocating a replacement fallback dictionary. Disposition: preserved in generic and new reader; observed detail still requires complete validation/serialization. The R3 receipt at hash `a6fe0f…df9e5` remains source-only. Rejected source `8c935e5fdaf14a3a56e123583d09599de1d595998e5ef12ec0c360ec0f7f6d0a`, rejected freeze `e9952284824ccbcbcffef486112d8999ad37e2a9b4bdcc185c446bf9ed34a4d7`, both identical R2 receipt copies and the old eight-pin freeze remain byte-exact, not rewritten as approved.

Earlier feature-response context carried by these reviews also remains scoped: exact owned-output forwarding addressed JSONL self-invalidation; prohibited suppressions and the subsequent Effect-runner privacy objection received their recorded corrections; strict real-clock shutdown thresholds and the R2 unexpected-success cleanup leak received their recorded R3 correction; command cleanup-error coverage and Node-type pin scope retain their earlier dispositions. No finding in this metadata proposal revises those historical source results or promotes them to fresh full-feature CI acceptance.

## Retained observations and unresolved causes

Current push `37723652120` / job `113136763319` and PR `37723655151` / job `113136773621` both record dependency/file_35, regular=true, nlink=2, size=753, bound=1048576, failed=[link_count_not_one]. Both had ALL20 / 89 files / 500 unit tests plus restore-build 8 green before preflight exit 1. These are direct metadata-refusal observations, not proof of how the hardlink was created or of any earlier run's dependency metadata.

Verified the current ZIP bytes against their recorded digests and inspected their entries. Each contains only `result.json` (595 bytes) and `supervisor.jsonl` (133 bytes). Archive-member hashes match the retained raw files:

| Evidence | SHA-256 |
| --- | --- |
| Push ZIP | `8fa604c03a7794ec9224976b8ae84c7360c4c5fb84dd590e2c82a16b20f593b1` |
| PR ZIP | `98ff8fa8c25501c431759a6574cf79be5e11f362a271009995c4065908e37b09` |
| Both result files | `d74a9769cdbb5136a003dc72091b5b82b2a298dc68ff88da78e8b007fbbb85c7` |
| Push journal | `857b522abe3e56760b257b8f6d8196ced05acfc1fc555700ee47509c06ea3f12` |
| PR journal | `bdcca309ca6e846b1d40a602cf537170aa7f1d154ef92c93fc3754db3b27db6e` |

`originalExit`, workload, lineage and provisioning remain null; before/after maps are empty. `restored:true` describes preflight with no application, not exercised restoration. Empty direct audit/count zero is preflight-only, not descendant-cleanup acceptance. The original workload was **NOT RUN** in both current diagnostic attempts.

At ff45799, both `37720331784` and `37720335759` retained 422-byte result/133-byte journal evidence and only generic `file_type_or_bound`. No path/predicate was observed there. The hardlink hypothesis was unproved then and remains retrospectively unproved for those runs. The current precise metadata observation does not authenticate install origin, explain the original credential recovery/provisioning failures or establish a causal fix.

Earlier history remains intact:

- Both `142` startup attempts failed at the native 5000 ms deadline (499 pass/1 fail, 19/20 tasks). Three selected local macOS nonreproductions omitted stage deltas; passing-log suppression is a possible reporter mechanism, not proof of resolved historical reporter configuration. The research interpretation of invalid protocol was corrected: the supported `otlp-http-json` path imports before endpoint validation. Cold loading, scheduling and other explanations remain hypotheses. 89 files is not a measured peak worker count.
- The `0dbb` Vitest cap of two/serial policy is separate from cause; both integration reds remain. No causal attribution follows from a cap adjustment or local green.
- `27da659c` ordinary CI reported 277 pass/2 named skips/0 fail, ALL20/500 and browser14. Failure-only diagnostic/upload never ran, with empty artifact inventories. That green is head-specific and does not validate the supervisor. Baseline adoption and pooler cancellation/lock-release skips remain coverage gaps.
- Original BASE435 PR `37711969466` / job `113099700093` remains 275 pass/2 skip/2 fail: credential recovery at original `dev.test.ts:234`, `active.version !== second`, after restoring credentials, and provisioning timeout 5000.43 ms. Push `37711966045` / job `113099690504` remains 276/2/1 with provisioning timeout 5000.32 ms. Both retained one dangling process. The recovery failure is not the later latest-generation wait or subsequent failure-null assertion. Later gates were skipped. Neither these outcomes nor local nonreproduction provides synthetic lineage/restoration/descendant evidence.

## Terminal authority and limits

Severity disposition: **no new blocking finding** in this exact source proposal; the concurrency/lifetime limitations above are explicit conditions of its limited contract, not resolved security guarantees. Required correction before source-design approval: none. All prior P2 rejections and their source-only responses remain as recorded; cancellation remains cancellation.

Only this review receipt was written by this reviewer. No imports, source parsing/syntax execution, tests, builds, checkers, DB/probes, installed-dependency inspection, installation/link writes, live overlays/workflow changes, freeze mutation, runtime, remote operation, commit/push/CI or nested review occurred. No proposed/helper code was executed. Read-only shell text/hash/diff/archive inspection does not establish runtime correctness. Concurrent parent-owned dispatch metadata was left untouched.

**Parent handoff requirement:** consume this entire terminal receipt and independently rehash it before further coordination; its final SHA-256 is returned outside the file. Approval is limited to the exact proposal/freeze/conceptual-source hashes above. Implementation remains unapplied and separately unauthorized. Original causes, full workload/lineage/restoration/descendant acceptance, full feature and PR4 decided-CI acceptance remain pending.
