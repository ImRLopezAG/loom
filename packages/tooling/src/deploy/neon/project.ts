import { readFile } from "node:fs/promises";
import type { NeonApi } from "@neon/config-runtime/v1";
import * as v from "valibot";
import { resolveProjectPath } from "../../config/paths";
import { loadProject } from "../../project/load";
import { neonInjectedVariables } from "./environment";
import { slugsValidator } from "./plan";
import { deployNeonRelease } from "./release";
import { releaseDatabaseOptionsValidator } from "./release-database";

const environmentName = v.pipe(v.string(), v.regex(/^[A-Z][A-Z0-9_]*$/));
const declarationValidator = v.strictObject({
  ...v.omit(releaseDatabaseOptionsValidator, ["inputHash", "activationToken"]).entries,
  format: v.literal(1),
  slugs: slugsValidator,
  activationTokenEnv: environmentName,
  variables: v.record(environmentName, environmentName),
});

/** Validates declarations without reading application secrets or mutating provider resources. */
export async function readProjectRelease(root: string, file: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const path = await resolveProjectPath(root, file);
  const parsed = v.safeParse(declarationValidator, JSON.parse(await readFile(path, "utf8")));
  if (!parsed.success) throw new Error("Invalid release declaration");
  const { activationTokenEnv, variables: sources } = parsed.output;
  const project = await loadProject(root);
  if (project.version !== parsed.output.version) throw new Error("Release source version changed");
  const privileged = ["NEON_API_KEY", project.config.database.migrationUrlEnv];
  if (
    privileged.includes(activationTokenEnv) ||
    Object.values(sources).some((name) => [...privileged, activationTokenEnv, "LOOM_ACTIVATION_TOKEN"].includes(name))
  )
    throw new Error("Reserved release environment source");
  const reserved = [...neonInjectedVariables, ...privileged, "LOOM_ACTIVATION_TOKEN"];
  if (Object.keys(sources).some((name) => reserved.includes(name)))
    throw new Error("Reserved release environment destination");
  if (!Object.hasOwn(sources, project.config.database.runtimeUrlEnv))
    throw new Error("Missing release runtime variable declaration");
  signal?.throwIfAborted();
  return { project, declaration: parsed.output };
}

/** Reads a reviewable release declaration; only environment variable names belong in the file. */
export async function deployProjectRelease(root: string, file: string, provider?: NeonApi, signal?: AbortSignal) {
  const { project, declaration } = await readProjectRelease(root, file, signal);
  const { format: _format, activationTokenEnv, variables: sources, ...options } = declaration;
  function value(name: string): string {
    const result = process.env[name];
    if (!result) throw new Error("Missing release environment value");
    return result;
  }
  const activationToken = value(activationTokenEnv);
  if (!v.is(v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)), activationToken))
    throw new Error("Invalid release activation token");
  const variables = Object.fromEntries(Object.entries(sources).map(([name, source]) => [name, value(source)]));
  const input = { ...options, activationToken, variables };
  return deployNeonRelease(project.root, signal ? { ...input, signal } : input, provider);
}
