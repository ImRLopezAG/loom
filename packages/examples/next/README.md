# Next.js + Loom

See the [setup and integration matrix](../README.md). This application demonstrates App Router server prefetch, request isolation, native TanStack Query hydration and explicit live subscriptions.

Start with [the server page](./app/page.tsx), then [the browser hooks](./components/notes.tsx). `loom/next/server` composes the official Neon Auth SDK with request-scoped prefetch. Its thin `/api/auth/*` route is the SDK proxy; the application does not implement session cookies.

## Independent backend

This application owns [its contracts](./loom/contracts/examples.ts), [handlers](./loom/functions/examples.ts), [schema](./loom/schema.ts), [application config](./loom/app.config.ts), [auth config](./loom/auth.config.ts), and migrations under `loom/_generated/migrations`. It demonstrates Zod contracts and native Effect handlers/services. The frontend imports its own `loom/_generated/api`; no other example package is required.

Configure `.env.example` values for this example's own Neon preview branch and trusted issuer. This example owns database namespace `next_app`, metadata namespace `loom_next`, runtime role `loom_next_runtime`, and its own linked branch. The deployment name defaults to `preview`; link a separate branch for each example. Allow `http://localhost:3000` in `APP_ORIGINS`.

From this directory:

```sh
bun run generate
bun run deploy
# Set LOOM_SERVICE_URL to this deployment's URL, then:
bun run build
bun run start
```

Keep `NEON_*` and `APP_ORIGINS` values consistent for deployment and build. `bun run dev` regenerates this app's client before starting the frontend. `bun run dev:backend` starts the Loom development workflow independently.

Set `NEON_AUTH_BASE_URL`, a random `NEON_AUTH_COOKIE_SECRET` of at least 32 characters, and `LOOM_SERVICE_URL` in the frontend server environment. None belongs in public browser env. The provider SDK owns signup, login, refresh and logout; `loom/react/neon` owns the authenticated query/stream lifecycle. Clerk, WorkOS and Auth0 variants are deferred.
