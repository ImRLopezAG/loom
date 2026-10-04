"""Materialize only PostGIS-owned exact 3.6.4 signatures from its immutable capture."""
import json, pathlib, collections
root=pathlib.Path(__file__).resolve().parents[3]
m=json.loads((root/'apps/loom/src/tooling/extensions/manifests/postgis.json').read_text());ms=m['contract']['members']
assert len(ms)==1092 and m['digest']=='640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29'
q=lambda x:json.dumps(x,ensure_ascii=False)
ops={'addgeometrycolumn','dropgeometrycolumn','dropgeometrytable','populate_geometry_columns','postgis_extensions_upgrade','updategeometrysrid','postgis_cache_bbox'}
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
 if x['kind']=='type' and x['attributes']:
  for a in x['attributes']:types[(a['type']['namespace'],a['type']['name'])]=a['type']
lines=['import { sql, type SQLWrapper } from "drizzle-orm";','import * as v from "valibot";','import { bindExtension, type ExtensionDescriptor } from "../bindings";','import { arrayCodec, binaryCodec, booleanCodec, compositeCodec, createExtensionCodec, floatCodec, integerCodec, nullableCodec, textCodec, withCodecSqlType, type ExtensionCodec } from "../codecs";','import { int4Codec } from "../native-codecs";','import { int2Codec } from "../primitive-number-codecs";','import { jsonCodec, jsonbCodec } from "../native-json-codecs";','import { createExtensionField, createExtensionIndex, type ExtensionValueSchema } from "../fields";','import { extensionRows } from "../rows";','import { checkedExtensionExpression, createSqlFunction, createSqlAggregate, createSqlWindow, createSqlOperator, defaultSqlArgument, extensionSqlType, type ExtensionSqlInput } from "../sql";','import { createPostgisGeometryCodec, createPostgisGeographyCodec, createPostgisTextCodec, geometryEwkb, geometryEwkt, geographyEwkb, geographyEwkt, type PostgisSemantics } from "./postgis-codecs";','export * from "./postgis-codecs";',f'const digest = {q(m["digest"])};','type Descriptor = ExtensionDescriptor<"postgis", { readonly version: "3.6.4"; readonly schema: string }>;','const sqlOnly = createExtensionCodec({ id:"postgis:concrete-native-expression:1", input:v.custom<SQLWrapper>(value => typeof value === "object" && value !== null && "getSQL" in value), output:v.never(), transport:"native", encode:() => {throw new Error("A concrete native SQL expression is required");}, decode:() => {throw new Error("A captured concrete result codec is required");} });','const voidCodec = createExtensionCodec({ id:"pg:void:1", sqlType:{schema:"pg_catalog",name:"void"}, input:v.null(),output:v.null(),transport:"text",encode:()=>null,decode:()=>null });','/** Exact captured overloads. PostgreSQL owns all geometry algorithms and conversions. */','export function createPostgis_3_6_4<const Selected extends Descriptor>(descriptor:Selected) {','if(descriptor.name !== "postgis" || descriptor.version !== "3.6.4" || descriptor.apiSupport.status !== "verified" || descriptor.apiSupport.digest !== digest) throw new Error("PostGIS requires the exact 3.6.4 contract");','const schema=descriptor.schema;','const base={schema,dependencies:[],observability:"tables",authority:"query"} as const;']
codec={};pending=dict(types);cv=[]
while pending:
 progress=False
 for key,t in list(pending.items()):
  ns,name=key;expr=None
  if name in ['internal','trigger']:del pending[key];progress=True;continue
  var='c'+str(len(codec));typens='schema' if ns.startswith('$extension:') else q(ns)
  if name in ['anyelement','record']:expr='sqlOnly'
  elif name.startswith('_'):
   if (ns,name[1:]) not in codec:continue
   expr='arrayCodec('+codec[(ns,name[1:])]+')'
  elif ns=='pg_catalog':
   expr={'text':'textCodec','varchar':'withCodecSqlType(textCodec, {schema:"pg_catalog",name:"varchar"})','name':'withCodecSqlType(textCodec, {schema:"pg_catalog",name:"name"})','float8':'floatCodec','int4':'int4Codec','int2':'int2Codec','int8':'integerCodec','bytea':'binaryCodec','bool':'booleanCodec','json':'jsonCodec','jsonb':'jsonbCodec','void':'voidCodec','cstring':'withCodecSqlType(textCodec,{schema:"pg_catalog",name:"cstring"})','oid':'withCodecSqlType(createExtensionCodec({id:"pg:oid:1",input:v.pipe(v.number(),v.integer(),v.minValue(0),v.maxValue(4294967295)),output:v.pipe(v.number(),v.integer(),v.minValue(0),v.maxValue(4294967295)),transport:"text",encode:value=>value,decode:value=>Number(value)}),{schema:"pg_catalog",name:"oid"})','regclass':'withCodecSqlType(textCodec,{schema:"pg_catalog",name:"regclass"})'}.get(name)
   if not expr:expr=f'createPostgisTextCodec("pg_catalog",{q(name)})'
  elif name in ['geometry','geography']:expr=f'createPostgis{name.title()}Codec(schema)'
  else:
   tm=next((x for x in ms if x['kind']=='type' and x['name']==name),None)
   if tm and tm['attributes']:
    if any((a['type']['namespace'],a['type']['name']) not in codec for a in tm['attributes']):continue
    fields='{'+','.join(q(a['name'])+':nullableCodec('+codec[(a['type']['namespace'],a['type']['name'])]+')' for a in tm['attributes'])+'}'
    expr=f'withCodecSqlType(compositeCodec({q("postgis:"+name+":3.6.4")},{fields}),{{schema,name:{q(name)}}})'
   else:expr=f'createPostgisTextCodec(schema,{q(name)})'
  codec[key]=var;cv.append(f'const {var}={expr};');cv.append(f'const n{var}=nullableCodec({var});');del pending[key];progress=True
 if not progress:raise Exception(pending)
