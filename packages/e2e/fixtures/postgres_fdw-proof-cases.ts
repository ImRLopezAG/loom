import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { postgresFdwAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/postgres_fdw";

export const postgresFdwProofFamily = {
  extension: "postgres_fdw",
  version: "1.2",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "39b3195d0b34c96f9e424299e84a599dc7abb6f21bd48eccfcce08f3071db717",
} as const satisfies ExtensionProofFamily;

const members = {
  fdw: "foreign-data wrapper:postgres_fdw",
  disconnectAll: "routine:$extension:postgres_fdw.postgres_fdw_disconnect_all()",
  disconnect: "routine:$extension:postgres_fdw.postgres_fdw_disconnect(pg_catalog.text)",
  connections: "routine:$extension:postgres_fdw.postgres_fdw_get_connections(pg_catalog.bool)",
  handler: "routine:$extension:postgres_fdw.postgres_fdw_handler()",
  validator: "routine:$extension:postgres_fdw.postgres_fdw_validator(pg_catalog._text,pg_catalog.oid)",
} as const;

export const postgresFdwDatabaseProofCase: ExtensionProofCase = {
  id: "postgres_fdw.native",
  gate: "database",
  families: [postgresFdwProofFamily],
  file: "packages/e2e/integration/extensions-postgres_fdw.test.ts",
  title:
    "postgres_fdw 1.2 connection cache, disconnect, session observability and FDW identity match native PostgreSQL 18",
  claims: [
    {
      family: postgresFdwProofFamily,
      member: members.fdw,
      scenario: "captured-fdw-handler-validator-identity",
    },
    {
      family: postgresFdwProofFamily,
      member: members.connections,
      scenario: "session-cache-check-conn-null-closed-and-live-rejection",
    },
    {
      family: postgresFdwProofFamily,
      member: members.disconnect,
      scenario: "idle-true-in-xact-false-missing-42704-survives-rollback",
    },
    {
      family: postgresFdwProofFamily,
      member: members.disconnectAll,
      scenario: "empty-false-idle-true-in-xact-false-and-cleanup",
    },
    {
      family: postgresFdwProofFamily,
      member: members.handler,
      scenario: "captured-fdw-handler-validator-identity",
    },
    {
      family: postgresFdwProofFamily,
      member: members.validator,
      scenario: "captured-fdw-handler-validator-identity",
    },
  ],
};

export const postgresFdwDatabaseProofCases: ExtensionProofCase[] = [postgresFdwDatabaseProofCase];
export const postgresFdwDatabaseFixtureCount = 2;
export const postgresFdwDatabaseRoleCount = 0;

export const postgresFdwUnitProofCases: ExtensionProofCase[] = [
  "postgres_fdw administrative disconnect is absent from application SQL",
  "postgres_fdw dispositions bind native cache semantics and member proofs",
  "postgres_fdw connection codec preserves OUT order and nullable closed",
  "postgres_fdw cancellation before acquisition preserves the exact reason without admitting a callback",
].map((title, index) => ({
  id: `postgres_fdw.unit-${index + 1}`,
  gate: "unit",
  families: [postgresFdwProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-postgres_fdw.test.ts",
  title,
}));

export const postgresFdwTypesProofCase: ExtensionProofCase = {
  id: "postgres_fdw.types",
  gate: "types",
  families: [postgresFdwProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-postgres_fdw.test-d.ts",
  title: "postgres_fdw exact application observation and trusted operator type boundaries",
};

export const postgresFdwGenerationProofCase: ExtensionProofCase = {
  id: "postgres_fdw.generation",
  gate: "generation",
  families: [postgresFdwProofFamily],
  claims: [],
  file: "packages/e2e/integration/extensions-postgres_fdw-generation.test.ts",
  title:
    "postgres_fdw first-load, disk, RPC, Effect, empty, future, absent and selected component bindings",
};

export const postgresFdwConsumerProofCase: ExtensionProofCase = {
  id: "postgres_fdw.consumer",
  gate: "consumer",
  families: [postgresFdwProofFamily],
  claims: [],
  file: "packages/e2e/integration/packed-postgres_fdw.test.ts",
  title: "postgres_fdw isolated frozen tarball consumer requires packed adapter and tooling exports",
};

export const postgresFdwMemberProofs: Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"] =
  postgresFdwAnnotations.map((annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: postgresFdwDatabaseProofCases.flatMap((definition) =>
      definition.claims
        .filter((claim) => claim.member === annotation.id)
        .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
    ),
    transfers: [],
  }));
