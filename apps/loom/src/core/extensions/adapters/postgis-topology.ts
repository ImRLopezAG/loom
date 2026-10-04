import { sql } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { nullableCodec } from "../codecs";
import { createExtensionField } from "../fields";
import { extensionRows } from "../rows";
import { checkedExtensionExpression, createSqlFunction, createSqlAggregate, defaultSqlArgument } from "../sql";
import { createPostgisTopologyCodecs } from "./postgis-topology-codecs";
import { geometryEwkt, geometryEwkb } from "./postgis-codecs";
export type { Topogeometry, Topoelement, Topoelementarray } from "./postgis-topology-codecs";
export type PostgisTopologyDescriptor = ExtensionDescriptor<
  "postgis_topology",
  { readonly version: "3.6.4"; readonly schema: string }
>;
export type TopologyPostgisDescriptor = ExtensionDescriptor<
  "postgis",
  { readonly version: "3.6.4"; readonly schema: string }
>;
export const postgisTopologyDigest = "a935414ebe37f352b234da7634c9c3be407c13921a574dcef16ddbd52d9e922d";
const postgisDigest = "640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29";
/** Exact topology 3.6.4. Native read routines compose with the restricted invocation database.
 * Dynamic graph/catalog lookups are externally observable and cannot promise Loom table invalidation.
 * Graph edits, DDL and session diagnostics live exclusively in operator tooling.
 */
