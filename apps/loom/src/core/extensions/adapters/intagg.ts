import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { nullableCodec } from "../codecs";
import { int4Codec } from "../native-codecs";
import { createSqlAggregate, createSqlRows } from "../sql";
import { int4NativeArray, intaggInt4ArrayCodec, nullableIntaggInt4ArrayCodec } from "./intagg-codecs";

export { int4NativeArray, intaggInt4ArrayCodec, nullableIntaggInt4ArrayCodec } from "./intagg-codecs";
export type { PostgreSqlArray } from "./intagg-codecs";

const digest = "7e9c80504c50e5a1910b61667a1774d8c1976c676c087c23fd744168986311f1";
type Descriptor = ExtensionDescriptor<"intagg", { readonly version: "1.1"; readonly schema: string }>;

/** Exact intagg 1.1 aggregate and set-returning enum. Transition/final internals stay uncallable. */
export function createIntagg_1_1<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "intagg" ||
    descriptor.version !== "1.1" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("intagg 1.1 requires its exact verified contract");
  const integer = nullableCodec(int4Codec);
  const integers = nullableIntaggInt4ArrayCodec;
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const int_array_aggregate = createSqlAggregate({
    ...base,
    name: "int_array_aggregate",
    member: "routine:$extension:intagg.int_array_aggregate(pg_catalog.int4)",
    arguments: [integer] as const,
    result: integers,
  });
  const int_array_enum = createSqlRows({
    ...base,
    name: "int_array_enum",
    member: "routine:$extension:intagg.int_array_enum(pg_catalog._int4)",
    arguments: [integers] as const,
    result: integer,
  });
  const functions = Object.freeze({ int_array_aggregate, int_array_enum });
  return bindExtension(descriptor, {
    intArrayAggregate: int_array_aggregate,
    intArrayEnum: int_array_enum,
    int4NativeArray,
    codec: intaggInt4ArrayCodec,
    sql: Object.freeze({
      functions,
      operators: Object.freeze({}),
      overloads: Object.freeze({
        "routine:$extension:intagg.int_array_aggregate(pg_catalog.int4)": int_array_aggregate,
        "routine:$extension:intagg.int_array_enum(pg_catalog._int4)": int_array_enum,
      }),
    }),
  });
}
