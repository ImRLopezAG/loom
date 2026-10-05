import assert from "node:assert/strict";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { extensionProofTest } from "../fixtures/extension-proof";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  removeConsumerNodeModules,
} from "../fixtures/proof-artifact";
import {
  wave20ConsumerFamilies,
  wave20ConsumerProofCase,
  wave20ConsumerSelection,
} from "../fixtures/wave20-consumer-proof-cases";

const declarationProbe = `import { type SQL } from "drizzle-orm";
import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { defineSchema } from "kello/server";
import { extensions as e } from "./wave20";
import { createInsertUsername_1_0 } from "kello/extensions/insert-username";
import { createRefint_1_0 } from "kello/extensions/refint";
import { createTcn_1_0 } from "kello/extensions/tcn";
import { createLo_1_2 } from "kello/extensions/lo";
import { createPgPrewarm_1_2 } from "kello/extensions/pg-prewarm";
import { createPgStatStatements_1_12 } from "kello/extensions/pg-stat-statements";
import { createPgJwt_0_2_0 } from "kello/extensions/pgjwt";
import { createPgSessionJwt_0_5_0 } from "kello/extensions/pg-session-jwt";
import { withPgSessionJwt } from "kello/tooling/extensions/pg-session-jwt";
import { createSeg_1_4, segBoundary, segPoint, type SegValue } from "kello/extensions/seg";
import { createEarthdistance_1_2, type EarthValue, type NonfiniteNumber } from "kello/extensions/earthdistance";
import { cubePoint } from "kello/extensions/cube";
import { withLargeObjects, type LargeObjectSession } from "kello/tooling/extensions/lo";
import { withPgPrewarm, type PrewarmSession } from "kello/tooling/extensions/pg-prewarm";
import { withPgStatStatements, type StatementStatisticsSession } from "kello/tooling/extensions/pg-stat-statements";
import { withTcnNotifications, type TcnNotificationSession } from "kello/tooling/extensions/tcn";
const parent = pgTable("parent", { id: integer().primaryKey(), scope: text() });
const child = pgTable("child", { id: integer().primaryKey(), author: text() });
const objectSchema = defineSchema(() => ({ objects: { object: e.lo.field() } }));
const locations = defineSchema(() => ({ places: { location: e.earthdistance.field(), locations: e.earthdistance.arrayField(), range: e.seg.field(), ranges: e.seg.arrayField() } }));
const author = e.insert_username.trigger({name:"author",table:child,column:child.author});
author.timing satisfies "before";
e.refint.checkPrimaryKey({name:"fk",table:child,columns:[child.id],references:{table:parent,columns:[parent.id]}}).timing satisfies "after";
e.refint.checkForeignKey({name:"pk",table:parent,columns:[parent.id],references:[{table:child,columns:[child.id]}],action:"cascade"});
e.tcn.trigger({name:"notify",table:child}).timing satisfies "after";
e.tcn.notifications.automaticLive satisfies false;
e.lo.trigger({name:"unlink",table:objectSchema.tables.objects,column:objectSchema.tables.objects.object});
const oid: SQL<number | null> = e.lo.oid(4294967295);
const decodedOid: number = e.lo.codec.decode("4294967295");
e.pg_stat_statements.statementRows(true,"stats").columns.queryid satisfies SQL<bigint | null>;
e.pg_stat_statements.infoRows("info").columns.dealloc satisfies SQL<bigint>;
e.pg_session_jwt.userId() satisfies SQL<string | null>;
e.pg_session_jwt.identity.loomInvocation satisfies false;
e.pg_session_jwt.init.authority satisfies "session";
const signed: SQL<string | null> = e.pgjwt.sign({type:"json",text:"9223372036854775807.123456789"},"secret","HS256");
e.pgjwt.verify("token","secret","jwt").payload satisfies SQL<{type:"json";text:string} | null>;
e.pgjwt.urlDecode("AA") satisfies SQL<{hex:string} | null>;
const segment = segPoint(segBoundary("6.50"));
e.seg.equal(locations.tables.places.range,segment) satisfies SQL<boolean | null>;
const range: SQL<SegValue | null> = e.seg.union(segment,segment);
const earth: SQL<EarthValue | null> = e.earthdistance.fromDegrees(18.4,-69.9);
const meters: SQL<number | NonfiniteNumber | null> = e.earthdistance.distanceMeters(earth,cubePoint([6378168]));
e.earthdistance.distanceMeters(locations.tables.places.location,cubePoint([6378168])) satisfies SQL<number | NonfiniteNumber | null>;
const miles: SQL<number | NonfiniteNumber | null> = e.earthdistance.pointDistanceMiles({longitude:-69.9,latitude:18.4},{longitude:0,latitude:0});
const earthSchema: "Earth日本" = e.earthdistance.schema;
async function operators(lo:LargeObjectSession, warm:PrewarmSession, stats:StatementStatisticsSession, tcn:TcnNotificationSession) {
  const id:number = await lo.create({hex:"00ff"});
  const bytes:{hex:string} = await lo.read(id,{offset:0n,length:2});
  await lo.write(id,0n,bytes);
  const warmed = await warm.prewarm({relation:{schema:"public",name:"items"},firstBlock:0n,mode:"buffer"});
  warmed.blocks satisfies bigint;
  warmed.cacheResidency satisfies "not-guaranteed";
  (await stats.reset({queryId:9007199254740993n,minmaxOnly:true})).rollback satisfies "not-transactional";
  (await tcn.next()).keys[0]?.value satisfies string | undefined;
  // @ts-expect-error No raw client escapes the owned large object context.
  lo.client;
  // @ts-expect-error Warming requires its owned operator context.
  warm.client;
  // @ts-expect-error Reset requires its owned operator context.
  stats.client;
  // @ts-expect-error Notification sessions do not expose arbitrary SQL.
  tcn.query;
  // @ts-expect-error Exact large object offsets require bigint.
  lo.write(id,1,bytes);
  // @ts-expect-error Native block positions require bigint.
  warm.prewarm({relation:{schema:"public",name:"items"},firstBlock:1});
  // @ts-expect-error Query identifiers retain their exact signed bigint representation.
  stats.reset({queryId:1});
}
if (false) {
  // @ts-expect-error Username target must carry text data.
  e.insert_username.trigger({name:"bad",table:child,column:child.id});
  // @ts-expect-error Native username callback has no DELETE event.
  e.insert_username.trigger({name:"bad",table:child,column:child.author,events:["delete"]});
  // @ts-expect-error Trigger callbacks are not scalar query functions.
  e.insert_username.sql.functions.insert_username();
  // @ts-expect-error Referential key data types must match.
  e.refint.checkPrimaryKey({name:"bad",table:child,columns:[child.id],references:{table:parent,columns:[parent.scope]}});
  // @ts-expect-error Native referential actions are closed choices.
  e.refint.checkForeignKey({name:"bad",table:parent,columns:[parent.id],references:[{table:child,columns:[child.id]}],action:"delete"});
  // @ts-expect-error TCN cannot notify for TRUNCATE.
  e.tcn.trigger({name:"bad",table:child,events:["truncate"]});
  // @ts-expect-error TCN callback is not a scalar query function.
  e.tcn.sql.functions.triggered_change_notification();
  // @ts-expect-error OIDs are unsigned numeric values, not strings.
  e.lo.oid("1");
  // @ts-expect-error LO mutation callback is absent from ordinary query SQL.
  e.lo.sql.functions.lo_manage();
  // @ts-expect-error Administrative warming is absent from application SQL.
  e.pg_prewarm.sql.functions.pg_prewarm();
  // @ts-expect-error Shared statistics reset is absent from application SQL.
  e.pg_stat_statements.sql.functions.pg_stat_statements_reset();
  // @ts-expect-error Showtext is a boolean native argument.
  e.pg_stat_statements.statements("true");
  // @ts-expect-error JWT session writes are absent from application SQL.
  e.pg_session_jwt.sql.functions.jwt_session_init("token");
  // @ts-expect-error JWT claims cannot grant Kello invocation identity.
  const authorized: true = e.pg_session_jwt.identity.loomInvocation;
  void authorized;
  // @ts-expect-error JSON payloads retain their document representation.
  e.pgjwt.sign({sub:"user"},"secret");
  // @ts-expect-error Only reviewed HMAC algorithms are accepted.
  e.pgjwt.sign(null,"secret","none");
  // @ts-expect-error Bytea requires explicit encoded bytes.
  e.pgjwt.urlEncode("bytes");
  // @ts-expect-error JWT verify requires an explicit row alias.
  e.pgjwt.verify("token","secret");
  // @ts-expect-error Seg precision uses decimal tokens.
  segBoundary(6.5);
  // @ts-expect-error Seg routines require structured values.
  e.seg.equal("6.50",segment);
  // @ts-expect-error Backend GiST callbacks are absent from application SQL.
  e.seg.sql.functions.gseg_consistent(segment);
  // @ts-expect-error Earthdistance requires its explicit Cube dependency.
  createEarthdistance_1_2(e.earthdistance);
  // @ts-expect-error Latitude is numeric rather than text.
  e.earthdistance.fromDegrees("18.4",-69.9);
  // @ts-expect-error The earth domain cannot substitute for native point geography.
  e.earthdistance.pointDistanceMiles(cubePoint([1]),{longitude:0,latitude:0});
  // @ts-expect-error Native binary domain callbacks are not query helpers.
  e.earthdistance.sql.functions.domain_recv();
  // @ts-expect-error Operator tooling needs an explicit owner callback.
  withLargeObjects("postgresql://unused/fixture",e.lo);
  // @ts-expect-error Warming needs an explicit owner callback.
  withPgPrewarm("postgresql://unused/fixture",e.pg_prewarm);
  // @ts-expect-error Reset needs an explicit owner callback.
  withPgStatStatements("postgresql://unused/fixture",e.pg_stat_statements);
  // @ts-expect-error Notification tooling requires explicit scope and callback.
  withTcnNotifications("postgresql://unused/fixture");
}
void [createInsertUsername_1_0,createRefint_1_0,createTcn_1_0,createLo_1_2,createPgPrewarm_1_2,createPgStatStatements_1_12,createPgJwt_0_2_0,createPgSessionJwt_0_5_0,withPgSessionJwt,createSeg_1_4,operators,oid,decodedOid,signed,range,meters,miles,earthSchema];
`;