export function createPostgisTopology_3_6_4<const Selected extends PostgisTopologyDescriptor>(
  descriptor: Selected,
  postgis: TopologyPostgisDescriptor,
) {
  if (
    descriptor.name !== "postgis_topology" ||
    descriptor.version !== "3.6.4" ||
    descriptor.schema !== "topology" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== postgisTopologyDigest
  )
    throw new Error("postgis_topology 3.6.4 requires its exact verified fixed-schema contract");
  if (
    postgis.name !== "postgis" ||
    postgis.version !== "3.6.4" ||
    postgis.apiSupport.status !== "verified" ||
    postgis.apiSupport.digest !== postgisDigest
  )
    throw new Error("postgis_topology 3.6.4 requires its exact verified postgis 3.6.4 dependency");
  const codecs = createPostgisTopologyCodecs(descriptor.schema, postgis.schema);
  const search = { filter: false, comparison: false, order: false, text: false } as const;
  const base = { schema: descriptor.schema, dependencies: [], observability: "external", authority: "query" } as const;
  const member44 = createSqlFunction({
    ...base,
    observability: "external",
    name: "asgml",
    member:
      "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry,pg_catalog.text,pg_catalog.int4,pg_catalog.int4)",
    arguments: [
      nullableCodec(codecs.types["topogeometry"]),
      nullableCodec(codecs.primitives["pg_catalog:text"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const member45 = createSqlFunction({
    ...base,
    observability: "external",
    name: "asgml",
    member: "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry,pg_catalog.text)",
    arguments: [
      nullableCodec(codecs.types["topogeometry"]),
      nullableCodec(codecs.primitives["pg_catalog:text"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const member46 = createSqlFunction({
    ...base,
    observability: "external",
    name: "asgml",
    member: "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry)",
    arguments: [nullableCodec(codecs.types["topogeometry"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const member55 = createSqlFunction({
    ...base,
    observability: "external",
    name: "equals",
    member:
      "routine:$extension:postgis_topology.equals($extension:postgis_topology.topogeometry,$extension:postgis_topology.topogeometry)",
    arguments: [nullableCodec(codecs.types["topogeometry"]), nullableCodec(codecs.types["topogeometry"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:bool"]),
  });
  const member56 = createSqlFunction({
    ...base,
    observability: "external",
    name: "findlayer",
    member: "routine:$extension:postgis_topology.findlayer($extension:postgis_topology.topogeometry)",
    arguments: [nullableCodec(codecs.types["topogeometry"])] as const,
    result: nullableCodec(codecs.types["layer"]),
  });
  const member57 = createSqlFunction({
    ...base,
    observability: "external",
    name: "findlayer",
    member: "routine:$extension:postgis_topology.findlayer(pg_catalog.int4,pg_catalog.int4)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
    ] as const,
    result: nullableCodec(codecs.types["layer"]),
  });
  const member58 = createSqlFunction({
    ...base,
    observability: "external",
    name: "findlayer",
    member: "routine:$extension:postgis_topology.findlayer(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      nullableCodec(codecs.primitives["pg_catalog:name"]),
    ] as const,
    result: nullableCodec(codecs.types["layer"]),
  });
  const member59 = createSqlFunction({
    ...base,
    observability: "external",
    name: "findlayer",
    member: "routine:$extension:postgis_topology.findlayer(pg_catalog.regclass,pg_catalog.name)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:regclass"]),
      nullableCodec(codecs.primitives["pg_catalog:name"]),
    ] as const,
    result: nullableCodec(codecs.types["layer"]),
  });
  const member60 = createSqlFunction({
    ...base,
    observability: "external",
    name: "findtopology",
    member: "routine:$extension:postgis_topology.findtopology($extension:postgis_topology.topogeometry)",
    arguments: [nullableCodec(codecs.types["topogeometry"])] as const,
    result: nullableCodec(codecs.types["topology"]),
  });
  const member61 = createSqlFunction({
    ...base,
    observability: "external",
    name: "findtopology",
    member: "routine:$extension:postgis_topology.findtopology(pg_catalog.int4)",
    arguments: [nullableCodec(codecs.primitives["pg_catalog:int4"])] as const,
    result: nullableCodec(codecs.types["topology"]),
  });
  const member62 = createSqlFunction({
    ...base,
    observability: "external",
    name: "findtopology",
    member: "routine:$extension:postgis_topology.findtopology(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      nullableCodec(codecs.primitives["pg_catalog:name"]),
    ] as const,
    result: nullableCodec(codecs.types["topology"]),
  });
  const member63 = createSqlFunction({
    ...base,
    observability: "external",
    name: "findtopology",
    member: "routine:$extension:postgis_topology.findtopology(pg_catalog.regclass,pg_catalog.name)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:regclass"]),
      nullableCodec(codecs.primitives["pg_catalog:name"]),
    ] as const,
    result: nullableCodec(codecs.types["topology"]),
  });
  const member64 = createSqlFunction({
    ...base,
    observability: "external",
    name: "findtopology",
    member: "routine:$extension:postgis_topology.findtopology(pg_catalog.text)",
    arguments: [nullableCodec(codecs.primitives["pg_catalog:text"])] as const,
    result: nullableCodec(codecs.types["topology"]),
  });
  const member66 = createSqlFunction({
    ...base,
    observability: "external",
    name: "geometry",
    member: "routine:$extension:postgis_topology.geometry($extension:postgis_topology.topogeometry)",
    arguments: [nullableCodec(codecs.types["topogeometry"])] as const,
    result: nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  });
  const member67 = createSqlFunction({
    ...base,
    observability: "tables",
    name: "geometrytype",
    member: "routine:$extension:postgis_topology.geometrytype($extension:postgis_topology.topogeometry)",
    arguments: [nullableCodec(codecs.types["topogeometry"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const member68 = createSqlFunction({
    ...base,
    observability: "external",
    name: "getedgebypoint",
    member:
      "routine:$extension:postgis_topology.getedgebypoint(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
      nullableCodec(codecs.primitives["pg_catalog:float8"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const member69 = createSqlFunction({
    ...base,
    observability: "external",
    name: "getfacebypoint",
    member:
      "routine:$extension:postgis_topology.getfacebypoint(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
      nullableCodec(codecs.primitives["pg_catalog:float8"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const member70 = createSqlFunction({
    ...base,
    observability: "external",
    name: "getfacecontainingpoint",
    member: "routine:$extension:postgis_topology.getfacecontainingpoint(pg_catalog.text,$extension:postgis.geometry)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:text"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const member71 = createSqlFunction({
    ...base,
    observability: "external",
    name: "getnodebypoint",
    member:
      "routine:$extension:postgis_topology.getnodebypoint(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
      nullableCodec(codecs.primitives["pg_catalog:float8"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const member72 = createSqlFunction({
    ...base,
    observability: "external",
    name: "getnodeedges",
    member: "routine:$extension:postgis_topology.getnodeedges(pg_catalog.varchar,pg_catalog.int8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
    ] as const,
    result: nullableCodec(codecs.types["getfaceedges_returntype"]),
  });
  const member73 = createSqlFunction({
    ...base,
    observability: "external",
    name: "getringedges",
    member: "routine:$extension:postgis_topology.getringedges(pg_catalog.varchar,pg_catalog.int8,pg_catalog.int4)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:int4"]), "maxedges"),
    ] as const,
    result: nullableCodec(codecs.types["getfaceedges_returntype"]),
  });
  const member74 = createSqlFunction({
    ...base,
    observability: "external",
    name: "gettopogeomelementarray",
    member: "routine:$extension:postgis_topology.gettopogeomelementarray($extension:postgis_topology.topogeometry)",
    arguments: [nullableCodec(codecs.types["topogeometry"])] as const,
    result: nullableCodec(codecs.types["topoelementarray"]),
  });
  const member75 = createSqlFunction({
    ...base,
    observability: "external",
    name: "gettopogeomelementarray",
    member:
      "routine:$extension:postgis_topology.gettopogeomelementarray(pg_catalog.varchar,pg_catalog.int4,pg_catalog.int8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
    ] as const,
    result: nullableCodec(codecs.types["topoelementarray"]),
  });
  const member76 = createSqlFunction({
    ...base,
    observability: "external",
    name: "gettopogeomelements",
    member: "routine:$extension:postgis_topology.gettopogeomelements($extension:postgis_topology.topogeometry)",
    arguments: [nullableCodec(codecs.types["topogeometry"])] as const,
    result: nullableCodec(codecs.types["topoelement"]),
  });
  const member77 = createSqlFunction({
    ...base,
    observability: "external",
    name: "gettopogeomelements",
    member:
      "routine:$extension:postgis_topology.gettopogeomelements(pg_catalog.varchar,pg_catalog.int4,pg_catalog.int8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
    ] as const,
    result: nullableCodec(codecs.types["topoelement"]),
  });
  const member78 = createSqlFunction({
    ...base,
    observability: "external",
    name: "gettopologyid",
    member: "routine:$extension:postgis_topology.gettopologyid(pg_catalog.varchar)",
    arguments: [nullableCodec(codecs.primitives["pg_catalog:varchar"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int4"]),
  });
  const member79 = createSqlFunction({
    ...base,
    observability: "external",
    name: "gettopologyname",
    member: "routine:$extension:postgis_topology.gettopologyname(pg_catalog.int4)",
    arguments: [nullableCodec(codecs.primitives["pg_catalog:int4"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:varchar"]),
  });
  const member80 = createSqlFunction({
    ...base,
    observability: "external",
    name: "gettopologysrid",
    member: "routine:$extension:postgis_topology.gettopologysrid(pg_catalog.varchar)",
    arguments: [nullableCodec(codecs.primitives["pg_catalog:varchar"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int4"]),
  });
  const member81 = createSqlFunction({
    ...base,
    observability: "external",
    name: "intersects",
    member:
      "routine:$extension:postgis_topology.intersects($extension:postgis_topology.topogeometry,$extension:postgis_topology.topogeometry)",
    arguments: [nullableCodec(codecs.types["topogeometry"]), nullableCodec(codecs.types["topogeometry"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:bool"]),
  });
  const member86 = createSqlFunction({
    ...base,
    observability: "tables",
    name: "postgis_topology_scripts_installed",
    member: "routine:$extension:postgis_topology.postgis_topology_scripts_installed()",
    arguments: [] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const member97 = createSqlFunction({
    ...base,
    observability: "tables",
    name: "st_geometrytype",
    member: "routine:$extension:postgis_topology.st_geometrytype($extension:postgis_topology.topogeometry)",
    arguments: [nullableCodec(codecs.types["topogeometry"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const member98 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_getfaceedges",
    member: "routine:$extension:postgis_topology.st_getfaceedges(pg_catalog.varchar,pg_catalog.int8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
    ] as const,
    result: nullableCodec(codecs.types["getfaceedges_returntype"]),
  });
  const member99 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_getfacegeometry",
    member: "routine:$extension:postgis_topology.st_getfacegeometry(pg_catalog.varchar,pg_catalog.int8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
    ] as const,
    result: nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  });
  const member111 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_simplify",
    member:
      "routine:$extension:postgis_topology.st_simplify($extension:postgis_topology.topogeometry,pg_catalog.float8)",
    arguments: [
      nullableCodec(codecs.types["topogeometry"]),
      nullableCodec(codecs.primitives["pg_catalog:float8"]),
    ] as const,
    result: nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  });
  const member112 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_srid",
    member: "routine:$extension:postgis_topology.st_srid($extension:postgis_topology.topogeometry)",
    arguments: [nullableCodec(codecs.types["topogeometry"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int4"]),
  });
  const member113 = createSqlFunction({
    ...base,
    observability: "tables",
    name: "topoelement",
    member: "routine:$extension:postgis_topology.topoelement($extension:postgis_topology.topogeometry)",
    arguments: [nullableCodec(codecs.types["topogeometry"])] as const,
    result: nullableCodec(codecs.types["topoelement"]),
  });
  const member114 = createSqlAggregate({
    ...base,
    observability: "tables",
    name: "topoelementarray_agg",
    member: "routine:$extension:postgis_topology.topoelementarray_agg($extension:postgis_topology.topoelement)",
    arguments: [nullableCodec(codecs.types["topoelement"])] as const,
    result: nullableCodec(codecs.types["topoelementarray"]),
  });
  const member115 = createSqlFunction({
    ...base,
    observability: "tables",
    name: "topoelementarray_append",
    member:
      "routine:$extension:postgis_topology.topoelementarray_append($extension:postgis_topology.topoelementarray,$extension:postgis_topology.topoelement)",
    arguments: [nullableCodec(codecs.types["topoelementarray"]), nullableCodec(codecs.types["topoelement"])] as const,
    result: nullableCodec(codecs.types["topoelementarray"]),
  });
  const member124 = createSqlFunction({
    ...base,
    observability: "external",
    name: "topologysummary",
    member: "routine:$extension:postgis_topology.topologysummary(pg_catalog.varchar)",
    arguments: [nullableCodec(codecs.primitives["pg_catalog:varchar"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const member125 = createSqlFunction({
    ...base,
    observability: "external",
    name: "totaltopologysize",
    member: "routine:$extension:postgis_topology.totaltopologysize(pg_catalog.name)",
    arguments: [nullableCodec(codecs.primitives["pg_catalog:name"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const member130 = createSqlFunction({
    ...base,
    observability: "external",
    name: "validatetopologyprecision",
    member:
      "routine:$extension:postgis_topology.validatetopologyprecision(pg_catalog.name,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["$extension:postgis:geometry"]), "bbox"),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:float8"]), "gridsize"),
    ] as const,
    result: nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  });
  const functions = Object.freeze({
    asgml: Object.freeze({
      "($extension:postgis_topology.topogeometry,pg_catalog.text,pg_catalog.int4,pg_catalog.int4)": member44,
      "($extension:postgis_topology.topogeometry,pg_catalog.text)": member45,
      "($extension:postgis_topology.topogeometry)": member46,
    }),
    equals: member55,
    findlayer: Object.freeze({
      "($extension:postgis_topology.topogeometry)": member56,
      "(pg_catalog.int4,pg_catalog.int4)": member57,
      "(pg_catalog.name,pg_catalog.name,pg_catalog.name)": member58,
      "(pg_catalog.regclass,pg_catalog.name)": member59,
    }),
    findtopology: Object.freeze({
      "($extension:postgis_topology.topogeometry)": member60,
      "(pg_catalog.int4)": member61,
      "(pg_catalog.name,pg_catalog.name,pg_catalog.name)": member62,
      "(pg_catalog.regclass,pg_catalog.name)": member63,
      "(pg_catalog.text)": member64,
    }),
    geometry: member66,
    geometrytype: member67,
    getedgebypoint: member68,
    getfacebypoint: member69,
    getfacecontainingpoint: member70,
    getnodebypoint: member71,
    getnodeedges: member72,
    getringedges: member73,
    gettopogeomelementarray: Object.freeze({
      "($extension:postgis_topology.topogeometry)": member74,
      "(pg_catalog.varchar,pg_catalog.int4,pg_catalog.int8)": member75,
    }),
    gettopogeomelements: Object.freeze({
      "($extension:postgis_topology.topogeometry)": member76,
      "(pg_catalog.varchar,pg_catalog.int4,pg_catalog.int8)": member77,
    }),
    gettopologyid: member78,
    gettopologyname: member79,
    gettopologysrid: member80,
    intersects: member81,
    postgis_topology_scripts_installed: member86,
    st_geometrytype: member97,
    st_getfaceedges: member98,
    st_getfacegeometry: member99,
    st_simplify: member111,
    st_srid: member112,
    topoelement: member113,
    topoelementarray_agg: member114,
    topoelementarray_append: member115,
    topologysummary: member124,
    totaltopologysize: member125,
    validatetopologyprecision: member130,
  });
  return bindExtension(descriptor, {
    ...functions,
    geometry: Object.assign(functions.geometry, { ewkt: geometryEwkt, ewkb: geometryEwkb }),
    codecs: codecs.types,
    fields: Object.freeze({
      _getfaceedges_returntype: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:postgis_topology._getfaceedges_returntype",
          type: "getfaceedges_returntype",
          codec: codecs.types["_getfaceedges_returntype"],
          array: true,
          value: codecs.values["_getfaceedges_returntype"],
          search,
        }),
      _layer: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:postgis_topology._layer",
          type: "layer",
          codec: codecs.types["_layer"],
          array: true,
          value: codecs.values["_layer"],
          search,
        }),
      _topoelement: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:postgis_topology._topoelement",
          type: "topoelement",
          codec: codecs.types["_topoelement"],
          array: true,
          value: codecs.values["_topoelement"],
          search,
        }),
      _topoelementarray: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:postgis_topology._topoelementarray",
          type: "topoelementarray",
          codec: codecs.types["_topoelementarray"],
          array: true,
          value: codecs.values["_topoelementarray"],
          search,
        }),
      _topogeometry: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:postgis_topology._topogeometry",
          type: "topogeometry",
          codec: codecs.types["_topogeometry"],
          array: true,
          value: codecs.values["_topogeometry"],
          search,
        }),
      _topology: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:postgis_topology._topology",
          type: "topology",
          codec: codecs.types["_topology"],
          array: true,
          value: codecs.values["_topology"],
          search,
        }),
      _validatetopology_returntype: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:postgis_topology._validatetopology_returntype",
          type: "validatetopology_returntype",
          codec: codecs.types["_validatetopology_returntype"],
          array: true,
          value: codecs.values["_validatetopology_returntype"],
          search,
        }),
      getfaceedges_returntype: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:postgis_topology.getfaceedges_returntype",
          type: "getfaceedges_returntype",
          codec: codecs.types["getfaceedges_returntype"],
          array: false,
          value: codecs.values["getfaceedges_returntype"],
          search,
        }),
      layer: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:postgis_topology.layer",
          type: "layer",
          codec: codecs.types["layer"],
          array: false,
          value: codecs.values["layer"],
          search,
        }),
      topoelement: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:postgis_topology.topoelement",
          type: "topoelement",
          codec: codecs.types["topoelement"],
          array: false,
          value: codecs.values["topoelement"],
          search,
        }),
      topoelementarray: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:postgis_topology.topoelementarray",
          type: "topoelementarray",
          codec: codecs.types["topoelementarray"],
          array: false,
          value: codecs.values["topoelementarray"],
          search,
        }),
      topogeometry: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:postgis_topology.topogeometry",
          type: "topogeometry",
          codec: codecs.types["topogeometry"],
          array: false,
          value: codecs.values["topogeometry"],
          search,
        }),
      topology: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:postgis_topology.topology",
          type: "topology",
          codec: codecs.types["topology"],
          array: false,
          value: codecs.values["topology"],
          search,
        }),
      validatetopology_returntype: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:postgis_topology.validatetopology_returntype",
          type: "validatetopology_returntype",
          codec: codecs.types["validatetopology_returntype"],
          array: false,
          value: codecs.values["validatetopology_returntype"],
          search,
        }),
    }),
    sql: Object.freeze({
      functions,
      operators: Object.freeze({}),
      overloads: Object.freeze({
        "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry,pg_catalog.text,pg_catalog.int4,pg_catalog.int4)":
          member44,
        "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry,pg_catalog.text)": member45,
        "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry)": member46,
        "routine:$extension:postgis_topology.equals($extension:postgis_topology.topogeometry,$extension:postgis_topology.topogeometry)":
          member55,
        "routine:$extension:postgis_topology.findlayer($extension:postgis_topology.topogeometry)": member56,
        "routine:$extension:postgis_topology.findlayer(pg_catalog.int4,pg_catalog.int4)": member57,
        "routine:$extension:postgis_topology.findlayer(pg_catalog.name,pg_catalog.name,pg_catalog.name)": member58,
        "routine:$extension:postgis_topology.findlayer(pg_catalog.regclass,pg_catalog.name)": member59,
        "routine:$extension:postgis_topology.findtopology($extension:postgis_topology.topogeometry)": member60,
        "routine:$extension:postgis_topology.findtopology(pg_catalog.int4)": member61,
        "routine:$extension:postgis_topology.findtopology(pg_catalog.name,pg_catalog.name,pg_catalog.name)": member62,
        "routine:$extension:postgis_topology.findtopology(pg_catalog.regclass,pg_catalog.name)": member63,
        "routine:$extension:postgis_topology.findtopology(pg_catalog.text)": member64,
        "routine:$extension:postgis_topology.geometry($extension:postgis_topology.topogeometry)": member66,
        "routine:$extension:postgis_topology.geometrytype($extension:postgis_topology.topogeometry)": member67,
        "routine:$extension:postgis_topology.getedgebypoint(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)":
          member68,
        "routine:$extension:postgis_topology.getfacebypoint(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)":
          member69,
        "routine:$extension:postgis_topology.getfacecontainingpoint(pg_catalog.text,$extension:postgis.geometry)":
          member70,
        "routine:$extension:postgis_topology.getnodebypoint(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)":
          member71,
        "routine:$extension:postgis_topology.getnodeedges(pg_catalog.varchar,pg_catalog.int8)": member72,
        "routine:$extension:postgis_topology.getringedges(pg_catalog.varchar,pg_catalog.int8,pg_catalog.int4)":
          member73,
        "routine:$extension:postgis_topology.gettopogeomelementarray($extension:postgis_topology.topogeometry)":
          member74,
        "routine:$extension:postgis_topology.gettopogeomelementarray(pg_catalog.varchar,pg_catalog.int4,pg_catalog.int8)":
          member75,
        "routine:$extension:postgis_topology.gettopogeomelements($extension:postgis_topology.topogeometry)": member76,
        "routine:$extension:postgis_topology.gettopogeomelements(pg_catalog.varchar,pg_catalog.int4,pg_catalog.int8)":
          member77,
        "routine:$extension:postgis_topology.gettopologyid(pg_catalog.varchar)": member78,
        "routine:$extension:postgis_topology.gettopologyname(pg_catalog.int4)": member79,
        "routine:$extension:postgis_topology.gettopologysrid(pg_catalog.varchar)": member80,
        "routine:$extension:postgis_topology.intersects($extension:postgis_topology.topogeometry,$extension:postgis_topology.topogeometry)":
          member81,
        "routine:$extension:postgis_topology.postgis_topology_scripts_installed()": member86,
        "routine:$extension:postgis_topology.st_geometrytype($extension:postgis_topology.topogeometry)": member97,
        "routine:$extension:postgis_topology.st_getfaceedges(pg_catalog.varchar,pg_catalog.int8)": member98,
        "routine:$extension:postgis_topology.st_getfacegeometry(pg_catalog.varchar,pg_catalog.int8)": member99,
        "routine:$extension:postgis_topology.st_simplify($extension:postgis_topology.topogeometry,pg_catalog.float8)":
          member111,
        "routine:$extension:postgis_topology.st_srid($extension:postgis_topology.topogeometry)": member112,
        "routine:$extension:postgis_topology.topoelement($extension:postgis_topology.topogeometry)": member113,
        "routine:$extension:postgis_topology.topoelementarray_agg($extension:postgis_topology.topoelement)": member114,
        "routine:$extension:postgis_topology.topoelementarray_append($extension:postgis_topology.topoelementarray,$extension:postgis_topology.topoelement)":
          member115,
        "routine:$extension:postgis_topology.topologysummary(pg_catalog.varchar)": member124,
        "routine:$extension:postgis_topology.totaltopologysize(pg_catalog.name)": member125,
        "routine:$extension:postgis_topology.validatetopologyprecision(pg_catalog.name,$extension:postgis.geometry,pg_catalog.float8)":
          member130,
      }),
      casts: Object.freeze({
        "cast:$extension:postgis_topology.topogeometry->$extension:postgis.geometry": createSqlFunction({
          ...base,
          name: "geometry",
          member: "cast:$extension:postgis_topology.topogeometry->$extension:postgis.geometry",
          arguments: [nullableCodec(codecs.types["topogeometry"])] as const,
          result: nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
        }),
        "cast:$extension:postgis_topology.topogeometry->pg_catalog._int8": createSqlFunction({
          ...base,
          name: "topoelement",
          member: "cast:$extension:postgis_topology.topogeometry->pg_catalog._int8",
          arguments: [nullableCodec(codecs.types["topogeometry"])] as const,
          result: nullableCodec(codecs.primitives["pg_catalog:_int8"]),
        }),
      }),
      types: codecs.types,
      rows: Object.freeze({
        "routine:$extension:postgis_topology.getnodeedges(pg_catalog.varchar,pg_catalog.int8)": (
          alias: string,
          ...values: Parameters<typeof member72>
        ) => extensionRows(member72(...values), alias, codecs.fields["getfaceedges_returntype"], "named"),
        "routine:$extension:postgis_topology.getringedges(pg_catalog.varchar,pg_catalog.int8,pg_catalog.int4)": (
          alias: string,
          ...values: Parameters<typeof member73>
        ) => extensionRows(member73(...values), alias, codecs.fields["getfaceedges_returntype"], "named"),
        "routine:$extension:postgis_topology.gettopogeomelements($extension:postgis_topology.topogeometry)": (
          alias: string,
          ...values: Parameters<typeof member76>
        ) => extensionRows(member76(...values), alias, { value: nullableCodec(codecs.types["topoelement"]) }, "named"),
        "routine:$extension:postgis_topology.gettopogeomelements(pg_catalog.varchar,pg_catalog.int4,pg_catalog.int8)": (
          alias: string,
          ...values: Parameters<typeof member77>
        ) => extensionRows(member77(...values), alias, { value: nullableCodec(codecs.types["topoelement"]) }, "named"),
        "routine:$extension:postgis_topology.st_getfaceedges(pg_catalog.varchar,pg_catalog.int8)": (
          alias: string,
          ...values: Parameters<typeof member98>
        ) => extensionRows(member98(...values), alias, codecs.fields["getfaceedges_returntype"], "named"),
        'table:"$extension:postgis_topology".layer': (alias: string) =>
          extensionRows(
            checkedExtensionExpression(
              sql`${sql.identifier(descriptor.schema)}.${sql.identifier("layer")}`,
              codecs.types["layer"],
              [],
              undefined,
              'table:"$extension:postgis_topology".layer',
              "external",
            ),
            alias,
            codecs.fields["layer"],
            "named",
          ),
        'table:"$extension:postgis_topology".topology': (alias: string) =>
          extensionRows(
            checkedExtensionExpression(
              sql`${sql.identifier(descriptor.schema)}.${sql.identifier("topology")}`,
              codecs.types["topology"],
              [],
              undefined,
              'table:"$extension:postgis_topology".topology',
              "external",
            ),
            alias,
            codecs.fields["topology"],
            "named",
          ),
        'sequence:"$extension:postgis_topology".topology_id_seq': (alias: string) =>
          extensionRows(
            checkedExtensionExpression(
              sql`${sql.identifier(descriptor.schema)}.${sql.identifier("topology_id_seq")}`,
              codecs.topology_id_seqResult,
              [],
              undefined,
              'sequence:"$extension:postgis_topology".topology_id_seq',
              "external",
            ),
            alias,
            codecs.topology_id_seqFields,
            "named",
          ),
      }),
    }),
  });
}
