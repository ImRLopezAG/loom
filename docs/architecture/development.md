# Development lifecycle

`loom dev` connects source watching, serialized revision updates, guarded database synchronization, verified runtime startup, generated-reference publication, local runtime replacement, job polling and local cron dispatch.

## Command

Run `loom dev --cwd <project>` with a project-contained `loom.dev.json`:

```json
{
  "format": 1,
  "databaseName": "neondb",
  "migrationRole": "migration_owner",
  "runtimeRole": "application_runtime",
  "deployment": "local",
  "activationTokenEnv": "LOOM_DEV_ACTIVATION_TOKEN",
  "port": 3000
}
```

The environment variable holds a stable 64-character lowercase hexadecimal secret. The file holds only its name. `NEON_API_KEY` supplies provider access; the explicit development branch belongs in `loom.config.ts`. The database and roles must already exist, with working runtime login credentials and a metadata-owning migration role. Unknown declaration fields and escaping paths are refused. Optional `maxConnections` and `debounceMs` use the programmatic defaults. `--development <file>` selects another contained declaration. Declaration changes require restart.

`--json` emits newline-delimited `watching`, `ready` and `stopped` events on stdout, with the serving version and URL on `ready`. Update failures go to stderr as `DEVELOPMENT_UPDATE_FAILED`; they leave the watcher alive and preserve any previous runtime. A recovered edit reports `ready` again. Diagnostics omit arbitrary project/provider errors and secrets. Startup, watcher or cleanup failure returns exit code 5; invalid command options return 2. SIGINT and SIGTERM stop and drain development, then exit successfully if cleanup succeeds.

`startProjectDevelopment(root, file?, provider?)` exposes the same declaration-driven startup to programmatic callers and returns the development owner described below. Startup does not provision roles or quarantine copied work implicitly.

## Quarantining copied database work

Stop local development before running `loom dev quarantine --cwd <project>`. It uses the same `loom.dev.json` (or `--development <file>`) and the explicit development target in `loom.config.ts`. The operation revokes all active grants and cancels all pending/running jobs in that target's Loom metadata namespace, including work created locally. It clears leases and increments fencing tokens so earlier workers cannot commit stale results. Completed jobs and application data remain unchanged.

The command verifies an unprotected, nondefault PostgreSQL 18 branch separate from preview and production, resolves the direct migration connection, takes the deployment and migration locks, and rechecks the target. The metadata owner performs grant revocation and job cancellation in one transaction. A failed transaction rolls back both changes. Repeating a completed operation reports zero changes.

Only the declaration and configuration module are loaded; broken backend source does not prevent quarantine. Runtime login credentials, activation-token values and storage credentials are not read. `NEON_API_KEY` and metadata owner access are still required. `--json` returns a `dev quarantine` receipt with project, branch, endpoint and changed-row counts. Errors use the fixed `DEVELOPMENT_QUARANTINE_FAILED` diagnostic and exit code 5. SIGINT/SIGTERM request cancellation; inspect database state after an interrupted command because a completed commit is not undone by a late signal.

`quarantineProjectDevelopment(root, file?, provider?, signal?)` exposes this declaration-driven command. `quarantineDevelopmentDatabase(options, provider?)` accepts the verified-connection options directly. Both are database-only: provider triggers and external side effects already performed by running handlers are unchanged. Stop relevant workers and disable unwanted provider triggers separately before activating a copied branch. Restarting `loom dev` establishes its own branch-bound grant after quarantine.

## Development storage

Projects declaring buckets in `backend/storage.ts` add a `storage` object to `loom.dev.json`:

```json
{
  "storage": {
    "projectId": "your-project-id",
    "branchId": "br-your-development-branch",
    "endpoint": "https://br-your-development-branch.storage.c-1.us-east-2.aws.neon.tech",
    "region": "us-east-2",
    "accessKeyIdEnv": "LOOM_DEV_STORAGE_ACCESS_KEY",
    "secretAccessKeyEnv": "LOOM_DEV_STORAGE_SECRET_KEY"
  }
}
```

