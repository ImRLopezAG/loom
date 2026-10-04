import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import pg from "pg";
import * as v from "valibot";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import { extensionManifestValidator, type ExtensionMember } from "../../../apps/loom/src/core/extensions/contracts";
import source from "../../../apps/loom/src/tooling/extensions/manifests/timescaledb.json";

/**
 * Shared native characterization for TimescaleDB 2.24.0 (Apache). On an already-connected fresh database whose server
 * preloads timescaledb, it installs the extension in `schema`, builds owned hypertable fixtures, invokes every captured
 * SQL-callable routine directly (each in its own savepoint of one rolled-back transaction) and reads every captured
 * relation. The script and the database integration test both call it; neither substitutes a JS algorithm.
 */
let schema = "extensions";
const manifest = v.parse(extensionManifestValidator, source);
type Routine = Extract<ExtensionMember, { kind: "routine" }>;
type TypeRef = { namespace: string; name: string };
const outcomeValidator = v.variant("status", [
  v.object({ status: v.literal("ok"), rows: v.number(), sample: v.array(v.string()) }),
  v.object({ status: v.literal("error"), code: v.optional(v.string()), message: v.string() }),
  v.object({ status: v.literal("not-selectable") }),
]);
/** The committed receipt shape; tests parse the JSON with it instead of asserting types. */
export const timescaledbNativeReceiptValidator = v.object({
  settings: v.object({ server: v.string(), license: v.string(), version: v.string() }),
  capture: v.object({
    digest: v.string(),
    manifestDigest: v.string(),
    digestMatches: v.boolean(),
    members: v.number(),
    missing: v.array(v.string()),
    extra: v.array(v.string()),
    contractEqual: v.boolean(),
  }),
  fixture: v.record(v.string(), v.union([v.string(), v.number()])),
  members: v.record(
    v.string(),
    v.object({
      kind: v.string(),
      sql: v.optional(v.string()),
      outcome: v.optional(outcomeValidator),
      returns: v.optional(v.string()),
      arguments: v.optional(v.array(v.string())),
    }),
  ),
});
export type TimescaledbNativeReceipt = v.InferOutput<typeof timescaledbNativeReceiptValidator>;
type Outcome = v.InferOutput<typeof outcomeValidator>;
const sqlState = v.object({ code: v.optional(v.string()) });
const nativeSample = v.record(v.string(), v.union([v.string(), v.number(), v.boolean(), v.null()]));
type NativeSample = v.InferOutput<typeof nativeSample>;

const routines = manifest.contract.members.filter((member): member is Routine => member.kind === "routine");
const relations = manifest.contract.members.filter(
  (member): member is Extract<ExtensionMember, { kind: "relation" }> => member.kind === "relation",
);
const typeName = (type: TypeRef) => `${type.namespace}.${type.name}`;
/** Only cstring/internal signatures lack a direct SQL call; everything else is invoked. */
function nativeCallback(routine: Routine): boolean {
  const pseudo = (type: TypeRef) =>
    type.namespace === "pg_catalog" && (type.name === "internal" || type.name === "cstring");
  return pseudo(routine.returns) || routine.arguments.some((argument) => pseudo(argument.type));
}

function qualified(routine: Routine): string {
  const namespace = routine.namespace === "$extension:timescaledb" ? schema : routine.namespace!;
  return `${pg.escapeIdentifier(namespace)}.${pg.escapeIdentifier(routine.name)}`;
}

let fixture: ReturnType<typeof newFixture>;

