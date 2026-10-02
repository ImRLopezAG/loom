import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import { asc, defineRelations, eq, sql } from "drizzle-orm";
import { pgTable, timestamp as pgTimestamp, uuid, text } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { createPgUuidv7_1_6 } from "../../../apps/loom/src/core/extensions/adapters/pg-uuidv7";
import {
  timestamp,
  timestamptz,
  timestampColumn,
  timestamptzColumn,
} from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { deserializeRpcValue, serializeRpcValue, rpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import { evaluateSnapshot, captureSnapshotRevisions } from "../../../apps/loom/src/core/server/rpc/snapshot";

const extension = createPgUuidv7_1_6({
  name: "pg_uuidv7",
  version: "1.6",
  schema: 'custom"v7',
  apiSupport: { status: "verified" },
});
const install = sql`create schema "custom""v7"; create extension pg_uuidv7 with schema "custom""v7" version '1.6'`;
const fixture = sql`(values(1)) fixture(value)`;
const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-7[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Validate actual decoded values at the public RPC boundary.
function rpcRoundTrip(value: unknown) {
  return deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, value)));
}
function utcInput(value: string) {
  return timestamptz(
    value === "infinity" || value === "-infinity"
      ? value
      : `${value.replace(" BC", "")}Z${value.endsWith(" BC") ? " BC" : ""}`,
  );
}