lines+=cv
c=lambda t:'n'+codec[(t['namespace'],t['name'])]
variables={};dispositions={};groups=collections.defaultdict(list);tooldefs=[];internal=[]
for i,x in enumerate(ms):
 kind=x['kind'];var='member'+str(i)
 if kind=='routine':
  args=[a for a in x['arguments'] if a['mode'] in ['in','inout','variadic']]
  if any(a['type']['name']=='internal' for a in args) or x['returns']['name']=='internal':internal.append(x);dispositions[x['id']]='internal';continue
  if x['returns']['name']=='trigger':dispositions[x['id']]='tooling';continue
  # Type input/output cstring callbacks have real type-graph ownership; ST_SwapOrdinates remains callable.
  typeparents=[t for t in ms if t['kind']=='type' and any(t.get(k)==x['id'][8:] for k in ['input','output','receive','typmodInput','typmodOutput'])]
  if typeparents and (x['returns']['name']=='cstring' or any(a['type']['name'] in ['cstring','_cstring'] for a in args)):
   internal.append(x);dispositions[x['id']]='internal';continue
  outargs=[a for a in x['arguments'] if a['mode'] in ['out','table','inout']]
  result=c(x['returns']) if x['returns']['name'] not in ['record','anyelement'] else 'nullableCodec(concrete)' if x['returns']['name']=='anyelement' else 'nullableCodec(compositeCodec('+q(x['id'])+', rowFields'+str(i)+'))'
  if outargs:lines.append('const rowFields'+str(i)+'={'+','.join(q(a['name'])+':'+c(a['type']) for a in outargs)+'} as const;')
  aa=', '.join('defaultSqlArgument('+c(a['type'])+','+(q(a['name']) if a['name'] is not None else 'undefined')+')' if a['hasDefault'] else c(a['type']) for a in args)
  builder={'aggregate':'createSqlAggregate','window':'createSqlWindow'}.get(x['routineKind'],'createSqlFunction')
  # anyelement result must be specialized by a real concrete codec, never caller-selected SQL<T>.
  if x['returns']['name']=='anyelement':
   aa=aa.replace(c(x['returns']),'nullableCodec(concrete)')
   expr=' <Input,Output>(concrete:ExtensionCodec<Input,Output>) => '+builder
  else:expr=builder
  options='{ ...base, name:'+q(x['name'])+',member:'+q(x['id'])+',arguments:['+aa+'] as const,result:'+result+'}'
  if x['name'] in ops:tooldefs.append((x,var,args,result,options));dispositions[x['id']]='tooling';continue
  lines.append('const '+var+'='+expr+'('+options+');');variables[x['id']]=var;groups[x['name']].append((x,var));dispositions[x['id']]='query'
  if x['returnsSet'] and outargs:lines.append('const rows'+str(i)+'=(alias:string,...values:Parameters<typeof '+var+'>)=>extensionRows('+var+'(...values),alias,rowFields'+str(i)+',"named");')
 elif kind=='operator':
  lines.append(f'const {var}=createSqlOperator({{...base,name:{q(x["name"])},member:{q(x["id"])},left:{c(x["left"]) if x["left"] else "undefined"},right:{c(x["right"]) if x["right"] else "undefined"},result:{c(x["returns"])}}});');variables[x['id']]=var;dispositions[x['id']]='query'
 elif kind=='cast':
  src=c(x['source']);target=c(x['target']);t=x['target'];schema='schema' if t['namespace'].startswith('$extension:') else q(t['namespace']);
  lines.append(f'const {var}=(value:ExtensionSqlInput<typeof {src}>)=>checkedExtensionExpression(sql`(${{createSqlFunction({{...base,schema:"pg_catalog",name:"identity",member:{q(x["id"])},arguments:[{src}] as const,result:{src}}})(value)}})::${{extensionSqlType({schema},{q(t["name"])})}}`, {target}, [], undefined, {q(x["id"])});')
  # Bind through a qualified native identity expression rather than a non-existent SQL routine.
  lines[-1]=f'const {var}=(value:ExtensionSqlInput<typeof {src}>)=>checkedExtensionExpression(sql`(${{postgisParameter(value,{src})}})::${{extensionSqlType({schema},{q(t["name"])})}}`,{target},[],undefined,{q(x["id"])});'
  variables[x['id']]=var;dispositions[x['id']]='query'
 elif kind in ['type','opclass','relation']:dispositions[x['id']]='schema'
 else:dispositions[x['id']]='internal'
