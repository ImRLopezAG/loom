import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import pg from "pg";
import * as v from "valibot";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/vector.json";
import type { ExactVector086Descriptor } from "../../../apps/loom/src/tooling/extensions/vector";
import { vectorSchema, withNativeVector } from "./vector-codecs";

const quote = pg.escapeIdentifier;
const settingRows = v.array(v.looseObject({ name: v.string(), setting: v.string(), reset_val: v.string() }));

export const dimensions = 8;
export const rowCount = 2400;
export const categories = 10;
export const lists = 20;
export const descriptor: ExactVector086Descriptor = {
  name: "vector",
  version: "0.8.6",
  schema: vectorSchema,
  apiSupport: { status: "verified", digest: capture.digest },
};
/** The seven closed settings, in the tagged registration order. */
export const settingNames = [
  "hnsw.ef_search",
  "hnsw.iterative_scan",
  "hnsw.max_scan_tuples",
  "hnsw.scan_mem_multiplier",
  "ivfflat.probes",
  "ivfflat.iterative_scan",
  "ivfflat.max_probes",
] as const;
/** Compiled defaults as pg_settings text; baseline facts of a role or database may differ. */
export const sourceDefaults = [
  ["hnsw.ef_search", "40"],
  ["hnsw.iterative_scan", "off"],
  ["hnsw.max_scan_tuples", "20000"],
  ["hnsw.scan_mem_multiplier", "1"],
  ["ivfflat.probes", "1"],
  ["ivfflat.iterative_scan", "off"],
  ["ivfflat.max_probes", "32768"],
] as const;

export interface TableNames {
  readonly table: { readonly schema: string; readonly name: string };
  readonly id: string;
  readonly embedding: string;
  readonly category: string;
  readonly index: string | undefined;
}
export interface Environment {
  readonly url: string;
  readonly admin: pg.Client;
  readonly database: string;
  readonly annSchema: string;
  readonly hnsw: TableNames;
  readonly ivfflat: TableNames;
  readonly small: {
    readonly vector: TableNames;
    readonly halfvec: TableNames;
    readonly sparsevec: TableNames;
    readonly bit: TableNames;
  };
  /** A view whose embedding expression natively sets hnsw.scan_mem_multiplier to 1.23456 (session level). */
  readonly drift: TableNames;
  /** Rows with a NULL id: native NULL reaches the closed decoder. */
  readonly nullIds: TableNames;
  /** Rows whose native distances are NaN and Infinity. */
  readonly nonfinite: TableNames;
  /** A relation whose name is exactly 63 UTF-8 bytes. */
  readonly boundary: TableNames;
}

// Deliberately awkward but valid identifiers: embedded quotes, Unicode and a backslash.
const annSchema = 'Ünï"cödé_日本';
const names = (name: string, index?: string): TableNames => ({
  table: { schema: annSchema, name },
  id: 'id "é"',
  embedding: "embedding\\日本",
  category: 'category "c"',
  index,
});
/** Deterministic dense data. Both the owner and the independent oracle read this same table. */
const dataSql = (table: TableNames, type: string) =>
  `INSERT INTO ${quote(annSchema)}.${quote(table.table.name)} (${quote(table.id)}, ${quote(table.category)}, ${quote(table.embedding)})
   SELECT g, (g % ${categories})::pg_catalog.int4,
     ARRAY(SELECT pg_catalog.sin(g * 0.37 * k + k)::pg_catalog.float4 FROM pg_catalog.generate_series(1, ${dimensions}) k ORDER BY k)::${type}
   FROM pg_catalog.generate_series(1, ${rowCount}) g`;
export const queryVector: readonly number[] = [0.3, -0.2, 0.9, 0.1, -0.7, 0.4, 0.05, -0.3];

