import { recordPackedConsumerObservation } from "../fixtures/packed-consumer-observation";
import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest } from "../fixtures/extension-proof";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
} from "../fixtures/proof-artifact";
import { hllConsumerProofCase } from "../fixtures/hll-proof-cases";

const descriptor = {
  name: "hll",
  version: "2.21",
  schema: "packed_hll",
  apiSupport: {
    status: "verified",
    digest: "44f6623b1b7a463ea7cb26fcd02b434cb33c36a4bd9edfe0397e2536f66f6b19",
  },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  hllConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-hll-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_HLL_DATABASE_URL = databaseUrl;
      const child = Bun.spawn(command, {
        cwd,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 120000,
        env,
      });
      const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      let output = `${stdout}\n${stderr}`;
      if (databaseUrl) {
        const address = new URL(databaseUrl);
        for (const value of [
          databaseUrl,
          address.username,
          address.password,
          address.hostname,
          address.pathname.slice(1),
        ]) {
          if (value)
            output = output.replaceAll(value, "[redacted]").replaceAll(decodeURIComponent(value), "[redacted]");
        }
        output = output.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
      }
      assert.equal(code, 0, `${command.join(" ")}\n${output}`);
    }
    try {
      await run(["bun", "pm", "pack", "--filename", join(root, "kello.tgz"), "--ignore-scripts"], source);
      const packedBytes = await readFile(join(root, "kello.tgz"));
      const packedSha256 = sha256(packedBytes);
      if (retainedArtifactPath !== undefined) {
        // COPYFILE_EXCL: an existing file at the host path is an error, never silently replaced.
        await copyFile(join(root, "kello.tgz"), retainedArtifactPath, constants.COPYFILE_EXCL);
        assert.equal(
          sha256(await readFile(retainedArtifactPath)),
          packedSha256,
          "Retained tarball bytes differ from the pack",
        );
      }
      // The consumer's scripts run under whichever `node` is on PATH; the isolated profile requires Node 24.
      await run([
        "node",
        "-e",
        "if (process.versions.node.split('.')[0] !== '24') throw new Error('Isolated consumer requires Node 24, not ' + process.version)",
      ]);
      // Relocated bundles resolve their external imports from the consumer root.
      // Declare the packed runtime dependencies there; the bundle metafile below
      // verifies that every external import has an explicit consumer dependency.
      const consumerDependencies = new Map<string, string>([
        ...Object.entries<string>(manifest.dependencies),
        ["kello", "file:./kello.tgz"],
        ["drizzle-orm", manifest.devDependencies["drizzle-orm"]],
      ]);
      await writeFile(
        join(root, "package.json"),
        JSON.stringify({
          private: true,
          type: "module",
          dependencies: Object.fromEntries(consumerDependencies),
          devDependencies: {
            typescript: manifest.devDependencies.typescript,
            "@types/node": manifest.devDependencies["@types/node"],
            "@types/pg": manifest.devDependencies["@types/pg"],
          },
        }),
      );
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
      // The first install is compared with the retained archive, then ONLY this disposable consumer's node_modules is
      // removed (the lockfile is kept byte-for-byte) so the frozen install is a genuine cold reinstall, and the result is
      // compared with the same archive again.
      assert.equal(
        sha256(await readFile(join(root, "kello.tgz"))),
        packedSha256,
        "The tarball changed during installation",
      );
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      const lockfileSha256 = await consumerLockfileSha256(root);
      await removeConsumerNodeModules(root);
      assert.equal(await consumerLockfileSha256(root), lockfileSha256, "Removing node_modules changed the lockfile");
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated", "--frozen-lockfile"]);
      assert.equal(await consumerLockfileSha256(root), lockfileSha256, "The frozen reinstall changed the lockfile");
      assert.equal(
        sha256(await readFile(join(root, "kello.tgz"))),
        packedSha256,
        "The tarball changed during reinstall",
      );
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      for (const [file, selection] of Object.entries({
        selected: { hll: { version: "2.21", schema: descriptor.schema } },
        future: { hll: { version: "future", schema: descriptor.schema } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createHll_2_21, hllSketch } from "kello/extensions/hll";
import { withHllSession } from "kello/tooling/extensions/hll";
const api = createHll_2_21(${JSON.stringify(descriptor)});
assert.equal(Object.keys(api.sql.overloads).length, 50);
assert.equal(api.codec.encode(hllSketch("118b7f")), "\\\\x118b7f");
assert.equal(api.sql.functions.hll_set_defaults, undefined);
assert.equal(api.sql.functions.hll_card_unpacked, undefined);
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }]) {
  assert.throws(() => createHll_2_21({ ...api, apiSupport: support }));
  await assert.rejects(withHllSession("postgres://unused/db", { ...api, apiSupport: support }, async () => 1), /exact verified 2.21 contract/);
}
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import type { SQL } from "drizzle-orm";
import { sql } from "drizzle-orm";
import * as v from "valibot";
import { hllSketch, type HllSketch, type NonfiniteNumber } from "kello/extensions/hll";
import { withHllSession, type HllDefaults } from "kello/tooling/extensions/hll";
import { extensions as selected } from "./selected";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
const api = selected.hll;
const placement: "packed_hll" = api.schema;
const version: "2.21" = api.version;
const estimate: SQL<number | NonfiniteNumber | null> = api.cardinality(hllSketch("118b7f"));
const aggregate: SQL<HllSketch | null> = api.addAggregate.hashval(api.hash.integer(sql<number>\`g\`));
const hashed: SQL<bigint | null> = api.hash.bigint(1n, 0);
const missing: undefined = absent;
const noSelection: undefined = empty;
const defaults: HllDefaults = { log2m: 11, regwidth: 5, expthresh: -1, sparseon: 1 };
const settled: Promise<{ readonly completion: "committed"; readonly value: readonly { value: number }[] }> =
  withHllSession("postgres://unused/db", api, async (session) => {
    // @ts-expect-error The owned operator backend is never exposed.
    void session.client;
    // @ts-expect-error Rows are parsed by an explicit schema.
    void session.query("select 1 value");
    await session.setDefaults(defaults);
    return session.query("select 1 value", v.strictObject({ value: v.number() }));
  });
// @ts-expect-error hll_hashval is an exact int8 bigint, not a lossy JS number.
api.add(hllSketch("118b7f"), 1);
// @ts-expect-error PostgreSQL rejects DISTINCT for hll aggregates.
api.unionAggregate.distinct(hllSketch("118b7f"));
// @ts-expect-error Process-local setters are operator tooling, never query helpers.
void api.sql.functions.hll_set_defaults;
// @ts-expect-error Unconstructible internal-argument routines are not exported.
void api.sql.functions.hll_card_unpacked;
// @ts-expect-error Unselected families remain absent.
void selected.hstore;
// @ts-expect-error Future versions expose descriptors only.
void future.hll.cardinality;
void [placement, version, estimate, aggregate, hashed, missing, noSelection, settled];
`,
      );
      await writeFile(
        join(root, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            target: "ES2023",
            module: "Preserve",
            moduleResolution: "Bundler",
            strict: true,
            noEmit: true,
            skipLibCheck: true,
            exactOptionalPropertyTypes: true,
            types: ["node"],
          },
          include: ["*.ts"],
        }),
      );
      await run(["node", "imports.mjs"]);
      await run([join(root, "node_modules/.bin/tsc"), "-p", "tsconfig.json"]);
      await writeFile(join(root, "runtime.ts"), `export { extensions } from "./selected";`);
      await writeFile(
        join(root, "verify.mjs"),
        String.raw`import assert from "node:assert/strict";
import { readFile, realpath, writeFile } from "node:fs/promises";
import { builtinModules } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
const root = await realpath("node_modules/kello");
for (const name of ["kello/extensions/hll", "kello/tooling/extensions/hll"]) {
  const entry = await realpath(fileURLToPath(import.meta.resolve(name)));
  assert(entry.startsWith(root + "/dist/"));
}
const manifest = JSON.parse(await readFile("package.json", "utf8"));
const dependencies = new Set([...Object.keys(manifest.dependencies), ...Object.keys(manifest.devDependencies)]);
async function bundle(name) {
  const result = await build({ entryPoints: [name + ".ts"], bundle: true, platform: "node", format: "esm", target: "node24", write: false, metafile: true, external: EXTERNALS });
  for (const output of Object.values(result.metafile.outputs)) for (const item of output.imports) {
    if (!item.external || item.path.startsWith("node:") || item.path.startsWith(".")) continue;
    const packageName = item.path.startsWith("@") ? item.path.split("/").slice(0, 2).join("/") : item.path.split("/")[0];
    assert(builtinModules.includes(packageName) || dependencies.has(packageName));
  }
  const inputs = Object.keys(result.metafile.inputs);
  assert(!inputs.some(path => path.includes("/tooling/")));
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/adapters/hll.js") && !path.endsWith("/adapters/hll-codecs.js")));
  const selected = name === "runtime";
  assert.equal(inputs.some(path => path.endsWith("/adapters/hll.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (selected) { assert.deepEqual(Object.keys(extensions), ["hll"]); assert.equal(Object.keys(extensions.hll.sql.overloads).length, 50); }
  else if (name === "future") { assert.equal(extensions.hll.apiSupport.status, "unverified"); assert.equal(extensions.hll.cardinality, undefined); }
  else assert.equal(extensions, undefined);
}
for (const name of ["runtime", "future", "absent", "empty"]) await bundle(name);
`.replace("EXTERNALS", JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])),
      );
      await run(["node", "verify.mjs"]);
      await writeFile(
        join(root, "project-native.mjs"),
        String.raw`import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { connectDatabase, createProjectProcedures, createProjectServices, defineSchema, Invocation } from "kello/server";
import { hllSketch } from "kello/extensions/hll";
import { withHllSession } from "kello/tooling/extensions/hll";
import * as v from "valibot";
import { extensions } from "./selected.ts";
const url = process.env.LOOM_PACKED_HLL_DATABASE_URL;
assert(url);
const api = extensions.hll;
const client = new pg.Client({ connectionString: url });
await client.connect();
const schema = defineSchema(s => ({ writes: { value: s.text().notNull() } }), { namespace: "packed_app" });
const relations = defineRelations(schema.tables);
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA packed_hll; CREATE EXTENSION hll WITH SCHEMA packed_hll VERSION '2.21'; CREATE SCHEMA packed_app; CREATE TABLE packed_app.writes(\"_id\" uuid PRIMARY KEY DEFAULT uuidv7(), \"_createdAt\" bigint NOT NULL DEFAULT 1, value text NOT NULL)");
  const oracle = (await client.query("select packed_hll.hll_add_agg(packed_hll.hll_hash_integer(g))::text sketch, packed_hll.hll_cardinality(packed_hll.hll_add_agg(packed_hll.hll_hash_integer(g))) estimate, packed_hll.hll_hash_bigint(1,0)::text hashed from generate_series(1,1000) g")).rows[0];
  connection = await connectDatabase({ schema, relations, connectionString: url });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, relations, extensions);
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    const api = binding.hll;
    return connection.transaction(db => db.select({
      sketch: api.addAggregate.hashval(api.hash.integer(sql.raw("g"))),
      estimate: api.cardinality(api.addAggregate.hashval(api.hash.integer(sql.raw("g")))),
      hashed: api.hash.bigint(1n, 0),
      empty: api.empty.defaults(),
      nullSketch: api.cardinality(null),
    }).from(sql.raw("generate_series(1,1000) g")));
  });
  const invocation = { requestId: "packed-hll", identity: null, signal: new AbortController().signal };
  const [row] = await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } });
  assert.equal("\\x" + row.sketch.hex, oracle.sketch);
  assert.equal(row.estimate, oracle.estimate);
  assert.equal(row.hashed, BigInt(oracle.hashed));
  assert.deepEqual(row.empty, hllSketch("118b7f"));
  assert.equal(row.nullSketch, null);
  let decoderReached = false;
  await assert.rejects(connection.transaction(async db => {
    await db.insert(schema.tables.writes).values({ value: "must roll back" });
    await db.select({ invalid: api.empty.defaults().mapWith(() => { decoderReached = true; throw new Error("decode failure") }) }).from(sql.raw("(values(1)) fixture(id)"));
  }),/decode failure/);
  assert.equal(decoderReached, true, "Insert must succeed before exercising decoder rollback");
  assert.deepEqual((await client.query("SELECT value FROM packed_app.writes")).rows,[]);
  const builtIn = (await client.query("select packed_hll.hll_empty()::text value")).rows[0].value;
  assert.equal(builtIn, "\\x118b7f");
  const result = await withHllSession(url, api, async (session) => {
    assert.equal("client" in session, false);
    assert.deepEqual(await session.setDefaults({ log2m: 10, regwidth: 4, expthresh: 0, sparseon: 0 }), { log2m: 11, regwidth: 5, expthresh: -1, sparseon: 1 });
    return session.query("select packed_hll.hll_empty()::text value", v.strictObject({ value: v.string() }));
  });
  assert.deepEqual(result, { completion: "committed", value: [{ value: "\\x116a00" }] });
  assert.equal((await client.query("select packed_hll.hll_empty()::text value")).rows[0].value, builtIn);
  const failure = await withHllSession(url, api, async (session) => {
    void session.query("select 1/0 value", v.strictObject({ value: v.number() })).catch(() => undefined);
    return 1;
  }).then(() => assert.fail("floated failure must fail the operation"), cause => cause);
  assert.equal(failure.name, "ExtensionOperationError");
  assert.equal(failure.completion, "rolled-back");
  assert.match(failure.cause.message, /division by zero/);
} finally { try { await connection?.close(); } finally { await client.end(); } }
console.log("packed native RPC/Effect, oracle, NULL, rollback and operator session contracts passed");
`,
      );
      // Bundle the complete application graph: adapters and the database share invocation-local SQL state.
      // A separately bundled adapter mixed with an unbundled server is a second Kello instance and rejects execution.
      await writeFile(
        join(root, "compile-native.mjs"),
        `import assert from "node:assert/strict";
import { build } from "esbuild";
const result = await build({ entryPoints: ["project-native.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "project-native-bundle.mjs", metafile: true, external: ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])} });
const inputs = Object.keys(result.metafile.inputs);
assert(inputs.some(path => path.endsWith("/adapters/hll.js")));
assert(inputs.some(path => path.endsWith("/tooling/extensions/hll.js")));
assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/adapters/hll.js") && !path.endsWith("/adapters/hll-codecs.js")));
`,
      );
      await run(["node", "compile-native.mjs"]);
      await withExtensionDatabase((url) => run(["node", "project-native-bundle.mjs"], root, url));
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), packedSha256);
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      await recordPackedConsumerObservation(root);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
