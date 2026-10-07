# Operational visibility phase and acceptance journal

## 2026-10-07 — Planning accepted for execution

Worktree: `/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility`; baseline `1590e4ec272cf4fc32bcaeb7123d94b2ac789fa1`. No CodeGraph index. Source provenance is in the refined plan. Only owned files may be committed.

Applied plan-loop, lfg, ce-plan mode:pipeline and ce-doc-review mode:non-interactive. Product acceptance unchanged. User authorized implementation and shipping; no production changes or merge authorized.

Review receipts use task ID prefix `node:delegated-task:command%3Amcp%3A40ead648-2078-4138-b285-f034f18910d1%3Adelegate-task%3A` and these suffixes. All completed on codex/gpt-6-astra, reasoning low:

| Suffix | Result | Disposition |
| --- | --- | --- |
| 001-plan-coherence-reviewer-r1 | P2 versioned shape omitted mandatory loss branch | Retained; corrected the exported union to include runtime, deployment and diagnostics.loss with cumulative DiagnosticsStats. Otherwise typed consumers could reject valid emitted loss records. |
| 001-plan-feasibility-reviewer-r1 | Approved, no findings | Accepted; implementation and runtime gates remain pending. |
| 001-plan-security-lens-reviewer-r1 | Approved, no findings | Accepted. |
| 001-plan-scope-guardian-reviewer-r1 | Approved, no findings | Accepted. |
| 001-plan-adversarial-document-reviewer-r1 | Approved, no findings | Accepted. |

Resolved review: fixes_applied=1, proposed_fixes_count=0, decisions_count=0, fyi_count=0. Correction is directly supported by the existing loss-record requirement and authorized draft revision. Supplemental other-provider pass was not run: user prescribed codex/astra independent reviewers.

Research receipt `001-planning-research-v1` completed on codex/gpt-6-luna low. Pinned Effect APIs inspected; real collector and PostgreSQL acceptance are separate and pending. Docker availability is infrastructure evidence only.

## Acceptance ledger

| Unit | Implementation | Phase tests | Independent review | Commit |
| --- | --- | --- | --- | --- |
| U1 | Complete | 11 tests/build/types/lint passed | Approved r1 | U1 changeset |
| U2 | Complete | 41 tests/build/types/lint/native4 passed | Approved r5 | U2 changeset |
| U3 | Pending | Pending (disposable PG18) | Pending | Pending |
| U4 | Pending | Pending (actual collector) | Pending | Pending |
| U5 | Pending | Pending | Pending | Pending |
| U6 | Pending | Pending (packed consumers/browser/root/CI) | Pending | Pending |

Shared contract: initial 68 series, maximum128; 005 owns atomic17-series extension to85 and cleanup-operation unit{event}; 004 adds no telemetry variants. No metadata migration. Root received planned shared file changes before implementation. Reviewed baseline handoff to root/005 is pending U1 acceptance; mapping acceptance remains a later gate.

## U1 preparation and infrastructure

Planning commit: `4e42917b`. Worker task suffix `001-u1-projection-v1`, codex/gpt-6.1-sol medium, owns types/project and one unit test only. Read-only native acceptance researcher suffix `001-native-acceptance-research-v1`, codex/gpt-6-luna low. Host retains all builds, commits and canonical verification.

`bun install --frozen-lockfile` exited0; 1165 packages installed, Bun1.4.2. Installed Effect4.0.0, TypeScript7.0.2 and Turbo2.11.6 verified. Read installed Turbo docs/README and running-tasks docs before any Turbo command. `vp test run --help` (Vitest5.0.1) confirms `--maxWorkers`; use2 for suite runner.

Disposable PG command: `docker run -d --name kello-001-pg18-visibility --label kello.feature=001 --label kello.disposable=true -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=kello001 -p 127.0.0.1::5432 postgres:18`. Container ID `9873e3f6ade983850d869982d511e2a2ac939ac188d2c954573cd97f917dd53a`, port127.0.0.1:32774. `docker exec kello-001-pg18-visibility psql -U postgres -d kello001 -Atc 'select version()'` exited0: PostgreSQL18.6 Debian18.6-1.pgdg13+2/aarch64. Disposable URL has no password: `postgresql://postgres@127.0.0.1:32774/kello001`. Only this feature container may be cleaned up by this thread. Infrastructure only; native acceptance pending.

`docker pull otel/opentelemetry-collector:0.156.0` exited0, digest `sha256:0beba82d63792511591522a8d582904b9a8ae81710357bfcab731607b8b0ffe2`. Collector is not yet launched and wire acceptance remains pending.

