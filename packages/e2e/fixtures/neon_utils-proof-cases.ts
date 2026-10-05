import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const neonUtilsProofFamily = {
  extension: "neon_utils",
  version: "1.1",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "4ceac79f87c6c16fa8dea371b441d6a150f9d25db3244b9bac4cce0275f74cec",
} as const;
export const neonUtilsMember = "routine:$extension:neon_utils.num_cpus()";
const base = { families: [neonUtilsProofFamily], claims: [] };
export const neonUtilsUnitProofCase: ExtensionProofCase = {
  ...base,
  id: "neon_utils.unit",
  gate: "unit",
  file: "packages/tests/unit/extensions-neon_utils.test.ts",
  title: "neon_utils exact identity, zero-argument SQL, int4 decoding and external observation",
};
export const neonUtilsTypesProofCase: ExtensionProofCase = {
  ...base,
  id: "neon_utils.types",
  gate: "types",
  file: "packages/tests/types/extensions-neon_utils.test-d.ts",
  title: "neon_utils literal descriptor and zero-argument number result",
};
export const neonUtilsDatabaseProofCase: ExtensionProofCase = {
  ...base,
  id: "neon_utils.native",
  gate: "database",
  file: "packages/e2e/integration/extensions-neon_utils.test.ts",
  title: "neon_utils native int4 observation, relocation, transactions and public privilege",
  claims: [
    { family: neonUtilsProofFamily, member: neonUtilsMember, scenario: "native-cpu-observation-and-relocation" },
  ],
};
export const neonUtilsGenerationProofCase: ExtensionProofCase = {
  ...base,
  id: "neon_utils.generation",
  gate: "generation",
  file: "packages/e2e/integration/extensions-neon_utils-generated.test.ts",
  title: "neon_utils first-load and disk generation preserve selected bindings",
};
export const neonUtilsConsumerProofCase: ExtensionProofCase = {
  ...base,
  id: "neon_utils.consumer",
  gate: "consumer",
  file: "packages/e2e/integration/packed-neon_utils.test.ts",
  title: "packed neon_utils frozen isolated consumer compiles and runs public generated bindings",
};
export const neonUtilsProofCases = [
  neonUtilsUnitProofCase,
  neonUtilsTypesProofCase,
  neonUtilsDatabaseProofCase,
  neonUtilsGenerationProofCase,
  neonUtilsConsumerProofCase,
];
type MemberProof = Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"][number];
export const neonUtilsMemberProofs: MemberProof[] = [
  {
    id: neonUtilsMember,
    disposition: "query",
    reason: "Native zero-argument CPU observation; external state never becomes a table revision or session mutation.",
    citations: [
      "apps/loom/src/tooling/extensions/manifests/neon_utils.json",
      "packages/e2e/integration/extensions-neon_utils.test.ts",
    ],
    cases: [{ caseId: neonUtilsDatabaseProofCase.id, scenario: "native-cpu-observation-and-relocation" }],
    transfers: [],
  },
];
