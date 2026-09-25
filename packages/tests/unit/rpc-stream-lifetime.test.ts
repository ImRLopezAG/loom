import { AsyncLocalStorage } from "node:async_hooks";
import { AsyncIteratorClass } from "@orpc/server";
import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import { createStreamLifetime } from "../../core/src/server/rpc/stream-lifetime";
import { rpcOutput } from "../../core/src/server/rpc/stream";

test("iterator work restores the application scope, including cancellation cleanup", async () => {
  const application = new AsyncLocalStorage<string>();
  const lifetime = createStreamLifetime();
  let cleanupScope: string | undefined;
  const source = (async function* () {
    try {
      yield application.getStore();
    } finally {
      cleanupScope = application.getStore();
    }
  })();
  const stream = await lifetime.own(v.parse(rpcOutput, source), new AbortController().signal, (work) =>
    application.run("application-a", work),
  );
  if (!(stream instanceof AsyncIteratorClass)) throw new Error("Expected native stream");
  expect(await application.run("application-b", () => stream.next())).toEqual({ done: false, value: "application-a" });
  await lifetime.stop();
  expect(cleanupScope).toBe("application-a");
  expect(await stream.next()).toEqual({ done: true, value: undefined });
});

test("shutdown drains cleanup for canceled pending reads and prevents late emissions", async () => {
  const lifetime = createStreamLifetime();
  const controller = new AbortController();
  const started = Promise.withResolvers<void>();
  const cleanupStarted = Promise.withResolvers<void>();
  const finishCleanup = Promise.withResolvers<void>();
  let cleaned = false;
  const source = (async function* () {
    try {
      started.resolve();
      await new Promise<void>((resolve) =>
        controller.signal.addEventListener("abort", () => resolve(), { once: true }),
      );
      yield "must not be delivered";
    } finally {
      cleanupStarted.resolve();
      await finishCleanup.promise;
      cleaned = true;
    }
  })();
  const stream = await lifetime.own(v.parse(rpcOutput, source), controller.signal, (work) => work());
  if (!(stream instanceof AsyncIteratorClass)) throw new Error("Expected native stream");
  const reading = stream.next();
  const rejected = expect(reading).rejects.toThrow();
  await started.promise;
  controller.abort();
  const stopping = lifetime.stop();
  await cleanupStarted.promise;
  expect(cleaned).toBe(false);
  finishCleanup.resolve();
  await stopping;
  await rejected;
  expect(cleaned).toBe(true);
});

test("streams arriving after shutdown are closed before rejection", async () => {
  const lifetime = createStreamLifetime();
  await lifetime.stop();
  let closed = false;
  const source = new AsyncIteratorClass(
    async () => ({ done: false, value: "unused" }),
    async () => {
      closed = true;
    },
  );
  await expect(
    lifetime.own(v.parse(rpcOutput, source), new AbortController().signal, (work) => work()),
  ).rejects.toThrow("stopped");
  expect(closed).toBe(true);
});
