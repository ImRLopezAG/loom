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

## Live SSR and browser acceptance follow-up

The packed artifact SHA-256 `725e615197f4a5da2b179398a6656a90a93cfd80674f0d7f3bda988bb74b986d` ran independent Next and Start production builds against owned project `spring-glade-05131505`, branch `br-sparkling-unit-b59pt3r5`. Next release `f52162ef8eadb44a7e524f585cc20bf3e07a149c5367fd24d59498c021a2b66e` and Start release `ba162e3f55071b88e65326b6e3ccbf12e974208c9b026f53c5b528c29d330466` each passed six authenticated HTTP responses across two principals plus an anonymous response. Assertions checked private/no-store cache policy, each user's protected content in HTML before hydration, and absence of the other user's content. Run records retain timings; there is no comparative performance claim.

T3 browser checks passed authentication, connected live queries, writing a note and observing it, and sign-out clearing content in both examples. Next also passed switching to the second account without retaining the first account's note. The applications used distinct schemas and showed distinct records despite sharing the test Auth service. The packed four-example build test also passed a browser-bundle scan for a server-only cookie-secret sentinel.

Acceptance found two real integration defects: the server SDK returns an opaque session token, and its browser proxy can return that opaque token without the JWT response header. Server helpers now request the signed JWT through the SDK token method. The pinned browser SDK's token method itself throws before fetching because its token hook is absent, so the proxy adapter fetches the official `/api/auth/token` route with same-origin credentials. The official Neon server handler still owns cookie verification and refresh; Loom adds no session cryptography or custom session endpoint. Direct Neon browser SDK mode retains its signed session JWT path.

Regression tests use the actual pinned SDK with an HTTP fixture, checking signed-token selection, wrong user/session rejection, upstream failure, and malformed token responses. Inline correctness/security/API review checked that the proxy request stays same-origin, credentials never enter hydration, and stale sessions cannot reuse the provider connection. Simplification moved the duplicated server-token retrieval into one internal helper while keeping the browser SDK distinction explicit. These reviews were performed inline, not independently.

The final source also replaces the proxy response's manual type checks with a Valibot boundary parser; that parser change follows the live artifact above. Remaining overall-plan gates include normal CLI-managed deployment credentials and the remaining branch/lifecycle acceptance matrix. External auth variants remain explicitly deferred.
