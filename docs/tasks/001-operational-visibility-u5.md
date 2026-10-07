---
feature: 001-operational-visibility
unit: U5
status: todo
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

Evidence: pending. Independent review: pending. Commit: pending.
