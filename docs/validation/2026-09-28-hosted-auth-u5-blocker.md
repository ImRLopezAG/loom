# Hosted managed auth acceptance: blocked by duplicate-cookie loss

Plan: `docs/plans/2026-09-28-1642-feat-loom-hosted-auth-better-auth-plugins-plan.md`, U5 and U8. U5 is not complete.

## Observed on an actual Neon Function

Project `late-moon-69483649`; disposable schema-only branch `br-withered-sound-awvacv2m`, named `loom-acceptance-auth-20260928`; Node.js 24; bundle built with pinned `@neon/config-runtime@1.6.3`. Each final run uses a fresh Function slug. The probe response carries a random revision header; the test verifies that exact revision before inspecting cookies.

This response bypasses Loom routing and all auth SDKs:

```ts
return new Response(null, {
  headers: [
    ["set-cookie", "__Secure-first=one; Path=/; Secure; HttpOnly"],
    ["set-cookie", "__Secure-second=two; Path=/; Secure; HttpOnly"],
  ],
});
```

The remote caller receives only `__Secure-second`. Reproduced with Fetch and independently with Node's `https.get`, inspecting `IncomingMessage.headers["set-cookie"]`. The Node check failed in 15.97 seconds after verifying the new deployment revision. This is not explained by browser third-party-cookie rules, SDK cookie parsing, or Bun Fetch parsing. The exact failing provider layer is not identified.

The managed integration also reproduced the consequence: signup returns 200 and creates a user; inside the Function, the outgoing Response contains both Neon's session-token cookie and its local session-data cookie. Only the latter reaches the caller. The next `get-session` returns null. Protected RPC and sign-out acceptance therefore cannot be reached honestly.

Regression: `packages/e2e/cloud/hosted-auth.test.ts`. It deliberately asserts preservation of both cookies before running the full auth flow; it is not skipped after deployment or converted into an expected-failure success. Invoke with `LOOM_CLOUD_HOSTED_AUTH=1`, the above project/branch variables, and a securely supplied `LOOM_TEST_DATABASE_URL`. The test requires an unprotected acceptance branch and checks that the connection belongs to that branch endpoint. Function, temporary metadata schema, runtime role, and local bundle directory are removed in `finally`.

## Implemented locally, not accepted as hosted behavior

- Managed server mounting resolves only server-declared Neon trust and branch-local environment. A mismatched branch endpoint or missing cookie secret rejects startup.
- Public Neon SDK response primitives own cookie serialization/signing. The request transport forwards cancellation and uses manual redirects because the pinned SDK's request helper does not provide those controls.
- Origin admission happens before proxying. Forwarding headers are excluded. CORS preserves the SDK JWT headers, existing plugin exposure headers, and Vary.
- Tests cover hostile origins, cancellation, redirect preservation, branch mismatch, required secrets, and cookie attributes. No upstream package patch was introduced.
- Typecheck/build: 18 tasks passed. Unit suite: 292 tests passed. Oxlint passed after fixing the reported conditional spreads and broad object parameter.

Sequential correctness/security/reuse/quality/efficiency inspection was performed inline under the user's AGENTS mapping. This is not the final standalone code-review receipt. The managed implementation remains uncommitted pending successful hosted acceptance and example migration.

## Consequences and remaining work

The accepted architecture requires Functions to preserve native plugin responses. Concatenating Set-Cookie values, dropping cookies, or exposing cookie secrets/tokens to JavaScript would not satisfy that contract. No such workaround was adopted. A provider fix or documented response mechanism that preserves multiple cookies must pass the regression before U5/U8 can be accepted.

U4 still needs OAuth, multiple mounted instances, native key rotation through hosted requests, and deployed native JWT/RPC acceptance. U6 example/provider/SSR migration remains open. U7 still needs the rest of the configuration/ownership/upgrade matrix. The final packed-consumer/browser/security review is open. Better Inbox remains test-only, not a shipped Loom integration.

The disposable branch is retained for continuing acceptance; it must be deleted when this implementation run finishes. No test Function is intentionally retained. No credentials or session values are included here.

## Preservation commit on 2026-09-30

The user explicitly authorized committing the existing managed-auth changes before search runtime edits. This preservation commit includes the mount, runtime binding, unit tests, and hosted regression. Six focused auth tests, library and e2e typechecks, scoped Oxlint, and formatting checks passed. Correctness, security, and simplicity were inspected sequentially in the main thread. Hosted cookie acceptance was not rerun and remains unresolved; committing this work does not mark the auth plan complete.
