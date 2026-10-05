import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  roaringbitmapAnnotations,
  roaringbitmapSearchPathMembers,
} from "../../../apps/loom/src/tooling/extensions/annotations/roaringbitmap";

export const roaringbitmapProofFamily = {
  extension: "roaringbitmap",
  version: "1.2",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "967ad98be988b37be7f198057e9f02bcbe325a0eab5364722ba4c6763cbc406a",
} as const satisfies ExtensionProofFamily;
/** Proofs install into an adversarial quoted schema. */
export const roaringbitmapProofSchema = 'Roaring"位图';
const file = "packages/e2e/integration/extensions-roaringbitmap.test.ts";
type Disposition = (typeof roaringbitmapAnnotations)[number]["disposition"];
const ids = (disposition: Disposition, test: (id: string) => boolean) =>
  roaringbitmapAnnotations.filter((entry) => entry.disposition === disposition && test(entry.id)).map((entry) => entry.id);
const aggregate = (id: string) => /\.rb(?:64)?_\w+_agg\(/.test(id);
export const roaringbitmapScalarProofMembers = ids("query", (id) => !aggregate(id));
export const roaringbitmapAggregateProofMembers = ids("query", aggregate);
export const roaringbitmapTypeProofMembers = ids("schema", () => true);
const claims = (members: readonly string[], scenario: string) =>
  members.map((member) => ({ family: roaringbitmapProofFamily, member, scenario }));
export const roaringbitmapScalarProofCase = {
  id: "roaringbitmap.native-scalar",
  file,
  title: "roaringbitmap.allScalarOperatorCastAndRoutineIdentitiesAgainstNativeSqlAndStrictNull",
  gate: "database",
  families: [roaringbitmapProofFamily],
  claims: claims(roaringbitmapScalarProofMembers, "independent-native-array-output-and-strict-null"),
} satisfies ExtensionProofCase;
export const roaringbitmapAggregateProofCase = {
  id: "roaringbitmap.native-aggregates",
  file,
  title: "roaringbitmap.allAggregatesSerialParallelPartialEmptyAndNullGroups",
  gate: "database",
  families: [roaringbitmapProofFamily],
  claims: claims(roaringbitmapAggregateProofMembers, "serial-and-parallel-partial-aggregation-empty-and-null-groups"),
} satisfies ExtensionProofCase;
export const roaringbitmapSchemaProofCase = {
  id: "roaringbitmap.native-schema",
  file,
  title: "roaringbitmap.nativeFieldsArraysPortableBytesReceiveCallbacksAndBothOutputFormats",
  gate: "database",
  families: [roaringbitmapProofFamily],
  claims: claims(roaringbitmapTypeProofMembers, "live-member-transfer-slots-fields-arrays-binary-receive-and-both-output-formats"),
} satisfies ExtensionProofCase;
export const roaringbitmapSessionProofCase = {
  id: "roaringbitmap.native-search-path-session",
  file,
  title: "roaringbitmap.searchPathMembersThroughOwnedOperatorSessionWithoutSessionPath",
  gate: "database",
  families: [roaringbitmapProofFamily],
  claims: claims([...roaringbitmapSearchPathMembers], "owned-operator-session-transaction-local-search-path"),
} satisfies ExtensionProofCase;
export const roaringbitmapDatabaseProofCases = [
  roaringbitmapScalarProofCase,
  roaringbitmapAggregateProofCase,
  roaringbitmapSchemaProofCase,
  roaringbitmapSessionProofCase,
] satisfies ExtensionProofCase[];
export const roaringbitmapUnitProofCase = {
  id: "roaringbitmap.unit-contracts",
  file: "packages/tests/unit/extensions-roaringbitmap.test.ts",
  title: "roaringbitmap exact pin, required API and selected generation contracts",
  gate: "unit",
  families: [roaringbitmapProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const roaringbitmapTypesProofCase = {
  id: "roaringbitmap.types-contracts",
  file: "packages/tests/types/extensions-roaringbitmap.test-d.ts",
  title: "roaringbitmap exact int4/int8 member, overload, array and nullable declarations",
  gate: "types",
  families: [roaringbitmapProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const roaringbitmapGenerationProofCase = {
  id: "roaringbitmap.generation-contracts",
  file: "packages/e2e/integration/extension-roaringbitmap-codegen.test.ts",
  title: "roaringbitmap first load retains every overload through mounted RPC and Effect",
  gate: "generation",
  families: [roaringbitmapProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const roaringbitmapConsumerProofCase = {
  id: "roaringbitmap.consumer-contracts",
  file: "packages/e2e/integration/packed-roaringbitmap.test.ts",
  title: "roaringbitmap isolated packed overloads, native RPC and selected bundles",
  gate: "consumer",
  families: [roaringbitmapProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const roaringbitmapProofCases = [
  ...roaringbitmapDatabaseProofCases,
  roaringbitmapUnitProofCase,
  roaringbitmapTypesProofCase,
  roaringbitmapGenerationProofCase,
  roaringbitmapConsumerProofCase,
];

type MemberProof = Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"][number];
/** Internal callbacks transfer from the exact captured parent whose database claim executes them. */
export function roaringbitmapMemberProofs(): MemberProof[] {
  const scenarios = (member: string) => {
    const found = roaringbitmapDatabaseProofCases.flatMap((definition) =>
      definition.claims
        .filter((entry) => entry.member === member)
        .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
    );
    if (found.length === 0) throw new Error(`roaringbitmap member lacks a database claim: ${member}`);
    return found;
  };
  return roaringbitmapAnnotations.map((annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: annotation.disposition === "internal" ? [] : scenarios(annotation.id),
    transfers:
      "proofTransfer" in annotation
        ? annotation.proofTransfer.from.map((from) => ({
            from,
            relation: annotation.proofTransfer.relation,
            ...scenarios(from)[0]!,
            basis: annotation.proofTransfer.basis,
          }))
        : [],
  }));
}
