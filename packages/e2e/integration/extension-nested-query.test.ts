import { test, expect } from "bun:test";
import { defineRelations, eq, and, gte, sql, type SQL } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context } from "effect";
import * as v from "valibot";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createProjectProcedures, type ProcedureContext } from "../../../apps/loom/src/core/server/rpc/procedure";
import { bindRpcDatabaseProcedure, createDatabaseMiddleware } from "../../../apps/loom/src/core/server/rpc/database";
import { Invocation } from "../../../apps/loom/src/core/server/effect/runtime";
import { nestedQuery, nestedQueryText, type NestedQuery } from "../../../apps/loom/src/core/extensions/nested-query";
import { extensionRows } from "../../../apps/loom/src/core/extensions/rows";
import { createSqlFunction, withExtensionSqlExecution } from "../../../apps/loom/src/core/extensions/sql";
import {
  textCodec,
  integerCodec,
  nullableCodec,
  compositeCodec,
  arrayCodec,
  numericCodec,
  createExtensionCodec,
  withCodecSqlType,
} from "../../../apps/loom/src/core/extensions/codecs";
import { createExtensionField } from "../../../apps/loom/src/core/extensions/fields";
import { Field } from "../../../apps/loom/src/core/schema/fields";
import { text, timestamp } from "drizzle-orm/pg-core";
import pg from "pg";
import { frameworkMigrations } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import { installRevisionTracking } from "../../../apps/loom/src/tooling/migrations/revisions";
import { createRevisionReader } from "../../../apps/loom/src/core/server/realtime/revisions";
import { createRevisionCoordinator } from "../../../apps/loom/src/core/server/realtime/coordinator";
import { evaluateSnapshot } from "../../../apps/loom/src/core/server/rpc/snapshot";

