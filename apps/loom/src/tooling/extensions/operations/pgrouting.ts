import { sql } from "drizzle-orm";
import * as v from "valibot";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { arrayCodec, booleanCodec, floatCodec, nullableCodec, textCodec } from "../../../core/extensions/codecs";
import { createSqlFunction, defaultSqlArgument, extensionSqlDialect } from "../../../core/extensions/sql";
import { createPgrouting_3_8_0 } from "../../../core/extensions/adapters/pgrouting";
import { withExtensionOperation, type ExtensionOperationContext } from "../operations";
import { acquireExtensionLock } from "../../migrations/connection";
import { verifyExtensionApiContracts, validateExtensionApiRequirement } from "../verify";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import manifest from "../manifests/pgrouting.json";
import postgisManifest from "../manifests/postgis.json";
type Descriptor = ExtensionDescriptor<"pgrouting", { readonly version: "3.8.0"; readonly schema: string }>;
type PostgisDescriptor = ExtensionDescriptor<"postgis", { readonly version: "3.6.4"; readonly schema: string }>;
/** Topology mutations execute only in the existing owned operator transaction. */
export async function withPgroutingOperations<Result>(
  url: string,
  descriptor: Descriptor,
  postgis: PostgisDescriptor,
  operation: (session: PgroutingOperatorSession) => Promise<Result>,
  signal?: AbortSignal,
) {
  createPgrouting_3_8_0(descriptor, postgis);
  return withExtensionOperation(
    url,
    (context) => createSession(context, descriptor, postgis, signal),
    operation,
    signal,
  );
}
async function createSession(
  context: ExtensionOperationContext,
  descriptor: Descriptor,
  postgis: PostgisDescriptor,
  signal?: AbortSignal,
) {
  await acquireExtensionLock(context.client, signal);
  await verifyExtensionApiContracts(context.client, [
    validateExtensionApiRequirement({
      schema: descriptor.schema,
      manifest: v.parse(extensionManifestValidator, manifest),
    }),
    validateExtensionApiRequirement({
      schema: postgis.schema,
      manifest: v.parse(extensionManifestValidator, postgisManifest),
    }),
  ]);
  const path = [descriptor.schema, postgis.schema, "pg_catalog"]
    .map((name) => '"' + name.replaceAll('"', '""') + '"')
    .join(",");
  await context.client.query("SELECT pg_catalog.set_config('search_path',$1,true)", [path]);
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const text = nullableCodec(textCodec),
    bool = nullableCodec(booleanCodec),
    float8 = nullableCodec(floatCodec),
    textArray = nullableCodec(arrayCodec(textCodec));

  const member127 = createSqlFunction({
    ...base,
    name: "pgr_analyzegraph",
    member:
      "routine:$extension:pgrouting.pgr_analyzegraph(pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [
      text,
      float8,
      defaultSqlArgument(text, "the_geom"),
      defaultSqlArgument(text, "id"),
      defaultSqlArgument(text, "source"),
      defaultSqlArgument(text, "target"),
      defaultSqlArgument(text, "rows_where"),
    ] as const,
    result: text,
  });
  const operation127 = (...values: Parameters<typeof member127>) =>
    context.run(async () => {
      const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`SELECT (${member127(...values)})::pg_catalog.text AS value`,
      );
      const rows = await context.client.query<{ value: string | null }>(query.sql, query.params);
      return text.decode(rows.rows[0]?.value);
    });
  const member128 = createSqlFunction({
    ...base,
    name: "pgr_analyzeoneway",
    member:
      "routine:$extension:pgrouting.pgr_analyzeoneway(pg_catalog.text,pg_catalog._text,pg_catalog._text,pg_catalog._text,pg_catalog._text,pg_catalog.bool,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [
      text,
      textArray,
      textArray,
      textArray,
      textArray,
      defaultSqlArgument(bool, "two_way_if_null"),
      defaultSqlArgument(text, "oneway"),
      defaultSqlArgument(text, "source"),
      defaultSqlArgument(text, "target"),
    ] as const,
    result: text,
  });
  const operation128 = (...values: Parameters<typeof member128>) =>
    context.run(async () => {
      const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`SELECT (${member128(...values)})::pg_catalog.text AS value`,
      );
      const rows = await context.client.query<{ value: string | null }>(query.sql, query.params);
      return text.decode(rows.rows[0]?.value);
    });
  const member192 = createSqlFunction({
    ...base,
    name: "pgr_createtopology",
    member:
      "routine:$extension:pgrouting.pgr_createtopology(pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    arguments: [
      text,
      float8,
      defaultSqlArgument(text, "the_geom"),
      defaultSqlArgument(text, "id"),
      defaultSqlArgument(text, "source"),
      defaultSqlArgument(text, "target"),
      defaultSqlArgument(text, "rows_where"),
      defaultSqlArgument(bool, "clean"),
    ] as const,
    result: text,
  });
  const operation192 = (...values: Parameters<typeof member192>) =>
    context.run(async () => {
      const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`SELECT (${member192(...values)})::pg_catalog.text AS value`,
      );
      const rows = await context.client.query<{ value: string | null }>(query.sql, query.params);
      return text.decode(rows.rows[0]?.value);
    });
  const member193 = createSqlFunction({
    ...base,
    name: "pgr_createverticestable",
    member:
      "routine:$extension:pgrouting.pgr_createverticestable(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [
      text,
      defaultSqlArgument(text, "the_geom"),
      defaultSqlArgument(text, "source"),
      defaultSqlArgument(text, "target"),
      defaultSqlArgument(text, "rows_where"),
    ] as const,
    result: text,
  });
  const operation193 = (...values: Parameters<typeof member193>) =>
    context.run(async () => {
      const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`SELECT (${member193(...values)})::pg_catalog.text AS value`,
      );
      const rows = await context.client.query<{ value: string | null }>(query.sql, query.params);
      return text.decode(rows.rows[0]?.value);
    });
  const member287 = createSqlFunction({
    ...base,
    name: "pgr_nodenetwork",
    member:
      "routine:$extension:pgrouting.pgr_nodenetwork(pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    arguments: [
      text,
      float8,
      defaultSqlArgument(text, "id"),
      defaultSqlArgument(text, "the_geom"),
      defaultSqlArgument(text, "table_ending"),
      defaultSqlArgument(text, "rows_where"),
      defaultSqlArgument(bool, "outall"),
    ] as const,
    result: text,
  });
  const operation287 = (...values: Parameters<typeof member287>) =>
    context.run(async () => {
      const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`SELECT (${member287(...values)})::pg_catalog.text AS value`,
      );
      const rows = await context.client.query<{ value: string | null }>(query.sql, query.params);
      return text.decode(rows.rows[0]?.value);
    });
  const functions = Object.freeze({
    pgr_analyzegraph: operation127,
    pgr_analyzeoneway: operation128,
    pgr_createtopology: operation192,
    pgr_createverticestable: operation193,
    pgr_nodenetwork: operation287,
  });
  return Object.freeze({
    pgrAnalyzegraph: operation127,
    pgrAnalyzeoneway: operation128,
    pgrCreatetopology: operation192,
    pgrCreateverticestable: operation193,
    pgrNodenetwork: operation287,
    sql: Object.freeze({
      functions,
      overloads: Object.freeze({
        "routine:$extension:pgrouting.pgr_analyzegraph(pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)":
          operation127,
        "routine:$extension:pgrouting.pgr_analyzeoneway(pg_catalog.text,pg_catalog._text,pg_catalog._text,pg_catalog._text,pg_catalog._text,pg_catalog.bool,pg_catalog.text,pg_catalog.text,pg_catalog.text)":
          operation128,
        "routine:$extension:pgrouting.pgr_createtopology(pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)":
          operation192,
        "routine:$extension:pgrouting.pgr_createverticestable(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)":
          operation193,
        "routine:$extension:pgrouting.pgr_nodenetwork(pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)":
          operation287,
      }),
    }),
  });
}
export type PgroutingOperatorSession = Awaited<ReturnType<typeof createSession>>;
