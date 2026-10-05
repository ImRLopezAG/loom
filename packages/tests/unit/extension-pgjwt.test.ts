import { expect } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { pgJwtUnitProofCases } from "../../e2e/fixtures/pgjwt-proof-cases";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { bytea, json, pgTable, text } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { createPgJwt_0_2_0 } from "../../../apps/loom/src/core/extensions/adapters/pgjwt";
import { textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { jsonDocument } from "../../../apps/loom/src/core/extensions/native-json-codecs";
import {
  checkedExtensionExpression,
  checkCompiledExtensionQuery,
  extensionExpressionContract,
  extensionSqlDialect,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";

const descriptor = {
  name: "pgjwt",
  version: "0.2.0",
  schema: "jwt 日本",
  apiSupport: { status: "verified", digest: "a2d8b3ee4c390dd05716585a14c23acfebdb05bb3800a06cd72a48578dcabadd" },
} as const;
const extension = createPgJwt_0_2_0(descriptor);
const dialect = extensionSqlDialect(nodePgCodecs);
const inputs = pgTable("jwt_inputs", { token: text(), secret: text(), payload: json(), bytes: bytea() });
const payload = jsonDocument('{"id":9007199254740993,"a":1,"a":2}');

extensionProofUnitTest(pgJwtUnitProofCases[0]!, () => {
  const expressions = [
    extension.algorithmSign("header.payload", "secret", "HS512"),
    extension.sign(payload, "secret"),
    extension.tryCastDouble("NaN"),
    extension.urlDecode("AP8"),
    extension.urlEncode({ hex: "00ff" }),
    extension.sql.functions.verify("token", "secret"),
  ];
  expect(expressions.map((expression) => extensionExpressionContract(expression)?.member)).toEqual([
    "routine:$extension:pgjwt.algorithm_sign(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    "routine:$extension:pgjwt.sign(pg_catalog.json,pg_catalog.text,pg_catalog.text)",
    "routine:$extension:pgjwt.try_cast_double(pg_catalog.text)",
    "routine:$extension:pgjwt.url_decode(pg_catalog.text)",
    "routine:$extension:pgjwt.url_encode(pg_catalog.bytea)",
    "routine:$extension:pgjwt.verify(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  ]);
  expect(expressions.map((expression) => extensionExpressionContract(expression)?.observability)).toEqual([
    "tables",
    "tables",
    "tables",
    "tables",
    "tables",
    "session",
  ]);
  expect(dialect.sqlToQuery(extension.sign(payload, "secret")).params).toEqual([payload.text, "secret"]);
  expect(dialect.sqlToQuery(extension.sign(payload, "secret", "HS384")).params).toEqual([
    payload.text,
    "secret",
    "HS384",
  ]);
  expect(dialect.sqlToQuery(extension.sign(null, null, null)).params).toEqual([null, null, null]);
  // @ts-expect-error Undefined cannot stand in for the native trailing default.
  expect(() => extension.sign(payload, "secret", undefined)).toThrow();
  // @ts-expect-error Invalid literal algorithms fail the semantic input contract.
  expect(() => extension.algorithmSign("data", "secret", "none")).toThrow();
});

extensionProofUnitTest(pgJwtUnitProofCases[1]!, () => {
  const hostile = "'); drop table jwt_inputs;--";
  const query = dialect.sqlToQuery(extension.sign(payload, hostile));
  expect(query.sql).toContain('"jwt 日本"."sign"');
  expect(query.sql).not.toContain("drop table");
  expect(query.params).toEqual([payload.text, hostile]);
  expect(dialect.sqlToQuery(extension.sign(inputs.payload, inputs.secret)).sql).toContain(
    '"jwt_inputs"."payload")::"pg_catalog"."json"',
  );
  expect(dialect.sqlToQuery(extension.urlEncode(inputs.bytes)).sql).toContain(
    '"jwt_inputs"."bytes")::"pg_catalog"."bytea"',
  );
  expect(dialect.sqlToQuery(extension.urlEncode({ hex: "00ff" })).params).toEqual(["\\x00ff"]);
});

extensionProofUnitTest(pgJwtUnitProofCases[2]!, () => {
  let active = true;
  const checkedToken = checkedExtensionExpression(
    sql`${inputs.token}`,
    textCodec,
    [],
    () => {
      if (!active) throw new Error("JWT lease expired");
    },
    "fixture:jwt-token",
  );
  const rows = extension.verify(checkedToken.as("token"), inputs.secret, 'verify"rows');
  const query = dialect.sqlToQuery(sql`select ${rows.header}, ${rows.payload}, ${rows.valid} from ${rows.from}`);
  expect(query.sql).toContain('as "verify""rows"("header", "payload", "valid")');
  expect(query.sql).not.toContain('"header" "pg_catalog"');
  const observed: { member: string; observability: string; relations: readonly string[] | undefined }[] = [];
  withExtensionSqlExecution({ check: (contract, relations) => observed.push({ ...contract, relations }) }, () =>
    checkCompiledExtensionQuery(query),
  );
  expect(observed).toContainEqual(
    expect.objectContaining({
      member: "routine:$extension:pgjwt.verify(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
      observability: "session",
    }),
  );
  expect(observed.every((contract) => contract.relations?.includes("public.jwt_inputs"))).toBe(true);
  active = false;
  expect(() => checkCompiledExtensionQuery(query)).toThrow("JWT lease expired");
  expect(() => dialect.sqlToQuery(rows.from)).toThrow("JWT lease expired");
});

extensionProofUnitTest(pgJwtUnitProofCases[3]!, () => {
  const expressionDecoder = v.object({ decoder: v.object({ mapFromDriverValue: v.function() }) });
  const decodedPayload = v.parse(expressionDecoder, extension.verify("token", "secret", "jwt").payload).decoder;
  expect(decodedPayload.mapFromDriverValue(payload.text)).toEqual(payload);
  expect(decodedPayload.mapFromDriverValue(null)).toBeNull();
  expect(() => decodedPayload.mapFromDriverValue({ id: 1 })).toThrow();
  const decodedValid = v.parse(expressionDecoder, extension.verify(null, null, "jwt").valid).decoder;
  expect(decodedValid.mapFromDriverValue(null)).toBeNull();
  expect(decodedValid.mapFromDriverValue("f")).toBe(false);
  expect(() => decodedValid.mapFromDriverValue("invalid")).toThrow();
  const decodedDouble = v.parse(expressionDecoder, extension.tryCastDouble("NaN")).decoder;
  expect(decodedDouble.mapFromDriverValue("NaN")).toEqual({ nonfinite: "NaN" });
  expect(decodedDouble.mapFromDriverValue(null)).toBeNull();
  expect(() => decodedDouble.mapFromDriverValue("wrong")).toThrow();
});

extensionProofUnitTest(pgJwtUnitProofCases[4]!, () => {
  expect(() => createPgJwt_0_2_0({ ...descriptor, apiSupport: { status: "verified", digest: "wrong" } })).toThrow();
});

extensionProofUnitTest(pgJwtUnitProofCases[5]!, () => {
  for (const schema of ["", 'jwt"name', "jwt$name", "jwt'name", "jwt\\name", "jwt\0name"])
    expect(() => createPgJwt_0_2_0({ ...descriptor, schema })).toThrow(/installation schema/);
});
