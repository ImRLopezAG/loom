import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "bun:test";
import pg from "pg";
import * as v from "valibot";
import { postgisSfcgalRpcResultValidator, postgisSfcgalSchemas } from "../fixtures/postgis-sfcgal-generated-project";
import { postgisSfcgalRawWitnesses, postgisSfcgalSameNative } from "../fixtures/postgis-sfcgal-witnesses";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "../fixtures/proof-artifact";

/**
 * Parent owns packing and both isolated installs; this test never installs. Bun runs the packed public tooling
 * (initializeProject/loadProject/generateProject/bootstrapDatabase), then a cold Node 24 bundle of the generated RPC
 * executes all 76 postgis_sfcgal members natively in this test's own UUID-named SFCGAL 2.3.0 container.
 */
const image = process.env.LOOM_POSTGIS_SFCGAL_IMAGE ?? "loom-postgis-sfcgal-3.6.4-sfcgal2.3.0-pg18:local";

test(
  "packed postgis_sfcgal 3.6.4 consumer",
  async () => {
    const prepared = process.env.LOOM_POSTGIS_SFCGAL_CONSUMER_ROOT;
    const artifact = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
    const expectedLock = process.env.LOOM_POSTGIS_SFCGAL_CONSUMER_LOCK_SHA256;
    assert(
      prepared && artifact && expectedLock,
      "Parent must supply a fresh tarball, frozen isolated consumer root and retained lock SHA256; this test never installs dependencies",
    );
    const root = await realpath(prepared);
    const bytes = await readFile(artifact);
    const artifactHash = sha256(bytes);
    assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
    assert.equal(await consumerLockfileSha256(root), expectedLock);
    const work = join(root, "postgis_sfcgal_" + crypto.randomUUID().replaceAll("-", ""));
    await mkdir(work);
    const container = `loom-sfcgal-packed-${crypto.randomUUID()}`;
    const password = crypto.randomUUID();
    let started = false;
    async function run(command: string[], environment: Record<string, string> = {}) {
      const child = Bun.spawn(command, { cwd: work, stdout: "pipe", stderr: "pipe", env: { ...process.env, ...environment }, timeout: 300000 });
      const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
      const code = await child.exited;
      assert.equal(code, 0, `${command[0]} failed\n${(out + err).replaceAll(password, "[redacted]")}`);
      return out;
    }
    try {
      await run(["node", "-e", "if(process.versions.node.split('.')[0]!=='24') throw new Error('Node24 required: '+process.version)"]);
      for (const name of ["postgis-sfcgal-generated-project.ts", "postgis-sfcgal-witnesses.ts"])
        await copyFile(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), join(work, name));
      await writeFile(
        join(work, "generate.ts"),
        `import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { writePostgisSfcgalProject, checkPostgisSfcgalDiskBindings, postgisSfcgalModes } from "./postgis-sfcgal-generated-project.ts";
const results = [];
for (const mode of postgisSfcgalModes) {
  const root = join(process.cwd(), mode), namespace = "sfcgal_pack_" + mode + "_" + crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  await initializeProject(root, namespace); await writePostgisSfcgalProject(root, mode, namespace);
  await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
  assert(await loadProject(root)); const generated = await generateProject(root);
  await checkPostgisSfcgalDiskBindings(root, mode); assert.equal((await generateProject(root)).version, generated.version);
  results.push({ mode, version: generated.version });
}
console.log(JSON.stringify(results));`,
      );
      const results = v.parse(
        v.array(v.strictObject({ mode: v.picklist(["custom", "default", "empty", "future"]), version: v.string() })),
        JSON.parse((await run(["bun", "generate.ts"])).trim()),
      );
      assert.deepEqual(results.map((r) => r.mode), ["custom", "default", "empty", "future"]);
      for (const { mode } of results) await run([join(root, "node_modules/.bin/tsc"), "-p", join(work, mode, "tsconfig.json")]);
      await writeFile(
        join(work, "imports.mjs"),
        `import assert from "node:assert/strict";
import { realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createPostgisSfcgal_3_6_4 } from "kello/extensions/postgis-sfcgal";
const root = await realpath(fileURLToPath(new URL("../node_modules/kello/", import.meta.url)));
assert((await realpath(fileURLToPath(import.meta.resolve("kello/extensions/postgis-sfcgal")))).startsWith(root + "/dist/"));
const postgis = { name: "postgis", version: "3.6.4", schema: "p", apiSupport: { status: "verified", digest: "640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29" } };
const api = createPostgisSfcgal_3_6_4({ name: "postgis_sfcgal", version: "3.6.4", schema: "s", apiSupport: { status: "verified", digest: "a9f128c0489a24e8fa4bb0b35000570c2f8b1e6db26609863b9e4a24a1518c76" } }, postgis);
assert.equal(new Set(Object.values(api.sql.functions).flatMap((call) => call.members)).size, 76);
assert.throws(() => createPostgisSfcgal_3_6_4({ ...api, apiSupport: { status: "unverified" } }, postgis), /exact verified/);
assert.throws(() => createPostgisSfcgal_3_6_4({ ...api, apiSupport: { status: "verified", digest: "a9f128c0489a24e8fa4bb0b35000570c2f8b1e6db26609863b9e4a24a1518c76" } }, { ...postgis, version: "3.5.0" }), /postgis 3\\.6\\.4/);`,
      );
      await run(["node", "imports.mjs"]);

      execFileSync("docker", ["run", "-d", "--rm", "--name", container, "-e", `POSTGRES_PASSWORD=${password}`, "-p", "127.0.0.1::5432", image]);
      started = true;
      const port = execFileSync("docker", ["port", container, "5432/tcp"], { encoding: "utf8" }).trim().split(":").at(-1);
      const base = `postgresql://postgres:${password}@127.0.0.1:${port}`;
      for (let attempt = 0; ; attempt++) {
        const probe = new pg.Client({ connectionString: `${base}/postgres` });
        try { await probe.connect(); await probe.query("SELECT 1"); await probe.end(); break; }
        catch (error) { await probe.end().catch(() => {}); if (attempt > 60) throw error; await new Promise((r) => setTimeout(r, 1000)); }
      }
      const witnessed: Record<string, number> = {};
      for (const { mode, version } of results) {
        if (mode !== "custom" && mode !== "default") continue;
        const schemas = postgisSfcgalSchemas[mode];
        const database = `sfcgal_${mode}_${crypto.randomUUID().replaceAll("-", "")}`;
        const control = new pg.Client({ connectionString: `${base}/postgres` });
        await control.connect();
        await control.query(`CREATE DATABASE ${pg.escapeIdentifier(database)}`);
        await control.end();
        const url = `${base}/${database}`;
        const client = new pg.Client({ connectionString: url });
        await client.connect();
        try {
          const p = pg.escapeIdentifier(schemas.postgis), s = pg.escapeIdentifier(schemas.postgis_sfcgal);
          await client.query(`CREATE SCHEMA IF NOT EXISTS ${p}; CREATE SCHEMA IF NOT EXISTS ${s}; CREATE EXTENSION postgis WITH SCHEMA ${p} VERSION '3.6.4'; CREATE EXTENSION postgis_sfcgal WITH SCHEMA ${s} VERSION '3.6.4'`);
          // Deprecated ST_* wrappers resolve _postgis_deprecate and CG_* through search_path (native 42883 otherwise).
          await client.query(`ALTER DATABASE ${pg.escapeIdentifier(database)} SET search_path = "$user", public, ${p}, ${s}`);
          const runtimeModule = `./${mode}/.loom/generations/${version}/runtime.js`;
          await writeFile(
            join(work, `bootstrap-${mode}.ts`),
            `import { bootstrapDatabase } from "kello/tooling";
import { runtimeOptions } from ${JSON.stringify(runtimeModule)};
await bootstrapDatabase({ connectionString: process.env.LOOM_SFCGAL_URL!, metadataNamespace: runtimeOptions().metadataNamespace, runtimeRole: ${JSON.stringify(`${database}_rt`)} });`,
          );
          await run(["bun", `bootstrap-${mode}.ts`], { LOOM_SFCGAL_URL: url });
          await writeFile(
            join(work, `rpc-${mode}.ts`),
            `import assert from "node:assert/strict";
import { runtimeOptions } from ${JSON.stringify(runtimeModule)};
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
const url = process.env.LOOM_SFCGAL_URL; assert(url);
const runtime = await createRpcRuntime({ ...runtimeOptions(), connectionString: url, deployment: ${JSON.stringify(`packed-postgis-sfcgal-${mode}`)}, auth: defineRpcAuth({ authorize: async () => {} }), assertActive: async (signal) => signal.throwIfAborted() });
try {
  const route = getRouter(runtime.router, ["spatial", "native"]); assert(route instanceof Procedure);
  const invocation = { requestId: "packed-postgis-sfcgal", identity: null, signal: new AbortController().signal };
  console.log(JSON.stringify(await call(route, undefined, { context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) }, path: ["spatial", "native"] })));
} finally { await runtime.stop(); }`,
          );
          const bundle = join(work, `rpc-${mode}.mjs`);
          await run(["bun", "build", `rpc-${mode}.ts`, "--target=node", "--outfile", bundle, "--external=pg-native"]);
          assert((await readFile(bundle, "utf8")).includes("postgis_sfcgal 3.6.4 requires its exact verified contract"), `${mode} bundle lacks the adapter`);
          const actual = v.parse(postgisSfcgalRpcResultValidator, JSON.parse((await run(["node", bundle], { LOOM_SFCGAL_URL: url })).trim()));
          assert.equal(actual.effectSame, true);
          assert.equal(actual.version, "3.6.4");
          assert.equal(actual.schema, schemas.postgis_sfcgal);
          await client.query(`BEGIN; SET LOCAL search_path = ${p}, ${s}`);
          const table = postgisSfcgalRawWitnesses(s, p);
          assert.equal(Object.keys(table).length, 76);
          assert.deepEqual(Object.keys(actual.results).toSorted(), Object.keys(table).toSorted());
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
          witnessed[mode] = Object.keys(actual.results).length;
        } finally {
          await client.end();
        }
      }
      assert.deepEqual(witnessed, { custom: 76, default: 76 });
      assert.equal(sha256(await readFile(artifact)), artifactHash);
      assert.equal(await consumerLockfileSha256(root), expectedLock);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
      console.log(JSON.stringify({ packed: true, artifactSha256: artifactHash, lockSha256: expectedLock, modes: results, witnessed }));
    } finally {
      if (started) execFileSync("docker", ["rm", "-f", container]);
      await rm(work, { recursive: true, force: true });
    }
  },
  { timeout: 900000 },
);
