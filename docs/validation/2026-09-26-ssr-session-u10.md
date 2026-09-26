# U10 request-scoped SSR integration

`loom/next/server` and `loom/start/server` now compose the pinned official Neon Auth SDK with `withLoomServerSession`. Auth configuration resolves from server environment at request time. Thin `/api/auth/*` routes delegate cookies, signing and refresh to the SDK. The Next and Start examples removed their copied session bridge and token-paste UI; their independent contracts, schemas and native oRPC options remain.

Each request creates its own connection, QueryClient and random cache prefix, verifies the token on Loom, then allows application prefetch. Anonymous requests return null. Callback errors, completion and cancellation tear down the connection/cache. Start sets private/no-store and Vary: Cookie; Next uses a dynamic page and the SDK's request cookie context. There is no module-global authenticated client/cache.

Hydration uses oRPC's native value serializer inside a framework-serializable string, preserving dates and bigints. The browser verifies its identity before restoring that cache. A mismatched identity discards the server epoch. Restoration rejects foreign query prefixes, forged query hashes and mutations. An SSR-only fallback exposes the authorized server snapshot without opening browser connections during rendering.

The existing Start `/api/session` file had a user edit to use ANY; its removal was explicitly authorized. Its pre-work patch is retained in the ignored run records. Other unrelated pre-work changes remain untouched.

## Verification and inline review

Workspace builds/typechecks passed all 16 tasks, including actual Next production build and Start build. Full unit suite passed 223 tests before final storage/hydration follow-ups; focused final tests passed 10 cases. Integration suite passed 107, with 64 environment-gated skips and zero failures. Lint passed after replacing form `typeof` checks with each application's schema library and marking unbound helpers with `this: void`.

Inline correctness, security, public API, reliability and simplicity review checked per-request ownership, cancellation, hydration identity/hash checks, optional framework peers, server-only cookie secrets and native SDK/session ownership. Review found and fixed raw TanStack cache state being rejected by Start's serializable type boundary; no casts or disabled checks were used. It also prevented callback prop identity changes from unnecessarily reconnecting the provider.

This receipt does not claim live SSR response-cache or browser acceptance. Those gates continue against separate Neon deployments. Clerk, WorkOS and Auth0 variants remain deferred by user instruction.

Final local checkpoint: 225 unit tests and 16 build/typecheck tasks passed. Next and Start also built and typechecked as independent packed consumers. Manual production-server browser checks rendered both anonymous sign-in screens without console errors. This anonymous smoke check does not establish authenticated SSR isolation.
