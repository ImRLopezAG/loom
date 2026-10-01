import { channel } from "node:diagnostics_channel";
import { randomUUID } from "node:crypto";
import * as v from "valibot";

/** Copied only into the disposable project. Read over the subscriptions' own RPC
 * peer, since a separate HTTP request can be routed to another Neon isolate. */
const instance = randomUUID();
const finiteDurationsMs: number[] = [];
const acquireDurationsMs: number[] = [];
const state = {
  subscriptions: 0,
  evaluating: 0,
  queued: 0,
  peakEvaluating: 0,
  peakQueued: 0,
  listener: "idle",
  reconnects: 0,
  pool: { total: 0, idle: 0, waiting: 0 },
  finiteDurationsMs,
  acquireDurationsMs,
};
const metricSchema = v.variant("type", [
  v.object({
    type: v.literal("realtime.coordinator"),
    subscriptions: v.number(),
    evaluating: v.number(),
    queued: v.number(),
  }),
  v.object({ type: v.literal("realtime.listener"), status: v.string() }),
  v.object({
    type: v.literal("database.acquire"),
    total: v.number(),
    idle: v.number(),
    waiting: v.number(),
    durationMs: v.number(),
  }),
  v.object({ type: v.literal("rpc.procedure"), mode: v.string(), durationMs: v.number() }),
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
  if (metric.type === "database.acquire") {
    state.pool = { total: metric.total, idle: metric.idle, waiting: metric.waiting };
    state.acquireDurationsMs.push(metric.durationMs);
    if (state.acquireDurationsMs.length > 64) state.acquireDurationsMs.shift();
  }
  if (metric.type === "rpc.procedure" && metric.mode === "finite") {
    state.finiteDurationsMs.push(metric.durationMs);
    if (state.finiteDurationsMs.length > 64) state.finiteDurationsMs.shift();
  }
});

export function readMetrics() {
  return { instance, ...state, heapUsed: process.memoryUsage().heapUsed };
}
