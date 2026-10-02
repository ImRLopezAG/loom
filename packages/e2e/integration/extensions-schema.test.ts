import { expect, test } from "bun:test";
import * as v from "valibot";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { pgSchema, text } from "drizzle-orm/pg-core";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { createExtensionField, createExtensionIndex } from "../../../apps/loom/src/core/extensions/fields";
import { textCodec, floatCodec, arrayCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { createSqlFunction, withExtensionSqlExecution } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import {
  createSnapshot,
  emptySnapshot,
  inspectSnapshot,
  migrationStatements,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";
import { evaluateSnapshot, captureSnapshotRevisions } from "../../../apps/loom/src/core/server/rpc/snapshot";
import { frameworkMigrations } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import { installRevisionTracking } from "../../../apps/loom/src/tooling/migrations/revisions";
import { createRevisionReader } from "../../../apps/loom/src/core/server/realtime/revisions";
import { createRevisionCoordinator } from "../../../apps/loom/src/core/server/realtime/coordinator";
import { createSearchValidators } from "../../../apps/loom/src/core/search/contract";
import { searchSchemaMetadata } from "../../../apps/loom/src/core/search/metadata";
import { prepareSearchPage, finishSearchPage } from "../../../apps/loom/src/core/search/pagination";
import type { SearchPublicSelection } from "../../../apps/loom/src/core/search/public";
import { storageRows } from "../../../apps/loom/src/core/validation/encoding";
const descriptor = {
  name: "citext",
  version: "1.8",
  schema: "custom",
  apiSupport: { status: "verified" as const, digest: "local-fixture-contract" },
};
const operators = {
  eq: { member: "operator:citext.=", schema: "custom", name: "=", operand: "field" },
  ne: { member: "operator:citext.<>", schema: "custom", name: "<>", operand: "field" },
  gt: { member: "operator:citext.>", schema: "custom", name: ">", operand: "field" },
  gte: { member: "operator:citext.>=", schema: "custom", name: ">=", operand: "field" },
  lt: { member: "operator:citext.<", schema: "custom", name: "<", operand: "field" },
  lte: { member: "operator:citext.<=", schema: "custom", name: "<=", operand: "field" },
  like: { member: "operator:citext.~~", schema: "custom", name: "~~", operand: { schema: "pg_catalog", type: "text" } },
  ilike: {
    member: "operator:citext.~~*",
    schema: "custom",
    name: "~~*",
    operand: { schema: "pg_catalog", type: "text" },
  },
} as const;
const field = () =>
  createExtensionField({
    extension: descriptor,
    member: "type:$extension:citext.citext",
    type: "citext",
    operators,
    codec: textCodec,
    value: { kind: "string" },
    search: { filter: true, order: true, comparison: true, text: true },
  });

test("custom extension fields/indexes round-trip through native storage and migration introspection", async () => {
  await withExtensionDatabase(async (url) => {
    const pattern = createExtensionIndex({
      extension: descriptor,
      member: "opclass:$extension:citext.citext_pattern_ops/btree",
      method: "btree",
      opclass: "citext_pattern_ops",
      type: "citext",
    });
    const standard = createExtensionIndex({
      extension: descriptor,
      member: "opclass:$extension:citext.citext_ops/btree",
      method: "btree",
      opclass: "citext_ops",
      type: "citext",
      default: true,
    });
    const labels = createExtensionField({
      extension: descriptor,
      member: "type:$extension:citext.citext",
      type: "citext",
      array: true,
      codec: arrayCodec(textCodec),
      value: {
        kind: "object",
        properties: {
          dimensions: {
            kind: "array",
            items: {
              kind: "object",
              properties: { lowerBound: { kind: "number", integer: true }, length: { kind: "number", integer: true } },
            },
          },
          values: { kind: "array", items: { kind: "string" } },
        },
      },
      search: { filter: false, comparison: false, order: false, text: false },
    }).default({ dimensions: [{ lowerBound: 0, length: 2 }], values: ["Alpha", "Beta"] });
    const schema = defineSchema(
      () => ({
        documents: defineTable(
          { title: field().notNull().default("O'Reilly"), alternate: field().unique(), labels },
          {
            indexes: [
              { fields: ["title"], extension: pattern, with: { fillfactor: 80 } },
              { fields: ["title"], extension: standard },
            ],
          },
        ),
      }),
      { namespace: "app" },
    );
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(sql`create schema custom; create extension citext with schema custom`);
      const desired = await createSnapshot(schema);
      for (const statement of await migrationStatements(await emptySnapshot("app"), desired))
        await connection.db.execute(sql.raw(statement));
      const rows = await connection.transaction(async (db) =>
        db.insert(schema.tables.documents).values({ alternate: null }).returning(),
      );
      expect(rows[0]?.title).toBe("O'Reilly");
      expect(rows[0]?.alternate).toBeNull();
      expect(rows[0]?.labels).toEqual({ dimensions: [{ lowerBound: 0, length: 2 }], values: ["Alpha", "Beta"] });
      expect(
        (await connection.db.select({ labels: schema.tables.documents.labels }).from(schema.tables.documents))[0]
          ?.labels,
      ).toEqual(rows[0]?.labels);
      expect((await connection.db.query.documents.findMany({ columns: { labels: true } }))[0]?.labels).toEqual(
        rows[0]?.labels,
      );
      const nullLabels = await connection.db
        .insert(schema.tables.documents)
        .values({ labels: null })
        .returning({ labels: schema.tables.documents.labels });
      expect(nullLabels).toEqual([{ labels: null }]);
      expect(await schema.validators.documents.insert["~standard"].validate({ title: 123 })).toHaveProperty("issues");
      const inspected = await inspectSnapshot(connection.db, "app");
      expect(inspected.ddl).toEqual(desired.ddl);
      expect(snapshotHash(inspected)).toBe(snapshotHash(desired));
      expect(await migrationStatements(inspected, desired)).toEqual([]);
    } finally {
      await connection.close();
    }
  });
});

test("observable extension expressions republish after matching writes and reject unknown/session state", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(
      (fields) => ({ documents: { title: fields.text().notNull() }, hidden: { title: fields.text().notNull() } }),
      { namespace: "app" },
    );
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const admin = new pg.Client({ connectionString: url });
    await admin.connect();
    let coordinator: ReturnType<typeof createRevisionCoordinator> | undefined;
    try {
      await connection.db.execute(
        sql`create schema custom; create extension pg_trgm with schema custom; create schema loom_meta`,
      );
      for (const migration of frameworkMigrations("loom_meta"))
        for (const statement of migration.statements) await connection.db.execute(sql.raw(statement));
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)))
        await connection.db.execute(sql.raw(statement));
      await admin.query("BEGIN");
      await installRevisionTracking(admin, "app", "loom_meta", ["documents"]);
      await admin.query("COMMIT");
      await connection.transaction(async (db) => db.insert(schema.tables.documents).values({ title: "hello" }));
      await connection.db.insert(schema.tables.hidden).values({ title: "secret" });
      const read = createRevisionReader({ namespace: "app", metadataNamespace: "loom_meta", tables: ["documents"] });
      const definition = {
        schema: "custom",
        name: "similarity",
        member: "routine:pg_trgm.similarity",
        arguments: [textCodec, textCodec] as const,
        result: floatCodec,
        dependencies: ["documents"],
        observability: "tables" as const,
        authority: "query" as const,
      };
      const expression = createSqlFunction(definition)(schema.tables.documents.title, "hello");
      const events: { score: ReturnType<typeof floatCodec.decode> }[][] = [];
      const failures: Error[] = [];
      coordinator = createRevisionCoordinator({ readRevisions: () => read(connection.db), intervalMs: 60_000 });
      coordinator.subscribe(
        { expiresAt: Math.floor(Date.now() / 1000) + 60 },
        {
          evaluate: () =>
            evaluateSnapshot(() =>
              connection.transaction(async (db) => {
                const rows = await db.select({ score: expression }).from(schema.tables.documents);
                await captureSnapshotRevisions(db, read);
                return rows;
              }),
            ),
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
      expect(events).toEqual([[{ score: 1 }]]);
      await connection.transaction(async (db) => db.update(schema.tables.documents).set({ title: "world" }));
      await coordinator.poll();
      expect(events).toEqual([[{ score: 1 }], [{ score: 0 }]]);
      expect(failures).toEqual([]);
      for (const change of [{ dependencies: ["missing"] }, { observability: "session" as const }]) {
        const invalid = createSqlFunction({ ...definition, ...change })(schema.tables.documents.title, "hello");
        await Promise.resolve(
          expect(
            evaluateSnapshot(() =>
              connection.transaction(async (db) => {
                const rows = await db.select({ score: invalid }).from(schema.tables.documents);
                await captureSnapshotRevisions(db, read);
                return rows;
              }),
            ),
          ).rejects.toThrow(change.dependencies ? "unknown table" : "session"),
        );
      }
      const embedded = createSqlFunction(definition)(
        sql<string>`(select ${schema.tables.hidden.title} from ${schema.tables.hidden} limit 1)`,
        "hello",
      );
      const embeddedPrepared = connection.db
        .select({ score: embedded })
        .from(schema.tables.documents)
        .prepare("u4_embedded");
      await Promise.resolve(
        expect(
          evaluateSnapshot(() =>
            connection.transaction(async (db) => {
              const rows = await embeddedPrepared.execute();
              await captureSnapshotRevisions(db, read);
              return rows;
            }),
          ),
        ).rejects.toThrow("unknown table dependency: hidden"),
      );
    } finally {
      await coordinator?.stop();
      await admin.end();
      await connection.close();
    }
  });
});

