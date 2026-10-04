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
import { bloomConsumerProofCase } from "../fixtures/bloom-proof-cases";

const descriptor = {
  name: "bloom",
  version: "1.0",
  schema: 'custom"bloom',
  apiSupport: {
    status: "verified",
    digest: "e35e04e263d75f19673d2b1282a75b7975b74f201c7cd5dc8040188f54b06cc3",
  },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  bloomConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-bloom-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_BLOOM_DATABASE_URL = databaseUrl;
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
      for (const [file, selection] of Object.entries({
        selected: { bloom: { version: "1.0", schema: descriptor.schema } },
        future: { bloom: { version: "future", schema: descriptor.schema } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createBloom_1_0 } from "kello/extensions/bloom";
const api = createBloom_1_0(${JSON.stringify(descriptor)});
assert.deepEqual(api.indexes.int4(), { name: "bloom", version: "1.0", schema: ${JSON.stringify(descriptor.schema)}, digest: ${JSON.stringify(descriptor.apiSupport.digest)}, member: "opclass:$extension:bloom.int4_ops/bloom", method: "bloom", opclass: "int4_ops", type: "int4", default: true, input: { schema: "pg_catalog", type: "int4", dimensions: 0 } });
assert.equal(api.indexes.text().member, "opclass:$extension:bloom.text_ops/bloom");
assert.deepEqual(api.storage({ length: 80, bits: [2, 4] }), { length: 80, col1: 2, col2: 4 });
assert.throws(() => api.storage({ length: 4097 }));
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }]) assert.throws(() => createBloom_1_0({ ...api, apiSupport: support }), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import { defineSchema, defineTable } from "kello/server";
import { extensions as custom } from "./selected";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
const api = custom.bloom;
const placement: 'custom"bloom' = api.schema;
const version: "1.0" = api.version;
const unique: false = api.accessMethod.unique;
const storage: Readonly<Record<string, number>> = api.storage({ length: 80, bits: [3] });
defineSchema((fields) => ({ entries: defineTable({ code: fields.integer() }, { indexes: [{ fields: ["code"], extension: api.indexes.int4(), with: storage }] }) }), { namespace: "app" });
const missing: undefined = absent;
const noSelection: undefined = empty;
// @ts-expect-error Only the captured int4 and text classes exist.
api.indexes.int8();
// @ts-expect-error fillfactor is not a bloom storage parameter.
api.storage({ fillfactor: 50 });
// @ts-expect-error Unselected families remain absent.
void custom.unaccent;
// @ts-expect-error Future versions expose descriptors only.
void future.bloom.indexes;
void [placement, version, unique, missing, noSelection];
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
const entry = await realpath(fileURLToPath(import.meta.resolve("kello/extensions/bloom")));
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
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/bloom.js")));
  const selected = name === "runtime";
  assert.equal(inputs.some(path => path.endsWith("/adapters/bloom.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (selected) { assert.deepEqual(Object.keys(extensions), ["bloom"]); assert.equal(extensions.bloom.indexes.text().opclass, "text_ops"); }
  else if (name === "future") { assert.equal(extensions.bloom.apiSupport.status, "unverified"); assert.equal(extensions.bloom.indexes, undefined); }
  else assert.equal(extensions, undefined);
}
for (const name of ["runtime", "future", "absent", "empty"]) await bundle(name);
`.replace("EXTERNALS", JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])),
      );
      await run(["node", "verify.mjs"]);
      // Migration DDL is generated by packed tooling, outside the runtime bundle checked below.
      await writeFile(
        join(root, "schema.mjs"),
        `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./selected.ts";
const api = extensions.bloom;
export const schema = defineSchema((fields) => ({ entries: defineTable({ code: fields.integer(), label: fields.text(), region: fields.text() }, { indexes: [
  { fields: ["code"], extension: api.indexes.int4(), with: api.storage({ length: 80, bits: [3] }) },
  { fields: ["label", "region"], extension: api.indexes.text(), with: api.storage({ bits: [2, 4] }) },
] }) }), { namespace: "packed_app" });
`,
      );
      await writeFile(
        join(root, "migrate.mjs"),
        `import { writeFile } from "node:fs/promises";
import { createSnapshot, emptySnapshot, migrationStatements } from "kello/tooling";
import { schema } from "./schema.bundle.mjs";
await writeFile("migration.json", JSON.stringify(await migrationStatements(await emptySnapshot("packed_app"), await createSnapshot(schema))));
`,
      );
      await writeFile(
        join(root, "project-native.mjs"),
        String.raw`import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { defineRelations, eq, and } from "drizzle-orm";
import { connectDatabase } from "kello/server";
import { schema } from "./schema.mjs";
import { extensions } from "./selected.ts";
const url = process.env.LOOM_PACKED_BLOOM_DATABASE_URL;
assert(url);
const api = extensions.bloom;
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const client = new pg.Client({ connectionString: url });
await client.connect();
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA " + quote(api.schema) + "; CREATE EXTENSION bloom WITH SCHEMA " + quote(api.schema) + " VERSION '1.0'");
  for (const statement of JSON.parse(await readFile("migration.json", "utf8"))) await client.query(statement);
  assert.deepEqual(schema.metadata.extensionRequirements.map(entry => entry.member), ["opclass:$extension:bloom.int4_ops/bloom", "opclass:$extension:bloom.text_ops/bloom"]);
  const indexes = await client.query("select c.relname, am.amname, n.nspname, pg_catalog.array_to_string(c.reloptions, ',') options from pg_index i join pg_class c on c.oid=i.indexrelid join pg_am am on am.oid=c.relam join pg_opclass o on o.oid=i.indclass[0] join pg_namespace n on n.oid=o.opcnamespace where i.indrelid='packed_app.entries'::regclass and am.amname='bloom' order by 1");
  assert.deepEqual(indexes.rows, [
    { relname: "entries_0_idx", amname: "bloom", nspname: api.schema, options: "length=80,col1=3" },
    { relname: "entries_1_idx", amname: "bloom", nspname: api.schema, options: "col1=2,col2=4" },
  ]);
  connection = await connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString: url });
  const table = schema.tables.entries;
  const regions = ["north", "south", "east", "west"];
  await connection.transaction(db => db.insert(table).values(Array.from({ length: 2000 }, (_, x) => ({ code: x % 499, label: "label-" + (x % 97), region: regions[x % 4] }))));
  await client.query("analyze packed_app.entries");
  for (const [where, oracle] of [[eq(table.code, 7), "code = 7"], [and(eq(table.label, "label-3"), eq(table.region, "east")), "label = 'label-3' and region = 'east'"]]) {
    await client.query("begin; set local enable_seqscan=off; set local enable_indexscan=off");
    const plan = JSON.stringify((await client.query("explain (format json) select _id from packed_app.entries where " + oracle)).rows);
    await client.query("rollback");
    assert.match(plan, /"Node Type":"Bitmap Index Scan"/);
    const indexed = await connection.transaction(db => db.select({ id: table._id }).from(table).where(where).orderBy(table._id));
    await client.query("begin; set local enable_bitmapscan=off; set local enable_indexscan=off");
    const sequential = (await client.query("select _id id from packed_app.entries where " + oracle + " order by _id")).rows;
    await client.query("rollback");
    assert(indexed.length > 0);
    assert.deepEqual(indexed, sequential);
  }
  await assert.rejects(client.query("create unique index on packed_app.entries using bloom (code)"), /does not support unique indexes/);
} finally { try { await connection?.close(); } finally { await client.end(); } }
console.log("packed bloom index contracts, native migration, storage and scan-oracle contracts passed");
`,
      );
      // Bundle the complete application graph: adapters and the database share invocation-local SQL state.
      // A separately bundled adapter mixed with an unbundled server is a second Kello instance and rejects execution.
      await writeFile(
        join(root, "compile-native.mjs"),
        `import assert from "node:assert/strict";
import { build } from "esbuild";
const external = ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])};
const result = await build({ entryPoints: ["project-native.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "project-native-bundle.mjs", metafile: true, external });
const inputs = Object.keys(result.metafile.inputs);
assert(inputs.some(path => path.endsWith("/adapters/bloom.js")));
assert(!inputs.some(path => path.includes("/tooling/")));
assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/bloom.js")));
await build({ entryPoints: ["schema.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "schema.bundle.mjs", external: [...external, "kello", "kello/*"] });
`,
      );
      await run(["node", "compile-native.mjs"]);
      await run(["node", "migrate.mjs"]);
      await withExtensionDatabase(async (url) => {
        await run(["node", "project-native-bundle.mjs"], root, url);
      });
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), packedSha256);
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      const packedOutput = process.env.LOOM_EXTENSION_PROOF_PACKED_OUTPUT;
      if (packedOutput !== undefined) {
        const nodeVersion = (await run(["node", "--version"])).trim();
        await writeFile(
          join(packedOutput, "consumer.json"),
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
          { flag: "wx", mode: 0o600 },
        );
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