/** One representative native value per captured argument type and name; NULL only where the C entry point allows it. */
function value(routine: Routine, index: number): string {
  const argument = routine.arguments[index]!;
  const name = argument.name ?? "";
  const type = typeName(argument.type);
  const base = routine.name;
  if (type === "pg_catalog.regclass") {
    if (/chunk/.test(name) || name === "uncompressed_chunk")
      return `'${name === "chunk2" ? fixture.chunk2 : fixture.chunk}'::regclass`;
    if (name === "index" || name === "index_name" || name === "reorder_index") return `'${fixture.index}'::regclass`;
    if (base === "set_integer_now_func" || base === "subtract_integer_from_now")
      return `'${fixture.integerHypertable}'::regclass`;
    if (base === "set_number_partitions") return `'${fixture.hashHypertable}'::regclass`;
    if (base === "create_hypertable") return `'${fixture.plain}'::regclass`;
    if (base === "index_matches") return `'${fixture.index}'::regclass`;
    if (/chunk/.test(base) && !/chunks|hypertable/.test(name) && name !== "relation")
      return `'${fixture.chunk}'::regclass`;
    return `'${fixture.hypertable}'::regclass`;
  }
  if (type === "pg_catalog._regclass") return `ARRAY['${fixture.chunk}','${fixture.chunk2}']::regclass[]`;
  if (type === "pg_catalog.regproc") {
    if (name === "proc") return `'${fixture.jobProc}'::regproc`;
    if (base === "set_integer_now_func") return "'public.ticks_now'::regproc";
    if (name === "chunk_sizing_func") return "'_timescaledb_functions.calculate_chunk_interval'::regproc";
    return "NULL::regproc";
  }
  if (type === "_timescaledb_internal.dimension_info")
    return base === "add_dimension"
      ? `${pg.escapeIdentifier(schema)}.by_hash('device', 2)`
      : `${pg.escapeIdentifier(schema)}.by_range('time')`;
  if (type === "pg_catalog.name") {
    if (name === "tablespace" || /tablespace/.test(name)) return "'pg_default'::name";
    if (name === "index_name") return "'metrics_device_time'::name";
    if (base === "add_dimension" && name === "column_name") return "'device'::name";
    if (/column|time_column/.test(name)) return name.includes("partitioning") ? "'device'::name" : "'time'::name";
    if (name === "dimension_name") return "NULL::name";
    if (name === "schema_name" || name === "associated_schema_name") return "'public'::name";
    if (name === "table_name") return "'metrics'::name";
    return "'time'::name";
  }
  if (type === "pg_catalog.int4") {
    if (name === "job_id") return String(fixture.jobId);
    if (name === "hypertable_id") return String(fixture.hypertableId);
    if (name === "dimension_id") return String(fixture.dimensionId);
    if (/partitions/.test(name)) return base === "add_dimension" ? "2" : "3";
    return "1";
  }
  if (type === "pg_catalog.int2") return "1::int2";
  if (type === "pg_catalog.int8") return "1::int8";
  if (type === "pg_catalog.float4") return "1.5::float4";
  if (type === "pg_catalog.float8") return "1.5::float8";
  if (type === "pg_catalog.numeric") return "1.5::numeric";
  if (type === "pg_catalog.bool") return name === "verbose" ? "false" : "false";
  if (type === "pg_catalog.interval") return "INTERVAL '1 day'";
  if (type === "pg_catalog.timestamptz") return "TIMESTAMPTZ '2024-01-01 00:00:00+00'";
  if (type === "pg_catalog.timestamp") return "TIMESTAMP '2024-01-01 00:00:00'";
  if (type === "pg_catalog.date") return "DATE '2024-01-01'";
  if (type === "pg_catalog.uuid") return `'${fixture.uuid}'::uuid`;
  if (type === "pg_catalog.jsonb") return "'{}'::jsonb";
  if (type === "pg_catalog.json") return "'{}'::json";
  if (type === "pg_catalog.text") {
    if (/timezone|zone/.test(name)) return "'UTC'";
    if (name === "chunk_target_size") return "'1MB'";
    return "NULL::text";
  }
  if (type === "pg_catalog._text") return "ARRAY[]::text[]";
  if (type === "pg_catalog.oid")
    return /chunk/.test(base) ? `${fixture.chunkOid}::oid` : `'${fixture.hypertable}'::regclass::oid`;
  if (type === "pg_catalog.anyrange")
    return "tstzrange(TIMESTAMPTZ '2024-01-01 00:00:00+00', TIMESTAMPTZ '2024-01-02 00:00:00+00')";
  if (type === "pg_catalog.regtype") return "'timestamptz'::regtype";
  if (type === "pg_catalog.regrole") return "current_user::regrole";
  if (type === "pg_catalog.bytea") return "'\\x'::bytea";
  if (type === "pg_catalog.record") return "ROW(TIMESTAMPTZ '2024-01-01 00:00:00+00', 1.0::float8)";
  if (type === "pg_catalog.anyelement" || type === "pg_catalog.any") {
    if (name === "created_before" || name === "created_after" || name === "newer_than") return "NULL::interval";
    if (base === "add_dimension" && name === "chunk_time_interval") return "NULL::bigint";
    if (/older|newer|before|after|refresh|drop|compress/.test(name)) return "INTERVAL '100 years'";
    if (/interval/.test(name)) return "INTERVAL '7 days'";
    if (name === "split_at") return "TIMESTAMPTZ '2024-01-01 12:00:00+00'";
    if (["first", "last", "locf"].includes(base)) return "1.5::float8";
    return "TIMESTAMPTZ '2024-01-01 00:00:00+00'";
  }
  if (type === "pg_catalog.anyarray") return "ARRAY[1]";
  return `NULL::${pg.escapeIdentifier(argument.type.namespace)}.${pg.escapeIdentifier(argument.type.name)}`;
}

