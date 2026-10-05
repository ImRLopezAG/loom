import * as v from "valibot";
import { sql, is, SQL, type SQLWrapper } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  binaryCodec,
  booleanCodec,
  createExtensionCodec,
  decodeFailure,
  nullableCodec,
  textCodec,
  type CodecInput,
  type ExtensionCodec,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { float4Codec } from "../primitive-number-codecs";
import { createExtensionField, createExtensionIndex, type ExtensionValueSchema } from "../fields";
import {
  checkedExtensionExpression,
  createSqlFunction,
  createSqlOperator,
  extensionSqlType,
  type ExtensionSqlInput,
} from "../sql";
import { createPrefixRangeArrayCodec, createPrefixRangeCodec, prefixRange } from "./prefix-codecs";
export { prefixRange, type PrefixRange } from "./prefix-codecs";
export type { PostgreSqlArray, NonfiniteNumber } from "../codecs";

const digest = "954698fcbe5ada03bdf4bcbd9b22014e77570456f0d8471d4ca2bd99d75581a7";
const sqlWrapper = v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value));
type Descriptor = ExtensionDescriptor<"prefix", { readonly version: "1.2.0"; readonly schema: string }>;
const member = "$extension:prefix.prefix_range";
const binary = `(${member},${member})`;
const losslessText = createExtensionCodec({
  id: "prefix:pg-text:utf8:1",
  sqlType: { schema: "pg_catalog", name: "text" },
  input: v.pipe(
    v.string(),
    v.check((value) => !value.includes("\0") && !/[\uD800-\uDFFF]/u.test(value), "Expected lossless PostgreSQL UTF8 text"),
  ),
  output: v.pipe(
    v.string(),
    v.check((value) => !value.includes("\0") && !/[\uD800-\uDFFF]/u.test(value), "Expected lossless PostgreSQL UTF8 text"),
  ),
  transport: "native",
  encode: (value) => value,
  decode: (value) => value,
});

