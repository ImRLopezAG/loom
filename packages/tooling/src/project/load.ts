import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { isLoomSchema } from "@loom/core/server";
import type { SchemaDefinition } from "@loom/core/server";
import * as v from "valibot";
import { configValidator } from "../config/define-config";
import { resolveProjectPath } from "../config/paths";
import { discoverFunctions, moduleNamespace } from "../codegen/discovery";
import type { BunPlugin } from "bun";
import { projectReferences } from "./references";

async function bundleModule(root: string, source: string, plugins: BunPlugin[] = []) {
  const { build } = await import("bun");
  // Bun resolves external packages relative to the virtual entry's existing parent.
  await mkdir(await resolveProjectPath(root, ".loom/modules"), { recursive: true });
  const entry = join(root, ".loom", "entry.ts");
  const result = await build({
    entrypoints: [entry],
    files: { [entry]: source },
    root,
    target: "bun",
    format: "esm",
    packages: "external",
    minify: { whitespace: true },
    plugins,
  });
  if (!result.success) throw new Error("Project TypeScript bundling failed", { cause: result.logs });
  const output = result.outputs[0];
  if (!output || result.outputs.length !== 1) throw new Error("Project bundle must have exactly one JavaScript output");
  const content = await output.text();
  const hash = createHash("sha256").update(content).digest("hex");
  return { content, hash };
}

async function importBundle(root: string, content: string, version: string) {
  const parent = await resolveProjectPath(root, ".loom/modules");
  await mkdir(parent, { recursive: true });
  const directory = join(parent, version);
  const staging = join(parent, `.loading-${crypto.randomUUID()}`);
  const artifacts = {
    "project.mjs": content,
    "version.mjs": `export const version = ${JSON.stringify(version)};\n`,
  };
  await mkdir(staging);
  try {
    await Promise.all(
      Object.entries(artifacts).map(([name, source]) => writeFile(join(staging, name), source, { flag: "wx" })),
    );
    try {
      await rename(staging, directory);
    } catch (cause) {
      if (!(cause instanceof Error) || !("code" in cause) || !["EEXIST", "ENOTEMPTY"].includes(String(cause.code)))
        throw cause;
      for (const [name, source] of Object.entries(artifacts)) {
        if ((await readFile(join(directory, name), "utf8")) !== source)
          throw new Error("Cached project artifact does not match its build identity");
      }
    }
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  return v.parse(moduleNamespace, await import(pathToFileURL(join(directory, "project.mjs")).href));
}

async function sourceFiles(root: string, directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Function discovery does not follow symlinks: ${relative(root, path)}`);
    if (entry.isDirectory()) result.push(...(await sourceFiles(root, path)));
    else if (/\.(?:[cm]?[jt]s)$/.test(entry.name) && !/\.(?:test|spec|d)\.[cm]?[jt]s$/.test(entry.name))
      result.push(path);
  }
  return result.sort();
}

export async function loadProject(projectRoot: string) {
  const root = await resolveProjectPath(projectRoot, ".");
  const configFile = await resolveProjectPath(root, "loom.config.ts");
  const loadedConfig = await bundleModule(root, `export { default } from ${JSON.stringify(configFile)};`);
  const configExports = await importBundle(root, loadedConfig.content, loadedConfig.hash);
  const config = v.parse(configValidator, configExports.default);
  const backend = await resolveProjectPath(root, config.backend);
  await resolveProjectPath(root, config.database.migrations);
  const schemaFile = await resolveProjectPath(root, join(config.backend, "schema.ts"));
  const functionsDirectory = await resolveProjectPath(root, join(config.backend, "functions"));
  const files = await sourceFiles(root, functionsDirectory);
  const source = [
    `export { default as schema } from ${JSON.stringify(schemaFile)};`,
    ...files.map((file, index) => `export * as module${index} from ${JSON.stringify(file)};`),
    'import { validateReferences } from "loom:references"; validateReferences();',
  ].join("\n");
  const loaded = await bundleModule(root, source, [projectReferences(backend, files)]);
  const hash = createHash("sha256").update("loom-contract-2\0").update(loadedConfig.hash).update(loaded.hash);
  for (const name of ["package.json", "bun.lock"]) {
    try {
      hash.update(name).update(await readFile(join(root, name)));
    } catch (cause) {
      if (!(cause instanceof Error) || !("code" in cause) || cause.code !== "ENOENT") throw cause;
    }
  }
  const version = hash.digest("hex");
  const exports = await importBundle(root, loaded.content, version);
  const schema = v.parse(
    v.custom<SchemaDefinition>(isLoomSchema, "Expected defineSchema's result as the schema default export"),
    exports.schema,
  );
  if (schema.metadata.namespace !== config.database.namespace)
    throw new Error("Schema namespace differs from loom.config.ts");
  const functionModules = files.map((file) => relative(functionsDirectory, file).replaceAll("\\", "/"));
  const functions = discoverFunctions(
    functionModules.map((path, index) => ({
      path,
      exports: v.parse(moduleNamespace, exports[`module${index}`]),
    })),
  );
  return {
    root,
    backend,
    config,
    schema,
    functions,
    version,
    bundle: loaded.content,
    functionModules,
  };
}
