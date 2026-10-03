import { expect, test } from "vite-plus/test";
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

const descriptor = {
  name: "pgcrypto",
  version: "1.4",
  schema: 'hash"functions',
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
} as const;
const extension = createPgcrypto_1_4(descriptor);
const dialect = extensionSqlDialect(nodePgCodecs);
const table = pgTable("hash_inputs", { data: bytea(), key: bytea(), value: text(), algorithm: text() });

test("pgcrypto hash prerequisites require the exact verified descriptor", () => {
  for (const apiSupport of [{ status: "unverified" as const }, { status: "verified" as const, digest: "stale" }])
    expect(() => createPgcrypto_1_4({ ...descriptor, apiSupport })).toThrow();
  expect(Object.isFrozen(extension)).toBe(true);
  expect(Object.keys(extension.sql.functions).sort((a, b) => a.localeCompare(b))).toEqual([
    "digest(bytea,text)",
    "digest(text,text)",
    "hmac(bytea,bytea,text)",
    "hmac(text,text,text)",
  ]);
  expect(Object.keys(extension.sql.operators)).toEqual([]);
});

test("four hashing contracts bind values and force their recorded native signatures", () => {
  const expressions = [
    extension.digest("'); drop table data;--", "sha256", "text"),
    extension.sql.functions["digest(bytea,text)"]({ hex: "616263" }, "sha256"),
    extension.hmac("Jefe", "what do ya want for nothing?", "sha1", "text"),
    extension.sql.functions["hmac(bytea,bytea,text)"]({ hex: "00ff" }, { hex: "0b" }, "sha1"),
  ];
  expect(expressions.map((value) => extensionExpressionContract(value)?.member)).toEqual([
    "routine:$extension:pgcrypto.digest(pg_catalog.text,pg_catalog.text)",
    "routine:$extension:pgcrypto.digest(pg_catalog.bytea,pg_catalog.text)",
    "routine:$extension:pgcrypto.hmac(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    "routine:$extension:pgcrypto.hmac(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
  ]);
  for (const expression of expressions) {
    expect(extensionExpressionContract(expression)).toMatchObject({
      codec: `${binaryCodec.id}:nullable`,
      observability: "tables",
    });
    expect(dialect.sqlToQuery(expression).sql).toContain('"hash""functions".');
    expect(dialect.sqlToQuery(expression).sql).not.toContain("drop table");
  }
  expect(dialect.sqlToQuery(expressions[0]!).params).toEqual(["'); drop table data;--", "sha256"]);
  expect(dialect.sqlToQuery(expressions[1]!).params).toEqual(["\\x616263", "sha256"]);
  const textQuery = dialect.sqlToQuery(extension.digest(table.value, table.algorithm, "text"));
  expect(textQuery.sql).toContain('("hash_inputs"."value")::"pg_catalog"."text"');
  expect(textQuery.sql).toContain('("hash_inputs"."algorithm")::"pg_catalog"."text"');
  const binaryQuery = dialect.sqlToQuery(extension.hmac(table.data, table.key, "sha1", "bytea"));
  expect(binaryQuery.sql).toContain('("hash_inputs"."data")::"pg_catalog"."bytea"');
  expect(binaryQuery.sql).toContain('("hash_inputs"."key")::"pg_catalog"."bytea"');
  expect(dialect.sqlToQuery(extension.digest(null, null, "text")).params).toEqual([null, null]);
  expect(() => extension.digest({ hex: "FF" }, "sha256", "bytea")).toThrow();
});

test("hash casts retain nested ownership, observability and native table dependencies", () => {
  let active = true;
  const owned = checkedExtensionExpression(
    sql`${table.value}`,
    textCodec,
    [],
    () => {
      if (!active) throw new Error("Hash input lease expired");
    },
    "fixture:owned-text",
  );
  const expression = extension.digest(owned.as("value"), "sha256", "text");
  const query = dialect.sqlToQuery(sql`select ${expression} from ${table}`);
  const seen: { member: string; relations: readonly string[] | undefined }[] = [];
  withExtensionSqlExecution({ check: (contract, relations) => seen.push({ member: contract.member, relations }) }, () =>
    checkCompiledExtensionQuery(query),
  );
  expect(seen.map((entry) => entry.member)).toContain("fixture:owned-text");
  expect(seen.every((entry) => entry.relations?.includes("public.hash_inputs"))).toBe(true);
  expect(query.sql).not.toContain('("value")');
  active = false;
  expect(() => dialect.sqlToQuery(expression)).toThrow("Hash input lease expired");
  expect(() => checkCompiledExtensionQuery(query)).toThrow("Hash input lease expired");
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
  const nested = extension.digest(external("server_encoding").as("setting"), "sha256", "text");
  const observability: string[] = [];
  withExtensionSqlExecution({ check: (contract) => observability.push(contract.observability) }, () =>
    dialect.sqlToQuery(nested),
  );
  expect(observability).toContain("session");
});
