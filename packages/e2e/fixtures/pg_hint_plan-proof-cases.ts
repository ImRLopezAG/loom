import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { pgHintPlanAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_hint_plan";
import { pgHintPlanDigest } from "./pg_hint_plan";

export const pgHintPlanProofFamily = {
  extension: "pg_hint_plan",
  version: "1.8.0",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: pgHintPlanDigest,
} as const satisfies ExtensionProofFamily;
export const pgHintPlanNativeProofCase: ExtensionProofCase = {
  id: "pg_hint_plan.native-members",
  gate: "database",
  families: [pgHintPlanProofFamily],
  file: "packages/e2e/integration/extensions-pg_hint_plan.test.ts",
  title: "pg_hint_plan hint table rows, native constraints, query identifiers and observed planner effects",
  claims: pgHintPlanAnnotations.map((annotation) => ({
    family: pgHintPlanProofFamily,
    member: annotation.id,
    scenario: "native-hint-table-and-plan",
  })),
};
export const pgHintPlanLifecycleProofCase: ExtensionProofCase = {
  id: "pg_hint_plan.native-lifetime",
  gate: "database",
  families: [pgHintPlanProofFamily],
  claims: [],
  file: "packages/e2e/integration/extensions-pg_hint_plan.test.ts",
  title: "pg_hint_plan operator writes roll back with the operation and transaction-local settings never leak",
};
export const pgHintPlanDatabaseProofCases = [pgHintPlanNativeProofCase, pgHintPlanLifecycleProofCase];
const unitTitles = [
  "pg_hint_plan exact identity, fixed schema and all captured members have explicit dispositions",
  "pg_hint_plan hint table reader qualifies the fixed relation and stays external to live queries",
  "pg_hint_plan hint row codec preserves int8 identifiers, empty application names and quoted text",
];
export const pgHintPlanUnitProofCases: ExtensionProofCase[] = unitTitles.map((title, index) => ({
  id: `pg_hint_plan.unit-${index + 1}`,
  gate: "unit",
  families: [pgHintPlanProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-pg_hint_plan.test.ts",
  title,
}));
export const pgHintPlanTypesProofCase: ExtensionProofCase = {
  id: "pg_hint_plan.types",
  gate: "types",
  families: [pgHintPlanProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-pg_hint_plan.test-d.ts",
  title: "pg_hint_plan exact reader, composite storage and closed operator-session types",
};
export const pgHintPlanGenerationProofCase: ExtensionProofCase = {
  id: "pg_hint_plan.generation",
  gate: "generation",
  families: [pgHintPlanProofFamily],
  claims: [],
  file: "packages/e2e/integration/extensions-pg_hint_plan-generation.test.ts",
  title: "pg_hint_plan first load and real disk generation preserve selected root and component bindings",
};
export const pgHintPlanConsumerProofCase: ExtensionProofCase = {
  id: "pg_hint_plan.consumer",
  gate: "consumer",
  families: [pgHintPlanProofFamily],
  claims: [],
  file: "packages/e2e/integration/packed-pg_hint_plan.test.ts",
  title:
    "pg_hint_plan frozen isolated tarball consumer generates disk bindings, typechecks and runs selected runtime and operator exports",
};
export const pgHintPlanProofCases = [
  ...pgHintPlanUnitProofCases,
  pgHintPlanTypesProofCase,
  ...pgHintPlanDatabaseProofCases,
  pgHintPlanGenerationProofCase,
  pgHintPlanConsumerProofCase,
];
/** Every member has a direct native witness in the database case; no inferred transfer substitutes for execution. */
export const pgHintPlanMemberProofs: Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"] =
  pgHintPlanAnnotations.map((annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: [{ caseId: pgHintPlanNativeProofCase.id, scenario: "native-hint-table-and-plan" }],
    transfers: [],
  }));