const runtimeProbe = String.raw`import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import { SQL, Name, Param } from "drizzle-orm";
import { integer, pgTable, text, PgDialect } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { createInsertUsername_1_0 } from "kello/extensions/insert-username";
import { createRefint_1_0 } from "kello/extensions/refint";
import { createTcn_1_0 } from "kello/extensions/tcn";
import { createLo_1_2 } from "kello/extensions/lo";
import { createPgPrewarm_1_2 } from "kello/extensions/pg-prewarm";
import { createPgStatStatements_1_12 } from "kello/extensions/pg-stat-statements";
import { createPgJwt_0_2_0 } from "kello/extensions/pgjwt";
import { createPgSessionJwt_0_5_0 } from "kello/extensions/pg-session-jwt";
import { withPgSessionJwt } from "kello/tooling/extensions/pg-session-jwt";
import { createSeg_1_4,segBoundary,segPoint } from "kello/extensions/seg";
import { createEarthdistance_1_2 } from "kello/extensions/earthdistance";
import { cubePoint } from "kello/extensions/cube";
import { withLargeObjects } from "kello/tooling/extensions/lo";
import { withPgPrewarm,prewarmRequestValidator } from "kello/tooling/extensions/pg-prewarm";
import { withPgStatStatements,statementResetValidator } from "kello/tooling/extensions/pg-stat-statements";
import { withTcnNotifications,decodeTcnPayload } from "kello/tooling/extensions/tcn";
for (const factory of [createInsertUsername_1_0,createRefint_1_0,createTcn_1_0,createLo_1_2,createPgPrewarm_1_2,createPgStatStatements_1_12,createPgJwt_0_2_0,createPgSessionJwt_0_5_0,withPgSessionJwt,createSeg_1_4,createEarthdistance_1_2,withLargeObjects,withPgPrewarm,withPgStatStatements,withTcnNotifications]) assert.equal(typeof factory,"function");
const packageManifest = JSON.parse(await (await import("node:fs/promises")).readFile("package.json","utf8"));
const packageDependencies = JSON.parse(await (await import("node:fs/promises")).readFile("package-dependencies.json","utf8"));
const result = await build({entryPoints:["wave20.ts"],bundle:true,platform:"node",format:"esm",target:"node24",write:false,metafile:true,external:[...packageDependencies,...Object.keys(packageManifest.dependencies).filter(name => name !== "kello")]});
const inputs = Object.keys(result.metafile.inputs);
const modules = ["insert-username","refint","tcn","lo","pg_prewarm","pg_stat_statements","pgjwt","pg_session_jwt","seg","earthdistance","cube","pgcrypto"];
for (const module of modules) assert(inputs.some(name => name.endsWith("/core/extensions/adapters/"+module+".js")),"Missing selected public adapter "+module);
assert(!inputs.some(name => name.includes("/tooling/") || name.includes("manifests/") || name.includes("annotations/")));
const selectedModules = new Set(modules.map(name => name+".js"));
for (const input of inputs.filter(name => name.includes("/core/extensions/adapters/"))) {
  const file = input.split("/").at(-1);
  assert(selectedModules.has(file) || file.endsWith("-codecs.js"),"Unexpected unselected adapter "+input);
}
const bundle = result.outputFiles[0].text;
assert(!/\bBun\b|from ["']bun(?:["':])/.test(bundle));
// Bundle the schema factory with its fields, preserving class identity as in an application build.
await writeFile("application.ts",'export {extensions} from "./wave20"; export {defineSchema} from "kello/server";');
const application = await build({entryPoints:["application.ts"],bundle:true,platform:"node",format:"esm",target:"node24",write:false,metafile:true,external:[...packageDependencies,...Object.keys(packageManifest.dependencies).filter(name => name !== "kello")]});
const applicationBundle = application.outputFiles[0].text;
assert(!/\bBun\b|from ["']bun(?:["':])/.test(applicationBundle));
await writeFile("wave20.mjs",applicationBundle);
const {extensions:e,defineSchema} = await import("./wave20.mjs");
const families = JSON.parse(await (await import("node:fs/promises")).readFile("families.json","utf8"));
assert.equal(families.length,10);
assert.deepEqual(Object.keys(e).sort(),[...families.map(f => f.extension),"cube","pgcrypto"].sort());
for (const family of families) {
  assert.equal(e[family.extension].version,family.version);
  assert.deepEqual(e[family.extension].apiSupport,{status:"verified",digest:family.manifestDigest});
}
const parent = pgTable('Parent"日本',{id:integer().primaryKey(),scope:text()});
const child = pgTable('Child"日本',{id:integer().primaryKey(),author:text()});
const objectSchema = defineSchema(() => ({objects:{object:e.lo.field()}}));
const author = e.insert_username.trigger({name:'Author"日本',table:child,column:child.author});
assert.equal(author.create,'CREATE TRIGGER "Author""日本" BEFORE INSERT OR UPDATE ON "public"."Child""日本" FOR EACH ROW EXECUTE FUNCTION "Triggers日本"."insert_username"(\'author\')');
assert.throws(() => e.insert_username.trigger({name:"bad",table:child,column:child.id}),/must be text/);
const primary = e.refint.checkPrimaryKey({name:"fk",table:child,columns:[child.id],references:{table:parent,columns:[parent.id]}});
assert.equal(primary.timing,"after");
assert(primary.create.includes('"Triggers日本"."check_primary_key"'));
const foreign = e.refint.checkForeignKey({name:"pk",table:parent,columns:[parent.id],references:[{table:child,columns:[child.id]}],action:"cascade"});
assert.deepEqual(foreign.arguments.slice(0,3),["1","cascade","id"]);
assert.throws(() => e.refint.checkForeignKey({name:"bad",table:parent,columns:[parent.id],references:[{table:child,columns:[child.id]}],action:"delete"}),/Invalid refint action/);
assert.equal(e.tcn.trigger({name:"notify",table:child}).timing,"after");
assert.equal(e.tcn.notifications.automaticLive,false);
assert.throws(() => e.tcn.trigger({name:"bad",table:pgTable("no_key",{id:integer()})}),/primary key/);
assert.deepEqual(decodeTcnPayload('"items",U,"id"=\'9007199254740993\''),{table:"items",operation:"update",keys:[{column:"id",value:"9007199254740993"}]});
assert.equal(e.lo.codec.decode("4294967295"),4294967295);
assert.equal(e.lo.codec.encode(0),"0");
assert.throws(() => e.lo.codec.encode(4294967296));
assert.equal(e.lo.trigger({name:"unlink",table:objectSchema.tables.objects,column:objectSchema.tables.objects.object}).timing,"before");
const oidArray = {dimensions:[{lowerBound:-2,length:2}],values:[4294967295,null]};
assert.deepEqual(e.lo.arrayCodec.decode(e.lo.arrayCodec.encode(oidArray)),oidArray);
assert.deepEqual(v.parse(prewarmRequestValidator,{relation:{schema:"public",name:"items"},firstBlock:9007199254740993n,mode:"buffer"}).firstBlock,9007199254740993n);
assert.throws(() => v.parse(prewarmRequestValidator,{relation:{schema:"public",name:"items"},firstBlock:1}));
assert.throws(() => v.parse(prewarmRequestValidator,{relation:{schema:"public",name:"items"},mode:"async"}));
assert.deepEqual(v.parse(statementResetValidator,{queryId:-9223372036854775808n}),{queryId:-9223372036854775808n});
assert.throws(() => v.parse(statementResetValidator,{queryId:1}));
const info = e.pg_stat_statements.infoCodec.decode('(9007199254740993,"2026-10-03 12:00:00.123456+00")');
assert.equal(info.dealloc,9007199254740993n);
assert.equal(info.stats_reset.text,"2026-10-03 12:00:00.123456+00");
assert.throws(() => e.pg_stat_statements.statements("true"));
assert.throws(() => e.pgjwt.sign(null,"secret","none"));
assert.throws(() => e.pgjwt.urlEncode("bytes"));
const segment = segPoint(segBoundary("6.50"));
assert.equal(e.seg.codec.encode(segment),"6.50");
assert.deepEqual(e.seg.codec.decode("6.50"),segment);
assert.throws(() => segBoundary("1e40"));
const segArray = {dimensions:[{lowerBound:-2,length:2}],values:[segment,null]};
assert.deepEqual(e.seg.arrayCodec.decode(e.seg.arrayCodec.encode(segArray)),segArray);
const location = cubePoint([6378168]);
assert.deepEqual(e.earthdistance.codec.decode(e.earthdistance.codec.encode(location)),location);
assert.equal(e.earthdistance.codec.sqlType.schema,"Earth日本");
assert.equal(e.earthdistance.cubeCodec.sqlType.schema,"Cube日本");
const earthArray = {dimensions:[{lowerBound:3,length:2}],values:[location,null]};
assert.deepEqual(e.earthdistance.arrayCodec.decode(e.earthdistance.arrayCodec.encode(earthArray)),earthArray);
assert.deepEqual(e.earthdistance.pointCodec.decode("(-69.9, 18.4)"),{longitude:-69.9,latitude:18.4});
assert.throws(() => e.earthdistance.fromDegrees("18.4",-69.9));
assert.throws(() => createEarthdistance_1_2(e.earthdistance,{...e.cube,schema:'Cube"日本'}),/cube dependency schema/);
// Inspect the public SQL AST without evaluating its connection-owned checked wrapper.
function parts(expression) {
  const names = [],params = [];
  function visit(chunk) {
    if (chunk instanceof SQL) for (const child of chunk.queryChunks) visit(child);
    else if (chunk instanceof Name) names.push(chunk.value);
    else if (chunk instanceof Param) params.push(chunk.value);
    else if (Array.isArray(chunk)) for (const child of chunk) visit(child);
  }
  visit(expression);
  return {names,params};
}
assert.deepEqual(parts(e.pg_session_jwt.userId()).names,["auth","user_id"]);
assert.equal(e.pg_session_jwt.identity.loomInvocation,false);
assert.equal(e.pg_session_jwt.init.authority,"session");
assert.equal(Object.hasOwn(e.pg_session_jwt.sql.functions,"jwt_session_init"),false);
const document = {type:"json",text:"9223372036854775807.123456789"};
assert.deepEqual(parts(e.pgjwt.sign(document,"secret","HS512")),{names:["Jwt日本","sign","pg_catalog","json","pg_catalog","text","pg_catalog","text"],params:[document.text,"secret","HS512"]});
assert.deepEqual(parts(e.lo.oid(4294967295)).params,["4294967295"]);
assert.deepEqual(parts(e.pg_stat_statements.statements(true)).params,[true]);
assert.deepEqual(parts(e.seg.equal(segment,segment)).params,["6.50","6.50"]);
assert.deepEqual(parts(e.earthdistance.fromDegrees(18.4,-69.9)).params,[18.4,-69.9]);
const miles = e.earthdistance.pointDistanceMiles({longitude:-69.9,latitude:18.4},{longitude:0,latitude:0});
assert.deepEqual(parts(miles).params,["(-69.9, 18.4)","(0, 0)"]);
assert(parts(miles).names.includes("Earth日本"));
assert.equal(e.insert_username.sql.functions.insert_username,undefined);
assert.equal(e.refint.sql.functions.check_primary_key,undefined);
assert.equal(e.tcn.sql.functions.triggered_change_notification,undefined);
assert.equal(e.lo.sql.functions.lo_manage,undefined);
assert.equal(e.pg_prewarm.sql.functions.pg_prewarm,undefined);
assert.equal(e.pg_stat_statements.sql.functions.pg_stat_statements_reset,undefined);
assert.equal(e.seg.sql.functions.gseg_consistent,undefined);
assert.equal(e.earthdistance.sql.functions.domain_recv,undefined);
// A plain Drizzle connection cannot bypass Kello's execution authority.
for (const expression of [e.lo.oid(1),e.pg_stat_statements.info(),e.pgjwt.sign(null,"secret"),e.seg.equal(segment,segment),miles])
  assert.throws(() => new PgDialect().sqlToQuery(expression),/requires a Kello database connection/);
`;

