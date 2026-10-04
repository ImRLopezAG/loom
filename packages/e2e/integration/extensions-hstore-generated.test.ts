import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, symlink, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, test } from "bun:test";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import { getTableConfig } from "drizzle-orm/pg-core";
import { bootstrapDatabase, generateProject, initializeProject, loadProject } from "kello/tooling";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import pg from "pg";
import { projectRuntimeGraph } from "../../../apps/loom/src/tooling/project/runtime-graph";
import { componentNamespace } from "../../../apps/loom/src/tooling/project/component-namespace";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { hstoreGeneratedPlacement, hstoreGeneratedHandler, hstoreGeneratedOutput } from "../fixtures/hstore-generated";
import { hstoreAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/hstore";

async function projectFixture() {
  const root = await mkdtemp(join(tmpdir(), "loom-hstore-generated-"));
  try {
    await initializeProject(root, "hstoregenerated");
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

test("hstore.generatedRootMountedComponentEffectAndAll66PortableMembers", async () => {
  const root = await projectFixture();
  const component = join(root, "kello/components/documents");
  const placement = hstoreGeneratedPlacement;
  try {
    await mkdir(join(component, "contracts"), { recursive: true });
    await mkdir(join(component, "functions"));
    await writeFile(
      join(root, "kello.config.ts"),
      `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { hstore: { version: "1.8", schema: ${JSON.stringify(placement)} } } } });`,
    );
    const schemaSource = (
      namespace: string,
    ) => `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
if (extensions.hstore.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong Hstore placement");
extensions.hstore.get(null, "key");
export default defineSchema((field) => ({ records: { label: field.text() }, mappings: { scalar: extensions.hstore.field(), matrix: extensions.hstore.arrayField() } }), { namespace: ${JSON.stringify(namespace)} });`;
    await writeFile(join(root, "kello/schema.ts"), schemaSource("app"));
    await writeFile(join(component, "schema.ts"), schemaSource(componentNamespace("documents")));
    await writeFile(
      join(component, "setup.ts"),
      'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "documents", extensions: { hstore: { versions: ["1.8"] } }, rpc: ({ os }) => ({ os }) });',
    );
    await writeFile(
      join(root, "kello/app.config.ts"),
      'import { defineApplication } from "kello/server"; import documents from "./components/documents/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(documents); export default app;',
    );
    await writeFile(
      join(component, "contracts/mappings.ts"),
      `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${hstoreGeneratedOutput}) });`,
    );
    await writeFile(
      join(root, "kello/contracts/tasks.ts"),
      `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; const result = ${hstoreGeneratedOutput}; export default defineContract({ list: oc.output(v.object({ root: result, child: result })) });`,
    );
    const imports =
      'import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import schema from "../schema"; import { Effect } from "effect"; import { sql } from "drizzle-orm";';
    const result =
      'const output = { version, placement, members, populated: "populated" as const, replaced: "replaced" as const };';
    await writeFile(
      join(component, "functions/mappings.ts"),
      `${imports} export default os.mappings.router({ run: os.mappings.run.handler(async ({ context }) => { ${hstoreGeneratedHandler} ${result} return output; }) });`,
    );
    await writeFile(
      join(root, "kello/functions/tasks.ts"),
      `${imports} import { extensions } from "../_generated/extensions";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => { ${hstoreGeneratedHandler} ${result} return { root: output, child: await context.components.documents.rpc.mappings.run() }; }) });
function compileOnly() {
// @ts-expect-error Unselected families remain absent.
void extensions.vector;
// @ts-expect-error Inputs retain exact hstore value types.
extensions.hstore.get(true, "key");
// @ts-expect-error Record witnesses cannot be forged from SQL.
extensions.hstore.fromRecord(sql.raw("row(1)"));
}
void compileOnly;`,
    );
    await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    await assert.rejects(readFile(join(component, "_generated/extensions.ts")), { code: "ENOENT" });
    const first = await loadProject(root);
    const virtual = projectRuntimeGraph(first).scopes.find((scope) => scope.name === "documents");
    assert(virtual && "extensions" in virtual);
    expect(Object.keys(virtual.extensions!)).toEqual(["hstore"]);
    const generated = await generateProject(root);
    const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
    const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
    expect(server.extensions).toBe(disk.extensions);
    expect(Object.keys(disk.extensions)).toEqual(["hstore"]);
    expect(disk.extensions.hstore.schema).toBe(placement);
    const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
    expect(Object.keys(child.extensions)).toEqual(["hstore"]);
    expect(child.extensions.hstore.schema).toBe(placement);
    await checkFixtureTypes(root);
    expect((await generateProject(root)).version).toBe(generated.version);
    const { runtimeOptions } = await import(
      pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href
    );
    const options = runtimeOptions();
    const mounted = options.scopes.find((scope: { name: string }) => scope.name === "documents");
    assert(mounted);
    expect(Object.keys(mounted.extensions)).toEqual(["hstore"]);
    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      const runtimeRole = `gen_hstore_${crypto.randomUUID().replaceAll("-", "")}`;
      let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
      try {
        await client.query(
          `CREATE SCHEMA ${pg.escapeIdentifier(placement)}; CREATE EXTENSION hstore WITH SCHEMA ${pg.escapeIdentifier(placement)} VERSION '1.8'`,
        );
        for (const schema of [options.schema, mounted.schema]) {
          const table = getTableConfig(schema.tables.records);
          assert(table.schema);
          await client.query(
            `CREATE SCHEMA IF NOT EXISTS ${pg.escapeIdentifier(table.schema)}; CREATE TABLE ${pg.escapeIdentifier(table.schema)}.${pg.escapeIdentifier(table.name)} (_id uuid PRIMARY KEY, "_createdAt" bigint NOT NULL, label text)`,
          );
        }
        await bootstrapDatabase({ connectionString: url, metadataNamespace: options.metadataNamespace, runtimeRole });
        runtime = await createRpcRuntime({
          ...options,
          connectionString: url,
          deployment: "generated-hstore",
          auth: defineRpcAuth({ authorize: async () => {} }),
          assertActive: async (signal) => signal.throwIfAborted(),
        });
        const route = getRouter(runtime.router, ["tasks", "list"]);
        assert(route instanceof Procedure);
        const invocation = { requestId: "generated-hstore", identity: null, signal: new AbortController().signal };
        const actual = await call(route, undefined, {
          context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
          path: ["tasks", "list"],
        });
        const expected = {
          version: "1.8",
          placement,
          members: hstoreAnnotations
            .filter((annotation) => annotation.disposition === "query")
            .map(({ id }) => id)
            .sort(),
          populated: "populated",
          replaced: "replaced",
        };
        expect(expected.members).toHaveLength(66);
        expect(actual).toEqual({ root: expected, child: expected });
      } finally {
        try {
          await runtime?.stop();
        } finally {
          try {
            const exists = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [runtimeRole]);
            if (exists.rows.length)
              await client.query(
                `GRANT ${pg.escapeIdentifier(runtimeRole)} TO CURRENT_USER; DROP OWNED BY ${pg.escapeIdentifier(runtimeRole)}; DROP ROLE ${pg.escapeIdentifier(runtimeRole)}`,
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
}, 90000);
