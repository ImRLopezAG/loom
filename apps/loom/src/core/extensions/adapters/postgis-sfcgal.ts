import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { booleanCodec, floatCodec, nullableCodec, textCodec, type ExtensionCodec } from "../codecs";
import { int4Codec } from "../native-codecs";
import { createSqlFunction, defaultSqlArgument, type DefaultSqlArgument } from "../sql";
import { createPostgisGeometryCodec } from "./postgis-codecs";
export type { Geometry, PostgisEwkb, PostgisEwkt } from "./postgis-codecs";

type Descriptor = ExtensionDescriptor<"postgis_sfcgal", { readonly version: "3.6.4"; readonly schema: string }>;
type PostgisDescriptor = ExtensionDescriptor<"postgis", { readonly version: "3.6.4"; readonly schema: string }>;
const digest = "a9f128c0489a24e8fa4bb0b35000570c2f8b1e6db26609863b9e4a24a1518c76";
const postgisDigest = "640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29";

/**
 * Exact postgis_sfcgal 3.6.4 contract (76 members). Every routine is evaluated natively by
 * PostgreSQL/SFCGAL; Kello performs no geometry math. Geometry inputs and results use the PostGIS
 * EWKB/EWKT codecs in the postgis dependency schema. Defaults are omitted so PostgreSQL applies them.
 * Library-gated routines raise PostgreSQL's native "requires SFCGAL x.y.z+" error when the linked
 * SFCGAL is older; postgis_sfcgal_version() reports that library. Deprecated ST_* SQL wrappers call
 * _postgis_deprecate and CG_* unqualified, so PostgreSQL resolves them only when both the postgis and
 * postgis_sfcgal schemas are on the session search_path (otherwise SQLSTATE 42883); they then emit a
 * deprecation WARNING. PostgreSQL's @extschema:postgis@ substitution rejects double quotes, dollar
 * signs, apostrophes and backslashes in the postgis dependency namespace.
 */
