import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, symlink, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect } from "bun:test";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { sql } from "drizzle-orm";
import { defineConfig, generateProject, initializeProject, loadProject } from "kello/tooling";
import { createProjectProcedures, createProjectServices, Invocation, connectDatabase } from "kello/server";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import pg from "pg";
import { extensionProofTest } from "../fixtures/extension-proof";
import { prefixGenerationProofCase, prefixProofSchema } from "../fixtures/prefix-proof-cases";
import { projectRuntimeGraph } from "../../../apps/loom/src/tooling/project/runtime-graph";
import { withExtensionDatabase } from "../fixtures/extension-database";

const placement = "prefix_ranges";

async function projectFixture() {
  const root = await mkdtemp(join(tmpdir(), "loom-selected-prefix-"));
  try {
    await initializeProject(root, "selectedprefix");
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
  prefixGenerationProofCase,
  async () => {
    expect(
      defineConfig({ database: { extensions: { prefix: { version: "1.2.0", schema: prefixProofSchema } } } }).database
        .extensions.prefix?.schema,
    ).toBe(prefixProofSchema);
    const root = await projectFixture();
    try {
      const component = join(root, "kello/components/ranges");
      await mkdir(join(component, "contracts"), { recursive: true });
      await mkdir(join(component, "functions"));
      await writeFile(
        join(root, "kello.config.ts"),
        `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { prefix: { version: "1.2.0", schema: ${JSON.stringify(placement)} }, pg_trgm: { version: "1.6", schema: "host_text" } } } });`,
      );
      await writeFile(
        join(root, "kello/schema.ts"),
        `import { defineSchema, defineTable } from "kello/server"; import { extensions } from "./_generated/extensions";
import type { SQL } from "drizzle-orm";
const api = extensions.prefix;
const placement: ${JSON.stringify(placement)} = api.schema;
const version: "1.2.0" = api.version;
const nullable: SQL<number | null> = api.length(null);
if (api.version !== "1.2.0" || api.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong virtual prefix binding");
void [placement, version, nullable];
function compileOnly() {
// @ts-expect-error Unselected families remain absent.
void extensions.citext;
// @ts-expect-error SQL NULL remains part of the public result contract.
const required: SQL<number> = nullable;
void required;
}
void compileOnly;
export default defineSchema((fields) => ({ entries: defineTable({ value: api.field(), tags: api.arrayField() }, { indexes: [
  { fields: ["value"], extension: api.indexes.btree() },
  { fields: ["value"], extension: api.indexes.gist() },
] }) }), { namespace: "app" });`,
      );
      await writeFile(
        join(root, "kello/relations.ts"),
        'import { defineRelations } from "drizzle-orm"; import schema from "./schema"; export default defineRelations(schema.tables);',
      );
      await writeFile(
        join(component, "setup.ts"),
        'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "ranges", extensions: { prefix: { versions: ["1.2.0"] } }, rpc: ({ os }) => ({ os }) });',
      );
      await writeFile(
        join(root, "kello/app.config.ts"),
        'import { defineApplication } from "kello/server"; import ranges from "./components/ranges/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(ranges); export default app;',
      );
      await writeFile(
        join(component, "schema.ts"),
        `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "prefix" || extensions.prefix.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong virtual component subset");
extensions.prefix.length(extensions.prefix.fromText("123"));
export default defineSchema(() => ({}));`,
      );
      const result =
        'v.object({ version: v.literal("1.2.0"), placement: v.literal(' +
        JSON.stringify(placement) +
        "), length: v.nullable(v.number()), contains: v.nullable(v.boolean()), union: v.nullable(v.string()) })";
      await writeFile(
        join(component, "contracts/normalization.ts"),
        `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${result}) });`,
      );
      await writeFile(
        join(root, "kello/contracts/tasks.ts"),
        `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.object({ root: ${result}, child: ${result} })) });`,
      );
      const nativeHandler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("Generated RPC and Effect prefix differ");
const version: "1.2.0" = binding.prefix.version;
const placement: ${JSON.stringify(placement)} = context.extensions.prefix.schema;
const api = binding.prefix;
const [row] = await context.db.select({
  length: api.length(api.fromText("1234")),
  contains: api.contains(api.fromText("123[4-6]"), api.fromText("1234")),
  union: api.union(api.fromText("123"), api.fromText("1234")),
}).from(sql.raw("(values (1)) fixture(id)"));
if (!row) throw new Error("Missing native prefix result");
const result = { ...row, version, placement };`;
      await writeFile(
        join(component, "functions/normalization.ts"),
        `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server";
import { Effect } from "effect"; import { sql, type SQL } from "drizzle-orm";
export default os.normalization.router({ run: os.normalization.run.handler(async ({ context }) => {
${nativeHandler}
// @ts-expect-error The mounted component receives only its declared host subset.
void context.extensions.pg_trgm;
return result; }) });`,
      );
      await writeFile(
        join(root, "kello/functions/tasks.ts"),
        `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server";
import { extensions } from "../_generated/extensions";
import { Effect } from "effect"; import { sql, type SQL } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
${nativeHandler}
return { root: result, child: await context.components.ranges.rpc.normalization.run() }; }) });
function compileOnly() {
// @ts-expect-error Unselected adapters remain absent from the generated root selection.
void import("../_generated/extensions").then(({ extensions }) => extensions.citext);
// @ts-expect-error Native text cannot substitute for a branded prefix_range value.
extensions.prefix.equal("123", extensions.prefix.fromText("123"));
}
void compileOnly;`,
      );
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      await assert.rejects(readFile(join(component, "_generated/extensions.ts")), { code: "ENOENT" });
      const first = await loadProject(root);
      expect(first.config.database.extensions?.prefix).toEqual({ version: "1.2.0", schema: placement });
      const virtual = projectRuntimeGraph(first).scopes.find((scope) => scope.name === "ranges");
      assert(virtual && "extensions" in virtual);
      expect(Object.keys(virtual.extensions!)).toEqual(["prefix"]);
      const generated = await generateProject(root);
      const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
      expect(source).toContain('from "kello/extensions/prefix"');
      expect(source).toContain("createPrefix_1_2_0");
      for (const forbidden of ["citext", "../schema", "./server", "kello.config"])
        expect(source).not.toContain(forbidden);
      const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
      const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
      expect(server.extensions).toBe(disk.extensions);
      expect(Object.keys(disk.extensions)).toEqual(["pg_trgm", "prefix"]);
      expect(disk.extensions.prefix.schema).toBe(placement);
      expect(disk.extensions.prefix.version).toBe("1.2.0");
      expect(Object.keys(disk.extensions.prefix.sql.overloads)).toHaveLength(33);
      expect(Object.keys(disk.extensions.prefix.sql.operators)).toHaveLength(11);
      expect(Object.keys(disk.extensions.prefix.sql.functions)).toHaveLength(19);
      expect(disk.extensions.prefix.indexes.btree()).toMatchObject({
        schema: placement,
        member: "opclass:$extension:prefix.btree_prefix_range_ops/btree",
        method: "btree",
      });
      expect(disk.extensions.prefix.indexes.gist()).toMatchObject({
        schema: placement,
        member: "opclass:$extension:prefix.gist_prefix_range_ops/gist",
        method: "gist",
      });
      const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
      expect(Object.keys(child.extensions)).toEqual(["prefix"]);
      expect(child.extensions.prefix.schema).toBe(placement);
      await checkFixtureTypes(root);
      expect((await generateProject(root)).version).toBe(generated.version);
      const schema = (await import(pathToFileURL(join(root, "kello/schema.ts")).href)).default;
      expect(schema.metadata.extensionRequirements.map((entry: { member: string }) => entry.member).sort()).toEqual(
        [
          "opclass:$extension:prefix.btree_prefix_range_ops/btree",
          "opclass:$extension:prefix.gist_prefix_range_ops/gist",
          "operator:$extension:prefix.<>($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
          "operator:$extension:prefix.=($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
          "type:$extension:prefix._prefix_range",
          "type:$extension:prefix.prefix_range",
        ].sort(),
      );
      await withExtensionDatabase(async (url) => {
        const client = new pg.Client({ connectionString: url });
        await client.connect();
        try {
          const relations = (await import(pathToFileURL(join(root, "kello/relations.ts")).href)).default;
          const connection = await connectDatabase({ schema, relations, connectionString: url });
          try {
            await client.query(
              `CREATE SCHEMA ${pg.escapeIdentifier(placement)}; CREATE EXTENSION prefix WITH SCHEMA ${pg.escapeIdentifier(placement)} VERSION '1.2.0'`,
            );
            for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema)))
              await client.query(statement);
            const classes = (
              await client.query(
                `select am.amname,c.opcname,n.nspname from pg_index i join pg_class t on t.oid=i.indrelid join pg_opclass c on c.oid=i.indclass[0] join pg_namespace n on n.oid=c.opcnamespace join pg_am am on am.oid=c.opcmethod where t.oid='app.entries'::regclass and n.nspname=$1 order by am.amname`,
                [placement],
              )
            ).rows;
            expect(classes).toEqual([
              { amname: "btree", opcname: "btree_prefix_range_ops", nspname: placement },
              { amname: "gist", opcname: "gist_prefix_range_ops", nspname: placement },
            ]);
            const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
            const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
            const handler = procedure.handler(async ({ context }) => {
              const effectBinding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
              expect(effectBinding).toBe(context.extensions);
              const api = effectBinding.prefix;
              return connection.transaction((db) =>
                db
                  .select({
                    length: api.length(api.fromText("1234")),
                    contains: api.contains(api.fromText("123[4-6]"), api.fromText("1234")),
                    union: api.union(api.fromText("123"), api.fromText("1234")),
                  })
                  .from(sql`(values (1)) fixture(id)`),
              );
            });
            const invocation = { requestId: "selected-prefix", identity: null, signal: new AbortController().signal };
            const [row] = await call(handler, undefined, {
              context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
            });
            expect(row).toEqual({ length: 4, contains: true, union: "123" });
          } finally {
            await connection.close();
          }
        } finally {
          await client.end();
        }
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  120000,
);
