# Components example

This example mounts a local journal component and exposes selected operations through the application's authenticated router. Component contracts and private internals retain their own generated types. The browser uses the generated public client and native oRPC query, mutation, and explicit streaming options.

The `recipes/` directory contains independent SDK-only definitions for WorkOS, Clerk, and Auth0. They are not mounted by the demo, require no dummy schema or contract, and make no provider calls during generation. Copy the selected definition to `loom/components/<provider>/setup.ts` and explicitly mount it with `app.use`. Bind alternate credentials through declared `app.env` references, as shown in the SDK services documentation.

Recipes target Node 24 and pin `@workos-inc/node` 11.0.0, `@clerk/backend` 3.21.1, and `auth0` 7.3.0. `recipes/sdk-types.ts` checks native method signatures without invoking its function. It is not an integration wrapper or a live provider test. WorkOS retries are explicitly disabled in its recipe; other SDK behavior remains owned by the provider.

Configure the demo's public connection settings from `.env.example` for your own Loom backend and Neon Auth project. Use the repository's normal generation and example scripts. No provider credentials are needed to typecheck the independent recipes.

SDK initialization does not verify incoming bearer tokens or establish browser sessions. Keep authentication in Loom's existing auth integration and authorize provider IDs before using a service. Never store caller identity on a shared SDK object or import server setup files into a browser bundle.

Optional synchronization should exist only for a concrete local query or join. Verify bounded original webhook bytes before parsing; deduplicate provider event IDs transactionally with the projection update. Local signed webhook fixtures exercise Loom's boundary, not provider signature certification. Live provider-account checks and deployed acceptance are separate from local typechecks and browser tests.
