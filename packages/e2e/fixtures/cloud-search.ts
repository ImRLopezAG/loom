import assert from "node:assert/strict";
import { mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** A packed public consumer with an authored four-edge graph and explicit streaming contract. */
export async function prepareCloudSearch(root: string, namespace: string) {
  await mkdir(join(root, "node_modules/loom"), { recursive: true });
  const archive = join(root, "loom.tgz");
  const packed = Bun.spawnSync(["bun", "pm", "pack", "--filename", archive, "--ignore-scripts"], {
    cwd: fileURLToPath(new URL("../../../apps/loom/", import.meta.url)),
    stdout: "pipe",
    stderr: "pipe",
  });
  assert.equal(packed.exitCode, 0, "Public package archive failed");
  const unpacked = Bun.spawnSync(
    ["tar", "-xzf", archive, "--strip-components=1", "-C", join(root, "node_modules/loom")],
    { stdout: "pipe", stderr: "pipe" },
  );
  assert.equal(unpacked.exitCode, 0, "Public package extraction failed");
  await symlink(
    fileURLToPath(new URL("../../../apps/loom/node_modules/", import.meta.url)),
    join(root, "node_modules/loom/node_modules"),
  );
  for (const name of ["valibot", "effect", "drizzle-orm"])
    await symlink(
      fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url)),
      join(root, "node_modules", name),
    );
  await mkdir(join(root, "node_modules/@orpc"));
  await symlink(
    fileURLToPath(new URL("../node_modules/@orpc/server", import.meta.url)),
    join(root, "node_modules/@orpc/server"),
  );
  await writeFile(join(root, "package.json"), JSON.stringify({ private: true, type: "module" }));
  const backend = join(root, "loom");
  for (const path of ["contracts", "functions"]) await mkdir(join(backend, path), { recursive: true });
  const fixture = await readFile(new URL("../../tests/fixtures/search-schema.ts", import.meta.url), "utf8");
  await writeFile(
    join(backend, "schema.ts"),
    'import { defineSchema, defineTable } from "loom/server";\n' +
      fixture
        .slice(fixture.indexOf("export const searchSchema"), fixture.indexOf("export const searchRelations"))
        .replace("export const searchSchema =", "export default")
        .replace("title: s.text().notNull(),", "owner: s.text().notNull(), title: s.text().notNull(),")
        .replace(
          "taskLabels: defineTable",
          "permissions: defineTable({ subject: s.text().notNull(), allowed: s.boolean().notNull() }), taskLabels: defineTable",
        )
        .replace('namespace: "app"', `namespace: "${namespace}"`),
  );
  await writeFile(
    join(backend, "relations.ts"),
    'import schema from "./schema"; import { defineRelations } from "drizzle-orm";\n' +
      fixture
        .slice(fixture.indexOf("export const searchRelations"), fixture.indexOf("export const titleSelection"))
        .replace("export const searchRelations =", "export default")
        .replace("searchSchema.tables", "schema.tables"),
  );
  await writeFile(
    join(backend, "app.config.ts"),
    'import { defineApplication } from "loom"; export default defineApplication({ rpc: ({ os }) => ({ os }) });',
  );
  await writeFile(
    join(backend, "auth.config.ts"),
    `import { defineRpcAuth } from "loom/server";
import { ORPCError } from "@orpc/server";
import { sql } from "drizzle-orm";
export default defineRpcAuth({ authorize: async ({ identity, db }) => {
  if (!identity) throw new ORPCError("UNAUTHORIZED");
  if (db) {
    const result = await db.execute<{ allowed: boolean }>(sql\`SELECT allowed FROM "${namespace}".permissions WHERE subject=\${identity.subject}\`);
    if (result.rows[0]?.allowed !== true) throw new ORPCError("FORBIDDEN");
  }
} });`,
  );
  await writeFile(
    join(backend, "contracts/tasks.ts"),
    `import { defineContract, oc } from "loom/contract";
import { searchErrors } from "loom/contract";
import type { SearchPolicy } from "loom/server";
import relations from "../relations";
import { eq } from "drizzle-orm";
export default defineContract(({ validators }) => {
 const policy = {
  scope: { name: "owner", version: "1", where: ({ table, identity }) => eq(table.owner, identity?.subject ?? "") },
  columns: ["title", "done", "at", "count", "amount"], filter: ["title", "done"], order: ["title", "at", "count"],
  through: { taskLabels: "public" },
  relations: {
   labels: { scope: "public", columns: ["name"], filter: ["name"] },
   project: { scope: "public", columns: ["name"], relations: {
    organization: { scope: "public", columns: ["name"], relations: {
     teams: { scope: "public", columns: ["name"], relations: { members: { scope: "public", columns: ["name"] } } },
    } },
   } },
  },
 } as const satisfies SearchPolicy<typeof relations, typeof relations.tasks>;
 const finite = validators.tables.tasks.search(policy);
 const live = validators.tables.tasks.liveSearch(policy);
 const rows = validators.tables.tasks.search({ ...policy, budgets: { rows: 2 } });
 const bytes = validators.tables.tasks.search({ ...policy, budgets: { resultBytes: 128 } });
 const base = oc.errors({ ...searchErrors, UNAUTHORIZED: {}, FORBIDDEN: {} });
 return {
  list: base.input(finite.input).output(finite.output),
  effectList: base.input(finite.input).output(finite.output),
  bad: base.input(finite.input).output(finite.output),
  watch: base.input(live.input).output(live.output),
  rows: base.input(rows.input).output(rows.output), bytes: base.input(bytes.input).output(bytes.output),
 };
});`,
  );
  await writeFile(
    join(backend, "functions/tasks.ts"),
    `import { os } from "../_generated/rpc";
import { Search } from "../_generated/server";
import { Effect } from "effect";
export default os.tasks.router({
 list: os.tasks.list.handler(({ context, input }) => context.search.tasks.paginate(input)),
 effectList: os.tasks.effectList.effect(function* ({ input }) { const search = yield* Search; return yield* Effect.promise(() => search.tasks.paginate(input)); }),
 bad: os.tasks.bad.handler(async ({ context, input }) => { const page = await context.search.tasks.paginate(input); return { ...page, rows: page.rows.map(row => ({ ...row, done: true })) }; }),
 watch: os.tasks.watch.handler(({ context, input }) => context.search.tasks.watch(input)),
 rows: os.tasks.rows.handler(({ context, input }) => context.search.tasks.paginate(input)),
 bytes: os.tasks.bytes.handler(({ context, input }) => context.search.tasks.paginate(input)),
});`,
  );
}
