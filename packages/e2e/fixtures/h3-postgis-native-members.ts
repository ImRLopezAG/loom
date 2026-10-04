import { type SQL } from "drizzle-orm";
import { createH3Postgis_4_2_3, h3Index, rasterHex } from "kello/extensions/h3-postgis";
import { geographyEwkt, geometryEwkt } from "kello/extensions/postgis";

export const H3_POSTGIS_POINT = "SRID=4326;POINT(-122.4089866999972 37.81331899998324)";
export const H3_POSTGIS_POLYGON =
  "SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))";
export function h3PostgisMemberExpressions(api: Pick<ReturnType<typeof createH3Postgis_4_2_3>, "sql">, hex: string) {
  const rasterValue = rasterHex(hex);
  const cell = h3Index("8928308280fffff");
  const cells = { dimensions: [{ lowerBound: 1, length: 1 }], values: [cell] };
  const geom = geometryEwkt(H3_POSTGIS_POINT);
  const geog = geographyEwkt(H3_POSTGIS_POINT);
  const poly = geometryEwkt(H3_POSTGIS_POLYGON);
  const geogPoly = geographyEwkt(H3_POSTGIS_POLYGON);
  const classItem = { val: 1, count: 1, area: 1 };
  const stats = { count: 1, sum: 1, mean: 1, stddev: 0, min: 1, max: 1 };
  const rasterStats = { ...stats, count: 1n };
  return {
    "cast:$extension:h3.h3index->$extension:postgis.geography": api.sql.casts.h3index_to_geography(cell),
    "cast:$extension:h3.h3index->$extension:postgis.geometry": api.sql.casts.h3index_to_geometry(cell),
    "operator:$extension:h3_postgis.@($extension:postgis.geography,pg_catalog.int4)": api.sql.overloads[
      "operator:$extension:h3_postgis.@($extension:postgis.geography,pg_catalog.int4)"
    ](geog, 9),
    "operator:$extension:h3_postgis.@($extension:postgis.geometry,pg_catalog.int4)": api.sql.overloads[
      "operator:$extension:h3_postgis.@($extension:postgis.geometry,pg_catalog.int4)"
    ](geom, 9),
    "routine:$extension:h3_postgis.__h3_raster_band_nodata($extension:postgis_raster.raster,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_band_nodata($extension:postgis_raster.raster,pg_catalog.int4)"
      ](rasterValue, 1),
    "routine:$extension:h3_postgis.__h3_raster_class_polygon_summary_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_class_polygon_summary_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)"
      ](rasterValue, poly, 8, 1, 1),
    "routine:$extension:h3_postgis.__h3_raster_class_polygon_summary_subpixel($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_class_polygon_summary_subpixel($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"
      ](rasterValue, poly, 8, 1, 1, 1),
    "routine:$extension:h3_postgis.__h3_raster_class_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_class_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)"
      ](rasterValue, 8, 1, 1),
    "routine:$extension:h3_postgis.__h3_raster_class_summary_item_agg_transfn($extension:h3_postgis.h3_raster_class_summary_item,$extension:h3_postgis.h3_raster_class_summary_item)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_class_summary_item_agg_transfn($extension:h3_postgis.h3_raster_class_summary_item,$extension:h3_postgis.h3_raster_class_summary_item)"
      ](classItem, classItem),
    "routine:$extension:h3_postgis.__h3_raster_class_summary_part($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_class_summary_part($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)"
      ](rasterValue, 1, 1),
    "routine:$extension:h3_postgis.__h3_raster_polygon_centroid_cell_area($extension:postgis.geometry,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_polygon_centroid_cell_area($extension:postgis.geometry,pg_catalog.int4)"
      ](poly, 8),
    "routine:$extension:h3_postgis.__h3_raster_polygon_centroid_cell($extension:postgis.geometry,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_polygon_centroid_cell($extension:postgis.geometry,pg_catalog.int4)"
      ](poly, 8),
    "routine:$extension:h3_postgis.__h3_raster_polygon_pixel_area($extension:postgis_raster.raster,$extension:postgis.geometry)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_polygon_pixel_area($extension:postgis_raster.raster,$extension:postgis.geometry)"
      ](rasterValue, poly),
    "routine:$extension:h3_postgis.__h3_raster_polygon_subpixel_cell_values($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_polygon_subpixel_cell_values($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)"
      ](rasterValue, poly, 8, 1),
    "routine:$extension:h3_postgis.__h3_raster_polygon_summary_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_polygon_summary_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)"
      ](rasterValue, poly, 8, 1),
    "routine:$extension:h3_postgis.__h3_raster_polygon_summary_subpixel($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_polygon_summary_subpixel($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)"
      ](rasterValue, poly, 8, 1, 1),
    "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_boundaries_intersects($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_boundaries_intersects($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)"
      ](rasterValue, poly, 8),
    "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_coords_centroid($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_coords_centroid($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)"
      ](rasterValue, poly, 8),
    "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_parts($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_parts($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)"
      ](rasterValue, poly, 8, 1),
    "routine:$extension:h3_postgis.__h3_raster_polygon_to_cells($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_polygon_to_cells($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)"
      ](rasterValue, poly, 8, 1),
    "routine:$extension:h3_postgis.__h3_raster_summary_stats_agg_transfn($extension:h3_postgis.h3_raster_summary_stats,$extension:h3_postgis.h3_raster_summary_stats)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_summary_stats_agg_transfn($extension:h3_postgis.h3_raster_summary_stats,$extension:h3_postgis.h3_raster_summary_stats)"
      ](stats, stats),
    "routine:$extension:h3_postgis.__h3_raster_to_polygon($extension:postgis_raster.raster,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_to_polygon($extension:postgis_raster.raster,pg_catalog.int4)"
      ](rasterValue, 1),
    "routine:$extension:h3_postgis.__h3_raster_to_summary_stats($extension:postgis_raster.summarystats)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.__h3_raster_to_summary_stats($extension:postgis_raster.summarystats)"
      ](rasterStats),
    "routine:$extension:h3_postgis.h3_cell_to_boundary_geography($extension:h3.h3index,pg_catalog.bool)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_cell_to_boundary_geography($extension:h3.h3index,pg_catalog.bool)"
      ](cell, true),
    "routine:$extension:h3_postgis.h3_cell_to_boundary_geography($extension:h3.h3index)":
      api.sql.overloads["routine:$extension:h3_postgis.h3_cell_to_boundary_geography($extension:h3.h3index)"](cell),
    "routine:$extension:h3_postgis.h3_cell_to_boundary_geometry($extension:h3.h3index,pg_catalog.bool)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_cell_to_boundary_geometry($extension:h3.h3index,pg_catalog.bool)"
      ](cell, true),
    "routine:$extension:h3_postgis.h3_cell_to_boundary_geometry($extension:h3.h3index)":
      api.sql.overloads["routine:$extension:h3_postgis.h3_cell_to_boundary_geometry($extension:h3.h3index)"](cell),
    "routine:$extension:h3_postgis.h3_cell_to_boundary_wkb($extension:h3.h3index)":
      api.sql.overloads["routine:$extension:h3_postgis.h3_cell_to_boundary_wkb($extension:h3.h3index)"](cell),
    "routine:$extension:h3_postgis.h3_cell_to_geography($extension:h3.h3index)":
      api.sql.overloads["routine:$extension:h3_postgis.h3_cell_to_geography($extension:h3.h3index)"](cell),
    "routine:$extension:h3_postgis.h3_cell_to_geometry($extension:h3.h3index)":
      api.sql.overloads["routine:$extension:h3_postgis.h3_cell_to_geometry($extension:h3.h3index)"](cell),
    "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3._h3index)":
      api.sql.overloads["routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3._h3index)"](
        cells,
      ),
    "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3.h3index)":
      api.sql.overloads["routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3.h3index)"](
        cell,
      ),
    "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3._h3index)":
      api.sql.overloads["routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3._h3index)"](
        cells,
      ),
    "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3.h3index)":
      api.sql.overloads["routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3.h3index)"](
        cell,
      ),
    "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_wkb($extension:h3._h3index)":
      api.sql.overloads["routine:$extension:h3_postgis.h3_cells_to_multi_polygon_wkb($extension:h3._h3index)"](cells),
    "routine:$extension:h3_postgis.h3_get_resolution_from_tile_zoom(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_get_resolution_from_tile_zoom(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)"
      ](10),
    "routine:$extension:h3_postgis.h3_grid_path_cells_recursive($extension:h3.h3index,$extension:h3.h3index)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_grid_path_cells_recursive($extension:h3.h3index,$extension:h3.h3index)"
      ](cell, cell),
    "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geography,pg_catalog.int4)": api.sql.overloads[
      "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geography,pg_catalog.int4)"
    ](geog, 9),
    "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geometry,pg_catalog.int4)": api.sql.overloads[
      "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geometry,pg_catalog.int4)"
    ](geom, 9),
    "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geography,pg_catalog.int4)": api.sql.overloads[
      "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geography,pg_catalog.int4)"
    ](geog, 9),
    "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geometry,pg_catalog.int4)": api.sql.overloads[
      "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geometry,pg_catalog.int4)"
    ](geom, 9),
    "routine:$extension:h3_postgis.h3_polygon_to_cells_experimental($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_polygon_to_cells_experimental($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)"
      ](geogPoly, 9, "overlapping_bbox"),
    "routine:$extension:h3_postgis.h3_polygon_to_cells_experimental($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_polygon_to_cells_experimental($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)"
      ](poly, 9, "overlapping_bbox"),
    "routine:$extension:h3_postgis.h3_polygon_to_cells($extension:postgis.geography,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_polygon_to_cells($extension:postgis.geography,pg_catalog.int4)"
      ](geogPoly, 9),
    "routine:$extension:h3_postgis.h3_polygon_to_cells($extension:postgis.geometry,pg_catalog.int4)": api.sql.overloads[
      "routine:$extension:h3_postgis.h3_polygon_to_cells($extension:postgis.geometry,pg_catalog.int4)"
    ](poly, 9),
    "routine:$extension:h3_postgis.h3_raster_class_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_raster_class_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"
      ](rasterValue, 8),
    "routine:$extension:h3_postgis.h3_raster_class_summary_clip($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_raster_class_summary_clip($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"
      ](rasterValue, 8),
    "routine:$extension:h3_postgis.h3_raster_class_summary_item_agg($extension:h3_postgis.h3_raster_class_summary_item)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_raster_class_summary_item_agg($extension:h3_postgis.h3_raster_class_summary_item)"
      ](classItem),
    "routine:$extension:h3_postgis.h3_raster_class_summary_item_to_jsonb($extension:h3_postgis.h3_raster_class_summary_item)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_raster_class_summary_item_to_jsonb($extension:h3_postgis.h3_raster_class_summary_item)"
      ](classItem),
    "routine:$extension:h3_postgis.h3_raster_class_summary_subpixel($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_raster_class_summary_subpixel($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"
      ](rasterValue, 8),
    "routine:$extension:h3_postgis.h3_raster_class_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_raster_class_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"
      ](rasterValue, 8),
    "routine:$extension:h3_postgis.h3_raster_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_raster_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"
      ](rasterValue, 8),
    "routine:$extension:h3_postgis.h3_raster_summary_clip($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_raster_summary_clip($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"
      ](rasterValue, 8),
    "routine:$extension:h3_postgis.h3_raster_summary_stats_agg($extension:h3_postgis.h3_raster_summary_stats)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_raster_summary_stats_agg($extension:h3_postgis.h3_raster_summary_stats)"
      ](stats),
    "routine:$extension:h3_postgis.h3_raster_summary_subpixel($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_raster_summary_subpixel($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"
      ](rasterValue, 8),
    "routine:$extension:h3_postgis.h3_raster_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      api.sql.overloads[
        "routine:$extension:h3_postgis.h3_raster_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)"
      ](rasterValue, 8),
  } satisfies { readonly [Key in keyof typeof api.sql.overloads]: SQL };
}

