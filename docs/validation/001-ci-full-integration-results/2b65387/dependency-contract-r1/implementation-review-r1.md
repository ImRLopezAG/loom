# Installed Turbo metadata contract: implementation review R1

**APPROVED SOURCE ONLY.** No new blocking implementation, API, or security finding in the exact materialized composition identified below. No correction is required for this bounded source approval. This is one independent full-history review by Astra-low, without nested workers. It does not inherit implementation approval from the design receipt and does not grant runtime, Linux, provider, feature, or PR4 acceptance.

The approved contract assumes a completed frozen installation and cooperative absence of writers during the metadata read. It permits positive link count only for the fixed installed Turbo metadata file. It does not establish adversarial concurrency protection, installation origin, lifetime immutability, or the identity of a future executable. Removing that assumption would require a different design and review.

## Authority and exact bytes

Review worktree: `/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility`. Observed HEAD: `2b65387ec6293980828274202d10d2471ec00386`; preserved BASE: `43599002a0da6e5db887c35cf221d018e6975c77`. All source line references below are to the current `docs/validation/001-ci-full-integration-design/linux-full-integration.py` unless another file is named.

| Artifact | SHA-256 |
| --- | --- |
| Current supervisor | `fa1416c9cd419a354eba794b260362e2f06741f04468d908f01cfb7a78c67f5d` |
| Current consumed supervisor-freeze-r3.json | `c08eb2c75e06b32efc65ae44321a2cc93c1aed6a0adffa82340ef55d65cede75` |
| implementation-freeze-r1.json, 58 pins | `341c2e507da200559b54aa54d72eccc1ecf4e83774e0fc9d8d4102556fffaa21` |
| implementation-r1.patch | `e22cc09e332ac0f5f20cc7ace7b62f5d408493ad65c2dd622b36c136ddc05d72` |
| implementation-response-r1.md | `4fbc1fd3c7b54e11cbba7e7f4842ad1fd86ec0c51dee587586c4b70ce9760fba` |
| Archived before-dependency-contract supervisor | `e5f42c9bb6cf2d0360d84b974f38ffa8784c6387bb6da8e4679bfe89214097d0` |
| Archived before-dependency-contract consumed freeze | `bfd0132ab58da2aed3bcf68166902233145a4ebbc9e75425b8ab430598751b21` |
| Unchanged .github/workflows/ci.yml | `a19d52d896594b6982bf29c15d6f2133c7af3aa5285e7ad809385c5b9f0b283a` |
| proposal.md | `f99cf9cebe6ebb4e9cd8bfe708c0860c01e851776d0b0f349c2f1b78a75b2a77` |
| proposal.patch | `b941dad98c93d2845409300a232e373014225ef348ec96bd6f4a6460b148e1e6` |
| caller-inventory.md | `68a67963bf1ff3d5f73fe9b53fab81b311867b49363e29c1231764ee7a01fae8` |
| Proposal freeze-r1.json | `6b685c0e3f9d227187f8b7879a604e5ddbe59df5906aa755fd0ed932f98cdfb9` |
| Design review-r1.md, APPROVED SOURCE DESIGN ONLY | `a62e16c39fdf8aa166164a46983edcb11133314ac9709b23e8ca6d630c2444f6` |
| Full-integration design freeze-r1.json | `6b875755c833171cb29cbc2015969fc5ceed9b7130f6bbc4c197bbfc21445ba1` |
| Full-integration manifest.json | `0b3de92b08bf9b2f052ed5bffd61a3690cd82a3ac4ac93385401b64ccf0f4454` |

The combined patch and actual complete diff were read. The source delta consists of the finite diagnostic predicate change, the fixed metadata reader, and replacement of the one metadata read site. The consumed freeze differs only in `supervisorSha256`. Git's hunk alignment around the unchanged `regular_bytes` return differs from the saved patch's context alignment; the materialized source has the required exact hash and the generic reader is unchanged. Both before-dependency-contract archives compare byte-exact to their HEAD versions. The original proposal's live-path pins remain historical statements; the new closing inventory separately pins the historical archives and current files. They were not silently repointed.

