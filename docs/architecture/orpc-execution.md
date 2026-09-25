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

## U8: Native callable options and snapshot iterators

Generated `createApi` binds `api`, the raw oRPC client, and an owned TanStack QueryClient to one deployment/generation/identity. Consumers call `useQuery(api.tasks.list({ input, enabled, select }))` or `useMutation(api.tasks.save({ onSuccess }))`. Finite/live/mutation choices come from native presentation metadata. Options use upstream oRPC generics and implementations, preserving initial-data inference, skipToken, callbacks and native wire values. Custom keys replace only the inner key. Convenience methods reject transport replacement; `.native` and `.call` provide explicit upstream escape hatches. Query execution checks its owning QueryClient. Session disposal aborts calls and clears both observers and cache entries.

Live RPC routes emit native iterators at their original paths. The revision coordinator is now independent of the legacy envelope; that envelope has a temporary adapter until examples migrate. Each native evaluation invokes the original authorized procedure, captures revisions inside its read transaction, and publishes only after transaction completion. Input is captured once and cloned for each evaluation. Each iterator holds one latest unread snapshot, enforces session expiry, redacts unexpected errors and drains active evaluation on cancellation. Generated wire types reflect the iterator output without leaking server imports into browser JavaScript.

Verification:

- Full workspace check: 15 tasks, 194 unit tests.
- Three PostgreSQL 18 suites: native live, native transactions and legacy evaluation regression; 55 assertions, zero skips. Includes a write racing with an authorized snapshot, permission revocation, input transforms, native Date/bigint transport and connection release.
- Clean generated consumer compiles cover mutation and live callables, native input/output inference and internal-route exclusion.
- Packed Chromium consumer: native React hooks share a stream, forced WebSocket loss creates one fresh subscription for two observers, and sign-out clears rendering and stops the stream. Combined generator/browser run: 38 assertions, zero skips.
- Oxlint, consumer typechecks and whitespace checks pass.

Sequential code/security review covered identity/key isolation, owning-client checks, input mutation across evaluations, cancellation/drain behavior, bounded queues, declared-error propagation and browser import boundaries. Fixed missing ownership checks and reused mutable input. No unresolved findings within this unit's implemented surface. Review ran in the main session, not independently.

U9 supplies finite SSR snapshots and optimistic pause ownership. Native deployment graph assembly and credentials remain U10/U11; legacy transports stay available to the unmigrated examples until U12/U13. The local PostgreSQL and Chromium results do not establish hosted Neon acceptance.

## U9: Optimistic ownership and finite SSR

`optimisticMutation` composes native mutation options with session-owned pause counts for affected live keys. It cancels active evaluations before `onMutate`, gates refetch/reconnect attempts, and resumes only after the last overlapping mutation's callbacks settle. TanStack remains the sole result cache. Applications supply optimistic edits and rollback; overlapping whole-cache rollback is not inferred. Attempt records survive React option replacement and restored mutation execution. Identity disposal aborts work and prevents late mutation callbacks from repopulating the old cache.

Successful writes are recorded before lifecycle callbacks run. A success/settlement callback failure does not invoke the option-level rollback callback; it releases the pause and reconciles. `OptimisticCallbackError` exposes the phase and `committed` flag to callers and global mutation-cache observers. Global application error policies must respect that flag; native TanStack callback error propagation remains intact.

Live callables expose `.snapshot(...)` for finite SSR query options. It consumes the first native iterator result and closes the iterator in `finally`. Finite and live keys remain distinct; browser live options can seed from the hydrated finite cache and then attach a stream. Caller options retain precedence. Hydration must use the native serializer to preserve Date/bigint, as demonstrated by the integration fixture.

Verification: full workspace check passes 15 tasks and 198 unit tests. Four optimistic unit tests cover overlapping mutations, gated background refetch, queued old emissions, failed writes, throwing callbacks, React option replacement and identity disposal. Three consumer tests pass with zero skips: actual Chromium optimistic behavior, reconnect regression and HTTP SSR/hydration; 23 assertions. SSR releases the finite stream and two hydrated observers share one live stream.

Sequential code/security review found and fixed per-render attempt loss, late callback execution after identity disposal, and ambiguous callback errors after successful writes. Reviewed pause finalization, retry boundaries, same-session ownership, bounded state, snapshot cleanup and native option inference. No unresolved findings in U9; review ran in the main session, not independently. Hosted provider acceptance remains U12.

Sources checked: https://www.postgresql.org/docs/current/sql-listen.html and https://www.postgresql.org/docs/current/sql-notify.html.

