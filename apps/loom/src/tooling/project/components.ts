import { componentNamespace } from "./component-namespace";
import { sourceFiles } from "./sources";
import { componentVirtual } from "./component-references";
import type { ComponentSourceScope } from "./component-references";
import { readdir, lstat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import type { ComponentGraph } from "loom/server";
import type { InferOutput } from "valibot";
import type { moduleNamespace } from "../codegen/procedures";

/** Source discovery never mounts a definition. Registration remains app-owned. */
export async function componentSetupFiles(backend: string): Promise<readonly string[]> {
  const directory = join(backend, "components");
  const state = await lstat(directory).catch((cause: unknown) => {
    if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return undefined;
    throw cause;
  });
  if (!state) return [];
  if (!state.isDirectory()) throw new Error("Component directory must be a regular directory");
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
    if (entry.isSymbolicLink()) throw new Error("Component discovery does not follow symlinks");
    if (entry.isDirectory()) files.push(join(directory, entry.name, "setup.ts"));
    else if (entry.isFile() && entry.name.endsWith(".setup.ts")) files.push(join(directory, entry.name));
  }
  for (const file of files) {
    if (!(await lstat(file)).isFile()) throw new Error("Component setup must be a regular file");
  }
  return files.sort();
}

export function componentSetupSource(files: readonly string[]): string {
  return files
    .map((file, index) => `export { default as componentSetup${index} } from ${JSON.stringify(file)};`)
    .join("\n");
}

export function resolveComponentSources(
  backend: string,
  files: readonly string[],
  exports: InferOutput<typeof moduleNamespace>,
  graph: ComponentGraph,
) {
  return graph.nodes.map((node) => {
    const index = files.findIndex((_, candidate) => exports[`componentSetup${candidate}`] === node.definition);
    const setupFile = files[index];
    if (!setupFile) throw new Error(`Mounted component has no setup entry in components/: ${node.path}`);
    return Object.freeze({
      ...node,
      setupFile,
      directory: dirname(setupFile),
      sourcePath: relative(backend, setupFile),
    });
  });
}

export async function componentSourceScopes(nodes: readonly { readonly setupFile: string; readonly path: string }[]) {
  const scopes: ComponentSourceScope[] = [];
  for (const [index, node] of nodes.entries()) {
    const { setupFile, path } = node;
    const directory = dirname(setupFile);
    const optionalFile = async (name: string) => {
      const path = join(directory, name);
      return lstat(path).then(
        (entry) => {
          if (!entry.isFile()) throw new Error(`Component source must be a regular file: ${name}`);
          return path;
        },
        (cause: unknown) => {
          if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return undefined;
          throw cause;
        },
      );
    };
    const optionalSources = async (name: string) =>
      sourceFiles(directory, join(directory, name)).catch((cause: unknown) => {
        if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return [];
        throw cause;
      });
    const contractFiles = await optionalSources("contracts");
    const publicFiles = await optionalSources("functions");
    const internalFiles = await optionalSources("internal");
    scopes.push({
      index,
      mountPath: path,
      namespace: componentNamespace(path),
      setupFile,
      directory,
      schemaFile: await optionalFile("schema.ts"),
      relationsFile: await optionalFile("relations.ts"),
      contractModules: contractFiles.map((file) => ({
        file,
        path: relative(join(directory, "contracts"), file).replaceAll("\\", "/"),
      })),
      procedureModules: [
        ...publicFiles.map((file) => ({
          file,
          path: relative(join(directory, "functions"), file).replaceAll("\\", "/"),
          visibility: "public" as const,
        })),
        ...internalFiles.map((file) => ({
          file,
          path: relative(join(directory, "internal"), file).replaceAll("\\", "/"),
          visibility: "internal" as const,
        })),
      ],
      builders: [],
    });
  }
  return scopes;
}

export function componentBundleSource(scopes: readonly ComponentSourceScope[]): string {
  return scopes
    .map(
      (
        scope,
      ) => `export { default as componentSchema${scope.index} } from ${JSON.stringify(componentVirtual(scope, "schema"))};
export { default as componentRelations${scope.index} } from ${JSON.stringify(componentVirtual(scope, "relations"))};
export { contract as componentContract${scope.index} } from ${JSON.stringify(componentVirtual(scope, "contracts"))};
${scope.procedureModules.map((module, index) => `export * as component${scope.index}Module${index} from ${JSON.stringify(`loom-component-file:${scope.index}:${module.file}`)};`).join("\n")}`,
    )
    .join("\n");
}
