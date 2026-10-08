---
feature: 001-operational-visibility
unit: U1
status: done
---

# Finite projection contract

Plan: [U1](../plans/001-operational-visibility.md#u1-finite-projection-contract-source-phase0).

Dependencies: none.
Ownership, requirements, test scenarios and acceptance: preserve the referenced unit and its source phase verbatim. Begin with observed failing proof for new behavior. Host owns canonical verification and commits; workers own explicitly assigned files only.

## Acceptance and owned scope

**Goal/requirements:** R2,R5; freeze all current event fields and the reviewed extension seam.
**Dependencies:** none.
**Files:** new tooling diagnostics `types.ts`, `project.ts`; `packages/tests/unit/diagnostics.test.ts`.
**Approach:** KTD1; derive discriminated event records without coupling source and public-dist state. Keep declaration changes additive.
**Test scenarios:** each variant and deployment stage accepted; extra canary stripped; getters never called; hostile proxy exceptions contained; malformed enum/numeric values rejected; retained input mutation cannot change copied events; type exhaustiveness detects publisher additions.
**Verification:** source phase0 package build/types and focused projection tests pass; independent bounded contract review before communicating a baseline commit to005.

Evidence: focused 11 tests, package build, three package typecheck targets and test typecheck passed. Worker observed missing-module red before implementation. Independent review: APPROVED, task 001-u1-contract-review-r1 (codex/gpt-6-astra low), no findings. Commit: this U1 changeset.
