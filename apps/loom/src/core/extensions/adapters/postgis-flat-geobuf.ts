import { Column, is, SQL, sql } from "drizzle-orm";
import { binaryCodec, type CodecInput, type CodecOutput, type ExtensionCodec } from "../codecs";
import type { ExtensionSqlInput } from "../sql";

type FlatGeobufInput = ExtensionSqlInput<
  ExtensionCodec<CodecInput<typeof binaryCodec> | null, CodecOutput<typeof binaryCodec> | null>
>;

/** PostGIS 3.6.4 reads FlatGeobuf bytea without PG_ARGISNULL; never pass SQL NULL to that native reader. */
export function postgisFlatGeobufBytes(
  value: FlatGeobufInput,
  routine: "ST_FromFlatGeobuf" | "ST_FromFlatGeobufToTable",
): FlatGeobufInput {
  const rejection = `PostGIS 3.6.4 ${routine} rejects NULL bytea`;
  if (value === null) throw new Error(rejection);
  if (is(value, SQL) || is(value, SQL.Aliased) || is(value, Column)) {
    const expression =
      is(value, SQL.Aliased) && !("isSelectionField" in value && value.isSelectionField === true) ? value.sql : value;
    // encode/decode preserves every non-NULL byte, evaluates the input once, and rejects NULL with 22023.
    // Keep the rejection inside coalesce: a constant failing CASE branch can be evaluated during planning.
    return sql<CodecOutput<
      typeof binaryCodec
    > | null>`"pg_catalog"."decode"(coalesce("pg_catalog"."encode"(${expression}::"pg_catalog"."bytea", 'hex'), ${rejection}), 'hex')`;
  }
  return value;
}
