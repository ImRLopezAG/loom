---
feature: 001-operational-visibility
unit: U4
status: todo
---
# Private RPC metrics and collector spike

Plan: [U4](../plans/001-operational-visibility.md#u4-private-rpc-metrics-and-collector-spike-source-phase3).

Dependencies: U3 accepted.
Ownership, requirements, test scenarios and acceptance: preserve the referenced unit and its source phase verbatim. Begin with observed failing proof for new behavior. Host owns canonical verification and commits; workers own explicitly assigned files only.

## Acceptance and owned scope

**Goal/requirements:** R3,R4; prove Effect JSON bridge interoperability before full exporter integration.
**Dependencies:** U3 accepted (read-only API/mapping research may precede it).
**Files:** diagnostics `metrics.ts`, `otlp.ts`; `packages/tests/unit/diagnostics-otlp.test.ts`, `packages/e2e/integration/diagnostics-otlp.test.ts`.
**Approach:** KTD4,KTD5; start with RPC count/duration, inspect actual bytes and real collector output.
**Test scenarios:** isolated global metric, ambient OTEL canaries, histogram observations across boundaries, decimal nanoseconds, redirect refusal, response cap, one flight, dead collector and bounded stop, Bun/Node imports.
**Verification:** phase3 fixtures plus actual pinned collector acceptance; no declaration of exporter acceptance on fake collector alone.

Evidence: pending. Independent review: pending. Commit: pending.
