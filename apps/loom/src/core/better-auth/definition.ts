import { AsyncLocalStorage } from "node:async_hooks";
import type { BetterAuthOptions } from "better-auth";
import type { DBAdapterInstance } from "@better-auth/core/db/adapter";
import type { ApplicationEnvironment, ApplicationEnvironmentOutput } from "../server/application/environment";
import type { ComponentDefinition } from "../server/components/definition";
import { defineComponent } from "../server/components/definition";

export interface NativeAuth {
  readonly handler: (request: Request) => Promise<Response>;
  readonly options: BetterAuthOptions;
  readonly $context: Promise<unknown>;
}

export interface BetterAuthConfiguration<Env extends ApplicationEnvironment, Auth extends NativeAuth> {
  readonly name: string;
  readonly env: Env;
  readonly create: (context: {
    readonly env: ApplicationEnvironmentOutput<Env>;
    readonly database: DBAdapterInstance;
  }) => Auth;
}

export interface BetterAuthServices<Auth extends NativeAuth> {
  readonly auth: Auth;
}

const factories = new WeakMap<object, BetterAuthConfiguration<ApplicationEnvironment, NativeAuth>["create"]>();
const instances = new AsyncLocalStorage<ReadonlyMap<object, NativeAuth>>();

/** The native instance remains typed; mounting is explicit through app.use(). */
export function defineBetterAuth<const Env extends ApplicationEnvironment, Auth extends NativeAuth>(
  configuration: BetterAuthConfiguration<Env, Auth>,
) {
  const component = defineComponent({
    name: configuration.name,
    env: configuration.env,
    services: (): BetterAuthServices<Auth> => {
      const auth = instances.getStore()?.get(component);
      if (!auth) throw new Error("Better Auth is unavailable outside its initialized Loom runtime");
      // SAFETY: the runtime binds the instance produced by this exact component's factory.
      return { auth: auth as Auth };
    },
  });
  // SAFETY: environment validation is bound to the component declaration before invocation.
  factories.set(
    component,
    configuration.create as BetterAuthConfiguration<ApplicationEnvironment, NativeAuth>["create"],
  );
  return component;
}

/** Scope instances to one runtime generation, never to a process-global current app. */
export function withBetterAuthInstances<T>(bindings: ReadonlyMap<object, NativeAuth>, run: () => T): T {
  return instances.run(bindings, run);
}

export function getBetterAuthFactory(component: ComponentDefinition) {
  return factories.get(component);
}
