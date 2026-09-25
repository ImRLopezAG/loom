# Next.js + Loom

See the [setup and integration matrix](../README.md). This application demonstrates App Router server prefetch, request isolation, native TanStack Query hydration and explicit live subscriptions.

Start with [the server page](./app/page.tsx), then [the browser hooks](./components/notes.tsx). Authentication is the demonstration token bridge described in the shared README; replace it with your application's provider callback.

## Independent backend

This application owns [its contracts](./loom/contracts/examples.ts), [handlers](./loom/functions/examples.ts), [schema](./loom/schema.ts), [application config](./loom/app.config.ts), [auth config](./loom/auth.config.ts), and migrations under `loom/migrations`. It demonstrates Zod contracts and native Effect handlers/services. The frontend imports its own `loom/_generated/api`; no other example package is required.

Configure `.env.example` values for this example's own Neon preview branch and trusted issuer. This example owns database namespace `next_app`, metadata namespace `loom_next`, runtime role `loom_next_runtime`, and deployment `next-preview`; it can coexist with the other examples without sharing tables or replacing their releases. Allow `http://localhost:3000` in `APP_ORIGINS`.

From this directory:

```sh
bun run generate
bun run deploy
# Set LOOM_SERVICE_URL to this deployment's URL, then:
bun run build
bun run start
```

Keep `NEON_*` and `APP_ORIGINS` values consistent for deployment and build. `bun run dev` regenerates this app's client before starting the frontend. `bun run dev:backend` starts the Loom development workflow independently.
