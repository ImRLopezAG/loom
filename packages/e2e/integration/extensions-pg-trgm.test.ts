import { evaluateSnapshot, captureSnapshotRevisions } from "../../../apps/loom/src/core/server/rpc/snapshot";
import { frameworkMigrations } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import { installRevisionTracking } from "../../../apps/loom/src/tooling/migrations/revisions";
import { createRevisionReader } from "../../../apps/loom/src/core/server/realtime/revisions";
import { createRevisionCoordinator } from "../../../apps/loom/src/core/server/realtime/coordinator";
import pg from "pg";
import * as v from "valibot";
import assert from "node:assert/strict";
import { withPgTrgmThresholds, type PgTrgmSession } from "../../../apps/loom/src/tooling/extensions/pg-trgm";
import { expect, test } from "bun:test";
import { defineRelations, desc, gte, sql } from "drizzle-orm";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { createPgTrgm_1_6 } from "../../../apps/loom/src/core/extensions/adapters/pg-trgm";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import {
  createSnapshot,
  emptySnapshot,
  migrationStatements,
  inspectSnapshot,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";

const descriptor = {
  name: "pg_trgm",
  version: "1.6",
  schema: "search",
  apiSupport: { status: "verified", digest: "88e35b55b09e58d6a59847390006ca73483bdb4444346474beb644c63adcbe66" },
} as const;

test("pg_trgm.AE2.filterOrderDecode", async () => {
  await withExtensionDatabase(async (url) => {
    const api = createPgTrgm_1_6(descriptor);
    const schema = defineSchema((fields) => ({ documents: { title: fields.text().notNull() } }));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(sql`create schema search; create extension pg_trgm with schema search version '1.6'`);
      for (const statement of await migrationStatements(await emptySnapshot("public"), await createSnapshot(schema)))
        await connection.db.execute(sql.raw(statement));
      await connection.db
        .insert(schema.tables.documents)
        .values([{ title: "word" }, { title: "words" }, { title: "unrelated" }]);
      const score = api.similarity(schema.tables.documents.title, "word");
      const result = await connection.transaction((db) =>
        db
          .select({ title: schema.tables.documents.title, score })
          .from(schema.tables.documents)
          .where(gte(score, 0.5))
          .orderBy(desc(score)),
      );
      expect(result).toEqual([
        { title: "word", score: 1 },
        { title: "words", score: Math.fround(4 / 7) },
      ]);
    } finally {
      await connection.close();
    }
  });
});

const pairs = [
  ["similarity", 4 / 11],
  ["word_similarity", 0.8],
  ["strict_word_similarity", 4 / 7],
  ["similarity_dist", 1 - Math.fround(4 / 11)],
  ["word_similarity_dist_op", 1 - Math.fround(0.8)],
  ["word_similarity_dist_commutator_op", 1 - Math.fround(0.4)],
  ["strict_word_similarity_dist_op", 1 - Math.fround(4 / 7)],
  ["strict_word_similarity_dist_commutator_op", 1 - Math.fround(4 / 11)],
  ["similarity_op", true],
  ["word_similarity_op", true],
  ["word_similarity_commutator_op", false],
  ["strict_word_similarity_op", true],
  ["strict_word_similarity_commutator_op", false],
] as const;
const operators = [
  ["%", true],
  ["<%", true],
  ["%>", false],
  ["<<%", true],
  ["%>>", false],
  ["<->", 1 - Math.fround(4 / 11)],
  ["<<->", 1 - Math.fround(0.8)],
  ["<->>", 1 - Math.fround(0.4)],
  ["<<<->", 1 - Math.fround(4 / 7)],
  ["<->>>", 1 - Math.fround(4 / 11)],
] as const;

