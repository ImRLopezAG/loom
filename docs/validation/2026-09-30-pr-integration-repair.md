# PR #1 clean-install and integration repair

The full framework branch passed the root check, but GitHub's clean checkout exposed a missing CLI executable and ten integration failures. This receipt covers the repair following `410a70f`, not a new production certification.

## Repairs

- Keep the committed `bin/loom.js` launcher available before compilation so Bun links the workspace executable on a fresh install.
- Preserve committed migrations while removing generated build outputs in CI. Moving the migrations removed build inputs, invalidated the cache, and left example databases without their history.
- Update tasks fixtures for the accepted four-table schema and its two migrations. Give local search runtimes explicit branch bindings and fixture-only cursor signing keys.
- Export the search projection types needed to emit portable declarations for external component packages. No projection generics or native option APIs change.
- Await bounded cancellation cleanup before the aborted invocation finishes. Existing transaction, Effect, and server-observed cancellation assertions remain intact.
- Register optional Better Auth initialization and schema resolution through its explicit component entry point. Applications without custom auth no longer pull its optional adapters into Function bundles.
- Declare the managed Neon Auth SDK as a pinned runtime dependency. Its peer installation can add React; the packed backend test removes React from its disposable consumer before importing the server, client, and contract exports.
- Install the packed component webhook fixture independently instead of sharing workspace dependency trees. This prevents duplicate application-brand registries and exercises the real consumer package.
- Run Node compatibility tests through `loom/...` exports and update the browser anchor assertion to the current quickstart heading.

## Verification

- `bun run check`: all 20 tasks passed, including 344 unit tests, build, typecheck, formatter, and lint. Lint reports one existing test warning.
- Fresh frozen install, build, and cache restoration: all eight builds restored from cache; committed migrations remained byte-for-byte unchanged.
- `bun run test:integration`: 240 passed, two skipped, zero failed across 119 files, with 2,105 assertions against isolated PostgreSQL 18.
- `bun run test:browser`: all 14 passed across 11 files, with 126 assertions covering SSR, client-only queries, live updates, uploads, packed consumers, and documentation navigation.

The schema-only baseline and pooler tests were skipped in this local run because their separate fixtures were absent. These skips are not passes. Existing Neon receipts retain their recorded provider scope; this repair does not repeat live provider acceptance or close the hosted multi-cookie gap. GitHub CI results are attached to PR #1 separately from these local checks.

## Review

The repair received a sequential inline correctness, security, API, testing, standards, and simplicity review under the supplied AGENTS tool mapping. No unresolved findings remain in this bounded diff. This is not an independent review of every earlier framework change.

The review checked cancellation ownership and bounded cleanup, per-generation auth instance isolation, explicit component identity, migration/runtime authority separation, raw webhook signature verification, portable public types, and consumer isolation. No production validators, authorization checks, retries, or native TanStack option semantics were relaxed to make the tests pass.
