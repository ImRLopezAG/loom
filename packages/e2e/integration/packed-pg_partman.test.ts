import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "bun:test";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256 } from "../fixtures/proof-artifact";

/** Installation and frozen-lockfile reconstruction are parent-owned prerequisites. */
test("cold Node24 pg_partman public frozen consumer: generation, RPC/Effect and isolated bundle", async () => {
  const consumer = process.env.PG_PARTMAN_FROZEN_CONSUMER_ROOT;
  const artifact = process.env.PG_PARTMAN_PACKED_ARTIFACT;
  const url = process.env.PG_PARTMAN_LOCAL_URL;
  assert(
    consumer && artifact && url,
    "Parent must provide frozen consumer root, packed artifact and owned local PG18 URL",
  );
  const lock = await consumerLockfileSha256(consumer);
  assert((await assertInstalledPackageMatchesTarball(consumer, await readFile(artifact))) > 1);
  const root = await mkdtemp(join(tmpdir(), "loom-packed-pg-partman-"));
  try {
    await symlink(join(consumer, "node_modules"), join(root, "node_modules"));
    for (const name of ["pg_partman-generated-project", "pg_partman-generated-rpc", "pg_partman-local-resources"]) {
      await writeFile(join(root, `${name}.ts`), await readFile(new URL(`../fixtures/${name}.ts`, import.meta.url)));
    }
    await writeFile(join(root, "package.json"), '{"private":true,"type":"module"}\n');
    await writeFile(
      join(root, "cold.ts"),
      `
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { writePgPartmanSelectedProject, writePgPartmanEmptyProject, writePgPartmanFutureProject, checkPgPartmanDiskBindings } from "./pg_partman-generated-project.ts";
import { preparePgPartmanGeneratedRpc } from "./pg_partman-generated-rpc.ts";
for (const selection of ["empty", "future", "selected"]) {
  const project = join(process.cwd(), selection);
  await initializeProject(project, "partman" + selection);
  if (selection === "empty") await writePgPartmanEmptyProject(project);
  if (selection === "future") await writePgPartmanFutureProject(project);
  if (selection === "selected") await writePgPartmanSelectedProject(project);
  await assert.rejects(readFile(join(project,"kello/_generated/extensions.ts")), {code:"ENOENT"});
  await loadProject(project);
  const generated = await generateProject(project);
  const disk = await import(pathToFileURL(join(project,"kello/_generated/extensions.ts")).href);
  if (selection === "empty") assert.equal(disk.extensions, undefined);
  if (selection === "future") {
    assert.equal(disk.extensions.pg_partman.apiSupport.status,"unverified");
    assert.equal("check_name_length" in disk.extensions.pg_partman, false);
  }
  if (selection === "selected") {
    await checkPgPartmanDiskBindings(project,"extensions");
    const prepared = await preparePgPartmanGeneratedRpc(process.env.PG_PARTMAN_LOCAL_URL);
    await writeFile("runtime-state.json",JSON.stringify({project,version:generated.version,prepared}));
  }
  const checked = spawnSync(process.execPath,["node_modules/typescript/bin/tsc","-p",join(project,"tsconfig.json")],{encoding:"utf8"});
  assert.equal(checked.status,0,checked.stdout + checked.stderr);
  assert.equal((await generateProject(project)).version,generated.version);
}
console.log("Bun-native frozen pg_partman empty/future/selected genuine generation and typecheck PASS");
`,
    );
    const run = async (file: string, binary = process.env.PG_PARTMAN_NODE24 ?? "node") => {
      const child = Bun.spawn([binary, file], {
        cwd: root,
        env: process.env,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 180000,
      });
      const output = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
      assert.equal(await child.exited, 0, output.join("\n").replaceAll(url, "[local fixture]"));
    };
    await run("cold.ts", "bun");
    await writeFile(
      join(root, "native.ts"),
      `
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { runPgPartmanGeneratedRpc } from "./pg_partman-generated-rpc.ts";
assert.equal(process.versions.node.split(".")[0], "24");
for (const selection of ["empty","future","selected"]) {
  const disk = await import(pathToFileURL(process.cwd()+"/"+selection+"/kello/_generated/extensions.ts").href);
  if(selection === "empty") assert.equal(disk.extensions,undefined);
  if(selection === "future") {assert.equal(disk.extensions.pg_partman.apiSupport.status,"unverified");assert.equal("check_name_length" in disk.extensions.pg_partman,false);}
  if(selection === "selected") assert.equal(disk.extensions.pg_partman.version,"5.1.0");
}
const state = JSON.parse(await readFile("runtime-state.json","utf8"));
await runPgPartmanGeneratedRpc(state.project,state.version,process.env.PG_PARTMAN_LOCAL_URL,"extensions",state.prepared);
console.log("cold Node24 generated native host/component RPC/Effect PASS");
`,
    );
    await run("native.ts");
    await writeFile(
      join(root, "bundle-entry.ts"),
      `
import assert from "node:assert/strict";
import { createPgPartman_5_1_0, pgPartmanDigest } from "kello/extensions/pg-partman";
import { defineSchema, connectDatabase } from "kello/server";
import { defineRelations, sql } from "drizzle-orm";
const api = createPgPartman_5_1_0({name:"pg_partman",version:"5.1.0",schema:"extensions",apiSupport:{status:"verified",digest:pgPartmanDigest}});
const schema = defineSchema(() => ({}));
const connection = await connectDatabase({schema,relations:defineRelations(schema.tables),connectionString:process.env.PG_PARTMAN_LOCAL_URL});
try {
  const rows = await connection.transaction(db => db.select({valid:api.check_partition_type("range"),missing:api.check_epoch_type(null)}).from(sql.raw("(VALUES(1)) AS fixture(id)")));
  assert.deepEqual(rows,[{valid:true,missing:null}]);
} finally {await connection.close();}
console.log("isolated native pg_partman runtime bundle PASS");
`,
    );
    const built = await Bun.build({
      entrypoints: [join(root, "bundle-entry.ts")],
      target: "node",
      packages: "bundle",
      outdir: join(root, "bundle"),
    });
    assert(built.success, built.logs.map(String).join("\n"));
    const bundle = await readFile(join(root, "bundle/bundle-entry.js"), "utf8");
    assert(!bundle.includes(fileURLToPath(new URL("../../../apps/loom/src/", import.meta.url))));
    await run("bundle/bundle-entry.js");
    assert.equal(await consumerLockfileSha256(consumer), lock);
    assert((await assertInstalledPackageMatchesTarball(consumer, await readFile(artifact))) > 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 240000);
