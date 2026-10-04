import source from "../../../apps/loom/src/tooling/extensions/manifests/lo.json";
export const loSchema = 'lo "objects"';
export const loDescriptor = {
  name: "lo",
  version: "1.2",
  schema: loSchema,
  apiSupport: { status: "verified", digest: source.digest },
} as const;
export const loInstall = `CREATE SCHEMA "lo ""objects"""; CREATE EXTENSION lo WITH SCHEMA "lo ""objects""" VERSION '1.2'`;
