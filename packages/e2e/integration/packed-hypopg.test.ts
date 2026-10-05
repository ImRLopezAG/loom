import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as v from "valibot";
import { extensionProofTest } from "../fixtures/extension-proof";
import { hypopgConsumerProofCase } from "../fixtures/hypopg-proof-cases";
import { writeHypopgProjectFiles } from "../fixtures/hypopg-generated-project";
import { writeHypopgNativeRuntime } from "../fixtures/hypopg-native-runtime";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  readTarEntries,
  sha256,
} from "../fixtures/proof-artifact";

extensionProofTest(
  hypopgConsumerProofCase,
  async () => {
    // The parent owns the build/pack. This test consumes precisely that archive, never workspace exports.
    const archive = process.env.LOOM_HYPOPG_TARBALL;
    assert(archive, "Parent must supply LOOM_HYPOPG_TARBALL from its fresh canonical build/pack");
    const root = await mkdtemp(join(tmpdir(), "loom-packed-hypopg-"));
    async function run(command: string[], databaseUrl?: string) {
      const environment = { ...process.env };
      if (databaseUrl) environment.LOOM_PACKED_HYPOPG_DATABASE_URL = databaseUrl;
      const child = Bun.spawn(command, {
        cwd: root,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 120000,
        env: environment,
      });
      const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      let output = stdout + stderr;
      if (databaseUrl) output = output.replaceAll(databaseUrl, "[redacted]");
      output = output.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
      assert.equal(code, 0, output);
      return stdout;
    }
    try {
      const bytes = await readFile(archive);
      const digest = sha256(bytes);
      const entries = readTarEntries(bytes);
      for (const file of [
        "package/dist/core/extensions/adapters/hypopg.js",
        "package/dist/core/extensions/adapters/hypopg.d.ts",
        "package/dist/tooling/extensions/operations/hypopg.js",
        "package/dist/tooling/extensions/operations/hypopg.d.ts",
      ])
        assert(entries.get(file)?.length, `Missing compiled tarball surface: ${file}`);
      const manifest = v.parse(
        v.object({
          dependencies: v.record(v.string(), v.string()),
          devDependencies: v.record(v.string(), v.string()),
          exports: v.record(v.string(), v.unknown()),
        }),
        JSON.parse(entries.get("package/package.json")!.toString("utf8")),
      );
      for (const key of ["./extensions/hypopg", "./tooling/extensions/hypopg"])
        assert(manifest.exports[key], `Missing packed export: ${key}`);
      await writeFile(join(root, "kello.tgz"), bytes, { flag: "wx" });
      const retained = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
      if (retained) {
        await copyFile(join(root, "kello.tgz"), retained, constants.COPYFILE_EXCL);
        assert.equal(sha256(await readFile(retained)), digest);
      }
      await run([
        "node",
        "-e",
        "if(process.versions.node.split('.')[0]!=='24') throw new Error('HypoPG isolated consumer requires Node 24');",
      ]);
      await writeFile(
        join(root, "package.json"),
        JSON.stringify({
          private: true,
          type: "module",
          dependencies: {
            ...manifest.dependencies,
            kello: "file:./kello.tgz",
            "drizzle-orm": manifest.devDependencies["drizzle-orm"],
          },
          devDependencies: {
            typescript: manifest.devDependencies.typescript,
            "@types/node": manifest.devDependencies["@types/node"],
            "@types/pg": manifest.devDependencies["@types/pg"],
          },
        }),
      );
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
      const lockfile = await consumerLockfileSha256(root);
      await removeConsumerNodeModules(root);
      assert.equal(await consumerLockfileSha256(root), lockfile);
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated", "--frozen-lockfile"]);
      assert.equal(await consumerLockfileSha256(root), lockfile);
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), digest);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
      process.stdout.write(
        `hypopg cold/frozen installed-byte integrity passed: tarball ${digest}, lockfile ${lockfile}\n`,
      );
      await writeFile(
        join(root, "prepare.mjs"),
        `import { initializeProject } from "kello/tooling";
for (const name of ["project", "absent", "empty", "future"]) await initializeProject(name, "hypopg" + name);`,
      );
      await run(["bun", "prepare.mjs"]);
      await writeHypopgProjectFiles(join(root, "project"), "hypopg_tools");
      await writeFile(
        join(root, "empty/kello.config.ts"),
        'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: {} } });',
      );
      await writeFile(
        join(root, "future/kello.config.ts"),
        'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { hypopg: { version: "future" } } } });',
      );
      await writeFile(
        join(root, "generate.mjs"),
        `import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { generateProject, loadProject } from "kello/tooling";
for (const name of ["project", "absent", "empty", "future"]) {
  await assert.rejects(readFile(name + "/kello/_generated/extensions.ts"), { code: "ENOENT" });
  await loadProject(name);
  await generateProject(name);
}
const emitted = await readFile("project/kello/_generated/extensions.ts", "utf8");
assert.match(emitted, /createHypopg_1_4_3/);
assert.match(emitted, /kello\\/extensions\\/hypopg/);
assert.doesNotMatch(emitted, /tooling\\/extensions|kello\\.config|\\.\\.\\/schema/);`,
      );
      await run(["bun", "generate.mjs"]);
      await run([join(root, "node_modules/.bin/tsc"), "-p", "project/tsconfig.json"]);
      await writeFile(
        join(root, "bundle.mjs"),
        `import assert from "node:assert/strict";
import { realpath, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
const packageRoot = await realpath("node_modules/kello");
for (const name of ["kello/extensions/hypopg", "kello/tooling/extensions/hypopg"])
  assert((await realpath(fileURLToPath(import.meta.resolve(name)))).startsWith(packageRoot + "/dist/"));
const selections = { selected: "project/kello/components/planner/_generated/extensions.ts", absent: "absent/kello/_generated/extensions.ts", empty: "empty/kello/_generated/extensions.ts", future: "future/kello/_generated/extensions.ts" };
for (const [name, entry] of Object.entries(selections)) {
  const result = await build({ entryPoints: [entry], bundle: true, platform: "node", format: "esm", target: "node24", write: false, metafile: true, external: ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])} });
  const inputs = Object.keys(result.metafile.inputs);
  assert(!inputs.some(path => path.includes("/tooling/")));
  assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !/hypopg(?:-codecs)?\\.js$/.test(path)));
  assert.equal(inputs.some(path => path.endsWith("/adapters/hypopg.js")), name === "selected");
  const text = result.outputFiles[0].text;
  assert(!/\\bBun\\b|from ["']bun(?:["':])/.test(text));
  assert(!/\\bwithHypopg\\b|\\bwithExtensionOperation\\b|\\bverifyExtensionApiContracts\\b/.test(text));
  const factories = [...new Set(text.match(/\\bcreate[A-Za-z0-9]+_\\d+(?:_\\d+)+\\b/g) ?? [])];
  assert.deepEqual(factories, name === "selected" ? ["createHypopg_1_4_3"] : []);
  await writeFile(name + ".mjs", text);
  const { extensions } = await import("./" + name + ".mjs");
  if (name === "selected") {
    assert.deepEqual(Object.keys(extensions), ["hypopg"]);
    assert.equal(extensions.hypopg.schema, "hypopg_tools");
    assert.equal(extensions.hypopg.version, "1.4.3");
    assert.equal(Object.keys(extensions.hypopg.sql.functions).length, 4);
    assert.equal(typeof extensions.hypopg.createIndex, "object");
  } else if (name === "future") {
    assert.equal(extensions.hypopg.apiSupport.status, "unverified");
    assert.equal(extensions.hypopg.sql, undefined);
  } else assert.equal(extensions, undefined);
}`,
      );
      await run(["bun", "bundle.mjs"]);
      process.stdout.write("hypopg installed disk generation, declaration compilation and bundle selection passed\n");
      await writeHypopgNativeRuntime(root, "./project/kello/components/planner/_generated/extensions.ts");
      await writeFile(
        join(root, "bundle-native.mjs"),
        `import { build } from "esbuild";
await build({ entryPoints: ["native.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "native-bundle.mjs", external: ${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])} });`,
      );
      await run(["bun", "bundle-native.mjs"]);
      await withExtensionDatabase(async (url) => {
        await run(["node", "native-bundle.mjs"], url);
      });
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), digest);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
      assert.equal(await consumerLockfileSha256(root), lockfile);
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
            tarballSha256: digest,
          }) + "\n",
          { mode: 0o600 },
        );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
