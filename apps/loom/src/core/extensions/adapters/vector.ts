import * as v from "valibot";
import { sql, is, SQL, type AnyColumn, type SQLWrapper } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  booleanCodec,
  binaryCodec,
  floatCodec,
  numericCodec,
  arrayCodec,
  nullableCodec,
  type ExtensionCodec,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import {
  createSqlFunction,
  createSqlAggregate,
  createSqlOperator,
  extensionSqlType,
  type ExtensionSqlInput,
  type ExtensionSqlWindow,
} from "../sql";
import { createBitCodec } from "../bit-codec";
import { float4Codec } from "../primitive-number-codecs";
import { createVectorCodec, createHalfvecCodec, createSparsevecCodec } from "../vector-codecs";

type Descriptor = ExtensionDescriptor<"vector", { readonly version: "0.8.6"; readonly schema: string }>;
type NativeKind = "vector" | "halfvec" | "sparsevec";
type Input<Value> = Value | SQL<Value> | SQL.Aliased<Value> | AnyColumn<{ data: Value; notNull: true }>;
type NullableInput<Value> = ExtensionSqlInput<ExtensionCodec<Value | null, Value | null>>;
interface Unary<Value, Result> {
  (value: Input<Value>): SQL<Result>;
  (value: NullableInput<Value>): SQL<Result | null>;
}
interface Pair<Value, Result> {
  (left: Input<Value>, right: Input<Value>): SQL<Result>;
  (left: NullableInput<Value>, right: NullableInput<Value>): SQL<Result | null>;
}
interface Subvector<Value> {
  (value: Input<Value>, start: Input<number>, count: Input<number>): SQL<Value>;
  (value: NullableInput<Value>, start: NullableInput<number>, count: NullableInput<number>): SQL<Value | null>;
}
const digest = "4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4";
const sqlWrapper = v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value));

function operand<Value>(value: NullableInput<Value>, schema: string, name: string): NullableInput<Value> {
  let expression: SQL;
  if (is(value, SQL.Aliased))
    expression = "isSelectionField" in value && value.isSelectionField === true ? sql`${value}` : value.sql;
  else if (v.is(sqlWrapper, value)) expression = sql`${value}`;
  else return value;
  return sql<Value | null>`(${expression})::${extensionSqlType(schema, name)}`;
}

