import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { join, sep } from "node:path";
import { extensionProofTest } from "../fixtures/extension-proof";
import { hstoreConsumerProofCase } from "../fixtures/hstore-proof-cases";
import { hstoreGeneratedModes } from "../fixtures/hstore-generated-project";
import { runHstoreGeneratedRuntime } from "../fixtures/hstore-generated-runtime";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  verifyPackedBuildSources,
  sha256,
} from "../fixtures/proof-artifact";
import { recordPackedConsumerObservation } from "../fixtures/packed-consumer-observation";

/** This test never installs, packs or builds the package. The parent supplies actual cold-frozen reconstruction. */
extensionProofTest(
  hstoreConsumerProofCase,
  async () => {
    const file = process.env.LOOM_PROOF_CONSUMER_PREPARATION_FILE;
    assert(file, "Parent must supply an actual frozen consumer preparation receipt");
    const preparation = JSON.parse(await readFile(file, "utf8"));
    assert.equal(preparation.coldFrozenReinstall, true);
    const preparedRoot = await realpath(preparation.root);
    const installed = await realpath(join(preparedRoot, "node_modules/kello"));
    assert(
      installed.startsWith(join(preparedRoot, "node_modules") + sep),
      "Consumer package must be isolated inside the parent-prepared install",
    );
    const bytes = await readFile(preparation.artifact);
    const hash = createHash("sha256").update(bytes).digest("hex");
    assert.equal(hash, preparation.artifactHash);
    assert.equal(sha256(await readFile(join(preparation.root, "kello.tgz"))), hash);
    const manifest = JSON.parse(await readFile(join(preparation.root, "node_modules/kello/package.json"), "utf8"));
    const lock = await consumerLockfileSha256(preparation.root);
    assert.equal(lock, preparation.lockfileSha256);
    const count = await assertInstalledPackageMatchesTarball(preparation.root, bytes);
    assert(count > 1);
    verifyPackedBuildSources(
      bytes,
      await Promise.all(
        [
          "core/extensions/adapters/hstore.js",
          "core/extensions/adapters/hstore.d.ts",
          "tooling/index.js",
          "tooling/index.d.ts",
        ].map(async (file) => ({
          file: `apps/loom/dist/${file}`,
          sha256: sha256(await readFile(new URL(`../../../apps/loom/dist/${file}`, import.meta.url))),
        })),
      ),
    );
    const root = join(preparation.root, `hstore-${crypto.randomUUID()}`);
    await mkdir(root);
    async function run(command: string[], cwd: string): Promise<string> {
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
        join(root, "imports.mjs"),
        'import assert from "node:assert/strict"; import { createHstore_1_8 } from "kello/extensions/hstore"; assert.equal(process.versions.node.split(".")[0],"24"); assert.equal(typeof createHstore_1_8,"function");',
      );
      await run(["node", "imports.mjs"], root);
      for (const mode of hstoreGeneratedModes) {
        const project = join(root, mode);
        await mkdir(project);
        await symlink(join(preparation.root, "node_modules"), join(project, "node_modules"));
        for (const name of ["hstore-generated-project.ts", "hstore-generated.ts"])
          await copyFile(new URL(`../fixtures/${name}`, import.meta.url), join(project, name));
        await copyFile(
          new URL("../fixtures/hstore-public-generation.mjs.fixture", import.meta.url),
          join(project, "generate.mjs"),
        );
        await run(["bun", "generate.mjs", mode], project);
        await run([join(preparation.root, "node_modules/.bin/tsc"), "-p", join(project, "tsconfig.json")], project);
        const generation = JSON.parse(await readFile(join(project, "generation.json"), "utf8"));
        await writeFile(
          join(project, "bundle.mjs"),
          `import assert from "node:assert/strict";
import { realpath,writeFile } from "node:fs/promises"; import { build } from "esbuild";
const installed=await realpath("node_modules/kello");
const result=await build({entryPoints:["kello/_generated/extensions.ts"],bundle:true,platform:"node",format:"esm",target:"node24",write:false,metafile:true,external:${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])}});
for(const file of Object.keys(result.metafile.inputs)) if(file.includes("node_modules/kello/")) assert((await realpath(file)).startsWith(installed+"/dist/"));
const output=result.outputFiles[0].text;
assert.doesNotMatch(output,/Bun\\.|createPostgis|createPgCrypto/);
${mode === "selected" || mode === "custom" ? "assert.match(output,/createHstore_1_8/);" : "assert.doesNotMatch(output,/kello\\/extensions\\/hstore|createHstore_1_8/);"}
await writeFile("selected-bundle.mjs",output); const binding=await import("./selected-bundle.mjs");
${mode === "selected" || mode === "custom" ? 'assert.deepEqual(Object.keys(binding.extensions),["hstore"]); assert.equal(Object.keys(binding.extensions.hstore.sql.overloads).length,66);' : mode === "future" ? 'assert.equal(binding.extensions.hstore.apiSupport.status,"unverified"); assert.deepEqual(Object.keys(binding.extensions.hstore).sort(),["apiSupport","name","schema","version"]);' : "assert.equal(binding.extensions,undefined);"}
`,
        );
        await run(["node", "bundle.mjs"], project);
        await withExtensionDatabase((url) =>
          runHstoreGeneratedRuntime(project, generation.version, generation.schema, url, mode),
        );
      }
      assert.equal(await assertInstalledPackageMatchesTarball(preparation.root, bytes), count);
      assert.equal(await consumerLockfileSha256(preparation.root), lock);
      assert.equal(
        createHash("sha256")
          .update(await readFile(preparation.artifact))
          .digest("hex"),
        hash,
      );
      // Parent-prepared archive and dependency identity are unchanged; canonical consumer receipt remains parent-owned.
      await recordPackedConsumerObservation(preparation.root);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  720000,
);