test("pg_uuidv7 exact1.6 typed members preserve observed millisecond truncation, unsigned wrap, NULLs and native timezone semantics", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(install);
      const installed = await connection.db.execute(
        sql`select e.extversion,n.nspname from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid=e.extnamespace where e.extname='pg_uuidv7'`,
      );
      expect(installed.rows).toEqual([{ extversion: "1.6", nspname: 'custom"v7' }]);
      // Exact primitive expectations come from independent pinned-C arithmetic and the pre-adapter actual Neon receipt.
      const cases = [
        ["1970-01-01 00:00:00", "00000000-0000-7000-8000-000000000000", "1970-01-01 00:00:00.000000"],
        ["1970-01-01 00:00:00.123456", "00000000-007b-7000-8000-000000000000", "1970-01-01 00:00:00.123000"],
        ["1970-01-01 00:00:00.123457", "00000000-007b-7000-8000-000000000000", "1970-01-01 00:00:00.123000"],
        ["1969-12-31 23:59:59.999999", "89374bc6-a7ef-7000-8000-000000000000", "6750-11-25 08:31:56.911000"],
        ["0001-01-01 00:00:00.123456 BC", "50acdcc2-486b-7000-8000-000000000000", "4780-11-24 08:31:57.035000"],
        ["10000-01-01 00:00:00.123456", "e677d21f-dc7b-7000-8000-000000000000", "10000-01-01 00:00:00.123000"],
        ["4714-11-24 00:00:00 BC", "c96f0ae0-57ef-7000-8000-000000000000", "8988-05-19 14:03:47.567000"],
        ["294276-12-31 23:59:59.999999", "c577e6a3-8fff-7000-8000-000000000000", "8850-03-21 15:00:59.007000"],
        ["infinity", "c57810b2-fff7-7000-8000-000000000000", "8850-03-29 19:01:53.783000"],
        ["-infinity", "c57810b2-fff7-7000-8000-000000000000", "8850-03-29 19:01:53.783000"],
      ] as const;
      await connection.transaction(async (db) => {
        await db.execute(sql`select set_config('DateStyle','ISO,YMD',true),set_config('TimeZone','UTC',true)`);
        for (const [source, id, output] of cases) {
          const result = await db
            .select({
              civilUuid: extension.fromTimestamp(timestamp(source), true),
              instantUuid: extension.fromTimestamptz(utcInput(source), true),
              civil: extension.toTimestamp(extension.fromTimestamp(timestamp(source), true)),
              instant: extension.toTimestamptz(extension.fromTimestamptz(utcInput(source), true)),
              directAlias: extension.toTimestamp(extension.fromTimestamp(timestamp(source), true).as("uuid_alias")),
            })
            .from(fixture);
          expect(result).toEqual([
            {
              civilUuid: id,
              instantUuid: id,
              civil: { type: "timestamp", text: output },
              instant: { type: "timestamptz", text: `${output}+00` },
              directAlias: { type: "timestamp", text: output },
            },
          ]);
          assert.deepEqual(rpcRoundTrip(result), result);
        }
        const nulls = await db
          .select({
            civil: extension.fromTimestamp(null, true),
            instant: extension.fromTimestamptz(null, true),
            zero: extension.fromTimestamp(timestamp("1970-01-01 00:00:00"), null),
            instantZero: extension.fromTimestamptz(timestamptz("1970-01-01 00:00:00Z"), null),
            toCivil: extension.toTimestamp(null),
            toInstant: extension.toTimestamptz(null),
          })
          .from(fixture);
        expect(nulls).toEqual([
          { civil: null, instant: null, zero: null, instantZero: null, toCivil: null, toInstant: null },
        ]);
        const arbitrary = await db
          .select({
            nil: extension.toTimestamp("00000000-0000-0000-0000-000000000000"),
            wrongVersion: extension.toTimestamp("00000000-007b-4000-0000-000000000000"),
            maximum: extension.toTimestamptz("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF"),
          })
          .from(fixture);
        expect(arbitrary).toEqual([
          {
            nil: { type: "timestamp", text: "1970-01-01 00:00:00.000000" },
            wrongVersion: { type: "timestamp", text: "1970-01-01 00:00:00.123000" },
            maximum: { type: "timestamptz", text: "10889-08-02 05:31:50.655000+00" },
          },
        ]);
      });
      for (const zone of ["UTC", "Asia/Kathmandu", "Europe/Paris", "Pacific/Chatham"]) {
        await connection.transaction(async (db) => {
          await db.execute(sql`select set_config('TimeZone',${zone},true),set_config('DateStyle','ISO,YMD',true)`);
          expect(
            await db
              .select({
                uuid: extension.fromTimestamptz(timestamptz("1970-01-01 05:30:00.123456+05:30"), true),
                civil: extension.toTimestamp("00000000-007b-7000-8000-000000000000"),
                instant: extension.toTimestamptz("00000000-007b-7000-8000-000000000000"),
              })
              .from(fixture),
          ).toEqual([
            {
              uuid: "00000000-007b-7000-8000-000000000000",
              civil: { type: "timestamp", text: "1970-01-01 00:00:00.123000" },
              instant: { type: "timestamptz", text: "1970-01-01 00:00:00.123000+00" },
            },
          ]);
        });
      }
      const before = await connection.db.execute(
        sql`select floor(extract(epoch from clock_timestamp())*1000)::text as ms`,
      );
      const random = await connection.db
        .select({
          v7: extension.v7(),
          omitted: extension.fromTimestamp(timestamp("1970-01-01 00:00:00.123456")),
          undefined: extension.fromTimestamptz(timestamptz("1970-01-01 00:00:00.123456Z"), undefined),
          false: extension.fromTimestamp(timestamp("1970-01-01 00:00:00.123456"), false),
          dynamic: extension.fromTimestamptz(timestamptz("1970-01-01 00:00:00.123456Z"), sql<boolean>`false`),
        })
        .from(fixture);
      const after = await connection.db.execute(
        sql`select floor(extract(epoch from clock_timestamp())*1000)::text as ms`,
      );
      expect(random[0]!.v7).toMatch(uuidPattern);
      const milliseconds = BigInt(`0x${random[0]!.v7.slice(0, 8)}${random[0]!.v7.slice(9, 13)}`);
      const first = v.parse(v.string(), before.rows[0]!.ms),
        last = v.parse(v.string(), after.rows[0]!.ms);
      expect(milliseconds >= BigInt(first) && milliseconds <= BigInt(last)).toBe(true);
      for (const value of [random[0]!.omitted, random[0]!.undefined, random[0]!.false, random[0]!.dynamic])
        expect(value).toMatch(/^00000000-007b-7[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    } finally {
      await connection.close();
    }
  });
});

