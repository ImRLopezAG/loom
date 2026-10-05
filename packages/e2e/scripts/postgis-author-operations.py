import pathlib,json
root=pathlib.Path(__file__).resolve().parents[3]
s=(root/'apps/loom/src/core/extensions/adapters/postgis.ts').read_text()
body=s[s.index('const c0='):s.index('const member')]
rows=json.loads((root/'packages/e2e/fixtures/postgis-operation-definitions.json').read_text())['operations']
head='''import { sql, type SQLWrapper } from "drizzle-orm";
import * as v from "valibot";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { arrayCodec, binaryCodec, booleanCodec, compositeCodec, createExtensionCodec, floatCodec, integerCodec, nullableCodec, textCodec, withCodecSqlType, type ExtensionCodec } from "../../../core/extensions/codecs";
import { int4Codec } from "../../../core/extensions/native-codecs";
import { int2Codec } from "../../../core/extensions/primitive-number-codecs";
import { jsonCodec, jsonbCodec } from "../../../core/extensions/native-json-codecs";
import { createSqlFunction, defaultSqlArgument, extensionSqlDialect } from "../../../core/extensions/sql";
import { createPostgis_3_6_4 } from "../../../core/extensions/adapters/postgis";
import { createPostgisGeometryCodec, createPostgisGeographyCodec, createPostgisTextCodec } from "../../../core/extensions/adapters/postgis-codecs";
import { withExtensionOperation } from "../operations";
import { acquireExtensionLock } from "../../migrations/connection";
import { verifyExtensionApiContracts, validateExtensionApiRequirement } from "../verify";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import manifest from "../manifests/postgis.json";
const sqlOnly=createExtensionCodec({id:"postgis:expression",input:v.custom<SQLWrapper>(value=>typeof value==="object"&&value!==null&&"getSQL" in value),output:v.never(),transport:"native",encode:()=>{throw new Error("Native SQL required");},decode:()=>{throw new Error("Concrete codec required");}});
const voidCodec=createExtensionCodec({id:"pg:void:1",sqlType:{schema:"pg_catalog",name:"void"},input:v.null(),output:v.null(),transport:"text",encode:()=>null,decode:()=>null});
type Descriptor = ExtensionDescriptor<"postgis",{readonly version:"3.6.4";readonly schema:string}>;
/** Captured maintenance routines execute only inside an owned migration transaction. */
export async function withPostgisOperations<Result>(url:string,descriptor:Descriptor,operation:(session:PostgisOperatorSession)=>Promise<Result>,signal?:AbortSignal) {
 createPostgis_3_6_4(descriptor);
 return withExtensionOperation(url,async context=> {
  await acquireExtensionLock(context.client,signal);
  await verifyExtensionApiContracts(context.client,[validateExtensionApiRequirement({schema:descriptor.schema,manifest:v.parse(extensionManifestValidator,manifest)})]);
  const schema=descriptor.schema;
  await context.client.query("SELECT pg_catalog.set_config('search_path',$1,true)",[`${'"'+schema.replaceAll('"','""')+'"'},pg_catalog`]);
  const base={schema,dependencies:[],observability:"tables",authority:"query"} as const;
'''
lines=[head,body]
entries=[]
for x,var,options in rows:
 lines.append('const '+var+'=createSqlFunction('+options+');')
 result=options.rsplit('result:',1)[1][:-1]
 lines.append('const op'+var+'=(...values:Parameters<typeof '+var+'>)=>context.run(async()=>{const compiled=extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${'+var+'(...values)})::pg_catalog.text value`);const rows=await context.client.query(compiled.sql,compiled.params);return '+result+'.decode(rows.rows[0]?.value);});')
 entries.append(json.dumps(x['id'])+':op'+var)
lines.append('return Object.freeze({'+','.join(entries)+'});},operation,signal);}')
lines.append('export type PostgisOperatorSession=Parameters<Parameters<typeof withPostgisOperations>[2]>[0];')
# recursive type alias would be circular; infer initializer return via separate factory below instead.
out='\n'.join(lines).replace('operation:(session:PostgisOperatorSession)=>Promise<Result>','operation:(session:PostgisOperatorSession)=>Promise<Result>')
# exact session signatures are inferred from generated definition result types using a standalone helper.
start=out.index('const c0=');end=out.index('return Object.freeze({',start)
factory=out[start:end]
# use the actual initializer implementation with typed context to infer the session, avoiding annotation recursion.
out=out.replace('return withExtensionOperation(url,async context=> {','return withExtensionOperation(url,context=>createOperatorSession(context,descriptor,signal),operation,signal); }\nasync function createOperatorSession(context:import("../operations").ExtensionOperationContext,descriptor:Descriptor,signal?:AbortSignal) {')
out=out.replace('},operation,signal);}','}')
out=out.replace('export type PostgisOperatorSession=Parameters<Parameters<typeof withPostgisOperations>[2]>[0];','export type PostgisOperatorSession=Awaited<ReturnType<typeof createOperatorSession>>;')
(root/'apps/loom/src/tooling/extensions/operations/postgis.ts').write_text(out+'\n')
