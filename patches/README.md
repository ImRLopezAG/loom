# Drizzle migration API patch

`drizzle-kit@1.0.0-rc.4.patch` modifies only the PostgreSQL API bundles (ESM/CommonJS) and their declarations. Bun applies it through the root `patchedDependencies` entry and records its hash in the lockfile.

The published package declares MIT licensing. The upstream repository root separately carries Apache-2.0; this patch distributes only a small diff against the published package, not an upstream fork or bundle. Preserve upstream package provenance and notices when distributing tooling. The API version and patch are part of Loom's compatibility baseline.

Issue: https://github.com/drizzle-team/drizzle-orm/issues/6053

The unpatched API cannot resolve simultaneous additions/deletions. Both 1.0.0-rc.4 and inspection of 1.0.0-rc.5-5935859 show resolvers without a hints handler. The patch passes validated explicit rename hints into Drizzle's existing handler and every existing resolver. It rejects unresolved hints before returning SQL; it does not treat ambiguity as permission to drop data. SQL generation remains entirely Drizzle-owned.

The supported added public argument is an optional array of table or column rename hints. The diff runs inside Drizzle's existing asynchronous CLI context with JSON output and interaction disabled, so resolver progress cannot corrupt Loom's structured output. This context is scoped to the call; no global console replacement is used. The CLI, push implementation, other dialects, and Payload entry points are unchanged. Only `drizzle-kit/api-postgres` is the supported Loom migration entry point.

Verification: additive generation, ambiguous table/column rejection, explicit table/column renames, invalid source rejection, and a populated PostgreSQL column rename. Three pre-patch failures were observed before applying the patch. Upgrade/removal requires rerunning these fixtures and clean-install verification.

The same four files also expose `inspectSchema(database, schemaFilters)`. This invokes Drizzle's existing PostgreSQL introspector and snapshot serializer without applying DDL. An empty schema selection is rejected, introspection metadata errors fail closed, and queries are serialized on the caller's dedicated session. Loom's adapter accepts a validated single namespace and validates the returned snapshot vocabulary. The caller controls transaction isolation and locking. Snapshot initialization is explicit so introspection can be the first API call in a fresh process.

Verification includes independent Node ESM/CommonJS processes calling introspection first inside a PostgreSQL 18 read-only transaction, namespace filtering, empty-selection rejection, and a clean standalone patched installation followed by a frozen install. This caught a missing lazy initializer before correction. The live round-trip fixture covers defaults, enum checks (including reserved identifiers and escaped literals), unique constraints and indexes. Source enum checks use PostgreSQL's `ANY` form; Loom compares their PostgreSQL parser trees while excluding only source offsets before passing snapshots to Drizzle. Changed literal values remain changes requiring review. The original snapshots and their hashes remain intact.


## Neon bucket privacy metadata patch

`@neon%2Fconfig@1.7.2.patch` changes only `normalizeBucketAccessLevel` and its explanatory comment in `dist/lib/neon-api-real.js`. The upstream package carries Apache-2.0 licensing. Preserve its license and notices with any distribution. The dependency is pinned transitively through `@neon/config-runtime@1.6.2`, and Bun applies the exact patch from the root manifest and lockfile.

The original SDK converts missing and unrecognized `access_level` values into `private`. That default cannot prove that an existing remote bucket is private. The patch accepts exactly `private` and `public_read`; all other responses throw before a normalized snapshot reaches Loom. It does not change provider requests, known access values or API types.

A pre-patch integration regression accepted `public_write` metadata instead of rejecting it. The patched fixture rejects unknown and missing metadata, rejects public buckets through Loom's policy and still accepts explicit private buckets. A separate clean installation and frozen reinstall of the pinned SDK exercises the patch in Node. Removing/upgrading this patch requires these tests to pass against the replacement SDK. Consumer distribution must preserve the patch (or include an upstream equivalent); root workspace patch settings do not propagate automatically to published package consumers. Packed storage deployment acceptance remains a release gate until that packaging is established.
