import source from "../../../apps/loom/src/tooling/extensions/manifests/postgres_fdw.json";

export const postgresFdwSchema = 'fdw "cache"';
export const postgresFdwDescriptor = {
  name: "postgres_fdw",
  version: "1.2",
  schema: postgresFdwSchema,
  apiSupport: { status: "verified", digest: source.digest },
} as const;
export const postgresFdwInstall = `CREATE SCHEMA "fdw ""cache"""; CREATE EXTENSION postgres_fdw WITH SCHEMA "fdw ""cache""" VERSION '1.2'`;
export const postgresFdwDigest = source.digest;
export const postgresFdwMemberIds = source.contract.members.map((member) => member.id);
