# Deployment recovery

The current function stage is exposed through `applyNeonFunctions` and `readNeonFunctionReceipt` in `@loom/tooling`. It uses the pinned Neon configuration runtime's apply operation. The full release coordinator is still being implemented: schema expansion, function deployment, runtime health checks, activation grants and trigger activation must execute in that order before a release can be reported as active.

## Function receipt

Each prepared entry artifact has a receipt at `.loom/deploy/<artifact-hash>/functions.json`. It records the provider target, build version, artifact hash, archive hashes, function IDs, acknowledged deployment IDs and verified invocation URLs. Every acknowledgement is written before advancing to another function. Receipt writes sync a temporary file, atomically replace the prior file and sync the directory. Archives are published atomically and their hashes are checked before use.

Application environment values are never written to the receipt or archives by the deploy adapter. An HMAC keyed by the activation token binds the original environment, activation binding and slugs to the receipt. A resume with changed inputs fails instead of silently changing a partially applied deployment. Runtime and migration credentials remain separate. Caller-supplied overrides of Neon's identity variables are refused; the outgoing deployment clears old overrides of `DATABASE_URL`, `DATABASE_URL_UNPOOLED` and `NEON_BRANCH` so provider-injected defaults can take effect. Neon documents its [environment merging and deletion behavior](https://neon.com/docs/compute/functions/environment-variables).

| Function state | Evidence                                                    | Resume behavior                                                                                                                 |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `ready`        | Archive is saved; no submission has started.                | Submit the saved archive.                                                                                                       |
| `submitting`   | Submission began; no acknowledgement is durably recorded.   | Retry only if the function identity and latest deployment still match the recorded baseline. Otherwise stop for reconciliation. |
| `submitted`    | Provider returned a deployment ID.                          | Observe that ID without uploading again.                                                                                        |
| `failed`       | The recorded deployment reached provider failure.           | Retry only if it has not been replaced, retaining prior acknowledged IDs.                                                       |
| `completed`    | Provider reports the exact deployment completed and active. | Verify the same function and deployment still exist, then skip it.                                                              |

Resume by calling `applyNeonFunctions` again with the same prepared entries, slugs and variables. It uses the saved archives even if local entry source changes afterward. It refuses corrupt archives, changed targets, altered inputs, replaced functions and superseding deployments. A failed worker submission does not redeploy an already verified service.

A completed function receipt proves provider deployment completion. It does not prove application health, schema compatibility, correct runtime-role privileges or active scheduling. Those checks belong to the release coordinator before grant and trigger activation.

`inspectRuntimeDatabase` provides the read-only credential authority check for that coordinator. Given the database identity from the verified target, it connects using the exact runtime credentials, checks PostgreSQL 18 and the actual session role/database, and refuses administrative flags, role memberships, database/schema creation privileges and owned objects in the current database or shared catalogs. Both application and metadata schemas must be usable. The activation table must be readable; activation and migration history tables must have no runtime write privileges, including column grants. PostgreSQL's [privilege inquiry functions](https://www.postgresql.org/docs/18/functions-info.html#FUNCTIONS-INFO-ACCESS-TABLE) inspect effective grants, and [shared ownership dependencies](https://www.postgresql.org/docs/18/catalog-pg-shdepend.html) cover types as well as relations and routines.

The check issues no DDL, grants or activation writes and returns only database/role/schema identity. Connection, validation and permission failures share a fixed redacted error. Connection and statement timeouts remain bounded by the dedicated session helper; cancellation is checked before connection and after inspection, not used to interrupt an in-flight query. This is a point-in-time authority check, not a complete audit of trusted SQL functions, application DML grants or schema compatibility. It is not yet wired into the unfinished release coordinator and does not activate a release.

## Interruption and concurrency

A local lock serializes function applies in a checkout. It does not replace the database deployment lock required by the full release coordinator across machines. An abandoned local lock is not automatically stolen.

Timeouts bound provider status reads, including the SDK's post-deployment inspection. Cancellation does not detach a mutation already in flight: its eventual acknowledgement is recorded before the apply exits and releases its lock. A lost response with a changed remote deployment remains uncertain. The adapter does not guess that the new remote deployment contains its archive or overwrite it automatically. Explicit reconciliation and abandoned-lock recovery remain work for the release coordinator.

## Verification

Integration tests execute the real pinned SDK planner, bundler and apply engine with a controlled provider interface. They cover partial failure, resume, terminal build failure, target drift, replaced deployments, corrupt archives, changed secret inputs, stalled status reads, concurrent applies and cancellation during submission. No live Neon resources were changed by these tests. Cloud acceptance and recovery across the database/function boundary remain outstanding.

## Disabled trigger preparation

`disableNeonTriggers` disables every schedule or storage trigger attached to the selected worker slugs and verifies the observed result. It does not cancel already-running work or revoke database grants. Preview database quarantine remains a separate operation and must precede activation of copied work.

`prepareNeonScheduleTriggers` creates or reconciles named schedules with `enabled: false`. It requires an existing completed worker deployment and returns the provider trigger IDs and validated runtime bindings. A retry resolves already-created schedules by name; a name attached to another worker or trigger type is refused. The returned bindings must be included in the final worker artifact before any later trigger activation. A completed preparation result proves the schedules were observed disabled, not that a release is active. The coordinator still needs to connect initial worker creation, binding-aware worker deployment, health checks, grant activation and trigger activation.
