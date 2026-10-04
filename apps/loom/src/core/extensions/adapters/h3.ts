import { is, SQL, sql, type SQLWrapper } from "drizzle-orm";
import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  binaryCodec,
  booleanCodec,
  compositeCodec,
  createExtensionCodec,
  floatCodec,
  integerCodec,
  nullableCodec,
  textCodec,
  type CodecInput,
  type ExtensionCodec,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { createExtensionField, createExtensionIndex, type ExtensionValueSchema } from "../fields";
import {
  checkedExtensionExpression,
  createSqlFunction,
  createSqlOperator,
  createSqlRows,
  defaultSqlArgument,
  extensionSqlType,
  type ExtensionSqlInput,
} from "../sql";
import {
  createH3IndexArrayCodec,
  createH3IndexCodec,
  h3IndexPattern,
  h3LatFirstPolygonCodec,
  h3LatLngCodec,
  h3LocalIjCodec,
  h3MultiPolygonPartCodec,
  h3PolygonArrayCodec,
  h3PolygonCodec,
} from "./h3-codecs";
export { h3Index, h3IndexPattern } from "./h3-codecs";
export type { H3Index, H3LatLng, H3LocalIj, H3Polygon, NonfiniteNumber, PostgreSqlArray } from "./h3-codecs";

const digest = "0402a89cff2876378a25b680936da0841125dc5d194c2dad6f006092914ffbaf";
type Descriptor = ExtensionDescriptor<"h3", { readonly version: "4.2.3"; readonly schema: string }>;
type AnyCodec = ExtensionCodec<never, unknown>;
const sqlWrapper = v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value));

function unitCodec<const Units extends readonly [string, ...string[]]>(id: string, units: Units) {
  const unit = v.picklist(units);
  return createExtensionCodec({
    id: `h3:unit:${id}:1`,
    sqlType: { schema: "pg_catalog", name: "text" },
    input: unit,
    output: unit,
    transport: "text",
    encode: (value) => value,
    decode: (value) => value,
  });
}
// Each set is the exact strcmp list of the captured C binding; anything else raises 22023 natively.
const lengthUnits = unitCodec("length", ["km", "m", "rads"]);
const averageUnits = unitCodec("average", ["km", "m"]);
const areaUnits = unitCodec("area", ["km^2", "m^2", "rads^2"]);
const containmentModes = unitCodec("containment-mode", ["center", "full", "overlapping", "overlapping_bbox"]);
/** Units accepted by h3_great_circle_distance and h3_edge_length (default km). */
export type H3LengthUnit = CodecInput<typeof lengthUnits>;
/** Units accepted by h3_get_hexagon_area_avg and h3_get_hexagon_edge_length_avg (default km; area is km² or m²). */
export type H3AverageUnit = CodecInput<typeof averageUnits>;
/** Units accepted by h3_cell_area (default km^2). */
export type H3AreaUnit = CodecInput<typeof areaUnits>;
/** h3_polygon_to_cells_experimental containment modes (default center). */
export type H3ContainmentMode = CodecInput<typeof containmentModes>;

/**
 * Exact h3-pg 4.2.3 contract: every SQL-callable captured routine, operator and cast, with H3 algorithms executed
 * only by PostgreSQL. Points are {lng, lat} degrees, matching native x/y, except h3_directed_edge_to_boundary,
 * whose native polygon is latitude-first and is read back into {lng, lat}. h3_latlng_to_cell reads h3.strict and
 * the one-argument h3_cell_to_boundary reads h3.extend_antimeridian; the *_children_slow SQL/PL wrappers resolve
 * their helper through search_path. Those members are session-dependent.
 */
