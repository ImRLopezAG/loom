import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const pgGraphqlProofFamily = {
  extension: "pg_graphql",
  version: "1.5.12",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "a64a8bd702ab1dad6e9b171e6f5cc61ec54c2e31411da5d7c6aec86933538d5f",
} as const satisfies ExtensionProofFamily;

export const pgGraphqlQueryMembers = [
  "routine:$extension:pg_graphql._internal_resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
  "routine:$extension:pg_graphql.exception(pg_catalog.text)",
  "routine:$extension:pg_graphql.comment_directive(pg_catalog.text)",
  "routine:$extension:pg_graphql.get_schema_version()",
  "routine:$extension:pg_graphql.resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
] as const;

export const pgGraphqlMembers = [
  "event trigger:graphql_watch_ddl",
  "event trigger:graphql_watch_drop",
  "routine:$extension:pg_graphql._internal_resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
  "routine:$extension:pg_graphql.comment_directive(pg_catalog.text)",
  "routine:$extension:pg_graphql.exception(pg_catalog.text)",
  "routine:$extension:pg_graphql.get_schema_version()",
  "routine:$extension:pg_graphql.increment_schema_version()",
  "routine:$extension:pg_graphql.resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
  'sequence column:"$extension:pg_graphql".seq_schema_version.is_called',
  'sequence column:"$extension:pg_graphql".seq_schema_version.last_value',
  'sequence column:"$extension:pg_graphql".seq_schema_version.log_cnt',
  'sequence:"$extension:pg_graphql".seq_schema_version',
] as const;

export const pgGraphqlUnitProofCases = [
  { id: "pg_graphql.unit-contracts", title: "pg_graphql factory requires its exact verified 1.5.12 contract" },
  {
    id: "pg_graphql.unit-sql",
    title: "resolve binds GraphQL text and trailing defaults by native parameter name in the fixed schema",
  },
  {
    id: "pg_graphql.unit-helpers",
    title: "every exported helper carries its captured member, observability and pure-schema dependencies",
  },
  { id: "pg_graphql.unit-dispositions", title: "all twelve captured pg_graphql members have exact dispositions" },
].map(
  (entry) =>
    ({
      ...entry,
      file: "packages/tests/unit/extensions-pg_graphql.test.ts",
      gate: "unit",
      families: [pgGraphqlProofFamily],
      claims: [],
    }) as const,
) satisfies ExtensionProofCase[];

export const pgGraphqlTypesProofCase = {
  id: "pg_graphql.types-contracts",
  file: "packages/tests/types/extensions-pg_graphql.test-d.ts",
  title: "pg_graphql exact version, jsonb documents, omitted defaults and rejected JS GraphQL values",
  gate: "types",
  families: [pgGraphqlProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const pgGraphqlNativeProofCase = {
  id: "pg_graphql.native-ordinary",
  file: "packages/e2e/integration/extensions-pg_graphql.test.ts",
  title: "pg_graphql native resolve JSON, session authority, trigger-only increment and ordinary SQL boundary",
  gate: "database",
  families: [pgGraphqlProofFamily],
  claims: pgGraphqlMembers.map((member) => ({
    family: pgGraphqlProofFamily,
    member,
    scenario: "native-jsonb-text-authority-and-trigger-only-increment",
  })),
} satisfies ExtensionProofCase;

export const pgGraphqlGenerationProofCase = {
  id: "pg_graphql.generation-contracts",
  file: "packages/e2e/integration/extensions-pg_graphql-generated.test.ts",
  title: "pg_graphql first load, disk generation, generated application RPC and Effect output",
  gate: "generation",
  families: [pgGraphqlProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const pgGraphqlConsumerProofCase = {
  id: "pg_graphql.consumer-contracts",
  file: "packages/e2e/integration/packed-pg_graphql.test.ts",
  title: "pg_graphql isolated Node 24 packed tarball, generated RPC/Effect and selected 1.5.12 adapter",
  gate: "consumer",
  families: [pgGraphqlProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

type MemberProof = Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"][number];

function disposition(member: (typeof pgGraphqlMembers)[number]) {
  if (member.startsWith("event trigger:")) return "schema" as const;
  if (pgGraphqlQueryMembers.some((queryMember) => queryMember === member)) return "query" as const;
  return "internal" as const;
}

/** Proposed family-local dispositions for parent reconciliation. Definitions alone confer no acceptance. */
export const pgGraphqlMemberProofs: MemberProof[] = pgGraphqlMembers.map((member) => ({
  id: member,
  disposition: disposition(member),
  reason:
    disposition(member) === "query"
      ? "Generated RPC/Effect and native SQL expose all five captured SQL-callable query members."
      : disposition(member) === "schema"
        ? "Extension-owned event triggers are schema watchers, not RPC helpers."
        : "Trigger-only and sequence members stay unpublished on the generated application surface.",
  citations: [
    "apps/loom/src/tooling/extensions/manifests/pg_graphql.json",
    "apps/loom/src/tooling/extensions/annotations/pg_graphql.ts",
    "packages/e2e/integration/extensions-pg_graphql.test.ts",
    "packages/e2e/integration/extensions-pg_graphql-generated.test.ts",
    "packages/e2e/integration/packed-pg_graphql.test.ts",
  ],
  cases: [{ caseId: pgGraphqlNativeProofCase.id, scenario: "native-jsonb-text-authority-and-trigger-only-increment" }],
  transfers: [],
}));
