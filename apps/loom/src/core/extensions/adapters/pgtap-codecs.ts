import * as v from "valibot";
import {
  arrayCodec,
  booleanCodec,
  compositeCodec,
  createExtensionCodec,
  nullableCodec,
  numericCodec,
  textCodec,
  withCodecSqlType,
  type CodecInput,
  type CodecOutput,
  type ExtensionCodec,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import type { ExtensionDescriptor } from "../bindings";
import { createExtensionField, type ExtensionValueSchema } from "../fields";

const oid = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(4294967295));
const oidCodec = createExtensionCodec({
  id: "pg:oid:unsigned32:1",
  sqlType: { schema: "pg_catalog", name: "oid" },
  input: oid,
  output: oid,
  transport: "text",
  encode: String,
  decode: (value) => (v.is(v.string(), value) ? Number(v.parse(v.pipe(v.string(), v.regex(/^\d+$/)), value)) : value),
});
const small = v.pipe(v.number(), v.integer(), v.minValue(-32768), v.maxValue(32767));
const int2Codec = createExtensionCodec({
  id: "pg:int2:1",
  sqlType: { schema: "pg_catalog", name: "int2" },
  input: small,
  output: small,
  transport: "text",
  encode: String,
  decode: (value) => (v.is(v.string(), value) ? Number(v.parse(v.pipe(v.string(), v.regex(/^-?\d+$/)), value)) : value),
});
const typedText = (name: string) => withCodecSqlType(textCodec, { schema: "pg_catalog", name });
const nameCodec = typedText("name");
const n = nullableCodec;
export const pgtapTimeTrialFields = Object.freeze({ a_time: n(numericCodec) });
export const pgtapForeignKeyFields = Object.freeze({
  fk_schema_name: n(nameCodec),
  fk_table_name: n(nameCodec),
  fk_constraint_name: n(nameCodec),
  fk_table_oid: n(oidCodec),
  fk_columns: n(arrayCodec(nameCodec)),
  pk_schema_name: n(nameCodec),
  pk_table_name: n(nameCodec),
  pk_constraint_name: n(nameCodec),
  pk_table_oid: n(oidCodec),
  pk_index_name: n(nameCodec),
  pk_columns: n(arrayCodec(nameCodec)),
  match_type: n(textCodec),
  on_delete: n(textCodec),
  on_update: n(textCodec),
  is_deferrable: n(booleanCodec),
  is_deferred: n(booleanCodec),
});
export const pgtapFunctionFields = Object.freeze({
  oid: n(oidCodec),
  schema: n(nameCodec),
  name: n(nameCodec),
  owner: n(nameCodec),
  args: n(textCodec),
  returns: n(textCodec),
  langoid: n(oidCodec),
  is_strict: n(booleanCodec),
  kind: n(typedText("char")),
  is_definer: n(booleanCodec),
  returns_set: n(booleanCodec),
  volatility: n(typedText("bpchar")),
  is_visible: n(booleanCodec),
});
export function pgtapCodecs(schema: string) {
  const time = withCodecSqlType(compositeCodec("pgtap:1.3.3:time", pgtapTimeTrialFields), {
    schema,
    name: "_time_trial_type",
  });
  const foreignKey = withCodecSqlType(compositeCodec("pgtap:1.3.3:foreign-key", pgtapForeignKeyFields), {
    schema,
    name: "pg_all_foreign_keys",
  });
  const funky = withCodecSqlType(compositeCodec("pgtap:1.3.3:function", pgtapFunctionFields), {
    schema,
    name: "tap_funky",
  });
  return Object.freeze({
    text: n(textCodec),
    name: n(nameCodec),
    bpchar: n(typedText("bpchar")),
    char: n(typedText("char")),
    varchar: n(typedText("varchar")),
    refcursor: n(typedText("refcursor")),
    regtype: n(typedText("regtype")),
    bool: n(booleanCodec),
    int4: n(int4Codec),
    int2: n(int2Codec),
    oid: n(oidCodec),
    numeric: n(numericCodec),
    _text: n(arrayCodec(textCodec)),
    _name: n(arrayCodec(nameCodec)),
    _bpchar: n(arrayCodec(typedText("bpchar"))),
    _varchar: n(arrayCodec(typedText("varchar"))),
    _int4: n(arrayCodec(int4Codec)),
    _int2: n(arrayCodec(int2Codec)),
    _oid: n(arrayCodec(oidCodec)),
    _time_trial_type: n(time),
    __time_trial_type: n(arrayCodec(time)),
    pg_all_foreign_keys: n(foreignKey),
    _pg_all_foreign_keys: n(arrayCodec(foreignKey)),
    tap_funky: n(funky),
    _tap_funky: n(arrayCodec(funky)),
  });
}
export type PgtapCodecs = ReturnType<typeof pgtapCodecs>;
export type PgtapCodecName = keyof PgtapCodecs;
export type PgtapInput<Name extends PgtapCodecName> = CodecInput<PgtapCodecs[Name]>;
export type PgtapOutput<Name extends PgtapCodecName> = CodecOutput<PgtapCodecs[Name]>;

