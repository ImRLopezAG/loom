"""Name the exact captured Raster surfaces so declaration emission remains bounded."""
import json
import pathlib
import re

root = pathlib.Path(__file__).resolve().parents[3]
path = root / 'apps/loom/src/core/extensions/adapters/postgis-raster.ts'
s = path.read_text()
assert 'export interface PostgisRasterOverloads' not in s
q = json.dumps
start, end = s.index('const c0='), s.index('const member0=')
body = s[start:end]
names = re.findall(r'const ((?:n)?c\d+)=', body)
helper = 'export function createPostgisRasterCodecDefinitions(schema:string,postgisSchema:string) {\n' + body + 'return {' + ','.join(names) + '} as const;\n}\nexport type PostgisRasterCodecDefinitions = ReturnType<typeof createPostgisRasterCodecDefinitions>;\n'
def ct(value):
    return re.sub(r'(?<!")\b(n?c\d+)\b', lambda m: 'PostgisRasterCodecDefinitions[' + q(m[1]) + ']', value)

def result_type(value):
    value = ct(value)
    value = re.sub(r'nullableCodec\((.*)\)', r'ReturnType<typeof nullableCodec<\1>>', value)
    if 'compositeCodec(' in value:
        key = re.search(r'rowFields(\d+)', value)[1]
        fields = re.search(r'const rowFields' + key + r'=(\{.*?\}) as const;', s)[1]
        value = 'NullableRasterCodec<ReturnType<typeof compositeCodec<' + ct(fields) + '>>>'
    return value

overloads = re.search(r'const overloads=\{(.*?)\} as const;', s)[1]
entries = re.findall(r'("(?:[^"\\]|\\.)*"):member(\d+)', overloads)
types = ['type NullableRasterCodec<C extends ExtensionCodec<never,unknown>>=ExtensionCodec<CodecInput<C>|null,CodecOutput<C>|null>;', 'export interface PostgisRasterOverloads {']
for ident, number in entries:
    line = re.search(r'^const member' + number + r'=(.*);$', s, re.M)[1]
    if line.startswith('createSqlOperator'):
        left, right, result = re.search(r'left:(\w+),right:(\w+),result:(\w+)', line).groups()
        typ = 'ReturnType<typeof createSqlOperator<' + ','.join(ct(x) for x in [left,right,result]) + '>>'
    elif line.startswith('(value:'):
        arg = re.search(r'value:ExtensionSqlInput<typeof (\w+)>', line)[1]
        result = re.search(r'`,(\w+),\[\]', line)[1]
        typ = '(value:ExtensionSqlInput<' + ct(arg) + '>)=>ReturnType<typeof checkedExtensionExpression<' + ct(result) + '>>'
    else:
        builder = re.search(r'(createSqlFunction|createSqlAggregate|createSqlWindow)\(', line)[1]
        args = re.search(r'arguments:\[(.*?)\] as const', line)[1]
        args = re.sub(r'defaultSqlArgument\((\w+),("[^"]*"|undefined)\)', lambda m: 'DefaultSqlArgument<' + ct(m[1]) + ',' + m[2] + '>', args)
        result = line.rsplit('result:',1)[1][:-2]
        typ = 'ReturnType<typeof ' + builder + '<readonly [' + ct(args) + '],' + result_type(result) + '>>'
    types.append(ident + ': ' + typ + ';')
types.append('}')
functions = re.search(r'const functions=\{(.*?)\} as const;', s)[1]
functions = re.sub(r'member(\d+)', lambda m: 'PostgisRasterOverloads[' + next(k for k,n in entries if n == m[1]) + ']', functions)
types.append('export interface PostgisRasterFunctions {' + functions + '}')
ret = s[s.index('return bindExtension(descriptor,'):]
codecs = re.search(r'codecs:\{(.*?)\},fields:', ret)[1]
types.append('export interface PostgisRasterPublicCodecs {' + ct(codecs) + '}')
types.append('export interface PostgisRasterRows {')
for ident, number in re.findall(r'("(?:[^"\\]|\\.)*"):rows(\d+)', ret):
    fields = re.search(r'const rowFields' + number + r'=(\{.*?\}) as const;', s)[1]
    types.append(ident + ':(alias:string,...values:Parameters<PostgisRasterOverloads[' + ident + ']>)=>ReturnType<typeof extensionRows<' + ct(fields) + '>>;')
types.append('}')
schema = '\n'.join(line for line in s.splitlines() if line.startswith(('const rasterField=', 'const index0=')))
types.append('export function createPostgisRasterSchemaSurface(descriptor:Descriptor) {const schema=descriptor.schema;\n' + schema + '\nreturn {fields:{raster:rasterField},indexes:{hash_raster_ops:index0}};}\nexport type PostgisRasterSchemaSurface=ReturnType<typeof createPostgisRasterSchemaSurface>;')
types.append('export interface PostgisRasterAdapter extends PostgisRasterSchemaSurface {readonly raster:{readonly codec:PostgisRasterCodecDefinitions["c0"];readonly field:PostgisRasterSchemaSurface["fields"]["raster"];readonly wkb:typeof rasterWkb};readonly codecs:PostgisRasterPublicCodecs;readonly sql:{readonly functions:PostgisRasterFunctions;readonly overloads:PostgisRasterOverloads;readonly operators:Pick<PostgisRasterOverloads,' + '|'.join(k for k,n in entries if json.loads(k).startswith('operator:')) + '>;readonly rows:PostgisRasterRows};}')
s = s[:start] + 'const {' + ','.join(names) + '}=createPostgisRasterCodecDefinitions(schema,postgisSchema);\n' + s[end:]
s = s.replace('postgis:PostgisDescriptor) {', 'postgis:PostgisDescriptor):Readonly<Selected & PostgisRasterAdapter> {')
s = s.replace('type ExtensionSqlInput }', 'type ExtensionSqlInput, type DefaultSqlArgument }')
s = s.replace('type ExtensionCodec }', 'type ExtensionCodec, type CodecInput, type CodecOutput }')
pos = s.index('/** Exact captured overloads.')
s = s[:pos] + helper + '\n'.join(types) + '\n' + s[pos:]
path.write_text(s)
