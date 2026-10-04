# TanStack Start + Kello

See the [setup and integration matrix](../README.md). This application demonstrates a typed server function, loader cache population, native Router/Query SSR integration, and explicit live subscriptions. Nitro builds a runnable Node 24 server.

The browser uses `kello/react/neon` with `serviceUrl` pointing at this application's Kello Function. Signup, session, token and logout requests go to `/api/auth/*` on that service. This frontend mounts no auth endpoint and holds no auth signing secret.

SSR can prefetch private data when an incoming request supplies an `Authorization: Bearer …` header. Each request gets an isolated client and cache. Normal browser navigation renders the shell and restores the provider session client-side; cross-domain service cookies are not visible to the frontend server. The generated native oRPC options are shared by both paths.

## Independent backend

This application owns [its contracts](./kello/contracts/examples.ts), [handlers](./kello/functions/examples.ts), [schema](./kello/schema.ts), [application config](./kello/app.config.ts), [auth config](./kello/auth.config.ts), and migrations under `kello/_generated/migrations`. It demonstrates Valibot contracts and ordinary async handlers. The frontend imports its own `kello/_generated/api`; no other example package is required.

Configure `.env.example` values for this example's own Neon preview branch and trusted issuer. This example owns database namespace `start_app`, metadata namespace `loom_start`, runtime role `loom_start_runtime`, and its own linked branch. The deployment name defaults to `preview`; link a separate branch for each example. Allow `http://localhost:3001` in `APP_ORIGINS`.

From this directory:

```sh
bun run generate
bun run deploy
# Set VITE_LOOM_SERVICE_URL to this deployment's URL, then:
bun run build
PORT=3001 bun run start
```

Configure `NEON_*` and `APP_ORIGINS` on the Kello backend. Only the public service URL is needed by the frontend build. `bun run dev` regenerates this app's client before starting the frontend. `bun run dev:backend` starts the Kello development workflow independently.

Set `VITE_LOOM_SERVICE_URL` before building the frontend. Configure `NEON_AUTH_COOKIE_SECRET` only on the Kello Function; Neon supplies its branch auth URLs. External provider examples are not included.

Managed Neon hosting acceptance is still blocked by the recorded Neon Functions multi-`Set-Cookie` delivery problem. These examples target the Kello-hosted boundary; a passing build is not evidence that hosted sign-in works. See [the hosted-auth validation record](../../../docs/validation/2026-09-28-hosted-auth-u5-blocker.md).

The browser subscribes once to `examples.watch`; the stream supplies both the initial notes and subsequent updates. It does not also fetch `examples.notes` or invalidate a snapshot after writes. The finite notes procedure remains available for optional server rendering.

This example uses native `useSuspenseQuery(liveOptions())` under a Suspense boundary; the first snapshot reveals the notes UI. The route error boundary handles initial query failures.

Sign-in and sign-out update the provider through the Neon SDK without navigating or reloading. To run without authenticated SSR, render `NotesPanel` without hydration or initial notes; the provider handles browser session initialization.

## Client-only example

Open `/client` after starting the frontend. This route has no server loader, authentication helper, prefetch, or hydration payload. Authentication and data requests start in the browser against the same Kello backend.

[Client route](./src/routes/client.tsx) sets `ssr: false` and renders the native Suspense live-query panel. Start still serves the document shell.

The root route `/` remains the optional authenticated SSR example. Both routes share the app's notes UI and its own generated client.
