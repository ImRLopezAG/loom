import { sql, type SQLWrapper } from "drizzle-orm";
import * as v from "valibot";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import {
  arrayCodec,
  binaryCodec,
  booleanCodec,
  compositeCodec,
  createExtensionCodec,
  floatCodec,
  integerCodec,
  nullableCodec,
  numericCodec,
  textCodec,
  withCodecSqlType,
  type ExtensionCodec,
} from "../../../core/extensions/codecs";
import { int4Codec } from "../../../core/extensions/native-codecs";
import { int2Codec } from "../../../core/extensions/primitive-number-codecs";
import { jsonCodec, jsonbCodec } from "../../../core/extensions/native-json-codecs";
import { createSqlFunction, defaultSqlArgument, extensionSqlDialect } from "../../../core/extensions/sql";
import {
  createPostgisRaster_3_6_4,
  createRasterVariadicFunction,
} from "../../../core/extensions/adapters/postgis-raster";
import { createPostgisGeometryCodec, createPostgisTextCodec } from "../../../core/extensions/adapters/postgis-codecs";
import { createPostgisRasterCodec } from "../../../core/extensions/adapters/postgis-raster-codecs";
import { withExtensionOperation } from "../operations";
import { acquireExtensionLock } from "../../migrations/connection";
import { verifyExtensionApiContracts, validateExtensionApiRequirement } from "../verify";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import manifest from "../manifests/postgis_raster.json";
const sqlOnly = createExtensionCodec({
  id: "postgis_raster:expression",
  input: v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value)),
  output: v.never(),
  transport: "native",
  encode: () => {
    throw new Error("Native SQL required");
  },
  decode: () => {
    throw new Error("Concrete codec required");
  },
});
const voidCodec = createExtensionCodec({
  id: "pg:void:1",
  sqlType: { schema: "pg_catalog", name: "void" },
  input: v.null(),
  output: v.null(),
  transport: "text",
  encode: () => null,
  decode: () => null,
});
type Descriptor = ExtensionDescriptor<"postgis_raster", { readonly version: "3.6.4"; readonly schema: string }>;
type PostgisDescriptor = ExtensionDescriptor<"postgis", { readonly version: "3.6.4"; readonly schema: string }>;
/** Captured maintenance routines execute only inside an owned migration transaction. */
export async function withPostgisRasterOperations<Result>(
  url: string,
  descriptor: Descriptor,
  postgis: PostgisDescriptor,
  operation: (session: PostgisRasterOperatorSession) => Promise<Result>,
  signal?: AbortSignal,
) {
  createPostgisRaster_3_6_4(descriptor, postgis);
  return withExtensionOperation(
    url,
    (context) => createOperatorSession(context, descriptor, postgis, signal),
    operation,
    signal,
  );
}
async function createOperatorSession(
  context: import("../operations").ExtensionOperationContext,
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
  ]);
  const schema = descriptor.schema;
  const postgisSchema = postgis.schema;
  await context.client.query("SELECT pg_catalog.set_config('search_path',$1,true)", [
    `${'"' + schema.replaceAll('"', '""') + '"'},${'"' + postgisSchema.replaceAll('"', '""') + '"'},pg_catalog`,
  ]);
  const base = { schema, dependencies: [], observability: "tables", authority: "query" } as const;

  const c0 = createPostgisRasterCodec(schema);
  const nc0 = nullableCodec(c0);
  const c1 = createPostgisTextCodec(postgisSchema, "box3d");
  const nc1 = nullableCodec(c1);
  const c2 = createPostgisGeometryCodec(postgisSchema);
  const nc2 = nullableCodec(c2);
  const c3 = binaryCodec;
  const nc3 = nullableCodec(c3);
  const c4 = booleanCodec;
  const nc4 = nullableCodec(c4);
  const c5 = int4Codec;
  const nc5 = nullableCodec(c5);
  const c6 = floatCodec;
  const nc6 = nullableCodec(c6);
  const c7 = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "name" });
  const nc7 = nullableCodec(c7);
  const c8 = textCodec;
  const nc8 = nullableCodec(c8);
  const c9 = createPostgisTextCodec("pg_catalog", "bpchar");
  const nc9 = nullableCodec(c9);
  const c10 = sqlOnly;
  const nc10 = nullableCodec(c10);
  const c11 = arrayCodec(c6);
  const nc11 = nullableCodec(c11);
  const c12 = arrayCodec(c4);
  const nc12 = nullableCodec(c12);
  const c13 = arrayCodec(c8);
  const nc13 = nullableCodec(c13);
  const c14 = arrayCodec(c5);
  const nc14 = nullableCodec(c14);
  const c15 = integerCodec;
  const nc15 = nullableCodec(c15);
  const c16 = createPostgisTextCodec("pg_catalog", "regprocedure");
  const nc16 = nullableCodec(c16);
  const c17 = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "cstring" });
  const nc17 = nullableCodec(c17);
  const c18 = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "regclass" });
  const nc18 = nullableCodec(c18);
  const c19 = numericCodec;
  const nc19 = nullableCodec(c19);
  const c20 = arrayCodec(c0);
  const nc20 = nullableCodec(c20);
  const c21 = withCodecSqlType(
    compositeCodec("postgis_raster:addbandarg:3.6.4", {
      index: nullableCodec(c5),
      pixeltype: nullableCodec(c8),
      initialvalue: nullableCodec(c6),
      nodataval: nullableCodec(c6),
    }),
    { schema, name: "addbandarg" },
  );
  const nc21 = nullableCodec(c21);
  const c22 = withCodecSqlType(
    compositeCodec("postgis_raster:agg_count:3.6.4", {
      count: nullableCodec(c15),
      nband: nullableCodec(c5),
      exclude_nodata_value: nullableCodec(c4),
      sample_percent: nullableCodec(c6),
    }),
    { schema, name: "agg_count" },
  );
  const nc22 = nullableCodec(c22);
  const c23 = withCodecSqlType(
    compositeCodec("postgis_raster:agg_samealignment:3.6.4", {
      refraster: nullableCodec(c0),
      aligned: nullableCodec(c4),
    }),
    { schema, name: "agg_samealignment" },
  );
  const nc23 = nullableCodec(c23);
  const c24 = withCodecSqlType(
    compositeCodec("postgis_raster:geomval:3.6.4", { geom: nullableCodec(c2), val: nullableCodec(c6) }),
    { schema, name: "geomval" },
  );
  const nc24 = nullableCodec(c24);
  const c25 = withCodecSqlType(
    compositeCodec("postgis_raster:rastbandarg:3.6.4", { rast: nullableCodec(c0), nband: nullableCodec(c5) }),
    { schema, name: "rastbandarg" },
  );
  const nc25 = nullableCodec(c25);
  const c26 = withCodecSqlType(
    compositeCodec("postgis_raster:raster_columns:3.6.4", {
      r_table_catalog: nullableCodec(c7),
      r_table_schema: nullableCodec(c7),
      r_table_name: nullableCodec(c7),
      r_raster_column: nullableCodec(c7),
      srid: nullableCodec(c5),
      scale_x: nullableCodec(c6),
      scale_y: nullableCodec(c6),
      blocksize_x: nullableCodec(c5),
      blocksize_y: nullableCodec(c5),
      same_alignment: nullableCodec(c4),
      regular_blocking: nullableCodec(c4),
      num_bands: nullableCodec(c5),
      pixel_types: nullableCodec(c13),
      nodata_values: nullableCodec(c11),
      out_db: nullableCodec(c12),
      extent: nullableCodec(c2),
      spatial_index: nullableCodec(c4),
    }),
    { schema, name: "raster_columns" },
  );
  const nc26 = nullableCodec(c26);
  const c27 = withCodecSqlType(
    compositeCodec("postgis_raster:raster_overviews:3.6.4", {
      o_table_catalog: nullableCodec(c7),
      o_table_schema: nullableCodec(c7),
      o_table_name: nullableCodec(c7),
      o_raster_column: nullableCodec(c7),
      r_table_catalog: nullableCodec(c7),
      r_table_schema: nullableCodec(c7),
      r_table_name: nullableCodec(c7),
      r_raster_column: nullableCodec(c7),
      overview_factor: nullableCodec(c5),
    }),
    { schema, name: "raster_overviews" },
  );
  const nc27 = nullableCodec(c27);
  const c28 = withCodecSqlType(
    compositeCodec("postgis_raster:reclassarg:3.6.4", {
      nband: nullableCodec(c5),
      reclassexpr: nullableCodec(c8),
      pixeltype: nullableCodec(c8),
      nodataval: nullableCodec(c6),
    }),
    { schema, name: "reclassarg" },
  );
  const nc28 = nullableCodec(c28);
  const c29 = withCodecSqlType(
    compositeCodec("postgis_raster:summarystats:3.6.4", {
      count: nullableCodec(c15),
      sum: nullableCodec(c6),
      mean: nullableCodec(c6),
      stddev: nullableCodec(c6),
      min: nullableCodec(c6),
      max: nullableCodec(c6),
    }),
    { schema, name: "summarystats" },
  );
  const nc29 = nullableCodec(c29);
  const c30 = withCodecSqlType(
    compositeCodec("postgis_raster:unionarg:3.6.4", { nband: nullableCodec(c5), uniontype: nullableCodec(c8) }),
    { schema, name: "unionarg" },
  );
  const nc30 = nullableCodec(c30);
  const c31 = arrayCodec(c19);
  const nc31 = nullableCodec(c31);
  const c32 = arrayCodec(c21);
  const nc32 = nullableCodec(c32);
  const c33 = arrayCodec(c22);
  const nc33 = nullableCodec(c33);
  const c34 = arrayCodec(c23);
  const nc34 = nullableCodec(c34);
  const c35 = arrayCodec(c24);
  const nc35 = nullableCodec(c35);
  const c36 = arrayCodec(c25);
  const nc36 = nullableCodec(c36);
  const c37 = arrayCodec(c26);
  const nc37 = nullableCodec(c37);
  const c38 = arrayCodec(c27);
  const nc38 = nullableCodec(c38);
  const c39 = arrayCodec(c28);
  const nc39 = nullableCodec(c39);
  const c40 = arrayCodec(c29);
  const nc40 = nullableCodec(c40);
  const c41 = arrayCodec(c30);
  const nc41 = nullableCodec(c41);

  const member138 = createSqlFunction({
    ...base,
    name: "addoverviewconstraints",
    member:
      "routine:$extension:postgis_raster.addoverviewconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.int4)",
    arguments: [nc7, nc7, nc7, nc7, nc5] as const,
    result: nc4,
  });
  const opmember138 = (...values: Parameters<typeof member138>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${member138(...values)}) value`);
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc4.decode(rows.rows[0]?.value);
    });
  const member139 = createSqlFunction({
    ...base,
    name: "addoverviewconstraints",
    member:
      "routine:$extension:postgis_raster.addoverviewconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.int4)",
    arguments: [nc7, nc7, nc7, nc7, nc7, nc7, nc5] as const,
    result: nc4,
  });
  const opmember139 = (...values: Parameters<typeof member139>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${member139(...values)}) value`);
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc4.decode(rows.rows[0]?.value);
    });
  const member140 = createRasterVariadicFunction({
    ...base,
    name: "addrasterconstraints",
    member: "routine:$extension:postgis_raster.addrasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog._text)",
    arguments: [nc7, nc7, nc13] as const,
    result: nc4,
  });
  const opmember140 = (...values: Parameters<typeof member140>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${member140(...values)}) value`);
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc4.decode(rows.rows[0]?.value);
    });
  const member141 = createSqlFunction({
    ...base,
    name: "addrasterconstraints",
    member:
      "routine:$extension:postgis_raster.addrasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    arguments: [
      nc7,
      nc7,
      defaultSqlArgument(nc4, "srid"),
      defaultSqlArgument(nc4, "scale_x"),
      defaultSqlArgument(nc4, "scale_y"),
      defaultSqlArgument(nc4, "blocksize_x"),
      defaultSqlArgument(nc4, "blocksize_y"),
      defaultSqlArgument(nc4, "same_alignment"),
      defaultSqlArgument(nc4, "regular_blocking"),
      defaultSqlArgument(nc4, "num_bands"),
      defaultSqlArgument(nc4, "pixel_types"),
      defaultSqlArgument(nc4, "nodata_values"),
      defaultSqlArgument(nc4, "out_db"),
      defaultSqlArgument(nc4, "extent"),
    ] as const,
    result: nc4,
  });
  const opmember141 = (...values: Parameters<typeof member141>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${member141(...values)}) value`);
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc4.decode(rows.rows[0]?.value);
    });
  const member142 = createRasterVariadicFunction({
    ...base,
    name: "addrasterconstraints",
    member:
      "routine:$extension:postgis_raster.addrasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog._text)",
    arguments: [nc7, nc7, nc7, nc13] as const,
    result: nc4,
  });
  const opmember142 = (...values: Parameters<typeof member142>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${member142(...values)}) value`);
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc4.decode(rows.rows[0]?.value);
    });
  const member143 = createSqlFunction({
    ...base,
    name: "addrasterconstraints",
    member:
      "routine:$extension:postgis_raster.addrasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    arguments: [
      nc7,
      nc7,
      nc7,
      defaultSqlArgument(nc4, "srid"),
      defaultSqlArgument(nc4, "scale_x"),
      defaultSqlArgument(nc4, "scale_y"),
      defaultSqlArgument(nc4, "blocksize_x"),
      defaultSqlArgument(nc4, "blocksize_y"),
      defaultSqlArgument(nc4, "same_alignment"),
      defaultSqlArgument(nc4, "regular_blocking"),
      defaultSqlArgument(nc4, "num_bands"),
      defaultSqlArgument(nc4, "pixel_types"),
      defaultSqlArgument(nc4, "nodata_values"),
      defaultSqlArgument(nc4, "out_db"),
      defaultSqlArgument(nc4, "extent"),
    ] as const,
    result: nc4,
  });
  const opmember143 = (...values: Parameters<typeof member143>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${member143(...values)}) value`);
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc4.decode(rows.rows[0]?.value);
    });
  const member146 = createSqlFunction({
    ...base,
    name: "dropoverviewconstraints",
    member:
      "routine:$extension:postgis_raster.dropoverviewconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    arguments: [nc7, nc7, nc7] as const,
    result: nc4,
  });
  const opmember146 = (...values: Parameters<typeof member146>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${member146(...values)}) value`);
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc4.decode(rows.rows[0]?.value);
    });
  const member147 = createSqlFunction({
    ...base,
    name: "dropoverviewconstraints",
    member: "routine:$extension:postgis_raster.dropoverviewconstraints(pg_catalog.name,pg_catalog.name)",
    arguments: [nc7, nc7] as const,
    result: nc4,
  });
  const opmember147 = (...values: Parameters<typeof member147>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${member147(...values)}) value`);
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc4.decode(rows.rows[0]?.value);
    });
  const member148 = createRasterVariadicFunction({
    ...base,
    name: "droprasterconstraints",
    member: "routine:$extension:postgis_raster.droprasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog._text)",
    arguments: [nc7, nc7, nc13] as const,
    result: nc4,
  });
  const opmember148 = (...values: Parameters<typeof member148>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${member148(...values)}) value`);
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc4.decode(rows.rows[0]?.value);
    });
  const member149 = createSqlFunction({
    ...base,
    name: "droprasterconstraints",
    member:
      "routine:$extension:postgis_raster.droprasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    arguments: [
      nc7,
      nc7,
      defaultSqlArgument(nc4, "srid"),
      defaultSqlArgument(nc4, "scale_x"),
      defaultSqlArgument(nc4, "scale_y"),
      defaultSqlArgument(nc4, "blocksize_x"),
      defaultSqlArgument(nc4, "blocksize_y"),
      defaultSqlArgument(nc4, "same_alignment"),
      defaultSqlArgument(nc4, "regular_blocking"),
      defaultSqlArgument(nc4, "num_bands"),
      defaultSqlArgument(nc4, "pixel_types"),
      defaultSqlArgument(nc4, "nodata_values"),
      defaultSqlArgument(nc4, "out_db"),
      defaultSqlArgument(nc4, "extent"),
    ] as const,
    result: nc4,
  });
  const opmember149 = (...values: Parameters<typeof member149>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${member149(...values)}) value`);
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc4.decode(rows.rows[0]?.value);
    });
  const member150 = createRasterVariadicFunction({
    ...base,
    name: "droprasterconstraints",
    member:
      "routine:$extension:postgis_raster.droprasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog._text)",
    arguments: [nc7, nc7, nc7, nc13] as const,
    result: nc4,
  });
  const opmember150 = (...values: Parameters<typeof member150>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${member150(...values)}) value`);
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc4.decode(rows.rows[0]?.value);
    });
  const member151 = createSqlFunction({
    ...base,
    name: "droprasterconstraints",
    member:
      "routine:$extension:postgis_raster.droprasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    arguments: [
      nc7,
      nc7,
      nc7,
      defaultSqlArgument(nc4, "srid"),
      defaultSqlArgument(nc4, "scale_x"),
      defaultSqlArgument(nc4, "scale_y"),
      defaultSqlArgument(nc4, "blocksize_x"),
      defaultSqlArgument(nc4, "blocksize_y"),
      defaultSqlArgument(nc4, "same_alignment"),
      defaultSqlArgument(nc4, "regular_blocking"),
      defaultSqlArgument(nc4, "num_bands"),
      defaultSqlArgument(nc4, "pixel_types"),
      defaultSqlArgument(nc4, "nodata_values"),
      defaultSqlArgument(nc4, "out_db"),
      defaultSqlArgument(nc4, "extent"),
    ] as const,
    result: nc4,
  });
  const opmember151 = (...values: Parameters<typeof member151>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${member151(...values)}) value`);
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc4.decode(rows.rows[0]?.value);
    });
  const member274 = createSqlFunction({
    ...base,
    name: "st_createoverview",
    member:
      "routine:$extension:postgis_raster.st_createoverview(pg_catalog.regclass,pg_catalog.name,pg_catalog.int4,pg_catalog.text)",
    arguments: [nc18, nc7, nc5, defaultSqlArgument(nc8, "algo")] as const,
    result: nc18,
  });
  const opmember274 = (...values: Parameters<typeof member274>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member274(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc18.decode(rows.rows[0]?.value);
    });
  const member417 = createSqlFunction({
    ...base,
    name: "st_retile",
    member:
      "routine:$extension:postgis_raster.st_retile(pg_catalog.regclass,pg_catalog.name,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)",
    arguments: [nc18, nc7, nc2, nc6, nc6, nc5, nc5, defaultSqlArgument(nc8, "algo")] as const,
    result: nc0,
  });
  const opmember417 = (...values: Parameters<typeof member417>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member417(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return rows.rows.map((row) => nc0.decode(row.value));
    });
  const member529 = createSqlFunction({
    ...base,
    name: "updaterastersrid",
    member: "routine:$extension:postgis_raster.updaterastersrid(pg_catalog.name,pg_catalog.name,pg_catalog.int4)",
    arguments: [nc7, nc7, nc5] as const,
    result: nc4,
  });
  const opmember529 = (...values: Parameters<typeof member529>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${member529(...values)}) value`);
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc4.decode(rows.rows[0]?.value);
    });
  const member530 = createSqlFunction({
    ...base,
    name: "updaterastersrid",
    member:
      "routine:$extension:postgis_raster.updaterastersrid(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.int4)",
    arguments: [nc7, nc7, nc7, nc5] as const,
    result: nc4,
  });
  const opmember530 = (...values: Parameters<typeof member530>) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${member530(...values)}) value`);
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nc4.decode(rows.rows[0]?.value);
    });
  return Object.freeze({
    "routine:$extension:postgis_raster.addoverviewconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.int4)":
      opmember138,
    "routine:$extension:postgis_raster.addoverviewconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.int4)":
      opmember139,
    "routine:$extension:postgis_raster.addrasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog._text)":
      opmember140,
    "routine:$extension:postgis_raster.addrasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
      opmember141,
    "routine:$extension:postgis_raster.addrasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog._text)":
      opmember142,
    "routine:$extension:postgis_raster.addrasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
      opmember143,
    "routine:$extension:postgis_raster.dropoverviewconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name)":
      opmember146,
    "routine:$extension:postgis_raster.dropoverviewconstraints(pg_catalog.name,pg_catalog.name)": opmember147,
    "routine:$extension:postgis_raster.droprasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog._text)":
      opmember148,
    "routine:$extension:postgis_raster.droprasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
      opmember149,
    "routine:$extension:postgis_raster.droprasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog._text)":
      opmember150,
    "routine:$extension:postgis_raster.droprasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
      opmember151,
    "routine:$extension:postgis_raster.st_createoverview(pg_catalog.regclass,pg_catalog.name,pg_catalog.int4,pg_catalog.text)":
      opmember274,
    "routine:$extension:postgis_raster.st_retile(pg_catalog.regclass,pg_catalog.name,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)":
      opmember417,
    "routine:$extension:postgis_raster.updaterastersrid(pg_catalog.name,pg_catalog.name,pg_catalog.int4)": opmember529,
    "routine:$extension:postgis_raster.updaterastersrid(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.int4)":
      opmember530,
  });
}
export type PostgisRasterOperatorSession = Awaited<ReturnType<typeof createOperatorSession>>;
