import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const prefixProofFamily = {
  extension: "prefix",
  version: "1.2.0",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "954698fcbe5ada03bdf4bcbd9b22014e77570456f0d8471d4ca2bd99d75581a7",
} as const satisfies ExtensionProofFamily;
export const prefixProofSchema = 'Prefix"日本';

const file = "packages/e2e/integration/extensions-prefix.test.ts";
export const prefixOrdinaryProofMembers = [
  "cast:$extension:prefix.prefix_range->pg_catalog.text",
  "cast:pg_catalog.text->$extension:prefix.prefix_range",
  "operator:$extension:prefix.@>($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "operator:$extension:prefix.&($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "operator:$extension:prefix.&&($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "operator:$extension:prefix.<($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "operator:$extension:prefix.<@($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "operator:$extension:prefix.<=($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "operator:$extension:prefix.<>($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "operator:$extension:prefix.=($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "operator:$extension:prefix.>($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "operator:$extension:prefix.>=($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "operator:$extension:prefix.|($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.length($extension:prefix.prefix_range)",
  "routine:$extension:prefix.pr_penalty($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_cmp($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_contained_by_strict($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_contained_by($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_contains_strict($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_contains($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_eq($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_ge($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_gt($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_inter($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_le($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_lt($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_neq($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_overlaps($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_send($extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range_union($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  "routine:$extension:prefix.prefix_range(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:prefix.prefix_range(pg_catalog.text)",
  "routine:$extension:prefix.text($extension:prefix.prefix_range)",
] as const;

export const prefixOrdinaryProofCase = {
  id: "prefix.native-ordinary",
  file,
  title: "prefix.all33NativeIdentitiesAndStrictNull",
  gate: "database",
  families: [prefixProofFamily],
  claims: prefixOrdinaryProofMembers.map((member) => ({
    family: prefixProofFamily,
    member,
    scenario: "independent-native-sql-and-strict-null",
  })),
} satisfies ExtensionProofCase;

export const prefixCanonicalProofCase = {
  id: "prefix.native-canonical-text",
  file,
  title: "prefix.nativeCanonicalTextRoundtripAndRangeNormalize",
  gate: "database",
  families: [prefixProofFamily],
  claims: [
    {
      family: prefixProofFamily,
      member: "type:$extension:prefix.prefix_range",
      scenario: "canonical-text-roundtrip-range-fold-swap-and-empty-bounds",
    },
  ],
} satisfies ExtensionProofCase;

export const prefixSchemaIndexProofCase = {
  id: "prefix.native-schema-indexes",
  file,
  title: "prefix.nativeFieldsArraysDefaultsSnapshotsAndIndexCallbacks",
  gate: "database",
  families: [prefixProofFamily],
  claims: [
    "type:$extension:prefix._prefix_range",
    "opclass:$extension:prefix.btree_prefix_range_ops/btree",
    "opclass:$extension:prefix.gist_prefix_range_ops/gist",
  ].map((member) => ({
    family: prefixProofFamily,
    member,
    scenario: "native-schema-array-six-ranks-and-indexed-versus-sequential-oracles",
  })),
} satisfies ExtensionProofCase;

export const prefixCompositionProofCase = {
  id: "prefix.native-composition",
  file,
  title: "prefix.nativeErrorsRollbackAndSQLComposition",
  gate: "database",
  families: [prefixProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const prefixUnregisteredInternalMembers = [
  "routine:$extension:prefix.gpr_consistent(pg_catalog.internal,$extension:prefix.prefix_range,pg_catalog.int2,pg_catalog.oid)",
  "routine:$extension:prefix.gpr_picksplit_jordan(pg_catalog.internal,pg_catalog.internal)",
  "routine:$extension:prefix.gpr_picksplit_presort(pg_catalog.internal,pg_catalog.internal)",
] as const;
export const prefixNativeGraphProofCase = {
  id: "prefix.native-unregistered-callbacks",
  file,
  title: "prefix.unregisteredInternalArgumentCallbacksHaveNoNativeCatalogOwner",
  gate: "database",
  families: [prefixProofFamily],
  claims: prefixUnregisteredInternalMembers.map((member) => ({
    family: prefixProofFamily,
    member,
    scenario: "exact-native-internal-signature-and-no-registered-owner",
  })),
} satisfies ExtensionProofCase;

export const prefixDatabaseProofCases = [
  prefixOrdinaryProofCase,
  prefixCanonicalProofCase,
  prefixSchemaIndexProofCase,
  prefixCompositionProofCase,
  prefixNativeGraphProofCase,
] satisfies ExtensionProofCase[];
export const prefixDatabaseFixtureCount = 5;
export const prefixDatabaseRoleCount = 0;

export const prefixUnitProofCase = {
  id: "prefix.unit-contracts",
  file: "packages/tests/unit/extensions-prefix.test.ts",
  title: "prefix.canonicalTextTokensArrayBoundsAndStrictGrammar",
  gate: "unit",
  families: [prefixProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const prefixMembershipUnitProofCase = {
  id: "prefix.unit-membership",
  file: "packages/tests/unit/extensions-prefix.test.ts",
  title: "prefix.exact69Members33CallableIdentitiesAndQualifiedSQL",
  gate: "unit",
  families: [prefixProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const prefixUnitProofCases = [prefixUnitProofCase, prefixMembershipUnitProofCase] satisfies ExtensionProofCase[];

export const prefixTypesProofCase = {
  id: "prefix.types-contracts",
  file: "packages/tests/types/extensions-prefix.test-d.ts",
  title: "prefix.all33NativeSignaturesAndNegativeContracts",
  gate: "types",
  families: [prefixProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const prefixGenerationProofCase = {
  id: "prefix.generation-first-load-disk",
  file: "packages/e2e/integration/extension-prefix-codegen.test.ts",
  title: "prefix.firstLoadVirtualThenDiskGenerationSchemaIndexesAndRpcEffect",
  gate: "generation",
  families: [prefixProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const prefixConsumerProofCase = {
  id: "prefix.consumer-packed-tarball",
  file: "packages/e2e/integration/packed-prefix.test.ts",
  title: "prefix.isolatedTarballColdFrozenConsumerPublicExportAndNative",
  gate: "consumer",
  families: [prefixProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const prefixProofCases = [
  ...prefixDatabaseProofCases,
  ...prefixUnitProofCases,
  prefixTypesProofCase,
  prefixGenerationProofCase,
  prefixConsumerProofCase,
] satisfies ExtensionProofCase[];
