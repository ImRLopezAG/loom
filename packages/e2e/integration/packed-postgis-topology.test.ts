import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  postgisTopologyGeneratedSchema,
  postgisTopologyGeneratedTypeProof,
  postgisTopologyPackedGenerationSource,
  postgisTopologyPackedPreparationSource,
} from "../fixtures/postgis-topology-generated-project";
import { extensionProofTest } from "../fixtures/extension-proof";
import { postgisTopologyConsumerProofCase } from "../fixtures/postgis-topology-proof-cases";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
} from "../fixtures/proof-artifact";
import { withPostgisTopologyDatabase } from "../fixtures/postgis-topology-database";

/** Parent-owned execution: packs built exports, then installs only inside the disposable consumer. */
extensionProofTest(
  postgisTopologyConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-topology-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], databaseUrl?: string, cwd = root) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_TOPOLOGY_DATABASE_URL = databaseUrl;
      if (command[0] === "node") {
        delete env.LOOM_TEST_DATABASE_URL;
        delete env.LOOM_PACKED_TOPOLOGY_DATABASE_URL;
      }
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
      let output = stdout + stderr;
      if (databaseUrl)
        output = output.replaceAll(databaseUrl, "[redacted]").replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
      assert.equal(code, 0, command.join(" ") + "\n" + output);
    }
    try {
      for (const file of [
        "dist/core/extensions/adapters/postgis-topology.js",
        "dist/core/extensions/adapters/postgis-topology.d.ts",
        "dist/tooling/extensions/operations/postgis-topology.js",
        "dist/tooling/extensions/operations/postgis-topology.d.ts",
      ])
        assert(
          (await readFile(join(source, file))).length > 0,
          "Parent must build topology public exports before packed proof",
        );
      await run(["bun", "pm", "pack", "--filename", join(root, "kello.tgz"), "--ignore-scripts"], undefined, source);
      const bytes = await readFile(join(root, "kello.tgz"));
      const digest = sha256(bytes);
      if (process.env.LOOM_EXTENSION_PROOF_ARTIFACT) {
        await copyFile(join(root, "kello.tgz"), process.env.LOOM_EXTENSION_PROOF_ARTIFACT, constants.COPYFILE_EXCL);
        assert.equal(sha256(await readFile(process.env.LOOM_EXTENSION_PROOF_ARTIFACT)), digest);
      }
      await run([
        "node",
        "-e",
        "if(process.versions.node.split('.')[0]!=='24')throw new Error('Consumer requires Node 24')",
      ]);
      const dependencies = new Map<string, string>([
        ...Object.entries<string>(manifest.dependencies),
        ["kello", "file:./kello.tgz"],
        ["drizzle-orm", manifest.devDependencies["drizzle-orm"]],
      ]);
      await writeFile(
        join(root, "package.json"),
        JSON.stringify({
          private: true,
          type: "module",
          dependencies: Object.fromEntries(dependencies),
          devDependencies: {
            typescript: manifest.devDependencies.typescript,
            "@types/node": manifest.devDependencies["@types/node"],
            "@types/pg": manifest.devDependencies["@types/pg"],
          },
        }),
      );
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
      const lock = await consumerLockfileSha256(root);
      await removeConsumerNodeModules(root);
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated", "--frozen-lockfile"]);
      assert.equal(await consumerLockfileSha256(root), lock);
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), digest);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
      await writeFile(join(root, "generate.mjs"), postgisTopologyPackedGenerationSource);
      await run(["bun", "generate.mjs"]);
      await writeFile(
        join(root, "schema.ts"),
        postgisTopologyGeneratedSchema().replace('"./_generated/extensions"', '"./selected"'),
      );
      await writeFile(
        join(root, "probe.ts"),
        postgisTopologyGeneratedTypeProof.replace('"./_generated/extensions"', '"./selected"') +
          `
import {extensions as future} from "./future";
import {extensions as absent} from "./absent";
import {extensions as empty} from "./empty";
const noSelection: undefined = absent;
const emptySelection: undefined = empty;
// @ts-expect-error An uncaptured version exposes only its descriptor.
future.postgis_topology.sql;
void [noSelection,emptySelection];
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
      await writeFile(
        join(root, "verify.mjs"),
        String.raw`
import assert from "node:assert/strict";
import {realpath,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {build} from "esbuild";
const packageRoot = await realpath("node_modules/kello");
for(const name of ["kello/extensions/postgis-topology","kello/tooling/extensions/postgis-topology"])
  assert((await realpath(fileURLToPath(import.meta.resolve(name)))).startsWith(packageRoot+"/dist/"));
for(const name of ["selected","future","absent","empty"]){
 const result = await build({entryPoints:[name+".ts"],bundle:true,platform:"node",format:"esm",target:"node24",write:false,metafile:true,external:EXTERNALS});
 const inputs = Object.keys(result.metafile.inputs);
 assert(!inputs.some(path=>path.includes("/tooling/")));
 assert(!inputs.some(path=>path.includes("/adapters/")&&!/\/(postgis|postgis-codecs|postgis-topology|postgis-topology-codecs)\.js$/.test(path)));
 assert.equal(inputs.some(path=>path.endsWith("/adapters/postgis-topology.js")),name==="selected");
 const output = result.outputFiles[0].text;
 assert(!/\bBun\b|from ["']bun(?:["':])/.test(output));
 await writeFile(name+".mjs",output);
 const {extensions} = await import("./"+name+".mjs");
 if(name==="selected"){
  assert.deepEqual(Object.keys(extensions),["postgis","postgis_topology"]);
  assert.equal(Object.keys(extensions.postgis_topology.sql.overloads).length,41);
  assert.equal(Object.keys(extensions.postgis_topology.sql.casts).length,2);
 }else if(name==="future")assert.equal(extensions.postgis_topology.sql,undefined);
 else assert.equal(extensions,undefined);
}
`.replace("EXTERNALS", JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm"])),
      );
      await run(["node", "verify.mjs"]);
      await writeFile(
        join(root, "native.mjs"),
        await readFile(
          fileURLToPath(new URL("../fixtures/postgis-topology-consumer.mjs.fixture", import.meta.url)),
          "utf8",
        ),
      );
      await writeFile(
        join(root, "compile.mjs"),
        `import {build} from "esbuild"; await build({entryPoints:["native.mjs"],bundle:true,platform:"node",format:"esm",target:"node24",outfile:"native-bundle.mjs",external:${JSON.stringify([...Object.keys(manifest.dependencies), "drizzle-orm", "kello/*"])}});`,
      );
      await run(["node", "compile.mjs"]);
      await writeFile(join(root, "prepare.mjs"), postgisTopologyPackedPreparationSource);
      await withPostgisTopologyDatabase(async (url) => {
        try {
          await run(["bun", "prepare.mjs"], url);
          await run(["node", "native-bundle.mjs"], undefined);
        } finally {
          await run(["bun", "prepare.mjs", "cleanup"], url);
        }
      });
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), digest);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
