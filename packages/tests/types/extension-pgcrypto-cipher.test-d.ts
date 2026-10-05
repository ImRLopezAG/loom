import { sql, type SQL } from "drizzle-orm";
import { bytea, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";

const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: "custom",
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const table = pgTable("cipher_inputs", {
  data: bytea(),
  key: bytea(),
  iv: bytea(),
  algorithm: text(),
  json: jsonb().$type<{ hex: string }>(),
  number: integer(),
});
const encrypted: SQL<{ hex: string } | null> = extension.encrypt(table.data, table.key, table.algorithm);
const decrypted: SQL<{ hex: string } | null> = extension.decrypt(table.data, table.key, "aes");
const withIv: SQL<{ hex: string } | null> = extension.encryptWithIv(table.data, table.key, table.iv, "aes");
const decryptedWithIv: SQL<{ hex: string } | null> = extension.decryptWithIv(table.data, table.key, table.iv, "aes");
extension.sql.functions["encrypt(bytea,bytea,text)"](null, null, null);
extension.sql.functions["decrypt(bytea,bytea,text)"](null, null, null);
extension.sql.functions["encrypt_iv(bytea,bytea,bytea,text)"](null, null, null, null);
extension.sql.functions["decrypt_iv(bytea,bytea,bytea,text)"](null, null, null, null);
extension.encrypt(sql<{ hex: string }>`'\\x00'::bytea`.as("data"), { hex: "00" }, sql<string>`'aes'`.as("algorithm"));
// @ts-expect-error Native binary data does not admit text literals.
extension.encrypt("message", { hex: "00" }, "aes");
// @ts-expect-error Native keys are binary, not text columns.
extension.decrypt(table.data, table.algorithm, "aes");
// @ts-expect-error JSON columns are not native binary storage.
extension.encrypt(table.json, table.key, "aes");
// @ts-expect-error IV values cannot use text storage.
extension.encryptWithIv(table.data, table.key, table.algorithm, "aes");
// @ts-expect-error Integer columns are not binary.
extension.decryptWithIv(table.number, table.key, table.iv, "aes");
// @ts-expect-error Algorithm names are native text, not binary.
extension.encrypt(table.data, table.key, table.iv);
// @ts-expect-error Literal binary inputs are checked hex objects, not Buffer.
extension.encrypt(Buffer.from("message"), { hex: "00" }, "aes");
// @ts-expect-error SQL NULL is explicit; undefined is not a native argument.
extension.encrypt(undefined, table.key, "aes");
// @ts-expect-error Missing IV does not select the no-IV native member.
extension.encryptWithIv(table.data, table.key, "aes");
// @ts-expect-error All canonical native arguments are required.
extension.sql.functions["decrypt_iv(bytea,bytea,bytea,text)"](table.data, table.key, table.iv);
// @ts-expect-error The no-IV native signature has exactly three arguments.
extension.decrypt(table.data, table.key, "aes", table.iv);
// @ts-expect-error Returned values come from the binary codec, not a caller generic.
extension.encrypt<string>(table.data, table.key, "aes");
// @ts-expect-error Strict native functions retain nullable output.
const nonnullable: SQL<{ hex: string }> = extension.decryptWithIv(table.data, table.key, table.iv, "aes");
void [encrypted, decrypted, withIv, decryptedWithIv, nonnullable];
