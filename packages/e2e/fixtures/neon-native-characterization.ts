import assert from "node:assert/strict";
import * as v from "valibot";
import type pg from "pg";
import { createHash } from "node:crypto";

/** Parent supplies a connected client to its owned exact Neon fixture. Never creates objects or settings. */
export async function characterizeNeonReadOnly(client: pg.Client, schema: string) {
  const quoted = '"' + schema.replaceAll('"', '""') + '"';
  const results: {
    member: string;
    status: "observed" | "native-error";
    rowCount?: number;
    resultSha256?: string;
    sqlstate?: string | undefined;
    reason?: string | undefined;
  }[] = [];
  await client.query("BEGIN READ ONLY");
  try {
    const identity = await client.query(
      "SELECT e.extversion AS version, n.nspname AS schema, current_setting('server_version_num')::integer/10000 AS major FROM pg_catalog.pg_extension e JOIN pg_catalog.pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='neon'",
    );
    assert.deepEqual(identity.rows, [{ version: "1.25", schema, major: 18 }]);
    for (const observation of neonNativeObservations) {
      await client.query("SAVEPOINT neon_observation");
      try {
        const result = await client.query(observation.sql.replaceAll("{schema}", quoted));
        results.push({
          member: observation.member,
          status: "observed",
          rowCount: result.rows.length,
          resultSha256: createHash("sha256").update(JSON.stringify(result.rows)).digest("hex"),
        });
      } catch (cause) {
        await client.query("ROLLBACK TO SAVEPOINT neon_observation");
        // Native errors are evidence, never acceptance. Do not retain provider row payloads.
        const parsed = v.safeParse(v.object({ code: v.optional(v.string()), message: v.optional(v.string()) }), cause);
        const error = parsed.success ? parsed.output : {};
        results.push({
          member: observation.member,
          status: "native-error",
          sqlstate: error.code,
          reason: error.message,
        });
      }
      await client.query("RELEASE SAVEPOINT neon_observation");
    }
    return {
      version: "1.25",
      digest: "1f2d339beee9dcc3c93fdc0856fb9c307a04d5937a00ad7174014604be39a09e",
      results,
      uninvoked: neonNonObservationMembers,
      nativeAcceptanceComplete: false,
    } as const;
  } finally {
    await client.query("ROLLBACK");
  }
}