All 58 closing pins were checked successfully, including a closing repeat. All 29 consumed artifact pins, all 13 design pins, all six BASE input pins, the five corresponding nonworkflow live inputs, all seven live source preimages, and all eight overlay postimages were checked. The synthetic helper remains absent, including as a symlink. Workflow bytes are unchanged. The three result inventories' 39 entries were checked, with ZIP member hashes compared to the retained raw result/journal files. These are byte checks, not executed validation.

## Read scope and method

Read the full current supervisor, consumed freeze, proposal, caller inventory, proposal patch/freeze, design receipt, implementation patch/response/freeze, and the before-dependency-contract freeze. The source archive was inspected through the full shared supervisor text and the complete archive-to-current diff, with byte-exact archive verification. This covers every archived source line rather than accepting an archive hash as a behavioral review.

Read the original `docs/tasks/001-ci-full-integration-design.md`; the selected Linux design's `review-r1`, supervisor reviews R1/R2/R3 and responses R2/R3; and the full-integration design's `review-r1`, `supervisor-source-scope-r1`, supervisor reviews R1/R2/R3 and responses R2/R3. Read the full protocol, manifest, design and supervisor freezes, and all eight overlays, including Turbo passthrough. Read the result-root `result-r1`, checkout-history reviews R1/R2, responses R2 and dispatch R2. Read ff45799's cancellation, refusal reviews R2/R3, response R3, freezes, inventories and retained raw evidence; checked its rejected archives and correction history. Read 2b65387's full result, inventory, raw results/journals/run evidence and current design review. Original receipts, not the implementation response's summaries, supplied the historical dispositions below.

Inspection used text, line-numbered reads, diffs, hashes, read-only Git objects, and streaming archive listing/member reads. No inspected code was executed, imported, parsed as source, syntax-checked, or used as a checker. No tests, builds, probes, DB calls, dependency inspection/install, overlays, source/freeze/workflow mutations, remote operations, commits, pushes, CI, or nested reviews occurred. Only this named receipt was written. Concurrent and unrelated edits were preserved.

## Current implementation, API and security assessment

At lines 198–234 the new reader has one fixed path, `ROOT / "node_modules/turbo/package.json"`, and a fixed 1 MiB bound. It exposes no path, link-policy, or size override. Parent resolution must remain beneath `ROOT/node_modules` (201–202). The named leaf is checked with `lstat`, symlinks refused, and the descriptor opened read-only with `O_NOFOLLOW | O_NONBLOCK` (203–205). Descriptor validity requires a regular file, positive link count, and nonnegative bounded size (207–208). Thus a FIFO or other special file is not accepted as metadata, and the leaf open does not wait on FIFO input before the regular-file check.

The primary `require(valid, "file_type_or_bound")` remains outside optional-record containment at line 215. The pre-existing report status is marked unavailable, and both argument assembly and the optional call are contained (210–214). A recoverable failure of the optional diagnostic cannot replace or bypass the primary refusal. Successful optional recording sets observed only after finite validation and bounded serialization (149–176). Only the dependency/file_35 pair changes to `link_count_not_positive` (162–166); all other diagnostic pairs retain `link_count_not_one`. No raw path, exception, dependency contents, or unbounded arbitrary value is added to publication. The existing finite stage/file identifiers, integer bounds and 1024-byte optional record remain.

Identity includes device, inode, full mode, link count, size, nanosecond mtime and ctime (216–218). The pre-open named identity must match the open descriptor (220). First read length, middle descriptor identity and bound are checked (221–224). The descriptor is rewound; a second bounded read, final descriptor identity, named leaf identity, resolved parent equality and equal content hashes are required (225–233). Both reads use the same descriptor; the first bytes returned at 234 are the bytes subsequently parsed. At 719–726 duplicate JSON keys are rejected. At 1296–1298 the metadata must be an object with exact name `turbo` and version `2.11.6`. Existing root/package/script/Turbo graph identity checks at 1261–1301 remain in the same preflight, including the integration graph, `^build`, cache policy, manifest and eight target identities.

