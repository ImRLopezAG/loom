import { sql } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { arrayCodec, booleanCodec, floatCodec, nullableCodec, textCodec, withCodecSqlType } from "../codecs";
import { createExtensionField } from "../fields";
import { int4Codec } from "../native-codecs";
import { extensionRows } from "../rows";
import { checkedExtensionExpression, createSqlFunction, defaultSqlArgument } from "../sql";
import {
  POSTGIS_TIGER_GEOCODER_DIGEST,
  createNormAddyArrayCodec,
  createNormAddyCodec,
  createTigerGeometryCodec,
  createGeocodeRecordCodec,
  createReverseGeocodeRecordCodec,
  normAddyValueSchema,
  create_addrCodec,
  create_addrFields,
  addrValueSchema,
  create_addrfeatCodec,
  create_addrfeatFields,
  addrfeatValueSchema,
  create_bgCodec,
  create_bgFields,
  bgValueSchema,
  create_countyCodec,
  create_countyFields,
  countyValueSchema,
  create_county_lookupCodec,
  create_county_lookupFields,
  county_lookupValueSchema,
  create_countysub_lookupCodec,
  create_countysub_lookupFields,
  countysub_lookupValueSchema,
  create_cousubCodec,
  create_cousubFields,
  cousubValueSchema,
  create_direction_lookupCodec,
  create_direction_lookupFields,
  direction_lookupValueSchema,
  create_edgesCodec,
  create_edgesFields,
  edgesValueSchema,
  create_facesCodec,
  create_facesFields,
  facesValueSchema,
  create_featnamesCodec,
  create_featnamesFields,
  featnamesValueSchema,
  create_geocode_settingsCodec,
  create_geocode_settingsFields,
  geocode_settingsValueSchema,
  create_geocode_settings_defaultCodec,
  create_geocode_settings_defaultFields,
  geocode_settings_defaultValueSchema,
  create_loader_lookuptablesCodec,
  create_loader_lookuptablesFields,
  loader_lookuptablesValueSchema,
  create_loader_platformCodec,
  create_loader_platformFields,
  loader_platformValueSchema,
  create_loader_variablesCodec,
  create_loader_variablesFields,
  loader_variablesValueSchema,
  create_pagc_gazCodec,
  create_pagc_gazFields,
  pagc_gazValueSchema,
  create_pagc_lexCodec,
  create_pagc_lexFields,
  pagc_lexValueSchema,
  create_pagc_rulesCodec,
  create_pagc_rulesFields,
  pagc_rulesValueSchema,
  create_placeCodec,
  create_placeFields,
  placeValueSchema,
  create_place_lookupCodec,
  create_place_lookupFields,
  place_lookupValueSchema,
  create_secondary_unit_lookupCodec,
  create_secondary_unit_lookupFields,
  secondary_unit_lookupValueSchema,
  create_stateCodec,
  create_stateFields,
  stateValueSchema,
  create_state_lookupCodec,
  create_state_lookupFields,
  state_lookupValueSchema,
  create_street_type_lookupCodec,
  create_street_type_lookupFields,
  street_type_lookupValueSchema,
  create_tabblockCodec,
  create_tabblockFields,
  tabblockValueSchema,
  create_tabblock20Codec,
  create_tabblock20Fields,
  tabblock20ValueSchema,
  create_tractCodec,
  create_tractFields,
  tractValueSchema,
  create_zcta5Codec,
  create_zcta5Fields,
  zcta5ValueSchema,
  create_zip_lookupCodec,
  create_zip_lookupFields,
  zip_lookupValueSchema,
  create_zip_lookup_allCodec,
  create_zip_lookup_allFields,
  zip_lookup_allValueSchema,
  create_zip_lookup_baseCodec,
  create_zip_lookup_baseFields,
  zip_lookup_baseValueSchema,
  create_zip_stateCodec,
  create_zip_stateFields,
  zip_stateValueSchema,
  create_zip_state_locCodec,
  create_zip_state_locFields,
  zip_state_locValueSchema
} from "./postgis-tiger-geocoder-codecs";
export { POSTGIS_TIGER_GEOCODER_DIGEST } from "./postgis-tiger-geocoder-codecs";
export type { PostgisTigerGeocoderNormAddy } from "./postgis-tiger-geocoder-codecs";
type Descriptor = ExtensionDescriptor<"postgis_tiger_geocoder", { readonly version: "3.6.4"; readonly schema: string }>;
/** Exact postgis_tiger_geocoder 3.6.4 queries. Native PL/pgSQL owns geocoding; this adapter never parses or fetches census data. */
export function createPostgisTigerGeocoder_3_6_4<const Selected extends Descriptor>(descriptor: Selected, postgis: { readonly schema: string }) {
  if (descriptor.name !== "postgis_tiger_geocoder" || descriptor.version !== "3.6.4" || descriptor.apiSupport.status !== "verified" || descriptor.apiSupport.digest !== POSTGIS_TIGER_GEOCODER_DIGEST)
    throw new Error("postgis_tiger_geocoder 3.6.4 requires its exact verified contract");
  const schema = descriptor.schema;
  const geometry = createTigerGeometryCodec(postgis.schema);
  const normAddy = createNormAddyCodec(schema);
  const normAddyArray = createNormAddyArrayCodec(schema);
  const varchar = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "varchar" });
  const text = textCodec;
  const int4 = int4Codec;
  const bool = booleanCodec;
  const float8 = floatCodec;
  const geocodeRecord = createGeocodeRecordCodec(schema, postgis.schema);
  const reverseRecord = createReverseGeocodeRecordCodec(schema, postgis.schema);
  const query = { schema, dependencies: [], observability: "tables" as const, authority: "query" as const };
  const search = { filter: false, comparison: false, order: false, text: false } as const;
  const fn0 = createSqlFunction({ ...query, name: "geocode_address", member: "routine:$extension:postgis_tiger_geocoder.geocode_address($extension:postgis_tiger_geocoder.norm_addy,pg_catalog.int4,$extension:postgis.geometry)", arguments: [nullableCodec(normAddy), defaultSqlArgument(nullableCodec(int4), "max_results"), defaultSqlArgument(nullableCodec(geometry), "restrict_geom")] as const, result: geocodeRecord.codec });
  const fn1 = createSqlFunction({ ...query, name: "geocode_intersection", member: "routine:$extension:postgis_tiger_geocoder.geocode_intersection(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)", arguments: [nullableCodec(text), nullableCodec(text), nullableCodec(text), defaultSqlArgument(nullableCodec(text), "in_city"), defaultSqlArgument(nullableCodec(text), "in_zip"), defaultSqlArgument(nullableCodec(int4), "num_results")] as const, result: geocodeRecord.codec });
  const fn2 = createSqlFunction({ ...query, name: "geocode_location", member: "routine:$extension:postgis_tiger_geocoder.geocode_location($extension:postgis_tiger_geocoder.norm_addy,$extension:postgis.geometry)", arguments: [nullableCodec(normAddy), defaultSqlArgument(nullableCodec(geometry), "restrict_geom")] as const, result: geocodeRecord.codec });
  const fn3 = createSqlFunction({ ...query, name: "geocode", member: "routine:$extension:postgis_tiger_geocoder.geocode($extension:postgis_tiger_geocoder.norm_addy,pg_catalog.int4,$extension:postgis.geometry)", arguments: [nullableCodec(normAddy), defaultSqlArgument(nullableCodec(int4), "max_results"), defaultSqlArgument(nullableCodec(geometry), "restrict_geom")] as const, result: geocodeRecord.codec });
  const fn4 = createSqlFunction({ ...query, name: "geocode", member: "routine:$extension:postgis_tiger_geocoder.geocode(pg_catalog.varchar,pg_catalog.int4,$extension:postgis.geometry)", arguments: [nullableCodec(varchar), defaultSqlArgument(nullableCodec(int4), "max_results"), defaultSqlArgument(nullableCodec(geometry), "restrict_geom")] as const, result: geocodeRecord.codec });
  const fn5 = createSqlFunction({ ...query, name: "get_geocode_setting", member: "routine:$extension:postgis_tiger_geocoder.get_geocode_setting(pg_catalog.text)", arguments: [nullableCodec(text)] as const, result: nullableCodec(text) });
  const fn6 = createSqlFunction({ ...query, name: "get_tract", member: "routine:$extension:postgis_tiger_geocoder.get_tract($extension:postgis.geometry,pg_catalog.text)", arguments: [nullableCodec(geometry), defaultSqlArgument(nullableCodec(text), "output_field")] as const, result: nullableCodec(text) });
  const fn7 = createSqlFunction({ ...query, name: "interpolate_from_address", member: "routine:$extension:postgis_tiger_geocoder.interpolate_from_address(pg_catalog.int4,pg_catalog.varchar,pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.varchar,pg_catalog.float8)", arguments: [nullableCodec(int4), nullableCodec(varchar), nullableCodec(varchar), nullableCodec(geometry), defaultSqlArgument(nullableCodec(varchar), "in_side"), defaultSqlArgument(nullableCodec(float8), "in_offset_m")] as const, result: nullableCodec(geometry) });
  const fn8 = createSqlFunction({ ...query, name: "normalize_address", member: "routine:$extension:postgis_tiger_geocoder.normalize_address(pg_catalog.varchar)", arguments: [nullableCodec(varchar)] as const, result: nullableCodec(normAddy) });
  const fn9 = createSqlFunction({ ...query, name: "pagc_normalize_address", member: "routine:$extension:postgis_tiger_geocoder.pagc_normalize_address(pg_catalog.varchar)", arguments: [nullableCodec(varchar)] as const, result: nullableCodec(normAddy) });
  const fn10 = createSqlFunction({ ...query, name: "pprint_addy", member: "routine:$extension:postgis_tiger_geocoder.pprint_addy($extension:postgis_tiger_geocoder.norm_addy)", arguments: [nullableCodec(normAddy)] as const, result: nullableCodec(text) });
  const fn11 = createSqlFunction({ ...query, name: "reverse_geocode", member: "routine:$extension:postgis_tiger_geocoder.reverse_geocode($extension:postgis.geometry,pg_catalog.bool)", arguments: [nullableCodec(geometry), defaultSqlArgument(nullableCodec(bool), "include_strnum_range")] as const, result: reverseRecord.codec });
  const fn12 = createSqlFunction({ ...query, name: "utmzone", member: "routine:$extension:postgis_tiger_geocoder.utmzone($extension:postgis.geometry)", arguments: [nullableCodec(geometry)] as const, result: nullableCodec(int4) });
  function geocode(input: Parameters<typeof fn4>[0] | Parameters<typeof fn3>[0], maxResults?: Parameters<typeof fn4>[1], restrictGeom?: Parameters<typeof fn4>[2]) {
    return typeof input === "string" || input === null ? fn4(input as never, maxResults, restrictGeom) : fn3(input as never, maxResults, restrictGeom);
  }
  const functions = Object.freeze({ geocode_address: fn0, geocode_intersection: fn1, geocode_location: fn2, geocode, get_geocode_setting: fn5, get_tract: fn6, interpolate_from_address: fn7, normalize_address: fn8, pagc_normalize_address: fn9, pprint_addy: fn10, reverse_geocode: fn11, utmzone: fn12 });
  const overloads = Object.freeze({
    ["routine:$extension:postgis_tiger_geocoder.geocode_address($extension:postgis_tiger_geocoder.norm_addy,pg_catalog.int4,$extension:postgis.geometry)"]: fn0,
    ["routine:$extension:postgis_tiger_geocoder.geocode_intersection(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)"]: fn1,
    ["routine:$extension:postgis_tiger_geocoder.geocode_location($extension:postgis_tiger_geocoder.norm_addy,$extension:postgis.geometry)"]: fn2,
    ["routine:$extension:postgis_tiger_geocoder.geocode($extension:postgis_tiger_geocoder.norm_addy,pg_catalog.int4,$extension:postgis.geometry)"]: fn3,
    ["routine:$extension:postgis_tiger_geocoder.geocode(pg_catalog.varchar,pg_catalog.int4,$extension:postgis.geometry)"]: fn4,
    ["routine:$extension:postgis_tiger_geocoder.get_geocode_setting(pg_catalog.text)"]: fn5,
    ["routine:$extension:postgis_tiger_geocoder.get_tract($extension:postgis.geometry,pg_catalog.text)"]: fn6,
    ["routine:$extension:postgis_tiger_geocoder.interpolate_from_address(pg_catalog.int4,pg_catalog.varchar,pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.varchar,pg_catalog.float8)"]: fn7,
    ["routine:$extension:postgis_tiger_geocoder.normalize_address(pg_catalog.varchar)"]: fn8,
    ["routine:$extension:postgis_tiger_geocoder.pagc_normalize_address(pg_catalog.varchar)"]: fn9,
    ["routine:$extension:postgis_tiger_geocoder.pprint_addy($extension:postgis_tiger_geocoder.norm_addy)"]: fn10,
    ["routine:$extension:postgis_tiger_geocoder.reverse_geocode($extension:postgis.geometry,pg_catalog.bool)"]: fn11,
    ["routine:$extension:postgis_tiger_geocoder.utmzone($extension:postgis.geometry)"]: fn12,
  });
  const types = Object.freeze({
    ['composite type:"$extension:postgis_tiger_geocoder".norm_addy']: normAddy,
    ["type:$extension:postgis_tiger_geocoder.norm_addy"]: normAddy,
    ["type:$extension:postgis_tiger_geocoder._norm_addy"]: normAddyArray,
    ["type:$extension:postgis_tiger_geocoder.addr"]: create_addrCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._addr"]: arrayCodec(create_addrCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.addrfeat"]: create_addrfeatCodec(schema, geometry),
    ["type:$extension:postgis_tiger_geocoder._addrfeat"]: arrayCodec(create_addrfeatCodec(schema, geometry)),
    ["type:$extension:postgis_tiger_geocoder.bg"]: create_bgCodec(schema, geometry),
    ["type:$extension:postgis_tiger_geocoder._bg"]: arrayCodec(create_bgCodec(schema, geometry)),
    ["type:$extension:postgis_tiger_geocoder.county"]: create_countyCodec(schema, geometry),
    ["type:$extension:postgis_tiger_geocoder._county"]: arrayCodec(create_countyCodec(schema, geometry)),
    ["type:$extension:postgis_tiger_geocoder.county_lookup"]: create_county_lookupCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._county_lookup"]: arrayCodec(create_county_lookupCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.countysub_lookup"]: create_countysub_lookupCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._countysub_lookup"]: arrayCodec(create_countysub_lookupCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.cousub"]: create_cousubCodec(schema, geometry),
    ["type:$extension:postgis_tiger_geocoder._cousub"]: arrayCodec(create_cousubCodec(schema, geometry)),
    ["type:$extension:postgis_tiger_geocoder.direction_lookup"]: create_direction_lookupCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._direction_lookup"]: arrayCodec(create_direction_lookupCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.edges"]: create_edgesCodec(schema, geometry),
    ["type:$extension:postgis_tiger_geocoder._edges"]: arrayCodec(create_edgesCodec(schema, geometry)),
    ["type:$extension:postgis_tiger_geocoder.faces"]: create_facesCodec(schema, geometry),
    ["type:$extension:postgis_tiger_geocoder._faces"]: arrayCodec(create_facesCodec(schema, geometry)),
    ["type:$extension:postgis_tiger_geocoder.featnames"]: create_featnamesCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._featnames"]: arrayCodec(create_featnamesCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.geocode_settings"]: create_geocode_settingsCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._geocode_settings"]: arrayCodec(create_geocode_settingsCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.geocode_settings_default"]: create_geocode_settings_defaultCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._geocode_settings_default"]: arrayCodec(create_geocode_settings_defaultCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.loader_lookuptables"]: create_loader_lookuptablesCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._loader_lookuptables"]: arrayCodec(create_loader_lookuptablesCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.loader_platform"]: create_loader_platformCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._loader_platform"]: arrayCodec(create_loader_platformCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.loader_variables"]: create_loader_variablesCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._loader_variables"]: arrayCodec(create_loader_variablesCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.pagc_gaz"]: create_pagc_gazCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._pagc_gaz"]: arrayCodec(create_pagc_gazCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.pagc_lex"]: create_pagc_lexCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._pagc_lex"]: arrayCodec(create_pagc_lexCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.pagc_rules"]: create_pagc_rulesCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._pagc_rules"]: arrayCodec(create_pagc_rulesCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.place"]: create_placeCodec(schema, geometry),
    ["type:$extension:postgis_tiger_geocoder._place"]: arrayCodec(create_placeCodec(schema, geometry)),
    ["type:$extension:postgis_tiger_geocoder.place_lookup"]: create_place_lookupCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._place_lookup"]: arrayCodec(create_place_lookupCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.secondary_unit_lookup"]: create_secondary_unit_lookupCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._secondary_unit_lookup"]: arrayCodec(create_secondary_unit_lookupCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.state"]: create_stateCodec(schema, geometry),
    ["type:$extension:postgis_tiger_geocoder._state"]: arrayCodec(create_stateCodec(schema, geometry)),
    ["type:$extension:postgis_tiger_geocoder.state_lookup"]: create_state_lookupCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._state_lookup"]: arrayCodec(create_state_lookupCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.street_type_lookup"]: create_street_type_lookupCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._street_type_lookup"]: arrayCodec(create_street_type_lookupCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.tabblock"]: create_tabblockCodec(schema, geometry),
    ["type:$extension:postgis_tiger_geocoder._tabblock"]: arrayCodec(create_tabblockCodec(schema, geometry)),
    ["type:$extension:postgis_tiger_geocoder.tabblock20"]: create_tabblock20Codec(schema, geometry),
    ["type:$extension:postgis_tiger_geocoder._tabblock20"]: arrayCodec(create_tabblock20Codec(schema, geometry)),
    ["type:$extension:postgis_tiger_geocoder.tract"]: create_tractCodec(schema, geometry),
    ["type:$extension:postgis_tiger_geocoder._tract"]: arrayCodec(create_tractCodec(schema, geometry)),
    ["type:$extension:postgis_tiger_geocoder.zcta5"]: create_zcta5Codec(schema, geometry),
    ["type:$extension:postgis_tiger_geocoder._zcta5"]: arrayCodec(create_zcta5Codec(schema, geometry)),
    ["type:$extension:postgis_tiger_geocoder.zip_lookup"]: create_zip_lookupCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._zip_lookup"]: arrayCodec(create_zip_lookupCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.zip_lookup_all"]: create_zip_lookup_allCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._zip_lookup_all"]: arrayCodec(create_zip_lookup_allCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.zip_lookup_base"]: create_zip_lookup_baseCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._zip_lookup_base"]: arrayCodec(create_zip_lookup_baseCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.zip_state"]: create_zip_stateCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._zip_state"]: arrayCodec(create_zip_stateCodec(schema)),
    ["type:$extension:postgis_tiger_geocoder.zip_state_loc"]: create_zip_state_locCodec(schema),
    ["type:$extension:postgis_tiger_geocoder._zip_state_loc"]: arrayCodec(create_zip_state_locCodec(schema)),
  });
  const addrCodec = create_addrCodec(schema);
  const addrfeatCodec = create_addrfeatCodec(schema, geometry);
  const bgCodec = create_bgCodec(schema, geometry);
  const countyCodec = create_countyCodec(schema, geometry);
  const county_lookupCodec = create_county_lookupCodec(schema);
  const countysub_lookupCodec = create_countysub_lookupCodec(schema);
  const cousubCodec = create_cousubCodec(schema, geometry);
  const direction_lookupCodec = create_direction_lookupCodec(schema);
  const edgesCodec = create_edgesCodec(schema, geometry);
  const facesCodec = create_facesCodec(schema, geometry);
  const featnamesCodec = create_featnamesCodec(schema);
  const geocode_settingsCodec = create_geocode_settingsCodec(schema);
  const geocode_settings_defaultCodec = create_geocode_settings_defaultCodec(schema);
  const loader_lookuptablesCodec = create_loader_lookuptablesCodec(schema);
  const loader_platformCodec = create_loader_platformCodec(schema);
  const loader_variablesCodec = create_loader_variablesCodec(schema);
  const pagc_gazCodec = create_pagc_gazCodec(schema);
  const pagc_lexCodec = create_pagc_lexCodec(schema);
  const pagc_rulesCodec = create_pagc_rulesCodec(schema);
  const placeCodec = create_placeCodec(schema, geometry);
  const place_lookupCodec = create_place_lookupCodec(schema);
  const secondary_unit_lookupCodec = create_secondary_unit_lookupCodec(schema);
  const stateCodec = create_stateCodec(schema, geometry);
  const state_lookupCodec = create_state_lookupCodec(schema);
  const street_type_lookupCodec = create_street_type_lookupCodec(schema);
  const tabblockCodec = create_tabblockCodec(schema, geometry);
  const tabblock20Codec = create_tabblock20Codec(schema, geometry);
  const tractCodec = create_tractCodec(schema, geometry);
  const zcta5Codec = create_zcta5Codec(schema, geometry);
  const zip_lookupCodec = create_zip_lookupCodec(schema);
  const zip_lookup_allCodec = create_zip_lookup_allCodec(schema);
  const zip_lookup_baseCodec = create_zip_lookup_baseCodec(schema);
  const zip_stateCodec = create_zip_stateCodec(schema);
  const zip_state_locCodec = create_zip_state_locCodec(schema);
  return bindExtension(descriptor, {
    codec: normAddy,
    arrayCodec: normAddyArray,
    geometryCodec: geometry,
    field: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.norm_addy", type: "norm_addy", codec: normAddy, value: normAddyValueSchema, search }),
    arrayField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder._norm_addy", type: "norm_addy", array: true, codec: normAddyArray, value: normAddyValueSchema, search }),
    normalizeAddress: functions.normalize_address,
    pagcNormalizeAddress: functions.pagc_normalize_address,
    prettyAddress: functions.pprint_addy,
    geocode,
    geocodeAddress: functions.geocode_address,
    geocodeIntersection: functions.geocode_intersection,
    geocodeLocation: functions.geocode_location,
    reverseGeocode: functions.reverse_geocode,
    getTract: functions.get_tract,
    getGeocodeSetting: functions.get_geocode_setting,
    interpolateFromAddress: functions.interpolate_from_address,
    utmZone: functions.utmzone,
    geocodeRows: (alias: string, ...args: Parameters<typeof geocode>) => extensionRows(geocode(...args), alias, geocodeRecord.fields, "named"),
    reverseGeocodeRows: (alias: string, ...args: Parameters<typeof functions.reverse_geocode>) => extensionRows(functions.reverse_geocode(...args), alias, reverseRecord.fields, "named"),
    addrCodec,
    addrField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.addr", type: "addr", codec: addrCodec, value: addrValueSchema, search }),
    addrRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("addr")}`, addrCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".addr', "tables"), alias, create_addrFields(), "named"),
    addrfeatCodec,
    addrfeatField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.addrfeat", type: "addrfeat", codec: addrfeatCodec, value: addrfeatValueSchema, search }),
    addrfeatRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("addrfeat")}`, addrfeatCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".addrfeat', "tables"), alias, create_addrfeatFields(geometry), "named"),
    bgCodec,
    bgField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.bg", type: "bg", codec: bgCodec, value: bgValueSchema, search }),
    bgRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("bg")}`, bgCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".bg', "tables"), alias, create_bgFields(geometry), "named"),
    countyCodec,
    countyField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.county", type: "county", codec: countyCodec, value: countyValueSchema, search }),
    countyRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("county")}`, countyCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".county', "tables"), alias, create_countyFields(geometry), "named"),
    county_lookupCodec,
    county_lookupField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.county_lookup", type: "county_lookup", codec: county_lookupCodec, value: county_lookupValueSchema, search }),
    county_lookupRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("county_lookup")}`, county_lookupCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".county_lookup', "tables"), alias, create_county_lookupFields(), "named"),
    countysub_lookupCodec,
    countysub_lookupField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.countysub_lookup", type: "countysub_lookup", codec: countysub_lookupCodec, value: countysub_lookupValueSchema, search }),
    countysub_lookupRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("countysub_lookup")}`, countysub_lookupCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".countysub_lookup', "tables"), alias, create_countysub_lookupFields(), "named"),
    cousubCodec,
    cousubField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.cousub", type: "cousub", codec: cousubCodec, value: cousubValueSchema, search }),
    cousubRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("cousub")}`, cousubCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".cousub', "tables"), alias, create_cousubFields(geometry), "named"),
    direction_lookupCodec,
    direction_lookupField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.direction_lookup", type: "direction_lookup", codec: direction_lookupCodec, value: direction_lookupValueSchema, search }),
    direction_lookupRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("direction_lookup")}`, direction_lookupCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".direction_lookup', "tables"), alias, create_direction_lookupFields(), "named"),
    edgesCodec,
    edgesField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.edges", type: "edges", codec: edgesCodec, value: edgesValueSchema, search }),
    edgesRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("edges")}`, edgesCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".edges', "tables"), alias, create_edgesFields(geometry), "named"),
    facesCodec,
    facesField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.faces", type: "faces", codec: facesCodec, value: facesValueSchema, search }),
    facesRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("faces")}`, facesCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".faces', "tables"), alias, create_facesFields(geometry), "named"),
    featnamesCodec,
    featnamesField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.featnames", type: "featnames", codec: featnamesCodec, value: featnamesValueSchema, search }),
    featnamesRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("featnames")}`, featnamesCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".featnames', "tables"), alias, create_featnamesFields(), "named"),
    geocode_settingsCodec,
    geocode_settingsField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.geocode_settings", type: "geocode_settings", codec: geocode_settingsCodec, value: geocode_settingsValueSchema, search }),
    geocode_settingsRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("geocode_settings")}`, geocode_settingsCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".geocode_settings', "tables"), alias, create_geocode_settingsFields(), "named"),
    geocode_settings_defaultCodec,
    geocode_settings_defaultField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.geocode_settings_default", type: "geocode_settings_default", codec: geocode_settings_defaultCodec, value: geocode_settings_defaultValueSchema, search }),
    geocode_settings_defaultRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("geocode_settings_default")}`, geocode_settings_defaultCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".geocode_settings_default', "tables"), alias, create_geocode_settings_defaultFields(), "named"),
    loader_lookuptablesCodec,
    loader_lookuptablesField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.loader_lookuptables", type: "loader_lookuptables", codec: loader_lookuptablesCodec, value: loader_lookuptablesValueSchema, search }),
    loader_lookuptablesRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("loader_lookuptables")}`, loader_lookuptablesCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".loader_lookuptables', "tables"), alias, create_loader_lookuptablesFields(), "named"),
    loader_platformCodec,
    loader_platformField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.loader_platform", type: "loader_platform", codec: loader_platformCodec, value: loader_platformValueSchema, search }),
    loader_platformRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("loader_platform")}`, loader_platformCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".loader_platform', "tables"), alias, create_loader_platformFields(), "named"),
    loader_variablesCodec,
    loader_variablesField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.loader_variables", type: "loader_variables", codec: loader_variablesCodec, value: loader_variablesValueSchema, search }),
    loader_variablesRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("loader_variables")}`, loader_variablesCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".loader_variables', "tables"), alias, create_loader_variablesFields(), "named"),
    pagc_gazCodec,
    pagc_gazField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.pagc_gaz", type: "pagc_gaz", codec: pagc_gazCodec, value: pagc_gazValueSchema, search }),
    pagc_gazRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("pagc_gaz")}`, pagc_gazCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".pagc_gaz', "tables"), alias, create_pagc_gazFields(), "named"),
    pagc_lexCodec,
    pagc_lexField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.pagc_lex", type: "pagc_lex", codec: pagc_lexCodec, value: pagc_lexValueSchema, search }),
    pagc_lexRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("pagc_lex")}`, pagc_lexCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".pagc_lex', "tables"), alias, create_pagc_lexFields(), "named"),
    pagc_rulesCodec,
    pagc_rulesField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.pagc_rules", type: "pagc_rules", codec: pagc_rulesCodec, value: pagc_rulesValueSchema, search }),
    pagc_rulesRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("pagc_rules")}`, pagc_rulesCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".pagc_rules', "tables"), alias, create_pagc_rulesFields(), "named"),
    placeCodec,
    placeField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.place", type: "place", codec: placeCodec, value: placeValueSchema, search }),
    placeRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("place")}`, placeCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".place', "tables"), alias, create_placeFields(geometry), "named"),
    place_lookupCodec,
    place_lookupField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.place_lookup", type: "place_lookup", codec: place_lookupCodec, value: place_lookupValueSchema, search }),
    place_lookupRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("place_lookup")}`, place_lookupCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".place_lookup', "tables"), alias, create_place_lookupFields(), "named"),
    secondary_unit_lookupCodec,
    secondary_unit_lookupField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.secondary_unit_lookup", type: "secondary_unit_lookup", codec: secondary_unit_lookupCodec, value: secondary_unit_lookupValueSchema, search }),
    secondary_unit_lookupRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("secondary_unit_lookup")}`, secondary_unit_lookupCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".secondary_unit_lookup', "tables"), alias, create_secondary_unit_lookupFields(), "named"),
    stateCodec,
    stateField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.state", type: "state", codec: stateCodec, value: stateValueSchema, search }),
    stateRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("state")}`, stateCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".state', "tables"), alias, create_stateFields(geometry), "named"),
    state_lookupCodec,
    state_lookupField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.state_lookup", type: "state_lookup", codec: state_lookupCodec, value: state_lookupValueSchema, search }),
    state_lookupRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("state_lookup")}`, state_lookupCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".state_lookup', "tables"), alias, create_state_lookupFields(), "named"),
    street_type_lookupCodec,
    street_type_lookupField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.street_type_lookup", type: "street_type_lookup", codec: street_type_lookupCodec, value: street_type_lookupValueSchema, search }),
    street_type_lookupRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("street_type_lookup")}`, street_type_lookupCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".street_type_lookup', "tables"), alias, create_street_type_lookupFields(), "named"),
    tabblockCodec,
    tabblockField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.tabblock", type: "tabblock", codec: tabblockCodec, value: tabblockValueSchema, search }),
    tabblockRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("tabblock")}`, tabblockCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".tabblock', "tables"), alias, create_tabblockFields(geometry), "named"),
    tabblock20Codec,
    tabblock20Field: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.tabblock20", type: "tabblock20", codec: tabblock20Codec, value: tabblock20ValueSchema, search }),
    tabblock20Rows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("tabblock20")}`, tabblock20Codec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".tabblock20', "tables"), alias, create_tabblock20Fields(geometry), "named"),
    tractCodec,
    tractField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.tract", type: "tract", codec: tractCodec, value: tractValueSchema, search }),
    tractRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("tract")}`, tractCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".tract', "tables"), alias, create_tractFields(geometry), "named"),
    zcta5Codec,
    zcta5Field: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.zcta5", type: "zcta5", codec: zcta5Codec, value: zcta5ValueSchema, search }),
    zcta5Rows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("zcta5")}`, zcta5Codec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".zcta5', "tables"), alias, create_zcta5Fields(geometry), "named"),
    zip_lookupCodec,
    zip_lookupField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.zip_lookup", type: "zip_lookup", codec: zip_lookupCodec, value: zip_lookupValueSchema, search }),
    zip_lookupRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("zip_lookup")}`, zip_lookupCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".zip_lookup', "tables"), alias, create_zip_lookupFields(), "named"),
    zip_lookup_allCodec,
    zip_lookup_allField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.zip_lookup_all", type: "zip_lookup_all", codec: zip_lookup_allCodec, value: zip_lookup_allValueSchema, search }),
    zip_lookup_allRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("zip_lookup_all")}`, zip_lookup_allCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".zip_lookup_all', "tables"), alias, create_zip_lookup_allFields(), "named"),
    zip_lookup_baseCodec,
    zip_lookup_baseField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.zip_lookup_base", type: "zip_lookup_base", codec: zip_lookup_baseCodec, value: zip_lookup_baseValueSchema, search }),
    zip_lookup_baseRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("zip_lookup_base")}`, zip_lookup_baseCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".zip_lookup_base', "tables"), alias, create_zip_lookup_baseFields(), "named"),
    zip_stateCodec,
    zip_stateField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.zip_state", type: "zip_state", codec: zip_stateCodec, value: zip_stateValueSchema, search }),
    zip_stateRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("zip_state")}`, zip_stateCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".zip_state', "tables"), alias, create_zip_stateFields(), "named"),
    zip_state_locCodec,
    zip_state_locField: () => createExtensionField({ extension: descriptor, member: "type:$extension:postgis_tiger_geocoder.zip_state_loc", type: "zip_state_loc", codec: zip_state_locCodec, value: zip_state_locValueSchema, search }),
    zip_state_locRows: (alias: string) => extensionRows(checkedExtensionExpression(sql`${sql.identifier(schema)}.${sql.identifier("zip_state_loc")}`, zip_state_locCodec, [], undefined, 'table:"$extension:postgis_tiger_geocoder".zip_state_loc', "tables"), alias, create_zip_state_locFields(), "named"),
    sql: Object.freeze({ functions, operators: Object.freeze({}), overloads, types }),
  });
}
export type PostgisTigerGeocoderApi = ReturnType<typeof createPostgisTigerGeocoder_3_6_4>;
