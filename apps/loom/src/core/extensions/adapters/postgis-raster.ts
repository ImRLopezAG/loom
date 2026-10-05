import { sql, type SQLWrapper } from "drizzle-orm";
import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  binaryCodec,
  booleanCodec,
  compositeCodec,
  createExtensionCodec,
  decodeFailure,
  floatCodec,
  integerCodec,
  nullableCodec,
  numericCodec,
  textCodec,
  withCodecSqlType,
  type ExtensionCodec,
  type CodecInput,
  type CodecOutput,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { int2Codec } from "../primitive-number-codecs";
import { jsonCodec, jsonbCodec } from "../native-json-codecs";
import { createExtensionField, createExtensionIndex, type ExtensionValueSchema } from "../fields";
import { extensionRows } from "../rows";
import {
  checkedExtensionExpression,
  createSqlFunction,
  createSqlAggregate,
  createSqlWindow,
  createSqlOperator,
  defaultSqlArgument,
  extensionSqlType,
  type ExtensionSqlInput,
  type DefaultSqlArgument,
  type ExtensionSqlDefinition,
} from "../sql";
import { createPostgisGeometryCodec, createPostgisTextCodec } from "./postgis-codecs";
import { createPostgisRasterCodec, rasterWkb, type PostgisRasterSemantics } from "./postgis-raster-codecs";
export * from "./postgis-raster-codecs";
const digest = "8f7cd8fe4d832fcc153344cc70b5693f79fa29acb1a6b7f97c0c3de31943def2";
const rasterNativeSafety = {
  "routine:$extension:postgis_raster.st_setgeotransform($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
    {
      nativeSymbol: "RASTER_setGeotransform",
      cause: "header-only deserialization leaves bands NULL before serialization",
    },
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog._float8)": {
    nativeSymbol: "RASTER_quantile",
    cause: "fixed 0.1 sampling can write more values than the native allocation holds",
  },
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)":
    {
      nativeSymbol: "RASTER_quantile",
      cause: "fixed 0.1 sampling can write more values than the native allocation holds",
    },
} as const;
type RasterNativeUnsafeMember = keyof typeof rasterNativeSafety;
/** Confirmed memory defects in the exact selected binary require native repair. */
export class PostgisRasterNativeSafetyError extends Error {
  readonly code = "POSTGIS_RASTER_NATIVE_REPAIR_REQUIRED";
  readonly disposition = "safety-rejected";
  readonly version = "3.6.4";
  readonly manifestDigest = digest;
  readonly nativeSymbol: (typeof rasterNativeSafety)[RasterNativeUnsafeMember]["nativeSymbol"];
  readonly member: RasterNativeUnsafeMember;
  constructor(
    member: RasterNativeUnsafeMember = "routine:$extension:postgis_raster.st_setgeotransform($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
  ) {
    super(
      `postgis_raster 3.6.4 ${member} is safety-rejected: ${rasterNativeSafety[member].cause}; verified native repair of the exact binary is required`,
    );
    this.member = member;
    this.nativeSymbol = rasterNativeSafety[member].nativeSymbol;
    this.name = "PostgisRasterNativeSafetyError";
  }
}
type Descriptor = ExtensionDescriptor<"postgis_raster", { readonly version: "3.6.4"; readonly schema: string }>;
type PostgisDescriptor = ExtensionDescriptor<"postgis", { readonly version: "3.6.4"; readonly schema: string }>;
const rasterSqlWrapper = v.object({ getSQL: v.function() });
const sqlOnly = createExtensionCodec({
  id: "postgis_raster:concrete-native-expression:1",
  input: v.custom<SQLWrapper>((value) => v.is(rasterSqlWrapper, value)),
  output: v.never(),
  transport: "native",
  encode: () => {
    throw new Error("A concrete native SQL expression is required");
  },
  decode: () => {
    throw new Error("A captured concrete result codec is required");
  },
});
function rasterParameter<Input, Output>(
  value: ExtensionSqlInput<ExtensionCodec<Input, Output>>,
  codec: ExtensionCodec<Input, Output>,
) {
  if (v.is(rasterSqlWrapper, value)) return sql`${value}`; // SAFETY: the caller validates this position against the same captured codec.
  const encoded = codec.encode(value as Input);
  return codec.sqlType
    ? sql`${sql.param(encoded)}::${extensionSqlType(codec.sqlType.schema, codec.sqlType.name)}${codec.sqlType.array ? sql`[]` : sql.empty()}`
    : sql`${sql.param(encoded)}`;
}
/** Keep the captured array argument, including dimensions, in PostgreSQL's VARIADIC syntax. */
export function createRasterVariadicFunction<
  const Arguments extends readonly (ExtensionCodec<never, unknown> | DefaultSqlArgument)[],
  Result extends ExtensionCodec<never, unknown>,
>(definition: ExtensionSqlDefinition<Arguments, Result>): ReturnType<typeof createSqlFunction<Arguments, Result>> {
  const call = createSqlFunction(definition);
  return (...values: Parameters<typeof call>): ReturnType<typeof call> => {
    call(...values);
    const parameters = definition.arguments.flatMap((argument, index) => {
      if (index >= values.length || ("default" in argument && values[index] === undefined)) return [];
      const codec = "default" in argument ? argument.codec : argument;
      // SAFETY: call above validates this position against the same captured codec.
      const parameter = rasterParameter(values[index] as ExtensionSqlInput<typeof codec>, codec);
      const named =
        "default" in argument && argument.name !== undefined
          ? sql`${sql.identifier(argument.name)} => ${parameter}`
          : parameter;
      return [index === definition.arguments.length - 1 ? sql`variadic ${named}` : named];
    });
    // SAFETY: the captured definition supplies the identical result codec and call tuple.
    return checkedExtensionExpression(
      sql`${extensionSqlType(definition.schema, definition.name)}(${sql.join(parameters, sql`, `)})`,
      definition.result,
      definition.dependencies,
      undefined,
      definition.member,
      definition.observability,
    ) as ReturnType<typeof call>;
  };
}
const voidCodec = createExtensionCodec({
  id: "pg:void:1",
  sqlType: { schema: "pg_catalog", name: "void" },
  input: v.null(),
  output: v.null(),
  transport: "text",
  encode: () => null,
  decode: () => null,
});
export function createPostgisRasterCodecDefinitions(schema: string, postgisSchema: string) {
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
  return {
    c0,
    nc0,
    c1,
    nc1,
    c2,
    nc2,
    c3,
    nc3,
    c4,
    nc4,
    c5,
    nc5,
    c6,
    nc6,
    c7,
    nc7,
    c8,
    nc8,
    c9,
    nc9,
    c10,
    nc10,
    c11,
    nc11,
    c12,
    nc12,
    c13,
    nc13,
    c14,
    nc14,
    c15,
    nc15,
    c16,
    nc16,
    c17,
    nc17,
    c18,
    nc18,
    c19,
    nc19,
    c20,
    nc20,
    c21,
    nc21,
    c22,
    nc22,
    c23,
    nc23,
    c24,
    nc24,
    c25,
    nc25,
    c26,
    nc26,
    c27,
    nc27,
    c28,
    nc28,
    c29,
    nc29,
    c30,
    nc30,
    c31,
    nc31,
    c32,
    nc32,
    c33,
    nc33,
    c34,
    nc34,
    c35,
    nc35,
    c36,
    nc36,
    c37,
    nc37,
    c38,
    nc38,
    c39,
    nc39,
    c40,
    nc40,
    c41,
    nc41,
  } as const;
}
export type PostgisRasterCodecDefinitions = ReturnType<typeof createPostgisRasterCodecDefinitions>;
type NullableRasterCodec<C extends ExtensionCodec<never, unknown>> = ExtensionCodec<
  CodecInput<C> | null,
  CodecOutput<C> | null