The parent comparison is a pathname check, not a pinned parent-directory descriptor or atomic namespace snapshot. `O_NOFOLLOW` protects the final leaf, not every traversed component. Repeated identity/hash observations do not lock other hardlink aliases or exclude an adversary rewriting/restoring between observations. A writer after return can change future use. No installation-origin or executable attestation follows from the package name/version. These are explicit contract limitations, not newly discovered regressions under the cooperative no-writer scope; no broader security claim is approved.

No exported API or application-facing protocol is changed. The internal helper accepts only the existing report. The finite new diagnostic predicate is confined to the one metadata role and is consistent with its new validity rule. Other primary refusal labels and original-exit authority remain intact.

### All 14 remaining regular_bytes call sites

The definition at 179–195 still requires a regular descriptor with exactly one link, applies its bound, and performs a bounded read. The following complete caller audit establishes that the fixed exception did not become a generic dependency or owned-artifact exemption.

| Current line | Consumer and consequence |
| --- | --- |
| 261 | Dist tree content hashing; regular files retain nlink1 and 128 MiB per-file bound. Existing explicit symlink representation is a separate tree policy, not this exception. |
| 1144 | Configuration content read, bounded at 65536 bytes. |
| 1170 | Journal validation/receipt read, 1 MiB. |
| 1238 | Publication inventory file reads, 1 MiB each plus global publication limits. |
| 1253 | Static marker scan, bounded per file and globally; remains strict for regular files. |
| 1265 | Preflight wrapper serving consumed freeze, self, design/artifact/input and graph reads; all those roles retain nlink1. Only installed metadata bypasses this wrapper through its fixed helper. |
| 1359 | Live preimage backup acquisition, 1 MiB. |
| 1364 | Overlay source hash verification, 1 MiB. |
| 1375 | Version command console read, 1000 bytes. |
| 1392 | Overlay bytes read for application, 1 MiB. |
| 1393 | Applied target hash verification, 1 MiB. |
| 1412 | Original workload console read, 32 MiB. |
| 1459 | Restored source comparison, 1 MiB. |
| 1472 | Final source hash comparison, 1 MiB. |

In addition, `source_path` at 244–249 still rejects linked/symlinked owned source targets. Trace inventory and descriptor reading at 658–671 and 729–817 retain their own strict link, identity and cumulative bounds. Publication at 1227–1243, repeated after receipt finalization at 1498–1499, retains strict identity and link guards. No metadata exception reaches backup, dist, restoration, traces or publication.

### Composition with the original diagnostic

The sole original workload is still `bun run test:integration` (39, 1399–1401). No selected-test substitute, additional original graph invocation, changed native deadline, build edge removal or cache relaxation was introduced. The eight overlays and trace-only Turbo passthrough remain frozen. Actual direct-root exit is captured before secondary analysis (1403–1404); final handling at 1510–1513 does not turn failure or unknown into success.

The report is initialized before preflight (1322–1325, 1345). Backups precede application; applied state is set before the eight writes (1389–1393), so partial application enters restoration handling. Ownership safety gates restoration and dependent work (1440–1445), and final publication still depends on ownership safety (1491–1495). Restoration compares original bytes/hashes rather than resetting unrelated work (1459, 1472). The bounded fallback receipt at 1205–1224 retains actual exit, restoration and refusal information. The metadata change does not bypass these paths.

## Historical findings and response dispositions

These dispositions preserve rejection history and the authority of each subsequent source-only correction. They are not reconstructed runtime passes.

