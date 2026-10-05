"""Attach each internal member to its exact observed native owner, with explicit dispatch gaps."""
import json,pathlib,re,collections,subprocess
def identity_type(value):
 return '"'+value['namespace']+'".'+value['name']
root=pathlib.Path(__file__).resolve().parents[3];source=json.loads((root/'apps/loom/src/tooling/extensions/manifests/postgis.json').read_text());native=json.load(open('/tmp/loom-postgis-observed-manifest.json'));assert source['digest']==native['digest'] and source['contract']==native['contract'];ms=native['contract']['members'];d=json.loads((root/'packages/e2e/fixtures/postgis-member-dispositions.json').read_text())['members'];extra=json.load(open('/tmp/loom-postgis-native-extra-graph.json'));schema=json.load(open('/tmp/loom-postgis-schema-native.json'));assert extra['digest']==schema['digest']==source['digest'];indexes={x['member']:x for x in schema['indexes']};edges=collections.defaultdict(list)
for x in ms:
 if x['kind']=='type':
  for role in ['input','output','receive','send','typmodInput','typmodOutput']:
   if x.get(role):edges['routine:'+x[role]].append({'owner':x['id'],'role':role})
 if x['kind']=='routine' and x['aggregate']:
  for role,v in x['aggregate'].items():
   if isinstance(v,str) and '(' in v:edges['routine:'+v].append({'owner':x['id'],'role':role})
 if x['kind']=='opfamily':
  for v in x['procedures']:edges['routine:'+v['procedure']].append({'owner':x['id'],'role':'support:'+str(v['number'])})
 if x['kind']=='operator':
  for role in ['restrict','join','procedure']:
   if x.get(role):edges['routine:'+x[role]].append({'owner':x['id'],'role':role})
for e in extra['edges']:edges[e['callback']].append({'owner':e['owner'],'role':e['role']})
curated_path=root/'packages/e2e/fixtures/postgis-internal-dispositions.json'
curated=json.loads(curated_path.read_text());assert curated['manifestDigest']==source['digest']
dispositions={member['id']:member for member in curated['members']}
receipts=[]
for x in ms:
 if d[x['id']]!='internal':continue
 transfer=[];owners=[]
 if x['kind']=='routine':transfer=edges[x['id']]
 elif x['kind']=='opfamily':transfer=[{'owner':c['id'],'role':'operator-family','procedures':x['procedures'],'operators':x['operators']} for c in ms if c['kind']=='opclass' and c['family']==x['id'][len('opfamily:'):]]
 elif x['kind']=='other' and x['objectType'] in ['function of access method','operator of access method']:
  match=re.search(r'^(?:function|operator) (\d+) \(.*\) of "\$extension:postgis"\.([^ ]+) USING ([a-z]+)$',x['identity']);assert match,x['identity'];number,family,method=match.groups();parent=next(y for y in ms if y['kind']=='opfamily' and y['name']==family and y['accessMethod']==method);entries=parent['procedures'] if x['objectType']=='function of access method' else parent['operators'];entries=[entry for entry in entries if entry.get('number',entry.get('strategy'))==int(number) and '('+identity_type(entry['left'])+', '+identity_type(entry['right'])+')' in x['identity']];assert len(entries)==1,x['identity'];transfer=[{'owner':parent['id'],'role':x['objectType']+':'+number,'catalogEntries':entries}]
 elif x['kind']=='other':
  parents=[y for y in ms if y['kind']=='relation' and y['name'] in ['geometry_columns','geography_columns','spatial_ref_sys'] and ('"$extension:postgis".'+y['name']) in x['identity']];assert len(parents)==1,x['identity'];transfer=[{'owner':parents[0]['id'],'role':x['objectType'],'nativeDefinition':x['definition']}]
 for edge in transfer:
  owner=next((y for y in ms if y['id']==edge['owner']),None)
  if owner and owner['kind']=='opclass':owners.append(owner['id'])
  if owner and owner['kind']=='opfamily':owners.extend(c['id'] for c in ms if c['kind']=='opclass' and c['family']==owner['id'][len('opfamily:'):])
 disposition=dispositions[x['id']];assert disposition['registeredOwnerEdges']==transfer,x['id']
 status='specific-native-ownership-verified' if transfer else 'installed-private-unreferenced-support-overload'
 receipt={'member':x['id'],'status':status,'edges':transfer,'nativeOwningIndexObservations':sorted(set(owners)&set(indexes)),'exactCallbackEntryCoverage':'unresolved-not-instrumented','blocker':'Current host/provider proof binding is required for the exact owning root or direct private disposition case; native callback entry is not inferred.','dispositionEvidence':'packages/e2e/fixtures/postgis-internal-dispositions.json'}
 receipts.append(receipt)
path=root/'packages/e2e/fixtures/postgis-native-graph-observations.json';path.write_text(json.dumps({'digest':source['digest'],'exactNativeCapture':True,'nativeVersion':'3.6.4','nativePostgresMajor':18,'receipts':receipts},indent=2,ensure_ascii=False)+'\n')
p=root/'apps/loom/src/tooling/extensions/annotations/postgis.ts';rows=json.loads(subprocess.check_output(['bun','-e','const {postgisAnnotations}=await import(process.argv[1]); process.stdout.write(JSON.stringify(postgisAnnotations));',str(p)],text=True));lookup={x['member']:x for x in receipts}
for row in rows:
 if row['id'] not in lookup:continue
 r=lookup[row['id']];row['reason']='Native-specific graph transfer: '+'; '.join(e['role']+' -> '+e['owner'] for e in r['edges']) if r['edges'] else dispositions[row['id']]['reason'];row['semantics']['nativeGraphTransfer']=r['status'];row['semantics']['nativeCallbackEntryAcceptance']='unresolved-not-instrumented';row['semantics']['nativeOwnerSurface']='14 exact opclasses CREATE/EXPLAIN ANALYZE observed; per-member graph artifact identifies applicable owners' if r['nativeOwningIndexObservations'] else ('specific native owner identity captured; see per-member observation and blocker' if r['edges'] else 'Installed private exact overload; independent catalogue has zero references in measured registered roles');row['evidence']=list(dict.fromkeys(row['evidence']+['packages/e2e/fixtures/postgis-internal-dispositions.json','packages/e2e/fixtures/postgis-native-graph-observations.json','packages/e2e/scripts/postgis-native-graph.ts','packages/e2e/integration/extensions-postgis-schema.test.ts']))
p.write_text('export const postgisAnnotations = '+json.dumps(rows,indent=2,ensure_ascii=False)+' as const;\n');print(json.dumps({'internalMembers':len(receipts),'specificNativeOwners':sum(bool(x['edges']) for x in receipts),'unowned':[x['member'] for x in receipts if not x['edges']],'callbackEntryAcceptance':'unresolved-not-instrumented'}))
