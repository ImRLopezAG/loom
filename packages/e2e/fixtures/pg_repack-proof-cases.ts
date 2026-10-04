import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { pgRepackAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_repack";
import { pgRepackDigest } from "./pg_repack";

export const pgRepackProofFamily = {
  extension: "pg_repack",
  version: "1.5.2",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: pgRepackDigest,
} as const satisfies ExtensionProofFamily;

export const pgRepackUnitProofCases: ExtensionProofCase[] = [
  "pg_repack dispositions bind every captured member and hide client internals from application SQL",
  "pg_repack SQL helpers compile against schema repack, not descriptor.schema",
  "pg_repack request validation requires an explicit aligned binary and rejects empty identifiers",
  "pg_repack cancellation before acquisition preserves the exact reason without admitting a callback",
].map((title, index) => ({
  id: `pg_repack.unit-${index + 1}`,
  gate: "unit",
  families: [pgRepackProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-pg_repack.test.ts",
  title,
}));

export const pgRepackTypesProofCase: ExtensionProofCase = {
  id: "pg_repack.types",
  gate: "types",
  families: [pgRepackProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-pg_repack.test-d.ts",
  title: "pg_repack exact application and trusted operator type boundaries",
};

export const pgRepackNativeProofCase: ExtensionProofCase = {
  id: "pg_repack.native",
  gate: "database",
  families: [pgRepackProofFamily],
  file: "packages/e2e/integration/extensions-pg_repack.test.ts",
  title: "pg_repack SQL helpers, views, internals and aligned client protocol retain native contracts",
  claims: pgRepackAnnotations.map((annotation) => ({
    family: pgRepackProofFamily,
    member: annotation.id,
    scenario: "native-sql-or-client-or-source-checked-internal",
  })),
};

export const pgRepackGenerationProofCase: ExtensionProofCase = {
  id: "pg_repack.generation",
  gate: "generation",
  families: [pgRepackProofFamily],
  claims: [],
  file: "packages/e2e/integration/packed-pg_repack.test.ts",
  title: "pg_repack frozen tarball consumer generates disk bindings and typechecks selected RPC/Effect context",
};

export const pgRepackConsumerProofCase: ExtensionProofCase = {
  id: "pg_repack.consumer",
  gate: "consumer",
  families: [pgRepackProofFamily],
  claims: [],
  file: "packages/e2e/integration/packed-pg_repack.test.ts",
  title:
    "pg_repack frozen isolated tarball consumer runs selected native helpers and the aligned client on owned UUID tables",
};

export const pgRepackMemberProofs: Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"] =
  pgRepackAnnotations.map((annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: [{ caseId: pgRepackNativeProofCase.id, scenario: "native-sql-or-client-or-source-checked-internal" }],
    transfers: [],
  }));
