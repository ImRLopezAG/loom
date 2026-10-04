import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as v from "valibot";
import { extensionProofTest } from "../fixtures/extension-proof";
import { pgRepackConsumerProofCase, pgRepackGenerationProofCase } from "../fixtures/pg_repack-proof-cases";
import { writePgRepackProjectFiles } from "../fixtures/pg_repack-generated-project";
import { withPgRepackDatabase } from "../fixtures/pg_repack-lifecycle";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  readTarEntries,
  sha256,
} from "../fixtures/proof-artifact";

async function withPackedConsumer(work: (root: string, archive: string, bytes: Buffer) => Promise<void>) {
  const archive = process.env.LOOM_PG_REPACK_TARBALL;
  assert(archive, "Parent must supply LOOM_PG_REPACK_TARBALL from its fresh canonical build/pack");
  const root = await mkdtemp(join(tmpdir(), "loom-packed-pg-repack-"));
  const bytes = await readFile(archive);
  try {
    await work(root, archive, bytes);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

extensionProofTest(
  pgRepackGenerationProofCase,
  async () => {
    await withPackedConsumer(async (root, archive, bytes) => {
      const digest = sha256(bytes);
      const entries = readTarEntries(bytes);
      for (const file of [
        "package/dist/core/extensions/adapters/pg_repack.js",
        "package/dist/core/extensions/adapters/pg_repack.d.ts",
        "package/dist/tooling/extensions/operations/pg_repack.js",
        "package/dist/tooling/extensions/operations/pg_repack.d.ts",
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
      for (const key of ["./extensions/pg-repack", "./tooling/extensions/pg-repack"])
        assert(manifest.exports[key], `Missing packed export: ${key}`);
      await writeFile(join(root, "kello.tgz"), bytes, { flag: "wx" });
      const retained = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
      if (retained) {
        await copyFile(join(root, "kello.tgz"), retained, constants.COPYFILE_EXCL);
        assert.equal(sha256(await readFile(retained)), digest);
      }
      async function run(command: string[]) {
        const child = Bun.spawn(command, { cwd: root, stdout: "pipe", stderr: "pipe", timeout: 120000, env: process.env });
        const [stdout, stderr, code] = await Promise.all([
          new Response(child.stdout).text(),
          new Response(child.stderr).text(),
          child.exited,
        ]);
        assert.equal(code, 0, stdout + stderr);
      }
      await run([
        "node",
        "-e",
        "if(process.versions.node.split('.')[0]!=='24') throw new Error('pg_repack isolated consumer requires Node 24');",
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
      await writeFile(
        join(root, "prepare.mjs"),
        `import { initializeProject } from "kello/tooling";
for (const name of ["project", "absent", "empty", "future"]) await initializeProject(name, "pgrepack" + name);`,
      );
      await run(["node", "prepare.mjs"]);
      await writePgRepackProjectFiles(join(root, "project"), "extensions");
      await writeFile(
        join(root, "empty/kello.config.ts"),
        'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: {} } });',
      );
      await writeFile(
        join(root, "future/kello.config.ts"),
        'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { pg_repack: { version: "future" } } } });',
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
assert.match(emitted, /createPgRepack_1_5_2/);
assert.match(emitted, /kello\\\\/extensions\\\\/pg-repack/);
assert.doesNotMatch(emitted, /tooling\\\\/extensions|kello\\.config|\\.\\.\\/schema/);`,
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
for (const name of ["kello/extensions/pg-repack", "kello/tooling/extensions/pg-repack"])
  assert((await realpath(fileURLToPath(import.meta.resolve(name)))).startsWith(packageRoot + "/dist/"));
const selections = { selected: "project/kello/components/planner/_generated/extensions.ts", absent: "absent/kello/_generated/extensions.ts", empty: "empty/kello/_generated/extensions.ts", future: "future/kello/_generated/extensions.ts" };
for (const [name, entry] of Object.entries(selections)) {
  const result = await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", target: "node24", write: false, metafile: true, external: ${JSON.stringify("PLACEHOLDER")} });
  const inputs = Object.keys(result.metafile.inputs);
  assert(!inputs.some(path => path.includes("/tooling/")));
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !/pg_repack(?:-codecs)?\\.js$/.test(path)));
  assert.equal(inputs.some(path => path.endsWith("/adapters/pg_repack.js")), name === "selected");
  const text = result.outputFiles[0].text;
  assert(!/\\bBun\\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (name === "selected") {
    assert.deepEqual(Object.keys(extensions), ["pg_repack"]);
    assert.equal(extensions.pg_repack.schema, "extensions");
    assert.equal(extensions.pg_repack.version, "1.5.2");
    assert.equal(Object.keys(extensions.pg_repack.sql.functions).length, 17);
    assert.equal(typeof extensions.pg_repack.createTable, "object");
  } else if (name === "future") {
    assert.equal(extensions.pg_repack.apiSupport.status, "unverified");
    assert.equal(extensions.pg_repack.sql, undefined);
  } else assert.equal(extensions, undefined);
}`,
      );
      const packed = await readFile(join(root, "bundle.mjs"), "utf8");
      await writeFile(
        join(root, "bundle.mjs"),
        packed.replace(
          JSON.stringify("PLACEHOLDER"),
          JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"]),
        ),
      );
      await run(["node", "bundle.mjs"]);
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), digest);
    });
  },
  360000,
);

extensionProofTest(
  pgRepackConsumerProofCase,
  async () => {
    await withPackedConsumer(async (root, _archive, bytes) => {
      const manifest = v.parse(
        v.object({
          dependencies: v.record(v.string(), v.string()),
          devDependencies: v.record(v.string(), v.string()),
        }),
        JSON.parse(readTarEntries(bytes).get("package/package.json")!.toString("utf8")),
      );
      await writeFile(join(root, "kello.tgz"), bytes, { flag: "wx" });
      async function run(command: string[], databaseUrl?: string, binary?: string) {
        const environment = { ...process.env };
        if (databaseUrl) environment.LOOM_PACKED_PG_REPACK_DATABASE_URL = databaseUrl;
        if (binary) environment.LOOM_PACKED_PG_REPACK_BINARY = binary;
        const child = Bun.spawn(command, {
          cwd: root,
          stdout: "pipe",
          stderr: "pipe",
          timeout: 180000,
          env: environment,
        });
        const [stdout, stderr, code] = await Promise.all([
          new Response(child.stdout).text(),
          new Response(child.stderr).text(),
          child.exited,
        ]);
        let output = stdout + stderr;
        if (databaseUrl) output = output.replaceAll(databaseUrl, "[redacted]");
        assert.equal(code, 0, output);
      }
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
      await writeFile(
        join(root, "prepare.mjs"),
        `import { initializeProject } from "kello/tooling";
await initializeProject("project", "pgrepackproject");`,
      );
      await run(["node", "prepare.mjs"]);
      await writePgRepackProjectFiles(join(root, "project"), "extensions");
      await writeFile(
        join(root, "generate.mjs"),
        `import { generateProject, loadProject } from "kello/tooling";
await loadProject("project");
await generateProject("project");`,
      );
      await run(["node", "generate.mjs"]);
      await writeFile(
        join(root, "native.mjs"),
        String.raw`
import assert from "node:assert/strict";
import pg from "pg";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { defineSchema, createProjectServices, createProjectProcedures, Invocation } from "kello/server";
import { defineRelations } from "drizzle-orm";
import { withPgRepack } from "kello/tooling/extensions/pg-repack";
import { extensions } from "./project/kello/components/planner/_generated/extensions.ts";
const url = process.env.LOOM_PACKED_PG_REPACK_DATABASE_URL;
const binary = process.env.LOOM_PACKED_PG_REPACK_BINARY;
assert(url);
assert(binary);
const api = extensions.pg_repack;
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA IF NOT EXISTS extensions; CREATE EXTENSION pg_repack WITH SCHEMA extensions VERSION '1.5.2'");
  assert.equal((await client.query("SELECT repack.version() AS value")).rows[0].value, "pg_repack 1.5.2");
  const owned = "loom_repack_" + crypto.randomUUID().replaceAll("-", "");
  await client.query("CREATE SCHEMA " + owned);
  await client.query("CREATE TABLE " + owned + ".items(id integer PRIMARY KEY, label text NOT NULL); INSERT INTO " + owned + ".items SELECT g, 'row'||g FROM generate_series(1,8) g");
  const schema = defineSchema(() => ({ snapshots: { keys: api.primaryKeyField().notNull() } }), { namespace: "packed_repack" });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, defineRelations(schema.tables), extensions);
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    assert.equal(context.extensions.pg_repack, api);
    return api.version;
  });
  const invocation = { requestId: "packed-pg-repack", identity: null, signal: new AbortController().signal };
  assert.equal(await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } }), "1.5.2");
  const result = await withPgRepack(url, api, async session => session.repack({ relation: { schema: owned, name: "items" }, binary }));
  assert.equal(result.completion, "committed");
  assert.equal(result.value.identity, "pg_repack 1.5.2");
  assert.equal((await client.query("SELECT count(*)::text AS value FROM " + owned + ".items")).rows[0].value, "8");
} finally { await client.end(); }
`,
      );
      await writeFile(
        join(root, "bundle-native.mjs"),
        `import { build } from "esbuild";
await build({ entryPoints: ["native.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "native-bundle.mjs", external: ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])} });`,
      );
      await run(["node", "bundle-native.mjs"]);
      await withPgRepackDatabase((fixture) => run(["node", "native-bundle.mjs"], fixture.url, fixture.binary));
    });
  },
  360000,
);
