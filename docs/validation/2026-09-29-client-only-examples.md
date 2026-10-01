# Client-only framework examples

Added /client to the existing Next.js and TanStack Start examples, reusing each
application's own notes panel and backend. Next dynamically loads the panel
with ssr: false; Start disables SSR on the route. Neither route imports the
server auth helper, runs a loader, prefetches queries, or supplies hydration.
The public framework document shell is still served normally.

Next demonstrates a regular native live query; Start demonstrates a native
Suspense live query. Auth session handling stays on the browser SDK and Loom
service. WorkOS and Clerk examples were not added.

## Validation and review

- Both production builds and framework/e2e typechecks passed (6 Turbo tasks).
- Repository lint passed.
- Four production browser scenarios passed with 88 assertions: both root
  routes and both client-only routes.
- Client-only HTML contains neither private notes nor bearer tokens, even
  when the incoming request carries credentials.
- Login/logout preserve the document; live updates, account isolation,
  session restoration, and absence of duplicate finite notes calls passed.
- Mobile screenshots for both client-only pages were inspected; controls
  remain visible and no horizontal overflow was reported.
- Inline correctness, security, and simplicity review found no blocking
  findings. The routes reuse existing panels and do not introduce another
  auth implementation. No independent review agents were used.

Browser acceptance used local PostgreSQL and the HTTPS Neon protocol fixture.
This does not resolve the separate managed Neon hosted-cookie delivery issue.
