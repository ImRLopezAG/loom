import pathlib,json,re
root=pathlib.Path(__file__).resolve().parents[3];p=root/'apps/loom/src/core/extensions/adapters/postgis.ts';s=p.read_text();m=json.loads((root/'apps/loom/src/tooling/extensions/manifests/postgis.json').read_text());ms=m['contract']['members'];disp=json.loads((root/'packages/e2e/fixtures/postgis-member-dispositions.json').read_text())['members']
start=s.index('const c0=');end=s.index('const member',start);block=s[start:end]
# Last codec declarations may be followed by row fields: preserve those in main function.
last=max(a.end() for a in re.finditer(r'const nc\d+=nullableCodec\(c\d+\);',block));codecblock=block[:last];rest=block[last:];names=re.findall(r'const (n?c\d+)=',codecblock)
codecTypes={}
for x in ms:
 if x['kind']=='type':codecTypes[(x['namespace'],x['name'])]=None
# Recover exact member arguments/results from their static definitions, rather than infer generic result types.
def fieldtype(c):return 'PostgisCodecDefinitions['+json.dumps(c)+']'
def argtypes(text):
 out=[]
 for part in re.findall(r'defaultSqlArgument\(nc\d+,(?:"[^"]*"|undefined)\)|nc\d+',text):
  if part.startswith('default'):
   codec,name=re.match(r'defaultSqlArgument\((nc\d+),(.*)\)',part).groups();out.append('DefaultSqlArgument<'+fieldtype(codec)+','+(name if name!='undefined' else 'undefined')+'>')
  else:out.append(fieldtype(part))
 return 'readonly ['+','.join(out)+']'
interfaces=[];public={}
for i,x in enumerate(ms):
 if disp[x['id']]!='query':continue
 var='member'+str(i);public[x['id']]=var
 line=next(l for l in s.splitlines() if l.startswith('const '+var+'=')); kind=x['kind']
 if kind=='routine':
  builder={'aggregate':'createSqlAggregate','window':'createSqlWindow'}.get(x['routineKind'],'createSqlFunction')
  aa=line.split('arguments:[',1)[1].split('] as const',1)[0];args=argtypes(aa)
  if x['returns']['name']=='record':
   fields=next(l for l in s.splitlines() if l.startswith('const rowFields'+str(i)+'='));members=re.findall(r'"([^"]+)":(nc\d+)',fields); result='ReturnType<typeof nullableCodec<CodecInput<ReturnType<typeof compositeCodec<{'+','.join(json.dumps(k)+':'+fieldtype(v) for k,v in members)+'}>>>,CodecOutput<ReturnType<typeof compositeCodec<{'+','.join(json.dumps(k)+':'+fieldtype(v) for k,v in members)+'}>>>>>'
  elif x['returns']['name']=='anyelement':
   # Only ST_FromFlatGeobuf: concrete codec owns both polymorphic argument and result.
   interfaces.append(json.dumps(x['id'])+': <Input,Output>(concrete:ExtensionCodec<Input,Output>)=>ReturnType<typeof createSqlFunction<readonly [ExtensionCodec<Input|null,Output|null>,'+fieldtype(re.findall(r'nc\d+',aa)[0])+'],ExtensionCodec<Input|null,Output|null>>>;');continue
  else:result=fieldtype(re.search(r'result:(nc\d+)',line).group(1))
  typ='ReturnType<typeof '+builder+'<'+args+','+result+'>>'
 elif kind=='operator':
  left=re.search(r'left:(nc\d+|undefined)',line).group(1);right=re.search(r'right:(nc\d+|undefined)',line).group(1);result=re.search(r'result:(nc\d+)',line).group(1);typ='ReturnType<typeof createSqlOperator<'+(fieldtype(left) if left!='undefined' else left)+','+(fieldtype(right) if right!='undefined' else right)+','+fieldtype(result)+'>>'
 else:
  input=re.search(r'ExtensionSqlInput<typeof (nc\d+)>',line).group(1);result=re.search(r'\)\}`,(nc\d+)',line)
  if not result:result=re.search(r'\}`,(nc\d+)',line)
  typ='(value:ExtensionSqlInput<'+fieldtype(input)+'>)=>ReturnType<typeof checkedExtensionExpression<'+fieldtype(result.group(1))+'>>'
 interfaces.append(json.dumps(x['id'])+':'+typ+';')
head=s[:s.index('/** Exact captured overloads.')]
head=head.replace('type ExtensionSqlInput }','type ExtensionSqlInput, type DefaultSqlArgument }').replace('type ExtensionCodec }','type ExtensionCodec, type CodecInput, type CodecOutput }')
head+='export function createPostgisCodecDefinitions(schema:string) {\n'+codecblock+'\nreturn {'+','.join(names)+'} as const; }\nexport type PostgisCodecDefinitions=ReturnType<typeof createPostgisCodecDefinitions>;\n'
head+='export interface PostgisOverloads {\n'+'\n'.join(interfaces)+'\n}\n'
groups={}
for x in ms:
 if x['kind']=='routine' and x['id'] in public:groups.setdefault(x['name'],[]).append(x)
