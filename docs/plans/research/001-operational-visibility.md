# Operational visibility research

**Research snapshot:** planned against `1590e4ec272cf4fc32bcaeb7123d94b2ac789fa1` on 2026-10-07. Source/runtime facts below were checked in the current workspace; no source changes, installs, builds, tests, commits, or provider operations were performed.

## Recommendation

Implement the first increment as an opt-in, local CLI diagnostics consumer over the existing Node diagnostics channels, with a strict machine-readable JSONL mode and a readable summary mode. Scope it to one explicitly selected local development process/runtime and make the consumer detach on shutdown. Do not initially add automatic remote telemetry, persistence, an embedded metrics endpoint, a dashboard, or UI. The project already has bounded event contracts and docs that direct maintainers to inspect runtime and deployment channels during acceptance; turning that into a CLI-visible view closes a concrete usability gap without selecting a vendor or expanding deployment attack surface.

Treat an exporter as a second, separately reviewed phase. First decide whether the target is metrics-only or logs/traces too, deployment and resource identity policy, endpoint/auth configuration, queue/buffer bounds, sampling/aggregation, data retention and user opt-in. The existing events are snapshots and lifecycle samples rather than a full metrics SDK registry; a consumer needs to aggregate counters/histograms/gauges carefully and distinguish per-isolate values from fleet-wide values. Avoid networking in subscriber callbacks.

## Findings

### [DIRECTION-01] Surface existing diagnostics in the CLI

- **Evidence**: `apps/loom/src/core/server/observability.ts:47-72` — `RuntimeMetric` defines bounded variants and publishes synchronously to `kello.runtime.metric`; it has no storage/exporter.
- **Evidence**: `apps/loom/src/tooling/deploy/observability.ts:1-13` and `apps/loom/src/tooling/deploy/neon/release-receipt.ts:189-210` — a second `kello.deployment.metric` channel reports fixed stage/status acknowledgement events.
- **Evidence**: `docs/architecture/operating-limits.md:90-108` — channel semantics, event limitations, redaction policy and absence of an exporter are documented; events are explicitly not durable.
- **Evidence**: `docs/architecture/acceptance-review.md:59-63` — maintainers are instructed to observe these channels during initial workload/rollout, with no production traffic baseline.
- **Impact**: users currently need an out-of-band Node subscriber or custom harness to see operational signals. A CLI view makes the documented acceptance workflow accessible and lets scripts consume structured events.
- **Effort**: M (roughly a day, including lifecycle and CLI contract coverage).
- **Risk**: MED — a forgotten subscription can leak or duplicate output across reloads; sync output in hot callbacks can stall work.
- **Confidence**: HIGH.
- **Fix sketch**: Add an explicitly invoked local diagnostics command or development-server option. Subscribe only while the owned process is active; format event names and approved fields as JSONL or concise text; unsubscribe and flush on graceful shutdown. Preserve stderr/stdout conventions and do not silently alter existing command output.

### [DIRECTION-02] Keep remote telemetry behind a design spike

- **Evidence**: `apps/loom/src/core/server/observability.ts:3-16,47-72` — event payloads deliberately exclude identities, arguments, SQL, credentials, function names and error messages, but include timings, pool counts and operational workload data.
- **Evidence**: `docs/architecture/operating-limits.md:94-106` — event meanings have caveats: overlapping durations, sampled rather than continuous pool values, claimed jobs rather than whole-queue gauge, and possible observation before an enclosing transaction commits.
- **Evidence**: `apps/loom/src/core/server/effect/runtime.ts:1-22,90-101` — Effect 4 ManagedRuntime and Diagnostics service are already composed with the runtime lifecycle, so new observation should preserve that single ownership boundary.
- **Impact**: unsolicited or misconfigured upload of operational events can create privacy, cost, and reliability concerns; incorrect aggregation can imply unsupported fleet health or success rates.
- **Effort**: M for the design spike; L for a production exporter after decisions.
- **Risk**: HIGH if telemetry is enabled by default or delivery is coupled to request execution; MED with explicit opt-in, bounded buffering and lossy failure behavior.
- **Confidence**: HIGH.
- **Fix sketch**: Prototype exporter lifecycle against a local collector only after deciding opt-in/configuration semantics. Define allowlisted fields and low-cardinality labels, queue capacity/drop policy, timeout/retry budget, shutdown deadline, and what happens when export fails. Do not infer a production SLA from current acceptance fixtures.

### [DIRECTION-03] Preserve bounded cardinality and safe subscriber behavior

