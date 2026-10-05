import { test } from "bun:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import pg from "pg";
import * as v from "valibot";
import { bootstrapDatabase, generateProject, initializeProject, loadProject } from "kello/tooling";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import {
  checkPostgisSfcgalDiskBindings,
  postgisSfcgalModes,
  postgisSfcgalRpcResultValidator,
  postgisSfcgalSchemas,
  writePostgisSfcgalProject,
} from "../fixtures/postgis-sfcgal-generated-project";
import { postgisSfcgalRawWitnesses, postgisSfcgalSameNative } from "../fixtures/postgis-sfcgal-witnesses";

// Actual public compiled kello exports. Native calls run only in this test's own UUID-named container built from the
// owned SFCGAL 2.3.0 recipe (postgis-sfcgal-2.3-native.Dockerfile), so every one of the 76 members has a native value.
const image = process.env.LOOM_POSTGIS_SFCGAL_IMAGE ?? "loom-postgis-sfcgal-3.6.4-sfcgal2.3.0-pg18:local";

test("postgis_sfcgal first load, disk generation, strict types and compiled RPC/Effect native invocation", async () => {
  const container = `loom-sfcgal-gen-${crypto.randomUUID()}`;
  const password = crypto.randomUUID();
  execFileSync("docker", ["run", "-d", "--rm", "--name", container, "-e", `POSTGRES_PASSWORD=${password}`, "-p", "127.0.0.1::5432", image]);
  const roots: string[] = [];
  const observed: Record<string, { readonly version: string; readonly members?: number; readonly library?: string | null }> = {};
  try {
    const port = execFileSync("docker", ["port", container, "5432/tcp"], { encoding: "utf8" }).trim().split(":").at(-1);
    const base = `postgresql://postgres:${password}@127.0.0.1:${port}`;
    for (let attempt = 0; ; attempt++) {
      const probe = new pg.Client({ connectionString: `${base}/postgres` });
      try { await probe.connect(); await probe.query("SELECT 1"); await probe.end(); break; }
      catch (error) { await probe.end().catch(() => {}); if (attempt > 60) throw error; await new Promise((r) => setTimeout(r, 1000)); }
    }
    const modules = fileURLToPath(new URL("../../tests/node_modules/", import.meta.url));
    const work = await mkdtemp(join(tmpdir(), "loom-postgis-sfcgal-generation-"));
    roots.push(work);
    for (const mode of postgisSfcgalModes) {
      const root = join(work, mode);
      const namespace = `sfcgal_${mode}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
      await initializeProject(root, namespace);
      await mkdir(join(root, "node_modules"));
      for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
        await symlink(await realpath(join(modules, name)), join(root, "node_modules", name));
      await writePostgisSfcgalProject(root, mode, namespace);
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      assert(await loadProject(root));
      const generated = await generateProject(root);
      await checkPostgisSfcgalDiskBindings(root, mode);
      assert.equal((await generateProject(root)).version, generated.version);
      const typecheck = Bun.spawn([fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")], { stdout: "pipe", stderr: "pipe" });
      const [stdout, stderr, code] = await Promise.all([new Response(typecheck.stdout).text(), new Response(typecheck.stderr).text(), typecheck.exited]);
      assert.equal(code, 0, `${mode}\n${stdout}${stderr}`);
      if (mode !== "custom" && mode !== "default") { observed[mode] = { version: generated.version }; continue; }

      const database = `sfcgal_${mode}_${crypto.randomUUID().replaceAll("-", "")}`;
      const control = new pg.Client({ connectionString: `${base}/postgres` });
      await control.connect();
      await control.query(`CREATE DATABASE ${pg.escapeIdentifier(database)}`);
      await control.end();
      const url = `${base}/${database}`;
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
      try {
        const p = pg.escapeIdentifier(postgisSfcgalSchemas[mode].postgis);
        const s = pg.escapeIdentifier(postgisSfcgalSchemas[mode].postgis_sfcgal);
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${p}; CREATE SCHEMA IF NOT EXISTS ${s}; CREATE EXTENSION postgis WITH SCHEMA ${p} VERSION '3.6.4'; CREATE EXTENSION postgis_sfcgal WITH SCHEMA ${s} VERSION '3.6.4'`);
        // Deprecated ST_* wrappers resolve _postgis_deprecate and CG_* through search_path (native 42883 otherwise).
        await client.query(`ALTER DATABASE ${pg.escapeIdentifier(database)} SET search_path = "$user", public, ${p}, ${s}`);
        const { runtimeOptions } = await import(pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href);
        const options = runtimeOptions();
        await bootstrapDatabase({ connectionString: url, metadataNamespace: options.metadataNamespace, runtimeRole: `${database}_rt` });
        runtime = await createRpcRuntime({ ...options, connectionString: url, deployment: `postgis-sfcgal-${mode}`, auth: defineRpcAuth({ authorize: async () => {} }), assertActive: async (signal) => signal.throwIfAborted() });
        const route = getRouter(runtime.router, ["spatial", "native"]);
        assert(route instanceof Procedure);
        const invocation = { requestId: `postgis-sfcgal-${mode}`, identity: null, signal: new AbortController().signal };
        const actual = v.parse(postgisSfcgalRpcResultValidator, await call(route, undefined, { context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) }, path: ["spatial", "native"] }));
        assert.equal(actual.schema, postgisSfcgalSchemas[mode].postgis_sfcgal);
        // Raw native oracle on the same database, outside the application.
        await client.query(`BEGIN; SET LOCAL search_path = ${p}, ${s}`);
        const table = postgisSfcgalRawWitnesses(s, p);
        assert.deepEqual(Object.keys(actual.results).toSorted(), Object.keys(table).toSorted());
        assert.equal(Object.keys(table).length, 76);
        const mismatches: string[] = [];
        for (const [key, expr] of Object.entries(table)) {
          const [head, from] = expr.split(/ FROM (?=\(VALUES)/);
          const row = (await client.query(`SELECT pg_typeof(v)::text AS type, v::text AS raw FROM (SELECT ${head} AS v${from ? ` FROM ${from}` : ""}) q`)).rows[0];
          const value = row.type === "geometry" ? (await client.query(`SELECT ${p}.st_asewkt($1::${p}.geometry) AS v`, [row.raw])).rows[0].v : row.raw;
          const got = actual.results[key]!;
          if (!postgisSfcgalSameNative(key, row.type, got.text, value) || (row.type === "geometry") !== (got.kind === "geometry"))
            mismatches.push(`${key}: app=${JSON.stringify(got)} native=${row.type}:${JSON.stringify(value)}`);
        }
        await client.query("ROLLBACK");
        assert.deepEqual(mismatches, []);
        observed[mode] = { version: generated.version, members: Object.keys(actual.results).length, library: actual.results["postgis_sfcgal_version/0"]?.text ?? null };
      } finally {
        await runtime?.stop();
        await client.end();
      }
    }

    // A companion without its PostGIS dependency is rejected by generation, not silently emitted.
    const orphan = join(work, "orphan");
    await initializeProject(orphan, "sfcgal_orphan");
    await mkdir(join(orphan, "node_modules"));
    for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
      await symlink(await realpath(join(modules, name)), join(orphan, "node_modules", name));
    await writePostgisSfcgalProject(orphan, "custom", "sfcgal_orphan");
    const config = join(orphan, "kello.config.ts");
    await Bun.write(config, (await readFile(config, "utf8")).replace(/"postgis":\{[^}]*\},/, ""));
    await assert.rejects(async () => { await loadProject(orphan); await generateProject(orphan); }, /requires an explicitly selected PostGIS 3\.6\.4 dependency/);
    console.log(JSON.stringify({ publicCompiled: true, firstLoad: true, disk: true, strictTypes: true, compiledRpc: true, effect: true, orphanRejected: true, observed }));
  } finally {
    execFileSync("docker", ["rm", "-f", container]);
    for (const root of roots) await rm(root, { recursive: true, force: true });
  }
}, 600000);