Collector launched with mounted `/tmp/kello-001-collector/config.yaml`: otlp/http receiver0.0.0.0:4318, debug exporter verbosity detailed, metrics pipeline. Exact launch: `docker run -d --name kello-001-collector --label kello.feature=001 --label kello.disposable=true -p 127.0.0.1::4318 -v /tmp/kello-001-collector/config.yaml:/etc/otelcol/config.yaml:ro otel/opentelemetry-collector@sha256:0beba82d63792511591522a8d582904b9a8ae81710357bfcab731607b8b0ffe2 --config=/etc/otelcol/config.yaml`. Container `bbf63593ed135bad9fb4d30cc84bedcfcc32cd3d3d808ea42c9e03c4d2e71153`; published127.0.0.1:32775, metrics endpoint `/v1/metrics`. Logs verify0.156.0 and ready state. No data acceptance yet.

Pre-implementation `bun run --cwd apps/loom build` exited0 (existing Zod CommonJS declaration/use-client bundling warnings); `bun run --cwd apps/loom typecheck` exited0 for Bun/Node/browser projects. These baseline checks precede the U1 implementation and do not accept its contract.

Native fixture research completed: use built-tooling child native router/server plus real PG runtime/replacement regressions; launch CLI actual routing separately for both signals. Parent must only read child artifact; parent-only published canary absent. Direct named `bun test` avoids package script's whole-directory selection. Research-only evidence, no gate executed.

## U1 implementation and canonical checks

Worker `001-u1-projection-v1` completed. Changed types.ts/project.ts/diagnostics.test.ts only; behavior_changed=true. Existing tests inspected: realtime-metrics, effect-runtime, rpc-contracts, release-receipt. Exact red: `./node_modules/.bin/vp test run packages/tests/unit/diagnostics.test.ts --maxWorkers=2 --no-cache --configLoader=runner` exited1 before production code (missing project module,0tests); afterward11tests passed. No synthetic historical red claimed. No session/CLI/metrics/005 work built.

Host canonical `bun run --cwd packages/tests test unit/diagnostics.test.ts --maxWorkers=2` exited0,11tests. Package build exited0 (log `/tmp/kello-001-u1-build.log`), all3package typecheck targets and packages/tests typecheck exited0. Scoped lint initially rejected two assertion comments lacking literal SAFETY; comments corrected with checked invariant intact and no behavior change. Fresh independent reviewer `001-u1-contract-review-r1` codex/gpt-6-astra low pending. U1 remains review status until result consumed and resolved.

U1 independent review `001-u1-contract-review-r1`: APPROVED, no consequential findings; verified all variants/fields/enums, safe own descriptors and fresh copies, type exhaustiveness, loss record union and bounded work. Reviewer did not rerun host checks. Scoped lint rerun exited0. U1 accepted; session and exporter gates remain pending.

## U2 started

U1 committed `0eff2ca8`, reviewed types/projector contract relayed to root and005. Worker `001-u2-session-v1` codex/gpt-6.1-sol medium owns session/output/index, tooling exports and diagnostics unit tests; U1 types/project accepted. Read-only sink researcher `001-output-cancellation-research-v1` codex/gpt-6-luna low prepares U3 cancellation/file details. All canonical verification remains host-owned.

Native baseline against disposable PG18: from packages/e2e, `LOOM_TEST_DATABASE_URL=<feature disposable target> bun test ./integration/dev-server.test.ts ./integration/dev-replacement.test.ts ./integration/dev-runtime.test.ts` exited0:8passed,0failed,0skipped,3files. This proves fixture availability and unchanged baseline; U3 integration acceptance requires rerun after wiring.

Sink research `001-output-cancellation-research-v1` completed read-only. Pinned Node24/Bun1.4.2 declarations support FileHandle.open(wx,0600), partial-write loops, close-on-settlement and stderr callback+drain observation. API design must check abort before each submission/after awaits and remove listeners on settlement; submittedOS bytes cannot be revoked. These are design inputs, not executed sink acceptance. Actual local Node version `v24.21.0`, Bun `1.4.2` verified.

U2 worker complete:21new session tests plus11projection tests passed. Actual red1 missing diagnostics entrypoint (11pass/1fail); actual red2 reentrantstop promiseidentity (27pass/1fail), then fixed. Host32tests/build/3package types/testtypes passed; lint exited0 with newArray stylewarning. Independent reviews `001-u2-lifecycle-review-r1` and `001-u2-api-security-review-r1` running (astra low).