head+='export interface PostgisFunctions {\n'+'\n'.join(json.dumps(name)+':'+('PostgisOverloads['+json.dumps(g[0]['id'])+']' if len(g)==1 else '{'+','.join(json.dumps(x['id'][x['id'].index('('):])+':PostgisOverloads['+json.dumps(x['id'])+']' for x in g)+'}')+';' for name,g in groups.items())+'\n}\n'
# Extract the field and index declarations into a named schema surface with a bounded inferred return.
fstart=s.index('const geometryField=');fstart=min(s.index('const '+name+'Field=') for name in ['box2d','box3d','geometry','geography','spheroid'])
fend=s.index('function sameSemantics',fstart);fieldsblock=s[fstart:fend]
ret=s[s.index('return bindExtension(descriptor,{'):]
fields=re.search(r'fields:(\{.*?\}),indexes:',ret).group(1);idx=re.search(r'indexes:(\{.*?\}),sql:',ret).group(1)
head+='export function createPostgisSchemaSurface(descriptor:Descriptor) {const schema=descriptor.schema;const {'+','.join(names)+'}=createPostgisCodecDefinitions(schema);\n'+fieldsblock+'\nreturn {fields:'+fields+',indexes:'+idx+'} as const;}\nexport type PostgisSchemaSurface=ReturnType<typeof createPostgisSchemaSurface>;\n'
# Row helper signatures retain named fields and layout.
rows=[]
for i,x in enumerate(ms):
 if x['id'] not in public or x['kind']!='routine' or not x['returnsSet']:continue
 out=[a for a in x['arguments'] if a['mode'] in ['out','table','inout']]
 if not out:continue
 fld=next(l for l in s.splitlines() if l.startswith('const rowFields'+str(i)+'='));parts=re.findall(r'"([^"]+)":(nc\d+)',fld)
 rows.append(json.dumps(x['id'])+':(alias:string,...values:Parameters<PostgisOverloads['+json.dumps(x['id'])+']>)=>ReturnType<typeof extensionRows<{'+','.join(json.dumps(k)+':'+fieldtype(v) for k,v in parts)+'}>>;')
head+='export interface PostgisRows {\n'+'\n'.join(rows)+'\n}\n'
publiccodecs=re.search(r'codecs:(\{.*?\}),fields:',ret).group(1);parts=re.findall(r'"([^"]+)":(c\d+)',publiccodecs)
head+='export interface PostgisPublicCodecs {\n'+'\n'.join(json.dumps(k)+':'+fieldtype(v)+';' for k,v in parts)+'\n}\n'
gid='routine:$extension:postgis.st_distance($extension:postgis.geometry,$extension:postgis.geometry)';ggid='routine:$extension:postgis.st_distance($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)'
head+='''export interface PostgisAdapter extends PostgisSchemaSurface {
 readonly geometry:{readonly codec:ReturnType<typeof createPostgisGeometryCodec>;readonly field:PostgisSchemaSurface["fields"]["geometry"];readonly ewkb:typeof geometryEwkb;readonly ewkt:typeof geometryEwkt;readonly distance:PostgisOverloads['''+json.dumps(gid)+'''];readonly distanceUnits:"coordinate-system"};
 readonly geography:{readonly codec:ReturnType<typeof createPostgisGeographyCodec>;readonly field:PostgisSchemaSurface["fields"]["geography"];readonly ewkb:typeof geographyEwkb;readonly ewkt:typeof geographyEwkt;readonly distance:PostgisOverloads['''+json.dumps(ggid)+'''];readonly distanceUnits:"meters"};
 readonly codecs:PostgisPublicCodecs;
 readonly sql:{readonly functions:PostgisFunctions;readonly overloads:PostgisOverloads;readonly rows:PostgisRows};
}
'''
main=s[s.index('/** Exact captured overloads.'):start]+ 'const {'+','.join(names)+'}=createPostgisCodecDefinitions(schema);\n'+rest+s[end:fstart]+'const {fields,indexes}=createPostgisSchemaSurface(descriptor);\n'+s[fend:]
main=main.replace('(descriptor:Selected) {','(descriptor:Selected):Readonly<Selected & PostgisAdapter> {',1)
# references to local field functions now point at the named schema surface.
main=main.replace('field:geometryField','field:fields.geometry').replace('field:geographyField','field:fields.geography')
main=main.replace('fields:'+fields+',indexes:'+idx,'fields,indexes')
p.write_text(head+main)
print('Named exact overload declarations',len(interfaces))
