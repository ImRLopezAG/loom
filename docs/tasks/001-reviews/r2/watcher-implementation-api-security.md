# Watcher correction R2: independent implementation/API/security review

Verdict: **APPROVED FOR SOURCE ONLY**.

Reviewer: independent gpt-6-astra, low effort. Base and HEAD: `5dc3a8f8adf96cc315af45a5ac8f6c6f9577d4b2`; reviewed the current working-tree corrections, including the three untracked test files, against that frozen base. No actionable source finding retained. This is bounded correction review, not full-feature acceptance or merge approval.

## Authority and evidence

Read worktree `CLAUDE.md`, `/Users/angel/dev/loom/AGENTS.md`, plan `docs/plans/001-operational-visibility.md`, R1 `review.json`, `validator-verdicts.json`, and `watcher-worker.md`, including the host response. Applied the code-review criteria as an assigned leaf; no delegation or full-review rerun. The original ten-lens R1 remains frozen and is not missing reviewers.

Only source, installed declarations, git diffs, and file hashes were inspected. No tests, typecheck, lint, formatter, build, browser, server, database, collector, reproduction, or application execution occurred. No source edits. The sole written path is this receipt.

## Findings and contract assessment

- R1 P1 is addressed in source: `cli.ts:362-365` canonicalizes the parent before exclusive creation and forwards the single owned path through private command/project/development helpers. `watcher.ts:41-48` resolves both the watch root and owned file, then compares the event's resolved path before `coordinator.invalidate()`. Root aliases resolve consistently. There is no basename or directory exclusion. Missing/empty filenames still conservatively invalidate; generated, staging, migration-ownership, and existing directory filters remain intact.
- Public wrappers retain their parameters/defaults and returned contracts. `DiagnosticsOptions`, `DevelopmentOptions`, coordinator options, package export map, and tooling barrel are not widened. The new helpers are source-internal and not barrel exports. The extracted development update callback preserves its generation, cancellation, synchronization, activation, retirement, and cleanup logic.
- File creation still uses `wx` and mode `0600`; existing files and final-component symlinks are not followed for overwrite. Parent resolution/open errors return the fixed unavailable error before starting development. Explicit user-selected paths outside the project remain possible as before; no new root-confinement policy is invented. Startup failures after opening unwind through the CLI finally and command cleanup. No path or credential is added to diagnostic records or error text.
- The CLI's `createFileOutput` and command's `closeOwnedFile` both import the same source output module. There is no added global ownership map and no source/public duplicate lookup for that writer. Public `startDiagnostics` consumes the writer but does not own that private map. The unit fixture deliberately maps public session startup to the same source session used for its replacement-owner assertion.
- Cleanup production ordering is unchanged: development stop, diagnostics stop and owned-file close, then removal of both signal handlers. Original work errors win over stop errors; cleanup-only errors surface. The strict shared diagnostics deadline remains 2000 ms. No mapping, cardinality, projection, hostile-payload, FIFO, reentrant writer, or Promise-observation code is changed by this scope.
- No added suppression, skip, stubbed success path, configuration change, weakened existing assertion, or increased existing deadline was found in these eight paths. Management-provider substitution in the new native fixture is explicit and limited to discovery/credentials; it is not a substitute for PostgreSQL, watcher, runtime, RPC, or sink execution.

## Inspected test evidence (not executed)

- `diagnostics-watcher.test.ts` uses the real file output adapter and recursive watcher, a symlinked root, preparation/activation, continuous 10 ms event publication, a bytes-written check, and a preparation-count assertion after 250 ms. It checks source activation while publication continues, and independently requires preparation for a sibling output file, another directory's same basename, and a new directory within the output directory. Sequence continuity and output failure counts are asserted.
- `diagnostics-cli-native.test.ts` invokes real source `runCli` in a child. Source `target.ts` resolves the mocked management API factory; actual PostgreSQL synchronization/runtime and native RPC remain in the composed path. A continuous coordinator-event timer surrounds failed-edit/recovery. Assertions require the old generation to keep serving, the recovered version to serve changed results at the same URL, one failure report, exact final three RPC records, contiguous sequences, child exit zero, subscriber removal, and restored signal listener counts. Intermediate byte-growth checks alone are not treated as proof of every timer tick; combined watcher regression and native execution remain queued.
- `diagnostics-dev-command.test.ts` covers cleanup-only and double-failure cases under both SIGINT and SIGTERM. It checks exact error identity, one stop call, both listener counts, both channel subscriptions, actual closed-handle rejection, replacement session ownership, and absence of a false stopped report. Its command startup is mocked intentionally for deterministic stop rejection; this is not native runtime evidence.
- Existing `dev-runtime.test.ts` and `dev-watcher.test.ts` are unchanged against the base. Existing `dev-cli.test.ts` retains exclusive-file/symlink/missing-parent refusal, mode 0600, pre-config rejection, and startup unwind assertions. Public consumer coverage remains separate from the new source helper fixtures.
- Inspected installed `@types/node` 24.19.0 `fs.d.ts` watcher overloads and nullable filename contract, plus repository native watcher tests. These declarations do not establish OS/Bun event-delivery behavior. No claim of inspecting Bun's native implementation or of measured event delivery is made.

## Pending gates

Root must execute the new cleanup unit and watcher/native CLI fixtures, retained CLI/public watcher/runtime regressions, and applicable package/test typechecks, lint, canonical formatting with AST preservation, and build gates after the queued grant. Preserve original 492-unit/native25/packed2/browser6 and U5 exact68 collector receipts as historical evidence, not fresh acceptance. Reconfirm public declarations/packed behavior after build. Privacy R3 and shutdown R2 have separate ownership and verdicts. Full final implementation/API/security review after canonicalization and integrated verification is still required.

## Reviewed SHA-256 content pins

```text
0c55c70fd18c125ce3854e31ed44fb137d4504cae39683384928dc0639858b44  apps/loom/src/cli.ts
6ca2bc712a24acb601a0f924474fe756eedb37fca9782d5b7204ddfb5357113d  apps/loom/src/commands/dev.ts
eb06e32e0ea1cb8fad4fd97104ac10705bb44f86ce9f52a7518c75d5b6188e67  apps/loom/src/tooling/dev/project.ts
59b4cc942f65c85f1af906ea9c78ba7261c1260fc72cbcb1f50ed3c0f3de16f2  apps/loom/src/tooling/dev/development.ts
585710b831ef4f9cac7c435c29e05926a8bc61098619180fe7d820aec703c479  apps/loom/src/tooling/dev/watcher.ts
7b5428dba988e5a0ce2c8853d06205190c812ac729fa587475378dda26ddf7d8  packages/e2e/integration/diagnostics-watcher.test.ts
5548c5ae61e4b7dfecf34cadfc9463cce1f6fe56132af03b20b04e1832994648  packages/e2e/integration/diagnostics-cli-native.test.ts
2a9697b816bf1d02c8c889e1325de06bb97da6a301800572af270b0a2c5ed847  packages/tests/unit/diagnostics-dev-command.test.ts
```
