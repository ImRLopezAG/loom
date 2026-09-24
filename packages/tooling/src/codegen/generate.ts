import { lstat, mkdir, readFile, readlink, readdir, rename, rm, stat, symlink, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { loadProject } from "../project/load";
import { resolveProjectPath } from "../config/paths";
import type { DiscoveredFunction } from "./discovery";
import type { FunctionKind, FunctionVisibility } from "@loom/core/client";
import { withGenerationLock } from "./lock";
import { runtimeArtifacts } from "./runtime";
import { queryApi } from "./query-api";

type LoadedProject = Awaited<ReturnType<typeof loadProject>>;
export interface ManifestFunction {
  readonly name: string;
  readonly kind: FunctionKind;
  readonly visibility: FunctionVisibility;
  readonly contractVersion: string;
  readonly validation: {
    readonly args: { readonly vendor: string; readonly version: 1 };
    readonly returns: { readonly vendor: string; readonly version: 1 };
  };
}
export interface FunctionManifest {
  readonly format: 1;
  readonly project: string;
  readonly version: string;
  readonly schemaFingerprint: string;
  readonly functions: readonly ManifestFunction[];
}

function moduleSpecifier(directory: string, filename: string): string {
  const path = relative(directory, filename)
    .replaceAll("\\", "/")
    .replace(/\.(?:[cm]?[jt]s)$/, ".js");
  return path.startsWith(".") ? path : `./${path}`;
}

function references(project: LoadedProject, directory: string, visibility: "public" | "internal") {
  const functions = project.functions.filter((entry) => entry.definition.visibility === visibility);
  const name = visibility === "public" ? "api" : "internal";
  const imports = functions.map(
    (entry, index) =>
      `import type * as f${index} from ${JSON.stringify(moduleSpecifier(directory, join(project.backend, "functions", entry.modulePath)))};`,
  );
  const contracts = functions.map(
    (entry, index) =>
      `  readonly ${JSON.stringify(entry.name)}: FunctionReference<${JSON.stringify(entry.definition.kind)}, ${JSON.stringify(visibility)}, StandardSchemaV1.InferInput<typeof f${index}.${entry.exportName}.args>, StandardSchemaV1.InferOutput<typeof f${index}.${entry.exportName}.returns>>;`,
  );
  const values = Object.fromEntries(
    functions.map((entry) => [
      entry.name,
      { name: entry.name, kind: entry.definition.kind, visibility, version: project.version },
    ]),
  );
  const nested = visibility === "public" ? queryApi(functions) : undefined;
  return {
    declarations: [
      ...(nested ? ['import type { QueryMethod, MutationMethod } from "@loom/core/query";'] : []),
      'import type { FunctionReference, StandardSchemaV1 } from "@loom/core/client";',
      ...imports,
      `export interface References {\n${contracts.join("\n")}\n}`,
      `export declare const ${name}: References${nested ? ` & ${nested.declarations}` : ""};`,
      "",
    ].join("\n"),
    javascript: nested
      ? `import { createQueryMethod, createMutationMethod } from "@loom/core/query";\nconst version = ${JSON.stringify(project.version)};\nexport const api = Object.freeze({ ...${JSON.stringify(values)}, ...${nested.javascript} });\n`
      : `export const ${name} = Object.freeze(${JSON.stringify(values, null, 2)});\n`,
  };
}

function registry(project: LoadedProject): string {
  const modules = new Map(project.functionModules.map((path, index) => [path, index]));
  const entries = project.functions.map((entry) => {
    const index = modules.get(entry.modulePath);
    if (index === undefined) throw new Error("Discovered function is absent from the project bundle");
    return `  ${JSON.stringify(entry.name)}: project.module${index}[${JSON.stringify(entry.exportName)}],`;
  });
  return [
    'import * as project from "./project.js";',
    'export { crons, schema, relations, auth, storage } from "./project.js";',
    `export const registry = Object.freeze({\n${entries.join("\n")}\n});`,
    "",
  ].join("\n");
}

function manifestFunction(entry: DiscoveredFunction, version: string): ManifestFunction {
  return {
    name: entry.name,
    kind: entry.definition.kind,
    visibility: entry.definition.visibility,
    contractVersion: version,
    validation: {
      args: { vendor: entry.definition.args["~standard"].vendor, version: entry.definition.args["~standard"].version },
      returns: {
        vendor: entry.definition.returns["~standard"].vendor,
        version: entry.definition.returns["~standard"].version,
      },
    },
  };
}

async function writeGeneration(project: LoadedProject): Promise<FunctionManifest> {
  const generationRoot = await resolveProjectPath(
    project.root,
    relative(project.root, join(project.backend, "_generated")),
  );
  const artifactsRoot = await resolveProjectPath(project.root, ".loom/generations");
  await mkdir(artifactsRoot, { recursive: true });
  const directory = join(artifactsRoot, project.version);
  const manifest: FunctionManifest = {
    format: 1,
    project: project.config.project,
    version: project.version,
    schemaFingerprint: project.schema.fingerprint,
    functions: project.functions.map((entry) => manifestFunction(entry, project.version)),
  };
  const publicReferences = references(project, directory, "public");
  const internalReferences = references(project, directory, "internal");
  const artifacts = {
    ...runtimeArtifacts(project),
    "api.js": publicReferences.javascript,
    "api.d.ts": publicReferences.declarations,
    "internal.js": internalReferences.javascript,
    "internal.d.ts": internalReferences.declarations,
    "registry.js": registry(project),
    "project.js": project.bundle,
    "version.mjs": `export const version = ${JSON.stringify(project.version)};\n`,
    "manifest.json": JSON.stringify(manifest, null, 2) + "\n",
  };
  try {
    await mkdir(generationRoot);
  } catch (cause) {
    if (!(cause instanceof Error) || !("code" in cause) || cause.code !== "EEXIST") throw cause;
    if ((await readFile(join(generationRoot, ".loom-generated"), "utf8").catch(() => "")) !== "loom-generated-v1\n") {
      throw new Error("Refusing to replace a user-owned _generated directory");
    }
  }
  try {
    await writeFile(join(generationRoot, ".loom-generated"), "loom-generated-v1\n", { flag: "wx" });
  } catch (cause) {
    if (!(cause instanceof Error) || !("code" in cause) || cause.code !== "EEXIST") throw cause;
  }
  for (const [name, exported] of Object.entries({
    api: "api",
    internal: "internal",
    service: "createService",
    worker: "createWorker",
  })) {
    for (const extension of ["js", "d.ts"]) {
      const filename = join(generationRoot, `${name}.${extension}`);
      const content = `export { ${exported} } from "./current/${name}.js";\n`;
      try {
        await writeFile(filename, content, { flag: "wx" });
      } catch (cause) {
        if (!(cause instanceof Error) || !("code" in cause) || cause.code !== "EEXIST") throw cause;
        if ((await readFile(filename, "utf8")) !== content) throw new Error("Generated entry point has been modified");
      }
    }
  }
  const relationsPath = await resolveProjectPath(
    project.root,
    relative(project.root, join(project.backend, "relations.ts")),
  );
  const hasRelations = await lstat(relationsPath).then(
    () => true,
    (cause: unknown) => {
      if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return false;
      throw cause;
    },
  );
  const server = hasRelations
    ? 'import relations from "../relations";\nimport schema from "../schema";\n'
    : 'import { defineRelations } from "drizzle-orm";\nimport schema from "../schema";\nconst relations = defineRelations(schema.tables);\n';
  await writeFile(
    join(generationRoot, "server.ts"),
    server +
      'import { createFunctionBuilders } from "@loom/core/server";\nexport const { query, mutation, action, internalQuery, internalMutation, internalAction } = createFunctionBuilders(relations, schema);\n',
  );
  const staging = join(artifactsRoot, `.staging-${crypto.randomUUID()}`);
  await mkdir(staging);
  try {
    await Promise.all(
      Object.entries(artifacts).map(([name, content]) => writeFile(join(staging, name), content, { flag: "wx" })),
    );
    try {
      await rename(staging, directory);
    } catch (cause) {
      if (!(cause instanceof Error) || !("code" in cause) || !["EEXIST", "ENOTEMPTY"].includes(String(cause.code)))
        throw cause;
      for (const [name, content] of Object.entries(artifacts)) {
        if ((await readFile(join(directory, name), "utf8")) !== content)
          throw new Error("Existing generated artifacts are inconsistent with their version");
      }
    }
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  return manifest;
}

async function activateGeneration(
  project: LoadedProject,
  signal?: AbortSignal,
  onActivated?: () => void,
): Promise<void> {
  const generationRoot = await resolveProjectPath(
    project.root,
    relative(project.root, join(project.backend, "_generated")),
  );
  const artifactsRoot = await resolveProjectPath(project.root, ".loom/generations");
  await mkdir(artifactsRoot, { recursive: true });
  const directory = join(artifactsRoot, project.version);
  const active = join(generationRoot, "current");
  try {
    const current = await lstat(active);
    if (!current.isSymbolicLink()) throw new Error("Refusing to replace a user-owned _generated directory");
    const target = resolve(generationRoot, await readlink(active));
    if (![generationRoot, artifactsRoot].some((parent) => /^([a-f0-9]{64})$/.test(relative(parent, target))))
      throw new Error("Refusing to replace an unmanaged _generated link");
  } catch (cause) {
    if (!(cause instanceof Error) || !("code" in cause) || cause.code !== "ENOENT") throw cause;
  }
  const link = join(generationRoot, `.current-${crypto.randomUUID()}`);
  try {
    await symlink(relative(generationRoot, directory), link, "dir");
    signal?.throwIfAborted();
    await rename(link, active);
    onActivated?.();
    // Retain the active version and one prior cached build; public imports never accumulate generations.
    const versions = (await readdir(artifactsRoot, { withFileTypes: true })).filter(
      (entry) => entry.isDirectory() && /^[a-f0-9]{64}$/.test(entry.name),
    );
    const previous = versions.filter((entry) => entry.name !== project.version);
    const ordered = await Promise.all(
      previous.map(async (entry) => ({
        name: entry.name,
        time: (await stat(join(artifactsRoot, entry.name))).mtimeMs,
      })),
    );
    ordered.sort((a, b) => b.time - a.time);
    for (const entry of ordered.slice(1)) await rm(join(artifactsRoot, entry.name), { recursive: true });
    for (const entry of await readdir(generationRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && /^[a-f0-9]{64}$/.test(entry.name))
        await rm(join(generationRoot, entry.name), { recursive: true });
    }
  } finally {
    await rm(link, { force: true });
  }
}

/** Prepare an immutable candidate without changing the active references. */
export async function prepareProject(root: string): Promise<FunctionManifest> {
  return withGenerationLock(root, async () => writeGeneration(await loadProject(root)));
}

/** Recheck source identity and artifact content under the same publication lock. */
export async function activateProject(
  root: string,
  expectedVersion: string,
  signal?: AbortSignal,
  onActivated?: () => void,
): Promise<FunctionManifest> {
  return withGenerationLock(root, async () => {
    signal?.throwIfAborted();
    const project = await loadProject(root);
    if (project.version !== expectedVersion) throw new Error("Candidate generation is stale");
    const manifest = await writeGeneration(project);
    await assertGeneratedVersion(root, expectedVersion);
    await activateGeneration(project, signal, onActivated);
    return manifest;
  });
}

export async function generateProject(root: string): Promise<FunctionManifest> {
  return withGenerationLock(root, async () => {
    const project = await loadProject(root);
    const manifest = await writeGeneration(project);
    await assertGeneratedVersion(root, project.version);
    await activateGeneration(project);
    return manifest;
  });
}

export async function assertGeneratedVersion(root: string, expectedVersion: string): Promise<void> {
  const project = await loadProject(root);
  if (project.version !== expectedVersion) throw new Error("Generated contracts are stale; run loom generate");
}
