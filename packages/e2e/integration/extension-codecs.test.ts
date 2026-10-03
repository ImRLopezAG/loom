import { test, expect } from "bun:test";
import assert from "node:assert/strict";
import { asc, desc, defineRelations, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, integer, bigint, boolean, jsonb } from "drizzle-orm/pg-core";
import { call } from "@orpc/server";
import { Context } from "effect";
import pg from "pg";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionRows } from "../../../apps/loom/src/core/extensions/rows";
import {
  createSqlAggregate,
  createSqlFunction,
  createSqlRows,
  createSqlWindow,
  defaultSqlArgument,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";
import {
  type ExtensionCodec,
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
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createProjectProcedures } from "../../../apps/loom/src/core/server/rpc/procedure";
import { bindRpcDatabaseProcedure, createDatabaseMiddleware } from "../../../apps/loom/src/core/server/rpc/database";
import { Invocation } from "../../../apps/loom/src/core/server/effect/runtime";
import { deserializeRpcValue, serializeRpcValue, rpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import * as v from "valibot";
// SAFETY: fixture routines access no application tables; the tuple is intentionally widened for shared definitions.
const queryContract = {
  dependencies: [] as readonly string[],
  observability: "tables" as const,
  authority: "query" as const,
};
function fixtureFunction<
  const Arguments extends readonly Parameters<typeof createSqlFunction>[0]["arguments"][number][],
  Result extends Parameters<typeof createSqlFunction>[0]["result"],
>(name: string, args: Arguments, result: Result) {
  return createSqlFunction({
    ...queryContract,
    schema: "pg_catalog",
    name,
    member: `fixture:${name}`,
    arguments: args,
    result,
  });
}
test("native SQL composes in filters, ordering, arithmetic and nested calls", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const length = fixtureFunction("length", [textCodec] as const, floatCodec);
    const upper = fixtureFunction("upper", [textCodec] as const, textCodec);
    try {
      const rows = await connection.transaction(async (db) =>
        db
          .select({
            score: length(upper("hello")),
            arithmetic: sql<number>`${length("hello")} + 1`,
            collated: upper(sql<string>`'mixed' collate "C"`),
            aliased: length(upper("alias").as("value")),
          })
          .from(sql`(values (1)) as fixture(id)`)
          .where(gt(length("hello"), 4))
          .orderBy(length("hello")),
      );
      expect(rows).toEqual([{ score: 5, arithmetic: 6, collated: "MIXED", aliased: 5 }]);
      const selected = connection.db
        .select({ value: upper("subquery").as("value") })
        .from(sql`(values (1)) as fixture(id)`)
        .as("selected");
      const selectedRows = await connection.transaction((db) =>
        db.select({ length: length(selected.value) }).from(selected),
      );
      expect(selectedRows).toEqual([{ length: 8 }]);
    } finally {
      await connection.close();
    }
  });
});

