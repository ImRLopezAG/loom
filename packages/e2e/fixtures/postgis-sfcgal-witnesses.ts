// One postgis_sfcgal 3.6.4 witness per manifest member ("name/arity"), shared by the native oracle script, the
// generated-project RPC and the packed Node 24 app. Values are evaluated by PostgreSQL/SFCGAL only.
import { sql, type SQL } from "drizzle-orm";
import type { createPostgisSfcgal_3_6_4, Geometry } from "kello/extensions/postgis-sfcgal";

export const postgisSfcgalWitnessGeometries = {
  poly: "POLYGON((0 0,4 0,4 4,0 4,0 0))",
  poly2: "POLYGON((2 2,6 2,6 6,2 6,2 2))",
  lpoly: "POLYGON((0 0,4 0,4 1,1 1,1 4,0 4,0 0))",
  polyz: "POLYGON Z((0 0 0,4 0 0,4 4 0,0 4 0,0 0 0))",
  polyz2: "POLYGON Z((2 2 0,6 2 0,6 6 0,2 6 0,2 2 0))",
  pts: "MULTIPOINT((0 0),(4 0),(4 4),(0 4),(2 2),(1 3))",
  ptsz: "MULTIPOINT Z((0 0 0),(4 0 0),(4 4 0),(0 4 0),(0 0 4),(4 4 4))",
  line: "LINESTRING(0 0,1 1,2 0,3 1,4 0)",
  cw: "POLYGON((0 0,0 4,4 4,4 0,0 0))",
} as const;
type WitnessGeometry = keyof typeof postgisSfcgalWitnessGeometries;
const W = postgisSfcgalWitnessGeometries;

