import { AsyncLocalStorage } from "node:async_hooks";
import * as v from "valibot";
import { implement } from "@orpc/server";
import type { Middleware, RouterImplementerWithMiddlewares } from "@orpc/server";
import type { RouterContract } from "@orpc/contract";
import type { AnyRelations } from "drizzle-orm";
import type { ProjectRegistration } from "../../contract";
import { createProjectContext, rpcErrorBoundary } from "../rpc/procedure";
import type { ProcedureContext, ProjectSchema } from "../rpc/procedure";
import { createDatabaseMiddleware } from "../rpc/database";
import type { ApplicationEnvironment, ApplicationEnvironmentOutput } from "./environment";
import { parseApplicationEnvironment } from "./environment";
import { createLiveContext } from "../rpc/live-context";

type RegisteredContract = ProjectRegistration extends { contract: infer Contract extends RouterContract }
  ? Contract
  : Record<never, never>;
type RegisteredSchema = ProjectRegistration extends { schema: infer Schema extends ProjectSchema }
  ? Schema
  : ProjectSchema;
type RegisteredRelations = ProjectRegistration extends { relations: infer Relations extends AnyRelations }
  ? Relations
  : AnyRelations;

interface EnvironmentScope {
  readonly application: object;
  readonly env: object;
}
const environment = new AsyncLocalStorage<EnvironmentScope>();
const applications = new WeakSet<object>();

export function isApplicationDefinition(value: unknown): value is { readonly env: ApplicationEnvironment } {
  return v.is(v.object({}), value) && applications.has(value);
}

type InjectedContext<Binding> =
  Binding extends Middleware<infer _Initial, infer Injected, infer _Input, infer _Output, infer _Errors>
    ? Injected
    : never;
type SchemaContext<Schema extends ProjectSchema> = InjectedContext<
  ReturnType<typeof createProjectContext<Schema>>["middleware"]
>;
type DatabaseContext<Schema extends ProjectSchema, Relations extends AnyRelations> = InjectedContext<
  ReturnType<typeof createDatabaseMiddleware<Relations, Schema>>
>;
type ApplicationContext<
  Schema extends ProjectSchema,
  Relations extends AnyRelations,
  Env extends ApplicationEnvironment,
> = Omit<SchemaContext<Schema>, keyof DatabaseContext<Schema, Relations>> &
  DatabaseContext<Schema, Relations> & {
    readonly env: ApplicationEnvironmentOutput<Env>;
  };
type LiveContext<Schema extends ProjectSchema, Relations extends AnyRelations, Env extends ApplicationEnvironment> = {
  readonly live: ReturnType<typeof createLiveContext<ProcedureContext & ApplicationContext<Schema, Relations, Env>>>;
};

export function applicationBase<
  Contract extends RouterContract,
  Schema extends ProjectSchema,
  Relations extends AnyRelations,
  Env extends ApplicationEnvironment,
>(contract: Contract, schema: Schema, relations: Relations, readEnv: () => ApplicationEnvironmentOutput<Env>) {
  const bindings = createProjectContext(schema);
  const builder = implement(contract)
    .$context<ProcedureContext>()
    .use(rpcErrorBoundary)
    .use(bindings.middleware)
    .use(createDatabaseMiddleware(relations, "automatic", schema))
    .use(({ next }) => next({ context: { env: readEnv() } }))
    .use(({ next, context }) => next({ context: { live: createLiveContext(context) } }));
  // SAFETY: native .use() widens a generic router's conditional type inside this
  // function. The original contract and the middleware-derived injected context
  // above are unchanged; preserve them at the project factory boundary.
  return builder as RouterImplementerWithMiddlewares<
    Contract,
    ProcedureContext,
    ApplicationContext<Schema, Relations, Env> & LiveContext<Schema, Relations, Env>
  >;
}

type ApplicationBase<Env extends ApplicationEnvironment> = ReturnType<
  typeof applicationBase<RegisteredContract, RegisteredSchema, RegisteredRelations, Env>
>;

export interface ApplicationDefinition<Env extends ApplicationEnvironment, Builders extends Record<string, object>> {
  readonly env: Env;
  readonly rpc: (context: { readonly os: ApplicationBase<Env> }) => Builders;
}

export function defineApplication<
  const Env extends ApplicationEnvironment,
  const Builders extends Record<string, object>,
>(options: {
  readonly env: Env;
  readonly rpc: (context: { readonly os: ApplicationBase<Env> }) => Builders;
}): ApplicationDefinition<Env, Builders>;
export function defineApplication<const Builders extends Record<string, object>>(options: {
  readonly rpc: (context: { readonly os: ApplicationBase<Record<never, never>> }) => Builders;
}): ApplicationDefinition<Record<never, never>, Builders>;
export function defineApplication<
  const Env extends ApplicationEnvironment,
  const Builders extends Record<string, object>,
>(options: {
  readonly env?: Env;
  readonly rpc: (context: { readonly os: ApplicationBase<Env> }) => Builders;
}): ApplicationDefinition<Env, Builders> {
  // SAFETY: the public no-environment overload fixes Env to an empty record.
  const env = options.env ?? ({} as Env);
  const app = Object.freeze({ env: Object.freeze(env), rpc: options.rpc });
  applications.add(app);
  return app;
}

/** Generation constructs builders with schema bindings, without resolving secrets. */
export function createApplicationRpc<Env extends ApplicationEnvironment, Builders extends Record<string, object>>(
  app: ApplicationDefinition<Env, Builders>,
  project: {
    readonly contract: RegisteredContract;
    readonly schema: RegisteredSchema;
    readonly relations: RegisteredRelations;
  },
): Builders {
  if (!applications.has(app)) throw new Error("Expected defineApplication's result");
  return app.rpc({
    os: applicationBase(project.contract, project.schema, project.relations, () => {
      const current = environment.getStore();
      if (!current || current.application !== app) throw new Error("Application environment is unavailable");
      // SAFETY: prepareApplicationEnvironment validated this exact application's declaration.
      return current.env as ApplicationEnvironmentOutput<Env>;
    }),
  });
}

/** Runtime initialization validates once. The returned scope belongs to this
 * runtime instance, so concurrent applications cannot inherit each other's env. */
export async function prepareApplicationEnvironment<Env extends ApplicationEnvironment>(
  app: { readonly env: Env },
  source: Readonly<Record<string, string | undefined>>,
) {
  if (!applications.has(app)) throw new Error("Expected defineApplication's result");
  const env = await parseApplicationEnvironment(app.env, source);
  return Object.freeze({
    run: <Result>(work: () => Result): Result => environment.run({ application: app, env }, work),
  });
}
