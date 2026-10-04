import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const semverProofFamily = {
  extension: "semver",
  version: "0.40.0",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "5a21997dcf96a0af38e49bc1d9309905050a05f18e6afe15f37fb2a63722a86e",
} satisfies ExtensionProofFamily;
export const semverProofSchema = 'custom"semver';
export const semverNativeProofClaims = {
  semver_send: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver_send($extension:semver.semver)",
    scenario: "native-binary-send-build-metadata-and-strict-null",
  },
  cast_text: {
    family: semverProofFamily,
    member: "cast:$extension:semver.semver->pg_catalog.text",
    scenario: "explicit-text-cast-keeps-build-metadata",
  },
  cast_multirange: {
    family: semverProofFamily,
    member: "cast:$extension:semver.semverrange->$extension:semver.semvermultirange",
    scenario: "range-to-multirange-cast-and-empty",
  },
  cast_float4: {
    family: semverProofFamily,
    member: "cast:pg_catalog.float4->$extension:semver.semver",
    scenario: "float4-cast-coercion",
  },
  cast_float8: {
    family: semverProofFamily,
    member: "cast:pg_catalog.float8->$extension:semver.semver",
    scenario: "float8-cast-coercion",
  },
  cast_int2: {
    family: semverProofFamily,
    member: "cast:pg_catalog.int2->$extension:semver.semver",
    scenario: "int2-cast-coercion",
  },
  cast_int4: {
    family: semverProofFamily,
    member: "cast:pg_catalog.int4->$extension:semver.semver",
    scenario: "int4-cast-coercion",
  },
  cast_int8: {
    family: semverProofFamily,
    member: "cast:pg_catalog.int8->$extension:semver.semver",
    scenario: "int8-cast-coercion",
  },
  cast_numeric: {
    family: semverProofFamily,
    member: "cast:pg_catalog.numeric->$extension:semver.semver",
    scenario: "numeric-cast-coercion",
  },
  cast_from_text: {
    family: semverProofFamily,
    member: "cast:pg_catalog.text->$extension:semver.semver",
    scenario: "strict-text-cast",
  },
  operator_lt: {
    family: semverProofFamily,
    member: "operator:$extension:semver.<($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-operator-filter-and-null",
  },
  operator_le: {
    family: semverProofFamily,
    member: "operator:$extension:semver.<=($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-operator-filter-and-null",
  },
  operator_ne: {
    family: semverProofFamily,
    member: "operator:$extension:semver.<>($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-operator-filter-and-null",
  },
  operator_eq: {
    family: semverProofFamily,
    member: "operator:$extension:semver.=($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-operator-filter-and-null",
  },
  operator_gt: {
    family: semverProofFamily,
    member: "operator:$extension:semver.>($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-operator-filter-and-null",
  },
  operator_ge: {
    family: semverProofFamily,
    member: "operator:$extension:semver.>=($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-operator-filter-and-null",
  },
  get_semver_major: {
    family: semverProofFamily,
    member: "routine:$extension:semver.get_semver_major($extension:semver.semver)",
    scenario: "component-and-strict-null",
  },
  get_semver_minor: {
    family: semverProofFamily,
    member: "routine:$extension:semver.get_semver_minor($extension:semver.semver)",
    scenario: "component-and-strict-null",
  },
  get_semver_patch: {
    family: semverProofFamily,
    member: "routine:$extension:semver.get_semver_patch($extension:semver.semver)",
    scenario: "component-and-strict-null",
  },
  get_semver_prerelease: {
    family: semverProofFamily,
    member: "routine:$extension:semver.get_semver_prerelease($extension:semver.semver)",
    scenario: "component-and-strict-null",
  },
  hash_semver: {
    family: semverProofFamily,
    member: "routine:$extension:semver.hash_semver($extension:semver.semver)",
    scenario: "component-and-strict-null",
  },
  is_semver: {
    family: semverProofFamily,
    member: "routine:$extension:semver.is_semver(pg_catalog.text)",
    scenario: "strict-validity-and-null",
  },
  max: {
    family: semverProofFamily,
    member: "routine:$extension:semver.max($extension:semver.semver)",
    scenario: "aggregate-precedence-and-empty-null",
  },
  min: {
    family: semverProofFamily,
    member: "routine:$extension:semver.min($extension:semver.semver)",
    scenario: "aggregate-precedence-and-empty-null",
  },
  semver_cmp: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver_cmp($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-routine-and-strict-null",
  },
  semver_eq: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver_eq($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-routine-and-strict-null",
  },
  semver_ge: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver_ge($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-routine-and-strict-null",
  },
  semver_gt: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver_gt($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-routine-and-strict-null",
  },
  semver_larger: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver_larger($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-routine-and-strict-null",
  },
  semver_le: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver_le($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-routine-and-strict-null",
  },
  semver_lt: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver_lt($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-routine-and-strict-null",
  },
  semver_ne: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver_ne($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-routine-and-strict-null",
  },
  semver_smaller: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver_smaller($extension:semver.semver,$extension:semver.semver)",
    scenario: "precedence-routine-and-strict-null",
  },
  semver_float4: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver(pg_catalog.float4)",
    scenario: "exact-float4-overload-coercion-and-null",
  },
  semver_float8: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver(pg_catalog.float8)",
    scenario: "exact-float8-overload-coercion-and-null",
  },
  semver_int2: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver(pg_catalog.int2)",
    scenario: "exact-int2-overload-coercion-and-null",
  },
  semver_int4: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver(pg_catalog.int4)",
    scenario: "exact-int4-overload-coercion-and-null",
  },
  semver_int8: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver(pg_catalog.int8)",
    scenario: "exact-int8-overload-coercion-and-null",
  },
  semver_numeric: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver(pg_catalog.numeric)",
    scenario: "exact-numeric-overload-coercion-and-null",
  },
  semver_text: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semver(pg_catalog.text)",
    scenario: "exact-text-overload-coercion-and-null",
  },
  multirange_empty: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semvermultirange()",
    scenario: "empty-multirange",
  },
  multirange_variadic: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semvermultirange($extension:semver._semverrange)",
    scenario: "variadic-sort-merge",
  },
  multirange_range: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semvermultirange($extension:semver.semverrange)",
    scenario: "single-range-and-null",
  },
  range_flags: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semverrange($extension:semver.semver,$extension:semver.semver,pg_catalog.text)",
    scenario: "bound-flags-and-infinite-null-bounds",
  },
  range: {
    family: semverProofFamily,
    member: "routine:$extension:semver.semverrange($extension:semver.semver,$extension:semver.semver)",
    scenario: "default-bounds-and-infinite-null-bounds",
  },
  text: {
    family: semverProofFamily,
    member: "routine:$extension:semver.text($extension:semver.semver)",
    scenario: "text-routine-keeps-build-metadata",
  },
  to_semver: {
    family: semverProofFamily,
    member: "routine:$extension:semver.to_semver(pg_catalog.text)",
    scenario: "lenient-coercion-and-null",
  },
};
export const semverSchemaProofClaims = {
  semver: {
    family: semverProofFamily,
    member: "type:$extension:semver.semver",
    scenario: "field-storage-filter-order",
  },
  semverArray: { family: semverProofFamily, member: "type:$extension:semver._semver", scenario: "array-field-bounds" },
  semverrange: {
    family: semverProofFamily,
    member: "type:$extension:semver.semverrange",
    scenario: "range-field-flags",
  },
  semverrangeArray: {
    family: semverProofFamily,
    member: "type:$extension:semver._semverrange",
    scenario: "range-array-field",
  },
  semvermultirange: {
    family: semverProofFamily,
    member: "type:$extension:semver.semvermultirange",
    scenario: "multirange-field-normalization",
  },
  semvermultirangeArray: {
    family: semverProofFamily,
    member: "type:$extension:semver._semvermultirange",
    scenario: "multirange-array-field",
  },
  btree: { family: semverProofFamily, member: "opclass:$extension:semver.semver_ops/btree", scenario: "btree-index" },
  hash: { family: semverProofFamily, member: "opclass:$extension:semver.semver_ops/hash", scenario: "hash-index" },
};
const nativeFile = "packages/e2e/integration/extensions-semver.test.ts";
export const semverNativeProofCase = {
  id: "semver.native-semantics",
  file: nativeFile,
  title: "semver all 47 public routines, operators and casts decode and compose inside a Kello transaction",
  gate: "database",
  families: [semverProofFamily],
  claims: Object.values(semverNativeProofClaims),
} satisfies ExtensionProofCase;
export const semverSchemaProofCase = {
  id: "semver.native-schema",
  file: nativeFile,
  title: "semver fields, arrays, ranges, multiranges and default indexes round-trip native storage",
  gate: "database",
  families: [semverProofFamily],
  claims: Object.values(semverSchemaProofClaims),
} satisfies ExtensionProofCase;
export const semverGrammarProofCase = {
  id: "semver.native-grammar",
  file: nativeFile,
  title: "semver codec grammar equals native semver_out fixed points, with decode-failure rollback",
  gate: "database",
  families: [semverProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const semverSessionProofCase = {
  id: "semver.operator-session",
  file: nativeFile,
  title: "semver numeric constructors and casts run on an owned operator backend with transaction-local search_path",
  gate: "database",
  families: [semverProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const semverDatabaseProofCases = [
  semverNativeProofCase,
  semverSchemaProofCase,
  semverGrammarProofCase,
  semverSessionProofCase,
];
export const semverUnitProofCase = {
  id: "semver.unit-contracts",
  file: "packages/tests/unit/extensions-semver.test.ts",
  title: "semver exact pin, required API and generated selection contracts",
  gate: "unit",
  families: [semverProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const semverTypesProofCase = {
  id: "semver.types-contracts",
  file: "packages/tests/types/extensions-semver.test-d.ts",
  title: "semver public and generated exact overloads, ranges and nullable declarations",
  gate: "types",
  families: [semverProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const semverGenerationProofCase = {
  id: "semver.generation-first-load-disk",
  file: "packages/e2e/integration/extension-semver-codegen.test.ts",
  title: "semver.firstLoadVirtualThenDiskGenerationSchemaIndexesAndRpcEffect",
  gate: "generation",
  families: [semverProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const semverConsumerProofCase = {
  id: "semver.consumer-contracts",
  file: "packages/e2e/integration/packed-semver.test.ts",
  title: "semver isolated packed overloads, native RPC and selected bundles",
  gate: "consumer",
  families: [semverProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const semverProofCases = [
  ...semverDatabaseProofCases,
  semverUnitProofCase,
  semverTypesProofCase,
  semverGenerationProofCase,
  semverConsumerProofCase,
] satisfies ExtensionProofCase[];
