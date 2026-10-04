import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { copyFile, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "./proof-artifact";

/** No installation/build: use the parent's immutable, frozen tarball consumer. */
export async function runLakebaseVectorPreparedGeneration(native: boolean): Promise<void> {
  const consumer = process.env.LOOM_LAKEBASE_VECTOR_FROZEN_CONSUMER_ROOT;
  const artifact = process.env.LOOM_LAKEBASE_VECTOR_TARBALL;
  assert(
    consumer && artifact,
    "Parent must supply frozen consumer root and its exact tarball; source imports are not generation",
  );
  if (native)
    assert(
      process.env.LOOM_LAKEBASE_VECTOR_DATABASE_URL,
      "Parent must supply its private exact 1.1.1 native fixture URL",
    );
  const bytes = await readFile(artifact);
  const hash = sha256(bytes);
  const lock = await consumerLockfileSha256(consumer);
  assert((await assertInstalledPackageMatchesTarball(consumer, bytes)) > 1);
  const root = await mkdtemp(join(consumer, `lakebase-vector-${randomUUID()}-`));
  try {
    await symlink(join(consumer, "node_modules"), join(root, "node_modules"));
    await writeFile(join(root, "package.json"), '{"private":true,"type":"module"}\n');
    for (const file of [
      "lakebase-vector-generated-project.ts",
      "lakebase-vector-generated-rpc.mjs.fixture",
      "lakebase-vector-native.ts",
      "lakebase-vector-public-types.ts.fixture",
      "lakebase-vector-public-static.mjs.fixture",
    ]) {
      await copyFile(new URL(`./${file}`, import.meta.url), join(root, file));
    }
    await copyFile(
      new URL("../../../apps/loom/src/tooling/extensions/manifests/lakebase_vector.json", import.meta.url),
      join(root, "lakebase_vector.json"),
    );
    await writeFile(
      join(root, "generate.ts"),
      `import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { writeLakebaseVectorProject, checkLakebaseVectorDiskBindings } from "./lakebase-vector-generated-project";
const receipts = [];
const quoted = process.argv[2] === "quoted";
const cases = quoted ? [["selected", 'Lake"日本', 'Vec"日本']] : [["omitted"], ["empty"], ["future"], ["selected"], ["selected", "lakebase_vector_custom", "vector_custom"]];
for (const [selection, schema, vectorSchema] of cases) {
  const project = join(process.cwd(), selection + (quoted ? "-quoted" : schema ? "-custom" : "-default"));
  await initializeProject(project, "lakebasevector");
  await writeLakebaseVectorProject(project, selection, schema, vectorSchema);
  await assert.rejects(readFile(join(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
  await loadProject(project);
  const generation = await generateProject(project);
  await checkLakebaseVectorDiskBindings(project, selection, schema, vectorSchema);
  if (selection === "selected") await copyFile("lakebase-vector-public-types.ts.fixture", join(project, "kello/lakebase-vector-public-types.ts"));
  const checked = spawnSync(process.execPath, ["node_modules/typescript/bin/tsc", "-p", join(project, "tsconfig.json")], { encoding: "utf8" });
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  assert.equal((await generateProject(project)).version, generation.version);
  await writeFile(join(project, "generation.json"), JSON.stringify({ version: generation.version, selection, schema: schema ?? "extensions", vectorSchema: vectorSchema ?? "extensions" }));
  const receipt = { project, selection, schema: schema ?? "extensions", vectorSchema: vectorSchema ?? "extensions", generation: generation.version, virtualLoad: true, emittedDisk: true, publicTypes: true };
  receipts.push(receipt);
  console.log(JSON.stringify(receipt));
}
if (!quoted) for (const [name, vector] of [["missing-companion", undefined], ["unverified-companion", { version: "future" }]]) {
  const project = join(process.cwd(), name);
  await initializeProject(project, "lakebasevector");
  await writeLakebaseVectorProject(project, "selected");
  const extensions = { lakebase_vector: { version: "1.1.1" }, ...(vector && { vector }) };
  await writeFile(join(project, "kello.config.ts"), 'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: ' + JSON.stringify(extensions) + ' } });\\n');
  await assert.rejects(loadProject(project), /requires its exact selected vector 0.8.6 companion contract/);
  console.log(JSON.stringify({ project, selection: name, rejection: "exact companion required before schema evaluation" }));
}
await writeFile(quoted ? "quoted-generation-receipts.json" : "generation-receipts.json", JSON.stringify(receipts));
console.log(JSON.stringify({ generation: receipts }));\n`,
    );
    const run = async (command: string[], cwd = root) => {
      const child = Bun.spawn(command, { cwd, env: process.env, stdout: "pipe", stderr: "pipe", timeout: 180000 });
      const [out, err, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      const url = process.env.LOOM_LAKEBASE_VECTOR_DATABASE_URL;
      const output = url ? (out + err).replaceAll(url, "[parent private fixture]") : out + err;
      assert.equal(code, 0, output);
      console.info(output.trim());
    };
    await run(["bun", "generate.ts"]);
    await copyFile(join(root, "lakebase-vector-public-static.mjs.fixture"), join(root, "public-static.mjs"));
    const staticReceipts = JSON.parse(await readFile(join(root, "generation-receipts.json"), "utf8"));
    for (const receipt of staticReceipts)
      await run([process.env.LOOM_LAKEBASE_VECTOR_NODE24 ?? "node", "public-static.mjs", receipt.project]);
    // Preserve the original quoted-schema generation gate after the independent static checks.
    await run(["bun", "generate.ts", "quoted"]);
    const quotedReceipts = JSON.parse(await readFile(join(root, "quoted-generation-receipts.json"), "utf8"));
    for (const receipt of quotedReceipts)
      await run([process.env.LOOM_LAKEBASE_VECTOR_NODE24 ?? "node", "public-static.mjs", receipt.project]);
    if (native) {
      await writeFile(
        join(root, "prepare.ts"),
        `import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { bootstrapDatabase } from "kello/tooling";
const file = join(process.argv[2], "generation.json");
const generation = JSON.parse(await readFile(file, "utf8"));
const { default: pg } = await import("pg");
if (process.argv[3] === "cleanup") {
  if (generation.prepared) {
    const client = new pg.Client({ connectionString: process.env.LOOM_LAKEBASE_VECTOR_DATABASE_URL });
    try {
      await client.connect();
      const role = pg.escapeIdentifier(generation.prepared.runtimeRole);
      await client.query('DROP SCHEMA IF EXISTS ' + pg.escapeIdentifier(generation.prepared.metadataNamespace) + ' CASCADE');
      if ((await client.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [generation.prepared.runtimeRole])).rowCount)
        await client.query('GRANT ' + role + ' TO CURRENT_USER; DROP OWNED BY ' + role + '; DROP ROLE ' + role);
      assert.equal((await client.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [generation.prepared.runtimeRole])).rowCount, 0);
      assert.equal((await client.query('SELECT 1 FROM pg_namespace WHERE nspname=$1', [generation.prepared.metadataNamespace])).rowCount, 0);
      delete generation.prepared.runtimePassword;
      await writeFile(file, JSON.stringify(generation), { mode: 0o600 });
    } finally { await client.end(); }
  }
} else {
const prepared = { runtimeRole: "lv_rpc_" + randomUUID().replaceAll("-", ""), runtimePassword: randomUUID().replaceAll("-", ""), metadataNamespace: "loom_lv_" + randomUUID().replaceAll("-", "") };
assert(process.env.LOOM_LAKEBASE_VECTOR_DATABASE_URL);
await chmod(file, 0o600);
await writeFile(file, JSON.stringify({ ...generation, prepared }), { mode: 0o600 });
await bootstrapDatabase({ connectionString: process.env.LOOM_LAKEBASE_VECTOR_DATABASE_URL, ...prepared });
const client = new pg.Client({ connectionString: process.env.LOOM_LAKEBASE_VECTOR_DATABASE_URL });
try {
  await client.connect();
  await client.query('ALTER ROLE ' + pg.escapeIdentifier(prepared.runtimeRole) + ' LOGIN PASSWORD ' + pg.escapeLiteral(prepared.runtimePassword));
} finally { await client.end(); }
}\n`,
      );
      const receipts = [...staticReceipts, ...quotedReceipts];
      for (const receipt of receipts) {
        await copyFile(join(root, "lakebase-vector-generated-rpc.mjs.fixture"), join(receipt.project, "cold-rpc.mjs"));
        try {
          await run(["bun", "prepare.ts", receipt.project]);
          await run([process.env.LOOM_LAKEBASE_VECTOR_NODE24 ?? "node", "cold-rpc.mjs"], receipt.project);
        } finally {
          await run(["bun", "prepare.ts", receipt.project, "cleanup"]);
        }
      }
      // This is the independent catalog oracle, outside generated application/runtime code.
      const observer = new pg.Client({ connectionString: process.env.LOOM_LAKEBASE_VECTOR_DATABASE_URL! });
      await observer.connect();
      try {
        const observed = await captureExtensionContract(observer, {
          name: "lakebase_vector",
          provider: "neon",
          fixture: "parent-private-lakebase-vector-packed-native",
        });
        await writeFile(join(root, "observed-lakebase_vector.json"), JSON.stringify(observed));
        const observedVector = await captureExtensionContract(observer, {
          name: "vector",
          provider: "neon",
          fixture: "parent-private-lakebase-vector-packed-companion",
        });
        await writeFile(join(root, "observed-vector.json"), JSON.stringify(observedVector));
      } finally {
        await observer.end();
      }
      await writeFile(
        join(root, "native.ts"),
        `import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { connectDatabase, defineSchema } from "kello/server";
import { runLakebaseVectorNative } from "./lakebase-vector-native.ts";
assert.equal(process.versions.node.split(".")[0], "24");
const receipts = JSON.parse(await readFile("generation-receipts.json", "utf8"));
const project = receipts.find(r => r.selection === "selected" && r.schema === "extensions").project;
const { extensions } = await import(pathToFileURL(project + "/kello/_generated/extensions.ts").href);
const manifest = JSON.parse(await readFile("lakebase_vector.json", "utf8"));
const observed = JSON.parse(await readFile("observed-lakebase_vector.json", "utf8"));
const observedVector = JSON.parse(await readFile("observed-vector.json", "utf8"));
await runLakebaseVectorNative(extensions.lakebase_vector, manifest, process.env.LOOM_LAKEBASE_VECTOR_DATABASE_URL, observed, observedVector, { connectDatabase, defineSchema });\n`,
      );
      await run([process.env.LOOM_LAKEBASE_VECTOR_NODE24 ?? "node", "native.ts"]);
    }
  } finally {
    try {
      assert.equal(await consumerLockfileSha256(consumer), lock);
      assert.equal(sha256(await readFile(artifact)), hash);
      assert((await assertInstalledPackageMatchesTarball(consumer, bytes)) > 1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
}
