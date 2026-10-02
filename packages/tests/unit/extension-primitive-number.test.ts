import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { arrayCodec, compositeCodec, nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { float4Codec, int2Codec } from "../../../apps/loom/src/core/extensions/primitive-number-codecs";
import { createSqlFunction, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";

test("int2 preserves native and text integers at both PostgreSQL bounds", () => {
  expect(int2Codec.id).toBe("pg:int2:1");
  expect(int2Codec.sqlType).toEqual({ schema: "pg_catalog", name: "int2" });
  for (const value of [-32768, 0, 32767]) {
    expect(int2Codec.encode(value)).toBe(value);
    expect(int2Codec.decode(value)).toBe(value);
    expect(int2Codec.decode(String(value))).toBe(value);
  }
  for (const value of [-32769, 32768, 1.5, Infinity, NaN]) {
    expect(() => int2Codec.encode(value)).toThrow();
    expect(() => int2Codec.decode(value)).toThrow();
  }
  for (const value of ["32768", "1.5", "0x10", "", true, null]) expect(() => int2Codec.decode(value)).toThrow();
  expect(nullableCodec(int2Codec).decode(null)).toBeNull();
});

test("float4 restores exact single precision from PostgreSQL native and short text output", () => {
  expect(float4Codec.id).toBe("pg:float4:1");
  expect(float4Codec.sqlType).toEqual({ schema: "pg_catalog", name: "float4" });
  for (const [raw, expected] of [
    [0.1, 0.10000000149011612],
    [16777217, 16777216],
    [3.4028235e38, 3.4028234663852886e38],
    [1e-45, 1.401298464324817e-45],
  ] as const) {
    expect(float4Codec.encode(raw)).toBe(expected);
    expect(float4Codec.decode(raw)).toBe(expected);
    expect(float4Codec.decode(String(raw))).toBe(expected);
  }
  expect(float4Codec.decode("1.0000001")).toBe(1.0000001192092896);
  expect(float4Codec.encode(1.0000000596046448)).toBe(1);
  expect(float4Codec.encode(-3.4028235e38)).toBe(-3.4028234663852886e38);
  expect(float4Codec.decode("-1e-45")).toBe(-1.401298464324817e-45);
  expect(float4Codec.encode(-0)).toBe("-0");
  expect(Object.is(float4Codec.decode("-0"), -0)).toBe(true);
  expect(nullableCodec(float4Codec).encode(null)).toBeNull();
  expect(nullableCodec(float4Codec).decode(null)).toBeNull();
});

test("float4 rejects finite overflow and nonzero underflow instead of manufacturing nonfinite or zero results", () => {
  for (const value of [
    3.40282357e38,
    -3.40282357e38,
    7.0064923e-46,
    -7.0064923e-46,
    Number.MAX_VALUE,
    Number.MIN_VALUE,
  ]) {
    expect(() => float4Codec.encode(value)).toThrow();
    expect(() => float4Codec.decode(value)).toThrow();
  }
  for (const value of ["1e999", "-1e999", "1e-999", "-1e-999", "invalid", "0x10", "", null])
    expect(() => float4Codec.decode(value)).toThrow();
  for (const value of [Infinity, -Infinity, NaN]) expect(() => float4Codec.encode(value)).toThrow();
});

test("float4 uses the existing explicit nonfinite wire representation", () => {
  for (const [native, text] of [
    [Infinity, "Infinity"],
    [-Infinity, "-Infinity"],
    [NaN, "NaN"],
  ] as const) {
    expect(float4Codec.encode({ nonfinite: text })).toBe(text);
    expect(float4Codec.decode(native)).toEqual({ nonfinite: text });
    expect(float4Codec.decode(text)).toEqual({ nonfinite: text });
  }
});

test("primitive numeric codecs retain exact SQL casts and compose in nullable nested records and arrays", () => {
  const identity = createSqlFunction({
    schema: "fixture",
    name: "identity",
    member: "fixture:identity",
    arguments: [int2Codec, float4Codec] as const,
    result: float4Codec,
    dependencies: [],
    observability: "tables",
    authority: "query",
  });
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select ${identity(32767, 0.1)}`);
  expect(query.sql).toContain('$1::"pg_catalog"."int2"');
  expect(query.sql).toContain('$2::"pg_catalog"."float4"');
  expect(query.params).toEqual([32767, 0.10000000149011612]);
  const record = compositeCodec("fixture:primitive", {
    small: nullableCodec(int2Codec),
    real: float4Codec,
    reals: arrayCodec(float4Codec),
  });
  const array = arrayCodec(record);
  const value = {
    dimensions: [{ lowerBound: 0, length: 1 }],
    values: [
      {
        small: null,
        real: { nonfinite: "NaN" as const },
        reals: { dimensions: [{ lowerBound: -1, length: 2 }], values: [0.10000000149011612, null] },
      },
    ],
  };
  expect(array.decode(array.encode(value))).toEqual(value);
});
