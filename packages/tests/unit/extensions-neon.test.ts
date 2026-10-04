import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { createNeon_1_25 } from "../../../apps/loom/src/core/extensions/adapters/neon";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/neon.json";
import { withNeonOperation } from "../../../apps/loom/src/tooling/extensions/operations/neon";

const descriptor = {
  name: "neon",
  version: "1.25",
  schema: 'neon"observe',
  apiSupport: { status: "verified", digest: manifest.digest },
} as const;

test("Neon 1.25 binds native observations without exposing provider mutations", () => {
  const api = createNeon_1_25(descriptor);
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select ${api.pgClusterSize()}`);
  expect(query.sql).toBe('select "neon""observe"."pg_cluster_size"()');
  expect(query.params).toEqual([]);
  expect(api.pgClusterSize).toBe(api.sql.functions.pg_cluster_size);
  expect(api.sql.functions).not.toHaveProperty("replace_hll");
  expect(api.sql.functions).not.toHaveProperty("pg_resize_shared_buffers");
  expect(api.sql.functions).not.toHaveProperty("neon_emit_reverse_etl_commit");
});

test("Neon operator exact identity rejects before connection acquisition", async () => {
  // SAFETY: this deliberately malformed descriptor bypasses literal admission to test JavaScript callers.
  const invalid = { ...descriptor, version: "1.6" } as never;
  await expect(withNeonOperation("postgresql://operator@127.0.0.1:1/fixture", invalid, async () => {})).rejects.toThrow(
    "requires its exact verified contract",
  );
});

test("Neon operator abort preserves the pre-acquisition cause", async () => {
  const controller = new AbortController();
  const reason = new Error("Abort before Neon acquisition");
  controller.abort(reason);
  let invoked = false;
  await expect(
    withNeonOperation(
      "postgresql://operator@127.0.0.1:1/fixture",
      descriptor,
      async () => {
        invoked = true;
      },
      controller.signal,
    ),
  ).rejects.toBe(reason);
  expect(invoked).toBe(false);
});

test("get_prewarm_info preserves the exact native whole-composite SQL NULL through the public helper mapper", () => {
  const dialect = extensionSqlDialect(nodePgCodecs);
  const map = dialect.mapperGenerators.rows(
    [{ path: ["value"], field: createNeon_1_25(descriptor).getPrewarmInfo() }],
    {},
  );
  // Exact Neon 1.25 read-only observation a465acd2 returned SQL NULL, not a record with four NULL attributes.
  expect(map([[null]])).toEqual([{ value: null }]);
});

import * as v from "valibot";
import { neonAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/neon";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { checkCompiledExtensionQuery, extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { evaluateSnapshot } from "../../../apps/loom/src/core/server/rpc/snapshot";
import { textCodec, integerCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { lsnCodec, oidCodec, int2Codec } from "../../../apps/loom/src/core/extensions/adapters/neon-codecs";
import { neonNativeObservations, neonNonObservationMembers } from "../../e2e/fixtures/neon-native-characterization";
const api = createNeon_1_25(descriptor);
const dialect = extensionSqlDialect(nodePgCodecs);
const queryCalls = [
  ["approximate_working_set_size_seconds", api.approximateWorkingSetSizeSeconds()],
  ["approximate_working_set_size_seconds", api.approximateWorkingSetSizeSeconds(null)],
  ["approximate_working_set_size_seconds", api.approximateWorkingSetSizeSeconds(1)],
  ["backpressure_lsns", api.backpressureLsns()],
  ["backpressure_throttling_time", api.backpressureThrottlingTime()],
  ["get_backend_perf_counters", api.getBackendPerfCounters()],
  ["get_hll_state", api.getHllState()],
  ["get_local_cache_state", api.getLocalCacheState()],
  ["get_local_cache_state", api.getLocalCacheState(null)],
  ["get_perf_counters", api.getPerfCounters()],
  ["get_prewarm_info", api.getPrewarmInfo()],
  ["local_cache_pages", api.localCachePages()],
  ["neon_backend_wait_report", api.neonBackendWaitReport(1)],
  ["neon_backend_wait_report", api.neonBackendWaitReport(1, 0)],
  ["neon_backend_wait_report", api.neonBackendWaitReport(null, null)],
  ["neon_backpressure_status", api.neonBackpressureStatus()],
  ["neon_communicator_min_inflight_request_lsn", api.neonCommunicatorMinInflightRequestLsn()],
  ["neon_datum_image_equal", api.neonDatumImageEqual(textCodec, "same", "same")],
  ["neon_datum_image_equal", api.neonDatumImageEqual(integerCodec, 9223372036854775807n, 9223372036854775807n)],
  ["neon_get_backend_wait_event_stats", api.neonGetBackendWaitEventStats()],
  ["neon_get_backend_wait_event_stats", api.neonGetBackendWaitEventStats(null)],
  ["neon_get_cache_stats", api.neonGetCacheStats()],
  ["neon_get_lfc_stats", api.neonGetLfcStats()],
  ["neon_get_wait_event_stats", api.neonGetWaitEventStats()],
  ["neon_lfc_part_stats", api.neonLfcPartStats()],
  ["neon_wait_report", api.neonWaitReport()],
  ["neon_wait_report", api.neonWaitReport(null)],
  ["neon_wait_report", api.neonWaitReport(0)],
  ["pg_cluster_size", api.pgClusterSize()],
] as const;
for (const [name, expression] of queryCalls) {
  test(`native SQL composition and external-state rejection: ${name}`, async () => {
    const query = dialect.sqlToQuery(sql`select ${expression}`);
    expect(query.sql).toContain(`"neon""observe"."${name}"(`);
    expect(extensionExpressionContract(expression)?.observability).toBe("external");
    await expect(
      evaluateSnapshot(async () => {
        checkCompiledExtensionQuery(query);
        return [];
      }),
    ).rejects.toThrow("Automatic live query cannot observe external extension dependency");
  });
}
test("every captured member has exactly one disposition and native observation or explicit non-callable/mutation proof", () => {
  expect(validateExtensionManifest(v.parse(extensionManifestValidator, manifest)).digest).toBe(
    "1f2d339beee9dcc3c93fdc0856fb9c307a04d5937a00ad7174014604be39a09e",
  );
  const ids = manifest.contract.members.map((member) => member.id).sort();
  expect(ids).toHaveLength(105);
  expect(neonAnnotations.map((annotation) => annotation.id).sort()).toEqual(ids);
  expect(new Set(neonAnnotations.map((annotation) => annotation.id)).size).toBe(105);
  expect([...neonNativeObservations, ...neonNonObservationMembers].map((proof) => proof.member).sort()).toEqual(ids);
  const queryNames = manifest.contract.members
    .filter(
      (member) =>
        member.kind === "routine" &&
        neonAnnotations.find((annotation) => annotation.id === member.id)?.disposition === "query",
    )
    .map((member) => member.name)
    .sort();
  expect(Object.keys(api.sql.functions).sort()).toEqual(queryNames);
  expect([...new Set(queryCalls.map(([name]) => name))].sort()).toEqual(queryNames);
  for (const member of manifest.contract.members.filter(
    (member) =>
      member.kind === "routine" &&
      neonAnnotations.find((annotation) => annotation.id === member.id)?.disposition !== "query",
  ))
    expect(api.sql.functions).not.toHaveProperty(member.name);
  for (const invalid of [
    { ...descriptor, version: "1.6" },
    { ...descriptor, apiSupport: { status: "unverified" } },
    { ...descriptor, apiSupport: { status: "verified", digest: "wrong" } },
  ]) {
    // SAFETY: malformed JavaScript descriptors deliberately bypass TypeScript admission.
    expect(() => createNeon_1_25(invalid as never)).toThrow("requires its exact verified contract");
  }
});
for (const [name, view] of Object.entries(api.views)) {
  test(`native view projection and external-state rejection: ${name}`, async () => {
    const rows = view('v"stats');
    const query = dialect.sqlToQuery(sql`select ${sql.join(Object.values(rows.columns), sql`, `)} from ${rows.from}`);
    expect(query.sql).toContain(`from "neon""observe"."${name}"`);
    const captured = manifest.contract.members.find((member) => member.kind === "relation" && member.name === name);
    expect(captured?.kind).toBe("relation");
    if (captured?.kind === "relation") {
      expect(captured.relationKind).toBe("v");
      expect(Object.keys(rows.columns)).toEqual(captured.columns?.map((column) => column.name));
    }
    await expect(
      evaluateSnapshot(async () => {
        checkCompiledExtensionQuery(query);
        return [];
      }),
    ).rejects.toThrow("Automatic live query cannot observe external extension dependency");
  });
}
test("exact unsigned OID, int2 and full-width LSN representations", () => {
  expect(oidCodec.decode("4294967295")).toBe(4294967295);
  expect(int2Codec.decode("-32768")).toBe(-32768);
  expect(lsnCodec.decode("FFFFFFFF/FFFFFFFF")).toBe("FFFFFFFF/FFFFFFFF");
  for (const value of [-1, 4294967296, 1.5, "bogus"]) expect(() => oidCodec.decode(value)).toThrow();
  for (const value of [-32769, 32768]) expect(() => int2Codec.decode(value)).toThrow();
  for (const value of ["FFFFFFFFF/0", "1/", 123, null]) expect(() => lsnCodec.decode(value)).toThrow();
});

// Literal native record wire examples are independent of the production codec encoder.
test("native composite, array bounds and schema local_cache", () => {
  expect(
    api.codecs.local_cache.decode(
      "(9223372036854775807,4294967295,4294967295,4294967295,-32768,9223372036854775807,2147483647)",
    ),
  ).toEqual({
    pageoffs: 9223372036854775807n,
    relfilenode: 4294967295,
    reltablespace: 4294967295,
    reldatabase: 4294967295,
    relforknumber: -32768,
    relblocknumber: 9223372036854775807n,
    accesscount: 2147483647,
  });
  expect(api.codecs.local_cache.decode("(,,,,,,)")).toEqual({
    pageoffs: null,
    relfilenode: null,
    reltablespace: null,
    reldatabase: null,
    relforknumber: null,
    relblocknumber: null,
    accesscount: null,
  });
  expect(api.arrays.local_cache.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(
    api.arrays.local_cache.decode(
      '[-2:-1]={"(9223372036854775807,4294967295,4294967295,4294967295,-32768,9223372036854775807,2147483647)",NULL}',
    ),
  ).toEqual({
    dimensions: [{ lowerBound: -2, length: 2 }],
    values: [
      {
        pageoffs: 9223372036854775807n,
        relfilenode: 4294967295,
        reltablespace: 4294967295,
        reldatabase: 4294967295,
        relforknumber: -32768,
        relblocknumber: 9223372036854775807n,
        accesscount: 2147483647,
      },
      null,
    ],
  });
  expect(api.fields.local_cache().metadata.extension).toMatchObject({
    name: "neon",
    version: "1.25",
    schema: descriptor.schema,
    type: "local_cache",
    member: "type:$extension:neon.local_cache",
    array: false,
    search: { filter: false, comparison: false, order: false, text: false },
  });
  expect(api.arrayFields.local_cache().metadata.extension).toMatchObject({
    type: "local_cache",
    member: "type:$extension:neon._local_cache",
    array: true,
  });
});
test("native composite, array bounds and schema neon_backend_perf_counters", () => {
  expect(
    api.codecs.neon_backend_perf_counters.decode('(2147483647,2147483647,"metric,quoted",Infinity,Infinity)'),
  ).toEqual({
    procno: 2147483647,
    pid: 2147483647,
    metric: "metric,quoted",
    bucket_le: { nonfinite: "Infinity" },
    value: { nonfinite: "Infinity" },
  });
  expect(api.codecs.neon_backend_perf_counters.decode("(,,,,)")).toEqual({
    procno: null,
    pid: null,
    metric: null,
    bucket_le: null,
    value: null,
  });
  expect(api.arrays.neon_backend_perf_counters.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(
    api.arrays.neon_backend_perf_counters.decode(
      '[-2:-1]={"(2147483647,2147483647,\\"metric,quoted\\",Infinity,Infinity)",NULL}',
    ),
  ).toEqual({
    dimensions: [{ lowerBound: -2, length: 2 }],
    values: [
      {
        procno: 2147483647,
        pid: 2147483647,
        metric: "metric,quoted",
        bucket_le: { nonfinite: "Infinity" },
        value: { nonfinite: "Infinity" },
      },
      null,
    ],
  });
  expect(api.fields.neon_backend_perf_counters().metadata.extension).toMatchObject({
    name: "neon",
    version: "1.25",
    schema: descriptor.schema,
    type: "neon_backend_perf_counters",
    member: "type:$extension:neon.neon_backend_perf_counters",
    array: false,
    search: { filter: false, comparison: false, order: false, text: false },
  });
  expect(api.arrayFields.neon_backend_perf_counters().metadata.extension).toMatchObject({
    type: "neon_backend_perf_counters",
    member: "type:$extension:neon._neon_backend_perf_counters",
    array: true,
  });
});
test("native composite, array bounds and schema neon_backpressure_status", () => {
  expect(api.codecs.neon_backpressure_status.decode('("metric,quoted",Infinity)')).toEqual({
    metric: "metric,quoted",
    value: { nonfinite: "Infinity" },
  });
  expect(api.codecs.neon_backpressure_status.decode("(,)")).toEqual({ metric: null, value: null });
  expect(api.arrays.neon_backpressure_status.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(api.arrays.neon_backpressure_status.decode('[-2:-1]={"(\\"metric,quoted\\",Infinity)",NULL}')).toEqual({
    dimensions: [{ lowerBound: -2, length: 2 }],
    values: [{ metric: "metric,quoted", value: { nonfinite: "Infinity" } }, null],
  });
  expect(api.fields.neon_backpressure_status().metadata.extension).toMatchObject({
    name: "neon",
    version: "1.25",
    schema: descriptor.schema,
    type: "neon_backpressure_status",
    member: "type:$extension:neon.neon_backpressure_status",
    array: false,
    search: { filter: false, comparison: false, order: false, text: false },
  });
  expect(api.arrayFields.neon_backpressure_status().metadata.extension).toMatchObject({
    type: "neon_backpressure_status",
    member: "type:$extension:neon._neon_backpressure_status",
    array: true,
  });
});
test("native composite, array bounds and schema neon_lfc_stats", () => {
  expect(api.codecs.neon_lfc_stats.decode('("metric,quoted",9223372036854775807)')).toEqual({
    lfc_key: "metric,quoted",
    lfc_value: 9223372036854775807n,
  });
  expect(api.codecs.neon_lfc_stats.decode("(,)")).toEqual({ lfc_key: null, lfc_value: null });
  expect(api.arrays.neon_lfc_stats.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(api.arrays.neon_lfc_stats.decode('[-2:-1]={"(\\"metric,quoted\\",9223372036854775807)",NULL}')).toEqual({
    dimensions: [{ lowerBound: -2, length: 2 }],
    values: [{ lfc_key: "metric,quoted", lfc_value: 9223372036854775807n }, null],
  });
  expect(api.fields.neon_lfc_stats().metadata.extension).toMatchObject({
    name: "neon",
    version: "1.25",
    schema: descriptor.schema,
    type: "neon_lfc_stats",
    member: "type:$extension:neon.neon_lfc_stats",
    array: false,
    search: { filter: false, comparison: false, order: false, text: false },
  });
  expect(api.arrayFields.neon_lfc_stats().metadata.extension).toMatchObject({
    type: "neon_lfc_stats",
    member: "type:$extension:neon._neon_lfc_stats",
    array: true,
  });
});
test("native composite, array bounds and schema neon_lwlsn_cache_stats", () => {
  expect(api.codecs.neon_lwlsn_cache_stats.decode('("metric,quoted",9223372036854775807)')).toEqual({
    metric_name: "metric,quoted",
    metric_value: 9223372036854775807n,
  });
  expect(api.codecs.neon_lwlsn_cache_stats.decode("(,)")).toEqual({ metric_name: null, metric_value: null });
  expect(api.arrays.neon_lwlsn_cache_stats.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(
    api.arrays.neon_lwlsn_cache_stats.decode('[-2:-1]={"(\\"metric,quoted\\",9223372036854775807)",NULL}'),
  ).toEqual({
    dimensions: [{ lowerBound: -2, length: 2 }],
    values: [{ metric_name: "metric,quoted", metric_value: 9223372036854775807n }, null],
  });
  expect(api.fields.neon_lwlsn_cache_stats().metadata.extension).toMatchObject({
    name: "neon",
    version: "1.25",
    schema: descriptor.schema,
    type: "neon_lwlsn_cache_stats",
    member: "type:$extension:neon.neon_lwlsn_cache_stats",
    array: false,
    search: { filter: false, comparison: false, order: false, text: false },
  });
  expect(api.arrayFields.neon_lwlsn_cache_stats().metadata.extension).toMatchObject({
    type: "neon_lwlsn_cache_stats",
    member: "type:$extension:neon._neon_lwlsn_cache_stats",
    array: true,
  });
});
test("native composite, array bounds and schema neon_perf_counters", () => {
  expect(api.codecs.neon_perf_counters.decode('("metric,quoted",Infinity,Infinity)')).toEqual({
    metric: "metric,quoted",
    bucket_le: { nonfinite: "Infinity" },
    value: { nonfinite: "Infinity" },
  });
  expect(api.codecs.neon_perf_counters.decode("(,,)")).toEqual({ metric: null, bucket_le: null, value: null });
  expect(api.arrays.neon_perf_counters.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(api.arrays.neon_perf_counters.decode('[-2:-1]={"(\\"metric,quoted\\",Infinity,Infinity)",NULL}')).toEqual({
    dimensions: [{ lowerBound: -2, length: 2 }],
    values: [{ metric: "metric,quoted", bucket_le: { nonfinite: "Infinity" }, value: { nonfinite: "Infinity" } }, null],
  });
  expect(api.fields.neon_perf_counters().metadata.extension).toMatchObject({
    name: "neon",
    version: "1.25",
    schema: descriptor.schema,
    type: "neon_perf_counters",
    member: "type:$extension:neon.neon_perf_counters",
    array: false,
    search: { filter: false, comparison: false, order: false, text: false },
  });
  expect(api.arrayFields.neon_perf_counters().metadata.extension).toMatchObject({
    type: "neon_perf_counters",
    member: "type:$extension:neon._neon_perf_counters",
    array: true,
  });
});
test("native composite, array bounds and schema neon_relperst_cache_stats", () => {
  expect(api.codecs.neon_relperst_cache_stats.decode('("metric,quoted",9223372036854775807)')).toEqual({
    metric_name: "metric,quoted",
    metric_value: 9223372036854775807n,
  });
  expect(api.codecs.neon_relperst_cache_stats.decode("(,)")).toEqual({ metric_name: null, metric_value: null });
  expect(api.arrays.neon_relperst_cache_stats.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(
    api.arrays.neon_relperst_cache_stats.decode('[-2:-1]={"(\\"metric,quoted\\",9223372036854775807)",NULL}'),
  ).toEqual({
    dimensions: [{ lowerBound: -2, length: 2 }],
    values: [{ metric_name: "metric,quoted", metric_value: 9223372036854775807n }, null],
  });
  expect(api.fields.neon_relperst_cache_stats().metadata.extension).toMatchObject({
    name: "neon",
    version: "1.25",
    schema: descriptor.schema,
    type: "neon_relperst_cache_stats",
    member: "type:$extension:neon.neon_relperst_cache_stats",
    array: false,
    search: { filter: false, comparison: false, order: false, text: false },
  });
  expect(api.arrayFields.neon_relperst_cache_stats().metadata.extension).toMatchObject({
    type: "neon_relperst_cache_stats",
    member: "type:$extension:neon._neon_relperst_cache_stats",
    array: true,
  });
});
test("native composite, array bounds and schema neon_relsize_cache_stats", () => {
  expect(api.codecs.neon_relsize_cache_stats.decode('("metric,quoted",9223372036854775807)')).toEqual({
    metric_name: "metric,quoted",
    metric_value: 9223372036854775807n,
  });
  expect(api.codecs.neon_relsize_cache_stats.decode("(,)")).toEqual({ metric_name: null, metric_value: null });
  expect(api.arrays.neon_relsize_cache_stats.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(
    api.arrays.neon_relsize_cache_stats.decode('[-2:-1]={"(\\"metric,quoted\\",9223372036854775807)",NULL}'),
  ).toEqual({
    dimensions: [{ lowerBound: -2, length: 2 }],
    values: [{ metric_name: "metric,quoted", metric_value: 9223372036854775807n }, null],
  });
  expect(api.fields.neon_relsize_cache_stats().metadata.extension).toMatchObject({
    name: "neon",
    version: "1.25",
    schema: descriptor.schema,
    type: "neon_relsize_cache_stats",
    member: "type:$extension:neon.neon_relsize_cache_stats",
    array: false,
    search: { filter: false, comparison: false, order: false, text: false },
  });
  expect(api.arrayFields.neon_relsize_cache_stats().metadata.extension).toMatchObject({
    type: "neon_relsize_cache_stats",
    member: "type:$extension:neon._neon_relsize_cache_stats",
    array: true,
  });
});
test("native composite, array bounds and schema neon_stat_file_cache", () => {
  expect(
    api.codecs.neon_stat_file_cache.decode(
      "(9223372036854775807,9223372036854775807,9223372036854775807,9223372036854775807,12345678901234567890.123456789)",
    ),
  ).toEqual({
    file_cache_misses: 9223372036854775807n,
    file_cache_hits: 9223372036854775807n,
    file_cache_used: 9223372036854775807n,
    file_cache_writes: 9223372036854775807n,
    file_cache_hit_ratio: "12345678901234567890.123456789",
  });
  expect(api.codecs.neon_stat_file_cache.decode("(,,,,)")).toEqual({
    file_cache_misses: null,
    file_cache_hits: null,
    file_cache_used: null,
    file_cache_writes: null,
    file_cache_hit_ratio: null,
  });
  expect(api.arrays.neon_stat_file_cache.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(
    api.arrays.neon_stat_file_cache.decode(
      '[-2:-1]={"(9223372036854775807,9223372036854775807,9223372036854775807,9223372036854775807,12345678901234567890.123456789)",NULL}',
    ),
  ).toEqual({
    dimensions: [{ lowerBound: -2, length: 2 }],
    values: [
      {
        file_cache_misses: 9223372036854775807n,
        file_cache_hits: 9223372036854775807n,
        file_cache_used: 9223372036854775807n,
        file_cache_writes: 9223372036854775807n,
        file_cache_hit_ratio: "12345678901234567890.123456789",
      },
      null,
    ],
  });
  expect(api.fields.neon_stat_file_cache().metadata.extension).toMatchObject({
    name: "neon",
    version: "1.25",
    schema: descriptor.schema,
    type: "neon_stat_file_cache",
    member: "type:$extension:neon.neon_stat_file_cache",
    array: false,
    search: { filter: false, comparison: false, order: false, text: false },
  });
  expect(api.arrayFields.neon_stat_file_cache().metadata.extension).toMatchObject({
    type: "neon_stat_file_cache",
    member: "type:$extension:neon._neon_stat_file_cache",
    array: true,
  });
});
test("native composite, array bounds and schema neon_wait_event_snapshot", () => {
  expect(
    api.codecs.neon_wait_event_snapshot.decode(
      '(2147483647,"metric,quoted","metric,quoted",9223372036854775807,9223372036854775807)',
    ),
  ).toEqual({
    wait_event_id: 2147483647,
    wait_class_name: "metric,quoted",
    wait_event_name: "metric,quoted",
    count: 9223372036854775807n,
    time_us: 9223372036854775807n,
  });
  expect(api.codecs.neon_wait_event_snapshot.decode("(,,,,)")).toEqual({
    wait_event_id: null,
    wait_class_name: null,
    wait_event_name: null,
    count: null,
    time_us: null,
  });
  expect(api.arrays.neon_wait_event_snapshot.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(
    api.arrays.neon_wait_event_snapshot.decode(
      '[-2:-1]={"(2147483647,\\"metric,quoted\\",\\"metric,quoted\\",9223372036854775807,9223372036854775807)",NULL}',
    ),
  ).toEqual({
    dimensions: [{ lowerBound: -2, length: 2 }],
    values: [
      {
        wait_event_id: 2147483647,
        wait_class_name: "metric,quoted",
        wait_event_name: "metric,quoted",
        count: 9223372036854775807n,
        time_us: 9223372036854775807n,
      },
      null,
    ],
  });
  expect(api.fields.neon_wait_event_snapshot().metadata.extension).toMatchObject({
    name: "neon",
    version: "1.25",
    schema: descriptor.schema,
    type: "neon_wait_event_snapshot",
    member: "type:$extension:neon.neon_wait_event_snapshot",
    array: false,
    search: { filter: false, comparison: false, order: false, text: false },
  });
  expect(api.arrayFields.neon_wait_event_snapshot().metadata.extension).toMatchObject({
    type: "neon_wait_event_snapshot",
    member: "type:$extension:neon._neon_wait_event_snapshot",
    array: true,
  });
});
