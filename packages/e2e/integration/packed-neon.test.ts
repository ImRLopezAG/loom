import assert from "node:assert/strict";
import { test } from "bun:test";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
  verifyPackedBuildSources,
} from "../fixtures/proof-artifact";

// ROOT executes this test: dependency installation and the provider connection belong to the caller.
test("Neon frozen isolated tarball, generated RPC/Effect and cold Node 24 native consumer", async () => {
  const artifact = process.env.LOOM_NEON_TARBALL;
  assert(artifact, "LOOM_NEON_TARBALL must name ROOT's freshly built artifact");
  assert(process.env.LOOM_NEON_NATIVE_DATABASE_URL, "Requires ROOT's owned exact Neon 1.25 PG18 fixture");
  const root = await mkdtemp(join(tmpdir(), "loom-packed-neon-"));
  const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
  async function run(command: string[]) {
    const child = Bun.spawn(command, { cwd: root, env: process.env, stdout: "pipe", stderr: "pipe", timeout: 180000 });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    // A failed PG connection may contain its URL; retain diagnostics without retaining credentials.
    let output = stdout + stderr;
    const url = process.env.LOOM_NEON_NATIVE_DATABASE_URL!;
    const password = new URL(url).password;
    for (const secret of [url, password, decodeURIComponent(password)])
      if (secret) output = output.replaceAll(secret, "[redacted]");
    output = output.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
    assert.equal(code, 0, `${command.join(" ")}\n${output}`);
  }
  try {
    await run(["node", "-e", "if(process.versions.node.split('.')[0]!=='24')throw Error('Node 24 required')"]);
    const bytes = await readFile(artifact);
    const digest = sha256(bytes);
    const paths = [
      "core/extensions/adapters/neon.js",
      "core/extensions/adapters/neon.d.ts",
      "tooling/index.js",
      "tooling/index.d.ts",
      "tooling/extensions/operations/neon.js",
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
    await copyFile(artifact, join(root, "kello.tgz"));
    const pkg = JSON.parse(await readFile(join(source, "package.json"), "utf8"));
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        dependencies: {
          ...pkg.dependencies,
          kello: "file:./kello.tgz",
          "drizzle-orm": pkg.devDependencies["drizzle-orm"],
        },
        devDependencies: {
          typescript: pkg.devDependencies.typescript,
          esbuild: pkg.devDependencies.esbuild,
          "@types/node": pkg.devDependencies["@types/node"],
          "@types/pg": pkg.devDependencies["@types/pg"],
        },
      }),
    );
    await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
    assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
    const lock = await consumerLockfileSha256(root);
    await removeConsumerNodeModules(root);
    await run(["bun", "install", "--ignore-scripts", "--linker", "isolated", "--frozen-lockfile"]);
    assert.equal(await consumerLockfileSha256(root), lock);
    assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
    for (const name of ["neon-generated-project.ts", "neon-generated-rpc.ts", "neon-consumer-runtime.ts"])
      await copyFile(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), join(root, name));
    await writeFile(
      join(root, "generate.ts"),
      `import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { writeNeonProject, writeNeonSelectionProject, checkNeonDiskBindings } from "./neon-generated-project";
for (const selection of ["selected", "empty", "unsupported"] as const) {
const project = join(process.cwd(), selection);
await initializeProject(project, "packedneon");
if(selection === "selected") await writeNeonProject(project, "extensions"); else await writeNeonSelectionProject(project, selection);
await assert.rejects(readFile(join(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
await loadProject(project);
const generated = await generateProject(project);
if(selection === "selected") await checkNeonDiskBindings(project, "extensions");
assert.equal((await generateProject(project)).version, generated.version);
await writeFile(join(project, "generation.json"), JSON.stringify({version: generated.version}));
}`,
    );
    await run(["bun", "generate.ts"]);
    for (const selection of ["selected", "empty", "unsupported"])
      await run(["bun", "node_modules/typescript/bin/tsc", "-p", `${selection}/tsconfig.json`]);
    const external = [...Object.keys(pkg.dependencies), "drizzle-orm"];
    for (const selection of ["selected", "empty", "unsupported"] as const) {
      const { version } = JSON.parse(await readFile(join(root, selection, "generation.json"), "utf8"));
      await writeFile(
        join(root, `${selection}-entry.ts`),
        `import assert from "node:assert/strict";
import { runtimeOptions } from "./${selection}/.loom/generations/${version}/runtime.js";
import { exerciseNeonGeneratedRpc } from "./neon-generated-rpc";
${selection === "selected" ? 'import { exerciseNeonConsumerNative } from "./neon-consumer-runtime";' : ""}
assert.equal(process.versions.node.split(".")[0], "24");
await exerciseNeonGeneratedRpc(runtimeOptions(), process.env.LOOM_NEON_NATIVE_DATABASE_URL!, ${JSON.stringify(selection)}, "extensions");
${selection === "selected" ? "await exerciseNeonConsumerNative(process.env.LOOM_NEON_NATIVE_DATABASE_URL!);" : ""}
console.log(${JSON.stringify(`Cold Neon ${selection} generated RPC/Effect and public consumer passed`)});`,
      );
    }
    await writeFile(
      join(root, "bundle.mjs"),
      `import assert from "node:assert/strict";
import { realpath } from "node:fs/promises";
import { build } from "esbuild";
const installed=await realpath("node_modules/kello");
for (const selection of ["selected","empty","unsupported"]) {
const result=await build({entryPoints:[selection+"-entry.ts"],bundle:true,platform:"node",format:"esm",target:"node24",outfile:selection+"-bundle.mjs",metafile:true,external:${JSON.stringify(external)}});
const inputs=Object.keys(result.metafile.inputs);
for(const file of inputs) if(file.includes("node_modules/kello/")) assert((await realpath(file)).startsWith(installed+"/dist/"),file);
assert(!inputs.some(file=>file.includes("/tooling/")));
assert(!inputs.some(file=>file.includes("/core/extensions/adapters/")&&!/\\/neon(-codecs)?\\.js$/.test(file)), inputs.join("\\n"));
if(selection!=="selected") assert(!inputs.some(file=>/\\/neon(-codecs)?\\.js$/.test(file)));
}`,
    );
    await run(["node", "bundle.mjs"]);
    for (const selection of ["selected", "empty", "unsupported"]) await run(["node", `${selection}-bundle.mjs`]);
    assert.equal(sha256(await readFile(artifact)), digest);
    assert.equal(sha256(await readFile(join(root, "kello.tgz"))), digest);
    assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 600000);
