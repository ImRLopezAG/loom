import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as v from "valibot";
import { canonical } from "../../core/validation/canonical";
import { json } from "../../core/validation/encoding";
import type { ExtensionSelection } from "../../core/extensions/bindings";
import type { SchemaMetadata } from "../../core/schema/compile";
import { buildRequiredApi, requiredApiValidator, validateRequiredApi } from "../migrations/required-api";
import { databaseIdentifier } from "../migrations/connection";

const mountPath = v.pipe(
  v.string(),
  v.check((value) => !value.includes("\0")),
);
const generationRequiredApiValidator = v.strictObject({
  format: v.literal(1),
  scopes: v.pipe(
    v.array(v.strictObject({ mountPath, namespace: databaseIdentifier, requiredApi: requiredApiValidator })),
    v.minLength(1),
  ),
});
export type GenerationRequiredApi = v.InferOutput<typeof generationRequiredApiValidator>;
interface GenerationApiScope {
  readonly mountPath: string;
  readonly namespace: string;
  readonly extensions: ExtensionSelection;
  readonly metadata?: SchemaMetadata;
}

/** Internal immutable tooling evidence; the public ProcedureManifest remains format 1. */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Strictly parses untrusted persisted generation evidence at this artifact boundary.
export function validateGenerationRequiredApi(input: unknown): GenerationRequiredApi {
  const payload = v.parse(generationRequiredApiValidator, input);
  const mounts = new Set<string>();
  const namespaces = new Set<string>();
  const scopes = payload.scopes.map((scope) => {
    if (mounts.has(scope.mountPath) || namespaces.has(scope.namespace))
      throw new Error("Duplicate generation API scope");
    mounts.add(scope.mountPath);
    namespaces.add(scope.namespace);
    return { ...scope, requiredApi: validateRequiredApi(scope.requiredApi) };
  });
  scopes.sort((a, b) => a.namespace.localeCompare(b.namespace));
  return { format: 1, scopes };
}

export function buildGenerationRequiredApi(scopes: readonly GenerationApiScope[]): GenerationRequiredApi | undefined {
  const required = scopes.flatMap((scope) => {
    const requiredApi = buildRequiredApi(scope.extensions, scope.metadata);
    return requiredApi ? [{ mountPath: scope.mountPath, namespace: scope.namespace, requiredApi }] : [];
  });
  return required.length ? validateGenerationRequiredApi({ format: 1, scopes: required }) : undefined;
}

export function generationRequiredApiHash(input: GenerationRequiredApi | undefined): string | undefined {
  if (!input) return undefined;
  return createHash("sha256")
    .update(canonical(v.parse(json, JSON.parse(JSON.stringify(validateGenerationRequiredApi(input))))))
    .digest("hex");
}

export async function readGenerationRequiredApi(directory: string): Promise<GenerationRequiredApi | undefined> {
  const content = await readFile(join(directory, "required-api.json"), "utf8").catch((cause: unknown) => {
    if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return undefined;
    throw cause;
  });
  return content === undefined ? undefined : validateGenerationRequiredApi(JSON.parse(content));
}
