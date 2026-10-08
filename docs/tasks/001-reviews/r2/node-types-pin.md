# R2 Node type pin: independent implementation/API/security review

**Verdict: APPROVED FOR SOURCE ONLY.** No actionable finding in the two-line correction. This is not canonical validation, full-feature acceptance, merge approval, or permission to ship.

## Scope and authority

Reviewed current `packages/tests/package.json` and `bun.lock` against HEAD `5dc3a8f8adf96cc315af45a5ac8f6c6f9577d4b2`. The complete diff in these files is one addition each: exact `@types/node: 24.19.0` in tests devDependencies and its matching tests workspace lock entry. No package record, integrity, resolution, override, script, or other lock entry changes. The explicit current assignment authorizes this narrow manifest exception to the original plan's read-only manifest scope.

Read worktree `CLAUDE.md`, supplied AGENTS instructions, `/Users/angel/dev/loom/AGENTS.md`, original plan `docs/plans/001-operational-visibility.md`, original full R1 `review.json`, and current watcher, privacy R3, and shutdown R3 correction receipts. No worktree-root AGENTS file or CodeGraph index exists. Applied code-review criteria as the assigned independent leaf, without delegation or a new full-review run. Only this receipt was written; all concurrent edits were preserved.

## Resolution and semantics

- The existing app manifest already pins Node types 24.19.0; the tests pin matches the documented Node 24 runtime target while retaining Bun types 1.4.2, Effect 4.0.0 and TypeScript 7.0.2. Both installed workspace `@types/node` symlinks point to the same 24.19.0 package.
- `root-check-r1.log:114-116` records genuine tests typecheck failures: missing watcher `once`, missing `on`, and implicit-any `cause`. The cleanup test imports the source command, whose source project/development chain brings the watcher into the tests TypeScript program. Its source imports remain intact; the pin does not evade that coverage by switching to built declarations.
- Pre-fix `type-resolution-r1.log:120365-120388` and `261776-261798` resolve the `@types/pg` and `bun-types` Node references to 26.6.2 through fallback lookup. The same trace also contains Node 24 app/dependency resolutions. This supports the mixed declaration-generation diagnosis.
- Installed Node 26 `fs.d.ts:3,359` imports `InternalEventEmitter` from `node:events` and derives FSWatcher from it. Node 26 `events.d.ts:820,832,834` supplies that interface and its `on`/`once` methods. Node 24's events declaration has no `InternalEventEmitter`; its FSWatcher instead extends EventEmitter and explicitly declares the close/error on/once overloads (`fs.d.ts:368,403-410`). Thus the earlier claim that Node 26 intrinsically lacks on/once is false. The problem is incompatible declaration generations in one program, not removal of native watcher methods.
- Post-fix `type-resolution-r2.log:120258-120267` and `255635-255646` show those same pg and bun-types references choosing the tests workspace's direct 24.19.0 through primary lookup. Every successful Node type-reference resolution in this trace selects 24.19.0; searches find neither `26.6.2` nor `error TS`. This is inspected host trace evidence, not a typecheck performed by this reviewer, and the trace does not itself supply a recorded process exit status.
- `type-pin-install-r1.log` records Bun 1.4.2 and a saved lockfile, with 1188 installs checked across 1465 packages. Its output alone does not attest the `--offline` flag; the host reports that invocation. The actual diff establishes absence of unrelated lock churn.

## API/security assessment

The correction selects existing development declarations; it adds no runtime dependency, executable code, public export, option, native method wrapper, cast, suppression, compiler setting, or global override. Native watcher calls and error contextual typing remain governed by the supported Node 24 declarations. App exports still point to compiled ESM/declarations; the packed consumer still imports `kello/tooling`, and source helper/native fixtures retain their source imports. No native API boundary is widened and no test import is redirected to hide the watcher. No telemetry payload, permission, endpoint, ownership, cancellation, or strict deadline changes occur in this diff.

The pin is local to the tests workspace; it does not purport to remove Node 26 types from every dependency or certify arbitrary downstream consumers. Existing package records remain unchanged. Dependency selection does not establish runtime compatibility by itself.

## Evidence limits and outstanding gates

Read-only host logs report 119 focused unit passes (five test files despite six names in the invocation), two new native passes, and 28 retained native passes. These are retained log observations, not reviewer executions or proof that every requested file ran. They precede this pin and are not post-pin integrated acceptance. The original canonical root check remains a genuine red receipt.

Original R1 P1 watcher, P2 suppressions, P2 real-clock race, and cleanup-error coverage concerns retain their own source corrections and receipts; this dependency review does not close their acceptance gates. The host owns all sequential canonical checks. Full canonical build/typecheck/lint/tests, applicable public packed/Bun/Node/browser and native gates, and final integrated implementation/API/security review remain required. Existing collector/native historical evidence retains its provenance; no fresh collector or provider claim is made here.

No tests, builds, typechecks, lint, formatter, install, application execution, DB, server, browser, or runtime probes were run by this reviewer. Only source/log/document reads, git inspection, hashing, and this receipt write occurred. OS watcher delivery, runtime cleanup, native RPC, and downstream declaration acceptance were not independently exercised. Do not ship on this receipt.

## Exact SHA-256 pins

```text
ab34a291979b22546aa81bb7712ea0399b9d984634f92c123f44076aaaf1d831  packages/tests/package.json
5161c11c08f11a119ffb3cfba4bac6480eb146089a7724516b6fbc388cdb64f6  bun.lock
5f5fd49acd5b5cc0addff95d60e610d187958f6386b0db9fb12e413efd531790  docs/validation/001-remediation/type-resolution-r1.log
62d012e963dc428fcd26bc87e14908933f999b9301491fb43e54261aa98a4e9d  docs/validation/001-remediation/type-resolution-r2.log
ff9b70d7be7cd2bf044fd1472d75dfa696da5eda8db20ffcc1b37effbbe6ea1f  docs/validation/001-remediation/root-check-r1.log
585710b831ef4f9cac7c435c29e05926a8bc61098619180fe7d820aec703c479  apps/loom/src/tooling/dev/watcher.ts
fbaf3ba664822ce26f6015b673a4a1e06767b7ab71b450796cfcf12998414c27  packages/tests/unit/diagnostics-dev-command.test.ts
1049c567c0a6244b69738cdd83edce170b8d5ca941817cf185f7f55c28b3feb0  node_modules/.bun/@types+node@24.19.0/node_modules/@types/node/events.d.ts
e6a2a1eecdb48e9a9eb36d115e212664f20710530e5ec32bbea84bf36979d2c7  node_modules/.bun/@types+node@24.19.0/node_modules/@types/node/fs.d.ts
8c7e618c2a91ea7f6b5cca272a295864e92c16413be8fc56a943e8c7d5320011  node_modules/.bun/@types+node@26.6.2/node_modules/@types/node/events.d.ts
9d37b8a9678efbcdf38238b59ce8e6f7db70aba1a516f3a4a671a301dbacfb3d  node_modules/.bun/@types+node@26.6.2/node_modules/@types/node/fs.d.ts
```
