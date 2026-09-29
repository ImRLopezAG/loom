# Documentation expansion verification

Scope: expand `apps/docs` and add JSDoc to consumer-facing library declarations. No runtime behavior changes belong to this work.

## Content

- Added 11 guides/reference pages for configuration, internal procedures, HTTP, Better Auth, React, Suspense, SSR, troubleshooting, exports, types, and CLI commands.
- Updated quickstart, navigation, authentication imports, subscription cache ownership, and development component lifecycle guidance.
- Added a compiled documentation fixture for native query/live/mutation options and request-scoped SSR.
- Added JSDoc describing authoring, schema, component, authentication, client, HTTP, job, and configuration types and selected members.

## Verification

- `bunx turbo run build typecheck --filter=loom --filter=@loom/docs`: passed. The final docs-only rerun also passed after content edits.
- `bunx vp lint apps/docs apps/loom/src/core apps/loom/src/tooling/config/define-config.ts`: passed.
- Formatted changed sources and docs with Vite+; scoped `git diff --check` passed.
- Built 28 Astro pages, including the search endpoint. Checked 693 internal links across the 27 document pages, including fragment targets: no missing targets.
- Inspected the rendered landing, type reference, and React guide through the collaborative preview; the type-reference layout and navigation render correctly.
- Confirmed representative JSDoc survives in packaged `.d.ts` output, including IDs, environment references, token adapters, and Better Auth configuration.
- Library edits in this change are comments only. Database/cloud acceptance was not rerun for documentation work.

An orphaned empty docs-example generation lock was removed only after checking that no generation process was running. The first overlapping lint attempt ran while package output was rebuilding; the sequential retry passed. Existing hosted-auth changes and the unrelated README edit remain outside this change. The bundler still emits its existing module-level `use client` directive warnings.
