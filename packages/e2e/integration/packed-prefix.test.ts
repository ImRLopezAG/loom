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
import { prefixConsumerProofCase } from "../fixtures/prefix-consumer-proof-cases";

const descriptor = {
  name: "prefix",
  version: "1.2.0",
  schema: 'custom"prefix日',
  apiSupport: {
    status: "verified",
    digest: "954698fcbe5ada03bdf4bcbd9b22014e77570456f0d8471d4ca2bd99d75581a7",
  },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  prefixConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-prefix-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_PREFIX_DATABASE_URL = databaseUrl;
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
        selected: { prefix: { version: "1.2.0", schema: descriptor.schema } },
        future: { prefix: { version: "future", schema: descriptor.schema } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createPrefix_1_2_0, prefixRange } from "kello/extensions/prefix";
const api = createPrefix_1_2_0(${JSON.stringify(descriptor)});
assert.equal(Object.keys(api.sql.overloads).length, 33);
assert.equal(Object.keys(api.sql.operators).length, 11);
assert.equal(Object.keys(api.sql.functions).length, 19);
assert.equal(prefixRange("123[4-4]"), "1234");
assert.deepEqual(api.indexes.btree(), { name: "prefix", version: "1.2.0", schema: ${JSON.stringify(descriptor.schema)}, digest: ${JSON.stringify(descriptor.apiSupport.digest)}, member: "opclass:$extension:prefix.btree_prefix_range_ops/btree", method: "btree", opclass: "btree_prefix_range_ops", type: "prefix_range", default: true, input: { schema: ${JSON.stringify(descriptor.schema)}, type: "prefix_range", dimensions: 0 } });
assert.equal(api.indexes.gist().member, "opclass:$extension:prefix.gist_prefix_range_ops/gist");
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }]) assert.throws(() => createPrefix_1_2_0({ ...api, apiSupport: support }), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import type { SQL } from "drizzle-orm";
import { prefixRange, type PrefixRange, type PostgreSqlArray } from "kello/extensions/prefix";
import { extensions as custom } from "./selected";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
const api = custom.prefix;
const placement: 'custom"prefix日' = api.schema;
const version: "1.2.0" = api.version;
const equal: SQL<boolean | null> = api.equal(prefixRange("123"), prefixRange("123[4-4]"));
const contains: SQL<boolean | null> = api.contains(prefixRange("123[4-6]"), prefixRange("1234"));
const length: SQL<number | null> = api.length(prefixRange("1234"));
const union: SQL<PrefixRange | null> = api.union(prefixRange("123"), prefixRange("1234"));
const fromText: SQL<PrefixRange | null> = api.fromText("123[4-6]");
const operator: SQL<boolean | null> = api.sql.operators["@>"](prefixRange("123[4-6]"), prefixRange("1234"));
const tags: PostgreSqlArray<PrefixRange> = { dimensions: [{ lowerBound: -2, length: 2 }], values: [prefixRange("123"), null] };
const missing: undefined = absent;
const noSelection: undefined = empty;
// @ts-expect-error SQL NULL remains part of strict results.
const required: SQL<boolean> = equal;
// @ts-expect-error Native text cannot substitute for a branded prefix_range value.
api.equal("123", prefixRange("123"));
// @ts-expect-error Fixed result decoders do not accept caller return casts.
api.length<string>(prefixRange("123"));
// @ts-expect-error Unselected families remain absent.
void custom.unaccent;
// @ts-expect-error Future versions expose descriptors only.
void future.prefix.length;
void [placement, version, equal, contains, length, union, fromText, operator, tags, missing, noSelection, required];
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
const entry = await realpath(fileURLToPath(import.meta.resolve("kello/extensions/prefix")));
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
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/prefix.js") && !path.endsWith("/prefix-codecs.js")));
  const selected = name === "runtime";
  assert.equal(inputs.some(path => path.endsWith("/adapters/prefix.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (selected) { assert.deepEqual(Object.keys(extensions), ["prefix"]); assert.equal(Object.keys(extensions.prefix.sql.overloads).length, 33); }
  else if (name === "future") { assert.equal(extensions.prefix.apiSupport.status, "unverified"); assert.equal(extensions.prefix.length, undefined); }
  else assert.equal(extensions, undefined);
}
for (const name of ["runtime", "future", "absent", "empty"]) await bundle(name);
`.replace("EXTERNALS", JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])),
      );
      await run(["node", "verify.mjs"]);
      await writeFile(
        join(root, "schema.mjs"),
        `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./selected.ts";
const api = extensions.prefix;
export const schema = defineSchema((fields) => ({ entries: defineTable({ value: api.field(), label: fields.text() }, { indexes: [
  { fields: ["value"], extension: api.indexes.btree() },
  { fields: ["value"], extension: api.indexes.gist() },
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
import { defineRelations, sql } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { connectDatabase, createProjectProcedures, createProjectServices, Invocation } from "kello/server";
import { prefixRange } from "kello/extensions/prefix";
import { schema } from "./schema.mjs";
import { extensions } from "./selected.ts";
const url = process.env.LOOM_PACKED_PREFIX_DATABASE_URL;
assert(url);
const api = extensions.prefix;
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const client = new pg.Client({ connectionString: url });
await client.connect();
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA " + quote(api.schema) + "; CREATE EXTENSION prefix WITH SCHEMA " + quote(api.schema) + " VERSION '1.2.0'");
  for (const statement of JSON.parse(await readFile("migration.json", "utf8"))) await client.query(statement);
  assert.deepEqual(schema.metadata.extensionRequirements.map(entry => entry.member).sort(), [
    "opclass:$extension:prefix.btree_prefix_range_ops/btree",
    "opclass:$extension:prefix.gist_prefix_range_ops/gist",
    "operator:$extension:prefix.<>($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
    "operator:$extension:prefix.=($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
    "type:$extension:prefix.prefix_range",
  ]);
  const classes = (await client.query("select am.amname,c.opcname,n.nspname from pg_index i join pg_class t on t.oid=i.indrelid join pg_opclass c on c.oid=i.indclass[0] join pg_namespace n on n.oid=c.opcnamespace join pg_am am on am.oid=c.opcmethod where t.oid='packed_app.entries'::regclass and n.nspname=$1 order by am.amname", [api.schema])).rows;
  assert.deepEqual(classes, [
    { amname: "btree", opcname: "btree_prefix_range_ops", nspname: api.schema },
    { amname: "gist", opcname: "gist_prefix_range_ops", nspname: api.schema },
  ]);
  const relations = defineRelations(schema.tables);
  connection = await connectDatabase({ schema, relations, connectionString: url });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, relations, extensions);
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    const api = binding.prefix;
    return connection.transaction(db => db.select({
      length: api.length(prefixRange("1234")),
      contains: api.contains(prefixRange("123[4-6]"), prefixRange("1234")),
      union: api.union(prefixRange("123"), prefixRange("1234")),
      equal: api.equal(prefixRange("1234"), prefixRange("123[4-4]")),
      nullLength: api.length(null),
    }).from(sql.raw("(values(1)) fixture(id)")));
  });
  const invocation = { requestId: "packed-prefix", identity: null, signal: new AbortController().signal };
  const [row] = await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } });
  assert.equal(row.length, 4);
  assert.equal(row.contains, true);
  assert.equal(row.union, "123");
  assert.equal(row.equal, true);
  assert.equal(row.nullLength, null);
  let decoderReached = false;
  await assert.rejects(connection.transaction(async db => {
    await db.insert(schema.tables.entries).values({ value: prefixRange("99"), label: "must roll back" });
    await db.select({ invalid: api.length(prefixRange("123")).mapWith(() => { decoderReached = true; throw new Error("decode failure") }) }).from(sql.raw("(values(1)) fixture(id)"));
  }), /decode failure/);
  assert.equal(decoderReached, true, "Insert must succeed before exercising decoder rollback");
  assert.deepEqual((await client.query("SELECT label FROM packed_app.entries")).rows, []);
} finally { try { await connection?.close(); } finally { await client.end(); } }
console.log("packed prefix index contracts, native RPC/Effect, NULL and rollback contracts passed");
`,
      );
      await writeFile(
        join(root, "compile-native.mjs"),
        `import assert from "node:assert/strict";
import { build } from "esbuild";
const external = ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])};
const result = await build({ entryPoints: ["project-native.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "project-native-bundle.mjs", metafile: true, external });
const inputs = Object.keys(result.metafile.inputs);
assert(inputs.some(path => path.endsWith("/adapters/prefix.js")));
assert(!inputs.some(path => path.includes("/tooling/")));
assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/prefix.js") && !path.endsWith("/prefix-codecs.js")));
await build({ entryPoints: ["schema.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "schema.bundle.mjs", external: [...external, "kello", "kello/*"] });
`,
      );
      await run(["node", "compile-native.mjs"]);
      await run(["node", "migrate.mjs"]);
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
