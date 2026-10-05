import * as v from "valibot";
import type { AnyColumn, SQL } from "drizzle-orm";
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
  type CodecInput,
  type CodecOutput,
  type ExtensionCodec,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { timestampCodec, timestamptzCodec } from "../native-timestamp-codecs";
import { float4Codec, int2Codec } from "../primitive-number-codecs";

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
const typedText = (name: string) => withCodecSqlType(textCodec, { schema: "pg_catalog", name });
const interval = v.pipe(
  v.string(),
  v.regex(
    /^(?:-?infinity|(?=[+\-\d])(?:[+-]?\d+ years?(?: |$))?(?:[+-]?\d+ mons?(?: |$))?(?:[+-]?\d+ days?(?: |$))?(?:[+-]?\d+:\d{2}:\d{2}(?:\.\d{1,6})?)?)$/,
  ),
);
const intervalCodec = createExtensionCodec({
  id: "pg:interval:postgres:1",
  sqlType: { schema: "pg_catalog", name: "interval" },
  input: interval,
  output: interval,
  transport: "text",
  encode: (value) => value,
  decode: (value) => value,
});
const dateCodec = createExtensionCodec({
  id: "pg:date:iso:1",
  sqlType: { schema: "pg_catalog", name: "date" },
  input: v.string(),
  output: v.string(),
  transport: "text",
  encode: (value) => value,
  decode: (value) => value,
});
const timeCodec = typedText("time");
const range = (name: string) => typedText(name);
const n = nullableCodec;

export const anonDetectFields = Object.freeze({
  table_name: n(typedText("regclass")),
  column_name: n(typedText("name")),
  identifiers_category: n(textCodec),
  direct: n(booleanCodec),
});
export const anonMaskColumnsFields = Object.freeze({
  attname: n(typedText("name")),
  masking_filter: n(textCodec),
  format_type: n(textCodec),
});
export const anonMaskingRuleFields = Object.freeze({
  attrelid: n(oidCodec),
  attnum: n(int4Codec),
  relnamespace: n(typedText("regnamespace")),
  relname: n(typedText("name")),
  attname: n(typedText("name")),
  format_type: n(textCodec),
  col_description: n(textCodec),
  masking_function: n(textCodec),
  masking_value: n(textCodec),
  priority: n(int4Codec),
  masking_filter: n(textCodec),
  trusted_schema: n(booleanCodec),
});
export const anonIdentifierFields = Object.freeze({
  attrelid: n(oidCodec),
  attnum: n(int4Codec),
  relname: n(typedText("name")),
  attname: n(typedText("name")),
  format_type: n(textCodec),
  col_description: n(textCodec),
  indirect_identifier: n(booleanCodec),
  priority: n(int4Codec),
});
export const anonMaskedRoleFields = Object.freeze({
  rolname: n(typedText("name")),
  rolsuper: n(booleanCodec),
  rolinherit: n(booleanCodec),
  rolcreaterole: n(booleanCodec),
  rolcreatedb: n(booleanCodec),
  rolcanlogin: n(booleanCodec),
  rolreplication: n(booleanCodec),
  rolconnlimit: n(int4Codec),
  rolpassword: n(textCodec),
  rolvaliduntil: n(timestamptzCodec),
  rolbypassrls: n(booleanCodec),
  rolconfig: n(arrayCodec(textCodec)),
  oid: n(oidCodec),
  hasmask: n(booleanCodec),
});
export const anonTrustedFunctionFields = Object.freeze({
  schema: n(typedText("regnamespace")),
  function: n(textCodec),
});
export const anonDictionaryFields = Object.freeze({
  oid: int4Codec,
  val: n(textCodec),
});

export const anonCompositeFields = Object.freeze({
  address: anonDictionaryFields,
  city: anonDictionaryFields,
  company: anonDictionaryFields,
  country: anonDictionaryFields,
  email: anonDictionaryFields,
  first_name: anonDictionaryFields,
  iban: anonDictionaryFields,
  identifier: Object.freeze({ lang: textCodec, attname: textCodec, fk_identifiers_category: n(textCodec) }),
  identifiers_category: Object.freeze({
    name: textCodec,
    direct_identifier: n(booleanCodec),
    anon_function: n(textCodec),
  }),
  last_name: anonDictionaryFields,
  lorem_ipsum: Object.freeze({ oid: int4Codec, paragraph: n(textCodec) }),
  pg_identifiers: anonIdentifierFields,
  pg_masked_roles: anonMaskedRoleFields,
  pg_masking_rules: anonMaskingRuleFields,
  pg_masks: anonMaskingRuleFields,
  pg_trusted_functions: anonTrustedFunctionFields,
  postcode: anonDictionaryFields,
  siret: anonDictionaryFields,
});
export type AnonCompositeName = keyof typeof anonCompositeFields;
type CompositeCodecs = {
  readonly [Name in AnonCompositeName]: ReturnType<typeof compositeCodec<(typeof anonCompositeFields)[Name]>>;
};
type CompositeArrayCodecs = {
  readonly [Name in AnonCompositeName as `_${Name}`]: ReturnType<
    typeof arrayCodec<CodecInput<CompositeCodecs[Name]>, CodecOutput<CompositeCodecs[Name]>>
  >;
};

