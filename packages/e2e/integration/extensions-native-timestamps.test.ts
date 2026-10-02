import { expect, test } from "bun:test";
import pg from "pg";
import assert from "node:assert/strict";
import { asc, defineRelations, eq, sql } from "drizzle-orm";
import { pgTable, integer, timestamp as pgTimestamp, text } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  timestamp,
  timestamptz,
  timestampCodec,
  timestamptzCodec,
  timestampColumn,
  timestamptzColumn,
} from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";
import { createSqlFunction } from "../../../apps/loom/src/core/extensions/sql";
import { nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { deserializeRpcValue, serializeRpcValue, rpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";

const base = { schema: "public", dependencies: [], observability: "tables", authority: "query" } as const;
const identityTimestamp = createSqlFunction({
  ...base,
  name: "identity_timestamp",
  member: "fixture:identity_timestamp",
  arguments: [nullableCodec(timestampCodec)] as const,
  result: nullableCodec(timestampCodec),
});
const identityTimestamptz = createSqlFunction({
  ...base,
  name: "identity_timestamptz",
  member: "fixture:identity_timestamptz",
  arguments: [nullableCodec(timestamptzCodec)] as const,
  result: nullableCodec(timestamptzCodec),
});
const installIdentities = sql`create function public.identity_timestamp(value timestamp) returns timestamp language sql immutable strict as 'select value'; create function public.identity_timestamptz(value timestamptz) returns timestamptz language sql immutable strict as 'select value'`;
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Validate the actual RPC boundary before serializing exact tagged temporal values.
function rpcRoundTrip(value: unknown) {
  return deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, value)));
}

test("PostgreSQL 18 native temporal text preserves microseconds, finite bounds, eras and numeric offsets", async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const values = await client.query(
        "SELECT '2024-01-01 00:00:00.123456'::timestamp::text AS first, '2024-01-01 00:00:00.123457'::timestamp::text AS second, '4714-11-24 00:00:00 BC'::timestamp::text AS minimum, '294276-12-31 23:59:59.999999'::timestamp::text AS maximum, '0001-02-29 00:00:00 BC'::timestamp::text AS leap_bc, 'infinity'::timestamp::text AS infinity, '-infinity'::timestamptz::text AS negative_infinity",
      );
      expect(values.rows).toEqual([
        {
          first: "2024-01-01 00:00:00.123456",
          second: "2024-01-01 00:00:00.123457",
          minimum: "4714-11-24 00:00:00 BC",
          maximum: "294276-12-31 23:59:59.999999",
          leap_bc: "0001-02-29 00:00:00 BC",
          infinity: "infinity",
          negative_infinity: "-infinity",
        },
      ]);
      await client.query("BEGIN; SET LOCAL TimeZone = 'UTC'");
      const offsets = await client.query(
        "SELECT '0001-01-01 00:00:00+00:00:01'::timestamptz::text AS bc, '0001-12-31 23:59:59-00:00:01 BC'::timestamptz::text AS ad, '1900-01-01 05:41:16+05:41:16'::timestamptz::text AS seconds, '4714-11-23 23:59:59-00:00:01 BC'::timestamptz::text AS minimum",
      );
      expect(offsets.rows).toEqual([
        {
          bc: "0001-12-31 23:59:59+00 BC",
          ad: "0001-01-01 00:00:00+00",
          seconds: "1900-01-01 00:00:00+00",
          minimum: "4714-11-24 00:00:00+00 BC",
        },
      ]);
      await client.query("ROLLBACK");
      const ordinary = await client.query<{ civil: Date; instant: Date }>(
        "SELECT '2024-01-01 00:00:00.123456'::timestamp AS civil, '2024-01-01 00:00:00.123456+00'::timestamptz AS instant",
      );
      expect(ordinary.rows[0]!.civil).toBeInstanceOf(Date);
      expect(ordinary.rows[0]!.instant).toBeInstanceOf(Date);
      expect(ordinary.rows[0]!.instant.toISOString()).toBe("2024-01-01T00:00:00.123Z");
    } finally {
      await client.end();
    }
  });
});

