import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const h3PostgisProofFamily = {
  extension: "h3_postgis",
  version: "4.2.3",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "9803892394c3cec2d4305ca64a925baefbe37c9108e8bb2601c7f384575f481e",
} as const satisfies ExtensionProofFamily;

export const h3PostgisUnitProofCases = [
  {
    id: "h3_postgis.unit-contract",
    title: "h3_postgis 4.2.3 pins its exact 62-member contract and typed dependencies",
  },
  {
    id: "h3_postgis.unit-sql",
    title: "h3_postgis compiles qualified native SQL without JavaScript H3 or geometry math",
  },
].map(
  (entry) =>
    ({
      ...entry,
      file: "packages/tests/unit/extensions-h3-postgis.test.ts",
      gate: "unit",
      families: [h3PostgisProofFamily],
      claims: [],
    }) as const,
) satisfies ExtensionProofCase[];

export const h3PostgisTypesProofCase = {
  id: "h3_postgis.types-contracts",
  file: "packages/tests/types/extensions-h3-postgis.test-d.ts",
  title: "h3_postgis exact-version dependency descriptors and native argument types",
  gate: "types",
  families: [h3PostgisProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

/** Owned local PG18 oracle; claims stay empty until the parent re-captures the canonical manifest and records receipts. */
export const h3PostgisNativeProofCase = {
  id: "h3_postgis.native-characterization",
  file: "packages/e2e/scripts/run-h3-postgis-native-characterization.ts",
  title:
    "h3_postgis local PG18 native oracle (exact members, dependency search_path); not a generation, packed-consumer, or Neon gate",
  gate: "database",
  families: [h3PostgisProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const h3PostgisDatabaseProofCases = [h3PostgisNativeProofCase] satisfies ExtensionProofCase[];

/** Local evidence only. The parent owns registration, per-member reconciliation and acceptance receipts. */
export const h3PostgisAllMemberNativeProofCase = {
  id: "h3_postgis.native-all-members",
  file: "packages/e2e/scripts/run-h3-postgis-native-members.ts",
  title:
    "All 56 exact adapter/native SQL and decoded outputs, four schema fields, NULL/defaults and native search_path prerequisite on owned PG18",
  gate: "database",
  families: [h3PostgisProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const h3PostgisPreparedConsumerProofCase = {
  id: "h3_postgis.consumer-prepared-node24",
  file: "packages/e2e/scripts/run-h3-postgis-packed-node24.ts",
  title:
    "Prepared frozen tarball: five Bun public generation selections, exact prerequisites, cold Node24 all 56 overloads/fields and host/component RPC/Effect",
  gate: "consumer",
  families: [h3PostgisProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
