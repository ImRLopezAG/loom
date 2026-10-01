# Native two-factor challenge and membership acceptance

Plan: `docs/plans/2026-09-28-1642-feat-loom-hosted-auth-better-auth-plugins-plan.md`, U7. This extends the existing combined JWT/organization/teams/two-factor/Better Inbox test; it is not full U7 completion.

On 2026-09-29, `packages/e2e/integration/better-auth-http.test.ts` passed against the real PostgreSQL 18 Neon acceptance branch in **28.29 seconds**. The assembled Loom HTTP service ran locally, with real restricted-role persistence on Neon. This result does not establish deployed Function cookie support.

The added cases verify:

- A different signed-in user cannot create a team in the owner's organization (403).
- Native two-factor enrollment persists its encrypted secret, and native TOTP verification enables the user's second factor.
- A subsequent password login returns the native two-factor challenge without an authenticated session; JWT exchange remains unauthorized.
- A native backup code completes that challenge and restores the correct user's session.
- Reusing the same backup code on another login fails and does not create a session.
- The native server-only TOTP generator remains unavailable through HTTP (404).

The fixture decrypts its own isolated test secret only to feed Better Auth's native TOTP generator; neither the secret nor generated codes are logged. It does not implement a competing OTP algorithm or product API. Existing notification isolation and native JWT assertions continue to run in the same test.

Code/security/simplification review ran inline under the repository's sequential-agent rule. The change strengthens an existing native-client test, creates no public production endpoints, and keeps two-factor challenge state under Better Auth ownership. No production simplification was needed. E2E typechecking, workspace build, typecheck and lint passed. No credentials, unrelated changes or cloud resources are included in the commit.

The native hosted test is now registered as `LOOM_CLOUD_SUITE=better-auth` in the normal cloud runner. The runner passed **3 tests in 52.54 seconds**, including provider target checks, PostgreSQL 18 runtime-role isolation, and the native hosted flow (36.84 seconds). Its machine-readable receipt is written only after successful assertions and cleanup, and is validated by the runner. This suite does not include or replace the still-failing managed multi-cookie acceptance.
