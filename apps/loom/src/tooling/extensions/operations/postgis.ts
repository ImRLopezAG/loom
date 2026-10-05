import { sql } from "drizzle-orm";
import * as v from "valibot";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { createSqlFunction, defaultSqlArgument, extensionSqlDialect } from "../../../core/extensions/sql";
import { createPostgis_3_6_4, createPostgisCodecDefinitions } from "../../../core/extensions/adapters/postgis";
import { postgisFlatGeobufBytes } from "../../../core/extensions/adapters/postgis-flat-geobuf";
import type { CodecOutput } from "../../../core/extensions/codecs";
import { withExtensionOperation } from "../operations";
import { acquireExtensionLock } from "../../migrations/connection";
import { verifyExtensionApiContracts, validateExtensionApiRequirement } from "../verify";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import manifest from "../manifests/postgis.json";
type Descriptor = ExtensionDescriptor<"postgis", { readonly version: "3.6.4"; readonly schema: string }>;
/** Captured maintenance routines execute only inside an owned migration transaction. */
export async function withPostgisOperations<Result>(
  url: string,
  descriptor: Descriptor,
  operation: (session: PostgisOperatorSession) => Promise<Result>,
  signal?: AbortSignal,
) {
  createPostgis_3_6_4(descriptor);
  return withExtensionOperation(
    url,
    (context) => createOperatorSession(context, descriptor, signal),
    operation,
    signal,
  );
}
async function createOperatorSession(
  context: import("../operations").ExtensionOperationContext,
  descriptor: Descriptor,
  signal?: AbortSignal,
) {
  await acquireExtensionLock(context.client, signal);
  await verifyExtensionApiContracts(context.client, [
    validateExtensionApiRequirement({
      schema: descriptor.schema,
      manifest: v.parse(extensionManifestValidator, manifest),
    }),
  ]);
  const schema = descriptor.schema;
  await context.client.query("SELECT pg_catalog.set_config('search_path',$1,true)", [
    `${'"' + schema.replaceAll('"', '""') + '"'},pg_catalog`,
  ]);
  const base = { schema, dependencies: [], observability: "tables", authority: "query" } as const;

  const { nc8, nc14, nc15, nc17, nc19, nc21, nc23 } = createPostgisCodecDefinitions(schema);
  const member306 = createSqlFunction({
    ...base,
    name: "addgeometrycolumn",
    member:
      "routine:$extension:postgis.addgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc21, nc21, nc19, nc21, nc19, defaultSqlArgument(nc15, "use_typmod")] as const,
    result: nc14,
  });
  const opmember306 = (...values: Parameters<typeof member306>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member306(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc14.decode(rows.rows[0]?.value);
    });
  const member307 = createSqlFunction({
    ...base,
    name: "addgeometrycolumn",
    member:
      "routine:$extension:postgis.addgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc21, nc21, nc21, nc19, nc21, nc19, defaultSqlArgument(nc15, "use_typmod")] as const,
    result: nc14,
  });
  const opmember307 = (...values: Parameters<typeof member307>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member307(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc14.decode(rows.rows[0]?.value);
    });
  const member308 = createSqlFunction({
    ...base,
    name: "addgeometrycolumn",
    member:
      "routine:$extension:postgis.addgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc21, nc21, nc21, nc21, nc19, nc21, nc19, defaultSqlArgument(nc15, "use_typmod")] as const,
    result: nc14,
  });
  const opmember308 = (...values: Parameters<typeof member308>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member308(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc14.decode(rows.rows[0]?.value);
    });
  const member327 = createSqlFunction({
    ...base,
    name: "dropgeometrycolumn",
    member:
      "routine:$extension:postgis.dropgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)",
    arguments: [nc21, nc21, nc21, nc21] as const,
    result: nc14,
  });
  const opmember327 = (...values: Parameters<typeof member327>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member327(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc14.decode(rows.rows[0]?.value);
    });
  const member328 = createSqlFunction({
    ...base,
    name: "dropgeometrycolumn",
    member: "routine:$extension:postgis.dropgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)",
    arguments: [nc21, nc21, nc21] as const,
    result: nc14,
  });
  const opmember328 = (...values: Parameters<typeof member328>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member328(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc14.decode(rows.rows[0]?.value);
    });
  const member329 = createSqlFunction({
    ...base,
    name: "dropgeometrycolumn",
    member: "routine:$extension:postgis.dropgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar)",
    arguments: [nc21, nc21] as const,
    result: nc14,
  });
  const opmember329 = (...values: Parameters<typeof member329>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member329(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc14.decode(rows.rows[0]?.value);
    });
  const member330 = createSqlFunction({
    ...base,
    name: "dropgeometrytable",
    member: "routine:$extension:postgis.dropgeometrytable(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)",
    arguments: [nc21, nc21, nc21] as const,
    result: nc14,
  });
  const opmember330 = (...values: Parameters<typeof member330>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member330(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc14.decode(rows.rows[0]?.value);
    });
  const member331 = createSqlFunction({
    ...base,
    name: "dropgeometrytable",
    member: "routine:$extension:postgis.dropgeometrytable(pg_catalog.varchar,pg_catalog.varchar)",
    arguments: [nc21, nc21] as const,
    result: nc14,
  });
  const opmember331 = (...values: Parameters<typeof member331>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member331(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc14.decode(rows.rows[0]?.value);
    });
  const member332 = createSqlFunction({
    ...base,
    name: "dropgeometrytable",
    member: "routine:$extension:postgis.dropgeometrytable(pg_catalog.varchar)",
    arguments: [nc21] as const,
    result: nc14,
  });
  const opmember332 = (...values: Parameters<typeof member332>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member332(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc14.decode(rows.rows[0]?.value);
    });
  const member518 = createSqlFunction({
    ...base,
    name: "populate_geometry_columns",
    member: "routine:$extension:postgis.populate_geometry_columns(pg_catalog.bool)",
    arguments: [defaultSqlArgument(nc15, "use_typmod")] as const,
    result: nc14,
  });
  const opmember518 = (...values: Parameters<typeof member518>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member518(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc14.decode(rows.rows[0]?.value);
    });
  const member519 = createSqlFunction({
    ...base,
    name: "populate_geometry_columns",
    member: "routine:$extension:postgis.populate_geometry_columns(pg_catalog.oid,pg_catalog.bool)",
    arguments: [nc23, defaultSqlArgument(nc15, "use_typmod")] as const,
    result: nc19,
  });
  const opmember519 = (...values: Parameters<typeof member519>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member519(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc19.decode(rows.rows[0]?.value);
    });
  const member526 = createSqlFunction({
    ...base,
    name: "postgis_extensions_upgrade",
    member: "routine:$extension:postgis.postgis_extensions_upgrade(pg_catalog.text)",
    arguments: [defaultSqlArgument(nc14, "target_version")] as const,
    result: nc14,
  });
  const opmember526 = (...values: Parameters<typeof member526>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member526(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc14.decode(rows.rows[0]?.value);
    });
  const member1034 = createSqlFunction({
    ...base,
    name: "updategeometrysrid",
    member: "routine:$extension:postgis.updategeometrysrid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4)",
    arguments: [nc21, nc21, nc19] as const,
    result: nc14,
  });
  const opmember1034 = (...values: Parameters<typeof member1034>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member1034(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc14.decode(rows.rows[0]?.value);
    });
  const member1035 = createSqlFunction({
    ...base,
    name: "updategeometrysrid",
    member:
      "routine:$extension:postgis.updategeometrysrid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4)",
    arguments: [nc21, nc21, nc21, nc19] as const,
    result: nc14,
  });
  const opmember1035 = (...values: Parameters<typeof member1035>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member1035(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc14.decode(rows.rows[0]?.value);
    });
  const member1036 = createSqlFunction({
    ...base,
    name: "updategeometrysrid",
    member:
      "routine:$extension:postgis.updategeometrysrid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4)",
    arguments: [nc21, nc21, nc21, nc21, nc19] as const,
    result: nc14,
  });
  const opmember1036 = (...values: Parameters<typeof member1036>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member1036(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc14.decode(rows.rows[0]?.value);
    });
  const member751 = createSqlFunction({
    ...base,
    name: "st_fromflatgeobuftotable",
    member: "routine:$extension:postgis.st_fromflatgeobuftotable(pg_catalog.text,pg_catalog.text,pg_catalog.bytea)",
    arguments: [nc14, nc14, nc8] as const,
    result: nc17,
  });
  const opmember751 = (...values: Parameters<typeof member751>) =>
    context.run(async () => {
      // The native routine returns NULL before reading bytes when either name is NULL.
      // Materialize each argument once so nullable/volatile SQL names keep that order of evaluation.
      if (v.is(v.string(), values[0]) && v.is(v.string(), values[1]))
        postgisFlatGeobufBytes(values[2], "ST_FromFlatGeobufToTable");
      const schemaName = v.is(v.nullable(v.string()), values[0]) ? sql.param(nc14.encode(values[0])) : values[0];
      const tableName = v.is(v.nullable(v.string()), values[1]) ? sql.param(nc14.encode(values[1])) : values[1];
      const payload = v.is(v.nullable(v.object({ hex: v.string() })), values[2])
        ? sql.param(nc8.encode(values[2]))
        : values[2];
      const call = member751(
        sql<CodecOutput<typeof nc14>>`fgb_input.schema_name`,
        sql<CodecOutput<typeof nc14>>`fgb_input.table_name`,
        postgisFlatGeobufBytes(sql<CodecOutput<typeof nc8>>`fgb_input.payload`, "ST_FromFlatGeobufToTable"),
      );
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`WITH fgb_input AS MATERIALIZED (
          SELECT ${schemaName}::pg_catalog.text schema_name, ${tableName}::pg_catalog.text table_name,
                 ${payload}::pg_catalog.bytea payload
        ) SELECT CASE WHEN fgb_input.schema_name IS NULL OR fgb_input.table_name IS NULL
          THEN NULL::pg_catalog.text ELSE (${call})::pg_catalog.text END value FROM fgb_input`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc17.decode(rows.rows[0]?.value);
    });
  return Object.freeze({
    "routine:$extension:postgis.st_fromflatgeobuftotable(pg_catalog.text,pg_catalog.text,pg_catalog.bytea)":
      opmember751,
    "routine:$extension:postgis.addgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)":
      opmember306,
    "routine:$extension:postgis.addgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)":
      opmember307,
    "routine:$extension:postgis.addgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)":
      opmember308,
    "routine:$extension:postgis.dropgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)":
      opmember327,
    "routine:$extension:postgis.dropgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)":
      opmember328,
    "routine:$extension:postgis.dropgeometrycolumn(pg_catalog.varchar,pg_catalog.varchar)": opmember329,
    "routine:$extension:postgis.dropgeometrytable(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)":
      opmember330,
    "routine:$extension:postgis.dropgeometrytable(pg_catalog.varchar,pg_catalog.varchar)": opmember331,
    "routine:$extension:postgis.dropgeometrytable(pg_catalog.varchar)": opmember332,
    "routine:$extension:postgis.populate_geometry_columns(pg_catalog.bool)": opmember518,
    "routine:$extension:postgis.populate_geometry_columns(pg_catalog.oid,pg_catalog.bool)": opmember519,
    "routine:$extension:postgis.postgis_extensions_upgrade(pg_catalog.text)": opmember526,
    "routine:$extension:postgis.updategeometrysrid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4)":
      opmember1034,
    "routine:$extension:postgis.updategeometrysrid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4)":
      opmember1035,
    "routine:$extension:postgis.updategeometrysrid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar,pg_catalog.int4)":
      opmember1036,
  });
}
export type PostgisOperatorSession = Awaited<ReturnType<typeof createOperatorSession>>;