test("pg_trgm.everyPublicRoutineOperatorAndNull", async () => {
  await withExtensionDatabase(async (url) => {
    const api = createPgTrgm_1_6(descriptor);
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(sql`create schema search; create extension pg_trgm with schema search version '1.6'`);
      await connection.db.execute(
        sql`select set_config('pg_trgm.similarity_threshold','0.3',false), set_config('pg_trgm.word_similarity_threshold','0.6',false), set_config('pg_trgm.strict_word_similarity_threshold','0.5',false)`,
      );
      for (const [name, expected] of pairs) {
        const call = api.sql.functions[name];
        const result = await connection.transaction((db) =>
          db
            .select({
              value: call("word", "two words"),
              left: call(null, "two words"),
              right: call("word", null),
              both: call(null, null),
              empty: call("", ""),
            })
            .from(sql`(values (1)) fixture(id)`),
        );
        expect(result).toEqual([
          {
            value: v.is(v.number(), expected) ? Math.fround(expected) : expected,
            left: null,
            right: null,
            both: null,
            empty: v.is(v.number(), expected) ? (name.includes("dist") || name.includes("->") ? 1 : 0) : false,
          },
        ]);
      }
      for (const [name, expected] of operators) {
        const call = api.sql.operators[name];
        const result = await connection.transaction((db) =>
          db
            .select({
              value: call("word", "two words"),
              left: call(null, "two words"),
              right: call("word", null),
              both: call(null, null),
              empty: call("", ""),
            })
            .from(sql`(values (1)) fixture(id)`),
        );
        expect(result).toEqual([
          {
            value: v.is(v.number(), expected) ? Math.fround(expected) : expected,
            left: null,
            right: null,
            both: null,
            empty: v.is(v.number(), expected) ? (name.includes("dist") || name.includes("->") ? 1 : 0) : false,
          },
        ]);
      }
      const result = await connection.transaction((db) =>
        db
          .select({
            trigrams: api.showTrigrams("cat"),
            empty: api.showTrigrams(""),
            punctuation: api.showTrigrams("!"),
            missing: api.showTrigrams(null),
            limit: api.sql.functions.show_limit(),
            identical: api.similarity("word", "word"),
            disjoint: api.similarity("", ""),
          })
          .from(sql`(values (1)) fixture(id)`),
      );
      expect(result).toEqual([
        {
          trigrams: ["  c", " ca", "at ", "cat"],
          empty: [],
          punctuation: [],
          missing: null,
          limit: Math.fround(0.3),
          identical: 1,
          disjoint: 0,
        },
      ]);
    } finally {
      await connection.close();
    }
  });
});

