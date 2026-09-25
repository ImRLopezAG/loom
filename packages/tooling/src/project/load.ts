import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import {
  isLoomSchema,
  isNativeRelations,
  validateSchemaRelations,
  defineRpcAuth,
  isRpcAuthDefinition,
  defineProcedureStorage,
  isProcedureStorage,
  isProcedureCrons,
  compileProcedureCapabilities,
  compileJobMigrations,
  isJobMigrations,
} from "@loom/core/server";
import type {
  SchemaDefinition,
  RpcAuthDefinition,
  ProcedureStorageDefinition,
  ProcedureCron,
  JobMigration,
} from "@loom/core/server";
import * as v from "valibot";
import type { AnyRelations } from "drizzle-orm";
import { configValidator } from "../config/define-config";
import { resolveProjectPath } from "../config/paths";

import { discoverProcedures, moduleNamespace } from "../codegen/procedures";
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

async function optionalModule(
  root: string,
  backend: string,
  name: "crons" | "relations" | "auth" | "storage" | "upgrade",
  fallback: string,
): Promise<string> {
  const filename = await resolveProjectPath(root, join(backend, `${name}.ts`));
  try {
    if (!(await stat(filename)).isFile()) throw new Error(`Expected a file at ${backend}/${name}.ts`);
  } catch (cause) {
    if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return fallback;
    throw cause;
  }
  return `export { default as ${name} } from ${JSON.stringify(filename)};`;
}

/** Loads operational configuration without requiring a compilable application schema or functions. */
export async function loadProjectConfig(projectRoot: string) {
  const root = await resolveProjectPath(projectRoot, ".");
  const configFile = await resolveProjectPath(root, "loom.config.ts");
  const loadedConfig = await bundleModule(root, `export { default } from ${JSON.stringify(configFile)};`);
  const configExports = await importBundle(root, loadedConfig.content, loadedConfig.hash);
  return { config: v.parse(configValidator, configExports.default), hash: loadedConfig.hash };
}

export async function loadProject(projectRoot: string) {
  const root = await resolveProjectPath(projectRoot, ".");
  const { config, hash: configHash } = await loadProjectConfig(root);
  const backend = await resolveProjectPath(root, config.backend);
  await resolveProjectPath(root, config.database.migrations);
  const schemaFile = await resolveProjectPath(root, join(config.backend, "schema.ts"));
  const functionsDirectory = await resolveProjectPath(root, join(config.backend, "functions"));
  const files = await sourceFiles(root, functionsDirectory);
  const internalDirectory = await resolveProjectPath(root, join(config.backend, "internal"));
  const internalFiles = await sourceFiles(root, internalDirectory).catch((cause: unknown) => {
    if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return [];
    throw cause;
  });
  const procedureModules = [
    ...files.map((file) => ({
      file,
      path: relative(functionsDirectory, file).replaceAll("\\", "/"),
      visibility: "public" as const,
    })),
    ...internalFiles.map((file) => ({
      file,
      path: relative(internalDirectory, file).replaceAll("\\", "/"),
      visibility: "internal" as const,
    })),
  ];
  const source = [
    `import schema from ${JSON.stringify(schemaFile)}; export { schema };`,
    ...procedureModules.map(({ file }, index) => `export * as module${index} from ${JSON.stringify(file)};`),
    await optionalModule(root, config.backend, "crons", "export const crons = {};"),
    await optionalModule(root, config.backend, "upgrade", "export const upgrade = [];"),
    await optionalModule(root, config.backend, "storage", "export const storage = undefined;"),
    await optionalModule(root, config.backend, "auth", "export const auth = undefined;"),
    'export { default as relations } from "loom:relations";',
  ].join("\n");
  const relationsFile = join(backend, "relations.ts");
  const hasRelations = await stat(relationsFile).then(
    () => true,
    (cause: unknown) => {
      if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return false;
      throw cause;
    },
  );
  const loaded = await bundleModule(root, source, [
    projectReferences(backend, hasRelations ? relationsFile : undefined),
  ]);
  const hash = createHash("sha256")
    .update("loom-contract-18\0")
    .update(configHash)
    .update(JSON.stringify(config))
    .update(loaded.hash);
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
  const relations = v.parse(
    v.custom<AnyRelations>(isNativeRelations, "Expected native Drizzle relations as the relations default export"),
    exports.relations,
  );
  validateSchemaRelations(schema, relations);
  const procedures = discoverProcedures(
    procedureModules.map((module, index) => ({
      path: module.path,
      visibility: module.visibility,
      exports: v.parse(moduleNamespace, exports[`module${index}`]),
    })),
  );
  const common = {
    root,
    backend,
    config,
    schema,
    relations,
    procedures,
    procedureModules,
    version,
    bundle: loaded.content,
  };
  const auth = v.parse(
    v.custom<RpcAuthDefinition>(isRpcAuthDefinition, "Expected defineRpcAuth's result as the auth default export"),
    exports.auth === undefined ? defineRpcAuth() : exports.auth,
  );
  const storage = v.parse(
    v.custom<ProcedureStorageDefinition>(
      isProcedureStorage,
      "Expected defineProcedureStorage's result as the storage default export",
    ),
    exports.storage === undefined ? defineProcedureStorage() : exports.storage,
  );
  const authoredCrons = v.parse(
    v.custom<Readonly<Record<string, ProcedureCron>>>(
      isProcedureCrons,
      "Expected a record of native procedure cron declarations",
    ),
    exports.crons,
  );
  const jobMigrations = v.parse(
    v.custom<readonly JobMigration[]>(isJobMigrations, "Expected job migration declarations"),
    exports.upgrade,
  );
  compileJobMigrations({
    version,
    internal: procedures
      .filter((entry) => entry.visibility === "internal")
      .map((entry) => ({ path: entry.path, procedure: entry.definition })),
    migrations: jobMigrations,
  });
  const compiled = compileProcedureCapabilities({
    version,
    internal: procedures
      .filter((entry) => entry.visibility === "internal")
      .map((entry) => ({ path: entry.path, procedure: entry.definition })),
    crons: authoredCrons,
    storage,
    maxAttempts: config.jobs.maxAttempts,
  });
  return {
    ...common,
    protocol: "loom-orpc-2" as const,
    auth,
    storage,
    authoredCrons,
    jobMigrations,
    crons: compiled.crons,
  };
}