Host adversarial regression `loss reporting preserves sequence order across a pending ingress drain` reproduced red: output sequence1..64,129,65..128 because loss reporting bypassed ingress. Named-test run exited1;32other cases filtered, not accepted as a full gate. Fixed by queueing loss records through same bounded ingress with saturation accounting, preserving observation sequence. Full33test rerun pending.

## U2 review corrections and second review

Round1 lifecycle and API/security reviewers both REJECTED the same two P2 defects: loss records overtook queued ingress; reentrant stop inside an input proxy descriptor trap allowed later accounting/timer scheduling. Host reproduced the loss ordering failure and four runtime/deployment × valid/invalid reentrant-stop failures before corrections. Loss records now traverse the same bounded ingress; both channel callbacks recheck running state after projection. Writer documentation now explicitly states that already-submitted I/O and an uncooperative writer's deferred side effects remain caller-owned. Array initialization style warning removed.

Exact corrected tree: diagnostics unit suite37passed,0failed,0skipped; package build, all3app type targets, test consumer typecheck and scoped lint actualexit0. Build log `/tmp/kello-001-u2-fixed-build.log`. Fresh independent rounds `001-u2-lifecycle-review-r2` and `001-u2-api-security-review-r2` launched on codex/gpt-6-astra low with original brief, prior findings, fixes and red/green evidence. U2 remains review; U3 implementation remains gated.

Root reported combined accepted U1 integration validation: exact source0eff2ca8 incorporated as7512dfd4, planning3340b3c6, evidencef7ac4f69; fresh Astra compatibility approved, build/types/scopedlint passed, explicitNode24.21.0 maxWorkers2 fullunit86files390tests zero skips exit0. This is root-reported combined U1 evidence only, not U2 or exporter acceptance. 006 execution-safety changes remain proposed; no new dependency adopted.

Round2 lifecycle APPROVED; API/security REJECTED a further P2: Promise.resolve can invoke a writer promise's constructor getter that calls stop, clearing the mutable settlement argument before observeWrite receives it. Host executed a built-package native Node reproduction: two constructor reads and unhandled TypeError reading undefined.done, exit1. The Vitest source matrix did not reproduce the unhandled exception (four added normalization cases passed even before the fix); this is not claimed as regression red. Native reproduction is `/tmp/kello-001-normalization-repro.mjs`, expanded afterward to resolve/reject × replacement/no replacement. Fix captures a stable settlement object before normalization; stop still detaches its callbacks. Full diagnostics source suite41passed zero skips and rebuilt package exit0. Build and typecheck must remain sequential: an accidental concurrent typecheck saw temporarily removed dist declarations and failed TS2307; rerun only after build completion, with no source workaround.

Native built Node matrix after fix:4cases,errors[],exit0. Fresh post-build all3app typecheck and consumer typecheck exit0; scoped lint exit0 no warnings. Fresh combined lifecycle/API/security reviewer `001-u2-final-review-r3` (codex/gpt-6-astra low) receives original brief and both prior-round findings/responses; pending acceptance. U2 is not accepted until this exact final tree is reviewed.

Review task001-u2-final-review-r3 terminated with provider capacity error; no verdict and no acceptance. Fresh required-model retry001-u2-final-review-r4 launched with full original brief and prior findings/responses. Source/test tree unchanged.

Read-only research001-u4-effect-spike-research-v1 completed: pinned Effect4 MetricRegistry requires a fresh provided Map for every update/snapshot; MetricsData is exported payload type (prior phrase typedMetricsData meant a typed literal, not an API symbol). Layer.build in a scoped Effect can obtain OtlpSerialization.layerJson; inspect HttpBody variant to obtain actual bytes. Histogram cumulative finite counts need differencing and a final remainder bucket. Research sample's unit attribute is not an accepted mapping: units belong on OTLP instrument metadata; RPC attributes remain exactly mode/status. No runtime/global-isolation/collector acceptance claimed, and no U4 code written before U3 gate.

Round4 REJECTED one further P2: caller promise constructor getter calls stop and throws, preventing Promise.resolve from attaching any handler; late rejection unhandled. Reviewer executed nativeNode24 reproduction. Host independently confirmed both Promise.resolve and intrinsic Promise.prototype.then.call throw for a nonconfigurable throwing constructor; original late rejection remains unhandled. Read-only researcher001-promise-containment-research-v1 examines standard public API feasibility; root notified of possible executable-writer contract boundary. No unsupported promise mutation/global rejection handler introduced and no acceptance scope silently changed.

