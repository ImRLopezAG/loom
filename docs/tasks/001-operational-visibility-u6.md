---
feature: 001-operational-visibility
unit: U6
status: in-progress
---

# Consumer documentation and release validation

Plan: [U6](../plans/001-operational-visibility.md#u6-consumer-documentation-and-release-validation-source-phase5).

Dependencies: U5 accepted.
Ownership, requirements, test scenarios and acceptance: preserve the referenced unit and its source phase verbatim. Begin with observed failing proof for new behavior. Host owns canonical verification and commits; workers own explicitly assigned files only.

## Acceptance and owned scope

**Goal/requirements:** R1-R5; usable documented public API and independently accepted delivery.
**Dependencies:** U5 accepted.
**Files:** scoped operating-limits/dev usage docs; `packages/e2e/integration/packed-consumer.test.ts`; owned plan/task/evidence artifacts.
**Approach:** correct measurement caveats; packaged API/type imports under Bun and Node24, existing browser isolation tests; exact owned staging only.
**Test scenarios:** source phase5 gates, clean packed consumer type contracts, browser boundary, unchanged disabled behavior, root checks/lint, review regression cases.
**Verification:** independent code/implementation/API/security reviews, all gates, PR registered and CI decided. No merge.

Local gate evidence and independent phase review: approved. Full-branch review/delivery and commit receipt: pending.
Canonical execution is now recorded in [the U6 receipt](001-operational-visibility-u6-canonical.md). Independent phase review R2 approved the exact source and local evidence; full-branch review, commit receipt and PR/CI remain pending.

## Simplification receipt

All three fresh Astra-low U6 simplification outcomes were consumed: quality0, efficiency0, reuse1. Applied the reuse finding by replacing the packed snippet's mutable resolver capture with `Promise.withResolvers<void>()`, preserving timing and ordering on Bun/Node24. No production behavior changes. Reviewers verified the original HEAD and source hash; some additional context reads were blocked by host process exhaustion, retained as a review limitation. Runtime/type/browser checks remain unexecuted pending a new coordinator window. An attempted shell journal append failed before process creation (OS error35); this receipt supersedes that unwritten update. Fresh exact-tree independent review and canonical checks still required; no U6 acceptance or commit.

## Current execution

U5 accepted in46f81009292a0558bf970a81909e4ed82d5c6df6 after fresh final-phase R3 approval and canonical native/collector evidence. Parallel T3 implementation workers from that clean baseline: `001-u6-docs-v1` owns only operating-limits runtime measurements plus docs-site development diagnostics usage; `001-u6-packed-consumer-v1` owns only packed-consumer.test.ts. Neither may build, install or execute broad/native/browser/collector checks while the shared window is released. No runtime changes planned. Host owns task/journal, review and later canonical verification. Public package characterization is separate from source-import tests.

Source changes and a later U6 verification window were requested from root before edits; root/005 received accepted U5 commit. All U6 acceptance remains pending.

Both implementation workers completed and were consumed. Host inspected actual three-path diffs: packed-consumer adds140lines with zero deletions, documentation edits stay in offered sections. No production behavior changed. Public declaration/lifecycle/JSONL/privacy and browser bundle assertions remain UNEXECUTED. Host diffcheck0 and target doclink existence verified. Temporary OSerror35 prevented some initial readonly reads; retry succeeded after waiting, without killing processes. Three fresh read-only simplification passes launched for packed-test additions only; docs excluded as noncode. Source frozen at packed33601c817b2fadb869b471b235df59c2e7a0214d5a148506d1203051a8a52727, operatinglimits9f7ef01467b40139c37bdc94affe585f4fee416cf768b6c62c40a554a241ebb2, development1fba897de098efd839b489b5cd8dd33191bef1389507b1832af3cca253c84b61.

Bounded Luna pinned-runner research found documented vp test --maxWorkers support but no documented envcap for unchanged rootcheck, whose Turbo passthrough would send test-only arguments to all namedtasks. Reported to coordinator; no script/config/testscope altered. Rootcheck strategy remains to resolve before execution, not a waived gate.

## Post-restart source review and runner configuration

User resumed source-only work after host restart. Root retains the exclusive broad/DB window; no new U6 runtime, packed, browser, collector or broad checks were launched. The three historical `/tmp/kello-001-u5-{full-unit,native,collector}-r1.log` files are now absent. Their prior inspection and results remain historical committed/reviewer/coordinator receipts, not currently readable logs or fresh execution.

Fresh independent Astra-low task `node:delegated-task:command%3Amcp%3A87cebed3-59b5-43b7-b084-354a82cfbcc0%3Adelegate-task%3A001-u6-api-docs-source-review-r1` completed **APPROVED FOR SOURCE ONLY**, no concrete P1/P2 findings. The reviewer verified HEAD and all three hashes before and after bounded read-only inspection; no execution, edits or nested reviewers. Documentation matches accepted privacy/configuration/measurement/lifecycle behavior, and packed additions preserve existing assertions, deadlines, clean installation and native inference. Host reverified unchanged hashes: packed `0ffc23ac92927a90b01756ae0b115c1a8a25fa8f1fa4d7c4d3278954f2729d33`, limits `9f7ef01467b40139c37bdc94affe585f4fee416cf768b6c62c40a554a241ebb2`, development `1fba897de098efd839b489b5cd8dd33191bef1389507b1832af3cca253c84b61`. This is not U6 phase acceptance or full ce-code-review.

The earlier research conclusion about no environment cap was incomplete. Installed Vitest5.0.1 `dist/chunks/index.DzobfTyw.js:14518` explicitly reads `VITEST_MAX_WORKERS`. A bounded Node24.21.0 `resolveConfig({ config:false, watch:false }, { configFile:false })` probe with `VITEST_MAX_WORKERS=2` exited0 and returned maxWorkers2/projects1; it started no test runner or server. Initial probe with `projects:[]` exited1 because the empty project definition is invalid; removing that unnecessary override corrected the config-only probe. Installed Turbo2.11.6 bundled README and run reference confirm `--env-mode=loose` forwards all environment variables. Future granted rootcheck can preserve its named tasks and use this environment cap plus Turbo concurrency1; no test-only flag forwarding to build/typecheck/static tasks, no repository configuration changes. Fresh execution must avoid counting cached results as new acceptance. Rootcheck itself remains unexecuted.