async function seed(admin: pg.Client): Promise<Environment> {
  const type = (kind: string, size?: number) =>
    `${quote(vectorSchema)}.${kind}${size === undefined ? "" : `(${size})`}`;
  const ann = quote(annSchema);
  const hnsw = names('hnsw "docs"', "vector_hnsw_idx");
  const ivfflat = names('ivfflat "docs"', "vector_ivfflat_idx");
  const small = {
    vector: names('small "vector"'),
    halfvec: names('small "halfvec"'),
    sparsevec: names('small "sparsevec"'),
    bit: names('small "bit"'),
  };
  await admin.query(`CREATE SCHEMA ${ann}`);
  for (const [table, kind] of [
    [hnsw, "vector"],
    [ivfflat, "vector"],
  ] as const) {
    await admin.query(
      `CREATE TABLE ${ann}.${quote(table.table.name)} (${quote(table.id)} pg_catalog.int8 PRIMARY KEY, ${quote(table.category)} pg_catalog.int4 NOT NULL, ${quote(table.embedding)} ${type(kind, dimensions)})`,
    );
    await admin.query(dataSql(table, type(kind, dimensions)));
  }
  await admin.query(
    `CREATE INDEX vector_hnsw_idx ON ${ann}.${quote(hnsw.table.name)} USING hnsw (${quote(hnsw.embedding)} ${quote(vectorSchema)}.vector_l2_ops) WITH (m = 16, ef_construction = 64)`,
  );
  await admin.query(
    `CREATE INDEX vector_ivfflat_idx ON ${ann}.${quote(ivfflat.table.name)} USING ivfflat (${quote(ivfflat.embedding)} ${quote(vectorSchema)}.vector_l2_ops) WITH (lists = ${lists})`,
  );
  const smallRows: readonly (readonly [keyof Environment["small"], string, readonly string[]])[] = [
    ["vector", type("vector", 3), ["[1,0,0]", "[0,1,0]", "[0.5,0.5,0]", "[1,2,3]", "[-1,-1,1]", "[3,2,1]"]],
    ["halfvec", type("halfvec", 3), ["[1,0,0]", "[0,1,0]", "[0.5,0.5,0]", "[1,2,3]", "[-1,-1,1]", "[3,2,1]"]],
    [
      "sparsevec",
      type("sparsevec", 4),
      ["{1:1}/4", "{2:1}/4", "{1:0.5,2:0.5}/4", "{1:1,3:2,4:3}/4", "{1:-1,2:-1,4:1}/4", "{1:3,2:2,3:1}/4"],
    ],
    ["bit", "pg_catalog.bit(4)", ["0000", "0101", "1111", "1010", "0011", "1100"]],
  ];
  for (const [kind, columnType, values] of smallRows) {
    const table = small[kind];
    await admin.query(
      `CREATE TABLE ${ann}.${quote(table.table.name)} (${quote(table.id)} pg_catalog.int8 PRIMARY KEY, ${quote(table.category)} pg_catalog.int4 NOT NULL, ${quote(table.embedding)} ${columnType})`,
    );
    for (const [position, value] of values.entries())
      await admin.query(`INSERT INTO ${ann}.${quote(table.table.name)} VALUES ($1, $2, $3::${columnType})`, [
        position + 1,
        position % 2,
        value,
      ]);
  }
  const plain3 = (table: TableNames, nullable: boolean) =>
    `CREATE TABLE ${ann}.${quote(table.table.name)} (${quote(table.id)} pg_catalog.int8${nullable ? "" : " PRIMARY KEY"}, ${quote(table.category)} pg_catalog.int4 NOT NULL, ${quote(table.embedding)} ${type("vector", 3)})`;
  const nullIds = names('null "ids"');
  const nonfinite = names('non "finite"');
  const boundary = names(`${"é".repeat(31)}a`);
  const drift = names('drift "view"');
  await admin.query(plain3(nullIds, true));
  await admin.query(`INSERT INTO ${ann}.${quote(nullIds.table.name)} VALUES (NULL, 0, '[1,2,3]'), (2, 1, '[3,2,1]')`);
  await admin.query(plain3(nonfinite, false));
  // Zero norm makes cosine NaN; opposite float4 extremes overflow single-precision l2 accumulation to Infinity.
  await admin.query(
    `INSERT INTO ${ann}.${quote(nonfinite.table.name)} VALUES (1, 0, '[0,0,0]'), (2, 1, '[3e38,0,0]'), (3, 0, '[1,1,1]'), (4, 1, '[0.5,0,0]')`,
  );
  await admin.query(plain3(boundary, false));
  await admin.query(
    `INSERT INTO ${ann}.${quote(boundary.table.name)} VALUES (1, 0, '[1,2,3]'), (2, 1, '[3,2,1]'), (3, 0, '[0,1,0]')`,
  );
  // Native expression behavior: reading the embedding moves a registered setting at session level.
  await admin.query(
    `CREATE VIEW ${ann}.${quote(drift.table.name)} AS SELECT ${quote(small.vector.id)}, ${quote(small.vector.category)}, CASE WHEN pg_catalog.set_config('hnsw.scan_mem_multiplier', '1.23456', false) IS NOT NULL THEN ${quote(small.vector.embedding)} END AS ${quote(drift.embedding)} FROM ${ann}.${quote(small.vector.table.name)}`,
  );
  await admin.query(`ANALYZE ${ann}.${quote(hnsw.table.name)}`);
  await admin.query(`ANALYZE ${ann}.${quote(ivfflat.table.name)}`);
  const database = v.parse(
    v.tuple([v.strictObject({ name: v.string() })]),
    (await admin.query("SELECT current_database() AS name")).rows,
  )[0].name;
  // Planner determinism for index-intent witnesses only; this is not one of the seven vector settings.
  await admin.query(`ALTER DATABASE ${quote(database)} SET enable_seqscan = off`);
  return { url: "", admin, database, annSchema, hnsw, ivfflat, small, drift, nullIds, nonfinite, boundary };
}

