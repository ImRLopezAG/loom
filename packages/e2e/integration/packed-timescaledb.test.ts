import assert from "node:assert/strict";
import { mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as v from "valibot";
import { extensionProofTest } from "../fixtures/extension-proof";
import { timescaledbConsumerProofCase } from "../fixtures/timescaledb-proof-cases";
import { writeTimescaledbProjectFiles } from "../fixtures/timescaledb-generated-project";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  readTarEntries,
  sha256,
} from "../fixtures/proof-artifact";

extensionProofTest(
  timescaledbConsumerProofCase,
  async () => {
    // Parent owns packing and both isolated installs. This fixture never installs dependencies.
    const prepared = process.env.LOOM_TIMESCALEDB_CONSUMER_ROOT;
    const archive = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
    const expectedLock = process.env.LOOM_TIMESCALEDB_CONSUMER_LOCK_SHA256;
    assert(
      prepared && archive && expectedLock,
      "Parent must supply the fresh TimescaleDB archive, frozen isolated consumer root and retained lock SHA256; this test never installs dependencies",
    );
    const root = await realpath(prepared);
    const bytes = await readFile(archive);
    const digest = sha256(bytes);
    assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
    assert.equal(await consumerLockfileSha256(root), expectedLock);
    const work = join(root, "timescaledb_" + crypto.randomUUID().replaceAll("-", ""));
    await mkdir(work);
    async function run(command: string[], databaseUrl?: string) {
      const environment = { ...process.env };
      if (databaseUrl) environment.LOOM_PACKED_TIMESCALEDB_DATABASE_URL = databaseUrl;
      const child = Bun.spawn(command, {
        cwd: work,
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
      if (output) process.stdout.write(output);
    }
    try {
      const entries = readTarEntries(bytes);
      for (const file of [
        "package/dist/core/extensions/adapters/timescaledb.js",
        "package/dist/core/extensions/adapters/timescaledb.d.ts",
        "package/dist/tooling/extensions/operations/timescaledb.js",
        "package/dist/tooling/extensions/operations/timescaledb.d.ts",
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
      for (const key of ["./extensions/timescaledb", "./tooling/extensions/timescaledb"])
        assert(manifest.exports[key], `Missing packed export: ${key}`);
      await run([
        "node",
        "-e",
        "if(process.versions.node.split('.')[0]!=='24') throw new Error('TimescaleDB isolated consumer requires Node 24');",
      ]);
      await writeFile(
        join(work, "prepare.mjs"),
        `import { initializeProject } from "kello/tooling";
for (const name of ["project", "absent", "empty", "future"]) await initializeProject(name, "timescaledb" + name);`,
      );
      await run(["bun", "prepare.mjs"]);
      await writeTimescaledbProjectFiles(join(work, "project"), "ts_tools");
      await writeFile(
        join(work, "empty/kello.config.ts"),
        'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: {} } });',
      );
      await writeFile(
        join(work, "future/kello.config.ts"),
        'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { timescaledb: { version: "future" } } } });',
      );
      await writeFile(
        join(work, "generate.mjs"),
        `import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { generateProject, loadProject } from "kello/tooling";
for (const name of ["project", "absent", "empty", "future"]) {
  await assert.rejects(readFile(name + "/kello/_generated/extensions.ts"), { code: "ENOENT" });
  await loadProject(name);
  const generated = await generateProject(name);
  if (name === "project") await writeFile("runtime-entry.ts", 'export { runtimeOptions } from "./project/.loom/generations/' + generated.version + '/runtime.js";');
}
const emitted = await readFile("project/kello/_generated/extensions.ts", "utf8");
assert.match(emitted, /createTimescaledb_2_24_0/);
assert.match(emitted, /kello\\/extensions\\/timescaledb/);
assert.doesNotMatch(emitted, /tooling\\/extensions|kello\\.config|\\.\\.\\/schema/);`,
      );
      await run(["bun", "generate.mjs"]);
      await run([join(root, "node_modules/.bin/tsc"), "-p", "project/tsconfig.json"]);
      await writeFile(
        join(work, "bundle.mjs"),
        `import assert from "node:assert/strict";
import { realpath, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
const packageRoot = await realpath("../node_modules/kello");
for (const name of ["kello/extensions/timescaledb", "kello/tooling/extensions/timescaledb"])
  assert((await realpath(fileURLToPath(import.meta.resolve(name)))).startsWith(packageRoot + "/dist/"));
const selections = { selected: "project/kello/components/series/_generated/extensions.ts", absent: "absent/kello/_generated/extensions.ts", empty: "empty/kello/_generated/extensions.ts", future: "future/kello/_generated/extensions.ts" };
for (const [name, entry] of Object.entries(selections)) {
  const result = await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", target: "node24", write: false, metafile: true, external: ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])} });
  const inputs = Object.keys(result.metafile.inputs);
  assert(!inputs.some(path => path.includes("/tooling/")));
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !/timescaledb(?:-codecs)?\\.js$/.test(path)));
  assert.equal(inputs.some(path => path.endsWith("/adapters/timescaledb.js")), name === "selected");
  const text = result.outputFiles[0].text;
  assert(!/\\bBun\\b|from ["']bun(?:["':])/.test(text));
  assert(!/\\bwithTimescaledb\\b|\\bwithExtensionOperation\\b|\\bverifyExtensionApiContracts\\b/.test(text));
  const factories = [...new Set(text.match(/\\bcreate[A-Za-z0-9]+_\\d+(?:_\\d+)+\\b/g) ?? [])];
  assert.deepEqual(factories, name === "selected" ? ["createTimescaledb_2_24_0"] : []);
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (name === "selected") {
    assert.deepEqual(Object.keys(extensions), ["timescaledb"]);
    assert.equal(extensions.timescaledb.schema, "ts_tools");
    assert.equal(extensions.timescaledb.version, "2.24.0");
    assert.equal(Object.keys(extensions.timescaledb.sql.functions).length, 24);
    assert.equal(typeof extensions.timescaledb.createHypertable, "object");
  } else if (name === "future") {
    assert.equal(extensions.timescaledb.apiSupport.status, "unverified");
    assert.equal(extensions.timescaledb.sql, undefined);
  } else assert.equal(extensions, undefined);
}`,
      );
      await run(["node", "bundle.mjs"]);
      process.stdout.write(
        "timescaledb installed disk generation, declaration compilation and bundle selection passed\n",
      );
      const runtimeRole = "tsdb_runtime_" + crypto.randomUUID().replaceAll("-", "");
      await writeFile(
        join(work, "prepare-database.mjs"),
        `import assert from "node:assert/strict";
import pg from "pg";
import { bootstrapDatabase, loadProject, projectMigrationScopes, createSnapshot, emptySnapshot, migrationStatements, installRevisionTracking } from "kello/tooling";
import { runtimeOptions } from "./runtime-entry.ts";
const url = process.env.LOOM_PACKED_TIMESCALEDB_DATABASE_URL;
assert(url);
const options = runtimeOptions();
const role = ${JSON.stringify(runtimeRole)};
console.info("timescaledb runtime role attempted: " + role);
await bootstrapDatabase({ connectionString: url, metadataNamespace: options.metadataNamespace, runtimeRole: role });
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("ALTER ROLE " + pg.escapeIdentifier(role) + " LOGIN");
  await client.query("CREATE SCHEMA ts_tools; CREATE EXTENSION timescaledb WITH SCHEMA ts_tools VERSION '2.24.0'; CREATE SCHEMA host_text; CREATE EXTENSION pg_trgm WITH SCHEMA host_text VERSION '1.6'");
  const project = await loadProject("project");
  for (const scope of projectMigrationScopes(project)) {
    for (const statement of await migrationStatements(await emptySnapshot(scope.namespace), await createSnapshot(scope.schema))) await client.query(statement);
    await client.query("BEGIN");
    try { await installRevisionTracking(client, scope.namespace, options.metadataNamespace, scope.entityTables); await client.query("COMMIT"); }
    catch (cause) { await client.query("ROLLBACK"); throw cause; }
    await client.query("GRANT USAGE ON SCHEMA " + pg.escapeIdentifier(scope.namespace) + " TO " + pg.escapeIdentifier(role));
    await client.query("GRANT SELECT ON ALL TABLES IN SCHEMA " + pg.escapeIdentifier(scope.namespace) + " TO " + pg.escapeIdentifier(role));
  }
  await client.query("GRANT USAGE ON SCHEMA ts_tools,host_text TO " + pg.escapeIdentifier(role));
  console.info("timescaledb runtime role prepared: " + role);
} finally { await client.end(); }`,
      );
      await writeFile(
        join(work, "cleanup-role.mjs"),
        `import assert from "node:assert/strict";
import pg from "pg";
const client = new pg.Client({ connectionString: process.env.LOOM_TEST_DATABASE_URL });
await client.connect();
try {
  await client.query("DROP ROLE IF EXISTS " + pg.escapeIdentifier(${JSON.stringify(runtimeRole)}));
  assert.equal((await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [${JSON.stringify(runtimeRole)}])).rowCount, 0);
  console.info("timescaledb runtime role independently absent: " + ${JSON.stringify(runtimeRole)});
} finally { await client.end(); }`,
      );
      await writeFile(
        join(work, "native.mjs"),
        String.raw`
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context, Effect } from "effect";
import { defineSchema, connectDatabase, createProjectServices, createProjectProcedures, createRpcRuntime, defineRpcAuth, Invocation, serializeRpcValue, deserializeRpcValue } from "kello/server";
import { withTimescaledb, timescaledbApacheRestrictedMembers } from "kello/tooling/extensions/timescaledb";
import { extensions } from "./project/kello/components/series/_generated/extensions.ts";
import { runtimeOptions } from "./runtime-entry.ts";
const url = process.env.LOOM_PACKED_TIMESCALEDB_DATABASE_URL;
assert(url);
const api = extensions.timescaledb;
const prefix = pg.escapeIdentifier(api.schema);
const client = new pg.Client({ connectionString: url });
await client.connect();
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  assert.equal((await client.query("SHOW timescaledb.license")).rows[0]["timescaledb.license"], "apache");
  assert.equal((await client.query("SELECT extversion FROM pg_catalog.pg_extension WHERE extname='timescaledb'")).rows[0].extversion, "2.24.0");
  await client.query("CREATE TABLE public.metrics(time timestamptz NOT NULL, value float8); SELECT " + prefix + ".create_hypertable('public.metrics', " + prefix + ".by_range('time', INTERVAL '1 day')); INSERT INTO public.metrics SELECT TIMESTAMPTZ '2024-01-01 00:00:00+00' + n * INTERVAL '6 hours', n FROM generate_series(0, 7) n; ANALYZE public.metrics");
  const schema = defineSchema(() => ({}), { namespace: "packed_timescaledb" });
  const relations = defineRelations(schema.tables);
  connection = await connectDatabase({ schema, relations, connectionString: url });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, relations, extensions);
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    assert.equal(context.extensions.timescaledb, api);
    return api.version;
  });
  const invocation = { requestId: "packed-timescaledb", identity: null, signal: new AbortController().signal };
  assert.equal(await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } }), "2.24.0");
  const runtimeUrl = new URL(url);
  runtimeUrl.username = await readFile("runtime-role.txt", "utf8");
  runtimeUrl.password = "";
  const runtime = await createRpcRuntime({ ...runtimeOptions(), connectionString: runtimeUrl.href, deployment: "packed-timescaledb", auth: defineRpcAuth({ authorize: async () => {} }), assertActive: async signal => signal.throwIfAborted() });
  try {
    const route = getRouter(runtime.router, ["tasks", "list"]);
    assert(route instanceof Procedure);
    const result = await call(route, undefined, { context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) }, path: ["tasks", "list"] });
    assert.deepEqual(result, ["2.24.0", "ts_tools", "2.24.0"]);
  } finally { await runtime.stop(); }
  const metrics = { schema: "public", name: "metrics" };
  await connection.transaction(async db => {
    const [values] = await db.select({
      bucket: api.timeBucket.int8(10n, 15n), date: api.timeBucket.date("7 days", "2024-01-10"), version: api.uuidVersion(api.generateUuidv7()),
      rows: api.approximateRowCount(metrics), size: api.hypertableSize(metrics),
    }).from(sql.raw("(values(1)) fixture(id)"));
    assert.deepEqual({ ...values, size: typeof values.size }, { bucket: 10n, date: "2024-01-08", version: 7, rows: 8n, size: "bigint" });
    assert.deepEqual(deserializeRpcValue(serializeRpcValue(values)), values);
    const chunks = api.showChunks(metrics, "c");
    assert.equal((await db.select(chunks.columns).from(chunks.from)).length, 2);
    const hypertables = api.information("hypertables", "h");
    const [row] = await db.select(hypertables.columns).from(hypertables.from);
    assert.equal(row.num_chunks, 2n);
    assert.equal(row.primary_dimension, "time");
  });
  // Operator tooling verifies the exact captured contract before any DDL.
  const result = await withTimescaledb(url, api, async session => {
    const restrictions = await session.restrictions();
    assert.equal(restrictions.license, "apache");
    assert.deepEqual(restrictions.restricted, timescaledbApacheRestrictedMembers);
    await session.setChunkTimeInterval(metrics, { interval: "12:00:00" });
    return session.showChunks(metrics, { olderThan: { timestamptz: { type: "timestamptz", text: "2024-01-02 00:00:00.000000+00" } } });
  });
  assert.equal(result.completion, "committed");
  assert.equal(result.value.length, 1);
  await assert.rejects(client.query("SELECT " + prefix + ".add_job('pg_catalog.now'::regproc, INTERVAL '1 hour')"), /not supported under the current "apache" license/);
} finally { if (connection) await connection.close(); await client.end(); }
`,
      );
      await writeFile(
        join(work, "bundle-native.mjs"),
        `import { build } from "esbuild";
await build({ entryPoints: ["native.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "native-bundle.mjs", external: ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])} });`,
      );
      await run(["node", "bundle-native.mjs"]);
      await writeFile(join(work, "runtime-role.txt"), runtimeRole);
      try {
        await withExtensionDatabase(async (url) => {
          await run(["bun", "prepare-database.mjs"], url);
          await run(["node", "native-bundle.mjs"], url);
        });
      } finally {
        await run(["bun", "cleanup-role.mjs"]);
      }
      assert.equal(sha256(await readFile(archive)), digest);
      assert.equal(await consumerLockfileSha256(root), expectedLock);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  },
  360000,
);
