import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "bun:test";
import { anonGeneratedDigest } from "../fixtures/anon-generated-project";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256 } from "../fixtures/proof-artifact";

/** Installation and frozen-lockfile reconstruction are parent-owned prerequisites. This test never installs. */
test("cold Node24 anon public frozen consumer: generation, RPC/Effect and isolated bundle", async () => {
  const consumer = process.env.ANON_FROZEN_CONSUMER_ROOT;
  const artifact = process.env.ANON_PACKED_ARTIFACT;
  const url = process.env.ANON_LOCAL_URL;
  const customUrl = process.env.ANON_CUSTOM_LOCAL_URL;
  assert(
    consumer &&
      artifact &&
      url &&
      customUrl &&
      /@127\.0\.0\.1:\d+\//.test(url) &&
      /@127\.0\.0\.1:\d+\//.test(customUrl),
    "Parent must provide frozen consumer root, packed artifact and owned local PG18 URL; this test never installs dependencies",
  );
  const lock = await consumerLockfileSha256(consumer);
  assert((await assertInstalledPackageMatchesTarball(consumer, await readFile(artifact))) > 1);
  const root = await mkdtemp(join(tmpdir(), "loom-packed-anon-"));
  try {
    await symlink(join(consumer, "node_modules"), join(root, "node_modules"));
    for (const name of ["anon-generated-project", "anon-generated-rpc"]) {
      await writeFile(join(root, `${name}.ts`), await readFile(new URL(`../fixtures/${name}.ts`, import.meta.url)));
    }
    await writeFile(join(root, "package.json"), '{"private":true,"type":"module"}\n');
    // kello/tooling statically imports bun: generation and administrative bootstrap run under Bun; a separate cold
    // Node 24 process then executes the emitted runtime without loading tooling.
    await writeFile(
      join(root, "prepare.ts"),
      `
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { writeAnonSelectedProject, writeAnonEmptyProject, writeAnonFutureProject, checkAnonDiskBindings } from "./anon-generated-project.ts";
import { prepareAnonGeneratedRpc } from "./anon-generated-rpc.ts";
const runs = [];
for (const selection of ["empty", "explicit-empty", "future", "selected", "custom"]) {
  const project = join(process.cwd(), selection);
  await initializeProject(project, "anon" + selection);
  if (selection === "empty" || selection === "explicit-empty") await writeAnonEmptyProject(project, selection === "explicit-empty");
  if (selection === "future") await writeAnonFutureProject(project);
  const placement = selection === "custom" ? "anon_cache" : "extensions";
  const url = selection === "custom" ? process.env.ANON_CUSTOM_LOCAL_URL : process.env.ANON_LOCAL_URL;
  if (selection === "selected" || selection === "custom") await writeAnonSelectedProject(project,selection === "custom" ? placement : undefined);
  await assert.rejects(readFile(join(project,"kello/_generated/extensions.ts")), {code:"ENOENT"});
  await loadProject(project);
  const generated = await generateProject(project);
  const disk = await import(pathToFileURL(join(project,"kello/_generated/extensions.ts")).href);
  if (selection === "empty" || selection === "explicit-empty") assert.equal(disk.extensions, undefined);
  if (selection === "future") {
    assert.equal(disk.extensions.anon.apiSupport.status,"unverified");
    assert.equal("sql" in disk.extensions.anon, false);
  }
  if (selection === "selected" || selection === "custom") {
    await checkAnonDiskBindings(project,placement);
  }
  const child = await import(pathToFileURL(join(project,"kello/components/remote/_generated/extensions.ts")).href);
  if(selection === "empty" || selection === "explicit-empty") assert.equal(child.extensions,undefined);
  else assert.equal(child.extensions.anon.version,selection === "future" ? "future" : "2.5.1");
  const checked = spawnSync(process.execPath,["node_modules/typescript/bin/tsc","-p",join(project,"tsconfig.json")],{encoding:"utf8"});
  assert.equal(checked.status,0,checked.stdout + checked.stderr);
  const expected = selection === "future" ? {mode:"future",child:"future"} : selection === "empty" || selection === "explicit-empty" ? {mode:"empty",child:"empty"} : undefined;
  assert.equal((await generateProject(project)).version,generated.version);
  runs.push({project,version:generated.version,url,placement,prepared:await prepareAnonGeneratedRpc(url),expected});
}
await writeFile("prepared.json",JSON.stringify(runs));
console.log("Bun frozen anon omitted/empty/future/default/custom first-load, disk generation and bootstrap PASS");
`,
    );
    await writeFile(
      join(root, "cold.ts"),
      `
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runAnonGeneratedRpc } from "./anon-generated-rpc.ts";
assert.equal(process.versions.node.split(".")[0], "24");
for (const run of JSON.parse(await readFile("prepared.json","utf8")))
  await runAnonGeneratedRpc(run.project,run.version,run.url,run.placement,run.prepared,run.expected);
console.log("Node24 cold frozen anon host/mounted generated RPC/Effect PASS");
`,
    );
    const run = async (file: string, runtime = process.env.ANON_NODE24 ?? "node") => {
      const child = Bun.spawn([runtime, file], {
        cwd: root,
        env: process.env,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 180000,
      });
      const output = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
      assert.equal(await child.exited, 0, output.join("\n").replaceAll(url, "[local fixture]"));
    };
    await run("prepare.ts", process.execPath);
    await run("cold.ts");
    await writeFile(
      join(root, "bundle-entry.ts"),
      `
import assert from "node:assert/strict";
import { createAnon_2_5_1, ANON_DIGEST } from "kello/extensions/anon";
import { defineSchema, connectDatabase } from "kello/server";
import { defineRelations, sql } from "drizzle-orm";
assert.equal(ANON_DIGEST, ${JSON.stringify(anonGeneratedDigest)});
const api = createAnon_2_5_1({name:"anon",version:"2.5.1",schema:"extensions",apiSupport:{status:"verified",digest:ANON_DIGEST}});
const schema = defineSchema(() => ({}));
const connection = await connectDatabase({schema,relations:defineRelations(schema.tables),connectionString:process.env.ANON_LOCAL_URL});
try {
  const rows = await connection.transaction(db => db.select({version:api.sql.functions.version(),email:api.sql.functions.partial_email("daamien@gmail.com")}).from(sql.raw("(VALUES(1)) AS fixture(id)")));
  assert.deepEqual(rows,[{version:"2.5.1",email:"da******@gm******.com"}]);
} finally {await connection.close();}
console.log("isolated native anon runtime bundle PASS");
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
