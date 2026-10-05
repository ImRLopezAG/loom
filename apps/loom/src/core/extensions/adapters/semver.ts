import * as v from "valibot";
import { sql, is, SQL, type SQLWrapper } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  binaryCodec,
  booleanCodec,
  createExtensionCodec,
  decodeFailure,
  floatCodec,
  integerCodec,
  nullableCodec,
  numericCodec,
  textCodec,
  type CodecInput,
  type ExtensionCodec,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { float4Codec, int2Codec } from "../primitive-number-codecs";
import { createExtensionField, createExtensionIndex, type ExtensionValueSchema } from "../fields";
import {
  checkedExtensionExpression,
  createSqlAggregate,
  createSqlFunction,
  createSqlOperator,
  extensionSqlType,
  type ExtensionSqlInput,
} from "../sql";
import {
  createSemverArrayCodec,
  createSemverCodec,
  createSemverMultirangeArrayCodec,
  createSemverMultirangeCodec,
  createSemverRangeArrayCodec,
  createSemverRangeCodec,
  semver,
  semverPattern,
} from "./semver-codecs";
export {
  semver,
  semverPattern,
  semverText,
  type SemverMultirange,
  type SemverRange,
  type SemverText,
  type PostgreSqlArray,
  type PostgreSqlRange,
} from "./semver-codecs";
export type { NonfiniteNumber } from "../codecs";

const sqlWrapper = v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value));
const rangeBoundsValue = v.picklist(["[)", "[]", "(]", "()"]);
/** PostgreSQL range constructor flags; NULL flags are rejected natively, so the codec requires a literal. */
const rangeBoundsCodec = createExtensionCodec({
  id: "semver:range-bounds:1",
  sqlType: { schema: "pg_catalog", name: "text" },
  input: rangeBoundsValue,
  output: rangeBoundsValue,
  transport: "native",
  encode: (value) => value,
  decode: (value) => value,
});
const digest = "5a21997dcf96a0af38e49bc1d9309905050a05f18e6afe15f37fb2a63722a86e";
type Descriptor = ExtensionDescriptor<"semver", { readonly version: "0.40.0"; readonly schema: string }>;
const member = {
  semver: "$extension:semver.semver",
  range: "$extension:semver.semverrange",
  multirange: "$extension:semver.semvermultirange",
} as const;
const binary = `(${member.semver},${member.semver})`;

