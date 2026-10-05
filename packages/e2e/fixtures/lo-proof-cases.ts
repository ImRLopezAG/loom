import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { loAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/lo";
export const loProofFamily = {
  extension: "lo",
  version: "1.2",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "84324b728d596a8bdef3088c411f769edab611e4a4a776070372f5e890d96ba1",
} as const satisfies ExtensionProofFamily;
export const loDatabaseProofCase: ExtensionProofCase = {
  id: "lo.native",
  gate: "database",
  families: [loProofFamily],
  file: "packages/e2e/integration/extensions-lo.test.ts",
  title: "lo native domain/array/trigger and owned byte workflows preserve transaction and session lifetime",
  claims: [
    {
      family: loProofFamily,
      member: "routine:$extension:lo.lo_manage()",
      scenario: "native-trigger-unlink-and-rollback",
    },
    {
      family: loProofFamily,
      member: "routine:$extension:lo.lo_oid($extension:lo.lo)",
      scenario: "native-domain-oid-and-strict-null",
    },
    { family: loProofFamily, member: "type:$extension:lo._lo", scenario: "native-array-bounds-and-null-elements" },
    { family: loProofFamily, member: "type:$extension:lo.lo", scenario: "native-domain-oid-and-strict-null" },
  ],
};
export const loDatabaseProofCases: ExtensionProofCase[] = [loDatabaseProofCase];
export const loDatabaseFixtureCount = 1;
export const loDatabaseRoleCount = 0;
export const loUnitProofCases: ExtensionProofCase[] = [
  "lo domain decodes unsigned OIDs without rounding or coercion",
  "lo captured members all have a disposition and tooling rejects wrong contracts before connection",
  "lo fields and unique-reference triggers retain exact qualified identities",
].map((title, index) => ({
  id: `lo.unit-${index + 1}`,
  gate: "unit",
  families: [loProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-lo.test.ts",
  title,
}));
export const loTypesProofCase: ExtensionProofCase = {
  id: "lo.types",
  gate: "types",
  families: [loProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-lo.test-d.ts",
  title: "lo exact application and trusted operator type boundaries",
};
export const loMemberProofs: Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"] = loAnnotations.map(
  (annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: loDatabaseProofCases.flatMap((definition) =>
      definition.claims
        .filter((claim) => claim.member === annotation.id)
        .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
    ),
    transfers: [],
  }),
);