lines.insert(17, '''function postgisParameter<Input,Output>(value:ExtensionSqlInput<ExtensionCodec<Input,Output>>,codec:ExtensionCodec<Input,Output>) { if(typeof value === "object" && value !== null && "getSQL" in value) return sql`${value}`; const encoded=codec.encode(value as Input); return codec.sqlType ? sql`${sql.param(encoded)}::${extensionSqlType(codec.sqlType.schema,codec.sqlType.name)}${codec.sqlType.array ? sql`[]` : sql.empty()}` : sql`${sql.param(encoded)}`; }''')
lines.append('const overloads={'+','.join(q(k)+':'+v for k,v in variables.items())+'} as const;')
functions=[]
for name,group in groups.items():functions.append(q(name)+':'+(group[0][1] if len(group)==1 else '{'+','.join(q(x['id'][x['id'].index('('):])+':'+var for x,var in group)+'}'))
lines.append('const functions={'+','.join(functions)+'} as const;')
# Exact fields, including custom composites and full multidimensional bounded arrays.
fields=[]
for x in ms:
 if x['kind']!='type' or x.get('element') or x['name'] in ['box2df','gidx']:continue
 name=x['name'];k=(x['namespace'],name)
 if k not in codec:continue
 var=codec[k]; isspatial=name in ['geometry','geography'];value='{kind:"union",variants:[{kind:"object",properties:{kind:{kind:"string",enum:['+q(name)+']},format:{kind:"string",enum:["ewkb"]},hex:{kind:"string"},srid:{kind:"number",integer:true},dimensions:{kind:"string",enum:["XY","XYZ","XYM","XYZM"]},geometryType:{kind:"number",integer:true}}},{kind:"object",properties:{kind:{kind:"string",enum:['+q(name)+']},format:{kind:"string",enum:["ewkt"]},text:{kind:"string"},srid:{kind:"number",integer:true},dimensions:{kind:"string",enum:["XY","XYZ","XYM","XYZM"]}}}]}' if isspatial else '{kind:"object",properties:{type:{kind:"string",enum:['+q(name)+']},text:{kind:"string"}}}'
 if x['attributes']:continue # Public composite codecs and row declarations are provided; schema composite fields follow separately.
 arg='semantics:PostgisSemantics & {readonly type?:string}={}' if isspatial else ''
 co=f'createPostgis{name.title()}Codec(schema,semantics)' if isspatial else var
 tm='typmods:semantics.type ? [semantics.type+(semantics.dimensions === "XYZM" ? "ZM" : semantics.dimensions === "XYZ" ? "Z" : semantics.dimensions === "XYM" ? "M" : ""),semantics.srid ?? 0] : [],parameters:{srid:semantics.srid ?? "native",dimensions:semantics.dimensions ?? "native"},' if isspatial else ''
 lines.append(f'const {name}Field=({arg})=>createExtensionField({{extension:descriptor,member:{q(x["id"])},type:{q(name)},codec:{co},{tm}value:{value} as const,search:{{filter:false,comparison:false,order:false,text:false}} as const}});');fields.append(q(name)+':'+name+'Field')
