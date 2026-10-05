import { recordPackedConsumerObservation } from "../fixtures/packed-consumer-observation";
import assert from "node:assert/strict";
import { constants } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { extensionProofTest } from "../fixtures/extension-proof";
import { btreeGinConsumerProofCase, btreeGinProofFamily } from "../fixtures/btree_gin-proof-cases";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
  sha256,
} from "../fixtures/proof-artifact";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/btree_gin.json";
import { btreeGinGeneratedSchema } from "../fixtures/btree_gin-generated-project";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { runBtreeGinGeneratedRuntime } from "../fixtures/btree-gin-generated-runtime";

extensionProofTest(
  btreeGinConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-btree_gin-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    async function run(command: string[], cwd = root, databaseUrl?: string) {
      const env = { ...process.env };
      if (databaseUrl) env.LOOM_PACKED_BTREE_GIN_DATABASE_URL = databaseUrl;
      const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 120000, env });
      let output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
      if (databaseUrl) {
        const address = new URL(databaseUrl);
        for (const value of [databaseUrl, address.password])
          if (value)
            output = output.replaceAll(value, "[redacted]").replaceAll(decodeURIComponent(value), "[redacted]");
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
      assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
      const expected = manifest.contract.members
        .filter((member) => member.kind === "opclass")
        .map((member) => ({
          key: member.name === "enum_ops" ? "enum" : member.input!.name,
          member: member.id,
          opclass: member.name,
          input: member.input!.name,
        }));
      const descriptor = {
        name: "btree_gin",
        version: "1.3",
        schema: 'Packed"btree_gin',
        apiSupport: { status: "verified", digest: btreeGinProofFamily.manifestDigest },
      };
      const generatedPlacement = "packed_btree_gin";
      await writeFile(
        join(root, "runtime.mjs"),
        `import assert from "node:assert/strict";
import { createBtreeGin_1_3 } from "kello/extensions/btree-gin";
import { defineSchema, defineTable } from "kello/server";
const api = createBtreeGin_1_3(${JSON.stringify(descriptor)});
const expected = ${JSON.stringify(expected)};
assert.deepEqual(Object.keys(api).sort(), ["apiSupport","ginEnumCmp","ginNumericCmp","indexes","name","schema","sql","version"]);
assert.deepEqual(Object.keys(api.sql.functions).sort(), ["gin_enum_cmp","gin_numeric_cmp"]);
assert.equal(api.sql.functions.gin_numeric_cmp, api.ginNumericCmp);
assert.equal(api.sql.functions.gin_enum_cmp, api.ginEnumCmp);
assert.deepEqual(Object.keys(api.indexes), expected.map(row => row.key));
for(const row of expected) assert.deepEqual(api.indexes[row.key](), {name:"btree_gin",version:"1.3",schema:api.schema,digest:api.apiSupport.digest,member:row.member,method:"gin",opclass:row.opclass,type:row.input,default:true,input:{schema:"pg_catalog",type:row.input,dimensions:0}});
for(const invalid of [{...api,version:"1.2"},{...api,apiSupport:{status:"verified",digest:"wrong"}}]) assert.throws(()=>createBtreeGin_1_3(invalid));
const schema = defineSchema(fields=>({entries:defineTable({code:fields.integer(),label:fields.text()},{indexes:[{fields:["code"],extension:api.indexes.int4()},{fields:["label"],extension:api.indexes.text()}]})}),{namespace:"app"});
assert.equal(schema.metadata.extensionRequirements.length,2);
`,
      );
      await run(["node", "runtime.mjs"]);
      await writeFile(
        join(root, "probe.ts"),
        `import { createBtreeGin_1_3 } from "kello/extensions/btree-gin";
import { pgSchema } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
const api = createBtreeGin_1_3(${JSON.stringify(descriptor)});
const version: "1.3" = api.version;
const schema: 'Packed"btree_gin' = api.schema;
api.indexes.enum(); api.indexes.numeric(); api.indexes.int8();
const ordered = pgSchema("types").enum("ordered", ["low", "middle", "high"]);
const cmp: SQL<number | null> = api.sql.functions.gin_enum_cmp(ordered,"low","high");
api.sql.functions.gin_numeric_cmp("9007199254740992.0001", {nonfinite:"NaN"});
// @ts-expect-error Native-pointer support routines remain internal.
api.sql.functions.gin_extract_value_numeric("1",null);
// @ts-expect-error Enum labels cannot widen inference.
api.ginEnumCmp(ordered,"absent","high");
// @ts-expect-error JavaScript numbers cannot replace exact decimals.
api.ginNumericCmp(1,"2");
// @ts-expect-error Uncaptured classes remain unavailable.
api.indexes.jsonb();
void [version,schema,cmp];`,
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
        new URL("../fixtures/btree_gin-generated-project.ts", import.meta.url),
        join(root, "project-writer.ts"),
      );
      await writeFile(
        join(root, "generate.mjs"),
        `import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import { writeBtreeGinRpc } from "./project-writer.ts";
const project = join(process.cwd(),"project");
await initializeProject(project,"packedbtreegin");
await writeFile(join(project,"kello.config.ts"), 'import { defineConfig } from "kello/tooling"; export default defineConfig({database:{extensions:{btree_gin:{version:"1.3",schema:${JSON.stringify(generatedPlacement)}}}}});');
await writeFile(join(project,"kello/schema.ts"), ${JSON.stringify(btreeGinGeneratedSchema(generatedPlacement))});
await writeFile(join(project,"kello/functions/tasks.ts"), 'import { os } from "../_generated/rpc"; export default os.tasks.router({list:os.tasks.list.handler(async ({context:{db,tables,extensions}})=>(await db.select({label:tables.entries.label,cmp:extensions.btree_gin.ginNumericCmp("1","2")}).from(tables.entries)).map(row=>row.label??""))});');
await writeBtreeGinRpc(project);
await assert.rejects(readFile(join(project,"kello/_generated/extensions.ts")),{code:"ENOENT"});
await loadProject(project);
const generated=await generateProject(project);
await writeFile(join(project,"generation.json"),JSON.stringify({version:generated.version,schema:${JSON.stringify(generatedPlacement)}}));
assert.equal((await generateProject(project)).version,generated.version);
const disk=await import("./project/kello/_generated/extensions.ts");
assert.deepEqual(Object.keys(disk.extensions),["btree_gin"]);
assert.equal(Object.keys(disk.extensions.btree_gin.indexes).length,29);
assert.deepEqual(Object.keys(disk.extensions.btree_gin.sql.functions).sort(),["gin_enum_cmp","gin_numeric_cmp"]);
`,
      );
      await run(["bun", "generate.mjs"]);
      await run([join(root, "node_modules/.bin/tsc"), "-p", "project/tsconfig.json"]);
      await writeFile(join(root, "selected.ts"), 'export { extensions } from "./project/kello/_generated/extensions";');
      await writeFile(join(root, "empty.ts"), "export const extensions = undefined;");
      await writeFile(
        join(root, "verify-bundles.mjs"),
        `import assert from "node:assert/strict";
import { realpath, writeFile } from "node:fs/promises";
import { build } from "esbuild";
const installed=await realpath("node_modules/kello");
for(const name of ["selected","empty"]) {
  const result=await build({entryPoints:[name+".ts"],bundle:true,platform:"node",format:"esm",target:"node24",write:false,metafile:true,external:${JSON.stringify([...Object.keys(pkg.dependencies), "drizzle-orm"])}});
  for(const [file] of Object.entries(result.metafile.inputs)) if(file.startsWith("node_modules/kello/") || file.includes("/node_modules/kello/")) assert((await realpath(file)).startsWith(installed+"/dist/"),file);
  const bundled=result.outputFiles[0].text;
  assert.doesNotMatch(bundled,/Bun\\.|createBtreeGist|createBloom/);
  if(name==="selected") assert.match(bundled,/gin_numeric_cmp/); else assert.doesNotMatch(bundled,/btree_gin/);
  await writeFile(name+".mjs",bundled);
  const {extensions}=await import("./"+name+".mjs");
  if(name==="selected") { assert.deepEqual(Object.keys(extensions),["btree_gin"]); assert.equal(Object.keys(extensions.btree_gin.indexes).length,29); }
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
import { pgSchema } from "drizzle-orm/pg-core";
import { defineSchema, defineTable, connectDatabase } from "kello/server";
import { createSnapshot, emptySnapshot, migrationStatements, inspectSnapshot } from "kello/tooling";
import { extensions } from "./project/kello/_generated/extensions.ts";
const url=process.env.LOOM_PACKED_BTREE_GIN_DATABASE_URL; assert(url);
const client=new pg.Client({connectionString:url}); await client.connect();
const api=extensions.btree_gin; const namespace=pg.escapeIdentifier(api.schema);
const schema=defineSchema(fields=>({entries:{code:fields.integer(),label:fields.text()}}),{namespace:"native_app"});
let connection;
try {
  assert.equal(Math.floor(Number((await client.query("show server_version_num")).rows[0].server_version_num)/10000),18);
  await client.query("create schema "+namespace+"; create extension btree_gin with schema "+namespace+" version '1.3'; create schema native_enums; create type native_enums.ordered as enum ('low','middle','high')");
  const indexed=defineSchema(fields=>({entries:defineTable({code:fields.integer(),label:fields.text()},{indexes:[{fields:["code"],extension:api.indexes.int4()},{fields:["label"],extension:api.indexes.text()}]})}),{namespace:"native_app"});
  for(const statement of await migrationStatements(await emptySnapshot("native_app"),await createSnapshot(indexed))) await client.query(statement);
  connection=await connectDatabase({schema,relations:defineRelations(schema.tables),connectionString:url});
  const ordered=pgSchema("native_enums").enum("ordered",["low","middle","high"]);
  const rows=await connection.transaction(db=>db.select({numeric:api.ginNumericCmp("9007199254740992.0001","9007199254740992.0002"),enumeration:api.ginEnumCmp(ordered,"low","high"),nullNumeric:api.ginNumericCmp(null,"1"),nullEnum:api.ginEnumCmp(ordered,null,"high")}).from(sql\`(values (1)) fixture(id)\`));
  assert.deepEqual(rows,[{numeric:-1,enumeration:-1,nullNumeric:null,nullEnum:null}]);
  const snapshot=await inspectSnapshot(connection.db,"native_app");
  assert.equal(snapshot.ddl.filter(entity=>entity.entityType==="indexes"&&entity.method==="gin").length,2);
} finally { if(connection) await connection.close(); await client.end(); }
`,
      );
      // Bundle the adapter and server together so checked-expression ownership belongs to one installed Kello instance.
      await writeFile(
        join(root, "bundle-native.mjs"),
        `import { build } from "esbuild"; await build({entryPoints:["native.mjs"],bundle:true,platform:"node",format:"esm",target:"node24",outfile:"native-bundle.mjs",external:${JSON.stringify([...Object.keys(pkg.dependencies), "drizzle-orm", "bun"])}});`,
      );
      await run(["node", "bundle-native.mjs"]);
      await withExtensionDatabase(async (url) => {
        await run(["node", "native-bundle.mjs"], root, url);
        const generation = JSON.parse(await readFile(join(root, "project/generation.json"), "utf8"));
        await runBtreeGinGeneratedRuntime(join(root, "project"), generation.version, generatedPlacement, url);
      });
      await recordPackedConsumerObservation(root);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  240000,
);
