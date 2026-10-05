import * as v from "valibot";
import { is, SQL, sql, type SQLWrapper } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  booleanCodec,
  binaryCodec,
  compositeCodec,
  createExtensionCodec,
  decodeFailure,
  floatCodec,
  integerCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { int2Codec } from "../primitive-number-codecs";
import { createExtensionField, type ExtensionValueSchema } from "../fields";
import {
  checkedExtensionExpression,
  createSqlAggregate,
  createSqlFunction,
  createSqlOperator,
  defaultSqlArgument,
  extensionSqlType,
  type ExtensionSqlInput,
  type ExtensionSqlWindow,
} from "../sql";
import {
  createHllArrayCodec,
  createHllCodec,
  createHllHashvalArrayCodec,
  createHllHashvalCodec,
  hllSketch,
} from "./hll-codecs";

export { hllSketch } from "./hll-codecs";
export type { HllHashval, HllSketch, PostgreSqlArray } from "./hll-codecs";
export type { NonfiniteNumber } from "../codecs";

const digest = "44f6623b1b7a463ea7cb26fcd02b434cb33c36a4bd9edfe0397e2536f66f6b19";
type Descriptor = ExtensionDescriptor<"hll", { readonly version: "2.21"; readonly schema: string }>;
const int4 = v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647));
const modifierValidator = v.strictObject({
  log2m: int4,
  regwidth: int4,
  expthresh: v.pipe(v.number(), v.safeInteger()),
  sparseon: int4,
});
/** hll(log2m, regwidth, expthresh, sparseon); hll_typmod_in owns range validation. */
export type HllModifier = v.InferInput<typeof modifierValidator>;
const sqlWrapper = v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value));
// hll_hash_any is polymorphic; only native SQL expressions carry an element type PostgreSQL can resolve.
const anyElementCodec = createExtensionCodec({
  id: "pg:anyelement:sql-only:1",
  input: v.never(),
  output: v.unknown(),
  transport: "native",
  encode: (value) => value,
  decode: (value) => value,
});

/** hll and hll_hashval have no equality opclass, so PostgreSQL rejects DISTINCT for every hll aggregate. */
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