## U10a: Native durable job execution

The queue SQL and worker lease lifecycle now have one shared implementation, with temporary legacy adapters. Native jobs persist an explicit `loom-orpc-2` envelope using the oRPC serializer. Scheduling resolves actual procedure objects through the generated internal graph, validates inputs through a validation-only native procedure, and never runs application middleware or handlers during enqueue. Workers invoke the authorized, transaction-bound internal graph using the stable job id for replay.

Database context exposes a typed scheduler and `RpcSchedulerService`. Scheduling belongs to the current write transaction: even unawaited work is drained before output validation/receipt commit, and caught scheduling failures abort that attempt. Context capabilities reject use after their invocation ends. Input is captured before asynchronous enqueue work can observe caller mutations.

Verification: full workspace check passes all 15 tasks and 198 unit tests. Six PostgreSQL suites pass with zero skips and 155 assertions across native jobs, native transactions, legacy jobs, process termination/recovery, cron receipts and storage events. A final focused run adds the escaped-scheduler regression and passes both native suites. Native coverage includes Date/bigint persistence, validation without executing handlers, stable deduplication, committed-write replay after lost acknowledgement, stale lease rejection, caught enqueue failure rollback and unawaited enqueue rollback on invalid output. Oxlint and whitespace checks pass.

Sequential code/security review covered captured inputs, internal procedure identity, native validation sequencing, principal restoration, scoped scheduling authority, pending-work drain, receipt ordering, bounded queue payloads and lease fencing. Fixed a scheduler capability that could otherwise escape its invocation, caught errors from an unconfigured scheduler, and nested draining of the parent's pending work. No outstanding findings in this subunit; review ran in the main session, not independently.

U10 remains in progress: storage/cron native bindings follow. U11 still owns old-envelope migration mappings and activation inventory; U12 owns hosted Neon acceptance. These local tests do not establish hosted acceptance.

## U10b: Native storage-event and cron dispatch

Native storage and cron dispatchers now enqueue versioned oRPC calls through the shared receipt/state-machine implementations. Storage still verifies saved intents and uploaded bytes before enqueue, carries uploaded-by as event data, and executes with a null service identity. Cron occurrence and provider-delivery deduplication remain separate and transactional. Queue/version/declaration inputs are captured at construction. Existing legacy adapters continue using the same receipt code during migration.

The storage-event and cron failure-injection suites now execute native procedures. They cover concurrent deliveries, completed-job redelivery, payload/version conflicts, failed receipt insertion, restricted receipt permissions, late upload reconciliation, failed upload verification, retired ingress, cloned branch isolation and real trigger-adapter HTTP requests. Seven PostgreSQL test files pass eight tests, zero skips, with 88 Bun assertions plus node:assert checks. These include native jobs, legacy queue behavior, storage intents, cleanup and runtime storage. Full workspace check passes all 15 tasks and 198 unit tests; Oxlint and whitespace checks pass.

Sequential code/security review verified that receipt SQL, activation locks, saved owner identity, bucket/key validation, upload verification and reconciliation limits remain shared and unchanged. Reviewed captured configuration, internal-path validation and transaction rollback on enqueue/receipt failure. No outstanding findings in these bindings; review ran in the main session, not independently.

U10's durable execution and trigger bindings are implemented. U11 must assemble them into the generated native runtime, authoring configuration and CLI, including explicit old-job mappings and cutover fences. U12 must still verify actual Neon Functions and Object Storage rather than the local provider fixture.

## U11a: Native runtime, generation and development wiring

Project loading now distinguishes native procedure projects from legacy fixtures. Native auth defaults to deny, and cron/storage declarations resolve actual internal procedure objects. Invalid targets or auth modules cannot replace the active generation. Generated native service and worker modules assemble the same authorized graph, transaction owner, durable queue, revision coordinator and storage control plane. Public transports exclude internal procedures; provider triggers run only on the worker entry.

`loom dev` supports native HTTP and ticket-authenticated oRPC WebSockets. Generation replacement and shutdown retain their existing ownership boundaries. Configuration adds explicit polling/notify mode and a direct runtime URL environment variable. Notify deployment preparation verifies the restricted direct role against the selected database, and runtime startup rejects pooled, mismatched or identity-overriding direct URLs. Development uses its already verified direct runtime connection. Legacy projects reject notify mode instead of silently ignoring it.

