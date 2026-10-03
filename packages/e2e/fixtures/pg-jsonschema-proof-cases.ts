import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const pgJsonschemaProofFamily = {
  extension: "pg_jsonschema",
  version: "0.3.4",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "7a61cf1dd9bcb37e3704e5cb9c5cc92258815f6dddf6a869bd9c6434a66da138",
} satisfies ExtensionProofFamily;
export const pgJsonschemaProofSchema = 'custom"json';
export const pgJsonschemaNativeProofClaims = {
  json: {
    family: pgJsonschemaProofFamily,
    member: "routine:$extension:pg_jsonschema.json_matches_schema(pg_catalog.json,pg_catalog.json)",
    scenario: "lossless-json-null-precision-and-schema-mismatch",
  },
  jsonb: {
    family: pgJsonschemaProofFamily,
    member: "routine:$extension:pg_jsonschema.jsonb_matches_schema(pg_catalog.json,pg_catalog.jsonb)",
    scenario: "jsonb-identity-strict-null-and-schema-mismatch",
  },
  valid: {
    family: pgJsonschemaProofFamily,
    member: "routine:$extension:pg_jsonschema.jsonschema_is_valid(pg_catalog.json)",
    scenario: "schema-validity-and-strict-null",
  },
  errors: {
    family: pgJsonschemaProofFamily,
    member: "routine:$extension:pg_jsonschema.jsonschema_validation_errors(pg_catalog.json,pg_catalog.json)",
    scenario: "exact-postgresql-error-array-and-strict-null",
  },
};
export const pgJsonschemaNativeProofCase = {
  id: "pg_jsonschema.native-semantics",
  file: "packages/e2e/integration/extensions-jsonschema.test.ts",
  title:
    "pg_jsonschema all four routines, invalid schemas, drafts, references, live and rollback match provider behavior",
  gate: "database",
  families: [pgJsonschemaProofFamily],
  claims: Object.values(pgJsonschemaNativeProofClaims),
} satisfies ExtensionProofCase;
export const pgJsonschemaDatabaseProofCases = [pgJsonschemaNativeProofCase];
export const pgJsonschemaUnitProofCase = {
  id: "pg_jsonschema.unit-contracts",
  file: "packages/tests/unit/extensions-jsonschema.test.ts",
  title: "pg_jsonschema exact pin, required API and selected JSON contracts",
  gate: "unit",
  families: [pgJsonschemaProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const pgJsonschemaTypesProofCase = {
  id: "pg_jsonschema.types-contracts",
  file: "packages/tests/types/extensions-jsonschema.test-d.ts",
  title: "pg_jsonschema public and generated exact JSON, JSONB and nullable declarations",
  gate: "types",
  families: [pgJsonschemaProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const pgJsonschemaGenerationProofCase = {
  id: "pg_jsonschema.generation-contracts",
  file: "packages/e2e/integration/extension-adapter-codegen.test.ts",
  title: "pg_jsonschema first load retains exact JSON helpers through mounted RPC and Effect",
  gate: "generation",
  families: [pgJsonschemaProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const pgJsonschemaConsumerProofCase = {
  id: "pg_jsonschema.consumer-contracts",
  file: "packages/e2e/integration/packed-pg-jsonschema.test.ts",
  title: "pg_jsonschema isolated packed JSON identities, native RPC and selected bundles",
  gate: "consumer",
  families: [pgJsonschemaProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const pgJsonschemaProofCases = [
  ...pgJsonschemaDatabaseProofCases,
  pgJsonschemaUnitProofCase,
  pgJsonschemaTypesProofCase,
  pgJsonschemaGenerationProofCase,
  pgJsonschemaConsumerProofCase,
];