## Explicit supported-writer observation boundary (pending independent approval)

Research001-promise-containment-research-v1 completed. ECMAScript2025 `Promise.prototype.then` performs SpeciesConstructor before PerformPromiseThen: https://tc39.es/ecma262/2025/multipage/control-abstraction-objects.html#sec-promise.prototype.then . PromiseResolve reads a native promise's constructor before adoption: https://tc39.es/ecma262/2025/multipage/control-abstraction-objects.html#sec-promise-resolve . Intrinsic then.call, await, wrapping/adoption and Promise combinators cannot guarantee observation of an original native promise with a nonconfigurable throwing constructor. Mutation only repairs some configurable examples; global exception handlers/native instrumentation are excluded. No alternative standard algorithm found.

Native Node24.21.0 boundary reproducer (executed failure, not a skipped acceptance test):

```js
const pending = Promise.withResolvers();
Object.defineProperty(pending.promise, 'constructor', {
  configurable: false,
  get() { throw new Error('constructor blocked'); }
});
for (const attach of [
  () => Promise.resolve(pending.promise),
  () => Promise.prototype.then.call(pending.promise, () => {}, () => {})
]) {
  try { attach(); } catch (error) { console.log(error.message); }
}
pending.reject(new Error('late'));
```

Without an external diagnostic observer Node exits1 for late rejection. Host diagnostic run printed two `constructor blocked` errors and `unhandled late`; reviewer independently confirmed the adapter case with getter invoking stop before throwing exits1. This negative evidence remains a documented unsupported boundary.

Coordinator explicitly permits a narrow precondition subject to fresh independent API/security review. Proposed public JSDoc: “Returned promises must allow standard settlement observer attachment. Subclasses, getters and reentrancy are supported when observation remains possible. If custom constructor/species/then behavior prevents observation, the adapter cannot consume a later rejection; that unhandled-rejection risk remains caller-owned.” Added explicit plan clarification ahead of unchanged source appendix. No blanket subclass/getter/reentrancy exclusion; no caller promise mutation/global exception handlers; all compliant cancellation and channel payload gates unchanged. U2 still pending review.

Fresh API/security full-U2 review001-u2-api-security-review-r5 launched on codex/gpt-6-astra low with original brief, all prior findings/fixes, exact negative native evidence, researcher conclusion and coordinator authorization for the narrow observation precondition. Revised JSDoc scopedlint and diffcheck exit0. No runtime changes since41test/native4case green. 006 MigrationAssessment contract remains proposed/review-gated; 001 adopts no unpublished interface and retains narrow future CLI ownership.

U2 final review001-u2-api-security-review-r5 APPROVED full exact tree including observation precondition. Reviewer independently executed native4case green, unsupported-boundary redexit1, and diffcheck; host41unit/build/all3app types/testtypes/lint green remain separately attributed. All consequential findings resolved by three runtime fixes plus the explicitly authorized/reviewed boundary clarification. U2 accepted; U3-U6 pending. Accepted wording and receipt sent to root before acceptance commit.

U2 canonical commitcbcdb725 sent to root. U3 disjoint wave from clean committed baseline:001-u3-cli-v1 owns CLI/dev/output sink helpers/dev-cli tests;001-u3-native-tests-v1 owns only new e2e/integration/diagnostics.test.ts, native childRPC/replacement/parent separation and durable nativeNode observation regressions. Both codex/gpt-6.1-sol medium; no builds/index/commits/sharedhiddenwrites; host canonical verification after wave. 006 docs-only0bcec632 inspected, runtimepending; no sibling changes imported.

Root-reported U2 combined-checkpoint receipt: originalcbcdb725 integrated conflict-free ase14109d8; fresh Astra compatibilityR1 APPROVED exactnineblobs/othernativecontracts. Root build/all3app+consumer+e2e types/scopedlint/diff exit0; explicitNode24 maxWorkers2 fullunit89files456tests0skip170.29s; ownPG18 search/selective14tests83assertions0skip24.37s; native4case errors[]; packed2tests0skip40.27s with native inference modes/browserbundle. Evidencecommitc9480d8c and root docs/tasks/000-001-u2-integration.md. These are root-reported compatibility results, not 001U3/exporter/collector/mapping/full-feature acceptance. No rootCLI edits/providerwrites;006runtime stillpending.

