import assert from "node:assert/strict";
import { appendFile, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "../fixtures/proof-artifact";

const consumer = process.env.PGROUTING_FROZEN_CONSUMER_ROOT;
const artifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
const expectedArtifact = process.env.PGROUTING_ARTIFACT_SHA256;
const expectedLock = process.env.PGROUTING_CONSUMER_LOCK_SHA256;
const oracle = process.env.PGROUTING_PROOF_URL;
const node = process.env.PGROUTING_NODE24;
assert(
  consumer && artifactPath && expectedArtifact && expectedLock && oracle && node,
  "Parent fresh integrated frozen artifact and explicit Node24/local oracle are required",
);
assert.equal(new URL(oracle).hostname, "127.0.0.1");
const bytes = await readFile(artifactPath);
assert.equal(sha256(bytes), expectedArtifact);
assert.equal(await consumerLockfileSha256(consumer), expectedLock);
const matchedPackageFiles = await assertInstalledPackageMatchesTarball(consumer, bytes);
const root = join(consumer, `pgrouting-${crypto.randomUUID()}`);
await mkdir(root);
await symlink(join(consumer, "node_modules"), join(root, "node_modules"));
await writeFile(join(root, "package.json"), '{"private":true,"type":"module"}\n');
const fixtures = fileURLToPath(new URL("../fixtures", import.meta.url));
for (const name of ["pgrouting-generated-project.ts", "pgrouting-public-generation.ts", "pgrouting-packed-node24.ts"])
  await writeFile(join(root, name), await readFile(join(fixtures, name)));
try {
  const { preparePgroutingPublicProjects } = await import(
    pathToFileURL(join(root, "pgrouting-public-generation.ts")).href
  );
  const projects = await preparePgroutingPublicProjects(root, join(consumer, "node_modules"), oracle);
  const cold = Bun.spawn([node, "--experimental-transform-types", join(root, "pgrouting-packed-node24.ts")], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  const output = (await new Response(cold.stdout).text()) + (await new Response(cold.stderr).text());
  await writeFile(join(root, "cold-node24.log"), output);
  assert.equal(await cold.exited, 0, output);
  await writeFile(
    join(root, "public-proof.json"),
    JSON.stringify(
      {
        artifactSha256: expectedArtifact,
        lockSha256: expectedLock,
        matchedPackageFiles,
        projects,
        toolingRuntime: "Bun",
        coldRuntime: "Node24",
        installs: 0,
        nativeRepair: "blocked",
        fullMemberAcceptance: false,
        providerAcceptance: "pending",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`pgRouting public proof passed; evidence=${root}`);
} finally {
  const records = (await readFile(join(root, "resources.jsonl"), "utf8").catch(() => ""))
    .trim()
    .split("\n")
    .filter(Boolean);
  const admin = new pg.Client({ connectionString: oracle });
  await admin.connect();
  try {
    for (const record of records) {
      const entry: { event: string; database: string; runtimeRole: string } = JSON.parse(record);
      if (entry.event !== "database-create-intent") continue;
      assert(/^pgr_[0-9a-f]{32}$/.test(entry.database) && /^pgr_[0-9a-f]{32}$/.test(entry.runtimeRole));
      await admin.query(`DROP DATABASE IF EXISTS ${pg.escapeIdentifier(entry.database)} WITH (FORCE)`);
      await admin.query(`DROP ROLE IF EXISTS ${pg.escapeIdentifier(entry.runtimeRole)}`);
      assert.equal((await admin.query("SELECT 1 FROM pg_database WHERE datname=$1", [entry.database])).rows.length, 0);
      assert.equal((await admin.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [entry.runtimeRole])).rows.length, 0);
      await appendFile(
        join(root, "cleanup.jsonl"),
        JSON.stringify({
          event: "independent-absence-proven",
          database: entry.database,
          runtimeRole: entry.runtimeRole,
        }) + "\n",
      );
    }
  } finally {
    await admin.end();
  }
  assert.equal(await consumerLockfileSha256(consumer), expectedLock);
  assert.equal(await assertInstalledPackageMatchesTarball(consumer, bytes), matchedPackageFiles);
}
