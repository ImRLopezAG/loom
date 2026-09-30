# U3: scoped relational membership and projections

U3 compiles schema-validated search selections into one native Drizzle relational query. Root membership uses correlated EXISTS; selected child filters do not remove roots. Root, target and junction scopes remain enforced through Boolean negation and nested projections. Graph validation rejects foreign source/target/junction tables; fingerprints include native joins and static relation filters.

Verification: workspace build and TS7 typecheck pass; root Oxlint passes; 76 unit files / 324 tests pass. The packed generated consumer passes both exactOptionalPropertyTypes modes and browser isolation. Real PostgreSQL 18 on Neon passes 78 assertions covering P022-P036, four relation edges, sibling aliases, nested and sibling M2M junction authorization, NOT over scoped relations, root self-relations and counts, hidden output keys, Date/bigint/decimal preservation and parameterized literal escaping. Red proofs for missing compiler, unchanged relation fingerprints and foreign graph sources were observed before their fixes.

The saved login identifies project `late-moon-69483649` (loom). The earlier shortened identifier `late-moon-6948364` caused the read failure recorded in U2. Acceptance uses owned, unprotected schema-only branch `br-wispy-dew-awdp5g3y`, named `loom-acceptance-search-20260930`; parent data is untouched. Each test creates and drops only its randomized fixture namespace. This branch remains for U4-U8 acceptance and requires cleanup after that run.

Seven code/security/performance/test/API/standards lenses and reuse/quality/efficiency passes ran sequentially in the host under AGENTS. These are not independent reviews. The independent Claude route verified actual Opus 5.5 and serving-family independence; low effort was requested, actual effort unverified. Its pinned native junction-alias concern was checked with real nested and sibling junction tests. The peer job reached done and was deleted. No actionable U3 findings remain.

Review receipt: `/tmp/compound-engineering-501/ce-code-review/20260930-124654-53a6fcf5/review.json`.

Cursor pagination, request-scoped execution, generated runtime bindings, live lifecycle and hosted Function transport remain U4-U8. This receipt does not claim their acceptance. Scope callbacks are SQL builders and must remain deterministic for the supplied table and identity.
