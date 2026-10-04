"""Materialize only postgis_raster-owned exact 3.6.4 signatures from its immutable capture."""
import json, pathlib, collections
root=pathlib.Path(__file__).resolve().parents[3]
m=json.loads((root/'apps/loom/src/tooling/extensions/manifests/postgis_raster.json').read_text());ms=m['contract']['members']
assert len(ms)==583 and m['digest']=='8f7cd8fe4d832fcc153344cc70b5693f79fa29acb1a6b7f97c0c3de31943def2'
q=lambda x:json.dumps(x,ensure_ascii=False)
ops={'addrasterconstraints','droprasterconstraints','addoverviewconstraints','dropoverviewconstraints','updaterastersrid','st_createoverview','st_retile'}
types={(x['namespace'],x['name']):{'namespace':x['namespace'],'name':x['name']} for x in ms if x['kind']=='type'}
for x in ms:
 if x['kind']=='routine':
  for t in [x['returns'],*[a['type'] for a in x['arguments']]]:types[(t['namespace'],t['name'])]=t
 if x['kind']=='operator':
  for t in [x['returns'],x['left'],x['right']]:
   if t:types[(t['namespace'],t['name'])]=t
 if x['kind']=='cast':
  for t in [x['source'],x['target']]:types[(t['namespace'],t['name'])]=t
for x in ms:
 if x['kind']=='type' and x.get('attributes'):
  for a in x['attributes']:types[(a['type']['namespace'],a['type']['name'])]=a['type']
for (ns,name),t in list(types.items()):
 if name.startswith('_'):
  types.setdefault((ns,name[1:]),{'namespace':ns,'name':name[1:]})