const nullableValue = (value: ExtensionValueSchema): ExtensionValueSchema => ({
  kind: "union",
  variants: [value, { kind: "null" }],
});
const stringValue = nullableValue({ kind: "string" });
const booleanValue = nullableValue({ kind: "boolean" });
const oidValue = nullableValue({ kind: "number", integer: true, minimum: 0, maximum: 4294967295 });
const decimalValue = nullableValue({
  kind: "union",
  variants: [
    { kind: "string" },
    { kind: "object", properties: { nonfinite: { kind: "string", enum: ["NaN", "Infinity", "-Infinity"] } } },
  ],
});
/** PostgreSQL supports at most six array dimensions; the paired codec checks shape and bounds. */
function arrayValue(element: ExtensionValueSchema): ExtensionValueSchema {
  const leaf = nullableValue(element);
  let nested = leaf;
  for (let depth = 0; depth < 5; depth++)
    nested = { kind: "union", variants: [leaf, { kind: "array", items: nested }] };
  return nullableValue({
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
      values: { kind: "array", items: nested },
    },
  });
}
const timeValue: ExtensionValueSchema = { kind: "object", properties: { a_time: decimalValue } };
const foreignKeyValue: ExtensionValueSchema = {
  kind: "object",
  properties: {
    fk_schema_name: stringValue,
    fk_table_name: stringValue,
    fk_constraint_name: stringValue,
    fk_table_oid: oidValue,
    fk_columns: arrayValue({ kind: "string" }),
    pk_schema_name: stringValue,
    pk_table_name: stringValue,
    pk_constraint_name: stringValue,
    pk_table_oid: oidValue,
    pk_index_name: stringValue,
    pk_columns: arrayValue({ kind: "string" }),
    match_type: stringValue,
    on_delete: stringValue,
    on_update: stringValue,
    is_deferrable: booleanValue,
    is_deferred: booleanValue,
  },
};
const functionValue: ExtensionValueSchema = {
  kind: "object",
  properties: {
    oid: oidValue,
    schema: stringValue,
    name: stringValue,
    owner: stringValue,
    args: stringValue,
    returns: stringValue,
    langoid: oidValue,
    is_strict: booleanValue,
    kind: stringValue,
    is_definer: booleanValue,
    returns_set: booleanValue,
    volatility: stringValue,
    is_visible: booleanValue,
  },
};
/** Exact six captured custom types, including their native array types, have schema storage builders. */
export function pgtapFields(descriptor: ExtensionDescriptor<"pgtap", { version: "1.3.3"; schema: string }>) {
  const codecs = pgtapCodecs(descriptor.schema);
  const search = { filter: false, comparison: false, order: false, text: false } as const;
  function field<Value>(
    name: string,
    type: string,
    codec: ExtensionCodec<Value, Value>,
    value: ExtensionValueSchema,
    array = false,
  ) {
    return () =>
      createExtensionField({
        extension: descriptor,
        member: `type:$extension:pgtap.${name}`,
        type,
        array,
        codec,
        value,
        search,
      });
  }
  return Object.freeze({
    _time_trial_type: field("_time_trial_type", "_time_trial_type", codecs._time_trial_type, nullableValue(timeValue)),
    __time_trial_type: field(
      "__time_trial_type",
      "_time_trial_type",
      codecs.__time_trial_type,
      arrayValue(timeValue),
      true,
    ),
    pg_all_foreign_keys: field(
      "pg_all_foreign_keys",
      "pg_all_foreign_keys",
      codecs.pg_all_foreign_keys,
      nullableValue(foreignKeyValue),
    ),
    _pg_all_foreign_keys: field(
      "_pg_all_foreign_keys",
      "pg_all_foreign_keys",
      codecs._pg_all_foreign_keys,
      arrayValue(foreignKeyValue),
      true,
    ),
    tap_funky: field("tap_funky", "tap_funky", codecs.tap_funky, nullableValue(functionValue)),
    _tap_funky: field("_tap_funky", "tap_funky", codecs._tap_funky, arrayValue(functionValue), true),
  });
}

declare const parameterBrand: unique symbol;
/** A concrete codec determines polymorphic PostgreSQL parameters; it never asserts a result type. */
export interface PgtapParameter {
  readonly [parameterBrand]: true;
}
const parameters = new WeakMap<PgtapParameter, { codec: ExtensionCodec<never, unknown>; value: unknown }>();
export function pgtapParameter<Input, Output>(codec: ExtensionCodec<Input, Output>, value: Input): PgtapParameter {
  if (!codec.sqlType) throw new Error("A pgTAP polymorphic parameter requires a concrete SQL type");
  // SAFETY: opaque values are issued only here and the matching codec checks their encoded input.
  const parameter = Object.freeze({}) as PgtapParameter;
  parameters.set(parameter, { codec, value });
  return parameter;
}
/** Family construction only; a caller cannot supply an unchecked codec/value pair. */
export function resolvePgtapParameter(value: PgtapParameter, array: boolean) {
  const parameter = parameters.get(value);
  if (!parameter || (array && !parameter.codec.sqlType?.array))
    throw new Error("Expected a concrete pgTAP polymorphic parameter");
  return parameter;
}
