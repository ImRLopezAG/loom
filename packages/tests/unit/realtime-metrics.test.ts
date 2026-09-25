import assert from "node:assert/strict";
import { channel } from "node:diagnostics_channel";
import { test } from "vite-plus/test";
import { createRevisionCoordinator } from "@loom/core/server";
import type { RuntimeMetric } from "@loom/core/server";
import * as v from "valibot";

test("blocked evaluations report bounded work and shutdown returns counters to zero", async () => {
  const metrics: RuntimeMetric[] = [];
  const metricSchema = v.object({
    type: v.literal("realtime.coordinator"),
    subscriptions: v.number(),
    evaluating: v.number(),
    queued: v.number(),
  });
  const collect: Parameters<ReturnType<typeof channel>["subscribe"]>[0] = (message) => {
    const parsed = v.safeParse(metricSchema, message);
    if (parsed.success) metrics.push(parsed.output);
  };
  const source = channel("loom.runtime.metric");
  source.subscribe(collect);
  const coordinator = createRevisionCoordinator({ readRevisions: async () => ({ tasks: "1" }), concurrency: 2 });
  let started = 0;
  const blocked = Promise.withResolvers<void>();
  try {
    for (let index = 0; index < 5; index++) {
      coordinator.subscribe(
        { expiresAt: Math.floor(Date.now() / 1000) + 60 },
        {
          evaluate: async (signal) => {
            if (++started === 2) blocked.resolve();
            await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve(), { once: true }));
            return { value: 0, revisions: { tasks: "1" } };
          },
          publish: () => true,
          close: () => {},
        },
      );
    }
    const cycle = coordinator.poll();
    await blocked.promise;
    const active = metrics.filter((metric) => metric.type === "realtime.coordinator");
    assert.deepEqual(active.at(-1), { type: "realtime.coordinator", subscriptions: 5, evaluating: 2, queued: 3 });
    await coordinator.stop();
    await cycle;
    const all = metrics.filter((metric) => metric.type === "realtime.coordinator");
    assert(all.every((metric) => metric.evaluating <= 2 && metric.queued >= 0 && metric.queued <= 5));
    assert.equal(started, 2, "Queued work must not run after stop");
    assert.deepEqual(all.at(-1), { type: "realtime.coordinator", subscriptions: 0, evaluating: 0, queued: 0 });
  } finally {
    await coordinator.stop();
    source.unsubscribe(collect);
  }
});
