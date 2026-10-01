# U3 — Optional configuration and public discovery

Plan: [public package and Neon auth](../plans/2026-09-26-0919-refactor-public-package-neon-auth-plan.md), U3 / R5 / R11 / KTD3.

Operational configuration is optional. Scaffolding retains required application, authentication, schema, and contract files, and no longer creates `loom.config.ts`. Advanced overrides still validate. Read-only discovery produces a typed descriptor, rejects conflicting project identities and ambiguous databases, and distinguishes function, authentication, and Data API URLs. Browser output uses a strict public allowlist. Environment writes retain unrelated entries and comments, serialize writers, reject duplicate keys and symlink destinations, and replace files atomically.

Generated endpoint configuration is separate from the server version. Review found that including discovered function URLs in that version could cause repeated deployment/version changes; the installed-package regression now verifies URL changes preserve the version. Native oRPC client and TanStack option types remain intact. Explicit client URL overrides remain available.

## Observed verification

- Workspace build/typecheck: 16 tasks pass, including Bun tooling, Node runtime, and browser configurations.
- Unit suite: 207 tests in 53 files pass.
- Configuration, CLI, application-codegen, and packed-consumer integration suite: 14 tests pass, 136 assertions. The subsequent environment symlink/no-op extension passes separately.
- Oxlint passes; formatting scoped to this unit.
- Existing required application-secret validation is retained and exercised by application generation coverage.
- The previously failing CLI file inventory was updated for the generated public configuration module; the complete integration suite passes.

## Review

Reviews and simplification ran sequentially in the main thread under the user's tool mapping; these are distinct lenses, not independent agents. Scope is this unit's source and tests against `a033b63`.

Correctness/API/TypeScript: checked optional config versus malformed config, selection precedence, strict descriptor parsing, missing service behavior, generated declaration/runtime agreement, and version stability. Security/adversarial: traced public values from provider responses through persistence and generated browser output, verified credentials are not copied, and exercised project/branch mismatch and unsafe env destinations. Reliability: lock cleanup, atomic replacement, duplicate-key refusal, and provider failure propagation retain existing state. Testing: installed tarball and generated browser bundle exercise the real packaging chain; discovery fixtures test branching decisions without claiming provider acceptance. Maintainability/reuse/efficiency: reuse existing path validation and atomic receipt writer; metadata discovery is CLI work, not request-time work. No additional abstraction or optimization was justified. Project standards and agent-native checks retain exact dependency pins, strict types, redacted structured CLI errors, and extensionless source imports.

No outstanding local finding was retained. Configuration-free cloud deployment and onboarding command consumption are later U4/U5/U13 gates, not a result of this unit alone.

## Corrected provider evidence

Direct official Neon CLI inspection and Loom's compiled credential adapter both read project `late-moon-69483649`, named `loom`, successfully. It belongs to `org-steep-breeze-78098642`, uses PostgreSQL 18, and is in `aws-us-east-1`. Its current default branch is `br-solitary-sun-aw6tznuf` (`main`). The earlier access diagnosis used a truncated project ID missing the final `9`; account access was not the problem. No resource was mutated during these reads. Fresh interactive login and real OS-keyring acceptance remain open U2 gates.
