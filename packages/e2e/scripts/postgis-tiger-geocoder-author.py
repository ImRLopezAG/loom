#!/usr/bin/env python3
"""Generate owned postgis_tiger_geocoder 3.6.4 adapter/annotation/tooling files from the captured manifest."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path("/Users/angel/dev/loom")
MANIFEST = json.loads((ROOT / "apps/loom/src/tooling/extensions/manifests/postgis_tiger_geocoder.json").read_text())
DIGEST = MANIFEST["digest"]
MEMBERS = MANIFEST["contract"]["members"]
EVIDENCE = [
    "apps/loom/src/tooling/extensions/manifests/postgis_tiger_geocoder.json",
    "/tmp/loom-postgis-3.6.4-source/postgis-3.6.4/extras/tiger_geocoder",
    "packages/e2e/fixtures/postgis-tiger-geocoder-native-characterization.json",
    "apps/loom/src/core/extensions/adapters/postgis-tiger-geocoder.ts",
    "apps/loom/src/core/extensions/adapters/postgis-tiger-geocoder-codecs.ts",
    "packages/tests/unit/extensions-postgis-tiger-geocoder.test.ts",
]
QUERY_ROUTINES = {
    "geocode",
    "geocode_address",
    "geocode_intersection",
    "geocode_location",
    "get_geocode_setting",
    "get_tract",
    "interpolate_from_address",
    "normalize_address",
    "pagc_normalize_address",
    "pprint_addy",
    "reverse_geocode",
    "utmzone",
}
TOOLING_ROUTINES = {
    "create_census_base_tables",
    "drop_dupe_featnames_generate_script",
    "drop_indexes_generate_script",
    "drop_nation_tables_generate_script",
    "drop_state_tables_generate_script",
    "install_geocode_settings",
    "install_missing_indexes",
    "install_pagc_tables",
    "loader_generate_census_script",
    "loader_generate_nation_script",
    "loader_generate_script",
    "loader_load_staged_data",
    "loader_macro_replace",
    "missing_indexes_generate_script",
    "set_geocode_setting",
    "setsearchpathforinstall",
    "topology_load_tiger",
}
NORM_FIELDS = [
    "address",
    "predirabbrev",
    "streetname",
    "streettypeabbrev",
    "postdirabbrev",
    "internal",
    "location",
    "stateabbrev",
    "zip",
    "parsed",
    "zip4",
    "address_alphanumeric",
]


def js(value: object) -> str:
    return json.dumps(value, ensure_ascii=False)


def typ(ref: dict | None) -> str:
    if not ref:
        return ""
    return f"{ref['namespace']}.{ref['name']}"


def member_kind(member: dict) -> str:
    if member["kind"] == "routine":
        name = member["name"]
        if name in QUERY_ROUTINES:
            return "query"
        if name in TOOLING_ROUTINES:
            return "tooling"
        return "internal"
    ident = member["id"]
    if ident.startswith("table column:"):
        return "query"
    if ident.startswith(("table:", "composite type:", "type:", "default value:", "table constraint:")):
        return "schema"
    return "internal"


def reason(member: dict, disposition: str) -> str:
    ident = member["id"]
    name = member.get("name", ident)
    if disposition == "query" and ident.startswith("routine:"):
        return f"Exact sql.overloads bind {name}. Native PL/pgSQL owns geocoding; this adapter never implements a JavaScript geocoder or census fetch."
    if disposition == "tooling":
        return f"withPostgisTigerGeocoderOperations.{name} executes the captured operator SQL and returns decoded text or status. Generated loader scripts are never fetched."
    if disposition == "internal":
        if ident.startswith("routine:"):
            return f"Captured support routine {name} is used by native normalize/geocode; recorded, not exported as an application helper."
        if ident.startswith("index:"):
            return "PostgreSQL-owned index; not independently SQL-callable."
        if ident.startswith("toast table:") or "toast" in ident:
            return "PostgreSQL-owned toast storage; not an application API."
        if ident.startswith("sequence"):
            return "PostgreSQL-owned sequence identity; defaults and nextval remain native."
        return f"Captured catalog member {ident} is not independently exported."
    if ident.startswith("composite type:") or ident.startswith("type:"):
        return f"Captured type {name} uses native record/array I/O. Field layout matches the 3.6.4 catalogue."
    if ident.startswith("table:"):
        return f"Captured relation {name} is exposed through the exact row codec and Rows surface."
    if ident.startswith("table column:"):
        return "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface."
    if ident.startswith("default value:") or ident.startswith("table constraint:"):
        return "Native table default or constraint preserved by PostgreSQL-owned DDL; no application DDL."
    return f"Captured member {ident}."


def write(path: Path, contents: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(contents)
    print("wrote", path, "bytes", path.stat().st_size)


def annotations() -> str:
    lines = [
        "const evidence = " + js(EVIDENCE) + " as const;",
        "const pending = { providerAcceptance: \"pending\", publicExportAcceptance: \"pending\", nativeAcceptance: \"observed-local\" } as const;",
        "/** Exact 894-member dispositions. Public consumer and Neon acceptance remain parent-owned. */",
        "export const postgisTigerGeocoderAnnotations = [",
    ]
    for member in MEMBERS:
        disposition = member_kind(member)
        authority = "query" if disposition == "query" else "operator" if disposition == "tooling" else "schema" if disposition == "schema" else "internal"
        lines.append(
            "  {"
            + js(
                {
                    "id": member["id"],
                    "disposition": disposition,
                    "reason": reason(member, disposition),
                    "semantics": {
                        **{
                            "providerAcceptance": "pending",
                            "publicExportAcceptance": "pending",
                            "nativeAcceptance": "observed-local",
                            "authority": authority,
                            "observability": "tables",
                        }
                    },
                }
            )[1:-1]
            + ", evidence},"
        )
    lines.append("] as const;")
    lines.append("export const postgisTigerGeocoderPendingGates = pending;")
    return "\n".join(lines) + "\n"


def codecs() -> str:
    tables = [m for m in MEMBERS if m["kind"] == "relation" and m.get("relationKind") == "r"]
    chunks = [
        'import * as v from "valibot";',
        'import { arrayCodec, compositeCodec, createExtensionCodec, floatCodec, integerCodec, nullableCodec, numericCodec, textCodec, withCodecSqlType, type CompositeOutput, type PostgreSqlArray } from "../codecs";',
        'import { int4Codec } from "../native-codecs";',
        'import type { ExtensionValueSchema } from "../fields";',
        "export type { PostgreSqlArray };",
        f'export const POSTGIS_TIGER_GEOCODER_DIGEST = "{DIGEST}";',
        "export const postgisTigerGeocoderNormAddyFields = " + js(NORM_FIELDS) + " as const;",
        "export type PostgisTigerGeocoderNormAddyField = (typeof postgisTigerGeocoderNormAddyFields)[number];",
        "export type PostgisTigerGeocoderNormAddy = {",
        "  readonly address: number | null;",
        "  readonly predirabbrev: string | null;",
        "  readonly streetname: string | null;",
        "  readonly streettypeabbrev: string | null;",
        "  readonly postdirabbrev: string | null;",
        "  readonly internal: string | null;",
        "  readonly location: string | null;",
        "  readonly stateabbrev: string | null;",
        "  readonly zip: string | null;",
        "  readonly parsed: boolean | null;",
        "  readonly zip4: string | null;",
        "  readonly address_alphanumeric: string | null;",
        "};",
        "const nullableText = nullableCodec(textCodec);",
        "const nullableInt4 = nullableCodec(int4Codec);",
        "const recordBoolean = createExtensionCodec({",
        '  id: "pg:bool:record-text:1",',
        '  sqlType: { schema: "pg_catalog", name: "bool" },',
        "  input: v.boolean(),",
        "  output: v.boolean(),",
        '  transport: "text",',
        '  encode: (value) => (value ? "t" : "f"),',
        "  decode(value) {",
        '    if (value === "t" || value === "true") return true;',
        '    if (value === "f" || value === "false") return false;',
        "    if (typeof value === \"boolean\") return value;",
        '    throw new Error("Invalid PostgreSQL boolean");',
        "  },",
        "});",
        "const nullableBool = nullableCodec(recordBoolean);",
        "export const postgisTigerGeocoderVoidCodec = createExtensionCodec({ id: \"pg:void:1\", sqlType: { schema: \"pg_catalog\", name: \"void\" }, input: v.null(), output: v.null(), transport: \"text\", encode: () => null, decode: (value) => (value === \"\" ? null : value) });",
        "export function createTigerGeometryCodec(schema: string) {",
        "  return withCodecSqlType(createExtensionCodec({ id: \"postgis_tiger_geocoder:postgis-geometry-ewkt:1\", sqlType: { schema, name: \"geometry\" }, input: v.string(), output: v.string(), transport: \"text\", encode: (value) => value, decode: (value) => { if (typeof value === \"string\") return value; throw new Error(\"postgis_tiger_geocoder geometry requires native text/EWKT; binary geometry decoding is the postgis adapter contract\"); } }), { schema, name: \"geometry\" });",
        "}",
        "const normAddyFieldCodecs = Object.freeze({",
        "  address: nullableInt4,",
        "  predirabbrev: nullableText,",
        "  streetname: nullableText,",
        "  streettypeabbrev: nullableText,",
        "  postdirabbrev: nullableText,",
        "  internal: nullableText,",
        "  location: nullableText,",
        "  stateabbrev: nullableText,",
        "  zip: nullableText,",
        "  parsed: nullableBool,",
        "  zip4: nullableText,",
        "  address_alphanumeric: nullableText,",
        "});",
        "export function createNormAddyCodec(schema: string) {",
        "  return withCodecSqlType(compositeCodec(\"postgis_tiger_geocoder:norm_addy\", normAddyFieldCodecs), { schema, name: \"norm_addy\" });",
        "}",
        "export function createNormAddyArrayCodec(schema: string) {",
        "  return withCodecSqlType(arrayCodec(createNormAddyCodec(schema)), { schema, name: \"norm_addy\", array: true });",
        "}",
        "const nullableString: ExtensionValueSchema = { kind: \"union\", variants: [{ kind: \"string\" }, { kind: \"null\" }] };",
        "const nullableNumber: ExtensionValueSchema = { kind: \"union\", variants: [{ kind: \"number\", integer: true, minimum: -2147483648, maximum: 2147483647 }, { kind: \"null\" }] };",
        "const nullableBoolean: ExtensionValueSchema = { kind: \"union\", variants: [{ kind: \"boolean\" }, { kind: \"null\" }] };",
        "export const normAddyValueSchema: ExtensionValueSchema = { kind: \"object\", properties: { address: nullableNumber, predirabbrev: nullableString, streetname: nullableString, streettypeabbrev: nullableString, postdirabbrev: nullableString, internal: nullableString, location: nullableString, stateabbrev: nullableString, zip: nullableString, parsed: nullableBoolean, zip4: nullableString, address_alphanumeric: nullableString } };",
        "export function createGeocodeRecordCodec(schema: string, postgisSchema: string) {",
        "  const fields = Object.freeze({ addy: nullableCodec(createNormAddyCodec(schema)), geomout: nullableCodec(createTigerGeometryCodec(postgisSchema)), rating: nullableInt4 });",
        "  return { fields, codec: withCodecSqlType(compositeCodec(\"postgis_tiger_geocoder:geocode-record\", fields), { schema: \"pg_catalog\", name: \"record\" }) };",
        "}",
        "export function createReverseGeocodeRecordCodec(schema: string, postgisSchema: string) {",
        "  const fields = Object.freeze({ intpt: nullableCodec(arrayCodec(createTigerGeometryCodec(postgisSchema))), addy: nullableCodec(createNormAddyArrayCodec(schema)), street: nullableCodec(arrayCodec(textCodec)) });",
        "  return { fields, codec: withCodecSqlType(compositeCodec(\"postgis_tiger_geocoder:reverse-geocode-record\", fields), { schema: \"pg_catalog\", name: \"record\" }) };",
        "}",
    ]
    for table in tables:
        fields = []
        props = []
        for column in table.get("columns") or []:
            sql_type = typ(column["type"])
            if sql_type == "pg_catalog.int4":
                codec = "nullableInt4"
                schema = "nullableNumber"
            elif sql_type == "pg_catalog.int8":
                codec = "nullableCodec(integerCodec)"
                schema = "{ kind: \"union\", variants: [{ kind: \"bigint\" }, { kind: \"null\" }] }"
            elif sql_type == "pg_catalog.float8":
                codec = "nullableCodec(floatCodec)"
                schema = "{ kind: \"union\", variants: [{ kind: \"number\" }, { kind: \"null\" }] }"
            elif sql_type == "pg_catalog.numeric":
                codec = "nullableCodec(numericCodec)"
                schema = "nullableString"
            elif sql_type == "pg_catalog.bool":
                codec = "nullableBool"
                schema = "nullableBoolean"
            elif sql_type == "pg_catalog._text":
                codec = "nullableCodec(arrayCodec(textCodec))"
                schema = "{ kind: \"union\", variants: [{ kind: \"array\", items: { kind: \"string\" } }, { kind: \"null\" }] }"
            elif sql_type == "$extension:postgis.geometry":
                codec = "geometryCodec"
                schema = "nullableString"
            else:
                codec = "nullableText"
                schema = "nullableString"
            fields.append(f"  {column['name']}: {codec}")
            props.append(f"  {column['name']}: {schema}")
        ident = table["name"]
        uses_geometry = any("geometryCodec" in field for field in fields)
        field_args = "geometryCodec: ReturnType<typeof createTigerGeometryCodec>" if uses_geometry else ""
        codec_args = "schema: string, geometryCodec: ReturnType<typeof createTigerGeometryCodec>" if uses_geometry else "schema: string"
        field_call = f"create_{ident}Fields(geometryCodec)" if uses_geometry else f"create_{ident}Fields()"
        chunks.append(f"export function create_{ident}Fields({field_args}) {{")
        chunks.append("  return Object.freeze({")
        chunks.extend(f"{line}," for line in fields)
        chunks.append("  });")
        chunks.append("}")
        chunks.append(f"export function create_{ident}Codec({codec_args}) {{")
        chunks.append(f"  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:{ident}`, {field_call}), {{ schema, name: {js(ident)} }});")
        chunks.append("}")
        chunks.append(f"export const {ident}ValueSchema: ExtensionValueSchema = {{ kind: \"object\", properties: {{")
        chunks.append(",\n".join(props))
        chunks.append("} };")
        chunks.append(f"export type {ident.title().replace('_', '')}Row = CompositeOutput<ReturnType<typeof create_{ident}Fields>>;")
    return "\n".join(chunks) + "\n"


def table_uses_geometry(table: dict) -> bool:
    return any(typ(column["type"]) == "$extension:postgis.geometry" for column in table.get("columns") or [])


def arg_codec(arg: dict) -> str:
    sql_type = typ(arg["type"])
    mapping = {
        "pg_catalog.varchar": "varchar",
        "pg_catalog.text": "text",
        "pg_catalog.int4": "int4",
        "pg_catalog.bool": "bool",
        "pg_catalog.float8": "float8",
        "pg_catalog._text": "textArray",
        "pg_catalog._varchar": "varcharArray",
        "$extension:postgis.geometry": "geometry",
        "$extension:postgis._geometry": "geometryArray",
        "$extension:postgis_tiger_geocoder.norm_addy": "normAddy",
        "$extension:postgis_tiger_geocoder._norm_addy": "normAddyArray",
    }
    name = mapping.get(sql_type, "text")
    expr = f"nullableCodec({name})" if name not in {"normAddy", "normAddyArray", "geometry", "geometryArray"} else f"nullableCodec({name})"
    if arg.get("hasDefault"):
        label = arg.get("name") or "value"
        return f'defaultSqlArgument({expr}, {js(label)})'
    return expr


def adapter() -> str:
    tables = [m for m in MEMBERS if m["kind"] == "relation" and m.get("relationKind") == "r"]
    query_members = [m for m in MEMBERS if m["kind"] == "routine" and m["name"] in QUERY_ROUTINES]
    lines = [
        'import { sql } from "drizzle-orm";',
        'import { bindExtension, type ExtensionDescriptor } from "../bindings";',
        'import { arrayCodec, booleanCodec, floatCodec, nullableCodec, textCodec, withCodecSqlType } from "../codecs";',
        'import { createExtensionField } from "../fields";',
        'import { int4Codec } from "../native-codecs";',
        'import { extensionRows } from "../rows";',
        'import { checkedExtensionExpression, createSqlFunction, defaultSqlArgument } from "../sql";',
        "import {",
        "  POSTGIS_TIGER_GEOCODER_DIGEST,",
        "  createNormAddyArrayCodec,",
        "  createNormAddyCodec,",
        "  createTigerGeometryCodec,",
        "  createGeocodeRecordCodec,",
        "  createReverseGeocodeRecordCodec,",
        "  normAddyValueSchema,",
        ",\n".join(f"  create_{table['name']}Codec,\n  create_{table['name']}Fields,\n  {table['name']}ValueSchema" for table in tables),
        '} from "./postgis-tiger-geocoder-codecs";',
        "export { POSTGIS_TIGER_GEOCODER_DIGEST } from \"./postgis-tiger-geocoder-codecs\";",
        "export type { PostgisTigerGeocoderNormAddy } from \"./postgis-tiger-geocoder-codecs\";",
        'type Descriptor = ExtensionDescriptor<"postgis_tiger_geocoder", { readonly version: "3.6.4"; readonly schema: string }>;',
        "/** Exact postgis_tiger_geocoder 3.6.4 queries. Native PL/pgSQL owns geocoding; this adapter never parses or fetches census data. */",
        "export function createPostgisTigerGeocoder_3_6_4<const Selected extends Descriptor>(descriptor: Selected, postgis: { readonly schema: string }) {",
        "  if (descriptor.name !== \"postgis_tiger_geocoder\" || descriptor.version !== \"3.6.4\" || descriptor.apiSupport.status !== \"verified\" || descriptor.apiSupport.digest !== POSTGIS_TIGER_GEOCODER_DIGEST)",
        "    throw new Error(\"postgis_tiger_geocoder 3.6.4 requires its exact verified contract\");",
        "  const schema = descriptor.schema;",
        "  const geometry = createTigerGeometryCodec(postgis.schema);",
        "  const normAddy = createNormAddyCodec(schema);",
        "  const normAddyArray = createNormAddyArrayCodec(schema);",
        "  const varchar = withCodecSqlType(textCodec, { schema: \"pg_catalog\", name: \"varchar\" });",
        "  const text = textCodec;",
        "  const int4 = int4Codec;",
        "  const bool = booleanCodec;",
        "  const float8 = floatCodec;",
        "  const geocodeRecord = createGeocodeRecordCodec(schema, postgis.schema);",
        "  const reverseRecord = createReverseGeocodeRecordCodec(schema, postgis.schema);",
        "  const query = { schema, dependencies: [], observability: \"tables\" as const, authority: \"query\" as const };",
        "  const search = { filter: false, comparison: false, order: false, text: false } as const;",
    ]
    function_names: dict[str, list[str]] = {}
    overload_entries = []
    for index, member in enumerate(query_members):
        ident = f"fn{index}"
        in_args = [arg for arg in member["arguments"] if arg.get("mode") != "out"]
        args = ", ".join(arg_codec(arg) for arg in in_args)
        if member["name"] in {"geocode", "geocode_address", "geocode_intersection", "geocode_location"}:
            result = "geocodeRecord.codec"
        elif member["name"] == "reverse_geocode":
            result = "reverseRecord.codec"
        elif member["returns"] and typ(member["returns"]) == "$extension:postgis_tiger_geocoder.norm_addy":
            result = "nullableCodec(normAddy)"
        elif member["returns"] and typ(member["returns"]) == "$extension:postgis.geometry":
            result = "nullableCodec(geometry)"
        elif member["returns"] and typ(member["returns"]) == "pg_catalog.int4":
            result = "nullableCodec(int4)"
        elif member["returns"] and typ(member["returns"]) == "pg_catalog.bool":
            result = "nullableCodec(bool)"
        elif member["returns"] and typ(member["returns"]) == "pg_catalog._varchar":
            result = "nullableCodec(varcharArray)"
        else:
            result = "nullableCodec(text)"
        lines.append(
            f'  const {ident} = createSqlFunction({{ ...query, name: {js(member["name"])}, member: {js(member["id"])}, arguments: [{args}] as const, result: {result} }});'
        )
        function_names.setdefault(member["name"], []).append(ident)
        overload_entries.append(f"    [{js(member['id'])}]: {ident}")
    # Public function aliases with geocode overloads
    lines.append("  function geocode(input: Parameters<typeof fn4>[0] | Parameters<typeof fn3>[0], maxResults?: Parameters<typeof fn4>[1], restrictGeom?: Parameters<typeof fn4>[2]) {")
    lines.append("    return typeof input === \"string\" || input === null ? fn4(input as never, maxResults, restrictGeom) : fn3(input as never, maxResults, restrictGeom);")
    lines.append("  }")
    public_functions = []
    for name, idents in function_names.items():
        if name == "geocode":
            public_functions.append("geocode")
            continue
        public_functions.append(f"{name}: {idents[0]}")
    lines.append("  const functions = Object.freeze({ " + ", ".join(public_functions) + " });")
    lines.append("  const overloads = Object.freeze({")
    lines.extend(f"{entry}," for entry in overload_entries)
    lines.append("  });")
    lines.append("  const types = Object.freeze({")
    lines.append('    [\'composite type:"$extension:postgis_tiger_geocoder".norm_addy\']: normAddy,')
    lines.append('    ["type:$extension:postgis_tiger_geocoder.norm_addy"]: normAddy,')
    lines.append('    ["type:$extension:postgis_tiger_geocoder._norm_addy"]: normAddyArray,')
    for table in tables:
        codec_call = f'create_{table["name"]}Codec(schema, geometry)' if table_uses_geometry(table) else f'create_{table["name"]}Codec(schema)'
        lines.append(f'    ["type:$extension:postgis_tiger_geocoder.{table["name"]}"]: {codec_call},')
        lines.append(f'    ["type:$extension:postgis_tiger_geocoder._{table["name"]}"]: arrayCodec({codec_call}),')
    lines.append("  });")
    bind_fields = [
        "    codec: normAddy,",
        "    arrayCodec: normAddyArray,",
        "    geometryCodec: geometry,",
        "    field: () => createExtensionField({ extension: descriptor, member: \"type:$extension:postgis_tiger_geocoder.norm_addy\", type: \"norm_addy\", codec: normAddy, value: normAddyValueSchema, search }),",
        "    arrayField: () => createExtensionField({ extension: descriptor, member: \"type:$extension:postgis_tiger_geocoder._norm_addy\", type: \"norm_addy\", array: true, codec: normAddyArray, value: normAddyValueSchema, search }),",
        "    normalizeAddress: functions.normalize_address,",
        "    pagcNormalizeAddress: functions.pagc_normalize_address,",
        "    prettyAddress: functions.pprint_addy,",
        "    geocode,",
        "    geocodeAddress: functions.geocode_address,",
        "    geocodeIntersection: functions.geocode_intersection,",
        "    geocodeLocation: functions.geocode_location,",
        "    reverseGeocode: functions.reverse_geocode,",
        "    getTract: functions.get_tract,",
        "    getGeocodeSetting: functions.get_geocode_setting,",
        "    interpolateFromAddress: functions.interpolate_from_address,",
        "    utmZone: functions.utmzone,",
        "    geocodeRows: (alias: string, ...args: Parameters<typeof geocode>) => extensionRows(geocode(...args), alias, geocodeRecord.fields, \"named\"),",
        "    reverseGeocodeRows: (alias: string, ...args: Parameters<typeof functions.reverse_geocode>) => extensionRows(functions.reverse_geocode(...args), alias, reverseRecord.fields, \"named\"),",
    ]
    for table in tables:
        codec_call = f"create_{table['name']}Codec(schema, geometry)" if table_uses_geometry(table) else f"create_{table['name']}Codec(schema)"
        field_call = f"create_{table['name']}Fields(geometry)" if table_uses_geometry(table) else f"create_{table['name']}Fields()"
        lines.append(f"  const {table['name']}Codec = {codec_call};")
        bind_fields.append(f"    {table['name']}Codec,")
        bind_fields.append(
            f"    {table['name']}Field: () => createExtensionField({{ extension: descriptor, member: \"type:$extension:postgis_tiger_geocoder.{table['name']}\", type: {js(table['name'])}, codec: {table['name']}Codec, value: {table['name']}ValueSchema, search }}),"
        )
        bind_fields.append(
            f"    {table['name']}Rows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${{sql.identifier(schema)}}.${{sql.identifier({js(table['name'])})}}`, {table['name']}Codec, [], undefined, 'table:\"$extension:postgis_tiger_geocoder\".{table['name']}', \"tables\"), alias, {field_call}, \"named\"),"
        )
    lines.append("  return bindExtension(descriptor, {")
    lines.extend(bind_fields)
    lines.append("    sql: Object.freeze({ functions, operators: Object.freeze({}), overloads, types }),")
    lines.append("  });")
    lines.append("}")
    lines.append("export type PostgisTigerGeocoderApi = ReturnType<typeof createPostgisTigerGeocoder_3_6_4>;")
    return "\n".join(lines) + "\n"


def operations() -> str:
    return '''import * as v from "valibot";
import { createPostgisTigerGeocoder_3_6_4 } from "../../../core/extensions/adapters/postgis-tiger-geocoder";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { ExtensionOperationError, withExtensionOperation } from "../operations";

type Descriptor = ExtensionDescriptor<"postgis_tiger_geocoder", { readonly version: "3.6.4"; readonly schema: string }>;

export class PostgisTigerGeocoderOperationError extends ExtensionOperationError {
  constructor(failure: ExtensionOperationError) {
    super(failure.cause, failure.completion, failure.cleanupFailures);
    this.name = "PostgisTigerGeocoderOperationError";
  }
}

export interface PostgisTigerGeocoderOperatorSession {
  readonly generateNationScript: (os: string) => Promise<readonly string[]>;
  readonly generateScript: (states: readonly string[], os: string) => Promise<readonly string[]>;
  readonly generateCensusScript: (states: readonly string[], os: string) => Promise<readonly string[]>;
  readonly macroReplace: (input: string, keys: readonly string[], values: readonly string[]) => Promise<string>;
  readonly missingIndexesScript: () => Promise<string | null>;
  readonly dropIndexesScript: (schema?: string) => Promise<string | null>;
  readonly setGeocodeSetting: (name: string, value: string) => Promise<string | null>;
  readonly installMissingIndexes: () => Promise<boolean>;
}

function assertNoFetch(script: string): string {
  if (/\\b(wget|curl)\\b/i.test(script) && /executed|downloaded/i.test(script))
    throw new Error("postgis_tiger_geocoder loader scripts must not be executed");
  return script;
}

/** Operator plans return native script text. They never fetch census.gov or other geodata. */
export async function withPostgisTigerGeocoderOperations<Result>(
  directOperatorUrl: string,
  descriptor: Descriptor,
  postgis: { readonly schema: string },
  operation: (session: PostgisTigerGeocoderOperatorSession) => Promise<Result>,
  signal?: AbortSignal,
) {
  createPostgisTigerGeocoder_3_6_4(descriptor, postgis);
  try {
    return await withExtensionOperation(
      directOperatorUrl,
      (context) => context,
      async (context) => {
        const quote = (value: string) => '"' + value.replaceAll('"', '""') + '"';
        const schema = quote(descriptor.schema);
        const session: PostgisTigerGeocoderOperatorSession = {
          async generateNationScript(os) {
            const rows = await context.client.query<{ value: string }>(`SELECT ${schema}.loader_generate_nation_script($1) AS value`, [os]);
            return Object.freeze(rows.rows.map((row) => assertNoFetch(v.parse(v.string(), row.value))));
          },
          async generateScript(states, os) {
            const rows = await context.client.query<{ value: string }>(`SELECT ${schema}.loader_generate_script($1::text[], $2) AS value`, [states, os]);
            return Object.freeze(rows.rows.map((row) => assertNoFetch(v.parse(v.string(), row.value))));
          },
          async generateCensusScript(states, os) {
            const rows = await context.client.query<{ value: string }>(`SELECT ${schema}.loader_generate_census_script($1::text[], $2) AS value`, [states, os]);
            return Object.freeze(rows.rows.map((row) => assertNoFetch(v.parse(v.string(), row.value))));
          },
          async macroReplace(input, keys, values) {
            const rows = await context.client.query<{ value: string }>(`SELECT ${schema}.loader_macro_replace($1, $2::text[], $3::text[]) AS value`, [input, keys, values]);
            return v.parse(v.string(), rows.rows[0]?.value);
          },
          async missingIndexesScript() {
            const rows = await context.client.query<{ value: string | null }>(`SELECT ${schema}.missing_indexes_generate_script() AS value`);
            const value = rows.rows[0]?.value;
            return value == null ? null : v.parse(v.string(), value);
          },
          async dropIndexesScript(targetSchema = "tiger_data") {
            const rows = await context.client.query<{ value: string | null }>(`SELECT ${schema}.drop_indexes_generate_script($1) AS value`, [targetSchema]);
            const value = rows.rows[0]?.value;
            return value == null ? null : v.parse(v.string(), value);
          },
          async setGeocodeSetting(name, value) {
            const rows = await context.client.query<{ value: string | null }>(`SELECT ${schema}.set_geocode_setting($1, $2) AS value`, [name, value]);
            const setting = rows.rows[0]?.value;
            return setting == null ? null : v.parse(v.string(), setting);
          },
          async installMissingIndexes() {
            const rows = await context.client.query<{ value: boolean }>(`SELECT ${schema}.install_missing_indexes() AS value`);
            return v.parse(v.boolean(), rows.rows[0]?.value);
          },
        };
        return operation(session);
      },
      signal,
    );
  } catch (cause) {
    if (cause instanceof ExtensionOperationError) throw new PostgisTigerGeocoderOperationError(cause);
    throw cause;
  }
}
'''


def types() -> str:
    return '''import { sql, type SQL } from "drizzle-orm";
import {
  createPostgisTigerGeocoder_3_6_4,
  type PostgisTigerGeocoderNormAddy,
} from "../../../apps/loom/src/core/extensions/adapters/postgis-tiger-geocoder";
import { POSTGIS_TIGER_GEOCODER_DIGEST } from "../../e2e/fixtures/postgis-tiger-geocoder-proof-cases";

const api = createPostgisTigerGeocoder_3_6_4(
  {
    name: "postgis_tiger_geocoder",
    version: "3.6.4",
    schema: "tiger",
    apiSupport: { status: "verified", digest: POSTGIS_TIGER_GEOCODER_DIGEST },
  },
  { schema: "public" },
);
const addy: PostgisTigerGeocoderNormAddy = {
  address: 26,
  predirabbrev: null,
  streetname: "Court",
  streettypeabbrev: "St",
  postdirabbrev: null,
  internal: null,
  location: "Boston",
  stateabbrev: "MA",
  zip: "02108",
  parsed: true,
  zip4: null,
  address_alphanumeric: "26",
};
const normalized: SQL<PostgisTigerGeocoderNormAddy | null> = api.normalizeAddress("26 Court Street, Boston, MA 02108");
const pretty: SQL<string | null> = api.prettyAddress(addy);
const geocoded = api.geocode("26 Court Street, Boston, MA 02108");
const fromAddy = api.geocode(addy);
const reversed = api.reverseGeocode("SRID=4269;POINT(-71.057811 42.358274)");
const interpolated: SQL<string | null> = api.interpolateFromAddress(15, "10", "20", "SRID=4269;LINESTRING(-71.06 42.35,-71.05 42.35)");
api.codec.encode(addy);
api.state_lookupRows("states");
void sql`${normalized} ${pretty} ${geocoded} ${fromAddy} ${reversed} ${interpolated}`;
// @ts-expect-error Wrong selected version is rejected statically.
createPostgisTigerGeocoder_3_6_4({ ...api, version: "3.6.3" }, { schema: "public" });
// @ts-expect-error A caller cannot select a result type.
api.normalizeAddress<string>("26 Court Street");
'''


def tsconfig() -> str:
    return """{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "incremental": false
  },
  "include": [
    "extensions-postgis-tiger-geocoder.test-d.ts",
    "../unit/extensions-postgis-tiger-geocoder.test.ts",
    "../../e2e/fixtures/postgis-tiger-geocoder-proof-cases.ts",
    "../../e2e/fixtures/postgis-tiger-geocoder-native-characterization.json"
  ]
}
"""


def main() -> None:
    write(ROOT / "apps/loom/src/tooling/extensions/annotations/postgis_tiger_geocoder.ts", annotations())
    write(ROOT / "apps/loom/src/core/extensions/adapters/postgis-tiger-geocoder-codecs.ts", codecs())
    write(ROOT / "apps/loom/src/core/extensions/adapters/postgis-tiger-geocoder.ts", adapter())
    write(ROOT / "apps/loom/src/tooling/extensions/operations/postgis-tiger-geocoder.ts", operations())
    write(ROOT / "packages/tests/types/extensions-postgis-tiger-geocoder.test-d.ts", types())
    write(ROOT / "packages/tests/types/postgis-tiger-geocoder.tsconfig.json", tsconfig())


if __name__ == "__main__":
    main()