/** Independent native witnesses retained from the exact image's successful 56-member characterization. */
export const h3PostgisNativeWitnesses = {
  "cast:$extension:h3.h3index->$extension:postgis.geography":
    '\'8928308280fffff\'::"custom H3".h3index::"postgis \u5730".geography',
  "cast:$extension:h3.h3index->$extension:postgis.geometry":
    '\'8928308280fffff\'::"custom H3".h3index::"postgis \u5730".geometry',
  "operator:$extension:h3_postgis.@($extension:postgis.geography,pg_catalog.int4)":
    '"postgis \u5730".st_geogfromtext(\'SRID=4326;POINT(-122.4089866999972 37.81331899998324)\') operator("h3 Pg".@) 9',
  "operator:$extension:h3_postgis.@($extension:postgis.geometry,pg_catalog.int4)":
    '"postgis \u5730".st_geomfromewkt(\'SRID=4326;POINT(-122.4089866999972 37.81331899998324)\') operator("h3 Pg".@) 9',
  "routine:$extension:h3_postgis.__h3_raster_band_nodata($extension:postgis_raster.raster,pg_catalog.int4)":
    '"h3 Pg".__h3_raster_band_nodata("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),1)',
  "routine:$extension:h3_postgis.__h3_raster_class_polygon_summary_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)":
    '(SELECT t FROM "h3 Pg".__h3_raster_class_polygon_summary_clip("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),"postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\'),8,1,1) t LIMIT 1)',
  "routine:$extension:h3_postgis.__h3_raster_class_polygon_summary_subpixel($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
    '(SELECT t FROM "h3 Pg".__h3_raster_class_polygon_summary_subpixel("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),"postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\'),8,1,1,1) t LIMIT 1)',
  "routine:$extension:h3_postgis.__h3_raster_class_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)":
    '(SELECT t FROM "h3 Pg".__h3_raster_class_summary_centroids("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),8,1,1) t LIMIT 1)',
  "routine:$extension:h3_postgis.__h3_raster_class_summary_item_agg_transfn($extension:h3_postgis.h3_raster_class_summary_item,$extension:h3_postgis.h3_raster_class_summary_item)":
    '"h3 Pg".__h3_raster_class_summary_item_agg_transfn(ROW(1,1::float8,1::float8)::"h3 Pg".h3_raster_class_summary_item,ROW(1,1::float8,1::float8)::"h3 Pg".h3_raster_class_summary_item)',
  "routine:$extension:h3_postgis.__h3_raster_class_summary_part($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
    '(SELECT t FROM "h3 Pg".__h3_raster_class_summary_part("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),1,1) t LIMIT 1)',
  "routine:$extension:h3_postgis.__h3_raster_polygon_centroid_cell_area($extension:postgis.geometry,pg_catalog.int4)":
    '"h3 Pg".__h3_raster_polygon_centroid_cell_area("postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\'),8)',
  "routine:$extension:h3_postgis.__h3_raster_polygon_centroid_cell($extension:postgis.geometry,pg_catalog.int4)":
    '"h3 Pg".__h3_raster_polygon_centroid_cell("postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\'),8)',
  "routine:$extension:h3_postgis.__h3_raster_polygon_pixel_area($extension:postgis_raster.raster,$extension:postgis.geometry)":
    '"h3 Pg".__h3_raster_polygon_pixel_area("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),"postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\'))',
  "routine:$extension:h3_postgis.__h3_raster_polygon_subpixel_cell_values($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".__h3_raster_polygon_subpixel_cell_values("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),"postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\'),8,1) t LIMIT 1)',
  "routine:$extension:h3_postgis.__h3_raster_polygon_summary_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".__h3_raster_polygon_summary_clip("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),"postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\'),8,1) t LIMIT 1)',
  "routine:$extension:h3_postgis.__h3_raster_polygon_summary_subpixel($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)":
    '(SELECT t FROM "h3 Pg".__h3_raster_polygon_summary_subpixel("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),"postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\'),8,1,1) t LIMIT 1)',
  "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_boundaries_intersects($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".__h3_raster_polygon_to_cell_boundaries_intersects("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),"postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\'),8) t LIMIT 1)',
  "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_coords_centroid($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".__h3_raster_polygon_to_cell_coords_centroid("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),"postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\'),8) t LIMIT 1)',
  "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_parts($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".__h3_raster_polygon_to_cell_parts("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),"postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\'),8,1) t LIMIT 1)',
  "routine:$extension:h3_postgis.__h3_raster_polygon_to_cells($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)":
    '(SELECT t FROM "h3 Pg".__h3_raster_polygon_to_cells("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),"postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\'),8,1) t LIMIT 1)',
  "routine:$extension:h3_postgis.__h3_raster_summary_stats_agg_transfn($extension:h3_postgis.h3_raster_summary_stats,$extension:h3_postgis.h3_raster_summary_stats)":
    '"h3 Pg".__h3_raster_summary_stats_agg_transfn(ROW(1::float8,1::float8,1::float8,0::float8,1::float8,1::float8)::"h3 Pg".h3_raster_summary_stats,ROW(1::float8,1::float8,1::float8,0::float8,1::float8,1::float8)::"h3 Pg".h3_raster_summary_stats)',
  "routine:$extension:h3_postgis.__h3_raster_to_polygon($extension:postgis_raster.raster,pg_catalog.int4)":
    '"h3 Pg".__h3_raster_to_polygon("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),1)',
  "routine:$extension:h3_postgis.__h3_raster_to_summary_stats($extension:postgis_raster.summarystats)":
    '"h3 Pg".__h3_raster_to_summary_stats(ROW(1::int8,1::float8,1::float8,0::float8,1::float8,1::float8)::"postgis \u5730".summarystats)',
  "routine:$extension:h3_postgis.h3_cell_to_boundary_geography($extension:h3.h3index)":
    '"h3 Pg".h3_cell_to_boundary_geography(\'8928308280fffff\'::"custom H3".h3index)',
  "routine:$extension:h3_postgis.h3_cell_to_boundary_geography($extension:h3.h3index,pg_catalog.bool)":
    '"h3 Pg".h3_cell_to_boundary_geography(\'8928308280fffff\'::"custom H3".h3index,true)',
  "routine:$extension:h3_postgis.h3_cell_to_boundary_geometry($extension:h3.h3index)":
    '"h3 Pg".h3_cell_to_boundary_geometry(\'8928308280fffff\'::"custom H3".h3index)',
  "routine:$extension:h3_postgis.h3_cell_to_boundary_geometry($extension:h3.h3index,pg_catalog.bool)":
    '"h3 Pg".h3_cell_to_boundary_geometry(\'8928308280fffff\'::"custom H3".h3index,true)',
  "routine:$extension:h3_postgis.h3_cell_to_boundary_wkb($extension:h3.h3index)":
    '"h3 Pg".h3_cell_to_boundary_wkb(\'8928308280fffff\'::"custom H3".h3index)',
  "routine:$extension:h3_postgis.h3_cell_to_geography($extension:h3.h3index)":
    '"h3 Pg".h3_cell_to_geography(\'8928308280fffff\'::"custom H3".h3index)',
  "routine:$extension:h3_postgis.h3_cell_to_geometry($extension:h3.h3index)":
    '"h3 Pg".h3_cell_to_geometry(\'8928308280fffff\'::"custom H3".h3index)',
  "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3._h3index)":
    '"h3 Pg".h3_cells_to_multi_polygon_geography(ARRAY[\'8928308280fffff\'::"custom H3".h3index]::"custom H3".h3index[])',
  "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3.h3index)":
    '(SELECT "h3 Pg".h3_cells_to_multi_polygon_geography(c) FROM (VALUES (\'8928308280fffff\'::"custom H3".h3index)) v(c))',
  "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3._h3index)":
    '"h3 Pg".h3_cells_to_multi_polygon_geometry(ARRAY[\'8928308280fffff\'::"custom H3".h3index]::"custom H3".h3index[])',
  "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3.h3index)":
    '(SELECT "h3 Pg".h3_cells_to_multi_polygon_geometry(c) FROM (VALUES (\'8928308280fffff\'::"custom H3".h3index)) v(c))',
  "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_wkb($extension:h3._h3index)":
    '"h3 Pg".h3_cells_to_multi_polygon_wkb(ARRAY[\'8928308280fffff\'::"custom H3".h3index]::"custom H3".h3index[])',
  "routine:$extension:h3_postgis.h3_get_resolution_from_tile_zoom(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)":
    '"h3 Pg".h3_get_resolution_from_tile_zoom(10)',
  "routine:$extension:h3_postgis.h3_grid_path_cells_recursive($extension:h3.h3index,$extension:h3.h3index)":
    '(SELECT t FROM "h3 Pg".h3_grid_path_cells_recursive(\'8928308280fffff\'::"custom H3".h3index,\'8928308280fffff\'::"custom H3".h3index) t LIMIT 1)',
  "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geography,pg_catalog.int4)":
    '"h3 Pg".h3_lat_lng_to_cell("postgis \u5730".st_geogfromtext(\'SRID=4326;POINT(-122.4089866999972 37.81331899998324)\'),9)',
  "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geometry,pg_catalog.int4)":
    '"h3 Pg".h3_lat_lng_to_cell("postgis \u5730".st_geomfromewkt(\'SRID=4326;POINT(-122.4089866999972 37.81331899998324)\'),9)',
  "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geography,pg_catalog.int4)":
    '"h3 Pg".h3_latlng_to_cell("postgis \u5730".st_geogfromtext(\'SRID=4326;POINT(-122.4089866999972 37.81331899998324)\'),9)',
  "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geometry,pg_catalog.int4)":
    '"h3 Pg".h3_latlng_to_cell("postgis \u5730".st_geomfromewkt(\'SRID=4326;POINT(-122.4089866999972 37.81331899998324)\'),9)',
  "routine:$extension:h3_postgis.h3_polygon_to_cells($extension:postgis.geography,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".h3_polygon_to_cells("postgis \u5730".geography("postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\')),9) t LIMIT 1)',
  "routine:$extension:h3_postgis.h3_polygon_to_cells($extension:postgis.geometry,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".h3_polygon_to_cells("postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\'),9) t LIMIT 1)',
  "routine:$extension:h3_postgis.h3_polygon_to_cells_experimental($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)":
    '(SELECT t FROM "h3 Pg".h3_polygon_to_cells_experimental("postgis \u5730".geography("postgis \u5730".st_geomfromewkt(\'SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))\')),9,\'overlapping_bbox\') t LIMIT 1)',
  "routine:$extension:h3_postgis.h3_polygon_to_cells_experimental($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)":
    "(SELECT t FROM \"h3 Pg\".h3_polygon_to_cells_experimental(\"postgis \u5730\".st_geomfromewkt('SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))'),9,'overlapping_bbox') t LIMIT 1)",
  "routine:$extension:h3_postgis.h3_raster_class_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".h3_raster_class_summary_centroids("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),8) t LIMIT 1)',
  "routine:$extension:h3_postgis.h3_raster_class_summary_clip($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".h3_raster_class_summary_clip("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),8) t LIMIT 1)',
  "routine:$extension:h3_postgis.h3_raster_class_summary_item_agg($extension:h3_postgis.h3_raster_class_summary_item)":
    '(SELECT "h3 Pg".h3_raster_class_summary_item_agg(i) FROM (VALUES (ROW(1,1::float8,1::float8)::"h3 Pg".h3_raster_class_summary_item)) v(i))',
  "routine:$extension:h3_postgis.h3_raster_class_summary_item_to_jsonb($extension:h3_postgis.h3_raster_class_summary_item)":
    '"h3 Pg".h3_raster_class_summary_item_to_jsonb(ROW(1,1::float8,1::float8)::"h3 Pg".h3_raster_class_summary_item)',
  "routine:$extension:h3_postgis.h3_raster_class_summary_subpixel($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".h3_raster_class_summary_subpixel("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),8) t LIMIT 1)',
  "routine:$extension:h3_postgis.h3_raster_class_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".h3_raster_class_summary("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),8) t LIMIT 1)',
  "routine:$extension:h3_postgis.h3_raster_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".h3_raster_summary_centroids("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),8) t LIMIT 1)',
  "routine:$extension:h3_postgis.h3_raster_summary_clip($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".h3_raster_summary_clip("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),8) t LIMIT 1)',
  "routine:$extension:h3_postgis.h3_raster_summary_stats_agg($extension:h3_postgis.h3_raster_summary_stats)":
    '(SELECT "h3 Pg".h3_raster_summary_stats_agg(i) FROM (VALUES (ROW(1::float8,1::float8,1::float8,0::float8,1::float8,1::float8)::"h3 Pg".h3_raster_summary_stats)) v(i))',
  "routine:$extension:h3_postgis.h3_raster_summary_subpixel($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".h3_raster_summary_subpixel("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),8) t LIMIT 1)',
  "routine:$extension:h3_postgis.h3_raster_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
    '(SELECT t FROM "h3 Pg".h3_raster_summary("postgis \u5730".st_addband("postgis \u5730".st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),\'8BUI\'::text,1::float8,0::float8),8) t LIMIT 1)',
} as const;
