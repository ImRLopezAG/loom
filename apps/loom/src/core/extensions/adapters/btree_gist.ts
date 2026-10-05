import { bindExtension, type ExtensionDescriptor } from "../bindings";
import type { ExtensionIndexContract } from "../fields";
import { floatCodec, integerCodec, nullableCodec, type ExtensionCodec } from "../codecs";
import { int4Codec } from "../native-codecs";
import { float4Codec, int2Codec } from "../primitive-number-codecs";
import { timestampCodec, timestamptzCodec } from "../native-timestamp-codecs";
import { createSqlFunction, createSqlOperator } from "../sql";
import {
  btreeGistDateCodec,
  btreeGistIntervalCodec,
  btreeGistMoneyCodec,
  btreeGistOidCodec,
  btreeGistTimeCodec,
} from "./btree_gist-codecs";

const digest = "73fdb4831683ee8042ecbcd0d0639909650d018d6c7ca51bb85c1cb38de96072";
type Descriptor = ExtensionDescriptor<"btree_gist", { readonly version: "1.8"; readonly schema: string }>;

/**
 * Exact btree_gist 1.8 declarations for PostgreSQL's native GiST access method.
 * Every class supports <, <=, =, >=, > and <>, which is what lets scalar columns
 * join range or geometric columns in multicolumn GiST indexes and exclusion
 * constraints. The twelve distance classes also order by `<->` (KNN). The
 * distance functions, their operators and gist_translate_cmptype_btree are
 * SQL-callable and bound directly; internal/cstring callbacks stay native.
 */
