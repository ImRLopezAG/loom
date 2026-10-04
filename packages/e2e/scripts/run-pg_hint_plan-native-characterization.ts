import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import pg from "pg";
import * as v from "valibot";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pg_hint_plan.json";

/**
 * Read-only-output native characterization of pg_hint_plan 1.8.0 on a disposable, startup-preloaded PostgreSQL 18
 * fixture. It creates and force-drops its own UUID database and role and prints one JSON receipt. It is not a
 * provider (Neon) gate and never changes server configuration.
 */
const connectionString = process.env.LOOM_TEST_DATABASE_URL;
if (!connectionString) throw new Error("Missing PostgreSQL 18 pg_hint_plan fixture");
const suffix = crypto.randomUUID().replaceAll("-", "");
const database = `loom_ext_${suffix}`;
const role = `loom_hint_${suffix}`;
const admin = new pg.Client({ connectionString });
type Outcome = { ok: unknown } | { error: { code: string | undefined; message: string } };
const nativeError = v.object({ code: v.optional(v.string()), message: v.string() });
async function attempt(client: pg.Client, text: string, values: unknown[] = []): Promise<Outcome> {
  try {
    const result = await client.query(text, values);
    return { ok: result.rows };
  } catch (cause) {
    const error = v.parse(nativeError, cause);
    return { error: { code: error.code, message: error.message } };
  }
}
interface PlanNode {
  readonly "Node Type": string;
  readonly "Index Name"?: string | undefined;
  readonly Plans?: readonly PlanNode[] | undefined;
}
const planNode: v.GenericSchema<PlanNode> = v.object({
  "Node Type": v.string(),
  "Index Name": v.optional(v.string()),
  Plans: v.optional(v.array(v.lazy(() => planNode))),
});
function scanNodes(node: PlanNode): string[] {
  return [
    `${node["Node Type"]}${node["Index Name"] ? `:${node["Index Name"]}` : ""}`,
    ...(node.Plans ?? []).flatMap(scanNodes),
  ];
}
async function plan(client: pg.Client, text: string, values: unknown[] = []) {
  // JSON stays exact text; PostgreSQL itself extracts the int64 query identifier without JS number rounding.
  const result = await client.query({
    text: `EXPLAIN (VERBOSE, FORMAT JSON) ${text}`,
    values,
    types: {
      getTypeParser: (oid: number, format?: "text" | "binary") =>
        oid === 114 ? (value: string) => value : pg.types.getTypeParser(oid, format),
    },
  });
  const document = v.parse(v.string(), result.rows[0]["QUERY PLAN"]);
  const queryId = v.parse(
    v.nullable(v.string()),
    (await client.query("SELECT ($1::pg_catalog.jsonb #>> '{0,Query Identifier}') AS id", [document])).rows[0].id,
  );
  const [parsed] = v.parse(v.tuple([v.object({ Plan: planNode })]), JSON.parse(document));
  return { nodes: scanNodes(parsed.Plan), queryId };
}
const receipt = new Map<string, Outcome | object | string[] | boolean>();
await admin.connect();
try {
  receipt.set(
    "server",
    (
      await admin.query(
        "SELECT current_setting('server_version_num') AS version, current_setting('shared_preload_libraries') AS preload, current_setting('compute_query_id') AS queryid",
      )
    ).rows[0],
  );
  await admin.query(`CREATE DATABASE ${quoteIdentifier(database)}`);
  await admin.query(`CREATE ROLE ${quoteIdentifier(role)} LOGIN PASSWORD 'p'`);
  const url = new URL(connectionString);
  url.pathname = `/${database}`;
  const client = new pg.Client({ connectionString: url.href });
  await client.connect();
  try {
    await client.query("CREATE EXTENSION pg_hint_plan VERSION '1.8.0'");
    const captured = await captureExtensionContract(client, {
      name: "pg_hint_plan",
      provider: "neon",
      fixture: "disposable-local-pg18-docker",
    });
    receipt.set("capture", {
      serverVersion: captured.provenance.serverVersion,
      installationSchema: captured.provenance.installationSchema,
      digest: captured.digest,
      manifestDigest: manifest.digest,
      digestMatches: captured.digest === manifest.digest,
      contractMatches: isDeepStrictEqual(captured.contract, manifest.contract),
      members: captured.contract.members.map((member) => member.id),
    });
    const q = (text: string, values: unknown[] = []) => attempt(client, text, values);
    receipt.set(
      "settings",
      await q(
        "SELECT name, setting, context, vartype, enumvals FROM pg_catalog.pg_settings WHERE name LIKE 'pg_hint_plan.%' ORDER BY name",
      ),
    );
    receipt.set(
      "tableDefinition",
      await q(
        "SELECT a.attname, pg_catalog.format_type(a.atttypid,a.atttypmod) AS type, a.attnotnull, pg_catalog.pg_get_expr(d.adbin,d.adrelid) AS default FROM pg_catalog.pg_attribute a LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid='hint_plan.hints'::regclass AND a.attnum>0 AND NOT a.attisdropped ORDER BY a.attnum",
      ),
    );
    receipt.set(
      "indexes",
      await q("SELECT indexname, indexdef FROM pg_catalog.pg_indexes WHERE schemaname='hint_plan' ORDER BY indexname"),
    );
    receipt.set(
      "constraints",
      await q(
        "SELECT conname, contype, pg_catalog.pg_get_constraintdef(oid) AS def FROM pg_catalog.pg_constraint WHERE conrelid='hint_plan.hints'::regclass ORDER BY conname",
      ),
    );
    receipt.set(
      "privileges",
      await q(
        "SELECT c.relname, c.relacl::text AS acl FROM pg_catalog.pg_class c WHERE c.relnamespace='hint_plan'::regnamespace ORDER BY c.relname",
      ),
    );
    receipt.set(
      "schemaAcl",
      await q("SELECT nspacl::text AS acl FROM pg_catalog.pg_namespace WHERE nspname='hint_plan'"),
    );
    receipt.set(
      "rowType",
      await q(
        "SELECT ROW(1, 2::int8, 'app', 'SeqScan(t)')::hint_plan.hints::text AS row, ARRAY[ROW(1, 2::int8, 'a,\"b', 'x y')::hint_plan.hints, NULL]::hint_plan.hints[]::text AS array",
      ),
    );

    await client.query("CREATE TABLE public.hint_items(id integer PRIMARY KEY, label text)");
    await client.query("INSERT INTO public.hint_items SELECT n, 'item ' || n FROM generate_series(1, 20000) n");
    await client.query("ANALYZE public.hint_items");
    const statement = "SELECT * FROM public.hint_items t WHERE t.id = 42";
    receipt.set("baseline", await plan(client, statement));
    receipt.set("commentHint", await plan(client, `/*+ SeqScan(t) */ ${statement}`));
    const parameterized = "SELECT * FROM public.hint_items t WHERE t.id = $1";
    const base = await plan(client, parameterized, [42]);
    receipt.set("parameterizedBaseline", base);
    const queryId = base.queryId;
    assert(queryId !== null);
    receipt.set("literalQueryIdEqualsParameterized", (await plan(client, statement)).queryId === queryId);
    receipt.set(
      "hintsInsert",
      await q(
        "INSERT INTO hint_plan.hints(query_id, application_name, hints) VALUES ($1::int8, '', 'SeqScan(t)') RETURNING ROW(hints.*)::text AS row",
        [queryId],
      ),
    );
    receipt.set("tableDisabled", await plan(client, parameterized, [42]));
    await client.query("SET pg_hint_plan.enable_hint_table = on");
    receipt.set("tableEnabledEmptyApp", await plan(client, parameterized, [42]));
    receipt.set("tableEnabledLiteral", await plan(client, statement));
    await client.query("SET application_name = 'loom-app'");
    receipt.set("tableEnabledOtherAppEmptyRowMatches", await plan(client, parameterized, [42]));
    await client.query(
      "INSERT INTO hint_plan.hints(query_id, application_name, hints) VALUES ($1::int8, 'loom-app', 'BitmapScan(t)')",
      [queryId],
    );
    receipt.set("tableEnabledSpecificApp", await plan(client, parameterized, [42]));
    receipt.set("tableBeatsComment", await plan(client, `/*+ IndexScan(t) */ ${parameterized}`, [42]));
    receipt.set(
      "duplicate",
      await q(
        "INSERT INTO hint_plan.hints(query_id, application_name, hints) VALUES ($1::int8, 'loom-app', 'SeqScan(t)')",
        [queryId],
      ),
    );
    receipt.set(
      "nullHints",
      await q("INSERT INTO hint_plan.hints(query_id, application_name, hints) VALUES (1, 'x', NULL)"),
    );
    receipt.set(
      "nullApp",
      await q("INSERT INTO hint_plan.hints(query_id, application_name, hints) VALUES (1, NULL, 'x')"),
    );
    receipt.set(
      "nullQueryId",
      await q("INSERT INTO hint_plan.hints(query_id, application_name, hints) VALUES (NULL, 'x', 'x')"),
    );
    await client.query(
      "SET client_min_messages = log; SET pg_hint_plan.debug_print = on; SET pg_hint_plan.parse_messages = warning",
    );
    const notices: string[] = [];
    client.on("notice", (notice) => notices.push(`${notice.severity}: ${notice.message}`));
    await client.query("UPDATE hint_plan.hints SET hints = 'NoSuchHint(t)' WHERE application_name = 'loom-app'");
    receipt.set("invalidHintPlan", await plan(client, parameterized, [42]));
    receipt.set("invalidHintNotices", [...notices]);
    await client.query("RESET client_min_messages; RESET pg_hint_plan.debug_print; RESET pg_hint_plan.parse_messages");
    await client.query("BEGIN");
    const seqBefore = (await client.query("SELECT last_value::text, is_called FROM hint_plan.hints_id_seq")).rows[0];
    await client.query("INSERT INTO hint_plan.hints(query_id, application_name, hints) VALUES (7, 'rollback', 'x')");
    await client.query("ROLLBACK");
    receipt.set("sequenceAfterRollback", {
      before: seqBefore,
      after: (await client.query("SELECT last_value::text, is_called, log_cnt::text FROM hint_plan.hints_id_seq"))
        .rows[0],
    });
    await client.query("RESET application_name; RESET pg_hint_plan.enable_hint_table");
    receipt.set(
      "setLocalScope",
      await q(
        "BEGIN; SET LOCAL pg_hint_plan.enable_hint_table = on; SELECT current_setting('pg_hint_plan.enable_hint_table') AS inside; COMMIT",
      ),
    );
    receipt.set("afterLocal", await q("SELECT current_setting('pg_hint_plan.enable_hint_table') AS after"));

    const other = new pg.Client({
      connectionString: Object.assign(new URL(url.href), { username: role, password: "p" }).href,
    });
    await other.connect();
    try {
      receipt.set("unprivilegedSelect", await attempt(other, "SELECT count(*)::int AS n FROM hint_plan.hints"));
      receipt.set(
        "unprivilegedInsert",
        await attempt(other, "INSERT INTO hint_plan.hints(query_id, application_name, hints) VALUES (9, 'x', 'x')"),
      );
      receipt.set("unprivilegedSet", await attempt(other, "SET pg_hint_plan.enable_hint_table = on"));
    } finally {
      await other.end();
    }
  } finally {
    await client.end();
  }
} finally {
  await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(database)} WITH (FORCE)`);
  await admin.query(`DROP ROLE IF EXISTS ${quoteIdentifier(role)}`);
  await admin.end();
}
console.log(JSON.stringify(Object.fromEntries(receipt), null, 2));
