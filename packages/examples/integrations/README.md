# Schema and Effect integrations

This is the shared Neon backend for the [SSR integration examples](../README.md). Read [the contract variants](./loom/contracts/examples.ts), [handlers](./loom/functions/examples.ts), [middleware](./loom/app.config.ts), and [type assertions](./types/client.test-d.ts).

`bun run build` generates the browser and server clients without database credentials. `bun run typecheck` checks the handlers and negative client type assertions. Configure your preview Neon branch and trusted issuer before `bun run deploy`.
