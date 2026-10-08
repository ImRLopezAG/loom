# Watcher correction: worker receipt and host response

Task: `node:delegated-task:command%3Amcp%3A583aba27-23ff-4583-add7-a3bb37e882cc%3Adelegate-task%3A001-r1-fix-watcher-v1`

Source-only implementation complete for finding #1 and the cleanup-command gap.

Changed paths:

- `apps/loom/src/cli.ts`
- `apps/loom/src/commands/dev.ts`
- `apps/loom/src/tooling/dev/{project,development,watcher}.ts`
- New `packages/e2e/integration/diagnostics-watcher.test.ts`
- Additive `packages/e2e/integration/dev-runtime.test.ts`
- New `packages/tests/unit/diagnostics-dev-command.test.ts`

The CLI now forwards one canonical `ownedOutputPath: string` through source-internal helpers. The watcher excludes only that exact file before invalidation. Public signatures/types, `DiagnosticsOptions`, generated-artifact filters, and conservative missing-filename handling remain unchanged.

Authored coverage includes continuous real file-sink writes, symlinked-root activation, sibling/same-basename/directory observation, actual CLI failed-edit recovery with native RPC once-accounting, and both shutdown-error precedence cases under both signals. The native fixture substitutes management discovery/credentials; PostgreSQL, watcher, runtime, RPC, and output remain real.

Evidence is source inspection and scoped diff review only. Original fixtures, assertions, deadlines, and unrelated edits were preserved. No execution, staging, commit, or publication occurred.

Pending root gates: tests/native PG18 execution, typecheck, lint/formatting AST/build, retained consumer/browser/collector gates as applicable, and full implementation/API/security reviews. No fresh acceptance or red/green result is claimed.

`plan_path: docs/plans/001-operational-visibility.md`; `u_ids_attempted: [U3]`; `u_ids_completed: []`; `behavior_change: true`; `standalone_shipping_skipped: true`. Native inline route; no delegated run, fallback, checkpoint, or settled-decision conflict. Verification deliberately deferred under the source-only grant.

## Host source response before independent review

Moved only the newly added native CLI fixture and its source imports from dev-runtime.test.ts into diagnostics-cli-native.test.ts. The existing dev-runtime file is byte-identical to HEAD, preserving the public-consumer/source boundary. All new fixture assertions and deadlines were retained. Fixed the cleanup-unit replacement session to supply a valid text sink; an empty options object would fail DIAGNOSTICS_SINK_REQUIRED rather than test owner release. No execution occurred.
