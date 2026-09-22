import { expect, test, vi } from "vite-plus/test";
import { createSubscriptionPoller } from "@loom/core/server";
import { createNeonApplication } from "@loom/core/neon";

test("application shutdown aborts and drains HTTP calls and refuses new work", async () => {
  const started = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  let aborted = false;
  const app = createNeonApplication({
    origins: [],
    allowAnonymous: true,
    verify: async () => {
      throw new Error("Anonymous test");
    },
    dispatcher: {
      public: async (_call, _identity, signal) => {
        signal?.addEventListener(
          "abort",
          () => {
            aborted = true;
          },
          { once: true },
        );
        started.resolve();
        await release.promise;
        return { ok: true, requestId: "test", value: null };
      },
    },
  });
  const request = new Request("https://api.example.test/api/loom/call", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ protocol: 1, name: "tasks:read", version: "a".repeat(64), kind: "query", args: null }),
  });
  const pending = app.fetch(request);
  await started.promise;
  let drained = false;
  const stopping = app.stop().then(() => {
    drained = true;
  });
  expect(aborted).toBe(true);
  expect((await app.fetch(new Request("https://api.example.test/api/loom/call"))).status).toBe(503);
  await Promise.resolve();
  expect(drained).toBe(false);
  release.resolve();
  await pending;
  await stopping;
  expect(drained).toBe(true);
  await app.stop();
});

test("application routes native socket refusals and stops its generation poller", async () => {
  const closed: string[] = [];
  const poller = createSubscriptionPoller({
    readRevisions: async () => ({ tasks: "1" }),
    evaluate: async () => ({ ok: true, requestId: "test", value: null, revisions: { tasks: "1" } }),
  });
  poller.subscribe(
    { name: "tasks:read", version: "a".repeat(64), kind: "query", args: null },
    { identity: { issuer: "test", subject: "alice" }, expiresAt: Math.floor(Date.now() / 1000) + 60 },
    { publish: () => true, close: (reason) => closed.push(reason) },
  );
  const app = createNeonApplication({
    origins: ["https://app.example.test"],
    verify: async () => {
      throw new Error("Not used");
    },
    dispatcher: {
      public: async () => {
        throw new Error("Socket requests must not dispatch HTTP calls");
      },
    },
    realtime: {
      poller,
      tickets: {
        redeem: async () => {
          throw new Error("Not used");
        },
      },
    },
  });
  expect((await app.fetch(new Request("https://api.example.test/api/loom/socket"))).status).toBe(426);
  await app.stop();
  expect(closed).toEqual(["STOPPED"]);
  expect(app.stop()).toBe(app.stop());
});

test("application routes triggers and stops its worker before draining requests", async () => {
  const release = Promise.withResolvers<void>();
  let started = false;
  let stopped = false;
  const app = createNeonApplication({
    origins: [],
    verify: async () => {
      throw new Error("Not used");
    },
    dispatcher: {
      public: async () => {
        throw new Error("Not used");
      },
    },
    triggers: {
      bindings: { "trigger-wake": { kind: "wake", name: "worker" } },
      crons: {
        dispatch: async () => {
          throw new Error("Not used");
        },
      },
      worker: {
        run: async () => {
          started = true;
          await release.promise;
          return { claimed: 0, completed: 0, failed: 0, leaseLost: 0 };
        },
        stop: async () => {
          stopped = true;
          await release.promise;
        },
      },
    },
  });
  const pending = app.fetch(
    new Request("https://api.example.test/api/loom/triggers", {
      method: "POST",
      headers: { "content-type": "application/json", "x-neon-trigger-invocation-id": "wake-one" },
      body: JSON.stringify({
        version: 1,
        invocation_id: "wake-one",
        trigger: { type: "schedule", id: "trigger-wake", name: "worker" },
        data: { scheduled_at: "2026-01-01T00:00:00Z" },
      }),
    }),
  );
  await vi.waitFor(() => expect(started).toBe(true));
  const stopping = app.stop();
  expect(stopped).toBe(true);
  expect(stopping).toBe(app.stop());
  let drained = false;
  void stopping.then(() => {
    drained = true;
  });
  await Promise.resolve();
  expect(drained).toBe(false);
  release.resolve();
  expect((await pending).status).toBe(200);
  await stopping;
  expect(drained).toBe(true);
});
