# R2 privacy/API/security source review

**Verdict: REJECTED.** One actionable source-contract finding remains. This is an independent Astra-low review of the three bounded corrections against `5dc3a8f8`, not full-feature acceptance.

## Finding R2-PAS-1 — P2: schema guards execute Effect on the synchronous publisher path

- Location: `apps/loom/src/tooling/diagnostics/project.ts:23-26`, used at lines 28-30 and 119-133; reached synchronously from `session.ts:119-130`.
- Contract: `docs/plans/001-operational-visibility.md:43` (KTD2) explicitly says callbacks do no Effect execution. The prior projector used direct primitive checks.
- Pinned evidence: installed Effect is 4.0.0. `src/internal/schema/compilerRegistry.ts:37` defaults `compilerAdaptersEnabled` to false. `src/SchemaParser.ts:138-146` routes `Schema.is` through `asExit(run(ast))` in that default state; `src/SchemaParser.ts:1011-1014` implements `asExit` with `Effect.runSyncExit`. The installed `dist/SchemaParser.js` agrees. These are primitive schemas, but that does not bypass this adapter. The new module-level guards cache guard construction, not each invocation's parser/runner work. Nonmatching primitive probes additionally construct schema failure values (`SchemaAST.ts:4719-4727`), including ordinary number/boolean fields tested first with the string guard.
- Consequence: each synchronous channel projection now performs repeated Effect runner calls, contrary to the explicit hot-path contract. This is source-proven reachability under the library's default configuration, **not** a measured latency regression or an invented runtime failure. The separate use of schema guards in asynchronously drained metrics does not establish permission for this callback path. A globally enabled compiler could change the path; the projector must not depend on that unrelated global state to meet KTD2.
- Requested correction: use the installed pure `Predicate.isString`, `Predicate.isNumber`, `Predicate.isBoolean`, and `Predicate.isObjectKeyword` primitives (retain the explicit `Predicate.isFunction` exclusion), or another demonstrably runner-free primitive boundary. Preserve own-descriptor access, finite/safe-integer checks, literal allowlists, and all tests. Do not alter lint configuration, add suppressions, or enable a global schema compiler as a workaround. Re-review the resulting source and queue execution with root.

## Inspected contracts and security

- Read `CLAUDE.md`, the explicitly applicable `/Users/angel/dev/loom/AGENTS.md`, the plan/provenance, original R1 `review.json`, `validator-verdicts.json`, and `standards-worker.md`. R1's three confirmed findings and cleanup-error coverage gap remain the parent review's record; this review does not reopen the frozen ten-lens coverage or judge the concurrent watcher/telemetry corrections.
- No suppression directive remains in the three scoped files. No configuration changes are part of their diff. The finite `Primitive` return and accumulator replace the actual unparsed helper return and broad dictionary, rather than concealing `unknown` in a renamed alias.
- `SchemaGetter.Transform<Event | null, unknown>["transform"]` resolves in installed source and compiled declaration to exactly `(input: unknown) => Event | null`: no parse-options parameter, Effect return, asynchronous result, or widened event. This is a pure function type only. `unknown` stays explicit at the real descriptor-decoding boundary, whose output is validated. The existing `Validator<Value>` is a type-predicate subject, expressly allowed by the vendored `no-unknown-parameters` rule. I do not retain an alias-evasion finding. Actual lint acceptance remains pending.
- Installed Node `ChannelListener` is `(message: unknown, name: string | symbol) => void`; contextual callbacks safely ignore the second argument and still immediately project the unknown message. Subscription/unsubscription use the same retained callback values. State checks before and after projection remain intact, including reentrant stop containment.
- Primitive Schema guards ultimately use nontraversing `typeof` predicates; their interpreter issue handling does not format or traverse the rejected payload. `ObjectKeyword` includes functions, and the added explicit function exclusion restores the old object-only behavior. Null is rejected. NaN and infinities pass the number-kind check but still fail unchanged finite/safe-integer validation. Boxed primitives, functions, symbols, bigint, and object-valued descriptors do not enter projected output.
- Only approved own descriptors are read. Input getters, enumeration, prototype traversal, extra properties, and `toJSON` are not introduced. Descriptor-trap/revoked-proxy failures remain inside the catch. Existing allowlists and exact publisher/projected mapped-type checks remain unchanged. The temporary schema failure allocation noted above is a hot-path concern, not evidence of payload disclosure.
- The public `startDiagnostics(options: DiagnosticsOptions): Promise<DiagnosticsSession>` wrapper and exported public types are unchanged. Internal projector declarations changed from function declarations to const functions, but inspected parameter/result types stay exact; projectors are not re-exported by the public diagnostics index. No public API widening found.
- Session diff changes contextual callback declarations and a pure callable predicate only. Writer property-read count/order is unchanged. Ownership, FIFO queues, loss accounting, supported Promise-observation precondition, final export, and shared absolute 2000 ms stop deadline are unchanged. The 68 mapping and 128 caps are outside these edits and receive no new acceptance claim here.
- Tests were **read, not executed**. Existing assertions/deadlines are retained. Added cases assert single unknown-input/finite-return signatures, callable payload rejection, and zero hostile descriptor-value proxy trap calls. Source/internal imports remain source imports; consumer test boundaries are untouched. No skips, stubs, or weakened assertions were introduced.

## Exact reviewed SHA-256

```text
a74e31026b8eb59d9501702d7cd40cea1054df363d81bfef6e749291879f8a5d  apps/loom/src/tooling/diagnostics/project.ts
ed70cd43664b2f333fa92f4676b50510bc4b406ffed50ed2c6fde959d9acc0a6  apps/loom/src/tooling/diagnostics/session.ts
91c3b5c27349fd54d86c4763decdf3edb1d169db1f03257eef06c13178eade64  packages/tests/unit/diagnostics.test.ts
e9b4204ba065058be7ba1a6ad55d451f4ecb0c6bd6f7ac1604a89ed2577f30f3  apps/loom/node_modules/effect/src/SchemaParser.ts
dbb6832c0811135bdb9b2af42567e93f5964148ddacf17108c176d6702a1b598  apps/loom/node_modules/effect/src/internal/schema/compilerRegistry.ts
bc83d51a6183f7388a7f22519d4d6693f7a80698aa647a835a2be5e3d1724ed4  apps/loom/node_modules/effect/dist/SchemaParser.js
```

Hashes were obtained with read-only `shasum` and the three scoped hashes were stable across inspection. Only this assigned receipt was written. No source edit, delegation, commit, push, tests, lint, formatting, typecheck, build, browser, server, database, collector, reproduction, or application execution occurred.

## Pending gates

Root must first resolve R2-PAS-1 and obtain a source re-review. Queued verification still includes diagnostics/type-contract tests, lint, formatting, typecheck/build and public declaration/consumer checks, hostile payload containment, FIFO/reentrant stop and late Promise settlement, cross-session isolation, and strict shutdown behavior. Combined final implementation/API/security review after all corrections remains required. Historical U2/U3/U5/U6 receipts are retained context, not fresh execution acceptance; no full-feature or shipping approval is given.
