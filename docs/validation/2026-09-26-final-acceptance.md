# Public package and Neon acceptance

This receipt supplements the per-unit receipts for the September 26 public-package plan. Clerk, WorkOS, Auth0, and their dependent native example are deferred by the user's explicit instruction. They are not implemented or certified by this work. Publication is separate.

## Configuration and package

`apps/loom` owns the compiled `loom@0.0.0` CLI, runtime and tooling. Tasks, jobs/storage, and integration examples have no `loom.config.ts`. Next and Start retain eight-line namespace overrides because their acceptance applications share one branch. There are no repeated connection credentials, provider targets, deployments or auth policies in those files. Auth trust belongs in `loom/auth.config.ts`; Neon SDKs own sessions. The obsolete Start `/api/session` route was removed with explicit user approval in `6270c38`, and its prior dirty patch is retained in the ignored run directory.

The latest installed CLI deployed release `04378da5bdc23e140844f04c52fd09251cde4d5c43b6f37a029e148dce5f67e4` on owned branch `br-holy-dawn-b5cz7aod` with no config file and no supplied migration/runtime URL or activation-token environment variables. Its generated client discovers the deployed service URL and rejects invalid credentials through the actual Function. Four independently packed examples build outside the workspace; a second packed test verifies actual migration and bucket-privacy patches. These two tests passed in 40.51 seconds.

## Runtime evidence

- Actual Neon tasks CRUD/live and jobs/storage suites passed separately; SSR Next and Start used distinct application contracts and namespaces with Zod/Valibot and Effect.
- Each SSR integration returned six authenticated HTML responses across two principals plus an anonymous response. Own protected content appeared before hydration, other-principal content did not, and responses were private/no-store. Browser sign-in, live mutation, sign-out and account replacement passed in the collaborative browser.
- Both sign-in layouts were inspected at 375 by 667 CSS pixels; document width remained 375 and inputs retained visible labels. This is mobile viewport coverage, not a native-device claim.
- A compiled-provider browser fixture recovered from simulated offline verification failure on TanStack's online event and preserved unrelated cache data.
- Six current compiled-client samples against the deployed Next application measured first snapshot median 810.19 ms / p95 1158.03 ms; mutation-to-live median 1028.39 ms / p95 1105.38 ms; signed-token retrieval plus fresh-peer reconnect median 857.21 ms / p95 997.38 ms. Every sampled write appeared once. First process connection and raw samples are retained; provider cold state was not forced. There is no pre-change baseline and no speedup claim.
- Real Neon schema-only and data-copy inheritance, environment marker values, storage bytes, auth records, quarantine, job cancellation, and disposable-child reset are recorded in the U5 receipt.
- Interactive CLI organization selection was cancelled with a blank answer in a real PTY. It returned exit 3 with `ONBOARDING_SELECTION`, created no application or onboarding receipt, and released its lock.

## Validation boundaries

All 16 workspace typecheck tasks passed, including builds. The full unit suite passed 228 tests before two additional focused security cases; the focused auth/SSR run passed nine tests. The PostgreSQL 18 integration run passed 167, failed six fixture assumptions, and skipped one dedicated schema-baseline fixture; all six failures were repaired and the affected five-file run passed nine tests. The separately configured real Neon baseline test had already passed ten assertions. These are separate runs, not a fabricated single green aggregate.

The role-grant regression passed against both local PostgreSQL 18 and Neon. It proves an unmanaged-role refusal cannot change grants. Signing-key rotation/outage and persisted paused-mutation rejection are controlled transport/clock tests; they do not claim authority over Neon's signing-key rotation.

Oxlint passes. Repository `format:check` / `check:static` still report the pre-existing user-owned README trailing blank line and untracked diagnosis document; both are preserved. Changed implementation files are formatted. React Doctor returned 65/100 with advisory warnings, principally sequential database/deployment operations and existing example form handlers; this is not reported as a clean scan. Transaction order and provider mutation sequencing were retained.

Official saved Neon credentials and actual project access are proven. Fresh OAuth consent and real OS-keyring failure were not repeated against the user's active profile; pinned official-helper fixtures cover fresh/expired/revoked/concurrent credential flows. No independent review agents or cross-model reviewer were run because the user's tool mapping requires sequential inline review.

Detailed nonsecret receipts and command logs remain under `.git/loom-public-package-run/` and `/tmp/loom-*.log`. Never commit account, cookie, connection-string or token files from the external acceptance directories.

## Final artifact and review

The final installed CLI artifact SHA-256 is `b2323fe786a1bd1123aee35543b96165fa3ba3ae187759d7d8ff89ea5c8aa7d5`. Its cloud release is identified above. Later signing-key and hydration changes add tests only.

A real Neon WebSocket ticket was allowed to expire and was rejected with HTTP 401. A fresh authenticated peer subsequently succeeded, and its mutation appeared exactly once. Scoped `vp check` passed formatting for 581 files and lint/type checks for 517 files. The final focused test-package typecheck passed.

The [final inline review](2026-09-26-final-review.md) records the corrected findings, coverage, and remaining acceptance boundaries.

## Resource cleanup

After acceptance, the two owned U5 branches (`br-young-frost-aw1c23or`, `br-shy-block-aw671pe2`) were deleted from the user's Loom project. The owned disposable project `spring-glade-05131505` was deleted after verifying its exact name and organization. Successful subsequent branch/project listings confirmed their absence and preserved Loom project `late-moon-69483649` and its default branch `br-solitary-sun-aw6tznuf`. The temporary deployed acceptance URLs are consequently no longer live. Cleanup evidence is retained in the ignored run directory.
