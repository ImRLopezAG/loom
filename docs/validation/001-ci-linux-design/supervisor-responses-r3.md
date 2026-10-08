# Supervisor R3: source-only responses

Original brief: implement the approved finite Linux diagnostic design as an unapplied artifact supervisor: exact preimages/backups, seven overlays, one build, exactly two selected cases with original assertions/deadlines, bounded synthetic trace and process ownership, complete restoration and validated upload. No execution, import, syntax check, workflow/source overlay application, push or CI retry is authorized.

Read proposal.md, review-r1.md, supervisor-source-r1.md, both supervisor-review-r1.md and supervisor-review-r2.md, and supervisor-responses-r2.md in full. Prior originals remain linux-diagnostic-r1.py and linux-diagnostic-r2.py with immutable freeze receipts. R2 was NOT APPROVED with two P2 findings; R1 was NOT APPROVED with three P2 findings. Neither rejection is superseded by a runtime green.

## R2 P2: repeated TERM consumes escalation capacity

Accepted. Successfully verified emergency lifetime pidfds are now retained separately from normal evidence identities. Every TERM/KILL pass signals these handles before inventory or acquisition-budget checks; every reap pass visits them. Repeated visits neither open another descriptor nor consume the acquisition budget. Thus an admitted TERM survivor has its same lifetime handle available for KILL and adopted-child reaping even after all 4096 acquisition attempts have been used. The emergency handles are included in ancestry/inventory ownership seeds and closed in the command finalizer.

Resource tradeoff: the same 4096 acquisition-attempt bound now also bounds retained emergency descriptors, in addition to 256 normal descriptors and the root descriptor. The OS may impose a lower fd limit; acquisition failures remain explicit cleanup errors/incomplete evidence, while already retained handles still receive escalation. No RLIMIT change is proposed. A child that cannot be verified/acquired is not claimed cleaned; remaining unknown is null and restoration is withheld. This is bounded recovery, not a guarantee against arbitrary resource exhaustion or kernel-stuck processes.

## R2 P2: direct runner status stolen by emergency waitid

Accepted. Root lifetime is read and stored immediately after pidfd_open, before journal writes or capped normal discovery. Normal discovery no longer establishes it. If that initial /proc read itself fails, reap_fd additionally recognizes the original numeric PID while Popen.returncode is None: the unreaped direct child's PID cannot be reused, and only Popen.poll may consume its wait status. Once Popen has reaped it, a later reused PID with a different start tick remains an independent lifetime. The stored root identity also remains excluded from waitid after reaping.

## Retained evidence and interpretation limits

Current 0dbb4387 CI ALL20/500-unit green precedes integration 276/2/1 and 275/2/2: latest-generation wait and provisioning 5000ms timeout/dangling child remain unresolved. Earlier two 142 startup reds, three macOS nonreproductions with suppressed console markers/no stage deltas, corrected sole research and approved resource policy establish no cause/fix. ROOT accepted bebf2f4c combined checkpoint is separate.

Async event lineage is not later-revision causality; coordinator/revision is authoritative. Unscoped lock overlap, missing post-assertion sync.end, differing fixture/version hashes and source/built helper instances remain disclosed. Observer overhead, excluded timing costs, ordinary non-fsync durability, sampled process lower bounds and unavailable pinned reporter introspection remain. No secret/SQL/application payload collection; no public API or original test/assertion/5000ms/2000ms/production deadline changes.

R3 remains unexecuted. Linux pidfd/subreaper cleanup, restoration and upload are not proven by source approval. A separate execution/workflow authorization is required.
