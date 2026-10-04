export const postgisTopologyGeneratedSelection = {
  postgis: { version: "3.6.4", schema: "extensions" },
  postgis_topology: { version: "3.6.4", schema: "topology" },
} as const;
export function postgisTopologyGeneratedSchema(postgisSchema = "extensions") {
  return `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.postgis_topology;
if (api.schema !== "topology" || extensions.postgis.schema !== ${JSON.stringify(postgisSchema)} || Object.keys(api.sql.overloads).length !== 41) throw new Error("Wrong first-load topology dependency binding");
export default defineSchema(() => ({ stored: defineTable({
  shape: api.fields.topogeometry(), elements: api.fields.topoelementarray(), shapes: api.fields._topogeometry(),
}) }), { namespace: "app" });
`;
}
export const postgisTopologyGeneratedTypeProof = `
import { type SQL, sql } from "drizzle-orm";
import { extensions } from "./_generated/extensions";
import type { Topogeometry, Topoelementarray } from "kello/extensions/postgis-topology";
import type { PostgisTopologyOperatorSession } from "kello/tooling/extensions/postgis-topology";
const api = extensions.postgis_topology;
const shape: Topogeometry = { topology_id: 1, layer_id: 1, id: 9223372036854775807n, type: 1 };
const node: SQL<bigint | null> = api.getnodebypoint("graph", api.geometry.ewkt("SRID=4326;POINT(1 2)"), 0);
const elements: SQL<Topoelementarray | null> = api.gettopogeomelementarray["($extension:postgis_topology.topogeometry)"](shape);
// @ts-expect-error Only explicitly selected extension keys exist.
extensions.vector;
// @ts-expect-error Exact int8 IDs use bigint.
api.getnodeedges("graph", 1);
// @ts-expect-error Native geometry requires an explicit representation.
api.getnodebypoint("graph", "POINT(1 2)", 0);
// @ts-expect-error Graph edits belong to operator tooling.
api.sql.functions.createtopology;
async function operator(session: PostgisTopologyOperatorSession) {
  const id: number | null = await session.createtopology("graph",4326,undefined,undefined,undefined,true);
  const point: bigint | null = await session.topogeo_addpoint("graph",api.geometry.ewkt("SRID=4326;POINT(1 2)"));
  // @ts-expect-error Operators reject executable SQL arguments.
  await session.createtopology(sql\`'graph'\`);
  // @ts-expect-error No raw connection escape.
  session.client;
  void [id,point];
}
void [node,elements,operator];
`;

