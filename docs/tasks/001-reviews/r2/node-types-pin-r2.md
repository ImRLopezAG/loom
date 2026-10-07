# Node types pin R2: independent source/log dependency, API and security review

**Verdict: APPROVED FOR SOURCE ONLY.** No actionable finding in the combined four-line dependency correction. This is not full canonical acceptance, final integrated review, merge approval, or permission to ship.

## Scope and retained brief

Reviewed against HEAD `5dc3a8f8adf96cc315af45a5ac8f6c6f9577d4b2` in `/Users/angel/.t3/worktrees/loom/feat-kello-001-operational-visibility`. Read the full operational-visibility plan, worktree CLAUDE, supplied AGENTS instructions, applicable root `/Users/angel/dev/loom/AGENTS.md`, original full R1 `review.json`, previous `node-types-pin.md` in full, and privacy R3, watcher R2 and shutdown R3 receipts. No worktree CodeGraph index or root AGENTS file exists. Applied code-review criteria as the assigned independent leaf, without further delegation or full-review orchestration.

The original brief remains opt-in local-process diagnostics and bounded private OTLP metrics, preserving native behavior, public compiled boundaries, privacy, finite budgets, and strict shared two-second cleanup. Bun 1.4.2, Effect 4.0.0, TypeScript 7.0.2 and Node 24 remain the target. The coordinator's explicit authorization is the narrow exception to the plan's read-only manifests/lockfile scope: add the already-existing app Node type pin to both test workspaces. No casts, suppressions, configuration changes, native API substitutions, assertion weakening or deadline relaxation are authorized.

## Exact source assessment

The entire combined diff in the three reviewed files is four additions and no deletions:

- `packages/tests/package.json:24`: exact `@types/node` devDependency `24.19.0`.
- `packages/e2e/package.json:31`: the same exact devDependency.
- `bun.lock:146,339`: matching entries in the e2e and tests workspace devDependencies.

There are no package-record, integrity, resolved-version, override, script, or other lockfile changes. The app already declares this exact version. Both private test workspaces retain their scripts, runtime dependencies, Bun types, Effect and TypeScript versions. This selects supported declarations locally rather than imposing a global dependency override. It does not remove every Node 26 package from the installed graph or certify arbitrary downstream consumers.

The previous pin receipt approved only two lines in tests/package.json and bun.lock. Its tests hash remains `ab34a291979b22546aa81bb7712ea0399b9d984634f92c123f44076aaaf1d831`; its old lock hash `5161c11c08f11a119ffb3cfba4bac6480eb146089a7724516b6fbc388cdb64f6` belongs only to that earlier scope. The new e2e addition requires this expanded receipt; the old approval is not silently extended.

No runtime, watcher, native test, tsconfig, public declaration/export or test assertion edit is part of this dependency correction. Other concurrent corrections remain present in the worktree and retain their separate reviews. The app export map still targets compiled ESM/declarations, including `kello/tooling`, with separate browser-facing entries. No new runtime dependency, executable hook, network destination, credential path, telemetry field, public option, or permission is introduced. Selecting Node 24 declarations preserves the intended native boundary; it is not runtime or packed-consumer proof.

## Resolution evidence and corrected diagnosis

All log paths below are under `docs/validation/001-remediation/`; these are host-produced evidence, not reviewer executions.

- Earlier `root-check-r1.log` and `type-resolution-r1.log` retain the genuine unit typecheck failure and mixed Node 24/26 lookup described in the previous receipt. The host reports direct unit trace R2 actual exit 0 after the tests pin. That first pin did not cover e2e.
- `root-check-r2.log:586` records 500 passing unit tests, but lines 1381-1385 record missing watcher `once`/`on`, implicit-any `cause`, and missing test watcher `once` during e2e typechecking. Lines 1401-1402 record root check exit 1. Unit green does not make this root check green.
- `e2e-type-resolution-r1.log:115362-115385` resolves the pg Node reference through fallback to 26.6.2; lines 220242-220264 show the same fallback for bun-types. This supports the same mixed-declaration diagnosis in the second workspace.
- `e2e-type-resolution-r2.log:115362-115371` resolves pg's Node reference through the direct e2e primary lookup to 24.19.0. Lines 214120-214129 show the same primary lookup for bun-types. Every successful Node type-reference resolution line in this trace selects 24.19.0 with `primary: true`; searches found neither `26.6.2` nor `error TS` in this post-pin trace. The host explicitly reports actual exit 0. The trace text itself has no exit-status footer, so process success attribution remains the host's report, separately from the inspected resolution evidence.
- Re-read installed declarations confirm Node 26 `fs.d.ts:3,359` imports and extends `InternalEventEmitter`; Node 26 `events.d.ts:820,832,834` defines it and supplies `on`/`once`. Node 24 events has no `InternalEventEmitter`, and its `fs.d.ts:368` extends EventEmitter. Thus the earlier Luna claim that Node 26 intrinsically lacks these methods is false. The evidence supports incompatible declaration generations loaded through pg/bun-types references, not removal of native watcher APIs.
- `frozen-install-r2.log` now contains Bun 1.4.2 output and “Checked 1188 installs across 1465 packages (no changes)”. The text alone supplies neither invocation flags nor a process exit footer. It is bounded install-output evidence, not assumed full canonical success. `root-check-r3.log` was still in progress at inspection (build complete, unit runner starting); no terminal root-check success is claimed.

## Retained findings, responses and remaining gates

Original full R1 remains the ten-lens review at the frozen HEAD, with P1 JSONL watcher invalidation, P2 prohibited suppressions, P2 real-clock deadline race and the command cleanup-error coverage gap retained. Watcher R2 approves its private owned-path exclusion and associated source fixtures; privacy R3 approves the Predicate replacement after its R2 objection; shutdown R3 approves the deterministic deadline correction and `.then(own)` failure-path cleanup after its R2 objection. Those are scoped source responses, not acceptance granted by this dependency review. Historical native, collector, packed, browser and U6 receipts retain their provenance; formatting R1 red and transient docs Vite limitations are not erased.

The host owns sequential canonical verification. Full canonical build/typecheck/lint/tests and applicable native, packed Bun/Node24 and browser-boundary gates, plus final integrated implementation/API/security review, remain mandatory. Neither 500 unit passes, a successful resolution trace, installation output nor this receipt replaces those gates. No fresh provider or collector acceptance is asserted.

Only this receipt was written. No test, typecheck, lint, formatter, install, build, application/runtime probe, DB, browser, server, commit or shipping operation ran. Inspection was limited to source/doc/log reads, read-only git inspection and hashing; unrelated work was preserved.

## Exact reviewed SHA-256

These three hashes were stable across the initial inspection and final pre-receipt recheck:

```text
ab34a291979b22546aa81bb7712ea0399b9d984634f92c123f44076aaaf1d831  packages/tests/package.json
3881dd0d88022d159153262df9b6c9db17adecd8e23b2c4dc17ea0d27eb24304  packages/e2e/package.json
0c8c85d6a82041ec7f1fc28d9b5466859d726e4db05d05363bc47eaef5a5ab4d  bun.lock
```