Verification: full workspace check passes all 15 tasks and 200 unit tests. Eleven generator/CLI integration tests pass with 160 assertions and no skips, including generated consumer typing, internal-route exclusion, captured native capabilities and atomic failed-generation behavior. Eleven runtime/transport/development tests across five files pass with 93 assertions and no skips. A final focused native-runtime run additionally proves configured oversized outputs roll back their database write. Actual Bun WebSocket calls, duplicate native cron trigger delivery, activation rejection and awaited shutdown pass. Final consumer typecheck, Oxlint and whitespace checks pass.

Sequential main-session code/security review covered default-deny auth, internal graph separation, prototype-safe route construction, capability membership, output limits before commit, direct connection authority, original Neon upgrade requests, storage/worker route separation and shutdown ownership. Fixed inherited-property traversal in router assembly and query-parameter overrides in direct URLs. The review is not independent. No outstanding findings in this subunit.

U11 is not complete: explicit durable-envelope mappings, populated-state upgrade inventory and cutover/rollback fences remain. U12 still owns hosted Neon acceptance and example migration; the tests above use local PostgreSQL and do not establish hosted acceptance. U13 owns removal of temporary legacy adapters and final documentation/release checks.

## U11b: Durable procedure upgrades

Metadata migration 23 adds owner-controlled job routing and a procedure-release ledger without changing migrations 1–22 or stored call envelopes. Native projects may export explicit `defineJobMigration` declarations from `loom/upgrade.ts`. Each declaration identifies the exact old protocol, source version and route, validates the old input, converts it, and validates the target internal procedure's input without executing middleware or handlers. Generated service/worker bindings carry those declarations. Conversion happens in memory when the assigned worker claims a job; the original durable input stays intact.

Activation inventories pending/running work under database barriers. Only never-attempted work without replay history or write receipts can transfer. Attempted work must drain on its retained release; incompatible rollback is refused. Routing changes and activation commit together, incrementing job fences. A database trigger rejects old-worker claims even after a new worker has left its lease version on the row. Runtime credentials cannot modify routing, and deployment preflight detects accidental grants. Native activation cannot bypass this gate through the old low-level activation API.

Legacy releases retain their established draining behavior. Ingress handoff and explicit database retirement continue to own previous-release shutdown; migration does not prematurely retire retained grants. Development assembles an unpublished candidate under its quarantined grant before activation, and failed assembly leaves the previous grant active. Schema compatibility and retirement checks follow the assigned worker version while the original envelope remains available for audit.

`DURABLE_UPGRADE_BLOCKED` reports a bounded inventory containing UUIDs, version hashes and reason codes, never job inputs. Operators must drain retained work or add reviewed, deterministic mappings, then retry the same release identity. Do not delete replay receipts or reset attempts to force a migration. Expanded metadata remains in place on code rollback; rollback must pass the same durable-state checks.

Verification: all 15 workspace tasks pass, including 202 unit tests. PostgreSQL 18 regression passes 17 tests across 14 suites with 228 assertions and no skips. The suites exercise bootstrap history preservation, lease recovery, native jobs, storage events, cron dispatch, activation, release resumption, schema compatibility and failed candidate startup. Generated migration bindings and negative converter type checks pass. Final focused upgrade/release and CLI checks are recorded with the unit review receipt.

Sequential code/security review in the main session examined claims from old workers, receipt replay, partial activation, rollback, routing privileges, metadata history, code generation and diagnostic redaction. Fixed candidate activation ordering, low-level activation bypass, mutable migration descriptions, accidental routing grants and retained-legacy regression. This is not independent review or hosted acceptance. The final whole-change review remains required.

U11's native CLI wiring and durable upgrade boundary are implemented. U12 still requires migrated examples and actual Neon Functions/Auth/Postgres/Object Storage acceptance, including multi-instance live-query measurements. U13 still requires legacy removal, documentation, packed-consumer checks and CI/release validation.

## U12a — Native runnable examples and browser transport

Migrated Tasks and Upload Catalog to generated native procedures, explicit database middleware, inferred public results, callable TanStack options and per-identity QueryClient ownership. Internal storage jobs now live under `loom/internal` and schedule procedure objects. Public mutation results use explicit projections so inferred output types do not expose owner fields. The upload job-status view uses TanStack's finite polling options. Production examples use Neon Auth; fake Alice/Bob sign-in exists only in the disposable acceptance build fixture.

Added a browser-native oRPC WebSocket transport that obtains single-use tickets, preserves deployment prefixes, refreshes credentials on reconnect and owns socket shutdown. Disposing a session aborts pending calls; a delayed credential lookup cannot open a socket after disposal. Ticket version/auth refusals remain typed errors and stop further ticket requests. Mutation calls are not replayed by reconnection. Generated API exports its release version; contract fingerprint is 13. Storage has a separate control-plane client entry point; extracting its implementation from the legacy transport remains U13.

