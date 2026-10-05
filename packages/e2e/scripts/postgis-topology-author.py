"""Author only the topology family's exact, closed 3.6.4 surfaces from its checked manifest."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[3]
manifest_path = root / 'apps/loom/src/tooling/extensions/manifests/postgis_topology.json'
m = json.loads(manifest_path.read_text())
core = json.loads((manifest_path.parent / 'postgis.json').read_text())
assert (m['contract']['extension'], m['contract']['version'], len(m['contract']['members'])) == ('postgis_topology', '3.6.4', 191)
ms = m['contract']['members']
q = lambda value: json.dumps(value, ensure_ascii=False)
# Native read-only implementations, including VOLATILE SQL lookup/geometry wrappers.
read = {'equals','findlayer','findtopology','geometry','geometrytype','getedgebypoint','getfacebypoint','getfacecontainingpoint','getnodebypoint','getnodeedges','getringedges','gettopogeomelementarray','gettopogeomelements','gettopologyid','gettopologyname','gettopologysrid','intersects','postgis_topology_scripts_installed','st_geometrytype','st_getfaceedges','st_getfacegeometry','st_simplify','st_srid','topoelement','topoelementarray_agg','topoelementarray_append','topologysummary','totaltopologysize','validatetopologyprecision'}
def disposition(x):
    if x['kind'] == 'routine':
        if x['name'].startswith('_') or x['returns']['name'] == 'trigger': return 'internal'
        if x['name'] in read or (x['name'] == 'asgml' and x['volatility'] == 'stable'): return 'query'
        return 'tooling'
    if x['kind'] == 'type' or x['id'].startswith(('composite type:', 'domain constraint:')): return 'schema'
    if x['kind'] == 'cast' or (x['kind'] == 'relation' and x['relationKind'] in ['r','S']): return 'query'
    return 'internal'

types = {x['name']: x for x in ms if x['kind'] == 'type'}
primitive = {'int4':'int4Codec','int8':'integerCodec','float8':'floatCodec','bool':'booleanCodec','text':'textCodec','varchar':'withCodecSqlType(textCodec,{schema:"pg_catalog",name:"varchar"})','name':'withCodecSqlType(textCodec,{schema:"pg_catalog",name:"name"})','regclass':'withCodecSqlType(textCodec,{schema:"pg_catalog",name:"regclass"})','_int8':'arrayCodec(integerCodec)','geometry':'createPostgisGeometryCodec(postgisSchema)','void':'voidCodec'}
refs = {}
lines = []
def codec(ref):
    key = (ref['namespace'],ref['name'])
    if key in refs: return refs[key]
    name = ref['name']
    if ref['namespace'] != '$extension:postgis_topology':
        assert name in primitive, ref
        expression = primitive[name]
    else:
        t = types[name]
        if t['element']:
            expression = f'withCodecSqlType(arrayCodec({codec(t["element"])}),{{schema,name:{q(t["element"]["name"])},array:true}})'
        elif t['base']:
            expression = f'withCodecSqlType({codec(t["base"])},{{schema,name:{q(name)}}})'
        else:
            assert t['attributes'], t
            # A standalone composite may contain NULL even for table NOT NULL attributes.
            fields = ','.join(q(a['name'])+':nullableCodec('+codec(a['type'])+')' for a in t['attributes'])
            lines.append(f'const {name}Fields = Object.freeze({{{fields}}});')
            expression = f'withCodecSqlType(compositeCodec("postgis_topology:{name}:3.6.4",{name}Fields),{{schema,name:{q(name)}}})'
    variable = f'c{len(refs)}'
    refs[key] = variable
    lines.append(f'const {variable} = {expression};')
    return variable
for t in types.values(): codec({'namespace':'$extension:postgis_topology','name':t['name']})
for x in ms:
    if x['kind'] == 'routine' and disposition(x) != 'internal':
        for a in x['arguments']: codec(a['type'])
        if x['returns']['name'] != 'record': codec(x['returns'])
        else:
            fields = ','.join(q(a['name'])+':nullableCodec('+codec(a['type'])+')' for a in x['arguments'] if a['mode'] in ['out','table','inout'])
            lines.append(f'const {x["name"]}Fields = Object.freeze({{{fields}}});')
            lines.append(f'const {x["name"]}Result = compositeCodec("postgis_topology:{x["name"]}:3.6.4",{x["name"]}Fields);')
sequence = next(x for x in ms if x['kind'] == 'relation' and x['relationKind'] == 'S')
sequence_fields = ','.join(q(a['name'])+':'+codec(a['type']) for a in sequence['columns'])
lines.append(f'const topology_id_seqFields = Object.freeze({{{sequence_fields}}});')
lines.append('const topology_id_seqResult = compositeCodec("postgis_topology:topology_id_seq:3.6.4",topology_id_seqFields);')
# Preserve public value schemas for all stored native types, with rank and bound data.
arrayvalue='''export function postgresTopologyArrayValue(element: ExtensionValueSchema): ExtensionValueSchema {
  let values: ExtensionValueSchema = {kind:"array",items:{kind:"union",variants:[element,{kind:"null"}]}};
  const ranks: ExtensionValueSchema[] = [values];
  for (let rank=2;rank<=6;rank++) { values={kind:"array",items:values}; ranks.push(values); }
  return {kind:"object",properties:{dimensions:{kind:"array",items:{kind:"object",properties:{lowerBound:{kind:"number",integer:true},length:{kind:"number",integer:true,minimum:0}}}},values:{kind:"union",variants:ranks}}};
}
'''
def value(ref):
    if ref['namespace'] != '$extension:postgis_topology':
        name=ref['name']
        if name=='_int8':return 'postgresTopologyArrayValue({kind:"bigint"})'
        if name=='float8':return q({'kind':'union','variants':[{'kind':'number'},{'kind':'object','properties':{'nonfinite':{'kind':'string','enum':['NaN','Infinity','-Infinity']}}}]})
        return q({'kind':'bigint' if name=='int8' else 'boolean' if name=='bool' else 'number' if name in ['int4','float8'] else 'string'})
    t=types[ref['name']]
    if t['element']: return 'postgresTopologyArrayValue('+value(t['element'])+')'
    if t['base']: return value(t['base'])
    # Include every attribute, allowing native composite NULLs.
    return '{kind:"object",properties:{'+','.join(q(a['name'])+':{kind:"union",variants:['+value(a['type'])+',{kind:"null"}]}' for a in t['attributes'])+'}}'
vals = '\n'.join(f'const {name}Value = {value({"namespace":"$extension:postgis_topology","name":name})}'+(';' if types[name]['base'] else ' as const;') for name in types if not name.startswith('_'))
codec_exports = ','.join(q(name)+':'+codec({'namespace':'$extension:postgis_topology','name':name}) for name in types)
field_exports = ','.join(q(name)+':'+name+'Fields' for name,t in types.items() if t['attributes'])
primitive_exports = ','.join(q(ns+':'+name)+':'+var for (ns,name),var in refs.items() if ns!='$extension:postgis_topology')
value_exports = ','.join(q(name)+':'+(f'{name[1:]}ArrayValue' if name.startswith('_') else f'{name}Value') for name in types)
array_vals = '\n'.join(f'const {name[1:]}ArrayValue = postgresTopologyArrayValue({name[1:]}Value);' for name in types if name.startswith('_'))
codecs = '''import * as v from "valibot";
import { arrayCodec, booleanCodec, compositeCodec, createExtensionCodec, floatCodec, integerCodec, nullableCodec, textCodec, withCodecSqlType, type CodecOutput } from "../codecs";
import { int4Codec } from "../native-codecs";
import type { ExtensionValueSchema } from "../values";
import { createPostgisGeometryCodec } from "./postgis-codecs";
const voidCodec = createExtensionCodec({id:"pg:void:1",sqlType:{schema:"pg_catalog",name:"void"},input:v.null(),output:v.null(),transport:"text",encode:()=>null,decode:()=>null});
'''+arrayvalue+'''/** Native domains use PostgreSQL's captured constraints; no graph or domain algorithms run in JS. */
export function createPostgisTopologyCodecs(schema: string, postgisSchema: string) {
'''+ '\n'.join(lines)+'\n'+vals+'\n'+array_vals+f'\nreturn Object.freeze({{types:Object.freeze({{{codec_exports}}}),fields:Object.freeze({{{field_exports}}}),primitives:Object.freeze({{{primitive_exports}}}),values:Object.freeze({{{value_exports}}})}});\n}}\n'+'''export type Topogeometry = CodecOutput<ReturnType<typeof createPostgisTopologyCodecs>["types"]["topogeometry"]>;
export type Topoelement = CodecOutput<ReturnType<typeof createPostgisTopologyCodecs>["types"]["topoelement"]>;
export type Topoelementarray = CodecOutput<ReturnType<typeof createPostgisTopologyCodecs>["types"]["topoelementarray"]>;
'''
(root/'apps/loom/src/core/extensions/adapters/postgis-topology-codecs.ts').write_text(codecs)

def expr(ref):
    if ref['namespace']=='$extension:postgis_topology': return 'codecs.types['+q(ref['name'])+']'
    return 'codecs.primitives['+q(ref['namespace']+':'+ref['name'])+']'
def args(x): return [a for a in x['arguments'] if a['mode'] in ['in','inout','variadic']]
def result(x): return f'codecs.{x["name"]}Result' if x['returns']['name']=='record' else 'nullableCodec('+expr(x['returns'])+')'
def declaration(x,i):
    arguments=[]
    for a in args(x):
        c='nullableCodec('+expr(a['type'])+')'
        arguments.append(f'defaultSqlArgument({c},{q(a["name"])})' if a['hasDefault'] else c)
    creator = 'createSqlAggregate' if x['routineKind']=='aggregate' else 'createSqlFunction'
    pure = x['name'] in ['postgis_topology_scripts_installed','topoelement','topoelementarray_agg','topoelementarray_append','geometrytype','st_geometrytype']
    return f'const member{i} = {creator}({{...base,observability:{q("tables" if pure else "external")},name:{q(x["name"])},member:{q(x["id"])},arguments:[{",".join(arguments)}] as const,result:{result(x)}}});'
query_members = [(i,x) for i,x in enumerate(ms) if x['kind']=='routine' and disposition(x)=='query']
ops = [(i,x) for i,x in enumerate(ms) if x['kind']=='routine' and disposition(x)=='tooling']
def group(members,prefix='member'):
    groups={}
    for i,x in members: groups.setdefault(x['name'],[]).append((i,x))
    def grouped(entries):
        if len(entries)==1:return prefix+str(entries[0][0])
        return 'Object.freeze({'+','.join(q(x['id'].split(x['name'],1)[1])+':'+prefix+str(i) for i,x in entries)+'})'
    return ',\n'.join(q(name)+':'+grouped(entries) for name,entries in groups.items())
base='const base = {schema:descriptor.schema,dependencies:[],observability:"external",authority:"query"} as const;'
query_decl='\n'.join(declaration(x,i) for i,x in query_members)
rows=[]
for i,x in query_members:
    if not x['returnsSet']:continue
    if x['returns']['name'] in types and types[x['returns']['name']]['attributes']:
        fields='codecs.fields['+q(x['returns']['name'])+']'
    else: fields='{value:nullableCodec('+expr(x['returns'])+')}'
    rows.append(q(x['id'])+f':(alias:string,...values:Parameters<typeof member{i}>)=>extensionRows(member{i}(...values),alias,{fields},"named")')
for x in ms:
    if x['kind']=='relation' and x['relationKind']=='r':
        name=x['name'];rows.append(q(x['id'])+f':(alias:string)=>extensionRows(checkedExtensionExpression(sql`${{sql.identifier(descriptor.schema)}}.${{sql.identifier({q(name)})}}`,codecs.types[{q(name)}],[],undefined,{q(x["id"])},"external"),alias,codecs.fields[{q(name)}],"named")')
rows.append(q(sequence['id'])+':(alias:string)=>extensionRows(checkedExtensionExpression(sql`${sql.identifier(descriptor.schema)}.${sql.identifier("topology_id_seq")}`,codecs.topology_id_seqResult,[],undefined,'+q(sequence['id'])+',"external"),alias,codecs.topology_id_seqFields,"named")')
# No expression cast guesses: use the exact captured cast's native procedure.
casts=[]
for x in ms:
    if x['kind']=='cast':
        proc=x['procedure'].split('.',1)[1].split('(',1)[0]
        casts.append(q(x['id'])+':createSqlFunction({...base,name:'+q(proc)+',member:'+q(x['id'])+',arguments:[nullableCodec('+expr(x['source'])+')] as const,result:nullableCodec('+expr(x['target'])+')})')
fields=[]
for name,t in types.items():
    base_name=t['element']['name'] if t['element'] else name
    fields.append(q(name)+f':()=>createExtensionField({{extension:descriptor,member:{q(t["id"])},type:{q(base_name)},codec:codecs.types[{q(name)}],array:{str(bool(t["element"])).lower()},value:codecs.values[{q(name)}],search}})')
adapter='''import { sql } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { nullableCodec } from "../codecs";
import { createExtensionField } from "../fields";
import { extensionRows } from "../rows";
import { checkedExtensionExpression, createSqlFunction, createSqlAggregate, defaultSqlArgument } from "../sql";
import { createPostgisTopologyCodecs } from "./postgis-topology-codecs";
import { geometryEwkt, geometryEwkb } from "./postgis-codecs";
export type { Topogeometry, Topoelement, Topoelementarray } from "./postgis-topology-codecs";
export type PostgisTopologyDescriptor = ExtensionDescriptor<"postgis_topology", {readonly version:"3.6.4"; readonly schema:string}>;
export type TopologyPostgisDescriptor = ExtensionDescriptor<"postgis", {readonly version:"3.6.4"; readonly schema:string}>;
'''+f'export const postgisTopologyDigest = {q(m["digest"])};\nconst postgisDigest = {q(core["digest"])};\n'+'''/** Exact topology 3.6.4. Native read routines compose with the restricted invocation database.
 * Dynamic graph/catalog lookups are externally observable and cannot promise Loom table invalidation.
 * Graph edits, DDL and session diagnostics live exclusively in operator tooling.
 */
export function createPostgisTopology_3_6_4<const Selected extends PostgisTopologyDescriptor>(descriptor:Selected,postgis:TopologyPostgisDescriptor) {
  if (descriptor.name!=="postgis_topology" || descriptor.version!=="3.6.4" || descriptor.schema!=="topology" || descriptor.apiSupport.status!=="verified" || descriptor.apiSupport.digest!==postgisTopologyDigest) throw new Error("postgis_topology 3.6.4 requires its exact verified fixed-schema contract");
  if (postgis.name!=="postgis" || postgis.version!=="3.6.4" || postgis.apiSupport.status!=="verified" || postgis.apiSupport.digest!==postgisDigest) throw new Error("postgis_topology 3.6.4 requires its exact verified postgis 3.6.4 dependency");
  const codecs = createPostgisTopologyCodecs(descriptor.schema,postgis.schema);
  const search = {filter:false,comparison:false,order:false,text:false} as const;
'''+base+'\n'+query_decl+'\nconst functions = Object.freeze({'+group(query_members)+'});\n'+f'return bindExtension(descriptor,{{...functions,geometry:Object.assign(functions.geometry,{{ewkt:geometryEwkt,ewkb:geometryEwkb}}),codecs:codecs.types,fields:Object.freeze({{{",".join(fields)}}}),sql:Object.freeze({{functions,operators:Object.freeze({{}}),overloads:Object.freeze({{{",".join(q(x["id"])+":member"+str(i) for i,x in query_members)}}}),casts:Object.freeze({{{",".join(casts)}}}),types:codecs.types,rows:Object.freeze({{{",".join(rows)}}})}})}});\n}}\n'
(root/'apps/loom/src/core/extensions/adapters/postgis-topology.ts').write_text(adapter)
# Both anonymous OUT layouts are needed only by operator diagnostics.
codecs=codecs.replace('primitives:Object.freeze({','topology_id_seqFields,topology_id_seqResult,populate_topology_layerResult,validatetopologyrelationResult,populate_topology_layerFields,validatetopologyrelationFields,primitives:Object.freeze({')
(root/'apps/loom/src/core/extensions/adapters/postgis-topology-codecs.ts').write_text(codecs)
ops_decl=[]
for i,x in ops:
    ops_decl.append(declaration(x,i))
    codecs_list=['nullableCodec('+expr(a['type'])+')' for a in args(x)]
    params=', '.join(f'argument{j}{"?" if a["hasDefault"] else ""}:CodecInput<typeof arguments{i}[{j}]>' for j,a in enumerate(args(x)))
    # Validate values before SQL construction, so a SQLWrapper cannot smuggle arbitrary operator SQL.
    ops_decl.append(f'const arguments{i} = [{",".join(codecs_list)}] as const;')
    output=f'{result(x)}.decode(rows.rows[0]?.value)' if not x['returnsSet'] else f'rows.rows.map(row=>{result(x)}.decode(row.value))'
    validate = f'for (const [index,value] of values.entries()) {{ if(value!==undefined) /* SAFETY: The index selects the captured codec; encode validates the value before any operator SQL executes. */ arguments{i}[index]!.encode(value as never); }}' if args(x) else ''
    ops_decl.append(f'const operation{i} = (...values:[{params}])=>context.run(async()=>{{ {validate} const compiled=extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${{member{i}(...values)}})::pg_catalog.text value`); const rows=await context.client.query(compiled.sql,compiled.params); return {output}; }});')
operations='''import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import { nullableCodec, type CodecInput } from "../../../core/extensions/codecs";
import { createSqlFunction, defaultSqlArgument, extensionSqlDialect } from "../../../core/extensions/sql";
import { createPostgisTopology_3_6_4, type PostgisTopologyDescriptor, type TopologyPostgisDescriptor } from "../../../core/extensions/adapters/postgis-topology";
import { createPostgisTopologyCodecs } from "../../../core/extensions/adapters/postgis-topology-codecs";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { acquireExtensionLock } from "../../migrations/connection";
import { withExtensionOperation, type ExtensionOperationContext } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import manifest from "../manifests/postgis_topology.json";
import postgisManifest from "../manifests/postgis.json";
/** Closed native mutation/diagnostic routines. No raw query, connection or executable SQL input escapes.
 * Exact live verification admits the callback only after both dependency contracts match.
 */
export async function withPostgisTopologyOperations<Result>(directOperatorUrl:string,descriptor:PostgisTopologyDescriptor,postgis:TopologyPostgisDescriptor,operation:(session:PostgisTopologyOperatorSession)=>Promise<Result>,signal?:AbortSignal) {
  createPostgisTopology_3_6_4(descriptor,postgis);
  return withExtensionOperation(directOperatorUrl,async context=>{
    await acquireExtensionLock(context.client,signal);
    // Canonical topology capture exposes its fixed namespace while dependency types remain qualified.
    await context.client.query('SET LOCAL search_path TO topology,pg_catalog');
    await verifyExtensionApiContracts(context.client,[validateExtensionApiRequirement({schema:descriptor.schema,manifest:v.parse(extensionManifestValidator,manifest)}),validateExtensionApiRequirement({schema:postgis.schema,manifest:v.parse(extensionManifestValidator,postgisManifest)})]);
    const quote=(name:string)=>'"'+name.replaceAll('"','""')+'"';
    await context.client.query("SELECT pg_catalog.set_config('search_path',$1,true)",[`${quote(descriptor.schema)},${quote(postgis.schema)},pg_catalog`]);
    return createSession(context,descriptor,postgis);
  },operation,signal);
}
function createSession(context:ExtensionOperationContext,descriptor:PostgisTopologyDescriptor,postgis:TopologyPostgisDescriptor) {
 const codecs = createPostgisTopologyCodecs(descriptor.schema,postgis.schema);
'''+base+'\n'+'\n'.join(ops_decl)+'\nconst functions=Object.freeze({'+group(ops,'operation')+'});\nreturn Object.freeze({...functions,routines:Object.freeze({'+','.join(q(x['id'])+':operation'+str(i) for i,x in ops)+'})});\n}\nexport type PostgisTopologyOperatorSession = ReturnType<typeof createSession>;\n'
(root/'apps/loom/src/tooling/extensions/operations/postgis-topology.ts').write_text(operations)
reasons={'query':'Captured native read-only SQL routine/cast or metadata observation, with exact argument and result codecs; dynamic topology relations have external observability.','tooling':'Captured native graph mutation, administration or session diagnostic; only a closed value-only operator routine on the owned migration transaction.','schema':'Captured native type, array, composite layout or domain constraint; family codecs and field declarations preserve bigint IDs, NULLs and bounds.','internal':'Extension-owned native implementation/catalogue object. Installed and verified as part of the exact extension contract; no independent application helper or replacement DDL.'}
implementation_reasons = {
 '_asgmledge':'Native edge/node GML bookkeeping for the captured AsGML overloads; the value-only operator path preserves visited-table writes.',
 '_asgmlface':'Native face-ring GML implementation behind AsGML; no independent application helper or replacement traversal.',
 '_asgmlnode':'Native GML node serialization behind AsGML; no independent application helper.',
 '_checkedgelinking':'Native edge-link validation support used by ValidateTopology diagnostics.',
 '_registermissingfaces':'Native missing-face registration used by ST_CreateTopoGeo.',
 '_st_adjacentedges':'Captured native SQL/MM adjacency implementation. Its underscore support routine remains internal; no new public graph interface.',
 '_st_mintolerance':'Native tolerance computation used by native topology import/precision routines; no JS tolerance algorithm.',
 '_topogeo_addlinestringnoface':'Native topology import support used by ST_CreateTopoGeo before native face registration.',
 '_validatetopologyedgelinking':'Native ValidateTopology edge-link diagnostics and temporary native state.',
 '_validatetopologygetfaceshellmaximaledgering':'Native ValidateTopology face-shell diagnostic support.',
 '_validatetopologygetringedges':'Native ValidateTopology ring diagnostic support.',
 '_validatetopologyrings':'Native ValidateTopology ring diagnostics and temporary native state.',
 'layertrigger':'Native callback on layer_integrity_checks; exercised by native layer administration, never callable as an ordinary scalar API.',
 'topogeo_addgeometry':'Captured native routine is an upstream 3.6.4 stub that raises P0001: TopoGeo_AddGeometry not implemented yet, use TopoGeo_LoadGeometry. The closed operator preserves that native error; no fallback implementation.',
 'st_newedgessplit':'Captured native ST_NewEdgesSplit. Local PG18/3.6.4 characterization retains SQLSTATE 42601 for edges referenced by a line TopoGeometry; unreferenced native split is separately exercised. No fallback or claimed provider acceptance.',
 'relationtrigger':'Native callback attached to relation tables created by CreateTopology; native TopoGeometry mutations retain its enforcement.'
}
annotations=[]
for x in ms:
 d=disposition(x)
 reason=implementation_reasons.get(x['name'],reasons[d])
 semantics={'authority':'operator' if d=='tooling' else 'query' if d=='query' else 'schema' if d=='schema' else 'native-internal','providerAcceptance':'pending','publicExportAcceptance':'pending','nativeAcceptance':'pending'}
 if x['kind']=='other' and x['objectType'] in ['table column','sequence column','table constraint','default value','trigger']:
  reason='Native installed topology/layer/sequence catalogue attachment: '+x['identity']+'. Exact contract verification and native graph/layer routines retain it; no separate application DDL/helper.'
 if x['kind']=='relation' and x['relationKind'] not in ['r','S']:
  reason='Native installed index/TOAST structure for the topology metadata relations; exact installation and native graph/layer administration retain it.'
 annotations.append({'id':x['id'],'disposition':d,'reason':reason,'evidence':['apps/loom/src/tooling/extensions/manifests/postgis_topology.json','https://postgis.net/docs/Topology.html','apps/loom/src/core/extensions/adapters/postgis-topology.ts','apps/loom/src/tooling/extensions/operations/postgis-topology.ts','packages/tests/unit/extensions-postgis-topology.test.ts','packages/e2e/integration/extensions-postgis-topology.test.ts','packages/e2e/scripts/postgis-topology-native-characterization.ts'],'semantics':semantics})

(root/'apps/loom/src/tooling/extensions/annotations/postgis-topology.ts').write_text('export const postgisTopologyAnnotationContract = '+json.dumps({'extension':'postgis_topology','postgresMajor':18,'version':'3.6.4','provider':'neon','digest':m['digest'],'providerAcceptance':'pending'},indent=2)+' as const;\n\nexport const postgisTopologyAnnotations = '+json.dumps(annotations,indent=2)+' as const;\n')
print(json.dumps({'digest':m['digest'],'members':len(ms),'queryRoutines':len(query_members),'operatorRoutines':len(ops),'nativeTypes':len(types)}))
