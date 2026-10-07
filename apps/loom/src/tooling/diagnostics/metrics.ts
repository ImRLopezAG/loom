import { randomUUID } from "node:crypto";
import { Context, Metric, Schema } from "effect";
import type { MetricsData } from "effect/observability/OtlpMetrics";
import packageJson from "../../../package.json" with { type: "json" };
import type { DiagnosticsRuntimeEvent } from "./types";

const boundaries = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000, 30000, 60000];
const tuples = [
  ["finite", "success"],
  ["finite", "error"],
  ["live", "success"],
  ["live", "error"],
  ["mutation", "success"],
  ["mutation", "error"],
] as const;
type MetricData = MetricsData["resourceMetrics"][number]["scopeMetrics"][number]["metrics"][number];
const nanoseconds = () => (BigInt(Date.now()) * 1_000_000n).toString();
const isNumber = Schema.is(Schema.Number);

/** Internal cumulative RPC slice; session integration and serialization are separate. */
export function createDiagnosticsMetrics() {
  const context = Context.make(Metric.MetricRegistry, new Map());
  const startTimeUnixNano = nanoseconds();
  const instanceId = randomUUID();
  const series = tuples.map(([mode, status]) => ({
    mode,
    status,
    counter: Metric.counter("kello.rpc.procedure.count", { incremental: true, attributes: { mode, status } }),
    histogram: Metric.histogram("kello.rpc.procedure.duration", {
      boundaries: Metric.boundariesFromIterable(boundaries), attributes: { mode, status },
    }),
  }));

  return {
    observe(event: DiagnosticsRuntimeEvent): boolean {
      if (event.type !== "rpc.procedure") return true;
      if (!Number.isFinite(event.durationMs) || event.durationMs < 0) return false;
      const tuple = series.find(({ mode, status }) => mode === event.mode && status === event.status);
      if (!tuple) return false;
      const counter = tuple.counter.valueUnsafe(context);
      const histogram = tuple.histogram.valueUnsafe(context);
      if (!Number.isSafeInteger(counter.count + 1) || !Number.isSafeInteger(histogram.count + 1) ||
        !Number.isFinite(histogram.sum + event.durationMs)) return false;
      // Effect 4 stores individual buckets in Uint32Array; prevent wrap before updating either instrument.
      let previous = 0;
      for (const [boundary, cumulative] of histogram.buckets) {
        if (event.durationMs <= boundary) {
          if (cumulative - previous >= 0xffff_ffff) return false;
          break;
        }
        previous = cumulative;
      }
      tuple.counter.updateUnsafe(1, context);
      tuple.histogram.updateUnsafe(event.durationMs, context);
      return true;
    },
    snapshot(): MetricsData {
      const timeUnixNano = nanoseconds();
      const metrics: MetricData[] = [];
      for (const metric of Metric.snapshotUnsafe(context)) {
        const attributes = Object.entries(metric.attributes ?? {}).map(([key, value]) => ({
          key,
          value: { stringValue: String(value) },
        }));
        const timestamp = { startTimeUnixNano, timeUnixNano, attributes };
        let instrument = metrics.find(({ name }) => name === metric.id);
        if (metric.type === "Counter") {
          if (!isNumber(metric.state.count)) throw new Error("DIAGNOSTICS_METRIC_UNSUPPORTED");
          if (!instrument) {
            instrument = { name: metric.id, unit: "{event}", sum: {
              aggregationTemporality: 2, isMonotonic: true, dataPoints: [],
            } };
            metrics.push(instrument);
          }
          instrument.sum!.dataPoints.push({ ...timestamp, asDouble: metric.state.count });
        } else if (metric.type === "Histogram") {
          if (!instrument) {
            instrument = { name: metric.id, unit: "ms", histogram: { aggregationTemporality: 2, dataPoints: [] } };
            metrics.push(instrument);
          }
          let previous = 0;
          const bucketCounts = metric.state.buckets.map(([, cumulative]) => {
            const count = cumulative - previous;
            previous = cumulative;
            return count;
          });
          instrument.histogram!.dataPoints.push({
            ...timestamp, count: metric.state.count, sum: metric.state.sum,
            explicitBounds: metric.state.buckets.slice(0, -1).map(([boundary]) => boundary), bucketCounts,
          });
        } else {
          throw new Error("DIAGNOSTICS_METRIC_UNSUPPORTED");
        }
      }
      return { resourceMetrics: [{
        resource: { droppedAttributesCount: 0, attributes: [
          { key: "service.name", value: { stringValue: "kello-dev" } },
          { key: "service.version", value: { stringValue: packageJson.version } },
          { key: "deployment.environment.name", value: { stringValue: "development" } },
          { key: "service.instance.id", value: { stringValue: instanceId } },
        ] },
        scopeMetrics: [{ scope: { name: "kello.diagnostics" }, metrics }],
      }] };
    },
  };
}
