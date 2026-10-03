import * as v from "valibot";
import { describe, expect, it } from "vite-plus/test";
import { eq, fillPlaceholders, inArray, isDriverValueEncoder, ne, gt, sql } from "drizzle-orm";
import { bytea, pgTable } from "drizzle-orm/pg-core";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { extensionRows } from "../../../apps/loom/src/core/extensions/rows";
import {
  createSqlAggregate,
  checkedExtensionExpression,
  createSqlFunction,
  createSqlOperator,
  createSqlWindow,
  defaultSqlArgument,
  extensionExpressionContract,
  extensionSqlDialect,
  statefulSqlMember,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";
import {
  arrayCodec,
  binaryCodec,
  compositeCodec,
  createExtensionCodec,
  floatCodec,
  integerCodec,
  nullableCodec,
  numericCodec,
  rangeCodec,
  textCodec,
  withCodecSqlType,
} from "../../../apps/loom/src/core/extensions/codecs";
const dialect = extensionSqlDialect(nodePgCodecs);
const definition = {
  schema: 'custom"schema',
  name: "similarity",
  member: "test:similarity",
  arguments: [textCodec, textCodec] as const,
  result: floatCodec,
  dependencies: ["documents"],
  observability: "tables" as const,
  authority: "query" as const,
};
describe("checked extension SQL", () => {
  it("encodes checked binary output values in native predicates and explicit prepared parameters", () => {
    const expression = createSqlFunction({
      ...definition,
      name: "binary",
      arguments: [] as const,
      result: nullableCodec(binaryCodec),
    })();
    expect(isDriverValueEncoder(expression)).toBe(true);
    for (const predicate of [
      eq(expression, { hex: "00ff" }),
      ne(expression, { hex: "00ff" }),
      gt(expression, { hex: "00ff" }),
    ]) {
      const query = dialect.sqlToQuery(predicate);
      expect(query.params).toEqual(["\\x00ff"]);
      expect(query.sql).not.toContain("00ff");
    }
    expect(dialect.sqlToQuery(inArray(expression, [{ hex: "" }, { hex: "ff" }])).params).toEqual(["\\x", "\\xff"]);
    const query = dialect.sqlToQuery(eq(expression, sql.param(sql.placeholder("expected"), expression)));
    expect(fillPlaceholders(query.params, { expected: { hex: "00ff" } })).toEqual(["\\x00ff"]);
    expect(fillPlaceholders(query.params, { expected: { hex: "ff00" } })).toEqual(["\\xff00"]);
    expect(fillPlaceholders(query.params, { expected: null })).toEqual([null]);
    expect(() => fillPlaceholders(query.params, {})).toThrow('No value for placeholder "expected"');
    for (const invalid of [{ hex: "0" }, { hex: "FF" }, { hex: "zz" }, false, "00ff"])
      expect(() => fillPlaceholders(query.params, { expected: invalid })).toThrow();
    expect(() => dialect.sqlToQuery(eq(expression, { hex: "00'); select 1;--" }))).toThrow();
    expect(dialect.sqlToQuery(eq(expression, sql.placeholder("raw"))).params).toHaveLength(1);
    const raw = dialect.sqlToQuery(eq(expression, sql.placeholder("raw")));
    expect(fillPlaceholders(raw.params, { raw: { hex: "00ff" } })).toEqual([{ hex: "00ff" }]);
    const other = createSqlFunction({ ...definition, name: "other", arguments: [] as const, result: binaryCodec })();
    const table = pgTable("binary_values", { value: bytea() });
    expect(dialect.sqlToQuery(eq(expression, other)).params).toEqual([]);
    expect(dialect.sqlToQuery(eq(expression, other)).sql).toContain('"other"()');
    expect(dialect.sqlToQuery(eq(expression, table.value)).params).toEqual([]);
    expect(dialect.sqlToQuery(eq(expression, table.value)).sql).toContain('"binary_values"."value"');
    expect(isDriverValueEncoder(expression.as("value"))).toBe(false);
    expect(nullableCodec(nullableCodec(binaryCodec)).encodeOutputParameter({ hex: "ff" })).toBe("\\xff");
    expect(nullableCodec(nullableCodec(binaryCodec)).encodeOutputParameter(null)).toBeNull();
    const typedBinary = withCodecSqlType(binaryCodec, { schema: 'binary"type', name: "bytes" });
    const typed = createSqlFunction({
      ...definition,
      arguments: [typedBinary] as const,
      result: nullableCodec(typedBinary),
    })({ hex: "00" });
    const typedQuery = dialect.sqlToQuery(eq(typed, { hex: "ff" }));
    expect(typedQuery.sql).toContain('$1::"binary""type"."bytes"');
    expect(typedQuery.params).toEqual(["\\x00", "\\xff"]);
  });
  it("opts in only reviewed output encoders and preserves generic input/output differences", () => {
    const custom = createExtensionCodec({
      id: "fixture:input-string-output-object",
      input: v.string(),
      output: v.object({ length: v.number() }),
      transport: "native",
      encode: (value) => value.toUpperCase(),
      decode: (value) => ({ length: Number(value) }),
    });
    const customFunction = createSqlFunction({ ...definition, arguments: [custom] as const, result: custom });
    const customResult = customFunction("abc");
    expect(dialect.sqlToQuery(customResult).params).toEqual(["ABC"]);
    expect(isDriverValueEncoder(customResult)).toBe(false);
    expect(
      isDriverValueEncoder(
        createSqlFunction({
          ...definition,
          arguments: [] as const,
          result: withCodecSqlType(custom, { schema: "public", name: "custom" }),
        })(),
      ),
    ).toBe(false);
    expect(isDriverValueEncoder(createSqlFunction({ ...definition, result: nullableCodec(custom) })("a", "b"))).toBe(
      false,
    );
    for (const result of [textCodec, numericCodec, nullableCodec(textCodec)])
      expect(isDriverValueEncoder(createSqlFunction({ ...definition, result })("a", "b"))).toBe(false);
    const binaryDefinition = { ...definition, arguments: [] as const, result: binaryCodec };
    const aggregate = createSqlAggregate(binaryDefinition);
    const expressions = [
      aggregate(),
      aggregate.distinct(),
      aggregate.filter(sql<boolean>`true`),
      aggregate.over({}),
      createSqlWindow(binaryDefinition)({}),
      createSqlOperator({ ...definition, name: "!", left: binaryCodec, right: undefined, result: binaryCodec })({
        hex: "00",
      }),
      checkedExtensionExpression(sql`'\\x00'::bytea`, binaryCodec, []),
    ];
    for (const expression of expressions)
      expect(dialect.sqlToQuery(eq(expression, { hex: "ff" })).params.at(-1)).toBe("\\xff");
  });
  it("distinguishes named OUT rows from anonymous record declarations", () => {
    const source = createSqlFunction({
      ...definition,
      arguments: [textCodec] as const,
      result: compositeCodec("fixture:headers", { key: textCodec, value: textCodec }),
      observability: "external",
    })("'); drop table documents;--");
    const fields = { 'header"key': textCodec, value: nullableCodec(textCodec) };
    const anonymous = extensionRows(source, 'headers"alias', fields);
    const named = extensionRows(source, 'headers"alias', fields, "named");
    expect(dialect.sqlToQuery(anonymous.from).sql).toContain(
      'as "headers""alias"("header""key" "pg_catalog"."text", "value" "pg_catalog"."text")',
    );
    const seen: string[] = [];
    const query = withExtensionSqlExecution({ check: (contract) => seen.push(contract.observability) }, () =>
      dialect.sqlToQuery(sql`select ${named.columns['header"key']}, ${named.columns.value} from ${named.from}`),
    );
    expect(query.sql).toContain('as "headers""alias"("header""key", "value")');
    expect(query.sql).toContain('"headers""alias"."header""key"');
    expect(query.params).toEqual(["'); drop table documents;--"]);
    expect(query.sql).not.toContain("drop table");
    expect(seen).toContain("external");
    expect(extensionExpressionContract(named.columns.value)?.codec).toBe(nullableCodec(textCodec).id);
  });
  it("checked casts retain exact member identity, nested observability and execution ownership", () => {
    const external = createSqlFunction({ ...definition, observability: "external" })("a", "b");
    let active = true;
    const cast = checkedExtensionExpression(
      sql`(${external})::text`,
      textCodec,
      ["documents"],
      () => {
        if (!active) throw new Error("Cast execution lease expired");
      },
      "cast:fixture.float4->pg_catalog.text",
    );
    expect(extensionExpressionContract(cast)?.member).toBe("cast:fixture.float4->pg_catalog.text");
    const seen: { member: string; observability: string }[] = [];
    withExtensionSqlExecution({ check: (contract) => seen.push(contract) }, () => dialect.sqlToQuery(cast));
    expect(seen.map(({ member }) => member)).toContain("cast:fixture.float4->pg_catalog.text");
    expect(seen.some(({ observability }) => observability === "external")).toBe(true);
    expect(dialect.sqlToQuery(cast).params).toEqual(["a", "b"]);
    active = false;
    expect(() => dialect.sqlToQuery(cast)).toThrow("Cast execution lease expired");
    expect(extensionExpressionContract(checkedExtensionExpression(sql`'value'`, textCodec, []))?.member).toBe(
      "managed:nested-query",
    );
  });
  it("qualifies names and binds hostile values", () => {
    const expression = createSqlFunction(definition)("'); drop table accounts;--", "needle");
    const query = dialect.sqlToQuery(sql`select ${expression}`);
    expect(query.sql).toContain('"custom""schema"."similarity"($1::"pg_catalog"."text", $2::"pg_catalog"."text")');
    expect(query.params).toEqual(["'); drop table accounts;--", "needle"]);
    expect(query.sql).not.toContain("drop table");
    expect(extensionExpressionContract(expression)).toMatchObject({ member: "test:similarity", codec: floatCodec.id });
  });
  it("checks nested SQL at compilation inside the current scope", () => {
    const expression = createSqlFunction(definition)("a", "b");
    const seen: unknown[] = [];
    withExtensionSqlExecution({ check: (contract) => seen.push(contract) }, () =>
      dialect.sqlToQuery(sql`select ${expression} + 1`),
    );
    expect(seen).toEqual([extensionExpressionContract(expression)]);
    dialect.sqlToQuery(expression);
    expect(seen).toHaveLength(1);
  });
  it("composes direct expression aliases while retaining nested external contracts", () => {
    const inner = createSqlFunction({
      ...definition,
      arguments: [textCodec] as const,
      result: textCodec,
      observability: "external",
    });
    const outer = createSqlFunction({ ...definition, arguments: [textCodec] as const });
    const expression = outer(inner("'); drop table documents;--").as("value"));
    const seen: string[] = [];
    const query = withExtensionSqlExecution({ check: (contract) => seen.push(contract.observability) }, () =>
      dialect.sqlToQuery(expression),
    );
    expect(query.sql).toContain('"similarity"("custom""schema"."similarity"($1::"pg_catalog"."text"))');
    expect(query.params).toEqual(["'); drop table documents;--"]);
    expect(query.sql).not.toContain("drop table");
    expect(seen).toContain("external");
    const aggregate = createSqlAggregate({ ...definition, arguments: [textCodec] as const });
    expect(dialect.sqlToQuery(aggregate(inner("a").as("value"))).params).toEqual(["a"]);
    const operator = createSqlOperator({ ...definition, name: "=", left: textCodec, right: textCodec });
    expect(dialect.sqlToQuery(operator(inner("a").as("value"), "b")).params).toEqual(["a", "b"]);
  });
  it("supports defaults, variadics, aggregate filters, and windows", () => {
    const defaults = createSqlFunction({
      ...definition,
      arguments: [textCodec, defaultSqlArgument(textCodec, "b")] as const,
    });
    expect(dialect.sqlToQuery(defaults("one", undefined)).params).toEqual(["one"]);
    const variadic = createSqlFunction({ ...definition, arguments: [textCodec] as const, variadic: textCodec });
    expect(dialect.sqlToQuery(variadic("one", "two", "three")).params).toEqual(["one", "two", "three"]);
    const aggregate = createSqlAggregate({ ...definition, name: "aggregate", arguments: [textCodec] as const });
    expect(dialect.sqlToQuery(aggregate.distinct("a")).sql).toContain("distinct $1");
    expect(dialect.sqlToQuery(aggregate.filter(sql<boolean>`true`, "a")).sql).toContain("filter (where true)");
    expect(dialect.sqlToQuery(aggregate.over({ orderBy: [sql`id`] }, "a")).sql).toContain("over (order by id)");
    const window = createSqlWindow({ ...definition, name: "window", arguments: [] as const });
    expect(dialect.sqlToQuery(window({ partitionBy: [sql`id`] })).sql).toContain("over (partition by id)");
  });
  it("renders qualified operators and keeps maintenance noncallable", () => {
    const operator = createSqlOperator({ ...definition, name: "%", left: textCodec, right: textCodec });
    expect(dialect.sqlToQuery(operator("a", "b")).sql).toContain('operator("custom""schema".%)');
    expect(() => createSqlOperator({ ...definition, name: "%;drop", left: textCodec, right: textCodec })).toThrow();
    expect(statefulSqlMember("cron:schedule", "operator")).toEqual({ member: "cron:schedule", authority: "operator" });
  });
});
describe("precise PostgreSQL codecs", () => {
  it("keeps precision and gives nonfinite and binary values finite wire shapes", () => {
    expect(integerCodec.decode("9223372036854775807")).toBe(9223372036854775807n);
    expect(numericCodec.decode("123456789.123456789")).toBe("123456789.123456789");
    expect(floatCodec.decode(Infinity)).toEqual({ nonfinite: "Infinity" });
    expect(floatCodec.decode(-Infinity)).toEqual({ nonfinite: "-Infinity" });
    expect(floatCodec.decode(NaN)).toEqual({ nonfinite: "NaN" });
    expect(() => floatCodec.decode("invalid")).toThrow();
  });
  it("rejects undeclared NULL and decodes explicit nullable values", () => {
    expect(() => textCodec.decode(null)).toThrow();
    expect(nullableCodec(textCodec).decode(null)).toBeNull();
    expect(binaryCodec.decode("\\x00FF10")).toEqual({ hex: "00ff10" });
  });
  it("decodes both native bytea output formats without changing the wire shape", () => {
    expect(binaryCodec.decode("")).toEqual({ hex: "" });
    expect(binaryCodec.decode("\\x")).toEqual({ hex: "" });
    expect(binaryCodec.decode(String.raw`\000\377\\ A'~`)).toEqual({ hex: "00ff5c2041277e" });
    expect(binaryCodec.decode(String.raw`\134\047\177`)).toEqual({ hex: "5c277f" });
    expect(binaryCodec.decode(new Uint8Array([0, 255, 92]))).toEqual({ hex: "00ff5c" });
    for (const invalid of [
      "\\",
      String.raw`\12`,
      String.raw`\400`,
      String.raw`\078`,
      String.raw`\q`,
      "é",
      "\u0000",
      "\\x0",
      "\\xzz",
    ])
      expect(() => binaryCodec.decode(invalid)).toThrow();
  });
  it("retains array bounds, nulls, escaping, and empty arrays", () => {
    const codec = arrayCodec(textCodec);
    const value = {
      dimensions: [
        { lowerBound: 0, length: 2 },
        { lowerBound: 3, length: 2 },
      ],
      values: [
        ["a,b", null],
        ['a"\\b', "NULL"],
      ],
    };
    expect(codec.decode(codec.encode(value))).toEqual(value);
    expect(() => codec.encode({ dimensions: [{ lowerBound: 0, length: 0 }], values: [] })).toThrow();
    expect(codec.decode("{}")).toEqual({ dimensions: [], values: [] });
    expect(() => codec.decode(["a"])).toThrow();
    expect(() =>
      codec.encode({
        dimensions: [
          { lowerBound: 1, length: 0 },
          { lowerBound: 1, length: 0 },
        ],
        values: [],
      }),
    ).toThrow();
    expect(() =>
      codec.encode({
        dimensions: [
          { lowerBound: 1, length: 2 },
          { lowerBound: 1, length: 0 },
        ],
        values: [[], []],
      }),
    ).toThrow();
    expect(() => codec.decode("{{1},{2,3}}")).toThrow();
    expect(() => codec.decode("{1}junk")).toThrow();
  });
  it("uses captured delimiters for custom scalar arrays", () => {
    const codec = arrayCodec(textCodec, ":");
    const value = { dimensions: [{ lowerBound: 0, length: 2 }], values: ["a:b", "c,d"] };
    expect(codec.decode(codec.encode(value))).toEqual(value);
    expect(codec.decode("{a:b}")).toEqual({ dimensions: [{ lowerBound: 1, length: 2 }], values: ["a", "b"] });
  });
  it("distinguishes array-valued scalar codecs from PostgreSQL dimensions", () => {
    const scalar = createExtensionCodec({
      id: "json:number-array",
      input: v.array(v.number()),
      output: v.array(v.number()),
      transport: "text",
      encode: (value) => JSON.stringify(value),
      decode: (value) => JSON.parse(v.parse(v.string(), value)),
    });
    const codec = arrayCodec(scalar);
    const value = { dimensions: [{ lowerBound: 0, length: 2 }], values: [[1], [2, 3]] };
    expect(codec.decode(codec.encode(value))).toEqual(value);
    expect(codec.decode('{"[1]","[2,3]"}')).toEqual({
      dimensions: [{ lowerBound: 1, length: 2 }],
      values: [[1], [2, 3]],
    });
  });
  it("decodes ranges and nested composite records", () => {
    const range = rangeCodec(integerCodec);
    expect(range.decode("[1,9223372036854775807)")).toEqual({
      empty: false,
      lower: 1n,
      upper: 9223372036854775807n,
      lowerInclusive: true,
      upperInclusive: false,
    });
    expect(range.decode("empty")).toEqual({ empty: true });
    const record = compositeCodec("test:record", { title: nullableCodec(textCodec), ids: arrayCodec(integerCodec) });
    const input = { title: 'a,"\\b', ids: { dimensions: [{ lowerBound: 1, length: 2 }], values: [1n, null] } };
    expect(record.decode(record.encode(input))).toEqual(input);
    expect(() => record.decode("(one)")).toThrow();
  });
});

import { deserializeRpcValue, serializeRpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
it("approved codec envelopes roundtrip without admitting opaque prototypes", () => {
  const value = {
    bytes: { hex: "00ff" },
    numeric: { nonfinite: "NaN" },
    at: new Date("2026-10-02T00:00:00Z"),
    count: 1n,
    nested: { url: new URL("https://example.com"), set: new Set(["a"]), map: new Map([["one", { hex: "ff" }]]) },
  };
  expect(deserializeRpcValue(serializeRpcValue(value))).toEqual(value);
  class Opaque {
    readonly hex = "ff";
  }
  // SAFETY: deliberately pass an opaque instance to prove rejection at the public serialization boundary.
  expect(() => serializeRpcValue(new Opaque() as never)).toThrow();
  expect(() => serializeRpcValue(Object.assign(Object.create(Object.create(null)), { hex: "ff" }))).toThrow();
});

it("serializer strips pollution keys and keeps nested approved record values", () => {
  const record = JSON.parse(
    '{"safe":{"value":"ok"},"__proto__":{"loomPolluted":true},"constructor":{"prototype":{"loomPolluted":true}},"prototype":{"loomPolluted":true}}',
  );
  expect(deserializeRpcValue(serializeRpcValue(record))).toEqual({ safe: { value: "ok" } });
  expect(Object.prototype).not.toHaveProperty("loomPolluted");
  expect({}).not.toHaveProperty("loomPolluted");
});
