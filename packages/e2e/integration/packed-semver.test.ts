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
import { semverConsumerProofCase } from "../fixtures/semver-proof-cases";

const descriptor = {
  name: "semver",
  version: "0.40.0",
  schema: 'custom"semver',
  apiSupport: {
    status: "verified",
    digest: "5a21997dcf96a0af38e49bc1d9309905050a05f18e6afe15f37fb2a63722a86e",
  },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  semverConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-semver-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_SEMVER_DATABASE_URL = databaseUrl;
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
        selected: { semver: { version: "0.40.0", schema: descriptor.schema } },
        future: { semver: { version: "0.41.0", schema: descriptor.schema } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createSemver_0_40_0, semver } from "kello/extensions/semver";
const api = createSemver_0_40_0(${JSON.stringify(descriptor)});
assert.equal(Object.keys(api.sql.overloads).length, 47);
assert.equal(Object.keys(api.sql.casts).length, 9);
assert.equal(semver("1.2.3-rc.1+b"), "1.2.3-rc.1+b");
assert.throws(() => semver("1.2"), /canonical semver/);
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }]) assert.throws(() => createSemver_0_40_0({ ...api, apiSupport: support }), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import type { SQL } from "drizzle-orm";
import type { PostgreSqlArray, SemverMultirange, SemverRange, SemverText } from "kello/extensions/semver";
import { connectDatabase, createProjectProcedures, defineSchema } from "kello/server";
import { withSemverSession } from "kello/tooling/extensions/semver";
import { defineRelations } from "drizzle-orm";
import { extensions as custom } from "./selected";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
const api = custom.semver;
const placement: 'custom"semver' = api.schema;
const version: "0.40.0" = api.version;
const sent: SQL<{ readonly hex: string } | null> = api.sql.functions.semver_send("1.2.3+b");
// @ts-expect-error Native binary send preserves SQL NULL.
const requiredSent: SQL<{ readonly hex: string }> = sent;
void [sent, requiredSent];
const parsed: SQL<string | null> = api.parse("1.2.3");
const less: SQL<boolean | null> = api.lessThan(parsed, "2.0.0");
const major: SQL<number | null> = api.major(parsed);
const range: SQL<SemverRange> = api.range("1.0.0", null, "[]");
const merged: SQL<SemverMultirange | null> = api.multirange(range, api.range("2.0.0", "3.0.0"));
const empties: SQL<SemverMultirange> = api.multirange();
const overload: SQL<string | null> = api.sql.functions.semver.int8(1n);
const cast: SQL<string | null> = api.sql.casts.semver_to_text(parsed);
const missing: undefined = absent;
const noSelection: undefined = empty;
// @ts-expect-error SQL NULL remains part of strict routine results.
const required: SQL<string> = parsed;
// @ts-expect-error Range flags are the four PostgreSQL literals.
api.range("1.0.0", "2.0.0", "[x");
// @ts-expect-error int8 overloads take bigint values.
api.fromInt8(1);
// @ts-expect-error Fixed result decoders do not accept caller return casts.
api.parse<number>("1.0.0");
// @ts-expect-error Unselected families remain absent.
void custom.unaccent;
// @ts-expect-error Future versions expose descriptors only.
void future.semver.parse;
void [placement, version, parsed, less, major, range, merged, empties, overload, cast, missing, noSelection, required];
const schema = defineSchema(() => ({ releases: { version: api.field().notNull(), history: api.arrayField(), supported: api.rangeField(), windows: api.rangeArrayField(), compatible: api.multirangeField(), matrix: api.multirangeArrayField() } }), { namespace: "packed_app" });
const relations = defineRelations(schema.tables);
const { procedure } = createProjectProcedures(schema, relations, custom);
procedure.handler(async ({ context }) => {
  // Procedures carry no database capability; accepted native fixtures query through a connection boundary.
  const connection = await connectDatabase({ schema, relations, connectionString: "postgres://compile-only" });
  const selected: typeof api = context.extensions.semver;
  const releases = schema.tables.releases;
  const [row] = await connection.transaction((db) => db.select({ version: releases.version, history: releases.history, supported: releases.supported, windows: releases.windows, compatible: releases.compatible, matrix: releases.matrix, major: selected.major(releases.version) }).from(releases));
  if (!row) return;
  const value: SemverText = row.version;
  const history: PostgreSqlArray<SemverText | null> | null = row.history;
  const supported: SemverRange | null = row.supported;
  const windows: PostgreSqlArray<SemverRange | null> | null = row.windows;
  const compatible: SemverMultirange | null = row.compatible;
  const matrix: PostgreSqlArray<SemverMultirange | null> | null = row.matrix;
  const rowMajor: number | null = row.major;
  // @ts-expect-error A NOT NULL semver field decodes to canonical text, never a number.
  const wrong: number = row.version;
  // @ts-expect-error Nullable range fields keep SQL NULL in their decoded type.
  const present: SemverRange = row.supported;
  void [value, history, supported, windows, compatible, matrix, rowMajor, wrong, present];
});
async function operator(url: string) {
  const result = await withSemverSession(url, custom.semver, async (session) => {
    const routine: SemverText | null = await session.semver.int8(3n);
    const cast: SemverText | null = await session.casts.numeric_to_semver("1.5");
    // @ts-expect-error int8 conversions take bigint values.
    await session.semver.int8(3);
    return [routine, cast, await session.searchPath()] as const;
  });
  const scope: "transaction" = result.searchPath.scope;
  void scope;
}
void operator;
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
const entry = await realpath(fileURLToPath(import.meta.resolve("kello/extensions/semver")));
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
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/semver.js") && !path.endsWith("/semver-codecs.js")));
  const selected = name === "runtime";
  assert.equal(inputs.some(path => path.endsWith("/adapters/semver.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (selected) { assert.deepEqual(Object.keys(extensions), ["semver"]); assert.equal(Object.keys(extensions.semver.sql.overloads).length, 47); }
  else if (name === "future") { assert.equal(extensions.semver.apiSupport.status, "unverified"); assert.equal(extensions.semver.parse, undefined); }
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
const url = process.env.LOOM_PACKED_SEMVER_DATABASE_URL;
assert(url);
const api = extensions.semver;
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const client = new pg.Client({ connectionString: url });
await client.connect();
const schema = defineSchema(s => ({ writes: { value: s.text().notNull() }, releases: { version: api.field().notNull(), supported: api.rangeField() } }), { namespace: "packed_app" });
const relations = defineRelations(schema.tables);
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA " + quote(api.schema) + '; CREATE EXTENSION semver WITH SCHEMA ' + quote(api.schema) + " VERSION '0.40.0'; CREATE SCHEMA packed_app; CREATE TABLE packed_app.writes(\"_id\" uuid PRIMARY KEY DEFAULT uuidv7(), \"_createdAt\" bigint NOT NULL DEFAULT 1, value text NOT NULL); CREATE TABLE packed_app.releases(\"_id\" uuid PRIMARY KEY DEFAULT uuidv7(), \"_createdAt\" bigint NOT NULL DEFAULT 1, version " + quote(api.schema) + ".semver NOT NULL, supported " + quote(api.schema) + ".semverrange)");
  connection = await connectDatabase({ schema, relations, connectionString: url });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, relations, extensions);
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    const api = binding.semver;
    return connection.transaction(async db => {
      await db.insert(schema.tables.releases).values([{ version: "2.0.0", supported: api.range("1.0.0", null) }, { version: "1.0.0-rc.1+b", supported: null }]);
      return db.select({
        parsed: api.parse("1.2.3+b"), coerced: api.coerce("1.2"), valid: api.isValid("1.2"), major: api.major("3.2.1"), prerelease: api.prerelease("1.0.0-rc.1"),
        equal: api.equal("1.0.0+a", "1.0.0+b"), less: api.lessThan("1.0.0-rc.1", "1.0.0"), compare: api.compare("2.0.0", "10.0.0"),
        range: api.range(null, "2.0.0", "(]"),
        merged: api.multirange(api.range("3.0.0", "4.0.0"), api.range("1.0.0", "3.0.0")), empty: api.multirange(),
        nullParsed: api.parse(null), nullMajor: api.major(null),
        version: schema.tables.releases.version, supported: schema.tables.releases.supported,
      }).from(schema.tables.releases).orderBy(schema.tables.releases.version);
    });
  });
  const invocation = { requestId: "packed-semver", identity: null, signal: new AbortController().signal };
  const rows = await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } });
  assert.deepEqual(deserializeRpcValue(serializeRpcValue(rows)), rows);
  assert.deepEqual(rows.map(row => [row.version, row.supported]), [["1.0.0-rc.1+b", null], ["2.0.0", { empty: false, lower: "1.0.0", upper: null, lowerInclusive: true, upperInclusive: false }]]);
  const [row] = rows;
  assert.equal(row.parsed, "1.2.3+b"); assert.equal(row.coerced, "1.2.0"); assert.equal(row.valid, false); assert.equal(row.major, 3); assert.equal(row.prerelease, "rc.1");
  assert.equal(row.equal, true); assert.equal(row.less, true); assert.equal(row.compare, -1);
  assert.deepEqual(row.range, { empty: false, lower: null, upper: "2.0.0", lowerInclusive: false, upperInclusive: true });
  assert.deepEqual(row.merged, [{ empty: false, lower: "1.0.0", upper: "4.0.0", lowerInclusive: true, upperInclusive: false }]);
  assert.deepEqual(row.empty, []); assert.equal(row.nullParsed, null); assert.equal(row.nullMajor, null);
  // The numeric constructors and casts are SQL wrappers over unqualified to_semver: ordinary queries cannot reach them.
  for (const numeric of [api.fromInt8(3n), api.sql.casts.numeric_to_semver("1.5")])
    await assert.rejects(connection.db.select({ value: numeric }).from(sql.raw("(values(1)) fixture(id)")), error => error instanceof Error && error.cause?.code === "42883");
  let decoderReached = false;
  await assert.rejects(connection.transaction(async db => {
    await db.insert(schema.tables.writes).values({ value: "must roll back" });
    await db.select({ invalid: api.parse("1.0.0").mapWith(() => { decoderReached = true; throw new Error("decode failure") }) }).from(sql.raw("(values(1)) fixture(id)"));
  }),/decode failure/);
  assert.equal(decoderReached, true, "Insert must succeed before exercising decoder rollback");
  assert.deepEqual((await client.query("SELECT value FROM packed_app.writes")).rows,[]);
  await assert.rejects(connection.db.select({ invalid: api.parse("1.2") }).from(sql.raw("(values(1)) fixture(id)")));
} finally { try { await connection?.close(); } finally { await client.end(); } }
console.log("packed native semver RPC/Effect, range wire, ordinary numeric rejection, NULL and rollback contracts passed");
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
assert(inputs.some(path => path.endsWith("/adapters/semver.js")));
assert(!inputs.some(path => path.includes("/tooling/")));
assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/semver.js") && !path.endsWith("/semver-codecs.js")));
`,
      );
      await run(["node", "compile-native.mjs"]);
      await writeFile(
        join(root, "operator-native.mjs"),
        String.raw`import assert from "node:assert/strict";
