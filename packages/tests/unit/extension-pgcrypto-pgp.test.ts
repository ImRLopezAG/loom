import { expect, test } from "vite-plus/test";
import { sql, type SQL } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { bytea, pgTable, text } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";
import { requiresPgpAdmission } from "../../../apps/loom/src/core/extensions/pgcrypto-pgp-admission";
import {
  checkedExtensionExpression,
  checkCompiledExtensionQuery,
  extensionExpressionContract,
  extensionSqlDialect,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";
import { binaryCodec, textCodec } from "../../../apps/loom/src/core/extensions/codecs";

const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: 'pgp"functions',
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const dialect = extensionSqlDialect(nodePgCodecs);
const bytes = { hex: "00ff5c" };
const password = "'); select 'fixture passphrase'--";
const options = "cipher-algo=aes256,compress-algo=0";
const inputs = pgTable("pgp_inputs", { value: text(), bytes: bytea(), password: text(), options: text() });
const cases = [
  [
    "pgp_sym_encrypt(text,text)",
    extension.pgpSymEncrypt("café", password),
    extension.sql.functions["pgp_sym_encrypt(text,text)"]("café", password),
    ["café", password],
  ],
  [
    "pgp_sym_encrypt(text,text,text)",
    extension.pgpSymEncrypt("café", password, options),
    extension.sql.functions["pgp_sym_encrypt(text,text,text)"]("café", password, options),
    ["café", password, options],
  ],
  [
    "pgp_sym_encrypt_bytea(bytea,text)",
    extension.pgpSymEncryptBytea(bytes, password),
    extension.sql.functions["pgp_sym_encrypt_bytea(bytea,text)"](bytes, password),
    ["\\x00ff5c", password],
  ],
  [
    "pgp_sym_encrypt_bytea(bytea,text,text)",
    extension.pgpSymEncryptBytea(bytes, password, options),
    extension.sql.functions["pgp_sym_encrypt_bytea(bytea,text,text)"](bytes, password, options),
    ["\\x00ff5c", password, options],
  ],
  [
    "pgp_sym_decrypt(bytea,text)",
    extension.pgpSymDecrypt(bytes, password),
    extension.sql.functions["pgp_sym_decrypt(bytea,text)"](bytes, password),
    ["\\x00ff5c", password],
  ],
  [
    "pgp_sym_decrypt(bytea,text,text)",
    extension.pgpSymDecrypt(bytes, password, options),
    extension.sql.functions["pgp_sym_decrypt(bytea,text,text)"](bytes, password, options),
    ["\\x00ff5c", password, options],
  ],
  [
    "pgp_sym_decrypt_bytea(bytea,text)",
    extension.pgpSymDecryptBytea(bytes, password),
    extension.sql.functions["pgp_sym_decrypt_bytea(bytea,text)"](bytes, password),
    ["\\x00ff5c", password],
  ],
  [
    "pgp_sym_decrypt_bytea(bytea,text,text)",
    extension.pgpSymDecryptBytea(bytes, password, options),
    extension.sql.functions["pgp_sym_decrypt_bytea(bytea,text,text)"](bytes, password, options),
    ["\\x00ff5c", password, options],
  ],
  [
    "pgp_pub_encrypt(text,bytea)",
    extension.pgpPubEncrypt("café", bytes),
    extension.sql.functions["pgp_pub_encrypt(text,bytea)"]("café", bytes),
    ["café", "\\x00ff5c"],
  ],
  [
    "pgp_pub_encrypt(text,bytea,text)",
    extension.pgpPubEncrypt("café", bytes, options),
    extension.sql.functions["pgp_pub_encrypt(text,bytea,text)"]("café", bytes, options),
    ["café", "\\x00ff5c", options],
  ],
  [
    "pgp_pub_encrypt_bytea(bytea,bytea)",
    extension.pgpPubEncryptBytea(bytes, bytes),
    extension.sql.functions["pgp_pub_encrypt_bytea(bytea,bytea)"](bytes, bytes),
    ["\\x00ff5c", "\\x00ff5c"],
  ],
  [
    "pgp_pub_encrypt_bytea(bytea,bytea,text)",
    extension.pgpPubEncryptBytea(bytes, bytes, options),
    extension.sql.functions["pgp_pub_encrypt_bytea(bytea,bytea,text)"](bytes, bytes, options),
    ["\\x00ff5c", "\\x00ff5c", options],
  ],
  [
    "pgp_pub_decrypt(bytea,bytea)",
    extension.pgpPubDecrypt(bytes, bytes),
    extension.sql.functions["pgp_pub_decrypt(bytea,bytea)"](bytes, bytes),
    ["\\x00ff5c", "\\x00ff5c"],
  ],
  [
    "pgp_pub_decrypt(bytea,bytea,text)",
    extension.pgpPubDecrypt(bytes, bytes, password),
    extension.sql.functions["pgp_pub_decrypt(bytea,bytea,text)"](bytes, bytes, password),
    ["\\x00ff5c", "\\x00ff5c", password],
  ],
  [
    "pgp_pub_decrypt(bytea,bytea,text,text)",
    extension.pgpPubDecrypt(bytes, bytes, password, options),
    extension.sql.functions["pgp_pub_decrypt(bytea,bytea,text,text)"](bytes, bytes, password, options),
    ["\\x00ff5c", "\\x00ff5c", password, options],
  ],
  [
    "pgp_pub_decrypt_bytea(bytea,bytea)",
    extension.pgpPubDecryptBytea(bytes, bytes),
    extension.sql.functions["pgp_pub_decrypt_bytea(bytea,bytea)"](bytes, bytes),
    ["\\x00ff5c", "\\x00ff5c"],
  ],
  [
    "pgp_pub_decrypt_bytea(bytea,bytea,text)",
    extension.pgpPubDecryptBytea(bytes, bytes, password),
    extension.sql.functions["pgp_pub_decrypt_bytea(bytea,bytea,text)"](bytes, bytes, password),
    ["\\x00ff5c", "\\x00ff5c", password],
  ],
  [
    "pgp_pub_decrypt_bytea(bytea,bytea,text,text)",
    extension.pgpPubDecryptBytea(bytes, bytes, password, options),
    extension.sql.functions["pgp_pub_decrypt_bytea(bytea,bytea,text,text)"](bytes, bytes, password, options),
    ["\\x00ff5c", "\\x00ff5c", password, options],
  ],
] as const;

test("all eighteen PGP identities use their exact admission member, decoder and native observability", () => {
  expect(cases).toHaveLength(18);
  for (const [signature, direct, canonical, params] of cases) {
    const member = `routine:$extension:pgcrypto.${signature.replace(/\b(text|bytea)\b/g, "pg_catalog.$1")}`;
    const binary =
      signature.includes("encrypt") ||
      signature.startsWith("pgp_sym_decrypt_bytea") ||
      signature.startsWith("pgp_pub_decrypt_bytea");
    expect(extensionExpressionContract(direct)).toEqual({
      member,
      codec: binary ? "pg:bytea:hex:1:nullable" : "pg:text:1:nullable",
      dependencies: [],
      observability: signature.includes("encrypt") ? "external" : "tables",
    });
    expect(requiresPgpAdmission(member)).toBe(true);
    const query = dialect.sqlToQuery(direct);
    expect(query).toEqual(dialect.sqlToQuery(canonical));
    expect(query.params).toEqual(params);
    expect(query.sql).toContain('"pgp""functions".');
    expect(query.sql).not.toContain("fixture passphrase");
    expect(query.sql).not.toContain("cipher-algo");
    const decoder = v.parse(v.object({ decoder: v.object({ mapFromDriverValue: v.function() }) }), direct).decoder;
    expect(decoder.mapFromDriverValue(null)).toBe(null);
    expect(decoder.mapFromDriverValue(binary ? Buffer.from([0, 255, 92]) : "café")).toEqual(binary ? bytes : "café");
    expect(() => decoder.mapFromDriverValue(42)).toThrow();
  }
});

test("omitted options and protected-key passwords select exact overloads; explicit NULL stays bound", () => {
  expect(dialect.sqlToQuery(extension.pgpPubDecrypt(bytes, bytes)).params).toEqual(["\\x00ff5c", "\\x00ff5c"]);
  for (const option of ["ignore-cipher-failure=0", "ignore-cipher-failure=1"]) {
    const direct = extension.pgpPubDecrypt(bytes, bytes, "", option);
    const canonical = extension.sql.functions["pgp_pub_decrypt(bytea,bytea,text,text)"](bytes, bytes, "", option);
    expect(dialect.sqlToQuery(direct)).toEqual(dialect.sqlToQuery(canonical));
    expect(dialect.sqlToQuery(direct).params).toEqual(["\\x00ff5c", "\\x00ff5c", "", option]);
    expect(extensionExpressionContract(direct)?.member).toBe(
      "routine:$extension:pgcrypto.pgp_pub_decrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text,pg_catalog.text)",
    );
  }
  expect(dialect.sqlToQuery(extension.pgpSymEncrypt("x", "p", null)).params).toEqual(["x", "p", null]);
  expect(dialect.sqlToQuery(extension.pgpPubDecrypt(bytes, bytes, null, null)).params).toEqual([
    "\\x00ff5c",
    "\\x00ff5c",
    null,
    null,
  ]);
  // @ts-expect-error Undefined cannot select an omitted options argument.
  expect(() => extension.pgpSymEncrypt("x", "p", undefined)).toThrow();
  // @ts-expect-error Undefined is not a protected-key password.
  expect(() => extension.pgpPubDecrypt(bytes, bytes, undefined)).toThrow();
  // @ts-expect-error One argument is not a native overload.
  expect(() => extension.pgpSymDecrypt(bytes)).toThrow(/two or three/);
  // @ts-expect-error Five arguments are not a native overload.
  expect(() => extension.pgpPubDecrypt(bytes, bytes, "p", "", "extra")).toThrow(/two, three or four/);
});

test("PGP column and alias inputs retain nested external metadata, relation provenance and leases", () => {
  let active = true;
  const check = () => {
    if (!active) throw new Error("PGP fixture lease expired");
  };
  const source = checkedExtensionExpression(sql`${inputs.value}`, textCodec, [], check, "fixture:pgp-text");
  const binary = checkedExtensionExpression(sql`${inputs.bytes}`, binaryCodec, [], check, "fixture:pgp-bytes");
  const expressions: SQL[] = [
    extension.pgpSymEncrypt(source.as("value"), inputs.password, inputs.options),
    extension.pgpPubDecrypt(binary.as("bytes"), inputs.bytes, inputs.password, inputs.options),
    extension.pgpSymDecrypt(extension.pgpSymEncrypt(inputs.value, inputs.password), inputs.password),
  ];
  const compiled = expressions.map((expression) => dialect.sqlToQuery(sql`select ${expression} from ${inputs}`));
  const seen: { member: string; observability: string; relations: readonly string[] | undefined }[] = [];
  withExtensionSqlExecution(
    {
      check: (contract, relations) =>
        seen.push({ member: contract.member, observability: contract.observability, relations }),
    },
    () => {
      for (const query of compiled) checkCompiledExtensionQuery(query);
    },
  );
  expect(seen.map((entry) => entry.member)).toContain("fixture:pgp-text");
  expect(seen.map((entry) => entry.member)).toContain("fixture:pgp-bytes");
  expect(seen.every((entry) => entry.relations?.includes("public.pgp_inputs"))).toBe(true);
  expect(
    seen
      .filter((entry) => entry.member.includes("pgp_sym_encrypt"))
      .every((entry) => entry.observability === "external"),
  ).toBe(true);
  expect(dialect.sqlToQuery(extension.pgpSymDecrypt(inputs.bytes, inputs.password)).sql).toContain(
    '("pgp_inputs"."bytes")::"pg_catalog"."bytea"',
  );
  active = false;
  for (const query of compiled.slice(0, 2))
    expect(() => checkCompiledExtensionQuery(query)).toThrow("PGP fixture lease expired");
});
