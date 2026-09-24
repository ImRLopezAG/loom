import { test, expect } from "vite-plus/test";
import { Context, Effect, Layer } from "effect";
import { createEffectRuntime, Invocation } from "@loom/core/server";

const request = (subject: string) => ({ identity: { issuer: "test", subject }, requestId: subject });

test("Effect invocation scopes isolate identities and finalize on interruption", async () => {
  const runtime = createEffectRuntime(Layer.empty);
  const observed = await Promise.all(
    ["alice", "bob"].map((name) =>
      runtime.run(
        request(name),
        Effect.gen(function* () {
          yield* Effect.sleep(1);
          return (yield* Invocation).identity?.subject;
        }),
      ),
    ),
  );
  expect(observed).toEqual(["alice", "bob"]);
  let finalized = false;
  let acquired!: () => void;
  const ready = new Promise<void>((resolve) => {
    acquired = resolve;
  });
  const active = runtime.run(
    request("alice"),
    Effect.gen(function* () {
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          finalized = true;
        }),
      );
      acquired();
      yield* Effect.never;
    }),
  );
  const failed = active.then(
    () => false,
    () => true,
  );
  await ready;
  await runtime.stop();
  expect(await failed).toBe(true);
  expect(finalized).toBe(true);
  await expect(runtime.run(request("alice"), Effect.succeed(1))).rejects.toThrow("Runtime stopped");
});

test("Promise work drains before shutdown releases shared resources", async () => {
  let released = false;
  const Resource = Context.Service<{ readonly acquired: true }>("test/Resource");
  const layer = Layer.effect(
    Resource,
    Effect.acquireRelease(Effect.succeed({ acquired: true as const }), () =>
      Effect.sync(() => {
        released = true;
      }),
    ),
  );
  const runtime = createEffectRuntime(layer);
  let finish!: () => void;
  let started!: () => void;
  const ready = new Promise<void>((resolve) => {
    started = resolve;
  });
  const work = runtime.promise(request("alice"), async (context) => {
    expect(context.identity?.subject).toBe("alice");
    started();
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
    return 1;
  });
  const failed = work.then(
    () => false,
    () => true,
  );
  await ready;
  let stopped = false;
  const stopping = runtime.stop().then(() => {
    stopped = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(stopped).toBe(false);
  expect(released).toBe(false);
  finish();
  await stopping;
  expect(released).toBe(true);
  expect(await failed).toBe(true);
});

test("pre-aborted requests do not start work and failures release shared services", async () => {
  const runtime = createEffectRuntime(Layer.empty);
  let calls = 0;
  await expect(
    runtime.promise(
      request("alice"),
      async () => {
        calls++;
      },
      AbortSignal.abort(),
    ),
  ).rejects.toBeDefined();
  expect(calls).toBe(0);
  await expect(
    runtime.promise(request("alice"), async () => {
      throw new Error("operation failed");
    }),
  ).rejects.toThrow("operation failed");
  const stopping = runtime.stop();
  expect(runtime.stop()).toBe(stopping);
  await stopping;
});
