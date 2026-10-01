# Mounting a component during `loom dev`

The real Neon acceptance test passed: 1 test, 0 failures, 80.92 seconds. It runs a packed Loom CLI consumer against a disposable branch of project `late-moon-69483649`, with no manual generation or synchronization calls between edits.

## Defect found and fixed

The original watcher ignored `_generated` but observed component codegen's sibling `_generated.staging-<UUID>` and `_generated.previous-<UUID>` directories. Generation repeatedly invalidated its own revision before database synchronization. The CLI stayed alive without reporting an update failure, but the new component never became ready.

The original implementation failed the live mount scenario. A separate diagnostic on Neon recorded more than 800 events of each temporary-directory kind. A focused regression also failed before the fix: it observed two updates when only the initial update was expected. The watcher now ignores these exact generated directory patterns while continuing to observe source and `_generated/migrations` changes.

## Verified sequence

1. Start the actual packaged `loom dev` CLI with no component mounted.
2. Compile a generated-client check proving the component endpoint does not exist yet.
3. Create the component files and save `app.use(notes, ...)` while the same CLI process is running.
4. Wait for a new ready version; verify the mounted namespace and table in Neon.
5. Use the generated native HTTP client with a valid test JWT to insert a row; verify that row directly in PostgreSQL.
6. Compile positive and negative TypeScript 7 checks for the new endpoint, input, and output.
7. Save an additive component schema change; verify the new column and preserved row.
8. Save a function edit; verify the generated client receives the new behavior.
9. Stop the CLI, edit schema and function source again, and verify the generated version/types and database remain unchanged and the listener is closed.

The test issuer deploys only a public verification key to the disposable branch. The signing key stays in memory and the short-lived token is passed through the invocation subprocess environment. This is an authenticated client test, not Clerk, WorkOS, or Auth0 acceptance.

## Evidence and limits

- [Acceptance test](../../packages/e2e/cloud/dev-component-watch.test.ts)
- [Watcher regressions](../../packages/e2e/integration/dev-watcher.test.ts): 3 passed, 0 failed.
- [Redacted Neon receipt](2026-09-27-dev-component-watch.json): all eight checks passed; cleanup succeeded.
- Workspace typecheck/build: 18 tasks passed. E2E TypeScript 7 and root Oxlint passed. Changed-file formatting and whitespace checks passed.
- Focused code review completed with correctness and an independent adversarial read, including the ignore rule and credential/cleanup handling; no actionable findings. Receipt: `/tmp/compound-engineering-501/ce-code-review/dev-watch-fix-focused-20260928/review.json`. This was a same-family local review, not an external cross-model review.
- Three simplification reviews completed. Applied `dirname` reuse and removed an unused subprocess parameter. Kept the small repeated typecheck command and bounded-test log parsing instead of adding abstractions.
- Two fixture issues were corrected during testing: an invalid metadata namespace prefix and a missing generated-client authentication token. Neither required changing production authentication.
- Final provider inventory contained only the original `main` branch, `br-solitary-sun-aw6tznuf`. Disposable branches, including failed diagnostic runs, were deleted.

This verifies local development functions against real Neon PostgreSQL, not automatic redeployment of hosted Neon Functions on every save. It does not cover live unmount/remount with outstanding jobs. The whole test suite was not rerun; verification targeted the watcher change and its complete cloud path.

Run after building Loom:

```sh
LOOM_CLOUD_DEV_COMPONENT_WATCH=1 \
LOOM_CLOUD_PROJECT_ID=<project-id> \
LOOM_CLOUD_DEV_WATCH_RECEIPT=/tmp/loom-dev-watch.json \
bun test packages/e2e/cloud/dev-component-watch.test.ts
```

For operational verification, `loom dev` should emit a new ready version after a component mount and remain stable without further edits. Repeated generation without a ready event indicates a regression. The local watcher test guards the temporary-directory exclusion; the opt-in Neon test validates the assembled CLI path. No production deployment was performed.
