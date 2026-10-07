---
feature: 001-operational-visibility
unit: U5
status: done
---
# Complete bounded exporter

Plan: [U5](../plans/001-operational-visibility.md#u5-complete-bounded-exporter-source-phase4).

Dependencies: U4 accepted.
Ownership, requirements, test scenarios and acceptance: preserve the referenced unit and its source phase verbatim. Begin with observed failing proof for new behavior. Host owns canonical verification and commits; workers own explicitly assigned files only.

## Acceptance and owned scope

**Goal/requirements:** R3,R5; complete fixed68 mapping and explicit opt-in.
**Dependencies:** U4 accepted.
**Files:** diagnostics `metrics.ts`, `otlp.ts`, `session.ts`, `types.ts`; CLI telemetry routing; diagnostics unit/OTLP integration tests.
**Approach:** KTD4; enumerate fixed tuples, cumulative retry without queues, bounded final flush and lazy import only when enabled. Provide reviewed mapping commit to005; it owns subsequent atomic extension.
**Test scenarios:** all source phase4 failure statuses, malformed/oversize/partial responses, safe accumulator overflow, 68tuples/54counters/14histograms,128series ceiling and maximum-value encoded byte bound, outage recovery, concurrent starts, output failure independence and disabled network/secret reads.
**Verification:** all source phase4 gates and collector mapping evidence.

Evidence: canonical U5 gates passed on the frozen implementation below. Independent review: final R3 APPROVED. Commit: this owned U5 checkpoint (mapping slice remains fca49c2a).

## Current acceptance ledger

| Gate | Authoritative evidence / remaining work |
| --- | --- |
| Fixed schema, tuple budget, maximum-value encoded budget | Bounded mapping commit fca49c2a and independent approved receipt in the mapping task; this does not prove collector decoding. |
| Integrated session ownership, losses, output independence, outage and bounded stop | All cases included in canonical88file492test unit run, zero skips89.87s. |
| Transport response/status/redirect/size/interval/shutdown behavior | Canonical47 transport cases pass0skip3.84s, including explicit shutdown disconnect; full unit regression also passes. |
| Actual collector schema/aggregation | Corrected exact68 tuple oracle passes with pinned collector0.156.0; complete5case integration passes0skip19.49s. R1 rejection retained; both R2 source reviews approve correction. |
| Disabled consent and enabled CLI/native RPC behavior | Fresh build followed by25 native cases passes0skip44.95s; integrated telemetry/nativeRPC also passes in collector suite. |
| Public package and test types | Final U5 build/all3app type projects/both test-package typechecks exit0 on unchanged source. |
| Shared PG regressions | Actual kello_test/180006 native regression passes; all owned schema/role families audited empty before and after. No feature database/server created. |
| Independent full-phase acceptance | Final source/evidence review001-u5-final-phase-review-r3 APPROVED, no P1/P2 findings. Ten implementation hashes reverified unchanged before commit. |

The plan's Verification Contract explicitly permits direct Bun invocation for named integration files, avoiding accidental execution of the entire integration directory through the package script. Preserve the same cases/assertions and required package checks. U6 remains dependency-gated on U5 acceptance; no packed/browser/root-check evidence is inferred from this ledger.

## CLI/config handoff and host verification

T3 task `001-u5-cli-config-v1` completed its five owned paths on U4 baseline c1fa5ef0. Worker reports actual configuration/routing reds and disabled-secret-read characterization, then 69 unit/transport and 11 source CLI tests passing. An intervening two-startup-deadline failure remains recorded; its cause is unproven. No integrated telemetry acceptance was claimed.

Host inspected the full CLI, validator, transport extraction and test diffs. Canonical app typecheck exposed four exactOptionalPropertyTypes errors; scoped lint also exposed fixture env omission and anonymous return-type widening. Corrected optional construction without broadening public types, retained inferred validator return type, and documented the native socket union boundary in the host test. Final all-three-app typecheck and scoped lint exit 0; Node24/maxWorkers2 config+transport 69 tests pass in 3.37s, zero skips. Session integration and complete mapping remain pending; the mapping worker is still active.

Shared PG protocol received and read. No DB-dependent checks or handles are active. Future native gates require a coordinator owner window on the shared kello_test endpoint; infrastructure availability does not count as feature acceptance.

## Mapping and session integration

Mapping task `001-u5-mapping-v1` completed exactly metrics.ts and diagnostics-metrics.test.ts. Worker observed 7pass/5fail before behavior changes, then 13pass. Host inspected both full changes and reran all13 successfully (243ms); corrected lint-only Boolean validation/safety-comment findings. Full68 tuple enumeration, 54counter/14histogram count, count-versus-sum semantics, atomic claim overflow, private registry isolation and upstream JSON maximum-value fixture are covered. Billion-event Uint32 saturation remains code-derived evidence, not an executed loop.

Host implemented lazy telemetry startup, metric updates in ingress drain independently of output, five cumulative loss deltas, and final exporter stop sharing the absolute two-second session deadline. Five original preimplementation reds now pass. Existing unavailable-telemetry assertion was updated to the implemented invalid-configuration behavior; all other existing41 assertions remain. Host five-file focused suite131tests passes in23.41s with zero skips; app types and scopedlint exit0. Additional shutdown-during-periodic-flight regression is being verified after retaining guard ownership until exporter cleanup settles.

Prepared but not yet executed: full baseline mapping assertions through the pinned collector, plus explicit-consent CLI network/503-failure exit comparison. Coordinator queued001 after003 and006; no window granted. No broad build/fullunit/packed/browser/collector or DB launch until grant. Three mapping-only read-only simplification tasks are active: `001-u5-mapping-simplify-code-reuse-reviewer-r1`, `001-u5-mapping-simplify-code-quality-reviewer-r1`, `001-u5-mapping-simplify-efficiency-reviewer-r1`. These precede a fresh independent mapping/API review; no review acceptance or new commit yet.

Latest focused lifecycle run: existing41 plus9 integrated telemetry tests all50pass0skip33.70s. Stop during a hung periodic request plus its final attempt stayed within the shared deadline, reported two export failures, and retained immutable completed stats after the next owner started.

Mapping simplification complete: reuse0/efficiency0, quality1 applied (counter early-continue flattens admission without removing checks); skipped0. Host separately strengthened maximum-value serialized fixture with UInt64-max timestamps. Final13mappingtests0skip253ms and mapping scopedlint exit0. Fresh independent implementation/API/privacy/budget review `001-u5-mapping-contract-review-r1` is active against exactly these two frozen paths. This bounded review is intended to permit a separately reviewed mapping commit for005; it cannot accept fullU5 or its pending collector/native gates.

Coverage audit preserved the existing U4 direct-exporter native RPC test and added a separate integrated-session native RPC case: periodic collector I/O is pending while a second native HTTP procedure completes; a500 response increments export loss; final cumulative export retains both RPC observations and the loss. This new test and the CLI exit/collector mapping additions remain unexecuted until the window grant. Scoped lint passes. The bounded mapping receipt now has its own [task file](001-operational-visibility-u5-mapping.md), pending independent approval.

Mapping-only independent review completed APPROVED/no findings. Exact two code/test hashes matched the reviewed tree. Accepted mapping slice and its receipt committed as `fca49c2af66ed27c145e5dce509b3b210e0c22c5` (three owned paths), reported to root and005 with finite interface and budget contract. Remaining U5 files stay uncommitted and unaccepted; full phase status is unchanged.

Remaining session/CLI/native-test code is frozen for read-only simplification tasks `001-u5-session-simplify-code-reuse-reviewer-r1`, `001-u5-session-simplify-code-quality-reviewer-r1`, and `001-u5-session-simplify-efficiency-reviewer-r1`, each with the full rubric and explicit no-execution resource constraint. No duplicate workers or dependent phase launch. Their results and the exclusive window remain pending.

Session/CLI quality simplification returned no worthwhile behavior-preserving changes after reading all nine scoped paths and surrounding lifecycle/output/type context. Reuse and efficiency passes remain pending; no code edits or executions occurred. Coordinator confirms003 released and006 owns the exclusive window,001 next but not granted. Root mapping integration b13b3750 preserves all three accepted blobs; combined compatibility review is separate and pending.

Session/CLI reuse simplification also returned no actionable findings across all nine paths. Shared endpoint/header validation already uses the private validator; no further behavior-equivalent reuse was established. Efficiency task remains authoritatively running; source stays frozen pending its terminal result. No execution or phase acceptance is inferred.

All remaining simplification results are now consumed: reuse0, quality0, efficiency1. Applied the efficiency finding by protecting native test resource startup with cleanup immediately after collector creation, including failures from diagnostics startup; each successfully created server/session is disposed in nested finally blocks. Production behavior unchanged, scoped lint0. Added session-level characterization for mapper overflow refusal becoming a counted dropped observation, including atomic claim-duration retention. The selected new case passes (nine other cases unselected by the filter, not acceptance); a full ten-case file run follows. No required gate is skipped. Full native fixtures and broad checks remain held for the coordinator window.

Full integrated telemetry file:10pass0skip33.51s. Read-only independent source reviews `001-u5-lifecycle-source-review-r1` and `001-u5-api-security-source-review-r1` now inspect the exact remaining tree while resource-window acceptance is queued. Packets include the original brief, all prior findings/corrections and explicit unexecuted native/collector gates. Their source-only verdict cannot establish phase acceptance. Scoped source is frozen until both terminal receipts.

Both source reviews completed **REJECTED** on the collector oracle: local54/14 counts and global log substrings cannot establish all68 collector-decoded tuples; the metric-name wait can match an earlier export because every series already exists. Neither found an additional production lifecycle/API/privacy/security defect. Both confirmed the native startup cleanup finding resolved. Preserve these deficient-oracle receipts; no native evidence is inferred.

Bounded correction task `001-u5-collector-tuple-proof-v1` owns only diagnostics-otlp.test.ts, preserving existing assertions and cleanup. Acceptance requires one identifiable completed export from the current fixture/session, exact68 instrument/attribute tuples with no missing/extra entries, expected values/temporality and histogram bounds/count/sum, stable start/resource provenance across exports, and bounded final request completion. Source/offline checks only until006 releases and001 receives an explicit grant. Fresh exact-tree independent review must carry both findings and responses after correction. Mapping-only fca49c2a remains accepted separately; wholeU5 remains in-progress.

Host acceptance audit found the preserved phase4 disconnect-during-shutdown scenario was represented only indirectly by hung-response and already-dead-collector cases. Added a focused characterization in unit/diagnostics-otlp.test.ts: first response sends headers plus partial JSON, stop begins, server destroys the active socket, flight resolves with fixed network failure, and exactly one final cumulative snapshot succeeds before the two-second deadline. Production unchanged; no red is claimed. Full transport file47pass0skip3.39s under Node24/maxWorkers2 and scopedlint0. This local HTTP check uses no DB/container/broad runner. Include this tenth source/test path in the next independent review scope.

Collector correction worker completed only the assigned e2e file. JSON logger framing is grounded in official pinned0.156.0 debugexporter/exporter.go, internal/otlptext/databuffer.go and service telemetry logger/config source. The oracle now waits for a new complete export with exact loss(export)=29, then independently asserts all68 unique tuples,54/14, units/cumulative/values/histogram count/sum/12bounds/13buckets. Host added exact four-key resource provenance/current fixture UUID/package version across earlier/final exports and made the last request the bounded stop flush, asserting exactly one completed final export. Original deficient oracle receipt remains above; no actual collector evidence yet.

Pure source-format parser characterization passes1case0fail with4native cases filtered out (266ms); this is explicitly not full integration acceptance. It covers complete/incomplete JSON framing, point association, missing bound/start and non-string resource rejection. Scoped lint passed before the final pure-fixture resource assertion addition. Fresh independent `001-u5-lifecycle-source-review-r2` and `001-u5-api-security-source-review-r2` are running with all ten paths frozen, original brief, both R1 findings/responses, native cleanup history, new disconnect regression and pending canonical gates. Both are read-only/no execution. WholeU5 remains in-progress and no commit is made.

Coordinator explicitly granted001 exclusive U5 window after006 completed cleanup/release. Shared protocol reread; no other PG/server/database/pooler created. Both R2 reviewers subsequently completed APPROVED FOR SOURCE ONLY/no P1/P2, resolving both R1 oracle findings and confirming pinned format, lifecycle and provenance. No native execution was performed by either reviewer.

Canonical frozen-tree window results so far: appbuild exit0 (4468ms build); all3app type projects exit0; tests types0; e2e types0. Required package commands with explicit Node24/maxWorkers2/no-cache/configLoader=runner: diagnostics41pass0skip1.58s; transport47pass0skip3.84s. Full unit suite currently running in session89233, log `/tmp/kello-001-u5-full-unit-r1.log`. Native/sharedPG/collector and final lint/hash verification remain pending; do not treat source approval as full phase acceptance.

Full unit session89233 completed exit0:88files492tests0skip89.87s. Read-only shared-target audit initially failed before connection because the temporary script referenced a nonexistent root-level pg module; resolving pg from the e2e package corrected only that external helper. Actual native query then confirmed kello_test/server_version_num180006 and zero app_UUID/loom_UUID schemas/runtime_UUID roles. Native five-file suite ran with direct and pooled shared env set, no required skip: `/tmp/kello-001-u5-native-r1.log`, session23344. Frozen source unchanged; accepted006901b190c coordination received but not consumed during this gate.

## Canonical U5 window receipt

- App build exit0; all3app projects, tests and e2e types exit0. Required diagnostics41tests0skip1.58s and transport47tests0skip3.84s. Full unit88files492tests0skip89.87s, explicit Node24.21.0/maxWorkers2, log `/tmp/kello-001-u5-full-unit-r1.log`.
- Native `dev-cli`, `diagnostics`, `dev-server`, `dev-replacement`, `dev-runtime`:25pass0fail0skip44.95s, log `/tmp/kello-001-u5-native-r1.log`. Real shared PostgreSQL18.6/server_version_num180006; actual failed-edit recovery and once-accounting preserved, telemetry-enabled/disabled CLI exit and consent control pass.
- Full diagnostics-otlp integration:5pass0fail0skip19.49s, log `/tmp/kello-001-u5-collector-r1.log`. Real pinned collector0.156.0 image `otel/opentelemetry-collector@sha256:0beba82d63792511591522a8d582904b9a8ae81710357bfcab731607b8b0ffe2`; complete tuple decoding6.801s, unavailable-collector nativeRPC2.057s, integrated periodic-failure/nativeRPC10.066s, Bun/Node bridge0.402s, parser characterization0.012s. Assertions execute exact68 tuple set54/14, values/units/cumulative/countsum12bounds13buckets, fixed resource/current session provenance, stable start, final stop<2sec and exactly one final export. No provider retention/SLA claim.
- Collector launch/config is the checked test: uniqueUUID container, literal loopback dynamic4318, read-only temporary config, OTLP/HTTP receiver and detailed debug exporter with JSON log encoding. Awaited owned cleanup removed it; dockerps-a name filter is empty.
- Scoped lint and gitdiffcheck exit0. All ten scoped source/test SHA256s match the pre-build frozen tree; collector fixture hash `8cfb2aee402c1e37bf686dec9d4a49a2c68db9b9dc23bebc294196d40d88e5ae`, transport unit hash `657cd6921145a5ff214648f4acad2b7c5549935f56fff3f3d0a15caceab54288`.
- Final native cleanup audit on kello_test/180006 returns zero schemas matching `^(app|loom)_[0-9a-f]{32}$` and zero roles matching `^runtime_[0-9a-f]{32}$`; these cover every PG fixture family in this five-file suite. All command sessions terminal. Own-cwd lsof/ps audit found zero test/build candidates; MCP/CUA tool services were left untouched.

Explicit window release sent to root under `001-u5-explicit-window-release-green-host`; no further DB/native/broad execution without another grant. Final full-phase independent source/evidence review remains required before acceptance/commit. Prior rejected oracle, earlier reds/timeouts and unsupported-writer boundary receipts remain intact.

Orchestration delivery limitation: the first release-message call returned a300s tool timeout, so coordinator delivery is unconfirmed; retry uses the identical clientRequestId. Final phase review dispatch `001-u5-final-phase-review-r3` is awaiting tool acknowledgment; retain that task identity and reconcile it, never launch a duplicate solely on timeout. Native resources are already cleaned and the window is locally released. No further native/broad action is running or authorized without a new grant.

Final phase review dispatch is now authoritatively acknowledged: `001-u5-final-phase-review-r3` running/workStateworking, Astra-low, readonly source/log review. No replacement was launched. Release-message retry acknowledgment remains pending; no change to cleaned resources or locally released ownership.

Release delivery now confirmed: same request ID returned delivery=steered to coordinator thread ad80a09f-b808-4050-9367-a3110817091d. A transient task-status transport error was followed by successful same-handle reconciliation; final review is authoritatively running. No duplicate task/message was created, no native work restarted.


## Final U5 acceptance

Fresh independent Astra-low task `001-u5-final-phase-review-r3` completed **APPROVED — U5 phase acceptance**, with no P1/P2 findings. The reviewer inspected the exact ten implementation paths, actual saved 492-unit/25-native/5-collector logs and canonical build/types/lint/cleanup receipt. Both prior collector-oracle P2s are resolved by new complete-export identification, exact resource provenance and all68 independently expected decoded tuples/values/histograms. Native startup cleanup and explicit disconnect-during-stop regression are accepted. Source/log review performed no execution or writes. All ten source SHA256s were reverified unchanged by the host before commit. Uint32 saturation remains source-derived evidence, not a billion-event execution.

The shared test window was explicitly released and delivery to root confirmed; no further DB/broad/collector checks are authorized without a new grant. U5 is accepted. U6, full-feature review, packed/browser validation, PR and CI remain pending. Original red and rejected-oracle receipts above are retained.