| Original finding or decision | Response and present disposition |
| --- | --- |
| Selected supervisor R1: normal discovery capacity/journal failures could prevent cleanup. | R2 separated emergency handling and contained telemetry. Current journal handling at 291–325 and independent cleanup paths remain. Source-corrected; actual Linux cleanup remains unproved. |
| Selected R1: PID reuse/reaping attribution could target the wrong lifetime. | R2 introduced lifetime identity, fresh ancestry, pidfds and ambiguity handling. These remain; unseen short-lived children and OS limits remain observational limits. |
| Selected R1: late trace creation/bounds/hardlinks could escape initial checks. | R2 added final inventory and descriptor/cumulative bounds. Current trace and publication checks remain strict; this metadata exception does not affect them. |
| Selected R2: repeated TERM attempts could consume emergency capacity and starve escalation. | R3 retained already-owned emergency handles before capped new discovery, permitting KILL/reap without charging the same lifetime repeatedly (451–506). Source correction remains. |
| Selected R2: generic wait/reap could steal the Popen root's exit, including when normal discovery was capped. | R3 established direct-root ownership outside capped discovery and reserved its wait for Popen (415–432, 563–568). Root identity is acquired before journal/discovery; the unreaped numeric-root guard remains. |
| Full-integration design R1 approval. | Design authority only, not supervisor execution or current materialized approval. |
| Full supervisor R1: raw Turbo `::group` framing and dependency-build completion were not proved correctly. | R2 validated closed raw build groups and explicit successful/cache summaries (1065–1130). Downloaded log framing is not substituted for emitted workload framing. |
| Full R1: expanded reconstruction could discard an otherwise valid bounded prefix. | R2 made retained events compact and pair-aware with prewrite budget checks and metadata headroom (799–810). Bounds apply before accumulation/publication. |
| Full R1: lineage lacked path-sensitive joins. | R2 added path-aware lineage joins. This did not settle the additional R2 objections below. |
| Full R2: rootless lifecycle records were wrongly filtered. | R3 anchors exact root-bearing creation to built PID, instance and coordinator; associated rootless records can participate, explicitly contradictory roots refuse (846–857). |
| Full R2: latest-version predicate could be mistaken for a terminal successful settlement. | R3 separates the predicate from a later successful same-revision settlement before cleanup (961–1006). A finally marker is not success; failed, cancelled, initial and replacement sessions remain distinct. `fixtureAssertionsProved` remains false (967). This does not prove every fixture assertion or an exact settled await. |
| Checkout R1: depth-zero workflow postimage did not match consumed expectation. | R2 corrected only the expected workflow hash and preserved the previous freeze/history. The current exact workflow remains pinned; ancestry and graph checks were not bypassed. At 2ac, `git_read_failed` is directly observed, but attribution to the first git-show remains inferred. |
| Refusal R1 cancellation. | Cancelled, with ENOENT for the intended receipt and interim-summary unknown cause. No verdict exists to promote. |
| Refusal R2: optional call assembly escaped containment; fallback allocation could leave `not_observed`. | R3 marks the established status unavailable and contains the entire call; observed follows bounded validation. Current generic reader at 186–192 and new fixed reader at 210–215 preserve both corrections. |
| Metadata design R1. | Approved source design only under completed-install/cooperative no-writer assumptions, with no findings. This review independently assessed the resulting full source and exact combined delta. |

Rejected refusal source `8c935e5fdaf14a3a56e123583d09599de1d595998e5ef12ec0c360ec0f7f6d0a`, rejected freeze `e9952284824ccbcbcffef486112d8999ad37e2a9b4bdcc185c446bf9ed34a4d7`, and R2 receipt/preserved copy `050736027e2b58834296da5e65adffc7782aefbbed6f1ac03b429d25890aec1a` remain immutable and hash-verified. The later refusal R3 receipt is `a6fe0fd3c40fc7be8311ba842d5a5c49c260e7d414170fbe8df0591f047df9e5`. Earlier design histories concerning owned-output forwarding, pure predicate guards after privacy objections, strict shutdown semantics, and successful-session cleanup retain only their recorded authority; this review does not claim fresh execution of those production behaviors.

## Evidence retained without causal inflation

Exact current push `37723652120` / job `113136763319` and PR `37723655151` / job `113136773621` both reached ALL20, 500 unit tests across 89 files, and restore-build 8/8 before diagnostic preflight failed. The bounded observation in each result is dependency/file_35, regular=true, nlink=2, size=753, bound=1048576, failedPredicates=[link_count_not_one]. This supports the narrow metadata-contract mismatch. It does not prove installation origin or any previous run's metadata.

