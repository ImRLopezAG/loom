export const dictIntDigest = "1a745014cc5c4e94724c34d742b8fb154fe0852306dca4163cc307b8dca9e5da";
export const dictIntDescriptor = {
  name: "dict_int",
  version: "1.0",
  schema: 'dict"int',
  apiSupport: { status: "verified", digest: dictIntDigest },
} as const;
export const dictIntInstall = `CREATE SCHEMA "dict""int"; CREATE EXTENSION dict_int WITH SCHEMA "dict""int" VERSION '1.0'; CREATE SCHEMA "custom""dictionaries"`;
