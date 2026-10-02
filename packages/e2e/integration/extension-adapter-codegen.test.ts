import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, symlink, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, test } from "bun:test";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { defineRelations, sql } from "drizzle-orm";
import { generateProject, initializeProject, loadProject } from "loom/tooling";
import { createProjectProcedures, createProjectServices, defineSchema, Invocation, connectDatabase } from "loom/server";
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
