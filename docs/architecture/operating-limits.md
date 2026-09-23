# Operating limits and cloud evidence

Loom has no measured production capacity envelope yet. Local integration tests and the cloud checks below establish specific correctness properties; they do not establish supported subscriber counts, throughput, latency, provider billing or process-restart behavior.

## Verified Neon database baseline

On September 23, 2026, `packages/e2e/cloud/database.test.ts` passed against a disposable schema-only branch of project `late-moon-69483649` (`loom`):

| Property           | Observed value                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Region             | AWS `us-east-1`                                                                                              |
| PostgreSQL         | 18                                                                                                           |
| Compute            | Fixed 0.25 CU, 300-second inactivity suspension                                                              |
| Transport          | Direct connection with TLS `verify-full`, using `pg` 8.23.0                                                  |
| Authentication     | Neon CLI 6.0.0 authenticated local profile; connection URI held in process memory                            |
| Metadata           | Versions 1–20 installed; second bootstrap preserved every version and hash                                   |
| Runtime authority  | Separate runtime-role login; no superuser, BYPASSRLS or CREATEDB                                             |
| Allowed operation  | Read the job queue                                                                                           |
| Refused operations | Create a metadata table, update activation grants, delete migration history; SQLSTATE 42501                  |
| Cleanup            | Test schemas and role removed; branch deletion acknowledged and subsequent branch list contained only `main` |

The tested branch was `br-lingering-glitter-awtmj1g6`, named `loom-acceptance-20260923-bootstrap`, with expiration set before creation. It no longer exists. The test took approximately 13 seconds, including CLI and network setup; this is not a latency benchmark. The default branch was also supplied deliberately to verify refusal before database connection or mutation.

The first isolation attempt used owner-session `SET ROLE`, which Neon refused with SQLSTATE 42501. The final test opens a real runtime-role connection with a temporary random password. It does not grant the migration owner membership in the runtime role or widen runtime privileges. A requested 60-second suspend interval was rejected by the account plan before branch creation; 300 seconds was accepted.

