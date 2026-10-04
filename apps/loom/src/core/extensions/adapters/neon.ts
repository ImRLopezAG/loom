import { sql } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  booleanCodec,
  binaryCodec,
  integerCodec,
  nullableCodec,
  withCodecSqlType,
  type ExtensionCodec,
} from "../codecs";
import { createExtensionField, type ExtensionValueSchema } from "../fields";
import { int4Codec } from "../native-codecs";
import { extensionRows } from "../rows";
import { createSqlFunction, defaultSqlArgument, checkedExtensionExpression, type ExtensionSqlInput } from "../sql";
import * as codecs from "./neon-codecs";
export { lsnCodec } from "./neon-codecs";

/** The exact provider contract. Observations delegate to native SQL and carry external-state dependencies. */
export function createNeon_1_25<
  const Descriptor extends ExtensionDescriptor<"neon", { version: "1.25"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "neon" ||
    descriptor.version !== "1.25" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "1f2d339beee9dcc3c93fdc0856fb9c307a04d5937a00ad7174014604be39a09e"
  )
    throw new Error("neon 1.25 requires its exact verified contract");
  const base = { schema: descriptor.schema, dependencies: [], observability: "external", authority: "query" } as const;
  const approximateWorkingSetSizeSeconds = createSqlFunction({
    ...base,
    name: "approximate_working_set_size_seconds",
    member: "routine:$extension:neon.approximate_working_set_size_seconds(pg_catalog.int4)",
    arguments: [defaultSqlArgument(nullableCodec(int4Codec))] as const,
    result: nullableCodec(int4Codec),
  });
  const backpressureLsns = createSqlFunction({
    ...base,
    name: "backpressure_lsns",
    member: "routine:$extension:neon.backpressure_lsns()",
    arguments: [] as const,
    result: codecs.backpressureLsnsCodec,
  });
  const backpressureLsnsRows = (alias: string, ...args: Parameters<typeof backpressureLsns>) =>
    extensionRows(backpressureLsns(...args), alias, codecs.backpressureLsnsFields, "named");
  const backpressureThrottlingTime = createSqlFunction({
    ...base,
    name: "backpressure_throttling_time",
    member: "routine:$extension:neon.backpressure_throttling_time()",
    arguments: [] as const,
    result: integerCodec,
  });
  const getBackendPerfCounters = createSqlFunction({
    ...base,
    name: "get_backend_perf_counters",
    member: "routine:$extension:neon.get_backend_perf_counters()",
    arguments: [] as const,
    result: codecs.getBackendPerfCountersCodec,
  });
  const getBackendPerfCountersRows = (alias: string, ...args: Parameters<typeof getBackendPerfCounters>) =>
    extensionRows(getBackendPerfCounters(...args), alias, codecs.getBackendPerfCountersFields, "record");
  const getHllState = createSqlFunction({
    ...base,
    name: "get_hll_state",
    member: "routine:$extension:neon.get_hll_state()",
    arguments: [] as const,
    result: nullableCodec(binaryCodec),
  });
  const getLocalCacheState = createSqlFunction({
    ...base,
    name: "get_local_cache_state",
    member: "routine:$extension:neon.get_local_cache_state(pg_catalog.int4)",
    arguments: [defaultSqlArgument(nullableCodec(int4Codec))] as const,
    result: nullableCodec(binaryCodec),
  });
  const getPerfCounters = createSqlFunction({
    ...base,
    name: "get_perf_counters",
    member: "routine:$extension:neon.get_perf_counters()",
    arguments: [] as const,
    result: codecs.getPerfCountersCodec,
  });
  const getPerfCountersRows = (alias: string, ...args: Parameters<typeof getPerfCounters>) =>
    extensionRows(getPerfCounters(...args), alias, codecs.getPerfCountersFields, "record");
  const getPrewarmInfo = createSqlFunction({
    ...base,
    name: "get_prewarm_info",
    member: "routine:$extension:neon.get_prewarm_info()",
    arguments: [] as const,
    result: nullableCodec(codecs.getPrewarmInfoCodec),
  });
  const getPrewarmInfoRows = (alias: string, ...args: Parameters<typeof getPrewarmInfo>) =>
    extensionRows(getPrewarmInfo(...args), alias, codecs.getPrewarmInfoFields, "named");
  const localCachePages = createSqlFunction({
    ...base,
    name: "local_cache_pages",
    member: "routine:$extension:neon.local_cache_pages()",
    arguments: [] as const,
    result: codecs.localCachePagesCodec,
  });
  const localCachePagesRows = (alias: string, ...args: Parameters<typeof localCachePages>) =>
    extensionRows(localCachePages(...args), alias, codecs.localCachePagesFields, "record");
  const neonBackendWaitReport = createSqlFunction({
    ...base,
    name: "neon_backend_wait_report",
    member: "routine:$extension:neon.neon_backend_wait_report(pg_catalog.int4,pg_catalog.int4)",
    arguments: [nullableCodec(int4Codec), defaultSqlArgument(nullableCodec(int4Codec))] as const,
    result: codecs.neonBackendWaitReportCodec,
  });
  const neonBackendWaitReportRows = (alias: string, ...args: Parameters<typeof neonBackendWaitReport>) =>
    extensionRows(neonBackendWaitReport(...args), alias, codecs.neonBackendWaitReportFields, "named");
  const neonBackpressureStatus = createSqlFunction({
    ...base,
    name: "neon_backpressure_status",
    member: "routine:$extension:neon.neon_backpressure_status()",
    arguments: [] as const,
    result: codecs.neonBackpressureStatusCodec,
  });
  const neonBackpressureStatusRows = (alias: string, ...args: Parameters<typeof neonBackpressureStatus>) =>
    extensionRows(neonBackpressureStatus(...args), alias, codecs.neonBackpressureStatusFields, "named");
  const neonCommunicatorMinInflightRequestLsn = createSqlFunction({
    ...base,
    name: "neon_communicator_min_inflight_request_lsn",
    member: "routine:$extension:neon.neon_communicator_min_inflight_request_lsn()",
    arguments: [] as const,
    result: nullableCodec(codecs.lsnCodec),
  });
  const neonDatumImageEqual = <Input, Output>(
    codec: ExtensionCodec<Input, Output>,
    left: NoInfer<ExtensionSqlInput<ExtensionCodec<Input, Output>>>,
    right: NoInfer<ExtensionSqlInput<ExtensionCodec<Input, Output>>>,
  ) => {
    if (!codec.sqlType || codec.sqlType.name === "anyelement")
      throw new Error("Datum image comparison requires a concrete SQL input type");
    return createSqlFunction({
      ...base,
      name: "neon_datum_image_equal",
      member: "routine:$extension:neon.neon_datum_image_equal(pg_catalog.anyelement,pg_catalog.anyelement)",
      arguments: [codec, codec] as const,
      result: booleanCodec,
    })(left, right);
  };
  const neonGetBackendWaitEventStats = createSqlFunction({
    ...base,
    name: "neon_get_backend_wait_event_stats",
    member: "routine:$extension:neon.neon_get_backend_wait_event_stats(pg_catalog.int4)",
    arguments: [defaultSqlArgument(nullableCodec(int4Codec))] as const,
    result: codecs.neonGetBackendWaitEventStatsCodec,
  });
  const neonGetBackendWaitEventStatsRows = (alias: string, ...args: Parameters<typeof neonGetBackendWaitEventStats>) =>
    extensionRows(neonGetBackendWaitEventStats(...args), alias, codecs.neonGetBackendWaitEventStatsFields, "named");
  const neonGetCacheStats = createSqlFunction({
    ...base,
    name: "neon_get_cache_stats",
    member: "routine:$extension:neon.neon_get_cache_stats()",
    arguments: [] as const,
    result: codecs.neonGetCacheStatsCodec,
  });
  const neonGetCacheStatsRows = (alias: string, ...args: Parameters<typeof neonGetCacheStats>) =>
    extensionRows(neonGetCacheStats(...args), alias, codecs.neonGetCacheStatsFields, "record");
  const neonGetLfcStats = createSqlFunction({
    ...base,
    name: "neon_get_lfc_stats",
    member: "routine:$extension:neon.neon_get_lfc_stats()",
    arguments: [] as const,
    result: codecs.neonGetLfcStatsCodec,
  });
  const neonGetLfcStatsRows = (alias: string, ...args: Parameters<typeof neonGetLfcStats>) =>
    extensionRows(neonGetLfcStats(...args), alias, codecs.neonGetLfcStatsFields, "record");
  const neonGetWaitEventStats = createSqlFunction({
    ...base,
    name: "neon_get_wait_event_stats",
    member: "routine:$extension:neon.neon_get_wait_event_stats()",
    arguments: [] as const,
    result: codecs.neonGetWaitEventStatsCodec,
  });
  const neonGetWaitEventStatsRows = (alias: string, ...args: Parameters<typeof neonGetWaitEventStats>) =>
    extensionRows(neonGetWaitEventStats(...args), alias, codecs.neonGetWaitEventStatsFields, "named");
  const neonLfcPartStats = createSqlFunction({
    ...base,
    name: "neon_lfc_part_stats",
    member: "routine:$extension:neon.neon_lfc_part_stats()",
    arguments: [] as const,
    result: codecs.neonLfcPartStatsCodec,
  });
  const neonLfcPartStatsRows = (alias: string, ...args: Parameters<typeof neonLfcPartStats>) =>
    extensionRows(neonLfcPartStats(...args), alias, codecs.neonLfcPartStatsFields, "named");
  const neonWaitReport = createSqlFunction({
    ...base,
    name: "neon_wait_report",
    member: "routine:$extension:neon.neon_wait_report(pg_catalog.int4)",
    arguments: [defaultSqlArgument(nullableCodec(int4Codec))] as const,
    result: codecs.neonWaitReportCodec,
  });
  const neonWaitReportRows = (alias: string, ...args: Parameters<typeof neonWaitReport>) =>
    extensionRows(neonWaitReport(...args), alias, codecs.neonWaitReportFields, "named");
  const pgClusterSize = createSqlFunction({
    ...base,
    name: "pg_cluster_size",
    member: "routine:$extension:neon.pg_cluster_size()",
    arguments: [] as const,
    result: integerCodec,
  });
  const compositeCodecs = Object.freeze({
    local_cache: withCodecSqlType(codecs.localCacheCodec, { schema: descriptor.schema, name: "local_cache" }),
    neon_backend_perf_counters: withCodecSqlType(codecs.neonBackendPerfCountersCodec, {
      schema: descriptor.schema,
      name: "neon_backend_perf_counters",
    }),
    neon_backpressure_status: withCodecSqlType(codecs.neonBackpressureStatusCodec, {
      schema: descriptor.schema,
      name: "neon_backpressure_status",
    }),
    neon_lfc_stats: withCodecSqlType(codecs.neonLfcStatsCodec, { schema: descriptor.schema, name: "neon_lfc_stats" }),
    neon_lwlsn_cache_stats: withCodecSqlType(codecs.neonLwlsnCacheStatsCodec, {
      schema: descriptor.schema,
      name: "neon_lwlsn_cache_stats",
    }),
    neon_perf_counters: withCodecSqlType(codecs.neonPerfCountersCodec, {
      schema: descriptor.schema,
      name: "neon_perf_counters",
    }),
    neon_relperst_cache_stats: withCodecSqlType(codecs.neonRelperstCacheStatsCodec, {
      schema: descriptor.schema,
      name: "neon_relperst_cache_stats",
    }),
    neon_relsize_cache_stats: withCodecSqlType(codecs.neonRelsizeCacheStatsCodec, {
      schema: descriptor.schema,
      name: "neon_relsize_cache_stats",
    }),
    neon_stat_file_cache: withCodecSqlType(codecs.neonStatFileCacheCodec, {
      schema: descriptor.schema,
      name: "neon_stat_file_cache",
    }),
    neon_wait_event_snapshot: withCodecSqlType(codecs.neonWaitEventSnapshotCodec, {
      schema: descriptor.schema,
      name: "neon_wait_event_snapshot",
    }),
  });
  const compositeArrays = Object.freeze({
    local_cache: arrayCodec(compositeCodecs.local_cache),
    neon_backend_perf_counters: arrayCodec(compositeCodecs.neon_backend_perf_counters),
    neon_backpressure_status: arrayCodec(compositeCodecs.neon_backpressure_status),
    neon_lfc_stats: arrayCodec(compositeCodecs.neon_lfc_stats),
    neon_lwlsn_cache_stats: arrayCodec(compositeCodecs.neon_lwlsn_cache_stats),
    neon_perf_counters: arrayCodec(compositeCodecs.neon_perf_counters),
    neon_relperst_cache_stats: arrayCodec(compositeCodecs.neon_relperst_cache_stats),
    neon_relsize_cache_stats: arrayCodec(compositeCodecs.neon_relsize_cache_stats),
    neon_stat_file_cache: arrayCodec(compositeCodecs.neon_stat_file_cache),
    neon_wait_event_snapshot: arrayCodec(compositeCodecs.neon_wait_event_snapshot),
  });
  const views = Object.freeze({
    local_cache: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`(select ${sql.join([sql.identifier("pageoffs"), sql.identifier("relfilenode"), sql.identifier("reltablespace"), sql.identifier("reldatabase"), sql.identifier("relforknumber"), sql.identifier("relblocknumber"), sql.identifier("accesscount")], sql`, `)} from ${sql.identifier(descriptor.schema)}.${sql.identifier("local_cache")})`,
          codecs.localCacheCodec,
          [],
          undefined,
          'view:"$extension:neon".local_cache',
          "external",
        ),
        alias,
        codecs.localCacheFields,
        "named",
      ),
    neon_backend_perf_counters: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`(select ${sql.join([sql.identifier("procno"), sql.identifier("pid"), sql.identifier("metric"), sql.identifier("bucket_le"), sql.identifier("value")], sql`, `)} from ${sql.identifier(descriptor.schema)}.${sql.identifier("neon_backend_perf_counters")})`,
          codecs.neonBackendPerfCountersCodec,
          [],
          undefined,
          'view:"$extension:neon".neon_backend_perf_counters',
          "external",
        ),
        alias,
        codecs.neonBackendPerfCountersFields,
        "named",
      ),
    neon_backpressure_status: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`(select ${sql.join([sql.identifier("metric"), sql.identifier("value")], sql`, `)} from ${sql.identifier(descriptor.schema)}.${sql.identifier("neon_backpressure_status")})`,
          codecs.neonBackpressureStatusCodec,
          [],
          undefined,
          'view:"$extension:neon".neon_backpressure_status',
          "external",
        ),
        alias,
        codecs.neonBackpressureStatusFields,
        "named",
      ),
    neon_lfc_stats: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`(select ${sql.join([sql.identifier("lfc_key"), sql.identifier("lfc_value")], sql`, `)} from ${sql.identifier(descriptor.schema)}.${sql.identifier("neon_lfc_stats")})`,
          codecs.neonLfcStatsCodec,
          [],
          undefined,
          'view:"$extension:neon".neon_lfc_stats',
          "external",
        ),
        alias,
        codecs.neonLfcStatsFields,
        "named",
      ),
    neon_lwlsn_cache_stats: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`(select ${sql.join([sql.identifier("metric_name"), sql.identifier("metric_value")], sql`, `)} from ${sql.identifier(descriptor.schema)}.${sql.identifier("neon_lwlsn_cache_stats")})`,
          codecs.neonLwlsnCacheStatsCodec,
          [],
          undefined,
          'view:"$extension:neon".neon_lwlsn_cache_stats',
          "external",
        ),
        alias,
        codecs.neonLwlsnCacheStatsFields,
        "named",
      ),
    neon_perf_counters: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`(select ${sql.join([sql.identifier("metric"), sql.identifier("bucket_le"), sql.identifier("value")], sql`, `)} from ${sql.identifier(descriptor.schema)}.${sql.identifier("neon_perf_counters")})`,
          codecs.neonPerfCountersCodec,
          [],
          undefined,
          'view:"$extension:neon".neon_perf_counters',
          "external",
        ),
        alias,
        codecs.neonPerfCountersFields,
        "named",
      ),
    neon_relperst_cache_stats: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`(select ${sql.join([sql.identifier("metric_name"), sql.identifier("metric_value")], sql`, `)} from ${sql.identifier(descriptor.schema)}.${sql.identifier("neon_relperst_cache_stats")})`,
          codecs.neonRelperstCacheStatsCodec,
          [],
          undefined,
          'view:"$extension:neon".neon_relperst_cache_stats',
          "external",
        ),
        alias,
        codecs.neonRelperstCacheStatsFields,
        "named",
      ),
    neon_relsize_cache_stats: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`(select ${sql.join([sql.identifier("metric_name"), sql.identifier("metric_value")], sql`, `)} from ${sql.identifier(descriptor.schema)}.${sql.identifier("neon_relsize_cache_stats")})`,
          codecs.neonRelsizeCacheStatsCodec,
          [],
          undefined,
          'view:"$extension:neon".neon_relsize_cache_stats',
          "external",
        ),
        alias,
        codecs.neonRelsizeCacheStatsFields,
        "named",
      ),
    neon_stat_file_cache: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`(select ${sql.join([sql.identifier("file_cache_misses"), sql.identifier("file_cache_hits"), sql.identifier("file_cache_used"), sql.identifier("file_cache_writes"), sql.identifier("file_cache_hit_ratio")], sql`, `)} from ${sql.identifier(descriptor.schema)}.${sql.identifier("neon_stat_file_cache")})`,
          codecs.neonStatFileCacheCodec,
          [],
          undefined,
          'view:"$extension:neon".neon_stat_file_cache',
          "external",
        ),
        alias,
        codecs.neonStatFileCacheFields,
        "named",
      ),
  });
  const search = { filter: false, comparison: false, order: false, text: false } as const;
  const fields = Object.freeze({
    local_cache: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon.local_cache",
        type: "local_cache",
        codec: compositeCodecs.local_cache,
        value: codecs.compositeValues.local_cache,
        search,
      }),
    neon_backend_perf_counters: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon.neon_backend_perf_counters",
        type: "neon_backend_perf_counters",
        codec: compositeCodecs.neon_backend_perf_counters,
        value: codecs.compositeValues.neon_backend_perf_counters,
        search,
      }),
    neon_backpressure_status: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon.neon_backpressure_status",
        type: "neon_backpressure_status",
        codec: compositeCodecs.neon_backpressure_status,
        value: codecs.compositeValues.neon_backpressure_status,
        search,
      }),
    neon_lfc_stats: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon.neon_lfc_stats",
        type: "neon_lfc_stats",
        codec: compositeCodecs.neon_lfc_stats,
        value: codecs.compositeValues.neon_lfc_stats,
        search,
      }),
    neon_lwlsn_cache_stats: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon.neon_lwlsn_cache_stats",
        type: "neon_lwlsn_cache_stats",
        codec: compositeCodecs.neon_lwlsn_cache_stats,
        value: codecs.compositeValues.neon_lwlsn_cache_stats,
        search,
      }),
    neon_perf_counters: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon.neon_perf_counters",
        type: "neon_perf_counters",
        codec: compositeCodecs.neon_perf_counters,
        value: codecs.compositeValues.neon_perf_counters,
        search,
      }),
    neon_relperst_cache_stats: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon.neon_relperst_cache_stats",
        type: "neon_relperst_cache_stats",
        codec: compositeCodecs.neon_relperst_cache_stats,
        value: codecs.compositeValues.neon_relperst_cache_stats,
        search,
      }),
    neon_relsize_cache_stats: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon.neon_relsize_cache_stats",
        type: "neon_relsize_cache_stats",
        codec: compositeCodecs.neon_relsize_cache_stats,
        value: codecs.compositeValues.neon_relsize_cache_stats,
        search,
      }),
    neon_stat_file_cache: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon.neon_stat_file_cache",
        type: "neon_stat_file_cache",
        codec: compositeCodecs.neon_stat_file_cache,
        value: codecs.compositeValues.neon_stat_file_cache,
        search,
      }),
    neon_wait_event_snapshot: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon.neon_wait_event_snapshot",
        type: "neon_wait_event_snapshot",
        codec: compositeCodecs.neon_wait_event_snapshot,
        value: codecs.compositeValues.neon_wait_event_snapshot,
        search,
      }),
  });
  const arrayValue = (record: ExtensionValueSchema): ExtensionValueSchema => {
    const element: ExtensionValueSchema = { kind: "union", variants: [record, { kind: "null" }] };
    let nested: ExtensionValueSchema = element;
    const variants: ExtensionValueSchema[] = [];
    for (let rank = 1; rank <= 6; rank++) {
      nested = { kind: "array", items: nested };
      variants.push(nested);
    }
    return {
      kind: "object",
      properties: {
        dimensions: {
          kind: "array",
          items: {
            kind: "object",
            properties: {
              lowerBound: { kind: "number", integer: true },
              length: { kind: "number", integer: true, minimum: 0 },
            },
          },
        },
        values: { kind: "union", variants },
      },
    };
  };
  const arrayFields = Object.freeze({
    local_cache: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon._local_cache",
        type: "local_cache",
        array: true,
        codec: compositeArrays.local_cache,
        value: arrayValue(codecs.compositeValues.local_cache),
        search,
      }),
    neon_backend_perf_counters: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon._neon_backend_perf_counters",
        type: "neon_backend_perf_counters",
        array: true,
        codec: compositeArrays.neon_backend_perf_counters,
        value: arrayValue(codecs.compositeValues.neon_backend_perf_counters),
        search,
      }),
    neon_backpressure_status: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon._neon_backpressure_status",
        type: "neon_backpressure_status",
        array: true,
        codec: compositeArrays.neon_backpressure_status,
        value: arrayValue(codecs.compositeValues.neon_backpressure_status),
        search,
      }),
    neon_lfc_stats: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon._neon_lfc_stats",
        type: "neon_lfc_stats",
        array: true,
        codec: compositeArrays.neon_lfc_stats,
        value: arrayValue(codecs.compositeValues.neon_lfc_stats),
        search,
      }),
    neon_lwlsn_cache_stats: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon._neon_lwlsn_cache_stats",
        type: "neon_lwlsn_cache_stats",
        array: true,
        codec: compositeArrays.neon_lwlsn_cache_stats,
        value: arrayValue(codecs.compositeValues.neon_lwlsn_cache_stats),
        search,
      }),
    neon_perf_counters: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon._neon_perf_counters",
        type: "neon_perf_counters",
        array: true,
        codec: compositeArrays.neon_perf_counters,
        value: arrayValue(codecs.compositeValues.neon_perf_counters),
        search,
      }),
    neon_relperst_cache_stats: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon._neon_relperst_cache_stats",
        type: "neon_relperst_cache_stats",
        array: true,
        codec: compositeArrays.neon_relperst_cache_stats,
        value: arrayValue(codecs.compositeValues.neon_relperst_cache_stats),
        search,
      }),
    neon_relsize_cache_stats: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon._neon_relsize_cache_stats",
        type: "neon_relsize_cache_stats",
        array: true,
        codec: compositeArrays.neon_relsize_cache_stats,
        value: arrayValue(codecs.compositeValues.neon_relsize_cache_stats),
        search,
      }),
    neon_stat_file_cache: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon._neon_stat_file_cache",
        type: "neon_stat_file_cache",
        array: true,
        codec: compositeArrays.neon_stat_file_cache,
        value: arrayValue(codecs.compositeValues.neon_stat_file_cache),
        search,
      }),
    neon_wait_event_snapshot: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:neon._neon_wait_event_snapshot",
        type: "neon_wait_event_snapshot",
        array: true,
        codec: compositeArrays.neon_wait_event_snapshot,
        value: arrayValue(codecs.compositeValues.neon_wait_event_snapshot),
        search,
      }),
  });
  return bindExtension(descriptor, {
    approximateWorkingSetSizeSeconds,
    backpressureLsns,
    backpressureLsnsRows,
    backpressureThrottlingTime,
    getBackendPerfCounters,
    getBackendPerfCountersRows,
    getHllState,
    getLocalCacheState,
    getPerfCounters,
    getPerfCountersRows,
    getPrewarmInfo,
    getPrewarmInfoRows,
    localCachePages,
    localCachePagesRows,
    neonBackendWaitReport,
    neonBackendWaitReportRows,
    neonBackpressureStatus,
    neonBackpressureStatusRows,
    neonCommunicatorMinInflightRequestLsn,
    neonDatumImageEqual,
    neonGetBackendWaitEventStats,
    neonGetBackendWaitEventStatsRows,
    neonGetCacheStats,
    neonGetCacheStatsRows,
    neonGetLfcStats,
    neonGetLfcStatsRows,
    neonGetWaitEventStats,
    neonGetWaitEventStatsRows,
    neonLfcPartStats,
    neonLfcPartStatsRows,
    neonWaitReport,
    neonWaitReportRows,
    pgClusterSize,
    codecs: compositeCodecs,
    arrays: compositeArrays,
    fields,
    arrayFields,
    views,
    sql: Object.freeze({
      functions: Object.freeze({
        approximate_working_set_size_seconds: approximateWorkingSetSizeSeconds,
        backpressure_lsns: backpressureLsns,
        backpressure_throttling_time: backpressureThrottlingTime,
        get_backend_perf_counters: getBackendPerfCounters,
        get_hll_state: getHllState,
        get_local_cache_state: getLocalCacheState,
        get_perf_counters: getPerfCounters,
        get_prewarm_info: getPrewarmInfo,
        local_cache_pages: localCachePages,
        neon_backend_wait_report: neonBackendWaitReport,
        neon_backpressure_status: neonBackpressureStatus,
        neon_communicator_min_inflight_request_lsn: neonCommunicatorMinInflightRequestLsn,
        neon_datum_image_equal: neonDatumImageEqual,
        neon_get_backend_wait_event_stats: neonGetBackendWaitEventStats,
        neon_get_cache_stats: neonGetCacheStats,
        neon_get_lfc_stats: neonGetLfcStats,
        neon_get_wait_event_stats: neonGetWaitEventStats,
        neon_lfc_part_stats: neonLfcPartStats,
        neon_wait_report: neonWaitReport,
        pg_cluster_size: pgClusterSize,
      }),
      operators: Object.freeze({}),
    }),
  });
}