test("defaults, variadics, aggregate, window and record SRFs execute with checked results", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(
        sql`create schema "custom"; create function custom.join_text(a text, b text default 'default') returns text language sql as 'select a || b'; create function custom.join_many(text, variadic text[]) returns text language sql as 'select $1 || array_to_string($2, ''/'')'; create function custom.join_named(a text, b text default 'b', c text default 'c') returns text language sql as 'select a || b || c'; create function custom.join_default_variadic(a text, b text default 'b', c text default 'c', variadic d text[] default '{}') returns text language sql as 'select a || b || c || array_to_string(d, ''/'')'; create function custom.null_variadic(a text, variadic b text[] default null) returns text language sql as 'select case when b is null then ''default-null'' else array_to_string(b, ''/'') end'; create function custom.join_unnamed(text, text default 'b', text default 'c') returns text language sql as 'select $1 || $2 || $3'; create type custom.poly as (label text, value bigint); create function custom.rows(a bigint) returns table(label text, value bigint) language sql as 'select ''row'', a union all select ''row'', a+1'`,
      );
      const defaults = createSqlFunction({
        ...queryContract,
        schema: "custom",
        name: "join_text",
        member: "fixture:default",
        arguments: [textCodec, defaultSqlArgument(textCodec, "b")] as const,
        result: textCodec,
      });
      const variadic = createSqlFunction({
        ...queryContract,
        schema: "custom",
        name: "join_many",
        member: "fixture:variadic",
        arguments: [textCodec] as const,
        variadic: textCodec,
        result: textCodec,
      });
      const named = createSqlFunction({
        ...queryContract,
        schema: "custom",
        name: "join_named",
        member: "fixture:named",
        arguments: [textCodec, defaultSqlArgument(textCodec, "b"), defaultSqlArgument(textCodec, "c")] as const,
        result: textCodec,
      });
      const unnamed = createSqlFunction({
        ...queryContract,
        schema: "custom",
        name: "join_unnamed",
        member: "fixture:unnamed",
        arguments: [textCodec, defaultSqlArgument(textCodec), defaultSqlArgument(textCodec)] as const,
        result: textCodec,
      });
      const defaultVariadic = createSqlFunction({
        ...queryContract,
        schema: "custom",
        name: "join_default_variadic",
        member: "fixture:default-variadic",
        variadicDefault: true,
        arguments: [textCodec, defaultSqlArgument(textCodec, "b"), defaultSqlArgument(textCodec, "c")] as const,
        variadic: textCodec,
        result: textCodec,
      });
      const nullVariadic = createSqlFunction({
        ...queryContract,
        schema: "custom",
        name: "null_variadic",
        member: "fixture:null-variadic",
        arguments: [textCodec] as const,
        variadic: textCodec,
        variadicDefault: true,
        result: textCodec,
      });
      const sum = createSqlAggregate({
        ...queryContract,
        schema: "pg_catalog",
        name: "sum",
        member: "fixture:sum",
        arguments: [integerCodec] as const,
        result: nullableCodec(numericCodec),
      });
      const rowNumber = createSqlWindow({
        ...queryContract,
        schema: "pg_catalog",
        name: "row_number",
        member: "fixture:row_number",
        arguments: [] as const,
        result: integerCodec,
      });
      const record = compositeCodec("fixture:record", { label: textCodec, value: integerCodec });
      const rows = createSqlRows({
        ...queryContract,
        schema: "custom",
        name: "rows",
        member: "fixture:rows",
        arguments: [integerCodec] as const,
        result: record,
      });
      await connection.transaction(async (db) => {
        expect(
          await db
            .select({
              defaults: defaults("a"),
              explicit: defaults("a", "b"),
              variadic: variadic("a", "b", "c"),
              empty: variadic("a"),
            })
            .from(sql`(values (1)) fixture(id)`),
        ).toEqual([{ defaults: "adefault", explicit: "ab", variadic: "ab/c", empty: "a" }]);
        expect(
          await db
            .select({
              middle: named("a", undefined, "C"),
              omitted: named("a"),
              rest: defaultVariadic("a", "B", "C", "x", "y"),
              trailing: defaults("a", undefined),
              unnamed: unnamed("a", "B"),
              variadicPrefix: defaultVariadic("a"),
              nullVariadic: nullVariadic("a"),
              providedVariadic: nullVariadic("a", "x"),
            })
            .from(sql`(values (1)) fixture(id)`),
        ).toEqual([
          {
            middle: "abC",
            omitted: "abc",
            rest: "aBCx/y",
            trailing: "adefault",
            unnamed: "aBc",
            variadicPrefix: "abc",
            nullVariadic: "default-null",
            providedVariadic: "x",
          },
        ]);
        expect(
          await db
            .select({
              sum: sum(sql<bigint>`id`),
              distinct: sum.distinct(sql<bigint>`id`),
              filtered: sum.filter(sql<boolean>`id > 1`, sql<bigint>`id`),
            })
            .from(sql`(values (1::bigint), (2::bigint), (2::bigint)) fixture(id)`),
        ).toEqual([{ sum: "5", distinct: "3", filtered: "4" }]);
        expect(
          await db
            .select({
              index: rowNumber({ orderBy: [sql`id`] }),
              running: sum.over({ orderBy: [sql`id`] }, sql<bigint>`id`),
            })
            .from(sql`(values (1::bigint), (2::bigint)) fixture(id)`)
            .orderBy(sql`id`),
        ).toEqual([
          { index: 1n, running: "1" },
          { index: 2n, running: "3" },
        ]);
        expect(await db.select({ row: rows(9223372036854775805n) }).from(sql`(values (1)) fixture(id)`)).toEqual([
          { row: { label: "row", value: 9223372036854775805n } },
          { row: { label: "row", value: 9223372036854775806n } },
        ]);
        const typedRecord = withCodecSqlType(record, { schema: "custom", name: "poly" });
        const json = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "json" });
        const populate = fixtureFunction(
          "json_populate_record",
          [nullableCodec(typedRecord), json] as const,
          typedRecord,
        );
        const populateRows = createSqlRows({
          ...queryContract,
          schema: "pg_catalog",
          name: "json_populate_recordset",
          member: "fixture:polymorphic-recordset",
          arguments: [nullableCodec(typedRecord), json] as const,
          result: typedRecord,
        });
        expect(
          await db
            .select({ row: populate(null, '{"label":"poly","value":"9223372036854775807"}') })
            .from(sql`(values (1)) fixture(id)`),
        ).toEqual([{ row: { label: "poly", value: 9223372036854775807n } }]);
        expect(
          await db
            .select({
              row: populateRows(
                null,
                '[{"label":"first","value":"1"},{"label":"second","value":"9223372036854775807"}]',
              ),
            })
            .from(sql`(values (1)) fixture(id)`),
        ).toEqual([{ row: { label: "first", value: 1n } }, { row: { label: "second", value: 9223372036854775807n } }]);
        const series = fixtureFunction("generate_series", [integerCodec, integerCodec] as const, integerCodec);
        expect(await db.select({ value: series(1n, 2n) }).from(sql`(values (1)) fixture(id)`)).toEqual([
          { value: 1n },
          { value: 2n },
        ]);
      });
    } finally {
      await connection.close();
    }
  });
});

