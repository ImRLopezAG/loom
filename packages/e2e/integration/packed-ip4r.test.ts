import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { extensionProofTest } from "../fixtures/extension-proof";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256 } from "../fixtures/proof-artifact";
import { ip4rConsumerProofCase } from "../fixtures/ip4r-composition-proof-cases";
import { runIp4rGeneratedRuntime } from "../fixtures/ip4r-generated-runtime";

extensionProofTest(
  ip4rConsumerProofCase,
  async () => {
    const preparationFile = process.env.LOOM_PROOF_CONSUMER_PREPARATION_FILE;
    assert(preparationFile, "Parent must supply its actually installed and cold-frozen-reinstalled consumer");
    const preparation = JSON.parse(await readFile(preparationFile, "utf8"));
    assert.equal(preparation.coldFrozenReinstall, true);
    const bytes = await readFile(preparation.artifact);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    assert.equal(sha256, preparation.artifactHash);
    assert.equal(await consumerLockfileSha256(preparation.root), preparation.lockfileSha256);
    const installedByteCount = await assertInstalledPackageMatchesTarball(preparation.root, bytes);
    assert(installedByteCount > 1);
    const root = join(preparation.root, `ip4r-${crypto.randomUUID()}`);
    await mkdir(root);
    async function run(command: string[], cwd: string) {
      const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 180000 });
      const [out, error, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      assert.equal(code, 0, out + error);
      return out;
    }
    try {
      await writeFile(join(root, "package.json"), '{"private":true,"type":"module"}');
      await symlink(join(preparation.root, "node_modules"), join(root, "node_modules"));
      await writeFile(
        join(root, "runtime-import.mjs"),
        'import { createIp4r_2_4 } from "kello/extensions/ip4r"; if (process.versions.node.split(".")[0] !== "24" || typeof createIp4r_2_4 !== "function") throw new Error("Cold public runtime import failed");',
      );
      await run(["node", "runtime-import.mjs"], root);
      const nodeVersion = (await run(["node", "--version"], root)).trim();
      for (const mode of ["omitted", "empty", "future", "selected", "custom"] as const) {
        const project = join(root, mode);
        await mkdir(project);
        await symlink(join(preparation.root, "node_modules"), join(project, "node_modules"));
        await copyFile(
          new URL("../fixtures/ip4r-generated-project.ts", import.meta.url),
          join(project, "project-writer.ts"),
        );
        await copyFile(
          new URL("../fixtures/ip4r-packed-generation.mjs.fixture", import.meta.url),
          join(project, "generate.mjs"),
        );
        await run(["bun", "generate.mjs", mode], project);
        const generation = JSON.parse(await readFile(join(project, "generation.json"), "utf8"));
        const bundle = await Bun.build({
          entrypoints: [join(project, "kello/_generated/extensions.ts")],
          target: "node",
          outdir: join(project, "bundle"),
        });
        assert(bundle.success, JSON.stringify(bundle.logs));
        const output = (await Promise.all(bundle.outputs.map((file) => file.text()))).join("\n");
        assert(!output.includes('from "bun"'));
        assert(!output.includes("createPostgis_3_6_4"));
        if (mode === "omitted" || mode === "empty" || mode === "future") assert(!output.includes("createIp4r_2_4"));
        if (mode === "selected" || mode === "custom")
          await withExtensionDatabase(async (url) =>
            runIp4rGeneratedRuntime(project, generation.version, generation.schema, url),
          );
      }
      assert.equal(await assertInstalledPackageMatchesTarball(preparation.root, bytes), installedByteCount);
      assert.equal(await consumerLockfileSha256(preparation.root), preparation.lockfileSha256);
      assert.equal(
        createHash("sha256")
          .update(await readFile(preparation.artifact))
          .digest("hex"),
        sha256,
      );
      const retained = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
      if (retained) await copyFile(preparation.artifact, retained);
      const observations = process.env.LOOM_EXTENSION_PROOF_PACKED_OUTPUT;
      if (observations)
        await writeFile(
          join(observations, "consumer.json"),
          JSON.stringify({
            runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
            tarballSha256: sha256,
            nodeVersion,
            installation: "isolated",
            frozenReinstallPassed: true,
            declarationsPassed: true,
            runtimePassed: true,
            selectedBundleChecksPassed: true,
          }),
        );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
