# Components acceptance — 2026-09-27

This report covers the components, internal callers, SDK services, and scoped runtime plan. Unit-by-unit decisions, reviews, and commits are in [the execution record](2026-09-27-components-execution.md). U1–U12 implementation and required Neon behavior checks passed. The formal review orchestration limitation and pre-existing formatting failures remain explicitly recorded below.

## Local verification

| Gate                            | Result                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| Unit suite                      | 261 passed, 65 files                                                                        |
| PostgreSQL integration suite    | 207 passed, 1 opt-in legacy schema-baseline check skipped, 105 files, 1,429 assertions      |
| Browser suite                   | 10 passed, 9 files, 82 assertions; CSR, Next SSR, Start SSR, uploads and packed consumers   |
| Workspace TypeScript 7/build    | All 18 tasks passed                                                                         |
| Packed signed webhook follow-up | Passed against PostgreSQL with the restricted runtime role                                  |
| Development component follow-up | Exported/private calls, scoped cron registration, and component-only drift rejection passed |
| Storage follow-up               | 12 tests, 7 files, 56 assertions passed                                                     |
| Anti-slop/Oxlint                | Passed                                                                                      |
| Whole-workspace formatting      | Blocked only by pre-existing README and an unrelated explainer; preserved unchanged         |

The final focused run passed 11 tests across four files, covering the packed signed webhook, development drift/crons, scoped durable work and assembled storage inheritance. Native HTTP calls through `createRpcRuntime` prove automatic root/component ownership, child-provider downloads, sibling denial and inherited upload/finalize denial. The scoped durable fixture also rejects inherited callbacks.

Consumer tests use the built public `loom/...` package; some focused internal tests import source to exercise private boundaries. The packed production artifact test also runs the extracted Neon Node 24 bundle without application node_modules. Local authentication protocol fixtures are not evidence of managed Neon Auth or vendor-account acceptance.

## Requirements and acceptance trace

| Contract                                                                     | Evidence                                                                                                                                                     |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1–R3, AE1: explicit mounts, instance configuration and SDK-only definitions | Mount graph, codegen, runtime and packed consumer tests; U1–U3, U7, U10                                                                                      |
| R4, R6, AE2: contracts and private/exported/public boundaries                | Generated negative type tests, native internal calls, network/OpenAPI denial tests; U3–U5                                                                    |
| R5, AE3: Standard Schema and typed environment references                    | Async/default/bound validation, per-mount runtime environments, secret-free generation and service lifecycle tests; U2, U7                                   |
| R7: official SDK behavior and lifecycle                                      | Native receivers/overloads, mixed Promise/Effect factories, coalescing, cancellation, failure recovery and finalizers; U7; typed official SDK recipes in U11 |
| R8: native oRPC and TanStack integration                                     | Native options and explicit streaming contracts, Zod/Valibot, Promise/Effect, browser/SSR fixtures; U5, U9, U11                                              |
| R9, AE4: nested execution authority                                          | PostgreSQL atomic commit/rollback, caught-inner-error poisoning, read-only escalation denial, child revision dependencies and auth revocation; U4, U9        |
| R10, AE5: explicit Hono HTTP boundaries                                      | Original signed bytes, rejected signature/body with no writes, route collisions, shutdown draining and native socket ingress; U8                             |
| R11: ownership and schema lifecycle                                          | Separate histories, resumable multi-scope failures, additive upgrades, detach retention, collision/rename denial and schema-only adoption; U6                |
| R12: compiled packages                                                       | vp tarballs, nested and subpath exports, helper hashing, repeated mounts, generated consumer type checks and browser rejection; U10                          |
| R13: documentation and independent examples                                  | CSR, Next and Start components plus official WorkOS/Clerk/Auth0 SDK recipes; U11                                                                             |
| R14, AE6: real Neon release acceptance                                       | Packed real-Neon upgrade/rollback and schema-only fork passed; see cloud evidence below                                                                      |

## Real Neon acceptance

Project `late-moon-69483649` (`loom`), AWS us-east-1, disposable branch `br-young-dream-aw4m4lp4`. The target, PostgreSQL role isolation and packed component suites passed in 178.85 seconds. Initial deployment took 50.11 seconds, the additive upgrade 50.76 seconds, and compatible retained-code rollback 31.13 seconds.

Sixteen checks passed: mount and owner isolation; parent/exported/private and Effect/Promise chains; private HTTP/OpenAPI/WebSocket denial; signed webhook acceptance and invalid signature/body rejection without writes; native live delivery after a child commit; compatible schema expansion; service configuration replacement; stale-client refusal; rollback with retained rows and complete migration histories. The existing socket made a finite request after schema expansion. Its streaming iterator had been aborted before migration, so this does not claim uninterrupted streaming through deployment.

