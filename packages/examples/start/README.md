# TanStack Start + Loom

See the [setup and integration matrix](../README.md). This application demonstrates a typed server function, loader cache population, native Router/Query SSR integration, and explicit live subscriptions. Nitro builds a runnable Node 24 server.

Start with [the route](./src/routes/index.tsx), [the router](./src/router.tsx), and [the browser hooks](./src/components/notes.tsx). The server function returns typed finite data; Router's Query integration handles dehydration rather than passing an opaque cache through server-function serialization.

## Independent backend

This application owns [its contracts](./loom/contracts/examples.ts), [handlers](./loom/functions/examples.ts), [schema](./loom/schema.ts), [application config](./loom/app.config.ts), [auth config](./loom/auth.config.ts), and migrations under `loom/migrations`. It demonstrates Valibot contracts and ordinary async handlers. The frontend imports its own `loom/_generated/api`; no other example package is required.

Configure `.env.example` values for this example's own Neon preview branch and trusted issuer. This example owns database namespace `start_app`, metadata namespace `loom_start`, runtime role `loom_start_runtime`, and deployment `start-preview`; it can coexist with the other examples without sharing tables or replacing their releases. Allow `http://localhost:3001` in `APP_ORIGINS`.

From this directory:

```sh
bun run generate
bun run deploy
# Set LOOM_SERVICE_URL to this deployment's URL, then:
bun run build
PORT=3001 bun run start
```

Keep `NEON_*` and `APP_ORIGINS` values consistent for deployment and build. `bun run dev` regenerates this app's client before starting the frontend. `bun run dev:backend` starts the Loom development workflow independently.
