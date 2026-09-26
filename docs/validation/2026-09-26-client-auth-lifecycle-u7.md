# U7 client authentication lifecycle

Generated clients retain native oRPC options and now accept its cache prefix. The React provider assigns a fresh, private epoch, verifies the credential with the deployed server before mounting consumers, pins that verified token to its connection, and owns refresh/disposal. Consumer identity keys are no longer required. Existing optional change notifications remain supported.

The session endpoint returns a hash of deployment version and verified issuer, subject, and tenant, plus token expiry. It uses the same version, origin, authentication, timeout, and no-store boundary as RPC. It does not decode client-supplied identity claims or invoke application handlers. Existing ticket responses remain unchanged.

Identity notifications invalidate pending verification immediately. A -> B -> A cannot revive an earlier peer. Same-identity timer refresh retains the cache namespace; identity changes and failures remove only the provider's query/mutation entries. Unrelated QueryClient entries survive. HTTP and WebSocket calls reject results arriving after disposal; the lifecycle does not retry procedures.

## Verification and inline review

Workspace typecheck passed 16 tasks. Full unit suite passed 216 tests before the additional late-HTTP-response regression test; focused transport/lifecycle/HTTP/React tests include that regression. Integration suite passed 107, skipped 64 database/cloud fixtures, failed zero. Lint passed after resolving callback typing and omission patterns.

Collaborative-browser verification exercised initial connection, rerender, unmount/remount, invalidation, and identity replacement. The unrelated cache entry remained present throughout; no browser console errors appeared. Unit tests cover single-flight refresh, stale verification, logout/failure, identity scope changes, and no procedure dispatch from introspection.

Inline security/correctness review retained server-derived identity, bounded introspection responses, credential URL validation, abort checks after native results, scoped cache deletion, and hiding the initial SSR fallback after lifecycle startup. Generation ABI advanced because the generated options changed. Existing generated artifacts are not silently overwritten under the same version.

## Remaining acceptance

U7 is not fully certified by this receipt. Real Neon SDK refresh/cross-tab and deployed token tests, persisted-cache integration, expired peer recovery and mutation counts under live provider failures remain part of U8/U13. SSR hydration must explicitly match the verified session; the fallback is not itself evidence of authenticated hydration.
