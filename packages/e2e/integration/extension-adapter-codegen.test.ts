import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, symlink, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, test } from "bun:test";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context, Effect } from "effect";
import { defineRelations, sql } from "drizzle-orm";
import { bootstrapDatabase, generateProject, initializeProject, loadProject } from "loom/tooling";
import { createProjectProcedures, createProjectServices, createRpcRuntime, defineRpcAuth, defineSchema, Invocation, connectDatabase } from "loom/server";
import pg from "pg";
import { extensionProofTest } from "../fixtures/extension-proof";
import { unaccentGenerationProofCase } from "../fixtures/unaccent-proof-cases";
import { projectRuntimeGraph } from "../../../apps/loom/src/tooling/project/runtime-graph";
import { withExtensionDatabase } from "../fixtures/extension-database";

async function projectFixture() {
  const root = await mkdtemp(join(tmpdir(), "loom-selected-adapter-"));
  try {
    await initializeProject(root, "selectedadapter");
    await mkdir(join(root, "node_modules"));
    for (const name of ["loom", "valibot", "drizzle-orm", "effect"])
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    await writeFile(
      join(root, "loom/app.config.ts"),
      'import { defineApplication } from "loom/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });',
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

extensionProofTest(unaccentGenerationProofCase, async () => {
  for (const placement of ["extensions", "project_accents"] as const) {
    const root = await projectFixture();
    try {
      const directory = join(root, "loom/components/normalize");
      await mkdir(join(directory, "contracts"), { recursive: true });
      await mkdir(join(directory, "functions"));
      const selected = placement === "extensions" ? { version: "1.1" } : { version: "1.1", schema: placement };
      await writeFile(join(root, "loom.config.ts"),
        `import { defineConfig } from "loom/tooling"; export default defineConfig({ database: { extensions: { unaccent: ${JSON.stringify(selected)}, pg_trgm: { version: "1.6", schema: "host_text" } } } });`);
      await writeFile(join(root, "loom/schema.ts"),
        `import { defineSchema } from "loom/server"; import { extensions } from "./_generated/extensions";
import type { SQL } from "drizzle-orm";
const nullable: SQL<string | null> = extensions.unaccent.unaccent(null);
if (extensions.unaccent.version !== "1.1" || extensions.unaccent.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong virtual Unaccent binding");
void nullable;
export default defineSchema(() => ({}), { namespace: "app" });`);
      await writeFile(join(directory, "setup.ts"),
        'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "normalize", extensions: { unaccent: { versions: ["1.1"] } }, rpc: ({ os }) => ({ os }) });');
      await writeFile(join(root, "loom/app.config.ts"),
        'import { defineApplication } from "loom/server"; import normalize from "./components/normalize/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(normalize); export default app;');
      await writeFile(join(directory, "schema.ts"),
        `import { defineSchema } from "loom/server"; import { extensions } from "./_generated/extensions";
extensions.unaccent.unaccent(extensions.unaccent.dictionary, null);
if (Object.keys(extensions).join(",") !== "unaccent" || extensions.unaccent.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong virtual component subset");
export default defineSchema(() => ({}));`);
      const normalizationOutput = `v.object({ implicit: v.nullable(v.string()), explicit: v.nullable(v.string()), missing: v.nullable(v.string()), version: v.literal("1.1"), placement: v.literal(${JSON.stringify(placement)}) })`;
      await writeFile(join(directory, "contracts/normalization.ts"),
        `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${normalizationOutput}) });`);
      await writeFile(join(root, "loom/contracts/tasks.ts"),
        `import { defineContract, oc } from "loom/contract"; import * as v from "valibot"; const result = ${normalizationOutput}; export default defineContract({ list: oc.output(v.object({ root: result, child: result })) });`);
      const nativeHandler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("Generated RPC and Effect Unaccent differ");
const version: "1.1" = binding.unaccent.version;
const placement: ${JSON.stringify(placement)} = context.extensions.unaccent.schema;
const nullable: SQL<string | null> = binding.unaccent.unaccent(null);
const [row] = await context.db.select({ implicit: context.extensions.unaccent.unaccent("Æther Hôtel"), explicit: binding.unaccent.sql.functions.unaccent(binding.unaccent.dictionary, "Æther Hôtel"), missing: nullable }).from(sql.raw("(values (1)) fixture(id)"));
if (!row) throw new Error("Missing native Unaccent result");
const result = { ...row, version, placement };`;
      await writeFile(join(directory, "functions/normalization.ts"),
        `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server";
import { Effect } from "effect"; import { sql, type SQL } from "drizzle-orm";
export default os.normalization.router({ run: os.normalization.run.handler(async ({ context }) => {
${nativeHandler}
// @ts-expect-error The mounted component receives only its declared host subset.
void context.extensions.pg_trgm;
return result; }) });`);
      await writeFile(join(root, "loom/functions/tasks.ts"),
        `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server";
import { extensions } from "../_generated/extensions";
import { Effect } from "effect"; import { sql, type SQL } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
${nativeHandler}
return { root: result, child: await context.components.normalize.rpc.normalization.run() }; }) });
function compileOnly() {
// @ts-expect-error Unselected adapters remain absent from the generated root selection.
void import("../_generated/extensions").then(({ extensions }) => extensions.citext);
// @ts-expect-error SQL NULL is part of the public result contract.
const required: SQL<string> = extensions.unaccent.unaccent(null);
void required;
}
void compileOnly;`);
      await assert.rejects(readFile(join(root, "loom/_generated/extensions.ts")), { code: "ENOENT" });
      await assert.rejects(readFile(join(directory, "_generated/extensions.ts")), { code: "ENOENT" });
      const first = await loadProject(root);
      expect(first.config.database.extensions?.unaccent).toEqual({ version: "1.1", schema: placement });
      const virtual = projectRuntimeGraph(first).scopes.find((scope) => scope.name === "normalize");
      assert(virtual && "extensions" in virtual);
      expect(Object.keys(virtual.extensions!)).toEqual(["unaccent"]);
      const generated = await generateProject(root);
      const disk = await import(pathToFileURL(join(root, "loom/_generated/extensions.ts")).href);
      const server = await import(pathToFileURL(join(root, "loom/_generated/server.ts")).href);
      expect(server.extensions).toBe(disk.extensions);
      expect(Object.keys(disk.extensions)).toEqual(["pg_trgm", "unaccent"]);
      expect(disk.extensions.unaccent.version).toBe("1.1");
      expect(disk.extensions.unaccent.schema).toBe(placement);
      expect(disk.extensions.unaccent.unaccent).toBe(disk.extensions.unaccent.sql.functions.unaccent);
      const childSource = await readFile(join(directory, "_generated/extensions.ts"), "utf8");
      expect(childSource).toContain('from "loom/extensions/unaccent"');
      expect(childSource).not.toContain("pg_trgm");
      expect(childSource).not.toContain("tooling/extensions");
      await checkFixtureTypes(root);
      expect((await generateProject(root)).version).toBe(generated.version);
      const { runtimeOptions } = await import(pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href);
      const options = runtimeOptions();
      const mounted = options.scopes.find((scope: { name: string }) => scope.name === "normalize");
      expect(Object.keys(mounted.extensions)).toEqual(["unaccent"]);
      expect(mounted.extensions.unaccent.schema).toBe(placement);
      await withExtensionDatabase(async (url) => {
        const client = new pg.Client({ connectionString: url });
        await client.connect();
        const runtimeRole = `gen_unaccent_${crypto.randomUUID().replaceAll("-", "")}`;
        let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
        try {
          const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
          assert.match((await client.query("SHOW server_version_num")).rows[0]!.server_version_num, /^18\d{4}$/);
          await client.query(`CREATE SCHEMA ${quote(placement)}; CREATE EXTENSION unaccent WITH SCHEMA ${quote(placement)} VERSION '1.1'; CREATE SCHEMA host_text; CREATE EXTENSION pg_trgm WITH SCHEMA host_text VERSION '1.6'`);
          await bootstrapDatabase({ connectionString: url, metadataNamespace: options.metadataNamespace, runtimeRole });
          runtime = await createRpcRuntime({ ...options, connectionString: url, deployment: "generated-unaccent", auth: defineRpcAuth({ authorize: async () => {} }), assertActive: async (signal) => signal.throwIfAborted() });
          const route = getRouter(runtime.router, ["tasks", "list"]);
          assert(route instanceof Procedure);
          const invocation = { requestId: "generated-unaccent", identity: null, signal: new AbortController().signal };
          const actual = await call(route, undefined, { context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) }, path: ["tasks", "list"] });
          const native = await client.query(`SELECT ${quote(placement)}.unaccent($1::text) AS implicit, ${quote(placement)}.unaccent(pg_catalog.format('%I.%I',$2::text,'unaccent')::pg_catalog.regdictionary,$1::text) AS explicit, ${quote(placement)}.unaccent(NULL::text) AS missing`, ["Æther Hôtel", placement]);
          expect(native.rows).toEqual([{ implicit: "AEther Hotel", explicit: "AEther Hotel", missing: null }]);
          const expected = { ...native.rows[0], version: "1.1", placement };
          expect(actual).toEqual({ root: expected, child: expected });
        } finally {
          try {
            await runtime?.stop();
          } finally {
            try {
              const exists = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [runtimeRole]);
              if (exists.rows.length) await client.query(`GRANT "${runtimeRole}" TO CURRENT_USER; DROP OWNED BY "${runtimeRole}"; DROP ROLE "${runtimeRole}"`);
            } finally { await client.end(); }
          }
        }
      });
    } finally { await rm(root, { recursive: true, force: true }); }
  }
}, 240000);

test("pg_uuidv7 first load retains exact temporal helpers through RPC and Effect", async () => {
  const root = await projectFixture();
  try {
    await writeFile(
      join(root, "loom.config.ts"),
      'import { defineConfig } from "loom/tooling"; export default defineConfig({ database: { extensions: { pg_uuidv7: { version: "1.6", schema: "identifiers_v7" } } } });',
    );
    await writeFile(
      join(root, "loom/schema.ts"),
      `import { defineSchema } from "loom/server"; import { extensions } from "./_generated/extensions";
extensions.pg_uuidv7.v7();
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
    );
    await writeFile(
      join(root, "loom/functions/tasks.ts"),
      `import { os } from "../_generated/rpc";
import { timestamp, timestamptz } from "loom/extensions/timestamps";
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const version: "1.6" = context.extensions.pg_uuidv7.version;
context.extensions.pg_uuidv7.fromTimestamp(timestamp("1970-01-01 00:00:00.123456"), true);
// @ts-expect-error Only the selected underscore extension key exists.
void context.extensions["pg-uuidv7"];
// @ts-expect-error Civil and instant input identities remain distinct.
context.extensions.pg_uuidv7.fromTimestamp(timestamptz("1970-01-01 00:00:00Z"), true);
return [version]; }) });`,
    );
    await loadProject(root);
    const generated = await generateProject(root);
    const disk = await import(pathToFileURL(join(root, "loom/_generated/extensions.ts")).href);
    const server = await import(pathToFileURL(join(root, "loom/_generated/server.ts")).href);
    expect(server.extensions).toBe(disk.extensions);
    expect(Object.keys(disk.extensions)).toEqual(["pg_uuidv7"]);
    await checkFixtureTypes(root);
    expect((await generateProject(root)).version).toBe(generated.version);
    await withExtensionDatabase(async (url) => {
      const schema = defineSchema(() => ({}));
      const relations = defineRelations(schema.tables);
      const connection = await connectDatabase({ schema, relations, connectionString: url });
      try {
        await connection.db.execute(
          sql`create schema identifiers_v7; create extension pg_uuidv7 with schema identifiers_v7 version '1.6'`,
        );
        const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
        const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
        const handler = procedure.handler(async ({ context }) => {
          const effectBinding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
          expect(effectBinding).toBe(context.extensions);
          return connection.transaction((db) =>
            db
              .select({
                instant: effectBinding.pg_uuidv7.toTimestamptz("00000000-007b-7000-8000-000000000000"),
              })
              .from(sql`(values (1)) fixture(id)`),
          );
        });
        const invocation = { requestId: "selected-v7", identity: null, signal: new AbortController().signal };
        expect(
          await call(handler, undefined, {
            context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
          }),
        ).toEqual([{ instant: { type: "timestamptz", text: "1970-01-01 00:00:00.123000+00" } }]);
      } finally {
        await connection.close();
      }
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

test("citext first-load fields preserve selected RPC and Effect bindings in a custom namespace", async () => {
  const root = await projectFixture();
  const placement = "custom_citext";
  try {
    await writeFile(
      join(root, "loom.config.ts"),
      `import { defineConfig } from "loom/tooling"; export default defineConfig({ database: { extensions: { citext: { version: "1.8", schema: ${JSON.stringify(placement)} } } } });`,
    );
    await writeFile(
      join(root, "loom/schema.ts"),
      `import { defineSchema } from "loom/server"; import { extensions } from "./_generated/extensions";
extensions.citext.equal("MiXeD", "mixed");
export default defineSchema(() => ({ tasks: { title: extensions.citext.field().notNull() } }), { namespace: "app" });`,
    );
    await writeFile(
      join(root, "loom/functions/tasks.ts"),
      `import { os } from "../_generated/rpc";
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const version: "1.8" = context.extensions.citext.version;
context.extensions.citext.equal(context.tables.tasks.title, "mixed");
// @ts-expect-error Selected bindings do not expose another family.
void context.extensions.pg_trgm;
// @ts-expect-error Case-insensitive equality rejects boolean input.
context.extensions.citext.equal(true, "mixed");
return [version]; }) });`,
    );
    await loadProject(root);
    const generated = await generateProject(root);
    const disk = await import(pathToFileURL(join(root, "loom/_generated/extensions.ts")).href);
    const server = await import(pathToFileURL(join(root, "loom/_generated/server.ts")).href);
    expect(server.extensions).toBe(disk.extensions);
    expect(Object.keys(disk.extensions)).toEqual(["citext"]);
    await checkFixtureTypes(root);
    expect((await generateProject(root)).version).toBe(generated.version);
    await withExtensionDatabase(async (url) => {
      const schema = defineSchema(() => ({}));
      const relations = defineRelations(schema.tables);
      const connection = await connectDatabase({ schema, relations, connectionString: url });
      try {
        await connection.db.execute(
          sql`create schema ${sql.identifier(placement)}; create extension citext with schema ${sql.identifier(placement)} version '1.8'`,
        );
        const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
        const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
        const handler = procedure.handler(async ({ context }) => {
          const effectBinding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
          expect(effectBinding).toBe(context.extensions);
          return connection.transaction((db) =>
            db.select({ equal: effectBinding.citext.equal("MiXeD", "mixed") }).from(sql`(values (1)) fixture(id)`),
          );
        });
        const invocation = { requestId: "selected-citext", identity: null, signal: new AbortController().signal };
        expect(
          await call(handler, undefined, {
            context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
          }),
        ).toEqual([{ equal: true }]);
      } finally {
        await connection.close();
      }
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

test("UUID-OSSP dashed selection works virtually, on disk, and through RPC and Effect", async () => {
  const root = await projectFixture();
  try {
    await writeFile(
      join(root, "loom.config.ts"),
      'import { defineConfig } from "loom/tooling"; export default defineConfig({ database: { extensions: { "uuid-ossp": { version: "1.1", schema: "identifiers" } } } });',
    );
    await writeFile(
      join(root, "loom/schema.ts"),
      `import { defineSchema } from "loom/server"; import { extensions } from "./_generated/extensions";
extensions["uuid-ossp"].v5(extensions["uuid-ossp"].namespaceDns(), "name");
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
    );
    await writeFile(
      join(root, "loom/functions/tasks.ts"),
      `import { os } from "../_generated/rpc";
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const version: "1.1" = context.extensions["uuid-ossp"].version;
context.extensions["uuid-ossp"].v5(context.extensions["uuid-ossp"].namespaceDns(), "name");
// @ts-expect-error The dashed extension key is exact.
void context.extensions.uuid_ossp;
// @ts-expect-error UUID names reject numeric arguments.
context.extensions["uuid-ossp"].v3(context.extensions["uuid-ossp"].namespaceDns(), 3);
return [version]; }) });`,
    );
    await loadProject(root);
    const generated = await generateProject(root);
    const disk = await import(pathToFileURL(join(root, "loom/_generated/extensions.ts")).href);
    const server = await import(pathToFileURL(join(root, "loom/_generated/server.ts")).href);
    expect(server.extensions).toBe(disk.extensions);
    expect(Object.keys(disk.extensions)).toEqual(["uuid-ossp"]);
    await checkFixtureTypes(root);
    expect((await generateProject(root)).version).toBe(generated.version);
    await withExtensionDatabase(async (url) => {
      const schema = defineSchema(() => ({}));
      const relations = defineRelations(schema.tables);
      const connection = await connectDatabase({ schema, relations, connectionString: url });
      try {
        await connection.db.execute(
          sql`create schema identifiers; create extension "uuid-ossp" with schema identifiers version '1.1'`,
        );
        const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
        const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
        const handler = procedure.handler(async ({ context }) => {
          const effectBinding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
          expect(effectBinding).toBe(context.extensions);
          const uuid = effectBinding["uuid-ossp"];
          return connection.transaction((db) =>
            db
              .select({
                v3: uuid.v3(uuid.namespaceDns(), "www.widgets.com"),
                v5: uuid.v5(uuid.namespaceDns(), "www.widgets.com"),
              })
              .from(sql`(values (1)) fixture(id)`),
          );
        });
        const invocation = { requestId: "selected-uuid", identity: null, signal: new AbortController().signal };
        expect(
          await call(handler, undefined, {
            context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
          }),
        ).toEqual([{ v3: "3d813cbb-47fb-32ba-91df-831e1593ac29", v5: "21f7f8de-8051-5b89-8680-0195ef798b6a" }]);
      } finally {
        await connection.close();
      }
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

test("selected pg_trgm helpers work at first load, on disk, and through RPC and Effect bindings", async () => {
  const root = await projectFixture();
  try {
    await writeFile(
      join(root, "loom.config.ts"),
      'import { defineConfig } from "loom/tooling"; export default defineConfig({ database: { extensions: { pg_trgm: { version: "1.6", schema: "custom_text" } } } });',
    );
    await writeFile(
      join(root, "loom/schema.ts"),
      `import { defineSchema } from "loom/server";
import { extensions } from "./_generated/extensions";
// This executes while generated bindings exist only virtually.
extensions.pg_trgm.similarity("word", "words");
extensions.pg_trgm.sql.functions.similarity("word", "words");
if (Object.keys(extensions).join(",") !== "pg_trgm") throw new Error("Wrong selected keys");
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
    );
    await writeFile(
      join(root, "loom/functions/tasks.ts"),
      `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { Effect } from "effect";
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("RPC and Effect extensions differ");
const namespace: "custom_text" = binding.pg_trgm.schema;
const version: "1.6" = context.extensions.pg_trgm.version;
context.extensions.pg_trgm.similarity(context.tables.tasks.title, "word");
binding.pg_trgm.sql.functions.similarity(context.tables.tasks.title, "word");
// @ts-expect-error Unselected extensions stay absent.
void context.extensions.vector;
// @ts-expect-error Text similarity rejects booleans.
context.extensions.pg_trgm.similarity(true, "word");
return [namespace, version];
}) });`,
    );
    await loadProject(root);
    const generated = await generateProject(root);
    const source = await readFile(join(root, "loom/_generated/extensions.ts"), "utf8");
    expect(source).toContain('from "loom/extensions/pg-trgm"');
    for (const forbidden of ["vector", "../schema", "./server", "loom.config"]) expect(source).not.toContain(forbidden);
    const disk = await import(pathToFileURL(join(root, "loom/_generated/extensions.ts")).href);
    const server = await import(pathToFileURL(join(root, "loom/_generated/server.ts")).href);
    expect(server.extensions).toBe(disk.extensions);
    expect(Object.keys(disk.extensions)).toEqual(["pg_trgm"]);
    expect(Object.isFrozen(disk.extensions)).toBe(true);
    expect(disk.extensions.pg_trgm.similarity).toBe(disk.extensions.pg_trgm.sql.functions.similarity);
    await checkFixtureTypes(root);
    expect((await generateProject(root)).version).toBe(generated.version);
    await withExtensionDatabase(async (url) => {
      const schema = defineSchema(() => ({}));
      const relations = defineRelations(schema.tables);
      const connection = await connectDatabase({ schema, relations, connectionString: url });
      try {
        await connection.db.execute(
          sql`create schema custom_text; create extension pg_trgm with schema custom_text version '1.6'`,
        );
        const services = createProjectServices<typeof schema, typeof relations, typeof disk.extensions>(schema);
        const { procedure } = createProjectProcedures(schema, relations, disk.extensions);
        const handler = procedure.handler(async ({ context }) => {
          const effectBinding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
          expect(effectBinding).toBe(disk.extensions);
          expect(context.extensions).toBe(effectBinding);
          return connection.transaction((db) =>
            db
              .select({
                direct: context.extensions.pg_trgm.similarity("word", "words"),
                canonical: effectBinding.pg_trgm.sql.functions.similarity("word", "words"),
              })
              .from(sql`(values (1)) fixture(id)`),
          );
        });
        const invocation = { requestId: "selected-adapter", identity: null, signal: new AbortController().signal };
        expect(
          await call(handler, undefined, {
            context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
          }),
        ).toEqual([{ direct: Math.fround(4 / 7), canonical: Math.fround(4 / 7) }]);
      } finally {
        await connection.close();
      }
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

test("fuzzy and token helpers are selected at first load and retain exact disk imports", async () => {
  const root = await projectFixture();
  try {
    await writeFile(
      join(root, "loom.config.ts"),
      'import { defineConfig } from "loom/tooling"; export default defineConfig({ database: { extensions: { fuzzystrmatch: { version: "1.2", schema: "phonetics" }, pg_tiktoken: { version: "0.0.1", schema: "tokens" } } } });',
    );
    await writeFile(
      join(root, "loom/schema.ts"),
      `import { defineSchema } from "loom/server"; import { extensions } from "./_generated/extensions";
extensions.fuzzystrmatch.levenshtein("word", "words");
extensions.pg_tiktoken.count("cl100k_base", "hello");
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
    );
    await loadProject(root);
    await generateProject(root);
    const source = await readFile(join(root, "loom/_generated/extensions.ts"), "utf8");
    expect(source).toContain('from "loom/extensions/fuzzystrmatch"');
    expect(source).toContain('from "loom/extensions/pg-tiktoken"');
    expect(source).not.toContain("pg-trgm");
    const disk = await import(pathToFileURL(join(root, "loom/_generated/extensions.ts")).href);
    expect(Object.keys(disk.extensions)).toEqual(["fuzzystrmatch", "pg_tiktoken"]);
    await withExtensionDatabase(async (url) => {
      const schema = defineSchema(() => ({}));
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: url,
      });
      try {
        const fuzzy = connection.db
          .select({ value: disk.extensions.fuzzystrmatch.levenshtein("word", "words") })
          .from(sql`(values (1)) fixture(id)`)
          .toSQL();
        expect(fuzzy.sql).toContain('"phonetics"."levenshtein"');
        expect(fuzzy.params).toEqual(["word", "words"]);
        const token = connection.db
          .select({ value: disk.extensions.pg_tiktoken.count("cl100k_base", "hello") })
          .from(sql`(values (1)) fixture(id)`)
          .toSQL();
        expect(token.sql).toContain('"tokens"."tiktoken_count"');
        expect(token.params).toEqual(["cl100k_base", "hello"]);
      } finally {
        await connection.close();
      }
    });
    expect(disk.extensions.pg_tiktoken.sql.functions.tiktoken_count).toBe(disk.extensions.pg_tiktoken.count);
    await checkFixtureTypes(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

test("unknown pg_trgm versions generate literal descriptors without callable helpers", async () => {
  const root = await projectFixture();
  try {
    await writeFile(
      join(root, "loom.config.ts"),
      'import { defineConfig } from "loom/tooling"; export default defineConfig({ database: { extensions: { pg_trgm: { version: "unknown" } } } });',
    );
    await writeFile(
      join(root, "loom/schema.ts"),
      `import { defineSchema } from "loom/server"; import { extensions } from "./_generated/extensions";
if ("similarity" in extensions.pg_trgm || "sql" in extensions.pg_trgm) throw new Error("Invented unverified API");
export default defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
    );
    await writeFile(
      join(root, "loom/functions/tasks.ts"),
      `import { os } from "../_generated/rpc"; export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const version: "unknown" = context.extensions.pg_trgm.version;
// @ts-expect-error Unverified versions have no callable similarity.
void context.extensions.pg_trgm.similarity;
// @ts-expect-error Unselected keys stay absent.
void context.extensions.vector;
return [version]; }) });`,
    );
    await loadProject(root);
    await generateProject(root);
    const source = await readFile(join(root, "loom/_generated/extensions.ts"), "utf8");
    expect(source).not.toContain('from "loom/extensions/');
    const disk = await import(pathToFileURL(join(root, "loom/_generated/extensions.ts")).href);
    expect(Object.keys(disk.extensions)).toEqual(["pg_trgm"]);
    expect(disk.extensions.pg_trgm.version).toBe("unknown");
    expect(disk.extensions.pg_trgm.apiSupport.status).toBe("unverified");
    expect(disk.extensions.pg_trgm).not.toHaveProperty("similarity");
    expect(disk.extensions.pg_trgm).not.toHaveProperty("sql");
    await checkFixtureTypes(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

test("component generation binds its reviewed adapter with only the declared host subset", async () => {
  const root = await projectFixture();
  try {
    const directory = join(root, "loom/components/search");
    await mkdir(join(directory, "contracts"), { recursive: true });
    await mkdir(join(directory, "functions"));
    await writeFile(
      join(root, "loom.config.ts"),
      'import { defineConfig } from "loom/tooling"; export default defineConfig({ database: { extensions: { pg_trgm: { version: "1.6", schema: "host_text" }, fuzzystrmatch: { version: "1.2", schema: "host_fuzzy" } } } });',
    );
    await writeFile(
      join(directory, "setup.ts"),
      'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "search", extensions: { pg_trgm: { versions: ["1.6"] } }, rpc: ({ os }) => ({ os }) });',
    );
    await writeFile(
      join(root, "loom/app.config.ts"),
      'import { defineApplication } from "loom/server"; import search from "./components/search/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(search); export default app;',
    );
    await writeFile(
      join(directory, "schema.ts"),
      `import { defineSchema } from "loom/server"; import { extensions } from "./_generated/extensions";
extensions.pg_trgm.similarity("word", "words");
if (Object.keys(extensions).join(",") !== "pg_trgm" || extensions.pg_trgm.schema !== "host_text") throw new Error("Wrong component binding");
export default defineSchema(() => ({}));`,
    );
    await writeFile(
      join(directory, "contracts/description.ts"),
      'import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ get: oc.output(v.string()) });',
    );
    await writeFile(
      join(directory, "functions/description.ts"),
      `import { os } from "../_generated/rpc"; export default os.description.router({ get: os.description.get.handler(({ context }) => {
context.extensions.pg_trgm.similarity("word", "words");
const schema: "host_text" = context.extensions.pg_trgm.schema;
// @ts-expect-error Host adapters not declared by the component remain absent.
void context.extensions.fuzzystrmatch;
return schema; }) });`,
    );
    const generated = await generateProject(root);
    const runtime = await import(pathToFileURL(join(root, ".loom/generations", generated.version, "router.js")).href);
    const disk = runtime.scopes.find((scope: { name: string }) => scope.name === "search");
    expect(Object.keys(disk.extensions)).toEqual(["pg_trgm"]);
    expect(disk.extensions.pg_trgm.similarity("word", "words")).toBeDefined();
    const loaded = projectRuntimeGraph(await loadProject(root)).scopes.find((scope) => scope.name === "search");
    assert(loaded && "extensions" in loaded);
    expect(Object.keys(loaded.extensions!)).toEqual(["pg_trgm"]);
    expect(loaded.extensions).toHaveProperty("pg_trgm.similarity");
    const source = await readFile(join(directory, "_generated/extensions.ts"), "utf8");
    expect(source).not.toContain("fuzzystrmatch");
    await checkFixtureTypes(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);