test("prepared extension expressions enforce the execution-local checker after earlier compilation", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      const expression = createSqlFunction({
        schema: "pg_catalog",
        name: "upper",
        member: "fixture:external",
        arguments: [textCodec] as const,
        result: textCodec,
        dependencies: [],
        observability: "external",
        authority: "query",
      })("value");
      const prepared = connection.db
        .select({ value: expression })
        .from(sql`(values (1)) as fixture(value)`)
        .prepare("u4_prepared");
      await Promise.resolve(
        expect(
          withExtensionSqlExecution(
            {
              check: () => {
                throw new Error("Unobservable live dependency");
              },
            },
            () => prepared.execute(),
          ),
        ).rejects.toThrow("Unobservable live dependency"),
      );
      expect(await prepared.execute()).toEqual([{ value: "VALUE" }]);
      await Promise.resolve(
        expect(
          evaluateSnapshot(async () => {
            const rows = await prepared.execute();
            await captureSnapshotRevisions(connection.db, async () => ({ documents: "1" }));
            return rows;
          }),
        ).rejects.toThrow("external"),
      );
      await Promise.resolve(
        expect(
          evaluateSnapshot(async () => {
            try {
              await prepared.execute();
            } catch {
              /* Handler fallback cannot authorize an unobservable subscription. */
            }
            await captureSnapshotRevisions(connection.db, async () => ({ documents: "1" }));
            return [];
          }),
        ).rejects.toThrow("external"),
      );
      const sessionExpression = createSqlFunction({
        schema: "pg_catalog",
        name: "upper",
        member: "fixture:session",
        arguments: [textCodec] as const,
        result: textCodec,
        dependencies: [],
        observability: "session",
        authority: "query",
      })("value");
      const sessionPrepared = connection.db
        .select({ value: sessionExpression })
        .from(sql`(values (1)) as fixture(value)`)
        .prepare();
      await Promise.resolve(
        expect(
          evaluateSnapshot(async () => {
            try {
              await sessionPrepared.execute();
            } catch {
              /* Rejected session state stays rejected through fallback. */
            }
            await captureSnapshotRevisions(connection.db, async () => ({ documents: "1" }));
            return [];
          }),
        ).rejects.toThrow("session"),
      );
      await connection.db.transaction(async (tx) => {
        const nativePrepared = tx
          .select({ value: expression })
          .from(sql`(values (1)) as fixture(value)`)
          .prepare("u4_native_prepared");
        await Promise.resolve(
          expect(
            evaluateSnapshot(async () => {
              const rows = await nativePrepared.execute();
              await captureSnapshotRevisions(tx, async () => ({ documents: "1" }));
              return rows;
            }),
          ).rejects.toThrow("external"),
        );
      });
    } finally {
      await connection.close();
    }
  });
});

