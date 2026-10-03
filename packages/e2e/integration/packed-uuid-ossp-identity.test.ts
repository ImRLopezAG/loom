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
import { uuidOsspConsumerProofCase } from "../fixtures/uuid-ossp-proof-cases";

const descriptor = {
  name: "uuid-ossp",
  version: "1.1",
  schema: 'uuid"schema',
  apiSupport: {
    status: "verified",
    digest: "6961935a6844d9e8007d1d391a2deb0dc766e070e15ad0d4687134b46c4b7796",
  },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  uuidOsspConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-uuid-ossp-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_UUID_OSSP_DATABASE_URL = databaseUrl;
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
            output = output
              .replaceAll(value, "[redacted]")
              .replaceAll(decodeURIComponent(value), "[redacted]");
        }
        output = output.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
      }
      assert.equal(code, 0, `${command.join(" ")}\n${output}`);
    }
    try {
      await run(
        ["bun", "pm", "pack", "--filename", join(root, "loom.tgz"), "--ignore-scripts"],
        source,
      );
      const packedBytes = await readFile(join(root, "loom.tgz"));
      const packedSha256 = sha256(packedBytes);
      if (retainedArtifactPath !== undefined) {
        // COPYFILE_EXCL: an existing file at the host path is an error, never silently replaced.
        await copyFile(join(root, "loom.tgz"), retainedArtifactPath, constants.COPYFILE_EXCL);
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
        ["loom", "file:./loom.tgz"],
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
        sha256(await readFile(join(root, "loom.tgz"))),
        packedSha256,
        "The tarball changed during installation",
      );
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      const lockfileSha256 = await consumerLockfileSha256(root);
      await removeConsumerNodeModules(root);
      assert.equal(
        await consumerLockfileSha256(root),
        lockfileSha256,
        "Removing node_modules changed the lockfile",
      );
      await run([
        "bun",
        "install",
        "--ignore-scripts",
        "--linker",
        "isolated",
        "--frozen-lockfile",
      ]);
      assert.equal(
        await consumerLockfileSha256(root),
        lockfileSha256,
        "The frozen reinstall changed the lockfile",
      );
      assert.equal(
        sha256(await readFile(join(root, "loom.tgz"))),
        packedSha256,
        "The tarball changed during reinstall",
      );
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      for (const [file, selection] of Object.entries({
        selected: { "uuid-ossp": { version: "1.1", schema: descriptor.schema } },
        future: { "uuid-ossp": { version: "future", schema: descriptor.schema } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createUuidOssp_1_1, uuidCodec } from "loom/extensions/uuid-ossp";
const api = createUuidOssp_1_1(${JSON.stringify(descriptor)});
assert.equal(Object.keys(api.sql.functions).length, 10);
assert.equal(uuidCodec.decode("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF"), "ffffffff-ffff-ffff-ffff-ffffffffffff");
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }]) assert.throws(() => createUuidOssp_1_1({ ...api, apiSupport: support }), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import type { SQL } from "drizzle-orm";
import { pgTable, text, uuid, integer } from "drizzle-orm/pg-core";
import { extensions } from "./selected";
import { extensions as future } from "./future";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
const api = extensions["uuid-ossp"];
const table = pgTable("names", { namespace: uuid(), name: text(), count: integer() });
const version: "1.1" = api.version;
const placement: 'uuid"schema' = api.schema;
const constants: SQL<string>[] = [api.nil(), api.namespaceDns(), api.namespaceUrl(), api.namespaceOid(), api.namespaceX500()];
const generated: SQL<string>[] = [api.v1(), api.v1mc(), api.v4()];
const named: SQL<string | null>[] = [api.v3(table.namespace, table.name), api.v5(api.namespaceUrl(), null), api.sql.functions.uuid_generate_v5(api.namespaceOid(), "name")];
const missing: undefined = absent;
const noSelection: undefined = empty;
function compileOnly() {
  // @ts-expect-error UUID namespaces cannot be text columns.
  api.v3(table.name, "name");
  // @ts-expect-error Names reject numeric columns.
  api.v5(table.namespace, table.count);
  // @ts-expect-error Strict named functions retain nullable results.
  const required: SQL<string> = api.v5(api.namespaceDns(), "name");
  // @ts-expect-error Future versions remain descriptor-only.
  void future["uuid-ossp"].v4;
  // @ts-expect-error The dashed identity has no underscore alias.
  void extensions.uuid_ossp;
  // @ts-expect-error Unselected families remain absent.
  void extensions.unaccent;
  // @ts-expect-error Result codecs are fixed.
  api.v4<number>();
  void required;
}
void [version, placement, constants, generated, named, missing, noSelection, compileOnly];
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
const root = await realpath("node_modules/loom");
const entry = await realpath(fileURLToPath(import.meta.resolve("loom/extensions/uuid-ossp")));
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
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/uuid-ossp.js")));
  const selected = name === "runtime";
  assert.equal(inputs.some(path => path.endsWith("/adapters/uuid-ossp.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (selected) { assert.deepEqual(Object.keys(extensions), ["uuid-ossp"]); assert.equal(Object.keys(extensions["uuid-ossp"].sql.functions).length, 10); }
  else if (name === "future") { assert.equal(extensions["uuid-ossp"].apiSupport.status, "unverified"); assert.equal(extensions["uuid-ossp"].v4, undefined); }
  else assert.equal(extensions, undefined);
}
for (const name of ["runtime", "future", "absent", "empty"]) await bundle(name);
`.replace("EXTERNALS", JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])),
      );
      await run(["node", "verify.mjs"]);
      await writeFile(
        join(root, "project-native.mjs"),
        String.raw`import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { connectDatabase, createProjectProcedures, createProjectServices, defineSchema, Invocation } from "loom/server";
import { uuidCodec } from "loom/extensions/uuid-ossp";
import { extensions } from "./selected.ts";
const url = process.env.LOOM_PACKED_UUID_OSSP_DATABASE_URL;
assert(url);
const api = extensions["uuid-ossp"];
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const client = new pg.Client({ connectionString: url });
await client.connect();
const schema = defineSchema(s => ({ writes: { value: s.text().notNull() } }), { namespace: "packed_app" });
const relations = defineRelations(schema.tables);
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA " + quote(api.schema) + '; CREATE EXTENSION "uuid-ossp" WITH SCHEMA ' + quote(api.schema) + " VERSION '1.1'; CREATE SCHEMA packed_app; CREATE TABLE packed_app.writes(value text NOT NULL)");
  connection = await connectDatabase({ schema, relations, connectionString: url });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, relations, extensions);
  const namespaces = ["6ba7b810-9dad-11d1-80b4-00c04fd430c8", "6ba7b811-9dad-11d1-80b4-00c04fd430c8", "6ba7b812-9dad-11d1-80b4-00c04fd430c8", "6ba7b814-9dad-11d1-80b4-00c04fd430c8"];
  const name = "é😀";
  function named(namespace, version) {
    const digest = createHash(version === 3 ? "md5" : "sha1").update(Buffer.from(namespace.replaceAll("-", ""), "hex")).update(name, "utf8").digest().subarray(0, 16);
    digest[6] = (digest[6] & 15) | (version << 4); digest[8] = (digest[8] & 63) | 128;
    const hex = digest.toString("hex"); return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join("-");
  }
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    const api = binding["uuid-ossp"];
    return connection.transaction(db => db.select({ nil: api.nil(), dns: api.namespaceDns(), url: api.namespaceUrl(), oid: api.namespaceOid(), x500: api.namespaceX500(), v1: api.v1(), v1mc: api.v1mc(), v4: api.v4(), v3: api.v3(api.namespaceDns(), name), v5: api.v5(api.namespaceDns(), name), nullName: api.v5(api.namespaceDns(), null) }).from(sql.raw("(values(1)) fixture(id)")));
  });
  const invocation = { requestId: "packed-uuid", identity: null, signal: new AbortController().signal };
  const [row] = await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } });
  assert.deepEqual([row.nil,row.dns,row.url,row.oid,row.x500], ["00000000-0000-0000-0000-000000000000", ...namespaces]);
  assert.equal(row.v3, named(namespaces[0],3)); assert.equal(row.v5,named(namespaces[0],5)); assert.equal(row.nullName,null);
  for (const [key,version] of [["v1","1"],["v1mc","1"],["v4","4"]]) { assert.equal(row[key][14],version); assert.match(row[key][19],/[89ab]/); assert.equal(uuidCodec.decode(row[key]),row[key]); }
  assert.equal(parseInt(row.v1mc.slice(24,26),16)&1,1);
  for (const namespace of namespaces) {
    const [value] = await connection.db.select({ v3: api.v3(namespace,name), v5: api.v5(namespace,name) }).from(sql.raw("(values(1)) fixture(id)"));
    assert.deepEqual(value,{v3:named(namespace,3),v5:named(namespace,5)});
  }
  for (const bad of ["a\0b", "\ud800", "\udc00"]) assert.throws(() => api.v5(api.namespaceDns(),bad),/lossless PostgreSQL UTF8 text/);
  await assert.rejects(connection.transaction(async db => {
    await db.insert(schema.tables.writes).values({ value: "must roll back" });
    await db.select({ invalid: api.v4().mapWith(() => uuidCodec.decode("invalid")) }).from(sql.raw("(values(1)) fixture(id)"));
  }));
  assert.deepEqual((await client.query("SELECT value FROM packed_app.writes")).rows,[]);
  assert.equal((await connection.db.select({ ok: api.nil() }).from(sql.raw("(values(1)) fixture(id)")))[0].ok,"00000000-0000-0000-0000-000000000000");
} finally { try { await connection?.close(); } finally { await client.end(); } }
console.log("packed native all-ten RPC/Effect, exact identity and rollback contracts passed");
`,
      );
      // Bundle the complete application graph: adapters and the database share invocation-local SQL state.
      // A separately bundled adapter mixed with an unbundled server is a second Loom instance and rejects execution.
      await writeFile(
        join(root, "compile-native.mjs"),
        `import assert from "node:assert/strict";
import { build } from "esbuild";
const result = await build({ entryPoints: ["project-native.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "project-native-bundle.mjs", metafile: true, external: ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])} });
const inputs = Object.keys(result.metafile.inputs);
assert(inputs.some(path => path.endsWith("/adapters/uuid-ossp.js")));
assert(!inputs.some(path => path.includes("/tooling/")));
assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/uuid-ossp.js")));
`,
      );
      await run(["node", "compile-native.mjs"]);
      await withExtensionDatabase((url) => run(["node", "project-native-bundle.mjs"], root, url));
      assert.equal(sha256(await readFile(join(root, "loom.tgz"))), packedSha256);
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