function invocation(routine: Routine): string {
  const inputs = routine.arguments
    .map((argument, index) => ({ argument, index }))
    .filter(({ argument }) => argument.mode !== "out" && argument.mode !== "table");
  const args = inputs
    .map(({ argument, index }) => (argument.mode === "variadic" ? "VARIADIC " : "") + value(routine, index))
    .join(", ");
  const callee = qualified(routine);
  if (routine.name === "histogram")
    return `SELECT ${callee}(s.v, 0::float8, 10::float8, 5)::text AS value FROM (VALUES (1.5::float8), (7.5::float8)) AS s(v)`;
  if (routine.routineKind === "procedure") return `CALL ${callee}(${args})`;
  if (routine.routineKind === "aggregate") {
    const columns = inputs
      .map(({ index }) => value(routine, index))
      .map((sql, position) => `${sql} AS a${position}`)
      .join(", ");
    return `SELECT ${callee}(${inputs.map((_, position) => `s.a${position}`).join(", ")})::text AS value FROM (SELECT ${columns} UNION ALL SELECT ${columns}) AS s`;
  }
  if (routine.name === "enable_chunk_skipping" || routine.name === "disable_chunk_skipping")
    return `SET LOCAL timescaledb.enable_chunk_skipping = on; SELECT f::text AS value FROM ${callee}(${args}) AS f`;
  const named = routine.arguments.some(
    (argument) => argument.mode === "out" || argument.mode === "table" || argument.mode === "inout",
  );
  if (routine.returnsSet || (routine.returns.name === "record" && named))
    return `SELECT f::text AS value FROM ${callee}(${args}) AS f`;
  return `SELECT ${callee}(${args})::text AS value`;
}

async function attempt(client: pg.Client, text: string): Promise<Outcome> {
  await client.query("SAVEPOINT member");
  try {
    const results: pg.QueryResult<NativeSample> | pg.QueryResult<NativeSample>[] =
      await client.query<NativeSample>(text);
    const result = Array.isArray(results) ? results.at(-1)! : results;
    // Every member observes the same fixture: successful effects are rolled back too.
    await client.query("ROLLBACK TO SAVEPOINT member");
    return {
      status: "ok",
      rows: result.rowCount ?? 0,
      sample: result.rows.slice(0, 3).map((row: NativeSample) => JSON.stringify(v.parse(nativeSample, row))),
    };
  } catch (cause) {
    await client.query("ROLLBACK TO SAVEPOINT member");
    assert(cause instanceof Error);
    return { status: "error", code: v.parse(sqlState, cause).code, message: cause.message };
  }
}

function normalized(members: readonly ExtensionMember[]): string[] {
  return members.map((member) => JSON.stringify(member)).sort();
}

function newFixture(suffix: string) {
  return {
    hypertable: "public.metrics",
    integerHypertable: "public.ticks",
    chunk: "",
    chunk2: "",
    index: "public.metrics_device_time",
    hashHypertable: "public.readings",
    plain: "public.plain",
    chunkOid: 0,
    hypertableId: 0,
    dimensionId: 0,
    jobProc: `public."loom_job_${suffix}"`,
    jobId: 0,
    uuid: "0190163d-8694-739b-aea5-966c26f8ad91",
  };
}

