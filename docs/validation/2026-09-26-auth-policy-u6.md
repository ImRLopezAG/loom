# U6 — authentication policy and minimal example configuration

`defineRpcAuth` accepts a server-owned `verification` policy factory, evaluated when the runtime constructs authentication. `neonAuth` supplies that factory using the branch-injected `NEON_AUTH_BASE_URL` and `NEON_AUTH_JWKS_URL`, with EdDSA restricted to the documented managed token algorithm. Explicit trusted URLs remain available. Policies support per-issuer audiences, allowed asymmetric algorithms, and required tenant claims. Existing global audience configuration remains supported for existing consumers.

The three default-schema examples no longer have `loom.config.ts`. Next and Start retain only their custom database and metadata namespaces. Authentication and origins moved to `loom/auth.config.ts`; `APP_ORIGINS` is declared in application environment schemas so deployment forwards it without custom release mappings. Separate examples require separate linked branches; the default release name is `preview`. External Clerk, WorkOS, and Auth0 integrations remain deferred at the user's request.

## Verification

- New auth-policy test initially failed because the declaration did not control verification. It passes after implementation, including wrong issuer audience and disallowed signing algorithm.
- Eight focused authentication tests pass, including existing expiration, signature, tenant, malformed/opaque token, and untrusted-key cases. Managed policy tests exercise runtime URL lookup, missing configuration, and immutable origin capture.
- Full unit suite: 213 tests across 53 files pass.
- Full integration suite: 107 pass, 64 skip, 0 fail; 394 assertions across 87 files. Database/cloud prerequisites for the skipped tests were not enabled. This is not live authentication acceptance.
- Build and all 16 workspace typecheck tasks pass. Oxlint and scoped formatting pass.
- Configuration-free generation exposed an old codegen test assumption that initialization writes `loom.config.ts`; observed ENOENT and changed the test to restore the actual absent-file state. Seven focused codegen/config integration tests pass (71 assertions).

## Review and remaining gates

Inline correctness, security, public API/TypeScript, reliability, testing, maintainability/simplicity, and project-standard reviews covered these changed files. No independent model review is claimed. The implementation keeps unverified token claims from selecting a network URL, retains issuer/expiry enforcement, never treats query options as authorization, and does not expose platform credentials. Runtime policy resolution is lazy, so generation does not need injected auth values. No custom identity-token minting or external-provider implementation was added.

Live Neon tokens, JWKS rotation/outage acceptance, HTTP/WebSocket lifetime, storage/job authorization, and the lifecycle integration remain later execution gates. This receipt records implementation and local checks, not completion of every U6/U13 acceptance scenario.

Sources verified 2026-09-26: [Neon function environment](https://neon.com/docs/compute/functions/environment-variables), [function authentication](https://neon.com/docs/compute/functions/authentication). The latter documents the issuer origin and managed EdDSA tokens. Logs: `/tmp/loom-u6-*`, `/tmp/loom-minimal-*`.
