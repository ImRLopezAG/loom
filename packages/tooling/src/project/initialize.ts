import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defineConfig } from "../config/define-config.js";
import { resolveProjectPath } from "../config/paths.js";

export async function initializeProject(root: string, name: string): Promise<readonly string[]> {
  const config = defineConfig({ project: name });
  await mkdir(root, { recursive: true });
  await mkdir(await resolveProjectPath(root, "backend/functions"), { recursive: true });
  const files = [
    ["loom.config.ts", `import { defineConfig } from "@loom/tooling";\nexport default defineConfig({ project: ${JSON.stringify(config.project)} });\n`],
    ["backend/schema.ts", `import { defineSchema, defineTable } from "@loom/core/server";\nexport default defineSchema((s) => ({\n  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),\n}), { namespace: "app" });\n`],
    ["backend/functions/tasks.ts", `import { query } from "@loom/core/server";\nimport * as v from "valibot";\nimport schema from "../schema.js";\nexport const list = query({\n  args: v.object({}), returns: v.array(v.string()),\n  handler: async (ctx) => (await ctx.db.select({ title: schema.tables.tasks.title }).from(schema.tables.tasks)).map((row) => row.title),\n});\n`],
    ["package.json", JSON.stringify({ name, private: true, type: "module", scripts: { "loom:generate": "loom generate", "loom:dev": "loom dev" }, dependencies: { "@loom/core": "0.0.0", "@loom/tooling": "0.0.0", "valibot": "1.5.0" }, devDependencies: { "@loom/cli": "0.0.0", "typescript": "7.0.2" } }, null, 2) + "\n"],
    ["tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2023", module: "NodeNext", moduleResolution: "NodeNext", strict: true, noEmit: true, skipLibCheck: true }, include: ["backend/**/*.ts", "loom.config.ts"] }, null, 2) + "\n"],
    [".gitignore", "node_modules/\n.loom/\nbackend/_generated\n.env\n.env.*\n!.env.example\n"],
  ] as const;
  const created: string[] = [];
  try {
    for (const [path, content] of files) {
      await writeFile(await resolveProjectPath(root, path), content, { flag: "wx" });
      created.push(path);
    }
    return created;
  } catch (cause) {
    await Promise.all(created.map((path) => unlink(join(root, path))));
    throw new Error("Initialization refused to overwrite an existing file or could not write the project", { cause });
  }
}