/** Exact semver 0.40.0 queries; native routines own precedence, coercion and range normalization. */
export function createSemver_0_40_0<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "semver" ||
    descriptor.version !== "0.40.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("semver 0.40.0 requires its exact verified contract");
  const codec = createSemverCodec(descriptor.schema),
    fullArray = createSemverArrayCodec(descriptor.schema),
    rangeCodec = createSemverRangeCodec(descriptor.schema),
    rangeArray = createSemverRangeArrayCodec(descriptor.schema),
    multirangeCodec = createSemverMultirangeCodec(descriptor.schema),
    multirangeArray = createSemverMultirangeArrayCodec(descriptor.schema);
  const s = nullableCodec(codec),
    range = nullableCodec(rangeCodec),
    multirange = nullableCodec(multirangeCodec),
    bool = nullableCodec(booleanCodec),
    int4 = nullableCodec(int4Codec),
    text = nullableCodec(textCodec),
    bytes = nullableCodec(binaryCodec);
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const comparison = (name: "<" | "<=" | "<>" | "=" | ">" | ">=") =>
    createSqlOperator({
      ...base,
      name,
      member: `operator:$extension:semver.${name}${binary}`,
      left: s,
      right: s,
      result: bool,
    });
  const predicate = (name: "semver_eq" | "semver_ne" | "semver_lt" | "semver_le" | "semver_gt" | "semver_ge") =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:semver.${name}${binary}`,
      arguments: [s, s] as const,
      result: bool,
    });
  const component = (name: "get_semver_major" | "get_semver_minor" | "get_semver_patch" | "hash_semver") =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:semver.${name}(${member.semver})`,
      arguments: [s] as const,
      result: int4,
    });
  const choose = (name: "semver_larger" | "semver_smaller") =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:semver.${name}${binary}`,
      arguments: [s, s] as const,
      result: s,
    });
  const aggregate = (name: "max" | "min") =>
    createSqlAggregate({
      ...base,
      name,
      member: `routine:$extension:semver.${name}(${member.semver})`,
      arguments: [s] as const,
      result: s,
    });
  const textual = (name: "to_semver" | "semver") =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:semver.${name}(pg_catalog.text)`,
      arguments: [text] as const,
      result: s,
    });
  /** These SQL-language wrappers call unqualified to_semver; they need the extension schema on the session search_path. */
  const numeric = <Input, Output>(source: ExtensionCodec<Input, Output>) =>
    createSqlFunction({
      ...base,
      name: "semver",
      member: `routine:$extension:semver.semver(pg_catalog.${source.sqlType!.name})`,
      arguments: [nullableCodec(source)] as const,
      result: s,
    });
  const operators = Object.freeze({
    "<": comparison("<"),
    "<=": comparison("<="),
    "<>": comparison("<>"),
    "=": comparison("="),
    ">": comparison(">"),
    ">=": comparison(">="),
  });
  const get_semver_prerelease = createSqlFunction({
    ...base,
    name: "get_semver_prerelease",
    member: `routine:$extension:semver.get_semver_prerelease(${member.semver})`,
    arguments: [s] as const,
    result: text,
  });
  const is_semver = createSqlFunction({
    ...base,
    name: "is_semver",
    member: "routine:$extension:semver.is_semver(pg_catalog.text)",
    arguments: [text] as const,
    result: bool,
  });
  const semver_cmp = createSqlFunction({
    ...base,
    name: "semver_cmp",
    member: `routine:$extension:semver.semver_cmp${binary}`,
    arguments: [s, s] as const,
    result: int4,
  });
  const toText = createSqlFunction({
    ...base,
    name: "text",
    member: `routine:$extension:semver.text(${member.semver})`,
    arguments: [s] as const,
    result: text,
  });
  const constructors = Object.freeze({
    float4: numeric(float4Codec),
    float8: numeric(floatCodec),
    int2: numeric(int2Codec),
    int4: numeric(int4Codec),
    int8: numeric(integerCodec),
    numeric: numeric(numericCodec),
    text: textual("semver"),
  });
  /** NULL bounds are infinite; the native constructor is not strict and never returns NULL. */
  const rangeOf = createSqlFunction({
    ...base,
    name: "semverrange",
    member: `routine:$extension:semver.semverrange${binary}`,
    arguments: [s, s] as const,
    result: rangeCodec,
  });
  const rangeWithBounds = createSqlFunction({
    ...base,
    name: "semverrange",
    member: `routine:$extension:semver.semverrange(${member.semver},${member.semver},pg_catalog.text)`,
    arguments: [s, s, rangeBoundsCodec] as const,
    result: rangeCodec,
  });
  const semverrange = (...values: Parameters<typeof rangeOf> | Parameters<typeof rangeWithBounds>) =>
    values.length === 2 ? rangeOf(...values) : rangeWithBounds(...values);
  const emptyMultirange = createSqlFunction({
    ...base,
    name: "semvermultirange",
    member: `routine:$extension:semver.semvermultirange()`,
    arguments: [] as const,
    result: multirangeCodec,
  });
  const singleMultirange = createSqlFunction({
    ...base,
    name: "semvermultirange",
    member: `routine:$extension:semver.semvermultirange(${member.range})`,
    arguments: [range] as const,
    result: multirange,
  });
  /** VARIADIC elements must be non-NULL ranges; PostgreSQL sorts and merges them. */
  const variadicMultirange = createSqlFunction({
    ...base,
    name: "semvermultirange",
    member: `routine:$extension:semver.semvermultirange($extension:semver._semverrange)`,
    arguments: [] as const,
    variadic: rangeCodec,
    result: multirange,
  });
  type RangeInput = ExtensionSqlInput<typeof rangeCodec>;
  function semvermultirange(): ReturnType<typeof emptyMultirange>;
  function semvermultirange(value: ExtensionSqlInput<typeof range>): ReturnType<typeof singleMultirange>;
  function semvermultirange(
    first: RangeInput,
    second: RangeInput,
    ...rest: RangeInput[]
  ): ReturnType<typeof variadicMultirange>;
  function semvermultirange(...values: ExtensionSqlInput<typeof range>[]) {
    if (values.length === 0) return emptyMultirange();
    if (values.length === 1) return singleMultirange(values[0]!);
    // SAFETY: The public overloads admit NULL only for the one-range routine; variadic elements are non-NULL ranges.
    return variadicMultirange(...(values as RangeInput[]));
  }
  const functions = Object.freeze({
    semver_send: createSqlFunction({
      ...base,
      name: "semver_send",
      member: `routine:$extension:semver.semver_send(${member.semver})`,
      arguments: [s] as const,
      result: bytes,
    }),
    get_semver_major: component("get_semver_major"),
    get_semver_minor: component("get_semver_minor"),
    get_semver_patch: component("get_semver_patch"),
    get_semver_prerelease,
    hash_semver: component("hash_semver"),
    is_semver,
    max: aggregate("max"),
    min: aggregate("min"),
    semver: constructors,
    semver_cmp,
    semver_eq: predicate("semver_eq"),
    semver_ge: predicate("semver_ge"),
    semver_gt: predicate("semver_gt"),
    semver_larger: choose("semver_larger"),
    semver_le: predicate("semver_le"),
    semver_lt: predicate("semver_lt"),
    semver_ne: predicate("semver_ne"),
    semver_smaller: choose("semver_smaller"),
    semvermultirange: Object.freeze({
      empty: emptyMultirange,
      range: singleMultirange,
      variadic: variadicMultirange,
    }),
    semverrange: Object.freeze({ bounds: rangeOf, flags: rangeWithBounds }),
    text: toText,
    to_semver: textual("to_semver"),
  });
  function cast<Input, Source, TargetInput, Target>(
    source: ExtensionCodec<Input, Source>,
    target: ExtensionCodec<TargetInput, Target>,
    id: string,
  ) {
    return (value: ExtensionSqlInput<typeof source>) => {
      const expression =
        is(value, SQL.Aliased) && !v.is(v.object({ isSelectionField: v.literal(true) }), value) ? value.sql : value;
      // SAFETY: SQLWrapper is checked first; every other typed argument is codec input and encode validates it before binding.
      const native = v.is(sqlWrapper, expression)
        ? sql`${expression}`
        : sql`${sql.param(decodeFailure(() => source.encode(value as CodecInput<typeof source>)))}`;
      const sourceType = source.sqlType!,
        targetType = target.sqlType!;
      return checkedExtensionExpression(
        sql`((${native})::${extensionSqlType(sourceType.schema, sourceType.name)})::${extensionSqlType(targetType.schema, targetType.name)}`,
        target,
        [],
        undefined,
        id,
      );
    };
  }
  /**
   * Explicit casts run the same native coercions as the semver(...) routines, including to_semver's lenient forms.
   * Numeric casts inherit the wrappers' search_path requirement; the text cast calls the C parser directly.
   */
  const casts = Object.freeze({
    semver_to_text: cast(s, text, `cast:${member.semver}->pg_catalog.text`),
    semverrange_to_semvermultirange: cast(range, multirange, `cast:${member.range}->${member.multirange}`),
    float4_to_semver: cast(nullableCodec(float4Codec), s, `cast:pg_catalog.float4->${member.semver}`),
    float8_to_semver: cast(nullableCodec(floatCodec), s, `cast:pg_catalog.float8->${member.semver}`),
    int2_to_semver: cast(nullableCodec(int2Codec), s, `cast:pg_catalog.int2->${member.semver}`),
    int4_to_semver: cast(nullableCodec(int4Codec), s, `cast:pg_catalog.int4->${member.semver}`),
    int8_to_semver: cast(nullableCodec(integerCodec), s, `cast:pg_catalog.int8->${member.semver}`),
    numeric_to_semver: cast(nullableCodec(numericCodec), s, `cast:pg_catalog.numeric->${member.semver}`),
    text_to_semver: cast(text, s, `cast:pg_catalog.text->${member.semver}`),
  });
  const overloads = Object.freeze({
    [`routine:$extension:semver.semver_send(${member.semver})`]: functions.semver_send,
    [`cast:${member.semver}->pg_catalog.text`]: casts.semver_to_text,
    [`cast:${member.range}->${member.multirange}`]: casts.semverrange_to_semvermultirange,
    [`cast:pg_catalog.float4->${member.semver}`]: casts.float4_to_semver,
    [`cast:pg_catalog.float8->${member.semver}`]: casts.float8_to_semver,
    [`cast:pg_catalog.int2->${member.semver}`]: casts.int2_to_semver,
    [`cast:pg_catalog.int4->${member.semver}`]: casts.int4_to_semver,
    [`cast:pg_catalog.int8->${member.semver}`]: casts.int8_to_semver,
    [`cast:pg_catalog.numeric->${member.semver}`]: casts.numeric_to_semver,
    [`cast:pg_catalog.text->${member.semver}`]: casts.text_to_semver,
    [`operator:$extension:semver.<${binary}`]: operators["<"],
    [`operator:$extension:semver.<=${binary}`]: operators["<="],
    [`operator:$extension:semver.<>${binary}`]: operators["<>"],
    [`operator:$extension:semver.=${binary}`]: operators["="],
    [`operator:$extension:semver.>${binary}`]: operators[">"],
    [`operator:$extension:semver.>=${binary}`]: operators[">="],
    [`routine:$extension:semver.get_semver_major(${member.semver})`]: functions.get_semver_major,
    [`routine:$extension:semver.get_semver_minor(${member.semver})`]: functions.get_semver_minor,
    [`routine:$extension:semver.get_semver_patch(${member.semver})`]: functions.get_semver_patch,
    [`routine:$extension:semver.get_semver_prerelease(${member.semver})`]: functions.get_semver_prerelease,
    [`routine:$extension:semver.hash_semver(${member.semver})`]: functions.hash_semver,
    "routine:$extension:semver.is_semver(pg_catalog.text)": functions.is_semver,
    [`routine:$extension:semver.max(${member.semver})`]: functions.max,
    [`routine:$extension:semver.min(${member.semver})`]: functions.min,
    [`routine:$extension:semver.semver_cmp${binary}`]: functions.semver_cmp,
    [`routine:$extension:semver.semver_eq${binary}`]: functions.semver_eq,
    [`routine:$extension:semver.semver_ge${binary}`]: functions.semver_ge,
    [`routine:$extension:semver.semver_gt${binary}`]: functions.semver_gt,
    [`routine:$extension:semver.semver_larger${binary}`]: functions.semver_larger,
    [`routine:$extension:semver.semver_le${binary}`]: functions.semver_le,
    [`routine:$extension:semver.semver_lt${binary}`]: functions.semver_lt,
    [`routine:$extension:semver.semver_ne${binary}`]: functions.semver_ne,
    [`routine:$extension:semver.semver_smaller${binary}`]: functions.semver_smaller,
    "routine:$extension:semver.semver(pg_catalog.float4)": constructors.float4,
    "routine:$extension:semver.semver(pg_catalog.float8)": constructors.float8,
    "routine:$extension:semver.semver(pg_catalog.int2)": constructors.int2,
    "routine:$extension:semver.semver(pg_catalog.int4)": constructors.int4,
    "routine:$extension:semver.semver(pg_catalog.int8)": constructors.int8,
    "routine:$extension:semver.semver(pg_catalog.numeric)": constructors.numeric,
    "routine:$extension:semver.semver(pg_catalog.text)": constructors.text,
    "routine:$extension:semver.semvermultirange()": emptyMultirange,
    "routine:$extension:semver.semvermultirange($extension:semver._semverrange)": variadicMultirange,
    [`routine:$extension:semver.semvermultirange(${member.range})`]: singleMultirange,
    [`routine:$extension:semver.semverrange(${member.semver},${member.semver},pg_catalog.text)`]: rangeWithBounds,
    [`routine:$extension:semver.semverrange${binary}`]: rangeOf,
    [`routine:$extension:semver.text(${member.semver})`]: toText,
    "routine:$extension:semver.to_semver(pg_catalog.text)": functions.to_semver,
  });
  const fieldOperator = (name: "<" | "<=" | "<>" | "=" | ">" | ">=") => ({
    member: `operator:$extension:semver.${name}${binary}`,
    schema: descriptor.schema,
    name,
    operand: "field" as const,
  });
  const field = () =>
    createExtensionField({
      extension: descriptor,
      member: `type:${member.semver}`,
      type: "semver",
      codec,
      value: { kind: "string", pattern: semverPattern },
      search: { filter: true, comparison: true, order: true, text: false } as const,
      operators: {
        eq: fieldOperator("="),
        ne: fieldOperator("<>"),
        gt: fieldOperator(">"),
        gte: fieldOperator(">="),
        lt: fieldOperator("<"),
        lte: fieldOperator("<="),
      },
    });
  const versionValue: ExtensionValueSchema = { kind: "string", pattern: semverPattern };
  const nullableVersion: ExtensionValueSchema = { kind: "union", variants: [versionValue, { kind: "null" }] };
  const rangeValue: ExtensionValueSchema = {
    kind: "union",
    variants: [
      { kind: "object", properties: { empty: { kind: "boolean" } } },
      {
        kind: "object",
        properties: {
          empty: { kind: "boolean" },
          lower: nullableVersion,
          upper: nullableVersion,
          lowerInclusive: { kind: "boolean" },
          upperInclusive: { kind: "boolean" },
        },
      },
    ],
  };
  const multirangeValue: ExtensionValueSchema = { kind: "array", items: rangeValue };
  function arrayValue(element: ExtensionValueSchema): ExtensionValueSchema {
    let nested: ExtensionValueSchema = { kind: "union", variants: [element, { kind: "null" }] };
    const depths: ExtensionValueSchema[] = [];
    for (let rank = 0; rank < 6; rank++) {
      nested = { kind: "array", items: nested };
      depths.push(nested);
    }
    return {
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
  }
  const unsearched = { filter: false, comparison: false, order: false, text: false } as const;
  const arrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:semver._semver",
      type: "semver",
      array: true,
      codec: fullArray,
      value: arrayValue(versionValue),
      search: unsearched,
    });
  const rangeField = () =>
    createExtensionField({
      extension: descriptor,
      member: `type:${member.range}`,
      type: "semverrange",
      codec: rangeCodec,
      value: rangeValue,
      search: unsearched,
    });
  const rangeArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:semver._semverrange",
      type: "semverrange",
      array: true,
      codec: rangeArray,
      value: arrayValue(rangeValue),
      search: unsearched,
    });
  const multirangeField = () =>
    createExtensionField({
      extension: descriptor,
      member: `type:${member.multirange}`,
      type: "semvermultirange",
      codec: multirangeCodec,
      value: multirangeValue,
      search: unsearched,
    });
  const multirangeArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:semver._semvermultirange",
      type: "semvermultirange",
      array: true,
      codec: multirangeArray,
      value: arrayValue(multirangeValue),
      search: unsearched,
    });
  const index = (method: "btree" | "hash") =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: `opclass:$extension:semver.semver_ops/${method}`,
        method,
        opclass: "semver_ops",
        type: "semver",
        default: true,
      }),
      input: Object.freeze({ schema: descriptor.schema, type: "semver", dimensions: 0 }),
    });
  return bindExtension(descriptor, {
    codec,
    arrayCodec: fullArray,
    rangeCodec,
    rangeArrayCodec: rangeArray,
    multirangeCodec,
    multirangeArrayCodec: multirangeArray,
    value: semver,
    field,
    arrayField,
    rangeField,
    rangeArrayField,
    multirangeField,
    multirangeArrayField,
    equal: operators["="],
    notEqual: operators["<>"],
    lessThan: operators["<"],
    lessOrEqual: operators["<="],
    greaterThan: operators[">"],
    greaterOrEqual: operators[">="],
    compare: semver_cmp,
    major: functions.get_semver_major,
    minor: functions.get_semver_minor,
    patch: functions.get_semver_patch,
    prerelease: get_semver_prerelease,
    hash: functions.hash_semver,
    isValid: is_semver,
    parse: constructors.text,
    coerce: functions.to_semver,
    fromInt2: constructors.int2,
    fromInt4: constructors.int4,
    fromInt8: constructors.int8,
    fromFloat4: constructors.float4,
    fromFloat8: constructors.float8,
    fromNumeric: constructors.numeric,
    toText,
    larger: functions.semver_larger,
    smaller: functions.semver_smaller,
    max: functions.max,
    min: functions.min,
    range: semverrange,
    multirange: semvermultirange,
    sql: Object.freeze({ functions, operators, casts, overloads }),
    indexes: Object.freeze({ btree: () => index("btree"), hash: () => index("hash") }),
  });
}
