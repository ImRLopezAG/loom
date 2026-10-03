import { createPgcrypto_1_4 } from "loom/extensions/pgcrypto";
import {
  createExtensionBindings,
  createProjectContext,
  createProjectProcedures,
  createProjectServices,
  defineSchema,
} from "loom/server";
import type { ProjectService } from "loom/server";
import { defineRelations, type SQL } from "drizzle-orm";
import { bytea, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { Effect } from "effect";

const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: 'crypto"public',
  apiSupport: {
    status: "verified",
    digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8",
  },
});
const selected = Object.freeze({ pgcrypto: extension });
const schema = defineSchema(() => ({}));
const relations = defineRelations(schema.tables);
const context = createProjectContext(schema, relations, selected);
const services = createProjectServices<typeof schema, typeof relations, typeof selected>(schema);
const extensionsEffect: Effect.Effect<
  typeof selected,
  never,
  ProjectService<"loom/Extensions", typeof selected>
> = services.Extensions;
const placement: 'crypto"public' = context.extensions.pgcrypto.schema;
const version: "1.4" = context.extensions.pgcrypto.version;
const table = pgTable("public_crypto", {
  bytes: bytea(),
  text: text(),
  count: integer(),
  json: jsonb().$type<{ hex: string }>(),
});
const bytes = { hex: "00ff" };
const hash: SQL<{ hex: string } | null> = context.extensions.pgcrypto.digest(table.text, "sha256", "text");
const cipher: SQL<{ hex: string } | null> = extension.encrypt(table.bytes, bytes, "aes");
const password: SQL<string | null> = extension.crypt(table.text, extension.genSalt("bf", 4));
const random: SQL<{ hex: string } | null> = extension.genRandomBytes(table.count);
const uuid: SQL<string> = extension.genRandomUuid();
const mode: SQL<boolean> = extension.fipsMode();
const armor: SQL<string | null> = extension.armor(bytes, ["Version"], ["fixture"]);
const raw: SQL<{ hex: string } | null> = extension.dearmor(armor);
const headers = extension.armorHeaders(armor, "headers");
const key: SQL<string | null> = extension.keyId(bytes);
const pgp: SQL<{ hex: string } | null> = extension.pgpSymEncrypt(table.text, "fixture", "");
const plaintext: SQL<string | null> = extension.pgpSymDecrypt(pgp, "fixture");
const canonical: SQL<{ hex: string } | null> = extension.sql.functions["digest(bytea,text)"](table.bytes, "sha256");
extension.sql.functions["pgp_pub_decrypt_bytea(bytea,bytea,text,text)"](bytes, bytes, null, "");
extension.pgpPubEncryptBytea(table.bytes, bytes);
extension.pgpPubDecrypt(bytes, bytes, "fixture", "");
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2 ? true : false;
type Assert<Condition extends true> = Condition;
export type PublicSurfaceIsExact = [
  Assert<Equal<keyof typeof selected, "pgcrypto">>,
  Assert<Equal<keyof typeof extension.sql.operators, never>>,
];
createProjectProcedures(schema, relations, selected).procedure.handler(({ context }) => {
  const result: SQL<{ hex: string } | null> = context.extensions.pgcrypto.hmac("x", "key", "sha256", "text");
  // @ts-expect-error RPC retains only the selected family.
  void context.extensions.pg_trgm;
  return result;
});
const empty: undefined = createProjectContext(schema, relations).extensions;
const absent: undefined = createExtensionBindings({ pgcrypto: undefined });
const unsupported = createExtensionBindings({ pgcrypto: { version: "1.3", schema: "extensions" } });
// @ts-expect-error Unsupported versions have descriptors, not invented helpers.
unsupported.pgcrypto.digest("x", "sha256", "text");
// @ts-expect-error JSON-shaped storage is not bytea.
extension.digest(table.json, "sha256", "bytea");
// @ts-expect-error Bytea and text HMAC arguments cannot mix.
extension.hmac(table.text, bytes, "sha256", "text");
// @ts-expect-error PGP public keys use checked bytea.
extension.pgpPubEncrypt("x", "key");
// @ts-expect-error Buffer is not the wire byte value.
extension.pgpSymEncryptBytea(Buffer.from([0]), "fixture");
// @ts-expect-error Undefined is not an explicit SQL NULL option.
extension.pgpSymEncrypt("x", "fixture", undefined);
// @ts-expect-error Canonical overload arity is fixed.
extension.sql.functions["pgp_sym_encrypt(text,text)"]("x", "fixture", "");
// @ts-expect-error Header arrays are text arrays.
extension.armor(bytes, [1], ["fixture"]);
// @ts-expect-error Native integer counts do not admit text storage.
extension.genRandomBytes(table.text);
// @ts-expect-error The returned codec cannot be replaced by a caller generic.
extension.pgpSymDecrypt<number>(bytes, "fixture");
void [
  extensionsEffect,
  placement,
  version,
  hash,
  cipher,
  password,
  random,
  uuid,
  mode,
  armor,
  raw,
  headers,
  key,
  pgp,
  plaintext,
  canonical,
  empty,
  absent,
];
