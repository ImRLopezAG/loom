import type { BunPlugin } from "bun";
import { dirname, join, resolve } from "node:path";
import { serverBindings } from "../codegen/server";

/** Discovery must not read a previous generation back into its own source hash. */
export function projectReferences(backend: string, relationsFile?: string): BunPlugin {
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
      build.onResolve({ filter: /_generated\// }, ({ path, importer }) => {
        const filename = resolve(dirname(importer), path).replace(/\.[cm]?[jt]s$/, "");
        if (filename === join(backend, "_generated/server"))
          return { path: "server", namespace: "loom-reference-entry" };
        if (["api", "internal"].some((name) => filename === join(backend, "_generated", name)))
          throw new Error("Server procedures must import procedure objects directly, not generated client bindings");
      });
      build.onLoad({ filter: /.*/, namespace: "loom-reference-entry" }, () => ({
        contents: `import relations from "loom:relations";
import schema from ${JSON.stringify(join(backend, "schema.ts"))};
${serverBindings(false)}`,
        loader: "js",
      }));
    },
  };
}
