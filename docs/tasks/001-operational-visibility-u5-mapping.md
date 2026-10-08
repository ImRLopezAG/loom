---
feature: 001-operational-visibility
unit: U5
status: done
---

# Fixed baseline metric mapping

This is the separately reviewable mapping slice of U5, requested for coordination with005. It does not accept the remaining session, CLI, native collector, or full-feature gates.

Source plan: [001 Operational visibility](../plans/001-operational-visibility.md), U5 and the preserved source mapping table. Accepted prerequisite: U4 commit c1fa5ef0.

Owned code: `apps/loom/src/tooling/diagnostics/metrics.ts` and `packages/tests/unit/diagnostics-metrics.test.ts`.

Contract: `createDiagnosticsMetrics()` provides `observe(runtimeOrDeploymentEvent): boolean`, `loss(reason, count): boolean`, and `snapshot(): MetricsData`. Only fixed enumerated tuples can register. Rejected accumulator updates are atomic across an observation; the owning session records drops. State and resources are private to each session. The five loss reasons are invalid, ingress_queue, output_queue, output, export.

The baseline is68OTLP series:54 counters and14 histograms. The hard series ceiling is128; the independent serialized request ceiling is128KiB. Histograms retain12explicit millisecond bounds and13buckets, cumulative temporality, stable session start, and upstream JSON encoding. Reaped jobs add the event count and use `{job}`; other baseline counters use `{event}`. Retry attempts add one observation, not the attempt number. Nested durations remain independent. No pool/realtime gauges, dynamic payload attributes or new telemetry variants are added.005 owns the later reviewed atomic17-series extension (85total), including cleanup unit `{event}`.

Evidence:

- Worker actual preimplementation red:7pass5fail, followed by13pass.
- Host inspected both full diffs; canonical13tests pass. Direct safe-integer counter overflow and multiinstrument histogram-sum overflow prove refusal without partial updates.
- Independent expected tuple enumeration establishes68/54/14. Maximum-value typed fixture uses maximum safe counters, Uint32-max buckets, finite-max sums, and UInt64-max timestamps, serialized by the upstream Effect JSON layer and checked within128KiB.
- All-three-app types passed before the final control-flow-only simplification; focused lint passed afterward. Latest mapping tests13pass0skip253ms.
- Uint32 saturation protection is checked against pinned Effect implementation; billions of observations were not executed.
- Three independent simplification passes completed: reuse0, efficiency0, quality1 applied by flattening counter admission with an early continue. All safeguards and the separate mutation pass remain.

Independent Astra-low contract/privacy/security review `001-u5-mapping-contract-review-r1`: **APPROVED**, no actionable findings. The reviewer inspected both exact paths, U5/KTD4/source mapping requirements, publisher/projector contracts and pinned Effect4source; confirmed finite semantics, atomic admission, privacy, typing, budgets and resolution of the prior quality finding. Review was read-only with no execution; host test/type receipts remain distinct from independent source evidence.

Reviewed code SHA256: metrics.ts `6c379a6750b60e8ecae0737941516f6413140372a315f2e97ba249fccfe5bf57`; diagnostics-metrics.test.ts `ce2458c6efce63c67d18a258327d00eee5bfdc3beecc91781559eb176244b0dd`. No code changed after approval.

This mapping slice is complete and accepted for its owned commit. Full U5 acceptance remains in-progress in [the parent task](001-operational-visibility-u5.md); no session/CLI/native/collector/provider acceptance is inferred.
