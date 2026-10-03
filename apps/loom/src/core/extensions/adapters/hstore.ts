import * as v from "valibot";
import { is, sql, SQL, type SQLWrapper } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  binaryCodec,
  booleanCodec,
  compositeCodec,
  createExtensionCodec,
  decodeFailure,
  integerCodec,
  nullableCodec,
  textCodec,
  type CodecInput,
  type ExtensionCodec,
  type PostgreSqlArray,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { jsonCodec, jsonbCodec } from "../native-json-codecs";
import { createHstoreCodec, createHstoreArrayCodec, hstoreTextSchema, type HstoreValue } from "../hstore-codec";
import { extensionRows } from "../rows";
import {
  checkedExtensionExpression,
  createSqlFunction,
  createSqlOperator,
  extensionSqlType,
  type ExtensionSqlInput,
} from "../sql";

export type { HstoreValue } from "../hstore-codec";
const digest = "cea995a9f416f391e531e262624a397016d7fc562ef1c78cb7247dd76d98daf1";
type Descriptor = ExtensionDescriptor<"hstore", { readonly version: "1.8"; readonly schema: string }>;
const sqlWrapper = v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value));
const signedInt8 = v.pipe(v.bigint(), v.minValue(-9223372036854775808n), v.maxValue(9223372036854775807n));
const int8Codec = createExtensionCodec({
  id: "hstore:int8:signed:1",
  sqlType: integerCodec.sqlType,
  input: signedInt8,
  output: signedInt8,
  transport: "text",
  encode: integerCodec.encode,
  decode: integerCodec.decode,
});
function losslessTextCodec() {
  const text = v.pipe(
    v.string(),
    // Scalar keys and values share hstore's established NUL and well-formed UTF16 policy.
    v.check((value) => v.is(hstoreTextSchema, value), "Expected lossless PostgreSQL UTF8 text"),
  );
  return createExtensionCodec({
    id: "hstore:text:utf8:1",
    sqlType: textCodec.sqlType,
    input: text,
    output: text,
    transport: textCodec.transport,
    encode: textCodec.encode,
    decode: textCodec.decode,
  });
}
function checkTextDimensions(value: PostgreSqlArray<string>) {
  if (
    value.dimensions.length > 6 ||
    value.dimensions.some(
      ({ lowerBound, length }) =>
        lowerBound < -2147483648 ||
        lowerBound > 2147483647 ||
        length < 1 ||
        length > 2147483647 ||
        lowerBound + length > 2147483647,
    )
  )
    throw new Error("Invalid native PostgreSQL text array bounds");
}
function losslessTextArrayCodec(text: ReturnType<typeof losslessTextCodec>) {
  const nativeTexts = arrayCodec(text);
  return Object.freeze({
    ...nativeTexts,
    id: "hstore:text-array:bounds:1",
    encode(value: PostgreSqlArray<string>) {
      const encoded = nativeTexts.encode(value);
      checkTextDimensions(value);
      return encoded;
    },
    // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native driver array text is decoded and validated here.
    decode(value: unknown) {
      return decodeFailure(() => {
        const decoded = nativeTexts.decode(value);
        checkTextDimensions(decoded);
        return decoded;
      });
    },
  });
}
function cast<Input, Source, TargetInput, Target>(
  source: ExtensionCodec<Input, Source>,
  target: ExtensionCodec<TargetInput, Target>,
  member: string,
) {
  return (value: ExtensionSqlInput<typeof source>) => {
    const expression =
      is(value, SQL.Aliased) && !v.is(v.object({ isSelectionField: v.literal(true) }), value) ? value.sql : value;
    // SAFETY: wrapper expressions remain SQL; all other typed inputs are encoded by their paired codec before binding.
    const native = v.is(sqlWrapper, expression)
      ? sql`${expression}`
      : sql`${sql.param(decodeFailure(() => source.encode(value as CodecInput<typeof source>)))}`;
    const sourceType = source.sqlType!,
      targetType = target.sqlType!;
    return checkedExtensionExpression(
      sql`((${native})::${extensionSqlType(sourceType.schema, sourceType.name)}${sourceType.array ? sql`[]` : sql.empty()})::${extensionSqlType(targetType.schema, targetType.name)}${targetType.array ? sql`[]` : sql.empty()}`,
      target,
      [],
      undefined,
      member,
    );
  };
}

