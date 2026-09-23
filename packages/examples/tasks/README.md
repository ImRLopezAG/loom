# Loom tasks

A React application with projects, tasks, verified sessions and live queries. Each person owns a separate workspace. Open two windows as Alice to see committed changes arrive without refreshing; Bob cannot see Alice's projects.

From the repository root:

```sh
bun install --frozen-lockfile
bun run build
```

Start a local PostgreSQL 18 instance if you do not already have one:

```sh
docker run --name loom-tasks-postgres -e POSTGRES_PASSWORD=local-example-only -p 127.0.0.1:54329:5432 -d postgres:18
```

Then start the application:

```sh
LOOM_LOCAL_DATABASE_URL=postgresql://postgres:local-example-only@127.0.0.1:54329/postgres bun run --cwd packages/examples/tasks dev
```

Visit `http://127.0.0.1:5173`. The launcher prints the exact database name, so you can inspect it with a PostgreSQL client. Stop with Ctrl-C. Each launch creates its own database and restricted runtime role, applies the committed migration, and removes both on shutdown. Your connection must be local and able to create databases and roles. Restart after editing source; this launcher builds the frontend with Vite+ and generates typed references before serving it.

Alice and Bob are local demonstration identities. The launcher generates an ephemeral ES256 key, signs audience-bound tokens, and verifies them with Loom's JWT verifier. Session issuance requires the frontend's exact origin. Both HTTP servers bind to loopback. This launcher is not a production authentication or deployment entry point; configure your trusted identity provider and Loom deployment for those environments. The React client stores its session only in memory.

Run the real database browser check from the repository root:

```sh
LOOM_TEST_DATABASE_URL=postgresql://postgres:local-example-only@127.0.0.1:54329/postgres bun run test:browser
```

The test creates isolated databases, uses two browser clients, disconnects one, commits a change through the other, and verifies recovery and identity separation. Browser tests require Playwright's Chromium installation.

The example currently consumes workspace packages. Installation from release tarballs and provider deployment acceptance are tracked separately; the commands above do not claim those paths.
