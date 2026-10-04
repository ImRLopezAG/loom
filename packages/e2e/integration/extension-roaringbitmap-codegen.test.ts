import { createHash, randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, symlink, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect } from "bun:test";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import { defineRelations } from "drizzle-orm";
import {
  bootstrapDatabase,
  createSnapshot,
  emptySnapshot,
  generateProject,
  initializeProject,
  inspectSnapshot,
  loadProject,
  planMigration,
} from "kello/tooling";
import { connectDatabase, createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import pg from "pg";
import * as v from "valibot";
import { extensionProofTest } from "../fixtures/extension-proof";
import { roaringbitmapGenerationProofCase } from "../fixtures/roaringbitmap-proof-cases";
import { projectRuntimeGraph } from "../../../apps/loom/src/tooling/project/runtime-graph";
import { withExtensionDatabase } from "../fixtures/extension-database";

/** Kello config admits plain identifiers; this custom placement is not on any default search_path. */
const placement = "bitmap_tools";
const digest = "967ad98be988b37be7f198057e9f02bcbe325a0eab5364722ba4c6763cbc406a";

async function projectFixture() {
  const root = await mkdtemp(join(tmpdir(), "loom-selected-roaringbitmap-"));
  try {
    await initializeProject(root, "selectedroaringbitmap");
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
  roaringbitmapGenerationProofCase,
  async () => {
    const root = await projectFixture();
    try {
      const component = join(root, "kello/components/segments");
      await mkdir(join(component, "contracts"), { recursive: true });
      await mkdir(join(component, "functions"));
      await writeFile(
        join(root, "kello.config.ts"),
        `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { roaringbitmap: { version: "1.2", schema: ${JSON.stringify(placement)} }, pg_trgm: { version: "1.6", schema: "host_text" } } } });`,
      );
      await writeFile(
        join(root, "kello/schema.ts"),
        `import { defineSchema, defineTable } from "kello/server"; import { extensions } from "./_generated/extensions";
import type { SQL } from "drizzle-orm";
import type { PostgreSqlArray, RoaringBitmap, RoaringBitmap64 } from "kello/extensions/roaringbitmap";
const api = extensions.roaringbitmap;
const placement: ${JSON.stringify(placement)} = api.schema;
const version: "1.2" = api.version;
const cardinality: SQL<bigint | null> = api.sql.functions.rb_cardinality([1, -1]);
const directCardinality: SQL<bigint | null> = api.cardinality([1, -1]);
const directCardinality64: SQL<bigint | null> = api.bitmap64.cardinality([1n, -1n]);
const union: SQL<RoaringBitmap | null> = api.sql.operators.roaringbitmap.or([1], [2]);
const wide: SQL<RoaringBitmap64 | null> = api.sql.functions.rb64_add.bitmapElement([-1n], 4294967296n);
const members: SQL<PostgreSqlArray<number> | null> = api.sql.functions.rb_to_array([1]);
if (api.version !== "1.2" || api.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong virtual roaringbitmap binding");
void [placement, version, cardinality, directCardinality, directCardinality64, union, wide, members];
function compileOnly() {
// @ts-expect-error Unselected families remain absent.
void extensions.citext;
// @ts-expect-error SQL NULL remains part of the public result contract.
const required: SQL<bigint> = cardinality;
// @ts-expect-error 32-bit bitmaps take int4 numbers, not bigint members.
api.sql.functions.rb_add.bitmapElement([1n], 1);
// @ts-expect-error Bitmap aggregates have no DISTINCT: the types have no btree/hash opclass.
void api.sql.functions.rb_or_agg.distinct;
void required;
}
void compileOnly;
export default defineSchema(() => ({ bitmaps: defineTable({ bits: api.field(), bits64: api.field64(), history: api.arrayField(), history64: api.array64Field() }) }), { namespace: "app" });`,
      );
      await writeFile(
        join(component, "setup.ts"),
        'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "segments", extensions: { roaringbitmap: { versions: ["1.2"] } }, rpc: ({ os }) => ({ os }) });',
      );
      await writeFile(
        join(root, "kello/app.config.ts"),
        'import { defineApplication } from "kello/server"; import segments from "./components/segments/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(segments); export default app;',
      );
      await writeFile(
        join(component, "schema.ts"),
        `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
if (Object.keys(extensions).join(",") !== "roaringbitmap" || extensions.roaringbitmap.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong virtual component subset");
extensions.roaringbitmap.sql.functions.rb_cardinality([1]);
export default defineSchema(() => ({}));`,
      );
      const result =
        'v.object({ version: v.literal("1.2"), placement: v.literal(' +
        JSON.stringify(placement) +
        "), union: v.nullable(v.array(v.number())), cardinality: v.nullable(v.bigint()), wide: v.nullable(v.array(v.bigint())), contains: v.nullable(v.boolean()), jaccard: v.nullable(v.number()), members: v.nullable(members), ordinarySearchPath: v.string() })";
      const arraySchema = `type ArrayValues = readonly (number | null | ArrayValues)[];
const values: v.GenericSchema<ArrayValues> = v.lazy(() => v.array(v.union([v.number(), v.null(), values])));
const members: v.GenericSchema<{ readonly dimensions: readonly { readonly lowerBound: number; readonly length: number }[]; readonly values: ArrayValues }> = v.object({ dimensions: v.array(v.object({ lowerBound: v.number(), length: v.number() })), values });`;
      await writeFile(
        join(component, "contracts/segments.ts"),
        `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; ${arraySchema} export default defineContract({ run: oc.output(${result}) });`,
      );
      await writeFile(
        join(root, "kello/contracts/tasks.ts"),
        `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; ${arraySchema} export default defineContract({ list: oc.output(v.object({ root: ${result}, child: ${result} })) });`,
      );
      // rb_shiftleft is a SQL-language body over unqualified rb_shiftright: an ordinary query outside the placement's
      // search_path reports 42883, which the handler returns instead of hiding.
      const nativeHandler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("Generated RPC and Effect roaringbitmap differ");
const version: "1.2" = binding.roaringbitmap.version;
const placement: ${JSON.stringify(placement)} = context.extensions.roaringbitmap.schema;
const api = binding.roaringbitmap;
const [row] = await context.db.select({
  union: api.sql.functions.rb_or([1, -1], [2]),
  cardinality: api.cardinality([1, 2, 3]),
  wide: api.bitmap64.add.bitmapElement([-1n], 4294967296n),
  contains: api.sql.operators.roaringbitmap.containsElement([1, 2], 2),
  jaccard: api.sql.functions.rb_jaccard_dist([1, 2], [2, 3]),
  members: api.sql.functions.rb_to_array([3, -1, 1]),
}).from(sql.raw("(values (1)) fixture(id)"));
if (!row) throw new Error("Missing native roaringbitmap result");
// A savepoint scopes the expected native failure, so the invocation transaction stays usable.
const ordinarySearchPath = await context.db.transaction((tx) => tx.select({ value: api.sql.functions.rb_shiftleft([5], 1n) }).from(sql.raw("(values (1)) fixture(id)"))).then(
  () => "resolved",
  (error: { readonly cause?: { readonly code?: string } }) => error.cause?.code ?? "unknown",
);
if (typeof row.jaccard !== "number" && row.jaccard !== null) throw new Error("Unexpected nonfinite Jaccard index");
const result = { ...row, jaccard: row.jaccard, version, placement, ordinarySearchPath };`;
      await writeFile(
        join(component, "functions/segments.ts"),
        `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server";
import { Effect } from "effect"; import { sql } from "drizzle-orm";
export default os.segments.router({ run: os.segments.run.handler(async ({ context }) => {
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
return { root: result, child: await context.components.segments.rpc.segments.run() }; }) });
function compileOnly() {
// @ts-expect-error int8 bitmaps take bigint members.
extensions.roaringbitmap.sql.functions.rb64_contains.element([1n], 1);
}
void compileOnly;`,
      );
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      await assert.rejects(readFile(join(component, "_generated/extensions.ts")), { code: "ENOENT" });
      const first = await loadProject(root);
      expect(first.config.database.extensions?.roaringbitmap).toEqual({ version: "1.2", schema: placement });
      const virtual = projectRuntimeGraph(first).scopes.find((scope) => scope.name === "segments");
      assert(virtual && "extensions" in virtual);
      expect(Object.keys(virtual.extensions!)).toEqual(["roaringbitmap"]);
      const generated = await generateProject(root);
      const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
      expect(source).toContain('from "kello/extensions/roaringbitmap"');
      expect(source).toContain("createRoaringbitmap_1_2");
      expect(source).toContain(digest);
      for (const forbidden of ["citext", "kello/tooling", "../schema", "./server", "kello.config"])
        expect(source).not.toContain(forbidden);
      const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
      const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
      expect(server.extensions).toBe(disk.extensions);
      expect(Object.keys(disk.extensions)).toEqual(["pg_trgm", "roaringbitmap"]);
      const selected = disk.extensions.roaringbitmap;
      expect(selected.schema).toBe(placement);
      expect(selected.version).toBe("1.2");
      expect(selected.apiSupport).toEqual({ status: "verified", digest });
      expect(Object.keys(selected.sql.overloads)).toHaveLength(132);
      expect(Object.keys(selected.sql.functions)).toHaveLength(88);
      expect(Object.keys(selected.sql.casts)).toHaveLength(6);
      expect(Object.keys(selected.sql.operators.roaringbitmap)).toHaveLength(16);
      expect(Object.keys(selected.sql.operators.roaringbitmap64)).toHaveLength(16);
      const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
      expect(Object.keys(child.extensions)).toEqual(["roaringbitmap"]);
      expect(child.extensions.roaringbitmap.schema).toBe(placement);
      await checkFixtureTypes(root);
      expect((await generateProject(root)).version).toBe(generated.version);
      const { runtimeOptions } = await import(
        pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href
      );
      const options = runtimeOptions();
      const mounted = options.scopes.find((scope: { name: string }) => scope.name === "segments");
      expect(Object.keys(mounted.extensions)).toEqual(["roaringbitmap"]);
      const schema = (await import(pathToFileURL(join(root, "kello/schema.ts")).href)).default;
      expect(schema.metadata.extensionRequirements.map((entry: { member: string }) => entry.member).sort()).toEqual(
        [
          // Equality filters on the scalar fields require the captured = and <> operators.
          "operator:$extension:roaringbitmap.<>($extension:roaringbitmap.roaringbitmap,$extension:roaringbitmap.roaringbitmap)",
          "operator:$extension:roaringbitmap.<>($extension:roaringbitmap.roaringbitmap64,$extension:roaringbitmap.roaringbitmap64)",
          "operator:$extension:roaringbitmap.=($extension:roaringbitmap.roaringbitmap,$extension:roaringbitmap.roaringbitmap)",
          "operator:$extension:roaringbitmap.=($extension:roaringbitmap.roaringbitmap64,$extension:roaringbitmap.roaringbitmap64)",
          "type:$extension:roaringbitmap._roaringbitmap",
          "type:$extension:roaringbitmap._roaringbitmap64",
          "type:$extension:roaringbitmap.roaringbitmap",
          "type:$extension:roaringbitmap.roaringbitmap64",
        ].sort(),
      );
      await withExtensionDatabase(async (url) => {
        const client = new pg.Client({ connectionString: url });
        await client.connect();
        const runtimeRole = `gen_roaring_${crypto.randomUUID().replaceAll("-", "")}`;
        const roleOutput = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
        if (roleOutput)
          appendFileSync(
            roleOutput,
            JSON.stringify({
              runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
              name: runtimeRole,
              sha256: createHash("sha256").update(runtimeRole).digest("hex"),
            }) + "\n",
            { mode: 0o600 },
          );
        let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
        // SAFETY: the dynamically imported generated schema is untyped here; checkFixtureTypes owns its static types.
        const relations = defineRelations(schema.tables as {});
        let connection: Awaited<ReturnType<typeof connectDatabase>> | undefined;
        try {
          await client.query(
            `CREATE SCHEMA ${pg.escapeIdentifier(placement)}; CREATE EXTENSION roaringbitmap WITH SCHEMA ${pg.escapeIdentifier(placement)} VERSION '1.2'`,
          );
          // The public migration planner emits the generated schema's DDL; the database then reports the same snapshot.
          const plan = await planMigration(await emptySnapshot("app"), schema);
          for (const statement of plan.statements) await client.query(statement);
          const columns = (
            await client.query(
              `select a.attname, n.nspname, t.typname from pg_attribute a join pg_type t on t.oid=a.atttypid join pg_namespace n on n.oid=t.typnamespace
               where a.attrelid='app.bitmaps'::regclass and a.attname in ('bits','bits64','history','history64') order by a.attname`,
            )
          ).rows;
          expect(columns).toEqual([
            { attname: "bits", nspname: placement, typname: "roaringbitmap" },
            { attname: "bits64", nspname: placement, typname: "roaringbitmap64" },
            { attname: "history", nspname: placement, typname: "_roaringbitmap" },
            { attname: "history64", nspname: placement, typname: "_roaringbitmap64" },
          ]);
          connection = await connectDatabase({ schema, relations, connectionString: url });
          // The observed catalogue equals the desired snapshot (the plan's copy additionally carries baseline lineage).
          expect(await inspectSnapshot(connection.db, "app")).toEqual(await createSnapshot(schema));
          const inserted = await connection.transaction((db) =>
            db
              .insert(schema.tables.bitmaps)
              .values({
                bits: [-1, 3, 1],
                bits64: [-1n, 9223372036854775807n],
                history: { dimensions: [{ lowerBound: 1, length: 2 }], values: [[2, 1], null] },
                history64: null,
              })
              .returning(),
          );
          // valibot objects drop the system columns, leaving exactly the decoded extension fields.
          const decoded = v.unknown();
          const stored = v.parse(
            v.array(v.object({ bits: decoded, bits64: decoded, history: decoded, history64: decoded })),
            inserted,
          );
          expect(stored).toEqual([
            {
              bits: [1, 3, -1],
              bits64: [9223372036854775807n, -1n],
              history: { dimensions: [{ lowerBound: 1, length: 2 }], values: [[1, 2], null] },
              history64: null,
            },
          ]);
          await bootstrapDatabase({ connectionString: url, metadataNamespace: options.metadataNamespace, runtimeRole });
          const password = randomBytes(32).toString("hex");
          await client.query(
            `ALTER ROLE ${pg.escapeIdentifier(runtimeRole)} LOGIN PASSWORD '${password}'; GRANT USAGE ON SCHEMA ${pg.escapeIdentifier(placement)} TO ${pg.escapeIdentifier(runtimeRole)}`,
          );
          const runtimeAddress = new URL(url);
          runtimeAddress.username = runtimeRole;
          runtimeAddress.password = password;
          const principal = new pg.Client({ connectionString: runtimeAddress.href });
          await principal.connect();
          try {
            assert.deepEqual(
              (
                await principal.query(
                  "SELECT current_user AS name, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls FROM pg_roles WHERE rolname=current_user",
                )
              ).rows[0],
              {
                name: runtimeRole,
                rolsuper: false,
                rolcreatedb: false,
                rolcreaterole: false,
                rolreplication: false,
                rolbypassrls: false,
              },
            );
          } finally {
            await principal.end();
          }
          runtime = await createRpcRuntime({
            ...options,
            connectionString: runtimeAddress.href,
            deployment: "generated-roaringbitmap",
            auth: defineRpcAuth({ authorize: async () => {} }),
            assertActive: async (signal) => signal.throwIfAborted(),
          });
          const route = getRouter(runtime.router, ["tasks", "list"]);
          assert(route instanceof Procedure);
          const invocation = {
            requestId: "generated-roaringbitmap",
            identity: null,
            signal: new AbortController().signal,
          };
          const actual = await call(route, undefined, {
            context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
            path: ["tasks", "list"],
          });
          const expected = {
            version: "1.2",
            placement,
            union: [1, 2, -1],
            cardinality: 3n,
            wide: [4294967296n, -1n],
            contains: true,
            jaccard: 1 / 3,
            members: { dimensions: [{ lowerBound: 1, length: 3 }], values: [1, 3, -1] },
            ordinarySearchPath: "42883",
          };
          expect(actual).toEqual({ root: expected, child: expected });
        } finally {
          try {
            await runtime?.stop();
            await connection?.close();
          } finally {
            try {
              const exists = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [runtimeRole]);
              if (exists.rows.length)
                await client.query(
                  `GRANT "${runtimeRole}" TO CURRENT_USER; DROP OWNED BY "${runtimeRole}"; DROP ROLE "${runtimeRole}"`,
                );
            } finally {
              await client.end();
            }
          }
        }
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  240000,
);