lines=['import { sql, type SQLWrapper } from "drizzle-orm";','import * as v from "valibot";','import { bindExtension, type ExtensionDescriptor } from "../bindings";','import { arrayCodec, binaryCodec, booleanCodec, compositeCodec, createExtensionCodec, floatCodec, integerCodec, nullableCodec, numericCodec, textCodec, withCodecSqlType, type ExtensionCodec } from "../codecs";','import { int4Codec } from "../native-codecs";','import { int2Codec } from "../primitive-number-codecs";','import { jsonCodec, jsonbCodec } from "../native-json-codecs";','import { createExtensionField, createExtensionIndex, type ExtensionValueSchema } from "../fields";','import { extensionRows } from "../rows";','import { checkedExtensionExpression, createSqlFunction, createSqlAggregate, createSqlWindow, createSqlOperator, defaultSqlArgument, extensionSqlType, type ExtensionSqlInput } from "../sql";','import { createPostgisGeometryCodec, createPostgisTextCodec } from "./postgis-codecs";','import { createPostgisRasterCodec, rasterWkb, type PostgisRasterSemantics } from "./postgis-raster-codecs";','export * from "./postgis-raster-codecs";',f'const digest = {q(m["digest"])};','type Descriptor = ExtensionDescriptor<"postgis_raster", { readonly version: "3.6.4"; readonly schema: string }>;','type PostgisDescriptor = ExtensionDescriptor<"postgis", { readonly version: "3.6.4"; readonly schema: string }>;','const sqlOnly = createExtensionCodec({ id:"postgis_raster:concrete-native-expression:1", input:v.custom<SQLWrapper>(value => typeof value === "object" && value !== null && "getSQL" in value), output:v.never(), transport:"native", encode:() => {throw new Error("A concrete native SQL expression is required");}, decode:() => {throw new Error("A captured concrete result codec is required");} });','const voidCodec = createExtensionCodec({ id:"pg:void:1", sqlType:{schema:"pg_catalog",name:"void"}, input:v.null(),output:v.null(),transport:"text",encode:()=>null,decode:()=>null });','/** Exact captured overloads. PostgreSQL owns all raster algorithms and conversions. */','export function createPostgisRaster_3_6_4<const Selected extends Descriptor>(descriptor:Selected, postgis:PostgisDescriptor) {','if(descriptor.name !== "postgis_raster" || descriptor.version !== "3.6.4" || descriptor.apiSupport.status !== "verified" || descriptor.apiSupport.digest !== digest) throw new Error("postgis_raster 3.6.4 requires its exact verified contract");','if(postgis.name !== "postgis" || postgis.version !== "3.6.4" || postgis.apiSupport.status !== "verified") throw new Error("postgis_raster 3.6.4 requires its verified postgis 3.6.4 dependency");','if(descriptor.schema !== postgis.schema) throw new Error("postgis_raster 3.6.4 must share the PostGIS installation schema");','const schema=descriptor.schema;','const postgisSchema=postgis.schema;','const base={schema,dependencies:[],observability:"tables",authority:"query"} as const;']
codec={};pending=dict(types);cv=[]
while pending:
 progress=False
 for key,t in list(pending.items()):
  ns,name=key;expr=None
  if name in ['internal','trigger']:del pending[key];progress=True;continue
  var='c'+str(len(codec))
  if name in ['anyelement','record']:expr='sqlOnly'
  elif name.startswith('_'):
   if (ns,name[1:]) not in codec:continue
   expr='arrayCodec('+codec[(ns,name[1:])]+')'
  elif ns=='pg_catalog':
   expr={'text':'textCodec','varchar':'withCodecSqlType(textCodec, {schema:"pg_catalog",name:"varchar"})','name':'withCodecSqlType(textCodec, {schema:"pg_catalog",name:"name"})','float8':'floatCodec','int4':'int4Codec','int2':'int2Codec','int8':'integerCodec','bytea':'binaryCodec','bool':'booleanCodec','json':'jsonCodec','jsonb':'jsonbCodec','void':'voidCodec','numeric':'numericCodec','cstring':'withCodecSqlType(textCodec,{schema:"pg_catalog",name:"cstring"})','oid':'withCodecSqlType(createExtensionCodec({id:"pg:oid:1",input:v.pipe(v.number(),v.integer(),v.minValue(0),v.maxValue(4294967295)),output:v.pipe(v.number(),v.integer(),v.minValue(0),v.maxValue(4294967295)),transport:"text",encode:value=>value,decode:value=>Number(value)}),{schema:"pg_catalog",name:"oid"})','regclass':'withCodecSqlType(textCodec,{schema:"pg_catalog",name:"regclass"})'}.get(name)
   if not expr:expr=f'createPostgisTextCodec("pg_catalog",{q(name)})'
  elif ns=='$extension:postgis' and name=='geometry':expr='createPostgisGeometryCodec(postgisSchema)'
  elif ns=='$extension:postgis':expr=f'createPostgisTextCodec(postgisSchema,{q(name)})'
  elif name=='raster':expr='createPostgisRasterCodec(schema)'
  else:
   tm=next((x for x in ms if x['kind']=='type' and x['name']==name and x['namespace']==ns),None)
   if tm and tm.get('attributes'):
    if any((a['type']['namespace'],a['type']['name']) not in codec for a in tm['attributes']):continue
    fields='{'+','.join(q(a['name'])+':nullableCodec('+codec[(a['type']['namespace'],a['type']['name'])]+')' for a in tm['attributes'])+'}'
    expr=f'withCodecSqlType(compositeCodec({q("postgis_raster:"+name+":3.6.4")},{fields}),{{schema,name:{q(name)}}})'
   else:expr=f'createPostgisTextCodec(schema,{q(name)})'
  codec[key]=var;cv.append(f'const {var}={expr};');cv.append(f'const n{var}=nullableCodec({var});');del pending[key];progress=True
 if not progress:raise Exception(sorted(pending))
