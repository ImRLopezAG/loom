import type { StandardSchemaV1 } from "@standard-schema/spec";

export type ApplicationEnvironment = Readonly<Record<string, StandardSchemaV1>>;
export type ApplicationEnvironmentOutput<Env extends ApplicationEnvironment> = {
  readonly [Key in keyof Env]: StandardSchemaV1.InferOutput<Env[Key]>;
};

const environmentValue: unique symbol = Symbol("Loom environment value");
export interface EnvironmentReference<Value = unknown> {
  readonly key: string;
  readonly [environmentValue]: Value;
}
export type EnvironmentReferences<Env extends ApplicationEnvironment> = {
  readonly [Key in keyof Env]: EnvironmentReference<StandardSchemaV1.InferOutput<Env[Key]>>;
};
const references = new WeakSet<object>();

export function createEnvironmentReferences<const Env extends ApplicationEnvironment>(declaration: Env) {
  const entries = Object.keys(declaration).map((key) => {
    const reference = Object.freeze({ key });
    references.add(reference);
    return [key, reference];
  });
  // SAFETY: references are created for exactly the declaration's own keys;
  // their phantom value type records the schema output without reading secrets.
  return Object.freeze(Object.fromEntries(entries)) as EnvironmentReferences<Env>;
}

export function validateEnvironmentReference(
  reference: EnvironmentReference,
  parent: Readonly<Record<string, EnvironmentReference>>,
): void {
  if (!references.has(reference) || !Object.hasOwn(parent, reference.key) || parent[reference.key] !== reference) {
    throw new Error("Invalid environment reference for this component parent");
  }
}

/** Validate only declared server variables. Never retain vendor errors: they can
 * contain credentials, input values, or arbitrary application exceptions. */
export async function parseApplicationEnvironment<const Env extends ApplicationEnvironment>(
  declaration: Env,
  source: Readonly<Record<string, string | undefined>>,
): Promise<ApplicationEnvironmentOutput<Env>> {
  const output: Partial<ApplicationEnvironmentOutput<Env>> = {};
  for (const [name, schema] of Object.entries(declaration)) {
    try {
      const result = await schema["~standard"].validate(Object.hasOwn(source, name) ? source[name] : undefined);
      if (result.issues) throw new Error("Validation failed");
      Object.defineProperty(output, name, { value: result.value, enumerable: true });
    } catch {
      throw new Error(`Invalid application environment variable: ${name}`);
    }
  }
  // SAFETY: each declared key was validated by its own Standard Schema above.
  return Object.freeze(output) as ApplicationEnvironmentOutput<Env>;
}
