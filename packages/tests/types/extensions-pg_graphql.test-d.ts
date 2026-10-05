import type { SQL } from "drizzle-orm";
import { createPgGraphql_1_5_12 } from "../../../apps/loom/src/core/extensions/adapters/pg_graphql";
import { jsonbDocument, type JsonbDocument } from "../../../apps/loom/src/core/extensions/native-json-codecs";

const descriptor = {
  name: "pg_graphql",
  version: "1.5.12",
  schema: "graphql",
  apiSupport: {
    status: "verified",
    digest: "a64a8bd702ab1dad6e9b171e6f5cc61ec54c2e31411da5d7c6aec86933538d5f",
  },
} as const;
const api = createPgGraphql_1_5_12(descriptor);
const variables = jsonbDocument('{"id":"2"}');
const response: SQL<JsonbDocument> = api.resolve("{ __typename }");
const withVariables: SQL<JsonbDocument> = api.resolve("query Q($id: BigInt!) { __typename }", variables);
const named: SQL<JsonbDocument> = api.resolve("query A { __typename } query B { __typename }", variables, "B");
const withExtensions: SQL<JsonbDocument> = api.resolve("{ __typename }", variables, null, jsonbDocument('{"x":1}'));
const directive: SQL<JsonbDocument> = api.commentDirective('@graphql({"name":"Acct"})');
const emptyDirective: SQL<JsonbDocument> = api.commentDirective(null);
const version: SQL<number> = api.getSchemaVersion();
const decoded: JsonbDocument = api.codecs.response.decode('{"data":null}');
const schema: "graphql" = api.schema;
const published: "1.5.12" = api.version;
// @ts-expect-error Exact factory only accepts 1.5.12.
createPgGraphql_1_5_12({ ...descriptor, version: "1.5.11" });
// @ts-expect-error Fixed installation schema is graphql.
createPgGraphql_1_5_12({ ...descriptor, schema: "extensions" });
// @ts-expect-error GraphQL variables are jsonb documents, never parsed JS objects.
api.resolve("{ __typename }", { id: 2 });
// @ts-expect-error GraphQL query text is not a nested SQL query object.
api.resolve({ sql: "select 1" });
const omittedVariables: SQL<JsonbDocument> = api.resolve("query Q { __typename }", undefined, "Q");
const internalResponse: SQL<JsonbDocument> = api.internalResolve("{ __typename }");
const exceptionExpression: SQL<string> = api.exception("boom");
// @ts-expect-error JS GraphQL result casts are not accepted.
api.resolve<number>("{ __typename }");
// @ts-expect-error Internal C resolve is not an application helper.
api._internal_resolve("{ __typename }");
// @ts-expect-error Trigger-only increment is not an RPC SQL helper.
api.incrementSchemaVersion();
// @ts-expect-error Exact text input is required for the native exception routine.
api.exception(42);

export {
  response,
  omittedVariables,
  internalResponse,
  exceptionExpression,
  withVariables,
  named,
  withExtensions,
  directive,
  emptyDirective,
  version,
  decoded,
  schema,
  published,
};