Tested service URL: `https://br-young-dream-aw4m4lp4-sf4703e0e2edfdb2df49.compute.c-12.us-east-1.aws.neon.tech/`. The branch and its Functions were deleted after acceptance; this endpoint is no longer served. [Redacted release receipt](2026-09-27-components-cloud.json).

The public schema-only provisioning workflow passed in 38.57 seconds on child `br-quiet-violet-awsx51mq`: provisioning was idempotent, both component ownership records and histories were consistent, component tables were empty, and jobs, storage intents, activation grants/secrets, mutation results and runtime scopes were empty. The child was deleted successfully. [Schema-only receipt](2026-09-27-components-schema-branch.json).

Earlier failures were investigated rather than counted as passes: webhook authorization used the wrong internal path, Bun omitted the ws origin option, a fixed OAuth token expired, a provider submission was incomplete, and the rollback fixture added a variable absent from the original polling-mode release. Fixture corrections preserve the deployment receipt guard and avoid automatic replay of ambiguous provider mutations. The final run passed from a fresh branch with the saved CLI login.

## Neon GA storage correction

The real fork test reproduced a mismatch: the child branch's own S3 credentials could read the inherited finalized object, while Loom denied its READY intent because deployment/branch identity had changed. Metadata migration 26 adds a stable application-and-component owner scope. READY reads retain principal and current authorization checks and use the persisted origin key through the current branch's storage endpoint. Pending uploads, callbacks and execution remain branch-bound. Existing rows without an owner scope fail closed across branches; they are not automatically relabeled.

The live corrected test passed seven checks in 28.32 seconds: parent finalize, child credential inheritance, owner read, cross-owner denial, pending rejection, independent child request key, and child deletion preserving the parent object. Both disposable branches were deleted and credentials revoked. [Final storage receipt](2026-09-27-storage-branch.json). This exercises Loom's intent service directly against Neon Postgres and storage; it does not claim a deployed Function authentication test. Local tests separately cover root/application/component scope separation and legacy rows.

Declare private buckets in `loom/storage.ts` with `defineProcedureStorage`; deployment provisions them and uses Neon's injected branch credentials. See [storage architecture](../architecture/storage.md) for the application configuration and current provider references.

## Cleanup

The final authenticated CLI inventory contains only the original default branch `br-solitary-sun-aw6tznuf` (`main`). Every acceptance branch was deleted; temporary storage credentials were revoked. No default-branch application data or deployment was changed. [Final inventory](2026-09-27-components-cleanup.json).

## Measurements

Medians of three samples on Apple M5, Bun 1.4.2, TypeScript 7.0.2. Fresh generation means missing generated files; OS caches were not flushed. Typechecks use new nonincremental processes. Service timings measure the registry alone, excluding database, transport and vendor latency. These are baseline observations, not a claimed speedup.

| Mounts | Fresh generation | Repeat generation | Typecheck | Cold service batch | Warm service batch |
| ------ | ---------------- | ----------------- | --------- | ------------------ | ------------------ |
| 1      | 26.70 ms         | 22.47 ms          | 247.96 ms | 0.432 ms           | 0.0017 ms          |
| 10     | 34.19 ms         | 28.50 ms          | 211.24 ms | 0.410 ms           | 0.0059 ms          |
| 50     | 72.37 ms         | 63.76 ms          | 227.28 ms | 0.669 ms           | 0.0262 ms          |

Acquisition and disposal occur once per mount per generation. [Raw measurements and methodology](2026-09-27-components-benchmark.json) are retained for comparison.

## Boundaries

Six formal review lenses completed with no actionable findings. The coordinator could not dispatch the remaining required leaves because of the harness agent limit. Code review: skipped (ce-code-review unavailable). Supplemental reliability review found and verified a fix for ambiguous branch-creation cleanup; three simplification lenses and the final manual diff/security scan were also completed. [Review receipt and follow-up](2026-09-27-components-review.json) preserve the distinction between completed reviewer work and the failed formal orchestration.

WorkOS, Clerk and Auth0 account acceptance remains deferred as requested. SDK initialization does not authenticate incoming users. Components share the process trust boundary; namespace ownership is not a sandbox for hostile dependencies. No package publication, production deployment, push or merge is included.

## Release monitoring handoff

For a future deployment, the release operator should verify migration status for every mounted namespace, then exercise one authorized call, one denied private call, a signed webhook and a native live update. Compare authorization failures, release activation errors, queue retries and live-update delay with that deployment's existing baseline; no production baseline or numeric alert threshold was established here. Check during rollout and the first normal traffic window. An owner reading another mount's files, replay of copied pending work, or unexpected migration history changes is a rollback trigger. Retain additive schema/history when restoring compatible code; do not drop component schemas to undo a release. The release owner and window must be assigned when production deployment is authorized.
