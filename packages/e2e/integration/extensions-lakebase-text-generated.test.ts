import { constants } from "node:fs";
import * as v from "valibot";
import { withExtensionDatabase } from "../fixtures/extension-database";
import assert from "node:assert/strict";
import { copyFile, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "../fixtures/proof-artifact";
import { extensionProofTest } from "../fixtures/extension-proof";
import { lakebaseTextGenerationProofCase } from "../fixtures/lakebase-text-proof-cases";

/** No installation/build: use the parent's immutable, frozen tarball consumer. */
export async function runLakebaseTextPreparedGeneration(native: boolean): Promise<void> {
  const consumer = process.env.LOOM_LAKEBASE_TEXT_FROZEN_CONSUMER_ROOT;
  const artifact = process.env.LOOM_LAKEBASE_TEXT_TARBALL;
  const expectedLock = process.env.LOOM_LAKEBASE_TEXT_LOCK;
  assert(
    consumer && artifact && expectedLock,
    "Parent must supply LOOM_LAKEBASE_TEXT_FROZEN_CONSUMER_ROOT, LOOM_LAKEBASE_TEXT_TARBALL and LOOM_LAKEBASE_TEXT_LOCK; source imports are not generation",
  );
  const bytes = await readFile(artifact);
  const hash = sha256(bytes);
  const lock = await consumerLockfileSha256(consumer);
  assert.equal(lock, expectedLock);
  assert((await assertInstalledPackageMatchesTarball(consumer, bytes)) > 1);
  const root = await mkdtemp(join(tmpdir(), "loom-lakebase-text-public-generation-"));
  try {
    await symlink(join(consumer, "node_modules"), join(root, "node_modules"));
    await writeFile(join(root, "package.json"), '{"private":true,"type":"module"}\n');
    for (const file of [
      "lakebase-text-generated-project.ts",
      "lakebase-text-generated-rpc.mjs.fixture",
      "lakebase-text-public-types.ts.fixture",
      "generated-runtime-prepare.mjs.fixture",
      "generated-runtime-bundle.mjs.fixture",
    ])
      await copyFile(new URL(`../fixtures/${file}`, import.meta.url), join(root, file));
    await writeFile(
      join(root, "generate.ts"),
      `import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { writeLakebaseTextProject, checkLakebaseTextDiskBindings } from "./lakebase-text-generated-project";
const receipts = [];
for (const [selection, schema] of [["empty"], ["future"], ["selected"], ["selected", 'bm25"text']]) {
  const project = join(process.cwd(), selection + (schema ? "-custom" : "-default"));
  await initializeProject(project, "lakebasetext");
  await writeLakebaseTextProject(project, selection, schema);
  await assert.rejects(readFile(join(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
  const first = await loadProject(project);
  if (selection === "empty") assert.equal(first.config.database.extensions, undefined);
  if (selection === "future") assert.deepEqual(first.config.database.extensions?.lakebase_text, { version: "future", schema: "extensions" });
  if (selection === "selected") {
    assert.deepEqual(first.config.database.extensions?.lakebase_text, schema ? { version: "0.1.3", schema } : { version: "0.1.3", schema: "extensions" });
    assert.equal(first.componentScopes.length, 1);
    assert.deepEqual(Object.keys(first.componentScopes[0].boundExtensions ?? {}), ["lakebase_text"]);
  }
  const generation = await generateProject(project);
  await checkLakebaseTextDiskBindings(project, selection, schema ?? "extensions");
  if (selection === "selected") await copyFile("lakebase-text-public-types.ts.fixture", join(project, "kello/lakebase-text-public-types.ts"));
  const checked = spawnSync(process.execPath, ["node_modules/typescript/bin/tsc", "-p", join(project, "tsconfig.json")], { encoding: "utf8" });
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  assert.equal((await generateProject(project)).version, generation.version);
  await writeFile(join(project, "generation.json"), JSON.stringify({ version: generation.version, selection, schema: schema ?? "extensions" }));
  receipts.push({ project, selection, schema: schema ?? "extensions", generation: generation.version, virtualLoad: true, emittedDisk: true, publicTypes: selection === "selected", hostMounted: selection === "selected" });
}
await writeFile("generation-receipts.json", JSON.stringify(receipts));
console.log(JSON.stringify({ generation: receipts }));
`,
    );
    const run = async (command: string[], cwd = root, env = process.env) => {
      const child = Bun.spawn(command, { cwd, env, stdout: "pipe", stderr: "pipe", timeout: 180000 });
      const [out, err, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      const url = env.LOOM_LAKEBASE_TEXT_DATABASE_URL ?? env.LOOM_GENERATED_RUNTIME_DATABASE_URL;
      const output = url ? (out + err).replaceAll(url, "[parent private fixture]") : out + err;
      assert.equal(code, 0, output);
      console.info(output.trim());
      return out;
    };
    await run(["bun", "generate.ts"]);
    if (native) {
      const receipts = v.parse(
        v.array(v.object({ project: v.string() })),
        JSON.parse(await readFile(join(root, "generation-receipts.json"), "utf8")),
      );
      for (const receipt of receipts) {
        await copyFile(join(root, "lakebase-text-generated-rpc.mjs.fixture"), join(receipt.project, "cold-rpc.mjs"));
        await copyFile(
          join(root, "generated-runtime-prepare.mjs.fixture"),
          join(receipt.project, "prepare-runtime.mjs"),
        );
        await copyFile(join(root, "generated-runtime-bundle.mjs.fixture"), join(receipt.project, "bundle-runtime.mjs"));
        await run(["bun", "bundle-runtime.mjs", "lakebase_text"], receipt.project);
        await run([process.env.LOOM_LAKEBASE_TEXT_NODE24 ?? "node", "check-bindings.mjs"], receipt.project);
        await withExtensionDatabase(async (url) => {
          await run(["bun", "prepare-runtime.mjs", "lakebase_text"], receipt.project, {
            ...process.env,
            LOOM_GENERATED_RUNTIME_DATABASE_URL: url,
          });
          await run([process.env.LOOM_LAKEBASE_TEXT_NODE24 ?? "node", "cold-rpc.mjs"], receipt.project, {
            ...process.env,
            LOOM_LAKEBASE_TEXT_DATABASE_URL: url,
          });
        });
      }
    }
    assert.equal(await consumerLockfileSha256(consumer), lock);
    assert.equal(sha256(await readFile(artifact)), hash);
    assert((await assertInstalledPackageMatchesTarball(consumer, bytes)) > 1);
    if (native) {
      const preparationFile = process.env.LOOM_PROOF_CONSUMER_PREPARATION_FILE;
      assert(preparationFile);
      const prepared = v.parse(
        v.object({
          root: v.string(),
          artifactHash: v.string(),
          lockfileSha256: v.string(),
          coldFrozenReinstall: v.literal(true),
        }),
        JSON.parse(await readFile(preparationFile, "utf8")),
      );
      assert.equal(prepared.root, consumer);
      assert.equal(prepared.artifactHash, hash);
      assert.equal(prepared.lockfileSha256, lock);
      const retained = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
      assert(retained);
      await copyFile(artifact, retained, constants.COPYFILE_EXCL);
      const output = process.env.LOOM_EXTENSION_PROOF_PACKED_OUTPUT;
      assert(output);
      const nodeVersion = (await run([process.env.LOOM_LAKEBASE_TEXT_NODE24 ?? "node", "--version"])).trim();
      await writeFile(
        join(output, "consumer.json"),
        JSON.stringify({
          runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
          nodeVersion,
          installation: "isolated",
          frozenReinstallPassed: true,
          declarationsPassed: true,
          runtimePassed: true,
          selectedBundleChecksPassed: true,
          tarballSha256: hash,
        }),
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

extensionProofTest(
  lakebaseTextGenerationProofCase,
  async () => {
    await runLakebaseTextPreparedGeneration(false);
  },
  240000,
);