- **Evidence**: `apps/loom/src/core/server/observability.ts:3-67` — metric variants mostly use bounded enums/numbers; useful property to retain in all adapters.
- **Evidence**: `apps/loom/src/core/server/observability.ts:69-72` — publication is a direct synchronous `channel.publish` call.
- **Evidence**: `docs/architecture/operating-limits.md:106` — existing guidance tells subscribers not to throw.
- **Impact**: Node invokes subscribers synchronously; any blocking work adds latency to the publisher and subscriber exceptions become uncaught exceptions. An exporter that attaches arbitrary values as metric labels also risks unbounded series growth and leakage.
- **Effort**: S (hours) to define/cover adapter constraints as part of CLI work.
- **Risk**: HIGH if ignored; LOW if subscriber catches its own errors and does bounded local work.
- **Confidence**: HIGH.
- **Fix sketch**: Keep callbacks to validation, bounded aggregation or bounded queue insertion; catch all callback-local failures. Move formatting/network/filesystem work outside the callback. Only use fixed event type/status/mode/reason labels; never promote raw IDs, URLs, errors or function names to labels.

## Architectural implications

- `RuntimeMetric` is exported from the public server entry (`apps/loom/src/core/server/index.ts:66`) and wired into Effect context via `Diagnostics` (`apps/loom/src/core/server/effect/runtime.ts:7,18`). Avoid replacing it with a second, incompatible event path in an incremental observability feature.
- `RuntimeMetric` describes point events and sampled state. For example, `realtime.coordinator` gives current counts on updates, not an independently polled continuously sampled gauge; `database.acquire` counts are per-pool snapshots; `job.claim` samples successful claims. CLI output should call these events/samples, not present all values as authoritative gauges.
- Deployment events mean receipt acknowledgement only. The architecture docs state that provider health must be freshly observed and that receipts are durable progress while channel events can be missed. Keep them visually and structurally distinct from runtime health.
- The Kello CLI is Bun based (`apps/loom/src/cli.ts:1`; `apps/loom/package.json:2,59-61`), while deployed functions run in provider isolates. A CLI process cannot observe metrics from remote isolates merely by subscribing locally. Do not imply local CLI is a hosted log-stream client.
- Project goals explicitly require useful logs/diagnostics and structured CLI diagnostics, and explicitly reject a separate hosted dashboard for the current release (`docs/plans/2026-09-22-1141-feat-loom-full-framework-plan.md:78-81,382-386`). No UI/dashboard is justified by this assignment.

## Effect observability integration

The installed `effect` resolves to pinned `4.0.0` in the Loom workspace; `@effect/opentelemetry` and `@opentelemetry/sdk-metrics` are not installed there. Effect 4 includes native `Metric` and `PrometheusMetrics`/`OtlpMetrics` APIs, but these work on metrics registered/updated through Effect's metric registry; current Loom operational measurements are emitted as Node diagnostic events from both Effect and non-Effect code. Native Effect instrumentation is therefore not a drop-in exporter for this event stream. A future adapter can either translate the events into Effect metrics in the runtime context or use an independent OpenTelemetry SDK; choose only after pinning compatibility and lifecycle behavior. Avoid a wholesale conversion of working event instrumentation just to adopt an exporter.

Primary sources:

- Effect 4 metrics guide: https://effect.website/docs/v4/observability/metrics
- Effect 4 `PrometheusMetrics` API: https://effect.website/docs/v4/api/effect/observability/PrometheusMetrics
- Effect 4 `OtlpMetrics` API: https://effect.website/docs/v4/api/effect/observability/OtlpMetrics
- Effect 4 logging: https://effect.website/docs/v4/observability/logging
- Pinned local source: `node_modules/.bun/effect@4.0.0/node_modules/effect/src/Metric.ts` and `src/observability/PrometheusMetrics.ts` / `OtlpMetrics.ts` (confirm exact source paths from package before execution; the API reference states introduced in 4.0.0).

## Node subscriber constraints

Node's diagnostics channel is appropriate as a low-coupling observation hook, but it is not an async transport: `publish` runs handlers synchronously in the same context. Node documents that thrown subscriber errors trigger `uncaughtException`. Thus the current `publishRuntimeMetric` call makes subscriber discipline part of application reliability. Exporters should isolate their own failures and enqueue into a finite buffer; avoid synchronous disk/network work and ensure queue saturation drops/coalesces telemetry rather than blocking the runtime. Explicitly test unsubscribe behavior and duplicate start/stop. `hasSubscribers` is available if expensive payload construction is introduced, but current events are already formed at call sites.