Verification:

- Full workspace check: 15 tasks, 204 unit tests, followed by the final three transport tests after the version-refusal review fix. Oxlint passes.
- Chromium with PostgreSQL 18: Tasks live updates, reconnect and user isolation; Upload Catalog signed bytes, downloads, retry and terminal failure; zero skips.
- Isolated tarball consumer: copied Tasks installs, builds, typechecks and runs in Chromium outside the workspace.
- PostgreSQL example lifecycle: ownership, public projections, native validation, persisted UUIDv7 IDs, foreign keys, runtime DDL denial, committed migration replay and schema evolution; four tests, zero skips. Upload worker/event integration also passes.
- Native generator regression and packed browser transport regression pass. E2E TypeScript passes. React Doctor reports no issues for either example.

Sequential code/security review covered output redaction, private route discovery, identity-bound credential lookup, bearer-ticket handling, disposal races, fresh reconnect tickets, version refusal, restricted database authority and separation of fake auth from production builds. Review fixed public projections, stale-version error loss, copied-project dependency isolation and pending-call disposal. No outstanding findings within this unit. Review ran in the main session, not independently; the final whole-change review is still required.

U12 remains incomplete: hosted Functions/Auth/Object Storage acceptance, multi-instance notifications, load measurements and populated-branch upgrades are next. Authenticated read-only provider inspection confirmed project `late-moon-69483649` (`loom`), PostgreSQL 18, `aws-us-east-1`. No cloud resource was mutated in this unit. Local results do not establish hosted acceptance.

## U12b — Hosted Auth, Functions and Object Storage

Extended the real Neon Auth acceptance suite to both native examples. Tasks passed signup, live CRUD and session re-entry on the owned Tasks branch. Upload Catalog passed signed upload/download bytes, actual provider object-created delivery, scheduled retries, terminal failure and session re-entry on a separate owned branch. Each run executed one test with no skips; storage took 185 seconds. Target and release evidence is recorded in `orpc-neon-acceptance.md`.

Sequential main-session code/security review checked branch-name fencing, restricted runtime credentials, secret-free receipts, real provider events without manual worker substitution, byte comparison, bounded waits and test-root cleanup. Fixed the selected-example target label and misleading runtime-role assertion. Typecheck and lint pass. This is not independent review. Cloud resources are deliberately retained for the remaining U12 checks and must be removed by this run; their temporary key must be revoked. Multi-instance, performance and populated-upgrade acceptance remain open.

## U12c — Realtime operational counters

Added bounded diagnostic-channel counters for active subscriptions, running evaluations and remaining batch entries. No endpoint or user data is added to the runtime. The hosted acceptance fixture can consume these metrics to verify concurrency and cleanup instead of inferring resource behavior from latency alone.

The blocked-evaluation test proves the concurrency bound, that queued evaluations never begin after stop, and that all counters return to zero after shutdown. Full workspace check passes 15 tasks and 206 unit tests. Sequential main-session code/security review checked cancellation, queue accounting, bounded labels and absence of identifiers or payloads; no outstanding findings in this small unit. Hosted resource acceptance remains pending.

## U12d — Cross-instance hosted realtime smoke test

Added a reproducible two-Function harness using the generated service, a test issuer whose private key stays in the test process, 100 browser TanStack observers, direct SQL writes and forced LISTEN disconnections. Test-only metrics travel over the same authenticated RPC peers as the subscriptions, because separate HTTP requests can reach different Neon isolates. This corrected the initial idle-metrics failure instead of weakening the resource assertions.

The corrected hosted smoke test passed with no skips. Both distinct instances held 50 subscriptions, recovered their listeners, observed all 100 writes and released subscriptions/listeners after unsubscribe; evaluation and batch limits held. Full evidence and preliminary ten-second latency bounds are in `orpc-neon-acceptance.md`. This does not satisfy the full performance gate. An isolated pre-redesign build also established initial size/typecheck comparisons; no measured aggregate exceeds the 20% threshold.

Sequential main-session code/security review checked target fencing, runtime-only deployment credentials, test-only metric authorization, issuer-key isolation, bounded retained samples, original provider upgrade requests, deliberate absence of secret-bearing receipts and cleanup ownership. Typecheck and Oxlint pass. No outstanding findings in this subunit; final whole-change review remains required. Pending work includes long-run matched performance, slow-consumer load, populated upgrades, cleanup and U13.