export function createPostgisSfcgal_3_6_4<const Selected extends Descriptor>(descriptor: Selected, postgis: PostgisDescriptor) {
  if (
    descriptor.name !== "postgis_sfcgal" ||
    descriptor.version !== "3.6.4" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("postgis_sfcgal 3.6.4 requires its exact verified contract");
  if (
    postgis.name !== "postgis" ||
    postgis.version !== "3.6.4" ||
    postgis.apiSupport.status !== "verified" ||
    postgis.apiSupport.digest !== postgisDigest
  )
    throw new Error("postgis_sfcgal 3.6.4 requires its exact verified postgis 3.6.4 dependency");
  if (/["$'\\]/.test(postgis.schema))
    throw new Error(
      "postgis_sfcgal 3.6.4 requires a postgis dependency schema without double quotes, dollar signs, apostrophes or backslashes (PostgreSQL @extschema:postgis@ restriction)",
    );
  const geometry = nullableCodec(createPostgisGeometryCodec(postgis.schema));
  const float8 = nullableCodec(floatCodec);
  const int4 = nullableCodec(int4Codec);
  const bool = nullableCodec(booleanCodec);
  const text = nullableCodec(textCodec);
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const fn = <const Arguments extends readonly (ExtensionCodec<never, unknown> | DefaultSqlArgument)[], Result extends ExtensionCodec<never, unknown>>(
    name: string,
    member: string,
    arguments_: Arguments,
    result: Result,
  ) => Object.assign(createSqlFunction({ ...base, name, member, arguments: arguments_, result }), { members: Object.freeze([member]) });
  const cg2drotate = fn("cg_2drotate", "routine:$extension:postgis_sfcgal.cg_2drotate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)", [geometry, float8, float8, float8] as const, geometry);
  const cg3dalphawrapping = fn("cg_3dalphawrapping", "routine:$extension:postgis_sfcgal.cg_3dalphawrapping($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)", [geometry, int4, defaultSqlArgument(int4, "relative_offset")] as const, geometry);
  const cg3darea = fn("cg_3darea", "routine:$extension:postgis_sfcgal.cg_3darea($extension:postgis.geometry)", [geometry] as const, float8);
  const cg3dbuffer = fn("cg_3dbuffer", "routine:$extension:postgis_sfcgal.cg_3dbuffer($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)", [geometry, float8, int4, int4] as const, geometry);
  const cg3dconvexhull = fn("cg_3dconvexhull", "routine:$extension:postgis_sfcgal.cg_3dconvexhull($extension:postgis.geometry)", [geometry] as const, geometry);
  const cg3ddifference = fn("cg_3ddifference", "routine:$extension:postgis_sfcgal.cg_3ddifference($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, geometry);
  const cg3ddistance = fn("cg_3ddistance", "routine:$extension:postgis_sfcgal.cg_3ddistance($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, float8);
  const cg3dintersection = fn("cg_3dintersection", "routine:$extension:postgis_sfcgal.cg_3dintersection($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, geometry);
  const cg3dintersects = fn("cg_3dintersects", "routine:$extension:postgis_sfcgal.cg_3dintersects($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, bool);
  const cg3drotate = fn("cg_3drotate", "routine:$extension:postgis_sfcgal.cg_3drotate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)", [geometry, float8, float8, float8, float8] as const, geometry);
  const cg3dscale = fn("cg_3dscale", "routine:$extension:postgis_sfcgal.cg_3dscale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)", [geometry, float8, float8, float8] as const, geometry);
  const cg3dscalearoundcenter = fn("cg_3dscalearoundcenter", "routine:$extension:postgis_sfcgal.cg_3dscalearoundcenter($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)", [geometry, float8, float8, float8, float8, float8, float8] as const, geometry);
  const cg3dtranslate = fn("cg_3dtranslate", "routine:$extension:postgis_sfcgal.cg_3dtranslate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)", [geometry, float8, float8, float8] as const, geometry);
  const cg3dunion0 = fn("cg_3dunion", "routine:$extension:postgis_sfcgal.cg_3dunion($extension:postgis.geometry)", [geometry] as const, geometry);
  const cg3dunion1 = fn("cg_3dunion", "routine:$extension:postgis_sfcgal.cg_3dunion($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, geometry);
  const cg3dunion = Object.assign(
    (...values: Parameters<typeof cg3dunion0> | Parameters<typeof cg3dunion1>) =>
      // SAFETY: the argument count selects exactly one native overload tuple.
      values.length === 1 ? cg3dunion0(...(values as Parameters<typeof cg3dunion0>)) : cg3dunion1(...(values as Parameters<typeof cg3dunion1>)),
    { members: Object.freeze([...cg3dunion0.members, ...cg3dunion1.members]) },
  );
  const cgAlpha = fn("cg_alphashape", "routine:$extension:postgis_sfcgal.cg_alphashape($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)", [geometry, defaultSqlArgument(float8, "alpha"), defaultSqlArgument(bool, "allow_holes")] as const, geometry);
  const cgApproxconvexpartition = fn("cg_approxconvexpartition", "routine:$extension:postgis_sfcgal.cg_approxconvexpartition($extension:postgis.geometry)", [geometry] as const, geometry);
  const cgApproximatemedialaxis = fn("cg_approximatemedialaxis", "routine:$extension:postgis_sfcgal.cg_approximatemedialaxis($extension:postgis.geometry)", [geometry] as const, geometry);
  const cgArea = fn("cg_area", "routine:$extension:postgis_sfcgal.cg_area($extension:postgis.geometry)", [geometry] as const, float8);
  const cgConstraineddelaunaytriangles = fn("cg_constraineddelaunaytriangles", "routine:$extension:postgis_sfcgal.cg_constraineddelaunaytriangles($extension:postgis.geometry)", [geometry] as const, geometry);
  const cgDifference = fn("cg_difference", "routine:$extension:postgis_sfcgal.cg_difference($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, geometry);
  const cgDistance = fn("cg_distance", "routine:$extension:postgis_sfcgal.cg_distance($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, float8);
  const cgExtrude = fn("cg_extrude", "routine:$extension:postgis_sfcgal.cg_extrude($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)", [geometry, float8, float8, float8] as const, geometry);
  const cgExtrudestraightskeleton = fn("cg_extrudestraightskeleton", "routine:$extension:postgis_sfcgal.cg_extrudestraightskeleton($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)", [geometry, float8, defaultSqlArgument(float8, "body_height")] as const, geometry);
  const cgForcelhr = fn("cg_forcelhr", "routine:$extension:postgis_sfcgal.cg_forcelhr($extension:postgis.geometry)", [geometry] as const, geometry);
  const cgGreeneapproxconvexpartition = fn("cg_greeneapproxconvexpartition", "routine:$extension:postgis_sfcgal.cg_greeneapproxconvexpartition($extension:postgis.geometry)", [geometry] as const, geometry);
  const cgIntersection = fn("cg_intersection", "routine:$extension:postgis_sfcgal.cg_intersection($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, geometry);
  const cgIntersects = fn("cg_intersects", "routine:$extension:postgis_sfcgal.cg_intersects($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, bool);
  const cgIsplanar = fn("cg_isplanar", "routine:$extension:postgis_sfcgal.cg_isplanar($extension:postgis.geometry)", [geometry] as const, bool);
  const cgIssolid = fn("cg_issolid", "routine:$extension:postgis_sfcgal.cg_issolid($extension:postgis.geometry)", [geometry] as const, bool);
  const cgMakesolid = fn("cg_makesolid", "routine:$extension:postgis_sfcgal.cg_makesolid($extension:postgis.geometry)", [geometry] as const, geometry);
  const cgMinkowskisum = fn("cg_minkowskisum", "routine:$extension:postgis_sfcgal.cg_minkowskisum($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, geometry);
  const cgOptimalAlpha = fn("cg_optimalalphashape", "routine:$extension:postgis_sfcgal.cg_optimalalphashape($extension:postgis.geometry,pg_catalog.bool,pg_catalog.int4)", [geometry, defaultSqlArgument(bool, "allow_holes"), defaultSqlArgument(int4, "nb_components")] as const, geometry);
  const cgOptimalconvexpartition = fn("cg_optimalconvexpartition", "routine:$extension:postgis_sfcgal.cg_optimalconvexpartition($extension:postgis.geometry)", [geometry] as const, geometry);
  const cgOrientation = fn("cg_orientation", "routine:$extension:postgis_sfcgal.cg_orientation($extension:postgis.geometry)", [geometry] as const, int4);
  const cgRotate = fn("cg_rotate", "routine:$extension:postgis_sfcgal.cg_rotate($extension:postgis.geometry,pg_catalog.float8)", [geometry, float8] as const, geometry);
  const cgRotatex = fn("cg_rotatex", "routine:$extension:postgis_sfcgal.cg_rotatex($extension:postgis.geometry,pg_catalog.float8)", [geometry, float8] as const, geometry);
  const cgRotatey = fn("cg_rotatey", "routine:$extension:postgis_sfcgal.cg_rotatey($extension:postgis.geometry,pg_catalog.float8)", [geometry, float8] as const, geometry);
  const cgRotatez = fn("cg_rotatez", "routine:$extension:postgis_sfcgal.cg_rotatez($extension:postgis.geometry,pg_catalog.float8)", [geometry, float8] as const, geometry);
  const cgScale = fn("cg_scale", "routine:$extension:postgis_sfcgal.cg_scale($extension:postgis.geometry,pg_catalog.float8)", [geometry, float8] as const, geometry);
  const cgSimplify = fn("cg_simplify", "routine:$extension:postgis_sfcgal.cg_simplify($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)", [geometry, float8, defaultSqlArgument(bool, "preservetopology")] as const, geometry);
  const cgStraightskeleton = fn("cg_straightskeleton", "routine:$extension:postgis_sfcgal.cg_straightskeleton($extension:postgis.geometry,pg_catalog.bool)", [geometry, defaultSqlArgument(bool, "use_m_as_distance")] as const, geometry);
  const cgStraightskeletonpartition = fn("cg_straightskeletonpartition", "routine:$extension:postgis_sfcgal.cg_straightskeletonpartition($extension:postgis.geometry,pg_catalog.bool)", [geometry, bool] as const, geometry);
  const cgTesselate = fn("cg_tesselate", "routine:$extension:postgis_sfcgal.cg_tesselate($extension:postgis.geometry)", [geometry] as const, geometry);
  const cgTranslate = fn("cg_translate", "routine:$extension:postgis_sfcgal.cg_translate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)", [geometry, float8, float8] as const, geometry);
  const cgTriangulate = fn("cg_triangulate", "routine:$extension:postgis_sfcgal.cg_triangulate($extension:postgis.geometry)", [geometry] as const, geometry);
  const cgUnion0 = fn("cg_union", "routine:$extension:postgis_sfcgal.cg_union($extension:postgis.geometry)", [geometry] as const, geometry);
  const cgUnion1 = fn("cg_union", "routine:$extension:postgis_sfcgal.cg_union($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, geometry);
  const cgUnion = Object.assign(
    (...values: Parameters<typeof cgUnion0> | Parameters<typeof cgUnion1>) =>
      // SAFETY: the argument count selects exactly one native overload tuple.
      values.length === 1 ? cgUnion0(...(values as Parameters<typeof cgUnion0>)) : cgUnion1(...(values as Parameters<typeof cgUnion1>)),
    { members: Object.freeze([...cgUnion0.members, ...cgUnion1.members]) },
  );
  const cgVisibility0 = fn("cg_visibility", "routine:$extension:postgis_sfcgal.cg_visibility($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, geometry);
  const cgVisibility1 = fn("cg_visibility", "routine:$extension:postgis_sfcgal.cg_visibility($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry, geometry] as const, geometry);
  const cgVisibility = Object.assign(
    (...values: Parameters<typeof cgVisibility0> | Parameters<typeof cgVisibility1>) =>
      // SAFETY: the argument count selects exactly one native overload tuple.
      values.length === 2 ? cgVisibility0(...(values as Parameters<typeof cgVisibility0>)) : cgVisibility1(...(values as Parameters<typeof cgVisibility1>)),
    { members: Object.freeze([...cgVisibility0.members, ...cgVisibility1.members]) },
  );
  const cgVolume = fn("cg_volume", "routine:$extension:postgis_sfcgal.cg_volume($extension:postgis.geometry)", [geometry] as const, float8);
  const cgYmonotonepartition = fn("cg_ymonotonepartition", "routine:$extension:postgis_sfcgal.cg_ymonotonepartition($extension:postgis.geometry)", [geometry] as const, geometry);
  const postgisSfcgalFullVersion = fn("postgis_sfcgal_full_version", "routine:$extension:postgis_sfcgal.postgis_sfcgal_full_version()", [] as const, text);
  const postgisSfcgalNoop = fn("postgis_sfcgal_noop", "routine:$extension:postgis_sfcgal.postgis_sfcgal_noop($extension:postgis.geometry)", [geometry] as const, geometry);
  const postgisSfcgalScriptsInstalled = fn("postgis_sfcgal_scripts_installed", "routine:$extension:postgis_sfcgal.postgis_sfcgal_scripts_installed()", [] as const, text);
  const postgisSfcgalVersion = fn("postgis_sfcgal_version", "routine:$extension:postgis_sfcgal.postgis_sfcgal_version()", [] as const, text);
  const st3darea = fn("st_3darea", "routine:$extension:postgis_sfcgal.st_3darea($extension:postgis.geometry)", [geometry] as const, float8);
  const st3dconvexhull = fn("st_3dconvexhull", "routine:$extension:postgis_sfcgal.st_3dconvexhull($extension:postgis.geometry)", [geometry] as const, geometry);
  const st3ddifference = fn("st_3ddifference", "routine:$extension:postgis_sfcgal.st_3ddifference($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, geometry);
  const st3dintersection = fn("st_3dintersection", "routine:$extension:postgis_sfcgal.st_3dintersection($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, geometry);
  const st3dunion0 = fn("st_3dunion", "routine:$extension:postgis_sfcgal.st_3dunion($extension:postgis.geometry)", [geometry] as const, geometry);
  const st3dunion1 = fn("st_3dunion", "routine:$extension:postgis_sfcgal.st_3dunion($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, geometry);
  const st3dunion = Object.assign(
    (...values: Parameters<typeof st3dunion0> | Parameters<typeof st3dunion1>) =>
      // SAFETY: the argument count selects exactly one native overload tuple.
      values.length === 1 ? st3dunion0(...(values as Parameters<typeof st3dunion0>)) : st3dunion1(...(values as Parameters<typeof st3dunion1>)),
    { members: Object.freeze([...st3dunion0.members, ...st3dunion1.members]) },
  );
  const stAlpha = fn("st_alphashape", "routine:$extension:postgis_sfcgal.st_alphashape($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)", [geometry, defaultSqlArgument(float8, "alpha"), defaultSqlArgument(bool, "allow_holes")] as const, geometry);
  const stApproximatemedialaxis = fn("st_approximatemedialaxis", "routine:$extension:postgis_sfcgal.st_approximatemedialaxis($extension:postgis.geometry)", [geometry] as const, geometry);
  const stConstraineddelaunaytriangles = fn("st_constraineddelaunaytriangles", "routine:$extension:postgis_sfcgal.st_constraineddelaunaytriangles($extension:postgis.geometry)", [geometry] as const, geometry);
  const stExtrude = fn("st_extrude", "routine:$extension:postgis_sfcgal.st_extrude($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)", [geometry, float8, float8, float8] as const, geometry);
  const stForcelhr = fn("st_forcelhr", "routine:$extension:postgis_sfcgal.st_forcelhr($extension:postgis.geometry)", [geometry] as const, geometry);
  const stIsplanar = fn("st_isplanar", "routine:$extension:postgis_sfcgal.st_isplanar($extension:postgis.geometry)", [geometry] as const, bool);
  const stIssolid = fn("st_issolid", "routine:$extension:postgis_sfcgal.st_issolid($extension:postgis.geometry)", [geometry] as const, bool);
  const stMakesolid = fn("st_makesolid", "routine:$extension:postgis_sfcgal.st_makesolid($extension:postgis.geometry)", [geometry] as const, geometry);
  const stMinkowskisum = fn("st_minkowskisum", "routine:$extension:postgis_sfcgal.st_minkowskisum($extension:postgis.geometry,$extension:postgis.geometry)", [geometry, geometry] as const, geometry);
  const stOptimalAlpha = fn("st_optimalalphashape", "routine:$extension:postgis_sfcgal.st_optimalalphashape($extension:postgis.geometry,pg_catalog.bool,pg_catalog.int4)", [geometry, defaultSqlArgument(bool, "allow_holes"), defaultSqlArgument(int4, "nb_components")] as const, geometry);
  const stOrientation = fn("st_orientation", "routine:$extension:postgis_sfcgal.st_orientation($extension:postgis.geometry)", [geometry] as const, int4);
  const stStraightskeleton = fn("st_straightskeleton", "routine:$extension:postgis_sfcgal.st_straightskeleton($extension:postgis.geometry)", [geometry] as const, geometry);
  const stTesselate = fn("st_tesselate", "routine:$extension:postgis_sfcgal.st_tesselate($extension:postgis.geometry)", [geometry] as const, geometry);
  const stVolume = fn("st_volume", "routine:$extension:postgis_sfcgal.st_volume($extension:postgis.geometry)", [geometry] as const, float8);
  const functions = Object.freeze({
    cg_2drotate: cg2drotate,
    cg_3dalphawrapping: cg3dalphawrapping,
    cg_3darea: cg3darea,
    cg_3dbuffer: cg3dbuffer,
    cg_3dconvexhull: cg3dconvexhull,
    cg_3ddifference: cg3ddifference,
    cg_3ddistance: cg3ddistance,
    cg_3dintersection: cg3dintersection,
    cg_3dintersects: cg3dintersects,
    cg_3drotate: cg3drotate,
    cg_3dscale: cg3dscale,
    cg_3dscalearoundcenter: cg3dscalearoundcenter,
    cg_3dtranslate: cg3dtranslate,
    cg_3dunion: cg3dunion,
    "cg_alphashape": cgAlpha,
    cg_approxconvexpartition: cgApproxconvexpartition,
    cg_approximatemedialaxis: cgApproximatemedialaxis,
    cg_area: cgArea,
    cg_constraineddelaunaytriangles: cgConstraineddelaunaytriangles,
    cg_difference: cgDifference,
    cg_distance: cgDistance,
    cg_extrude: cgExtrude,
    cg_extrudestraightskeleton: cgExtrudestraightskeleton,
    cg_forcelhr: cgForcelhr,
    cg_greeneapproxconvexpartition: cgGreeneapproxconvexpartition,
    cg_intersection: cgIntersection,
    cg_intersects: cgIntersects,
    cg_isplanar: cgIsplanar,
    cg_issolid: cgIssolid,
    cg_makesolid: cgMakesolid,
    cg_minkowskisum: cgMinkowskisum,
    "cg_optimalalphashape": cgOptimalAlpha,
    cg_optimalconvexpartition: cgOptimalconvexpartition,
    cg_orientation: cgOrientation,
    cg_rotate: cgRotate,
    cg_rotatex: cgRotatex,
    cg_rotatey: cgRotatey,
    cg_rotatez: cgRotatez,
    cg_scale: cgScale,
    cg_simplify: cgSimplify,
    cg_straightskeleton: cgStraightskeleton,
    cg_straightskeletonpartition: cgStraightskeletonpartition,
    cg_tesselate: cgTesselate,
    cg_translate: cgTranslate,
    cg_triangulate: cgTriangulate,
    cg_union: cgUnion,
    cg_visibility: cgVisibility,
    cg_volume: cgVolume,
    cg_ymonotonepartition: cgYmonotonepartition,
    postgis_sfcgal_full_version: postgisSfcgalFullVersion,
    postgis_sfcgal_noop: postgisSfcgalNoop,
    postgis_sfcgal_scripts_installed: postgisSfcgalScriptsInstalled,
    postgis_sfcgal_version: postgisSfcgalVersion,
    st_3darea: st3darea,
    st_3dconvexhull: st3dconvexhull,
    st_3ddifference: st3ddifference,
    st_3dintersection: st3dintersection,
    st_3dunion: st3dunion,
    "st_alphashape": stAlpha,
    st_approximatemedialaxis: stApproximatemedialaxis,
    st_constraineddelaunaytriangles: stConstraineddelaunaytriangles,
    st_extrude: stExtrude,
    st_forcelhr: stForcelhr,
    st_isplanar: stIsplanar,
    st_issolid: stIssolid,
    st_makesolid: stMakesolid,
    st_minkowskisum: stMinkowskisum,
    "st_optimalalphashape": stOptimalAlpha,
    st_orientation: stOrientation,
    st_straightskeleton: stStraightskeleton,
    st_tesselate: stTesselate,
    st_volume: stVolume,
  });
  return bindExtension(descriptor, {
    cg2drotate,
    cg3dalphawrapping,
    cg3darea,
    cg3dbuffer,
    cg3dconvexhull,
    cg3ddifference,
    cg3ddistance,
    cg3dintersection,
    cg3dintersects,
    cg3drotate,
    cg3dscale,
    cg3dscalearoundcenter,
    cg3dtranslate,
    cg3dunion,
    "cgAlphashape": cgAlpha,
    cgApproxconvexpartition,
    cgApproximatemedialaxis,
    cgArea,
    cgConstraineddelaunaytriangles,
    cgDifference,
    cgDistance,
    cgExtrude,
    cgExtrudestraightskeleton,
    cgForcelhr,
    cgGreeneapproxconvexpartition,
    cgIntersection,
    cgIntersects,
    cgIsplanar,
    cgIssolid,
    cgMakesolid,
    cgMinkowskisum,
    "cgOptimalalphashape": cgOptimalAlpha,
    cgOptimalconvexpartition,
    cgOrientation,
    cgRotate,
    cgRotatex,
    cgRotatey,
    cgRotatez,
    cgScale,
    cgSimplify,
    cgStraightskeleton,
    cgStraightskeletonpartition,
    cgTesselate,
    cgTranslate,
    cgTriangulate,
    cgUnion,
    cgVisibility,
    cgVolume,
    cgYmonotonepartition,
    postgisSfcgalFullVersion,
    postgisSfcgalNoop,
    postgisSfcgalScriptsInstalled,
    postgisSfcgalVersion,
    st3darea,
    st3dconvexhull,
    st3ddifference,
    st3dintersection,
    st3dunion,
    "stAlphashape": stAlpha,
    stApproximatemedialaxis,
    stConstraineddelaunaytriangles,
    stExtrude,
    stForcelhr,
    stIsplanar,
    stIssolid,
    stMakesolid,
    stMinkowskisum,
    "stOptimalalphashape": stOptimalAlpha,
    stOrientation,
    stStraightskeleton,
    stTesselate,
    stVolume,
    sql: Object.freeze({ functions, operators: Object.freeze({}) }),
  });
}
