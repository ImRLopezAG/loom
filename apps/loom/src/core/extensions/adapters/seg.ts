import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  booleanCodec,
  createExtensionCodec,
  decodeFailure,
  floatCodec,
  nullableCodec,
  type PostgreSqlArray,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { createExtensionField, createExtensionIndex, type ExtensionValueSchema } from "../fields";
import { createSqlFunction, createSqlOperator } from "../sql";
export type { PostgreSqlArray, NonfiniteNumber } from "../codecs";

const decimalPattern = /^[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
function nativeDecimal(value: string): boolean {
  if (!decimalPattern.test(value)) return false;
  const number = Number(value),
    rounded = Math.fround(number);
  const zero = !/[1-9]/.test(value.split(/[eE]/)[0]!);
  return Number.isFinite(number) && Number.isFinite(rounded) && (zero || rounded !== 0);
}
const decimal = v.pipe(v.string(), v.check(nativeDecimal, "seg requires an in-range float4 decimal token"));
const boundary = v.strictObject({
  // PostgreSQL's pg_sprintf emits these exact tokens for arithmetic overflow in seg_out.
  value: v.union([decimal, v.picklist(["Infinity", "-Infinity"])]),
  certainty: v.picklist(["", "<", ">", "~"]),
});
export type SegBoundary = v.InferOutput<typeof boundary>;
const segment = v.variant("kind", [
  v.strictObject({ kind: v.literal("point"), value: boundary }),
  v.strictObject({ kind: v.literal("interval"), lower: v.nullable(boundary), upper: v.nullable(boundary) }),
  v.strictObject({ kind: v.literal("deviation"), center: boundary, deviation: decimal }),
]);
/** Decimal spelling records native precision; PostgreSQL owns float4 rounding and comparison. */
export type SegValue = v.InferOutput<typeof segment>;
export function segBoundary(value: string, certainty: SegBoundary["certainty"] = ""): SegBoundary {
  v.parse(decimal, value);
  return v.parse(boundary, { value, certainty });
}
export function segPoint(value: SegBoundary): SegValue {
  return v.parse(segment, { kind: "point", value });
}
export function segInterval(lower: SegBoundary | null, upper: SegBoundary | null): SegValue {
  return v.parse(segment, { kind: "interval", lower, upper });
}
/** The native parser calculates endpoints and their precision, then discards center/deviation notation. */
export function segDeviation(center: SegBoundary, deviation: string): SegValue {
  return v.parse(segment, { kind: "deviation", center, deviation });
}
function encodeBoundary(value: SegBoundary): string {
  v.parse(decimal, value.value);
  return `${value.certainty}${value.value}`;
}
function encodeSegment(value: SegValue): string {
  switch (value.kind) {
    case "point":
      return encodeBoundary(value.value);
    case "deviation":
      return `${encodeBoundary(value.center)}(+-)${value.deviation}`;
    case "interval":
      // seg_out can emit an inverted native intersection. seg_in cannot accept that result again.
      if (value.lower && value.upper && Math.fround(Number(value.lower.value)) > Math.fround(Number(value.upper.value)))
        throw new Error("Native seg inverted bounds cannot be rebound through seg_in");
      if (!value.lower && !value.upper) throw new Error("Native seg unbounded result cannot be rebound through seg_in");
      return `${value.lower ? encodeBoundary(value.lower) + " " : ""}..${value.upper ? " " + encodeBoundary(value.upper) : ""}`;
  }
}
function decodeBoundary(text: string): SegBoundary {
  const match = /^([<>~]?)([+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|-?Infinity)$/.exec(text.trim());
  if (!match) throw new Error("Invalid native seg boundary");
  return v.parse(boundary, { value: match[2], certainty: match[1] });
}
/** Decode seg_out, preserving precision and markers, including native-only inverted/infinite results. */
export function createSegCodec(schema: string) {
  return createExtensionCodec({
    id: "seg:seg:precision:1",
    sqlType: { schema, name: "seg" },
    input: segment,
    output: segment,
    transport: "text",
    encode: encodeSegment,
    decode(value) {
      const text = v.parse(v.string(), value).trim();
      const parts = text.split("..");
      if (parts.length === 1) return segPoint(decodeBoundary(text));
      if (parts.length !== 2) throw new Error("Invalid native seg text");
      return segInterval(
        parts[0]!.trim() ? decodeBoundary(parts[0]!) : null,
        parts[1]!.trim() ? decodeBoundary(parts[1]!) : null,
      );
    },
  });
}
export function createSegArrayCodec(schema: string) {
  const codec = arrayCodec(createSegCodec(schema));
  function bounds(value: PostgreSqlArray<SegValue>) {
    if (
      value.dimensions.length > 6 ||
      value.dimensions.some(
        ({ lowerBound, length }) =>
          !Number.isInteger(lowerBound) ||
          lowerBound < -2147483648 ||
          lowerBound > 2147483647 ||
          !Number.isInteger(length) ||
          length < 1 ||
          length > 2147483647 ||
          lowerBound + length > 2147483647,
      )
    )
      throw new Error("Invalid native seg array bounds");
  }
  return Object.freeze({
    ...codec,
    encode(value: PostgreSqlArray<SegValue>) {
      bounds(value);
      return codec.encode(value);
    },
    // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native array text is validated by the paired seg decoder.
    decode(value: unknown) {
      return decodeFailure(() => {
        const parsed = codec.decode(value);
        bounds(parsed);
        return parsed;
      });
    },
  });
}
const float4Codec = Object.freeze({
  ...floatCodec,
  id: "pg:float4:1",
  sqlType: Object.freeze({ schema: "pg_catalog", name: "float4" }),
});
const digest = "bba7c8f626ee6352397bd765ae103231780c7aa366ff9819bcf948ed22bd5fff";
type Descriptor = ExtensionDescriptor<"seg", { readonly version: "1.4"; readonly schema: string }>;
/** Exact seg 1.4 queries; native routines own geometry, certainty and precision ordering. */
export function createSeg_1_4<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "seg" ||
    descriptor.version !== "1.4" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("seg 1.4 requires its exact verified contract");
  const codec = createSegCodec(descriptor.schema),
    fullArray = createSegArrayCodec(descriptor.schema);
  const s = nullableCodec(codec),
    bool = nullableCodec(booleanCodec),
    int4 = nullableCodec(int4Codec),
    float = nullableCodec(float4Codec);
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const member0 = createSqlOperator({
    ...base,
    name: "@>",
    member: "operator:$extension:seg.@>($extension:seg.seg,$extension:seg.seg)",
    left: s,
    right: s,
    result: bool,
  });
  const member1 = createSqlOperator({
    ...base,
    name: "&&",
    member: "operator:$extension:seg.&&($extension:seg.seg,$extension:seg.seg)",
    left: s,
    right: s,
    result: bool,
  });
  const member2 = createSqlOperator({
    ...base,
    name: "&<",
    member: "operator:$extension:seg.&<($extension:seg.seg,$extension:seg.seg)",
    left: s,
    right: s,
    result: bool,
  });
  const member3 = createSqlOperator({
    ...base,
    name: "&>",
    member: "operator:$extension:seg.&>($extension:seg.seg,$extension:seg.seg)",
    left: s,
    right: s,
    result: bool,
  });
  const member4 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:seg.<($extension:seg.seg,$extension:seg.seg)",
    left: s,
    right: s,
    result: bool,
  });
  const member5 = createSqlOperator({
    ...base,
    name: "<@",
    member: "operator:$extension:seg.<@($extension:seg.seg,$extension:seg.seg)",
    left: s,
    right: s,
    result: bool,
  });
  const member6 = createSqlOperator({
    ...base,
    name: "<<",
    member: "operator:$extension:seg.<<($extension:seg.seg,$extension:seg.seg)",
    left: s,
    right: s,
    result: bool,
  });
  const member7 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:seg.<=($extension:seg.seg,$extension:seg.seg)",
    left: s,
    right: s,
    result: bool,
  });
  const member8 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:seg.<>($extension:seg.seg,$extension:seg.seg)",
    left: s,
    right: s,
    result: bool,
  });
  const member9 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:seg.=($extension:seg.seg,$extension:seg.seg)",
    left: s,
    right: s,
    result: bool,
  });
  const member10 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:seg.>($extension:seg.seg,$extension:seg.seg)",
    left: s,
    right: s,
    result: bool,
  });
  const member11 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:seg.>=($extension:seg.seg,$extension:seg.seg)",
    left: s,
    right: s,
    result: bool,
  });
  const member12 = createSqlOperator({
    ...base,
    name: ">>",
    member: "operator:$extension:seg.>>($extension:seg.seg,$extension:seg.seg)",
    left: s,
    right: s,
    result: bool,
  });
  const member13 = createSqlFunction({
    ...base,
    name: "seg_center",
    member: "routine:$extension:seg.seg_center($extension:seg.seg)",
    arguments: [s] as const,
    result: float,
  });
  const member14 = createSqlFunction({
    ...base,
    name: "seg_cmp",
    member: "routine:$extension:seg.seg_cmp($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: int4,
  });
  const member15 = createSqlFunction({
    ...base,
    name: "seg_contained",
    member: "routine:$extension:seg.seg_contained($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: bool,
  });
  const member16 = createSqlFunction({
    ...base,
    name: "seg_contains",
    member: "routine:$extension:seg.seg_contains($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: bool,
  });
  const member17 = createSqlFunction({
    ...base,
    name: "seg_different",
    member: "routine:$extension:seg.seg_different($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: bool,
  });
  const member18 = createSqlFunction({
    ...base,
    name: "seg_ge",
    member: "routine:$extension:seg.seg_ge($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: bool,
  });
  const member19 = createSqlFunction({
    ...base,
    name: "seg_gt",
    member: "routine:$extension:seg.seg_gt($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: bool,
  });
  const member20 = createSqlFunction({
    ...base,
    name: "seg_inter",
    member: "routine:$extension:seg.seg_inter($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: s,
  });
  const member21 = createSqlFunction({
    ...base,
    name: "seg_le",
    member: "routine:$extension:seg.seg_le($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: bool,
  });
  const member22 = createSqlFunction({
    ...base,
    name: "seg_left",
    member: "routine:$extension:seg.seg_left($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: bool,
  });
  const member23 = createSqlFunction({
    ...base,
    name: "seg_lower",
    member: "routine:$extension:seg.seg_lower($extension:seg.seg)",
    arguments: [s] as const,
    result: float,
  });
  const member24 = createSqlFunction({
    ...base,
    name: "seg_lt",
    member: "routine:$extension:seg.seg_lt($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: bool,
  });
  const member25 = createSqlFunction({
    ...base,
    name: "seg_over_left",
    member: "routine:$extension:seg.seg_over_left($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: bool,
  });
  const member26 = createSqlFunction({
    ...base,
    name: "seg_over_right",
    member: "routine:$extension:seg.seg_over_right($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: bool,
  });
  const member27 = createSqlFunction({
    ...base,
    name: "seg_overlap",
    member: "routine:$extension:seg.seg_overlap($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: bool,
  });
  const member28 = createSqlFunction({
    ...base,
    name: "seg_right",
    member: "routine:$extension:seg.seg_right($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: bool,
  });
  const member29 = createSqlFunction({
    ...base,
    name: "seg_same",
    member: "routine:$extension:seg.seg_same($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: bool,
  });
  const member30 = createSqlFunction({
    ...base,
    name: "seg_size",
    member: "routine:$extension:seg.seg_size($extension:seg.seg)",
    arguments: [s] as const,
    result: float,
  });
  const member31 = createSqlFunction({
    ...base,
    name: "seg_union",
    member: "routine:$extension:seg.seg_union($extension:seg.seg,$extension:seg.seg)",
    arguments: [s, s] as const,
    result: s,
  });
  const member32 = createSqlFunction({
    ...base,
    name: "seg_upper",
    member: "routine:$extension:seg.seg_upper($extension:seg.seg)",
    arguments: [s] as const,
    result: float,
  });
  const overloads = Object.freeze({
    "operator:$extension:seg.@>($extension:seg.seg,$extension:seg.seg)": member0,
    "operator:$extension:seg.&&($extension:seg.seg,$extension:seg.seg)": member1,
    "operator:$extension:seg.&<($extension:seg.seg,$extension:seg.seg)": member2,
    "operator:$extension:seg.&>($extension:seg.seg,$extension:seg.seg)": member3,
    "operator:$extension:seg.<($extension:seg.seg,$extension:seg.seg)": member4,
    "operator:$extension:seg.<@($extension:seg.seg,$extension:seg.seg)": member5,
    "operator:$extension:seg.<<($extension:seg.seg,$extension:seg.seg)": member6,
    "operator:$extension:seg.<=($extension:seg.seg,$extension:seg.seg)": member7,
    "operator:$extension:seg.<>($extension:seg.seg,$extension:seg.seg)": member8,
    "operator:$extension:seg.=($extension:seg.seg,$extension:seg.seg)": member9,
    "operator:$extension:seg.>($extension:seg.seg,$extension:seg.seg)": member10,
    "operator:$extension:seg.>=($extension:seg.seg,$extension:seg.seg)": member11,
    "operator:$extension:seg.>>($extension:seg.seg,$extension:seg.seg)": member12,
    "routine:$extension:seg.seg_center($extension:seg.seg)": member13,
    "routine:$extension:seg.seg_cmp($extension:seg.seg,$extension:seg.seg)": member14,
    "routine:$extension:seg.seg_contained($extension:seg.seg,$extension:seg.seg)": member15,
    "routine:$extension:seg.seg_contains($extension:seg.seg,$extension:seg.seg)": member16,
    "routine:$extension:seg.seg_different($extension:seg.seg,$extension:seg.seg)": member17,
    "routine:$extension:seg.seg_ge($extension:seg.seg,$extension:seg.seg)": member18,
    "routine:$extension:seg.seg_gt($extension:seg.seg,$extension:seg.seg)": member19,
    "routine:$extension:seg.seg_inter($extension:seg.seg,$extension:seg.seg)": member20,
    "routine:$extension:seg.seg_le($extension:seg.seg,$extension:seg.seg)": member21,
    "routine:$extension:seg.seg_left($extension:seg.seg,$extension:seg.seg)": member22,
    "routine:$extension:seg.seg_lower($extension:seg.seg)": member23,
    "routine:$extension:seg.seg_lt($extension:seg.seg,$extension:seg.seg)": member24,
    "routine:$extension:seg.seg_over_left($extension:seg.seg,$extension:seg.seg)": member25,
    "routine:$extension:seg.seg_over_right($extension:seg.seg,$extension:seg.seg)": member26,
    "routine:$extension:seg.seg_overlap($extension:seg.seg,$extension:seg.seg)": member27,
    "routine:$extension:seg.seg_right($extension:seg.seg,$extension:seg.seg)": member28,
    "routine:$extension:seg.seg_same($extension:seg.seg,$extension:seg.seg)": member29,
    "routine:$extension:seg.seg_size($extension:seg.seg)": member30,
    "routine:$extension:seg.seg_union($extension:seg.seg,$extension:seg.seg)": member31,
    "routine:$extension:seg.seg_upper($extension:seg.seg)": member32,
  });
  const operators = Object.freeze({
    "@>": member0,
    "&&": member1,
    "&<": member2,
    "&>": member3,
    "<": member4,
    "<@": member5,
    "<<": member6,
    "<=": member7,
    "<>": member8,
    "=": member9,
    ">": member10,
    ">=": member11,
    ">>": member12,
  });
  const functions = Object.freeze({
    seg_center: member13,
    seg_cmp: member14,
    seg_contained: member15,
    seg_contains: member16,
    seg_different: member17,
    seg_ge: member18,
    seg_gt: member19,
    seg_inter: member20,
    seg_le: member21,
    seg_left: member22,
    seg_lower: member23,
    seg_lt: member24,
    seg_over_left: member25,
    seg_over_right: member26,
    seg_overlap: member27,
    seg_right: member28,
    seg_same: member29,
    seg_size: member30,
    seg_union: member31,
    seg_upper: member32,
  });
  const boundValue: ExtensionValueSchema = {
    kind: "object",
    properties: { value: { kind: "string" }, certainty: { kind: "string", enum: ["", "<", ">", "~"] } },
  };
  const nullableBound: ExtensionValueSchema = { kind: "union", variants: [boundValue, { kind: "null" }] };
  const value: ExtensionValueSchema = {
    kind: "union",
    variants: [
      { kind: "object", properties: { kind: { kind: "string", enum: ["point"] }, value: boundValue } },
      {
        kind: "object",
        properties: { kind: { kind: "string", enum: ["interval"] }, lower: nullableBound, upper: nullableBound },
      },
      {
        kind: "object",
        properties: {
          kind: { kind: "string", enum: ["deviation"] },
          center: boundValue,
          deviation: { kind: "string" },
        },
      },
    ],
  };
  const field = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:seg.seg",
      type: "seg",
      codec,
      value,
      search: { filter: true, comparison: false, order: false, text: false } as const,
      operators: {
        eq: {
          member: "operator:$extension:seg.=($extension:seg.seg,$extension:seg.seg)",
          schema: descriptor.schema,
          name: "=",
          operand: "field" as const,
        },
        ne: {
          member: "operator:$extension:seg.<>($extension:seg.seg,$extension:seg.seg)",
          schema: descriptor.schema,
          name: "<>",
          operand: "field" as const,
        },
      },
    });
  let nested: ExtensionValueSchema = { kind: "union", variants: [value, { kind: "null" }] };
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
      member: "type:$extension:seg._seg",
      type: "seg",
      array: true,
      codec: fullArray,
      value: arrayValue,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const index = (method: "btree" | "gist", opclass: "seg_ops" | "gist_seg_ops") =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: `opclass:$extension:seg.${opclass}/${method}`,
        method,
        opclass,
        type: "seg",
        default: true,
      }),
      input: Object.freeze({ schema: descriptor.schema, type: "seg", dimensions: 0 }),
    });
  return bindExtension(descriptor, {
    codec,
    arrayCodec: fullArray,
    boundary: segBoundary,
    point: segPoint,
    interval: segInterval,
    deviation: segDeviation,
    field,
    arrayField,
    equal: operators["="],
    notEqual: operators["<>"],
    lessThan: operators["<"],
    lessOrEqual: operators["<="],
    greaterThan: operators[">"],
    greaterOrEqual: operators[">="],
    contains: operators["@>"],
    containedBy: operators["<@"],
    overlaps: operators["&&"],
    leftOf: operators["<<"],
    rightOf: operators[">>"],
    overLeft: operators["&<"],
    overRight: operators["&>"],
    compare: functions.seg_cmp,
    center: functions.seg_center,
    lower: functions.seg_lower,
    upper: functions.seg_upper,
    size: functions.seg_size,
    union: functions.seg_union,
    intersection: functions.seg_inter,
    sql: Object.freeze({ functions, operators, overloads }),
    indexes: Object.freeze({ btree: () => index("btree", "seg_ops"), gist: () => index("gist", "gist_seg_ops") }),
  });
}
