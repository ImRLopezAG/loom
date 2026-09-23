# Development lifecycle

The tooling has separate pieces for source watching, serialized revision updates, guarded database synchronization, verified runtime startup, immutable generation publication and a local server with runtime replacement. Their composition into automatic source-driven updates and `loom dev` remains unfinished.

## Database target verification

Development synchronization requires an explicit PostgreSQL 18 branch separate from preview and production. Provider observations must identify an unprotected, nondefault branch and exactly one read-write endpoint, with no duplicate endpoint IDs. The direct connection URL must match that endpoint's hostname prefix, the requested migration role and database. Pooled connections and query parameters that override connection identity are refused before connecting. Provider lookup and malformed metadata errors use fixed diagnostics without including response values or credentials.

Development connections acquire the deployment lock and then the migration lock, matching release lock order. Tooling then observes the target again and checks the project, branch ID, branch name and endpoint ID. Changed identity or protection prevents the database callback from running. This protects schema synchronization; it does not replace the activation and runtime-authority checks needed for development startup.

## Runtime startup

`startDevelopmentRuntime(options, provider?)` starts a candidate after `synchronizeDevelopment` has committed the same source version. Options include the project root, source version, database name, migration and runtime roles, deployment name and a 64-character hexadecimal activation token. Keep the token secret and stable across generations and restarts. The result contains `runtime`, its secret-free activation `binding`, and the verified `target`. The caller owns `runtime.stop()` or transfers ownership to the local server.

Under the development connection's locks, startup requires metadata ownership, consistent development history, the matching synchronized source version and an unchanged live catalog. It resolves runtime credentials separately, binds them to the same database host and port, and verifies the role cannot migrate or write activation metadata. The runtime role must already have working login credentials; this helper does not provision them. A final provider observation checks identity and protection before grant creation. Foreign active grants or copied pending work without a current branch grant require quarantine; startup does not cancel or adopt that work.

Startup uses the existing hash-only database grants. Its activation verifier captures credentials for that generation and checks the durable grant at startup and every runtime activation boundary. It does not read or write `NEON_BRANCH`, `DATABASE_URL` or `LOOM_ACTIVATION_TOKEN`. Deployed Neon verifiers continue reading the provider environment. Multiple local generations may remain active while requests drain, and revoking one grant disables its subsequent work independently.

Declared storage requires an explicit backend for the same project and branch. A failed construction closes runtime resources. A source change or cancellation detected after construction also stops the candidate, including storage and database connections. Startup never rolls back committed schema changes or revokes a grant that another same-version runtime might still use. A grant created before a later startup failure can remain active; retry requires the same identity and token. Startup does not publish generated references, open a listener, schedule job/cron wake loops, or replace the serving generation.

## Local runtime server

`startDevelopmentServer(runtime, { port, maxConnections })` accepts the public capabilities of an assembled Loom runtime and takes ownership of its shutdown. It binds to `127.0.0.1`, defaults to port 3000, and accepts port 0 for an ephemeral test port. The returned `url` identifies the listener. A failed startup stops the supplied runtime; callers must supply a new runtime for another attempt.

Ordinary HTTP requests use the same application adapter as deployed services, including authentication, authorization, CORS, ticket issuance and optional storage intents. The socket route uses [Bun's native upgrade API](https://bun.sh/docs/runtime/http/websockets) and the existing Loom WebSocket session/poller. It requires an allowed Origin and exactly the `loom.v1` and `loom.ticket.<credential>` subprotocols. Tickets are redeemed through the runtime's durable ticket capability; the transport never accepts a user identity from request arguments. An anonymous HTTP policy does not bypass socket ticket authentication.

The default connection cap is 100, configurable from 1 through 1000. Reservations include in-flight handshakes, which have a five-second deadline. Authentication failures, failed upgrades, expired sessions and closed sockets release their reservation. Message, subscription, heartbeat and output bounds come from the runtime's existing realtime options. These are configured limits, not measured capacity claims.

`stop()` is idempotent. It rejects new work, cancels handshakes, closes sockets and the listener, drains application dispatch, then stops the runtime and releases its database/background resources. The supplied runtime must own and drain its asynchronous work, as `createRuntime` does. A redemption that finishes after shutdown cannot open a socket. The server does not start job polling or cron wake loops by itself.

## Runtime replacement

`server.replace(candidate, signal?)` takes ownership of an already started candidate runtime. It constructs the candidate's HTTP adapter and checks cancellation before switching the listener to that generation. Invalid or cancelled candidates are stopped; the current generation continues serving. Reusing an already owned runtime is refused without stopping it. Supply a fresh runtime for each attempt.

The switch is synchronous. Requests arriving afterward use the new runtime on the same URL. Existing HTTP work drains through its old application, and old sockets close for resynchronization. Socket callbacks and handshake reservations stay bound to their original generation. Another replacement is refused until retirement and rejected-candidate cleanup finish; the caller's development coordinator should serialize updates.

The result `{ retired: true }` confirms installation and successful cleanup of the old generation. `{ retired: false }` means installation succeeded but cleanup failed; the new generation remains active, further replacement is refused, and shutdown reports a fixed cleanup error. This does not roll back the new runtime or database schema. Cancellation after installation does not undo the switch. A rejected promise before installation leaves the previous generation active, and cleanup failures are retained for shutdown diagnostics.

Stopping during replacement waits for the current runtime, retiring runtime and rejected candidates already being cleaned up. The server owns runtime lifetime; source-version checks, schema compatibility, database grants and generated-reference publication belong to the surrounding development pipeline and remain required before calling `replace`.

## Remaining composition

The local server assumes that runtime creation has already verified database authority and activation. It does not perform schema synchronization, quarantine copied work, issue activation grants, publish generated references, or select a provider target. The development coordinator still needs to connect synchronization, verified startup, generated-reference publication and runtime replacement, retaining the last working runtime after failed edits. Development quarantine, credential provisioning, abandoned-lock recovery and the development command also remain required work.
