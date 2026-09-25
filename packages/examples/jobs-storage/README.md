# Upload catalog

Upload files to **Neon Object Storage** and process their verified metadata through durable jobs running on Neon Functions. Postgres stores ownership, upload state and job records; file bytes live in private Neon buckets.

`loom/storage.ts` declares three buckets:

- `uploads`: processing succeeds on the first attempt.
- `retry-demo`: processing deliberately fails once, then succeeds.
- `failure-demo`: processing deliberately fails all three attempts.

The browser uploads directly to a signed Neon URL. Loom verifies the object's size, type and SHA-256, seals the verified object, and handles Neon's object-created event. Authorized downloads use short-lived signed URLs. The catalog summarizes metadata; it does not inspect file contents. Queue status uses authorized polling because framework job state does not invalidate application queries.

## Configure Neon

This application uses Neon PostgreSQL, Neon Functions and Neon Auth. Its configuration is `loom.config.ts`; secret values belong in `.env`, following `.env.example`. The existing project named **loom** is `late-moon-69483649`. Select a separate development or preview branch with `NEON_BRANCH_ID`.

Use distinct migration and restricted application database credentials. Enable Neon Auth on the selected branch, allow your frontend origin, and set `VITE_NEON_AUTH_URL` to its Auth base URL. `VITE_LOOM_URL` is the service invocation URL returned by deployment. Only public addresses use the `VITE_` prefix.

From the repository root, install and build the framework:

```sh
bun install --frozen-lockfile
bun run build
```

From this example directory:

```sh
cp .env.example .env
# Fill the connection credentials and branch-specific addresses.
bun run generate
bunx loom migrations apply --runtime-role loom_runtime
bun run deploy
# Set VITE_LOOM_URL to the returned service invocation URL.
bun run dev:frontend
```

The migration command creates the restricted role if needed; provision its login credential through Neon and put that connection string in `LOOM_DATABASE_URL` before deploying. Set `LOOM_ACTIVATION_TOKEN` to a random 64-character hexadecimal secret. `loom deploy` reads the deployment configuration and committed migration history, deploys the service and worker to Neon, checks their health, and activates the release. Deployment requires `NEON_API_KEY` in the CLI environment; it is never passed to the application runtime.

Sign up or sign in with Neon Auth in the frontend. `bun run dev` runs the framework development server against the configured Neon development branch; `bun run dev:frontend` runs Vite+. `loom/app.config.ts` defines the application and named RPC builders; `loom/auth.config.ts` defines authentication policy. Every router in `loom/functions` implements its native contract from `loom/contracts` using typed builders from `../_generated/rpc`. Streaming outputs are declared with `eventIterator`; their handlers use `context.live` for fresh, authorized database snapshots. The frontend creates its native oRPC client with `_generated/api.createClient` and uses native `queryOptions`, `mutationOptions` and `liveOptions` through `createTanstackQueryUtils`. `loom/migrations` is committed history. `_generated` contains stable current imports; disposable runtime artifacts live under `.loom`.

## Acceptance tests

Provider acceptance lives in `packages/e2e/cloud`. The tasks/storage suite exercises actual Neon Functions and storage using controlled test identities. The separate Neon Auth suite exercises the normal signup/sign-in frontend with real Neon Auth. Local database, session and object-store implementations live only in `packages/e2e/fixtures` for isolated regression tests; they are not the application runtime.

For `loom dev`, set `NEON_DEVELOPMENT_BRANCH_ID` to a distinct disposable branch and use its runtime credentials and Auth URL. Development schema synchronization refuses preview and production targets. For deployment, restore the selected preview branch credentials and Auth URL.