test("pg_trgm.thresholdLifetimeSuccessErrorAbort", async () => {
  await withExtensionDatabase(async (url) => {
    const admin = new pg.Client({ connectionString: url });
    await admin.connect();
    const pids: number[] = [];
    let escaped: PgTrgmSession | undefined;
    try {
      await admin.query("create schema search; create extension pg_trgm with schema search version '1.6'");
      await withPgTrgmThresholds(
        url,
        descriptor,
        { similarity: 0.9, wordSimilarity: 0.9, strictWordSimilarity: 0.9 },
        async (session) => {
          pids.push((await session.client.query<{ pid: number }>("select pg_backend_pid() as pid")).rows[0]!.pid);
          escaped = session;
          expect(await session.showLimit()).toBe(Math.fround(0.9));
          const high = await session.client.query(
            "select 'word' operator(search.%) 'two words' as similarity, 'word' operator(search.<%) 'two words' as word, 'word' operator(search.<<%) 'two words' as strict",
          );
          expect(high.rows).toEqual([{ similarity: false, word: false, strict: false }]);
          expect(await session.setLimit(null)).toBeNull();
          expect(await session.showLimit()).toBe(Math.fround(0.9));
          expect(await session.setLimit(0.1)).toBe(Math.fround(0.1));
          expect((await session.client.query("select 'word' operator(search.%) 'two words' as value")).rows).toEqual([
            { value: true },
          ]);
          await assert.rejects(session.setLimit(2));
        },
      );
      assert.ok(escaped);
      await assert.rejects(escaped.showLimit(), /session has ended/);
      await withPgTrgmThresholds(
        url,
        descriptor,
        { similarity: 0.1, wordSimilarity: 0.1, strictWordSimilarity: 0.1 },
        async (session) => {
          expect(
            (
              await session.client.query(
                "select 'word' operator(search.%) 'two words' as similarity, 'word' operator(search.<%) 'two words' as word, 'word' operator(search.<<%) 'two words' as strict",
              )
            ).rows,
          ).toEqual([{ similarity: true, word: true, strict: true }]);
        },
      );
      await withPgTrgmThresholds(
        url,
        descriptor,
        { similarity: Math.fround(4 / 11), wordSimilarity: Math.fround(0.8), strictWordSimilarity: Math.fround(4 / 7) },
        async (session) => {
          expect(
            (
              await session.client.query(
                "select 'word' operator(search.%) 'two words' as similarity, 'word' operator(search.<%) 'two words' as word, 'word' operator(search.<<%) 'two words' as strict",
              )
            ).rows,
          ).toEqual([{ similarity: true, word: true, strict: true }]);
        },
      );
      await withPgTrgmThresholds(url, descriptor, { similarity: 1e-100 }, async (session) => {
        expect(
          (await session.client.query("select current_setting('pg_trgm.similarity_threshold') as value")).rows,
        ).toEqual([{ value: "1e-100" }]);
        expect(await session.showLimit()).toBe(0);
      });
      await assert.rejects(
        withPgTrgmThresholds(url, descriptor, { similarity: 0.1 }, async (session) => {
          pids.push((await session.client.query<{ pid: number }>("select pg_backend_pid() as pid")).rows[0]!.pid);
          expect(await session.setLimit(0.2)).toBe(Math.fround(0.2));
          throw new Error("fixture failure");
        }),
        /fixture failure/,
      );
      const controller = new AbortController();
      await assert.rejects(
        withPgTrgmThresholds(
          url,
          descriptor,
          { similarity: 0.1 },
          async (session) => {
            pids.push((await session.client.query<{ pid: number }>("select pg_backend_pid() as pid")).rows[0]!.pid);
            const timer = setTimeout(() => controller.abort(new Error("fixture abort")), 20);
            try {
              await session.client.query("select pg_sleep(10)");
            } finally {
              clearTimeout(timer);
            }
          },
          controller.signal,
        ),
      );
      const lateController = new AbortController();
      await assert.rejects(
        withPgTrgmThresholds(
          url,
          descriptor,
          { similarity: 0.1 },
          async (session) => {
            pids.push((await session.client.query<{ pid: number }>("select pg_backend_pid() as pid")).rows[0]!.pid);
            // Drive a real COMMIT, then abort before its result reaches the session owner.
            session.client.query = new Proxy(session.client.query.bind(session.client), {
              apply(query, _receiver, arguments_) {
                const statement = v.parse(v.string(), arguments_[0]);
                const values = v.parse(v.optional(v.array(v.unknown())), arguments_[1]);
                const result = query(statement, values);
                if (statement !== "COMMIT") return result;
                return Promise.resolve(result).then((committed) => {
                  lateController.abort(new Error("fixture late abort"));
                  return committed;
                });
              },
            });
            return "must not return after abort";
          },
          lateController.signal,
        ),
        /fixture late abort/,
      );
      expect((await admin.query("select pid from pg_stat_activity where pid=any($1::int[])", [pids])).rows).toEqual([]);
      expect((await admin.query("select search.show_limit()::float8 as value")).rows).toEqual([
        { value: Math.fround(0.3) },
      ]);
      await withPgTrgmThresholds(url, descriptor, {}, async (session) => {
        expect(await session.showLimit()).toBe(Math.fround(0.3));
      });
    } finally {
      await admin.end();
    }
  });
});

