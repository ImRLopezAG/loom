import { AsyncLocalStorage } from "node:async_hooks";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { ApplicationEnvironment, ApplicationEnvironmentOutput } from "../application/environment";
import type { ComponentDefinition } from "./definition";
import type { ComponentGraph } from "./graph";

interface ComponentEnvironment {
  readonly definition: ComponentDefinition;
  readonly env: ApplicationEnvironmentOutput<ApplicationEnvironment>;
  readonly options: unknown;
}
const scope = new AsyncLocalStorage<ComponentEnvironment>();

type DeclaredEnvironment<Definition extends ComponentDefinition> =
  Definition["environmentSchema"] extends ApplicationEnvironment
    ? Definition["environmentSchema"]
    : Record<never, never>;

export function readComponentEnvironment<const Definition extends ComponentDefinition>(definition: Definition) {
  const current = scope.getStore();
  if (!current || current.definition !== definition) throw new Error("Component environment is unavailable");
  // SAFETY: initialization validates every declaration for this exact definition.
  return current.env as ApplicationEnvironmentOutput<DeclaredEnvironment<Definition>>;
}

export function readComponentOptions<const Definition extends ComponentDefinition>(definition: Definition) {
  const current = scope.getStore();
  if (!current || current.definition !== definition) throw new Error("Component options are unavailable");
  // SAFETY: initialization validates options against this definition's schema.
  return current.options as NonNullable<Definition["options"]> extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<NonNullable<Definition["options"]>>
    : undefined;
}

export async function prepareComponentEnvironments(
  graph: ComponentGraph,
  applicationEnv: ApplicationEnvironmentOutput<ApplicationEnvironment>,
  source: Readonly<Record<string, string | undefined>>,
) {
  const instances = new Map<string, ComponentEnvironment>();
  for (const node of graph.nodes) {
    const parentPath = node.path.slice(0, node.path.lastIndexOf("/") + 1).replace(/\/$/, "");
    const parent = parentPath ? instances.get(parentPath)?.env : applicationEnv;
    if (!parent) throw new Error(`Missing component parent: ${node.path}`);
    const env: ApplicationEnvironmentOutput<ApplicationEnvironment> = {};
    for (const [key, validator] of Object.entries(node.definition.environmentSchema ?? {})) {
      const binding = node.env[key];
      const value = binding ? parent[binding.key] : Object.hasOwn(source, key) ? source[key] : undefined;
      try {
        const result = await validator["~standard"].validate(value);
        if (result.issues) throw new Error("Validation failed");
        Object.defineProperty(env, key, { value: result.value, enumerable: true });
      } catch {
        throw new Error(`Invalid component environment variable: ${node.path}.${key}`);
      }
    }
    let options: unknown;
    try {
      const validator = node.definition.options;
      if (validator) {
        const result = await validator["~standard"].validate(node.options);
        if (result.issues) throw new Error("Validation failed");
        options = result.value;
      } else if (node.options !== undefined) {
        throw new Error("Undeclared options");
      }
    } catch {
      throw new Error(`Invalid component options: ${node.path}`);
    }
    instances.set(node.path, Object.freeze({ definition: node.definition, env: Object.freeze(env), options }));
  }
  return {
    runComponent<Result>(path: string, work: () => Result): Result {
      const instance = instances.get(path);
      if (!instance) throw new Error(`Unknown component instance: ${path}`);
      return scope.run(instance, work);
    },
  };
}
