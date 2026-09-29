# Next.js + Loom

See the [setup and integration matrix](../README.md). This application demonstrates App Router server prefetch, request isolation, native TanStack Query hydration and explicit live subscriptions.

The browser uses `loom/react/neon` with `serviceUrl` pointing at this application's Loom Function. Signup, session, token and logout requests go to `/api/auth/*` on that service. This frontend mounts no auth endpoint and holds no auth signing secret.

SSR can prefetch private data when an incoming request supplies an `Authorization: Bearer …` header. Each request gets an isolated client and cache. Normal browser navigation renders the shell and restores the provider session client-side; cross-domain service cookies are not visible to the frontend server. The generated native oRPC options are shared by both paths.

## Independent backend

This application owns [its contracts](./loom/contracts/examples.ts), [handlers](./loom/functions/examples.ts), [schema](./loom/schema.ts), [application config](./loom/app.config.ts), [auth config](./loom/auth.config.ts), and migrations under `loom/_generated/migrations`. It demonstrates Zod contracts and native Effect handlers/services. The frontend imports its own `loom/_generated/api`; no other example package is required.

Configure `.env.example` values for this example's own Neon preview branch and trusted issuer. This example owns database namespace `next_app`, metadata namespace `loom_next`, runtime role `loom_next_runtime`, and its own linked branch. The deployment name defaults to `preview`; link a separate branch for each example. Allow `http://localhost:3000` in `APP_ORIGINS`.

From this directory:

```sh
bun run generate
bun run deploy
# Set NEXT_PUBLIC_LOOM_SERVICE_URL to this deployment's URL, then:
bun run build
bun run start
```

Configure `NEON_*` and `APP_ORIGINS` on the Loom backend. Only the public service URL is needed by the frontend build. `bun run dev` regenerates this app's client before starting the frontend. `bun run dev:backend` starts the Loom development workflow independently.

Set `NEXT_PUBLIC_LOOM_SERVICE_URL` before building the frontend. Configure `NEON_AUTH_COOKIE_SECRET` only on the Loom Function; Neon supplies its branch auth URLs. External provider examples are not included.

Managed Neon hosting acceptance is still blocked by the recorded Neon Functions multi-`Set-Cookie` delivery problem. These examples target the Loom-hosted boundary; a passing build is not evidence that hosted sign-in works. See [the hosted-auth validation record](../../../docs/validation/2026-09-28-hosted-auth-u5-blocker.md).

The browser subscribes once to `examples.watch`; the stream supplies both the initial notes and subsequent updates. It does not also fetch `examples.notes` or invalidate a snapshot after writes. The finite notes procedure remains available for optional server rendering.

This example uses native `useQuery(liveOptions())` with an explicit pending state.

Sign-in and sign-out update the provider through the Neon SDK without navigating or reloading. To run without authenticated SSR, render `NotesPanel` without hydration or initial notes; the provider handles browser session initialization.
