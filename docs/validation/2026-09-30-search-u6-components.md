# U6: generated and component-local search

U6 is implemented. Coherent live windows and hosted Functions search acceptance remain U7-U8.

Generated root/component servers expose the typed Effect `Search` service. Contract discovery, runtime bundles and stable generated validators use each component's actual schema and relations. Internal and dependency callers retain the exact selected result types. Two mounts of a catalogue component keep independent physical data and cursor authority; two reader components call their own explicitly bound catalogue dependency.

A real dependency call exposed an overly restrictive guard: an authorized read search leaf sharing an automatic parent's write transaction was rejected. The search leaf still forces read authority, verifies the active invocation and executes compiled SELECT statements. Parent identity, connection, request, authorization, cancellation and write escalation checks remain enforced.

## Verification

- Workspace build: 8/8 tasks passed.
- Workspace TypeScript 7 typecheck: 18/18 tasks passed.
- Configured Vite Plus unit runner: 334 tests in 78 files passed.
- Packed generated consumer, component generation and watcher tests: 6 passed. Consumer authoring, Effect, internal/dependency caller types, four relation edges and both exactOptionalPropertyTypes settings compile from the installed tarball.
- Invalid fields, private junctions, internal routes and unexposed mounts fail actual compiler checks; no TypeScript suppression pragmas are used. Generated API declarations are copied as source during checking so skipLibCheck cannot hide duplicate identifiers.
- Installed-package watcher reacts to field/relation edits, generates current types, and rejects removed names. Existing failed-edit recovery checks pass.
- Browser bundle contains no PostgreSQL, Node server modules or credential material.
- Real Neon PostgreSQL 18 on owned branch `loom-acceptance-search-20260930`, project `late-moon-69483649`: component and U5 transaction tests passed. Four mounts exercise native Effect, private calls, cross-component dependencies, isolated data, and cross-mount/cross-method cursor rejection.
- Lint passed with existing warnings in U5 instrumentation and an unrelated generated staging directory.

## Review

Correctness, security, API contract, reliability, maintainability, standards and testing reviews ran sequentially inline under the user AGENTS mapping; they are not independent local reviews. Simplification reused the scoped builders, native callers and one shared authored test fixture.

Independent Claude review confirms requested/actual `claude-opus-5-5`; low effort was requested but actual effort is unverified. Its duplicate generated import finding was fixed and the declaration check strengthened. Its dependency runtime coverage gap was filled by the reader mounts. The virtual runtime entry is bundler-only JavaScript; consumer Effect services use concrete generated TypeScript generics. The final dependency transaction guard change was reviewed inline and tested against Neon after the peer review, rather than being claimed as peer-reviewed.

Receipt: `/tmp/compound-engineering-501/ce-code-review/20260930-153614-2855e433/review.json`. Peer job is terminal, reaped and removed. No unresolved actionable finding remains for U6.
