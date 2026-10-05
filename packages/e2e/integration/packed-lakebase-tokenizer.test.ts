import assert from "node:assert/strict";
import { copyFile, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { extensionProofTest } from "../fixtures/extension-proof";
import { lakebaseTokenizerConsumerProofCase } from "../fixtures/lakebase-tokenizer-proof-cases";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  sha256,
  verifyPackedBuildSources,
} from "../fixtures/proof-artifact";
import { withExtensionDatabase } from "../fixtures/extension-database";

extensionProofTest(
  lakebaseTokenizerConsumerProofCase,
  async () => {
    // Parent performs the fresh build/pack and frozen isolated install. This worker fixture never installs dependencies.
    const artifact = process.env.LOOM_LAKEBASE_TOKENIZER_TARBALL;
    const consumer = process.env.LOOM_LAKEBASE_TOKENIZER_PACKED_CONSUMER_ROOT;
    assert(artifact && consumer, "Parent-built tarball and parent-preinstalled isolated consumer root are required");
    const bytes = await readFile(artifact),
      digest = sha256(bytes);
    const installed = await realpath(join(consumer, "node_modules/kello"));
    assert(
      installed.startsWith(`${await realpath(consumer)}${sep}`),
      "Packed package must resolve inside the isolated consumer",
    );
    assert((await assertInstalledPackageMatchesTarball(consumer, bytes)) > 1);
    const lock = await consumerLockfileSha256(consumer);
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const paths = [
      "core/extensions/adapters/lakebase_tokenizer.js",
      "core/extensions/adapters/lakebase_tokenizer.d.ts",
      "tooling/extensions/operations/lakebase_tokenizer.js",
      "tooling/extensions/operations/lakebase_tokenizer.d.ts",
      "tooling/index.js",
      "tooling/index.d.ts",
    ];
    verifyPackedBuildSources(
      bytes,
      await Promise.all(
        paths.map(async (path) => ({
          file: `apps/loom/dist/${path}`,
          sha256: sha256(await readFile(join(source, "dist", path))),
        })),
      ),
    );
    const root = await mkdtemp(join(consumer, "tokenizer-proof-"));
    const node = process.env.LOOM_LAKEBASE_TOKENIZER_NODE24 ?? "node";
    async function run(command: string[], env = process.env, cwd = root) {
      const child = Bun.spawn(command, { cwd, env, stdout: "pipe", stderr: "pipe", timeout: 180000 });
      const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      assert.equal(code, 0, `${command.join(" ")}\n${stdout}${stderr}`);
    }
    try {
      await run([node, "-e", "if(process.versions.node.split('.')[0]!=='24')throw Error('Node 24 required')"]);
      await writeFile(join(root, "package.json"), JSON.stringify({ private: true, type: "module" }));
      await copyFile(
        fileURLToPath(new URL("../fixtures/lakebase-tokenizer-generated-project.ts", import.meta.url)),
        join(root, "project-fixture.ts"),
      );
      await copyFile(
        fileURLToPath(new URL("../fixtures/lakebase-tokenizer-public-types.ts.fixture", import.meta.url)),
        join(root, "public-types.ts"),
      );
      await writeFile(
        join(root, "generate.ts"),
        `import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { writeLakebaseTokenizerProject, writeLakebaseTokenizerDescriptorProject, checkLakebaseTokenizerGeneratedProject } from "./project-fixture";
for (const [name, selection, schema, explicitEmpty] of [["empty", "empty", "extensions", false], ["explicit-empty", "empty", "extensions", true], ["future", "future", "extensions", false], ["selected", "selected", "extensions", false], ["custom", "selected", "packed_tokenizer", false]] as const) {
const project = join(process.cwd(), name);
await initializeProject(project, "packedtokenizer");
if (selection === "selected") await writeLakebaseTokenizerProject(project, schema);
else await writeLakebaseTokenizerDescriptorProject(project, selection, explicitEmpty);
await assert.rejects(readFile(join(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
await assert.rejects(readFile(join(project, "kello/components/tokenizer/_generated/extensions.ts")), { code: "ENOENT" });
await loadProject(project);
const generated = await generateProject(project);
await checkLakebaseTokenizerGeneratedProject(project, selection, schema, generated.version);
assert.equal((await generateProject(project)).version, generated.version);
await writeFile(join(project, "generation.json"), JSON.stringify({ version: generated.version, schema, selection }));
}`,
      );
      await run(["bun", "generate.ts"]);
      for (const name of ["empty", "explicit-empty", "future", "selected", "custom"]) {
        await run([
          "bun",
          join(consumer, "node_modules/typescript/bin/tsc"),
          "--noEmit",
          "-p",
          `${name}/tsconfig.json`,
        ]);
        const bundle = join(root, name, "ordinary-bindings.mjs");
        await run([
          "bun",
          "build",
          `${name}/kello/_generated/server.ts`,
          "--target=node",
          "--outfile",
          bundle,
          "--external=pg-native",
        ]);
        const bundled = await readFile(bundle, "utf8");
        assert.equal(
          bundled.includes("lakebase_tokenizer 0.1.1 requires its exact verified contract"),
          name === "selected" || name === "custom",
          `${name} ordinary bundle selection`,
        );
        assert(
          !bundled.includes("CREATE TEXT SEARCH DICTIONARY"),
          "Ordinary bundle contains dictionary administration",
        );
        await run([
          node,
          "-e",
          `import(${JSON.stringify(bundle)}).then(value => { if (!('extensions' in value)) throw Error('Generated bindings missing') })`,
        ]);
        await copyFile(
          fileURLToPath(new URL("../fixtures/lakebase-tokenizer-generated-rpc.mjs.fixture", import.meta.url)),
          join(root, name, "generated-rpc.mjs"),
        );
        await copyFile(
          fileURLToPath(new URL("../fixtures/lakebase-tokenizer-generated-setup.mjs.fixture", import.meta.url)),
          join(root, name, "generated-setup.mjs"),
        );
        await withExtensionDatabase(async (url) => {
          const env = {
            ...process.env,
            LOOM_LAKEBASE_TOKENIZER_CONSUMER_DATABASE_URL: url,
            LOOM_LAKEBASE_TOKENIZER_PARENT_DATABASE: new URL(url).pathname.slice(1),
          };
          const project = join(root, name);
          try {
            await run(["bun", "generated-setup.mjs"], env, project);
            await run([node, "generated-rpc.mjs"], env, project);
          } finally {
            await run(["bun", "generated-setup.mjs", "cleanup"], env, project);
          }
        });
      }
      await writeFile(
        join(root, "tsconfig.public.json"),
        JSON.stringify({
          compilerOptions: {
            module: "Preserve",
            moduleResolution: "Bundler",
            target: "ES2023",
            strict: true,
            skipLibCheck: true,
            noEmit: true,
          },
          files: ["public-types.ts"],
        }),
      );
      await run(["bun", join(consumer, "node_modules/typescript/bin/tsc"), "--noEmit", "-p", "tsconfig.public.json"]);
      assert.equal(sha256(await readFile(artifact)), digest);
      assert.equal(await consumerLockfileSha256(consumer), lock);
      assert((await assertInstalledPackageMatchesTarball(consumer, bytes)) > 1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
