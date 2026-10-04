import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, symlink, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect } from "bun:test";
import { appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { extensionProofTest } from "../fixtures/extension-proof";
import { wave10GenerationProofCase } from "../fixtures/wave10-composition-proof-cases";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  bootstrapDatabase,
  createSnapshot,
  emptySnapshot,
  generateProject,
  initializeProject,
  loadProject,
  migrationStatements,
} from "kello/tooling";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import pg from "pg";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  wave10GeneratedSelection,
  wave10GeneratedSchema,
  wave10GeneratedOutput,
  wave10GeneratedQuery,
} from "../fixtures/wave10-generated";

extensionProofTest(
  wave10GenerationProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-wave10-generated-"));
    const component = join(root, "kello/components/inspection");
    try {
      await initializeProject(root, "wavegenerated");
      await mkdir(join(root, "node_modules"));
      for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
        await symlink(
          await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
          join(root, "node_modules", name),
        );
      await mkdir(join(component, "contracts"), { recursive: true });
      await mkdir(join(component, "functions"));
      await writeFile(
        join(root, "kello.config.ts"),
        `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: ${JSON.stringify(wave10GeneratedSelection)} } });`,
      );
      await writeFile(join(root, "kello/schema.ts"), wave10GeneratedSchema);
      await writeFile(join(component, "schema.ts"), wave10GeneratedSchema);
      const declared = Object.fromEntries(
        Object.entries(wave10GeneratedSelection).map(([name, entry]) => [name, { versions: [entry.version] }]),
      );
      await writeFile(
        join(component, "setup.ts"),
        `import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "inspection", extensions: ${JSON.stringify(declared)}, rpc: ({ os }) => ({ os }) });`,
      );
      await writeFile(
        join(root, "kello/app.config.ts"),
        'import { defineApplication } from "kello/server"; import inspection from "./components/inspection/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(inspection); export default app;',
      );
      await writeFile(
        join(component, "contracts/inspection.ts"),
        `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${wave10GeneratedOutput}) });`,
      );
      await writeFile(
        join(root, "kello/contracts/tasks.ts"),
        `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; const result = ${wave10GeneratedOutput}; export default defineContract({ list: oc.output(v.strictObject({ root: result, child: result })) });`,
      );
      await writeFile(
        join(component, "functions/inspection.ts"),
        `import { os } from "../_generated/rpc"; import { Database, Tables, Extensions } from "../_generated/server";
import { Effect } from "effect"; import { sql } from "drizzle-orm";
export default os.inspection.router({ run: os.inspection.run.effect(function* () {
  const db = yield* Database; const tables = yield* Tables; const extensions = yield* Extensions;
  return yield* Effect.tryPromise(async () => { ${wave10GeneratedQuery} });
}) });`,
      );
      await writeFile(
        join(root, "kello/functions/tasks.ts"),
        `import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server";
import { extensions as selected } from "../_generated/extensions";
import { Effect } from "effect"; import { sql } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
  const extensions = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
  if (extensions !== context.extensions) throw new Error("Root RPC/Effect selection differs");
  const { db, tables } = context;
  const root = await (async () => { ${wave10GeneratedQuery} })();
  return { root, child: await context.components.inspection.rpc.inspection.run() };
}) });
function compileOnly() {
// @ts-expect-error The root selection excludes undeclared families.
selected.vector;
// @ts-expect-error Trigger-manager callbacks have no scalar query helper.
selected.autoinc.sql.functions.autoinc();
// @ts-expect-error Internal dictionary callbacks have no scalar query helper.
selected.dict_int.sql.functions.dintdict_lexize();
}
void compileOnly;`,
      );
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      const loaded = await loadProject(root);
      expect(Object.keys(loaded.componentScopes[0]!.boundExtensions!).sort()).toEqual(
        Object.keys(wave10GeneratedSelection).sort(),
      );
      const generated = await generateProject(root);
      const typecheck = Bun.spawn(
        [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
        { stdout: "pipe", stderr: "pipe" },
      );
      const diagnostics = (await new Response(typecheck.stdout).text()) + (await new Response(typecheck.stderr).text());
      assert.equal(await typecheck.exited, 0, diagnostics);
      expect((await generateProject(root)).version).toBe(generated.version);
      const { runtimeOptions } = await import(
        pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href
      );
      const options = runtimeOptions();
      const mounted = options.scopes.find((scope: { name: string }) => scope.name === "inspection");
      assert(mounted);
      expect(Object.keys(mounted.extensions).sort()).toEqual(Object.keys(wave10GeneratedSelection).sort());
      expect(mounted.schema.metadata.extensionTriggers).toHaveLength(2);
      await withExtensionDatabase(async (url) => {
        const client = new pg.Client({ connectionString: url });
        const locker = new pg.Client({ connectionString: url });
        await client.connect();
        const runtimeRole = `gen_wave_${crypto.randomUUID().replaceAll("-", "")}`;
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
        let lockerConnected = false;
        try {
          for (const namespace of new Set(Object.values(wave10GeneratedSelection).map((entry) => entry.schema)))
            await client.query(`CREATE SCHEMA ${pg.escapeIdentifier(namespace)}`);
          for (const [name, entry] of Object.entries(wave10GeneratedSelection))
            await client.query(
              `CREATE EXTENSION ${pg.escapeIdentifier(name)} WITH SCHEMA ${pg.escapeIdentifier(entry.schema)} VERSION ${pg.escapeLiteral(entry.version)}`,
            );
          await client.query("CREATE SCHEMA sequences; CREATE SEQUENCE sequences.record_seq");
          const namespaces: string[] = [];
          for (const schema of [options.schema, mounted.schema]) {
            const table = getTableConfig(schema.tables.records);
            assert(table.schema);
            namespaces.push(table.schema);
            for (const statement of await migrationStatements(
              await emptySnapshot(table.schema),
              await createSnapshot(schema),
            ))
              await client.query(statement);
            const target = `${pg.escapeIdentifier(table.schema)}.${pg.escapeIdentifier(table.name)}`;
            await client.query(
              `INSERT INTO ${target} (_id, "_createdAt", number, label, coordinate) VALUES ($1, 1, NULL, 'MiXeD', '(1)'::cube_types.cube), ($2, 2, 0, 'MiXeD', '(1)'::cube_types.cube)`,
              [crypto.randomUUID(), crypto.randomUUID()],
            );
            await client.query(`UPDATE ${target} SET label=label`);
            expect((await client.query(`SELECT bool_and(updated IS NOT NULL) AS touched FROM ${target}`)).rows).toEqual(
              [{ touched: true }],
            );
          }
          expect(new Set(namespaces).size).toBe(2);
          await locker.connect();
          lockerConnected = true;
          await locker.query("BEGIN");
          for (const namespace of namespaces)
            await locker.query(
              `SELECT * FROM ${pg.escapeIdentifier(namespace)}.records ORDER BY number LIMIT 1 FOR UPDATE`,
            );
          await bootstrapDatabase({ connectionString: url, metadataNamespace: options.metadataNamespace, runtimeRole });
          runtime = await createRpcRuntime({
            ...options,
            connectionString: url,
            deployment: "generated-wave10",
            auth: defineRpcAuth({ authorize: async () => {} }),
            assertActive: async (signal) => signal.throwIfAborted(),
          });
          const route = getRouter(runtime.router, ["tasks", "list"]);
          assert(route instanceof Procedure);
          const invocation = { requestId: "generated-wave10", identity: null, signal: new AbortController().signal };
          const actual = await call(route, undefined, {
            context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
            path: ["tasks", "list"],
          });
          const expected = [];
          for (const namespace of namespaces) {
            const native = await client.query(
              `SELECT case_text.citext_eq(label,'MIXED'::case_text.citext) AS equal, cube_types.cube_distance(coordinate,'(2)'::cube_types.cube) AS distance FROM ${pg.escapeIdentifier(namespace)}.records ORDER BY number LIMIT 1`,
            );
            const numbers = await client.query(
              `SELECT arrays.int_array_aggregate(number) AS value FROM ${pg.escapeIdentifier(namespace)}.records`,
            );
            const pages = await client.query(`SELECT statistics.pg_relpages($1::regclass) AS value`, [
              `${pg.escapeIdentifier(namespace)}.records`,
            ]);
            expected.push({
              ...native.rows[0],
              numbers: numbers.rows[0]!.value,
              arrayBounds: [{ lowerBound: 1, length: 2 }],
              sampleRows: 1,
              sampleTimeRows: 2,
              pageCount: BigInt(pages.rows[0]!.value),
              lockCount: 1,
              dictionarySchema: "dictionaries",
              dictionaryName: "intdict",
              families: Object.keys(wave10GeneratedSelection).sort(),
            });
          }
          expect(actual).toEqual({ root: expected[0], child: expected[1] });
        } finally {
          try {
            try {
              if (lockerConnected) await locker.query("ROLLBACK");
            } finally {
              try {
                await locker.end();
              } finally {
                await runtime?.stop();
              }
            }
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
  },
  90000,
);
