import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { addressStandardizerDataUsAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/address-standardizer-data-us";

export const addressStandardizerDataUsProofFamily = {
  extension: "address_standardizer_data_us",
  version: "3.6.4",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "063cb37742a0baf3dd885cb96255db38daf06b13d3b75fd7232b81822a7f01d0",
} as const;
const base = { families: [addressStandardizerDataUsProofFamily], claims: [] };
export const addressStandardizerDataUsUnitProofCases = [
  {
    ...base,
    id: "address_standardizer_data_us.unit-contracts",
    gate: "unit",
    file: "packages/tests/unit/extensions-address-standardizer-data-us.test.ts",
    title: "data_us exact 60-member identity and native dispositions",
  },
  {
    ...base,
    id: "address_standardizer_data_us.unit-codecs",
    gate: "unit",
    file: "packages/tests/unit/extensions-address-standardizer-data-us.test.ts",
    title: "data_us native rows and sequences preserve codecs and observations",
  },
] as const satisfies readonly ExtensionProofCase[];
export const addressStandardizerDataUsTypesProofCase = {
  ...base,
  id: "address_standardizer_data_us.types",
  gate: "types",
  file: "packages/tests/types/extensions-address-standardizer-data-us.test-d.ts",
  title: "data_us exact version row array fields sources and sequence bigint",
} as const satisfies ExtensionProofCase;

// Native script is local characterization. Parent must collect authoritative database witnesses;
// a source-import script or this declaration alone does not satisfy the canonical gate.
export const addressStandardizerDataUsDatabaseProofCase = {
  ...base,
  id: "address_standardizer_data_us.native",
  gate: "database",
  file: "packages/e2e/integration/extensions-address-standardizer-data-us.test.ts",
  title: "data_us native 60-member schema seeds privileges and composite array I/O",
  claims: addressStandardizerDataUsAnnotations.map((member) => ({
    family: addressStandardizerDataUsProofFamily,
    member: member.id,
    scenario: "native-installed-data-us-schema-seeds-type-io-and-restricted-reads",
  })),
} satisfies ExtensionProofCase;
export const addressStandardizerDataUsGenerationProofCase = {
  ...base,
  id: "address_standardizer_data_us.generation",
  gate: "generation",
  file: "packages/e2e/integration/extensions-address-standardizer-data-us-generated.test.ts",
  title: "data_us public initialize/load/generate first-load disk and typed native RPC/Effect",
} as const satisfies ExtensionProofCase;
export const addressStandardizerDataUsConsumerProofCase = {
  ...base,
  id: "address_standardizer_data_us.consumer",
  gate: "consumer",
  file: "packages/e2e/integration/packed-address-standardizer-data-us.test.ts",
  title: "data_us parent-frozen artifact public generation and cold Node24 native RPC/Effect",
} as const satisfies ExtensionProofCase;
export const addressStandardizerDataUsProofCases = [
  ...addressStandardizerDataUsUnitProofCases,
  addressStandardizerDataUsTypesProofCase,
  addressStandardizerDataUsDatabaseProofCase,
  addressStandardizerDataUsGenerationProofCase,
  addressStandardizerDataUsConsumerProofCase,
];
type MemberProof = Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"][number];
export const addressStandardizerDataUsMemberProofs: MemberProof[] = addressStandardizerDataUsAnnotations.map(
  (annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: [
      {
        caseId: addressStandardizerDataUsDatabaseProofCase.id,
        scenario: "native-installed-data-us-schema-seeds-type-io-and-restricted-reads",
      },
    ],
    transfers: [],
  }),
);

export const addressStandardizerDataUsNativeSeeds = [
  { name: "us_lex", count: 2940, custom: 0, hash: "bc4bf0ee235cefc05112bdba1ff17b51" },
  { name: "us_gaz", count: 1074, custom: 0, hash: "bf30d6ac003de7b027bad341002e1c26" },
  { name: "us_rules", count: 4369, custom: 0, hash: "9388e43a86c3b26ea1eaca6f698d1d14" },
] as const;
