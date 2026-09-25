# Contract-first application execution

This records implementation of the revised application API requested on September 25, 2026. Earlier oRPC acceptance does not establish acceptance of this revision.

## Settled decisions

- Every application procedure has a native oRPC contract. Support object and schema-aware callback declarations.
- Streaming contracts are explicit. Use native `liveOptions` on their native client methods; do not synthesize `.live` procedures.
- Accept Standard Schema, including Zod and Valibot, without replacing the user's library. Test runtime validation, transformed types, and OpenAPI separately.
- Generate the native client factory; keep native oRPC TanStack query/mutation/live options. Remove Loom callable-option wrappers and `clientMode`.
- Configure typed environment and named contract-bound builders in `app.config.ts`; use `auth.config.ts` for authentication integration.
- Inject typed database, tables, validators, identity, environment and Effect services. Select transaction behavior internally using forwarded native operation context and safe non-TanStack semantics.
- Components remain future work.

## Execution order and evidence

1. Standard Schema environment and contract foundations: mixed-vendor runtime and negative type checks; fail-closed validation and secret redaction review.
2. Contract-bound application builders and context: middleware refinement, Effect services, mandatory contract matching, initialization without production credentials.
3. Native client and transaction integration: actual HTTP/WebSocket operation forwarding, direct calls and OpenAPI semantics, streaming cancellation, isolation and retries.
4. Project discovery and generation: stable generated imports, clean-project bootstrap, missing/extra implementations, browser dependency and credential isolation.
5. Migrate examples, CLI and documentation: exercise generated native clients and all three native option forms; remove superseded public APIs.
6. Acceptance: full build/type/lint suites, PostgreSQL integration, browser checks and real disposable Neon Functions deployment; review and scoped commits per completed unit.

Existing README and untracked plan/explainer changes are excluded from this work. Work continues on `feat/orpc-effect-core` and existing PR #1.

## Evidence

- Environment tests first failed because `parseApplicationEnvironment` did not exist. Tests cover mixed Zod/Valibot transformations, async schemas, redacted failures, undeclared variables, inherited properties and special property names.
- Validation foundation verified: core build; core browser/server and test TypeScript checks; full Oxlint; scoped formatting; all 195 unit tests pass. Zod OpenAPI first failed with `Unsupported input schema vendor: zod`; the new Standard JSON Schema converter passes representable contracts and rejects unsupported conversions. No Zod runtime dependency was added.
- Code/security review of the validation foundation ran sequentially in the implementation context, not as independent review: checked secret leakage through errors/causes, inherited environment properties, prototype-sensitive names, immutable outputs, transformed type inference, browser export isolation and fail-closed OpenAPI conversion. No unresolved findings. Runtime startup wiring and generated consumers remain later work; these tests do not establish Neon acceptance.
- Native oRPC TanStack options expose an operation context symbol. Prior executable probes demonstrated query/mutation labels at the link and HTTP header forwarding. Production WebSocket and server integration remain to be verified.
- Native contract declarations: object/callback forms preserve schemas, errors and explicit iterator outputs through native `implement`/`call`. Five focused tests pass, along with core browser/server and consumer type checks, full lint and formatting. Negative type checks cover incorrect output, missing routes, unknown routes, finite outputs on streaming contracts and invalid client input. Discovery rejects output-less contracts, implementations mixed into declarations, and cycles; shared contract subtrees remain valid.
- Contract declaration code/security review ran sequentially in this context: checked runtime-only server dependencies are absent from the contract export, callbacks receive only explicit bindings, recursive traversal rejects cycles, and no unsafe cast widens native client or handler types. Generated registration and application-wide completeness are not yet wired.
