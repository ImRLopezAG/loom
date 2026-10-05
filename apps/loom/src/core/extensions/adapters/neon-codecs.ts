import * as v from "valibot";
import {
  createExtensionCodec,
  compositeCodec,
  nullableCodec,
  textCodec,
  integerCodec,
  floatCodec,
  numericCodec,
} from "../codecs";
import { int4Codec } from "../native-codecs";

export const oidCodec = createExtensionCodec({
  id: "pg:oid:1",
  sqlType: { schema: "pg_catalog", name: "oid" },
  input: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(4294967295)),
  output: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(4294967295)),
  transport: "native",
  encode: (value) => value,
  decode: (value) => (v.is(v.string(), value) ? Number(v.parse(v.pipe(v.string(), v.regex(/^\d+$/)), value)) : value),
});
export const int2Codec = createExtensionCodec({
  id: "pg:int2:1",
  sqlType: { schema: "pg_catalog", name: "int2" },
  input: v.pipe(v.number(), v.integer(), v.minValue(-32768), v.maxValue(32767)),
  output: v.pipe(v.number(), v.integer(), v.minValue(-32768), v.maxValue(32767)),
  transport: "native",
  encode: (value) => value,
  decode: (value) => (v.is(v.string(), value) ? Number(v.parse(v.pipe(v.string(), v.regex(/^-?\d+$/)), value)) : value),
});
const lsn = v.pipe(v.string(), v.regex(/^[0-9A-F]{1,8}\/[0-9A-F]{1,8}$/));
/** PostgreSQL canonical pg_lsn text; do not round this 64-bit location through a JavaScript number. */
export const lsnCodec = createExtensionCodec({
  id: "pg:pg_lsn:1",
  sqlType: { schema: "pg_catalog", name: "pg_lsn" },
  input: lsn,
  output: lsn,
  transport: "text",
  encode: (value) => value,
  decode: (value) => value,
});
/** Native void has no application value. This codec is used only by explicit tooling. */
export const voidCodec = createExtensionCodec({
  id: "pg:void:1",
  input: v.undefined(),
  output: v.undefined(),
  transport: "native",
  encode: () => null,
  decode: (value) => {
    v.parse(v.union([v.literal(""), v.null(), v.undefined()]), value);
    return undefined;
  },
});

export const localCacheFields = Object.freeze({
  pageoffs: nullableCodec(integerCodec),
  relfilenode: nullableCodec(oidCodec),
  reltablespace: nullableCodec(oidCodec),
  reldatabase: nullableCodec(oidCodec),
  relforknumber: nullableCodec(int2Codec),
  relblocknumber: nullableCodec(integerCodec),
  accesscount: nullableCodec(int4Codec),
});
export const localCacheCodec = compositeCodec("neon:local_cache", localCacheFields);

export const neonBackendPerfCountersFields = Object.freeze({
  procno: nullableCodec(int4Codec),
  pid: nullableCodec(int4Codec),
  metric: nullableCodec(textCodec),
  bucket_le: nullableCodec(floatCodec),
  value: nullableCodec(floatCodec),
});
export const neonBackendPerfCountersCodec = compositeCodec(
  "neon:neon_backend_perf_counters",
  neonBackendPerfCountersFields,
);

export const neonBackpressureStatusFields = Object.freeze({
  metric: nullableCodec(textCodec),
  value: nullableCodec(floatCodec),
});
export const neonBackpressureStatusCodec = compositeCodec(
  "neon:neon_backpressure_status",
  neonBackpressureStatusFields,
);

export const neonLfcStatsFields = Object.freeze({
  lfc_key: nullableCodec(textCodec),
  lfc_value: nullableCodec(integerCodec),
});
export const neonLfcStatsCodec = compositeCodec("neon:neon_lfc_stats", neonLfcStatsFields);

export const neonLwlsnCacheStatsFields = Object.freeze({
  metric_name: nullableCodec(textCodec),
  metric_value: nullableCodec(integerCodec),
});
export const neonLwlsnCacheStatsCodec = compositeCodec("neon:neon_lwlsn_cache_stats", neonLwlsnCacheStatsFields);