/** Portable hstore queries. Exact record witnesses, fields and subscripting remain separate prerequisites. */
export function createHstore_1_8<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "hstore" ||
    descriptor.version !== "1.8" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("hstore 1.8 requires its exact verified contract");
  const codec = createHstoreCodec(descriptor.schema);
  const nativeText = losslessTextCodec();
  const textArrayCodec = losslessTextArrayCodec(nativeText);
  const h = nullableCodec(codec),
    text = nullableCodec(nativeText),
    texts = nullableCodec(textArrayCodec),
    bool = nullableCodec(booleanCodec),
    int4 = nullableCodec(int4Codec),
    int8 = nullableCodec(int8Codec),
    bytes = nullableCodec(binaryCodec),
    json = nullableCodec(jsonCodec),
    jsonb = nullableCodec(jsonbCodec);
  const rowFields = Object.freeze({ key: nativeText, value: text });
  const rowCodec = compositeCodec("hstore:each:1", rowFields);
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const operator_delete_byPairs = createSqlOperator({
    ...base,
    name: "-",
    member: "operator:$extension:hstore.-($extension:hstore.hstore,$extension:hstore.hstore)",
    left: h,
    right: h,
    result: h,
  });
  const operator_delete_byKeys = createSqlOperator({
    ...base,
    name: "-",
    member: "operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog._text)",
    left: h,
    right: texts,
    result: h,
  });
  const operator_delete_byKey = createSqlOperator({
    ...base,
    name: "-",
    member: "operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog.text)",
    left: h,
    right: text,
    result: h,
  });
  const operator_get_byKeys = createSqlOperator({
    ...base,
    name: "->",
    member: "operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog._text)",
    left: h,
    right: texts,
    result: texts,
  });
  const operator_get_byKey = createSqlOperator({
    ...base,
    name: "->",
    member: "operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog.text)",
    left: h,
    right: text,
    result: text,
  });
  const operator_hasKey = createSqlOperator({
    ...base,
    name: "?",
    member: "operator:$extension:hstore.?($extension:hstore.hstore,pg_catalog.text)",
    left: h,
    right: text,
    result: bool,
  });
  const operator_hasAllKeys = createSqlOperator({
    ...base,
    name: "?&",
    member: "operator:$extension:hstore.?&($extension:hstore.hstore,pg_catalog._text)",
    left: h,
    right: texts,
    result: bool,
  });
  const operator_hasAnyKey = createSqlOperator({
    ...base,
    name: "?|",
    member: "operator:$extension:hstore.?|($extension:hstore.hstore,pg_catalog._text)",
    left: h,
    right: texts,
    result: bool,
  });
  const operator_contains = createSqlOperator({
    ...base,
    name: "@>",
    member: "operator:$extension:hstore.@>($extension:hstore.hstore,$extension:hstore.hstore)",
    left: h,
    right: h,
    result: bool,
  });
  const operator_lessThan = createSqlOperator({
    ...base,
    name: "#<#",
    member: "operator:$extension:hstore.#<#($extension:hstore.hstore,$extension:hstore.hstore)",
    left: h,
    right: h,
    result: bool,
  });
  const operator_lessOrEqual = createSqlOperator({
    ...base,
    name: "#<=#",
    member: "operator:$extension:hstore.#<=#($extension:hstore.hstore,$extension:hstore.hstore)",
    left: h,
    right: h,
    result: bool,
  });
  const operator_greaterThan = createSqlOperator({
    ...base,
    name: "#>#",
    member: "operator:$extension:hstore.#>#($extension:hstore.hstore,$extension:hstore.hstore)",
    left: h,
    right: h,
    result: bool,
  });
  const operator_greaterOrEqual = createSqlOperator({
    ...base,
    name: "#>=#",
    member: "operator:$extension:hstore.#>=#($extension:hstore.hstore,$extension:hstore.hstore)",
    left: h,
    right: h,
    result: bool,
  });
  const operator_toMatrix = createSqlOperator({
    ...base,
    name: "%#",
    member: "operator:$extension:hstore.%#(,$extension:hstore.hstore)",
    left: undefined,
    right: h,
    result: texts,
  });
  const operator_toArray = createSqlOperator({
    ...base,
    name: "%%",
    member: "operator:$extension:hstore.%%(,$extension:hstore.hstore)",
    left: undefined,
    right: h,
    result: texts,
  });
  const operator_containedBy = createSqlOperator({
    ...base,
    name: "<@",
    member: "operator:$extension:hstore.<@($extension:hstore.hstore,$extension:hstore.hstore)",
    left: h,
    right: h,
    result: bool,
  });
  const operator_notEqual = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:hstore.<>($extension:hstore.hstore,$extension:hstore.hstore)",
    left: h,
    right: h,
    result: bool,
  });
  const operator_equal = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:hstore.=($extension:hstore.hstore,$extension:hstore.hstore)",
    left: h,
    right: h,
    result: bool,
  });
  const operator_concat = createSqlOperator({
    ...base,
    name: "||",
    member: "operator:$extension:hstore.||($extension:hstore.hstore,$extension:hstore.hstore)",
    left: h,
    right: h,
    result: h,
  });
  const akeys = createSqlFunction({
    ...base,
    name: "akeys",
    member: "routine:$extension:hstore.akeys($extension:hstore.hstore)",
    arguments: [h] as const,
    result: texts,
  });
  const avals = createSqlFunction({
    ...base,
    name: "avals",
    member: "routine:$extension:hstore.avals($extension:hstore.hstore)",
    arguments: [h] as const,
    result: texts,
  });
  const defined = createSqlFunction({
    ...base,
    name: "defined",
    member: "routine:$extension:hstore.defined($extension:hstore.hstore,pg_catalog.text)",
    arguments: [h, text] as const,
    result: bool,
  });
  const delete_byPairs = createSqlFunction({
    ...base,
    name: "delete",
    member: "routine:$extension:hstore.delete($extension:hstore.hstore,$extension:hstore.hstore)",
    arguments: [h, h] as const,
    result: h,
  });
  const delete_byKeys = createSqlFunction({
    ...base,
    name: "delete",
    member: "routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog._text)",
    arguments: [h, texts] as const,
    result: h,
  });
  const delete_byKey = createSqlFunction({
    ...base,
    name: "delete",
    member: "routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog.text)",
    arguments: [h, text] as const,
    result: h,
  });
  const each = createSqlFunction({
    ...base,
    name: "each",
    member: "routine:$extension:hstore.each($extension:hstore.hstore)",
    arguments: [h] as const,
    result: rowCodec,
  });
  const exist = createSqlFunction({
    ...base,
    name: "exist",
    member: "routine:$extension:hstore.exist($extension:hstore.hstore,pg_catalog.text)",
    arguments: [h, text] as const,
    result: bool,
  });
  const exists_all = createSqlFunction({
    ...base,
    name: "exists_all",
    member: "routine:$extension:hstore.exists_all($extension:hstore.hstore,pg_catalog._text)",
    arguments: [h, texts] as const,
    result: bool,
  });
  const exists_any = createSqlFunction({
    ...base,
    name: "exists_any",
    member: "routine:$extension:hstore.exists_any($extension:hstore.hstore,pg_catalog._text)",
    arguments: [h, texts] as const,
    result: bool,
  });
  const fetchval = createSqlFunction({
    ...base,
    name: "fetchval",
    member: "routine:$extension:hstore.fetchval($extension:hstore.hstore,pg_catalog.text)",
    arguments: [h, text] as const,
    result: text,
  });
  const hs_concat = createSqlFunction({
    ...base,
    name: "hs_concat",
    member: "routine:$extension:hstore.hs_concat($extension:hstore.hstore,$extension:hstore.hstore)",
    arguments: [h, h] as const,
    result: h,
  });
  const hs_contained = createSqlFunction({
    ...base,
    name: "hs_contained",
    member: "routine:$extension:hstore.hs_contained($extension:hstore.hstore,$extension:hstore.hstore)",
    arguments: [h, h] as const,
    result: bool,
  });
  const hs_contains = createSqlFunction({
    ...base,
    name: "hs_contains",
    member: "routine:$extension:hstore.hs_contains($extension:hstore.hstore,$extension:hstore.hstore)",
    arguments: [h, h] as const,
    result: bool,
  });
  const hstore_cmp = createSqlFunction({
    ...base,
    name: "hstore_cmp",
    member: "routine:$extension:hstore.hstore_cmp($extension:hstore.hstore,$extension:hstore.hstore)",
    arguments: [h, h] as const,
    result: int4,
  });
  const hstore_eq = createSqlFunction({
    ...base,
    name: "hstore_eq",
    member: "routine:$extension:hstore.hstore_eq($extension:hstore.hstore,$extension:hstore.hstore)",
    arguments: [h, h] as const,
    result: bool,
  });
  const hstore_ge = createSqlFunction({
    ...base,
    name: "hstore_ge",
    member: "routine:$extension:hstore.hstore_ge($extension:hstore.hstore,$extension:hstore.hstore)",
    arguments: [h, h] as const,
    result: bool,
  });
  const hstore_gt = createSqlFunction({
    ...base,
    name: "hstore_gt",
    member: "routine:$extension:hstore.hstore_gt($extension:hstore.hstore,$extension:hstore.hstore)",
    arguments: [h, h] as const,
    result: bool,
  });
  const hstore_hash_extended = createSqlFunction({
    ...base,
    name: "hstore_hash_extended",
    member: "routine:$extension:hstore.hstore_hash_extended($extension:hstore.hstore,pg_catalog.int8)",
    arguments: [h, int8] as const,
    result: int8,
  });
  const hstore_hash = createSqlFunction({
    ...base,
    name: "hstore_hash",
    member: "routine:$extension:hstore.hstore_hash($extension:hstore.hstore)",
    arguments: [h] as const,
    result: int4,
  });
  const hstore_le = createSqlFunction({
    ...base,
    name: "hstore_le",
    member: "routine:$extension:hstore.hstore_le($extension:hstore.hstore,$extension:hstore.hstore)",
    arguments: [h, h] as const,
    result: bool,
  });
  const hstore_lt = createSqlFunction({
    ...base,
    name: "hstore_lt",
    member: "routine:$extension:hstore.hstore_lt($extension:hstore.hstore,$extension:hstore.hstore)",
    arguments: [h, h] as const,
    result: bool,
  });
  const hstore_ne = createSqlFunction({
    ...base,
    name: "hstore_ne",
    member: "routine:$extension:hstore.hstore_ne($extension:hstore.hstore,$extension:hstore.hstore)",
    arguments: [h, h] as const,
    result: bool,
  });
  const hstore_send = createSqlFunction({
    ...base,
    name: "hstore_send",
    member: "routine:$extension:hstore.hstore_send($extension:hstore.hstore)",
    arguments: [h] as const,
    result: bytes,
  });
  const hstore_to_array = createSqlFunction({
    ...base,
    name: "hstore_to_array",
    member: "routine:$extension:hstore.hstore_to_array($extension:hstore.hstore)",
    arguments: [h] as const,
    result: texts,
  });
  const hstore_to_json_loose = createSqlFunction({
    ...base,
    name: "hstore_to_json_loose",
    member: "routine:$extension:hstore.hstore_to_json_loose($extension:hstore.hstore)",
    arguments: [h] as const,
    result: json,
  });
  const hstore_to_json = createSqlFunction({
    ...base,
    name: "hstore_to_json",
    member: "routine:$extension:hstore.hstore_to_json($extension:hstore.hstore)",
    arguments: [h] as const,
    result: json,
  });
  const hstore_to_jsonb_loose = createSqlFunction({
    ...base,
    name: "hstore_to_jsonb_loose",
    member: "routine:$extension:hstore.hstore_to_jsonb_loose($extension:hstore.hstore)",
    arguments: [h] as const,
    result: jsonb,
  });
  const hstore_to_jsonb = createSqlFunction({
    ...base,
    name: "hstore_to_jsonb",
    member: "routine:$extension:hstore.hstore_to_jsonb($extension:hstore.hstore)",
    arguments: [h] as const,
    result: jsonb,
  });
  const hstore_to_matrix = createSqlFunction({
    ...base,
    name: "hstore_to_matrix",
    member: "routine:$extension:hstore.hstore_to_matrix($extension:hstore.hstore)",
    arguments: [h] as const,
    result: texts,
  });
  const hstore_version_diag = createSqlFunction({
    ...base,
    name: "hstore_version_diag",
    member: "routine:$extension:hstore.hstore_version_diag($extension:hstore.hstore)",
    arguments: [h] as const,
    result: int4,
  });
  const hstore_fromArrays = createSqlFunction({
    ...base,
    name: "hstore",
    member: "routine:$extension:hstore.hstore(pg_catalog._text,pg_catalog._text)",
    arguments: [texts, texts] as const,
    result: h,
  });
  const hstore_fromArray = createSqlFunction({
    ...base,
    name: "hstore",
    member: "routine:$extension:hstore.hstore(pg_catalog._text)",
    arguments: [texts] as const,
    result: h,
  });
  const hstore_fromPair = createSqlFunction({
    ...base,
    name: "hstore",
    member: "routine:$extension:hstore.hstore(pg_catalog.text,pg_catalog.text)",
    arguments: [text, text] as const,
    result: h,
  });
  const isdefined = createSqlFunction({
    ...base,
    name: "isdefined",
    member: "routine:$extension:hstore.isdefined($extension:hstore.hstore,pg_catalog.text)",
    arguments: [h, text] as const,
    result: bool,
  });
  const isexists = createSqlFunction({
    ...base,
    name: "isexists",
    member: "routine:$extension:hstore.isexists($extension:hstore.hstore,pg_catalog.text)",
    arguments: [h, text] as const,
    result: bool,
  });
  const skeys = createSqlFunction({
    ...base,
    name: "skeys",
    member: "routine:$extension:hstore.skeys($extension:hstore.hstore)",
    arguments: [h] as const,
    result: nativeText,
  });
  const slice_array = createSqlFunction({
    ...base,
    name: "slice_array",
    member: "routine:$extension:hstore.slice_array($extension:hstore.hstore,pg_catalog._text)",
    arguments: [h, texts] as const,
    result: texts,
  });
  const slice = createSqlFunction({
    ...base,
    name: "slice",
    member: "routine:$extension:hstore.slice($extension:hstore.hstore,pg_catalog._text)",
    arguments: [h, texts] as const,
    result: h,
  });
  const svals = createSqlFunction({
    ...base,
    name: "svals",
    member: "routine:$extension:hstore.svals($extension:hstore.hstore)",
    arguments: [h] as const,
    result: text,
  });
  const tconvert = createSqlFunction({
    ...base,
    name: "tconvert",
    member: "routine:$extension:hstore.tconvert(pg_catalog.text,pg_catalog.text)",
    arguments: [text, text] as const,
    result: h,
  });
  const casts = Object.freeze({
    hstore_to_json: cast(h, json, "cast:$extension:hstore.hstore->pg_catalog.json"),
    hstore_to_jsonb: cast(h, jsonb, "cast:$extension:hstore.hstore->pg_catalog.jsonb"),
    text_array_to_hstore: cast(texts, h, "cast:pg_catalog._text->$extension:hstore.hstore"),
  });
  const functions = Object.freeze({
    akeys: akeys,
    avals: avals,
    defined: defined,
    delete: Object.freeze({
      byPairs: delete_byPairs,
      byKeys: delete_byKeys,
      byKey: delete_byKey,
    }),
    each: each,
    exist: exist,
    exists_all: exists_all,
    exists_any: exists_any,
    fetchval: fetchval,
    hs_concat: hs_concat,
    hs_contained: hs_contained,
    hs_contains: hs_contains,
    hstore_cmp: hstore_cmp,
    hstore_eq: hstore_eq,
    hstore_ge: hstore_ge,
    hstore_gt: hstore_gt,
    hstore_hash_extended: hstore_hash_extended,
    hstore_hash: hstore_hash,
    hstore_le: hstore_le,
    hstore_lt: hstore_lt,
    hstore_ne: hstore_ne,
    hstore_send: hstore_send,
    hstore_to_array: hstore_to_array,
    hstore_to_json_loose: hstore_to_json_loose,
    hstore_to_json: hstore_to_json,
    hstore_to_jsonb_loose: hstore_to_jsonb_loose,
    hstore_to_jsonb: hstore_to_jsonb,
    hstore_to_matrix: hstore_to_matrix,
    hstore_version_diag: hstore_version_diag,
    hstore: Object.freeze({
      fromArrays: hstore_fromArrays,
      fromArray: hstore_fromArray,
      fromPair: hstore_fromPair,
    }),
    isdefined: isdefined,
    isexists: isexists,
    skeys: skeys,
    slice_array: slice_array,
    slice: slice,
    svals: svals,
    tconvert: tconvert,
  });
  const operators = Object.freeze({
    "-": Object.freeze({
      byPairs: operator_delete_byPairs,
      byKeys: operator_delete_byKeys,
      byKey: operator_delete_byKey,
    }),
    "->": Object.freeze({
      byKeys: operator_get_byKeys,
      byKey: operator_get_byKey,
    }),
    "?": operator_hasKey,
    "?&": operator_hasAllKeys,
    "?|": operator_hasAnyKey,
    "@>": operator_contains,
    "#<#": operator_lessThan,
    "#<=#": operator_lessOrEqual,
    "#>#": operator_greaterThan,
    "#>=#": operator_greaterOrEqual,
    "%#": operator_toMatrix,
    "%%": operator_toArray,
    "<@": operator_containedBy,
    "<>": operator_notEqual,
    "=": operator_equal,
    "||": operator_concat,
  });
  const overloads = Object.freeze({
    "cast:$extension:hstore.hstore->pg_catalog.json": casts.hstore_to_json,
    "cast:$extension:hstore.hstore->pg_catalog.jsonb": casts.hstore_to_jsonb,
    "cast:pg_catalog._text->$extension:hstore.hstore": casts.text_array_to_hstore,
    "operator:$extension:hstore.-($extension:hstore.hstore,$extension:hstore.hstore)": operator_delete_byPairs,
    "operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog._text)": operator_delete_byKeys,
    "operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog.text)": operator_delete_byKey,
    "operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog._text)": operator_get_byKeys,
    "operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog.text)": operator_get_byKey,
    "operator:$extension:hstore.?($extension:hstore.hstore,pg_catalog.text)": operator_hasKey,
    "operator:$extension:hstore.?&($extension:hstore.hstore,pg_catalog._text)": operator_hasAllKeys,
    "operator:$extension:hstore.?|($extension:hstore.hstore,pg_catalog._text)": operator_hasAnyKey,
    "operator:$extension:hstore.@>($extension:hstore.hstore,$extension:hstore.hstore)": operator_contains,
    "operator:$extension:hstore.#<#($extension:hstore.hstore,$extension:hstore.hstore)": operator_lessThan,
    "operator:$extension:hstore.#<=#($extension:hstore.hstore,$extension:hstore.hstore)": operator_lessOrEqual,
    "operator:$extension:hstore.#>#($extension:hstore.hstore,$extension:hstore.hstore)": operator_greaterThan,
    "operator:$extension:hstore.#>=#($extension:hstore.hstore,$extension:hstore.hstore)": operator_greaterOrEqual,
    "operator:$extension:hstore.%#(,$extension:hstore.hstore)": operator_toMatrix,
    "operator:$extension:hstore.%%(,$extension:hstore.hstore)": operator_toArray,
    "operator:$extension:hstore.<@($extension:hstore.hstore,$extension:hstore.hstore)": operator_containedBy,
    "operator:$extension:hstore.<>($extension:hstore.hstore,$extension:hstore.hstore)": operator_notEqual,
    "operator:$extension:hstore.=($extension:hstore.hstore,$extension:hstore.hstore)": operator_equal,
    "operator:$extension:hstore.||($extension:hstore.hstore,$extension:hstore.hstore)": operator_concat,
    "routine:$extension:hstore.akeys($extension:hstore.hstore)": akeys,
    "routine:$extension:hstore.avals($extension:hstore.hstore)": avals,
    "routine:$extension:hstore.defined($extension:hstore.hstore,pg_catalog.text)": defined,
    "routine:$extension:hstore.delete($extension:hstore.hstore,$extension:hstore.hstore)": delete_byPairs,
    "routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog._text)": delete_byKeys,
    "routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog.text)": delete_byKey,
    "routine:$extension:hstore.each($extension:hstore.hstore)": each,
    "routine:$extension:hstore.exist($extension:hstore.hstore,pg_catalog.text)": exist,
    "routine:$extension:hstore.exists_all($extension:hstore.hstore,pg_catalog._text)": exists_all,
    "routine:$extension:hstore.exists_any($extension:hstore.hstore,pg_catalog._text)": exists_any,
    "routine:$extension:hstore.fetchval($extension:hstore.hstore,pg_catalog.text)": fetchval,
    "routine:$extension:hstore.hs_concat($extension:hstore.hstore,$extension:hstore.hstore)": hs_concat,
    "routine:$extension:hstore.hs_contained($extension:hstore.hstore,$extension:hstore.hstore)": hs_contained,
    "routine:$extension:hstore.hs_contains($extension:hstore.hstore,$extension:hstore.hstore)": hs_contains,
    "routine:$extension:hstore.hstore_cmp($extension:hstore.hstore,$extension:hstore.hstore)": hstore_cmp,
    "routine:$extension:hstore.hstore_eq($extension:hstore.hstore,$extension:hstore.hstore)": hstore_eq,
    "routine:$extension:hstore.hstore_ge($extension:hstore.hstore,$extension:hstore.hstore)": hstore_ge,
    "routine:$extension:hstore.hstore_gt($extension:hstore.hstore,$extension:hstore.hstore)": hstore_gt,
    "routine:$extension:hstore.hstore_hash_extended($extension:hstore.hstore,pg_catalog.int8)": hstore_hash_extended,
    "routine:$extension:hstore.hstore_hash($extension:hstore.hstore)": hstore_hash,
    "routine:$extension:hstore.hstore_le($extension:hstore.hstore,$extension:hstore.hstore)": hstore_le,
    "routine:$extension:hstore.hstore_lt($extension:hstore.hstore,$extension:hstore.hstore)": hstore_lt,
    "routine:$extension:hstore.hstore_ne($extension:hstore.hstore,$extension:hstore.hstore)": hstore_ne,
    "routine:$extension:hstore.hstore_send($extension:hstore.hstore)": hstore_send,
    "routine:$extension:hstore.hstore_to_array($extension:hstore.hstore)": hstore_to_array,
    "routine:$extension:hstore.hstore_to_json_loose($extension:hstore.hstore)": hstore_to_json_loose,
    "routine:$extension:hstore.hstore_to_json($extension:hstore.hstore)": hstore_to_json,
    "routine:$extension:hstore.hstore_to_jsonb_loose($extension:hstore.hstore)": hstore_to_jsonb_loose,
    "routine:$extension:hstore.hstore_to_jsonb($extension:hstore.hstore)": hstore_to_jsonb,
    "routine:$extension:hstore.hstore_to_matrix($extension:hstore.hstore)": hstore_to_matrix,
    "routine:$extension:hstore.hstore_version_diag($extension:hstore.hstore)": hstore_version_diag,
    "routine:$extension:hstore.hstore(pg_catalog._text,pg_catalog._text)": hstore_fromArrays,
    "routine:$extension:hstore.hstore(pg_catalog._text)": hstore_fromArray,
    "routine:$extension:hstore.hstore(pg_catalog.text,pg_catalog.text)": hstore_fromPair,
    "routine:$extension:hstore.isdefined($extension:hstore.hstore,pg_catalog.text)": isdefined,
    "routine:$extension:hstore.isexists($extension:hstore.hstore,pg_catalog.text)": isexists,
    "routine:$extension:hstore.skeys($extension:hstore.hstore)": skeys,
    "routine:$extension:hstore.slice_array($extension:hstore.hstore,pg_catalog._text)": slice_array,
    "routine:$extension:hstore.slice($extension:hstore.hstore,pg_catalog._text)": slice,
    "routine:$extension:hstore.svals($extension:hstore.hstore)": svals,
    "routine:$extension:hstore.tconvert(pg_catalog.text,pg_catalog.text)": tconvert,
  });
  function value(entries: HstoreValue["entries"]): HstoreValue {
    const result = { entries: entries.map((entry) => Object.freeze({ ...entry })) };
    codec.encode(result);
    return Object.freeze({ entries: Object.freeze(result.entries) });
  }
  return bindExtension(descriptor, {
    value,
    codec,
    arrayCodec: createHstoreArrayCodec(descriptor.schema),
    textArrayCodec,
    fromPair: functions.hstore.fromPair,
    fromArray: functions.hstore.fromArray,
    fromArrays: functions.hstore.fromArrays,
    get: functions.fetchval,
    getMany: functions.slice_array,
    hasKey: functions.exist,
    hasAllKeys: functions.exists_all,
    hasAnyKey: functions.exists_any,
    isDefined: functions.defined,
    concat: functions.hs_concat,
    contains: functions.hs_contains,
    containedBy: functions.hs_contained,
    delete: functions.delete,
    slice: functions.slice,
    keys: functions.akeys,
    values: functions.avals,
    toArray: functions.hstore_to_array,
    toMatrix: functions.hstore_to_matrix,
    toJson: functions.hstore_to_json,
    toJsonb: functions.hstore_to_jsonb,
    toJsonLoose: functions.hstore_to_json_loose,
    toJsonbLoose: functions.hstore_to_jsonb_loose,
    equal: functions.hstore_eq,
    notEqual: functions.hstore_ne,
    compare: functions.hstore_cmp,
    lessThan: functions.hstore_lt,
    lessOrEqual: functions.hstore_le,
    greaterThan: functions.hstore_gt,
    greaterOrEqual: functions.hstore_ge,
    hash: functions.hstore_hash,
    hashExtended: functions.hstore_hash_extended,
    send: functions.hstore_send,
    versionDiagnostic: functions.hstore_version_diag,
    each: (input: ExtensionSqlInput<typeof h>, alias = "hstore_each") =>
      extensionRows(functions.each(input), alias, rowFields, "named"),
    keysRows: (input: ExtensionSqlInput<typeof h>, alias = "hstore_keys") =>
      extensionRows(functions.skeys(input), alias, { key: nativeText }, "named"),
    valuesRows: (input: ExtensionSqlInput<typeof h>, alias = "hstore_values") =>
      extensionRows(functions.svals(input), alias, { value: text }, "named"),
    sql: Object.freeze({ functions, operators, casts, overloads }),
  });
}
