import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { float4Codec, int2Codec } from "../../../apps/loom/src/core/extensions/primitive-number-codecs";
import {
  arrayCodec,
  compositeCodec,
  nullableCodec,
  withCodecSqlType,
} from "../../../apps/loom/src/core/extensions/codecs";
import { createSqlFunction } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { deserializeRpcValue, serializeRpcValue, rpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import * as v from "valibot";

test("PostgreSQL 18 characterizes int2 and float4 driver values and accepted limits", async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const version = await client.query<{ server_version: string }>("show server_version");
      expect(version.rows[0]?.server_version).toMatch(/^18\./);
      const integers = await client.query(
        "select '-32768'::int2 as low, '32767'::int2 as high, '32767'::int2::text as text",
      );
      expect(integers.rows).toEqual([{ low: -32768, high: 32767, text: "32767" }]);
      for (const input of ["-32769", "32768"]) {
        await assert.rejects(client.query("select $1::int2", [input]), { code: "22003" });
      }
      const cases = [
        ["0.1", "0.1", 0.10000000149011612],
        ["16777217", "1.6777216e+07", 16777216],
        ["1.000000059604644775390625", "1", 1],
        ["1.000000059604644775390626", "1.0000001", 1.0000001192092896],
        ["3.4028234663852886e38", "3.4028235e+38", 3.4028234663852886e38],
        ["3.40282356e38", "3.4028235e+38", 3.4028234663852886e38],
        ["1.401298464324817e-45", "1e-45", 1.401298464324817e-45],
        ["7.0064924e-46", "1e-45", 1.401298464324817e-45],
      ] as const;
      for (const [input, text, exact] of cases) {
        const result = await client.query(
          "select $1::float4 as native, $1::float4::text as text, $1::float4::float8 as exact",
          [input],
        );
        expect(result.rows).toEqual([{ native: Number(text), text, exact }]);
      }
      for (const input of ["3.40282357e38", "-3.40282357e38", "7.0064923e-46", "-7.0064923e-46", "1e999", "1e-999"]) {
        await assert.rejects(client.query("select $1::float4", [input]), { code: "22003" });
      }
      const special = await client.query(
        "select '-0'::float4 as zero, 'NaN'::float4 as nan, 'Infinity'::float4 as positive, '-Infinity'::float4 as negative, null::float4 as missing",
      );
      expect(Object.is(special.rows[0]?.zero, -0)).toBe(true);
      expect(special.rows[0]?.nan).toBeNaN();
      expect(special.rows[0]?.positive).toBe(Infinity);
      expect(special.rows[0]?.negative).toBe(-Infinity);
      expect(special.rows[0]?.missing).toBeNull();
    } finally {
      await client.end();
    }
  });
});

