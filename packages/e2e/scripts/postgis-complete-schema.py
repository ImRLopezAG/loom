"""Add captured PostGIS schema surfaces to the named exact-overload adapter."""
import json,pathlib,re
root=pathlib.Path(__file__).resolve().parents[3]
p=root/'apps/loom/src/core/extensions/adapters/postgis.ts';s=p.read_text()
m=json.loads((root/'apps/loom/src/tooling/extensions/manifests/postgis.json').read_text())['contract']['members']
codec={'box2d':'c0','box2df':'c1','box3d':'c2','geography':'c3','geometry':'c4','gidx':'c5','spheroid':'c6','geography_columns':'c38','geometry_columns':'c39','geometry_dump':'c40','spatial_ref_sys':'c41','valid_detail':'c42'}
for name,num in [('box2d',31),('box2df',32),('box3d',33),('geography',34),('geometry',35),('gidx',36),('spheroid',37),('geography_columns',43),('geometry_columns',44),('geometry_dump',45),('spatial_ref_sys',46),('valid_detail',47)]:codec['_'+name]='c'+str(num)
q=lambda x:json.dumps(x,ensure_ascii=False)
types={x['name']:x for x in m if x['kind']=='type'}
# Portable projection is the exact JSON form of the native codecs; all composite attributes use nullable member codecs.
spatial=lambda name:{'kind':'union','variants':[{'kind':'object','properties':{'kind':{'kind':'string','enum':[name]},'format':{'kind':'string','enum':['ewkb']},'hex':{'kind':'string'},'srid':{'kind':'number','integer':True},'dimensions':{'kind':'string','enum':['XY','XYZ','XYM','XYZM']},'geometryType':{'kind':'number','integer':True}}},{'kind':'object','properties':{'kind':{'kind':'string','enum':[name]},'format':{'kind':'string','enum':['ewkt']},'text':{'kind':'string'},'srid':{'kind':'number','integer':True},'dimensions':{'kind':'string','enum':['XY','XYZ','XYM','XYZM']}}}]}
nullable=lambda value:{'kind':'union','variants':[value,{'kind':'null'}]}
def arr(element):
 variants=[];nested=nullable(element)
 for rank in range(6):nested={'kind':'array','items':nested};variants.append(nested)
 return {'kind':'object','properties':{'dimensions':{'kind':'array','items':{'kind':'object','properties':{'lowerBound':{'kind':'number','integer':True},'length':{'kind':'number','integer':True,'minimum':0}}}},'values':{'kind':'union','variants':variants}}}
def value(name):
 if name.startswith('_'):return arr(value(name[1:]))
 if name in ['geometry','geography']:return spatial(name)
 if name in types and types[name]['attributes']:return {'kind':'object','properties':{a['name']:nullable(value(a['type']['name'])) for a in types[name]['attributes']}}
 if name in ['int2','int4','oid']:return {'kind':'number','integer':True}
 if name in ['text','varchar','name','regclass','cstring']:return {'kind':'string'}
 if name=='bool':return {'kind':'boolean'}
 return {'kind':'object','properties':{'type':{'kind':'string','enum':[name]},'text':{'kind':'string'}}}
lines=[];newfields=[];arrays=[]
for name,x in types.items():
 if x['element']:
  base=x['element']['name'];var=base+'ArrayField';arrays.append(q(base)+':'+var)
  lines.append(f'const {var}=()=>createExtensionField({{extension:descriptor,member:{q(x["id"])},type:{q(base)},array:true,codec:{codec[name]},value:{q(value(name))} as const,search:{{filter:false,comparison:false,order:false,text:false}} as const}});')
 elif name not in ['geometry','geography','box2d','box3d','spheroid']:
  var=name+'Field';newfields.append(q(name)+':'+var)
  lines.append(f'const {var}=()=>createExtensionField({{extension:descriptor,member:{q(x["id"])},type:{q(name)},codec:{codec[name]},value:{q(value(name))} as const,search:{{filter:false,comparison:false,order:false,text:false}} as const}});')
