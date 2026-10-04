import pg from "pg";
import * as v from "valibot";
import {
  arrayCodec,
  compositeCodec,
  createExtensionCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
  type CompositeOutput,
} from "../codecs";

const decodeBooleanText = pg.types.getTypeParser(pg.types.builtins.BOOL, "text");
// Composite encoding emits true/false; PostgreSQL record output emits t/f.
const booleanTextCodec = createExtensionCodec({
  id: "pg:bool:text:1",
  sqlType: { schema: "pg_catalog", name: "bool" },
  input: v.boolean(),
  output: v.boolean(),
  transport: "text",
  encode: String,
  decode: (value) =>
    v.is(v.boolean(), value) ? value : decodeBooleanText(v.parse(v.picklist(["t", "f", "true", "false"]), value)),
});

const oid = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(4294967295));
export const hypopgOidCodec = createExtensionCodec({
  id: "pg:oid:unsigned32:1",
  sqlType: { schema: "pg_catalog", name: "oid" },
  input: oid,
  output: oid,
  transport: "text",
  encode: String,
  decode: (value) => v.parse(v.union([oid, v.pipe(v.string(), v.regex(/^\d+$/), v.transform(Number))]), value),
});
const int4 = v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647));
const int4Codec = createExtensionCodec({
  id: "pg:int4:1",
  sqlType: { schema: "pg_catalog", name: "int4" },
  input: int4,
  output: int4,
  transport: "text",
  encode: String,
  decode: (value) => v.parse(v.union([int4, v.pipe(v.string(), v.regex(/^-?\d+$/), v.transform(Number))]), value),
});
// Vectors and pg_node_tree are PostgreSQL text, not JS arrays or reconstructed expression trees.
const nameCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "name" });
const int2vectorCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "int2vector" });
const oidvectorCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "oidvector" });
const nodeTreeCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "pg_node_tree" });

export const hypopgCreatedFields = Object.freeze({ indexrelid: hypopgOidCodec, indexname: textCodec });
export const hypopgIndexFields = Object.freeze({
  indexname: textCodec,
  indexrelid: hypopgOidCodec,
  indrelid: hypopgOidCodec,
  innatts: int4Codec,
  indisunique: booleanTextCodec,
  indkey: int2vectorCodec,
  indcollation: oidvectorCodec,
  indclass: oidvectorCodec,
  indoption: nullableCodec(oidvectorCodec),
  indexprs: nullableCodec(nodeTreeCodec),
  indpred: nullableCodec(nodeTreeCodec),
  amid: hypopgOidCodec,
});
export const hypopgHiddenOidFields = Object.freeze({ indexid: hypopgOidCodec });
/** Captured view/composite attributes are nullable, including LEFT JOIN catalogue names. */
export const hypopgListFields = Object.freeze({
  indexrelid: nullableCodec(hypopgOidCodec),
  index_name: nullableCodec(textCodec),
  schema_name: nullableCodec(nameCodec),
  table_name: nullableCodec(nameCodec),
  am_name: nullableCodec(nameCodec),
});
export const hypopgHiddenFields = Object.freeze({
  indexrelid: nullableCodec(hypopgOidCodec),
  index_name: nullableCodec(nameCodec),
  schema_name: nullableCodec(nameCodec),
  table_name: nullableCodec(nameCodec),
  am_name: nullableCodec(nameCodec),
  is_hypo: nullableCodec(booleanTextCodec),
});
export const hypopgCreatedCodec = compositeCodec("hypopg:1.4.3:create", hypopgCreatedFields);
export const hypopgIndexCodec = compositeCodec("hypopg:1.4.3:index", hypopgIndexFields);
export const hypopgListCodec = compositeCodec("hypopg:1.4.3:list", hypopgListFields);
export const hypopgHiddenCodec = compositeCodec("hypopg:1.4.3:hidden", hypopgHiddenFields);
export const hypopgListArrayCodec = arrayCodec(hypopgListCodec);
export const hypopgHiddenArrayCodec = arrayCodec(hypopgHiddenCodec);
export type HypopgCreatedIndex = CompositeOutput<typeof hypopgCreatedFields>;
export type HypopgIndex = CompositeOutput<typeof hypopgIndexFields>;
export type HypopgListedIndex = CompositeOutput<typeof hypopgListFields>;
export type HypopgHiddenIndex = CompositeOutput<typeof hypopgHiddenFields>;
