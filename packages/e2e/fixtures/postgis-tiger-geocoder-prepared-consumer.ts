import assert from "node:assert/strict";
import { copyFile, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "./proof-artifact";

/** No installation/build: use the parent's immutable, frozen tarball consumer. */
export async function runPostgisTigerGeocoderPreparedConsumer(): Promise<void> {
  const consumer = process.env.LOOM_POSTGIS_TIGER_GEOCODER_FROZEN_CONSUMER_ROOT;
  const artifact = process.env.LOOM_POSTGIS_TIGER_GEOCODER_TARBALL ?? process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
  const expectedLock = process.env.LOOM_POSTGIS_TIGER_GEOCODER_CONSUMER_LOCK_SHA256;
  assert(
    consumer && artifact && expectedLock,
    "Parent must supply LOOM_POSTGIS_TIGER_GEOCODER_FROZEN_CONSUMER_ROOT, tarball and retained lock SHA256; source imports and local pack are not the consumer gate",
  );
  const bytes = await readFile(artifact);
  const hash = sha256(bytes);
  const lock = await consumerLockfileSha256(consumer);
  assert.equal(lock, expectedLock);
  assert((await assertInstalledPackageMatchesTarball(consumer, bytes)) > 1);
  const root = await mkdtemp(join(tmpdir(), "loom-tiger-prepared-consumer-"));
  const fixtures = fileURLToPath(new URL(".", import.meta.url));
  const node = process.env.LOOM_POSTGIS_TIGER_GEOCODER_NODE24 ?? "node";
  try {
    await symlink(join(consumer, "node_modules"), join(root, "node_modules"));
    await writeFile(join(root, "package.json"), '{"private":true,"type":"module"}\n');
    for (const name of [
      "postgis-tiger-geocoder-generated-project.ts",
      "postgis-tiger-geocoder-generated-rpc.ts",
      "postgis-tiger-geocoder-owned-pg.ts",
      "postgis-tiger-geocoder-public-generation.ts",
    ])
      await copyFile(join(fixtures, name), join(root, name));
    await writeFile(
      join(root, "generate.ts"),
      `import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generatePostgisTigerGeocoderProjects } from "./postgis-tiger-geocoder-public-generation.ts";
const projects = await generatePostgisTigerGeocoderProjects(
  join(process.cwd(), "projects"),
  join(process.cwd(), "node_modules"),
  [process.execPath, "node_modules/typescript/bin/tsc"],
);
await writeFile("runtime-state.json", JSON.stringify(projects));
console.log("tiger no-install prepared consumer empty/future/selected/default/custom generateProject through installed kello PASS");
`,
    );
    await writeFile(
      join(root, "bundle.ts"),
      `import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { builtinModules } from "node:module";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
assert.equal(process.versions.node.split(".")[0], "24");
const state = JSON.parse(await readFile("runtime-state.json", "utf8"));
const manifest = JSON.parse(await readFile("node_modules/kello/package.json", "utf8"));
const dependencies = new Set([...Object.keys(manifest.dependencies ?? {}), "drizzle-orm", "kello"]);
const selectedAdapter = (path) =>
  path.endsWith("/adapters/postgis-tiger-geocoder.js") ||
  path.endsWith("/adapters/postgis-tiger-geocoder-codecs.js") ||
  path.endsWith("/adapters/postgis.js") ||
  path.endsWith("/adapters/postgis-codecs.js");
async function bundle(name) {
  const project = state.find((row) => row.selection === name);
  const result = await build({
    entryPoints: [project.root + "/kello/_generated/extensions.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node24",
    write: false,
    metafile: true,
    external: [...dependencies],
  });
  for (const output of Object.values(result.metafile.outputs))
    for (const item of output.imports) {
      if (!item.external || item.path.startsWith("node:") || item.path.startsWith(".")) continue;
      const packageName = item.path.startsWith("@") ? item.path.split("/").slice(0, 2).join("/") : item.path.split("/")[0];
      assert(builtinModules.includes(packageName) || dependencies.has(packageName), item.path);
    }
  const inputs = Object.keys(result.metafile.inputs);
  assert(!inputs.some((path) => path.includes("/tooling/")));
  assert(!inputs.some((path) => path.includes("/core/extensions/adapters/") && !selectedAdapter(path)));
  const selected = name === "selected" || name === "default" || name === "custom";
  assert.equal(inputs.some((path) => path.endsWith("/adapters/postgis-tiger-geocoder.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\\bBun\\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import(pathToFileURL(name + ".mjs").href);
  if (selected) {
    assert.deepEqual(Object.keys(extensions).sort(), ["postgis", "postgis_tiger_geocoder"]);
    assert.equal(Object.keys(extensions.postgis_tiger_geocoder.sql.overloads).length, 13);
    assert.equal("loader_generate_nation_script" in extensions.postgis_tiger_geocoder.sql.functions, false);
  } else if (name === "future") {
    assert.equal(extensions.postgis_tiger_geocoder.apiSupport.status, "unverified");
    assert.equal(extensions.postgis_tiger_geocoder.normalizeAddress, undefined);
  } else assert.equal(extensions, undefined);
}
for (const name of ["selected", "default", "custom", "future", "empty"]) await bundle(name);
console.log("cold Node24 tiger selected/default/custom/future/empty bundles PASS");
`,
    );
    await writeFile(
      join(root, "native.ts"),
      `import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runPostgisTigerGeocoderGeneratedRpc } from "./postgis-tiger-geocoder-generated-rpc.ts";
import { startPostgisTigerGeocoderOwnedPg } from "./postgis-tiger-geocoder-owned-pg.ts";
assert.equal(process.versions.node.split(".")[0], "24");
const state = JSON.parse(await readFile("runtime-state.json", "utf8"));
const fixture = await startPostgisTigerGeocoderOwnedPg();
try {
  for (const project of state) {
    if (project.postgisSchema !== "public") continue;
    const url = await fixture.provision(project.postgisSchema);
    await runPostgisTigerGeocoderGeneratedRpc(project.root, project.version, url, project.postgisSchema, fixture.journal);
  }
} finally {
  await fixture.stop();
  await fixture.proveAbsent();
}
console.log("cold Node24 generated native host/mounted RPC/Effect PASS");
`,
    );
    const run = async (binary: string, file: string) => {
      const child = Bun.spawn([binary, file], { cwd: root, env: process.env, stdout: "pipe", stderr: "pipe", timeout: 300000 });
      const output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
      assert.equal(await child.exited, 0, output);
      return output;
    };
    const nodeMajor = Bun.spawnSync([node, "-e", "process.stdout.write(process.versions.node)"], { stdout: "pipe" });
    assert.equal(nodeMajor.exitCode, 0, nodeMajor.stderr.toString());
    assert.equal(nodeMajor.stdout.toString().split(".")[0], "24", `Isolated consumer requires Node 24, not ${nodeMajor.stdout}`);
    await run("bun", "generate.ts");
    await run(node, "bundle.ts");
    await run(node, "native.ts");
    assert.equal(await consumerLockfileSha256(consumer), lock);
    assert.equal(sha256(await readFile(artifact)), hash);
    assert((await assertInstalledPackageMatchesTarball(consumer, bytes)) > 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
