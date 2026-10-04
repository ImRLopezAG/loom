import * as v from "valibot";
import { sql, is, SQL, type SQLWrapper } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  binaryCodec,
  booleanCodec,
  createExtensionCodec,
  decodeFailure,
  nullableCodec,
  type CodecInput,
  type ExtensionCodec,
  type PostgreSqlArray,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { uuidCodec } from "../native-uuid-codec";
import { timestampCodec, timestamptzCodec } from "../native-timestamp-codecs";
import { createExtensionField, createExtensionIndex, type ExtensionValueSchema } from "../fields";
import {
  checkedExtensionExpression,
  createSqlFunction,
  createSqlOperator,
  extensionSqlType,
  type ExtensionSqlInput,
} from "../sql";
import { createUlidArrayCodec, createUlidCodec, ulid, type Ulid } from "./pgx-ulid-codecs";
export { ulid } from "./pgx-ulid-codecs";
export type { Ulid } from "./pgx-ulid-codecs";
export type { PostgreSqlArray } from "../codecs";
const digest = "e2e491782b819b700106736a81ffa9922f24226e1d18ec02ce90931dcef0a60d";
const sqlWrapper = v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value));
const type = "$extension:pgx_ulid.ulid";
const pair = `${type},${type}`;
// The native UUID codec decodes plain strings, so column inputs are narrowed to actual UUID storage.
type UuidInput =
  | string
  | null
  | SQL<string | null>
  | SQL.Aliased<string | null>
  | AnyPgColumn<{ dataType: "string uuid"; data: string }>;
type Descriptor = ExtensionDescriptor<"pgx_ulid", { readonly version: "0.2.2"; readonly schema: string }>;
/**
 * Exact pgx_ulid 0.2.2 surface. Values travel as canonical text; the pgrx binary receiver is never used.
 * Generators read the native clock and randomness; gen_monotonic_ulid additionally requires the pgx_ulid
 * shared preload library for its shared-memory state.
 */
