import * as v from "valibot";
import { is, SQL, sql, type SQLWrapper } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { arrayCodec, binaryCodec, booleanCodec, decodeFailure, floatCodec, nullableCodec } from "../codecs";
import { int4Codec } from "../native-codecs";
import { createExtensionField, type ExtensionValueSchema } from "../fields";
import {
  checkedExtensionExpression,
  createSqlAggregate,
  createSqlFunction,
  createSqlOperator,
  createSqlRows,
  defaultSqlArgument,
  extensionSqlType,
  type ExtensionSqlInput,
  type ExtensionSqlWindow,
} from "../sql";
import {
  boundedInt8Codec,
  createRoaringBitmap64ArrayCodec,
  createRoaringBitmap64Codec,
  createRoaringBitmapArrayCodec,
  createRoaringBitmapCodec,
} from "./roaringbitmap-codecs";

export { decodeRoaringBitmap64Bytes, decodeRoaringBitmapBytes } from "./roaringbitmap-codecs";
export type { PostgreSqlArray, RoaringBitmap, RoaringBitmap64 } from "./roaringbitmap-codecs";

const digest = "967ad98be988b37be7f198057e9f02bcbe325a0eab5364722ba4c6763cbc406a";
type Descriptor = ExtensionDescriptor<"roaringbitmap", { readonly version: "1.2"; readonly schema: string }>;
const sqlWrapper = v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value));

/** roaringbitmap types have equality operators but no btree/hash opclass, so DISTINCT cannot sort or hash them. */
function withoutDistinct<const Arguments extends unknown[], Result>(
  aggregate: ((...values: Arguments) => Result) & {
    readonly filter: (condition: SQL<boolean>, ...values: Arguments) => Result;
    readonly over: (window: ExtensionSqlWindow, ...values: Arguments) => Result;
  },
) {
  return Object.freeze(
    Object.assign((...values: Arguments) => aggregate(...values), { filter: aggregate.filter, over: aggregate.over }),
  );
}

/**
 * Exact roaringbitmap 1.2 queries. Native routines own set algebra, range clamping, unsigned member order and
 * aggregate state; roaringbitmap64 members are uint64 values that PostgreSQL exposes as two's-complement int8.
 */
