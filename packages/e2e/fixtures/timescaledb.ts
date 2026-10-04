export const timescaledbDigest = "cc3487ad909ac0c440eb343101dc7bd52ca4efe5997daf54720c255f6afd6f3f";
export const timescaledbSchema = "ts ext";
export const timescaledbDescriptor = {
  name: "timescaledb",
  version: "2.24.0",
  schema: timescaledbSchema,
  apiSupport: { status: "verified", digest: timescaledbDigest },
} as const;
/** Requires a server that preloads timescaledb (Apache license) and a fresh database created from template0. */
export const timescaledbInstall = `CREATE SCHEMA "ts ext";
CREATE EXTENSION timescaledb WITH SCHEMA "ts ext" VERSION '2.24.0';`;
