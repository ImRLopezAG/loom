import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { booleanCodec, binaryCodec, floatCodec, nullableCodec, arrayCodec } from "../codecs";
import { int4Codec } from "../native-codecs";
import { createExtensionField, createExtensionIndex, type ExtensionValueSchema } from "../fields";
import { createSqlFunction, createSqlOperator } from "../sql";
import { createCubeCodec, createCubeArrayCodec, cubePoint, cubeBox } from "./cube-codecs";
export { cubePoint, cubeBox } from "./cube-codecs";
export type { CubeCoordinate, CubeValue } from "./cube-codecs";
export type { PostgreSqlArray, NonfiniteNumber } from "../codecs";
const digest = "205421c1cacc198ba7088c60ec4f76b0a8e7adec18be87d17a8082dd7b0515e2";
type Descriptor = ExtensionDescriptor<"cube", { readonly version: "1.5"; readonly schema: string }>;

/** Exact cube 1.5 queries. Built-in constructors own normalization and geometric semantics. */
export function createCube_1_5<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "cube" ||
    descriptor.version !== "1.5" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("cube 1.5 requires its exact verified contract");
  const codec = createCubeCodec(descriptor.schema),
    fullArray = createCubeArrayCodec(descriptor.schema);
  const c = nullableCodec(codec),
    bool = nullableCodec(booleanCodec),
    int4 = nullableCodec(int4Codec),
    float = nullableCodec(floatCodec),
    bytes = nullableCodec(binaryCodec),
    floats = nullableCodec(arrayCodec(floatCodec)),
    ints = nullableCodec(arrayCodec(int4Codec));
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const member0 = createSqlOperator({
    ...base,
    name: "->",
    member: "operator:$extension:cube.->($extension:cube.cube,pg_catalog.int4)",
    left: c,
    right: int4,
    result: float,
  });
  const member1 = createSqlOperator({
    ...base,
    name: "@>",
    member: "operator:$extension:cube.@>($extension:cube.cube,$extension:cube.cube)",
    left: c,
    right: c,
    result: bool,
  });
  const member2 = createSqlOperator({
    ...base,
    name: "&&",
    member: "operator:$extension:cube.&&($extension:cube.cube,$extension:cube.cube)",
    left: c,
    right: c,
    result: bool,
  });
  const member3 = createSqlOperator({
    ...base,
    name: "<->",
    member: "operator:$extension:cube.<->($extension:cube.cube,$extension:cube.cube)",
    left: c,
    right: c,
    result: float,
  });
  const member4 = createSqlOperator({
    ...base,
    name: "<",
    member: "operator:$extension:cube.<($extension:cube.cube,$extension:cube.cube)",
    left: c,
    right: c,
    result: bool,
  });
  const member5 = createSqlOperator({
    ...base,
    name: "<@",
    member: "operator:$extension:cube.<@($extension:cube.cube,$extension:cube.cube)",
    left: c,
    right: c,
    result: bool,
  });
  const member6 = createSqlOperator({
    ...base,
    name: "<#>",
    member: "operator:$extension:cube.<#>($extension:cube.cube,$extension:cube.cube)",
    left: c,
    right: c,
    result: float,
  });
  const member7 = createSqlOperator({
    ...base,
    name: "<=",
    member: "operator:$extension:cube.<=($extension:cube.cube,$extension:cube.cube)",
    left: c,
    right: c,
    result: bool,
  });
  const member8 = createSqlOperator({
    ...base,
    name: "<=>",
    member: "operator:$extension:cube.<=>($extension:cube.cube,$extension:cube.cube)",
    left: c,
    right: c,
    result: float,
  });
  const member9 = createSqlOperator({
    ...base,
    name: "<>",
    member: "operator:$extension:cube.<>($extension:cube.cube,$extension:cube.cube)",
    left: c,
    right: c,
    result: bool,
  });
  const member10 = createSqlOperator({
    ...base,
    name: "=",
    member: "operator:$extension:cube.=($extension:cube.cube,$extension:cube.cube)",
    left: c,
    right: c,
    result: bool,
  });
  const member11 = createSqlOperator({
    ...base,
    name: ">",
    member: "operator:$extension:cube.>($extension:cube.cube,$extension:cube.cube)",
    left: c,
    right: c,
    result: bool,
  });
  const member12 = createSqlOperator({
    ...base,
    name: ">=",
    member: "operator:$extension:cube.>=($extension:cube.cube,$extension:cube.cube)",
    left: c,
    right: c,
    result: bool,
  });
  const member13 = createSqlOperator({
    ...base,
    name: "~>",
    member: "operator:$extension:cube.~>($extension:cube.cube,pg_catalog.int4)",
    left: c,
    right: int4,
    result: float,
  });
  const member14 = createSqlFunction({
    ...base,
    name: "cube_cmp",
    member: "routine:$extension:cube.cube_cmp($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: int4,
  });
  const member15 = createSqlFunction({
    ...base,
    name: "cube_contained",
    member: "routine:$extension:cube.cube_contained($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: bool,
  });
  const member16 = createSqlFunction({
    ...base,
    name: "cube_contains",
    member: "routine:$extension:cube.cube_contains($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: bool,
  });
  const member17 = createSqlFunction({
    ...base,
    name: "cube_coord_llur",
    member: "routine:$extension:cube.cube_coord_llur($extension:cube.cube,pg_catalog.int4)",
    arguments: [c, int4] as const,
    result: float,
  });
  const member18 = createSqlFunction({
    ...base,
    name: "cube_coord",
    member: "routine:$extension:cube.cube_coord($extension:cube.cube,pg_catalog.int4)",
    arguments: [c, int4] as const,
    result: float,
  });
  const member19 = createSqlFunction({
    ...base,
    name: "cube_dim",
    member: "routine:$extension:cube.cube_dim($extension:cube.cube)",
    arguments: [c] as const,
    result: int4,
  });
  const member20 = createSqlFunction({
    ...base,
    name: "cube_distance",
    member: "routine:$extension:cube.cube_distance($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: float,
  });
  const member21 = createSqlFunction({
    ...base,
    name: "cube_enlarge",
    member: "routine:$extension:cube.cube_enlarge($extension:cube.cube,pg_catalog.float8,pg_catalog.int4)",
    arguments: [c, float, int4] as const,
    result: c,
  });
  const member22 = createSqlFunction({
    ...base,
    name: "cube_eq",
    member: "routine:$extension:cube.cube_eq($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: bool,
  });
  const member23 = createSqlFunction({
    ...base,
    name: "cube_ge",
    member: "routine:$extension:cube.cube_ge($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: bool,
  });
  const member24 = createSqlFunction({
    ...base,
    name: "cube_gt",
    member: "routine:$extension:cube.cube_gt($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: bool,
  });
  const member25 = createSqlFunction({
    ...base,
    name: "cube_inter",
    member: "routine:$extension:cube.cube_inter($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: c,
  });
  const member26 = createSqlFunction({
    ...base,
    name: "cube_is_point",
    member: "routine:$extension:cube.cube_is_point($extension:cube.cube)",
    arguments: [c] as const,
    result: bool,
  });
  const member27 = createSqlFunction({
    ...base,
    name: "cube_le",
    member: "routine:$extension:cube.cube_le($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: bool,
  });
  const member28 = createSqlFunction({
    ...base,
    name: "cube_ll_coord",
    member: "routine:$extension:cube.cube_ll_coord($extension:cube.cube,pg_catalog.int4)",
    arguments: [c, int4] as const,
    result: float,
  });
  const member29 = createSqlFunction({
    ...base,
    name: "cube_lt",
    member: "routine:$extension:cube.cube_lt($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: bool,
  });
  const member30 = createSqlFunction({
    ...base,
    name: "cube_ne",
    member: "routine:$extension:cube.cube_ne($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: bool,
  });
  const member31 = createSqlFunction({
    ...base,
    name: "cube_overlap",
    member: "routine:$extension:cube.cube_overlap($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: bool,
  });
  const member32 = createSqlFunction({
    ...base,
    name: "cube_send",
    member: "routine:$extension:cube.cube_send($extension:cube.cube)",
    arguments: [c] as const,
    result: bytes,
  });
  const member33 = createSqlFunction({
    ...base,
    name: "cube_size",
    member: "routine:$extension:cube.cube_size($extension:cube.cube)",
    arguments: [c] as const,
    result: float,
  });
  const member34 = createSqlFunction({
    ...base,
    name: "cube_subset",
    member: "routine:$extension:cube.cube_subset($extension:cube.cube,pg_catalog._int4)",
    arguments: [c, ints] as const,
    result: c,
  });
  const member35 = createSqlFunction({
    ...base,
    name: "cube_union",
    member: "routine:$extension:cube.cube_union($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: c,
  });
  const member36 = createSqlFunction({
    ...base,
    name: "cube_ur_coord",
    member: "routine:$extension:cube.cube_ur_coord($extension:cube.cube,pg_catalog.int4)",
    arguments: [c, int4] as const,
    result: float,
  });
  const member37 = createSqlFunction({
    ...base,
    name: "cube",
    member: "routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8,pg_catalog.float8)",
    arguments: [c, float, float] as const,
    result: c,
  });
  const member38 = createSqlFunction({
    ...base,
    name: "cube",
    member: "routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8)",
    arguments: [c, float] as const,
    result: c,
  });
  const member39 = createSqlFunction({
    ...base,
    name: "cube",
    member: "routine:$extension:cube.cube(pg_catalog._float8,pg_catalog._float8)",
    arguments: [floats, floats] as const,
    result: c,
  });
  const member40 = createSqlFunction({
    ...base,
    name: "cube",
    member: "routine:$extension:cube.cube(pg_catalog._float8)",
    arguments: [floats] as const,
    result: c,
  });
  const member41 = createSqlFunction({
    ...base,
    name: "cube",
    member: "routine:$extension:cube.cube(pg_catalog.float8,pg_catalog.float8)",
    arguments: [float, float] as const,
    result: c,
  });
  const member42 = createSqlFunction({
    ...base,
    name: "cube",
    member: "routine:$extension:cube.cube(pg_catalog.float8)",
    arguments: [float] as const,
    result: c,
  });
  const member43 = createSqlFunction({
    ...base,
    name: "distance_chebyshev",
    member: "routine:$extension:cube.distance_chebyshev($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: float,
  });
  const member44 = createSqlFunction({
    ...base,
    name: "distance_taxicab",
    member: "routine:$extension:cube.distance_taxicab($extension:cube.cube,$extension:cube.cube)",
    arguments: [c, c] as const,
    result: float,
  });
  const overloads = Object.freeze({
    "operator:$extension:cube.->($extension:cube.cube,pg_catalog.int4)": member0,
    "operator:$extension:cube.@>($extension:cube.cube,$extension:cube.cube)": member1,
    "operator:$extension:cube.&&($extension:cube.cube,$extension:cube.cube)": member2,
    "operator:$extension:cube.<->($extension:cube.cube,$extension:cube.cube)": member3,
    "operator:$extension:cube.<($extension:cube.cube,$extension:cube.cube)": member4,
    "operator:$extension:cube.<@($extension:cube.cube,$extension:cube.cube)": member5,
    "operator:$extension:cube.<#>($extension:cube.cube,$extension:cube.cube)": member6,
    "operator:$extension:cube.<=($extension:cube.cube,$extension:cube.cube)": member7,
    "operator:$extension:cube.<=>($extension:cube.cube,$extension:cube.cube)": member8,
    "operator:$extension:cube.<>($extension:cube.cube,$extension:cube.cube)": member9,
    "operator:$extension:cube.=($extension:cube.cube,$extension:cube.cube)": member10,
    "operator:$extension:cube.>($extension:cube.cube,$extension:cube.cube)": member11,
    "operator:$extension:cube.>=($extension:cube.cube,$extension:cube.cube)": member12,
    "operator:$extension:cube.~>($extension:cube.cube,pg_catalog.int4)": member13,
    "routine:$extension:cube.cube_cmp($extension:cube.cube,$extension:cube.cube)": member14,
    "routine:$extension:cube.cube_contained($extension:cube.cube,$extension:cube.cube)": member15,
    "routine:$extension:cube.cube_contains($extension:cube.cube,$extension:cube.cube)": member16,
    "routine:$extension:cube.cube_coord_llur($extension:cube.cube,pg_catalog.int4)": member17,
    "routine:$extension:cube.cube_coord($extension:cube.cube,pg_catalog.int4)": member18,
    "routine:$extension:cube.cube_dim($extension:cube.cube)": member19,
    "routine:$extension:cube.cube_distance($extension:cube.cube,$extension:cube.cube)": member20,
    "routine:$extension:cube.cube_enlarge($extension:cube.cube,pg_catalog.float8,pg_catalog.int4)": member21,
    "routine:$extension:cube.cube_eq($extension:cube.cube,$extension:cube.cube)": member22,
    "routine:$extension:cube.cube_ge($extension:cube.cube,$extension:cube.cube)": member23,
    "routine:$extension:cube.cube_gt($extension:cube.cube,$extension:cube.cube)": member24,
    "routine:$extension:cube.cube_inter($extension:cube.cube,$extension:cube.cube)": member25,
    "routine:$extension:cube.cube_is_point($extension:cube.cube)": member26,
    "routine:$extension:cube.cube_le($extension:cube.cube,$extension:cube.cube)": member27,
    "routine:$extension:cube.cube_ll_coord($extension:cube.cube,pg_catalog.int4)": member28,
    "routine:$extension:cube.cube_lt($extension:cube.cube,$extension:cube.cube)": member29,
    "routine:$extension:cube.cube_ne($extension:cube.cube,$extension:cube.cube)": member30,
    "routine:$extension:cube.cube_overlap($extension:cube.cube,$extension:cube.cube)": member31,
    "routine:$extension:cube.cube_send($extension:cube.cube)": member32,
    "routine:$extension:cube.cube_size($extension:cube.cube)": member33,
    "routine:$extension:cube.cube_subset($extension:cube.cube,pg_catalog._int4)": member34,
    "routine:$extension:cube.cube_union($extension:cube.cube,$extension:cube.cube)": member35,
    "routine:$extension:cube.cube_ur_coord($extension:cube.cube,pg_catalog.int4)": member36,
    "routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8,pg_catalog.float8)": member37,
    "routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8)": member38,
    "routine:$extension:cube.cube(pg_catalog._float8,pg_catalog._float8)": member39,
    "routine:$extension:cube.cube(pg_catalog._float8)": member40,
    "routine:$extension:cube.cube(pg_catalog.float8,pg_catalog.float8)": member41,
    "routine:$extension:cube.cube(pg_catalog.float8)": member42,
    "routine:$extension:cube.distance_chebyshev($extension:cube.cube,$extension:cube.cube)": member43,
    "routine:$extension:cube.distance_taxicab($extension:cube.cube,$extension:cube.cube)": member44,
  });
  const operators = Object.freeze({
    "->": member0,
    "@>": member1,
    "&&": member2,
    "<->": member3,
    "<": member4,
    "<@": member5,
    "<#>": member6,
    "<=": member7,
    "<=>": member8,
    "<>": member9,
    "=": member10,
    ">": member11,
    ">=": member12,
    "~>": member13,
  });
  const constructors = Object.freeze({
    appendInterval: member37,
    appendCoordinate: member38,
    arrays: member39,
    array: member40,
    interval: member41,
    number: member42,
  });
  const functions = Object.freeze({
    cube_cmp: member14,
    cube_contained: member15,
    cube_contains: member16,
    cube_coord_llur: member17,
    cube_coord: member18,
    cube_dim: member19,
    cube_distance: member20,
    cube_enlarge: member21,
    cube_eq: member22,
    cube_ge: member23,
    cube_gt: member24,
    cube_inter: member25,
    cube_is_point: member26,
    cube_le: member27,
    cube_ll_coord: member28,
    cube_lt: member29,
    cube_ne: member30,
    cube_overlap: member31,
    cube_send: member32,
    cube_size: member33,
    cube_subset: member34,
    cube_union: member35,
    cube_ur_coord: member36,
    distance_chebyshev: member43,
    distance_taxicab: member44,
    cube: constructors,
  });
  const coordinateValue: ExtensionValueSchema = {
    kind: "union",
    variants: [
      { kind: "number" },
      { kind: "object", properties: { nonfinite: { kind: "string", enum: ["NaN", "Infinity", "-Infinity"] } } },
    ],
  };
  const cornerValue: ExtensionValueSchema = { kind: "array", items: coordinateValue };
  const value: ExtensionValueSchema = {
    kind: "union",
    variants: [
      { kind: "object", properties: { kind: { kind: "string", enum: ["point"] }, coordinates: cornerValue } },
      {
        kind: "object",
        properties: { kind: { kind: "string", enum: ["box"] }, lower: cornerValue, upper: cornerValue },
      },
    ],
  };
  const field = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:cube.cube",
      type: "cube",
      codec,
      value,
      search: { filter: true, comparison: false, order: false, text: false } as const,
      operators: {
        eq: {
          member: "operator:$extension:cube.=($extension:cube.cube,$extension:cube.cube)",
          schema: descriptor.schema,
          name: "=",
          operand: "field" as const,
        },
        ne: {
          member: "operator:$extension:cube.<>($extension:cube.cube,$extension:cube.cube)",
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
      member: "type:$extension:cube._cube",
      type: "cube",
      array: true,
      codec: fullArray,
      value: arrayValue,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const index = (method: "btree" | "gist", opclass: "cube_ops" | "gist_cube_ops") =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: `opclass:$extension:cube.${opclass}/${method}`,
        method,
        opclass,
        type: "cube",
        default: true,
      }),
      input: Object.freeze({ schema: descriptor.schema, type: "cube", dimensions: 0 }),
    });
  return bindExtension(descriptor, {
    codec,
    arrayCodec: fullArray,
    point: cubePoint,
    box: cubeBox,
    field,
    arrayField,
    fromNumber: constructors.number,
    fromInterval: constructors.interval,
    fromArray: constructors.array,
    fromArrays: constructors.arrays,
    appendCoordinate: constructors.appendCoordinate,
    appendInterval: constructors.appendInterval,
    equal: operators["="],
    notEqual: operators["<>"],
    lessThan: operators["<"],
    lessOrEqual: operators["<="],
    greaterThan: operators[">"],
    greaterOrEqual: operators[">="],
    contains: operators["@>"],
    containedBy: operators["<@"],
    overlaps: operators["&&"],
    distance: operators["<->"],
    taxicabDistance: operators["<#>"],
    chebyshevDistance: operators["<=>"],
    coordinate: operators["->"],
    boundCoordinate: operators["~>"],
    compare: functions.cube_cmp,
    dimension: functions.cube_dim,
    isPoint: functions.cube_is_point,
    lowerCoordinate: functions.cube_ll_coord,
    upperCoordinate: functions.cube_ur_coord,
    enlarge: functions.cube_enlarge,
    subset: functions.cube_subset,
    union: functions.cube_union,
    intersection: functions.cube_inter,
    volume: functions.cube_size,
    send: functions.cube_send,
    sql: Object.freeze({ functions, operators, overloads }),
    indexes: Object.freeze({ btree: () => index("btree", "cube_ops"), gist: () => index("gist", "gist_cube_ops") }),
  });
}
