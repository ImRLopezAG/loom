# Single live query and reactive authentication examples

Next.js now uses one native useQuery subscription for notes. TanStack Start
uses one native useSuspenseQuery subscription inside a Suspense boundary.
Neither browser also requests the finite notes endpoint or invalidates its
cache after a mutation. The finite endpoint remains for optional server
rendering.

Sign-in and sign-out rely on the Neon SDK session notifications instead of
full-page navigation. The Neon binding accepts loadingFallback for client
session initialization and connection setup, independently of the signed-out
fallback and SSR fallback.

## Verification

- 16 focused tests passed across Neon bindings/token retrieval, auth provider,
  auth lifecycle, and server sessions.
- Both production browser scenarios passed: 46 assertions covering login and
  logout without document replacement, initial live results, subsequent
  updates, account isolation, optional bearer SSR, and token-free HTML.
- WebSocket frame assertions verify that watch is called and the finite notes
  endpoint is not called by the browser.
- Start's browser scenario exercises the native Suspense live query through
  its first result and later updates.
- Both production builds and the example, tests, and e2e typechecks passed.
- Repository lint passed.

## Inline review

Reviewed reuse, simplicity, efficiency, correctness, and authentication/cache
boundaries in the main thread per workspace instructions. No independent
review agents were used.

Removed a redundant data-availability branch from the Suspense example.
Changed Start's route error fallback so it does not remount the same failing
query. Kept provider-owned token/session validation and per-session cache
isolation intact. No new retry or automatic mutation replay policy was added.

These tests use the local HTTPS protocol fixture and PostgreSQL. They do not
resolve the separately recorded managed Neon Functions cookie-delivery issue
or complete the uncommitted hosted-auth server work.