extensionProofTest(
  wave20ConsumerProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-packed-wave20-"));
    const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
    const manifest = await Bun.file(join(source, "package.json")).json();
    async function run(command: string[], cwd = root) {
      const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 120000 });
      const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      assert.equal(code, 0, `${command.join(" ")}\n${stdout}\n${stderr}`);
      return stdout.trim();
    }
    try {
      assert.equal(wave20ConsumerFamilies.length, 10);
      assert.equal(new Set(wave20ConsumerFamilies.map((family) => family.extension)).size, 10);
      await run(["bun", "pm", "pack", "--filename", join(root, "kello.tgz"), "--ignore-scripts"], source);
      await writeFile(
        join(root, "package.json"),
        JSON.stringify({
          private: true,
          type: "module",
          dependencies: {
            kello: "file:./kello.tgz",
            "drizzle-orm": manifest.devDependencies["drizzle-orm"],
            effect: manifest.dependencies.effect,
            valibot: manifest.dependencies.valibot,
            esbuild: manifest.dependencies.esbuild,
          },
          devDependencies: {
            typescript: manifest.devDependencies.typescript,
            "@types/node": manifest.devDependencies["@types/node"],
          },
        }),
      );
      await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
      const tarball = await readFile(join(root, "kello.tgz"));
      await assertInstalledPackageMatchesTarball(root, tarball);
      const lockfileDigest = await consumerLockfileSha256(root);
      await removeConsumerNodeModules(root);
      await run(["bun", "install", "--ignore-scripts", "--frozen-lockfile"]);
      assert.equal(await consumerLockfileSha256(root), lockfileDigest);
      await assertInstalledPackageMatchesTarball(root, tarball);
      await writeFile(join(root, "wave20.ts"), extensionBindingsSource(wave20ConsumerSelection));
      await writeFile(join(root, "families.json"), JSON.stringify(wave20ConsumerFamilies));
      await writeFile(join(root, "package-dependencies.json"), JSON.stringify(Object.keys(manifest.dependencies)));
      await writeFile(join(root, "probe.ts"), declarationProbe);
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
            exactOptionalPropertyTypes: true,
            types: ["node"],
          },
          include: ["*.ts"],
        }),
      );
      await run([join(root, "node_modules/.bin/tsc"), "-p", "tsconfig.json"]);
      await writeFile(join(root, "verify.mjs"), runtimeProbe);
      await run(["node", "verify.mjs"]);
      const output = process.env.LOOM_EXTENSION_PROOF_PACKED_OUTPUT;
      if (output) {
        await copyFile(join(root, "kello.tgz"), join(output, "kello.tgz"));
        await copyFile(join(root, "bun.lock"), join(output, "consumer-bun.lock"));
        await writeFile(
          join(output, "consumer.json"),
          JSON.stringify({
            runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
            nodeVersion: await run(["node", "--version"]),
            installation: "isolated",
            frozenReinstallPassed: true,
            declarationsPassed: true,
            runtimePassed: true,
            selectedBundleChecksPassed: true,
          }) + "\n",
          { mode: 0o600 },
        );
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  120000,
);
