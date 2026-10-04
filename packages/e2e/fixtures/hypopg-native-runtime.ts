import { writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Run public generated bindings and the operator in a fresh Node 24 process after Bun preparation. */
export async function writeHypopgNativeRuntime(root: string, extensionModule: string) {
  await writeFile(
    join(root, "native.mjs"),
    String.raw`
import assert from "node:assert/strict";
import pg from "pg";
import { sql, defineRelations } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { defineSchema, connectDatabase, createProjectServices, createProjectProcedures, Invocation, serializeRpcValue, deserializeRpcValue } from "kello/server";
import { withHypopg } from "kello/tooling/extensions/hypopg";
import { extensions } from ${JSON.stringify(extensionModule)};
const url = process.env.LOOM_PACKED_HYPOPG_DATABASE_URL;
assert.equal(process.versions.node.split(".")[0], "24");
assert.equal(typeof globalThis.Bun, "undefined");
assert(url, "Parent must supply an owned empty HypoPG fixture database URL");
const api = extensions.hypopg;
const prefix = pg.escapeIdentifier(api.schema);
const client = new pg.Client({ connectionString: url });
await client.connect();
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA " + prefix + "; CREATE EXTENSION hypopg WITH SCHEMA " + prefix + " VERSION '1.4.3'; CREATE TABLE public.hypopg_items(id integer); INSERT INTO public.hypopg_items SELECT generate_series(1,10000); ANALYZE public.hypopg_items");
  const schema = defineSchema(() => ({ snapshots: { listed: api.listField().notNull(), hidden: api.hiddenField().notNull(), lists: api.listArrayField().notNull(), hiddenLists: api.hiddenArrayField().notNull() } }), { namespace: "packed_hypopg" });
  await client.query('CREATE SCHEMA packed_hypopg; CREATE TABLE packed_hypopg.snapshots("_id" uuid PRIMARY KEY DEFAULT uuidv7(), "_createdAt" bigint NOT NULL DEFAULT 1, listed ' + prefix + '.hypopg_list_indexes NOT NULL, hidden ' + prefix + '.hypopg_hidden_indexes NOT NULL, lists ' + prefix + '.hypopg_list_indexes[] NOT NULL, hidden_lists ' + prefix + '.hypopg_hidden_indexes[] NOT NULL)');
  connection = await connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString: url });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, defineRelations(schema.tables), extensions);
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    assert.equal(context.extensions.hypopg, api);
    return api.version;
  });
  const invocation = { requestId: "packed-hypopg", identity: null, signal: new AbortController().signal };
  assert.equal(await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } }), "1.4.3");
  let escaped;
  let stored;
  const result = await withHypopg(url, api, async session => {
    escaped = session;
    const [created] = await session.createIndex("CREATE INDEX ON public.hypopg_items(id)");
    assert(created);
    const [row] = await session.listView();
    assert.equal(row.indexrelid, created.indexrelid);
    assert.equal(row.table_name, "hypopg_items");
    assert.deepEqual(api.listCodec.decode(api.listCodec.encode(row)), row);
    const bounded = { dimensions: [{ lowerBound: -1, length: 2 }], values: [row, null] };
    assert.deepEqual(api.listArrayCodec.decode(api.listArrayCodec.encode(bounded)), bounded);
    assert((await session.relationSize(created.indexrelid)) > 0n);
    assert.match((await session.explain(sql.raw("SELECT * FROM public.hypopg_items WHERE id = 1"))).text, /<\d+>.*btree/);
    assert.equal(await session.hideIndex(created.indexrelid), true);
    assert.equal(await session.hideIndex(created.indexrelid), false);
    assert.equal(await session.hideIndex(null), null);
    const [hidden] = await session.hiddenView();
    assert.equal(hidden.is_hypo, true);
    for (const is_hypo of [false, true, null]) {
      const observation = { ...hidden, is_hypo };
      assert.deepEqual(api.hiddenCodec.decode(api.hiddenCodec.encode(observation)), observation);
    }
    stored = { listed: row, hidden, lists: bounded, hiddenLists: { dimensions: [{ lowerBound: 2, length: 4 }], values: [hidden, { ...hidden, is_hypo: false }, { ...hidden, is_hypo: null }, null] } };
    const values = [...await session.indexes()];
    assert.equal(values[0].indisunique, false);
    assert.deepEqual(deserializeRpcValue(serializeRpcValue(values)), values);
    assert.equal(await session.unhideIndex(created.indexrelid), true);
    assert.equal(await session.unhideIndex(created.indexrelid), false);
    assert.equal(await session.unhideIndex(null), null);
    assert.equal(await session.dropIndex(created.indexrelid), true);
    assert.equal(await session.dropIndex(created.indexrelid), false);
    assert.equal(await session.dropIndex(null), null);
    return values.length;
  });
  assert.equal(result.value, 1);
  assert.equal(result.completion, "committed");
  await assert.rejects(escaped.indexes(), /inactive|owner/);
  await withHypopg(url, api, async session => assert.deepEqual(await session.indexes(), []));
  await connection.transaction(async db => {
    await db.insert(schema.tables.snapshots).values(stored);
    const rows = await db.select({ listed: schema.tables.snapshots.listed, hidden: schema.tables.snapshots.hidden, lists: schema.tables.snapshots.lists, hiddenLists: schema.tables.snapshots.hiddenLists }).from(schema.tables.snapshots);
    assert.deepEqual(rows, [stored]);
    assert.deepEqual(deserializeRpcValue(serializeRpcValue(rows)), rows);
    await db.execute(sql.raw("SELECT * FROM " + prefix + ".hypopg_create_index('CREATE INDEX ON public.hypopg_items(id)')"));
    try {
      const indexed = api.indexRows("i");
      const [index] = await db.select(indexed.columns).from(indexed.from);
      assert.equal(index.indkey, "1");
      const listed = api.listView("l");
      assert.equal((await db.select(listed.columns).from(listed.from))[0].indexrelid, index.indexrelid);
      const [scalars] = await db.select({ definition: api.getIndexdef(index.indexrelid), size: api.relationSize(index.indexrelid), absent: api.getIndexdef(0), nullSize: api.relationSize(null) }).from(sql.raw("(values(1)) fixture(id)"));
      assert.match(scalars.definition, /CREATE INDEX/);
      assert(scalars.size > 0n);
      assert.equal(scalars.absent, null);
      assert.equal(scalars.nullSize, null);
      await db.execute(sql.raw("SELECT " + prefix + ".hypopg_hide_index(" + index.indexrelid + ")"));
      const hidden = api.hiddenIndexRows("h");
      assert.deepEqual(await db.select(hidden.columns).from(hidden.from), [{ indexid: index.indexrelid }]);
      const hiddenView = api.hiddenView("v");
      assert.equal((await db.select(hiddenView.columns).from(hiddenView.from))[0].is_hypo, true);
    } finally {
      await db.execute(sql.raw("SELECT " + prefix + ".hypopg_reset()"));
      await db.execute(sql.raw("SELECT " + prefix + ".hypopg_unhide_all_indexes()"));
    }
  });
  console.log("HypoPG frozen public Node 24 session/planner/RPC context/storage/wire round trips PASS");
} finally { if (connection) await connection.close(); await client.end(); }
`,
  );
}