Each ZIP contains only a 595-byte result and a 133-byte journal. Both results hash to `d74a9769cdbb5136a003dc72091b5b82b2a298dc68ff88da78e8b007fbbb85c7`. Push ZIP: `8fa604c03a7794ec9224976b8ae84c7360c4c5fb84dd590e2c82a16b20f593b1`; PR ZIP: `98ff8fa8c25501c431759a6574cf79be5e11f362a271009995c4065908e37b09`. Push journal: `857b522abe3e56760b257b8f6d8196ced05acfc1fc555700ee47509c06ea3f12`; PR journal: `bdcca309ca6e846b1d40a602cf537170aa7f1d154ef92c93fc3754db3b27db6e`. Streamed archive members match the retained files.

`originalExit`, workload, lineage and provisioning remain null, with empty before/after maps. `restored:true` is preapplication status, not exercised restoration. Empty audit/count zero describes preflight only, not descendant acceptance. The original diagnostic workload was NOT RUN. Those results cannot demonstrate that the newly materialized reader succeeds.

At ff45799, push `37720331784` / job `113126269069` and PR `37720335759` / job `113126282020` retain only generic `file_type_or_bound`, 422-byte results and 133-byte journals. No path or failed predicate was observed there. The current observation cannot retroactively establish Turbo hardlinks as their cause. The earlier checkout evidence similarly preserves directly observed generic `git_read_failed` separately from inferred first-call attribution.

The broader original failures remain unresolved:

- Both original 142 startup attempts failed at the native five-second deadline: 499/1, 19/20 tasks. Three local selected macOS nonreproductions omitted stage deltas. Historical reporter configuration remains unknown; passing-log suppression is a possible mechanism, not an established explanation. The supported `otlp-http-json` path imports before endpoint validation, correcting the earlier invalid-protocol interpretation. 89 files is not a measured peak worker count.
- The 0dbb cap-of-two/serial policy is distinct from causation; both development and provisioning reds remain.
- 27da659c ordinary CI reported 277 pass, two named skips, zero fail; ALL20/500 and browser14. Failure-only diagnostic/upload did not run and artifact inventories were empty. That head-specific green does not validate the supervisor. Baseline adoption and pooler cancellation/lock-release skips remain coverage gaps.
- BASE435 PR `37711969466` / job `113099700093` remains 275 pass/two skip/two fail: credential recovery at original `dev.test.ts:234`, `active.version !== second`, after credential restoration, and provisioning timeout 5000.43 ms. Push `37711966045` / job `113099690504` remains 276/two/one with provisioning timeout 5000.32 ms. Both retained one dangling child. The credential failure is not the later latest-generation wait or subsequent failure-null assertion. Later gates were skipped and remain pending.

## Remaining limitations and terminal disposition

The normal discovery cap is 256 and emergency capacity is 4096, plus separately owned direct root. Lower OS/descriptor limits can prevent complete observation. Unseen fast children remain possible; ambiguity or unknown remainder is not zero (541–542). Unsafe ownership blocks restoration, dependent work and publication. The current change does not relax that refusal policy or establish descendant cleanup.

Privacy and capacity remain finite: 4 KiB trace records, 4096 events, 1 MiB per trace, 64 traces/8 MiB total, 80 published files/12 MiB, 32 MiB console, 1 MiB receipt, and 1024-byte optional refusal metadata. Observer overhead and real-run completeness remain unmeasured. The 30-minute job deadline may preempt supervisor cleanup; source cleanup paths are not an external guarantee. Original workload, lineage, provisioning, actual descendant absence, restoration, and safe publication on Linux remain unverified.

Severity disposition: no new P0/P1/P2 finding in this exact materialized contract. The limitations above are retained scope boundaries, not silently resolved objections. Required source correction: none. Required evidence before runtime acceptance remains fresh, separately authorized Linux execution demonstrating the original workload and its authoritative exit, bounded lineage/publication, ownership and restoration behavior; this review did not perform or authorize it.

**APPROVED SOURCE ONLY** applies solely to the current supervisor, consumed freeze and closing inventory hashes in this receipt, under the stated cooperative assumption. All historical rejections, cancelled review status, original reds, skips and pending later gates remain intact.

**Parent handoff:** read this entire terminal receipt and independently rehash it before further coordination. Its final SHA-256 is returned outside this file. Any source, freeze, workflow or pinned-evidence drift requires reconciliation; this receipt is not authority to execute, publish, commit, push, or declare runtime acceptance.
