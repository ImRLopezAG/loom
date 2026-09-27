import type { BunPlugin } from "bun";
import { dirname, join, resolve } from "node:path";
import { contractGraph } from "../codegen/contracts";
import type { ContractModule } from "../codegen/contracts";

export interface ComponentSourceScope {
  readonly index: number;
  readonly setupFile: string;
  readonly directory: string;
  readonly schemaFile: string | undefined;
  readonly relationsFile: string | undefined;
  readonly contractModules: readonly ContractModule[];
  readonly procedureModules: readonly {
    readonly file: string;
    readonly path: string;
    readonly visibility: "public" | "internal";
  }[];
  builders: readonly string[];
}

export function componentVirtual(scope: ComponentSourceScope, part: string): string {
  return `loom-component:${scope.index}:${part}`;
}

export function componentSchemaSource(scope: ComponentSourceScope): string {
  return scope.schemaFile
    ? `export { default } from ${JSON.stringify(scope.schemaFile)};`
    : 'import { defineSchema } from "loom/server"; export default defineSchema(() => ({}));';
}

export function componentContractSource(scope: ComponentSourceScope): string {
  return `import schema from ${JSON.stringify(componentVirtual(scope, "schema"))};
import { createProjectContext } from "loom/server";
import { resolveContract } from "loom/contract";
const { validators } = createProjectContext(schema);
${scope.contractModules.map((module, index) => `import declaration${index} from ${JSON.stringify(module.file)}; export const contract${index} = resolveContract(declaration${index}, { validators });`).join("\n")}
export const contract = ${contractGraph(scope.contractModules, (index) => `contract${index}`)};`;
}

export function componentRpcSource(scope: ComponentSourceScope): string {
  return `import component from ${JSON.stringify(scope.setupFile)};
import schema from ${JSON.stringify(componentVirtual(scope, "schema"))};
import relations from ${JSON.stringify(componentVirtual(scope, "relations"))};
import { contract } from ${JSON.stringify(componentVirtual(scope, "contracts"))};
import { createComponentRpc } from "loom/server";
export const builders = createComponentRpc(component, { schema, relations, contract });
${scope.builders.map((key, index) => `const builder${index} = builders[${JSON.stringify(key)}]; export { builder${index} as ${key} };`).join("\n")}`;
}

export function componentReferences(
  setupFiles: readonly string[],
  scopes: readonly ComponentSourceScope[] = [],
): BunPlugin {
  return {
    name: "loom-component-references",
    setup(build) {
      build.onResolve({ filter: /^loom-component:/ }, ({ path }) => ({ path, namespace: "loom-component" }));
      build.onResolve({ filter: /_generated\// }, ({ path, importer }) => {
        const filename = resolve(dirname(importer), path).replace(/\.[cm]?[jt]s$/, "");
        const setupFile = setupFiles.find((file) => filename === join(dirname(file), "_generated/setup"));
        if (setupFile) return { path: "setup", namespace: "loom-component" };
        for (const scope of scopes) {
          for (const part of ["rpc", "server", "contract", "schema"]) {
            if (filename === join(scope.directory, "_generated", part)) {
              return {
                path: componentVirtual(scope, part === "schema" ? "schema-bindings" : part),
                namespace: "loom-component",
              };
            }
          }
          if (["api", "internal"].some((name) => filename === join(scope.directory, "_generated", name)))
            throw new Error("Component procedures cannot import generated client bindings");
          const index = scope.contractModules.findIndex(
            (module) =>
              filename === join(scope.directory, "_generated/contracts", module.path.replace(/\.[cm]?[jt]s$/, "")),
          );
          if (index >= 0) return { path: componentVirtual(scope, `contract-${index}`), namespace: "loom-component" };
        }
      });
      build.onLoad({ filter: /.*/, namespace: "loom-component" }, ({ path }) => {
        if (path === "setup") return { contents: 'export { defineComponent } from "loom/server";', loader: "js" };
        const [, index, part] = path.split(":");
        const scope = scopes.find((entry) => String(entry.index) === index);
        if (!scope) throw new Error("Unknown component reference scope");
        const contents = (() => {
          if (part === "schema") return componentSchemaSource(scope);
          if (part === "relations")
            return scope.relationsFile
              ? `export { default } from ${JSON.stringify(scope.relationsFile)};`
              : `import schema from ${JSON.stringify(componentVirtual(scope, "schema"))}; import { defineRelations } from "drizzle-orm"; export default defineRelations(schema.tables);`;
          if (part === "contracts") return componentContractSource(scope);
          if (part === "contract") return 'export { defineContract, oc, eventIterator } from "loom/contract";';
          if (part === "rpc") return componentRpcSource(scope);
          if (part === "schema-bindings")
            return `import schema from ${JSON.stringify(componentVirtual(scope, "schema"))}; import relations from ${JSON.stringify(componentVirtual(scope, "relations"))}; import { createProjectContext } from "loom/server"; export { schema, relations }; export const { tables, validators } = createProjectContext(schema);`;
          if (part === "server")
            return `import component from ${JSON.stringify(scope.setupFile)}; import schema from ${JSON.stringify(componentVirtual(scope, "schema"))}; import { createComponentEnvironmentAccess, createProjectContext, createProjectServices } from "loom/server"; export const env = createComponentEnvironmentAccess(component); export const {tables, validators} = createProjectContext(schema); export const { Database, Tables, Validators } = createProjectServices();`;
          if (part?.startsWith("contract-"))
            return `export { contract${part.slice(9)} as default } from ${JSON.stringify(componentVirtual(scope, "contracts"))};`;
          throw new Error("Unknown component reference entry");
        })();
        return { contents, loader: "js" };
      });
    },
  };
}
