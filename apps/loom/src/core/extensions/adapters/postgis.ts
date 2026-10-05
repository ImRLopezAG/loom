import { getTableConfig, type AnyPgColumn, type PgTable } from "drizzle-orm/pg-core";
import type { ExtensionTriggerDeclaration } from "../triggers";
import { sql, getColumnTable, type SQLWrapper } from "drizzle-orm";
import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  binaryCodec,
  booleanCodec,
  compositeCodec,
  createExtensionCodec,
  floatCodec,
  integerCodec,
  nullableCodec,
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
} from "../sql";
import {
  createPostgisGeometryCodec,
  createPostgisGeographyCodec,
  createPostgisTextCodec,
  geometryEwkb,
  geometryEwkt,
  geographyEwkb,
  geographyEwkt,
  type PostgisSemantics,
} from "./postgis-codecs";
export * from "./postgis-codecs";
import { postgisFlatGeobufBytes } from "./postgis-flat-geobuf";
const digest = "640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29";
type Descriptor = ExtensionDescriptor<"postgis", { readonly version: "3.6.4"; readonly schema: string }>;
const sqlOnly = createExtensionCodec({
  id: "postgis:concrete-native-expression:1",
  input: v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value)),
  output: v.never(),
  transport: "native",
  encode: () => {
    throw new Error("A concrete native SQL expression is required");
  },
  decode: () => {
    throw new Error("A captured concrete result codec is required");
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
export function createPostgisCodecDefinitions(schema: string) {
  const c0 = createPostgisTextCodec(schema, "box2d");
  const nc0 = nullableCodec(c0);
  const c1 = createPostgisTextCodec(schema, "box2df");
  const nc1 = nullableCodec(c1);
  const c2 = createPostgisTextCodec(schema, "box3d");
  const nc2 = nullableCodec(c2);
  const c3 = createPostgisGeographyCodec(schema);
  const nc3 = nullableCodec(c3);
  const c4 = createPostgisGeometryCodec(schema);
  const nc4 = nullableCodec(c4);
  const c5 = createPostgisTextCodec(schema, "gidx");
  const nc5 = nullableCodec(c5);
  const c6 = createPostgisTextCodec(schema, "spheroid");
  const nc6 = nullableCodec(c6);
  const c7 = createPostgisTextCodec("pg_catalog", "box");
  const nc7 = nullableCodec(c7);
  const c8 = binaryCodec;
  const nc8 = nullableCodec(c8);
  const c9 = jsonCodec;
  const nc9 = nullableCodec(c9);
  const c10 = jsonbCodec;
  const nc10 = nullableCodec(c10);
  const c11 = createPostgisTextCodec("pg_catalog", "path");
  const nc11 = nullableCodec(c11);
  const c12 = createPostgisTextCodec("pg_catalog", "point");
  const nc12 = nullableCodec(c12);
  const c13 = createPostgisTextCodec("pg_catalog", "polygon");
  const nc13 = nullableCodec(c13);
  const c14 = textCodec;
  const nc14 = nullableCodec(c14);
  const c15 = booleanCodec;
  const nc15 = nullableCodec(c15);
  const c16 = floatCodec;
  const nc16 = nullableCodec(c16);
  const c17 = voidCodec;
  const nc17 = nullableCodec(c17);
  const c18 = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "regclass" });
  const nc18 = nullableCodec(c18);
  const c19 = int4Codec;
  const nc19 = nullableCodec(c19);
  const c20 = integerCodec;
  const nc20 = nullableCodec(c20);
  const c21 = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "varchar" });
  const nc21 = nullableCodec(c21);
  const c22 = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "cstring" });
  const nc22 = nullableCodec(c22);
  const c23 = withCodecSqlType(
    createExtensionCodec({
      id: "pg:oid:1",
      input: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(4294967295)),
      output: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(4294967295)),
      transport: "text",
      encode: (value) => value,
      decode: (value) => Number(value),
    }),
    { schema: "pg_catalog", name: "oid" },
  );
  const nc23 = nullableCodec(c23);
  const c24 = arrayCodec(c22);
  const nc24 = nullableCodec(c24);
  const c25 = int2Codec;
  const nc25 = nullableCodec(c25);
  const c26 = sqlOnly;
  const nc26 = nullableCodec(c26);
  const c27 = sqlOnly;
  const nc27 = nullableCodec(c27);
  const c28 = arrayCodec(c20);
  const nc28 = nullableCodec(c28);
  const c29 = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "name" });
  const nc29 = nullableCodec(c29);
  const c30 = arrayCodec(c19);
  const nc30 = nullableCodec(c30);
  const c31 = arrayCodec(c0);
  const nc31 = nullableCodec(c31);
  const c32 = arrayCodec(c1);
  const nc32 = nullableCodec(c32);
  const c33 = arrayCodec(c2);
  const nc33 = nullableCodec(c33);
  const c34 = arrayCodec(c3, ":");
  const nc34 = nullableCodec(c34);
  const c35 = arrayCodec(c4, ":");
  const nc35 = nullableCodec(c35);
  const c36 = arrayCodec(c5);
  const nc36 = nullableCodec(c36);
  const c37 = arrayCodec(c6);
  const nc37 = nullableCodec(c37);
  const c38 = withCodecSqlType(
    compositeCodec("postgis:geography_columns:3.6.4", {
      f_table_catalog: nullableCodec(c29),
      f_table_schema: nullableCodec(c29),
      f_table_name: nullableCodec(c29),
      f_geography_column: nullableCodec(c29),
      coord_dimension: nullableCodec(c19),
      srid: nullableCodec(c19),
      type: nullableCodec(c14),
    }),
    { schema, name: "geography_columns" },
  );
  const nc38 = nullableCodec(c38);
  const c39 = withCodecSqlType(
    compositeCodec("postgis:geometry_columns:3.6.4", {
      f_table_catalog: nullableCodec(c21),
      f_table_schema: nullableCodec(c29),
      f_table_name: nullableCodec(c29),
      f_geometry_column: nullableCodec(c29),
      coord_dimension: nullableCodec(c19),
      srid: nullableCodec(c19),
      type: nullableCodec(c21),
    }),
    { schema, name: "geometry_columns" },
  );
  const nc39 = nullableCodec(c39);
  const c40 = withCodecSqlType(
    compositeCodec("postgis:geometry_dump:3.6.4", { path: nullableCodec(c30), geom: nullableCodec(c4) }),
    { schema, name: "geometry_dump" },
  );
  const nc40 = nullableCodec(c40);
  const c41 = withCodecSqlType(
    compositeCodec("postgis:spatial_ref_sys:3.6.4", {
      srid: nullableCodec(c19),
      auth_name: nullableCodec(c21),
      auth_srid: nullableCodec(c19),
      srtext: nullableCodec(c21),
      proj4text: nullableCodec(c21),
    }),
    { schema, name: "spatial_ref_sys" },
  );
  const nc41 = nullableCodec(c41);
  const c42 = withCodecSqlType(
    compositeCodec("postgis:valid_detail:3.6.4", {
      valid: nullableCodec(c15),
      reason: nullableCodec(c21),
      location: nullableCodec(c4),
    }),
    { schema, name: "valid_detail" },
  );
  const nc42 = nullableCodec(c42);
  const c43 = arrayCodec(c38);
  const nc43 = nullableCodec(c43);
  const c44 = arrayCodec(c39);
  const nc44 = nullableCodec(c44);
  const c45 = arrayCodec(c40);
  const nc45 = nullableCodec(c45);
  const c46 = arrayCodec(c41);
  const nc46 = nullableCodec(c46);
  const c47 = arrayCodec(c42);
  const nc47 = nullableCodec(c47);
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
    c42,
    nc42,
    c43,
    nc43,
    c44,
    nc44,
    c45,
    nc45,
    c46,
    nc46,
    c47,
    nc47,
  } as const;
}
export type PostgisCodecDefinitions = ReturnType<typeof createPostgisCodecDefinitions>;
export interface PostgisOverloads {
  "cast:$extension:postgis.box2d->$extension:postgis.box3d": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc0"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc2"]>>;
  "cast:$extension:postgis.box2d->$extension:postgis.geometry": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc0"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc4"]>>;
  "cast:$extension:postgis.box3d->$extension:postgis.box2d": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc2"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc0"]>>;
  "cast:$extension:postgis.box3d->$extension:postgis.geometry": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc2"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc4"]>>;
  "cast:$extension:postgis.box3d->pg_catalog.box": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc2"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc7"]>>;
  "cast:$extension:postgis.geography->$extension:postgis.geography": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc3"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc3"]>>;
  "cast:$extension:postgis.geography->$extension:postgis.geometry": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc3"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc4"]>>;
  "cast:$extension:postgis.geography->pg_catalog.bytea": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc3"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc8"]>>;
  "cast:$extension:postgis.geometry->$extension:postgis.box2d": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc4"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc0"]>>;
  "cast:$extension:postgis.geometry->$extension:postgis.box3d": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc4"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc2"]>>;
  "cast:$extension:postgis.geometry->$extension:postgis.geography": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc4"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc3"]>>;
  "cast:$extension:postgis.geometry->$extension:postgis.geometry": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc4"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc4"]>>;
  "cast:$extension:postgis.geometry->pg_catalog.box": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc4"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc7"]>>;
  "cast:$extension:postgis.geometry->pg_catalog.bytea": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc4"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc8"]>>;
  "cast:$extension:postgis.geometry->pg_catalog.json": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc4"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc9"]>>;
  "cast:$extension:postgis.geometry->pg_catalog.jsonb": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc4"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc10"]>>;
  "cast:$extension:postgis.geometry->pg_catalog.path": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc4"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc11"]>>;
  "cast:$extension:postgis.geometry->pg_catalog.point": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc4"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc12"]>>;
  "cast:$extension:postgis.geometry->pg_catalog.polygon": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc4"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc13"]>>;
  "cast:$extension:postgis.geometry->pg_catalog.text": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc4"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc14"]>>;
  "cast:pg_catalog.bytea->$extension:postgis.geography": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc8"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc3"]>>;
  "cast:pg_catalog.bytea->$extension:postgis.geometry": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc8"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc4"]>>;
  "cast:pg_catalog.path->$extension:postgis.geometry": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc11"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc4"]>>;
  "cast:pg_catalog.point->$extension:postgis.geometry": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc12"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc4"]>>;
  "cast:pg_catalog.polygon->$extension:postgis.geometry": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc13"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc4"]>>;
  "cast:pg_catalog.text->$extension:postgis.geometry": (
    value: ExtensionSqlInput<PostgisCodecDefinitions["nc14"]>,
  ) => ReturnType<typeof checkedExtensionExpression<PostgisCodecDefinitions["nc4"]>>;
  "operator:$extension:postgis.@($extension:postgis.box2df,$extension:postgis.box2df)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc1"],
      PostgisCodecDefinitions["nc1"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.@($extension:postgis.box2df,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc1"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.@($extension:postgis.geometry,$extension:postgis.box2df)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc1"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.@($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.@@($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.@>>($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&/&($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&&($extension:postgis.box2df,$extension:postgis.box2df)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc1"],
      PostgisCodecDefinitions["nc1"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&&($extension:postgis.box2df,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc1"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&&($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&&($extension:postgis.geography,$extension:postgis.gidx)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc5"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&&($extension:postgis.geometry,$extension:postgis.box2df)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc1"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&&($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&&($extension:postgis.gidx,$extension:postgis.geography)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc5"],
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&&($extension:postgis.gidx,$extension:postgis.gidx)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc5"],
      PostgisCodecDefinitions["nc5"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&&&($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&&&($extension:postgis.geometry,$extension:postgis.gidx)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc5"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&&&($extension:postgis.gidx,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc5"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&&&($extension:postgis.gidx,$extension:postgis.gidx)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc5"],
      PostgisCodecDefinitions["nc5"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&<($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&<|($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.&>($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.<->($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "operator:$extension:postgis.<->($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "operator:$extension:postgis.<($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.<($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.<#>($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "operator:$extension:postgis.<<->>($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "operator:$extension:postgis.<<($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.<<@($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.<<|($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.<=($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.<=($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.<>($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.=($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.=($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.>($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.>($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.>=($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc3"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.>=($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.>>($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.|&>($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.|=|($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "operator:$extension:postgis.|>>($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.~($extension:postgis.box2df,$extension:postgis.box2df)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc1"],
      PostgisCodecDefinitions["nc1"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.~($extension:postgis.box2df,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc1"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.~($extension:postgis.geometry,$extension:postgis.box2df)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc1"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.~($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.~=($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.~==($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.~~($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "operator:$extension:postgis.~~=($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlOperator<
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc4"],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._postgis_deprecate(pg_catalog.text,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc17"]
    >
  >;
  "routine:$extension:postgis._postgis_index_extent(pg_catalog.regclass,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc18"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis._postgis_join_selectivity(pg_catalog.regclass,pg_catalog.text,pg_catalog.regclass,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc18"],
        PostgisCodecDefinitions["nc14"],
        PostgisCodecDefinitions["nc18"],
        PostgisCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], undefined>,
      ],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis._postgis_pgsql_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis._postgis_scripts_pgsql_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis._postgis_selectivity(pg_catalog.regclass,pg_catalog.text,$extension:postgis.geometry,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc18"],
        PostgisCodecDefinitions["nc14"],
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "mode">,
      ],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis._postgis_stats(pg_catalog.regclass,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc18"],
        PostgisCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], undefined>,
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis._st_3ddfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_3ddwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_3dintersects($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_asgml(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc19"],
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc19"],
        PostgisCodecDefinitions["nc19"],
        PostgisCodecDefinitions["nc14"],
        PostgisCodecDefinitions["nc14"],
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis._st_asx3d(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc19"],
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc19"],
        PostgisCodecDefinitions["nc19"],
        PostgisCodecDefinitions["nc14"],
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis._st_bestsrid($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc19"]
    >
  >;
  "routine:$extension:postgis._st_bestsrid($extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc3"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis._st_contains($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_containsproperly($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_coveredby($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_coveredby($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_covers($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_covers($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_crosses($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_dfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_distancetree($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc15"],
      ],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis._st_distancetree($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc15"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc15"],
      ],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis._st_dwithin($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "use_spheroid">,
      ],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_dwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_dwithinuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc15"],
      ],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_dwithinuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_equals($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_expand($extension:postgis.geography,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis._st_geomfromgml(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis._st_intersects($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_linecrossingdirection($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc19"]
    >
  >;
  "routine:$extension:postgis._st_longestline($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis._st_maxdistance($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis._st_orderingequals($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_overlaps($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_pointoutside($extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc3"]], PostgisCodecDefinitions["nc3"]>
  >;
  "routine:$extension:postgis._st_sortablehash($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc20"]>
  >;
  "routine:$extension:postgis._st_touches($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis._st_voronoi($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc4"], "clip">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "tolerance">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "return_polygons">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis._st_within($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.box($extension:postgis.box3d)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc2"]], PostgisCodecDefinitions["nc7"]>
  >;
  "routine:$extension:postgis.box($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc7"]>
  >;
  "routine:$extension:postgis.box2d($extension:postgis.box3d)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc2"]], PostgisCodecDefinitions["nc0"]>
  >;
  "routine:$extension:postgis.box2d($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc0"]>
  >;
  "routine:$extension:postgis.box3d($extension:postgis.box2d)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc0"]], PostgisCodecDefinitions["nc2"]>
  >;
  "routine:$extension:postgis.box3d($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc2"]>
  >;
  "routine:$extension:postgis.box3dtobox($extension:postgis.box3d)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc2"]], PostgisCodecDefinitions["nc7"]>
  >;
  "routine:$extension:postgis.bytea($extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc3"]], PostgisCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis.bytea($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis.contains_2d($extension:postgis.box2df,$extension:postgis.box2df)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc1"], PostgisCodecDefinitions["nc1"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.contains_2d($extension:postgis.box2df,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc1"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.contains_2d($extension:postgis.geometry,$extension:postgis.box2df)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc1"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.equals($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.find_srid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc21"], PostgisCodecDefinitions["nc21"], PostgisCodecDefinitions["nc21"]],
      PostgisCodecDefinitions["nc19"]
    >
  >;
  "routine:$extension:postgis.geography_cmp($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc19"]
    >
  >;
  "routine:$extension:postgis.geography_distance_knn($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.geography_eq($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geography_ge($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geography_gt($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geography_le($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geography_lt($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geography_overlaps($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geography_send($extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc3"]], PostgisCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis.geography($extension:postgis.geography,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc19"], PostgisCodecDefinitions["nc15"]],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.geography($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc3"]>
  >;
  "routine:$extension:postgis.geography(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc3"]>
  >;
  "routine:$extension:postgis.geometry_above($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_below($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_cmp($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc19"]
    >
  >;
  "routine:$extension:postgis.geometry_contained_3d($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_contains_3d($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_contains_nd($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_contains($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_distance_box($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.geometry_distance_centroid_nd($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.geometry_distance_centroid($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.geometry_distance_cpa($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.geometry_eq($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_ge($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_gt($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_hash($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.geometry_le($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_left($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_lt($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_neq($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_overabove($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_overbelow($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_overlaps_3d($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_overlaps_nd($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_overlaps($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_overleft($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_overright($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_right($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_same_3d($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_same_nd($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_same($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_send($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis.geometry_within_nd($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry_within($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.geometry($extension:postgis.box2d)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc0"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.geometry($extension:postgis.box3d)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc2"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.geometry($extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc3"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.geometry($extension:postgis.geometry,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"], PostgisCodecDefinitions["nc15"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.geometry(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.geometry(pg_catalog.path)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc11"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.geometry(pg_catalog.point)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc12"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.geometry(pg_catalog.polygon)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc13"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.geometry(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.geometrytype($extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc3"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.geometrytype($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.geomfromewkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.geomfromewkt(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.get_proj4_from_srid(pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc19"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.is_contained_2d($extension:postgis.box2df,$extension:postgis.box2df)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc1"], PostgisCodecDefinitions["nc1"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.is_contained_2d($extension:postgis.box2df,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc1"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.is_contained_2d($extension:postgis.geometry,$extension:postgis.box2df)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc1"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.json($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc9"]>
  >;
  "routine:$extension:postgis.jsonb($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc10"]>
  >;
  "routine:$extension:postgis.overlaps_2d($extension:postgis.box2df,$extension:postgis.box2df)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc1"], PostgisCodecDefinitions["nc1"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.overlaps_2d($extension:postgis.box2df,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc1"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.overlaps_2d($extension:postgis.geometry,$extension:postgis.box2df)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc1"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.overlaps_geog($extension:postgis.geography,$extension:postgis.gidx)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc5"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.overlaps_geog($extension:postgis.gidx,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc5"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.overlaps_geog($extension:postgis.gidx,$extension:postgis.gidx)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc5"], PostgisCodecDefinitions["nc5"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.overlaps_nd($extension:postgis.geometry,$extension:postgis.gidx)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc5"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.overlaps_nd($extension:postgis.gidx,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc5"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.overlaps_nd($extension:postgis.gidx,$extension:postgis.gidx)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc5"], PostgisCodecDefinitions["nc5"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.path($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc11"]>
  >;
  "routine:$extension:postgis.point($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc12"]>
  >;
  "routine:$extension:postgis.polygon($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc13"]>
  >;
  "routine:$extension:postgis.postgis_addbbox($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.postgis_constraint_dims(pg_catalog.text,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc19"]
    >
  >;
  "routine:$extension:postgis.postgis_constraint_srid(pg_catalog.text,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc19"]
    >
  >;
  "routine:$extension:postgis.postgis_constraint_type(pg_catalog.text,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc21"]
    >
  >;
  "routine:$extension:postgis.postgis_dropbbox($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.postgis_full_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_geos_compiled_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_geos_noop($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.postgis_geos_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_getbbox($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc0"]>
  >;
  "routine:$extension:postgis.postgis_hasbbox($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc15"]>
  >;
  "routine:$extension:postgis.postgis_lib_build_date()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_lib_revision()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_lib_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_libjson_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_liblwgeom_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_libprotobuf_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_libxml_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_noop($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.postgis_proj_compiled_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_proj_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_scripts_build_date()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_scripts_installed()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_scripts_released()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_srs_all()": ReturnType<
    typeof createSqlFunction<
      readonly [],
      ReturnType<
        typeof nullableCodec<
          CodecInput<
            ReturnType<
              typeof compositeCodec<{
                auth_name: PostgisCodecDefinitions["nc14"];
                auth_srid: PostgisCodecDefinitions["nc14"];
                srname: PostgisCodecDefinitions["nc14"];
                srtext: PostgisCodecDefinitions["nc14"];
                proj4text: PostgisCodecDefinitions["nc14"];
                point_sw: PostgisCodecDefinitions["nc4"];
                point_ne: PostgisCodecDefinitions["nc4"];
              }>
            >
          >,
          CodecOutput<
            ReturnType<
              typeof compositeCodec<{
                auth_name: PostgisCodecDefinitions["nc14"];
                auth_srid: PostgisCodecDefinitions["nc14"];
                srname: PostgisCodecDefinitions["nc14"];
                srtext: PostgisCodecDefinitions["nc14"];
                proj4text: PostgisCodecDefinitions["nc14"];
                point_sw: PostgisCodecDefinitions["nc4"];
                point_ne: PostgisCodecDefinitions["nc4"];
              }>
            >
          >
        >
      >
    >
  >;
  "routine:$extension:postgis.postgis_srs_codes(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_srs_search($extension:postgis.geometry,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "authname">],
      ReturnType<
        typeof nullableCodec<
          CodecInput<
            ReturnType<
              typeof compositeCodec<{
                auth_name: PostgisCodecDefinitions["nc14"];
                auth_srid: PostgisCodecDefinitions["nc14"];
                srname: PostgisCodecDefinitions["nc14"];
                srtext: PostgisCodecDefinitions["nc14"];
                proj4text: PostgisCodecDefinitions["nc14"];
                point_sw: PostgisCodecDefinitions["nc4"];
                point_ne: PostgisCodecDefinitions["nc4"];
              }>
            >
          >,
          CodecOutput<
            ReturnType<
              typeof compositeCodec<{
                auth_name: PostgisCodecDefinitions["nc14"];
                auth_srid: PostgisCodecDefinitions["nc14"];
                srname: PostgisCodecDefinitions["nc14"];
                srtext: PostgisCodecDefinitions["nc14"];
                proj4text: PostgisCodecDefinitions["nc14"];
                point_sw: PostgisCodecDefinitions["nc4"];
                point_ne: PostgisCodecDefinitions["nc4"];
              }>
            >
          >
        >
      >
    >
  >;
  "routine:$extension:postgis.postgis_srs(pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      ReturnType<
        typeof nullableCodec<
          CodecInput<
            ReturnType<
              typeof compositeCodec<{
                auth_name: PostgisCodecDefinitions["nc14"];
                auth_srid: PostgisCodecDefinitions["nc14"];
                srname: PostgisCodecDefinitions["nc14"];
                srtext: PostgisCodecDefinitions["nc14"];
                proj4text: PostgisCodecDefinitions["nc14"];
                point_sw: PostgisCodecDefinitions["nc4"];
                point_ne: PostgisCodecDefinitions["nc4"];
              }>
            >
          >,
          CodecOutput<
            ReturnType<
              typeof compositeCodec<{
                auth_name: PostgisCodecDefinitions["nc14"];
                auth_srid: PostgisCodecDefinitions["nc14"];
                srname: PostgisCodecDefinitions["nc14"];
                srtext: PostgisCodecDefinitions["nc14"];
                proj4text: PostgisCodecDefinitions["nc14"];
                point_sw: PostgisCodecDefinitions["nc4"];
                point_ne: PostgisCodecDefinitions["nc4"];
              }>
            >
          >
        >
      >
    >
  >;
  "routine:$extension:postgis.postgis_svn_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_transform_geometry($extension:postgis.geometry,pg_catalog.text,pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc14"],
        PostgisCodecDefinitions["nc14"],
        PostgisCodecDefinitions["nc19"],
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.postgis_transform_pipeline_geometry($extension:postgis.geometry,pg_catalog.text,pg_catalog.bool,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc14"],
        PostgisCodecDefinitions["nc15"],
        PostgisCodecDefinitions["nc19"],
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.postgis_type_name(pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc21"],
        PostgisCodecDefinitions["nc19"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "use_new_name">,
      ],
      PostgisCodecDefinitions["nc21"]
    >
  >;
  "routine:$extension:postgis.postgis_typmod_dims(pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc19"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.postgis_typmod_srid(pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc19"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.postgis_typmod_type(pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc19"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.postgis_wagyu_version()": ReturnType<
    typeof createSqlFunction<readonly [], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_3dclosestpoint($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_3ddfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_3ddistance($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_3ddwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_3dextent($extension:postgis.geometry)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc2"]>
  >;
  "routine:$extension:postgis.st_3dintersects($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_3dlength($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_3dlineinterpolatepoint($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_3dlongestline($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_3dmakebox($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc2"]
    >
  >;
  "routine:$extension:postgis.st_3dmaxdistance($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_3dperimeter($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_3dshortestline($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_addmeasure($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_addpoint($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_addpoint($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_affine($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_affine($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_angle($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc4"], "pt4">,
      ],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_angle($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_area($extension:postgis.geography,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "use_spheroid">],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_area($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_area(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_area2d($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_asbinary($extension:postgis.geography,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis.st_asbinary($extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc3"]], PostgisCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis.st_asbinary($extension:postgis.geometry,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis.st_asbinary($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis.st_asencodedpolyline($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "nprecision">],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_asewkb($extension:postgis.geometry,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis.st_asewkb($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis.st_asewkt($extension:postgis.geography,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_asewkt($extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc3"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_asewkt($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_asewkt($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_asewkt(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement,pg_catalog.bool,pg_catalog.text)": ReturnType<
    typeof createSqlAggregate<
      readonly [PostgisCodecDefinitions["nc26"], PostgisCodecDefinitions["nc15"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement,pg_catalog.bool)": ReturnType<
    typeof createSqlAggregate<
      readonly [PostgisCodecDefinitions["nc26"], PostgisCodecDefinitions["nc15"]],
      PostgisCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisCodecDefinitions["nc26"]], PostgisCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis.st_asgeobuf(pg_catalog.anyelement,pg_catalog.text)": ReturnType<
    typeof createSqlAggregate<
      readonly [PostgisCodecDefinitions["nc26"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis.st_asgeobuf(pg_catalog.anyelement)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisCodecDefinitions["nc26"]], PostgisCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis.st_asgeojson($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxdecimaldigits">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "options">,
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_asgeojson($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxdecimaldigits">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "options">,
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_asgeojson(pg_catalog.record,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc27"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "geom_column">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxdecimaldigits">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "pretty_bool">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "id_column">,
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_asgeojson(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_asgml($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxdecimaldigits">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "options">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "nprefix">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "id">,
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_asgml($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxdecimaldigits">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "options">,
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_asgml(pg_catalog.int4,$extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc19"],
        PostgisCodecDefinitions["nc3"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxdecimaldigits">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "options">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "nprefix">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "id">,
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_asgml(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc19"],
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxdecimaldigits">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "options">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "nprefix">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "id">,
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_asgml(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_ashexewkb($extension:postgis.geometry,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_ashexewkb($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_askml($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxdecimaldigits">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "nprefix">,
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_askml($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxdecimaldigits">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "nprefix">,
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_askml(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_aslatlontext($extension:postgis.geometry,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "tmpl">],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_asmarc21($extension:postgis.geometry,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "format">],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlAggregate<
      readonly [
        PostgisCodecDefinitions["nc26"],
        PostgisCodecDefinitions["nc14"],
        PostgisCodecDefinitions["nc19"],
        PostgisCodecDefinitions["nc14"],
        PostgisCodecDefinitions["nc14"],
      ],
      PostgisCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text)": ReturnType<
    typeof createSqlAggregate<
      readonly [
        PostgisCodecDefinitions["nc26"],
        PostgisCodecDefinitions["nc14"],
        PostgisCodecDefinitions["nc19"],
        PostgisCodecDefinitions["nc14"],
      ],
      PostgisCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlAggregate<
      readonly [PostgisCodecDefinitions["nc26"], PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text)": ReturnType<
    typeof createSqlAggregate<
      readonly [PostgisCodecDefinitions["nc26"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisCodecDefinitions["nc26"]], PostgisCodecDefinitions["nc8"]>
  >;
  "routine:$extension:postgis.st_asmvtgeom($extension:postgis.geometry,$extension:postgis.box2d,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "extent">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "buffer">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "clip_geom">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_assvg($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "rel">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxdecimaldigits">,
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_assvg($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "rel">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxdecimaldigits">,
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_assvg(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_astext($extension:postgis.geography,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_astext($extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc3"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_astext($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_astext($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_astext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_astwkb($extension:postgis._geometry,pg_catalog._int8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc35"],
        PostgisCodecDefinitions["nc28"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "prec">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "prec_z">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "prec_m">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "with_sizes">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "with_boxes">,
      ],
      PostgisCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis.st_astwkb($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "prec">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "prec_z">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "prec_m">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "with_sizes">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "with_boxes">,
      ],
      PostgisCodecDefinitions["nc8"]
    >
  >;
  "routine:$extension:postgis.st_asx3d($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxdecimaldigits">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "options">,
      ],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_azimuth($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_azimuth($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_bdmpolyfromtext(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_bdpolyfromtext(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_boundary($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_boundingdiagonal($extension:postgis.geometry,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "fits">],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_box2dfromgeohash(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], DefaultSqlArgument<PostgisCodecDefinitions["nc19"], undefined>],
      PostgisCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.st_buffer($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_buffer($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "options">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_buildarea($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_centroid($extension:postgis.geography,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "use_spheroid">],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.st_centroid($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_centroid(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_chaikinsmoothing($extension:postgis.geometry,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], undefined>,
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], undefined>,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_cleangeometry($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_clipbybox2d($extension:postgis.geometry,$extension:postgis.box2d)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc0"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_closestpoint($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc3"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "use_spheroid">,
      ],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.st_closestpoint($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_closestpoint(pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_closestpointofapproach($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_clusterdbscan($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)": ReturnType<
    typeof createSqlWindow<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc19"]
    >
  >;
  "routine:$extension:postgis.st_clusterintersecting($extension:postgis._geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc35"]], PostgisCodecDefinitions["nc35"]>
  >;
  "routine:$extension:postgis.st_clusterintersecting($extension:postgis.geometry)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc35"]>
  >;
  "routine:$extension:postgis.st_clusterintersectingwin($extension:postgis.geometry)": ReturnType<
    typeof createSqlWindow<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.st_clusterkmeans($extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)": ReturnType<
    typeof createSqlWindow<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc19"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "max_radius">,
      ],
      PostgisCodecDefinitions["nc19"]
    >
  >;
  "routine:$extension:postgis.st_clusterwithin($extension:postgis._geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc35"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc35"]
    >
  >;
  "routine:$extension:postgis.st_clusterwithin($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlAggregate<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc35"]
    >
  >;
  "routine:$extension:postgis.st_clusterwithinwin($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlWindow<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc19"]
    >
  >;
  "routine:$extension:postgis.st_collect($extension:postgis._geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc35"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_collect($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_collect($extension:postgis.geometry)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_collectionextract($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_collectionextract($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_collectionhomogenize($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_combinebbox($extension:postgis.box2d,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc0"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis.st_combinebbox($extension:postgis.box3d,$extension:postgis.box3d)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc2"], PostgisCodecDefinitions["nc2"]],
      PostgisCodecDefinitions["nc2"]
    >
  >;
  "routine:$extension:postgis.st_combinebbox($extension:postgis.box3d,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc2"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc2"]
    >
  >;
  "routine:$extension:postgis.st_concavehull($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "param_allow_holes">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_contains($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_containsproperly($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_convexhull($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_coorddim($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc25"]>
  >;
  "routine:$extension:postgis.st_coverageclean($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.text)": ReturnType<
    typeof createSqlWindow<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "gapmaximumwidth">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "snappingdistance">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "overlapmergestrategy">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_coverageinvalidedges($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlWindow<
      readonly [PostgisCodecDefinitions["nc4"], DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "tolerance">],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_coveragesimplify($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlWindow<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "simplifyboundary">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_coverageunion($extension:postgis._geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc35"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_coverageunion($extension:postgis.geometry)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_coveredby($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_coveredby($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_coveredby(pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_covers($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_covers($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_covers(pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_cpawithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_crosses($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_curven($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_curvetoline($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "tol">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "toltype">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "flags">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_delaunaytriangles($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "tolerance">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "flags">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_dfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_difference($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "gridsize">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_dimension($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.st_disjoint($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_distance($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc3"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "use_spheroid">,
      ],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_distance($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_distance(pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_distancecpa($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_distancesphere($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_distancesphere($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_distancespheroid($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.spheroid)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc6"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_distancespheroid($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_dump($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc40"]>
  >;
  "routine:$extension:postgis.st_dumppoints($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc40"]>
  >;
  "routine:$extension:postgis.st_dumprings($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc40"]>
  >;
  "routine:$extension:postgis.st_dumpsegments($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc40"]>
  >;
  "routine:$extension:postgis.st_dwithin($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "use_spheroid">,
      ],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_dwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_dwithin(pg_catalog.text,pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_endpoint($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_envelope($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_equals($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc14"],
        PostgisCodecDefinitions["nc14"],
        PostgisCodecDefinitions["nc14"],
        PostgisCodecDefinitions["nc15"],
      ],
      PostgisCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis.st_expand($extension:postgis.box2d,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc0"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis.st_expand($extension:postgis.box2d,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc0"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis.st_expand($extension:postgis.box3d,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc2"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "dz">,
      ],
      PostgisCodecDefinitions["nc2"]
    >
  >;
  "routine:$extension:postgis.st_expand($extension:postgis.box3d,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc2"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc2"]
    >
  >;
  "routine:$extension:postgis.st_expand($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "dz">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "dm">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_expand($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_extent($extension:postgis.geometry)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc0"]>
  >;
  "routine:$extension:postgis.st_exteriorring($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_filterbym($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], undefined>,
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], undefined>,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_findextent(pg_catalog.text,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis.st_findextent(pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis.st_flipcoordinates($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_force2d($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_force3d($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "zvalue">],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_force3dm($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "mvalue">],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_force3dz($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "zvalue">],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_force4d($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "zvalue">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "mvalue">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_forcecollection($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_forcecurve($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_forcepolygonccw($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_forcepolygoncw($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_forcerhr($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_forcesfs($extension:postgis.geometry,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_forcesfs($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_frechetdistance($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], undefined>,
      ],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_fromflatgeobuf(pg_catalog.anyelement,pg_catalog.bytea)": <Input, Output>(
    concrete: ExtensionCodec<Input, Output>,
  ) => ReturnType<
    typeof createSqlFunction<
      readonly [ExtensionCodec<Input | null, Output | null>, PostgisCodecDefinitions["nc8"]],
      ExtensionCodec<Input | null, Output | null>
    >
  >;
  "routine:$extension:postgis.st_generatepoints($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_generatepoints($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_geogfromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc3"]>
  >;
  "routine:$extension:postgis.st_geogfromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc3"]>
  >;
  "routine:$extension:postgis.st_geographyfromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc3"]>
  >;
  "routine:$extension:postgis.st_geohash($extension:postgis.geography,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxchars">],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_geohash($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxchars">],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_geomcollfromtext(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_geomcollfromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_geomcollfromwkb(pg_catalog.bytea,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc8"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_geomcollfromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_geometricmedian($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "tolerance">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "max_iter">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "fail_if_not_converged">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_geometryfromtext(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_geometryfromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_geometryn($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_geometrytype($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_geomfromewkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_geomfromewkt(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_geomfromgeohash(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], DefaultSqlArgument<PostgisCodecDefinitions["nc19"], undefined>],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_geomfromgeojson(pg_catalog.json)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc9"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_geomfromgeojson(pg_catalog.jsonb)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc10"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_geomfromgeojson(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_geomfromgml(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_geomfromgml(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_geomfromkml(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_geomfrommarc21(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_geomfromtext(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_geomfromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_geomfromtwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_geomfromwkb(pg_catalog.bytea,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc8"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_geomfromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_gmltosql(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_gmltosql(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_hasarc($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc15"]>
  >;
  "routine:$extension:postgis.st_hasm($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc15"]>
  >;
  "routine:$extension:postgis.st_hasz($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc15"]>
  >;
  "routine:$extension:postgis.st_hausdorffdistance($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_hausdorffdistance($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_hexagon(pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc19"],
        PostgisCodecDefinitions["nc19"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc4"], "origin">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_hexagongrid(pg_catalog.float8,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc4"]],
      ReturnType<
        typeof nullableCodec<
          CodecInput<
            ReturnType<
              typeof compositeCodec<{
                geom: PostgisCodecDefinitions["nc4"];
                i: PostgisCodecDefinitions["nc19"];
                j: PostgisCodecDefinitions["nc19"];
              }>
            >
          >,
          CodecOutput<
            ReturnType<
              typeof compositeCodec<{
                geom: PostgisCodecDefinitions["nc4"];
                i: PostgisCodecDefinitions["nc19"];
                j: PostgisCodecDefinitions["nc19"];
              }>
            >
          >
        >
      >
    >
  >;
  "routine:$extension:postgis.st_interiorringn($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_interpolatepoint($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_intersection($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.st_intersection($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "gridsize">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_intersection(pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_intersects($extension:postgis.geography,$extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_intersects($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_intersects(pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_inversetransformpipeline($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "to_srid">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_isclosed($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc15"]>
  >;
  "routine:$extension:postgis.st_iscollection($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc15"]>
  >;
  "routine:$extension:postgis.st_isempty($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc15"]>
  >;
  "routine:$extension:postgis.st_ispolygonccw($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc15"]>
  >;
  "routine:$extension:postgis.st_ispolygoncw($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc15"]>
  >;
  "routine:$extension:postgis.st_isring($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc15"]>
  >;
  "routine:$extension:postgis.st_issimple($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc15"]>
  >;
  "routine:$extension:postgis.st_isvalid($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_isvalid($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc15"]>
  >;
  "routine:$extension:postgis.st_isvaliddetail($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "flags">],
      PostgisCodecDefinitions["nc42"]
    >
  >;
  "routine:$extension:postgis.st_isvalidreason($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_isvalidreason($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_isvalidtrajectory($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc15"]>
  >;
  "routine:$extension:postgis.st_largestemptycircle($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "tolerance">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc4"], "boundary">,
      ],
      ReturnType<
        typeof nullableCodec<
          CodecInput<
            ReturnType<
              typeof compositeCodec<{
                center: PostgisCodecDefinitions["nc4"];
                nearest: PostgisCodecDefinitions["nc4"];
                radius: PostgisCodecDefinitions["nc16"];
              }>
            >
          >,
          CodecOutput<
            ReturnType<
              typeof compositeCodec<{
                center: PostgisCodecDefinitions["nc4"];
                nearest: PostgisCodecDefinitions["nc4"];
                radius: PostgisCodecDefinitions["nc16"];
              }>
            >
          >
        >
      >
    >
  >;
  "routine:$extension:postgis.st_length($extension:postgis.geography,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "use_spheroid">],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_length($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_length(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_length2d($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_length2dspheroid($extension:postgis.geometry,$extension:postgis.spheroid)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc6"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_lengthspheroid($extension:postgis.geometry,$extension:postgis.spheroid)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc6"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_letters(pg_catalog.text,pg_catalog.json)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], DefaultSqlArgument<PostgisCodecDefinitions["nc9"], "font">],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_linecrossingdirection($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc19"]
    >
  >;
  "routine:$extension:postgis.st_lineextend($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "distance_backward">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_linefromencodedpolyline(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "nprecision">],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_linefrommultipoint($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_linefromtext(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_linefromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_linefromwkb(pg_catalog.bytea,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc8"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_linefromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_lineinterpolatepoint($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "use_spheroid">,
      ],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.st_lineinterpolatepoint($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_lineinterpolatepoint(pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_lineinterpolatepoints($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "use_spheroid">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "repeat">,
      ],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.st_lineinterpolatepoints($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "repeat">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_lineinterpolatepoints(pg_catalog.text,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_linelocatepoint($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc3"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "use_spheroid">,
      ],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_linelocatepoint($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_linelocatepoint(pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_linemerge($extension:postgis.geometry,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc15"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_linemerge($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_linestringfromwkb(pg_catalog.bytea,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc8"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_linestringfromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_linesubstring($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.st_linesubstring($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_linesubstring(pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_linetocurve($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_locatealong($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "leftrightoffset">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_locatebetween($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "leftrightoffset">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_locatebetweenelevations($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_longestline($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_m($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_makebox2d($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc0"]
    >
  >;
  "routine:$extension:postgis.st_makeenvelope(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], undefined>,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_makeline($extension:postgis._geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc35"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_makeline($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_makeline($extension:postgis.geometry)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_makepointm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_makepolygon($extension:postgis.geometry,$extension:postgis._geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc35"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_makepolygon($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_makevalid($extension:postgis.geometry,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_makevalid($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_maxdistance($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_maximuminscribedcircle($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"]],
      ReturnType<
        typeof nullableCodec<
          CodecInput<
            ReturnType<
              typeof compositeCodec<{
                center: PostgisCodecDefinitions["nc4"];
                nearest: PostgisCodecDefinitions["nc4"];
                radius: PostgisCodecDefinitions["nc16"];
              }>
            >
          >,
          CodecOutput<
            ReturnType<
              typeof compositeCodec<{
                center: PostgisCodecDefinitions["nc4"];
                nearest: PostgisCodecDefinitions["nc4"];
                radius: PostgisCodecDefinitions["nc16"];
              }>
            >
          >
        >
      >
    >
  >;
  "routine:$extension:postgis.st_memcollect($extension:postgis.geometry)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_memsize($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.st_memunion($extension:postgis.geometry)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_minimumboundingcircle($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "segs_per_quarter">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_minimumboundingradius($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"]],
      ReturnType<
        typeof nullableCodec<
          CodecInput<
            ReturnType<
              typeof compositeCodec<{ center: PostgisCodecDefinitions["nc4"]; radius: PostgisCodecDefinitions["nc16"] }>
            >
          >,
          CodecOutput<
            ReturnType<
              typeof compositeCodec<{ center: PostgisCodecDefinitions["nc4"]; radius: PostgisCodecDefinitions["nc16"] }>
            >
          >
        >
      >
    >
  >;
  "routine:$extension:postgis.st_minimumclearance($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_minimumclearanceline($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_mlinefromtext(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_mlinefromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_mlinefromwkb(pg_catalog.bytea,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc8"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_mlinefromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_mpointfromtext(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_mpointfromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_mpointfromwkb(pg_catalog.bytea,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc8"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_mpointfromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_mpolyfromtext(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_mpolyfromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_mpolyfromwkb(pg_catalog.bytea,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc8"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_mpolyfromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_multi($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_multilinefromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_multilinestringfromtext(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_multilinestringfromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_multipointfromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_multipointfromwkb(pg_catalog.bytea,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc8"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_multipointfromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_multipolyfromwkb(pg_catalog.bytea,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc8"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_multipolyfromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_multipolygonfromtext(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_multipolygonfromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_ndims($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc25"]>
  >;
  "routine:$extension:postgis.st_node($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_normalize($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_npoints($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.st_nrings($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.st_numcurves($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.st_numgeometries($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.st_numinteriorring($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.st_numinteriorrings($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.st_numpatches($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.st_numpoints($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.st_offsetcurve($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc14"], "params">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_orderingequals($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_orientedenvelope($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_overlaps($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_patchn($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_perimeter($extension:postgis.geography,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "use_spheroid">],
      PostgisCodecDefinitions["nc16"]
    >
  >;
  "routine:$extension:postgis.st_perimeter($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_perimeter2d($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_point(pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_point(pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_pointfromgeohash(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], DefaultSqlArgument<PostgisCodecDefinitions["nc19"], undefined>],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_pointfromtext(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_pointfromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_pointfromwkb(pg_catalog.bytea,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc8"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_pointfromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_pointinsidecircle($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
      ],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_pointm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "srid">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_pointn($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_pointonsurface($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_points($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_pointz(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "srid">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_pointzm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "srid">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_polyfromtext(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_polyfromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_polyfromwkb(pg_catalog.bytea,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc8"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_polyfromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_polygon($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_polygonfromtext(pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_polygonfromtext(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_polygonfromwkb(pg_catalog.bytea,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc8"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_polygonfromwkb(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_polygonize($extension:postgis._geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc35"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_polygonize($extension:postgis.geometry)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_project($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.st_project($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.st_project($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_project($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_quantizecoordinates($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc19"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "prec_y">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "prec_z">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "prec_m">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_reduceprecision($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc14"]
    >
  >;
  "routine:$extension:postgis.st_relatematch(pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_removeirrelevantpointsforview($extension:postgis.geometry,$extension:postgis.box2d,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc0"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], undefined>,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_removepoint($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_removerepeatedpoints($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "tolerance">],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_removesmallparts($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_reverse($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_rotatex($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_rotatey($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_rotatez($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_scale($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_scale($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_scale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_scale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_scroll($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_segmentize($extension:postgis.geography,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.st_segmentize($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_seteffectivearea($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], undefined>,
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], undefined>,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_setpoint($extension:postgis.geometry,pg_catalog.int4,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_setsrid($extension:postgis.geography,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc3"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.st_setsrid($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_sharedpaths($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_shiftlongitude($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_shortestline($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc3"],
        PostgisCodecDefinitions["nc3"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "use_spheroid">,
      ],
      PostgisCodecDefinitions["nc3"]
    >
  >;
  "routine:$extension:postgis.st_shortestline($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_shortestline(pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_simplify($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc15"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_simplify($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_simplifypolygonhull($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc15"], "is_outer">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_simplifypreservetopology($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_simplifyvw($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_snap($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_split($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_square(pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc19"],
        PostgisCodecDefinitions["nc19"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc4"], "origin">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_squaregrid(pg_catalog.float8,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc4"]],
      ReturnType<
        typeof nullableCodec<
          CodecInput<
            ReturnType<
              typeof compositeCodec<{
                geom: PostgisCodecDefinitions["nc4"];
                i: PostgisCodecDefinitions["nc19"];
                j: PostgisCodecDefinitions["nc19"];
              }>
            >
          >,
          CodecOutput<
            ReturnType<
              typeof compositeCodec<{
                geom: PostgisCodecDefinitions["nc4"];
                i: PostgisCodecDefinitions["nc19"];
                j: PostgisCodecDefinitions["nc19"];
              }>
            >
          >
        >
      >
    >
  >;
  "routine:$extension:postgis.st_srid($extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc3"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.st_srid($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc19"]>
  >;
  "routine:$extension:postgis.st_startpoint($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_subdivide($extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "maxvertices">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "gridsize">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_summary($extension:postgis.geography)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc3"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_summary($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc14"]>
  >;
  "routine:$extension:postgis.st_swapordinates($extension:postgis.geometry,pg_catalog.cstring)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc22"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_symdifference($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "gridsize">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_symmetricdifference($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_tileenvelope(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc19"],
        PostgisCodecDefinitions["nc19"],
        PostgisCodecDefinitions["nc19"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc4"], "bounds">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "margin">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_touches($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc19"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc14"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc14"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_transformpipeline($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc14"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc19"], "to_srid">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_translate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_translate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_transscale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
        PostgisCodecDefinitions["nc16"],
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_triangulatepolygon($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_unaryunion($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "gridsize">],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_union($extension:postgis._geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc35"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_union($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_union($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_union($extension:postgis.geometry,pg_catalog.float8)": ReturnType<
    typeof createSqlAggregate<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_union($extension:postgis.geometry)": ReturnType<
    typeof createSqlAggregate<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_voronoilines($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "tolerance">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc4"], "extend_to">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_voronoipolygons($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [
        PostgisCodecDefinitions["nc4"],
        DefaultSqlArgument<PostgisCodecDefinitions["nc16"], "tolerance">,
        DefaultSqlArgument<PostgisCodecDefinitions["nc4"], "extend_to">,
      ],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_within($extension:postgis.geometry,$extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc4"]],
      PostgisCodecDefinitions["nc15"]
    >
  >;
  "routine:$extension:postgis.st_wkbtosql(pg_catalog.bytea)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc8"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_wkttosql(pg_catalog.text)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc14"]], PostgisCodecDefinitions["nc4"]>
  >;
  "routine:$extension:postgis.st_wrapx($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": ReturnType<
    typeof createSqlFunction<
      readonly [PostgisCodecDefinitions["nc4"], PostgisCodecDefinitions["nc16"], PostgisCodecDefinitions["nc16"]],
      PostgisCodecDefinitions["nc4"]
    >
  >;
  "routine:$extension:postgis.st_x($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_xmax($extension:postgis.box3d)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc2"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_xmin($extension:postgis.box3d)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc2"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_y($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_ymax($extension:postgis.box3d)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc2"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_ymin($extension:postgis.box3d)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc2"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_z($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_zmax($extension:postgis.box3d)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc2"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.st_zmflag($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc25"]>
  >;
  "routine:$extension:postgis.st_zmin($extension:postgis.box3d)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc2"]], PostgisCodecDefinitions["nc16"]>
  >;
  "routine:$extension:postgis.text($extension:postgis.geometry)": ReturnType<
    typeof createSqlFunction<readonly [PostgisCodecDefinitions["nc4"]], PostgisCodecDefinitions["nc14"]>
  >;
}
export interface PostgisFunctions {
  _postgis_deprecate: PostgisOverloads["routine:$extension:postgis._postgis_deprecate(pg_catalog.text,pg_catalog.text,pg_catalog.text)"];
  _postgis_index_extent: PostgisOverloads["routine:$extension:postgis._postgis_index_extent(pg_catalog.regclass,pg_catalog.text)"];
  _postgis_join_selectivity: PostgisOverloads["routine:$extension:postgis._postgis_join_selectivity(pg_catalog.regclass,pg_catalog.text,pg_catalog.regclass,pg_catalog.text,pg_catalog.text)"];
  _postgis_pgsql_version: PostgisOverloads["routine:$extension:postgis._postgis_pgsql_version()"];
  _postgis_scripts_pgsql_version: PostgisOverloads["routine:$extension:postgis._postgis_scripts_pgsql_version()"];
  _postgis_selectivity: PostgisOverloads["routine:$extension:postgis._postgis_selectivity(pg_catalog.regclass,pg_catalog.text,$extension:postgis.geometry,pg_catalog.text)"];
  _postgis_stats: PostgisOverloads["routine:$extension:postgis._postgis_stats(pg_catalog.regclass,pg_catalog.text,pg_catalog.text)"];
  _st_3ddfullywithin: PostgisOverloads["routine:$extension:postgis._st_3ddfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
  _st_3ddwithin: PostgisOverloads["routine:$extension:postgis._st_3ddwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
  _st_3dintersects: PostgisOverloads["routine:$extension:postgis._st_3dintersects($extension:postgis.geometry,$extension:postgis.geometry)"];
  _st_asgml: PostgisOverloads["routine:$extension:postgis._st_asgml(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)"];
  _st_asx3d: PostgisOverloads["routine:$extension:postgis._st_asx3d(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)"];
  _st_bestsrid: {
    "($extension:postgis.geography,$extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis._st_bestsrid($extension:postgis.geography,$extension:postgis.geography)"];
    "($extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis._st_bestsrid($extension:postgis.geography)"];
  };
  _st_contains: PostgisOverloads["routine:$extension:postgis._st_contains($extension:postgis.geometry,$extension:postgis.geometry)"];
  _st_containsproperly: PostgisOverloads["routine:$extension:postgis._st_containsproperly($extension:postgis.geometry,$extension:postgis.geometry)"];
  _st_coveredby: {
    "($extension:postgis.geography,$extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis._st_coveredby($extension:postgis.geography,$extension:postgis.geography)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis._st_coveredby($extension:postgis.geometry,$extension:postgis.geometry)"];
  };
  _st_covers: {
    "($extension:postgis.geography,$extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis._st_covers($extension:postgis.geography,$extension:postgis.geography)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis._st_covers($extension:postgis.geometry,$extension:postgis.geometry)"];
  };
  _st_crosses: PostgisOverloads["routine:$extension:postgis._st_crosses($extension:postgis.geometry,$extension:postgis.geometry)"];
  _st_dfullywithin: PostgisOverloads["routine:$extension:postgis._st_dfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
  _st_distancetree: {
    "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis._st_distancetree($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geography,$extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis._st_distancetree($extension:postgis.geography,$extension:postgis.geography)"];
  };
  _st_distanceuncached: {
    "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)"];
    "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geography,$extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography)"];
  };
  _st_dwithin: {
    "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis._st_dwithin($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis._st_dwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
  };
  _st_dwithinuncached: {
    "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis._st_dwithinuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis._st_dwithinuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)"];
  };
  _st_equals: PostgisOverloads["routine:$extension:postgis._st_equals($extension:postgis.geometry,$extension:postgis.geometry)"];
  _st_expand: PostgisOverloads["routine:$extension:postgis._st_expand($extension:postgis.geography,pg_catalog.float8)"];
  _st_geomfromgml: PostgisOverloads["routine:$extension:postgis._st_geomfromgml(pg_catalog.text,pg_catalog.int4)"];
  _st_intersects: PostgisOverloads["routine:$extension:postgis._st_intersects($extension:postgis.geometry,$extension:postgis.geometry)"];
  _st_linecrossingdirection: PostgisOverloads["routine:$extension:postgis._st_linecrossingdirection($extension:postgis.geometry,$extension:postgis.geometry)"];
  _st_longestline: PostgisOverloads["routine:$extension:postgis._st_longestline($extension:postgis.geometry,$extension:postgis.geometry)"];
  _st_maxdistance: PostgisOverloads["routine:$extension:postgis._st_maxdistance($extension:postgis.geometry,$extension:postgis.geometry)"];
  _st_orderingequals: PostgisOverloads["routine:$extension:postgis._st_orderingequals($extension:postgis.geometry,$extension:postgis.geometry)"];
  _st_overlaps: PostgisOverloads["routine:$extension:postgis._st_overlaps($extension:postgis.geometry,$extension:postgis.geometry)"];
  _st_pointoutside: PostgisOverloads["routine:$extension:postgis._st_pointoutside($extension:postgis.geography)"];
  _st_sortablehash: PostgisOverloads["routine:$extension:postgis._st_sortablehash($extension:postgis.geometry)"];
  _st_touches: PostgisOverloads["routine:$extension:postgis._st_touches($extension:postgis.geometry,$extension:postgis.geometry)"];
  _st_voronoi: PostgisOverloads["routine:$extension:postgis._st_voronoi($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)"];
  _st_within: PostgisOverloads["routine:$extension:postgis._st_within($extension:postgis.geometry,$extension:postgis.geometry)"];
  box: {
    "($extension:postgis.box3d)": PostgisOverloads["routine:$extension:postgis.box($extension:postgis.box3d)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.box($extension:postgis.geometry)"];
  };
  box2d: {
    "($extension:postgis.box3d)": PostgisOverloads["routine:$extension:postgis.box2d($extension:postgis.box3d)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.box2d($extension:postgis.geometry)"];
  };
  box3d: {
    "($extension:postgis.box2d)": PostgisOverloads["routine:$extension:postgis.box3d($extension:postgis.box2d)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.box3d($extension:postgis.geometry)"];
  };
  box3dtobox: PostgisOverloads["routine:$extension:postgis.box3dtobox($extension:postgis.box3d)"];
  bytea: {
    "($extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis.bytea($extension:postgis.geography)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.bytea($extension:postgis.geometry)"];
  };
  contains_2d: {
    "($extension:postgis.box2df,$extension:postgis.box2df)": PostgisOverloads["routine:$extension:postgis.contains_2d($extension:postgis.box2df,$extension:postgis.box2df)"];
    "($extension:postgis.box2df,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.contains_2d($extension:postgis.box2df,$extension:postgis.geometry)"];
    "($extension:postgis.geometry,$extension:postgis.box2df)": PostgisOverloads["routine:$extension:postgis.contains_2d($extension:postgis.geometry,$extension:postgis.box2df)"];
  };
  equals: PostgisOverloads["routine:$extension:postgis.equals($extension:postgis.geometry,$extension:postgis.geometry)"];
  find_srid: PostgisOverloads["routine:$extension:postgis.find_srid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)"];
  geography_cmp: PostgisOverloads["routine:$extension:postgis.geography_cmp($extension:postgis.geography,$extension:postgis.geography)"];
  geography_distance_knn: PostgisOverloads["routine:$extension:postgis.geography_distance_knn($extension:postgis.geography,$extension:postgis.geography)"];
  geography_eq: PostgisOverloads["routine:$extension:postgis.geography_eq($extension:postgis.geography,$extension:postgis.geography)"];
  geography_ge: PostgisOverloads["routine:$extension:postgis.geography_ge($extension:postgis.geography,$extension:postgis.geography)"];
  geography_gt: PostgisOverloads["routine:$extension:postgis.geography_gt($extension:postgis.geography,$extension:postgis.geography)"];
  geography_le: PostgisOverloads["routine:$extension:postgis.geography_le($extension:postgis.geography,$extension:postgis.geography)"];
  geography_lt: PostgisOverloads["routine:$extension:postgis.geography_lt($extension:postgis.geography,$extension:postgis.geography)"];
  geography_overlaps: PostgisOverloads["routine:$extension:postgis.geography_overlaps($extension:postgis.geography,$extension:postgis.geography)"];
  geography_send: PostgisOverloads["routine:$extension:postgis.geography_send($extension:postgis.geography)"];
  geography: {
    "($extension:postgis.geography,pg_catalog.int4,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.geography($extension:postgis.geography,pg_catalog.int4,pg_catalog.bool)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.geography($extension:postgis.geometry)"];
    "(pg_catalog.bytea)": PostgisOverloads["routine:$extension:postgis.geography(pg_catalog.bytea)"];
  };
  geometry_above: PostgisOverloads["routine:$extension:postgis.geometry_above($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_below: PostgisOverloads["routine:$extension:postgis.geometry_below($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_cmp: PostgisOverloads["routine:$extension:postgis.geometry_cmp($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_contained_3d: PostgisOverloads["routine:$extension:postgis.geometry_contained_3d($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_contains_3d: PostgisOverloads["routine:$extension:postgis.geometry_contains_3d($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_contains_nd: PostgisOverloads["routine:$extension:postgis.geometry_contains_nd($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_contains: PostgisOverloads["routine:$extension:postgis.geometry_contains($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_distance_box: PostgisOverloads["routine:$extension:postgis.geometry_distance_box($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_distance_centroid_nd: PostgisOverloads["routine:$extension:postgis.geometry_distance_centroid_nd($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_distance_centroid: PostgisOverloads["routine:$extension:postgis.geometry_distance_centroid($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_distance_cpa: PostgisOverloads["routine:$extension:postgis.geometry_distance_cpa($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_eq: PostgisOverloads["routine:$extension:postgis.geometry_eq($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_ge: PostgisOverloads["routine:$extension:postgis.geometry_ge($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_gt: PostgisOverloads["routine:$extension:postgis.geometry_gt($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_hash: PostgisOverloads["routine:$extension:postgis.geometry_hash($extension:postgis.geometry)"];
  geometry_le: PostgisOverloads["routine:$extension:postgis.geometry_le($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_left: PostgisOverloads["routine:$extension:postgis.geometry_left($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_lt: PostgisOverloads["routine:$extension:postgis.geometry_lt($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_neq: PostgisOverloads["routine:$extension:postgis.geometry_neq($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_overabove: PostgisOverloads["routine:$extension:postgis.geometry_overabove($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_overbelow: PostgisOverloads["routine:$extension:postgis.geometry_overbelow($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_overlaps_3d: PostgisOverloads["routine:$extension:postgis.geometry_overlaps_3d($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_overlaps_nd: PostgisOverloads["routine:$extension:postgis.geometry_overlaps_nd($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_overlaps: PostgisOverloads["routine:$extension:postgis.geometry_overlaps($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_overleft: PostgisOverloads["routine:$extension:postgis.geometry_overleft($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_overright: PostgisOverloads["routine:$extension:postgis.geometry_overright($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_right: PostgisOverloads["routine:$extension:postgis.geometry_right($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_same_3d: PostgisOverloads["routine:$extension:postgis.geometry_same_3d($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_same_nd: PostgisOverloads["routine:$extension:postgis.geometry_same_nd($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_same: PostgisOverloads["routine:$extension:postgis.geometry_same($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_send: PostgisOverloads["routine:$extension:postgis.geometry_send($extension:postgis.geometry)"];
  geometry_within_nd: PostgisOverloads["routine:$extension:postgis.geometry_within_nd($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry_within: PostgisOverloads["routine:$extension:postgis.geometry_within($extension:postgis.geometry,$extension:postgis.geometry)"];
  geometry: {
    "($extension:postgis.box2d)": PostgisOverloads["routine:$extension:postgis.geometry($extension:postgis.box2d)"];
    "($extension:postgis.box3d)": PostgisOverloads["routine:$extension:postgis.geometry($extension:postgis.box3d)"];
    "($extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis.geometry($extension:postgis.geography)"];
    "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.geometry($extension:postgis.geometry,pg_catalog.int4,pg_catalog.bool)"];
    "(pg_catalog.bytea)": PostgisOverloads["routine:$extension:postgis.geometry(pg_catalog.bytea)"];
    "(pg_catalog.path)": PostgisOverloads["routine:$extension:postgis.geometry(pg_catalog.path)"];
    "(pg_catalog.point)": PostgisOverloads["routine:$extension:postgis.geometry(pg_catalog.point)"];
    "(pg_catalog.polygon)": PostgisOverloads["routine:$extension:postgis.geometry(pg_catalog.polygon)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.geometry(pg_catalog.text)"];
  };
  geometrytype: {
    "($extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis.geometrytype($extension:postgis.geography)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.geometrytype($extension:postgis.geometry)"];
  };
  geomfromewkb: PostgisOverloads["routine:$extension:postgis.geomfromewkb(pg_catalog.bytea)"];
  geomfromewkt: PostgisOverloads["routine:$extension:postgis.geomfromewkt(pg_catalog.text)"];
  get_proj4_from_srid: PostgisOverloads["routine:$extension:postgis.get_proj4_from_srid(pg_catalog.int4)"];
  is_contained_2d: {
    "($extension:postgis.box2df,$extension:postgis.box2df)": PostgisOverloads["routine:$extension:postgis.is_contained_2d($extension:postgis.box2df,$extension:postgis.box2df)"];
    "($extension:postgis.box2df,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.is_contained_2d($extension:postgis.box2df,$extension:postgis.geometry)"];
    "($extension:postgis.geometry,$extension:postgis.box2df)": PostgisOverloads["routine:$extension:postgis.is_contained_2d($extension:postgis.geometry,$extension:postgis.box2df)"];
  };
  json: PostgisOverloads["routine:$extension:postgis.json($extension:postgis.geometry)"];
  jsonb: PostgisOverloads["routine:$extension:postgis.jsonb($extension:postgis.geometry)"];
  overlaps_2d: {
    "($extension:postgis.box2df,$extension:postgis.box2df)": PostgisOverloads["routine:$extension:postgis.overlaps_2d($extension:postgis.box2df,$extension:postgis.box2df)"];
    "($extension:postgis.box2df,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.overlaps_2d($extension:postgis.box2df,$extension:postgis.geometry)"];
    "($extension:postgis.geometry,$extension:postgis.box2df)": PostgisOverloads["routine:$extension:postgis.overlaps_2d($extension:postgis.geometry,$extension:postgis.box2df)"];
  };
  overlaps_geog: {
    "($extension:postgis.geography,$extension:postgis.gidx)": PostgisOverloads["routine:$extension:postgis.overlaps_geog($extension:postgis.geography,$extension:postgis.gidx)"];
    "($extension:postgis.gidx,$extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis.overlaps_geog($extension:postgis.gidx,$extension:postgis.geography)"];
    "($extension:postgis.gidx,$extension:postgis.gidx)": PostgisOverloads["routine:$extension:postgis.overlaps_geog($extension:postgis.gidx,$extension:postgis.gidx)"];
  };
  overlaps_nd: {
    "($extension:postgis.geometry,$extension:postgis.gidx)": PostgisOverloads["routine:$extension:postgis.overlaps_nd($extension:postgis.geometry,$extension:postgis.gidx)"];
    "($extension:postgis.gidx,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.overlaps_nd($extension:postgis.gidx,$extension:postgis.geometry)"];
    "($extension:postgis.gidx,$extension:postgis.gidx)": PostgisOverloads["routine:$extension:postgis.overlaps_nd($extension:postgis.gidx,$extension:postgis.gidx)"];
  };
  path: PostgisOverloads["routine:$extension:postgis.path($extension:postgis.geometry)"];
  point: PostgisOverloads["routine:$extension:postgis.point($extension:postgis.geometry)"];
  polygon: PostgisOverloads["routine:$extension:postgis.polygon($extension:postgis.geometry)"];
  postgis_addbbox: PostgisOverloads["routine:$extension:postgis.postgis_addbbox($extension:postgis.geometry)"];
  postgis_constraint_dims: PostgisOverloads["routine:$extension:postgis.postgis_constraint_dims(pg_catalog.text,pg_catalog.text,pg_catalog.text)"];
  postgis_constraint_srid: PostgisOverloads["routine:$extension:postgis.postgis_constraint_srid(pg_catalog.text,pg_catalog.text,pg_catalog.text)"];
  postgis_constraint_type: PostgisOverloads["routine:$extension:postgis.postgis_constraint_type(pg_catalog.text,pg_catalog.text,pg_catalog.text)"];
  postgis_dropbbox: PostgisOverloads["routine:$extension:postgis.postgis_dropbbox($extension:postgis.geometry)"];
  postgis_full_version: PostgisOverloads["routine:$extension:postgis.postgis_full_version()"];
  postgis_geos_compiled_version: PostgisOverloads["routine:$extension:postgis.postgis_geos_compiled_version()"];
  postgis_geos_noop: PostgisOverloads["routine:$extension:postgis.postgis_geos_noop($extension:postgis.geometry)"];
  postgis_geos_version: PostgisOverloads["routine:$extension:postgis.postgis_geos_version()"];
  postgis_getbbox: PostgisOverloads["routine:$extension:postgis.postgis_getbbox($extension:postgis.geometry)"];
  postgis_hasbbox: PostgisOverloads["routine:$extension:postgis.postgis_hasbbox($extension:postgis.geometry)"];
  postgis_lib_build_date: PostgisOverloads["routine:$extension:postgis.postgis_lib_build_date()"];
  postgis_lib_revision: PostgisOverloads["routine:$extension:postgis.postgis_lib_revision()"];
  postgis_lib_version: PostgisOverloads["routine:$extension:postgis.postgis_lib_version()"];
  postgis_libjson_version: PostgisOverloads["routine:$extension:postgis.postgis_libjson_version()"];
  postgis_liblwgeom_version: PostgisOverloads["routine:$extension:postgis.postgis_liblwgeom_version()"];
  postgis_libprotobuf_version: PostgisOverloads["routine:$extension:postgis.postgis_libprotobuf_version()"];
  postgis_libxml_version: PostgisOverloads["routine:$extension:postgis.postgis_libxml_version()"];
  postgis_noop: PostgisOverloads["routine:$extension:postgis.postgis_noop($extension:postgis.geometry)"];
  postgis_proj_compiled_version: PostgisOverloads["routine:$extension:postgis.postgis_proj_compiled_version()"];
  postgis_proj_version: PostgisOverloads["routine:$extension:postgis.postgis_proj_version()"];
  postgis_scripts_build_date: PostgisOverloads["routine:$extension:postgis.postgis_scripts_build_date()"];
  postgis_scripts_installed: PostgisOverloads["routine:$extension:postgis.postgis_scripts_installed()"];
  postgis_scripts_released: PostgisOverloads["routine:$extension:postgis.postgis_scripts_released()"];
  postgis_srs_all: PostgisOverloads["routine:$extension:postgis.postgis_srs_all()"];
  postgis_srs_codes: PostgisOverloads["routine:$extension:postgis.postgis_srs_codes(pg_catalog.text)"];
  postgis_srs_search: PostgisOverloads["routine:$extension:postgis.postgis_srs_search($extension:postgis.geometry,pg_catalog.text)"];
  postgis_srs: PostgisOverloads["routine:$extension:postgis.postgis_srs(pg_catalog.text,pg_catalog.text)"];
  postgis_svn_version: PostgisOverloads["routine:$extension:postgis.postgis_svn_version()"];
  postgis_transform_geometry: PostgisOverloads["routine:$extension:postgis.postgis_transform_geometry($extension:postgis.geometry,pg_catalog.text,pg_catalog.text,pg_catalog.int4)"];
  postgis_transform_pipeline_geometry: PostgisOverloads["routine:$extension:postgis.postgis_transform_pipeline_geometry($extension:postgis.geometry,pg_catalog.text,pg_catalog.bool,pg_catalog.int4)"];
  postgis_type_name: PostgisOverloads["routine:$extension:postgis.postgis_type_name(pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)"];
  postgis_typmod_dims: PostgisOverloads["routine:$extension:postgis.postgis_typmod_dims(pg_catalog.int4)"];
  postgis_typmod_srid: PostgisOverloads["routine:$extension:postgis.postgis_typmod_srid(pg_catalog.int4)"];
  postgis_typmod_type: PostgisOverloads["routine:$extension:postgis.postgis_typmod_type(pg_catalog.int4)"];
  postgis_version: PostgisOverloads["routine:$extension:postgis.postgis_version()"];
  postgis_wagyu_version: PostgisOverloads["routine:$extension:postgis.postgis_wagyu_version()"];
  st_3dclosestpoint: PostgisOverloads["routine:$extension:postgis.st_3dclosestpoint($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_3ddfullywithin: PostgisOverloads["routine:$extension:postgis.st_3ddfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
  st_3ddistance: PostgisOverloads["routine:$extension:postgis.st_3ddistance($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_3ddwithin: PostgisOverloads["routine:$extension:postgis.st_3ddwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
  st_3dextent: PostgisOverloads["routine:$extension:postgis.st_3dextent($extension:postgis.geometry)"];
  st_3dintersects: PostgisOverloads["routine:$extension:postgis.st_3dintersects($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_3dlength: PostgisOverloads["routine:$extension:postgis.st_3dlength($extension:postgis.geometry)"];
  st_3dlineinterpolatepoint: PostgisOverloads["routine:$extension:postgis.st_3dlineinterpolatepoint($extension:postgis.geometry,pg_catalog.float8)"];
  st_3dlongestline: PostgisOverloads["routine:$extension:postgis.st_3dlongestline($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_3dmakebox: PostgisOverloads["routine:$extension:postgis.st_3dmakebox($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_3dmaxdistance: PostgisOverloads["routine:$extension:postgis.st_3dmaxdistance($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_3dperimeter: PostgisOverloads["routine:$extension:postgis.st_3dperimeter($extension:postgis.geometry)"];
  st_3dshortestline: PostgisOverloads["routine:$extension:postgis.st_3dshortestline($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_addmeasure: PostgisOverloads["routine:$extension:postgis.st_addmeasure($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"];
  st_addpoint: {
    "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_addpoint($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_addpoint($extension:postgis.geometry,$extension:postgis.geometry)"];
  };
  st_affine: {
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_affine($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_affine($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
  };
  st_angle: {
    "($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_angle($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_angle($extension:postgis.geometry,$extension:postgis.geometry)"];
  };
  st_area: {
    "($extension:postgis.geography,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_area($extension:postgis.geography,pg_catalog.bool)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_area($extension:postgis.geometry)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_area(pg_catalog.text)"];
  };
  st_area2d: PostgisOverloads["routine:$extension:postgis.st_area2d($extension:postgis.geometry)"];
  st_asbinary: {
    "($extension:postgis.geography,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asbinary($extension:postgis.geography,pg_catalog.text)"];
    "($extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis.st_asbinary($extension:postgis.geography)"];
    "($extension:postgis.geometry,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asbinary($extension:postgis.geometry,pg_catalog.text)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_asbinary($extension:postgis.geometry)"];
  };
  st_asencodedpolyline: PostgisOverloads["routine:$extension:postgis.st_asencodedpolyline($extension:postgis.geometry,pg_catalog.int4)"];
  st_asewkb: {
    "($extension:postgis.geometry,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asewkb($extension:postgis.geometry,pg_catalog.text)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_asewkb($extension:postgis.geometry)"];
  };
  st_asewkt: {
    "($extension:postgis.geography,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_asewkt($extension:postgis.geography,pg_catalog.int4)"];
    "($extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis.st_asewkt($extension:postgis.geography)"];
    "($extension:postgis.geometry,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_asewkt($extension:postgis.geometry,pg_catalog.int4)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_asewkt($extension:postgis.geometry)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asewkt(pg_catalog.text)"];
  };
  st_asflatgeobuf: {
    "(pg_catalog.anyelement,pg_catalog.bool,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement,pg_catalog.bool,pg_catalog.text)"];
    "(pg_catalog.anyelement,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement,pg_catalog.bool)"];
    "(pg_catalog.anyelement)": PostgisOverloads["routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement)"];
  };
  st_asgeobuf: {
    "(pg_catalog.anyelement,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asgeobuf(pg_catalog.anyelement,pg_catalog.text)"];
    "(pg_catalog.anyelement)": PostgisOverloads["routine:$extension:postgis.st_asgeobuf(pg_catalog.anyelement)"];
  };
  st_asgeojson: {
    "($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_asgeojson($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)"];
    "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_asgeojson($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)"];
    "(pg_catalog.record,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asgeojson(pg_catalog.record,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.text)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asgeojson(pg_catalog.text)"];
  };
  st_asgml: {
    "($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asgml($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)"];
    "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_asgml($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)"];
    "(pg_catalog.int4,$extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asgml(pg_catalog.int4,$extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)"];
    "(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asgml(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asgml(pg_catalog.text)"];
  };
  st_ashexewkb: {
    "($extension:postgis.geometry,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_ashexewkb($extension:postgis.geometry,pg_catalog.text)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_ashexewkb($extension:postgis.geometry)"];
  };
  st_askml: {
    "($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_askml($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)"];
    "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_askml($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_askml(pg_catalog.text)"];
  };
  st_aslatlontext: PostgisOverloads["routine:$extension:postgis.st_aslatlontext($extension:postgis.geometry,pg_catalog.text)"];
  st_asmarc21: PostgisOverloads["routine:$extension:postgis.st_asmarc21($extension:postgis.geometry,pg_catalog.text)"];
  st_asmvt: {
    "(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.text)"];
    "(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text)"];
    "(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.anyelement,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text)"];
    "(pg_catalog.anyelement)": PostgisOverloads["routine:$extension:postgis.st_asmvt(pg_catalog.anyelement)"];
  };
  st_asmvtgeom: PostgisOverloads["routine:$extension:postgis.st_asmvtgeom($extension:postgis.geometry,$extension:postgis.box2d,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)"];
  st_assvg: {
    "($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_assvg($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)"];
    "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_assvg($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_assvg(pg_catalog.text)"];
  };
  st_astext: {
    "($extension:postgis.geography,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_astext($extension:postgis.geography,pg_catalog.int4)"];
    "($extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis.st_astext($extension:postgis.geography)"];
    "($extension:postgis.geometry,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_astext($extension:postgis.geometry,pg_catalog.int4)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_astext($extension:postgis.geometry)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_astext(pg_catalog.text)"];
  };
  st_astwkb: {
    "($extension:postgis._geometry,pg_catalog._int8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_astwkb($extension:postgis._geometry,pg_catalog._int8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"];
    "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_astwkb($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"];
  };
  st_asx3d: PostgisOverloads["routine:$extension:postgis.st_asx3d($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)"];
  st_azimuth: {
    "($extension:postgis.geography,$extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis.st_azimuth($extension:postgis.geography,$extension:postgis.geography)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_azimuth($extension:postgis.geometry,$extension:postgis.geometry)"];
  };
  st_bdmpolyfromtext: PostgisOverloads["routine:$extension:postgis.st_bdmpolyfromtext(pg_catalog.text,pg_catalog.int4)"];
  st_bdpolyfromtext: PostgisOverloads["routine:$extension:postgis.st_bdpolyfromtext(pg_catalog.text,pg_catalog.int4)"];
  st_boundary: PostgisOverloads["routine:$extension:postgis.st_boundary($extension:postgis.geometry)"];
  st_boundingdiagonal: PostgisOverloads["routine:$extension:postgis.st_boundingdiagonal($extension:postgis.geometry,pg_catalog.bool)"];
  st_box2dfromgeohash: PostgisOverloads["routine:$extension:postgis.st_box2dfromgeohash(pg_catalog.text,pg_catalog.int4)"];
  st_buffer: {
    "($extension:postgis.geography,pg_catalog.float8,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8,pg_catalog.int4)"];
    "($extension:postgis.geography,pg_catalog.float8,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8,pg_catalog.text)"];
    "($extension:postgis.geography,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_buffer($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_buffer($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text)"];
    "(pg_catalog.text,pg_catalog.float8,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8,pg_catalog.int4)"];
    "(pg_catalog.text,pg_catalog.float8,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8,pg_catalog.text)"];
    "(pg_catalog.text,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8)"];
  };
  st_buildarea: PostgisOverloads["routine:$extension:postgis.st_buildarea($extension:postgis.geometry)"];
  st_centroid: {
    "($extension:postgis.geography,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_centroid($extension:postgis.geography,pg_catalog.bool)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_centroid($extension:postgis.geometry)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_centroid(pg_catalog.text)"];
  };
  st_chaikinsmoothing: PostgisOverloads["routine:$extension:postgis.st_chaikinsmoothing($extension:postgis.geometry,pg_catalog.int4,pg_catalog.bool)"];
  st_cleangeometry: PostgisOverloads["routine:$extension:postgis.st_cleangeometry($extension:postgis.geometry)"];
  st_clipbybox2d: PostgisOverloads["routine:$extension:postgis.st_clipbybox2d($extension:postgis.geometry,$extension:postgis.box2d)"];
  st_closestpoint: {
    "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_closestpoint($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_closestpoint($extension:postgis.geometry,$extension:postgis.geometry)"];
    "(pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_closestpoint(pg_catalog.text,pg_catalog.text)"];
  };
  st_closestpointofapproach: PostgisOverloads["routine:$extension:postgis.st_closestpointofapproach($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_clusterdbscan: PostgisOverloads["routine:$extension:postgis.st_clusterdbscan($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)"];
  st_clusterintersecting: {
    "($extension:postgis._geometry)": PostgisOverloads["routine:$extension:postgis.st_clusterintersecting($extension:postgis._geometry)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_clusterintersecting($extension:postgis.geometry)"];
  };
  st_clusterintersectingwin: PostgisOverloads["routine:$extension:postgis.st_clusterintersectingwin($extension:postgis.geometry)"];
  st_clusterkmeans: PostgisOverloads["routine:$extension:postgis.st_clusterkmeans($extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)"];
  st_clusterwithin: {
    "($extension:postgis._geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_clusterwithin($extension:postgis._geometry,pg_catalog.float8)"];
    "($extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_clusterwithin($extension:postgis.geometry,pg_catalog.float8)"];
  };
  st_clusterwithinwin: PostgisOverloads["routine:$extension:postgis.st_clusterwithinwin($extension:postgis.geometry,pg_catalog.float8)"];
  st_collect: {
    "($extension:postgis._geometry)": PostgisOverloads["routine:$extension:postgis.st_collect($extension:postgis._geometry)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_collect($extension:postgis.geometry,$extension:postgis.geometry)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_collect($extension:postgis.geometry)"];
  };
  st_collectionextract: {
    "($extension:postgis.geometry,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_collectionextract($extension:postgis.geometry,pg_catalog.int4)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_collectionextract($extension:postgis.geometry)"];
  };
  st_collectionhomogenize: PostgisOverloads["routine:$extension:postgis.st_collectionhomogenize($extension:postgis.geometry)"];
  st_combinebbox: {
    "($extension:postgis.box2d,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_combinebbox($extension:postgis.box2d,$extension:postgis.geometry)"];
    "($extension:postgis.box3d,$extension:postgis.box3d)": PostgisOverloads["routine:$extension:postgis.st_combinebbox($extension:postgis.box3d,$extension:postgis.box3d)"];
    "($extension:postgis.box3d,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_combinebbox($extension:postgis.box3d,$extension:postgis.geometry)"];
  };
  st_concavehull: PostgisOverloads["routine:$extension:postgis.st_concavehull($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)"];
  st_contains: PostgisOverloads["routine:$extension:postgis.st_contains($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_containsproperly: PostgisOverloads["routine:$extension:postgis.st_containsproperly($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_convexhull: PostgisOverloads["routine:$extension:postgis.st_convexhull($extension:postgis.geometry)"];
  st_coorddim: PostgisOverloads["routine:$extension:postgis.st_coorddim($extension:postgis.geometry)"];
  st_coverageclean: PostgisOverloads["routine:$extension:postgis.st_coverageclean($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.text)"];
  st_coverageinvalidedges: PostgisOverloads["routine:$extension:postgis.st_coverageinvalidedges($extension:postgis.geometry,pg_catalog.float8)"];
  st_coveragesimplify: PostgisOverloads["routine:$extension:postgis.st_coveragesimplify($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)"];
  st_coverageunion: {
    "($extension:postgis._geometry)": PostgisOverloads["routine:$extension:postgis.st_coverageunion($extension:postgis._geometry)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_coverageunion($extension:postgis.geometry)"];
  };
  st_coveredby: {
    "($extension:postgis.geography,$extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis.st_coveredby($extension:postgis.geography,$extension:postgis.geography)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_coveredby($extension:postgis.geometry,$extension:postgis.geometry)"];
    "(pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_coveredby(pg_catalog.text,pg_catalog.text)"];
  };
  st_covers: {
    "($extension:postgis.geography,$extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis.st_covers($extension:postgis.geography,$extension:postgis.geography)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_covers($extension:postgis.geometry,$extension:postgis.geometry)"];
    "(pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_covers(pg_catalog.text,pg_catalog.text)"];
  };
  st_cpawithin: PostgisOverloads["routine:$extension:postgis.st_cpawithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
  st_crosses: PostgisOverloads["routine:$extension:postgis.st_crosses($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_curven: PostgisOverloads["routine:$extension:postgis.st_curven($extension:postgis.geometry,pg_catalog.int4)"];
  st_curvetoline: PostgisOverloads["routine:$extension:postgis.st_curvetoline($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)"];
  st_delaunaytriangles: PostgisOverloads["routine:$extension:postgis.st_delaunaytriangles($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)"];
  st_dfullywithin: PostgisOverloads["routine:$extension:postgis.st_dfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
  st_difference: PostgisOverloads["routine:$extension:postgis.st_difference($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
  st_dimension: PostgisOverloads["routine:$extension:postgis.st_dimension($extension:postgis.geometry)"];
  st_disjoint: PostgisOverloads["routine:$extension:postgis.st_disjoint($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_distance: {
    "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_distance($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_distance($extension:postgis.geometry,$extension:postgis.geometry)"];
    "(pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_distance(pg_catalog.text,pg_catalog.text)"];
  };
  st_distancecpa: PostgisOverloads["routine:$extension:postgis.st_distancecpa($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_distancesphere: {
    "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_distancesphere($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_distancesphere($extension:postgis.geometry,$extension:postgis.geometry)"];
  };
  st_distancespheroid: {
    "($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.spheroid)": PostgisOverloads["routine:$extension:postgis.st_distancespheroid($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.spheroid)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_distancespheroid($extension:postgis.geometry,$extension:postgis.geometry)"];
  };
  st_dump: PostgisOverloads["routine:$extension:postgis.st_dump($extension:postgis.geometry)"];
  st_dumppoints: PostgisOverloads["routine:$extension:postgis.st_dumppoints($extension:postgis.geometry)"];
  st_dumprings: PostgisOverloads["routine:$extension:postgis.st_dumprings($extension:postgis.geometry)"];
  st_dumpsegments: PostgisOverloads["routine:$extension:postgis.st_dumpsegments($extension:postgis.geometry)"];
  st_dwithin: {
    "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_dwithin($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_dwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.text,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_dwithin(pg_catalog.text,pg_catalog.text,pg_catalog.float8)"];
  };
  st_endpoint: PostgisOverloads["routine:$extension:postgis.st_endpoint($extension:postgis.geometry)"];
  st_envelope: PostgisOverloads["routine:$extension:postgis.st_envelope($extension:postgis.geometry)"];
  st_equals: PostgisOverloads["routine:$extension:postgis.st_equals($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_estimatedextent: {
    "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)"];
    "(pg_catalog.text,pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text,pg_catalog.text)"];
    "(pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text)"];
  };
  st_expand: {
    "($extension:postgis.box2d,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_expand($extension:postgis.box2d,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis.box2d,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_expand($extension:postgis.box2d,pg_catalog.float8)"];
    "($extension:postgis.box3d,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_expand($extension:postgis.box3d,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis.box3d,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_expand($extension:postgis.box3d,pg_catalog.float8)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_expand($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_expand($extension:postgis.geometry,pg_catalog.float8)"];
  };
  st_extent: PostgisOverloads["routine:$extension:postgis.st_extent($extension:postgis.geometry)"];
  st_exteriorring: PostgisOverloads["routine:$extension:postgis.st_exteriorring($extension:postgis.geometry)"];
  st_filterbym: PostgisOverloads["routine:$extension:postgis.st_filterbym($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"];
  st_findextent: {
    "(pg_catalog.text,pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_findextent(pg_catalog.text,pg_catalog.text,pg_catalog.text)"];
    "(pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_findextent(pg_catalog.text,pg_catalog.text)"];
  };
  st_flipcoordinates: PostgisOverloads["routine:$extension:postgis.st_flipcoordinates($extension:postgis.geometry)"];
  st_force2d: PostgisOverloads["routine:$extension:postgis.st_force2d($extension:postgis.geometry)"];
  st_force3d: PostgisOverloads["routine:$extension:postgis.st_force3d($extension:postgis.geometry,pg_catalog.float8)"];
  st_force3dm: PostgisOverloads["routine:$extension:postgis.st_force3dm($extension:postgis.geometry,pg_catalog.float8)"];
  st_force3dz: PostgisOverloads["routine:$extension:postgis.st_force3dz($extension:postgis.geometry,pg_catalog.float8)"];
  st_force4d: PostgisOverloads["routine:$extension:postgis.st_force4d($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"];
  st_forcecollection: PostgisOverloads["routine:$extension:postgis.st_forcecollection($extension:postgis.geometry)"];
  st_forcecurve: PostgisOverloads["routine:$extension:postgis.st_forcecurve($extension:postgis.geometry)"];
  st_forcepolygonccw: PostgisOverloads["routine:$extension:postgis.st_forcepolygonccw($extension:postgis.geometry)"];
  st_forcepolygoncw: PostgisOverloads["routine:$extension:postgis.st_forcepolygoncw($extension:postgis.geometry)"];
  st_forcerhr: PostgisOverloads["routine:$extension:postgis.st_forcerhr($extension:postgis.geometry)"];
  st_forcesfs: {
    "($extension:postgis.geometry,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_forcesfs($extension:postgis.geometry,pg_catalog.text)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_forcesfs($extension:postgis.geometry)"];
  };
  st_frechetdistance: PostgisOverloads["routine:$extension:postgis.st_frechetdistance($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
  st_fromflatgeobuf: PostgisOverloads["routine:$extension:postgis.st_fromflatgeobuf(pg_catalog.anyelement,pg_catalog.bytea)"];
  st_generatepoints: {
    "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_generatepoints($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)"];
    "($extension:postgis.geometry,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_generatepoints($extension:postgis.geometry,pg_catalog.int4)"];
  };
  st_geogfromtext: PostgisOverloads["routine:$extension:postgis.st_geogfromtext(pg_catalog.text)"];
  st_geogfromwkb: PostgisOverloads["routine:$extension:postgis.st_geogfromwkb(pg_catalog.bytea)"];
  st_geographyfromtext: PostgisOverloads["routine:$extension:postgis.st_geographyfromtext(pg_catalog.text)"];
  st_geohash: {
    "($extension:postgis.geography,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_geohash($extension:postgis.geography,pg_catalog.int4)"];
    "($extension:postgis.geometry,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_geohash($extension:postgis.geometry,pg_catalog.int4)"];
  };
  st_geomcollfromtext: {
    "(pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_geomcollfromtext(pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_geomcollfromtext(pg_catalog.text)"];
  };
  st_geomcollfromwkb: {
    "(pg_catalog.bytea,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_geomcollfromwkb(pg_catalog.bytea,pg_catalog.int4)"];
    "(pg_catalog.bytea)": PostgisOverloads["routine:$extension:postgis.st_geomcollfromwkb(pg_catalog.bytea)"];
  };
  st_geometricmedian: PostgisOverloads["routine:$extension:postgis.st_geometricmedian($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)"];
  st_geometryfromtext: {
    "(pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_geometryfromtext(pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_geometryfromtext(pg_catalog.text)"];
  };
  st_geometryn: PostgisOverloads["routine:$extension:postgis.st_geometryn($extension:postgis.geometry,pg_catalog.int4)"];
  st_geometrytype: PostgisOverloads["routine:$extension:postgis.st_geometrytype($extension:postgis.geometry)"];
  st_geomfromewkb: PostgisOverloads["routine:$extension:postgis.st_geomfromewkb(pg_catalog.bytea)"];
  st_geomfromewkt: PostgisOverloads["routine:$extension:postgis.st_geomfromewkt(pg_catalog.text)"];
  st_geomfromgeohash: PostgisOverloads["routine:$extension:postgis.st_geomfromgeohash(pg_catalog.text,pg_catalog.int4)"];
  st_geomfromgeojson: {
    "(pg_catalog.json)": PostgisOverloads["routine:$extension:postgis.st_geomfromgeojson(pg_catalog.json)"];
    "(pg_catalog.jsonb)": PostgisOverloads["routine:$extension:postgis.st_geomfromgeojson(pg_catalog.jsonb)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_geomfromgeojson(pg_catalog.text)"];
  };
  st_geomfromgml: {
    "(pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_geomfromgml(pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_geomfromgml(pg_catalog.text)"];
  };
  st_geomfromkml: PostgisOverloads["routine:$extension:postgis.st_geomfromkml(pg_catalog.text)"];
  st_geomfrommarc21: PostgisOverloads["routine:$extension:postgis.st_geomfrommarc21(pg_catalog.text)"];
  st_geomfromtext: {
    "(pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_geomfromtext(pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_geomfromtext(pg_catalog.text)"];
  };
  st_geomfromtwkb: PostgisOverloads["routine:$extension:postgis.st_geomfromtwkb(pg_catalog.bytea)"];
  st_geomfromwkb: {
    "(pg_catalog.bytea,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_geomfromwkb(pg_catalog.bytea,pg_catalog.int4)"];
    "(pg_catalog.bytea)": PostgisOverloads["routine:$extension:postgis.st_geomfromwkb(pg_catalog.bytea)"];
  };
  st_gmltosql: {
    "(pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_gmltosql(pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_gmltosql(pg_catalog.text)"];
  };
  st_hasarc: PostgisOverloads["routine:$extension:postgis.st_hasarc($extension:postgis.geometry)"];
  st_hasm: PostgisOverloads["routine:$extension:postgis.st_hasm($extension:postgis.geometry)"];
  st_hasz: PostgisOverloads["routine:$extension:postgis.st_hasz($extension:postgis.geometry)"];
  st_hausdorffdistance: {
    "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_hausdorffdistance($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_hausdorffdistance($extension:postgis.geometry,$extension:postgis.geometry)"];
  };
  st_hexagon: PostgisOverloads["routine:$extension:postgis.st_hexagon(pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry)"];
  st_hexagongrid: PostgisOverloads["routine:$extension:postgis.st_hexagongrid(pg_catalog.float8,$extension:postgis.geometry)"];
  st_interiorringn: PostgisOverloads["routine:$extension:postgis.st_interiorringn($extension:postgis.geometry,pg_catalog.int4)"];
  st_interpolatepoint: PostgisOverloads["routine:$extension:postgis.st_interpolatepoint($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_intersection: {
    "($extension:postgis.geography,$extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis.st_intersection($extension:postgis.geography,$extension:postgis.geography)"];
    "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_intersection($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_intersection(pg_catalog.text,pg_catalog.text)"];
  };
  st_intersects: {
    "($extension:postgis.geography,$extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis.st_intersects($extension:postgis.geography,$extension:postgis.geography)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_intersects($extension:postgis.geometry,$extension:postgis.geometry)"];
    "(pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_intersects(pg_catalog.text,pg_catalog.text)"];
  };
  st_inversetransformpipeline: PostgisOverloads["routine:$extension:postgis.st_inversetransformpipeline($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)"];
  st_isclosed: PostgisOverloads["routine:$extension:postgis.st_isclosed($extension:postgis.geometry)"];
  st_iscollection: PostgisOverloads["routine:$extension:postgis.st_iscollection($extension:postgis.geometry)"];
  st_isempty: PostgisOverloads["routine:$extension:postgis.st_isempty($extension:postgis.geometry)"];
  st_ispolygonccw: PostgisOverloads["routine:$extension:postgis.st_ispolygonccw($extension:postgis.geometry)"];
  st_ispolygoncw: PostgisOverloads["routine:$extension:postgis.st_ispolygoncw($extension:postgis.geometry)"];
  st_isring: PostgisOverloads["routine:$extension:postgis.st_isring($extension:postgis.geometry)"];
  st_issimple: PostgisOverloads["routine:$extension:postgis.st_issimple($extension:postgis.geometry)"];
  st_isvalid: {
    "($extension:postgis.geometry,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_isvalid($extension:postgis.geometry,pg_catalog.int4)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_isvalid($extension:postgis.geometry)"];
  };
  st_isvaliddetail: PostgisOverloads["routine:$extension:postgis.st_isvaliddetail($extension:postgis.geometry,pg_catalog.int4)"];
  st_isvalidreason: {
    "($extension:postgis.geometry,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_isvalidreason($extension:postgis.geometry,pg_catalog.int4)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_isvalidreason($extension:postgis.geometry)"];
  };
  st_isvalidtrajectory: PostgisOverloads["routine:$extension:postgis.st_isvalidtrajectory($extension:postgis.geometry)"];
  st_largestemptycircle: PostgisOverloads["routine:$extension:postgis.st_largestemptycircle($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)"];
  st_length: {
    "($extension:postgis.geography,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_length($extension:postgis.geography,pg_catalog.bool)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_length($extension:postgis.geometry)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_length(pg_catalog.text)"];
  };
  st_length2d: PostgisOverloads["routine:$extension:postgis.st_length2d($extension:postgis.geometry)"];
  st_length2dspheroid: PostgisOverloads["routine:$extension:postgis.st_length2dspheroid($extension:postgis.geometry,$extension:postgis.spheroid)"];
  st_lengthspheroid: PostgisOverloads["routine:$extension:postgis.st_lengthspheroid($extension:postgis.geometry,$extension:postgis.spheroid)"];
  st_letters: PostgisOverloads["routine:$extension:postgis.st_letters(pg_catalog.text,pg_catalog.json)"];
  st_linecrossingdirection: PostgisOverloads["routine:$extension:postgis.st_linecrossingdirection($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_lineextend: PostgisOverloads["routine:$extension:postgis.st_lineextend($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"];
  st_linefromencodedpolyline: PostgisOverloads["routine:$extension:postgis.st_linefromencodedpolyline(pg_catalog.text,pg_catalog.int4)"];
  st_linefrommultipoint: PostgisOverloads["routine:$extension:postgis.st_linefrommultipoint($extension:postgis.geometry)"];
  st_linefromtext: {
    "(pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_linefromtext(pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_linefromtext(pg_catalog.text)"];
  };
  st_linefromwkb: {
    "(pg_catalog.bytea,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_linefromwkb(pg_catalog.bytea,pg_catalog.int4)"];
    "(pg_catalog.bytea)": PostgisOverloads["routine:$extension:postgis.st_linefromwkb(pg_catalog.bytea)"];
  };
  st_lineinterpolatepoint: {
    "($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_lineinterpolatepoint($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_lineinterpolatepoint($extension:postgis.geometry,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_lineinterpolatepoint(pg_catalog.text,pg_catalog.float8)"];
  };
  st_lineinterpolatepoints: {
    "($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_lineinterpolatepoints($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_lineinterpolatepoints($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)"];
    "(pg_catalog.text,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_lineinterpolatepoints(pg_catalog.text,pg_catalog.float8)"];
  };
  st_linelocatepoint: {
    "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_linelocatepoint($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_linelocatepoint($extension:postgis.geometry,$extension:postgis.geometry)"];
    "(pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_linelocatepoint(pg_catalog.text,pg_catalog.text)"];
  };
  st_linemerge: {
    "($extension:postgis.geometry,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_linemerge($extension:postgis.geometry,pg_catalog.bool)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_linemerge($extension:postgis.geometry)"];
  };
  st_linestringfromwkb: {
    "(pg_catalog.bytea,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_linestringfromwkb(pg_catalog.bytea,pg_catalog.int4)"];
    "(pg_catalog.bytea)": PostgisOverloads["routine:$extension:postgis.st_linestringfromwkb(pg_catalog.bytea)"];
  };
  st_linesubstring: {
    "($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_linesubstring($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_linesubstring($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"];
    "(pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_linesubstring(pg_catalog.text,pg_catalog.float8,pg_catalog.float8)"];
  };
  st_linetocurve: PostgisOverloads["routine:$extension:postgis.st_linetocurve($extension:postgis.geometry)"];
  st_locatealong: PostgisOverloads["routine:$extension:postgis.st_locatealong($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"];
  st_locatebetween: PostgisOverloads["routine:$extension:postgis.st_locatebetween($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
  st_locatebetweenelevations: PostgisOverloads["routine:$extension:postgis.st_locatebetweenelevations($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"];
  st_longestline: PostgisOverloads["routine:$extension:postgis.st_longestline($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_m: PostgisOverloads["routine:$extension:postgis.st_m($extension:postgis.geometry)"];
  st_makebox2d: PostgisOverloads["routine:$extension:postgis.st_makebox2d($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_makeenvelope: PostgisOverloads["routine:$extension:postgis.st_makeenvelope(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)"];
  st_makeline: {
    "($extension:postgis._geometry)": PostgisOverloads["routine:$extension:postgis.st_makeline($extension:postgis._geometry)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_makeline($extension:postgis.geometry,$extension:postgis.geometry)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_makeline($extension:postgis.geometry)"];
  };
  st_makepoint: {
    "(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
    "(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
    "(pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8)"];
  };
  st_makepointm: PostgisOverloads["routine:$extension:postgis.st_makepointm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
  st_makepolygon: {
    "($extension:postgis.geometry,$extension:postgis._geometry)": PostgisOverloads["routine:$extension:postgis.st_makepolygon($extension:postgis.geometry,$extension:postgis._geometry)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_makepolygon($extension:postgis.geometry)"];
  };
  st_makevalid: {
    "($extension:postgis.geometry,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_makevalid($extension:postgis.geometry,pg_catalog.text)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_makevalid($extension:postgis.geometry)"];
  };
  st_maxdistance: PostgisOverloads["routine:$extension:postgis.st_maxdistance($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_maximuminscribedcircle: PostgisOverloads["routine:$extension:postgis.st_maximuminscribedcircle($extension:postgis.geometry)"];
  st_memcollect: PostgisOverloads["routine:$extension:postgis.st_memcollect($extension:postgis.geometry)"];
  st_memsize: PostgisOverloads["routine:$extension:postgis.st_memsize($extension:postgis.geometry)"];
  st_memunion: PostgisOverloads["routine:$extension:postgis.st_memunion($extension:postgis.geometry)"];
  st_minimumboundingcircle: PostgisOverloads["routine:$extension:postgis.st_minimumboundingcircle($extension:postgis.geometry,pg_catalog.int4)"];
  st_minimumboundingradius: PostgisOverloads["routine:$extension:postgis.st_minimumboundingradius($extension:postgis.geometry)"];
  st_minimumclearance: PostgisOverloads["routine:$extension:postgis.st_minimumclearance($extension:postgis.geometry)"];
  st_minimumclearanceline: PostgisOverloads["routine:$extension:postgis.st_minimumclearanceline($extension:postgis.geometry)"];
  st_mlinefromtext: {
    "(pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_mlinefromtext(pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_mlinefromtext(pg_catalog.text)"];
  };
  st_mlinefromwkb: {
    "(pg_catalog.bytea,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_mlinefromwkb(pg_catalog.bytea,pg_catalog.int4)"];
    "(pg_catalog.bytea)": PostgisOverloads["routine:$extension:postgis.st_mlinefromwkb(pg_catalog.bytea)"];
  };
  st_mpointfromtext: {
    "(pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_mpointfromtext(pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_mpointfromtext(pg_catalog.text)"];
  };
  st_mpointfromwkb: {
    "(pg_catalog.bytea,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_mpointfromwkb(pg_catalog.bytea,pg_catalog.int4)"];
    "(pg_catalog.bytea)": PostgisOverloads["routine:$extension:postgis.st_mpointfromwkb(pg_catalog.bytea)"];
  };
  st_mpolyfromtext: {
    "(pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_mpolyfromtext(pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_mpolyfromtext(pg_catalog.text)"];
  };
  st_mpolyfromwkb: {
    "(pg_catalog.bytea,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_mpolyfromwkb(pg_catalog.bytea,pg_catalog.int4)"];
    "(pg_catalog.bytea)": PostgisOverloads["routine:$extension:postgis.st_mpolyfromwkb(pg_catalog.bytea)"];
  };
  st_multi: PostgisOverloads["routine:$extension:postgis.st_multi($extension:postgis.geometry)"];
  st_multilinefromwkb: PostgisOverloads["routine:$extension:postgis.st_multilinefromwkb(pg_catalog.bytea)"];
  st_multilinestringfromtext: {
    "(pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_multilinestringfromtext(pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_multilinestringfromtext(pg_catalog.text)"];
  };
  st_multipointfromtext: PostgisOverloads["routine:$extension:postgis.st_multipointfromtext(pg_catalog.text)"];
  st_multipointfromwkb: {
    "(pg_catalog.bytea,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_multipointfromwkb(pg_catalog.bytea,pg_catalog.int4)"];
    "(pg_catalog.bytea)": PostgisOverloads["routine:$extension:postgis.st_multipointfromwkb(pg_catalog.bytea)"];
  };
  st_multipolyfromwkb: {
    "(pg_catalog.bytea,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_multipolyfromwkb(pg_catalog.bytea,pg_catalog.int4)"];
    "(pg_catalog.bytea)": PostgisOverloads["routine:$extension:postgis.st_multipolyfromwkb(pg_catalog.bytea)"];
  };
  st_multipolygonfromtext: {
    "(pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_multipolygonfromtext(pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_multipolygonfromtext(pg_catalog.text)"];
  };
  st_ndims: PostgisOverloads["routine:$extension:postgis.st_ndims($extension:postgis.geometry)"];
  st_node: PostgisOverloads["routine:$extension:postgis.st_node($extension:postgis.geometry)"];
  st_normalize: PostgisOverloads["routine:$extension:postgis.st_normalize($extension:postgis.geometry)"];
  st_npoints: PostgisOverloads["routine:$extension:postgis.st_npoints($extension:postgis.geometry)"];
  st_nrings: PostgisOverloads["routine:$extension:postgis.st_nrings($extension:postgis.geometry)"];
  st_numcurves: PostgisOverloads["routine:$extension:postgis.st_numcurves($extension:postgis.geometry)"];
  st_numgeometries: PostgisOverloads["routine:$extension:postgis.st_numgeometries($extension:postgis.geometry)"];
  st_numinteriorring: PostgisOverloads["routine:$extension:postgis.st_numinteriorring($extension:postgis.geometry)"];
  st_numinteriorrings: PostgisOverloads["routine:$extension:postgis.st_numinteriorrings($extension:postgis.geometry)"];
  st_numpatches: PostgisOverloads["routine:$extension:postgis.st_numpatches($extension:postgis.geometry)"];
  st_numpoints: PostgisOverloads["routine:$extension:postgis.st_numpoints($extension:postgis.geometry)"];
  st_offsetcurve: PostgisOverloads["routine:$extension:postgis.st_offsetcurve($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text)"];
  st_orderingequals: PostgisOverloads["routine:$extension:postgis.st_orderingequals($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_orientedenvelope: PostgisOverloads["routine:$extension:postgis.st_orientedenvelope($extension:postgis.geometry)"];
  st_overlaps: PostgisOverloads["routine:$extension:postgis.st_overlaps($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_patchn: PostgisOverloads["routine:$extension:postgis.st_patchn($extension:postgis.geometry,pg_catalog.int4)"];
  st_perimeter: {
    "($extension:postgis.geography,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_perimeter($extension:postgis.geography,pg_catalog.bool)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_perimeter($extension:postgis.geometry)"];
  };
  st_perimeter2d: PostgisOverloads["routine:$extension:postgis.st_perimeter2d($extension:postgis.geometry)"];
  st_point: {
    "(pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_point(pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)"];
    "(pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_point(pg_catalog.float8,pg_catalog.float8)"];
  };
  st_pointfromgeohash: PostgisOverloads["routine:$extension:postgis.st_pointfromgeohash(pg_catalog.text,pg_catalog.int4)"];
  st_pointfromtext: {
    "(pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_pointfromtext(pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_pointfromtext(pg_catalog.text)"];
  };
  st_pointfromwkb: {
    "(pg_catalog.bytea,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_pointfromwkb(pg_catalog.bytea,pg_catalog.int4)"];
    "(pg_catalog.bytea)": PostgisOverloads["routine:$extension:postgis.st_pointfromwkb(pg_catalog.bytea)"];
  };
  st_pointinsidecircle: PostgisOverloads["routine:$extension:postgis.st_pointinsidecircle($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
  st_pointm: PostgisOverloads["routine:$extension:postgis.st_pointm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)"];
  st_pointn: PostgisOverloads["routine:$extension:postgis.st_pointn($extension:postgis.geometry,pg_catalog.int4)"];
  st_pointonsurface: PostgisOverloads["routine:$extension:postgis.st_pointonsurface($extension:postgis.geometry)"];
  st_points: PostgisOverloads["routine:$extension:postgis.st_points($extension:postgis.geometry)"];
  st_pointz: PostgisOverloads["routine:$extension:postgis.st_pointz(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)"];
  st_pointzm: PostgisOverloads["routine:$extension:postgis.st_pointzm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)"];
  st_polyfromtext: {
    "(pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_polyfromtext(pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_polyfromtext(pg_catalog.text)"];
  };
  st_polyfromwkb: {
    "(pg_catalog.bytea,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_polyfromwkb(pg_catalog.bytea,pg_catalog.int4)"];
    "(pg_catalog.bytea)": PostgisOverloads["routine:$extension:postgis.st_polyfromwkb(pg_catalog.bytea)"];
  };
  st_polygon: PostgisOverloads["routine:$extension:postgis.st_polygon($extension:postgis.geometry,pg_catalog.int4)"];
  st_polygonfromtext: {
    "(pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_polygonfromtext(pg_catalog.text,pg_catalog.int4)"];
    "(pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_polygonfromtext(pg_catalog.text)"];
  };
  st_polygonfromwkb: {
    "(pg_catalog.bytea,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_polygonfromwkb(pg_catalog.bytea,pg_catalog.int4)"];
    "(pg_catalog.bytea)": PostgisOverloads["routine:$extension:postgis.st_polygonfromwkb(pg_catalog.bytea)"];
  };
  st_polygonize: {
    "($extension:postgis._geometry)": PostgisOverloads["routine:$extension:postgis.st_polygonize($extension:postgis._geometry)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_polygonize($extension:postgis.geometry)"];
  };
  st_project: {
    "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_project($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)"];
    "($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_project($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_project($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_project($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"];
  };
  st_quantizecoordinates: PostgisOverloads["routine:$extension:postgis.st_quantizecoordinates($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)"];
  st_reduceprecision: PostgisOverloads["routine:$extension:postgis.st_reduceprecision($extension:postgis.geometry,pg_catalog.float8)"];
  st_relate: {
    "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)"];
    "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.text)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry)"];
  };
  st_relatematch: PostgisOverloads["routine:$extension:postgis.st_relatematch(pg_catalog.text,pg_catalog.text)"];
  st_removeirrelevantpointsforview: PostgisOverloads["routine:$extension:postgis.st_removeirrelevantpointsforview($extension:postgis.geometry,$extension:postgis.box2d,pg_catalog.bool)"];
  st_removepoint: PostgisOverloads["routine:$extension:postgis.st_removepoint($extension:postgis.geometry,pg_catalog.int4)"];
  st_removerepeatedpoints: PostgisOverloads["routine:$extension:postgis.st_removerepeatedpoints($extension:postgis.geometry,pg_catalog.float8)"];
  st_removesmallparts: PostgisOverloads["routine:$extension:postgis.st_removesmallparts($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"];
  st_reverse: PostgisOverloads["routine:$extension:postgis.st_reverse($extension:postgis.geometry)"];
  st_rotate: {
    "($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8)"];
  };
  st_rotatex: PostgisOverloads["routine:$extension:postgis.st_rotatex($extension:postgis.geometry,pg_catalog.float8)"];
  st_rotatey: PostgisOverloads["routine:$extension:postgis.st_rotatey($extension:postgis.geometry,pg_catalog.float8)"];
  st_rotatez: PostgisOverloads["routine:$extension:postgis.st_rotatez($extension:postgis.geometry,pg_catalog.float8)"];
  st_scale: {
    "($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_scale($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_scale($extension:postgis.geometry,$extension:postgis.geometry)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_scale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_scale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"];
  };
  st_scroll: PostgisOverloads["routine:$extension:postgis.st_scroll($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_segmentize: {
    "($extension:postgis.geography,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_segmentize($extension:postgis.geography,pg_catalog.float8)"];
    "($extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_segmentize($extension:postgis.geometry,pg_catalog.float8)"];
  };
  st_seteffectivearea: PostgisOverloads["routine:$extension:postgis.st_seteffectivearea($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)"];
  st_setpoint: PostgisOverloads["routine:$extension:postgis.st_setpoint($extension:postgis.geometry,pg_catalog.int4,$extension:postgis.geometry)"];
  st_setsrid: {
    "($extension:postgis.geography,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_setsrid($extension:postgis.geography,pg_catalog.int4)"];
    "($extension:postgis.geometry,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_setsrid($extension:postgis.geometry,pg_catalog.int4)"];
  };
  st_sharedpaths: PostgisOverloads["routine:$extension:postgis.st_sharedpaths($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_shiftlongitude: PostgisOverloads["routine:$extension:postgis.st_shiftlongitude($extension:postgis.geometry)"];
  st_shortestline: {
    "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_shortestline($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_shortestline($extension:postgis.geometry,$extension:postgis.geometry)"];
    "(pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_shortestline(pg_catalog.text,pg_catalog.text)"];
  };
  st_simplify: {
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)": PostgisOverloads["routine:$extension:postgis.st_simplify($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)"];
    "($extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_simplify($extension:postgis.geometry,pg_catalog.float8)"];
  };
  st_simplifypolygonhull: PostgisOverloads["routine:$extension:postgis.st_simplifypolygonhull($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)"];
  st_simplifypreservetopology: PostgisOverloads["routine:$extension:postgis.st_simplifypreservetopology($extension:postgis.geometry,pg_catalog.float8)"];
  st_simplifyvw: PostgisOverloads["routine:$extension:postgis.st_simplifyvw($extension:postgis.geometry,pg_catalog.float8)"];
  st_snap: PostgisOverloads["routine:$extension:postgis.st_snap($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
  st_snaptogrid: {
    "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8)"];
  };
  st_split: PostgisOverloads["routine:$extension:postgis.st_split($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_square: PostgisOverloads["routine:$extension:postgis.st_square(pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry)"];
  st_squaregrid: PostgisOverloads["routine:$extension:postgis.st_squaregrid(pg_catalog.float8,$extension:postgis.geometry)"];
  st_srid: {
    "($extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis.st_srid($extension:postgis.geography)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_srid($extension:postgis.geometry)"];
  };
  st_startpoint: PostgisOverloads["routine:$extension:postgis.st_startpoint($extension:postgis.geometry)"];
  st_subdivide: PostgisOverloads["routine:$extension:postgis.st_subdivide($extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)"];
  st_summary: {
    "($extension:postgis.geography)": PostgisOverloads["routine:$extension:postgis.st_summary($extension:postgis.geography)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_summary($extension:postgis.geometry)"];
  };
  st_swapordinates: PostgisOverloads["routine:$extension:postgis.st_swapordinates($extension:postgis.geometry,pg_catalog.cstring)"];
  st_symdifference: PostgisOverloads["routine:$extension:postgis.st_symdifference($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
  st_symmetricdifference: PostgisOverloads["routine:$extension:postgis.st_symmetricdifference($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_tileenvelope: PostgisOverloads["routine:$extension:postgis.st_tileenvelope(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8)"];
  st_touches: PostgisOverloads["routine:$extension:postgis.st_touches($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_transform: {
    "($extension:postgis.geometry,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.int4)"];
    "($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)": PostgisOverloads["routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)"];
    "($extension:postgis.geometry,pg_catalog.text,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text,pg_catalog.text)"];
    "($extension:postgis.geometry,pg_catalog.text)": PostgisOverloads["routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text)"];
  };
  st_transformpipeline: PostgisOverloads["routine:$extension:postgis.st_transformpipeline($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)"];
  st_translate: {
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_translate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
    "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_translate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"];
  };
  st_transscale: PostgisOverloads["routine:$extension:postgis.st_transscale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"];
  st_triangulatepolygon: PostgisOverloads["routine:$extension:postgis.st_triangulatepolygon($extension:postgis.geometry)"];
  st_unaryunion: PostgisOverloads["routine:$extension:postgis.st_unaryunion($extension:postgis.geometry,pg_catalog.float8)"];
  st_union: {
    "($extension:postgis._geometry)": PostgisOverloads["routine:$extension:postgis.st_union($extension:postgis._geometry)"];
    "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_union($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"];
    "($extension:postgis.geometry,$extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_union($extension:postgis.geometry,$extension:postgis.geometry)"];
    "($extension:postgis.geometry,pg_catalog.float8)": PostgisOverloads["routine:$extension:postgis.st_union($extension:postgis.geometry,pg_catalog.float8)"];
    "($extension:postgis.geometry)": PostgisOverloads["routine:$extension:postgis.st_union($extension:postgis.geometry)"];
  };
  st_voronoilines: PostgisOverloads["routine:$extension:postgis.st_voronoilines($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)"];
  st_voronoipolygons: PostgisOverloads["routine:$extension:postgis.st_voronoipolygons($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)"];
  st_within: PostgisOverloads["routine:$extension:postgis.st_within($extension:postgis.geometry,$extension:postgis.geometry)"];
  st_wkbtosql: PostgisOverloads["routine:$extension:postgis.st_wkbtosql(pg_catalog.bytea)"];
  st_wkttosql: PostgisOverloads["routine:$extension:postgis.st_wkttosql(pg_catalog.text)"];
  st_wrapx: PostgisOverloads["routine:$extension:postgis.st_wrapx($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"];
  st_x: PostgisOverloads["routine:$extension:postgis.st_x($extension:postgis.geometry)"];
  st_xmax: PostgisOverloads["routine:$extension:postgis.st_xmax($extension:postgis.box3d)"];
  st_xmin: PostgisOverloads["routine:$extension:postgis.st_xmin($extension:postgis.box3d)"];
  st_y: PostgisOverloads["routine:$extension:postgis.st_y($extension:postgis.geometry)"];
  st_ymax: PostgisOverloads["routine:$extension:postgis.st_ymax($extension:postgis.box3d)"];
  st_ymin: PostgisOverloads["routine:$extension:postgis.st_ymin($extension:postgis.box3d)"];
  st_z: PostgisOverloads["routine:$extension:postgis.st_z($extension:postgis.geometry)"];
  st_zmax: PostgisOverloads["routine:$extension:postgis.st_zmax($extension:postgis.box3d)"];
  st_zmflag: PostgisOverloads["routine:$extension:postgis.st_zmflag($extension:postgis.geometry)"];
  st_zmin: PostgisOverloads["routine:$extension:postgis.st_zmin($extension:postgis.box3d)"];
  text: PostgisOverloads["routine:$extension:postgis.text($extension:postgis.geometry)"];
}
export interface PostgisCacheBboxOptions<Table extends PgTable> {
  readonly name: string;
  readonly table: Table;
  readonly column: AnyPgColumn;
}
/** Native cache_bbox reads one geometry column and adds its cached bounding box before INSERT/UPDATE. */
export function createPostgisCacheBboxTrigger<Table extends PgTable>(
  descriptor: Descriptor,
  options: PostgisCacheBboxOptions<Table>,
): ExtensionTriggerDeclaration {
  const table = getTableConfig(options.table);
  if (getColumnTable(options.column) !== options.table)
    throw new Error("PostGIS cache_bbox column must belong to its table");
  const nativeType = options.column.getSQLType();
  const geometryType = '"' + descriptor.schema.replaceAll('"', '""') + '"."geometry"';
  if (nativeType !== geometryType && !nativeType.startsWith(geometryType + "("))
    throw new Error("PostGIS cache_bbox requires the selected native geometry type");
  return Object.freeze({
    kind: "trigger",
    extension: Object.freeze({ name: descriptor.name, version: descriptor.version, digest }),
    member: "routine:$extension:postgis.postgis_cache_bbox()",
    name: options.name,
    timing: "before",
    level: "row",
    events: Object.freeze(["insert", "update"] as const),
    table: Object.freeze({ schema: table.schema ?? "public", name: table.name }),
    function: Object.freeze({ schema: descriptor.schema, name: "postgis_cache_bbox" }),
    arguments: Object.freeze([options.column.name]),
  });
}
export function createPostgisSchemaSurface(descriptor: Descriptor) {
  const schema = descriptor.schema;
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
    c42,
    nc42,
    c43,
    nc43,
    c44,
    nc44,
    c45,
    nc45,
    c46,
    nc46,
    c47,
    nc47,
  } = createPostgisCodecDefinitions(schema);
  const box2dField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis.box2d",
      type: "box2d",
      codec: c0,
      value: {
        kind: "object",
        properties: { type: { kind: "string", enum: ["box2d"] }, text: { kind: "string" } },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const box3dField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis.box3d",
      type: "box3d",
      codec: c2,
      value: {
        kind: "object",
        properties: { type: { kind: "string", enum: ["box3d"] }, text: { kind: "string" } },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const geographyField = (semantics: PostgisSemantics & { readonly type?: string } = {}) =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis.geography",
      type: "geography",
      codec: createPostgisGeographyCodec(schema, semantics),
      typmods: semantics.type
        ? [
            semantics.type +
              (semantics.dimensions === "XYZM"
                ? "ZM"
                : semantics.dimensions === "XYZ"
                  ? "Z"
                  : semantics.dimensions === "XYM"
                    ? "M"
                    : ""),
            semantics.srid ?? 0,
          ]
        : [],
      parameters: { srid: semantics.srid ?? "native", dimensions: semantics.dimensions ?? "native" },
      value: {
        kind: "union",
        variants: [
          {
            kind: "object",
            properties: {
              kind: { kind: "string", enum: ["geography"] },
              format: { kind: "string", enum: ["ewkb"] },
              hex: { kind: "string" },
              srid: { kind: "number", integer: true },
              dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
              geometryType: { kind: "number", integer: true },
            },
          },
          {
            kind: "object",
            properties: {
              kind: { kind: "string", enum: ["geography"] },
              format: { kind: "string", enum: ["ewkt"] },
              text: { kind: "string" },
              srid: { kind: "number", integer: true },
              dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
            },
          },
        ],
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const geometryField = (semantics: PostgisSemantics & { readonly type?: string } = {}) =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis.geometry",
      type: "geometry",
      codec: createPostgisGeometryCodec(schema, semantics),
      typmods: semantics.type
        ? [
            semantics.type +
              (semantics.dimensions === "XYZM"
                ? "ZM"
                : semantics.dimensions === "XYZ"
                  ? "Z"
                  : semantics.dimensions === "XYM"
                    ? "M"
                    : ""),
            semantics.srid ?? 0,
          ]
        : [],
      parameters: { srid: semantics.srid ?? "native", dimensions: semantics.dimensions ?? "native" },
      value: {
        kind: "union",
        variants: [
          {
            kind: "object",
            properties: {
              kind: { kind: "string", enum: ["geometry"] },
              format: { kind: "string", enum: ["ewkb"] },
              hex: { kind: "string" },
              srid: { kind: "number", integer: true },
              dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
              geometryType: { kind: "number", integer: true },
            },
          },
          {
            kind: "object",
            properties: {
              kind: { kind: "string", enum: ["geometry"] },
              format: { kind: "string", enum: ["ewkt"] },
              text: { kind: "string" },
              srid: { kind: "number", integer: true },
              dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
            },
          },
        ],
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const spheroidField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis.spheroid",
      type: "spheroid",
      codec: c6,
      value: {
        kind: "object",
        properties: { type: { kind: "string", enum: ["spheroid"] }, text: { kind: "string" } },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const box2dArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis._box2d",
      type: "box2d",
      array: true,
      codec: c31,
      value: {
        kind: "object",
        properties: {
          dimensions: {
            kind: "array",
            items: {
              kind: "object",
              properties: {
                lowerBound: { kind: "number", integer: true },
                length: { kind: "number", integer: true, minimum: 0 },
              },
            },
          },
          values: {
            kind: "union",
            variants: [
              {
                kind: "array",
                items: {
                  kind: "union",
                  variants: [
                    {
                      kind: "object",
                      properties: { type: { kind: "string", enum: ["box2d"] }, text: { kind: "string" } },
                    },
                    { kind: "null" },
                  ],
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "union",
                    variants: [
                      {
                        kind: "object",
                        properties: { type: { kind: "string", enum: ["box2d"] }, text: { kind: "string" } },
                      },
                      { kind: "null" },
                    ],
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "union",
                      variants: [
                        {
                          kind: "object",
                          properties: { type: { kind: "string", enum: ["box2d"] }, text: { kind: "string" } },
                        },
                        { kind: "null" },
                      ],
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "union",
                        variants: [
                          {
                            kind: "object",
                            properties: { type: { kind: "string", enum: ["box2d"] }, text: { kind: "string" } },
                          },
                          { kind: "null" },
                        ],
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "union",
                          variants: [
                            {
                              kind: "object",
                              properties: { type: { kind: "string", enum: ["box2d"] }, text: { kind: "string" } },
                            },
                            { kind: "null" },
                          ],
                        },
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "union",
                            variants: [
                              {
                                kind: "object",
                                properties: { type: { kind: "string", enum: ["box2d"] }, text: { kind: "string" } },
                              },
                              { kind: "null" },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const box2dfArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis._box2df",
      type: "box2df",
      array: true,
      codec: c32,
      value: {
        kind: "object",
        properties: {
          dimensions: {
            kind: "array",
            items: {
              kind: "object",
              properties: {
                lowerBound: { kind: "number", integer: true },
                length: { kind: "number", integer: true, minimum: 0 },
              },
            },
          },
          values: {
            kind: "union",
            variants: [
              {
                kind: "array",
                items: {
                  kind: "union",
                  variants: [
                    {
                      kind: "object",
                      properties: { type: { kind: "string", enum: ["box2df"] }, text: { kind: "string" } },
                    },
                    { kind: "null" },
                  ],
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "union",
                    variants: [
                      {
                        kind: "object",
                        properties: { type: { kind: "string", enum: ["box2df"] }, text: { kind: "string" } },
                      },
                      { kind: "null" },
                    ],
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "union",
                      variants: [
                        {
                          kind: "object",
                          properties: { type: { kind: "string", enum: ["box2df"] }, text: { kind: "string" } },
                        },
                        { kind: "null" },
                      ],
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "union",
                        variants: [
                          {
                            kind: "object",
                            properties: { type: { kind: "string", enum: ["box2df"] }, text: { kind: "string" } },
                          },
                          { kind: "null" },
                        ],
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "union",
                          variants: [
                            {
                              kind: "object",
                              properties: { type: { kind: "string", enum: ["box2df"] }, text: { kind: "string" } },
                            },
                            { kind: "null" },
                          ],
                        },
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "union",
                            variants: [
                              {
                                kind: "object",
                                properties: { type: { kind: "string", enum: ["box2df"] }, text: { kind: "string" } },
                              },
                              { kind: "null" },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const box3dArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis._box3d",
      type: "box3d",
      array: true,
      codec: c33,
      value: {
        kind: "object",
        properties: {
          dimensions: {
            kind: "array",
            items: {
              kind: "object",
              properties: {
                lowerBound: { kind: "number", integer: true },
                length: { kind: "number", integer: true, minimum: 0 },
              },
            },
          },
          values: {
            kind: "union",
            variants: [
              {
                kind: "array",
                items: {
                  kind: "union",
                  variants: [
                    {
                      kind: "object",
                      properties: { type: { kind: "string", enum: ["box3d"] }, text: { kind: "string" } },
                    },
                    { kind: "null" },
                  ],
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "union",
                    variants: [
                      {
                        kind: "object",
                        properties: { type: { kind: "string", enum: ["box3d"] }, text: { kind: "string" } },
                      },
                      { kind: "null" },
                    ],
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "union",
                      variants: [
                        {
                          kind: "object",
                          properties: { type: { kind: "string", enum: ["box3d"] }, text: { kind: "string" } },
                        },
                        { kind: "null" },
                      ],
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "union",
                        variants: [
                          {
                            kind: "object",
                            properties: { type: { kind: "string", enum: ["box3d"] }, text: { kind: "string" } },
                          },
                          { kind: "null" },
                        ],
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "union",
                          variants: [
                            {
                              kind: "object",
                              properties: { type: { kind: "string", enum: ["box3d"] }, text: { kind: "string" } },
                            },
                            { kind: "null" },
                          ],
                        },
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "union",
                            variants: [
                              {
                                kind: "object",
                                properties: { type: { kind: "string", enum: ["box3d"] }, text: { kind: "string" } },
                              },
                              { kind: "null" },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const geographyArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis._geography",
      type: "geography",
      array: true,
      codec: c34,
      value: {
        kind: "object",
        properties: {
          dimensions: {
            kind: "array",
            items: {
              kind: "object",
              properties: {
                lowerBound: { kind: "number", integer: true },
                length: { kind: "number", integer: true, minimum: 0 },
              },
            },
          },
          values: {
            kind: "union",
            variants: [
              {
                kind: "array",
                items: {
                  kind: "union",
                  variants: [
                    {
                      kind: "union",
                      variants: [
                        {
                          kind: "object",
                          properties: {
                            kind: { kind: "string", enum: ["geography"] },
                            format: { kind: "string", enum: ["ewkb"] },
                            hex: { kind: "string" },
                            srid: { kind: "number", integer: true },
                            dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                            geometryType: { kind: "number", integer: true },
                          },
                        },
                        {
                          kind: "object",
                          properties: {
                            kind: { kind: "string", enum: ["geography"] },
                            format: { kind: "string", enum: ["ewkt"] },
                            text: { kind: "string" },
                            srid: { kind: "number", integer: true },
                            dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                          },
                        },
                      ],
                    },
                    { kind: "null" },
                  ],
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "union",
                    variants: [
                      {
                        kind: "union",
                        variants: [
                          {
                            kind: "object",
                            properties: {
                              kind: { kind: "string", enum: ["geography"] },
                              format: { kind: "string", enum: ["ewkb"] },
                              hex: { kind: "string" },
                              srid: { kind: "number", integer: true },
                              dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                              geometryType: { kind: "number", integer: true },
                            },
                          },
                          {
                            kind: "object",
                            properties: {
                              kind: { kind: "string", enum: ["geography"] },
                              format: { kind: "string", enum: ["ewkt"] },
                              text: { kind: "string" },
                              srid: { kind: "number", integer: true },
                              dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                            },
                          },
                        ],
                      },
                      { kind: "null" },
                    ],
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "union",
                      variants: [
                        {
                          kind: "union",
                          variants: [
                            {
                              kind: "object",
                              properties: {
                                kind: { kind: "string", enum: ["geography"] },
                                format: { kind: "string", enum: ["ewkb"] },
                                hex: { kind: "string" },
                                srid: { kind: "number", integer: true },
                                dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                geometryType: { kind: "number", integer: true },
                              },
                            },
                            {
                              kind: "object",
                              properties: {
                                kind: { kind: "string", enum: ["geography"] },
                                format: { kind: "string", enum: ["ewkt"] },
                                text: { kind: "string" },
                                srid: { kind: "number", integer: true },
                                dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                              },
                            },
                          ],
                        },
                        { kind: "null" },
                      ],
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "union",
                        variants: [
                          {
                            kind: "union",
                            variants: [
                              {
                                kind: "object",
                                properties: {
                                  kind: { kind: "string", enum: ["geography"] },
                                  format: { kind: "string", enum: ["ewkb"] },
                                  hex: { kind: "string" },
                                  srid: { kind: "number", integer: true },
                                  dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                  geometryType: { kind: "number", integer: true },
                                },
                              },
                              {
                                kind: "object",
                                properties: {
                                  kind: { kind: "string", enum: ["geography"] },
                                  format: { kind: "string", enum: ["ewkt"] },
                                  text: { kind: "string" },
                                  srid: { kind: "number", integer: true },
                                  dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                },
                              },
                            ],
                          },
                          { kind: "null" },
                        ],
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "union",
                          variants: [
                            {
                              kind: "union",
                              variants: [
                                {
                                  kind: "object",
                                  properties: {
                                    kind: { kind: "string", enum: ["geography"] },
                                    format: { kind: "string", enum: ["ewkb"] },
                                    hex: { kind: "string" },
                                    srid: { kind: "number", integer: true },
                                    dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                    geometryType: { kind: "number", integer: true },
                                  },
                                },
                                {
                                  kind: "object",
                                  properties: {
                                    kind: { kind: "string", enum: ["geography"] },
                                    format: { kind: "string", enum: ["ewkt"] },
                                    text: { kind: "string" },
                                    srid: { kind: "number", integer: true },
                                    dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                  },
                                },
                              ],
                            },
                            { kind: "null" },
                          ],
                        },
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "union",
                            variants: [
                              {
                                kind: "union",
                                variants: [
                                  {
                                    kind: "object",
                                    properties: {
                                      kind: { kind: "string", enum: ["geography"] },
                                      format: { kind: "string", enum: ["ewkb"] },
                                      hex: { kind: "string" },
                                      srid: { kind: "number", integer: true },
                                      dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                      geometryType: { kind: "number", integer: true },
                                    },
                                  },
                                  {
                                    kind: "object",
                                    properties: {
                                      kind: { kind: "string", enum: ["geography"] },
                                      format: { kind: "string", enum: ["ewkt"] },
                                      text: { kind: "string" },
                                      srid: { kind: "number", integer: true },
                                      dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                    },
                                  },
                                ],
                              },
                              { kind: "null" },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const geography_columnsArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis._geography_columns",
      type: "geography_columns",
      array: true,
      codec: c43,
      value: {
        kind: "object",
        properties: {
          dimensions: {
            kind: "array",
            items: {
              kind: "object",
              properties: {
                lowerBound: { kind: "number", integer: true },
                length: { kind: "number", integer: true, minimum: 0 },
              },
            },
          },
          values: {
            kind: "union",
            variants: [
              {
                kind: "array",
                items: {
                  kind: "union",
                  variants: [
                    {
                      kind: "object",
                      properties: {
                        f_table_catalog: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                        f_table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                        f_table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                        f_geography_column: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                        coord_dimension: {
                          kind: "union",
                          variants: [{ kind: "number", integer: true }, { kind: "null" }],
                        },
                        srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                        type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                      },
                    },
                    { kind: "null" },
                  ],
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "union",
                    variants: [
                      {
                        kind: "object",
                        properties: {
                          f_table_catalog: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                          f_table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                          f_table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                          f_geography_column: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                          coord_dimension: {
                            kind: "union",
                            variants: [{ kind: "number", integer: true }, { kind: "null" }],
                          },
                          srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                          type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                        },
                      },
                      { kind: "null" },
                    ],
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "union",
                      variants: [
                        {
                          kind: "object",
                          properties: {
                            f_table_catalog: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                            f_table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                            f_table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                            f_geography_column: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                            coord_dimension: {
                              kind: "union",
                              variants: [{ kind: "number", integer: true }, { kind: "null" }],
                            },
                            srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                            type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                          },
                        },
                        { kind: "null" },
                      ],
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "union",
                        variants: [
                          {
                            kind: "object",
                            properties: {
                              f_table_catalog: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                              f_table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                              f_table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                              f_geography_column: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                              coord_dimension: {
                                kind: "union",
                                variants: [{ kind: "number", integer: true }, { kind: "null" }],
                              },
                              srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                              type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                            },
                          },
                          { kind: "null" },
                        ],
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "union",
                          variants: [
                            {
                              kind: "object",
                              properties: {
                                f_table_catalog: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                f_table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                f_table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                f_geography_column: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                coord_dimension: {
                                  kind: "union",
                                  variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                },
                                srid: {
                                  kind: "union",
                                  variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                },
                                type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                              },
                            },
                            { kind: "null" },
                          ],
                        },
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "union",
                            variants: [
                              {
                                kind: "object",
                                properties: {
                                  f_table_catalog: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                  f_table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                  f_table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                  f_geography_column: {
                                    kind: "union",
                                    variants: [{ kind: "string" }, { kind: "null" }],
                                  },
                                  coord_dimension: {
                                    kind: "union",
                                    variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                  },
                                  srid: {
                                    kind: "union",
                                    variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                  },
                                  type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                },
                              },
                              { kind: "null" },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const geometryArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis._geometry",
      type: "geometry",
      array: true,
      codec: c35,
      value: {
        kind: "object",
        properties: {
          dimensions: {
            kind: "array",
            items: {
              kind: "object",
              properties: {
                lowerBound: { kind: "number", integer: true },
                length: { kind: "number", integer: true, minimum: 0 },
              },
            },
          },
          values: {
            kind: "union",
            variants: [
              {
                kind: "array",
                items: {
                  kind: "union",
                  variants: [
                    {
                      kind: "union",
                      variants: [
                        {
                          kind: "object",
                          properties: {
                            kind: { kind: "string", enum: ["geometry"] },
                            format: { kind: "string", enum: ["ewkb"] },
                            hex: { kind: "string" },
                            srid: { kind: "number", integer: true },
                            dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                            geometryType: { kind: "number", integer: true },
                          },
                        },
                        {
                          kind: "object",
                          properties: {
                            kind: { kind: "string", enum: ["geometry"] },
                            format: { kind: "string", enum: ["ewkt"] },
                            text: { kind: "string" },
                            srid: { kind: "number", integer: true },
                            dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                          },
                        },
                      ],
                    },
                    { kind: "null" },
                  ],
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "union",
                    variants: [
                      {
                        kind: "union",
                        variants: [
                          {
                            kind: "object",
                            properties: {
                              kind: { kind: "string", enum: ["geometry"] },
                              format: { kind: "string", enum: ["ewkb"] },
                              hex: { kind: "string" },
                              srid: { kind: "number", integer: true },
                              dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                              geometryType: { kind: "number", integer: true },
                            },
                          },
                          {
                            kind: "object",
                            properties: {
                              kind: { kind: "string", enum: ["geometry"] },
                              format: { kind: "string", enum: ["ewkt"] },
                              text: { kind: "string" },
                              srid: { kind: "number", integer: true },
                              dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                            },
                          },
                        ],
                      },
                      { kind: "null" },
                    ],
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "union",
                      variants: [
                        {
                          kind: "union",
                          variants: [
                            {
                              kind: "object",
                              properties: {
                                kind: { kind: "string", enum: ["geometry"] },
                                format: { kind: "string", enum: ["ewkb"] },
                                hex: { kind: "string" },
                                srid: { kind: "number", integer: true },
                                dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                geometryType: { kind: "number", integer: true },
                              },
                            },
                            {
                              kind: "object",
                              properties: {
                                kind: { kind: "string", enum: ["geometry"] },
                                format: { kind: "string", enum: ["ewkt"] },
                                text: { kind: "string" },
                                srid: { kind: "number", integer: true },
                                dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                              },
                            },
                          ],
                        },
                        { kind: "null" },
                      ],
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "union",
                        variants: [
                          {
                            kind: "union",
                            variants: [
                              {
                                kind: "object",
                                properties: {
                                  kind: { kind: "string", enum: ["geometry"] },
                                  format: { kind: "string", enum: ["ewkb"] },
                                  hex: { kind: "string" },
                                  srid: { kind: "number", integer: true },
                                  dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                  geometryType: { kind: "number", integer: true },
                                },
                              },
                              {
                                kind: "object",
                                properties: {
                                  kind: { kind: "string", enum: ["geometry"] },
                                  format: { kind: "string", enum: ["ewkt"] },
                                  text: { kind: "string" },
                                  srid: { kind: "number", integer: true },
                                  dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                },
                              },
                            ],
                          },
                          { kind: "null" },
                        ],
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "union",
                          variants: [
                            {
                              kind: "union",
                              variants: [
                                {
                                  kind: "object",
                                  properties: {
                                    kind: { kind: "string", enum: ["geometry"] },
                                    format: { kind: "string", enum: ["ewkb"] },
                                    hex: { kind: "string" },
                                    srid: { kind: "number", integer: true },
                                    dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                    geometryType: { kind: "number", integer: true },
                                  },
                                },
                                {
                                  kind: "object",
                                  properties: {
                                    kind: { kind: "string", enum: ["geometry"] },
                                    format: { kind: "string", enum: ["ewkt"] },
                                    text: { kind: "string" },
                                    srid: { kind: "number", integer: true },
                                    dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                  },
                                },
                              ],
                            },
                            { kind: "null" },
                          ],
                        },
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "union",
                            variants: [
                              {
                                kind: "union",
                                variants: [
                                  {
                                    kind: "object",
                                    properties: {
                                      kind: { kind: "string", enum: ["geometry"] },
                                      format: { kind: "string", enum: ["ewkb"] },
                                      hex: { kind: "string" },
                                      srid: { kind: "number", integer: true },
                                      dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                      geometryType: { kind: "number", integer: true },
                                    },
                                  },
                                  {
                                    kind: "object",
                                    properties: {
                                      kind: { kind: "string", enum: ["geometry"] },
                                      format: { kind: "string", enum: ["ewkt"] },
                                      text: { kind: "string" },
                                      srid: { kind: "number", integer: true },
                                      dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                    },
                                  },
                                ],
                              },
                              { kind: "null" },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const geometry_columnsArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis._geometry_columns",
      type: "geometry_columns",
      array: true,
      codec: c44,
      value: {
        kind: "object",
        properties: {
          dimensions: {
            kind: "array",
            items: {
              kind: "object",
              properties: {
                lowerBound: { kind: "number", integer: true },
                length: { kind: "number", integer: true, minimum: 0 },
              },
            },
          },
          values: {
            kind: "union",
            variants: [
              {
                kind: "array",
                items: {
                  kind: "union",
                  variants: [
                    {
                      kind: "object",
                      properties: {
                        f_table_catalog: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                        f_table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                        f_table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                        f_geometry_column: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                        coord_dimension: {
                          kind: "union",
                          variants: [{ kind: "number", integer: true }, { kind: "null" }],
                        },
                        srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                        type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                      },
                    },
                    { kind: "null" },
                  ],
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "union",
                    variants: [
                      {
                        kind: "object",
                        properties: {
                          f_table_catalog: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                          f_table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                          f_table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                          f_geometry_column: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                          coord_dimension: {
                            kind: "union",
                            variants: [{ kind: "number", integer: true }, { kind: "null" }],
                          },
                          srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                          type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                        },
                      },
                      { kind: "null" },
                    ],
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "union",
                      variants: [
                        {
                          kind: "object",
                          properties: {
                            f_table_catalog: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                            f_table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                            f_table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                            f_geometry_column: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                            coord_dimension: {
                              kind: "union",
                              variants: [{ kind: "number", integer: true }, { kind: "null" }],
                            },
                            srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                            type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                          },
                        },
                        { kind: "null" },
                      ],
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "union",
                        variants: [
                          {
                            kind: "object",
                            properties: {
                              f_table_catalog: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                              f_table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                              f_table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                              f_geometry_column: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                              coord_dimension: {
                                kind: "union",
                                variants: [{ kind: "number", integer: true }, { kind: "null" }],
                              },
                              srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                              type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                            },
                          },
                          { kind: "null" },
                        ],
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "union",
                          variants: [
                            {
                              kind: "object",
                              properties: {
                                f_table_catalog: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                f_table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                f_table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                f_geometry_column: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                coord_dimension: {
                                  kind: "union",
                                  variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                },
                                srid: {
                                  kind: "union",
                                  variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                },
                                type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                              },
                            },
                            { kind: "null" },
                          ],
                        },
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "union",
                            variants: [
                              {
                                kind: "object",
                                properties: {
                                  f_table_catalog: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                  f_table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                  f_table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                  f_geometry_column: {
                                    kind: "union",
                                    variants: [{ kind: "string" }, { kind: "null" }],
                                  },
                                  coord_dimension: {
                                    kind: "union",
                                    variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                  },
                                  srid: {
                                    kind: "union",
                                    variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                  },
                                  type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                },
                              },
                              { kind: "null" },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const geometry_dumpArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis._geometry_dump",
      type: "geometry_dump",
      array: true,
      codec: c45,
      value: {
        kind: "object",
        properties: {
          dimensions: {
            kind: "array",
            items: {
              kind: "object",
              properties: {
                lowerBound: { kind: "number", integer: true },
                length: { kind: "number", integer: true, minimum: 0 },
              },
            },
          },
          values: {
            kind: "union",
            variants: [
              {
                kind: "array",
                items: {
                  kind: "union",
                  variants: [
                    {
                      kind: "object",
                      properties: {
                        path: {
                          kind: "union",
                          variants: [
                            {
                              kind: "object",
                              properties: {
                                dimensions: {
                                  kind: "array",
                                  items: {
                                    kind: "object",
                                    properties: {
                                      lowerBound: { kind: "number", integer: true },
                                      length: { kind: "number", integer: true, minimum: 0 },
                                    },
                                  },
                                },
                                values: {
                                  kind: "union",
                                  variants: [
                                    {
                                      kind: "array",
                                      items: {
                                        kind: "union",
                                        variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                      },
                                    },
                                    {
                                      kind: "array",
                                      items: {
                                        kind: "array",
                                        items: {
                                          kind: "union",
                                          variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                        },
                                      },
                                    },
                                    {
                                      kind: "array",
                                      items: {
                                        kind: "array",
                                        items: {
                                          kind: "array",
                                          items: {
                                            kind: "union",
                                            variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                          },
                                        },
                                      },
                                    },
                                    {
                                      kind: "array",
                                      items: {
                                        kind: "array",
                                        items: {
                                          kind: "array",
                                          items: {
                                            kind: "array",
                                            items: {
                                              kind: "union",
                                              variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                            },
                                          },
                                        },
                                      },
                                    },
                                    {
                                      kind: "array",
                                      items: {
                                        kind: "array",
                                        items: {
                                          kind: "array",
                                          items: {
                                            kind: "array",
                                            items: {
                                              kind: "array",
                                              items: {
                                                kind: "union",
                                                variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                    {
                                      kind: "array",
                                      items: {
                                        kind: "array",
                                        items: {
                                          kind: "array",
                                          items: {
                                            kind: "array",
                                            items: {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "union",
                                                  variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                },
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                  ],
                                },
                              },
                            },
                            { kind: "null" },
                          ],
                        },
                        geom: {
                          kind: "union",
                          variants: [
                            {
                              kind: "union",
                              variants: [
                                {
                                  kind: "object",
                                  properties: {
                                    kind: { kind: "string", enum: ["geometry"] },
                                    format: { kind: "string", enum: ["ewkb"] },
                                    hex: { kind: "string" },
                                    srid: { kind: "number", integer: true },
                                    dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                    geometryType: { kind: "number", integer: true },
                                  },
                                },
                                {
                                  kind: "object",
                                  properties: {
                                    kind: { kind: "string", enum: ["geometry"] },
                                    format: { kind: "string", enum: ["ewkt"] },
                                    text: { kind: "string" },
                                    srid: { kind: "number", integer: true },
                                    dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                  },
                                },
                              ],
                            },
                            { kind: "null" },
                          ],
                        },
                      },
                    },
                    { kind: "null" },
                  ],
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "union",
                    variants: [
                      {
                        kind: "object",
                        properties: {
                          path: {
                            kind: "union",
                            variants: [
                              {
                                kind: "object",
                                properties: {
                                  dimensions: {
                                    kind: "array",
                                    items: {
                                      kind: "object",
                                      properties: {
                                        lowerBound: { kind: "number", integer: true },
                                        length: { kind: "number", integer: true, minimum: 0 },
                                      },
                                    },
                                  },
                                  values: {
                                    kind: "union",
                                    variants: [
                                      {
                                        kind: "array",
                                        items: {
                                          kind: "union",
                                          variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                        },
                                      },
                                      {
                                        kind: "array",
                                        items: {
                                          kind: "array",
                                          items: {
                                            kind: "union",
                                            variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                          },
                                        },
                                      },
                                      {
                                        kind: "array",
                                        items: {
                                          kind: "array",
                                          items: {
                                            kind: "array",
                                            items: {
                                              kind: "union",
                                              variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                            },
                                          },
                                        },
                                      },
                                      {
                                        kind: "array",
                                        items: {
                                          kind: "array",
                                          items: {
                                            kind: "array",
                                            items: {
                                              kind: "array",
                                              items: {
                                                kind: "union",
                                                variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                              },
                                            },
                                          },
                                        },
                                      },
                                      {
                                        kind: "array",
                                        items: {
                                          kind: "array",
                                          items: {
                                            kind: "array",
                                            items: {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "union",
                                                  variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                },
                                              },
                                            },
                                          },
                                        },
                                      },
                                      {
                                        kind: "array",
                                        items: {
                                          kind: "array",
                                          items: {
                                            kind: "array",
                                            items: {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "union",
                                                    variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        },
                                      },
                                    ],
                                  },
                                },
                              },
                              { kind: "null" },
                            ],
                          },
                          geom: {
                            kind: "union",
                            variants: [
                              {
                                kind: "union",
                                variants: [
                                  {
                                    kind: "object",
                                    properties: {
                                      kind: { kind: "string", enum: ["geometry"] },
                                      format: { kind: "string", enum: ["ewkb"] },
                                      hex: { kind: "string" },
                                      srid: { kind: "number", integer: true },
                                      dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                      geometryType: { kind: "number", integer: true },
                                    },
                                  },
                                  {
                                    kind: "object",
                                    properties: {
                                      kind: { kind: "string", enum: ["geometry"] },
                                      format: { kind: "string", enum: ["ewkt"] },
                                      text: { kind: "string" },
                                      srid: { kind: "number", integer: true },
                                      dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                    },
                                  },
                                ],
                              },
                              { kind: "null" },
                            ],
                          },
                        },
                      },
                      { kind: "null" },
                    ],
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "union",
                      variants: [
                        {
                          kind: "object",
                          properties: {
                            path: {
                              kind: "union",
                              variants: [
                                {
                                  kind: "object",
                                  properties: {
                                    dimensions: {
                                      kind: "array",
                                      items: {
                                        kind: "object",
                                        properties: {
                                          lowerBound: { kind: "number", integer: true },
                                          length: { kind: "number", integer: true, minimum: 0 },
                                        },
                                      },
                                    },
                                    values: {
                                      kind: "union",
                                      variants: [
                                        {
                                          kind: "array",
                                          items: {
                                            kind: "union",
                                            variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                          },
                                        },
                                        {
                                          kind: "array",
                                          items: {
                                            kind: "array",
                                            items: {
                                              kind: "union",
                                              variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                            },
                                          },
                                        },
                                        {
                                          kind: "array",
                                          items: {
                                            kind: "array",
                                            items: {
                                              kind: "array",
                                              items: {
                                                kind: "union",
                                                variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                              },
                                            },
                                          },
                                        },
                                        {
                                          kind: "array",
                                          items: {
                                            kind: "array",
                                            items: {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "union",
                                                  variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                },
                                              },
                                            },
                                          },
                                        },
                                        {
                                          kind: "array",
                                          items: {
                                            kind: "array",
                                            items: {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "union",
                                                    variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        },
                                        {
                                          kind: "array",
                                          items: {
                                            kind: "array",
                                            items: {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "array",
                                                    items: {
                                                      kind: "union",
                                                      variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        },
                                      ],
                                    },
                                  },
                                },
                                { kind: "null" },
                              ],
                            },
                            geom: {
                              kind: "union",
                              variants: [
                                {
                                  kind: "union",
                                  variants: [
                                    {
                                      kind: "object",
                                      properties: {
                                        kind: { kind: "string", enum: ["geometry"] },
                                        format: { kind: "string", enum: ["ewkb"] },
                                        hex: { kind: "string" },
                                        srid: { kind: "number", integer: true },
                                        dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                        geometryType: { kind: "number", integer: true },
                                      },
                                    },
                                    {
                                      kind: "object",
                                      properties: {
                                        kind: { kind: "string", enum: ["geometry"] },
                                        format: { kind: "string", enum: ["ewkt"] },
                                        text: { kind: "string" },
                                        srid: { kind: "number", integer: true },
                                        dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                      },
                                    },
                                  ],
                                },
                                { kind: "null" },
                              ],
                            },
                          },
                        },
                        { kind: "null" },
                      ],
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "union",
                        variants: [
                          {
                            kind: "object",
                            properties: {
                              path: {
                                kind: "union",
                                variants: [
                                  {
                                    kind: "object",
                                    properties: {
                                      dimensions: {
                                        kind: "array",
                                        items: {
                                          kind: "object",
                                          properties: {
                                            lowerBound: { kind: "number", integer: true },
                                            length: { kind: "number", integer: true, minimum: 0 },
                                          },
                                        },
                                      },
                                      values: {
                                        kind: "union",
                                        variants: [
                                          {
                                            kind: "array",
                                            items: {
                                              kind: "union",
                                              variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                            },
                                          },
                                          {
                                            kind: "array",
                                            items: {
                                              kind: "array",
                                              items: {
                                                kind: "union",
                                                variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                              },
                                            },
                                          },
                                          {
                                            kind: "array",
                                            items: {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "union",
                                                  variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                },
                                              },
                                            },
                                          },
                                          {
                                            kind: "array",
                                            items: {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "union",
                                                    variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                  },
                                                },
                                              },
                                            },
                                          },
                                          {
                                            kind: "array",
                                            items: {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "array",
                                                    items: {
                                                      kind: "union",
                                                      variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                          {
                                            kind: "array",
                                            items: {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "array",
                                                    items: {
                                                      kind: "array",
                                                      items: {
                                                        kind: "union",
                                                        variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        ],
                                      },
                                    },
                                  },
                                  { kind: "null" },
                                ],
                              },
                              geom: {
                                kind: "union",
                                variants: [
                                  {
                                    kind: "union",
                                    variants: [
                                      {
                                        kind: "object",
                                        properties: {
                                          kind: { kind: "string", enum: ["geometry"] },
                                          format: { kind: "string", enum: ["ewkb"] },
                                          hex: { kind: "string" },
                                          srid: { kind: "number", integer: true },
                                          dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                          geometryType: { kind: "number", integer: true },
                                        },
                                      },
                                      {
                                        kind: "object",
                                        properties: {
                                          kind: { kind: "string", enum: ["geometry"] },
                                          format: { kind: "string", enum: ["ewkt"] },
                                          text: { kind: "string" },
                                          srid: { kind: "number", integer: true },
                                          dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                        },
                                      },
                                    ],
                                  },
                                  { kind: "null" },
                                ],
                              },
                            },
                          },
                          { kind: "null" },
                        ],
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "union",
                          variants: [
                            {
                              kind: "object",
                              properties: {
                                path: {
                                  kind: "union",
                                  variants: [
                                    {
                                      kind: "object",
                                      properties: {
                                        dimensions: {
                                          kind: "array",
                                          items: {
                                            kind: "object",
                                            properties: {
                                              lowerBound: { kind: "number", integer: true },
                                              length: { kind: "number", integer: true, minimum: 0 },
                                            },
                                          },
                                        },
                                        values: {
                                          kind: "union",
                                          variants: [
                                            {
                                              kind: "array",
                                              items: {
                                                kind: "union",
                                                variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                              },
                                            },
                                            {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "union",
                                                  variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                },
                                              },
                                            },
                                            {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "union",
                                                    variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                  },
                                                },
                                              },
                                            },
                                            {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "array",
                                                    items: {
                                                      kind: "union",
                                                      variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                            {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "array",
                                                    items: {
                                                      kind: "array",
                                                      items: {
                                                        kind: "union",
                                                        variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                            {
                                              kind: "array",
                                              items: {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "array",
                                                    items: {
                                                      kind: "array",
                                                      items: {
                                                        kind: "array",
                                                        items: {
                                                          kind: "union",
                                                          variants: [
                                                            { kind: "number", integer: true },
                                                            { kind: "null" },
                                                          ],
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          ],
                                        },
                                      },
                                    },
                                    { kind: "null" },
                                  ],
                                },
                                geom: {
                                  kind: "union",
                                  variants: [
                                    {
                                      kind: "union",
                                      variants: [
                                        {
                                          kind: "object",
                                          properties: {
                                            kind: { kind: "string", enum: ["geometry"] },
                                            format: { kind: "string", enum: ["ewkb"] },
                                            hex: { kind: "string" },
                                            srid: { kind: "number", integer: true },
                                            dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                            geometryType: { kind: "number", integer: true },
                                          },
                                        },
                                        {
                                          kind: "object",
                                          properties: {
                                            kind: { kind: "string", enum: ["geometry"] },
                                            format: { kind: "string", enum: ["ewkt"] },
                                            text: { kind: "string" },
                                            srid: { kind: "number", integer: true },
                                            dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                          },
                                        },
                                      ],
                                    },
                                    { kind: "null" },
                                  ],
                                },
                              },
                            },
                            { kind: "null" },
                          ],
                        },
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "union",
                            variants: [
                              {
                                kind: "object",
                                properties: {
                                  path: {
                                    kind: "union",
                                    variants: [
                                      {
                                        kind: "object",
                                        properties: {
                                          dimensions: {
                                            kind: "array",
                                            items: {
                                              kind: "object",
                                              properties: {
                                                lowerBound: { kind: "number", integer: true },
                                                length: { kind: "number", integer: true, minimum: 0 },
                                              },
                                            },
                                          },
                                          values: {
                                            kind: "union",
                                            variants: [
                                              {
                                                kind: "array",
                                                items: {
                                                  kind: "union",
                                                  variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                },
                                              },
                                              {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "union",
                                                    variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                  },
                                                },
                                              },
                                              {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "array",
                                                    items: {
                                                      kind: "union",
                                                      variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                    },
                                                  },
                                                },
                                              },
                                              {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "array",
                                                    items: {
                                                      kind: "array",
                                                      items: {
                                                        kind: "union",
                                                        variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                              {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "array",
                                                    items: {
                                                      kind: "array",
                                                      items: {
                                                        kind: "array",
                                                        items: {
                                                          kind: "union",
                                                          variants: [
                                                            { kind: "number", integer: true },
                                                            { kind: "null" },
                                                          ],
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                              {
                                                kind: "array",
                                                items: {
                                                  kind: "array",
                                                  items: {
                                                    kind: "array",
                                                    items: {
                                                      kind: "array",
                                                      items: {
                                                        kind: "array",
                                                        items: {
                                                          kind: "array",
                                                          items: {
                                                            kind: "union",
                                                            variants: [
                                                              { kind: "number", integer: true },
                                                              { kind: "null" },
                                                            ],
                                                          },
                                                        },
                                                      },
                                                    },
                                                  },
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      },
                                      { kind: "null" },
                                    ],
                                  },
                                  geom: {
                                    kind: "union",
                                    variants: [
                                      {
                                        kind: "union",
                                        variants: [
                                          {
                                            kind: "object",
                                            properties: {
                                              kind: { kind: "string", enum: ["geometry"] },
                                              format: { kind: "string", enum: ["ewkb"] },
                                              hex: { kind: "string" },
                                              srid: { kind: "number", integer: true },
                                              dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                              geometryType: { kind: "number", integer: true },
                                            },
                                          },
                                          {
                                            kind: "object",
                                            properties: {
                                              kind: { kind: "string", enum: ["geometry"] },
                                              format: { kind: "string", enum: ["ewkt"] },
                                              text: { kind: "string" },
                                              srid: { kind: "number", integer: true },
                                              dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                            },
                                          },
                                        ],
                                      },
                                      { kind: "null" },
                                    ],
                                  },
                                },
                              },
                              { kind: "null" },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const gidxArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis._gidx",
      type: "gidx",
      array: true,
      codec: c36,
      value: {
        kind: "object",
        properties: {
          dimensions: {
            kind: "array",
            items: {
              kind: "object",
              properties: {
                lowerBound: { kind: "number", integer: true },
                length: { kind: "number", integer: true, minimum: 0 },
              },
            },
          },
          values: {
            kind: "union",
            variants: [
              {
                kind: "array",
                items: {
                  kind: "union",
                  variants: [
                    {
                      kind: "object",
                      properties: { type: { kind: "string", enum: ["gidx"] }, text: { kind: "string" } },
                    },
                    { kind: "null" },
                  ],
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "union",
                    variants: [
                      {
                        kind: "object",
                        properties: { type: { kind: "string", enum: ["gidx"] }, text: { kind: "string" } },
                      },
                      { kind: "null" },
                    ],
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "union",
                      variants: [
                        {
                          kind: "object",
                          properties: { type: { kind: "string", enum: ["gidx"] }, text: { kind: "string" } },
                        },
                        { kind: "null" },
                      ],
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "union",
                        variants: [
                          {
                            kind: "object",
                            properties: { type: { kind: "string", enum: ["gidx"] }, text: { kind: "string" } },
                          },
                          { kind: "null" },
                        ],
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "union",
                          variants: [
                            {
                              kind: "object",
                              properties: { type: { kind: "string", enum: ["gidx"] }, text: { kind: "string" } },
                            },
                            { kind: "null" },
                          ],
                        },
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "union",
                            variants: [
                              {
                                kind: "object",
                                properties: { type: { kind: "string", enum: ["gidx"] }, text: { kind: "string" } },
                              },
                              { kind: "null" },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const spatial_ref_sysArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis._spatial_ref_sys",
      type: "spatial_ref_sys",
      array: true,
      codec: c46,
      value: {
        kind: "object",
        properties: {
          dimensions: {
            kind: "array",
            items: {
              kind: "object",
              properties: {
                lowerBound: { kind: "number", integer: true },
                length: { kind: "number", integer: true, minimum: 0 },
              },
            },
          },
          values: {
            kind: "union",
            variants: [
              {
                kind: "array",
                items: {
                  kind: "union",
                  variants: [
                    {
                      kind: "object",
                      properties: {
                        srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                        auth_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                        auth_srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                        srtext: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                        proj4text: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                      },
                    },
                    { kind: "null" },
                  ],
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "union",
                    variants: [
                      {
                        kind: "object",
                        properties: {
                          srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                          auth_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                          auth_srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                          srtext: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                          proj4text: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                        },
                      },
                      { kind: "null" },
                    ],
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "union",
                      variants: [
                        {
                          kind: "object",
                          properties: {
                            srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                            auth_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                            auth_srid: {
                              kind: "union",
                              variants: [{ kind: "number", integer: true }, { kind: "null" }],
                            },
                            srtext: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                            proj4text: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                          },
                        },
                        { kind: "null" },
                      ],
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "union",
                        variants: [
                          {
                            kind: "object",
                            properties: {
                              srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                              auth_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                              auth_srid: {
                                kind: "union",
                                variants: [{ kind: "number", integer: true }, { kind: "null" }],
                              },
                              srtext: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                              proj4text: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                            },
                          },
                          { kind: "null" },
                        ],
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "union",
                          variants: [
                            {
                              kind: "object",
                              properties: {
                                srid: {
                                  kind: "union",
                                  variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                },
                                auth_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                auth_srid: {
                                  kind: "union",
                                  variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                },
                                srtext: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                proj4text: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                              },
                            },
                            { kind: "null" },
                          ],
                        },
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "union",
                            variants: [
                              {
                                kind: "object",
                                properties: {
                                  srid: {
                                    kind: "union",
                                    variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                  },
                                  auth_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                  auth_srid: {
                                    kind: "union",
                                    variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                  },
                                  srtext: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                  proj4text: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                },
                              },
                              { kind: "null" },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const spheroidArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis._spheroid",
      type: "spheroid",
      array: true,
      codec: c37,
      value: {
        kind: "object",
        properties: {
          dimensions: {
            kind: "array",
            items: {
              kind: "object",
              properties: {
                lowerBound: { kind: "number", integer: true },
                length: { kind: "number", integer: true, minimum: 0 },
              },
            },
          },
          values: {
            kind: "union",
            variants: [
              {
                kind: "array",
                items: {
                  kind: "union",
                  variants: [
                    {
                      kind: "object",
                      properties: { type: { kind: "string", enum: ["spheroid"] }, text: { kind: "string" } },
                    },
                    { kind: "null" },
                  ],
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "union",
                    variants: [
                      {
                        kind: "object",
                        properties: { type: { kind: "string", enum: ["spheroid"] }, text: { kind: "string" } },
                      },
                      { kind: "null" },
                    ],
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "union",
                      variants: [
                        {
                          kind: "object",
                          properties: { type: { kind: "string", enum: ["spheroid"] }, text: { kind: "string" } },
                        },
                        { kind: "null" },
                      ],
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "union",
                        variants: [
                          {
                            kind: "object",
                            properties: { type: { kind: "string", enum: ["spheroid"] }, text: { kind: "string" } },
                          },
                          { kind: "null" },
                        ],
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "union",
                          variants: [
                            {
                              kind: "object",
                              properties: { type: { kind: "string", enum: ["spheroid"] }, text: { kind: "string" } },
                            },
                            { kind: "null" },
                          ],
                        },
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "union",
                            variants: [
                              {
                                kind: "object",
                                properties: { type: { kind: "string", enum: ["spheroid"] }, text: { kind: "string" } },
                              },
                              { kind: "null" },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const valid_detailArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis._valid_detail",
      type: "valid_detail",
      array: true,
      codec: c47,
      value: {
        kind: "object",
        properties: {
          dimensions: {
            kind: "array",
            items: {
              kind: "object",
              properties: {
                lowerBound: { kind: "number", integer: true },
                length: { kind: "number", integer: true, minimum: 0 },
              },
            },
          },
          values: {
            kind: "union",
            variants: [
              {
                kind: "array",
                items: {
                  kind: "union",
                  variants: [
                    {
                      kind: "object",
                      properties: {
                        valid: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
                        reason: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                        location: {
                          kind: "union",
                          variants: [
                            {
                              kind: "union",
                              variants: [
                                {
                                  kind: "object",
                                  properties: {
                                    kind: { kind: "string", enum: ["geometry"] },
                                    format: { kind: "string", enum: ["ewkb"] },
                                    hex: { kind: "string" },
                                    srid: { kind: "number", integer: true },
                                    dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                    geometryType: { kind: "number", integer: true },
                                  },
                                },
                                {
                                  kind: "object",
                                  properties: {
                                    kind: { kind: "string", enum: ["geometry"] },
                                    format: { kind: "string", enum: ["ewkt"] },
                                    text: { kind: "string" },
                                    srid: { kind: "number", integer: true },
                                    dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                  },
                                },
                              ],
                            },
                            { kind: "null" },
                          ],
                        },
                      },
                    },
                    { kind: "null" },
                  ],
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "union",
                    variants: [
                      {
                        kind: "object",
                        properties: {
                          valid: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
                          reason: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                          location: {
                            kind: "union",
                            variants: [
                              {
                                kind: "union",
                                variants: [
                                  {
                                    kind: "object",
                                    properties: {
                                      kind: { kind: "string", enum: ["geometry"] },
                                      format: { kind: "string", enum: ["ewkb"] },
                                      hex: { kind: "string" },
                                      srid: { kind: "number", integer: true },
                                      dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                      geometryType: { kind: "number", integer: true },
                                    },
                                  },
                                  {
                                    kind: "object",
                                    properties: {
                                      kind: { kind: "string", enum: ["geometry"] },
                                      format: { kind: "string", enum: ["ewkt"] },
                                      text: { kind: "string" },
                                      srid: { kind: "number", integer: true },
                                      dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                    },
                                  },
                                ],
                              },
                              { kind: "null" },
                            ],
                          },
                        },
                      },
                      { kind: "null" },
                    ],
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "union",
                      variants: [
                        {
                          kind: "object",
                          properties: {
                            valid: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
                            reason: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                            location: {
                              kind: "union",
                              variants: [
                                {
                                  kind: "union",
                                  variants: [
                                    {
                                      kind: "object",
                                      properties: {
                                        kind: { kind: "string", enum: ["geometry"] },
                                        format: { kind: "string", enum: ["ewkb"] },
                                        hex: { kind: "string" },
                                        srid: { kind: "number", integer: true },
                                        dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                        geometryType: { kind: "number", integer: true },
                                      },
                                    },
                                    {
                                      kind: "object",
                                      properties: {
                                        kind: { kind: "string", enum: ["geometry"] },
                                        format: { kind: "string", enum: ["ewkt"] },
                                        text: { kind: "string" },
                                        srid: { kind: "number", integer: true },
                                        dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                      },
                                    },
                                  ],
                                },
                                { kind: "null" },
                              ],
                            },
                          },
                        },
                        { kind: "null" },
                      ],
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "union",
                        variants: [
                          {
                            kind: "object",
                            properties: {
                              valid: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
                              reason: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                              location: {
                                kind: "union",
                                variants: [
                                  {
                                    kind: "union",
                                    variants: [
                                      {
                                        kind: "object",
                                        properties: {
                                          kind: { kind: "string", enum: ["geometry"] },
                                          format: { kind: "string", enum: ["ewkb"] },
                                          hex: { kind: "string" },
                                          srid: { kind: "number", integer: true },
                                          dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                          geometryType: { kind: "number", integer: true },
                                        },
                                      },
                                      {
                                        kind: "object",
                                        properties: {
                                          kind: { kind: "string", enum: ["geometry"] },
                                          format: { kind: "string", enum: ["ewkt"] },
                                          text: { kind: "string" },
                                          srid: { kind: "number", integer: true },
                                          dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                        },
                                      },
                                    ],
                                  },
                                  { kind: "null" },
                                ],
                              },
                            },
                          },
                          { kind: "null" },
                        ],
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "union",
                          variants: [
                            {
                              kind: "object",
                              properties: {
                                valid: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
                                reason: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                location: {
                                  kind: "union",
                                  variants: [
                                    {
                                      kind: "union",
                                      variants: [
                                        {
                                          kind: "object",
                                          properties: {
                                            kind: { kind: "string", enum: ["geometry"] },
                                            format: { kind: "string", enum: ["ewkb"] },
                                            hex: { kind: "string" },
                                            srid: { kind: "number", integer: true },
                                            dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                            geometryType: { kind: "number", integer: true },
                                          },
                                        },
                                        {
                                          kind: "object",
                                          properties: {
                                            kind: { kind: "string", enum: ["geometry"] },
                                            format: { kind: "string", enum: ["ewkt"] },
                                            text: { kind: "string" },
                                            srid: { kind: "number", integer: true },
                                            dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                          },
                                        },
                                      ],
                                    },
                                    { kind: "null" },
                                  ],
                                },
                              },
                            },
                            { kind: "null" },
                          ],
                        },
                      },
                    },
                  },
                },
              },
              {
                kind: "array",
                items: {
                  kind: "array",
                  items: {
                    kind: "array",
                    items: {
                      kind: "array",
                      items: {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "union",
                            variants: [
                              {
                                kind: "object",
                                properties: {
                                  valid: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
                                  reason: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
                                  location: {
                                    kind: "union",
                                    variants: [
                                      {
                                        kind: "union",
                                        variants: [
                                          {
                                            kind: "object",
                                            properties: {
                                              kind: { kind: "string", enum: ["geometry"] },
                                              format: { kind: "string", enum: ["ewkb"] },
                                              hex: { kind: "string" },
                                              srid: { kind: "number", integer: true },
                                              dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                              geometryType: { kind: "number", integer: true },
                                            },
                                          },
                                          {
                                            kind: "object",
                                            properties: {
                                              kind: { kind: "string", enum: ["geometry"] },
                                              format: { kind: "string", enum: ["ewkt"] },
                                              text: { kind: "string" },
                                              srid: { kind: "number", integer: true },
                                              dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                                            },
                                          },
                                        ],
                                      },
                                      { kind: "null" },
                                    ],
                                  },
                                },
                              },
                              { kind: "null" },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const box2dfField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis.box2df",
      type: "box2df",
      codec: c1,
      value: {
        kind: "object",
        properties: { type: { kind: "string", enum: ["box2df"] }, text: { kind: "string" } },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const geography_columnsField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis.geography_columns",
      type: "geography_columns",
      codec: c38,
      value: {
        kind: "object",
        properties: {
          f_table_catalog: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
          f_table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
          f_table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
          f_geography_column: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
          coord_dimension: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
          srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
          type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const geometry_columnsField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis.geometry_columns",
      type: "geometry_columns",
      codec: c39,
      value: {
        kind: "object",
        properties: {
          f_table_catalog: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
          f_table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
          f_table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
          f_geometry_column: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
          coord_dimension: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
          srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
          type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const geometry_dumpField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis.geometry_dump",
      type: "geometry_dump",
      codec: c40,
      value: {
        kind: "object",
        properties: {
          path: {
            kind: "union",
            variants: [
              {
                kind: "object",
                properties: {
                  dimensions: {
                    kind: "array",
                    items: {
                      kind: "object",
                      properties: {
                        lowerBound: { kind: "number", integer: true },
                        length: { kind: "number", integer: true, minimum: 0 },
                      },
                    },
                  },
                  values: {
                    kind: "union",
                    variants: [
                      {
                        kind: "array",
                        items: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                      },
                      {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                        },
                      },
                      {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "array",
                            items: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                          },
                        },
                      },
                      {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "array",
                            items: {
                              kind: "array",
                              items: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
                            },
                          },
                        },
                      },
                      {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "array",
                            items: {
                              kind: "array",
                              items: {
                                kind: "array",
                                items: {
                                  kind: "union",
                                  variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                },
                              },
                            },
                          },
                        },
                      },
                      {
                        kind: "array",
                        items: {
                          kind: "array",
                          items: {
                            kind: "array",
                            items: {
                              kind: "array",
                              items: {
                                kind: "array",
                                items: {
                                  kind: "array",
                                  items: {
                                    kind: "union",
                                    variants: [{ kind: "number", integer: true }, { kind: "null" }],
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
              { kind: "null" },
            ],
          },
          geom: {
            kind: "union",
            variants: [
              {
                kind: "union",
                variants: [
                  {
                    kind: "object",
                    properties: {
                      kind: { kind: "string", enum: ["geometry"] },
                      format: { kind: "string", enum: ["ewkb"] },
                      hex: { kind: "string" },
                      srid: { kind: "number", integer: true },
                      dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                      geometryType: { kind: "number", integer: true },
                    },
                  },
                  {
                    kind: "object",
                    properties: {
                      kind: { kind: "string", enum: ["geometry"] },
                      format: { kind: "string", enum: ["ewkt"] },
                      text: { kind: "string" },
                      srid: { kind: "number", integer: true },
                      dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                    },
                  },
                ],
              },
              { kind: "null" },
            ],
          },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const gidxField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis.gidx",
      type: "gidx",
      codec: c5,
      value: {
        kind: "object",
        properties: { type: { kind: "string", enum: ["gidx"] }, text: { kind: "string" } },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const spatial_ref_sysField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis.spatial_ref_sys",
      type: "spatial_ref_sys",
      codec: c41,
      value: {
        kind: "object",
        properties: {
          srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
          auth_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
          auth_srid: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
          srtext: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
          proj4text: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const valid_detailField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:postgis.valid_detail",
      type: "valid_detail",
      codec: c42,
      value: {
        kind: "object",
        properties: {
          valid: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
          reason: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
          location: {
            kind: "union",
            variants: [
              {
                kind: "union",
                variants: [
                  {
                    kind: "object",
                    properties: {
                      kind: { kind: "string", enum: ["geometry"] },
                      format: { kind: "string", enum: ["ewkb"] },
                      hex: { kind: "string" },
                      srid: { kind: "number", integer: true },
                      dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                      geometryType: { kind: "number", integer: true },
                    },
                  },
                  {
                    kind: "object",
                    properties: {
                      kind: { kind: "string", enum: ["geometry"] },
                      format: { kind: "string", enum: ["ewkt"] },
                      text: { kind: "string" },
                      srid: { kind: "number", integer: true },
                      dimensions: { kind: "string", enum: ["XY", "XYZ", "XYM", "XYZM"] },
                    },
                  },
                ],
              },
              { kind: "null" },
            ],
          },
        },
      } as const,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const index0 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis.brin_geography_inclusion_ops/brin",
        method: "brin",
        opclass: "brin_geography_inclusion_ops",
        type: "geography",
        default: true,
      }),
      input: { schema, type: "geography", dimensions: 0 },
    });
  const index1 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis.brin_geometry_inclusion_ops_2d/brin",
        method: "brin",
        opclass: "brin_geometry_inclusion_ops_2d",
        type: "geometry",
        default: true,
      }),
      input: { schema, type: "geometry", dimensions: 0 },
    });
  const index2 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis.brin_geometry_inclusion_ops_3d/brin",
        method: "brin",
        opclass: "brin_geometry_inclusion_ops_3d",
        type: "geometry",
        default: false,
      }),
      input: { schema, type: "geometry", dimensions: 0 },
    });
  const index3 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis.brin_geometry_inclusion_ops_4d/brin",
        method: "brin",
        opclass: "brin_geometry_inclusion_ops_4d",
        type: "geometry",
        default: false,
      }),
      input: { schema, type: "geometry", dimensions: 0 },
    });
  const index4 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis.btree_geography_ops/btree",
        method: "btree",
        opclass: "btree_geography_ops",
        type: "geography",
        default: true,
      }),
      input: { schema, type: "geography", dimensions: 0 },
    });
  const index5 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis.btree_geometry_ops/btree",
        method: "btree",
        opclass: "btree_geometry_ops",
        type: "geometry",
        default: true,
      }),
      input: { schema, type: "geometry", dimensions: 0 },
    });
  const index6 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis.gist_geography_ops/gist",
        method: "gist",
        opclass: "gist_geography_ops",
        type: "geography",
        default: true,
      }),
      input: { schema, type: "geography", dimensions: 0 },
    });
  const index7 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis.gist_geometry_ops_2d/gist",
        method: "gist",
        opclass: "gist_geometry_ops_2d",
        type: "geometry",
        default: true,
      }),
      input: { schema, type: "geometry", dimensions: 0 },
    });
  const index8 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis.gist_geometry_ops_nd/gist",
        method: "gist",
        opclass: "gist_geometry_ops_nd",
        type: "geometry",
        default: false,
      }),
      input: { schema, type: "geometry", dimensions: 0 },
    });
  const index9 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis.hash_geometry_ops/hash",
        method: "hash",
        opclass: "hash_geometry_ops",
        type: "geometry",
        default: true,
      }),
      input: { schema, type: "geometry", dimensions: 0 },
    });
  const index10 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis.spgist_geography_ops_nd/spgist",
        method: "spgist",
        opclass: "spgist_geography_ops_nd",
        type: "geography",
        default: true,
      }),
      input: { schema, type: "geography", dimensions: 0 },
    });
  const index11 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis.spgist_geometry_ops_2d/spgist",
        method: "spgist",
        opclass: "spgist_geometry_ops_2d",
        type: "geometry",
        default: true,
      }),
      input: { schema, type: "geometry", dimensions: 0 },
    });
  const index12 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis.spgist_geometry_ops_3d/spgist",
        method: "spgist",
        opclass: "spgist_geometry_ops_3d",
        type: "geometry",
        default: false,
      }),
      input: { schema, type: "geometry", dimensions: 0 },
    });
  const index13 = () =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: "opclass:$extension:postgis.spgist_geometry_ops_nd/spgist",
        method: "spgist",
        opclass: "spgist_geometry_ops_nd",
        type: "geometry",
        default: false,
      }),
      input: { schema, type: "geometry", dimensions: 0 },
    });

  return {
    fields: {
      box2d: box2dField,
      box3d: box3dField,
      geography: geographyField,
      geometry: geometryField,
      spheroid: spheroidField,
      box2df: box2dfField,
      geography_columns: geography_columnsField,
      geometry_columns: geometry_columnsField,
      geometry_dump: geometry_dumpField,
      gidx: gidxField,
      spatial_ref_sys: spatial_ref_sysField,
      valid_detail: valid_detailField,
    },
    arrayFields: {
      box2d: box2dArrayField,
      box2df: box2dfArrayField,
      box3d: box3dArrayField,
      geography: geographyArrayField,
      geography_columns: geography_columnsArrayField,
      geometry: geometryArrayField,
      geometry_columns: geometry_columnsArrayField,
      geometry_dump: geometry_dumpArrayField,
      gidx: gidxArrayField,
      spatial_ref_sys: spatial_ref_sysArrayField,
      spheroid: spheroidArrayField,
      valid_detail: valid_detailArrayField,
    },
    triggers: {
      cacheBbox: <Table extends PgTable>(options: PostgisCacheBboxOptions<Table>) =>
        createPostgisCacheBboxTrigger(descriptor, options),
    },
    indexes: {
      brin_geography_inclusion_ops: index0,
      brin_geometry_inclusion_ops_2d: index1,
      brin_geometry_inclusion_ops_3d: index2,
      brin_geometry_inclusion_ops_4d: index3,
      btree_geography_ops: index4,
      btree_geometry_ops: index5,
      gist_geography_ops: index6,
      gist_geometry_ops_2d: index7,
      gist_geometry_ops_nd: index8,
      hash_geometry_ops: index9,
      spgist_geography_ops_nd: index10,
      spgist_geometry_ops_2d: index11,
      spgist_geometry_ops_3d: index12,
      spgist_geometry_ops_nd: index13,
    },
  } as const;
}
export type PostgisSchemaSurface = ReturnType<typeof createPostgisSchemaSurface>;
export function createPostgisRelationSurface(descriptor: Descriptor) {
  const { c14, c19, c21, c29, c38, c39, c41, nc14, nc19, nc21, nc29 } = createPostgisCodecDefinitions(
    descriptor.schema,
  );
  const spatial_ref_sysColumns = {
    srid: c19,
    auth_name: nc21,
    auth_srid: nc19,
    srtext: nc21,
    proj4text: nc21,
  } as const;
  const spatial_ref_sys = (alias: string) =>
    extensionRows(
      checkedExtensionExpression(
        sql`(select ${sql.join(
          Object.keys(spatial_ref_sysColumns).map((name) => sql.identifier(name)),
          sql`, `,
        )} from ${sql.identifier(descriptor.schema)}.${sql.identifier("spatial_ref_sys")})`,
        c41,
        [],
        undefined,
        'table:"$extension:postgis".spatial_ref_sys',
        "external",
      ),
      alias,
      spatial_ref_sysColumns,
      "named",
    );
  const geography_columnsColumns = {
    f_table_catalog: nc29,
    f_table_schema: nc29,
    f_table_name: nc29,
    f_geography_column: nc29,
    coord_dimension: nc19,
    srid: nc19,
    type: nc14,
  } as const;
  const geography_columns = (alias: string) =>
    extensionRows(
      checkedExtensionExpression(
        sql`(select ${sql.join(
          Object.keys(geography_columnsColumns).map((name) => sql.identifier(name)),
          sql`, `,
        )} from ${sql.identifier(descriptor.schema)}.${sql.identifier("geography_columns")})`,
        c38,
        [],
        undefined,
        'view:"$extension:postgis".geography_columns',
        "external",
      ),
      alias,
      geography_columnsColumns,
      "named",
    );
  const geometry_columnsColumns = {
    f_table_catalog: nc21,
    f_table_schema: nc29,
    f_table_name: nc29,
    f_geometry_column: nc29,
    coord_dimension: nc19,
    srid: nc19,
    type: nc21,
  } as const;
  const geometry_columns = (alias: string) =>
    extensionRows(
      checkedExtensionExpression(
        sql`(select ${sql.join(
          Object.keys(geometry_columnsColumns).map((name) => sql.identifier(name)),
          sql`, `,
        )} from ${sql.identifier(descriptor.schema)}.${sql.identifier("geometry_columns")})`,
        c39,
        [],
        undefined,
        'view:"$extension:postgis".geometry_columns',
        "external",
      ),
      alias,
      geometry_columnsColumns,
      "named",
    );
  return {
    views: { geography_columns: geography_columns, geometry_columns: geometry_columns },
    tables: { spatial_ref_sys: spatial_ref_sys },
  } as const;
}
export type PostgisRelationSurface = ReturnType<typeof createPostgisRelationSurface>;
export interface PostgisRows {
  "routine:$extension:postgis.postgis_srs_all()": (
    alias: string,
    ...values: Parameters<PostgisOverloads["routine:$extension:postgis.postgis_srs_all()"]>
  ) => ReturnType<
    typeof extensionRows<{
      auth_name: PostgisCodecDefinitions["nc14"];
      auth_srid: PostgisCodecDefinitions["nc14"];
      srname: PostgisCodecDefinitions["nc14"];
      srtext: PostgisCodecDefinitions["nc14"];
      proj4text: PostgisCodecDefinitions["nc14"];
      point_sw: PostgisCodecDefinitions["nc4"];
      point_ne: PostgisCodecDefinitions["nc4"];
    }>
  >;
  "routine:$extension:postgis.postgis_srs_search($extension:postgis.geometry,pg_catalog.text)": (
    alias: string,
    ...values: Parameters<
      PostgisOverloads["routine:$extension:postgis.postgis_srs_search($extension:postgis.geometry,pg_catalog.text)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      auth_name: PostgisCodecDefinitions["nc14"];
      auth_srid: PostgisCodecDefinitions["nc14"];
      srname: PostgisCodecDefinitions["nc14"];
      srtext: PostgisCodecDefinitions["nc14"];
      proj4text: PostgisCodecDefinitions["nc14"];
      point_sw: PostgisCodecDefinitions["nc4"];
      point_ne: PostgisCodecDefinitions["nc4"];
    }>
  >;
  "routine:$extension:postgis.postgis_srs(pg_catalog.text,pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PostgisOverloads["routine:$extension:postgis.postgis_srs(pg_catalog.text,pg_catalog.text)"]>
  ) => ReturnType<
    typeof extensionRows<{
      auth_name: PostgisCodecDefinitions["nc14"];
      auth_srid: PostgisCodecDefinitions["nc14"];
      srname: PostgisCodecDefinitions["nc14"];
      srtext: PostgisCodecDefinitions["nc14"];
      proj4text: PostgisCodecDefinitions["nc14"];
      point_sw: PostgisCodecDefinitions["nc4"];
      point_ne: PostgisCodecDefinitions["nc4"];
    }>
  >;
  "routine:$extension:postgis.st_hexagongrid(pg_catalog.float8,$extension:postgis.geometry)": (
    alias: string,
    ...values: Parameters<
      PostgisOverloads["routine:$extension:postgis.st_hexagongrid(pg_catalog.float8,$extension:postgis.geometry)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      geom: PostgisCodecDefinitions["nc4"];
      i: PostgisCodecDefinitions["nc19"];
      j: PostgisCodecDefinitions["nc19"];
    }>
  >;
  "routine:$extension:postgis.st_squaregrid(pg_catalog.float8,$extension:postgis.geometry)": (
    alias: string,
    ...values: Parameters<
      PostgisOverloads["routine:$extension:postgis.st_squaregrid(pg_catalog.float8,$extension:postgis.geometry)"]
    >
  ) => ReturnType<
    typeof extensionRows<{
      geom: PostgisCodecDefinitions["nc4"];
      i: PostgisCodecDefinitions["nc19"];
      j: PostgisCodecDefinitions["nc19"];
    }>
  >;
}
export interface PostgisPublicCodecs {
  box2d: PostgisCodecDefinitions["c0"];
  box2df: PostgisCodecDefinitions["c1"];
  box3d: PostgisCodecDefinitions["c2"];
  geography: PostgisCodecDefinitions["c3"];
  geometry: PostgisCodecDefinitions["c4"];
  gidx: PostgisCodecDefinitions["c5"];
  spheroid: PostgisCodecDefinitions["c6"];
  _box2d: PostgisCodecDefinitions["c31"];
  _box2df: PostgisCodecDefinitions["c32"];
  _box3d: PostgisCodecDefinitions["c33"];
  _geography: PostgisCodecDefinitions["c34"];
  _geometry: PostgisCodecDefinitions["c35"];
  _gidx: PostgisCodecDefinitions["c36"];
  _spheroid: PostgisCodecDefinitions["c37"];
  geography_columns: PostgisCodecDefinitions["c38"];
  geometry_columns: PostgisCodecDefinitions["c39"];
  geometry_dump: PostgisCodecDefinitions["c40"];
  spatial_ref_sys: PostgisCodecDefinitions["c41"];
  valid_detail: PostgisCodecDefinitions["c42"];
  _geography_columns: PostgisCodecDefinitions["c43"];
  _geometry_columns: PostgisCodecDefinitions["c44"];
  _geometry_dump: PostgisCodecDefinitions["c45"];
  _spatial_ref_sys: PostgisCodecDefinitions["c46"];
  _valid_detail: PostgisCodecDefinitions["c47"];
}
export interface PostgisAdapter extends PostgisSchemaSurface, PostgisRelationSurface {
  readonly geometry: {
    readonly codec: ReturnType<typeof createPostgisGeometryCodec>;
    readonly field: PostgisSchemaSurface["fields"]["geometry"];
    readonly ewkb: typeof geometryEwkb;
    readonly ewkt: typeof geometryEwkt;
    readonly distance: PostgisOverloads["routine:$extension:postgis.st_distance($extension:postgis.geometry,$extension:postgis.geometry)"];
    readonly distanceUnits: "coordinate-system";
  };
  readonly geography: {
    readonly codec: ReturnType<typeof createPostgisGeographyCodec>;
    readonly field: PostgisSchemaSurface["fields"]["geography"];
    readonly ewkb: typeof geographyEwkb;
    readonly ewkt: typeof geographyEwkt;
    readonly distance: PostgisOverloads["routine:$extension:postgis.st_distance($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)"];
    readonly distanceUnits: "meters";
  };
  readonly codecs: PostgisPublicCodecs;
  readonly sql: {
    readonly functions: PostgisFunctions;
    readonly overloads: PostgisOverloads;
    readonly rows: PostgisRows;
  };
}
/** Exact captured overloads. PostgreSQL owns all geometry algorithms and conversions. */
function postgisParameter<Input, Output>(
  value: ExtensionSqlInput<ExtensionCodec<Input, Output>>,
  codec: ExtensionCodec<Input, Output>,
) {
  if (v.is(v.object({ getSQL: v.function() }), value)) return sql`${value}`;
  // SAFETY: SQL wrappers are handled above; the paired codec validates its exact Input before binding this value.
  const encoded = codec.encode(value as Input);
  return codec.sqlType
    ? sql`${sql.param(encoded)}::${extensionSqlType(codec.sqlType.schema, codec.sqlType.name)}${codec.sqlType.array ? sql`[]` : sql.empty()}`
    : sql`${sql.param(encoded)}`;
}
export function createPostgis_3_6_4<const Selected extends Descriptor>(
  descriptor: Selected,
): Readonly<Selected & PostgisAdapter> {
  if (
    descriptor.name !== "postgis" ||
    descriptor.version !== "3.6.4" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("PostGIS requires the exact 3.6.4 contract");
  const schema = descriptor.schema;
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
    c42,
    nc42,
    c43,
    nc43,
    c44,
    nc44,
    c45,
    nc45,
    c46,
    nc46,
    c47,
    nc47,
  } = createPostgisCodecDefinitions(schema);

  const member0 = (value: ExtensionSqlInput<typeof nc0>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc0)})::${extensionSqlType(schema, "box3d")}`,
      nc2,
      [],
      undefined,
      "cast:$extension:postgis.box2d->$extension:postgis.box3d",
    );
  const member1 = (value: ExtensionSqlInput<typeof nc0>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc0)})::${extensionSqlType(schema, "geometry")}`,
      nc4,
      [],
      undefined,
      "cast:$extension:postgis.box2d->$extension:postgis.geometry",
    );
  const member2 = (value: ExtensionSqlInput<typeof nc2>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc2)})::${extensionSqlType(schema, "box2d")}`,
      nc0,
      [],
      undefined,
      "cast:$extension:postgis.box3d->$extension:postgis.box2d",
    );
  const member3 = (value: ExtensionSqlInput<typeof nc2>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc2)})::${extensionSqlType(schema, "geometry")}`,
      nc4,
      [],
      undefined,
      "cast:$extension:postgis.box3d->$extension:postgis.geometry",
    );
  const member4 = (value: ExtensionSqlInput<typeof nc2>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc2)})::${extensionSqlType("pg_catalog", "box")}`,
      nc7,
      [],
      undefined,
      "cast:$extension:postgis.box3d->pg_catalog.box",
    );
  const member5 = (value: ExtensionSqlInput<typeof nc3>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc3)})::${extensionSqlType(schema, "geography")}`,
      nc3,
      [],
      undefined,
      "cast:$extension:postgis.geography->$extension:postgis.geography",
    );
  const member6 = (value: ExtensionSqlInput<typeof nc3>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc3)})::${extensionSqlType(schema, "geometry")}`,
      nc4,
      [],
      undefined,
      "cast:$extension:postgis.geography->$extension:postgis.geometry",
    );
  const member7 = (value: ExtensionSqlInput<typeof nc3>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc3)})::${extensionSqlType("pg_catalog", "bytea")}`,
      nc8,
      [],
      undefined,
      "cast:$extension:postgis.geography->pg_catalog.bytea",
    );
  const member8 = (value: ExtensionSqlInput<typeof nc4>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc4)})::${extensionSqlType(schema, "box2d")}`,
      nc0,
      [],
      undefined,
      "cast:$extension:postgis.geometry->$extension:postgis.box2d",
    );
  const member9 = (value: ExtensionSqlInput<typeof nc4>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc4)})::${extensionSqlType(schema, "box3d")}`,
      nc2,
      [],
      undefined,
      "cast:$extension:postgis.geometry->$extension:postgis.box3d",
    );
  const member10 = (value: ExtensionSqlInput<typeof nc4>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc4)})::${extensionSqlType(schema, "geography")}`,
      nc3,
      [],
      undefined,
      "cast:$extension:postgis.geometry->$extension:postgis.geography",
    );
  const member11 = (value: ExtensionSqlInput<typeof nc4>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc4)})::${extensionSqlType(schema, "geometry")}`,
      nc4,
      [],
      undefined,
      "cast:$extension:postgis.geometry->$extension:postgis.geometry",
    );
  const member12 = (value: ExtensionSqlInput<typeof nc4>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc4)})::${extensionSqlType("pg_catalog", "box")}`,
      nc7,
      [],
      undefined,
      "cast:$extension:postgis.geometry->pg_catalog.box",
    );
  const member13 = (value: ExtensionSqlInput<typeof nc4>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc4)})::${extensionSqlType("pg_catalog", "bytea")}`,
      nc8,
      [],
      undefined,
      "cast:$extension:postgis.geometry->pg_catalog.bytea",
    );
  const member14 = (value: ExtensionSqlInput<typeof nc4>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc4)})::${extensionSqlType("pg_catalog", "json")}`,
      nc9,
      [],
      undefined,
      "cast:$extension:postgis.geometry->pg_catalog.json",
    );
  const member15 = (value: ExtensionSqlInput<typeof nc4>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc4)})::${extensionSqlType("pg_catalog", "jsonb")}`,
      nc10,
      [],
      undefined,
      "cast:$extension:postgis.geometry->pg_catalog.jsonb",
    );
  const member16 = (value: ExtensionSqlInput<typeof nc4>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc4)})::${extensionSqlType("pg_catalog", "path")}`,
      nc11,
      [],
      undefined,
      "cast:$extension:postgis.geometry->pg_catalog.path",
    );
  const member17 = (value: ExtensionSqlInput<typeof nc4>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc4)})::${extensionSqlType("pg_catalog", "point")}`,
      nc12,
      [],
      undefined,
      "cast:$extension:postgis.geometry->pg_catalog.point",
    );
  const member18 = (value: ExtensionSqlInput<typeof nc4>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc4)})::${extensionSqlType("pg_catalog", "polygon")}`,
      nc13,
      [],
      undefined,
      "cast:$extension:postgis.geometry->pg_catalog.polygon",
    );
  const member19 = (value: ExtensionSqlInput<typeof nc4>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc4)})::${extensionSqlType("pg_catalog", "text")}`,
      nc14,
      [],
      undefined,
      "cast:$extension:postgis.geometry->pg_catalog.text",
    );
  const member20 = (value: ExtensionSqlInput<typeof nc8>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc8)})::${extensionSqlType(schema, "geography")}`,
      nc3,
      [],
      undefined,
      "cast:pg_catalog.bytea->$extension:postgis.geography",
    );
  const member21 = (value: ExtensionSqlInput<typeof nc8>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc8)})::${extensionSqlType(schema, "geometry")}`,
      nc4,
      [],
      undefined,
      "cast:pg_catalog.bytea->$extension:postgis.geometry",
    );
  const member22 = (value: ExtensionSqlInput<typeof nc11>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc11)})::${extensionSqlType(schema, "geometry")}`,
      nc4,
      [],
      undefined,
      "cast:pg_catalog.path->$extension:postgis.geometry",
    );
  const member23 = (value: ExtensionSqlInput<typeof nc12>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc12)})::${extensionSqlType(schema, "geometry")}`,
      nc4,
      [],
      undefined,
      "cast:pg_catalog.point->$extension:postgis.geometry",
    );
  const member24 = (value: ExtensionSqlInput<typeof nc13>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc13)})::${extensionSqlType(schema, "geometry")}`,
      nc4,
      [],
      undefined,
      "cast:pg_catalog.polygon->$extension:postgis.geometry",
    );
  const member25 = (value: ExtensionSqlInput<typeof nc14>) =>
    checkedExtensionExpression(
      sql`(${postgisParameter(value, nc14)})::${extensionSqlType(schema, "geometry")}`,
      nc4,
      [],
      undefined,
      "cast:pg_catalog.text->$extension:postgis.geometry",
    );
  const member195 = createSqlOperator({
    ...base,
    name: "@",
    member: "operator:$extension:postgis.@($extension:postgis.box2df,$extension:postgis.box2df)",
    left: nc1,
    right: nc1,
    result: nc15,
  });
  const member196 = createSqlOperator({
    ...base,
    name: "@",
    member: "operator:$extension:postgis.@($extension:postgis.box2df,$extension:postgis.geometry)",
    left: nc1,
    right: nc4,
    result: nc15,
  });
  const member197 = createSqlOperator({
    ...base,
    name: "@",
    member: "operator:$extension:postgis.@($extension:postgis.geometry,$extension:postgis.box2df)",
    left: nc4,
    right: nc1,
    result: nc15,
  });
  const member198 = createSqlOperator({
    ...base,
    name: "@",
    member: "operator:$extension:postgis.@($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member199 = createSqlOperator({
    ...base,
    name: "@@",
    member: "operator:$extension:postgis.@@($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member200 = createSqlOperator({
    ...base,
    name: "@>>",
    member: "operator:$extension:postgis.@>>($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member201 = createSqlOperator({
    ...base,
    name: "&/&",
    member: "operator:$extension:postgis.&/&($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member202 = createSqlOperator({
    ...base,
    name: "&&",
    member: "operator:$extension:postgis.&&($extension:postgis.box2df,$extension:postgis.box2df)",
    left: nc1,
    right: nc1,
    result: nc15,
  });
  const member203 = createSqlOperator({
    ...base,
    name: "&&",
    member: "operator:$extension:postgis.&&($extension:postgis.box2df,$extension:postgis.geometry)",
    left: nc1,
    right: nc4,
    result: nc15,
  });
  const member204 = createSqlOperator({
    ...base,
    name: "&&",
    member: "operator:$extension:postgis.&&($extension:postgis.geography,$extension:postgis.geography)",
    left: nc3,
    right: nc3,
    result: nc15,
  });
  const member205 = createSqlOperator({
    ...base,
    name: "&&",
    member: "operator:$extension:postgis.&&($extension:postgis.geography,$extension:postgis.gidx)",
    left: nc3,
    right: nc5,
    result: nc15,
  });
  const member206 = createSqlOperator({
    ...base,
    name: "&&",
    member: "operator:$extension:postgis.&&($extension:postgis.geometry,$extension:postgis.box2df)",
    left: nc4,
    right: nc1,
    result: nc15,
  });
  const member207 = createSqlOperator({
    ...base,
    name: "&&",
    member: "operator:$extension:postgis.&&($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member208 = createSqlOperator({
    ...base,
    name: "&&",
    member: "operator:$extension:postgis.&&($extension:postgis.gidx,$extension:postgis.geography)",
    left: nc5,
    right: nc3,
    result: nc15,
  });
  const member209 = createSqlOperator({
    ...base,
    name: "&&",
    member: "operator:$extension:postgis.&&($extension:postgis.gidx,$extension:postgis.gidx)",
    left: nc5,
    right: nc5,
    result: nc15,
  });
  const member210 = createSqlOperator({
    ...base,
    name: "&&&",
    member: "operator:$extension:postgis.&&&($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member211 = createSqlOperator({
    ...base,
    name: "&&&",
    member: "operator:$extension:postgis.&&&($extension:postgis.geometry,$extension:postgis.gidx)",
    left: nc4,
    right: nc5,
    result: nc15,
  });
  const member212 = createSqlOperator({
    ...base,
    name: "&&&",
    member: "operator:$extension:postgis.&&&($extension:postgis.gidx,$extension:postgis.geometry)",
    left: nc5,
    right: nc4,
    result: nc15,
  });
  const member213 = createSqlOperator({
    ...base,
    name: "&&&",
    member: "operator:$extension:postgis.&&&($extension:postgis.gidx,$extension:postgis.gidx)",
    left: nc5,
    right: nc5,
    result: nc15,
  });
  const member214 = createSqlOperator({
    ...base,
    name: "&<",
    member: "operator:$extension:postgis.&<($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member215 = createSqlOperator({
    ...base,
    name: "&<|",
    member: "operator:$extension:postgis.&<|($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member216 = createSqlOperator({
    ...base,
    name: "&>",
    member: "operator:$extension:postgis.&>($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member217 = createSqlOperator({
    ...base,
    name: "<->",
    member: "operator:$extension:postgis.<->($extension:postgis.geography,$extension:postgis.geography)",
    left: nc3,
    right: nc3,
    result: nc16,
  });
  const member218 = createSqlOperator({
    ...base,
    name: "<->",
    member: "operator:$extension:postgis.<->($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc16,
  });
  const member219 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:postgis.<($extension:postgis.geography,$extension:postgis.geography)",
    left: nc3,
    right: nc3,
    result: nc15,
  });
  const member220 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:postgis.<($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member221 = createSqlOperator({
    ...base,
    name: "<#>",
    member: "operator:$extension:postgis.<#>($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc16,
  });
  const member222 = createSqlOperator({
    ...base,
    name: "<<->>",
    member: "operator:$extension:postgis.<<->>($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc16,
  });
  const member223 = createSqlOperator({
    ...base,
    name: "<<",
    member: "operator:$extension:postgis.<<($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member224 = createSqlOperator({
    ...base,
    name: "<<@",
    member: "operator:$extension:postgis.<<@($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member225 = createSqlOperator({
    ...base,
    name: "<<|",
    member: "operator:$extension:postgis.<<|($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member226 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:postgis.<=($extension:postgis.geography,$extension:postgis.geography)",
    left: nc3,
    right: nc3,
    result: nc15,
  });
  const member227 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:postgis.<=($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member228 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:postgis.<>($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member229 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:postgis.=($extension:postgis.geography,$extension:postgis.geography)",
    left: nc3,
    right: nc3,
    result: nc15,
  });
  const member230 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:postgis.=($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member231 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:postgis.>($extension:postgis.geography,$extension:postgis.geography)",
    left: nc3,
    right: nc3,
    result: nc15,
  });
  const member232 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:postgis.>($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member233 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:postgis.>=($extension:postgis.geography,$extension:postgis.geography)",
    left: nc3,
    right: nc3,
    result: nc15,
  });
  const member234 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:postgis.>=($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member235 = createSqlOperator({
    ...base,
    name: ">>",
    member: "operator:$extension:postgis.>>($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member236 = createSqlOperator({
    ...base,
    name: "|&>",
    member: "operator:$extension:postgis.|&>($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member237 = createSqlOperator({
    ...base,
    name: "|=|",
    member: "operator:$extension:postgis.|=|($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc16,
  });
  const member238 = createSqlOperator({
    ...base,
    name: "|>>",
    member: "operator:$extension:postgis.|>>($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member239 = createSqlOperator({
    ...base,
    name: "~",
    member: "operator:$extension:postgis.~($extension:postgis.box2df,$extension:postgis.box2df)",
    left: nc1,
    right: nc1,
    result: nc15,
  });
  const member240 = createSqlOperator({
    ...base,
    name: "~",
    member: "operator:$extension:postgis.~($extension:postgis.box2df,$extension:postgis.geometry)",
    left: nc1,
    right: nc4,
    result: nc15,
  });
  const member241 = createSqlOperator({
    ...base,
    name: "~",
    member: "operator:$extension:postgis.~($extension:postgis.geometry,$extension:postgis.box2df)",
    left: nc4,
    right: nc1,
    result: nc15,
  });
  const member242 = createSqlOperator({
    ...base,
    name: "~",
    member: "operator:$extension:postgis.~($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member243 = createSqlOperator({
    ...base,
    name: "~=",
    member: "operator:$extension:postgis.~=($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member244 = createSqlOperator({
    ...base,
    name: "~==",
    member: "operator:$extension:postgis.~==($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member245 = createSqlOperator({
    ...base,
    name: "~~",
    member: "operator:$extension:postgis.~~($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member246 = createSqlOperator({
    ...base,
    name: "~~=",
    member: "operator:$extension:postgis.~~=($extension:postgis.geometry,$extension:postgis.geometry)",
    left: nc4,
    right: nc4,
    result: nc15,
  });
  const member261 = createSqlFunction({
    ...base,
    name: "_postgis_deprecate",
    member: "routine:$extension:postgis._postgis_deprecate(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14, nc14] as const,
    result: nc17,
  });
  const member262 = createSqlFunction({
    ...base,
    name: "_postgis_index_extent",
    member: "routine:$extension:postgis._postgis_index_extent(pg_catalog.regclass,pg_catalog.text)",
    arguments: [nc18, nc14] as const,
    result: nc0,
  });
  const member263 = createSqlFunction({
    ...base,
    name: "_postgis_join_selectivity",
    member:
      "routine:$extension:postgis._postgis_join_selectivity(pg_catalog.regclass,pg_catalog.text,pg_catalog.regclass,pg_catalog.text,pg_catalog.text)",
    arguments: [nc18, nc14, nc18, nc14, defaultSqlArgument(nc14, undefined)] as const,
    result: nc16,
  });
  const member264 = createSqlFunction({
    ...base,
    name: "_postgis_pgsql_version",
    member: "routine:$extension:postgis._postgis_pgsql_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member265 = createSqlFunction({
    ...base,
    name: "_postgis_scripts_pgsql_version",
    member: "routine:$extension:postgis._postgis_scripts_pgsql_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member266 = createSqlFunction({
    ...base,
    name: "_postgis_selectivity",
    member:
      "routine:$extension:postgis._postgis_selectivity(pg_catalog.regclass,pg_catalog.text,$extension:postgis.geometry,pg_catalog.text)",
    arguments: [nc18, nc14, nc4, defaultSqlArgument(nc14, "mode")] as const,
    result: nc16,
  });
  const member267 = createSqlFunction({
    ...base,
    name: "_postgis_stats",
    member: "routine:$extension:postgis._postgis_stats(pg_catalog.regclass,pg_catalog.text,pg_catalog.text)",
    arguments: [nc18, nc14, defaultSqlArgument(nc14, undefined)] as const,
    result: nc14,
  });
  const member268 = createSqlFunction({
    ...base,
    name: "_st_3ddfullywithin",
    member:
      "routine:$extension:postgis._st_3ddfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16] as const,
    result: nc15,
  });
  const member269 = createSqlFunction({
    ...base,
    name: "_st_3ddwithin",
    member:
      "routine:$extension:postgis._st_3ddwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16] as const,
    result: nc15,
  });
  const member270 = createSqlFunction({
    ...base,
    name: "_st_3dintersects",
    member: "routine:$extension:postgis._st_3dintersects($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member271 = createSqlFunction({
    ...base,
    name: "_st_asgml",
    member:
      "routine:$extension:postgis._st_asgml(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)",
    arguments: [nc19, nc4, nc19, nc19, nc14, nc14] as const,
    result: nc14,
  });
  const member272 = createSqlFunction({
    ...base,
    name: "_st_asx3d",
    member:
      "routine:$extension:postgis._st_asx3d(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)",
    arguments: [nc19, nc4, nc19, nc19, nc14] as const,
    result: nc14,
  });
  const member273 = createSqlFunction({
    ...base,
    name: "_st_bestsrid",
    member: "routine:$extension:postgis._st_bestsrid($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc19,
  });
  const member274 = createSqlFunction({
    ...base,
    name: "_st_bestsrid",
    member: "routine:$extension:postgis._st_bestsrid($extension:postgis.geography)",
    arguments: [nc3] as const,
    result: nc19,
  });
  const member275 = createSqlFunction({
    ...base,
    name: "_st_contains",
    member: "routine:$extension:postgis._st_contains($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member276 = createSqlFunction({
    ...base,
    name: "_st_containsproperly",
    member: "routine:$extension:postgis._st_containsproperly($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member277 = createSqlFunction({
    ...base,
    name: "_st_coveredby",
    member: "routine:$extension:postgis._st_coveredby($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc15,
  });
  const member278 = createSqlFunction({
    ...base,
    name: "_st_coveredby",
    member: "routine:$extension:postgis._st_coveredby($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member279 = createSqlFunction({
    ...base,
    name: "_st_covers",
    member: "routine:$extension:postgis._st_covers($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc15,
  });
  const member280 = createSqlFunction({
    ...base,
    name: "_st_covers",
    member: "routine:$extension:postgis._st_covers($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member281 = createSqlFunction({
    ...base,
    name: "_st_crosses",
    member: "routine:$extension:postgis._st_crosses($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member282 = createSqlFunction({
    ...base,
    name: "_st_dfullywithin",
    member:
      "routine:$extension:postgis._st_dfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16] as const,
    result: nc15,
  });
  const member283 = createSqlFunction({
    ...base,
    name: "_st_distancetree",
    member:
      "routine:$extension:postgis._st_distancetree($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc3, nc3, nc16, nc15] as const,
    result: nc16,
  });
  const member284 = createSqlFunction({
    ...base,
    name: "_st_distancetree",
    member: "routine:$extension:postgis._st_distancetree($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc16,
  });
  const member285 = createSqlFunction({
    ...base,
    name: "_st_distanceuncached",
    member:
      "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)",
    arguments: [nc3, nc3, nc15] as const,
    result: nc16,
  });
  const member286 = createSqlFunction({
    ...base,
    name: "_st_distanceuncached",
    member:
      "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc3, nc3, nc16, nc15] as const,
    result: nc16,
  });
  const member287 = createSqlFunction({
    ...base,
    name: "_st_distanceuncached",
    member:
      "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc16,
  });
  const member288 = createSqlFunction({
    ...base,
    name: "_st_dwithin",
    member:
      "routine:$extension:postgis._st_dwithin($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc3, nc3, nc16, defaultSqlArgument(nc15, "use_spheroid")] as const,
    result: nc15,
  });
  const member289 = createSqlFunction({
    ...base,
    name: "_st_dwithin",
    member:
      "routine:$extension:postgis._st_dwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16] as const,
    result: nc15,
  });
  const member290 = createSqlFunction({
    ...base,
    name: "_st_dwithinuncached",
    member:
      "routine:$extension:postgis._st_dwithinuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc3, nc3, nc16, nc15] as const,
    result: nc15,
  });
  const member291 = createSqlFunction({
    ...base,
    name: "_st_dwithinuncached",
    member:
      "routine:$extension:postgis._st_dwithinuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)",
    arguments: [nc3, nc3, nc16] as const,
    result: nc15,
  });
  const member292 = createSqlFunction({
    ...base,
    name: "_st_equals",
    member: "routine:$extension:postgis._st_equals($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member293 = createSqlFunction({
    ...base,
    name: "_st_expand",
    member: "routine:$extension:postgis._st_expand($extension:postgis.geography,pg_catalog.float8)",
    arguments: [nc3, nc16] as const,
    result: nc3,
  });
  const member294 = createSqlFunction({
    ...base,
    name: "_st_geomfromgml",
    member: "routine:$extension:postgis._st_geomfromgml(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member295 = createSqlFunction({
    ...base,
    name: "_st_intersects",
    member: "routine:$extension:postgis._st_intersects($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member296 = createSqlFunction({
    ...base,
    name: "_st_linecrossingdirection",
    member:
      "routine:$extension:postgis._st_linecrossingdirection($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc19,
  });
  const member297 = createSqlFunction({
    ...base,
    name: "_st_longestline",
    member: "routine:$extension:postgis._st_longestline($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member298 = createSqlFunction({
    ...base,
    name: "_st_maxdistance",
    member: "routine:$extension:postgis._st_maxdistance($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member299 = createSqlFunction({
    ...base,
    name: "_st_orderingequals",
    member: "routine:$extension:postgis._st_orderingequals($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member300 = createSqlFunction({
    ...base,
    name: "_st_overlaps",
    member: "routine:$extension:postgis._st_overlaps($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member301 = createSqlFunction({
    ...base,
    name: "_st_pointoutside",
    member: "routine:$extension:postgis._st_pointoutside($extension:postgis.geography)",
    arguments: [nc3] as const,
    result: nc3,
  });
  const member302 = createSqlFunction({
    ...base,
    name: "_st_sortablehash",
    member: "routine:$extension:postgis._st_sortablehash($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc20,
  });
  const member303 = createSqlFunction({
    ...base,
    name: "_st_touches",
    member: "routine:$extension:postgis._st_touches($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member304 = createSqlFunction({
    ...base,
    name: "_st_voronoi",
    member:
      "routine:$extension:postgis._st_voronoi($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)",
    arguments: [
      nc4,
      defaultSqlArgument(nc4, "clip"),
      defaultSqlArgument(nc16, "tolerance"),
      defaultSqlArgument(nc15, "return_polygons"),
    ] as const,
    result: nc4,
  });
  const member305 = createSqlFunction({
    ...base,
    name: "_st_within",
    member: "routine:$extension:postgis._st_within($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member309 = createSqlFunction({
    ...base,
    name: "box",
    member: "routine:$extension:postgis.box($extension:postgis.box3d)",
    arguments: [nc2] as const,
    result: nc7,
  });
  const member310 = createSqlFunction({
    ...base,
    name: "box",
    member: "routine:$extension:postgis.box($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc7,
  });
  const member313 = createSqlFunction({
    ...base,
    name: "box2d",
    member: "routine:$extension:postgis.box2d($extension:postgis.box3d)",
    arguments: [nc2] as const,
    result: nc0,
  });
  const member314 = createSqlFunction({
    ...base,
    name: "box2d",
    member: "routine:$extension:postgis.box2d($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc0,
  });
  const member319 = createSqlFunction({
    ...base,
    name: "box3d",
    member: "routine:$extension:postgis.box3d($extension:postgis.box2d)",
    arguments: [nc0] as const,
    result: nc2,
  });
  const member320 = createSqlFunction({
    ...base,
    name: "box3d",
    member: "routine:$extension:postgis.box3d($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc2,
  });
  const member321 = createSqlFunction({
    ...base,
    name: "box3dtobox",
    member: "routine:$extension:postgis.box3dtobox($extension:postgis.box3d)",
    arguments: [nc2] as const,
    result: nc7,
  });
  const member322 = createSqlFunction({
    ...base,
    name: "bytea",
    member: "routine:$extension:postgis.bytea($extension:postgis.geography)",
    arguments: [nc3] as const,
    result: nc8,
  });
  const member323 = createSqlFunction({
    ...base,
    name: "bytea",
    member: "routine:$extension:postgis.bytea($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc8,
  });
  const member324 = createSqlFunction({
    ...base,
    name: "contains_2d",
    member: "routine:$extension:postgis.contains_2d($extension:postgis.box2df,$extension:postgis.box2df)",
    arguments: [nc1, nc1] as const,
    result: nc15,
  });
  const member325 = createSqlFunction({
    ...base,
    name: "contains_2d",
    member: "routine:$extension:postgis.contains_2d($extension:postgis.box2df,$extension:postgis.geometry)",
    arguments: [nc1, nc4] as const,
    result: nc15,
  });
  const member326 = createSqlFunction({
    ...base,
    name: "contains_2d",
    member: "routine:$extension:postgis.contains_2d($extension:postgis.geometry,$extension:postgis.box2df)",
    arguments: [nc4, nc1] as const,
    result: nc15,
  });
  const member333 = createSqlFunction({
    ...base,
    name: "equals",
    member: "routine:$extension:postgis.equals($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member334 = createSqlFunction({
    ...base,
    name: "find_srid",
    member: "routine:$extension:postgis.find_srid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)",
    arguments: [nc21, nc21, nc21] as const,
    result: nc19,
  });
  const member338 = createSqlFunction({
    ...base,
    name: "geography_cmp",
    member: "routine:$extension:postgis.geography_cmp($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc19,
  });
  const member339 = createSqlFunction({
    ...base,
    name: "geography_distance_knn",
    member:
      "routine:$extension:postgis.geography_distance_knn($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc16,
  });
  const member340 = createSqlFunction({
    ...base,
    name: "geography_eq",
    member: "routine:$extension:postgis.geography_eq($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc15,
  });
  const member341 = createSqlFunction({
    ...base,
    name: "geography_ge",
    member: "routine:$extension:postgis.geography_ge($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc15,
  });
  const member350 = createSqlFunction({
    ...base,
    name: "geography_gt",
    member: "routine:$extension:postgis.geography_gt($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc15,
  });
  const member352 = createSqlFunction({
    ...base,
    name: "geography_le",
    member: "routine:$extension:postgis.geography_le($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc15,
  });
  const member353 = createSqlFunction({
    ...base,
    name: "geography_lt",
    member: "routine:$extension:postgis.geography_lt($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc15,
  });
  const member355 = createSqlFunction({
    ...base,
    name: "geography_overlaps",
    member: "routine:$extension:postgis.geography_overlaps($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc15,
  });
  const member357 = createSqlFunction({
    ...base,
    name: "geography_send",
    member: "routine:$extension:postgis.geography_send($extension:postgis.geography)",
    arguments: [nc3] as const,
    result: nc8,
  });
  const member366 = createSqlFunction({
    ...base,
    name: "geography",
    member: "routine:$extension:postgis.geography($extension:postgis.geography,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc3, nc19, nc15] as const,
    result: nc3,
  });
  const member367 = createSqlFunction({
    ...base,
    name: "geography",
    member: "routine:$extension:postgis.geography($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc3,
  });
  const member368 = createSqlFunction({
    ...base,
    name: "geography",
    member: "routine:$extension:postgis.geography(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc3,
  });
  const member375 = createSqlFunction({
    ...base,
    name: "geometry_above",
    member: "routine:$extension:postgis.geometry_above($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member377 = createSqlFunction({
    ...base,
    name: "geometry_below",
    member: "routine:$extension:postgis.geometry_below($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member378 = createSqlFunction({
    ...base,
    name: "geometry_cmp",
    member: "routine:$extension:postgis.geometry_cmp($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc19,
  });
  const member379 = createSqlFunction({
    ...base,
    name: "geometry_contained_3d",
    member: "routine:$extension:postgis.geometry_contained_3d($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member380 = createSqlFunction({
    ...base,
    name: "geometry_contains_3d",
    member: "routine:$extension:postgis.geometry_contains_3d($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member381 = createSqlFunction({
    ...base,
    name: "geometry_contains_nd",
    member: "routine:$extension:postgis.geometry_contains_nd($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member382 = createSqlFunction({
    ...base,
    name: "geometry_contains",
    member: "routine:$extension:postgis.geometry_contains($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member383 = createSqlFunction({
    ...base,
    name: "geometry_distance_box",
    member: "routine:$extension:postgis.geometry_distance_box($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member384 = createSqlFunction({
    ...base,
    name: "geometry_distance_centroid_nd",
    member:
      "routine:$extension:postgis.geometry_distance_centroid_nd($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member385 = createSqlFunction({
    ...base,
    name: "geometry_distance_centroid",
    member:
      "routine:$extension:postgis.geometry_distance_centroid($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member386 = createSqlFunction({
    ...base,
    name: "geometry_distance_cpa",
    member: "routine:$extension:postgis.geometry_distance_cpa($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member387 = createSqlFunction({
    ...base,
    name: "geometry_eq",
    member: "routine:$extension:postgis.geometry_eq($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member388 = createSqlFunction({
    ...base,
    name: "geometry_ge",
    member: "routine:$extension:postgis.geometry_ge($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member406 = createSqlFunction({
    ...base,
    name: "geometry_gt",
    member: "routine:$extension:postgis.geometry_gt($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member407 = createSqlFunction({
    ...base,
    name: "geometry_hash",
    member: "routine:$extension:postgis.geometry_hash($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc19,
  });
  const member409 = createSqlFunction({
    ...base,
    name: "geometry_le",
    member: "routine:$extension:postgis.geometry_le($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member410 = createSqlFunction({
    ...base,
    name: "geometry_left",
    member: "routine:$extension:postgis.geometry_left($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member411 = createSqlFunction({
    ...base,
    name: "geometry_lt",
    member: "routine:$extension:postgis.geometry_lt($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member412 = createSqlFunction({
    ...base,
    name: "geometry_neq",
    member: "routine:$extension:postgis.geometry_neq($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member414 = createSqlFunction({
    ...base,
    name: "geometry_overabove",
    member: "routine:$extension:postgis.geometry_overabove($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member415 = createSqlFunction({
    ...base,
    name: "geometry_overbelow",
    member: "routine:$extension:postgis.geometry_overbelow($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member416 = createSqlFunction({
    ...base,
    name: "geometry_overlaps_3d",
    member: "routine:$extension:postgis.geometry_overlaps_3d($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member417 = createSqlFunction({
    ...base,
    name: "geometry_overlaps_nd",
    member: "routine:$extension:postgis.geometry_overlaps_nd($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member418 = createSqlFunction({
    ...base,
    name: "geometry_overlaps",
    member: "routine:$extension:postgis.geometry_overlaps($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member419 = createSqlFunction({
    ...base,
    name: "geometry_overleft",
    member: "routine:$extension:postgis.geometry_overleft($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member420 = createSqlFunction({
    ...base,
    name: "geometry_overright",
    member: "routine:$extension:postgis.geometry_overright($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member422 = createSqlFunction({
    ...base,
    name: "geometry_right",
    member: "routine:$extension:postgis.geometry_right($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member423 = createSqlFunction({
    ...base,
    name: "geometry_same_3d",
    member: "routine:$extension:postgis.geometry_same_3d($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member424 = createSqlFunction({
    ...base,
    name: "geometry_same_nd",
    member: "routine:$extension:postgis.geometry_same_nd($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member425 = createSqlFunction({
    ...base,
    name: "geometry_same",
    member: "routine:$extension:postgis.geometry_same($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member426 = createSqlFunction({
    ...base,
    name: "geometry_send",
    member: "routine:$extension:postgis.geometry_send($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc8,
  });
  const member448 = createSqlFunction({
    ...base,
    name: "geometry_within_nd",
    member: "routine:$extension:postgis.geometry_within_nd($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member449 = createSqlFunction({
    ...base,
    name: "geometry_within",
    member: "routine:$extension:postgis.geometry_within($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member450 = createSqlFunction({
    ...base,
    name: "geometry",
    member: "routine:$extension:postgis.geometry($extension:postgis.box2d)",
    arguments: [nc0] as const,
    result: nc4,
  });
  const member451 = createSqlFunction({
    ...base,
    name: "geometry",
    member: "routine:$extension:postgis.geometry($extension:postgis.box3d)",
    arguments: [nc2] as const,
    result: nc4,
  });
  const member452 = createSqlFunction({
    ...base,
    name: "geometry",
    member: "routine:$extension:postgis.geometry($extension:postgis.geography)",
    arguments: [nc3] as const,
    result: nc4,
  });
  const member453 = createSqlFunction({
    ...base,
    name: "geometry",
    member: "routine:$extension:postgis.geometry($extension:postgis.geometry,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc4, nc19, nc15] as const,
    result: nc4,
  });
  const member454 = createSqlFunction({
    ...base,
    name: "geometry",
    member: "routine:$extension:postgis.geometry(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member455 = createSqlFunction({
    ...base,
    name: "geometry",
    member: "routine:$extension:postgis.geometry(pg_catalog.path)",
    arguments: [nc11] as const,
    result: nc4,
  });
  const member456 = createSqlFunction({
    ...base,
    name: "geometry",
    member: "routine:$extension:postgis.geometry(pg_catalog.point)",
    arguments: [nc12] as const,
    result: nc4,
  });
  const member457 = createSqlFunction({
    ...base,
    name: "geometry",
    member: "routine:$extension:postgis.geometry(pg_catalog.polygon)",
    arguments: [nc13] as const,
    result: nc4,
  });
  const member458 = createSqlFunction({
    ...base,
    name: "geometry",
    member: "routine:$extension:postgis.geometry(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member459 = createSqlFunction({
    ...base,
    name: "geometrytype",
    member: "routine:$extension:postgis.geometrytype($extension:postgis.geography)",
    arguments: [nc3] as const,
    result: nc14,
  });
  const member460 = createSqlFunction({
    ...base,
    name: "geometrytype",
    member: "routine:$extension:postgis.geometrytype($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc14,
  });
  const member461 = createSqlFunction({
    ...base,
    name: "geomfromewkb",
    member: "routine:$extension:postgis.geomfromewkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member462 = createSqlFunction({
    ...base,
    name: "geomfromewkt",
    member: "routine:$extension:postgis.geomfromewkt(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member463 = createSqlFunction({
    ...base,
    name: "get_proj4_from_srid",
    member: "routine:$extension:postgis.get_proj4_from_srid(pg_catalog.int4)",
    arguments: [nc19] as const,
    result: nc14,
  });
  const member470 = createSqlFunction({
    ...base,
    name: "is_contained_2d",
    member: "routine:$extension:postgis.is_contained_2d($extension:postgis.box2df,$extension:postgis.box2df)",
    arguments: [nc1, nc1] as const,
    result: nc15,
  });
  const member471 = createSqlFunction({
    ...base,
    name: "is_contained_2d",
    member: "routine:$extension:postgis.is_contained_2d($extension:postgis.box2df,$extension:postgis.geometry)",
    arguments: [nc1, nc4] as const,
    result: nc15,
  });
  const member472 = createSqlFunction({
    ...base,
    name: "is_contained_2d",
    member: "routine:$extension:postgis.is_contained_2d($extension:postgis.geometry,$extension:postgis.box2df)",
    arguments: [nc4, nc1] as const,
    result: nc15,
  });
  const member473 = createSqlFunction({
    ...base,
    name: "json",
    member: "routine:$extension:postgis.json($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc9,
  });
  const member474 = createSqlFunction({
    ...base,
    name: "jsonb",
    member: "routine:$extension:postgis.jsonb($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc10,
  });
  const member475 = createSqlFunction({
    ...base,
    name: "overlaps_2d",
    member: "routine:$extension:postgis.overlaps_2d($extension:postgis.box2df,$extension:postgis.box2df)",
    arguments: [nc1, nc1] as const,
    result: nc15,
  });
  const member476 = createSqlFunction({
    ...base,
    name: "overlaps_2d",
    member: "routine:$extension:postgis.overlaps_2d($extension:postgis.box2df,$extension:postgis.geometry)",
    arguments: [nc1, nc4] as const,
    result: nc15,
  });
  const member477 = createSqlFunction({
    ...base,
    name: "overlaps_2d",
    member: "routine:$extension:postgis.overlaps_2d($extension:postgis.geometry,$extension:postgis.box2df)",
    arguments: [nc4, nc1] as const,
    result: nc15,
  });
  const member478 = createSqlFunction({
    ...base,
    name: "overlaps_geog",
    member: "routine:$extension:postgis.overlaps_geog($extension:postgis.geography,$extension:postgis.gidx)",
    arguments: [nc3, nc5] as const,
    result: nc15,
  });
  const member479 = createSqlFunction({
    ...base,
    name: "overlaps_geog",
    member: "routine:$extension:postgis.overlaps_geog($extension:postgis.gidx,$extension:postgis.geography)",
    arguments: [nc5, nc3] as const,
    result: nc15,
  });
  const member480 = createSqlFunction({
    ...base,
    name: "overlaps_geog",
    member: "routine:$extension:postgis.overlaps_geog($extension:postgis.gidx,$extension:postgis.gidx)",
    arguments: [nc5, nc5] as const,
    result: nc15,
  });
  const member481 = createSqlFunction({
    ...base,
    name: "overlaps_nd",
    member: "routine:$extension:postgis.overlaps_nd($extension:postgis.geometry,$extension:postgis.gidx)",
    arguments: [nc4, nc5] as const,
    result: nc15,
  });
  const member482 = createSqlFunction({
    ...base,
    name: "overlaps_nd",
    member: "routine:$extension:postgis.overlaps_nd($extension:postgis.gidx,$extension:postgis.geometry)",
    arguments: [nc5, nc4] as const,
    result: nc15,
  });
  const member483 = createSqlFunction({
    ...base,
    name: "overlaps_nd",
    member: "routine:$extension:postgis.overlaps_nd($extension:postgis.gidx,$extension:postgis.gidx)",
    arguments: [nc5, nc5] as const,
    result: nc15,
  });
  const member484 = createSqlFunction({
    ...base,
    name: "path",
    member: "routine:$extension:postgis.path($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc11,
  });
  const member516 = createSqlFunction({
    ...base,
    name: "point",
    member: "routine:$extension:postgis.point($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc12,
  });
  const member517 = createSqlFunction({
    ...base,
    name: "polygon",
    member: "routine:$extension:postgis.polygon($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc13,
  });
  const member520 = createSqlFunction({
    ...base,
    name: "postgis_addbbox",
    member: "routine:$extension:postgis.postgis_addbbox($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member522 = createSqlFunction({
    ...base,
    name: "postgis_constraint_dims",
    member: "routine:$extension:postgis.postgis_constraint_dims(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14, nc14] as const,
    result: nc19,
  });
  const member523 = createSqlFunction({
    ...base,
    name: "postgis_constraint_srid",
    member: "routine:$extension:postgis.postgis_constraint_srid(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14, nc14] as const,
    result: nc19,
  });
  const member524 = createSqlFunction({
    ...base,
    name: "postgis_constraint_type",
    member: "routine:$extension:postgis.postgis_constraint_type(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14, nc14] as const,
    result: nc21,
  });
  const member525 = createSqlFunction({
    ...base,
    name: "postgis_dropbbox",
    member: "routine:$extension:postgis.postgis_dropbbox($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member527 = createSqlFunction({
    ...base,
    name: "postgis_full_version",
    member: "routine:$extension:postgis.postgis_full_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member528 = createSqlFunction({
    ...base,
    name: "postgis_geos_compiled_version",
    member: "routine:$extension:postgis.postgis_geos_compiled_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member529 = createSqlFunction({
    ...base,
    name: "postgis_geos_noop",
    member: "routine:$extension:postgis.postgis_geos_noop($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member530 = createSqlFunction({
    ...base,
    name: "postgis_geos_version",
    member: "routine:$extension:postgis.postgis_geos_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member531 = createSqlFunction({
    ...base,
    name: "postgis_getbbox",
    member: "routine:$extension:postgis.postgis_getbbox($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc0,
  });
  const member532 = createSqlFunction({
    ...base,
    name: "postgis_hasbbox",
    member: "routine:$extension:postgis.postgis_hasbbox($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc15,
  });
  const member534 = createSqlFunction({
    ...base,
    name: "postgis_lib_build_date",
    member: "routine:$extension:postgis.postgis_lib_build_date()",
    arguments: [] as const,
    result: nc14,
  });
  const member535 = createSqlFunction({
    ...base,
    name: "postgis_lib_revision",
    member: "routine:$extension:postgis.postgis_lib_revision()",
    arguments: [] as const,
    result: nc14,
  });
  const member536 = createSqlFunction({
    ...base,
    name: "postgis_lib_version",
    member: "routine:$extension:postgis.postgis_lib_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member537 = createSqlFunction({
    ...base,
    name: "postgis_libjson_version",
    member: "routine:$extension:postgis.postgis_libjson_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member538 = createSqlFunction({
    ...base,
    name: "postgis_liblwgeom_version",
    member: "routine:$extension:postgis.postgis_liblwgeom_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member539 = createSqlFunction({
    ...base,
    name: "postgis_libprotobuf_version",
    member: "routine:$extension:postgis.postgis_libprotobuf_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member540 = createSqlFunction({
    ...base,
    name: "postgis_libxml_version",
    member: "routine:$extension:postgis.postgis_libxml_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member541 = createSqlFunction({
    ...base,
    name: "postgis_noop",
    member: "routine:$extension:postgis.postgis_noop($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member542 = createSqlFunction({
    ...base,
    name: "postgis_proj_compiled_version",
    member: "routine:$extension:postgis.postgis_proj_compiled_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member543 = createSqlFunction({
    ...base,
    name: "postgis_proj_version",
    member: "routine:$extension:postgis.postgis_proj_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member544 = createSqlFunction({
    ...base,
    name: "postgis_scripts_build_date",
    member: "routine:$extension:postgis.postgis_scripts_build_date()",
    arguments: [] as const,
    result: nc14,
  });
  const member545 = createSqlFunction({
    ...base,
    name: "postgis_scripts_installed",
    member: "routine:$extension:postgis.postgis_scripts_installed()",
    arguments: [] as const,
    result: nc14,
  });
  const member546 = createSqlFunction({
    ...base,
    name: "postgis_scripts_released",
    member: "routine:$extension:postgis.postgis_scripts_released()",
    arguments: [] as const,
    result: nc14,
  });
  const rowFields547 = {
    auth_name: nc14,
    auth_srid: nc14,
    srname: nc14,
    srtext: nc14,
    proj4text: nc14,
    point_sw: nc4,
    point_ne: nc4,
  } as const;
  const member547 = createSqlFunction({
    ...base,
    name: "postgis_srs_all",
    member: "routine:$extension:postgis.postgis_srs_all()",
    arguments: [] as const,
    result: nullableCodec(compositeCodec("routine:$extension:postgis.postgis_srs_all()", rowFields547)),
  });
  const rows547 = (alias: string, ...values: Parameters<typeof member547>) =>
    extensionRows(member547(...values), alias, rowFields547, "named");
  const member548 = createSqlFunction({
    ...base,
    name: "postgis_srs_codes",
    member: "routine:$extension:postgis.postgis_srs_codes(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc14,
  });
  const rowFields549 = {
    auth_name: nc14,
    auth_srid: nc14,
    srname: nc14,
    srtext: nc14,
    proj4text: nc14,
    point_sw: nc4,
    point_ne: nc4,
  } as const;
  const member549 = createSqlFunction({
    ...base,
    name: "postgis_srs_search",
    member: "routine:$extension:postgis.postgis_srs_search($extension:postgis.geometry,pg_catalog.text)",
    arguments: [nc4, defaultSqlArgument(nc14, "authname")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis.postgis_srs_search($extension:postgis.geometry,pg_catalog.text)",
        rowFields549,
      ),
    ),
  });
  const rows549 = (alias: string, ...values: Parameters<typeof member549>) =>
    extensionRows(member549(...values), alias, rowFields549, "named");
  const rowFields550 = {
    auth_name: nc14,
    auth_srid: nc14,
    srname: nc14,
    srtext: nc14,
    proj4text: nc14,
    point_sw: nc4,
    point_ne: nc4,
  } as const;
  const member550 = createSqlFunction({
    ...base,
    name: "postgis_srs",
    member: "routine:$extension:postgis.postgis_srs(pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14] as const,
    result: nullableCodec(
      compositeCodec("routine:$extension:postgis.postgis_srs(pg_catalog.text,pg_catalog.text)", rowFields550),
    ),
  });
  const rows550 = (alias: string, ...values: Parameters<typeof member550>) =>
    extensionRows(member550(...values), alias, rowFields550, "named");
  const member551 = createSqlFunction({
    ...base,
    name: "postgis_svn_version",
    member: "routine:$extension:postgis.postgis_svn_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member552 = createSqlFunction({
    ...base,
    name: "postgis_transform_geometry",
    member:
      "routine:$extension:postgis.postgis_transform_geometry($extension:postgis.geometry,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
    arguments: [nc4, nc14, nc14, nc19] as const,
    result: nc4,
  });
  const member553 = createSqlFunction({
    ...base,
    name: "postgis_transform_pipeline_geometry",
    member:
      "routine:$extension:postgis.postgis_transform_pipeline_geometry($extension:postgis.geometry,pg_catalog.text,pg_catalog.bool,pg_catalog.int4)",
    arguments: [nc4, nc14, nc15, nc19] as const,
    result: nc4,
  });
  const member554 = createSqlFunction({
    ...base,
    name: "postgis_type_name",
    member: "routine:$extension:postgis.postgis_type_name(pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc21, nc19, defaultSqlArgument(nc15, "use_new_name")] as const,
    result: nc21,
  });
  const member555 = createSqlFunction({
    ...base,
    name: "postgis_typmod_dims",
    member: "routine:$extension:postgis.postgis_typmod_dims(pg_catalog.int4)",
    arguments: [nc19] as const,
    result: nc19,
  });
  const member556 = createSqlFunction({
    ...base,
    name: "postgis_typmod_srid",
    member: "routine:$extension:postgis.postgis_typmod_srid(pg_catalog.int4)",
    arguments: [nc19] as const,
    result: nc19,
  });
  const member557 = createSqlFunction({
    ...base,
    name: "postgis_typmod_type",
    member: "routine:$extension:postgis.postgis_typmod_type(pg_catalog.int4)",
    arguments: [nc19] as const,
    result: nc14,
  });
  const member558 = createSqlFunction({
    ...base,
    name: "postgis_version",
    member: "routine:$extension:postgis.postgis_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member559 = createSqlFunction({
    ...base,
    name: "postgis_wagyu_version",
    member: "routine:$extension:postgis.postgis_wagyu_version()",
    arguments: [] as const,
    result: nc14,
  });
  const member562 = createSqlFunction({
    ...base,
    name: "st_3dclosestpoint",
    member: "routine:$extension:postgis.st_3dclosestpoint($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member563 = createSqlFunction({
    ...base,
    name: "st_3ddfullywithin",
    member:
      "routine:$extension:postgis.st_3ddfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16] as const,
    result: nc15,
  });
  const member564 = createSqlFunction({
    ...base,
    name: "st_3ddistance",
    member: "routine:$extension:postgis.st_3ddistance($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member565 = createSqlFunction({
    ...base,
    name: "st_3ddwithin",
    member:
      "routine:$extension:postgis.st_3ddwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16] as const,
    result: nc15,
  });
  const member566 = createSqlAggregate({
    ...base,
    name: "st_3dextent",
    member: "routine:$extension:postgis.st_3dextent($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc2,
  });
  const member567 = createSqlFunction({
    ...base,
    name: "st_3dintersects",
    member: "routine:$extension:postgis.st_3dintersects($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member568 = createSqlFunction({
    ...base,
    name: "st_3dlength",
    member: "routine:$extension:postgis.st_3dlength($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc16,
  });
  const member569 = createSqlFunction({
    ...base,
    name: "st_3dlineinterpolatepoint",
    member: "routine:$extension:postgis.st_3dlineinterpolatepoint($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc4,
  });
  const member570 = createSqlFunction({
    ...base,
    name: "st_3dlongestline",
    member: "routine:$extension:postgis.st_3dlongestline($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member571 = createSqlFunction({
    ...base,
    name: "st_3dmakebox",
    member: "routine:$extension:postgis.st_3dmakebox($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc2,
  });
  const member572 = createSqlFunction({
    ...base,
    name: "st_3dmaxdistance",
    member: "routine:$extension:postgis.st_3dmaxdistance($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member573 = createSqlFunction({
    ...base,
    name: "st_3dperimeter",
    member: "routine:$extension:postgis.st_3dperimeter($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc16,
  });
  const member574 = createSqlFunction({
    ...base,
    name: "st_3dshortestline",
    member: "routine:$extension:postgis.st_3dshortestline($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member575 = createSqlFunction({
    ...base,
    name: "st_addmeasure",
    member: "routine:$extension:postgis.st_addmeasure($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16] as const,
    result: nc4,
  });
  const member576 = createSqlFunction({
    ...base,
    name: "st_addpoint",
    member:
      "routine:$extension:postgis.st_addpoint($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc4, nc19] as const,
    result: nc4,
  });
  const member577 = createSqlFunction({
    ...base,
    name: "st_addpoint",
    member: "routine:$extension:postgis.st_addpoint($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member578 = createSqlFunction({
    ...base,
    name: "st_affine",
    member:
      "routine:$extension:postgis.st_affine($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16, nc16, nc16, nc16, nc16, nc16, nc16, nc16, nc16, nc16, nc16] as const,
    result: nc4,
  });
  const member579 = createSqlFunction({
    ...base,
    name: "st_affine",
    member:
      "routine:$extension:postgis.st_affine($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16, nc16, nc16, nc16, nc16] as const,
    result: nc4,
  });
  const member580 = createSqlFunction({
    ...base,
    name: "st_angle",
    member:
      "routine:$extension:postgis.st_angle($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4, nc4, defaultSqlArgument(nc4, "pt4")] as const,
    result: nc16,
  });
  const member581 = createSqlFunction({
    ...base,
    name: "st_angle",
    member: "routine:$extension:postgis.st_angle($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member582 = createSqlFunction({
    ...base,
    name: "st_area",
    member: "routine:$extension:postgis.st_area($extension:postgis.geography,pg_catalog.bool)",
    arguments: [nc3, defaultSqlArgument(nc15, "use_spheroid")] as const,
    result: nc16,
  });
  const member583 = createSqlFunction({
    ...base,
    name: "st_area",
    member: "routine:$extension:postgis.st_area($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc16,
  });
  const member584 = createSqlFunction({
    ...base,
    name: "st_area",
    member: "routine:$extension:postgis.st_area(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc16,
  });
  const member585 = createSqlFunction({
    ...base,
    name: "st_area2d",
    member: "routine:$extension:postgis.st_area2d($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc16,
  });
  const member586 = createSqlFunction({
    ...base,
    name: "st_asbinary",
    member: "routine:$extension:postgis.st_asbinary($extension:postgis.geography,pg_catalog.text)",
    arguments: [nc3, nc14] as const,
    result: nc8,
  });
  const member587 = createSqlFunction({
    ...base,
    name: "st_asbinary",
    member: "routine:$extension:postgis.st_asbinary($extension:postgis.geography)",
    arguments: [nc3] as const,
    result: nc8,
  });
  const member588 = createSqlFunction({
    ...base,
    name: "st_asbinary",
    member: "routine:$extension:postgis.st_asbinary($extension:postgis.geometry,pg_catalog.text)",
    arguments: [nc4, nc14] as const,
    result: nc8,
  });
  const member589 = createSqlFunction({
    ...base,
    name: "st_asbinary",
    member: "routine:$extension:postgis.st_asbinary($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc8,
  });
  const member590 = createSqlFunction({
    ...base,
    name: "st_asencodedpolyline",
    member: "routine:$extension:postgis.st_asencodedpolyline($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, defaultSqlArgument(nc19, "nprecision")] as const,
    result: nc14,
  });
  const member591 = createSqlFunction({
    ...base,
    name: "st_asewkb",
    member: "routine:$extension:postgis.st_asewkb($extension:postgis.geometry,pg_catalog.text)",
    arguments: [nc4, nc14] as const,
    result: nc8,
  });
  const member592 = createSqlFunction({
    ...base,
    name: "st_asewkb",
    member: "routine:$extension:postgis.st_asewkb($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc8,
  });
  const member593 = createSqlFunction({
    ...base,
    name: "st_asewkt",
    member: "routine:$extension:postgis.st_asewkt($extension:postgis.geography,pg_catalog.int4)",
    arguments: [nc3, nc19] as const,
    result: nc14,
  });
  const member594 = createSqlFunction({
    ...base,
    name: "st_asewkt",
    member: "routine:$extension:postgis.st_asewkt($extension:postgis.geography)",
    arguments: [nc3] as const,
    result: nc14,
  });
  const member595 = createSqlFunction({
    ...base,
    name: "st_asewkt",
    member: "routine:$extension:postgis.st_asewkt($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc14,
  });
  const member596 = createSqlFunction({
    ...base,
    name: "st_asewkt",
    member: "routine:$extension:postgis.st_asewkt($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc14,
  });
  const member597 = createSqlFunction({
    ...base,
    name: "st_asewkt",
    member: "routine:$extension:postgis.st_asewkt(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc14,
  });
  const member598 = createSqlAggregate({
    ...base,
    name: "st_asflatgeobuf",
    member: "routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement,pg_catalog.bool,pg_catalog.text)",
    arguments: [nc26, nc15, nc14] as const,
    result: nc8,
  });
  const member599 = createSqlAggregate({
    ...base,
    name: "st_asflatgeobuf",
    member: "routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement,pg_catalog.bool)",
    arguments: [nc26, nc15] as const,
    result: nc8,
  });
  const member600 = createSqlAggregate({
    ...base,
    name: "st_asflatgeobuf",
    member: "routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement)",
    arguments: [nc26] as const,
    result: nc8,
  });
  const member601 = createSqlAggregate({
    ...base,
    name: "st_asgeobuf",
    member: "routine:$extension:postgis.st_asgeobuf(pg_catalog.anyelement,pg_catalog.text)",
    arguments: [nc26, nc14] as const,
    result: nc8,
  });
  const member602 = createSqlAggregate({
    ...base,
    name: "st_asgeobuf",
    member: "routine:$extension:postgis.st_asgeobuf(pg_catalog.anyelement)",
    arguments: [nc26] as const,
    result: nc8,
  });
  const member603 = createSqlFunction({
    ...base,
    name: "st_asgeojson",
    member: "routine:$extension:postgis.st_asgeojson($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc3, defaultSqlArgument(nc19, "maxdecimaldigits"), defaultSqlArgument(nc19, "options")] as const,
    result: nc14,
  });
  const member604 = createSqlFunction({
    ...base,
    name: "st_asgeojson",
    member: "routine:$extension:postgis.st_asgeojson($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc4, defaultSqlArgument(nc19, "maxdecimaldigits"), defaultSqlArgument(nc19, "options")] as const,
    result: nc14,
  });
  const member605 = createSqlFunction({
    ...base,
    name: "st_asgeojson",
    member:
      "routine:$extension:postgis.st_asgeojson(pg_catalog.record,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.text)",
    arguments: [
      nc27,
      defaultSqlArgument(nc14, "geom_column"),
      defaultSqlArgument(nc19, "maxdecimaldigits"),
      defaultSqlArgument(nc15, "pretty_bool"),
      defaultSqlArgument(nc14, "id_column"),
    ] as const,
    result: nc14,
  });
  const member606 = createSqlFunction({
    ...base,
    name: "st_asgeojson",
    member: "routine:$extension:postgis.st_asgeojson(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc14,
  });
  const member607 = createSqlFunction({
    ...base,
    name: "st_asgml",
    member:
      "routine:$extension:postgis.st_asgml($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)",
    arguments: [
      nc3,
      defaultSqlArgument(nc19, "maxdecimaldigits"),
      defaultSqlArgument(nc19, "options"),
      defaultSqlArgument(nc14, "nprefix"),
      defaultSqlArgument(nc14, "id"),
    ] as const,
    result: nc14,
  });
  const member608 = createSqlFunction({
    ...base,
    name: "st_asgml",
    member: "routine:$extension:postgis.st_asgml($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc4, defaultSqlArgument(nc19, "maxdecimaldigits"), defaultSqlArgument(nc19, "options")] as const,
    result: nc14,
  });
  const member609 = createSqlFunction({
    ...base,
    name: "st_asgml",
    member:
      "routine:$extension:postgis.st_asgml(pg_catalog.int4,$extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)",
    arguments: [
      nc19,
      nc3,
      defaultSqlArgument(nc19, "maxdecimaldigits"),
      defaultSqlArgument(nc19, "options"),
      defaultSqlArgument(nc14, "nprefix"),
      defaultSqlArgument(nc14, "id"),
    ] as const,
    result: nc14,
  });
  const member610 = createSqlFunction({
    ...base,
    name: "st_asgml",
    member:
      "routine:$extension:postgis.st_asgml(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)",
    arguments: [
      nc19,
      nc4,
      defaultSqlArgument(nc19, "maxdecimaldigits"),
      defaultSqlArgument(nc19, "options"),
      defaultSqlArgument(nc14, "nprefix"),
      defaultSqlArgument(nc14, "id"),
    ] as const,
    result: nc14,
  });
  const member611 = createSqlFunction({
    ...base,
    name: "st_asgml",
    member: "routine:$extension:postgis.st_asgml(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc14,
  });
  const member612 = createSqlFunction({
    ...base,
    name: "st_ashexewkb",
    member: "routine:$extension:postgis.st_ashexewkb($extension:postgis.geometry,pg_catalog.text)",
    arguments: [nc4, nc14] as const,
    result: nc14,
  });
  const member613 = createSqlFunction({
    ...base,
    name: "st_ashexewkb",
    member: "routine:$extension:postgis.st_ashexewkb($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc14,
  });
  const member614 = createSqlFunction({
    ...base,
    name: "st_askml",
    member: "routine:$extension:postgis.st_askml($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)",
    arguments: [nc3, defaultSqlArgument(nc19, "maxdecimaldigits"), defaultSqlArgument(nc14, "nprefix")] as const,
    result: nc14,
  });
  const member615 = createSqlFunction({
    ...base,
    name: "st_askml",
    member: "routine:$extension:postgis.st_askml($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)",
    arguments: [nc4, defaultSqlArgument(nc19, "maxdecimaldigits"), defaultSqlArgument(nc14, "nprefix")] as const,
    result: nc14,
  });
  const member616 = createSqlFunction({
    ...base,
    name: "st_askml",
    member: "routine:$extension:postgis.st_askml(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc14,
  });
  const member617 = createSqlFunction({
    ...base,
    name: "st_aslatlontext",
    member: "routine:$extension:postgis.st_aslatlontext($extension:postgis.geometry,pg_catalog.text)",
    arguments: [nc4, defaultSqlArgument(nc14, "tmpl")] as const,
    result: nc14,
  });
  const member618 = createSqlFunction({
    ...base,
    name: "st_asmarc21",
    member: "routine:$extension:postgis.st_asmarc21($extension:postgis.geometry,pg_catalog.text)",
    arguments: [nc4, defaultSqlArgument(nc14, "format")] as const,
    result: nc14,
  });
  const member619 = createSqlAggregate({
    ...base,
    name: "st_asmvt",
    member:
      "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.text)",
    arguments: [nc26, nc14, nc19, nc14, nc14] as const,
    result: nc8,
  });
  const member620 = createSqlAggregate({
    ...base,
    name: "st_asmvt",
    member:
      "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
    arguments: [nc26, nc14, nc19, nc14] as const,
    result: nc8,
  });
  const member621 = createSqlAggregate({
    ...base,
    name: "st_asmvt",
    member: "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4)",
    arguments: [nc26, nc14, nc19] as const,
    result: nc8,
  });
  const member622 = createSqlAggregate({
    ...base,
    name: "st_asmvt",
    member: "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text)",
    arguments: [nc26, nc14] as const,
    result: nc8,
  });
  const member623 = createSqlAggregate({
    ...base,
    name: "st_asmvt",
    member: "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement)",
    arguments: [nc26] as const,
    result: nc8,
  });
  const member624 = createSqlFunction({
    ...base,
    name: "st_asmvtgeom",
    member:
      "routine:$extension:postgis.st_asmvtgeom($extension:postgis.geometry,$extension:postgis.box2d,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    arguments: [
      nc4,
      nc0,
      defaultSqlArgument(nc19, "extent"),
      defaultSqlArgument(nc19, "buffer"),
      defaultSqlArgument(nc15, "clip_geom"),
    ] as const,
    result: nc4,
  });
  const member625 = createSqlFunction({
    ...base,
    name: "st_assvg",
    member: "routine:$extension:postgis.st_assvg($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc3, defaultSqlArgument(nc19, "rel"), defaultSqlArgument(nc19, "maxdecimaldigits")] as const,
    result: nc14,
  });
  const member626 = createSqlFunction({
    ...base,
    name: "st_assvg",
    member: "routine:$extension:postgis.st_assvg($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc4, defaultSqlArgument(nc19, "rel"), defaultSqlArgument(nc19, "maxdecimaldigits")] as const,
    result: nc14,
  });
  const member627 = createSqlFunction({
    ...base,
    name: "st_assvg",
    member: "routine:$extension:postgis.st_assvg(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc14,
  });
  const member628 = createSqlFunction({
    ...base,
    name: "st_astext",
    member: "routine:$extension:postgis.st_astext($extension:postgis.geography,pg_catalog.int4)",
    arguments: [nc3, nc19] as const,
    result: nc14,
  });
  const member629 = createSqlFunction({
    ...base,
    name: "st_astext",
    member: "routine:$extension:postgis.st_astext($extension:postgis.geography)",
    arguments: [nc3] as const,
    result: nc14,
  });
  const member630 = createSqlFunction({
    ...base,
    name: "st_astext",
    member: "routine:$extension:postgis.st_astext($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc14,
  });
  const member631 = createSqlFunction({
    ...base,
    name: "st_astext",
    member: "routine:$extension:postgis.st_astext($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc14,
  });
  const member632 = createSqlFunction({
    ...base,
    name: "st_astext",
    member: "routine:$extension:postgis.st_astext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc14,
  });
  const member633 = createSqlFunction({
    ...base,
    name: "st_astwkb",
    member:
      "routine:$extension:postgis.st_astwkb($extension:postgis._geometry,pg_catalog._int8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    arguments: [
      nc35,
      nc28,
      defaultSqlArgument(nc19, "prec"),
      defaultSqlArgument(nc19, "prec_z"),
      defaultSqlArgument(nc19, "prec_m"),
      defaultSqlArgument(nc15, "with_sizes"),
      defaultSqlArgument(nc15, "with_boxes"),
    ] as const,
    result: nc8,
  });
  const member634 = createSqlFunction({
    ...base,
    name: "st_astwkb",
    member:
      "routine:$extension:postgis.st_astwkb($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    arguments: [
      nc4,
      defaultSqlArgument(nc19, "prec"),
      defaultSqlArgument(nc19, "prec_z"),
      defaultSqlArgument(nc19, "prec_m"),
      defaultSqlArgument(nc15, "with_sizes"),
      defaultSqlArgument(nc15, "with_boxes"),
    ] as const,
    result: nc8,
  });
  const member635 = createSqlFunction({
    ...base,
    name: "st_asx3d",
    member: "routine:$extension:postgis.st_asx3d($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc4, defaultSqlArgument(nc19, "maxdecimaldigits"), defaultSqlArgument(nc19, "options")] as const,
    result: nc14,
  });
  const member636 = createSqlFunction({
    ...base,
    name: "st_azimuth",
    member: "routine:$extension:postgis.st_azimuth($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc16,
  });
  const member637 = createSqlFunction({
    ...base,
    name: "st_azimuth",
    member: "routine:$extension:postgis.st_azimuth($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member638 = createSqlFunction({
    ...base,
    name: "st_bdmpolyfromtext",
    member: "routine:$extension:postgis.st_bdmpolyfromtext(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member639 = createSqlFunction({
    ...base,
    name: "st_bdpolyfromtext",
    member: "routine:$extension:postgis.st_bdpolyfromtext(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member640 = createSqlFunction({
    ...base,
    name: "st_boundary",
    member: "routine:$extension:postgis.st_boundary($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member641 = createSqlFunction({
    ...base,
    name: "st_boundingdiagonal",
    member: "routine:$extension:postgis.st_boundingdiagonal($extension:postgis.geometry,pg_catalog.bool)",
    arguments: [nc4, defaultSqlArgument(nc15, "fits")] as const,
    result: nc4,
  });
  const member642 = createSqlFunction({
    ...base,
    name: "st_box2dfromgeohash",
    member: "routine:$extension:postgis.st_box2dfromgeohash(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, defaultSqlArgument(nc19, undefined)] as const,
    result: nc0,
  });
  const member643 = createSqlFunction({
    ...base,
    name: "st_buffer",
    member: "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8,pg_catalog.int4)",
    arguments: [nc3, nc16, nc19] as const,
    result: nc3,
  });
  const member644 = createSqlFunction({
    ...base,
    name: "st_buffer",
    member: "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8,pg_catalog.text)",
    arguments: [nc3, nc16, nc14] as const,
    result: nc3,
  });
  const member645 = createSqlFunction({
    ...base,
    name: "st_buffer",
    member: "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8)",
    arguments: [nc3, nc16] as const,
    result: nc3,
  });
  const member646 = createSqlFunction({
    ...base,
    name: "st_buffer",
    member: "routine:$extension:postgis.st_buffer($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)",
    arguments: [nc4, nc16, nc19] as const,
    result: nc4,
  });
  const member647 = createSqlFunction({
    ...base,
    name: "st_buffer",
    member: "routine:$extension:postgis.st_buffer($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text)",
    arguments: [nc4, nc16, defaultSqlArgument(nc14, "options")] as const,
    result: nc4,
  });
  const member648 = createSqlFunction({
    ...base,
    name: "st_buffer",
    member: "routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8,pg_catalog.int4)",
    arguments: [nc14, nc16, nc19] as const,
    result: nc4,
  });
  const member649 = createSqlFunction({
    ...base,
    name: "st_buffer",
    member: "routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8,pg_catalog.text)",
    arguments: [nc14, nc16, nc14] as const,
    result: nc4,
  });
  const member650 = createSqlFunction({
    ...base,
    name: "st_buffer",
    member: "routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8)",
    arguments: [nc14, nc16] as const,
    result: nc4,
  });
  const member651 = createSqlFunction({
    ...base,
    name: "st_buildarea",
    member: "routine:$extension:postgis.st_buildarea($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member652 = createSqlFunction({
    ...base,
    name: "st_centroid",
    member: "routine:$extension:postgis.st_centroid($extension:postgis.geography,pg_catalog.bool)",
    arguments: [nc3, defaultSqlArgument(nc15, "use_spheroid")] as const,
    result: nc3,
  });
  const member653 = createSqlFunction({
    ...base,
    name: "st_centroid",
    member: "routine:$extension:postgis.st_centroid($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member654 = createSqlFunction({
    ...base,
    name: "st_centroid",
    member: "routine:$extension:postgis.st_centroid(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member655 = createSqlFunction({
    ...base,
    name: "st_chaikinsmoothing",
    member:
      "routine:$extension:postgis.st_chaikinsmoothing($extension:postgis.geometry,pg_catalog.int4,pg_catalog.bool)",
    arguments: [nc4, defaultSqlArgument(nc19, undefined), defaultSqlArgument(nc15, undefined)] as const,
    result: nc4,
  });
  const member656 = createSqlFunction({
    ...base,
    name: "st_cleangeometry",
    member: "routine:$extension:postgis.st_cleangeometry($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member657 = createSqlFunction({
    ...base,
    name: "st_clipbybox2d",
    member: "routine:$extension:postgis.st_clipbybox2d($extension:postgis.geometry,$extension:postgis.box2d)",
    arguments: [nc4, nc0] as const,
    result: nc4,
  });
  const member658 = createSqlFunction({
    ...base,
    name: "st_closestpoint",
    member:
      "routine:$extension:postgis.st_closestpoint($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)",
    arguments: [nc3, nc3, defaultSqlArgument(nc15, "use_spheroid")] as const,
    result: nc3,
  });
  const member659 = createSqlFunction({
    ...base,
    name: "st_closestpoint",
    member: "routine:$extension:postgis.st_closestpoint($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member660 = createSqlFunction({
    ...base,
    name: "st_closestpoint",
    member: "routine:$extension:postgis.st_closestpoint(pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14] as const,
    result: nc4,
  });
  const member661 = createSqlFunction({
    ...base,
    name: "st_closestpointofapproach",
    member:
      "routine:$extension:postgis.st_closestpointofapproach($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member662 = createSqlWindow({
    ...base,
    name: "st_clusterdbscan",
    member:
      "routine:$extension:postgis.st_clusterdbscan($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)",
    arguments: [nc4, nc16, nc19] as const,
    result: nc19,
  });
  const member663 = createSqlFunction({
    ...base,
    name: "st_clusterintersecting",
    member: "routine:$extension:postgis.st_clusterintersecting($extension:postgis._geometry)",
    arguments: [nc35] as const,
    result: nc35,
  });
  const member664 = createSqlAggregate({
    ...base,
    name: "st_clusterintersecting",
    member: "routine:$extension:postgis.st_clusterintersecting($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc35,
  });
  const member665 = createSqlWindow({
    ...base,
    name: "st_clusterintersectingwin",
    member: "routine:$extension:postgis.st_clusterintersectingwin($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc19,
  });
  const member666 = createSqlWindow({
    ...base,
    name: "st_clusterkmeans",
    member:
      "routine:$extension:postgis.st_clusterkmeans($extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)",
    arguments: [nc4, nc19, defaultSqlArgument(nc16, "max_radius")] as const,
    result: nc19,
  });
  const member667 = createSqlFunction({
    ...base,
    name: "st_clusterwithin",
    member: "routine:$extension:postgis.st_clusterwithin($extension:postgis._geometry,pg_catalog.float8)",
    arguments: [nc35, nc16] as const,
    result: nc35,
  });
  const member668 = createSqlAggregate({
    ...base,
    name: "st_clusterwithin",
    member: "routine:$extension:postgis.st_clusterwithin($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc35,
  });
  const member669 = createSqlWindow({
    ...base,
    name: "st_clusterwithinwin",
    member: "routine:$extension:postgis.st_clusterwithinwin($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc19,
  });
  const member670 = createSqlFunction({
    ...base,
    name: "st_collect",
    member: "routine:$extension:postgis.st_collect($extension:postgis._geometry)",
    arguments: [nc35] as const,
    result: nc4,
  });
  const member671 = createSqlFunction({
    ...base,
    name: "st_collect",
    member: "routine:$extension:postgis.st_collect($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member672 = createSqlAggregate({
    ...base,
    name: "st_collect",
    member: "routine:$extension:postgis.st_collect($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member673 = createSqlFunction({
    ...base,
    name: "st_collectionextract",
    member: "routine:$extension:postgis.st_collectionextract($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc4,
  });
  const member674 = createSqlFunction({
    ...base,
    name: "st_collectionextract",
    member: "routine:$extension:postgis.st_collectionextract($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member675 = createSqlFunction({
    ...base,
    name: "st_collectionhomogenize",
    member: "routine:$extension:postgis.st_collectionhomogenize($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member676 = createSqlFunction({
    ...base,
    name: "st_combinebbox",
    member: "routine:$extension:postgis.st_combinebbox($extension:postgis.box2d,$extension:postgis.geometry)",
    arguments: [nc0, nc4] as const,
    result: nc0,
  });
  const member677 = createSqlFunction({
    ...base,
    name: "st_combinebbox",
    member: "routine:$extension:postgis.st_combinebbox($extension:postgis.box3d,$extension:postgis.box3d)",
    arguments: [nc2, nc2] as const,
    result: nc2,
  });
  const member678 = createSqlFunction({
    ...base,
    name: "st_combinebbox",
    member: "routine:$extension:postgis.st_combinebbox($extension:postgis.box3d,$extension:postgis.geometry)",
    arguments: [nc2, nc4] as const,
    result: nc2,
  });
  const member679 = createSqlFunction({
    ...base,
    name: "st_concavehull",
    member: "routine:$extension:postgis.st_concavehull($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc4, nc16, defaultSqlArgument(nc15, "param_allow_holes")] as const,
    result: nc4,
  });
  const member680 = createSqlFunction({
    ...base,
    name: "st_contains",
    member: "routine:$extension:postgis.st_contains($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member681 = createSqlFunction({
    ...base,
    name: "st_containsproperly",
    member: "routine:$extension:postgis.st_containsproperly($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member682 = createSqlFunction({
    ...base,
    name: "st_convexhull",
    member: "routine:$extension:postgis.st_convexhull($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member683 = createSqlFunction({
    ...base,
    name: "st_coorddim",
    member: "routine:$extension:postgis.st_coorddim($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc25,
  });
  const member684 = createSqlWindow({
    ...base,
    name: "st_coverageclean",
    member:
      "routine:$extension:postgis.st_coverageclean($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.text)",
    arguments: [
      nc4,
      defaultSqlArgument(nc16, "gapmaximumwidth"),
      defaultSqlArgument(nc16, "snappingdistance"),
      defaultSqlArgument(nc14, "overlapmergestrategy"),
    ] as const,
    result: nc4,
  });
  const member685 = createSqlWindow({
    ...base,
    name: "st_coverageinvalidedges",
    member: "routine:$extension:postgis.st_coverageinvalidedges($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, defaultSqlArgument(nc16, "tolerance")] as const,
    result: nc4,
  });
  const member686 = createSqlWindow({
    ...base,
    name: "st_coveragesimplify",
    member:
      "routine:$extension:postgis.st_coveragesimplify($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc4, nc16, defaultSqlArgument(nc15, "simplifyboundary")] as const,
    result: nc4,
  });
  const member687 = createSqlFunction({
    ...base,
    name: "st_coverageunion",
    member: "routine:$extension:postgis.st_coverageunion($extension:postgis._geometry)",
    arguments: [nc35] as const,
    result: nc4,
  });
  const member688 = createSqlAggregate({
    ...base,
    name: "st_coverageunion",
    member: "routine:$extension:postgis.st_coverageunion($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member689 = createSqlFunction({
    ...base,
    name: "st_coveredby",
    member: "routine:$extension:postgis.st_coveredby($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc15,
  });
  const member690 = createSqlFunction({
    ...base,
    name: "st_coveredby",
    member: "routine:$extension:postgis.st_coveredby($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member691 = createSqlFunction({
    ...base,
    name: "st_coveredby",
    member: "routine:$extension:postgis.st_coveredby(pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14] as const,
    result: nc15,
  });
  const member692 = createSqlFunction({
    ...base,
    name: "st_covers",
    member: "routine:$extension:postgis.st_covers($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc15,
  });
  const member693 = createSqlFunction({
    ...base,
    name: "st_covers",
    member: "routine:$extension:postgis.st_covers($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member694 = createSqlFunction({
    ...base,
    name: "st_covers",
    member: "routine:$extension:postgis.st_covers(pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14] as const,
    result: nc15,
  });
  const member695 = createSqlFunction({
    ...base,
    name: "st_cpawithin",
    member:
      "routine:$extension:postgis.st_cpawithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16] as const,
    result: nc15,
  });
  const member696 = createSqlFunction({
    ...base,
    name: "st_crosses",
    member: "routine:$extension:postgis.st_crosses($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member697 = createSqlFunction({
    ...base,
    name: "st_curven",
    member: "routine:$extension:postgis.st_curven($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc4,
  });
  const member698 = createSqlFunction({
    ...base,
    name: "st_curvetoline",
    member:
      "routine:$extension:postgis.st_curvetoline($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)",
    arguments: [
      nc4,
      defaultSqlArgument(nc16, "tol"),
      defaultSqlArgument(nc19, "toltype"),
      defaultSqlArgument(nc19, "flags"),
    ] as const,
    result: nc4,
  });
  const member699 = createSqlFunction({
    ...base,
    name: "st_delaunaytriangles",
    member:
      "routine:$extension:postgis.st_delaunaytriangles($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)",
    arguments: [nc4, defaultSqlArgument(nc16, "tolerance"), defaultSqlArgument(nc19, "flags")] as const,
    result: nc4,
  });
  const member700 = createSqlFunction({
    ...base,
    name: "st_dfullywithin",
    member:
      "routine:$extension:postgis.st_dfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16] as const,
    result: nc15,
  });
  const member701 = createSqlFunction({
    ...base,
    name: "st_difference",
    member:
      "routine:$extension:postgis.st_difference($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, defaultSqlArgument(nc16, "gridsize")] as const,
    result: nc4,
  });
  const member702 = createSqlFunction({
    ...base,
    name: "st_dimension",
    member: "routine:$extension:postgis.st_dimension($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc19,
  });
  const member703 = createSqlFunction({
    ...base,
    name: "st_disjoint",
    member: "routine:$extension:postgis.st_disjoint($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member704 = createSqlFunction({
    ...base,
    name: "st_distance",
    member:
      "routine:$extension:postgis.st_distance($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)",
    arguments: [nc3, nc3, defaultSqlArgument(nc15, "use_spheroid")] as const,
    result: nc16,
  });
  const member705 = createSqlFunction({
    ...base,
    name: "st_distance",
    member: "routine:$extension:postgis.st_distance($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member706 = createSqlFunction({
    ...base,
    name: "st_distance",
    member: "routine:$extension:postgis.st_distance(pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14] as const,
    result: nc16,
  });
  const member707 = createSqlFunction({
    ...base,
    name: "st_distancecpa",
    member: "routine:$extension:postgis.st_distancecpa($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member708 = createSqlFunction({
    ...base,
    name: "st_distancesphere",
    member:
      "routine:$extension:postgis.st_distancesphere($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16] as const,
    result: nc16,
  });
  const member709 = createSqlFunction({
    ...base,
    name: "st_distancesphere",
    member: "routine:$extension:postgis.st_distancesphere($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member710 = createSqlFunction({
    ...base,
    name: "st_distancespheroid",
    member:
      "routine:$extension:postgis.st_distancespheroid($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.spheroid)",
    arguments: [nc4, nc4, nc6] as const,
    result: nc16,
  });
  const member711 = createSqlFunction({
    ...base,
    name: "st_distancespheroid",
    member: "routine:$extension:postgis.st_distancespheroid($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member712 = createSqlFunction({
    ...base,
    name: "st_dump",
    member: "routine:$extension:postgis.st_dump($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc40,
  });
  const member713 = createSqlFunction({
    ...base,
    name: "st_dumppoints",
    member: "routine:$extension:postgis.st_dumppoints($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc40,
  });
  const member714 = createSqlFunction({
    ...base,
    name: "st_dumprings",
    member: "routine:$extension:postgis.st_dumprings($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc40,
  });
  const member715 = createSqlFunction({
    ...base,
    name: "st_dumpsegments",
    member: "routine:$extension:postgis.st_dumpsegments($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc40,
  });
  const member716 = createSqlFunction({
    ...base,
    name: "st_dwithin",
    member:
      "routine:$extension:postgis.st_dwithin($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc3, nc3, nc16, defaultSqlArgument(nc15, "use_spheroid")] as const,
    result: nc15,
  });
  const member717 = createSqlFunction({
    ...base,
    name: "st_dwithin",
    member:
      "routine:$extension:postgis.st_dwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16] as const,
    result: nc15,
  });
  const member718 = createSqlFunction({
    ...base,
    name: "st_dwithin",
    member: "routine:$extension:postgis.st_dwithin(pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    arguments: [nc14, nc14, nc16] as const,
    result: nc15,
  });
  const member719 = createSqlFunction({
    ...base,
    name: "st_endpoint",
    member: "routine:$extension:postgis.st_endpoint($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member720 = createSqlFunction({
    ...base,
    name: "st_envelope",
    member: "routine:$extension:postgis.st_envelope($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member721 = createSqlFunction({
    ...base,
    name: "st_equals",
    member: "routine:$extension:postgis.st_equals($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member722 = createSqlFunction({
    ...base,
    name: "st_estimatedextent",
    member:
      "routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    arguments: [nc14, nc14, nc14, nc15] as const,
    result: nc0,
  });
  const member723 = createSqlFunction({
    ...base,
    name: "st_estimatedextent",
    member: "routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14, nc14] as const,
    result: nc0,
  });
  const member724 = createSqlFunction({
    ...base,
    name: "st_estimatedextent",
    member: "routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14] as const,
    result: nc0,
  });
  const member725 = createSqlFunction({
    ...base,
    name: "st_expand",
    member: "routine:$extension:postgis.st_expand($extension:postgis.box2d,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc0, nc16, nc16] as const,
    result: nc0,
  });
  const member726 = createSqlFunction({
    ...base,
    name: "st_expand",
    member: "routine:$extension:postgis.st_expand($extension:postgis.box2d,pg_catalog.float8)",
    arguments: [nc0, nc16] as const,
    result: nc0,
  });
  const member727 = createSqlFunction({
    ...base,
    name: "st_expand",
    member:
      "routine:$extension:postgis.st_expand($extension:postgis.box3d,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc2, nc16, nc16, defaultSqlArgument(nc16, "dz")] as const,
    result: nc2,
  });
  const member728 = createSqlFunction({
    ...base,
    name: "st_expand",
    member: "routine:$extension:postgis.st_expand($extension:postgis.box3d,pg_catalog.float8)",
    arguments: [nc2, nc16] as const,
    result: nc2,
  });
  const member729 = createSqlFunction({
    ...base,
    name: "st_expand",
    member:
      "routine:$extension:postgis.st_expand($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16, defaultSqlArgument(nc16, "dz"), defaultSqlArgument(nc16, "dm")] as const,
    result: nc4,
  });
  const member730 = createSqlFunction({
    ...base,
    name: "st_expand",
    member: "routine:$extension:postgis.st_expand($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc4,
  });
  const member731 = createSqlAggregate({
    ...base,
    name: "st_extent",
    member: "routine:$extension:postgis.st_extent($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc0,
  });
  const member732 = createSqlFunction({
    ...base,
    name: "st_exteriorring",
    member: "routine:$extension:postgis.st_exteriorring($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member733 = createSqlFunction({
    ...base,
    name: "st_filterbym",
    member:
      "routine:$extension:postgis.st_filterbym($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc4, nc16, defaultSqlArgument(nc16, undefined), defaultSqlArgument(nc15, undefined)] as const,
    result: nc4,
  });
  const member734 = createSqlFunction({
    ...base,
    name: "st_findextent",
    member: "routine:$extension:postgis.st_findextent(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14, nc14] as const,
    result: nc0,
  });
  const member735 = createSqlFunction({
    ...base,
    name: "st_findextent",
    member: "routine:$extension:postgis.st_findextent(pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14] as const,
    result: nc0,
  });
  const member736 = createSqlFunction({
    ...base,
    name: "st_flipcoordinates",
    member: "routine:$extension:postgis.st_flipcoordinates($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member737 = createSqlFunction({
    ...base,
    name: "st_force2d",
    member: "routine:$extension:postgis.st_force2d($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member738 = createSqlFunction({
    ...base,
    name: "st_force3d",
    member: "routine:$extension:postgis.st_force3d($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, defaultSqlArgument(nc16, "zvalue")] as const,
    result: nc4,
  });
  const member739 = createSqlFunction({
    ...base,
    name: "st_force3dm",
    member: "routine:$extension:postgis.st_force3dm($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, defaultSqlArgument(nc16, "mvalue")] as const,
    result: nc4,
  });
  const member740 = createSqlFunction({
    ...base,
    name: "st_force3dz",
    member: "routine:$extension:postgis.st_force3dz($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, defaultSqlArgument(nc16, "zvalue")] as const,
    result: nc4,
  });
  const member741 = createSqlFunction({
    ...base,
    name: "st_force4d",
    member: "routine:$extension:postgis.st_force4d($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, defaultSqlArgument(nc16, "zvalue"), defaultSqlArgument(nc16, "mvalue")] as const,
    result: nc4,
  });
  const member742 = createSqlFunction({
    ...base,
    name: "st_forcecollection",
    member: "routine:$extension:postgis.st_forcecollection($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member743 = createSqlFunction({
    ...base,
    name: "st_forcecurve",
    member: "routine:$extension:postgis.st_forcecurve($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member744 = createSqlFunction({
    ...base,
    name: "st_forcepolygonccw",
    member: "routine:$extension:postgis.st_forcepolygonccw($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member745 = createSqlFunction({
    ...base,
    name: "st_forcepolygoncw",
    member: "routine:$extension:postgis.st_forcepolygoncw($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member746 = createSqlFunction({
    ...base,
    name: "st_forcerhr",
    member: "routine:$extension:postgis.st_forcerhr($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member747 = createSqlFunction({
    ...base,
    name: "st_forcesfs",
    member: "routine:$extension:postgis.st_forcesfs($extension:postgis.geometry,pg_catalog.text)",
    arguments: [nc4, nc14] as const,
    result: nc4,
  });
  const member748 = createSqlFunction({
    ...base,
    name: "st_forcesfs",
    member: "routine:$extension:postgis.st_forcesfs($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member749 = createSqlFunction({
    ...base,
    name: "st_frechetdistance",
    member:
      "routine:$extension:postgis.st_frechetdistance($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, defaultSqlArgument(nc16, undefined)] as const,
    result: nc16,
  });
  const member750 = <Input, Output>(concrete: ExtensionCodec<Input, Output>) => {
    const call = createSqlFunction({
      ...base,
      name: "st_fromflatgeobuf",
      member: "routine:$extension:postgis.st_fromflatgeobuf(pg_catalog.anyelement,pg_catalog.bytea)",
      arguments: [nullableCodec(concrete), nc8] as const,
      result: nullableCodec(concrete),
    });
    return (...values: Parameters<typeof call>) =>
      call(values[0], postgisFlatGeobufBytes(values[1], "ST_FromFlatGeobuf"));
  };
  const member752 = createSqlFunction({
    ...base,
    name: "st_generatepoints",
    member: "routine:$extension:postgis.st_generatepoints($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
    arguments: [nc4, nc19, nc19] as const,
    result: nc4,
  });
  const member753 = createSqlFunction({
    ...base,
    name: "st_generatepoints",
    member: "routine:$extension:postgis.st_generatepoints($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc4,
  });
  const member754 = createSqlFunction({
    ...base,
    name: "st_geogfromtext",
    member: "routine:$extension:postgis.st_geogfromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc3,
  });
  const member755 = createSqlFunction({
    ...base,
    name: "st_geogfromwkb",
    member: "routine:$extension:postgis.st_geogfromwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc3,
  });
  const member756 = createSqlFunction({
    ...base,
    name: "st_geographyfromtext",
    member: "routine:$extension:postgis.st_geographyfromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc3,
  });
  const member757 = createSqlFunction({
    ...base,
    name: "st_geohash",
    member: "routine:$extension:postgis.st_geohash($extension:postgis.geography,pg_catalog.int4)",
    arguments: [nc3, defaultSqlArgument(nc19, "maxchars")] as const,
    result: nc14,
  });
  const member758 = createSqlFunction({
    ...base,
    name: "st_geohash",
    member: "routine:$extension:postgis.st_geohash($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, defaultSqlArgument(nc19, "maxchars")] as const,
    result: nc14,
  });
  const member759 = createSqlFunction({
    ...base,
    name: "st_geomcollfromtext",
    member: "routine:$extension:postgis.st_geomcollfromtext(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member760 = createSqlFunction({
    ...base,
    name: "st_geomcollfromtext",
    member: "routine:$extension:postgis.st_geomcollfromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member761 = createSqlFunction({
    ...base,
    name: "st_geomcollfromwkb",
    member: "routine:$extension:postgis.st_geomcollfromwkb(pg_catalog.bytea,pg_catalog.int4)",
    arguments: [nc8, nc19] as const,
    result: nc4,
  });
  const member762 = createSqlFunction({
    ...base,
    name: "st_geomcollfromwkb",
    member: "routine:$extension:postgis.st_geomcollfromwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member763 = createSqlFunction({
    ...base,
    name: "st_geometricmedian",
    member:
      "routine:$extension:postgis.st_geometricmedian($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
    arguments: [
      nc4,
      defaultSqlArgument(nc16, "tolerance"),
      defaultSqlArgument(nc19, "max_iter"),
      defaultSqlArgument(nc15, "fail_if_not_converged"),
    ] as const,
    result: nc4,
  });
  const member764 = createSqlFunction({
    ...base,
    name: "st_geometryfromtext",
    member: "routine:$extension:postgis.st_geometryfromtext(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member765 = createSqlFunction({
    ...base,
    name: "st_geometryfromtext",
    member: "routine:$extension:postgis.st_geometryfromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member766 = createSqlFunction({
    ...base,
    name: "st_geometryn",
    member: "routine:$extension:postgis.st_geometryn($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc4,
  });
  const member767 = createSqlFunction({
    ...base,
    name: "st_geometrytype",
    member: "routine:$extension:postgis.st_geometrytype($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc14,
  });
  const member768 = createSqlFunction({
    ...base,
    name: "st_geomfromewkb",
    member: "routine:$extension:postgis.st_geomfromewkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member769 = createSqlFunction({
    ...base,
    name: "st_geomfromewkt",
    member: "routine:$extension:postgis.st_geomfromewkt(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member770 = createSqlFunction({
    ...base,
    name: "st_geomfromgeohash",
    member: "routine:$extension:postgis.st_geomfromgeohash(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, defaultSqlArgument(nc19, undefined)] as const,
    result: nc4,
  });
  const member771 = createSqlFunction({
    ...base,
    name: "st_geomfromgeojson",
    member: "routine:$extension:postgis.st_geomfromgeojson(pg_catalog.json)",
    arguments: [nc9] as const,
    result: nc4,
  });
  const member772 = createSqlFunction({
    ...base,
    name: "st_geomfromgeojson",
    member: "routine:$extension:postgis.st_geomfromgeojson(pg_catalog.jsonb)",
    arguments: [nc10] as const,
    result: nc4,
  });
  const member773 = createSqlFunction({
    ...base,
    name: "st_geomfromgeojson",
    member: "routine:$extension:postgis.st_geomfromgeojson(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member774 = createSqlFunction({
    ...base,
    name: "st_geomfromgml",
    member: "routine:$extension:postgis.st_geomfromgml(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member775 = createSqlFunction({
    ...base,
    name: "st_geomfromgml",
    member: "routine:$extension:postgis.st_geomfromgml(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member776 = createSqlFunction({
    ...base,
    name: "st_geomfromkml",
    member: "routine:$extension:postgis.st_geomfromkml(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member777 = createSqlFunction({
    ...base,
    name: "st_geomfrommarc21",
    member: "routine:$extension:postgis.st_geomfrommarc21(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member778 = createSqlFunction({
    ...base,
    name: "st_geomfromtext",
    member: "routine:$extension:postgis.st_geomfromtext(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member779 = createSqlFunction({
    ...base,
    name: "st_geomfromtext",
    member: "routine:$extension:postgis.st_geomfromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member780 = createSqlFunction({
    ...base,
    name: "st_geomfromtwkb",
    member: "routine:$extension:postgis.st_geomfromtwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member781 = createSqlFunction({
    ...base,
    name: "st_geomfromwkb",
    member: "routine:$extension:postgis.st_geomfromwkb(pg_catalog.bytea,pg_catalog.int4)",
    arguments: [nc8, nc19] as const,
    result: nc4,
  });
  const member782 = createSqlFunction({
    ...base,
    name: "st_geomfromwkb",
    member: "routine:$extension:postgis.st_geomfromwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member783 = createSqlFunction({
    ...base,
    name: "st_gmltosql",
    member: "routine:$extension:postgis.st_gmltosql(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member784 = createSqlFunction({
    ...base,
    name: "st_gmltosql",
    member: "routine:$extension:postgis.st_gmltosql(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member785 = createSqlFunction({
    ...base,
    name: "st_hasarc",
    member: "routine:$extension:postgis.st_hasarc($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc15,
  });
  const member786 = createSqlFunction({
    ...base,
    name: "st_hasm",
    member: "routine:$extension:postgis.st_hasm($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc15,
  });
  const member787 = createSqlFunction({
    ...base,
    name: "st_hasz",
    member: "routine:$extension:postgis.st_hasz($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc15,
  });
  const member788 = createSqlFunction({
    ...base,
    name: "st_hausdorffdistance",
    member:
      "routine:$extension:postgis.st_hausdorffdistance($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16] as const,
    result: nc16,
  });
  const member789 = createSqlFunction({
    ...base,
    name: "st_hausdorffdistance",
    member: "routine:$extension:postgis.st_hausdorffdistance($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member790 = createSqlFunction({
    ...base,
    name: "st_hexagon",
    member:
      "routine:$extension:postgis.st_hexagon(pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry)",
    arguments: [nc16, nc19, nc19, defaultSqlArgument(nc4, "origin")] as const,
    result: nc4,
  });
  const rowFields791 = { geom: nc4, i: nc19, j: nc19 } as const;
  const member791 = createSqlFunction({
    ...base,
    name: "st_hexagongrid",
    member: "routine:$extension:postgis.st_hexagongrid(pg_catalog.float8,$extension:postgis.geometry)",
    arguments: [nc16, nc4] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis.st_hexagongrid(pg_catalog.float8,$extension:postgis.geometry)",
        rowFields791,
      ),
    ),
  });
  const rows791 = (alias: string, ...values: Parameters<typeof member791>) =>
    extensionRows(member791(...values), alias, rowFields791, "named");
  const member792 = createSqlFunction({
    ...base,
    name: "st_interiorringn",
    member: "routine:$extension:postgis.st_interiorringn($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc4,
  });
  const member793 = createSqlFunction({
    ...base,
    name: "st_interpolatepoint",
    member: "routine:$extension:postgis.st_interpolatepoint($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member794 = createSqlFunction({
    ...base,
    name: "st_intersection",
    member: "routine:$extension:postgis.st_intersection($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc3,
  });
  const member795 = createSqlFunction({
    ...base,
    name: "st_intersection",
    member:
      "routine:$extension:postgis.st_intersection($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, defaultSqlArgument(nc16, "gridsize")] as const,
    result: nc4,
  });
  const member796 = createSqlFunction({
    ...base,
    name: "st_intersection",
    member: "routine:$extension:postgis.st_intersection(pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14] as const,
    result: nc4,
  });
  const member797 = createSqlFunction({
    ...base,
    name: "st_intersects",
    member: "routine:$extension:postgis.st_intersects($extension:postgis.geography,$extension:postgis.geography)",
    arguments: [nc3, nc3] as const,
    result: nc15,
  });
  const member798 = createSqlFunction({
    ...base,
    name: "st_intersects",
    member: "routine:$extension:postgis.st_intersects($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member799 = createSqlFunction({
    ...base,
    name: "st_intersects",
    member: "routine:$extension:postgis.st_intersects(pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14] as const,
    result: nc15,
  });
  const member800 = createSqlFunction({
    ...base,
    name: "st_inversetransformpipeline",
    member:
      "routine:$extension:postgis.st_inversetransformpipeline($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)",
    arguments: [nc4, nc14, defaultSqlArgument(nc19, "to_srid")] as const,
    result: nc4,
  });
  const member801 = createSqlFunction({
    ...base,
    name: "st_isclosed",
    member: "routine:$extension:postgis.st_isclosed($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc15,
  });
  const member802 = createSqlFunction({
    ...base,
    name: "st_iscollection",
    member: "routine:$extension:postgis.st_iscollection($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc15,
  });
  const member803 = createSqlFunction({
    ...base,
    name: "st_isempty",
    member: "routine:$extension:postgis.st_isempty($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc15,
  });
  const member804 = createSqlFunction({
    ...base,
    name: "st_ispolygonccw",
    member: "routine:$extension:postgis.st_ispolygonccw($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc15,
  });
  const member805 = createSqlFunction({
    ...base,
    name: "st_ispolygoncw",
    member: "routine:$extension:postgis.st_ispolygoncw($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc15,
  });
  const member806 = createSqlFunction({
    ...base,
    name: "st_isring",
    member: "routine:$extension:postgis.st_isring($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc15,
  });
  const member807 = createSqlFunction({
    ...base,
    name: "st_issimple",
    member: "routine:$extension:postgis.st_issimple($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc15,
  });
  const member808 = createSqlFunction({
    ...base,
    name: "st_isvalid",
    member: "routine:$extension:postgis.st_isvalid($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc15,
  });
  const member809 = createSqlFunction({
    ...base,
    name: "st_isvalid",
    member: "routine:$extension:postgis.st_isvalid($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc15,
  });
  const member810 = createSqlFunction({
    ...base,
    name: "st_isvaliddetail",
    member: "routine:$extension:postgis.st_isvaliddetail($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, defaultSqlArgument(nc19, "flags")] as const,
    result: nc42,
  });
  const member811 = createSqlFunction({
    ...base,
    name: "st_isvalidreason",
    member: "routine:$extension:postgis.st_isvalidreason($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc14,
  });
  const member812 = createSqlFunction({
    ...base,
    name: "st_isvalidreason",
    member: "routine:$extension:postgis.st_isvalidreason($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc14,
  });
  const member813 = createSqlFunction({
    ...base,
    name: "st_isvalidtrajectory",
    member: "routine:$extension:postgis.st_isvalidtrajectory($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc15,
  });
  const rowFields814 = { center: nc4, nearest: nc4, radius: nc16 } as const;
  const member814 = createSqlFunction({
    ...base,
    name: "st_largestemptycircle",
    member:
      "routine:$extension:postgis.st_largestemptycircle($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)",
    arguments: [nc4, defaultSqlArgument(nc16, "tolerance"), defaultSqlArgument(nc4, "boundary")] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis.st_largestemptycircle($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)",
        rowFields814,
      ),
    ),
  });
  const member815 = createSqlFunction({
    ...base,
    name: "st_length",
    member: "routine:$extension:postgis.st_length($extension:postgis.geography,pg_catalog.bool)",
    arguments: [nc3, defaultSqlArgument(nc15, "use_spheroid")] as const,
    result: nc16,
  });
  const member816 = createSqlFunction({
    ...base,
    name: "st_length",
    member: "routine:$extension:postgis.st_length($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc16,
  });
  const member817 = createSqlFunction({
    ...base,
    name: "st_length",
    member: "routine:$extension:postgis.st_length(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc16,
  });
  const member818 = createSqlFunction({
    ...base,
    name: "st_length2d",
    member: "routine:$extension:postgis.st_length2d($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc16,
  });
  const member819 = createSqlFunction({
    ...base,
    name: "st_length2dspheroid",
    member: "routine:$extension:postgis.st_length2dspheroid($extension:postgis.geometry,$extension:postgis.spheroid)",
    arguments: [nc4, nc6] as const,
    result: nc16,
  });
  const member820 = createSqlFunction({
    ...base,
    name: "st_lengthspheroid",
    member: "routine:$extension:postgis.st_lengthspheroid($extension:postgis.geometry,$extension:postgis.spheroid)",
    arguments: [nc4, nc6] as const,
    result: nc16,
  });
  const member821 = createSqlFunction({
    ...base,
    name: "st_letters",
    member: "routine:$extension:postgis.st_letters(pg_catalog.text,pg_catalog.json)",
    arguments: [nc14, defaultSqlArgument(nc9, "font")] as const,
    result: nc4,
  });
  const member822 = createSqlFunction({
    ...base,
    name: "st_linecrossingdirection",
    member:
      "routine:$extension:postgis.st_linecrossingdirection($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc19,
  });
  const member823 = createSqlFunction({
    ...base,
    name: "st_lineextend",
    member: "routine:$extension:postgis.st_lineextend($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, defaultSqlArgument(nc16, "distance_backward")] as const,
    result: nc4,
  });
  const member824 = createSqlFunction({
    ...base,
    name: "st_linefromencodedpolyline",
    member: "routine:$extension:postgis.st_linefromencodedpolyline(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, defaultSqlArgument(nc19, "nprecision")] as const,
    result: nc4,
  });
  const member825 = createSqlFunction({
    ...base,
    name: "st_linefrommultipoint",
    member: "routine:$extension:postgis.st_linefrommultipoint($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member826 = createSqlFunction({
    ...base,
    name: "st_linefromtext",
    member: "routine:$extension:postgis.st_linefromtext(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member827 = createSqlFunction({
    ...base,
    name: "st_linefromtext",
    member: "routine:$extension:postgis.st_linefromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member828 = createSqlFunction({
    ...base,
    name: "st_linefromwkb",
    member: "routine:$extension:postgis.st_linefromwkb(pg_catalog.bytea,pg_catalog.int4)",
    arguments: [nc8, nc19] as const,
    result: nc4,
  });
  const member829 = createSqlFunction({
    ...base,
    name: "st_linefromwkb",
    member: "routine:$extension:postgis.st_linefromwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member830 = createSqlFunction({
    ...base,
    name: "st_lineinterpolatepoint",
    member:
      "routine:$extension:postgis.st_lineinterpolatepoint($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc3, nc16, defaultSqlArgument(nc15, "use_spheroid")] as const,
    result: nc3,
  });
  const member831 = createSqlFunction({
    ...base,
    name: "st_lineinterpolatepoint",
    member: "routine:$extension:postgis.st_lineinterpolatepoint($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc4,
  });
  const member832 = createSqlFunction({
    ...base,
    name: "st_lineinterpolatepoint",
    member: "routine:$extension:postgis.st_lineinterpolatepoint(pg_catalog.text,pg_catalog.float8)",
    arguments: [nc14, nc16] as const,
    result: nc4,
  });
  const member833 = createSqlFunction({
    ...base,
    name: "st_lineinterpolatepoints",
    member:
      "routine:$extension:postgis.st_lineinterpolatepoints($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)",
    arguments: [nc3, nc16, defaultSqlArgument(nc15, "use_spheroid"), defaultSqlArgument(nc15, "repeat")] as const,
    result: nc3,
  });
  const member834 = createSqlFunction({
    ...base,
    name: "st_lineinterpolatepoints",
    member:
      "routine:$extension:postgis.st_lineinterpolatepoints($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc4, nc16, defaultSqlArgument(nc15, "repeat")] as const,
    result: nc4,
  });
  const member835 = createSqlFunction({
    ...base,
    name: "st_lineinterpolatepoints",
    member: "routine:$extension:postgis.st_lineinterpolatepoints(pg_catalog.text,pg_catalog.float8)",
    arguments: [nc14, nc16] as const,
    result: nc4,
  });
  const member836 = createSqlFunction({
    ...base,
    name: "st_linelocatepoint",
    member:
      "routine:$extension:postgis.st_linelocatepoint($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)",
    arguments: [nc3, nc3, defaultSqlArgument(nc15, "use_spheroid")] as const,
    result: nc16,
  });
  const member837 = createSqlFunction({
    ...base,
    name: "st_linelocatepoint",
    member: "routine:$extension:postgis.st_linelocatepoint($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const member838 = createSqlFunction({
    ...base,
    name: "st_linelocatepoint",
    member: "routine:$extension:postgis.st_linelocatepoint(pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14] as const,
    result: nc16,
  });
  const member839 = createSqlFunction({
    ...base,
    name: "st_linemerge",
    member: "routine:$extension:postgis.st_linemerge($extension:postgis.geometry,pg_catalog.bool)",
    arguments: [nc4, nc15] as const,
    result: nc4,
  });
  const member840 = createSqlFunction({
    ...base,
    name: "st_linemerge",
    member: "routine:$extension:postgis.st_linemerge($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member841 = createSqlFunction({
    ...base,
    name: "st_linestringfromwkb",
    member: "routine:$extension:postgis.st_linestringfromwkb(pg_catalog.bytea,pg_catalog.int4)",
    arguments: [nc8, nc19] as const,
    result: nc4,
  });
  const member842 = createSqlFunction({
    ...base,
    name: "st_linestringfromwkb",
    member: "routine:$extension:postgis.st_linestringfromwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member843 = createSqlFunction({
    ...base,
    name: "st_linesubstring",
    member:
      "routine:$extension:postgis.st_linesubstring($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc3, nc16, nc16] as const,
    result: nc3,
  });
  const member844 = createSqlFunction({
    ...base,
    name: "st_linesubstring",
    member:
      "routine:$extension:postgis.st_linesubstring($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16] as const,
    result: nc4,
  });
  const member845 = createSqlFunction({
    ...base,
    name: "st_linesubstring",
    member: "routine:$extension:postgis.st_linesubstring(pg_catalog.text,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc14, nc16, nc16] as const,
    result: nc4,
  });
  const member846 = createSqlFunction({
    ...base,
    name: "st_linetocurve",
    member: "routine:$extension:postgis.st_linetocurve($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member847 = createSqlFunction({
    ...base,
    name: "st_locatealong",
    member:
      "routine:$extension:postgis.st_locatealong($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, defaultSqlArgument(nc16, "leftrightoffset")] as const,
    result: nc4,
  });
  const member848 = createSqlFunction({
    ...base,
    name: "st_locatebetween",
    member:
      "routine:$extension:postgis.st_locatebetween($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16, defaultSqlArgument(nc16, "leftrightoffset")] as const,
    result: nc4,
  });
  const member849 = createSqlFunction({
    ...base,
    name: "st_locatebetweenelevations",
    member:
      "routine:$extension:postgis.st_locatebetweenelevations($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16] as const,
    result: nc4,
  });
  const member850 = createSqlFunction({
    ...base,
    name: "st_longestline",
    member: "routine:$extension:postgis.st_longestline($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member851 = createSqlFunction({
    ...base,
    name: "st_m",
    member: "routine:$extension:postgis.st_m($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc16,
  });
  const member852 = createSqlFunction({
    ...base,
    name: "st_makebox2d",
    member: "routine:$extension:postgis.st_makebox2d($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc0,
  });
  const member853 = createSqlFunction({
    ...base,
    name: "st_makeenvelope",
    member:
      "routine:$extension:postgis.st_makeenvelope(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)",
    arguments: [nc16, nc16, nc16, nc16, defaultSqlArgument(nc19, undefined)] as const,
    result: nc4,
  });
  const member854 = createSqlFunction({
    ...base,
    name: "st_makeline",
    member: "routine:$extension:postgis.st_makeline($extension:postgis._geometry)",
    arguments: [nc35] as const,
    result: nc4,
  });
  const member855 = createSqlFunction({
    ...base,
    name: "st_makeline",
    member: "routine:$extension:postgis.st_makeline($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member856 = createSqlAggregate({
    ...base,
    name: "st_makeline",
    member: "routine:$extension:postgis.st_makeline($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member857 = createSqlFunction({
    ...base,
    name: "st_makepoint",
    member:
      "routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc16, nc16, nc16, nc16] as const,
    result: nc4,
  });
  const member858 = createSqlFunction({
    ...base,
    name: "st_makepoint",
    member: "routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc16, nc16, nc16] as const,
    result: nc4,
  });
  const member859 = createSqlFunction({
    ...base,
    name: "st_makepoint",
    member: "routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc16, nc16] as const,
    result: nc4,
  });
  const member860 = createSqlFunction({
    ...base,
    name: "st_makepointm",
    member: "routine:$extension:postgis.st_makepointm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc16, nc16, nc16] as const,
    result: nc4,
  });
  const member861 = createSqlFunction({
    ...base,
    name: "st_makepolygon",
    member: "routine:$extension:postgis.st_makepolygon($extension:postgis.geometry,$extension:postgis._geometry)",
    arguments: [nc4, nc35] as const,
    result: nc4,
  });
  const member862 = createSqlFunction({
    ...base,
    name: "st_makepolygon",
    member: "routine:$extension:postgis.st_makepolygon($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member863 = createSqlFunction({
    ...base,
    name: "st_makevalid",
    member: "routine:$extension:postgis.st_makevalid($extension:postgis.geometry,pg_catalog.text)",
    arguments: [nc4, nc14] as const,
    result: nc4,
  });
  const member864 = createSqlFunction({
    ...base,
    name: "st_makevalid",
    member: "routine:$extension:postgis.st_makevalid($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member865 = createSqlFunction({
    ...base,
    name: "st_maxdistance",
    member: "routine:$extension:postgis.st_maxdistance($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc16,
  });
  const rowFields866 = { center: nc4, nearest: nc4, radius: nc16 } as const;
  const member866 = createSqlFunction({
    ...base,
    name: "st_maximuminscribedcircle",
    member: "routine:$extension:postgis.st_maximuminscribedcircle($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nullableCodec(
      compositeCodec("routine:$extension:postgis.st_maximuminscribedcircle($extension:postgis.geometry)", rowFields866),
    ),
  });
  const member867 = createSqlAggregate({
    ...base,
    name: "st_memcollect",
    member: "routine:$extension:postgis.st_memcollect($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member868 = createSqlFunction({
    ...base,
    name: "st_memsize",
    member: "routine:$extension:postgis.st_memsize($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc19,
  });
  const member869 = createSqlAggregate({
    ...base,
    name: "st_memunion",
    member: "routine:$extension:postgis.st_memunion($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member870 = createSqlFunction({
    ...base,
    name: "st_minimumboundingcircle",
    member: "routine:$extension:postgis.st_minimumboundingcircle($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, defaultSqlArgument(nc19, "segs_per_quarter")] as const,
    result: nc4,
  });
  const rowFields871 = { center: nc4, radius: nc16 } as const;
  const member871 = createSqlFunction({
    ...base,
    name: "st_minimumboundingradius",
    member: "routine:$extension:postgis.st_minimumboundingradius($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nullableCodec(
      compositeCodec("routine:$extension:postgis.st_minimumboundingradius($extension:postgis.geometry)", rowFields871),
    ),
  });
  const member872 = createSqlFunction({
    ...base,
    name: "st_minimumclearance",
    member: "routine:$extension:postgis.st_minimumclearance($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc16,
  });
  const member873 = createSqlFunction({
    ...base,
    name: "st_minimumclearanceline",
    member: "routine:$extension:postgis.st_minimumclearanceline($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member874 = createSqlFunction({
    ...base,
    name: "st_mlinefromtext",
    member: "routine:$extension:postgis.st_mlinefromtext(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member875 = createSqlFunction({
    ...base,
    name: "st_mlinefromtext",
    member: "routine:$extension:postgis.st_mlinefromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member876 = createSqlFunction({
    ...base,
    name: "st_mlinefromwkb",
    member: "routine:$extension:postgis.st_mlinefromwkb(pg_catalog.bytea,pg_catalog.int4)",
    arguments: [nc8, nc19] as const,
    result: nc4,
  });
  const member877 = createSqlFunction({
    ...base,
    name: "st_mlinefromwkb",
    member: "routine:$extension:postgis.st_mlinefromwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member878 = createSqlFunction({
    ...base,
    name: "st_mpointfromtext",
    member: "routine:$extension:postgis.st_mpointfromtext(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member879 = createSqlFunction({
    ...base,
    name: "st_mpointfromtext",
    member: "routine:$extension:postgis.st_mpointfromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member880 = createSqlFunction({
    ...base,
    name: "st_mpointfromwkb",
    member: "routine:$extension:postgis.st_mpointfromwkb(pg_catalog.bytea,pg_catalog.int4)",
    arguments: [nc8, nc19] as const,
    result: nc4,
  });
  const member881 = createSqlFunction({
    ...base,
    name: "st_mpointfromwkb",
    member: "routine:$extension:postgis.st_mpointfromwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member882 = createSqlFunction({
    ...base,
    name: "st_mpolyfromtext",
    member: "routine:$extension:postgis.st_mpolyfromtext(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member883 = createSqlFunction({
    ...base,
    name: "st_mpolyfromtext",
    member: "routine:$extension:postgis.st_mpolyfromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member884 = createSqlFunction({
    ...base,
    name: "st_mpolyfromwkb",
    member: "routine:$extension:postgis.st_mpolyfromwkb(pg_catalog.bytea,pg_catalog.int4)",
    arguments: [nc8, nc19] as const,
    result: nc4,
  });
  const member885 = createSqlFunction({
    ...base,
    name: "st_mpolyfromwkb",
    member: "routine:$extension:postgis.st_mpolyfromwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member886 = createSqlFunction({
    ...base,
    name: "st_multi",
    member: "routine:$extension:postgis.st_multi($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member887 = createSqlFunction({
    ...base,
    name: "st_multilinefromwkb",
    member: "routine:$extension:postgis.st_multilinefromwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member888 = createSqlFunction({
    ...base,
    name: "st_multilinestringfromtext",
    member: "routine:$extension:postgis.st_multilinestringfromtext(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member889 = createSqlFunction({
    ...base,
    name: "st_multilinestringfromtext",
    member: "routine:$extension:postgis.st_multilinestringfromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member890 = createSqlFunction({
    ...base,
    name: "st_multipointfromtext",
    member: "routine:$extension:postgis.st_multipointfromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member891 = createSqlFunction({
    ...base,
    name: "st_multipointfromwkb",
    member: "routine:$extension:postgis.st_multipointfromwkb(pg_catalog.bytea,pg_catalog.int4)",
    arguments: [nc8, nc19] as const,
    result: nc4,
  });
  const member892 = createSqlFunction({
    ...base,
    name: "st_multipointfromwkb",
    member: "routine:$extension:postgis.st_multipointfromwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member893 = createSqlFunction({
    ...base,
    name: "st_multipolyfromwkb",
    member: "routine:$extension:postgis.st_multipolyfromwkb(pg_catalog.bytea,pg_catalog.int4)",
    arguments: [nc8, nc19] as const,
    result: nc4,
  });
  const member894 = createSqlFunction({
    ...base,
    name: "st_multipolyfromwkb",
    member: "routine:$extension:postgis.st_multipolyfromwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member895 = createSqlFunction({
    ...base,
    name: "st_multipolygonfromtext",
    member: "routine:$extension:postgis.st_multipolygonfromtext(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member896 = createSqlFunction({
    ...base,
    name: "st_multipolygonfromtext",
    member: "routine:$extension:postgis.st_multipolygonfromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member897 = createSqlFunction({
    ...base,
    name: "st_ndims",
    member: "routine:$extension:postgis.st_ndims($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc25,
  });
  const member898 = createSqlFunction({
    ...base,
    name: "st_node",
    member: "routine:$extension:postgis.st_node($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member899 = createSqlFunction({
    ...base,
    name: "st_normalize",
    member: "routine:$extension:postgis.st_normalize($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member900 = createSqlFunction({
    ...base,
    name: "st_npoints",
    member: "routine:$extension:postgis.st_npoints($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc19,
  });
  const member901 = createSqlFunction({
    ...base,
    name: "st_nrings",
    member: "routine:$extension:postgis.st_nrings($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc19,
  });
  const member902 = createSqlFunction({
    ...base,
    name: "st_numcurves",
    member: "routine:$extension:postgis.st_numcurves($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc19,
  });
  const member903 = createSqlFunction({
    ...base,
    name: "st_numgeometries",
    member: "routine:$extension:postgis.st_numgeometries($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc19,
  });
  const member904 = createSqlFunction({
    ...base,
    name: "st_numinteriorring",
    member: "routine:$extension:postgis.st_numinteriorring($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc19,
  });
  const member905 = createSqlFunction({
    ...base,
    name: "st_numinteriorrings",
    member: "routine:$extension:postgis.st_numinteriorrings($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc19,
  });
  const member906 = createSqlFunction({
    ...base,
    name: "st_numpatches",
    member: "routine:$extension:postgis.st_numpatches($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc19,
  });
  const member907 = createSqlFunction({
    ...base,
    name: "st_numpoints",
    member: "routine:$extension:postgis.st_numpoints($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc19,
  });
  const member908 = createSqlFunction({
    ...base,
    name: "st_offsetcurve",
    member: "routine:$extension:postgis.st_offsetcurve($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text)",
    arguments: [nc4, nc16, defaultSqlArgument(nc14, "params")] as const,
    result: nc4,
  });
  const member909 = createSqlFunction({
    ...base,
    name: "st_orderingequals",
    member: "routine:$extension:postgis.st_orderingequals($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member910 = createSqlFunction({
    ...base,
    name: "st_orientedenvelope",
    member: "routine:$extension:postgis.st_orientedenvelope($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member911 = createSqlFunction({
    ...base,
    name: "st_overlaps",
    member: "routine:$extension:postgis.st_overlaps($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member912 = createSqlFunction({
    ...base,
    name: "st_patchn",
    member: "routine:$extension:postgis.st_patchn($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc4,
  });
  const member913 = createSqlFunction({
    ...base,
    name: "st_perimeter",
    member: "routine:$extension:postgis.st_perimeter($extension:postgis.geography,pg_catalog.bool)",
    arguments: [nc3, defaultSqlArgument(nc15, "use_spheroid")] as const,
    result: nc16,
  });
  const member914 = createSqlFunction({
    ...base,
    name: "st_perimeter",
    member: "routine:$extension:postgis.st_perimeter($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc16,
  });
  const member915 = createSqlFunction({
    ...base,
    name: "st_perimeter2d",
    member: "routine:$extension:postgis.st_perimeter2d($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc16,
  });
  const member916 = createSqlFunction({
    ...base,
    name: "st_point",
    member: "routine:$extension:postgis.st_point(pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)",
    arguments: [nc16, nc16, nc19] as const,
    result: nc4,
  });
  const member917 = createSqlFunction({
    ...base,
    name: "st_point",
    member: "routine:$extension:postgis.st_point(pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc16, nc16] as const,
    result: nc4,
  });
  const member918 = createSqlFunction({
    ...base,
    name: "st_pointfromgeohash",
    member: "routine:$extension:postgis.st_pointfromgeohash(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, defaultSqlArgument(nc19, undefined)] as const,
    result: nc4,
  });
  const member919 = createSqlFunction({
    ...base,
    name: "st_pointfromtext",
    member: "routine:$extension:postgis.st_pointfromtext(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member920 = createSqlFunction({
    ...base,
    name: "st_pointfromtext",
    member: "routine:$extension:postgis.st_pointfromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member921 = createSqlFunction({
    ...base,
    name: "st_pointfromwkb",
    member: "routine:$extension:postgis.st_pointfromwkb(pg_catalog.bytea,pg_catalog.int4)",
    arguments: [nc8, nc19] as const,
    result: nc4,
  });
  const member922 = createSqlFunction({
    ...base,
    name: "st_pointfromwkb",
    member: "routine:$extension:postgis.st_pointfromwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member923 = createSqlFunction({
    ...base,
    name: "st_pointinsidecircle",
    member:
      "routine:$extension:postgis.st_pointinsidecircle($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16, nc16] as const,
    result: nc15,
  });
  const member924 = createSqlFunction({
    ...base,
    name: "st_pointm",
    member:
      "routine:$extension:postgis.st_pointm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)",
    arguments: [nc16, nc16, nc16, defaultSqlArgument(nc19, "srid")] as const,
    result: nc4,
  });
  const member925 = createSqlFunction({
    ...base,
    name: "st_pointn",
    member: "routine:$extension:postgis.st_pointn($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc4,
  });
  const member926 = createSqlFunction({
    ...base,
    name: "st_pointonsurface",
    member: "routine:$extension:postgis.st_pointonsurface($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member927 = createSqlFunction({
    ...base,
    name: "st_points",
    member: "routine:$extension:postgis.st_points($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member928 = createSqlFunction({
    ...base,
    name: "st_pointz",
    member:
      "routine:$extension:postgis.st_pointz(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)",
    arguments: [nc16, nc16, nc16, defaultSqlArgument(nc19, "srid")] as const,
    result: nc4,
  });
  const member929 = createSqlFunction({
    ...base,
    name: "st_pointzm",
    member:
      "routine:$extension:postgis.st_pointzm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)",
    arguments: [nc16, nc16, nc16, nc16, defaultSqlArgument(nc19, "srid")] as const,
    result: nc4,
  });
  const member930 = createSqlFunction({
    ...base,
    name: "st_polyfromtext",
    member: "routine:$extension:postgis.st_polyfromtext(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member931 = createSqlFunction({
    ...base,
    name: "st_polyfromtext",
    member: "routine:$extension:postgis.st_polyfromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member932 = createSqlFunction({
    ...base,
    name: "st_polyfromwkb",
    member: "routine:$extension:postgis.st_polyfromwkb(pg_catalog.bytea,pg_catalog.int4)",
    arguments: [nc8, nc19] as const,
    result: nc4,
  });
  const member933 = createSqlFunction({
    ...base,
    name: "st_polyfromwkb",
    member: "routine:$extension:postgis.st_polyfromwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member934 = createSqlFunction({
    ...base,
    name: "st_polygon",
    member: "routine:$extension:postgis.st_polygon($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc4,
  });
  const member935 = createSqlFunction({
    ...base,
    name: "st_polygonfromtext",
    member: "routine:$extension:postgis.st_polygonfromtext(pg_catalog.text,pg_catalog.int4)",
    arguments: [nc14, nc19] as const,
    result: nc4,
  });
  const member936 = createSqlFunction({
    ...base,
    name: "st_polygonfromtext",
    member: "routine:$extension:postgis.st_polygonfromtext(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member937 = createSqlFunction({
    ...base,
    name: "st_polygonfromwkb",
    member: "routine:$extension:postgis.st_polygonfromwkb(pg_catalog.bytea,pg_catalog.int4)",
    arguments: [nc8, nc19] as const,
    result: nc4,
  });
  const member938 = createSqlFunction({
    ...base,
    name: "st_polygonfromwkb",
    member: "routine:$extension:postgis.st_polygonfromwkb(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member939 = createSqlFunction({
    ...base,
    name: "st_polygonize",
    member: "routine:$extension:postgis.st_polygonize($extension:postgis._geometry)",
    arguments: [nc35] as const,
    result: nc4,
  });
  const member940 = createSqlAggregate({
    ...base,
    name: "st_polygonize",
    member: "routine:$extension:postgis.st_polygonize($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member941 = createSqlFunction({
    ...base,
    name: "st_project",
    member:
      "routine:$extension:postgis.st_project($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)",
    arguments: [nc3, nc3, nc16] as const,
    result: nc3,
  });
  const member942 = createSqlFunction({
    ...base,
    name: "st_project",
    member: "routine:$extension:postgis.st_project($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc3, nc16, nc16] as const,
    result: nc3,
  });
  const member943 = createSqlFunction({
    ...base,
    name: "st_project",
    member:
      "routine:$extension:postgis.st_project($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16] as const,
    result: nc4,
  });
  const member944 = createSqlFunction({
    ...base,
    name: "st_project",
    member: "routine:$extension:postgis.st_project($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16] as const,
    result: nc4,
  });
  const member945 = createSqlFunction({
    ...base,
    name: "st_quantizecoordinates",
    member:
      "routine:$extension:postgis.st_quantizecoordinates($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)",
    arguments: [
      nc4,
      nc19,
      defaultSqlArgument(nc19, "prec_y"),
      defaultSqlArgument(nc19, "prec_z"),
      defaultSqlArgument(nc19, "prec_m"),
    ] as const,
    result: nc4,
  });
  const member946 = createSqlFunction({
    ...base,
    name: "st_reduceprecision",
    member: "routine:$extension:postgis.st_reduceprecision($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc4,
  });
  const member947 = createSqlFunction({
    ...base,
    name: "st_relate",
    member:
      "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc4, nc19] as const,
    result: nc14,
  });
  const member948 = createSqlFunction({
    ...base,
    name: "st_relate",
    member:
      "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.text)",
    arguments: [nc4, nc4, nc14] as const,
    result: nc15,
  });
  const member949 = createSqlFunction({
    ...base,
    name: "st_relate",
    member: "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc14,
  });
  const member950 = createSqlFunction({
    ...base,
    name: "st_relatematch",
    member: "routine:$extension:postgis.st_relatematch(pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14] as const,
    result: nc15,
  });
  const member951 = createSqlFunction({
    ...base,
    name: "st_removeirrelevantpointsforview",
    member:
      "routine:$extension:postgis.st_removeirrelevantpointsforview($extension:postgis.geometry,$extension:postgis.box2d,pg_catalog.bool)",
    arguments: [nc4, nc0, defaultSqlArgument(nc15, undefined)] as const,
    result: nc4,
  });
  const member952 = createSqlFunction({
    ...base,
    name: "st_removepoint",
    member: "routine:$extension:postgis.st_removepoint($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc4,
  });
  const member953 = createSqlFunction({
    ...base,
    name: "st_removerepeatedpoints",
    member: "routine:$extension:postgis.st_removerepeatedpoints($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, defaultSqlArgument(nc16, "tolerance")] as const,
    result: nc4,
  });
  const member954 = createSqlFunction({
    ...base,
    name: "st_removesmallparts",
    member:
      "routine:$extension:postgis.st_removesmallparts($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16] as const,
    result: nc4,
  });
  const member955 = createSqlFunction({
    ...base,
    name: "st_reverse",
    member: "routine:$extension:postgis.st_reverse($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member956 = createSqlFunction({
    ...base,
    name: "st_rotate",
    member:
      "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)",
    arguments: [nc4, nc16, nc4] as const,
    result: nc4,
  });
  const member957 = createSqlFunction({
    ...base,
    name: "st_rotate",
    member:
      "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16, nc16] as const,
    result: nc4,
  });
  const member958 = createSqlFunction({
    ...base,
    name: "st_rotate",
    member: "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc4,
  });
  const member959 = createSqlFunction({
    ...base,
    name: "st_rotatex",
    member: "routine:$extension:postgis.st_rotatex($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc4,
  });
  const member960 = createSqlFunction({
    ...base,
    name: "st_rotatey",
    member: "routine:$extension:postgis.st_rotatey($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc4,
  });
  const member961 = createSqlFunction({
    ...base,
    name: "st_rotatez",
    member: "routine:$extension:postgis.st_rotatez($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc4,
  });
  const member962 = createSqlFunction({
    ...base,
    name: "st_scale",
    member:
      "routine:$extension:postgis.st_scale($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4, nc4] as const,
    result: nc4,
  });
  const member963 = createSqlFunction({
    ...base,
    name: "st_scale",
    member: "routine:$extension:postgis.st_scale($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member964 = createSqlFunction({
    ...base,
    name: "st_scale",
    member:
      "routine:$extension:postgis.st_scale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16, nc16] as const,
    result: nc4,
  });
  const member965 = createSqlFunction({
    ...base,
    name: "st_scale",
    member: "routine:$extension:postgis.st_scale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16] as const,
    result: nc4,
  });
  const member966 = createSqlFunction({
    ...base,
    name: "st_scroll",
    member: "routine:$extension:postgis.st_scroll($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member967 = createSqlFunction({
    ...base,
    name: "st_segmentize",
    member: "routine:$extension:postgis.st_segmentize($extension:postgis.geography,pg_catalog.float8)",
    arguments: [nc3, nc16] as const,
    result: nc3,
  });
  const member968 = createSqlFunction({
    ...base,
    name: "st_segmentize",
    member: "routine:$extension:postgis.st_segmentize($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc4,
  });
  const member969 = createSqlFunction({
    ...base,
    name: "st_seteffectivearea",
    member:
      "routine:$extension:postgis.st_seteffectivearea($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)",
    arguments: [nc4, defaultSqlArgument(nc16, undefined), defaultSqlArgument(nc19, undefined)] as const,
    result: nc4,
  });
  const member970 = createSqlFunction({
    ...base,
    name: "st_setpoint",
    member:
      "routine:$extension:postgis.st_setpoint($extension:postgis.geometry,pg_catalog.int4,$extension:postgis.geometry)",
    arguments: [nc4, nc19, nc4] as const,
    result: nc4,
  });
  const member971 = createSqlFunction({
    ...base,
    name: "st_setsrid",
    member: "routine:$extension:postgis.st_setsrid($extension:postgis.geography,pg_catalog.int4)",
    arguments: [nc3, nc19] as const,
    result: nc3,
  });
  const member972 = createSqlFunction({
    ...base,
    name: "st_setsrid",
    member: "routine:$extension:postgis.st_setsrid($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc4,
  });
  const member973 = createSqlFunction({
    ...base,
    name: "st_sharedpaths",
    member: "routine:$extension:postgis.st_sharedpaths($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member974 = createSqlFunction({
    ...base,
    name: "st_shiftlongitude",
    member: "routine:$extension:postgis.st_shiftlongitude($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member975 = createSqlFunction({
    ...base,
    name: "st_shortestline",
    member:
      "routine:$extension:postgis.st_shortestline($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)",
    arguments: [nc3, nc3, defaultSqlArgument(nc15, "use_spheroid")] as const,
    result: nc3,
  });
  const member976 = createSqlFunction({
    ...base,
    name: "st_shortestline",
    member: "routine:$extension:postgis.st_shortestline($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member977 = createSqlFunction({
    ...base,
    name: "st_shortestline",
    member: "routine:$extension:postgis.st_shortestline(pg_catalog.text,pg_catalog.text)",
    arguments: [nc14, nc14] as const,
    result: nc4,
  });
  const member978 = createSqlFunction({
    ...base,
    name: "st_simplify",
    member: "routine:$extension:postgis.st_simplify($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc4, nc16, nc15] as const,
    result: nc4,
  });
  const member979 = createSqlFunction({
    ...base,
    name: "st_simplify",
    member: "routine:$extension:postgis.st_simplify($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc4,
  });
  const member980 = createSqlFunction({
    ...base,
    name: "st_simplifypolygonhull",
    member:
      "routine:$extension:postgis.st_simplifypolygonhull($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)",
    arguments: [nc4, nc16, defaultSqlArgument(nc15, "is_outer")] as const,
    result: nc4,
  });
  const member981 = createSqlFunction({
    ...base,
    name: "st_simplifypreservetopology",
    member: "routine:$extension:postgis.st_simplifypreservetopology($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc4,
  });
  const member982 = createSqlFunction({
    ...base,
    name: "st_simplifyvw",
    member: "routine:$extension:postgis.st_simplifyvw($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc4,
  });
  const member983 = createSqlFunction({
    ...base,
    name: "st_snap",
    member:
      "routine:$extension:postgis.st_snap($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16] as const,
    result: nc4,
  });
  const member984 = createSqlFunction({
    ...base,
    name: "st_snaptogrid",
    member:
      "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16, nc16, nc16, nc16] as const,
    result: nc4,
  });
  const member985 = createSqlFunction({
    ...base,
    name: "st_snaptogrid",
    member:
      "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16, nc16, nc16] as const,
    result: nc4,
  });
  const member986 = createSqlFunction({
    ...base,
    name: "st_snaptogrid",
    member: "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16] as const,
    result: nc4,
  });
  const member987 = createSqlFunction({
    ...base,
    name: "st_snaptogrid",
    member: "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc4,
  });
  const member988 = createSqlFunction({
    ...base,
    name: "st_split",
    member: "routine:$extension:postgis.st_split($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member989 = createSqlFunction({
    ...base,
    name: "st_square",
    member:
      "routine:$extension:postgis.st_square(pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry)",
    arguments: [nc16, nc19, nc19, defaultSqlArgument(nc4, "origin")] as const,
    result: nc4,
  });
  const rowFields990 = { geom: nc4, i: nc19, j: nc19 } as const;
  const member990 = createSqlFunction({
    ...base,
    name: "st_squaregrid",
    member: "routine:$extension:postgis.st_squaregrid(pg_catalog.float8,$extension:postgis.geometry)",
    arguments: [nc16, nc4] as const,
    result: nullableCodec(
      compositeCodec(
        "routine:$extension:postgis.st_squaregrid(pg_catalog.float8,$extension:postgis.geometry)",
        rowFields990,
      ),
    ),
  });
  const rows990 = (alias: string, ...values: Parameters<typeof member990>) =>
    extensionRows(member990(...values), alias, rowFields990, "named");
  const member991 = createSqlFunction({
    ...base,
    name: "st_srid",
    member: "routine:$extension:postgis.st_srid($extension:postgis.geography)",
    arguments: [nc3] as const,
    result: nc19,
  });
  const member992 = createSqlFunction({
    ...base,
    name: "st_srid",
    member: "routine:$extension:postgis.st_srid($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc19,
  });
  const member993 = createSqlFunction({
    ...base,
    name: "st_startpoint",
    member: "routine:$extension:postgis.st_startpoint($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member994 = createSqlFunction({
    ...base,
    name: "st_subdivide",
    member: "routine:$extension:postgis.st_subdivide($extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)",
    arguments: [nc4, defaultSqlArgument(nc19, "maxvertices"), defaultSqlArgument(nc16, "gridsize")] as const,
    result: nc4,
  });
  const member995 = createSqlFunction({
    ...base,
    name: "st_summary",
    member: "routine:$extension:postgis.st_summary($extension:postgis.geography)",
    arguments: [nc3] as const,
    result: nc14,
  });
  const member996 = createSqlFunction({
    ...base,
    name: "st_summary",
    member: "routine:$extension:postgis.st_summary($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc14,
  });
  const member997 = createSqlFunction({
    ...base,
    name: "st_swapordinates",
    member: "routine:$extension:postgis.st_swapordinates($extension:postgis.geometry,pg_catalog.cstring)",
    arguments: [nc4, nc22] as const,
    result: nc4,
  });
  const member998 = createSqlFunction({
    ...base,
    name: "st_symdifference",
    member:
      "routine:$extension:postgis.st_symdifference($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, defaultSqlArgument(nc16, "gridsize")] as const,
    result: nc4,
  });
  const member999 = createSqlFunction({
    ...base,
    name: "st_symmetricdifference",
    member:
      "routine:$extension:postgis.st_symmetricdifference($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member1000 = createSqlFunction({
    ...base,
    name: "st_tileenvelope",
    member:
      "routine:$extension:postgis.st_tileenvelope(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc19, nc19, nc19, defaultSqlArgument(nc4, "bounds"), defaultSqlArgument(nc16, "margin")] as const,
    result: nc4,
  });
  const member1001 = createSqlFunction({
    ...base,
    name: "st_touches",
    member: "routine:$extension:postgis.st_touches($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member1002 = createSqlFunction({
    ...base,
    name: "st_transform",
    member: "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.int4)",
    arguments: [nc4, nc19] as const,
    result: nc4,
  });
  const member1003 = createSqlFunction({
    ...base,
    name: "st_transform",
    member: "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)",
    arguments: [nc4, nc14, nc19] as const,
    result: nc4,
  });
  const member1004 = createSqlFunction({
    ...base,
    name: "st_transform",
    member: "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text,pg_catalog.text)",
    arguments: [nc4, nc14, nc14] as const,
    result: nc4,
  });
  const member1005 = createSqlFunction({
    ...base,
    name: "st_transform",
    member: "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text)",
    arguments: [nc4, nc14] as const,
    result: nc4,
  });
  const member1006 = createSqlFunction({
    ...base,
    name: "st_transformpipeline",
    member:
      "routine:$extension:postgis.st_transformpipeline($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)",
    arguments: [nc4, nc14, defaultSqlArgument(nc19, "to_srid")] as const,
    result: nc4,
  });
  const member1007 = createSqlFunction({
    ...base,
    name: "st_translate",
    member:
      "routine:$extension:postgis.st_translate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16, nc16] as const,
    result: nc4,
  });
  const member1008 = createSqlFunction({
    ...base,
    name: "st_translate",
    member: "routine:$extension:postgis.st_translate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16] as const,
    result: nc4,
  });
  const member1009 = createSqlFunction({
    ...base,
    name: "st_transscale",
    member:
      "routine:$extension:postgis.st_transscale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16, nc16, nc16] as const,
    result: nc4,
  });
  const member1010 = createSqlFunction({
    ...base,
    name: "st_triangulatepolygon",
    member: "routine:$extension:postgis.st_triangulatepolygon($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member1011 = createSqlFunction({
    ...base,
    name: "st_unaryunion",
    member: "routine:$extension:postgis.st_unaryunion($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, defaultSqlArgument(nc16, "gridsize")] as const,
    result: nc4,
  });
  const member1012 = createSqlFunction({
    ...base,
    name: "st_union",
    member: "routine:$extension:postgis.st_union($extension:postgis._geometry)",
    arguments: [nc35] as const,
    result: nc4,
  });
  const member1013 = createSqlFunction({
    ...base,
    name: "st_union",
    member:
      "routine:$extension:postgis.st_union($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc4, nc16] as const,
    result: nc4,
  });
  const member1014 = createSqlFunction({
    ...base,
    name: "st_union",
    member: "routine:$extension:postgis.st_union($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc4,
  });
  const member1015 = createSqlAggregate({
    ...base,
    name: "st_union",
    member: "routine:$extension:postgis.st_union($extension:postgis.geometry,pg_catalog.float8)",
    arguments: [nc4, nc16] as const,
    result: nc4,
  });
  const member1016 = createSqlAggregate({
    ...base,
    name: "st_union",
    member: "routine:$extension:postgis.st_union($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc4,
  });
  const member1017 = createSqlFunction({
    ...base,
    name: "st_voronoilines",
    member:
      "routine:$extension:postgis.st_voronoilines($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)",
    arguments: [nc4, defaultSqlArgument(nc16, "tolerance"), defaultSqlArgument(nc4, "extend_to")] as const,
    result: nc4,
  });
  const member1018 = createSqlFunction({
    ...base,
    name: "st_voronoipolygons",
    member:
      "routine:$extension:postgis.st_voronoipolygons($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)",
    arguments: [nc4, defaultSqlArgument(nc16, "tolerance"), defaultSqlArgument(nc4, "extend_to")] as const,
    result: nc4,
  });
  const member1019 = createSqlFunction({
    ...base,
    name: "st_within",
    member: "routine:$extension:postgis.st_within($extension:postgis.geometry,$extension:postgis.geometry)",
    arguments: [nc4, nc4] as const,
    result: nc15,
  });
  const member1020 = createSqlFunction({
    ...base,
    name: "st_wkbtosql",
    member: "routine:$extension:postgis.st_wkbtosql(pg_catalog.bytea)",
    arguments: [nc8] as const,
    result: nc4,
  });
  const member1021 = createSqlFunction({
    ...base,
    name: "st_wkttosql",
    member: "routine:$extension:postgis.st_wkttosql(pg_catalog.text)",
    arguments: [nc14] as const,
    result: nc4,
  });
  const member1022 = createSqlFunction({
    ...base,
    name: "st_wrapx",
    member: "routine:$extension:postgis.st_wrapx($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
    arguments: [nc4, nc16, nc16] as const,
    result: nc4,
  });
  const member1023 = createSqlFunction({
    ...base,
    name: "st_x",
    member: "routine:$extension:postgis.st_x($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc16,
  });
  const member1024 = createSqlFunction({
    ...base,
    name: "st_xmax",
    member: "routine:$extension:postgis.st_xmax($extension:postgis.box3d)",
    arguments: [nc2] as const,
    result: nc16,
  });
  const member1025 = createSqlFunction({
    ...base,
    name: "st_xmin",
    member: "routine:$extension:postgis.st_xmin($extension:postgis.box3d)",
    arguments: [nc2] as const,
    result: nc16,
  });
  const member1026 = createSqlFunction({
    ...base,
    name: "st_y",
    member: "routine:$extension:postgis.st_y($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc16,
  });
  const member1027 = createSqlFunction({
    ...base,
    name: "st_ymax",
    member: "routine:$extension:postgis.st_ymax($extension:postgis.box3d)",
    arguments: [nc2] as const,
    result: nc16,
  });
  const member1028 = createSqlFunction({
    ...base,
    name: "st_ymin",
    member: "routine:$extension:postgis.st_ymin($extension:postgis.box3d)",
    arguments: [nc2] as const,
    result: nc16,
  });
  const member1029 = createSqlFunction({
    ...base,
    name: "st_z",
    member: "routine:$extension:postgis.st_z($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc16,
  });
  const member1030 = createSqlFunction({
    ...base,
    name: "st_zmax",
    member: "routine:$extension:postgis.st_zmax($extension:postgis.box3d)",
    arguments: [nc2] as const,
    result: nc16,
  });
  const member1031 = createSqlFunction({
    ...base,
    name: "st_zmflag",
    member: "routine:$extension:postgis.st_zmflag($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc25,
  });
  const member1032 = createSqlFunction({
    ...base,
    name: "st_zmin",
    member: "routine:$extension:postgis.st_zmin($extension:postgis.box3d)",
    arguments: [nc2] as const,
    result: nc16,
  });
  const member1033 = createSqlFunction({
    ...base,
    name: "text",
    member: "routine:$extension:postgis.text($extension:postgis.geometry)",
    arguments: [nc4] as const,
    result: nc14,
  });
  const overloads = {
    "cast:$extension:postgis.box2d->$extension:postgis.box3d": member0,
    "cast:$extension:postgis.box2d->$extension:postgis.geometry": member1,
    "cast:$extension:postgis.box3d->$extension:postgis.box2d": member2,
    "cast:$extension:postgis.box3d->$extension:postgis.geometry": member3,
    "cast:$extension:postgis.box3d->pg_catalog.box": member4,
    "cast:$extension:postgis.geography->$extension:postgis.geography": member5,
    "cast:$extension:postgis.geography->$extension:postgis.geometry": member6,
    "cast:$extension:postgis.geography->pg_catalog.bytea": member7,
    "cast:$extension:postgis.geometry->$extension:postgis.box2d": member8,
    "cast:$extension:postgis.geometry->$extension:postgis.box3d": member9,
    "cast:$extension:postgis.geometry->$extension:postgis.geography": member10,
    "cast:$extension:postgis.geometry->$extension:postgis.geometry": member11,
    "cast:$extension:postgis.geometry->pg_catalog.box": member12,
    "cast:$extension:postgis.geometry->pg_catalog.bytea": member13,
    "cast:$extension:postgis.geometry->pg_catalog.json": member14,
    "cast:$extension:postgis.geometry->pg_catalog.jsonb": member15,
    "cast:$extension:postgis.geometry->pg_catalog.path": member16,
    "cast:$extension:postgis.geometry->pg_catalog.point": member17,
    "cast:$extension:postgis.geometry->pg_catalog.polygon": member18,
    "cast:$extension:postgis.geometry->pg_catalog.text": member19,
    "cast:pg_catalog.bytea->$extension:postgis.geography": member20,
    "cast:pg_catalog.bytea->$extension:postgis.geometry": member21,
    "cast:pg_catalog.path->$extension:postgis.geometry": member22,
    "cast:pg_catalog.point->$extension:postgis.geometry": member23,
    "cast:pg_catalog.polygon->$extension:postgis.geometry": member24,
    "cast:pg_catalog.text->$extension:postgis.geometry": member25,
    "operator:$extension:postgis.@($extension:postgis.box2df,$extension:postgis.box2df)": member195,
    "operator:$extension:postgis.@($extension:postgis.box2df,$extension:postgis.geometry)": member196,
    "operator:$extension:postgis.@($extension:postgis.geometry,$extension:postgis.box2df)": member197,
    "operator:$extension:postgis.@($extension:postgis.geometry,$extension:postgis.geometry)": member198,
    "operator:$extension:postgis.@@($extension:postgis.geometry,$extension:postgis.geometry)": member199,
    "operator:$extension:postgis.@>>($extension:postgis.geometry,$extension:postgis.geometry)": member200,
    "operator:$extension:postgis.&/&($extension:postgis.geometry,$extension:postgis.geometry)": member201,
    "operator:$extension:postgis.&&($extension:postgis.box2df,$extension:postgis.box2df)": member202,
    "operator:$extension:postgis.&&($extension:postgis.box2df,$extension:postgis.geometry)": member203,
    "operator:$extension:postgis.&&($extension:postgis.geography,$extension:postgis.geography)": member204,
    "operator:$extension:postgis.&&($extension:postgis.geography,$extension:postgis.gidx)": member205,
    "operator:$extension:postgis.&&($extension:postgis.geometry,$extension:postgis.box2df)": member206,
    "operator:$extension:postgis.&&($extension:postgis.geometry,$extension:postgis.geometry)": member207,
    "operator:$extension:postgis.&&($extension:postgis.gidx,$extension:postgis.geography)": member208,
    "operator:$extension:postgis.&&($extension:postgis.gidx,$extension:postgis.gidx)": member209,
    "operator:$extension:postgis.&&&($extension:postgis.geometry,$extension:postgis.geometry)": member210,
    "operator:$extension:postgis.&&&($extension:postgis.geometry,$extension:postgis.gidx)": member211,
    "operator:$extension:postgis.&&&($extension:postgis.gidx,$extension:postgis.geometry)": member212,
    "operator:$extension:postgis.&&&($extension:postgis.gidx,$extension:postgis.gidx)": member213,
    "operator:$extension:postgis.&<($extension:postgis.geometry,$extension:postgis.geometry)": member214,
    "operator:$extension:postgis.&<|($extension:postgis.geometry,$extension:postgis.geometry)": member215,
    "operator:$extension:postgis.&>($extension:postgis.geometry,$extension:postgis.geometry)": member216,
    "operator:$extension:postgis.<->($extension:postgis.geography,$extension:postgis.geography)": member217,
    "operator:$extension:postgis.<->($extension:postgis.geometry,$extension:postgis.geometry)": member218,
    "operator:$extension:postgis.<($extension:postgis.geography,$extension:postgis.geography)": member219,
    "operator:$extension:postgis.<($extension:postgis.geometry,$extension:postgis.geometry)": member220,
    "operator:$extension:postgis.<#>($extension:postgis.geometry,$extension:postgis.geometry)": member221,
    "operator:$extension:postgis.<<->>($extension:postgis.geometry,$extension:postgis.geometry)": member222,
    "operator:$extension:postgis.<<($extension:postgis.geometry,$extension:postgis.geometry)": member223,
    "operator:$extension:postgis.<<@($extension:postgis.geometry,$extension:postgis.geometry)": member224,
    "operator:$extension:postgis.<<|($extension:postgis.geometry,$extension:postgis.geometry)": member225,
    "operator:$extension:postgis.<=($extension:postgis.geography,$extension:postgis.geography)": member226,
    "operator:$extension:postgis.<=($extension:postgis.geometry,$extension:postgis.geometry)": member227,
    "operator:$extension:postgis.<>($extension:postgis.geometry,$extension:postgis.geometry)": member228,
    "operator:$extension:postgis.=($extension:postgis.geography,$extension:postgis.geography)": member229,
    "operator:$extension:postgis.=($extension:postgis.geometry,$extension:postgis.geometry)": member230,
    "operator:$extension:postgis.>($extension:postgis.geography,$extension:postgis.geography)": member231,
    "operator:$extension:postgis.>($extension:postgis.geometry,$extension:postgis.geometry)": member232,
    "operator:$extension:postgis.>=($extension:postgis.geography,$extension:postgis.geography)": member233,
    "operator:$extension:postgis.>=($extension:postgis.geometry,$extension:postgis.geometry)": member234,
    "operator:$extension:postgis.>>($extension:postgis.geometry,$extension:postgis.geometry)": member235,
    "operator:$extension:postgis.|&>($extension:postgis.geometry,$extension:postgis.geometry)": member236,
    "operator:$extension:postgis.|=|($extension:postgis.geometry,$extension:postgis.geometry)": member237,
    "operator:$extension:postgis.|>>($extension:postgis.geometry,$extension:postgis.geometry)": member238,
    "operator:$extension:postgis.~($extension:postgis.box2df,$extension:postgis.box2df)": member239,
    "operator:$extension:postgis.~($extension:postgis.box2df,$extension:postgis.geometry)": member240,
    "operator:$extension:postgis.~($extension:postgis.geometry,$extension:postgis.box2df)": member241,
    "operator:$extension:postgis.~($extension:postgis.geometry,$extension:postgis.geometry)": member242,
    "operator:$extension:postgis.~=($extension:postgis.geometry,$extension:postgis.geometry)": member243,
    "operator:$extension:postgis.~==($extension:postgis.geometry,$extension:postgis.geometry)": member244,
    "operator:$extension:postgis.~~($extension:postgis.geometry,$extension:postgis.geometry)": member245,
    "operator:$extension:postgis.~~=($extension:postgis.geometry,$extension:postgis.geometry)": member246,
    "routine:$extension:postgis._postgis_deprecate(pg_catalog.text,pg_catalog.text,pg_catalog.text)": member261,
    "routine:$extension:postgis._postgis_index_extent(pg_catalog.regclass,pg_catalog.text)": member262,
    "routine:$extension:postgis._postgis_join_selectivity(pg_catalog.regclass,pg_catalog.text,pg_catalog.regclass,pg_catalog.text,pg_catalog.text)":
      member263,
    "routine:$extension:postgis._postgis_pgsql_version()": member264,
    "routine:$extension:postgis._postgis_scripts_pgsql_version()": member265,
    "routine:$extension:postgis._postgis_selectivity(pg_catalog.regclass,pg_catalog.text,$extension:postgis.geometry,pg_catalog.text)":
      member266,
    "routine:$extension:postgis._postgis_stats(pg_catalog.regclass,pg_catalog.text,pg_catalog.text)": member267,
    "routine:$extension:postgis._st_3ddfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member268,
    "routine:$extension:postgis._st_3ddwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member269,
    "routine:$extension:postgis._st_3dintersects($extension:postgis.geometry,$extension:postgis.geometry)": member270,
    "routine:$extension:postgis._st_asgml(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)":
      member271,
    "routine:$extension:postgis._st_asx3d(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)":
      member272,
    "routine:$extension:postgis._st_bestsrid($extension:postgis.geography,$extension:postgis.geography)": member273,
    "routine:$extension:postgis._st_bestsrid($extension:postgis.geography)": member274,
    "routine:$extension:postgis._st_contains($extension:postgis.geometry,$extension:postgis.geometry)": member275,
    "routine:$extension:postgis._st_containsproperly($extension:postgis.geometry,$extension:postgis.geometry)":
      member276,
    "routine:$extension:postgis._st_coveredby($extension:postgis.geography,$extension:postgis.geography)": member277,
    "routine:$extension:postgis._st_coveredby($extension:postgis.geometry,$extension:postgis.geometry)": member278,
    "routine:$extension:postgis._st_covers($extension:postgis.geography,$extension:postgis.geography)": member279,
    "routine:$extension:postgis._st_covers($extension:postgis.geometry,$extension:postgis.geometry)": member280,
    "routine:$extension:postgis._st_crosses($extension:postgis.geometry,$extension:postgis.geometry)": member281,
    "routine:$extension:postgis._st_dfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member282,
    "routine:$extension:postgis._st_distancetree($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)":
      member283,
    "routine:$extension:postgis._st_distancetree($extension:postgis.geography,$extension:postgis.geography)": member284,
    "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)":
      member285,
    "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)":
      member286,
    "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography)":
      member287,
    "routine:$extension:postgis._st_dwithin($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)":
      member288,
    "routine:$extension:postgis._st_dwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member289,
    "routine:$extension:postgis._st_dwithinuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)":
      member290,
    "routine:$extension:postgis._st_dwithinuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)":
      member291,
    "routine:$extension:postgis._st_equals($extension:postgis.geometry,$extension:postgis.geometry)": member292,
    "routine:$extension:postgis._st_expand($extension:postgis.geography,pg_catalog.float8)": member293,
    "routine:$extension:postgis._st_geomfromgml(pg_catalog.text,pg_catalog.int4)": member294,
    "routine:$extension:postgis._st_intersects($extension:postgis.geometry,$extension:postgis.geometry)": member295,
    "routine:$extension:postgis._st_linecrossingdirection($extension:postgis.geometry,$extension:postgis.geometry)":
      member296,
    "routine:$extension:postgis._st_longestline($extension:postgis.geometry,$extension:postgis.geometry)": member297,
    "routine:$extension:postgis._st_maxdistance($extension:postgis.geometry,$extension:postgis.geometry)": member298,
    "routine:$extension:postgis._st_orderingequals($extension:postgis.geometry,$extension:postgis.geometry)": member299,
    "routine:$extension:postgis._st_overlaps($extension:postgis.geometry,$extension:postgis.geometry)": member300,
    "routine:$extension:postgis._st_pointoutside($extension:postgis.geography)": member301,
    "routine:$extension:postgis._st_sortablehash($extension:postgis.geometry)": member302,
    "routine:$extension:postgis._st_touches($extension:postgis.geometry,$extension:postgis.geometry)": member303,
    "routine:$extension:postgis._st_voronoi($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)":
      member304,
    "routine:$extension:postgis._st_within($extension:postgis.geometry,$extension:postgis.geometry)": member305,
    "routine:$extension:postgis.box($extension:postgis.box3d)": member309,
    "routine:$extension:postgis.box($extension:postgis.geometry)": member310,
    "routine:$extension:postgis.box2d($extension:postgis.box3d)": member313,
    "routine:$extension:postgis.box2d($extension:postgis.geometry)": member314,
    "routine:$extension:postgis.box3d($extension:postgis.box2d)": member319,
    "routine:$extension:postgis.box3d($extension:postgis.geometry)": member320,
    "routine:$extension:postgis.box3dtobox($extension:postgis.box3d)": member321,
    "routine:$extension:postgis.bytea($extension:postgis.geography)": member322,
    "routine:$extension:postgis.bytea($extension:postgis.geometry)": member323,
    "routine:$extension:postgis.contains_2d($extension:postgis.box2df,$extension:postgis.box2df)": member324,
    "routine:$extension:postgis.contains_2d($extension:postgis.box2df,$extension:postgis.geometry)": member325,
    "routine:$extension:postgis.contains_2d($extension:postgis.geometry,$extension:postgis.box2df)": member326,
    "routine:$extension:postgis.equals($extension:postgis.geometry,$extension:postgis.geometry)": member333,
    "routine:$extension:postgis.find_srid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)": member334,
    "routine:$extension:postgis.geography_cmp($extension:postgis.geography,$extension:postgis.geography)": member338,
    "routine:$extension:postgis.geography_distance_knn($extension:postgis.geography,$extension:postgis.geography)":
      member339,
    "routine:$extension:postgis.geography_eq($extension:postgis.geography,$extension:postgis.geography)": member340,
    "routine:$extension:postgis.geography_ge($extension:postgis.geography,$extension:postgis.geography)": member341,
    "routine:$extension:postgis.geography_gt($extension:postgis.geography,$extension:postgis.geography)": member350,
    "routine:$extension:postgis.geography_le($extension:postgis.geography,$extension:postgis.geography)": member352,
    "routine:$extension:postgis.geography_lt($extension:postgis.geography,$extension:postgis.geography)": member353,
    "routine:$extension:postgis.geography_overlaps($extension:postgis.geography,$extension:postgis.geography)":
      member355,
    "routine:$extension:postgis.geography_send($extension:postgis.geography)": member357,
    "routine:$extension:postgis.geography($extension:postgis.geography,pg_catalog.int4,pg_catalog.bool)": member366,
    "routine:$extension:postgis.geography($extension:postgis.geometry)": member367,
    "routine:$extension:postgis.geography(pg_catalog.bytea)": member368,
    "routine:$extension:postgis.geometry_above($extension:postgis.geometry,$extension:postgis.geometry)": member375,
    "routine:$extension:postgis.geometry_below($extension:postgis.geometry,$extension:postgis.geometry)": member377,
    "routine:$extension:postgis.geometry_cmp($extension:postgis.geometry,$extension:postgis.geometry)": member378,
    "routine:$extension:postgis.geometry_contained_3d($extension:postgis.geometry,$extension:postgis.geometry)":
      member379,
    "routine:$extension:postgis.geometry_contains_3d($extension:postgis.geometry,$extension:postgis.geometry)":
      member380,
    "routine:$extension:postgis.geometry_contains_nd($extension:postgis.geometry,$extension:postgis.geometry)":
      member381,
    "routine:$extension:postgis.geometry_contains($extension:postgis.geometry,$extension:postgis.geometry)": member382,
    "routine:$extension:postgis.geometry_distance_box($extension:postgis.geometry,$extension:postgis.geometry)":
      member383,
    "routine:$extension:postgis.geometry_distance_centroid_nd($extension:postgis.geometry,$extension:postgis.geometry)":
      member384,
    "routine:$extension:postgis.geometry_distance_centroid($extension:postgis.geometry,$extension:postgis.geometry)":
      member385,
    "routine:$extension:postgis.geometry_distance_cpa($extension:postgis.geometry,$extension:postgis.geometry)":
      member386,
    "routine:$extension:postgis.geometry_eq($extension:postgis.geometry,$extension:postgis.geometry)": member387,
    "routine:$extension:postgis.geometry_ge($extension:postgis.geometry,$extension:postgis.geometry)": member388,
    "routine:$extension:postgis.geometry_gt($extension:postgis.geometry,$extension:postgis.geometry)": member406,
    "routine:$extension:postgis.geometry_hash($extension:postgis.geometry)": member407,
    "routine:$extension:postgis.geometry_le($extension:postgis.geometry,$extension:postgis.geometry)": member409,
    "routine:$extension:postgis.geometry_left($extension:postgis.geometry,$extension:postgis.geometry)": member410,
    "routine:$extension:postgis.geometry_lt($extension:postgis.geometry,$extension:postgis.geometry)": member411,
    "routine:$extension:postgis.geometry_neq($extension:postgis.geometry,$extension:postgis.geometry)": member412,
    "routine:$extension:postgis.geometry_overabove($extension:postgis.geometry,$extension:postgis.geometry)": member414,
    "routine:$extension:postgis.geometry_overbelow($extension:postgis.geometry,$extension:postgis.geometry)": member415,
    "routine:$extension:postgis.geometry_overlaps_3d($extension:postgis.geometry,$extension:postgis.geometry)":
      member416,
    "routine:$extension:postgis.geometry_overlaps_nd($extension:postgis.geometry,$extension:postgis.geometry)":
      member417,
    "routine:$extension:postgis.geometry_overlaps($extension:postgis.geometry,$extension:postgis.geometry)": member418,
    "routine:$extension:postgis.geometry_overleft($extension:postgis.geometry,$extension:postgis.geometry)": member419,
    "routine:$extension:postgis.geometry_overright($extension:postgis.geometry,$extension:postgis.geometry)": member420,
    "routine:$extension:postgis.geometry_right($extension:postgis.geometry,$extension:postgis.geometry)": member422,
    "routine:$extension:postgis.geometry_same_3d($extension:postgis.geometry,$extension:postgis.geometry)": member423,
    "routine:$extension:postgis.geometry_same_nd($extension:postgis.geometry,$extension:postgis.geometry)": member424,
    "routine:$extension:postgis.geometry_same($extension:postgis.geometry,$extension:postgis.geometry)": member425,
    "routine:$extension:postgis.geometry_send($extension:postgis.geometry)": member426,
    "routine:$extension:postgis.geometry_within_nd($extension:postgis.geometry,$extension:postgis.geometry)": member448,
    "routine:$extension:postgis.geometry_within($extension:postgis.geometry,$extension:postgis.geometry)": member449,
    "routine:$extension:postgis.geometry($extension:postgis.box2d)": member450,
    "routine:$extension:postgis.geometry($extension:postgis.box3d)": member451,
    "routine:$extension:postgis.geometry($extension:postgis.geography)": member452,
    "routine:$extension:postgis.geometry($extension:postgis.geometry,pg_catalog.int4,pg_catalog.bool)": member453,
    "routine:$extension:postgis.geometry(pg_catalog.bytea)": member454,
    "routine:$extension:postgis.geometry(pg_catalog.path)": member455,
    "routine:$extension:postgis.geometry(pg_catalog.point)": member456,
    "routine:$extension:postgis.geometry(pg_catalog.polygon)": member457,
    "routine:$extension:postgis.geometry(pg_catalog.text)": member458,
    "routine:$extension:postgis.geometrytype($extension:postgis.geography)": member459,
    "routine:$extension:postgis.geometrytype($extension:postgis.geometry)": member460,
    "routine:$extension:postgis.geomfromewkb(pg_catalog.bytea)": member461,
    "routine:$extension:postgis.geomfromewkt(pg_catalog.text)": member462,
    "routine:$extension:postgis.get_proj4_from_srid(pg_catalog.int4)": member463,
    "routine:$extension:postgis.is_contained_2d($extension:postgis.box2df,$extension:postgis.box2df)": member470,
    "routine:$extension:postgis.is_contained_2d($extension:postgis.box2df,$extension:postgis.geometry)": member471,
    "routine:$extension:postgis.is_contained_2d($extension:postgis.geometry,$extension:postgis.box2df)": member472,
    "routine:$extension:postgis.json($extension:postgis.geometry)": member473,
    "routine:$extension:postgis.jsonb($extension:postgis.geometry)": member474,
    "routine:$extension:postgis.overlaps_2d($extension:postgis.box2df,$extension:postgis.box2df)": member475,
    "routine:$extension:postgis.overlaps_2d($extension:postgis.box2df,$extension:postgis.geometry)": member476,
    "routine:$extension:postgis.overlaps_2d($extension:postgis.geometry,$extension:postgis.box2df)": member477,
    "routine:$extension:postgis.overlaps_geog($extension:postgis.geography,$extension:postgis.gidx)": member478,
    "routine:$extension:postgis.overlaps_geog($extension:postgis.gidx,$extension:postgis.geography)": member479,
    "routine:$extension:postgis.overlaps_geog($extension:postgis.gidx,$extension:postgis.gidx)": member480,
    "routine:$extension:postgis.overlaps_nd($extension:postgis.geometry,$extension:postgis.gidx)": member481,
    "routine:$extension:postgis.overlaps_nd($extension:postgis.gidx,$extension:postgis.geometry)": member482,
    "routine:$extension:postgis.overlaps_nd($extension:postgis.gidx,$extension:postgis.gidx)": member483,
    "routine:$extension:postgis.path($extension:postgis.geometry)": member484,
    "routine:$extension:postgis.point($extension:postgis.geometry)": member516,
    "routine:$extension:postgis.polygon($extension:postgis.geometry)": member517,
    "routine:$extension:postgis.postgis_addbbox($extension:postgis.geometry)": member520,
    "routine:$extension:postgis.postgis_constraint_dims(pg_catalog.text,pg_catalog.text,pg_catalog.text)": member522,
    "routine:$extension:postgis.postgis_constraint_srid(pg_catalog.text,pg_catalog.text,pg_catalog.text)": member523,
    "routine:$extension:postgis.postgis_constraint_type(pg_catalog.text,pg_catalog.text,pg_catalog.text)": member524,
    "routine:$extension:postgis.postgis_dropbbox($extension:postgis.geometry)": member525,
    "routine:$extension:postgis.postgis_full_version()": member527,
    "routine:$extension:postgis.postgis_geos_compiled_version()": member528,
    "routine:$extension:postgis.postgis_geos_noop($extension:postgis.geometry)": member529,
    "routine:$extension:postgis.postgis_geos_version()": member530,
    "routine:$extension:postgis.postgis_getbbox($extension:postgis.geometry)": member531,
    "routine:$extension:postgis.postgis_hasbbox($extension:postgis.geometry)": member532,
    "routine:$extension:postgis.postgis_lib_build_date()": member534,
    "routine:$extension:postgis.postgis_lib_revision()": member535,
    "routine:$extension:postgis.postgis_lib_version()": member536,
    "routine:$extension:postgis.postgis_libjson_version()": member537,
    "routine:$extension:postgis.postgis_liblwgeom_version()": member538,
    "routine:$extension:postgis.postgis_libprotobuf_version()": member539,
    "routine:$extension:postgis.postgis_libxml_version()": member540,
    "routine:$extension:postgis.postgis_noop($extension:postgis.geometry)": member541,
    "routine:$extension:postgis.postgis_proj_compiled_version()": member542,
    "routine:$extension:postgis.postgis_proj_version()": member543,
    "routine:$extension:postgis.postgis_scripts_build_date()": member544,
    "routine:$extension:postgis.postgis_scripts_installed()": member545,
    "routine:$extension:postgis.postgis_scripts_released()": member546,
    "routine:$extension:postgis.postgis_srs_all()": member547,
    "routine:$extension:postgis.postgis_srs_codes(pg_catalog.text)": member548,
    "routine:$extension:postgis.postgis_srs_search($extension:postgis.geometry,pg_catalog.text)": member549,
    "routine:$extension:postgis.postgis_srs(pg_catalog.text,pg_catalog.text)": member550,
    "routine:$extension:postgis.postgis_svn_version()": member551,
    "routine:$extension:postgis.postgis_transform_geometry($extension:postgis.geometry,pg_catalog.text,pg_catalog.text,pg_catalog.int4)":
      member552,
    "routine:$extension:postgis.postgis_transform_pipeline_geometry($extension:postgis.geometry,pg_catalog.text,pg_catalog.bool,pg_catalog.int4)":
      member553,
    "routine:$extension:postgis.postgis_type_name(pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)": member554,
    "routine:$extension:postgis.postgis_typmod_dims(pg_catalog.int4)": member555,
    "routine:$extension:postgis.postgis_typmod_srid(pg_catalog.int4)": member556,
    "routine:$extension:postgis.postgis_typmod_type(pg_catalog.int4)": member557,
    "routine:$extension:postgis.postgis_version()": member558,
    "routine:$extension:postgis.postgis_wagyu_version()": member559,
    "routine:$extension:postgis.st_3dclosestpoint($extension:postgis.geometry,$extension:postgis.geometry)": member562,
    "routine:$extension:postgis.st_3ddfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member563,
    "routine:$extension:postgis.st_3ddistance($extension:postgis.geometry,$extension:postgis.geometry)": member564,
    "routine:$extension:postgis.st_3ddwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member565,
    "routine:$extension:postgis.st_3dextent($extension:postgis.geometry)": member566,
    "routine:$extension:postgis.st_3dintersects($extension:postgis.geometry,$extension:postgis.geometry)": member567,
    "routine:$extension:postgis.st_3dlength($extension:postgis.geometry)": member568,
    "routine:$extension:postgis.st_3dlineinterpolatepoint($extension:postgis.geometry,pg_catalog.float8)": member569,
    "routine:$extension:postgis.st_3dlongestline($extension:postgis.geometry,$extension:postgis.geometry)": member570,
    "routine:$extension:postgis.st_3dmakebox($extension:postgis.geometry,$extension:postgis.geometry)": member571,
    "routine:$extension:postgis.st_3dmaxdistance($extension:postgis.geometry,$extension:postgis.geometry)": member572,
    "routine:$extension:postgis.st_3dperimeter($extension:postgis.geometry)": member573,
    "routine:$extension:postgis.st_3dshortestline($extension:postgis.geometry,$extension:postgis.geometry)": member574,
    "routine:$extension:postgis.st_addmeasure($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)":
      member575,
    "routine:$extension:postgis.st_addpoint($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)":
      member576,
    "routine:$extension:postgis.st_addpoint($extension:postgis.geometry,$extension:postgis.geometry)": member577,
    "routine:$extension:postgis.st_affine($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member578,
    "routine:$extension:postgis.st_affine($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member579,
    "routine:$extension:postgis.st_angle($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)":
      member580,
    "routine:$extension:postgis.st_angle($extension:postgis.geometry,$extension:postgis.geometry)": member581,
    "routine:$extension:postgis.st_area($extension:postgis.geography,pg_catalog.bool)": member582,
    "routine:$extension:postgis.st_area($extension:postgis.geometry)": member583,
    "routine:$extension:postgis.st_area(pg_catalog.text)": member584,
    "routine:$extension:postgis.st_area2d($extension:postgis.geometry)": member585,
    "routine:$extension:postgis.st_asbinary($extension:postgis.geography,pg_catalog.text)": member586,
    "routine:$extension:postgis.st_asbinary($extension:postgis.geography)": member587,
    "routine:$extension:postgis.st_asbinary($extension:postgis.geometry,pg_catalog.text)": member588,
    "routine:$extension:postgis.st_asbinary($extension:postgis.geometry)": member589,
    "routine:$extension:postgis.st_asencodedpolyline($extension:postgis.geometry,pg_catalog.int4)": member590,
    "routine:$extension:postgis.st_asewkb($extension:postgis.geometry,pg_catalog.text)": member591,
    "routine:$extension:postgis.st_asewkb($extension:postgis.geometry)": member592,
    "routine:$extension:postgis.st_asewkt($extension:postgis.geography,pg_catalog.int4)": member593,
    "routine:$extension:postgis.st_asewkt($extension:postgis.geography)": member594,
    "routine:$extension:postgis.st_asewkt($extension:postgis.geometry,pg_catalog.int4)": member595,
    "routine:$extension:postgis.st_asewkt($extension:postgis.geometry)": member596,
    "routine:$extension:postgis.st_asewkt(pg_catalog.text)": member597,
    "routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement,pg_catalog.bool,pg_catalog.text)": member598,
    "routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement,pg_catalog.bool)": member599,
    "routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement)": member600,
    "routine:$extension:postgis.st_asgeobuf(pg_catalog.anyelement,pg_catalog.text)": member601,
    "routine:$extension:postgis.st_asgeobuf(pg_catalog.anyelement)": member602,
    "routine:$extension:postgis.st_asgeojson($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)": member603,
    "routine:$extension:postgis.st_asgeojson($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": member604,
    "routine:$extension:postgis.st_asgeojson(pg_catalog.record,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.text)":
      member605,
    "routine:$extension:postgis.st_asgeojson(pg_catalog.text)": member606,
    "routine:$extension:postgis.st_asgml($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)":
      member607,
    "routine:$extension:postgis.st_asgml($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": member608,
    "routine:$extension:postgis.st_asgml(pg_catalog.int4,$extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)":
      member609,
    "routine:$extension:postgis.st_asgml(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)":
      member610,
    "routine:$extension:postgis.st_asgml(pg_catalog.text)": member611,
    "routine:$extension:postgis.st_ashexewkb($extension:postgis.geometry,pg_catalog.text)": member612,
    "routine:$extension:postgis.st_ashexewkb($extension:postgis.geometry)": member613,
    "routine:$extension:postgis.st_askml($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)": member614,
    "routine:$extension:postgis.st_askml($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)": member615,
    "routine:$extension:postgis.st_askml(pg_catalog.text)": member616,
    "routine:$extension:postgis.st_aslatlontext($extension:postgis.geometry,pg_catalog.text)": member617,
    "routine:$extension:postgis.st_asmarc21($extension:postgis.geometry,pg_catalog.text)": member618,
    "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.text)":
      member619,
    "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text)":
      member620,
    "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4)": member621,
    "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text)": member622,
    "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement)": member623,
    "routine:$extension:postgis.st_asmvtgeom($extension:postgis.geometry,$extension:postgis.box2d,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)":
      member624,
    "routine:$extension:postgis.st_assvg($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)": member625,
    "routine:$extension:postgis.st_assvg($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": member626,
    "routine:$extension:postgis.st_assvg(pg_catalog.text)": member627,
    "routine:$extension:postgis.st_astext($extension:postgis.geography,pg_catalog.int4)": member628,
    "routine:$extension:postgis.st_astext($extension:postgis.geography)": member629,
    "routine:$extension:postgis.st_astext($extension:postgis.geometry,pg_catalog.int4)": member630,
    "routine:$extension:postgis.st_astext($extension:postgis.geometry)": member631,
    "routine:$extension:postgis.st_astext(pg_catalog.text)": member632,
    "routine:$extension:postgis.st_astwkb($extension:postgis._geometry,pg_catalog._int8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
      member633,
    "routine:$extension:postgis.st_astwkb($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
      member634,
    "routine:$extension:postgis.st_asx3d($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": member635,
    "routine:$extension:postgis.st_azimuth($extension:postgis.geography,$extension:postgis.geography)": member636,
    "routine:$extension:postgis.st_azimuth($extension:postgis.geometry,$extension:postgis.geometry)": member637,
    "routine:$extension:postgis.st_bdmpolyfromtext(pg_catalog.text,pg_catalog.int4)": member638,
    "routine:$extension:postgis.st_bdpolyfromtext(pg_catalog.text,pg_catalog.int4)": member639,
    "routine:$extension:postgis.st_boundary($extension:postgis.geometry)": member640,
    "routine:$extension:postgis.st_boundingdiagonal($extension:postgis.geometry,pg_catalog.bool)": member641,
    "routine:$extension:postgis.st_box2dfromgeohash(pg_catalog.text,pg_catalog.int4)": member642,
    "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8,pg_catalog.int4)": member643,
    "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8,pg_catalog.text)": member644,
    "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8)": member645,
    "routine:$extension:postgis.st_buffer($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)": member646,
    "routine:$extension:postgis.st_buffer($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text)": member647,
    "routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8,pg_catalog.int4)": member648,
    "routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8,pg_catalog.text)": member649,
    "routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8)": member650,
    "routine:$extension:postgis.st_buildarea($extension:postgis.geometry)": member651,
    "routine:$extension:postgis.st_centroid($extension:postgis.geography,pg_catalog.bool)": member652,
    "routine:$extension:postgis.st_centroid($extension:postgis.geometry)": member653,
    "routine:$extension:postgis.st_centroid(pg_catalog.text)": member654,
    "routine:$extension:postgis.st_chaikinsmoothing($extension:postgis.geometry,pg_catalog.int4,pg_catalog.bool)":
      member655,
    "routine:$extension:postgis.st_cleangeometry($extension:postgis.geometry)": member656,
    "routine:$extension:postgis.st_clipbybox2d($extension:postgis.geometry,$extension:postgis.box2d)": member657,
    "routine:$extension:postgis.st_closestpoint($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)":
      member658,
    "routine:$extension:postgis.st_closestpoint($extension:postgis.geometry,$extension:postgis.geometry)": member659,
    "routine:$extension:postgis.st_closestpoint(pg_catalog.text,pg_catalog.text)": member660,
    "routine:$extension:postgis.st_closestpointofapproach($extension:postgis.geometry,$extension:postgis.geometry)":
      member661,
    "routine:$extension:postgis.st_clusterdbscan($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)":
      member662,
    "routine:$extension:postgis.st_clusterintersecting($extension:postgis._geometry)": member663,
    "routine:$extension:postgis.st_clusterintersecting($extension:postgis.geometry)": member664,
    "routine:$extension:postgis.st_clusterintersectingwin($extension:postgis.geometry)": member665,
    "routine:$extension:postgis.st_clusterkmeans($extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)":
      member666,
    "routine:$extension:postgis.st_clusterwithin($extension:postgis._geometry,pg_catalog.float8)": member667,
    "routine:$extension:postgis.st_clusterwithin($extension:postgis.geometry,pg_catalog.float8)": member668,
    "routine:$extension:postgis.st_clusterwithinwin($extension:postgis.geometry,pg_catalog.float8)": member669,
    "routine:$extension:postgis.st_collect($extension:postgis._geometry)": member670,
    "routine:$extension:postgis.st_collect($extension:postgis.geometry,$extension:postgis.geometry)": member671,
    "routine:$extension:postgis.st_collect($extension:postgis.geometry)": member672,
    "routine:$extension:postgis.st_collectionextract($extension:postgis.geometry,pg_catalog.int4)": member673,
    "routine:$extension:postgis.st_collectionextract($extension:postgis.geometry)": member674,
    "routine:$extension:postgis.st_collectionhomogenize($extension:postgis.geometry)": member675,
    "routine:$extension:postgis.st_combinebbox($extension:postgis.box2d,$extension:postgis.geometry)": member676,
    "routine:$extension:postgis.st_combinebbox($extension:postgis.box3d,$extension:postgis.box3d)": member677,
    "routine:$extension:postgis.st_combinebbox($extension:postgis.box3d,$extension:postgis.geometry)": member678,
    "routine:$extension:postgis.st_concavehull($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)":
      member679,
    "routine:$extension:postgis.st_contains($extension:postgis.geometry,$extension:postgis.geometry)": member680,
    "routine:$extension:postgis.st_containsproperly($extension:postgis.geometry,$extension:postgis.geometry)":
      member681,
    "routine:$extension:postgis.st_convexhull($extension:postgis.geometry)": member682,
    "routine:$extension:postgis.st_coorddim($extension:postgis.geometry)": member683,
    "routine:$extension:postgis.st_coverageclean($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.text)":
      member684,
    "routine:$extension:postgis.st_coverageinvalidedges($extension:postgis.geometry,pg_catalog.float8)": member685,
    "routine:$extension:postgis.st_coveragesimplify($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)":
      member686,
    "routine:$extension:postgis.st_coverageunion($extension:postgis._geometry)": member687,
    "routine:$extension:postgis.st_coverageunion($extension:postgis.geometry)": member688,
    "routine:$extension:postgis.st_coveredby($extension:postgis.geography,$extension:postgis.geography)": member689,
    "routine:$extension:postgis.st_coveredby($extension:postgis.geometry,$extension:postgis.geometry)": member690,
    "routine:$extension:postgis.st_coveredby(pg_catalog.text,pg_catalog.text)": member691,
    "routine:$extension:postgis.st_covers($extension:postgis.geography,$extension:postgis.geography)": member692,
    "routine:$extension:postgis.st_covers($extension:postgis.geometry,$extension:postgis.geometry)": member693,
    "routine:$extension:postgis.st_covers(pg_catalog.text,pg_catalog.text)": member694,
    "routine:$extension:postgis.st_cpawithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member695,
    "routine:$extension:postgis.st_crosses($extension:postgis.geometry,$extension:postgis.geometry)": member696,
    "routine:$extension:postgis.st_curven($extension:postgis.geometry,pg_catalog.int4)": member697,
    "routine:$extension:postgis.st_curvetoline($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)":
      member698,
    "routine:$extension:postgis.st_delaunaytriangles($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)":
      member699,
    "routine:$extension:postgis.st_dfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member700,
    "routine:$extension:postgis.st_difference($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member701,
    "routine:$extension:postgis.st_dimension($extension:postgis.geometry)": member702,
    "routine:$extension:postgis.st_disjoint($extension:postgis.geometry,$extension:postgis.geometry)": member703,
    "routine:$extension:postgis.st_distance($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)":
      member704,
    "routine:$extension:postgis.st_distance($extension:postgis.geometry,$extension:postgis.geometry)": member705,
    "routine:$extension:postgis.st_distance(pg_catalog.text,pg_catalog.text)": member706,
    "routine:$extension:postgis.st_distancecpa($extension:postgis.geometry,$extension:postgis.geometry)": member707,
    "routine:$extension:postgis.st_distancesphere($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member708,
    "routine:$extension:postgis.st_distancesphere($extension:postgis.geometry,$extension:postgis.geometry)": member709,
    "routine:$extension:postgis.st_distancespheroid($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.spheroid)":
      member710,
    "routine:$extension:postgis.st_distancespheroid($extension:postgis.geometry,$extension:postgis.geometry)":
      member711,
    "routine:$extension:postgis.st_dump($extension:postgis.geometry)": member712,
    "routine:$extension:postgis.st_dumppoints($extension:postgis.geometry)": member713,
    "routine:$extension:postgis.st_dumprings($extension:postgis.geometry)": member714,
    "routine:$extension:postgis.st_dumpsegments($extension:postgis.geometry)": member715,
    "routine:$extension:postgis.st_dwithin($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)":
      member716,
    "routine:$extension:postgis.st_dwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member717,
    "routine:$extension:postgis.st_dwithin(pg_catalog.text,pg_catalog.text,pg_catalog.float8)": member718,
    "routine:$extension:postgis.st_endpoint($extension:postgis.geometry)": member719,
    "routine:$extension:postgis.st_envelope($extension:postgis.geometry)": member720,
    "routine:$extension:postgis.st_equals($extension:postgis.geometry,$extension:postgis.geometry)": member721,
    "routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)":
      member722,
    "routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text,pg_catalog.text)": member723,
    "routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text)": member724,
    "routine:$extension:postgis.st_expand($extension:postgis.box2d,pg_catalog.float8,pg_catalog.float8)": member725,
    "routine:$extension:postgis.st_expand($extension:postgis.box2d,pg_catalog.float8)": member726,
    "routine:$extension:postgis.st_expand($extension:postgis.box3d,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member727,
    "routine:$extension:postgis.st_expand($extension:postgis.box3d,pg_catalog.float8)": member728,
    "routine:$extension:postgis.st_expand($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member729,
    "routine:$extension:postgis.st_expand($extension:postgis.geometry,pg_catalog.float8)": member730,
    "routine:$extension:postgis.st_extent($extension:postgis.geometry)": member731,
    "routine:$extension:postgis.st_exteriorring($extension:postgis.geometry)": member732,
    "routine:$extension:postgis.st_filterbym($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
      member733,
    "routine:$extension:postgis.st_findextent(pg_catalog.text,pg_catalog.text,pg_catalog.text)": member734,
    "routine:$extension:postgis.st_findextent(pg_catalog.text,pg_catalog.text)": member735,
    "routine:$extension:postgis.st_flipcoordinates($extension:postgis.geometry)": member736,
    "routine:$extension:postgis.st_force2d($extension:postgis.geometry)": member737,
    "routine:$extension:postgis.st_force3d($extension:postgis.geometry,pg_catalog.float8)": member738,
    "routine:$extension:postgis.st_force3dm($extension:postgis.geometry,pg_catalog.float8)": member739,
    "routine:$extension:postgis.st_force3dz($extension:postgis.geometry,pg_catalog.float8)": member740,
    "routine:$extension:postgis.st_force4d($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": member741,
    "routine:$extension:postgis.st_forcecollection($extension:postgis.geometry)": member742,
    "routine:$extension:postgis.st_forcecurve($extension:postgis.geometry)": member743,
    "routine:$extension:postgis.st_forcepolygonccw($extension:postgis.geometry)": member744,
    "routine:$extension:postgis.st_forcepolygoncw($extension:postgis.geometry)": member745,
    "routine:$extension:postgis.st_forcerhr($extension:postgis.geometry)": member746,
    "routine:$extension:postgis.st_forcesfs($extension:postgis.geometry,pg_catalog.text)": member747,
    "routine:$extension:postgis.st_forcesfs($extension:postgis.geometry)": member748,
    "routine:$extension:postgis.st_frechetdistance($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member749,
    "routine:$extension:postgis.st_fromflatgeobuf(pg_catalog.anyelement,pg_catalog.bytea)": member750,
    "routine:$extension:postgis.st_generatepoints($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)":
      member752,
    "routine:$extension:postgis.st_generatepoints($extension:postgis.geometry,pg_catalog.int4)": member753,
    "routine:$extension:postgis.st_geogfromtext(pg_catalog.text)": member754,
    "routine:$extension:postgis.st_geogfromwkb(pg_catalog.bytea)": member755,
    "routine:$extension:postgis.st_geographyfromtext(pg_catalog.text)": member756,
    "routine:$extension:postgis.st_geohash($extension:postgis.geography,pg_catalog.int4)": member757,
    "routine:$extension:postgis.st_geohash($extension:postgis.geometry,pg_catalog.int4)": member758,
    "routine:$extension:postgis.st_geomcollfromtext(pg_catalog.text,pg_catalog.int4)": member759,
    "routine:$extension:postgis.st_geomcollfromtext(pg_catalog.text)": member760,
    "routine:$extension:postgis.st_geomcollfromwkb(pg_catalog.bytea,pg_catalog.int4)": member761,
    "routine:$extension:postgis.st_geomcollfromwkb(pg_catalog.bytea)": member762,
    "routine:$extension:postgis.st_geometricmedian($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)":
      member763,
    "routine:$extension:postgis.st_geometryfromtext(pg_catalog.text,pg_catalog.int4)": member764,
    "routine:$extension:postgis.st_geometryfromtext(pg_catalog.text)": member765,
    "routine:$extension:postgis.st_geometryn($extension:postgis.geometry,pg_catalog.int4)": member766,
    "routine:$extension:postgis.st_geometrytype($extension:postgis.geometry)": member767,
    "routine:$extension:postgis.st_geomfromewkb(pg_catalog.bytea)": member768,
    "routine:$extension:postgis.st_geomfromewkt(pg_catalog.text)": member769,
    "routine:$extension:postgis.st_geomfromgeohash(pg_catalog.text,pg_catalog.int4)": member770,
    "routine:$extension:postgis.st_geomfromgeojson(pg_catalog.json)": member771,
    "routine:$extension:postgis.st_geomfromgeojson(pg_catalog.jsonb)": member772,
    "routine:$extension:postgis.st_geomfromgeojson(pg_catalog.text)": member773,
    "routine:$extension:postgis.st_geomfromgml(pg_catalog.text,pg_catalog.int4)": member774,
    "routine:$extension:postgis.st_geomfromgml(pg_catalog.text)": member775,
    "routine:$extension:postgis.st_geomfromkml(pg_catalog.text)": member776,
    "routine:$extension:postgis.st_geomfrommarc21(pg_catalog.text)": member777,
    "routine:$extension:postgis.st_geomfromtext(pg_catalog.text,pg_catalog.int4)": member778,
    "routine:$extension:postgis.st_geomfromtext(pg_catalog.text)": member779,
    "routine:$extension:postgis.st_geomfromtwkb(pg_catalog.bytea)": member780,
    "routine:$extension:postgis.st_geomfromwkb(pg_catalog.bytea,pg_catalog.int4)": member781,
    "routine:$extension:postgis.st_geomfromwkb(pg_catalog.bytea)": member782,
    "routine:$extension:postgis.st_gmltosql(pg_catalog.text,pg_catalog.int4)": member783,
    "routine:$extension:postgis.st_gmltosql(pg_catalog.text)": member784,
    "routine:$extension:postgis.st_hasarc($extension:postgis.geometry)": member785,
    "routine:$extension:postgis.st_hasm($extension:postgis.geometry)": member786,
    "routine:$extension:postgis.st_hasz($extension:postgis.geometry)": member787,
    "routine:$extension:postgis.st_hausdorffdistance($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member788,
    "routine:$extension:postgis.st_hausdorffdistance($extension:postgis.geometry,$extension:postgis.geometry)":
      member789,
    "routine:$extension:postgis.st_hexagon(pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry)":
      member790,
    "routine:$extension:postgis.st_hexagongrid(pg_catalog.float8,$extension:postgis.geometry)": member791,
    "routine:$extension:postgis.st_interiorringn($extension:postgis.geometry,pg_catalog.int4)": member792,
    "routine:$extension:postgis.st_interpolatepoint($extension:postgis.geometry,$extension:postgis.geometry)":
      member793,
    "routine:$extension:postgis.st_intersection($extension:postgis.geography,$extension:postgis.geography)": member794,
    "routine:$extension:postgis.st_intersection($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member795,
    "routine:$extension:postgis.st_intersection(pg_catalog.text,pg_catalog.text)": member796,
    "routine:$extension:postgis.st_intersects($extension:postgis.geography,$extension:postgis.geography)": member797,
    "routine:$extension:postgis.st_intersects($extension:postgis.geometry,$extension:postgis.geometry)": member798,
    "routine:$extension:postgis.st_intersects(pg_catalog.text,pg_catalog.text)": member799,
    "routine:$extension:postgis.st_inversetransformpipeline($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)":
      member800,
    "routine:$extension:postgis.st_isclosed($extension:postgis.geometry)": member801,
    "routine:$extension:postgis.st_iscollection($extension:postgis.geometry)": member802,
    "routine:$extension:postgis.st_isempty($extension:postgis.geometry)": member803,
    "routine:$extension:postgis.st_ispolygonccw($extension:postgis.geometry)": member804,
    "routine:$extension:postgis.st_ispolygoncw($extension:postgis.geometry)": member805,
    "routine:$extension:postgis.st_isring($extension:postgis.geometry)": member806,
    "routine:$extension:postgis.st_issimple($extension:postgis.geometry)": member807,
    "routine:$extension:postgis.st_isvalid($extension:postgis.geometry,pg_catalog.int4)": member808,
    "routine:$extension:postgis.st_isvalid($extension:postgis.geometry)": member809,
    "routine:$extension:postgis.st_isvaliddetail($extension:postgis.geometry,pg_catalog.int4)": member810,
    "routine:$extension:postgis.st_isvalidreason($extension:postgis.geometry,pg_catalog.int4)": member811,
    "routine:$extension:postgis.st_isvalidreason($extension:postgis.geometry)": member812,
    "routine:$extension:postgis.st_isvalidtrajectory($extension:postgis.geometry)": member813,
    "routine:$extension:postgis.st_largestemptycircle($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)":
      member814,
    "routine:$extension:postgis.st_length($extension:postgis.geography,pg_catalog.bool)": member815,
    "routine:$extension:postgis.st_length($extension:postgis.geometry)": member816,
    "routine:$extension:postgis.st_length(pg_catalog.text)": member817,
    "routine:$extension:postgis.st_length2d($extension:postgis.geometry)": member818,
    "routine:$extension:postgis.st_length2dspheroid($extension:postgis.geometry,$extension:postgis.spheroid)":
      member819,
    "routine:$extension:postgis.st_lengthspheroid($extension:postgis.geometry,$extension:postgis.spheroid)": member820,
    "routine:$extension:postgis.st_letters(pg_catalog.text,pg_catalog.json)": member821,
    "routine:$extension:postgis.st_linecrossingdirection($extension:postgis.geometry,$extension:postgis.geometry)":
      member822,
    "routine:$extension:postgis.st_lineextend($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)":
      member823,
    "routine:$extension:postgis.st_linefromencodedpolyline(pg_catalog.text,pg_catalog.int4)": member824,
    "routine:$extension:postgis.st_linefrommultipoint($extension:postgis.geometry)": member825,
    "routine:$extension:postgis.st_linefromtext(pg_catalog.text,pg_catalog.int4)": member826,
    "routine:$extension:postgis.st_linefromtext(pg_catalog.text)": member827,
    "routine:$extension:postgis.st_linefromwkb(pg_catalog.bytea,pg_catalog.int4)": member828,
    "routine:$extension:postgis.st_linefromwkb(pg_catalog.bytea)": member829,
    "routine:$extension:postgis.st_lineinterpolatepoint($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)":
      member830,
    "routine:$extension:postgis.st_lineinterpolatepoint($extension:postgis.geometry,pg_catalog.float8)": member831,
    "routine:$extension:postgis.st_lineinterpolatepoint(pg_catalog.text,pg_catalog.float8)": member832,
    "routine:$extension:postgis.st_lineinterpolatepoints($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)":
      member833,
    "routine:$extension:postgis.st_lineinterpolatepoints($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)":
      member834,
    "routine:$extension:postgis.st_lineinterpolatepoints(pg_catalog.text,pg_catalog.float8)": member835,
    "routine:$extension:postgis.st_linelocatepoint($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)":
      member836,
    "routine:$extension:postgis.st_linelocatepoint($extension:postgis.geometry,$extension:postgis.geometry)": member837,
    "routine:$extension:postgis.st_linelocatepoint(pg_catalog.text,pg_catalog.text)": member838,
    "routine:$extension:postgis.st_linemerge($extension:postgis.geometry,pg_catalog.bool)": member839,
    "routine:$extension:postgis.st_linemerge($extension:postgis.geometry)": member840,
    "routine:$extension:postgis.st_linestringfromwkb(pg_catalog.bytea,pg_catalog.int4)": member841,
    "routine:$extension:postgis.st_linestringfromwkb(pg_catalog.bytea)": member842,
    "routine:$extension:postgis.st_linesubstring($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)":
      member843,
    "routine:$extension:postgis.st_linesubstring($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)":
      member844,
    "routine:$extension:postgis.st_linesubstring(pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": member845,
    "routine:$extension:postgis.st_linetocurve($extension:postgis.geometry)": member846,
    "routine:$extension:postgis.st_locatealong($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)":
      member847,
    "routine:$extension:postgis.st_locatebetween($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member848,
    "routine:$extension:postgis.st_locatebetweenelevations($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)":
      member849,
    "routine:$extension:postgis.st_longestline($extension:postgis.geometry,$extension:postgis.geometry)": member850,
    "routine:$extension:postgis.st_m($extension:postgis.geometry)": member851,
    "routine:$extension:postgis.st_makebox2d($extension:postgis.geometry,$extension:postgis.geometry)": member852,
    "routine:$extension:postgis.st_makeenvelope(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)":
      member853,
    "routine:$extension:postgis.st_makeline($extension:postgis._geometry)": member854,
    "routine:$extension:postgis.st_makeline($extension:postgis.geometry,$extension:postgis.geometry)": member855,
    "routine:$extension:postgis.st_makeline($extension:postgis.geometry)": member856,
    "routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member857,
    "routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": member858,
    "routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8)": member859,
    "routine:$extension:postgis.st_makepointm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": member860,
    "routine:$extension:postgis.st_makepolygon($extension:postgis.geometry,$extension:postgis._geometry)": member861,
    "routine:$extension:postgis.st_makepolygon($extension:postgis.geometry)": member862,
    "routine:$extension:postgis.st_makevalid($extension:postgis.geometry,pg_catalog.text)": member863,
    "routine:$extension:postgis.st_makevalid($extension:postgis.geometry)": member864,
    "routine:$extension:postgis.st_maxdistance($extension:postgis.geometry,$extension:postgis.geometry)": member865,
    "routine:$extension:postgis.st_maximuminscribedcircle($extension:postgis.geometry)": member866,
    "routine:$extension:postgis.st_memcollect($extension:postgis.geometry)": member867,
    "routine:$extension:postgis.st_memsize($extension:postgis.geometry)": member868,
    "routine:$extension:postgis.st_memunion($extension:postgis.geometry)": member869,
    "routine:$extension:postgis.st_minimumboundingcircle($extension:postgis.geometry,pg_catalog.int4)": member870,
    "routine:$extension:postgis.st_minimumboundingradius($extension:postgis.geometry)": member871,
    "routine:$extension:postgis.st_minimumclearance($extension:postgis.geometry)": member872,
    "routine:$extension:postgis.st_minimumclearanceline($extension:postgis.geometry)": member873,
    "routine:$extension:postgis.st_mlinefromtext(pg_catalog.text,pg_catalog.int4)": member874,
    "routine:$extension:postgis.st_mlinefromtext(pg_catalog.text)": member875,
    "routine:$extension:postgis.st_mlinefromwkb(pg_catalog.bytea,pg_catalog.int4)": member876,
    "routine:$extension:postgis.st_mlinefromwkb(pg_catalog.bytea)": member877,
    "routine:$extension:postgis.st_mpointfromtext(pg_catalog.text,pg_catalog.int4)": member878,
    "routine:$extension:postgis.st_mpointfromtext(pg_catalog.text)": member879,
    "routine:$extension:postgis.st_mpointfromwkb(pg_catalog.bytea,pg_catalog.int4)": member880,
    "routine:$extension:postgis.st_mpointfromwkb(pg_catalog.bytea)": member881,
    "routine:$extension:postgis.st_mpolyfromtext(pg_catalog.text,pg_catalog.int4)": member882,
    "routine:$extension:postgis.st_mpolyfromtext(pg_catalog.text)": member883,
    "routine:$extension:postgis.st_mpolyfromwkb(pg_catalog.bytea,pg_catalog.int4)": member884,
    "routine:$extension:postgis.st_mpolyfromwkb(pg_catalog.bytea)": member885,
    "routine:$extension:postgis.st_multi($extension:postgis.geometry)": member886,
    "routine:$extension:postgis.st_multilinefromwkb(pg_catalog.bytea)": member887,
    "routine:$extension:postgis.st_multilinestringfromtext(pg_catalog.text,pg_catalog.int4)": member888,
    "routine:$extension:postgis.st_multilinestringfromtext(pg_catalog.text)": member889,
    "routine:$extension:postgis.st_multipointfromtext(pg_catalog.text)": member890,
    "routine:$extension:postgis.st_multipointfromwkb(pg_catalog.bytea,pg_catalog.int4)": member891,
    "routine:$extension:postgis.st_multipointfromwkb(pg_catalog.bytea)": member892,
    "routine:$extension:postgis.st_multipolyfromwkb(pg_catalog.bytea,pg_catalog.int4)": member893,
    "routine:$extension:postgis.st_multipolyfromwkb(pg_catalog.bytea)": member894,
    "routine:$extension:postgis.st_multipolygonfromtext(pg_catalog.text,pg_catalog.int4)": member895,
    "routine:$extension:postgis.st_multipolygonfromtext(pg_catalog.text)": member896,
    "routine:$extension:postgis.st_ndims($extension:postgis.geometry)": member897,
    "routine:$extension:postgis.st_node($extension:postgis.geometry)": member898,
    "routine:$extension:postgis.st_normalize($extension:postgis.geometry)": member899,
    "routine:$extension:postgis.st_npoints($extension:postgis.geometry)": member900,
    "routine:$extension:postgis.st_nrings($extension:postgis.geometry)": member901,
    "routine:$extension:postgis.st_numcurves($extension:postgis.geometry)": member902,
    "routine:$extension:postgis.st_numgeometries($extension:postgis.geometry)": member903,
    "routine:$extension:postgis.st_numinteriorring($extension:postgis.geometry)": member904,
    "routine:$extension:postgis.st_numinteriorrings($extension:postgis.geometry)": member905,
    "routine:$extension:postgis.st_numpatches($extension:postgis.geometry)": member906,
    "routine:$extension:postgis.st_numpoints($extension:postgis.geometry)": member907,
    "routine:$extension:postgis.st_offsetcurve($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text)":
      member908,
    "routine:$extension:postgis.st_orderingequals($extension:postgis.geometry,$extension:postgis.geometry)": member909,
    "routine:$extension:postgis.st_orientedenvelope($extension:postgis.geometry)": member910,
    "routine:$extension:postgis.st_overlaps($extension:postgis.geometry,$extension:postgis.geometry)": member911,
    "routine:$extension:postgis.st_patchn($extension:postgis.geometry,pg_catalog.int4)": member912,
    "routine:$extension:postgis.st_perimeter($extension:postgis.geography,pg_catalog.bool)": member913,
    "routine:$extension:postgis.st_perimeter($extension:postgis.geometry)": member914,
    "routine:$extension:postgis.st_perimeter2d($extension:postgis.geometry)": member915,
    "routine:$extension:postgis.st_point(pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)": member916,
    "routine:$extension:postgis.st_point(pg_catalog.float8,pg_catalog.float8)": member917,
    "routine:$extension:postgis.st_pointfromgeohash(pg_catalog.text,pg_catalog.int4)": member918,
    "routine:$extension:postgis.st_pointfromtext(pg_catalog.text,pg_catalog.int4)": member919,
    "routine:$extension:postgis.st_pointfromtext(pg_catalog.text)": member920,
    "routine:$extension:postgis.st_pointfromwkb(pg_catalog.bytea,pg_catalog.int4)": member921,
    "routine:$extension:postgis.st_pointfromwkb(pg_catalog.bytea)": member922,
    "routine:$extension:postgis.st_pointinsidecircle($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member923,
    "routine:$extension:postgis.st_pointm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)":
      member924,
    "routine:$extension:postgis.st_pointn($extension:postgis.geometry,pg_catalog.int4)": member925,
    "routine:$extension:postgis.st_pointonsurface($extension:postgis.geometry)": member926,
    "routine:$extension:postgis.st_points($extension:postgis.geometry)": member927,
    "routine:$extension:postgis.st_pointz(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)":
      member928,
    "routine:$extension:postgis.st_pointzm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)":
      member929,
    "routine:$extension:postgis.st_polyfromtext(pg_catalog.text,pg_catalog.int4)": member930,
    "routine:$extension:postgis.st_polyfromtext(pg_catalog.text)": member931,
    "routine:$extension:postgis.st_polyfromwkb(pg_catalog.bytea,pg_catalog.int4)": member932,
    "routine:$extension:postgis.st_polyfromwkb(pg_catalog.bytea)": member933,
    "routine:$extension:postgis.st_polygon($extension:postgis.geometry,pg_catalog.int4)": member934,
    "routine:$extension:postgis.st_polygonfromtext(pg_catalog.text,pg_catalog.int4)": member935,
    "routine:$extension:postgis.st_polygonfromtext(pg_catalog.text)": member936,
    "routine:$extension:postgis.st_polygonfromwkb(pg_catalog.bytea,pg_catalog.int4)": member937,
    "routine:$extension:postgis.st_polygonfromwkb(pg_catalog.bytea)": member938,
    "routine:$extension:postgis.st_polygonize($extension:postgis._geometry)": member939,
    "routine:$extension:postgis.st_polygonize($extension:postgis.geometry)": member940,
    "routine:$extension:postgis.st_project($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)":
      member941,
    "routine:$extension:postgis.st_project($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)":
      member942,
    "routine:$extension:postgis.st_project($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member943,
    "routine:$extension:postgis.st_project($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": member944,
    "routine:$extension:postgis.st_quantizecoordinates($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)":
      member945,
    "routine:$extension:postgis.st_reduceprecision($extension:postgis.geometry,pg_catalog.float8)": member946,
    "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)":
      member947,
    "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.text)":
      member948,
    "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry)": member949,
    "routine:$extension:postgis.st_relatematch(pg_catalog.text,pg_catalog.text)": member950,
    "routine:$extension:postgis.st_removeirrelevantpointsforview($extension:postgis.geometry,$extension:postgis.box2d,pg_catalog.bool)":
      member951,
    "routine:$extension:postgis.st_removepoint($extension:postgis.geometry,pg_catalog.int4)": member952,
    "routine:$extension:postgis.st_removerepeatedpoints($extension:postgis.geometry,pg_catalog.float8)": member953,
    "routine:$extension:postgis.st_removesmallparts($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)":
      member954,
    "routine:$extension:postgis.st_reverse($extension:postgis.geometry)": member955,
    "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)":
      member956,
    "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member957,
    "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8)": member958,
    "routine:$extension:postgis.st_rotatex($extension:postgis.geometry,pg_catalog.float8)": member959,
    "routine:$extension:postgis.st_rotatey($extension:postgis.geometry,pg_catalog.float8)": member960,
    "routine:$extension:postgis.st_rotatez($extension:postgis.geometry,pg_catalog.float8)": member961,
    "routine:$extension:postgis.st_scale($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)":
      member962,
    "routine:$extension:postgis.st_scale($extension:postgis.geometry,$extension:postgis.geometry)": member963,
    "routine:$extension:postgis.st_scale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member964,
    "routine:$extension:postgis.st_scale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": member965,
    "routine:$extension:postgis.st_scroll($extension:postgis.geometry,$extension:postgis.geometry)": member966,
    "routine:$extension:postgis.st_segmentize($extension:postgis.geography,pg_catalog.float8)": member967,
    "routine:$extension:postgis.st_segmentize($extension:postgis.geometry,pg_catalog.float8)": member968,
    "routine:$extension:postgis.st_seteffectivearea($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)":
      member969,
    "routine:$extension:postgis.st_setpoint($extension:postgis.geometry,pg_catalog.int4,$extension:postgis.geometry)":
      member970,
    "routine:$extension:postgis.st_setsrid($extension:postgis.geography,pg_catalog.int4)": member971,
    "routine:$extension:postgis.st_setsrid($extension:postgis.geometry,pg_catalog.int4)": member972,
    "routine:$extension:postgis.st_sharedpaths($extension:postgis.geometry,$extension:postgis.geometry)": member973,
    "routine:$extension:postgis.st_shiftlongitude($extension:postgis.geometry)": member974,
    "routine:$extension:postgis.st_shortestline($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)":
      member975,
    "routine:$extension:postgis.st_shortestline($extension:postgis.geometry,$extension:postgis.geometry)": member976,
    "routine:$extension:postgis.st_shortestline(pg_catalog.text,pg_catalog.text)": member977,
    "routine:$extension:postgis.st_simplify($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)": member978,
    "routine:$extension:postgis.st_simplify($extension:postgis.geometry,pg_catalog.float8)": member979,
    "routine:$extension:postgis.st_simplifypolygonhull($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)":
      member980,
    "routine:$extension:postgis.st_simplifypreservetopology($extension:postgis.geometry,pg_catalog.float8)": member981,
    "routine:$extension:postgis.st_simplifyvw($extension:postgis.geometry,pg_catalog.float8)": member982,
    "routine:$extension:postgis.st_snap($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member983,
    "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member984,
    "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member985,
    "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)":
      member986,
    "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8)": member987,
    "routine:$extension:postgis.st_split($extension:postgis.geometry,$extension:postgis.geometry)": member988,
    "routine:$extension:postgis.st_square(pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry)":
      member989,
    "routine:$extension:postgis.st_squaregrid(pg_catalog.float8,$extension:postgis.geometry)": member990,
    "routine:$extension:postgis.st_srid($extension:postgis.geography)": member991,
    "routine:$extension:postgis.st_srid($extension:postgis.geometry)": member992,
    "routine:$extension:postgis.st_startpoint($extension:postgis.geometry)": member993,
    "routine:$extension:postgis.st_subdivide($extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)": member994,
    "routine:$extension:postgis.st_summary($extension:postgis.geography)": member995,
    "routine:$extension:postgis.st_summary($extension:postgis.geometry)": member996,
    "routine:$extension:postgis.st_swapordinates($extension:postgis.geometry,pg_catalog.cstring)": member997,
    "routine:$extension:postgis.st_symdifference($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member998,
    "routine:$extension:postgis.st_symmetricdifference($extension:postgis.geometry,$extension:postgis.geometry)":
      member999,
    "routine:$extension:postgis.st_tileenvelope(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8)":
      member1000,
    "routine:$extension:postgis.st_touches($extension:postgis.geometry,$extension:postgis.geometry)": member1001,
    "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.int4)": member1002,
    "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)": member1003,
    "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text,pg_catalog.text)": member1004,
    "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text)": member1005,
    "routine:$extension:postgis.st_transformpipeline($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)":
      member1006,
    "routine:$extension:postgis.st_translate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member1007,
    "routine:$extension:postgis.st_translate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)":
      member1008,
    "routine:$extension:postgis.st_transscale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
      member1009,
    "routine:$extension:postgis.st_triangulatepolygon($extension:postgis.geometry)": member1010,
    "routine:$extension:postgis.st_unaryunion($extension:postgis.geometry,pg_catalog.float8)": member1011,
    "routine:$extension:postgis.st_union($extension:postgis._geometry)": member1012,
    "routine:$extension:postgis.st_union($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)":
      member1013,
    "routine:$extension:postgis.st_union($extension:postgis.geometry,$extension:postgis.geometry)": member1014,
    "routine:$extension:postgis.st_union($extension:postgis.geometry,pg_catalog.float8)": member1015,
    "routine:$extension:postgis.st_union($extension:postgis.geometry)": member1016,
    "routine:$extension:postgis.st_voronoilines($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)":
      member1017,
    "routine:$extension:postgis.st_voronoipolygons($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)":
      member1018,
    "routine:$extension:postgis.st_within($extension:postgis.geometry,$extension:postgis.geometry)": member1019,
    "routine:$extension:postgis.st_wkbtosql(pg_catalog.bytea)": member1020,
    "routine:$extension:postgis.st_wkttosql(pg_catalog.text)": member1021,
    "routine:$extension:postgis.st_wrapx($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": member1022,
    "routine:$extension:postgis.st_x($extension:postgis.geometry)": member1023,
    "routine:$extension:postgis.st_xmax($extension:postgis.box3d)": member1024,
    "routine:$extension:postgis.st_xmin($extension:postgis.box3d)": member1025,
    "routine:$extension:postgis.st_y($extension:postgis.geometry)": member1026,
    "routine:$extension:postgis.st_ymax($extension:postgis.box3d)": member1027,
    "routine:$extension:postgis.st_ymin($extension:postgis.box3d)": member1028,
    "routine:$extension:postgis.st_z($extension:postgis.geometry)": member1029,
    "routine:$extension:postgis.st_zmax($extension:postgis.box3d)": member1030,
    "routine:$extension:postgis.st_zmflag($extension:postgis.geometry)": member1031,
    "routine:$extension:postgis.st_zmin($extension:postgis.box3d)": member1032,
    "routine:$extension:postgis.text($extension:postgis.geometry)": member1033,
  } as const;
  const functions = {
    _postgis_deprecate: member261,
    _postgis_index_extent: member262,
    _postgis_join_selectivity: member263,
    _postgis_pgsql_version: member264,
    _postgis_scripts_pgsql_version: member265,
    _postgis_selectivity: member266,
    _postgis_stats: member267,
    _st_3ddfullywithin: member268,
    _st_3ddwithin: member269,
    _st_3dintersects: member270,
    _st_asgml: member271,
    _st_asx3d: member272,
    _st_bestsrid: {
      "($extension:postgis.geography,$extension:postgis.geography)": member273,
      "($extension:postgis.geography)": member274,
    },
    _st_contains: member275,
    _st_containsproperly: member276,
    _st_coveredby: {
      "($extension:postgis.geography,$extension:postgis.geography)": member277,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member278,
    },
    _st_covers: {
      "($extension:postgis.geography,$extension:postgis.geography)": member279,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member280,
    },
    _st_crosses: member281,
    _st_dfullywithin: member282,
    _st_distancetree: {
      "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": member283,
      "($extension:postgis.geography,$extension:postgis.geography)": member284,
    },
    _st_distanceuncached: {
      "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": member285,
      "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": member286,
      "($extension:postgis.geography,$extension:postgis.geography)": member287,
    },
    _st_dwithin: {
      "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": member288,
      "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": member289,
    },
    _st_dwithinuncached: {
      "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": member290,
      "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)": member291,
    },
    _st_equals: member292,
    _st_expand: member293,
    _st_geomfromgml: member294,
    _st_intersects: member295,
    _st_linecrossingdirection: member296,
    _st_longestline: member297,
    _st_maxdistance: member298,
    _st_orderingequals: member299,
    _st_overlaps: member300,
    _st_pointoutside: member301,
    _st_sortablehash: member302,
    _st_touches: member303,
    _st_voronoi: member304,
    _st_within: member305,
    box: { "($extension:postgis.box3d)": member309, "($extension:postgis.geometry)": member310 },
    box2d: { "($extension:postgis.box3d)": member313, "($extension:postgis.geometry)": member314 },
    box3d: { "($extension:postgis.box2d)": member319, "($extension:postgis.geometry)": member320 },
    box3dtobox: member321,
    bytea: { "($extension:postgis.geography)": member322, "($extension:postgis.geometry)": member323 },
    contains_2d: {
      "($extension:postgis.box2df,$extension:postgis.box2df)": member324,
      "($extension:postgis.box2df,$extension:postgis.geometry)": member325,
      "($extension:postgis.geometry,$extension:postgis.box2df)": member326,
    },
    equals: member333,
    find_srid: member334,
    geography_cmp: member338,
    geography_distance_knn: member339,
    geography_eq: member340,
    geography_ge: member341,
    geography_gt: member350,
    geography_le: member352,
    geography_lt: member353,
    geography_overlaps: member355,
    geography_send: member357,
    geography: {
      "($extension:postgis.geography,pg_catalog.int4,pg_catalog.bool)": member366,
      "($extension:postgis.geometry)": member367,
      "(pg_catalog.bytea)": member368,
    },
    geometry_above: member375,
    geometry_below: member377,
    geometry_cmp: member378,
    geometry_contained_3d: member379,
    geometry_contains_3d: member380,
    geometry_contains_nd: member381,
    geometry_contains: member382,
    geometry_distance_box: member383,
    geometry_distance_centroid_nd: member384,
    geometry_distance_centroid: member385,
    geometry_distance_cpa: member386,
    geometry_eq: member387,
    geometry_ge: member388,
    geometry_gt: member406,
    geometry_hash: member407,
    geometry_le: member409,
    geometry_left: member410,
    geometry_lt: member411,
    geometry_neq: member412,
    geometry_overabove: member414,
    geometry_overbelow: member415,
    geometry_overlaps_3d: member416,
    geometry_overlaps_nd: member417,
    geometry_overlaps: member418,
    geometry_overleft: member419,
    geometry_overright: member420,
    geometry_right: member422,
    geometry_same_3d: member423,
    geometry_same_nd: member424,
    geometry_same: member425,
    geometry_send: member426,
    geometry_within_nd: member448,
    geometry_within: member449,
    geometry: {
      "($extension:postgis.box2d)": member450,
      "($extension:postgis.box3d)": member451,
      "($extension:postgis.geography)": member452,
      "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.bool)": member453,
      "(pg_catalog.bytea)": member454,
      "(pg_catalog.path)": member455,
      "(pg_catalog.point)": member456,
      "(pg_catalog.polygon)": member457,
      "(pg_catalog.text)": member458,
    },
    geometrytype: { "($extension:postgis.geography)": member459, "($extension:postgis.geometry)": member460 },
    geomfromewkb: member461,
    geomfromewkt: member462,
    get_proj4_from_srid: member463,
    is_contained_2d: {
      "($extension:postgis.box2df,$extension:postgis.box2df)": member470,
      "($extension:postgis.box2df,$extension:postgis.geometry)": member471,
      "($extension:postgis.geometry,$extension:postgis.box2df)": member472,
    },
    json: member473,
    jsonb: member474,
    overlaps_2d: {
      "($extension:postgis.box2df,$extension:postgis.box2df)": member475,
      "($extension:postgis.box2df,$extension:postgis.geometry)": member476,
      "($extension:postgis.geometry,$extension:postgis.box2df)": member477,
    },
    overlaps_geog: {
      "($extension:postgis.geography,$extension:postgis.gidx)": member478,
      "($extension:postgis.gidx,$extension:postgis.geography)": member479,
      "($extension:postgis.gidx,$extension:postgis.gidx)": member480,
    },
    overlaps_nd: {
      "($extension:postgis.geometry,$extension:postgis.gidx)": member481,
      "($extension:postgis.gidx,$extension:postgis.geometry)": member482,
      "($extension:postgis.gidx,$extension:postgis.gidx)": member483,
    },
    path: member484,
    point: member516,
    polygon: member517,
    postgis_addbbox: member520,
    postgis_constraint_dims: member522,
    postgis_constraint_srid: member523,
    postgis_constraint_type: member524,
    postgis_dropbbox: member525,
    postgis_full_version: member527,
    postgis_geos_compiled_version: member528,
    postgis_geos_noop: member529,
    postgis_geos_version: member530,
    postgis_getbbox: member531,
    postgis_hasbbox: member532,
    postgis_lib_build_date: member534,
    postgis_lib_revision: member535,
    postgis_lib_version: member536,
    postgis_libjson_version: member537,
    postgis_liblwgeom_version: member538,
    postgis_libprotobuf_version: member539,
    postgis_libxml_version: member540,
    postgis_noop: member541,
    postgis_proj_compiled_version: member542,
    postgis_proj_version: member543,
    postgis_scripts_build_date: member544,
    postgis_scripts_installed: member545,
    postgis_scripts_released: member546,
    postgis_srs_all: member547,
    postgis_srs_codes: member548,
    postgis_srs_search: member549,
    postgis_srs: member550,
    postgis_svn_version: member551,
    postgis_transform_geometry: member552,
    postgis_transform_pipeline_geometry: member553,
    postgis_type_name: member554,
    postgis_typmod_dims: member555,
    postgis_typmod_srid: member556,
    postgis_typmod_type: member557,
    postgis_version: member558,
    postgis_wagyu_version: member559,
    st_3dclosestpoint: member562,
    st_3ddfullywithin: member563,
    st_3ddistance: member564,
    st_3ddwithin: member565,
    st_3dextent: member566,
    st_3dintersects: member567,
    st_3dlength: member568,
    st_3dlineinterpolatepoint: member569,
    st_3dlongestline: member570,
    st_3dmakebox: member571,
    st_3dmaxdistance: member572,
    st_3dperimeter: member573,
    st_3dshortestline: member574,
    st_addmeasure: member575,
    st_addpoint: {
      "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)": member576,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member577,
    },
    st_affine: {
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
        member578,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
        member579,
    },
    st_angle: {
      "($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)":
        member580,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member581,
    },
    st_area: {
      "($extension:postgis.geography,pg_catalog.bool)": member582,
      "($extension:postgis.geometry)": member583,
      "(pg_catalog.text)": member584,
    },
    st_area2d: member585,
    st_asbinary: {
      "($extension:postgis.geography,pg_catalog.text)": member586,
      "($extension:postgis.geography)": member587,
      "($extension:postgis.geometry,pg_catalog.text)": member588,
      "($extension:postgis.geometry)": member589,
    },
    st_asencodedpolyline: member590,
    st_asewkb: {
      "($extension:postgis.geometry,pg_catalog.text)": member591,
      "($extension:postgis.geometry)": member592,
    },
    st_asewkt: {
      "($extension:postgis.geography,pg_catalog.int4)": member593,
      "($extension:postgis.geography)": member594,
      "($extension:postgis.geometry,pg_catalog.int4)": member595,
      "($extension:postgis.geometry)": member596,
      "(pg_catalog.text)": member597,
    },
    st_asflatgeobuf: {
      "(pg_catalog.anyelement,pg_catalog.bool,pg_catalog.text)": member598,
      "(pg_catalog.anyelement,pg_catalog.bool)": member599,
      "(pg_catalog.anyelement)": member600,
    },
    st_asgeobuf: { "(pg_catalog.anyelement,pg_catalog.text)": member601, "(pg_catalog.anyelement)": member602 },
    st_asgeojson: {
      "($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)": member603,
      "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": member604,
      "(pg_catalog.record,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.text)": member605,
      "(pg_catalog.text)": member606,
    },
    st_asgml: {
      "($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)": member607,
      "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": member608,
      "(pg_catalog.int4,$extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)":
        member609,
      "(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)":
        member610,
      "(pg_catalog.text)": member611,
    },
    st_ashexewkb: {
      "($extension:postgis.geometry,pg_catalog.text)": member612,
      "($extension:postgis.geometry)": member613,
    },
    st_askml: {
      "($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)": member614,
      "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)": member615,
      "(pg_catalog.text)": member616,
    },
    st_aslatlontext: member617,
    st_asmarc21: member618,
    st_asmvt: {
      "(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.text)": member619,
      "(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text)": member620,
      "(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4)": member621,
      "(pg_catalog.anyelement,pg_catalog.text)": member622,
      "(pg_catalog.anyelement)": member623,
    },
    st_asmvtgeom: member624,
    st_assvg: {
      "($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)": member625,
      "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": member626,
      "(pg_catalog.text)": member627,
    },
    st_astext: {
      "($extension:postgis.geography,pg_catalog.int4)": member628,
      "($extension:postgis.geography)": member629,
      "($extension:postgis.geometry,pg_catalog.int4)": member630,
      "($extension:postgis.geometry)": member631,
      "(pg_catalog.text)": member632,
    },
    st_astwkb: {
      "($extension:postgis._geometry,pg_catalog._int8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
        member633,
      "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
        member634,
    },
    st_asx3d: member635,
    st_azimuth: {
      "($extension:postgis.geography,$extension:postgis.geography)": member636,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member637,
    },
    st_bdmpolyfromtext: member638,
    st_bdpolyfromtext: member639,
    st_boundary: member640,
    st_boundingdiagonal: member641,
    st_box2dfromgeohash: member642,
    st_buffer: {
      "($extension:postgis.geography,pg_catalog.float8,pg_catalog.int4)": member643,
      "($extension:postgis.geography,pg_catalog.float8,pg_catalog.text)": member644,
      "($extension:postgis.geography,pg_catalog.float8)": member645,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)": member646,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text)": member647,
      "(pg_catalog.text,pg_catalog.float8,pg_catalog.int4)": member648,
      "(pg_catalog.text,pg_catalog.float8,pg_catalog.text)": member649,
      "(pg_catalog.text,pg_catalog.float8)": member650,
    },
    st_buildarea: member651,
    st_centroid: {
      "($extension:postgis.geography,pg_catalog.bool)": member652,
      "($extension:postgis.geometry)": member653,
      "(pg_catalog.text)": member654,
    },
    st_chaikinsmoothing: member655,
    st_cleangeometry: member656,
    st_clipbybox2d: member657,
    st_closestpoint: {
      "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": member658,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member659,
      "(pg_catalog.text,pg_catalog.text)": member660,
    },
    st_closestpointofapproach: member661,
    st_clusterdbscan: member662,
    st_clusterintersecting: { "($extension:postgis._geometry)": member663, "($extension:postgis.geometry)": member664 },
    st_clusterintersectingwin: member665,
    st_clusterkmeans: member666,
    st_clusterwithin: {
      "($extension:postgis._geometry,pg_catalog.float8)": member667,
      "($extension:postgis.geometry,pg_catalog.float8)": member668,
    },
    st_clusterwithinwin: member669,
    st_collect: {
      "($extension:postgis._geometry)": member670,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member671,
      "($extension:postgis.geometry)": member672,
    },
    st_collectionextract: {
      "($extension:postgis.geometry,pg_catalog.int4)": member673,
      "($extension:postgis.geometry)": member674,
    },
    st_collectionhomogenize: member675,
    st_combinebbox: {
      "($extension:postgis.box2d,$extension:postgis.geometry)": member676,
      "($extension:postgis.box3d,$extension:postgis.box3d)": member677,
      "($extension:postgis.box3d,$extension:postgis.geometry)": member678,
    },
    st_concavehull: member679,
    st_contains: member680,
    st_containsproperly: member681,
    st_convexhull: member682,
    st_coorddim: member683,
    st_coverageclean: member684,
    st_coverageinvalidedges: member685,
    st_coveragesimplify: member686,
    st_coverageunion: { "($extension:postgis._geometry)": member687, "($extension:postgis.geometry)": member688 },
    st_coveredby: {
      "($extension:postgis.geography,$extension:postgis.geography)": member689,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member690,
      "(pg_catalog.text,pg_catalog.text)": member691,
    },
    st_covers: {
      "($extension:postgis.geography,$extension:postgis.geography)": member692,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member693,
      "(pg_catalog.text,pg_catalog.text)": member694,
    },
    st_cpawithin: member695,
    st_crosses: member696,
    st_curven: member697,
    st_curvetoline: member698,
    st_delaunaytriangles: member699,
    st_dfullywithin: member700,
    st_difference: member701,
    st_dimension: member702,
    st_disjoint: member703,
    st_distance: {
      "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": member704,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member705,
      "(pg_catalog.text,pg_catalog.text)": member706,
    },
    st_distancecpa: member707,
    st_distancesphere: {
      "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": member708,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member709,
    },
    st_distancespheroid: {
      "($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.spheroid)": member710,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member711,
    },
    st_dump: member712,
    st_dumppoints: member713,
    st_dumprings: member714,
    st_dumpsegments: member715,
    st_dwithin: {
      "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": member716,
      "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": member717,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.float8)": member718,
    },
    st_endpoint: member719,
    st_envelope: member720,
    st_equals: member721,
    st_estimatedextent: {
      "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member722,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.text)": member723,
      "(pg_catalog.text,pg_catalog.text)": member724,
    },
    st_expand: {
      "($extension:postgis.box2d,pg_catalog.float8,pg_catalog.float8)": member725,
      "($extension:postgis.box2d,pg_catalog.float8)": member726,
      "($extension:postgis.box3d,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": member727,
      "($extension:postgis.box3d,pg_catalog.float8)": member728,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
        member729,
      "($extension:postgis.geometry,pg_catalog.float8)": member730,
    },
    st_extent: member731,
    st_exteriorring: member732,
    st_filterbym: member733,
    st_findextent: {
      "(pg_catalog.text,pg_catalog.text,pg_catalog.text)": member734,
      "(pg_catalog.text,pg_catalog.text)": member735,
    },
    st_flipcoordinates: member736,
    st_force2d: member737,
    st_force3d: member738,
    st_force3dm: member739,
    st_force3dz: member740,
    st_force4d: member741,
    st_forcecollection: member742,
    st_forcecurve: member743,
    st_forcepolygonccw: member744,
    st_forcepolygoncw: member745,
    st_forcerhr: member746,
    st_forcesfs: {
      "($extension:postgis.geometry,pg_catalog.text)": member747,
      "($extension:postgis.geometry)": member748,
    },
    st_frechetdistance: member749,
    st_fromflatgeobuf: member750,
    st_generatepoints: {
      "($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)": member752,
      "($extension:postgis.geometry,pg_catalog.int4)": member753,
    },
    st_geogfromtext: member754,
    st_geogfromwkb: member755,
    st_geographyfromtext: member756,
    st_geohash: {
      "($extension:postgis.geography,pg_catalog.int4)": member757,
      "($extension:postgis.geometry,pg_catalog.int4)": member758,
    },
    st_geomcollfromtext: { "(pg_catalog.text,pg_catalog.int4)": member759, "(pg_catalog.text)": member760 },
    st_geomcollfromwkb: { "(pg_catalog.bytea,pg_catalog.int4)": member761, "(pg_catalog.bytea)": member762 },
    st_geometricmedian: member763,
    st_geometryfromtext: { "(pg_catalog.text,pg_catalog.int4)": member764, "(pg_catalog.text)": member765 },
    st_geometryn: member766,
    st_geometrytype: member767,
    st_geomfromewkb: member768,
    st_geomfromewkt: member769,
    st_geomfromgeohash: member770,
    st_geomfromgeojson: {
      "(pg_catalog.json)": member771,
      "(pg_catalog.jsonb)": member772,
      "(pg_catalog.text)": member773,
    },
    st_geomfromgml: { "(pg_catalog.text,pg_catalog.int4)": member774, "(pg_catalog.text)": member775 },
    st_geomfromkml: member776,
    st_geomfrommarc21: member777,
    st_geomfromtext: { "(pg_catalog.text,pg_catalog.int4)": member778, "(pg_catalog.text)": member779 },
    st_geomfromtwkb: member780,
    st_geomfromwkb: { "(pg_catalog.bytea,pg_catalog.int4)": member781, "(pg_catalog.bytea)": member782 },
    st_gmltosql: { "(pg_catalog.text,pg_catalog.int4)": member783, "(pg_catalog.text)": member784 },
    st_hasarc: member785,
    st_hasm: member786,
    st_hasz: member787,
    st_hausdorffdistance: {
      "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": member788,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member789,
    },
    st_hexagon: member790,
    st_hexagongrid: member791,
    st_interiorringn: member792,
    st_interpolatepoint: member793,
    st_intersection: {
      "($extension:postgis.geography,$extension:postgis.geography)": member794,
      "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": member795,
      "(pg_catalog.text,pg_catalog.text)": member796,
    },
    st_intersects: {
      "($extension:postgis.geography,$extension:postgis.geography)": member797,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member798,
      "(pg_catalog.text,pg_catalog.text)": member799,
    },
    st_inversetransformpipeline: member800,
    st_isclosed: member801,
    st_iscollection: member802,
    st_isempty: member803,
    st_ispolygonccw: member804,
    st_ispolygoncw: member805,
    st_isring: member806,
    st_issimple: member807,
    st_isvalid: {
      "($extension:postgis.geometry,pg_catalog.int4)": member808,
      "($extension:postgis.geometry)": member809,
    },
    st_isvaliddetail: member810,
    st_isvalidreason: {
      "($extension:postgis.geometry,pg_catalog.int4)": member811,
      "($extension:postgis.geometry)": member812,
    },
    st_isvalidtrajectory: member813,
    st_largestemptycircle: member814,
    st_length: {
      "($extension:postgis.geography,pg_catalog.bool)": member815,
      "($extension:postgis.geometry)": member816,
      "(pg_catalog.text)": member817,
    },
    st_length2d: member818,
    st_length2dspheroid: member819,
    st_lengthspheroid: member820,
    st_letters: member821,
    st_linecrossingdirection: member822,
    st_lineextend: member823,
    st_linefromencodedpolyline: member824,
    st_linefrommultipoint: member825,
    st_linefromtext: { "(pg_catalog.text,pg_catalog.int4)": member826, "(pg_catalog.text)": member827 },
    st_linefromwkb: { "(pg_catalog.bytea,pg_catalog.int4)": member828, "(pg_catalog.bytea)": member829 },
    st_lineinterpolatepoint: {
      "($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)": member830,
      "($extension:postgis.geometry,pg_catalog.float8)": member831,
      "(pg_catalog.text,pg_catalog.float8)": member832,
    },
    st_lineinterpolatepoints: {
      "($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)": member833,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)": member834,
      "(pg_catalog.text,pg_catalog.float8)": member835,
    },
    st_linelocatepoint: {
      "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": member836,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member837,
      "(pg_catalog.text,pg_catalog.text)": member838,
    },
    st_linemerge: {
      "($extension:postgis.geometry,pg_catalog.bool)": member839,
      "($extension:postgis.geometry)": member840,
    },
    st_linestringfromwkb: { "(pg_catalog.bytea,pg_catalog.int4)": member841, "(pg_catalog.bytea)": member842 },
    st_linesubstring: {
      "($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)": member843,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": member844,
      "(pg_catalog.text,pg_catalog.float8,pg_catalog.float8)": member845,
    },
    st_linetocurve: member846,
    st_locatealong: member847,
    st_locatebetween: member848,
    st_locatebetweenelevations: member849,
    st_longestline: member850,
    st_m: member851,
    st_makebox2d: member852,
    st_makeenvelope: member853,
    st_makeline: {
      "($extension:postgis._geometry)": member854,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member855,
      "($extension:postgis.geometry)": member856,
    },
    st_makepoint: {
      "(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": member857,
      "(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": member858,
      "(pg_catalog.float8,pg_catalog.float8)": member859,
    },
    st_makepointm: member860,
    st_makepolygon: {
      "($extension:postgis.geometry,$extension:postgis._geometry)": member861,
      "($extension:postgis.geometry)": member862,
    },
    st_makevalid: {
      "($extension:postgis.geometry,pg_catalog.text)": member863,
      "($extension:postgis.geometry)": member864,
    },
    st_maxdistance: member865,
    st_maximuminscribedcircle: member866,
    st_memcollect: member867,
    st_memsize: member868,
    st_memunion: member869,
    st_minimumboundingcircle: member870,
    st_minimumboundingradius: member871,
    st_minimumclearance: member872,
    st_minimumclearanceline: member873,
    st_mlinefromtext: { "(pg_catalog.text,pg_catalog.int4)": member874, "(pg_catalog.text)": member875 },
    st_mlinefromwkb: { "(pg_catalog.bytea,pg_catalog.int4)": member876, "(pg_catalog.bytea)": member877 },
    st_mpointfromtext: { "(pg_catalog.text,pg_catalog.int4)": member878, "(pg_catalog.text)": member879 },
    st_mpointfromwkb: { "(pg_catalog.bytea,pg_catalog.int4)": member880, "(pg_catalog.bytea)": member881 },
    st_mpolyfromtext: { "(pg_catalog.text,pg_catalog.int4)": member882, "(pg_catalog.text)": member883 },
    st_mpolyfromwkb: { "(pg_catalog.bytea,pg_catalog.int4)": member884, "(pg_catalog.bytea)": member885 },
    st_multi: member886,
    st_multilinefromwkb: member887,
    st_multilinestringfromtext: { "(pg_catalog.text,pg_catalog.int4)": member888, "(pg_catalog.text)": member889 },
    st_multipointfromtext: member890,
    st_multipointfromwkb: { "(pg_catalog.bytea,pg_catalog.int4)": member891, "(pg_catalog.bytea)": member892 },
    st_multipolyfromwkb: { "(pg_catalog.bytea,pg_catalog.int4)": member893, "(pg_catalog.bytea)": member894 },
    st_multipolygonfromtext: { "(pg_catalog.text,pg_catalog.int4)": member895, "(pg_catalog.text)": member896 },
    st_ndims: member897,
    st_node: member898,
    st_normalize: member899,
    st_npoints: member900,
    st_nrings: member901,
    st_numcurves: member902,
    st_numgeometries: member903,
    st_numinteriorring: member904,
    st_numinteriorrings: member905,
    st_numpatches: member906,
    st_numpoints: member907,
    st_offsetcurve: member908,
    st_orderingequals: member909,
    st_orientedenvelope: member910,
    st_overlaps: member911,
    st_patchn: member912,
    st_perimeter: {
      "($extension:postgis.geography,pg_catalog.bool)": member913,
      "($extension:postgis.geometry)": member914,
    },
    st_perimeter2d: member915,
    st_point: {
      "(pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)": member916,
      "(pg_catalog.float8,pg_catalog.float8)": member917,
    },
    st_pointfromgeohash: member918,
    st_pointfromtext: { "(pg_catalog.text,pg_catalog.int4)": member919, "(pg_catalog.text)": member920 },
    st_pointfromwkb: { "(pg_catalog.bytea,pg_catalog.int4)": member921, "(pg_catalog.bytea)": member922 },
    st_pointinsidecircle: member923,
    st_pointm: member924,
    st_pointn: member925,
    st_pointonsurface: member926,
    st_points: member927,
    st_pointz: member928,
    st_pointzm: member929,
    st_polyfromtext: { "(pg_catalog.text,pg_catalog.int4)": member930, "(pg_catalog.text)": member931 },
    st_polyfromwkb: { "(pg_catalog.bytea,pg_catalog.int4)": member932, "(pg_catalog.bytea)": member933 },
    st_polygon: member934,
    st_polygonfromtext: { "(pg_catalog.text,pg_catalog.int4)": member935, "(pg_catalog.text)": member936 },
    st_polygonfromwkb: { "(pg_catalog.bytea,pg_catalog.int4)": member937, "(pg_catalog.bytea)": member938 },
    st_polygonize: { "($extension:postgis._geometry)": member939, "($extension:postgis.geometry)": member940 },
    st_project: {
      "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)": member941,
      "($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)": member942,
      "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": member943,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": member944,
    },
    st_quantizecoordinates: member945,
    st_reduceprecision: member946,
    st_relate: {
      "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)": member947,
      "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.text)": member948,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member949,
    },
    st_relatematch: member950,
    st_removeirrelevantpointsforview: member951,
    st_removepoint: member952,
    st_removerepeatedpoints: member953,
    st_removesmallparts: member954,
    st_reverse: member955,
    st_rotate: {
      "($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)": member956,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": member957,
      "($extension:postgis.geometry,pg_catalog.float8)": member958,
    },
    st_rotatex: member959,
    st_rotatey: member960,
    st_rotatez: member961,
    st_scale: {
      "($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)": member962,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member963,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": member964,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": member965,
    },
    st_scroll: member966,
    st_segmentize: {
      "($extension:postgis.geography,pg_catalog.float8)": member967,
      "($extension:postgis.geometry,pg_catalog.float8)": member968,
    },
    st_seteffectivearea: member969,
    st_setpoint: member970,
    st_setsrid: {
      "($extension:postgis.geography,pg_catalog.int4)": member971,
      "($extension:postgis.geometry,pg_catalog.int4)": member972,
    },
    st_sharedpaths: member973,
    st_shiftlongitude: member974,
    st_shortestline: {
      "($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)": member975,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member976,
      "(pg_catalog.text,pg_catalog.text)": member977,
    },
    st_simplify: {
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)": member978,
      "($extension:postgis.geometry,pg_catalog.float8)": member979,
    },
    st_simplifypolygonhull: member980,
    st_simplifypreservetopology: member981,
    st_simplifyvw: member982,
    st_snap: member983,
    st_snaptogrid: {
      "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
        member984,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)":
        member985,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": member986,
      "($extension:postgis.geometry,pg_catalog.float8)": member987,
    },
    st_split: member988,
    st_square: member989,
    st_squaregrid: member990,
    st_srid: { "($extension:postgis.geography)": member991, "($extension:postgis.geometry)": member992 },
    st_startpoint: member993,
    st_subdivide: member994,
    st_summary: { "($extension:postgis.geography)": member995, "($extension:postgis.geometry)": member996 },
    st_swapordinates: member997,
    st_symdifference: member998,
    st_symmetricdifference: member999,
    st_tileenvelope: member1000,
    st_touches: member1001,
    st_transform: {
      "($extension:postgis.geometry,pg_catalog.int4)": member1002,
      "($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)": member1003,
      "($extension:postgis.geometry,pg_catalog.text,pg_catalog.text)": member1004,
      "($extension:postgis.geometry,pg_catalog.text)": member1005,
    },
    st_transformpipeline: member1006,
    st_translate: {
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)": member1007,
      "($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)": member1008,
    },
    st_transscale: member1009,
    st_triangulatepolygon: member1010,
    st_unaryunion: member1011,
    st_union: {
      "($extension:postgis._geometry)": member1012,
      "($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)": member1013,
      "($extension:postgis.geometry,$extension:postgis.geometry)": member1014,
      "($extension:postgis.geometry,pg_catalog.float8)": member1015,
      "($extension:postgis.geometry)": member1016,
    },
    st_voronoilines: member1017,
    st_voronoipolygons: member1018,
    st_within: member1019,
    st_wkbtosql: member1020,
    st_wkttosql: member1021,
    st_wrapx: member1022,
    st_x: member1023,
    st_xmax: member1024,
    st_xmin: member1025,
    st_y: member1026,
    st_ymax: member1027,
    st_ymin: member1028,
    st_z: member1029,
    st_zmax: member1030,
    st_zmflag: member1031,
    st_zmin: member1032,
    text: member1033,
  } as const;
  const { fields, arrayFields, triggers, indexes } = createPostgisSchemaSurface(descriptor);
  const { views, tables } = createPostgisRelationSurface(descriptor);
  function sameSemantics(left: ExtensionSqlInput<typeof nc4>, right: ExtensionSqlInput<typeof nc4>) {
    if (left && right && "kind" in left && "kind" in right && left.srid !== right.srid)
      throw new Error("PostGIS geometry arguments require equal SRIDs");
  }
  return bindExtension(descriptor, {
    geometry: {
      codec: c4,
      field: fields.geometry,
      ewkb: geometryEwkb,
      ewkt: geometryEwkt,
      distance: (...values: Parameters<typeof member705>) => {
        sameSemantics(values[0], values[1]);
        return member705(...values);
      },
      distanceUnits: "coordinate-system" as const,
    },
    geography: {
      codec: c3,
      field: fields.geography,
      ewkb: geographyEwkb,
      ewkt: geographyEwkt,
      distance: member704,
      distanceUnits: "meters" as const,
    },
    codecs: {
      box2d: c0,
      box2df: c1,
      box3d: c2,
      geography: c3,
      geometry: c4,
      gidx: c5,
      spheroid: c6,
      _box2d: c31,
      _box2df: c32,
      _box3d: c33,
      _geography: c34,
      _geometry: c35,
      _gidx: c36,
      _spheroid: c37,
      geography_columns: c38,
      geometry_columns: c39,
      geometry_dump: c40,
      spatial_ref_sys: c41,
      valid_detail: c42,
      _geography_columns: c43,
      _geometry_columns: c44,
      _geometry_dump: c45,
      _spatial_ref_sys: c46,
      _valid_detail: c47,
    },
    fields,
    arrayFields,
    triggers,
    indexes,
    views,
    tables,
    sql: {
      functions,
      overloads,
      rows: {
        "routine:$extension:postgis.postgis_srs_all()": rows547,
        "routine:$extension:postgis.postgis_srs_search($extension:postgis.geometry,pg_catalog.text)": rows549,
        "routine:$extension:postgis.postgis_srs(pg_catalog.text,pg_catalog.text)": rows550,
        "routine:$extension:postgis.st_hexagongrid(pg_catalog.float8,$extension:postgis.geometry)": rows791,
        "routine:$extension:postgis.st_squaregrid(pg_catalog.float8,$extension:postgis.geometry)": rows990,
      },
    },
  });
}
