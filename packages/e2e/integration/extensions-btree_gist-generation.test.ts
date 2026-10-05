import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import {
  connectDatabase,
  createProjectProcedures,
  createProjectServices,
  defineSchema,
  Invocation,
} from "kello/server";
import type { createBtreeGist_1_8 } from "kello/extensions/btree-gist";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest } from "../fixtures/extension-proof";
import { btreeGistGenerationProofCase } from "../fixtures/btree_gist-proof-cases";
import {
  btreeGistGeneratedFunctions,
  btreeGistGeneratedSchema,
  writeBtreeGistRpc,
} from "../fixtures/btree_gist-generated-project";
import { runBtreeGistGeneratedRuntime } from "../fixtures/btree-gist-generated-runtime";

extensionProofTest(
  btreeGistGenerationProofCase,
  async () => {
    for (const placement of ["extensions", "generated_btree_gist"]) {
      const root = await mkdtemp(join(tmpdir(), "loom-btree_gist-generation-"));
      try {
        await initializeProject(root, "btreegistproof");
        await mkdir(join(root, "node_modules"));
        for (const name of ["kello", "valibot", "drizzle-orm", "effect", "@orpc", "pg"])
          await symlink(
            await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
            join(root, "node_modules", name),
          );
        const selection = placement === "extensions" ? { version: "1.8" } : { version: "1.8", schema: placement };
        await writeFile(
          join(root, "kello.config.ts"),
          `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { btree_gist: ${JSON.stringify(selection)} } } });`,
        );
        await writeFile(
          join(root, "kello/app.config.ts"),
          'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });',
        );
        await writeFile(join(root, "kello/schema.ts"), btreeGistGeneratedSchema(placement));
        await writeFile(join(root, "kello/functions/tasks.ts"), btreeGistGeneratedFunctions);
        await writeBtreeGistRpc(root);
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        // First load executes the schema against virtual bindings before any file is generated.
        const first = await loadProject(root);
        assert(first);
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        const generated = await generateProject(root);
        const disk: { readonly extensions: { readonly btree_gist: ReturnType<typeof createBtreeGist_1_8> } } =
          await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
        const api = disk.extensions.btree_gist;
        assert.deepEqual(Object.keys(disk.extensions), ["btree_gist"]);
        assert.equal(api.schema, placement);
        assert.equal(api.version, "1.8");
        assert.deepEqual(api.apiSupport, {
          status: "verified",
          digest: "73fdb4831683ee8042ecbcd0d0639909650d018d6c7ca51bb85c1cb38de96072",
        });
        assert.equal(Object.keys(api.indexes).length, 26);
        assert.equal(Object.keys(api.sql.functions).length, 13);
        assert.equal(Object.keys(api.sql.operators).length, 12);
        assert.equal(Object.keys(api.sql.overloads).length, 25);
        assert.equal(api.distance.money, api.sql.operators["<->(money,money)"]);
        assert.deepEqual(api.indexes.money(), {
          name: "btree_gist",
          version: "1.8",
          schema: placement,
          digest: api.apiSupport.digest,
          member: "opclass:$extension:btree_gist.gist_cash_ops/gist",
          method: "gist",
          opclass: "gist_cash_ops",
          type: "money",
          default: true,
          input: { schema: "pg_catalog", type: "money", dimensions: 0 },
        });
        const schema = (await import(pathToFileURL(join(root, "kello/schema.ts")).href)).default;
        const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
        assert.equal(server.extensions, disk.extensions);
        const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
        assert.match(source, /kello\/extensions\/btree-gist/);
        assert.match(source, /createBtreeGist_1_8/);
        assert.doesNotMatch(source, /btree_gin|\/schema|\.\/server|kello\.config/);
        assert.deepEqual(
          schema.metadata.extensionRequirements.map((member: { member: string }) => member.member),
          ["opclass:$extension:btree_gist.gist_int4_ops/gist", "opclass:$extension:btree_gist.gist_text_ops/gist"],
        );
        assert.equal((await generateProject(root)).version, generated.version);
        // Real RPC procedure + Effect service built from the passed disk.extensions, executed against PostgreSQL 18.
        await withExtensionDatabase(async (url) => {
          const client = new pg.Client({ connectionString: url });
          await client.connect();
          let connection: Awaited<ReturnType<typeof connectDatabase>> | undefined;
          try {
            const quoted = '"' + placement.replaceAll('"', '""') + '"';
            await client.query(
              `CREATE SCHEMA IF NOT EXISTS ${quoted}; CREATE EXTENSION btree_gist WITH SCHEMA ${quoted} VERSION '1.8'`,
            );
            const native = defineSchema((fields) => ({ entries: { code: fields.integer(), label: fields.text() } }), {
              namespace: "generated_app",
            });
            const relations = defineRelations(native.tables);
            connection = await connectDatabase({ schema: native, relations, connectionString: url });
            const services = createProjectServices<typeof native, typeof relations, typeof disk.extensions>(native);
            const { procedure } = createProjectProcedures(native, relations, disk.extensions);
            const opened = connection;
            const handler = procedure.handler(async ({ context }) => {
              const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
              assert.equal(binding, context.extensions);
              assert.equal(binding, disk.extensions);
              const gist = binding.btree_gist;
              return opened.transaction((db) =>
                db
                  .select({
                    money: gist.distance.money("1.50", "-3"),
                    days: gist.sql.functions.date_dist("2000-01-01", "4713-01-01 BC"),
                    exact: gist.distance.int8(9007199254740993n, 0n),
                    elapsed: gist.distance.time("01:00:00", "24:00:00"),
                    oid: gist.distance.oid(1, 4294967295),
                    strategy: gist.sql.functions.gist_translate_cmptype_btree(3),
                    absent: gist.distance.int4(null, 1),
                  })
                  .from(sql.raw("(values(1)) fixture(id)")),
              );
            });
            const invocation = {
              requestId: "btree-gist-generation",
              identity: null,
              signal: new AbortController().signal,
            };
            const [row] = await call(handler, undefined, {
              context: { ...invocation, "effect/context": Context.make(Invocation, invocation) },
            });
            assert.deepEqual(row, {
              money: "4.50",
              // Native oracle: SELECT '2000-01-01'::date - '4713-01-01 BC'::date.
              days: 2451507,
              exact: 9007199254740993n,
              elapsed: "23:00:00",
              oid: 4294967294,
              strategy: 3,
              absent: null,
            });
          } finally {
            try {
              await connection?.close();
            } finally {
              await client.end();
            }
          }
          await runBtreeGistGeneratedRuntime(root, generated.version, placement, url);
        });
        const child = Bun.spawn(
          [
            fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
            "-p",
            join(root, "tsconfig.json"),
          ],
          { stdout: "pipe", stderr: "pipe" },
        );
        const output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
        assert.equal(await child.exited, 0, output);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  360000,
);
