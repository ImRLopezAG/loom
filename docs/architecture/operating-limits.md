# Operating limits and cloud evidence

Loom has no measured production capacity envelope yet. Local integration tests and the cloud database check below establish specific correctness properties; they do not establish supported subscriber counts, throughput, latency, provider billing or restart behavior.

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

- Exercise the complete Loom deployment coordinator against live Functions, storage and triggers. The pinned programmatic SDK requires an explicit API key and does not read the local CLI profile; CLI authentication alone does not configure Loom's provider adapter.
- Measure concurrent writes, revision-row contention, pool wait, polling load, subscriptions, fan-out and slow-client memory bounds across multiple isolates.
- Terminate API and worker processes and verify reconnect, job lease recovery and safe retirement of old provider resources.
- Verify provider throttling, WebSocket invocation/quota accounting, runtime limits and billing under the measured workload.
- Inspect logs and artifacts for credential and payload leakage, and publish a cleanup receipt for each live run.

Until these gates pass, U17 and full cloud acceptance remain incomplete.
