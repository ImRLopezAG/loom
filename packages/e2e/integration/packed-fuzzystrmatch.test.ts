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
import { fuzzystrmatchConsumerProofCase } from "../fixtures/fuzzystrmatch-proof-cases";

const descriptor = {
  name: "fuzzystrmatch",
  version: "1.2",
  schema: 'custom"fuzzy',
  apiSupport: {
    status: "verified",
    digest: "0607e044d263e8999732df67f96cfb29479f6811db8b4df674acf3c9c9d16961",
  },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  fuzzystrmatchConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-fuzzystrmatch-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_FUZZYSTRMATCH_DATABASE_URL = databaseUrl;
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
        selected: { fuzzystrmatch: { version: "1.2", schema: descriptor.schema } },
        future: { fuzzystrmatch: { version: "future", schema: descriptor.schema } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createFuzzystrmatch_1_2 } from "kello/extensions/fuzzystrmatch";
const api = createFuzzystrmatch_1_2(${JSON.stringify(descriptor)});
assert.equal(Object.keys(api.sql.functions).length, 9);
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }]) assert.throws(() => createFuzzystrmatch_1_2({ ...api, apiSupport: support }), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import type { SQL } from "drizzle-orm";
type ArrayValues = readonly (string | null | ArrayValues)[];
type PostgreSqlArray = { readonly dimensions: readonly { readonly lowerBound: number; readonly length: number }[]; readonly values: ArrayValues };
import { extensions as custom } from "./selected";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
const api = custom.fuzzystrmatch;
const placement: 'custom"fuzzy' = api.schema;
const version: "1.2" = api.version;
const soundex: SQL<string | null> = api.soundex("Robert");
const alias: SQL<string | null> = api.sql.functions.text_soundex(null);
const score: SQL<number | null> = api.difference("Robert", "Rupert");
const codes: SQL<PostgreSqlArray | null> = api.daitchMokotoff("John");
const primary: SQL<string | null> = api.dmetaphone("Smith");
const alternate: SQL<string | null> = api.dmetaphoneAlt("Smith");
const metaphone: SQL<string | null> = api.metaphone("GUMBO", 4);
const distance: SQL<number | null> = api.levenshtein("a", "b");
const costs: SQL<number | null> = api.sql.functions.levenshtein("a", "b", 2, 3, 4);
const bounded: SQL<number | null> = api.levenshteinLessEqual("a", "b", 2);
const boundedCosts: SQL<number | null> = api.sql.functions.levenshtein_less_equal("a", "b", 2, 3, 4, 4);
const missing: undefined = absent;
const noSelection: undefined = empty;
// @ts-expect-error SQL NULL remains part of strict routine results.
const required: SQL<string> = soundex;
// @ts-expect-error Only captured two/five-argument distance overloads exist.
api.levenshtein("a", "b", 1);
// @ts-expect-error Only captured three/six-argument bounded overloads exist.
api.levenshteinLessEqual("a", "b", 1, 2);
// @ts-expect-error A text routine cannot bind a boolean value.
api.soundex(true);
// @ts-expect-error Costs are exact int4 numbers, not bigint.
api.metaphone("a", 1n);
// @ts-expect-error Fixed result decoders do not accept caller return casts.
api.soundex<number>("a");
// @ts-expect-error Unselected families remain absent.
void custom.unaccent;
// @ts-expect-error Future versions expose descriptors only.
void future.fuzzystrmatch.soundex;
void [placement, version, soundex, alias, score, codes, primary, alternate, metaphone, distance, costs, bounded, boundedCosts, missing, noSelection, required];
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
const entry = await realpath(fileURLToPath(import.meta.resolve("kello/extensions/fuzzystrmatch")));
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
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/fuzzystrmatch.js")));
  const selected = name === "runtime";
  assert.equal(inputs.some(path => path.endsWith("/adapters/fuzzystrmatch.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (selected) { assert.deepEqual(Object.keys(extensions), ["fuzzystrmatch"]); assert.equal(Object.keys(extensions.fuzzystrmatch.sql.functions).length, 9); }
  else if (name === "future") { assert.equal(extensions.fuzzystrmatch.apiSupport.status, "unverified"); assert.equal(extensions.fuzzystrmatch.soundex, undefined); }
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
const url = process.env.LOOM_PACKED_FUZZYSTRMATCH_DATABASE_URL;
assert(url);
const api = extensions.fuzzystrmatch;
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const client = new pg.Client({ connectionString: url });
await client.connect();
const schema = defineSchema(s => ({ writes: { value: s.text().notNull() } }), { namespace: "packed_app" });
const relations = defineRelations(schema.tables);
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA " + quote(api.schema) + '; CREATE EXTENSION fuzzystrmatch WITH SCHEMA ' + quote(api.schema) + " VERSION '1.2'; CREATE SCHEMA packed_app; CREATE TABLE packed_app.writes(\"_id\" uuid PRIMARY KEY DEFAULT uuidv7(), \"_createdAt\" bigint NOT NULL DEFAULT 1, value text NOT NULL)");
  connection = await connectDatabase({ schema, relations, connectionString: url });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, relations, extensions);
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    const api = binding.fuzzystrmatch;
    return connection.transaction(db => db.select({
      soundex: api.soundex("Robert"), alias: api.sql.functions.text_soundex("Rupert"), score: api.difference("Robert", "Rupert"),
      codes: api.daitchMokotoff("John"), metaphone: api.metaphone("GUMBO", 4), primary: api.dmetaphone("Smith"), alternate: api.dmetaphoneAlt("Smith"),
      distance: api.levenshtein("Robert", "Rupert"), costs: api.sql.functions.levenshtein("a", "", 2, 3, 4), bounded: api.levenshteinLessEqual("GUMBO", "GAMBOL", 2), boundedCosts: api.sql.functions.levenshtein_less_equal("a", "", 2, 3, 4, 4),
      nullSoundex: api.soundex(null), nullAlias: api.textSoundex(null), nullScore: api.difference(null, "a"), nullCodes: api.daitchMokotoff(null),
      nullMetaphone: api.metaphone("a", null), nullPrimary: api.dmetaphone(null), nullAlternate: api.dmetaphoneAlt(null),
      nullDistance: api.levenshtein(null, "a"), nullCosts: api.levenshtein("a", "b", null, 1, 1), nullBounded: api.levenshteinLessEqual("a", "b", null), nullBoundedCosts: api.levenshteinLessEqual("a", "b", 1, 1, null, 2),
      noCodes: api.daitchMokotoff(""), unicode: api.levenshtein("é", "e"),
    }).from(sql.raw("(values(1)) fixture(id)")));
  });
  const invocation = { requestId: "packed-fuzzystrmatch", identity: null, signal: new AbortController().signal };
  const rows = await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } });
  assert.deepEqual(deserializeRpcValue(serializeRpcValue(rows)), rows);
  const [row] = rows;
  for (const key of ["soundex", "alias"]) assert.equal(row[key], "R163");
  assert.equal(row.score, 4);
  assert.deepEqual(row.codes, {dimensions:[{lowerBound:1,length:2}],values:["160000","460000"]});
  assert.equal(row.metaphone,"KM"); assert.equal(row.primary,"SM0"); assert.equal(row.alternate,"XMT");
  assert.equal(row.distance,2); assert.equal(row.costs,3); assert.equal(row.bounded,2); assert.equal(row.boundedCosts,3); assert.equal(row.unicode,1);
  for (const key of Object.keys(row).filter(key => key.startsWith("null"))) assert.equal(row[key],null);
  assert.equal(row.noCodes,null);
  await assert.rejects(connection.transaction(db => db.select({invalid:api.levenshtein("é".repeat(256),"a")}).from(sql.raw("(values(1)) fixture(id)"))), error => error instanceof Error && error.cause instanceof Error && error.cause.message === "levenshtein argument exceeds maximum length of 255 characters");
  let decoderReached = false;
  await assert.rejects(connection.transaction(async db => {
    await db.insert(schema.tables.writes).values({ value: "must roll back" });
    await db.select({ invalid: api.soundex("Robert").mapWith(() => { decoderReached = true; throw new Error("decode failure") }) }).from(sql.raw("(values(1)) fixture(id)"));
  }),/decode failure/);
  assert.equal(decoderReached, true, "Insert must succeed before exercising decoder rollback");
  assert.deepEqual((await client.query("SELECT value FROM packed_app.writes")).rows,[]);
  assert.equal((await connection.db.select({ok:api.soundex("Robert")}).from(sql.raw("(values(1)) fixture(id)")))[0].ok,"R163");
} finally { try { await connection?.close(); } finally { await client.end(); } }
console.log("packed native eleven-signature RPC/Effect, array wire, NULL and rollback contracts passed");
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
assert(inputs.some(path => path.endsWith("/adapters/fuzzystrmatch.js")));
assert(!inputs.some(path => path.includes("/tooling/")));
assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/fuzzystrmatch.js")));
`,
      );
      await run(["node", "compile-native.mjs"]);
      await withExtensionDatabase((url) => run(["node", "project-native-bundle.mjs"], root, url));
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), packedSha256);
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