test("pg_trgm.nativeIndexesAndNamespaces", async () => {
  for (const namespace of ["extensions", "search"])
    await withExtensionDatabase(async (url) => {
      const api = createPgTrgm_1_6({ ...descriptor, schema: namespace });
      const schema = defineSchema(
        (fields) => ({
          documents: defineTable(
            { title: fields.text().notNull() },
            {
              indexes: [
                { fields: ["title"], extension: api.indexes.gin() },
                { fields: ["title"], extension: api.indexes.gist() },
                { fields: ["title"], extension: api.indexes.gist({ siglen: 32 }) },
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
        await connection.db.execute(
          sql`create schema ${sql.identifier(namespace)}; create extension pg_trgm with schema ${sql.identifier(namespace)} version '1.6'`,
        );
        const desired = await createSnapshot(schema);
        for (const statement of await migrationStatements(await emptySnapshot("app"), desired))
          await connection.db.execute(sql.raw(statement));
        const inspected = await inspectSnapshot(connection.db, "app");
        expect(snapshotHash(inspected)).toBe(snapshotHash(desired));
        expect(await migrationStatements(inspected, desired)).toEqual([]);
        expect(schema.metadata.extensionRequirements).toHaveLength(2);
        await connection.db
          .insert(schema.tables.documents)
          .values([{ title: "word" }, { title: "words" }, { title: "unrelated" }]);
        const rows = await connection.transaction((db) =>
          db
            .select({
              title: schema.tables.documents.title,
              distance: api.distance(schema.tables.documents.title, "word"),
            })
            .from(schema.tables.documents)
            .orderBy(api.distance(schema.tables.documents.title, "word")),
        );
        expect(rows.map((row) => row.title)).toEqual(["word", "words", "unrelated"]);
        const classes = await connection.db.execute(
          sql`select am.amname, cls.opcname, a.attoptions from pg_index ix join pg_class idx on idx.oid=ix.indexrelid join pg_namespace ns on ns.oid=idx.relnamespace join pg_am am on am.oid=idx.relam join pg_opclass cls on cls.oid=ix.indclass[0] join pg_attribute a on a.attrelid=idx.oid and a.attnum=1 where ns.nspname='app' and cls.opcname in ('gin_trgm_ops','gist_trgm_ops') order by idx.relname`,
        );
        expect(classes.rows).toEqual([
          { amname: "gin", opcname: "gin_trgm_ops", attoptions: null },
          { amname: "gist", opcname: "gist_trgm_ops", attoptions: null },
          { amname: "gist", opcname: "gist_trgm_ops", attoptions: ["siglen=32"] },
        ]);
      } finally {
        await connection.close();
      }
    });
});

test("pg_trgm.liveTableInvalidationAndSessionRejection", async () => {
  await withExtensionDatabase(async (url) => {
    const api = createPgTrgm_1_6(descriptor);
    const schema = defineSchema((fields) => ({ documents: { title: fields.text().notNull() } }), { namespace: "app" });
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
        sql`create schema search; create extension pg_trgm with schema search version '1.6'; create schema loom_meta`,
      );
      for (const migration of frameworkMigrations("loom_meta"))
        for (const statement of migration.statements) await connection.db.execute(sql.raw(statement));
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)))
        await connection.db.execute(sql.raw(statement));
      await admin.query("BEGIN");
      await installRevisionTracking(admin, "app", "loom_meta", ["documents"]);
      await admin.query("COMMIT");
      await connection.transaction((db) => db.insert(schema.tables.documents).values({ title: "word" }));
      const read = createRevisionReader({ namespace: "app", metadataNamespace: "loom_meta", tables: ["documents"] });
      const events: { score: number }[][] = [];
      const failures: Error[] = [];
      coordinator = createRevisionCoordinator({ readRevisions: () => read(connection.db), intervalMs: 60_000 });
      coordinator.subscribe(
        { expiresAt: Math.floor(Date.now() / 1000) + 60 },
        {
          evaluate: () =>
            evaluateSnapshot(() =>
              connection.transaction(async (db) => {
                const rows = await db
                  .select({ score: api.similarity(schema.tables.documents.title, "word") })
                  .from(schema.tables.documents);
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
      await connection.transaction((db) => db.update(schema.tables.documents).set({ title: "unrelated" }));
      await coordinator.poll();
      expect(events).toEqual([[{ score: 1 }], [{ score: 0 }]]);
      expect(failures).toEqual([]);
      const predicates = [
        api.sql.functions.similarity_op,
        api.sql.functions.word_similarity_op,
        api.sql.functions.word_similarity_commutator_op,
        api.sql.functions.strict_word_similarity_op,
        api.sql.functions.strict_word_similarity_commutator_op,
        api.sql.operators["%"],
        api.sql.operators["<%"],
        api.sql.operators["%>"],
        api.sql.operators["<<%"],
        api.sql.operators["%>>"],
      ];
      for (const expression of [
        api.sql.functions.show_limit(),
        ...predicates.map((call) => call("word", "two words")),
      ]) {
        await assert.rejects(
          evaluateSnapshot(() =>
            connection.transaction(async (db) => {
              await db.select({ value: expression }).from(schema.tables.documents);
              await captureSnapshotRevisions(db, read);
            }),
          ),
          /cannot observe session/,
        );
      }
    } finally {
      await coordinator?.stop();
      await admin.end();
      await connection.close();
    }
  });
});

test("pg_trgm.indexStrategyExecution", async () => {
  await withExtensionDatabase(async (url) => {
    const api = createPgTrgm_1_6(descriptor);
    const schema = defineSchema(
      (fields) => ({
        gin: defineTable(
          { title: fields.text().notNull() },
          { indexes: [{ fields: ["title"], extension: api.indexes.gin() }] },
        ),
        gist: defineTable(
          { title: fields.text().notNull() },
          { indexes: [{ fields: ["title"], extension: api.indexes.gist({ siglen: 32 }) }] },
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
      await connection.db.execute(sql`create schema search; create extension pg_trgm with schema search version '1.6'`);
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)))
        await connection.db.execute(sql.raw(statement));
      for (const method of ["gin", "gist"] as const) {
        const table = schema.tables[method];
        await connection.db
          .insert(table)
          .values([
            { title: "word" },
            { title: "words" },
            { title: "two words" },
            { title: "unrelated" },
            ...Array.from({ length: 1000 }, (_, index) => ({ title: `other ${index}` })),
          ]);
        await connection.transaction(async (db) => {
          await db.execute(
            sql`set local enable_seqscan=false; set local pg_trgm.similarity_threshold=0.3; set local pg_trgm.word_similarity_threshold=0.6; set local pg_trgm.strict_word_similarity_threshold=0.5`,
          );
          const predicates = [
            [api.sql.operators["%"](table.title, "word"), ["two words", "word", "words"]],
            [api.sql.operators["%>"](table.title, "word"), ["two words", "word", "words"]],
            [api.sql.operators["%>>"](table.title, "word"), ["two words", "word", "words"]],
            [sql<boolean>`${table.title} = 'word'`, ["word"]],
            [sql<boolean>`${table.title} like '%word%'`, ["two words", "word", "words"]],
            [sql<boolean>`${table.title} ilike '%WORD%'`, ["two words", "word", "words"]],
            [sql<boolean>`${table.title} ~ 'word'`, ["two words", "word", "words"]],
            [sql<boolean>`${table.title} ~* 'WORD'`, ["two words", "word", "words"]],
          ] as const;
          for (const [predicate, expected] of predicates) {
            const query = db.select({ title: table.title }).from(table).where(predicate).orderBy(table.title);
            expect((await query).map((row) => row.title)).toEqual([...expected]);
            const plan = await db.execute(sql`explain ${query}`);
            expect(JSON.stringify(plan.rows)).toContain(`${method}_0_idx`);
          }
          if (method === "gist")
            for (const name of ["<->", "<->>", "<->>>"] as const) {
              const query = db
                .select({ title: table.title })
                .from(table)
                .orderBy(api.sql.operators[name](table.title, "word"))
                .limit(1);
              expect(await query).toEqual([{ title: "word" }]);
              expect(JSON.stringify((await db.execute(sql`explain ${query}`)).rows)).toContain("gist_0_idx");
            }
        });
      }
    } finally {
      await connection.close();
    }
  });
});
