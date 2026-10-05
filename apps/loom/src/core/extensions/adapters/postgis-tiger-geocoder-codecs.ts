import * as v from "valibot";
import { arrayCodec, compositeCodec, createExtensionCodec, floatCodec, integerCodec, nullableCodec, numericCodec, textCodec, withCodecSqlType, type CompositeOutput, type PostgreSqlArray } from "../codecs";
import { int4Codec } from "../native-codecs";
import type { ExtensionValueSchema } from "../fields";
export type { PostgreSqlArray };
export const POSTGIS_TIGER_GEOCODER_DIGEST = "8afcc1fb470670f2a40780b473a8e35afe9172eb79cc8bab7391732503bfd966";
export const postgisTigerGeocoderNormAddyFields = ["address", "predirabbrev", "streetname", "streettypeabbrev", "postdirabbrev", "internal", "location", "stateabbrev", "zip", "parsed", "zip4", "address_alphanumeric"] as const;
export type PostgisTigerGeocoderNormAddyField = (typeof postgisTigerGeocoderNormAddyFields)[number];
export type PostgisTigerGeocoderNormAddy = {
  readonly address: number | null;
  readonly predirabbrev: string | null;
  readonly streetname: string | null;
  readonly streettypeabbrev: string | null;
  readonly postdirabbrev: string | null;
  readonly internal: string | null;
  readonly location: string | null;
  readonly stateabbrev: string | null;
  readonly zip: string | null;
  readonly parsed: boolean | null;
  readonly zip4: string | null;
  readonly address_alphanumeric: string | null;
};
const nullableText = nullableCodec(textCodec);
const nullableInt4 = nullableCodec(int4Codec);
const recordBoolean = createExtensionCodec({
  id: "pg:bool:record-text:1",
  sqlType: { schema: "pg_catalog", name: "bool" },
  input: v.boolean(),
  output: v.boolean(),
  transport: "text",
  encode: (value) => (value ? "t" : "f"),
  decode(value) {
    if (value === "t" || value === "true") return true;
    if (value === "f" || value === "false") return false;
    if (typeof value === "boolean") return value;
    throw new Error("Invalid PostgreSQL boolean");
  },
});
const nullableBool = nullableCodec(recordBoolean);
export const postgisTigerGeocoderVoidCodec = createExtensionCodec({ id: "pg:void:1", sqlType: { schema: "pg_catalog", name: "void" }, input: v.null(), output: v.null(), transport: "text", encode: () => null, decode: (value) => (value === "" ? null : value) });
export function createTigerGeometryCodec(schema: string) {
  return withCodecSqlType(createExtensionCodec({ id: "postgis_tiger_geocoder:postgis-geometry-ewkt:1", sqlType: { schema, name: "geometry" }, input: v.string(), output: v.string(), transport: "text", encode: (value) => value, decode: (value) => { if (typeof value === "string") return value; throw new Error("postgis_tiger_geocoder geometry requires native text/EWKT; binary geometry decoding is the postgis adapter contract"); } }), { schema, name: "geometry" });
}
const normAddyFieldCodecs = Object.freeze({
  address: nullableInt4,
  predirabbrev: nullableText,
  streetname: nullableText,
  streettypeabbrev: nullableText,
  postdirabbrev: nullableText,
  internal: nullableText,
  location: nullableText,
  stateabbrev: nullableText,
  zip: nullableText,
  parsed: nullableBool,
  zip4: nullableText,
  address_alphanumeric: nullableText,
});
export function createNormAddyCodec(schema: string) {
  return withCodecSqlType(compositeCodec("postgis_tiger_geocoder:norm_addy", normAddyFieldCodecs), { schema, name: "norm_addy" });
}
export function createNormAddyArrayCodec(schema: string) {
  return withCodecSqlType(arrayCodec(createNormAddyCodec(schema)), { schema, name: "norm_addy", array: true });
}
const nullableString: ExtensionValueSchema = { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] };
const nullableNumber: ExtensionValueSchema = { kind: "union", variants: [{ kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 }, { kind: "null" }] };
const nullableBoolean: ExtensionValueSchema = { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] };
export const normAddyValueSchema: ExtensionValueSchema = { kind: "object", properties: { address: nullableNumber, predirabbrev: nullableString, streetname: nullableString, streettypeabbrev: nullableString, postdirabbrev: nullableString, internal: nullableString, location: nullableString, stateabbrev: nullableString, zip: nullableString, parsed: nullableBoolean, zip4: nullableString, address_alphanumeric: nullableString } };
export function createGeocodeRecordCodec(schema: string, postgisSchema: string) {
  const fields = Object.freeze({ addy: nullableCodec(createNormAddyCodec(schema)), geomout: nullableCodec(createTigerGeometryCodec(postgisSchema)), rating: nullableInt4 });
  return { fields, codec: withCodecSqlType(compositeCodec("postgis_tiger_geocoder:geocode-record", fields), { schema: "pg_catalog", name: "record" }) };
}
export function createReverseGeocodeRecordCodec(schema: string, postgisSchema: string) {
  const fields = Object.freeze({ intpt: nullableCodec(arrayCodec(createTigerGeometryCodec(postgisSchema))), addy: nullableCodec(createNormAddyArrayCodec(schema)), street: nullableCodec(arrayCodec(textCodec)) });
  return { fields, codec: withCodecSqlType(compositeCodec("postgis_tiger_geocoder:reverse-geocode-record", fields), { schema: "pg_catalog", name: "record" }) };
}
export function create_addrFields() {
  return Object.freeze({
  gid: nullableInt4,
  tlid: nullableCodec(integerCodec),
  fromhn: nullableText,
  tohn: nullableText,
  side: nullableText,
  zip: nullableText,
  plus4: nullableText,
  fromtyp: nullableText,
  totyp: nullableText,
  fromarmid: nullableInt4,
  toarmid: nullableInt4,
  arid: nullableText,
  mtfcc: nullableText,
  statefp: nullableText,
  });
}
export function create_addrCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:addr`, create_addrFields()), { schema, name: "addr" });
}
export const addrValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  gid: nullableNumber,
  tlid: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] },
  fromhn: nullableString,
  tohn: nullableString,
  side: nullableString,
  zip: nullableString,
  plus4: nullableString,
  fromtyp: nullableString,
  totyp: nullableString,
  fromarmid: nullableNumber,
  toarmid: nullableNumber,
  arid: nullableString,
  mtfcc: nullableString,
  statefp: nullableString
} };
export type AddrRow = CompositeOutput<ReturnType<typeof create_addrFields>>;
export function create_addrfeatFields(geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return Object.freeze({
  gid: nullableInt4,
  tlid: nullableCodec(integerCodec),
  statefp: nullableText,
  aridl: nullableText,
  aridr: nullableText,
  linearid: nullableText,
  fullname: nullableText,
  lfromhn: nullableText,
  ltohn: nullableText,
  rfromhn: nullableText,
  rtohn: nullableText,
  zipl: nullableText,
  zipr: nullableText,
  edge_mtfcc: nullableText,
  parityl: nullableText,
  parityr: nullableText,
  plus4l: nullableText,
  plus4r: nullableText,
  lfromtyp: nullableText,
  ltotyp: nullableText,
  rfromtyp: nullableText,
  rtotyp: nullableText,
  offsetl: nullableText,
  offsetr: nullableText,
  the_geom: geometryCodec,
  });
}
export function create_addrfeatCodec(schema: string, geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:addrfeat`, create_addrfeatFields(geometryCodec)), { schema, name: "addrfeat" });
}
export const addrfeatValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  gid: nullableNumber,
  tlid: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] },
  statefp: nullableString,
  aridl: nullableString,
  aridr: nullableString,
  linearid: nullableString,
  fullname: nullableString,
  lfromhn: nullableString,
  ltohn: nullableString,
  rfromhn: nullableString,
  rtohn: nullableString,
  zipl: nullableString,
  zipr: nullableString,
  edge_mtfcc: nullableString,
  parityl: nullableString,
  parityr: nullableString,
  plus4l: nullableString,
  plus4r: nullableString,
  lfromtyp: nullableString,
  ltotyp: nullableString,
  rfromtyp: nullableString,
  rtotyp: nullableString,
  offsetl: nullableString,
  offsetr: nullableString,
  the_geom: nullableString
} };
export type AddrfeatRow = CompositeOutput<ReturnType<typeof create_addrfeatFields>>;
export function create_bgFields(geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return Object.freeze({
  gid: nullableInt4,
  statefp: nullableText,
  countyfp: nullableText,
  tractce: nullableText,
  blkgrpce: nullableText,
  bg_id: nullableText,
  namelsad: nullableText,
  mtfcc: nullableText,
  funcstat: nullableText,
  aland: nullableCodec(floatCodec),
  awater: nullableCodec(floatCodec),
  intptlat: nullableText,
  intptlon: nullableText,
  the_geom: geometryCodec,
  });
}
export function create_bgCodec(schema: string, geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:bg`, create_bgFields(geometryCodec)), { schema, name: "bg" });
}
export const bgValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  gid: nullableNumber,
  statefp: nullableString,
  countyfp: nullableString,
  tractce: nullableString,
  blkgrpce: nullableString,
  bg_id: nullableString,
  namelsad: nullableString,
  mtfcc: nullableString,
  funcstat: nullableString,
  aland: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
  awater: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
  intptlat: nullableString,
  intptlon: nullableString,
  the_geom: nullableString
} };
export type BgRow = CompositeOutput<ReturnType<typeof create_bgFields>>;
export function create_countyFields(geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return Object.freeze({
  gid: nullableInt4,
  statefp: nullableText,
  countyfp: nullableText,
  countyns: nullableText,
  cntyidfp: nullableText,
  name: nullableText,
  namelsad: nullableText,
  lsad: nullableText,
  classfp: nullableText,
  mtfcc: nullableText,
  csafp: nullableText,
  cbsafp: nullableText,
  metdivfp: nullableText,
  funcstat: nullableText,
  aland: nullableCodec(integerCodec),
  awater: nullableCodec(floatCodec),
  intptlat: nullableText,
  intptlon: nullableText,
  the_geom: geometryCodec,
  });
}
export function create_countyCodec(schema: string, geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:county`, create_countyFields(geometryCodec)), { schema, name: "county" });
}
export const countyValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  gid: nullableNumber,
  statefp: nullableString,
  countyfp: nullableString,
  countyns: nullableString,
  cntyidfp: nullableString,
  name: nullableString,
  namelsad: nullableString,
  lsad: nullableString,
  classfp: nullableString,
  mtfcc: nullableString,
  csafp: nullableString,
  cbsafp: nullableString,
  metdivfp: nullableString,
  funcstat: nullableString,
  aland: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] },
  awater: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
  intptlat: nullableString,
  intptlon: nullableString,
  the_geom: nullableString
} };
export type CountyRow = CompositeOutput<ReturnType<typeof create_countyFields>>;
export function create_county_lookupFields() {
  return Object.freeze({
  st_code: nullableInt4,
  state: nullableText,
  co_code: nullableInt4,
  name: nullableText,
  });
}
export function create_county_lookupCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:county_lookup`, create_county_lookupFields()), { schema, name: "county_lookup" });
}
export const county_lookupValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  st_code: nullableNumber,
  state: nullableString,
  co_code: nullableNumber,
  name: nullableString
} };
export type CountyLookupRow = CompositeOutput<ReturnType<typeof create_county_lookupFields>>;
export function create_countysub_lookupFields() {
  return Object.freeze({
  st_code: nullableInt4,
  state: nullableText,
  co_code: nullableInt4,
  county: nullableText,
  cs_code: nullableInt4,
  name: nullableText,
  });
}
export function create_countysub_lookupCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:countysub_lookup`, create_countysub_lookupFields()), { schema, name: "countysub_lookup" });
}
export const countysub_lookupValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  st_code: nullableNumber,
  state: nullableString,
  co_code: nullableNumber,
  county: nullableString,
  cs_code: nullableNumber,
  name: nullableString
} };
export type CountysubLookupRow = CompositeOutput<ReturnType<typeof create_countysub_lookupFields>>;
export function create_cousubFields(geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return Object.freeze({
  gid: nullableInt4,
  statefp: nullableText,
  countyfp: nullableText,
  cousubfp: nullableText,
  cousubns: nullableText,
  cosbidfp: nullableText,
  name: nullableText,
  namelsad: nullableText,
  lsad: nullableText,
  classfp: nullableText,
  mtfcc: nullableText,
  cnectafp: nullableText,
  nectafp: nullableText,
  nctadvfp: nullableText,
  funcstat: nullableText,
  aland: nullableCodec(numericCodec),
  awater: nullableCodec(numericCodec),
  intptlat: nullableText,
  intptlon: nullableText,
  the_geom: geometryCodec,
  });
}
export function create_cousubCodec(schema: string, geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:cousub`, create_cousubFields(geometryCodec)), { schema, name: "cousub" });
}
export const cousubValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  gid: nullableNumber,
  statefp: nullableString,
  countyfp: nullableString,
  cousubfp: nullableString,
  cousubns: nullableString,
  cosbidfp: nullableString,
  name: nullableString,
  namelsad: nullableString,
  lsad: nullableString,
  classfp: nullableString,
  mtfcc: nullableString,
  cnectafp: nullableString,
  nectafp: nullableString,
  nctadvfp: nullableString,
  funcstat: nullableString,
  aland: nullableString,
  awater: nullableString,
  intptlat: nullableString,
  intptlon: nullableString,
  the_geom: nullableString
} };
export type CousubRow = CompositeOutput<ReturnType<typeof create_cousubFields>>;
export function create_direction_lookupFields() {
  return Object.freeze({
  name: nullableText,
  abbrev: nullableText,
  });
}
export function create_direction_lookupCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:direction_lookup`, create_direction_lookupFields()), { schema, name: "direction_lookup" });
}
export const direction_lookupValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  name: nullableString,
  abbrev: nullableString
} };
export type DirectionLookupRow = CompositeOutput<ReturnType<typeof create_direction_lookupFields>>;
export function create_edgesFields(geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return Object.freeze({
  gid: nullableInt4,
  statefp: nullableText,
  countyfp: nullableText,
  tlid: nullableCodec(integerCodec),
  tfidl: nullableCodec(numericCodec),
  tfidr: nullableCodec(numericCodec),
  mtfcc: nullableText,
  fullname: nullableText,
  smid: nullableText,
  lfromadd: nullableText,
  ltoadd: nullableText,
  rfromadd: nullableText,
  rtoadd: nullableText,
  zipl: nullableText,
  zipr: nullableText,
  featcat: nullableText,
  hydroflg: nullableText,
  railflg: nullableText,
  roadflg: nullableText,
  olfflg: nullableText,
  passflg: nullableText,
  divroad: nullableText,
  exttyp: nullableText,
  ttyp: nullableText,
  deckedroad: nullableText,
  artpath: nullableText,
  persist: nullableText,
  gcseflg: nullableText,
  offsetl: nullableText,
  offsetr: nullableText,
  tnidf: nullableCodec(numericCodec),
  tnidt: nullableCodec(numericCodec),
  the_geom: geometryCodec,
  });
}
export function create_edgesCodec(schema: string, geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:edges`, create_edgesFields(geometryCodec)), { schema, name: "edges" });
}
export const edgesValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  gid: nullableNumber,
  statefp: nullableString,
  countyfp: nullableString,
  tlid: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] },
  tfidl: nullableString,
  tfidr: nullableString,
  mtfcc: nullableString,
  fullname: nullableString,
  smid: nullableString,
  lfromadd: nullableString,
  ltoadd: nullableString,
  rfromadd: nullableString,
  rtoadd: nullableString,
  zipl: nullableString,
  zipr: nullableString,
  featcat: nullableString,
  hydroflg: nullableString,
  railflg: nullableString,
  roadflg: nullableString,
  olfflg: nullableString,
  passflg: nullableString,
  divroad: nullableString,
  exttyp: nullableString,
  ttyp: nullableString,
  deckedroad: nullableString,
  artpath: nullableString,
  persist: nullableString,
  gcseflg: nullableString,
  offsetl: nullableString,
  offsetr: nullableString,
  tnidf: nullableString,
  tnidt: nullableString,
  the_geom: nullableString
} };
export type EdgesRow = CompositeOutput<ReturnType<typeof create_edgesFields>>;
export function create_facesFields(geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return Object.freeze({
  gid: nullableInt4,
  tfid: nullableCodec(numericCodec),
  statefp00: nullableText,
  countyfp00: nullableText,
  tractce00: nullableText,
  blkgrpce00: nullableText,
  blockce00: nullableText,
  cousubfp00: nullableText,
  submcdfp00: nullableText,
  conctyfp00: nullableText,
  placefp00: nullableText,
  aiannhfp00: nullableText,
  aiannhce00: nullableText,
  comptyp00: nullableText,
  trsubfp00: nullableText,
  trsubce00: nullableText,
  anrcfp00: nullableText,
  elsdlea00: nullableText,
  scsdlea00: nullableText,
  unsdlea00: nullableText,
  uace00: nullableText,
  cd108fp: nullableText,
  sldust00: nullableText,
  sldlst00: nullableText,
  vtdst00: nullableText,
  zcta5ce00: nullableText,
  tazce00: nullableText,
  ugace00: nullableText,
  puma5ce00: nullableText,
  statefp: nullableText,
  countyfp: nullableText,
  tractce: nullableText,
  blkgrpce: nullableText,
  blockce: nullableText,
  cousubfp: nullableText,
  submcdfp: nullableText,
  conctyfp: nullableText,
  placefp: nullableText,
  aiannhfp: nullableText,
  aiannhce: nullableText,
  comptyp: nullableText,
  trsubfp: nullableText,
  trsubce: nullableText,
  anrcfp: nullableText,
  ttractce: nullableText,
  tblkgpce: nullableText,
  elsdlea: nullableText,
  scsdlea: nullableText,
  unsdlea: nullableText,
  uace: nullableText,
  cd111fp: nullableText,
  sldust: nullableText,
  sldlst: nullableText,
  vtdst: nullableText,
  zcta5ce: nullableText,
  tazce: nullableText,
  ugace: nullableText,
  puma5ce: nullableText,
  csafp: nullableText,
  cbsafp: nullableText,
  metdivfp: nullableText,
  cnectafp: nullableText,
  nectafp: nullableText,
  nctadvfp: nullableText,
  lwflag: nullableText,
  offset: nullableText,
  atotal: nullableCodec(floatCodec),
  intptlat: nullableText,
  intptlon: nullableText,
  the_geom: geometryCodec,
  tractce20: nullableText,
  blkgrpce20: nullableText,
  blockce20: nullableText,
  countyfp20: nullableText,
  statefp20: nullableText,
  });
}
export function create_facesCodec(schema: string, geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:faces`, create_facesFields(geometryCodec)), { schema, name: "faces" });
}
export const facesValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  gid: nullableNumber,
  tfid: nullableString,
  statefp00: nullableString,
  countyfp00: nullableString,
  tractce00: nullableString,
  blkgrpce00: nullableString,
  blockce00: nullableString,
  cousubfp00: nullableString,
  submcdfp00: nullableString,
  conctyfp00: nullableString,
  placefp00: nullableString,
  aiannhfp00: nullableString,
  aiannhce00: nullableString,
  comptyp00: nullableString,
  trsubfp00: nullableString,
  trsubce00: nullableString,
  anrcfp00: nullableString,
  elsdlea00: nullableString,
  scsdlea00: nullableString,
  unsdlea00: nullableString,
  uace00: nullableString,
  cd108fp: nullableString,
  sldust00: nullableString,
  sldlst00: nullableString,
  vtdst00: nullableString,
  zcta5ce00: nullableString,
  tazce00: nullableString,
  ugace00: nullableString,
  puma5ce00: nullableString,
  statefp: nullableString,
  countyfp: nullableString,
  tractce: nullableString,
  blkgrpce: nullableString,
  blockce: nullableString,
  cousubfp: nullableString,
  submcdfp: nullableString,
  conctyfp: nullableString,
  placefp: nullableString,
  aiannhfp: nullableString,
  aiannhce: nullableString,
  comptyp: nullableString,
  trsubfp: nullableString,
  trsubce: nullableString,
  anrcfp: nullableString,
  ttractce: nullableString,
  tblkgpce: nullableString,
  elsdlea: nullableString,
  scsdlea: nullableString,
  unsdlea: nullableString,
  uace: nullableString,
  cd111fp: nullableString,
  sldust: nullableString,
  sldlst: nullableString,
  vtdst: nullableString,
  zcta5ce: nullableString,
  tazce: nullableString,
  ugace: nullableString,
  puma5ce: nullableString,
  csafp: nullableString,
  cbsafp: nullableString,
  metdivfp: nullableString,
  cnectafp: nullableString,
  nectafp: nullableString,
  nctadvfp: nullableString,
  lwflag: nullableString,
  offset: nullableString,
  atotal: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
  intptlat: nullableString,
  intptlon: nullableString,
  the_geom: nullableString,
  tractce20: nullableString,
  blkgrpce20: nullableString,
  blockce20: nullableString,
  countyfp20: nullableString,
  statefp20: nullableString
} };
export type FacesRow = CompositeOutput<ReturnType<typeof create_facesFields>>;
export function create_featnamesFields() {
  return Object.freeze({
  gid: nullableInt4,
  tlid: nullableCodec(integerCodec),
  fullname: nullableText,
  name: nullableText,
  predirabrv: nullableText,
  pretypabrv: nullableText,
  prequalabr: nullableText,
  sufdirabrv: nullableText,
  suftypabrv: nullableText,
  sufqualabr: nullableText,
  predir: nullableText,
  pretyp: nullableText,
  prequal: nullableText,
  sufdir: nullableText,
  suftyp: nullableText,
  sufqual: nullableText,
  linearid: nullableText,
  mtfcc: nullableText,
  paflag: nullableText,
  statefp: nullableText,
  });
}
export function create_featnamesCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:featnames`, create_featnamesFields()), { schema, name: "featnames" });
}
export const featnamesValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  gid: nullableNumber,
  tlid: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] },
  fullname: nullableString,
  name: nullableString,
  predirabrv: nullableString,
  pretypabrv: nullableString,
  prequalabr: nullableString,
  sufdirabrv: nullableString,
  suftypabrv: nullableString,
  sufqualabr: nullableString,
  predir: nullableString,
  pretyp: nullableString,
  prequal: nullableString,
  sufdir: nullableString,
  suftyp: nullableString,
  sufqual: nullableString,
  linearid: nullableString,
  mtfcc: nullableString,
  paflag: nullableString,
  statefp: nullableString
} };
export type FeatnamesRow = CompositeOutput<ReturnType<typeof create_featnamesFields>>;
export function create_geocode_settingsFields() {
  return Object.freeze({
  name: nullableText,
  setting: nullableText,
  unit: nullableText,
  category: nullableText,
  short_desc: nullableText,
  });
}
export function create_geocode_settingsCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:geocode_settings`, create_geocode_settingsFields()), { schema, name: "geocode_settings" });
}
export const geocode_settingsValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  name: nullableString,
  setting: nullableString,
  unit: nullableString,
  category: nullableString,
  short_desc: nullableString
} };
export type GeocodeSettingsRow = CompositeOutput<ReturnType<typeof create_geocode_settingsFields>>;
export function create_geocode_settings_defaultFields() {
  return Object.freeze({
  name: nullableText,
  setting: nullableText,
  unit: nullableText,
  category: nullableText,
  short_desc: nullableText,
  });
}
export function create_geocode_settings_defaultCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:geocode_settings_default`, create_geocode_settings_defaultFields()), { schema, name: "geocode_settings_default" });
}
export const geocode_settings_defaultValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  name: nullableString,
  setting: nullableString,
  unit: nullableString,
  category: nullableString,
  short_desc: nullableString
} };
export type GeocodeSettingsDefaultRow = CompositeOutput<ReturnType<typeof create_geocode_settings_defaultFields>>;
export function create_loader_lookuptablesFields() {
  return Object.freeze({
  process_order: nullableInt4,
  lookup_name: nullableText,
  table_name: nullableText,
  single_mode: nullableBool,
  load: nullableBool,
  level_county: nullableBool,
  level_state: nullableBool,
  level_nation: nullableBool,
  post_load_process: nullableText,
  single_geom_mode: nullableBool,
  insert_mode: nullableText,
  pre_load_process: nullableText,
  columns_exclude: nullableCodec(arrayCodec(textCodec)),
  website_root_override: nullableText,
  });
}
export function create_loader_lookuptablesCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:loader_lookuptables`, create_loader_lookuptablesFields()), { schema, name: "loader_lookuptables" });
}
export const loader_lookuptablesValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  process_order: nullableNumber,
  lookup_name: nullableString,
  table_name: nullableString,
  single_mode: nullableBoolean,
  load: nullableBoolean,
  level_county: nullableBoolean,
  level_state: nullableBoolean,
  level_nation: nullableBoolean,
  post_load_process: nullableString,
  single_geom_mode: nullableBoolean,
  insert_mode: nullableString,
  pre_load_process: nullableString,
  columns_exclude: { kind: "union", variants: [{ kind: "array", items: { kind: "string" } }, { kind: "null" }] },
  website_root_override: nullableString
} };
export type LoaderLookuptablesRow = CompositeOutput<ReturnType<typeof create_loader_lookuptablesFields>>;
export function create_loader_platformFields() {
  return Object.freeze({
  os: nullableText,
  declare_sect: nullableText,
  pgbin: nullableText,
  wget: nullableText,
  unzip_command: nullableText,
  psql: nullableText,
  path_sep: nullableText,
  loader: nullableText,
  environ_set_command: nullableText,
  county_process_command: nullableText,
  });
}
export function create_loader_platformCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:loader_platform`, create_loader_platformFields()), { schema, name: "loader_platform" });
}
export const loader_platformValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  os: nullableString,
  declare_sect: nullableString,
  pgbin: nullableString,
  wget: nullableString,
  unzip_command: nullableString,
  psql: nullableString,
  path_sep: nullableString,
  loader: nullableString,
  environ_set_command: nullableString,
  county_process_command: nullableString
} };
export type LoaderPlatformRow = CompositeOutput<ReturnType<typeof create_loader_platformFields>>;
export function create_loader_variablesFields() {
  return Object.freeze({
  tiger_year: nullableText,
  website_root: nullableText,
  staging_fold: nullableText,
  data_schema: nullableText,
  staging_schema: nullableText,
  });
}
export function create_loader_variablesCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:loader_variables`, create_loader_variablesFields()), { schema, name: "loader_variables" });
}
export const loader_variablesValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  tiger_year: nullableString,
  website_root: nullableString,
  staging_fold: nullableString,
  data_schema: nullableString,
  staging_schema: nullableString
} };
export type LoaderVariablesRow = CompositeOutput<ReturnType<typeof create_loader_variablesFields>>;
export function create_pagc_gazFields() {
  return Object.freeze({
  id: nullableInt4,
  seq: nullableInt4,
  word: nullableText,
  stdword: nullableText,
  token: nullableInt4,
  is_custom: nullableBool,
  });
}
export function create_pagc_gazCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:pagc_gaz`, create_pagc_gazFields()), { schema, name: "pagc_gaz" });
}
export const pagc_gazValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  id: nullableNumber,
  seq: nullableNumber,
  word: nullableString,
  stdword: nullableString,
  token: nullableNumber,
  is_custom: nullableBoolean
} };
export type PagcGazRow = CompositeOutput<ReturnType<typeof create_pagc_gazFields>>;
export function create_pagc_lexFields() {
  return Object.freeze({
  id: nullableInt4,
  seq: nullableInt4,
  word: nullableText,
  stdword: nullableText,
  token: nullableInt4,
  is_custom: nullableBool,
  });
}
export function create_pagc_lexCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:pagc_lex`, create_pagc_lexFields()), { schema, name: "pagc_lex" });
}
export const pagc_lexValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  id: nullableNumber,
  seq: nullableNumber,
  word: nullableString,
  stdword: nullableString,
  token: nullableNumber,
  is_custom: nullableBoolean
} };
export type PagcLexRow = CompositeOutput<ReturnType<typeof create_pagc_lexFields>>;
export function create_pagc_rulesFields() {
  return Object.freeze({
  id: nullableInt4,
  rule: nullableText,
  is_custom: nullableBool,
  });
}
export function create_pagc_rulesCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:pagc_rules`, create_pagc_rulesFields()), { schema, name: "pagc_rules" });
}
export const pagc_rulesValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  id: nullableNumber,
  rule: nullableString,
  is_custom: nullableBoolean
} };
export type PagcRulesRow = CompositeOutput<ReturnType<typeof create_pagc_rulesFields>>;
export function create_placeFields(geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return Object.freeze({
  gid: nullableInt4,
  statefp: nullableText,
  placefp: nullableText,
  placens: nullableText,
  plcidfp: nullableText,
  name: nullableText,
  namelsad: nullableText,
  lsad: nullableText,
  classfp: nullableText,
  cpi: nullableText,
  pcicbsa: nullableText,
  pcinecta: nullableText,
  mtfcc: nullableText,
  funcstat: nullableText,
  aland: nullableCodec(integerCodec),
  awater: nullableCodec(integerCodec),
  intptlat: nullableText,
  intptlon: nullableText,
  the_geom: geometryCodec,
  });
}
export function create_placeCodec(schema: string, geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:place`, create_placeFields(geometryCodec)), { schema, name: "place" });
}
export const placeValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  gid: nullableNumber,
  statefp: nullableString,
  placefp: nullableString,
  placens: nullableString,
  plcidfp: nullableString,
  name: nullableString,
  namelsad: nullableString,
  lsad: nullableString,
  classfp: nullableString,
  cpi: nullableString,
  pcicbsa: nullableString,
  pcinecta: nullableString,
  mtfcc: nullableString,
  funcstat: nullableString,
  aland: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] },
  awater: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] },
  intptlat: nullableString,
  intptlon: nullableString,
  the_geom: nullableString
} };
export type PlaceRow = CompositeOutput<ReturnType<typeof create_placeFields>>;
export function create_place_lookupFields() {
  return Object.freeze({
  st_code: nullableInt4,
  state: nullableText,
  pl_code: nullableInt4,
  name: nullableText,
  });
}
export function create_place_lookupCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:place_lookup`, create_place_lookupFields()), { schema, name: "place_lookup" });
}
export const place_lookupValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  st_code: nullableNumber,
  state: nullableString,
  pl_code: nullableNumber,
  name: nullableString
} };
export type PlaceLookupRow = CompositeOutput<ReturnType<typeof create_place_lookupFields>>;
export function create_secondary_unit_lookupFields() {
  return Object.freeze({
  name: nullableText,
  abbrev: nullableText,
  });
}
export function create_secondary_unit_lookupCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:secondary_unit_lookup`, create_secondary_unit_lookupFields()), { schema, name: "secondary_unit_lookup" });
}
export const secondary_unit_lookupValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  name: nullableString,
  abbrev: nullableString
} };
export type SecondaryUnitLookupRow = CompositeOutput<ReturnType<typeof create_secondary_unit_lookupFields>>;
export function create_stateFields(geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return Object.freeze({
  gid: nullableInt4,
  region: nullableText,
  division: nullableText,
  statefp: nullableText,
  statens: nullableText,
  stusps: nullableText,
  name: nullableText,
  lsad: nullableText,
  mtfcc: nullableText,
  funcstat: nullableText,
  aland: nullableCodec(integerCodec),
  awater: nullableCodec(integerCodec),
  intptlat: nullableText,
  intptlon: nullableText,
  the_geom: geometryCodec,
  });
}
export function create_stateCodec(schema: string, geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:state`, create_stateFields(geometryCodec)), { schema, name: "state" });
}
export const stateValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  gid: nullableNumber,
  region: nullableString,
  division: nullableString,
  statefp: nullableString,
  statens: nullableString,
  stusps: nullableString,
  name: nullableString,
  lsad: nullableString,
  mtfcc: nullableString,
  funcstat: nullableString,
  aland: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] },
  awater: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] },
  intptlat: nullableString,
  intptlon: nullableString,
  the_geom: nullableString
} };
export type StateRow = CompositeOutput<ReturnType<typeof create_stateFields>>;
export function create_state_lookupFields() {
  return Object.freeze({
  st_code: nullableInt4,
  name: nullableText,
  abbrev: nullableText,
  statefp: nullableText,
  });
}
export function create_state_lookupCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:state_lookup`, create_state_lookupFields()), { schema, name: "state_lookup" });
}
export const state_lookupValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  st_code: nullableNumber,
  name: nullableString,
  abbrev: nullableString,
  statefp: nullableString
} };
export type StateLookupRow = CompositeOutput<ReturnType<typeof create_state_lookupFields>>;
export function create_street_type_lookupFields() {
  return Object.freeze({
  name: nullableText,
  abbrev: nullableText,
  is_hw: nullableBool,
  });
}
export function create_street_type_lookupCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:street_type_lookup`, create_street_type_lookupFields()), { schema, name: "street_type_lookup" });
}
export const street_type_lookupValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  name: nullableString,
  abbrev: nullableString,
  is_hw: nullableBoolean
} };
export type StreetTypeLookupRow = CompositeOutput<ReturnType<typeof create_street_type_lookupFields>>;
export function create_tabblockFields(geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return Object.freeze({
  gid: nullableInt4,
  statefp: nullableText,
  countyfp: nullableText,
  tractce: nullableText,
  blockce: nullableText,
  tabblock_id: nullableText,
  name: nullableText,
  mtfcc: nullableText,
  ur: nullableText,
  uace: nullableText,
  funcstat: nullableText,
  aland: nullableCodec(floatCodec),
  awater: nullableCodec(floatCodec),
  intptlat: nullableText,
  intptlon: nullableText,
  the_geom: geometryCodec,
  });
}
export function create_tabblockCodec(schema: string, geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:tabblock`, create_tabblockFields(geometryCodec)), { schema, name: "tabblock" });
}
export const tabblockValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  gid: nullableNumber,
  statefp: nullableString,
  countyfp: nullableString,
  tractce: nullableString,
  blockce: nullableString,
  tabblock_id: nullableString,
  name: nullableString,
  mtfcc: nullableString,
  ur: nullableString,
  uace: nullableString,
  funcstat: nullableString,
  aland: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
  awater: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
  intptlat: nullableString,
  intptlon: nullableString,
  the_geom: nullableString
} };
export type TabblockRow = CompositeOutput<ReturnType<typeof create_tabblockFields>>;
export function create_tabblock20Fields(geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return Object.freeze({
  statefp: nullableText,
  countyfp: nullableText,
  tractce: nullableText,
  blockce: nullableText,
  geoid: nullableText,
  name: nullableText,
  mtfcc: nullableText,
  ur: nullableText,
  uace: nullableText,
  uatype: nullableText,
  funcstat: nullableText,
  aland: nullableCodec(floatCodec),
  awater: nullableCodec(floatCodec),
  intptlat: nullableText,
  intptlon: nullableText,
  the_geom: geometryCodec,
  housing: nullableCodec(floatCodec),
  pop: nullableCodec(floatCodec),
  });
}
export function create_tabblock20Codec(schema: string, geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:tabblock20`, create_tabblock20Fields(geometryCodec)), { schema, name: "tabblock20" });
}
export const tabblock20ValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  statefp: nullableString,
  countyfp: nullableString,
  tractce: nullableString,
  blockce: nullableString,
  geoid: nullableString,
  name: nullableString,
  mtfcc: nullableString,
  ur: nullableString,
  uace: nullableString,
  uatype: nullableString,
  funcstat: nullableString,
  aland: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
  awater: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
  intptlat: nullableString,
  intptlon: nullableString,
  the_geom: nullableString,
  housing: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
  pop: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] }
} };
export type Tabblock20Row = CompositeOutput<ReturnType<typeof create_tabblock20Fields>>;
export function create_tractFields(geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return Object.freeze({
  gid: nullableInt4,
  statefp: nullableText,
  countyfp: nullableText,
  tractce: nullableText,
  tract_id: nullableText,
  name: nullableText,
  namelsad: nullableText,
  mtfcc: nullableText,
  funcstat: nullableText,
  aland: nullableCodec(floatCodec),
  awater: nullableCodec(floatCodec),
  intptlat: nullableText,
  intptlon: nullableText,
  the_geom: geometryCodec,
  });
}
export function create_tractCodec(schema: string, geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:tract`, create_tractFields(geometryCodec)), { schema, name: "tract" });
}
export const tractValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  gid: nullableNumber,
  statefp: nullableString,
  countyfp: nullableString,
  tractce: nullableString,
  tract_id: nullableString,
  name: nullableString,
  namelsad: nullableString,
  mtfcc: nullableString,
  funcstat: nullableString,
  aland: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
  awater: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
  intptlat: nullableString,
  intptlon: nullableString,
  the_geom: nullableString
} };
export type TractRow = CompositeOutput<ReturnType<typeof create_tractFields>>;
export function create_zcta5Fields(geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return Object.freeze({
  gid: nullableInt4,
  statefp: nullableText,
  zcta5ce: nullableText,
  classfp: nullableText,
  mtfcc: nullableText,
  funcstat: nullableText,
  aland: nullableCodec(floatCodec),
  awater: nullableCodec(floatCodec),
  intptlat: nullableText,
  intptlon: nullableText,
  partflg: nullableText,
  the_geom: geometryCodec,
  });
}
export function create_zcta5Codec(schema: string, geometryCodec: ReturnType<typeof createTigerGeometryCodec>) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:zcta5`, create_zcta5Fields(geometryCodec)), { schema, name: "zcta5" });
}
export const zcta5ValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  gid: nullableNumber,
  statefp: nullableString,
  zcta5ce: nullableString,
  classfp: nullableString,
  mtfcc: nullableString,
  funcstat: nullableString,
  aland: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
  awater: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
  intptlat: nullableString,
  intptlon: nullableString,
  partflg: nullableString,
  the_geom: nullableString
} };
export type Zcta5Row = CompositeOutput<ReturnType<typeof create_zcta5Fields>>;
export function create_zip_lookupFields() {
  return Object.freeze({
  zip: nullableInt4,
  st_code: nullableInt4,
  state: nullableText,
  co_code: nullableInt4,
  county: nullableText,
  cs_code: nullableInt4,
  cousub: nullableText,
  pl_code: nullableInt4,
  place: nullableText,
  cnt: nullableInt4,
  });
}
export function create_zip_lookupCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:zip_lookup`, create_zip_lookupFields()), { schema, name: "zip_lookup" });
}
export const zip_lookupValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  zip: nullableNumber,
  st_code: nullableNumber,
  state: nullableString,
  co_code: nullableNumber,
  county: nullableString,
  cs_code: nullableNumber,
  cousub: nullableString,
  pl_code: nullableNumber,
  place: nullableString,
  cnt: nullableNumber
} };
export type ZipLookupRow = CompositeOutput<ReturnType<typeof create_zip_lookupFields>>;
export function create_zip_lookup_allFields() {
  return Object.freeze({
  zip: nullableInt4,
  st_code: nullableInt4,
  state: nullableText,
  co_code: nullableInt4,
  county: nullableText,
  cs_code: nullableInt4,
  cousub: nullableText,
  pl_code: nullableInt4,
  place: nullableText,
  cnt: nullableInt4,
  });
}
export function create_zip_lookup_allCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:zip_lookup_all`, create_zip_lookup_allFields()), { schema, name: "zip_lookup_all" });
}
export const zip_lookup_allValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  zip: nullableNumber,
  st_code: nullableNumber,
  state: nullableString,
  co_code: nullableNumber,
  county: nullableString,
  cs_code: nullableNumber,
  cousub: nullableString,
  pl_code: nullableNumber,
  place: nullableString,
  cnt: nullableNumber
} };
export type ZipLookupAllRow = CompositeOutput<ReturnType<typeof create_zip_lookup_allFields>>;
export function create_zip_lookup_baseFields() {
  return Object.freeze({
  zip: nullableText,
  state: nullableText,
  county: nullableText,
  city: nullableText,
  statefp: nullableText,
  });
}
export function create_zip_lookup_baseCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:zip_lookup_base`, create_zip_lookup_baseFields()), { schema, name: "zip_lookup_base" });
}
export const zip_lookup_baseValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  zip: nullableString,
  state: nullableString,
  county: nullableString,
  city: nullableString,
  statefp: nullableString
} };
export type ZipLookupBaseRow = CompositeOutput<ReturnType<typeof create_zip_lookup_baseFields>>;
export function create_zip_stateFields() {
  return Object.freeze({
  zip: nullableText,
  stusps: nullableText,
  statefp: nullableText,
  });
}
export function create_zip_stateCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:zip_state`, create_zip_stateFields()), { schema, name: "zip_state" });
}
export const zip_stateValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  zip: nullableString,
  stusps: nullableString,
  statefp: nullableString
} };
export type ZipStateRow = CompositeOutput<ReturnType<typeof create_zip_stateFields>>;
export function create_zip_state_locFields() {
  return Object.freeze({
  zip: nullableText,
  stusps: nullableText,
  statefp: nullableText,
  place: nullableText,
  });
}
export function create_zip_state_locCodec(schema: string) {
  return withCodecSqlType(compositeCodec(`postgis_tiger_geocoder:zip_state_loc`, create_zip_state_locFields()), { schema, name: "zip_state_loc" });
}
export const zip_state_locValueSchema: ExtensionValueSchema = { kind: "object", properties: {
  zip: nullableString,
  stusps: nullableString,
  statefp: nullableString,
  place: nullableString
} };
export type ZipStateLocRow = CompositeOutput<ReturnType<typeof create_zip_state_locFields>>;
