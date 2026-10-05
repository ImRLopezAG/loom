const evidence = [
  "https://github.com/postgis/h3-pg/blob/v4.2.3/docs/api.md",
  "apps/loom/src/tooling/extensions/manifests/h3_postgis.json",
  "packages/tests/unit/extensions-h3-postgis.test.ts: exact 62-member identity, typed h3/postgis/postgis_raster descriptors, qualified calls and empty index graph",
  "packages/e2e/scripts/run-h3-postgis-native-characterization.ts: owned local PG18 oracle pending the h3 native companion artifact",
] as const;
const pending = {
  authority: "query",
  observability: "tables",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;

type Query = {
  readonly id: string;
  readonly reason: string;
  readonly result: string;
  readonly codec: string;
  readonly limitation?: string;
};
const queries: readonly Query[] = [
  {
    id: "cast:$extension:h3.h3index->$extension:postgis.geography",
    reason: "sql.casts.h3index_to_geography applies the captured explicit function cast.",
    result: "Geography | null",
    codec: "postgis:3.6.4:geography:ewkb-ewkt:1:srid=native:dimensions=native:nullable",
  },
  {
    id: "cast:$extension:h3.h3index->$extension:postgis.geometry",
    reason: "sql.casts.h3index_to_geometry applies the captured explicit function cast.",
    result: "Geometry | null",
    codec: "postgis:3.6.4:geometry:ewkb-ewkt:1:srid=native:dimensions=native:nullable",
  },
  {
    id: "operator:$extension:h3_postgis.@($extension:postgis.geography,pg_catalog.int4)",
    reason: "sql.operators.@ dispatches the captured geography @ int4 operator to h3_latlng_to_cell.",
    result: "H3Index | null",
    codec: "h3:h3index:hex:1:nullable",
  },
  {
    id: "operator:$extension:h3_postgis.@($extension:postgis.geometry,pg_catalog.int4)",
    reason: "sql.operators.@ dispatches the captured geometry @ int4 operator to h3_latlng_to_cell.",
    result: "H3Index | null",
    codec: "h3:h3index:hex:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_band_nodata($extension:postgis_raster.raster,pg_catalog.int4)",
    reason: "sql.functions.__h3_raster_band_nodata calls the exact captured SQL support routine.",
    result: "number | NonfiniteNumber | null",
    codec: "pg:float8:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_class_polygon_summary_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)",
    reason: "sql.functions.__h3_raster_class_polygon_summary_clip returns the captured TABLE columns.",
    result: "{ h3, val, summary } | null",
    codec: "pg:composite:1:h3_postgis:class-summary-row:h3:h3:h3index:hex:1:nullable;val:pg:int4:1:nullable;summary:pg:composite:1:h3_postgis:4.2.3:h3_raster_class_summary_item:val:pg:int4:1:nullable;count:pg:float8:1:nullable;area:pg:float8:1:nullable:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_class_polygon_summary_subpixel($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    reason: "sql.functions.__h3_raster_class_polygon_summary_subpixel returns the captured TABLE columns.",
    result: "{ h3, val, summary } | null",
    codec: "pg:composite:1:h3_postgis:class-summary-row:h3:h3:h3index:hex:1:nullable;val:pg:int4:1:nullable;summary:pg:composite:1:h3_postgis:4.2.3:h3_raster_class_summary_item:val:pg:int4:1:nullable;count:pg:float8:1:nullable;area:pg:float8:1:nullable:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_class_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)",
    reason: "sql.functions.__h3_raster_class_summary_centroids returns the captured TABLE columns.",
    result: "{ h3, val, summary } | null",
    codec: "pg:composite:1:h3_postgis:class-summary-row:h3:h3:h3index:hex:1:nullable;val:pg:int4:1:nullable;summary:pg:composite:1:h3_postgis:4.2.3:h3_raster_class_summary_item:val:pg:int4:1:nullable;count:pg:float8:1:nullable;area:pg:float8:1:nullable:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_class_summary_item_agg_transfn($extension:h3_postgis.h3_raster_class_summary_item,$extension:h3_postgis.h3_raster_class_summary_item)",
    reason: "sql.functions.__h3_raster_class_summary_item_agg_transfn is the captured aggregate transition.",
    result: "H3RasterClassSummaryItem | null",
    codec: "pg:composite:1:h3_postgis:4.2.3:h3_raster_class_summary_item:val:pg:int4:1:nullable;count:pg:float8:1:nullable;area:pg:float8:1:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_class_summary_part($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    reason: "sql.functions.__h3_raster_class_summary_part returns SETOF the captured class-summary composite.",
    result: "H3RasterClassSummaryItem | null",
    codec: "pg:composite:1:h3_postgis:4.2.3:h3_raster_class_summary_item:val:pg:int4:1:nullable;count:pg:float8:1:nullable;area:pg:float8:1:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_polygon_centroid_cell_area($extension:postgis.geometry,pg_catalog.int4)",
    reason: "sql.functions.__h3_raster_polygon_centroid_cell_area calls the exact captured SQL support routine.",
    result: "number | NonfiniteNumber | null",
    codec: "pg:float8:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_polygon_centroid_cell($extension:postgis.geometry,pg_catalog.int4)",
    reason: "sql.functions.__h3_raster_polygon_centroid_cell calls the exact captured plpgsql support routine.",
    result: "H3Index | null",
    codec: "h3:h3index:hex:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_polygon_pixel_area($extension:postgis_raster.raster,$extension:postgis.geometry)",
    reason: "sql.functions.__h3_raster_polygon_pixel_area calls the exact captured SQL support routine.",
    result: "number | NonfiniteNumber | null",
    codec: "pg:float8:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_polygon_subpixel_cell_values($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
    reason: "sql.functions.__h3_raster_polygon_subpixel_cell_values returns the captured TABLE columns.",
    result: "{ h3, val } | null",
    codec: "pg:composite:1:h3_postgis:subpixel-cell:h3:h3:h3index:hex:1:nullable;val:pg:float8:1:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_polygon_summary_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
    reason: "sql.functions.__h3_raster_polygon_summary_clip returns the captured TABLE columns.",
    result: "{ h3, stats } | null",
    codec: "pg:composite:1:h3_postgis:summary-row:h3:h3:h3index:hex:1:nullable;stats:pg:composite:1:h3_postgis:4.2.3:h3_raster_summary_stats:count:pg:float8:1:nullable;sum:pg:float8:1:nullable;mean:pg:float8:1:nullable;stddev:pg:float8:1:nullable;min:pg:float8:1:nullable;max:pg:float8:1:nullable:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_polygon_summary_subpixel($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)",
    reason: "sql.functions.__h3_raster_polygon_summary_subpixel returns the captured TABLE columns.",
    result: "{ h3, stats } | null",
    codec: "pg:composite:1:h3_postgis:summary-row:h3:h3:h3index:hex:1:nullable;stats:pg:composite:1:h3_postgis:4.2.3:h3_raster_summary_stats:count:pg:float8:1:nullable;sum:pg:float8:1:nullable;mean:pg:float8:1:nullable;stddev:pg:float8:1:nullable;min:pg:float8:1:nullable;max:pg:float8:1:nullable:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_boundaries_intersects($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)",
    reason: "sql.functions.__h3_raster_polygon_to_cell_boundaries_intersects returns the captured TABLE columns.",
    result: "{ h3, geom } | null",
    codec: "pg:composite:1:h3_postgis:boundary-intersects:h3:h3:h3index:hex:1:nullable;geom:postgis:3.6.4:geometry:ewkb-ewkt:1:srid=native:dimensions=native:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_coords_centroid($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)",
    reason: "sql.functions.__h3_raster_polygon_to_cell_coords_centroid returns the captured TABLE columns.",
    result: "{ h3, x, y } | null",
    codec: "pg:composite:1:h3_postgis:centroid-coords:h3:h3:h3index:hex:1:nullable;x:pg:int4:1:nullable;y:pg:int4:1:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_parts($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
    reason: "sql.functions.__h3_raster_polygon_to_cell_parts returns the captured TABLE columns.",
    result: "{ h3, part } | null",
    codec: "pg:composite:1:h3_postgis:cell-parts:h3:h3:h3index:hex:1:nullable;part:postgis_raster:3.6.4:raster:wkb-hex:1:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_polygon_to_cells($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)",
    reason: "sql.functions.__h3_raster_polygon_to_cells returns SETOF the captured h3index type.",
    result: "H3Index | null",
    codec: "h3:h3index:hex:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_summary_stats_agg_transfn($extension:h3_postgis.h3_raster_summary_stats,$extension:h3_postgis.h3_raster_summary_stats)",
    reason: "sql.functions.__h3_raster_summary_stats_agg_transfn is the captured aggregate transition.",
    result: "H3RasterSummaryStats | null",
    codec: "pg:composite:1:h3_postgis:4.2.3:h3_raster_summary_stats:count:pg:float8:1:nullable;sum:pg:float8:1:nullable;mean:pg:float8:1:nullable;stddev:pg:float8:1:nullable;min:pg:float8:1:nullable;max:pg:float8:1:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_to_polygon($extension:postgis_raster.raster,pg_catalog.int4)",
    reason: "sql.functions.__h3_raster_to_polygon calls the exact captured SQL support routine.",
    result: "Geometry | null",
    codec: "postgis:3.6.4:geometry:ewkb-ewkt:1:srid=native:dimensions=native:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.__h3_raster_to_summary_stats($extension:postgis_raster.summarystats)",
    reason: "sql.functions.__h3_raster_to_summary_stats maps the captured postgis_raster.summarystats composite.",
    result: "H3RasterSummaryStats | null",
    codec: "pg:composite:1:h3_postgis:4.2.3:h3_raster_summary_stats:count:pg:float8:1:nullable;sum:pg:float8:1:nullable;mean:pg:float8:1:nullable;stddev:pg:float8:1:nullable;min:pg:float8:1:nullable;max:pg:float8:1:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_cell_to_boundary_geography($extension:h3.h3index,pg_catalog.bool)",
    reason: "cellToBoundaryGeography / sql.functions.h3_cell_to_boundary_geography calls the two-argument overload.",
    result: "Geography | null",
    codec: "postgis:3.6.4:geography:ewkb-ewkt:1:srid=native:dimensions=native:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_cell_to_boundary_geography($extension:h3.h3index)",
    reason: "cellToBoundaryGeography / sql.functions.h3_cell_to_boundary_geography calls the one-argument overload.",
    result: "Geography | null",
    codec: "postgis:3.6.4:geography:ewkb-ewkt:1:srid=native:dimensions=native:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_cell_to_boundary_geometry($extension:h3.h3index,pg_catalog.bool)",
    reason: "cellToBoundaryGeometry / sql.functions.h3_cell_to_boundary_geometry calls the two-argument overload.",
    result: "Geometry | null",
    codec: "postgis:3.6.4:geometry:ewkb-ewkt:1:srid=native:dimensions=native:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_cell_to_boundary_geometry($extension:h3.h3index)",
    reason: "cellToBoundaryGeometry / sql.functions.h3_cell_to_boundary_geometry calls the one-argument overload.",
    result: "Geometry | null",
    codec: "postgis:3.6.4:geometry:ewkb-ewkt:1:srid=native:dimensions=native:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_cell_to_boundary_wkb($extension:h3.h3index)",
    reason: "cellToBoundaryWkb / sql.functions.h3_cell_to_boundary_wkb returns native boundary WKB.",
    result: "{ hex: string } | null",
    codec: "pg:bytea:hex:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_cell_to_geography($extension:h3.h3index)",
    reason: "cellToGeography / sql.functions.h3_cell_to_geography calls the exact captured SQL routine.",
    result: "Geography | null",
    codec: "postgis:3.6.4:geography:ewkb-ewkt:1:srid=native:dimensions=native:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_cell_to_geometry($extension:h3.h3index)",
    reason: "cellToGeometry / sql.functions.h3_cell_to_geometry calls the exact captured SQL routine.",
    result: "Geometry | null",
    codec: "postgis:3.6.4:geometry:ewkb-ewkt:1:srid=native:dimensions=native:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3._h3index)",
    reason: "cellsToMultiPolygonGeography / sql.functions.h3_cells_to_multi_polygon_geography binds the array overload.",
    result: "Geography | null",
    codec: "postgis:3.6.4:geography:ewkb-ewkt:1:srid=native:dimensions=native:nullable",
    limitation: "Empty h3index[] literals are refused first because h3-pg 4.2.3 can terminate the backend.",
  },
  {
    id: "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3.h3index)",
    reason: "sql.functions.h3_cells_to_multi_polygon_geography binds the captured aggregate overload.",
    result: "Geography | null",
    codec: "postgis:3.6.4:geography:ewkb-ewkt:1:srid=native:dimensions=native:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3._h3index)",
    reason: "cellsToMultiPolygonGeometry / sql.functions.h3_cells_to_multi_polygon_geometry binds the array overload.",
    result: "Geometry | null",
    codec: "postgis:3.6.4:geometry:ewkb-ewkt:1:srid=native:dimensions=native:nullable",
    limitation: "Empty h3index[] literals are refused first because h3-pg 4.2.3 can terminate the backend.",
  },
  {
    id: "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3.h3index)",
    reason: "sql.functions.h3_cells_to_multi_polygon_geometry binds the captured aggregate overload.",
    result: "Geometry | null",
    codec: "postgis:3.6.4:geometry:ewkb-ewkt:1:srid=native:dimensions=native:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_wkb($extension:h3._h3index)",
    reason: "cellsToMultiPolygonWkb / sql.functions.h3_cells_to_multi_polygon_wkb returns native MultiPolygon WKB.",
    result: "{ hex: string } | null",
    codec: "pg:bytea:hex:1:nullable",
    limitation: "Empty h3index[] literals are refused first because h3-pg 4.2.3 can terminate the backend.",
  },
  {
    id: "routine:$extension:h3_postgis.h3_get_resolution_from_tile_zoom(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)",
    reason: "getResolutionFromTileZoom / sql.functions.h3_get_resolution_from_tile_zoom omits trailing PostgreSQL defaults.",
    result: "number | null",
    codec: "pg:int4:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_grid_path_cells_recursive($extension:h3.h3index,$extension:h3.h3index)",
    reason: "gridPathCellsRecursive / sql.functions.h3_grid_path_cells_recursive returns SETOF h3index.",
    result: "H3Index | null",
    codec: "h3:h3index:hex:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geography,pg_catalog.int4)",
    reason: "latLngToCell / sql.functions.h3_lat_lng_to_cell binds the geography overload.",
    result: "H3Index | null",
    codec: "h3:h3index:hex:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geometry,pg_catalog.int4)",
    reason: "latLngToCell / sql.functions.h3_lat_lng_to_cell binds the geometry overload.",
    result: "H3Index | null",
    codec: "h3:h3index:hex:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geography,pg_catalog.int4)",
    reason: "latlngToCell / sql.functions.h3_latlng_to_cell binds the geography spelling.",
    result: "H3Index | null",
    codec: "h3:h3index:hex:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geometry,pg_catalog.int4)",
    reason: "latlngToCell / sql.functions.h3_latlng_to_cell binds the geometry spelling.",
    result: "H3Index | null",
    codec: "h3:h3index:hex:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_polygon_to_cells_experimental($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)",
    reason: "polygonToCellsExperimental / sql.functions.h3_polygon_to_cells_experimental binds the geography overload.",
    result: "H3Index | null",
    codec: "h3:h3index:hex:1:nullable",
    limitation: "containment_mode is the captured h3-pg 4.2.3 spelling set: center, full, overlap, overlapping_bbox.",
  },
  {
    id: "routine:$extension:h3_postgis.h3_polygon_to_cells_experimental($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)",
    reason: "polygonToCellsExperimental / sql.functions.h3_polygon_to_cells_experimental binds the geometry overload.",
    result: "H3Index | null",
    codec: "h3:h3index:hex:1:nullable",
    limitation: "containment_mode is the captured h3-pg 4.2.3 spelling set: center, full, overlap, overlapping_bbox.",
  },
  {
    id: "routine:$extension:h3_postgis.h3_polygon_to_cells($extension:postgis.geography,pg_catalog.int4)",
    reason: "polygonToCells / sql.functions.h3_polygon_to_cells binds the geography overload.",
    result: "H3Index | null",
    codec: "h3:h3index:hex:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_polygon_to_cells($extension:postgis.geometry,pg_catalog.int4)",
    reason: "polygonToCells / sql.functions.h3_polygon_to_cells binds the geometry overload.",
    result: "H3Index | null",
    codec: "h3:h3index:hex:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_raster_class_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    reason: "rasterClassSummaryCentroids / sql.functions.h3_raster_class_summary_centroids returns captured TABLE columns.",
    result: "{ h3, val, summary } | null",
    codec: "pg:composite:1:h3_postgis:class-summary-row:h3:h3:h3index:hex:1:nullable;val:pg:int4:1:nullable;summary:pg:composite:1:h3_postgis:4.2.3:h3_raster_class_summary_item:val:pg:int4:1:nullable;count:pg:float8:1:nullable;area:pg:float8:1:nullable:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_raster_class_summary_clip($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    reason: "rasterClassSummaryClip / sql.functions.h3_raster_class_summary_clip returns captured TABLE columns.",
    result: "{ h3, val, summary } | null",
    codec: "pg:composite:1:h3_postgis:class-summary-row:h3:h3:h3index:hex:1:nullable;val:pg:int4:1:nullable;summary:pg:composite:1:h3_postgis:4.2.3:h3_raster_class_summary_item:val:pg:int4:1:nullable;count:pg:float8:1:nullable;area:pg:float8:1:nullable:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_raster_class_summary_item_agg($extension:h3_postgis.h3_raster_class_summary_item)",
    reason: "rasterClassSummaryItemAgg / sql.functions.h3_raster_class_summary_item_agg binds the captured aggregate.",
    result: "H3RasterClassSummaryItem | null",
    codec: "pg:composite:1:h3_postgis:4.2.3:h3_raster_class_summary_item:val:pg:int4:1:nullable;count:pg:float8:1:nullable;area:pg:float8:1:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_raster_class_summary_item_to_jsonb($extension:h3_postgis.h3_raster_class_summary_item)",
    reason: "rasterClassSummaryItemToJsonb / sql.functions.h3_raster_class_summary_item_to_jsonb returns native JSONB text.",
    result: "JsonbDocument | null",
    codec: "pg:jsonb:text:1:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_raster_class_summary_subpixel($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    reason: "rasterClassSummarySubpixel / sql.functions.h3_raster_class_summary_subpixel returns captured TABLE columns.",
    result: "{ h3, val, summary } | null",
    codec: "pg:composite:1:h3_postgis:class-summary-row:h3:h3:h3index:hex:1:nullable;val:pg:int4:1:nullable;summary:pg:composite:1:h3_postgis:4.2.3:h3_raster_class_summary_item:val:pg:int4:1:nullable;count:pg:float8:1:nullable;area:pg:float8:1:nullable:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_raster_class_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    reason: "rasterClassSummary / sql.functions.h3_raster_class_summary returns captured TABLE columns.",
    result: "{ h3, val, summary } | null",
    codec: "pg:composite:1:h3_postgis:class-summary-row:h3:h3:h3index:hex:1:nullable;val:pg:int4:1:nullable;summary:pg:composite:1:h3_postgis:4.2.3:h3_raster_class_summary_item:val:pg:int4:1:nullable;count:pg:float8:1:nullable;area:pg:float8:1:nullable:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_raster_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    reason: "rasterSummaryCentroids / sql.functions.h3_raster_summary_centroids returns captured TABLE columns.",
    result: "{ h3, stats } | null",
    codec: "pg:composite:1:h3_postgis:summary-row:h3:h3:h3index:hex:1:nullable;stats:pg:composite:1:h3_postgis:4.2.3:h3_raster_summary_stats:count:pg:float8:1:nullable;sum:pg:float8:1:nullable;mean:pg:float8:1:nullable;stddev:pg:float8:1:nullable;min:pg:float8:1:nullable;max:pg:float8:1:nullable:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_raster_summary_clip($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    reason: "rasterSummaryClip / sql.functions.h3_raster_summary_clip returns captured TABLE columns.",
    result: "{ h3, stats } | null",
    codec: "pg:composite:1:h3_postgis:summary-row:h3:h3:h3index:hex:1:nullable;stats:pg:composite:1:h3_postgis:4.2.3:h3_raster_summary_stats:count:pg:float8:1:nullable;sum:pg:float8:1:nullable;mean:pg:float8:1:nullable;stddev:pg:float8:1:nullable;min:pg:float8:1:nullable;max:pg:float8:1:nullable:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_raster_summary_stats_agg($extension:h3_postgis.h3_raster_summary_stats)",
    reason: "rasterSummaryStatsAgg / sql.functions.h3_raster_summary_stats_agg binds the captured aggregate.",
    result: "H3RasterSummaryStats | null",
    codec: "pg:composite:1:h3_postgis:4.2.3:h3_raster_summary_stats:count:pg:float8:1:nullable;sum:pg:float8:1:nullable;mean:pg:float8:1:nullable;stddev:pg:float8:1:nullable;min:pg:float8:1:nullable;max:pg:float8:1:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_raster_summary_subpixel($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    reason: "rasterSummarySubpixel / sql.functions.h3_raster_summary_subpixel returns captured TABLE columns.",
    result: "{ h3, stats } | null",
    codec: "pg:composite:1:h3_postgis:summary-row:h3:h3:h3index:hex:1:nullable;stats:pg:composite:1:h3_postgis:4.2.3:h3_raster_summary_stats:count:pg:float8:1:nullable;sum:pg:float8:1:nullable;mean:pg:float8:1:nullable;stddev:pg:float8:1:nullable;min:pg:float8:1:nullable;max:pg:float8:1:nullable:nullable:nullable",
  },
  {
    id: "routine:$extension:h3_postgis.h3_raster_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    reason: "rasterSummary / sql.functions.h3_raster_summary returns captured TABLE columns.",
    result: "{ h3, stats } | null",
    codec: "pg:composite:1:h3_postgis:summary-row:h3:h3:h3index:hex:1:nullable;stats:pg:composite:1:h3_postgis:4.2.3:h3_raster_summary_stats:count:pg:float8:1:nullable;sum:pg:float8:1:nullable;mean:pg:float8:1:nullable;stddev:pg:float8:1:nullable;min:pg:float8:1:nullable;max:pg:float8:1:nullable:nullable:nullable",
  },
];

/** Exact 62-member dispositions. Native and public consumer acceptance remain pending. */
export const h3PostgisAnnotations = [
  ...queries.map((row) => ({
    id: row.id,
    disposition: "query" as const,
    evidence,
    reason: row.reason,
    semantics: {
      ...pending,
      nulls: "SQL NULL follows each captured strict or non-strict routine.",
      result: row.result,
      codec: row.codec,
      limitation:
        row.limitation ??
        "Evaluated natively by PostgreSQL/h3-pg/PostGIS with no JavaScript H3 or geometry fallback. The captured index graph is empty.",
    },
  })),
  {
    id: 'composite type:"$extension:h3_postgis".h3_raster_class_summary_item',
    disposition: "internal" as const,
    evidence,
    reason:
      "Captured composite-type relation is subordinate to type:$extension:h3_postgis.h3_raster_class_summary_item and is not an independently callable query.",
    semantics: {
      ...pending,
      parent: "type:$extension:h3_postgis.h3_raster_class_summary_item",
    },
  },
  {
    id: 'composite type:"$extension:h3_postgis".h3_raster_summary_stats',
    disposition: "internal" as const,
    evidence,
    reason:
      "Captured composite-type relation is subordinate to type:$extension:h3_postgis.h3_raster_summary_stats and is not an independently callable query.",
    semantics: {
      ...pending,
      parent: "type:$extension:h3_postgis.h3_raster_summary_stats",
    },
  },
  {
    id: "type:$extension:h3_postgis._h3_raster_class_summary_item",
    disposition: "schema" as const,
    evidence,
    reason: "Native class-summary array field uses the captured composite element codec and PostgreSQL array transfer.",
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transport: "pg_catalog.array_in/out/recv/send retain ranks, lower bounds and NULL elements.",
    },
  },
  {
    id: "type:$extension:h3_postgis._h3_raster_summary_stats",
    disposition: "schema" as const,
    evidence,
    reason: "Native summary-stats array field uses the captured composite element codec and PostgreSQL array transfer.",
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transport: "pg_catalog.array_in/out/recv/send retain ranks, lower bounds and NULL elements.",
    },
  },
  {
    id: "type:$extension:h3_postgis.h3_raster_class_summary_item",
    disposition: "schema" as const,
    evidence,
    reason: "Native class-summary composite field uses record transfer with val/count/area in captured order.",
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transport: "pg_catalog.record_in/out/recv/send. Columns: val int4, count float8, area float8.",
    },
  },
  {
    id: "type:$extension:h3_postgis.h3_raster_summary_stats",
    disposition: "schema" as const,
    evidence,
    reason: "Native summary-stats composite field uses record transfer with count/sum/mean/stddev/min/max in captured order.",
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transport: "pg_catalog.record_in/out/recv/send. All six attributes are float8; this is not postgis_raster.summarystats.",
    },
  },
] as const;