/** Captured SQL-callable routines and operators. Schema/index and family acceptance remain separate. */
export function createVector_0_8_6<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "vector" ||
    descriptor.version !== "0.8.6" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("vector 0.8.6 requires its exact verified contract");
  const vectorCodec = createVectorCodec(descriptor.schema);
  const halfCodec = createHalfvecCodec(descriptor.schema);
  const sparseCodec = createSparsevecCodec(descriptor.schema);
  const bitCodec = createBitCodec();
  const common = { schema: descriptor.schema, dependencies: [], authority: "query", observability: "tables" } as const;
  const type = (kind: NativeKind | "bit") => (kind === "bit" ? "pg_catalog.bit" : `$extension:vector.${kind}`);
  const namespace = (kind: NativeKind | "bit") => (kind === "bit" ? "pg_catalog" : descriptor.schema);
  function unary<Value, Result>(
    kind: NativeKind,
    name: string,
    codec: ExtensionCodec<Value, Value>,
    result: ExtensionCodec<Result, Result>,
  ): Unary<Value, Result> {
    const call = createSqlFunction({
      ...common,
      name,
      member: `routine:$extension:vector.${name}(${type(kind)})`,
      arguments: [nullableCodec(codec)] as const,
      result: nullableCodec(result),
    });
    // SAFETY: these captured strict scalar routines return non-NULL for non-NULL inputs; native errors still propagate.
    return ((value: NullableInput<Value>) => call(operand(value, descriptor.schema, kind))) as Unary<Value, Result>;
  }
  function pair<Value, Result>(
    kind: NativeKind | "bit",
    name: string,
    codec: ExtensionCodec<Value, Value>,
    result: ExtensionCodec<Result, Result>,
  ): Pair<Value, Result> {
    const call = createSqlFunction({
      ...common,
      name,
      member: `routine:$extension:vector.${name}(${type(kind)},${type(kind)})`,
      arguments: [nullableCodec(codec), nullableCodec(codec)] as const,
      result: nullableCodec(result),
    });
    // SAFETY: captured strict pair routines are non-NULL for non-NULL operands, including tagged nonfinite distances.
    return ((left: NullableInput<Value>, right: NullableInput<Value>) =>
      call(operand(left, namespace(kind), kind), operand(right, namespace(kind), kind))) as Pair<Value, Result>;
  }
  function operator<Value, Result>(
    kind: NativeKind | "bit",
    name: string,
    codec: ExtensionCodec<Value, Value>,
    result: ExtensionCodec<Result, Result>,
  ): Pair<Value, Result> {
    const call = createSqlOperator({
      ...common,
      name,
      member: `operator:$extension:vector.${name}(${type(kind)},${type(kind)})`,
      left: nullableCodec(codec),
      right: nullableCodec(codec),
      result: nullableCodec(result),
    });
    // SAFETY: each captured operator delegates to a strict scalar pair routine with the same non-NULL result contract.
    return ((left: NullableInput<Value>, right: NullableInput<Value>) =>
      call(operand(left, namespace(kind), kind), operand(right, namespace(kind), kind))) as Pair<Value, Result>;
  }
  function subvector<Value>(kind: "vector" | "halfvec", codec: ExtensionCodec<Value, Value>): Subvector<Value> {
    const call = createSqlFunction({
      ...common,
      name: "subvector",
      member: `routine:$extension:vector.subvector(${type(kind)},pg_catalog.int4,pg_catalog.int4)`,
      arguments: [nullableCodec(codec), nullableCodec(int4Codec), nullableCodec(int4Codec)] as const,
      result: nullableCodec(codec),
    });
    // SAFETY: captured subvector is strict, returning a vector of native clipped dimensions or raising a native error.
    return ((value: NullableInput<Value>, start: NullableInput<number>, count: NullableInput<number>) =>
      call(
        operand(value, descriptor.schema, kind),
        operand(start, "pg_catalog", "int4"),
        operand(count, "pg_catalog", "int4"),
      )) as Subvector<Value>;
  }
  function aggregate<Value>(kind: "vector" | "halfvec", name: "avg" | "sum", codec: ExtensionCodec<Value, Value>) {
    const call = createSqlAggregate({
      ...common,
      name,
      member: `routine:$extension:vector.${name}(${type(kind)})`,
      arguments: [nullableCodec(codec)] as const,
      result: nullableCodec(codec),
    });
    const argument = (value: NullableInput<Value>) => operand(value, descriptor.schema, kind);
    return Object.assign((value: NullableInput<Value>) => call(argument(value)), {
      distinct: (value: NullableInput<Value>) => call.distinct(argument(value)),
      filter: (condition: SQL<boolean>, value: NullableInput<Value>) => call.filter(condition, argument(value)),
      over: (window: ExtensionSqlWindow, value: NullableInput<Value>) => call.over(window, argument(value)),
    });
  }
  const vectorAggregates = Object.freeze({
    avg: aggregate("vector", "avg", vectorCodec),
    sum: aggregate("vector", "sum", vectorCodec),
  });
  const halfvecAggregates = Object.freeze({
    avg: aggregate("halfvec", "avg", halfCodec),
    sum: aggregate("halfvec", "sum", halfCodec),
  });
  const bitFunctions = Object.freeze({
    hamming_distance: pair("bit", "hamming_distance", bitCodec, floatCodec),
    jaccard_distance: pair("bit", "jaccard_distance", bitCodec, floatCodec),
  });
  const bitOperators = Object.freeze({
    "<~>": operator("bit", "<~>", bitCodec, floatCodec),
    "<%>": operator("bit", "<%>", bitCodec, floatCodec),
  });
  const bit = Object.freeze({
    hammingDistance: bitFunctions.hamming_distance,
    jaccardDistance: bitFunctions.jaccard_distance,
    sql: Object.freeze({ functions: bitFunctions, operators: bitOperators }),
  });
  const vectorFunctions = Object.freeze({
    l2_distance: pair("vector", "l2_distance", vectorCodec, floatCodec),
    l1_distance: pair("vector", "l1_distance", vectorCodec, floatCodec),
    cosine_distance: pair("vector", "cosine_distance", vectorCodec, floatCodec),
    inner_product: pair("vector", "inner_product", vectorCodec, floatCodec),
    vector_l2_squared_distance: pair("vector", "vector_l2_squared_distance", vectorCodec, floatCodec),
    vector_negative_inner_product: pair("vector", "vector_negative_inner_product", vectorCodec, floatCodec),
    vector_spherical_distance: pair("vector", "vector_spherical_distance", vectorCodec, floatCodec),
    vector_norm: unary("vector", "vector_norm", vectorCodec, floatCodec),
    l2_normalize: unary("vector", "l2_normalize", vectorCodec, vectorCodec),
    vector_cmp: pair("vector", "vector_cmp", vectorCodec, int4Codec),
    vector_eq: pair("vector", "vector_eq", vectorCodec, booleanCodec),
    vector_ne: pair("vector", "vector_ne", vectorCodec, booleanCodec),
    vector_lt: pair("vector", "vector_lt", vectorCodec, booleanCodec),
    vector_le: pair("vector", "vector_le", vectorCodec, booleanCodec),
    vector_gt: pair("vector", "vector_gt", vectorCodec, booleanCodec),
    vector_ge: pair("vector", "vector_ge", vectorCodec, booleanCodec),
    vector_add: pair("vector", "vector_add", vectorCodec, vectorCodec),
    vector_sub: pair("vector", "vector_sub", vectorCodec, vectorCodec),
    vector_mul: pair("vector", "vector_mul", vectorCodec, vectorCodec),
    vector_concat: pair("vector", "vector_concat", vectorCodec, vectorCodec),
    vector_dims: unary("vector", "vector_dims", vectorCodec, int4Codec),
    subvector: subvector("vector", vectorCodec),
    vector_send: unary("vector", "vector_send", vectorCodec, binaryCodec),
    binary_quantize: unary("vector", "binary_quantize", vectorCodec, bitCodec),
  });
  const vectorOperators = Object.freeze({
    "<->": operator("vector", "<->", vectorCodec, floatCodec),
    "<+>": operator("vector", "<+>", vectorCodec, floatCodec),
    "<=>": operator("vector", "<=>", vectorCodec, floatCodec),
    "<#>": operator("vector", "<#>", vectorCodec, floatCodec),
    "=": operator("vector", "=", vectorCodec, booleanCodec),
    "<>": operator("vector", "<>", vectorCodec, booleanCodec),
    "<": operator("vector", "<", vectorCodec, booleanCodec),
    "<=": operator("vector", "<=", vectorCodec, booleanCodec),
    ">": operator("vector", ">", vectorCodec, booleanCodec),
    ">=": operator("vector", ">=", vectorCodec, booleanCodec),
    "+": operator("vector", "+", vectorCodec, vectorCodec),
    "-": operator("vector", "-", vectorCodec, vectorCodec),
    "*": operator("vector", "*", vectorCodec, vectorCodec),
    "||": operator("vector", "||", vectorCodec, vectorCodec),
  });
  const vector = Object.freeze({
    average: vectorAggregates.avg,
    sum: vectorAggregates.sum,
    binaryQuantize: vectorFunctions.binary_quantize,
    l2Distance: vectorFunctions.l2_distance,
    l1Distance: vectorFunctions.l1_distance,
    cosineDistance: vectorFunctions.cosine_distance,
    innerProduct: vectorFunctions.inner_product,
    squaredDistance: vectorFunctions.vector_l2_squared_distance,
    negativeInnerProduct: vectorFunctions.vector_negative_inner_product,
    norm: vectorFunctions.vector_norm,
    normalize: vectorFunctions.l2_normalize,
    compare: vectorFunctions.vector_cmp,
    send: vectorFunctions.vector_send,
    sphericalDistance: vectorFunctions.vector_spherical_distance,
    add: vectorFunctions.vector_add,
    subtract: vectorFunctions.vector_sub,
    multiply: vectorFunctions.vector_mul,
    concat: vectorFunctions.vector_concat,
    dimensions: vectorFunctions.vector_dims,
    subvector: vectorFunctions.subvector,
    equals: vectorOperators["="],
    notEquals: vectorOperators["<>"],
    lessThan: vectorOperators["<"],
    lessOrEqual: vectorOperators["<="],
    greaterThan: vectorOperators[">"],
    greaterOrEqual: vectorOperators[">="],
    sql: Object.freeze({ functions: vectorFunctions, operators: vectorOperators, aggregates: vectorAggregates }),
  });
  const halfvecFunctions = Object.freeze({
    l2_distance: pair("halfvec", "l2_distance", halfCodec, floatCodec),
    l1_distance: pair("halfvec", "l1_distance", halfCodec, floatCodec),
    cosine_distance: pair("halfvec", "cosine_distance", halfCodec, floatCodec),
    inner_product: pair("halfvec", "inner_product", halfCodec, floatCodec),
    halfvec_l2_squared_distance: pair("halfvec", "halfvec_l2_squared_distance", halfCodec, floatCodec),
    halfvec_negative_inner_product: pair("halfvec", "halfvec_negative_inner_product", halfCodec, floatCodec),
    halfvec_spherical_distance: pair("halfvec", "halfvec_spherical_distance", halfCodec, floatCodec),
    l2_norm: unary("halfvec", "l2_norm", halfCodec, floatCodec),
    l2_normalize: unary("halfvec", "l2_normalize", halfCodec, halfCodec),
    halfvec_cmp: pair("halfvec", "halfvec_cmp", halfCodec, int4Codec),
    halfvec_eq: pair("halfvec", "halfvec_eq", halfCodec, booleanCodec),
    halfvec_ne: pair("halfvec", "halfvec_ne", halfCodec, booleanCodec),
    halfvec_lt: pair("halfvec", "halfvec_lt", halfCodec, booleanCodec),
    halfvec_le: pair("halfvec", "halfvec_le", halfCodec, booleanCodec),
    halfvec_gt: pair("halfvec", "halfvec_gt", halfCodec, booleanCodec),
    halfvec_ge: pair("halfvec", "halfvec_ge", halfCodec, booleanCodec),
    halfvec_add: pair("halfvec", "halfvec_add", halfCodec, halfCodec),
    halfvec_sub: pair("halfvec", "halfvec_sub", halfCodec, halfCodec),
    halfvec_mul: pair("halfvec", "halfvec_mul", halfCodec, halfCodec),
    halfvec_concat: pair("halfvec", "halfvec_concat", halfCodec, halfCodec),
    vector_dims: unary("halfvec", "vector_dims", halfCodec, int4Codec),
    subvector: subvector("halfvec", halfCodec),
    halfvec_send: unary("halfvec", "halfvec_send", halfCodec, binaryCodec),
    binary_quantize: unary("halfvec", "binary_quantize", halfCodec, bitCodec),
  });
  const halfvecOperators = Object.freeze({
    "<->": operator("halfvec", "<->", halfCodec, floatCodec),
    "<+>": operator("halfvec", "<+>", halfCodec, floatCodec),
    "<=>": operator("halfvec", "<=>", halfCodec, floatCodec),
    "<#>": operator("halfvec", "<#>", halfCodec, floatCodec),
    "=": operator("halfvec", "=", halfCodec, booleanCodec),
    "<>": operator("halfvec", "<>", halfCodec, booleanCodec),
    "<": operator("halfvec", "<", halfCodec, booleanCodec),
    "<=": operator("halfvec", "<=", halfCodec, booleanCodec),
    ">": operator("halfvec", ">", halfCodec, booleanCodec),
    ">=": operator("halfvec", ">=", halfCodec, booleanCodec),
    "+": operator("halfvec", "+", halfCodec, halfCodec),
    "-": operator("halfvec", "-", halfCodec, halfCodec),
    "*": operator("halfvec", "*", halfCodec, halfCodec),
    "||": operator("halfvec", "||", halfCodec, halfCodec),
  });
  const halfvec = Object.freeze({
    average: halfvecAggregates.avg,
    sum: halfvecAggregates.sum,
    binaryQuantize: halfvecFunctions.binary_quantize,
    l2Distance: halfvecFunctions.l2_distance,
    l1Distance: halfvecFunctions.l1_distance,
    cosineDistance: halfvecFunctions.cosine_distance,
    innerProduct: halfvecFunctions.inner_product,
    squaredDistance: halfvecFunctions.halfvec_l2_squared_distance,
    negativeInnerProduct: halfvecFunctions.halfvec_negative_inner_product,
    norm: halfvecFunctions.l2_norm,
    normalize: halfvecFunctions.l2_normalize,
    compare: halfvecFunctions.halfvec_cmp,
    send: halfvecFunctions.halfvec_send,
    sphericalDistance: halfvecFunctions.halfvec_spherical_distance,
    add: halfvecFunctions.halfvec_add,
    subtract: halfvecFunctions.halfvec_sub,
    multiply: halfvecFunctions.halfvec_mul,
    concat: halfvecFunctions.halfvec_concat,
    dimensions: halfvecFunctions.vector_dims,
    subvector: halfvecFunctions.subvector,
    equals: halfvecOperators["="],
    notEquals: halfvecOperators["<>"],
    lessThan: halfvecOperators["<"],
    lessOrEqual: halfvecOperators["<="],
    greaterThan: halfvecOperators[">"],
    greaterOrEqual: halfvecOperators[">="],
    sql: Object.freeze({ functions: halfvecFunctions, operators: halfvecOperators, aggregates: halfvecAggregates }),
  });
  const sparsevecFunctions = Object.freeze({
    l2_distance: pair("sparsevec", "l2_distance", sparseCodec, floatCodec),
    l1_distance: pair("sparsevec", "l1_distance", sparseCodec, floatCodec),
    cosine_distance: pair("sparsevec", "cosine_distance", sparseCodec, floatCodec),
    inner_product: pair("sparsevec", "inner_product", sparseCodec, floatCodec),
    sparsevec_l2_squared_distance: pair("sparsevec", "sparsevec_l2_squared_distance", sparseCodec, floatCodec),
    sparsevec_negative_inner_product: pair("sparsevec", "sparsevec_negative_inner_product", sparseCodec, floatCodec),
    l2_norm: unary("sparsevec", "l2_norm", sparseCodec, floatCodec),
    l2_normalize: unary("sparsevec", "l2_normalize", sparseCodec, sparseCodec),
    sparsevec_cmp: pair("sparsevec", "sparsevec_cmp", sparseCodec, int4Codec),
    sparsevec_eq: pair("sparsevec", "sparsevec_eq", sparseCodec, booleanCodec),
    sparsevec_ne: pair("sparsevec", "sparsevec_ne", sparseCodec, booleanCodec),
    sparsevec_lt: pair("sparsevec", "sparsevec_lt", sparseCodec, booleanCodec),
    sparsevec_le: pair("sparsevec", "sparsevec_le", sparseCodec, booleanCodec),
    sparsevec_gt: pair("sparsevec", "sparsevec_gt", sparseCodec, booleanCodec),
    sparsevec_ge: pair("sparsevec", "sparsevec_ge", sparseCodec, booleanCodec),
    sparsevec_send: unary("sparsevec", "sparsevec_send", sparseCodec, binaryCodec),
  });
  const sparsevecOperators = Object.freeze({
    "<->": operator("sparsevec", "<->", sparseCodec, floatCodec),
    "<+>": operator("sparsevec", "<+>", sparseCodec, floatCodec),
    "<=>": operator("sparsevec", "<=>", sparseCodec, floatCodec),
    "<#>": operator("sparsevec", "<#>", sparseCodec, floatCodec),
    "=": operator("sparsevec", "=", sparseCodec, booleanCodec),
    "<>": operator("sparsevec", "<>", sparseCodec, booleanCodec),
    "<": operator("sparsevec", "<", sparseCodec, booleanCodec),
    "<=": operator("sparsevec", "<=", sparseCodec, booleanCodec),
    ">": operator("sparsevec", ">", sparseCodec, booleanCodec),
    ">=": operator("sparsevec", ">=", sparseCodec, booleanCodec),
  });
  const sparsevec = Object.freeze({
    l2Distance: sparsevecFunctions.l2_distance,
    l1Distance: sparsevecFunctions.l1_distance,
    cosineDistance: sparsevecFunctions.cosine_distance,
    innerProduct: sparsevecFunctions.inner_product,
    squaredDistance: sparsevecFunctions.sparsevec_l2_squared_distance,
    negativeInnerProduct: sparsevecFunctions.sparsevec_negative_inner_product,
    norm: sparsevecFunctions.l2_norm,
    normalize: sparsevecFunctions.l2_normalize,
    compare: sparsevecFunctions.sparsevec_cmp,
    send: sparsevecFunctions.sparsevec_send,
    equals: sparsevecOperators["="],
    notEquals: sparsevecOperators["<>"],
    lessThan: sparsevecOperators["<"],
    lessOrEqual: sparsevecOperators["<="],
    greaterThan: sparsevecOperators[">"],
    greaterOrEqual: sparsevecOperators[">="],
    sql: Object.freeze({ functions: sparsevecFunctions, operators: sparsevecOperators }),
  });
  const float4Array = arrayCodec(float4Codec);
  const float8Array = arrayCodec(floatCodec);
  const int4Array = arrayCodec(int4Codec);
  const numericArray = arrayCodec(numericCodec);
  function captured<
    const Arguments extends readonly ExtensionCodec<never, unknown>[],
    Result extends ExtensionCodec<never, unknown>,
  >(name: string, member: string, arguments_: Arguments, result: Result) {
    const call = createSqlFunction({ ...common, name, member, arguments: arguments_, result });
    return (...values: Parameters<typeof call>): ReturnType<typeof call> => {
      const typed = values.map((value, index) => {
        const sqlType = arguments_[index]!.sqlType!;
        if (is(value, SQL.Aliased)) value = "isSelectionField" in value && value.isSelectionField ? value : value.sql;
        if (!v.is(sqlWrapper, value)) return value;
        return sql`(${value})::${extensionSqlType(sqlType.schema, sqlType.name)}${sqlType.array ? sql`[]` : sql.empty()}`;
      });
      // SAFETY: argument positions and tuple length are unchanged; wrappers retain the same paired codec output type.
      return call(...(typed as Parameters<typeof call>));
    };
  }
  const conversions = Object.freeze({
    "routine:$extension:vector.array_to_halfvec(pg_catalog._float4,pg_catalog.int4,pg_catalog.bool)": captured(
      "array_to_halfvec",
      "routine:$extension:vector.array_to_halfvec(pg_catalog._float4,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(float4Array), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(halfCodec),
    ),
    "routine:$extension:vector.array_to_halfvec(pg_catalog._float8,pg_catalog.int4,pg_catalog.bool)": captured(
      "array_to_halfvec",
      "routine:$extension:vector.array_to_halfvec(pg_catalog._float8,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(float8Array), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(halfCodec),
    ),
    "routine:$extension:vector.array_to_halfvec(pg_catalog._int4,pg_catalog.int4,pg_catalog.bool)": captured(
      "array_to_halfvec",
      "routine:$extension:vector.array_to_halfvec(pg_catalog._int4,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(int4Array), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(halfCodec),
    ),
    "routine:$extension:vector.array_to_halfvec(pg_catalog._numeric,pg_catalog.int4,pg_catalog.bool)": captured(
      "array_to_halfvec",
      "routine:$extension:vector.array_to_halfvec(pg_catalog._numeric,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(numericArray), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(halfCodec),
    ),
    "routine:$extension:vector.array_to_sparsevec(pg_catalog._float4,pg_catalog.int4,pg_catalog.bool)": captured(
      "array_to_sparsevec",
      "routine:$extension:vector.array_to_sparsevec(pg_catalog._float4,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(float4Array), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(sparseCodec),
    ),
    "routine:$extension:vector.array_to_sparsevec(pg_catalog._float8,pg_catalog.int4,pg_catalog.bool)": captured(
      "array_to_sparsevec",
      "routine:$extension:vector.array_to_sparsevec(pg_catalog._float8,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(float8Array), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(sparseCodec),
    ),
    "routine:$extension:vector.array_to_sparsevec(pg_catalog._int4,pg_catalog.int4,pg_catalog.bool)": captured(
      "array_to_sparsevec",
      "routine:$extension:vector.array_to_sparsevec(pg_catalog._int4,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(int4Array), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(sparseCodec),
    ),
    "routine:$extension:vector.array_to_sparsevec(pg_catalog._numeric,pg_catalog.int4,pg_catalog.bool)": captured(
      "array_to_sparsevec",
      "routine:$extension:vector.array_to_sparsevec(pg_catalog._numeric,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(numericArray), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(sparseCodec),
    ),
    "routine:$extension:vector.array_to_vector(pg_catalog._float4,pg_catalog.int4,pg_catalog.bool)": captured(
      "array_to_vector",
      "routine:$extension:vector.array_to_vector(pg_catalog._float4,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(float4Array), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(vectorCodec),
    ),
    "routine:$extension:vector.array_to_vector(pg_catalog._float8,pg_catalog.int4,pg_catalog.bool)": captured(
      "array_to_vector",
      "routine:$extension:vector.array_to_vector(pg_catalog._float8,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(float8Array), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(vectorCodec),
    ),
    "routine:$extension:vector.array_to_vector(pg_catalog._int4,pg_catalog.int4,pg_catalog.bool)": captured(
      "array_to_vector",
      "routine:$extension:vector.array_to_vector(pg_catalog._int4,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(int4Array), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(vectorCodec),
    ),
    "routine:$extension:vector.array_to_vector(pg_catalog._numeric,pg_catalog.int4,pg_catalog.bool)": captured(
      "array_to_vector",
      "routine:$extension:vector.array_to_vector(pg_catalog._numeric,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(numericArray), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(vectorCodec),
    ),
    "routine:$extension:vector.halfvec_accum(pg_catalog._float8,$extension:vector.halfvec)": captured(
      "halfvec_accum",
      "routine:$extension:vector.halfvec_accum(pg_catalog._float8,$extension:vector.halfvec)",
      [nullableCodec(float8Array), nullableCodec(halfCodec)] as const,
      nullableCodec(float8Array),
    ),
    "routine:$extension:vector.halfvec_avg(pg_catalog._float8)": captured(
      "halfvec_avg",
      "routine:$extension:vector.halfvec_avg(pg_catalog._float8)",
      [nullableCodec(float8Array)] as const,
      nullableCodec(halfCodec),
    ),
    "routine:$extension:vector.halfvec_combine(pg_catalog._float8,pg_catalog._float8)": captured(
      "halfvec_combine",
      "routine:$extension:vector.halfvec_combine(pg_catalog._float8,pg_catalog._float8)",
      [nullableCodec(float8Array), nullableCodec(float8Array)] as const,
      nullableCodec(float8Array),
    ),
    "routine:$extension:vector.halfvec_to_float4($extension:vector.halfvec,pg_catalog.int4,pg_catalog.bool)": captured(
      "halfvec_to_float4",
      "routine:$extension:vector.halfvec_to_float4($extension:vector.halfvec,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(halfCodec), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(float4Array),
    ),
    "routine:$extension:vector.halfvec_to_sparsevec($extension:vector.halfvec,pg_catalog.int4,pg_catalog.bool)":
      captured(
        "halfvec_to_sparsevec",
        "routine:$extension:vector.halfvec_to_sparsevec($extension:vector.halfvec,pg_catalog.int4,pg_catalog.bool)",
        [nullableCodec(halfCodec), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
        nullableCodec(sparseCodec),
      ),
    "routine:$extension:vector.halfvec_to_vector($extension:vector.halfvec,pg_catalog.int4,pg_catalog.bool)": captured(
      "halfvec_to_vector",
      "routine:$extension:vector.halfvec_to_vector($extension:vector.halfvec,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(halfCodec), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(vectorCodec),
    ),
    "routine:$extension:vector.halfvec($extension:vector.halfvec,pg_catalog.int4,pg_catalog.bool)": captured(
      "halfvec",
      "routine:$extension:vector.halfvec($extension:vector.halfvec,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(halfCodec), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(halfCodec),
    ),
    "routine:$extension:vector.sparsevec_to_halfvec($extension:vector.sparsevec,pg_catalog.int4,pg_catalog.bool)":
      captured(
        "sparsevec_to_halfvec",
        "routine:$extension:vector.sparsevec_to_halfvec($extension:vector.sparsevec,pg_catalog.int4,pg_catalog.bool)",
        [nullableCodec(sparseCodec), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
        nullableCodec(halfCodec),
      ),
    "routine:$extension:vector.sparsevec_to_vector($extension:vector.sparsevec,pg_catalog.int4,pg_catalog.bool)":
      captured(
        "sparsevec_to_vector",
        "routine:$extension:vector.sparsevec_to_vector($extension:vector.sparsevec,pg_catalog.int4,pg_catalog.bool)",
        [nullableCodec(sparseCodec), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
        nullableCodec(vectorCodec),
      ),
    "routine:$extension:vector.sparsevec($extension:vector.sparsevec,pg_catalog.int4,pg_catalog.bool)": captured(
      "sparsevec",
      "routine:$extension:vector.sparsevec($extension:vector.sparsevec,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(sparseCodec), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(sparseCodec),
    ),
    "routine:$extension:vector.vector_accum(pg_catalog._float8,$extension:vector.vector)": captured(
      "vector_accum",
      "routine:$extension:vector.vector_accum(pg_catalog._float8,$extension:vector.vector)",
      [nullableCodec(float8Array), nullableCodec(vectorCodec)] as const,
      nullableCodec(float8Array),
    ),
    "routine:$extension:vector.vector_avg(pg_catalog._float8)": captured(
      "vector_avg",
      "routine:$extension:vector.vector_avg(pg_catalog._float8)",
      [nullableCodec(float8Array)] as const,
      nullableCodec(vectorCodec),
    ),
    "routine:$extension:vector.vector_combine(pg_catalog._float8,pg_catalog._float8)": captured(
      "vector_combine",
      "routine:$extension:vector.vector_combine(pg_catalog._float8,pg_catalog._float8)",
      [nullableCodec(float8Array), nullableCodec(float8Array)] as const,
      nullableCodec(float8Array),
    ),
    "routine:$extension:vector.vector_to_float4($extension:vector.vector,pg_catalog.int4,pg_catalog.bool)": captured(
      "vector_to_float4",
      "routine:$extension:vector.vector_to_float4($extension:vector.vector,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(vectorCodec), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(float4Array),
    ),
    "routine:$extension:vector.vector_to_halfvec($extension:vector.vector,pg_catalog.int4,pg_catalog.bool)": captured(
      "vector_to_halfvec",
      "routine:$extension:vector.vector_to_halfvec($extension:vector.vector,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(vectorCodec), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(halfCodec),
    ),
    "routine:$extension:vector.vector_to_sparsevec($extension:vector.vector,pg_catalog.int4,pg_catalog.bool)": captured(
      "vector_to_sparsevec",
      "routine:$extension:vector.vector_to_sparsevec($extension:vector.vector,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(vectorCodec), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(sparseCodec),
    ),
    "routine:$extension:vector.vector($extension:vector.vector,pg_catalog.int4,pg_catalog.bool)": captured(
      "vector",
      "routine:$extension:vector.vector($extension:vector.vector,pg_catalog.int4,pg_catalog.bool)",
      [nullableCodec(vectorCodec), nullableCodec(int4Codec), nullableCodec(booleanCodec)] as const,
      nullableCodec(vectorCodec),
    ),
  });
  const overloads = Object.freeze({
    ...conversions,
    "routine:$extension:vector.avg($extension:vector.vector)": vectorAggregates.avg,
    "routine:$extension:vector.sum($extension:vector.vector)": vectorAggregates.sum,
    "routine:$extension:vector.avg($extension:vector.halfvec)": halfvecAggregates.avg,
    "routine:$extension:vector.sum($extension:vector.halfvec)": halfvecAggregates.sum,
    "routine:$extension:vector.binary_quantize($extension:vector.vector)": vectorFunctions.binary_quantize,
    "routine:$extension:vector.binary_quantize($extension:vector.halfvec)": halfvecFunctions.binary_quantize,
    "routine:$extension:vector.hamming_distance(pg_catalog.bit,pg_catalog.bit)": bitFunctions.hamming_distance,
    "routine:$extension:vector.jaccard_distance(pg_catalog.bit,pg_catalog.bit)": bitFunctions.jaccard_distance,
    "operator:$extension:vector.<~>(pg_catalog.bit,pg_catalog.bit)": bitOperators["<~>"],
    "operator:$extension:vector.<%>(pg_catalog.bit,pg_catalog.bit)": bitOperators["<%>"],
    "routine:$extension:vector.l2_distance($extension:vector.vector,$extension:vector.vector)":
      vectorFunctions.l2_distance,
    "routine:$extension:vector.l1_distance($extension:vector.vector,$extension:vector.vector)":
      vectorFunctions.l1_distance,
    "routine:$extension:vector.cosine_distance($extension:vector.vector,$extension:vector.vector)":
      vectorFunctions.cosine_distance,
    "routine:$extension:vector.inner_product($extension:vector.vector,$extension:vector.vector)":
      vectorFunctions.inner_product,
    "routine:$extension:vector.vector_l2_squared_distance($extension:vector.vector,$extension:vector.vector)":
      vectorFunctions.vector_l2_squared_distance,
    "routine:$extension:vector.vector_negative_inner_product($extension:vector.vector,$extension:vector.vector)":
      vectorFunctions.vector_negative_inner_product,
    "routine:$extension:vector.vector_spherical_distance($extension:vector.vector,$extension:vector.vector)":
      vectorFunctions.vector_spherical_distance,
    "routine:$extension:vector.vector_norm($extension:vector.vector)": vectorFunctions.vector_norm,
    "routine:$extension:vector.l2_normalize($extension:vector.vector)": vectorFunctions.l2_normalize,
    "routine:$extension:vector.vector_cmp($extension:vector.vector,$extension:vector.vector)":
      vectorFunctions.vector_cmp,
    "routine:$extension:vector.vector_eq($extension:vector.vector,$extension:vector.vector)": vectorFunctions.vector_eq,
    "routine:$extension:vector.vector_ne($extension:vector.vector,$extension:vector.vector)": vectorFunctions.vector_ne,
    "routine:$extension:vector.vector_lt($extension:vector.vector,$extension:vector.vector)": vectorFunctions.vector_lt,
    "routine:$extension:vector.vector_le($extension:vector.vector,$extension:vector.vector)": vectorFunctions.vector_le,
    "routine:$extension:vector.vector_gt($extension:vector.vector,$extension:vector.vector)": vectorFunctions.vector_gt,
    "routine:$extension:vector.vector_ge($extension:vector.vector,$extension:vector.vector)": vectorFunctions.vector_ge,
    "routine:$extension:vector.vector_add($extension:vector.vector,$extension:vector.vector)":
      vectorFunctions.vector_add,
    "routine:$extension:vector.vector_sub($extension:vector.vector,$extension:vector.vector)":
      vectorFunctions.vector_sub,
    "routine:$extension:vector.vector_mul($extension:vector.vector,$extension:vector.vector)":
      vectorFunctions.vector_mul,
    "routine:$extension:vector.vector_concat($extension:vector.vector,$extension:vector.vector)":
      vectorFunctions.vector_concat,
    "routine:$extension:vector.vector_dims($extension:vector.vector)": vectorFunctions.vector_dims,
    "routine:$extension:vector.subvector($extension:vector.vector,pg_catalog.int4,pg_catalog.int4)":
      vectorFunctions.subvector,
    "routine:$extension:vector.vector_send($extension:vector.vector)": vectorFunctions.vector_send,
    "operator:$extension:vector.<->($extension:vector.vector,$extension:vector.vector)": vectorOperators["<->"],
    "operator:$extension:vector.<+>($extension:vector.vector,$extension:vector.vector)": vectorOperators["<+>"],
    "operator:$extension:vector.<=>($extension:vector.vector,$extension:vector.vector)": vectorOperators["<=>"],
    "operator:$extension:vector.<#>($extension:vector.vector,$extension:vector.vector)": vectorOperators["<#>"],
    "operator:$extension:vector.=($extension:vector.vector,$extension:vector.vector)": vectorOperators["="],
    "operator:$extension:vector.<>($extension:vector.vector,$extension:vector.vector)": vectorOperators["<>"],
    "operator:$extension:vector.<($extension:vector.vector,$extension:vector.vector)": vectorOperators["<"],
    "operator:$extension:vector.<=($extension:vector.vector,$extension:vector.vector)": vectorOperators["<="],
    "operator:$extension:vector.>($extension:vector.vector,$extension:vector.vector)": vectorOperators[">"],
    "operator:$extension:vector.>=($extension:vector.vector,$extension:vector.vector)": vectorOperators[">="],
    "operator:$extension:vector.+($extension:vector.vector,$extension:vector.vector)": vectorOperators["+"],
    "operator:$extension:vector.-($extension:vector.vector,$extension:vector.vector)": vectorOperators["-"],
    "operator:$extension:vector.*($extension:vector.vector,$extension:vector.vector)": vectorOperators["*"],
    "operator:$extension:vector.||($extension:vector.vector,$extension:vector.vector)": vectorOperators["||"],
    "routine:$extension:vector.l2_distance($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.l2_distance,
    "routine:$extension:vector.l1_distance($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.l1_distance,
    "routine:$extension:vector.cosine_distance($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.cosine_distance,
    "routine:$extension:vector.inner_product($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.inner_product,
    "routine:$extension:vector.halfvec_l2_squared_distance($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.halfvec_l2_squared_distance,
    "routine:$extension:vector.halfvec_negative_inner_product($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.halfvec_negative_inner_product,
    "routine:$extension:vector.halfvec_spherical_distance($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.halfvec_spherical_distance,
    "routine:$extension:vector.l2_norm($extension:vector.halfvec)": halfvecFunctions.l2_norm,
    "routine:$extension:vector.l2_normalize($extension:vector.halfvec)": halfvecFunctions.l2_normalize,
    "routine:$extension:vector.halfvec_cmp($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.halfvec_cmp,
    "routine:$extension:vector.halfvec_eq($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.halfvec_eq,
    "routine:$extension:vector.halfvec_ne($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.halfvec_ne,
    "routine:$extension:vector.halfvec_lt($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.halfvec_lt,
    "routine:$extension:vector.halfvec_le($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.halfvec_le,
    "routine:$extension:vector.halfvec_gt($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.halfvec_gt,
    "routine:$extension:vector.halfvec_ge($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.halfvec_ge,
    "routine:$extension:vector.halfvec_add($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.halfvec_add,
    "routine:$extension:vector.halfvec_sub($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.halfvec_sub,
    "routine:$extension:vector.halfvec_mul($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.halfvec_mul,
    "routine:$extension:vector.halfvec_concat($extension:vector.halfvec,$extension:vector.halfvec)":
      halfvecFunctions.halfvec_concat,
    "routine:$extension:vector.vector_dims($extension:vector.halfvec)": halfvecFunctions.vector_dims,
    "routine:$extension:vector.subvector($extension:vector.halfvec,pg_catalog.int4,pg_catalog.int4)":
      halfvecFunctions.subvector,
    "routine:$extension:vector.halfvec_send($extension:vector.halfvec)": halfvecFunctions.halfvec_send,
    "operator:$extension:vector.<->($extension:vector.halfvec,$extension:vector.halfvec)": halfvecOperators["<->"],
    "operator:$extension:vector.<+>($extension:vector.halfvec,$extension:vector.halfvec)": halfvecOperators["<+>"],
    "operator:$extension:vector.<=>($extension:vector.halfvec,$extension:vector.halfvec)": halfvecOperators["<=>"],
    "operator:$extension:vector.<#>($extension:vector.halfvec,$extension:vector.halfvec)": halfvecOperators["<#>"],
    "operator:$extension:vector.=($extension:vector.halfvec,$extension:vector.halfvec)": halfvecOperators["="],
    "operator:$extension:vector.<>($extension:vector.halfvec,$extension:vector.halfvec)": halfvecOperators["<>"],
    "operator:$extension:vector.<($extension:vector.halfvec,$extension:vector.halfvec)": halfvecOperators["<"],
    "operator:$extension:vector.<=($extension:vector.halfvec,$extension:vector.halfvec)": halfvecOperators["<="],
    "operator:$extension:vector.>($extension:vector.halfvec,$extension:vector.halfvec)": halfvecOperators[">"],
    "operator:$extension:vector.>=($extension:vector.halfvec,$extension:vector.halfvec)": halfvecOperators[">="],
    "operator:$extension:vector.+($extension:vector.halfvec,$extension:vector.halfvec)": halfvecOperators["+"],
    "operator:$extension:vector.-($extension:vector.halfvec,$extension:vector.halfvec)": halfvecOperators["-"],
    "operator:$extension:vector.*($extension:vector.halfvec,$extension:vector.halfvec)": halfvecOperators["*"],
    "operator:$extension:vector.||($extension:vector.halfvec,$extension:vector.halfvec)": halfvecOperators["||"],
    "routine:$extension:vector.l2_distance($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecFunctions.l2_distance,
    "routine:$extension:vector.l1_distance($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecFunctions.l1_distance,
    "routine:$extension:vector.cosine_distance($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecFunctions.cosine_distance,
    "routine:$extension:vector.inner_product($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecFunctions.inner_product,
    "routine:$extension:vector.sparsevec_l2_squared_distance($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecFunctions.sparsevec_l2_squared_distance,
    "routine:$extension:vector.sparsevec_negative_inner_product($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecFunctions.sparsevec_negative_inner_product,
    "routine:$extension:vector.l2_norm($extension:vector.sparsevec)": sparsevecFunctions.l2_norm,
    "routine:$extension:vector.l2_normalize($extension:vector.sparsevec)": sparsevecFunctions.l2_normalize,
    "routine:$extension:vector.sparsevec_cmp($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecFunctions.sparsevec_cmp,
    "routine:$extension:vector.sparsevec_eq($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecFunctions.sparsevec_eq,
    "routine:$extension:vector.sparsevec_ne($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecFunctions.sparsevec_ne,
    "routine:$extension:vector.sparsevec_lt($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecFunctions.sparsevec_lt,
    "routine:$extension:vector.sparsevec_le($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecFunctions.sparsevec_le,
    "routine:$extension:vector.sparsevec_gt($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecFunctions.sparsevec_gt,
    "routine:$extension:vector.sparsevec_ge($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecFunctions.sparsevec_ge,
    "routine:$extension:vector.sparsevec_send($extension:vector.sparsevec)": sparsevecFunctions.sparsevec_send,
    "operator:$extension:vector.<->($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecOperators["<->"],
    "operator:$extension:vector.<+>($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecOperators["<+>"],
    "operator:$extension:vector.<=>($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecOperators["<=>"],
    "operator:$extension:vector.<#>($extension:vector.sparsevec,$extension:vector.sparsevec)":
      sparsevecOperators["<#>"],
    "operator:$extension:vector.=($extension:vector.sparsevec,$extension:vector.sparsevec)": sparsevecOperators["="],
    "operator:$extension:vector.<>($extension:vector.sparsevec,$extension:vector.sparsevec)": sparsevecOperators["<>"],
    "operator:$extension:vector.<($extension:vector.sparsevec,$extension:vector.sparsevec)": sparsevecOperators["<"],
    "operator:$extension:vector.<=($extension:vector.sparsevec,$extension:vector.sparsevec)": sparsevecOperators["<="],
    "operator:$extension:vector.>($extension:vector.sparsevec,$extension:vector.sparsevec)": sparsevecOperators[">"],
    "operator:$extension:vector.>=($extension:vector.sparsevec,$extension:vector.sparsevec)": sparsevecOperators[">="],
  });
  return bindExtension(descriptor, { vector, halfvec, sparsevec, bit, sql: Object.freeze({ overloads }) });
}
