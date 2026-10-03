import { sql, type SQL } from "drizzle-orm";
import { bytea, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";

const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: "pgp",
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const inputs = pgTable("pgp_inputs", {
  bytes: bytea(),
  text: text(),
  number: integer(),
  json: jsonb().$type<{ hex: string }>(),
});
const bytes = { hex: "00ff" };
const binary = [
  extension.sql.functions["pgp_sym_encrypt(text,text)"](inputs.text, "p"),
  extension.sql.functions["pgp_sym_encrypt(text,text,text)"](null, null, null),
  extension.sql.functions["pgp_sym_encrypt_bytea(bytea,text)"](inputs.bytes, inputs.text),
  extension.sql.functions["pgp_sym_encrypt_bytea(bytea,text,text)"](bytes, "p", ""),
  extension.sql.functions["pgp_sym_decrypt_bytea(bytea,text)"](bytes, "p"),
  extension.sql.functions["pgp_sym_decrypt_bytea(bytea,text,text)"](inputs.bytes, "p", ""),
  extension.sql.functions["pgp_pub_encrypt(text,bytea)"](inputs.text, inputs.bytes),
  extension.sql.functions["pgp_pub_encrypt(text,bytea,text)"]("café", bytes, ""),
  extension.sql.functions["pgp_pub_encrypt_bytea(bytea,bytea)"](bytes, bytes),
  extension.sql.functions["pgp_pub_encrypt_bytea(bytea,bytea,text)"](null, null, null),
  extension.sql.functions["pgp_pub_decrypt_bytea(bytea,bytea)"](bytes, bytes),
  extension.sql.functions["pgp_pub_decrypt_bytea(bytea,bytea,text)"](bytes, bytes, "p"),
  extension.sql.functions["pgp_pub_decrypt_bytea(bytea,bytea,text,text)"](bytes, bytes, "p", ""),
] as const;
const strings = [
  extension.sql.functions["pgp_sym_decrypt(bytea,text)"](bytes, "p"),
  extension.sql.functions["pgp_sym_decrypt(bytea,text,text)"](bytes, "p", ""),
  extension.sql.functions["pgp_pub_decrypt(bytea,bytea)"](bytes, bytes),
  extension.sql.functions["pgp_pub_decrypt(bytea,bytea,text)"](bytes, bytes, "p"),
  extension.sql.functions["pgp_pub_decrypt(bytea,bytea,text,text)"](bytes, bytes, "p", ""),
] as const;
extension.pgpSymEncrypt(inputs.text, "p");
extension.pgpSymEncrypt(sql<string | null>`null`.as("text"), null, null);
extension.pgpSymEncryptBytea(inputs.bytes, inputs.text, "");
extension.pgpSymDecrypt(inputs.bytes, "p", "");
extension.pgpSymDecryptBytea(sql<{ hex: string } | null>`null`.as("bytes"), "p");
extension.pgpPubEncrypt("text", inputs.bytes, "");
extension.pgpPubEncryptBytea(bytes, inputs.bytes);
extension.pgpPubDecrypt(inputs.bytes, inputs.bytes, "password", "options");
extension.pgpPubDecryptBytea(bytes, null, null);
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2 ? true : false;
type Assert<Condition extends true> = Condition;
type Result<Expression> = Expression extends SQL<infer Value> ? Value : never;
export type PgpResultsAreExact = [
  Assert<Equal<Result<(typeof binary)[number]>, { hex: string } | null>>,
  Assert<Equal<Result<(typeof strings)[number]>, string | null>>,
  Assert<Equal<Result<ReturnType<typeof extension.pgpSymEncrypt>>, { hex: string } | null>>,
  Assert<Equal<Result<ReturnType<typeof extension.pgpSymEncryptBytea>>, { hex: string } | null>>,
  Assert<Equal<Result<ReturnType<typeof extension.pgpSymDecrypt>>, string | null>>,
  Assert<Equal<Result<ReturnType<typeof extension.pgpSymDecryptBytea>>, { hex: string } | null>>,
  Assert<Equal<Result<ReturnType<typeof extension.pgpPubEncrypt>>, { hex: string } | null>>,
  Assert<Equal<Result<ReturnType<typeof extension.pgpPubEncryptBytea>>, { hex: string } | null>>,
  Assert<Equal<Result<ReturnType<typeof extension.pgpPubDecrypt>>, string | null>>,
  Assert<Equal<Result<ReturnType<typeof extension.pgpPubDecryptBytea>>, { hex: string } | null>>,
];
// @ts-expect-error Text plaintext is not bytea.
extension.pgpSymEncryptBytea("text", "p");
// @ts-expect-error Bytea plaintext is not text.
extension.pgpSymEncrypt(bytes, "p");
// @ts-expect-error Public keys are bytea.
extension.pgpPubEncrypt("text", "key");
// @ts-expect-error Secret keys are bytea.
extension.pgpPubDecrypt(bytes, "key");
// @ts-expect-error JSON structure does not establish bytea storage.
extension.pgpPubDecrypt(inputs.json, bytes);
// @ts-expect-error Numeric columns are not passphrases.
extension.pgpSymDecrypt(bytes, inputs.number);
// @ts-expect-error Arbitrary Buffer inputs are not the binary wire contract.
extension.pgpPubEncryptBytea(Buffer.from([0]), bytes);
// @ts-expect-error Undefined differs from omitted options.
extension.pgpSymEncrypt("x", "p", undefined);
// @ts-expect-error Undefined differs from explicit SQL NULL password.
extension.pgpPubDecrypt(bytes, bytes, undefined, "");
// @ts-expect-error Missing password does not make a fourth options slot legal.
extension.pgpPubDecrypt(bytes, bytes, "", undefined);
// @ts-expect-error Native public decrypt has at most four arguments.
extension.pgpPubDecrypt(bytes, bytes, "", "", "");
// @ts-expect-error Native symmetric decrypt has at most three arguments.
extension.pgpSymDecrypt(bytes, "", "", "");
// @ts-expect-error A canonical two-argument member cannot accept options.
extension.sql.functions["pgp_sym_encrypt(text,text)"]("x", "p", "");
// @ts-expect-error A canonical four-argument member requires the password and options slots.
extension.sql.functions["pgp_pub_decrypt(bytea,bytea,text,text)"](bytes, bytes, "");
// @ts-expect-error No user-selected generic return cast exists.
extension.pgpSymDecrypt<number>(bytes, "p");