export function createRoaringbitmap_1_2<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "roaringbitmap" ||
    descriptor.version !== "1.2" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("roaringbitmap 1.2 requires its exact verified contract");
  const schema = descriptor.schema;
  const codec = createRoaringBitmapCodec(schema),
    codec64 = createRoaringBitmap64Codec(schema),
    bitmapArray = createRoaringBitmapArrayCodec(schema),
    bitmap64Array = createRoaringBitmap64ArrayCodec(schema);
  const rb = nullableCodec(codec),
    rb64 = nullableCodec(codec64),
    bool = nullableCodec(booleanCodec),
    i4 = nullableCodec(int4Codec),
    i8 = nullableCodec(boundedInt8Codec),
    f8 = nullableCodec(floatCodec),
    bytea = nullableCodec(binaryCodec),
    i4s = nullableCodec(arrayCodec(int4Codec)),
    i8s = nullableCodec(arrayCodec(boundedInt8Codec));
  const base = { schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const T = "$extension:roaringbitmap.roaringbitmap",
    T64 = "$extension:roaringbitmap.roaringbitmap64",
    I4 = "pg_catalog.int4",
    I8 = "pg_catalog.int8";
  const fn = <const Arguments extends readonly (typeof rb | typeof rb64 | typeof i4 | typeof i8 | typeof bytea | typeof i4s | typeof i8s)[], Result extends typeof rb | typeof rb64 | typeof bool | typeof i4 | typeof i8 | typeof f8 | typeof bytea | typeof i4s | typeof i8s>(
    name: string,
    signature: string,
    arguments_: Arguments,
    result: Result,
  ) =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:roaringbitmap.${name}(${signature})`,
      arguments: arguments_,
      result,
    });
  const aggregate = <Argument extends typeof rb | typeof rb64, Result extends typeof rb | typeof rb64 | typeof i8>(
    name: string,
    signature: string,
    argument: Argument,
    result: Result,
  ) =>
    withoutDistinct(
      createSqlAggregate({
        ...base,
        name,
        member: `routine:$extension:roaringbitmap.${name}(${signature})`,
        arguments: [argument] as const,
        result,
      }),
    );
  /**
   * One width: 32-bit uses int4 members, 64-bit int8 members; both take int8 ranges and shift distances.
   * add.elementBitmap, containedby.element and shiftleft (and the |, <@ and << operators over them) are captured
   * SQL-language bodies calling unqualified helpers: they need the extension schema on the session search_path.
   */
  function width<
    Bitmap extends typeof rb | typeof rb64,
    Element extends typeof i4 | typeof i8,
    Elements extends typeof i4s | typeof i8s,
  >(prefix: "rb" | "rb64", type: string, bitmap: Bitmap, element: Element, elementType: string, elements: Elements) {
    const pair = `${type},${type}`;
    const range = `${type},${I8},${I8}`;
    const name = (suffix: string) => `${prefix}_${suffix}`;
    const binary = (suffix: string) => fn(name(suffix), pair, [bitmap, bitmap] as const, bitmap);
    const count = (suffix: string) => fn(name(suffix), pair, [bitmap, bitmap] as const, i8);
    const test = (suffix: string) => fn(name(suffix), pair, [bitmap, bitmap] as const, bool);
    const ranged = (suffix: string) => fn(name(suffix), range, [bitmap, i8, i8] as const, bitmap);
    const shift = (suffix: string) => fn(name(suffix), `${type},${I8}`, [bitmap, i8] as const, bitmap);
    return {
      add: Object.freeze({
        bitmapElement: fn(name("add"), `${type},${elementType}`, [bitmap, element] as const, bitmap),
        elementBitmap: fn(name("add"), `${elementType},${type}`, [element, bitmap] as const, bitmap),
      }),
      and: binary("and"),
      and_agg: aggregate(name("and_agg"), type, bitmap, bitmap),
      and_cardinality: count("and_cardinality"),
      and_cardinality_agg: aggregate(name("and_cardinality_agg"), type, bitmap, i8),
      andnot: binary("andnot"),
      andnot_cardinality: count("andnot_cardinality"),
      build: fn(name("build"), elementType.replace("pg_catalog.", "pg_catalog._"), [elements] as const, bitmap),
      build_agg: createSqlAggregate({
        ...base,
        name: name("build_agg"),
        member: `routine:$extension:roaringbitmap.${name("build_agg")}(${elementType})`,
        arguments: [element] as const,
        result: bitmap,
      }),
      cardinality: fn(name("cardinality"), type, [bitmap] as const, i8),
      clear: ranged("clear"),
      containedby: Object.freeze({
        bitmap: test("containedby"),
        element: fn(name("containedby"), `${elementType},${type}`, [element, bitmap] as const, bool),
      }),
      contains: Object.freeze({
        bitmap: test("contains"),
        element: fn(name("contains"), `${type},${elementType}`, [bitmap, element] as const, bool),
      }),
      equals: test("equals"),
      fill: ranged("fill"),
      flip: ranged("flip"),
      index: fn(name("index"), `${type},${elementType}`, [bitmap, element] as const, i8),
      intersect: test("intersect"),
      is_empty: fn(name("is_empty"), type, [bitmap] as const, bool),
      iterate: createSqlRows({
        ...base,
        name: name("iterate"),
        member: `routine:$extension:roaringbitmap.${name("iterate")}(${type})`,
        arguments: [bitmap] as const,
        result: element,
      }),
      jaccard_dist: fn(name("jaccard_dist"), pair, [bitmap, bitmap] as const, f8),
      max: fn(name("max"), type, [bitmap] as const, element),
      min: fn(name("min"), type, [bitmap] as const, element),
      not_equals: test("not_equals"),
      or: binary("or"),
      or_agg: aggregate(name("or_agg"), type, bitmap, bitmap),
      or_cardinality: count("or_cardinality"),
      or_cardinality_agg: aggregate(name("or_cardinality_agg"), type, bitmap, i8),
      range: ranged("range"),
      range_cardinality: fn(name("range_cardinality"), range, [bitmap, i8, i8] as const, i8),
      rank: fn(name("rank"), `${type},${elementType}`, [bitmap, element] as const, i8),
      remove: fn(name("remove"), `${type},${elementType}`, [bitmap, element] as const, bitmap),
      runoptimize: fn(name("runoptimize"), type, [bitmap] as const, bitmap),
      /** Arguments: bitmap, bitset_limit, then named defaults bitset_offset, reverse, range_start, range_end. */
      select: createSqlFunction({
        ...base,
        name: name("select"),
        member: `routine:$extension:roaringbitmap.${name("select")}(${type},${I8},${I8},pg_catalog.bool,${I8},${I8})`,
        arguments: [
          bitmap,
          i8,
          defaultSqlArgument(i8, "bitset_offset"),
          defaultSqlArgument(bool, "reverse"),
          defaultSqlArgument(i8, "range_start"),
          defaultSqlArgument(i8, "range_end"),
        ] as const,
        result: bitmap,
      }),
      shiftleft: shift("shiftleft"),
      shiftright: shift("shiftright"),
      to_array: fn(name("to_array"), type, [bitmap] as const, elements),
      xor: binary("xor"),
      xor_agg: aggregate(name("xor_agg"), type, bitmap, bitmap),
      xor_cardinality: count("xor_cardinality"),
      xor_cardinality_agg: aggregate(name("xor_cardinality_agg"), type, bitmap, i8),
    };
  }
  const bitmap32 = width("rb", T, rb, i4, I4, i4s);
  const bitmap64 = width("rb64", T64, rb64, i8, I8, i8s);
  const prefixed = <const Prefix extends string, Members extends object>(prefix: Prefix, members: Members) =>
    // SAFETY: every own key of members is renamed to exactly `${prefix}_${key}` with its value unchanged.
    Object.fromEntries(Object.entries(members).map(([key, value]) => [`${prefix}_${key}`, value])) as {
      readonly [Key in keyof Members & string as `${Prefix}_${Key}`]: Members[Key];
    };
  const functions = Object.freeze({
    ...prefixed("rb", bitmap32),
    ...prefixed("rb64", bitmap64),
    rb64_from_roaringbitmap: fn("rb64_from_roaringbitmap", T, [rb] as const, rb64),
    rb64_to_roaringbitmap: fn("rb64_to_roaringbitmap", T64, [rb64] as const, rb),
    roaringbitmap: fn("roaringbitmap", "pg_catalog.bytea", [bytea] as const, rb),
    roaringbitmap64: fn("roaringbitmap64", "pg_catalog.bytea", [bytea] as const, rb64),
    roaringbitmap_send: fn("roaringbitmap_send", T, [rb] as const, bytea),
    roaringbitmap64_send: fn("roaringbitmap64_send", T64, [rb64] as const, bytea),
  });
  const operator = <
    Left extends typeof rb | typeof rb64 | typeof i4 | typeof i8,
    Right extends typeof rb | typeof rb64 | typeof i4 | typeof i8,
    Result extends typeof rb | typeof rb64 | typeof bool,
  >(
    name: string,
    left: Left,
    leftType: string,
    right: Right,
    rightType: string,
    result: Result,
  ) =>
    createSqlOperator({
      ...base,
      name,
      member: `operator:$extension:roaringbitmap.${name}(${leftType},${rightType})`,
      left,
      right,
      result,
    });
  function operators<
    Bitmap extends typeof rb | typeof rb64,
    Element extends typeof i4 | typeof i8,
  >(type: string, bitmap: Bitmap, element: Element, elementType: string) {
    return {
      andnot: operator("-", bitmap, type, bitmap, type, bitmap),
      remove: operator("-", bitmap, type, element, elementType, bitmap),
      contains: operator("@>", bitmap, type, bitmap, type, bool),
      containsElement: operator("@>", bitmap, type, element, elementType, bool),
      and: operator("&", bitmap, type, bitmap, type, bitmap),
      intersect: operator("&&", bitmap, type, bitmap, type, bool),
      xor: operator("#", bitmap, type, bitmap, type, bitmap),
      containedBy: operator("<@", bitmap, type, bitmap, type, bool),
      elementContainedBy: operator("<@", element, elementType, bitmap, type, bool),
      shiftLeft: operator("<<", bitmap, type, i8, I8, bitmap),
      notEqual: operator("<>", bitmap, type, bitmap, type, bool),
      equal: operator("=", bitmap, type, bitmap, type, bool),
      shiftRight: operator(">>", bitmap, type, i8, I8, bitmap),
      or: operator("|", bitmap, type, bitmap, type, bitmap),
      add: operator("|", bitmap, type, element, elementType, bitmap),
      addReverse: operator("|", element, elementType, bitmap, type, bitmap),
    };
  }
  const operators32 = Object.freeze(operators(T, rb, i4, I4));
  const operators64 = Object.freeze(operators(T64, rb64, i8, I8));
  function cast<Source extends typeof rb | typeof rb64 | typeof bytea, Target extends typeof rb | typeof rb64 | typeof bytea>(
    source: Source,
    target: Target,
    member: string,
  ) {
    return (value: ExtensionSqlInput<Source>) => {
      const expression =
        is(value, SQL.Aliased) && !v.is(v.object({ isSelectionField: v.literal(true) }), value) ? value.sql : value;
      // SAFETY: wrapper expressions remain SQL; other typed inputs are encoded by their paired codec before binding.
      const native = v.is(sqlWrapper, expression)
        ? sql`${expression}`
        : sql`${sql.param(decodeFailure(() => source.encode(value as never)))}`;
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
    roaringbitmap_to_roaringbitmap64: cast(rb, rb64, `cast:${T}->${T64}`),
    roaringbitmap_to_bytea: cast(rb, bytea, `cast:${T}->pg_catalog.bytea`),
    roaringbitmap64_to_roaringbitmap: cast(rb64, rb, `cast:${T64}->${T}`),
    roaringbitmap64_to_bytea: cast(rb64, bytea, `cast:${T64}->pg_catalog.bytea`),
    bytea_to_roaringbitmap: cast(bytea, rb, `cast:pg_catalog.bytea->${T}`),
    bytea_to_roaringbitmap64: cast(bytea, rb64, `cast:pg_catalog.bytea->${T64}`),
  });
  const routine = (signature: string) => `routine:$extension:roaringbitmap.${signature}`;
  function widthOverloads(
    prefix: "rb" | "rb64",
    type: string,
    elementType: string,
    members: typeof bitmap32 | typeof bitmap64,
    ops: typeof operators32 | typeof operators64,
  ) {
    const pair = `${type},${type}`,
      range = `${type},${I8},${I8}`,
      withElement = `${type},${elementType}`;
    const op = (name: string, left: string, right: string) => `operator:$extension:roaringbitmap.${name}(${left},${right})`;
    return {
      [routine(`${prefix}_add(${withElement})`)]: members.add.bitmapElement,
      [routine(`${prefix}_add(${elementType},${type})`)]: members.add.elementBitmap,
      [routine(`${prefix}_and_agg(${type})`)]: members.and_agg,
      [routine(`${prefix}_and_cardinality_agg(${type})`)]: members.and_cardinality_agg,
      [routine(`${prefix}_and_cardinality(${pair})`)]: members.and_cardinality,
      [routine(`${prefix}_and(${pair})`)]: members.and,
      [routine(`${prefix}_andnot_cardinality(${pair})`)]: members.andnot_cardinality,
      [routine(`${prefix}_andnot(${pair})`)]: members.andnot,
      [routine(`${prefix}_build_agg(${elementType})`)]: members.build_agg,
      [routine(`${prefix}_build(${elementType.replace("pg_catalog.", "pg_catalog._")})`)]: members.build,
      [routine(`${prefix}_cardinality(${type})`)]: members.cardinality,
      [routine(`${prefix}_clear(${range})`)]: members.clear,
      [routine(`${prefix}_containedby(${pair})`)]: members.containedby.bitmap,
      [routine(`${prefix}_containedby(${elementType},${type})`)]: members.containedby.element,
      [routine(`${prefix}_contains(${pair})`)]: members.contains.bitmap,
      [routine(`${prefix}_contains(${withElement})`)]: members.contains.element,
      [routine(`${prefix}_equals(${pair})`)]: members.equals,
      [routine(`${prefix}_fill(${range})`)]: members.fill,
      [routine(`${prefix}_flip(${range})`)]: members.flip,
      [routine(`${prefix}_index(${withElement})`)]: members.index,
      [routine(`${prefix}_intersect(${pair})`)]: members.intersect,
      [routine(`${prefix}_is_empty(${type})`)]: members.is_empty,
      [routine(`${prefix}_iterate(${type})`)]: members.iterate,
      [routine(`${prefix}_jaccard_dist(${pair})`)]: members.jaccard_dist,
      [routine(`${prefix}_max(${type})`)]: members.max,
      [routine(`${prefix}_min(${type})`)]: members.min,
      [routine(`${prefix}_not_equals(${pair})`)]: members.not_equals,
      [routine(`${prefix}_or_agg(${type})`)]: members.or_agg,
      [routine(`${prefix}_or_cardinality_agg(${type})`)]: members.or_cardinality_agg,
      [routine(`${prefix}_or_cardinality(${pair})`)]: members.or_cardinality,
      [routine(`${prefix}_or(${pair})`)]: members.or,
      [routine(`${prefix}_range_cardinality(${range})`)]: members.range_cardinality,
      [routine(`${prefix}_range(${range})`)]: members.range,
      [routine(`${prefix}_rank(${withElement})`)]: members.rank,
      [routine(`${prefix}_remove(${withElement})`)]: members.remove,
      [routine(`${prefix}_runoptimize(${type})`)]: members.runoptimize,
      [routine(`${prefix}_select(${type},${I8},${I8},pg_catalog.bool,${I8},${I8})`)]: members.select,
      [routine(`${prefix}_shiftleft(${type},${I8})`)]: members.shiftleft,
      [routine(`${prefix}_shiftright(${type},${I8})`)]: members.shiftright,
      [routine(`${prefix}_to_array(${type})`)]: members.to_array,
      [routine(`${prefix}_xor_agg(${type})`)]: members.xor_agg,
      [routine(`${prefix}_xor_cardinality_agg(${type})`)]: members.xor_cardinality_agg,
      [routine(`${prefix}_xor_cardinality(${pair})`)]: members.xor_cardinality,
      [routine(`${prefix}_xor(${pair})`)]: members.xor,
      [op("-", type, type)]: ops.andnot,
      [op("-", type, elementType)]: ops.remove,
      [op("@>", type, type)]: ops.contains,
      [op("@>", type, elementType)]: ops.containsElement,
      [op("&", type, type)]: ops.and,
      [op("&&", type, type)]: ops.intersect,
      [op("#", type, type)]: ops.xor,
      [op("<@", type, type)]: ops.containedBy,
      [op("<@", elementType, type)]: ops.elementContainedBy,
      [op("<<", type, I8)]: ops.shiftLeft,
      [op("<>", type, type)]: ops.notEqual,
      [op("=", type, type)]: ops.equal,
      [op(">>", type, I8)]: ops.shiftRight,
      [op("|", type, type)]: ops.or,
      [op("|", type, elementType)]: ops.add,
      [op("|", elementType, type)]: ops.addReverse,
    };
  }
  /** Every captured SQL-callable public member, keyed by its exact manifest identity. */
  const overloads = Object.freeze({
    ...widthOverloads("rb", T, I4, bitmap32, operators32),
    ...widthOverloads("rb64", T64, I8, bitmap64, operators64),
    [routine(`rb64_from_roaringbitmap(${T})`)]: functions.rb64_from_roaringbitmap,
    [routine(`rb64_to_roaringbitmap(${T64})`)]: functions.rb64_to_roaringbitmap,
    [routine("roaringbitmap(pg_catalog.bytea)")]: functions.roaringbitmap,
    [routine("roaringbitmap64(pg_catalog.bytea)")]: functions.roaringbitmap64,
    [routine(`roaringbitmap_send(${T})`)]: functions.roaringbitmap_send,
    [routine(`roaringbitmap64_send(${T64})`)]: functions.roaringbitmap64_send,
    [`cast:${T}->${T64}`]: casts.roaringbitmap_to_roaringbitmap64,
    [`cast:${T}->pg_catalog.bytea`]: casts.roaringbitmap_to_bytea,
    [`cast:${T64}->${T}`]: casts.roaringbitmap64_to_roaringbitmap,
    [`cast:${T64}->pg_catalog.bytea`]: casts.roaringbitmap64_to_bytea,
    [`cast:pg_catalog.bytea->${T}`]: casts.bytea_to_roaringbitmap,
    [`cast:pg_catalog.bytea->${T64}`]: casts.bytea_to_roaringbitmap64,
  });
  const bitmapValue: ExtensionValueSchema = {
    kind: "array",
    items: { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 },
  };
  const bitmap64Value: ExtensionValueSchema = { kind: "array", items: { kind: "bigint" } };
  const arrayValue = (element: ExtensionValueSchema): ExtensionValueSchema => {
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
              length: { kind: "number", integer: true, minimum: 1, maximum: 2147483647 },
            },
          },
        },
        values: { kind: "union", variants: depths },
      },
    };
  };
  const equality = (operand: string) => ({
    eq: { member: `operator:$extension:roaringbitmap.=(${operand},${operand})`, schema, name: "=", operand: "field" as const },
    ne: {
      member: `operator:$extension:roaringbitmap.<>(${operand},${operand})`,
      schema,
      name: "<>",
      operand: "field" as const,
    },
  });
  const search = { filter: true, comparison: false, order: false, text: false } as const;
  const opaque = { filter: false, comparison: false, order: false, text: false } as const;
  const field = () =>
    createExtensionField({
      extension: descriptor,
      member: `type:${T}`,
      type: "roaringbitmap",
      codec,
      value: bitmapValue,
      search,
      operators: equality(T),
    });
  const field64 = () =>
    createExtensionField({
      extension: descriptor,
      member: `type:${T64}`,
      type: "roaringbitmap64",
      codec: codec64,
      value: bitmap64Value,
      search,
      operators: equality(T64),
    });
  const arrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:roaringbitmap._roaringbitmap",
      type: "roaringbitmap",
      array: true,
      codec: bitmapArray,
      value: arrayValue(bitmapValue),
      search: opaque,
    });
  const array64Field = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:roaringbitmap._roaringbitmap64",
      type: "roaringbitmap64",
      array: true,
      codec: bitmap64Array,
      value: arrayValue(bitmap64Value),
      search: opaque,
    });
  return bindExtension(descriptor, {
    // Direct helpers use the 32-bit native type; bitmap64 preserves the same named helpers for int8 members.
    ...bitmap32,
    bitmap64: Object.freeze(bitmap64),
    codec,
    codec64,
    arrayCodec: bitmapArray,
    array64Codec: bitmap64Array,
    field,
    field64,
    arrayField,
    array64Field,
    sql: Object.freeze({
      functions,
      operators: Object.freeze({ roaringbitmap: operators32, roaringbitmap64: operators64 }),
      casts,
      overloads,
    }),
  });
}
