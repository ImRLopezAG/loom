# U8 Neon provider integration

`loom/react/neon` composes the pinned Neon Auth SDK with Loom's verified lifecycle. It exposes the SDK auth methods, `LoomProvider`, `useAuth` and the generated connection through `useLoom`. Consumers choose a direct Neon Auth URL for CSR or the SDK's same-origin proxy for SSR. The SDK owns session persistence and token acquisition; Loom pins each acquired credential and verifies it on its deployed server before mounting protected consumers.

Tasks and jobs/storage no longer copy session identity, token-refresh or QueryClient disposal machinery. Generated connections expose storage sharing their credential and abort lifetime. Auth failures and logout cannot deliver late storage responses into another session. Native oRPC query/mutation/live options remain unchanged.

## Live evidence

The tasks cloud suite passed all three tests on 2026-09-26 at 22:56 UTC (144 seconds): saved official credentials, PostgreSQL 18/runtime role isolation, and actual Neon Auth/Functions/browser acceptance. It exercised account creation, authenticated project/task writes, live task updates, compatible schema expansion, retained-runtime compatibility, rejection of an undeclared migration, post-upgrade writes, and sign-out/sign-in.

- Disposable project: `spring-glade-05131505`.
- Schema-only branch: `br-shiny-truth-b5d01tcq`.
- Final service: `s56de1c4df89cd4d216d`, deployment 2.
- Worker: `w56de1c4df89cd4d216d`, deployment 2.
- Final version: `56de1c4df89cd4d216d075afce671bb339a91b14b72d836ebd3f3bcba999f5d1`.
- Migration: `83b4ecb9e674f8e1b8879f88e7dcbab275cb6ef4813db8055fe07cbd591b7543`.

An earlier run passed signup/CRUD but failed trigger preparation during upgrade. A later explicit disabled-trigger creation succeeded, so the cause remains unproven. Trigger preparation now reports its safe stage without exposing provider request objects; failed cloud fixtures retain recovery receipts. The earlier owned failure branch `br-hidden-art-b5oojwhg` was deleted after identity/protection checks. A subsequent branch creation received HTTP 422 and safely recorded rejection; after cleanup, the same operation succeeded without duplicate adoption.

## Review and limits

Inline correctness/security/API/simplicity review checked SDK ownership, URL validation, exact session/user matching before token return, no tokens in query keys or hydration, optional provider peers, and scoped disposal. This is not an independent review. React Doctor found a render-time ref mutation in the lifecycle callback, corrected by an effect; its rerun reported no errors, with unrelated branch-wide warnings remaining.

The workspace passed 16 build/typecheck tasks, 223 unit tests and 107 integration tests (64 environment-gated skips) before the additional storage-cancellation regression. Subsequent unit receipts track that change and SSR integration. The live receipt predates the storage follow-up and must not be used as its acceptance evidence. The jobs/storage cloud suite subsequently passed all three tests in 246 seconds at 23:09 UTC on branch `br-sparkling-unit-b59pt3r5`, service `s42d256f7b161ad7128d` deployment 2, worker `w42d256f7b161ad7128d` deployment 2, version `42d256f7b161ad7128ded7c5a3503e076082da48455b001556d0424db88044a3`. This run includes the storage lifetime follow-up and proves private upload/download bytes, object-created triggers, scheduled processing, one successful retry, exhausted retries, and sign-out/sign-in. SSR live acceptance continues separately. Clerk, WorkOS and Auth0 are deferred by user instruction.

The final unit checkpoint passed 225 tests across 57 files. All four examples generated, built and typechecked outside the monorepo using one packed artifact. That test found and fixed duplicate Drizzle type identities caused by tooling Zod peer resolution; tooling now bundles its own reviewed Zod version and Drizzle is a shared peer. CSR examples explicitly declare their Vite types dependency.
