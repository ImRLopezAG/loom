import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, symlink, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect } from "bun:test";
import * as v from "valibot";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { defineRelations, sql } from "drizzle-orm";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import {
  createProjectProcedures,
  createProjectServices,
  defineSchema,
  Invocation,
  connectDatabase,
} from "kello/server";
import { hllSketch } from "kello/extensions/hll";
import { extensionProofTest } from "../fixtures/extension-proof";
import { hllGenerationProofCase } from "../fixtures/hll-proof-cases";
import { withExtensionDatabase } from "../fixtures/extension-database";

async function projectFixture() {
  const root = await mkdtemp(join(tmpdir(), "loom-selected-hll-"));
  try {
    await initializeProject(root, "selectedhll");
    await mkdir(join(root, "node_modules"));
    for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    return root;
  } catch (cause) {
    await rm(root, { recursive: true, force: true });
    throw cause;
  }
}

async function checkFixtureTypes(root: string) {
  const process = Bun.spawn(
    [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
    { stdout: "pipe", stderr: "pipe" },
  );
  const output = (await new Response(process.stdout).text()) + (await new Response(process.stderr).text());
  assert.equal(await process.exited, 0, output);
}

extensionProofTest(
  hllGenerationProofCase,
  async () => {
    const root = await projectFixture();
    try {
      await writeFile(
        join(root, "kello.config.ts"),
        'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { hll: { version: "2.21", schema: "sketches_hll" } } } });',
      );
      await writeFile(
        join(root, "kello/schema.ts"),
        `import { defineSchema, defineTable } from "kello/server"; import { extensions } from "./_generated/extensions";
const hll = extensions.hll;
export default defineSchema((s) => ({ visits: defineTable({ day: s.text().notNull(), users: hll.field({ log2m: 12, regwidth: 5, expthresh: -1, sparseon: 1 }).notNull(), last: hll.hashvalField() }) }), { namespace: "app" });`,
      );
      await writeFile(
        join(root, "kello/functions/tasks.ts"),
        `import { os } from "../_generated/rpc";
import { hllSketch, type HllSketch, type NonfiniteNumber } from "kello/extensions/hll";
import { sql, type SQL } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const api = context.extensions.hll;
const version: "2.21" = api.version;
const sketch: SQL<HllSketch | null> = api.addAggregate.hashval(api.hash.integer(sql<number>\`g\`));
const estimate: SQL<number | NonfiniteNumber | null> = api.cardinality(hllSketch("118b7f"));
const hashed: SQL<bigint | null> = api.hash.text("a", 0);
// @ts-expect-error Only the selected extension key exists.
void context.extensions.hstore;
// @ts-expect-error hll_hashval is an exact int8 bigint, not a lossy JS number.
api.add(hllSketch("118b7f"), 1);
// @ts-expect-error PostgreSQL rejects DISTINCT for hll aggregates, so no helper is offered.
api.addAggregate.hashval.distinct(1n);
// @ts-expect-error Process-local setters are operator tooling, never query helpers.
void api.sql.functions.hll_set_defaults;
void [sketch, estimate, hashed];
return [version]; }) });`,
      );
      const component = join(root, "kello/components/sketches");
      await mkdir(join(component, "contracts"), { recursive: true });
      await mkdir(join(component, "functions"));
      await writeFile(
        join(component, "setup.ts"),
        'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "sketches", extensions: { hll: { versions: ["2.21"] } }, rpc: ({ os }) => ({ os }) });',
      );
      await writeFile(
        join(root, "kello/app.config.ts"),
        'import { defineApplication } from "kello/server"; import sketches from "./components/sketches/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(sketches); export default app;',
      );
      await writeFile(
        join(component, "schema.ts"),
        'import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; if (extensions.hll.schema !== "sketches_hll") throw new Error("Wrong mounted selection"); extensions.hll.empty.defaults(); export default defineSchema(() => ({}));',
      );
      await loadProject(root);
      const generated = await generateProject(root);
      const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
      const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
      expect(server.extensions).toBe(disk.extensions);
      expect(Object.keys(disk.extensions)).toEqual(["hll"]);
      expect(disk.extensions.hll.version).toBe("2.21");
      expect(disk.extensions.hll.apiSupport).toEqual({
        status: "verified",
        digest: "44f6623b1b7a463ea7cb26fcd02b434cb33c36a4bd9edfe0397e2536f66f6b19",
      });
      expect(Object.keys(disk.extensions.hll.sql.overloads)).toHaveLength(50);
      const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
      expect(Object.keys(child.extensions)).toEqual(["hll"]);
      expect(child.extensions.hll.schema).toBe("sketches_hll");
      await checkFixtureTypes(root);
      expect((await generateProject(root)).version).toBe(generated.version);
      await withExtensionDatabase(async (url) => {
        const schema = defineSchema(() => ({}));
        const relations = defineRelations(schema.tables);
        const connection = await connectDatabase({ schema, relations, connectionString: url });
        try {
          await connection.db.execute(
            sql`create schema sketches_hll; create extension hll with schema sketches_hll version '2.21'`,
          );
          const oracle = await connection.db.execute(
            sql`select sketches_hll.hll_add_agg(sketches_hll.hll_hash_integer(g))::text sketch, sketches_hll.hll_cardinality(sketches_hll.hll_add_agg(sketches_hll.hll_hash_integer(g))) estimate, sketches_hll.hll_hash_text('a',0)::text hashed from generate_series(1,1000) g`,
          );
          const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
          const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
          const handler = procedure.handler(async ({ context }) => {
            const effectBinding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
            expect(effectBinding).toBe(context.extensions);
            const api = effectBinding.hll;
            return connection.transaction((db) =>
              db
                .select({
                  sketch: api.addAggregate.hashval(api.hash.integer(sql<number>`g`)),
                  estimate: api.cardinality(api.addAggregate.hashval(api.hash.integer(sql<number>`g`))),
                  hashed: api.hash.text("a", 0),
                  empty: api.empty.defaults(),
                })
                .from(sql`generate_series(1,1000) g`),
            );
          });
          const invocation = { requestId: "selected-hll", identity: null, signal: new AbortController().signal };
          const [row] = await call(handler, undefined, {
            context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
          });
          const [native] = v.parse(
            v.tuple([v.strictObject({ sketch: v.string(), estimate: v.number(), hashed: v.string() })]),
            oracle.rows,
          );
          expect(`\\x${row!.sketch.hex}`).toBe(native.sketch);
          expect(row!.estimate).toBe(native.estimate);
          expect(row!.hashed).toBe(BigInt(native.hashed));
          expect(row!.empty).toEqual(hllSketch("118b7f"));
        } finally {
          await connection.close();
        }
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  60000,
);
