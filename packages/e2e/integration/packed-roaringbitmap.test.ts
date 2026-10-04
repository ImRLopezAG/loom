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
import { roaringbitmapConsumerProofCase } from "../fixtures/roaringbitmap-proof-cases";
import {
  roaringbitmapPackedContract,
  roaringbitmapPackedFunctions,
  roaringbitmapPackedPlacement,
  roaringbitmapPackedSchema,
} from "../fixtures/roaringbitmap-generated-project";

const descriptor = {
  name: "roaringbitmap",
  version: "1.2",
  schema: 'custom"bitmap',
  apiSupport: {
    status: "verified",
    digest: "967ad98be988b37be7f198057e9f02bcbe325a0eab5364722ba4c6763cbc406a",
  },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  roaringbitmapConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-roaringbitmap-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_ROARINGBITMAP_DATABASE_URL = databaseUrl;
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
      return stdout;
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
      await writeFile(
        join(root, "generate.mjs"),
        `import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
const project = join(process.cwd(), "project");
await initializeProject(project, "packedroaringbitmap");
await writeFile(join(project, "kello.config.ts"), 'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { namespace: "packed_app", extensions: { roaringbitmap: { version: "1.2", schema: ${JSON.stringify(roaringbitmapPackedPlacement)} } } } });');
await writeFile(join(project, "kello/schema.ts"), ${JSON.stringify(roaringbitmapPackedSchema)});
await writeFile(join(project, "kello/contracts/tasks.ts"), ${JSON.stringify(roaringbitmapPackedContract)});
await writeFile(join(project, "kello/functions/tasks.ts"), ${JSON.stringify(roaringbitmapPackedFunctions)});
await assert.rejects(readFile(join(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
await loadProject(project);
await assert.rejects(readFile(join(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
const generated = await generateProject(project);
assert.equal((await generateProject(project)).version, generated.version);
await writeFile("generation.json", JSON.stringify({ version: generated.version }));
const { extensions } = await import("./project/kello/_generated/extensions.ts");
assert.deepEqual(Object.keys(extensions), ["roaringbitmap"]);
assert.equal(extensions.roaringbitmap.version, "1.2");
assert.equal(extensions.roaringbitmap.schema, ${JSON.stringify(roaringbitmapPackedPlacement)});
assert.equal(extensions.roaringbitmap.apiSupport.digest, ${JSON.stringify(descriptor.apiSupport.digest)});
assert.equal(Object.keys(extensions.roaringbitmap.sql.overloads).length, 132);
`,
      );
      await run(["bun", "generate.mjs"]);
      await run([join(root, "node_modules/.bin/tsc"), "-p", "project/tsconfig.json"]);
      for (const [file, selection] of Object.entries({
        selected: { roaringbitmap: { version: "1.2", schema: descriptor.schema } },
        future: { roaringbitmap: { version: "1.3", schema: descriptor.schema } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createRoaringbitmap_1_2, decodeRoaringBitmapBytes, decodeRoaringBitmap64Bytes } from "kello/extensions/roaringbitmap";
const api = createRoaringbitmap_1_2(${JSON.stringify(descriptor)});
assert.equal(Object.keys(api.sql.overloads).length, 132);
assert.equal(Object.keys(api.sql.functions).length, 88);
assert.equal(Object.keys(api.sql.casts).length, 6);
assert.equal(Object.keys(api.sql.operators.roaringbitmap).length, 16);
assert.equal(Object.keys(api.sql.operators.roaringbitmap64).length, 16);
assert.deepEqual(decodeRoaringBitmapBytes("\\\\x3a300000010000000000020010000000010002000300"), [1, 2, 3]);
assert.deepEqual(decodeRoaringBitmap64Bytes("\\\\x0000000000000000"), []);
assert.deepEqual(api.codec.decode("{1,-1}"), [1, -1]);
assert.throws(() => api.codec.decode("{-1,1}"), /native unsigned set order/);
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }]) assert.throws(() => createRoaringbitmap_1_2({ ...api, apiSupport: support }), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import type { SQL } from "drizzle-orm";
import type { PostgreSqlArray, RoaringBitmap, RoaringBitmap64 } from "kello/extensions/roaringbitmap";
import { extensions as custom } from "./selected";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
const api = custom.roaringbitmap;
const placement: 'custom"bitmap' = api.schema;
const version: "1.2" = api.version;
const f = api.sql.functions;
const union: SQL<RoaringBitmap | null> = f.rb_or([1], [-1]);
const wide: SQL<RoaringBitmap64 | null> = f.rb64_add.elementBitmap(-1n, [1n]);
const count: SQL<bigint | null> = f.rb_cardinality([1]);
const directCount: SQL<bigint | null> = api.cardinality([1]);
const directCount64: SQL<bigint | null> = api.bitmap64.cardinality([1n]);
const index: SQL<number | null> = f.rb_min([1]);
const index64: SQL<bigint | null> = f.rb64_max([1n]);
const members: SQL<PostgreSqlArray<number> | null> = f.rb_to_array([1]);
const contains: SQL<boolean | null> = api.sql.operators.roaringbitmap64.containsElement([1n], 1n);
const narrowed: SQL<RoaringBitmap | null> = api.sql.casts.roaringbitmap64_to_roaringbitmap([1n]);
const bytes: SQL<{ hex: string } | null> = api.sql.casts.roaringbitmap_to_bytea([1]);
const missing: undefined = absent;
const noSelection: undefined = empty;
// @ts-expect-error SQL NULL remains part of strict routine results.
const required: SQL<RoaringBitmap> = union;
// @ts-expect-error int4 bitmaps take number members.
f.rb_add.bitmapElement([1n], 1);
// @ts-expect-error int8 bitmaps take bigint members.
f.rb64_contains.element([1n], 1);
// @ts-expect-error Bitmap aggregates have no DISTINCT.
void f.rb_or_agg.distinct;
// @ts-expect-error Unselected families remain absent.
void custom.unaccent;
// @ts-expect-error Future versions expose descriptors only.
void future.roaringbitmap.sql;
void [placement, version, union, wide, count, directCount, directCount64, index, index64, members, contains, narrowed, bytes, missing, noSelection, required];
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
          files: ["probe.ts"],
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
const entry = await realpath(fileURLToPath(import.meta.resolve("kello/extensions/roaringbitmap")));
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
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/roaringbitmap.js")));
  const selected = name === "runtime";
  assert.equal(inputs.some(path => path.endsWith("/adapters/roaringbitmap.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (selected) { assert.deepEqual(Object.keys(extensions), ["roaringbitmap"]); assert.equal(Object.keys(extensions.roaringbitmap.sql.overloads).length, 132); }
  else if (name === "future") { assert.equal(extensions.roaringbitmap.apiSupport.status, "unverified"); assert.equal(extensions.roaringbitmap.sql, undefined); }
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
import { sql } from "drizzle-orm";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { connectDatabase, createRpcRuntime, defineRpcAuth, Invocation, serializeRpcValue, deserializeRpcValue } from "kello/server";
import { extensions } from "./project-bindings.mjs";
const url = process.env.LOOM_PACKED_ROARINGBITMAP_DATABASE_URL;
assert(url);
const { version } = JSON.parse(await readFile("generation.json", "utf8"));
const { runtimeOptions } = await import(pathToFileURL(process.cwd() + "/project/.loom/generations/" + version + "/runtime.js").href);
const options = runtimeOptions();
const api = extensions.roaringbitmap;
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const ns = quote(api.schema);
const client = new pg.Client({ connectionString: url });
await client.connect();
const { schema, relations } = options;
const preparation = process.argv[2] === "prepare";
const principal = preparation ? { role: "pack_roaring_" + crypto.randomUUID().replaceAll("-", ""), connectionString: undefined } : JSON.parse(await readFile("runtime-principal.private.json", "utf8"));
const runtimeRole = principal.role;
const roleOutput = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
if (roleOutput && preparation) {
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  assert(runId, "Role ownership events need the proof run ID");
  const { appendFileSync } = await import("node:fs");
  const { createHash } = await import("node:crypto");
  appendFileSync(roleOutput, JSON.stringify({ runId, name: runtimeRole, sha256: createHash("sha256").update(runtimeRole).digest("hex") }) + "\n", { mode: 0o600 });
}
let connection, runtime;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  if (preparation) await client.query("CREATE SCHEMA " + ns + "; CREATE EXTENSION roaringbitmap WITH SCHEMA " + ns + " VERSION '1.2'; CREATE SCHEMA packed_app; CREATE TABLE packed_app.writes(\"_id\" uuid PRIMARY KEY DEFAULT uuidv7(), \"_createdAt\" bigint NOT NULL DEFAULT 1, value text NOT NULL); CREATE TABLE packed_app.segments(\"_id\" uuid PRIMARY KEY DEFAULT uuidv7(), \"_createdAt\" bigint NOT NULL DEFAULT 1, bits " + ns + ".roaringbitmap NOT NULL, bits64 " + ns + ".roaringbitmap64, history " + ns + ".roaringbitmap[], history64 " + ns + ".roaringbitmap64[])");
  connection = await connectDatabase({ schema, relations, connectionString: url });
  if (preparation) {
    const { bootstrapDatabase } = await import("kello/tooling");
    await bootstrapDatabase({ connectionString: url, metadataNamespace: options.metadataNamespace, runtimeRole });
    const { randomBytes } = await import("node:crypto");
    const { writeFile } = await import("node:fs/promises");
    const password = randomBytes(32).toString("hex");
    await client.query("ALTER ROLE " + pg.escapeIdentifier(runtimeRole) + " LOGIN PASSWORD '" + password + "'; GRANT USAGE ON SCHEMA " + ns + ", packed_app TO " + pg.escapeIdentifier(runtimeRole) + "; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA packed_app TO " + pg.escapeIdentifier(runtimeRole));
    const address = new URL(url); address.username = runtimeRole; address.password = password;
    await writeFile("runtime-principal.private.json", JSON.stringify({ role: runtimeRole, connectionString: address.href }), { mode: 0o600, flag: "wx" });
  } else {
  const restricted = new pg.Client({ connectionString: principal.connectionString });
  await restricted.connect();
  try { assert.deepEqual((await restricted.query("SELECT current_user AS name, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls FROM pg_roles WHERE rolname=current_user")).rows[0], { name: runtimeRole, rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: false, rolbypassrls: false }); } finally { await restricted.end(); }
  runtime = await createRpcRuntime({ ...options, connectionString: principal.connectionString, deployment: "packed-roaringbitmap", auth: defineRpcAuth({ authorize: async () => {} }), assertActive: async signal => signal.throwIfAborted() });
  const route = getRouter(runtime.router, ["tasks", "list"]);
  assert(route instanceof Procedure);
  const invocation = { requestId: "packed-roaringbitmap", identity: null, signal: new AbortController().signal };
  const result = await call(route, undefined, { context: { ...invocation, operation: "mutation", "effect/context": Context.make(Invocation, invocation) }, path: ["tasks", "list"] });
  assert.deepEqual(deserializeRpcValue(serializeRpcValue(result)), result);
  assert.deepEqual(result.rows, [
    { bits: [], bits64: null, history: null, history64: { dimensions: [{ lowerBound: 1, length: 1 }], values: [[4294967296n]] }, count: 0n, max: null, widened: [], union: [7], contains: false, selected: [3, -1], jaccard: { nonfinite: "NaN" }, nullMax: null },
    { bits: [1, 3, -1], bits64: [0n, 9223372036854775807n, -1n], history: { dimensions: [{ lowerBound: 0, length: 2 }], values: [[1, 2], null] }, history64: null, count: 3n, max: -1, widened: [1n, 3n, -1n], union: [1, 3, 7, -1], contains: true, selected: [3, -1], jaccard: { nonfinite: "NaN" }, nullMax: null },
  ]);
  assert.deepEqual(result.aggregate, { or: [1, 3, -1], count: 3n, built: [1n, -1n] });
  // The SQL-language members call unqualified helpers: ordinary queries outside the extension schema cannot reach them.
  for (const member of [api.sql.functions.rb_shiftleft([5], 1n), api.sql.operators.roaringbitmap64.addReverse(1n, [2n])])
    await assert.rejects(connection.db.select({ value: member }).from(sql.raw("(values(1)) fixture(id)")), error => error instanceof Error && error.cause?.code === "42883");
  let decoderReached = false;
  await assert.rejects(connection.transaction(async db => {
    await db.insert(schema.tables.writes).values({ value: "must roll back" });
    await db.select({ invalid: api.sql.functions.rb_or([1], [2]).mapWith(() => { decoderReached = true; throw new Error("decode failure") }) }).from(sql.raw("(values(1)) fixture(id)"));
  }), /decode failure/);
  assert.equal(decoderReached, true, "Insert must succeed before exercising decoder rollback");
  assert.deepEqual((await client.query("SELECT value FROM packed_app.writes")).rows, []);
  await assert.rejects(connection.db.select({ invalid: api.sql.functions.rb64_to_roaringbitmap([4294967296n]) }).from(sql.raw("(values(1)) fixture(id)")), error => error instanceof Error && /out of range for type integer/.test(error.cause?.message));
  assert.throws(() => api.sql.functions.rb_add.bitmapElement([2147483648], 1));
  }
} finally {
  try { await runtime?.stop(); } finally {
    try { await connection?.close(); } finally {
      try {
        const exists = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [runtimeRole]);
        if (!preparation && exists.rows.length) await client.query("GRANT " + pg.escapeIdentifier(runtimeRole) + " TO CURRENT_USER; DROP OWNED BY " + pg.escapeIdentifier(runtimeRole) + "; DROP ROLE " + pg.escapeIdentifier(runtimeRole));
      } finally { await client.end(); }
    }
  }
}
console.log("packed native roaringbitmap RPC/Effect, fields, aggregates, ordinary search_path rejection, NULL and rollback contracts passed");
`,
      );
      await writeFile(
        join(root, "build-bindings.mjs"),
        `import { build } from "esbuild"; await build({ entryPoints: ["project/kello/_generated/extensions.ts"], bundle: true, packages: "external", platform: "node", format: "esm", target: "node24", outfile: "project-bindings.mjs" });`,
      );
      await run(["node", "build-bindings.mjs"]);
      await writeFile(
        join(root, "compile-native.mjs"),
        `import assert from "node:assert/strict";
import { realpath } from "node:fs/promises";
import { build } from "esbuild";
const installed = await realpath("node_modules/kello");
const result = await build({ entryPoints: ["project/kello/functions/tasks.ts"], bundle: true, platform: "node", format: "esm", target: "node24", write: false, metafile: true, external: ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])} });
const inputs = Object.keys(result.metafile.inputs);
for (const file of inputs) if (file.includes("node_modules/kello/")) assert((await realpath(file)).startsWith(installed + "/dist/"), file);
assert(inputs.some(path => path.endsWith("/adapters/roaringbitmap.js")));
assert(!inputs.some(path => path.includes("/tooling/")));
assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/roaringbitmap.js")));
assert(!/\\bBun\\b|from ["']bun(?:["':])/.test(result.outputFiles[0].text));
`,
      );
      await run(["node", "compile-native.mjs"]);
      await withExtensionDatabase(async (url) => {
        await run(["bun", "project-native.mjs", "prepare"], root, url);
        await run(["node", "project-native.mjs"], root, url);
      });
      // The owned operator session for the twelve search_path-dependent members, through its public tooling export.
      await writeFile(
        join(root, "operator-probe.ts"),
        `import type { RoaringBitmap, RoaringBitmap64 } from "kello/extensions/roaringbitmap";
import { withRoaringbitmapSession } from "kello/tooling/extensions/roaringbitmap";
import { extensions } from "./selected";
async function operator(url: string) {
  const result = await withRoaringbitmapSession(url, extensions.roaringbitmap, async (session) => {
    const added: RoaringBitmap | null = await session.functions.rb_add.elementBitmap(1, [2]);
    const shifted: RoaringBitmap64 | null = await session.operators.roaringbitmap64.shiftLeft([5n], 1n);
    const contained: boolean | null = await session.functions.rb64_containedby.element(null, [1n]);
    // @ts-expect-error 32-bit elements are int4 numbers.
    await session.functions.rb_add.elementBitmap(1n, [2]);
    return [added, shifted, contained, await session.searchPath()] as const;
  });
  const scope: "transaction" = result.searchPath.scope;
  void scope;
}
void operator;
`,
      );
      await writeFile(
        join(root, "tsconfig.operator.json"),
        JSON.stringify({ extends: "./tsconfig.json", files: ["operator-probe.ts"] }),
      );
      await run([join(root, "node_modules/.bin/tsc"), "-p", "tsconfig.operator.json"]);
      await writeFile(
        join(root, "operator-native.mjs"),
        String.raw`import assert from "node:assert/strict";
import pg from "pg";
import { withRoaringbitmapSession } from "kello/tooling/extensions/roaringbitmap";
import { extensions } from "./runtime.mjs";
const url = process.env.LOOM_PACKED_ROARINGBITMAP_DATABASE_URL;
assert(url);
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("CREATE SCHEMA " + quote(extensions.roaringbitmap.schema) + "; CREATE EXTENSION roaringbitmap WITH SCHEMA " + quote(extensions.roaringbitmap.schema) + " VERSION '1.2'");
} finally { await client.end(); }
const result = await withRoaringbitmapSession(url, extensions.roaringbitmap, async session => [
  await session.searchPath(),
  await session.functions.rb_add.elementBitmap(-1, [2]), await session.functions.rb_containedby.element(2, [2, 3]), await session.functions.rb_shiftleft([5, 1], 2n),
  await session.functions.rb64_add.elementBitmap(-1n, [2n]), await session.functions.rb64_containedby.element(4n, [2n]), await session.functions.rb64_shiftleft([5n], 2n),
  await session.operators.roaringbitmap.addReverse(4, [1]), await session.operators.roaringbitmap.elementContainedBy(1, [1]), await session.operators.roaringbitmap.shiftLeft([10], 3n),
  await session.operators.roaringbitmap64.addReverse(4294967296n, [1n]), await session.operators.roaringbitmap64.elementContainedBy(1n, [2n]), await session.operators.roaringbitmap64.shiftLeft([10n], 3n),
  await session.functions.rb_shiftleft(null, 1n),
]);
const path = quote(extensions.roaringbitmap.schema) + ", pg_catalog";
assert.deepEqual(result.value, [path, [2, -1], true, [3], [2n, -1n], false, [3n], [1, 4], true, [7], [1n, 4294967296n], false, [7n], null]);
assert.deepEqual(result.searchPath, { scope: "transaction", before: result.searchPath.before, during: path, after: result.searchPath.before });
assert.notEqual(result.searchPath.before, path);
console.log("packed roaringbitmap operator session search_path members passed");
`,
      );
      await withExtensionDatabase(async (url) => {
        await run(["node", "operator-native.mjs"], root, url);
      });
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), packedSha256);
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      assert.equal(await consumerLockfileSha256(root), lockfileSha256);
      const nodeVersion = (await run(["node", "--version"])).trim();
      const output = process.env.LOOM_EXTENSION_PROOF_PACKED_OUTPUT;
      assert(output);
      await writeFile(
        join(output, "consumer.json"),
        JSON.stringify({
          runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
          nodeVersion,
          installation: "isolated",
          frozenReinstallPassed: true,
          declarationsPassed: true,
          runtimePassed: true,
          selectedBundleChecksPassed: true,
          tarballSha256: packedSha256,
        }),
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
