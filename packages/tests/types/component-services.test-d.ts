import { expectTypeOf, test } from "vite-plus/test";
import { Effect, Layer } from "effect";
import { createComponentServiceRegistry, createEffectRuntime } from "kello/server";
import type { ComponentServiceAccessError } from "kello/server";

class Vendor {
  lookup(id: string): string;
  lookup(id: number): number;
  lookup(id: string | number) {
    return id;
  }
}

test("component services retain SDK overloads, Effect errors, and typed overrides", () => {
  const runtime = createEffectRuntime(Layer.empty);
  const factories = { sdk: (): Effect.Effect<Vendor, { readonly code: "vendor" }> => Effect.succeed(new Vendor()) };
  const registry = createComponentServiceRegistry(runtime, factories, { sdk: new Vendor() });
  expectTypeOf(registry.get("sdk")).toEqualTypeOf<Promise<Vendor>>();
  expectTypeOf(registry.getEffect("sdk")).toEqualTypeOf<
    Effect.Effect<Vendor, { readonly code: "vendor" } | ComponentServiceAccessError>
  >();
  const sdk = registry.ready("sdk");
  expectTypeOf(sdk.lookup("id")).toEqualTypeOf<string>();
  expectTypeOf(sdk.lookup(1)).toEqualTypeOf<number>();
  // @ts-expect-error replacement must retain the vendor methods
  createComponentServiceRegistry(runtime, factories, { sdk: {} });
  // @ts-expect-error undeclared services cannot be acquired
  void registry.get("other");
});

import { defineComponent } from "kello";
import type { ComponentServices } from "kello/server";

const synchronous = defineComponent({ name: "sync", services: () => ({ sdk: new Vendor() }) });
const asynchronous = defineComponent({ name: "async", services: async () => ({ sdk: new Vendor() }) });
const effectful = defineComponent({ name: "effect", services: () => Effect.succeed({ sdk: new Vendor() }) });
const empty = defineComponent({ name: "empty" });
expectTypeOf<ComponentServices<typeof synchronous>["sdk"]>().toEqualTypeOf<Vendor>();
expectTypeOf<ComponentServices<typeof asynchronous>>().toEqualTypeOf<{ sdk: Vendor }>();
expectTypeOf<ComponentServices<typeof effectful>>().toEqualTypeOf<{ sdk: Vendor }>();
expectTypeOf<ComponentServices<typeof empty>>().toEqualTypeOf<Record<never, never>>();
declare const official: ComponentServices<typeof effectful>;
expectTypeOf(official.sdk.lookup("id")).toEqualTypeOf<string>();
expectTypeOf(official.sdk.lookup(1)).toEqualTypeOf<number>();

import { Invocation } from "kello/server";

defineComponent({
  name: "invalidPromise",
  // @ts-expect-error SDK factories must resolve to an object
  services: async () => 42,
});
defineComponent({
  name: "invalidInvocation",
  // @ts-expect-error Shared factories cannot depend on per-invocation identity
  services: () =>
    Effect.gen(function* () {
      const invocation = yield* Invocation;
      return { subject: invocation.identity?.subject };
    }),
});

const mixedFactory = (): Vendor | Effect.Effect<Vendor, { readonly code: "mixed" }> =>
  Math.random() > 0.5 ? new Vendor() : Effect.succeed(new Vendor());
import type { ComponentServiceValue } from "kello/server";
expectTypeOf<ComponentServiceValue<typeof mixedFactory>>().toEqualTypeOf<Vendor>();
