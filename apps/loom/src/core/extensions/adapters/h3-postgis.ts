import { sql, is, SQL, type SQLWrapper } from "drizzle-orm";
import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  binaryCodec,
  booleanCodec,
  decodeFailure,
  floatCodec,
  nullableCodec,
  withCodecSqlType,
  compositeCodec,
  type ExtensionCodec,
} from "../codecs";
import { createExtensionField, type ExtensionValueSchema } from "../fields";
import { jsonbCodec } from "../native-json-codecs";
import { int4Codec } from "../native-codecs";
import { extensionRows } from "../rows";
import {
  checkedExtensionExpression,
  createSqlAggregate,
  createSqlFunction,
  createSqlOperator,
  createSqlRows,
  defaultSqlArgument,
  extensionSqlType,
  type DefaultSqlArgument,
  type ExtensionSqlInput,
} from "../sql";
import { createH3IndexArrayCodec, createH3IndexCodec } from "./h3-codecs";
import { createPostgisGeographyCodec, createPostgisGeometryCodec } from "./postgis-codecs";
import {
  createH3PostgisRasterHexCodec,
  createH3RasterClassSummaryItemArrayCodec,
  createH3RasterClassSummaryItemCodec,
  createH3RasterSummaryStatsArrayCodec,
  createH3RasterSummaryStatsCodec,
  createPostgisRasterSummaryStatsCodec,
  h3PostgisContainmentModeCodec,
} from "./h3-postgis-codecs";
export type { Geometry, Geography } from "./postgis-codecs";
export type { H3Index } from "./h3-codecs";
export type {
  H3PostgisContainmentMode,
  H3PostgisRaster,
  NonfiniteNumber,
  PostgreSqlArray,
} from "./h3-postgis-codecs";
export { rasterHex } from "./h3-postgis-codecs";
export { h3Index } from "./h3-codecs";

type Descriptor = ExtensionDescriptor<"h3_postgis", { readonly version: "4.2.3"; readonly schema: string }>;
type H3Descriptor = ExtensionDescriptor<"h3", { readonly version: "4.2.3"; readonly schema: string }>;
type PostgisDescriptor = ExtensionDescriptor<"postgis", { readonly version: "3.6.4"; readonly schema: string }>;
type RasterDescriptor = ExtensionDescriptor<"postgis_raster", { readonly version: "3.6.4"; readonly schema: string }>;
const digest = "9803892394c3cec2d4305ca64a925baefbe37c9108e8bb2601c7f384575f481e";
const h3Digest = "0402a89cff2876378a25b680936da0841125dc5d194c2dad6f006092914ffbaf";
const postgisDigest = "640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29";
const rasterDigest = "8f7cd8fe4d832fcc153344cc70b5693f79fa29acb1a6b7f97c0c3de31943def2";
type AnyCodec = ExtensionCodec<never, unknown>;
const sqlWrapper = v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value));

/**
 * Exact h3_postgis 4.2.3 contract (62 members). Every routine, cast and operator is evaluated by
 * PostgreSQL/h3-pg/PostGIS. Kello performs no H3 or geometry math. Geometry and geography use the
 * PostGIS 3.6.4 EWKB/EWKT codecs; h3index uses the h3 4.2.3 hex codec. Raster arguments keep native
 * WKB hex. The captured index graph is empty.
 */
