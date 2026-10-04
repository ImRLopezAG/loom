import { recordPackedConsumerObservation } from "../fixtures/packed-consumer-observation";
import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest } from "../fixtures/extension-proof";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
} from "../fixtures/proof-artifact";
import { intarrayConsumerProofCase } from "../fixtures/intarray-proof-cases";

const descriptor = {
  name: "intarray",
  version: "1.5",
  schema: "packed_intarray",
  apiSupport: {
    status: "verified",
    digest: "c71054bd4b390e4e0457bb83bbaeaaef426319c14d6f0563fecfb8758d3224f2",
  },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  intarrayConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-intarray-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_INTARRAY_DATABASE_URL = databaseUrl;
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
      await writeFile(
        join(root, "generate.mjs"),
        String.raw`import assert from "node:assert/strict";
import { writeFile, readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
for (const [name, selection] of Object.entries({ selected: { intarray: { version: "1.5", schema: "packed_intarray" } }, future: { intarray: { version: "future", schema: "packed_intarray" } }, absent: undefined, empty: {} })) {
  const directory = join(process.cwd(), "project-" + name);
  await initializeProject(directory, "packedintarray");
  await writeFile(join(directory, "kello.config.ts"), 'import { defineConfig } from "kello/tooling"; export default defineConfig(' + JSON.stringify(selection === undefined ? {} : { database: { extensions: selection } }) + ');');
  if (name === "selected") {
    await writeFile(join(directory, "kello/schema.ts"), 'import { defineSchema, defineTable } from "kello/server"; import { extensions } from "./_generated/extensions"; const api = extensions.intarray; if (api.version !== "1.5" || api.schema !== "packed_intarray") throw new Error("Wrong first-load selection"); export default defineSchema(s => ({ tasks: defineTable({ title: s.text().notNull(), tags: api.field().notNull().default([1]) }, { indexes: [{ fields: ["tags"], extension: api.indexes.gin() }, { fields: ["tags"], extension: api.indexes.gist({ numranges: 252 }) }, { fields: ["tags"], extension: api.indexes.gistBig({ siglen: 2024 }) }] }) }), { namespace: "app" });');
  }
  await assert.rejects(access(join(directory, "kello/_generated/extensions.ts")));
  await loadProject(directory);
  await assert.rejects(access(join(directory, "kello/_generated/extensions.ts")));
  const first = await generateProject(directory);
  const source = await readFile(join(directory, "kello/_generated/extensions.ts"), "utf8");
  assert(!/kello\/tooling|manifests\//.test(source));
  await writeFile(name + ".ts", source);
  await writeFile(join(directory, "generated-proof.ts"), 'export { extensions as disk } from "./kello/_generated/extensions"; export { extensions as server } from "./kello/_generated/server";');
  await build({ entryPoints: [join(directory, "generated-proof.ts")], bundle: true, platform: "node", format: "esm", target: "node24", outfile: join(directory, "generated-proof.mjs"), external: Object.keys(JSON.parse(await readFile("package.json", "utf8")).dependencies) });
  const { disk: extensions, server } = await import(pathToFileURL(join(directory, "generated-proof.mjs")).href);
  const disk = { extensions };
  assert.equal(server, disk.extensions);
  assert.equal((await generateProject(directory)).version, first.version);
  if (name === "selected") { assert.deepEqual(Object.keys(disk.extensions), ["intarray"]); assert.equal(Object.keys(disk.extensions.intarray.sql.overloads).length, 39); }
  else if (name === "future") { assert.equal(disk.extensions.intarray.apiSupport.status, "unverified"); assert.equal(disk.extensions.intarray.sort, undefined); }
  else assert.equal(disk.extensions, undefined);
}
`,
      );
      await run(["bun", "generate.mjs"]);
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createIntarray_1_5, intarrayValues } from "kello/extensions/intarray";
const api = createIntarray_1_5(${JSON.stringify(descriptor)});
assert.equal(Object.keys(api.sql.overloads).length, 39);
assert.equal(Object.keys(api.sql.operators).length, 14);
assert.deepEqual(intarrayValues([1, 2], 0), { dimensions: [{ lowerBound: 0, length: 2 }], values: [1, 2] });
assert.equal(api.queryCodec.encode("1 &"), "1 &");
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }]) assert.throws(() => createIntarray_1_5({ ...api, apiSupport: support }), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import type { SQL } from "drizzle-orm";
import { integer, pgTable, text } from "drizzle-orm/pg-core";
import type { PostgreSqlArray } from "kello/extensions/intarray";
import { extensions as custom } from "./selected";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
const table = pgTable("documents", { tags: integer().array().notNull(), label: text() });
const api = custom.intarray;
const placement: "packed_intarray" = api.schema;
const version: "1.5" = api.version;
const field = api.field().notNull().default([1]);
const sorted: SQL<PostgreSqlArray<number> | null> = api.sort(table.tags, "DeSc");
// @ts-expect-error Native indexed fields contain only int4 elements.
field.default([null]);
const composed: SQL<boolean | null> = api.contains(api.union(table.tags, sorted), [1]);
const matched: SQL<boolean | null> = api.matches(table.tags, "1 & !2");
const counted: SQL<number | null> = api.count(table.tags);
const slice: SQL<PostgreSqlArray<number> | null> = api.subarray(table.tags, -2);
const operator: SQL<PostgreSqlArray<number> | null> = api.sql.operators["|(_int4,int4)"](table.tags, 3);
const missing: undefined = absent;
const noSelection: undefined = empty;
// @ts-expect-error SQL NULL remains part of strict results.
const required: SQL<boolean> = matched;
// @ts-expect-error Only ASC or DESC.
api.sort(table.tags, "up");
// @ts-expect-error Text columns are not int4[] arguments.
api.uniq(table.label);
// @ts-expect-error Fixed result decoders do not accept caller return casts.
api.icount<string>(table.tags);
// @ts-expect-error Unselected families remain absent.
void custom.fuzzystrmatch;
// @ts-expect-error Future versions expose descriptors only.
void future.intarray.sort;
void [placement, version, field, sorted, composed, matched, counted, slice, operator, missing, noSelection, required];
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
const entry = await realpath(fileURLToPath(import.meta.resolve("kello/extensions/intarray")));
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
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !/\/intarray(?:-codecs)?\.js$/.test(path)));
  const selected = name === "runtime";
  assert.equal(inputs.some(path => path.endsWith("/adapters/intarray.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (selected) { assert.deepEqual(Object.keys(extensions), ["intarray"]); assert.equal(Object.keys(extensions.intarray.sql.overloads).length, 39); }
  else if (name === "future") { assert.equal(extensions.intarray.apiSupport.status, "unverified"); assert.equal(extensions.intarray.sort, undefined); }
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
const url = process.env.LOOM_PACKED_INTARRAY_DATABASE_URL;
assert(url);
const api = extensions.intarray;
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const client = new pg.Client({ connectionString: url });
await client.connect();
const schema = defineSchema(s => ({ writes: { value: s.text().notNull() } }), { namespace: "packed_app" });
const relations = defineRelations(schema.tables);
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA " + quote(api.schema) + '; CREATE EXTENSION intarray WITH SCHEMA ' + quote(api.schema) + " VERSION '1.5'; CREATE SCHEMA packed_app; CREATE TABLE packed_app.writes(\"_id\" uuid PRIMARY KEY DEFAULT uuidv7(), \"_createdAt\" bigint NOT NULL DEFAULT 1, value text NOT NULL)");
  connection = await connectDatabase({ schema, relations, connectionString: url });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, relations, extensions);
  const lhs = { dimensions: [{ lowerBound: 0, length: 5 }], values: [5, 1, 3, 1, 2] };
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    const api = binding.intarray;
    return connection.transaction(db => db.select({
      union: api.union(lhs, [1, 2, 7]), sortedBounds: api.sortDesc(lhs), removed: api.removeElement(lhs, 1), matched: api.matches(lhs, "1&!7"),
      count: api.count([[1, 2], [3, 4]].flat()), position: api.indexOf(lhs, 9), slice: api.subarray(lhs, -2), same: api.sql.functions._int_same([2, 1, 1], [1, 2]),
      nullMatch: api.matches(null, "1"), nullSort: api.sort(null, "asc"),
    }).from(sql.raw("(values(1)) fixture(id)")));
  });
  const invocation = { requestId: "packed-intarray", identity: null, signal: new AbortController().signal };
  const rows = await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } });
  assert.deepEqual(deserializeRpcValue(serializeRpcValue(rows)), rows);
  const [row] = rows;
  assert.deepEqual(row.union, { dimensions: [{ lowerBound: 1, length: 5 }], values: [1, 2, 3, 5, 7] });
  assert.deepEqual(row.sortedBounds, { dimensions: [{ lowerBound: 0, length: 5 }], values: [5, 3, 2, 1, 1] });
  assert.deepEqual(row.removed, { dimensions: [{ lowerBound: 0, length: 3 }], values: [5, 3, 2] });
  assert.equal(row.matched, true); assert.equal(row.count, 4); assert.equal(row.position, 0); assert.equal(row.same, false);
  assert.deepEqual(row.slice, { dimensions: [{ lowerBound: 1, length: 2 }], values: [1, 2] });
  assert.equal(row.nullMatch, null); assert.equal(row.nullSort, null);
  await assert.rejects(connection.transaction(db => db.select({ invalid: api.uniq([1, null]) }).from(sql.raw("(values(1)) fixture(id)"))), error => error instanceof Error && error.cause instanceof Error && error.cause.message === "array must not contain nulls");
  let decoderReached = false;
  await assert.rejects(connection.transaction(async db => {
    await db.insert(schema.tables.writes).values({ value: "must roll back" });
    await db.select({ invalid: api.uniq([1]).mapWith(() => { decoderReached = true; throw new Error("decode failure") }) }).from(sql.raw("(values(1)) fixture(id)"));
  }),/decode failure/);
  assert.equal(decoderReached, true, "Insert must succeed before exercising decoder rollback");
  assert.deepEqual((await client.query("SELECT value FROM packed_app.writes")).rows,[]);
} finally { try { await connection?.close(); } finally { await client.end(); } }
console.log("packed native intarray RPC/Effect, array bounds wire, NULL and rollback contracts passed");
`,
      );
      // Bundle the complete application graph: adapters and the database share invocation-local SQL state.
      await writeFile(
        join(root, "compile-native.mjs"),
        String.raw`import assert from "node:assert/strict";
import { build } from "esbuild";
const result = await build({ entryPoints: ["project-native.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "project-native-bundle.mjs", metafile: true, external: ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])} });
const inputs = Object.keys(result.metafile.inputs);
assert(inputs.some(path => path.endsWith("/adapters/intarray.js")));
assert(!inputs.some(path => path.includes("/tooling/")));
assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !/\/intarray(?:-codecs)?\.js$/.test(path)));
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