test("approved custom-schema citext filters and cursor traversal preserve case-insensitive semantics", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({ documents: { title: field().notNull() } }), { namespace: "app" });
    const relations = defineRelations(schema.tables);
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      await connection.db.execute(sql`create schema custom; create extension citext with schema custom`);
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)))
        await connection.db.execute(sql.raw(statement));
      await connection.db
        .insert(schema.tables.documents)
        .values([{ title: "Alpha" }, { title: "alpha" }, { title: "Beta" }, { title: "gamma" }]);
      const search = createSearchValidators(schema, relations).documents.search({
        columns: ["title"],
        filter: ["title"],
        text: ["title"],
        order: ["title"],
        scope: "public",
      });
      const runtime = searchSchemaMetadata(search.input)?.descriptor;
      if (!runtime) throw new Error("Missing search descriptor");
      const context = { branchId: "fixture", namespace: "app", contract: "documents", identity: null };
      async function page(input: SearchPublicSelection) {
        const plan = await prepareSearchPage(runtime!, input, context, "03".repeat(32));
        const { with: _relations, ...config } = plan.config;
        return finishSearchPage(plan, v.parse(storageRows, await connection.db.query.documents.findMany(config)));
      }
      expect((await page({ where: { title: { eq: "ALPHA" } } })).rows?.map((row) => row.title)).toEqual([
        "Alpha",
        "alpha",
      ]);
      expect((await page({ where: { title: { contains: "ALP" } } })).rows?.map((row) => row.title)).toEqual([
        "Alpha",
        "alpha",
      ]);
      expect(
        (await page({ where: { title: { contains: "alp", insensitive: true } } })).rows?.map((row) => row.title),
      ).toEqual(["Alpha", "alpha"]);
      for (const direction of ["asc", "desc"] as const) {
        const orderBy = [{ field: "title", direction }];
        const oracle = (
          await connection.db
            .select({ title: schema.tables.documents.title })
            .from(schema.tables.documents)
            .orderBy(
              sql`${schema.tables.documents.title} ${direction === "asc" ? sql`using operator(custom.<)` : sql`using operator(custom.>)`}`,
              schema.tables.documents._id,
            )
        ).map((row) => row.title);
        const titles = [];
        let cursor: string | null = null;
        for (let index = 0; index < 5; index++) {
          const result = await page({ orderBy, limit: 1, ...(cursor && { cursor }) });
          titles.push(...(result.rows ?? []).map((row) => row.title));
          cursor = result.nextCursor;
          if (!cursor) break;
        }
        expect(titles).toEqual(oracle);
      }
    } finally {
      await connection.close();
    }
  });
});

test("native views with constant extension projections require actual live revision coverage", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(
        sql`create schema app; create view app.hidden_view as select 'secret'::text as title; create materialized view app.hidden_materialized as select 'secret'::text as title`,
      );
      const namespace = pgSchema("app");
      const views = [
        namespace.view("hidden_view", { title: text() }).existing(),
        namespace.materializedView("hidden_materialized", { title: text() }).existing(),
      ];
      const expression = createSqlFunction({
        schema: "pg_catalog",
        name: "upper",
        member: "fixture:upper",
        arguments: [textCodec] as const,
        result: textCodec,
        dependencies: [],
        observability: "tables",
        authority: "query",
      })("value");
      for (const view of views) {
        const prepared = connection.db.select({ value: expression }).from(view).prepare();
        expect(await prepared.execute()).toEqual([{ value: "VALUE" }]);
        await Promise.resolve(
          expect(
            evaluateSnapshot(async () => {
              const rows = await prepared.execute();
              await captureSnapshotRevisions(connection.db, async () => ({ documents: "1" }));
              return rows;
            }),
          ).rejects.toThrow("unknown table dependency: app.hidden_"),
        );
      }
    } finally {
      await connection.close();
    }
  });
});
