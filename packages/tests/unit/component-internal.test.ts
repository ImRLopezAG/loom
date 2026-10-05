import { expect, test } from "vite-plus/test";
import { os, ORPCError } from "@orpc/server";
import { Context } from "effect";
import * as v from "valibot";
import { createComponentCallRegistry, Invocation } from "kello/server";
import type { ProcedureContext } from "kello/server";

function context(requestId = "request"): ProcedureContext {
  const invocation = { requestId, identity: null, signal: new AbortController().signal };
  return { ...invocation, "effect/context": Context.make(Invocation, invocation) };
}
const procedure = os.$context<ProcedureContext>().input(v.string()).output(v.string());

test("scoped callers use native validation and preserve invocation identity", async () => {
  const registry = createComponentCallRegistry([
    {
      name: "app",
      internal: { own: procedure.handler(({ input }) => input) },
      exported: {},
      dependencies: { identity: "identity" },
    },
    {
      name: "identity",
      internal: { secret: procedure.handler(() => "private") },
      exported: { get: procedure.handler(({ input, context }) => `${context.requestId}:${input}`) },
      dependencies: {},
    },
  ]);
  expect(
    await registry.run("app", context(), async ({ internal, components }) => {
      // @ts-expect-error Private functions are not exported to the parent.
      expect(components.identity.rpc.secret).toBeUndefined();
      expect(await internal.own("local")).toBe("local");
      return components.identity.rpc.get("value");
    }),
  ).toBe("request:value");
  await expect(
    registry.run("app", context(), async ({ internal }) => {
      // @ts-expect-error Native input types remain enforced.
      return internal.own(1);
    }),
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
});

test("retained callers cannot run after their invocation or in a concurrent invocation", async () => {
  const registry = createComponentCallRegistry([
    { name: "app", internal: { get: procedure.handler(({ input }) => input) }, exported: {}, dependencies: {} },
  ]);
  const retained = await registry.run("app", context(), async ({ internal }) => {
    await registry.run("app", context("concurrent"), async () => {
      await expect(internal.get("foreign")).rejects.toThrow("inactive");
    });
    expect(await internal.get("owner")).toBe("owner");
    return internal.get;
  });
  await expect(retained("later")).rejects.toThrow("inactive");
  await registry.run("app", context("other"), async () => {
    await expect(retained("other")).rejects.toThrow("inactive");
  });
});

test("native output checks and declared errors survive internal dispatch", async () => {
  const registry = createComponentCallRegistry([
    {
      name: "app",
      internal: {
        // @ts-expect-error Exercise output validation against malformed JS behavior.
        broken: procedure.handler(() => {
          return 1;
        }),
        denied: procedure.errors({ FORBIDDEN: {} }).handler(() => {
          throw new ORPCError("FORBIDDEN");
        }),
      },
      exported: {},
      dependencies: {},
    },
  ]);
  await registry.run("app", context(), async ({ internal }) => {
    await expect(internal.broken("input")).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    await expect(internal.denied("input")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

test("internal Effect handlers receive the caller context and cancellation is enforced", async () => {
  const registry = createComponentCallRegistry([
    {
      name: "app",
      internal: {
        effect: procedure.effect(function* () {
          return (yield* Invocation).requestId;
        }),
      },
      exported: {},
      dependencies: {},
    },
  ]);
  expect(await registry.run("app", context("effect"), async ({ internal }) => internal.effect("value"))).toBe("effect");
  const controller = new AbortController();
  await registry.run("app", { ...context(), signal: controller.signal }, async ({ internal }) => {
    controller.abort(new Error("cancelled"));
    await expect(internal.effect("value")).rejects.toThrow("cancelled");
  });
});

test("caller registries reject invalid scope graphs and snapshot their visibility", async () => {
  const route = procedure.handler(({ input }) => input);
  const exported = { get: route };
  const registry = createComponentCallRegistry([
    { name: "app", internal: {}, exported: {}, dependencies: { child: "child" } },
    { name: "child", internal: { private: route }, exported, dependencies: {} },
  ]);
  Object.assign(exported, { private: route });
  await registry.run("app", context(), async ({ components }) => {
    expect(await components.child.rpc.get("value")).toBe("value");
    // @ts-expect-error Private functions are absent from parent capability types.
    expect(components.child.rpc.private).toBeUndefined();
    // @ts-expect-error Only explicitly bound dependencies are available.
    void components.sibling;
  });
  expect(() =>
    createComponentCallRegistry([{ name: "app", internal: {}, exported: {}, dependencies: { missing: "missing" } }]),
  ).toThrow("dependency");
  expect(() =>
    createComponentCallRegistry([
      { name: "app", internal: {}, exported: {}, dependencies: {} },
      { name: "app", internal: {}, exported: {}, dependencies: {} },
    ]),
  ).toThrow("Duplicate");
});