export const neonPerfCountersFields = Object.freeze({
  metric: nullableCodec(textCodec),
  bucket_le: nullableCodec(floatCodec),
  value: nullableCodec(floatCodec),
});
export const neonPerfCountersCodec = compositeCodec("neon:neon_perf_counters", neonPerfCountersFields);

export const neonRelperstCacheStatsFields = Object.freeze({
  metric_name: nullableCodec(textCodec),
  metric_value: nullableCodec(integerCodec),
});
export const neonRelperstCacheStatsCodec = compositeCodec(
  "neon:neon_relperst_cache_stats",
  neonRelperstCacheStatsFields,
);

export const neonRelsizeCacheStatsFields = Object.freeze({
  metric_name: nullableCodec(textCodec),
  metric_value: nullableCodec(integerCodec),
});
export const neonRelsizeCacheStatsCodec = compositeCodec("neon:neon_relsize_cache_stats", neonRelsizeCacheStatsFields);

export const neonStatFileCacheFields = Object.freeze({
  file_cache_misses: nullableCodec(integerCodec),
  file_cache_hits: nullableCodec(integerCodec),
  file_cache_used: nullableCodec(integerCodec),
  file_cache_writes: nullableCodec(integerCodec),
  file_cache_hit_ratio: nullableCodec(numericCodec),
});
export const neonStatFileCacheCodec = compositeCodec("neon:neon_stat_file_cache", neonStatFileCacheFields);

export const neonWaitEventSnapshotFields = Object.freeze({
  wait_event_id: nullableCodec(int4Codec),
  wait_class_name: nullableCodec(textCodec),
  wait_event_name: nullableCodec(textCodec),
  count: nullableCodec(integerCodec),
  time_us: nullableCodec(integerCodec),
});
export const neonWaitEventSnapshotCodec = compositeCodec("neon:neon_wait_event_snapshot", neonWaitEventSnapshotFields);

export const backpressureLsnsFields = Object.freeze({
  received_lsn: nullableCodec(lsnCodec),
  disk_consistent_lsn: nullableCodec(lsnCodec),
  remote_consistent_lsn: nullableCodec(lsnCodec),
});
export const backpressureLsnsCodec = compositeCodec("neon:backpressure_lsns", backpressureLsnsFields);

export const getBuffercachePrewarmInfoFields = Object.freeze({
  total_pages: nullableCodec(int4Codec),
  prewarmed_pages: nullableCodec(int4Codec),
  skipped_pages: nullableCodec(int4Codec),
  active_workers: nullableCodec(int4Codec),
});
export const getBuffercachePrewarmInfoCodec = compositeCodec(
  "neon:get_buffercache_prewarm_info",
  getBuffercachePrewarmInfoFields,
);

export const getPrewarmInfoFields = Object.freeze({
  total_pages: nullableCodec(int4Codec),
  prewarmed_pages: nullableCodec(int4Codec),
  skipped_pages: nullableCodec(int4Codec),
  active_workers: nullableCodec(int4Codec),
});
export const getPrewarmInfoCodec = compositeCodec("neon:get_prewarm_info", getPrewarmInfoFields);

export const neonBackendWaitReportFields = Object.freeze({
  type_name: nullableCodec(textCodec),
  event_name: nullableCodec(textCodec),
  waits: nullableCodec(integerCodec),
  wait_time: nullableCodec(numericCodec),
  ms_per_wait: nullableCodec(numericCodec),
});
export const neonBackendWaitReportCodec = compositeCodec("neon:neon_backend_wait_report", neonBackendWaitReportFields);

export const neonGetBackendWaitEventStatsFields = Object.freeze({
  backend_pid: nullableCodec(int4Codec),
  wait_event_id: nullableCodec(int4Codec),
  count: nullableCodec(integerCodec),
  time_us: nullableCodec(integerCodec),
  wait_class_name: nullableCodec(textCodec),
  wait_event_name: nullableCodec(textCodec),
});
export const neonGetBackendWaitEventStatsCodec = compositeCodec(
  "neon:neon_get_backend_wait_event_stats",
  neonGetBackendWaitEventStatsFields,
);

