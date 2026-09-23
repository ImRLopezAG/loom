# Storage verification

The current Neon adapter provides signed staging uploads, bounded byte verification, writes to verified object keys, signed downloads and explicit deletion. The server intent service adds owner authorization and durable state. Tooling prepares private buckets and disabled storage triggers; activation and cleanup remain incomplete. Do not expose the low-level adapter methods directly as public endpoints: use the intent service with an identity from the request verifier, a branch activation verifier, an application policy and a private bucket.

## Object identity and verification

An intent descriptor fixes its UUID, bucket, byte length, media type and SHA-256 digest. The initial upload limit is 10 MiB. Keys derive from the verified project/branch configuration and intent ID; users do not supply object paths. Intent UUIDs normalize to lowercase, matching PostgreSQL identity semantics; provider events must carry the exact canonical staging key. The adapter refuses a Neon storage endpoint whose branch or region differs from its configuration. The injected S3 client parameter is a trusted integration/testing boundary.

Uploads use a staging key. A signed PUT binds length, content type and intent metadata for at most five minutes. The client sends the returned headers and exact bytes. Before sealing an upload, Loom checks provider metadata, reads at most the declared length into one bounded buffer, and verifies the SHA-256 digest. Only verified bytes are written to a separate ready key using server credentials. This avoids relying on object versions: Neon currently stores versioning configuration without enforcing it. Signed PUT URLs remain reusable until expiry, so they must never address ready keys. See Neon's [S3 compatibility](https://neon.com/docs/storage/s3-compatibility) and [object operations](https://neon.com/docs/storage/objects).

A ready key contains the intent ID and digest. Repeated sealing first checks for a matching ready object. This recovers a successful object write when the subsequent database update failed, even if staging has since changed. Only a provider 404 permits falling back to staging; permission or provider failures do not authorize a replacement. Concurrent successful seals write the same verified bytes. A download URL is issued only after the ready object's metadata matches and lasts at most five minutes.