U3 native test worker001-u3-native-tests-v1 completed, changed only new packages/e2e/integration/diagnostics.test.ts; behavior_changed=false (test characterization of accepted API). Inspected dev-server/dev-cli/unit diagnostics and native normalization reproduction. Added5 public built-package tests: Bun child6nativeRPC calls across3generations, exactcounts/parentcanaryabsence/shutdown; Node24 resolve/reject×replacement matrix. Initial execution selectedNode26 and failed environment/runtime requirement, not behaviorred. Focused command with PATH=/Users/angel/.vite-plus/js_runtime/node/24.21.0/bin:$PATH passed5/5 exit0, Bun1.4.2/Node24.21.0. Host inspected actual newfile; canonical waveverification awaits CLIworker, with no workerbuild/install/commit. U3 remains in-progress.

Host concurrent read-only U3 sink probe (worker still active, not final acceptance): Bun1.4.2 importing current source writeStderrOutput, native Writable stores pending callback, abort signal, await rejected writer, then callback(Error('late-stream-error')) -> process exit1 uncaught late-stream-error. This confirms a cancellation/error-listener lifetime defect in the intermediate sink. Preserve worker ownership until handoff; add regression/fix afterward if not already resolved. No source edits made by host during worker ownership.

U3 CLI worker001-u3-cli-v1 completed and task_status consumed: four assigned paths only; 8 tests passed in15.59s, actual routing/helper/startup/common-budget reds retained in worker receipt. Host then added native Writable late-error regression: focused run failed exit1 with late-stream-error before fix. Cancellation now rejects promptly but retains the submitted operation's error observer until callback/error settlement; drain/abort listeners detach immediately. Focused stderr2tests passed. Original submitted OS I/O remains non-revocable; no global handler added.

Host first combined U3 verification: build exit0; all3app configurations, consumer and e2e typechecks exit0; diagnostics41unit passed with explicitNode24/maxWorkers2; CLI/native/PG18 dev-server/replacement/runtime suites22tests across5files passed0skip in23.43s. Existing PG recovery/activation assertions executed on owned PG18 container. Scoped lint initially exited0 with six warnings: unsafe-finally throw, two floating stdin operations, three unbound-method references. Fixed with deferred cleanup-failure propagation (original startup failure still wins), awaited stdin operations and this:void annotations. Final verification after these small fixes is pending.

Applied ce-simplify-code to exact U3 diff as phase-boundary preparation, preserving accepted U1/U2 and settled plan decisions. Fresh T3 codex/gpt-6-astra low review tasks001-u3-simplify-code-reuse-r1,001-u3-simplify-code-quality-r1,001-u3-simplify-efficiency-r1 carry full persona assets and read-only scope; outcomes pending. U3 remains in-progress, not accepted; U4-U6 remain gated.

U3 simplification terminal receipts consumed: reuse and efficiency report no findings; quality suggests replacing deferred stopFailure with a throw inside finally. Host declines that single low-value suggestion because that exact earlier form triggered the configured no-unsafe-finally lint warning; current form preserves error precedence with clean lint. Applied counts reuse0/quality0/efficiency0, skipped1. No safety checks removed. Final rebuild exit0; final all3app/consumer/e2e types and scoped lint exit0/no warnings. One attempted lint overlapped build's transient dist removal and produced TS2307; rerun after build passed unchanged (verification scheduling error, not source regression).

Follow-up full U3 native run:20pass2fail,0skip in34.79s. Both Node resolve children hit their existing5s watchdog with exit137 and empty stderr; reject children passed but slowed to3.1/3.4s versus1.5s prior. CLI, nativeRPC, PG recovery/replacement all passed. No acceptance claim; unchanged isolated native suite rerun underway to distinguish host load from lifecycle regression. Initial all22green remains a separate earlier receipt.

Unchanged isolated native suite passed5/5 in5.74s (fourNode cases1.28-1.43s). ExplicitNode24.21.0 import-only kello/tooling baseline measured2199ms under shared load. Final unchanged combined CLI/native/PG18 suite passed22/22,0skip in23.57s; no timeout/assertion changes made. This supports shared-load timing as the cause of the intervening two watchdog failures, not proof that such load can never recur. Final U3 build/type/lint gates are green. U3 status review; fresh independent lifecycle/implementation and API/security reviews next.

