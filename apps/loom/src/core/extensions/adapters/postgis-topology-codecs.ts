import * as v from "valibot";
import {
  arrayCodec,
  booleanCodec,
  compositeCodec,
  createExtensionCodec,
  floatCodec,
  integerCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
  type CodecOutput,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import type { ExtensionValueSchema } from "../values";
import { createPostgisGeometryCodec } from "./postgis-codecs";
const voidCodec = createExtensionCodec({
  id: "pg:void:1",
  sqlType: { schema: "pg_catalog", name: "void" },
  input: v.null(),
  output: v.null(),
  transport: "text",
  encode: () => null,
  decode: () => null,
});
export function postgresTopologyArrayValue(element: ExtensionValueSchema): ExtensionValueSchema {
  let values: ExtensionValueSchema = { kind: "array", items: { kind: "union", variants: [element, { kind: "null" }] } };
  const ranks: ExtensionValueSchema[] = [values];
  for (let rank = 2; rank <= 6; rank++) {
    values = { kind: "array", items: values };
    ranks.push(values);
  }
  return {
    kind: "object",
    properties: {
      dimensions: {
        kind: "array",
        items: {
          kind: "object",
          properties: {
            lowerBound: { kind: "number", integer: true },
            length: { kind: "number", integer: true, minimum: 0 },
          },
        },
      },
      values: { kind: "union", variants: ranks },
    },
  };
}
/** Native domains use PostgreSQL's captured constraints; no graph or domain algorithms run in JS. */
export function createPostgisTopologyCodecs(schema: string, postgisSchema: string) {
  const c0 = int4Codec;
  const c1 = integerCodec;
  const getfaceedges_returntypeFields = Object.freeze({ sequence: nullableCodec(c0), edge: nullableCodec(c1) });
  const c2 = withCodecSqlType(
    compositeCodec("postgis_topology:getfaceedges_returntype:3.6.4", getfaceedges_returntypeFields),
    { schema, name: "getfaceedges_returntype" },
  );
  const c3 = withCodecSqlType(arrayCodec(c2), { schema, name: "getfaceedges_returntype", array: true });
  const c4 = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "varchar" });
  const layerFields = Object.freeze({
    topology_id: nullableCodec(c0),
    layer_id: nullableCodec(c0),
    schema_name: nullableCodec(c4),
    table_name: nullableCodec(c4),
    feature_column: nullableCodec(c4),
    feature_type: nullableCodec(c0),
    level: nullableCodec(c0),
    child_id: nullableCodec(c0),
  });
  const c5 = withCodecSqlType(compositeCodec("postgis_topology:layer:3.6.4", layerFields), { schema, name: "layer" });
  const c6 = withCodecSqlType(arrayCodec(c5), { schema, name: "layer", array: true });
  const c7 = arrayCodec(integerCodec);
  const c8 = withCodecSqlType(c7, { schema, name: "topoelement" });
  const c9 = withCodecSqlType(arrayCodec(c8), { schema, name: "topoelement", array: true });
  const c10 = withCodecSqlType(c7, { schema, name: "topoelementarray" });
  const c11 = withCodecSqlType(arrayCodec(c10), { schema, name: "topoelementarray", array: true });
  const topogeometryFields = Object.freeze({
    topology_id: nullableCodec(c0),
    layer_id: nullableCodec(c0),
    id: nullableCodec(c1),
    type: nullableCodec(c0),
  });
  const c12 = withCodecSqlType(compositeCodec("postgis_topology:topogeometry:3.6.4", topogeometryFields), {
    schema,
    name: "topogeometry",
  });
  const c13 = withCodecSqlType(arrayCodec(c12), { schema, name: "topogeometry", array: true });
  const c14 = floatCodec;
  const c15 = booleanCodec;
  const topologyFields = Object.freeze({
    id: nullableCodec(c0),
    name: nullableCodec(c4),
    srid: nullableCodec(c0),
    precision: nullableCodec(c14),
    hasz: nullableCodec(c15),
    useslargeids: nullableCodec(c15),
  });
  const c16 = withCodecSqlType(compositeCodec("postgis_topology:topology:3.6.4", topologyFields), {
    schema,
    name: "topology",
  });
  const c17 = withCodecSqlType(arrayCodec(c16), { schema, name: "topology", array: true });
  const validatetopology_returntypeFields = Object.freeze({
    error: nullableCodec(c4),
    id1: nullableCodec(c1),
    id2: nullableCodec(c1),
  });
  const c18 = withCodecSqlType(
    compositeCodec("postgis_topology:validatetopology_returntype:3.6.4", validatetopology_returntypeFields),
    { schema, name: "validatetopology_returntype" },
  );
  const c19 = withCodecSqlType(arrayCodec(c18), { schema, name: "validatetopology_returntype", array: true });
  const c20 = createPostgisGeometryCodec(postgisSchema);
  const c21 = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "name" });
  const c22 = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "regclass" });
  const c23 = textCodec;
  const c24 = voidCodec;
  const populate_topology_layerFields = Object.freeze({
    schema_name: nullableCodec(c23),
    table_name: nullableCodec(c23),
    feature_column: nullableCodec(c23),
  });
  const populate_topology_layerResult = compositeCodec(
    "postgis_topology:populate_topology_layer:3.6.4",
    populate_topology_layerFields,
  );
  const validatetopologyrelationFields = Object.freeze({
    error: nullableCodec(c23),
    layer_id: nullableCodec(c0),
    topogeo_id: nullableCodec(c1),
    element_id: nullableCodec(c1),
  });
  const validatetopologyrelationResult = compositeCodec(
    "postgis_topology:validatetopologyrelation:3.6.4",
    validatetopologyrelationFields,
  );
  const topology_id_seqFields = Object.freeze({ last_value: c1, log_cnt: c1, is_called: c15 });
  const topology_id_seqResult = compositeCodec("postgis_topology:topology_id_seq:3.6.4", topology_id_seqFields);
  const getfaceedges_returntypeValue = {
    kind: "object",
    properties: {
      sequence: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      edge: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] },
    },
  } as const;
  const layerValue = {
    kind: "object",
    properties: {
      topology_id: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      layer_id: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      schema_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      feature_column: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      feature_type: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      level: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      child_id: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
    },
  } as const;
  const topoelementValue = postgresTopologyArrayValue({ kind: "bigint" });
  const topoelementarrayValue = postgresTopologyArrayValue({ kind: "bigint" });
  const topogeometryValue = {
    kind: "object",
    properties: {
      topology_id: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      layer_id: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      id: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] },
      type: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
    },
  } as const;
  const topologyValue = {
    kind: "object",
    properties: {
      id: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      srid: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      precision: {
        kind: "union",
        variants: [
          {
            kind: "union",
            variants: [
              { kind: "number" },
              { kind: "object", properties: { nonfinite: { kind: "string", enum: ["NaN", "Infinity", "-Infinity"] } } },
            ],
          },
          { kind: "null" },
        ],
      },
      hasz: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      useslargeids: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
    },
  } as const;
  const validatetopology_returntypeValue = {
    kind: "object",
    properties: {
      error: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      id1: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] },
      id2: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] },
    },
  } as const;
  const getfaceedges_returntypeArrayValue = postgresTopologyArrayValue(getfaceedges_returntypeValue);
  const layerArrayValue = postgresTopologyArrayValue(layerValue);
  const topoelementArrayValue = postgresTopologyArrayValue(topoelementValue);
  const topoelementarrayArrayValue = postgresTopologyArrayValue(topoelementarrayValue);
  const topogeometryArrayValue = postgresTopologyArrayValue(topogeometryValue);
  const topologyArrayValue = postgresTopologyArrayValue(topologyValue);
  const validatetopology_returntypeArrayValue = postgresTopologyArrayValue(validatetopology_returntypeValue);
  return Object.freeze({
    types: Object.freeze({
      _getfaceedges_returntype: c3,
      _layer: c6,
      _topoelement: c9,
      _topoelementarray: c11,
      _topogeometry: c13,
      _topology: c17,
      _validatetopology_returntype: c19,
      getfaceedges_returntype: c2,
      layer: c5,
      topoelement: c8,
      topoelementarray: c10,
      topogeometry: c12,
      topology: c16,
      validatetopology_returntype: c18,
    }),
    fields: Object.freeze({
      getfaceedges_returntype: getfaceedges_returntypeFields,
      layer: layerFields,
      topogeometry: topogeometryFields,
      topology: topologyFields,
      validatetopology_returntype: validatetopology_returntypeFields,
    }),
    topology_id_seqFields,
    topology_id_seqResult,
    populate_topology_layerResult,
    validatetopologyrelationResult,
    populate_topology_layerFields,
    validatetopologyrelationFields,
    primitives: Object.freeze({
      "pg_catalog:int4": c0,
      "pg_catalog:int8": c1,
      "pg_catalog:varchar": c4,
      "pg_catalog:_int8": c7,
      "pg_catalog:float8": c14,
      "pg_catalog:bool": c15,
      "$extension:postgis:geometry": c20,
      "pg_catalog:name": c21,
      "pg_catalog:regclass": c22,
      "pg_catalog:text": c23,
      "pg_catalog:void": c24,
    }),
    values: Object.freeze({
      _getfaceedges_returntype: getfaceedges_returntypeArrayValue,
      _layer: layerArrayValue,
      _topoelement: topoelementArrayValue,
      _topoelementarray: topoelementarrayArrayValue,
      _topogeometry: topogeometryArrayValue,
      _topology: topologyArrayValue,
      _validatetopology_returntype: validatetopology_returntypeArrayValue,
      getfaceedges_returntype: getfaceedges_returntypeValue,
      layer: layerValue,
      topoelement: topoelementValue,
      topoelementarray: topoelementarrayValue,
      topogeometry: topogeometryValue,
      topology: topologyValue,
      validatetopology_returntype: validatetopology_returntypeValue,
    }),
  });
}
export type Topogeometry = CodecOutput<ReturnType<typeof createPostgisTopologyCodecs>["types"]["topogeometry"]>;
export type Topoelement = CodecOutput<ReturnType<typeof createPostgisTopologyCodecs>["types"]["topoelement"]>;
export type Topoelementarray = CodecOutput<ReturnType<typeof createPostgisTopologyCodecs>["types"]["topoelementarray"]>;
