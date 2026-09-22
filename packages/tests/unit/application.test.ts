import { expect, test } from "vite-plus/test";
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