### Follow-up gates found while preparing final acceptance

- KTD3/U2: `Storage` exists as an Effect service declaration, but `rpc/runtime-graph.ts` does not inject it into procedure contexts. Native handlers also need the diagnostics service in their oRPC Effect context, not only in the outer ManagedRuntime. Complete and verify invocation ownership and identity binding before claiming the service integration finished.
- U6/U11: `createRpcOpenApiApp` exists, but `createNeonRpcService` does not expose an assembled opt-in OpenAPI route. Verify the configuration and finite-router contract end to end rather than counting the low-level adapter alone.
- U11/U12: stale native tickets receive 409; the actual historical client's `/api/loom/call` path still needs a deliberate, client-readable upgrade result on the new service. A generic missing-route result is not enough evidence.
- U13: legacy public builders, transports, React hooks and runtime exports are still present. Their removal, corresponding coverage migration and storage-client extraction remain required.

## U12e — Effect diagnostics context correction

Native Effect handlers now receive Diagnostics in their oRPC context. Database middleware preserves the same service in its typed output context, so composing the generated builder with database capabilities remains type-safe. A regression invokes an actual native Effect handler and observes its diagnostic-channel emission; the full workspace check passes all 15 tasks and 207 tests, and Oxlint passes.

Sequential main-session code/security review covered service identity, context composition, absence of request data in the emitted metric, and listener teardown in the test. The first check caught the database middleware's narrower Effect context; that was fixed before this commit. No outstanding findings in this correction. Storage service injection and assembled OpenAPI remain separate open gates.

## U12f — Assembled OpenAPI configuration

`defineConfig({ openapi: true })` now reaches generated runtime options, the Neon service and local development. Runtime startup rejects public procedures without representable output contracts. REST uses the finite public graph, so a live procedure returns one authorized database snapshot; internal procedures remain absent. The native RPC/WebSocket graph is unchanged. Contract fingerprint is 14.

Verification: full workspace check passes 15 tasks/207 unit tests; 10 PostgreSQL 18 transport, runtime and generation tests pass with no skips. Tests cover configuration propagation, startup rejection, live-to-finite REST output, private route exclusion, invalid authentication and stale versions. The final local runtime test and lint pass after review changed development adapter initialization to occur under an owned request, preventing unobserved initialization rejection. Sequential main-session code/security review found no remaining issues in this unit. This is local adapter evidence, not an additional hosted OpenAPI deployment claim.

## U12g — Invocation-owned storage services

Promise handlers receive `context.storage`; Effect handlers receive `Storage`. Both use the same identity-bound capability. Applications cannot supply an owner or cancellation signal. Started operations drain before invocation completion, shutdown propagates cancellation and waits for cleanup, and escaped capabilities reject further work. Missing storage reports `STORAGE_UNAVAILABLE`.

Storage control-plane calls own independent transactions. Read/write database procedures therefore reject them; a rejected call in a write procedure also poisons its transaction even if application code catches the error. This avoids committing database writes after a forbidden independently committed operation. Storage policy and owner checks remain in the existing intent implementation; typed intent failures become bounded declared RPC errors.

Verification: full workspace check passes 15 tasks and 207 unit tests. PostgreSQL 18 integration verifies actual intent rows, Promise/Effect access, cross-owner denial, escaped capability rejection, transaction rollback after a caught forbidden call, unawaited-operation draining and cancellation during shutdown. Final regression and lint pass after review removed a throw from `finally`, preserving the original handler failure while still draining work. Sequential main-session security/code review examined identity capture, scope escape, retry boundaries and lifecycle ownership. No outstanding findings within this correction; hosted byte/event acceptance remains the U12b evidence, not proof of this newly added handler service on Neon.

## U12h — Deliberate historical-client refusal

The retired `/api/loom/call` path and ticket requests without the native protocol header return a bounded protocol-1 error envelope with `VERSION_MISMATCH` and HTTP 409. This lets the existing historical client report an upgrade requirement without keeping argument decoding, function references or dispatch alive. Origin and method checks still run first; no credentials are verified and no connection ticket is issued for retired requests.

Verification: eight transport tests pass, including the historical client making exactly one request per refused call/ticket and recognizing both errors. E2E TypeScript and Oxlint pass. Sequential main-session code/security review checked preflight/origin ordering, no body parsing or handler side effects, bounded response fields and native protocol preservation. No outstanding findings in this local correction. Actual populated hosted upgrade acceptance remains open.

