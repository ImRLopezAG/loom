import { build } from "bun";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { isLoomSchema } from "@loom/core/server";
import type { SchemaDefinition } from "@loom/core/server";
import * as v from "valibot";
import { configValidator } from "../config/define-config.js";
import { resolveProjectPath } from "../config/paths.js";
import { discoverFunctions, moduleNamespace } from "../codegen/discovery.js";

async function bundleModule(root: string, source: string) {
  const directory = await resolveProjectPath(root, ".loom/modules");
  await mkdir(directory, { recursive: true });
  const entry = join(root, ".loom", "entry.ts");
  const result = await build({ entrypoints: [entry], files: { [entry]: source }, root, target: "bun", format: "esm", packages: "external", minify: { whitespace: true } });
  if (!result.success) throw new Error("Project TypeScript bundling failed", { cause: result.logs });
  const output = result.outputs[0];
  if (!output || result.outputs.length !== 1) throw new Error("Project bundle must have exactly one JavaScript output");
  const content = await output.text();
  const hash = createHash("sha256").update(content).digest("hex");
  const filename = join(directory, `${hash}.mjs`);
  try { await writeFile(filename, content, { flag: "wx" }); }
  catch (cause) {
    if (!(cause instanceof Error) || !("code" in cause) || cause.code !== "EEXIST") throw cause;
    if (await readFile(filename, "utf8") !== content) throw new Error("Cached project module does not match its content hash");
  }
  const exports = v.parse(moduleNamespace, await import(pathToFileURL(filename).href));
  return { exports, hash };
}

async function sourceFiles(root: string, directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Function discovery does not follow symlinks: ${relative(root, path)}`);
    if (entry.isDirectory()) result.push(...await sourceFiles(root, path));
    else if (/\.(?:[cm]?[jt]s)$/.test(entry.name) && !/\.(?:test|spec|d)\.[cm]?[jt]s$/.test(entry.name)) result.push(path);
  }
  return result.sort();
}

export async function loadProject(projectRoot: string) {
  const root = await resolveProjectPath(projectRoot, ".");
  const configFile = await resolveProjectPath(root, "loom.config.ts");
  const loadedConfig = await bundleModule(root, `export { default } from ${JSON.stringify(configFile)};`);
  const config = v.parse(configValidator, loadedConfig.exports.default);
  const backend = await resolveProjectPath(root, config.backend);
  await resolveProjectPath(root, config.database.migrations);
  const schemaFile = await resolveProjectPath(root, join(config.backend, "schema.ts"));
  const functionsDirectory = await resolveProjectPath(root, join(config.backend, "functions"));
  const files = await sourceFiles(root, functionsDirectory);
  const source = [`export { default as schema } from ${JSON.stringify(schemaFile)};`,
    ...files.map((file, index) => `export * as module${index} from ${JSON.stringify(file)};`)].join("\n");
  const loaded = await bundleModule(root, source);
  const schema = v.parse(v.custom<SchemaDefinition>(isLoomSchema, "Expected defineSchema's result as the schema default export"), loaded.exports.schema);
  if (schema.metadata.namespace !== config.database.namespace) throw new Error("Schema namespace differs from loom.config.ts");
  const functions = discoverFunctions(files.map((file, index) => ({ path: relative(functionsDirectory, file).replaceAll("\\", "/"), exports: v.parse(moduleNamespace, loaded.exports[`module${index}`]) })));
  const hash = createHash("sha256").update("loom-contract-1\0").update(loadedConfig.hash).update(loaded.hash);
  for (const name of ["package.json", "bun.lock"]) {
    try { hash.update(name).update(await readFile(join(root, name))); }
    catch (cause) { if (!(cause instanceof Error) || !("code" in cause) || cause.code !== "ENOENT") throw cause; }
  }
  return { root, backend, config, schema, functions, version: hash.digest("hex") };
}
