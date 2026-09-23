# Storage verification

The current Neon adapter provides signed staging uploads, bounded byte verification, writes to verified object keys, signed downloads and explicit deletion. Authorization, durable intent state and provider event ingestion are still being implemented. Do not expose these low-level methods directly as public endpoints: their caller must authorize the operation, load the saved intent, verify branch activation and use a private bucket.

## Object identity and verification

An intent descriptor fixes its UUID, bucket, byte length, media type and SHA-256 digest. The initial upload limit is 10 MiB. Keys derive from the verified project/branch configuration and intent ID; users do not supply object paths. The adapter refuses a Neon storage endpoint whose branch or region differs from its configuration. The injected S3 client parameter is a trusted integration/testing boundary.

Uploads use a staging key. A signed PUT binds length, content type and intent metadata for at most five minutes. The client sends the returned headers and exact bytes. Before sealing an upload, Loom checks provider metadata, reads at most the declared length into one bounded buffer, and verifies the SHA-256 digest. Only verified bytes are written to a separate ready key using server credentials. This avoids relying on object versions: Neon currently stores versioning configuration without enforcing it. Signed PUT URLs remain reusable until expiry, so they must never address ready keys. See Neon's [S3 compatibility](https://neon.com/docs/storage/s3-compatibility) and [object operations](https://neon.com/docs/storage/objects).

A ready key contains the intent ID and digest. Repeated sealing first checks for a matching ready object. This recovers a successful object write when the subsequent database update failed, even if staging has since changed. Only a provider 404 permits falling back to staging; permission or provider failures do not authorize a replacement. Concurrent successful seals write the same verified bytes. A download URL is issued only after the ready object's metadata matches and lasts at most five minutes.

Staging is retained after sealing so database failure cannot erase recovery inputs. The durable intent service will own pending/ready/failed transitions, cleanup after upload URLs expire, event deduplication and tenant access. Bucket provisioning must require private access. Do not rely on provider lifecycle expiry or credential `expires_at`: Neon documents that lifecycle rules and credential expiration are not enforced. See [S3 limitations](https://neon.com/docs/storage/s3-compatibility) and [storage authentication](https://neon.com/docs/storage/authentication).

## Verification evidence

The integration fixture uses the pinned AWS SDK and request presigner against a local HTTP object server. It verifies request/signature fields, downloaded bytes, metadata and digest rejection, staging isolation, recovery after sealing, targeted cleanup, branch mismatch, expiry/size bounds and cancellation. The server does not verify SigV4 signatures; acceptance of signed requests, private bucket policy and provider metadata behavior still require a disposable Neon test. Consumer integration also bundles the Neon entries through the pinned provider SDK and imports the extracted bundles in fresh Node 24 processes.
