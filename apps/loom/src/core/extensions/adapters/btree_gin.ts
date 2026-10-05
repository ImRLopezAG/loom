import { bindExtension, type ExtensionDescriptor } from "../bindings";
import type { ExtensionIndexContract } from "../fields";
import * as v from "valibot";
import type { PgEnum } from "drizzle-orm/pg-core";
import { createExtensionCodec, nullableCodec, numericCodec, type ExtensionCodec } from "../codecs";
import { int4Codec } from "../native-codecs";
import { createSqlFunction, type ExtensionSqlInput } from "../sql";

const digest = "c3c8db3d98f5b687408fa9feac34338a9ad5fc0308c713b709008cd5889b709e";
type Descriptor = ExtensionDescriptor<"btree_gin", { readonly version: "1.3"; readonly schema: string }>;

/**
 * Exact btree_gin 1.3 declarations for PostgreSQL's native GIN access method.
 * These classes implement <, <=, =, >= and > on scalar keys; they do not
 * supply ordering or uniqueness. Native enum_ops accepts PostgreSQL enums,
 * not Loom's text-backed fields.enum declarations. The two SQL-callable
 * comparisons also have direct bindings; internal-pointer callbacks stay native.
 */
export function createBtreeGin_1_3<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "btree_gin" ||
    descriptor.version !== "1.3" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("btree_gin 1.3 requires its exact verified contract");
  const placement: Selected["schema"] = descriptor.schema;
  const base = { schema: placement, dependencies: [], observability: "tables", authority: "query" } as const;
  const numeric = nullableCodec(numericCodec);
  const result = nullableCodec(int4Codec);
  const gin_numeric_cmp = createSqlFunction({
    ...base,
    name: "gin_numeric_cmp",
    member: "routine:$extension:btree_gin.gin_numeric_cmp(pg_catalog.numeric,pg_catalog.numeric)",
    arguments: [numeric, numeric] as const,
    result,
  });
  /** The concrete native enum supplies the polymorphic SQL type and its literal labels. */
  function gin_enum_cmp<const Values extends [string, ...string[]]>(
    enumType: PgEnum<Values>,
    left: ExtensionSqlInput<ExtensionCodec<NoInfer<Values[number]> | null, NoInfer<Values[number]> | null>>,
    right: ExtensionSqlInput<ExtensionCodec<NoInfer<Values[number]> | null, NoInfer<Values[number]> | null>>,
  ) {
    const labels = v.picklist(enumType.enumValues);
    const enumeration = nullableCodec(
      createExtensionCodec({
        id: `pg:enum:1:${JSON.stringify([enumType.schema ?? "public", enumType.enumName, enumType.enumValues])}`,
        sqlType: { schema: enumType.schema ?? "public", name: enumType.enumName },
        input: labels,
        output: labels,
        transport: "native",
        encode: (value) => value,
        decode: (value) => value,
      }),
    );
    return createSqlFunction({
      ...base,
      name: "gin_enum_cmp",
      member: "routine:$extension:btree_gin.gin_enum_cmp(pg_catalog.anyenum,pg_catalog.anyenum)",
      arguments: [enumeration, enumeration] as const,
      result,
    })(left, right);
  }
  function index<const Opclass extends string, const Input extends string>(opclass: Opclass, type: Input) {
    return Object.freeze({
      name: "btree_gin",
      version: "1.3",
      schema: placement,
      digest,
      member: `opclass:$extension:btree_gin.${opclass}/gin`,
      method: "gin",
      opclass,
      type,
      default: true,
      input: Object.freeze({ schema: "pg_catalog", type, dimensions: 0 }),
    }) satisfies ExtensionIndexContract;
  }
  return bindExtension(descriptor, {
    ginEnumCmp: gin_enum_cmp,
    ginNumericCmp: gin_numeric_cmp,
    sql: Object.freeze({
      functions: Object.freeze({ gin_enum_cmp, gin_numeric_cmp }),
      operators: Object.freeze({}),
      overloads: Object.freeze({
        "routine:$extension:btree_gin.gin_enum_cmp(pg_catalog.anyenum,pg_catalog.anyenum)": gin_enum_cmp,
        "routine:$extension:btree_gin.gin_numeric_cmp(pg_catalog.numeric,pg_catalog.numeric)": gin_numeric_cmp,
      }),
    }),
    indexes: Object.freeze({
      bit: () => index("bit_ops", "bit"),
      bool: () => index("bool_ops", "bool"),
      bpchar: () => index("bpchar_ops", "bpchar"),
      bytea: () => index("bytea_ops", "bytea"),
      char: () => index("char_ops", "char"),
      cidr: () => index("cidr_ops", "cidr"),
      date: () => index("date_ops", "date"),
      enum: () => index("enum_ops", "anyenum"),
      float4: () => index("float4_ops", "float4"),
      float8: () => index("float8_ops", "float8"),
      inet: () => index("inet_ops", "inet"),
      int2: () => index("int2_ops", "int2"),
      int4: () => index("int4_ops", "int4"),
      int8: () => index("int8_ops", "int8"),
      interval: () => index("interval_ops", "interval"),
      macaddr: () => index("macaddr_ops", "macaddr"),
      macaddr8: () => index("macaddr8_ops", "macaddr8"),
      money: () => index("money_ops", "money"),
      name: () => index("name_ops", "name"),
      numeric: () => index("numeric_ops", "numeric"),
      oid: () => index("oid_ops", "oid"),
      text: () => index("text_ops", "text"),
      time: () => index("time_ops", "time"),
      timestamp: () => index("timestamp_ops", "timestamp"),
      timestamptz: () => index("timestamptz_ops", "timestamptz"),
      timetz: () => index("timetz_ops", "timetz"),
      uuid: () => index("uuid_ops", "uuid"),
      varbit: () => index("varbit_ops", "varbit"),
      varchar: () => index("varchar_ops", "varchar"),
    }),
  });
}