test("native timestamp identity, storage, returning, bridges, alias chronology and subqueries retain exact values", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const storage = pgTable("temporal", {
      id: integer().notNull(),
      label: text().notNull(),
      civilDate: pgTimestamp("civil_date"),
      civilString: pgTimestamp("civil_string", { mode: "string" }),
      instantDate: pgTimestamp("instant_date", { withTimezone: true }),
      instantString: pgTimestamp("instant_string", { withTimezone: true, mode: "string" }),
    });
    try {
      await connection.db.execute(installIdentities);
      await connection.db.execute(
        sql`create table public.temporal (id integer not null, label text not null, civil_date timestamp, civil_string timestamp, instant_date timestamptz, instant_string timestamptz); create sequence public.timestamp_calls; create function public.volatile_timestamp() returns timestamp language sql volatile as 'select ''2000-01-01''::timestamp + (nextval(''public.timestamp_calls'')::text || '' microseconds'')::interval'`,
      );
      const cases = [
        { id: 1, label: "bc", civil: "0001-12-31 23:59:59.123456 BC", instant: "0001-12-31 23:59:59.123456+00 BC" },
        { id: 2, label: "ad", civil: "0001-01-01 00:00:00.123456", instant: "0001-01-01 00:00:00.123456+00" },
        {
          id: 3,
          label: "last-four-digit",
          civil: "9999-12-31 23:59:59.123456",
          instant: "9999-12-31 23:59:59.123456+00",
        },
        { id: 4, label: "expanded", civil: "10000-01-01 00:00:00.123457", instant: "10000-01-01 00:00:00.123457+00" },
        { id: 5, label: "maximum", civil: "294276-12-31 23:59:59.999999", instant: "294276-12-31 23:59:59.999999+00" },
        {
          id: 6,
          label: "minimum",
          civil: "4714-11-24 00:00:00.000000 BC",
          instant: "4714-11-24 00:00:00.000000+00 BC",
        },
        { id: 7, label: "negative-infinity", civil: "-infinity", instant: "-infinity" },
        { id: 8, label: "infinity", civil: "infinity", instant: "infinity" },
      ];
      await connection.transaction(async (db) => {
        await db.execute(sql`select set_config('TimeZone','UTC',true), set_config('DateStyle','ISO,YMD',true)`);
        for (const value of cases) {
          const result = await db
            .insert(storage)
            .values({
              id: value.id,
              label: value.label,
              civilDate: identityTimestamp(timestamp(value.civil)),
              civilString: identityTimestamp(timestamp(value.civil)),
              instantDate: identityTimestamptz(timestamptz(value.instant)),
              instantString: identityTimestamptz(timestamptz(value.instant)),
            })
            .returning({
              civilDate: timestampColumn(storage.civilDate),
              civilString: timestampColumn(storage.civilString),
              instantDate: timestamptzColumn(storage.instantDate),
              instantString: timestamptzColumn(storage.instantString),
            });
          expect(result).toEqual([
            {
              civilDate: { type: "timestamp", text: value.civil },
              civilString: { type: "timestamp", text: value.civil },
              instantDate: { type: "timestamptz", text: value.instant },
              instantString: { type: "timestamptz", text: value.instant },
            },
          ]);
          assert.deepEqual(rpcRoundTrip(result), result);
        }
        await db.insert(storage).values({ id: 9, label: "null" });
        const nulls = await db
          .select({
            civil: identityTimestamp(timestampColumn(storage.civilDate)),
            instant: identityTimestamptz(timestamptzColumn(storage.instantString)),
          })
          .from(storage)
          .where(eq(storage.id, 9));
        expect(nulls).toEqual([{ civil: null, instant: null }]);
        const exact = await db
          .select({
            first: identityTimestamp(timestamp("2024-01-01 00:00:00.123456")),
            second: identityTimestamp(timestamp("2024-01-01 00:00:00.123457")),
            instant: identityTimestamptz(timestamptz("2024-01-01 05:45:00.123456+05:45")),
            null: identityTimestamptz(null),
          })
          .from(sql`(values (1)) fixture(value)`);
        expect(exact).toEqual([
          {
            first: { type: "timestamp", text: "2024-01-01 00:00:00.123456" },
            second: { type: "timestamp", text: "2024-01-01 00:00:00.123457" },
            instant: { type: "timestamptz", text: "2024-01-01 00:00:00.123456+00" },
            null: null,
          },
        ]);
        assert.deepEqual(rpcRoundTrip(exact), exact);
        const native = timestampColumn(storage.civilDate).as("chronology");
        const ordered = await db
          .select({ label: storage.label, chronology: native })
          .from(storage)
          .where(sql`${storage.id} <> 9`)
          .orderBy(asc(sql`chronology`));
        expect(ordered.map((value) => value.label)).toEqual([
          "negative-infinity",
          "minimum",
          "bc",
          "ad",
          "last-four-digit",
          "expanded",
          "maximum",
          "infinity",
        ]);
        const selected = db
          .select({ value: timestampColumn(storage.civilString).as("value") })
          .from(storage)
          .where(eq(storage.id, 4))
          .as("selected");
        expect(await db.select({ value: identityTimestamp(sql`${selected.value}`) }).from(selected)).toEqual([
          { value: { type: "timestamp", text: "10000-01-01 00:00:00.123457" } },
        ]);
        const ordinary = await db
          .select({ civil: storage.civilDate, instant: storage.instantDate })
          .from(storage)
          .where(eq(storage.id, 2));
        expect(ordinary[0]!.civil).toBeInstanceOf(Date);
        expect(ordinary[0]!.instant).toBeInstanceOf(Date);
        const volatile = createSqlFunction({
          ...base,
          name: "volatile_timestamp",
          member: "fixture:volatile_timestamp",
          arguments: [] as const,
          result: timestampCodec,
          observability: "external",
        });
        const evaluated = await db
          .select({ value: volatile().as("value") })
          .from(sql`generate_series(1,3) fixture(value)`)
          .orderBy(asc(sql`value`));
        expect(evaluated).toEqual([
          { value: { type: "timestamp", text: "2000-01-01 00:00:00.000001" } },
          { value: { type: "timestamp", text: "2000-01-01 00:00:00.000002" } },
          { value: { type: "timestamp", text: "2000-01-01 00:00:00.000003" } },
        ]);
        const calls = await db.execute(sql`select last_value::text from public.timestamp_calls`);
        expect(calls.rows).toEqual([{ last_value: "3" }]);
        expect(() => timestampColumn(storage.instantDate)).toThrow("Expected native timestamp column");
        expect(() => timestamptzColumn(storage.civilString)).toThrow("Expected native timestamptz column");
      });
    } finally {
      await connection.close();
    }
  });
});