## U12i — Reproducible sustained hosted load

Extended the two-instance fixture with a 30-second warmup, ten-minute spread/hot-table workloads, finite HTTP timing, concurrent writer lock samples and resource attribution to the measured service pools. Repeated runs reset only rows belonging to the exact test issuer and subject. The issuer fixture now waits for its fresh public key to reach the function URL before issuing tokens. Failed resource assertions retain latency and final-counter evidence without recording credentials.

The full notification spread run completed 6,000 writes, with visibility upper-bound p95 378 ms, zero browser errors and zero remaining subscriptions/listeners. The first historical polling run completed the same workload with upper-bound p95 1,201 ms. These preliminary results do not satisfy the three-run comparison requirement; the latest-runtime run and finite/hot-table measurements remain in progress. See the acceptance receipt for release and measurement boundaries.

E2E TypeScript and Oxlint pass. Sequential main-session code/security review checked fixture ownership, bounded samples, concurrent promise handling, restricted runtime deployments, pool attribution and secret-free receipts. The hosted spread evidence predates the final finite-timing and writer-contention additions; those paths require subsequent hosted verification. No independent review is claimed.

## U12j — Hosted OpenAPI and invocation services

A dedicated storage-enabled fixture now deploys explicit output contracts through the normal generator and Neon release path. Hosted REST verifies Promise creation and Effect status access, cross-owner denial, invalid authentication, stale-version refusal and exclusion of internal procedures. The corrected run passed both this test and the PostgreSQL 18 bootstrap/isolation test with zero skips. The latter now expects all 23 migrations and supplies the owner role explicitly because the branch has multiple roles.

The first hosted attempt exposed a fixture error: `Effect.promise` treated a denied storage operation as a defect, correctly redacted to 500. The handler now uses `Effect.tryPromise` so the declared 403 survives. A PostgreSQL regression verifies both successful and cross-owner Effect access; production defect redaction remains intact. E2E TypeScript and Oxlint pass.

Sequential main-session code/security review checked complete REST output contracts, generated backend typechecking, native service ownership, cross-owner refusal, private route exclusion, secret-safe diagnostics and disposable-branch fencing. No outstanding findings in this unit; review is not independent. This fixture proves assembled OpenAPI and invocation storage on Neon, while the earlier real Auth/upload acceptance remains the byte/event evidence.

## U12k: Populated Neon upgrade and deployment recovery

The hosted upgrade fixture starts from an actual historical `b8ddb6a` deployment with metadata version 21 and 100 tasks. It preserves the application migration history and existing framework hashes while upgrading to metadata 23. It seeds one pending legacy-format job explicitly; this is persisted-envelope migration coverage, not a claim that the historical application scheduled that fixture job.

On disposable branch `br-shiny-union-awunuvgy` in project `late-moon-69483649`, the test interrupted deployment after a real provider function submission, then resumed through normal deployment APIs. The old client received `VERSION_MISMATCH`. The scheduled Neon worker, without a manually invoked trigger, completed the mapped job in one attempt, retained its original envelope, and wrote the expected result. One test passed, zero skipped, in 115.47 seconds. Historical release: `8d151a64be1644cfccf1174c932c65246564ff3e3f0fc3efdaa98315fb84f4ae`; successor: `824e718e0ede22a66e528d67494e519b51c2776944e4b7209eaabbe516e334ed`. Receipt: `/tmp/loom-u12-upgrade-6.json`, completed 2026-09-24T23:50:01Z.

Failed setup attempts remain failures: the initial disposable upgrade branch reached metadata 23 before the fixture's provider wrapper failed. It was deleted and replaced to repeat acceptance from genuine version-21 state. The fixed wrapper preserves provider instance methods. The issuer fixture now gives each public key a unique ID and JWKS URL; it no longer cancels an already-consumed response body. Private signing keys remain only in the test process.

Sequential code/security review covered disposable-target restrictions, historical activation identity, validated SQL identifiers, preserved job payloads and ownership, real submission before interruption, resumed grant ownership, worker claim fencing, assertion diagnostics and secret handling. No unresolved findings in this unit; review was performed in the main session. Performance repetitions, paused-peer acceptance and final owned-resource cleanup remain separate gates.

## U12l: Hosted capacity refusal and Neon close-code correction

