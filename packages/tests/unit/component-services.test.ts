import { expect, test } from "vite-plus/test";
import { Effect, Layer } from "effect";
import { createComponentServiceRegistry, createEffectRuntime } from "kello/server";

class VendorClient {
  constructor(readonly key: string) {}
  lookup(): string {
    return this.key;
  }
}

test("services coalesce acquisition and preserve the vendor object across invocations", async () => {
  const runtime = createEffectRuntime(Layer.empty);
  let acquired = 0;
  let released = 0;
  const client = new VendorClient("first");
  const registry = createComponentServiceRegistry(runtime, {
    first: () =>
      Effect.acquireRelease(
        Effect.sync(() => {
          acquired++;
          return client;
        }),
        () =>
          Effect.sync(() => {
            released++;
          }),
      ),
    second: async () => new VendorClient("second"),
  });
  await registry.run("allowed", async () => {
    const clients = await Promise.all([registry.get("first"), registry.get("first")]);
    expect(clients).toEqual([client, client]);
    expect(registry.ready("first")).toBe(client);
    expect(registry.ready("first").lookup()).toBe("first");
    expect((await registry.get("second")).lookup()).toBe("second");
  });
  await registry.run("allowed", async () => expect(await registry.get("first")).toBe(client));
  expect(acquired).toBe(1);
  expect(released).toBe(0);
  for (const policy of ["retryable", "live"] as const) {
    await registry.run(policy, async () => {
      await expect(registry.get("first")).rejects.toThrow("non-retryable");
      expect(() => registry.ready("first")).toThrow("non-retryable");
      await registry.run("allowed", async () => {
        await expect(registry.get("first")).rejects.toThrow("non-retryable");
      });
    });
  }
  await runtime.stop();
  expect(released).toBe(1);
});

test("failed Effect acquisition cleans partial resources and permits a fresh acquisition", async () => {
  const runtime = createEffectRuntime(Layer.empty);
  let attempts = 0;
  let released = 0;
  const registry = createComponentServiceRegistry(runtime, {
    sdk: () =>
      Effect.gen(function* () {
        attempts++;
        yield* Effect.acquireRelease(Effect.void, () =>
          Effect.sync(() => {
            released++;
          }),
        );
        if (attempts === 1) return yield* Effect.fail({ code: "unavailable" as const });
        return new VendorClient("recovered");
      }),
  });
  await registry.run("allowed", async () => {
    const failure = await Effect.runPromise(Effect.flip(registry.getEffect("sdk")));
    expect(failure).toEqual({ code: "unavailable" });
    expect(released).toBe(1);
    expect((await registry.get("sdk")).lookup()).toBe("recovered");
  });
  await runtime.stop();
  expect(attempts).toBe(2);
  expect(released).toBe(2);
});

test("initializers do not inherit caller identity and typed overrides bypass factories", async () => {
  const { AsyncLocalStorage } = await import("node:async_hooks");
  const identity = new AsyncLocalStorage<string>();
  const runtime = createEffectRuntime(Layer.empty);
  let observed: string | undefined = "unset";
  const override = new VendorClient("override");
  const registry = createComponentServiceRegistry(
    runtime,
    {
      sdk: async () => {
        observed = identity.getStore();
        return new VendorClient("shared");
      },
      replaced: async (): Promise<VendorClient> => {
        throw new Error("override must bypass factory");
      },
    },
    { replaced: override },
  );
  await identity.run("alice", () =>
    registry.run("allowed", async () => {
      expect((await registry.get("sdk")).lookup()).toBe("shared");
      expect(await registry.get("replaced")).toBe(override);
    }),
  );
  expect(observed).toBeUndefined();
  await runtime.stop();
});

test("generation shutdown drains active SDK users before releasing and new generation reacquires", async () => {
  let released = 0;
  const factory = () =>
    Effect.acquireRelease(Effect.succeed(new VendorClient("key")), () =>
      Effect.sync(() => {
        released++;
      }),
    );
  const runtime = createEffectRuntime(Layer.empty);
  const registry = createComponentServiceRegistry(runtime, { sdk: factory });
  let finish!: () => void;
  let started!: () => void;
  const ready = new Promise<void>((resolve) => {
    started = resolve;
  });
  const work = runtime.promise({ identity: null, requestId: "active" }, () =>
    registry.run("allowed", async () => {
      await registry.get("sdk");
      started();
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      expect(released).toBe(0);
    }),
  );
  const rejected = work.catch(() => undefined);
  await ready;
  const stopping = runtime.stop();
  expect(released).toBe(0);
  finish();
  await stopping;
  await rejected;
  expect(released).toBe(1);
  const nextRuntime = createEffectRuntime(Layer.empty);
  const next = createComponentServiceRegistry(nextRuntime, { sdk: factory });
  await next.run("allowed", () => next.get("sdk"));
  await nextRuntime.stop();
  expect(released).toBe(2);
});

test("Promise failures recover and retired generations reject cached service access", async () => {
  const runtime = createEffectRuntime(Layer.empty);
  let attempts = 0;
  const registry = createComponentServiceRegistry(runtime, {
    sdk: async () => {
      attempts++;
      if (attempts === 1) throw new Error("temporarily unavailable");
      return new VendorClient("ready");
    },
  });
  await registry.run("allowed", async () => {
    await expect(registry.get("sdk")).rejects.toThrow("temporarily unavailable");
    expect((await registry.get("sdk")).lookup()).toBe("ready");
  });
  await runtime.stop();
  expect(() => registry.ready("sdk")).toThrow("Runtime stopped");
  await expect(registry.get("sdk")).rejects.toThrow("Runtime stopped");
});

test("shutdown interrupts shared acquisition and releases partially acquired resources", async () => {
  const runtime = createEffectRuntime(Layer.empty);
  let released = 0;
  let acquired!: () => void;
  const started = new Promise<void>((resolve) => {
    acquired = resolve;
  });
  const registry = createComponentServiceRegistry(runtime, {
    sdk: () =>
      Effect.gen(function* () {
        yield* Effect.acquireRelease(Effect.void, () =>
          Effect.sync(() => {
            released++;
          }),
        );
        acquired();
        yield* Effect.never;
        return new VendorClient("never");
      }),
  });
  const waiting = registry.run("allowed", () => registry.get("sdk")).catch(() => undefined);
  await started;
  await runtime.stop();
  await waiting;
  expect(released).toBe(1);
});
