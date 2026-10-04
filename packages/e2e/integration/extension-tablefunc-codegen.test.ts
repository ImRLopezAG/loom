import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect } from "bun:test";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { defineRelations } from "drizzle-orm";
import pg from "pg";
import * as v from "valibot";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import {
  bindRpcDatabaseProcedure,
  connectDatabase,
  createDatabaseMiddleware,
  createProjectProcedures,
  createProjectServices,
  defineSchema,
  Invocation,
  nestedQuery,
} from "kello/server";
import { textCodec } from "kello/extensions/tablefunc";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest } from "../fixtures/extension-proof";
import { tablefuncGenerationProofCase, tablefuncMembers, tablefuncRoutines } from "../fixtures/tablefunc-proof-cases";

const placement = "tablefunc_pivots";
const schemaSource = `(fields) => ({
  facts: { name: fields.text(), cat: fields.text().notNull(), val: fields.text() },
  tree: { node: fields.text().notNull(), parent: fields.text(), pos: fields.integer().notNull() },
})`;

async function projectFixture() {
  const root = await mkdtemp(join(tmpdir(), "loom-tablefunc-codegen-"));
  try {
    await initializeProject(root, "tablefuncselected");
    await mkdir(join(root, "node_modules"));
    for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    await writeFile(
      join(root, "kello/app.config.ts"),
      'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });',
    );
    return root;
  } catch (cause) {
    await rm(root, { recursive: true, force: true });
    throw cause;
  }
}

