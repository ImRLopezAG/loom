import type { BunPlugin } from "bun";
import { dirname, join, relative, resolve } from "node:path";
import { serverBindings } from "../codegen/server";

/** Discovery must not read a previous generation back into its own source hash. */
export function projectReferences(backend: string, files: readonly string[], relationsFile?: string): BunPlugin {
  const imports = files.map((file, index) => `import * as m${index} from ${JSON.stringify(file)};`);
  const modules = files.map(
    (file, index) =>
      `${JSON.stringify(
        relative(join(backend, "functions"), file)
          .replaceAll("\\", "/")
          .replace(/\.(?:[cm]?[jt]s)$/, ""),
      )}: () => m${index}`,
  );
  // Namespace access stays deferred so functions can capture references during module
  // initialization. Validation runs after all function modules have initialized.
  const contents = `
import { isRegisteredFunction } from "@loom/core/server";
import { version } from "loom:version";
${imports.join("\n")}
const modules = { ${modules.join(",\n")} };
const captured = new Map();
const targets = new Map();
let ready = false;
function definition(name, visibility) {
  const separator = name.lastIndexOf(":");
  const namespace = modules[name.slice(0, separator)]?.();
  const value = namespace?.[name.slice(separator + 1)];
  if (!isRegisteredFunction(value) || value.visibility !== visibility)
    throw new Error("Unknown " + visibility + " function reference: " + name);
  return value;
}
function reference(name, visibility) {
  const key = visibility + ":" + name;
  if (!captured.has(key)) captured.set(key, Object.freeze({
    name,
    get kind() { return definition(name, visibility).kind; },
    get visibility() { return definition(name, visibility).visibility; },
    version,
  }));
  return captured.get(key);
}
function publicNamespace(path) {
  return new Proxy(Object.create(null), {
    get(_target, name) {
      if (typeof name !== "string") return undefined;
      const next = path ? path + "/" + name : name;
      if (Object.keys(modules).some(module => module === next || module.startsWith(next + "/")))
        return publicNamespace(next);
      return path ? reference(path + ":" + name, "public") : undefined;
    },
  });
}
function references(visibility) {
  const target = Object.create(null);
  targets.set(visibility, target);
  return new Proxy(target, {
    get(target, name) {
      if (visibility === "public" && typeof name === "string" && !name.includes(":"))
        return publicNamespace("")[name];
      if (ready) return target[name];
      if (typeof name !== "string") return undefined;
      return reference(name, visibility);
    },
  });
}
export const api = references("public");
export const internal = references("internal");
export function validateReferences() {
  for (const capturedReference of [...captured.values()]) void capturedReference.kind;
  for (const [path, namespace] of Object.entries(modules)) {
    for (const [name, value] of Object.entries(namespace())) {
      if (isRegisteredFunction(value))
        targets.get(value.visibility)[path + ":" + name] = reference(path + ":" + name, value.visibility);
    }
  }
  for (const target of targets.values()) Object.freeze(target);
  ready = true;
}
`;
  return {
    name: "loom-project-references",
    setup(build) {
      build.onResolve({ filter: /^loom:relations$/ }, () => ({ path: "relations", namespace: "loom-relations" }));
      build.onLoad({ filter: /.*/, namespace: "loom-relations" }, () => ({
        contents: relationsFile
          ? `export { default } from ${JSON.stringify(relationsFile)};`
          : `import { defineRelations } from "drizzle-orm"; import schema from ${JSON.stringify(join(backend, "schema.ts"))}; export default defineRelations(schema.tables);`,
        loader: "js",
      }));
      build.onResolve({ filter: /^loom:(?:references|version)$/ }, ({ path }) =>
        path === "loom:version" ? { path: "./version.mjs", external: true } : { path, namespace: "loom-references" },
      );
      build.onResolve({ filter: /_generated\// }, ({ path, importer }) => {
        const filename = resolve(dirname(importer), path).replace(/\.[cm]?[jt]s$/, "");
        if (filename === join(backend, "_generated/server"))
          return { path: "server", namespace: "loom-reference-entry" };
        for (const name of ["api", "internal"]) {
          if (filename === join(backend, "_generated", name)) return { path: name, namespace: "loom-reference-entry" };
        }
      });
      build.onLoad({ filter: /.*/, namespace: "loom-reference-entry" }, ({ path }) => ({
        contents:
          path === "server"
            ? `import relations from "loom:relations";
import schema from ${JSON.stringify(join(backend, "schema.ts"))};
${serverBindings(false)}`
            : `export { ${path} } from "loom:references";`,
        loader: "js",
      }));
      build.onLoad({ filter: /.*/, namespace: "loom-references" }, () => ({ contents, loader: "js" }));
    },
  };
}
