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

## U5: Native graph generation

Fresh projects now scaffold ordinary procedures with schema-bound database middleware. First-load virtual bindings resolve `_generated/server` without requiring an existing generation. Native procedure exports and explicit `router`/default router exports form one graph; helper exports stay out. `loom/functions` supplies public routes and `loom/internal` supplies the server-only graph. Collisions, invalid segments, non-procedure router leaves, mixed legacy/native graphs and cyclic routers are rejected.

Generated browser runtime imports only the native client factory. Its declarations derive the exact native RouterClient from type-only procedure imports; internal paths and helpers are absent. Server bundles contain the actual native procedures, with no parallel FunctionReference registry for native projects. Stable public files point at the active private generation; successful activation retains two private runtime generations. Renames/deletions remove old types, including when the last procedure disappears. Recognized older generated wrappers migrate to stable re-exports; modified user files are refused. Migration history stays outside generated output.

Schema table/validator Effect services are provided alongside the Promise context, with distinct service identities so empty schema maps cannot satisfy unrelated capabilities. Database middleware verifies the schema/relations pair and preserves those services. Generated server files reject symlinks instead of writing through them.

- `bun run check`: 15 tasks succeeded; 187 unit tests passed.
- Generation, CLI and packed-consumer integration: 11 passed, zero skips. A clean packed consumer generates and typechecks native procedures and builds the browser client.
- Native PostgreSQL transaction regression: one test passed, zero skips (23 assertions), including HTTP/WebSocket replay.
- Negative type checks cover public/internal separation, input inference, helper exclusion and absence of database authority on bare Effect procedures.
- Browser inspection, failed-generation recovery, deterministic regeneration, deletion, bounded runtime artifacts and generated-file symlink refusal passed. Oxlint and diff checks passed.

Sequential code/security review examined route injection, public/internal separation, source import cycles, artifact replacement, generated file ownership, browser imports and Effect service identity. Fixed file-symlink writes and structural service-identity leakage. No unresolved findings within this unit. Review was performed in the main session, not independently.

Cross-unit boundaries remain explicit: U6 supplies native service transports; U11 assembles deployable service artifacts; U8 adds callable TanStack option methods over the generated native client; U10 moves durable internal calls/workers; U11 integrates activation and upgrades. Native generation is not yet a claim of a deployable hosted service. Legacy lifecycle fixtures remain explicitly named until their replacements land. Hosted Neon acceptance remains U12.

## U6: Authenticated native transports

Added HTTP RPC, strict-contract OpenAPI and native Neon WebSocket adapters over the same public procedure graph. The application owner keeps upgrade requests/responses outside response-rewriting middleware and drains requests and socket work before callers close their database. OpenAPI generation rejects missing output contracts before serving the REST adapter. Native RPC preserves undefined properties, Date and bigint consistently with durable replay.

HTTP checks exact origins, protocol/version headers, methods, byte limits, bearer sessions and expiration; authentication waits have a deadline. Tickets require an authenticated session, browser origin and an empty JSON object. WebSocket admission requires the native protocol, exact deployment version and a single-use ticket. Capacity is reserved before asynchronous redemption. Peer metadata cannot replace trusted identity. Session byte/rate/concurrency/buffer limits, heartbeat, expiration, cancellation and shutdown surround the native oRPC protocol.

Review found and fixed uncancellable ticket work escaping shutdown, serializer defaults dropping undefined properties, REST ingress errors using RPC envelopes, and array-shaped ticket bodies passing an empty-object validator. Shutdown now drains ticket redemption even after admission is cancelled. Code/security review ran sequentially in the main session, including correctness, lifecycle races, authorization boundaries, public contracts, tests and repository standards; it was not independent. No unresolved findings within the adapter unit.

- `bun run check`: all 15 tasks succeeded; 187 unit tests passed, with build/typecheck/static checks.
- Seven native transport integration tests passed, zero skips (49 assertions): real local HTTP/WebSocket clients, trusted identity, errors, cancellation, native values, authentication deadline, strict OpenAPI, malformed binary/oversized frames, idle expiration, reservation limits, unchanged provider response and draining pending redemption.
- Three PostgreSQL 18 regression suites passed, zero skips (69 assertions): durable single-use/scoped tickets, pooled identity isolation and native transaction replay/reauthorization.
- Final native transport typecheck and strict undefined-property assertions passed.

The provider upgrade bridge test uses Neon's documented runtime bridge with a test response; it is not hosted acceptance. Actual Neon Functions deployment and WebSocket acceptance remain U12. Runtime graph binding, generated deployable service assembly and activation remain part of the U10/U11 integration work. Existing legacy adapters remain until U13.

## U7: Transactional notification wake-ups

Added an append-only framework migration replacing the existing revision trigger function. It advances durable revisions and calls PostgreSQL NOTIFY in the same transaction. The channel contains a hash of the metadata/application namespace; the payload is the constant `1`. It carries no row data, identity or credentials. Existing migration hashes remain unchanged, and previously installed triggers pick up the replacement function.

A lazy listener owns one direct PostgreSQL connection, checks the configured runtime identity against database authority, rejects pooled Neon URLs and privileged/member/metadata-owner roles, and commits LISTEN before snapshot work begins. Listener loss publishes a degraded diagnostic, prompts revision reconciliation and reconnects with capped backoff. Stop drains connection setup and closure. The subscription coordinator shares this listener, releases it when the last subscriber leaves, preserves bounded evaluation concurrency and coalesces wake-ups into a follow-up cycle if a commit arrives during evaluation. Reconciliation remains periodic, and notification payloads are never interpreted as results or authority.

- `bun run check`: 15 tasks succeeded; 188 unit tests passed at that run.
- Six focused subscription tests passed after adding the continuous-burst regression (one additional test): startup ordering, commits during an in-flight evaluation, burst coalescing, concurrency/backpressure and listener cleanup.
- PostgreSQL 18: three suites passed, zero skips, 55 assertions. Covered existing-metadata upgrade/hash preservation, insert/delete/truncate, rollback, direct SQL, restricted LISTEN, forged payloads, terminated-listener recovery, privileged/pooler refusal, snapshot consistency and missing revision metadata.
- Final core/e2e/test typechecks, Oxlint and whitespace checks passed.

Sequential code/security review covered SECURITY DEFINER search_path, migration history, opaque hints, credential restrictions, idle/shutdown ownership, reconnect races and bounded notification handling. Fixed reconnect loss during pending setup, repeated client closure, starvation from continuously resetting the wake timer, and subscriber replacement during listener startup. No unresolved findings within U7. Review was in the main session, not independent.

U8 replaces the legacy subscription call envelope with native iterators. U11 exposes explicit polling/notification configuration and resolves the direct runtime URL through the deployment lifecycle. No compute billing setting has been changed. Hosted low-latency acceptance remains U12; local listener success is not hosted acceptance.

Sources checked: https://www.postgresql.org/docs/current/sql-listen.html and https://www.postgresql.org/docs/current/sql-notify.html.