export async function characterizeTimescaledb(
  client: pg.Client,
  installation: string,
  suffix: string,
): Promise<TimescaledbNativeReceipt> {
  schema = installation;
  fixture = newFixture(suffix);
  await client.query(`CREATE SCHEMA ${pg.escapeIdentifier(schema)}`);
  await client.query(`CREATE EXTENSION timescaledb WITH SCHEMA ${pg.escapeIdentifier(schema)} VERSION '2.24.0'`);
  const settings = await client.query(
    "SELECT current_setting('server_version') AS server, current_setting('timescaledb.license') AS license, (SELECT extversion FROM pg_extension WHERE extname='timescaledb') AS version",
  );
  const observedSettings = v.parse(timescaledbNativeReceiptValidator.entries.settings, settings.rows[0]);
  const captured = await captureExtensionContract(client, {
    name: "timescaledb",
    provider: "neon",
    fixture: "disposable-local-pg18-docker",
  });
  const local = new Set(captured.contract.members.map((member) => member.id));
  const pinned = new Set(manifest.contract.members.map((member) => member.id));
  const capture = {
    digest: captured.digest,
    manifestDigest: manifest.digest,
    digestMatches: captured.digest === manifest.digest,
    members: captured.contract.members.length,
    missing: [...pinned].filter((id) => !local.has(id)),
    extra: [...local].filter((id) => !pinned.has(id)),
    contractEqual: isDeepStrictEqual(normalized(captured.contract.members), normalized(manifest.contract.members)),
  };
  await client.query(`SET search_path = public, ${pg.escapeIdentifier(schema)}`);
  await client.query(`
    CREATE TABLE public.metrics(time timestamptz NOT NULL, device int NOT NULL, value float8);
    SELECT ${pg.escapeIdentifier(schema)}.create_hypertable('public.metrics', ${pg.escapeIdentifier(schema)}.by_range('time', INTERVAL '1 day'));
    CREATE INDEX metrics_device_time ON public.metrics(device, time);
    INSERT INTO public.metrics SELECT TIMESTAMPTZ '2024-01-01 00:00:00+00' + n * INTERVAL '6 hours', n % 3, n FROM generate_series(0, 19) n;
    CREATE TABLE public.ticks(time bigint NOT NULL, value int);
    SELECT ${pg.escapeIdentifier(schema)}.create_hypertable('public.ticks', ${pg.escapeIdentifier(schema)}.by_range('time', 100));
    CREATE TABLE public.readings(time timestamptz NOT NULL, device int NOT NULL);
    SELECT ${pg.escapeIdentifier(schema)}.create_hypertable('public.readings', ${pg.escapeIdentifier(schema)}.by_range('time'));
    SELECT ${pg.escapeIdentifier(schema)}.add_dimension('public.readings', ${pg.escapeIdentifier(schema)}.by_hash('device', 2));
    CREATE TABLE public.plain(time timestamptz NOT NULL, device int NOT NULL, value int);
    CREATE FUNCTION public.ticks_now() RETURNS bigint LANGUAGE sql STABLE AS 'SELECT 1000::bigint';
    CREATE PROCEDURE ${fixture.jobProc}(job_id int, config jsonb) LANGUAGE plpgsql AS $$ BEGIN PERFORM 1; END $$;
    ANALYZE public.metrics;
  `);
  const chunks = await client.query(
    `SELECT c::text AS chunk FROM ${pg.escapeIdentifier(schema)}.show_chunks('public.metrics') c ORDER BY 1`,
  );
  fixture.chunk = chunks.rows[0].chunk;
  fixture.chunk2 = chunks.rows[1].chunk;
  fixture.chunkOid = Number((await client.query("SELECT $1::regclass::oid::int8 AS oid", [fixture.chunk])).rows[0].oid);
  const ids = await client.query(
    "SELECT h.id AS hypertable, d.id AS dimension FROM _timescaledb_catalog.hypertable h JOIN _timescaledb_catalog.dimension d ON d.hypertable_id=h.id WHERE h.table_name='metrics'",
  );
  fixture.hypertableId = ids.rows[0].hypertable;
  fixture.dimensionId = ids.rows[0].dimension;
  // add_job is TSL-licensed: under Apache no job is created, so job members target a pre-existing system job.
  const job = await client.query("SELECT coalesce(min(job_id), 0)::int AS id FROM timescaledb_information.jobs");
  fixture.jobId = job.rows[0].id;
  const fixtureReceipt = { ...fixture };
  await client.query("BEGIN");
  const members: TimescaledbNativeReceipt["members"] = {};
  for (const routine of routines) {
    if (nativeCallback(routine)) {
      members[routine.id] = {
        kind: "native-callback",
        returns: typeName(routine.returns),
        arguments: routine.arguments.map((argument) => typeName(argument.type)),
      };
      continue;
    }
    const sql = invocation(routine);
    members[routine.id] = { kind: routine.routineKind, sql, outcome: await attempt(client, sql) };
  }
  for (const relation of relations) {
    const [namespace, name] =
      relation.namespace === "$extension:timescaledb" ? [schema, relation.name] : [relation.namespace!, relation.name];
    if (relation.relationKind === "i" || relation.relationKind === "t" || namespace === "pg_toast") {
      members[relation.id] = { kind: relation.relationKind, outcome: { status: "not-selectable" } };
      continue;
    }
    const sql = `SELECT count(*)::int AS value FROM ${pg.escapeIdentifier(namespace)}.${pg.escapeIdentifier(name)}`;
    members[relation.id] = { kind: relation.relationKind, sql, outcome: await attempt(client, sql) };
  }
  await client.query("ROLLBACK");

  // Only the job this run created (exact UUID name) is removed.
  const created = await client.query(
    "SELECT count(*)::int AS n FROM timescaledb_information.jobs WHERE proc_name = $1",
    [`loom_job_${suffix}`],
  );
  assert.equal(created.rows[0].n, 0);
  return { settings: observedSettings, capture, fixture: fixtureReceipt, members };
}
