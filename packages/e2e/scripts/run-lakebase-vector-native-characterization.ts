import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { copyFile, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/lakebase_vector.json";
import vectorManifest from "../../../apps/loom/src/tooling/extensions/manifests/vector.json";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";

const connectionString = process.env.LOOM_LAKEBASE_VECTOR_DATABASE_URL;
const consumer = process.env.LOOM_LAKEBASE_VECTOR_FROZEN_CONSUMER_ROOT;
assert(
  connectionString,
  "Parent private exact lakebase_vector 1.1.1 URL is required; absence is a blocker, never skipped acceptance",
);
assert(
  consumer,
  "Parent frozen public package is required; native source-import adapter calls are not packed public proof",
);
const client = new pg.Client({ connectionString });
await client.connect();
let observed;
let observedVector;
try {
  observed = await captureExtensionContract(client, {
    name: "lakebase_vector",
    provider: "neon",
    fixture: "parent-private-lakebase-vector-native",
  });
  assert.equal(observed.contract.version, "1.1.1");
  assert.equal(
    observed.digest,
    manifest.digest,
    "Observed native target must exactly match the original manifest identity",
  );
  observedVector = await captureExtensionContract(client, {
    name: "vector",
    provider: "neon",
    fixture: "parent-private-lakebase-vector-companion",
  });
  assert.equal(observedVector.digest, vectorManifest.digest);
  assert.equal(observedVector.contract.version, "0.8.6");
} finally {
  await client.end();
}
const root = await mkdtemp(join(tmpdir(), `lakebase-vector-${randomUUID()}-`));
try {
  await symlink(join(consumer, "node_modules"), join(root, "node_modules"));
  await writeFile(join(root, "package.json"), '{"private":true,"type":"module"}\n');
  await copyFile(
    new URL("../fixtures/lakebase-vector-native.ts", import.meta.url),
    join(root, "lakebase-vector-native.ts"),
  );
  await writeFile(join(root, "manifest.json"), JSON.stringify(manifest));
  await writeFile(join(root, "observed.json"), JSON.stringify(observed));
  await writeFile(join(root, "observed-vector.json"), JSON.stringify(observedVector));
  await writeFile(
    join(root, "native.ts"),
    `
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createLakebaseVector_1_1_1 } from "kello/extensions/lakebase-vector";
import { connectDatabase, defineSchema } from "kello/server";
import { runLakebaseVectorNative } from "./lakebase-vector-native.ts";
assert.equal(process.versions.node.split(".")[0], "24");
const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
const observed = JSON.parse(await readFile("observed.json", "utf8"));
const observedVector = JSON.parse(await readFile("observed-vector.json", "utf8"));
const api = createLakebaseVector_1_1_1({ name: "lakebase_vector", version: "1.1.1", schema: observed.provenance.installationSchema, apiSupport: { status: "verified", digest: manifest.digest } }, { name: "vector", version: "0.8.6", schema: observedVector.provenance.installationSchema, apiSupport: { status: "verified", digest: "4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4" } });
await runLakebaseVectorNative(api, manifest, process.env.LOOM_LAKEBASE_VECTOR_DATABASE_URL, observed, observedVector, { connectDatabase, defineSchema });
`,
  );
  const child = Bun.spawn([process.env.LOOM_LAKEBASE_VECTOR_NODE24 ?? "node", "native.ts"], {
    cwd: root,
    env: process.env,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 300000,
  });
  const [out, err, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  const output = (out + err).replaceAll(connectionString, "[parent private fixture]");
  console.log(output.trim());
  assert.equal(code, 0, output);
} finally {
  await rm(root, { recursive: true, force: true });
}
