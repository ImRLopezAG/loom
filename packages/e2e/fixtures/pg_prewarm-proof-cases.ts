import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { pgPrewarmAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_prewarm";
export const pgPrewarmProofFamily = {
  extension: "pg_prewarm",
  version: "1.2",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "58d63ed991a2a7dcbce44b574afc81295947387e81a64be88f635478e7bc6495",
} as const satisfies ExtensionProofFamily;
export const pgPrewarmDatabaseProofCase: ExtensionProofCase = {
  id: "pg_prewarm.native",
  gate: "database",
  families: [pgPrewarmProofFamily],
  file: "packages/e2e/integration/extensions-pg_prewarm.test.ts",
  title: "pg_prewarm native modes forks storage and privileges retain independent rollback journals",
  claims: [
    {
      family: pgPrewarmProofFamily,
      member:
        "routine:$extension:pg_prewarm.pg_prewarm(pg_catalog.regclass,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
      scenario: "native-modes-bounds-forks-storage-privileges-and-rollback-journal",
    },
  ],
};
export const pgPrewarmWorkerProofCase: ExtensionProofCase = {
  id: "pg_prewarm.native-worker",
  gate: "database",
  families: [pgPrewarmProofFamily],
  file: "packages/e2e/integration/extensions-pg_prewarm.test.ts",
  title: "pg_prewarm isolated worker and dump effects retain rollback and abort journals",
  claims: [
    {
      family: pgPrewarmProofFamily,
      member: "routine:$extension:pg_prewarm.autoprewarm_dump_now()",
      scenario: "isolated-worker-and-dump-rollback-abort-journal",
    },
    {
      family: pgPrewarmProofFamily,
      member: "routine:$extension:pg_prewarm.autoprewarm_start_worker()",
      scenario: "isolated-worker-and-dump-rollback-abort-journal",
    },
  ],
};
export const pgPrewarmLifecycleProofCases: ExtensionProofCase[] = [
  ["drain", "pg_prewarm drains queued work and refuses admission after callback settlement"],
  ["cancel-blocked", "pg_prewarm cancellation disposes blocked native work and refuses queued work"],
  ["cancel-suspended", "pg_prewarm cancellation disposes a suspended callback and retains acknowledged effects"],
].map(([scenario, title]) => ({
  id: `pg_prewarm.${scenario}`,
  gate: "database",
  families: [pgPrewarmProofFamily],
  file: "packages/e2e/integration/extensions-pg_prewarm.test.ts",
  title: title!,
  claims: [
    {
      family: pgPrewarmProofFamily,
      member: pgPrewarmDatabaseProofCase.claims[0]!.member,
      scenario: scenario!,
    },
  ],
}));
export const pgPrewarmDatabaseProofCases: ExtensionProofCase[] = [
  pgPrewarmDatabaseProofCase,
  pgPrewarmWorkerProofCase,
  ...pgPrewarmLifecycleProofCases,
];
export const pgPrewarmDatabaseFixtureCount = 5;
export const pgPrewarmDatabaseRoleCount = 1;
export const pgPrewarmUnitProofCases: ExtensionProofCase[] = [
  "prewarm administrative methods are absent from application SQL",
  "prewarm dispositions bind native semantics and actual lifecycle proofs",
  "prewarm options reject unsupported modes and preserve NULL native block defaults",
  "prewarm cancellation before acquisition preserves the exact reason without admitting a callback",
].map((title, index) => ({
  id: `pg_prewarm.unit-${index + 1}`,
  gate: "unit",
  families: [pgPrewarmProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-pg_prewarm.test.ts",
  title,
}));
export const pgPrewarmTypesProofCase: ExtensionProofCase = {
  id: "pg_prewarm.types",
  gate: "types",
  families: [pgPrewarmProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-pg_prewarm.test-d.ts",
  title: "pg_prewarm exact application and trusted operator type boundaries",
};
export const pgPrewarmMemberProofs: Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"] =
  pgPrewarmAnnotations.map((annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: pgPrewarmDatabaseProofCases.flatMap((definition) =>
      definition.claims
        .filter((claim) => claim.member === annotation.id)
        .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
    ),
    transfers: [],
  }));
