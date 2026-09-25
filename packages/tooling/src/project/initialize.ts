import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defineConfig } from "../config/define-config";
import { resolveProjectPath } from "../config/paths";

export async function initializeProject(root: string, name: string): Promise<readonly string[]> {
  const config = defineConfig({ project: name });
  await mkdir(root, { recursive: true });
  await mkdir(await resolveProjectPath(root, "loom/functions"), { recursive: true });
  await mkdir(await resolveProjectPath(root, "loom/contracts"), { recursive: true });
  const files = [
    [
      "loom.config.ts",
      `import { defineConfig } from "@loom/tooling";\nexport default defineConfig({ project: ${JSON.stringify(config.project)} });\n`,
    ],
    [
      "loom/schema.ts",
      `import { defineSchema, defineTable } from "@loom/core/server";\nexport default defineSchema((s) => ({\n  tasks: defineTable({ title: s.text().notNull() }, { publicFields: ["_id", "title"] }),\n}), { namespace: "app" });\n`,
    ],
    [
      "loom/app.config.ts",
      `import { defineApplication } from "@loom/core/server";\nexport default defineApplication({ rpc: ({ os }) => ({ os }) });\n`,
    ],
    [
      "loom/auth.config.ts",
      `import { defineRpcAuth } from "@loom/core/server";\n// Deny requests until you configure the application's authorization policy.\nexport default defineRpcAuth();\n`,
    ],
    [
      "loom/contracts/tasks.ts",
      `import { defineContract, oc } from "@loom/core/contract";\nimport * as v from "valibot";\nexport default defineContract({ list: oc.output(v.array(v.string())) });\n`,
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
            "@loom/core": "0.0.0",
            "@loom/tooling": "0.0.0",
            valibot: "1.5.0",
            "drizzle-orm": "1.0.0-rc.4",
          },
          devDependencies: { "@loom/cli": "0.0.0", typescript: "7.0.2" },
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
