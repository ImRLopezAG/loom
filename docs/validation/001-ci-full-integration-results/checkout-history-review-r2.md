# Checkout history R2: independent bounded source review

**APPROVED SOURCE ONLY. Zero outstanding P1/P2 findings in the authorized combined correction.** Checkout R1's P2 is resolved by the actual consumed postimage value, verified against the actual workflow bytes. This is not remote authorization, successful preflight evidence, Linux runtime acceptance, a fix for the original integration failures, or PR4 shipping acceptance.

## Scope and method

Reviewed at HEAD `2ac1b2c164380c5da95165d210ecc92ab3bdb309`. Scope is exactly the checkout `fetch-depth: 0` addition, the single `workflowPostimageSha256` replacement in the consumed R3 freeze, and its byte-exact historical archive. Read the actual ce-code-review SKILL and modes-and-output reference and applied implementation/API/security criteria as the explicitly requested leaf. No generic branch roster or child review was used. Read CLAUDE.md and supplied instructions; no CodeGraph index or CE artifact-root config exists here.

Read the full task design history, protocol, design review, source-scope document, full-integration supervisor R1/R2/R3 findings and R2/R3 responses; old isolated supervisor R1/R2/R3 findings and R2/R3 responses; all specified checkout-history R1/R2 source, review, response, freeze and patch artifacts; result-r1 and inventory; both actual run/result/journal/artifact metadata sets and relevant checkout/check/build/native/upload log excerpts. Inspected the current Git helper, `check_pins()` and complete `main()` as source, plus current workflow. This is a full-history bounded compatibility review, not a fresh whole-supervisor or whole-feature reapproval.

Only document/source/log/metadata reads, read-only local Git inspection, JSON data reads, byte comparison, SHA-256 hashing, ZIP directory listing and this receipt write occurred. No reviewed code execution/import/syntax check, build/test/lint/typecheck, DB/probe/fetch, CI/rerun, workflow/pin/source mutation, commit/push, remote operation or delegation occurred. No relevant memory evidence was used. All other edits were preserved.

## Independent composition verification

| Item | Verified SHA-256 |
| --- | --- |
| HEAD workflow / old expected postimage | `e8ff22ffd7e533e392e142e8dd20823e84cbc277e30b041565d51800343b8edb` |
| Current workflow / new expected postimage | `a19d52d896594b6982bf29c15d6f2133c7af3aa5285e7ad809385c5b9f0b283a` |
| Historical freeze archive / HEAD freeze | `458b7bfaf1eacf0d242d74ca6fc930259a73f2fd46f01fb0d3d13f8fc83be64a` |
| Consumed supervisor-freeze-r3.json | `2beda4f8c99d9e35a818981014d1efba8053ffadc1b490ad1a08488ad6e83aa6` |
| Current and HEAD supervisor source | `fcb662b252941cc730f1ff1ddfb2b0fc067fb2b2a1e6098d5b508c2cb4033708` |
| Actual combined diff / checkout-history-r2.patch | `2a328903a13086e2b456e745045995cbf54ba203d56a9480c28e38d3fb88c65b` |
| checkout-history-freeze-r2.json | `103769bb2a13a3519ebf12b9870065b42d2e29f3a6e6ded78a1e88ea86eec9b7` |
| Prior checkout R1 review | `1b598f98981044df988174ebe28a13175b60dc4348aad1b77f61639126d5013f` |
| Retained results inventory | `4c2c7e997ff0c9d062ad926905113f1f19f9497674472315a50fc09c1551d0b5` |

The actual two-file diff is byte-identical to the frozen combined patch, not merely semantically equivalent. It contains only one workflow line and one freeze value replacement. `cmp` against `git show HEAD:docs/validation/001-ci-full-integration-design/supervisor-freeze-r3.json` confirms the archive is byte-identical to the old committed freeze. Historical status text and historical approvals were not rewritten. This receipt supersedes only the old expected workflow postimage for this bounded composition.

All 29 artifact pins, 13 design pins, six baseline input hashes read from BASE Git objects, eight overlay postimages and seven live preimages matched. The five non-workflow live input hashes also matched. The new live helper remains absent, including as a symlink. Baseline workflow hash remains `60786a50329f66a2a65bc7eace1043474319ad6ec4f1aef109875055a4efd0ed`. BASE remains `43599002a0da6e5db887c35cf221d018e6975c77`; local read-only merge-base inspection returns that exact BASE. This local object availability is not evidence about a future runner checkout.

## Prior P2 disposition and API/security assessment

**Checkout R1 P2: resolved at source.** `linux-full-integration.py:1139-1157` still opens the consumed `supervisor-freeze-r3.json`, checks supervisor/artifact/design pins, validates each baseline object, then chooses `workflowPostimageSha256` for the live workflow comparison. The actual selected value is now `a19d52...`, equal to the actual workflow digest. There is no alternate stale freeze path or unchanged self-hash that makes this exact update inherently reject itself. The old `e8ff22...` mismatch is removed without bypassing any guard. Baseline and ancestry checks still run. `main():1216` still calls preflight before source capture, version commands, overlay writes and original workload; nonzero/unavailable original status still cannot return success (`1380-1384`). Approval follows this composition check, not the response's intended fix alone.

Full-history checkout addresses baseline-object/history availability while retaining the existing ancestry requirement for push and PR merge checkouts. Actual future fetch/preflight success remains unverified. The pinned checkout action, `persist-credentials: false`, `contents: read`, ref selection, trigger set and pinned upload action remain unchanged. No public API, credential persistence, permission expansion, arbitrary hash acceptance, new supervisor fetch, or raw publication path is introduced.

