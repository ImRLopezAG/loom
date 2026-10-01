# Next.js and TanStack Start auth migration

Both examples now connect the official Neon browser SDK to their Loom service's
`/api/auth/*` endpoints using `createLoomNeonReact(createClient, { serviceUrl })`.
Their frontend auth routes have been removed. WorkOS and Clerk remain separate
live acceptance tests; this change adds no examples for those providers.

Frontend configuration contains a public service URL. Auth cookie signing
secrets belong on the Loom backend. The small framework request adapters only
forward an incoming bearer token for optional authenticated SSR. Ordinary
browser navigation restores the service-owned session client-side; service
cookies are not assumed to exist on the frontend origin.

## Verification

- 22 tests passed across neon-client-token, neon-react, auth-provider,
  auth-lifecycle, server-session, auth-http, and neon-auth-http.
- Next.js and Start production builds and typechecks passed; tests and e2e
  packages also typechecked (7 Turbo tasks).
- Repository lint passed.
- Both production browser scenarios passed, with 36 assertions total:
  removed frontend routes return 404, request-scoped SSR isolates users and
  does not serialize tokens, browser login and reload restore sessions,
  live updates cross tabs, logout and account changes isolate caches.
- Mobile screenshots for both examples were inspected; no horizontal overflow
  or clipped controls were observed.

Browser tests use a local HTTPS auth protocol fixture and PostgreSQL. They
exercise the native Neon SDK against the new service boundary, not hosted Neon
cookie delivery.

## Inline review

Reviewed correctness, security, reuse, simplicity, and test coverage in the
main thread, following the workspace instruction to run agent tasks inline.
This is not an independent reviewer receipt.

The review checked URL restrictions, credential destination, provider-session
binding before token retrieval, SSR cache isolation, token-free hydration,
frontend secret removal, and preservation of existing direct/proxy SDK modes.
An unrelated Turbo environment replacement was found and reverted. The
internal token endpoint argument was simplified to an explicit URL/credentials
object. No further blocking finding was identified within this migration.

## Remaining acceptance boundary

This migration uses the existing, still-uncommitted U5 Loom-hosted Neon mount
in the working tree (`neon-auth-http.ts` and its adapter/runtime wiring).
Those files are intentionally outside this migration commit. A checkout of
this commit alone must not be presented as a complete hosted-auth release.

Managed Neon Functions multi-`Set-Cookie` delivery remains unresolved, as
recorded in the existing hosted-auth U5 validation record. Local browser
success does not close that hosted acceptance gap.