A Node `ws` test pauses the actual TCP receive socket and submits 192 calls to an intentionally delayed, 256-KiB response procedure. The first fast/throttled workloads did not establish saturation. The delayed workload exposed a real adapter defect: Neon rejects reserved close codes through its WHATWG socket API. A separate disposable hosted probe returned `InvalidAccessError` for 1001, 1009 and 1013, and accepted 1000 and 4009. The adapter now maps protocol reasons to application codes (4001 shutdown, 4008 policy, 4009 capacity, 4013 resync) while preserving the reason. The provider's upgrade response remains untouched. Generation fingerprint is now `loom-contract-15`.

Hosted acceptance `/tmp/loom-u12-services-11.json` passed on `br-orange-brook-awq4kx1v`, release `c7c4734a586c2aa5c9c296d1a207418f96cb8db84ad51dd9249f9b065632baf5`, at 2026-09-24T23:56:42Z: one test, zero skips, 59.59 seconds. It received `4009 CAPACITY_EXCEEDED` and also passed assembled REST, Promise/Effect storage, cross-owner denial, authentication, stale-version and private-route checks. This proves bounded concurrent-call refusal with a paused receiver; it does not measure the provider's TCP buffer size. The earlier 1006 closure attempts remain failures.

Nine local native transport tests passed with 51 assertions and no skips, including a bridge mock that rejects reserved close codes. The Node test client uses pinned ws 8.21.3 and @types/ws 8.18.1 only as acceptance dependencies. The documentation's compiled procedures add the already-pinned oRPC server dependency. No runtime dependency upgrade is bundled with the fix.

Sequential code/security review checked that close-code translation occurs only at the Neon boundary, socket getters remain live and methods retain their receiver, shutdown drains owned work, and no authentication or capacity limit is weakened. Test credentials enter the child through stdin and are absent from receipts. The hosted diagnostic function is temporary on the owned acceptance branch and must be removed during final cleanup. Review ran in the main session, not independently.

## U13a: Native procedure and client authoring documentation

Updated the compiled documentation procedures and auth policy to use schema-bound native oRPC, explicit database middleware and inferred outputs. Tutorials now describe direct callable TanStack options, identity-owned sessions, finite snapshots, native escape hatches, optimistic pause ownership, Effect failure handling, explicit OpenAPI output contracts, actual internal procedure targets and standalone Neon Object Storage. Development and deployment instructions lead with `loom.config.ts`; advanced declaration files remain optional. Removed obsolete claims about stringified Date/bigint and the custom live store from these tutorials.

The documentation build and compiled examples passed with the full 15-task workspace check; 207 unit tests passed. Sequential code/security review checked examples against generated factory signatures, middleware authority, owner filters, runtime validation, idempotency boundaries, session disposal and storage-event identities. Corrected a stale claim that documentation snippets had been tested as a packed consumer; their current proof is compilation against the built public API. No unresolved findings in these authoring pages. Operator performance evidence, the final upgrade guide, legacy implementation removal and CI gates still remain in U13.

## U13b: Required cloud runner and reproducible predecessor

`test:cloud` now requires an explicit suite and disposable provider target. It discovers the selected endpoint's connection, verifies even supplied database URLs before setup DDL, provisions real branch Auth when requested, and rejects missing or stale success receipts. Historical upgrade setup archives the pinned predecessor with frozen dependencies and overlays only recorded acceptance fixtures. CI runs six required profiles serially, fails missing credentials or skipped matrix execution, records receipt identity and verifies deletion of its expiring child branch. Child branches avoid the provider's schema-only root-branch quota.

Actual local execution of the CI entrypoint passed three tests with zero failures in each profile: jobs-storage on `br-sweet-resonance-awleb27n` (218.64 seconds), populated upgrade on `br-withered-scene-awkpj2zi` (132.40 seconds after historical preparation), and services on `br-orange-brook-awq4kx1v` (64.83 seconds). The services run includes the latest endpoint-bound URL preflight. Receipts are `/tmp/loom-u13-ci-receipts/jobs-storage.json`, `/tmp/loom-u13-ci-upgrade-receipts/upgrade.json`, and `/tmp/loom-u13-ci-services-receipts/services.json`. These are local executions of the CI runner, not a claim that GitHub Actions ran. Branch cleanup remains pending until final evidence collection.

Sequential code/security review checked default/protected-target refusal, explicit endpoint binding and TLS, quoted setup identifiers, credential-free build subprocesses and diagnostics, fixed historical commit, receipt freshness and target identity, matrix skip rejection and exact owned-name cleanup. TypeScript and Oxlint pass. The historical benchmark's third repetition raced server cleanup immediately after browser unsubscribe; its harness now requires two idle samples within ten seconds while preserving the zero-activity assertion. The historical runtime is unchanged and the complete repetition is rerunning; the failed run is not performance acceptance.

