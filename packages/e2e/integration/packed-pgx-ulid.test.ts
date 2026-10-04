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
import { pgxUlidConsumerProofCase } from "../fixtures/pgx-ulid-proof-cases";
import { runPgxUlidGeneratedRuntime } from "../fixtures/pgx-ulid-generated-runtime";

const descriptor = {
  name: "pgx_ulid",
  version: "0.2.2",
  schema: 'custom"ulid',
  apiSupport: {
    status: "verified",
    digest: "e2e491782b819b700106736a81ffa9922f24226e1d18ec02ce90931dcef0a60d",
  },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  pgxUlidConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-pgx-ulid-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_PGX_ULID_DATABASE_URL = databaseUrl;
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
        selected: { pgx_ulid: { version: "0.2.2", schema: descriptor.schema } },
        future: { pgx_ulid: { version: "0.2.1", schema: descriptor.schema } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(
        join(root, "imports.mjs"),
        `import assert from "node:assert/strict";
import { createPgxUlid_0_2_2, ulid } from "kello/extensions/pgx-ulid";
const api = createPgxUlid_0_2_2(${JSON.stringify(descriptor)});
assert.equal(Object.keys(api.sql.functions).length, 18);
assert.equal(Object.keys(api.sql.overloads).length, 31);
assert.equal(ulid("01gv5pa9eqg7d82q3y4pkbzsyv"), "01GV5PA9EQG7D82Q3Y4PKBZSYV");
assert.throws(() => ulid("8ZZZZZZZZZZZZZZZZZZZZZZZZZ"));
for (const support of [{ status: "unverified" }, { status: "verified" }, { status: "verified", digest: "wrong" }]) assert.throws(() => createPgxUlid_0_2_2({ ...api, apiSupport: support }), /exact verified contract/);
`,
      );
      await writeFile(
        join(root, "probe.ts"),
        `import type { SQL } from "drizzle-orm";
import { timestamp, timestamptz, type Timestamp, type Timestamptz } from "kello/extensions/timestamps";
import { ulid, type Ulid } from "kello/extensions/pgx-ulid";
import { extensions as custom } from "./selected";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
const api = custom.pgx_ulid;
const placement: 'custom"ulid' = api.schema;
const version: "0.2.2" = api.version;
const generated: SQL<Ulid> = api.generate();
const monotonic: SQL<Ulid> = api.generateMonotonic();
const civil: SQL<Ulid | null> = api.fromTimestamp(timestamp("2023-03-10 12:00:49.111"));
const instant: SQL<Ulid | null> = api.fromTimestamptz(timestamptz("2023-03-10 12:00:49.111Z"));
const decodedCivil: SQL<Timestamp | null> = api.toTimestamp(generated);
const decodedInstant: SQL<Timestamptz | null> = api.toTimestamptz(ulid("01GV5PA9EQG7D82Q3Y4PKBZSYV"));
const uuid: SQL<string | null> = api.toUuid(monotonic);
const missing: undefined = absent;
const noSelection: undefined = empty;
// @ts-expect-error SQL NULL remains part of strict conversions.
const required: SQL<Ulid> = civil;
// @ts-expect-error Civil and instant input identities are distinct.
api.fromTimestamp(timestamptz("1970-01-01 00:00:00Z"));
// @ts-expect-error Date loses native precision and identity.
api.fromTimestamp(new Date());
// @ts-expect-error Query outputs have fixed native decoders.
api.toTimestamp<Date>(generated);
// @ts-expect-error Plain strings are not branded ULIDs.
const plain: Ulid = "01GV5PA9EQG7D82Q3Y4PKBZSYV";
// @ts-expect-error Underscore key has no dashed alias.
void custom["pgx-ulid"];
// @ts-expect-error Unselected families remain absent.
void custom.pg_uuidv7;
// @ts-expect-error Unsupported versions expose descriptors only.
void future.pgx_ulid.generate;
void [placement, version, generated, civil, instant, decodedCivil, decodedInstant, uuid, missing, noSelection, required, plain];
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
const entry = await realpath(fileURLToPath(import.meta.resolve("kello/extensions/pgx-ulid")));
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
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/pgx-ulid.js") && !path.endsWith("/pgx-ulid-codecs.js")));
  const selected = name === "runtime";
  assert.equal(inputs.some(path => path.endsWith("/adapters/pgx-ulid.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (selected) { assert.deepEqual(Object.keys(extensions), ["pgx_ulid"]); assert.equal(Object.keys(extensions.pgx_ulid.sql.functions).length, 18); }
  else if (name === "future") { assert.equal(extensions.pgx_ulid.apiSupport.status, "unverified"); assert.equal(extensions.pgx_ulid.generate, undefined); }
  else assert.equal(extensions, undefined);
}
for (const name of ["runtime", "future", "absent", "empty"]) await bundle(name);
`.replace("EXTERNALS", JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])),
      );
      await run(["node", "verify.mjs"]);
      await copyFile(
        new URL("../fixtures/pgx-ulid-generated-project.ts", import.meta.url),
        join(root, "project-writer.ts"),
      );
      await writeFile(
        join(root, "generate-public.mjs"),
        `import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { writePgxUlidRpc } from "./project-writer.ts";
const project = join(process.cwd(), "project");
await initializeProject(project, "packedulid");
await writeFile(join(project,"kello.config.ts"), ${JSON.stringify('import { defineConfig } from "kello/tooling"; export default defineConfig({database:{extensions:{pgx_ulid:{version:"0.2.2",schema:')} + ${JSON.stringify(JSON.stringify(descriptor.schema))} + '}}}});');
await writeFile(join(project,"kello/schema.ts"), 'import { defineSchema, defineTable } from "kello/server"; import { extensions } from "./_generated/extensions"; const api = extensions.pgx_ulid; export default defineSchema(f=>({tasks:defineTable({title:f.text().notNull(),key:api.field(),keys:api.arrayField()},{indexes:[{fields:["key"],extension:api.indexes.btree()}]})}),{namespace:"app"});');
await writePgxUlidRpc(project);
await assert.rejects(readFile(join(project,"kello/_generated/extensions.ts")),{code:"ENOENT"});
await loadProject(project);
const generated=await generateProject(project);
assert.equal((await generateProject(project)).version,generated.version);
await writeFile(join(project,"generation.json"),JSON.stringify({version:generated.version}));
`,
      );
      await run(["bun", "generate-public.mjs"]);
      await run([join(root, "node_modules/.bin/tsc"), "-p", "project/tsconfig.json"]);
      await writeFile(
        join(root, "project-native.mjs"),
        String.raw`import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { connectDatabase, createProjectProcedures, createProjectServices, defineSchema, Invocation } from "kello/server";
import { timestamp, timestamptz } from "kello/extensions/timestamps";
import { ulid } from "kello/extensions/pgx-ulid";
import { extensions } from "./selected.ts";
const url = process.env.LOOM_PACKED_PGX_ULID_DATABASE_URL;
assert(url);
const api = extensions.pgx_ulid;
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const client = new pg.Client({ connectionString: url });
await client.connect();
const schema = defineSchema(s => ({ writes: { value: s.text().notNull() } }), { namespace: "packed_app" });
const relations = defineRelations(schema.tables);
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA " + quote(api.schema) + '; CREATE EXTENSION pgx_ulid WITH SCHEMA ' + quote(api.schema) + " VERSION '0.2.2'; CREATE SCHEMA packed_app; CREATE TABLE packed_app.writes(\"_id\" uuid PRIMARY KEY DEFAULT uuidv7(), \"_createdAt\" bigint NOT NULL DEFAULT 1, value text NOT NULL)");
  connection = await connectDatabase({ schema, relations, connectionString: url });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, relations, extensions);
  const fixed = "01GV5PA9EQG7D82Q3Y4PKBZSYV";
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    const api = binding.pgx_ulid;
    return connection.transaction(async db => {
      await db.execute(sql.raw("select set_config('TimeZone','UTC',true),set_config('DateStyle','ISO,YMD',true)"));
      return db.select({
        generated: api.generate(),
        civil: api.fromTimestamp(timestamp("2023-03-10 12:00:49.111")),
        instant: api.fromTimestamptz(timestamptz("2023-03-10 17:45:49.111+05:45")),
        decodedCivil: api.toTimestamp(fixed), decodedInstant: api.toTimestamptz(fixed),
        uuid: api.toUuid(fixed.toLowerCase()), fromUuid: api.fromUuid("0186cb65-25d7-81da-815c-7e25a6bfe7db"),
        bytes: api.toBytes(fixed), ordered: api.lessThan(fixed, "7ZZZZZZZZZZZZZZZZZZZZZZZZZ"),
        nullCivil: api.fromTimestamp(null), nullUuid: api.toUuid(null),
      }).from(sql.raw("(values(1)) fixture(id)"));
    });
  });
  const invocation = { requestId: "packed-ulid", identity: null, signal: new AbortController().signal };
  const [row] = await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } });
  assert.equal(row.civil, "01GV5PA9EQ0000000000000000"); assert.equal(row.instant, "01GV5PA9EQ0000000000000000");
  assert.deepEqual(row.decodedCivil, {type:"timestamp",text:"2023-03-10 12:00:49.111000"});
  assert.deepEqual(row.decodedInstant, {type:"timestamptz",text:"2023-03-10 12:00:49.111000+00"});
  assert.equal(row.uuid, "0186cb65-25d7-81da-815c-7e25a6bfe7db"); assert.equal(row.fromUuid, fixed);
  assert.deepEqual(row.bytes, { hex: "0186cb6525d781da815c7e25a6bfe7db" }); assert.equal(row.ordered, true);
  for (const key of ["nullCivil","nullUuid"]) assert.equal(row[key],null);
  assert.match(row.generated,/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/);
  let decoderReached = false;
  await assert.rejects(connection.transaction(async db => {
    await db.insert(schema.tables.writes).values({ value: "must roll back" });
    await db.select({ invalid: api.toUuid(fixed).mapWith(() => { decoderReached = true; return ulid("invalid") }) }).from(sql.raw("(values(1)) fixture(id)"));
  }));
  assert.equal(decoderReached, true, "Insert must succeed before exercising decoder rollback");
  assert.deepEqual((await client.query("SELECT value FROM packed_app.writes")).rows,[]);
  assert.equal((await connection.db.select({ ok: api.fromUuid("0186cb65-25d7-81da-815c-7e25a6bfe7db") }).from(sql.raw("(values(1)) fixture(id)")))[0].ok,fixed);
} finally { try { await connection?.close(); } finally { await client.end(); } }
console.log("packed native pgx_ulid RPC/Effect, ULID/UUID/temporal identity, NULL and rollback contracts passed");
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
assert(inputs.some(path => path.endsWith("/adapters/pgx-ulid.js")));
assert(!inputs.some(path => path.includes("/tooling/")));
assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/pgx-ulid.js") && !path.endsWith("/pgx-ulid-codecs.js")));
`,
      );
      await run(["node", "compile-native.mjs"]);
      await withExtensionDatabase(async (url) => {
        await run(["node", "project-native-bundle.mjs"], root, url);
        const generation = JSON.parse(await readFile(join(root, "project/generation.json"), "utf8"));
        await runPgxUlidGeneratedRuntime(join(root, "project"), generation.version, descriptor.schema, url);
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
