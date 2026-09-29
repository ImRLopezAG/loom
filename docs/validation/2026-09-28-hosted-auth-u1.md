# Hosted auth public API (U1)

Scope: hosted-auth plan U1. Executed on feat/orpc-effect-core; baseline fb4577f.

The thread goal tool rejected creation because an older paused goal remains unfinished. Execution continues inline under the accepted plan; no old goal was marked complete.

## Implementation and evidence

- Optional compiled `loom/better-auth` export retains the concrete native auth instance in component services. Explicit component mounting and existing Standard Schema environment validation are reused.
- `createTokenAuth` in `loom/client` consumes external provider state/tokens. It gates loading/signed-out states and discards in-flight tokens after subscribed identity changes. Existing lifecycle forwards refresh intent; initial provider connection does not force refresh.
- Pinned Better Auth/core/Drizzle adapter 1.7.6 as optional peers plus development dependencies. No vendor implementation is bundled into browser exports.
- Type tests first failed for the missing subpath and token bridge; after implementation, JWT/organization/two-factor native methods, custom user fields, and negative method/argument tests pass through compiled exports.
- Zod/Valibot environment tests cover valid, missing, and invalid values. Error messages retain variable names, not invalid secret values.
- `bun run build`: passed. Existing pack warnings about Zod declarations and client directives remain.
- `bun run typecheck`: passed, 18 tasks.
- `bun run lint`: passed.
- Full `packages/tests` test suite: 66 files, 264 tests passed.
- `bun run check:static`: initial failure included owned formatting and pre-existing README/explainer formatting. Owned files formatted; pre-existing edits preserved and excluded.

## Phase review

Performed sequentially in the main thread per the supplied AGENTS mapping. This is a phase review, not the final standalone ce-code-review receipt.

- Correctness/API: checked factory return inference, registered component identity, optional peer export isolation, legacy no-argument token callback compatibility, and initial/refresh call sites. Fixed a circular inference issue with a named services result and retained the original registered component object.
- Security: checked server verification remains unchanged, tokens are not trusted as identity by this bridge, loading/logged-out state returns null, subscribed account changes invalidate pending token reads, and environment failures redact values. Provider adapters must report identity changes through subscribe or replace the provider auth object.
- Simplification: read and applied reuse, quality, and efficiency rubrics. Reused component/environment facilities and existing authentication lifecycle. No additional behavior-preserving consolidation was warranted. No new timers, caches, or database ownership introduced.
- Migration/performance: no SQL is executed or planned by U1. Factory registration is lazy; auth/runtime hosting and database verification remain U2–U8 work.

No Neon, browser, migration, or hosted-server acceptance is claimed for this unit.
