import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, readTarEntries, sha256 } from "./proof-artifact";
import { writeHypopgNativeRuntime } from "./hypopg-native-runtime";

/** Exercise an already installed parent archive without installing, rebuilding, or altering its bytes. */
export async function runHypopgFrozenPublic(consumer: string, archive: string, node: string, localFixtureURL?: string) {
  const bytes = await readFile(archive);
  const artifactDigest = sha256(bytes);
  const lockDigest = await consumerLockfileSha256(consumer);
  const installedFiles = await assertInstalledPackageMatchesTarball(consumer, bytes);
  const entries = readTarEntries(bytes);
  const operator = entries.get("package/dist/tooling/extensions/operations/hypopg.js");
  assert(operator, "Parent archive must contain the public HypoPG operator export");
  const root = await mkdtemp(join(tmpdir(), "loom-hypopg-frozen-public-"));
  try {
    await symlink(join(consumer, "node_modules"), join(root, "node_modules"));
    await writeFile(join(root, "package.json"), '{"private":true,"type":"module"}\n');
    await writeHypopgNativeRuntime(root, "./custom/kello/components/planner/_generated/extensions.ts");
    await writeFile(
      join(root, "hypopg-generated-project.ts"),
      await readFile(fileURLToPath(new URL("./hypopg-generated-project.ts", import.meta.url))),
    );
    await writeFile(
      join(root, "public.mjs"),
      String.raw`
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, realpath, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { writeHypopgProjectFiles } from "./hypopg-generated-project.ts";
const node = process.argv[2];
const nodeVersion = spawnSync(node, ["-e", "process.stdout.write(process.versions.node)"], { encoding: "utf8" });
assert.equal(nodeVersion.status, 0, nodeVersion.stderr);
assert.equal(nodeVersion.stdout.split(".")[0], "24");
const packageRoot = await realpath("node_modules/kello");
for (const name of ["kello/tooling", "kello/extensions/hypopg", "kello/tooling/extensions/hypopg"])
  assert((await realpath(fileURLToPath(import.meta.resolve(name)))).startsWith(packageRoot + "/dist/"));
const manifest = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
const external = [...Object.keys(manifest.dependencies), "drizzle-orm", "kello/server"];
const outputs = [];
for (const selection of ["default", "custom", "absent", "empty", "future"]) {
  const project = join(process.cwd(), selection);
  await initializeProject(project, "hypopg" + selection);
  await symlink(join(process.cwd(), "node_modules"), join(project, "node_modules"));
  const placement = selection === "custom" ? "hypopg_tools" : "extensions";
  if (selection === "default" || selection === "custom") await writeHypopgProjectFiles(project, placement);
  if (selection === "empty" || selection === "future") await writeFile(join(project, "kello.config.ts"),
    'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: ' +
    (selection === "empty" ? '{}' : '{ hypopg: { version: "future" } }') + ' } });');
  const generatedFile = join(project, "kello/_generated/extensions.ts");
  await assert.rejects(readFile(generatedFile), { code: "ENOENT" });
  await loadProject(project);
  const generated = await generateProject(project);
  const source = await readFile(generatedFile, "utf8");
  if (selection === "default" || selection === "custom") {
    assert.match(source, /kello\/extensions\/hypopg/);
    assert.match(source, /createHypopg_1_4_3/);
    assert(source.includes("cba16a038628eb85dd40262f5d657ecdb01f755a3bc1314e24098278ea441fff"));
  }
  assert.doesNotMatch(source, /tooling\/extensions|kello\.config|\.\.\/schema/);
  const checked = spawnSync(process.execPath, ["node_modules/typescript/bin/tsc", "-p", join(project, "tsconfig.json")], { encoding: "utf8" });
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  for (const scope of selection === "default" || selection === "custom" ? ["kello", "kello/components/planner"] : ["kello"]) {
    const output = join(project, scope === "kello" ? "root.mjs" : "child.mjs");
    const bundled = await build({ entryPoints: [join(project, scope, "_generated/extensions.ts")], bundle: true, platform: "node", format: "esm", target: "node24", outfile: output, metafile: true, external });
    const inputs = Object.keys(bundled.metafile.inputs);
    assert(!inputs.some(path => path.includes("/tooling/")));
    assert(!inputs.some(path => path.includes("/core/extensions/adapters/") && !/hypopg(?:-codecs)?\.js$/.test(path) && !(scope === "kello" && /pg-trgm\.js$/.test(path))));
    assert.equal(inputs.some(path => path.endsWith("/adapters/hypopg.js")), selection === "default" || selection === "custom");
    const { extensions } = await import(output);
    const native = spawnSync(node, ["--input-type=module", "--eval", 'import assert from "node:assert/strict"; await import(' + JSON.stringify(output) + '); assert.equal(process.versions.node.split(".")[0], "24");'], { encoding: "utf8" });
    assert.equal(native.status, 0, native.stdout + native.stderr);
    if (selection === "absent" || selection === "empty") assert.equal(extensions, undefined);
    else if (selection === "future") {
      assert.equal(extensions.hypopg.apiSupport.status, "unverified");
      assert.equal(extensions.hypopg.sql, undefined);
    } else {
      assert.deepEqual(Object.keys(extensions), scope === "kello" ? ["hypopg", "pg_trgm"] : ["hypopg"]);
      const api = extensions.hypopg;
      assert.equal(api.version, "1.4.3");
      assert.equal(api.schema, placement);
      assert.equal(Object.keys(api.sql.functions).length, 4);
      assert.equal(typeof api.createIndex, "object");
      outputs.push(output);
    }
  }
  assert.equal((await generateProject(project)).version, generated.version);
}
console.log("HypoPG frozen public first-load/disk generation, five selections, root/component types and Node 24 bundles PASS");
for (const output of outputs) {
  const native = spawnSync(node, ["--input-type=module", "--eval", 'import assert from "node:assert/strict"; const { extensions } = await import(' + JSON.stringify(output) + '); for (const [text, expected] of [["t", true], ["true", true], ["f", false], ["false", false], ["", null]]) { const api = extensions.hypopg; const hidden = api.hiddenCodec.decode("(42,index,public,items,btree," + text + ")"); assert.equal(hidden.is_hypo, expected); assert.deepEqual(api.hiddenCodec.decode(api.hiddenCodec.encode(hidden)), hidden); const array = { dimensions: [{ lowerBound: -2, length: 2 }], values: [hidden, null] }; assert.deepEqual(api.hiddenArrayCodec.decode(api.hiddenArrayCodec.encode(array)), array); }'], { encoding: "utf8" });
  assert.equal(native.status, 0, native.stdout + native.stderr);
}
console.log("HypoPG frozen public composite bool/null/array round trips PASS");
const runtime = await build({ entryPoints: ["native.mjs"], bundle: true, platform: "node", format: "esm", target: "node24", outfile: "native-bundle.mjs", metafile: true, external: external.filter(name => name !== "kello/server") });
assert(!Object.keys(runtime.metafile.inputs).some(path => /\/tooling\/index\.js$/.test(path)));
assert(!/from ["']bun(?:["':])/.test(await readFile("native-bundle.mjs", "utf8")));
const imported = spawnSync(node, ["--input-type=module", "--eval", 'import assert from "node:assert/strict"; const { withHypopg } = await import("kello/tooling/extensions/hypopg"); const { connectDatabase } = await import("kello/server"); const { extensions } = await import("./custom/child.mjs"); assert.equal(typeof withHypopg, "function"); assert.equal(typeof connectDatabase, "function"); assert.equal(extensions.hypopg.version, "1.4.3"); assert.equal(typeof globalThis.Bun, "undefined");'], { encoding: "utf8" });
assert.equal(imported.status, 0, imported.stdout + imported.stderr);
const environment = { ...process.env };
delete environment.LOOM_PACKED_HYPOPG_DATABASE_URL;
const preflight = spawnSync(node, ["native-bundle.mjs"], { encoding: "utf8", env: environment });
assert.equal(preflight.status, 1, preflight.stdout + preflight.stderr);
assert.match(preflight.stderr, /Parent must supply an owned empty HypoPG fixture database URL/);
console.log("HypoPG frozen public native runtime bundle and cold Node 24 operator/server imports PASS");
`,
    );
    const result = spawnSync("bun", [join(root, "public.mjs"), node], {
      cwd: root,
      encoding: "utf8",
      timeout: 180000,
      maxBuffer: 8 * 1024 * 1024,
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    let nativeOutput = "";
    if (localFixtureURL) {
      const native = spawnSync(node, [join(root, "native-bundle.mjs")], {
        cwd: root,
        encoding: "utf8",
        timeout: 120000,
        maxBuffer: 8 * 1024 * 1024,
        env: { ...process.env, LOOM_PACKED_HYPOPG_DATABASE_URL: localFixtureURL },
      });
      nativeOutput = (native.stdout + native.stderr)
        .replaceAll(localFixtureURL, "[redacted]")
        .replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
      assert.equal(native.status, 0, nativeOutput);
    }
    return {
      artifactDigest,
      lockDigest,
      installedFiles,
      publicGeneration: "passed",
      publicCompositeCodecs: "passed",
      operatorArtifactUsesNativeBooleanCodec:
        /nullableCodec\(hypopgIndexFields\.indisunique\)/.test(operator.toString("utf8")) &&
        !/nullableCodec\(booleanCodec\)/.test(operator.toString("utf8")),
      nativeRuntimePreparation: "passed",
      nativeOperatorRuntime: localFixtureURL ? "passed" : "pending-owned-hypopg-fixture-url",
      nativeOperatorAcceptance: "pending-parent-authoritative-frozen-live-evidence",
      output: result.stdout + nativeOutput,
    };
  } finally {
    await rm(root, { recursive: true, force: true });
    assert.equal(sha256(await readFile(archive)), artifactDigest);
    assert.equal(await consumerLockfileSha256(consumer), lockDigest);
    assert.equal(await assertInstalledPackageMatchesTarball(consumer, bytes), installedFiles);
  }
}
