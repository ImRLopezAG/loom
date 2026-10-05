import assert from "node:assert/strict";
import { copyFile, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as v from "valibot";
import { extensionProofTest } from "../fixtures/extension-proof";
import { pgCronConsumerProofCase } from "../fixtures/pg_cron-proof-cases";
import { pgCronLocalUrl } from "../fixtures/pg_cron";
import {
  exercisePgCronRpc,
  pgCronGeneratedDigest,
  pgCronRpcResultValidator,
  type PgCronRpcResult,
  type PgCronSelection,
} from "../fixtures/pg_cron-generated-project";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "../fixtures/proof-artifact";

/** Parent owns packing and both isolated installs. This child consumes the retained frozen result. */
extensionProofTest(
  pgCronConsumerProofCase,
  async () => {
    const prepared = process.env.LOOM_PG_CRON_CONSUMER_ROOT;
    const artifact = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
    const expectedLock = process.env.LOOM_PG_CRON_CONSUMER_LOCK_SHA256;
    assert(
      prepared && artifact && expectedLock,
      "Parent must supply a fresh pg_cron tarball, frozen isolated consumer root and retained lock SHA256; this test never installs dependencies",
    );
    const root = await realpath(prepared);
    const bytes = await readFile(artifact);
    const artifactHash = sha256(bytes);
    const installedFilesCompared = await assertInstalledPackageMatchesTarball(root, bytes);
    assert(installedFilesCompared > 1);
    assert.equal(await consumerLockfileSha256(root), expectedLock);
    const work = join(root, "pg_cron_" + crypto.randomUUID().replaceAll("-", ""));
    await mkdir(work);
    async function run(command: string[], environment: Record<string, string> = {}) {
      const child = Bun.spawn(command, {
        cwd: work,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, ...environment },
        timeout: 180000,
      });
      const [out, err] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
      assert.equal(await child.exited, 0, `${command[0]} failed\n${out}${err}`);
      return out;
    }
    try {
      const nodeVersion = (
        await run([
          "node",
          "-e",
          "if(process.versions.node.split('.')[0]!=='24') throw new Error('Node24 required: '+process.version); console.log(process.version)",
        ])
      ).trim();
      await copyFile(
        fileURLToPath(new URL("../fixtures/pg_cron-generated-project.ts", import.meta.url)),
        join(work, "project-fixture.ts"),
      );
      await writeFile(
        join(work, "generate.ts"),
        `import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {initializeProject,loadProject,generateProject} from "kello/tooling";
import {writePgCronProject,checkPgCronDiskBindings} from "./project-fixture.ts";
const results=[];
for(const mode of ["selected","empty","unsupported"] as const){
const root=join(process.cwd(),mode);const namespace="cron_pack_"+crypto.randomUUID().replaceAll("-","").slice(0,16);
await initializeProject(root,namespace);await writePgCronProject(root,mode,namespace);
await assert.rejects(readFile(join(root,"kello/_generated/extensions.ts")),{code:"ENOENT"});
assert(await loadProject(root));const generated=await generateProject(root);
await checkPgCronDiskBindings(root,mode);assert.equal((await generateProject(root)).version,generated.version);
results.push({mode,version:generated.version});
}
console.log(JSON.stringify(results));`,
      );
      const results = v.parse(
        v.array(v.strictObject({ mode: v.picklist(["selected", "empty", "unsupported"]), version: v.string() })),
        JSON.parse((await run(["bun", "generate.ts"])).trim()),
      );
      assert.deepEqual(
        results.map((r) => r.mode),
        ["selected", "empty", "unsupported"],
      );
      await writeFile(
        join(work, "imports.mjs"),
        `import assert from "node:assert/strict";
import {createPgCron_1_6} from "kello/extensions/pg-cron";
import {withPgCron} from "kello/tooling/extensions/pg-cron";
const api=createPgCron_1_6({name:"pg_cron",version:"1.6",schema:"pg_catalog",apiSupport:{status:"verified",digest:${JSON.stringify(pgCronGeneratedDigest)}}});
assert.equal(typeof withPgCron,"function");assert.equal(typeof api.jobRows,"function");assert.deepEqual(Object.keys(api.sql.functions),[]);
assert.equal("schedule" in api,false);
assert.throws(()=>createPgCron_1_6({...api,apiSupport:{status:"unverified"}}),/exact verified/);`,
      );
      await run(["node", "imports.mjs"]);
      const coldResults: { mode: PgCronSelection; version: string; result: PgCronRpcResult }[] = [];
      for (const { mode, version } of results) {
        await run([join(root, "node_modules/.bin/tsc"), "-p", join(work, mode, "tsconfig.json")]);
        const relative = `./${mode}/.loom/generations/${version}/runtime.js`;
        await writeFile(
          join(work, `rpc-${mode}.ts`),
          `import assert from "node:assert/strict";
import {runtimeOptions} from ${JSON.stringify(relative)};
import {createRpcRuntime,defineRpcAuth,Invocation} from "kello/server";
import {call,getRouter,Procedure} from "@orpc/server";
import {Context} from "effect";
const url=process.env.LOOM_PG_CRON_ORDINARY_URL;assert(url);
const runtime=await createRpcRuntime({...runtimeOptions(),connectionString:url,deployment:${JSON.stringify("packed-pg-cron-" + mode)},auth:defineRpcAuth({authorize:async()=>{}}),assertActive:async(signal)=>signal.throwIfAborted()});
try {
const route=getRouter(runtime.router,["tasks","list"]);assert(route instanceof Procedure);
const invocation={requestId:"packed-pg-cron",identity:null,signal:new AbortController().signal};
const result=await call(route,undefined,{context:{...invocation,operation:"query","effect/context":Context.make(Invocation,invocation)},path:["tasks","list"]});
console.log(JSON.stringify(result));
} finally {await runtime.stop();}`,
        );
        const bundle = join(work, `rpc-${mode}.mjs`);
        await run(["bun", "build", `rpc-${mode}.ts`, "--target=node", "--outfile", bundle, "--external=pg-native"]);
        const bundled = await readFile(bundle, "utf8");
        const adapterPresent = bundled.includes("pg_cron 1.6 requires its exact verified pg_catalog contract");
        assert.equal(adapterPresent, mode === "selected", `${mode} bundle selection`);
        assert(
          !bundled.includes("requires-native-job-readback"),
          "Ordinary application bundle leaked operator capability",
        );
        const { runtimeOptions } = await import(
          pathToFileURL(join(work, mode, ".loom/generations", version, "runtime.js")).href
        );
        const result = await exercisePgCronRpc(runtimeOptions, pgCronLocalUrl(), mode, async (ordinaryUrl) =>
          v.parse(
            pgCronRpcResultValidator,
            JSON.parse((await run(["node", bundle], { LOOM_PG_CRON_ORDINARY_URL: ordinaryUrl })).trim()),
          ),
        );
        coldResults.push({ mode, version, result });
      }
      assert.equal(sha256(await readFile(artifact)), artifactHash);
      assert.equal(await consumerLockfileSha256(root), expectedLock);
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
      console.info(
        JSON.stringify({
          family: "pg_cron",
          consumerWorkDirectory: work,
          nodeVersion,
          artifactHash,
          lockHash: expectedLock,
          installedFilesCompared,
          coldResults,
        }),
      );
    } finally {
      await rm(work, { recursive: true, force: true });
    }
  },
  240000,
);
