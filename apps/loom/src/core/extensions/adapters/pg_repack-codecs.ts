import * as v from "valibot";
import {
  arrayCodec,
  booleanCodec,
  compositeCodec,
  createExtensionCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
  type CompositeOutput,
} from "../codecs";

const oid = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(4294967295));
export const pgRepackOidCodec = createExtensionCodec({
  id: "pg:oid:unsigned32:1",
  sqlType: { schema: "pg_catalog", name: "oid" },
  input: oid,
  output: oid,
  transport: "text",
  encode: String,
  decode: (value) => v.parse(v.union([oid, v.pipe(v.string(), v.regex(/^\d+$/), v.transform(Number))]), value),
});
const int4 = v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647));
export const pgRepackInt4Codec = createExtensionCodec({
  id: "pg:int4:1",
  sqlType: { schema: "pg_catalog", name: "int4" },
  input: int4,
  output: int4,
  transport: "text",
  encode: String,
  decode: (value) => v.parse(v.union([int4, v.pipe(v.string(), v.regex(/^-?\d+$/), v.transform(Number))]), value),
});
export const pgRepackNameCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "name" });
export const pgRepackRegclassCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "regclass" });
export const pgRepackCstringCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "cstring" });
export const pgRepackVoidCodec = createExtensionCodec({
  id: "pg:void:1",
  sqlType: { schema: "pg_catalog", name: "void" },
  input: v.null(),
  output: v.null(),
  transport: "text",
  encode: () => null,
  decode: (value) => {
    v.parse(v.union([v.literal(""), v.null(), v.undefined()]), value);
    return null;
  },
});

export const pgRepackPrimaryKeyFields = Object.freeze({
  indrelid: nullableCodec(pgRepackOidCodec),
  indexrelid: nullableCodec(pgRepackOidCodec),
});
export const pgRepackTableFields = Object.freeze({
  relname: nullableCodec(textCodec),
  relid: nullableCodec(pgRepackOidCodec),
  reltoastrelid: nullableCodec(pgRepackOidCodec),
  reltoastidxid: nullableCodec(pgRepackOidCodec),
  schemaname: nullableCodec(pgRepackNameCodec),
  pkid: nullableCodec(pgRepackOidCodec),
  ckid: nullableCodec(pgRepackOidCodec),
  create_pktype: nullableCodec(textCodec),
  create_log: nullableCodec(textCodec),
  create_trigger: nullableCodec(textCodec),
  enable_trigger: nullableCodec(textCodec),
  create_table: nullableCodec(textCodec),
  tablespace_orig: nullableCodec(pgRepackNameCodec),
  copy_data: nullableCodec(textCodec),
  alter_col_storage: nullableCodec(textCodec),
  drop_columns: nullableCodec(textCodec),
  delete_log: nullableCodec(textCodec),
  lock_table: nullableCodec(textCodec),
  ckey: nullableCodec(textCodec),
  sql_peek: nullableCodec(textCodec),
  sql_insert: nullableCodec(textCodec),
  sql_delete: nullableCodec(textCodec),
  sql_update: nullableCodec(textCodec),
  sql_pop: nullableCodec(textCodec),
});

export const pgRepackPrimaryKeyCodec = compositeCodec("pg_repack:1.5.2:primary_keys", pgRepackPrimaryKeyFields);
export const pgRepackTableCodec = compositeCodec("pg_repack:1.5.2:tables", pgRepackTableFields);
export const pgRepackPrimaryKeyArrayCodec = arrayCodec(pgRepackPrimaryKeyCodec);
export const pgRepackTableArrayCodec = arrayCodec(pgRepackTableCodec);
export const pgRepackRegclassArrayCodec = arrayCodec(pgRepackRegclassCodec);

export type PgRepackPrimaryKey = CompositeOutput<typeof pgRepackPrimaryKeyFields>;
export type PgRepackTable = CompositeOutput<typeof pgRepackTableFields>;