/** Runs with Bun in the installed consumer; every binding comes from public compiled tooling. */
export const postgisTopologyPackedGenerationSource = String.raw`
import assert from "node:assert/strict";
import {mkdir,readFile,rm,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {pathToFileURL} from "node:url";
import {initializeProject,loadProject,generateProject} from "kello/tooling";
const cases = [
  {name:"selected",version:"3.6.4",schema:"extensions"},
  {name:"explicit",version:"3.6.4",schema:"spatial"},
  {name:"future",version:"future",schema:"extensions"},
  {name:"absent"},
  {name:"empty",empty:true},
];
for (const entry of cases) {
  const root=join(process.cwd(),"generation",entry.name);
  await mkdir(root,{recursive:true});
  await initializeProject(root,"topologyproof");
  await rm(join(root,"kello/functions/tasks.ts"));
  await rm(join(root,"kello/contracts/tasks.ts"));
  const selection=entry.version ? {
    postgis:{version:"3.6.4",schema:entry.schema},
    postgis_topology:{version:entry.version,schema:"topology"},
  } : entry.empty ? {} : undefined;
  await writeFile(join(root,"kello.config.ts"),
    'import {defineConfig} from "kello/tooling";export default defineConfig({database:'+JSON.stringify(selection===undefined?{}:{extensions:selection})+'});');
  await writeFile(join(root,"kello/app.config.ts"),
    'import {defineApplication} from "kello/server";export default defineApplication({rpc:({os})=>({os})});');
  const selected=entry.version==="3.6.4";
  await writeFile(join(root,"kello/schema.ts"),selected ?
    'import {defineSchema,defineTable} from "kello/server";import {extensions} from "./_generated/extensions";const api=extensions.postgis_topology;if(api.schema!=="topology"||extensions.postgis.schema!=='+JSON.stringify(entry.schema)+'||Object.keys(api.sql.overloads).length!==41)throw new Error("Wrong first-load topology dependency binding");export default defineSchema(()=>({stored:defineTable({shape:api.fields.topogeometry(),elements:api.fields.topoelementarray(),shapes:api.fields._topogeometry()})}),{namespace:"app"});' :
    'import {defineSchema} from "kello/server";export default defineSchema(()=>({}),{namespace:"app"});');
  if(selected){
    await writeFile(join(root,"kello/contracts/tasks.ts"),
      'import {defineContract,oc} from "kello/contract";import * as v from "valibot";export default defineContract({list:oc.output(v.strictObject({node:v.nullable(v.bigint()),shapeType:v.nullable(v.string()),nullNode:v.null(),effectSame:v.literal(true)}))});');
    await writeFile(join(root,"kello/functions/tasks.ts"),
      'import {os} from "../_generated/rpc";import {Extensions} from "../_generated/server";import {Effect} from "effect";import {sql} from "drizzle-orm";export default os.tasks.router({list:os.tasks.list.handler(async({context})=>{const binding=Effect.runSync(Effect.provide(Extensions,context["effect/context"]));if(binding!==context.extensions)throw new Error("RPC/Effect binding identity mismatch");const api=binding.postgis_topology;const [row]=await context.db.select({node:api.getnodebypoint("packed_graph",api.geometry.ewkt("SRID=4326;POINT(8 8)"),0),shapeType:api.geometrytype({topology_id:1,layer_id:1,id:9223372036854775807n,type:1}),nullNode:api.getnodebypoint(null,null,null)}).from(sql.raw("(values (1)) fixture(id)"));if(!row||row.nullNode!==null)throw new Error("Native topology result differs");return {...row,nullNode:row.nullNode,effectSame:true as const};})});');
  }
  await assert.rejects(readFile(join(root,"kello/_generated/extensions.ts")),{code:"ENOENT"});
  assert(await loadProject(root));
  const first=await generateProject(root);
  assert.equal((await generateProject(root)).version,first.version);
  const file=join(root,"kello/_generated/extensions.ts");
  const disk=await readFile(file,"utf8");
  const {extensions}=await import(pathToFileURL(file).href);
  if(selected){
    assert.deepEqual(Object.keys(extensions),["postgis","postgis_topology"]);
    assert.equal(extensions.postgis_topology.apiSupport.digest,"a935414ebe37f352b234da7634c9c3be407c13921a574dcef16ddbd52d9e922d");
    assert.equal(Object.keys(extensions.postgis_topology.sql.overloads).length,41);
    assert.equal(Object.keys(extensions.postgis_topology.sql.casts).length,2);
    assert.equal(extensions.postgis.schema,entry.schema);
    assert(disk.includes('from "kello/extensions/postgis-topology"'));
  }else if(entry.version){
    assert.equal(extensions.postgis_topology.version,"future");
    assert.equal(extensions.postgis_topology.sql,undefined);
  }else assert.equal(extensions,undefined);
  assert(!disk.includes("/tooling/"));
  await writeFile(join(process.cwd(),entry.name+".ts"),disk);
  if(entry.name==="selected") await writeFile(join(process.cwd(),"topology-runtime.json"),
    JSON.stringify({project:root,version:first.version}));
}
const missing=join(process.cwd(),"generation","missing-companion");
await mkdir(missing,{recursive:true});
await initializeProject(missing,"topologyproof");
await writeFile(join(missing,"kello.config.ts"),
  'import {defineConfig} from "kello/tooling";export default defineConfig({database:{extensions:{postgis_topology:{version:"3.6.4",schema:"topology"}}}});');
await assert.rejects(()=>loadProject(missing),/postgis|PostGIS/);
console.log(JSON.stringify({compiledPublicTooling:true,firstLoadCases:cases.length,deterministic:true}));
`;