async function checkFixtureTypes(root: string) {
  const child = Bun.spawn(
    [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
    { stdout: "pipe", stderr: "pipe" },
  );
  const output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
  assert.equal(await child.exited, 0, output);
}

extensionProofTest(
  tablefuncGenerationProofCase,
  async () => {
    const root = await projectFixture();
    try {
      await writeFile(
        join(root, "kello.config.ts"),
        `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { tablefunc: { version: "1.0", schema: ${JSON.stringify(placement)} } } } });`,
      );
      await writeFile(
        join(root, "kello/schema.ts"),
        `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
// This executes at first load, while generated bindings exist only virtually.
const tablefunc = extensions.tablefunc;
if (Object.keys(extensions).join(",") !== "tablefunc") throw new Error("Wrong selected keys");
if (Object.keys(tablefunc.sql.overloads).length !== 11) throw new Error("Wrong tablefunc routine count");
if (Object.keys(tablefunc.sql.types).length !== 9) throw new Error("Wrong tablefunc type count");
tablefunc.normalRand(1, 0, 1, "samples");
const placement: ${JSON.stringify(placement)} = tablefunc.schema;
const version: "1.0" = tablefunc.version;
void [placement, version];
function compileOnly() {
// @ts-expect-error Unselected families remain absent.
void extensions.bloom;
// @ts-expect-error Raw SQL text is never a crosstab source.
tablefunc.crosstab2({ source: "select 1", alias: "p" });
}
void compileOnly;
export default defineSchema(${schemaSource}, { namespace: "app" });`,
      );
      await writeFile(
        join(root, "kello/functions/tasks.ts"),
        `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { Effect } from "effect";
import { textCodec } from "kello/extensions/tablefunc";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("RPC and Effect extensions differ");
const tree = binding.tablefunc.connectby({ relation: { schema: "app", name: "tree" }, key: "node", parent: "parent", start: "row1", maxDepth: 0, branchDelimiter: "/", keyCodec: textCodec, alias: "t" });
const rows = await context.db.select({ node: tree.columns.keyid, branch: tree.columns.branch }).from(tree.from);
// @ts-expect-error connectby has no pos column without orderBy.
void tree.columns.pos;
return rows.map((row) => row.branch);
}) });`,
      );
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      await loadProject(root);
      const generated = await generateProject(root);
      const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
      expect(source).toContain('import { createTablefunc_1_0 } from "kello/extensions/tablefunc";');
      for (const forbidden of ["bloom", "../schema", "./server", "kello.config"])
        expect(source).not.toContain(forbidden);
      const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
      const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
      expect(server.extensions).toBe(disk.extensions);
      expect(Object.keys(disk.extensions)).toEqual(["tablefunc"]);
      expect(Object.isFrozen(disk.extensions)).toBe(true);
      const tablefunc = disk.extensions.tablefunc;
      expect([tablefunc.name, tablefunc.version, tablefunc.schema]).toEqual(["tablefunc", "1.0", placement]);
      expect(tablefunc.apiSupport).toEqual({
        status: "verified",
        digest: "08f54e73281a2592eddf0ac6f555ba1a0b3c0961fb7ab6eab05be90ab74b66d4",
      });
      expect(Object.keys(tablefunc.sql.overloads).toSorted()).toEqual([...tablefuncRoutines].toSorted());
      expect([...Object.keys(tablefunc.sql.overloads), ...Object.keys(tablefunc.sql.types)].toSorted()).toEqual(
        [...tablefuncMembers].toSorted(),
      );
      await checkFixtureTypes(root);
      expect((await generateProject(root)).version).toBe(generated.version);
      const project = (await import(pathToFileURL(join(root, "kello/schema.ts")).href)).default;
      const schema = defineSchema(
        (fields) => ({
          facts: { name: fields.text(), cat: fields.text().notNull(), val: fields.text() },
          tree: { node: fields.text().notNull(), parent: fields.text(), pos: fields.integer().notNull() },
        }),
        { namespace: "app" },
      );
      expect(await migrationStatements(await emptySnapshot("app"), await createSnapshot(project))).toEqual(
        await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)),
      );
      const relations = defineRelations(schema.tables);
      await withExtensionDatabase(async (url) => {
        const oracle = new pg.Client({ connectionString: url });
        await oracle.connect();
        const connection = await connectDatabase({ schema, relations, connectionString: url });
        try {
          await oracle.query(
            `CREATE SCHEMA ${placement}; CREATE EXTENSION tablefunc WITH SCHEMA ${placement} VERSION '1.0'`,
          );
          for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)))
            await oracle.query(statement);
          await oracle.query(
            `INSERT INTO app.facts (name, cat, val) VALUES ('r1', 'a', 'x'), ('r1', 'b', 'y'), ('r2', 'a', 'z'), (NULL, 'a', 'n')`,
          );
          await oracle.query(
            `INSERT INTO app.tree (node, parent, pos) VALUES ('row1', NULL, 0), ('row2', 'row1', 1), ('row3', 'row1', 0)`,
          );
          const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
          const { procedure, validators } = createProjectProcedures(schema, relations, disk.extensions);
          const facts = validators.tables.facts.search({
            columns: ["name", "cat", "val"],
            filter: ["cat"],
            order: ["name", "cat"],
            scope: "public",
          });
          const handler = bindRpcDatabaseProcedure(
            procedure
              .use(createDatabaseMiddleware(relations, "read", schema, disk.extensions))
              .output(v.unknown())
              .handler(async ({ context }) => {
                const effect = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
                expect(effect).toBe(disk.extensions);
                expect(context.extensions).toBe(effect);
                const api = context.extensions.tablefunc;
                const pivot = api.crosstab2({
                  source: nestedQuery(facts, {
                    columns: { name: true, cat: true, val: true },
                    orderBy: [
                      { field: "name", direction: "asc" },
                      { field: "cat", direction: "asc" },
                    ],
                  }),
                  alias: "pivot",
                });
                const tree = api.sql.functions.connectby({
                  relation: { schema: "app", name: "tree" },
                  key: "node",
                  parent: "parent",
                  orderBy: "pos",
                  start: "row1",
                  maxDepth: 0,
                  branchDelimiter: "/",
                  keyCodec: textCodec,
                  alias: "t",
                });
                const samples = api.normalRand(3, 7, 0, "samples");
                return {
                  pivot: await context.db.select(pivot.columns).from(pivot.from),
                  tree: await context.db.select(tree.columns).from(tree.from),
                  samples: await context.db.select(samples.columns).from(samples.from),
                };
              }),
            {
              connection,
              replay: { metadataNamespace: "loom_unused", deployment: "tablefunc-generation" },
              authorize: async () => {},
            },
          );
          const invocation = {
            requestId: "tablefunc-generation",
            identity: null,
            signal: new AbortController().signal,
          };
          const result = await call(handler, undefined, {
            context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
          });
          const native = async (statement: string) => (await oracle.query(statement)).rows;
          expect(result).toEqual({
            pivot: await native(
              `SELECT * FROM ${placement}.crosstab2('select name, cat, val from app.facts order by 1, 2')`,
            ),
            tree: await native(
              `SELECT * FROM ${placement}.connectby('app.tree', 'node', 'parent', 'pos', 'row1', 0, '/') AS t(keyid text, parent_keyid text, level int4, branch text, pos int4)`,
            ),
            samples: await native(`SELECT * FROM ${placement}.normal_rand(3, 7, 0) AS samples(value)`),
          });
        } finally {
          try {
            await connection.close();
          } finally {
            await oracle.end();
          }
        }
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  90000,
);
