---
feature: 001-operational-visibility
unit: U6
status: todo
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

Evidence: pending. Independent review: pending. Commit: pending.
