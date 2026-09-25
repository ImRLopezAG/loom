# Loom examples

These applications use generated oRPC clients. They do not replace TanStack Query's options, cache, hydration, or mutation APIs.

| Example                        | What to examine                                                                                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [integrations](./integrations) | Standalone schema comparison backend: Zod, Valibot, mixed schemas, Effect handlers/services, Effect Schema, typed errors, finite reads and explicit live contracts     |
| [next](./next)                 | Own Zod + Effect backend, Next.js App Router, request-scoped server prefetch, React Server Components, Query hydration, browser WebSocket subscriptions                |
| [start](./start)               | Own Valibot + async-handler backend, TanStack Start loader/server function, request-scoped QueryClient, native Router SSR integration, browser WebSocket subscriptions |
| [tasks](./tasks)               | React/Vite, Neon Auth, Valibot validators, relational tasks and optimistic updates                                                                                     |
| [jobs-storage](./jobs-storage) | Neon Auth, Object Storage, durable jobs and live upload state                                                                                                          |

## Run the SSR examples

Use Node 24 and Bun 1.4.2. From the workspace root:

```sh
bun install --frozen-lockfile
bunx turbo run build --filter=@loom/example-next --filter=@loom/example-start
```

Each SSR example owns its `loom/` contracts, handlers, schema, migrations, application/auth configuration, and generated client. Neither depends on `example-integrations` or the other frontend. `build` generates the local client before building the frontend.

From the example directory, configure `loom.config.ts` / `.env.example` for **its own disposable Neon branch**, trusted issuer, runtime/migration roles, and frontend origin. Next uses `next_app` / `loom_next` and Start uses `start_app` / `loom_start`, with separate runtime roles and deployment names. Their migrations and metadata remain separate even on the same branch. Review that example's migration and run `bun run deploy` there. The preview deployment names are `next-preview` and `start-preview`.

Set that application's `LOOM_SERVICE_URL` to **its own** deployed Loom service. Keep its `NEON_*` and `APP_ORIGINS` settings consistent between generation/build and deployment, and rebuild that frontend after changing its backend: clients embed their backend version. A client from another example or a stale generation is refused.

```sh
cd packages/examples/next
LOOM_SERVICE_URL=https://YOUR-LOOM-SERVICE bun run start
# Next.js listens on http://localhost:3000
```

```sh
cd packages/examples/start
PORT=3001 LOOM_SERVICE_URL=https://YOUR-LOOM-SERVICE bun run start
# TanStack Start's Nitro Node server listens on http://localhost:3001
```

For local frontend development use `bun run dev` in either frontend, pointing at that example's deployed Neon service. The backend's `APP_ORIGINS` must include the frontend's exact origin.

The integration examples have a small **demonstration session bridge**: paste a short-lived end-user access token issued by the backend's trusted identity provider. It validates the token through Loom before setting an HttpOnly, SameSite cookie. In an application, replace this form with your identity provider's sign-in/callback flow. Never paste a Neon API key, database credential, or privileged service token. The existing tasks example demonstrates Neon Auth's sign-in UI.

SSR reads the cookie only on the server. Browser `getToken` calls the same-origin session endpoint, guarded by a custom header and the original session digest; no token appears in rendered HTML, query keys, or dehydrated data. Sign-out clears the cookie, closes the transport, clears the query cache, and reloads all connected tabs. The examples are not a complete identity-provider integration or token refresh implementation. The session endpoint deliberately makes the token available to same-origin JavaScript for direct WebSocket authentication; HttpOnly does not protect it from same-origin XSS. Behind a reverse proxy, preserve the public request origin/protocol so the session route can enforce its origin check and issue Secure cookies.

## Server and browser clients

Both factories are generated from the same required contracts:

