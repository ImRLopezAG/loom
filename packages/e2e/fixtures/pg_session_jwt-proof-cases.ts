import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { pgSessionJwtAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_session_jwt";

export const pgSessionJwtProofFamily = {
  extension: "pg_session_jwt",
  version: "0.5.0",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "623c651ce14c1a66283624660e7588f073e56e92628ba73878a47c50150350d8",
} as const satisfies ExtensionProofFamily;

export const pgSessionJwtNativeReaderProofCase: ExtensionProofCase = {
  id: "pg_session_jwt.native-readers",
  gate: "database",
  families: [pgSessionJwtProofFamily],
  file: "packages/e2e/integration/extensions-pg_session_jwt.test.ts",
  title:
    "session JWT claim readers decode JSON null, SQL null, text and UUID identities in claims-only and JWK modes without granting Loom identity",
  claims: [
    {
      family: pgSessionJwtProofFamily,
      member: "routine:auth.jwt()",
      scenario: "claims-only-json-null-malformed-and-payload-jwk-ignores-claims-and-bad-signature-raises",
    },
    {
      family: pgSessionJwtProofFamily,
      member: "routine:auth.session()",
      scenario: "claims-only-and-jwk-verified-payload",
    },
    {
      family: pgSessionJwtProofFamily,
      member: "routine:auth.user_id()",
      scenario: "claims-only-nonstring-sub-sql-null-jwk-nonstring-sub-raises",
    },
    {
      family: pgSessionJwtProofFamily,
      member: "routine:auth.uid()",
      scenario: "claims-only-and-jwk-non-uuid-sub-sql-null",
    },
    {
      family: pgSessionJwtProofFamily,
      member: "routine:auth.organization()",
      scenario: "neon-auth-o-object-non-object-sql-null-claims-only-and-jwk",
    },
    {
      family: pgSessionJwtProofFamily,
      member: "routine:auth.organization_id()",
      scenario: "neon-auth-o-id-uuid-non-uuid-sql-null-claims-only-and-jwk",
    },
  ],
};

export const pgSessionJwtNativeSessionProofCase: ExtensionProofCase = {
  id: "pg_session_jwt.native-session-writes",
  gate: "database",
  families: [pgSessionJwtProofFamily],
  file: "packages/e2e/integration/extensions-pg_session_jwt.test.ts",
  title:
    "JWK session writes report truthful effects, reject invalid tokens with rollback, and reset or terminate the same backend",
  claims: [
    {
      family: pgSessionJwtProofFamily,
      member: "routine:auth.init()",
      scenario: "jwk-startup-init-observed-and-missing-key-raises",
    },
    {
      family: pgSessionJwtProofFamily,
      member: "routine:auth.jwt_session_init(pg_catalog.text)",
      scenario: "jwk-verified-payload-cached-replay-rejections-leeway-same-backend-reset-and-abort-termination",
    },
  ],
};

export const pgSessionJwtDatabaseProofCases: ExtensionProofCase[] = [
  pgSessionJwtNativeReaderProofCase,
  pgSessionJwtNativeSessionProofCase,
  {
    id: "pg_session_jwt.native-namespace-privileges",
    gate: "database",
    families: [pgSessionJwtProofFamily],
    file: "packages/e2e/integration/extensions-pg_session_jwt.test.ts",
    title: "runtime JWT privilege verification checks fixed auth schema usage independently of installation placement",
    claims: [
      {
        family: pgSessionJwtProofFamily,
        member: "schema:auth",
        scenario: "fixed-auth-namespace-ownership-and-usage-boundary",
      },
    ],
  },
];
export const pgSessionJwtDatabaseFixtureCount = 3;
export const pgSessionJwtDatabaseRoleCount = 1;

export const pgSessionJwtUnitProofCases: ExtensionProofCase[] = [
  "session JWT readers qualify auth, keep session observability and omit session writes from application SQL",
  "session JWT members, annotations and identity descriptor match the captured 0.5.0 contract",
  "session JWT decoders retain JSON null, SQL null, text subject and UUID identity distinctions",
].map((title, index) => ({
  id: `pg_session_jwt.unit-${index + 1}`,
  gate: "unit",
  families: [pgSessionJwtProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-pg_session_jwt.test.ts",
  title,
}));

export const pgSessionJwtTypesProofCase: ExtensionProofCase = {
  id: "pg_session_jwt.types",
  gate: "types",
  families: [pgSessionJwtProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-pg_session_jwt.test-d.ts",
  title: "session JWT exact reader, nullable identity and session-write type boundaries",
};

export const pgSessionJwtMemberProofs: Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"] =
  pgSessionJwtAnnotations.map((annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: pgSessionJwtDatabaseProofCases.flatMap((definition) =>
      definition.claims
        .filter((claim) => claim.member === annotation.id)
        .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
    ),
    transfers: [],
  }));