export const neonNativeObservations = [
  {
    member: "routine:$extension:neon.__neon_internal_current_snapshot_with_subxids()",
    sql: 'SELECT {schema}."__neon_internal_current_snapshot_with_subxids"()::text AS value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.approximate_working_set_size_seconds(pg_catalog.int4)",
    sql: 'SELECT {schema}."approximate_working_set_size_seconds"(0::pg_catalog.int4)::text AS value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.backpressure_lsns()",
    sql: 'SELECT row_value::text AS value FROM {schema}."backpressure_lsns"() AS row_value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.backpressure_throttling_time()",
    sql: 'SELECT {schema}."backpressure_throttling_time"()::text AS value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.get_backend_perf_counters()",
    sql: 'SELECT row_value::text AS value FROM {schema}."get_backend_perf_counters"() AS row_value(procno integer,pid integer,metric text,bucket_le double precision,value double precision)',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.get_buffer_cache_state_sql(pg_catalog.int4)",
    sql: 'SELECT {schema}."get_buffer_cache_state_sql"(0::pg_catalog.int4)::text AS value',
    kind: "routine",
    authority: "operator-observation",
  },
  {
    member: "routine:$extension:neon.get_buffercache_prewarm_info()",
    sql: 'SELECT row_value::text AS value FROM {schema}."get_buffercache_prewarm_info"() AS row_value',
    kind: "routine",
    authority: "operator-observation",
  },
  {
    member: "routine:$extension:neon.get_hll_state()",
    sql: 'SELECT {schema}."get_hll_state"()::text AS value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.get_local_cache_state(pg_catalog.int4)",
    sql: 'SELECT {schema}."get_local_cache_state"(0::pg_catalog.int4)::text AS value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.get_perf_counters()",
    sql: 'SELECT row_value::text AS value FROM {schema}."get_perf_counters"() AS row_value(metric text,bucket_le double precision,value double precision)',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.get_prewarm_info()",
    sql: 'SELECT row_value::text AS value FROM {schema}."get_prewarm_info"() AS row_value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.local_cache_pages()",
    sql: 'SELECT row_value::text AS value FROM {schema}."local_cache_pages"() AS row_value(pageoffs bigint,relfilenode oid,reltablespace oid,reldatabase oid,relforknumber smallint,relblocknumber bigint,accesscount integer)',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.neon_backend_wait_report(pg_catalog.int4,pg_catalog.int4)",
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_backend_wait_report"(pg_catalog.pg_backend_pid(),0::pg_catalog.int4) AS row_value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.neon_backpressure_status()",
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_backpressure_status"() AS row_value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.neon_communicator_min_inflight_request_lsn()",
    sql: 'SELECT {schema}."neon_communicator_min_inflight_request_lsn"()::text AS value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.neon_datum_image_equal(pg_catalog.anyelement,pg_catalog.anyelement)",
    sql: "SELECT {schema}.\"neon_datum_image_equal\"('probe'::pg_catalog.text,'probe'::pg_catalog.text)::text AS value",
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.neon_get_backend_wait_event_stats(pg_catalog.int4)",
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_get_backend_wait_event_stats"(pg_catalog.pg_backend_pid()) AS row_value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.neon_get_cache_stats()",
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_get_cache_stats"() AS row_value(cache_name text,metric_name text,metric_value bigint)',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.neon_get_lfc_stats()",
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_get_lfc_stats"() AS row_value(lfc_key text,lfc_value bigint)',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.neon_get_wait_event_stats()",
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_get_wait_event_stats"() AS row_value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.neon_lfc_part_stats()",
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_lfc_part_stats"() AS row_value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.neon_shmem_huge_pages(pg_catalog.text,pg_catalog.text)",
    sql: "SELECT {schema}.\"neon_shmem_huge_pages\"('1MB'::pg_catalog.text,'1MB'::pg_catalog.text)::text AS value",
    kind: "routine",
    authority: "operator-observation",
  },
  {
    member: "routine:$extension:neon.neon_wait_report(pg_catalog.int4)",
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_wait_report"(0::pg_catalog.int4) AS row_value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: "routine:$extension:neon.pg_cluster_size()",
    sql: 'SELECT {schema}."pg_cluster_size"()::text AS value',
    kind: "routine",
    authority: "observation",
  },
  {
    member: 'view:"$extension:neon".local_cache',
    sql: 'SELECT row_value::text AS value FROM {schema}."local_cache" AS row_value',
    kind: "view",
    authority: "observation",
  },
  {
    member: 'view:"$extension:neon".neon_backend_perf_counters',
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_backend_perf_counters" AS row_value',
    kind: "view",
    authority: "observation",
  },
  {
    member: 'view:"$extension:neon".neon_backpressure_status',
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_backpressure_status" AS row_value',
    kind: "view",
    authority: "observation",
  },
  {
    member: 'view:"$extension:neon".neon_lfc_stats',
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_lfc_stats" AS row_value',
    kind: "view",
    authority: "observation",
  },
  {
    member: 'view:"$extension:neon".neon_lwlsn_cache_stats',
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_lwlsn_cache_stats" AS row_value',
    kind: "view",
    authority: "observation",
  },
  {
    member: 'view:"$extension:neon".neon_perf_counters',
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_perf_counters" AS row_value',
    kind: "view",
    authority: "observation",
  },
  {
    member: 'view:"$extension:neon".neon_relperst_cache_stats',
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_relperst_cache_stats" AS row_value',
    kind: "view",
    authority: "observation",
  },
  {
    member: 'view:"$extension:neon".neon_relsize_cache_stats',
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_relsize_cache_stats" AS row_value',
    kind: "view",
    authority: "observation",
  },
  {
    member: 'view:"$extension:neon".neon_stat_file_cache',
    sql: 'SELECT row_value::text AS value FROM {schema}."neon_stat_file_cache" AS row_value',
    kind: "view",
    authority: "observation",
  },
] as const;
export const neonNonObservationMembers = [
  {
    member: 'composite type:"$extension:neon".neon_wait_event_snapshot',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "routine:$extension:neon.approximate_working_set_size(pg_catalog.bool)",
    reason: "Provider shared storage/cache/WAL mutation; forbidden by current read-only characterization authority.",
  },
  {
    member: "routine:$extension:neon.cancel_buffer_cache_prewarm()",
    reason: "Provider shared storage/cache/WAL mutation; forbidden by current read-only characterization authority.",
  },
  {
    member: "routine:$extension:neon.cancel_prewarm()",
    reason: "Provider shared storage/cache/WAL mutation; forbidden by current read-only characterization authority.",
  },
  {
    member: "routine:$extension:neon.neon_check_for_superuser()",
    reason: "Trigger callback cannot be invoked as an ordinary SQL function.",
  },
  {
    member: "routine:$extension:neon.neon_clear_lfc()",
    reason: "Provider shared storage/cache/WAL mutation; forbidden by current read-only characterization authority.",
  },
  {
    member: "routine:$extension:neon.neon_emit_reverse_etl_commit(pg_catalog.bytea)",
    reason: "Provider shared storage/cache/WAL mutation; forbidden by current read-only characterization authority.",
  },
  {
    member: "routine:$extension:neon.neon_invalidate_relsize_cache(pg_catalog.oid,pg_catalog.int4)",
    reason: "Provider shared storage/cache/WAL mutation; forbidden by current read-only characterization authority.",
  },
  {
    member: "routine:$extension:neon.pg_resize_shared_buffers(pg_catalog.text)",
    reason: "Provider shared storage/cache/WAL mutation; forbidden by current read-only characterization authority.",
  },
  {
    member: "routine:$extension:neon.prewarm_buffer_cache(pg_catalog.bytea)",
    reason: "Provider shared storage/cache/WAL mutation; forbidden by current read-only characterization authority.",
  },
  {
    member: "routine:$extension:neon.prewarm_local_cache(pg_catalog.bytea,pg_catalog.int4)",
    reason: "Provider shared storage/cache/WAL mutation; forbidden by current read-only characterization authority.",
  },
  {
    member: "routine:$extension:neon.replace_hll(pg_catalog.bytea)",
    reason: "Provider shared storage/cache/WAL mutation; forbidden by current read-only characterization authority.",
  },
  {
    member: "routine:$extension:neon.reset_perf_counter(pg_catalog.text)",
    reason: "Provider shared storage/cache/WAL mutation; forbidden by current read-only characterization authority.",
  },
  {
    member: 'rule:"_RETURN" on "$extension:neon".local_cache',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'rule:"_RETURN" on "$extension:neon".neon_backend_perf_counters',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'rule:"_RETURN" on "$extension:neon".neon_backpressure_status',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'rule:"_RETURN" on "$extension:neon".neon_lfc_stats',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'rule:"_RETURN" on "$extension:neon".neon_lwlsn_cache_stats',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'rule:"_RETURN" on "$extension:neon".neon_perf_counters',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'rule:"_RETURN" on "$extension:neon".neon_relperst_cache_stats',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'rule:"_RETURN" on "$extension:neon".neon_relsize_cache_stats',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'rule:"_RETURN" on "$extension:neon".neon_stat_file_cache',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon._local_cache",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon._neon_backend_perf_counters",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon._neon_backpressure_status",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon._neon_lfc_stats",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon._neon_lwlsn_cache_stats",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon._neon_perf_counters",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon._neon_relperst_cache_stats",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon._neon_relsize_cache_stats",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon._neon_stat_file_cache",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon._neon_wait_event_snapshot",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon.local_cache",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon.neon_backend_perf_counters",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon.neon_backpressure_status",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon.neon_lfc_stats",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon.neon_lwlsn_cache_stats",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon.neon_perf_counters",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon.neon_relperst_cache_stats",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon.neon_relsize_cache_stats",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon.neon_stat_file_cache",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: "type:$extension:neon.neon_wait_event_snapshot",
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".local_cache.accesscount',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".local_cache.pageoffs',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".local_cache.relblocknumber',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".local_cache.reldatabase',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".local_cache.relfilenode',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".local_cache.relforknumber',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".local_cache.reltablespace',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_backend_perf_counters.bucket_le',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_backend_perf_counters.metric',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_backend_perf_counters.pid',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_backend_perf_counters.procno',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_backend_perf_counters.value',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_backpressure_status.metric',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_backpressure_status.value',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_lfc_stats.lfc_key',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_lfc_stats.lfc_value',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_lwlsn_cache_stats.metric_name',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_lwlsn_cache_stats.metric_value',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_perf_counters.bucket_le',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_perf_counters.metric',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_perf_counters.value',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_relperst_cache_stats.metric_name',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_relperst_cache_stats.metric_value',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_relsize_cache_stats.metric_name',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_relsize_cache_stats.metric_value',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_stat_file_cache.file_cache_hit_ratio',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_stat_file_cache.file_cache_hits',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_stat_file_cache.file_cache_misses',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_stat_file_cache.file_cache_used',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
  {
    member: 'view column:"$extension:neon".neon_stat_file_cache.file_cache_writes',
    reason: "Catalog/schema dependency; use exact capture and codec/schema proof, not fictitious function invocation.",
  },
] as const;
