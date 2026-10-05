import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, symlink, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect } from "bun:test";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { defineRelations } from "drizzle-orm";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { createProjectProcedures, createProjectServices, Invocation, connectDatabase } from "kello/server";
import pg from "pg";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { projectRuntimeGraph } from "../../../apps/loom/src/tooling/project/runtime-graph";
import { extensionProofTest } from "../fixtures/extension-proof";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { ltreeGenerationProofCase } from "../fixtures/ltree-proof-cases";

/** Kello config admits plain identifiers; this custom placement is not on any default search_path. */
const placement = "ltree_tools";
const digest = "f0d5b39c468e80a8748a7a35ed30af0e530da547c2c15ebcaee307e34090c82e";

async function projectFixture() {
  const root = await mkdtemp(join(tmpdir(), "loom-selected-ltree-"));
  try {
    await initializeProject(root, "selectedltree");
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
  ltreeGenerationProofCase,
  async () => {
    const root = await projectFixture();
    try {
      const component = join(root, "kello/components/catalog");
      await mkdir(join(component, "contracts"), { recursive: true });
      await mkdir(join(component, "functions"));
      await writeFile(
        join(root, "kello.config.ts"),
        `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { ltree: { version: "1.3", schema: ${JSON.stringify(placement)} }, pg_trgm: { version: "1.6", schema: "host_text" } } } });`,
      );
      await writeFile(
        join(root, "kello/schema.ts"),
        `import { defineSchema, defineTable } from "kello/server"; import { extensions } from "./_generated/extensions";
import type { SQL } from "drizzle-orm";
const api = extensions.ltree;
const placement: ${JSON.stringify(placement)} = api.schema;
const version: "1.3" = api.version;
const nullable: SQL<number | null> = api.nlevel(null);
if (api.version !== "1.3" || api.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong virtual ltree binding");
void [placement, version, nullable];
function compileOnly() {
// @ts-expect-error Unselected families remain absent.
void extensions.citext;
// @ts-expect-error SQL NULL remains part of the public result contract.
const required: SQL<number> = nullable;
// @ts-expect-error lca has captured routines for 2 to 8 paths only.
api.lca("a");
void required;
}
void compileOnly;
export default defineSchema(() => ({ nodes: defineTable({ path: api.field().notNull(), tags: api.pathSetField(), history: api.arrayField(), pattern: api.queryField(), patterns: api.queryArrayField(), search: api.textQueryField(), searches: api.textQueryArrayField() }, { indexes: [
  { fields: ["path"], extension: api.indexes.btree() },
  { fields: ["path"], extension: api.indexes.hash() },
  { fields: ["path"], extension: api.indexes.gist({ siglen: 100 }) },
  { fields: ["tags"], extension: api.indexes.arrayGist({ siglen: 4 }) },
] }) }), { namespace: "app" });`,
      );
      await writeFile(
        join(component, "setup.ts"),
        'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "catalog", extensions: { ltree: { versions: ["1.3"] } }, rpc: ({ os }) => ({ os }) });',
      );
      await writeFile(
        join(root, "kello/app.config.ts"),
        'import { defineApplication } from "kello/server"; import catalog from "./components/catalog/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(catalog); export default app;',
      );
      await writeFile(
        join(component, "schema.ts"),
        `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "ltree" || extensions.ltree.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong virtual component subset");
extensions.ltree.nlevel("a.b");
export default defineSchema(() => ({}));`,
      );
      const result =
        'v.object({ version: v.literal("1.3"), placement: v.literal(' +
        JSON.stringify(placement) +
        "), depth: v.nullable(v.number()), ancestor: v.nullable(v.boolean()), common: v.nullable(v.string()), matched: v.nullable(v.boolean()), searched: v.nullable(v.boolean()), first: v.nullable(v.string()) })";
      await writeFile(
        join(component, "contracts/paths.ts"),
        `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${result}) });`,
      );
      await writeFile(
        join(root, "kello/contracts/tasks.ts"),
        `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.object({ root: ${result}, child: ${result} })) });`,
      );
      const nativeHandler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("Generated RPC and Effect ltree differ");
const version: "1.3" = binding.ltree.version;
const placement: ${JSON.stringify(placement)} = context.extensions.ltree.schema;
const api = binding.ltree;
const paths = { dimensions: [{ lowerBound: 1, length: 2 }], values: ["Top.Arts", "Top.Science"] };
const [row] = await context.db.select({
  depth: api.nlevel("Top.Science.Astronomy"),
  ancestor: api.isAncestor("Top", "Top.Science"),
  common: api.lca("Top.Science.Astronomy", "Top.Science.Physics"),
  matched: api.matches("Top.science", "*.Science@.*"),
  searched: api.search("Top.Science.Astronomy", "Astro*"),
  first: api.firstDescendant(paths, "Top.Science"),
}).from(sql.raw("(values (1)) fixture(id)"));
if (!row) throw new Error("Missing native ltree result");
const result = { ...row, version, placement };`;
      await writeFile(
        join(component, "functions/paths.ts"),
        `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server";
import { Effect } from "effect"; import { sql } from "drizzle-orm";
export default os.paths.router({ run: os.paths.run.handler(async ({ context }) => {
${nativeHandler}
// @ts-expect-error The mounted component receives only its declared host subset.
void context.extensions.pg_trgm;
return result; }) });`,
      );
      await writeFile(
        join(root, "kello/functions/tasks.ts"),
        `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server";
import { extensions } from "../_generated/extensions";
import { Effect } from "effect"; import { sql } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
${nativeHandler}
return { root: result, child: await context.components.catalog.rpc.paths.run() }; }) });
function compileOnly() {
// @ts-expect-error Unselected adapters remain absent from the generated root selection.
void import("../_generated/extensions").then(({ extensions }) => extensions.citext);
// @ts-expect-error Array operators take PostgreSqlArray, not a JavaScript array.
extensions.ltree.anyAncestor(["a"], "a");
}
void compileOnly;`,
      );
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      await assert.rejects(readFile(join(component, "_generated/extensions.ts")), { code: "ENOENT" });
      const first = await loadProject(root);
      expect(first.config.database.extensions?.ltree).toEqual({ version: "1.3", schema: placement });
      const virtual = projectRuntimeGraph(first).scopes.find((scope) => scope.name === "catalog");
      assert(virtual && "extensions" in virtual);
      expect(Object.keys(virtual.extensions!)).toEqual(["ltree"]);
      const generated = await generateProject(root);
      const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
      expect(source).toContain('from "kello/extensions/ltree"');
      expect(source).toContain("createLtree_1_3");
      expect(source).toContain(digest);
      for (const forbidden of ["citext", "../schema", "./server", "kello.config"])
        expect(source).not.toContain(forbidden);
      const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
      const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
      expect(server.extensions).toBe(disk.extensions);
      expect(Object.keys(disk.extensions)).toEqual(["ltree", "pg_trgm"]);
      const selected = disk.extensions.ltree;
      expect(selected.schema).toBe(placement);
      expect(selected.version).toBe("1.3");
      expect(Object.keys(selected.sql.functions)).toHaveLength(44);
      expect(Object.keys(selected.sql.operators)).toHaveLength(21);
      expect(selected.indexes.arrayGist({ siglen: 4 })).toMatchObject({
        schema: placement,
        member: "opclass:$extension:ltree.gist__ltree_ops/gist",
        input: { schema: placement, type: "ltree", dimensions: 1 },
        nullFreeElements: true,
        options: { siglen: 4 },
      });
      const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
      expect(Object.keys(child.extensions)).toEqual(["ltree"]);
      expect(child.extensions.ltree.schema).toBe(placement);
      await checkFixtureTypes(root);
      expect((await generateProject(root)).version).toBe(generated.version);
      const schema = (await import(pathToFileURL(join(root, "kello/schema.ts")).href)).default;
      expect(schema.metadata.extensionRequirements.map((entry: { member: string }) => entry.member).sort()).toEqual(
        [
          "opclass:$extension:ltree.gist__ltree_ops/gist",
          "opclass:$extension:ltree.gist_ltree_ops/gist",
          "opclass:$extension:ltree.hash_ltree_ops/hash",
          "opclass:$extension:ltree.ltree_ops/btree",
          "operator:$extension:ltree.<($extension:ltree.ltree,$extension:ltree.ltree)",
          "operator:$extension:ltree.<=($extension:ltree.ltree,$extension:ltree.ltree)",
          "operator:$extension:ltree.<>($extension:ltree.ltree,$extension:ltree.ltree)",
          "operator:$extension:ltree.=($extension:ltree.ltree,$extension:ltree.ltree)",
          "operator:$extension:ltree.>($extension:ltree.ltree,$extension:ltree.ltree)",
          "operator:$extension:ltree.>=($extension:ltree.ltree,$extension:ltree.ltree)",
          "type:$extension:ltree._lquery",
          "type:$extension:ltree._ltree",
          "type:$extension:ltree._ltxtquery",
          "type:$extension:ltree.lquery",
          "type:$extension:ltree.ltree",
          "type:$extension:ltree.ltxtquery",
        ].sort(),
      );
      await withExtensionDatabase(async (url) => {
        const client = new pg.Client({ connectionString: url });
        await client.connect();
        // SAFETY: The dynamically imported generated schema is untyped here; checkFixtureTypes owns its static types.
        const relations = defineRelations(schema.tables as {});
        const connection = await connectDatabase({ schema, relations, connectionString: url });
        try {
          await client.query(
            `CREATE SCHEMA ${pg.escapeIdentifier(placement)}; CREATE EXTENSION ltree WITH SCHEMA ${pg.escapeIdentifier(placement)} VERSION '1.3'`,
          );
          for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)))
            await client.query(statement);
          const classes = (
            await client.query(
              `select am.amname,c.opcname,n.nspname from pg_index i join pg_class t on t.oid=i.indrelid join pg_opclass c on c.oid=i.indclass[0] join pg_namespace n on n.oid=c.opcnamespace join pg_am am on am.oid=c.opcmethod where t.oid='app.nodes'::regclass and n.nspname=$1 order by am.amname,c.opcname`,
              [placement],
            )
          ).rows;
          expect(classes).toEqual([
            { amname: "btree", opcname: "ltree_ops", nspname: placement },
            { amname: "gist", opcname: "gist__ltree_ops", nspname: placement },
            { amname: "gist", opcname: "gist_ltree_ops", nspname: placement },
            { amname: "hash", opcname: "hash_ltree_ops", nspname: placement },
          ]);
          const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
          const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
          const handler = procedure.handler(async ({ context }) => {
            const effectBinding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
            expect(effectBinding).toBe(context.extensions);
            assert(effectBinding);
            const api = effectBinding.ltree;
            return connection.transaction(async (db) => {
              await db.insert(schema.tables.nodes).values([
                {
                  path: "Top.Science.Astronomy",
                  tags: { dimensions: [{ lowerBound: 1, length: 1 }], values: ["Shared"] },
                },
                { path: "Top.Arts", history: { dimensions: [{ lowerBound: 0, length: 2 }], values: ["Old", null] } },
              ]);
              return db
                .select({
                  path: schema.tables.nodes.path,
                  depth: api.nlevel(schema.tables.nodes.path),
                  tags: schema.tables.nodes.tags,
                  history: schema.tables.nodes.history,
                })
                .from(schema.tables.nodes)
                .where(api.isDescendant(schema.tables.nodes.path, "Top"))
                .orderBy(schema.tables.nodes.path);
            });
          });
          const invocation = { requestId: "selected-ltree", identity: null, signal: new AbortController().signal };
          const rows = await call(handler, undefined, {
            context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
          });
          expect(rows).toEqual([
            {
              path: "Top.Arts",
              depth: 2,
              tags: null,
              history: { dimensions: [{ lowerBound: 0, length: 2 }], values: ["Old", null] },
            },
            {
              path: "Top.Science.Astronomy",
              depth: 3,
              tags: { dimensions: [{ lowerBound: 1, length: 1 }], values: ["Shared"] },
              history: null,
            },
          ]);
        } finally {
          try {
            await connection.close();
          } finally {
            await client.end();
          }
        }
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  120000,
);
