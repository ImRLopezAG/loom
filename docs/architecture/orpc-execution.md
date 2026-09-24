# oRPC migration execution evidence

Plan: `docs/plans/2026-09-24-1400-refactor-orpc-effect-framework-core-plan.md`.

## U1: Dependency compatibility

Pinned oRPC 2.0.0-beta.40, Effect 4.0.0-rc.117, Neon SDK 6.1.0, config 1.7.3 and config-runtime 1.6.3 after checking registry channels on 2026-09-24. Existing TypeScript 7, Bun, Drizzle RC and Neon Functions pins remain. The Drizzle MIT patch is unchanged. The Apache-2.0 Neon config patch applies to 1.7.3 and still rejects unknown/missing bucket access levels; packed-consumer verification exercises that behavior. License notices and the renamed patch are bundled.

Evidence strategy: dependency/configuration changes use compatibility tests; the Effect upgrade reproduced two fixture failures before changing their Standard Schema adapter calls. New native oRPC tests cover service provision, declared errors, validation before execution and compile-time input/context rejection.

- Baseline `bun run check`: 15 tasks succeeded (14 cached).
- Updated `bun run check`: 15 tasks succeeded; 173 unit tests passed.
- Focused validator, oRPC/Effect and Drizzle suites: 20 passed, zero failures.
- Packed consumer and Node/browser smoke: 2 passed; two database checks initially skipped, then executed below.
- PostgreSQL 18 migration and Node compatibility: 5 passed, zero skips. Actual column data survives rename; introspection works in ESM and CommonJS.
- Uncached core typecheck baseline, three samples: 0.407 s, 0.466 s, 0.435 s. Artifact sizes recorded in `/tmp/loom-orpc-u1-baseline.json`. Hosted timing comparisons remain required before runtime acceptance; retain the pre-migration Git base for matching baseline deployment.

Code review and security review ran sequentially in the main session, as instructed. No unresolved findings. Checked dependency/patch scope, Standard Schema API changes, negative type fixtures, Node/browser boundaries, fail-closed privacy behavior and packed license/patch delivery. This was not an independent review. Receipt: `/tmp/compound-engineering-501/ce-code-review/loom-u1/review.json`.

No hosted acceptance is claimed by this unit. Runtime migration starts in U2.

## U2: Effect invocation ownership

Added a shared ManagedRuntime with request-local identity, signal and finalizers. Native Drizzle remains the database implementation. Generated bindings can create schema-bound database/table/validator service keys; scheduler, storage and diagnostics have explicit service keys. The existing runtime's owned Promise operations now drain through the Effect boundary.

Proof-first: the new scope tests failed typechecking because the runtime exports did not exist. Implemented them, then verified identity isolation, interruption finalizers, pre-aborted admission, operation failure, repeated stop and shared-resource disposal. Non-cancellable Promise work stays uninterruptible until its transaction settles; cancellation cannot release its client early.

- `bun run check`: 15 tasks succeeded; 176 unit tests passed.
- PostgreSQL 18 scope, runtime compatibility and credential-preflight suites: 3 passed, zero skips. An interrupted in-flight query retains its pooled client until rollback; escaped transaction execution fails.
- Build/typecheck and Oxlint remain enabled. Corrected the compatibility fixtures to use Node assertion promises and the existing Vite+ unit harness.

Sequential code/security review covered identity capture, shared-versus-request state, cancellation races, rejection propagation, shutdown order, pool ownership and exported service types. Review tightened cleanup so service-disposal failure cannot skip Object Storage close. No unresolved findings. No independent agent or cross-model review ran, per the workspace instruction to execute review tasks in the main thread. Provider deployment is not yet acceptance-tested.
