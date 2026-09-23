import { expect, test, vi } from "vite-plus/test";
import { createNeonTriggers } from "@loom/core/neon";

function request(overrides: { header?: string; triggerId?: string; name?: string; scheduledAt?: string } = {}) {
  return new Request("https://api.example.test/api/loom/triggers", {
    method: "POST",
    headers: { "content-type": "application/json", "x-neon-trigger-invocation-id": overrides.header ?? "delivery-one" },
    body: JSON.stringify({
      version: 1,
      invocation_id: "delivery-one",
      trigger: { type: "schedule", id: overrides.triggerId ?? "trigger-cron", name: overrides.name ?? "daily" },
      data: { scheduled_at: overrides.scheduledAt ?? "2026-01-01T00:00:00Z" },
    }),
  });
}
function fixture() {
  const dispatch = vi.fn(async () => "job-one");
  const run = vi.fn(async () => ({ claimed: 1, completed: 1, failed: 0, leaseLost: 0 }));
  const recordWake = vi.fn(async () => {});
  const app = createNeonTriggers({
    bindings: {
      "trigger-cron": { kind: "cron", name: "daily", cron: "reports" },
      "trigger-wake": { kind: "wake", name: "worker" },
    },
    crons: { dispatch, recordWake },
    worker: { run },
  });
  return { app, dispatch, run, recordWake };
}

test("worker wakeups reconcile receipts and still drain retired-version jobs", async () => {
  const order: string[] = [];
  const reconcile = vi.fn(async () => {
    order.push("reconcile");
    return { claimed: 0, dispatched: 0, failed: 0, pending: 0, inactive: true };
  });
  const app = createNeonTriggers({
    bindings: { "trigger-wake": { kind: "wake", name: "worker" } },
    crons: {
      dispatch: async () => "unused",
      recordWake: async () => {
        order.push("wake");
      },
    },
    storage: { receive: async () => ({ state: "failed" }), reconcile },
    worker: {
      run: async () => {
        order.push("run");
        return { claimed: 1, completed: 1, failed: 0, leaseLost: 0 };
      },
    },
  });
  const response = await app.fetch(request({ triggerId: "trigger-wake", name: "worker" }));
  expect(response.status).toBe(200);
  expect(order).toEqual(["wake", "run", "reconcile"]);
  expect(reconcile).toHaveBeenCalledWith(25, expect.any(AbortSignal));
});

test("Neon trigger parsing binds configured occurrences and wakes the worker after persistence", async () => {
  const { app, dispatch, run, recordWake } = fixture();
  const response = await app.fetch(request());
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(dispatch).toHaveBeenCalledWith("reports", new Date("2026-01-01T00:00:00Z"), expect.any(AbortSignal), {
    invocationId: "delivery-one",
    triggerId: "trigger-cron",
    triggerName: "daily",
  });
  expect(run).toHaveBeenCalledOnce();
  expect((await app.fetch(request({ triggerId: "trigger-wake", name: "worker" }))).status).toBe(200);
  expect(dispatch).toHaveBeenCalledOnce();
  expect(run).toHaveBeenCalledTimes(2);
  expect(recordWake).toHaveBeenCalledWith(
    { invocationId: "delivery-one", triggerId: "trigger-wake", triggerName: "worker" },
    new Date("2026-01-01T00:00:00Z"),
    expect.any(AbortSignal),
  );
});

test("Neon trigger boundary refuses untrusted, unbound and malformed delivery without side effects", async () => {
  const { app, dispatch, run } = fixture();
  for (const overrides of [
    { header: "" },
    { header: "mismatch" },
    { triggerId: "unknown" },
    { name: "wrong" },
    { scheduledAt: "invalid" },
  ])
    expect((await app.fetch(request(overrides))).status).toBeGreaterThanOrEqual(400);
  const oversized = new Request(request(), { method: "POST", body: " ".repeat(65537) });
  expect((await app.fetch(oversized)).status).toBe(413);
  expect((await app.fetch(new Request("https://api.example.test/api/loom/triggers"))).status).toBe(405);
  expect(
    (
      await app.fetch(
        new Request(request(), {
          method: "POST",
          headers: { "x-neon-trigger-invocation-id": "delivery-one", "content-type": "text/plain" },
        }),
      )
    ).status,
  ).toBe(415);
  expect((await app.fetch(new Request(request(), { method: "POST", body: new Uint8Array([0xff]) }))).status).toBe(400);
  expect((await app.fetch(new Request(request(), { method: "POST", body: "{" }))).status).toBe(400);
  expect(dispatch).not.toHaveBeenCalled();
  expect(run).not.toHaveBeenCalled();
});

test("Neon trigger failures return fixed diagnostics and do not wake after failed persistence", async () => {
  const { app, dispatch, run } = fixture();
  dispatch.mockRejectedValueOnce(new Error("database secret"));
  const response = await app.fetch(request());
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("secret");
  expect(run).not.toHaveBeenCalled();
});

test("trigger body reads cancel promptly when the request aborts", async () => {
  const { app, dispatch, run } = fixture();
  const controller = new AbortController();
  const started = Promise.withResolvers<void>();
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull() {
      started.resolve();
    },
    cancel() {
      cancelled = true;
    },
  });
  const pending = app.fetch(
    new Request(request(), { method: "POST", body: stream, duplex: "half", signal: controller.signal }),
  );
  await started.promise;
  controller.abort();
  expect((await pending).status).toBe(499);
  expect(cancelled).toBe(true);
  expect(dispatch).not.toHaveBeenCalled();
  expect(run).not.toHaveBeenCalled();
});

test("storage triggers persist only bound provider events and leave handler execution to the durable worker", async () => {
  const receive = vi.fn(async () => ({ state: "dispatched" as const, jobId: "job-one" }));
  const run = vi.fn(async () => ({ claimed: 0, completed: 0, failed: 0, leaseLost: 0 }));
  const dispatch = vi.fn(async () => "job-one");
  const app = createNeonTriggers({
    bindings: { "trigger-storage": { kind: "storage", name: "uploads", bucket: "uploads" } },
    crons: { dispatch, recordWake: async () => {} },
    worker: { run },
    storage: { receive },
  });
  function delivery(bucket = "uploads", header = "delivery-upload") {
    return new Request("https://api.example.test/api/loom/triggers", {
      method: "POST",
      headers: { "content-type": "application/json", "x-neon-trigger-invocation-id": header },
      body: JSON.stringify({
        version: 1,
        invocation_id: "delivery-upload",
        trigger: { type: "storage_object_created", id: "trigger-storage", name: "uploads" },
        data: { bucket_name: bucket, object_key: "bound-object-key" },
      }),
    });
  }
  expect((await app.fetch(delivery())).status).toBe(202);
  expect(receive).toHaveBeenCalledWith(
    {
      invocationId: "delivery-upload",
      triggerId: "trigger-storage",
      triggerName: "uploads",
      bucket: "uploads",
      key: "bound-object-key",
    },
    expect.any(AbortSignal),
  );
  expect((await app.fetch(delivery("other"))).status).toBe(403);
  expect((await app.fetch(delivery("uploads", ""))).status).toBe(403);
  expect(receive).toHaveBeenCalledOnce();
  expect(run).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled();
});
