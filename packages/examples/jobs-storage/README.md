# Upload catalog

This example records verified upload metadata and processes it with durable jobs. It produces a catalog summary of media type, byte count and SHA-256; it does not inspect file contents.

The backend has an independent Loom configuration and committed initial migration. Uploads are private to the verified issuer, subject and tenant. The object-created handler records the uploader and schedules processing in the same transaction. Public job-status reads first check ownership of the catalog entry.

Three buckets demonstrate queue behavior:

- `uploads`: processing succeeds on the first attempt.
- `retry-demo`: processing deliberately fails once, then succeeds.
- `failure-demo`: processing deliberately fails all three attempts.

These failure modes are demonstrations, not transient provider failures. Retries wait two seconds. Clients must poll `files:status` for queue changes: metadata queue writes do not invalidate application live queries.

The loopback object store is implemented; the local launcher and React interface are still being implemented. The store keeps objects in memory for the lifetime of the example, with at most 128 reservations and 64 MiB of reserved object bytes. Signed URLs bind the HTTP method, object ID and expiry. Uploaded bytes must match the declared size, media type and SHA-256 before the object-created callback runs. Sealing prevents later upload URLs from changing the downloadable object. To verify the backend from the repository root with a local PostgreSQL 18 administrator connection:

```sh
bun install
bun run check
LOOM_TEST_DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/postgres \
  bun test packages/e2e/integration/upload-example.test.ts
```

The test creates and removes an isolated database and runtime role. The pipeline uses real PostgreSQL and the example’s HTTP object store. This is not Neon provider acceptance.
