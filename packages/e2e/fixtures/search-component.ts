import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** Authored component fixture shared by installed-package and real database tests. */
export async function writeSearchComponent(backend: string) {
  const fixture = await readFile(new URL("../../tests/fixtures/search-schema.ts", import.meta.url), "utf8");
  const catalog = join(backend, "components/catalog");
  for (const directory of ["contracts/internal", "functions", "internal"])
    await mkdir(join(catalog, directory), { recursive: true });
  await writeFile(
    join(catalog, "schema.ts"),
    'import { defineSchema, defineTable } from "loom/server";\n' +
      fixture
        .slice(fixture.indexOf("export const searchSchema"), fixture.indexOf("export const searchRelations"))
        .replace("export const searchSchema =", "export default") +
      "\n",
  );
  await writeFile(
    join(catalog, "relations.ts"),
    'import schema from "./schema"; import { defineRelations } from "drizzle-orm";\n' +
      fixture
        .slice(fixture.indexOf("export const searchRelations"), fixture.indexOf("export const titleSelection"))
        .replace("export const searchRelations =", "export default")
        .replace("searchSchema.tables", "schema.tables"),
  );
  await writeFile(
    join(catalog, "setup.ts"),
    `import { defineComponent } from "./_generated/setup";
export default defineComponent({ name: "catalog", rpc: ({ os }) => ({ os }) });`,
  );
  await writeFile(
    join(catalog, "contracts/items.ts"),
    `import { defineContract, oc } from "../_generated/contract";
export default defineContract(({ validators }) => {
  const search = validators.tables.tasks.search({ scope: "public", columns: ["title", "done"], through: { taskLabels: "public" }, relations: { labels: { scope: "public", columns: ["name"] } } });
  return { list: oc.input(search.input).output(search.output), effectList: oc.input(search.input).output(search.output), throughPrivate: oc.input(search.input).output(search.output) };
});`,
  );
  await writeFile(join(catalog, "contracts/internal/items.ts"), `export { default } from "../items";`);
  const componentHandlers = `import { os } from "../_generated/rpc";
import { Search } from "../_generated/server";
import { Effect } from "effect";
export default os.items.router({
  list: os.items.list.handler(({ context, input }) => context.search.tasks.paginate(input)),
  throughPrivate: os.items.throughPrivate.handler(({ context, input }) => context.internal.items.list(input)),
  effectList: os.items.effectList.effect(function* ({ input }) { const search = yield* Search; return yield* Effect.promise(() => search.tasks.paginate(input)); }),
});`;
  await writeFile(join(catalog, "functions/items.ts"), componentHandlers);
  await writeFile(join(catalog, "internal/items.ts"), componentHandlers.replaceAll("os.items", "os.internal.items"));
  const reader = join(backend, "components/reader");
  for (const directory of ["contracts", "functions"]) await mkdir(join(reader, directory), { recursive: true });
  await writeFile(
    join(reader, "setup.ts"),
    'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "reader", rpc: ({ os }) => ({ os }) });',
  );
  await writeFile(
    join(reader, "contracts/items.ts"),
    'import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ title: oc.output(v.string()) });',
  );
  await writeFile(
    join(reader, "functions/items.ts"),
    `import { os } from "../_generated/rpc";
export default os.items.router({ title: os.items.title.handler(async ({ context }) => {
  const page = await context.components.catalog.rpc.items.list({ columns: { title: true }, limit: 1 });
  const title: string = page.rows[0]!.title;
  return title;
}) });`,
  );
}