export function createBtreeGist_1_8<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "btree_gist" ||
    descriptor.version !== "1.8" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("btree_gist 1.8 requires its exact verified contract");
  const placement: Selected["schema"] = descriptor.schema;
  const base = { schema: placement, dependencies: [], observability: "tables", authority: "query" } as const;
  const money = nullableCodec(btreeGistMoneyCodec);
  const date = nullableCodec(btreeGistDateCodec);
  const float4 = nullableCodec(float4Codec);
  const float8 = nullableCodec(floatCodec);
  const int2 = nullableCodec(int2Codec);
  const int4 = nullableCodec(int4Codec);
  const int8 = nullableCodec(integerCodec);
  const interval = nullableCodec(btreeGistIntervalCodec);
  const oid = nullableCodec(btreeGistOidCodec);
  const time = nullableCodec(btreeGistTimeCodec);
  const timestamp = nullableCodec(timestampCodec);
  const timestamptz = nullableCodec(timestamptzCodec);
  /** STRICT, immutable, parallel-safe distance: either NULL yields NULL; PostgreSQL raises on result overflow. */
  function distance<
    const Name extends string,
    const Type extends string,
    Input extends ExtensionCodec<never, unknown>,
    Result extends ExtensionCodec<never, unknown>,
  >(name: Name, type: Type, input: Input, result: Result) {
    const signature = `pg_catalog.${type},pg_catalog.${type}` as const;
    return [
      createSqlFunction({
        ...base,
        name,
        member: `routine:$extension:btree_gist.${name}(${signature})`,
        arguments: [input, input] as const,
        result,
      }),
      createSqlOperator({
        ...base,
        name: "<->",
        member: `operator:$extension:btree_gist.<->(${signature})`,
        left: input,
        right: input,
        result,
      }),
    ] as const;
  }
  const [cash_dist, moneyDistance] = distance("cash_dist", "money", money, money);
  const [date_dist, dateDistance] = distance("date_dist", "date", date, int4);
  const [float4_dist, float4Distance] = distance("float4_dist", "float4", float4, float4);
  const [float8_dist, float8Distance] = distance("float8_dist", "float8", float8, float8);
  const [int2_dist, int2Distance] = distance("int2_dist", "int2", int2, int2);
  const [int4_dist, int4Distance] = distance("int4_dist", "int4", int4, int4);
  const [int8_dist, int8Distance] = distance("int8_dist", "int8", int8, int8);
  const [interval_dist, intervalDistance] = distance("interval_dist", "interval", interval, interval);
  const [oid_dist, oidDistance] = distance("oid_dist", "oid", oid, oid);
  const [time_dist, timeDistance] = distance("time_dist", "time", time, interval);
  const [ts_dist, timestampDistance] = distance("ts_dist", "timestamp", timestamp, interval);
  const [tstz_dist, timestamptzDistance] = distance("tstz_dist", "timestamptz", timestamptz, interval);
  /** GiST support procedure 12: maps a CompareType number to its btree strategy (0 when none). */
  const gist_translate_cmptype_btree = createSqlFunction({
    ...base,
    name: "gist_translate_cmptype_btree",
    member: "routine:$extension:btree_gist.gist_translate_cmptype_btree(pg_catalog.int4)",
    arguments: [int4] as const,
    result: int2,
  });
  const functions = Object.freeze({
    cash_dist,
    date_dist,
    float4_dist,
    float8_dist,
    gist_translate_cmptype_btree,
    int2_dist,
    int4_dist,
    int8_dist,
    interval_dist,
    oid_dist,
    time_dist,
    ts_dist,
    tstz_dist,
  });
  const distances = Object.freeze({
    date: dateDistance,
    float4: float4Distance,
    float8: float8Distance,
    int2: int2Distance,
    int4: int4Distance,
    int8: int8Distance,
    interval: intervalDistance,
    money: moneyDistance,
    oid: oidDistance,
    time: timeDistance,
    timestamp: timestampDistance,
    timestamptz: timestamptzDistance,
  });
  const operators = Object.freeze({
    "<->(date,date)": dateDistance,
    "<->(float4,float4)": float4Distance,
    "<->(float8,float8)": float8Distance,
    "<->(int2,int2)": int2Distance,
    "<->(int4,int4)": int4Distance,
    "<->(int8,int8)": int8Distance,
    "<->(interval,interval)": intervalDistance,
    "<->(money,money)": moneyDistance,
    "<->(oid,oid)": oidDistance,
    "<->(time,time)": timeDistance,
    "<->(timestamp,timestamp)": timestampDistance,
    "<->(timestamptz,timestamptz)": timestamptzDistance,
  });
  const overloads = Object.freeze({
    "routine:$extension:btree_gist.cash_dist(pg_catalog.money,pg_catalog.money)": cash_dist,
    "routine:$extension:btree_gist.date_dist(pg_catalog.date,pg_catalog.date)": date_dist,
    "routine:$extension:btree_gist.float4_dist(pg_catalog.float4,pg_catalog.float4)": float4_dist,
    "routine:$extension:btree_gist.float8_dist(pg_catalog.float8,pg_catalog.float8)": float8_dist,
    "routine:$extension:btree_gist.gist_translate_cmptype_btree(pg_catalog.int4)": gist_translate_cmptype_btree,
    "routine:$extension:btree_gist.int2_dist(pg_catalog.int2,pg_catalog.int2)": int2_dist,
    "routine:$extension:btree_gist.int4_dist(pg_catalog.int4,pg_catalog.int4)": int4_dist,
    "routine:$extension:btree_gist.int8_dist(pg_catalog.int8,pg_catalog.int8)": int8_dist,
    "routine:$extension:btree_gist.interval_dist(pg_catalog.interval,pg_catalog.interval)": interval_dist,
    "routine:$extension:btree_gist.oid_dist(pg_catalog.oid,pg_catalog.oid)": oid_dist,
    "routine:$extension:btree_gist.time_dist(pg_catalog.time,pg_catalog.time)": time_dist,
    "routine:$extension:btree_gist.ts_dist(pg_catalog.timestamp,pg_catalog.timestamp)": ts_dist,
    "routine:$extension:btree_gist.tstz_dist(pg_catalog.timestamptz,pg_catalog.timestamptz)": tstz_dist,
    "operator:$extension:btree_gist.<->(pg_catalog.date,pg_catalog.date)": dateDistance,
    "operator:$extension:btree_gist.<->(pg_catalog.float4,pg_catalog.float4)": float4Distance,
    "operator:$extension:btree_gist.<->(pg_catalog.float8,pg_catalog.float8)": float8Distance,
    "operator:$extension:btree_gist.<->(pg_catalog.int2,pg_catalog.int2)": int2Distance,
    "operator:$extension:btree_gist.<->(pg_catalog.int4,pg_catalog.int4)": int4Distance,
    "operator:$extension:btree_gist.<->(pg_catalog.int8,pg_catalog.int8)": int8Distance,
    "operator:$extension:btree_gist.<->(pg_catalog.interval,pg_catalog.interval)": intervalDistance,
    "operator:$extension:btree_gist.<->(pg_catalog.money,pg_catalog.money)": moneyDistance,
    "operator:$extension:btree_gist.<->(pg_catalog.oid,pg_catalog.oid)": oidDistance,
    "operator:$extension:btree_gist.<->(pg_catalog.time,pg_catalog.time)": timeDistance,
    "operator:$extension:btree_gist.<->(pg_catalog.timestamp,pg_catalog.timestamp)": timestampDistance,
    "operator:$extension:btree_gist.<->(pg_catalog.timestamptz,pg_catalog.timestamptz)": timestamptzDistance,
  });
  function index<const Opclass extends string, const Input extends string>(opclass: Opclass, type: Input) {
    return Object.freeze({
      name: "btree_gist",
      version: "1.8",
      schema: placement,
      digest,
      member: `opclass:$extension:btree_gist.${opclass}/gist`,
      method: "gist",
      opclass,
      type,
      default: true,
      input: Object.freeze({ schema: "pg_catalog", type, dimensions: 0 }),
    }) satisfies ExtensionIndexContract;
  }
  return bindExtension(descriptor, {
    distance: distances,
    sql: Object.freeze({ functions, operators, overloads }),
    indexes: Object.freeze({
      bit: () => index("gist_bit_ops", "bit"),
      bool: () => index("gist_bool_ops", "bool"),
      bpchar: () => index("gist_bpchar_ops", "bpchar"),
      bytea: () => index("gist_bytea_ops", "bytea"),
      cidr: () => index("gist_cidr_ops", "cidr"),
      date: () => index("gist_date_ops", "date"),
      enum: () => index("gist_enum_ops", "anyenum"),
      float4: () => index("gist_float4_ops", "float4"),
      float8: () => index("gist_float8_ops", "float8"),
      inet: () => index("gist_inet_ops", "inet"),
      int2: () => index("gist_int2_ops", "int2"),
      int4: () => index("gist_int4_ops", "int4"),
      int8: () => index("gist_int8_ops", "int8"),
      interval: () => index("gist_interval_ops", "interval"),
      macaddr: () => index("gist_macaddr_ops", "macaddr"),
      macaddr8: () => index("gist_macaddr8_ops", "macaddr8"),
      money: () => index("gist_cash_ops", "money"),
      numeric: () => index("gist_numeric_ops", "numeric"),
      oid: () => index("gist_oid_ops", "oid"),
      text: () => index("gist_text_ops", "text"),
      time: () => index("gist_time_ops", "time"),
      timestamp: () => index("gist_timestamp_ops", "timestamp"),
      timestamptz: () => index("gist_timestamptz_ops", "timestamptz"),
      timetz: () => index("gist_timetz_ops", "timetz"),
      uuid: () => index("gist_uuid_ops", "uuid"),
      varbit: () => index("gist_vbit_ops", "varbit"),
    }),
  });
}
