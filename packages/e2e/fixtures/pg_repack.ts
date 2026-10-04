import source from "../../../apps/loom/src/tooling/extensions/manifests/pg_repack.json";

export const pgRepackDigest = source.digest;
export const pgRepackVersion = "1.5.2" as const;
export const pgRepackSqlSchema = "repack";
export const pgRepackDescriptor = {
  name: "pg_repack",
  version: pgRepackVersion,
  schema: "extensions",
  apiSupport: { status: "verified", digest: pgRepackDigest },
} as const;
export const pgRepackInstall = `CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION pg_repack WITH SCHEMA extensions VERSION '1.5.2';`;
