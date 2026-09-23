# Development lifecycle

The tooling has separate pieces for source watching, serialized revision updates, guarded database synchronization, immutable generation publication and a local server with runtime replacement. Their composition into automatic source-driven updates and `loom dev` remains unfinished.

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

The local server assumes that runtime creation has already verified database authority and activation. It does not perform schema synchronization, quarantine copied work, issue activation grants, publish generated references, or select a provider target. The development coordinator still needs to connect those stages, retain the last working runtime after failed edits, and replace generations coherently. Abandoned-lock recovery and the development command also remain required work.
