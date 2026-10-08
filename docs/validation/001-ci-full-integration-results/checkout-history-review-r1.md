# Checkout history R1: independent bounded source review

**NOT APPROVED as a compatible diagnostic correction: one P2, no P1.** The one-line checkout change supplies the intended history scope, but the frozen composition necessarily rejects its new workflow bytes. No readiness, execution approval, causal fix, or full-feature acceptance follows.

## Scope and verified identity

Reviewed only the `fetch-depth: 0` addition at `.github/workflows/ci.yml:42`, against `checkout-history-freeze-r1.json`, at HEAD `2ac1b2c164380c5da95165d210ecc92ab3bdb309`. The live diff and frozen patch have identical SHA-256. Read the actual ce-code-review SKILL and modes-and-output reference; applied implementation/API/security criteria as the explicitly requested leaf, without a generic branch roster or child reviews. Read CLAUDE.md and supplied instructions. No CodeGraph index or CE artifact-root configuration exists here.

Verified SHA-256 by read-only hashing:

| Item | SHA-256 |
| --- | --- |
| HEAD workflow / expected R3 postimage | `e8ff22ffd7e533e392e142e8dd20823e84cbc277e30b041565d51800343b8edb` |
| Current workflow | `a19d52d896594b6982bf29c15d6f2133c7af3aa5285e7ad809385c5b9f0b283a` |
| Exact live diff and checkout-history-r1.patch | `e28f7432c268100f2bbfcb461ed4ebfe5c0b41667e4039b6ee2e405b5a1ae145` |
| checkout-history-freeze-r1.json | `89d39250f0c2e45eb012ffe2bea7575bcffd4d28b2d11fe134e01a2e97b1eb52` |
| checkout-history-source-r1.md | `eb1515f2bc4c446d9ee8d7da29677152d0a15489d2552ca23dc0d940dfc1fafb` |
| linux-full-integration.py | `fcb662b252941cc730f1ff1ddfb2b0fc067fb2b2a1e6098d5b508c2cb4033708` |
| supervisor-freeze-r3.json | `458b7bfaf1eacf0d242d74ca6fc930259a73f2fd46f01fb0d3d13f8fc83be64a` |
| Results inventory-r1.json | `4c2c7e997ff0c9d062ad926905113f1f19f9497674472315a50fc09c1551d0b5` |

## P2 — New checkout workflow cannot pass the immutable workflow postimage guard

**Changed location:** `.github/workflows/ci.yml:42`. **Interacting source:** `docs/validation/001-ci-full-integration-design/linux-full-integration.py:1154-1157,1216,1225-1270,1380-1384`. Confidence: high; source-confirmed, not runtime-reproduced.

`check_pins()` reads the unchanged R3 freeze, validates baseline input bytes using `git show BASE:path`, then compares each live input with its expected digest. For the workflow, lines 1155-1156 explicitly select `workflowPostimageSha256`, which is still `e8ff22ffd7e533e392e142e8dd20823e84cbc277e30b041565d51800343b8edb`. The authorized one-line addition produces `a19d52d896594b6982bf29c15d6f2133c7af3aa5285e7ad809385c5b9f0b283a`. These are unequal. Once history retrieval and preceding checks succeed, this composition must raise `input_hash_mismatch`; it cannot reach the ancestry check, original-source capture, version probes, overlay application or original workload. `main()` calls this guard at 1216, before those operations, and returns failure for an unavailable original exit.

This independently confirms the host's disclosed compatibility finding. It is a newly introduced incompatibility between the changed workflow and an intentionally unchanged guard, not a request to weaken that guard. The previous R3 SOURCE approval covered the old exact postimage and cannot approve this composition. Supplying Git history addresses one prerequisite but cannot by itself deliver the intended diagnostic run.

**Required response:** obtain a separately scoped, reviewed postimage-pin coordination change while preserving the immutable R3 receipt and exact old/new workflow evidence. Bind only the new expected workflow postimage through an explicit authorized mechanism. Preserve the original baseline input hash `60786a50329f66a2a65bc7eace1043474319ad6ec4f1aef109875055a4efd0ed`, all other input/design/overlay/supervisor pins and the BASE ancestry check; do not skip hash checking, accept arbitrary workflow bytes, or rewrite historical approval as though it covered the new image. No pin edit is authorized in this review, and none was made. This finding remains open.

## API/security and scope assessment

The action remains pinned to `actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803`; `persist-credentials: false` and `contents: read` are unchanged. No ref override, action-version change, credential persistence, permission expansion, public application API change or raw diagnostic publication is introduced. No additional concrete P1/P2 API/security defect was identified in this one-line scope.

Full-history checkout expands downloaded repository history/ref coverage and local Git object storage beyond depth one. Network transfer, disk consumption and checkout duration can increase with repository history; this review neither measures nor bounds that increase. It consumes the same 30-minute job budget and can reduce time available for diagnostics and cleanup. The change does not extend that budget or the supervisor's 1800-second ceiling. This is an explicit scope/cost tradeoff, not a claim of free or bounded full-history retrieval.

The exact diff leaves the original one `bun run test:integration` graph, `^build`, cache policy, eight Linux-only temporary overlays, resource cap/environment and serial root check, assertions, provision 5000-ms limit, development/internal deadlines and strict 2000-ms stop unchanged. Built-marker/lineage/provision-child attribution, ownership-before-restoration, bounded synthetic publication, pinned upload configuration and success-dependent later browser/provider gates are unchanged. Source equivalence of those surfaces is not runtime acceptance of them.

## Captured remote evidence

Read both result.json files, both supervisor.jsonl files, both run/artifact metadata files, result-r1.md, inventory-r1.json and relevant actual checkout/check/build/native/upload log excerpts. All twelve captured run/log/result/journal/metadata/archive digests match the inventory. Both archive digests also match their artifact metadata, and read-only ZIP listings contain exactly result.json (419 bytes) and supervisor.jsonl (133 bytes).

