import { recordPackedConsumerObservation } from "../fixtures/packed-consumer-observation";
import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isnGeneratedSchema, isnGeneratedTypeProof } from "../fixtures/isn-generated-project";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest } from "../fixtures/extension-proof";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
} from "../fixtures/proof-artifact";
import { isnConsumerProofCase } from "../fixtures/isn-proof-cases";

const descriptor = {
  name: "isn",
  version: "1.3",
  schema: 'Isn"日本',
  apiSupport: {
    status: "verified",
    digest: "570342dc61cc815ae91896f43c59a79150643b22f540681e6c82d89db6a5e9be",
  },
} as const;

// Explicit, test-only path supplied by the proof host. The host owns its existence, its hashing and what it means; this
// body only copies the exact pack output there, exclusively, before anything is installed from it.
const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  isnConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-isn-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_ISN_DATABASE_URL = databaseUrl;
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
      for (const file of [
        "dist/core/extensions/adapters/isn.js",
        "dist/core/extensions/adapters/isn.d.ts",
        "dist/tooling/extensions/operations/isn.js",
      ])
        assert(
          (await readFile(join(source, file))).length > 0,
          "Parent must build public ISN exports before packed proof",
        );
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
        selected: { isn: { version: "1.3", schema: descriptor.schema } },
        future: { isn: { version: "future", schema: descriptor.schema } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(
        join(root, "consumer.ts"),
        await readFile(fileURLToPath(new URL("../fixtures/isn-consumer.ts.fixture", import.meta.url)), "utf8"),
      );
      await writeFile(join(root, "schema.ts"), isnGeneratedSchema.replace('"./_generated/extensions"', '"./selected"'));
      await writeFile(
        join(root, "probe.ts"),
        isnGeneratedTypeProof.replace('"./_generated/extensions"', '"./selected"') +
          `
import { extensions as future } from "./future";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
const noSelection: undefined = absent;
const emptySelection: undefined = empty;
// @ts-expect-error Unknown versions expose only a descriptor.
future.isn.sql;
void [noSelection, emptySelection];
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
      await run([join(root, "node_modules/.bin/tsc"), "-p", "tsconfig.json"]);
      await writeFile(join(root, "runtime.ts"), 'export { extensions } from "./selected";');
      await writeFile(
        join(root, "verify.mjs"),
        String.raw`
import assert from "node:assert/strict";
import { realpath, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
const root = await realpath("node_modules/kello");
for (const exported of ["kello/extensions/isn", "kello/tooling/extensions/isn"])
  assert((await realpath(fileURLToPath(import.meta.resolve(exported)))).startsWith(root + "/dist/"));
for (const name of ["runtime", "future", "absent", "empty"]) {
  const result = await build({ entryPoints: [name + ".ts"], bundle: true, platform: "node", format: "esm", target: "node24", write: false, metafile: true, external: EXTERNALS });
  const inputs = Object.keys(result.metafile.inputs);
  assert(!inputs.some(path => path.includes("/tooling/")));
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/isn.js") && !path.endsWith("/isn-codecs.js")));
  assert.equal(inputs.some(path => path.endsWith("/adapters/isn.js")), name === "runtime");
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (name === "runtime") {
    assert.deepEqual(Object.keys(extensions), ["isn"]);
    assert.equal(Object.keys(extensions.isn.sql.overloads).length, 395);
    assert.equal(Object.keys(extensions.isn.sql.casts).length, 20);
    assert.equal(extensions.isn.sql.functions.isn_weak, undefined);
  } else if (name === "future") {
    assert.equal(extensions.isn.apiSupport.status, "unverified");
    assert.equal(extensions.isn.sql, undefined);
  } else assert.equal(extensions, undefined);
}
`.replace("EXTERNALS", JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])),
      );
      await run(["node", "verify.mjs"]);
      await writeFile(
        join(root, "project-native.mjs"),
        String.raw`
import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { connectDatabase, createProjectProcedures, createProjectServices, defineSchema, Invocation, serializeRpcValue, deserializeRpcValue } from "kello/server";
import { withIsnSession } from "kello/tooling/extensions/isn";
import { extensions } from "./selected.ts";
const url = process.env.LOOM_PACKED_ISN_DATABASE_URL;
assert(url);
const api = extensions.isn;
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const namespace = quote(api.schema);
const client = new pg.Client({ connectionString: url });
await client.connect();
const schema = defineSchema(s => ({ writes: { value: s.text().notNull() }, books: { isbn: api.isbn.field().notNull(), editions: api.isbn.arrayField() } }), { namespace: "packed_app" });
const relations = defineRelations(schema.tables);
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  await client.query("CREATE SCHEMA " + namespace + '; CREATE EXTENSION isn WITH SCHEMA ' + namespace + " VERSION '1.3'; CREATE SCHEMA packed_app; CREATE TABLE packed_app.writes(\"_id\" uuid PRIMARY KEY DEFAULT uuidv7(), \"_createdAt\" bigint NOT NULL DEFAULT 1, value text NOT NULL); CREATE TABLE packed_app.books(\"_id\" uuid PRIMARY KEY DEFAULT uuidv7(), \"_createdAt\" bigint NOT NULL DEFAULT 1, isbn " + namespace + ".isbn NOT NULL, editions " + namespace + ".isbn[])");
  connection = await connectDatabase({ schema, relations, connectionString: url });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, relations, extensions);
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    const api = binding.isn;
    return connection.transaction(async db => {
      const value = api.isbn.value("978012345678?");
      await db.insert(schema.tables.books).values({ isbn: value, editions: { dimensions: [{ lowerBound: -2, length: 2 }], values: [value, null] } });
      return db.select({
        isbn: schema.tables.books.isbn, editions: schema.tables.books.editions,
        valid: api.isbn.isValid(schema.tables.books.isbn),
        equal: api.sql.functions.isneq.isbn_isbn13(schema.tables.books.isbn, api.isbn13.value("9780123456786")),
        cast: api.sql.casts["cast:$extension:isn.isbn->$extension:isn.ean13"](schema.tables.books.isbn),
        nullValid: api.isbn.isValid(null),
      }).from(schema.tables.books);
    });
  });
  const invocation = { requestId: "packed-isn", identity: null, signal: new AbortController().signal };
  const rows = await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } });
  assert.deepEqual(deserializeRpcValue(serializeRpcValue(rows)), rows);
  assert.deepEqual(rows, [{ isbn: { kind: "isbn", text: "0-12-345678-9" }, editions: { dimensions: [{ lowerBound: -2, length: 2 }], values: [{ kind: "isbn", text: "0-12-345678-9" }, null] }, valid: true, equal: true, cast: { kind: "ean13", text: "978-0-12-345678-6" }, nullValid: null }]);
  const cases = [
    ["ean13", "9780123456786"], ["isbn", "9780123456786"], ["isbn13", "9780123456786"],
    ["ismn", "9790123456785"], ["ismn13", "9790123456785"], ["issn", "9771234567898"],
    ["issn13", "9771234567898"], ["upc", "123456789012"],
  ];
  let lease;
  await withIsnSession(url, api, async session => {
    lease = session;
    assert.equal(await session.weakStatus(), false);
    assert.equal(await session.setWeak(null), null);
    for (const [kind, input] of cases) {
      const native = (await client.query("SELECT $1::" + namespace + "." + quote(kind) + "::text AS value", [input])).rows[0].value;
      assert.deepEqual(await session[kind](input), { kind, text: native });
    }
    assert.equal(await session.setWeak(true), true);
    assert.deepEqual(await session.isbn("9780123456780"), { kind: "isbn", text: "0-12-345678-9!" });
  });
  await assert.rejects(lease.weakStatus());
  await withIsnSession(url, api, async session => assert.equal(await session.weakStatus(), false));
  await assert.rejects(withIsnSession(url, api, async session => {
    await session.setWeak(true);
    void session.isbn("invalid").catch(() => undefined);
  }), error => error.completion === "rolled-back");
  await withIsnSession(url, api, async session => assert.equal(await session.weakStatus(), false));
  let decoded = false;
  await assert.rejects(connection.transaction(async db => {
    await db.insert(schema.tables.writes).values({ value: "must roll back" });
    await db.select({ invalid: api.isbn.makeValid(api.isbn.value("9780123456786!")).mapWith(() => { decoded = true; throw new Error("decode failure"); }) }).from(sql.raw("(values(1)) fixture(id)"));
  }), /decode failure/);
  assert.equal(decoded, true);
  assert.deepEqual((await client.query("SELECT value FROM packed_app.writes")).rows, []);
} finally { try { await connection?.close(); } finally { await client.end(); } }
console.log("packed native ISN RPC/Effect, eight typed parsers, arrays, NULL, weak-mode isolation and rollback passed");
`,
      );
      await writeFile(
        join(root, "compile-native.mjs"),
        `import assert from "node:assert/strict";
import { build } from "esbuild";
const result = await build({ entryPoints: ["project-native.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "project-native-bundle.mjs", metafile: true, external: ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])} });
assert(Object.keys(result.metafile.inputs).some(path => path.endsWith("/adapters/isn.js")));
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
