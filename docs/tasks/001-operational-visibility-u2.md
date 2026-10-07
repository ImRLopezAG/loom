---
feature: 001-operational-visibility
unit: U2
status: done
---

# Owned bounded local session

Plan: [U2](../plans/001-operational-visibility.md#u2-owned-bounded-local-session-source-phase1).

Dependencies: U1 accepted.
Ownership, requirements, test scenarios and acceptance: preserve the referenced unit and its source phase verbatim. Begin with observed failing proof for new behavior. Host owns canonical verification and commits; workers own explicitly assigned files only.

## Acceptance and owned scope

**Goal/requirements:** R1,R2; reusable tooling API and safe pumps.
**Dependencies:** U1 accepted.
**Files:** diagnostics `session.ts`, `output.ts`, `index.ts`, tooling `index.ts`; diagnostics unit tests.
**Approach:** KTD2,KTD3; exact public options/stats/record/session types in the preserved contract. Separate writer formatting and cancellation from projection.
**Test scenarios:** every source phase1 scenario, including 1024/256 saturation, 2KiB lines, duplicate realm ownership, repeated stop, startup unwind, cooperative cancellation/backpressure and uncooperative late settlement across replacement sessions.
**Verification:** all source phase1 gates before U3.

Evidence: 41 diagnostics tests, package build, all3app type targets, test consumer types, scoped lint passed; native Node24 four-case cancellation matrix passed. Independent review: APPROVED 001-u2-api-security-review-r5, including supported-writer observation precondition. Commit: U2 changeset. See phase journal for preserved red evidence and prior findings.