Use the actual endpoint and region for the selected branch. Set credentials in the named environment variables; they must be distinct from each other, the activation-token source and `NEON_API_KEY`. The CLI captures them before loading project modules and retains them across generation replacements. Changes require restart. Each runtime owns a fresh storage adapter and closes it during retirement or shutdown. The endpoint must use HTTPS and match the declared branch and region; startup also binds the project and branch to the verified development database target.

Every declared bucket must already exist with `private` access. Startup reads bucket metadata through the provider before granting activation and refuses missing, public, duplicate or unavailable metadata. Custom development providers must supply `listBranchBuckets` when storage is declared. This check runs at generation startup; administrators must keep buckets private afterward. Neon distinguishes authenticated private buckets from anonymously readable public buckets in its [storage overview](https://neon.com/docs/storage/overview).

The command does not create buckets or credentials. Runtime operations retain the normal authenticated upload-intent, authorization, verification and cleanup contracts. Local startup does not emulate provider-attested object-storage events; cloud trigger acceptance remains separate.

## Development jobs

Published generations poll the existing durable job worker automatically. The first pass starts after reference/runtime publication. Each pass handles at most ten jobs without overlapping another pass on that worker. After completion or failure, polling waits `jobPollMs` (default 1000 milliseconds, configurable from 100 to 60000 in the declaration or `startDevelopment` options). Due times remain not-before bounds rather than exact execution times.

Replacement halts the previous worker before starting polling for the new generation. Shutdown clears pending timers, prevents queued passes from entering the worker, requests cooperative cancellation and drains admitted work before closing runtime resources. Unpublished candidates never poll. Individual job failures follow the stored retry policy; worker infrastructure or activation errors set the owner's `workerFailure` to a fixed diagnostic and retry at the next interval. A successful pass clears it. The CLI reports `DEVELOPMENT_WORKER_FAILED` once per observed failure episode without printing underlying errors.

The public `createDevelopmentJobLoop(worker, intervalMs?)` exposes this lifecycle separately: `start()` begins polling, `halt()` stops admission and requests shutdown, and `stop()` drains it and reports cleanup failure. Halting is terminal for that loop. This helper does not perform activation itself; the supplied worker must enforce the existing activation and queue contracts.

## Development crons

Published generations evaluate the numeric five-field schedules from `backend/crons.ts` in UTC, starting at the next minute boundary. Matching uses pinned `cron-parser` 5.10.1 after Loom's schedule validator rejects names, macros and seconds fields. Calendar tests cover lists, ranges, steps, Sunday aliases, leap day and the parser's day-of-month/day-of-week OR behavior. Neon's documented examples use the same five-field UTC form; live provider acceptance remains separate. See the [Neon schedule reference](https://neon.com/docs/compute/functions/triggers/schedule#cron-reference) and [parser documentation](https://github.com/harrisiirak/cron-parser).

Each observed minute is dispatched through the runtime's existing activation check and durable occurrence deduplication. The loop does not replay the startup minute or gaps caused by sleep, downtime or long dispatches. Clock rollback cannot redeliver a minute already observed. Failed dispatches retry at most once per second while that minute remains current; successful entries are not repeated during another entry's retry. An occurrence still failing when the clock advances is abandoned locally, with no replay promise. Durable jobs already enqueued retain their stored retry policy.

`cronFailure` reports a fixed dispatch diagnostic and clears after a successful pass. The CLI reports `DEVELOPMENT_CRON_FAILED` once per observed failure episode. Replacement and shutdown halt cron admission, abort active dispatch cooperatively and drain it before closing runtime resources. The public `createDevelopmentCronLoop(schedules, dispatcher)` has the same start/halt/stop ownership as the job loop. Standalone runtime startup returns captured `cronSchedules` but does not start either loop.

## Automatic updates

`startDevelopment(options, provider?)` accepts runtime startup options without `sourceVersion` or `signal`, plus optional `port`, `maxConnections` and `debounceMs`. It owns the watcher and server. The default debounce is 75 milliseconds. The returned `active` value contains the serving source version and verified target; `url` is null until the first successful publication. `failure` reports a failed update, and `watchError` reports a filesystem watcher failure. `flush()` runs a pending debounce and waits for updates; `settled()` waits for currently known work. Later filesystem events may still schedule another update.

Every update prepares immutable artifacts before database work. Changed versions pass schema synchronization and verified runtime startup before publication. Invalid source, unsafe schema changes, protected targets and failed startup leave the prior serving generation and references intact. A first failed edit leaves the watcher running with no advertised listener; saving a valid revision can recover. Committed additive DDL remains in place after a later startup failure. An unchanged serving version avoids another runtime replacement. A failed retirement requires restarting development.

The coordinator serializes updates and cancels superseded revisions. Generated files and local build state do not trigger updates. Publication switches the generated-reference link and invokes the runtime installation hook immediately afterward, before filesystem cleanup. Once publication has committed, a later cancellation or cleanup error cannot discard its matching runtime. Existing requests drain through their prior generation and old sockets close for resynchronization. `stop()` cancels and drains the watcher, then closes the server and its runtimes; it is idempotent. Startup options and credentials are captured for this development session.

## Database target verification

Development synchronization requires an explicit PostgreSQL 18 branch separate from preview and production. Provider observations must identify an unprotected, nondefault branch and exactly one read-write endpoint, with no duplicate endpoint IDs. The direct connection URL must match that endpoint's hostname prefix, the requested migration role and database. Pooled connections and query parameters that override connection identity are refused before connecting. Provider lookup and malformed metadata errors use fixed diagnostics without including response values or credentials.

Development connections acquire the deployment lock and then the migration lock, matching release lock order. Tooling then observes the target again and checks the project, branch ID, branch name and endpoint ID. Changed identity or protection prevents the database callback from running. This protects schema synchronization; it does not replace the activation and runtime-authority checks needed for development startup.

## Runtime startup

`startDevelopmentRuntime(options, provider?)` starts a candidate after `synchronizeDevelopment` has committed the same source version. Options include the project root, source version, database name, migration and runtime roles, deployment name and a 64-character hexadecimal activation token. Keep the token secret and stable across generations and restarts. The result contains `runtime`, its secret-free activation `binding`, and the verified `target`. The caller owns `runtime.stop()` or transfers ownership to the local server.

Under the development connection's locks, startup requires metadata ownership, consistent development history, the matching synchronized source version and an unchanged live catalog. It resolves runtime credentials separately, binds them to the same database host and port, and verifies the role cannot migrate or write activation metadata. The runtime role must already have working login credentials; this helper does not provision them. A final provider observation checks identity and protection before grant creation. Foreign active grants or copied pending work without a current branch grant require quarantine; startup does not cancel or adopt that work.

Startup uses the existing hash-only database grants. Its activation verifier captures credentials for that generation and checks the durable grant at startup and every runtime activation boundary. It does not read or write `NEON_BRANCH`, `DATABASE_URL` or `LOOM_ACTIVATION_TOKEN`. Deployed Neon verifiers continue reading the provider environment. Multiple local generations may remain active while requests drain, and revoking one grant disables its subsequent work independently.

Queue claim and expired-attempt recovery are scoped to the worker's exact source version as well as deployment. A new runtime cannot consume an older generation's jobs or exhaust their attempts through version mismatch. Older pending work remains durable and requires a matching worker; automatic retention and draining of old job handlers is still unfinished. This isolation does not provide cross-version execution compatibility.

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

For coordinated publication, `replace` accepts a third argument, `publish(install)`. It validates the candidate before invoking this callback and reserves the replacement until publication and retirement finish. The callback must call `install()` synchronously at its commit point before its promise settles. A failure before installation discards the candidate; a failure afterward reports the error while retaining the installed generation. Omitting installation is an error. Duplicate or late installation calls do nothing, including calls made while rejected-candidate cleanup is pending. Shutdown drains an in-flight publication and closes any generation it installs.

`activateProject` accepts a fourth argument, `onActivated`, for that commit hook. It runs synchronously after the atomic reference-link rename and before temporary-link and lock cleanup. Errors after this hook do not imply that publication was rolled back. The development pipeline pairs it with the server's installation callback.

## Remaining work

The local server remains a transport and lifetime owner; `startDevelopment` supplies the source, database, publication, job-polling and cron stages around it. Credential provisioning, retention/draining of old job handlers and abandoned-lock recovery remain required work. Programmatic and CLI tests use an isolated local PostgreSQL 18 fixture; the CLI exercises the pinned SDK against a local HTTP provider fixture. Live Neon acceptance is separate.