test("named OUT SRFs retain native columns, checked decoders and prepared query contracts", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(
        sql`create schema "headers""schema"; create extension pgcrypto with schema "headers""schema"`,
      );
      const headersRecord = compositeCodec("fixture:armor-headers", { key: textCodec, value: textCodec });
      const armor = createSqlFunction({
        ...queryContract,
        schema: 'headers"schema',
        name: "armor",
        member: "fixture:armor",
        arguments: [binaryCodec, arrayCodec(textCodec), arrayCodec(textCodec)] as const,
        result: textCodec,
      });
      const headers = createSqlRows({
        ...queryContract,
        schema: 'headers"schema',
        name: "pgp_armor_headers",
        member: "fixture:pgp-armor-headers",
        arguments: [textCodec] as const,
        result: headersRecord,
        observability: "external",
      });
      const hostile = "x'); drop table documents;--";
      const armored = armor(
        { hex: "00ff5c" },
        { dimensions: [{ lowerBound: 1, length: 2 }], values: ["Version", "Comment"] },
        { dimensions: [{ lowerBound: 1, length: 2 }], values: ["Loom test", hostile] },
      );
      const fields = { key: textCodec, value: textCodec };
      const anonymous = extensionRows(headers(armored), "headers", fields);
      await assert.rejects(
        connection.transaction((db) => db.select(anonymous.columns).from(anonymous.from)),
        (error: Error) => {
          let cause: unknown = error;
          const seen = new Set<Error>();
          while (cause instanceof Error && !seen.has(cause)) {
            seen.add(cause);
            if (
              cause.message === "a column definition list is redundant for a function with OUT parameters" &&
              v.is(v.object({ code: v.literal("42601") }), cause)
            )
              return true;
            cause = cause.cause;
          }
          return false;
        },
      );
      const named = extensionRows(headers(armored), 'headers"alias', fields, "named");
      const expected = [
        { key: "Version", value: "Loom test" },
        { key: "Comment", value: hostile },
      ];
      expect(await connection.transaction((db) => db.select(named.columns).from(named.from))).toEqual(expected);
      const prepared = connection.db.select(named.columns).from(named.from).prepare("named_armor_headers");
      expect(await connection.transaction(() => prepared.execute())).toEqual(expected);
      const selected = connection.db
        .select({ key: named.columns.key.as("key"), value: named.columns.value.as("value") })
        .from(named.from)
        .as("selected_headers");
      expect(await connection.transaction((db) => db.select().from(selected))).toEqual(expected);
      const seen: string[] = [];
      await withExtensionSqlExecution({ check: (contract) => seen.push(contract.observability) }, () =>
        connection.transaction((db) => db.select(named.columns).from(named.from)),
      );
      expect(seen).toContain("external");
      await assert.rejects(
        withExtensionSqlExecution(
          {
            check: (contract) => {
              if (contract.observability === "external") throw new Error("Named rows remain externally observable");
            },
          },
          () => connection.transaction(() => prepared.execute()),
        ),
        /Named rows remain externally observable/,
      );
      const invalid = extensionRows(headers(armored), "bad_headers", { key: integerCodec, value: textCodec }, "named");
      await assert.rejects(connection.transaction((db) => db.select(invalid.columns).from(invalid.from)));

      const options = createSqlRows({
        ...queryContract,
        schema: "pg_catalog",
        name: "pg_options_to_table",
        member: "fixture:pg-options-to-table",
        arguments: [arrayCodec(textCodec)] as const,
        result: compositeCodec("fixture:option", { name: textCodec, value: nullableCodec(textCodec) }),
      });
      const optionRows = extensionRows(
        options({ dimensions: [{ lowerBound: 1, length: 2 }], values: ["enabled", "color=blue"] }),
        "options",
        { name: textCodec, value: nullableCodec(textCodec) },
        "named",
      );
      expect(await connection.transaction((db) => db.select(optionRows.columns).from(optionRows.from))).toEqual([
        { name: "enabled", value: null },
        { name: "color", value: "blue" },
      ]);
    } finally {
      await connection.close();
    }
  });
});

