import { sql, type SQL } from "drizzle-orm";
import {
  createH3_4_2_3,
  h3Index,
  type H3Index,
  type H3LatLng,
  type H3LocalIj,
  type H3Polygon,
  type NonfiniteNumber,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/h3";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
const api = createH3_4_2_3({ name: "h3", version: "4.2.3", schema: 'H3"日本', apiSupport: { status: "verified", digest: "0402a89cff2876378a25b680936da0841125dc5d194c2dad6f006092914ffbaf" } });
const version: "4.2.3" = api.version;
const cell = h3Index("8928308280fffff");
const cells: PostgreSqlArray<H3Index> = { dimensions: [{ lowerBound: 1, length: 1 }], values: [cell] };
const point: H3LatLng = { lng: -122.4089866999972, lat: 37.81331899998324 };
const square: H3Polygon = [point, { lng: -122.4, lat: 37.8 }, { lng: -122.39, lat: 37.81 }];
const schema = defineSchema(() => ({ places: { cell: api.field().notNull(), ring: api.arrayField() } }));
const column: SQL<boolean | null> = api.equal(schema.tables.places.cell, cell);
const ordered: SQL<boolean | null> = api.lessThan(schema.tables.places.cell, "85283083fffffff");
const defaulted: SQL<H3Index | null> = api.gridDisk(cell);
const parent: SQL<H3Index | null> = api.cellToParent(cell);
const explicitParent: SQL<H3Index | null> = api.cellToParent(cell, 5);
const flagged: SQL<H3Polygon | null> = api.cellToBoundary(cell, true);
const meters: SQL<number | NonfiniteNumber | null> = api.cellArea(cell, "m^2");
const mode: SQL<H3Index | null> = api.polygonToCellsExperimental(square, null, 9, "overlapping_bbox");
const bigint: SQL<bigint | null> = api.sql.casts.h3index_to_int8(cell);
const result0: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.__h3_cell_to_children_aux($extension:h3.h3index,pg_catalog.int4,pg_catalog.int4)"](cell, 9, 9);
const result1: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.bigint_to_h3index(pg_catalog.int8)"](1n);
const result2: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3_are_neighbor_cells($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result3: SQL<number | NonfiniteNumber | null> = api.sql.overloads["routine:$extension:h3.h3_cell_area($extension:h3.h3index,pg_catalog.text)"](cell);
const result4: SQL<H3Polygon | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_boundary($extension:h3.h3index,pg_catalog.bool)"](cell, true);
const result5: SQL<H3Polygon | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_boundary($extension:h3.h3index)"](cell);
const result6: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_center_child($extension:h3.h3index,pg_catalog.int4)"](cell, 9);
const result7: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_center_child($extension:h3.h3index)"](cell);
const result8: SQL<bigint | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_child_pos($extension:h3.h3index,pg_catalog.int4)"](cell, 9);
const result9: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_children_slow($extension:h3.h3index,pg_catalog.int4)"](cell, 9);
const result10: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_children_slow($extension:h3.h3index)"](cell);
const result11: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_children($extension:h3.h3index,pg_catalog.int4)"](cell, 9);
const result12: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_children($extension:h3.h3index)"](cell);
const result13: SQL<H3LatLng | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_lat_lng($extension:h3.h3index)"](cell);
const result14: SQL<H3LatLng | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_latlng($extension:h3.h3index)"](cell);
const result15: SQL<H3LocalIj | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_local_ij($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result16: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_parent($extension:h3.h3index,pg_catalog.int4)"](cell, 9);
const result17: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_parent($extension:h3.h3index)"](cell);
const result18: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_vertex($extension:h3.h3index,pg_catalog.int4)"](cell, 9);
const result19: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_cell_to_vertexes($extension:h3.h3index)"](cell);
const result20: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_cells_to_directed_edge($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result21: SQL<{ readonly exterior: H3Polygon; readonly holes: PostgreSqlArray<H3Polygon> }> = api.sql.overloads["routine:$extension:h3.h3_cells_to_multi_polygon($extension:h3._h3index)"](cells);
const result22: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_child_pos_to_cell(pg_catalog.int8,$extension:h3.h3index,pg_catalog.int4)"](1n, cell, 9);
const result23: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_compact_cells($extension:h3._h3index)"](cells);
const result24: SQL<H3Polygon | null> = api.sql.overloads["routine:$extension:h3.h3_directed_edge_to_boundary($extension:h3.h3index)"](cell);
const result25: SQL<{ readonly origin: H3Index | null; readonly destination: H3Index | null }> = api.sql.overloads["routine:$extension:h3.h3_directed_edge_to_cells($extension:h3.h3index)"](cell);
const result26: SQL<number | NonfiniteNumber | null> = api.sql.overloads["routine:$extension:h3.h3_edge_length($extension:h3.h3index,pg_catalog.text)"](cell);
const result27: SQL<number | null> = api.sql.overloads["routine:$extension:h3.h3_get_base_cell_number($extension:h3.h3index)"](cell);
const result28: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_get_directed_edge_destination($extension:h3.h3index)"](cell);
const result29: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_get_directed_edge_origin($extension:h3.h3index)"](cell);
const result30: SQL<string | null> = api.sql.overloads["routine:$extension:h3.h3_get_extension_version()"]();
const result31: SQL<number | NonfiniteNumber | null> = api.sql.overloads["routine:$extension:h3.h3_get_hexagon_area_avg(pg_catalog.int4,pg_catalog.text)"](9);
const result32: SQL<number | NonfiniteNumber | null> = api.sql.overloads["routine:$extension:h3.h3_get_hexagon_edge_length_avg(pg_catalog.int4,pg_catalog.text)"](9);
const result33: SQL<PostgreSqlArray<number> | null> = api.sql.overloads["routine:$extension:h3.h3_get_icosahedron_faces($extension:h3.h3index)"](cell);
const result34: SQL<bigint | null> = api.sql.overloads["routine:$extension:h3.h3_get_num_cells(pg_catalog.int4)"](9);
const result35: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_get_pentagons(pg_catalog.int4)"](9);
const result36: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_get_res_0_cells()"]();
const result37: SQL<number | null> = api.sql.overloads["routine:$extension:h3.h3_get_resolution($extension:h3.h3index)"](cell);
const result38: SQL<number | NonfiniteNumber | null> = api.sql.overloads["routine:$extension:h3.h3_great_circle_distance(pg_catalog.point,pg_catalog.point,pg_catalog.text)"](point, point);
const result39: SQL<{ readonly index: H3Index | null; readonly distance: number | null }> = api.sql.overloads["routine:$extension:h3.h3_grid_disk_distances($extension:h3.h3index,pg_catalog.int4)"](cell, 9);
const result40: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_grid_disk($extension:h3.h3index,pg_catalog.int4)"](cell, 9);
const result41: SQL<bigint | null> = api.sql.overloads["routine:$extension:h3.h3_grid_distance($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result42: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_grid_path_cells($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result43: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_grid_ring_unsafe($extension:h3.h3index,pg_catalog.int4)"](cell, 9);
const result44: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3_is_pentagon($extension:h3.h3index)"](cell);
const result45: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3_is_res_class_iii($extension:h3.h3index)"](cell);
const result46: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3_is_valid_cell($extension:h3.h3index)"](cell);
const result47: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3_is_valid_directed_edge($extension:h3.h3index)"](cell);
const result48: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3_is_valid_vertex($extension:h3.h3index)"](cell);
const result49: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_lat_lng_to_cell(pg_catalog.point,pg_catalog.int4)"](point, 9);
const result50: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_latlng_to_cell(pg_catalog.point,pg_catalog.int4)"](point, 9);
const result51: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_local_ij_to_cell($extension:h3.h3index,pg_catalog.point)"](cell, { i: 1, j: 2 });
const result52: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_origin_to_directed_edges($extension:h3.h3index)"](cell);
const result53: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_polygon_to_cells_experimental(pg_catalog.polygon,pg_catalog._polygon,pg_catalog.int4,pg_catalog.text)"](square, null, 9);
const result54: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_polygon_to_cells(pg_catalog.polygon,pg_catalog._polygon,pg_catalog.int4)"](square, null, 9);
const result55: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_uncompact_cells($extension:h3._h3index,pg_catalog.int4)"](cells, 9);
const result56: SQL<H3Index | null> = api.sql.overloads["routine:$extension:h3.h3_uncompact_cells($extension:h3._h3index)"](cells);
const result57: SQL<H3LatLng | null> = api.sql.overloads["routine:$extension:h3.h3_vertex_to_lat_lng($extension:h3.h3index)"](cell);
const result58: SQL<H3LatLng | null> = api.sql.overloads["routine:$extension:h3.h3_vertex_to_latlng($extension:h3.h3index)"](cell);
const result59: SQL<number | null> = api.sql.overloads["routine:$extension:h3.h3index_cmp($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result60: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3index_contained_by($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result61: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3index_contains($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result62: SQL<bigint | null> = api.sql.overloads["routine:$extension:h3.h3index_distance($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result63: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3index_eq($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result64: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3index_ge($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result65: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3index_gt($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result66: SQL<bigint | null> = api.sql.overloads["routine:$extension:h3.h3index_hash_extended($extension:h3.h3index,pg_catalog.int8)"](cell, 1n);
const result67: SQL<number | null> = api.sql.overloads["routine:$extension:h3.h3index_hash($extension:h3.h3index)"](cell);
const result68: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3index_le($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result69: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3index_lt($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result70: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3index_ne($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result71: SQL<boolean | null> = api.sql.overloads["routine:$extension:h3.h3index_overlaps($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result72: SQL<{ hex: string } | null> = api.sql.overloads["routine:$extension:h3.h3index_send($extension:h3.h3index)"](cell);
const result73: SQL<bigint | null> = api.sql.overloads["routine:$extension:h3.h3index_to_bigint($extension:h3.h3index)"](cell);
const result74: SQL<boolean | null> = api.sql.overloads["operator:$extension:h3.=($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result75: SQL<boolean | null> = api.sql.overloads["operator:$extension:h3.<>($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result76: SQL<boolean | null> = api.sql.overloads["operator:$extension:h3.<($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result77: SQL<boolean | null> = api.sql.overloads["operator:$extension:h3.<=($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result78: SQL<boolean | null> = api.sql.overloads["operator:$extension:h3.>($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result79: SQL<boolean | null> = api.sql.overloads["operator:$extension:h3.>=($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result80: SQL<bigint | null> = api.sql.overloads["operator:$extension:h3.<->($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result81: SQL<boolean | null> = api.sql.overloads["operator:$extension:h3.&&($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result82: SQL<boolean | null> = api.sql.overloads["operator:$extension:h3.@>($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result83: SQL<boolean | null> = api.sql.overloads["operator:$extension:h3.<@($extension:h3.h3index,$extension:h3.h3index)"](cell, cell);
const result84: SQL<bigint | null> = api.sql.overloads["cast:$extension:h3.h3index->pg_catalog.int8"](cell);
const result85: SQL<H3Index | null> = api.sql.overloads["cast:pg_catalog.int8->$extension:h3.h3index"](1n);
const result86: SQL<H3LatLng | null> = api.sql.overloads["cast:$extension:h3.h3index->pg_catalog.point"](cell);
// @ts-expect-error Unbranded text is not a checked h3index value.
const unbranded: H3Index = "8928308280fffff";
// @ts-expect-error cell area uses squared units.
api.cellArea(cell, "km");
// @ts-expect-error average area accepts only km or m.
api.getHexagonAreaAvg(5, "km^2");
// @ts-expect-error unknown containment mode.
api.polygonToCellsExperimental(square, null, 9, "bbox");
// @ts-expect-error lng/lat points use named coordinates, not x/y.
api.latLngToCell({ x: 1, y: 2 }, 9);
// @ts-expect-error local IJ coordinates are not degrees.
api.localIjToCell(cell, point);
// @ts-expect-error Backend internal callbacks are not public query helpers.
api.sql.functions.h3index_in("8928308280fffff");
// @ts-expect-error The pass-by-reference upgrade tool is not a query helper.
api.sql.functions.h3_pg_migrate_pass_by_reference(cell);
// @ts-expect-error Return codec cannot be chosen by a caller.
api.equal<string>(cell, cell);
// @ts-expect-error Wrong selected version is rejected statically.
createH3_4_2_3({ ...api, version: "4.2.2" });
const _keep = [version, column, ordered, defaulted, parent, explicitParent, flagged, meters, mode, bigint, unbranded, sql, result0, result1, result2, result3, result4, result5, result6, result7, result8, result9, result10, result11, result12, result13, result14, result15, result16, result17, result18, result19, result20, result21, result22, result23, result24, result25, result26, result27, result28, result29, result30, result31, result32, result33, result34, result35, result36, result37, result38, result39, result40, result41, result42, result43, result44, result45, result46, result47, result48, result49, result50, result51, result52, result53, result54, result55, result56, result57, result58, result59, result60, result61, result62, result63, result64, result65, result66, result67, result68, result69, result70, result71, result72, result73, result74, result75, result76, result77, result78, result79, result80, result81, result82, result83, result84, result85, result86];
void _keep;