test("managed PostgreSQL SPI source/category SQL and checked anonymous records retain invocation authority", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(
      (s) => ({
        edges: defineTable({
          owner: s.text().notNull(),
          row: s.text().notNull(),
          category: s.text().notNull(),
          value: s.bigint().notNull(),
        }),
        categories: defineTable({ owner: s.text().notNull(), category: s.text().notNull() }),
        labels: defineTable({ owner: s.text().notNull(), label: s.text().notNull() }),
        links: defineTable({
          owner: s.text().notNull(),
          edgeId: s.reference("edges").notNull(),
          labelId: s.reference("labels").notNull(),
        }),
      }),
      { namespace: "app" },
    );
    const relations = defineRelations(schema.tables, (r) => ({
      edges: {
        labels: r.many.labels({ from: r.edges._id.through(r.links.edgeId), to: r.labels._id.through(r.links.labelId) }),
      },
    }));
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      await connection.db
        .execute(sql`create schema app; create schema extensions; create extension tablefunc with schema extensions;
        create table app.edges (_id uuid default gen_random_uuid(), "_createdAt" bigint default 0, owner text, row text, category text, value bigint);
        create table app.categories (_id uuid default gen_random_uuid(), "_createdAt" bigint default 0, owner text, category text);
        create table app.labels (_id uuid default gen_random_uuid(), "_createdAt" bigint default 0, owner text, label text);
        create table app.links (_id uuid default gen_random_uuid(), "_createdAt" bigint default 0, owner text, edge_id uuid, label_id uuid)`);
      const seeded = await connection.db
        .insert(schema.tables.edges)
        .values([
          ...Array.from({ length: 60 }, (_, index) => ({
            owner: "alice",
            row: `row${String(index).padStart(2, "0")}`,
            category: "x'\\$1",
            value: 9007199254740993n + BigInt(index),
          })),
          { owner: "bob", row: "private", category: "x'\\$1", value: 0n },
        ])
        .returning();
      const labels = await connection.db
        .insert(schema.tables.labels)
        .values([
          { owner: "alice", label: "forbidden" },
          { owner: "bob", label: "forbidden" },
        ])
        .returning();
      await connection.db.insert(schema.tables.links).values([
        { owner: "alice", edgeId: seeded[1]!._id, labelId: labels[0]!._id },
        { owner: "alice", edgeId: seeded[2]!._id, labelId: labels[1]!._id },
        { owner: "bob", edgeId: seeded[3]!._id, labelId: labels[0]!._id },
      ]);
      await connection.db.insert(schema.tables.categories).values([
        { owner: "alice", category: "x'\\$1" },
        { owner: "bob", category: "private" },
      ]);
      await connection.db.execute(sql`create schema loom_meta`);
      for (const migration of frameworkMigrations("loom_meta"))
        for (const statement of migration.statements) await connection.db.execute(sql.raw(statement));
      const admin = new pg.Client({ connectionString: url });
      await admin.connect();
      try {
        await admin.query("BEGIN");
        await installRevisionTracking(admin, "app", "loom_meta", ["edges", "categories", "labels", "links"]);
        await admin.query("COMMIT");
      } finally {
        await admin.end();
      }
      const revisions = createRevisionReader({
        namespace: "app",
        metadataNamespace: "loom_meta",
        tables: ["edges", "categories", "labels", "links"],
      });
      const { procedure, validators } = createProjectProcedures(schema, relations);
      const source = validators.tables.edges.search({
        columns: ["row", "category", "value"],
        filter: ["category", "value"],
        order: ["row", "category"],
        scope: {
          name: "owner",
          version: "1",
          where: ({ table, identity }) => eq(table.owner, identity?.subject ?? ""),
        },
        through: {
          links: {
            name: "link-owner",
            version: "1",
            where: ({ table, identity }) => eq(table.owner, identity?.subject ?? ""),
          },
        },
        relations: {
          labels: {
            columns: ["label"],
            filter: ["label"],
            scope: {
              name: "label-owner",
              version: "1",
              where: ({ table, identity }) => eq(table.owner, identity?.subject ?? ""),
            },
          },
        },
      });
      const category = validators.tables.categories.search({
        columns: ["category"],
        filter: ["category"],
        order: ["category"],
        scope: {
          name: "owner",
          version: "1",
          where: ({ table, identity }) => eq(table.owner, identity?.subject ?? ""),
        },
      });
      const crosstab = createSqlFunction({
        schema: "extensions",
        name: "crosstab",
        member: "fixture:tablefunc:crosstab",
        arguments: [textCodec, textCodec] as const,
        result: compositeCodec("record", { row: textCodec, value: nullableCodec(integerCodec) }),
        dependencies: [],
        observability: "tables",
        authority: "query",
      });
      const read = createDatabaseMiddleware(relations, "read", schema);
      const options = {
        connection,
        revisions,
        replay: { metadataNamespace: "loom_unused", deployment: "nested-fixture" },
        authorize: async () => {},
      };
      function context(subject: string): ProcedureContext {
        const invocation = {
          identity: { issuer: "test", subject },
          requestId: crypto.randomUUID(),
          signal: new AbortController().signal,
        };
        return { ...invocation, "effect/context": Context.make(Invocation, invocation) };
      }
      let retained: NestedQuery<object> | undefined;
      let retainedExpression: SQL<string> | undefined;
      let retainedPrepared: { execute(): Promise<readonly { readonly text: string }[]> } | undefined;
      const pivot = bindRpcDatabaseProcedure(
        procedure
          .use(read)
          .input(v.optional(v.boolean()))
          .output(v.array(v.object({ row: v.string(), value: v.nullable(v.bigint()) })))
          .handler(async ({ context, input }) => {
            const edges = nestedQuery(source, {
              columns: { row: true, category: true, value: true },
              where: {
                category: { eq: "x'\\$1" },
                ...(input && { NOT: { relations: { labels: { some: { label: { eq: "forbidden" } } } } } }),
              },
              orderBy: [
                { field: "row", direction: "asc" },
                { field: "category", direction: "asc" },
              ],
            });
            const categories = nestedQuery(category, {
              columns: { category: true },
              orderBy: [{ field: "category", direction: "asc" }],
            });
            const table = extensionRows(crosstab(nestedQueryText(edges), nestedQueryText(categories)), "pivot", {
              row: textCodec,
              value: nullableCodec(integerCodec),
            });
            const result = await context.db.select(table.columns).from(table.from);
            retained = edges;
            retainedExpression = nestedQueryText(edges);
            retainedPrepared = context.db
              .select({ text: retainedExpression })
              .from(sql`(values (1)) as fixture(id)`)
              .prepare("retained_nested");
            return result;
          }),
        options,
      );
      const result = await call(pivot, undefined, { context: context("alice") });
      expect(result).toHaveLength(60); // No default search page limit can discard edges.
      expect(result[0]).toEqual({ row: "row00", value: 9007199254740993n });
      expect(result.at(-1)).toEqual({ row: "row59", value: 9007199254741052n });
      const dependencies = new Set<string>();
      const related = await withExtensionSqlExecution(
        {
          check: (contract) => {
            for (const table of contract.dependencies) dependencies.add(table);
          },
        },
        () => call(pivot, true, { context: context("alice") }),
      );
      expect(related).toHaveLength(59);
      expect(related.some((row) => row.row === "row01")).toBe(false);
      expect(related.some((row) => row.row === "row02")).toBe(true); // Other tenant's label cannot change membership.
      expect(related.some((row) => row.row === "row03")).toBe(true); // Other tenant's junction cannot change membership.
      expect(dependencies).toEqual(new Set(["edges", "labels", "links", "categories"]));
      const events: { row: string; value: bigint | null }[][] = [];
      const failures: Error[] = [];
      const coordinator = createRevisionCoordinator({
        readRevisions: () => revisions(connection.db),
        intervalMs: 60_000,
      });
      try {
        coordinator.subscribe(
          { expiresAt: Math.floor(Date.now() / 1000) + 60 },
          {
            evaluate: () => evaluateSnapshot(() => call(pivot, true, { context: context("alice") })),
            publish: (rows) => {
              events.push(rows);
              return true;
            },
            close: (_reason, error) => {
              if (error) failures.push(error);
            },
          },
        );
        await coordinator.poll();
        expect(events.map((rows) => rows.length)).toEqual([59]);
        await connection.transaction((db) =>
          db.update(schema.tables.labels).set({ label: "allowed" }).where(eq(schema.tables.labels._id, labels[0]!._id)),
        );
        await coordinator.poll();
        expect(events.map((rows) => rows.length)).toEqual([59, 60]);
        expect(failures).toEqual([]);
      } finally {
        await coordinator.stop();
      }
      const partialRevisions = createRevisionReader({
        namespace: "app",
        metadataNamespace: "loom_meta",
        tables: ["edges", "categories"],
      });
      const untracked = bindRpcDatabaseProcedure(
        procedure
          .use(read)
          .output(v.array(v.object({ row: v.string(), value: v.nullable(v.bigint()) })))
          .handler(({ context }) => {
            const edges = nestedQuery(source, {
              columns: { row: true, category: true, value: true },
              where: { NOT: { relations: { labels: { some: { label: { eq: "forbidden" } } } } } },
              orderBy: [
                { field: "row", direction: "asc" },
                { field: "category", direction: "asc" },
              ],
            });
            const categories = nestedQuery(category, {
              columns: { category: true },
              orderBy: [{ field: "category", direction: "asc" }],
            });
            const rows = extensionRows(crosstab(nestedQueryText(edges), nestedQueryText(categories)), "pivot", {
              row: textCodec,
              value: nullableCodec(integerCodec),
            });
            return context.db.select(rows.columns).from(rows.from);
          }),
        { ...options, revisions: partialRevisions },
      );
      await Promise.resolve(
        expect(evaluateSnapshot(() => call(untracked, undefined, { context: context("alice") }))).rejects.toThrow(
          "unknown table dependency",
        ),
      );
      expect(() => nestedQueryText(retained!)).toThrow("invocation");
      for (const mode of ["opaque", "expression", "prepared"] as const) {
        const reuse = bindRpcDatabaseProcedure(
          procedure
            .use(read)
            .output(v.boolean())
            .handler(async ({ context }) => {
              try {
                if (mode === "opaque") nestedQueryText(retained!);
                else if (mode === "expression")
                  await context.db.select({ text: retainedExpression! }).from(sql`(values (1)) as fixture(id)`);
                else await retainedPrepared!.execute();
              } catch {
                /* A caught ownership violation must still abort this invocation. */
              }
              return true;
            }),
          options,
        );
        await Promise.resolve(expect(call(reuse, undefined, { context: context("bob") })).rejects.toThrow());
      }
      const otherGraph = defineRelations(schema.tables);
      const otherRead = createDatabaseMiddleware(otherGraph, "read", schema);
      const wrongGraph = bindRpcDatabaseProcedure(
        procedure
          .use(otherRead)
          .output(v.boolean())
          .handler(() => {
            try {
              nestedQuery(source, { columns: { row: true } });
            } catch {}
            return true;
          }),
        options,
      );
      await Promise.resolve(expect(call(wrongGraph, undefined, { context: context("alice") })).rejects.toThrow());
    } finally {
      await connection.close();
    }
  });
});

