import pathlib,json
root=pathlib.Path(__file__).resolve().parents[3]
s=(root/'apps/loom/src/core/extensions/adapters/postgis-raster.ts').read_text()
body=s[s.index('const c0='):s.index('const member')]
rows=json.loads((root/'packages/e2e/fixtures/postgis-raster-operation-definitions.json').read_text())['operations']
head='''import { sql, type SQLWrapper } from "drizzle-orm";
import * as v from "valibot";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { arrayCodec, binaryCodec, booleanCodec, compositeCodec, createExtensionCodec, floatCodec, integerCodec, nullableCodec, numericCodec, textCodec, withCodecSqlType, type ExtensionCodec } from "../../../core/extensions/codecs";
import { int4Codec } from "../../../core/extensions/native-codecs";
import { int2Codec } from "../../../core/extensions/primitive-number-codecs";
import { jsonCodec, jsonbCodec } from "../../../core/extensions/native-json-codecs";
import { createSqlFunction, defaultSqlArgument, extensionSqlDialect } from "../../../core/extensions/sql";
import { createPostgisRaster_3_6_4 } from "../../../core/extensions/adapters/postgis-raster";
import { createPostgisGeometryCodec, createPostgisTextCodec } from "../../../core/extensions/adapters/postgis-codecs";
import { createPostgisRasterCodec } from "../../../core/extensions/adapters/postgis-raster-codecs";
import { withExtensionOperation } from "../operations";
import { acquireExtensionLock } from "../../migrations/connection";
import { verifyExtensionApiContracts, validateExtensionApiRequirement } from "../verify";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import manifest from "../manifests/postgis_raster.json";
const sqlOnly=createExtensionCodec({id:"postgis_raster:expression",input:v.custom<SQLWrapper>(value=>typeof value==="object"&&value!==null&&"getSQL" in value),output:v.never(),transport:"native",encode:()=>{throw new Error("Native SQL required");},decode:()=>{throw new Error("Concrete codec required");}});
const voidCodec=createExtensionCodec({id:"pg:void:1",sqlType:{schema:"pg_catalog",name:"void"},input:v.null(),output:v.null(),transport:"text",encode:()=>null,decode:()=>null});
type Descriptor = ExtensionDescriptor<"postgis_raster",{readonly version:"3.6.4";readonly schema:string}>;
type PostgisDescriptor = ExtensionDescriptor<"postgis",{readonly version:"3.6.4";readonly schema:string}>;
/** Captured maintenance routines execute only inside an owned migration transaction. */
export async function withPostgisRasterOperations<Result>(url:string,descriptor:Descriptor,postgis:PostgisDescriptor,operation:(session:PostgisRasterOperatorSession)=>Promise<Result>,signal?:AbortSignal) {
 createPostgisRaster_3_6_4(descriptor,postgis);
 return withExtensionOperation(url,context=>createOperatorSession(context,descriptor,postgis,signal),operation,signal); }
async function createOperatorSession(context:import("../operations").ExtensionOperationContext,descriptor:Descriptor,postgis:PostgisDescriptor,signal?:AbortSignal) {
  await acquireExtensionLock(context.client,signal);
  await verifyExtensionApiContracts(context.client,[validateExtensionApiRequirement({schema:descriptor.schema,manifest:v.parse(extensionManifestValidator,manifest)})]);
  const schema=descriptor.schema;
  const postgisSchema=postgis.schema;
  await context.client.query("SELECT pg_catalog.set_config('search_path',$1,true)",[`${'"'+schema.replaceAll('"','""')+'"'},${'"'+postgisSchema.replaceAll('"','""')+'"'},pg_catalog`]);
  const base={schema,dependencies:[],observability:"tables",authority:"query"} as const;
'''
lines=[head,body]
entries=[]
for x,var,options in rows:
 lines.append('const '+var+'=createSqlFunction('+options+');')
 result=options.rsplit('result:',1)[1][:-1]
 lines.append('const op'+var+'=(...values:Parameters<typeof '+var+'>)=>context.run(async()=>{const compiled=extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${'+var+'(...values)})::pg_catalog.text value`);const rows=await context.client.query(compiled.sql,compiled.params);return '+result+'.decode(rows.rows[0]?.value);});')
 entries.append(json.dumps(x['id'])+':op'+var)
lines.append('return Object.freeze({'+','.join(entries)+'});}')
lines.append('export type PostgisRasterOperatorSession=Awaited<ReturnType<typeof createOperatorSession>>;')
(root/'apps/loom/src/tooling/extensions/operations/postgis_raster.ts').write_text('\n'.join(lines)+'\n')
