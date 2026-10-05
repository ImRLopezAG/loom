import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { pgGraphqlUnitProofCases } from "../../e2e/fixtures/pg_graphql-proof-cases";
import { expect } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createPgGraphql_1_5_12 } from "../../../apps/loom/src/core/extensions/adapters/pg_graphql";
import { jsonbValue } from "../../../apps/loom/src/core/extensions/native-json-codecs";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { pgGraphqlAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_graphql";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pg_graphql.json";

const digest = "a64a8bd702ab1dad6e9b171e6f5cc61ec54c2e31411da5d7c6aec86933538d5f";
const verified = {
  name: "pg_graphql",
  version: "1.5.12",
  schema: "graphql",
  apiSupport: { status: "verified", digest },
} as const;
const dialect = extensionSqlDialect(nodePgCodecs);
const adapter = createPgGraphql_1_5_12(verified);

extensionProofUnitTest(pgGraphqlUnitProofCases[0]!, () => {
  expect(manifest.digest).toBe(digest);
  for (const descriptor of [
    { ...verified, name: "pg_jsonschema" },
    { ...verified, version: "1.5.11" },
    { ...verified, apiSupport: { status: "unverified" } },
    { ...verified, apiSupport: { status: "verified", digest: "wrong" } },
  ])
    // SAFETY: Invalid JavaScript descriptors exercise admission beyond the static signature.
    expect(() => createPgGraphql_1_5_12(descriptor as never)).toThrow(
      "pg_graphql 1.5.12 requires its exact verified contract",
    );
});

extensionProofUnitTest(pgGraphqlUnitProofCases[1]!, () => {
  const query = "{ accountCollection { totalCount } }";
  const minimal = dialect.sqlToQuery(adapter.resolve(query));
  expect(minimal.sql).toBe('"graphql"."resolve"($1::"pg_catalog"."text")');
  expect(minimal.params).toEqual([query]);
  const full = dialect.sqlToQuery(adapter.resolve(query, jsonbValue({ id: "2" }), "Q", jsonbValue({ x: 1 })));
  expect(full.sql).toBe(
    '"graphql"."resolve"($1::"pg_catalog"."text", "variables" => $2::"pg_catalog"."jsonb", "operationName" => $3::"pg_catalog"."text", "extensions" => $4::"pg_catalog"."jsonb")',
  );
  expect(full.params).toEqual([query, '{"id":"2"}', "Q", '{"x":1}']);
  const skipped = dialect.sqlToQuery(adapter.resolve(query, undefined, "Q"));
  expect(skipped.sql).toBe('"graphql"."resolve"($1::"pg_catalog"."text", "operationName" => $2::"pg_catalog"."text")');
  // Native resolve is non-strict: SQL NULL arguments become a returned errors document, not SQL NULL.
  expect(dialect.sqlToQuery(adapter.resolve(null, null, null, null)).params).toEqual([null, null, null, null]);
});

extensionProofUnitTest(pgGraphqlUnitProofCases[2]!, () => {
  const contracts = [
    adapter.resolve("{ __typename }"),
    adapter.internalResolve("{ __typename }"),
    adapter.commentDirective("@graphql({})"),
    adapter.exception("boom"),
    adapter.getSchemaVersion(),
  ].map(extensionExpressionContract);
  expect(contracts.map((contract) => [contract?.member, contract?.observability, contract?.dependencies])).toEqual([
    [
      "routine:$extension:pg_graphql.resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
      "external",
      [],
    ],
    [
      "routine:$extension:pg_graphql._internal_resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
      "external",
      [],
    ],
    ["routine:$extension:pg_graphql.comment_directive(pg_catalog.text)", "tables", []],
    ["routine:$extension:pg_graphql.exception(pg_catalog.text)", "tables", []],
    ["routine:$extension:pg_graphql.get_schema_version()", "external", []],
  ]);
  expect(dialect.sqlToQuery(adapter.getSchemaVersion()).sql).toBe('"graphql"."get_schema_version"()');
  expect(adapter.sql.functions).toEqual({
    resolve: adapter.resolve,
    _internal_resolve: adapter.internalResolve,
    comment_directive: adapter.commentDirective,
    exception: adapter.exception,
    get_schema_version: adapter.getSchemaVersion,
  });
  expect(Object.isFrozen(adapter)).toBe(true);
});

extensionProofUnitTest(pgGraphqlUnitProofCases[3]!, () => {
  expect(pgGraphqlAnnotations.map((member) => member.id).sort()).toEqual(
    manifest.contract.members.map((member) => member.id).sort(),
  );
  const query = pgGraphqlAnnotations.filter((member) => member.disposition === "query").map((member) => member.id);
  expect(query.sort()).toEqual(
    [
      "routine:$extension:pg_graphql._internal_resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
      "routine:$extension:pg_graphql.comment_directive(pg_catalog.text)",
      "routine:$extension:pg_graphql.exception(pg_catalog.text)",
      "routine:$extension:pg_graphql.get_schema_version()",
      "routine:$extension:pg_graphql.resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
    ].sort(),
  );
  expect(
    pgGraphqlAnnotations.every(
      (member) => ["query", "schema", "internal"].includes(member.disposition) && member.evidence.length >= 3,
    ),
  ).toBe(true);
});