test("int2 and float4 checked expressions decode native values, limits, NULL and nonfinite values", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const contract = {
      schema: "public",
      dependencies: [],
      observability: "tables" as const,
      authority: "query" as const,
    };
    const small = createSqlFunction({
      ...contract,
      name: "small_identity",
      member: "fixture:small",
      arguments: [int2Codec] as const,
      result: int2Codec,
    });
    const real = createSqlFunction({
      ...contract,
      name: "real_identity",
      member: "fixture:real",
      arguments: [float4Codec] as const,
      result: float4Codec,
    });
    const missing = createSqlFunction({
      ...contract,
      name: "real_identity",
      member: "fixture:nullable-real",
      arguments: [nullableCodec(float4Codec)] as const,
      result: nullableCodec(float4Codec),
    });
    try {
      await connection.db.execute(
        sql`create function small_identity(int2) returns int2 language sql as 'select $1'; create function real_identity(float4) returns float4 language sql as 'select $1'`,
      );
      const result = await connection.transaction((db) =>
        db
          .select({
            low: small(-32768),
            high: small(32767),
            rounded: real(0.1),
            integer: real(16777217),
            tie: real(1.0000000596046448),
            maximum: real(3.4028235e38),
            minimum: real(1e-45),
            zero: real(-0),
            serverTie: real(sql<number>`'1.000000059604644775390626'::float4`),
            serverMinimum: real(sql<number>`'7.0064924e-46'::float4`),
            nan: real({ nonfinite: "NaN" }),
            positive: real({ nonfinite: "Infinity" }),
            negative: real({ nonfinite: "-Infinity" }),
            missing: missing(null),
          })
          .from(sql`(values (1)) fixture(id)`),
      );
      expect(result).toEqual([
        {
          low: -32768,
          high: 32767,
          rounded: 0.10000000149011612,
          integer: 16777216,
          tie: 1,
          maximum: 3.4028234663852886e38,
          minimum: 1.401298464324817e-45,
          zero: -0,
          serverTie: 1.0000001192092896,
          serverMinimum: 1.401298464324817e-45,
          nan: { nonfinite: "NaN" },
          positive: { nonfinite: "Infinity" },
          negative: { nonfinite: "-Infinity" },
          missing: null,
        },
      ]);
      for (const expression of [() => small(32768), () => real(3.40282357e38), () => real(7.0064923e-46)]) {
        await assert.rejects(
          connection.transaction((db) => db.select({ value: expression() }).from(sql`(values (1)) fixture(id)`)),
        );
      }
      const nonnull = createSqlFunction({
        ...contract,
        name: "real_identity",
        member: "fixture:nonnull-real",
        arguments: [nullableCodec(float4Codec)] as const,
        result: float4Codec,
      });
      await assert.rejects(
        connection.transaction((db) => db.select({ value: nonnull(null) }).from(sql`(values (1)) fixture(id)`)),
      );
    } finally {
      await connection.close();
    }
  });
});

test("primitive numeric codecs roundtrip nested PostgreSQL arrays and composites through checked expressions and RPC wire", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const record = withCodecSqlType(
      compositeCodec("fixture:primitive", {
        small: nullableCodec(int2Codec),
        real: nullableCodec(float4Codec),
        smalls: arrayCodec(int2Codec),
        reals: arrayCodec(float4Codec),
      }),
      { schema: "public", name: "primitive_record" },
    );
    const records = arrayCodec(record);
    const echo = createSqlFunction({
      schema: "public",
      name: "record_identity",
      member: "fixture:primitive-array",
      arguments: [records] as const,
      result: records,
      dependencies: [],
      observability: "tables",
      authority: "query",
    });
    const value = {
      dimensions: [{ lowerBound: 0, length: 2 }],
      values: [
        {
          small: -32768,
          real: 0.10000000149011612,
          smalls: {
            dimensions: [
              { lowerBound: -2, length: 2 },
              { lowerBound: 3, length: 2 },
            ],
            values: [
              [-32768, null],
              [0, 32767],
            ],
          },
          reals: {
            dimensions: [{ lowerBound: 0, length: 4 }],
            values: [3.4028234663852886e38, 1.401298464324817e-45, { nonfinite: "NaN" as const }, null],
          },
        },
        {
          small: null,
          real: null,
          smalls: { dimensions: [], values: [] },
          reals: {
            dimensions: [{ lowerBound: 1, length: 2 }],
            values: [{ nonfinite: "Infinity" as const }, { nonfinite: "-Infinity" as const }],
          },
        },
      ],
    };
    try {
      await connection.db.execute(
        sql`create type primitive_record as (small int2, real float4, smalls int2[], reals float4[]); create function record_identity(primitive_record[]) returns primitive_record[] language sql as 'select $1'`,
      );
      const result = await connection.transaction((db) =>
        db.select({ value: echo(value) }).from(sql`(values (1)) fixture(id)`),
      );
      expect(result).toEqual([{ value }]);
      const wire = v.parse(rpcValue, result);
      assert.deepEqual(deserializeRpcValue(serializeRpcValue(wire)), result);
    } finally {
      await connection.close();
    }
  });
});
