import { type SQL } from "drizzle-orm";
import { createNeon_1_25 } from "../../../apps/loom/src/core/extensions/adapters/neon";
import { textCodec, integerCodec } from "../../../apps/loom/src/core/extensions/codecs";
import type { NeonOperation } from "../../../apps/loom/src/tooling/extensions/operations/neon";

const api = createNeon_1_25({
  name: "neon",
  version: "1.25",
  schema: "extensions",
  apiSupport: { status: "verified", digest: "1f2d339beee9dcc3c93fdc0856fb9c307a04d5937a00ad7174014604be39a09e" },
});
const size: SQL<bigint> = api.pgClusterSize();
const waits: SQL<{
  wait_event_id: number | null;
  count: bigint | null;
  time_us: bigint | null;
  wait_class_name: string | null;
  wait_event_name: string | null;
}> = api.neonGetWaitEventStats();
const comparison: SQL<boolean> = api.neonDatumImageEqual(textCodec, "a", "b");
const numericComparison: SQL<boolean> = api.neonDatumImageEqual(integerCodec, 1n, 2n);
const pid = api.neonGetBackendWaitEventStatsRows("waits").columns.backend_pid;
const metric: SQL<string | null> = api.views.neon_perf_counters("perf").columns.metric;
void [size, waits, comparison, numericComparison, pid, metric];

function compileOnly(operator: NeonOperation) {
  // @ts-expect-error exact Neon 1.25 returns whole SQL NULL when no prewarm info exists.
  const nonnullPrewarmInfo: SQL<{
    total_pages: number | null;
    prewarmed_pages: number | null;
    skipped_pages: number | null;
    active_workers: number | null;
  }> = api.getPrewarmInfo();
  void nonnullPrewarmInfo;
  const approximate: Promise<number | null> = operator.approximateWorkingSetSize(false);
  const cancelBuffer: Promise<undefined> = operator.cancelBufferCachePrewarm();
  const cancelLocal: Promise<undefined> = operator.cancelPrewarm();
  const buffer: Promise<{ hex: string } | null> = operator.getBufferCacheStateSql();
  const progress: Promise<{
    total_pages: number | null;
    prewarmed_pages: number | null;
    skipped_pages: number | null;
    active_workers: number | null;
  }> = operator.getBuffercachePrewarmInfo();
  const clear: Promise<undefined> = operator.neonClearLfc();
  const emitted: Promise<string | null> = operator.neonEmitReverseEtlCommit({ hex: "" });
  const invalidated: Promise<boolean | null> = operator.neonInvalidateRelsizeCache(4294967295, 0);
  const hugePages: Promise<bigint | null> = operator.neonShmemHugePages("1 GB", "1 GB");
  const resized: Promise<
    {
      key: string | null;
      value: number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null;
      unit: string | null;
    }[]
  > = operator.pgResizeSharedBuffers("1 GB");
  const prewarmed: Promise<number | null> = operator.prewarmBufferCache({ hex: "" });
  const warmed: Promise<undefined | null> = operator.prewarmLocalCache({ hex: "" });
  const replaced: Promise<undefined> = operator.replaceHll({ hex: "" });
  const reset: Promise<boolean | null> = operator.resetPerfCounter("metric");
  void [
    approximate,
    cancelBuffer,
    cancelLocal,
    buffer,
    progress,
    clear,
    emitted,
    invalidated,
    hugePages,
    resized,
    prewarmed,
    warmed,
    replaced,
    reset,
  ];
  api.neonGetBackendWaitEventStats();
  api.neonGetBackendWaitEventStats(null);
  api.neonBackendWaitReport(123);
  api.neonBackendWaitReport(123, null);
  void operator.replaceHll({ hex: "" });
  void operator.neonInvalidateRelsizeCache(1);
  // @ts-expect-error STRICT native bytea input propagates SQL NULL into the LSN result.
  const nonnullLsn: Promise<string> = operator.neonEmitReverseEtlCommit(null);
  // @ts-expect-error STRICT native OID input propagates SQL NULL into the bool result.
  const nonnullInvalidation: Promise<boolean> = operator.neonInvalidateRelsizeCache(null);
  // @ts-expect-error STRICT native state propagates SQL NULL into the count result.
  const nonnullPrewarm: Promise<number> = operator.prewarmBufferCache(null);
  // @ts-expect-error STRICT native state propagates SQL NULL rather than native void.
  const nonnullVoid: Promise<undefined> = operator.prewarmLocalCache(null);
  // @ts-expect-error STRICT native name propagates SQL NULL into the bool result.
  const nonnullReset: Promise<boolean> = operator.resetPerfCounter(null);
  void [nonnullLsn, nonnullInvalidation, nonnullPrewarm, nonnullVoid, nonnullReset];
  // @ts-expect-error native binary transport accepts its canonical hex value, not Uint8Array.
  void operator.prewarmBufferCache(new Uint8Array());
  // @ts-expect-error provider callback is absent from ordinary operator tools.
  void operator.neonCheckForSuperuser();
  // @ts-expect-error bigint is not a text datum.
  api.neonDatumImageEqual(textCodec, "a", 1n);
  // @ts-expect-error non-default PID is mandatory.
  api.neonBackendWaitReport();
  // @ts-expect-error provider administration cannot be reached from RPC query bindings.
  void api.sql.functions.replace_hll;
  // @ts-expect-error snapshot callback is internal to provider execution.
  void api.sql.functions.__neon_internal_current_snapshot_with_subxids;
  // @ts-expect-error only the selected Neon version has this verified API.
  createNeon_1_25({ name: "neon", version: "1.6", schema: "extensions", apiSupport: { status: "unverified" } });
}
void compileOnly;
