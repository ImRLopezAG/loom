import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { hypopgAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/hypopg";
import { hypopgDigest } from "./hypopg";

export const hypopgProofFamily = {
  extension: "hypopg",
  version: "1.4.3",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: hypopgDigest,
} as const satisfies ExtensionProofFamily;
export const hypopgNativeProofCase: ExtensionProofCase = {
  id: "hypopg.native-members",
  gate: "database",
  families: [hypopgProofFamily],
  file: "packages/e2e/integration/extensions-hypopg.test.ts",
  title: "hypopg native members preserve backend state, planner behavior, view projections and stored composite arrays",
  claims: hypopgAnnotations.map((annotation) => ({
    family: hypopgProofFamily,
    member: annotation.id,
    scenario: "native-session-or-storage-roundtrip",
  })),
};
export const hypopgLifecycleProofCase: ExtensionProofCase = {
  id: "hypopg.native-lifetime",
  gate: "database",
  families: [hypopgProofFamily],
  claims: [],
  file: "packages/e2e/integration/extensions-hypopg.test.ts",
  title: "hypopg dedicated operations revoke leases, poison caught failures, rollback and terminate cancelled backends",
};
export const hypopgDatabaseProofCases = [hypopgNativeProofCase, hypopgLifecycleProofCase];
const unitTitles = [
  "hypopg exact identity and all captured members have explicit dispositions",
  "hypopg readers qualify placement, bind oid and retain session observability",
  "hypopg native record codec preserves vector text, node trees, null and unsigned oid",
  "hypopg operator effects decode text boolean results through the actual session methods",
];
export const hypopgUnitProofCases: ExtensionProofCase[] = unitTitles.map((title, index) => ({
  id: `hypopg.unit-${index + 1}`,
  gate: "unit",
  families: [hypopgProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-hypopg.test.ts",
  title,
}));
export const hypopgTypesProofCase: ExtensionProofCase = {
  id: "hypopg.types",
  gate: "types",
  families: [hypopgProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-hypopg.test-d.ts",
  title: "hypopg exact reader, nullable composite storage and closed operator-session types",
};
export const hypopgGenerationProofCase: ExtensionProofCase = {
  id: "hypopg.generation",
  gate: "generation",
  families: [hypopgProofFamily],
  claims: [],
  file: "packages/e2e/integration/extension-hypopg-codegen.test.ts",
  title: "hypopg first load and real disk generation preserve selected root and component bindings",
};
export const hypopgConsumerProofCase: ExtensionProofCase = {
  id: "hypopg.consumer",
  gate: "consumer",
  families: [hypopgProofFamily],
  claims: [],
  file: "packages/e2e/integration/packed-hypopg.test.ts",
  title:
    "hypopg frozen isolated tarball consumer generates disk bindings, typechecks and runs selected runtime and operator exports",
};
export const hypopgProofCases = [
  ...hypopgUnitProofCases,
  hypopgTypesProofCase,
  ...hypopgDatabaseProofCases,
  hypopgGenerationProofCase,
  hypopgConsumerProofCase,
];
/** Every member has a direct native witness, including view rewrite rules; no inferred transfer substitutes for execution. */
export const hypopgMemberProofs: Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"] =
  hypopgAnnotations.map((annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: [{ caseId: hypopgNativeProofCase.id, scenario: "native-session-or-storage-roundtrip" }],
    transfers: [],
  }));
