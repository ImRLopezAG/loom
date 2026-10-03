import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { bytea, pgTable, text } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";
import { arrayCodec, binaryCodec, textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import {
  checkedExtensionExpression,
  checkCompiledExtensionQuery,
  extensionExpressionContract,
  extensionSqlDialect,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";

const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: 'format"functions',
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const dialect = extensionSqlDialect(nodePgCodecs);
const inputs = pgTable("format_inputs", {
  bytes: bytea(),
  armored: text(),
  keys: text().array(),
  values: text().array(),
});
const bytes = { hex: "00ff5c" };

test("fixed key-ID and header result decoders reject malformed driver values", () => {
  // Drizzle's runtime decoder is intentionally inspected only in this test-owned fixture.
  const decoderSchema = v.object({ decoder: v.object({ mapFromDriverValue: v.function() }) });
  const key = v.parse(decoderSchema, extension.keyId(bytes)).decoder;
  for (const value of ["D936CF64BB73F466", "0000000000000000", "SYMKEY", "ANYKEY", null])
    expect(key.mapFromDriverValue(value)).toBe(value);
  for (const value of ["d936cf64bb73f466", "D936CF64BB73F46", "D936CF64BB73F4660", "ID", "SYMKEY ", 123, {}])
    expect(() => key.mapFromDriverValue(value)).toThrow();
  const record = v.parse(decoderSchema, extension.sql.functions["pgp_armor_headers(text)"]("armor")).decoder;
  expect(record.mapFromDriverValue('(Comment,"café")')).toEqual({ key: "Comment", value: "café" });
  for (const value of ["(Comment)", "(Comment,value,extra)", "(,value)", null, {}])
    expect(() => record.mapFromDriverValue(value)).toThrow();
  const headers = extension.armorHeaders("armor", "headers");
  for (const expression of [headers.key, headers.value]) {
    const field = v.parse(decoderSchema, expression).decoder;
    expect(field.mapFromDriverValue("")).toBe("");
    for (const value of [null, 1, {}]) expect(() => field.mapFromDriverValue(value)).toThrow();
  }
});

test("five formatting members retain exact identities, fixed codecs and intrinsic table observability", () => {
  const expressions = [
    extension.armor(bytes),
    extension.armor(bytes, ["Comment"], ["Loom"]),
    extension.dearmor("armor"),
    extension.sql.functions["pgp_armor_headers(text)"]("armor"),
    extension.keyId(bytes),
  ];
  expect(expressions.map((expression) => extensionExpressionContract(expression))).toEqual([
    {
      member: "routine:$extension:pgcrypto.armor(pg_catalog.bytea)",
      codec: "pg:text:1:nullable",
      dependencies: [],
      observability: "tables",
    },
    {
      member: "routine:$extension:pgcrypto.armor(pg_catalog.bytea,pg_catalog._text,pg_catalog._text)",
      codec: "pg:text:1:nullable",
      dependencies: [],
      observability: "tables",
    },
    {
      member: "routine:$extension:pgcrypto.dearmor(pg_catalog.text)",
      codec: "pg:bytea:hex:1:nullable",
      dependencies: [],
      observability: "tables",
    },
    {
      member: "routine:$extension:pgcrypto.pgp_armor_headers(pg_catalog.text)",
      codec: "pg:composite:1:pgcrypto:armor-headers:1:key:pg:text:1;value:pg:text:1",
      dependencies: [],
      observability: "tables",
    },
    {
      member: "routine:$extension:pgcrypto.pgp_key_id(pg_catalog.bytea)",
      codec: "pgcrypto:key-id:1:nullable",
      dependencies: [],
      observability: "tables",
    },
  ]);
  for (const expression of expressions) expect(dialect.sqlToQuery(expression).sql).toContain('"format""functions".');
});

test("every direct scalar is identical to its exact canonical key; named headers retain their SRF source", () => {
  const pairs = [
    [extension.armor(bytes), extension.sql.functions["armor(bytea)"](bytes)],
    [
      extension.armor(bytes, ["Version"], ["Loom"]),
      extension.sql.functions["armor(bytea,text[],text[])"](bytes, ["Version"], ["Loom"]),
    ],
    [extension.dearmor("armor"), extension.sql.functions["dearmor(text)"]("armor")],
    [extension.keyId(bytes), extension.sql.functions["pgp_key_id(bytea)"](bytes)],
  ];
  for (const [direct, canonical] of pairs) {
    expect(dialect.sqlToQuery(direct!)).toEqual(dialect.sqlToQuery(canonical!));
    expect(extensionExpressionContract(direct!)).toEqual(extensionExpressionContract(canonical!));
  }
  const headers = extension.armorHeaders("armor", 'header"alias');
  expect(Object.keys(headers).sort()).toEqual(["from", "key", "value"]);
  const query = dialect.sqlToQuery(sql`select ${headers.key}, ${headers.value} from ${headers.from}`);
  expect(query.sql).toContain('as "header""alias"("key", "value")');
  expect(query.sql).not.toContain('"key" "pg_catalog"');
  const members: string[] = [];
  withExtensionSqlExecution({ check: (contract) => members.push(contract.member) }, () =>
    checkCompiledExtensionQuery(query),
  );
  expect(members).toContain("routine:$extension:pgcrypto.pgp_armor_headers(pg_catalog.text)");
});

test("literal arrays bind safely with exact dimensions while native routine policy remains PostgreSQL's", () => {
  const hostile = "'); drop table format_inputs;--";
  const compiled = dialect.sqlToQuery(extension.armor(bytes, ["Version", "a:b", "CR\r"], [hostile, "", "café"]));
  expect(compiled.sql).not.toContain("drop table");
  expect(compiled.sql.match(/::"pg_catalog"\."text"\[\]/g)).toHaveLength(2);
  expect(compiled.params).toEqual(["\\x00ff5c", '[1:3]={"Version","a:b","CR\r"}', `[1:3]={"${hostile}","","café"}`]);
  expect(dialect.sqlToQuery(extension.armor(bytes, [], [])).params).toEqual(["\\x00ff5c", "{}", "{}"]);
  expect(dialect.sqlToQuery(extension.armor(null, [null, "x\ny"], ["bad: value"])).params).toEqual([
    null,
    '[1:2]={NULL,"x\ny"}',
    '[1:1]={"bad: value"}',
  ]);
  const native = { dimensions: [{ lowerBound: -2, length: 1 }], values: ["Version"] };
  expect(
    dialect.sqlToQuery(extension.armor(bytes, native, { dimensions: [{ lowerBound: 4, length: 1 }], values: ["Loom"] }))
      .params,
  ).toEqual(["\\x00ff5c", '[-2:-2]={"Version"}', '[4:4]={"Loom"}']);
  expect(dialect.sqlToQuery(extension.armor(bytes, null, null)).params).toEqual(["\\x00ff5c", null, null]);
  expect(dialect.sqlToQuery(extension.armor(inputs.bytes, inputs.keys, inputs.values)).sql).toContain(
    '("format_inputs"."keys")::"pg_catalog"."text"[]',
  );
  expect(() => extension.armor(bytes, { dimensions: [{ lowerBound: 1, length: 2 }], values: ["one"] }, [])).toThrow();
  // @ts-expect-error Runtime callers can omit the required binary argument.
  expect(() => extension.armor()).toThrow(/one or three/);
  // @ts-expect-error Runtime callers can supply an incomplete header overload.
  expect(() => extension.armor(bytes, [])).toThrow(/one or three/);
  // @ts-expect-error Runtime callers can supply too many arguments.
  expect(() => extension.armor(bytes, [], [], "extra")).toThrow(/one or three/);
  // @ts-expect-error Undefined is not an allowed header-array value.
  expect(() => extension.armor(bytes, undefined, [])).toThrow();
});

test("array aliases and row sources preserve original leases, nested metadata and source relations", () => {
  let active = true;
  const check = () => {
    if (!active) throw new Error("Formatting lease expired");
  };
  const keys = checkedExtensionExpression(sql`${inputs.keys}`, arrayCodec(textCodec), [], check, "fixture:format-keys");
  const binary = checkedExtensionExpression(sql`${inputs.bytes}`, binaryCodec, [], check, "fixture:format-bytes");
  const armored = checkedExtensionExpression(sql`${inputs.armored}`, textCodec, [], check, "fixture:format-text");
  const headers = extension.armorHeaders(armored.as("armored"), "headers");
  const expressions = [
    extension.armor(binary.as("bytes"), keys.as("keys"), inputs.values),
    extension.dearmor(armored.as("armored")),
    extension.keyId(binary.as("bytes")),
    headers.from,
  ];
  const compiled = expressions.map((expression) => dialect.sqlToQuery(sql`select ${expression} from ${inputs}`));
  const seen: { member: string; relations: readonly string[] | undefined }[] = [];
  withExtensionSqlExecution(
    { check: (contract, relations) => seen.push({ member: contract.member, relations }) },
    () => {
      for (const query of compiled) checkCompiledExtensionQuery(query);
    },
  );
  for (const member of ["fixture:format-keys", "fixture:format-bytes", "fixture:format-text"])
    expect(seen.map((entry) => entry.member)).toContain(member);
  expect(seen.every((entry) => entry.relations?.includes("public.format_inputs"))).toBe(true);
  const nested = extension.armor(extension.genRandomBytes(1));
  const observability: string[] = [];
  withExtensionSqlExecution({ check: (contract) => observability.push(contract.observability) }, () =>
    dialect.sqlToQuery(nested),
  );
  expect(observability).toContain("external");
  active = false;
  for (const expression of expressions)
    expect(() => dialect.sqlToQuery(expression)).toThrow("Formatting lease expired");
  for (const query of compiled) expect(() => checkCompiledExtensionQuery(query)).toThrow("Formatting lease expired");
});
