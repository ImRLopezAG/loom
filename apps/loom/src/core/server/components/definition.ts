import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { ApplicationEnvironment, ApplicationEnvironmentOutput } from "../application/environment";
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
  readonly env?: ApplicationEnvironment;
  readonly options?: StandardSchemaV1 | undefined;
  readonly services?: (...args: never[]) => object;
}

export type ComponentDefinition<Configuration extends ComponentDescriptor = ComponentDescriptor> =
  Readonly<Configuration> & ComponentHost;

/** Defines capabilities without acquiring services or mounting the component. */
export function defineComponent<
  const Env extends ApplicationEnvironment = Record<never, never>,
  const Options extends StandardSchemaV1 | undefined = undefined,
  const Services extends object = object,
  const Name extends string = string,
>(configuration: ComponentConfiguration<Env, Options, Services> & { readonly name: Name }) {
  validateComponentName(configuration.name);
  const definition = Object.freeze({ ...configuration, ...createComponentHost() });
  registerComponentDefinition(definition);
  return definition;
}
