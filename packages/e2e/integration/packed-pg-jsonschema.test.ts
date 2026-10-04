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
import { pgJsonschemaConsumerProofCase } from "../fixtures/pg-jsonschema-proof-cases";

const descriptor = {
  name: "pg_jsonschema",
  version: "0.3.4",
  schema: 'custom"json',
  apiSupport: {
    status: "verified",
    digest: "7a61cf1dd9bcb37e3704e5cb9c5cc92258815f6dddf6a869bd9c6434a66da138",
  },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  pgJsonschemaConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-pg-jsonschema-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_PG_JSONSCHEMA_DATABASE_URL = databaseUrl;
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
        selected: { pg_jsonschema: { version: "0.3.4", schema: descriptor.schema } },
        future: { pg_jsonschema: { version: "future", schema: descriptor.schema } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createPgJsonschema_0_3_4 } from "kello/extensions/pg-jsonschema";
const api = createPgJsonschema_0_3_4(${JSON.stringify(descriptor)});
assert.equal(Object.keys(api.sql.functions).length, 4);
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }]) assert.throws(() => createPgJsonschema_0_3_4({ ...api, apiSupport: support }), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import type { SQL } from "drizzle-orm";
import { jsonValue, jsonbValue, jsonDocument, jsonbDocument } from "kello/extensions/pg-jsonschema";
import { extensions as custom } from "./selected";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
const api = custom.pg_jsonschema;
const placement: 'custom"json' = api.schema;
const version: "0.3.4" = api.version;
const json: SQL<boolean | null> = api.jsonMatchesSchema(jsonValue({}), jsonDocument("1e9999"));
const jsonb: SQL<boolean | null> = api.jsonbMatchesSchema(jsonValue({}), jsonbValue(null));
const valid: SQL<boolean | null> = api.isValid(jsonValue({}));
const errors = api.validationErrors(null, jsonValue(null));
const nullJson: SQL<boolean | null> = api.sql.functions.json_matches_schema(null, null);
const missing: undefined = absent;
const noSelection: undefined = empty;
// @ts-expect-error SQL NULL remains part of strict routine results.
const required: SQL<boolean> = json;
// @ts-expect-error JSONB cannot supply a JSON instance.
api.jsonMatchesSchema(jsonValue({}), jsonbValue(null));
// @ts-expect-error JSON cannot supply a JSONB instance.
api.jsonbMatchesSchema(jsonValue({}), jsonValue(null));
// @ts-expect-error Schema input is JSON for both instance identities.
api.jsonbMatchesSchema(jsonbDocument("{}"), jsonbValue(null));
// @ts-expect-error Plain strings are not exact JSON documents.
api.isValid("{}");
// @ts-expect-error Fixed result decoders do not accept caller return casts.
api.isValid<string>(jsonValue({}));
// @ts-expect-error Underscore key has no dashed alias.
void custom["pg-jsonschema"];
// @ts-expect-error Unselected families remain absent.
void custom.unaccent;
// @ts-expect-error Future versions expose descriptors only.
void future.pg_jsonschema.isValid;
void [placement, version, json, jsonb, valid, errors, nullJson, missing, noSelection, required];
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
const entry = await realpath(fileURLToPath(import.meta.resolve("kello/extensions/pg-jsonschema")));
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
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/pg-jsonschema.js")));
  const selected = name === "runtime";
  assert.equal(inputs.some(path => path.endsWith("/adapters/pg-jsonschema.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (selected) { assert.deepEqual(Object.keys(extensions), ["pg_jsonschema"]); assert.equal(Object.keys(extensions.pg_jsonschema.sql.functions).length, 4); }
  else if (name === "future") { assert.equal(extensions.pg_jsonschema.apiSupport.status, "unverified"); assert.equal(extensions.pg_jsonschema.isValid, undefined); }
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
import { jsonValue, jsonbValue, jsonDocument } from "kello/extensions/pg-jsonschema";
import { extensions } from "./selected.ts";
const url = process.env.LOOM_PACKED_PG_JSONSCHEMA_DATABASE_URL;
assert(url);
const api = extensions.pg_jsonschema;
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const client = new pg.Client({ connectionString: url });
await client.connect();
const schema = defineSchema(s => ({ writes: { value: s.text().notNull() } }), { namespace: "packed_app" });
const relations = defineRelations(schema.tables);
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA " + quote(api.schema) + '; CREATE EXTENSION pg_jsonschema WITH SCHEMA ' + quote(api.schema) + " VERSION '0.3.4'; CREATE SCHEMA packed_app; CREATE TABLE packed_app.writes(\"_id\" uuid PRIMARY KEY DEFAULT uuidv7(), \"_createdAt\" bigint NOT NULL DEFAULT 1, value text NOT NULL)");
  connection = await connectDatabase({ schema, relations, connectionString: url });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, relations, extensions);
  const string = jsonValue({ type: "string", maxLength: 4 });
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    const api = binding.pg_jsonschema;
    return connection.transaction(db => db.select({
      json: api.jsonMatchesSchema(string,jsonValue("foo")), jsonb: api.jsonbMatchesSchema(string,jsonbValue("foo")),
      valid: api.isValid(string), errors: api.validationErrors(string,jsonValue("123456789")),
      jsonNull: api.jsonMatchesSchema(jsonValue({type:"null"}),jsonValue(null)),
      binaryNull: api.jsonbMatchesSchema(jsonValue({type:"null"}),jsonbValue(null)),
      nullJson: api.jsonMatchesSchema(null,jsonValue("foo")), nullBinary: api.jsonbMatchesSchema(string,null),
      nullValid: api.isValid(null), nullErrors: api.validationErrors(null,null),
      precise: api.jsonMatchesSchema(jsonDocument('{"const":9223372036854775807.123456789}'),jsonDocument("9223372036854775807.123456789")),
      distinct: api.jsonMatchesSchema(jsonDocument('{"const":9223372036854775807.123456789}'),jsonDocument("9223372036854775807.123456788")),
    }).from(sql.raw("(values(1)) fixture(id)")));
  });
  const invocation = { requestId: "packed-jsonschema", identity: null, signal: new AbortController().signal };
  const [row] = await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } });
  for (const key of ["json","jsonb","valid","jsonNull","binaryNull","precise"]) assert.equal(row[key],true);
  assert.equal(row.distinct,false);
  assert.deepEqual(row.errors,{dimensions:[{lowerBound:1,length:1}],values:['"123456789" is longer than 4 characters']});
  for (const key of ["nullJson","nullBinary","nullValid","nullErrors"]) assert.equal(row[key],null);
  let decoderReached = false;
  await assert.rejects(connection.transaction(async db => {
    await db.insert(schema.tables.writes).values({ value: "must roll back" });
    await db.select({ invalid: api.isValid(string).mapWith(() => { decoderReached = true; throw new Error("decode failure") }) }).from(sql.raw("(values(1)) fixture(id)"));
  }),/decode failure/);
  assert.equal(decoderReached, true, "Insert must succeed before exercising decoder rollback");
  assert.deepEqual((await client.query("SELECT value FROM packed_app.writes")).rows,[]);
  assert.equal((await connection.db.select({ok:api.isValid(string)}).from(sql.raw("(values(1)) fixture(id)")))[0].ok,true);
} finally { try { await connection?.close(); } finally { await client.end(); } }
console.log("packed native all-four RPC/Effect, JSON identity, NULL and rollback contracts passed");
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
assert(inputs.some(path => path.endsWith("/adapters/pg-jsonschema.js")));
assert(!inputs.some(path => path.includes("/tooling/")));
assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/pg-jsonschema.js")));
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
