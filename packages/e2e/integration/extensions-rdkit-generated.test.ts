import { expect } from "bun:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import { getTableConfig } from "drizzle-orm/pg-core";
import pg from "pg";
import { bootstrapDatabase, generateProject, initializeProject, loadProject } from "kello/tooling";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { projectRuntimeGraph } from "../../../apps/loom/src/tooling/project/runtime-graph";
import { componentNamespace } from "../../../apps/loom/src/tooling/project/component-namespace";
import { rdkitAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/rdkit";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/rdkit.json";
import { extensionProofTest } from "../fixtures/extension-proof";
import { rdkitGenerationProofCase } from "../fixtures/rdkit-proof-cases";
import { withRdkitDatabase } from "../fixtures/rdkit-database";
import {
  quoteRdkitIdentifier as quote,
  rdkitNativeCases,
  rdkitPublicValue,
  rdkitNativeSql,
  rdkitSeedSql,
  type RdkitSeed,
} from "../fixtures/rdkit-native-cases";
import {
  rdkitGeneratedHandler,
  rdkitGeneratedOutput,
  rdkitGeneratedQueryCount,
  rdkitGeneratedSchema,
  rdkitGeneratedSelection,
  rdkitGeneratedTypeProof,
} from "../fixtures/rdkit-generated-project";

const placement = rdkitGeneratedSelection.rdkit.schema;

extensionProofTest(
  rdkitGenerationProofCase,
  async () => {
    const source = extensionBindingsSource(rdkitGeneratedSelection);
    expect(source).toContain('import { createRdkit_4_8_0 } from "kello/extensions/rdkit";');
    expect(source).toContain(manifest.digest);
    for (const forbidden of ["kello/extensions/seg", "kello/extensions/cube", "./schema", "./server"])
      expect(source).not.toContain(forbidden);
    const unsupported = extensionBindingsSource({ rdkit: { version: "0.0.0", schema: placement } });
    expect(unsupported).not.toContain("createRdkit_4_8_0");
    expect(unsupported).toContain('"status":"unverified"');
    await withRdkitDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      const root = await mkdtemp(join(tmpdir(), "loom-rdkit-generated-"));
      const component = join(root, "kello/components/chemistry");
      const runtimeRole = `gen_rdkit_${crypto.randomUUID().replaceAll("-", "")}`;
      let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
      try {
        await client.query(
          `CREATE SCHEMA ${quote(placement)}; DROP EXTENSION rdkit; CREATE EXTENSION rdkit WITH SCHEMA ${quote(placement)} VERSION '4.8.0'`,
        );
        const seeds = new Map<RdkitSeed, string>();
        const seed = async (name: RdkitSeed) => {
          if (!seeds.has(name))
            seeds.set(name, (await client.query<{ value: string }>(rdkitSeedSql(placement, name))).rows[0]!.value);
          return seeds.get(name)!;
        };
        const queryIds = rdkitAnnotations.filter((row) => row.disposition === "query").map((row) => row.id);
        const native = rdkitNativeCases(queryIds);
        const cases = [];
        const expected = [];
        const excluded: string[] = [];
        for (const entry of native) {
          // Always-failing and search_path-dependent members are proven natively in extensions-rdkit.test.ts.
          if (entry.failure || entry.searchPath) {
            excluded.push(entry.id);
            continue;
          }
          const texts = await Promise.all(entry.arguments.map((argument) => seed(argument.seed)));
          cases.push({
            id: entry.id,
            aggregate:
              entry.kind === "aggregate" && entry.arguments[0]
                ? `${entry.arguments[0].type.namespace === "pg_catalog" ? "pg_catalog" : quote(placement)}.${quote(entry.arguments[0].type.name)}`
                : undefined,
            values:
              entry.kind === "aggregate"
                ? texts
                : entry.arguments.map((argument, index) => rdkitPublicValue(argument.type, texts[index]!)),
          });
          const row = (await client.query<{ value: string | null }>(rdkitNativeSql(placement, entry), texts)).rows[0]!;
          expected.push({ id: entry.id, value: rdkitPublicValue(entry.result, row.value) });
        }

        await initializeProject(root, "rdkitgenerated");
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
          `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { rdkit: { version: "4.8.0", schema: ${JSON.stringify(placement)} } } } });`,
        );
        await writeFile(join(root, "kello/schema.ts"), rdkitGeneratedSchema(placement, "app"));
        await writeFile(join(component, "schema.ts"), rdkitGeneratedSchema(placement, componentNamespace("chemistry")));
        await writeFile(
          join(component, "setup.ts"),
          'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "chemistry", extensions: { rdkit: { versions: ["4.8.0"] } }, rpc: ({ os }) => ({ os }) });',
        );
        await writeFile(
          join(root, "kello/app.config.ts"),
          'import { defineApplication } from "kello/server"; import chemistry from "./components/chemistry/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(chemistry); export default app;',
        );
        await writeFile(
          join(component, "contracts/members.ts"),
          `import { defineContract, oc } from "../_generated/contract"; import * as v from "valibot"; export default defineContract({ run: oc.output(${rdkitGeneratedOutput}) });`,
        );
        await writeFile(
          join(root, "kello/contracts/tasks.ts"),
          `import { defineContract, oc } from "kello/contract"; import * as v from "valibot"; const result = ${rdkitGeneratedOutput}; export default defineContract({ list: oc.output(v.object({ root: result, child: result })) });`,
        );
        const imports =
          'import { os } from "../_generated/rpc"; import { Extensions } from "../_generated/server"; import { Effect } from "effect"; import { sql, type SQL } from "drizzle-orm";';
        const handler = rdkitGeneratedHandler(cases, excluded);
        await writeFile(
          join(component, "functions/members.ts"),
          `${imports} export default os.members.router({ run: os.members.run.handler(async ({ context }) => { ${handler} return output; }) });`,
        );
        await writeFile(
          join(root, "kello/functions/tasks.ts"),
          `${imports} export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => { ${handler} return { root: output, child: await context.components.chemistry.rpc.members.run() }; }) });`,
        );
        await writeFile(join(root, "kello/rdkit-types.ts"), rdkitGeneratedTypeProof);

        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        await assert.rejects(readFile(join(component, "_generated/extensions.ts")), { code: "ENOENT" });
        const first = await loadProject(root);
        const virtual = projectRuntimeGraph(first).scopes.find((scope) => scope.name === "chemistry");
        assert(virtual && "extensions" in virtual);
        expect(Object.keys(virtual.extensions!)).toEqual(["rdkit"]);
        const generated = await generateProject(root);
        const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
        const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
        expect(server.extensions).toBe(disk.extensions);
        expect(Object.keys(disk.extensions)).toEqual(["rdkit"]);
        expect(disk.extensions.rdkit.schema).toBe(placement);
        expect(disk.extensions.rdkit.apiSupport.digest).toBe(manifest.digest);
        expect(Object.keys(disk.extensions.rdkit.sql.overloads)).toHaveLength(rdkitGeneratedQueryCount);
        expect(Object.keys(disk.extensions.rdkit.sql.casts)).toHaveLength(3);
        const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
        expect(Object.keys(child.extensions)).toEqual(["rdkit"]);
        expect(child.extensions.rdkit.schema).toBe(placement);
        const typecheck = Bun.spawn(
          [
            fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
            "-p",
            join(root, "tsconfig.json"),
          ],
          { stdout: "pipe", stderr: "pipe" },
        );
        const output = (await new Response(typecheck.stdout).text()) + (await new Response(typecheck.stderr).text());
        assert.equal(await typecheck.exited, 0, output);
        expect((await generateProject(root)).version).toBe(generated.version);

        const { runtimeOptions } = await import(
          pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href
        );
        const options = runtimeOptions();
        const mounted = options.scopes.find((scope: { name: string }) => scope.name === "chemistry");
        assert(mounted);
        expect(Object.keys(mounted.extensions)).toEqual(["rdkit"]);
        for (const schema of [options.schema, mounted.schema]) {
          const table = getTableConfig(schema.tables.molecules);
          assert(table.schema);
          const s = quote(placement);
          await client.query(
            `CREATE SCHEMA IF NOT EXISTS ${quote(table.schema)}; CREATE TABLE ${quote(table.schema)}.${quote(table.name)} (_id uuid PRIMARY KEY, "_createdAt" bigint NOT NULL, structure ${s}.mol NOT NULL, query ${s}.qmol, bits ${s}.bfp, sparse ${s}.sfp[])`,
          );
        }
        const roleOutput = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
        if (roleOutput) {
          assert(process.env.LOOM_EXTENSION_PROOF_RUN_ID);
          appendFileSync(
            roleOutput,
            JSON.stringify({
              runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
              name: runtimeRole,
              sha256: createHash("sha256").update(runtimeRole).digest("hex"),
            }) + "\n",
            { mode: 0o600 },
          );
        }
        await bootstrapDatabase({ connectionString: url, metadataNamespace: options.metadataNamespace, runtimeRole });
        const runtimePassword = crypto.randomUUID().replaceAll("-", "");
        await client.query(`ALTER ROLE ${quote(runtimeRole)} LOGIN PASSWORD '${runtimePassword}'`);
        for (const namespace of new Set([
          placement,
          options.schema.metadata.namespace,
          mounted.schema.metadata.namespace,
        ])) {
          await client.query(`GRANT USAGE ON SCHEMA ${quote(namespace)} TO ${quote(runtimeRole)}`);
          await client.query(`GRANT SELECT ON ALL TABLES IN SCHEMA ${quote(namespace)} TO ${quote(runtimeRole)}`);
        }
        const runtimeAddress = new URL(url);
        runtimeAddress.username = runtimeRole;
        runtimeAddress.password = runtimePassword;
        const principal = new pg.Client({ connectionString: runtimeAddress.href });
        try {
          await principal.connect();
          const identity = (
            await principal.query(
              "SELECT current_user AS name, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls FROM pg_roles WHERE rolname=current_user",
            )
          ).rows[0];
          expect(identity).toEqual({
            name: runtimeRole,
            rolsuper: false,
            rolcreatedb: false,
            rolcreaterole: false,
            rolreplication: false,
            rolbypassrls: false,
          });
        } finally {
          await principal.end();
        }
        runtime = await createRpcRuntime({
          ...options,
          connectionString: runtimeAddress.href,
          deployment: "generated-rdkit",
          auth: defineRpcAuth({ authorize: async () => {} }),
          assertActive: async (signal) => signal.throwIfAborted(),
        });
        const route = getRouter(runtime.router, ["tasks", "list"]);
        assert(route instanceof Procedure);
        const invocation = { requestId: "generated-rdkit", identity: null, signal: new AbortController().signal };
        const actual = await call(route, undefined, {
          context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
          path: ["tasks", "list"],
        });
        const result = { version: "4.8.0", placement, results: expected };
        expect(expected).toHaveLength(rdkitGeneratedQueryCount + 3 - excluded.length);
        expect(excluded).toHaveLength(8);
        expect(actual).toEqual({ root: result, child: result });
      } finally {
        try {
          await runtime?.stop();
        } finally {
          try {
            const exists = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [runtimeRole]);
            if (exists.rows.length)
              await client.query(
                `GRANT ${quote(runtimeRole)} TO CURRENT_USER; DROP OWNED BY ${quote(runtimeRole)}; DROP ROLE ${quote(runtimeRole)}`,
              );
          } finally {
            await client.end();
            await rm(root, { recursive: true, force: true });
          }
        }
      }
    });
  },
  300_000,
);