export function createH3_4_2_3<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "h3" ||
    descriptor.version !== "4.2.3" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("h3 4.2.3 requires its exact verified contract");
  const schema = descriptor.schema;
  const codec = createH3IndexCodec(schema);
  const arrayValueCodec = createH3IndexArrayCodec(schema);
  const h3 = nullableCodec(codec),
    cells = nullableCodec(arrayValueCodec),
    bool = nullableCodec(booleanCodec),
    int4 = nullableCodec(int4Codec),
    int8 = nullableCodec(integerCodec),
    float8 = nullableCodec(floatCodec),
    text = nullableCodec(textCodec),
    bytes = nullableCodec(binaryCodec),
    latLng = nullableCodec(h3LatLngCodec),
    localIj = nullableCodec(h3LocalIjCodec),
    polygon = nullableCodec(h3PolygonCodec),
    latFirstPolygon = nullableCodec(h3LatFirstPolygonCodec),
    holes = nullableCodec(h3PolygonArrayCodec),
    faces = nullableCodec(arrayCodec(int4Codec)),
    length = nullableCodec(lengthUnits),
    average = nullableCodec(averageUnits),
    area = nullableCodec(areaUnits),
    mode = nullableCodec(containmentModes);
  const diskDistance = compositeCodec("h3:grid-disk-distances", { index: h3, distance: int4 });
  const edgeCells = compositeCodec("h3:directed-edge-to-cells", { origin: h3, destination: h3 });
  const tables = { schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const session = { ...tables, observability: "session" } as const;
  const H = "$extension:h3.h3index",
    A = "$extension:h3._h3index",
    I4 = "pg_catalog.int4",
    I8 = "pg_catalog.int8",
    P = "pg_catalog.point",
    T = "pg_catalog.text";
  const id = (name: string, ...types: string[]) => `routine:$extension:h3.${name}(${types.join(",")})`;

  // Indexing (h3_lat_lng_to_cell, h3_cell_to_lat_lng and h3_vertex_to_lat_lng are the deprecated spellings).
  const latlngToCell = createSqlFunction({ ...session, name: "h3_latlng_to_cell", member: id("h3_latlng_to_cell", P, I4), arguments: [latLng, int4] as const, result: h3 });
  const latLngToCellDeprecated = createSqlFunction({ ...session, name: "h3_lat_lng_to_cell", member: id("h3_lat_lng_to_cell", P, I4), arguments: [latLng, int4] as const, result: h3 });
  const cellToLatlng = createSqlFunction({ ...tables, name: "h3_cell_to_latlng", member: id("h3_cell_to_latlng", H), arguments: [h3] as const, result: latLng });
  const cellToLatLngDeprecated = createSqlFunction({ ...tables, name: "h3_cell_to_lat_lng", member: id("h3_cell_to_lat_lng", H), arguments: [h3] as const, result: latLng });
  const cellToBoundarySession = createSqlFunction({ ...session, name: "h3_cell_to_boundary", member: id("h3_cell_to_boundary", H), arguments: [h3] as const, result: polygon });
  const cellToBoundaryFlag = createSqlFunction({ ...tables, name: "h3_cell_to_boundary", member: id("h3_cell_to_boundary", H, "pg_catalog.bool"), arguments: [h3, bool] as const, result: polygon });
  // Inspection.
  const getResolution = createSqlFunction({ ...tables, name: "h3_get_resolution", member: id("h3_get_resolution", H), arguments: [h3] as const, result: int4 });
  const getBaseCellNumber = createSqlFunction({ ...tables, name: "h3_get_base_cell_number", member: id("h3_get_base_cell_number", H), arguments: [h3] as const, result: int4 });
  const isValidCell = createSqlFunction({ ...tables, name: "h3_is_valid_cell", member: id("h3_is_valid_cell", H), arguments: [h3] as const, result: bool });
  const isResClassIii = createSqlFunction({ ...tables, name: "h3_is_res_class_iii", member: id("h3_is_res_class_iii", H), arguments: [h3] as const, result: bool });
  const isPentagon = createSqlFunction({ ...tables, name: "h3_is_pentagon", member: id("h3_is_pentagon", H), arguments: [h3] as const, result: bool });
  const getIcosahedronFaces = createSqlFunction({ ...tables, name: "h3_get_icosahedron_faces", member: id("h3_get_icosahedron_faces", H), arguments: [h3] as const, result: faces });
  // Traversal.
  const k = defaultSqlArgument(int4, "k");
  const gridDisk = createSqlRows({ ...tables, name: "h3_grid_disk", member: id("h3_grid_disk", H, I4), arguments: [h3, k] as const, result: h3 });
  const gridDiskDistances = createSqlRows({ ...tables, name: "h3_grid_disk_distances", member: id("h3_grid_disk_distances", H, I4), arguments: [h3, k] as const, result: diskDistance });
  const gridRingUnsafe = createSqlRows({ ...tables, name: "h3_grid_ring_unsafe", member: id("h3_grid_ring_unsafe", H, I4), arguments: [h3, k] as const, result: h3 });
  const gridPathCells = createSqlRows({ ...tables, name: "h3_grid_path_cells", member: id("h3_grid_path_cells", H, H), arguments: [h3, h3] as const, result: h3 });
  const gridDistance = createSqlFunction({ ...tables, name: "h3_grid_distance", member: id("h3_grid_distance", H, H), arguments: [h3, h3] as const, result: int8 });
  const cellToLocalIj = createSqlFunction({ ...tables, name: "h3_cell_to_local_ij", member: id("h3_cell_to_local_ij", H, H), arguments: [h3, h3] as const, result: localIj });
  const localIjToCell = createSqlFunction({ ...tables, name: "h3_local_ij_to_cell", member: id("h3_local_ij_to_cell", H, P), arguments: [h3, localIj] as const, result: h3 });
  // Hierarchy: the one-argument overloads use the adjacent resolution.
  const cellToParentAdjacent = createSqlFunction({ ...tables, name: "h3_cell_to_parent", member: id("h3_cell_to_parent", H), arguments: [h3] as const, result: h3 });
  const cellToParentResolution = createSqlFunction({ ...tables, name: "h3_cell_to_parent", member: id("h3_cell_to_parent", H, I4), arguments: [h3, int4] as const, result: h3 });
  const cellToChildrenAdjacent = createSqlRows({ ...tables, name: "h3_cell_to_children", member: id("h3_cell_to_children", H), arguments: [h3] as const, result: h3 });
  const cellToChildrenResolution = createSqlRows({ ...tables, name: "h3_cell_to_children", member: id("h3_cell_to_children", H, I4), arguments: [h3, int4] as const, result: h3 });
  const cellToCenterChildAdjacent = createSqlFunction({ ...tables, name: "h3_cell_to_center_child", member: id("h3_cell_to_center_child", H), arguments: [h3] as const, result: h3 });
  const cellToCenterChildResolution = createSqlFunction({ ...tables, name: "h3_cell_to_center_child", member: id("h3_cell_to_center_child", H, I4), arguments: [h3, int4] as const, result: h3 });
  const compactCells = createSqlRows({ ...tables, name: "h3_compact_cells", member: id("h3_compact_cells", A), arguments: [cells] as const, result: h3 });
  const uncompactCellsAdjacent = createSqlRows({ ...tables, name: "h3_uncompact_cells", member: id("h3_uncompact_cells", A), arguments: [cells] as const, result: h3 });
  const uncompactCellsResolution = createSqlRows({ ...tables, name: "h3_uncompact_cells", member: id("h3_uncompact_cells", A, I4), arguments: [cells, int4] as const, result: h3 });
  const cellToChildPos = createSqlFunction({ ...tables, name: "h3_cell_to_child_pos", member: id("h3_cell_to_child_pos", H, I4), arguments: [h3, int4] as const, result: int8 });
  const childPosToCell = createSqlFunction({ ...tables, name: "h3_child_pos_to_cell", member: id("h3_child_pos_to_cell", I8, H, I4), arguments: [int8, h3, int4] as const, result: h3 });
  const cellToChildrenSlowAdjacent = createSqlRows({ ...session, name: "h3_cell_to_children_slow", member: id("h3_cell_to_children_slow", H), arguments: [h3] as const, result: h3 });
  const cellToChildrenSlowResolution = createSqlRows({ ...session, name: "h3_cell_to_children_slow", member: id("h3_cell_to_children_slow", H, I4), arguments: [h3, int4] as const, result: h3 });
  const childrenAux = createSqlRows({ ...session, name: "__h3_cell_to_children_aux", member: id("__h3_cell_to_children_aux", H, I4, I4), arguments: [h3, int4, int4] as const, result: h3 });
  // Regions (not strict: a NULL exterior yields no rows).
  const resolution = defaultSqlArgument(int4, "resolution");
  const polygonToCells = createSqlRows({ ...tables, name: "h3_polygon_to_cells", member: id("h3_polygon_to_cells", "pg_catalog.polygon", "pg_catalog._polygon", I4), arguments: [polygon, holes, resolution] as const, result: h3 });
  const polygonToCellsExperimental = createSqlRows({ ...tables, name: "h3_polygon_to_cells_experimental", member: id("h3_polygon_to_cells_experimental", "pg_catalog.polygon", "pg_catalog._polygon", I4, T), arguments: [polygon, holes, resolution, defaultSqlArgument(mode, "containment_mode")] as const, result: h3 });
  const cellsToMultiPolygonRows = createSqlRows({ ...tables, name: "h3_cells_to_multi_polygon", member: id("h3_cells_to_multi_polygon", A), arguments: [cells] as const, result: h3MultiPolygonPartCodec });
  /** h3-pg 4.2.3 dereferences an empty outline and terminates the backend; literal empty arrays are refused. */
  const cellsToMultiPolygon = (values: ExtensionSqlInput<typeof cells>) => {
    if (v.is(v.object({ values: v.array(v.unknown()) }), values) && !values.values.length)
      throw new Error("h3_cells_to_multi_polygon requires at least one array element");
    return cellsToMultiPolygonRows(values);
  };
  // Directed edges.
  const areNeighborCells = createSqlFunction({ ...tables, name: "h3_are_neighbor_cells", member: id("h3_are_neighbor_cells", H, H), arguments: [h3, h3] as const, result: bool });
  const cellsToDirectedEdge = createSqlFunction({ ...tables, name: "h3_cells_to_directed_edge", member: id("h3_cells_to_directed_edge", H, H), arguments: [h3, h3] as const, result: h3 });
  const isValidDirectedEdge = createSqlFunction({ ...tables, name: "h3_is_valid_directed_edge", member: id("h3_is_valid_directed_edge", H), arguments: [h3] as const, result: bool });
  const getDirectedEdgeOrigin = createSqlFunction({ ...tables, name: "h3_get_directed_edge_origin", member: id("h3_get_directed_edge_origin", H), arguments: [h3] as const, result: h3 });
  const getDirectedEdgeDestination = createSqlFunction({ ...tables, name: "h3_get_directed_edge_destination", member: id("h3_get_directed_edge_destination", H), arguments: [h3] as const, result: h3 });
  const directedEdgeToCells = createSqlFunction({ ...tables, name: "h3_directed_edge_to_cells", member: id("h3_directed_edge_to_cells", H), arguments: [h3] as const, result: edgeCells });
  const originToDirectedEdges = createSqlRows({ ...tables, name: "h3_origin_to_directed_edges", member: id("h3_origin_to_directed_edges", H), arguments: [h3] as const, result: h3 });
  const directedEdgeToBoundary = createSqlFunction({ ...tables, name: "h3_directed_edge_to_boundary", member: id("h3_directed_edge_to_boundary", H), arguments: [h3] as const, result: latFirstPolygon });
  // Vertexes.
  const cellToVertex = createSqlFunction({ ...tables, name: "h3_cell_to_vertex", member: id("h3_cell_to_vertex", H, I4), arguments: [h3, int4] as const, result: h3 });
  const cellToVertexes = createSqlRows({ ...tables, name: "h3_cell_to_vertexes", member: id("h3_cell_to_vertexes", H), arguments: [h3] as const, result: h3 });
  const vertexToLatlng = createSqlFunction({ ...tables, name: "h3_vertex_to_latlng", member: id("h3_vertex_to_latlng", H), arguments: [h3] as const, result: latLng });
  const vertexToLatLngDeprecated = createSqlFunction({ ...tables, name: "h3_vertex_to_lat_lng", member: id("h3_vertex_to_lat_lng", H), arguments: [h3] as const, result: latLng });
  const isValidVertex = createSqlFunction({ ...tables, name: "h3_is_valid_vertex", member: id("h3_is_valid_vertex", H), arguments: [h3] as const, result: bool });
  // Miscellaneous measures.
  const greatCircleDistance = createSqlFunction({ ...tables, name: "h3_great_circle_distance", member: id("h3_great_circle_distance", P, P, T), arguments: [latLng, latLng, defaultSqlArgument(length, "unit")] as const, result: float8 });
  const getHexagonAreaAvg = createSqlFunction({ ...tables, name: "h3_get_hexagon_area_avg", member: id("h3_get_hexagon_area_avg", I4, T), arguments: [int4, defaultSqlArgument(average, "unit")] as const, result: float8 });
  const cellArea = createSqlFunction({ ...tables, name: "h3_cell_area", member: id("h3_cell_area", H, T), arguments: [h3, defaultSqlArgument(area, "unit")] as const, result: float8 });
  const getHexagonEdgeLengthAvg = createSqlFunction({ ...tables, name: "h3_get_hexagon_edge_length_avg", member: id("h3_get_hexagon_edge_length_avg", I4, T), arguments: [int4, defaultSqlArgument(average, "unit")] as const, result: float8 });
  const edgeLength = createSqlFunction({ ...tables, name: "h3_edge_length", member: id("h3_edge_length", H, T), arguments: [h3, defaultSqlArgument(length, "unit")] as const, result: float8 });
  const getNumCells = createSqlFunction({ ...tables, name: "h3_get_num_cells", member: id("h3_get_num_cells", I4), arguments: [int4] as const, result: int8 });
  const getRes0Cells = createSqlRows({ ...tables, name: "h3_get_res_0_cells", member: id("h3_get_res_0_cells"), arguments: [] as const, result: h3 });
  const getPentagons = createSqlRows({ ...tables, name: "h3_get_pentagons", member: id("h3_get_pentagons", I4), arguments: [int4] as const, result: h3 });
  const extensionVersion = createSqlFunction({ ...tables, name: "h3_get_extension_version", member: id("h3_get_extension_version"), arguments: [] as const, result: text });
  // Type support routines callable from SQL.
  const h3indexSend = createSqlFunction({ ...tables, name: "h3index_send", member: id("h3index_send", H), arguments: [h3] as const, result: bytes });
  const h3indexToBigint = createSqlFunction({ ...tables, name: "h3index_to_bigint", member: id("h3index_to_bigint", H), arguments: [h3] as const, result: int8 });
  const bigintToH3index = createSqlFunction({ ...tables, name: "bigint_to_h3index", member: id("bigint_to_h3index", I8), arguments: [int8] as const, result: h3 });
  const h3indexCmp = createSqlFunction({ ...tables, name: "h3index_cmp", member: id("h3index_cmp", H, H), arguments: [h3, h3] as const, result: int4 });
  const h3indexHash = createSqlFunction({ ...tables, name: "h3index_hash", member: id("h3index_hash", H), arguments: [h3] as const, result: int4 });
  const h3indexHashExtended = createSqlFunction({ ...tables, name: "h3index_hash_extended", member: id("h3index_hash_extended", H, I8), arguments: [h3, int8] as const, result: int8 });
  const pairRoutine = <Result extends AnyCodec>(name: string, result: Result) =>
    createSqlFunction({ ...tables, name, member: id(name, H, H), arguments: [h3, h3] as const, result });
  const h3indexEq = pairRoutine("h3index_eq", bool),
    h3indexNe = pairRoutine("h3index_ne", bool),
    h3indexLt = pairRoutine("h3index_lt", bool),
    h3indexLe = pairRoutine("h3index_le", bool),
    h3indexGt = pairRoutine("h3index_gt", bool),
    h3indexGe = pairRoutine("h3index_ge", bool),
    h3indexDistance = pairRoutine("h3index_distance", int8),
    h3indexOverlaps = pairRoutine("h3index_overlaps", bool),
    h3indexContains = pairRoutine("h3index_contains", bool),
    h3indexContainedBy = pairRoutine("h3index_contained_by", bool);
  const operator = <Result extends AnyCodec>(name: string, result: Result) =>
    createSqlOperator({ ...tables, name, member: `operator:$extension:h3.${name}(${H},${H})`, left: h3, right: h3, result });
  const equal = operator("=", bool),
    notEqual = operator("<>", bool),
    lessThan = operator("<", bool),
    lessOrEqual = operator("<=", bool),
    greaterThan = operator(">", bool),
    greaterOrEqual = operator(">=", bool),
    distance = operator("<->", int8),
    overlaps = operator("&&", bool),
    contains = operator("@>", bool),
    containedBy = operator("<@", bool);
  function cast<Input, Source, TargetInput, Target>(
    source: ExtensionCodec<Input, Source>,
    target: ExtensionCodec<TargetInput, Target>,
    member: string,
  ) {
    return (value: ExtensionSqlInput<typeof source>) => {
      const expression =
        is(value, SQL.Aliased) && !v.is(v.object({ isSelectionField: v.literal(true) }), value) ? value.sql : value;
      const native = v.is(sqlWrapper, expression)
        ? sql`${expression}`
        : // SAFETY: SQLWrapper is checked first; every other typed argument is codec input and encode validates it before binding.
          sql`${sql.param(source.encode(value as Input))}`;
      const from = source.sqlType!,
        to = target.sqlType!;
      return checkedExtensionExpression(
        sql`((${native})::${extensionSqlType(from.schema, from.name)})::${extensionSqlType(to.schema, to.name)}`,
        target,
        [],
        undefined,
        member,
      );
    };
  }
  const casts = Object.freeze({
    h3index_to_int8: cast(h3, int8, `cast:${H}->${I8}`),
    int8_to_h3index: cast(int8, h3, `cast:${I8}->${H}`),
    h3index_to_point: cast(h3, latLng, `cast:${H}->${P}`),
  });

  /** Overload pairs keep both captured identities; the shorter call selects the first. */
  function byArity<One extends (...values: never[]) => SQL, Two extends (...values: never[]) => SQL>(
    arity: number,
    one: One,
    two: Two,
  ): One & Two {
    const call = (...values: never[]) => (values.length <= arity ? one(...values) : two(...values));
    // SAFETY: argument count selects exactly one captured overload, and that overload validates its own arguments.
    return call as One & Two;
  }
  const cellToParent = byArity(1, cellToParentAdjacent, cellToParentResolution);
  const cellToChildren = byArity(1, cellToChildrenAdjacent, cellToChildrenResolution);
  const cellToCenterChild = byArity(1, cellToCenterChildAdjacent, cellToCenterChildResolution);
  const uncompactCells = byArity(1, uncompactCellsAdjacent, uncompactCellsResolution);
  const cellToChildrenSlow = byArity(1, cellToChildrenSlowAdjacent, cellToChildrenSlowResolution);
  /** Without the flag, native output follows the session's h3.extend_antimeridian setting. */
  const cellToBoundary = byArity(1, cellToBoundarySession, cellToBoundaryFlag);

  const functions = Object.freeze({
    __h3_cell_to_children_aux: childrenAux,
    bigint_to_h3index: bigintToH3index,
    h3_are_neighbor_cells: areNeighborCells,
    h3_cell_area: cellArea,
    h3_cell_to_boundary: Object.freeze({ session: cellToBoundarySession, extendAntimeridian: cellToBoundaryFlag }),
    h3_cell_to_center_child: Object.freeze({ adjacent: cellToCenterChildAdjacent, resolution: cellToCenterChildResolution }),
    h3_cell_to_child_pos: cellToChildPos,
    h3_cell_to_children: Object.freeze({ adjacent: cellToChildrenAdjacent, resolution: cellToChildrenResolution }),
    h3_cell_to_children_slow: Object.freeze({ adjacent: cellToChildrenSlowAdjacent, resolution: cellToChildrenSlowResolution }),
    h3_cell_to_lat_lng: cellToLatLngDeprecated,
    h3_cell_to_latlng: cellToLatlng,
    h3_cell_to_local_ij: cellToLocalIj,
    h3_cell_to_parent: Object.freeze({ adjacent: cellToParentAdjacent, resolution: cellToParentResolution }),
    h3_cell_to_vertex: cellToVertex,
    h3_cell_to_vertexes: cellToVertexes,
    h3_cells_to_directed_edge: cellsToDirectedEdge,
    h3_cells_to_multi_polygon: cellsToMultiPolygon,
    h3_child_pos_to_cell: childPosToCell,
    h3_compact_cells: compactCells,
    h3_directed_edge_to_boundary: directedEdgeToBoundary,
    h3_directed_edge_to_cells: directedEdgeToCells,
    h3_edge_length: edgeLength,
    h3_get_base_cell_number: getBaseCellNumber,
    h3_get_directed_edge_destination: getDirectedEdgeDestination,
    h3_get_directed_edge_origin: getDirectedEdgeOrigin,
    h3_get_extension_version: extensionVersion,
    h3_get_hexagon_area_avg: getHexagonAreaAvg,
    h3_get_hexagon_edge_length_avg: getHexagonEdgeLengthAvg,
    h3_get_icosahedron_faces: getIcosahedronFaces,
    h3_get_num_cells: getNumCells,
    h3_get_pentagons: getPentagons,
    h3_get_res_0_cells: getRes0Cells,
    h3_get_resolution: getResolution,
    h3_great_circle_distance: greatCircleDistance,
    h3_grid_disk: gridDisk,
    h3_grid_disk_distances: gridDiskDistances,
    h3_grid_distance: gridDistance,
    h3_grid_path_cells: gridPathCells,
    h3_grid_ring_unsafe: gridRingUnsafe,
    h3_is_pentagon: isPentagon,
    h3_is_res_class_iii: isResClassIii,
    h3_is_valid_cell: isValidCell,
    h3_is_valid_directed_edge: isValidDirectedEdge,
    h3_is_valid_vertex: isValidVertex,
    h3_lat_lng_to_cell: latLngToCellDeprecated,
    h3_latlng_to_cell: latlngToCell,
    h3_local_ij_to_cell: localIjToCell,
    h3_origin_to_directed_edges: originToDirectedEdges,
    h3_polygon_to_cells: polygonToCells,
    h3_polygon_to_cells_experimental: polygonToCellsExperimental,
    h3_uncompact_cells: Object.freeze({ adjacent: uncompactCellsAdjacent, resolution: uncompactCellsResolution }),
    h3_vertex_to_lat_lng: vertexToLatLngDeprecated,
    h3_vertex_to_latlng: vertexToLatlng,
    h3index_cmp: h3indexCmp,
    h3index_contained_by: h3indexContainedBy,
    h3index_contains: h3indexContains,
    h3index_distance: h3indexDistance,
    h3index_eq: h3indexEq,
    h3index_ge: h3indexGe,
    h3index_gt: h3indexGt,
    h3index_hash: h3indexHash,
    h3index_hash_extended: h3indexHashExtended,
    h3index_le: h3indexLe,
    h3index_lt: h3indexLt,
    h3index_ne: h3indexNe,
    h3index_overlaps: h3indexOverlaps,
    h3index_send: h3indexSend,
    h3index_to_bigint: h3indexToBigint,
  });
  const operators = Object.freeze({
    "=": equal,
    "<>": notEqual,
    "<": lessThan,
    "<=": lessOrEqual,
    ">": greaterThan,
    ">=": greaterOrEqual,
    "<->": distance,
    "&&": overlaps,
    "@>": contains,
    "<@": containedBy,
  });
  const overloads = Object.freeze({
    "routine:$extension:h3.__h3_cell_to_children_aux($extension:h3.h3index,pg_catalog.int4,pg_catalog.int4)": childrenAux,
    "routine:$extension:h3.bigint_to_h3index(pg_catalog.int8)": bigintToH3index,
    "routine:$extension:h3.h3_are_neighbor_cells($extension:h3.h3index,$extension:h3.h3index)": areNeighborCells,
    "routine:$extension:h3.h3_cell_area($extension:h3.h3index,pg_catalog.text)": cellArea,
    "routine:$extension:h3.h3_cell_to_boundary($extension:h3.h3index,pg_catalog.bool)": cellToBoundaryFlag,
    "routine:$extension:h3.h3_cell_to_boundary($extension:h3.h3index)": cellToBoundarySession,
    "routine:$extension:h3.h3_cell_to_center_child($extension:h3.h3index,pg_catalog.int4)": cellToCenterChildResolution,
    "routine:$extension:h3.h3_cell_to_center_child($extension:h3.h3index)": cellToCenterChildAdjacent,
    "routine:$extension:h3.h3_cell_to_child_pos($extension:h3.h3index,pg_catalog.int4)": cellToChildPos,
    "routine:$extension:h3.h3_cell_to_children_slow($extension:h3.h3index,pg_catalog.int4)": cellToChildrenSlowResolution,
    "routine:$extension:h3.h3_cell_to_children_slow($extension:h3.h3index)": cellToChildrenSlowAdjacent,
    "routine:$extension:h3.h3_cell_to_children($extension:h3.h3index,pg_catalog.int4)": cellToChildrenResolution,
    "routine:$extension:h3.h3_cell_to_children($extension:h3.h3index)": cellToChildrenAdjacent,
    "routine:$extension:h3.h3_cell_to_lat_lng($extension:h3.h3index)": cellToLatLngDeprecated,
    "routine:$extension:h3.h3_cell_to_latlng($extension:h3.h3index)": cellToLatlng,
    "routine:$extension:h3.h3_cell_to_local_ij($extension:h3.h3index,$extension:h3.h3index)": cellToLocalIj,
    "routine:$extension:h3.h3_cell_to_parent($extension:h3.h3index,pg_catalog.int4)": cellToParentResolution,
    "routine:$extension:h3.h3_cell_to_parent($extension:h3.h3index)": cellToParentAdjacent,
    "routine:$extension:h3.h3_cell_to_vertex($extension:h3.h3index,pg_catalog.int4)": cellToVertex,
    "routine:$extension:h3.h3_cell_to_vertexes($extension:h3.h3index)": cellToVertexes,
    "routine:$extension:h3.h3_cells_to_directed_edge($extension:h3.h3index,$extension:h3.h3index)": cellsToDirectedEdge,
    "routine:$extension:h3.h3_cells_to_multi_polygon($extension:h3._h3index)": cellsToMultiPolygon,
    "routine:$extension:h3.h3_child_pos_to_cell(pg_catalog.int8,$extension:h3.h3index,pg_catalog.int4)": childPosToCell,
    "routine:$extension:h3.h3_compact_cells($extension:h3._h3index)": compactCells,
    "routine:$extension:h3.h3_directed_edge_to_boundary($extension:h3.h3index)": directedEdgeToBoundary,
    "routine:$extension:h3.h3_directed_edge_to_cells($extension:h3.h3index)": directedEdgeToCells,
    "routine:$extension:h3.h3_edge_length($extension:h3.h3index,pg_catalog.text)": edgeLength,
    "routine:$extension:h3.h3_get_base_cell_number($extension:h3.h3index)": getBaseCellNumber,
    "routine:$extension:h3.h3_get_directed_edge_destination($extension:h3.h3index)": getDirectedEdgeDestination,
    "routine:$extension:h3.h3_get_directed_edge_origin($extension:h3.h3index)": getDirectedEdgeOrigin,
    "routine:$extension:h3.h3_get_extension_version()": extensionVersion,
    "routine:$extension:h3.h3_get_hexagon_area_avg(pg_catalog.int4,pg_catalog.text)": getHexagonAreaAvg,
    "routine:$extension:h3.h3_get_hexagon_edge_length_avg(pg_catalog.int4,pg_catalog.text)": getHexagonEdgeLengthAvg,
    "routine:$extension:h3.h3_get_icosahedron_faces($extension:h3.h3index)": getIcosahedronFaces,
    "routine:$extension:h3.h3_get_num_cells(pg_catalog.int4)": getNumCells,
    "routine:$extension:h3.h3_get_pentagons(pg_catalog.int4)": getPentagons,
    "routine:$extension:h3.h3_get_res_0_cells()": getRes0Cells,
    "routine:$extension:h3.h3_get_resolution($extension:h3.h3index)": getResolution,
    "routine:$extension:h3.h3_great_circle_distance(pg_catalog.point,pg_catalog.point,pg_catalog.text)": greatCircleDistance,
    "routine:$extension:h3.h3_grid_disk_distances($extension:h3.h3index,pg_catalog.int4)": gridDiskDistances,
    "routine:$extension:h3.h3_grid_disk($extension:h3.h3index,pg_catalog.int4)": gridDisk,
    "routine:$extension:h3.h3_grid_distance($extension:h3.h3index,$extension:h3.h3index)": gridDistance,
    "routine:$extension:h3.h3_grid_path_cells($extension:h3.h3index,$extension:h3.h3index)": gridPathCells,
    "routine:$extension:h3.h3_grid_ring_unsafe($extension:h3.h3index,pg_catalog.int4)": gridRingUnsafe,
    "routine:$extension:h3.h3_is_pentagon($extension:h3.h3index)": isPentagon,
    "routine:$extension:h3.h3_is_res_class_iii($extension:h3.h3index)": isResClassIii,
    "routine:$extension:h3.h3_is_valid_cell($extension:h3.h3index)": isValidCell,
    "routine:$extension:h3.h3_is_valid_directed_edge($extension:h3.h3index)": isValidDirectedEdge,
    "routine:$extension:h3.h3_is_valid_vertex($extension:h3.h3index)": isValidVertex,
    "routine:$extension:h3.h3_lat_lng_to_cell(pg_catalog.point,pg_catalog.int4)": latLngToCellDeprecated,
    "routine:$extension:h3.h3_latlng_to_cell(pg_catalog.point,pg_catalog.int4)": latlngToCell,
    "routine:$extension:h3.h3_local_ij_to_cell($extension:h3.h3index,pg_catalog.point)": localIjToCell,
    "routine:$extension:h3.h3_origin_to_directed_edges($extension:h3.h3index)": originToDirectedEdges,
    "routine:$extension:h3.h3_polygon_to_cells_experimental(pg_catalog.polygon,pg_catalog._polygon,pg_catalog.int4,pg_catalog.text)": polygonToCellsExperimental,
    "routine:$extension:h3.h3_polygon_to_cells(pg_catalog.polygon,pg_catalog._polygon,pg_catalog.int4)": polygonToCells,
    "routine:$extension:h3.h3_uncompact_cells($extension:h3._h3index,pg_catalog.int4)": uncompactCellsResolution,
    "routine:$extension:h3.h3_uncompact_cells($extension:h3._h3index)": uncompactCellsAdjacent,
    "routine:$extension:h3.h3_vertex_to_lat_lng($extension:h3.h3index)": vertexToLatLngDeprecated,
    "routine:$extension:h3.h3_vertex_to_latlng($extension:h3.h3index)": vertexToLatlng,
    "routine:$extension:h3.h3index_cmp($extension:h3.h3index,$extension:h3.h3index)": h3indexCmp,
    "routine:$extension:h3.h3index_contained_by($extension:h3.h3index,$extension:h3.h3index)": h3indexContainedBy,
    "routine:$extension:h3.h3index_contains($extension:h3.h3index,$extension:h3.h3index)": h3indexContains,
    "routine:$extension:h3.h3index_distance($extension:h3.h3index,$extension:h3.h3index)": h3indexDistance,
    "routine:$extension:h3.h3index_eq($extension:h3.h3index,$extension:h3.h3index)": h3indexEq,
    "routine:$extension:h3.h3index_ge($extension:h3.h3index,$extension:h3.h3index)": h3indexGe,
    "routine:$extension:h3.h3index_gt($extension:h3.h3index,$extension:h3.h3index)": h3indexGt,
    "routine:$extension:h3.h3index_hash_extended($extension:h3.h3index,pg_catalog.int8)": h3indexHashExtended,
    "routine:$extension:h3.h3index_hash($extension:h3.h3index)": h3indexHash,
    "routine:$extension:h3.h3index_le($extension:h3.h3index,$extension:h3.h3index)": h3indexLe,
    "routine:$extension:h3.h3index_lt($extension:h3.h3index,$extension:h3.h3index)": h3indexLt,
    "routine:$extension:h3.h3index_ne($extension:h3.h3index,$extension:h3.h3index)": h3indexNe,
    "routine:$extension:h3.h3index_overlaps($extension:h3.h3index,$extension:h3.h3index)": h3indexOverlaps,
    "routine:$extension:h3.h3index_send($extension:h3.h3index)": h3indexSend,
    "routine:$extension:h3.h3index_to_bigint($extension:h3.h3index)": h3indexToBigint,
    "operator:$extension:h3.=($extension:h3.h3index,$extension:h3.h3index)": equal,
    "operator:$extension:h3.<>($extension:h3.h3index,$extension:h3.h3index)": notEqual,
    "operator:$extension:h3.<($extension:h3.h3index,$extension:h3.h3index)": lessThan,
    "operator:$extension:h3.<=($extension:h3.h3index,$extension:h3.h3index)": lessOrEqual,
    "operator:$extension:h3.>($extension:h3.h3index,$extension:h3.h3index)": greaterThan,
    "operator:$extension:h3.>=($extension:h3.h3index,$extension:h3.h3index)": greaterOrEqual,
    "operator:$extension:h3.<->($extension:h3.h3index,$extension:h3.h3index)": distance,
    "operator:$extension:h3.&&($extension:h3.h3index,$extension:h3.h3index)": overlaps,
    "operator:$extension:h3.@>($extension:h3.h3index,$extension:h3.h3index)": contains,
    "operator:$extension:h3.<@($extension:h3.h3index,$extension:h3.h3index)": containedBy,
    "cast:$extension:h3.h3index->pg_catalog.int8": casts.h3index_to_int8,
    "cast:pg_catalog.int8->$extension:h3.h3index": casts.int8_to_h3index,
    "cast:$extension:h3.h3index->pg_catalog.point": casts.h3index_to_point,
  });

  const value: ExtensionValueSchema = { kind: "string", pattern: h3IndexPattern };
  let nested: ExtensionValueSchema = { kind: "union", variants: [value, { kind: "null" }] };
  const depths: ExtensionValueSchema[] = [];
  for (let rank = 0; rank < 6; rank++) {
    nested = { kind: "array", items: nested };
    depths.push(nested);
  }
  const arrayValue: ExtensionValueSchema = {
    kind: "object",
    properties: {
      dimensions: {
        kind: "array",
        items: {
          kind: "object",
          properties: {
            lowerBound: { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 },
            length: { kind: "number", integer: true, minimum: 1, maximum: 2147483647 },
          },
        },
      },
      values: { kind: "union", variants: depths },
    },
  };
  const qualified = (name: string) =>
    Object.freeze({ member: `operator:$extension:h3.${name}(${H},${H})`, schema, name, operand: "field" as const });
  const field = () =>
    createExtensionField({
      extension: descriptor,
      member: `type:${H}`,
      type: "h3index",
      codec,
      value,
      search: { filter: true, comparison: true, order: true, text: false } as const,
      operators: {
        eq: qualified("="),
        ne: qualified("<>"),
        lt: qualified("<"),
        lte: qualified("<="),
        gt: qualified(">"),
        gte: qualified(">="),
      },
    });
  const arrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: `type:${A}`,
      type: "h3index",
      array: true,
      codec: arrayValueCodec,
      value: arrayValue,
      search: { filter: false, comparison: false, order: false, text: false } as const,
    });
  const index = (method: "btree" | "hash" | "brin" | "spgist", opclass: string, isDefault: boolean) =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: `opclass:$extension:h3.${opclass}/${method}`,
        method,
        opclass,
        type: "h3index",
        ...(isDefault && { default: true }),
      }),
      input: Object.freeze({ schema, type: "h3index", dimensions: 0 }),
    });
  const indexes = Object.freeze({
    btree: () => index("btree", "h3index_ops", true),
    hash: () => index("hash", "h3index_ops", true),
    brin: () => index("brin", "h3index_minmax_ops", true),
    /** Not a default class: name it explicitly; native support is h3-pg's experimental hierarchy SP-GiST. */
    spgist: () => index("spgist", "h3index_ops_experimental", false),
  });

  return bindExtension(descriptor, {
    codec,
    arrayCodec: arrayValueCodec,
    latLngCodec: h3LatLngCodec,
    localIjCodec: h3LocalIjCodec,
    polygonCodec: h3PolygonCodec,
    field,
    arrayField,
    indexes,
    latLngToCell: latlngToCell,
    cellToLatLng: cellToLatlng,
    cellToBoundary,
    getResolution,
    getBaseCellNumber,
    isValidCell,
    isResClassIii,
    isPentagon,
    getIcosahedronFaces,
    gridDisk,
    gridDiskDistances,
    gridRingUnsafe,
    gridPathCells,
    gridDistance,
    cellToLocalIj,
    localIjToCell,
    cellToParent,
    cellToChildren,
    cellToCenterChild,
    compactCells,
    uncompactCells,
    cellToChildPos,
    childPosToCell,
    cellToChildrenSlow,
    polygonToCells,
    polygonToCellsExperimental,
    cellsToMultiPolygon,
    areNeighborCells,
    cellsToDirectedEdge,
    isValidDirectedEdge,
    getDirectedEdgeOrigin,
    getDirectedEdgeDestination,
    directedEdgeToCells,
    originToDirectedEdges,
    directedEdgeToBoundary,
    cellToVertex,
    cellToVertexes,
    vertexToLatLng: vertexToLatlng,
    isValidVertex,
    greatCircleDistance,
    getHexagonAreaAvg,
    cellArea,
    getHexagonEdgeLengthAvg,
    edgeLength,
    getNumCells,
    getRes0Cells,
    getPentagons,
    extensionVersion,
    equal,
    notEqual,
    lessThan,
    lessOrEqual,
    greaterThan,
    greaterOrEqual,
    distance,
    overlaps,
    contains,
    containedBy,
    sql: Object.freeze({ functions, operators, casts, overloads }),
  });
}
