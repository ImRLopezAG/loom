import { sql, type SQL } from "drizzle-orm";
import { bytea, integer, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";

const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: "custom",
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const table = pgTable("hash_inputs", {
  data: bytea(),
  key: bytea().notNull(),
  value: text(),
  algorithm: text(),
  json: jsonb().$type<{ hex: string }>(),
  number: integer(),
  id: uuid(),
});
const value: SQL<{ hex: string } | null> = extension.digest(table.data, table.algorithm, "bytea");
const textValue: SQL<{ hex: string } | null> = extension.digest(table.value, "sha256", "text");
extension.hmac(table.data, table.key, "sha1", "bytea");
extension.hmac(table.value, "public test key", table.algorithm, "text");
extension.digest(sql<string>`'abc'`.as("value"), null, "text");
extension.digest(sql<{ hex: string }>`'\\x616263'::bytea`.as("value"), "sha256", "bytea");
extension.sql.functions["digest(bytea,text)"](null, null);
extension.sql.functions["digest(text,text)"](null, null);
extension.sql.functions["hmac(bytea,bytea,text)"]({ hex: "00ff" }, null, "sha1");
extension.sql.functions["hmac(text,text,text)"]("Jefe", "what do ya want for nothing?", "sha1");
// @ts-expect-error All direct calls require a representation selector.
extension.digest("abc", "sha256");
// @ts-expect-error Text and binary HMAC inputs cannot mix.
extension.hmac(table.value, table.key, "sha1", "text");
// @ts-expect-error Bytea HMAC does not admit a text key.
extension.hmac(table.data, table.value, "sha1", "bytea");
// @ts-expect-error JSON storage is not native bytea even when its JS shape is hex.
extension.digest(table.json, "sha256", "bytea");
// @ts-expect-error The bytea representation rejects text columns.
extension.digest(table.value, "sha256", "bytea");
// @ts-expect-error The text representation rejects bytea columns.
extension.digest(table.data, "sha256", "text");
// @ts-expect-error Hash data rejects integer columns.
extension.digest(table.number, "sha256", "text");
// @ts-expect-error Hash data rejects UUID storage without explicit conversion.
extension.digest(table.id, "sha256", "text");
// @ts-expect-error Algorithms are text, not binary data.
extension.digest("abc", table.data, "text");
// @ts-expect-error Literal binary input is a checked hex object, not Buffer.
extension.digest(Buffer.from("abc"), "sha256", "bytea");
// @ts-expect-error Wrong literal representation.
extension.digest("abc", "sha256", "bytea");
// @ts-expect-error SQL NULL is explicit; undefined is not an argument omission.
extension.digest(undefined, "sha256", "text");
// @ts-expect-error The native signature has two SQL arguments.
extension.sql.functions["digest(text,text)"]("abc");
// @ts-expect-error Canonical HMAC enforces matching native text inputs.
extension.sql.functions["hmac(text,text,text)"]("abc", { hex: "00ff" }, "sha1");
// @ts-expect-error Result codec is fixed and cannot be chosen by the caller.
extension.digest<number>("abc", "sha256", "text");
const incompatible = {
  name: "pgcrypto",
  version: "1.3",
  schema: "custom",
  apiSupport: { status: "verified" },
} as const;
// @ts-expect-error The internal adapter binds the exact captured version.
createPgcrypto_1_4(incompatible);
const wrongName = { name: "pg_crypto", version: "1.4", schema: "custom", apiSupport: { status: "verified" } } as const;
// @ts-expect-error Native extension identity is exact.
createPgcrypto_1_4(wrongName);
const version: "1.4" = extension.version;
const schema: "custom" = extension.schema;
void [value, textValue, version, schema];
