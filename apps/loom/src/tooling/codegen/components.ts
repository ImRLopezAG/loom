import { contractGraph } from "./contracts";
import { mkdir, lstat, writeFile, readFile, rename, rm } from "node:fs/promises";
import { join, relative, basename, dirname } from "node:path";
import type { loadProject } from "../project/load";
import { resolveProjectPath } from "../config/paths";

export async function writeComponentBindings(project: Awaited<ReturnType<typeof loadProject>>) {
  const definitions = new Set<string>();
  for (const component of project.components) {
    if (definitions.has(component.setupFile)) continue;
    definitions.add(component.setupFile);
    if (basename(component.setupFile) !== "setup.ts") {
      throw new Error(`External component artifacts are not yet supported: ${component.path}`);
    }
    const directory = await resolveProjectPath(
      project.root,
      relative(project.root, join(component.directory, "_generated")),
    );
    const existingDirectory = await lstat(directory).catch((cause: unknown) => {
      if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return undefined;
      throw cause;
    });
    if (
      existingDirectory &&
      (!existingDirectory.isDirectory() ||
        (await readFile(join(directory, ".loom-generated"), "utf8").catch(() => "")) !==
          "loom-component-generated-v1\n")
    ) {
      throw new Error("Refusing to replace a user-owned component _generated directory");
    }
    const scope = project.componentScopes.find((entry) => entry.setupFile === component.setupFile);
    if (!scope) throw new Error(`Missing component source scope: ${component.path}`);
    const schema = `${scope.schemaFile ? 'import schema from "../schema";' : 'import { defineSchema } from "loom/server"; const schema = defineSchema(() => ({}));'}
${scope.relationsFile ? 'import relations from "../relations";' : 'import { defineRelations } from "drizzle-orm"; const relations = defineRelations(schema.tables);'}
import { createProjectContext } from "loom/server";
export { schema, relations };
export const { tables, validators } = createProjectContext(schema);
`;
    const registry = `import { resolveContract } from "loom/contract";
import { validators } from "./schema";
${scope.contractModules.map((module, index) => `import declaration${index} from ${JSON.stringify(`../contracts/${module.path.replace(/\.[cm]?[jt]s$/, "")}`)}; export const contract${index} = resolveContract(declaration${index}, { validators });`).join("\n")}
export const contract = ${contractGraph(scope.contractModules, (index) => `contract${index}`)};
`;
    const files = new Map([
      ["schema.ts", schema],
      ["contract-registry.ts", registry],
      [
        "registration.ts",
        `import type { schema, relations } from "./schema";
import type { contract } from "./contract-registry";
export interface ComponentRegistration { readonly schema: typeof schema; readonly relations: typeof relations; readonly contract: typeof contract; }
`,
      ],
      [
        "setup.ts",
        `import { componentDefinitionFor } from "loom/server";
import type { ComponentRegistration } from "./registration";
export const defineComponent = componentDefinitionFor<ComponentRegistration>();
`,
      ],
      [
        "contract.ts",
        `import { contractDefinitionFor } from "loom/contract";
import type { validators } from "./schema";
export { oc, eventIterator } from "loom/contract";
export const defineContract = contractDefinitionFor<{ readonly validators: typeof validators }>();
`,
      ],
      [
        "server.ts",
        `import component from "../setup";
import { createComponentEnvironmentAccess, createProjectServices } from "loom/server";
import { schema, relations } from "./schema";
export { tables, validators } from "./schema";
export const env = createComponentEnvironmentAccess(component);
export const { Database, Tables, Validators } = createProjectServices<typeof schema, typeof relations>();
`,
      ],
      [
        "rpc.ts",
        `import component from "../setup";
import { createComponentRpc } from "loom/server";
import { schema, relations } from "./schema";
import { contract } from "./contract-registry";
const builders = createComponentRpc(component, { schema, relations, contract });
${scope.builders.map((key, index) => `const builder${index} = builders[${JSON.stringify(key)}]; export { builder${index} as ${key} };`).join("\n")}
`,
      ],
    ]);
    for (const [index, module] of scope.contractModules.entries()) {
      const filename = `contracts/${module.path.replace(/\.[cm]?[jt]s$/, "")}.ts`;
      const parent = filename
        .split("/")
        .slice(0, -1)
        .map(() => "..")
        .join("/");
      files.set(filename, `export { contract${index} as default } from "${parent}/contract-registry";\n`);
    }
    // Publish a complete facade set; stale generated contract wrappers disappear
    // with the old directory. Never erase authored files outside this owned tree.
    const staging = `${directory}.staging-${crypto.randomUUID()}`;
    const backup = `${directory}.previous-${crypto.randomUUID()}`;
    await mkdir(staging);
    let moved = false;
    try {
      await writeFile(join(staging, ".loom-generated"), "loom-component-generated-v1\n");
      for (const [name, content] of files) {
        const path = join(staging, name);
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, content, { flag: "wx" });
      }
      if (existingDirectory) {
        await rename(directory, backup);
        moved = true;
      }
      try {
        await rename(staging, directory);
      } catch (cause) {
        if (moved) await rename(backup, directory);
        throw cause;
      }
      if (moved) await rm(backup, { recursive: true });
    } finally {
      await rm(staging, { recursive: true, force: true });
    }
  }
}