/** Disposable PostgreSQL 18 database with pgvector 0.8.6 relocated into the quoted Unicode schema. */
export async function withVectorTooling(operation: (environment: Environment) => Promise<void>) {
  await withNativeVector(async (admin, url) => {
    const environment = await seed(admin);
    await operation({ ...environment, url });
  });
}

/** Another actual login role, with scoped grants and optional per-database baseline settings. */
export async function withRuntimeRole(
  environment: Environment,
  baseline: readonly (readonly [string, string])[],
  operation: (roleUrl: string, deniedTable: TableNames) => Promise<void>,
) {
  const role = `loom_vector_role_${crypto.randomUUID().replaceAll("-", "")}`;
  const password = `pw_${crypto.randomUUID().replaceAll("-", "")}`;
  const { admin, annSchema: ann, database } = environment;
  const denied = names('denied "docs"');
  await admin.query(`CREATE ROLE ${quote(role)} LOGIN PASSWORD '${password}'`);
  try {
    await admin.query(`GRANT USAGE ON SCHEMA ${quote(vectorSchema)}, ${quote(ann)} TO ${quote(role)}`);
    await admin.query(`GRANT SELECT ON ALL TABLES IN SCHEMA ${quote(ann)} TO ${quote(role)}`);
    // Created after the grant: the role has no privilege on it, so native denial is observable.
    await admin.query(
      `CREATE TABLE ${quote(ann)}.${quote(denied.table.name)} (${quote(denied.id)} pg_catalog.int8 PRIMARY KEY, ${quote(denied.category)} pg_catalog.int4 NOT NULL, ${quote(denied.embedding)} ${quote(vectorSchema)}.vector(${dimensions}))`,
    );
    for (const [name, value] of baseline)
      await admin.query(`ALTER ROLE ${quote(role)} IN DATABASE ${quote(database)} SET ${name} = '${value}'`);
    const roleUrl = new URL(environment.url);
    roleUrl.username = role;
    roleUrl.password = password;
    await operation(roleUrl.href, denied);
  } finally {
    await admin.query(`GRANT ${quote(role)} TO CURRENT_USER`);
    await admin.query(`DROP OWNED BY ${quote(role)}`);
    await admin.query(`DROP ROLE IF EXISTS ${quote(role)}`);
  }
}

