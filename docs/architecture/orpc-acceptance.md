# oRPC and Effect acceptance

Status: functional and six-run performance acceptance passed; temporary Neon resources are removed. Version remains `0.0.0`; no packages have been published.

The chronological [execution record](orpc-execution.md) contains implementation units, failed attempts, fixes, reviews and scoped commits. This page consolidates the current evidence rather than treating historical milestones as release approval.

## Tested code and execution

The final hosted core/client runtime is `903e0ec798ee8cce07662dbc99a44baa22d1c9b6`. Later changes add the metadata-only compatibility command and strengthen acceptance tests; they do not change that runtime. Compatibility implementation commit `f7b12fb25c7e1e45a8767c3abeee64bf684b5e4f` has separate PostgreSQL and actual Neon schema-expansion evidence.

All 15 workspace check tasks pass, including 190 unit tests, build, typechecking, lint and formatting. The final PostgreSQL 18 sweep passes 132 tests across 77 files with 1,088 assertions, zero failures and zero skips. The browser sweep passes six scenarios with zero skips; subsequent hosted Tasks acceptance also exercises the corrected Node HTTP adapter and compatibility command through a real browser.

The [functional receipt](evidence/orpc-neon-functional-2026-09-25.json) records actual Neon Auth, Functions, Object Storage events, jobs and populated upgrade profiles. Each required profile passes three tests with zero failures/skips; upgrade additionally executes the pinned historical implementation. The [schema receipt](evidence/orpc-neon-schema-2026-09-25.json) records actual CLI compatibility declaration, rejected undeclared expansion, preserved data, old-client reads after expansion, new deployment and authenticated writes. These are local invocations of the required cloud runner against Neon, not GitHub Actions results.

## Requirements and acceptance examples

| Requirements                                          | Executed evidence                                                                                                                                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1–R2: native procedures and generated context        | Native contract/type fixtures, RPC code generation, packed consumers and both hosted examples; AE1 covers no-input and inferred-output handlers.                                        |
| R3: callable TanStack options                         | Option type/unit tests and browser RPC consumer tests; AE2 covers caller overrides and selected result typing.                                                                          |
| R4: Effect infrastructure ownership                   | Effect scope and storage-scope integration tests, interruption/drain tests and hosted Promise/Effect services.                                                                          |
| R5: validation before commit                          | RPC transaction, serialization and job tests; AE4 combines an application write, unawaited scheduling and invalid output, verifying rollback of data, jobs and the replay receipt.      |
| R6: shared transport contracts and internal isolation | HTTP/WebSocket/OpenAPI integration and hosted services; AE5 includes internal-path rejection, authenticated admission and identity isolation.                                           |
| R7: database change authority                         | PostgreSQL notification tests cover direct SQL, rollback, delete and truncate; AE3 uses separate hosted runtime instances.                                                              |
| R8: live convergence and bounded resources            | Reconnect, snapshot races, auth expiry, cancellation and hosted listener recovery cover AE3/AE6. All six full hosted workloads pass timing and resource gates.                          |
| R9: optimistic coordination                           | Unit and browser optimistic-live tests cover AE2, overlapping pauses, callback failures and fresh reconciliation; SSR integration covers finite snapshot ownership.                     |
| R10: data and release continuity                      | Restricted-role, quarantine, migration, release-recovery and populated hosted upgrade tests cover AE7/AE8.                                                                              |
| R11: durable jobs                                     | Lease fencing, retry, cancellation, replay and scheduling integration tests; actual Neon cron delivery demonstrates retry success and terminal failure.                                 |
| R12: Neon file storage                                | Storage authorization, event deduplication and cleanup integration tests; hosted signed bytes and actual object-created delivery cover AE7.                                             |
| R13–R14: toolchain and pins                           | Full checks and clean packed consumers retain TS7, Bun/Turborepo, Vite+, Oxlint, extensionless source imports and Node 24; U1 records exact dependency and licensed patch verification. |
| R15: real provider acceptance                         | Both hosted examples, native services, populated upgrade and safe schema expansion pass. All six sustained performance workloads pass.                                                  |
| R16: framework-owned lifecycle                        | CLI, generation, development, migration and deployment integration; AE8 uses the public compatibility command and project deployment APIs.                                              |
| R17: legacy removal and documentation                 | Legacy removal units, native packed examples, docs consumer build and browser checks.                                                                                                   |

## Performance results

The [performance receipt](evidence/orpc-neon-performance-2026-09-25.json) retains all three spread and three hot-table comparisons, percentile distributions, first-request timings, heap series, writer contention, database samples and source receipt hashes. Each run uses 100 subscriptions across two Neon Functions, ten committed writes per second for ten minutes after a 30-second warmup, PostgreSQL 18 in `aws-us-east-1`, and fixed 1 CU database compute.

