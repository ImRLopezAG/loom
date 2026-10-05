import { join } from "node:path";
import type pg from "pg";
import {
  buildGenerationRequiredApi,
  generationRequiredApiHash,
  readGenerationRequiredApi,
  validateGenerationRequiredApi,
} from "../../codegen/required-api";
import type { GenerationRequiredApi } from "../../codegen/required-api";
import { projectMigrationScopes } from "../../migrations/component-scopes";
import { readMigrations } from "../../migrations/history";
import { buildRequiredApi, requiredApiHash } from "../../migrations/required-api";
import { validateRequiredApiForTarget, verifyRequiredApiOnTarget } from "../../migrations/required-api-verification";

type ReleaseApiProject = Parameters<typeof projectMigrationScopes>[0] & {
  readonly root: string;
  readonly version: string;
};

/** Bind immutable generated pins to source metadata and committed scope heads before opening the target. */
export async function inspectReleaseRequiredApi(
  project: ReleaseApiProject,
): Promise<GenerationRequiredApi | undefined> {
  const scopes = projectMigrationScopes(project);
  const source = buildGenerationRequiredApi(
    scopes.map((scope) => {
      const selected = { mountPath: scope.mountPath, namespace: scope.namespace, extensions: scope.extensions };
      return "metadata" in scope.schema ? { ...selected, metadata: scope.schema.metadata } : selected;
    }),
  );
  const generated = await readGenerationRequiredApi(join(project.root, ".loom/generations", project.version));
  if (generationRequiredApiHash(source) !== generationRequiredApiHash(generated))
    throw new Error("Release required API evidence differs from source scopes");
  for (const scope of scopes) {
    const history = await readMigrations(project.root, scope.migrations);
    const head = history.at(-1)?.plan;
    const selected = buildRequiredApi(scope.extensions, "metadata" in scope.schema ? scope.schema.metadata : undefined);
    if (requiredApiHash(selected) !== requiredApiHash(head?.format === 3 ? head.requiredApi : undefined))
      throw new Error(`Release required API differs from committed scope: ${scope.mountPath || "application"}`);
  }
  if (generated) for (const scope of generated.scopes) validateRequiredApiForTarget(scope.requiredApi);
  return generated;
}

/** Re-observe every scoped native contract and the named runtime role on the owned migration session. */
export async function verifyReleaseRequiredApi(
  client: Pick<pg.Client, "query">,
  input: GenerationRequiredApi | undefined,
  runtimeRole: string,
): Promise<void> {
  if (!input) return;
  const evidence = validateGenerationRequiredApi(input);
  // An invalid later scope must fail before an earlier scope reaches the native catalogue.
  for (const scope of evidence.scopes) validateRequiredApiForTarget(scope.requiredApi);
  for (const scope of evidence.scopes) await verifyRequiredApiOnTarget(client, scope.requiredApi, runtimeRole);
}
