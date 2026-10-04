import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { rdkitGeneratedSchema, rdkitGeneratedTypeProof } from "../fixtures/rdkit-generated-project";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { extensionProofTest } from "../fixtures/extension-proof";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
} from "../fixtures/proof-artifact";
import { rdkitConsumerProofCase } from "../fixtures/rdkit-proof-cases";
import { withRdkitDatabase } from "../fixtures/rdkit-database";

const descriptor = {
  name: "rdkit",
  version: "4.8.0",
  schema: 'Chem"日本',
  apiSupport: {
    status: "verified",
    digest: "2dcfe3dc27aa808bb3b7ef565a362e829974f39145889aecfb4e73a67c7a0952",
  },
} as const;

const retainedArtifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;

extensionProofTest(
  rdkitConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-rdkit-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_RDKIT_DATABASE_URL = databaseUrl;
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
      for (const file of ["dist/core/extensions/adapters/rdkit.js", "dist/core/extensions/adapters/rdkit.d.ts"])
        assert(
          (await readFile(join(source, file))).length > 0,
          "Parent must build public rdkit exports before packed proof",
        );
      await run(["bun", "pm", "pack", "--filename", join(root, "kello.tgz"), "--ignore-scripts"], source);
      const packedBytes = await readFile(join(root, "kello.tgz"));
      const packedSha256 = sha256(packedBytes);
      if (retainedArtifactPath !== undefined) {
        await copyFile(join(root, "kello.tgz"), retainedArtifactPath, constants.COPYFILE_EXCL);
        assert.equal(
          sha256(await readFile(retainedArtifactPath)),
          packedSha256,
          "Retained tarball bytes differ from the pack",
        );
      }
      await run([
        "node",
        "-e",
        "if (process.versions.node.split('.')[0] !== '24') throw new Error('Isolated consumer requires Node 24, not ' + process.version)",
      ]);
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
        selected: { rdkit: { version: "4.8.0", schema: descriptor.schema } },
        future: { rdkit: { version: "future", schema: descriptor.schema } },
        absent: undefined,
        empty: {},
      }))
        await writeFile(join(root, file + ".ts"), extensionBindingsSource(selection));
      await writeFile(
        join(root, "consumer.ts"),
        await readFile(fileURLToPath(new URL("../fixtures/rdkit-consumer.ts.fixture", import.meta.url)), "utf8"),
      );
      await writeFile(
        join(root, "schema.ts"),
        rdkitGeneratedSchema(descriptor.schema, "app").replace('"./_generated/extensions"', '"./selected"'),
      );
      await writeFile(
        join(root, "probe.ts"),
        rdkitGeneratedTypeProof.replace('"./_generated/extensions"', '"./selected"') +
          `
import { extensions as future } from "./future";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
const noSelection: undefined = absent;
const emptySelection: undefined = empty;
// @ts-expect-error Unknown versions expose only a descriptor.
future.rdkit.sql;
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
      await writeFile(
        join(root, "operator-types.ts"),
        `import { withRdkit } from "kello/tooling/extensions/rdkit";
import type { RdkitValue } from "kello/extensions/rdkit";
import { extensions } from "./selected";
function reactionSearch(url: string): Promise<{ readonly completion: "committed"; readonly value: readonly RdkitValue<"reaction">[] }> {
  return withRdkit(url, extensions.rdkit, session => session.hasReactionSubstructMatch("C>>C", "public.packed_reactions", "r"));
}
void reactionSearch;
`,
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
import { withRdkit } from "kello/tooling/extensions/rdkit";
const root = await realpath("node_modules/kello");
assert((await realpath(fileURLToPath(import.meta.resolve("kello/extensions/rdkit")))).startsWith(root + "/dist/"));
assert((await realpath(fileURLToPath(import.meta.resolve("kello/tooling/extensions/rdkit")))).startsWith(root + "/dist/"));
assert.equal(typeof withRdkit, "function");
for (const name of ["runtime", "future", "absent", "empty"]) {
  const result = await build({ entryPoints: [name + ".ts"], bundle: true, platform: "node", format: "esm", target: "node24", write: false, metafile: true, external: EXTERNALS });
  const inputs = Object.keys(result.metafile.inputs);
  assert(!inputs.some(path => path.includes("/tooling/")));
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !path.endsWith("/rdkit.js") && !path.endsWith("/rdkit-codecs.js")));
  assert.equal(inputs.some(path => path.endsWith("/adapters/rdkit.js")), name === "runtime");
  const text = result.outputFiles[0].text;
  assert(!/\bBun\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (name === "runtime") {
    assert.deepEqual(Object.keys(extensions), ["rdkit"]);
    assert.equal(Object.keys(extensions.rdkit.sql.overloads).length, 221);
    assert.deepEqual(extensions.rdkit.reactionSubstructMatch, { member: "routine:$extension:rdkit.has_reaction_substructmatch(pg_catalog.bpchar,pg_catalog.regclass,pg_catalog.text)", authority: "operator" });
    assert.equal(Object.keys(extensions.rdkit.sql.casts).length, 3);
  } else if (name === "future") {
    assert.equal(extensions.rdkit.apiSupport.status, "unverified");
    assert.equal(extensions.rdkit.sql, undefined);
  } else assert.equal(extensions, undefined);
}
`.replace("EXTERNALS", JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])),
      );
      await run(["node", "verify.mjs"]);
      await writeFile(
        join(root, "project-native.mjs"),
        String.raw`
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import pg from "pg";
import { defineRelations } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { connectDatabase, createProjectProcedures, createProjectServices, defineSchema, Invocation, serializeRpcValue, deserializeRpcValue } from "kello/server";
import { extensions } from "./selected.ts";
const url = process.env.LOOM_PACKED_RDKIT_DATABASE_URL;
assert(url);
const api = extensions.rdkit;
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const namespace = quote(api.schema);
const client = new pg.Client({ connectionString: url });
await client.connect();
const schema = defineSchema(s => ({
  writes: { value: s.text().notNull() },
  molecules: { structure: api.mol.field().notNull(), bits: api.bfp.field() },
}), { namespace: "packed_app" });
const relations = defineRelations(schema.tables);
const runtimeRole = "packed_rdkit_" + randomUUID().replaceAll("-", "");
let roleAttempted = false;
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000), 18);
  const installed = (await client.query("SELECT extversion FROM pg_extension WHERE extname='rdkit'")).rows[0]?.extversion;
  assert.equal(installed, "4.8.0", "Packed native rdkit requires exact provider 4.8.0, observed " + installed);
  await client.query("CREATE SCHEMA " + namespace + "; DROP EXTENSION rdkit; CREATE EXTENSION rdkit WITH SCHEMA " + namespace + " VERSION '4.8.0'");
  const roleOutput = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
  if (roleOutput) {
    assert(process.env.LOOM_EXTENSION_PROOF_RUN_ID);
    appendFileSync(roleOutput, JSON.stringify({ runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID, name: runtimeRole, sha256: createHash("sha256").update(runtimeRole).digest("hex") }) + "\n", { mode: 0o600 });
  }
  roleAttempted = true;
  const runtimePassword = randomUUID().replaceAll("-", "");
  await client.query("CREATE ROLE " + quote(runtimeRole) + " LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '" + runtimePassword + "'; GRANT USAGE ON SCHEMA " + namespace + " TO " + quote(runtimeRole));
  const runtimeAddress = new URL(url);
  runtimeAddress.username = runtimeRole;
  runtimeAddress.password = runtimePassword;
  const principal = new pg.Client({ connectionString: runtimeAddress.href });
  try {
    await principal.connect();
    assert.deepEqual((await principal.query("SELECT current_user AS name, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls FROM pg_roles WHERE rolname=current_user")).rows[0], { name: runtimeRole, rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: false, rolbypassrls: false });
  } finally { await principal.end(); }
  connection = await connectDatabase({ schema, relations, connectionString: runtimeAddress.href });
  const services = createProjectServices(schema);
  const { procedure } = createProjectProcedures(schema, relations, extensions);
  const handler = procedure.handler(async ({ context }) => {
    const binding = Effect.runSync(Effect.provide(services.Extensions, context["effect/context"]));
    assert.equal(binding, context.extensions);
    const api = binding.rdkit;
    return connection.transaction(async db => {
      const smiles = api.fromSmiles("CCO");
      const other = api.fromSmiles("CCN");
      return db.select({
        smiles,
        tanimoto: api.tanimotoSimilarity(api.morganBitFingerprint(smiles), api.morganBitFingerprint(other)),
        distance: api.tanimotoDistance(api.morganBitFingerprint(smiles), api.morganBitFingerprint(other)),
        sparse: api.tanimotoSimilaritySparse(api.morganFingerprint(smiles), api.morganFingerprint(other)),
        nullTanimoto: api.tanimotoSimilarity(null, api.morganBitFingerprint(smiles)),
      }).from(sqlFixture);
    });
  });
  const invocation = { requestId: "packed-rdkit", identity: null, signal: new AbortController().signal };
  const { sql: sqlFixture } = await import("drizzle-orm").then(mod => ({ sql: mod.sql.raw("(values (1)) fixture(id)") }));
  const rows = await call(handler, undefined, { context: { ...invocation, "effect/context": Context.make(Invocation, invocation) } });
  assert.deepEqual(deserializeRpcValue(serializeRpcValue(rows)), rows);
  assert.equal(rows[0].smiles.kind, "mol");
  assert.equal(typeof rows[0].tanimoto, "number");
  assert.equal(typeof rows[0].distance, "number");
  assert.equal(typeof rows[0].sparse, "number");
  assert.equal(rows[0].nullTanimoto, null);
  void namespace;
} finally {
  try { await connection?.close(); }
  finally {
    try {
      if (roleAttempted && (await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [runtimeRole])).rows.length) await client.query("GRANT " + quote(runtimeRole) + " TO CURRENT_USER; DROP OWNED BY " + quote(runtimeRole) + "; DROP ROLE " + quote(runtimeRole));
    } finally { await client.end(); }
  }
}
console.log("packed native rdkit RPC/Effect Tanimoto units and strict null passed");
`,
      );
      await writeFile(
        join(root, "compile-native.mjs"),
        `import assert from "node:assert/strict";
import { build } from "esbuild";
const result = await build({ entryPoints: ["project-native.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "project-native-bundle.mjs", metafile: true, external: ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])} });
assert(Object.keys(result.metafile.inputs).some(path => path.endsWith("/adapters/rdkit.js")));
`,
      );
      await run(["node", "compile-native.mjs"]);
      await withRdkitDatabase(async (url) => {
        await run(["node", "project-native-bundle.mjs"], root, url);
      });
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), packedSha256);
      assert((await assertInstalledPackageMatchesTarball(root, packedBytes)) > 1);
      assert.equal(await consumerLockfileSha256(root), lockfileSha256);
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
