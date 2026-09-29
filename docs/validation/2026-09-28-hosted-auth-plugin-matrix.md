# Combined native plugin acceptance (U7 increment)

Plan: `docs/plans/2026-09-28-1642-feat-loom-hosted-auth-better-auth-plugins-plan.md`. This completes a bounded plugin test increment, not all U7 or hosted acceptance.

## Evidence

`packages/e2e/integration/better-auth-http.test.ts` now runs JWT, organization with teams, two-factor, and Better Inbox together through the compiled Loom service and native Better Auth client. Real Neon PostgreSQL stores the data under the migration-created native namespace; the runtime uses its restricted database role.

- Signup, session lookup, organization/team creation, JWT/JWKS verification, sign-out, sign-in, and two-factor persistence pass.
- Better Inbox's server-only `notify` persists a notification. Its native client lists it, reads the unread count, marks it read, and observes zero unread items. SQL confirms persistence.
- The notify route is absent over HTTP (404); anonymous listing is rejected (401). Another authenticated user's list is empty and marking the owner's notification returns 404, rather than merely any error.
- Better Inbox is a dev dependency and acceptance fixture only. No Loom integration package or application feature was created for it.
- Reran all 12 schema configurations: core, JWT, organization, teams, two-factor, inbox, combined, model/field aliases, serial IDs, UUID IDs, database rate limiting, and additional scalar/array/JSON/enum fields. Each performs actual migrations, native signup/sign-in, catalog checks and no-change migration comparison.

Combined run: **13 tests passed, 74 expect calls**, 71.36 seconds. The expanded HTTP flow took 25.45 seconds. The separate unit suite passed **292 tests**; full typecheck/build passed **18 tasks**; E2E typecheck and Oxlint passed.

## Sequential review

Per the user's AGENTS mapping, reviewed inline rather than dispatching agents. This is a phase receipt, not the final standalone ce-code-review receipt.

- Correctness/testing: tests use actual plugin implementations and native inferred client methods, not mocked plugin-shaped objects. Strengthened the cross-user assertion to require 404 so a database/server failure cannot count as authorization success.
- Security: checked authenticated-user isolation, server-only method exclusion, anonymous denial, restricted runtime role and final cleanup. No token, password or cookie value is logged.
- API/types: native Inbox, JWT, organization/team and two-factor client calls compile through package exports; no any casts or replacement API wrappers were added.
- Simplicity/reuse: reused the existing assembled-service fixture, native cookie jar and migrations. Reviewed reuse, quality and efficiency rubrics; no new test framework/helper abstraction was justified.
- Resource/data safety: scopes and roles are random and removed in finally after service drain. All cloud test Functions were separately verified deleted; the disposable acceptance branch remains for continuation.

## Open gates

External-table ownership/constraint compatibility, remaining option combinations, OAuth, multiple mounts, plugin upgrades, frontend/SSR migration, packed CLI and browser acceptance remain open. The deployed Functions duplicate-cookie regression described in `2026-09-28-hosted-auth-u5-blocker.md` prevents claiming hosted multi-plugin sessions work. This local assembled server uses real Neon Postgres, but is not itself a deployed Function.