test("pg_uuidv7 native defaults, insert/RETURNING, UUID columns and four temporal column bridges compose with WHERE/order/subqueries", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const storage = pgTable("temporal", {
      id: uuid().notNull().default(extension.v7()),
      label: text().notNull(),
      civilDate: pgTimestamp("civil_date"),
      civilString: pgTimestamp("civil_string", { mode: "string" }),
      instantDate: pgTimestamp("instant_date", { withTimezone: true }),
      instantString: pgTimestamp("instant_string", { withTimezone: true, mode: "string" }),
    });
    try {
      await connection.db.execute(install);
      await connection.db.execute(
        sql`create table public.temporal(id uuid not null default ${extension.v7()},label text not null,civil_date timestamp,civil_string timestamp,instant_date timestamptz,instant_string timestamptz)`,
      );
      await connection.transaction(async (db) => {
        await db.execute(
          sql`select set_config('DateStyle','ISO,YMD',true),set_config('TimeZone','Asia/Kathmandu',true)`,
        );
        for (const [label, source] of [
          ["first", "1970-01-01 00:00:00.123456"],
          ["second", "1970-01-01 00:00:00.123457"],
        ] as const) {
          const result = await db
            .insert(storage)
            .values({
              id: extension.fromTimestamp(timestamp(source!), true),
              label: label!,
              civilDate: sql`${source}::timestamp`,
              civilString: sql`${source}::timestamp`,
              instantDate: sql`${source + "+00"}::timestamptz`,
              instantString: sql`${source + "+00"}::timestamptz`,
            })
            .returning({
              id: storage.id,
              civilDate: timestampColumn(storage.civilDate),
              civilString: timestampColumn(storage.civilString),
              instantDate: timestamptzColumn(storage.instantDate),
              instantString: timestamptzColumn(storage.instantString),
            });
          expect(result).toEqual([
            {
              id: "00000000-007b-7000-8000-000000000000",
              civilDate: { type: "timestamp", text: source },
              civilString: { type: "timestamp", text: source },
              instantDate: { type: "timestamptz", text: source + "+00" },
              instantString: { type: "timestamptz", text: source + "+00" },
            },
          ]);
          assert.deepEqual(rpcRoundTrip(result), result);
        }
        const defaults = await db.insert(storage).values({ label: "default" }).returning({ id: storage.id });
        expect(defaults[0]!.id).toMatch(uuidPattern);
        const converted = await db
          .select({
            civilDate: extension.fromTimestamp(timestampColumn(storage.civilDate), true),
            civilString: extension.fromTimestamp(timestampColumn(storage.civilString), true),
            instantDate: extension.fromTimestamptz(timestamptzColumn(storage.instantDate), true),
            instantString: extension.fromTimestamptz(timestamptzColumn(storage.instantString), true),
            extract: extension.toTimestamp(storage.id),
          })
          .from(storage)
          .where(eq(storage.label, "first"));
        expect(converted).toEqual([
          {
            civilDate: "00000000-007b-7000-8000-000000000000",
            civilString: "00000000-007b-7000-8000-000000000000",
            instantDate: "00000000-007b-7000-8000-000000000000",
            instantString: "00000000-007b-7000-8000-000000000000",
            extract: { type: "timestamp", text: "1970-01-01 00:00:00.123000" },
          },
        ]);
        const nulls = await db
          .select({
            civil: extension.fromTimestamp(timestampColumn(storage.civilDate), true),
            instant: extension.fromTimestamptz(timestamptzColumn(storage.instantString), true),
          })
          .from(storage)
          .where(eq(storage.label, "default"));
        expect(nulls).toEqual([{ civil: null, instant: null }]);
        expect(
          await db
            .select({ label: storage.label })
            .from(storage)
            .where(
              eq(
                extension.fromTimestamp(timestampColumn(storage.civilDate), true),
                "00000000-007b-7000-8000-000000000000",
              ),
            )
            .orderBy(asc(storage.label)),
        ).toEqual([{ label: "first" }, { label: "second" }]);
        const selected = db
          .select({ value: extension.fromTimestamp(timestampColumn(storage.civilString), true).as("value") })
          .from(storage)
          .where(eq(storage.label, "second"))
          .as("selected");
        expect(await db.select({ value: extension.toTimestamp(selected.value) }).from(selected)).toEqual([
          { value: { type: "timestamp", text: "1970-01-01 00:00:00.123000" } },
        ]);
        await db.insert(storage).values([
          { label: "nil", id: "00000000-0000-0000-0000-000000000000" },
          { label: "expanded", id: extension.fromTimestamp(timestamp("10000-01-01 00:00:00.123456"), true) },
          { label: "maximum", id: "ffffffff-ffff-ffff-ffff-ffffffffffff" },
        ]);
        const ordered = await db
          .select({ label: storage.label, value: extension.toTimestamp(storage.id).as("chronology") })
          .from(storage)
          .where(sql`${storage.label} in ('nil','first','expanded','maximum')`)
          .orderBy(asc(sql`chronology`));
        expect(ordered.map((value) => value.label)).toEqual(["nil", "first", "expanded", "maximum"]);
        const native = await db
          .select({ civil: storage.civilDate, instant: storage.instantDate })
          .from(storage)
          .where(eq(storage.label, "first"));
        expect(native[0]!.civil).toBeInstanceOf(Date);
        expect(native[0]!.instant).toBeInstanceOf(Date);
      });
    } finally {
      await connection.close();
    }
  });
});

