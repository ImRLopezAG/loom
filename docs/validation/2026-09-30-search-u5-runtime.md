# U5: transaction-owned relational search

U5 of the relational search/pagination plan is implemented. U6-U8 remain unfinished.

The generated project context supplies `context.search`; `paginate(input)` uses the active contract's authorized policy, relation graph, verified identity, trusted branch and namespace. Search always runs read-only, including when native client operation hints request a mutation. Rows and optional exact count share one repeatable-read transaction. Counts remain decimal strings.

Raw handler returns are checked before native output transforms. The final RPC boundary checks again because middleware can replace a handler result. Every explicit streaming event receives the same strict selected-result check. Escaped calls, missing direct-call contract bindings, cancellation and foreign contracts fail. Pending reads remain owned even when the handler neglects to await them; their failures reject the invocation.

## Verification

- Workspace build: 8/8 tasks passed.
- Workspace typecheck: 18/18 tasks passed, TypeScript 7.
- Unit suite: 334 tests in 78 files passed.
- Packed generated consumer: selected return types through native query/infinite/live options, four relation edges, both exactOptionalPropertyTypes settings, and browser runtime isolation passed.
- Neon PostgreSQL 18: `search-transactions.test.ts` passed with 26 Bun expectations plus Node strict rejection assertions on owned schema-only branch `loom-acceptance-search-20260930` in project `late-moon-69483649`. No parent data was changed.
- Deterministic concurrent writer committed between row and count statements: the first invocation kept its original count; the next invocation saw the writer.
- Direct, HTTP and WebSocket tests covered authentication, exact output, scalar/codecs and read ownership. Effect used the same Search service.
- Native middleware-added fields produced a failing regression test before the final boundary fix, then passed as a rejection afterward.
- Direct pathless calls without an explicit contract binding failed before any database statement. A different direct contract rejected the previous contract's cursor.
- Lint passed without errors. Warnings remain for a test instrumentation method reference and an unrelated leftover generated staging directory.

## Review and simplification

Correctness, security, API contract, reliability, performance, maintainability, standards and testing lenses ran sequentially inline under the user's AGENTS mapping. These are not independent local agent reviews. Reuse/quality/efficiency simplification retained existing query compilation, transaction ownership, codecs and iterator cleanup. Dynamic graph dispatch now uses a named internal query interface and runtime row parsing.

Independent cross-model review requested Claude Opus 5.5 at low effort. Its receipt confirms `claude-opus-5-5` and independent serving family; actual effort is unverified. The direct cursor-binding observation was fixed and tested. A suggested public testing export was declined: internal implementation unit tests use private source modules, while packed consumers and real Neon acceptance use compiled `loom/...` exports. No consumer source alias was added. The missing failed-unawaited-read scenario was added and passed.

Review receipt: `/tmp/compound-engineering-501/ce-code-review/20260930-145855-4af698aa/review.json`. Peer process was terminal and its supervised job directory removed.

Hosted Neon Functions deployment, generated component search acceptance and coherent live execution are not claimed by U5.
