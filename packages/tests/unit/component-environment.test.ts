import { expect, test } from "vite-plus/test";
import { z } from "zod";
import * as v from "valibot";
import {
  defineApplication,
  defineComponent,
  prepareApplicationEnvironment,
  readComponentEnvironment,
  readComponentOptions,
  readApplicationEnvironment,
} from "loom/server";

test("typed bindings resolve per mount and runtime context stays isolated", async () => {
  const app = defineApplication({ env: { CUSTOMER: z.string(), STAFF: z.string() }, rpc: ({ os }) => ({ os }) });
  const sdk = defineComponent({ name: "identity", env: { KEY: z.string() } });
  app.use(sdk, { env: { KEY: app.env.CUSTOMER } });
  app.use(sdk, { name: "staff", env: { KEY: app.env.STAFF } });
  expect(() => readApplicationEnvironment(app)).toThrow(/unavailable/);
  expect(() => readComponentEnvironment(sdk)).toThrow(/unavailable/);
  const runtime = await prepareApplicationEnvironment(app, {
    CUSTOMER: "customer-key",
    STAFF: "staff-key",
    EXTRA: "hidden",
  });
  const results = await Promise.all(
    ["identity", "staff"].map((path) =>
      runtime.runComponent(path, async () => {
        await Promise.resolve();
        return readComponentEnvironment(sdk);
      }),
    ),
  );
  expect(results).toEqual([{ KEY: "customer-key" }, { KEY: "staff-key" }]);
  expect(runtime.run(() => readApplicationEnvironment(app))).toEqual({ CUSTOMER: "customer-key", STAFF: "staff-key" });
  expect(JSON.stringify(app.env)).not.toContain("customer-key");
});

test("component validation rechecks bindings, awaits schemas, and applies declared defaults", async () => {
  const app = defineApplication({ env: { KEY: z.string() }, rpc: ({ os }) => ({ os }) });
  const child = defineComponent({
    name: "child",
    env: {
      KEY: z
        .string()
        .min(8)
        .transform(async (key) => key.toUpperCase()),
      DEFAULT: v.optional(v.string(), "default"),
    },
    options: z.object({ retries: z.number().default(2) }).default({ retries: 2 }),
  });
  app.use(child, { env: { KEY: app.env.KEY } });
  await expect(prepareApplicationEnvironment(app, { KEY: "short" })).rejects.toThrow(
    "Invalid component environment variable: child.KEY",
  );
  const runtime = await prepareApplicationEnvironment(app, { KEY: "long-key" });
  expect(runtime.runComponent("child", () => readComponentEnvironment(child))).toEqual({
    KEY: "LONG-KEY",
    DEFAULT: "default",
  });
  expect(runtime.runComponent("child", () => readComponentOptions(child))).toEqual({ retries: 2 });
});

test("bindings cannot use undeclared keys, structural references, or another parent's references", () => {
  const app = defineApplication({ env: { KEY: z.string() }, rpc: ({ os }) => ({ os }) });
  const foreign = defineApplication({ env: { KEY: z.string() }, rpc: ({ os }) => ({ os }) });
  const child = defineComponent({ name: "child", env: { KEY: z.string() } });
  expect(() => app.use(child, { env: { KEY: foreign.env.KEY } })).toThrow(/reference/);
  // @ts-expect-error Undeclared child variables cannot be bound.
  expect(() => app.use(child, { env: { OTHER: app.env.KEY } })).toThrow(/variable/);
  // @ts-expect-error References are opaque.
  expect(() => app.use(child, { env: { KEY: { key: "KEY" } } })).toThrow(/reference/);
});

test("unused definitions do not validate, and errors never retain secret validator details", async () => {
  defineComponent({ name: "unused", env: { MISSING: z.string() } });
  const app = defineApplication({ rpc: ({ os }) => ({ os }) });
  const child = defineComponent({
    name: "child",
    env: {
      KEY: z.string().transform(() => {
        throw new Error("private-key");
      }),
    },
  });
  app.use(child);
  const error = await prepareApplicationEnvironment(app, { KEY: "private-key" }).catch((cause: unknown) => cause);
  expect(String(error)).toBe("Error: Invalid component environment variable: child.KEY");
  expect(error).not.toHaveProperty("cause");
  await expect(
    prepareApplicationEnvironment(defineApplication({ rpc: ({ os }) => ({ os }) }), {}),
  ).resolves.toBeDefined();
});

test("nested bindings use their own parent and cannot read another scope", async () => {
  const app = defineApplication({ env: { ROOT: z.string() }, rpc: ({ os }) => ({ os }) });
  const parent = defineComponent({ name: "parent", env: { KEY: z.string() } });
  const child = defineComponent({ name: "child", env: { KEY: z.string() } });
  parent.use(child, { env: { KEY: parent.env.KEY } });
  app.use(parent, { env: { KEY: app.env.ROOT } });
  const runtime = await prepareApplicationEnvironment(app, { ROOT: "bound", KEY: "wrong" });
  expect(runtime.runComponent("parent/child", () => readComponentEnvironment(child).KEY)).toBe("bound");
  expect(() => runtime.runComponent("parent", () => readComponentEnvironment(child))).toThrow(/unavailable/);
  expect(() => runtime.run(() => runtime.runComponent("parent", () => readApplicationEnvironment(app)))).toThrow(
    /unavailable/,
  );
  expect(() => runtime.runComponent("missing", () => undefined)).toThrow(/Unknown component/);
});

test("component options reject invalid JavaScript values without exposing their content", async () => {
  const app = defineApplication({ rpc: ({ os }) => ({ os }) });
  const child = defineComponent({ name: "child", options: z.object({ retries: z.number() }) });
  // @ts-expect-error Exercise the runtime boundary for non-TypeScript consumers.
  app.use(child, { options: { retries: "private-option" } });
  const error = await prepareApplicationEnvironment(app, {}).catch((cause: unknown) => cause);
  expect(String(error)).toBe("Error: Invalid component options: child");
  expect(error).not.toHaveProperty("cause");
});
