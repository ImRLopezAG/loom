import assert from "node:assert/strict";
import pg from "pg";
import * as v from "valibot";
import { defineRelations, sql } from "drizzle-orm";
import { createNeon_1_25 } from "kello/extensions/neon";
import { connectDatabase, defineSchema } from "kello/server";

/** Parent-only execution on its owned exact native fixture. All requests are read-only observations. */
export async function exerciseNeonConsumerNative(connectionString: string): Promise<void> {
  const oracle = new pg.Client({ connectionString });
  const schema = defineSchema(() => ({}));
  try {
    await oracle.connect();
    const identity = await oracle.query(
      "SELECT extversion AS version,n.nspname AS schema,current_setting('server_version_num')::integer/10000 AS major FROM pg_catalog.pg_extension e JOIN pg_catalog.pg_namespace n ON n.oid=e.extnamespace WHERE extname='neon'",
    );
    assert.equal(identity.rows.length, 1);
    assert.equal(identity.rows[0].version, "1.25");
    assert.equal(identity.rows[0].major, 18);
    const api = createNeon_1_25({
      name: "neon",
      version: "1.25",
      schema: identity.rows[0].schema,
      apiSupport: { status: "verified", digest: "1f2d339beee9dcc3c93fdc0856fb9c307a04d5937a00ad7174014604be39a09e" },
    });
    const quoted = pg.escapeIdentifier(api.schema);
    const connection = await connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString });
    try {
      const snapshot = {
        wait_event_id: 1,
        wait_class_name: "quoted,class",
        wait_event_name: "event",
        count: 9223372036854775807n,
        time_us: 0n,
      };
      console.info("Neon native stage: neon_datum_image_equal");
      const equal = await connection.transaction(
        (db) =>
          db
            .select({ value: api.neonDatumImageEqual(api.codecs.neon_wait_event_snapshot, snapshot, snapshot) })
            .from(sql`(values (1)) fixture(n)`),
        { accessMode: "read only" },
      );
      assert.deepEqual(equal, [{ value: true }]);
      // Exercise actual compiled public SQL expressions and decoders. Changing counters need not equal
      // observations from another backend; the native result codec, not client arithmetic, owns each value.
      for (const [name, expression, args] of [
        ["pg_cluster_size", api.pgClusterSize(), ""],
        ["backpressure_throttling_time", api.backpressureThrottlingTime(), ""],
        ["get_local_cache_state", api.getLocalCacheState(0), "0::integer"],
        ["approximate_working_set_size_seconds", api.approximateWorkingSetSizeSeconds(0), "0::integer"],
        ["neon_communicator_min_inflight_request_lsn", api.neonCommunicatorMinInflightRequestLsn(), ""],
        ["backpressure_lsns", api.backpressureLsns(), ""],
        ["get_prewarm_info", api.getPrewarmInfo(), ""],
      ] as const) {
        const native = await oracle.query(`SELECT ${quoted}.${pg.escapeIdentifier(name)}(${args})::text AS value`);
        console.info(`Neon native stage: scalar ${name}; nativeSqlNull=${native.rows[0]?.value === null}`);
        const rows = await connection.transaction(
          (db) => db.select({ value: expression }).from(sql`(values (1)) fixture(n)`),
          { accessMode: "read only" },
        );
        assert.equal(rows.length, 1);
        assert(Object.hasOwn(rows[0]!, "value"));
      }
      for (const rows of [
        api.backpressureLsnsRows("lsns"),
        api.getPrewarmInfoRows("progress"),
        api.getPerfCountersRows("perf"),
        api.getBackendPerfCountersRows("backend"),
        api.localCachePagesRows("cache"),
        api.neonGetCacheStatsRows("stats"),
        api.neonGetLfcStatsRows("lfc"),
        api.neonGetWaitEventStatsRows("waits"),
        api.neonGetBackendWaitEventStatsRows("backend_waits"),
        api.neonLfcPartStatsRows("parts"),
        api.neonBackpressureStatusRows("backpressure"),
      ]) {
        console.info(`Neon native stage: rows ${Object.keys(rows.columns).join(",")}`);
        const values = await connection.transaction((db) => db.select(rows.columns).from(rows.from), {
          accessMode: "read only",
        });
        assert(Array.isArray(values));
        for (const row of values) assert.deepEqual(Object.keys(row).sort(), Object.keys(rows.columns).sort());
      }
      for (const [name, view] of Object.entries(api.views)) {
        console.info(`Neon native stage: view ${name}`);
        const rows = view("native_view");
        const values = await connection.transaction((db) => db.select(rows.columns).from(rows.from), {
          accessMode: "read only",
        });
        assert(Array.isArray(values));
      }
      // Ordinary native constructors transfer all ten named composites and their array types.
      // Attribute names/counts come from PostgreSQL, independently of the client codec schemas.
      // SAFETY: this frozen factory object has exactly the known composite codec own keys.
      for (const name of Object.keys(api.codecs) as (keyof typeof api.codecs)[]) {
        console.info(`Neon native stage: composite ${name}`);
        const attributes = await oracle.query(
          "SELECT a.attname FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace JOIN pg_catalog.pg_attribute a ON a.attrelid=t.typrelid WHERE n.nspname=$1 AND t.typname=$2 AND a.attnum>0 AND NOT a.attisdropped ORDER BY a.attnum",
          [api.schema, name],
        );
        assert(attributes.rows.length > 0);
        const type = `${quoted}.${pg.escapeIdentifier(name)}`;
        const value = `ROW(${attributes.rows.map(() => "NULL").join(",")})::${type}`;
        const native = await oracle.query(
          `SELECT (${value})::text AS record, ('[-2:-1]={NULL,NULL}'::${type}[])::text AS bounded, ('{}'::${type}[])::text AS empty`,
        );
        const decoded = api.codecs[name].decode(native.rows[0].record);
        assert.deepEqual(decoded, Object.fromEntries(attributes.rows.map((row) => [row.attname, null])));
        assert.deepEqual(api.arrays[name].decode(native.rows[0].bounded), {
          dimensions: [{ lowerBound: -2, length: 2 }],
          values: [null, null],
        });
        assert.deepEqual(api.arrays[name].decode(native.rows[0].empty), { dimensions: [], values: [] });
      }
      // These native errors were observed on the parent's role/path. Compare ordinary native invocation
      // to the public adapter using the same role/path; do not mask privilege or search_path differences.
      for (const [name, expression] of [
        ["get_hll_state", api.getHllState()],
        ["neon_wait_report", api.neonWaitReport(0)],
        ["neon_backend_wait_report", api.neonBackendWaitReport(null, 0)],
      ] as const) {
        console.info(`Neon native stage: prerequisite ${name}`);
        const args =
          name === "neon_backend_wait_report"
            ? "NULL::integer,0::integer"
            : name === "neon_wait_report"
              ? "0::integer"
              : "";
        let nativeCode: string | undefined;
        try {
          await oracle.query(`SELECT ${quoted}.${pg.escapeIdentifier(name)}(${args})::text`);
        } catch (cause) {
          nativeCode = errorCode(cause);
          assert(nativeCode === "42501" || nativeCode === "42704");
        }
        if (nativeCode) {
          await assert.rejects(
            connection.transaction((db) => db.select({ value: expression }).from(sql`(values (1)) fixture(n)`), {
              accessMode: "read only",
            }),
            (cause) => errorCode(cause) === nativeCode,
          );
        } else {
          await connection.transaction((db) => db.select({ value: expression }).from(sql`(values (1)) fixture(n)`), {
            accessMode: "read only",
          });
        }
        if (name !== "get_hll_state") {
          const rows =
            name === "neon_wait_report"
              ? api.neonWaitReportRows("report", 0)
              : api.neonBackendWaitReportRows("report", null, 0);
          const query = connection.transaction((db) => db.select(rows.columns).from(rows.from), {
            accessMode: "read only",
          });
          if (nativeCode) await assert.rejects(query, (cause) => errorCode(cause) === nativeCode);
          else assert(Array.isArray(await query));
        }
      }
    } finally {
      await connection.close();
    }
  } finally {
    await oracle.end();
  }
}

function errorCode(cause: unknown): string | undefined {
  if (!(cause instanceof Error)) return undefined;
  if ("code" in cause && v.is(v.string(), cause.code)) return cause.code;
  return errorCode(cause.cause);
}