Staging is retained after sealing so database failure cannot erase recovery inputs. The durable intent service owns pending/ready/failed transitions and tenant access. Event receipts deduplicate notifications and queue application handlers. Cleanup after upload URLs expire remains pending. Bucket provisioning must require private access. Do not rely on provider lifecycle expiry or credential `expires_at`: Neon documents that lifecycle rules and credential expiration are not enforced. See [S3 limitations](https://neon.com/docs/storage/s3-compatibility) and [storage authentication](https://neon.com/docs/storage/authentication).

## Verification evidence

The integration fixture uses the pinned AWS SDK and request presigner against a local HTTP object server. It verifies request/signature fields, downloaded bytes, metadata and digest rejection, staging isolation, recovery after sealing, targeted cleanup, branch mismatch, expiry/size bounds and cancellation. The server does not verify SigV4 signatures; acceptance of signed requests, private bucket policy and provider metadata behavior still require a disposable Neon test. Consumer integration also bundles the Neon entries through the pinned provider SDK and imports the extracted bundles in fresh Node 24 processes.

## Durable upload intents

`createStorageIntents` requires an application authorization policy, a bucket allowlist, a branch activation verifier and a storage backend bound to the same project/branch. Its identity argument is a trusted server input from the request verifier. It always checks issuer, subject and tenant ownership in addition to the application policy. Anonymous identities are rejected. Runtime assembly and the authenticated public endpoint supply this service with verified identities and activation checks.

Creating an intent stores its validated upload specification and verified owner in PostgreSQL. The database generates a UUIDv7; clients cannot select a storage object ID. A request key deduplicates creation for that principal and branch. Changing the upload specification under the same request key is refused. Copied rows do not become accessible through a different branch binding. The runtime role can insert/read intents and update lifecycle state, error code and modification time; it cannot rewrite existing ownership or upload specifications.

Upload signing reads the saved intent, requires pending state and uses the remaining portion of its five-minute upload window. Finalization verifies/seals the object outside a database transaction, rechecks activation, then records ready state. Verification failure records `VERIFICATION_FAILED`; provider or database failure retains pending state for retry. A ready retry is idempotent. Download signing requires ready state, current owner authorization and matching provider metadata, and issues a sixty-second URL. Expiration stops new upload URLs without discarding recovery state.

The PostgreSQL integration runs these operations under a non-owner runtime role against the real S3 adapter and local object server. It injects a PostgreSQL failure after sealing, removes staging, and recovers the saved ready object. It also covers concurrent creation/finalization, changed retry inputs, another tenant, copied-branch records, disallowed buckets, policy denial, immutable metadata grants, expired upload signing, verification failure, missing objects and activation loss between sealing and the database update. Cleanup and live Neon acceptance remain incomplete.

## Provider events and durable handlers

`createNeonTriggers` accepts a storage binding only with its expected provider trigger ID, name and bucket, and a storage dispatcher. It retains the Neon-edge-only attestation boundary: the edge must strip client-supplied trigger headers. A valid storage request returns 202 after persistence; it does not execute application handlers in the request. Scheduled worker wakes process the durable queue.

`createStorageEventDispatcher` accepts only staging keys derived from the bound project/branch and an existing upload intent in the expected bucket. It saves an invocation receipt before reconciliation. Reusing an invocation ID with different trigger/object data is refused before touching the second object. It finalizes the original authorized intent under its saved owner policy, then locks the intent and receipt in a fixed order. Job creation, the intent's single event-job link and receipt completion commit together. Distinct provider invocation IDs and later deployments resolve the same intent's saved job instead of enqueuing it again. Failed verification records a terminal failed receipt; temporary object, provider or database failures retain a pending receipt for retry.

`onObjectCreated` declares an internal mutation or action. The handler receives verified object metadata, the intent ID and `uploadedBy` as data. Its queued invocation identity is null: a provider notification does not authenticate the uploader. TypeScript rejects public handlers and handlers requiring arguments that a storage event cannot provide. Queue validation also checks the actual registered function and argument schema.

Metadata version 11 adds storage receipts and the event-job link without changing earlier migration hashes. Tests cover concurrent/repeated/reordered delivery, invocation conflicts, staging-key validation, failed verification, delayed object visibility, a failure between job insertion and receipt completion, and delivery through the HTTP trigger adapter. The real worker executes the resulting internal mutation once in PostgreSQL. These tests emulate the Neon delivery envelope; live edge attestation and trigger configuration remain cloud acceptance gates.

## Project declarations

An optional `backend/storage.ts` exports `defineStorage({ buckets, authorize })`. Each named bucket can declare `onObjectCreated: onObjectCreated(internal["files:created"])`; source imports use extensionless paths such as `./_generated/internal`. The definition captures and freezes bucket configuration and handler references, captures the policy callback, and defaults to denying access when no policy is provided. Missing storage modules declare no buckets and deny access.

Project loading validates the declaration brand, current internal handler identity/kind/version, and the configured job attempt ceiling. Storage code participates in the immutable build hash, and generated registries export the captured declaration. Invalid declarations do not activate a candidate or alter previously generated policies. Generated service/worker runtime options capture the declaration. Tooling can prepare buckets and disabled triggers as described below; release coordination and credentials remain pending.

## Runtime ownership

A runtime with declared buckets requires `storageBackend`, containing the expected project/branch IDs and a `connect` factory that creates a fresh backend with a `close` method. The runtime captures those options before awaiting activation, connects the backend only after database activation succeeds, and rejects a mismatched backend target. Direct runtime construction also checks internal handler identity, kind, version and attempt limits.

`runtime.storage.intents` exposes the trusted server intent service; caller identities must come from verified sessions. `runtime.storage.events` receives trusted provider deliveries. Both capture inputs, propagate caller/shutdown cancellation, enforce activation through the underlying services and reject work after stopping. Startup failure closes the backend and database. Shutdown drains owned work before closing both resources. Generated workers connect storage trigger bindings to this event capability; storage receipts still enqueue work without executing application handlers inline. The application function policy must explicitly authorize the internal job, whose identity remains null.

The runtime integration uses a non-owner PostgreSQL role, separate real S3 adapters against the local HTTP fixture and the actual Neon worker HTTP entry. It checks target mismatch cleanup, activation before connecting, input capture, tenant denial, duplicate receipt ingestion, signed download, queued execution, cancellation and drain-before-close behavior. The public service exposes the intent operations described below. Automatic cloud credential provisioning and release coordination remain pending.

## Public HTTP and client operations

The public service exposes `POST /api/loom/storage` only when storage is configured. It uses the existing bearer verifier and exact-origin policy, always requires authentication (including when function calls permit anonymous access), accepts at most 16 KiB of metadata, and rejects caller-supplied identity fields. Upload bytes travel directly to the signed object URL, not through this route. Replies are not cached. Policy and cross-tenant denials return 403, conflicting creation keys or unavailable uploads return 409, and failed byte verification returns 422. Provider/database failures return a fixed 500 response without exposing their details.

`createClient(...).storage` provides `create`, `status`, `signUpload`, `finalize`, and `signDownload`. Supply a stable `idempotencyKey` to `create` when an explicit retry must recover an uncertain earlier result. Automatic retries preserve captured metadata, the original key and the authenticated identity partition. All methods accept a cancellation signal; responses validate intent state and signed URL structure. The upload descriptor contains `bucket`, byte `size`, MIME `contentType` and the lowercase hexadecimal SHA-256 digest. IDs and object keys are issued by the server.

```ts
const intent = await client.storage.create(upload, { idempotencyKey: uploadRequestKey });
const signed = await client.storage.signUpload(intent.id);
const response = await fetch(signed.url, {
  method: signed.method,
  headers: signed.headers,
  body: bytes,
  credentials: "omit",
  redirect: "error",
});
if (!response.ok) throw new Error("Upload failed");
await client.storage.finalize(intent.id);
const download = await client.storage.signDownload(intent.id);
```

Send the exact bytes used to calculate the descriptor's size and digest, and preserve the returned upload headers. Do not forward the application's bearer token to object storage. Finalization verifies bytes before marking the intent ready; provider event receipts independently queue declared handlers. A failed or uncertain request can be inspected using `status` and retried with the original intent or creation key.

## Private bucket and disabled trigger preparation

`prepareNeonStorageBuckets` inspects the configured deployment target, creates missing declared buckets with explicit private access, and verifies the final state. It refuses existing public buckets rather than changing their policy. Repeated preparation reuses private named buckets, including after a lost create response. Only declared bucket names are candidates; unrelated buckets are not mutated. See Neon's [bucket API](https://neon.com/docs/storage/buckets).

`prepareNeonStorageTriggers` requires those private buckets and a completed active worker deployment. It creates or reconciles object-created triggers with `enabled: false`, the worker trigger path and the exact branch staging-upload prefix. It refuses a conflicting name assigned to another function, trigger type or bucket, rechecks target/worker identity around mutations, and verifies the disabled final state. Returned bindings use actual provider trigger IDs. These bindings must be included in the final worker before later activation. The prefix excludes verified ready-object writes to prevent notification loops. See the [storage trigger contract](https://neon.com/docs/compute/functions/triggers/object-storage).

The pinned SDK originally normalized missing or unknown access levels to private. Loom carries a narrow `@neon/config@1.7.2` patch that rejects those responses; an unpatched consumer is not a supported storage deployment environment. See `patches/README.md` for the packaging and upgrade gate. Public-read metadata remains distinguishable and is refused by preparation.

Unit tests cover private creation, public/missing buckets, lost responses, partial retries, inherited triggers, ownership conflicts, duplicate declarations, target/worker drift and a provider ignoring disable. The runtime integration uses the actual pinned SDK's HTTP methods against a local control-plane fixture, then carries its returned trigger ID and prefix through signed upload, PostgreSQL receipt persistence and durable handler execution. Neither this fixture nor the patch tests establish live Neon acceptance. Credentials, final worker deployment with bindings, health checks, activation, cleanup and the release coordinator remain outstanding.
