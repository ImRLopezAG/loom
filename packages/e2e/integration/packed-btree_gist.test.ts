import { recordPackedConsumerObservation } from "../fixtures/packed-consumer-observation";
import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { extensionProofTest } from "../fixtures/extension-proof";
import { btreeGistConsumerProofCase, btreeGistProofFamily } from "../fixtures/btree_gist-proof-cases";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
} from "../fixtures/proof-artifact";
import * as v from "valibot";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/btree_gist.json";
import { btreeGistGeneratedFunctions, btreeGistGeneratedSchema } from "../fixtures/btree_gist-generated-project";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { runBtreeGistGeneratedRuntime } from "../fixtures/btree-gist-generated-runtime";

extensionProofTest(
  btreeGistConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-btree_gist-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_BTREE_GIST_DATABASE_URL = databaseUrl;
      const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 120000, env });
      let output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
      if (databaseUrl) {
        const address = new URL(databaseUrl);
        for (const value of [databaseUrl, address.password])
          if (value)
            output = output.replaceAll(value, "[redacted]").replaceAll(decodeURIComponent(value), "[redacted]");
        output = output.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]");
      }
      assert.equal(await child.exited, 0, `${command.join(" ")}\n${output}`);
    }
    try {
      await run(["node", "-e", "if(process.versions.node.split('.')[0]!=='24')throw Error('Node 24 required')"]);
      await run(["bun", "pm", "pack", "--filename", join(root, "kello.tgz"), "--ignore-scripts"], source);
      const bytes = await readFile(join(root, "kello.tgz"));
      const retained = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
      if (retained) {
        await copyFile(join(root, "kello.tgz"), retained, constants.COPYFILE_EXCL);
        assert.equal(sha256(await readFile(retained)), sha256(bytes));
      }
      const pkg = await Bun.file(join(source, "package.json")).json();
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
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), sha256(bytes));
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
      const checked = validateExtensionManifest(v.parse(extensionManifestValidator, manifest));
      const expected = checked.contract.members.flatMap((member) =>
        member.kind === "opclass"
          ? [
              {
                key: member.name === "gist_enum_ops" ? "enum" : member.input.name,
                member: member.id,
                opclass: member.name,
                input: member.input.name,
              },
            ]
          : [],
      );
      assert.equal(expected.length, 26);
      const callable = checked.contract.members
        .filter((member) => member.kind === "routine" || member.kind === "operator")
        .map((member) => member.id)
        .filter((id) => /_dist\(|<->|gist_translate_cmptype_btree/.test(id))
        .sort();
      const descriptor = {
        name: "btree_gist",
        version: "1.8",
        schema: 'Packed"btree_gist',
        apiSupport: { status: "verified", digest: btreeGistProofFamily.manifestDigest },
      };
      const generatedPlacement = "packed_btree_gist";
      await writeFile(
        join(root, "runtime.mjs"),
        `import assert from "node:assert/strict";
import { createBtreeGist_1_8 } from "kello/extensions/btree-gist";
import { defineSchema, defineTable } from "kello/server";
const api = createBtreeGist_1_8(${JSON.stringify(descriptor)});
const expected = ${JSON.stringify(expected)};
assert.deepEqual(Object.keys(api).sort(), ["apiSupport","distance","indexes","name","schema","sql","version"]);
assert.equal(Object.keys(api.sql.functions).length, 13);
assert.equal(Object.keys(api.sql.operators).length, 12);
assert.deepEqual(Object.keys(api.sql.overloads).sort(), ${JSON.stringify(callable)});
for (const [key, operator] of Object.entries(api.distance)) assert.equal(api.sql.operators["<->("+key+","+key+")"], operator);
assert.deepEqual(Object.keys(api.indexes).sort(), expected.map(row => row.key).sort());
for(const row of expected) assert.deepEqual(api.indexes[row.key](), {name:"btree_gist",version:"1.8",schema:api.schema,digest:api.apiSupport.digest,member:row.member,method:"gist",opclass:row.opclass,type:row.input,default:true,input:{schema:"pg_catalog",type:row.input,dimensions:0}});
for(const invalid of [{...api,version:"1.7"},{...api,name:"btree_gin"},{...api,apiSupport:{status:"verified",digest:"wrong"}},{...api,apiSupport:{status:"unverified"}}]) assert.throws(()=>createBtreeGist_1_8(invalid),/exact verified contract/);
const schema = defineSchema(fields=>({entries:defineTable({code:fields.integer(),label:fields.text()},{indexes:[{fields:["code"],extension:api.indexes.int4()},{fields:["label"],extension:api.indexes.text()}]})}),{namespace:"app"});
assert.equal(schema.metadata.extensionRequirements.length,2);
`,
      );
      await run(["node", "runtime.mjs"]);
      await writeFile(
        join(root, "probe.ts"),
        `import { createBtreeGist_1_8 } from "kello/extensions/btree-gist";
import { timestamp } from "kello/extensions/timestamps";
import type { SQL } from "drizzle-orm";
const api = createBtreeGist_1_8(${JSON.stringify(descriptor)});
const version: "1.8" = api.version;
const schema: 'Packed"btree_gist' = api.schema;
const opclass: "gist_cash_ops" = api.indexes.money().opclass;
const money: SQL<string | null> = api.distance.money("1.50","-3");
const exact: SQL<bigint | null> = api.sql.functions.int8_dist(9007199254740993n, null);
const elapsed: SQL<string | null> = api.sql.functions.ts_dist(timestamp("2000-01-01 00:00:00"), null);
const strategy: SQL<number | null> = api.sql.functions.gist_translate_cmptype_btree(3);
// @ts-expect-error Native-pointer support routines remain internal.
api.sql.functions.gbt_int4_consistent(null,null);
// @ts-expect-error JavaScript numbers cannot replace exact int8.
api.distance.int8(1,2n);
// @ts-expect-error Uncaptured classes remain unavailable.
api.indexes.jsonb();
// @ts-expect-error Interval results are text, not numbers.
const wrong: SQL<number | null> = api.distance.time("01:00:00","02:00:00");
void [version,schema,opclass,money,exact,elapsed,strategy,wrong];`,
      );
      await writeFile(
        join(root, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            target: "ES2023",
            module: "Preserve",
            moduleResolution: "Bundler",
            strict: true,
            noEmit: true,
            skipLibCheck: true,
            types: ["node"],
          },
          include: ["probe.ts"],
        }),
      );
      await run([join(root, "node_modules/.bin/tsc"), "-p", "tsconfig.json"]);
      await copyFile(
        new URL("../fixtures/btree_gist-generated-project.ts", import.meta.url),
        join(root, "project-writer.ts"),
      );
      await writeFile(
        join(root, "generate.mjs"),
        `import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { initializeProject, loadProject, generateProject, createSnapshot, emptySnapshot, migrationStatements } from "kello/tooling";
import { defineSchema, defineTable } from "kello/server";
import { writeBtreeGistRpc } from "./project-writer.ts";
const project = join(process.cwd(),"project");
await initializeProject(project,"packedbtreegist");
await writeFile(join(project,"kello.config.ts"), 'import { defineConfig } from "kello/tooling"; export default defineConfig({database:{extensions:{btree_gist:{version:"1.8",schema:${JSON.stringify(generatedPlacement)}}}}});');
await writeFile(join(project,"kello/schema.ts"), ${JSON.stringify(btreeGistGeneratedSchema(generatedPlacement))});
await writeFile(join(project,"kello/functions/tasks.ts"), ${JSON.stringify(btreeGistGeneratedFunctions)});
await writeBtreeGistRpc(project);
await assert.rejects(readFile(join(project,"kello/_generated/extensions.ts")),{code:"ENOENT"});
await loadProject(project);
await assert.rejects(readFile(join(project,"kello/_generated/extensions.ts")),{code:"ENOENT"});
const generated=await generateProject(project);
await writeFile(join(project,"generation.json"),JSON.stringify({version:generated.version}));
assert.equal((await generateProject(project)).version,generated.version);
const disk=await import("./project/kello/_generated/extensions.ts");
assert.deepEqual(Object.keys(disk.extensions),["btree_gist"]);
assert.equal(disk.extensions.btree_gist.schema,${JSON.stringify(generatedPlacement)});
assert.equal(Object.keys(disk.extensions.btree_gist.indexes).length,26);
assert.equal(Object.keys(disk.extensions.btree_gist.sql.functions).length,13);
assert.equal(Object.keys(disk.extensions.btree_gist.distance).length,12);
assert.match(await readFile(join(project,"kello/_generated/extensions.ts"),"utf8"),/kello\\/extensions\\/btree-gist/);
const api=disk.extensions.btree_gist;
const indexed=defineSchema(fields=>({entries:defineTable({code:fields.integer(),label:fields.text()},{indexes:[{fields:["code"],extension:api.indexes.int4()},{fields:["label"],extension:api.indexes.text()}]})}),{namespace:"native_app"});
await writeFile("migration.json",JSON.stringify(await migrationStatements(await emptySnapshot("native_app"),await createSnapshot(indexed))));
`,
      );
      await run(["bun", "generate.mjs"]);
      await run([join(root, "node_modules/.bin/tsc"), "-p", "project/tsconfig.json"]);
      await writeFile(join(root, "selected.ts"), 'export { extensions } from "./project/kello/_generated/extensions";');
      await writeFile(join(root, "empty.ts"), "export const extensions = undefined;");
      const externals = JSON.stringify([...Object.keys(pkg.dependencies), "drizzle-orm"]);
      await writeFile(
        join(root, "verify-bundles.mjs"),
        `import assert from "node:assert/strict";
import { realpath, writeFile } from "node:fs/promises";
import { build } from "esbuild";
const installed=await realpath("node_modules/kello");
for(const name of ["selected","empty"]) {
  const result=await build({entryPoints:[name+".ts"],bundle:true,platform:"node",format:"esm",target:"node24",write:false,metafile:true,external:${externals}});
  const inputs=Object.keys(result.metafile.inputs);
  for(const file of inputs) if(file.includes("node_modules/kello/")) assert((await realpath(file)).startsWith(installed+"/dist/"),file);
  assert(!inputs.some(path=>path.includes("/tooling/")));
  assert(!inputs.some(path=>path.includes("/core/extensions/adapters/")&&!/\\/btree_gist(-codecs)?\\.js$/.test(path)));
  const bundled=result.outputFiles[0].text;
  assert.doesNotMatch(bundled,/\\bBun\\.|createBtreeGin|createBloom/);
  if(name==="selected") assert.match(bundled,/gist_translate_cmptype_btree/); else assert.doesNotMatch(bundled,/btree_gist/);
  await writeFile(name+".mjs",bundled);
  const {extensions}=await import("./"+name+".mjs");
  if(name==="selected") { assert.deepEqual(Object.keys(extensions),["btree_gist"]); assert.equal(Object.keys(extensions.btree_gist.indexes).length,26); }
  else assert.equal(extensions,undefined);
}
`,
      );
      await run(["node", "verify-bundles.mjs"]);
      await writeFile(
        join(root, "native.mjs"),
        `import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, sql } from "drizzle-orm";
import { call } from "@orpc/server";
import { Context, Effect } from "effect";
import { connectDatabase, createProjectProcedures, createProjectServices, defineSchema, Invocation } from "kello/server";
import { readFile } from "node:fs/promises";
import { timestamp, timestamptz } from "kello/extensions/timestamps";
import { extensions } from "./project/kello/_generated/extensions.ts";
const url=process.env.LOOM_PACKED_BTREE_GIST_DATABASE_URL; assert(url);
const client=new pg.Client({connectionString:url}); await client.connect();
const api=extensions.btree_gist; const namespace=pg.escapeIdentifier(api.schema);
const schema=defineSchema(fields=>({entries:{code:fields.integer(),label:fields.text()}}),{namespace:"native_app"});
const relations=defineRelations(schema.tables);
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("show server_version_num")).rows[0].server_version_num)/10000),18);
  await client.query("create schema "+namespace+"; create extension btree_gist with schema "+namespace+" version '1.8'");
  assert.equal((await client.query("select extversion from pg_extension where extname='btree_gist'")).rows[0].extversion,"1.8");
  for(const statement of JSON.parse(await readFile("migration.json","utf8"))) await client.query(statement);
  await client.query("insert into native_app.entries(code,label) select g, 'l'||g from generate_series(1,50) g");
  connection=await connectDatabase({schema,relations,connectionString:url});
  const services=createProjectServices(schema);
  const { procedure }=createProjectProcedures(schema,relations,extensions);
  const handler=procedure.handler(async ({context})=>{
    const binding=Effect.runSync(Effect.provide(services.Extensions,context["effect/context"]));
    assert.equal(binding,context.extensions); assert.equal(binding,extensions);
    const gist=binding.btree_gist;
    return connection.transaction(async db=>({
      scalars:await db.select({
        money:gist.distance.money("1.50","-3"), days:gist.sql.functions.date_dist("2000-01-01","4713-01-01 BC"),
        float4:gist.distance.float4(1.5,{nonfinite:"NaN"}), float8:gist.sql.functions.float8_dist(-2,{nonfinite:"Infinity"}),
        int2:gist.distance.int2(-1,3), int4:gist.distance.int4(-5,5), int8:gist.distance.int8(9007199254740993n,0n),
        interval:gist.distance.interval("1 day","-02:00:00"), oid:gist.distance.oid(1,4294967295),
        time:gist.distance.time("01:00:00","24:00:00"),
        ts:gist.sql.functions.ts_dist(timestamp("2000-01-02 00:00:00"),timestamp("2000-01-01 00:00:00")),
        tstz:gist.distance.timestamptz(timestamptz("2000-01-01 01:00:00+01"),timestamptz("2000-01-01 02:00:00+00")),
        strategy:gist.sql.functions.gist_translate_cmptype_btree(3), absent:gist.distance.int4(null,1),
      }).from(sql.raw("(values(1)) fixture(id)")),
      nearest:await db.select({code:schema.tables.entries.code}).from(schema.tables.entries).orderBy(gist.distance.int4(schema.tables.entries.code,20)).limit(3),
    }));
  });
  const invocation={requestId:"packed-btree-gist",identity:null,signal:new AbortController().signal};
  const result=await call(handler,undefined,{context:{...invocation,"effect/context":Context.make(Invocation,invocation)}});
  await client.query("set search_path to "+namespace+", pg_catalog");
  const oracle=(await client.query("select ('1.50'::money <-> '-3'::money)::text money, '2000-01-01'::date - '4713-01-01 BC'::date days, ('1 day'::interval <-> '-02:00:00'::interval)::text \\"interval\\", ('01:00:00'::time <-> '24:00:00'::time)::text \\"time\\", ('2000-01-01 01:00:00+01'::timestamptz <-> '2000-01-01 02:00:00+00'::timestamptz)::text tstz, (1.5::float4 <-> 'NaN'::float4)::text f4, (-2::float8 <-> 'Infinity'::float8)::text f8")).rows[0];
  assert.deepEqual(result.scalars,[{money:"4.50",days:oracle.days,float4:{nonfinite:oracle.f4},float8:{nonfinite:oracle.f8},int2:4,int4:10,int8:9007199254740993n,interval:oracle.interval,oid:4294967294,time:oracle.time,ts:"1 day",tstz:oracle.tstz,strategy:3,absent:null}]);
  assert.equal(oracle.money,"$4.50"); assert.deepEqual([oracle.f4,oracle.f8],["Infinity","Infinity"]);
  assert.deepEqual(result.nearest.map(row=>row.code).sort((a,b)=>a-b),[19,20,21]);
  await assert.rejects(connection.db.select({x:api.distance.int2(-32768,32767)}).from(sql.raw("(values(1)) fixture(id)")));
  const classes=(await client.query("select c.relname, a.amname, o.opcname, n.nspname from pg_index i join pg_class c on c.oid=i.indexrelid join pg_am a on a.oid=c.relam join pg_opclass o on o.oid=i.indclass[0] join pg_namespace n on n.oid=o.opcnamespace join pg_class t on t.oid=i.indrelid join pg_namespace tn on tn.oid=t.relnamespace where tn.nspname='native_app' and a.amname='gist' order by o.opcname")).rows;
  assert.deepEqual(classes.map(row=>[row.opcname,row.nspname]),[["gist_int4_ops",api.schema],["gist_text_ops",api.schema]]);
} finally { try { await connection?.close(); } finally { await client.end(); } }
console.log("packed btree_gist RPC/Effect, codecs, KNN and migrated GiST indexes passed");
`,
      );
      // One bundle so checked-expression ownership belongs to a single installed Kello instance.
      await writeFile(
        join(root, "bundle-native.mjs"),
        `import { build } from "esbuild"; await build({entryPoints:["native.mjs"],bundle:true,platform:"node",format:"esm",target:"node24",outfile:"native-bundle.mjs",external:${externals}});`,
      );
      await run(["node", "bundle-native.mjs"]);
      await withExtensionDatabase(async (url) => {
        await run(["node", "native-bundle.mjs"], root, url);
        const generation = JSON.parse(await readFile(join(root, "project/generation.json"), "utf8"));
        await runBtreeGistGeneratedRuntime(join(root, "project"), generation.version, generatedPlacement, url);
      });
      assert.equal(sha256(await readFile(join(root, "kello.tgz"))), sha256(bytes));
      await recordPackedConsumerObservation(root);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  360000,
);
