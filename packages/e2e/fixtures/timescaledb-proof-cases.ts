import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { timescaledbAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/timescaledb";
import { timescaledbDigest } from "./timescaledb";

export const timescaledbProofFamily = {
  extension: "timescaledb",
  version: "2.24.0",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: timescaledbDigest,
} as const satisfies ExtensionProofFamily;
export const timescaledbNativeProofCase: ExtensionProofCase = {
  id: "timescaledb.native-members",
  gate: "database",
  families: [timescaledbProofFamily],
  file: "packages/e2e/integration/extensions-timescaledb.test.ts",
  title:
    "timescaledb native members: typed queries, catalogue readers, Apache license rejections and private-routine characterization",
  claims: timescaledbAnnotations.map((annotation) => ({
    family: timescaledbProofFamily,
    member: annotation.id,
    scenario: "native-direct-call-or-catalogue",
  })),
};
export const timescaledbToolingProofCase: ExtensionProofCase = {
  id: "timescaledb.operator-tooling",
  gate: "database",
  families: [timescaledbProofFamily],
  claims: [],
  file: "packages/e2e/integration/extensions-timescaledb.test.ts",
  title:
    "timescaledb operator tooling verifies the exact contract before hypertable DDL and reports license restrictions",
};
export const timescaledbDatabaseProofCases = [timescaledbNativeProofCase, timescaledbToolingProofCase];
const unitTitles = [
  "timescaledb exact identity and all 1233 captured members have explicit dispositions",
  "timescaledb readers qualify placement, bind relations and keep external observability",
  "timescaledb native codecs preserve interval, date, timestamp and nullable catalogue records",
];
export const timescaledbUnitProofCases: ExtensionProofCase[] = unitTitles.map((title, index) => ({
  id: `timescaledb.unit-${index + 1}`,
  gate: "unit",
  families: [timescaledbProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-timescaledb.test.ts",
  title,
}));
export const timescaledbTypesProofCase: ExtensionProofCase = {
  id: "timescaledb.types",
  gate: "types",
  families: [timescaledbProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-timescaledb.test-d.ts",
  title: "timescaledb exact overloads, nullable catalogue rows and closed operator-session types",
};
export const timescaledbGenerationProofCase: ExtensionProofCase = {
  id: "timescaledb.generation",
  gate: "generation",
  families: [timescaledbProofFamily],
  claims: [],
  file: "packages/e2e/integration/extension-timescaledb-codegen.test.ts",
  title: "timescaledb first load and real disk generation preserve selected root and component bindings",
};
export const timescaledbConsumerProofCase: ExtensionProofCase = {
  id: "timescaledb.consumer",
  gate: "consumer",
  families: [timescaledbProofFamily],
  claims: [],
  file: "packages/e2e/integration/packed-timescaledb.test.ts",
  title:
    "timescaledb frozen isolated tarball consumer generates disk bindings, typechecks and runs selected runtime and operator exports",
};
export const timescaledbProofCases = [
  ...timescaledbUnitProofCases,
  timescaledbTypesProofCase,
  ...timescaledbDatabaseProofCases,
  timescaledbGenerationProofCase,
  timescaledbConsumerProofCase,
];
/** Every member is witnessed by its own direct native call or catalogue observation; no transfer substitutes. */
export const timescaledbMemberProofs: Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"] =
  timescaledbAnnotations.map((annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: [{ caseId: timescaledbNativeProofCase.id, scenario: "native-direct-call-or-catalogue" }],
    transfers: [],
  }));
