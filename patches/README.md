# Drizzle migration rename hints

`drizzle-kit@1.0.0-rc.4.patch` modifies only the PostgreSQL API bundles (ESM/CommonJS) and their declarations. Bun applies it through the root `patchedDependencies` entry and records its hash in the lockfile.

The published package declares MIT licensing. The upstream repository root separately carries Apache-2.0; this patch distributes only a small diff against the published package, not an upstream fork or bundle. Preserve upstream package provenance and notices when distributing tooling. The API version and patch are part of Loom's compatibility baseline.

Issue: https://github.com/drizzle-team/drizzle-orm/issues/6053

The unpatched API cannot resolve simultaneous additions/deletions. Both 1.0.0-rc.4 and inspection of 1.0.0-rc.5-5935859 show resolvers without a hints handler. The patch passes validated explicit rename hints into Drizzle's existing handler and every existing resolver. It rejects unresolved hints before returning SQL; it does not treat ambiguity as permission to drop data. SQL generation remains entirely Drizzle-owned.

The supported added public argument is an optional array of table or column rename hints. The CLI, push implementation, other dialects, and Payload entry points are unchanged. Only `drizzle-kit/api-postgres` is the supported Loom migration entry point.

Verification: additive generation, ambiguous table/column rejection, explicit table/column renames, invalid source rejection, and a populated PostgreSQL column rename. Three pre-patch failures were observed before applying the patch. Upgrade/removal requires rerunning these fixtures and clean-install verification.
