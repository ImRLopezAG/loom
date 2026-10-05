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
import { tablefuncConsumerProofCase } from "../fixtures/tablefunc-consumer-proof-cases";
import { tablefuncMembers, tablefuncRoutines } from "../fixtures/tablefunc-proof-cases";

// Native installation placement is quoted on purpose; defineConfig accepts only canonical lowercase ASCII names.
const descriptor = {
  name: "tablefunc",
  version: "1.0",
  schema: 'table"func',
  apiSupport: {
    status: "verified",
    digest: "08f54e73281a2592eddf0ac6f555ba1a0b3c0961fb7ab6eab05be90ab74b66d4",
  },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  tablefuncConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-tablefunc-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_TABLEFUNC_DATABASE_URL = databaseUrl;
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
        selected: { tablefunc: { version: "1.0", schema: descriptor.schema } },
        future: { tablefunc: { version: "future", schema: descriptor.schema } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createTablefunc_1_0, textCodec } from "kello/extensions/tablefunc";
const api = createTablefunc_1_0(${JSON.stringify(descriptor)});
assert.deepEqual(Object.keys(api.sql.overloads).toSorted(), ${JSON.stringify([...tablefuncRoutines].toSorted())});
assert.deepEqual([...Object.keys(api.sql.overloads), ...Object.keys(api.sql.types)].toSorted(), ${JSON.stringify([...tablefuncMembers].toSorted())});
assert.equal(api.schema, ${JSON.stringify(descriptor.schema)});
assert.throws(() => api.crosstab2({ source: Object.freeze({}), alias: "p" }), /managed provenance/);
assert.throws(() => api.crosstab({ source: Object.freeze({}), fields: { r: textCodec, a: textCodec }, alias: "p" }), /managed provenance/);
assert.throws(() => api.connectby({ source: Object.freeze({}), key: "k", parent: "p", start: "1", maxDepth: 0, keyCodec: textCodec, alias: "t" }), /managed provenance/);
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }]) assert.throws(() => createTablefunc_1_0({ ...api, apiSupport: support }), /exact verified contract/);
assert.throws(() => createTablefunc_1_0({ ...${JSON.stringify(descriptor)}, version: "1.1" }), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import { int4Codec, textCodec, type NonfiniteNumber } from "kello/extensions/tablefunc";
import type { NestedQuery } from "kello/server";
import type { SQL } from "drizzle-orm";
import { extensions as custom } from "./selected";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
declare const source: NestedQuery<{ name: string; cat: string; val: string }>;
const api = custom.tablefunc;
const placement: 'table"func' = api.schema;
const version: "1.0" = api.version;
const category: SQL<string | null> = api.crosstab3({ source, alias: "p" }).columns.category_3;
const pivot: SQL<number> = api.crosstab({ source, fields: { name: textCodec, n: int4Codec }, alias: "p" }).columns.n;
const tree = api.connectby({ relation: { schema: "app", name: "tree" }, key: "id", parent: "parent", orderBy: "pos", start: "1", maxDepth: 0, keyCodec: int4Codec, alias: "t" });
const pos: SQL<number> = tree.columns.pos;
const parent: SQL<number | null> = tree.columns.parent_keyid;
const sample: SQL<number | NonfiniteNumber> = api.normalRand(1, 0, 1, "s").columns.value;
const missing: undefined = absent;
const noSelection: undefined = empty;
// @ts-expect-error Raw SQL text is never a crosstab source.
api.crosstab2({ source: "select 1", alias: "p" });
// @ts-expect-error connectby has no branch column without branchDelimiter.
void tree.columns.branch;
// @ts-expect-error Unselected families remain absent.
void custom.bloom;
// @ts-expect-error Future versions expose descriptors only.
void future.tablefunc.crosstab;
void [placement, version, category, pivot, pos, parent, sample, missing, noSelection];
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
const entry = await realpath(fileURLToPath(import.meta.resolve("kello/extensions/tablefunc")));
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
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/tablefunc.js")));
  const selected = name === "runtime";
  assert.equal(inputs.some(path => path.endsWith("/adapters/tablefunc.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (selected) { assert.deepEqual(Object.keys(extensions), ["tablefunc"]); assert.equal(Object.keys(extensions.tablefunc.sql.overloads).length, 11); assert.equal(Object.keys(extensions.tablefunc.sql.types).length, 9); }
  else if (name === "future") { assert.equal(extensions.tablefunc.apiSupport.status, "unverified"); assert.equal(extensions.tablefunc.crosstab, undefined); }
  else assert.equal(extensions, undefined);
}
for (const name of ["runtime", "future", "absent", "empty"]) await bundle(name);
`.replace("EXTERNALS", JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])),
      );
      await run(["node", "verify.mjs"]);
      // Migration DDL is generated by packed tooling, outside the runtime bundle checked above.
      await writeFile(
        join(root, "schema.mjs"),
        `import { defineSchema } from "kello/server";
export const schema = defineSchema((fields) => ({
  facts: { name: fields.text(), cat: fields.text().notNull(), val: fields.text() },
  cats: { cat: fields.text().notNull() },
  tree: { node: fields.text().notNull(), parent: fields.text(), pos: fields.integer().notNull() },
}), { namespace: "packed_app" });
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
import * as v from "valibot";
import { call } from "@orpc/server";
import { Context } from "effect";
import { defineRelations } from "drizzle-orm";
import { bindRpcDatabaseProcedure, connectDatabase, createDatabaseMiddleware, createProjectProcedures, Invocation, nestedQuery } from "kello/server";
import { int4Codec, nullableCodec, textCodec } from "kello/extensions/tablefunc";
import { schema } from "./schema.mjs";
import { extensions } from "./selected.ts";
const url = process.env.LOOM_PACKED_TABLEFUNC_DATABASE_URL;
assert(url);
const api = extensions.tablefunc;
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const ns = quote(api.schema);
const client = new pg.Client({ connectionString: url });
await client.connect();
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA " + ns + "; CREATE EXTENSION tablefunc WITH SCHEMA " + ns + " VERSION '1.0'");
  assert.deepEqual((await client.query("select extversion, extnamespace::regnamespace::text ns from pg_extension where extname='tablefunc'")).rows, [{ extversion: "1.0", ns }]);
  for (const statement of JSON.parse(await readFile("migration.json", "utf8"))) await client.query(statement);
  await client.query("insert into packed_app.facts (name, cat, val) values ('r1', 'a', 'x'), ('r1', 'b', 'y'), ('r1', 'c', 'w'), ('r1', 'd', 'v'), ('r2', 'b', 'z'), (null, 'a', 'n')");
  await client.query("insert into packed_app.cats (cat) values ('a'), ('b')");
  await client.query("insert into packed_app.tree (node, parent, pos) values ('row1', null, 0), ('row2', 'row1', 1), ('row3', 'row1', 0), ('row4', 'row2', 0)");
  const relations = defineRelations(schema.tables);
  connection = await connectDatabase({ schema, relations, connectionString: url });
  const { procedure, validators } = createProjectProcedures(schema, relations, extensions);
  const facts = validators.tables.facts.search({ columns: ["name", "cat", "val"], filter: ["cat"], order: ["name", "cat"], scope: "public" });
  const cats = validators.tables.cats.search({ columns: ["cat"], filter: ["cat"], order: ["cat"], scope: "public" });
  const text = nullableCodec(textCodec);
  const order = [{ field: "name", direction: "asc" }, { field: "cat", direction: "asc" }];
  const source = () => nestedQuery(facts, { columns: { name: true, cat: true, val: true }, orderBy: order });
  const tree = { relation: { schema: "packed_app", name: "tree" }, key: "node", parent: "parent", start: "row1", maxDepth: 0, keyCodec: textCodec, alias: "t" };
  const helpers = {
    crosstab1: () => api.crosstab({ source: source(), fields: { name: text, a: text, b: text }, alias: "p" }),
    crosstabCount: () => api.crosstab({ source: source(), count: 2, fields: { name: text, a: text, b: text }, alias: "p" }),
    crosstabHash: () => api.crosstab({ source: source(), categories: nestedQuery(cats, { columns: { cat: true }, orderBy: [{ field: "cat", direction: "asc" }] }), fields: { name: text, a: text, b: text }, alias: "p" }),
    crosstab2: () => api.crosstab2({ source: source(), alias: "p" }),
    crosstab3: () => api.crosstab3({ source: source(), alias: "p" }),
    crosstab4: () => api.crosstab4({ source: source(), alias: "p" }),
    connectby5: () => api.connectby(tree),
    connectby6: () => api.connectby({ ...tree, branchDelimiter: "~" }),
    connectbySerial6: () => api.connectby({ ...tree, orderBy: "pos" }),
    connectbySerial7: () => api.connectby({ ...tree, orderBy: "pos", branchDelimiter: "~" }),
    normalRand: () => api.normalRand(4, -1.5, 0, "s"),
  };
  const n = (sqlText) => "$$" + sqlText + "$$";
  const src = n("select name, cat, val from packed_app.facts order by 1, 2");
  const cb = "'packed_app.tree', 'node', 'parent'";
  const natives = {
    crosstab1: "select * from " + ns + ".crosstab(" + src + ") as p(name text, a text, b text)",
    crosstabCount: "select * from " + ns + ".crosstab(" + src + ", 2) as p(name text, a text, b text)",
    crosstabHash: "select * from " + ns + ".crosstab(" + src + ", " + n("select cat from packed_app.cats order by 1") + ") as p(name text, a text, b text)",
    crosstab2: "select * from " + ns + ".crosstab2(" + src + ")",
    crosstab3: "select * from " + ns + ".crosstab3(" + src + ")",
    crosstab4: "select * from " + ns + ".crosstab4(" + src + ")",
    connectby5: "select * from " + ns + ".connectby(" + cb + ", 'row1', 0) as t(keyid text, parent_keyid text, level int4)",
    connectby6: "select * from " + ns + ".connectby(" + cb + ", 'row1', 0, '~') as t(keyid text, parent_keyid text, level int4, branch text)",
    connectbySerial6: "select * from " + ns + ".connectby(" + cb + ", 'pos', 'row1', 0) as t(keyid text, parent_keyid text, level int4, pos int4)",
    connectbySerial7: "select * from " + ns + ".connectby(" + cb + ", 'pos', 'row1', 0, '~') as t(keyid text, parent_keyid text, level int4, branch text, pos int4)",
    normalRand: "select * from " + ns + ".normal_rand(4, -1.5, 0) as s(value)",
  };
  const run = bindRpcDatabaseProcedure(
    procedure.use(createDatabaseMiddleware(relations, "read", schema)).input(v.picklist(Object.keys(helpers))).output(v.unknown()).handler(async ({ context, input }) => {
      const rows = helpers[input]();
      return context.db.select(rows.columns).from(rows.from);
    }),
    { connection, replay: { metadataNamespace: "loom_unused", deployment: "packed-tablefunc" }, authorize: async () => {} },
  );
  for (const name of Object.keys(helpers)) {
    const invocation = { requestId: "packed-tablefunc-" + name, identity: null, signal: new AbortController().signal };
    const actual = await call(run, name, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } });
    const native = (await client.query(natives[name])).rows;
    assert(native.length > 0, name);
    assert.deepEqual(actual, native, name);
  }
  for (const width of [2, 3, 4]) {
    const codec = api.codecs["crosstab" + width];
    const array = api.codecs["crosstab" + width + "Array"];
    const type = ns + ".tablefunc_crosstab_" + width;
    const value = Object.fromEntries([["row_name", 'a,b "q"'], ...Array.from({ length: width }, (_, index) => ["category_" + (index + 1), index ? "v\\" + index : null])]);
    const encoded = codec.encode(value);
    assert.deepEqual(codec.decode((await client.query("select $1::" + type + "::text value", [encoded])).rows[0].value), value);
    assert.deepEqual((await client.query("select ($1::" + type + ").*", [encoded])).rows[0], value);
    const input = { dimensions: [{ lowerBound: 1, length: 2 }], values: [value, null] };
    const arrayText = (await client.query("select $1::" + type + "[]::text value", [array.encode(input)])).rows[0].value;
    assert.equal(arrayText, (await client.query("select array[$1::" + type + ", null]::text value", [encoded])).rows[0].value);
    assert.deepEqual(array.decode(arrayText), input);
    assert.equal(api.sql.types["type:$extension:tablefunc._tablefunc_crosstab_" + width], array);
  }
} finally { try { await connection?.close(); } finally { await client.end(); } }
console.log("packed tablefunc 20-member native, quoted placement and managed SQL-text contracts passed");
`,
      );
      // Bundle the complete application graph: adapters and the database share invocation-local SQL state.
      await writeFile(
        join(root, "compile-native.mjs"),
        `import assert from "node:assert/strict";
import { build } from "esbuild";
const external = ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])};
const result = await build({ entryPoints: ["project-native.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "project-native-bundle.mjs", metafile: true, external });
const inputs = Object.keys(result.metafile.inputs);
assert(inputs.some(path => path.endsWith("/adapters/tablefunc.js")));
assert(!inputs.some(path => path.includes("/tooling/")));
assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/tablefunc.js")));
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
      assert.equal(await consumerLockfileSha256(root), lockfileSha256);
      const nodeVersion = (await run(["node", "--version"])).trim();
      assert.match(nodeVersion, /^v24\.\d+\.\d+$/);
      const proofOutput = process.env.LOOM_EXTENSION_PROOF_PACKED_OUTPUT;
      if (proofOutput)
        await writeFile(
          join(proofOutput, "consumer.json"),
          JSON.stringify({
            runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
            nodeVersion,
            installation: "isolated",
            frozenReinstallPassed: true,
            declarationsPassed: true,
            runtimePassed: true,
            selectedBundleChecksPassed: true,
            tarballSha256: packedSha256,
          }) + "\n",
          { mode: 0o600 },
        );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