test("SPI materialization retains custom field encoders, array bounds, exact numeric and NULL", async () => {
  await withExtensionDatabase(async (url) => {
    const array = arrayCodec(integerCodec);
    const nativeArray = createExtensionCodec({
      id: "fixture:native-array",
      input: v.array(v.nullable(v.bigint())),
      output: v.array(v.nullable(v.bigint())),
      transport: "text",
      encode: (values) => array.encode({ dimensions: [{ lowerBound: -2, length: values.length }], values }),
      decode: (value) => array.decode(value).values,
    });
    const semantic = createExtensionCodec({
      id: "fixture:semantic",
      input: v.pipe(v.string(), v.startsWith("semantic:")),
      output: v.pipe(v.string(), v.startsWith("semantic:")),
      transport: "text",
      encode: (value) => value.slice(9),
      decode: (value) => `semantic:${v.parse(v.string(), value)}`,
    });
    const fixture = {
      name: "fixture",
      version: "1",
      schema: "pg_catalog",
      apiSupport: { status: "verified" as const, digest: "fixture" },
    };
    const disabled = { filter: false, comparison: false, order: false, text: false } as const;
    const strings = arrayCodec(textCodec);
    const nativeStrings = createExtensionCodec({
      id: "fixture:native-text-array",
      input: v.array(v.string()),
      output: v.array(v.string()),
      transport: "native",
      encode: (values) => values,
      decode: (value) => value,
    });
    const stringArray = createExtensionField({
      extension: fixture,
      member: "fixture:text[]",
      type: "text",
      array: true,
      codec: nativeStrings,
      value: { kind: "array", items: { kind: "string" } },
      search: disabled,
    });
    const schema = defineSchema(
      (s) => ({
        values: {
          owner: s.text().notNull(),
          amount: s.numeric({ precision: 38, scale: 24 }).notNull(),
          missing: s.text(),
          items: createExtensionField({
            extension: fixture,
            member: "fixture:int8[]",
            type: "int8",
            array: true,
            codec: nativeArray,
            value: { kind: "array", items: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] } },
            search: disabled,
          }).notNull(),
          semantic: createExtensionField({
            extension: { ...fixture, schema: "extensions" },
            member: "fixture:semantic",
            type: "semantic",
            codec: semantic,
            value: { kind: "string" },
            search: disabled,
          }).notNull(),
          nativeItems: new Field((name) => text(name).array(), stringArray.metadata).notNull(),
        },
      }),
      { namespace: "app" },
    );
    const relations = defineRelations(schema.tables);
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      await connection.db
        .execute(sql`create schema app; create schema extensions; create domain extensions.semantic as text;
        create table app.values (_id uuid default gen_random_uuid(), "_createdAt" bigint default 0, owner text, amount numeric(38,24), missing text, items bigint[], semantic extensions.semantic, native_items text[]);
        create function extensions.run_query(text) returns setof record language plpgsql as 'begin return query execute $1; end'`);
      const itemValues = [9007199254740993n, null];
      const domain = "semantic:O'Reilly\\$1";
      const amount = "0.000000000000000001000001";
      await connection.db
        .insert(schema.tables.values)
        .values({ owner: "alice", amount, missing: null, items: itemValues, semantic: domain, nativeItems: ["x"] });
      const { procedure, validators } = createProjectProcedures(schema, relations);
      const source = validators.tables.values.search({
        columns: ["items", "semantic", "amount", "missing", "nativeItems"],
        filter: ["amount", "missing"],
        scope: {
          name: "owner+native-values",
          version: "1",
          where: ({ table, identity }) =>
            and(
              eq(table.owner, identity?.subject ?? ""),
              eq(table.items, itemValues),
              eq(table.semantic, domain),
              eq(table.nativeItems, ["x"]),
            )!,
        },
      });
      const read = createDatabaseMiddleware(relations, "read", schema);
      const run = createSqlFunction({
        schema: "extensions",
        name: "run_query",
        member: "fixture:SPI",
        arguments: [textCodec] as const,
        result: textCodec,
        dependencies: [],
        observability: "tables",
        authority: "query",
      });
      const options = {
        connection,
        replay: { metadataNamespace: "loom_unused", deployment: "nested-codecs" },
        authorize: async () => {},
      };
      const invocation = {
        identity: { issuer: "test", subject: "alice" },
        requestId: crypto.randomUUID(),
        signal: new AbortController().signal,
      };
      const context = { ...invocation, "effect/context": Context.make(Invocation, invocation) };
      const query = bindRpcDatabaseProcedure(
        procedure
          .use(read)
          .output(
            v.array(
              v.object({
                items: v.unknown(),
                nativeItems: v.unknown(),
                semantic: v.string(),
                amount: v.union([v.string(), v.object({ nonfinite: v.picklist(["NaN", "Infinity", "-Infinity"]) })]),
                missing: v.nullable(v.string()),
              }),
            ),
          )
          .handler(async ({ context }) => {
            const input = nestedQuery(source, {
              columns: { items: true, semantic: true, amount: true, missing: true, nativeItems: true },
              where: { amount: { eq: amount }, missing: { isNull: true } },
            });
            const rows = extensionRows(run(nestedQueryText(input)), "record", {
              items: array,
              semantic: withCodecSqlType(semantic, { schema: "extensions", name: "semantic" }),
              amount: numericCodec,
              missing: nullableCodec(textCodec),
              nativeItems: strings,
            });
            return context.db.select(rows.columns).from(rows.from);
          }),
        options,
      );
      expect(await call(query, undefined, { context })).toEqual([
        {
          items: { dimensions: [{ lowerBound: -2, length: 2 }], values: itemValues },
          semantic: domain,
          amount,
          missing: null,
          nativeItems: { dimensions: [{ lowerBound: 1, length: 1 }], values: ["x"] },
        },
      ]);
      const badRecord = bindRpcDatabaseProcedure(
        procedure
          .use(read)
          .output(v.boolean())
          .handler(async ({ context }) => {
            try {
              const rows = extensionRows(sql`json_to_record(${JSON.stringify({ value: null })}::json)`, "bad", {
                value: integerCodec,
              });
              await context.db.select(rows.columns).from(rows.from);
            } catch {}
            return true;
          }),
        options,
      );
      await Promise.resolve(expect(call(badRecord, undefined, { context })).rejects.toThrow());
    } finally {
      await connection.close();
    }
  });
});

