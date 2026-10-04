import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { pgTrgmAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg-trgm";

export const pgTrgmProofFamily = {
  extension: "pg_trgm",
  version: "1.6",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "88e35b55b09e58d6a59847390006ca73483bdb4444346474beb644c63adcbe66",
} as const satisfies ExtensionProofFamily;
/** Native gate installation schema; generation separately proves default and custom placements. */
export const pgTrgmProofSchema = "search";

export const pgTrgmMembers = pgTrgmAnnotations.map((annotation) => annotation.id);
export const pgTrgmQueryMembers = pgTrgmAnnotations
  .filter((annotation) => annotation.disposition === "query")
  .map((annotation) => annotation.id);

/** One scenario per witness kind; the native case asserts each against the live catalog graph and execution. */
export function pgTrgmScenario(member: string): string {
  const annotation = pgTrgmAnnotations.find((entry) => entry.id === member);
  if (!annotation) throw new Error(`Unknown pg_trgm member: ${member}`);
  if (annotation.disposition === "query") return "restricted-native-oracle-and-live-graph";
  if (annotation.disposition === "tooling") return "operator-session-threshold-and-live-graph";
  if (annotation.disposition === "schema") return "migrated-index-scan-and-live-graph";
  if (member.startsWith("operator of access method:")) return "index-strategy-scan-and-live-graph";
  if (member.startsWith("function of access method:")) return "index-support-procedure-and-live-graph";
  if (member.startsWith("type:")) return "gist-storage-type-and-live-graph";
  return "support-routine-graph-and-index-use";
}

const unitTitles = [
  "pg_trgm.parametersAndObservability",
  "pg_trgm.completeCanonicalSurface",
  "pg_trgm.exactContractAndNativeIndexes",
  "pg_trgm.gistSignatureOptions",
  "pg_trgm.all80MemberDispositions",
  "pg_trgm.indexesRejectNonText",
  "pg_trgm.overloadsMatchCapturedQueryMembers",
] as const;
export const pgTrgmUnitProofCases = unitTitles.map(
  (title) =>
    ({
      id: `${title}.unit`,
      file: "packages/tests/unit/extensions-pg-trgm.test.ts",
      title,
      gate: "unit",
      families: [pgTrgmProofFamily],
      claims: [],
    }) as const,
) satisfies ExtensionProofCase[];

export const pgTrgmTypesProofCase = {
  id: "pg_trgm.types-contracts",
  file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
  title: "pg_trgm exact 1.6 helpers, nullable text, member overloads and rejected non-text inputs",
  gate: "types",
  families: [pgTrgmProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const pgTrgmNativeProofCase = {
  id: "pg_trgm.native-graph",
  file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
  title: "pg_trgm live graph, restricted native oracle, operator threshold session and index strategy witnesses",
  gate: "database",
  families: [pgTrgmProofFamily],
  claims: pgTrgmMembers.map((member) => ({ family: pgTrgmProofFamily, member, scenario: pgTrgmScenario(member) })),
} satisfies ExtensionProofCase;

export const pgTrgmGenerationProofCase = {
  id: "pg_trgm.generation-contracts",
  file: "packages/e2e/integration/extensions-pg-trgm-generated.test.ts",
  title: "pg_trgm first load, disk generation, placements and generated root and mounted RPC/Effect output",
  gate: "generation",
  families: [pgTrgmProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const pgTrgmConsumerProofCase = {
  id: "pg_trgm.consumer-contracts",
  file: "packages/e2e/integration/packed-pg-trgm.test.ts",
  title: "pg_trgm frozen parent-prepared Node 24 consumer, generated RPC/Effect and selected 1.6 bundles",
  gate: "consumer",
  families: [pgTrgmProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const pgTrgmProofCases = [
  ...pgTrgmUnitProofCases,
  pgTrgmTypesProofCase,
  pgTrgmNativeProofCase,
  pgTrgmGenerationProofCase,
  pgTrgmConsumerProofCase,
];

type MemberProof = Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"][number];

/** Proposed family-local dispositions for parent reconciliation. Definitions alone confer no acceptance. */
export const pgTrgmMemberProofs: MemberProof[] = pgTrgmAnnotations.map((annotation) => ({
  id: annotation.id,
  disposition: annotation.disposition,
  reason: annotation.reason,
  citations: [
    ...new Set([
      ...annotation.evidence,
      "apps/loom/src/tooling/extensions/manifests/pg_trgm.json",
      "packages/e2e/integration/extensions-pg-trgm.test.ts",
    ]),
  ],
  cases: [{ caseId: pgTrgmNativeProofCase.id, scenario: pgTrgmScenario(annotation.id) }],
  transfers: [],
}));
