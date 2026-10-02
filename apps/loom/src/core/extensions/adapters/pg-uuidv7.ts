import type { SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { booleanCodec, nullableCodec, type ExtensionCodec } from "../codecs";
import { uuidCodec } from "../native-uuid-codec";
import { timestampCodec, timestamptzCodec } from "../native-timestamp-codecs";
import { createSqlFunction, defaultSqlArgument } from "../sql";

type UuidInput =
  | string
  | null
  | SQL<string | null>
  | SQL.Aliased<string | null>
  | AnyPgColumn<{ dataType: "string uuid"; data: string }>;

/** UUIDv7 carries milliseconds, not full timestamp precision; conversion wraps native values into 48 bits. */
export function createPgUuidv7_1_6<
  const Descriptor extends ExtensionDescriptor<"pg_uuidv7", { version: "1.6"; schema: string }>,
>(descriptor: Descriptor) {
  const base = { schema: descriptor.schema, dependencies: [], authority: "query" } as const;
  const v7 = createSqlFunction({
    ...base,
    name: "uuid_generate_v7",
    member: "routine:$extension:pg_uuidv7.uuid_generate_v7()",
    arguments: [] as const,
    result: uuidCodec,
    observability: "external",
  });
  function conversion<Input, Output>(
    name: "uuid_timestamp_to_v7" | "uuid_timestamptz_to_v7",
    codec: ExtensionCodec<Input, Output>,
  ) {
    const definition = {
      ...base,
      name,
      member: `routine:$extension:pg_uuidv7.${name}(pg_catalog.${codec.sqlType!.name},pg_catalog.bool)`,
      arguments: [nullableCodec(codec), defaultSqlArgument(nullableCodec(booleanCodec), "zero")] as const,
      result: nullableCodec(uuidCodec),
    };
    const deterministic = createSqlFunction({ ...definition, observability: "tables" });
    const random = createSqlFunction({ ...definition, observability: "external" });
    // The catalogue marks both routines STABLE, but zero=false/default/dynamic SQL can call pg_strong_random.
    return (value: Parameters<typeof random>[0], zero?: Parameters<typeof random>[1]) =>
      (zero === true ? deterministic : random)(value, zero);
  }
  /** Civil calendar interpreted as native timestamp, with integer-millisecond truncation and unsigned 48-bit wrap. */
  const fromTimestamp = conversion("uuid_timestamp_to_v7", timestampCodec);
  /** Uses the normalized instant; explicit literal zero=true removes random bits and permits automatic live evaluation. */
  const fromTimestamptz = conversion("uuid_timestamptz_to_v7", timestamptzCodec);
  const extractTimestamp = createSqlFunction({
    ...base,
    name: "uuid_v7_to_timestamp",
    member: "routine:$extension:pg_uuidv7.uuid_v7_to_timestamp(pg_catalog.uuid)",
    arguments: [nullableCodec(uuidCodec)] as const,
    result: nullableCodec(timestampCodec),
    observability: "tables",
  });
  const extractTimestamptz = createSqlFunction({
    ...base,
    name: "uuid_v7_to_timestamptz",
    member: "routine:$extension:pg_uuidv7.uuid_v7_to_timestamptz(pg_catalog.uuid)",
    arguments: [nullableCodec(uuidCodec)] as const,
    result: nullableCodec(timestamptzCodec),
    observability: "tables",
  });
  /** Reads the first 48 bits of any native UUID; the extension does not validate UUID version or variant. */
  const toTimestamp = (value: UuidInput) => extractTimestamp(value);
  /** Reads milliseconds as an instant; exact tagged output requires the native codec's ISO DateStyle prerequisite. */
  const toTimestamptz = (value: UuidInput) => extractTimestamptz(value);
  const functions = Object.freeze({
    uuid_generate_v7: v7,
    uuid_timestamp_to_v7: fromTimestamp,
    uuid_timestamptz_to_v7: fromTimestamptz,
    uuid_v7_to_timestamp: toTimestamp,
    uuid_v7_to_timestamptz: toTimestamptz,
  });
  return bindExtension(descriptor, {
    v7,
    fromTimestamp,
    fromTimestamptz,
    toTimestamp,
    toTimestamptz,
    sql: Object.freeze({ functions, operators: Object.freeze({}) }),
  });
}
