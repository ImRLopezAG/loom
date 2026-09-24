import { channel } from "node:diagnostics_channel";
import { randomUUID } from "node:crypto";
import * as v from "valibot";

/** Copied only into the disposable project. Read over the subscriptions' own RPC
 * peer, since a separate HTTP request can be routed to another Neon isolate. */
const instance = randomUUID();
const state = {
  subscriptions: 0,
  evaluating: 0,
  queued: 0,
  peakEvaluating: 0,
  peakQueued: 0,
  listener: "idle",
  reconnects: 0,
  pool: { total: 0, idle: 0, waiting: 0 },
};
const metricSchema = v.variant("type", [
  v.object({
    type: v.literal("realtime.coordinator"),
    subscriptions: v.number(),
    evaluating: v.number(),
    queued: v.number(),
  }),
  v.object({ type: v.literal("realtime.listener"), status: v.string() }),
  v.object({ type: v.literal("database.acquire"), total: v.number(), idle: v.number(), waiting: v.number() }),
]);
channel("loom.runtime.metric").subscribe((message) => {
  const parsed = v.safeParse(metricSchema, message);
  if (!parsed.success) return;
  const metric = parsed.output;
  if (metric.type === "realtime.coordinator") {
    state.subscriptions = metric.subscriptions;
    state.evaluating = metric.evaluating;
    state.queued = metric.queued;
    state.peakEvaluating = Math.max(state.peakEvaluating, metric.evaluating);
    state.peakQueued = Math.max(state.peakQueued, metric.queued);
  }
  if (metric.type === "realtime.listener") {
    state.listener = metric.status;
    if (metric.status === "connected") state.reconnects++;
  }
  if (metric.type === "database.acquire")
    state.pool = { total: metric.total, idle: metric.idle, waiting: metric.waiting };
});

export function readMetrics() {
  return { instance, ...state, heapUsed: process.memoryUsage().heapUsed };
}
