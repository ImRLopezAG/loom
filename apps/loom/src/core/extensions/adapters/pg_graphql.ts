import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { nullableCodec, textCodec } from "../codecs";
import { int4Codec } from "../native-codecs";
import { createSqlFunction, defaultSqlArgument } from "../sql";
import {
  graphqlJsonbCodec,
  graphqlResponseCodec,
  graphqlVariablesCodec,
  type JsonbDocument,
} from "./pg_graphql-codecs";

export {
  graphqlJsonbCodec,
  graphqlJsonbDocument,
  graphqlResponseCodec,
  graphqlVariablesCodec,
  jsonbDocument,
  jsonbValue,
} from "./pg_graphql-codecs";
export type { JsonbDocument } from "./pg_graphql-codecs";

const digest = "a64a8bd702ab1dad6e9b171e6f5cc61ec54c2e31411da5d7c6aec86933538d5f";
const member = {
  internalResolve:
    "routine:$extension:pg_graphql._internal_resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
  exception: "routine:$extension:pg_graphql.exception(pg_catalog.text)",
  commentDirective: "routine:$extension:pg_graphql.comment_directive(pg_catalog.text)",
  getSchemaVersion: "routine:$extension:pg_graphql.get_schema_version()",
  resolve: "routine:$extension:pg_graphql.resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
} as const;

/** Exact pg_graphql 1.5.12 query helpers. GraphQL text is native SQL input, never a JS GraphQL executor. */
export function createPgGraphql_1_5_12<
  const Descriptor extends ExtensionDescriptor<"pg_graphql", { version: "1.5.12"; schema: "graphql" }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "pg_graphql" ||
    descriptor.version !== "1.5.12" ||
    descriptor.schema !== "graphql" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("pg_graphql 1.5.12 requires its exact verified contract");
  const queryText = nullableCodec(textCodec);
  const queryJsonb = nullableCodec(graphqlJsonbCodec);
  const resolveArguments = [
    queryText,
    defaultSqlArgument(queryJsonb, "variables"),
    defaultSqlArgument(queryText, "operationName"),
    defaultSqlArgument(queryJsonb, "extensions"),
  ] as const;
  const resolve = createSqlFunction({
    schema: descriptor.schema,
    authority: "query",
    observability: "external",
    dependencies: [],
    name: "resolve",
    member: member.resolve,
    arguments: resolveArguments,
    result: graphqlResponseCodec,
  });
  const internalResolve = createSqlFunction({
    schema: descriptor.schema,
    authority: "query",
    observability: "external",
    dependencies: [],
    name: "_internal_resolve",
    member: member.internalResolve,
    arguments: resolveArguments,
    result: graphqlResponseCodec,
  });
  const exception = createSqlFunction({
    schema: descriptor.schema,
    authority: "query",
    observability: "tables",
    dependencies: [],
    name: "exception",
    member: member.exception,
    arguments: [queryText] as const,
    result: textCodec,
  });
  const commentDirective = createSqlFunction({
    schema: descriptor.schema,
    authority: "query",
    observability: "tables",
    dependencies: [],
    name: "comment_directive",
    member: member.commentDirective,
    arguments: [queryText] as const,
    result: graphqlJsonbCodec,
  });
  const getSchemaVersion = createSqlFunction({
    schema: descriptor.schema,
    authority: "query",
    observability: "external",
    dependencies: [],
    name: "get_schema_version",
    member: member.getSchemaVersion,
    arguments: [] as const,
    result: int4Codec,
  });
  const codecs = Object.freeze({
    response: graphqlResponseCodec,
    variables: graphqlVariablesCodec,
    extensions: graphqlJsonbCodec,
    directive: graphqlJsonbCodec,
  });
  return bindExtension(descriptor, {
    resolve,
    internalResolve,
    exception,
    commentDirective,
    getSchemaVersion,
    codecs,
    sql: Object.freeze({
      functions: Object.freeze({
        resolve,
        _internal_resolve: internalResolve,
        exception,
        comment_directive: commentDirective,
        get_schema_version: getSchemaVersion,
      }),
      operators: Object.freeze({}),
      overloads: Object.freeze({
        [member.commentDirective]: commentDirective,
        [member.getSchemaVersion]: getSchemaVersion,
        [member.resolve]: resolve,
        [member.internalResolve]: internalResolve,
        [member.exception]: exception,
      }),
      types: Object.freeze({}),
    }),
  });
}

export type PgGraphqlResolveResult = JsonbDocument;