| Workload/run | Baseline live p95 | Native live p50 / p95 / p99 | Improvement at p95 | Baseline → native warm finite p95 |
| ------------ | ----------------- | --------------------------- | ------------------ | --------------------------------- |
| Spread 1     | 1,200.63 ms       | 192.68 / 378.30 / 506.66 ms | 68.49%             | 224.87 → 108.69 ms                |
| Spread 2     | 1,217.16 ms       | 188.20 / 327.34 / 493.44 ms | 73.11%             | 160.76 → 140.80 ms                |
| Spread 3     | 1,194.06 ms       | 172.53 / 268.90 / 433.10 ms | 77.48%             | 149.79 → 115.46 ms                |
| Hot-table 1  | 1,330.95 ms       | 186.42 / 290.83 / 595.25 ms | 78.15%             | 573.91 → 171.69 ms                |
| Hot-table 2  | 1,306.01 ms       | 174.03 / 274.29 / 576.31 ms | 79.00%             | 450.23 → 124.43 ms                |
| Hot-table 3  | 1,249.54 ms       | 175.04 / 277.38 / 510.92 ms | 77.80%             | 192.05 → 166.50 ms                |

The table uses the conservative upper measurement bound: one coordinator clock spans commit submission through browser observation. The receipt also preserves the lower bound after commit acknowledgement. First finite requests take 438–766 ms; this is reported separately and does not prove a provider process cold start. Retained baseline runs precede the final native runs by several hours, with matched fixture, region, compute and client placement; this was not a randomized or contemporaneous experiment.

Each isolate peaks at four reevaluations, 50 queued subscriptions and four pooled clients, with zero sampled pool waiters. All subscriptions, evaluations and queues drain to zero; both listeners return to idle. Sampled heap stays within 21.96–56.13 MiB, with repeated collection drops and no sustained rise in quarterly averages or peak envelope across the workload. The receipt retains changing quarter minima rather than treating one final heap sample as a leak test. These bounded observations do not prove the absence of every possible leak.

Hot-table writer samples expose contention that the slower database sampler misses: up to nine waiting writers occur during bursts. This is included in the evidence, not classified as zero contention. Actual database connection limits and observed headroom are recorded per run, separately from socket capacity.

| Example      | Typecheck median, baseline → native | Browser JS, baseline → native     | Gzipped JS growth | Private generated declarations |
| ------------ | ----------------------------------- | --------------------------------- | ----------------- | ------------------------------ |
| Tasks        | 364.76 → 330.60 ms                  | 290,104 → 314,022 bytes (+8.24%)  | +7.22%            | 3,307 → 2,399 bytes            |
| Jobs/storage | 311.46 → 364.65 ms                  | 289,164 → 320,155 bytes (+10.72%) | +9.77%            | 2,582 → 2,162 bytes            |

Typecheck medians use three runs each. Bundle measurements cover each complete example's emitted JavaScript: native oRPC client/options replace the old custom transport, so the change is reported as the whole migration rather than attributed to one dependency. Public generated declaration wrappers shrink from 196 to 148 bytes per example. Every size and typecheck comparison stays within the plan's 20% limit.

## Review boundary

Code and security reviews ran after implementation units, with scoped commits recorded in Git. The completed ce-code-review receipt at `20260924-221629-23023239` identified the final hosted/performance gap. The caller closes finding #1 with the final functional, schema and performance receipts; the original review remains unchanged as a historical record. Later HTTP and compatibility fixes received their own sequential code/security reviews. The final compatibility simplification pass changed no code.

The workspace requires review tasks to run sequentially in the main session. These reviews are not independent corroboration. An attempted external peer review timed out without a usable artifact; it is not counted as successful review or test evidence.

The [review resolution](evidence/orpc-review-resolution-2026-09-25.json) records the caller's evidence for closing the remaining finding. The [cleanup receipt](evidence/orpc-neon-cleanup-2026-09-25.json) verifies that every recorded disposable branch is absent, the main branch remains, and the temporary organization API key is revoked. The temporary credential file was removed; the user's authenticated CLI profile was retained.

## Operational limits

Compatibility ranges are reviewed declarations, not automatic proofs of arbitrary application behavior. Inferred TypeScript return types are not runtime output validators; precise OpenAPI export needs representable output contracts. Polling remains the default and recovery path; notification-mode timing does not establish polling latency.

Provider-wide quotas, eviction guarantees and billed workload cost remain unmeasured. Database retirement does not delete every retained provider resource or drain arbitrary external side effects. See the [operating guide](../../apps/docs/content/docs/operations/limits.mdx) and [deployment guide](../../apps/docs/content/docs/operations/deployment.mdx).

## Post-deploy validation

The maintainer deploying a release owns the validation window. Before wider use, run the required cloud profiles on a disposable target, then observe one complete ten-minute spread workload and one ten-minute hot-table workload after warmup. Compare notification-mode visibility, warm finite RPC, listener ownership, reevaluation queues, pool waiters and drained counters with the accepted fixture. The repository does not yet provide a production metrics backend or an on-call assignment.

Treat unauthorized access, duplicate durable effects, lost writes, non-draining resources or failed release recovery as stop conditions. A notification p95 above 500 ms or finite p95 above 120% of the matched baseline requires investigation before accepting equivalent workload performance. Provider quota failures require freeing verified owned capacity or changing the target; they do not justify bypassing admission or authorization checks.

Preserve release declarations and receipts during investigation. Retained-code rollback requires compatible durable formats and a reviewed schema range; it does not reverse migrations. If those checks refuse rollback, preserve the running compatible release and repair forward. Disable affected ingress through the documented lifecycle before retiring database authority.