s=s.replace('import { sql, type SQLWrapper }','import { sql, getColumnTable, type SQLWrapper }')
s='import { getTableConfig, type AnyPgColumn, type PgTable } from "drizzle-orm/pg-core";\nimport type { ExtensionTriggerDeclaration } from "../triggers";\n'+s
helper='''export interface PostgisCacheBboxOptions<Table extends PgTable> {readonly name:string;readonly table:Table;readonly column:AnyPgColumn;}
/** Native cache_bbox reads one geometry column and adds its cached bounding box before INSERT/UPDATE. */
export function createPostgisCacheBboxTrigger<Table extends PgTable>(descriptor:Descriptor,options:PostgisCacheBboxOptions<Table>):ExtensionTriggerDeclaration {
 const table=getTableConfig(options.table);
 if(getColumnTable(options.column)!==options.table) throw new Error("PostGIS cache_bbox column must belong to its table");
 const nativeType=options.column.getSQLType();
 const geometryType='"'+descriptor.schema.replaceAll('"','""')+'"."geometry"';
 if(nativeType!==geometryType && !nativeType.startsWith(geometryType+'(')) throw new Error("PostGIS cache_bbox requires the selected native geometry type");
 return Object.freeze({kind:"trigger",extension:Object.freeze({name:descriptor.name,version:descriptor.version,digest}),member:"routine:$extension:postgis.postgis_cache_bbox()",name:options.name,timing:"before",level:"row",events:Object.freeze(["insert","update"] as const),table:Object.freeze({schema:table.schema??"public",name:table.name}),function:Object.freeze({schema:descriptor.schema,name:"postgis_cache_bbox"}),arguments:Object.freeze([options.column.name])});
}
'''
s=s.replace('export function createPostgisSchemaSurface',helper+'export function createPostgisSchemaSurface')
s=s.replace('const index0=', '\n'.join(lines)+'\nconst index0=',1)
s=s.replace('"spheroid":spheroidField},indexes:', '"spheroid":spheroidField,'+','.join(newfields)+'},arrayFields:{'+','.join(arrays)+'},triggers:{cacheBbox:<Table extends PgTable>(options:PostgisCacheBboxOptions<Table>)=>createPostgisCacheBboxTrigger(descriptor,options)},indexes:',1)
s=s.replace('const {fields,indexes}=createPostgisSchemaSurface(descriptor);','const {fields,arrayFields,triggers,indexes}=createPostgisSchemaSurface(descriptor);').replace('fields,indexes,sql:', 'fields,arrayFields,triggers,indexes,sql:')
# DDL function remains fully typed on the owned operator interface, never disguised as an internal member.
member='routine:$extension:postgis.st_fromflatgeobuftotable(pg_catalog.text,pg_catalog.text,pg_catalog.bytea)'
line=next(line for line in s.splitlines() if line.startswith('const member') and 'name:"st_fromflatgeobuftotable"' in line)
var=line.split('=')[0][6:];s=s.replace(line+'\n','')
s='\n'.join(line for line in s.splitlines() if not line.startswith(q(member)+':') and not line.startswith('"st_fromflatgeobuftotable":'))+'\n'
s=s.replace(q(member)+':'+var+',','').replace('"st_fromflatgeobuftotable":'+var+',','')
p.write_text(s)
op=root/'apps/loom/src/tooling/extensions/operations/postgis.ts';o=op.read_text();call=line+'\n'+f'const op{var}=(...values:Parameters<typeof {var}>)=>context.run(async()=>{{const compiled=extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select (${{{var}(...values)}})::pg_catalog.text value`);const rows=await context.client.query(compiled.sql,compiled.params);return nc17.decode(rows.rows[0]?.value);}});\n'
o=o.replace('return Object.freeze({',call+'return Object.freeze({'+q(member)+':op'+var+',',1);op.write_text(o)
a=root/'apps/loom/src/tooling/extensions/annotations/postgis.ts';text=a.read_text();rows=json.loads(text[text.index('['):text.rindex(']')+1]);row=next(x for x in rows if x['id']==member);row['disposition']='tooling';row['reason']='ST_FromFlatGeobufToTable creates a native table; its full captured signature is transferred to the explicit owned migration/operator session.';a.write_text('export const postgisAnnotations = '+json.dumps(rows,indent=2,ensure_ascii=False)+' as const;\n')
f=root/'packages/e2e/fixtures/postgis-member-dispositions.json';obj=json.loads(f.read_text());obj['members'][member]='tooling';f.write_text(json.dumps(obj,indent=2)+'\n')
print('12 scalar fields, 12 bounded array fields, cache_bbox trigger, 721 query overloads, 16 maintenance methods plus trigger')
