import type pg from "pg";
import { createPostgisTopology_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/postgis-topology";
import topology from "../../../apps/loom/src/tooling/extensions/manifests/postgis_topology.json";
import postgis from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";

const api = createPostgisTopology_3_6_4(
  {
    name: "postgis_topology",
    version: "3.6.4",
    schema: "topology",
    apiSupport: { status: "verified", digest: topology.digest },
  },
  {
    name: "postgis",
    version: "3.6.4",
    schema: "extensions",
    apiSupport: { status: "verified", digest: postgis.digest },
  },
);
const geometry = (wkt: string) => api.geometry.ewkt("SRID=4326;" + wkt);

/** Native SQL creates every graph; this fixture contains no graph implementation. */
export async function populatedTopologyOperatorArguments(
  client: pg.Client,
  name: string,
  inputTypes: readonly string[],
): Promise<unknown[]> {
  await client.query(
    "SELECT DropTopology(name) FROM topology.topology ORDER BY id; DROP SCHEMA IF EXISTS features CASCADE; CREATE SCHEMA features; CREATE TABLE features.points(id int); CREATE TABLE features.lines(id int); CREATE TABLE features.extras(id int)",
  );
  await client.query(
    "SELECT CreateTopology('op_graph',4326,0,false,777,true); SELECT TopoGeo_AddLineString('op_graph',ST_GeomFromText('LINESTRING(0 0,2 0)',4326)); SELECT TopoGeo_AddPoint('op_graph',ST_GeomFromText('POINT(8 8)',4326)); SELECT TopoGeo_AddPolygon('op_graph',ST_GeomFromText('POLYGON((10 10,12 10,12 12,10 12,10 10))',4326)); SELECT TopoGeo_AddPoint('op_graph',ST_GeomFromText('POINT(20 0)',4326)); SELECT TopoGeo_AddPoint('op_graph',ST_GeomFromText('POINT(22 0)',4326)); SELECT AddTopoGeometryColumn('op_graph','features','points','shape','POINT'); SELECT AddTopoGeometryColumn('op_graph','features','lines','shape','LINE'); INSERT INTO features.points VALUES (1,CreateTopoGeom('op_graph',1,1,'{{3,1}}'::topology.topoelementarray)); INSERT INTO features.points VALUES (2,CreateTopoGeom('op_graph',1,1,'{{5,1}}'::topology.topoelementarray)); INSERT INTO features.lines VALUES (1,CreateTopoGeom('op_graph',2,2,'{{1,2}}'::topology.topoelementarray))",
  );
  const topogeometries = (await client.query("SELECT shape::text value FROM features.points ORDER BY id")).rows.map(
    (row) => api.codecs.topogeometry.decode(row.value),
  );
  const line = api.codecs.topogeometry.decode(
    (await client.query("SELECT shape::text value FROM features.lines")).rows[0].value,
  );
  const topogeometry = topogeometries[0]!;
  const element = api.codecs.topoelement.decode("{5,1}");
  switch (name) {
    case "addedge":
      await client.query("SELECT CreateTopology('edge_graph',4326,0,false,888,true)");
      return ["edge_graph", geometry("LINESTRING(20 0,22 0)")];
    case "addface":
      return ["op_graph", geometry("POLYGON((10 10,12 10,12 12,10 12,10 10))"), false];
    case "addnode":
      return ["op_graph", geometry("POINT(25 25)"), false, false];
    case "addtopogeometrycolumn":
      return inputTypes[1] === "regclass"
        ? ["op_graph", "features.extras", "shape", 42, "POINT", null]
        : ["op_graph", "features", "extras", "shape", "POINT", null];
    case "addtosearchpath":
      return ["topology"];
    case "asgml":
      await client.query("CREATE TABLE features.visited(element_type int,element_id bigint)");
      return inputTypes[1] === "regclass"
        ? [line, "features.visited", "gml"].slice(0, inputTypes.length)
        : [line, "gml", 8, 0, "features.visited", "id", 3].slice(0, inputTypes.length);
    case "astopojson":
      await client.query(
        "CREATE TABLE features.arc_map(arc_id bigint GENERATED ALWAYS AS IDENTITY,edge_id bigint UNIQUE)",
      );
      return [line, "features.arc_map"];
    case "cleartopogeom":
      return [topogeometry];
    case "copytopology":
      return ["op_graph", "copied_graph"];
    case "createtopogeom":
      return inputTypes.length === 3
        ? ["op_graph", 1, 1]
        : ["op_graph", 1, 1, api.codecs.topoelementarray.decode("{{3,1}}"), 9223372036854775807n];
    case "createtopology":
      return ["created_graph", 4326, 0, false, 888, true];
    case "droptopogeometrycolumn":
      return ["features", "points", "shape"];
    case "droptopology":
      return ["op_graph"];
    case "fixcorrupttopogeometrycolumn":
      return ["features", "points", "shape"];
    case "maketopologyprecise":
      return ["op_graph", null, 0];
    case "polygonize":
      return ["op_graph"];
    case "populate_topology_layer":
      return [];
    case "removeunusedprimitives":
      return ["op_graph", null];
    case "renametopogeometrycolumn":
      return ["features.points", "shape", "renamed_shape"];
    case "renametopology":
      return ["op_graph", "renamed_graph"];
    case "st_addedgemodface":
    case "st_addedgenewfaces":
    case "st_addisoedge":
      return ["op_graph", 5n, 6n, geometry("LINESTRING(20 0,22 0)")];
    case "st_addisonode":
      return ["op_graph", 0n, geometry("POINT(25 25)")];
    case "st_changeedgegeom":
      return ["op_graph", 1n, geometry("LINESTRING(0 0,1 0.5,2 0)")];
    case "st_createtopogeo":
      await client.query("SELECT CreateTopology('empty_graph',4326,0,false,888,true)");
      return ["empty_graph", geometry("GEOMETRYCOLLECTION(POINT(8 8),LINESTRING(0 0,2 0))")];
    case "st_inittopogeo":
      return ["initialized_graph"];
    case "st_modedgeheal":
    case "st_newedgeheal":
      await client.query("SELECT ST_ModEdgeSplit('op_graph',1,ST_GeomFromText('POINT(1 0)',4326))");
      return ["op_graph", 1n, 3n];
    case "st_modedgesplit":
      return ["op_graph", 1n, geometry("POINT(1 0)")];
    case "st_newedgessplit":
      // 3.6.4's native referenced-edge path has a separately retained SQLSTATE 42601 reproduction.
      await client.query("SELECT ClearTopoGeom(shape) FROM features.lines");
      return ["op_graph", 1n, geometry("POINT(1 0)")];
    case "st_moveisonode":
      return ["op_graph", 6n, geometry("POINT(23 0)")];
    case "st_remedgemodface":
    case "st_remedgenewface":
    case "st_removeisoedge":
      // The line layer intentionally references edge 1; remove its native TopoGeometry first.
      await client.query("SELECT ClearTopoGeom(shape) FROM features.lines");
      return ["op_graph", 1n];
    case "st_remisonode":
    case "st_removeisonode":
      return ["op_graph", 6n];
    case "topogeo_addgeometry":
      return ["op_graph", geometry("POINT(25 25)"), 0];
    case "topogeo_addlinestring":
      return ["op_graph", geometry("LINESTRING(30 30,32 30)"), 0];
    case "topogeo_addpoint":
      return ["op_graph", geometry("POINT(25 25)"), 0];
    case "topogeo_addpolygon":
      return ["op_graph", geometry("POLYGON((30 30,32 30,32 32,30 32,30 30))"), 0];
    case "topogeo_loadgeometry":
      await client.query("SELECT CreateTopology('empty_graph',4326,0,false,888,true)");
      return ["empty_graph", geometry("GEOMETRYCOLLECTION(POINT(8 8),LINESTRING(0 0,2 0))"), 0];
    case "topogeom_addelement":
      return [topogeometry, element];
    case "topogeom_addtopogeom":
      return [topogeometry, topogeometries[1]];
    case "topogeom_remelement":
      return [topogeometry, api.codecs.topoelement.decode("{3,1}")];
    case "totopogeom":
      return inputTypes[1] === "topogeometry"
        ? [geometry("POINT(9 9)"), topogeometry, 0]
        : [geometry("POINT(9 9)"), "op_graph", 1, 0];
    case "upgradetopology":
      await client.query("SELECT CreateTopology('small_graph',4326,0,false,888,false)");
      return ["small_graph"];
    case "validatetopology":
      return ["op_graph", null];
    case "validatetopologyrelation":
      return ["op_graph"];
    default:
      throw new Error("No populated operator scenario for " + name);
  }
}