test("native instant codecs normalize non-hour and historical second timezones under each ISO DateStyle", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(installIdentities);
      for (const zone of ["UTC", "Asia/Kathmandu", "Europe/Paris", "Pacific/Chatham"]) {
        for (const style of ["ISO,YMD", "ISO,DMY", "ISO,MDY"]) {
          await connection.transaction(async (db) => {
            await db.execute(sql`select set_config('TimeZone',${zone},true),set_config('DateStyle',${style},true)`);
            const result = await db
              .select({
                civil: identityTimestamp(timestamp("2024-01-02 03:04:05.123456")),
                instant: identityTimestamptz(timestamptz("1900-01-01 00:00:00.123456Z")),
                minimum: identityTimestamptz(timestamptz("4714-11-24 00:00:00Z BC")),
                maximum: identityTimestamptz(timestamptz("294276-12-31 23:59:59.999999Z")),
              })
              .from(sql`(values (1)) fixture(value)`);
            expect(result).toEqual([
              {
                civil: { type: "timestamp", text: "2024-01-02 03:04:05.123456" },
                instant: { type: "timestamptz", text: "1900-01-01 00:00:00.123456+00" },
                minimum: { type: "timestamptz", text: "4714-11-24 00:00:00.000000+00 BC" },
                maximum: { type: "timestamptz", text: "294276-12-31 23:59:59.999999+00" },
              },
            ]);
          });
        }
      }
    } finally {
      await connection.close();
    }
  });
});

