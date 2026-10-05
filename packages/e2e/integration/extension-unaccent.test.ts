import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import { asc, defineRelations, eq, sql } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { createUnaccent_1_1, dictionaryReference } from "../../../apps/loom/src/core/extensions/adapters/unaccent";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { evaluateSnapshot } from "../../../apps/loom/src/core/server/rpc/snapshot";
import { createProjectProcedures } from "../../../apps/loom/src/core/server/rpc/procedure";
import { bindRpcDatabaseProcedure, createDatabaseMiddleware } from "../../../apps/loom/src/core/server/rpc/database";
import { Invocation } from "../../../apps/loom/src/core/server/effect/runtime";
import { createProjectServices } from "../../../apps/loom/src/core/server/effect/services";

const extension = createUnaccent_1_1({
  name: "unaccent",
  version: "1.1",
  schema: 'accent"schema',
  apiSupport: { status: "verified", digest: "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd" },
});
const fixture = sql`(values (1)) as fixture(value)`;
const install = sql`create schema "accent""schema"; create extension unaccent with schema "accent""schema"; create schema conflicting; create text search dictionary conflicting.unaccent(template=pg_catalog.simple); create schema "custom""dictionaries"; create text search dictionary "custom""dictionaries"."accent""dictionary"(template="accent""schema".unaccent,rules='unaccent')`;

test("Unaccent native default and qualified dictionaries retain Unicode, NULL and transaction composition", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema((fields) => ({ documents: { title: fields.text().notNull() } }));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const custom = dictionaryReference({ schema: 'custom"dictionaries', name: 'accent"dictionary' });
    try {
      await connection.db.execute(install);
      await connection.db.execute(
        sql`create table public.documents("_id" uuid primary key default uuidv7(),"_createdAt" bigint not null default 1,title text not null)`,
      );
      const hostile = "x'); drop table documents;--\\é";
      const values = await connection.transaction(async (db) => {
        await db.execute(sql`select set_config('search_path','conflicting,pg_catalog',true)`);
        return db
          .select({
            implicit: extension.unaccent("Hôtel"),
            explicit: extension.sql.functions.unaccent(extension.dictionary, "Hôtel"),
            custom: extension.unaccent(custom, "Æther Œuvre Straße"),
            deletion: extension.unaccent("e\u0301"),
            onlyDeletion: extension.unaccent("\u0301"),
            unchanged: extension.unaccent("你好🙂"),
            empty: extension.unaccent(""),
            hostile: extension.unaccent(hostile),
            nullText: extension.unaccent(null),
            nullDictionary: extension.unaccent(null, "é"),
            nullExplicitText: extension.unaccent(custom, null),
            otherTemplate: extension.unaccent(
              dictionaryReference({ schema: "conflicting", name: "unaccent" }),
              "Hôtel",
            ),
          })
          .from(fixture);
      });
      expect(values).toEqual([
        {
          implicit: "Hotel",
          explicit: "Hotel",
          custom: "AEther OEuvre Strasse",
          deletion: "e",
          onlyDeletion: "",
          unchanged: "你好🙂",
          empty: "",
          hostile: "x'); drop table documents;--\\e",
          nullText: null,
          nullDictionary: null,
          nullExplicitText: null,
          otherTemplate: "hôtel",
        },
      ]);
      await connection.transaction(async (db) => {
        await db.insert(schema.tables.documents).values([{ title: "Hôtel" }, { title: "Æther" }, { title: "other" }]);
        expect(
          await db
            .select({ title: extension.unaccent(schema.tables.documents.title) })
            .from(schema.tables.documents)
            .where(eq(extension.unaccent(schema.tables.documents.title), "Hotel"))
            .orderBy(asc(extension.unaccent(schema.tables.documents.title))),
        ).toEqual([{ title: "Hotel" }]);
        const nested = db
          .select({ title: extension.unaccent(custom, schema.tables.documents.title).as("title") })
          .from(schema.tables.documents)
          .as("selected");
        expect(
          await db
            .select({ title: extension.unaccent(nested.title) })
            .from(nested)
            .orderBy(asc(nested.title)),
        ).toEqual([{ title: "AEther" }, { title: "Hotel" }, { title: "other" }]);
      });
      await assert.rejects(
        connection.db
          .select({
            value: extension.unaccent(dictionaryReference({ schema: 'custom"dictionaries', name: "missing" }), "é"),
          })
          .from(fixture)
          .execute(),
        (error: Error) => error.cause instanceof Error && error.cause.message.includes("does not exist"),
      );
      await assert.rejects(
        connection.db
          .select({ value: extension.unaccent("bad\u0000text") })
          .from(fixture)
          .execute(),
      );
      expect((await connection.db.execute(sql`select count(*)::int as count from public.documents`)).rows).toEqual([
        { count: 3 },
      ]);
    } finally {
      await connection.close();
    }
  });
});