/** Exact hll 2.21 queries. Native routines own hashing, sketch storage, estimation and modifier checks. */
export function createHll_2_21<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "hll" ||
    descriptor.version !== "2.21" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("hll 2.21 requires its exact verified contract");
  const schema = descriptor.schema;
  const codec = createHllCodec(schema),
    hashvalCodec = createHllHashvalCodec(schema),
    fullArray = createHllArrayCodec(schema),
    hashvalArray = createHllHashvalArrayCodec(schema);
  const h = nullableCodec(codec),
    hv = nullableCodec(hashvalCodec),
    bool = nullableCodec(booleanCodec),
    i2 = nullableCodec(int2Codec),
    i4 = nullableCodec(int4Codec),
    i8 = nullableCodec(integerCodec),
    f8 = nullableCodec(floatCodec),
    text = nullableCodec(textCodec),
    bytea = nullableCodec(binaryCodec),
    cstring = nullableCodec(withCodecSqlType(textCodec, { schema: "pg_catalog", name: "cstring" })),
    cstrings = nullableCodec(
      createExtensionCodec({
        id: "pg:cstring:array:1",
        sqlType: { schema: "pg_catalog", name: "cstring", array: true },
        input: v.array(v.string()),
        output: v.array(v.string()),
        transport: "text",
        encode: (value) =>
          `{${value.map((item) => `"${item.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`).join(",")}}`,
        decode: () => {
          throw new Error("cstring[] is an input-only hll modifier");
        },
      }),
    );
  const seed = defaultSqlArgument(i4);
  const expthresh = nullableCodec(
    compositeCodec("hll:expthresh:1", {
      specified: integerCodec,
      effective: integerCodec,
    }),
  );
  const base = {
    schema,
    dependencies: [],
    observability: "tables",
    authority: "query",
  } as const;
  const hllType = `$extension:hll.hll`,
    hashvalType = `$extension:hll.hll_hashval`;
  const binary = <
    Left extends typeof h | typeof hv,
    Right extends typeof h | typeof hv,
    Result extends typeof h | typeof bool,
  >(
    name: string,
    left: Left,
    right: Right,
    result: Result,
    member: string,
  ) => createSqlOperator({ ...base, name, member, left, right, result });
  const operators = Object.freeze({
    cardinality: createSqlOperator({
      ...base,
      name: "#",
      member: `operator:$extension:hll.#(,${hllType})`,
      left: undefined,
      right: h,
      result: f8,
    }),
    hashvalNotEqual: binary("<>", hv, hv, bool, `operator:$extension:hll.<>(${hashvalType},${hashvalType})`),
    notEqual: binary("<>", h, h, bool, `operator:$extension:hll.<>(${hllType},${hllType})`),
    hashvalEqual: binary("=", hv, hv, bool, `operator:$extension:hll.=(${hashvalType},${hashvalType})`),
    equal: binary("=", h, h, bool, `operator:$extension:hll.=(${hllType},${hllType})`),
    addReverse: binary("||", hv, h, h, `operator:$extension:hll.||(${hashvalType},${hllType})`),
    add: binary("||", h, hv, h, `operator:$extension:hll.||(${hllType},${hashvalType})`),
    union: binary("||", h, h, h, `operator:$extension:hll.||(${hllType},${hllType})`),
  });
  const addAgg = <const Modifiers extends readonly (typeof i4 | typeof i8)[]>(
    signature: string,
    modifiers: Modifiers,
  ) =>
    withoutDistinct(
      createSqlAggregate({
        ...base,
        name: "hll_add_agg",
        member: `routine:$extension:hll.hll_add_agg(${hashvalType}${signature})`,
        arguments: [hv, ...modifiers] as const,
        result: h,
      }),
    );
  const empty = <const Modifiers extends readonly (typeof i4 | typeof i8)[]>(signature: string, modifiers: Modifiers) =>
    createSqlFunction({
      ...base,
      name: "hll_empty",
      member: `routine:$extension:hll.hll_empty(${signature})`,
      arguments: modifiers,
      result: h,
    });
  const hash = <Argument extends typeof i4 | typeof i8 | typeof bool | typeof bytea | typeof text>(
    name: string,
    argument: Argument,
    type: string,
  ) =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:hll.${name}(pg_catalog.${type},pg_catalog.int4)`,
      arguments: [argument, seed] as const,
      result: hv,
    });
  const property = (name: string) =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:hll.${name}(${hllType})`,
      arguments: [h] as const,
      result: i4,
    });
  const functions = Object.freeze({
    hll: createSqlFunction({
      ...base,
      name: "hll",
      member: `routine:$extension:hll.hll(${hllType},pg_catalog.int4,pg_catalog.bool)`,
      arguments: [h, i4, bool] as const,
      result: h,
    }),
    hll_add: createSqlFunction({
      ...base,
      name: "hll_add",
      member: `routine:$extension:hll.hll_add(${hllType},${hashvalType})`,
      arguments: [h, hv] as const,
      result: h,
    }),
    hll_add_agg: Object.freeze({
      hashval: addAgg("", []),
      log2m: addAgg(",pg_catalog.int4", [i4]),
      regwidth: addAgg(",pg_catalog.int4,pg_catalog.int4", [i4, i4]),
      expthresh: addAgg(",pg_catalog.int4,pg_catalog.int4,pg_catalog.int8", [i4, i4, i8]),
      sparseon: addAgg(",pg_catalog.int4,pg_catalog.int4,pg_catalog.int8,pg_catalog.int4", [i4, i4, i8, i4]),
    }),
    hll_add_rev: createSqlFunction({
      ...base,
      name: "hll_add_rev",
      member: `routine:$extension:hll.hll_add_rev(${hashvalType},${hllType})`,
      arguments: [hv, h] as const,
      result: h,
    }),
    hll_cardinality: createSqlFunction({
      ...base,
      name: "hll_cardinality",
      member: `routine:$extension:hll.hll_cardinality(${hllType})`,
      arguments: [h] as const,
      result: f8,
    }),
    hll_empty: Object.freeze({
      defaults: empty("", []),
      log2m: empty("pg_catalog.int4", [i4]),
      regwidth: empty("pg_catalog.int4,pg_catalog.int4", [i4, i4]),
      expthresh: empty("pg_catalog.int4,pg_catalog.int4,pg_catalog.int8", [i4, i4, i8]),
      sparseon: empty("pg_catalog.int4,pg_catalog.int4,pg_catalog.int8,pg_catalog.int4", [i4, i4, i8, i4]),
    }),
    hll_eq: createSqlFunction({
      ...base,
      name: "hll_eq",
      member: `routine:$extension:hll.hll_eq(${hllType},${hllType})`,
      arguments: [h, h] as const,
      result: bool,
    }),
    hll_expthresh: createSqlFunction({
      ...base,
      name: "hll_expthresh",
      member: `routine:$extension:hll.hll_expthresh(${hllType})`,
      arguments: [h] as const,
      result: expthresh,
    }),
    hll_hash_any: createSqlFunction({
      ...base,
      name: "hll_hash_any",
      member: "routine:$extension:hll.hll_hash_any(pg_catalog.anyelement,pg_catalog.int4)",
      arguments: [anyElementCodec, seed] as const,
      result: hv,
    }),
    hll_hash_bigint: hash("hll_hash_bigint", i8, "int8"),
    hll_hash_boolean: hash("hll_hash_boolean", bool, "bool"),
    hll_hash_bytea: hash("hll_hash_bytea", bytea, "bytea"),
    hll_hash_integer: hash("hll_hash_integer", i4, "int4"),
    hll_hash_smallint: hash("hll_hash_smallint", i2, "int2"),
    hll_hash_text: hash("hll_hash_text", text, "text"),
    hll_hashval: createSqlFunction({
      ...base,
      name: "hll_hashval",
      member: "routine:$extension:hll.hll_hashval(pg_catalog.int8)",
      arguments: [i8] as const,
      result: hv,
    }),
    hll_hashval_eq: createSqlFunction({
      ...base,
      name: "hll_hashval_eq",
      member: `routine:$extension:hll.hll_hashval_eq(${hashvalType},${hashvalType})`,
      arguments: [hv, hv] as const,
      result: bool,
    }),
    hll_hashval_int4: createSqlFunction({
      ...base,
      name: "hll_hashval_int4",
      member: "routine:$extension:hll.hll_hashval_int4(pg_catalog.int4)",
      arguments: [i4] as const,
      result: hv,
    }),
    hll_hashval_ne: createSqlFunction({
      ...base,
      name: "hll_hashval_ne",
      member: `routine:$extension:hll.hll_hashval_ne(${hashvalType},${hashvalType})`,
      arguments: [hv, hv] as const,
      result: bool,
    }),
    hll_log2m: property("hll_log2m"),
    hll_ne: createSqlFunction({
      ...base,
      name: "hll_ne",
      member: `routine:$extension:hll.hll_ne(${hllType},${hllType})`,
      arguments: [h, h] as const,
      result: bool,
    }),
    hll_print: createSqlFunction({
      ...base,
      name: "hll_print",
      member: `routine:$extension:hll.hll_print(${hllType})`,
      arguments: [h] as const,
      result: cstring,
    }),
    hll_regwidth: property("hll_regwidth"),
    hll_schema_version: property("hll_schema_version"),
    hll_send: createSqlFunction({
      ...base,
      name: "hll_send",
      member: `routine:$extension:hll.hll_send(${hllType})`,
      arguments: [h] as const,
      result: bytea,
    }),
    hll_sparseon: property("hll_sparseon"),
    hll_type: property("hll_type"),
    hll_typmod_in: createSqlFunction({
      ...base,
      name: "hll_typmod_in",
      member: "routine:$extension:hll.hll_typmod_in(pg_catalog._cstring)",
      arguments: [cstrings] as const,
      result: i4,
    }),
    hll_union: createSqlFunction({
      ...base,
      name: "hll_union",
      member: `routine:$extension:hll.hll_union(${hllType},${hllType})`,
      arguments: [h, h] as const,
      result: h,
    }),
    hll_union_agg: withoutDistinct(
      createSqlAggregate({
        ...base,
        name: "hll_union_agg",
        member: `routine:$extension:hll.hll_union_agg(${hllType})`,
        arguments: [h] as const,
        result: h,
      }),
    ),
  });
  function cast<Source extends typeof h | typeof hv | typeof bytea | typeof i4, Target extends typeof h | typeof hv>(
    source: Source,
    target: Target,
    member: string,
    modifier?: (value: HllModifier) => SQL,
  ) {
    return (
      value: ExtensionSqlInput<Source>,
      ...selected: Target extends typeof h ? [modifier: HllModifier] | [] : []
    ) => {
      const expression =
        is(value, SQL.Aliased) && !v.is(v.object({ isSelectionField: v.literal(true) }), value) ? value.sql : value;
      // SAFETY: wrapper expressions remain SQL; other typed inputs are encoded by their paired codec before binding.
      const native = v.is(sqlWrapper, expression)
        ? sql`${expression}`
        : sql`${sql.param(decodeFailure(() => source.encode(value as never)))}`;
      const sourceType = source.sqlType!,
        targetType = target.sqlType!;
      const typmod = selected[0] && modifier ? modifier(selected[0]) : sql.empty();
      return checkedExtensionExpression(
        sql`((${native})::${extensionSqlType(sourceType.schema, sourceType.name)})::${extensionSqlType(targetType.schema, targetType.name)}${typmod}`,
        target,
        [],
        undefined,
        member,
      );
    };
  }
  const typmod = (value: HllModifier) => {
    const { log2m, regwidth, expthresh: threshold, sparseon } = v.parse(modifierValidator, value);
    return sql.raw(`(${log2m},${regwidth},${threshold},${sparseon})`);
  };
  const casts = Object.freeze({
    hll_to_hll: cast(h, h, `cast:${hllType}->${hllType}`, typmod),
    bytea_to_hll: cast(bytea, h, `cast:pg_catalog.bytea->${hllType}`),
    int4_to_hll_hashval: cast(i4, hv, `cast:pg_catalog.int4->${hashvalType}`),
    int8_to_hll_hashval: cast(i8, hv, `cast:pg_catalog.int8->${hashvalType}`),
  });
  const overloads = Object.freeze({
    "operator:$extension:hll.#(,$extension:hll.hll)": operators.cardinality,
    "operator:$extension:hll.<>($extension:hll.hll_hashval,$extension:hll.hll_hashval)": operators.hashvalNotEqual,
    "operator:$extension:hll.<>($extension:hll.hll,$extension:hll.hll)": operators.notEqual,
    "operator:$extension:hll.=($extension:hll.hll_hashval,$extension:hll.hll_hashval)": operators.hashvalEqual,
    "operator:$extension:hll.=($extension:hll.hll,$extension:hll.hll)": operators.equal,
    "operator:$extension:hll.||($extension:hll.hll_hashval,$extension:hll.hll)": operators.addReverse,
    "operator:$extension:hll.||($extension:hll.hll,$extension:hll.hll_hashval)": operators.add,
    "operator:$extension:hll.||($extension:hll.hll,$extension:hll.hll)": operators.union,
    "routine:$extension:hll.hll($extension:hll.hll,pg_catalog.int4,pg_catalog.bool)": functions.hll,
    "routine:$extension:hll.hll_add($extension:hll.hll,$extension:hll.hll_hashval)": functions.hll_add,
    "routine:$extension:hll.hll_add_agg($extension:hll.hll_hashval)": functions.hll_add_agg.hashval,
    "routine:$extension:hll.hll_add_agg($extension:hll.hll_hashval,pg_catalog.int4)": functions.hll_add_agg.log2m,
    "routine:$extension:hll.hll_add_agg($extension:hll.hll_hashval,pg_catalog.int4,pg_catalog.int4)":
      functions.hll_add_agg.regwidth,
    "routine:$extension:hll.hll_add_agg($extension:hll.hll_hashval,pg_catalog.int4,pg_catalog.int4,pg_catalog.int8)":
      functions.hll_add_agg.expthresh,
    "routine:$extension:hll.hll_add_agg($extension:hll.hll_hashval,pg_catalog.int4,pg_catalog.int4,pg_catalog.int8,pg_catalog.int4)":
      functions.hll_add_agg.sparseon,
    "routine:$extension:hll.hll_add_rev($extension:hll.hll_hashval,$extension:hll.hll)": functions.hll_add_rev,
    "routine:$extension:hll.hll_cardinality($extension:hll.hll)": functions.hll_cardinality,
    "routine:$extension:hll.hll_empty()": functions.hll_empty.defaults,
    "routine:$extension:hll.hll_empty(pg_catalog.int4)": functions.hll_empty.log2m,
    "routine:$extension:hll.hll_empty(pg_catalog.int4,pg_catalog.int4)": functions.hll_empty.regwidth,
    "routine:$extension:hll.hll_empty(pg_catalog.int4,pg_catalog.int4,pg_catalog.int8)": functions.hll_empty.expthresh,
    "routine:$extension:hll.hll_empty(pg_catalog.int4,pg_catalog.int4,pg_catalog.int8,pg_catalog.int4)":
      functions.hll_empty.sparseon,
    "routine:$extension:hll.hll_eq($extension:hll.hll,$extension:hll.hll)": functions.hll_eq,
    "routine:$extension:hll.hll_expthresh($extension:hll.hll)": functions.hll_expthresh,
    "routine:$extension:hll.hll_hash_any(pg_catalog.anyelement,pg_catalog.int4)": functions.hll_hash_any,
    "routine:$extension:hll.hll_hash_bigint(pg_catalog.int8,pg_catalog.int4)": functions.hll_hash_bigint,
    "routine:$extension:hll.hll_hash_boolean(pg_catalog.bool,pg_catalog.int4)": functions.hll_hash_boolean,
    "routine:$extension:hll.hll_hash_bytea(pg_catalog.bytea,pg_catalog.int4)": functions.hll_hash_bytea,
    "routine:$extension:hll.hll_hash_integer(pg_catalog.int4,pg_catalog.int4)": functions.hll_hash_integer,
    "routine:$extension:hll.hll_hash_smallint(pg_catalog.int2,pg_catalog.int4)": functions.hll_hash_smallint,
    "routine:$extension:hll.hll_hash_text(pg_catalog.text,pg_catalog.int4)": functions.hll_hash_text,
    "routine:$extension:hll.hll_hashval(pg_catalog.int8)": functions.hll_hashval,
    "routine:$extension:hll.hll_hashval_eq($extension:hll.hll_hashval,$extension:hll.hll_hashval)":
      functions.hll_hashval_eq,
    "routine:$extension:hll.hll_hashval_int4(pg_catalog.int4)": functions.hll_hashval_int4,
    "routine:$extension:hll.hll_hashval_ne($extension:hll.hll_hashval,$extension:hll.hll_hashval)":
      functions.hll_hashval_ne,
    "routine:$extension:hll.hll_log2m($extension:hll.hll)": functions.hll_log2m,
    "routine:$extension:hll.hll_ne($extension:hll.hll,$extension:hll.hll)": functions.hll_ne,
    "routine:$extension:hll.hll_print($extension:hll.hll)": functions.hll_print,
    "routine:$extension:hll.hll_regwidth($extension:hll.hll)": functions.hll_regwidth,
    "routine:$extension:hll.hll_schema_version($extension:hll.hll)": functions.hll_schema_version,
    "routine:$extension:hll.hll_send($extension:hll.hll)": functions.hll_send,
    "routine:$extension:hll.hll_sparseon($extension:hll.hll)": functions.hll_sparseon,
    "routine:$extension:hll.hll_type($extension:hll.hll)": functions.hll_type,
    "routine:$extension:hll.hll_typmod_in(pg_catalog._cstring)": functions.hll_typmod_in,
    "routine:$extension:hll.hll_union($extension:hll.hll,$extension:hll.hll)": functions.hll_union,
    "routine:$extension:hll.hll_union_agg($extension:hll.hll)": functions.hll_union_agg,
    "cast:$extension:hll.hll->$extension:hll.hll": casts.hll_to_hll,
    "cast:pg_catalog.bytea->$extension:hll.hll": casts.bytea_to_hll,
    "cast:pg_catalog.int4->$extension:hll.hll_hashval": casts.int4_to_hll_hashval,
    "cast:pg_catalog.int8->$extension:hll.hll_hashval": casts.int8_to_hll_hashval,
  });
  const sketchValue: ExtensionValueSchema = {
    kind: "object",
    properties: { hex: { kind: "string", pattern: "^(?:[0-9a-f]{2})+$" } },
  };
  const hashvalValue: ExtensionValueSchema = { kind: "bigint" };
  const arrayValue = (element: ExtensionValueSchema): ExtensionValueSchema => {
    let nested: ExtensionValueSchema = {
      kind: "union",
      variants: [element, { kind: "null" }],
    };
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
              lowerBound: {
                kind: "number",
                integer: true,
                minimum: -2147483648,
                maximum: 2147483647,
              },
              length: {
                kind: "number",
                integer: true,
                minimum: 1,
                maximum: 2147483647,
              },
            },
          },
        },
        values: { kind: "union", variants: depths },
      },
    };
  };
  const equality = (operand: string) => ({
    eq: {
      member: `operator:$extension:hll.=(${operand},${operand})`,
      schema,
      name: "=",
      operand: "field" as const,
    },
    ne: {
      member: `operator:$extension:hll.<>(${operand},${operand})`,
      schema,
      name: "<>",
      operand: "field" as const,
    },
  });
  const field = (modifier?: HllModifier) => {
    const selected = modifier && v.parse(modifierValidator, modifier);
    const typmods = selected ? [selected.log2m, selected.regwidth, selected.expthresh, selected.sparseon] : [];
    return createExtensionField({
      extension: descriptor,
      member: "type:$extension:hll.hll",
      type: "hll",
      codec,
      value: sketchValue,
      typmods,
      search: {
        filter: true,
        comparison: false,
        order: false,
        text: false,
      } as const,
      operators: equality(hllType),
    });
  };
  const hashvalField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:hll.hll_hashval",
      type: "hll_hashval",
      codec: hashvalCodec,
      value: hashvalValue,
      search: {
        filter: true,
        comparison: false,
        order: false,
        text: false,
      } as const,
      operators: equality(hashvalType),
    });
  const arrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:hll._hll",
      type: "hll",
      array: true,
      codec: fullArray,
      value: arrayValue(sketchValue),
      search: {
        filter: false,
        comparison: false,
        order: false,
        text: false,
      } as const,
    });
  const hashvalArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:hll._hll_hashval",
      type: "hll_hashval",
      array: true,
      codec: hashvalArray,
      value: arrayValue(hashvalValue),
      search: {
        filter: false,
        comparison: false,
        order: false,
        text: false,
      } as const,
    });
  return bindExtension(descriptor, {
    codec,
    hashvalCodec,
    arrayCodec: fullArray,
    hashvalArrayCodec: hashvalArray,
    sketch: hllSketch,
    field,
    hashvalField,
    arrayField,
    hashvalArrayField,
    empty: functions.hll_empty,
    add: functions.hll_add,
    union: functions.hll_union,
    cardinality: functions.hll_cardinality,
    addAggregate: functions.hll_add_agg,
    unionAggregate: functions.hll_union_agg,
    hash: Object.freeze({
      any: functions.hll_hash_any,
      bigint: functions.hll_hash_bigint,
      boolean: functions.hll_hash_boolean,
      bytea: functions.hll_hash_bytea,
      integer: functions.hll_hash_integer,
      smallint: functions.hll_hash_smallint,
      text: functions.hll_hash_text,
    }),
    equal: operators.equal,
    notEqual: operators.notEqual,
    sql: Object.freeze({ functions, operators, casts, overloads }),
  });
}
