import * as v from "valibot";
import { describe, expect, it } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
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
