# Temporary workflow cleanup: source review scope

Coordinator explicitly accepted ordinary CI on exact 27da659c only, preserving named skips, prior reds and no causal-fix claim. Authorized removal is exactly the inverse of docs/validation/001-ci-linux-design/workflow-proposal.patch: remove native step id and the two temporary diagnostic/upload steps, 13 lines total. No live overlays were applied. All frozen design artifacts, supervisor originals, rejections and review receipts remain unchanged.

Resulting .github/workflows/ci.yml is byte-identical to accepted 0dbb4387 workflow: git blob 067f816dca1b86aec7f9f54226057191280a2d3f, SHA256 60786a50329f66a2a65bc7eace1043474319ad6ec4f1aef109875055a4efd0ed.

Preserve VITEST_MAX_WORKERS=2, loose env, concurrency=1, original ALL20 graph, install/cache/native/packed/browser/provider-report gates, versions/service/permissions, all assertions and deadlines. Existing loose-env inherited visibility and runtime env not automatically cache-accounted tradeoffs remain accepted. Removing unused failure-only instrumentation neither proves nor fixes original timeout causes.

Historical CI receipts alongside this file record PR37710835037 and push37710829782: each root20/20, 500 units, integration277pass2skip0fail, browser14pass0fail. The two skips are baseline adoption and pooler cancellation; neither is successful evidence. Diagnostic and upload steps were SKIPPED, artifact inventories empty, hence Linux supervisor execution, source/dist restoration and owned-descendant audits remain NOT RUN / UNVERIFIED. No forced failure or unchanged-head rerun is proposed.

Earlier 0dbb CI integration276/2/1 and275/2/2, 142 startup failures, three macOS nonreproductions without stage deltas, corrected sole research, and all supervisor review history remain. R1 rejected cleanup/journal cap, PID lifetime/reaping and late trace bounds; R2 rejected TERM budget depletion and Popen status theft; R3 approved source corrections dcb5338b without runtime proof. All observer/correlation/4096-descriptor/OS-limit/incomplete-ownership limits remain disclosed.

Commit scope after approval: workflow plus exact files under docs/validation/001-ci-linux-results (raw GitHub logs/jobs/artifact inventories, immutable receipt/hash inventory, this scope and source review receipt/freeze). Historical receipt.md describes its original snapshot when the temporary tail still existed; this document records the subsequent authorized removal. New head requires authoritative full CI; 27da green is not transferred automatically.

ROOT remains sole local runtime owner. No local imports, syntax execution, tests, builds, types, lint, DB probes or browser/collector work is authorized. Source/hash/git inspection only. No merge, second PR, provider operation or forced failing CI run.