export type OracleKind = "vector" | "halfvec" | "sparsevec" | "bit";
// Independent of the implementation: the pgvector README's operator table.
const oracleOperators = {
  vector: { l2: "<->", negativeInnerProduct: "<#>", cosine: "<=>", l1: "<+>" },
  halfvec: { l2: "<->", negativeInnerProduct: "<#>", cosine: "<=>", l1: "<+>" },
  sparsevec: { l2: "<->", negativeInnerProduct: "<#>", cosine: "<=>", l1: "<+>" },
  bit: { hamming: "<~>", jaccard: "<%>" },
} as const;
export interface OracleQuery {
  readonly table: TableNames;
  readonly kind: OracleKind;
  readonly metric: string;
  /** The native text input of the probe, never the leaf's encoder output. */
  readonly probe: string;
  readonly limit: number;
  readonly filter?: number;
  readonly settings: readonly (readonly [string, string])[];
}
interface NativeOracleSql {
  readonly sql: string;
  readonly parameters: (string | number)[];
}
function oracleSql(query: OracleQuery): NativeOracleSql {
  const operator = Object.entries(oracleOperators[query.kind]).find(([metric]) => metric === query.metric)?.[1];
  assert.ok(operator, `Unknown oracle metric ${query.metric}`);
  const type = query.kind === "bit" ? "pg_catalog.bit" : `${quote(vectorSchema)}.${query.kind}`;
  const column = `s.${quote(query.table.embedding)}`;
  const distance = `${column} OPERATOR(${quote(vectorSchema)}.${operator}) $1::${type}`;
  const parameters: (string | number)[] = [query.probe];
  let filter = "";
  if (query.filter !== undefined) {
    parameters.push(query.filter);
    filter = ` AND s.${quote(query.table.category)} = $2`;
  }
  parameters.push(query.limit);
  return {
    sql: `SELECT s.${quote(query.table.id)}::text AS id, (${distance})::text AS distance FROM ${quote(query.table.table.schema)}.${quote(query.table.table.name)} s WHERE ${column} IS NOT NULL${filter} ORDER BY ${distance} LIMIT $${parameters.length}`,
    parameters,
  };
}
async function oracleSession<Value>(
  url: string,
  settings: OracleQuery["settings"],
  work: (client: pg.Client) => Promise<Value>,
) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    // Load the library first so that set_config targets registered settings, as a normal session would.
    await client.query(`SELECT ${quote(vectorSchema)}.vector_dims('[1]'::${quote(vectorSchema)}.vector)`);
    await client.query("BEGIN");
    for (const [name, value] of settings) await client.query("SELECT pg_catalog.set_config($1,$2,true)", [name, value]);
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } finally {
    await client.end();
  }
}
/** Direct raw SQL on an independently owned session with the same transaction-local settings. */
export async function oracleNearest(url: string, query: OracleQuery) {
  const { sql, parameters } = oracleSql(query);
  return oracleSession(url, query.settings, async (client) =>
    v
      .parse(
        v.array(v.strictObject({ id: v.string(), distance: v.string() })),
        (await client.query(sql, parameters)).rows,
      )
      .map((row) => ({ id: row.id, distance: Number(row.distance) })),
  );
}
/** Index names the planner picked for the same raw query, from an independent EXPLAIN (FORMAT JSON). */
export async function oracleIndexes(url: string, query: OracleQuery) {
  const { sql, parameters } = oracleSql(query);
  return oracleSession(url, query.settings, async (client) => {
    const plan = await client.query(`EXPLAIN (FORMAT JSON, COSTS FALSE) ${sql}`, parameters);
    return [...JSON.stringify(plan.rows).matchAll(/"Index Name":"([^"]+)"/g)].map((match) => match[1]!);
  });
}
/** current_setting for all seven names after applying settings locally on an independent backend. */
export async function oracleSettings(url: string, settings: OracleQuery["settings"]) {
  return oracleSession(url, settings, async (client) => {
    const rows = await client.query(
      "SELECT name, setting, reset_val FROM pg_catalog.pg_settings WHERE name = ANY($1::pg_catalog.text[]) ORDER BY name",
      [[...settingNames]],
    );
    return new Map(v.parse(settingRows, rows.rows).map((row) => [row.name, row.setting] as const));
  });
}
export async function indexAccessMethod(admin: pg.Client, schema: string, index: string) {
  const rows = await admin.query(
    "SELECT am.amname AS method FROM pg_catalog.pg_class c JOIN pg_catalog.pg_am am ON am.oid = c.relam WHERE c.oid = pg_catalog.format('%I.%I', $1::text, $2::text)::pg_catalog.regclass",
    [schema, index],
  );
  return v.parse(v.tuple([v.strictObject({ method: v.string() })]), rows.rows)[0].method;
}
export async function indexScans(admin: pg.Client, schema: string, index: string) {
  await admin.query("SELECT pg_catalog.pg_stat_clear_snapshot()");
  const rows = await admin.query(
    "SELECT idx_scan::pg_catalog.int8::text AS scans FROM pg_catalog.pg_stat_user_indexes WHERE schemaname = $1 AND indexrelname = $2",
    [schema, index],
  );
  return Number(v.parse(v.tuple([v.strictObject({ scans: v.string() })]), rows.rows)[0].scans);
}