test("real driver results preserve arrays, ranges, records, bytes, precision and SQL NULL", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(
        sql`create schema "custom"; create function custom.bounded() returns bigint[] language sql as 'select ''[0:1][3:4]={{1,NULL},{3,9223372036854775807}}''::bigint[]'; create function custom.range_value() returns int8range language sql as 'select ''[1,9223372036854775807)''::int8range'; create function custom.bytes() returns bytea language sql as 'select decode(''00ff10'', ''hex'')'; create function custom.precise() returns numeric language sql as 'select 123456789123456789.123456789::numeric'; create function custom.missing() returns text language sql as 'select null::text'; create function custom.infinity() returns float8 language sql as 'select ''Infinity''::float8'`,
      );
      const fn = <Result extends Parameters<typeof createSqlFunction>[0]["result"]>(name: string, result: Result) =>
        createSqlFunction({
          ...queryContract,
          schema: "custom",
          name,
          member: `fixture:${name}`,
          arguments: [] as const,
          result,
        });
      const bounded = fn("bounded", arrayCodec(integerCodec));
      const range = fn("range_value", rangeCodec(integerCodec));
      const bytes = fn("bytes", binaryCodec);
      const precise = fn("precise", numericCodec);
      const missing = fn("missing", nullableCodec(textCodec));
      const infinity = fn("infinity", floatCodec);
      const values = await connection.transaction((db) =>
        db
          .select({
            bounded: bounded(),
            range: range(),
            bytes: bytes(),
            precise: precise(),
            missing: missing(),
            infinity: infinity(),
          })
          .from(sql`(values (1)) fixture(id)`),
      );
      expect(values).toEqual([
        {
          bounded: {
            dimensions: [
              { lowerBound: 0, length: 2 },
              { lowerBound: 3, length: 2 },
            ],
            values: [
              [1n, null],
              [3n, 9223372036854775807n],
            ],
          },
          range: { empty: false, lower: 1n, upper: 9223372036854775807n, lowerInclusive: true, upperInclusive: false },
          bytes: { hex: "00ff10" },
          precise: "123456789123456789.123456789",
          missing: null,
          infinity: { nonfinite: "Infinity" },
        },
      ]);
      const validation = v.safeParse(rpcValue, values);
      expect(
        validation.issues?.map((issue) => ({ message: issue.message, path: issue.path?.map((part) => part.key) })),
      ).toEqual(undefined);
      const serializable = v.parse(rpcValue, values);
      expect(deserializeRpcValue(serializeRpcValue(serializable))).toEqual(serializable);
      assert.deepEqual(serializable, values);
      await assert.rejects(
        connection.transaction((db) =>
          db.select({ missing: fn("missing", textCodec)() }).from(sql`(values (1)) fixture(id)`),
        ),
      );
    } finally {
      await connection.close();
    }
  });
});

test("native bytea output modes preserve every byte in scalar, prepared and nested codecs", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const hex = Array.from({ length: 256 }, (_, value) => value.toString(16).padStart(2, "0")).join("");
    const decode = fixtureFunction("decode", [textCodec, textCodec] as const, binaryCodec);
    try {
      await connection.transaction(async (db) => {
        const prepared = db
          .select({ bytes: decode(hex, "hex") })
          .from(sql`(values (1)) fixture(id)`)
          .prepare("bytea_modes");
        for (const mode of ["hex", "escape"] as const) {
          await db.execute(
            mode === "hex" ? sql`set local bytea_output = 'hex'` : sql`set local bytea_output = 'escape'`,
          );
          const raw = await db.execute(sql`select decode(${hex}, 'hex') as bytes,
            decode(${hex}, 'hex')::text as wire, decode('', 'hex')::text as empty,
            ARRAY[decode(${hex}, 'hex'), NULL, decode('', 'hex')]::text as array,
            ROW(decode(${hex}, 'hex'))::text as record`);
          const native = v.parse(
            v.object({
              bytes: v.instance(Uint8Array),
              wire: v.string(),
              empty: v.string(),
              array: v.string(),
              record: v.string(),
            }),
            raw.rows[0],
          );
          expect(Array.from(native.bytes)).toEqual(Array.from({ length: 256 }, (_, value) => value));
          expect(binaryCodec.decode(native.wire)).toEqual({ hex });
          expect(binaryCodec.decode(native.empty)).toEqual({ hex: "" });
          expect(arrayCodec(binaryCodec).decode(native.array)).toEqual({
            dimensions: [{ lowerBound: 1, length: 3 }],
            values: [{ hex }, null, { hex: "" }],
          });
          expect(compositeCodec("fixture:bytea-record", { bytes: binaryCodec }).decode(native.record)).toEqual({
            bytes: { hex },
          });
          expect(await prepared.execute()).toEqual([{ bytes: { hex } }]);
        }
      });
    } finally {
      await connection.close();
    }
  });
});

