import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const btreeGinProofFamily = {
  extension: "btree_gin",
  version: "1.3",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "c3c8db3d98f5b687408fa9feac34338a9ad5fc0308c713b709008cd5889b709e",
} as const satisfies ExtensionProofFamily;
export const btreeGinProofSchema = 'BtreeGin"花';
export const btreeGinNativeProofCase = {
  id: "btree_gin.native-indexes",
  file: "packages/e2e/integration/extensions-btree_gin.test.ts",
  title: "btree_gin 29 native classes and both callable comparisons, planner oracle and relocation",
  gate: "database",
  families: [btreeGinProofFamily],
  claims: [
    ...[
      "bit",
      "bool",
      "bpchar",
      "bytea",
      "char",
      "cidr",
      "date",
      "enum",
      "float4",
      "float8",
      "inet",
      "int2",
      "int4",
      "int8",
      "interval",
      "macaddr",
      "macaddr8",
      "money",
      "name",
      "numeric",
      "oid",
      "text",
      "time",
      "timestamp",
      "timestamptz",
      "timetz",
      "uuid",
      "varbit",
      "varchar",
    ].map((key) => ({
      family: btreeGinProofFamily,
      member: `opclass:$extension:btree_gin.${key}_ops/gin`,
      scenario: "native-migrated-class-five-strategies-index-mutation-sequential-oracle-and-relocation",
    })),
    ...[
      "gin_enum_cmp(pg_catalog.anyenum,pg_catalog.anyenum)",
      "gin_numeric_cmp(pg_catalog.numeric,pg_catalog.numeric)",
    ].map((signature) => ({
      family: btreeGinProofFamily,
      member: `routine:$extension:btree_gin.${signature}`,
      scenario: "native-callable-comparison-decoding-null-semantics-and-relocation",
    })),
  ],
} satisfies ExtensionProofCase;
export const btreeGinUnitProofCase = {
  id: "btree_gin.unit-contracts",
  file: "packages/tests/unit/extensions-btree_gin.test.ts",
  title: "btree_gin exact 1.3 contract admits all 29 captured classes and both callable routines",
  gate: "unit",
  families: [btreeGinProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const btreeGinTypesProofCase = {
  id: "btree_gin.types-contracts",
  file: "packages/tests/types/extensions-btree_gin.test-d.ts",
  title: "btree_gin exact literal pins, native enum and numeric arguments, and closed schema declarations",
  gate: "types",
  families: [btreeGinProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const btreeGinGenerationProofCase = {
  id: "btree_gin.generation-contracts",
  file: "packages/e2e/integration/extensions-btree_gin-generation.test.ts",
  title: "btree_gin first load and disk generated bindings preserve exact schema and query declarations",
  gate: "generation",
  families: [btreeGinProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const btreeGinConsumerProofCase = {
  id: "btree_gin.consumer-contracts",
  file: "packages/e2e/integration/packed-btree_gin.test.ts",
  title: "btree_gin isolated packed compiled exports, first generation, selected bundles and native execution",
  gate: "consumer",
  families: [btreeGinProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const btreeGinProofCases = [
  btreeGinNativeProofCase,
  btreeGinUnitProofCase,
  btreeGinTypesProofCase,
  btreeGinGenerationProofCase,
  btreeGinConsumerProofCase,
];