export function createPgxUlid_0_2_2<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "pgx_ulid" ||
    descriptor.version !== "0.2.2" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("pgx_ulid 0.2.2 requires its exact verified contract");
  const codec = createUlidCodec(descriptor.schema);
  const fullArray = createUlidArrayCodec(descriptor.schema);
  const u = nullableCodec(codec),
    bool = nullableCodec(booleanCodec),
    int4 = nullableCodec(int4Codec),
    bytes = nullableCodec(binaryCodec),
    uuid = nullableCodec(uuidCodec),
    civil = nullableCodec(timestampCodec),
    instant = nullableCodec(timestamptzCodec);
  const base = { schema: descriptor.schema, dependencies: [], authority: "query" } as const;
  const tables = { ...base, observability: "tables" } as const;
  const gen_ulid = createSqlFunction({
    ...base,
    name: "gen_ulid",
    member: "routine:$extension:pgx_ulid.gen_ulid()",
    arguments: [] as const,
    result: codec,
    observability: "external",
  });
  /** Monotonic within one millisecond across backends; requires shared_preload_libraries to include pgx_ulid. */
  const gen_monotonic_ulid = createSqlFunction({
    ...base,
    name: "gen_monotonic_ulid",
    member: "routine:$extension:pgx_ulid.gen_monotonic_ulid()",
    arguments: [] as const,
    result: codec,
    observability: "external",
  });
  /** Float epoch milliseconds, truncated; pre-1970 saturates to zero and values wrap to 48 bits. Randomness is zero. */
  const timestamp_to_ulid = createSqlFunction({
    ...tables,
    name: "timestamp_to_ulid",
    member: "routine:$extension:pgx_ulid.timestamp_to_ulid(pg_catalog.timestamp)",
    arguments: [civil] as const,
    result: u,
  });
  const timestamptz_to_ulid = createSqlFunction({
    ...tables,
    name: "timestamptz_to_ulid",
    member: "routine:$extension:pgx_ulid.timestamptz_to_ulid(pg_catalog.timestamptz)",
    arguments: [instant] as const,
    result: u,
  });
  const fromUuidCall = createSqlFunction({
    ...tables,
    name: "ulid_from_uuid",
    member: "routine:$extension:pgx_ulid.ulid_from_uuid(pg_catalog.uuid)",
    arguments: [uuid] as const,
    result: u,
  });
  /** Reinterprets the sixteen big-endian UUID bytes; nil, maximum and non-RFC bit patterns are all valid. */
  const ulid_from_uuid = (value: UuidInput) => fromUuidCall(value);
  /** Converts the millisecond instant through timestamptz_timestamp, so the session TimeZone selects the civil value. */
  const ulid_to_timestamp = createSqlFunction({
    ...base,
    name: "ulid_to_timestamp",
    member: `routine:$extension:pgx_ulid.ulid_to_timestamp(${type})`,
    arguments: [u] as const,
    result: civil,
    observability: "session",
  });
  const ulid_to_timestamptz = createSqlFunction({
    ...tables,
    name: "ulid_to_timestamptz",
    member: `routine:$extension:pgx_ulid.ulid_to_timestamptz(${type})`,
    arguments: [u] as const,
    result: instant,
  });
  const ulid_to_uuid = createSqlFunction({
    ...tables,
    name: "ulid_to_uuid",
    member: `routine:$extension:pgx_ulid.ulid_to_uuid(${type})`,
    arguments: [u] as const,
    result: uuid,
  });
  /** Sixteen big-endian bytes, matching the UUID byte order. */
  const ulid_to_bytea = createSqlFunction({
    ...tables,
    name: "ulid_to_bytea",
    member: `routine:$extension:pgx_ulid.ulid_to_bytea(${type})`,
    arguments: [u] as const,
    result: bytes,
  });
  /** pgrx send output: the sixteen native-endian (little-endian on Neon hosts) bytes, the reverse of ulid_to_bytea. */
  const ulid_send = createSqlFunction({
    ...tables,
    name: "ulid_send",
    member: `routine:$extension:pgx_ulid.ulid_send(${type})`,
    arguments: [u] as const,
    result: bytes,
  });
  const ulid_cmp = createSqlFunction({
    ...tables,
    name: "ulid_cmp",
    member: `routine:$extension:pgx_ulid.ulid_cmp(${pair})`,
    arguments: [u, u] as const,
    result: int4,
  });
  const ulid_hash = createSqlFunction({
    ...tables,
    name: "ulid_hash",
    member: `routine:$extension:pgx_ulid.ulid_hash(${type})`,
    arguments: [u] as const,
    result: int4,
  });
  function predicate(name: "ulid_eq" | "ulid_ne" | "ulid_lt" | "ulid_le" | "ulid_gt" | "ulid_ge") {
    return createSqlFunction({
      ...tables,
      name,
      member: `routine:$extension:pgx_ulid.${name}(${pair})`,
      arguments: [u, u] as const,
      result: bool,
    });
  }
  const functions = Object.freeze({
    gen_ulid,
    gen_monotonic_ulid,
    timestamp_to_ulid,
    timestamptz_to_ulid,
    ulid_from_uuid,
    ulid_to_timestamp,
    ulid_to_timestamptz,
    ulid_to_uuid,
    ulid_to_bytea,
    ulid_send,
    ulid_cmp,
    ulid_hash,
    ulid_eq: predicate("ulid_eq"),
    ulid_ne: predicate("ulid_ne"),
    ulid_lt: predicate("ulid_lt"),
    ulid_le: predicate("ulid_le"),
    ulid_gt: predicate("ulid_gt"),
    ulid_ge: predicate("ulid_ge"),
  });
  function operator(name: "=" | "<>" | "<" | "<=" | ">" | ">=") {
    return createSqlOperator({
      ...tables,
      name,
      member: `operator:$extension:pgx_ulid.${name}(${pair})`,
      left: u,
      right: u,
      result: bool,
    });
  }
  const operators = Object.freeze({
    "=": operator("="),
    "<>": operator("<>"),
    "<": operator("<"),
    "<=": operator("<="),
    ">": operator(">"),
    ">=": operator(">="),
  });
  function cast<Input, Source, TargetInput, Target>(
    source: ExtensionCodec<Input, Source>,
    target: ExtensionCodec<TargetInput, Target>,
    member: string,
    observability: "tables" | "session" = "tables",
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
        member,
        observability,
      );
    };
  }
  const uuidToUlid = cast(uuid, u, `cast:pg_catalog.uuid->${type}`);
  const casts = Object.freeze({
    ulid_to_bytea: cast(u, bytes, `cast:${type}->pg_catalog.bytea`),
    ulid_to_timestamp: cast(u, civil, `cast:${type}->pg_catalog.timestamp`, "session"),
    ulid_to_timestamptz: cast(u, instant, `cast:${type}->pg_catalog.timestamptz`),
    ulid_to_uuid: cast(u, uuid, `cast:${type}->pg_catalog.uuid`),
    timestamp_to_ulid: cast(civil, u, `cast:pg_catalog.timestamp->${type}`),
    timestamptz_to_ulid: cast(instant, u, `cast:pg_catalog.timestamptz->${type}`),
    uuid_to_ulid: (value: UuidInput) => uuidToUlid(value),
  });
  const overloads = Object.freeze({
    [`cast:${type}->pg_catalog.bytea`]: casts.ulid_to_bytea,
    [`cast:${type}->pg_catalog.timestamp`]: casts.ulid_to_timestamp,
    [`cast:${type}->pg_catalog.timestamptz`]: casts.ulid_to_timestamptz,
    [`cast:${type}->pg_catalog.uuid`]: casts.ulid_to_uuid,
    [`cast:pg_catalog.timestamp->${type}`]: casts.timestamp_to_ulid,
    [`cast:pg_catalog.timestamptz->${type}`]: casts.timestamptz_to_ulid,
    [`cast:pg_catalog.uuid->${type}`]: casts.uuid_to_ulid,
    [`operator:$extension:pgx_ulid.<(${pair})`]: operators["<"],
    [`operator:$extension:pgx_ulid.<=(${pair})`]: operators["<="],
    [`operator:$extension:pgx_ulid.<>(${pair})`]: operators["<>"],
    [`operator:$extension:pgx_ulid.=(${pair})`]: operators["="],
    [`operator:$extension:pgx_ulid.>(${pair})`]: operators[">"],
    [`operator:$extension:pgx_ulid.>=(${pair})`]: operators[">="],
    "routine:$extension:pgx_ulid.gen_monotonic_ulid()": functions.gen_monotonic_ulid,
    "routine:$extension:pgx_ulid.gen_ulid()": functions.gen_ulid,
    "routine:$extension:pgx_ulid.timestamp_to_ulid(pg_catalog.timestamp)": functions.timestamp_to_ulid,
    "routine:$extension:pgx_ulid.timestamptz_to_ulid(pg_catalog.timestamptz)": functions.timestamptz_to_ulid,
    [`routine:$extension:pgx_ulid.ulid_cmp(${pair})`]: functions.ulid_cmp,
    [`routine:$extension:pgx_ulid.ulid_eq(${pair})`]: functions.ulid_eq,
    "routine:$extension:pgx_ulid.ulid_from_uuid(pg_catalog.uuid)": functions.ulid_from_uuid,
    [`routine:$extension:pgx_ulid.ulid_ge(${pair})`]: functions.ulid_ge,
    [`routine:$extension:pgx_ulid.ulid_gt(${pair})`]: functions.ulid_gt,
    [`routine:$extension:pgx_ulid.ulid_hash(${type})`]: functions.ulid_hash,
    [`routine:$extension:pgx_ulid.ulid_le(${pair})`]: functions.ulid_le,
    [`routine:$extension:pgx_ulid.ulid_lt(${pair})`]: functions.ulid_lt,
    [`routine:$extension:pgx_ulid.ulid_ne(${pair})`]: functions.ulid_ne,
    [`routine:$extension:pgx_ulid.ulid_send(${type})`]: functions.ulid_send,
    [`routine:$extension:pgx_ulid.ulid_to_bytea(${type})`]: functions.ulid_to_bytea,
    [`routine:$extension:pgx_ulid.ulid_to_timestamp(${type})`]: functions.ulid_to_timestamp,
    [`routine:$extension:pgx_ulid.ulid_to_timestamptz(${type})`]: functions.ulid_to_timestamptz,
    [`routine:$extension:pgx_ulid.ulid_to_uuid(${type})`]: functions.ulid_to_uuid,
  });
  const scalarFieldCodec = createExtensionCodec({
    id: codec.id,
    sqlType: codec.sqlType!,
    input: v.pipe(v.string(), v.brand("Ulid")),
    output: v.pipe(v.string(), v.brand("Ulid")),
    transport: "text",
    encode: (text) => codec.encode(text),
    decode: (text) => codec.decode(text),
  });
  function fieldOperator(name: "=" | "<>" | "<" | "<=" | ">" | ">=") {
    return {
      member: `operator:$extension:pgx_ulid.${name}(${pair})`,
      schema: descriptor.schema,
      name,
      operand: "field" as const,
    };
  }
  const fieldOperators = Object.freeze({
    eq: fieldOperator("="),
    ne: fieldOperator("<>"),
    gt: fieldOperator(">"),
    gte: fieldOperator(">="),
    lt: fieldOperator("<"),
    lte: fieldOperator("<="),
  });
  const field = () =>
    createExtensionField({
      extension: descriptor,
      member: `type:${type}`,
      type: "ulid",
      codec: scalarFieldCodec,
      value: { kind: "string" },
      // Canonical upper-case Crockford text sorts in the same order as the native unsigned 128-bit comparison.
      search: { filter: true, comparison: true, order: true, text: false } as const,
      operators: fieldOperators,
    });
  const fieldArrayCodec: ExtensionCodec<PostgreSqlArray<Ulid>, PostgreSqlArray<Ulid>> = fullArray;
  // PostgreSQL MAXDIM is six. The codec validates rectangularity and exact bounds; the portable schema retains each native depth.
  let nested: ExtensionValueSchema = { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] };
  const depths: ExtensionValueSchema[] = [];
  for (let dimension = 0; dimension < 6; dimension++) {
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
      member: "type:$extension:pgx_ulid._ulid",
      type: "ulid",
      array: true,
      codec: fieldArrayCodec,
      value: arrayValue,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const index = (method: "btree" | "hash") =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: `opclass:$extension:pgx_ulid.ulid_${method}_ops/${method}`,
        method,
        opclass: `ulid_${method}_ops`,
        type: "ulid",
        default: true,
      }),
      input: Object.freeze({ schema: descriptor.schema, type: "ulid", dimensions: 0 }),
    });
  return bindExtension(descriptor, {
    codec,
    arrayCodec: fullArray,
    value: ulid,
    field,
    arrayField,
    generate: functions.gen_ulid,
    generateMonotonic: functions.gen_monotonic_ulid,
    fromTimestamp: functions.timestamp_to_ulid,
    fromTimestamptz: functions.timestamptz_to_ulid,
    fromUuid: functions.ulid_from_uuid,
    toTimestamp: functions.ulid_to_timestamp,
    toTimestamptz: functions.ulid_to_timestamptz,
    toUuid: functions.ulid_to_uuid,
    toBytes: functions.ulid_to_bytea,
    send: functions.ulid_send,
    compare: functions.ulid_cmp,
    hash: functions.ulid_hash,
    equal: operators["="],
    notEqual: operators["<>"],
    lessThan: operators["<"],
    lessOrEqual: operators["<="],
    greaterThan: operators[">"],
    greaterOrEqual: operators[">="],
    sql: Object.freeze({ functions, operators, casts, overloads }),
    indexes: Object.freeze({
      btree: () => index("btree"),
      hash: () => index("hash"),
    }),
  });
}