test("two concurrent databases with different composite OIDs have independent decoders", async () => {
  await withExtensionDatabase(async (firstUrl) =>
    withExtensionDatabase(async (secondUrl) => {
      const schema = defineSchema(() => ({}));
      const connections = await Promise.all(
        [firstUrl, secondUrl].map((url) =>
          connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString: url }),
        ),
      );
      try {
        await connections[1]!.db.execute(sql`create type filler1 as (v text); create type filler2 as (v text)`);
        await Promise.all(
          connections.map((connection) =>
            connection.db.execute(
              sql`create schema "custom"; create type custom.record as (label text, value bigint); create function custom.record_value() returns custom.record language sql as 'select row(''escaped,"value'',9223372036854775807)::custom.record'; create function custom.record_array() returns custom.record[] language sql as 'select ARRAY[row(''escaped,"value'',9223372036854775807)::custom.record]'`,
            ),
          ),
        );
        const oids = await Promise.all(
          connections.map(
            async (connection) =>
              (
                await connection.db.execute(
                  sql`select 'custom.record'::regtype::oid as oid, 'custom.record[]'::regtype::oid as array_oid`,
                )
              ).rows[0],
          ),
        );
        expect(oids[0]?.oid).not.toEqual(oids[1]?.oid);
        expect(oids[0]?.array_oid).not.toEqual(oids[1]?.array_oid);
        const record = createSqlFunction({
          ...queryContract,
          schema: "custom",
          name: "record_value",
          member: "fixture:record_value",
          arguments: [] as const,
          result: compositeCodec("fixture:record", { label: textCodec, value: integerCodec }),
        });
        const recordArray = createSqlFunction({
          ...queryContract,
          schema: "custom",
          name: "record_array",
          member: "fixture:record_array",
          arguments: [] as const,
          result: arrayCodec(compositeCodec("fixture:record-array", { label: textCodec, value: integerCodec })),
        });
        const outputs = await Promise.all(
          connections.map((connection) =>
            connection.transaction((db) =>
              db.select({ value: record(), array: recordArray() }).from(sql`(values (1)) fixture(id)`),
            ),
          ),
        );
        expect(outputs).toEqual([
          [
            {
              value: { label: 'escaped,"value', value: 9223372036854775807n },
              array: {
                dimensions: [{ lowerBound: 1, length: 1 }],
                values: [{ label: 'escaped,"value', value: 9223372036854775807n }],
              },
            },
          ],
          [
            {
              value: { label: 'escaped,"value', value: 9223372036854775807n },
              array: {
                dimensions: [{ lowerBound: 1, length: 1 }],
                values: [{ label: 'escaped,"value', value: 9223372036854775807n }],
              },
            },
          ],
        ]);
      } finally {
        await Promise.all(connections.map((connection) => connection.close()));
      }
    }),
  );
});

