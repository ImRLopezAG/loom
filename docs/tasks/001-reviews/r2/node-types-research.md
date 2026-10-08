# Installed declaration research

Read-only Luna result, retained as a candidate diagnosis rather than acceptance:

## Diagnosis

The failure comes from declaration selection for the source file imported by the new test—not from the watcher implementation.

`packages/tests` extends the shared Bun config, which sets `"types": ["bun"]` and `"moduleResolution": "Bundler"`. Its test imports app source directly, so TypeScript checks `apps/loom/src/tooling/dev/watcher.ts` under the tests project’s config.

The installed declarations show why that matters:

- In `@types/node` 24.19.0, `FSWatcher` extends `EventEmitter`, so it has `.once()` and `.on()`.
- In 26.6.2, `FSWatcher` extends `InternalEventEmitter<FSWatcherEventMap>` instead. That interface supplies the watcher methods (`close`, `ref`, `unref`) but not `.once()` or `.on()`.
- Bun 1.4.2’s type entry references `node` types. The lockfile includes Node 24.19.0 and nested 26.6.2 copies. `packages/tests` declares `@types/bun` but not `@types/node`; the app package declares Node 24.19.0 directly.

The unresolved point is which Node declaration file TypeScript resolves for `node:fs` in this import context. The evidence available here is the checker’s error plus the declaration mismatch; I did not run TypeScript’s resolution trace, as requested. The result is consistent with `node:fs` resolving to the 26.6.2 shape, where the watcher event methods are absent. The implicit-`any` error on `cause` follows from `.on("error", ...)` having no matching typed overload.

## Candidate bounded fix

Make the test package’s Node type dependency explicit and align it with the app’s pinned `@types/node@24.19.0`, so the source-importing test checks app code against the intended Node declaration set. This is a narrow test-workspace dependency fix: it avoids casts, suppressions, config weakening, public API changes, and watcher replacement. It does not upgrade Bun or broadly upgrade Node types.

Impact: the test package gains an explicit Node type dependency, and the installed declaration resolution should stop selecting the incompatible nested 26.6.2 watcher shape. The host should confirm the exact resolved `node:fs` path in its reproduction before applying this candidate.

No files were changed, and no tests, builds, or typechecks were run.

## Host correction and actual evidence

The statement that Node 26's internal emitter intrinsically lacks `on` and `once` is incorrect. Installed Node 26 `events.d.ts:820-834` defines them. The red is caused by mixed declaration families: Node 26 `node:fs` references `InternalEventEmitter`, while Node 24 aliases `node:events` to `events` without that internal interface. TypeScript resolution logs show Node 24 and Node 26 type references entering the same program through application declarations and transitive Bun/pg references.

Actual unit typecheck R1 is red; adding direct exact `@types/node@24.19.0` to the unit test package makes R2 green and selects primary Node 24. Original rootcheck R2 then exposes the same failure in the separate e2e package; its trace is retained independently. No watcher implementation or tsconfig correction is proposed. Fresh independent source/log review and the original complete canonical run remain required.