Primary source: Node diagnostics channel documentation (subscriber callback execution and errors): https://nodejs.org/api/diagnostics_channel.html

## Convex comparison

Convex offers deployment-oriented logs and health views: its CLI can stream logs (including JSONL) for selected dev/prod/deployment targets; its dashboard provides per-function invocation, error, cache-hit and percentile execution-time charts; Health surfaces insights with impact charts and event logs. This supports prioritizing a local CLI stream first and suggests a future deployment health view should correlate bounded event windows with a selected deployment. It does **not** justify copying Convex's hosted dashboard or cloud log transport: Loom's current architecture deliberately has no hosted dashboard, has serverless isolates, and has no production traffic baseline.

Primary sources:

- Convex CLI logs: https://docs.convex.dev/cli/reference/logs
- Convex function metrics: https://docs.convex.dev/dashboard/deployments/functions
- Convex deployment Health: https://docs.convex.dev/dashboard/deployments/health
- Convex workflow/dashboard overview: https://docs.convex.dev/understanding/workflow

## Suggested execution phases

1. **CLI consumer:** establish command name and source process ownership; add local subscribe/unsubscribe lifecycle to development runtime, provide human and JSONL formats, and cover all currently exported `RuntimeMetric` and `DeploymentMetric` variants without printing data outside their allowlist.
2. **Failure containment:** prove a throwing formatter/export sink cannot escape into a publisher; use finite buffering if asynchronous output is required; define dropped-event reporting without recursively publishing diagnostics.
3. **Operational semantics:** label samples accurately and document that remote isolate events require a remote collector; do not aggregate overlapping durations or turn per-pool samples into fleet totals.
4. **Exporter design spike (separate approval/plan):** select metrics vs logs/traces, endpoint/auth/config, opt-in/default, deployment identity provenance, redaction, aggregation and cardinality, batching/drop/retry/shutdown policy, supported runtime targets and collector interoperability. Compare Effect 4 native metrics bridging with OTel SDK only on a pinned prototype.
5. **Defer UI:** revisit only after users have an accepted export/query workflow and operational questions that CLI output cannot answer.

## Verification commands for the future implementer

Commands below are suggestions for a later implementation agent; none were run in this research-only assignment.

- Focused tests for the new diagnostics command and subscriber lifecycle, from the relevant workspace: `bun run test -- <focused test path>` (resolve the repository's actual script/runner before execution).
- Typecheck/lint/build using the scripts in `apps/loom/package.json`, and then the documented repository root validation command; inspect exact scripts before choosing commands.
- Consumer boundary: pack/install Kello into a clean temporary consumer and verify the public `RuntimeMetric` contract remains importable if the public API changes.
- Lifecycle cases: no subscriber, duplicate start prevention, normal shutdown unsubscribe, SIGINT/SIGTERM cleanup, subscriber/sink throw, slow sink, bounded queue saturation, and separate runtime/deployment event rendering.
- Redaction/cardinality: assert output has only allowlisted fields and bounded labels, and no credentials, URLs, SQL, arguments, function names, user identifiers, job identifiers, or raw errors.
- Remote claim boundary: verify documentation and command output do not suggest a local process sees provider-isolate metrics; no hosted-provider acceptance is implied by local tests.

## Open questions for planner

- Should diagnostics be a dedicated `loom diagnostics`/`loom logs` command, or a `--diagnostics` mode on `loom dev`? Existing command routing and UX should settle this; a dedicated command is easier to keep opt-in and structured.
- Is the first CLI target the `loom dev` process only, or should deployment commands also print stage events? Deployment stage events are short-lived and structured; a live runtime stream requires clear process ownership.
- Should JSONL stream each raw approved event, or emit aggregated interval snapshots? Raw JSONL best preserves event semantics; snapshots are more useful interactively but can misrepresent point samples.
- Does the project want Effect metrics as an internal aggregation bridge, or should an eventual exporter use OTel directly? Current source and deps do not settle this.
- Is telemetry strictly user-configured and opt-in? No existing telemetry consent or remote endpoint policy was found in the scoped architecture/docs; decide before any network exporter is planned.

## Research method and boundaries

Read the assigned observability module, current operating-limits and acceptance architecture documents, relevant full-framework requirements and U17 plan, CLI/runtime sources, the pinned Effect package version, and the improve audit playbook's direction and finding-format sections. External research used primary official Node.js, Effect, and Convex documentation. Recommendations distinguish local source facts from upstream capabilities. No commands beyond read-only inspection/search and official web research were used; no changes beyond this artifact should be made by the research role.