test("ordinary and caught result decoder failures roll back actual RPC writes, input failures do not", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(
      (fields) => ({
        items: { title: fields.text().notNull() },
        children: { title: fields.text().notNull(), parentId: fields.reference("items") },
      }),
      { namespace: "public" },
    );
    const relations = defineRelations(schema.tables, (r) => ({
      items: { children: r.many.children({ from: r.items._id, to: r.children.parentId }) },
      children: { parent: r.one.items({ from: r.children.parentId, to: r.items._id }) },
    }));
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      await connection.db.execute(
        sql`create table writes (value integer not null); create table items ("_id" uuid primary key default uuidv7(), "_createdAt" bigint not null default 1, title text not null); create table children ("_id" uuid primary key default uuidv7(), "_createdAt" bigint not null default 1, title text not null, parent_id uuid); insert into items (title) values ('parent'); insert into children (title, parent_id) select 'child', "_id" from items`,
      );
      const bad = fixtureFunction("length", [textCodec] as const, textCodec);
      const handmade: ExtensionCodec<string, string> = {
        id: "fixture:handmade",
        transport: "native",
        encode: (value) => value,
        decode: () => {
          throw new Error("Handmade decoder failed");
        },
      };
      const handmadeNullable: ExtensionCodec<string | null, string | null> = {
        ...handmade,
        id: "fixture:handmade-nullable",
        encode: (value) => value,
        decode: () => {
          throw new Error("Handmade nullable decoder failed");
        },
      };
      const manual = fixtureFunction("length", [textCodec] as const, handmade);
      await connection.db.execute(sql`create function missing() returns text language sql as 'select null::text'`);
      const missing = createSqlFunction({
        ...queryContract,
        schema: "public",
        name: "missing",
        member: "fixture:missing",
        arguments: [] as const,
        result: handmadeNullable,
      });
      const contextFor = () => {
        const invocation = { identity: null, requestId: crypto.randomUUID(), signal: new AbortController().signal };
        return {
          ...invocation,
          operation: "mutation" as const,
          "effect/context": Context.make(Invocation, invocation),
        };
      };
      const route = bindRpcDatabaseProcedure(
        createProjectProcedures(schema)
          .procedure.use(createDatabaseMiddleware(relations, "automatic", schema))
          .input(v.picklist(["ordinary", "caught", "manual", "manual-null", "manual-nested-null", "input"]))
          .handler(async ({ context, input }) => {
            await context.db.execute(sql`insert into writes values (1)`);
            if (input === "input") {
              try {
                // SAFETY: deliberately invalid input exercises the encoder validation failure contract.
                textCodec.encode(123 as never);
              } catch {}
            } else if (input === "manual-nested-null") {
              try {
                await context.db.query.items.findMany({ with: { children: { extras: { invalid: missing() } } } });
              } catch {}
            } else if (input === "manual" || input === "manual-null") {
              try {
                await context.db
                  .select({ invalid: input === "manual" ? manual("abc") : missing() })
                  .from(sql`(values (1)) fixture(id)`);
              } catch {}
            } else if (input === "caught") {
              try {
                await context.db.select({ invalid: bad("abc") }).from(sql`(values (1)) fixture(id)`);
              } catch {}
            } else await context.db.select({ invalid: bad("abc") }).from(sql`(values (1)) fixture(id)`);
            return "done";
          }),
        {
          connection,
          replay: { metadataNamespace: "loom_fixture_meta", deployment: "fixture" },
          authorize: async () => {},
        },
      );
      await assert.rejects(call(route, "ordinary", { context: contextFor() }));
      await assert.rejects(call(route, "caught", { context: contextFor() }));
      await assert.rejects(call(route, "manual", { context: contextFor() }));
      await assert.rejects(call(route, "manual-null", { context: contextFor() }));
      await assert.rejects(call(route, "manual-nested-null", { context: contextFor() }));
      expect((await connection.db.execute(sql`select * from writes`)).rows).toEqual([]);
      expect(await call(route, "input", { context: contextFor() })).toBe("done");
      expect((await connection.db.execute(sql`select * from writes`)).rows).toEqual([{ value: 1 }]);
    } finally {
      await connection.close();
    }
  });
});