## U13c: Separate storage from retired function transport

The public `createStorageClient` now constructs its own control-plane methods rather than creating the old function client. Shared bounded HTTP mechanics retain authentication refresh, identity pinning, cancellation, response limits, redirect refusal and stable intent keys. The retired client temporarily delegates storage to that same implementation while its remaining consumers are removed; no duplicate storage transport was introduced.

Four standalone storage regressions plus ten existing client tests pass. The PostgreSQL 18 storage HTTP integration now consumes `createStorageClient` directly and passes JWT/tenant isolation, uncertain-response replay, intent validation, verification and signed download behavior with zero skips. Core/E2E TypeScript, build and Oxlint pass. Sequential code/security review compared the moved request logic, checked that a retried create retains its original intent key, and verified that identity refresh cannot send a second request under another user. The retirement of the remaining function client is still open.

## U13d: Remove the legacy React provider

Removed the custom `LoomProvider`, its client context and `useLoomClient`. The optional React entry point now re-exports TanStack's provider and hooks directly. Generated native callables already own their session binding; no second React context is needed. The SSR unit and hook type fixture now exercise native procedures/options. Removed the superseded protocol-1 browser fixture and its browser test.

Coverage mapping: native `rpc-client.test.ts` verifies packed shared streams, reconnect and sign-out disposal; `optimistic-live.test.ts` verifies live pause/refetch during writes; `rpc-ssr.test.ts` verifies finite prefetch and hydration. All three pass (33 assertions, zero skips). The native options suite additionally verifies issuer/subject/tenant/version key isolation, observed-data disposal, mutation callbacks and default retry refusal. Nine focused React/options/transport unit tests pass. Test/E2E TypeScript and Oxlint pass.

Sequential code/security review checked that removing context cannot bypass session ownership, that the public hooks are the actual TanStack hooks, and that no server imports reach React. Native SSR still makes zero requests during ordinary render. The removed browser test's custom protocol machinery is not retained as a second implementation. Legacy query/cache and server generation removal remain open.

## U13e: Move migration and release regressions onto native initialization

Migration CLI, development sync/watcher, release database and release preparation fixtures now use the public native initializer. The storage-enabled release fixture uses native storage declarations. PostgreSQL 18 executed all seven scenarios successfully across the initial run and the corrected release-preparation rerun; no cases were skipped. This retains schema drift, unsafe DDL refusal, history preservation, provider submission recovery, role ownership and trigger checks while removing their dependency on the legacy fixture initializer.

Sequential code/security review verified that only authoring setup changed, existing lifecycle and credential-redaction assertions remain, and the release storage authorization default is still deny. E2E TypeScript passes. Native runtime migration of the remaining development/release fixtures is still pending.

## U13f: Native CLI generation and capability regressions

Converted all nine CLI generation scenarios to native initialization and procedure objects. They retain Node 24 provider bundles, immutable captured configuration, authorization edits, schema-bound relations, concurrent deterministic generation, stale/cancelled activation refusal, symlink ownership checks, browser exclusion of private procedures, invalid cron/storage target refusal and attempt limits. Native cron targets are checked in both retained Node-loaded generations; retired string-reference kind/version assertions were replaced by procedure-object identity and compiled envelope version checks.

All nine scenarios pass (114 assertions, zero skips), including a clean consumer typecheck and browser bundle with a private sentinel. E2E TypeScript, formatting and Oxlint pass. Sequential code/security review confirmed private target exclusion, deny-by-default authorization, policy edit fingerprints and unchanged active generation after rejected candidates. During migration, a fixture invoked the schema-bound procedure without its required Effect context; it was corrected to supply an explicit fixture context. No production error boundary was weakened.

## U13g: Decouple native authentication and runtime contracts

Moved provider JWT/origin configuration out of the legacy authorization definition, so native authentication no longer imports the retired dispatcher. Activation and storage-backend contracts now live independently of the legacy runtime; native runtime and Neon trigger binding imports point there. The implementation preserves verification, denied-by-default policies and activation callbacks.

Core build/typecheck and Oxlint pass. Twenty-one focused auth/entrypoint/trigger unit tests pass. Four PostgreSQL/Node integration scenarios pass with zero skips: TLS JWKS rotation/fail-closed behavior, external activation identity and read-only grant, assembled native runtime shutdown and invocation-owned storage. Sequential code/security review compared configuration parsing and verifier construction, verified that authorization still comes from the branded native policy, and confirmed no new runtime values or provider privileges were introduced.
