import { expect, test } from "vite-plus/test";
import { pgcryptoUnitProofCases } from "../../e2e/fixtures/pgcrypto-proof-cases";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";
import {
  checkedExtensionExpression,
  checkCompiledExtensionQuery,
  extensionExpressionContract,
  extensionSqlDialect,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";
import { textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";

const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: 'primitive"functions',
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const dialect = extensionSqlDialect(nodePgCodecs);
const inputs = pgTable("primitive_inputs", { password: text(), salt: text(), type: text(), count: integer() });

extensionProofUnitTest(pgcryptoUnitProofCases.find(({ id }) => id === "pgcrypto.unit-primitives")!, () => {
  const expressions = [
    extension.crypt("foox", "$1$Szzz0yzz"),
    extension.genSalt("bf"),
    extension.genSalt("bf", 4),
    extension.genRandomBytes(1),
    extension.genRandomUuid(),
    extension.fipsMode(),
  ];
  expect(expressions.map((expression) => extensionExpressionContract(expression))).toEqual([
    {
      member: "routine:$extension:pgcrypto.crypt(pg_catalog.text,pg_catalog.text)",
      codec: "pg:text:1:nullable",
      dependencies: [],
      observability: "external",
    },
    {
      member: "routine:$extension:pgcrypto.gen_salt(pg_catalog.text)",
      codec: "pg:text:1:nullable",
      dependencies: [],
      observability: "external",
    },
    {
      member: "routine:$extension:pgcrypto.gen_salt(pg_catalog.text,pg_catalog.int4)",
      codec: "pg:text:1:nullable",
      dependencies: [],
      observability: "external",
    },
    {
      member: "routine:$extension:pgcrypto.gen_random_bytes(pg_catalog.int4)",
      codec: "pg:bytea:hex:1:nullable",
      dependencies: [],
      observability: "external",
    },
    {
      member: "routine:$extension:pgcrypto.gen_random_uuid()",
      codec: "pg:uuid:1",
      dependencies: [],
      observability: "external",
    },
    {
      member: "routine:$extension:pgcrypto.fips_mode()",
      codec: "pg:bool:1",
      dependencies: [],
      observability: "external",
    },
  ]);
  for (const expression of expressions) expect(dialect.sqlToQuery(expression).sql).toContain('"primitive""functions".');
  expect(dialect.sqlToQuery(expressions[4]!).sql).toContain('"primitive""functions"."gen_random_uuid"()');
  expect(dialect.sqlToQuery(expressions[5]!).sql).toContain('"primitive""functions"."fips_mode"()');
});

test("pgcrypto direct primitives equal their six flat canonical signatures", () => {
  const pairs = [
    [extension.crypt("foox", "$1$Szzz0yzz"), extension.sql.functions["crypt(text,text)"]("foox", "$1$Szzz0yzz")],
    [extension.genSalt("bf"), extension.sql.functions["gen_salt(text)"]("bf")],
    [extension.genSalt("bf", 4), extension.sql.functions["gen_salt(text,int4)"]("bf", 4)],
    [extension.genRandomBytes(1), extension.sql.functions["gen_random_bytes(int4)"](1)],
    [extension.genRandomUuid(), extension.sql.functions["gen_random_uuid()"]()],
    [extension.fipsMode(), extension.sql.functions["fips_mode()"]()],
  ];
  for (const [direct, canonical] of pairs) {
    expect(dialect.sqlToQuery(direct!)).toEqual(dialect.sqlToQuery(canonical!));
    expect(extensionExpressionContract(direct!)).toEqual(extensionExpressionContract(canonical!));
  }
});

test("hostile password, salt and algorithm remain bound with exact text and int4 casts", () => {
  const hostile = "'); drop table primitive_inputs;--";
  const crypt = dialect.sqlToQuery(extension.crypt(hostile, hostile));
  expect(crypt.params).toEqual([hostile, hostile]);
  expect(crypt.sql).not.toContain("drop table");
  expect(crypt.sql.match(/::"pg_catalog"\."text"/g)).toHaveLength(2);
  const salt = dialect.sqlToQuery(extension.genSalt(hostile, 0));
  expect(salt.params).toEqual([hostile, 0]);
  expect(salt.sql).not.toContain("drop table");
  expect(salt.sql).toContain('::"pg_catalog"."text"');
  expect(salt.sql).toContain('::"pg_catalog"."int4"');
  expect(dialect.sqlToQuery(extension.genRandomBytes(1025)).params).toEqual([1025]);
  expect(dialect.sqlToQuery(extension.genRandomBytes(inputs.count)).sql).toContain(
    '("primitive_inputs"."count")::"pg_catalog"."int4"',
  );
  expect(dialect.sqlToQuery(extension.crypt(inputs.password, inputs.salt)).sql).toContain(
    '("primitive_inputs"."password")::"pg_catalog"."text"',
  );
  expect(dialect.sqlToQuery(extension.genSalt(inputs.type, inputs.count)).sql).toContain(
    '("primitive_inputs"."type")::"pg_catalog"."text"',
  );
});

test("int4 literals validate representation without replacing native count policy or NULL overloads", () => {
  for (const value of [0, -1, 1025, -2147483648, 2147483647])
    expect(dialect.sqlToQuery(extension.genRandomBytes(value)).params).toEqual([value]);
  for (const value of [0.5, Number.NaN, Number.POSITIVE_INFINITY, -2147483649, 2147483648]) {
    expect(() => extension.genRandomBytes(value)).toThrow();
    expect(() => extension.genSalt("bf", value)).toThrow();
  }
  expect(dialect.sqlToQuery(extension.genSalt(null)).params).toEqual([null]);
  expect(dialect.sqlToQuery(extension.genSalt("bf", null)).params).toEqual(["bf", null]);
  expect(extensionExpressionContract(extension.genSalt("bf", null))?.member).toBe(
    "routine:$extension:pgcrypto.gen_salt(pg_catalog.text,pg_catalog.int4)",
  );
  expect(dialect.sqlToQuery(extension.genRandomBytes(null)).params).toEqual([null]);
  expect(dialect.sqlToQuery(extension.crypt(null, null)).params).toEqual([null, null]);
});

test("text and numeric alias operands preserve relation, execution lease and compiled contract checks", () => {
  let active = true;
  const check = () => {
    if (!active) throw new Error("Primitive input lease expired");
  };
  const password = checkedExtensionExpression(sql`${inputs.password}`, textCodec, [], check, "fixture:owned-password");
  const count = checkedExtensionExpression(sql`${inputs.count}`, int4Codec, [], check, "fixture:owned-count");
  const expressions = [
    extension.crypt(password.as("password"), inputs.salt),
    extension.genSalt(inputs.type, count.as("count")),
    extension.genRandomBytes(count.as("count")),
  ];
  const compiled = expressions.map((expression) => dialect.sqlToQuery(sql`select ${expression} from ${inputs}`));
  const seen: { member: string; relations: readonly string[] | undefined }[] = [];
  withExtensionSqlExecution(
    { check: (contract, relations) => seen.push({ member: contract.member, relations }) },
    () => {
      for (const query of compiled) checkCompiledExtensionQuery(query);
    },
  );
  expect(seen.map((entry) => entry.member)).toContain("fixture:owned-password");
  expect(seen.map((entry) => entry.member)).toContain("fixture:owned-count");
  expect(seen.every((entry) => entry.relations?.includes("public.primitive_inputs"))).toBe(true);
  for (const query of compiled) expect(query.sql).not.toContain('("count")');
  active = false;
  for (const expression of expressions)
    expect(() => dialect.sqlToQuery(expression)).toThrow("Primitive input lease expired");
  for (const query of compiled)
    expect(() => checkCompiledExtensionQuery(query)).toThrow("Primitive input lease expired");
});
