import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defineConfig } from "../config/define-config";
import { resolveProjectPath } from "../config/paths";

export function projectTemplates(name: string) {
  defineConfig({ project: name });
  const files = [
    [
      "loom/schema.ts",
      `import { defineSchema, defineTable } from "loom/server";\nexport default defineSchema((s) => ({\n  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),\n}), { namespace: "app" });\n`,
    ],
    [
      "loom/app.config.ts",
      `import { defineApplication } from "loom/server";\nexport default defineApplication({ rpc: ({ os }) => ({ os }) });\n`,
    ],
    [
      "loom/auth.config.ts",
      `import { defineRpcAuth } from "loom/server";\n// Deny requests until you configure the application's authorization policy.\nexport default defineRpcAuth();\n`,
    ],
    [
      "loom/contracts/tasks.ts",
      `import { defineContract, oc } from "loom/contract";\nimport * as v from "valibot";\nexport default defineContract({ list: oc.output(v.array(v.string())) });\n`,
    ],
    [
      "loom/functions/tasks.ts",
      `import { os } from "../_generated/rpc";\nexport default os.tasks.router({\n  list: os.tasks.list.handler(async ({ context: { db, tables } }) =>\n    (await db.select({ title: tables.tasks.title }).from(tables.tasks).limit(100)).map((row) => row.title),\n  ),\n});\n`,
    ],
    [
      "package.json",
      JSON.stringify(
        {
          name,
          private: true,
          type: "module",
          scripts: { "loom:generate": "loom generate", "loom:dev": "loom dev" },
          dependencies: {
            loom: "0.0.0",
            valibot: "1.5.0",
            "drizzle-orm": "1.0.0-rc.4",
          },
          devDependencies: { typescript: "7.0.2" },
        },
        null,
        2,
      ) + "\n",
    ],
    [
      "tsconfig.json",
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2023",
            module: "Preserve",
            moduleResolution: "Bundler",
            strict: true,

            noEmit: true,
            skipLibCheck: true,
          },
          include: ["loom/**/*.ts", "loom.config.ts"],
        },
        null,
        2,
      ) + "\n",
    ],
    [
      ".gitignore",
      "node_modules/\n.loom/\nloom/_generated/*\n!loom/_generated/migrations/\n.env\n.env.*\n!.env.example\n",
    ],
  ] as const;
  return files;
}

export async function initializeProject(root: string, name: string): Promise<readonly string[]> {
  const files = projectTemplates(name);
  await mkdir(root, { recursive: true });
  await mkdir(await resolveProjectPath(root, "loom/functions"), { recursive: true });
  await mkdir(await resolveProjectPath(root, "loom/contracts"), { recursive: true });
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