export function createH3Postgis_4_2_3<const Selected extends Descriptor>(
  descriptor: Selected,
  h3: H3Descriptor,
  postgis: PostgisDescriptor,
  raster: RasterDescriptor,
) {
  if (
    descriptor.name !== "h3_postgis" ||
    descriptor.version !== "4.2.3" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("h3_postgis 4.2.3 requires its exact verified contract");
  if (h3.name !== "h3" || h3.version !== "4.2.3" || h3.apiSupport.status !== "verified" || h3.apiSupport.digest !== h3Digest)
    throw new Error("h3_postgis 4.2.3 requires its verified h3 4.2.3 dependency");
  if (
    postgis.name !== "postgis" ||
    postgis.version !== "3.6.4" ||
    postgis.apiSupport.status !== "verified" ||
    postgis.apiSupport.digest !== postgisDigest
  )
    throw new Error("h3_postgis 4.2.3 requires its verified postgis 3.6.4 dependency");
  if (
    raster.name !== "postgis_raster" ||
    raster.version !== "3.6.4" ||
    raster.apiSupport.status !== "verified" ||
    raster.apiSupport.digest !== rasterDigest
  )
    throw new Error("h3_postgis 4.2.3 requires its verified postgis_raster 3.6.4 dependency");
  if (raster.schema !== postgis.schema)
    throw new Error("postgis_raster 3.6.4 requires the same installation schema as postgis 3.6.4");
  const index = nullableCodec(createH3IndexCodec(h3.schema));
  const indexes = nullableCodec(createH3IndexArrayCodec(h3.schema));
  const geometry = nullableCodec(createPostgisGeometryCodec(postgis.schema));
  const geography = nullableCodec(createPostgisGeographyCodec(postgis.schema));
  const rasterHex = nullableCodec(createH3PostgisRasterHexCodec(raster.schema));
  const rasterStats = nullableCodec(createPostgisRasterSummaryStatsCodec(raster.schema));
  const classItem = nullableCodec(createH3RasterClassSummaryItemCodec(descriptor.schema));
  const summaryStats = nullableCodec(createH3RasterSummaryStatsCodec(descriptor.schema));
  const classItemArray = createH3RasterClassSummaryItemArrayCodec(descriptor.schema);
  const summaryStatsArray = createH3RasterSummaryStatsArrayCodec(descriptor.schema);
  const float8 = nullableCodec(floatCodec);
  const int4 = nullableCodec(int4Codec);
  const bytea = nullableCodec(binaryCodec);
  const jsonb = nullableCodec(jsonbCodec);
  const mode = nullableCodec(h3PostgisContainmentModeCodec);
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables" as const, authority: "query" as const };
  const fn = <const Arguments extends readonly (AnyCodec | DefaultSqlArgument)[], Result extends AnyCodec>(
    name: string,
    member: string,
    arguments_: Arguments,
    result: Result,
  ) => {
    const created = createSqlFunction({ ...base, name, member, arguments: arguments_, result });
    // SAFETY: members is metadata only; the callable keeps createSqlFunction's captured argument types.
    return Object.assign(created, { members: Object.freeze([member]) }) as typeof created & { members: readonly string[] };
  };
  const rows = <const Arguments extends readonly (AnyCodec | DefaultSqlArgument)[], Result extends AnyCodec>(
    name: string,
    member: string,
    arguments_: Arguments,
    result: Result,
  ) => {
    const created = createSqlRows({ ...base, name, member, arguments: arguments_, result });
    // SAFETY: members is metadata only; the callable keeps createSqlRows' captured argument types.
    return Object.assign(created, { members: Object.freeze([member]) }) as typeof created & { members: readonly string[] };
  };
  const agg = <const Arguments extends readonly AnyCodec[], Result extends AnyCodec>(
    name: string,
    member: string,
    arguments_: Arguments,
    result: Result,
  ) => {
    const created = createSqlAggregate({ ...base, name, member, arguments: arguments_, result });
    // SAFETY: members is metadata only; the callable keeps createSqlAggregate's captured argument types.
    return Object.assign(created, { members: Object.freeze([member]) }) as typeof created & { members: readonly string[] };
  };
  const record = <const Fields extends Record<string, AnyCodec>>(id: string, fields: Fields) =>
    nullableCodec(withCodecSqlType(compositeCodec(id, fields), { schema: "pg_catalog", name: "record" }));
  function requireCells(value: ExtensionSqlInput<typeof indexes>) {
    if (v.is(sqlWrapper, value) || is(value, SQL) || is(value, SQL.Aliased)) return;
    if (v.is(v.object({ dimensions: v.array(v.any()), values: v.array(v.any()) }), value) && value.values.length === 0)
      throw new Error("h3_cells_to_multi_polygon requires at least one array element");
  }
  function geographyOrGeometry<const Geo extends (...values: never[]) => SQL, const Geom extends (...values: never[]) => SQL>(
    geo: Geo,
    geom: Geom,
  ): Geo & Geom {
    const call = (...values: never[]) => {
      const [value] = values;
      return v.is(v.object({ kind: v.literal("geography") }), value) ? geo(...values) : geom(...values);
    };
    // SAFETY: kind selects the captured geography or geometry overload; each overload encodes its own argument.
    return call as Geo & Geom;
  }
  function arity<const One extends (...values: never[]) => SQL, const Two extends (...values: never[]) => SQL>(
    one: One,
    two: Two,
  ): One & Two {
    const call = (...values: never[]) => (values.length === 1 ? one(...values) : two(...values));
    // SAFETY: argument count selects exactly one captured overload, and that overload validates its own arguments.
    return call as One & Two;
  }
  function cellsArrayOrAgg<const ArrayFn extends (...values: never[]) => SQL, const Agg extends (...values: never[]) => SQL>(
    arrayFn: ArrayFn,
    agg: Agg,
  ): ArrayFn & Agg {
    const call = (...values: never[]) => {
      const [first] = values;
      return values.length === 1 && v.is(v.object({ values: v.array(v.any()) }), first) ? arrayFn(...values) : agg(...values);
    };
    // SAFETY: a PostgreSQL array value selects the _h3index overload; every other typed argument uses the aggregate.
    return call as ArrayFn & Agg;
  }
  function withMembers<const Fn extends (...values: never[]) => SQL>(fn: Fn, members: readonly string[]) {
    // SAFETY: members is metadata only; the callable keeps its captured argument types.
    return Object.assign(fn, { members: Object.freeze(members) }) as Fn & { members: readonly string[] };
  }
  const cellToBoundaryGeography1 = fn(
    "h3_cell_to_boundary_geography",
    "routine:$extension:h3_postgis.h3_cell_to_boundary_geography($extension:h3.h3index)",
    [index] as const,
    geography,
  );
  const cellToBoundaryGeography2 = fn(
    "h3_cell_to_boundary_geography",
    "routine:$extension:h3_postgis.h3_cell_to_boundary_geography($extension:h3.h3index,pg_catalog.bool)",
    [index, defaultSqlArgument(nullableCodec(booleanCodec), "extend_antimeridian")] as const,
    geography,
  );
  const cellToBoundaryGeometry1 = fn(
    "h3_cell_to_boundary_geometry",
    "routine:$extension:h3_postgis.h3_cell_to_boundary_geometry($extension:h3.h3index)",
    [index] as const,
    geometry,
  );
  const cellToBoundaryGeometry2 = fn(
    "h3_cell_to_boundary_geometry",
    "routine:$extension:h3_postgis.h3_cell_to_boundary_geometry($extension:h3.h3index,pg_catalog.bool)",
    [index, defaultSqlArgument(nullableCodec(booleanCodec), "extend_antimeridian")] as const,
    geometry,
  );
  const cellToBoundaryWkb = fn(
    "h3_cell_to_boundary_wkb",
    "routine:$extension:h3_postgis.h3_cell_to_boundary_wkb($extension:h3.h3index)",
    [index] as const,
    bytea,
  );
  const cellToGeography = fn(
    "h3_cell_to_geography",
    "routine:$extension:h3_postgis.h3_cell_to_geography($extension:h3.h3index)",
    [index] as const,
    geography,
  );
  const cellToGeometry = fn(
    "h3_cell_to_geometry",
    "routine:$extension:h3_postgis.h3_cell_to_geometry($extension:h3.h3index)",
    [index] as const,
    geometry,
  );
  const cellsToMultiPolygonGeographyArray = Object.assign(
    (value: ExtensionSqlInput<typeof indexes>) => {
      requireCells(value);
      return fn(
        "h3_cells_to_multi_polygon_geography",
        "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3._h3index)",
        [indexes] as const,
        geography,
      )(value);
    },
    { members: Object.freeze(["routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3._h3index)"]) },
  );
  const cellsToMultiPolygonGeographyAgg = agg(
    "h3_cells_to_multi_polygon_geography",
    "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3.h3index)",
    [index] as const,
    geography,
  );
  const cellsToMultiPolygonGeometryArray = Object.assign(
    (value: ExtensionSqlInput<typeof indexes>) => {
      requireCells(value);
      return fn(
        "h3_cells_to_multi_polygon_geometry",
        "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3._h3index)",
        [indexes] as const,
        geometry,
      )(value);
    },
    { members: Object.freeze(["routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3._h3index)"]) },
  );
  const cellsToMultiPolygonGeometryAgg = agg(
    "h3_cells_to_multi_polygon_geometry",
    "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3.h3index)",
    [index] as const,
    geometry,
  );
  const cellsToMultiPolygonWkb = Object.assign(
    (value: ExtensionSqlInput<typeof indexes>) => {
      requireCells(value);
      return fn(
        "h3_cells_to_multi_polygon_wkb",
        "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_wkb($extension:h3._h3index)",
        [indexes] as const,
        bytea,
      )(value);
    },
    { members: Object.freeze(["routine:$extension:h3_postgis.h3_cells_to_multi_polygon_wkb($extension:h3._h3index)"]) },
  );
  const getResolutionFromTileZoom = fn(
    "h3_get_resolution_from_tile_zoom",
    "routine:$extension:h3_postgis.h3_get_resolution_from_tile_zoom(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)",
    [
      int4,
      defaultSqlArgument(int4, "max_h3_resolution"),
      defaultSqlArgument(int4, "min_h3_resolution"),
      defaultSqlArgument(int4, "hex_edge_pixels"),
      defaultSqlArgument(int4, "tile_size"),
    ] as const,
    int4,
  );
  const gridPathCellsRecursive = rows(
    "h3_grid_path_cells_recursive",
    "routine:$extension:h3_postgis.h3_grid_path_cells_recursive($extension:h3.h3index,$extension:h3.h3index)",
    [index, index] as const,
    index,
  );
  const latLngToCellGeography = fn(
    "h3_lat_lng_to_cell",
    "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geography,pg_catalog.int4)",
    [geography, int4] as const,
    index,
  );
  const latLngToCellGeometry = fn(
    "h3_lat_lng_to_cell",
    "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geometry,pg_catalog.int4)",
    [geometry, int4] as const,
    index,
  );
  const latlngToCellGeography = fn(
    "h3_latlng_to_cell",
    "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geography,pg_catalog.int4)",
    [geography, int4] as const,
    index,
  );
  const latlngToCellGeometry = fn(
    "h3_latlng_to_cell",
    "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geometry,pg_catalog.int4)",
    [geometry, int4] as const,
    index,
  );
  const polygonToCellsGeography = rows(
    "h3_polygon_to_cells",
    "routine:$extension:h3_postgis.h3_polygon_to_cells($extension:postgis.geography,pg_catalog.int4)",
    [geography, int4] as const,
    index,
  );
  const polygonToCellsGeometry = rows(
    "h3_polygon_to_cells",
    "routine:$extension:h3_postgis.h3_polygon_to_cells($extension:postgis.geometry,pg_catalog.int4)",
    [geometry, int4] as const,
    index,
  );
  const polygonToCellsExperimentalGeography = rows(
    "h3_polygon_to_cells_experimental",
    "routine:$extension:h3_postgis.h3_polygon_to_cells_experimental($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)",
    [geography, int4, defaultSqlArgument(mode, "containment_mode")] as const,
    index,
  );
  const polygonToCellsExperimentalGeometry = rows(
    "h3_polygon_to_cells_experimental",
    "routine:$extension:h3_postgis.h3_polygon_to_cells_experimental($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)",
    [geometry, int4, defaultSqlArgument(mode, "containment_mode")] as const,
    index,
  );
  const classRow = record("h3_postgis:class-summary-row", {
    h3: index,
    val: int4,
    summary: classItem,
  });
  const statsRow = record("h3_postgis:summary-row", {
    h3: index,
    stats: summaryStats,
  });
  const nband = defaultSqlArgument(int4, "nband");
  const rasterClassSummaryCentroids = rows(
    "h3_raster_class_summary_centroids",
    "routine:$extension:h3_postgis.h3_raster_class_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    [rasterHex, int4, nband] as const,
    classRow,
  );
  const rasterClassSummaryClip = rows(
    "h3_raster_class_summary_clip",
    "routine:$extension:h3_postgis.h3_raster_class_summary_clip($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    [rasterHex, int4, nband] as const,
    classRow,
  );
  const rasterClassSummaryItemAgg = agg(
    "h3_raster_class_summary_item_agg",
    "routine:$extension:h3_postgis.h3_raster_class_summary_item_agg($extension:h3_postgis.h3_raster_class_summary_item)",
    [classItem] as const,
    classItem,
  );
  const rasterClassSummaryItemToJsonb = fn(
    "h3_raster_class_summary_item_to_jsonb",
    "routine:$extension:h3_postgis.h3_raster_class_summary_item_to_jsonb($extension:h3_postgis.h3_raster_class_summary_item)",
    [classItem] as const,
    jsonb,
  );
  const rasterClassSummarySubpixel = rows(
    "h3_raster_class_summary_subpixel",
    "routine:$extension:h3_postgis.h3_raster_class_summary_subpixel($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    [rasterHex, int4, nband] as const,
    classRow,
  );
  const rasterClassSummary = rows(
    "h3_raster_class_summary",
    "routine:$extension:h3_postgis.h3_raster_class_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    [rasterHex, int4, nband] as const,
    classRow,
  );
  const rasterSummaryCentroids = rows(
    "h3_raster_summary_centroids",
    "routine:$extension:h3_postgis.h3_raster_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    [rasterHex, int4, nband] as const,
    statsRow,
  );
  const rasterSummaryClip = rows(
    "h3_raster_summary_clip",
    "routine:$extension:h3_postgis.h3_raster_summary_clip($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    [rasterHex, int4, nband] as const,
    statsRow,
  );
  const rasterSummaryStatsAgg = agg(
    "h3_raster_summary_stats_agg",
    "routine:$extension:h3_postgis.h3_raster_summary_stats_agg($extension:h3_postgis.h3_raster_summary_stats)",
    [summaryStats] as const,
    summaryStats,
  );
  const rasterSummarySubpixel = rows(
    "h3_raster_summary_subpixel",
    "routine:$extension:h3_postgis.h3_raster_summary_subpixel($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    [rasterHex, int4, nband] as const,
    statsRow,
  );
  const rasterSummary = rows(
    "h3_raster_summary",
    "routine:$extension:h3_postgis.h3_raster_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    [rasterHex, int4, nband] as const,
    statsRow,
  );
  const internals = {
    __h3_raster_band_nodata: fn(
      "__h3_raster_band_nodata",
      "routine:$extension:h3_postgis.__h3_raster_band_nodata($extension:postgis_raster.raster,pg_catalog.int4)",
      [rasterHex, int4] as const,
      float8,
    ),
    __h3_raster_class_polygon_summary_clip: rows(
      "__h3_raster_class_polygon_summary_clip",
      "routine:$extension:h3_postgis.__h3_raster_class_polygon_summary_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)",
      [rasterHex, geometry, int4, int4, float8] as const,
      classRow,
    ),
    __h3_raster_class_polygon_summary_subpixel: rows(
      "__h3_raster_class_polygon_summary_subpixel",
      "routine:$extension:h3_postgis.__h3_raster_class_polygon_summary_subpixel($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
      [rasterHex, geometry, int4, int4, float8, float8] as const,
      classRow,
    ),
    __h3_raster_class_summary_centroids: rows(
      "__h3_raster_class_summary_centroids",
      "routine:$extension:h3_postgis.__h3_raster_class_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)",
      [rasterHex, int4, int4, float8] as const,
      classRow,
    ),
    __h3_raster_class_summary_item_agg_transfn: fn(
      "__h3_raster_class_summary_item_agg_transfn",
      "routine:$extension:h3_postgis.__h3_raster_class_summary_item_agg_transfn($extension:h3_postgis.h3_raster_class_summary_item,$extension:h3_postgis.h3_raster_class_summary_item)",
      [classItem, classItem] as const,
      classItem,
    ),
    __h3_raster_class_summary_part: rows(
      "__h3_raster_class_summary_part",
      "routine:$extension:h3_postgis.__h3_raster_class_summary_part($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
      [rasterHex, int4, float8] as const,
      classItem,
    ),
    __h3_raster_polygon_centroid_cell_area: fn(
      "__h3_raster_polygon_centroid_cell_area",
      "routine:$extension:h3_postgis.__h3_raster_polygon_centroid_cell_area($extension:postgis.geometry,pg_catalog.int4)",
      [geometry, int4] as const,
      float8,
    ),
    __h3_raster_polygon_centroid_cell: fn(
      "__h3_raster_polygon_centroid_cell",
      "routine:$extension:h3_postgis.__h3_raster_polygon_centroid_cell($extension:postgis.geometry,pg_catalog.int4)",
      [geometry, int4] as const,
      index,
    ),
    __h3_raster_polygon_pixel_area: fn(
      "__h3_raster_polygon_pixel_area",
      "routine:$extension:h3_postgis.__h3_raster_polygon_pixel_area($extension:postgis_raster.raster,$extension:postgis.geometry)",
      [rasterHex, geometry] as const,
      float8,
    ),
    __h3_raster_polygon_subpixel_cell_values: rows(
      "__h3_raster_polygon_subpixel_cell_values",
      "routine:$extension:h3_postgis.__h3_raster_polygon_subpixel_cell_values($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
      [rasterHex, geometry, int4, int4] as const,
      record("h3_postgis:subpixel-cell", { h3: index, val: float8 }),
    ),
    __h3_raster_polygon_summary_clip: rows(
      "__h3_raster_polygon_summary_clip",
      "routine:$extension:h3_postgis.__h3_raster_polygon_summary_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
      [rasterHex, geometry, int4, int4] as const,
      statsRow,
    ),
    __h3_raster_polygon_summary_subpixel: rows(
      "__h3_raster_polygon_summary_subpixel",
      "routine:$extension:h3_postgis.__h3_raster_polygon_summary_subpixel($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)",
      [rasterHex, geometry, int4, int4, float8] as const,
      statsRow,
    ),
    __h3_raster_polygon_to_cell_boundaries_intersects: rows(
      "__h3_raster_polygon_to_cell_boundaries_intersects",
      "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_boundaries_intersects($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)",
      [rasterHex, geometry, int4] as const,
      record("h3_postgis:boundary-intersects", { h3: index, geom: geometry }),
    ),
    __h3_raster_polygon_to_cell_coords_centroid: rows(
      "__h3_raster_polygon_to_cell_coords_centroid",
      "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_coords_centroid($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)",
      [rasterHex, geometry, int4] as const,
      record("h3_postgis:centroid-coords", { h3: index, x: int4, y: int4 }),
    ),
    __h3_raster_polygon_to_cell_parts: rows(
      "__h3_raster_polygon_to_cell_parts",
      "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_parts($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
      [rasterHex, geometry, int4, int4] as const,
      record("h3_postgis:cell-parts", { h3: index, part: rasterHex }),
    ),
    __h3_raster_polygon_to_cells: rows(
      "__h3_raster_polygon_to_cells",
      "routine:$extension:h3_postgis.__h3_raster_polygon_to_cells($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)",
      [rasterHex, geometry, int4, float8] as const,
      index,
    ),
    __h3_raster_summary_stats_agg_transfn: fn(
      "__h3_raster_summary_stats_agg_transfn",
      "routine:$extension:h3_postgis.__h3_raster_summary_stats_agg_transfn($extension:h3_postgis.h3_raster_summary_stats,$extension:h3_postgis.h3_raster_summary_stats)",
      [summaryStats, summaryStats] as const,
      summaryStats,
    ),
    __h3_raster_to_polygon: fn(
      "__h3_raster_to_polygon",
      "routine:$extension:h3_postgis.__h3_raster_to_polygon($extension:postgis_raster.raster,pg_catalog.int4)",
      [rasterHex, int4] as const,
      geometry,
    ),
    __h3_raster_to_summary_stats: fn(
      "__h3_raster_to_summary_stats",
      "routine:$extension:h3_postgis.__h3_raster_to_summary_stats($extension:postgis_raster.summarystats)",
      [rasterStats] as const,
      summaryStats,
    ),
  };
  const atGeography = createSqlOperator({
    ...base,
    name: "@",
    member: "operator:$extension:h3_postgis.@($extension:postgis.geography,pg_catalog.int4)",
    left: geography,
    right: int4,
    result: index,
  });
  const atGeometry = createSqlOperator({
    ...base,
    name: "@",
    member: "operator:$extension:h3_postgis.@($extension:postgis.geometry,pg_catalog.int4)",
    left: geometry,
    right: int4,
    result: index,
  });
  const at = withMembers(geographyOrGeometry(atGeography, atGeometry), [
    "operator:$extension:h3_postgis.@($extension:postgis.geography,pg_catalog.int4)",
    "operator:$extension:h3_postgis.@($extension:postgis.geometry,pg_catalog.int4)",
  ]);
  function cast<Source extends AnyCodec, Target extends AnyCodec>(source: Source, target: Target, member: string) {
    return (value: ExtensionSqlInput<Source>) => {
      const expression = is(value, SQL.Aliased) && !v.is(v.object({ isSelectionField: v.literal(true) }), value) ? value.sql : value;
      const native = v.is(sqlWrapper, expression)
        ? sql`${expression}`
        : // SAFETY: SQLWrapper is checked first; every other typed argument is codec input and encode validates it before binding.
          sql`${sql.param(decodeFailure(() => source.encode(value as never)))}`;
      const sourceType = source.sqlType!,
        targetType = target.sqlType!;
      return checkedExtensionExpression(
        sql`((${native})::${extensionSqlType(sourceType.schema, sourceType.name)})::${extensionSqlType(targetType.schema, targetType.name)}`,
        target,
        [],
        undefined,
        member,
      );
    };
  }
  const casts = Object.freeze({
    h3index_to_geography: cast(index, geography, "cast:$extension:h3.h3index->$extension:postgis.geography"),
    h3index_to_geometry: cast(index, geometry, "cast:$extension:h3.h3index->$extension:postgis.geometry"),
  });
  const latLngToCell = withMembers(geographyOrGeometry(latLngToCellGeography, latLngToCellGeometry), [
    ...latLngToCellGeography.members,
    ...latLngToCellGeometry.members,
  ]);
  const latlngToCell = withMembers(geographyOrGeometry(latlngToCellGeography, latlngToCellGeometry), [
    ...latlngToCellGeography.members,
    ...latlngToCellGeometry.members,
  ]);
  const polygonToCells = withMembers(geographyOrGeometry(polygonToCellsGeography, polygonToCellsGeometry), [
    ...polygonToCellsGeography.members,
    ...polygonToCellsGeometry.members,
  ]);
  const polygonToCellsExperimental = withMembers(
    geographyOrGeometry(polygonToCellsExperimentalGeography, polygonToCellsExperimentalGeometry),
    [...polygonToCellsExperimentalGeography.members, ...polygonToCellsExperimentalGeometry.members],
  );
  const cellToBoundaryGeography = withMembers(arity(cellToBoundaryGeography1, cellToBoundaryGeography2), [
    ...cellToBoundaryGeography1.members,
    ...cellToBoundaryGeography2.members,
  ]);
  const cellToBoundaryGeometry = withMembers(arity(cellToBoundaryGeometry1, cellToBoundaryGeometry2), [
    ...cellToBoundaryGeometry1.members,
    ...cellToBoundaryGeometry2.members,
  ]);
  const functions = Object.freeze({
    ...internals,
    h3_cell_to_boundary_geography: cellToBoundaryGeography,
    h3_cell_to_boundary_geometry: cellToBoundaryGeometry,
    h3_cell_to_boundary_wkb: cellToBoundaryWkb,
    h3_cell_to_geography: cellToGeography,
    h3_cell_to_geometry: cellToGeometry,
    h3_cells_to_multi_polygon_geography: withMembers(
      cellsArrayOrAgg(cellsToMultiPolygonGeographyArray, cellsToMultiPolygonGeographyAgg),
      [...cellsToMultiPolygonGeographyArray.members, ...cellsToMultiPolygonGeographyAgg.members],
    ),
    h3_cells_to_multi_polygon_geometry: withMembers(
      cellsArrayOrAgg(cellsToMultiPolygonGeometryArray, cellsToMultiPolygonGeometryAgg),
      [...cellsToMultiPolygonGeometryArray.members, ...cellsToMultiPolygonGeometryAgg.members],
    ),
    h3_cells_to_multi_polygon_wkb: cellsToMultiPolygonWkb,
    h3_get_resolution_from_tile_zoom: getResolutionFromTileZoom,
    h3_grid_path_cells_recursive: gridPathCellsRecursive,
    h3_lat_lng_to_cell: latLngToCell,
    h3_latlng_to_cell: latlngToCell,
    h3_polygon_to_cells: polygonToCells,
    h3_polygon_to_cells_experimental: polygonToCellsExperimental,
    h3_raster_class_summary_centroids: rasterClassSummaryCentroids,
    h3_raster_class_summary_clip: rasterClassSummaryClip,
    h3_raster_class_summary_item_agg: rasterClassSummaryItemAgg,
    h3_raster_class_summary_item_to_jsonb: rasterClassSummaryItemToJsonb,
    h3_raster_class_summary_subpixel: rasterClassSummarySubpixel,
    h3_raster_class_summary: rasterClassSummary,
    h3_raster_summary_centroids: rasterSummaryCentroids,
    h3_raster_summary_clip: rasterSummaryClip,
    h3_raster_summary_stats_agg: rasterSummaryStatsAgg,
    h3_raster_summary_subpixel: rasterSummarySubpixel,
    h3_raster_summary: rasterSummary,
  });
  const overloads = Object.freeze({
    "cast:$extension:h3.h3index->$extension:postgis.geography": casts.h3index_to_geography,
    "cast:$extension:h3.h3index->$extension:postgis.geometry": casts.h3index_to_geometry,
    "operator:$extension:h3_postgis.@($extension:postgis.geography,pg_catalog.int4)": atGeography,
    "operator:$extension:h3_postgis.@($extension:postgis.geometry,pg_catalog.int4)": atGeometry,
    "routine:$extension:h3_postgis.__h3_raster_band_nodata($extension:postgis_raster.raster,pg_catalog.int4)":
      internals.__h3_raster_band_nodata,
    "routine:$extension:h3_postgis.__h3_raster_class_polygon_summary_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)":
      internals.__h3_raster_class_polygon_summary_clip,
    "routine:$extension:h3_postgis.__h3_raster_class_polygon_summary_subpixel($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      internals.__h3_raster_class_polygon_summary_subpixel,
    "routine:$extension:h3_postgis.__h3_raster_class_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)":
      internals.__h3_raster_class_summary_centroids,
    "routine:$extension:h3_postgis.__h3_raster_class_summary_item_agg_transfn($extension:h3_postgis.h3_raster_class_summary_item,$extension:h3_postgis.h3_raster_class_summary_item)":
      internals.__h3_raster_class_summary_item_agg_transfn,
    "routine:$extension:h3_postgis.__h3_raster_class_summary_part($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
      internals.__h3_raster_class_summary_part,
    "routine:$extension:h3_postgis.__h3_raster_polygon_centroid_cell_area($extension:postgis.geometry,pg_catalog.int4)":
      internals.__h3_raster_polygon_centroid_cell_area,
    "routine:$extension:h3_postgis.__h3_raster_polygon_centroid_cell($extension:postgis.geometry,pg_catalog.int4)":
      internals.__h3_raster_polygon_centroid_cell,
    "routine:$extension:h3_postgis.__h3_raster_polygon_pixel_area($extension:postgis_raster.raster,$extension:postgis.geometry)":
      internals.__h3_raster_polygon_pixel_area,
    "routine:$extension:h3_postgis.__h3_raster_polygon_subpixel_cell_values($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)":
      internals.__h3_raster_polygon_subpixel_cell_values,
    "routine:$extension:h3_postgis.__h3_raster_polygon_summary_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)":
      internals.__h3_raster_polygon_summary_clip,
    "routine:$extension:h3_postgis.__h3_raster_polygon_summary_subpixel($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)":
      internals.__h3_raster_polygon_summary_subpixel,
    "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_boundaries_intersects($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)":
      internals.__h3_raster_polygon_to_cell_boundaries_intersects,
    "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_coords_centroid($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)":
      internals.__h3_raster_polygon_to_cell_coords_centroid,
    "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_parts($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)":
      internals.__h3_raster_polygon_to_cell_parts,
    "routine:$extension:h3_postgis.__h3_raster_polygon_to_cells($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)":
      internals.__h3_raster_polygon_to_cells,
    "routine:$extension:h3_postgis.__h3_raster_summary_stats_agg_transfn($extension:h3_postgis.h3_raster_summary_stats,$extension:h3_postgis.h3_raster_summary_stats)":
      internals.__h3_raster_summary_stats_agg_transfn,
    "routine:$extension:h3_postgis.__h3_raster_to_polygon($extension:postgis_raster.raster,pg_catalog.int4)":
      internals.__h3_raster_to_polygon,
    "routine:$extension:h3_postgis.__h3_raster_to_summary_stats($extension:postgis_raster.summarystats)":
      internals.__h3_raster_to_summary_stats,
    "routine:$extension:h3_postgis.h3_cell_to_boundary_geography($extension:h3.h3index,pg_catalog.bool)":
      cellToBoundaryGeography2,
    "routine:$extension:h3_postgis.h3_cell_to_boundary_geography($extension:h3.h3index)": cellToBoundaryGeography1,
    "routine:$extension:h3_postgis.h3_cell_to_boundary_geometry($extension:h3.h3index,pg_catalog.bool)":
      cellToBoundaryGeometry2,
    "routine:$extension:h3_postgis.h3_cell_to_boundary_geometry($extension:h3.h3index)": cellToBoundaryGeometry1,
    "routine:$extension:h3_postgis.h3_cell_to_boundary_wkb($extension:h3.h3index)": cellToBoundaryWkb,
    "routine:$extension:h3_postgis.h3_cell_to_geography($extension:h3.h3index)": cellToGeography,
    "routine:$extension:h3_postgis.h3_cell_to_geometry($extension:h3.h3index)": cellToGeometry,
    "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3._h3index)":
      cellsToMultiPolygonGeographyArray,
    "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3.h3index)":
      cellsToMultiPolygonGeographyAgg,
    "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3._h3index)":
      cellsToMultiPolygonGeometryArray,
    "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3.h3index)":
      cellsToMultiPolygonGeometryAgg,
    "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_wkb($extension:h3._h3index)": cellsToMultiPolygonWkb,
    "routine:$extension:h3_postgis.h3_get_resolution_from_tile_zoom(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)":
      getResolutionFromTileZoom,
    "routine:$extension:h3_postgis.h3_grid_path_cells_recursive($extension:h3.h3index,$extension:h3.h3index)":
      gridPathCellsRecursive,
    "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geography,pg_catalog.int4)": latLngToCellGeography,
    "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geometry,pg_catalog.int4)": latLngToCellGeometry,
    "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geography,pg_catalog.int4)": latlngToCellGeography,
    "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geometry,pg_catalog.int4)": latlngToCellGeometry,
    "routine:$extension:h3_postgis.h3_polygon_to_cells_experimental($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)":
      polygonToCellsExperimentalGeography,
    "routine:$extension:h3_postgis.h3_polygon_to_cells_experimental($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)":
      polygonToCellsExperimentalGeometry,
    "routine:$extension:h3_postgis.h3_polygon_to_cells($extension:postgis.geography,pg_catalog.int4)": polygonToCellsGeography,
    "routine:$extension:h3_postgis.h3_polygon_to_cells($extension:postgis.geometry,pg_catalog.int4)": polygonToCellsGeometry,
    "routine:$extension:h3_postgis.h3_raster_class_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      rasterClassSummaryCentroids,
    "routine:$extension:h3_postgis.h3_raster_class_summary_clip($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      rasterClassSummaryClip,
    "routine:$extension:h3_postgis.h3_raster_class_summary_item_agg($extension:h3_postgis.h3_raster_class_summary_item)":
      rasterClassSummaryItemAgg,
    "routine:$extension:h3_postgis.h3_raster_class_summary_item_to_jsonb($extension:h3_postgis.h3_raster_class_summary_item)":
      rasterClassSummaryItemToJsonb,
    "routine:$extension:h3_postgis.h3_raster_class_summary_subpixel($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      rasterClassSummarySubpixel,
    "routine:$extension:h3_postgis.h3_raster_class_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      rasterClassSummary,
    "routine:$extension:h3_postgis.h3_raster_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      rasterSummaryCentroids,
    "routine:$extension:h3_postgis.h3_raster_summary_clip($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      rasterSummaryClip,
    "routine:$extension:h3_postgis.h3_raster_summary_stats_agg($extension:h3_postgis.h3_raster_summary_stats)":
      rasterSummaryStatsAgg,
    "routine:$extension:h3_postgis.h3_raster_summary_subpixel($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      rasterSummarySubpixel,
    "routine:$extension:h3_postgis.h3_raster_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
      rasterSummary,
  });
  const classValue: ExtensionValueSchema = {
    kind: "object",
    properties: {
      val: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      count: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      area: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
    },
  };
  const statsValue: ExtensionValueSchema = {
    kind: "object",
    properties: {
      count: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      sum: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      mean: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      stddev: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      min: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
      max: { kind: "union", variants: [{ kind: "number" }, { kind: "null" }] },
    },
  };
  const arrayValue = (element: ExtensionValueSchema): ExtensionValueSchema => ({
    kind: "object",
    properties: {
      dimensions: {
        kind: "array",
        items: {
          kind: "object",
          properties: {
            lowerBound: { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 },
            length: { kind: "number", integer: true, minimum: 0, maximum: 2147483647 },
          },
        },
      },
      values: { kind: "array", items: { kind: "union", variants: [element, { kind: "null" }] } },
    },
  });
  const search = { filter: false, comparison: false, order: false, text: false } as const;
  const field = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:h3_postgis.h3_raster_class_summary_item",
      type: "h3_raster_class_summary_item",
      codec: createH3RasterClassSummaryItemCodec(descriptor.schema),
      value: classValue,
      search,
    });
  const arrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:h3_postgis._h3_raster_class_summary_item",
      type: "h3_raster_class_summary_item",
      array: true,
      codec: classItemArray,
      value: arrayValue(classValue),
      search,
    });
  const statsField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:h3_postgis.h3_raster_summary_stats",
      type: "h3_raster_summary_stats",
      codec: createH3RasterSummaryStatsCodec(descriptor.schema),
      value: statsValue,
      search,
    });
  const statsArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:h3_postgis._h3_raster_summary_stats",
      type: "h3_raster_summary_stats",
      array: true,
      codec: summaryStatsArray,
      value: arrayValue(statsValue),
      search,
    });
  return bindExtension(descriptor, {
    latLngToCell,
    latlngToCell,
    cellToBoundaryGeography,
    cellToBoundaryGeometry,
    cellToBoundaryWkb,
    cellToGeography,
    cellToGeometry,
    cellsToMultiPolygonGeography: cellsToMultiPolygonGeographyArray,
    cellsToMultiPolygonGeometry: cellsToMultiPolygonGeometryArray,
    cellsToMultiPolygonWkb,
    getResolutionFromTileZoom,
    gridPathCellsRecursive,
    polygonToCells,
    polygonToCellsExperimental,
    rasterClassSummary,
    rasterClassSummaryCentroids,
    rasterClassSummaryClip,
    rasterClassSummarySubpixel,
    rasterClassSummaryItemAgg,
    rasterClassSummaryItemToJsonb,
    rasterSummary,
    rasterSummaryCentroids,
    rasterSummaryClip,
    rasterSummarySubpixel,
    rasterSummaryStatsAgg,
    field,
    arrayField,
    statsField,
    statsArrayField,
    classItemRows: (alias: string, ...values: Parameters<typeof rasterClassSummary>) =>
      extensionRows(rasterClassSummary(...values), alias, { h3: index, val: int4, summary: classItem }, "named"),
    statsRows: (alias: string, ...values: Parameters<typeof rasterSummary>) =>
      extensionRows(rasterSummary(...values), alias, { h3: index, stats: summaryStats }, "named"),
    indexes: Object.freeze({}),
    sql: Object.freeze({ functions, operators: Object.freeze({ "@": at }), casts, overloads }),
  });
}
