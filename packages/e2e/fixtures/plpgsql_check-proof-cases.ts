import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { plpgsqlCheckAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/plpgsql_check";

export const plpgsqlCheckProofFamily = {
  extension: "plpgsql_check",
  version: "2.8",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "ef00befd1f61c832689dc4d4b3ee3c21f03585eda686474bb5ec8efd8696e74a",
} as const satisfies ExtensionProofFamily;

const file = "packages/e2e/integration/extensions-plpgsql_check.test.ts";
const id = (name: string) =>
  plpgsqlCheckAnnotations
    .filter((annotation) => annotation.id.startsWith(`routine:$extension:plpgsql_check.${name}(`))
    .map((annotation) => annotation.id);
function database(
  scenario: string,
  title: string,
  members: readonly string[],
): ExtensionProofCase & { readonly gate: "database" } {
  return {
    id: `plpgsql_check.${scenario}`,
    gate: "database",
    families: [plpgsqlCheckProofFamily],
    file,
    title,
    claims: members.map((member) => ({ family: plpgsqlCheckProofFamily, member, scenario })),
  };
}

export const plpgsqlCheckDiagnosticsProofCase = database(
  "native-diagnostics",
  "plpgsql_check native diagnostics preserve formats, overload resolution, trigger relations, pragmas and errors",
  [...id("plpgsql_check_function"), ...id("plpgsql_check_function_tb"), ...id("plpgsql_check_pragma")],
);
export const plpgsqlCheckDependenciesProofCase = database(
  "native-dependencies",
  "plpgsql_check sorted and native dependency rows decode through both routine overloads",
  [...id("plpgsql_show_dependency_tb"), ...id("__plpgsql_show_dependency_tb")],
);
const profileMembers = [
  ...id("plpgsql_profiler_function_tb"),
  ...id("plpgsql_profiler_function_statements_tb"),
  ...id("plpgsql_profiler_functions_all"),
  ...id("plpgsql_coverage_statements"),
  ...id("plpgsql_coverage_branches"),
  ...id("plpgsql_profiler_reset"),
  ...id("plpgsql_profiler_reset_all"),
];
export const plpgsqlCheckSessionProofCase = database(
  "backend-local-session",
  "plpgsql_check backend-local settings, hooks and empty profiles end with the dedicated operator session",
  [
    ...id("plpgsql_check_profiler"),
    ...id("plpgsql_check_tracer"),
    ...id("plpgsql_profiler_install_fake_queryid_hook"),
    ...id("plpgsql_profiler_remove_fake_queryid_hook"),
    ...profileMembers,
  ],
);
export const plpgsqlCheckSharedProfileProofCase = database(
  "preloaded-shared-profile",
  "plpgsql_check preloaded shared profiles decode application executions and journal non-transactional resets",
  [...id("plpgsql_check_profiler"), ...profileMembers],
);
export const plpgsqlCheckDatabaseProofCases: ExtensionProofCase[] = [
  plpgsqlCheckDiagnosticsProofCase,
  plpgsqlCheckDependenciesProofCase,
  plpgsqlCheckSessionProofCase,
  plpgsqlCheckSharedProfileProofCase,
];
/** Fixtures allocated by withExtensionDatabase on LOOM_TEST_DATABASE_URL. */
export const plpgsqlCheckDatabaseFixtureCount = 3;
/** Allocated on the separate preloaded server; host fixture-ownership events do not cover it. */
export const plpgsqlCheckPreloadedFixtureCount = 1;
export const plpgsqlCheckDatabaseRoleCount = 0;
export const plpgsqlCheckUnitProofCases: ExtensionProofCase[] = [
  "plpgsql_check operator routines are absent from application SQL and require the exact verified contract",
  "plpgsql_check dispositions cover every captured member with executable database proofs",
  "plpgsql_check request validators keep native defaults and reject unsupported inputs",
  "plpgsql_check cancellation before acquisition preserves the exact reason without admitting a callback",
].map((title, index) => ({
  id: `plpgsql_check.unit-${index + 1}`,
  gate: "unit",
  families: [plpgsqlCheckProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-plpgsql_check.test.ts",
  title,
}));
export const plpgsqlCheckTypesProofCase: ExtensionProofCase = {
  id: "plpgsql_check.types",
  gate: "types",
  families: [plpgsqlCheckProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-plpgsql_check.test-d.ts",
  title: "plpgsql_check exact application and trusted operator type boundaries",
};
export const plpgsqlCheckGenerationProofCase: ExtensionProofCase = {
  id: "plpgsql_check.generation",
  gate: "generation",
  families: [plpgsqlCheckProofFamily],
  claims: [],
  file: "packages/e2e/integration/extensions-plpgsql_check-generated.test.ts",
  title: "plpgsql_check disk-generated selected bindings compile against the exact factory",
};
export const plpgsqlCheckConsumerProofCase: ExtensionProofCase = {
  id: "plpgsql_check.consumer",
  gate: "consumer",
  families: [plpgsqlCheckProofFamily],
  claims: [],
  file: "packages/e2e/integration/packed-plpgsql_check.test.ts",
  title: "plpgsql_check frozen tarball consumer runs operator diagnostics through published exports",
};
export const plpgsqlCheckMemberProofs: Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"] =
  plpgsqlCheckAnnotations.map((annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: plpgsqlCheckDatabaseProofCases.flatMap((definition) =>
      definition.claims
        .filter((claim) => claim.member === annotation.id)
        .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
    ),
    transfers: [],
  }));
