import * as v from "valibot";
import { sql, is, SQL, type SQLWrapper } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  binaryCodec,
  booleanCodec,
  createExtensionCodec,
  integerCodec,
  nullableCodec,
  textCodec,
  type CodecInput,
  type ExtensionCodec,
  type PostgreSqlArray,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { createExtensionField, createExtensionIndex, type ExtensionValueSchema } from "../fields";
import {
  checkedExtensionExpression,
  createSqlFunction,
  createSqlAggregate,
  createSqlRows,
  createSqlOperator,
  extensionSqlType,
  type ExtensionSqlInput,
} from "../sql";
import {
  createCitextCodec,
  createCitextArrayCodec,
  bpcharCodec,
  varcharCodec,
  inetCodec,
  citext,
  type Citext,
} from "../citext-codec";
export { citext, bpchar, varchar, inet } from "../citext-codec";
export type { Citext } from "../citext-codec";
const digest = "bf50ef209f828f5cbd517fe1a5f0b1ede7f1bbeac379b75c0b2bc02bf0a8eee3";
const sqlWrapper = v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value));
type Descriptor = ExtensionDescriptor<"citext", { readonly version: "1.8"; readonly schema: string }>;
/** Exact citext 1.8 SQL operations. Locale and regex semantics are executed by PostgreSQL. */
export function createCitext_1_8<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "citext" ||
    descriptor.version !== "1.8" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("citext 1.8 requires its exact verified contract");
  const codec = createCitextCodec(descriptor.schema);
  const fullArray = createCitextArrayCodec(descriptor.schema);
  const c = nullableCodec(codec),
    text = nullableCodec(textCodec),
    bool = nullableCodec(booleanCodec),
    int4 = nullableCodec(int4Codec),
    int8 = nullableCodec(integerCodec),
    bytes = nullableCodec(binaryCodec),
    texts = nullableCodec(arrayCodec(textCodec));
  const char = nullableCodec(bpcharCodec),
    varying = nullableCodec(varcharCodec),
    network = nullableCodec(inetCodec);
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const citext_cmp = createSqlFunction({
    ...base,
    name: "citext_cmp",
    member: "routine:$extension:citext.citext_cmp($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: int4,
  });
  const citext_eq = createSqlFunction({
    ...base,
    name: "citext_eq",
    member: "routine:$extension:citext.citext_eq($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: bool,
  });
  const citext_ge = createSqlFunction({
    ...base,
    name: "citext_ge",
    member: "routine:$extension:citext.citext_ge($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: bool,
  });
  const citext_gt = createSqlFunction({
    ...base,
    name: "citext_gt",
    member: "routine:$extension:citext.citext_gt($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: bool,
  });
  const citext_hash_extended = createSqlFunction({
    ...base,
    name: "citext_hash_extended",
    member: "routine:$extension:citext.citext_hash_extended($extension:citext.citext,pg_catalog.int8)",
    arguments: [c, int8] as const,
    result: int8,
  });
  const citext_hash = createSqlFunction({
    ...base,
    name: "citext_hash",
    member: "routine:$extension:citext.citext_hash($extension:citext.citext)",
    arguments: [c] as const,
    result: int4,
  });
  const citext_larger = createSqlFunction({
    ...base,
    name: "citext_larger",
    member: "routine:$extension:citext.citext_larger($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: c,
  });
  const citext_le = createSqlFunction({
    ...base,
    name: "citext_le",
    member: "routine:$extension:citext.citext_le($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: bool,
  });
  const citext_lt = createSqlFunction({
    ...base,
    name: "citext_lt",
    member: "routine:$extension:citext.citext_lt($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: bool,
  });
  const citext_ne = createSqlFunction({
    ...base,
    name: "citext_ne",
    member: "routine:$extension:citext.citext_ne($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: bool,
  });
  const citext_pattern_cmp = createSqlFunction({
    ...base,
    name: "citext_pattern_cmp",
    member: "routine:$extension:citext.citext_pattern_cmp($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: int4,
  });
  const citext_pattern_ge = createSqlFunction({
    ...base,
    name: "citext_pattern_ge",
    member: "routine:$extension:citext.citext_pattern_ge($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: bool,
  });
  const citext_pattern_gt = createSqlFunction({
    ...base,
    name: "citext_pattern_gt",
    member: "routine:$extension:citext.citext_pattern_gt($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: bool,
  });
  const citext_pattern_le = createSqlFunction({
    ...base,
    name: "citext_pattern_le",
    member: "routine:$extension:citext.citext_pattern_le($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: bool,
  });
  const citext_pattern_lt = createSqlFunction({
    ...base,
    name: "citext_pattern_lt",
    member: "routine:$extension:citext.citext_pattern_lt($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: bool,
  });
  const citext_smaller = createSqlFunction({
    ...base,
    name: "citext_smaller",
    member: "routine:$extension:citext.citext_smaller($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: c,
  });
  const citext_bool = createSqlFunction({
    ...base,
    name: "citext",
    member: "routine:$extension:citext.citext(pg_catalog.bool)",
    arguments: [bool] as const,
    result: c,
  });
  const citext_bpchar = createSqlFunction({
    ...base,
    name: "citext",
    member: "routine:$extension:citext.citext(pg_catalog.bpchar)",
    arguments: [char] as const,
    result: c,
  });
  const citext_inet = createSqlFunction({
    ...base,
    name: "citext",
    member: "routine:$extension:citext.citext(pg_catalog.inet)",
    arguments: [network] as const,
    result: c,
  });
  const citextsend = createSqlFunction({
    ...base,
    name: "citextsend",
    member: "routine:$extension:citext.citextsend($extension:citext.citext)",
    arguments: [c] as const,
    result: bytes,
  });
  const max = createSqlAggregate({
    ...base,
    name: "max",
    member: "routine:$extension:citext.max($extension:citext.citext)",
    arguments: [c] as const,
    result: c,
  });
  const min = createSqlAggregate({
    ...base,
    name: "min",
    member: "routine:$extension:citext.min($extension:citext.citext)",
    arguments: [c] as const,
    result: c,
  });
  const regexp_match_3 = createSqlFunction({
    ...base,
    name: "regexp_match",
    member: "routine:$extension:citext.regexp_match($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
    arguments: [c, c, text] as const,
    result: texts,
  });
  const regexp_match_2 = createSqlFunction({
    ...base,
    name: "regexp_match",
    member: "routine:$extension:citext.regexp_match($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: texts,
  });
  const regexp_matches_3 = createSqlRows({
    ...base,
    name: "regexp_matches",
    member:
      "routine:$extension:citext.regexp_matches($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
    arguments: [c, c, text] as const,
    result: texts,
  });
  const regexp_matches_2 = createSqlRows({
    ...base,
    name: "regexp_matches",
    member: "routine:$extension:citext.regexp_matches($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: texts,
  });
  const regexp_replace_4 = createSqlFunction({
    ...base,
    name: "regexp_replace",
    member:
      "routine:$extension:citext.regexp_replace($extension:citext.citext,$extension:citext.citext,pg_catalog.text,pg_catalog.text)",
    arguments: [c, c, text, text] as const,
    result: text,
  });
  const regexp_replace_3 = createSqlFunction({
    ...base,
    name: "regexp_replace",
    member:
      "routine:$extension:citext.regexp_replace($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
    arguments: [c, c, text] as const,
    result: text,
  });
  const regexp_split_to_array_3 = createSqlFunction({
    ...base,
    name: "regexp_split_to_array",
    member:
      "routine:$extension:citext.regexp_split_to_array($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
    arguments: [c, c, text] as const,
    result: texts,
  });
  const regexp_split_to_array_2 = createSqlFunction({
    ...base,
    name: "regexp_split_to_array",
    member: "routine:$extension:citext.regexp_split_to_array($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: texts,
  });
  const regexp_split_to_table_3 = createSqlRows({
    ...base,
    name: "regexp_split_to_table",
    member:
      "routine:$extension:citext.regexp_split_to_table($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
    arguments: [c, c, text] as const,
    result: text,
  });
  const regexp_split_to_table_2 = createSqlRows({
    ...base,
    name: "regexp_split_to_table",
    member: "routine:$extension:citext.regexp_split_to_table($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: text,
  });
  const replace = createSqlFunction({
    ...base,
    name: "replace",
    member:
      "routine:$extension:citext.replace($extension:citext.citext,$extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c, c] as const,
    result: text,
  });
  const split_part = createSqlFunction({
    ...base,
    name: "split_part",
    member: "routine:$extension:citext.split_part($extension:citext.citext,$extension:citext.citext,pg_catalog.int4)",
    arguments: [c, c, int4] as const,
    result: text,
  });
  const strpos = createSqlFunction({
    ...base,
    name: "strpos",
    member: "routine:$extension:citext.strpos($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: int4,
  });
  const texticlike = createSqlFunction({
    ...base,
    name: "texticlike",
    member: "routine:$extension:citext.texticlike($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: bool,
  });
  const texticlike_text = createSqlFunction({
    ...base,
    name: "texticlike",
    member: "routine:$extension:citext.texticlike($extension:citext.citext,pg_catalog.text)",
    arguments: [c, text] as const,
    result: bool,
  });
  const texticnlike = createSqlFunction({
    ...base,
    name: "texticnlike",
    member: "routine:$extension:citext.texticnlike($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: bool,
  });
  const texticnlike_text = createSqlFunction({
    ...base,
    name: "texticnlike",
    member: "routine:$extension:citext.texticnlike($extension:citext.citext,pg_catalog.text)",
    arguments: [c, text] as const,
    result: bool,
  });
  const texticregexeq = createSqlFunction({
    ...base,
    name: "texticregexeq",
    member: "routine:$extension:citext.texticregexeq($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: bool,
  });
  const texticregexeq_text = createSqlFunction({
    ...base,
    name: "texticregexeq",
    member: "routine:$extension:citext.texticregexeq($extension:citext.citext,pg_catalog.text)",
    arguments: [c, text] as const,
    result: bool,
  });
  const texticregexne = createSqlFunction({
    ...base,
    name: "texticregexne",
    member: "routine:$extension:citext.texticregexne($extension:citext.citext,$extension:citext.citext)",
    arguments: [c, c] as const,
    result: bool,
  });
  const texticregexne_text = createSqlFunction({
    ...base,
    name: "texticregexne",
    member: "routine:$extension:citext.texticregexne($extension:citext.citext,pg_catalog.text)",
    arguments: [c, text] as const,
    result: bool,
  });
  const translate = createSqlFunction({
    ...base,
    name: "translate",
    member: "routine:$extension:citext.translate($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
    arguments: [c, c, text] as const,
    result: text,
  });
  const regexp_match = (...args: Parameters<typeof regexp_match_2> | Parameters<typeof regexp_match_3>) =>
    args.length === 2 ? regexp_match_2(...args) : regexp_match_3(...args);
  const regexp_matches = (...args: Parameters<typeof regexp_matches_2> | Parameters<typeof regexp_matches_3>) =>
    args.length === 2 ? regexp_matches_2(...args) : regexp_matches_3(...args);
  const regexp_replace = (...args: Parameters<typeof regexp_replace_3> | Parameters<typeof regexp_replace_4>) =>
    args.length === 3 ? regexp_replace_3(...args) : regexp_replace_4(...args);
  const regexp_split_to_array = (
    ...args: Parameters<typeof regexp_split_to_array_2> | Parameters<typeof regexp_split_to_array_3>
  ) => (args.length === 2 ? regexp_split_to_array_2(...args) : regexp_split_to_array_3(...args));
  const regexp_split_to_table = (
    ...args: Parameters<typeof regexp_split_to_table_2> | Parameters<typeof regexp_split_to_table_3>
  ) => (args.length === 2 ? regexp_split_to_table_2(...args) : regexp_split_to_table_3(...args));
  const functions = Object.freeze({
    citext_cmp,
    citext_eq,
    citext_ge,
    citext_gt,
    citext_hash_extended,
    citext_hash,
    citext_larger,
    citext_le,
    citext_lt,
    citext_ne,
    citext_pattern_cmp,
    citext_pattern_ge,
    citext_pattern_gt,
    citext_pattern_le,
    citext_pattern_lt,
    citext_smaller,
    citext: Object.freeze({ boolean: citext_bool, bpchar: citext_bpchar, inet: citext_inet }),
    citextsend,
    max,
    min,
    regexp_match,
    regexp_matches,
    regexp_replace,
    regexp_split_to_array,
    regexp_split_to_table,
    replace,
    split_part,
    strpos,
    texticlike,
    texticlike_text,
    texticnlike,
    texticnlike_text,
    texticregexeq,
    texticregexeq_text,
    texticregexne,
    texticregexne_text,
    translate,
  });
  const op_0_citext = createSqlOperator({
    ...base,
    name: "!~",
    member: "operator:$extension:citext.!~($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_0_text = createSqlOperator({
    ...base,
    name: "!~",
    member: "operator:$extension:citext.!~($extension:citext.citext,pg_catalog.text)",
    left: c,
    right: text,
    result: bool,
  });
  const op_1_citext = createSqlOperator({
    ...base,
    name: "!~*",
    member: "operator:$extension:citext.!~*($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_1_text = createSqlOperator({
    ...base,
    name: "!~*",
    member: "operator:$extension:citext.!~*($extension:citext.citext,pg_catalog.text)",
    left: c,
    right: text,
    result: bool,
  });
  const op_2_citext = createSqlOperator({
    ...base,
    name: "!~~",
    member: "operator:$extension:citext.!~~($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_2_text = createSqlOperator({
    ...base,
    name: "!~~",
    member: "operator:$extension:citext.!~~($extension:citext.citext,pg_catalog.text)",
    left: c,
    right: text,
    result: bool,
  });
  const op_3_citext = createSqlOperator({
    ...base,
    name: "!~~*",
    member: "operator:$extension:citext.!~~*($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_3_text = createSqlOperator({
    ...base,
    name: "!~~*",
    member: "operator:$extension:citext.!~~*($extension:citext.citext,pg_catalog.text)",
    left: c,
    right: text,
    result: bool,
  });
  const op_4_citext = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:citext.<($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_5_citext = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:citext.<=($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_6_citext = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:citext.<>($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_7_citext = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:citext.=($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_8_citext = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:citext.>($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_9_citext = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:citext.>=($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_10_citext = createSqlOperator({
    ...base,
    name: "~",
    member: "operator:$extension:citext.~($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_4_text = createSqlOperator({
    ...base,
    name: "~",
    member: "operator:$extension:citext.~($extension:citext.citext,pg_catalog.text)",
    left: c,
    right: text,
    result: bool,
  });
  const op_11_citext = createSqlOperator({
    ...base,
    name: "~*",
    member: "operator:$extension:citext.~*($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_5_text = createSqlOperator({
    ...base,
    name: "~*",
    member: "operator:$extension:citext.~*($extension:citext.citext,pg_catalog.text)",
    left: c,
    right: text,
    result: bool,
  });
  const op_12_citext = createSqlOperator({
    ...base,
    name: "~<=~",
    member: "operator:$extension:citext.~<=~($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_13_citext = createSqlOperator({
    ...base,
    name: "~<~",
    member: "operator:$extension:citext.~<~($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_14_citext = createSqlOperator({
    ...base,
    name: "~>=~",
    member: "operator:$extension:citext.~>=~($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_15_citext = createSqlOperator({
    ...base,
    name: "~>~",
    member: "operator:$extension:citext.~>~($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_16_citext = createSqlOperator({
    ...base,
    name: "~~",
    member: "operator:$extension:citext.~~($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_6_text = createSqlOperator({
    ...base,
    name: "~~",
    member: "operator:$extension:citext.~~($extension:citext.citext,pg_catalog.text)",
    left: c,
    right: text,
    result: bool,
  });
  const op_17_citext = createSqlOperator({
    ...base,
    name: "~~*",
    member: "operator:$extension:citext.~~*($extension:citext.citext,$extension:citext.citext)",
    left: c,
    right: c,
    result: bool,
  });
  const op_7_text = createSqlOperator({
    ...base,
    name: "~~*",
    member: "operator:$extension:citext.~~*($extension:citext.citext,pg_catalog.text)",
    left: c,
    right: text,
    result: bool,
  });
  const operators = Object.freeze({
    "!~": op_0_citext,
    "!~*": op_1_citext,
    "!~~": op_2_citext,
    "!~~*": op_3_citext,
    "<": op_4_citext,
    "<=": op_5_citext,
    "<>": op_6_citext,
    "=": op_7_citext,
    ">": op_8_citext,
    ">=": op_9_citext,
    "~": op_10_citext,
    "~*": op_11_citext,
    "~<=~": op_12_citext,
    "~<~": op_13_citext,
    "~>=~": op_14_citext,
    "~>~": op_15_citext,
    "~~": op_16_citext,
    "~~*": op_17_citext,
    text: Object.freeze({
      "!~": op_0_text,
      "!~*": op_1_text,
      "!~~": op_2_text,
      "!~~*": op_3_text,
      "~": op_4_text,
      "~*": op_5_text,
      "~~": op_6_text,
      "~~*": op_7_text,
    }),
  });
  function cast<Input, Source, TargetInput, Target>(
    source: ExtensionCodec<Input, Source>,
    target: ExtensionCodec<TargetInput, Target>,
    member: string,
  ) {
    return (value: ExtensionSqlInput<typeof source>) => {
      const expression =
        is(value, SQL.Aliased) && !v.is(v.object({ isSelectionField: v.literal(true) }), value) ? value.sql : value;
      // SAFETY: SQLWrapper is checked first; every other typed argument is codec input and encode validates it before binding.
      const native = v.is(sqlWrapper, expression)
        ? sql`${expression}`
        : sql`${sql.param(source.encode(value as CodecInput<typeof source>))}`;
      const sourceType = source.sqlType!,
        targetType = target.sqlType!;
      return checkedExtensionExpression(
        sql`((${native})::${extensionSqlType(sourceType.schema, sourceType.name)})::${extensionSqlType(targetType.schema, targetType.name)}`,
        target,
        [],
        undefined,
        member,
      );
    };
  }
  const casts = Object.freeze({
    citext_to_bpchar: cast(c, char, "cast:$extension:citext.citext->pg_catalog.bpchar"),
    citext_to_text: cast(c, text, "cast:$extension:citext.citext->pg_catalog.text"),
    citext_to_varchar: cast(c, varying, "cast:$extension:citext.citext->pg_catalog.varchar"),
    bool_to_citext: cast(bool, c, "cast:pg_catalog.bool->$extension:citext.citext"),
    bpchar_to_citext: cast(char, c, "cast:pg_catalog.bpchar->$extension:citext.citext"),
    inet_to_citext: cast(network, c, "cast:pg_catalog.inet->$extension:citext.citext"),
    text_to_citext: cast(text, c, "cast:pg_catalog.text->$extension:citext.citext"),
    varchar_to_citext: cast(varying, c, "cast:pg_catalog.varchar->$extension:citext.citext"),
  });
  const overloads = Object.freeze({
    "cast:$extension:citext.citext->pg_catalog.bpchar": casts.citext_to_bpchar,
    "cast:$extension:citext.citext->pg_catalog.text": casts.citext_to_text,
    "cast:$extension:citext.citext->pg_catalog.varchar": casts.citext_to_varchar,
    "cast:pg_catalog.bool->$extension:citext.citext": casts.bool_to_citext,
    "cast:pg_catalog.bpchar->$extension:citext.citext": casts.bpchar_to_citext,
    "cast:pg_catalog.inet->$extension:citext.citext": casts.inet_to_citext,
    "cast:pg_catalog.text->$extension:citext.citext": casts.text_to_citext,
    "cast:pg_catalog.varchar->$extension:citext.citext": casts.varchar_to_citext,
    "operator:$extension:citext.!~($extension:citext.citext,$extension:citext.citext)": op_0_citext,
    "operator:$extension:citext.!~($extension:citext.citext,pg_catalog.text)": op_0_text,
    "operator:$extension:citext.!~*($extension:citext.citext,$extension:citext.citext)": op_1_citext,
    "operator:$extension:citext.!~*($extension:citext.citext,pg_catalog.text)": op_1_text,
    "operator:$extension:citext.!~~($extension:citext.citext,$extension:citext.citext)": op_2_citext,
    "operator:$extension:citext.!~~($extension:citext.citext,pg_catalog.text)": op_2_text,
    "operator:$extension:citext.!~~*($extension:citext.citext,$extension:citext.citext)": op_3_citext,
    "operator:$extension:citext.!~~*($extension:citext.citext,pg_catalog.text)": op_3_text,
    "operator:$extension:citext.<($extension:citext.citext,$extension:citext.citext)": op_4_citext,
    "operator:$extension:citext.<=($extension:citext.citext,$extension:citext.citext)": op_5_citext,
    "operator:$extension:citext.<>($extension:citext.citext,$extension:citext.citext)": op_6_citext,
    "operator:$extension:citext.=($extension:citext.citext,$extension:citext.citext)": op_7_citext,
    "operator:$extension:citext.>($extension:citext.citext,$extension:citext.citext)": op_8_citext,
    "operator:$extension:citext.>=($extension:citext.citext,$extension:citext.citext)": op_9_citext,
    "operator:$extension:citext.~($extension:citext.citext,$extension:citext.citext)": op_10_citext,
    "operator:$extension:citext.~($extension:citext.citext,pg_catalog.text)": op_4_text,
    "operator:$extension:citext.~*($extension:citext.citext,$extension:citext.citext)": op_11_citext,
    "operator:$extension:citext.~*($extension:citext.citext,pg_catalog.text)": op_5_text,
    "operator:$extension:citext.~<=~($extension:citext.citext,$extension:citext.citext)": op_12_citext,
    "operator:$extension:citext.~<~($extension:citext.citext,$extension:citext.citext)": op_13_citext,
    "operator:$extension:citext.~>=~($extension:citext.citext,$extension:citext.citext)": op_14_citext,
    "operator:$extension:citext.~>~($extension:citext.citext,$extension:citext.citext)": op_15_citext,
    "operator:$extension:citext.~~($extension:citext.citext,$extension:citext.citext)": op_16_citext,
    "operator:$extension:citext.~~($extension:citext.citext,pg_catalog.text)": op_6_text,
    "operator:$extension:citext.~~*($extension:citext.citext,$extension:citext.citext)": op_17_citext,
    "operator:$extension:citext.~~*($extension:citext.citext,pg_catalog.text)": op_7_text,
    "routine:$extension:citext.citext_cmp($extension:citext.citext,$extension:citext.citext)": citext_cmp,
    "routine:$extension:citext.citext_eq($extension:citext.citext,$extension:citext.citext)": citext_eq,
    "routine:$extension:citext.citext_ge($extension:citext.citext,$extension:citext.citext)": citext_ge,
    "routine:$extension:citext.citext_gt($extension:citext.citext,$extension:citext.citext)": citext_gt,
    "routine:$extension:citext.citext_hash_extended($extension:citext.citext,pg_catalog.int8)": citext_hash_extended,
    "routine:$extension:citext.citext_hash($extension:citext.citext)": citext_hash,
    "routine:$extension:citext.citext_larger($extension:citext.citext,$extension:citext.citext)": citext_larger,
    "routine:$extension:citext.citext_le($extension:citext.citext,$extension:citext.citext)": citext_le,
    "routine:$extension:citext.citext_lt($extension:citext.citext,$extension:citext.citext)": citext_lt,
    "routine:$extension:citext.citext_ne($extension:citext.citext,$extension:citext.citext)": citext_ne,
    "routine:$extension:citext.citext_pattern_cmp($extension:citext.citext,$extension:citext.citext)":
      citext_pattern_cmp,
    "routine:$extension:citext.citext_pattern_ge($extension:citext.citext,$extension:citext.citext)": citext_pattern_ge,
    "routine:$extension:citext.citext_pattern_gt($extension:citext.citext,$extension:citext.citext)": citext_pattern_gt,
    "routine:$extension:citext.citext_pattern_le($extension:citext.citext,$extension:citext.citext)": citext_pattern_le,
    "routine:$extension:citext.citext_pattern_lt($extension:citext.citext,$extension:citext.citext)": citext_pattern_lt,
    "routine:$extension:citext.citext_smaller($extension:citext.citext,$extension:citext.citext)": citext_smaller,
    "routine:$extension:citext.citext(pg_catalog.bool)": citext_bool,
    "routine:$extension:citext.citext(pg_catalog.bpchar)": citext_bpchar,
    "routine:$extension:citext.citext(pg_catalog.inet)": citext_inet,
    "routine:$extension:citext.citextsend($extension:citext.citext)": citextsend,
    "routine:$extension:citext.max($extension:citext.citext)": max,
    "routine:$extension:citext.min($extension:citext.citext)": min,
    "routine:$extension:citext.regexp_match($extension:citext.citext,$extension:citext.citext,pg_catalog.text)":
      regexp_match_3,
    "routine:$extension:citext.regexp_match($extension:citext.citext,$extension:citext.citext)": regexp_match_2,
    "routine:$extension:citext.regexp_matches($extension:citext.citext,$extension:citext.citext,pg_catalog.text)":
      regexp_matches_3,
    "routine:$extension:citext.regexp_matches($extension:citext.citext,$extension:citext.citext)": regexp_matches_2,
    "routine:$extension:citext.regexp_replace($extension:citext.citext,$extension:citext.citext,pg_catalog.text,pg_catalog.text)":
      regexp_replace_4,
    "routine:$extension:citext.regexp_replace($extension:citext.citext,$extension:citext.citext,pg_catalog.text)":
      regexp_replace_3,
    "routine:$extension:citext.regexp_split_to_array($extension:citext.citext,$extension:citext.citext,pg_catalog.text)":
      regexp_split_to_array_3,
    "routine:$extension:citext.regexp_split_to_array($extension:citext.citext,$extension:citext.citext)":
      regexp_split_to_array_2,
    "routine:$extension:citext.regexp_split_to_table($extension:citext.citext,$extension:citext.citext,pg_catalog.text)":
      regexp_split_to_table_3,
    "routine:$extension:citext.regexp_split_to_table($extension:citext.citext,$extension:citext.citext)":
      regexp_split_to_table_2,
    "routine:$extension:citext.replace($extension:citext.citext,$extension:citext.citext,$extension:citext.citext)":
      replace,
    "routine:$extension:citext.split_part($extension:citext.citext,$extension:citext.citext,pg_catalog.int4)":
      split_part,
    "routine:$extension:citext.strpos($extension:citext.citext,$extension:citext.citext)": strpos,
    "routine:$extension:citext.texticlike($extension:citext.citext,$extension:citext.citext)": texticlike,
    "routine:$extension:citext.texticlike($extension:citext.citext,pg_catalog.text)": texticlike_text,
    "routine:$extension:citext.texticnlike($extension:citext.citext,$extension:citext.citext)": texticnlike,
    "routine:$extension:citext.texticnlike($extension:citext.citext,pg_catalog.text)": texticnlike_text,
    "routine:$extension:citext.texticregexeq($extension:citext.citext,$extension:citext.citext)": texticregexeq,
    "routine:$extension:citext.texticregexeq($extension:citext.citext,pg_catalog.text)": texticregexeq_text,
    "routine:$extension:citext.texticregexne($extension:citext.citext,$extension:citext.citext)": texticregexne,
    "routine:$extension:citext.texticregexne($extension:citext.citext,pg_catalog.text)": texticregexne_text,
    "routine:$extension:citext.translate($extension:citext.citext,$extension:citext.citext,pg_catalog.text)": translate,
  });
  const scalarFieldCodec = createExtensionCodec({
    id: codec.id,
    sqlType: codec.sqlType!,
    input: v.pipe(v.string(), v.brand("Citext")),
    output: v.pipe(v.string(), v.brand("Citext")),
    transport: "text",
    encode: (value) => codec.encode(value),
    decode: (value) => codec.decode(value),
  });
  const fieldOperators = Object.freeze({
    eq: {
      member: "operator:$extension:citext.=($extension:citext.citext,$extension:citext.citext)",
      schema: descriptor.schema,
      name: "=",
      operand: "field" as const,
    },
    ne: {
      member: "operator:$extension:citext.<>($extension:citext.citext,$extension:citext.citext)",
      schema: descriptor.schema,
      name: "<>",
      operand: "field" as const,
    },
    gt: {
      member: "operator:$extension:citext.>($extension:citext.citext,$extension:citext.citext)",
      schema: descriptor.schema,
      name: ">",
      operand: "field" as const,
    },
    gte: {
      member: "operator:$extension:citext.>=($extension:citext.citext,$extension:citext.citext)",
      schema: descriptor.schema,
      name: ">=",
      operand: "field" as const,
    },
    lt: {
      member: "operator:$extension:citext.<($extension:citext.citext,$extension:citext.citext)",
      schema: descriptor.schema,
      name: "<",
      operand: "field" as const,
    },
    lte: {
      member: "operator:$extension:citext.<=($extension:citext.citext,$extension:citext.citext)",
      schema: descriptor.schema,
      name: "<=",
      operand: "field" as const,
    },
    like: {
      member: "operator:$extension:citext.~~($extension:citext.citext,pg_catalog.text)",
      schema: descriptor.schema,
      name: "~~",
      operand: { schema: "pg_catalog", type: "text" } as const,
    },
    ilike: {
      member: "operator:$extension:citext.~~*($extension:citext.citext,pg_catalog.text)",
      schema: descriptor.schema,
      name: "~~*",
      operand: { schema: "pg_catalog", type: "text" } as const,
    },
  });
  const field = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:citext.citext",
      type: "citext",
      codec: scalarFieldCodec,
      value: { kind: "string" },
      search: { filter: true, comparison: true, order: true, text: true } as const,
      operators: fieldOperators,
    });
  const fieldArrayCodec: ExtensionCodec<PostgreSqlArray<Citext>, PostgreSqlArray<Citext>> = fullArray;
  // PostgreSQL MAXDIM is six. The codec validates rectangularity and exact bounds; the portable schema retains each native depth.
  let nested: ExtensionValueSchema = { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] };
  const depths: ExtensionValueSchema[] = [];
  for (let dimension = 0; dimension < 6; dimension++) {
    nested = { kind: "array", items: nested };
    depths.push(nested);
  }
  const arrayValue: ExtensionValueSchema = {
    kind: "object",
    properties: {
      dimensions: {
        kind: "array",
        items: {
          kind: "object",
          properties: {
            lowerBound: { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 },
            length: { kind: "number", integer: true, minimum: 0, maximum: 2147483647 },
          },
        },
      },
      values: { kind: "union", variants: depths },
    },
  };
  const arrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:citext._citext",
      type: "citext",
      array: true,
      codec: fieldArrayCodec,
      value: arrayValue,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const index = (method: "btree" | "hash", opclass: "citext_ops" | "citext_pattern_ops") =>
    createExtensionIndex({
      extension: descriptor,
      member: `opclass:$extension:citext.${opclass}/${method}`,
      method,
      opclass,
      type: "citext",
      default: opclass === "citext_ops",
    });
  return bindExtension(descriptor, {
    codec,
    arrayCodec: fullArray,
    value: citext,
    field,
    arrayField,
    fromText: casts.text_to_citext,
    toText: casts.citext_to_text,
    equal: operators["="],
    notEqual: operators["<>"],
    lessThan: operators["<"],
    lessOrEqual: operators["<="],
    greaterThan: operators[">"],
    greaterOrEqual: operators[">="],
    like: operators.text["~~"],
    ilike: operators.text["~~*"],
    matches: operators.text["~"],
    compare: functions.citext_cmp,
    hash: functions.citext_hash,
    hashExtended: functions.citext_hash_extended,
    min: functions.min,
    max: functions.max,
    regexpMatch: functions.regexp_match,
    regexpMatches: functions.regexp_matches,
    regexpReplace: functions.regexp_replace,
    regexpSplitToArray: functions.regexp_split_to_array,
    regexpSplitToTable: functions.regexp_split_to_table,
    replace: functions.replace,
    splitPart: functions.split_part,
    position: functions.strpos,
    translate: functions.translate,
    send: functions.citextsend,
    sql: Object.freeze({ functions, operators, casts, overloads }),
    indexes: Object.freeze({
      btree: () => index("btree", "citext_ops"),
      hash: () => index("hash", "citext_ops"),
      pattern: () => index("btree", "citext_pattern_ops"),
    }),
  });
}
