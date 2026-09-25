import * as v from "valibot";

export const readoutSchema = v.object({
  instance: v.string(),
  subscriptions: v.number(),
  evaluating: v.number(),
  queued: v.number(),
  peakEvaluating: v.number(),
  peakQueued: v.number(),
  listener: v.string(),
  reconnects: v.number(),
  heapUsed: v.number(),
  pool: v.object({ total: v.number(), idle: v.number(), waiting: v.number() }),
  finiteDurationsMs: v.array(v.number()),
  acquireDurationsMs: v.array(v.number()),
});