test("SPI policy comparisons retain nominal parameter precision instead of rounding to column typmods", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(
      (s) => ({
        amounts: {
          value: s.numeric({ precision: 4, scale: 2 }).notNull(),
          at: new Field((name) => timestamp(name, { precision: 3, withTimezone: true }), {
            kind: "timestamp",
            notNull: false,
            unique: false,
          }).notNull(),
        },
      }),
      { namespace: "app" },
    );
    const relations = defineRelations(schema.tables);
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      await connection.db.execute(sql`create schema app;
        create table app.amounts (_id uuid default gen_random_uuid(), "_createdAt" bigint default 0, value numeric(4,2), at timestamp(3) with time zone);
        create function app.run_query(text) returns setof record language plpgsql as 'begin return query execute $1; end'`);
      await connection.db.insert(schema.tables.amounts).values([
        { value: "1.23", at: new Date("2026-10-02T00:00:00.124Z") },
        { value: "1.24", at: new Date("2026-10-02T00:00:00.124Z") },
      ]);
      const { procedure, validators } = createProjectProcedures(schema, relations);
      const source = validators.tables.amounts.search({
        columns: ["value"],
        scope: {
          name: "exact-threshold",
          version: "1",
          where: ({ table }) => and(gte(table.value, "1.234"), gte(table.at, new Date("2026-10-02T00:00:00.123Z")))!,
        },
      });
      const run = createSqlFunction({
        schema: "app",
        name: "run_query",
        member: "fixture:SPI:precision",
        arguments: [textCodec] as const,
        result: textCodec,
        dependencies: [],
        observability: "tables",
        authority: "query",
      });
      const query = bindRpcDatabaseProcedure(
        procedure
          .use(createDatabaseMiddleware(relations, "read", schema))
          .output(
            v.array(
              v.object({
                value: v.union([v.string(), v.object({ nonfinite: v.picklist(["NaN", "Infinity", "-Infinity"]) })]),
              }),
            ),
          )
          .handler(({ context }) => {
            const input = nestedQuery(source, { columns: { value: true } });
            const rows = extensionRows(run(nestedQueryText(input)), "record", { value: numericCodec });
            return context.db.select(rows.columns).from(rows.from);
          }),
        {
          connection,
          replay: { metadataNamespace: "loom_unused", deployment: "nested-precision" },
          authorize: async () => {},
        },
      );
      const invocation = { identity: null, requestId: crypto.randomUUID(), signal: new AbortController().signal };
      const result = await call(query, undefined, {
        context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
      });
      expect(result).toEqual([{ value: "1.24" }]);
    } finally {
      await connection.close();
    }
  });
});
