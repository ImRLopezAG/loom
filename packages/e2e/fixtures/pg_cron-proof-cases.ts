import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { pgCronAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_cron";

export const pgCronProofFamily = {
  extension: "pg_cron",
  version: "1.6",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "a5b37c25b617856dbc5afb7a7e1d409e362baf9a809ae384920cbe5b18acff4c",
} as const;
export const pgCronDatabaseProofCase: ExtensionProofCase = {
  id: "pg_cron.native",
  gate: "database",
  families: [pgCronProofFamily],
  file: "packages/e2e/integration/extensions-pg_cron.test.ts",
  title: "pg_cron native routines, attached trigger, rows/codecs, scheduler execution and UUID job/role isolation",
  claims: pgCronAnnotations.map((annotation) => ({
    family: pgCronProofFamily,
    member: annotation.id,
    scenario: annotation.id.startsWith("routine:")
      ? "direct-native-routine-or-attached-trigger"
      : annotation.id.startsWith("type:") ||
          annotation.id.startsWith("table:") ||
          annotation.id.startsWith("table column:")
        ? "native-row-codec-layout-and-array-roundtrip"
        : "native-catalogue-attachment-default-and-owned-job-readback",
  })),
};
export const pgCronDatabaseProofCases = [pgCronDatabaseProofCase];
export const pgCronUnitProofCases: ExtensionProofCase[] = [
  "pg_cron exact composite fields preserve bigint IDs, int4 values, nullability and array bounds",
  "pg_cron ordinary application binding has read-only external rows and no scheduler mutations",
  "pg_cron all 70 manifest members have explicit dispositions and executable native claims",
].map((title, index) => ({
  id: `pg_cron.unit-${index + 1}`,
  title,
  gate: "unit",
  families: [pgCronProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-pg_cron.test.ts",
}));
export const pgCronTypesProofCase: ExtensionProofCase = {
  id: "pg_cron.types",
  gate: "types",
  families: [pgCronProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-pg_cron.test-d.ts",
  title: "pg_cron exact selected binding, codec and closed operator types",
};
export const pgCronGenerationProofCase: ExtensionProofCase = {
  id: "pg_cron.generation",
  gate: "generation",
  families: [pgCronProofFamily],
  claims: [],
  file: "packages/e2e/integration/extensions-pg_cron-generated.test.ts",
  title: "pg_cron genuine first-load/disk generation and RPC/Effect selected-context types",
};
export const pgCronConsumerProofCase: ExtensionProofCase = {
  id: "pg_cron.consumer",
  gate: "consumer",
  families: [pgCronProofFamily],
  claims: [],
  file: "packages/e2e/integration/packed-pg_cron.test.ts",
  title: "pg_cron cold Node24 frozen isolated tarball consumer with selected empty and unsupported bundles",
};
export const pgCronMemberProofs: Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"] =
  pgCronAnnotations.map((annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: pgCronDatabaseProofCase.claims
      .filter((claim) => claim.member === annotation.id)
      .map((claim) => ({ caseId: pgCronDatabaseProofCase.id, scenario: claim.scenario })),
    transfers: [],
  }));
export const pgCronDeclaration: Extract<ExtensionProofDeclaration, { state: "candidate" }> = {
  extension: "pg_cron",
  state: "candidate",
  family: pgCronProofFamily,
  schema: "pg_catalog",
  members: pgCronMemberProofs,
  catalogueVersionReconciliation: null,
  gates: {
    unit: { sources: [pgCronUnitProofCases[0]!.file], proofs: [] },
    types: { sources: [pgCronTypesProofCase.file], proofs: [] },
    database: { sources: [pgCronDatabaseProofCase.file], proofs: [] },
    generation: { sources: [pgCronGenerationProofCase.file], proofs: [] },
    consumer: { sources: [pgCronConsumerProofCase.file], proofs: [] },
  },
};