lines+=cv
c=lambda t:'n'+codec[(t['namespace'],t['name'])]
variables={};dispositions={};groups=collections.defaultdict(list);tooldefs=[];internal=[]
for i,x in enumerate(ms):
 kind=x['kind'];var='member'+str(i)
 if kind=='routine':
  args=[a for a in x['arguments'] if a['mode'] in ['in','inout','variadic']]
  if any(a['type']['name']=='internal' for a in args) or x['returns']['name']=='internal':internal.append(x);dispositions[x['id']]='internal';continue
  if x['returns']['name']=='trigger':dispositions[x['id']]='tooling';continue
  typeparents=[t for t in ms if t['kind']=='type' and any(t.get(k)==x['id'][8:] for k in ['input','output','receive','typmodInput','typmodOutput'])]
  if typeparents and (x['returns']['name']=='cstring' or any(a['type']['name'] in ['cstring','_cstring'] for a in args)):
   internal.append(x);dispositions[x['id']]='internal';continue
  outargs=[a for a in x['arguments'] if a['mode'] in ['out','table','inout']]
  result=c(x['returns']) if x['returns']['name'] not in ['record','anyelement'] else 'nullableCodec(concrete)' if x['returns']['name']=='anyelement' else 'nullableCodec(compositeCodec('+q(x['id'])+', rowFields'+str(i)+'))'
  if outargs:lines.append('const rowFields'+str(i)+'={'+','.join(q(a['name'])+':'+c(a['type']) for a in outargs)+'} as const;')
  aa=', '.join('defaultSqlArgument('+c(a['type'])+','+(q(a['name']) if a['name'] is not None else 'undefined')+')' if a['hasDefault'] else c(a['type']) for a in args)
  builder={'aggregate':'createSqlAggregate','window':'createSqlWindow'}.get(x['routineKind'],'createSqlFunction')
  if x['returns']['name']=='anyelement':
   aa=aa.replace(c(x['returns']),'nullableCodec(concrete)')
   expr=' <Input,Output>(concrete:ExtensionCodec<Input,Output>) => '+builder
  else:expr=builder
  options='{ ...base, name:'+q(x['name'])+',member:'+q(x['id'])+',arguments:['+aa+'] as const,result:'+result+'}'
  if x['name'] in ops:tooldefs.append((x,var,args,result,options));dispositions[x['id']]='tooling';continue
  if x['name'].startswith('_'):internal.append(x);dispositions[x['id']]='internal';continue
  lines.append('const '+var+'='+expr+'('+options+');');variables[x['id']]=var;groups[x['name']].append((x,var));dispositions[x['id']]='query'
  if x['returnsSet'] and outargs:lines.append('const rows'+str(i)+'=(alias:string,...values:Parameters<typeof '+var+'>)=>extensionRows('+var+'(...values),alias,rowFields'+str(i)+',"named");')
 elif kind=='operator':
  lines.append(f'const {var}=createSqlOperator({{...base,name:{q(x["name"])},member:{q(x["id"])},left:{c(x["left"]) if x["left"] else "undefined"},right:{c(x["right"]) if x["right"] else "undefined"},result:{c(x["returns"])}}});');variables[x['id']]=var;dispositions[x['id']]='query'
 elif kind=='cast':
  src=c(x['source']);target=c(x['target']);t=x['target'];tschema='postgisSchema' if t['namespace']=='$extension:postgis' else ('schema' if t['namespace'].startswith('$extension:') else q(t['namespace']));
  lines.append(f'const {var}=(value:ExtensionSqlInput<typeof {src}>)=>checkedExtensionExpression(sql`(${{rasterParameter(value,{src})}})::${{extensionSqlType({tschema},{q(t["name"])})}}`,{target},[],undefined,{q(x["id"])});')
  variables[x['id']]=var;dispositions[x['id']]='query'
 elif kind in ['type','opclass','relation']:dispositions[x['id']]='schema'
 else:dispositions[x['id']]='internal'
