import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { createHypopg_1_4_3 } from "../../../apps/loom/src/core/extensions/adapters/hypopg";
import { hypopgIndexCodec } from "../../../apps/loom/src/core/extensions/adapters/hypopg-codecs";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { serializeRpcValue, deserializeRpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import {
  withHypopg,
  HypopgOperationError,
  type HypopgSession,
} from "../../../apps/loom/src/tooling/extensions/operations/hypopg";
import {
  createSnapshot,
  emptySnapshot,
  migrationStatements,
  inspectSnapshot,
} from "../../../apps/loom/src/tooling/migrations/adapter";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { hypopgDescriptor, hypopgInstall, hypopgSchema } from "../fixtures/hypopg";
import { hypopgNativeProofCase, hypopgLifecycleProofCase } from "../fixtures/hypopg-proof-cases";
import source from "../../../apps/loom/src/tooling/extensions/manifests/hypopg.json";

const prefix = pg.escapeIdentifier(hypopgSchema);
const routine = (name: string, args = "") => `routine:$extension:hypopg.${name}(${args})`;
extensionProofTest(
  hypopgNativeProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const oracle = new pg.Client({ connectionString: url });
      await oracle.connect();
      const api = createHypopg_1_4_3(hypopgDescriptor);
      const schema = defineSchema(
        () => ({
          snapshots: {
            listed: api.listField().notNull(),
            hidden: api.hiddenField().notNull(),
            lists: api.listArrayField().notNull(),
            hiddenLists: api.hiddenArrayField().notNull(),
          },
        }),
        { namespace: "hypopg_app" },
      );
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: url,
      });
      const prove = async (member: string, assertion: () => void | Promise<void>) => {
        const claim = hypopgNativeProofCase.claims.find((entry) => entry.member === member);
        assert(claim, `Undeclared hypopg member: ${member}`);
        await extensionProofWitness({ ...claim, schema: hypopgSchema }, assertion);
      };
      try {
        assert.equal(
          Math.floor(Number((await oracle.query("SHOW server_version_num")).rows[0].server_version_num) / 10000),
          18,
        );
        await oracle.query(hypopgInstall);
        await observeExtensionProofDatabase(url, hypopgNativeProofCase.id, "hypopg");
        for (const statement of await migrationStatements(
          await emptySnapshot("hypopg_app"),
          await createSnapshot(schema),
        ))
          await oracle.query(statement);
        const inspected = await inspectSnapshot(connection.db, "hypopg_app");
        assert(inspected);
        const realOid = Number(
          (await oracle.query("SELECT 'public.hypopg_real_label'::regclass::oid::text AS value")).rows[0].value,
        );
        let listed!: Awaited<ReturnType<HypopgSession["listView"]>>[number];
        let hidden!: Awaited<ReturnType<HypopgSession["hiddenView"]>>[number];
        await withHypopg(url, hypopgDescriptor, async (session) => {
          let created!: Awaited<ReturnType<HypopgSession["createIndex"]>>;
          await prove(routine("hypopg_create_index", "pg_catalog.text"), async () => {
            assert.deepEqual(await session.createIndex(null), []);
            created = await session.createIndex(
              "SELECT 1; CREATE INDEX ON public.hypopg_items(id); CREATE INDEX ON public.hypopg_items ((lower(label))) WHERE id > 0;",
            );
            assert.equal(created.length, 2);
            assert(created.every((entry) => entry.indexrelid > 0 && entry.indexname.includes(`<${entry.indexrelid}>`)));
            assert.equal(
              (await oracle.query("SELECT count(*)::int AS n FROM pg_indexes WHERE tablename='hypopg_items'")).rows[0]
                .n,
              1,
            );
            // PostgreSQL, not the adapter, chooses supported access methods and index semantics.
            assert.equal(
              (
                await session.createIndex(
                  "CREATE UNIQUE INDEX ON public.hypopg_items(id) INCLUDE (label); CREATE INDEX ON public.hypopg_items USING hash(id); CREATE INDEX ON public.hypopg_items USING brin(id);",
                )
              ).length,
              3,
            );
          });
          const first = created[0]!;
          await prove(routine("hypopg"), async () => {
            const indexes = await session.indexes();
            assert.equal(indexes.length, 5);
            const entry = indexes.find((index) => index.indexrelid === first.indexrelid)!;
            assert.equal(entry.indexname, first.indexname);
            assert.equal(entry.innatts, 1);
            assert.equal(entry.indkey, "1");
            assert.equal(entry.indcollation, "0");
            assert.equal(entry.indoption, null);
            assert.equal(entry.indexprs, null);
            assert.equal(entry.indpred, null);
            const expression = indexes.find((index) => index.indexprs !== null)!;
            assert.equal(expression.indkey, "0");
            assert(expression.indpred);
            assert.deepEqual(hypopgIndexCodec.decode(hypopgIndexCodec.encode(expression)), expression);
            assert(indexes.some((entry) => entry.indisunique && entry.innatts === 2));
            assert.deepEqual(deserializeRpcValue(serializeRpcValue([...indexes])), indexes);
          });
          await prove(routine("hypopg_get_indexdef", "pg_catalog.oid"), async () => {
            assert.match(
              (await session.getIndexdef(first.indexrelid))!,
              /CREATE INDEX ON public.hypopg_items USING btree \(id\)/,
            );
            assert.equal(await session.getIndexdef(0), null);
            assert.equal(await session.getIndexdef(null), null);
          });
          await prove(routine("hypopg_relation_size", "pg_catalog.oid"), async () => {
            assert((await session.relationSize(first.indexrelid))! > 0n);
            assert.equal(await session.relationSize(null), null);
          });
          const plan = await session.explain(sql`SELECT * FROM public.hypopg_items WHERE id = ${1}`);
          assert(
            (await session.indexes()).some((index) => plan.text.includes(index.indexname)),
            "Native planner must select one of this session's hypothetical indexes",
          );
          assert.equal(plan.type, "json");
          assert.equal((await oracle.query(`SELECT count(*)::int AS n FROM ${prefix}.hypopg()`)).rows[0].n, 0);
          await prove('view:"$extension:hypopg".hypopg_list_indexes', async () => {
            listed = (await session.listView()).find((entry) => entry.indexrelid === first.indexrelid)!;
            assert.deepEqual(listed, {
              indexrelid: first.indexrelid,
              index_name: first.indexname,
              schema_name: "public",
              table_name: "hypopg_items",
              am_name: "btree",
            });
          });
          await prove(routine("hypopg_hide_index", "pg_catalog.oid"), async () => {
            assert.equal(await session.hideIndex(realOid), true);
            assert.equal(await session.hideIndex(realOid), false);
            assert.equal(await session.hideIndex(first.indexrelid), true);
            assert.equal(await session.hideIndex(0), false);
            assert.equal(await session.hideIndex(null), null);
          });
          await prove(routine("hypopg_hidden_indexes"), async () => {
            assert.deepEqual(new Set(await session.hiddenIndexes()), new Set([realOid, first.indexrelid]));
          });
          await prove('view:"$extension:hypopg".hypopg_hidden_indexes', async () => {
            const entries = await session.hiddenView();
            hidden = entries.find((entry) => entry.indexrelid === first.indexrelid)!;
            assert.deepEqual(hidden, { ...listed, is_hypo: true });
            assert.deepEqual(
              entries.find((entry) => entry.indexrelid === realOid),
              {
                indexrelid: realOid,
                index_name: "hypopg_real_label",
                schema_name: "public",
                table_name: "hypopg_items",
                am_name: "btree",
                is_hypo: false,
              },
            );
          });
          for (const member of source.contract.members.filter(
            (entry) => entry.kind === "other" && entry.objectType === "view column",
          )) {
            const identity = member.identity!;
            await prove(member.id, async () => {
              const row =
                member.name === "hypopg_list_indexes"
                  ? (await session.listView()).find((entry) => entry.indexrelid === first.indexrelid)!
                  : (await session.hiddenView()).find((entry) => entry.indexrelid === first.indexrelid)!;
              const actual = Object.entries(row).find(([name]) => identity.endsWith(`.${name}`));
              assert(actual);
              assert.deepEqual(
                actual,
                Object.entries(member.name === "hypopg_list_indexes" ? listed : hidden).find(([name]) =>
                  identity.endsWith(`.${name}`),
                ),
              );
            });
          }
          await prove(routine("hypopg_unhide_index", "pg_catalog.oid"), async () => {
            assert.equal(await session.unhideIndex(first.indexrelid), true);
            assert.equal(await session.unhideIndex(first.indexrelid), false);
            assert.equal(await session.unhideIndex(null), null);
          });
          await prove(routine("hypopg_drop_index", "pg_catalog.oid"), async () => {
            assert.equal(await session.hideIndex(first.indexrelid), true);
            assert.equal(await session.dropIndex(first.indexrelid), true);
            assert.equal(await session.dropIndex(first.indexrelid), false);
            assert.equal(await session.dropIndex(null), null);
            assert(!(await session.hiddenIndexes()).includes(first.indexrelid));
          });
          await prove(routine("hypopg_reset_index"), async () => {
            await session.resetIndex();
            assert.deepEqual(await session.indexes(), []);
            assert.deepEqual(await session.hiddenIndexes(), [realOid]);
          });
          await prove(routine("hypopg_reset"), async () => {
            const [entry] = await session.createIndex("CREATE INDEX ON public.hypopg_items(id)");
            assert(entry);
            await session.hideIndex(entry.indexrelid);
            await session.reset();
            assert.deepEqual(await session.indexes(), []);
            assert.deepEqual(await session.hiddenIndexes(), [realOid]);
          });
          await prove(routine("hypopg_unhide_all_indexes"), async () => {
            const [entry] = await session.createIndex("CREATE INDEX ON public.hypopg_items(id)");
            assert(entry);
            await session.hideIndex(entry.indexrelid);
            await session.unhideAllIndexes();
            assert.deepEqual(await session.hiddenIndexes(), []);
            assert.equal((await session.indexes()).length, 1);
          });
        });
        for (const member of source.contract.members.filter(
          (entry) => entry.kind === "other" && entry.objectType === "rule",
        )) {
          await prove(member.id, async () => {
            const name = member.name.includes("hypopg_list_indexes") ? "hypopg_list_indexes" : "hypopg_hidden_indexes";
            const result = await oracle.query(
              "SELECT pg_get_ruledef(r.oid) AS definition FROM pg_rewrite r JOIN pg_class c ON c.oid=r.ev_class JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 AND c.relname=$2 AND r.rulename='_RETURN'",
              [hypopgSchema, name],
            );
            assert.equal(result.rows.length, 1);
            assert.match(result.rows[0].definition, /DO INSTEAD.*SELECT/s);
            assert.match(result.rows[0].definition, /hypopg/);
          });
        }
        const lists = { dimensions: [{ lowerBound: -2, length: 2 }], values: [listed, null] };
        const hiddenLists = {
          dimensions: [
            { lowerBound: 3, length: 2 },
            { lowerBound: -1, length: 1 },
          ],
          values: [[hidden], [null]],
        };
        const value = { listed, hidden, lists, hiddenLists };
        await connection.transaction(async (db) => {
          await db.insert(schema.tables.snapshots).values(value);
          const rows = await db
            .select({
              listed: schema.tables.snapshots.listed,
              hidden: schema.tables.snapshots.hidden,
              lists: schema.tables.snapshots.lists,
              hiddenLists: schema.tables.snapshots.hiddenLists,
            })
            .from(schema.tables.snapshots);
          assert.deepEqual(rows, [value]);
          const projections = [
            ["hypopg_list_indexes", "listed"],
            ["hypopg_hidden_indexes", "hidden"],
            ["_hypopg_list_indexes", "lists"],
            ["_hypopg_hidden_indexes", "hiddenLists"],
          ] as const;
          for (const [type, property] of projections)
            await prove(`type:$extension:hypopg.${type}`, () => assert.deepEqual(rows[0]![property], value[property]));
          assert.deepEqual(deserializeRpcValue(serializeRpcValue(rows)), rows);
          // Test-only raw native setup on this exact invocation transaction proves the real query decoder path.
          await db.execute(
            sql.raw(`SELECT * FROM ${prefix}.hypopg_create_index('CREATE INDEX ON public.hypopg_items(id)')`),
          );
          try {
            const indexes = api.indexRows("i");
            const observed = await db.select(indexes.columns).from(indexes.from);
            assert.equal(observed.length, 1);
            assert.equal(observed[0]!.indkey, "1");
            const list = api.listView("l");
            const projected = await db.select(list.columns).from(list.from);
            assert.equal(projected[0]!.indexrelid, observed[0]!.indexrelid);
            assert.equal(projected[0]!.am_name, "btree");
            const scalars = await db
              .select({
                definition: api.getIndexdef(observed[0]!.indexrelid),
                size: api.relationSize(observed[0]!.indexrelid),
                absent: api.getIndexdef(0),
                nullSize: api.relationSize(null),
              })
              .from(sql`(values(1)) fixture(id)`);
            assert.match(scalars[0]!.definition!, /CREATE INDEX/);
            assert(scalars[0]!.size! > 0n);
            assert.equal(scalars[0]!.absent, null);
            assert.equal(scalars[0]!.nullSize, null);
            await db.execute(sql.raw(`SELECT ${prefix}.hypopg_hide_index(${observed[0]!.indexrelid})`));
            const hiddenOids = api.hiddenIndexRows("h");
            assert.deepEqual(await db.select(hiddenOids.columns).from(hiddenOids.from), [
              { indexid: observed[0]!.indexrelid },
            ]);
            const hiddenView = api.hiddenView("h");
            assert.equal((await db.select(hiddenView.columns).from(hiddenView.from))[0]!.is_hypo, true);
          } finally {
            await db.execute(sql.raw(`SELECT ${prefix}.hypopg_reset()`));
            await db.execute(sql.raw(`SELECT ${prefix}.hypopg_unhide_all_indexes()`));
          }
        });
        // Native characterization: hypothetical definitions survive ROLLBACK on an independently owned backend.
        await oracle.query("BEGIN");
        await oracle.query(`SELECT * FROM ${prefix}.hypopg_create_index('CREATE INDEX ON public.hypopg_items(id)')`);
        await oracle.query(`SELECT ${prefix}.hypopg_hide_index($1::oid)`, [realOid]);
        await oracle.query("ROLLBACK");
        assert.equal((await oracle.query(`SELECT count(*)::int AS n FROM ${prefix}.hypopg()`)).rows[0].n, 1);
        assert.equal(
          (await oracle.query(`SELECT count(*)::int AS n FROM ${prefix}.hypopg_hidden_indexes()`)).rows[0].n,
          1,
        );
        const actualExecution = await oracle.query(
          "EXPLAIN (ANALYZE, FORMAT JSON) SELECT * FROM public.hypopg_items WHERE id=1",
        );
        assert(!JSON.stringify(actualExecution.rows).includes("<"));
        await oracle.query(`SELECT ${prefix}.hypopg_reset(); SELECT ${prefix}.hypopg_unhide_all_indexes()`);
      } finally {
        try {
          await connection.close();
        } finally {
          await oracle.end();
        }
      }
    });
  },
  120000,
);

