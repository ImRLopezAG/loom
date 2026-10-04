import { sql, type SQL } from "drizzle-orm";
import {
  createCube_1_5,
  cubePoint,
  type CubeValue,
  type CubeCoordinate,
  type PostgreSqlArray,
} from "kello/extensions/cube";
import { defineSchema } from "kello/server";
const api = createCube_1_5({
  name: "cube",
  version: "1.5",
  schema: 'Cube"日本',
  apiSupport: { status: "verified", digest: "205421c1cacc198ba7088c60ec4f76b0a8e7adec18be87d17a8082dd7b0515e2" },
});
const lhs = cubePoint([1, 2]),
  rhs = cubePoint([3, 4]);
const fs: PostgreSqlArray<CubeCoordinate> = { dimensions: [{ lowerBound: -2, length: 2 }], values: [1, 2] };
const indices: PostgreSqlArray<number> = { dimensions: [{ lowerBound: 1, length: 2 }], values: [2, 1] };
const idx = 1,
  radius = 0.5;
const schema = defineSchema(() => ({ entries: { value: api.field().notNull(), tags: api.arrayField() } }));
const column: SQL<boolean | null> = api.equal(schema.tables.entries.value, lhs);
const version: "1.5" = api.version;
const result0: SQL<CubeCoordinate | null> = api.sql.overloads[
  "operator:$extension:cube.->($extension:cube.cube,pg_catalog.int4)"
](lhs, idx);
const result1: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:cube.@>($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result2: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:cube.&&($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result3: SQL<CubeCoordinate | null> = api.sql.overloads[
  "operator:$extension:cube.<->($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result4: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:cube.<($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result5: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:cube.<@($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result6: SQL<CubeCoordinate | null> = api.sql.overloads[
  "operator:$extension:cube.<#>($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result7: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:cube.<=($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result8: SQL<CubeCoordinate | null> = api.sql.overloads[
  "operator:$extension:cube.<=>($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result9: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:cube.<>($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result10: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:cube.=($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result11: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:cube.>($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result12: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:cube.>=($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result13: SQL<CubeCoordinate | null> = api.sql.overloads[
  "operator:$extension:cube.~>($extension:cube.cube,pg_catalog.int4)"
](lhs, idx);
const result14: SQL<number | null> = api.sql.overloads[
  "routine:$extension:cube.cube_cmp($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result15: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:cube.cube_contained($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result16: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:cube.cube_contains($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result17: SQL<CubeCoordinate | null> = api.sql.overloads[
  "routine:$extension:cube.cube_coord_llur($extension:cube.cube,pg_catalog.int4)"
](lhs, idx);
const result18: SQL<CubeCoordinate | null> = api.sql.overloads[
  "routine:$extension:cube.cube_coord($extension:cube.cube,pg_catalog.int4)"
](lhs, idx);
const result19: SQL<number | null> = api.sql.overloads["routine:$extension:cube.cube_dim($extension:cube.cube)"](lhs);
const result20: SQL<CubeCoordinate | null> = api.sql.overloads[
  "routine:$extension:cube.cube_distance($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result21: SQL<CubeValue | null> = api.sql.overloads[
  "routine:$extension:cube.cube_enlarge($extension:cube.cube,pg_catalog.float8,pg_catalog.int4)"
](lhs, radius, idx);
const result22: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:cube.cube_eq($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result23: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:cube.cube_ge($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result24: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:cube.cube_gt($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result25: SQL<CubeValue | null> = api.sql.overloads[
  "routine:$extension:cube.cube_inter($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result26: SQL<boolean | null> =
  api.sql.overloads["routine:$extension:cube.cube_is_point($extension:cube.cube)"](lhs);
const result27: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:cube.cube_le($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result28: SQL<CubeCoordinate | null> = api.sql.overloads[
  "routine:$extension:cube.cube_ll_coord($extension:cube.cube,pg_catalog.int4)"
](lhs, idx);
const result29: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:cube.cube_lt($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result30: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:cube.cube_ne($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result31: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:cube.cube_overlap($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result32: SQL<{ readonly hex: string } | null> =
  api.sql.overloads["routine:$extension:cube.cube_send($extension:cube.cube)"](lhs);
const result33: SQL<CubeCoordinate | null> =
  api.sql.overloads["routine:$extension:cube.cube_size($extension:cube.cube)"](lhs);
const result34: SQL<CubeValue | null> = api.sql.overloads[
  "routine:$extension:cube.cube_subset($extension:cube.cube,pg_catalog._int4)"
](lhs, indices);
const result35: SQL<CubeValue | null> = api.sql.overloads[
  "routine:$extension:cube.cube_union($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result36: SQL<CubeCoordinate | null> = api.sql.overloads[
  "routine:$extension:cube.cube_ur_coord($extension:cube.cube,pg_catalog.int4)"
](lhs, idx);
const result37: SQL<CubeValue | null> = api.sql.overloads[
  "routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8,pg_catalog.float8)"
](lhs, radius, radius);
const result38: SQL<CubeValue | null> = api.sql.overloads[
  "routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8)"
](lhs, radius);
const result39: SQL<CubeValue | null> = api.sql.overloads[
  "routine:$extension:cube.cube(pg_catalog._float8,pg_catalog._float8)"
](fs, fs);
const result40: SQL<CubeValue | null> = api.sql.overloads["routine:$extension:cube.cube(pg_catalog._float8)"](fs);
const result41: SQL<CubeValue | null> = api.sql.overloads[
  "routine:$extension:cube.cube(pg_catalog.float8,pg_catalog.float8)"
](radius, radius);
const result42: SQL<CubeValue | null> = api.sql.overloads["routine:$extension:cube.cube(pg_catalog.float8)"](radius);
const result43: SQL<CubeCoordinate | null> = api.sql.overloads[
  "routine:$extension:cube.distance_chebyshev($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
const result44: SQL<CubeCoordinate | null> = api.sql.overloads[
  "routine:$extension:cube.distance_taxicab($extension:cube.cube,$extension:cube.cube)"
](lhs, rhs);
// @ts-expect-error Native text cannot substitute for a cube value.
api.distance("(1)", lhs);
// @ts-expect-error Boolean expressions cannot substitute for a cube column.
api.contains(sql<boolean>`true`, lhs);
// @ts-expect-error Coordinate type is numeric, never string.
api.fromNumber("1");
// @ts-expect-error Native arrays retain dimensions, not a shallow JS array.
api.fromArray([1, 2]);
// @ts-expect-error The captured overload requires its third argument.
api.enlarge(lhs, 1);
// @ts-expect-error Return codec cannot be chosen by a caller.
api.distance<string>(lhs, rhs);
// @ts-expect-error Backend internal callbacks are not public query helpers.
api.sql.functions.g_cube_consistent(lhs);
// @ts-expect-error Wrong selected version is rejected statically.
createCube_1_5({ ...api, version: "1.4" });
void [
  column,
  version,
  result0,
  result1,
  result2,
  result3,
  result4,
  result5,
  result6,
  result7,
  result8,
  result9,
  result10,
  result11,
  result12,
  result13,
  result14,
  result15,
  result16,
  result17,
  result18,
  result19,
  result20,
  result21,
  result22,
  result23,
  result24,
  result25,
  result26,
  result27,
  result28,
  result29,
  result30,
  result31,
  result32,
  result33,
  result34,
  result35,
  result36,
  result37,
  result38,
  result39,
  result40,
  result41,
  result42,
  result43,
  result44,
];
