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
