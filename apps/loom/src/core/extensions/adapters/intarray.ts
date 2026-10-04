import * as v from "valibot";
import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";
import type { PostgresColumnType } from "drizzle-orm/pg-core/codecs";
import { Field } from "../../schema/fields";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { arrayCodec, booleanCodec, decodeFailure, nullableCodec, textCodec } from "../codecs";
import { int4ArrayCodec, int4Codec } from "../native-codecs";
import { extensionTextProjection } from "../json-transport";
import { registerExtensionStorageCheck, type ExtensionFieldMetadata } from "../values";
import type { ExtensionIndexContract } from "../fields";
import { createSqlFunction, createSqlOperator } from "../sql";
import {
  createQueryIntCodec,
  intarrayInt4ArgumentCodec,
  intarrayInt4ArrayCodec,
  intarraySortDirectionCodec,
  intarrayValues,
} from "./intarray-codecs";
export { intarrayValues } from "./intarray-codecs";
export type { PostgreSqlArray } from "./intarray-codecs";
const digest = "c71054bd4b390e4e0457bb83bbaeaaef426319c14d6f0563fecfb8758d3224f2";
type Descriptor = ExtensionDescriptor<"intarray", { readonly version: "1.5"; readonly schema: string }>;

/** Exact intarray 1.5 queries over native `int4[]`; PostgreSQL rejects NULL elements in most members. */
export function createIntarray_1_5<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "intarray" ||
    descriptor.version !== "1.5" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("intarray 1.5 requires its exact verified contract");
  const ints = nullableCodec(intarrayInt4ArgumentCodec),
    arrays = nullableCodec(intarrayInt4ArrayCodec),
    int4 = nullableCodec(int4Codec),
    bool = nullableCodec(booleanCodec),
    text = nullableCodec(textCodec),
    query = nullableCodec(createQueryIntCodec(descriptor.schema)),
    direction = nullableCodec(intarraySortDirectionCodec);
  const base = {
    schema: descriptor.schema,
    dependencies: [],
    observability: "tables",
    authority: "query",
  } as const;
  const array = "pg_catalog._int4";
  const queryType = "$extension:intarray.query_int";
  const binary = <const Name extends string, Result extends typeof arrays | typeof bool>(name: Name, result: Result) =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:intarray.${name}(${array},${array})`,
      arguments: [ints, ints] as const,
      result,
    });
  const element = <const Name extends string, Result extends typeof arrays | typeof int4>(name: Name, result: Result) =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:intarray.${name}(${array},pg_catalog.int4)`,
      arguments: [ints, int4] as const,
      result,
    });
  const unary = <const Name extends string, Result extends typeof arrays | typeof int4>(name: Name, result: Result) =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:intarray.${name}(${array})`,
      arguments: [ints] as const,
      result,
    });
  const intContained = binary("_int_contained", bool),
    intContains = binary("_int_contains", bool),
    intDifferent = binary("_int_different", bool),
    intInter = binary("_int_inter", arrays),
    intOverlap = binary("_int_overlap", bool),
    intSame = binary("_int_same", bool),
    intUnion = binary("_int_union", arrays),
    pushArray = binary("intarray_push_array", arrays),
    subtract = binary("intset_subtract", arrays);
  const idx = element("idx", int4),
    delElem = element("intarray_del_elem", arrays),
    pushElem = element("intarray_push_elem", arrays),
    unionElem = element("intset_union_elem", arrays);
  const icount = unary("icount", int4),
    sortAsc = unary("sort_asc", arrays),
    sortDesc = unary("sort_desc", arrays),
    sortDefault = unary("sort", arrays),
    uniq = unary("uniq", arrays);
  const sortDirected = createSqlFunction({
    ...base,
    name: "sort",
    member: `routine:$extension:intarray.sort(${array},pg_catalog.text)`,
    arguments: [ints, direction] as const,
    result: arrays,
  });
  const subarrayFrom = createSqlFunction({
    ...base,
    name: "subarray",
    member: `routine:$extension:intarray.subarray(${array},pg_catalog.int4)`,
    arguments: [ints, int4] as const,
    result: arrays,
  });
  const subarrayLength = createSqlFunction({
    ...base,
    name: "subarray",
    member: `routine:$extension:intarray.subarray(${array},pg_catalog.int4,pg_catalog.int4)`,
    arguments: [ints, int4, int4] as const,
    result: arrays,
  });
  const intset = createSqlFunction({
    ...base,
    name: "intset",
    member: "routine:$extension:intarray.intset(pg_catalog.int4)",
    arguments: [int4] as const,
    result: arrays,
  });
  const boolop = createSqlFunction({
    ...base,
    name: "boolop",
    member: `routine:$extension:intarray.boolop(${array},${queryType})`,
    arguments: [ints, query] as const,
    result: bool,
  });
  const rboolop = createSqlFunction({
    ...base,
    name: "rboolop",
    member: `routine:$extension:intarray.rboolop(${queryType},${array})`,
    arguments: [query, ints] as const,
    result: bool,
  });
  /** PostgreSQL 18 retains this captured member but always raises "querytree is no longer implemented". */
  const querytree = createSqlFunction({
    ...base,
    name: "querytree",
    member: `routine:$extension:intarray.querytree(${queryType})`,
    arguments: [query] as const,
    result: text,
  });
  /** Sorts ascending, or by ASC/DESC; multidimensional input keeps its shape. */
  const sort = (...values: Parameters<typeof sortDefault> | Parameters<typeof sortDirected>) =>
    values.length === 1 ? sortDefault(...values) : sortDirected(...values);
  /** One-based start; a negative start counts from the end, and a negative length drops trailing elements. */
  const subarray = (...values: Parameters<typeof subarrayFrom> | Parameters<typeof subarrayLength>) =>
    values.length === 2 ? subarrayFrom(...values) : subarrayLength(...values);
  const operator = <
    const Name extends string,
    Left extends typeof ints | typeof query | undefined,
    Right extends typeof ints | typeof int4 | typeof query,
    Result extends typeof arrays | typeof int4 | typeof bool,
  >(
    name: Name,
    left: Left,
    right: Right,
    result: Result,
    signature: string,
  ) =>
    createSqlOperator({
      ...base,
      name,
      member: `operator:$extension:intarray.${name}(${signature})`,
      left,
      right,
      result,
    });
  const subtractArray = operator("-", ints, ints, arrays, `${array},${array}`),
    removeElement = operator("-", ints, int4, arrays, `${array},pg_catalog.int4`),
    matches = operator("@@", ints, query, bool, `${array},${queryType}`),
    contains = operator("@>", ints, ints, bool, `${array},${array}`),
    intersection = operator("&", ints, ints, arrays, `${array},${array}`),
    overlaps = operator("&&", ints, ints, bool, `${array},${array}`),
    count = operator("#", undefined, ints, int4, `,${array}`),
    indexOf = operator("#", ints, int4, int4, `${array},pg_catalog.int4`),
    concat = operator("+", ints, ints, arrays, `${array},${array}`),
    append = operator("+", ints, int4, arrays, `${array},pg_catalog.int4`),
    containedBy = operator("<@", ints, ints, bool, `${array},${array}`),
    union = operator("|", ints, ints, arrays, `${array},${array}`),
    unionElement = operator("|", ints, int4, arrays, `${array},pg_catalog.int4`),
    matchedBy = operator("~~", query, ints, bool, `${queryType},${array}`);
  const operators = Object.freeze({
    "-(_int4,_int4)": subtractArray,
    "-(_int4,int4)": removeElement,
    "@@(_int4,query_int)": matches,
    "@>(_int4,_int4)": contains,
    "&(_int4,_int4)": intersection,
    "&&(_int4,_int4)": overlaps,
    "#(_int4)": count,
    "#(_int4,int4)": indexOf,
    "+(_int4,_int4)": concat,
    "+(_int4,int4)": append,
    "<@(_int4,_int4)": containedBy,
    "|(_int4,_int4)": union,
    "|(_int4,int4)": unionElement,
    "~~(query_int,_int4)": matchedBy,
  });
  const functions = Object.freeze({
    _int_contained: intContained,
    _int_contains: intContains,
    _int_different: intDifferent,
    _int_inter: intInter,
    _int_overlap: intOverlap,
    _int_same: intSame,
    _int_union: intUnion,
    boolop,
    rboolop,
    icount,
    idx,
    intarray_del_elem: delElem,
    intarray_push_array: pushArray,
    intarray_push_elem: pushElem,
    intset_subtract: subtract,
    intset_union_elem: unionElem,
    intset,
    querytree,
    sort,
    sort_asc: sortAsc,
    sort_desc: sortDesc,
    subarray,
    uniq,
  });
  const overloads = Object.freeze({
    [`operator:$extension:intarray.-(${array},${array})`]: subtractArray,
    [`operator:$extension:intarray.-(${array},pg_catalog.int4)`]: removeElement,
    [`operator:$extension:intarray.@@(${array},${queryType})`]: matches,
    [`operator:$extension:intarray.@>(${array},${array})`]: contains,
    [`operator:$extension:intarray.&(${array},${array})`]: intersection,
    [`operator:$extension:intarray.&&(${array},${array})`]: overlaps,
    [`operator:$extension:intarray.#(,${array})`]: count,
    [`operator:$extension:intarray.#(${array},pg_catalog.int4)`]: indexOf,
    [`operator:$extension:intarray.+(${array},${array})`]: concat,
    [`operator:$extension:intarray.+(${array},pg_catalog.int4)`]: append,
    [`operator:$extension:intarray.<@(${array},${array})`]: containedBy,
    [`operator:$extension:intarray.|(${array},${array})`]: union,
    [`operator:$extension:intarray.|(${array},pg_catalog.int4)`]: unionElement,
    [`operator:$extension:intarray.~~(${queryType},${array})`]: matchedBy,
    [`routine:$extension:intarray._int_contained(${array},${array})`]: intContained,
    [`routine:$extension:intarray._int_contains(${array},${array})`]: intContains,
    [`routine:$extension:intarray._int_different(${array},${array})`]: intDifferent,
    [`routine:$extension:intarray._int_inter(${array},${array})`]: intInter,
    [`routine:$extension:intarray._int_overlap(${array},${array})`]: intOverlap,
    [`routine:$extension:intarray._int_same(${array},${array})`]: intSame,
    [`routine:$extension:intarray._int_union(${array},${array})`]: intUnion,
    [`routine:$extension:intarray.boolop(${array},${queryType})`]: boolop,
    [`routine:$extension:intarray.rboolop(${queryType},${array})`]: rboolop,
    [`routine:$extension:intarray.icount(${array})`]: icount,
    [`routine:$extension:intarray.idx(${array},pg_catalog.int4)`]: idx,
    [`routine:$extension:intarray.intarray_del_elem(${array},pg_catalog.int4)`]: delElem,
    [`routine:$extension:intarray.intarray_push_array(${array},${array})`]: pushArray,
    [`routine:$extension:intarray.intarray_push_elem(${array},pg_catalog.int4)`]: pushElem,
    [`routine:$extension:intarray.intset_subtract(${array},${array})`]: subtract,
    [`routine:$extension:intarray.intset_union_elem(${array},pg_catalog.int4)`]: unionElem,
    "routine:$extension:intarray.intset(pg_catalog.int4)": intset,
    [`routine:$extension:intarray.querytree(${queryType})`]: querytree,
    [`routine:$extension:intarray.sort_asc(${array})`]: sortAsc,
    [`routine:$extension:intarray.sort_desc(${array})`]: sortDesc,
    [`routine:$extension:intarray.sort(${array},pg_catalog.text)`]: sortDirected,
    [`routine:$extension:intarray.sort(${array})`]: sortDefault,
    [`routine:$extension:intarray.subarray(${array},pg_catalog.int4,pg_catalog.int4)`]: subarrayLength,
    [`routine:$extension:intarray.subarray(${array},pg_catalog.int4)`]: subarrayFrom,
    [`routine:$extension:intarray.uniq(${array})`]: uniq,
  });
  /** Matches native null-free one-dimensional `int4[]` extension fields, as captured by each operator class. */
  const index = (
    method: "gin" | "gist",
    opclass: "gin__int_ops" | "gist__int_ops" | "gist__intbig_ops",
    options?: Readonly<Record<string, number>>,
  ): ExtensionIndexContract =>
    Object.freeze({
      name: "intarray",
      version: "1.5",
      schema: descriptor.schema,
      digest,
      member: `opclass:$extension:intarray.${opclass}/${method}`,
      method,
      opclass,
      type: "int4",
      ...(opclass === "gist__int_ops" && { default: true }),
      input: Object.freeze({
        schema: "pg_catalog",
        type: "int4",
        dimensions: 1,
      }),
      nullFreeElements: true,
      ...(options && { options: Object.freeze({ ...options }) }),
    });
  const bounded = (name: "numranges" | "siglen", limit: number) =>
    v.strictObject({
      [name]: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(limit))),
    });
  /** Native one-dimensional, null-free int4[] storage, usable with all three captured index classes. */
  const field = () => {
    const metadata: ExtensionFieldMetadata = Object.freeze({
      name: "intarray",
      version: "1.5",
      schema: descriptor.schema,
      digest,
      member: "opclass:$extension:intarray.gin__int_ops/gin",
      type: "int4",
      array: true,
      codec: int4ArrayCodec.id,
      typmods: Object.freeze([]),
      parameters: Object.freeze({}),
      storage: Object.freeze({ schema: "pg_catalog", type: "int4", dimensions: 1 }),
      value: Object.freeze({
        kind: "array",
        items: Object.freeze({ kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 }),
      }),
      search: Object.freeze({ filter: false, comparison: false, order: false, text: false }),
    });
    registerExtensionStorageCheck(metadata, (value) => int4ArrayCodec.encode(v.parse(v.array(v.number()), value)));
    const column = customType<{ data: number[]; driverData: unknown; jsonData: unknown }>({
      dataType: () => '"pg_catalog"."int4"[]',
      // SAFETY: Kello's dialect registers this private text-transport codec key.
      codec: extensionTextProjection as PostgresColumnType,
      toDriver: (value) => decodeFailure(() => int4ArrayCodec.encode(value)),
      fromDriver: (value) => decodeFailure(() => int4ArrayCodec.decode(value)),
      fromJson: (value) => decodeFailure(() => int4ArrayCodec.decode(value)),
      forJsonSelect: (column) => sql`(${column})::text`,
    });
    return new Field<ReturnType<typeof column>, undefined, number[]>(
      (name) => column(name),
      { kind: "extension", notNull: false, unique: false, extension: metadata },
      undefined,
      (value) => {
        const encoded = v.parse(v.string(), int4ArrayCodec.encode(value));
        return { sql: sql`${encoded}::"pg_catalog"."int4"[]`.inlineParams(), fingerprint: encoded };
      },
    );
  };
  return bindExtension(descriptor, {
    field,
    queryArrayCodec: arrayCodec(createQueryIntCodec(descriptor.schema)),
    arrayCodec: intarrayInt4ArrayCodec,
    queryCodec: query,
    values: intarrayValues,
    contains,
    containedBy,
    overlaps,
    matches,
    matchedBy,
    intersection,
    union,
    unionElement,
    concat,
    append,
    subtract: subtractArray,
    removeElement,
    count,
    indexOf,
    icount,
    idx,
    sort,
    sortAsc,
    sortDesc,
    subarray,
    uniq,
    intset,
    querytree,
    sql: Object.freeze({ functions, operators, overloads }),
    indexes: Object.freeze({
      gin: () => index("gin", "gin__int_ops"),
      /** Default GiST class; numranges is PostgreSQL's 1..252 range-compression budget. */
      gist: (options: { readonly numranges?: number } = {}) => {
        const checked = v.parse(bounded("numranges", 252), options);
        return index(
          "gist",
          "gist__int_ops",
          checked.numranges === undefined ? undefined : { numranges: checked.numranges },
        );
      },
      /** Signature GiST class for large sets; siglen is the 1..2024 byte signature length. */
      gistBig: (options: { readonly siglen?: number } = {}) => {
        const checked = v.parse(bounded("siglen", 2024), options);
        return index("gist", "gist__intbig_ops", checked.siglen === undefined ? undefined : { siglen: checked.siglen });
      },
    }),
  });
}
