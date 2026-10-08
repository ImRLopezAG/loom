Task: node:delegated-task:command%3Amcp%3A583aba27-23ff-4583-add7-a3bb37e882cc%3Adelegate-task%3A001-ci-linux-supervisor-source-review-r2

**NOT APPROVED — two P2 findings; no P1 identified.** Source-only review; neither scenario was executed.

1. **P2 — Repeated TERM attempts can exhaust the overflow budget before KILL.**  
   [linux-diagnostic.py:342](/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility/docs/validation/001-ci-linux-design/linux-diagnostic.py:342), lines 339–364 and 376–386.

   Every visit to an unretained identity increments the same `emergency_attempts` counter. Transient descriptors are then closed, so surviving children are charged again on subsequent TERM passes. Once those passes consume 4096 attempts, the KILL phase immediately breaks without signaling any unretained survivor—even identities already verified and repeatedly sent TERM.

   Restoration correctly remains withheld, but the implementation can abandon killable owned children because repeated TERM work consumed the escalation budget.

   **Required correction:** reserve bounded capacity for KILL/reaping, or retain bounded overflow lifetime state so repeated TERM attempts cannot consume all escalation capacity. Keep unresolved ownership incomplete and restoration withheld.

2. **P2 — Emergency reaping can consume the original runner’s exit status before Popen.**  
   [linux-diagnostic.py:285](/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility/docs/validation/001-ci-linux-design/linux-diagnostic.py:285), lines 267–268, 348–354 and 414–417.

   `root_fd` is acquired immediately, but `root_identity` is assigned only during successful normal discovery. If the initial discovery fails before registering the root—for example, an unexpected `/proc` read error—the emergency path can subsequently rediscover that still-running root as an unretained identity.

   After signaling it, `reap_fd()` compares its identity against `None`, then calls `waitid(P_PIDFD)` as though it were an adopted child. If the root has exited, this consumes the status belonging to Popen. A later `Popen.poll()` can consequently report zero after finding no waitable child, losing the actual signal/nonzero exit. The command remains incomplete, but its exit audit is false.

   **Required correction:** establish root lifetime identity independently of capped discovery, and ensure every emergency path leaves the original direct runner exclusively to Popen, including discovery-failure paths.

**Freeze and scope verified:** HEAD remained `0dbb4387f615d6f8358f2eea1c3d886c6ae3184e`. All 14 R2 pins, six live preimages and seven overlays matched. The live helper remained absent; live source/workflow diffs were empty. R2 supervisor SHA-256 is `d223302e27014710ea04b20d9871e0117c5729eaad55fe9c0d6c6023fec57577`; saved R1 matches `dacd45702d18dd442212c6065a0637fbdb6187718f4fe2c0c7cb54d860ea5385`.

The R1 responses otherwise materially improve the source: journal failures no longer directly block signaling; retained identities distinguish PID lifetimes; unknown ownership is represented explicitly; final global trace inventories, descriptor checks and private reconstruction enforce publication bounds. No additional concrete API/privacy regression was identified. Original assertions, eight provisioning commands, deadlines, one build and at most two sequential cases remain preserved.

Prior evidence remains unresolved: current-head ALL20/500-unit green precedes integration **276/2/1** and **275/2/2**, including the latest-generation wait and provisioning timeout/dangling child. Earlier startup reds, three macOS nonreproductions without stage deltas, corrected research and resource-policy approval establish no causal fix. The separately accepted ROOT checkpoint does not establish diagnostic readiness.

All accepted interpretation limits remain: async lineage is not later-revision causality; coordinator/revision is authoritative; unscoped lock overlap and missing post-assertion `sync.end` remain ambiguous; fixture/version hashes and helper instances are distinct. Observer perturbation, excluded timing costs, ordinary non-fsync durability, sampled process lower bounds and unresolved pinned reporter introspection remain disclosed.

No supervisor import, execution, syntax check, test/build/lint/typecheck, DB/CI operation, overlay/workflow application, edit, push or investigator occurred. Linux pidfd/subreaper recovery and upload remain unverified. **This report grants no execution authorization or readiness/causal-fix claim.**