/** Raw SQL oracle; `s`/`p` are the quoted postgis_sfcgal and postgis schemas. */
export function postgisSfcgalRawWitnesses(s: string, p: string) {
  const g = (k: WitnessGeometry) => `'${W[k]}'::geometry`;
  const solid = `${s}.cg_makesolid(${s}.cg_extrude(${g("poly")},0,0,1))`;
  const agg = (fn: string, a: WitnessGeometry, b: WitnessGeometry) => `${s}.${fn}(g) FROM (VALUES (${g(a)}),(${g(b)})) v(g)`;
  const table = {
    "cg_2drotate/4": `${s}.cg_2drotate(${g("poly")},pi()/2,2,2)`,
    "cg_3dalphawrapping/3": `${s}.cg_3dalphawrapping(${g("ptsz")},10)`,
    "cg_3darea/1": `${s}.cg_3darea(${g("polyz")})`,
    "cg_3dbuffer/4": `${p}.st_npoints(${s}.cg_3dbuffer('POINT Z(0 0 0)'::geometry,1,8,0))`,
    "cg_3dconvexhull/1": `${s}.cg_3dconvexhull(${g("ptsz")})`,
    "cg_3ddifference/2": `${s}.cg_3ddifference(${solid},${s}.cg_makesolid(${s}.cg_extrude(${g("poly2")},0,0,1)))`,
    "cg_3ddistance/2": `${s}.cg_3ddistance('POINT Z(0 0 0)'::geometry,'POINT Z(1 2 2)'::geometry)`,
    "cg_3dintersection/2": `${s}.cg_3dintersection(${g("polyz")},${g("polyz2")})`,
    "cg_3dintersects/2": `${s}.cg_3dintersects(${g("polyz")},${g("polyz2")})`,
    "cg_3drotate/5": `${s}.cg_3drotate('POINT Z(1 0 0)'::geometry,pi()/2,0,0,1)`,
    "cg_3dscale/4": `${s}.cg_3dscale('POINT Z(1 2 3)'::geometry,2,3,4)`,
    "cg_3dscalearoundcenter/7": `${s}.cg_3dscalearoundcenter('POINT Z(2 2 2)'::geometry,2,2,2,1,1,1)`,
    "cg_3dtranslate/4": `${s}.cg_3dtranslate('POINT Z(1 2 3)'::geometry,1,1,1)`,
    "cg_3dunion/2": `${s}.cg_3dunion(${g("polyz")},${g("polyz2")})`,
    "cg_3dunion/1": agg("cg_3dunion", "polyz", "polyz2"),
    "cg_alphashape/3": `${s}.cg_alphashape(${g("pts")})`,
    "cg_approxconvexpartition/1": `${s}.cg_approxconvexpartition(${g("lpoly")})`,
    "cg_approximatemedialaxis/1": `${s}.cg_approximatemedialaxis(${g("lpoly")})`,
    "cg_area/1": `${s}.cg_area(${g("poly")})`,
    "cg_constraineddelaunaytriangles/1": `${s}.cg_constraineddelaunaytriangles(${g("poly")})`,
    "cg_difference/2": `${s}.cg_difference(${g("poly")},${g("poly2")})`,
    "cg_distance/2": `${s}.cg_distance('POINT(0 0)'::geometry,'POINT(3 4)'::geometry)`,
    "cg_extrude/4": `${s}.cg_extrude(${g("poly")},0,0,1)`,
    "cg_extrudestraightskeleton/3": `${s}.cg_extrudestraightskeleton(${g("poly")},2)`,
    "cg_forcelhr/1": `${s}.cg_forcelhr(${g("cw")})`,
    "cg_greeneapproxconvexpartition/1": `${s}.cg_greeneapproxconvexpartition(${g("lpoly")})`,
    "cg_intersection/2": `${s}.cg_intersection(${g("poly")},${g("poly2")})`,
    "cg_intersects/2": `${s}.cg_intersects(${g("poly")},${g("poly2")})`,
    "cg_isplanar/1": `${s}.cg_isplanar(${g("polyz")})`,
    "cg_issolid/1": `${s}.cg_issolid(${solid})`,
    "cg_makesolid/1": `${p}.st_geometrytype(${solid})`,
    "cg_minkowskisum/2": `${s}.cg_minkowskisum('LINESTRING(0 0,4 0)'::geometry,${g("poly")})`,
    "cg_optimalalphashape/3": `${s}.cg_optimalalphashape(${g("pts")})`,
    "cg_optimalconvexpartition/1": `${s}.cg_optimalconvexpartition(${g("lpoly")})`,
    "cg_orientation/1": `${s}.cg_orientation(${g("poly")})`,
    "cg_rotate/2": `${s}.cg_rotate('POINT(1 0)'::geometry,pi()/2)`,
    "cg_rotatex/2": `${s}.cg_rotatex('POINT Z(0 1 0)'::geometry,pi()/2)`,
    "cg_rotatey/2": `${s}.cg_rotatey('POINT Z(0 0 1)'::geometry,pi()/2)`,
    "cg_rotatez/2": `${s}.cg_rotatez('POINT Z(1 0 0)'::geometry,pi()/2)`,
    "cg_scale/2": `${s}.cg_scale('POINT(1 2)'::geometry,3)`,
    "cg_simplify/3": `${s}.cg_simplify(${g("line")},0.5)`,
    "cg_straightskeleton/2": `${s}.cg_straightskeleton(${g("poly")})`,
    "cg_straightskeletonpartition/2": `${s}.cg_straightskeletonpartition(${g("lpoly")},true)`,
    "cg_tesselate/1": `${s}.cg_tesselate(${g("poly")})`,
    "cg_translate/3": `${s}.cg_translate('POINT(1 2)'::geometry,1,1)`,
    "cg_triangulate/1": `${s}.cg_triangulate(${g("pts")})`,
    "cg_union/2": `${s}.cg_union(${g("poly")},${g("poly2")})`,
    "cg_union/1": agg("cg_union", "poly", "poly2"),
    "cg_visibility/3": `${s}.cg_visibility(${g("lpoly")},'POINT(0 0)'::geometry,'POINT(4 0)'::geometry)`,
    "cg_visibility/2": `${s}.cg_visibility(${g("lpoly")},'POINT(0.5 0.5)'::geometry)`,
    "cg_volume/1": `${s}.cg_volume(${solid})`,
    "cg_ymonotonepartition/1": `${s}.cg_ymonotonepartition(${g("lpoly")})`,
    "postgis_sfcgal_full_version/0": `${s}.postgis_sfcgal_full_version()`,
    "postgis_sfcgal_noop/1": `${s}.postgis_sfcgal_noop(${g("poly")})`,
    "postgis_sfcgal_scripts_installed/0": `${s}.postgis_sfcgal_scripts_installed()`,
    "postgis_sfcgal_version/0": `${s}.postgis_sfcgal_version()`,
    "st_3darea/1": `${s}.st_3darea(${g("polyz")})`,
    "st_3dconvexhull/1": `${s}.st_3dconvexhull(${g("ptsz")})`,
    "st_3ddifference/2": `${s}.st_3ddifference(${g("polyz")},${g("polyz2")})`,
    "st_3dintersection/2": `${s}.st_3dintersection(${g("polyz")},${g("polyz2")})`,
    "st_3dunion/2": `${s}.st_3dunion(${g("polyz")},${g("polyz2")})`,
    "st_3dunion/1": agg("st_3dunion", "polyz", "polyz2"),
    "st_alphashape/3": `${s}.st_alphashape(${g("pts")})`,
    "st_approximatemedialaxis/1": `${s}.st_approximatemedialaxis(${g("lpoly")})`,
    "st_constraineddelaunaytriangles/1": `${s}.st_constraineddelaunaytriangles(${g("poly")})`,
    "st_extrude/4": `${s}.st_extrude(${g("poly")},0,0,1)`,
    "st_forcelhr/1": `${s}.st_forcelhr(${g("cw")})`,
    "st_isplanar/1": `${s}.st_isplanar(${g("polyz")})`,
    "st_issolid/1": `${s}.st_issolid(${solid})`,
    "st_makesolid/1": `${p}.st_geometrytype(${s}.st_makesolid(${s}.st_extrude(${g("poly")},0,0,1)))`,
    "st_minkowskisum/2": `${s}.st_minkowskisum('LINESTRING(0 0,4 0)'::geometry,${g("poly")})`,
    "st_optimalalphashape/3": `${s}.st_optimalalphashape(${g("pts")})`,
    "st_orientation/1": `${s}.st_orientation(${g("poly")})`,
    "st_straightskeleton/1": `${s}.st_straightskeleton(${g("poly")})`,
    "st_tesselate/1": `${s}.st_tesselate(${g("poly")})`,
    "st_volume/1": `${s}.st_volume(${solid})`,
  } satisfies Record<string, string>;
  return table;
}