export const neonGetWaitEventStatsFields = Object.freeze({
  wait_event_id: nullableCodec(int4Codec),
  count: nullableCodec(integerCodec),
  time_us: nullableCodec(integerCodec),
  wait_class_name: nullableCodec(textCodec),
  wait_event_name: nullableCodec(textCodec),
});
export const neonGetWaitEventStatsCodec = compositeCodec("neon:neon_get_wait_event_stats", neonGetWaitEventStatsFields);

export const neonLfcPartStatsFields = Object.freeze({
  lfc_part: nullableCodec(int4Codec),
  lfc_key: nullableCodec(textCodec),
  lfc_value: nullableCodec(integerCodec),
});
export const neonLfcPartStatsCodec = compositeCodec("neon:neon_lfc_part_stats", neonLfcPartStatsFields);

export const neonWaitReportFields = Object.freeze({
  type_name: nullableCodec(textCodec),
  event_name: nullableCodec(textCodec),
  waits: nullableCodec(integerCodec),
  wait_time: nullableCodec(numericCodec),
  ms_per_wait: nullableCodec(numericCodec),
  waits_per_xact: nullableCodec(numericCodec),
  ms_per_xact: nullableCodec(numericCodec),
});
export const neonWaitReportCodec = compositeCodec("neon:neon_wait_report", neonWaitReportFields);

export const pgResizeSharedBuffersFields = Object.freeze({
  key: nullableCodec(textCodec),
  value: nullableCodec(floatCodec),
  unit: nullableCodec(textCodec),
});
export const pgResizeSharedBuffersCodec = compositeCodec("neon:pg_resize_shared_buffers", pgResizeSharedBuffersFields);

export const getPerfCountersFields = Object.freeze({
  metric: nullableCodec(textCodec),
  bucket_le: nullableCodec(floatCodec),
  value: nullableCodec(floatCodec),
});
export const getPerfCountersCodec = compositeCodec("neon:get_perf_counters", getPerfCountersFields);

export const getBackendPerfCountersFields = Object.freeze({
  procno: nullableCodec(int4Codec),
  pid: nullableCodec(int4Codec),
  metric: nullableCodec(textCodec),
  bucket_le: nullableCodec(floatCodec),
  value: nullableCodec(floatCodec),
});
export const getBackendPerfCountersCodec = compositeCodec(
  "neon:get_backend_perf_counters",
  getBackendPerfCountersFields,
);

export const localCachePagesFields = Object.freeze({
  pageoffs: nullableCodec(integerCodec),
  relfilenode: nullableCodec(oidCodec),
  reltablespace: nullableCodec(oidCodec),
  reldatabase: nullableCodec(oidCodec),
  relforknumber: nullableCodec(int2Codec),
  relblocknumber: nullableCodec(integerCodec),
  accesscount: nullableCodec(int4Codec),
});
export const localCachePagesCodec = compositeCodec("neon:local_cache_pages", localCachePagesFields);

export const neonGetLfcStatsFields = Object.freeze({
  lfc_key: nullableCodec(textCodec),
  lfc_value: nullableCodec(integerCodec),
});
export const neonGetLfcStatsCodec = compositeCodec("neon:neon_get_lfc_stats", neonGetLfcStatsFields);

export const neonGetCacheStatsFields = Object.freeze({
  cache_name: nullableCodec(textCodec),
  metric_name: nullableCodec(textCodec),
  metric_value: nullableCodec(integerCodec),
});
export const neonGetCacheStatsCodec = compositeCodec("neon:neon_get_cache_stats", neonGetCacheStatsFields);