- PR run `37718616829`, job `113120828422`: actual depth-one fetch and checkout of merge `6341c1b6164b3dba3f79756a43b4876136e6c33f` (log lines 146,207,234). Archive SHA-256 `346723e9b0d7c44235519dd745bf3d1a0eb5a93eefb3fb45a578042b91caadf9`.
- Push run `37718611038`, job `113120809923`: actual depth-one fetch and checkout of `2ac1b2c164380c5da95165d210ecc92ab3bdb309` (log lines 150,211,229). Archive SHA-256 `f639b6e732ed66e635b331dae7728f42300df3151e2b60c805f57394ea59fbb3`.
- Both logs show 500 unit passes, ALL 20 tasks successful, restore-build 8/8, native supervisor exit 1 and successful receipt upload; metadata records later browser/provider steps skipped. These are existing captured results, not work executed by this reviewer.
- Both receipts report `git_read_failed`, incomplete status, acceptance false, null originalExit/workload/trace/lineage/provisioning, empty before/after source maps and a zero direct-child snapshot. The journal contains only supervisor.end. `restored:true` follows the pre-application path; it does not prove exercised overlay/dist restoration, workload completion or descendant-lifetime cleanup.

The first failing `git show BASE:package.json` attribution is inferred from input insertion order and check_pins source order, supported by the shallow logs. The helper at lines 116-120 suppresses exact stderr and uses a generic reason; the captured receipts do not directly identify that invocation. No more precise runtime cause is claimed. Full history supports the existing baseline-object/ancestry prerequisites; it is not a fix for the original dev/provision failures.

## Required history and full prior-response dispositions

Read the task design history; full-integration protocol, source scope, design review, supervisor R1/R2/R3 reviews and R2/R3 responses; old isolated supervisor R1/R2/R3 reviews and R2/R3 responses discovered within `001-ci-linux-design`; current checkout-history source/freeze/patch; and actual current `check_pins`, Git helper and complete `main` source. This is bounded compatibility review, not a fresh entire-supervisor reapproval. Earlier source dispositions remain historical with their limits:

1. Old R1 ownership-cap/journal rejection: response separated emergency cleanup from capped discovery and journal success. Old R3 accepted retained independent cleanup; incomplete/unknown ownership still blocks restoration.
2. Old R1 PID reuse/reaping rejection: response introduced PID/start-tick identities, pidfds and identity-aware reaping/trace attribution. Unobserved fast lifetimes and ambiguous PID reuse remain unproved.
3. Old R1 late bounds/hardlinks rejection: response added post-cleanup inventories, descriptor/link checks and cumulative reconstruction/publication limits. No limit or upload scope is widened here.
4. Old R2 repeated TERM rejection: response retained emergency handles across TERM/KILL/reap and visited them before further acquisition. The 256 normal/4096 emergency bounds plus root and lower OS descriptor limits remain real incompleteness limits.
5. Old R2 direct-Popen-status rejection: response established root lifetime before discovery and retained the unreaped numeric-root fallback, leaving root status exclusively to Popen. Old R3 approval was SOURCE ONLY.
6. Full supervisor R1 raw-Turbo-framing rejection: R2 response recognized raw group commands, exact tasks and nested-aware summaries with successful build closure. Captured Linux workload reporter behavior remains unverified because these runs never launched it.
7. Full supervisor R1 reconstruction-expansion rejection: R2 response used compact stage/cost pairs, prewrite budgets, bounded prefixes and metadata headroom. No raw upload, fabricated complete trace or larger budget is accepted.
8. Full supervisor R1 incomplete-lineage rejection: R2 response added path-sensitive root/helper/coordinator/revision/order/admission/version joins, but R2 was correctly rejected for two further defects.
9. Full supervisor R2 rootless-flush rejection: R3 response anchored exact built PID/helper-instance/coordinator creation, admitted rootless lifecycle records only by that identity, and rejected contradictory explicit roots.
10. Full supervisor R2 predicate-versus-terminal rejection: R3 response kept passing-predicate observation distinct from the matched revision's later successful completion before the existing outer cleanup marker. That boundary proves neither exact settled-await return nor fixture assertions. R3 SOURCE approval resolved those two source findings; it supplies no execution proof and no approval of this changed workflow hash.

Accepted operational-visibility units/fullreview remediation at 142 remain separate from pending PR4 final CI. Both original 142 startup reds and both 0dbb dev/provision reds remain unresolved; resource env cap 2/serial graph preservation is not a causal fix. Three local selected nonreproductions lacked stage output because of reporter behavior and establish no cause. The 27da ordinary green retains two named skips and diagnostic/upload NOT RUN. Exact 435 PR counts remain 275 pass/2 skip/2 fail, including original dev.test.ts:234 credential recovery `active.version !== second` after credential restoration and provisioning 5000 ms; push remains 276/2/1 at provisioning. This is not the later malformed-edit failure-null predicate. No assertions/deadlines were changed. Historical corrected research, observer perturbation, sampled ownership limits, provider gaps and unresolved skips remain.

## Review boundary

Only source/document/log/metadata reads, local Git/diff inspection, SHA-256 hashing, archive listing and this receipt write occurred. No supervisor execution/import/syntax check, build/test/DB/probe/fetch/push, workflow or pin mutation, shipping, child review or remote operation occurred. No relevant memory evidence was used. Other files were preserved. The sole reviewer-owned write is this file.

**Terminal result: one open P2 compatibility finding. No readiness claim.** A separately authorized compatible pin composition and subsequent actual evidence are still required; no causal fix or full acceptance is established.