type Api = ReturnType<typeof createPostgisSfcgal_3_6_4>;
type Geom = Parameters<Api["cgVolume"]>[0];
/** PostGIS-owned helpers the caller supplies (raw SQL in the oracle, the selected PostGIS binding in applications). */
export interface PostgisSfcgalWitnessHelpers {
  readonly geometry: (ewkt: string) => Geom;
  readonly npoints: (value: SQL<Geometry | null>) => SQL;
  readonly geometrytype: (value: SQL<Geometry | null>) => SQL;
}
export interface PostgisSfcgalApiWitness {
  readonly expr: SQL;
  /** Aggregate witnesses read column `g` from these shapes in order. */
  readonly from?: readonly [WitnessGeometry, WitnessGeometry];
}

/** Public adapter calls mirroring the raw SQL oracle exactly; defaults are omitted so PostgreSQL applies them. */
export function postgisSfcgalApiWitnesses(a: Api, h: PostgisSfcgalWitnessHelpers) {
  const G = h.geometry;
  const g = (k: WitnessGeometry) => G(W[k]);
  const solid = () => a.cgMakesolid(a.cgExtrude(g("poly"), 0, 0, 1));
  const col = sql<Geometry | null>`g`;
  const call = (expr: SQL, from?: readonly [WitnessGeometry, WitnessGeometry]): PostgisSfcgalApiWitness => (from ? { expr, from } : { expr });
  const table = {
    "cg_2drotate/4": call(a.cg2drotate(g("poly"), Math.PI / 2, 2, 2)),
    "cg_3dalphawrapping/3": call(a.cg3dalphawrapping(g("ptsz"), 10)),
    "cg_3darea/1": call(a.cg3darea(g("polyz"))),
    "cg_3dbuffer/4": call(h.npoints(a.cg3dbuffer(G("POINT Z(0 0 0)"), 1, 8, 0))),
    "cg_3dconvexhull/1": call(a.cg3dconvexhull(g("ptsz"))),
    "cg_3ddifference/2": call(a.cg3ddifference(solid(), a.cgMakesolid(a.cgExtrude(g("poly2"), 0, 0, 1)))),
    "cg_3ddistance/2": call(a.cg3ddistance(G("POINT Z(0 0 0)"), G("POINT Z(1 2 2)"))),
    "cg_3dintersection/2": call(a.cg3dintersection(g("polyz"), g("polyz2"))),
    "cg_3dintersects/2": call(a.cg3dintersects(g("polyz"), g("polyz2"))),
    "cg_3drotate/5": call(a.cg3drotate(G("POINT Z(1 0 0)"), Math.PI / 2, 0, 0, 1)),
    "cg_3dscale/4": call(a.cg3dscale(G("POINT Z(1 2 3)"), 2, 3, 4)),
    "cg_3dscalearoundcenter/7": call(a.cg3dscalearoundcenter(G("POINT Z(2 2 2)"), 2, 2, 2, 1, 1, 1)),
    "cg_3dtranslate/4": call(a.cg3dtranslate(G("POINT Z(1 2 3)"), 1, 1, 1)),
    "cg_3dunion/2": call(a.cg3dunion(g("polyz"), g("polyz2"))),
    "cg_3dunion/1": call(a.cg3dunion(col), ["polyz", "polyz2"]),
    "cg_alphashape/3": call(a.cgAlphashape(g("pts"))),
    "cg_approxconvexpartition/1": call(a.cgApproxconvexpartition(g("lpoly"))),
    "cg_approximatemedialaxis/1": call(a.cgApproximatemedialaxis(g("lpoly"))),
    "cg_area/1": call(a.cgArea(g("poly"))),
    "cg_constraineddelaunaytriangles/1": call(a.cgConstraineddelaunaytriangles(g("poly"))),
    "cg_difference/2": call(a.cgDifference(g("poly"), g("poly2"))),
    "cg_distance/2": call(a.cgDistance(G("POINT(0 0)"), G("POINT(3 4)"))),
    "cg_extrude/4": call(a.cgExtrude(g("poly"), 0, 0, 1)),
    "cg_extrudestraightskeleton/3": call(a.cgExtrudestraightskeleton(g("poly"), 2)),
    "cg_forcelhr/1": call(a.cgForcelhr(g("cw"))),
    "cg_greeneapproxconvexpartition/1": call(a.cgGreeneapproxconvexpartition(g("lpoly"))),
    "cg_intersection/2": call(a.cgIntersection(g("poly"), g("poly2"))),
    "cg_intersects/2": call(a.cgIntersects(g("poly"), g("poly2"))),
    "cg_isplanar/1": call(a.cgIsplanar(g("polyz"))),
    "cg_issolid/1": call(a.cgIssolid(solid())),
    "cg_makesolid/1": call(h.geometrytype(solid())),
    "cg_minkowskisum/2": call(a.cgMinkowskisum(G("LINESTRING(0 0,4 0)"), g("poly"))),
    "cg_optimalalphashape/3": call(a.cgOptimalalphashape(g("pts"))),
    "cg_optimalconvexpartition/1": call(a.cgOptimalconvexpartition(g("lpoly"))),
    "cg_orientation/1": call(a.cgOrientation(g("poly"))),
    "cg_rotate/2": call(a.cgRotate(G("POINT(1 0)"), Math.PI / 2)),
    "cg_rotatex/2": call(a.cgRotatex(G("POINT Z(0 1 0)"), Math.PI / 2)),
    "cg_rotatey/2": call(a.cgRotatey(G("POINT Z(0 0 1)"), Math.PI / 2)),
    "cg_rotatez/2": call(a.cgRotatez(G("POINT Z(1 0 0)"), Math.PI / 2)),
    "cg_scale/2": call(a.cgScale(G("POINT(1 2)"), 3)),
    "cg_simplify/3": call(a.cgSimplify(g("line"), 0.5)),
    "cg_straightskeleton/2": call(a.cgStraightskeleton(g("poly"))),
    "cg_straightskeletonpartition/2": call(a.cgStraightskeletonpartition(g("lpoly"), true)),
    "cg_tesselate/1": call(a.cgTesselate(g("poly"))),
    "cg_translate/3": call(a.cgTranslate(G("POINT(1 2)"), 1, 1)),
    "cg_triangulate/1": call(a.cgTriangulate(g("pts"))),
    "cg_union/2": call(a.cgUnion(g("poly"), g("poly2"))),
    "cg_union/1": call(a.cgUnion(col), ["poly", "poly2"]),
    "cg_visibility/3": call(a.cgVisibility(g("lpoly"), G("POINT(0 0)"), G("POINT(4 0)"))),
    "cg_visibility/2": call(a.cgVisibility(g("lpoly"), G("POINT(0.5 0.5)"))),
    "cg_volume/1": call(a.cgVolume(solid())),
    "cg_ymonotonepartition/1": call(a.cgYmonotonepartition(g("lpoly"))),
    "postgis_sfcgal_full_version/0": call(a.postgisSfcgalFullVersion()),
    "postgis_sfcgal_noop/1": call(a.postgisSfcgalNoop(g("poly"))),
    "postgis_sfcgal_scripts_installed/0": call(a.postgisSfcgalScriptsInstalled()),
    "postgis_sfcgal_version/0": call(a.postgisSfcgalVersion()),
    "st_3darea/1": call(a.st3darea(g("polyz"))),
    "st_3dconvexhull/1": call(a.st3dconvexhull(g("ptsz"))),
    "st_3ddifference/2": call(a.st3ddifference(g("polyz"), g("polyz2"))),
    "st_3dintersection/2": call(a.st3dintersection(g("polyz"), g("polyz2"))),
    "st_3dunion/2": call(a.st3dunion(g("polyz"), g("polyz2"))),
    "st_3dunion/1": call(a.st3dunion(col), ["polyz", "polyz2"]),
    "st_alphashape/3": call(a.stAlphashape(g("pts"))),
    "st_approximatemedialaxis/1": call(a.stApproximatemedialaxis(g("lpoly"))),
    "st_constraineddelaunaytriangles/1": call(a.stConstraineddelaunaytriangles(g("poly"))),
    "st_extrude/4": call(a.stExtrude(g("poly"), 0, 0, 1)),
    "st_forcelhr/1": call(a.stForcelhr(g("cw"))),
    "st_isplanar/1": call(a.stIsplanar(g("polyz"))),
    "st_issolid/1": call(a.stIssolid(solid())),
    "st_makesolid/1": call(h.geometrytype(a.stMakesolid(a.stExtrude(g("poly"), 0, 0, 1)))),
    "st_minkowskisum/2": call(a.stMinkowskisum(G("LINESTRING(0 0,4 0)"), g("poly"))),
    "st_optimalalphashape/3": call(a.stOptimalalphashape(g("pts"))),
    "st_orientation/1": call(a.stOrientation(g("poly"))),
    "st_straightskeleton/1": call(a.stStraightskeleton(g("poly"))),
    "st_tesselate/1": call(a.stTesselate(g("poly"))),
    "st_volume/1": call(a.stVolume(solid())),
  } satisfies Record<string, PostgisSfcgalApiWitness>;
  return table;
}

// CGAL's 3D difference emits the same triangles in run-dependent order; only these witnesses compare as a patch multiset.
const unordered = new Set(["cg_3ddifference/2", "st_3ddifference/2"]);
const patchSet = (ewkt: string | null | undefined) =>
  [...(ewkt ?? "").matchAll(/\(\(([^()]+)\)\)/g)]
    .map((m) => [...new Set(m[1]!.split(","))].toSorted().join(","))
    .toSorted()
    .join("|") + `#${/^\w+/.exec(ewkt ?? "")?.[0]}`;
/** Compares one application-observed text value with the raw native oracle's text value. */
export function postgisSfcgalSameNative(key: string, type: string, observed: string | null, oracle: string | null) {
  if (type === "double precision") return observed !== null && oracle !== null && Number(observed) === Number(oracle);
  if (unordered.has(key)) return patchSet(observed) === patchSet(oracle);
  return observed === oracle;
}
