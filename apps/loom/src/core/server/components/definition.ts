import type { RouterContract } from "@orpc/contract";
import type { AnyRelations } from "drizzle-orm";
import type { ProjectSchema } from "../rpc/procedure";
import { applicationBase } from "../application/definition";
import { readComponentEnvironment } from "./environment";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { ApplicationEnvironment, ApplicationEnvironmentOutput } from "../application/environment";
import { createEnvironmentReferences } from "../application/environment";
import type { EnvironmentReference } from "../application/environment";
import { createComponentHost, registerComponentDefinition, validateComponentName } from "./graph";
import type { ComponentHost } from "./graph";

export interface ComponentConfiguration<
  Env extends ApplicationEnvironment = ApplicationEnvironment,
  Options extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  Services extends object = object,
> {
  readonly name: string;
  readonly env?: Env;
  readonly options?: Options;
  readonly services?: (context: {
    readonly env: ApplicationEnvironmentOutput<Env>;
    readonly options: Options extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<Options> : undefined;
  }) => Services;
}

export interface ComponentDescriptor {
  readonly name: string;
  readonly environmentSchema?: ApplicationEnvironment;
  readonly env?: Readonly<Record<string, EnvironmentReference>>;
  readonly options?: StandardSchemaV1 | undefined;
  readonly services?: (...args: never[]) => object;
  readonly rpc?: (...args: never[]) => object;
}

export type ComponentDefinition<Configuration extends ComponentDescriptor = ComponentDescriptor> =
  Readonly<Configuration> & ComponentHost;

export interface ComponentRegistration {
  readonly components: object;
  readonly schema: ProjectSchema;
  readonly relations: AnyRelations;
  readonly contract: RouterContract;
}

type ComponentBase<Scope extends ComponentRegistration, Env extends ApplicationEnvironment> = ReturnType<
  typeof applicationBase<Scope["contract"], Scope["schema"], Scope["relations"], Env, Scope["components"]>
>;

/** Used by generated setup facades to bind one scope without ambient augmentation. */
export function componentDefinitionFor<Scope extends ComponentRegistration>() {
  return function defineScopedComponent<
    const Env extends ApplicationEnvironment = Record<never, never>,
    const Options extends StandardSchemaV1 | undefined = undefined,
    const Services extends object = object,
    const Name extends string = string,
    const Builders extends Record<string, object> = { readonly os: ComponentBase<Scope, Env> },
  >(
    configuration: ComponentConfiguration<Env, Options, Services> & {
      readonly name: Name;
      readonly rpc?: (context: { readonly os: ComponentBase<Scope, Env> }) => Builders;
    },
  ) {
    validateComponentName(configuration.name);
    // SAFETY: the default generic fixes omitted declarations to an empty record.
    const environmentSchema = Object.freeze(configuration.env ?? ({} as Env));
    const env = createEnvironmentReferences(environmentSchema);
    const definition = Object.freeze({ ...configuration, environmentSchema, env, ...createComponentHost(env) });
    registerComponentDefinition(definition);
    return definition;
  };
}

export const defineComponent = componentDefinitionFor<ComponentRegistration>();

export function createComponentRpc<
  const Scope extends ComponentRegistration,
  const Env extends ApplicationEnvironment,
  const Builders extends Record<string, object>,
>(
  component: ComponentDefinition & {
    readonly environmentSchema: Env;
    readonly rpc?: (context: { readonly os: ComponentBase<Scope, Env> }) => Builders;
  },
  scope: Pick<Scope, "schema" | "relations" | "contract">,
) {
  const os = applicationBase<Scope["contract"], Scope["schema"], Scope["relations"], Env, Scope["components"]>(
    scope.contract,
    scope.schema,
    scope.relations,
    () => readComponentEnvironment(component),
  );
  // SAFETY: omitted rpc is the generated default os builder; authored callbacks
  // return Builders. Both paths use this scope's native contract and middleware.
  return (component.rpc ? component.rpc({ os }) : { os }) as Builders;
}