test("unsupported DateStyles fail closed and roll back writes even when application catches decoding errors", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(installIdentities);
      await connection.db.execute(sql`create table public.decoding_writes(label text not null)`);
      const values = pgTable("decoding_values", {
        civil: pgTimestamp(),
        instant: pgTimestamp({ withTimezone: true }),
      });
      await connection.db.execute(
        sql`create table public.decoding_values(civil timestamp, instant timestamptz); insert into public.decoding_values values ('2024-01-02 03:04:05.123456','2024-01-02 03:04:05.123456+00')`,
      );
      for (const style of ["SQL,MDY", "Postgres,DMY", "German,DMY"]) {
        for (const expression of [
          identityTimestamp(timestamp("2024-01-02 03:04:05.123456")),
          identityTimestamptz(timestamptz("2024-01-02 03:04:05.123456Z")),
          timestampColumn(values.civil),
          timestamptzColumn(values.instant),
        ]) {
          let caught = false;
          await Promise.resolve(
            expect(
              connection.transaction(async (db) => {
                await db.execute(sql`insert into public.decoding_writes values (${style})`);
                await db.execute(sql`select set_config('DateStyle',${style},true)`);
                try {
                  await db.select({ value: expression }).from(values);
                } catch {
                  caught = true;
                }
                await db.execute(sql`insert into public.decoding_writes values ('caught')`);
              }),
            ).rejects.toThrow("Expected exact ISO timestamp text"),
          );
          expect(caught).toBe(true);
          const writes = await connection.db.execute(sql`select count(*)::text AS count from public.decoding_writes`);
          expect(writes.rows).toEqual([{ count: "0" }]);
        }
      }
    } finally {
      await connection.close();
    }
  });
});

test("native temporal codecs and checked column bridges retain microseconds in nested JSON relations and RPC", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema((fields) => ({
      parents: { label: fields.text().notNull() },
      children: {
        parentId: fields.reference("parents").notNull(),
        label: fields.text().notNull(),
        instant: fields.timestamp(),
      },
    }));
    const relations = defineRelations(schema.tables, (r) => ({
      parents: { children: r.many.children({ from: r.parents._id, to: r.children.parentId }) },
    }));
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      await connection.db.execute(installIdentities);
      await connection.db.execute(
        sql`create table public.parents("_id" uuid primary key default uuidv7(), "_createdAt" bigint not null default 1, label text not null); create table public.children("_id" uuid primary key default uuidv7(), "_createdAt" bigint not null default 1, parent_id uuid not null, label text not null, instant timestamptz)`,
      );
      const [parent] = await connection.db.insert(schema.tables.parents).values({ label: "parent" }).returning();
      if (!parent) throw new Error("Missing temporal fixture parent");
      await connection.db.insert(schema.tables.children).values([
        {
          parentId: parent._id,
          label: "first",
          instant: identityTimestamptz(timestamptz("2024-01-01 00:00:00.123456Z")),
        },
        {
          parentId: parent._id,
          label: "second",
          instant: identityTimestamptz(timestamptz("2024-01-01 00:00:00.123457Z")),
        },
        { parentId: parent._id, label: "null" },
      ]);
      const result = await connection.transaction(async (db) => {
        await db.execute(
          sql`select set_config('DateStyle','ISO,YMD',true),set_config('TimeZone','Asia/Kathmandu',true)`,
        );
        return db.query.parents.findMany({
          columns: { label: true },
          extras: { civil: () => identityTimestamp(timestamp("10000-01-01 00:00:00.123457")) },
          with: {
            children: {
              columns: { label: true, instant: true },
              orderBy: { label: "asc" },
              extras: {
                exact: (table) => identityTimestamptz(timestamptzColumn(table.instant)),
                civil: () => identityTimestamp(timestamp("0001-12-31 23:59:59.123456 BC")),
                nullCivil: () => identityTimestamp(null),
              },
            },
          },
        });
      });
      expect(result).toEqual([
        {
          label: "parent",
          civil: { type: "timestamp", text: "10000-01-01 00:00:00.123457" },
          children: [
            {
              label: "first",
              instant: new Date("2024-01-01T00:00:00.123Z"),
              exact: { type: "timestamptz", text: "2024-01-01 00:00:00.123456+00" },
              civil: { type: "timestamp", text: "0001-12-31 23:59:59.123456 BC" },
              nullCivil: null,
            },
            {
              label: "null",
              instant: null,
              exact: null,
              civil: { type: "timestamp", text: "0001-12-31 23:59:59.123456 BC" },
              nullCivil: null,
            },
            {
              label: "second",
              instant: new Date("2024-01-01T00:00:00.123Z"),
              exact: { type: "timestamptz", text: "2024-01-01 00:00:00.123457+00" },
              civil: { type: "timestamp", text: "0001-12-31 23:59:59.123456 BC" },
              nullCivil: null,
            },
          ],
        },
      ]);
      assert.deepEqual(rpcRoundTrip(result), result);
    } finally {
      await connection.close();
    }
  });
});
