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

U1 commit: `ad072f0`.

## U2 — typed environment bindings

`app.env` and component definition `env` now contain opaque typed configuration references; validator declarations remain separately available as `environmentSchema`. Runtime initialization seals the graph, validates the application and each mounted instance, awaits Standard Schema validators, and validates options/defaults. Explicit bindings use the immediate parent's validated output and are revalidated by the child. Runtime scope access rejects other definitions and access outside initialization/invocation scopes. The Neon release path continues reading schema declarations rather than symbolic references.

Evidence strategy: four new tests failed before implementation (missing readers, ignored bindings and missing validation); expanded to six covering nested bindings, foreign/forged references, cross-scope access, missing instance paths, invalid JS options, defaults, asynchronous validation, isolation, and redaction. Type fixtures reject incompatible transformed output bindings and treating symbolic references as strings.

Simplification and code/security review ran inline using the same ce-simplify-code and ce-code-review lenses as U1. Checked source-property ownership, reference provenance, parent scope ownership, async context isolation, child revalidation, and secret-free errors. No independent-review claim. Root anti-slop initially rejected untyped dictionaries; replaced them with Standard Schema-derived environment outputs. No remaining actionable U2 finding. Generated facade emission and complete component deployment discovery remain U3 obligations; no claim of deployed component support yet.

Verification: workspace build (7 tasks), workspace typecheck (16 tasks), all 241 unit tests (61 files), and root lint passed. Final scoped format/type checks follow the final annotation-only lint fix.
