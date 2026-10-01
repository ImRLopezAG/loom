# U1: compiled public Loom package

Scope: U1 of `docs/plans/2026-09-26-0919-refactor-public-package-neon-auth-plan.md`; R1, R2 and the package/type portion of R11; KTD1 and KTD8. This receipt does not complete U2-U13 or claim provider acceptance.

## Implementation

`apps/loom` owns the CLI, core and tooling. Its `loom@0.0.0` artifact exports compiled ESM and declarations through explicit subpaths. The executable uses Bun; runtime exports retain separate Node and browser type checks. Consumers and generated files use `loom/...`. React and React Query are optional peers. The reviewed Drizzle and Neon config implementations and notices remain bundled.

Build-only TypeScript aliases are isolated in `tsconfig.build.json`. Putting them in the runtime-discovered tsconfig caused Bun to load source and compiled schema registries separately; the generation tests reproduced the failure and pass after separating that configuration. Turbo orders Loom's own type check after its build.

## Verification

- Initial packed-consumer assertion failed against `@loom/cli`, establishing the package-name regression check.
- `bun run test`: 207 tests passed across 53 files.
- `bun run typecheck`: all workspace tasks passed, including Next.js, TanStack Start, CSR and docs builds.
- `bun run lint`: passed with the existing Oxlint and anti-slop rules.
- Focused CLI, application-codegen, rpc-codegen, packed-consumer, docs-consumer and Node compatibility suite: 15 passed, 2 database-dependent cases skipped, 176 expectations.
- Extended packed-consumer test passed after adding installed CLI generation, tarball allowlist, Bun shebang, React client directive, React absence, runtime Zod/Valibot validation (invalid input and output), Effect invocation isolation, and the existing integration example's positive/negative TS7 fixtures.
- External consumer installs use a temporary directory outside this repository and only one Loom tarball. Both bundled dependency patches run through that artifact under Bun and Node 24.
- The repository-wide formatting gate reports three pre-existing dirty files: `README.md`, `docs/explainers/2026-09-26-loom-public-library-and-auth-diagnosis.md`, and `packages/examples/start/src/routes/api.session.ts`. They are excluded from this commit. Changed unit files are formatted.

## Simplification and review

Reviews ran sequentially in the main thread per the supplied AGENTS tool mapping. These are separate review lenses, not independent model reviews. No cross-model job was launched.

- Reuse, quality and efficiency: removed duplicate consumer dependency declarations and redundant manifest wrapping; retained the existing package/build primitives.
- Correctness: checked source moves, executable resolution, self-import identity and clean-build ordering; fixed the build-only alias and Turbo dependency issues.
- Security: checked browser/server separation, published file allowlist, secret-free code generation and preserved patch enforcement. Existing authorization/runtime semantics were not changed by this unit.
- API contract: verified public subpaths, native oRPC options, explicit streams, Standard Schema types and generated client inference. The package/import rename is the intended breaking change; the wire protocol remains `loom-orpc-2`.
- Testing/adversarial: verified unrelated-directory install, optional-peer absence, actual emitted executable, negative type fixtures and patched behavior. Fixed a fixture that incorrectly linked `loom/tooling` as a package and CI checks that referenced removed package directories.
- Standards/maintainability: preserved strict runtime-specific type checks, extensionless authored imports, exact dependency versions and scoped staging. Updated the repository structure instruction to the new package ownership.
- Agent access: existing CLI commands and structured failure behavior remain available through the installed executable.

No unresolved U1 code/security findings remain. Database/cloud acceptance is not established by these local checks. Publication remains gated on the existing Drizzle license/namespace review; this work neither publishes nor resolves that release gate.
