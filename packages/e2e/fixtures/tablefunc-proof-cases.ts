import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const tablefuncProofFamily = {
  extension: "tablefunc",
  version: "1.0",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "08f54e73281a2592eddf0ac6f555ba1a0b3c0961fb7ab6eab05be90ab74b66d4",
} as const satisfies ExtensionProofFamily;

export const tablefuncRoutines = [
  "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
  "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
  "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
  "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
  "routine:$extension:tablefunc.crosstab(pg_catalog.text,pg_catalog.int4)",
  "routine:$extension:tablefunc.crosstab(pg_catalog.text,pg_catalog.text)",
  "routine:$extension:tablefunc.crosstab(pg_catalog.text)",
  "routine:$extension:tablefunc.crosstab2(pg_catalog.text)",
  "routine:$extension:tablefunc.crosstab3(pg_catalog.text)",
  "routine:$extension:tablefunc.crosstab4(pg_catalog.text)",
  "routine:$extension:tablefunc.normal_rand(pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
] as const;
export const tablefuncTypes = [
  'composite type:"$extension:tablefunc".tablefunc_crosstab_2',
  'composite type:"$extension:tablefunc".tablefunc_crosstab_3',
  'composite type:"$extension:tablefunc".tablefunc_crosstab_4',
  "type:$extension:tablefunc._tablefunc_crosstab_2",
  "type:$extension:tablefunc._tablefunc_crosstab_3",
  "type:$extension:tablefunc._tablefunc_crosstab_4",
  "type:$extension:tablefunc.tablefunc_crosstab_2",
  "type:$extension:tablefunc.tablefunc_crosstab_3",
  "type:$extension:tablefunc.tablefunc_crosstab_4",
] as const;
export const tablefuncMembers = [...tablefuncRoutines, ...tablefuncTypes] as const;

export const tablefuncUnitProofCases = [
  { id: "tablefunc.unit-contracts", title: "tablefunc exact manifest coverage and digest identity" },
  {
    id: "tablefunc.unit-sql",
    title: "tablefunc qualified SQL binds managed query text and quoted connectby identities",
  },
].map(
  (entry) =>
    ({
      ...entry,
      file: "packages/tests/unit/extensions-tablefunc.test.ts",
      gate: "unit",
      families: [tablefuncProofFamily],
      claims: [],
    }) as const,
) satisfies ExtensionProofCase[];

export const tablefuncTypesProofCase = {
  id: "tablefunc.types-contracts",
  file: "packages/tests/types/extensions-tablefunc.test-d.ts",
  title: "tablefunc public exact-version helpers, typed row columns and rejected raw SQL text",
  gate: "types",
  families: [tablefuncProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const tablefuncNativeProofCase = {
  id: "tablefunc.native-ordinary",
  file: "packages/e2e/integration/extensions-tablefunc.test.ts",
  title: "tablefunc.all20NativeIdentitiesCrosstabConnectbyNormalRandAndRowTypes",
  gate: "database",
  families: [tablefuncProofFamily],
  claims: tablefuncMembers.map((member) => ({
    family: tablefuncProofFamily,
    member,
    scenario: "native-independent-sql-value-and-strict-null",
  })),
} satisfies ExtensionProofCase;

export const tablefuncGenerationProofCase = {
  id: "tablefunc.generation-contracts",
  file: "packages/e2e/integration/extension-tablefunc-codegen.test.ts",
  title: "tablefunc first load, disk import and 20 members through generated extensions",
  gate: "generation",
  families: [tablefuncProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const tablefuncProofSchema = 'table"func';
export const tablefuncDatabaseProofCases = [tablefuncNativeProofCase];