test("Unaccent external contracts survive nested aliases, subqueries and precompiled live evaluations", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(install);
      for (const expression of [
        extension.unaccent("é"),
        extension.unaccent(extension.dictionary, "é"),
        extension.unaccent(extension.unaccent("é").as("inner")),
      ]) {
        const query = connection.db.select({ value: expression.as("value") }).from(fixture);
        const prepared = query.prepare();
        expect(await prepared.execute()).toEqual([{ value: "e" }]);
        await assert.rejects(
          evaluateSnapshot(() => query.execute()),
          /Automatic live query cannot observe external extension dependency/,
        );
        await assert.rejects(
          evaluateSnapshot(() => prepared.execute()),
          /Automatic live query cannot observe external extension dependency/,
        );
      }
      const nested = connection.db
        .select({ value: extension.unaccent("é").as("value") })
        .from(fixture)
        .as("selected");
      const query = connection.db.select({ value: nested.value }).from(nested);
      expect(await query.execute()).toEqual([{ value: "e" }]);
      await assert.rejects(
        evaluateSnapshot(() => query.execute()),
        /Automatic live query cannot observe external extension dependency/,
      );
      await assert.rejects(
        evaluateSnapshot(async () => {
          try {
            await query.execute();
          } catch {}
          return "caught";
        }),
        /Automatic live query cannot observe external extension dependency/,
      );
    } finally {
      await connection.close();
    }
  });
});

test("Unaccent RPC and Effect use authorized invocation databases and return decoded text", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const relations = defineRelations(schema.tables);
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    let authorized = 0;
    try {
      await connection.db.execute(install);
      const procedure = createProjectProcedures(schema).procedure;
      const middleware = createDatabaseMiddleware(relations, "automatic", schema);
      const options = {
        connection,
        replay: { metadataNamespace: "loom_fixture_meta", deployment: "fixture" },
        authorize: async () => {
          authorized++;
        },
      };
      const route = bindRpcDatabaseProcedure(
        procedure
          .use(middleware)
          .handler(async ({ context }) =>
            context.db.select({ value: extension.unaccent(extension.dictionary, "Hôtel") }).from(fixture),
          ),
        options,
      );
      const { Database } = createProjectServices<typeof schema, typeof relations>();
      const effectRoute = bindRpcDatabaseProcedure(
        procedure.use(middleware).effect(function* () {
          const db = yield* Database;
          return yield* Effect.tryPromise({
            try: () =>
              db
                .select({ value: extension.unaccent("Æther") })
                .from(fixture)
                .execute(),
            catch: (cause) => cause,
          });
        }),
        options,
      );
      const invocation = { identity: null, requestId: crypto.randomUUID(), signal: new AbortController().signal };
      const context = {
        ...invocation,
        operation: "query" as const,
        "effect/context": Context.make(Invocation, invocation),
      };
      expect(await call(route, undefined, { context })).toEqual([{ value: "Hotel" }]);
      expect(await call(effectRoute, undefined, { context })).toEqual([{ value: "AEther" }]);
      expect(authorized).toBe(2);
    } finally {
      await connection.close();
    }
  });
});
