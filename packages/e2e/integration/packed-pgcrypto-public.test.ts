import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as v from "valibot";
import { extensionProofTest } from "../fixtures/extension-proof";
import { pgcryptoGeneratedDigest, pgcryptoGeneratedModes } from "../fixtures/pgcrypto-generated-project";
import { runPgcryptoGeneratedRuntime } from "../fixtures/pgcrypto-generated-runtime";
import { pgcryptoConsumerProofCase } from "../fixtures/pgcrypto-proof-cases";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "../fixtures/proof-artifact";

/**
 * Parent owns packing and both isolated installs (initial and --frozen-lockfile). This child never installs: it
 * verifies the retained tarball, lock and installed bytes, then generates and executes through the installed package.
 */
extensionProofTest(
  pgcryptoConsumerProofCase,
  async () => {
    const prepared = process.env.LOOM_PGCRYPTO_CONSUMER_ROOT;
    const artifact = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
    const expectedLock = process.env.LOOM_PGCRYPTO_CONSUMER_LOCK_SHA256;
    assert(
      prepared && artifact && expectedLock,
      "Parent must supply LOOM_PGCRYPTO_CONSUMER_ROOT, the retained tarball and its frozen lock SHA256; this test never installs dependencies",
    );
    const consumer = await realpath(prepared);
    const bytes = await readFile(artifact);
    const tarballSha256 = sha256(bytes);
    assert((await assertInstalledPackageMatchesTarball(consumer, bytes)) > 1);
    assert.equal(await consumerLockfileSha256(consumer), expectedLock);
    const installed = await realpath(join(consumer, "node_modules/kello"));
    assert(installed.startsWith(consumer), "Public package must resolve inside the isolated consumer");
    for (const file of ["dist/core/extensions/adapters/pgcrypto.js", "dist/core/extensions/adapters/pgcrypto.d.ts"])
      assert((await readFile(join(installed, file))).length > 0, file);
    const work = await realpath(await mkdtemp(join(tmpdir(), "loom-packed-pgcrypto-")));
    async function run(command: string[]) {
      const child = Bun.spawn(command, { cwd: work, stdout: "pipe", stderr: "pipe", timeout: 180000 });
      const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      assert.equal(code, 0, `${command.join(" ")}\n${stdout}${stderr}`);
      return stdout;
    }
    try {
      await symlink(join(consumer, "node_modules"), join(work, "node_modules"));
      await writeFile(join(work, "package.json"), '{"private":true,"type":"module"}\n');
      const nodeVersion = (
        await run([
          "node",
          "-e",
          "if (process.versions.node.split('.')[0] !== '24') throw new Error('Node24 required: ' + process.version); console.log(process.version)",
        ])
      ).trim();
      await copyFile(
        fileURLToPath(new URL("../fixtures/pgcrypto-generated-project.ts", import.meta.url)),
        join(work, "project-fixture.ts"),
      );
      await writeFile(
        join(work, "generate.ts"),
        `import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { writePgcryptoProject, checkPgcryptoDiskBindings, pgcryptoGeneratedModes } from "./project-fixture.ts";
const results = [];
for (const mode of pgcryptoGeneratedModes) {
  const root = join(process.cwd(), mode);
  await initializeProject(root, "packedcrypto" + mode);
  await writePgcryptoProject(root, mode);
  await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
  assert(await loadProject(root));
  const generated = await generateProject(root);
  await checkPgcryptoDiskBindings(root, mode);
  assert.equal((await generateProject(root)).version, generated.version);
  results.push({ mode, version: generated.version });
}
console.log(JSON.stringify(results));
`,
      );
      const results = v.parse(
        v.array(v.strictObject({ mode: v.picklist(pgcryptoGeneratedModes), version: v.string() })),
        JSON.parse((await run(["bun", "generate.ts"])).trim()),
      );
      assert.deepEqual(
        results.map((result) => result.mode),
        [...pgcryptoGeneratedModes],
      );
      for (const { mode } of results)
        await run([join(work, "node_modules/.bin/tsc"), "-p", join(work, mode, "tsconfig.json")]);

      await writeFile(
        join(work, "imports.mjs"),
        `import assert from "node:assert/strict";
import { PgDialect } from "drizzle-orm/pg-core";
import { createPgcrypto_1_4 } from "kello/extensions/pgcrypto";
assert.equal(typeof globalThis.Bun, "undefined");
const descriptor = { name: "pgcrypto", version: "1.4", schema: 'packed"crypto', apiSupport: { status: "verified", digest: ${JSON.stringify(pgcryptoGeneratedDigest)} } };
const api = createPgcrypto_1_4(descriptor);
assert.equal(Object.keys(api.sql.functions).length, 37);
assert.throws(() => createPgcrypto_1_4({ ...descriptor, apiSupport: { status: "unverified" } }));
assert.throws(() => createPgcrypto_1_4({ ...descriptor, version: "1.3" }));
assert.throws(() => new PgDialect().sqlToQuery(api.digest("abc", "sha256", "text")), /Checked extension SQL requires a Kello database connection/);
`,
      );
      await run(["node", "imports.mjs"]);

      await writeFile(
        join(work, "verify-bundles.mjs"),
        `import assert from "node:assert/strict";
import { readFile, realpath, writeFile } from "node:fs/promises";
import { isBuiltin } from "node:module";
import { build } from "esbuild";
const installed = await realpath("node_modules/kello");
const manifest = JSON.parse(await readFile("node_modules/kello/package.json", "utf8"));
const dependencies = [...Object.keys(manifest.dependencies), "drizzle-orm"];
for (const mode of ${JSON.stringify(pgcryptoGeneratedModes)}) {
  const result = await build({ entryPoints: [mode + "/kello/_generated/extensions.ts"], bundle: true, platform: "node", format: "esm", target: "node24", write: false, metafile: true, external: dependencies });
  const inputs = Object.keys(result.metafile.inputs);
  for (const file of inputs) if (file.includes("node_modules/kello/")) assert((await realpath(file)).startsWith(installed + "/dist/"), file);
  for (const output of Object.values(result.metafile.outputs))
    for (const imported of output.imports)
      if (imported.external && !isBuiltin(imported.path))
        assert(dependencies.some((name) => imported.path === name || imported.path.startsWith(name + "/")), imported.path);
  assert(!inputs.some((input) => /\\/tooling\\/|\\/manifests\\/|\\/annotations\\/|kello\\.config/.test(input)), mode);
  const adapters = inputs.filter((input) => input.includes("/core/extensions/adapters/")).map((input) => input.split("/").at(-1));
  assert.deepEqual(adapters, mode === "selected" ? ["pgcrypto.js"] : [], mode);
  const text = result.outputFiles[0].text;
  assert.doesNotMatch(text, /\\bBun\\b|from ["']bun(?:["':])/);
  await writeFile(mode + ".mjs", text);
  const { extensions } = await import("./" + mode + ".mjs");
  if (mode === "selected") {
    assert.deepEqual(Object.keys(extensions), ["pgcrypto"]);
    assert.equal(extensions.pgcrypto.schema, "crypto_gen");
    assert.equal(Object.keys(extensions.pgcrypto.sql.functions).length, 37);
  } else if (mode === "unsupported") {
    assert.equal(extensions.pgcrypto.apiSupport.status, "unverified");
    assert.equal(extensions.pgcrypto.digest, undefined);
  } else assert.equal(extensions, undefined);
}
`,
      );
      await run(["node", "verify-bundles.mjs"]);

      for (const { mode, version } of results) await runPgcryptoGeneratedRuntime(join(work, mode), version, mode);

      assert.equal(sha256(await readFile(artifact)), tarballSha256);
      assert.equal(await consumerLockfileSha256(consumer), expectedLock);
      assert((await assertInstalledPackageMatchesTarball(consumer, bytes)) > 1);
      const output = process.env.LOOM_EXTENSION_PROOF_PACKED_OUTPUT;
      if (output) {
        const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
        assert(runId, "Packed proof requires the host-owned run ID");
        const node = spawnSync("node", ["--version"], { encoding: "utf8" });
        assert.equal(node.stdout.trim(), nodeVersion);
        await writeFile(join(output, "consumer-lock.json"), JSON.stringify({ lockfileSha256: expectedLock }) + "\n", {
          flag: "wx",
          mode: 0o600,
        });
        await writeFile(
          join(output, "consumer.json"),
          JSON.stringify({
            runId,
            nodeVersion,
            installation: "isolated",
            frozenReinstallPassed: true,
            declarationsPassed: true,
            runtimePassed: true,
            selectedBundleChecksPassed: true,
            tarballSha256,
          }) + "\n",
          { flag: "wx", mode: 0o600 },
        );
      }
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  },
  600000,
);
