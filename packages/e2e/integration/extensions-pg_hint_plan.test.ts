import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import pg from "pg";
import * as v from "valibot";
import { defineRelations, sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createPgHintPlan_1_8_0 } from "../../../apps/loom/src/core/extensions/adapters/pg_hint_plan";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { serializeRpcValue, deserializeRpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import { checkCompiledExtensionQuery, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import {
  withPgHintPlan,
  type PgHintPlanSession,
} from "../../../apps/loom/src/tooling/extensions/operations/pg_hint_plan";
import { ExtensionOperationError } from "../../../apps/loom/src/tooling/extensions/operations";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { pgHintPlanDescriptor, pgHintPlanInstall, pgHintPlanSchema } from "../fixtures/pg_hint_plan";
import { pgHintPlanNativeProofCase, pgHintPlanLifecycleProofCase } from "../fixtures/pg_hint_plan-proof-cases";

const lookup = sql`select * from public.hint_items t where t.id = ${42}`;
interface PlanNode {
  readonly "Node Type": string;
  readonly Plans?: readonly PlanNode[] | undefined;
}
const planNode: v.GenericSchema<PlanNode> = v.object({
  "Node Type": v.string(),
  Plans: v.optional(v.array(v.lazy(() => planNode))),
});
const planDocument = v.tuple([v.object({ Plan: planNode })]);
function scans(document: { readonly text: string }): string[] {
  const visit = (node: PlanNode): string[] => [node["Node Type"], ...(node.Plans ?? []).flatMap(visit)];
  return visit(v.parse(planDocument, JSON.parse(document.text))[0].Plan);
}
const nativeError = v.object({ code: v.string(), constraint: v.optional(v.string()), column: v.optional(v.string()) });
async function failure(work: Promise<unknown>): Promise<v.InferOutput<typeof nativeError>> {
  try {
    await work;
  } catch (cause) {
    return v.parse(nativeError, cause);
  }
  assert.fail("Expected a native PostgreSQL error");
}

extensionProofTest(
  pgHintPlanNativeProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const oracle = new pg.Client({ connectionString: url });
      await oracle.connect();
      const api = createPgHintPlan_1_8_0(pgHintPlanDescriptor);
      const schema = defineSchema(() => ({}));
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: url,
      });
      const prove = async (member: string, assertion: () => void | Promise<void>) => {
        const claim = pgHintPlanNativeProofCase.claims.find((entry) => entry.member === member);
        assert(claim, `Undeclared pg_hint_plan member: ${member}`);
        await extensionProofWitness({ ...claim, schema: pgHintPlanSchema }, assertion);
      };
      try {
        assert.equal(
          Math.floor(Number((await oracle.query("SHOW server_version_num")).rows[0].server_version_num) / 10000),
          18,
        );
        await oracle.query(pgHintPlanInstall);
        await observeExtensionProofDatabase(url, pgHintPlanNativeProofCase.id, "pg_hint_plan");
        let wildcard!: Awaited<ReturnType<PgHintPlanSession["upsertHint"]>>;
        let exact!: Awaited<ReturnType<PgHintPlanSession["upsertHint"]>>;
        let id!: bigint;
        await withPgHintPlan(url, pgHintPlanDescriptor, async (session) => {
          const prerequisites = await session.prerequisites();
          assert.equal(prerequisites.loaded, true);
          assert.match(prerequisites.sharedPreloadLibraries, /pg_hint_plan/);
          assert.equal(prerequisites.enableHintTable, "off");
          assert.equal(prerequisites.hintTableWritable, true);
          id = await session.queryId(lookup);
          const baseline = scans(await session.explain(lookup));
          assert.deepEqual(baseline, ["Index Scan"]);
          // The identifier is exactly PostgreSQL's int8, checked independently by the server.
          const document = await session.explain(lookup);
          assert.equal(
            (await oracle.query("SELECT ($1::jsonb #>> '{0,Query Identifier}') AS id", [document.text])).rows[0].id,
            id.toString(),
          );
          await prove('table:"$extension:pg_hint_plan".hints', async () => {
            wildcard = await session.upsertHint({ queryId: id, applicationName: "", hints: "SeqScan(t)" });
            assert.deepEqual(await session.hints(), [wildcard]);
            assert.deepEqual(scans(await session.explain(lookup)), ["Index Scan"]);
            await session.configure({ enableHintTable: true });
            assert.deepEqual(scans(await session.explain(lookup)), ["Seq Scan"]);
            await session.configure({ enableHintTable: false });
            assert.deepEqual(scans(await session.explain(lookup)), ["Index Scan"]);
            await session.configure({ enableHintTable: true });
          });
          await prove('table column:"$extension:pg_hint_plan".hints.application_name', async () => {
            exact = await session.upsertHint({ queryId: id, applicationName: "loom-app", hints: "BitmapScan(t)" });
            assert.equal(exact.application_name, "loom-app");
            // The operator backend's application_name is not loom-app, so the '' row still applies there.
            assert.deepEqual(scans(await session.explain(lookup)), ["Seq Scan"]);
          });
          await prove('table column:"$extension:pg_hint_plan".hints.hints', async () => {
            const updated = await session.upsertHint({ queryId: id, applicationName: "", hints: "IndexScan(t)" });
            assert.equal(updated.id, wildcard.id);
            assert.equal(updated.hints, "IndexScan(t)");
            assert.deepEqual(scans(await session.explain(lookup)), ["Index Scan"]);
            wildcard = await session.upsertHint({ queryId: id, applicationName: "", hints: "SeqScan(t)" });
            await session.configure({ parseMessages: "error" });
            await session.upsertHint({ queryId: 1n, applicationName: "", hints: "NoSuchHint(t)" });
            assert.deepEqual(scans(await session.explain(lookup)), ["Seq Scan"]);
            await session.configure({ parseMessages: "info" });
          });
          await prove('table column:"$extension:pg_hint_plan".hints.query_id', async () => {
            assert.equal(wildcard.query_id, id);
            const extreme = await session.upsertHint({
              queryId: -9223372036854775808n,
              applicationName: "x",
              hints: "SeqScan(t)",
            });
            assert.equal(extreme.query_id, -9223372036854775808n);
            assert.deepEqual(
              await session.deleteHint({ queryId: -9223372036854775808n, applicationName: "x" }),
              extreme,
            );
            assert.equal(await session.deleteHint({ queryId: -9223372036854775808n, applicationName: "x" }), null);
            assert.equal((await session.deleteHint({ queryId: 1n, applicationName: "" })) !== null, true);
          });
          await prove('table column:"$extension:pg_hint_plan".hints.id', async () => {
            assert(Number.isSafeInteger(wildcard.id) && wildcard.id > 0);
            assert.deepEqual(
              (await session.hints()).map((row) => row.id),
              [wildcard.id, exact.id].sort((a, b) => a - b),
            );
          });
        });
        const other = new pg.Client({ connectionString: url, application_name: "loom-app" });
        await other.connect();
        try {
          await other.query("SET pg_hint_plan.enable_hint_table = on");
          const result = await other.query({
            text: "EXPLAIN (FORMAT JSON) select * from public.hint_items t where t.id = $1",
            values: [42],
            types: { getTypeParser: () => (value: string) => value },
          });
          assert.deepEqual(scans({ text: v.parse(v.string(), result.rows[0]["QUERY PLAN"]) }), [
            "Bitmap Heap Scan",
            "Bitmap Index Scan",
          ]);
        } finally {
          await other.end();
        }
        const committed = (
          await oracle.query("SELECT ROW(h.*)::text AS value FROM hint_plan.hints h ORDER BY id")
        ).rows.map((row) => row.value);
        await prove("type:$extension:pg_hint_plan.hints", async () => {
          const decoded = committed.map((value) => api.rowCodec.decode(value));
          assert.deepEqual(
            decoded.map((row) => row.application_name),
            ["", "loom-app"],
          );
          for (const value of committed) {
            const row = api.codec.decode(value);
            const echoed = (await oracle.query("SELECT $1::hint_plan.hints::text AS value", [api.codec.encode(row)]))
              .rows[0].value;
            assert.equal(echoed, value);
          }
          const nulls = (await oracle.query("SELECT ROW(NULL, NULL, NULL, NULL)::hint_plan.hints::text AS value"))
            .rows[0].value;
          assert.deepEqual(api.codec.decode(nulls), { id: null, query_id: null, application_name: null, hints: null });
          assert.throws(() => api.rowCodec.decode(nulls));
        });
        await prove("type:$extension:pg_hint_plan._hints", async () => {
          const text = (
            await oracle.query(
              "SELECT ('[-1:1]=' || array_append(array_agg(h ORDER BY h.id), NULL)::text)::hint_plan.hints[]::text AS value FROM hint_plan.hints h",
            )
          ).rows[0].value;
          const array = api.arrayCodec.decode(text);
          assert.deepEqual(array.dimensions, [{ lowerBound: -1, length: 3 }]);
          assert.deepEqual(
            array.values.slice(0, 2),
            committed.map((value) => api.codec.decode(value)),
          );
          assert.equal(array.values[2], null);
          assert.equal(
            (await oracle.query("SELECT $1::hint_plan.hints[]::text AS value", [api.arrayCodec.encode(array)])).rows[0]
              .value,
            text,
          );
        });
        await connection.transaction(async (db) => {
          const rows = api.hintRows("h");
          const observed = await db.select(rows.columns).from(rows.from).orderBy(rows.columns.id);
          assert.deepEqual(
            observed,
            committed.map((value) => api.rowCodec.decode(value)),
          );
          assert.deepEqual(deserializeRpcValue(serializeRpcValue(observed)), observed);
          const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
            db.select(rows.columns).from(rows.from).getSQL(),
          );
          assert(checkCompiledExtensionQuery(compiled).some((contract) => contract.observability === "external"));
        });
        const sequence = () =>
          oracle
            .query(
              "SELECT last_value::text AS last_value, is_called, log_cnt::text AS log_cnt FROM hint_plan.hints_id_seq",
            )
            .then((result) => result.rows[0]);
        const before = await sequence();
        await prove('sequence:"$extension:pg_hint_plan".hints_id_seq', async () => {
          assert.equal(
            (await oracle.query("SELECT pg_get_serial_sequence('hint_plan.hints','id') AS name")).rows[0].name,
            "hint_plan.hints_id_seq",
          );
          await oracle.query("BEGIN");
          const inserted = (
            await oracle.query(
              "INSERT INTO hint_plan.hints(query_id, application_name, hints) VALUES (7, 'rollback', 'x') RETURNING id",
            )
          ).rows[0].id;
          await oracle.query("ROLLBACK");
          assert.equal(String(inserted), String(BigInt(before.last_value) + 1n));
        });
        const after = await sequence();
        await prove('sequence column:"$extension:pg_hint_plan".hints_id_seq.last_value', () =>
          assert.equal(BigInt(after.last_value), BigInt(before.last_value) + 1n),
        );
        await prove('sequence column:"$extension:pg_hint_plan".hints_id_seq.is_called', () =>
          assert.equal(after.is_called, true),
        );
        await prove('sequence column:"$extension:pg_hint_plan".hints_id_seq.log_cnt', () =>
          assert(BigInt(after.log_cnt) >= 0n && BigInt(after.log_cnt) <= 32n),
        );
        const insert = (values: string) =>
          oracle.query(`INSERT INTO hint_plan.hints(id, query_id, application_name, hints) VALUES ${values}`);
        await prove('index:"$extension:pg_hint_plan".hints_id_and_app', async () => {
          const error = await failure(insert(`(1000, ${id}, 'loom-app', 'SeqScan(t)')`));
          assert.equal(error.code, "23505");
          assert.equal(error.constraint, "hints_id_and_app");
        });
        await prove('index:"$extension:pg_hint_plan".hints_pkey', async () => {
          const error = await failure(insert(`(${exact.id}, 99, 'other', 'x')`));
          assert.equal(error.code, "23505");
          assert.equal(error.constraint, "hints_pkey");
        });
        await prove('table constraint:hints_pkey on "$extension:pg_hint_plan".hints', async () => {
          assert.equal(
            (
              await oracle.query(
                "SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname='hints_pkey' AND conrelid='hint_plan.hints'::regclass",
              )
            ).rows[0].def,
            "PRIMARY KEY (id)",
          );
          assert.equal((await failure(insert(`(${wildcard.id}, 98, 'other', 'x')`))).constraint, "hints_pkey");
        });
        for (const [column, values] of [
          ["application_name", "(2001, 5, NULL, 'x')"],
          ["hints", "(2002, 5, 'a', NULL)"],
          ["id", "(NULL, 5, 'b', 'x')"],
          ["query_id", "(2003, NULL, 'c', 'x')"],
        ] as const)
          await prove(`table constraint:hints_${column}_not_null on "$extension:pg_hint_plan".hints`, async () => {
            const error = await failure(insert(values));
            assert.equal(error.code, "23502");
            assert.equal(error.column, column);
          });
        await prove('toast table:pg_toast."$toast:hints"', async () => {
          const long = randomBytes(12000).toString("base64");
          await insert(`(3000, 3, 'toast', '${long}')`);
          const toast = (
            await oracle.query(
              "SELECT c.reltoastrelid::regclass::text AS name, pg_relation_size(c.reltoastrelid) AS size FROM pg_class c WHERE c.oid='hint_plan.hints'::regclass",
            )
          ).rows[0];
          assert.match(toast.name, /^pg_toast\.pg_toast_\d+$/);
          assert(Number(toast.size) > 0);
          assert.equal((await oracle.query("SELECT hints FROM hint_plan.hints WHERE id=3000")).rows[0].hints, long);
        });
        await prove('index:pg_toast."$toast-index:hints"', async () => {
          const index = (
            await oracle.query(
              "SELECT i.indexrelid::regclass::text AS name, i.indisunique FROM pg_index i JOIN pg_class c ON c.reltoastrelid=i.indrelid WHERE c.oid='hint_plan.hints'::regclass",
            )
          ).rows;
          assert.equal(index.length, 1);
          assert.equal(index[0].indisunique, true);
          assert.match(index[0].name, /^pg_toast\.pg_toast_\d+_index$/);
        });
      } finally {
        await connection.close();
        await oracle.end();
      }
    });
  },
  120000,
);