Full history expands repository/ref retrieval, network traffic, local Git storage and checkout duration. Those costs are not measured or newly bounded; they consume the same 30-minute job budget and may reduce cleanup time. Neither the job budget nor supervisor's 1800-second ceiling is extended.

The exact diff and unchanged pins preserve one original `bun run test:integration`, root Turbo `^build`, cache policy, eight temporary Linux overlays, resource environment/serial root check, all assertions/deadlines, provisioning 5000 ms and strict 2000 ms stop. No extra build, selected retry or force is added. Root/PID/helper-instance/coordinator/revision/version/admission joins, source-versus-built evidence, ownership before restoration, original exit preservation, finite valid-only publication and success-dependent later gates are unchanged. Upload remains publish-only, three days, hidden files excluded, missing files an error. No scoped API/security defect was found.

## Captured runtime evidence remains incomplete

All 13 inventory entries, including twelve run/log/result/journal/metadata/archive files and result-r1.md, matched their digests. Both archive digests match artifact metadata and captured upload logs; ZIP listings contain only result.json (419 bytes) and supervisor.jsonl (133 bytes).

- PR `37718616829` / job `113120828422`: depth-one checkout of synthetic merge `6341c1b6164b3dba3f79756a43b4876136e6c33f`; archive `346723e9b0d7c44235519dd745bf3d1a0eb5a93eefb3fb45a578042b91caadf9`.
- Push `37718611038` / job `113120809923`: depth-one checkout of `2ac1b2c164380c5da95165d210ecc92ab3bdb309`; archive `f639b6e732ed66e635b331dae7728f42300df3151e2b60c805f57394ea59fbb3`.

Both captured logs show ALL20/500-unit green and 8/8 restore-build success, then supervisor exit 1 and successful two-file upload; later browser/provider steps were skipped. Both results directly report `git_read_failed`, acceptance false, incomplete status, null originalExit/workload/trace/lineage/provisioning, empty source maps and a zero direct-child snapshot. Journals contain only supervisor.end. `restored:true` is the no-application path, not exercised overlay/dist restoration or descendant-lifetime proof. No native suite result may be inherited.

Attribution to the first `git show BASE:package.json` remains an inference from input insertion order and source order, supported by actual depth-one logs. The Git helper suppresses stderr into generic `git_read_failed`; the exact failed invocation was not directly recorded. This correction is not a diagnosis of credential recovery or provisioning.

## Full prior-finding reconciliation and retained limits

1. Old R1 ownership-cap/journal finding: independent emergency cleanup and contained journal failure were accepted in later source; unknown ownership still blocks restoration.
2. Old R1 PID reuse/reaping finding: PID/start-tick lifetimes, pidfds and ambiguous attribution remain. Fast unobserved lifetimes are not proved.
3. Old R1 late bounds/hardlinks finding: post-cleanup inventory, descriptor identity/single-link checks and cumulative publication bounds remain.
4. Old R2 repeated TERM finding: retained independent emergency handles survive TERM/KILL/reap and are visited before further acquisition. Limits remain 256 normal and 4096 emergency attempts/handles plus root; lower OS FD limits remain possible failures.
5. Old R2 root-status theft finding: immediate root identity and unreaped numeric-root fallback preserve Popen-exclusive root status. Old R3 SOURCE approval never proved Linux operation.
6. Full supervisor R1 raw Turbo framing finding: R2 source correction recognizes raw groups/nested summaries and successful build closure. No workload ran in the captured 2ac attempts to validate it.
7. Full supervisor R1 reconstruction expansion finding: compact stage/cost pairs, prewrite budgets, bounded valid prefixes and metadata headroom remain; no raw upload or budget expansion.
8. Full supervisor R1 weak lineage finding: path-sensitive identity/revision/admission/version checks remain, with the two subsequent R2 defects preserved as genuine historical rejections.
9. Full supervisor R2 rootless-flush finding: R3 anchors rootless lifecycle to root-bearing creation and exact built PID/helper instance/coordinator, rejecting contradictory roots.
10. Full supervisor R2 premature settlement finding: R3 separates passing predicate from matched successful revision settlement before later outer cleanup. That boundary proves neither exact settled-await return nor fixture assertions. R3 acceptance remains source-only.

Trace bounds remain 4 KiB/record, 4096 helper events with truncation reserve, 1 MiB/file, 64 trace files/8 MiB aggregate, 32 MiB private console, 80 publication files/12 MiB aggregate and 1 MiB/receipt. Unknown ownership, truncated/missing evidence, forced cleanup and observer perturbation remain limitations. Root/coordinator/revision joins do not turn async event lineage into causal proof; source-content and generation-version hash domains remain distinct. Full-suite capacity, reporter/cache behavior, pidfd/subreaper behavior, descendant coverage, exercised restoration and full trace upload remain unverified. Cancellation can prevent final cleanup/publication.

Accepted feature/remediation source phases remain distinct from PR4 shipping. Both 142 startup reds, three local nonreproductions with reporter-suppressed stages, corrected research and both 0dbb dev/provision reds remain; cap-2/serial resource policy was not a causal fix. The 27da ordinary green retains baseline-adoption and pooler-cancellation skips with diagnostic/upload NOT RUN. At 435, PR remains 275/2/2, including original dev.test.ts:234 credential recovery `active.version !== second` after restored credentials and provisioning 5000 ms; push remains 276/2/1 at provisioning. This is not the later malformed-edit failure-null wait. No assertions or deadlines were relaxed, and no flake/cold-loader/peak-89-worker cause is established.

**Terminal verdict: APPROVED SOURCE ONLY; no outstanding scoped P1/P2.** Only this receipt was written. Separate remote authorization and actual evidence remain required; no execution or shipping acceptance is conveyed.