export async function waitFor(predicate: () => Promise<boolean>, message: string) {
  const expires = performance.now() + 5000;
  while (!(await predicate())) {
    if (performance.now() > expires) throw new Error(message);
    await setTimeout(20);
  }
}
export async function bounded<Value>(pending: Promise<Value>, milliseconds = 8000): Promise<Value> {
  const timer = new AbortController();
  try {
    return await Promise.race([
      pending,
      setTimeout(milliseconds, undefined, { signal: timer.signal }).then(() => {
        throw new Error("Vector operator scope did not settle");
      }),
    ]);
  } finally {
    timer.abort();
  }
}
/** The loom-migrations backends currently waiting on a native lock in this database. */
export async function lockedOwners(observer: pg.Client) {
  await observer.query("SELECT pg_catalog.pg_stat_clear_snapshot()");
  return v
    .parse(
      v.array(v.strictObject({ pid: v.number() })),
      (
        await observer.query(
          "SELECT pid FROM pg_catalog.pg_stat_activity WHERE application_name = 'loom-migrations' AND datname = current_database() AND wait_event_type = 'Lock'",
        )
      ).rows,
    )
    .map((row) => row.pid);
}
export async function absent(observer: pg.Client, pid: number) {
  await observer.query("SELECT pg_catalog.pg_stat_clear_snapshot()");
  return (await observer.query("SELECT pid FROM pg_catalog.pg_stat_activity WHERE pid = $1", [pid])).rows.length === 0;
}
/** An independent native session holding an ACCESS EXCLUSIVE lock on a disposable relation. */
export async function holdRelationLock(url: string, table: TableNames) {
  const locker = new pg.Client({ connectionString: url });
  await locker.connect();
  await locker.query("BEGIN");
  await locker.query(`LOCK TABLE ${quote(table.table.schema)}.${quote(table.table.name)} IN ACCESS EXCLUSIVE MODE`);
  return {
    release: async () => {
      try {
        await locker.query("ROLLBACK");
      } finally {
        await locker.end();
      }
    },
  };
}

export interface RecordedEvent {
  readonly client: number;
  readonly kind: "query" | "end";
  readonly sql: string;
  readonly command: string | null;
  readonly rows: pg.QueryResult["rows"];
  readonly failed: boolean;
}
type RecordedQueryArguments = [text: string, values?: (string | number)[]];
interface PatchableClient {
  query: (...args: RecordedQueryArguments) => Promise<pg.QueryResult>;
  end: () => Promise<void>;
}
/**
 * Observe the actual SQL text, command tags and rows of every loom-migrations owned client by wrapping the
 * driver's own query/end and delegating unchanged. Nothing is simulated; a client is recognised as owned by the
 * connection prologue that withMigrationConnection always issues.
 */