test("native results preserve RETURNING, aliases, nested RQB, nullable joins and volatile ordering", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(
      (fields) => ({
        items: { title: fields.text().notNull() },
        children: { title: fields.text().notNull(), parentId: fields.reference("items") },
      }),
      { namespace: "public" },
    );
    const relations = defineRelations(schema.tables, (r) => ({
      items: { children: r.many.children({ from: r.items._id, to: r.children.parentId }) },
      children: { parent: r.one.items({ from: r.children.parentId, to: r.items._id }) },
    }));
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    const length = fixtureFunction("length", [textCodec] as const, floatCodec);
    try {
      await connection.db.execute(
        sql`create table items ("_id" uuid primary key default uuidv7(), "_createdAt" bigint not null default 1, title text not null); create table children ("_id" uuid primary key default uuidv7(), "_createdAt" bigint not null default 1, title text not null, parent_id uuid); create table counts (value int not null); insert into counts values (0); create function volatile_count() returns int volatile language plpgsql as $$begin update counts set value=value+1; return (select value from counts); end$$; create function missing() returns text language sql as 'select null::text'; create function precise() returns numeric language sql as 'select 9223372036854775807.123456789::numeric'; create function bounded() returns bigint[] language sql as 'select ''[0:1]={1,9223372036854775807}''::bigint[]'`,
      );
      await connection.transaction(async (db) => {
        const returning = await db
          .insert(schema.tables.items)
          .values([{ title: "ab" }, { title: "abcdefghij" }])
          .returning({ title: schema.tables.items.title, length: length(schema.tables.items.title) });
        expect(returning).toEqual([
          { title: "ab", length: 2 },
          { title: "abcdefghij", length: 10 },
        ]);
        const [parent] = await db
          .select({ id: schema.tables.items._id })
          .from(schema.tables.items)
          .where(sql`${schema.tables.items.title} = 'ab'`);
        await db.insert(schema.tables.children).values([{ title: "child", parentId: parent!.id }, { title: "orphan" }]);
        const score = length(schema.tables.items.title).as("score");
        expect(await db.select({ score }).from(schema.tables.items).orderBy(score)).toEqual([
          { score: 2 },
          { score: 10 },
        ]);
        expect(await db.select({ score }).from(schema.tables.items).orderBy(asc(score))).toEqual([
          { score: 2 },
          { score: 10 },
        ]);
        expect(await db.select({ score }).from(schema.tables.items).orderBy(desc(score))).toEqual([
          { score: 10 },
          { score: 2 },
        ]);
        expect(
          await db
            .select({ score })
            .from(schema.tables.items)
            .unionAll(db.select({ score: length("x").as("score") }).from(sql`(values (1)) fixture(id)`))
            .orderBy(sql`score`),
        ).toEqual([{ score: 1 }, { score: 2 }, { score: 10 }]);
        const subquery = db.select({ score }).from(schema.tables.items).as("scored");
        expect(
          await db
            .select({ score: subquery.score })
            .from(subquery)
            .where(gt(subquery.score, 1))
            .orderBy(subquery.score),
        ).toEqual([{ score: 2 }, { score: 10 }]);
        expect(
          await db.query.items.findMany({
            columns: { title: true },
            extras: { length: (table) => length(table.title) },
            orderBy: { title: "asc" },
          }),
        ).toEqual([
          { title: "ab", length: 2 },
          { title: "abcdefghij", length: 10 },
        ]);
        const precise = createSqlFunction({
          ...queryContract,
          schema: "public",
          name: "precise",
          member: "fixture:precise",
          arguments: [] as const,
          result: numericCodec,
        });
        const bounded = createSqlFunction({
          ...queryContract,
          schema: "public",
          name: "bounded",
          member: "fixture:bounded",
          arguments: [] as const,
          result: arrayCodec(integerCodec),
        });
        const nullValue = createExtensionCodec({
          id: "fixture:null-transform",
          input: v.string(),
          output: v.string(),
          transport: "native",
          encode: (value) => value,
          decode: (value) => (value === null ? "from-null" : value),
        });
        const missing = createSqlFunction({
          ...queryContract,
          schema: "public",
          name: "missing",
          member: "fixture:null",
          arguments: [] as const,
          result: nullValue,
        });
        const nullable = createSqlFunction({
          ...queryContract,
          schema: "public",
          name: "missing",
          member: "fixture:nullable",
          arguments: [] as const,
          result: nullableCodec(textCodec),
        });
        const nested = await db.query.items.findMany({
          columns: { title: true },
          orderBy: { title: "asc" },
          extras: { missing: missing(), nullable: nullable() },
          with: {
            children: {
              columns: { title: true },
              extras: {
                length: (table) => length(table.title),
                exact: precise(),
                bounded: bounded(),
                missing: missing(),
                nullable: nullable(),
              },
            },
          },
        });
        expect(nested).toEqual([
          {
            title: "ab",
            missing: "from-null",
            nullable: null,
            children: [
              {
                title: "child",
                length: 5,
                exact: "9223372036854775807.123456789",
                bounded: { dimensions: [{ lowerBound: 0, length: 2 }], values: [1n, 9223372036854775807n] },
                missing: "from-null",
                nullable: null,
              },
            ],
          },
          { title: "abcdefghij", missing: "from-null", nullable: null, children: [] },
        ]);
        expect(
          await db.query.children.findMany({
            columns: { title: true },
            orderBy: { title: "asc" },
            with: { parent: { columns: { title: true }, extras: { missing: missing() } } },
          }),
        ).toEqual([
          { title: "child", parent: { title: "ab", missing: "from-null" } },
          { title: "orphan", parent: null },
        ]);
        expect(
          await db.select({ transformed: missing(), nullable: nullable() }).from(sql`(values (1)) fixture(id)`),
        ).toEqual([{ transformed: "from-null", nullable: null }]);
        expect(
          await db.query.items.findFirst({
            columns: { title: true },
            orderBy: { title: "asc" },
            extras: { transformed: missing(), nullable: nullable() },
          }),
        ).toEqual({ title: "ab", transformed: "from-null", nullable: null });
        const nullableLength = createSqlFunction({
          ...queryContract,
          schema: "pg_catalog",
          name: "length",
          member: "fixture:nullable-length",
          arguments: [textCodec] as const,
          result: nullableCodec(floatCodec),
        });
        const joined = await db
          .select({
            child: { title: schema.tables.children.title, id: schema.tables.children._id },
            length: nullableLength(schema.tables.children.title),
          })
          .from(schema.tables.items)
          .leftJoin(schema.tables.children, sql`${schema.tables.children.parentId} = ${schema.tables.items._id}`)
          .orderBy(schema.tables.items.title);
        expect(joined.map(({ child, length }) => ({ child: child?.title ?? null, length }))).toEqual([
          { child: "child", length: 5 },
          { child: null, length: null },
        ]);
        const counter = createSqlFunction({
          ...queryContract,
          schema: "public",
          name: "volatile_count",
          member: "fixture:volatile",
          arguments: [] as const,
          result: floatCodec,
        });
        const count = counter().as("count");
        expect(
          await db
            .select({ count })
            .from(sql`(values (1), (2)) fixture(id)`)
            .orderBy(asc(count)),
        ).toEqual([{ count: 1 }, { count: 2 }]);
      });
      expect((await connection.db.execute(sql`select value from counts`)).rows).toEqual([{ value: 2 }]);
      const nonnull = createSqlFunction({
        ...queryContract,
        schema: "public",
        name: "missing",
        member: "fixture:nonnull",
        arguments: [] as const,
        result: textCodec,
      });
      await assert.rejects(
        connection.transaction((db) =>
          db.query.items.findMany({
            columns: { title: true },
            with: { children: { extras: { rejected: nonnull() } } },
          }),
        ),
      );
    } finally {
      await connection.close();
    }
  });
});

