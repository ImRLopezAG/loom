import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, symlink, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect } from "bun:test";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { defineRelations, sql } from "drizzle-orm";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { createProjectProcedures, createProjectServices, Invocation, connectDatabase } from "kello/server";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import pg from "pg";
import * as v from "valibot";
import { extensionProofTest } from "../fixtures/extension-proof";
import { semverGenerationProofCase } from "../fixtures/semver-proof-cases";
import { projectRuntimeGraph } from "../../../apps/loom/src/tooling/project/runtime-graph";
import { withExtensionDatabase } from "../fixtures/extension-database";

/** Kello config admits plain identifiers; this custom placement is not on any default search_path. */
const placement = "semver_tools";

async function projectFixture() {
  const root = await mkdtemp(join(tmpdir(), "loom-selected-semver-"));
  try {
    await initializeProject(root, "selectedsemver");
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
  semverGenerationProofCase,
  async () => {
    const root = await projectFixture();
    try {
      const component = join(root, "kello/components/releases");
      await mkdir(join(component, "contracts"), { recursive: true });
      await mkdir(join(component, "functions"));
      await writeFile(
        join(root, "kello.config.ts"),
        `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { semver: { version: "0.40.0", schema: ${JSON.stringify(placement)} }, pg_trgm: { version: "1.6", schema: "host_text" } } } });`,
      );
      await writeFile(
        join(root, "kello/schema.ts"),
        `import { defineSchema, defineTable } from "kello/server"; import { extensions } from "./_generated/extensions";
import type { SQL } from "drizzle-orm";
const api = extensions.semver;
const placement: ${JSON.stringify(placement)} = api.schema;
const version: "0.40.0" = api.version;
const nullable: SQL<number | null> = api.major(null);
if (api.version !== "0.40.0" || api.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong virtual semver binding");
void [placement, version, nullable];
function compileOnly() {
// @ts-expect-error Unselected families remain absent.
void extensions.citext;
// @ts-expect-error SQL NULL remains part of the public result contract.
const required: SQL<number> = nullable;
void required;
}
void compileOnly;
export default defineSchema((fields) => ({ entries: defineTable({ value: api.field(), history: api.arrayField(), supported: api.rangeField(), windows: api.rangeArrayField(), compatible: api.multirangeField(), matrix: api.multirangeArrayField() }, { indexes: [
  { fields: ["value"], extension: api.indexes.btree() },
  { fields: ["value"], extension: api.indexes.hash() },
] }) }), { namespace: "app" });`,
      );
      await writeFile(
        join(component, "setup.ts"),
        'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "releases", extensions: { semver: { versions: ["0.40.0"] } }, rpc: ({ os }) => ({ os }) });',
      );
      await writeFile(
        join(root, "kello/app.config.ts"),
        'import { defineApplication } from "kello/server"; import releases from "./components/releases/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(releases); export default app;',
      );
      await writeFile(
        join(component, "schema.ts"),
        `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "semver" || extensions.semver.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong virtual component subset");
extensions.semver.major(extensions.semver.parse("1.2.3"));
export default defineSchema(() => ({}));`,
      );
      const span =
        'v.variant("empty", [v.object({ empty: v.literal(true) }), v.object({ empty: v.literal(false), lower: v.nullable(v.string()), upper: v.nullable(v.string()), lowerInclusive: v.boolean(), upperInclusive: v.boolean() })])';
      const result =
        'v.object({ version: v.literal("0.40.0"), placement: v.literal(' +
        JSON.stringify(placement) +
        `), major: v.nullable(v.number()), compare: v.nullable(v.number()), larger: v.nullable(v.string()), coerced: v.nullable(v.string()), compatible: v.nullable(v.array(${span})) })`;
      await writeFile(
        join(component, "contracts/normalization.ts"),
        `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${result}) });`,
      );
      await writeFile(
        join(root, "kello/contracts/tasks.ts"),
        `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; export default defineContract({ list: oc.output(v.object({ root: ${result}, child: ${result} })) });`,
      );
      const nativeHandler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("Generated RPC and Effect semver differ");
const version: "0.40.0" = binding.semver.version;
const placement: ${JSON.stringify(placement)} = context.extensions.semver.schema;
const api = binding.semver;
const [row] = await context.db.select({
  major: api.major(api.parse("1.2.3-rc.1")),
  compare: api.compare("1.0.0-rc.1", "1.0.0"),
  larger: api.larger("1.0.0+a", "2.0.0"),
  coerced: api.coerce("1.2"),
  compatible: api.multirange(api.range("2.0.0", "3.0.0"), api.range("1.0.0", "2.0.0")),
}).from(sql.raw("(values (1)) fixture(id)"));
if (!row) throw new Error("Missing native semver result");
// Decoded multiranges are readonly; the oRPC contract input is a mutable valibot array.
const result = { ...row, compatible: row.compatible && [...row.compatible], version, placement };`;
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
return { root: result, child: await context.components.releases.rpc.normalization.run() }; }) });
function compileOnly() {
// @ts-expect-error Unselected adapters remain absent from the generated root selection.
void import("../_generated/extensions").then(({ extensions }) => extensions.citext);
// @ts-expect-error Non-canonical semver text is rejected by the branded input.
extensions.semver.equal(1, extensions.semver.parse("1.0.0"));
}
void compileOnly;`,
      );
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      await assert.rejects(readFile(join(component, "_generated/extensions.ts")), { code: "ENOENT" });
      const first = await loadProject(root);
      expect(first.config.database.extensions?.semver).toEqual({ version: "0.40.0", schema: placement });
      const virtual = projectRuntimeGraph(first).scopes.find((scope) => scope.name === "releases");
      assert(virtual && "extensions" in virtual);
      expect(Object.keys(virtual.extensions!)).toEqual(["semver"]);
      const generated = await generateProject(root);
      const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
      expect(source).toContain('from "kello/extensions/semver"');
      expect(source).toContain("createSemver_0_40_0");
      expect(source).toContain("5a21997dcf96a0af38e49bc1d9309905050a05f18e6afe15f37fb2a63722a86e");
      for (const forbidden of ["citext", "../schema", "./server", "kello.config"])
        expect(source).not.toContain(forbidden);
      const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
      const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
      expect(server.extensions).toBe(disk.extensions);
      expect(Object.keys(disk.extensions)).toEqual(["pg_trgm", "semver"]);
      const selected = disk.extensions.semver;
      expect(selected.schema).toBe(placement);
      expect(selected.version).toBe("0.40.0");
      expect(Object.keys(selected.sql.overloads)).toHaveLength(47);
      expect(Object.keys(selected.sql.operators)).toHaveLength(6);
      expect(Object.keys(selected.sql.functions)).toHaveLength(23);
      expect(Object.keys(selected.sql.casts)).toHaveLength(9);
      for (const method of ["btree", "hash"] as const)
        expect(selected.indexes[method]()).toMatchObject({
          schema: placement,
          member: `opclass:$extension:semver.semver_ops/${method}`,
          method,
        });
      const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
      expect(Object.keys(child.extensions)).toEqual(["semver"]);
      expect(child.extensions.semver.schema).toBe(placement);
      await checkFixtureTypes(root);
      expect((await generateProject(root)).version).toBe(generated.version);
      const schema = (await import(pathToFileURL(join(root, "kello/schema.ts")).href)).default;
      expect(schema.metadata.extensionRequirements.map((entry: { member: string }) => entry.member).sort()).toEqual(
        [
          "opclass:$extension:semver.semver_ops/btree",
          "opclass:$extension:semver.semver_ops/hash",
          "operator:$extension:semver.<($extension:semver.semver,$extension:semver.semver)",
          "operator:$extension:semver.<=($extension:semver.semver,$extension:semver.semver)",
          "operator:$extension:semver.<>($extension:semver.semver,$extension:semver.semver)",
          "operator:$extension:semver.=($extension:semver.semver,$extension:semver.semver)",
          "operator:$extension:semver.>($extension:semver.semver,$extension:semver.semver)",
          "operator:$extension:semver.>=($extension:semver.semver,$extension:semver.semver)",
          "type:$extension:semver._semver",
          "type:$extension:semver._semvermultirange",
          "type:$extension:semver._semverrange",
          "type:$extension:semver.semver",
          "type:$extension:semver.semvermultirange",
          "type:$extension:semver.semverrange",
        ].sort(),
      );
      await withExtensionDatabase(async (url) => {
        const client = new pg.Client({ connectionString: url });
        await client.connect();
        // SAFETY: checkFixtureTypes validated the generated tables above; this assertion narrows the dynamic import
        // only for Drizzle's generic inference. connectDatabase still verifies the actual compiled table identities.
        const relations = defineRelations(schema.tables as {});
        const connection = await connectDatabase({ schema, relations, connectionString: url });
        try {
          await client.query(
            `CREATE SCHEMA ${pg.escapeIdentifier(placement)}; CREATE EXTENSION semver WITH SCHEMA ${pg.escapeIdentifier(placement)} VERSION '0.40.0'`,
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
            { amname: "btree", opcname: "semver_ops", nspname: placement },
            { amname: "hash", opcname: "semver_ops", nspname: placement },
          ]);
          const effectlessApi = disk.extensions.semver;
          const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
          const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
          const handler = procedure.handler(async ({ context }) => {
            const effectBinding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
            expect(effectBinding).toBe(context.extensions);
            assert(effectBinding);
            const api = effectBinding.semver;
            return connection.transaction(async (db) => {
              await db.insert(schema.tables.entries).values({
                value: "1.2.3-rc.1+build",
                history: { dimensions: [{ lowerBound: 1, length: 2 }], values: ["1.0.0", null] },
                supported: api.range("1.0.0", "2.0.0"),
                compatible: [
                  { empty: false, lower: "1.0.0", upper: "2.0.0", lowerInclusive: true, upperInclusive: false },
                ],
              });
              return db
                .select({
                  value: schema.tables.entries.value,
                  history: schema.tables.entries.history,
                  major: api.major(schema.tables.entries.value),
                  compatible: schema.tables.entries.compatible,
                })
                .from(schema.tables.entries)
                .where(api.equal(schema.tables.entries.value, "1.2.3-rc.1"));
            });
          });
          const invocation = { requestId: "selected-semver", identity: null, signal: new AbortController().signal };
          const rows = await call(handler, undefined, {
            context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
          });
          // The numeric constructors are SQL wrappers over unqualified to_semver. Each ordinary statement runs on its
          // own boundary outside the placement's search_path and reports 42883; no transaction catches it.
          for (const numeric of [
            effectlessApi.fromInt4(1),
            effectlessApi.fromInt8(1n),
            effectlessApi.sql.casts.numeric_to_semver("1.5"),
          ])
            await assert.rejects(
              connection.db.select({ value: numeric }).from(sql.raw("(values (1)) fixture(id)")),
              (error: Error) => v.is(v.object({ code: v.literal("42883") }), error.cause),
            );
          expect(rows).toEqual([
            {
              value: "1.2.3-rc.1+build",
              history: { dimensions: [{ lowerBound: 1, length: 2 }], values: ["1.0.0", null] },
              major: 1,
              compatible: [
                { empty: false, lower: "1.0.0", upper: "2.0.0", lowerInclusive: true, upperInclusive: false },
              ],
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
