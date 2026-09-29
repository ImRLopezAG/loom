# Application-defined Better Auth plugin acceptance

Plan: `docs/plans/2026-09-28-1642-feat-loom-hosted-auth-better-auth-plugins-plan.md`, U7/U8 plugin acceptance subset.

The application-owned fixture consists of `packages/e2e/fixtures/app-auth-plugin.ts` and its separate native client plugin. It uses Better Auth's public plugin schema, endpoint, session middleware and adapter APIs. It is not a Loom plugin wrapper or a published integration package. The plugin is mounted through the same `defineBetterAuth` application component and native configuration used for migration discovery and service initialization.

On 2026-09-29:

- The assembled local service with real Neon PostgreSQL 18 passed its combined-plugin test in **27.87 seconds**. The app plugin's renamed table contains its persisted value; repeated writes update that value; configured input limits reject oversized values; anonymous reads return 401; a second user starts without the first user's record and writes independently; signing back in restores the first user's value. Existing JWT rotation, organization, two-factor and Better Inbox cases still pass.
- The normal `LOOM_CLOUD_SUITE=better-auth` runner passed **3 tests in 60.86 seconds**. The deployed Function test passed in **42.61 seconds**, including app-plugin native-client writes/reads, invalid-input rejection and anonymous rejection alongside native bearer sessions, JWT exchange, protected Loom RPC and session revocation. The runner records `app-defined-plugin` in its acceptance receipt after resource cleanup.
- Workspace typechecking passed all 18 tasks. Positive and negative compile assertions preserve string input/output, reject a client-selected user ID, reject undeclared result fields, and deny plugin methods on a client without that plugin.
- Oxlint passed after documenting the native type-only inference assertion. No lint suppression or broad runtime cast was added.

Correctness, security and simplicity review ran sequentially inline under repository instructions. Owner selection comes exclusively from the session middleware, table names use the existing schema compiler, the client imports the server plugin only as a type, and no credential is logged. The native client implementation and schema factory are shared by local and deployed tests. The fixture deliberately exercises sequential create/update requests; it is not a production concurrency-safe preferences service. No additional framework abstraction was necessary.

This evidence does not complete the whole plan. Managed Neon multi-cookie delivery, custom cookie-dependent OAuth/2FA on deployed Functions, browser reload persistence, and the remaining packed-consumer/SSR acceptance remain separate. The managed failure did not block this custom Better Auth implementation. WorkOS, Clerk and Auth0 live account acceptance remains deferred by the user; provider-issued runtime tokens are not supplied manually in chat.
