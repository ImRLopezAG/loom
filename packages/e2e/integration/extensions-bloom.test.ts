import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations } from "drizzle-orm";
import { createBloom_1_0, type BloomParameters } from "../../../apps/loom/src/core/extensions/adapters/bloom";
import { defineSchema, defineTable } from "../../../apps/loom/src/core/server/index";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import {
  createSnapshot,
  emptySnapshot,
  inspectSnapshot,
  migrationStatements,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { bloomNativeProofCase, bloomProofFamily, bloomProofSchema } from "../fixtures/bloom-proof-cases";

const bloom = createBloom_1_0({
  name: "bloom",
  version: "1.0",
  schema: bloomProofSchema,
  apiSupport: { status: "verified", digest: bloomProofFamily.manifestDigest },
});
const namespace = pg.escapeIdentifier(bloomProofSchema);
const managed = defineSchema(
  (fields) => ({
    entries: defineTable(
      { code: fields.integer(), label: fields.text(), region: fields.text() },
      {
        indexes: [
          { fields: ["code"], extension: bloom.indexes.int4(), with: bloom.storage({ length: 80, bits: [3] }) },
          { fields: ["label", "region"], extension: bloom.indexes.text(), with: bloom.storage({ bits: [2, 4] }) },
        ],
      },
    ),
  }),
  { namespace: "app" },
);

/** Runs a query with only bloom bitmap scans allowed, then sequentially; both row sets must match. */
async function scanMatchesOracle(client: pg.Client, query: string, params: readonly unknown[]) {
  await client.query("begin; set local enable_seqscan=off; set local enable_indexscan=off");
  try {
    const plan = (await client.query(`explain (format json) ${query}`, [...params])).rows[0]!["QUERY PLAN"];
    const nodes = JSON.stringify(plan);
    assert.match(nodes, /"Node Type":"Bitmap Index Scan"/, query);
    assert.match(nodes, /"Index Name":"entries_[01]_idx"/, query);
    const indexed = (await client.query(query, [...params])).rows;
    await client.query("set local enable_bitmapscan=off; set local enable_seqscan=on");
    assert.doesNotMatch(
      JSON.stringify((await client.query(`explain (format json) ${query}`, [...params])).rows),
      /Index/,
    );
    assert.deepEqual(indexed, (await client.query(query, [...params])).rows, query);
    return indexed;
  } finally {
    await client.query("rollback");
  }
}

extensionProofTest(
  bloomNativeProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        const server = await client.query("select current_setting('server_version_num')::int version");
        assert.equal(Math.floor(server.rows[0].version / 10000), 18);
        await client.query(`create schema ${namespace}; create extension bloom with schema ${namespace} version '1.0'`);
        await observeExtensionProofDatabase(url, bloomNativeProofCase.id, "bloom");
        for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(managed)))
          await client.query(statement);
        const connection = await connectDatabase({
          schema: managed,
          relations: defineRelations(managed.tables),
          connectionString: url,
        });
        try {
          const table = managed.tables.entries;
          const regions = ["north", "south", "east", "west"];
          const seeded = Array.from({ length: 3000 }, (_, x) => ({
            code: x % 997,
            label: `label-${x % 211}`,
            region: regions[x % 4]!,
          }));
          const count = (match: (row: (typeof seeded)[number]) => boolean) => seeded.filter(match).length;
          await connection.transaction((db) =>
            db.insert(table).values([...seeded, { code: null, label: null, region: null }]),
          );
          await client.query("analyze app.entries");
          const witness = (member: string, work: () => Promise<void>) =>
            extensionProofWitness(
              {
                family: bloomProofFamily,
                member,
                scenario: bloomNativeProofCase.claims[0]!.scenario,
                schema: bloomProofSchema,
              },
              work,
            );

          await witness("access method:bloom", async () => {
            const indexes = await client.query(
              `select c.relname, am.amname, pg_catalog.array_to_string(c.reloptions, ',') options
               from pg_index i join pg_class c on c.oid=i.indexrelid join pg_am am on am.oid=c.relam
               where i.indrelid='app.entries'::regclass and am.amname='bloom' order by c.relname`,
            );
            assert.deepEqual(indexes.rows, [
              { relname: "entries_0_idx", amname: "bloom", options: "length=80,col1=3" },
              { relname: "entries_1_idx", amname: "bloom", options: "col1=2,col2=4" },
            ]);
            const desired = await createSnapshot(managed);
            const observed = await inspectSnapshot(connection.db, "app");
            assert.deepEqual(observed, desired);
            assert.equal(snapshotHash(observed), snapshotHash(desired));
            // The adapter's accessMethod metadata states the native refusals.
            assert.equal(bloom.accessMethod.unique, false);
            // A scratch relation keeps boundary indexes out of the managed snapshot and scan plans.
            await client.query("create table public.bounds(code int4)");
            await assert.rejects(client.query("create unique index on public.bounds using bloom (code)"), {
              message: 'access method "bloom" does not support unique indexes',
            });
            for (const options of [
              { length: 4096, bits: [4095] },
              { length: 1, bits: Array.from({ length: 32 }, () => 1) },
            ])
              await client.query(
                `create index on public.bounds using bloom (code) with (${Object.entries(bloom.storage(options))
                  .map(([key, value]) => `${key}=${value}`)
                  .join(",")})`,
              );
            const rejected: [string, BloomParameters][] = [
              ["length=0", { length: 0 }],
              ["length=4097", { length: 4097 }],
              ["col1=0", { bits: [0] }],
              ["col1=4096", { bits: [4096] }],
              ["col33=1", { bits: Array.from({ length: 33 }, () => 1) }],
            ];
            for (const [bad, options] of rejected) {
              await assert.rejects(client.query(`create index on public.bounds using bloom (code) with (${bad})`), {
                message: /out of bounds|unrecognized parameter/,
              });
              assert.throws(() => bloom.storage(options), bad);
            }
          });

          await witness("opclass:$extension:bloom.int4_ops/bloom", async () => {
            const classes = await client.query(
              `select c.relname, o.opcname, n.nspname, o.opcdefault from pg_index i
               join pg_class c on c.oid=i.indexrelid, unnest(i.indclass) k(oid)
               join pg_opclass o on o.oid=k.oid join pg_namespace n on n.oid=o.opcnamespace
               where i.indrelid='app.entries'::regclass and c.relname in ('entries_0_idx','entries_1_idx') order by 1, 2`,
            );
            assert.deepEqual(classes.rows, [
              { relname: "entries_0_idx", opcname: "int4_ops", nspname: bloomProofSchema, opcdefault: true },
              { relname: "entries_1_idx", opcname: "text_ops", nspname: bloomProofSchema, opcdefault: true },
              { relname: "entries_1_idx", opcname: "text_ops", nspname: bloomProofSchema, opcdefault: true },
            ]);
            for (const code of [0, 5, 996, 997, -1]) {
              const rows = await scanMatchesOracle(client, "select _id from app.entries where code = $1 order by _id", [
                code,
              ]);
              assert.equal(
                rows.length,
                count((row) => row.code === code),
                String(code),
              );
            }
          });

          await witness("opclass:$extension:bloom.text_ops/bloom", async () => {
            const both = "select _id from app.entries where label = $1 and region = $2 order by _id";
            for (const [query, params, expected] of [
              [both, ["label-3", "south"], count((row) => row.label === "label-3" && row.region === "south")],
              [both, ["label-3", "north"], count((row) => row.label === "label-3" && row.region === "north")],
              ["select _id from app.entries where region = $1 order by _id", ["west"], 750],
              ["select _id from app.entries where label = $1 order by _id", ["absent"], 0],
            ] as const) {
              const rows = await scanMatchesOracle(client, query, params);
              assert.equal(rows.length, expected, JSON.stringify(params));
            }
            // NULL keys are not indexed; the bloom plan never answers IS NULL.
            await client.query("begin; set local enable_seqscan=off");
            try {
              const plan = JSON.stringify(
                (await client.query("explain (format json) select _id from app.entries where label is null")).rows,
              );
              assert.doesNotMatch(plan, /entries_1_idx/);
            } finally {
              await client.query("rollback");
            }
          });

          await witness("routine:$extension:bloom.blhandler(pg_catalog.internal)", async () => {
            const handler = await client.query(
              `select p.proname, n.nspname, p.prorettype::regtype::text returns from pg_am am
               join pg_proc p on p.oid=am.amhandler join pg_namespace n on n.oid=p.pronamespace where am.amname='bloom'`,
            );
            assert.deepEqual(handler.rows, [
              { proname: "blhandler", nspname: bloomProofSchema, returns: "index_am_handler" },
            ]);
            // Inserts after the build and a rebuild both run through the handler's aminsert/ambuild callbacks.
            await connection.transaction((db) => db.insert(table).values({ code: 5000, label: "fresh", region: "up" }));
            assert.equal(
              (await scanMatchesOracle(client, "select code from app.entries where code = $1", [5000])).length,
              1,
            );
            await client.query("reindex index app.entries_1_idx");
            assert.deepEqual(
              await scanMatchesOracle(client, "select code from app.entries where label = $1 and region = $2", [
                "fresh",
                "up",
              ]),
              [{ code: 5000 }],
            );
            await assert.rejects(client.query(`select ${namespace}.blhandler(null)`), /does not exist/);
          });
        } finally {
          await connection.close();
        }
      } finally {
        await client.end();
      }
    });
  },
  120000,
);
