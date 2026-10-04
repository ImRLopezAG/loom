import assert from "node:assert/strict";
import { copyFile, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "./proof-artifact";
import { withExtensionDatabase } from "./extension-database";

/** No installation/build: use the parent's immutable, frozen tarball consumer. */
export async function runH3PreparedConsumer(): Promise<void> {
  const consumer = process.env.LOOM_H3_FROZEN_CONSUMER_ROOT;
  const artifact = process.env.LOOM_H3_TARBALL ?? process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
  assert(
    consumer && artifact,
    "Parent must supply LOOM_H3_FROZEN_CONSUMER_ROOT and LOOM_H3_TARBALL; source imports and local pack are not the consumer gate",
  );
  const bytes = await readFile(artifact);
  const hash = sha256(bytes);
  const lock = await consumerLockfileSha256(consumer);
  assert((await assertInstalledPackageMatchesTarball(consumer, bytes)) > 1);
  const root = await mkdtemp(join(tmpdir(), "loom-h3-prepared-consumer-"));
  const fixtures = fileURLToPath(new URL(".", import.meta.url));
  const node = process.env.LOOM_H3_NODE24 ?? "node";
  try {
    await symlink(join(consumer, "node_modules"), join(root, "node_modules"));
    await writeFile(join(root, "package.json"), '{"private":true,"type":"module"}\n');
    for (const name of ["h3-generated-project.ts", "h3-generated-rpc.ts"])
      await copyFile(join(fixtures, name), join(root, name));
    await writeFile(
      join(root, "generate.ts"),
      `import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import {
  H3_CUSTOM_SCHEMA,
  checkH3DiskBindings,
  writeH3EmptyProject,
  writeH3FutureProject,
  writeH3SelectedProject,
} from "./h3-generated-project.ts";
const generated = {};
for (const selection of ["empty", "future", "selected", "custom"]) {
  const project = join(process.cwd(), selection);
  await initializeProject(project, "h3" + selection);
  await (await import("node:fs/promises")).symlink(join(process.cwd(), "node_modules"), join(project, "node_modules"));
  if (selection === "empty") await writeH3EmptyProject(project);
  if (selection === "future") await writeH3FutureProject(project);
  if (selection === "selected") await writeH3SelectedProject(project);
  if (selection === "custom") await writeH3SelectedProject(project, H3_CUSTOM_SCHEMA);
  await assert.rejects(readFile(join(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
  await loadProject(project);
  const result = await generateProject(project);
  const disk = await import(pathToFileURL(join(project, "kello/_generated/extensions.ts")).href);
  if (selection === "empty") assert.equal(disk.extensions, undefined);
  if (selection === "future") {
    assert.equal(disk.extensions.h3.apiSupport.status, "unverified");
    assert.equal("latLngToCell" in disk.extensions.h3, false);
  }
  if (selection === "selected") await checkH3DiskBindings(project, "extensions");
  if (selection === "custom") await checkH3DiskBindings(project, H3_CUSTOM_SCHEMA);
  const checked = spawnSync(process.execPath, ["node_modules/typescript/bin/tsc", "-p", join(project, "tsconfig.json")], { encoding: "utf8" });
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  assert.equal((await generateProject(project)).version, result.version);
  generated[selection] = { project, version: result.version };
}
await writeFile("runtime-state.json", JSON.stringify(generated));
console.log("h3 no-install prepared consumer empty/future/selected/custom generateProject through installed kello PASS");
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
const selectedAdapter = (path) => path.endsWith("/adapters/h3.js") || path.endsWith("/adapters/h3-codecs.js");
async function bundle(name) {
  const entry = name === "selected" || name === "custom"
    ? state[name].project + "/kello/_generated/extensions.ts"
    : state[name].project + "/kello/_generated/extensions.ts";
  const result = await build({
    entryPoints: [entry],
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
  const selected = name === "selected" || name === "custom";
  assert.equal(inputs.some((path) => path.endsWith("/adapters/h3.js")), selected);
  const text = result.outputFiles[0].text;
  assert(!/\\bBun\\b|from ["']bun(?:["':])/.test(text));
  await writeFile(name + ".mjs", text);
  const { extensions } = await import(pathToFileURL(name + ".mjs").href);
  if (selected) {
    assert.deepEqual(Object.keys(extensions), ["h3"]);
    assert.equal(Object.keys(extensions.h3.sql.overloads).length, 87);
  } else if (name === "future") {
    assert.equal(extensions.h3.apiSupport.status, "unverified");
    assert.equal(extensions.h3.latLngToCell, undefined);
  } else assert.equal(extensions, undefined);
}
for (const name of ["selected", "custom", "future", "empty"]) await bundle(name);
console.log("cold Node24 h3 selected/custom/future/empty bundles PASS");
`,
    );
    await writeFile(
      join(root, "native.ts"),
      `import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { H3_CUSTOM_SCHEMA } from "./h3-generated-project.ts";
import { provisionH3Placement, runH3GeneratedRpc } from "./h3-generated-rpc.ts";
assert.equal(process.versions.node.split(".")[0], "24");
const state = JSON.parse(await readFile("runtime-state.json", "utf8"));
const url = process.env.LOOM_PACKED_H3_DATABASE_URL;
const selection = process.env.LOOM_H3_NATIVE_SELECTION;
assert(url, "Prepared consumer native queries need the disposable local fixture URL");
assert(selection === "selected" || selection === "custom", "One placement per disposable database");
const placement = selection === "custom" ? H3_CUSTOM_SCHEMA : "extensions";
await provisionH3Placement(url, placement);
await runH3GeneratedRpc(state[selection].project, state[selection].version, url, placement);
console.log("cold Node24 generated native host/mounted RPC/Effect PASS " + selection);
`,
    );
    const run = async (
      binary: string,
      file: string,
      cwd = root,
      extra: { databaseUrl?: string; selection?: "selected" | "custom" } = {},
    ) => {
      const env = { ...process.env };
      if (extra.databaseUrl) env.LOOM_PACKED_H3_DATABASE_URL = extra.databaseUrl;
      if (extra.selection) env.LOOM_H3_NATIVE_SELECTION = extra.selection;
      const child = Bun.spawn([binary, file], { cwd, env, stdout: "pipe", stderr: "pipe", timeout: 240000 });
      let output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
      if (extra.databaseUrl) output = output.replaceAll(extra.databaseUrl, "[redacted]");
      assert.equal(await child.exited, 0, output);
      return output;
    };
    const nodeMajor = Bun.spawnSync([node, "-e", "process.stdout.write(process.versions.node)"], { stdout: "pipe" });
    assert.equal(nodeMajor.exitCode, 0, nodeMajor.stderr.toString());
    assert.equal(nodeMajor.stdout.toString().split(".")[0], "24", `Isolated consumer requires Node 24, not ${nodeMajor.stdout}`);
    await run("bun", "generate.ts");
    await run(node, "bundle.ts");
    for (const selection of ["selected", "custom"] as const) {
      await withExtensionDatabase(async (url) => {
        await run(node, "native.ts", root, { databaseUrl: url, selection });
      });
    }
    assert.equal(await consumerLockfileSha256(consumer), lock);
    assert.equal(sha256(await readFile(artifact)), hash);
    assert((await assertInstalledPackageMatchesTarball(consumer, bytes)) > 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