```ts
import { createClient, createServerClient } from "./loom/_generated/api";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

// Server request: native fetch transport, no browser Origin or persistent socket.
const server = createServerClient({ url, getToken: async () => requestToken });
try {
  const rpc = createTanstackQueryUtils(server.client);
  await queryClient.fetchQuery(rpc.examples.notes.queryOptions());
} finally {
  server.dispose();
}

// Browser session: native WebSocket transport, including explicit subscriptions.
const browser = createClient({ url, getToken });
const rpc = createTanstackQueryUtils(browser.client);
// useQuery(rpc.examples.watch.liveOptions())
// useMutation(rpc.examples.add.mutationOptions())
// Dispose when this session ends.
```

The demo accepts tokens up to 3,800 characters so the cookie fits browser limits. Each page is bound to a digest of its original token; a changed token is refused by the session endpoint until the page reloads. Session changes broadcast to other open tabs. Token refresh requires a reload in this demo.

Create a new server client and QueryClient per request. Never put an authenticated server client/cache in a module singleton. Only finite reads are prefetched; live streams start after mounting and are cancelled on unmount. The SSR payloads in these examples are JSON-safe. Native RPC itself supports Date and other rich types, but adding those to dehydrated query data requires the framework's matching serialization/deserialization configuration. Do not assume JSON hydration preserves every RPC type.

## Schema and Effect variants

Next has [Zod contracts](./next/loom/contracts/examples.ts) and [Effect handlers](./next/loom/functions/examples.ts). Start has [Valibot contracts](./start/loom/contracts/examples.ts) and [async handlers](./start/loom/functions/examples.ts).

The independent schema comparison backend is useful for comparing libraries side by side. Read [contracts](./integrations/loom/contracts/examples.ts), [handlers](./integrations/loom/functions/examples.ts), and [application middleware](./integrations/loom/app.config.ts).

- `zod`: Zod input trims names before the handler, with a Zod output contract.
- `mixed`: Zod input with Valibot output and a Promise handler.
- `effect`: native `.effect(...)`, an injected `Greeting` service, and a contract-declared `REJECTED` error.
- `effectSchema`: Effect Schema adapted through `Schema.toStandardSchemaV1`.
- `notes`: generated `Database` and `Tables` Effect services; issuer-and-subject ownership filters and the latest 50 notes.
- `add`: Zod mutation input and database-backed persistence. No automatic mutation retries.
- `watch`: explicit `eventIterator(...)` contract and fresh authorized `context.live(...)` snapshots.

Standard Schema lets each boundary use its chosen library. It does **not** make a Valibot schema directly nestable inside `z.object`, or guarantee that arbitrary transforms can be represented in OpenAPI. Generated table validators remain Valibot. The table field validation example uses a Zod schema independently. Unsupported OpenAPI schema conversions fail rather than silently advertising unconstrained data.

## Verification

```sh
bun run check
LOOM_TEST_DATABASE_URL=postgresql://... bun test packages/e2e/integration/server-client.test.ts packages/e2e/integration/example-variants.test.ts
LOOM_TEST_DATABASE_URL=postgresql://... bun test packages/e2e/browser/frameworks.test.ts
```

The browser tests start each production build against its own local Loom project and disposable database, use actual PostgreSQL and authenticated Loom transports, check server-rendered data, simultaneous users, hydration, two-tab updates, ownership, sign-out and responsive layouts. Their short-lived JWT issuer and disposable local database are test fixtures only. These checks do not prove deployment to Vercel, Cloudflare, or every hosting provider. Neon-hosted acceptance is recorded separately in `docs/architecture/contract-first-execution.md` and is not a claim that these new frontend examples ran in those providers.

Upstream references: [oRPC TanStack Query and SSR](https://orpc.dev/docs/integrations/tanstack-query), [oRPC Effect](https://orpc.dev/docs/integrations/effect), [TanStack Router query hydration](https://tanstack.com/router/latest/docs/integrations/query), [TanStack Start hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting), [Next.js App Router](https://nextjs.org/docs/app).