/** Administrative preparation stays in Bun tooling, outside the cold Node RPC process. */
export const postgisTopologyPackedPreparationSource = String.raw`
import assert from "node:assert/strict";
import {appendFile,readFile,rm,writeFile} from "node:fs/promises";
import {randomBytes,randomUUID} from "node:crypto";
import {join} from "node:path";
import pg from "pg";
import {bootstrapDatabase,createSnapshot,emptySnapshot,loadProject,migrationStatements} from "kello/tooling";
import {withPostgisTopologyOperations} from "kello/tooling/extensions/postgis-topology";
import {extensions} from "./selected.ts";
const url=process.env.LOOM_PACKED_TOPOLOGY_DATABASE_URL;
assert(url);
const descriptor=JSON.parse(await readFile("topology-runtime.json","utf8"));
const journal=(event)=>appendFile("topology-runtime-resources.jsonl",JSON.stringify({event,
  runtimeRole:descriptor.runtimeRole,metadataNamespace:descriptor.metadataNamespace})+"\n",{mode:0o600});
if(process.argv[2]==="cleanup"){
  const client=new pg.Client({connectionString:url});await client.connect();
  try{
    if(descriptor.runtimeRole && (await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1",[descriptor.runtimeRole])).rowCount){
      await client.query("DROP OWNED BY "+pg.escapeIdentifier(descriptor.runtimeRole));
      await client.query("DROP ROLE "+pg.escapeIdentifier(descriptor.runtimeRole));
    }
    assert.equal((await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1",[descriptor.runtimeRole])).rowCount,0);
    if(descriptor.metadataNamespace) await client.query("DROP SCHEMA IF EXISTS "+pg.escapeIdentifier(descriptor.metadataNamespace)+" CASCADE");
    assert.equal((await client.query("SELECT 1 FROM pg_namespace WHERE nspname=$1",[descriptor.metadataNamespace])).rowCount,0);
    await journal("independently-absent");
  }finally{await client.end();await rm("topology-runtime-credentials.json",{force:true});}
  console.log(JSON.stringify({runtimeRoleAbsent:true,metadataNamespaceAbsent:true}));
  process.exit(0);
}
const api=extensions.postgis_topology;
await withPostgisTopologyOperations(url,api,extensions.postgis,async session=>{
  await session.createtopology("packed_graph",4326,undefined,undefined,undefined,true);
  assert.equal(await session.topogeo_addpoint("packed_graph",api.geometry.ewkt("SRID=4326;POINT(8 8)")),1n);
  assert.deepEqual(await session.validatetopology("packed_graph"),[]);
});
const project=await loadProject(descriptor.project);
const client=new pg.Client({connectionString:url});await client.connect();
try{
  for(const statement of await migrationStatements(await emptySnapshot(project.schema.metadata.namespace),await createSnapshot(project.schema)))await client.query(statement);
}finally{await client.end();}
const runtimeRole="topology_runtime_"+randomUUID().replaceAll("-","");
const metadataNamespace="loom_topology_"+randomUUID().replaceAll("-","");
await writeFile(join(process.cwd(),"topology-runtime.json"),JSON.stringify({...descriptor,runtimeRole,metadataNamespace}));
await appendFile("topology-runtime-resources.jsonl",JSON.stringify({event:"attempted",runtimeRole,metadataNamespace})+"\n",{mode:0o600});
await bootstrapDatabase({connectionString:url,runtimeRole,metadataNamespace});
await appendFile("topology-runtime-resources.jsonl",JSON.stringify({event:"created",runtimeRole,metadataNamespace})+"\n",{mode:0o600});
const owner=new pg.Client({connectionString:url});await owner.connect();
try{
  const password=randomBytes(24).toString("hex");
  const role=pg.escapeIdentifier(runtimeRole);
  await owner.query("ALTER ROLE "+role+" LOGIN PASSWORD '"+password+"'");
  // Native topology routines resolve their internal geometry names through the role's search path.
  await owner.query("ALTER ROLE "+role+" SET search_path TO topology,extensions,pg_catalog");
  await owner.query("GRANT USAGE ON SCHEMA topology,extensions,packed_graph TO "+role);
  await owner.query("GRANT SELECT ON ALL TABLES IN SCHEMA topology,packed_graph TO "+role);
  const runtimeUrl=new URL(url);runtimeUrl.username=runtimeRole;runtimeUrl.password=password;
  await writeFile("topology-runtime-credentials.json",JSON.stringify({runtimeUrl:runtimeUrl.href}),{mode:0o600});
}finally{await owner.end();}
`;
