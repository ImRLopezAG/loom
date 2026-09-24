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

## U3: Native procedure contracts

Added the project-bound native oRPC builder, with schema tables/validators injected once, optional inputs, inferred outputs, ordinary middleware and Effect handlers. Client presentation metadata defaults to mutation and remains separate from database authority; the bare procedure has no database capability. Existing builders remain until U13 parity removal.

Native RPC encoding preserves Date, bigint, undefined, null, sets and maps. Finite result validation rejects unsupported values and cyclic results. Explicit output contracts validate transforms through native oRPC. Precise OpenAPI export requires an explicit output schema and fails with the procedure path when conversion is unsupported. Valibot conversion is pinned to the matching oRPC version and configured to throw; Effect's public JSON Schema converter is invoked directly because the upstream wrapper suppresses conversion errors into empty schemas.

- Red: contract tests failed on the missing project builder export.
- `bun run check`: 15 tasks succeeded; 184 unit tests passed.
- Focused native contracts: 8 passed, including Effect Schema OpenAPI export after the full check.
- Type fixtures reject invalid input, unknown table/ID names, missing invocation context and output-transform mismatches. A discovered context-widening bug was fixed with explicit schema-indexed bindings.
- Oxlint and diff whitespace checks passed.

Sequential code/security review examined native middleware ordering, schema projection, declared error validation, Effect defect redaction, default metadata and finite serialization. Expected Effect failures retain declared public errors; defects are redacted even when their payload is a declared ORPCError. No unresolved findings in this unit. Transaction commit-order proofs remain U4, not a claim of this authoring-only unit. Review was in the main session, not independent.

Provider readiness: authenticated Neon CLI read confirmed project `late-moon-69483649`, name `loom`, region `aws-us-east-1`. The connector currently drops required arguments and cannot read the project; CLI access works. No hosted mutation or new hosted acceptance has occurred.

References checked: https://orpc.dev/docs/middleware, https://orpc.dev/docs/integrations/effect, https://orpc.dev/docs/openapi/specification, and installed beta.40 implementation/declarations.

## U4: Native transactions and replay

Added reusable database-read/write middleware and a native Procedure binding boundary. It moves complete input validation before transaction acquisition, retains output validation inside the transaction, and performs native serialization preflight before commit. Bound middleware receives fully validated input. Router-inherited middleware is supported. This uses oRPC's exported Procedure and OrderedMiddleware interfaces; it does not add a second endpoint registry.

The existing PostgreSQL transaction implementation remains the only conflict retry owner. Read procedures use read-only repeatable-read transactions; writes use serializable transactions. A stable logical invocation token spans retry attempts. Nested calls share the guarded transaction, reject identity/connection changes and write escalation, and poison the transaction when their failures are caught by application code. The guarded database is also supplied as an Effect service.

Replay reuses the existing atomic receipt/tombstone implementation with a native serializer envelope and explicit protocol version. The version is deliberately absent from the lookup scope, so incompatible saved results produce RPC_VERSION_MISMATCH instead of repeating a committed write. Authorization runs inside every attempt and before replay. Native custom error HTTP status mapping belongs to the U6 adapters because oRPC v2 separates error codes from transport status.

- Red: initial native PostgreSQL execution exposed optional serializer fields that JSON persistence must omit. Fixed by using the native JSON transport representation.
- Red: nested conflict test showed premature inner error redaction prevented retry. Moved redaction outside the outer retry owner.
- `bun run check`: 15 tasks succeeded; 184 unit tests passed, with typechecking and static lint enabled.
- PostgreSQL 18 native transactions, existing transactions/replay, and Effect cancellation: 5 passed, zero skips, 92 assertions.
- Native direct, HTTP and real local WebSocket clients replay the same receipt without a second commit; Date and bigint survive transport.
- Negative cases cover malformed input before authorization, transformed input exactly once per invocation, invalid output, unserializable output, revoked authorization, changed arguments, incompatible receipts, read-only writes, nested write escalation, caught nested validation failure and pre-aborted calls. Router inheritance and Effect database access pass.

Sequential code/security review covered commit ordering, authorization on replay/retry, connection and identity ownership, native input transforms, protocol mismatch behavior and nested failure propagation. No unresolved findings in this unit's boundary. Native scheduler/storage rollback integration remains a U10 cross-unit acceptance case; hosted Neon execution remains U12. Review was performed in the main session, not by independent agents.
