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
import { ltreeConsumerProofCase } from "../fixtures/ltree-proof-cases";

const descriptor = {
  name: "ltree",
  version: "1.3",
  schema: 'custom"ltree',
  apiSupport: {
    status: "verified",
    digest: "f0d5b39c468e80a8748a7a35ed30af0e530da547c2c15ebcaee307e34090c82e",
  },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  ltreeConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-ltree-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_LTREE_DATABASE_URL = databaseUrl;
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
        selected: { ltree: { version: "1.3", schema: descriptor.schema } },
        future: { ltree: { version: "future", schema: descriptor.schema } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createLtree_1_3, ltree } from "kello/extensions/ltree";
const api = createLtree_1_3(${JSON.stringify(descriptor)});
assert.equal(Object.keys(api.sql.functions).length, 44);
assert.equal(Object.keys(api.sql.operators).length, 21);
assert.equal(ltree("Top.Science"), "Top.Science");
assert.deepEqual(api.indexes.arrayGist({ siglen: 4 }).input, { schema: ${JSON.stringify(descriptor.schema)}, type: "ltree", dimensions: 1 });
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }]) assert.throws(() => createLtree_1_3({ ...api, apiSupport: support }), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import type { SQL } from "drizzle-orm";
import type { Ltree } from "kello/extensions/ltree";
import { extensions as custom } from "./selected";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
const api = custom.ltree;
const paths = { dimensions: [{ lowerBound: 1, length: 1 }], values: ["Top.Science"] };
const placement: 'custom"ltree' = api.schema;
const version: "1.3" = api.version;
const depth: SQL<number | null> = api.nlevel("Top.Science");
const ancestor: SQL<boolean | null> = api.isAncestor("Top", "Top.Science");
const common: SQL<Ltree | null> = api.lca("a.b", "a.c", "a.d");
const many: SQL<Ltree | null> = api.lcaArray(paths);
const first: SQL<Ltree | null> = api.firstAncestor(paths, "Top.Science.Astronomy");
const reverse: SQL<boolean | null> = api.sql.operators["~"]["lquery,ltree"]("*.Science", "Top.Science");
const hashed: SQL<bigint | null> = api.hashExtended("a", 1n);
const missing: undefined = absent;
const noSelection: undefined = empty;
// @ts-expect-error SQL NULL remains part of strict routine results.
const required: SQL<number> = depth;
// @ts-expect-error lca has captured routines for 2 to 8 paths only.
api.lca("a");
// @ts-expect-error subpath has 2 and 3 argument overloads only.
api.subpath("a");
// @ts-expect-error Array operands are PostgreSqlArray values.
api.anyAncestor(["a"], "a");
// @ts-expect-error hash_ltree_extended seeds are int8 bigint.
api.hashExtended("a", 1);
// @ts-expect-error Unselected families remain absent.
void custom.unaccent;
// @ts-expect-error Future versions expose descriptors only.
void future.ltree.nlevel;
void [placement, version, depth, ancestor, common, many, first, reverse, hashed, missing, noSelection, required];
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
const entry = await realpath(fileURLToPath(import.meta.resolve("kello/extensions/ltree")));
assert(entry.startsWith(root + "/dist/"));
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
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/ltree.js")));
  const selected = name === "runtime";
  assert.equal(inputs.some(path => path.endsWith("/adapters/ltree.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (selected) { assert.deepEqual(Object.keys(extensions), ["ltree"]); assert.equal(Object.keys(extensions.ltree.sql.functions).length, 44); }
  else if (name === "future") { assert.equal(extensions.ltree.apiSupport.status, "unverified"); assert.equal(extensions.ltree.nlevel, undefined); }
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
import { connectDatabase, createProjectProcedures, createProjectServices, defineSchema, Invocation, serializeRpcValue, deserializeRpcValue } from "kello/server";
import { extensions } from "./selected.ts";
const url = process.env.LOOM_PACKED_LTREE_DATABASE_URL;
assert(url);
const api = extensions.ltree;
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const client = new pg.Client({ connectionString: url });
await client.connect();
const schema = defineSchema(s => ({ writes: { value: s.text().notNull() } }), { namespace: "packed_app" });
const relations = defineRelations(schema.tables);
const fixture = sql.raw("(values(1)) fixture(id)");
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA " + quote(api.schema) + '; CREATE EXTENSION ltree WITH SCHEMA ' + quote(api.schema) + " VERSION '1.3'; CREATE SCHEMA packed_app; CREATE TABLE packed_app.writes(\"_id\" uuid PRIMARY KEY DEFAULT uuidv7(), \"_createdAt\" bigint NOT NULL DEFAULT 1, value text NOT NULL)");
  connection = await connectDatabase({ schema, relations, connectionString: url });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, relations, extensions);
  const paths = { dimensions: [{ lowerBound: 1, length: 2 }], values: ["Top.Science", "Top.Arts"] };
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    const api = binding.ltree;
    return connection.transaction(db => db.select({
      depth: api.nlevel("Top.Science.Astronomy"), ancestor: api.isAncestor("Top", "Top.Science"), descendant: api.isDescendant("Top", "Top.Science"),
      common: api.lca("Top.Science.Astronomy", "Top.Science.Physics"), many: api.lcaArray(paths), matched: api.matches("Top.science", "*.Science@.*"),
      searched: api.search("Top.Science.Astronomy", "Astro*"), anyMatch: api.matchesAny("Top.Arts", { dimensions: [{ lowerBound: 1, length: 1 }], values: ["*.Arts"] }),
      first: api.firstAncestor(paths, "Top.Science.Astronomy"), none: api.firstAncestor(paths, "Other"), joined: api.append("Top", "Leaf"),
      slice: api.subpath("a.b.c.d", 1, 2), found: api.index("a.b.c.b.c", "b.c", 2), compare: api.compare("a", "b"), hash: api.hash(""), wide: api.hashExtended("a.b", 0n),
      nullDepth: api.nlevel(null), nullCommon: api.lca(null, "a"), nullArray: api.anyDescendant(null, "a"),
    }).from(fixture));
  });
  const invocation = { requestId: "packed-ltree", identity: null, signal: new AbortController().signal };
  const rows = await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } });
  assert.deepEqual(deserializeRpcValue(serializeRpcValue(rows)), rows);
  assert.deepEqual(rows, [{
    depth: 3, ancestor: true, descendant: false, common: "Top.Science", many: "Top", matched: true, searched: true, anyMatch: true,
    first: "Top.Science", none: null, joined: "Top.Leaf", slice: "b.c", found: 3, compare: -1, hash: 1, wide: -961955203756554032n,
    nullDepth: null, nullCommon: null, nullArray: null,
  }]);
  const code = error => error instanceof Error && error.cause instanceof Error ? error.cause.code : undefined;
  await assert.rejects(connection.db.select({ invalid: api.nlevel("a..b") }).from(fixture), error => code(error) === "42601");
  await assert.rejects(connection.db.select({ invalid: api.anyDescendant({ dimensions: [{ lowerBound: 1, length: 1 }], values: [null] }, "a") }).from(fixture), error => code(error) === "22004");
  let decoderReached = false;
  await assert.rejects(connection.transaction(async db => {
    await db.insert(schema.tables.writes).values({ value: "must roll back" });
    await db.select({ invalid: api.nlevel("a.b").mapWith(() => { decoderReached = true; throw new Error("decode failure") }) }).from(fixture);
  }),/decode failure/);
  assert.equal(decoderReached, true, "Insert must succeed before exercising decoder rollback");
  assert.deepEqual((await client.query("SELECT value FROM packed_app.writes")).rows,[]);
  assert.equal((await connection.db.select({ ok: api.nlevel("a.b") }).from(fixture))[0].ok, 2);
} finally { try { await connection?.close(); } finally { await client.end(); } }
console.log("packed native ltree RPC/Effect, array wire, NULL, SQLSTATE and rollback contracts passed");
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
assert(inputs.some(path => path.endsWith("/adapters/ltree.js")));
assert(!inputs.some(path => path.includes("/tooling/")));
assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/ltree.js")));
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