>;
export interface PostgisRasterOverloads {
  "cast:$extension:postgis_raster.raster->$extension:postgis.box3d": (
    value: ExtensionSqlInput<PostgisRasterCodecDefinitions["nc0"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisRasterCodecDefinitions["nc1"]>>;
  "cast:$extension:postgis_raster.raster->$extension:postgis.geometry": (
    value: ExtensionSqlInput<PostgisRasterCodecDefinitions["nc0"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisRasterCodecDefinitions["nc2"]>>;
  "cast:$extension:postgis_raster.raster->pg_catalog.bytea": (
    value: ExtensionSqlInput<PostgisRasterCodecDefinitions["nc0"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisRasterCodecDefinitions["nc3"]>>;
  "operator:$extension:postgis_raster.@($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.@($extension:postgis_raster.raster,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc2"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.@($extension:postgis.geometry,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc2"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.&&($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.&&($extension:postgis_raster.raster,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc2"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.&&($extension:postgis.geometry,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc2"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.&<($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.&<|($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.&>($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.<<($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.<<|($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.=($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.>>($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.|&>($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.|>>($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.~($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.~($extension:postgis_raster.raster,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc2"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.~($extension:postgis.geometry,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc2"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "operator:$extension:postgis_raster.~=($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlOperator<
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc0"],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.box3d($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc1"]>
  >;
  "routine:$extension:postgis_raster.bytea($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc3"]>
  >;
  "routine:$extension:postgis_raster.geometry_contained_by_raster($extension:postgis.geometry,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc2"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.geometry_raster_contain($extension:postgis.geometry,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc2"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.geometry_raster_overlap($extension:postgis.geometry,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc2"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.postgis_gdal_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisRasterCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis_raster.postgis_noop($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc2"]>
  >;
  "routine:$extension:postgis_raster.postgis_raster_lib_build_date()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisRasterCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis_raster.postgis_raster_lib_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisRasterCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis_raster.postgis_raster_scripts_installed()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisRasterCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis_raster.raster_above($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_below($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_contain($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_contained_by_geometry($extension:postgis_raster.raster,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc2"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_contained($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_eq($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_geometry_contain($extension:postgis_raster.raster,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc2"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_geometry_overlap($extension:postgis_raster.raster,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc2"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_hash($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc5"]>
  >;
  "routine:$extension:postgis_raster.raster_left($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_overabove($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_overbelow($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_overlap($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_overleft($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_overright($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_right($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.raster_same($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster._addbandarg)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc32"]],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster._raster,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc20"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "fromband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "torastindex">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "fromband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "torastindex">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog._int4,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "initialvalue">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.text,pg_catalog._int4,pg_catalog.int4,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "index">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "initialvalue">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "sample_percent">,
      ],
      PostgisRasterCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc6"]],
      PostgisRasterCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "sample_percent">,
      ],
      PostgisRasterCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc6"]],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            min: PostgisRasterCodecDefinitions["nc6"];
            max: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc15"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "sample_percent">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "bins">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "width">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "right">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            min: PostgisRasterCodecDefinitions["nc6"];
            max: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc15"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            min: PostgisRasterCodecDefinitions["nc6"];
            max: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc15"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "width">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "right">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            min: PostgisRasterCodecDefinitions["nc6"];
            max: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc15"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            min: PostgisRasterCodecDefinitions["nc6"];
            max: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc15"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            min: PostgisRasterCodecDefinitions["nc6"];
            max: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc15"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog._float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc11"]],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            quantile: PostgisRasterCodecDefinitions["nc6"];
            value: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "quantile">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog._float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "quantiles">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            quantile: PostgisRasterCodecDefinitions["nc6"];
            value: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog._float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "sample_percent">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "quantiles">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            quantile: PostgisRasterCodecDefinitions["nc6"];
            value: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog._float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "quantiles">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            quantile: PostgisRasterCodecDefinitions["nc6"];
            value: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "sample_percent">,
      ],
      PostgisRasterCodecDefinitions["nc29"]
    >
  >;
  "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc6"]],
      PostgisRasterCodecDefinitions["nc29"]
    >
  >;
  "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "sample_percent">,
      ],
      PostgisRasterCodecDefinitions["nc29"]
    >
  >;
  "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc29"]
    >
  >;
  "routine:$extension:postgis_raster.st_asbinary($extension:postgis_raster.raster,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "outasin">,
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_asgdalraster($extension:postgis_raster.raster,pg_catalog.text,pg_catalog._text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "options">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "srid">,
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_ashexwkb($extension:postgis_raster.raster,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "outasin">,
      ],
      PostgisRasterCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "options">,
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc14"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "options">,
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "options">,
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_aspect($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "units">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "interpolate_nodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_aspect($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "units">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "interpolate_nodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "options">,
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc14"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "options">,
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "options">,
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "nodataval">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc13"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "nodataval">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "upperleftx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "upperlefty">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewy">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "gridx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "gridy">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "nodataval">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewy">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewy">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "upperleftx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "upperlefty">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewy">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc13"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "nodataval">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "upperleftx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "upperlefty">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewy">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "gridx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "gridy">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "nodataval">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewy">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewy">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "upperleftx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "upperlefty">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewy">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_asrasteragg($extension:postgis.geometry,pg_catalog.float8,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.bool)": ReturnType<
    typeof createSqlAggregate<
      readonly [
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc4"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "options">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "srid">,
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc14"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "srid">,
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "options">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "srid">,
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "srid">,
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_aswkb($extension:postgis_raster.raster,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "outasin">,
      ],
      PostgisRasterCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog._int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc14"], "nbands">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc5"]],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bpchar)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc9"], "delimiter">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_bandfilesize($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">],
      PostgisRasterCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis_raster.st_bandfiletimestamp($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">],
      PostgisRasterCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis_raster.st_bandisnodata($extension:postgis_raster.raster,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc4"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_bandisnodata($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "forcechecking">,
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog._int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc14"]],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            bandnum: PostgisRasterCodecDefinitions["nc5"];
            pixeltype: PostgisRasterCodecDefinitions["nc8"];
            nodatavalue: PostgisRasterCodecDefinitions["nc6"];
            isoutdb: PostgisRasterCodecDefinitions["nc4"];
            path: PostgisRasterCodecDefinitions["nc8"];
            outdbbandnum: PostgisRasterCodecDefinitions["nc5"];
            filesize: PostgisRasterCodecDefinitions["nc15"];
            filetimestamp: PostgisRasterCodecDefinitions["nc15"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            pixeltype: PostgisRasterCodecDefinitions["nc8"];
            nodatavalue: PostgisRasterCodecDefinitions["nc6"];
            isoutdb: PostgisRasterCodecDefinitions["nc4"];
            path: PostgisRasterCodecDefinitions["nc8"];
            outdbbandnum: PostgisRasterCodecDefinitions["nc5"];
            filesize: PostgisRasterCodecDefinitions["nc15"];
            filetimestamp: PostgisRasterCodecDefinitions["nc15"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_bandnodatavalue($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_bandpath($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">],
      PostgisRasterCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis_raster.st_bandpixeltype($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">],
      PostgisRasterCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc2"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "nodataval">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "crop">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "crop">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog._int4,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc14"],
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc11"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "crop">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc2"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "crop">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "crop">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "touched">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_colormap($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "colormap">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "method">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_colormap($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "method">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_contains($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_contains($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_containsproperly($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_containsproperly($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_contour($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "bandnumber">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "level_interval">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "level_base">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "fixed_levels">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "polygonize">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            geom: PostgisRasterCodecDefinitions["nc2"];
            id: PostgisRasterCodecDefinitions["nc5"];
            value: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_convexhull($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc2"]>
  >;
  "routine:$extension:postgis_raster.st_count($extension:postgis_raster.raster,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc4"]],
      PostgisRasterCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis_raster.st_count($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.bool)": ReturnType<
    typeof createSqlAggregate<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc4"]],
      PostgisRasterCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": ReturnType<
    typeof createSqlAggregate<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlAggregate<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
      ],
      PostgisRasterCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis_raster.st_coveredby($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_coveredby($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_covers($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_covers($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_dfullywithin($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_dfullywithin($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_disjoint($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_disjoint($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_distinct4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_distinct4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc13"],
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_dumpaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc24"]
    >
  >;
  "routine:$extension:postgis_raster.st_dumpvalues($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc14"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            nband: PostgisRasterCodecDefinitions["nc5"];
            valarray: PostgisRasterCodecDefinitions["nc11"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_dumpvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc11"]
    >
  >;
  "routine:$extension:postgis_raster.st_dwithin($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_dwithin($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_envelope($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc2"]>
  >;
  "routine:$extension:postgis_raster.st_fromgdalraster(pg_catalog.bytea,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc3"], DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "srid">],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_gdaldrivers()": ReturnType<
    typeof createSqlFunction<
      readonly [],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            idx: PostgisRasterCodecDefinitions["nc5"];
            short_name: PostgisRasterCodecDefinitions["nc8"];
            long_name: PostgisRasterCodecDefinitions["nc8"];
            can_read: PostgisRasterCodecDefinitions["nc4"];
            can_write: PostgisRasterCodecDefinitions["nc4"];
            create_options: PostgisRasterCodecDefinitions["nc8"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_georeference($extension:postgis_raster.raster,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "format">,
      ],
      PostgisRasterCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis_raster.st_geotransform($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"]],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            imag: PostgisRasterCodecDefinitions["nc6"];
            jmag: PostgisRasterCodecDefinitions["nc6"];
            theta_i: PostgisRasterCodecDefinitions["nc6"];
            theta_ij: PostgisRasterCodecDefinitions["nc6"];
            xoffset: PostgisRasterCodecDefinitions["nc6"];
            yoffset: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_grayscale($extension:postgis_raster._rastbandarg,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc36"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "extenttype">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_grayscale($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "redband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "greenband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "blueband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "extenttype">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_hasnoband($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_height($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc5"]>
  >;
  "routine:$extension:postgis_raster.st_hillshade($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "azimuth">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "altitude">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "max_bright">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "scale">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "interpolate_nodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_hillshade($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "azimuth">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "altitude">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "max_bright">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "scale">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "interpolate_nodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "bins">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "width">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "right">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            min: PostgisRasterCodecDefinitions["nc6"];
            max: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc15"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            min: PostgisRasterCodecDefinitions["nc6"];
            max: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc15"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "width">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "right">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            min: PostgisRasterCodecDefinitions["nc6"];
            max: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc15"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            min: PostgisRasterCodecDefinitions["nc6"];
            max: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc15"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_interpolateraster($extension:postgis.geometry,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "bandnumber">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog._float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc11"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog._float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "returnband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "nodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc2"]],
      PostgisRasterCodecDefinitions["nc24"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc11"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog._float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "returnband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "nodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc2"],
      ],
      PostgisRasterCodecDefinitions["nc24"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersection($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">,
      ],
      PostgisRasterCodecDefinitions["nc24"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersectionfractions($extension:postgis_raster.raster,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc2"]],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc2"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc2"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_intersects($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_invdistweight4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_iscoveragetile($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_isempty($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis_raster.st_makeemptycoverage(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "srid">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_makeemptyraster($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc0"]>
  >;
  "routine:$extension:postgis_raster.st_makeemptyraster(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "srid">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_makeemptyraster(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster._rastbandarg,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc36"],
        PostgisRasterCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "extenttype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc0"], "customextent">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "distancex">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "distancey">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "extenttype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "nodata1expr">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "nodata2expr">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodatanodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc14"],
        PostgisRasterCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "extenttype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc0"], "customextent">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "distancex">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "distancey">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "extenttype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc0"], "customextent">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "distancex">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "distancey">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "extenttype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "nodata1expr">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "nodata2expr">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodatanodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog._float8,pg_catalog.bool,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc16"],
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "extenttype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc0"], "customextent">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "extenttype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc0"], "customextent">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "distancex">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "distancey">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "extenttype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "nodata1expr">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "nodata2expr">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodatanodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "extenttype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "nodata1expr">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "nodata2expr">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodatanodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "extenttype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "extenttype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc16"],
        PostgisRasterCodecDefinitions["nc13"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc16"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.regprocedure,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc16"],
        PostgisRasterCodecDefinitions["nc13"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.regprocedure)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc16"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.regprocedure,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc16"],
        PostgisRasterCodecDefinitions["nc13"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.regprocedure)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc16"]],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.regprocedure,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc16"],
        PostgisRasterCodecDefinitions["nc13"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.regprocedure)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc16"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_mapalgebrafctngb($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc16"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc13"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_max4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_max4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc13"],
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_mean4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_mean4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc13"],
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_memsize($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc5"]>
  >;
  "routine:$extension:postgis_raster.st_metadata($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"]],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            upperleftx: PostgisRasterCodecDefinitions["nc6"];
            upperlefty: PostgisRasterCodecDefinitions["nc6"];
            width: PostgisRasterCodecDefinitions["nc5"];
            height: PostgisRasterCodecDefinitions["nc5"];
            scalex: PostgisRasterCodecDefinitions["nc6"];
            scaley: PostgisRasterCodecDefinitions["nc6"];
            skewx: PostgisRasterCodecDefinitions["nc6"];
            skewy: PostgisRasterCodecDefinitions["nc6"];
            srid: PostgisRasterCodecDefinitions["nc5"];
            numbands: PostgisRasterCodecDefinitions["nc5"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_min4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_min4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc13"],
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_minconvexhull($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
      ],
      PostgisRasterCodecDefinitions["nc2"]
    >
  >;
  "routine:$extension:postgis_raster.st_mindist4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_minpossiblevalue(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc8"]], PostgisRasterCodecDefinitions["nc6"]>
  >;
  "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc2"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc2"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc11"]
    >
  >;
  "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc11"]
    >
  >;
  "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc11"]
    >
  >;
  "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc11"]
    >
  >;
  "routine:$extension:postgis_raster.st_notsamealignmentreason($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis_raster.st_numbands($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc5"]>
  >;
  "routine:$extension:postgis_raster.st_overlaps($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_overlaps($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_pixelascentroid($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc2"]
    >
  >;
  "routine:$extension:postgis_raster.st_pixelascentroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            geom: PostgisRasterCodecDefinitions["nc2"];
            val: PostgisRasterCodecDefinitions["nc6"];
            x: PostgisRasterCodecDefinitions["nc5"];
            y: PostgisRasterCodecDefinitions["nc5"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_pixelaspoint($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc2"]
    >
  >;
  "routine:$extension:postgis_raster.st_pixelaspoints($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            geom: PostgisRasterCodecDefinitions["nc2"];
            val: PostgisRasterCodecDefinitions["nc6"];
            x: PostgisRasterCodecDefinitions["nc5"];
            y: PostgisRasterCodecDefinitions["nc5"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_pixelaspolygon($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc2"]
    >
  >;
  "routine:$extension:postgis_raster.st_pixelaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            geom: PostgisRasterCodecDefinitions["nc2"];
            val: PostgisRasterCodecDefinitions["nc6"];
            x: PostgisRasterCodecDefinitions["nc5"];
            y: PostgisRasterCodecDefinitions["nc5"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_pixelheight($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc6"]>
  >;
  "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc11"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            val: PostgisRasterCodecDefinitions["nc6"];
            x: PostgisRasterCodecDefinitions["nc5"];
            y: PostgisRasterCodecDefinitions["nc5"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{ x: PostgisRasterCodecDefinitions["nc5"]; y: PostgisRasterCodecDefinitions["nc5"] }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc11"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            val: PostgisRasterCodecDefinitions["nc6"];
            x: PostgisRasterCodecDefinitions["nc5"];
            y: PostgisRasterCodecDefinitions["nc5"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{ x: PostgisRasterCodecDefinitions["nc5"]; y: PostgisRasterCodecDefinitions["nc5"] }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_pixelwidth($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc6"]>
  >;
  "routine:$extension:postgis_raster.st_polygon($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">],
      PostgisRasterCodecDefinitions["nc2"]
    >
  >;
  "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog._float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc11"]],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            quantile: PostgisRasterCodecDefinitions["nc6"];
            value: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "quantile">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc6"]],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc11"],
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            quantile: PostgisRasterCodecDefinitions["nc6"];
            value: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "quantiles">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            quantile: PostgisRasterCodecDefinitions["nc6"];
            value: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_range4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_range4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc13"],
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_rastertoworldcoord($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            longitude: PostgisRasterCodecDefinitions["nc6"];
            latitude: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_rastertoworldcoordx($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_rastertoworldcoordx($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc5"]],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_rastertoworldcoordy($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_rastertoworldcoordy($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc5"]],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_rastfromhexwkb(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc8"]], PostgisRasterCodecDefinitions["nc0"]>
  >;
  "routine:$extension:postgis_raster.st_rastfromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc3"]], PostgisRasterCodecDefinitions["nc0"]>
  >;
  "routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,$extension:postgis_raster._reclassarg)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc39"]],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_reclassexact($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog._float8,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc11"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "bandnumber">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "outputpixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodatavalue">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "usescale">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "scalex">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "scaley">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "gridx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "gridy">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewy">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "gridx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "gridy">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewx">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "skewy">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_rescale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_rescale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_reskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_reskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_rotation($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc6"]>
  >;
  "routine:$extension:postgis_raster.st_roughness($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "interpolate_nodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_roughness($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "interpolate_nodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_samealignment($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_samealignment($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis_raster.st_samealignment(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_scalex($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc6"]>
  >;
  "routine:$extension:postgis_raster.st_scaley($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc6"]>
  >;
  "routine:$extension:postgis_raster.st_setbandindex($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "force">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setbandisnodata($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setbandnodatavalue($extension:postgis_raster.raster,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc6"]],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setbandnodatavalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "forcechecking">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setbandpath($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "force">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setgeoreference($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setgeoreference($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "format">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setgeotransform($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setm($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc2"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "resample">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">,
      ],
      PostgisRasterCodecDefinitions["nc2"]
    >
  >;
  "routine:$extension:postgis_raster.st_setrotation($extension:postgis_raster.raster,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc6"]],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setscale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setscale($extension:postgis_raster.raster,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc6"]],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setskew($extension:postgis_raster.raster,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc6"]],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setsrid($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc5"]],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setupperleft($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc2"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster._geomval,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc35"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "keepnodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog._bool,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc11"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc12"], "noset">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "keepnodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "keepnodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "keepnodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "keepnodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_setz($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc2"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "resample">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "band">,
      ],
      PostgisRasterCodecDefinitions["nc2"]
    >
  >;
  "routine:$extension:postgis_raster.st_skewx($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc6"]>
  >;
  "routine:$extension:postgis_raster.st_skewy($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc6"]>
  >;
  "routine:$extension:postgis_raster.st_slope($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "units">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "scale">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "interpolate_nodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_slope($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "units">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "scale">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "interpolate_nodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "scalex">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "scaley">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_srid($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc5"]>
  >;
  "routine:$extension:postgis_raster.st_stddev4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_stddev4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc13"],
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_sum4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc13"], "userargs">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_sum4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc11"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc13"],
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_summary($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis_raster.st_summarystats($extension:postgis_raster.raster,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc4"]],
      PostgisRasterCodecDefinitions["nc29"]
    >
  >;
  "routine:$extension:postgis_raster.st_summarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc29"]
    >
  >;
  "routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": ReturnType<
    typeof createSqlAggregate<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc4"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc29"]
    >
  >;
  "routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": ReturnType<
    typeof createSqlAggregate<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc29"]
    >
  >;
  "routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlAggregate<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
      ],
      PostgisRasterCodecDefinitions["nc29"]
    >
  >;
  "routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc14"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "padwithnodata">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "padwithnodata">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "padwithnodata">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "nodataval">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_touches($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_touches($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_tpi($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "interpolate_nodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_tpi($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "interpolate_nodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "algorithm">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "maxerr">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "scalex">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "scaley">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_tri($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "interpolate_nodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_tri($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "pixeltype">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "interpolate_nodata">,
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,$extension:postgis_raster._unionarg)": ReturnType<
    typeof createSqlAggregate<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc41"]],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text)": ReturnType<
    typeof createSqlAggregate<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc8"],
      ],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlAggregate<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc5"]],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.text)": ReturnType<
    typeof createSqlAggregate<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc8"]],
      PostgisRasterCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc0"]>
  >;
  "routine:$extension:postgis_raster.st_upperleftx($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc6"]>
  >;
  "routine:$extension:postgis_raster.st_upperlefty($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc6"]>
  >;
  "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc2"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc2"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc8"], "resample">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc5"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc11"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            value: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc5"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      PostgisRasterCodecDefinitions["nc5"]
    >
  >;
  "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc11"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            value: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc5"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "searchvalues">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            value: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc5"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      PostgisRasterCodecDefinitions["nc5"]
    >
  >;
  "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      PostgisRasterCodecDefinitions["nc5"]
    >
  >;
  "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc11"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            value: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc5"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      PostgisRasterCodecDefinitions["nc5"]
    >
  >;
  "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc11"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            value: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc5"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "searchvalues">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            value: PostgisRasterCodecDefinitions["nc6"];
            count: PostgisRasterCodecDefinitions["nc5"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      PostgisRasterCodecDefinitions["nc5"]
    >
  >;
  "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      PostgisRasterCodecDefinitions["nc5"]
    >
  >;
  "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc11"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            value: PostgisRasterCodecDefinitions["nc6"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc11"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            value: PostgisRasterCodecDefinitions["nc6"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "searchvalues">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            value: PostgisRasterCodecDefinitions["nc6"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc11"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            value: PostgisRasterCodecDefinitions["nc6"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc11"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            value: PostgisRasterCodecDefinitions["nc6"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc5"], "nband">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc4"], "exclude_nodata_value">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc11"], "searchvalues">,
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            value: PostgisRasterCodecDefinitions["nc6"];
            percent: PostgisRasterCodecDefinitions["nc6"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc4"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc8"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc6"],
        DefaultSqlArgument<PostgisRasterCodecDefinitions["nc6"], "roundto">,
      ],
      PostgisRasterCodecDefinitions["nc6"]
    >
  >;
  "routine:$extension:postgis_raster.st_width($extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<readonly [PostgisRasterCodecDefinitions["nc0"]], PostgisRasterCodecDefinitions["nc5"]>
  >;
  "routine:$extension:postgis_raster.st_within($extension:postgis_raster.raster,$extension:postgis_raster.raster)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc0"]],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_within($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc5"],
      ],
      PostgisRasterCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis_raster.st_worldtorastercoord($extension:postgis_raster.raster,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc2"]],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            columnx: PostgisRasterCodecDefinitions["nc5"];
            rowy: PostgisRasterCodecDefinitions["nc5"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_worldtorastercoord($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      NullableRasterCodec<
        ReturnType<
          typeof compositeCodec<{
            columnx: PostgisRasterCodecDefinitions["nc5"];
            rowy: PostgisRasterCodecDefinitions["nc5"];
          }>
        >
      >
    >
  >;
  "routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc2"]],
      PostgisRasterCodecDefinitions["nc5"]
    >
  >;
  "routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc5"]
    >
  >;
  "routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc6"]],
      PostgisRasterCodecDefinitions["nc5"]
    >
  >;
  "routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc2"]],
      PostgisRasterCodecDefinitions["nc5"]
    >
  >;
  "routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisRasterCodecDefinitions["nc0"],
        PostgisRasterCodecDefinitions["nc6"],
        PostgisRasterCodecDefinitions["nc6"],
      ],
      PostgisRasterCodecDefinitions["nc5"]
    >
  >;
  "routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisRasterCodecDefinitions["nc0"], PostgisRasterCodecDefinitions["nc6"]],
      PostgisRasterCodecDefinitions["nc5"]
    >
  >;
}
export interface PostgisRasterFunctions {
  box3d: PostgisRasterOverloads["routine:$extension:postgis_raster.box3d($extension:postgis_raster.raster)"];
  bytea: PostgisRasterOverloads["routine:$extension:postgis_raster.bytea($extension:postgis_raster.raster)"];
  geometry_contained_by_raster: PostgisRasterOverloads["routine:$extension:postgis_raster.geometry_contained_by_raster($extension:postgis.geometry,$extension:postgis_raster.raster)"];
  geometry_raster_contain: PostgisRasterOverloads["routine:$extension:postgis_raster.geometry_raster_contain($extension:postgis.geometry,$extension:postgis_raster.raster)"];
  geometry_raster_overlap: PostgisRasterOverloads["routine:$extension:postgis_raster.geometry_raster_overlap($extension:postgis.geometry,$extension:postgis_raster.raster)"];
  postgis_gdal_version: PostgisRasterOverloads["routine:$extension:postgis_raster.postgis_gdal_version()"];
  postgis_noop: PostgisRasterOverloads["routine:$extension:postgis_raster.postgis_noop($extension:postgis_raster.raster)"];
  postgis_raster_lib_build_date: PostgisRasterOverloads["routine:$extension:postgis_raster.postgis_raster_lib_build_date()"];
  postgis_raster_lib_version: PostgisRasterOverloads["routine:$extension:postgis_raster.postgis_raster_lib_version()"];
  postgis_raster_scripts_installed: PostgisRasterOverloads["routine:$extension:postgis_raster.postgis_raster_scripts_installed()"];
  raster_above: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_above($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
  raster_below: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_below($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
  raster_contain: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_contain($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
  raster_contained_by_geometry: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_contained_by_geometry($extension:postgis_raster.raster,$extension:postgis.geometry)"];
  raster_contained: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_contained($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
  raster_eq: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_eq($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
  raster_geometry_contain: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_geometry_contain($extension:postgis_raster.raster,$extension:postgis.geometry)"];
  raster_geometry_overlap: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_geometry_overlap($extension:postgis_raster.raster,$extension:postgis.geometry)"];
  raster_hash: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_hash($extension:postgis_raster.raster)"];
  raster_left: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_left($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
  raster_overabove: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_overabove($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
  raster_overbelow: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_overbelow($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
  raster_overlap: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_overlap($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
  raster_overleft: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_overleft($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
  raster_overright: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_overright($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
  raster_right: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_right($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
  raster_same: PostgisRasterOverloads["routine:$extension:postgis_raster.raster_same($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
  st_addband: {
    "($extension:postgis_raster.raster,$extension:postgis_raster._addbandarg)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster._addbandarg)"];
    "($extension:postgis_raster.raster,$extension:postgis_raster._raster,pg_catalog.int4,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster._raster,pg_catalog.int4,pg_catalog.int4)"];
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog._int4,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog._int4,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog._int4,pg_catalog.int4,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.text,pg_catalog._int4,pg_catalog.int4,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)"];
  };
  st_approxcount: {
    "($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)"];
  };
  st_approxhistogram: {
    "($extension:postgis_raster.raster,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)"];
  };
  st_approxquantile: {
    "($extension:postgis_raster.raster,pg_catalog._float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog._float8)"];
    "($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog._float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog._float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog._float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog._float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog._float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog._float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
  };
  st_approxsummarystats: {
    "($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)"];
  };
  st_asbinary: PostgisRasterOverloads["routine:$extension:postgis_raster.st_asbinary($extension:postgis_raster.raster,pg_catalog.bool)"];
  st_asgdalraster: PostgisRasterOverloads["routine:$extension:postgis_raster.st_asgdalraster($extension:postgis_raster.raster,pg_catalog.text,pg_catalog._text,pg_catalog.int4)"];
  st_ashexwkb: PostgisRasterOverloads["routine:$extension:postgis_raster.st_ashexwkb($extension:postgis_raster.raster,pg_catalog.bool)"];
  st_asjpeg: {
    "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4)"];
    "($extension:postgis_raster.raster,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"];
  };
  st_aspect: {
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_aspect($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_aspect($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.bool)"];
  };
  st_aspng: {
    "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4)"];
    "($extension:postgis_raster.raster,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"];
  };
  st_asraster: {
    "($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.bool)"];
    "($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"];
  };
  st_asrasteragg: PostgisRasterOverloads["routine:$extension:postgis_raster.st_asrasteragg($extension:postgis.geometry,pg_catalog.float8,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.bool)"];
  st_astiff: {
    "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text,pg_catalog.int4)"];
    "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.text,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.text,pg_catalog.int4)"];
    "($extension:postgis_raster.raster,pg_catalog._text,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._text,pg_catalog.int4)"];
    "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.int4)"];
  };
  st_aswkb: PostgisRasterOverloads["routine:$extension:postgis_raster.st_aswkb($extension:postgis_raster.raster,pg_catalog.bool)"];
  st_band: {
    "($extension:postgis_raster.raster,pg_catalog._int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog._int4)"];
    "($extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog.int4)"];
    "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bpchar)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bpchar)"];
  };
  st_bandfilesize: PostgisRasterOverloads["routine:$extension:postgis_raster.st_bandfilesize($extension:postgis_raster.raster,pg_catalog.int4)"];
  st_bandfiletimestamp: PostgisRasterOverloads["routine:$extension:postgis_raster.st_bandfiletimestamp($extension:postgis_raster.raster,pg_catalog.int4)"];
  st_bandisnodata: {
    "($extension:postgis_raster.raster,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_bandisnodata($extension:postgis_raster.raster,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_bandisnodata($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)"];
  };
  st_bandmetadata: {
    "($extension:postgis_raster.raster,pg_catalog._int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog._int4)"];
    "($extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog.int4)"];
  };
  st_bandnodatavalue: PostgisRasterOverloads["routine:$extension:postgis_raster.st_bandnodatavalue($extension:postgis_raster.raster,pg_catalog.int4)"];
  st_bandpath: PostgisRasterOverloads["routine:$extension:postgis_raster.st_bandpath($extension:postgis_raster.raster,pg_catalog.int4)"];
  st_bandpixeltype: PostgisRasterOverloads["routine:$extension:postgis_raster.st_bandpixeltype($extension:postgis_raster.raster,pg_catalog.int4)"];
  st_clip: {
    "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog._int4,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog._int4,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)"];
  };
  st_colormap: {
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_colormap($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text)"];
    "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_colormap($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)"];
  };
  st_contains: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_contains($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_contains($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)"];
  };
  st_containsproperly: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_containsproperly($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_containsproperly($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)"];
  };
  st_contour: PostgisRasterOverloads["routine:$extension:postgis_raster.st_contour($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._float8,pg_catalog.bool)"];
  st_convexhull: PostgisRasterOverloads["routine:$extension:postgis_raster.st_convexhull($extension:postgis_raster.raster)"];
  st_count: {
    "($extension:postgis_raster.raster,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_count($extension:postgis_raster.raster,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_count($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)"];
  };
  st_countagg: {
    "($extension:postgis_raster.raster,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)"];
  };
  st_coveredby: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_coveredby($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_coveredby($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)"];
  };
  st_covers: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_covers($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_covers($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)"];
  };
  st_dfullywithin: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_dfullywithin($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_dfullywithin($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)"];
  };
  st_disjoint: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_disjoint($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_disjoint($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)"];
  };
  st_distinct4ma: {
    "(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_distinct4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)"];
    "(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_distinct4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)"];
  };
  st_dumpaspolygons: PostgisRasterOverloads["routine:$extension:postgis_raster.st_dumpaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)"];
  st_dumpvalues: {
    "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_dumpvalues($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_dumpvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)"];
  };
  st_dwithin: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_dwithin($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_dwithin($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)"];
  };
  st_envelope: PostgisRasterOverloads["routine:$extension:postgis_raster.st_envelope($extension:postgis_raster.raster)"];
  st_fromgdalraster: PostgisRasterOverloads["routine:$extension:postgis_raster.st_fromgdalraster(pg_catalog.bytea,pg_catalog.int4)"];
  st_gdaldrivers: PostgisRasterOverloads["routine:$extension:postgis_raster.st_gdaldrivers()"];
  st_georeference: PostgisRasterOverloads["routine:$extension:postgis_raster.st_georeference($extension:postgis_raster.raster,pg_catalog.text)"];
  st_geotransform: PostgisRasterOverloads["routine:$extension:postgis_raster.st_geotransform($extension:postgis_raster.raster)"];
  st_grayscale: {
    "($extension:postgis_raster._rastbandarg,pg_catalog.text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_grayscale($extension:postgis_raster._rastbandarg,pg_catalog.text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_grayscale($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)"];
  };
  st_hasnoband: PostgisRasterOverloads["routine:$extension:postgis_raster.st_hasnoband($extension:postgis_raster.raster,pg_catalog.int4)"];
  st_height: PostgisRasterOverloads["routine:$extension:postgis_raster.st_height($extension:postgis_raster.raster)"];
  st_hillshade: {
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_hillshade($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_hillshade($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"];
  };
  st_histogram: {
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)"];
  };
  st_interpolateraster: PostgisRasterOverloads["routine:$extension:postgis_raster.st_interpolateraster($extension:postgis.geometry,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4)"];
  st_intersection: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog._float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog._float8)"];
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog._float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog._float8)"];
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,$extension:postgis.geometry)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis.geometry)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog._float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog._float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry)"];
    "($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersection($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)"];
  };
  st_intersectionfractions: PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersectionfractions($extension:postgis_raster.raster,$extension:postgis.geometry)"];
  st_intersects: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
    "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry)"];
    "($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_intersects($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)"];
  };
  st_invdistweight4ma: PostgisRasterOverloads["routine:$extension:postgis_raster.st_invdistweight4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)"];
  st_iscoveragetile: PostgisRasterOverloads["routine:$extension:postgis_raster.st_iscoveragetile($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"];
  st_isempty: PostgisRasterOverloads["routine:$extension:postgis_raster.st_isempty($extension:postgis_raster.raster)"];
  st_makeemptycoverage: PostgisRasterOverloads["routine:$extension:postgis_raster.st_makeemptycoverage(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)"];
  st_makeemptyraster: {
    "($extension:postgis_raster.raster)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_makeemptyraster($extension:postgis_raster.raster)"];
    "(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_makeemptyraster(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)"];
    "(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_makeemptyraster(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
  };
  st_mapalgebra: {
    "($extension:postgis_raster._rastbandarg,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster._rastbandarg,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)"];
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog._float8,pg_catalog.bool,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog._float8,pg_catalog.bool,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8)"];
  };
  st_mapalgebraexpr: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8)"];
  };
  st_mapalgebrafct: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.regprocedure,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.regprocedure,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.regprocedure)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.regprocedure)"];
    "($extension:postgis_raster.raster,pg_catalog.regprocedure,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.regprocedure,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog.regprocedure)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.regprocedure)"];
    "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.regprocedure,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.regprocedure,pg_catalog._text)"];
    "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.regprocedure)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.regprocedure)"];
  };
  st_mapalgebrafctngb: PostgisRasterOverloads["routine:$extension:postgis_raster.st_mapalgebrafctngb($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog._text)"];
  st_max4ma: {
    "(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_max4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)"];
    "(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_max4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)"];
  };
  st_mean4ma: {
    "(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mean4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)"];
    "(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_mean4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)"];
  };
  st_memsize: PostgisRasterOverloads["routine:$extension:postgis_raster.st_memsize($extension:postgis_raster.raster)"];
  st_metadata: PostgisRasterOverloads["routine:$extension:postgis_raster.st_metadata($extension:postgis_raster.raster)"];
  st_min4ma: {
    "(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_min4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)"];
    "(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_min4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)"];
  };
  st_minconvexhull: PostgisRasterOverloads["routine:$extension:postgis_raster.st_minconvexhull($extension:postgis_raster.raster,pg_catalog.int4)"];
  st_mindist4ma: PostgisRasterOverloads["routine:$extension:postgis_raster.st_mindist4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)"];
  st_minpossiblevalue: PostgisRasterOverloads["routine:$extension:postgis_raster.st_minpossiblevalue(pg_catalog.text)"];
  st_nearestvalue: {
    "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)"];
  };
  st_neighborhood: {
    "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)"];
  };
  st_notsamealignmentreason: PostgisRasterOverloads["routine:$extension:postgis_raster.st_notsamealignmentreason($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
  st_numbands: PostgisRasterOverloads["routine:$extension:postgis_raster.st_numbands($extension:postgis_raster.raster)"];
  st_overlaps: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_overlaps($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_overlaps($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)"];
  };
  st_pixelascentroid: PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelascentroid($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"];
  st_pixelascentroids: PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelascentroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)"];
  st_pixelaspoint: PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelaspoint($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"];
  st_pixelaspoints: PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelaspoints($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)"];
  st_pixelaspolygon: PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelaspolygon($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"];
  st_pixelaspolygons: PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)"];
  st_pixelheight: PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelheight($extension:postgis_raster.raster)"];
  st_pixelofvalue: {
    "($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)"];
  };
  st_pixelwidth: PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelwidth($extension:postgis_raster.raster)"];
  st_polygon: PostgisRasterOverloads["routine:$extension:postgis_raster.st_polygon($extension:postgis_raster.raster,pg_catalog.int4)"];
  st_quantile: {
    "($extension:postgis_raster.raster,pg_catalog._float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog._float8)"];
    "($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)"];
  };
  st_range4ma: {
    "(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_range4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)"];
    "(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_range4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)"];
  };
  st_rastertoworldcoord: PostgisRasterOverloads["routine:$extension:postgis_raster.st_rastertoworldcoord($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"];
  st_rastertoworldcoordx: {
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_rastertoworldcoordx($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"];
    "($extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_rastertoworldcoordx($extension:postgis_raster.raster,pg_catalog.int4)"];
  };
  st_rastertoworldcoordy: {
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_rastertoworldcoordy($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"];
    "($extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_rastertoworldcoordy($extension:postgis_raster.raster,pg_catalog.int4)"];
  };
  st_rastfromhexwkb: PostgisRasterOverloads["routine:$extension:postgis_raster.st_rastfromhexwkb(pg_catalog.text)"];
  st_rastfromwkb: PostgisRasterOverloads["routine:$extension:postgis_raster.st_rastfromwkb(pg_catalog.bytea)"];
  st_reclass: {
    "($extension:postgis_raster.raster,$extension:postgis_raster._reclassarg)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,$extension:postgis_raster._reclassarg)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)"];
  };
  st_reclassexact: PostgisRasterOverloads["routine:$extension:postgis_raster.st_reclassexact($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog._float8,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)"];
  st_resample: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)"];
  };
  st_rescale: {
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_rescale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_rescale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)"];
  };
  st_resize: {
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)"];
  };
  st_reskew: {
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_reskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_reskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)"];
  };
  st_rotation: PostgisRasterOverloads["routine:$extension:postgis_raster.st_rotation($extension:postgis_raster.raster)"];
  st_roughness: {
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_roughness($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_roughness($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)"];
  };
  st_samealignment: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_samealignment($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
    "($extension:postgis_raster.raster)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_samealignment($extension:postgis_raster.raster)"];
    "(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_samealignment(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
  };
  st_scalex: PostgisRasterOverloads["routine:$extension:postgis_raster.st_scalex($extension:postgis_raster.raster)"];
  st_scaley: PostgisRasterOverloads["routine:$extension:postgis_raster.st_scaley($extension:postgis_raster.raster)"];
  st_setbandindex: PostgisRasterOverloads["routine:$extension:postgis_raster.st_setbandindex($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)"];
  st_setbandisnodata: PostgisRasterOverloads["routine:$extension:postgis_raster.st_setbandisnodata($extension:postgis_raster.raster,pg_catalog.int4)"];
  st_setbandnodatavalue: {
    "($extension:postgis_raster.raster,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setbandnodatavalue($extension:postgis_raster.raster,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setbandnodatavalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)"];
  };
  st_setbandpath: PostgisRasterOverloads["routine:$extension:postgis_raster.st_setbandpath($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.int4,pg_catalog.bool)"];
  st_setgeoreference: {
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setgeoreference($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setgeoreference($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)"];
  };
  st_setgeotransform: PostgisRasterOverloads["routine:$extension:postgis_raster.st_setgeotransform($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
  st_setm: PostgisRasterOverloads["routine:$extension:postgis_raster.st_setm($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)"];
  st_setrotation: PostgisRasterOverloads["routine:$extension:postgis_raster.st_setrotation($extension:postgis_raster.raster,pg_catalog.float8)"];
  st_setscale: {
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setscale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setscale($extension:postgis_raster.raster,pg_catalog.float8)"];
  };
  st_setskew: {
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setskew($extension:postgis_raster.raster,pg_catalog.float8)"];
  };
  st_setsrid: PostgisRasterOverloads["routine:$extension:postgis_raster.st_setsrid($extension:postgis_raster.raster,pg_catalog.int4)"];
  st_setupperleft: PostgisRasterOverloads["routine:$extension:postgis_raster.st_setupperleft($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)"];
  st_setvalue: {
    "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)"];
  };
  st_setvalues: {
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster._geomval,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster._geomval,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog._bool,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog._bool,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)"];
  };
  st_setz: PostgisRasterOverloads["routine:$extension:postgis_raster.st_setz($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)"];
  st_skewx: PostgisRasterOverloads["routine:$extension:postgis_raster.st_skewx($extension:postgis_raster.raster)"];
  st_skewy: PostgisRasterOverloads["routine:$extension:postgis_raster.st_skewy($extension:postgis_raster.raster)"];
  st_slope: {
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_slope($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_slope($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)"];
  };
  st_snaptogrid: {
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
  };
  st_srid: PostgisRasterOverloads["routine:$extension:postgis_raster.st_srid($extension:postgis_raster.raster)"];
  st_stddev4ma: {
    "(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_stddev4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)"];
    "(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_stddev4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)"];
  };
  st_sum4ma: {
    "(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_sum4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)"];
    "(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_sum4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)"];
  };
  st_summary: PostgisRasterOverloads["routine:$extension:postgis_raster.st_summary($extension:postgis_raster.raster)"];
  st_summarystats: {
    "($extension:postgis_raster.raster,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_summarystats($extension:postgis_raster.raster,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_summarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)"];
  };
  st_summarystatsagg: {
    "($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)"];
  };
  st_tile: {
    "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)"];
  };
  st_touches: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_touches($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_touches($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)"];
  };
  st_tpi: {
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_tpi($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_tpi($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)"];
  };
  st_transform: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
  };
  st_tri: {
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_tri($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_tri($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)"];
  };
  st_union: {
    "($extension:postgis_raster.raster,$extension:postgis_raster._unionarg)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,$extension:postgis_raster._unionarg)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.int4)"];
    "($extension:postgis_raster.raster,pg_catalog.text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.text)"];
    "($extension:postgis_raster.raster)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster)"];
  };
  st_upperleftx: PostgisRasterOverloads["routine:$extension:postgis_raster.st_upperleftx($extension:postgis_raster.raster)"];
  st_upperlefty: PostgisRasterOverloads["routine:$extension:postgis_raster.st_upperlefty($extension:postgis_raster.raster)"];
  st_value: {
    "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.text)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.text)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)"];
  };
  st_valuecount: {
    "($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
  };
  st_valuepercent: {
    "($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
  };
  st_width: PostgisRasterOverloads["routine:$extension:postgis_raster.st_width($extension:postgis_raster.raster)"];
  st_within: {
    "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_within($extension:postgis_raster.raster,$extension:postgis_raster.raster)"];
    "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_within($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)"];
  };
  st_worldtorastercoord: {
    "($extension:postgis_raster.raster,$extension:postgis.geometry)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_worldtorastercoord($extension:postgis_raster.raster,$extension:postgis.geometry)"];
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_worldtorastercoord($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)"];
  };
  st_worldtorastercoordx: {
    "($extension:postgis_raster.raster,$extension:postgis.geometry)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,$extension:postgis.geometry)"];
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,pg_catalog.float8)"];
  };
  st_worldtorastercoordy: {
    "($extension:postgis_raster.raster,$extension:postgis.geometry)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,$extension:postgis.geometry)"];
    "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis_raster.raster,pg_catalog.float8)": PostgisRasterOverloads["routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,pg_catalog.float8)"];
  };
}
export interface PostgisRasterPublicCodecs {
  raster: PostgisRasterCodecDefinitions["c0"];
  _raster: PostgisRasterCodecDefinitions["c20"];
  addbandarg: PostgisRasterCodecDefinitions["c21"];
  agg_count: PostgisRasterCodecDefinitions["c22"];
  agg_samealignment: PostgisRasterCodecDefinitions["c23"];
  geomval: PostgisRasterCodecDefinitions["c24"];
  rastbandarg: PostgisRasterCodecDefinitions["c25"];
  raster_columns: PostgisRasterCodecDefinitions["c26"];
  raster_overviews: PostgisRasterCodecDefinitions["c27"];
  reclassarg: PostgisRasterCodecDefinitions["c28"];
  summarystats: PostgisRasterCodecDefinitions["c29"];
  unionarg: PostgisRasterCodecDefinitions["c30"];
  _addbandarg: PostgisRasterCodecDefinitions["c32"];
  _agg_count: PostgisRasterCodecDefinitions["c33"];
  _agg_samealignment: PostgisRasterCodecDefinitions["c34"];
  _geomval: PostgisRasterCodecDefinitions["c35"];
  _rastbandarg: PostgisRasterCodecDefinitions["c36"];
  _raster_columns: PostgisRasterCodecDefinitions["c37"];
  _raster_overviews: PostgisRasterCodecDefinitions["c38"];
  _reclassarg: PostgisRasterCodecDefinitions["c39"];
  _summarystats: PostgisRasterCodecDefinitions["c40"];
  _unionarg: PostgisRasterCodecDefinitions["c41"];
}
export interface PostgisRasterRows {
  "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      min: PostgisRasterCodecDefinitions["nc6"];
      max: PostgisRasterCodecDefinitions["nc6"];
      count: PostgisRasterCodecDefinitions["nc15"];
      percent: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      min: PostgisRasterCodecDefinitions["nc6"];
      max: PostgisRasterCodecDefinitions["nc6"];
      count: PostgisRasterCodecDefinitions["nc15"];
      percent: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      min: PostgisRasterCodecDefinitions["nc6"];
      max: PostgisRasterCodecDefinitions["nc6"];
      count: PostgisRasterCodecDefinitions["nc15"];
      percent: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      min: PostgisRasterCodecDefinitions["nc6"];
      max: PostgisRasterCodecDefinitions["nc6"];
      count: PostgisRasterCodecDefinitions["nc15"];
      percent: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      min: PostgisRasterCodecDefinitions["nc6"];
      max: PostgisRasterCodecDefinitions["nc6"];
      count: PostgisRasterCodecDefinitions["nc15"];
      percent: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      min: PostgisRasterCodecDefinitions["nc6"];
      max: PostgisRasterCodecDefinitions["nc6"];
      count: PostgisRasterCodecDefinitions["nc15"];
      percent: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog._float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog._float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      quantile: PostgisRasterCodecDefinitions["nc6"];
      value: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog._float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog._float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      quantile: PostgisRasterCodecDefinitions["nc6"];
      value: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog._float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog._float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      quantile: PostgisRasterCodecDefinitions["nc6"];
      value: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog._float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog._float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      quantile: PostgisRasterCodecDefinitions["nc6"];
      value: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog._int4)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog._int4)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      bandnum: PostgisRasterCodecDefinitions["nc5"];
      pixeltype: PostgisRasterCodecDefinitions["nc8"];
      nodatavalue: PostgisRasterCodecDefinitions["nc6"];
      isoutdb: PostgisRasterCodecDefinitions["nc4"];
      path: PostgisRasterCodecDefinitions["nc8"];
      outdbbandnum: PostgisRasterCodecDefinitions["nc5"];
      filesize: PostgisRasterCodecDefinitions["nc15"];
      filetimestamp: PostgisRasterCodecDefinitions["nc15"];
    }>
  >;
  "routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog.int4)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog.int4)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      pixeltype: PostgisRasterCodecDefinitions["nc8"];
      nodatavalue: PostgisRasterCodecDefinitions["nc6"];
      isoutdb: PostgisRasterCodecDefinitions["nc4"];
      path: PostgisRasterCodecDefinitions["nc8"];
      outdbbandnum: PostgisRasterCodecDefinitions["nc5"];
      filesize: PostgisRasterCodecDefinitions["nc15"];
      filetimestamp: PostgisRasterCodecDefinitions["nc15"];
    }>
  >;
  "routine:$extension:postgis_raster.st_contour($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._float8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_contour($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._float8,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      geom: PostgisRasterCodecDefinitions["nc2"];
      id: PostgisRasterCodecDefinitions["nc5"];
      value: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_dumpvalues($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_dumpvalues($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      nband: PostgisRasterCodecDefinitions["nc5"];
      valarray: PostgisRasterCodecDefinitions["nc11"];
    }>
  >;
  "routine:$extension:postgis_raster.st_gdaldrivers()": (
    alias: string,
    ...values: Parameters<PostgisRasterOverloads["routine:$extension:postgis_raster.st_gdaldrivers()"]>
  ) => ReturnType<
    typeof extensionRows<{
      idx: PostgisRasterCodecDefinitions["nc5"];
      short_name: PostgisRasterCodecDefinitions["nc8"];
      long_name: PostgisRasterCodecDefinitions["nc8"];
      can_read: PostgisRasterCodecDefinitions["nc4"];
      can_write: PostgisRasterCodecDefinitions["nc4"];
      create_options: PostgisRasterCodecDefinitions["nc8"];
    }>
  >;
  "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      min: PostgisRasterCodecDefinitions["nc6"];
      max: PostgisRasterCodecDefinitions["nc6"];
      count: PostgisRasterCodecDefinitions["nc15"];
      percent: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      min: PostgisRasterCodecDefinitions["nc6"];
      max: PostgisRasterCodecDefinitions["nc6"];
      count: PostgisRasterCodecDefinitions["nc15"];
      percent: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      min: PostgisRasterCodecDefinitions["nc6"];
      max: PostgisRasterCodecDefinitions["nc6"];
      count: PostgisRasterCodecDefinitions["nc15"];
      percent: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      min: PostgisRasterCodecDefinitions["nc6"];
      max: PostgisRasterCodecDefinitions["nc6"];
      count: PostgisRasterCodecDefinitions["nc15"];
      percent: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_pixelascentroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelascentroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      geom: PostgisRasterCodecDefinitions["nc2"];
      val: PostgisRasterCodecDefinitions["nc6"];
      x: PostgisRasterCodecDefinitions["nc5"];
      y: PostgisRasterCodecDefinitions["nc5"];
    }>
  >;
  "routine:$extension:postgis_raster.st_pixelaspoints($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelaspoints($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      geom: PostgisRasterCodecDefinitions["nc2"];
      val: PostgisRasterCodecDefinitions["nc6"];
      x: PostgisRasterCodecDefinitions["nc5"];
      y: PostgisRasterCodecDefinitions["nc5"];
    }>
  >;
  "routine:$extension:postgis_raster.st_pixelaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      geom: PostgisRasterCodecDefinitions["nc2"];
      val: PostgisRasterCodecDefinitions["nc6"];
      x: PostgisRasterCodecDefinitions["nc5"];
      y: PostgisRasterCodecDefinitions["nc5"];
    }>
  >;
  "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      val: PostgisRasterCodecDefinitions["nc6"];
      x: PostgisRasterCodecDefinitions["nc5"];
      y: PostgisRasterCodecDefinitions["nc5"];
    }>
  >;
  "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{ x: PostgisRasterCodecDefinitions["nc5"]; y: PostgisRasterCodecDefinitions["nc5"] }>
  >;
  "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      val: PostgisRasterCodecDefinitions["nc6"];
      x: PostgisRasterCodecDefinitions["nc5"];
      y: PostgisRasterCodecDefinitions["nc5"];
    }>
  >;
  "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)"]
    >
  ) => ReturnType<
    typeof extensionRows<{ x: PostgisRasterCodecDefinitions["nc5"]; y: PostgisRasterCodecDefinitions["nc5"] }>
  >;
  "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog._float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog._float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      quantile: PostgisRasterCodecDefinitions["nc6"];
      value: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      quantile: PostgisRasterCodecDefinitions["nc6"];
      value: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      quantile: PostgisRasterCodecDefinitions["nc6"];
      value: PostgisRasterCodecDefinitions["nc6"];
    }>
  >;
  "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{ value: PostgisRasterCodecDefinitions["nc6"]; count: PostgisRasterCodecDefinitions["nc5"] }>
  >;
  "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{ value: PostgisRasterCodecDefinitions["nc6"]; count: PostgisRasterCodecDefinitions["nc5"] }>
  >;
  "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{ value: PostgisRasterCodecDefinitions["nc6"]; count: PostgisRasterCodecDefinitions["nc5"] }>
  >;
  "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{ value: PostgisRasterCodecDefinitions["nc6"]; count: PostgisRasterCodecDefinitions["nc5"] }>
  >;
  "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{ value: PostgisRasterCodecDefinitions["nc6"]; count: PostgisRasterCodecDefinitions["nc5"] }>
  >;
  "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{ value: PostgisRasterCodecDefinitions["nc6"]; count: PostgisRasterCodecDefinitions["nc5"] }>
  >;
  "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{ value: PostgisRasterCodecDefinitions["nc6"]; percent: PostgisRasterCodecDefinitions["nc6"] }>
  >;
  "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{ value: PostgisRasterCodecDefinitions["nc6"]; percent: PostgisRasterCodecDefinitions["nc6"] }>
  >;
  "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{ value: PostgisRasterCodecDefinitions["nc6"]; percent: PostgisRasterCodecDefinitions["nc6"] }>
  >;
  "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{ value: PostgisRasterCodecDefinitions["nc6"]; percent: PostgisRasterCodecDefinitions["nc6"] }>
  >;
  "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{ value: PostgisRasterCodecDefinitions["nc6"]; percent: PostgisRasterCodecDefinitions["nc6"] }>
  >;
  "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PostgisRasterOverloads["routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)"]
    >
  ) => ReturnType<
    typeof extensionRows<{ value: PostgisRasterCodecDefinitions["nc6"]; percent: PostgisRasterCodecDefinitions["nc6"] }>
  >;
}
export function createPostgisRasterSchemaSurface(descriptor: Descriptor) {
  const schema = descriptor.schema;
  const rasterField = (semantics: PostgisRasterSemantics = {}) =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis_raster.raster",
      type: "raster",
      codec: createPostgisRasterCodec(schema, semantics),
      parameters: {
        srid: semantics.srid ?? "native",
        width: semantics.width ?? "native",
        height: semantics.height ?? "native",
        numBands: semantics.numBands ?? "native",
      },
      value: {
        kind: "object",
        properties: {
          kind: { kind: "string", enum: ["raster"] },
          format: { kind: "string", enum: ["wkb"] },
          hex: { kind: "string" },
          srid: { kind: "number", integer: true },
          width: { kind: "number", integer: true },
          height: { kind: "number", integer: true },
          numBands: { kind: "number", integer: true },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const index0 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis_raster.hash_raster_ops/hash",
        method: "hash",
        opclass: "hash_raster_ops",
        type: "raster",
        default: true,
      }),
      input: { schema, type: "raster" },
    });
  return { fields: { raster: rasterField }, indexes: { hash_raster_ops: index0 } };
}
export type PostgisRasterSchemaSurface = ReturnType<typeof createPostgisRasterSchemaSurface>;
export interface PostgisRasterAdapter extends PostgisRasterSchemaSurface {
  readonly raster: {
    readonly codec: PostgisRasterCodecDefinitions["c0"];
    readonly field: PostgisRasterSchemaSurface["fields"]["raster"];
    readonly wkb: typeof rasterWkb;
  };
  readonly codecs: PostgisRasterPublicCodecs;
  readonly sql: {
    readonly functions: PostgisRasterFunctions;
    readonly overloads: PostgisRasterOverloads;
    readonly operators: Pick<
      PostgisRasterOverloads,
      | "operator:$extension:postgis_raster.@($extension:postgis_raster.raster,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.@($extension:postgis_raster.raster,$extension:postgis.geometry)"
      | "operator:$extension:postgis_raster.@($extension:postgis.geometry,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.&&($extension:postgis_raster.raster,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.&&($extension:postgis_raster.raster,$extension:postgis.geometry)"
      | "operator:$extension:postgis_raster.&&($extension:postgis.geometry,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.&<($extension:postgis_raster.raster,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.&<|($extension:postgis_raster.raster,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.&>($extension:postgis_raster.raster,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.<<($extension:postgis_raster.raster,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.<<|($extension:postgis_raster.raster,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.=($extension:postgis_raster.raster,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.>>($extension:postgis_raster.raster,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.|&>($extension:postgis_raster.raster,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.|>>($extension:postgis_raster.raster,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.~($extension:postgis_raster.raster,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.~($extension:postgis_raster.raster,$extension:postgis.geometry)"
      | "operator:$extension:postgis_raster.~($extension:postgis.geometry,$extension:postgis_raster.raster)"
      | "operator:$extension:postgis_raster.~=($extension:postgis_raster.raster,$extension:postgis_raster.raster)"
    >;
    readonly rows: PostgisRasterRows;
  };
}
/** Exact captured overloads. PostgreSQL owns all raster algorithms and conversions. */
export function createPostgisRaster_3_6_4<const Selected extends Descriptor>(
  descriptor: Selected,
  postgis: PostgisDescriptor,
): Readonly<Selected & PostgisRasterAdapter> {
  if (
    descriptor.name !== "postgis_raster" ||
    descriptor.version !== "3.6.4" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("postgis_raster 3.6.4 requires its exact verified contract");
  if (postgis.name !== "postgis" || postgis.version !== "3.6.4" || postgis.apiSupport.status !== "verified")
    throw new Error("postgis_raster 3.6.4 requires its verified postgis 3.6.4 dependency");
  if (descriptor.schema !== postgis.schema)
    throw new Error("postgis_raster 3.6.4 must share the PostGIS installation schema");
  const schema = descriptor.schema;
  const postgisSchema = postgis.schema;
  const base = { schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const {
    c0,
    nc0,
    c1,
    nc1,
    c2,
    nc2,
    c3,
    nc3,
    c4,
    nc4,
    c5,
    nc5,
    c6,
    nc6,
    c7,
    nc7,
    c8,
    nc8,
    c9,
    nc9,
    c10,
    nc10,
    c11,
    nc11,
    c12,
    nc12,
    c13,
    nc13,
    c14,
    nc14,
    c15,
    nc15,
    c16,
    nc16,
    c17,
    nc17,
    c18,
    nc18,
    c19,
    nc19,
    c20,
    nc20,
    c21,
    nc21,
    c22,
    nc22,
    c23,
    nc23,
    c24,
    nc24,
    c25,
    nc25,
    c26,
    nc26,
    c27,
    nc27,
    c28,
    nc28,
    c29,
    nc29,
    c30,
    nc30,
    c31,
    nc31,
    c32,
    nc32,
    c33,
    nc33,
    c34,
    nc34,
    c35,
    nc35,
    c36,
    nc36,
    c37,
    nc37,
    c38,
    nc38,
    c39,
    nc39,
    c40,
    nc40,
    c41,
    nc41,
  } = createPostgisRasterCodecDefinitions(schema, postgisSchema);
  const member0 = (value: ExtensionSqlInput<typeof nc0>) =>
    checkedExtensionExpression(
      sql`(${rasterParameter(value, nc0)})::${extensionSqlType(postgisSchema, "box3d")}`,
      nc1,
      [],
      undefined,
      "cast:$extension:postgis_raster.raster->$extension:postgis.box3d",
    );
  const member1 = (value: ExtensionSqlInput<typeof nc0>) =>
    checkedExtensionExpression(
      sql`(${rasterParameter(value, nc0)})::${extensionSqlType(postgisSchema, "geometry")}`,
      nc2,
      [],
      undefined,
      "cast:$extension:postgis_raster.raster->$extension:postgis.geometry",
    );
  const member2 = (value: ExtensionSqlInput<typeof nc0>) =>
    checkedExtensionExpression(
      sql`(${rasterParameter(value, nc0)})::${extensionSqlType("pg_catalog", "bytea")}`,
      nc3,
      [],
      undefined,
      "cast:$extension:postgis_raster.raster->pg_catalog.bytea",
    );
  const member14 = createSqlOperator({
    ...base,
    name: "@",
    member: "operator:$extension:postgis_raster.@($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    left: nc0,
    right: nc0,
    result: nc4,
  });
  const member15 = createSqlOperator({
    ...base,
    name: "@",
    member: "operator:$extension:postgis_raster.@($extension:postgis_raster.raster,$extension:postgis.geometry)",
    left: nc0,
    right: nc2,
    result: nc4,
  });
  const member16 = createSqlOperator({
    ...base,
    name: "@",
    member: "operator:$extension:postgis_raster.@($extension:postgis.geometry,$extension:postgis_raster.raster)",
    left: nc2,
    right: nc0,
    result: nc4,
  });
  const member17 = createSqlOperator({
    ...base,
    name: "&&",
    member: "operator:$extension:postgis_raster.&&($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    left: nc0,
    right: nc0,
    result: nc4,
  });
  const member18 = createSqlOperator({
    ...base,
    name: "&&",
    member: "operator:$extension:postgis_raster.&&($extension:postgis_raster.raster,$extension:postgis.geometry)",
    left: nc0,
    right: nc2,
    result: nc4,
  });
  const member19 = createSqlOperator({
    ...base,
    name: "&&",
    member: "operator:$extension:postgis_raster.&&($extension:postgis.geometry,$extension:postgis_raster.raster)",
    left: nc2,
    right: nc0,
    result: nc4,
  });
  const member20 = createSqlOperator({
    ...base,
    name: "&<",
    member: "operator:$extension:postgis_raster.&<($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    left: nc0,
    right: nc0,
    result: nc4,
  });
  const member21 = createSqlOperator({
    ...base,
    name: "&<|",
    member: "operator:$extension:postgis_raster.&<|($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    left: nc0,
    right: nc0,
    result: nc4,
  });
  const member22 = createSqlOperator({
    ...base,
    name: "&>",
    member: "operator:$extension:postgis_raster.&>($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    left: nc0,
    right: nc0,
    result: nc4,
  });
  const member23 = createSqlOperator({
    ...base,
    name: "<<",
    member: "operator:$extension:postgis_raster.<<($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    left: nc0,
    right: nc0,
    result: nc4,
  });
  const member24 = createSqlOperator({
    ...base,
    name: "<<|",
    member: "operator:$extension:postgis_raster.<<|($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    left: nc0,
    right: nc0,
    result: nc4,
  });
  const member25 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:postgis_raster.=($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    left: nc0,
    right: nc0,
    result: nc4,
  });
  const member26 = createSqlOperator({
    ...base,
    name: ">>",
    member: "operator:$extension:postgis_raster.>>($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    left: nc0,
    right: nc0,
    result: nc4,
  });
  const member27 = createSqlOperator({
    ...base,
    name: "|&>",
    member: "operator:$extension:postgis_raster.|&>($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    left: nc0,
    right: nc0,
    result: nc4,
  });
  const member28 = createSqlOperator({
    ...base,
    name: "|>>",
    member: "operator:$extension:postgis_raster.|>>($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    left: nc0,
    right: nc0,
    result: nc4,
  });
  const member29 = createSqlOperator({
    ...base,
    name: "~",
    member: "operator:$extension:postgis_raster.~($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    left: nc0,
    right: nc0,
    result: nc4,
  });
  const member30 = createSqlOperator({
    ...base,
    name: "~",
    member: "operator:$extension:postgis_raster.~($extension:postgis_raster.raster,$extension:postgis.geometry)",
    left: nc0,
    right: nc2,
    result: nc4,
  });
  const member31 = createSqlOperator({
    ...base,
    name: "~",
    member: "operator:$extension:postgis_raster.~($extension:postgis.geometry,$extension:postgis_raster.raster)",
    left: nc2,
    right: nc0,
    result: nc4,
  });
  const member32 = createSqlOperator({
    ...base,
    name: "~=",
    member: "operator:$extension:postgis_raster.~=($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    left: nc0,
    right: nc0,
    result: nc4,
  });
  const rowFields62 = { refschema: nc7, reftable: nc7, refcolumn: nc7, factor: nc5 } as const;
  const rowFields101 = { min: nc6, max: nc6, count: nc15, percent: nc6 } as const;
  const rowFields108 = { geom: nc2, val: nc6, x: nc5, y: nc5 } as const;
  const rowFields109 = { geom: nc2, val: nc6, x: nc5, y: nc5 } as const;
  const rowFields110 = { quantile: nc6, value: nc6 } as const;
  const rowFields111 = { longitude: nc6, latitude: nc6 } as const;
  const rowFields133 = { value: nc6, count: nc5, percent: nc6 } as const;
  const rowFields134 = { value: nc6, count: nc5, percent: nc6 } as const;
  const rowFields136 = { columnx: nc5, rowy: nc5 } as const;
  const member144 = createSqlFunction({
    ...base,
    name: "box3d",
    member: "routine:$extension:postgis_raster.box3d($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc1,
  });
  const member145 = createSqlFunction({
    ...base,
    name: "bytea",
    member: "routine:$extension:postgis_raster.bytea($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc3,
  });
  const member152 = createSqlFunction({
    ...base,
    name: "geometry_contained_by_raster",
    member:
      "routine:$extension:postgis_raster.geometry_contained_by_raster($extension:postgis.geometry,$extension:postgis_raster.raster)",
    arguments: [nc2, nc0] as const,
    result: nc4,
  });
  const member153 = createSqlFunction({
    ...base,
    name: "geometry_raster_contain",
    member:
      "routine:$extension:postgis_raster.geometry_raster_contain($extension:postgis.geometry,$extension:postgis_raster.raster)",
    arguments: [nc2, nc0] as const,
    result: nc4,
  });
  const member154 = createSqlFunction({
    ...base,
    name: "geometry_raster_overlap",
    member:
      "routine:$extension:postgis_raster.geometry_raster_overlap($extension:postgis.geometry,$extension:postgis_raster.raster)",
    arguments: [nc2, nc0] as const,
    result: nc4,
  });
  const member155 = createSqlFunction({
    ...base,
    name: "postgis_gdal_version",
    member: "routine:$extension:postgis_raster.postgis_gdal_version()",
    arguments: [] as const,
    result: nc8,
  });
  const member156 = createSqlFunction({
    ...base,
    name: "postgis_noop",
    member: "routine:$extension:postgis_raster.postgis_noop($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc2,
  });
  const member157 = createSqlFunction({
    ...base,
    name: "postgis_raster_lib_build_date",
    member: "routine:$extension:postgis_raster.postgis_raster_lib_build_date()",
    arguments: [] as const,
    result: nc8,
  });
  const member158 = createSqlFunction({
    ...base,
    name: "postgis_raster_lib_version",
    member: "routine:$extension:postgis_raster.postgis_raster_lib_version()",
    arguments: [] as const,
    result: nc8,
  });
  const member159 = createSqlFunction({
    ...base,
    name: "postgis_raster_scripts_installed",
    member: "routine:$extension:postgis_raster.postgis_raster_scripts_installed()",
    arguments: [] as const,
    result: nc8,
  });
  const member160 = createSqlFunction({
    ...base,
    name: "raster_above",
    member:
      "routine:$extension:postgis_raster.raster_above($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member161 = createSqlFunction({
    ...base,
    name: "raster_below",
    member:
      "routine:$extension:postgis_raster.raster_below($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member162 = createSqlFunction({
    ...base,
    name: "raster_contain",
    member:
      "routine:$extension:postgis_raster.raster_contain($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member163 = createSqlFunction({
    ...base,
    name: "raster_contained_by_geometry",
    member:
      "routine:$extension:postgis_raster.raster_contained_by_geometry($extension:postgis_raster.raster,$extension:postgis.geometry)",
    arguments: [nc0, nc2] as const,
    result: nc4,
  });
  const member164 = createSqlFunction({
    ...base,
    name: "raster_contained",
    member:
      "routine:$extension:postgis_raster.raster_contained($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member165 = createSqlFunction({
    ...base,
    name: "raster_eq",
    member:
      "routine:$extension:postgis_raster.raster_eq($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member166 = createSqlFunction({
    ...base,
    name: "raster_geometry_contain",
    member:
      "routine:$extension:postgis_raster.raster_geometry_contain($extension:postgis_raster.raster,$extension:postgis.geometry)",
    arguments: [nc0, nc2] as const,
    result: nc4,
  });
  const member167 = createSqlFunction({
    ...base,
    name: "raster_geometry_overlap",
    member:
      "routine:$extension:postgis_raster.raster_geometry_overlap($extension:postgis_raster.raster,$extension:postgis.geometry)",
    arguments: [nc0, nc2] as const,
    result: nc4,
  });
  const member168 = createSqlFunction({
    ...base,
    name: "raster_hash",
    member: "routine:$extension:postgis_raster.raster_hash($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc5,
  });
  const member170 = createSqlFunction({
    ...base,
    name: "raster_left",
    member:
      "routine:$extension:postgis_raster.raster_left($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member172 = createSqlFunction({
    ...base,
    name: "raster_overabove",
    member:
      "routine:$extension:postgis_raster.raster_overabove($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member173 = createSqlFunction({
    ...base,
    name: "raster_overbelow",
    member:
      "routine:$extension:postgis_raster.raster_overbelow($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member174 = createSqlFunction({
    ...base,
    name: "raster_overlap",
    member:
      "routine:$extension:postgis_raster.raster_overlap($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member175 = createSqlFunction({
    ...base,
    name: "raster_overleft",
    member:
      "routine:$extension:postgis_raster.raster_overleft($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member176 = createSqlFunction({
    ...base,
    name: "raster_overright",
    member:
      "routine:$extension:postgis_raster.raster_overright($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member177 = createSqlFunction({
    ...base,
    name: "raster_right",
    member:
      "routine:$extension:postgis_raster.raster_right($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member178 = createSqlFunction({
    ...base,
    name: "raster_same",
    member:
      "routine:$extension:postgis_raster.raster_same($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member179 = createSqlFunction({
    ...base,
    name: "st_addband",
    member:
      "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster._addbandarg)",
    arguments: [nc0, nc32] as const,
    result: nc0,
  });
  const member180 = createSqlFunction({
    ...base,
    name: "st_addband",
    member:
      "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster._raster,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc0, nc20, defaultSqlArgument(nc5, "fromband"), defaultSqlArgument(nc5, "torastindex")] as const,
    result: nc0,
  });
  const member181 = createSqlFunction({
    ...base,
    name: "st_addband",
    member:
      "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc0, nc0, defaultSqlArgument(nc5, "fromband"), defaultSqlArgument(nc5, "torastindex")] as const,
    result: nc0,
  });
  const member182 = createSqlFunction({
    ...base,
    name: "st_addband",
    member:
      "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog._int4,pg_catalog.float8)",
    arguments: [nc0, nc5, nc8, nc14, defaultSqlArgument(nc6, "nodataval")] as const,
    result: nc0,
  });
  const member183 = createSqlFunction({
    ...base,
    name: "st_addband",
    member:
      "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc5, nc8, defaultSqlArgument(nc6, "initialvalue"), defaultSqlArgument(nc6, "nodataval")] as const,
    result: nc0,
  });
  const member184 = createSqlFunction({
    ...base,
    name: "st_addband",
    member:
      "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.text,pg_catalog._int4,pg_catalog.int4,pg_catalog.float8)",
    arguments: [nc0, nc8, nc14, defaultSqlArgument(nc5, "index"), defaultSqlArgument(nc6, "nodataval")] as const,
    result: nc0,
  });
  const member185 = createSqlFunction({
    ...base,
    name: "st_addband",
    member:
      "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc8, defaultSqlArgument(nc6, "initialvalue"), defaultSqlArgument(nc6, "nodataval")] as const,
    result: nc0,
  });
  const member186 = createSqlFunction({
    ...base,
    name: "st_approxcount",
    member:
      "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)",
    arguments: [nc0, nc4, defaultSqlArgument(nc6, "sample_percent")] as const,
    result: nc15,
  });
  const member187 = createSqlFunction({
    ...base,
    name: "st_approxcount",
    member: "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.float8)",
    arguments: [nc0, nc6] as const,
    result: nc15,
  });
  const member188 = createSqlFunction({
    ...base,
    name: "st_approxcount",
    member:
      "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc4, "exclude_nodata_value"),
      defaultSqlArgument(nc6, "sample_percent"),
    ] as const,
    result: nc15,
  });
  const member189 = createSqlFunction({
    ...base,
    name: "st_approxcount",
    member:
      "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    arguments: [nc0, nc5, nc6] as const,
    result: nc15,
  });
  const rowFields190 = { min: nc6, max: nc6, count: nc15, percent: nc6 } as const;
  const member190 = createSqlFunction({
    ...base,
    name: "st_approxhistogram",
    member: "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.float8)",
    arguments: [nc0, nc6] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.float8)",
        rowFields190,
      ),
    ),
  });
  const rows190 = (alias: string, ...values: Parameters<typeof member190>) =>
    extensionRows(member190(...values), alias, rowFields190, "named");
  const rowFields191 = { min: nc6, max: nc6, count: nc15, percent: nc6 } as const;
  const member191 = createSqlFunction({
    ...base,
    name: "st_approxhistogram",
    member:
      "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc4, "exclude_nodata_value"),
      defaultSqlArgument(nc6, "sample_percent"),
      defaultSqlArgument(nc5, "bins"),
      defaultSqlArgument(nc11, "width"),
      defaultSqlArgument(nc4, "right"),
    ] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
        rowFields191,
      ),
    ),
  });
  const rows191 = (alias: string, ...values: Parameters<typeof member191>) =>
    extensionRows(member191(...values), alias, rowFields191, "named");
  const rowFields192 = { min: nc6, max: nc6, count: nc15, percent: nc6 } as const;
  const member192 = createSqlFunction({
    ...base,
    name: "st_approxhistogram",
    member:
      "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc4, nc6, nc5, nc4] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
        rowFields192,
      ),
    ),
  });
  const rows192 = (alias: string, ...values: Parameters<typeof member192>) =>
    extensionRows(member192(...values), alias, rowFields192, "named");
  const rowFields193 = { min: nc6, max: nc6, count: nc15, percent: nc6 } as const;
  const member193 = createSqlFunction({
    ...base,
    name: "st_approxhistogram",
    member:
      "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
    arguments: [nc0, nc5, nc6, nc5, defaultSqlArgument(nc11, "width"), defaultSqlArgument(nc4, "right")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
        rowFields193,
      ),
    ),
  });
  const rows193 = (alias: string, ...values: Parameters<typeof member193>) =>
    extensionRows(member193(...values), alias, rowFields193, "named");
  const rowFields194 = { min: nc6, max: nc6, count: nc15, percent: nc6 } as const;
  const member194 = createSqlFunction({
    ...base,
    name: "st_approxhistogram",
    member:
      "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc6, nc5, nc4] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
        rowFields194,
      ),
    ),
  });
  const rows194 = (alias: string, ...values: Parameters<typeof member194>) =>
    extensionRows(member194(...values), alias, rowFields194, "named");
  const rowFields195 = { min: nc6, max: nc6, count: nc15, percent: nc6 } as const;
  const member195 = createSqlFunction({
    ...base,
    name: "st_approxhistogram",
    member:
      "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    arguments: [nc0, nc5, nc6] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
        rowFields195,
      ),
    ),
  });
  const rows195 = (alias: string, ...values: Parameters<typeof member195>) =>
    extensionRows(member195(...values), alias, rowFields195, "named");
  const rowFields196 = { quantile: nc6, value: nc6 } as const;
  const unsafeMember196 = createSqlFunction({
    ...base,
    name: "st_approxquantile",
    member: "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog._float8)",
    arguments: [nc0, nc11] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog._float8)",
        rowFields196,
      ),
    ),
  });
  const member196: typeof unsafeMember196 = () =>
    decodeFailure(() => {
      throw new PostgisRasterNativeSafetyError(
        "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog._float8)",
      );
    });
  const rows196 = (alias: string, ...values: Parameters<typeof member196>) =>
    extensionRows(member196(...values), alias, rowFields196, "named");
  const unsafeMember197 = createSqlFunction({
    ...base,
    name: "st_approxquantile",
    member:
      "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)",
    arguments: [nc0, nc4, defaultSqlArgument(nc6, "quantile")] as const,
    result: nc6,
  });
  const member197: typeof unsafeMember197 = () =>
    decodeFailure(() => {
      throw new PostgisRasterNativeSafetyError(
        "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)",
      );
    });
  const rowFields198 = { quantile: nc6, value: nc6 } as const;
  const member198 = createSqlFunction({
    ...base,
    name: "st_approxquantile",
    member:
      "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog._float8)",
    arguments: [nc0, nc6, defaultSqlArgument(nc11, "quantiles")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog._float8)",
        rowFields198,
      ),
    ),
  });
  const rows198 = (alias: string, ...values: Parameters<typeof member198>) =>
    extensionRows(member198(...values), alias, rowFields198, "named");
  const member199 = createSqlFunction({
    ...base,
    name: "st_approxquantile",
    member:
      "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc6, nc6] as const,
    result: nc6,
  });
  const rowFields200 = { quantile: nc6, value: nc6 } as const;
  const member200 = createSqlFunction({
    ...base,
    name: "st_approxquantile",
    member:
      "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog._float8)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc4, "exclude_nodata_value"),
      defaultSqlArgument(nc6, "sample_percent"),
      defaultSqlArgument(nc11, "quantiles"),
    ] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog._float8)",
        rowFields200,
      ),
    ),
  });
  const rows200 = (alias: string, ...values: Parameters<typeof member200>) =>
    extensionRows(member200(...values), alias, rowFields200, "named");
  const member201 = createSqlFunction({
    ...base,
    name: "st_approxquantile",
    member:
      "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc5, nc4, nc6, nc6] as const,
    result: nc6,
  });
  const rowFields202 = { quantile: nc6, value: nc6 } as const;
  const member202 = createSqlFunction({
    ...base,
    name: "st_approxquantile",
    member:
      "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog._float8)",
    arguments: [nc0, nc5, nc6, defaultSqlArgument(nc11, "quantiles")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog._float8)",
        rowFields202,
      ),
    ),
  });
  const rows202 = (alias: string, ...values: Parameters<typeof member202>) =>
    extensionRows(member202(...values), alias, rowFields202, "named");
  const member203 = createSqlFunction({
    ...base,
    name: "st_approxquantile",
    member:
      "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc5, nc6, nc6] as const,
    result: nc6,
  });
  const member204 = createSqlFunction({
    ...base,
    name: "st_approxsummarystats",
    member:
      "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)",
    arguments: [nc0, nc4, defaultSqlArgument(nc6, "sample_percent")] as const,
    result: nc29,
  });
  const member205 = createSqlFunction({
    ...base,
    name: "st_approxsummarystats",
    member:
      "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.float8)",
    arguments: [nc0, nc6] as const,
    result: nc29,
  });
  const member206 = createSqlFunction({
    ...base,
    name: "st_approxsummarystats",
    member:
      "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc4, "exclude_nodata_value"),
      defaultSqlArgument(nc6, "sample_percent"),
    ] as const,
    result: nc29,
  });
  const member207 = createSqlFunction({
    ...base,
    name: "st_approxsummarystats",
    member:
      "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    arguments: [nc0, nc5, nc6] as const,
    result: nc29,
  });
  const member208 = createSqlFunction({
    ...base,
    name: "st_asbinary",
    member: "routine:$extension:postgis_raster.st_asbinary($extension:postgis_raster.raster,pg_catalog.bool)",
    arguments: [nc0, defaultSqlArgument(nc4, "outasin")] as const,
    result: nc3,
  });
  const member209 = createSqlFunction({
    ...base,
    name: "st_asgdalraster",
    member:
      "routine:$extension:postgis_raster.st_asgdalraster($extension:postgis_raster.raster,pg_catalog.text,pg_catalog._text,pg_catalog.int4)",
    arguments: [nc0, nc8, defaultSqlArgument(nc13, "options"), defaultSqlArgument(nc5, "srid")] as const,
    result: nc3,
  });
  const member210 = createSqlFunction({
    ...base,
    name: "st_ashexwkb",
    member: "routine:$extension:postgis_raster.st_ashexwkb($extension:postgis_raster.raster,pg_catalog.bool)",
    arguments: [nc0, defaultSqlArgument(nc4, "outasin")] as const,
    result: nc8,
  });
  const member211 = createSqlFunction({
    ...base,
    name: "st_asjpeg",
    member:
      "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text)",
    arguments: [nc0, nc14, defaultSqlArgument(nc13, "options")] as const,
    result: nc3,
  });
  const member212 = createSqlFunction({
    ...base,
    name: "st_asjpeg",
    member:
      "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4)",
    arguments: [nc0, nc14, nc5] as const,
    result: nc3,
  });
  const member213 = createSqlFunction({
    ...base,
    name: "st_asjpeg",
    member: "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._text)",
    arguments: [nc0, defaultSqlArgument(nc13, "options")] as const,
    result: nc3,
  });
  const member214 = createSqlFunction({
    ...base,
    name: "st_asjpeg",
    member:
      "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._text)",
    arguments: [nc0, nc5, defaultSqlArgument(nc13, "options")] as const,
    result: nc3,
  });
  const member215 = createSqlFunction({
    ...base,
    name: "st_asjpeg",
    member:
      "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc0, nc5, nc5] as const,
    result: nc3,
  });
  const member216 = createSqlFunction({
    ...base,
    name: "st_aspect",
    member:
      "routine:$extension:postgis_raster.st_aspect($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    arguments: [
      nc0,
      nc5,
      nc0,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "units"),
      defaultSqlArgument(nc4, "interpolate_nodata"),
    ] as const,
    result: nc0,
  });
  const member217 = createSqlFunction({
    ...base,
    name: "st_aspect",
    member:
      "routine:$extension:postgis_raster.st_aspect($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "units"),
      defaultSqlArgument(nc4, "interpolate_nodata"),
    ] as const,
    result: nc0,
  });
  const member218 = createSqlFunction({
    ...base,
    name: "st_aspng",
    member:
      "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text)",
    arguments: [nc0, nc14, defaultSqlArgument(nc13, "options")] as const,
    result: nc3,
  });
  const member219 = createSqlFunction({
    ...base,
    name: "st_aspng",
    member:
      "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4)",
    arguments: [nc0, nc14, nc5] as const,
    result: nc3,
  });
  const member220 = createSqlFunction({
    ...base,
    name: "st_aspng",
    member: "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._text)",
    arguments: [nc0, defaultSqlArgument(nc13, "options")] as const,
    result: nc3,
  });
  const member221 = createSqlFunction({
    ...base,
    name: "st_aspng",
    member:
      "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._text)",
    arguments: [nc0, nc5, defaultSqlArgument(nc13, "options")] as const,
    result: nc3,
  });
  const member222 = createSqlFunction({
    ...base,
    name: "st_aspng",
    member:
      "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc0, nc5, nc5] as const,
    result: nc3,
  });
  const member223 = createSqlFunction({
    ...base,
    name: "st_asraster",
    member:
      "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.bool)",
    arguments: [
      nc2,
      nc0,
      defaultSqlArgument(nc13, "pixeltype"),
      defaultSqlArgument(nc11, "value"),
      defaultSqlArgument(nc11, "nodataval"),
      defaultSqlArgument(nc4, "touched"),
    ] as const,
    result: nc0,
  });
  const member224 = createSqlFunction({
    ...base,
    name: "st_asraster",
    member:
      "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    arguments: [
      nc2,
      nc0,
      nc8,
      defaultSqlArgument(nc6, "value"),
      defaultSqlArgument(nc6, "nodataval"),
      defaultSqlArgument(nc4, "touched"),
    ] as const,
    result: nc0,
  });
  const member225 = createSqlFunction({
    ...base,
    name: "st_asraster",
    member:
      "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    arguments: [
      nc2,
      nc6,
      nc6,
      nc13,
      defaultSqlArgument(nc11, "value"),
      defaultSqlArgument(nc11, "nodataval"),
      defaultSqlArgument(nc6, "upperleftx"),
      defaultSqlArgument(nc6, "upperlefty"),
      defaultSqlArgument(nc6, "skewx"),
      defaultSqlArgument(nc6, "skewy"),
      defaultSqlArgument(nc4, "touched"),
    ] as const,
    result: nc0,
  });
  const member226 = createSqlFunction({
    ...base,
    name: "st_asraster",
    member:
      "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    arguments: [
      nc2,
      nc6,
      nc6,
      defaultSqlArgument(nc6, "gridx"),
      defaultSqlArgument(nc6, "gridy"),
      defaultSqlArgument(nc13, "pixeltype"),
      defaultSqlArgument(nc11, "value"),
      defaultSqlArgument(nc11, "nodataval"),
      defaultSqlArgument(nc6, "skewx"),
      defaultSqlArgument(nc6, "skewy"),
      defaultSqlArgument(nc4, "touched"),
    ] as const,
    result: nc0,
  });
  const member227 = createSqlFunction({
    ...base,
    name: "st_asraster",
    member:
      "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    arguments: [
      nc2,
      nc6,
      nc6,
      nc6,
      nc6,
      nc8,
      defaultSqlArgument(nc6, "value"),
      defaultSqlArgument(nc6, "nodataval"),
      defaultSqlArgument(nc6, "skewx"),
      defaultSqlArgument(nc6, "skewy"),
      defaultSqlArgument(nc4, "touched"),
    ] as const,
    result: nc0,
  });
  const member228 = createSqlFunction({
    ...base,
    name: "st_asraster",
    member:
      "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    arguments: [
      nc2,
      nc6,
      nc6,
      nc8,
      defaultSqlArgument(nc6, "value"),
      defaultSqlArgument(nc6, "nodataval"),
      defaultSqlArgument(nc6, "upperleftx"),
      defaultSqlArgument(nc6, "upperlefty"),
      defaultSqlArgument(nc6, "skewx"),
      defaultSqlArgument(nc6, "skewy"),
      defaultSqlArgument(nc4, "touched"),
    ] as const,
    result: nc0,
  });
  const member229 = createSqlFunction({
    ...base,
    name: "st_asraster",
    member:
      "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    arguments: [
      nc2,
      nc5,
      nc5,
      nc13,
      defaultSqlArgument(nc11, "value"),
      defaultSqlArgument(nc11, "nodataval"),
      defaultSqlArgument(nc6, "upperleftx"),
      defaultSqlArgument(nc6, "upperlefty"),
      defaultSqlArgument(nc6, "skewx"),
      defaultSqlArgument(nc6, "skewy"),
      defaultSqlArgument(nc4, "touched"),
    ] as const,
    result: nc0,
  });
  const member230 = createSqlFunction({
    ...base,
    name: "st_asraster",
    member:
      "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    arguments: [
      nc2,
      nc5,
      nc5,
      defaultSqlArgument(nc6, "gridx"),
      defaultSqlArgument(nc6, "gridy"),
      defaultSqlArgument(nc13, "pixeltype"),
      defaultSqlArgument(nc11, "value"),
      defaultSqlArgument(nc11, "nodataval"),
      defaultSqlArgument(nc6, "skewx"),
      defaultSqlArgument(nc6, "skewy"),
      defaultSqlArgument(nc4, "touched"),
    ] as const,
    result: nc0,
  });
  const member231 = createSqlFunction({
    ...base,
    name: "st_asraster",
    member:
      "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    arguments: [
      nc2,
      nc5,
      nc5,
      nc6,
      nc6,
      nc8,
      defaultSqlArgument(nc6, "value"),
      defaultSqlArgument(nc6, "nodataval"),
      defaultSqlArgument(nc6, "skewx"),
      defaultSqlArgument(nc6, "skewy"),
      defaultSqlArgument(nc4, "touched"),
    ] as const,
    result: nc0,
  });
  const member232 = createSqlFunction({
    ...base,
    name: "st_asraster",
    member:
      "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    arguments: [
      nc2,
      nc5,
      nc5,
      nc8,
      defaultSqlArgument(nc6, "value"),
      defaultSqlArgument(nc6, "nodataval"),
      defaultSqlArgument(nc6, "upperleftx"),
      defaultSqlArgument(nc6, "upperlefty"),
      defaultSqlArgument(nc6, "skewx"),
      defaultSqlArgument(nc6, "skewy"),
      defaultSqlArgument(nc4, "touched"),
    ] as const,
    result: nc0,
  });
  const member233 = createSqlAggregate({
    ...base,
    name: "st_asrasteragg",
    member:
      "routine:$extension:postgis_raster.st_asrasteragg($extension:postgis.geometry,pg_catalog.float8,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.bool)",
    arguments: [nc2, nc6, nc0, nc8, nc6, nc8, nc4] as const,
    result: nc0,
  });
  const member234 = createSqlFunction({
    ...base,
    name: "st_astiff",
    member:
      "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text,pg_catalog.int4)",
    arguments: [nc0, nc14, defaultSqlArgument(nc13, "options"), defaultSqlArgument(nc5, "srid")] as const,
    result: nc3,
  });
  const member235 = createSqlFunction({
    ...base,
    name: "st_astiff",
    member:
      "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.text,pg_catalog.int4)",
    arguments: [nc0, nc14, nc8, defaultSqlArgument(nc5, "srid")] as const,
    result: nc3,
  });
  const member236 = createSqlFunction({
    ...base,
    name: "st_astiff",
    member:
      "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._text,pg_catalog.int4)",
    arguments: [nc0, defaultSqlArgument(nc13, "options"), defaultSqlArgument(nc5, "srid")] as const,
    result: nc3,
  });
  const member237 = createSqlFunction({
    ...base,
    name: "st_astiff",
    member:
      "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.int4)",
    arguments: [nc0, nc8, defaultSqlArgument(nc5, "srid")] as const,
    result: nc3,
  });
  const member238 = createSqlFunction({
    ...base,
    name: "st_aswkb",
    member: "routine:$extension:postgis_raster.st_aswkb($extension:postgis_raster.raster,pg_catalog.bool)",
    arguments: [nc0, defaultSqlArgument(nc4, "outasin")] as const,
    result: nc3,
  });
  const member239 = createSqlFunction({
    ...base,
    name: "st_band",
    member: "routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog._int4)",
    arguments: [nc0, defaultSqlArgument(nc14, "nbands")] as const,
    result: nc0,
  });
  const member240 = createSqlFunction({
    ...base,
    name: "st_band",
    member: "routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, nc5] as const,
    result: nc0,
  });
  const member241 = createSqlFunction({
    ...base,
    name: "st_band",
    member:
      "routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bpchar)",
    arguments: [nc0, nc8, defaultSqlArgument(nc9, "delimiter")] as const,
    result: nc0,
  });
  const member242 = createSqlFunction({
    ...base,
    name: "st_bandfilesize",
    member: "routine:$extension:postgis_raster.st_bandfilesize($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, defaultSqlArgument(nc5, "band")] as const,
    result: nc15,
  });
  const member243 = createSqlFunction({
    ...base,
    name: "st_bandfiletimestamp",
    member: "routine:$extension:postgis_raster.st_bandfiletimestamp($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, defaultSqlArgument(nc5, "band")] as const,
    result: nc15,
  });
  const member244 = createSqlFunction({
    ...base,
    name: "st_bandisnodata",
    member: "routine:$extension:postgis_raster.st_bandisnodata($extension:postgis_raster.raster,pg_catalog.bool)",
    arguments: [nc0, nc4] as const,
    result: nc4,
  });
  const member245 = createSqlFunction({
    ...base,
    name: "st_bandisnodata",
    member:
      "routine:$extension:postgis_raster.st_bandisnodata($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, defaultSqlArgument(nc5, "band"), defaultSqlArgument(nc4, "forcechecking")] as const,
    result: nc4,
  });
  const rowFields246 = {
    bandnum: nc5,
    pixeltype: nc8,
    nodatavalue: nc6,
    isoutdb: nc4,
    path: nc8,
    outdbbandnum: nc5,
    filesize: nc15,
    filetimestamp: nc15,
  } as const;
  const member246 = createSqlFunction({
    ...base,
    name: "st_bandmetadata",
    member: "routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog._int4)",
    arguments: [nc0, nc14] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog._int4)",
        rowFields246,
      ),
    ),
  });
  const rows246 = (alias: string, ...values: Parameters<typeof member246>) =>
    extensionRows(member246(...values), alias, rowFields246, "named");
  const rowFields247 = {
    pixeltype: nc8,
    nodatavalue: nc6,
    isoutdb: nc4,
    path: nc8,
    outdbbandnum: nc5,
    filesize: nc15,
    filetimestamp: nc15,
  } as const;
  const member247 = createSqlFunction({
    ...base,
    name: "st_bandmetadata",
    member: "routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, defaultSqlArgument(nc5, "band")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog.int4)",
        rowFields247,
      ),
    ),
  });
  const rows247 = (alias: string, ...values: Parameters<typeof member247>) =>
    extensionRows(member247(...values), alias, rowFields247, "named");
  const member248 = createSqlFunction({
    ...base,
    name: "st_bandnodatavalue",
    member: "routine:$extension:postgis_raster.st_bandnodatavalue($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, defaultSqlArgument(nc5, "band")] as const,
    result: nc6,
  });
  const member249 = createSqlFunction({
    ...base,
    name: "st_bandpath",
    member: "routine:$extension:postgis_raster.st_bandpath($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, defaultSqlArgument(nc5, "band")] as const,
    result: nc8,
  });
  const member250 = createSqlFunction({
    ...base,
    name: "st_bandpixeltype",
    member: "routine:$extension:postgis_raster.st_bandpixeltype($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, defaultSqlArgument(nc5, "band")] as const,
    result: nc8,
  });
  const member251 = createSqlFunction({
    ...base,
    name: "st_clip",
    member:
      "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)",
    arguments: [
      nc0,
      nc2,
      defaultSqlArgument(nc11, "nodataval"),
      defaultSqlArgument(nc4, "crop"),
      defaultSqlArgument(nc4, "touched"),
    ] as const,
    result: nc0,
  });
  const member252 = createSqlFunction({
    ...base,
    name: "st_clip",
    member:
      "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)",
    arguments: [nc0, nc2, nc4, defaultSqlArgument(nc4, "touched")] as const,
    result: nc0,
  });
  const member253 = createSqlFunction({
    ...base,
    name: "st_clip",
    member:
      "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)",
    arguments: [nc0, nc2, nc6, defaultSqlArgument(nc4, "crop"), defaultSqlArgument(nc4, "touched")] as const,
    result: nc0,
  });
  const member254 = createSqlFunction({
    ...base,
    name: "st_clip",
    member:
      "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog._int4,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)",
    arguments: [nc0, nc14, nc2, nc11, defaultSqlArgument(nc4, "crop"), defaultSqlArgument(nc4, "touched")] as const,
    result: nc0,
  });
  const member255 = createSqlFunction({
    ...base,
    name: "st_clip",
    member:
      "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)",
    arguments: [nc0, nc5, nc2, defaultSqlArgument(nc4, "crop"), defaultSqlArgument(nc4, "touched")] as const,
    result: nc0,
  });
  const member256 = createSqlFunction({
    ...base,
    name: "st_clip",
    member:
      "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)",
    arguments: [nc0, nc5, nc2, nc6, defaultSqlArgument(nc4, "crop"), defaultSqlArgument(nc4, "touched")] as const,
    result: nc0,
  });
  const member257 = createSqlFunction({
    ...base,
    name: "st_colormap",
    member:
      "routine:$extension:postgis_raster.st_colormap($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc8, "colormap"),
      defaultSqlArgument(nc8, "method"),
    ] as const,
    result: nc0,
  });
  const member258 = createSqlFunction({
    ...base,
    name: "st_colormap",
    member:
      "routine:$extension:postgis_raster.st_colormap($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)",
    arguments: [nc0, nc8, defaultSqlArgument(nc8, "method")] as const,
    result: nc0,
  });
  const member259 = createSqlFunction({
    ...base,
    name: "st_contains",
    member:
      "routine:$extension:postgis_raster.st_contains($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member260 = createSqlFunction({
    ...base,
    name: "st_contains",
    member:
      "routine:$extension:postgis_raster.st_contains($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, nc5, nc0, nc5] as const,
    result: nc4,
  });
  const member261 = createSqlFunction({
    ...base,
    name: "st_containsproperly",
    member:
      "routine:$extension:postgis_raster.st_containsproperly($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member262 = createSqlFunction({
    ...base,
    name: "st_containsproperly",
    member:
      "routine:$extension:postgis_raster.st_containsproperly($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, nc5, nc0, nc5] as const,
    result: nc4,
  });
  const rowFields263 = { geom: nc2, id: nc5, value: nc6 } as const;
  const member263 = createSqlFunction({
    ...base,
    name: "st_contour",
    member:
      "routine:$extension:postgis_raster.st_contour($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._float8,pg_catalog.bool)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "bandnumber"),
      defaultSqlArgument(nc6, "level_interval"),
      defaultSqlArgument(nc6, "level_base"),
      defaultSqlArgument(nc11, "fixed_levels"),
      defaultSqlArgument(nc4, "polygonize"),
    ] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_contour($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._float8,pg_catalog.bool)",
        rowFields263,
      ),
    ),
  });
  const rows263 = (alias: string, ...values: Parameters<typeof member263>) =>
    extensionRows(member263(...values), alias, rowFields263, "named");
  const member264 = createSqlFunction({
    ...base,
    name: "st_convexhull",
    member: "routine:$extension:postgis_raster.st_convexhull($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc2,
  });
  const member265 = createSqlFunction({
    ...base,
    name: "st_count",
    member: "routine:$extension:postgis_raster.st_count($extension:postgis_raster.raster,pg_catalog.bool)",
    arguments: [nc0, nc4] as const,
    result: nc15,
  });
  const member266 = createSqlFunction({
    ...base,
    name: "st_count",
    member:
      "routine:$extension:postgis_raster.st_count($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, defaultSqlArgument(nc5, "nband"), defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc15,
  });
  const member267 = createSqlAggregate({
    ...base,
    name: "st_countagg",
    member: "routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.bool)",
    arguments: [nc0, nc4] as const,
    result: nc15,
  });
  const member268 = createSqlAggregate({
    ...base,
    name: "st_countagg",
    member:
      "routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    arguments: [nc0, nc5, nc4, nc6] as const,
    result: nc15,
  });
  const member269 = createSqlAggregate({
    ...base,
    name: "st_countagg",
    member:
      "routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc4] as const,
    result: nc15,
  });
  const member270 = createSqlFunction({
    ...base,
    name: "st_coveredby",
    member:
      "routine:$extension:postgis_raster.st_coveredby($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member271 = createSqlFunction({
    ...base,
    name: "st_coveredby",
    member:
      "routine:$extension:postgis_raster.st_coveredby($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, nc5, nc0, nc5] as const,
    result: nc4,
  });
  const member272 = createSqlFunction({
    ...base,
    name: "st_covers",
    member:
      "routine:$extension:postgis_raster.st_covers($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member273 = createSqlFunction({
    ...base,
    name: "st_covers",
    member:
      "routine:$extension:postgis_raster.st_covers($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, nc5, nc0, nc5] as const,
    result: nc4,
  });
  const member275 = createSqlFunction({
    ...base,
    name: "st_dfullywithin",
    member:
      "routine:$extension:postgis_raster.st_dfullywithin($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)",
    arguments: [nc0, nc0, nc6] as const,
    result: nc4,
  });
  const member276 = createSqlFunction({
    ...base,
    name: "st_dfullywithin",
    member:
      "routine:$extension:postgis_raster.st_dfullywithin($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    arguments: [nc0, nc5, nc0, nc5, nc6] as const,
    result: nc4,
  });
  const member277 = createSqlFunction({
    ...base,
    name: "st_disjoint",
    member:
      "routine:$extension:postgis_raster.st_disjoint($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member278 = createSqlFunction({
    ...base,
    name: "st_disjoint",
    member:
      "routine:$extension:postgis_raster.st_disjoint($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, nc5, nc0, nc5] as const,
    result: nc4,
  });
  const member279 = createRasterVariadicFunction({
    ...base,
    name: "st_distinct4ma",
    member: "routine:$extension:postgis_raster.st_distinct4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    arguments: [nc11, nc14, defaultSqlArgument(nc13, "userargs")] as const,
    result: nc6,
  });
  const member280 = createRasterVariadicFunction({
    ...base,
    name: "st_distinct4ma",
    member: "routine:$extension:postgis_raster.st_distinct4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)",
    arguments: [nc11, nc8, nc13] as const,
    result: nc6,
  });
  const member281 = createSqlFunction({
    ...base,
    name: "st_dumpaspolygons",
    member:
      "routine:$extension:postgis_raster.st_dumpaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, defaultSqlArgument(nc5, "band"), defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc24,
  });
  const rowFields282 = { nband: nc5, valarray: nc11 } as const;
  const member282 = createSqlFunction({
    ...base,
    name: "st_dumpvalues",
    member:
      "routine:$extension:postgis_raster.st_dumpvalues($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.bool)",
    arguments: [nc0, defaultSqlArgument(nc14, "nband"), defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_dumpvalues($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.bool)",
        rowFields282,
      ),
    ),
  });
  const rows282 = (alias: string, ...values: Parameters<typeof member282>) =>
    extensionRows(member282(...values), alias, rowFields282, "named");
  const member283 = createSqlFunction({
    ...base,
    name: "st_dumpvalues",
    member:
      "routine:$extension:postgis_raster.st_dumpvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc11,
  });
  const member284 = createSqlFunction({
    ...base,
    name: "st_dwithin",
    member:
      "routine:$extension:postgis_raster.st_dwithin($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)",
    arguments: [nc0, nc0, nc6] as const,
    result: nc4,
  });
  const member285 = createSqlFunction({
    ...base,
    name: "st_dwithin",
    member:
      "routine:$extension:postgis_raster.st_dwithin($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    arguments: [nc0, nc5, nc0, nc5, nc6] as const,
    result: nc4,
  });
  const member286 = createSqlFunction({
    ...base,
    name: "st_envelope",
    member: "routine:$extension:postgis_raster.st_envelope($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc2,
  });
  const member287 = createSqlFunction({
    ...base,
    name: "st_fromgdalraster",
    member: "routine:$extension:postgis_raster.st_fromgdalraster(pg_catalog.bytea,pg_catalog.int4)",
    arguments: [nc3, defaultSqlArgument(nc5, "srid")] as const,
    result: nc0,
  });
  const rowFields288 = {
    idx: nc5,
    short_name: nc8,
    long_name: nc8,
    can_read: nc4,
    can_write: nc4,
    create_options: nc8,
  } as const;
  const member288 = createSqlFunction({
    ...base,
    name: "st_gdaldrivers",
    member: "routine:$extension:postgis_raster.st_gdaldrivers()",
    arguments: [] as const,
    result: nullableCodec(compositeCodec("routine:$extension:postgis_raster.st_gdaldrivers()", rowFields288)),
  });
  const rows288 = (alias: string, ...values: Parameters<typeof member288>) =>
    extensionRows(member288(...values), alias, rowFields288, "named");
  const member289 = createSqlFunction({
    ...base,
    name: "st_georeference",
    member: "routine:$extension:postgis_raster.st_georeference($extension:postgis_raster.raster,pg_catalog.text)",
    arguments: [nc0, defaultSqlArgument(nc8, "format")] as const,
    result: nc8,
  });
  const rowFields290 = { imag: nc6, jmag: nc6, theta_i: nc6, theta_ij: nc6, xoffset: nc6, yoffset: nc6 } as const;
  const member290 = createSqlFunction({
    ...base,
    name: "st_geotransform",
    member: "routine:$extension:postgis_raster.st_geotransform($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_geotransform($extension:postgis_raster.raster)",
        rowFields290,
      ),
    ),
  });
  const member291 = createSqlFunction({
    ...base,
    name: "st_grayscale",
    member: "routine:$extension:postgis_raster.st_grayscale($extension:postgis_raster._rastbandarg,pg_catalog.text)",
    arguments: [nc36, defaultSqlArgument(nc8, "extenttype")] as const,
    result: nc0,
  });
  const member292 = createSqlFunction({
    ...base,
    name: "st_grayscale",
    member:
      "routine:$extension:postgis_raster.st_grayscale($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "redband"),
      defaultSqlArgument(nc5, "greenband"),
      defaultSqlArgument(nc5, "blueband"),
      defaultSqlArgument(nc8, "extenttype"),
    ] as const,
    result: nc0,
  });
  const member293 = createSqlFunction({
    ...base,
    name: "st_hasnoband",
    member: "routine:$extension:postgis_raster.st_hasnoband($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, defaultSqlArgument(nc5, "nband")] as const,
    result: nc4,
  });
  const member294 = createSqlFunction({
    ...base,
    name: "st_height",
    member: "routine:$extension:postgis_raster.st_height($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc5,
  });
  const member295 = createSqlFunction({
    ...base,
    name: "st_hillshade",
    member:
      "routine:$extension:postgis_raster.st_hillshade($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    arguments: [
      nc0,
      nc5,
      nc0,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc6, "azimuth"),
      defaultSqlArgument(nc6, "altitude"),
      defaultSqlArgument(nc6, "max_bright"),
      defaultSqlArgument(nc6, "scale"),
      defaultSqlArgument(nc4, "interpolate_nodata"),
    ] as const,
    result: nc0,
  });
  const member296 = createSqlFunction({
    ...base,
    name: "st_hillshade",
    member:
      "routine:$extension:postgis_raster.st_hillshade($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc6, "azimuth"),
      defaultSqlArgument(nc6, "altitude"),
      defaultSqlArgument(nc6, "max_bright"),
      defaultSqlArgument(nc6, "scale"),
      defaultSqlArgument(nc4, "interpolate_nodata"),
    ] as const,
    result: nc0,
  });
  const rowFields297 = { min: nc6, max: nc6, count: nc15, percent: nc6 } as const;
  const member297 = createSqlFunction({
    ...base,
    name: "st_histogram",
    member:
      "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc4, "exclude_nodata_value"),
      defaultSqlArgument(nc5, "bins"),
      defaultSqlArgument(nc11, "width"),
      defaultSqlArgument(nc4, "right"),
    ] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
        rowFields297,
      ),
    ),
  });
  const rows297 = (alias: string, ...values: Parameters<typeof member297>) =>
    extensionRows(member297(...values), alias, rowFields297, "named");
  const rowFields298 = { min: nc6, max: nc6, count: nc15, percent: nc6 } as const;
  const member298 = createSqlFunction({
    ...base,
    name: "st_histogram",
    member:
      "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc4, nc5, nc4] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog.bool)",
        rowFields298,
      ),
    ),
  });
  const rows298 = (alias: string, ...values: Parameters<typeof member298>) =>
    extensionRows(member298(...values), alias, rowFields298, "named");
  const rowFields299 = { min: nc6, max: nc6, count: nc15, percent: nc6 } as const;
  const member299 = createSqlFunction({
    ...base,
    name: "st_histogram",
    member:
      "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
    arguments: [nc0, nc5, nc5, defaultSqlArgument(nc11, "width"), defaultSqlArgument(nc4, "right")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
        rowFields299,
      ),
    ),
  });
  const rows299 = (alias: string, ...values: Parameters<typeof member299>) =>
    extensionRows(member299(...values), alias, rowFields299, "named");
  const rowFields300 = { min: nc6, max: nc6, count: nc15, percent: nc6 } as const;
  const member300 = createSqlFunction({
    ...base,
    name: "st_histogram",
    member:
      "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc5, nc4] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
        rowFields300,
      ),
    ),
  });
  const rows300 = (alias: string, ...values: Parameters<typeof member300>) =>
    extensionRows(member300(...values), alias, rowFields300, "named");
  const member301 = createSqlFunction({
    ...base,
    name: "st_interpolateraster",
    member:
      "routine:$extension:postgis_raster.st_interpolateraster($extension:postgis.geometry,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc2, nc8, nc0, defaultSqlArgument(nc5, "bandnumber")] as const,
    result: nc0,
  });
  const member302 = createSqlFunction({
    ...base,
    name: "st_intersection",
    member:
      "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog._float8)",
    arguments: [nc0, nc0, nc11] as const,
    result: nc0,
  });
  const member303 = createSqlFunction({
    ...base,
    name: "st_intersection",
    member:
      "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)",
    arguments: [nc0, nc0, nc6] as const,
    result: nc0,
  });
  const member304 = createSqlFunction({
    ...base,
    name: "st_intersection",
    member:
      "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog._float8)",
    arguments: [nc0, nc0, defaultSqlArgument(nc8, "returnband"), defaultSqlArgument(nc11, "nodataval")] as const,
    result: nc0,
  });
  const member305 = createSqlFunction({
    ...base,
    name: "st_intersection",
    member:
      "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc0, nc8, nc6] as const,
    result: nc0,
  });
  const member306 = createSqlFunction({
    ...base,
    name: "st_intersection",
    member:
      "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis.geometry)",
    arguments: [nc0, nc2] as const,
    result: nc24,
  });
  const member307 = createSqlFunction({
    ...base,
    name: "st_intersection",
    member:
      "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)",
    arguments: [nc0, nc5, nc0, nc5, nc11] as const,
    result: nc0,
  });
  const member308 = createSqlFunction({
    ...base,
    name: "st_intersection",
    member:
      "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    arguments: [nc0, nc5, nc0, nc5, nc6] as const,
    result: nc0,
  });
  const member309 = createSqlFunction({
    ...base,
    name: "st_intersection",
    member:
      "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog._float8)",
    arguments: [
      nc0,
      nc5,
      nc0,
      nc5,
      defaultSqlArgument(nc8, "returnband"),
      defaultSqlArgument(nc11, "nodataval"),
    ] as const,
    result: nc0,
  });
  const member310 = createSqlFunction({
    ...base,
    name: "st_intersection",
    member:
      "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc5, nc0, nc5, nc8, nc6] as const,
    result: nc0,
  });
  const member311 = createSqlFunction({
    ...base,
    name: "st_intersection",
    member:
      "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry)",
    arguments: [nc0, nc5, nc2] as const,
    result: nc24,
  });
  const member312 = createSqlFunction({
    ...base,
    name: "st_intersection",
    member:
      "routine:$extension:postgis_raster.st_intersection($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc2, nc0, defaultSqlArgument(nc5, "band")] as const,
    result: nc24,
  });
  const member313 = createSqlFunction({
    ...base,
    name: "st_intersectionfractions",
    member:
      "routine:$extension:postgis_raster.st_intersectionfractions($extension:postgis_raster.raster,$extension:postgis.geometry)",
    arguments: [nc0, nc2] as const,
    result: nc0,
  });
  const member314 = createSqlFunction({
    ...base,
    name: "st_intersects",
    member:
      "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member315 = createSqlFunction({
    ...base,
    name: "st_intersects",
    member:
      "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc0, nc2, defaultSqlArgument(nc5, "nband")] as const,
    result: nc4,
  });
  const member316 = createSqlFunction({
    ...base,
    name: "st_intersects",
    member:
      "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, nc5, nc0, nc5] as const,
    result: nc4,
  });
  const member317 = createSqlFunction({
    ...base,
    name: "st_intersects",
    member:
      "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry)",
    arguments: [nc0, nc5, nc2] as const,
    result: nc4,
  });
  const member318 = createSqlFunction({
    ...base,
    name: "st_intersects",
    member:
      "routine:$extension:postgis_raster.st_intersects($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc2, nc0, defaultSqlArgument(nc5, "nband")] as const,
    result: nc4,
  });
  const member319 = createRasterVariadicFunction({
    ...base,
    name: "st_invdistweight4ma",
    member:
      "routine:$extension:postgis_raster.st_invdistweight4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    arguments: [nc11, nc14, defaultSqlArgument(nc13, "userargs")] as const,
    result: nc6,
  });
  const member320 = createSqlFunction({
    ...base,
    name: "st_iscoveragetile",
    member:
      "routine:$extension:postgis_raster.st_iscoveragetile($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc0, nc0, nc5, nc5] as const,
    result: nc4,
  });
  const member321 = createSqlFunction({
    ...base,
    name: "st_isempty",
    member: "routine:$extension:postgis_raster.st_isempty($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc4,
  });
  const member322 = createSqlFunction({
    ...base,
    name: "st_makeemptycoverage",
    member:
      "routine:$extension:postgis_raster.st_makeemptycoverage(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)",
    arguments: [nc5, nc5, nc5, nc5, nc6, nc6, nc6, nc6, nc6, nc6, defaultSqlArgument(nc5, "srid")] as const,
    result: nc0,
  });
  const member323 = createSqlFunction({
    ...base,
    name: "st_makeemptyraster",
    member: "routine:$extension:postgis_raster.st_makeemptyraster($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc0,
  });
  const member324 = createSqlFunction({
    ...base,
    name: "st_makeemptyraster",
    member:
      "routine:$extension:postgis_raster.st_makeemptyraster(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)",
    arguments: [nc5, nc5, nc6, nc6, nc6, nc6, nc6, nc6, defaultSqlArgument(nc5, "srid")] as const,
    result: nc0,
  });
  const member325 = createSqlFunction({
    ...base,
    name: "st_makeemptyraster",
    member:
      "routine:$extension:postgis_raster.st_makeemptyraster(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc5, nc5, nc6, nc6, nc6] as const,
    result: nc0,
  });
  const member326 = createRasterVariadicFunction({
    ...base,
    name: "st_mapalgebra",
    member:
      "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster._rastbandarg,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)",
    arguments: [
      nc36,
      nc16,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "extenttype"),
      defaultSqlArgument(nc0, "customextent"),
      defaultSqlArgument(nc5, "distancex"),
      defaultSqlArgument(nc5, "distancey"),
      defaultSqlArgument(nc13, "userargs"),
    ] as const,
    result: nc0,
  });
  const member327 = createSqlFunction({
    ...base,
    name: "st_mapalgebra",
    member:
      "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    arguments: [
      nc0,
      nc0,
      nc8,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "extenttype"),
      defaultSqlArgument(nc8, "nodata1expr"),
      defaultSqlArgument(nc8, "nodata2expr"),
      defaultSqlArgument(nc6, "nodatanodataval"),
    ] as const,
    result: nc0,
  });
  const member328 = createRasterVariadicFunction({
    ...base,
    name: "st_mapalgebra",
    member:
      "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)",
    arguments: [
      nc0,
      nc14,
      nc16,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "extenttype"),
      defaultSqlArgument(nc0, "customextent"),
      defaultSqlArgument(nc5, "distancex"),
      defaultSqlArgument(nc5, "distancey"),
      defaultSqlArgument(nc13, "userargs"),
    ] as const,
    result: nc0,
  });
  const member329 = createRasterVariadicFunction({
    ...base,
    name: "st_mapalgebra",
    member:
      "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)",
    arguments: [
      nc0,
      nc5,
      nc0,
      nc5,
      nc16,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "extenttype"),
      defaultSqlArgument(nc0, "customextent"),
      defaultSqlArgument(nc5, "distancex"),
      defaultSqlArgument(nc5, "distancey"),
      defaultSqlArgument(nc13, "userargs"),
    ] as const,
    result: nc0,
  });
  const member330 = createSqlFunction({
    ...base,
    name: "st_mapalgebra",
    member:
      "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    arguments: [
      nc0,
      nc5,
      nc0,
      nc5,
      nc8,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "extenttype"),
      defaultSqlArgument(nc8, "nodata1expr"),
      defaultSqlArgument(nc8, "nodata2expr"),
      defaultSqlArgument(nc6, "nodatanodataval"),
    ] as const,
    result: nc0,
  });
  const member331 = createRasterVariadicFunction({
    ...base,
    name: "st_mapalgebra",
    member:
      "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog._float8,pg_catalog.bool,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog._text)",
    arguments: [
      nc0,
      nc5,
      nc16,
      nc11,
      nc4,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "extenttype"),
      defaultSqlArgument(nc0, "customextent"),
      defaultSqlArgument(nc13, "userargs"),
    ] as const,
    result: nc0,
  });
  const member332 = createRasterVariadicFunction({
    ...base,
    name: "st_mapalgebra",
    member:
      "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)",
    arguments: [
      nc0,
      nc5,
      nc16,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "extenttype"),
      defaultSqlArgument(nc0, "customextent"),
      defaultSqlArgument(nc5, "distancex"),
      defaultSqlArgument(nc5, "distancey"),
      defaultSqlArgument(nc13, "userargs"),
    ] as const,
    result: nc0,
  });
  const member333 = createSqlFunction({
    ...base,
    name: "st_mapalgebra",
    member:
      "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc5, nc8, nc8, defaultSqlArgument(nc6, "nodataval")] as const,
    result: nc0,
  });
  const member334 = createSqlFunction({
    ...base,
    name: "st_mapalgebra",
    member:
      "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc8, nc8, defaultSqlArgument(nc6, "nodataval")] as const,
    result: nc0,
  });
  const member335 = createSqlFunction({
    ...base,
    name: "st_mapalgebraexpr",
    member:
      "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    arguments: [
      nc0,
      nc0,
      nc8,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "extenttype"),
      defaultSqlArgument(nc8, "nodata1expr"),
      defaultSqlArgument(nc8, "nodata2expr"),
      defaultSqlArgument(nc6, "nodatanodataval"),
    ] as const,
    result: nc0,
  });
  const member336 = createSqlFunction({
    ...base,
    name: "st_mapalgebraexpr",
    member:
      "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    arguments: [
      nc0,
      nc5,
      nc0,
      nc5,
      nc8,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "extenttype"),
      defaultSqlArgument(nc8, "nodata1expr"),
      defaultSqlArgument(nc8, "nodata2expr"),
      defaultSqlArgument(nc6, "nodatanodataval"),
    ] as const,
    result: nc0,
  });
  const member337 = createSqlFunction({
    ...base,
    name: "st_mapalgebraexpr",
    member:
      "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc5, nc8, nc8, defaultSqlArgument(nc6, "nodataval")] as const,
    result: nc0,
  });
  const member338 = createSqlFunction({
    ...base,
    name: "st_mapalgebraexpr",
    member:
      "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc8, nc8, defaultSqlArgument(nc6, "nodataval")] as const,
    result: nc0,
  });
  const member339 = createRasterVariadicFunction({
    ...base,
    name: "st_mapalgebrafct",
    member:
      "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,pg_catalog._text)",
    arguments: [
      nc0,
      nc0,
      nc16,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "extenttype"),
      defaultSqlArgument(nc13, "userargs"),
    ] as const,
    result: nc0,
  });
  const member340 = createRasterVariadicFunction({
    ...base,
    name: "st_mapalgebrafct",
    member:
      "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,pg_catalog._text)",
    arguments: [
      nc0,
      nc5,
      nc0,
      nc5,
      nc16,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "extenttype"),
      defaultSqlArgument(nc13, "userargs"),
    ] as const,
    result: nc0,
  });
  const member341 = createRasterVariadicFunction({
    ...base,
    name: "st_mapalgebrafct",
    member:
      "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog._text)",
    arguments: [nc0, nc5, nc16, nc13] as const,
    result: nc0,
  });
  const member342 = createSqlFunction({
    ...base,
    name: "st_mapalgebrafct",
    member:
      "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure)",
    arguments: [nc0, nc5, nc16] as const,
    result: nc0,
  });
  const member343 = createRasterVariadicFunction({
    ...base,
    name: "st_mapalgebrafct",
    member:
      "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.regprocedure,pg_catalog._text)",
    arguments: [nc0, nc5, nc8, nc16, nc13] as const,
    result: nc0,
  });
  const member344 = createSqlFunction({
    ...base,
    name: "st_mapalgebrafct",
    member:
      "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.regprocedure)",
    arguments: [nc0, nc5, nc8, nc16] as const,
    result: nc0,
  });
  const member345 = createRasterVariadicFunction({
    ...base,
    name: "st_mapalgebrafct",
    member:
      "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.regprocedure,pg_catalog._text)",
    arguments: [nc0, nc16, nc13] as const,
    result: nc0,
  });
  const member346 = createSqlFunction({
    ...base,
    name: "st_mapalgebrafct",
    member:
      "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.regprocedure)",
    arguments: [nc0, nc16] as const,
    result: nc0,
  });
  const member347 = createRasterVariadicFunction({
    ...base,
    name: "st_mapalgebrafct",
    member:
      "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.regprocedure,pg_catalog._text)",
    arguments: [nc0, nc8, nc16, nc13] as const,
    result: nc0,
  });
  const member348 = createSqlFunction({
    ...base,
    name: "st_mapalgebrafct",
    member:
      "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.regprocedure)",
    arguments: [nc0, nc8, nc16] as const,
    result: nc0,
  });
  const member349 = createRasterVariadicFunction({
    ...base,
    name: "st_mapalgebrafctngb",
    member:
      "routine:$extension:postgis_raster.st_mapalgebrafctngb($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog._text)",
    arguments: [nc0, nc5, nc8, nc5, nc5, nc16, nc8, nc13] as const,
    result: nc0,
  });
  const member350 = createRasterVariadicFunction({
    ...base,
    name: "st_max4ma",
    member: "routine:$extension:postgis_raster.st_max4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    arguments: [nc11, nc14, defaultSqlArgument(nc13, "userargs")] as const,
    result: nc6,
  });
  const member351 = createRasterVariadicFunction({
    ...base,
    name: "st_max4ma",
    member: "routine:$extension:postgis_raster.st_max4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)",
    arguments: [nc11, nc8, nc13] as const,
    result: nc6,
  });
  const member352 = createRasterVariadicFunction({
    ...base,
    name: "st_mean4ma",
    member: "routine:$extension:postgis_raster.st_mean4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    arguments: [nc11, nc14, defaultSqlArgument(nc13, "userargs")] as const,
    result: nc6,
  });
  const member353 = createRasterVariadicFunction({
    ...base,
    name: "st_mean4ma",
    member: "routine:$extension:postgis_raster.st_mean4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)",
    arguments: [nc11, nc8, nc13] as const,
    result: nc6,
  });
  const member354 = createSqlFunction({
    ...base,
    name: "st_memsize",
    member: "routine:$extension:postgis_raster.st_memsize($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc5,
  });
  const rowFields355 = {
    upperleftx: nc6,
    upperlefty: nc6,
    width: nc5,
    height: nc5,
    scalex: nc6,
    scaley: nc6,
    skewx: nc6,
    skewy: nc6,
    srid: nc5,
    numbands: nc5,
  } as const;
  const member355 = createSqlFunction({
    ...base,
    name: "st_metadata",
    member: "routine:$extension:postgis_raster.st_metadata($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nullableCodec(
      compositeCodec("routine:$extension:postgis_raster.st_metadata($extension:postgis_raster.raster)", rowFields355),
    ),
  });
  const member356 = createRasterVariadicFunction({
    ...base,
    name: "st_min4ma",
    member: "routine:$extension:postgis_raster.st_min4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    arguments: [nc11, nc14, defaultSqlArgument(nc13, "userargs")] as const,
    result: nc6,
  });
  const member357 = createRasterVariadicFunction({
    ...base,
    name: "st_min4ma",
    member: "routine:$extension:postgis_raster.st_min4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)",
    arguments: [nc11, nc8, nc13] as const,
    result: nc6,
  });
  const member358 = createSqlFunction({
    ...base,
    name: "st_minconvexhull",
    member: "routine:$extension:postgis_raster.st_minconvexhull($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, defaultSqlArgument(nc5, "nband")] as const,
    result: nc2,
  });
  const member359 = createRasterVariadicFunction({
    ...base,
    name: "st_mindist4ma",
    member: "routine:$extension:postgis_raster.st_mindist4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    arguments: [nc11, nc14, defaultSqlArgument(nc13, "userargs")] as const,
    result: nc6,
  });
  const member360 = createSqlFunction({
    ...base,
    name: "st_minpossiblevalue",
    member: "routine:$extension:postgis_raster.st_minpossiblevalue(pg_catalog.text)",
    arguments: [nc8] as const,
    result: nc6,
  });
  const member361 = createSqlFunction({
    ...base,
    name: "st_nearestvalue",
    member:
      "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)",
    arguments: [nc0, nc2, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc6,
  });
  const member362 = createSqlFunction({
    ...base,
    name: "st_nearestvalue",
    member:
      "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool)",
    arguments: [nc0, nc5, nc2, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc6,
  });
  const member363 = createSqlFunction({
    ...base,
    name: "st_nearestvalue",
    member:
      "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc5, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc6,
  });
  const member364 = createSqlFunction({
    ...base,
    name: "st_nearestvalue",
    member:
      "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc5, nc5, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc6,
  });
  const member365 = createSqlFunction({
    ...base,
    name: "st_neighborhood",
    member:
      "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc2, nc5, nc5, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc11,
  });
  const member366 = createSqlFunction({
    ...base,
    name: "st_neighborhood",
    member:
      "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc2, nc5, nc5, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc11,
  });
  const member367 = createSqlFunction({
    ...base,
    name: "st_neighborhood",
    member:
      "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc5, nc5, nc5, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc11,
  });
  const member368 = createSqlFunction({
    ...base,
    name: "st_neighborhood",
    member:
      "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc5, nc5, nc5, nc5, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc11,
  });
  const member369 = createSqlFunction({
    ...base,
    name: "st_notsamealignmentreason",
    member:
      "routine:$extension:postgis_raster.st_notsamealignmentreason($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc8,
  });
  const member370 = createSqlFunction({
    ...base,
    name: "st_numbands",
    member: "routine:$extension:postgis_raster.st_numbands($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc5,
  });
  const member371 = createSqlFunction({
    ...base,
    name: "st_overlaps",
    member:
      "routine:$extension:postgis_raster.st_overlaps($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member372 = createSqlFunction({
    ...base,
    name: "st_overlaps",
    member:
      "routine:$extension:postgis_raster.st_overlaps($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, nc5, nc0, nc5] as const,
    result: nc4,
  });
  const member373 = createSqlFunction({
    ...base,
    name: "st_pixelascentroid",
    member:
      "routine:$extension:postgis_raster.st_pixelascentroid($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc0, nc5, nc5] as const,
    result: nc2,
  });
  const rowFields374 = { geom: nc2, val: nc6, x: nc5, y: nc5 } as const;
  const member374 = createSqlFunction({
    ...base,
    name: "st_pixelascentroids",
    member:
      "routine:$extension:postgis_raster.st_pixelascentroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, defaultSqlArgument(nc5, "band"), defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_pixelascentroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
        rowFields374,
      ),
    ),
  });
  const rows374 = (alias: string, ...values: Parameters<typeof member374>) =>
    extensionRows(member374(...values), alias, rowFields374, "named");
  const member375 = createSqlFunction({
    ...base,
    name: "st_pixelaspoint",
    member:
      "routine:$extension:postgis_raster.st_pixelaspoint($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc0, nc5, nc5] as const,
    result: nc2,
  });
  const rowFields376 = { geom: nc2, val: nc6, x: nc5, y: nc5 } as const;
  const member376 = createSqlFunction({
    ...base,
    name: "st_pixelaspoints",
    member:
      "routine:$extension:postgis_raster.st_pixelaspoints($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, defaultSqlArgument(nc5, "band"), defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_pixelaspoints($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
        rowFields376,
      ),
    ),
  });
  const rows376 = (alias: string, ...values: Parameters<typeof member376>) =>
    extensionRows(member376(...values), alias, rowFields376, "named");
  const member377 = createSqlFunction({
    ...base,
    name: "st_pixelaspolygon",
    member:
      "routine:$extension:postgis_raster.st_pixelaspolygon($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc0, nc5, nc5] as const,
    result: nc2,
  });
  const rowFields378 = { geom: nc2, val: nc6, x: nc5, y: nc5 } as const;
  const member378 = createSqlFunction({
    ...base,
    name: "st_pixelaspolygons",
    member:
      "routine:$extension:postgis_raster.st_pixelaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, defaultSqlArgument(nc5, "band"), defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_pixelaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
        rowFields378,
      ),
    ),
  });
  const rows378 = (alias: string, ...values: Parameters<typeof member378>) =>
    extensionRows(member378(...values), alias, rowFields378, "named");
  const member379 = createSqlFunction({
    ...base,
    name: "st_pixelheight",
    member: "routine:$extension:postgis_raster.st_pixelheight($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc6,
  });
  const rowFields380 = { val: nc6, x: nc5, y: nc5 } as const;
  const member380 = createSqlFunction({
    ...base,
    name: "st_pixelofvalue",
    member:
      "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.bool)",
    arguments: [nc0, nc11, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.bool)",
        rowFields380,
      ),
    ),
  });
  const rows380 = (alias: string, ...values: Parameters<typeof member380>) =>
    extensionRows(member380(...values), alias, rowFields380, "named");
  const rowFields381 = { x: nc5, y: nc5 } as const;
  const member381 = createSqlFunction({
    ...base,
    name: "st_pixelofvalue",
    member:
      "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc0, nc6, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.bool)",
        rowFields381,
      ),
    ),
  });
  const rows381 = (alias: string, ...values: Parameters<typeof member381>) =>
    extensionRows(member381(...values), alias, rowFields381, "named");
  const rowFields382 = { val: nc6, x: nc5, y: nc5 } as const;
  const member382 = createSqlFunction({
    ...base,
    name: "st_pixelofvalue",
    member:
      "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
    arguments: [nc0, nc5, nc11, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
        rowFields382,
      ),
    ),
  });
  const rows382 = (alias: string, ...values: Parameters<typeof member382>) =>
    extensionRows(member382(...values), alias, rowFields382, "named");
  const rowFields383 = { x: nc5, y: nc5 } as const;
  const member383 = createSqlFunction({
    ...base,
    name: "st_pixelofvalue",
    member:
      "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc0, nc5, nc6, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)",
        rowFields383,
      ),
    ),
  });
  const rows383 = (alias: string, ...values: Parameters<typeof member383>) =>
    extensionRows(member383(...values), alias, rowFields383, "named");
  const member384 = createSqlFunction({
    ...base,
    name: "st_pixelwidth",
    member: "routine:$extension:postgis_raster.st_pixelwidth($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc6,
  });
  const member385 = createSqlFunction({
    ...base,
    name: "st_polygon",
    member: "routine:$extension:postgis_raster.st_polygon($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, defaultSqlArgument(nc5, "band")] as const,
    result: nc2,
  });
  const rowFields386 = { quantile: nc6, value: nc6 } as const;
  const member386 = createSqlFunction({
    ...base,
    name: "st_quantile",
    member: "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog._float8)",
    arguments: [nc0, nc11] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog._float8)",
        rowFields386,
      ),
    ),
  });
  const rows386 = (alias: string, ...values: Parameters<typeof member386>) =>
    extensionRows(member386(...values), alias, rowFields386, "named");
  const member387 = createSqlFunction({
    ...base,
    name: "st_quantile",
    member:
      "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)",
    arguments: [nc0, nc4, defaultSqlArgument(nc6, "quantile")] as const,
    result: nc6,
  });
  const member388 = createSqlFunction({
    ...base,
    name: "st_quantile",
    member: "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.float8)",
    arguments: [nc0, nc6] as const,
    result: nc6,
  });
  const rowFields389 = { quantile: nc6, value: nc6 } as const;
  const member389 = createSqlFunction({
    ...base,
    name: "st_quantile",
    member:
      "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)",
    arguments: [nc0, nc5, nc11] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)",
        rowFields389,
      ),
    ),
  });
  const rows389 = (alias: string, ...values: Parameters<typeof member389>) =>
    extensionRows(member389(...values), alias, rowFields389, "named");
  const rowFields390 = { quantile: nc6, value: nc6 } as const;
  const member390 = createSqlFunction({
    ...base,
    name: "st_quantile",
    member:
      "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc4, "exclude_nodata_value"),
      defaultSqlArgument(nc11, "quantiles"),
    ] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8)",
        rowFields390,
      ),
    ),
  });
  const rows390 = (alias: string, ...values: Parameters<typeof member390>) =>
    extensionRows(member390(...values), alias, rowFields390, "named");
  const member391 = createSqlFunction({
    ...base,
    name: "st_quantile",
    member:
      "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    arguments: [nc0, nc5, nc4, nc6] as const,
    result: nc6,
  });
  const member392 = createSqlFunction({
    ...base,
    name: "st_quantile",
    member:
      "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    arguments: [nc0, nc5, nc6] as const,
    result: nc6,
  });
  const member393 = createRasterVariadicFunction({
    ...base,
    name: "st_range4ma",
    member: "routine:$extension:postgis_raster.st_range4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    arguments: [nc11, nc14, defaultSqlArgument(nc13, "userargs")] as const,
    result: nc6,
  });
  const member394 = createRasterVariadicFunction({
    ...base,
    name: "st_range4ma",
    member: "routine:$extension:postgis_raster.st_range4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)",
    arguments: [nc11, nc8, nc13] as const,
    result: nc6,
  });
  const rowFields395 = { longitude: nc6, latitude: nc6 } as const;
  const member395 = createSqlFunction({
    ...base,
    name: "st_rastertoworldcoord",
    member:
      "routine:$extension:postgis_raster.st_rastertoworldcoord($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc0, nc5, nc5] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_rastertoworldcoord($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
        rowFields395,
      ),
    ),
  });
  const member396 = createSqlFunction({
    ...base,
    name: "st_rastertoworldcoordx",
    member:
      "routine:$extension:postgis_raster.st_rastertoworldcoordx($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc0, nc5, nc5] as const,
    result: nc6,
  });
  const member397 = createSqlFunction({
    ...base,
    name: "st_rastertoworldcoordx",
    member:
      "routine:$extension:postgis_raster.st_rastertoworldcoordx($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, nc5] as const,
    result: nc6,
  });
  const member398 = createSqlFunction({
    ...base,
    name: "st_rastertoworldcoordy",
    member:
      "routine:$extension:postgis_raster.st_rastertoworldcoordy($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc0, nc5, nc5] as const,
    result: nc6,
  });
  const member399 = createSqlFunction({
    ...base,
    name: "st_rastertoworldcoordy",
    member:
      "routine:$extension:postgis_raster.st_rastertoworldcoordy($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, nc5] as const,
    result: nc6,
  });
  const member400 = createSqlFunction({
    ...base,
    name: "st_rastfromhexwkb",
    member: "routine:$extension:postgis_raster.st_rastfromhexwkb(pg_catalog.text)",
    arguments: [nc8] as const,
    result: nc0,
  });
  const member401 = createSqlFunction({
    ...base,
    name: "st_rastfromwkb",
    member: "routine:$extension:postgis_raster.st_rastfromwkb(pg_catalog.bytea)",
    arguments: [nc3] as const,
    result: nc0,
  });
  const member402 = createRasterVariadicFunction({
    ...base,
    name: "st_reclass",
    member:
      "routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,$extension:postgis_raster._reclassarg)",
    arguments: [nc0, nc39] as const,
    result: nc0,
  });
  const member403 = createSqlFunction({
    ...base,
    name: "st_reclass",
    member:
      "routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc5, nc8, nc8, defaultSqlArgument(nc6, "nodataval")] as const,
    result: nc0,
  });
  const member404 = createSqlFunction({
    ...base,
    name: "st_reclass",
    member:
      "routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)",
    arguments: [nc0, nc8, nc8] as const,
    result: nc0,
  });
  const member405 = createSqlFunction({
    ...base,
    name: "st_reclassexact",
    member:
      "routine:$extension:postgis_raster.st_reclassexact($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog._float8,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)",
    arguments: [
      nc0,
      nc11,
      nc11,
      defaultSqlArgument(nc5, "bandnumber"),
      defaultSqlArgument(nc8, "outputpixeltype"),
      defaultSqlArgument(nc6, "nodatavalue"),
    ] as const,
    result: nc0,
  });
  const nativeMember406 = createSqlFunction({
    ...base,
    name: "st_resample",
    member:
      "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc0, nc4, nc8, nc6] as const,
    result: nc0,
  });
  // Positional calls distinguish the captured bool-first and text-first signatures.
  const member406: PostgisRasterOverloads["routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.text,pg_catalog.float8)"] =
    (rast, ref, usescale, algorithm, maxerr) =>
      nativeMember406(
        rast,
        ref,
        usescale,
        algorithm === undefined ? sql<string>`'NearestNeighbour'::text` : algorithm,
        maxerr === undefined ? sql<number>`0.125` : maxerr,
      );
  const nativeMember407 = createSqlFunction({
    ...base,
    name: "st_resample",
    member:
      "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc0, nc0, nc8, nc6, nc4] as const,
    result: nc0,
  });
  // Positional calls distinguish the captured bool-first and text-first signatures.
  const member407: PostgisRasterOverloads["routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)"] =
    (rast, ref, algorithm, maxerr, usescale) =>
      nativeMember407(
        rast,
        ref,
        algorithm === undefined ? sql<string>`'NearestNeighbour'::text` : algorithm,
        maxerr === undefined ? sql<number>`0.125` : maxerr,
        usescale === undefined ? sql<boolean>`true` : usescale,
      );
  const member408 = createSqlFunction({
    ...base,
    name: "st_resample",
    member:
      "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    arguments: [
      nc0,
      defaultSqlArgument(nc6, "scalex"),
      defaultSqlArgument(nc6, "scaley"),
      defaultSqlArgument(nc6, "gridx"),
      defaultSqlArgument(nc6, "gridy"),
      defaultSqlArgument(nc6, "skewx"),
      defaultSqlArgument(nc6, "skewy"),
      defaultSqlArgument(nc8, "algorithm"),
      defaultSqlArgument(nc6, "maxerr"),
    ] as const,
    result: nc0,
  });
  const member409 = createSqlFunction({
    ...base,
    name: "st_resample",
    member:
      "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    arguments: [
      nc0,
      nc5,
      nc5,
      defaultSqlArgument(nc6, "gridx"),
      defaultSqlArgument(nc6, "gridy"),
      defaultSqlArgument(nc6, "skewx"),
      defaultSqlArgument(nc6, "skewy"),
      defaultSqlArgument(nc8, "algorithm"),
      defaultSqlArgument(nc6, "maxerr"),
    ] as const,
    result: nc0,
  });
  const member410 = createSqlFunction({
    ...base,
    name: "st_rescale",
    member:
      "routine:$extension:postgis_raster.st_rescale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc6, nc6, defaultSqlArgument(nc8, "algorithm"), defaultSqlArgument(nc6, "maxerr")] as const,
    result: nc0,
  });
  const member411 = createSqlFunction({
    ...base,
    name: "st_rescale",
    member:
      "routine:$extension:postgis_raster.st_rescale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc6, defaultSqlArgument(nc8, "algorithm"), defaultSqlArgument(nc6, "maxerr")] as const,
    result: nc0,
  });
  const member412 = createSqlFunction({
    ...base,
    name: "st_resize",
    member:
      "routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc6, nc6, defaultSqlArgument(nc8, "algorithm"), defaultSqlArgument(nc6, "maxerr")] as const,
    result: nc0,
  });
  const member413 = createSqlFunction({
    ...base,
    name: "st_resize",
    member:
      "routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc5, nc5, defaultSqlArgument(nc8, "algorithm"), defaultSqlArgument(nc6, "maxerr")] as const,
    result: nc0,
  });
  const member414 = createSqlFunction({
    ...base,
    name: "st_resize",
    member:
      "routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc8, nc8, defaultSqlArgument(nc8, "algorithm"), defaultSqlArgument(nc6, "maxerr")] as const,
    result: nc0,
  });
  const member415 = createSqlFunction({
    ...base,
    name: "st_reskew",
    member:
      "routine:$extension:postgis_raster.st_reskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc6, nc6, defaultSqlArgument(nc8, "algorithm"), defaultSqlArgument(nc6, "maxerr")] as const,
    result: nc0,
  });
  const member416 = createSqlFunction({
    ...base,
    name: "st_reskew",
    member:
      "routine:$extension:postgis_raster.st_reskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc6, defaultSqlArgument(nc8, "algorithm"), defaultSqlArgument(nc6, "maxerr")] as const,
    result: nc0,
  });
  const member418 = createSqlFunction({
    ...base,
    name: "st_rotation",
    member: "routine:$extension:postgis_raster.st_rotation($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc6,
  });
  const member419 = createSqlFunction({
    ...base,
    name: "st_roughness",
    member:
      "routine:$extension:postgis_raster.st_roughness($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)",
    arguments: [
      nc0,
      nc5,
      nc0,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc4, "interpolate_nodata"),
    ] as const,
    result: nc0,
  });
  const member420 = createSqlFunction({
    ...base,
    name: "st_roughness",
    member:
      "routine:$extension:postgis_raster.st_roughness($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc4, "interpolate_nodata"),
    ] as const,
    result: nc0,
  });
  const member421 = createSqlFunction({
    ...base,
    name: "st_samealignment",
    member:
      "routine:$extension:postgis_raster.st_samealignment($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member422 = createSqlAggregate({
    ...base,
    name: "st_samealignment",
    member: "routine:$extension:postgis_raster.st_samealignment($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc4,
  });
  const member423 = createSqlFunction({
    ...base,
    name: "st_samealignment",
    member:
      "routine:$extension:postgis_raster.st_samealignment(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc6, nc6, nc6, nc6, nc6, nc6, nc6, nc6, nc6, nc6, nc6, nc6] as const,
    result: nc4,
  });
  const member424 = createSqlFunction({
    ...base,
    name: "st_scalex",
    member: "routine:$extension:postgis_raster.st_scalex($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc6,
  });
  const member425 = createSqlFunction({
    ...base,
    name: "st_scaley",
    member: "routine:$extension:postgis_raster.st_scaley($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc6,
  });
  const member426 = createSqlFunction({
    ...base,
    name: "st_setbandindex",
    member:
      "routine:$extension:postgis_raster.st_setbandindex($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc5, defaultSqlArgument(nc4, "force")] as const,
    result: nc0,
  });
  const member427 = createSqlFunction({
    ...base,
    name: "st_setbandisnodata",
    member: "routine:$extension:postgis_raster.st_setbandisnodata($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, defaultSqlArgument(nc5, "band")] as const,
    result: nc0,
  });
  const member428 = createSqlFunction({
    ...base,
    name: "st_setbandnodatavalue",
    member:
      "routine:$extension:postgis_raster.st_setbandnodatavalue($extension:postgis_raster.raster,pg_catalog.float8)",
    arguments: [nc0, nc6] as const,
    result: nc0,
  });
  const member429 = createSqlFunction({
    ...base,
    name: "st_setbandnodatavalue",
    member:
      "routine:$extension:postgis_raster.st_setbandnodatavalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc0, nc5, nc6, defaultSqlArgument(nc4, "forcechecking")] as const,
    result: nc0,
  });
  const member430 = createSqlFunction({
    ...base,
    name: "st_setbandpath",
    member:
      "routine:$extension:postgis_raster.st_setbandpath($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc8, nc5, defaultSqlArgument(nc4, "force")] as const,
    result: nc0,
  });
  const member431 = createSqlFunction({
    ...base,
    name: "st_setgeoreference",
    member:
      "routine:$extension:postgis_raster.st_setgeoreference($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc6, nc6, nc6, nc6, nc6, nc6] as const,
    result: nc0,
  });
  const member432 = createSqlFunction({
    ...base,
    name: "st_setgeoreference",
    member:
      "routine:$extension:postgis_raster.st_setgeoreference($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)",
    arguments: [nc0, nc8, defaultSqlArgument(nc8, "format")] as const,
    result: nc0,
  });
  const unsafeMember433 = createSqlFunction({
    ...base,
    name: "st_setgeotransform",
    member:
      "routine:$extension:postgis_raster.st_setgeotransform($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc6, nc6, nc6, nc6, nc6, nc6] as const,
    result: nc0,
  });
  // Preserve the complete captured signature. Even caught rejection invalidates nativequery ownership.
  const member433: typeof unsafeMember433 = () =>
    decodeFailure(() => {
      throw new PostgisRasterNativeSafetyError();
    });
  const member434 = createSqlFunction({
    ...base,
    name: "st_setm",
    member:
      "routine:$extension:postgis_raster.st_setm($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)",
    arguments: [nc0, nc2, defaultSqlArgument(nc8, "resample"), defaultSqlArgument(nc5, "band")] as const,
    result: nc2,
  });
  const member435 = createSqlFunction({
    ...base,
    name: "st_setrotation",
    member: "routine:$extension:postgis_raster.st_setrotation($extension:postgis_raster.raster,pg_catalog.float8)",
    arguments: [nc0, nc6] as const,
    result: nc0,
  });
  const member436 = createSqlFunction({
    ...base,
    name: "st_setscale",
    member:
      "routine:$extension:postgis_raster.st_setscale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc6, nc6] as const,
    result: nc0,
  });
  const member437 = createSqlFunction({
    ...base,
    name: "st_setscale",
    member: "routine:$extension:postgis_raster.st_setscale($extension:postgis_raster.raster,pg_catalog.float8)",
    arguments: [nc0, nc6] as const,
    result: nc0,
  });
  const member438 = createSqlFunction({
    ...base,
    name: "st_setskew",
    member:
      "routine:$extension:postgis_raster.st_setskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc6, nc6] as const,
    result: nc0,
  });
  const member439 = createSqlFunction({
    ...base,
    name: "st_setskew",
    member: "routine:$extension:postgis_raster.st_setskew($extension:postgis_raster.raster,pg_catalog.float8)",
    arguments: [nc0, nc6] as const,
    result: nc0,
  });
  const member440 = createSqlFunction({
    ...base,
    name: "st_setsrid",
    member: "routine:$extension:postgis_raster.st_setsrid($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, nc5] as const,
    result: nc0,
  });
  const member441 = createSqlFunction({
    ...base,
    name: "st_setupperleft",
    member:
      "routine:$extension:postgis_raster.st_setupperleft($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc6, nc6] as const,
    result: nc0,
  });
  const member442 = createSqlFunction({
    ...base,
    name: "st_setvalue",
    member:
      "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc0, nc2, nc6] as const,
    result: nc0,
  });
  const member443 = createSqlFunction({
    ...base,
    name: "st_setvalue",
    member:
      "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc0, nc5, nc2, nc6] as const,
    result: nc0,
  });
  const member444 = createSqlFunction({
    ...base,
    name: "st_setvalue",
    member:
      "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)",
    arguments: [nc0, nc5, nc5, nc6] as const,
    result: nc0,
  });
  const member445 = createSqlFunction({
    ...base,
    name: "st_setvalue",
    member:
      "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)",
    arguments: [nc0, nc5, nc5, nc5, nc6] as const,
    result: nc0,
  });
  const member446 = createSqlFunction({
    ...base,
    name: "st_setvalues",
    member:
      "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster._geomval,pg_catalog.bool)",
    arguments: [nc0, nc5, nc35, defaultSqlArgument(nc4, "keepnodata")] as const,
    result: nc0,
  });
  const member447 = createSqlFunction({
    ...base,
    name: "st_setvalues",
    member:
      "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog._bool,pg_catalog.bool)",
    arguments: [
      nc0,
      nc5,
      nc5,
      nc5,
      nc11,
      defaultSqlArgument(nc12, "noset"),
      defaultSqlArgument(nc4, "keepnodata"),
    ] as const,
    result: nc0,
  });
  const member448 = createSqlFunction({
    ...base,
    name: "st_setvalues",
    member:
      "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc0, nc5, nc5, nc5, nc11, nc6, defaultSqlArgument(nc4, "keepnodata")] as const,
    result: nc0,
  });
  const member449 = createSqlFunction({
    ...base,
    name: "st_setvalues",
    member:
      "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc0, nc5, nc5, nc5, nc5, nc6, defaultSqlArgument(nc4, "keepnodata")] as const,
    result: nc0,
  });
  const member450 = createSqlFunction({
    ...base,
    name: "st_setvalues",
    member:
      "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc0, nc5, nc5, nc5, nc5, nc5, nc6, defaultSqlArgument(nc4, "keepnodata")] as const,
    result: nc0,
  });
  const member451 = createSqlFunction({
    ...base,
    name: "st_setz",
    member:
      "routine:$extension:postgis_raster.st_setz($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)",
    arguments: [nc0, nc2, defaultSqlArgument(nc8, "resample"), defaultSqlArgument(nc5, "band")] as const,
    result: nc2,
  });
  const member452 = createSqlFunction({
    ...base,
    name: "st_skewx",
    member: "routine:$extension:postgis_raster.st_skewx($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc6,
  });
  const member453 = createSqlFunction({
    ...base,
    name: "st_skewy",
    member: "routine:$extension:postgis_raster.st_skewy($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc6,
  });
  const member454 = createSqlFunction({
    ...base,
    name: "st_slope",
    member:
      "routine:$extension:postgis_raster.st_slope($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)",
    arguments: [
      nc0,
      nc5,
      nc0,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "units"),
      defaultSqlArgument(nc6, "scale"),
      defaultSqlArgument(nc4, "interpolate_nodata"),
    ] as const,
    result: nc0,
  });
  const member455 = createSqlFunction({
    ...base,
    name: "st_slope",
    member:
      "routine:$extension:postgis_raster.st_slope($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc8, "units"),
      defaultSqlArgument(nc6, "scale"),
      defaultSqlArgument(nc4, "interpolate_nodata"),
    ] as const,
    result: nc0,
  });
  const member456 = createSqlFunction({
    ...base,
    name: "st_snaptogrid",
    member:
      "routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    arguments: [
      nc0,
      nc6,
      nc6,
      nc6,
      nc6,
      defaultSqlArgument(nc8, "algorithm"),
      defaultSqlArgument(nc6, "maxerr"),
    ] as const,
    result: nc0,
  });
  const member457 = createSqlFunction({
    ...base,
    name: "st_snaptogrid",
    member:
      "routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc6, nc6, nc6, defaultSqlArgument(nc8, "algorithm"), defaultSqlArgument(nc6, "maxerr")] as const,
    result: nc0,
  });
  const nativeMember458 = createSqlFunction({
    ...base,
    name: "st_snaptogrid",
    member:
      "routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc6, nc6, nc8, nc6, nc6, nc6] as const,
    result: nc0,
  });
  // Positional optional arguments retain the exact captured overload.
  const member458: PostgisRasterOverloads["routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"] =
    (rast, gridx, gridy, algorithm, maxerr, scalex, scaley) =>
      nativeMember458(
        rast,
        gridx,
        gridy,
        algorithm === undefined ? sql<string>`'NearestNeighbour'::text` : algorithm,
        maxerr === undefined ? sql<number>`0.125` : maxerr,
        scalex === undefined ? sql<number>`0` : scalex,
        scaley === undefined ? sql<number>`0` : scaley,
      );
  const member459 = createSqlFunction({
    ...base,
    name: "st_srid",
    member: "routine:$extension:postgis_raster.st_srid($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc5,
  });
  const member460 = createRasterVariadicFunction({
    ...base,
    name: "st_stddev4ma",
    member: "routine:$extension:postgis_raster.st_stddev4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    arguments: [nc11, nc14, defaultSqlArgument(nc13, "userargs")] as const,
    result: nc6,
  });
  const member461 = createRasterVariadicFunction({
    ...base,
    name: "st_stddev4ma",
    member: "routine:$extension:postgis_raster.st_stddev4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)",
    arguments: [nc11, nc8, nc13] as const,
    result: nc6,
  });
  const member462 = createRasterVariadicFunction({
    ...base,
    name: "st_sum4ma",
    member: "routine:$extension:postgis_raster.st_sum4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    arguments: [nc11, nc14, defaultSqlArgument(nc13, "userargs")] as const,
    result: nc6,
  });
  const member463 = createRasterVariadicFunction({
    ...base,
    name: "st_sum4ma",
    member: "routine:$extension:postgis_raster.st_sum4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)",
    arguments: [nc11, nc8, nc13] as const,
    result: nc6,
  });
  const member464 = createSqlFunction({
    ...base,
    name: "st_summary",
    member: "routine:$extension:postgis_raster.st_summary($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc8,
  });
  const member465 = createSqlFunction({
    ...base,
    name: "st_summarystats",
    member: "routine:$extension:postgis_raster.st_summarystats($extension:postgis_raster.raster,pg_catalog.bool)",
    arguments: [nc0, nc4] as const,
    result: nc29,
  });
  const member466 = createSqlFunction({
    ...base,
    name: "st_summarystats",
    member:
      "routine:$extension:postgis_raster.st_summarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, defaultSqlArgument(nc5, "nband"), defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc29,
  });
  const member467 = createSqlAggregate({
    ...base,
    name: "st_summarystatsagg",
    member:
      "routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)",
    arguments: [nc0, nc4, nc6] as const,
    result: nc29,
  });
  const member468 = createSqlAggregate({
    ...base,
    name: "st_summarystatsagg",
    member:
      "routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    arguments: [nc0, nc5, nc4, nc6] as const,
    result: nc29,
  });
  const member469 = createSqlAggregate({
    ...base,
    name: "st_summarystatsagg",
    member:
      "routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc4] as const,
    result: nc29,
  });
  const member470 = createSqlFunction({
    ...base,
    name: "st_tile",
    member:
      "routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    arguments: [
      nc0,
      nc14,
      nc5,
      nc5,
      defaultSqlArgument(nc4, "padwithnodata"),
      defaultSqlArgument(nc6, "nodataval"),
    ] as const,
    result: nc0,
  });
  const member471 = createSqlFunction({
    ...base,
    name: "st_tile",
    member:
      "routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    arguments: [nc0, nc5, nc5, defaultSqlArgument(nc4, "padwithnodata"), defaultSqlArgument(nc6, "nodataval")] as const,
    result: nc0,
  });
  const member472 = createSqlFunction({
    ...base,
    name: "st_tile",
    member:
      "routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    arguments: [
      nc0,
      nc5,
      nc5,
      nc5,
      defaultSqlArgument(nc4, "padwithnodata"),
      defaultSqlArgument(nc6, "nodataval"),
    ] as const,
    result: nc0,
  });
  const member473 = createSqlFunction({
    ...base,
    name: "st_touches",
    member:
      "routine:$extension:postgis_raster.st_touches($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member474 = createSqlFunction({
    ...base,
    name: "st_touches",
    member:
      "routine:$extension:postgis_raster.st_touches($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, nc5, nc0, nc5] as const,
    result: nc4,
  });
  const member475 = createSqlFunction({
    ...base,
    name: "st_tpi",
    member:
      "routine:$extension:postgis_raster.st_tpi($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)",
    arguments: [
      nc0,
      nc5,
      nc0,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc4, "interpolate_nodata"),
    ] as const,
    result: nc0,
  });
  const member476 = createSqlFunction({
    ...base,
    name: "st_tpi",
    member:
      "routine:$extension:postgis_raster.st_tpi($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc4, "interpolate_nodata"),
    ] as const,
    result: nc0,
  });
  const member477 = createSqlFunction({
    ...base,
    name: "st_transform",
    member:
      "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc0, defaultSqlArgument(nc8, "algorithm"), defaultSqlArgument(nc6, "maxerr")] as const,
    result: nc0,
  });
  const member478 = createSqlFunction({
    ...base,
    name: "st_transform",
    member:
      "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc5, nc6, nc6, defaultSqlArgument(nc8, "algorithm"), defaultSqlArgument(nc6, "maxerr")] as const,
    result: nc0,
  });
  const member479 = createSqlFunction({
    ...base,
    name: "st_transform",
    member:
      "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc0, nc5, nc6, defaultSqlArgument(nc8, "algorithm"), defaultSqlArgument(nc6, "maxerr")] as const,
    result: nc0,
  });
  const nativeMember480 = createSqlFunction({
    ...base,
    name: "st_transform",
    member:
      "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc5, nc8, nc6, nc6, nc6] as const,
    result: nc0,
  });
  // Positional optional arguments retain the exact captured overload.
  const member480: PostgisRasterOverloads["routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"] =
    (rast, srid, algorithm, maxerr, scalex, scaley) =>
      nativeMember480(
        rast,
        srid,
        algorithm === undefined ? sql<string>`'NearestNeighbour'::text` : algorithm,
        maxerr === undefined ? sql<number>`0.125` : maxerr,
        scalex === undefined ? sql<number>`0` : scalex,
        scaley === undefined ? sql<number>`0` : scaley,
      );
  const member481 = createSqlFunction({
    ...base,
    name: "st_tri",
    member:
      "routine:$extension:postgis_raster.st_tri($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)",
    arguments: [
      nc0,
      nc5,
      nc0,
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc4, "interpolate_nodata"),
    ] as const,
    result: nc0,
  });
  const member482 = createSqlFunction({
    ...base,
    name: "st_tri",
    member:
      "routine:$extension:postgis_raster.st_tri($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc8, "pixeltype"),
      defaultSqlArgument(nc4, "interpolate_nodata"),
    ] as const,
    result: nc0,
  });
  const member483 = createSqlAggregate({
    ...base,
    name: "st_union",
    member:
      "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,$extension:postgis_raster._unionarg)",
    arguments: [nc0, nc41] as const,
    result: nc0,
  });
  const member484 = createSqlAggregate({
    ...base,
    name: "st_union",
    member:
      "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text)",
    arguments: [nc0, nc5, nc8] as const,
    result: nc0,
  });
  const member485 = createSqlAggregate({
    ...base,
    name: "st_union",
    member: "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, nc5] as const,
    result: nc0,
  });
  const member486 = createSqlAggregate({
    ...base,
    name: "st_union",
    member: "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.text)",
    arguments: [nc0, nc8] as const,
    result: nc0,
  });
  const member487 = createSqlAggregate({
    ...base,
    name: "st_union",
    member: "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc0,
  });
  const member488 = createSqlFunction({
    ...base,
    name: "st_upperleftx",
    member: "routine:$extension:postgis_raster.st_upperleftx($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc6,
  });
  const member489 = createSqlFunction({
    ...base,
    name: "st_upperlefty",
    member: "routine:$extension:postgis_raster.st_upperlefty($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc6,
  });
  const member490 = createSqlFunction({
    ...base,
    name: "st_value",
    member:
      "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)",
    arguments: [nc0, nc2, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc6,
  });
  const member491 = createSqlFunction({
    ...base,
    name: "st_value",
    member:
      "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.text)",
    arguments: [
      nc0,
      nc5,
      nc2,
      defaultSqlArgument(nc4, "exclude_nodata_value"),
      defaultSqlArgument(nc8, "resample"),
    ] as const,
    result: nc6,
  });
  const member492 = createSqlFunction({
    ...base,
    name: "st_value",
    member:
      "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc5, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc6,
  });
  const member493 = createSqlFunction({
    ...base,
    name: "st_value",
    member:
      "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc0, nc5, nc5, nc5, defaultSqlArgument(nc4, "exclude_nodata_value")] as const,
    result: nc6,
  });
  const rowFields494 = { value: nc6, count: nc5 } as const;
  const member494 = createSqlFunction({
    ...base,
    name: "st_valuecount",
    member:
      "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)",
    arguments: [nc0, nc11, defaultSqlArgument(nc6, "roundto")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)",
        rowFields494,
      ),
    ),
  });
  const rows494 = (alias: string, ...values: Parameters<typeof member494>) =>
    extensionRows(member494(...values), alias, rowFields494, "named");
  const member495 = createSqlFunction({
    ...base,
    name: "st_valuecount",
    member:
      "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc6, defaultSqlArgument(nc6, "roundto")] as const,
    result: nc5,
  });
  const rowFields496 = { value: nc6, count: nc5 } as const;
  const member496 = createSqlFunction({
    ...base,
    name: "st_valuecount",
    member:
      "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)",
    arguments: [nc0, nc5, nc11, defaultSqlArgument(nc6, "roundto")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)",
        rowFields496,
      ),
    ),
  });
  const rows496 = (alias: string, ...values: Parameters<typeof member496>) =>
    extensionRows(member496(...values), alias, rowFields496, "named");
  const rowFields497 = { value: nc6, count: nc5 } as const;
  const member497 = createSqlFunction({
    ...base,
    name: "st_valuecount",
    member:
      "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc4, "exclude_nodata_value"),
      defaultSqlArgument(nc11, "searchvalues"),
      defaultSqlArgument(nc6, "roundto"),
    ] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)",
        rowFields497,
      ),
    ),
  });
  const rows497 = (alias: string, ...values: Parameters<typeof member497>) =>
    extensionRows(member497(...values), alias, rowFields497, "named");
  const member498 = createSqlFunction({
    ...base,
    name: "st_valuecount",
    member:
      "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc5, nc4, nc6, defaultSqlArgument(nc6, "roundto")] as const,
    result: nc5,
  });
  const member499 = createSqlFunction({
    ...base,
    name: "st_valuecount",
    member:
      "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc5, nc6, defaultSqlArgument(nc6, "roundto")] as const,
    result: nc5,
  });
  const rowFields500 = { value: nc6, count: nc5 } as const;
  const member500 = createSqlFunction({
    ...base,
    name: "st_valuecount",
    member:
      "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)",
    arguments: [nc8, nc8, nc11, defaultSqlArgument(nc6, "roundto")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)",
        rowFields500,
      ),
    ),
  });
  const rows500 = (alias: string, ...values: Parameters<typeof member500>) =>
    extensionRows(member500(...values), alias, rowFields500, "named");
  const member501 = createSqlFunction({
    ...base,
    name: "st_valuecount",
    member:
      "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc8, nc8, nc6, defaultSqlArgument(nc6, "roundto")] as const,
    result: nc5,
  });
  const rowFields502 = { value: nc6, count: nc5 } as const;
  const member502 = createSqlFunction({
    ...base,
    name: "st_valuecount",
    member:
      "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)",
    arguments: [nc8, nc8, nc5, nc11, defaultSqlArgument(nc6, "roundto")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)",
        rowFields502,
      ),
    ),
  });
  const rows502 = (alias: string, ...values: Parameters<typeof member502>) =>
    extensionRows(member502(...values), alias, rowFields502, "named");
  const rowFields503 = { value: nc6, count: nc5 } as const;
  const member503 = createSqlFunction({
    ...base,
    name: "st_valuecount",
    member:
      "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)",
    arguments: [
      nc8,
      nc8,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc4, "exclude_nodata_value"),
      defaultSqlArgument(nc11, "searchvalues"),
      defaultSqlArgument(nc6, "roundto"),
    ] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)",
        rowFields503,
      ),
    ),
  });
  const rows503 = (alias: string, ...values: Parameters<typeof member503>) =>
    extensionRows(member503(...values), alias, rowFields503, "named");
  const member504 = createSqlFunction({
    ...base,
    name: "st_valuecount",
    member:
      "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc8, nc8, nc5, nc4, nc6, defaultSqlArgument(nc6, "roundto")] as const,
    result: nc5,
  });
  const member505 = createSqlFunction({
    ...base,
    name: "st_valuecount",
    member:
      "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc8, nc8, nc5, nc6, defaultSqlArgument(nc6, "roundto")] as const,
    result: nc5,
  });
  const rowFields506 = { value: nc6, percent: nc6 } as const;
  const member506 = createSqlFunction({
    ...base,
    name: "st_valuepercent",
    member:
      "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)",
    arguments: [nc0, nc11, defaultSqlArgument(nc6, "roundto")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)",
        rowFields506,
      ),
    ),
  });
  const rows506 = (alias: string, ...values: Parameters<typeof member506>) =>
    extensionRows(member506(...values), alias, rowFields506, "named");
  const member507 = createSqlFunction({
    ...base,
    name: "st_valuepercent",
    member:
      "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc6, defaultSqlArgument(nc6, "roundto")] as const,
    result: nc6,
  });
  const rowFields508 = { value: nc6, percent: nc6 } as const;
  const member508 = createSqlFunction({
    ...base,
    name: "st_valuepercent",
    member:
      "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)",
    arguments: [nc0, nc5, nc11, defaultSqlArgument(nc6, "roundto")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)",
        rowFields508,
      ),
    ),
  });
  const rows508 = (alias: string, ...values: Parameters<typeof member508>) =>
    extensionRows(member508(...values), alias, rowFields508, "named");
  const rowFields509 = { value: nc6, percent: nc6 } as const;
  const member509 = createSqlFunction({
    ...base,
    name: "st_valuepercent",
    member:
      "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)",
    arguments: [
      nc0,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc4, "exclude_nodata_value"),
      defaultSqlArgument(nc11, "searchvalues"),
      defaultSqlArgument(nc6, "roundto"),
    ] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)",
        rowFields509,
      ),
    ),
  });
  const rows509 = (alias: string, ...values: Parameters<typeof member509>) =>
    extensionRows(member509(...values), alias, rowFields509, "named");
  const member510 = createSqlFunction({
    ...base,
    name: "st_valuepercent",
    member:
      "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc5, nc4, nc6, defaultSqlArgument(nc6, "roundto")] as const,
    result: nc6,
  });
  const member511 = createSqlFunction({
    ...base,
    name: "st_valuepercent",
    member:
      "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc5, nc6, defaultSqlArgument(nc6, "roundto")] as const,
    result: nc6,
  });
  const rowFields512 = { value: nc6, percent: nc6 } as const;
  const member512 = createSqlFunction({
    ...base,
    name: "st_valuepercent",
    member:
      "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)",
    arguments: [nc8, nc8, nc11, defaultSqlArgument(nc6, "roundto")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)",
        rowFields512,
      ),
    ),
  });
  const rows512 = (alias: string, ...values: Parameters<typeof member512>) =>
    extensionRows(member512(...values), alias, rowFields512, "named");
  const member513 = createSqlFunction({
    ...base,
    name: "st_valuepercent",
    member:
      "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc8, nc8, nc6, defaultSqlArgument(nc6, "roundto")] as const,
    result: nc6,
  });
  const rowFields514 = { value: nc6, percent: nc6 } as const;
  const member514 = createSqlFunction({
    ...base,
    name: "st_valuepercent",
    member:
      "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)",
    arguments: [nc8, nc8, nc5, nc11, defaultSqlArgument(nc6, "roundto")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)",
        rowFields514,
      ),
    ),
  });
  const rows514 = (alias: string, ...values: Parameters<typeof member514>) =>
    extensionRows(member514(...values), alias, rowFields514, "named");
  const rowFields515 = { value: nc6, percent: nc6 } as const;
  const member515 = createSqlFunction({
    ...base,
    name: "st_valuepercent",
    member:
      "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)",
    arguments: [
      nc8,
      nc8,
      defaultSqlArgument(nc5, "nband"),
      defaultSqlArgument(nc4, "exclude_nodata_value"),
      defaultSqlArgument(nc11, "searchvalues"),
      defaultSqlArgument(nc6, "roundto"),
    ] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)",
        rowFields515,
      ),
    ),
  });
  const rows515 = (alias: string, ...values: Parameters<typeof member515>) =>
    extensionRows(member515(...values), alias, rowFields515, "named");
  const member516 = createSqlFunction({
    ...base,
    name: "st_valuepercent",
    member:
      "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc8, nc8, nc5, nc4, nc6, defaultSqlArgument(nc6, "roundto")] as const,
    result: nc6,
  });
  const member517 = createSqlFunction({
    ...base,
    name: "st_valuepercent",
    member:
      "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc8, nc8, nc5, nc6, defaultSqlArgument(nc6, "roundto")] as const,
    result: nc6,
  });
  const member518 = createSqlFunction({
    ...base,
    name: "st_width",
    member: "routine:$extension:postgis_raster.st_width($extension:postgis_raster.raster)",
    arguments: [nc0] as const,
    result: nc5,
  });
  const member519 = createSqlFunction({
    ...base,
    name: "st_within",
    member:
      "routine:$extension:postgis_raster.st_within($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    arguments: [nc0, nc0] as const,
    result: nc4,
  });
  const member520 = createSqlFunction({
    ...base,
    name: "st_within",
    member:
      "routine:$extension:postgis_raster.st_within($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    arguments: [nc0, nc5, nc0, nc5] as const,
    result: nc4,
  });
  const rowFields521 = { columnx: nc5, rowy: nc5 } as const;
  const member521 = createSqlFunction({
    ...base,
    name: "st_worldtorastercoord",
    member:
      "routine:$extension:postgis_raster.st_worldtorastercoord($extension:postgis_raster.raster,$extension:postgis.geometry)",
    arguments: [nc0, nc2] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_worldtorastercoord($extension:postgis_raster.raster,$extension:postgis.geometry)",
        rowFields521,
      ),
    ),
  });
  const rowFields522 = { columnx: nc5, rowy: nc5 } as const;
  const member522 = createSqlFunction({
    ...base,
    name: "st_worldtorastercoord",
    member:
      "routine:$extension:postgis_raster.st_worldtorastercoord($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc6, nc6] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis_raster.st_worldtorastercoord($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
        rowFields522,
      ),
    ),
  });
  const member523 = createSqlFunction({
    ...base,
    name: "st_worldtorastercoordx",
    member:
      "routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,$extension:postgis.geometry)",
    arguments: [nc0, nc2] as const,
    result: nc5,
  });
  const member524 = createSqlFunction({
    ...base,
    name: "st_worldtorastercoordx",
    member:
      "routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc6, nc6] as const,
    result: nc5,
  });
  const member525 = createSqlFunction({
    ...base,
    name: "st_worldtorastercoordx",
    member:
      "routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,pg_catalog.float8)",
    arguments: [nc0, nc6] as const,
    result: nc5,
  });
  const member526 = createSqlFunction({
    ...base,
    name: "st_worldtorastercoordy",
    member:
      "routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,$extension:postgis.geometry)",
    arguments: [nc0, nc2] as const,
    result: nc5,
  });
  const member527 = createSqlFunction({
    ...base,
    name: "st_worldtorastercoordy",
    member:
      "routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc6, nc6] as const,
    result: nc5,
  });
  const member528 = createSqlFunction({
    ...base,
    name: "st_worldtorastercoordy",
    member:
      "routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,pg_catalog.float8)",
    arguments: [nc0, nc6] as const,
    result: nc5,
  });
  const overloads = {
    "cast:$extension:postgis_raster.raster->$extension:postgis.box3d": member0,
    "cast:$extension:postgis_raster.raster->$extension:postgis.geometry": member1,
    "cast:$extension:postgis_raster.raster->pg_catalog.bytea": member2,
    "operator:$extension:postgis_raster.@($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member14,
    "operator:$extension:postgis_raster.@($extension:postgis_raster.raster,$extension:postgis.geometry)": member15,
    "operator:$extension:postgis_raster.@($extension:postgis.geometry,$extension:postgis_raster.raster)": member16,
    "operator:$extension:postgis_raster.&&($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member17,
    "operator:$extension:postgis_raster.&&($extension:postgis_raster.raster,$extension:postgis.geometry)": member18,
    "operator:$extension:postgis_raster.&&($extension:postgis.geometry,$extension:postgis_raster.raster)": member19,
    "operator:$extension:postgis_raster.&<($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member20,
    "operator:$extension:postgis_raster.&<|($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member21,
    "operator:$extension:postgis_raster.&>($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member22,
    "operator:$extension:postgis_raster.<<($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member23,
    "operator:$extension:postgis_raster.<<|($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member24,
    "operator:$extension:postgis_raster.=($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member25,
    "operator:$extension:postgis_raster.>>($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member26,
    "operator:$extension:postgis_raster.|&>($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member27,
    "operator:$extension:postgis_raster.|>>($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member28,
    "operator:$extension:postgis_raster.~($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member29,
    "operator:$extension:postgis_raster.~($extension:postgis_raster.raster,$extension:postgis.geometry)": member30,
    "operator:$extension:postgis_raster.~($extension:postgis.geometry,$extension:postgis_raster.raster)": member31,
    "operator:$extension:postgis_raster.~=($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member32,
    "routine:$extension:postgis_raster.box3d($extension:postgis_raster.raster)": member144,
    "routine:$extension:postgis_raster.bytea($extension:postgis_raster.raster)": member145,
    "routine:$extension:postgis_raster.geometry_contained_by_raster($extension:postgis.geometry,$extension:postgis_raster.raster)":
      member152,
    "routine:$extension:postgis_raster.geometry_raster_contain($extension:postgis.geometry,$extension:postgis_raster.raster)":
      member153,
    "routine:$extension:postgis_raster.geometry_raster_overlap($extension:postgis.geometry,$extension:postgis_raster.raster)":
      member154,
    "routine:$extension:postgis_raster.postgis_gdal_version()": member155,
    "routine:$extension:postgis_raster.postgis_noop($extension:postgis_raster.raster)": member156,
    "routine:$extension:postgis_raster.postgis_raster_lib_build_date()": member157,
    "routine:$extension:postgis_raster.postgis_raster_lib_version()": member158,
    "routine:$extension:postgis_raster.postgis_raster_scripts_installed()": member159,
    "routine:$extension:postgis_raster.raster_above($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member160,
    "routine:$extension:postgis_raster.raster_below($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member161,
    "routine:$extension:postgis_raster.raster_contain($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member162,
    "routine:$extension:postgis_raster.raster_contained_by_geometry($extension:postgis_raster.raster,$extension:postgis.geometry)":
      member163,
    "routine:$extension:postgis_raster.raster_contained($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member164,
    "routine:$extension:postgis_raster.raster_eq($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member165,
    "routine:$extension:postgis_raster.raster_geometry_contain($extension:postgis_raster.raster,$extension:postgis.geometry)":
      member166,
    "routine:$extension:postgis_raster.raster_geometry_overlap($extension:postgis_raster.raster,$extension:postgis.geometry)":
      member167,
    "routine:$extension:postgis_raster.raster_hash($extension:postgis_raster.raster)": member168,
    "routine:$extension:postgis_raster.raster_left($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member170,
    "routine:$extension:postgis_raster.raster_overabove($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member172,
    "routine:$extension:postgis_raster.raster_overbelow($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member173,
    "routine:$extension:postgis_raster.raster_overlap($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member174,
    "routine:$extension:postgis_raster.raster_overleft($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member175,
    "routine:$extension:postgis_raster.raster_overright($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member176,
    "routine:$extension:postgis_raster.raster_right($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member177,
    "routine:$extension:postgis_raster.raster_same($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member178,
    "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster._addbandarg)":
      member179,
    "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster._raster,pg_catalog.int4,pg_catalog.int4)":
      member180,
    "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      member181,
    "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog._int4,pg_catalog.float8)":
      member182,
    "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)":
      member183,
    "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.text,pg_catalog._int4,pg_catalog.int4,pg_catalog.float8)":
      member184,
    "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)":
      member185,
    "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)":
      member186,
    "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.float8)": member187,
    "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)":
      member188,
    "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
      member189,
    "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.float8)":
      member190,
    "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)":
      member191,
    "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)":
      member192,
    "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)":
      member193,
    "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)":
      member194,
    "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
      member195,
    "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog._float8)":
      member196,
    "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)":
      member197,
    "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog._float8)":
      member198,
    "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)":
      member199,
    "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog._float8)":
      member200,
    "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)":
      member201,
    "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog._float8)":
      member202,
    "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member203,
    "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)":
      member204,
    "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.float8)":
      member205,
    "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)":
      member206,
    "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
      member207,
    "routine:$extension:postgis_raster.st_asbinary($extension:postgis_raster.raster,pg_catalog.bool)": member208,
    "routine:$extension:postgis_raster.st_asgdalraster($extension:postgis_raster.raster,pg_catalog.text,pg_catalog._text,pg_catalog.int4)":
      member209,
    "routine:$extension:postgis_raster.st_ashexwkb($extension:postgis_raster.raster,pg_catalog.bool)": member210,
    "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text)":
      member211,
    "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4)":
      member212,
    "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._text)": member213,
    "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._text)":
      member214,
    "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      member215,
    "routine:$extension:postgis_raster.st_aspect($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.bool)":
      member216,
    "routine:$extension:postgis_raster.st_aspect($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.bool)":
      member217,
    "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text)":
      member218,
    "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4)":
      member219,
    "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._text)": member220,
    "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._text)":
      member221,
    "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      member222,
    "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.bool)":
      member223,
    "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
      member224,
    "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
      member225,
    "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
      member226,
    "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
      member227,
    "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
      member228,
    "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
      member229,
    "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
      member230,
    "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
      member231,
    "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
      member232,
    "routine:$extension:postgis_raster.st_asrasteragg($extension:postgis.geometry,pg_catalog.float8,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.bool)":
      member233,
    "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text,pg_catalog.int4)":
      member234,
    "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.text,pg_catalog.int4)":
      member235,
    "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._text,pg_catalog.int4)":
      member236,
    "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.int4)":
      member237,
    "routine:$extension:postgis_raster.st_aswkb($extension:postgis_raster.raster,pg_catalog.bool)": member238,
    "routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog._int4)": member239,
    "routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog.int4)": member240,
    "routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bpchar)":
      member241,
    "routine:$extension:postgis_raster.st_bandfilesize($extension:postgis_raster.raster,pg_catalog.int4)": member242,
    "routine:$extension:postgis_raster.st_bandfiletimestamp($extension:postgis_raster.raster,pg_catalog.int4)":
      member243,
    "routine:$extension:postgis_raster.st_bandisnodata($extension:postgis_raster.raster,pg_catalog.bool)": member244,
    "routine:$extension:postgis_raster.st_bandisnodata($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)":
      member245,
    "routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog._int4)": member246,
    "routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog.int4)": member247,
    "routine:$extension:postgis_raster.st_bandnodatavalue($extension:postgis_raster.raster,pg_catalog.int4)": member248,
    "routine:$extension:postgis_raster.st_bandpath($extension:postgis_raster.raster,pg_catalog.int4)": member249,
    "routine:$extension:postgis_raster.st_bandpixeltype($extension:postgis_raster.raster,pg_catalog.int4)": member250,
    "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)":
      member251,
    "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)":
      member252,
    "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)":
      member253,
    "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog._int4,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)":
      member254,
    "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)":
      member255,
    "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)":
      member256,
    "routine:$extension:postgis_raster.st_colormap($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text)":
      member257,
    "routine:$extension:postgis_raster.st_colormap($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)":
      member258,
    "routine:$extension:postgis_raster.st_contains($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member259,
    "routine:$extension:postgis_raster.st_contains($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)":
      member260,
    "routine:$extension:postgis_raster.st_containsproperly($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member261,
    "routine:$extension:postgis_raster.st_containsproperly($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)":
      member262,
    "routine:$extension:postgis_raster.st_contour($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._float8,pg_catalog.bool)":
      member263,
    "routine:$extension:postgis_raster.st_convexhull($extension:postgis_raster.raster)": member264,
    "routine:$extension:postgis_raster.st_count($extension:postgis_raster.raster,pg_catalog.bool)": member265,
    "routine:$extension:postgis_raster.st_count($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)":
      member266,
    "routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.bool)": member267,
    "routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)":
      member268,
    "routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)":
      member269,
    "routine:$extension:postgis_raster.st_coveredby($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member270,
    "routine:$extension:postgis_raster.st_coveredby($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)":
      member271,
    "routine:$extension:postgis_raster.st_covers($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member272,
    "routine:$extension:postgis_raster.st_covers($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)":
      member273,
    "routine:$extension:postgis_raster.st_dfullywithin($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)":
      member275,
    "routine:$extension:postgis_raster.st_dfullywithin($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
      member276,
    "routine:$extension:postgis_raster.st_disjoint($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member277,
    "routine:$extension:postgis_raster.st_disjoint($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)":
      member278,
    "routine:$extension:postgis_raster.st_distinct4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member279,
    "routine:$extension:postgis_raster.st_distinct4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": member280,
    "routine:$extension:postgis_raster.st_dumpaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)":
      member281,
    "routine:$extension:postgis_raster.st_dumpvalues($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.bool)":
      member282,
    "routine:$extension:postgis_raster.st_dumpvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)":
      member283,
    "routine:$extension:postgis_raster.st_dwithin($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)":
      member284,
    "routine:$extension:postgis_raster.st_dwithin($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
      member285,
    "routine:$extension:postgis_raster.st_envelope($extension:postgis_raster.raster)": member286,
    "routine:$extension:postgis_raster.st_fromgdalraster(pg_catalog.bytea,pg_catalog.int4)": member287,
    "routine:$extension:postgis_raster.st_gdaldrivers()": member288,
    "routine:$extension:postgis_raster.st_georeference($extension:postgis_raster.raster,pg_catalog.text)": member289,
    "routine:$extension:postgis_raster.st_geotransform($extension:postgis_raster.raster)": member290,
    "routine:$extension:postgis_raster.st_grayscale($extension:postgis_raster._rastbandarg,pg_catalog.text)": member291,
    "routine:$extension:postgis_raster.st_grayscale($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)":
      member292,
    "routine:$extension:postgis_raster.st_hasnoband($extension:postgis_raster.raster,pg_catalog.int4)": member293,
    "routine:$extension:postgis_raster.st_height($extension:postgis_raster.raster)": member294,
    "routine:$extension:postgis_raster.st_hillshade($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
      member295,
    "routine:$extension:postgis_raster.st_hillshade($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
      member296,
    "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)":
      member297,
    "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog.bool)":
      member298,
    "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)":
      member299,
    "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
      member300,
    "routine:$extension:postgis_raster.st_interpolateraster($extension:postgis.geometry,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4)":
      member301,
    "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog._float8)":
      member302,
    "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)":
      member303,
    "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog._float8)":
      member304,
    "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8)":
      member305,
    "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis.geometry)":
      member306,
    "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)":
      member307,
    "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
      member308,
    "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog._float8)":
      member309,
    "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)":
      member310,
    "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry)":
      member311,
    "routine:$extension:postgis_raster.st_intersection($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)":
      member312,
    "routine:$extension:postgis_raster.st_intersectionfractions($extension:postgis_raster.raster,$extension:postgis.geometry)":
      member313,
    "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member314,
    "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)":
      member315,
    "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)":
      member316,
    "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry)":
      member317,
    "routine:$extension:postgis_raster.st_intersects($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)":
      member318,
    "routine:$extension:postgis_raster.st_invdistweight4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)":
      member319,
    "routine:$extension:postgis_raster.st_iscoveragetile($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      member320,
    "routine:$extension:postgis_raster.st_isempty($extension:postgis_raster.raster)": member321,
    "routine:$extension:postgis_raster.st_makeemptycoverage(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)":
      member322,
    "routine:$extension:postgis_raster.st_makeemptyraster($extension:postgis_raster.raster)": member323,
    "routine:$extension:postgis_raster.st_makeemptyraster(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)":
      member324,
    "routine:$extension:postgis_raster.st_makeemptyraster(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member325,
    "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster._rastbandarg,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)":
      member326,
    "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)":
      member327,
    "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)":
      member328,
    "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)":
      member329,
    "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)":
      member330,
    "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog._float8,pg_catalog.bool,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog._text)":
      member331,
    "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)":
      member332,
    "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)":
      member333,
    "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8)":
      member334,
    "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)":
      member335,
    "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)":
      member336,
    "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)":
      member337,
    "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8)":
      member338,
    "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,pg_catalog._text)":
      member339,
    "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,pg_catalog._text)":
      member340,
    "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog._text)":
      member341,
    "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure)":
      member342,
    "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.regprocedure,pg_catalog._text)":
      member343,
    "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.regprocedure)":
      member344,
    "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.regprocedure,pg_catalog._text)":
      member345,
    "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.regprocedure)":
      member346,
    "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.regprocedure,pg_catalog._text)":
      member347,
    "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.regprocedure)":
      member348,
    "routine:$extension:postgis_raster.st_mapalgebrafctngb($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog._text)":
      member349,
    "routine:$extension:postgis_raster.st_max4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member350,
    "routine:$extension:postgis_raster.st_max4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": member351,
    "routine:$extension:postgis_raster.st_mean4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member352,
    "routine:$extension:postgis_raster.st_mean4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": member353,
    "routine:$extension:postgis_raster.st_memsize($extension:postgis_raster.raster)": member354,
    "routine:$extension:postgis_raster.st_metadata($extension:postgis_raster.raster)": member355,
    "routine:$extension:postgis_raster.st_min4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member356,
    "routine:$extension:postgis_raster.st_min4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": member357,
    "routine:$extension:postgis_raster.st_minconvexhull($extension:postgis_raster.raster,pg_catalog.int4)": member358,
    "routine:$extension:postgis_raster.st_mindist4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member359,
    "routine:$extension:postgis_raster.st_minpossiblevalue(pg_catalog.text)": member360,
    "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)":
      member361,
    "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool)":
      member362,
    "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
      member363,
    "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
      member364,
    "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
      member365,
    "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
      member366,
    "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
      member367,
    "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
      member368,
    "routine:$extension:postgis_raster.st_notsamealignmentreason($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member369,
    "routine:$extension:postgis_raster.st_numbands($extension:postgis_raster.raster)": member370,
    "routine:$extension:postgis_raster.st_overlaps($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member371,
    "routine:$extension:postgis_raster.st_overlaps($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)":
      member372,
    "routine:$extension:postgis_raster.st_pixelascentroid($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      member373,
    "routine:$extension:postgis_raster.st_pixelascentroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)":
      member374,
    "routine:$extension:postgis_raster.st_pixelaspoint($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      member375,
    "routine:$extension:postgis_raster.st_pixelaspoints($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)":
      member376,
    "routine:$extension:postgis_raster.st_pixelaspolygon($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      member377,
    "routine:$extension:postgis_raster.st_pixelaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)":
      member378,
    "routine:$extension:postgis_raster.st_pixelheight($extension:postgis_raster.raster)": member379,
    "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.bool)":
      member380,
    "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.bool)":
      member381,
    "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)":
      member382,
    "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)":
      member383,
    "routine:$extension:postgis_raster.st_pixelwidth($extension:postgis_raster.raster)": member384,
    "routine:$extension:postgis_raster.st_polygon($extension:postgis_raster.raster,pg_catalog.int4)": member385,
    "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog._float8)": member386,
    "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)":
      member387,
    "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.float8)": member388,
    "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)":
      member389,
    "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8)":
      member390,
    "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)":
      member391,
    "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
      member392,
    "routine:$extension:postgis_raster.st_range4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member393,
    "routine:$extension:postgis_raster.st_range4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": member394,
    "routine:$extension:postgis_raster.st_rastertoworldcoord($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      member395,
    "routine:$extension:postgis_raster.st_rastertoworldcoordx($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      member396,
    "routine:$extension:postgis_raster.st_rastertoworldcoordx($extension:postgis_raster.raster,pg_catalog.int4)":
      member397,
    "routine:$extension:postgis_raster.st_rastertoworldcoordy($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      member398,
    "routine:$extension:postgis_raster.st_rastertoworldcoordy($extension:postgis_raster.raster,pg_catalog.int4)":
      member399,
    "routine:$extension:postgis_raster.st_rastfromhexwkb(pg_catalog.text)": member400,
    "routine:$extension:postgis_raster.st_rastfromwkb(pg_catalog.bytea)": member401,
    "routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,$extension:postgis_raster._reclassarg)":
      member402,
    "routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)":
      member403,
    "routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)":
      member404,
    "routine:$extension:postgis_raster.st_reclassexact($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog._float8,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)":
      member405,
    "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.text,pg_catalog.float8)":
      member406,
    "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)":
      member407,
    "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
      member408,
    "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
      member409,
    "routine:$extension:postgis_raster.st_rescale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
      member410,
    "routine:$extension:postgis_raster.st_rescale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
      member411,
    "routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
      member412,
    "routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)":
      member413,
    "routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)":
      member414,
    "routine:$extension:postgis_raster.st_reskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
      member415,
    "routine:$extension:postgis_raster.st_reskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
      member416,
    "routine:$extension:postgis_raster.st_rotation($extension:postgis_raster.raster)": member418,
    "routine:$extension:postgis_raster.st_roughness($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)":
      member419,
    "routine:$extension:postgis_raster.st_roughness($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)":
      member420,
    "routine:$extension:postgis_raster.st_samealignment($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member421,
    "routine:$extension:postgis_raster.st_samealignment($extension:postgis_raster.raster)": member422,
    "routine:$extension:postgis_raster.st_samealignment(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member423,
    "routine:$extension:postgis_raster.st_scalex($extension:postgis_raster.raster)": member424,
    "routine:$extension:postgis_raster.st_scaley($extension:postgis_raster.raster)": member425,
    "routine:$extension:postgis_raster.st_setbandindex($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
      member426,
    "routine:$extension:postgis_raster.st_setbandisnodata($extension:postgis_raster.raster,pg_catalog.int4)": member427,
    "routine:$extension:postgis_raster.st_setbandnodatavalue($extension:postgis_raster.raster,pg_catalog.float8)":
      member428,
    "routine:$extension:postgis_raster.st_setbandnodatavalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)":
      member429,
    "routine:$extension:postgis_raster.st_setbandpath($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.int4,pg_catalog.bool)":
      member430,
    "routine:$extension:postgis_raster.st_setgeoreference($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member431,
    "routine:$extension:postgis_raster.st_setgeoreference($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)":
      member432,
    "routine:$extension:postgis_raster.st_setgeotransform($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member433,
    "routine:$extension:postgis_raster.st_setm($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)":
      member434,
    "routine:$extension:postgis_raster.st_setrotation($extension:postgis_raster.raster,pg_catalog.float8)": member435,
    "routine:$extension:postgis_raster.st_setscale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)":
      member436,
    "routine:$extension:postgis_raster.st_setscale($extension:postgis_raster.raster,pg_catalog.float8)": member437,
    "routine:$extension:postgis_raster.st_setskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)":
      member438,
    "routine:$extension:postgis_raster.st_setskew($extension:postgis_raster.raster,pg_catalog.float8)": member439,
    "routine:$extension:postgis_raster.st_setsrid($extension:postgis_raster.raster,pg_catalog.int4)": member440,
    "routine:$extension:postgis_raster.st_setupperleft($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)":
      member441,
    "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8)":
      member442,
    "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8)":
      member443,
    "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)":
      member444,
    "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)":
      member445,
    "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster._geomval,pg_catalog.bool)":
      member446,
    "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog._bool,pg_catalog.bool)":
      member447,
    "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8,pg_catalog.bool)":
      member448,
    "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)":
      member449,
    "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)":
      member450,
    "routine:$extension:postgis_raster.st_setz($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)":
      member451,
    "routine:$extension:postgis_raster.st_skewx($extension:postgis_raster.raster)": member452,
    "routine:$extension:postgis_raster.st_skewy($extension:postgis_raster.raster)": member453,
    "routine:$extension:postgis_raster.st_slope($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)":
      member454,
    "routine:$extension:postgis_raster.st_slope($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)":
      member455,
    "routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
      member456,
    "routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
      member457,
    "routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member458,
    "routine:$extension:postgis_raster.st_srid($extension:postgis_raster.raster)": member459,
    "routine:$extension:postgis_raster.st_stddev4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member460,
    "routine:$extension:postgis_raster.st_stddev4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": member461,
    "routine:$extension:postgis_raster.st_sum4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member462,
    "routine:$extension:postgis_raster.st_sum4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": member463,
    "routine:$extension:postgis_raster.st_summary($extension:postgis_raster.raster)": member464,
    "routine:$extension:postgis_raster.st_summarystats($extension:postgis_raster.raster,pg_catalog.bool)": member465,
    "routine:$extension:postgis_raster.st_summarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)":
      member466,
    "routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)":
      member467,
    "routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)":
      member468,
    "routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)":
      member469,
    "routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)":
      member470,
    "routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)":
      member471,
    "routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)":
      member472,
    "routine:$extension:postgis_raster.st_touches($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member473,
    "routine:$extension:postgis_raster.st_touches($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)":
      member474,
    "routine:$extension:postgis_raster.st_tpi($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)":
      member475,
    "routine:$extension:postgis_raster.st_tpi($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)":
      member476,
    "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8)":
      member477,
    "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
      member478,
    "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
      member479,
    "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member480,
    "routine:$extension:postgis_raster.st_tri($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)":
      member481,
    "routine:$extension:postgis_raster.st_tri($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)":
      member482,
    "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,$extension:postgis_raster._unionarg)":
      member483,
    "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text)":
      member484,
    "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.int4)": member485,
    "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.text)": member486,
    "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster)": member487,
    "routine:$extension:postgis_raster.st_upperleftx($extension:postgis_raster.raster)": member488,
    "routine:$extension:postgis_raster.st_upperlefty($extension:postgis_raster.raster)": member489,
    "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)":
      member490,
    "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.text)":
      member491,
    "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
      member492,
    "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
      member493,
    "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)":
      member494,
    "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)":
      member495,
    "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)":
      member496,
    "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)":
      member497,
    "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)":
      member498,
    "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member499,
    "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)":
      member500,
    "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)":
      member501,
    "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)":
      member502,
    "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)":
      member503,
    "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)":
      member504,
    "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member505,
    "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)":
      member506,
    "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)":
      member507,
    "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)":
      member508,
    "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)":
      member509,
    "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)":
      member510,
    "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member511,
    "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)":
      member512,
    "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)":
      member513,
    "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)":
      member514,
    "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)":
      member515,
    "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)":
      member516,
    "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member517,
    "routine:$extension:postgis_raster.st_width($extension:postgis_raster.raster)": member518,
    "routine:$extension:postgis_raster.st_within($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member519,
    "routine:$extension:postgis_raster.st_within($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)":
      member520,
    "routine:$extension:postgis_raster.st_worldtorastercoord($extension:postgis_raster.raster,$extension:postgis.geometry)":
      member521,
    "routine:$extension:postgis_raster.st_worldtorastercoord($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)":
      member522,
    "routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,$extension:postgis.geometry)":
      member523,
    "routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)":
      member524,
    "routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,pg_catalog.float8)":
      member525,
    "routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,$extension:postgis.geometry)":
      member526,
    "routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)":
      member527,
    "routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,pg_catalog.float8)":
      member528,
  } as const;
  const functions = {
    box3d: member144,
    bytea: member145,
    geometry_contained_by_raster: member152,
    geometry_raster_contain: member153,
    geometry_raster_overlap: member154,
    postgis_gdal_version: member155,
    postgis_noop: member156,
    postgis_raster_lib_build_date: member157,
    postgis_raster_lib_version: member158,
    postgis_raster_scripts_installed: member159,
    raster_above: member160,
    raster_below: member161,
    raster_contain: member162,
    raster_contained_by_geometry: member163,
    raster_contained: member164,
    raster_eq: member165,
    raster_geometry_contain: member166,
    raster_geometry_overlap: member167,
    raster_hash: member168,
    raster_left: member170,
    raster_overabove: member172,
    raster_overbelow: member173,
    raster_overlap: member174,
    raster_overleft: member175,
    raster_overright: member176,
    raster_right: member177,
    raster_same: member178,
    st_addband: {
      "($extension:postgis_raster.raster,$extension:postgis_raster._addbandarg)": member179,
      "($extension:postgis_raster.raster,$extension:postgis_raster._raster,pg_catalog.int4,pg_catalog.int4)": member180,
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": member181,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog._int4,pg_catalog.float8)":
        member182,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)":
        member183,
      "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog._int4,pg_catalog.int4,pg_catalog.float8)":
        member184,
      "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": member185,
    },
    st_approxcount: {
      "($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": member186,
      "($extension:postgis_raster.raster,pg_catalog.float8)": member187,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": member188,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": member189,
    },
    st_approxhistogram: {
      "($extension:postgis_raster.raster,pg_catalog.float8)": member190,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)":
        member191,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)":
        member192,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)":
        member193,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": member194,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": member195,
    },
    st_approxquantile: {
      "($extension:postgis_raster.raster,pg_catalog._float8)": member196,
      "($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": member197,
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog._float8)": member198,
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": member199,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog._float8)":
        member200,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)":
        member201,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog._float8)": member202,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": member203,
    },
    st_approxsummarystats: {
      "($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": member204,
      "($extension:postgis_raster.raster,pg_catalog.float8)": member205,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": member206,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": member207,
    },
    st_asbinary: member208,
    st_asgdalraster: member209,
    st_ashexwkb: member210,
    st_asjpeg: {
      "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text)": member211,
      "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4)": member212,
      "($extension:postgis_raster.raster,pg_catalog._text)": member213,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._text)": member214,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": member215,
    },
    st_aspect: {
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.bool)":
        member216,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member217,
    },
    st_aspng: {
      "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text)": member218,
      "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4)": member219,
      "($extension:postgis_raster.raster,pg_catalog._text)": member220,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._text)": member221,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": member222,
    },
    st_asraster: {
      "($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.bool)":
        member223,
      "($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
        member224,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
        member225,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
        member226,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
        member227,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
        member228,
      "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
        member229,
      "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
        member230,
      "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
        member231,
      "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
        member232,
    },
    st_asrasteragg: member233,
    st_astiff: {
      "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text,pg_catalog.int4)": member234,
      "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.text,pg_catalog.int4)": member235,
      "($extension:postgis_raster.raster,pg_catalog._text,pg_catalog.int4)": member236,
      "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.int4)": member237,
    },
    st_aswkb: member238,
    st_band: {
      "($extension:postgis_raster.raster,pg_catalog._int4)": member239,
      "($extension:postgis_raster.raster,pg_catalog.int4)": member240,
      "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bpchar)": member241,
    },
    st_bandfilesize: member242,
    st_bandfiletimestamp: member243,
    st_bandisnodata: {
      "($extension:postgis_raster.raster,pg_catalog.bool)": member244,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": member245,
    },
    st_bandmetadata: {
      "($extension:postgis_raster.raster,pg_catalog._int4)": member246,
      "($extension:postgis_raster.raster,pg_catalog.int4)": member247,
    },
    st_bandnodatavalue: member248,
    st_bandpath: member249,
    st_bandpixeltype: member250,
    st_clip: {
      "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)":
        member251,
      "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)": member252,
      "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)":
        member253,
      "($extension:postgis_raster.raster,pg_catalog._int4,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)":
        member254,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)":
        member255,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)":
        member256,
    },
    st_colormap: {
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text)": member257,
      "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)": member258,
    },
    st_contains: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member259,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": member260,
    },
    st_containsproperly: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member261,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": member262,
    },
    st_contour: member263,
    st_convexhull: member264,
    st_count: {
      "($extension:postgis_raster.raster,pg_catalog.bool)": member265,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": member266,
    },
    st_countagg: {
      "($extension:postgis_raster.raster,pg_catalog.bool)": member267,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": member268,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": member269,
    },
    st_coveredby: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member270,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": member271,
    },
    st_covers: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member272,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": member273,
    },
    st_dfullywithin: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)": member275,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
        member276,
    },
    st_disjoint: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member277,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": member278,
    },
    st_distinct4ma: {
      "(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member279,
      "(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": member280,
    },
    st_dumpaspolygons: member281,
    st_dumpvalues: {
      "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.bool)": member282,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": member283,
    },
    st_dwithin: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)": member284,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
        member285,
    },
    st_envelope: member286,
    st_fromgdalraster: member287,
    st_gdaldrivers: member288,
    st_georeference: member289,
    st_geotransform: member290,
    st_grayscale: {
      "($extension:postgis_raster._rastbandarg,pg_catalog.text)": member291,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)": member292,
    },
    st_hasnoband: member293,
    st_height: member294,
    st_hillshade: {
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
        member295,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
        member296,
    },
    st_histogram: {
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)":
        member297,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog.bool)": member298,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)":
        member299,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": member300,
    },
    st_interpolateraster: member301,
    st_intersection: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog._float8)": member302,
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)": member303,
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog._float8)":
        member304,
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8)":
        member305,
      "($extension:postgis_raster.raster,$extension:postgis.geometry)": member306,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)":
        member307,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
        member308,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog._float8)":
        member309,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)":
        member310,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry)": member311,
      "($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)": member312,
    },
    st_intersectionfractions: member313,
    st_intersects: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member314,
      "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)": member315,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": member316,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry)": member317,
      "($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)": member318,
    },
    st_invdistweight4ma: member319,
    st_iscoveragetile: member320,
    st_isempty: member321,
    st_makeemptycoverage: member322,
    st_makeemptyraster: {
      "($extension:postgis_raster.raster)": member323,
      "(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)":
        member324,
      "(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": member325,
    },
    st_mapalgebra: {
      "($extension:postgis_raster._rastbandarg,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)":
        member326,
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)":
        member327,
      "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)":
        member328,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)":
        member329,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)":
        member330,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog._float8,pg_catalog.bool,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog._text)":
        member331,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)":
        member332,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": member333,
      "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": member334,
    },
    st_mapalgebraexpr: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)":
        member335,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)":
        member336,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": member337,
      "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": member338,
    },
    st_mapalgebrafct: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,pg_catalog._text)":
        member339,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,pg_catalog._text)":
        member340,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog._text)": member341,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure)": member342,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.regprocedure,pg_catalog._text)":
        member343,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.regprocedure)": member344,
      "($extension:postgis_raster.raster,pg_catalog.regprocedure,pg_catalog._text)": member345,
      "($extension:postgis_raster.raster,pg_catalog.regprocedure)": member346,
      "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.regprocedure,pg_catalog._text)": member347,
      "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.regprocedure)": member348,
    },
    st_mapalgebrafctngb: member349,
    st_max4ma: {
      "(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member350,
      "(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": member351,
    },
    st_mean4ma: {
      "(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member352,
      "(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": member353,
    },
    st_memsize: member354,
    st_metadata: member355,
    st_min4ma: {
      "(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member356,
      "(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": member357,
    },
    st_minconvexhull: member358,
    st_mindist4ma: member359,
    st_minpossiblevalue: member360,
    st_nearestvalue: {
      "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)": member361,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool)": member362,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": member363,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": member364,
    },
    st_neighborhood: {
      "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
        member365,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
        member366,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
        member367,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
        member368,
    },
    st_notsamealignmentreason: member369,
    st_numbands: member370,
    st_overlaps: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member371,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": member372,
    },
    st_pixelascentroid: member373,
    st_pixelascentroids: member374,
    st_pixelaspoint: member375,
    st_pixelaspoints: member376,
    st_pixelaspolygon: member377,
    st_pixelaspolygons: member378,
    st_pixelheight: member379,
    st_pixelofvalue: {
      "($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.bool)": member380,
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.bool)": member381,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)": member382,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)": member383,
    },
    st_pixelwidth: member384,
    st_polygon: member385,
    st_quantile: {
      "($extension:postgis_raster.raster,pg_catalog._float8)": member386,
      "($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": member387,
      "($extension:postgis_raster.raster,pg_catalog.float8)": member388,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)": member389,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8)": member390,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": member391,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)": member392,
    },
    st_range4ma: {
      "(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member393,
      "(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": member394,
    },
    st_rastertoworldcoord: member395,
    st_rastertoworldcoordx: {
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": member396,
      "($extension:postgis_raster.raster,pg_catalog.int4)": member397,
    },
    st_rastertoworldcoordy: {
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)": member398,
      "($extension:postgis_raster.raster,pg_catalog.int4)": member399,
    },
    st_rastfromhexwkb: member400,
    st_rastfromwkb: member401,
    st_reclass: {
      "($extension:postgis_raster.raster,$extension:postgis_raster._reclassarg)": member402,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": member403,
      "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)": member404,
    },
    st_reclassexact: member405,
    st_resample: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.text,pg_catalog.float8)":
        member406,
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)":
        member407,
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
        member408,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
        member409,
    },
    st_rescale: {
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
        member410,
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": member411,
    },
    st_resize: {
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
        member412,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)": member413,
      "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)": member414,
    },
    st_reskew: {
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
        member415,
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)": member416,
    },
    st_rotation: member418,
    st_roughness: {
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)":
        member419,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)": member420,
    },
    st_samealignment: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member421,
      "($extension:postgis_raster.raster)": member422,
      "(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
        member423,
    },
    st_scalex: member424,
    st_scaley: member425,
    st_setbandindex: member426,
    st_setbandisnodata: member427,
    st_setbandnodatavalue: {
      "($extension:postgis_raster.raster,pg_catalog.float8)": member428,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)": member429,
    },
    st_setbandpath: member430,
    st_setgeoreference: {
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
        member431,
      "($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)": member432,
    },
    st_setgeotransform: member433,
    st_setm: member434,
    st_setrotation: member435,
    st_setscale: {
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": member436,
      "($extension:postgis_raster.raster,pg_catalog.float8)": member437,
    },
    st_setskew: {
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": member438,
      "($extension:postgis_raster.raster,pg_catalog.float8)": member439,
    },
    st_setsrid: member440,
    st_setupperleft: member441,
    st_setvalue: {
      "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8)": member442,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8)": member443,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)": member444,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)": member445,
    },
    st_setvalues: {
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster._geomval,pg_catalog.bool)":
        member446,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog._bool,pg_catalog.bool)":
        member447,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8,pg_catalog.bool)":
        member448,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)":
        member449,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)":
        member450,
    },
    st_setz: member451,
    st_skewx: member452,
    st_skewy: member453,
    st_slope: {
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)":
        member454,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)":
        member455,
    },
    st_snaptogrid: {
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
        member456,
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
        member457,
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
        member458,
    },
    st_srid: member459,
    st_stddev4ma: {
      "(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member460,
      "(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": member461,
    },
    st_sum4ma: {
      "(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)": member462,
      "(pg_catalog._float8,pg_catalog.text,pg_catalog._text)": member463,
    },
    st_summary: member464,
    st_summarystats: {
      "($extension:postgis_raster.raster,pg_catalog.bool)": member465,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": member466,
    },
    st_summarystatsagg: {
      "($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)": member467,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": member468,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)": member469,
    },
    st_tile: {
      "($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)":
        member470,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)": member471,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)":
        member472,
    },
    st_touches: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member473,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": member474,
    },
    st_tpi: {
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)":
        member475,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)": member476,
    },
    st_transform: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8)":
        member477,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
        member478,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)":
        member479,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
        member480,
    },
    st_tri: {
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)":
        member481,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)": member482,
    },
    st_union: {
      "($extension:postgis_raster.raster,$extension:postgis_raster._unionarg)": member483,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text)": member484,
      "($extension:postgis_raster.raster,pg_catalog.int4)": member485,
      "($extension:postgis_raster.raster,pg_catalog.text)": member486,
      "($extension:postgis_raster.raster)": member487,
    },
    st_upperleftx: member488,
    st_upperlefty: member489,
    st_value: {
      "($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)": member490,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.text)":
        member491,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": member492,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": member493,
    },
    st_valuecount: {
      "($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)": member494,
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": member495,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": member496,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)":
        member497,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)":
        member498,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": member499,
      "(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)": member500,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": member501,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": member502,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)":
        member503,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)":
        member504,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": member505,
    },
    st_valuepercent: {
      "($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)": member506,
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": member507,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": member508,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)":
        member509,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)":
        member510,
      "($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": member511,
      "(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)": member512,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": member513,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)": member514,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)":
        member515,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)":
        member516,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": member517,
    },
    st_width: member518,
    st_within: {
      "($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member519,
      "($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)": member520,
    },
    st_worldtorastercoord: {
      "($extension:postgis_raster.raster,$extension:postgis.geometry)": member521,
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": member522,
    },
    st_worldtorastercoordx: {
      "($extension:postgis_raster.raster,$extension:postgis.geometry)": member523,
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": member524,
      "($extension:postgis_raster.raster,pg_catalog.float8)": member525,
    },
    st_worldtorastercoordy: {
      "($extension:postgis_raster.raster,$extension:postgis.geometry)": member526,
      "($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)": member527,
      "($extension:postgis_raster.raster,pg_catalog.float8)": member528,
    },
  } as const;
  const operators = {
    "operator:$extension:postgis_raster.@($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member14,
    "operator:$extension:postgis_raster.@($extension:postgis_raster.raster,$extension:postgis.geometry)": member15,
    "operator:$extension:postgis_raster.@($extension:postgis.geometry,$extension:postgis_raster.raster)": member16,
    "operator:$extension:postgis_raster.&&($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member17,
    "operator:$extension:postgis_raster.&&($extension:postgis_raster.raster,$extension:postgis.geometry)": member18,
    "operator:$extension:postgis_raster.&&($extension:postgis.geometry,$extension:postgis_raster.raster)": member19,
    "operator:$extension:postgis_raster.&<($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member20,
    "operator:$extension:postgis_raster.&<|($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member21,
    "operator:$extension:postgis_raster.&>($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member22,
    "operator:$extension:postgis_raster.<<($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member23,
    "operator:$extension:postgis_raster.<<|($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member24,
    "operator:$extension:postgis_raster.=($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member25,
    "operator:$extension:postgis_raster.>>($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member26,
    "operator:$extension:postgis_raster.|&>($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member27,
    "operator:$extension:postgis_raster.|>>($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member28,
    "operator:$extension:postgis_raster.~($extension:postgis_raster.raster,$extension:postgis_raster.raster)": member29,
    "operator:$extension:postgis_raster.~($extension:postgis_raster.raster,$extension:postgis.geometry)": member30,
    "operator:$extension:postgis_raster.~($extension:postgis.geometry,$extension:postgis_raster.raster)": member31,
    "operator:$extension:postgis_raster.~=($extension:postgis_raster.raster,$extension:postgis_raster.raster)":
      member32,
  } as const;
  const rasterField = (semantics: PostgisRasterSemantics = {}) =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis_raster.raster",
      type: "raster",
      codec: createPostgisRasterCodec(schema, semantics),
      parameters: {
        srid: semantics.srid ?? "native",
        width: semantics.width ?? "native",
        height: semantics.height ?? "native",
        numBands: semantics.numBands ?? "native",
      },
      value: {
        kind: "object",
        properties: {
          kind: { kind: "string", enum: ["raster"] },
          format: { kind: "string", enum: ["wkb"] },
          hex: { kind: "string" },
          srid: { kind: "number", integer: true },
          width: { kind: "number", integer: true },
          height: { kind: "number", integer: true },
          numBands: { kind: "number", integer: true },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const index0 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis_raster.hash_raster_ops/hash",
        method: "hash",
        opclass: "hash_raster_ops",
        type: "raster",
        default: true,
      }),
      input: { schema, type: "raster" },
    });
  return bindExtension(descriptor, {
    raster: { codec: c0, field: rasterField, wkb: rasterWkb },
    codecs: {
      raster: c0,
      _raster: c20,
      addbandarg: c21,
      agg_count: c22,
      agg_samealignment: c23,
      geomval: c24,
      rastbandarg: c25,
      raster_columns: c26,
      raster_overviews: c27,
      reclassarg: c28,
      summarystats: c29,
      unionarg: c30,
      _addbandarg: c32,
      _agg_count: c33,
      _agg_samealignment: c34,
      _geomval: c35,
      _rastbandarg: c36,
      _raster_columns: c37,
      _raster_overviews: c38,
      _reclassarg: c39,
      _summarystats: c40,
      _unionarg: c41,
    },
    fields: { raster: rasterField },
    indexes: { hash_raster_ops: index0 },
    sql: {
      functions,
      overloads,
      operators,
      rows: {
        "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.float8)":
          rows190,
        "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)":
          rows191,
        "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)":
          rows192,
        "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)":
          rows193,
        "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)":
          rows194,
        "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
          rows195,
        "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog._float8)":
          rows196,
        "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog._float8)":
          rows198,
        "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog._float8)":
          rows200,
        "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog._float8)":
          rows202,
        "routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog._int4)": rows246,
        "routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog.int4)": rows247,
        "routine:$extension:postgis_raster.st_contour($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._float8,pg_catalog.bool)":
          rows263,
        "routine:$extension:postgis_raster.st_dumpvalues($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.bool)":
          rows282,
        "routine:$extension:postgis_raster.st_gdaldrivers()": rows288,
        "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)":
          rows297,
        "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog.bool)":
          rows298,
        "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)":
          rows299,
        "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
          rows300,
        "routine:$extension:postgis_raster.st_pixelascentroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)":
          rows374,
        "routine:$extension:postgis_raster.st_pixelaspoints($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)":
          rows376,
        "routine:$extension:postgis_raster.st_pixelaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)":
          rows378,
        "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.bool)":
          rows380,
        "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.bool)":
          rows381,
        "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)":
          rows382,
        "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)":
          rows383,
        "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog._float8)": rows386,
        "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)":
          rows389,
        "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8)":
          rows390,
        "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)":
          rows494,
        "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)":
          rows496,
        "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)":
          rows497,
        "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)":
          rows500,
        "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)":
          rows502,
        "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)":
          rows503,
        "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)":
          rows506,
        "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)":
          rows508,
        "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)":
          rows509,
        "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)":
          rows512,
        "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)":
          rows514,
        "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)":
          rows515,
      },
    },
  });
}
