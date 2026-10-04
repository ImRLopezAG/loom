import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import pg from "pg";
import * as v from "valibot";
import { bootstrapDatabase, generateProject, initializeProject, loadProject } from "kello/tooling";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest } from "../fixtures/extension-proof";
import { dblinkGenerationProofCase } from "../fixtures/dblink-proof-cases";
import {
  checkDblinkDiskBindings,
  dblinkGeneratedInsert,
  dblinkGeneratedTable,
  writeDblinkEmptyProject,
  writeDblinkExplicitEmptyProject,
  writeDblinkOmittedProject,
  writeDblinkFutureProject,
  writeDblinkSelectedProject,
} from "../fixtures/dblink-generated-project";

async function projectFixture(name: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), `loom-dblink-${name}-`));
  try {
    await initializeProject(root, name);
    await mkdir(join(root, "node_modules"));
    for (const pkg of ["kello", "valibot", "drizzle-orm", "effect"])
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${pkg}`, import.meta.url))),
        join(root, "node_modules", pkg),
      );
    return root;
  } catch (cause) {
    await rm(root, { recursive: true, force: true });
    throw cause;
  }
}

async function checkFixtureTypes(root: string): Promise<void> {
  const child = Bun.spawn(
    [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
    { stdout: "pipe", stderr: "pipe" },
  );
  const output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
  assert.equal(await child.exited, 0, output);
}

extensionProofTest(
  dblinkGenerationProofCase,
  async () => {
    const emptyRoot = await projectFixture("dblinkempty");
    try {
      await writeDblinkEmptyProject(emptyRoot);
      await assert.rejects(readFile(join(emptyRoot, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      const emptyFirst = await loadProject(emptyRoot);
      assert.equal(emptyFirst.config.database.extensions, undefined);
      const emptyGenerated = await generateProject(emptyRoot);
      const emptyDisk = await import(pathToFileURL(join(emptyRoot, "kello/_generated/extensions.ts")).href);
      assert.equal(emptyDisk.extensions, undefined);
      assert.equal(emptyDisk.selection, undefined);
      assert.equal((await generateProject(emptyRoot)).version, emptyGenerated.version);
    } finally {
      await rm(emptyRoot, { recursive: true, force: true });
    }

    const explicitRoot = await projectFixture("dblinkexplicit");
    try {
      await writeDblinkExplicitEmptyProject(explicitRoot);
      const explicitFirst = await loadProject(explicitRoot);
      assert.equal(explicitFirst.config.database.extensions, undefined);
      const explicitGenerated = await generateProject(explicitRoot);
      const explicitDisk = await import(pathToFileURL(join(explicitRoot, "kello/_generated/extensions.ts")).href);
      assert.equal(explicitDisk.extensions?.dblink, undefined);
      assert.equal((await generateProject(explicitRoot)).version, explicitGenerated.version);
    } finally {
      await rm(explicitRoot, { recursive: true, force: true });
    }

    const omittedRoot = await projectFixture("dblinkomitted");
    try {
      await writeDblinkOmittedProject(omittedRoot);
      const omittedFirst = await loadProject(omittedRoot);
      assert.equal(omittedFirst.config.database.extensions?.dblink, undefined);
      const omittedGenerated = await generateProject(omittedRoot);
      const omittedSource = await readFile(join(omittedRoot, "kello/_generated/extensions.ts"), "utf8");
      assert(!omittedSource.includes("dblink"));
      const omittedDisk = await import(pathToFileURL(join(omittedRoot, "kello/_generated/extensions.ts")).href);
      assert.deepEqual(Object.keys(omittedDisk.extensions), ["fuzzystrmatch"]);
      await checkFixtureTypes(omittedRoot);
      assert.equal((await generateProject(omittedRoot)).version, omittedGenerated.version);
    } finally {
      await rm(omittedRoot, { recursive: true, force: true });
    }

    const futureRoot = await projectFixture("dblinkfuture");
    try {
      await writeDblinkFutureProject(futureRoot);
      await assert.rejects(readFile(join(futureRoot, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      const futureFirst = await loadProject(futureRoot);
      assert.deepEqual(futureFirst.config.database.extensions?.dblink, { version: "future", schema: "extensions" });
      const futureGenerated = await generateProject(futureRoot);
      const futureSource = await readFile(join(futureRoot, "kello/_generated/extensions.ts"), "utf8");
      assert(!futureSource.includes("createDblink_1_2"));
      assert(futureSource.includes('"status":"unverified"'));
      const futureDisk = await import(pathToFileURL(join(futureRoot, "kello/_generated/extensions.ts")).href);
      assert.equal(futureDisk.extensions.dblink.apiSupport.status, "unverified");
      assert.equal("connections" in futureDisk.extensions.dblink, false);
      assert.equal((await generateProject(futureRoot)).version, futureGenerated.version);
    } finally {
      await rm(futureRoot, { recursive: true, force: true });
    }

    for (const schema of [undefined, "dblink_cache"]) {
      const root = await projectFixture("dblinkselected");
      try {
        const placement = await writeDblinkSelectedProject(root, schema);
        const component = join(root, "kello/components/remote");
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        await assert.rejects(readFile(join(component, "_generated/extensions.ts")), { code: "ENOENT" });
        const first = await loadProject(root);
        assert.deepEqual(first.config.database.extensions?.dblink, { version: "1.2", schema: placement });
        assert.equal(first.componentScopes.length, 1);
        assert.deepEqual(Object.keys(first.componentScopes[0]!.boundExtensions ?? {}), ["dblink"]);
        const generated = await generateProject(root);
        await checkDblinkDiskBindings(root, placement);
        const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
        assert.deepEqual(Object.keys(child.extensions), ["dblink"]);
        assert.equal(child.extensions.dblink.schema, placement);
        await checkFixtureTypes(root);
        assert.equal((await generateProject(root)).version, generated.version);
        const { runtimeOptions } = await import(
          pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href
        );
        const options = runtimeOptions();
        const mounted = options.scopes.find((scope: { name: string }) => scope.name === "remote");
        assert(mounted);
        assert.deepEqual(Object.keys(mounted.extensions), ["dblink"]);
        assert.equal(mounted.extensions.dblink.schema, placement);
        await withExtensionDatabase(async (url) => {
          const operator = new pg.Client({ connectionString: url });
          await operator.connect();
          const runtimeRole = `gen_dblink_${crypto.randomUUID().replaceAll("-", "")}`;
          let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
          try {
            const quoted = '"' + placement.replaceAll('"', '""') + '"';
            await operator.query(
              `CREATE SCHEMA IF NOT EXISTS ${quoted}; CREATE EXTENSION dblink WITH SCHEMA ${quoted} VERSION '1.2';
               CREATE TABLE public.${dblinkGeneratedTable}(id integer PRIMARY KEY, label text NOT NULL);
               INSERT INTO public.${dblinkGeneratedTable} VALUES (1, 'alpha')`,
            );
            const runtimePassword = crypto.randomUUID();
            await operator.query(`CREATE ROLE "${runtimeRole}" LOGIN NOINHERIT PASSWORD '${runtimePassword}'`);
            await bootstrapDatabase({
              connectionString: url,
              metadataNamespace: options.metadataNamespace,
              runtimeRole,
            });
            const role = await operator.query<{ rolcanlogin: boolean; rolsuper: boolean; operator: string }>(
              "SELECT rolcanlogin, rolsuper, current_user AS operator FROM pg_catalog.pg_roles WHERE rolname=$1",
              [runtimeRole],
            );
            assert.equal(role.rows.length, 1);
            assert.equal(role.rows[0]!.rolcanlogin, true);
            assert.equal(role.rows[0]!.rolsuper, false);
            assert.notEqual(role.rows[0]!.operator, runtimeRole);
            const runtimeUrl = new URL(url);
            runtimeUrl.username = runtimeRole;
            runtimeUrl.password = runtimePassword;
            // The operator applies the extension-schema USAGE that migrations grant; dblink_build_sql_* also reads
            // the local row, so the runtime role receives SELECT on exactly this table and nothing administrative.
            await operator.query(
              `GRANT USAGE ON SCHEMA ${quoted} TO "${runtimeRole}"; GRANT SELECT ON public.${dblinkGeneratedTable} TO "${runtimeRole}"`,
            );
            runtime = await createRpcRuntime({
              ...options,
              connectionString: runtimeUrl.href,
              deployment: "generated-dblink",
              auth: defineRpcAuth({ authorize: async () => {} }),
              assertActive: async (signal) => signal.throwIfAborted(),
            });
            const route = getRouter(runtime.router, ["tasks", "list"]);
            assert(route instanceof Procedure);
            const invocation = { requestId: "generated-dblink", identity: null, signal: new AbortController().signal };
            const native = v.object({
              version: v.literal("1.2"),
              placement: v.literal(placement),
              connections: v.null(),
              current: v.string(),
              insert: v.literal(dblinkGeneratedInsert),
            });
            const actual = v.parse(
              v.object({ root: native, child: native }),
              await call(route, undefined, {
                context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
                path: ["tasks", "list"],
              }),
            );
            assert.equal(actual.root.placement, placement);
            assert.equal(actual.child.insert, dblinkGeneratedInsert);
          } finally {
            try {
              await runtime?.stop();
            } finally {
              try {
                const exists = await operator.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [
                  runtimeRole,
                ]);
                if (exists.rows.length)
                  await operator.query(
                    `GRANT "${runtimeRole}" TO CURRENT_USER; DROP OWNED BY "${runtimeRole}"; DROP ROLE "${runtimeRole}"`,
                  );
              } finally {
                await operator.end();
              }
            }
          }
        });
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  360000,
);
