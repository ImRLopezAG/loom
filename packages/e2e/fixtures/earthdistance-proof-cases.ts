import type {
  ExtensionProofCase,
  ExtensionProofFamily,
  ExtensionProofDeclaration,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { earthdistanceAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/earthdistance";

export const earthdistanceProofFamily = {
  extension: "earthdistance",
  version: "1.2",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "13bae0f141ff6fb7a7e4253e02958e7b6dd18c82db9b51c03bf12605df99fcd6",
} as const satisfies ExtensionProofFamily;
export const earthdistanceProofSchema = "Earth日本";
const file = "packages/e2e/integration/extensions-earthdistance.test.ts";
export const earthdistanceOrdinaryProofCase = {
  id: "earthdistance.native-ordinary",
  file,
  title: "Earthdistance exhaustive native overloads, NULL and unit semantics",
  gate: "database",
  families: [earthdistanceProofFamily],
  claims: earthdistanceAnnotations
    .filter((row) => row.disposition === "query")
    .map((row) => ({
      family: earthdistanceProofFamily,
      member: row.id,
      scenario: "native-independent-overload-and-strict-null-oracle",
    })),
} satisfies ExtensionProofCase;
export const earthdistanceDomainProofCase = {
  id: "earthdistance.native-domain-storage",
  file,
  title: "Earthdistance domain constraints, inherited transfer and native array storage",
  gate: "database",
  families: [earthdistanceProofFamily],
  claims: [
    {
      family: earthdistanceProofFamily,
      member: "type:$extension:earthdistance.earth",
      scenario: "native-domain-constraints-rollback-equal-corner-compression-text-binary-transfer-and-snapshot",
    },
    {
      family: earthdistanceProofFamily,
      member: "type:$extension:earthdistance._earth",
      scenario: "native-array-multidimensional-bounds-null-text-binary-transfer-and-snapshot",
    },
  ],
} satisfies ExtensionProofCase;
export const earthdistanceCompositionProofCase = {
  id: "earthdistance.native-index-candidates",
  file,
  title: "Earthdistance earth_box candidate search retains exact radius recheck",
  gate: "database",
  families: [earthdistanceProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const earthdistanceDatabaseProofCases = [
  earthdistanceOrdinaryProofCase,
  earthdistanceDomainProofCase,
  earthdistanceCompositionProofCase,
] satisfies ExtensionProofCase[];
export const earthdistanceDatabaseFixtureCount = 3;
export const earthdistanceDatabaseRoleCount = 0;
export const earthdistanceUnitProofCases = [
  { id: "earthdistance.unit-contracts", title: "earthdistance exact manifest coverage and dependency identity" },
  { id: "earthdistance.unit-transport", title: "earth domain transport preserves cube shape and native array bounds" },
  {
    id: "earthdistance.unit-composition",
    title: "unit-specific helpers bind native points longitude first and nested earth results",
  },
].map(
  (entry) =>
    ({
      ...entry,
      file: "packages/tests/unit/extensions-earthdistance.test.ts",
      gate: "unit",
      families: [earthdistanceProofFamily],
      claims: [],
    }) as const,
) satisfies ExtensionProofCase[];
export const earthdistanceTypesProofCase = {
  id: "earthdistance.types-contracts",
  file: "packages/tests/types/extensions-earthdistance.test-d.ts",
  title: "earthdistance public exact-version dependency and native unit declarations",
  gate: "types",
  families: [earthdistanceProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
type MemberProof = Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"][number];
export const earthdistanceMemberProofs: MemberProof[] = earthdistanceAnnotations.map((annotation) => {
  const cases = earthdistanceDatabaseProofCases.flatMap((definition) =>
    definition.claims
      .filter((claim) => claim.member === annotation.id)
      .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
  );
  if (annotation.disposition !== "internal" && cases.length !== 1)
    throw new Error(`Missing exact Earthdistance native proof: ${annotation.id}`);
  const parent = earthdistanceDomainProofCase.claims.find(
    (claim) => claim.member === "type:$extension:earthdistance.earth",
  )!;
  return {
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases,
    transfers:
      annotation.disposition === "internal"
        ? [
            {
              from: parent.member,
              relation: { kind: "domain-constraint" },
              caseId: earthdistanceDomainProofCase.id,
              scenario: parent.scenario,
              basis:
                "Exact captured subordinate domain-constraint identity and definition; native domain parent executes each named rejecting constraint with rollback and valid compressed-point/text/binary controls.",
            },
          ]
        : [],
  };
});