test("direct native query promises remain within their invocation", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      expect(
        await connection.transaction((db) => db.select({ value: sql<number>`1` }).from(sql`(values (1)) fixture(id)`)),
      ).toEqual([{ value: 1 }]);
    } finally {
      await connection.close();
    }
  });
});

test("ordinary arrays and raw execute keep driver results beside an exact extension array", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const arrays = pgTable("arrays", {
      texts: text().array(),
      integers: integer().array(),
      bigints: bigint({ mode: "bigint" }).array(),
      booleans: boolean().array(),
      json: jsonb().array(),
    });
    const exact = createSqlFunction({
      ...queryContract,
      schema: "public",
      name: "bounded",
      member: "fixture:bounded",
      arguments: [] as const,
      result: arrayCodec(floatCodec),
    });
    try {
      await connection.db.execute(
        sql`create table arrays (texts text[], integers integer[], bigints bigint[], booleans boolean[], json jsonb[]); insert into arrays values (ARRAY['a','b'], ARRAY[1,2], ARRAY[9223372036854775807::bigint], ARRAY[true,false], ARRAY['{"values":[1,2]}'::jsonb]); create function bounded() returns integer[] language sql as 'select ''[0:1]={1,2}''::integer[]'`,
      );
      const rows = await connection.transaction((db) =>
        db
          .select({
            texts: arrays.texts,
            integers: arrays.integers,
            bigints: arrays.bigints,
            booleans: arrays.booleans,
            json: arrays.json,
            exact: exact(),
          })
          .from(arrays),
      );
      expect(rows).toEqual([
        {
          texts: ["a", "b"],
          integers: [1, 2],
          bigints: [9223372036854775807n],
          booleans: [true, false],
          json: [{ values: [1, 2] }],
          exact: { dimensions: [{ lowerBound: 0, length: 2 }], values: [1, 2] },
        },
      ]);
      expect(
        (await connection.db.execute(sql`select texts, integers, bigints, booleans, json from arrays`)).rows,
      ).toEqual([
        {
          texts: ["a", "b"],
          integers: [1, 2],
          bigints: ["9223372036854775807"],
          booleans: [true, false],
          json: [{ values: [1, 2] }],
        },
      ]);
    } finally {
      await connection.close();
    }
  });
});

test("unconfigured external Drizzle cannot bypass checked result decoding", async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Pool({ connectionString: url });
    const external = drizzle({ client });
    const missing = createSqlFunction({
      ...queryContract,
      schema: "public",
      name: "missing",
      member: "fixture:missing",
      arguments: [] as const,
      result: textCodec,
    });
    try {
      await external.execute(sql`create function missing() returns text language sql as 'select null::text'`);
      expect(await external.select({ value: sql<number>`1` }).from(sql`(values (1)) fixture(id)`)).toEqual([
        { value: 1 },
      ]);
      await assert.rejects(
        external.select({ missing: missing() }).from(sql`(values (1)) fixture(id)`),
        /Loom database connection/,
      );
    } finally {
      await client.end();
    }
  });
});
