# U1: generated search typing and native cache compatibility

U1 passes under the explicitly approved search-only native `RouterUtilsPlugin` amendment. This closes the compatibility gate; database execution, cursor security, live windows and Neon acceptance remain U2-U8 work.

## Evidence

- Workspace build, TS7 typecheck and Oxlint pass. Unit suite: 74 files, 309 tests pass.
- `packed-search-generated.test.ts` packs the compiled `loom` package, installs it with Bun's isolated linker, initializes an application, generates through both tooling and CLI, and compiles an actual generated client.
- Positive assertions cover exact root fields, branded IDs, Date/bigint/decimal representations, M2M and four nested relation edges, native query/infinite/live options, selected cache tags, suspense, errors/context, skipToken and uncertain selections. The positive consumer contains no casts or error suppression annotations.
- Both `exactOptionalPropertyTypes` modes pass. Negative compiler fixtures reject forbidden root/nested columns, unselected reads, incorrect initial data/query functions, blind previous-data callbacks and forbidden key inputs.
- Native observers prove global/key/scoped defaults cannot populate incompatible projections, including repeated callback reuse and pending first live events. Compatible extra fields remain allowed for cache data.
- Browser bundle excludes schema evaluation, hidden field/graph identifiers, PostgreSQL and Node-only imports. Native utility initialization remains upstream-owned.
- Duplicate compiled package copies retain public descriptor metadata through a versioned non-enumerable symbol. Nested router guard paths work with a native cache prefix.

One local packed run measured 526 ms / 131 ms for the two TS7 modes, a 1,278-byte generated API declaration and a 168,562-byte unminified browser bundle. These are observations from a small fixture, not performance improvement claims; dependency caches and machine load affect them.

## Review and simplification

Eight review lenses ran sequentially in the host, following the user's AGENTS mapping: correctness, project standards, testing, maintainability, security, performance, API contract and reliability. These are not independent reviewers. Reuse/quality/efficiency simplification passes preserved the shared codecs and intentional fresh placeholder closures.

Independent Claude review: route `claude`, served `claude-opus-5-5`, requested low effort, actual effort unverified, different serving family verified. Its WeakMap/package-copy concern was fixed and verified with the packed copy regression. Namespace and missing-relations concerns were checked against the namespace fixture and loader fallback. U5's strict network-result boundary remains an explicit future gate.

Review receipt: `/tmp/compound-engineering-501/ce-code-review/20260930-110602-b784f215/review.json`. No remaining actionable U1 findings. Unrelated docs, branding and auth changes remain outside this commit.

## Consumer boundary

Use the generated connection's `rpc` for selection-aware native options. Directly rebuilding upstream utilities retains upstream fixed-output inference. Custom cache-key collisions and unsafe untyped downstream overrides remain caller-owned. The cache adapter protects cache data; it does not replace server response validation or authorization.