extensionProofTest(
  hypopgLifecycleProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const oracle = new pg.Client({ connectionString: url });
      await oracle.connect();
      try {
        await oracle.query(hypopgInstall);
        await observeExtensionProofDatabase(url, hypopgLifecycleProofCase.id, "hypopg");
        let escaped: HypopgSession | undefined;
        const success = await withHypopg(url, hypopgDescriptor, async (session) => {
          escaped = session;
          await session.createIndex("CREATE INDEX ON public.hypopg_items(id)");
          return (await session.indexes()).length;
        });
        assert.equal(success.value, 1);
        assert.equal(success.completion, "committed");
        assert.deepEqual(success.effects, [
          { operation: "createIndex", state: "acknowledged", scope: "backend", rollback: "not-transactional" },
        ]);
        await assert.rejects(escaped!.indexes(), /inactive|owner/);
        await assert.rejects(
          withHypopg(url, hypopgDescriptor, async (session) => {
            await session.createIndex("CREATE INDEX ON public.hypopg_items(id)");
            throw new Error("callback failed");
          }),
          (cause) =>
            cause instanceof HypopgOperationError &&
            cause.completion === "rolled-back" &&
            cause.effects[0]?.state === "acknowledged" &&
            cause.cleanupFailures.length === 0,
        );
        await assert.rejects(
          withHypopg(url, hypopgDescriptor, async (session) => {
            await session.relationSize(0).catch(() => undefined);
          }),
          (cause) => cause instanceof HypopgOperationError && cause.completion === "rolled-back",
        );
        await assert.rejects(
          withHypopg(url, hypopgDescriptor, async (session) => {
            await session.createIndex("CREATE INDEX ON public.hypopg_items(id)");
            void session.relationSize(0).catch(() => undefined);
          }),
          (cause) => cause instanceof HypopgOperationError && cause.completion === "rolled-back",
        );
        const cancellation = new AbortController();
        const started = Promise.withResolvers<void>();
        const operation = withHypopg(
          url,
          hypopgDescriptor,
          async (session) => {
            await session.createIndex("CREATE INDEX ON public.hypopg_items(id)");
            started.resolve();
            await new Promise<void>(() => undefined);
          },
          cancellation.signal,
        );
        void operation.catch(started.reject);
        await started.promise;
        cancellation.abort(new Error("cancelled hypopg"));
        await assert.rejects(
          operation,
          (cause) => cause instanceof HypopgOperationError && cause.completion === "rolled-back",
        );
        await withHypopg(url, hypopgDescriptor, async (session) => {
          assert.deepEqual(await session.indexes(), []);
          assert.deepEqual(await session.hiddenIndexes(), []);
        });
        assert.equal(
          (
            await oracle.query(
              "SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND application_name='loom-migrations'",
            )
          ).rows[0].n,
          0,
        );
      } finally {
        await oracle.end();
      }
    });
  },
  120000,
);