test("pg_uuidv7 deterministic nested JSON relations and RPC retain exact decoded native result identities", async () => {
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
      await connection.db.execute(install);
      await connection.db.execute(
        sql`create table public.parents("_id" uuid primary key default uuidv7(),"_createdAt" bigint not null default 1,label text not null);create table public.children("_id" uuid primary key default uuidv7(),"_createdAt" bigint not null default 1,parent_id uuid not null,label text not null,instant timestamptz)`,
      );
      const [parent] = await connection.db.insert(schema.tables.parents).values({ label: "parent" }).returning();
      if (!parent) throw new Error("Missing pg_uuidv7 parent fixture");
      await connection.db.insert(schema.tables.children).values([
        { parentId: parent._id, label: "first", instant: sql`'1970-01-01 00:00:00.123456+00'::timestamptz` },
        { parentId: parent._id, label: "second", instant: sql`'1970-01-01 00:00:00.123457+00'::timestamptz` },
        { parentId: parent._id, label: "null" },
      ]);
      const result = await connection.transaction(async (db) => {
        await db.execute(
          sql`select set_config('DateStyle','ISO,YMD',true),set_config('TimeZone','Asia/Kathmandu',true)`,
        );
        return db.query.parents.findMany({
          columns: { label: true },
          extras: {
            civil: () => extension.toTimestamp(extension.fromTimestamp(timestamp("10000-01-01 00:00:00.123456"), true)),
          },
          with: {
            children: {
              columns: { label: true, instant: true },
              orderBy: { label: "asc" },
              extras: {
                id: (table) => extension.fromTimestamptz(timestamptzColumn(table.instant), true),
                extracted: (table) =>
                  extension.toTimestamptz(extension.fromTimestamptz(timestamptzColumn(table.instant), true)),
              },
            },
          },
        });
      });
      expect(result).toEqual([
        {
          label: "parent",
          civil: { type: "timestamp", text: "10000-01-01 00:00:00.123000" },
          children: [
            {
              label: "first",
              instant: new Date("1970-01-01T00:00:00.123Z"),
              id: "00000000-007b-7000-8000-000000000000",
              extracted: { type: "timestamptz", text: "1970-01-01 00:00:00.123000+00" },
            },
            { label: "null", instant: null, id: null, extracted: null },
            {
              label: "second",
              instant: new Date("1970-01-01T00:00:00.123Z"),
              id: "00000000-007b-7000-8000-000000000000",
              extracted: { type: "timestamptz", text: "1970-01-01 00:00:00.123000+00" },
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

test("pg_uuidv7 zero=true permits automatic live evaluation; randomness rejects ordinary/prepared/aliases and caught decode rolls back", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(install);
      const civil = timestamp("1970-01-01 00:00:00.123456"),
        instant = timestamptz("1970-01-01 00:00:00.123456Z");
      const live = await connection.transaction(async (db) => {
        const deterministic = db
          .select({
            civil: extension.toTimestamp(extension.fromTimestamp(civil, true)),
            instant: extension.toTimestamptz(extension.fromTimestamptz(instant, true)),
          })
          .from(fixture);
        const prepared = deterministic.prepare();
        // This constant fixture has no table dependencies; capture the empty revision set on the actual transaction.
        const ordinary = await evaluateSnapshot(async () => {
          const rows = await deterministic.execute();
          await captureSnapshotRevisions(db, async () => ({}));
          return rows;
        });
        const compiled = await evaluateSnapshot(async () => {
          const rows = await prepared.execute();
          await captureSnapshotRevisions(db, async () => ({}));
          return rows;
        });
        return { ordinary, compiled };
      });
      expect(live.ordinary.value).toEqual([
        {
          civil: { type: "timestamp", text: "1970-01-01 00:00:00.123000" },
          instant: { type: "timestamptz", text: "1970-01-01 00:00:00.123000+00" },
        },
      ]);
      expect(live.compiled.value).toEqual([
        {
          civil: { type: "timestamp", text: "1970-01-01 00:00:00.123000" },
          instant: { type: "timestamptz", text: "1970-01-01 00:00:00.123000+00" },
        },
      ]);
      for (const expression of [
        extension.v7(),
        extension.fromTimestamp(civil),
        extension.fromTimestamp(civil, false),
        extension.fromTimestamptz(instant),
        extension.fromTimestamptz(instant, false),
        extension.fromTimestamp(civil, sql<boolean>`true`),
        extension.toTimestamp(extension.v7().as("random")),
        extension.fromTimestamp(extension.toTimestamp(extension.v7().as("nested_random")), true),
      ]) {
        const query = connection.db.select({ value: expression }).from(fixture);
        const prepared = query.prepare();
        expect(await prepared.execute()).toHaveLength(1);
        await Promise.resolve(
          expect(evaluateSnapshot(() => query.execute())).rejects.toThrow(
            "Automatic live query cannot observe external extension dependency",
          ),
        );
        await Promise.resolve(
          expect(evaluateSnapshot(() => prepared.execute())).rejects.toThrow(
            "Automatic live query cannot observe external extension dependency",
          ),
        );
      }
      await connection.db.execute(sql`create table public.decoding_writes(label text not null)`);
      let caught = false;
      await Promise.resolve(
        expect(
          connection.transaction(async (db) => {
            await db.execute(
              sql`insert into public.decoding_writes values('before');select set_config('DateStyle','SQL,MDY',true)`,
            );
            try {
              await db.select({ value: extension.toTimestamptz("00000000-007b-7000-8000-000000000000") }).from(fixture);
            } catch {
              caught = true;
            }
            await db.execute(sql`insert into public.decoding_writes values('caught')`);
          }),
        ).rejects.toThrow("Expected exact ISO timestamp text"),
      );
      expect(caught).toBe(true);
      expect(
        (await connection.db.execute(sql`select count(*)::text as count from public.decoding_writes`)).rows,
      ).toEqual([{ count: "0" }]);
    } finally {
      await connection.close();
    }
  });
});