import { withSemverSession } from "kello/tooling/extensions/semver";
import { extensions } from "./selected.ts";
const url = process.env.LOOM_PACKED_SEMVER_DATABASE_URL;
assert(url);
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const result = await withSemverSession(url, extensions.semver, async session => [
  await session.searchPath(),
  await session.semver.int2(1), await session.semver.int4(-1), await session.semver.int8(3n),
  await session.semver.float4(1.5), await session.semver.float8(1.25), await session.semver.numeric("1.234"),
  await session.casts.int2_to_semver(1), await session.casts.int4_to_semver(-1), await session.casts.int8_to_semver(3n),
  await session.casts.float4_to_semver(1.5), await session.casts.float8_to_semver(1.25), await session.casts.numeric_to_semver("1.234"),
  await session.semver.numeric(null),
]);
const path = quote(extensions.semver.schema) + ", pg_catalog";
assert.deepEqual(result.value, [path, "1.0.0", "0.0.0-1", "3.0.0", "1.5.0", "1.25.0", "1.234.0", "1.0.0", "0.0.0-1", "3.0.0", "1.5.0", "1.25.0", "1.234.0", null]);
assert.deepEqual(result.searchPath, { scope: "transaction", before: result.searchPath.before, during: path, after: result.searchPath.before });
assert.notEqual(result.searchPath.before, path);
console.log("packed semver operator session numeric constructors and casts passed");
`,
      );
      await withExtensionDatabase(async (url) => {
        await run(["node", "project-native-bundle.mjs"], root, url);
        await run(["node", "operator-native.mjs"], root, url);
      });
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), packedSha256);
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      await recordPackedConsumerObservation(root);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
