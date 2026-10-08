Task: node:delegated-task:command%3Amcp%3A583aba27-23ff-4583-add7-a3bb37e882cc%3Adelegate-task%3A001-ci-linux-supervisor-source-review-r3

**APPROVED — R3 source-only implementation/API/security review. No concrete P1/P2 finding identified.** This does not establish Linux readiness or authorize execution.

Read the complete current supervisor, required design/review/response documents, manifest, helper, patches, overlay generator and all seven complete overlays.

Verified:

- HEAD remains `0dbb4387f615d6f8358f2eea1c3d886c6ae3184e`.
- All **18 R3 artifact pins**, **six live preimages**, and **seven overlay hashes** match.
- Live helper remains absent; live source/workflow diffs and working-tree status are clean.
- Preserved rejected R1/R2 supervisors match their recorded hashes.
- Current supervisor SHA256 remains `dcb5338b159451c1bcdffa8e14efa1c756107bbdfcc900d6d81701e5e31584f6`.

All prior findings and responses were accounted for:

1. **R1 cleanup blocked by identity/journal limits — addressed.** Journal failures are contained, and emergency signaling visits retained handles before inventory or acquisition checks. Cleanup does not re-enter capped normal discovery. Unknown final ownership remains `null`; cleanup errors prevent a clean result. See [linux-diagnostic.py:167](/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility/docs/validation/001-ci-linux-design/linux-diagnostic.py:167), lines 319–413.

2. **R1 PID lifetime/reaping attribution — addressed.** Retained identities use PID/start-tick pairs, signals use pidfds, adopted-child reaping uses `P_PIDFD`, and observed numeric-PID reuse invalidates trace attribution. See [linux-diagnostic.py:200](/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility/docs/validation/001-ci-linux-design/linux-diagnostic.py:200), lines 230–308.

3. **R1 late trace bounds/hardlinks — addressed.** Post-cleanup inventory enforces file, aggregate-byte and single-link limits. Descriptor identity checks, bounded reconstruction under `private/`, and a second inventory check precede publication. See [linux-diagnostic.py:499](/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility/docs/validation/001-ci-linux-design/linux-diagnostic.py:499), lines 553–653.

4. **R2 repeated TERM exhausting KILL capacity — addressed.** Verified emergency handles remain retained across TERM/KILL/reaping. Existing handles are visited before the 4096 acquisition-attempt gate, so repeated TERM does not spend their escalation capacity. Finalization closes those handles. The disclosed maximum is 4096 emergency descriptors plus 256 normal descriptors and the root descriptor; lower OS limits remain explicit failure/incomplete paths. See [linux-diagnostic.py:319](/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility/docs/validation/001-ci-linux-design/linux-diagnostic.py:319), lines 470–487.

5. **R2 original runner status stolen by emergency reaping — addressed.** Root identity is assigned immediately after root pidfd acquisition, before journal/discovery. If the initial `/proc` read fails, the numeric-PID guard preserves Popen-exclusive waiting while its return code is unset. After Popen reaps the original runner, a different lifetime using that PID is no longer excluded merely by numeric equality. See [linux-diagnostic.py:283](/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility/docs/validation/001-ci-linux-design/linux-diagnostic.py:283), lines 424–430.

The complete implementation preserves seven overlays, one build, and the two exact sequential selected cases, subject to fail-closed early termination. Original assertions, eight provisioning commands, internal deadlines, default 5000ms timeout and strict 2000ms shutdown remain unchanged. No public API change or new raw secret/SQL/application-payload publication path was identified. Console capture stays private. Unresolved ownership prevents dependent execution and restoration; restoration verifies source/helper/dist and initial tracked diff. Finite cleanup is **not guaranteed to succeed**.

Both exact-`0dbb` CI reds remain unresolved after ALL20/500-unit green: **276 pass / 2 skip / 1 fail** and **275 pass / 2 skip / 2 fail**, covering latest-generation waiting and provisioning timeout/dangling child. Earlier 142 startup reds, three macOS nonreproductions with suppressed console/no stage delta, corrected sole Luna research and independently reviewed resource policy establish no causal fix. ROOT checkpoint `bebf2f4c` remains separate from diagnostic readiness.

Accepted limits remain: async lineage does not prove later-revision causality; coordinator/revision is authoritative; unscoped lock overlap and absent post-assertion `sync.end` remain ambiguous; fixture/version hashes and helper instances differ. Observer perturbation, excluded timing costs, ordinary non-fsync durability, sampled process lower bounds and unavailable pinned reporter introspection remain. Bun integration is distinct from Vitest; 89 files does not establish 89 peak workers.

Only reads, hashes and git inspection occurred. No edits, supervisor execution/import/syntax check, tests/build/lint/types, DB/CI operations, overlay/workflow application, push or subdelegation occurred. Linux pidfd/subreaper behavior, restoration and upload remain unverified. **Current003 retains exclusive execution ownership.**

Host scheduling correction: the review inherited an older 003 ownership note. Latest coordinator notice names 004 kello-004-canonical51-exclusive-after006-cleanup-r1 as current owner. The verdict supplies no runtime authority.