export function anonCompositeCodecs(schema: string) {
  // SAFETY: every entry retains the same literal key and that key's declared native composite fields.
  const composites = Object.freeze(
    Object.fromEntries(
      Object.entries(anonCompositeFields).map(([name, fields]) => [
        name,
        withCodecSqlType(compositeCodec(`anon:2.5.1:${name}`, fields), { schema, name }),
      ]),
    ),
  ) as CompositeCodecs;
  // SAFETY: the array codec is built from its matching concrete composite, with PostgreSQL bounds retained.
  const arrays = Object.freeze(
    Object.fromEntries(
      Object.entries(composites).map(([name, codec]) => [
        `_${name}`,
        arrayCodec(codec as ExtensionCodec<never, unknown>),
      ]),
    ),
  ) as CompositeArrayCodecs;
  return Object.freeze({ ...composites, ...arrays });
}

export function anonCodecs(schema: string) {
  const detect = withCodecSqlType(compositeCodec("anon:2.5.1:detect", anonDetectFields), {
    schema: "pg_catalog",
    name: "record",
  });
  const maskColumns = withCodecSqlType(compositeCodec("anon:2.5.1:mask_columns", anonMaskColumnsFields), {
    schema: "pg_catalog",
    name: "record",
  });
  const composites = anonCompositeCodecs(schema);
  return Object.freeze({
    text: n(textCodec),
    name: n(typedText("name")),
    bool: n(booleanCodec),
    int2: n(int2Codec),
    int4: n(int4Codec),
    int8: n(integerCodec),
    float4: n(float4Codec),
    float8: n(floatCodec),
    numeric: n(numericCodec),
    oid: n(oidCodec),
    bytea: n(binaryCodec),
    date: n(dateCodec),
    time: n(timeCodec),
    timestamp: n(timestampCodec),
    timestamptz: n(timestamptzCodec),
    interval: n(intervalCodec),
    regclass: n(typedText("regclass")),
    regrole: n(typedText("regrole")),
    regnamespace: n(typedText("regnamespace")),
    daterange: n(range("daterange")),
    int4range: n(range("int4range")),
    int8range: n(range("int8range")),
    numrange: n(range("numrange")),
    tsrange: n(range("tsrange")),
    tstzrange: n(range("tstzrange")),
    event_trigger: n(typedText("event_trigger")),
    record: n(detect),
    detect,
    mask_columns: maskColumns,
    ...composites,
    pg_masking_rules: n(composites.pg_masking_rules),
    pg_masks: n(composites.pg_masks),
    pg_identifiers: n(composites.pg_identifiers),
    pg_masked_roles: n(composites.pg_masked_roles),
    pg_trusted_functions: n(composites.pg_trusted_functions),
  });
}
export type AnonCodecs = ReturnType<typeof anonCodecs>;
export type AnonCodecName = keyof AnonCodecs;
export type AnonInput<Name extends AnonCodecName> = CodecInput<AnonCodecs[Name]>;
export type AnonOutput<Name extends AnonCodecName> = CodecOutput<AnonCodecs[Name]>;

declare const parameterBrand: unique symbol;
/** Query composition may bind typed SQL; explicit operator calls bind encoded values only. */
type AnonParameterSql<Output> = SQL<Output> | SQL.Aliased<Output> | AnyColumn<{ data: Output }>;
/** A concrete codec determines polymorphic PostgreSQL parameters; it never asserts a result type. */
export interface AnonParameter<Input = unknown, Output = unknown, Binding extends "value" | "sql" = "value" | "sql"> {
  readonly [parameterBrand]: { readonly input: Input; readonly output: Output; readonly binding: Binding };
}
const parameters = new WeakMap<AnonParameter, { codec: ExtensionCodec<never, unknown>; value: unknown }>();
export function anonParameter<Input, Output, const Value extends Input | AnonParameterSql<Output>>(
  codec: ExtensionCodec<Input, Output>,
  value: Value,
): AnonParameter<Input, Output, Value extends AnonParameterSql<Output> ? "sql" : "value"> {
  if (!codec.sqlType) throw new Error("An anon polymorphic parameter requires a concrete SQL type");
  // SAFETY: only this constructor creates branded identities and records their concrete codec/value pair in the private WeakMap.
  const parameter = Object.freeze({}) as AnonParameter<
    Input,
    Output,
    Value extends AnonParameterSql<Output> ? "sql" : "value"
  >;
  parameters.set(parameter, { codec, value });
  return parameter;
}
/** Family construction only; a caller cannot supply an unchecked codec/value pair. */
export function resolveAnonParameter(value: AnonParameter, array: boolean) {
  const parameter = parameters.get(value);
  if (!parameter || (array && !parameter.codec.sqlType?.array))
    throw new Error("Expected a concrete anon polymorphic parameter");
  return parameter;
}
