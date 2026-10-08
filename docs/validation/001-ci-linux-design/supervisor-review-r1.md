Task: node:delegated-task:command%3Amcp%3A583aba27-23ff-4583-add7-a3bb37e882cc%3Adelegate-task%3A001-ci-linux-supervisor-source-review-r1

**NOT APPROVED — three P2 findings.** No P1 finding identified. This is an executable-source review only; none of the scenarios below was executed.

1. **P2 — Ownership-limit and journal failures can prevent emergency cleanup.**  
   [linux-diagnostic.py:201](/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility/docs/validation/001-ci-linux-design/linux-diagnostic.py:201), lines 246–268 and 320–326.

   When 256 identities have been retained and another live owned child appears, `discover()` raises `owned_identity_bound`. The `finally` block calls `cleanup()`, which calls the same `discover()` before sending TERM. It raises again, so neither TERM nor KILL reaches even the already retained processes. Journal write failures have a similar effect: cleanup logging can throw before signaling, or after signaling only one process.

   Withholding restoration is appropriate, but it does not fulfill the promised bounded cleanup attempt. The exception also leaves `remaining` at its default empty list; the final audit records only direct children.

   **Fix:** separate emergency signaling/reaping from discovery limits and journal success. Retain the original failure, attempt cleanup through existing pidfds despite telemetry failures, perform bounded overflow handling, and record unresolved ownership explicitly. Continue withholding restoration when cleanup cannot be established.

2. **P2 — Numeric-PID indexing drops later process identities after PID reuse.**  
   [linux-diagnostic.py:192](/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility/docs/validation/001-ci-linux-design/linux-diagnostic.py:192), lines 213–218, 236–242 and 392–445.

   `known` retains entries permanently by numeric PID, and discovery skips any PID already present before comparing start ticks. If an observed descendant exits and that PID is reused by another owned descendant during the command, the new process is never registered. The `alive` filter excludes it because its start ticks differ, so it receives no cleanup signal. Conversely, trace validation accepts numeric membership in `known` as proof of observation, potentially attributing the new process’s records to the old identity. Numeric `waitpid()` can also reap an adopted replacement while logging the old start ticks.

   The final direct-child audit can prevent restoration if the replacement remains adopted, but it does not repair the incorrect command audit or prevent advancing to the next case after an incorrectly clean result.

   **Fix:** track identities by PID and start ticks, maintain a separate current-identity lookup, register replacements, and make reaping and trace attribution identity-aware. Ambiguous trace-to-lifetime attribution must remain incomplete.

3. **P2 — Final trace validation does not enforce aggregate artifact bounds.**  
   [linux-diagnostic.py:299](/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility/docs/validation/001-ci-linux-design/linux-diagnostic.py:299), lines 272–283 and 379–432.

   File-count, aggregate-byte and hard-link checks occur only inside the command polling loop. A process can write additional trace data after the last check and exit before the next loop iteration, or write during cleanup. `validate_trace()` then enumerates every file, reads up to 1 MiB apiece, accumulates records, and publishes them without rechecking the 64-file/8-MiB aggregate limits or link count.

   Thus an over-limit final directory can be uploaded and potentially classified complete despite the finite-protocol promise.

   **Fix:** after ownership cleanup, validate the complete final trace inventory before publishing. Enforce cumulative file/byte limits while reading and reconstructing output as well. A failed final bound must invalidate evidence and stop dependent work.

**Coverage and freeze verification:** HEAD remained `0dbb4387f615d6f8358f2eea1c3d886c6ae3184e`. All ten hashes listed in `supervisor-freeze-r1.json`, six live preimages, and seven overlays matched. The live helper was absent, and scoped live source/workflow diffs were empty. Supervisor SHA-256 remained `dacd45702d18dd442212c6065a0637fbdb6187718f4fe2c0c7cb54d860ea5385`.

The reviewed source otherwise preserves the seven-overlay application, one rebuild, two exact sequential cases, original assertions/eight provisioning commands, and application/test deadlines. Public runtime imports still resolve through built exports; the added source import is the private diagnostic helper. No new dependency or public API was identified. Console capture remains outside the upload directory, and validated record fields exclude raw console, SQL, credentials and application payloads. Reporter resolution is explicitly unavailable rather than falsely claimed resolved. Normal restoration verifies source hashes, helper absence, dist manifest and the initial tracked diff; restoration is withheld on reported cleanup failure.

The prior evidence remains unchanged: both current-head integration reds are unresolved; earlier startup reds, three macOS nonreproductions without stage deltas, the corrected research receipt, and resource-policy-only approval establish no causal fix. Sampled process peaks are lower bounds. Event UUIDs establish async lineage, not later-revision causality; coordinator/revision remains authoritative. Unscoped preparation overlap, post-assertion `sync.end`, separate fixture/version hash domains, separate helper instances, observer perturbation, excluded cost components and ordinary non-fsync trace durability remain limitations. Missing/truncated evidence or failed cleanup cannot establish successful reproduction or acceptance.

**Residual execution gap:** no supervisor invocation, import, syntax check, test, build, lint, typecheck, DB operation, workflow application, edit, push or child investigation occurred. Linux pidfd/subreaper behavior, failure recovery, pinned Bun reporter/config behavior and artifact upload remain unverified. This report grants neither execution authorization nor feature/CI acceptance.