lines.insert(17, '''function rasterParameter<Input,Output>(value:ExtensionSqlInput<ExtensionCodec<Input,Output>>,codec:ExtensionCodec<Input,Output>) { if(typeof value === "object" && value !== null && "getSQL" in value) return sql`${value}`; const encoded=codec.encode(value as Input); return codec.sqlType ? sql`${sql.param(encoded)}::${extensionSqlType(codec.sqlType.schema,codec.sqlType.name)}${codec.sqlType.array ? sql`[]` : sql.empty()}` : sql`${sql.param(encoded)}`; }''')
lines.append('const overloads={'+','.join(q(k)+':'+v for k,v in variables.items())+'} as const;')
functions=[]
for name,group in groups.items():functions.append(q(name)+':'+(group[0][1] if len(group)==1 else '{'+','.join(q(x['id'][x['id'].index('('):])+':'+var for x,var in group)+'}'))
lines.append('const functions={'+','.join(functions)+'} as const;')
operators=[q(x['id'])+':'+variables[x['id']] for x in ms if x['kind']=='operator' and x['id'] in variables]
lines.append('const operators={'+','.join(operators)+'} as const;')
fields=[]
for x in ms:
 if x['kind']!='type' or x.get('element') or x['name']!='raster':continue
 k=(x['namespace'],x['name'])
 if k not in codec:continue
 value='{kind:"object",properties:{kind:{kind:"string",enum:["raster"]},format:{kind:"string",enum:["wkb"]},hex:{kind:"string"},srid:{kind:"number",integer:true},width:{kind:"number",integer:true},height:{kind:"number",integer:true},numBands:{kind:"number",integer:true}}}'
 lines.append('const rasterField=(semantics:PostgisRasterSemantics={})=>createExtensionField({extension:descriptor,member:'+q(x["id"])+',type:"raster",codec:createPostgisRasterCodec(schema,semantics),parameters:{srid:semantics.srid ?? "native",width:semantics.width ?? "native",height:semantics.height ?? "native",numBands:semantics.numBands ?? "native"},value:'+value+' as const,search:{filter:false,comparison:false,order:false,text:false} as const});')
 fields.append('"raster":rasterField')
idx=[]
for x in ms:
 if x['kind']!='opclass':continue
 lines.append('const index'+str(len(idx))+'=()=>Object.freeze({...createExtensionIndex({extension:descriptor,member:'+q(x['id'])+',method:'+q(x['accessMethod'])+',opclass:'+q(x['name'])+',type:'+q(x['input']['name'])+',default:'+str(x['isDefault']).lower()+'}), input:{schema,type:'+q(x['input']['name'])+'}});');idx.append(q(x['name'])+':index'+str(len(idx)))
lines.append('return bindExtension(descriptor,{raster:{codec:'+codec[('$extension:postgis_raster','raster')]+',field:rasterField,wkb:rasterWkb},codecs:{'+','.join(q(name)+':'+var for (ns,name),var in codec.items() if ns.startswith('$extension:postgis_raster'))+'},fields:{'+','.join(fields)+'},indexes:{'+','.join(idx)+'},sql:{functions,overloads,operators,rows:{'+','.join(q(x['id'])+':rows'+str(i) for i,x in enumerate(ms) if x['kind']=='routine' and x.get('returnsSet') and any(a['mode'] in ['out','table','inout'] for a in x['arguments']) and x['id'] in variables)+'}}}); }')
(root/'apps/loom/src/core/extensions/adapters/postgis-raster.ts').write_text('\n'.join(lines)+'\n')
anns=[]
for x in ms:
 disp=dispositions[x['id']];sem={'providerAcceptance':'pending','publicExportAcceptance':'pending'}
 if disp=='internal':
  sem['nativeGraphTransfer']='unresolved';reason='Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.'
 elif disp=='tooling':reason='Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.'
 elif disp=='query':reason='Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.'
 else:reason='Captured native type/relation/index declaration with exact namespace and identity.'
 anns.append({'id':x['id'],'disposition':disp,'reason':reason,'evidence':['apps/loom/src/tooling/extensions/manifests/postgis_raster.json','https://postgis.net/docs/manual-3.6/RT_reference.html','apps/loom/src/core/extensions/adapters/postgis-raster.ts','packages/tests/unit/extensions-postgis-raster.test.ts'],'semantics':sem})
(root/'apps/loom/src/tooling/extensions/annotations/postgis_raster.ts').write_text('export const postgisRasterAnnotations = '+json.dumps(anns,indent=2,ensure_ascii=False)+' as const;\n')
(root/'packages/e2e/fixtures/postgis-raster-member-dispositions.json').write_text(json.dumps({'digest':m['digest'],'members':dispositions},indent=2)+'\n')
(root/'packages/e2e/fixtures/postgis-raster-operation-definitions.json').write_text(json.dumps({'codecs':cv,'operations':[(x,var,options) for x,var,args,result,options in tooldefs]},indent=2)+'\n')
print('query',len(variables),'tooling',sum(v=='tooling' for v in dispositions.values()),'internal',sum(v=='internal' for v in dispositions.values()),'schema',sum(v=='schema' for v in dispositions.values()))
