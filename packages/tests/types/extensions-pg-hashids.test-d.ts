import { sql, type SQL } from "drizzle-orm";
import { bigint, integer, pgTable, text } from "drizzle-orm/pg-core";
import {
  createPgHashids_1_2_1,
  PgHashidsNativeSafetyError,
} from "../../../apps/loom/src/core/extensions/adapters/pg-hashids";
import type { PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";

const table = pgTable("ids", {
  id: bigint({ mode: "bigint" }).notNull(),
  optional: bigint({ mode: "bigint" }),
  number: bigint({ mode: "number" }).notNull(),
  small: integer().notNull(),
  hash: text().notNull(),
});
const extension = createPgHashids_1_2_1({
  name: "pg_hashids",
  version: "1.2.1",
  schema: "custom",
  apiSupport: {
    status: "verified",
    digest: "56a138e83f06ff23344a428d6486237eb9c875db35df970ceb4bcb60240a4041",
  },
});
const version: "1.2.1" = extension.version;
const schema: "custom" = extension.schema;
const name: "pg_hashids" = extension.name;
const values = { dimensions: [{ lowerBound: 1, length: 2 }], values: [1n, 2n] } as const;
// These are declaration checks only; every invocation is safety-rejected before SQL at runtime.
const encoded: SQL<string> = extension.encode(table.id, "salt", 8, "0123456789abcdef");
const encodedArray: SQL<string> = extension.encodeArray(values, "salt");
const decoded: SQL<PostgreSqlArray<bigint>> = extension.decode("jR", "salt", 8);
const once: SQL<bigint> = extension.decodeOnce("jR");
const legacy: SQL<string> = extension.hashEncode(9223372036854775807n, "salt", 0);
const legacyDecoded: SQL<number> = extension.hashDecode("jR", "salt", 0);
// SQL<bigint> is a caller claim only; native NULL int8 still reads as 0.
extension.encode(sql<bigint>`1`);
extension.encode(once.as("once"));
extension.sql.functions.id_encode(values, "salt", 0, "0123456789abcdef");
extension.sql.functions.id_encode(1n);
// @ts-expect-error NULL int8 is read natively as 0, not preserved.
extension.encode(null);
// @ts-expect-error Nullable columns can carry SQL NULL into a non-STRICT routine.
extension.encode(table.optional);
// @ts-expect-error Number-mode columns have already lost int8 precision.
extension.encode(table.number);
// @ts-expect-error JavaScript numbers cannot carry exact int8 values.
extension.encode(1);
// @ts-expect-error int4 storage is not the captured int8 argument.
extension.encode(table.small);
// @ts-expect-error Explicit SQL<bigint | null> is a type-level hint only; SQL<bigint> cannot guarantee non-null either.
extension.encode(sql<bigint | null>`null`);
// @ts-expect-error Settings are validated literals, never SQL.
extension.encode(1n, sql<string>`'salt'`);
// @ts-expect-error Minimum length is an int4 literal.
extension.encode(1n, "salt", "8");
// @ts-expect-error A minimum length must precede the alphabet.
extension.encode(1n, "salt", "0123456789abcdef");
// @ts-expect-error Captured overloads accept at most four arguments.
extension.encode(1n, "salt", 0, "0123456789abcdef", "extra");
// @ts-expect-error Native arrays use exact PostgreSqlArray values.
extension.encodeArray([1n, 2n]);
// @ts-expect-error SQL arrays could be NULL, multidimensional or contain NULL elements.
extension.encodeArray(sql<PostgreSqlArray<bigint>>`'{1}'`);
// @ts-expect-error Hashes from SQL cannot be checked against the alphabet before native decode.
extension.decode(table.hash);
// @ts-expect-error Hashes from SQL cannot be checked against the alphabet before native decode.
extension.decodeOnce(sql<string>`'jR'`);
// @ts-expect-error Legacy hash_decode has only its three-argument overload.
extension.hashDecode("jR");
// @ts-expect-error Legacy hash_encode has no alphabet overload.
extension.hashEncode(1n, "salt", 0, "0123456789abcdef");
// @ts-expect-error Result identities are fixed by their codecs.
const wrong: SQL<number> = extension.decodeOnce("jR");
createPgHashids_1_2_1({
  name: "pg_hashids",
  // @ts-expect-error Exact captured extension version only.
  version: "1.2",
  schema: "custom",
  apiSupport: {
    status: "verified",
    digest: "56a138e83f06ff23344a428d6486237eb9c875db35df970ceb4bcb60240a4041",
  },
});
void [version, schema, name, encoded, encodedArray, decoded, once, legacy, legacyDecoded, wrong];
const refusal = new PgHashidsNativeSafetyError("routine:$extension:pg_hashids.id_encode(pg_catalog.int8)", "id_encode");
const code: "PG_HASHIDS_NATIVE_REPAIR_REQUIRED" = refusal.code;
const disposition: "safety-rejected" = refusal.disposition;
const nativeSymbol: "id_encode" | "id_encode_array" | "id_decode" | "id_decode_once" = refusal.nativeSymbol;
const refusalVersion: "1.2.1" = refusal.version;
// @ts-expect-error A new SQL name cannot pretend to be one of the four captured C symbols.
new PgHashidsNativeSafetyError("member", "hash_encode");
void [code, disposition, nativeSymbol, refusalVersion];
