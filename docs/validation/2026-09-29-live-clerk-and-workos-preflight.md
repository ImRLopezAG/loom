# Live Clerk acceptance and WorkOS Portless preflight

The user authorized reuse of Sunday development auth applications and their Google session in Brave on 2026-09-29. Sunday source and environment files were read without modification. No secret key or session token was copied into committed files.

## Clerk

The development application configuration came from `~/dev/sunday/sunday-ontology/apps/sunday/.env.local`. An isolated browser fixture used Clerk's native JavaScript SDK and Google sign-in in Brave. It did not load Sunday's business application or query its business data.

Observed results:

- Google sign-in completed using an existing user account.
- Reloading the fixture recovered the provider-owned session.
- The native client obtained a current token and a fresh token using `getToken({ skipCache: true })`.
- Both tokens passed the compiled `loom/server` `createJwtVerifier`, first locally and then inside a real Node.js 24 Neon Function on the disposable acceptance branch.
- Verification used the configured Clerk issuer, its remote JWKS, RS256, and Loom's required subject/expiration validation. This fixture did not configure an audience requirement or test application-specific authorization.
- Anonymous and malformed tokens returned 401 from the deployed verifier.
- The temporary Function was deleted, and its absence was verified through the provider API.

The browser sent tokens only to the local fixture, which forwarded them to the deployed verifier. Outputs contained success booleans only. Browser-managed provider state stayed in Brave. This was a focused live-provider experiment: it does not establish the full oRPC invocation path, `LoomProviderWithAuth` integration with Clerk, streaming refresh, SSR isolation, or automated regression coverage. Private experiment files remain under `.git/` for continuation.

SDK setup followed Clerk's JavaScript quickstart: https://clerk.com/docs/js-frontend/getting-started/quickstart.

## WorkOS

`~/dev/sunday/ontology/.env.local` contains a WorkOS test application and a callback at `https://sunday-ontology.localhost/auth/callback`. The global CLI is `/Users/angel/.bun/bin/portless`, version 0.15.5. The isolated fixture was launched from the Loom workspace with this global CLI; Sunday does not need to run.

The initially running proxy used HTTPS port 1355 with no active app routes. Starting port 443 required sudo; the noninteractive command could not obtain a password. The global CLI fell back to port 1355. That URL does not match the saved callback's port, so WorkOS browser acceptance is pending a port-443 proxy or a confirmed registered alternative callback. No WorkOS dashboard settings were changed. The original port-1355 proxy was restored by the global CLI.

Clerk acceptance is independent of this local WorkOS routing issue. Auth0 configuration was not found among the inspected Sunday environment files; no Auth0 acceptance is claimed.

### Portless follow-up

After the user configured Portless, the global proxy served the isolated Loom fixture at `https://sunday-ontology.localhost` on port 443. WorkOS Google sign-in returned to the exact registered callback. The local routing blocker is resolved.

The native AuthKit React SDK then failed its authorization-code exchange with `TypeError: Failed to fetch` and displayed signed out. A read-only, authenticated request to WorkOS `GET /user_management/cors_origins` returned HTTP 200 with an empty origin list. The React SDK requires the browser origin to be registered separately from its callback URI: https://workos.com/docs/sdks/authkit-react.

The user approved adding only `https://sunday-ontology.localhost`. WorkOS returned 201, and a follow-up GET confirmed exactly that origin. Native Google sign-in and token verification then passed locally and in a deployed Node.js 24 Neon Function using compiled Loom's `createJwtVerifier` and WorkOS remote JWKS.

The first fixture used the SDK's cookie mode. Session recovery on reload and forced refresh failed in Brave on the Portless hostname. AuthKit automatically enables `devMode` only for literal `localhost` and `127.0.0.1`, not `*.localhost`. Setting `devMode` explicitly in this private local fixture made forced refresh pass, including verification of the refreshed JWT inside the Neon Function. Development mode uses the provider SDK's local storage; this is not a production storage recommendation or a change to Loom's authentication implementation.

Anonymous and malformed requests returned 401 from the hosted verifier. No production source code or Sunday files changed. These live experiments establish provider-token verification, not full oRPC, streaming, SSR, or `LoomProviderWithAuth` acceptance.

Reload with explicit development mode recovered the provider session; its current token again passed local and hosted verification. Native sign-out cleared the fixture session, confirmed by returning to its signed-out screen. The temporary verifier Function was removed and its absence checked, and the fixture process was stopped. The shared Portless proxy and the approved WorkOS origin remain configured.

Review of this experiment checked exact-origin enforcement on the local forwarding endpoint, server-only use of the WorkOS API key for the approved configuration change, issuer/JWKS verification, no token logging, and cleanup. No library code changed, so no new unit tests or full build/lint run were needed for this evidence-only update.
