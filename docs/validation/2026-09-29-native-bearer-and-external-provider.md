# Native bearer acceptance and external provider hook

Plan: `docs/plans/2026-09-28-1642-feat-loom-hosted-auth-better-auth-plugins-plan.md`.
Scope: additional U4/U7/U8 hosted evidence and the independent external-provider portion of U6. This is not completion of U5–U8.

## Hosted evidence

`packages/e2e/cloud/better-auth.test.ts` passed on 2026-09-29 in 31.61 seconds (one test). It used project `late-moon-69483649`, disposable branch `br-withered-sound-awvacv2m`, native Better Auth 1.7.6 bearer/JWT/organization plugins, real migrations, a restricted runtime role, and a deployed Node 24 Neon Function.

Verified through native clients and compiled Loom exports:

- Password signup returns the native signed session credential through `set-auth-token`.
- Session reads and organization/team creation work with bearer authorization and no cookie jar.
- Native JWT output verifies against the public JWKS endpoint, expected issuer, audience and algorithm.
- That JWT authenticates the protected Loom `whoami` procedure.
- An opaque session credential is rejected by Loom RPC with `UNAUTHORIZED`.
- Anonymous token exchange fails; sign-out revokes the retained bearer session credential and prevents another token exchange.

No custom JWT/signing plugin was needed. The native factory is shared between discovery and deployed runtime. The fixture bypasses release activation with `assertActive`; this is not full CLI deploy acceptance. The test does not persist credentials across browser reloads, cover OAuth/2FA challenge cookies, or prove immediate revocation of an already-issued JWT (maximum configured lifetime: five minutes).

A bootstrap deployment obtains the provider-assigned URL before configuring issuer/JWKS. Neon reported deployment completion before all requests reached the new handler. The test retries auth requests only when the inert bootstrap's explicit marker proves no auth operation ran. Its read-only RPC readiness probe additionally tolerates bounded `UNAUTHORIZED` while the remote JWKS route converges. Actual authentication must eventually succeed; the negative opaque-token assertion specifically requires `UNAUTHORIZED`, not any network failure. These retries are test-only and do not change production retry policy.

A follow-up provider API read returned an empty Functions list. Each run dropped its own schemas and runtime role. The disposable branch remains for the unfinished acceptance matrix.

## External provider API

`createLoomReact(createClient)` now also returns `LoomProviderWithAuth`, accepting a provider-owned `useAuth` hook with `isLoading`, `isAuthenticated`, and `fetchAccessToken({ forceRefreshToken })`. This follows the inspected `~/dev/jobber/src/components/providers/convex.tsx` pattern. It reuses `createTokenAuth` and the existing connection/cache lifecycle. No WorkOS/Clerk/Auth0 package or auth server is created by this API.

The SSR regression failed before implementation because the provider did not exist, then passed. It verifies that server rendering neither opens connections nor fetches credentials. Full unit suite: **293 tests in 72 files passed**. Workspace build, all **18 typecheck tasks**, and Oxlint passed.

The T3 collaborative browser exercised `packages/e2e/fixtures/external-auth-provider.tsx` against the compiled package:

| Transition        | Token fetches | Disposals | Forced refreshes | Private cache |
| ----------------- | ------------: | --------: | ---------------: | ------------- |
| Initial Alice     |             1 |         0 |                0 | Alice         |
| Ordinary rerender |             1 |         0 |                0 | Alice         |
| Switch to Bob     |             2 |         1 |                0 | Bob           |
| Reconnect/refresh |             3 |         2 |                1 | Bob           |
| Sign out          |             3 |         3 |                1 | empty         |

Unrelated cache data remained present; the browser recorded no console errors. This is a provider-contract fixture, not live WorkOS, Clerk or Auth0 acceptance; those integrations remain deferred by the user.

## Review and simplification

Per the repository's inline-agent rule, code, security, and simplification review ran sequentially in the main context. This is a phase receipt, not a standalone `ce-code-review` shipping receipt.

- Reuse: retained native Better Auth plugins and Loom's existing token/lifecycle abstractions. Replaced function-string serialization in the hosted fixture with a shared imported factory.
- Correctness: tightened the opaque-token negative test from any rejection to `UNAUTHORIZED`; bounded bootstrap routing handling prevents false success/failure from stale deployment responses.
- Security: branch protection/endpoint checks precede mutations; only isolated schemas/roles are removed; no credentials enter the receipt, browser fixture, or logs; JWT trust remains server-controlled. Native session credentials cannot authenticate Loom RPC.
- Efficiency: memoized the hook adapter; browser checks confirmed rerenders do not reconnect/refetch. Test resources and transports are disposed. No per-request schema discovery was added.
- Limits: cookie-dependent managed hosting remains blocked by the separately retained multiple-Set-Cookie regression. Browser cookie flows, provider-specific live acceptance, remaining schema/plugin combinations, packed CLI/browser acceptance and final shipping review are still open.
