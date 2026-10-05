import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as v from "valibot";
import { extensionProofTest } from "../fixtures/extension-proof";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256 } from "../fixtures/proof-artifact";
import { pgTrgmGeneratedModes, pgTrgmGeneratedSelected } from "../fixtures/pg-trgm-generated-project";
import { runPgTrgmGeneratedRuntime } from "../fixtures/pg-trgm-generated-runtime";
import { pgTrgmConsumerProofCase, pgTrgmQueryMembers } from "../fixtures/pg-trgm-proof-cases";

const preparationValidator = v.object({
  root: v.string(),
  artifact: v.string(),
  artifactHash: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
  lockfileSha256: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
  coldFrozenReinstall: v.literal(true),
});
function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

extensionProofTest(
  pgTrgmConsumerProofCase,
  async () => {
    // The parent packs, installs and cold-frozen-reinstalls; this case spawns no pack, install or build child.
    const preparationFile = process.env.LOOM_PROOF_CONSUMER_PREPARATION_FILE;
    assert(preparationFile, "Parent must supply its actually installed and cold-frozen-reinstalled consumer");
    const preparation = v.parse(preparationValidator, JSON.parse(await readFile(preparationFile, "utf8")));
    const bytes = await readFile(preparation.artifact);
    const tarballSha256 = sha256(bytes);
    assert.equal(tarballSha256, preparation.artifactHash);
    assert.equal(await consumerLockfileSha256(preparation.root), preparation.lockfileSha256);
    const installedByteCount = await assertInstalledPackageMatchesTarball(preparation.root, bytes);
    assert(installedByteCount > 1);
    const root = join(preparation.root, `pg-trgm-${crypto.randomUUID()}`);
    await mkdir(root);
    async function run(command: string[], cwd: string) {
      const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 180000 });
      const [out, error, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      assert.equal(code, 0, `${command.join(" ")}\n${out}${error}`);
      return out;
    }
    try {
      await writeFile(join(root, "package.json"), '{"private":true,"type":"module"}');
      await symlink(join(preparation.root, "node_modules"), join(root, "node_modules"));
      await writeFile(
        join(root, "runtime-import.mjs"),
        `import assert from "node:assert/strict";
import { createPgTrgm_1_6 } from "kello/extensions/pg-trgm";
import { withPgTrgmThresholds } from "kello/tooling/extensions/pg-trgm";
assert.equal(process.versions.node.split(".")[0], "24");
const descriptor = { name: "pg_trgm", version: "1.6", schema: "extensions", apiSupport: { status: "verified", digest: "88e35b55b09e58d6a59847390006ca73483bdb4444346474beb644c63adcbe66" } };
const api = createPgTrgm_1_6(descriptor);
assert.deepEqual(Object.keys(api.sql.overloads).sort(), ${JSON.stringify([...pgTrgmQueryMembers].sort())});
assert.equal(typeof withPgTrgmThresholds, "function");
assert.equal("setLimit" in api, false);
assert.throws(() => createPgTrgm_1_6({ ...descriptor, apiSupport: { status: "unverified" } }), /exact verified contract/);
assert.throws(() => createPgTrgm_1_6({ ...descriptor, version: "1.5" }), /exact verified contract/);
`,
      );
      await run(["node", "runtime-import.mjs"], root);
      const nodeVersion = (await run(["node", "--version"], root)).trim();
      assert.match(nodeVersion, /^v24\./);
      for (const mode of pgTrgmGeneratedModes) {
        const project = join(root, mode);
        await mkdir(project);
        await symlink(join(preparation.root, "node_modules"), join(project, "node_modules"));
        await copyFile(
          new URL("../fixtures/pg-trgm-generated-project.ts", import.meta.url),
          join(project, "project-writer.ts"),
        );
        await copyFile(
          new URL("../fixtures/pg-trgm-packed-generation.mjs.fixture", import.meta.url),
          join(project, "generate.mjs"),
        );
        await writeFile(join(project, "members.json"), JSON.stringify(pgTrgmQueryMembers));
        await run(["bun", "generate.mjs", mode], project);
        const generated = v.parse(
          v.object({ version: v.string() }),
          JSON.parse(await readFile(join(project, "generated-version.json"), "utf8")),
        );
        const bundle = await Bun.build({
          entrypoints: [join(project, "kello/_generated/extensions.ts")],
          target: "node",
          outdir: join(project, "bundle"),
        });
        assert(bundle.success, JSON.stringify(bundle.logs));
        const output = (await Promise.all(bundle.outputs.map((file) => file.text()))).join("\n");
        assert(!output.includes('from "bun"'));
        assert(!output.includes("apps/loom/src"));
        for (const excluded of ["withPgTrgmThresholds", "pg_trgm operator tooling", "createPgGraphql", "createPostgis"])
          assert(!output.includes(excluded), `${mode} bundle includes ${excluded}`);
        if (pgTrgmGeneratedSelected(mode)) assert(output.includes("createPgTrgm_1_6"));
        else assert(!output.includes("createPgTrgm_1_6"));
        await withExtensionDatabase((url) =>
          runPgTrgmGeneratedRuntime(project, mode, generated.version, pgTrgmQueryMembers, url),
        );
      }
      assert.equal(await assertInstalledPackageMatchesTarball(preparation.root, bytes), installedByteCount);
      assert.equal(await consumerLockfileSha256(preparation.root), preparation.lockfileSha256);
      assert.equal(sha256(await readFile(preparation.artifact)), tarballSha256);
      const retained = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
      if (retained) await copyFile(preparation.artifact, retained, constants.COPYFILE_EXCL);
      const observations = process.env.LOOM_EXTENSION_PROOF_PACKED_OUTPUT;
      if (observations)
        await writeFile(
          join(observations, "consumer.json"),
          JSON.stringify({
            runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
            tarballSha256,
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
  900000,
);