Current [Neon region documentation](https://neon.com/docs/introduction/regions) lists Functions and Object Storage in `aws-us-east-1`, alongside Ohio, Frankfurt and Singapore. The installed Neon skill's Ohio-only statement is stale. A live Functions list on this project's default branch succeeded and returned no functions; that does not prove deployment or invocation.

## Reproduce the database check

Authenticate Neon CLI locally or supply its supported API-key credentials. Create a disposable branch with a name beginning `loom-acceptance-`, an explicit parent, and a future expiration:

```sh
bunx neon@6.0.0 branches create \
  --project-id <project-id> --parent <parent-branch-id> \
  --name loom-acceptance-database --schema-only \
  --cu 0.25 --suspend-timeout 300 \
  --expires-at <future-ISO-8601-timestamp> --no-secrets --output json

LOOM_CLOUD_PROJECT_ID=<project-id> LOOM_CLOUD_BRANCH_ID=<created-branch-id> \
  bun run --cwd packages/e2e test:cloud

bunx neon@6.0.0 branches delete <created-branch-id> --project-id <project-id>
bunx neon@6.0.0 branches list --project-id <project-id> --output json
```

The suite skips when `LOOM_CLOUD_PROJECT_ID` is absent. When it is present, an explicit branch ID is required. Default, protected, unrelated and ambiguously resolved branches are refused. The suite creates uniquely named metadata and runtime roles and removes them in `finally`; the caller owns branch deletion and must verify its absence even when the test fails. CLI diagnostics and credentials are not printed. Database failures report the operation stage and a validated SQLSTATE when available.

## Remaining acceptance gates

The tasks and jobs-storage examples have passed their current live Neon acceptance scenarios. Capacity, lifecycle and provider quota checks below remain open; the example results are not a complete U17 acceptance claim.

- Measure concurrent writes, revision-row contention, pool wait, polling load, subscriptions, fan-out and slow-client memory bounds across multiple isolates.
- Terminate API and worker processes and verify reconnect, job lease recovery and safe retirement of old provider resources.
- Verify provider throttling, WebSocket invocation/quota accounting, runtime limits and billing under the measured workload.
- Inspect logs and artifacts for credential and payload leakage, and publish a cleanup receipt for each live run.

Until these gates pass, U17 and full cloud acceptance remain incomplete.

## Runtime measurements

Node diagnostics subscribers can collect `loom.runtime.metric` events. The exported `RuntimeMetric` type from `@loom/core/server` describes their payload. A `transaction.retry` event contains only `kind` (`query` or `mutation`) and `attempt` (2–10, counting the original attempt). Count these events to measure additional transaction attempts. Each event is published after backoff and cancellation checks, immediately before starting the next transaction; exhausted attempts and cancelled backoffs produce no extra event. It does not count action or durable job retries.

`revision.read` reports `status` (`success` or `error`), `durationMs` and the number of distinct tracked tables (`tableCount`). Its monotonic wall time includes the database read and result validation, plus pool acquisition when the reader runs outside a transaction. It covers both polling reads and revisions captured during query evaluation; it is not a count of poll cycles. Missing revision rows and database failures produce error measurements while preserving the original rejection.

`function.dispatch` reports `mode` (`public`, `internal` or `subscription`), validated function `kind`, `status` and `durationMs`. Kind is `unknown` when dispatch exits before validating the registry entry. Duration includes argument preparation, authorization, transaction acquisition and retries, handler execution and subscription revision capture. It excludes HTTP transport and encoding outside dispatch. These end-to-end durations overlap with revision-read durations and must not be summed. Direct calls to lower-level execution helpers do not emit dispatch events.

`job.claim` reports the database-clock age since initial creation (`ageMs`), lateness against the current due time (`dueLagMs`), attempt number and whether the claim recovered an expired running lease (`recovered`). Durations are clamped to zero for backward clock adjustments. These are samples of claimed jobs, not a gauge of every pending job. Creation age includes prior attempts and replay history; due lag uses the current scheduled/retry time. Each successful claim emits once; an empty claim emits nothing.

`job.lease.reaped` reports how many expired running attempts a claim sweep changed to failed or cancelled (1–100). Recoverable expired leases appear as `job.claim` with `recovered: true`, so they are distinct from terminal cleanup. These events observe SQL statement results; if callers supply an enclosing transaction, its later commit or rollback is not represented. They contain no job IDs, lease owners, fencing tokens, arguments or results.

`job.lease.lost` records the first worker-side reason for aborting lease execution: `deadline` when its local lease budget expires, `ownership` when renewal returns false (including requested cancellation), `activation` when deployment authority fails, or `queue` when renewal throws. It emits at most once per claimed execution and does not emit for ordinary shutdown cancellation. A local deadline event does not prove that PostgreSQL has already expired or reassigned the lease. These events do not count failed acknowledgements, and they do not imply that a handler has stopped immediately; handlers must observe cancellation. Queue recovery/cleanup measurements above describe separate database transitions.

`database.acquire` reports `status`, monotonic `durationMs`, and pool `total`, `idle` and `waiting` counts when acquisition completes or fails. Duration includes waiting for a free slot and establishing a new connection when necessary; it excludes SQL execution and is not exclusively queue time. Both promise and callback acquisition APIs are measured, covering Drizzle transactions and ordinary pooled queries. Counts are per-pool samples at acquisition completion, not continuous gauges or fleet-wide totals; they do not record every release or shutdown transition. Capacity runs must identify their pool/isolate configuration and sample separately when they need an idle-time or peak-queue gauge.

The channel retains no history and configures no exporter. Subscribers must follow Node diagnostics-channel requirements, including not throwing from callbacks. Events contain no function names, identities, arguments, SQL or error messages. Real PostgreSQL integration coverage verifies serialization failures, deadlocks, exhaustion, cancellation, revision reads, dispatch outcomes, concurrent job claims, expired-lease recovery/cleanup and pool acquisition. Deployment measurements remain pending.

## Verified example acceptance

The tasks example passed the public deployment coordinator, health/activation, authenticated operations, mutation replay, owner isolation, invalid JWT rejection, two-browser subscriptions, socket reconnect and account switching. A fresh run after the durable binding and metadata-version-21 changes passed all three cloud tests in approximately 88 seconds.

On September 23, 2026, the jobs-storage selection passed all three cloud tests in approximately 245 seconds, including its application scenario in 228 seconds. It used actual browser PUTs, provider storage events and scheduled worker wakes; the harness did not invoke workers manually. Checks covered all three ready catalog entries, normal completion in one attempt, retry completion in two attempts, exhausted failure after three attempts, exact downloaded bytes, foreign-owner upload/download signing denial and an empty catalog after switching users. This run also passed database bootstrap through metadata version 21 and exercised the durable trigger-binding fix on Neon. It is correctness evidence, not a throughput or latency benchmark.

Run either selection with `LOOM_CLOUD_FUNCTIONS=1 LOOM_CLOUD_EXAMPLE=tasks bun run test:cloud` or `LOOM_CLOUD_FUNCTIONS=1 LOOM_CLOUD_EXAMPLE=jobs-storage bun run test:cloud`, supplying the disposable project/branch variables above and a project-scoped `NEON_API_KEY`. The pinned SDK does not read the local CLI profile. These rehearsals used temporary keys, deleted the branch and revoked the key afterward, and verified both absences. The CI matrix covers both selections, but hosted CI has not yet run.