extensionProofTest(
  pgHintPlanLifecycleProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const oracle = new pg.Client({ connectionString: url });
      await oracle.connect();
      try {
        await oracle.query(pgHintPlanInstall);
        const failed = await withPgHintPlan(url, pgHintPlanDescriptor, async (session) => {
          await session.configure({ enableHintTable: true, debugPrint: "verbose", messageLevel: "notice" });
          await session.upsertHint({
            queryId: await session.queryId(lookup),
            applicationName: "",
            hints: "SeqScan(t)",
          });
          throw new Error("callback failure");
        }).catch((cause: unknown) => cause);
        assert(failed instanceof ExtensionOperationError);
        assert.equal((await oracle.query("SELECT count(*)::int AS n FROM hint_plan.hints")).rows[0].n, 0);
        await withPgHintPlan(url, pgHintPlanDescriptor, async (session) => {
          assert.equal((await session.prerequisites()).enableHintTable, "off");
          await session.configure({ enableHintTable: true });
          assert.equal((await session.prerequisites()).enableHintTable, "on");
        });
        const settings = (
          await oracle.query(
            "SELECT current_setting('pg_hint_plan.enable_hint_table') AS t, current_setting('pg_hint_plan.debug_print') AS d",
          )
        ).rows[0];
        assert.deepEqual(settings, { t: "off", d: "off" });
        const committed = await withPgHintPlan(url, pgHintPlanDescriptor, async (session) =>
          session.upsertHint({ queryId: 5n, applicationName: "", hints: "SeqScan(t)" }),
        );
        assert.equal(committed.completion, "committed");
        assert.equal((await oracle.query("SELECT count(*)::int AS n FROM hint_plan.hints")).rows[0].n, 1);
      } finally {
        await oracle.end();
      }
    });
  },
  120000,
);