Independent U3 lifecycle review001-u3-lifecycle-review-r1 REJECTED full phase for one concrete coverage gap: repeatedfailedCLIedits and healthyreplacement do not prove failed-watched-edit recovery to ready/nativeRPC. Other U3 criteria approved, no consequential implementation defect found; reviewer independently passed4sinktests and5native tests. Existing PGfixture was incorrectly treated as recovery evidence in earlier host summary: it proves successful generations/activation, not the failed-edit transition. Corrected that interpretation; no acceptance/commit. Worker001-u3-recovery-coverage-v1 (codex/gpt-6.1-sol medium) owns only existing dev-runtime.test.ts, extending realPG/native watched recovery and diagnostics accounting; preserve all existing tests, no productionseam/mockruntime or shipping. Fresh exact-tree review follows host verification.

Independent U3 API/security review001-u3-api-security-review-r1 APPROVED reviewed tree with no consequential findings; independently4sink+5native tests and diffcheck passed. Its statement that preservedPGtests prove recovery relies on the same overbroad host evidence and does not override lifecycle review's concrete missing-transition finding. Acceptance remains withheld until added recovery proof and fresh exact-tree review. No production source changes requested by either review.

Recovery worker001-u3-recovery-coverage-v1 completed only dev-runtime.test.ts. Existing fixture/assertions preserved. Built public diagnostics wraps actual startProjectDevelopment with filesystem watcher and realPG18; native HTTP RPC succeeds beforefailure, during retained-oldgeneration failure, and after validsave returns changed ['recovered'] result/newversion. Exactly3 RPCevents, zero losses/failures, contiguoussequence, removedsubscribers and no poststop mutation asserted. Worker focusedPGtest1pass0fail0skip +e2etypes/diffcheck passed. Characterization of previously uncovered behavior, no claimed runtimebehaviorred. Host inspected full diff and launched combined verification before fresh R2 review.

Host post-recovery exact-tree checks: e2e typecheck and scoped dev-runtime lint exit0/no warnings; combined5file CLI/native/PG18 suite22pass0fail0skip in20.61s, including new filesystem-watcher failed-edit recovery and exact3nativeRPC diagnostic events. Production code unchanged from prior build/app/consumer/41unit green. Diffcheck0. Fresh combined lifecycle/implementation/API/security R2 review requested with original brief, priorcoverage objection, bothR1 verdicts and concrete correction; no acceptance until terminal receipt.

U3 fresh R2 review REJECTED combined regression stability: prior recovery gap resolved and all implementation/API/security criteria approved, but reviewer combined run21pass1fail0skip27.95s failed newly added post-recovery expectConnections(1); unchanged isolatedPGtest passed2.93s. Failure lacked observed count. Host preserves expectation/deadline, adds owned-role pg_stat_activity detail on failure and reruns exact combined command; bounded read-only Luna research001-u3-pg-pool-research-v1 traces native pool/background lifecycle invariants. No acceptance/commit or timeout/count weakening; exporter gates remain closed.

U3 R2 diagnosis: added failure-only pg_stat_activity detail; unchanged combined run22pass0skip21.97s did not reproduce. Luna research001-u3-pg-pool-research-v1 inferred exact1 valid after retirement, but host native reproduction disproves that inference: hold ACCESS EXCLUSIVE fixture jobs lock, wait actual worker query Lock state, execute recovered native RPC concurrently, rollback; original exact1 failed with two idle ClientRead backends, last queries worker claim and RPC commit, 0pass1fail5.17s. Pool max4/idleTimeout30s retains concurrent connections; one runtime is not one backend. No production bug inferred. Durable test retains controlled overlap, captures old-generation backend PIDs before valid save, asserts two active pooled connections with no previous PID, preserves all original connection counts and final zero. Actual failed-edit recovery and exact3RPC accounting unchanged. Host combined22pass0fail0skip20.80s; fresh review required. No timeout relaxation, no test removal, no API changes. Root informed with exact causal evidence.

U3 final independent001-u3-final-review-r3 APPROVED no consequential findings. Native controlled overlap/old PID retirement correction explicitly accepted; every original assertion and final zero preserved. Independent combined22tests0fail0skip23.07s/diffcheck0; reviewed HEADcbcdb725 tracked binarydiff SHA256d687b2bc6b1a8f0c53031914c4befacb40e8fd7e2bdd80f74ec14d45399950d3 and diagnostics.test.ts79fdff99ff86a1e5a435b2449ad926ec47c2d3bf22869ce9c0de5e1ee616ac66 unchanged during review. Host e2etypes/scopedlint also0. No production edits after reviewed tree. U3 accepted and exact8ownedpaths committed; U4-U6 remain pending.
