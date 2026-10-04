export const intaggDigest = "7e9c80504c50e5a1910b61667a1774d8c1976c676c087c23fd744168986311f1";
export const intaggDescriptor = {
  name: "intagg",
  version: "1.1",
  schema: 'int"agg',
  apiSupport: { status: "verified", digest: intaggDigest },
} as const;
export const intaggInstall = `CREATE SCHEMA "int""agg"; CREATE EXTENSION intagg WITH SCHEMA "int""agg" VERSION '1.1'`;
