# Components execution evidence

Plan: [Components, Internal Calls, and SDK Services](../plans/2026-09-27-0947-feat-components-internals-sdk-services-plan.md).

Started on `feat/orpc-effect-core` at `a433504`. Existing README edits and untracked earlier plans/explainers are excluded. Existing unpushed commits are not authority to publish. Implementation and review run sequentially in the main session under the user's AGENTS instructions; reviews do not claim independent corroboration.

The goal tool refused a new objective because the previous package/auth goal remains paused. No goal was falsely marked complete to replace it. This record tracks the new implementation separately.

## U1 — definitions and mount graph

Added explicit `defineComponent` / `app.use`, typed Standard Schema options, opaque mount references, distinct named instances, and graph sealing. Compilation evaluates neither environment validators nor SDK factories. Nested mounts expand by instance path; duplicate/reserved names, cycles, forged definitions/references, and dependencies outside the owning scope fail closed. Existing application RPC behavior remains unchanged.

Evidence strategy: wrote five graph tests before implementation; observed all five fail because `defineComponent` was absent. Positive and negative compilation fixtures exercise required, defaulted, and invalid options through compiled `loom` exports. Existing application-definition tests cover the no-component path.

Simplification: applied ce-simplify-code reuse, quality, and efficiency lenses inline. Removed the duplicated registration field declaration by sharing it with graph nodes. Retained provenance checks and the separate definition/reference registries; they enforce different boundaries.

Code/security review: ce-code-review lenses for correctness, standards, testing, maintainability, API contracts, security, and adversarial composition ran inline. Checked mount identity, cross-application references, sibling-only dependency resolution, graph atomicity, prototype-sensitive keys, no factory execution, and unchanged app context. Strengthened coverage for failed compilation leaving declarations writable and copied-definition rejection. No remaining actionable U1 finding. This is a unit review, not acceptance of later runtime/codegen units. Runtime option validation belongs to U2; scope capabilities belong to U3–U9.

Verification: workspace build (7 tasks), workspace typecheck (16 tasks), all 235 unit tests (60 files), and root Oxlint passed. Re-ran the 7 focused tests after final review edits; all passed. Scoped formatting and diff checks passed. The pre-existing README trailing blank line remains untouched. Inline review receipt: `/tmp/loom-components-u1-review/review.json`.
