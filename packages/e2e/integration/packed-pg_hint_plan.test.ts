import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as v from "valibot";
import { extensionProofTest } from "../fixtures/extension-proof";
import { pgHintPlanConsumerProofCase } from "../fixtures/pg_hint_plan-proof-cases";
import { writePgHintPlanProjectFiles } from "../fixtures/pg_hint_plan-generated-project";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  readTarEntries,
  sha256,
} from "../fixtures/proof-artifact";

extensionProofTest(
  pgHintPlanConsumerProofCase,
  async () => {
    // The parent owns the build/pack. This test consumes precisely that archive, never workspace exports.
    const archive = process.env.LOOM_PG_HINT_PLAN_TARBALL;
    assert(archive, "Parent must supply LOOM_PG_HINT_PLAN_TARBALL from its fresh canonical build/pack");
    const root = await mkdtemp(join(tmpdir(), "loom-packed-pg_hint_plan-"));
    async function run(command: string[], databaseUrl?: string) {
      const environment = { ...process.env };
      if (databaseUrl) environment.LOOM_PACKED_PG_HINT_PLAN_DATABASE_URL = databaseUrl;
      const child = Bun.spawn(command, {
        cwd: root,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 120000,
        env: environment,
      });
      const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      let output = stdout + stderr;
      if (databaseUrl) output = output.replaceAll(databaseUrl, "[redacted]");
      output = output.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
      assert.equal(code, 0, output);
    }
    try {
      const bytes = await readFile(archive);
      const digest = sha256(bytes);
      const entries = readTarEntries(bytes);
      for (const file of [
        "package/dist/core/extensions/adapters/pg_hint_plan.js",
        "package/dist/core/extensions/adapters/pg_hint_plan.d.ts",
        "package/dist/tooling/extensions/operations/pg_hint_plan.js",
        "package/dist/tooling/extensions/operations/pg_hint_plan.d.ts",
      ])
        assert(entries.get(file)?.length, `Missing compiled tarball surface: ${file}`);
      const manifest = v.parse(
        v.object({
          dependencies: v.record(v.string(), v.string()),
          devDependencies: v.record(v.string(), v.string()),
          exports: v.record(v.string(), v.unknown()),
        }),
        JSON.parse(entries.get("package/package.json")!.toString("utf8")),
      );
      for (const key of ["./extensions/pg-hint-plan", "./tooling/extensions/pg-hint-plan"])
        assert(manifest.exports[key], `Missing packed export: ${key}`);
      await writeFile(join(root, "kello.tgz"), bytes, { flag: "wx" });
      const retained = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
      if (retained) {
        await copyFile(join(root, "kello.tgz"), retained, constants.COPYFILE_EXCL);
        assert.equal(sha256(await readFile(retained)), digest);
      }
      await run([
        "node",
        "-e",
        "if(process.versions.node.split('.')[0]!=='24') throw new Error('pg_hint_plan isolated consumer requires Node 24');",
      ]);
      await writeFile(
        join(root, "package.json"),
        JSON.stringify({
          private: true,
          type: "module",
          dependencies: {
            ...manifest.dependencies,
            kello: "file:./kello.tgz",
            "drizzle-orm": manifest.devDependencies["drizzle-orm"],
          },
          devDependencies: {
            typescript: manifest.devDependencies.typescript,
            "@types/node": manifest.devDependencies["@types/node"],
            "@types/pg": manifest.devDependencies["@types/pg"],
          },
        }),
      );
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
      const lockfile = await consumerLockfileSha256(root);
      await removeConsumerNodeModules(root);
      assert.equal(await consumerLockfileSha256(root), lockfile);
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated", "--frozen-lockfile"]);
      assert.equal(await consumerLockfileSha256(root), lockfile);
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), digest);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
      process.stdout.write(
        `pg_hint_plan cold/frozen installed-byte integrity passed: tarball ${digest}, lockfile ${lockfile}\n`,
      );
      await writeFile(
        join(root, "prepare.mjs"),
        `import { initializeProject } from "kello/tooling";
for (const name of ["project", "absent", "empty", "future"]) await initializeProject(name, "hintplan" + name);`,
      );
      await run(["node", "prepare.mjs"]);
      await writePgHintPlanProjectFiles(join(root, "project"));
      await writeFile(
        join(root, "empty/kello.config.ts"),
        'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: {} } });',
      );
      await writeFile(
        join(root, "future/kello.config.ts"),
        'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { pg_hint_plan: { version: "future", schema: "hint_plan" } } } });',
      );
      await writeFile(
        join(root, "generate.mjs"),
        `import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { generateProject, loadProject } from "kello/tooling";
for (const name of ["project", "absent", "empty", "future"]) {
  await assert.rejects(readFile(name + "/kello/_generated/extensions.ts"), { code: "ENOENT" });
  await loadProject(name);
  await generateProject(name);
}
const emitted = await readFile("project/kello/_generated/extensions.ts", "utf8");
assert.match(emitted, /createPgHintPlan_1_8_0/);
assert.match(emitted, /kello\\/extensions\\/pg-hint-plan/);
assert.doesNotMatch(emitted, /tooling\\/extensions|kello\\.config|\\.\\.\\/schema/);`,
      );
      await run(["node", "generate.mjs"]);
      await run([join(root, "node_modules/.bin/tsc"), "-p", "project/tsconfig.json"]);
      await writeFile(
        join(root, "bundle.mjs"),
        `import assert from "node:assert/strict";
import { realpath, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
const packageRoot = await realpath("node_modules/kello");
for (const name of ["kello/extensions/pg-hint-plan", "kello/tooling/extensions/pg-hint-plan"])
  assert((await realpath(fileURLToPath(import.meta.resolve(name)))).startsWith(packageRoot + "/dist/"));
const selections = { selected: "project/kello/components/planner/_generated/extensions.ts", absent: "absent/kello/_generated/extensions.ts", empty: "empty/kello/_generated/extensions.ts", future: "future/kello/_generated/extensions.ts" };
for (const [name, entry] of Object.entries(selections)) {
  const result = await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", target: "node24", write: false, metafile: true, external: ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])} });
  const inputs = Object.keys(result.metafile.inputs);
  assert(!inputs.some(path => path.includes("/tooling/")));
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !/pg_hint_plan(?:-codecs)?\\.js$/.test(path)));
  assert.equal(inputs.some(path => path.endsWith("/adapters/pg_hint_plan.js")), name === "selected");
  const text = result.outputFiles[0].text;
  assert(!/\\bBun\\b|from ["']bun(?:["':])/.test(text));
  assert(!/\\bwithPgHintPlan\\b|\\bwithExtensionOperation\\b|\\bverifyExtensionApiContracts\\b/.test(text));
  const factories = [...new Set(text.match(/\\bcreate[A-Za-z0-9]+_\\d+(?:_\\d+)+\\b/g) ?? [])];
  assert.deepEqual(factories, name === "selected" ? ["createPgHintPlan_1_8_0"] : []);
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (name === "selected") {
    assert.deepEqual(Object.keys(extensions), ["pg_hint_plan"]);
    assert.equal(extensions.pg_hint_plan.schema, "hint_plan");
    assert.equal(extensions.pg_hint_plan.version, "1.8.0");
    assert.deepEqual(extensions.pg_hint_plan.sql, { functions: {}, operators: {} });
    assert.equal(extensions.pg_hint_plan.upsertHint.authority, "operator");
  } else if (name === "future") {
    assert.equal(extensions.pg_hint_plan.apiSupport.status, "unverified");
    assert.equal(extensions.pg_hint_plan.sql, undefined);
  } else assert.equal(extensions, undefined);
}`,
      );
      await run(["node", "bundle.mjs"]);
      process.stdout.write(
        "pg_hint_plan installed disk generation, declaration compilation and bundle selection passed\n",
      );
      await writeFile(
        join(root, "native.mjs"),
        String.raw`
import assert from "node:assert/strict";
import pg from "pg";
import { sql, defineRelations } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { defineSchema, connectDatabase, createProjectServices, createProjectProcedures, Invocation, serializeRpcValue, deserializeRpcValue } from "kello/server";
import { withPgHintPlan } from "kello/tooling/extensions/pg-hint-plan";
import { extensions } from "./project/kello/components/planner/_generated/extensions.ts";
const url = process.env.LOOM_PACKED_PG_HINT_PLAN_DATABASE_URL;
assert(url);
const api = extensions.pg_hint_plan;
const client = new pg.Client({ connectionString: url });
await client.connect();
let connection;
const scans = (text) => { const visit = (node) => [node["Node Type"], ...(node.Plans ?? []).flatMap(visit)]; return visit(JSON.parse(text)[0].Plan); };
const parts = ["select * from public.hint_items t where t.id = ", ""];
const lookup = sql(Object.assign(parts, { raw: parts }), 42);
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE EXTENSION pg_hint_plan VERSION '1.8.0'; CREATE TABLE public.hint_items(id integer PRIMARY KEY, label text); INSERT INTO public.hint_items SELECT n, 'item ' || n FROM generate_series(1, 20000) n; ANALYZE public.hint_items");
  const schema = defineSchema(() => ({}));
  connection = await connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString: url });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, defineRelations(schema.tables), extensions);
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    assert.equal(context.extensions.pg_hint_plan, api);
    return api.version;
  });
  const invocation = { requestId: "packed-pg_hint_plan", identity: null, signal: new AbortController().signal };
  assert.equal(await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } }), "1.8.0");
  let escaped;
  const result = await withPgHintPlan(url, api, async session => {
    escaped = session;
    assert.equal((await session.prerequisites()).loaded, true);
    const id = await session.queryId(lookup);
    assert.equal(typeof id, "bigint");
    assert.deepEqual(scans((await session.explain(lookup)).text), ["Index Scan"]);
    const row = await session.upsertHint({ queryId: id, applicationName: "", hints: "SeqScan(t)" });
    assert.equal(row.query_id, id);
    await session.configure({ enableHintTable: true });
    assert.deepEqual(scans((await session.explain(lookup)).text), ["Seq Scan"]);
    const rows = [...await session.hints()];
    assert.deepEqual(rows, [row]);
    assert.deepEqual(deserializeRpcValue(serializeRpcValue(rows)), rows);
    assert.deepEqual(api.codec.decode(api.codec.encode(row)), row);
    const bounded = { dimensions: [{ lowerBound: -1, length: 2 }], values: [row, null] };
    assert.deepEqual(api.arrayCodec.decode(api.arrayCodec.encode(bounded)), bounded);
    return row;
  });
  assert.equal(result.completion, "committed");
  await assert.rejects(escaped.hints(), /inactive|owner/);
  assert.equal((await client.query("SELECT current_setting('pg_hint_plan.enable_hint_table') AS v")).rows[0].v, "off");
  await connection.transaction(async db => {
    const hints = api.hintRows("h");
    const observed = await db.select(hints.columns).from(hints.from);
    assert.deepEqual(observed, [result.value]);
    assert.deepEqual(deserializeRpcValue(serializeRpcValue(observed)), observed);
  });
  await client.query("SET pg_hint_plan.enable_hint_table = on");
  const plan = await client.query({ text: "EXPLAIN (FORMAT JSON) select * from public.hint_items t where t.id = $1", values: [42], types: { getTypeParser: () => (value) => value } });
  assert.deepEqual(scans(plan.rows[0]["QUERY PLAN"]), ["Seq Scan"]);
} finally { if (connection) await connection.close(); await client.end(); }
`,
      );
      await writeFile(
        join(root, "bundle-native.mjs"),
        `import { build } from "esbuild";
await build({ entryPoints: ["native.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "native-bundle.mjs", external: ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])} });`,
      );
      await run(["node", "bundle-native.mjs"]);
      await withExtensionDatabase((url) => run(["node", "native-bundle.mjs"], url));
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), digest);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
