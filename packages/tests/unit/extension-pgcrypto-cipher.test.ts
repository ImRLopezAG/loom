import { expect, test } from "vite-plus/test";
import { pgcryptoUnitProofCases } from "../../e2e/fixtures/pgcrypto-proof-cases";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { bytea, pgTable, text } from "drizzle-orm/pg-core";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";
import { binaryCodec, textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import {
  checkedExtensionExpression,
  checkCompiledExtensionQuery,
  createSqlFunction,
  extensionExpressionContract,
  extensionSqlDialect,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";

const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: 'cipher"functions',
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const dialect = extensionSqlDialect(nodePgCodecs);
const table = pgTable("cipher_inputs", { data: bytea(), key: bytea(), iv: bytea(), algorithm: text() });

extensionProofUnitTest(pgcryptoUnitProofCases.find(({ id }) => id === "pgcrypto.unit-cipher")!, () => {
  const expressions = [
    extension.encrypt({ hex: "00ff" }, { hex: "00" }, "aes"),
    extension.sql.functions["decrypt(bytea,bytea,text)"]({ hex: "00ff" }, { hex: "00" }, "aes"),
    extension.encryptWithIv({ hex: "00ff" }, { hex: "00" }, { hex: "01" }, "aes"),
    extension.sql.functions["decrypt_iv(bytea,bytea,bytea,text)"]({ hex: "00ff" }, { hex: "00" }, { hex: "01" }, "aes"),
  ];
  expect(expressions.map((expression) => extensionExpressionContract(expression)?.member)).toEqual([
    "routine:$extension:pgcrypto.encrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
    "routine:$extension:pgcrypto.decrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
    "routine:$extension:pgcrypto.encrypt_iv(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
    "routine:$extension:pgcrypto.decrypt_iv(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
  ]);
  for (const expression of expressions) {
    expect(extensionExpressionContract(expression)).toMatchObject({
      codec: `${binaryCodec.id}:nullable`,
      observability: "tables",
    });
    expect(dialect.sqlToQuery(expression).sql).toContain('"cipher""functions".');
  }
  expect(dialect.sqlToQuery(expressions[2]!).params).toEqual(["\\x00ff", "\\x00", "\\x01", "aes"]);
  const injection = "aes');drop table cipher_inputs;--";
  const compiled = dialect.sqlToQuery(extension.encryptWithIv(table.data, table.key, table.iv, injection));
  expect(compiled.sql).toContain('("cipher_inputs"."data")::"pg_catalog"."bytea"');
  expect(compiled.sql).toContain('("cipher_inputs"."key")::"pg_catalog"."bytea"');
  expect(compiled.sql).toContain('("cipher_inputs"."iv")::"pg_catalog"."bytea"');
  expect(compiled.sql).not.toContain("drop table");
  expect(compiled.params).toEqual([injection]);
  expect(dialect.sqlToQuery(extension.decryptWithIv(null, null, null, null)).params).toEqual([null, null, null, null]);
  expect(() => extension.encrypt({ hex: "FF" }, { hex: "00" }, "aes")).toThrow();
});

test("raw cipher direct helpers equal their shallow canonical contracts", () => {
  const data = { hex: "00ff" },
    key = { hex: "00" },
    iv = { hex: "01" };
  const pairs = [
    [extension.encrypt(data, key, "aes"), extension.sql.functions["encrypt(bytea,bytea,text)"](data, key, "aes")],
    [extension.decrypt(data, key, "aes"), extension.sql.functions["decrypt(bytea,bytea,text)"](data, key, "aes")],
    [
      extension.encryptWithIv(data, key, iv, "aes"),
      extension.sql.functions["encrypt_iv(bytea,bytea,bytea,text)"](data, key, iv, "aes"),
    ],
    [
      extension.decryptWithIv(data, key, iv, "aes"),
      extension.sql.functions["decrypt_iv(bytea,bytea,bytea,text)"](data, key, iv, "aes"),
    ],
  ];
  for (const [direct, canonical] of pairs) {
    expect(dialect.sqlToQuery(direct!)).toEqual(dialect.sqlToQuery(canonical!));
    expect(extensionExpressionContract(direct!)).toEqual(extensionExpressionContract(canonical!));
  }
});

test("raw cipher casts preserve owned aliases, relation dependencies and external inputs", () => {
  let active = true;
  const owned = checkedExtensionExpression(
    sql`${table.data}`,
    binaryCodec,
    [],
    () => {
      if (!active) throw new Error("Cipher input lease expired");
    },
    "fixture:owned-bytea",
  );
  const expression = extension.encryptWithIv(owned.as("data"), table.key, table.iv, table.algorithm);
  const query = dialect.sqlToQuery(sql`select ${expression} from ${table}`);
  const seen: { member: string; relations: readonly string[] | undefined }[] = [];
  withExtensionSqlExecution({ check: (contract, relations) => seen.push({ member: contract.member, relations }) }, () =>
    checkCompiledExtensionQuery(query),
  );
  expect(seen.map((entry) => entry.member)).toContain("fixture:owned-bytea");
  expect(seen.every((entry) => entry.relations?.includes("public.cipher_inputs"))).toBe(true);
  expect(query.sql).not.toContain('("data")');
  active = false;
  expect(() => dialect.sqlToQuery(expression)).toThrow("Cipher input lease expired");
  expect(() => checkCompiledExtensionQuery(query)).toThrow("Cipher input lease expired");
  const external = createSqlFunction({
    schema: "pg_catalog",
    name: "current_setting",
    member: "fixture:external-text",
    arguments: [textCodec] as const,
    result: textCodec,
    dependencies: [],
    observability: "session",
    authority: "query",
  });
  const contracts: string[] = [];
  withExtensionSqlExecution({ check: (contract) => contracts.push(contract.observability) }, () =>
    dialect.sqlToQuery(extension.encrypt({ hex: "00" }, { hex: "00" }, external("server_encoding").as("algorithm"))),
  );
  expect(contracts).toContain("session");
});
