import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const btreeGistProofFamily = {
  extension: "btree_gist",
  version: "1.8",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "73fdb4831683ee8042ecbcd0d0639909650d018d6c7ca51bb85c1cb38de96072",
} as const satisfies ExtensionProofFamily;
export const btreeGistProofSchema = 'BtreeGist"花';
/** [index key, opclass] for every captured class. */
export const btreeGistClasses = [
  ["bit", "gist_bit_ops"],
  ["bool", "gist_bool_ops"],
  ["bpchar", "gist_bpchar_ops"],
  ["bytea", "gist_bytea_ops"],
  ["cidr", "gist_cidr_ops"],
  ["date", "gist_date_ops"],
  ["enum", "gist_enum_ops"],
  ["float4", "gist_float4_ops"],
  ["float8", "gist_float8_ops"],
  ["inet", "gist_inet_ops"],
  ["int2", "gist_int2_ops"],
  ["int4", "gist_int4_ops"],
  ["int8", "gist_int8_ops"],
  ["interval", "gist_interval_ops"],
  ["macaddr", "gist_macaddr_ops"],
  ["macaddr8", "gist_macaddr8_ops"],
  ["money", "gist_cash_ops"],
  ["numeric", "gist_numeric_ops"],
  ["oid", "gist_oid_ops"],
  ["text", "gist_text_ops"],
  ["time", "gist_time_ops"],
  ["timestamp", "gist_timestamp_ops"],
  ["timestamptz", "gist_timestamptz_ops"],
  ["timetz", "gist_timetz_ops"],
  ["uuid", "gist_uuid_ops"],
  ["varbit", "gist_vbit_ops"],
] as const;
/** [function, native type] for every captured distance routine and its <-> operator. */
export const btreeGistDistances = [
  ["cash_dist", "money"],
  ["date_dist", "date"],
  ["float4_dist", "float4"],
  ["float8_dist", "float8"],
  ["int2_dist", "int2"],
  ["int4_dist", "int4"],
  ["int8_dist", "int8"],
  ["interval_dist", "interval"],
  ["oid_dist", "oid"],
  ["time_dist", "time"],
  ["ts_dist", "timestamp"],
  ["tstz_dist", "timestamptz"],
] as const;
export const btreeGistClassScenario = "native-migrated-class-six-strategies-knn-index-mutation-sequential-oracle-and-relocation";
export const btreeGistNativeProofCase = {
  id: "btree_gist.native-indexes",
  file: "packages/e2e/integration/extensions-btree_gist.test.ts",
  title: "btree_gist 26 native classes, 13 callable routines and 12 distance operators, planner oracle and relocation",
  gate: "database",
  families: [btreeGistProofFamily],
  claims: [
    ...btreeGistClasses.map(([, opclass]) => ({
      family: btreeGistProofFamily,
      member: `opclass:$extension:btree_gist.${opclass}/gist`,
      scenario: btreeGistClassScenario,
    })),
    ...btreeGistDistances.map(([name, type]) => ({
      family: btreeGistProofFamily,
      member: `routine:$extension:btree_gist.${name}(pg_catalog.${type},pg_catalog.${type})`,
      scenario: "native-callable-distance-decoding-null-overflow-and-relocation",
    })),
    ...btreeGistDistances.map(([, type]) => ({
      family: btreeGistProofFamily,
      member: `operator:$extension:btree_gist.<->(pg_catalog.${type},pg_catalog.${type})`,
      scenario: "native-distance-operator-decoding-knn-order-and-relocation",
    })),
    {
      family: btreeGistProofFamily,
      member: "routine:$extension:btree_gist.gist_translate_cmptype_btree(pg_catalog.int4)",
      scenario: "native-callable-cmptype-translation-and-relocation",
    },
  ],
} satisfies ExtensionProofCase;
export const btreeGistUnitProofCase = {
  id: "btree_gist.unit-contracts",
  file: "packages/tests/unit/extensions-btree_gist.test.ts",
  title: "btree_gist exact 1.8 contract admits all 26 captured classes, 13 callable routines and 12 operators",
  gate: "unit",
  families: [btreeGistProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const btreeGistTypesProofCase = {
  id: "btree_gist.types-contracts",
  file: "packages/tests/types/extensions-btree_gist.test-d.ts",
  title: "btree_gist exact literal pins, closed typed declarations and callable codecs",
  gate: "types",
  families: [btreeGistProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const btreeGistGenerationProofCase = {
  id: "btree_gist.generation-contracts",
  file: "packages/e2e/integration/extensions-btree_gist-generation.test.ts",
  title: "btree_gist first load and disk generated bindings preserve exact declarations and callables",
  gate: "generation",
  families: [btreeGistProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const btreeGistConsumerProofCase = {
  id: "btree_gist.consumer-contracts",
  file: "packages/e2e/integration/packed-btree_gist.test.ts",
  title: "btree_gist isolated packed compiled exports and selected literal declarations",
  gate: "consumer",
  families: [btreeGistProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const btreeGistProofCases = [
  btreeGistNativeProofCase,
  btreeGistUnitProofCase,
  btreeGistTypesProofCase,
  btreeGistGenerationProofCase,
  btreeGistConsumerProofCase,
];