export function recordOwnedBackends() {
  const events: RecordedEvent[] = [];
  const prototype: PatchableClient = pg.Client.prototype;
  const originalQuery = prototype.query;
  const originalEnd = prototype.end;
  const identities = new WeakMap<pg.Client, number>();
  let next = 0;
  prototype.query = async function (this: pg.Client, ...args: RecordedQueryArguments) {
    const [text] = args;
    if (text === "SET lock_timeout = '5s'") identities.set(this, next++);
    const client = identities.get(this);
    if (client === undefined) return originalQuery.apply(this, args);
    try {
      const result = await originalQuery.apply(this, args);
      events.push({ client, kind: "query", sql: text, command: result.command, rows: result.rows, failed: false });
      return result;
    } catch (cause) {
      events.push({ client, kind: "query", sql: text, command: null, rows: [], failed: true });
      throw cause;
    }
  };
  prototype.end = async function (this: pg.Client) {
    const client = identities.get(this);
    if (client !== undefined) events.push({ client, kind: "end", sql: "end", command: null, rows: [], failed: false });
    return originalEnd.call(this);
  };
  return {
    events,
    restore: () => {
      prototype.query = originalQuery;
      prototype.end = originalEnd;
    },
  };
}
export async function recording<Value>(work: () => Promise<Value>) {
  const recorder = recordOwnedBackends();
  try {
    return { value: await work(), events: recorder.events };
  } finally {
    recorder.restore();
  }
}

const isSettingsRead = (event: RecordedEvent) =>
  event.kind === "query" && event.sql.includes("FROM pg_catalog.pg_settings");
interface SettingsMaps {
  readonly values: ReadonlyMap<string, string>;
  readonly resets: ReadonlyMap<string, string>;
}
const settingsOf = (event: RecordedEvent): SettingsMaps => {
  const rows = v.parse(settingRows, event.rows);
  return {
    values: new Map(rows.map((row) => [row.name, row.setting] as const)),
    resets: new Map(rows.map((row) => [row.name, row.reset_val] as const)),
  };
};
export interface OwnerWitness {
  readonly client: number;
  readonly terminalCommand: string;
  readonly baseline: ReadonlyMap<string, string>;
  readonly baselineResets: ReadonlyMap<string, string>;
  /** Every observation between baseline and the terminal reply, in order. */
  readonly active: readonly ReadonlyMap<string, string>[];
  readonly activeResets: readonly ReadonlyMap<string, string>[];
  readonly terminal: ReadonlyMap<string, string>;
  readonly terminalResets: ReadonlyMap<string, string>;
  readonly events: readonly RecordedEvent[];
}
/**
 * Locate the single owned backend that read vector settings and prove the same backend observed its native
 * terminal reset: acknowledged COMMIT/ROLLBACK, then exactly one settings read, then end(), then nothing.
 * Both current and reset_val maps are retained, because the production observer compares both.
 */
export function ownerWitness(events: readonly RecordedEvent[]): OwnerWitness {
  const clients = [...new Set(events.filter(isSettingsRead).map((event) => event.client))];
  assert.equal(clients.length, 1, "Exactly one owned backend must have observed vector settings");
  const mine = events.filter((event) => event.client === clients[0]);
  const terminalIndex = mine.findIndex(
    (event) => event.kind === "query" && !event.failed && (event.command === "COMMIT" || event.command === "ROLLBACK"),
  );
  assert.ok(terminalIndex >= 0, "No acknowledged native terminal reply was observed");
  const after = mine.slice(terminalIndex + 1);
  assert.equal(after.length, 2, "Only one terminal observation and end() may follow the acknowledged reply");
  assert.ok(isSettingsRead(after[0]!) && !after[0]!.failed, "The terminal observation must be a native settings read");
  assert.equal(after[1]!.kind, "end");
  const reads = mine.slice(0, terminalIndex).filter(isSettingsRead).map(settingsOf);
  assert.ok(reads.length >= 2, "Baseline and applied observations must precede the terminal reply");
  const terminal = settingsOf(after[0]!);
  return {
    client: clients[0]!,
    terminalCommand: mine[terminalIndex]!.command!,
    baseline: reads[0]!.values,
    baselineResets: reads[0]!.resets,
    active: reads.slice(1).map((read) => read.values),
    activeResets: reads.slice(1).map((read) => read.resets),
    terminal: terminal.values,
    terminalResets: terminal.resets,
    events: mine,
  };
}
/** The expected active map: baseline text overlaid with the requested values. */
export function overlay(baseline: ReadonlyMap<string, string>, requested: readonly (readonly [string, string])[]) {
  const map = new Map(baseline);
  for (const [name, value] of requested) map.set(name, value);
  return map;
}
