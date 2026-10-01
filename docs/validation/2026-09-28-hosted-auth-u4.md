# Native auth runtime and HTTP acceptance (U4)

Predecessor: e21143d. Native auth instances now initialize under their mounted, validated environment and use the supplied runtime database. Schema fingerprints must match planning. Missing, duplicate, or stale scope metadata rejects startup. Each component service factory receives its own instance binding.

## Verified

- Compiled Loom service + actual Neon PostgreSQL: native Better Auth clients completed signup, session lookup, organization creation, team creation, JWT issuance, sign-out, sign-in, and two-factor setup. Persisted two-factor records were checked. JWTs were verified against the native JWKS response, including subject and maximum five-minute lifetime. Expanded run passed in 26.22 seconds.
- Server-only signing methods were unavailable over HTTP. Anonymous token issuance and hostile browser origins were rejected.
- HTTP unit coverage verifies exact request bytes, multiple cookies, redirect preservation, no-store responses, mount collisions, encoded paths, body limits, and ownership of timed-out native work until drain.
- Runtime unit coverage verifies fingerprint rejection, required planning metadata, and one initialized instance reused through services.
- JWT configuration must explicitly match trusted issuer, audience, signing algorithm and hosted JWKS URL. Missing/default JWT settings and excessive lifetimes reject startup. Existing verifier tests cover invalid claims/signatures, unknown-key cooldown, rotation and refresh outage behavior.
- Full unit run: 71 files / 289 tests passed. Full typecheck (including dependency builds): 18 tasks passed. Oxlint passed after replacing representation checks with boundary parsing. Native client typing caught two fixture errors: teams require their client option, and two-factor results require their method discriminator. Both were corrected.

## Sequential review and simplification

- Extracted the existing byte-preserving body reader for shared component/auth use. Existing JSON request reader stays unchanged.
- Auth requests use the existing activation check and application shutdown signal. Ingress deadlines do not discard ownership of native operations; application stop drains them before database shutdown.
- Reserved `/api/auth` against ordinary component mount collisions. Auth is routed before component catch-all, without converting native methods into public RPCs.
- Optional Better Auth runtime code is imported only for mounted native definitions or declared native scopes. An omitted fingerprint cannot silently disable a mounted native component.
- Reviewed cookie copying, origin admission, exact prefix matching, body bounds, native service isolation, and error redaction. No provider message or secret is returned by the HTTP error boundary.

## Remaining acceptance

This is an incremental U4 runtime commit, not complete plan acceptance. Local OAuth callback/redirect behavior, multiple mounted auth instances, native-plugin key rotation through hosted requests, and valid JWT identity through a deployed protected RPC remain required. The live Neon test uses a local assembled Functions-compatible service, not a deployed Function. U7/U8 must retain those distinctions. Managed proxy hosting, example migration, Better Inbox matrix, external-table ownership compatibility, packed CLI and final deployment/security review remain open.