idx=[]
for x in ms:
 if x['kind']!='opclass':continue
 lines.append('const index'+str(len(idx))+'=()=>Object.freeze({...createExtensionIndex({extension:descriptor,member:'+q(x['id'])+',method:'+q(x['accessMethod'])+',opclass:'+q(x['name'])+',type:'+q(x['input']['name'])+',default:'+str(x['isDefault']).lower()+'}), input:{schema,type:'+q(x['input']['name'])+',dimensions:0}});');idx.append(q(x['name'])+':index'+str(len(idx)))
get=lambda name,sig:next(var for x,var in groups[name] if x['id'].endswith(sig))
gdist=get('st_distance','($extension:postgis.geometry,$extension:postgis.geometry)');geodist=get('st_distance','($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)')
lines.append('function sameSemantics(left:ExtensionSqlInput<typeof '+c({'namespace':'$extension:postgis','name':'geometry'})+'>,right:ExtensionSqlInput<typeof '+c({'namespace':'$extension:postgis','name':'geometry'})+'>) { if(left && right && "kind" in left && "kind" in right && left.srid !== right.srid) throw new Error("PostGIS geometry arguments require equal SRIDs"); }')
lines.append('return bindExtension(descriptor,{geometry:{codec:'+codec[('$extension:postgis','geometry')]+',field:geometryField,ewkb:geometryEwkb,ewkt:geometryEwkt,distance:(...values:Parameters<typeof '+gdist+'>)=>{sameSemantics(values[0],values[1]);return '+gdist+'(...values);},distanceUnits:"coordinate-system" as const},geography:{codec:'+codec[('$extension:postgis','geography')]+',field:geographyField,ewkb:geographyEwkb,ewkt:geographyEwkt,distance:'+geodist+',distanceUnits:"meters" as const},codecs:{'+','.join(q(name)+':'+var for (ns,name),var in codec.items() if ns.startswith('$extension:'))+'},fields:{'+','.join(fields)+'},indexes:{'+','.join(idx)+'},sql:{functions,overloads,rows:{'+','.join(q(x['id'])+':rows'+str(i) for i,x in enumerate(ms) if x['kind']=='routine' and x['returnsSet'] and any(a['mode'] in ['out','table','inout'] for a in x['arguments']) and x['id'] in variables)+'}}}); }')
(root/'apps/loom/src/core/extensions/adapters/postgis.ts').write_text('\n'.join(lines)+'\n')
# Explicitly unresolved native graph transfers are data, never invented verification counts.
anns=[]
for x in ms:
 disp=dispositions[x['id']];sem={'providerAcceptance':'pending','publicExportAcceptance':'pending'}
 if disp=='internal':
  sem['nativeGraphTransfer']='unresolved';reason='Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no direct application helper inferred.'
 elif disp=='tooling':reason='Captured DDL/trigger operation requires explicit owned migration/operator execution; absent from application query helpers.'
 elif disp=='query':reason='Exact SQL-callable captured signature with native result codec and qualified selected namespace.'
 else:reason='Captured native type/relation/index declaration with exact namespace and identity.'
 anns.append({'id':x['id'],'disposition':disp,'reason':reason,'evidence':['apps/loom/src/tooling/extensions/manifests/postgis.json','https://postgis.net/docs/reference.html','apps/loom/src/core/extensions/adapters/postgis.ts','packages/tests/unit/extensions-postgis.test.ts'],'semantics':sem})
(root/'apps/loom/src/tooling/extensions/annotations/postgis.ts').write_text('export const postgisAnnotations = '+json.dumps(anns,indent=2,ensure_ascii=False)+' as const;\n')
(root/'packages/e2e/fixtures/postgis-member-dispositions.json').write_text(json.dumps({'digest':m['digest'],'members':dispositions},indent=2)+'\n')
# Save only generated codec/declaration pieces for the owned tooling authoring step.
(root/'packages/e2e/fixtures/postgis-operation-definitions.json').write_text(json.dumps({'codecs':cv,'operations':[(x,var,options) for x,var,args,result,options in tooldefs]},indent=2)+'\n')
print('query',len(variables),'tooling',sum(v=='tooling' for v in dispositions.values()),'internal',sum(v=='internal' for v in dispositions.values()))
