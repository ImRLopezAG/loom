# U2: schema-derived search contracts

U2 implements finite and explicit streaming descriptors using the compiled schema and native relations. It does not implement database execution or hosted acceptance; those remain U3-U8.

The factories preserve existing table validators, enforce independent projection/filter/order/text capabilities, require authorization declarations for selected M2M junctions, and bound request shape, nesting, lists, text and bytes. Input/output descriptor identity and finite/streaming mode are checked during native contract discovery. Standard JSON Schema output supports OpenAPI alongside Zod, Valibot and Effect contracts.

Verification: workspace build and TS7 typecheck pass; Oxlint passes; 75 unit files / 318 tests pass. The compiled packed consumer passes both optional-property compiler modes, finite/live native options, four relation edges and a browser build excluding private descriptor metadata, hidden graph identifiers and Node/PostgreSQL imports. Output regressions reject encoded date/bigint strings and preserve native values without coercion.

Eight review lenses and the reuse/quality/efficiency passes ran sequentially in the host under the user's AGENTS mapping. They are not independent reviews. The independent review served Claude Opus 5.5 through the Claude route, requested low effort, actual effort unverified, different serving family verified. Its browser-leak and decoding concerns were rejected against the packed bundle and codec tests. No actionable U2 findings remain.

Review receipt: `/tmp/compound-engineering-501/ce-code-review/20260930-120442-c6cd70c5/review.json`.

Neon project reads were attempted through both CLI and plugin; both returned an authorization error. No database or Function acceptance is claimed by this phase.