/** Exact prefix 1.2.0 queries; native prefix_range owns range folding, swap and containment. */
export function createPrefix_1_2_0<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "prefix" ||
    descriptor.version !== "1.2.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("prefix 1.2.0 requires its exact verified contract");
  const codec = createPrefixRangeCodec(descriptor.schema),
    fullArray = createPrefixRangeArrayCodec(descriptor.schema);
  const range = nullableCodec(codec),
    bool = nullableCodec(booleanCodec),
    int4 = nullableCodec(int4Codec),
    float = nullableCodec(float4Codec),
    text = nullableCodec(losslessText),
    bytes = nullableCodec(binaryCodec);
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const comparison = (name: "<" | "<=" | "<>" | "=" | ">" | ">=") =>
    createSqlOperator({
      ...base,
      name,
      member: `operator:$extension:prefix.${name}${binary}`,
      left: range,
      right: range,
      result: bool,
    });
  const operators = Object.freeze({
    "@>": createSqlOperator({
      ...base,
      name: "@>",
      member: `operator:$extension:prefix.@>${binary}`,
      left: range,
      right: range,
      result: bool,
    }),
    "&": createSqlOperator({
      ...base,
      name: "&",
      member: `operator:$extension:prefix.&${binary}`,
      left: range,
      right: range,
      result: range,
    }),
    "&&": createSqlOperator({
      ...base,
      name: "&&",
      member: `operator:$extension:prefix.&&${binary}`,
      left: range,
      right: range,
      result: bool,
    }),
    "<": comparison("<"),
    "<@": createSqlOperator({
      ...base,
      name: "<@",
      member: `operator:$extension:prefix.<@${binary}`,
      left: range,
      right: range,
      result: bool,
    }),
    "<=": comparison("<="),
    "<>": comparison("<>"),
    "=": comparison("="),
    ">": comparison(">"),
    ">=": comparison(">="),
    "|": createSqlOperator({
      ...base,
      name: "|",
      member: `operator:$extension:prefix.|${binary}`,
      left: range,
      right: range,
      result: range,
    }),
  });
  const predicate = (
    name:
      | "prefix_range_contained_by_strict"
      | "prefix_range_contained_by"
      | "prefix_range_contains_strict"
      | "prefix_range_contains"
      | "prefix_range_eq"
      | "prefix_range_ge"
      | "prefix_range_gt"
      | "prefix_range_le"
      | "prefix_range_lt"
      | "prefix_range_neq"
      | "prefix_range_overlaps",
  ) =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:prefix.${name}${binary}`,
      arguments: [range, range] as const,
      result: bool,
    });
  const combine = (name: "prefix_range_inter" | "prefix_range_union") =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:prefix.${name}${binary}`,
      arguments: [range, range] as const,
      result: range,
    });
  const functions = Object.freeze({
    length: createSqlFunction({
      ...base,
      name: "length",
      member: `routine:$extension:prefix.length(${member})`,
      arguments: [range] as const,
      result: int4,
    }),
    pr_penalty: createSqlFunction({
      ...base,
      name: "pr_penalty",
      member: `routine:$extension:prefix.pr_penalty${binary}`,
      arguments: [range, range] as const,
      result: float,
    }),
    prefix_range_cmp: createSqlFunction({
      ...base,
      name: "prefix_range_cmp",
      member: `routine:$extension:prefix.prefix_range_cmp${binary}`,
      arguments: [range, range] as const,
      result: int4,
    }),
    prefix_range_contained_by_strict: predicate("prefix_range_contained_by_strict"),
    prefix_range_contained_by: predicate("prefix_range_contained_by"),
    prefix_range_contains_strict: predicate("prefix_range_contains_strict"),
    prefix_range_contains: predicate("prefix_range_contains"),
    prefix_range_eq: predicate("prefix_range_eq"),
    prefix_range_ge: predicate("prefix_range_ge"),
    prefix_range_gt: predicate("prefix_range_gt"),
    prefix_range_inter: combine("prefix_range_inter"),
    prefix_range_le: predicate("prefix_range_le"),
    prefix_range_lt: predicate("prefix_range_lt"),
    prefix_range_neq: predicate("prefix_range_neq"),
    prefix_range_overlaps: predicate("prefix_range_overlaps"),
    prefix_range_send: createSqlFunction({
      ...base,
      name: "prefix_range_send",
      member: `routine:$extension:prefix.prefix_range_send(${member})`,
      arguments: [range] as const,
      result: bytes,
    }),
    prefix_range_union: combine("prefix_range_union"),
    prefix_range: Object.freeze({
      bounds: createSqlFunction({
        ...base,
        name: "prefix_range",
        member: "routine:$extension:prefix.prefix_range(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
        arguments: [text, text, text] as const,
        result: range,
      }),
      text: createSqlFunction({
        ...base,
        name: "prefix_range",
        member: "routine:$extension:prefix.prefix_range(pg_catalog.text)",
        arguments: [text] as const,
        result: range,
      }),
    }),
    text: createSqlFunction({
      ...base,
      name: "text",
      member: `routine:$extension:prefix.text(${member})`,
      arguments: [range] as const,
      result: nullableCodec(textCodec),
    }),
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
  const casts = Object.freeze({
    prefix_range_to_text: cast(range, nullableCodec(textCodec), `cast:${member}->pg_catalog.text`),
    text_to_prefix_range: cast(text, range, `cast:pg_catalog.text->${member}`),
  });
  const overloads = Object.freeze({
    [`cast:${member}->pg_catalog.text`]: casts.prefix_range_to_text,
    [`cast:pg_catalog.text->${member}`]: casts.text_to_prefix_range,
    [`operator:$extension:prefix.@>${binary}`]: operators["@>"],
    [`operator:$extension:prefix.&${binary}`]: operators["&"],
    [`operator:$extension:prefix.&&${binary}`]: operators["&&"],
    [`operator:$extension:prefix.<${binary}`]: operators["<"],
    [`operator:$extension:prefix.<@${binary}`]: operators["<@"],
    [`operator:$extension:prefix.<=${binary}`]: operators["<="],
    [`operator:$extension:prefix.<>${binary}`]: operators["<>"],
    [`operator:$extension:prefix.=${binary}`]: operators["="],
    [`operator:$extension:prefix.>${binary}`]: operators[">"],
    [`operator:$extension:prefix.>=${binary}`]: operators[">="],
    [`operator:$extension:prefix.|${binary}`]: operators["|"],
    [`routine:$extension:prefix.length(${member})`]: functions.length,
    [`routine:$extension:prefix.pr_penalty${binary}`]: functions.pr_penalty,
    [`routine:$extension:prefix.prefix_range_cmp${binary}`]: functions.prefix_range_cmp,
    [`routine:$extension:prefix.prefix_range_contained_by_strict${binary}`]: functions.prefix_range_contained_by_strict,
    [`routine:$extension:prefix.prefix_range_contained_by${binary}`]: functions.prefix_range_contained_by,
    [`routine:$extension:prefix.prefix_range_contains_strict${binary}`]: functions.prefix_range_contains_strict,
    [`routine:$extension:prefix.prefix_range_contains${binary}`]: functions.prefix_range_contains,
    [`routine:$extension:prefix.prefix_range_eq${binary}`]: functions.prefix_range_eq,
    [`routine:$extension:prefix.prefix_range_ge${binary}`]: functions.prefix_range_ge,
    [`routine:$extension:prefix.prefix_range_gt${binary}`]: functions.prefix_range_gt,
    [`routine:$extension:prefix.prefix_range_inter${binary}`]: functions.prefix_range_inter,
    [`routine:$extension:prefix.prefix_range_le${binary}`]: functions.prefix_range_le,
    [`routine:$extension:prefix.prefix_range_lt${binary}`]: functions.prefix_range_lt,
    [`routine:$extension:prefix.prefix_range_neq${binary}`]: functions.prefix_range_neq,
    [`routine:$extension:prefix.prefix_range_overlaps${binary}`]: functions.prefix_range_overlaps,
    [`routine:$extension:prefix.prefix_range_send(${member})`]: functions.prefix_range_send,
    [`routine:$extension:prefix.prefix_range_union${binary}`]: functions.prefix_range_union,
    "routine:$extension:prefix.prefix_range(pg_catalog.text,pg_catalog.text,pg_catalog.text)":
      functions.prefix_range.bounds,
    "routine:$extension:prefix.prefix_range(pg_catalog.text)": functions.prefix_range.text,
    [`routine:$extension:prefix.text(${member})`]: functions.text,
  });
  const field = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:prefix.prefix_range",
      type: "prefix_range",
      codec,
      value: { kind: "string" },
      search: { filter: true, comparison: false, order: false, text: false } as const,
      operators: {
        eq: {
          member: `operator:$extension:prefix.=${binary}`,
          schema: descriptor.schema,
          name: "=",
          operand: "field" as const,
        },
        ne: {
          member: `operator:$extension:prefix.<>${binary}`,
          schema: descriptor.schema,
          name: "<>",
          operand: "field" as const,
        },
      },
    });
  let nested: ExtensionValueSchema = { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] };
  const depths: ExtensionValueSchema[] = [];
  for (let rank = 0; rank < 6; rank++) {
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
      member: "type:$extension:prefix._prefix_range",
      type: "prefix_range",
      array: true,
      codec: fullArray,
      value: arrayValue,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const index = (method: "btree" | "gist", opclass: "btree_prefix_range_ops" | "gist_prefix_range_ops") =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: `opclass:$extension:prefix.${opclass}/${method}`,
        method,
        opclass,
        type: "prefix_range",
        default: true,
      }),
      input: Object.freeze({ schema: descriptor.schema, type: "prefix_range", dimensions: 0 }),
    });
  return bindExtension(descriptor, {
    codec,
    arrayCodec: fullArray,
    value: prefixRange,
    field,
    arrayField,
    fromText: casts.text_to_prefix_range,
    toText: casts.prefix_range_to_text,
    equal: operators["="],
    notEqual: operators["<>"],
    lessThan: operators["<"],
    lessOrEqual: operators["<="],
    greaterThan: operators[">"],
    greaterOrEqual: operators[">="],
    contains: operators["@>"],
    containedBy: operators["<@"],
    overlaps: operators["&&"],
    intersect: operators["&"],
    union: operators["|"],
    compare: functions.prefix_range_cmp,
    length: functions.length,
    penalty: functions.pr_penalty,
    send: functions.prefix_range_send,
    prefix: functions.prefix_range,
    sql: Object.freeze({ functions, operators, casts, overloads }),
    indexes: Object.freeze({
      btree: () => index("btree", "btree_prefix_range_ops"),
      gist: () => index("gist", "gist_prefix_range_ops"),
    }),
  });
}
