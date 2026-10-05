import source from "../../../apps/loom/src/tooling/extensions/manifests/dblink.json";

export const dblinkSchema = 'db"link';
export const dblinkDescriptor = {
  name: "dblink",
  version: "1.2",
  schema: dblinkSchema,
  apiSupport: { status: "verified", digest: source.digest },
} as const;
export const dblinkInstall = `CREATE SCHEMA "db""link"; CREATE EXTENSION dblink WITH SCHEMA "db""link" VERSION '1.2'`;
export const dblinkDigest = source.digest;
export const dblinkMemberIds = source.contract.members.map((member) => member.id);