/** Portable record wire shapes follow each captured composite attribute and SQL NULL. */
export const compositeValues = {
  local_cache: {
    kind: "object",
    properties: {
      pageoffs: {
        kind: "union",
        variants: [
          {
            kind: "bigint",
          },
          {
            kind: "null",
          },
        ],
      },
      relfilenode: {
        kind: "union",
        variants: [
          {
            kind: "number",
            integer: true,
            minimum: 0,
            maximum: 4294967295,
          },
          {
            kind: "null",
          },
        ],
      },
      reltablespace: {
        kind: "union",
        variants: [
          {
            kind: "number",
            integer: true,
            minimum: 0,
            maximum: 4294967295,
          },
          {
            kind: "null",
          },
        ],
      },
      reldatabase: {
        kind: "union",
        variants: [
          {
            kind: "number",
            integer: true,
            minimum: 0,
            maximum: 4294967295,
          },
          {
            kind: "null",
          },
        ],
      },
      relforknumber: {
        kind: "union",
        variants: [
          {
            kind: "number",
            integer: true,
            minimum: -32768,
            maximum: 32767,
          },
          {
            kind: "null",
          },
        ],
      },
      relblocknumber: {
        kind: "union",
        variants: [
          {
            kind: "bigint",
          },
          {
            kind: "null",
          },
        ],
      },
      accesscount: {
        kind: "union",
        variants: [
          {
            kind: "number",
            integer: true,
            minimum: -2147483648,
            maximum: 2147483647,
          },
          {
            kind: "null",
          },
        ],
      },
    },
  },
  neon_backend_perf_counters: {
    kind: "object",
    properties: {
      procno: {
        kind: "union",
        variants: [
          {
            kind: "number",
            integer: true,
            minimum: -2147483648,
            maximum: 2147483647,
          },
          {
            kind: "null",
          },
        ],
      },
      pid: {
        kind: "union",
        variants: [
          {
            kind: "number",
            integer: true,
            minimum: -2147483648,
            maximum: 2147483647,
          },
          {
            kind: "null",
          },
        ],
      },
      metric: {
        kind: "union",
        variants: [
          {
            kind: "string",
          },
          {
            kind: "null",
          },
        ],
      },
      bucket_le: {
        kind: "union",
        variants: [
          {
            kind: "union",
            variants: [
              {
                kind: "number",
              },
              {
                kind: "object",
                properties: {
                  nonfinite: {
                    kind: "string",
                    enum: ["NaN", "Infinity", "-Infinity"],
                  },
                },
              },
            ],
          },
          {
            kind: "null",
          },
        ],
      },
      value: {
        kind: "union",
        variants: [
          {
            kind: "union",
            variants: [
              {
                kind: "number",
              },
              {
                kind: "object",
                properties: {
                  nonfinite: {
                    kind: "string",
                    enum: ["NaN", "Infinity", "-Infinity"],
                  },
                },
              },
            ],
          },
          {
            kind: "null",
          },
        ],
      },
    },
  },
  neon_backpressure_status: {
    kind: "object",
    properties: {
      metric: {
        kind: "union",
        variants: [
          {
            kind: "string",
          },
          {
            kind: "null",
          },
        ],
      },
      value: {
        kind: "union",
        variants: [
          {
            kind: "union",
            variants: [
              {
                kind: "number",
              },
              {
                kind: "object",
                properties: {
                  nonfinite: {
                    kind: "string",
                    enum: ["NaN", "Infinity", "-Infinity"],
                  },
                },
              },
            ],
          },
          {
            kind: "null",
          },
        ],
      },
    },
  },
  neon_lfc_stats: {
    kind: "object",
    properties: {
      lfc_key: {
        kind: "union",
        variants: [
          {
            kind: "string",
          },
          {
            kind: "null",
          },
        ],
      },
      lfc_value: {
        kind: "union",
        variants: [
          {
            kind: "bigint",
          },
          {
            kind: "null",
          },
        ],
      },
    },
  },
  neon_lwlsn_cache_stats: {
    kind: "object",
    properties: {
      metric_name: {
        kind: "union",
        variants: [
          {
            kind: "string",
          },
          {
            kind: "null",
          },
        ],
      },
      metric_value: {
        kind: "union",
        variants: [
          {
            kind: "bigint",
          },
          {
            kind: "null",
          },
        ],
      },
    },
  },
  neon_perf_counters: {
    kind: "object",
    properties: {
      metric: {
        kind: "union",
        variants: [
          {
            kind: "string",
          },
          {
            kind: "null",
          },
        ],
      },
      bucket_le: {
        kind: "union",
        variants: [
          {
            kind: "union",
            variants: [
              {
                kind: "number",
              },
              {
                kind: "object",
                properties: {
                  nonfinite: {
                    kind: "string",
                    enum: ["NaN", "Infinity", "-Infinity"],
                  },
                },
              },
            ],
          },
          {
            kind: "null",
          },
        ],
      },
      value: {
        kind: "union",
        variants: [
          {
            kind: "union",
            variants: [
              {
                kind: "number",
              },
              {
                kind: "object",
                properties: {
                  nonfinite: {
                    kind: "string",
                    enum: ["NaN", "Infinity", "-Infinity"],
                  },
                },
              },
            ],
          },
          {
            kind: "null",
          },
        ],
      },
    },
  },
  neon_relperst_cache_stats: {
    kind: "object",
    properties: {
      metric_name: {
        kind: "union",
        variants: [
          {
            kind: "string",
          },
          {
            kind: "null",
          },
        ],
      },
      metric_value: {
        kind: "union",
        variants: [
          {
            kind: "bigint",
          },
          {
            kind: "null",
          },
        ],
      },
    },
  },
  neon_relsize_cache_stats: {
    kind: "object",
    properties: {
      metric_name: {
        kind: "union",
        variants: [
          {
            kind: "string",
          },
          {
            kind: "null",
          },
        ],
      },
      metric_value: {
        kind: "union",
        variants: [
          {
            kind: "bigint",
          },
          {
            kind: "null",
          },
        ],
      },
    },
  },
  neon_stat_file_cache: {
    kind: "object",
    properties: {
      file_cache_misses: {
        kind: "union",
        variants: [
          {
            kind: "bigint",
          },
          {
            kind: "null",
          },
        ],
      },
      file_cache_hits: {
        kind: "union",
        variants: [
          {
            kind: "bigint",
          },
          {
            kind: "null",
          },
        ],
      },
      file_cache_used: {
        kind: "union",
        variants: [
          {
            kind: "bigint",
          },
          {
            kind: "null",
          },
        ],
      },
      file_cache_writes: {
        kind: "union",
        variants: [
          {
            kind: "bigint",
          },
          {
            kind: "null",
          },
        ],
      },
      file_cache_hit_ratio: {
        kind: "union",
        variants: [
          {
            kind: "union",
            variants: [
              {
                kind: "string",
                pattern: "^[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?$",
              },
              {
                kind: "object",
                properties: {
                  nonfinite: {
                    kind: "string",
                    enum: ["NaN", "Infinity", "-Infinity"],
                  },
                },
              },
            ],
          },
          {
            kind: "null",
          },
        ],
      },
    },
  },
  neon_wait_event_snapshot: {
    kind: "object",
    properties: {
      wait_event_id: {
        kind: "union",
        variants: [
          {
            kind: "number",
            integer: true,
            minimum: -2147483648,
            maximum: 2147483647,
          },
          {
            kind: "null",
          },
        ],
      },
      wait_class_name: {
        kind: "union",
        variants: [
          {
            kind: "string",
          },
          {
            kind: "null",
          },
        ],
      },
      wait_event_name: {
        kind: "union",
        variants: [
          {
            kind: "string",
          },
          {
            kind: "null",
          },
        ],
      },
      count: {
        kind: "union",
        variants: [
          {
            kind: "bigint",
          },
          {
            kind: "null",
          },
        ],
      },
      time_us: {
        kind: "union",
        variants: [
          {
            kind: "bigint",
          },
          {
            kind: "null",
          },
        ],
      },
    },
  },
} as const;
