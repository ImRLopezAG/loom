import pg from "pg";
import { sql, defineRelations, type SQL } from "drizzle-orm";
import {
  createCube_1_5,
  type CubeValue,
  type CubeCoordinate,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/cube";
import { defineSchema, defineTable } from "../../../apps/loom/src/core/server/index";
import { connectDatabase, type DatabaseConnection } from "../../../apps/loom/src/core/server/database/connection";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "./extension-database";
import assert from "node:assert/strict";
import { observeExtensionProofDatabase } from "./extension-proof-database";

export const cubeSchema = 'Cube"日本';
export const cubeNamespace = pg.escapeIdentifier(cubeSchema);
export const cubeType = `${cubeNamespace}.cube`;
export const cubeApi = createCube_1_5({
  name: "cube",
  version: "1.5",
  schema: cubeSchema,
  apiSupport: {
    status: "verified",
    digest: "205421c1cacc198ba7088c60ec4f76b0a8e7adec18be87d17a8082dd7b0515e2",
  },
});
export const cubeManaged = defineSchema(
  () => ({
    entries: defineTable(
      {
        value: cubeApi.field(),
        tags: cubeApi.arrayField(),
        fallback: cubeApi
          .field()
          .notNull()
          .default(cubeApi.point([7])),
      },
      {
        indexes: [
          { fields: ["value"], extension: cubeApi.indexes.btree() },
          { fields: ["value"], extension: cubeApi.indexes.gist() },
        ],
      },
    ),
  }),
  { namespace: "app" },
);
const relations = defineRelations(cubeManaged.tables);
export async function withCubeApi(
  work: (fixture: {
    client: pg.Client;
    connection: DatabaseConnection<typeof relations>;
    api: typeof cubeApi;
  }) => Promise<void>,
  proofCaseId?: string,
) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const server = await client.query("select current_setting('server_version_num')::int version");
      assert.equal(Math.floor(server.rows[0].version / 10000), 18);
      await client.query(
        `create schema ${cubeNamespace}; create extension cube with schema ${cubeNamespace} version '1.5'`,
      );
      if (proofCaseId) await observeExtensionProofDatabase(url, proofCaseId, "cube");
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(cubeManaged)))
        await client.query(statement);
      await client.query(
        `create table portable_cube_inputs(lhs ${cubeType}, rhs ${cubeType}, fs float8[], indices int4[], idx int4, radius float8)`,
      );
      // Independent native constructors populate the input table; no adapter encoder feeds the oracle.
      await client.query(
        `insert into portable_cube_inputs values (${cubeNamespace}.cube(array[1,2]::float8[],array[3,4]::float8[]),${cubeNamespace}.cube(array[2,3]::float8[],array[5,6]::float8[]),'[-2:-1]={1,2}'::float8[],array[2,1],1,0.5)`,
      );
      const connection = await connectDatabase({
        schema: cubeManaged,
        relations,
        connectionString: url,
      });
      try {
        await work({ client, connection, api: cubeApi });
      } finally {
        await connection.close();
      }
    } finally {
      await client.end();
    }
  });
}
export interface CubeCase {
  readonly member: string;
  readonly kind: "cube" | "bool" | "int4" | "float8" | "bytea";
  readonly expression: SQL;
  readonly native: string;
}
export function cubeCases(api = cubeApi): readonly CubeCase[] {
  const lhs = sql<CubeValue>`lhs`,
    rhs = sql<CubeValue>`rhs`,
    fs = sql<PostgreSqlArray<CubeCoordinate>>`fs`,
    indices = sql<PostgreSqlArray<number>>`indices`,
    idx = sql<number>`idx`,
    radius = sql<CubeCoordinate>`radius`;
  return [
    {
      member: "operator:$extension:cube.->($extension:cube.cube,pg_catalog.int4)",
      kind: "float8",
      expression: api.sql.overloads["operator:$extension:cube.->($extension:cube.cube,pg_catalog.int4)"](lhs, idx),
      native: `(lhs operator(${cubeNamespace}.->) idx)`,
    },
    {
      member: "operator:$extension:cube.@>($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:cube.@>($extension:cube.cube,$extension:cube.cube)"](lhs, rhs),
      native: `(lhs operator(${cubeNamespace}.@>) rhs)`,
    },
    {
      member: "operator:$extension:cube.&&($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:cube.&&($extension:cube.cube,$extension:cube.cube)"](lhs, rhs),
      native: `(lhs operator(${cubeNamespace}.&&) rhs)`,
    },
    {
      member: "operator:$extension:cube.<->($extension:cube.cube,$extension:cube.cube)",
      kind: "float8",
      expression: api.sql.overloads["operator:$extension:cube.<->($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `(lhs operator(${cubeNamespace}.<->) rhs)`,
    },
    {
      member: "operator:$extension:cube.<($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:cube.<($extension:cube.cube,$extension:cube.cube)"](lhs, rhs),
      native: `(lhs operator(${cubeNamespace}.<) rhs)`,
    },
    {
      member: "operator:$extension:cube.<@($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:cube.<@($extension:cube.cube,$extension:cube.cube)"](lhs, rhs),
      native: `(lhs operator(${cubeNamespace}.<@) rhs)`,
    },
    {
      member: "operator:$extension:cube.<#>($extension:cube.cube,$extension:cube.cube)",
      kind: "float8",
      expression: api.sql.overloads["operator:$extension:cube.<#>($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `(lhs operator(${cubeNamespace}.<#>) rhs)`,
    },
    {
      member: "operator:$extension:cube.<=($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:cube.<=($extension:cube.cube,$extension:cube.cube)"](lhs, rhs),
      native: `(lhs operator(${cubeNamespace}.<=) rhs)`,
    },
    {
      member: "operator:$extension:cube.<=>($extension:cube.cube,$extension:cube.cube)",
      kind: "float8",
      expression: api.sql.overloads["operator:$extension:cube.<=>($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `(lhs operator(${cubeNamespace}.<=>) rhs)`,
    },
    {
      member: "operator:$extension:cube.<>($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:cube.<>($extension:cube.cube,$extension:cube.cube)"](lhs, rhs),
      native: `(lhs operator(${cubeNamespace}.<>) rhs)`,
    },
    {
      member: "operator:$extension:cube.=($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:cube.=($extension:cube.cube,$extension:cube.cube)"](lhs, rhs),
      native: `(lhs operator(${cubeNamespace}.=) rhs)`,
    },
    {
      member: "operator:$extension:cube.>($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:cube.>($extension:cube.cube,$extension:cube.cube)"](lhs, rhs),
      native: `(lhs operator(${cubeNamespace}.>) rhs)`,
    },
    {
      member: "operator:$extension:cube.>=($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:cube.>=($extension:cube.cube,$extension:cube.cube)"](lhs, rhs),
      native: `(lhs operator(${cubeNamespace}.>=) rhs)`,
    },
    {
      member: "operator:$extension:cube.~>($extension:cube.cube,pg_catalog.int4)",
      kind: "float8",
      expression: api.sql.overloads["operator:$extension:cube.~>($extension:cube.cube,pg_catalog.int4)"](lhs, idx),
      native: `(lhs operator(${cubeNamespace}.~>) idx)`,
    },
    {
      member: "routine:$extension:cube.cube_cmp($extension:cube.cube,$extension:cube.cube)",
      kind: "int4",
      expression: api.sql.overloads["routine:$extension:cube.cube_cmp($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `${cubeNamespace}.cube_cmp(lhs, rhs)`,
    },
    {
      member: "routine:$extension:cube.cube_contained($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads[
        "routine:$extension:cube.cube_contained($extension:cube.cube,$extension:cube.cube)"
      ](lhs, rhs),
      native: `${cubeNamespace}.cube_contained(lhs, rhs)`,
    },
    {
      member: "routine:$extension:cube.cube_contains($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:cube.cube_contains($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `${cubeNamespace}.cube_contains(lhs, rhs)`,
    },
    {
      member: "routine:$extension:cube.cube_coord_llur($extension:cube.cube,pg_catalog.int4)",
      kind: "float8",
      expression: api.sql.overloads["routine:$extension:cube.cube_coord_llur($extension:cube.cube,pg_catalog.int4)"](
        lhs,
        idx,
      ),
      native: `${cubeNamespace}.cube_coord_llur(lhs, idx)`,
    },
    {
      member: "routine:$extension:cube.cube_coord($extension:cube.cube,pg_catalog.int4)",
      kind: "float8",
      expression: api.sql.overloads["routine:$extension:cube.cube_coord($extension:cube.cube,pg_catalog.int4)"](
        lhs,
        idx,
      ),
      native: `${cubeNamespace}.cube_coord(lhs, idx)`,
    },
    {
      member: "routine:$extension:cube.cube_dim($extension:cube.cube)",
      kind: "int4",
      expression: api.sql.overloads["routine:$extension:cube.cube_dim($extension:cube.cube)"](lhs),
      native: `${cubeNamespace}.cube_dim(lhs)`,
    },
    {
      member: "routine:$extension:cube.cube_distance($extension:cube.cube,$extension:cube.cube)",
      kind: "float8",
      expression: api.sql.overloads["routine:$extension:cube.cube_distance($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `${cubeNamespace}.cube_distance(lhs, rhs)`,
    },
    {
      member: "routine:$extension:cube.cube_enlarge($extension:cube.cube,pg_catalog.float8,pg_catalog.int4)",
      kind: "cube",
      expression: api.sql.overloads[
        "routine:$extension:cube.cube_enlarge($extension:cube.cube,pg_catalog.float8,pg_catalog.int4)"
      ](lhs, radius, idx),
      native: `${cubeNamespace}.cube_enlarge(lhs, radius, idx)`,
    },
    {
      member: "routine:$extension:cube.cube_eq($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:cube.cube_eq($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `${cubeNamespace}.cube_eq(lhs, rhs)`,
    },
    {
      member: "routine:$extension:cube.cube_ge($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:cube.cube_ge($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `${cubeNamespace}.cube_ge(lhs, rhs)`,
    },
    {
      member: "routine:$extension:cube.cube_gt($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:cube.cube_gt($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `${cubeNamespace}.cube_gt(lhs, rhs)`,
    },
    {
      member: "routine:$extension:cube.cube_inter($extension:cube.cube,$extension:cube.cube)",
      kind: "cube",
      expression: api.sql.overloads["routine:$extension:cube.cube_inter($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `${cubeNamespace}.cube_inter(lhs, rhs)`,
    },
    {
      member: "routine:$extension:cube.cube_is_point($extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:cube.cube_is_point($extension:cube.cube)"](lhs),
      native: `${cubeNamespace}.cube_is_point(lhs)`,
    },
    {
      member: "routine:$extension:cube.cube_le($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:cube.cube_le($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `${cubeNamespace}.cube_le(lhs, rhs)`,
    },
    {
      member: "routine:$extension:cube.cube_ll_coord($extension:cube.cube,pg_catalog.int4)",
      kind: "float8",
      expression: api.sql.overloads["routine:$extension:cube.cube_ll_coord($extension:cube.cube,pg_catalog.int4)"](
        lhs,
        idx,
      ),
      native: `${cubeNamespace}.cube_ll_coord(lhs, idx)`,
    },
    {
      member: "routine:$extension:cube.cube_lt($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:cube.cube_lt($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `${cubeNamespace}.cube_lt(lhs, rhs)`,
    },
    {
      member: "routine:$extension:cube.cube_ne($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:cube.cube_ne($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `${cubeNamespace}.cube_ne(lhs, rhs)`,
    },
    {
      member: "routine:$extension:cube.cube_overlap($extension:cube.cube,$extension:cube.cube)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:cube.cube_overlap($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `${cubeNamespace}.cube_overlap(lhs, rhs)`,
    },
    {
      member: "routine:$extension:cube.cube_send($extension:cube.cube)",
      kind: "bytea",
      expression: api.sql.overloads["routine:$extension:cube.cube_send($extension:cube.cube)"](lhs),
      native: `${cubeNamespace}.cube_send(lhs)`,
    },
    {
      member: "routine:$extension:cube.cube_size($extension:cube.cube)",
      kind: "float8",
      expression: api.sql.overloads["routine:$extension:cube.cube_size($extension:cube.cube)"](lhs),
      native: `${cubeNamespace}.cube_size(lhs)`,
    },
    {
      member: "routine:$extension:cube.cube_subset($extension:cube.cube,pg_catalog._int4)",
      kind: "cube",
      expression: api.sql.overloads["routine:$extension:cube.cube_subset($extension:cube.cube,pg_catalog._int4)"](
        lhs,
        indices,
      ),
      native: `${cubeNamespace}.cube_subset(lhs, indices)`,
    },
    {
      member: "routine:$extension:cube.cube_union($extension:cube.cube,$extension:cube.cube)",
      kind: "cube",
      expression: api.sql.overloads["routine:$extension:cube.cube_union($extension:cube.cube,$extension:cube.cube)"](
        lhs,
        rhs,
      ),
      native: `${cubeNamespace}.cube_union(lhs, rhs)`,
    },
    {
      member: "routine:$extension:cube.cube_ur_coord($extension:cube.cube,pg_catalog.int4)",
      kind: "float8",
      expression: api.sql.overloads["routine:$extension:cube.cube_ur_coord($extension:cube.cube,pg_catalog.int4)"](
        lhs,
        idx,
      ),
      native: `${cubeNamespace}.cube_ur_coord(lhs, idx)`,
    },
    {
      member: "routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8,pg_catalog.float8)",
      kind: "cube",
      expression: api.sql.overloads[
        "routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8,pg_catalog.float8)"
      ](lhs, radius, radius),
      native: `${cubeNamespace}.cube(lhs, radius, radius)`,
    },
    {
      member: "routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8)",
      kind: "cube",
      expression: api.sql.overloads["routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8)"](
        lhs,
        radius,
      ),
      native: `${cubeNamespace}.cube(lhs, radius)`,
    },
    {
      member: "routine:$extension:cube.cube(pg_catalog._float8,pg_catalog._float8)",
      kind: "cube",
      expression: api.sql.overloads["routine:$extension:cube.cube(pg_catalog._float8,pg_catalog._float8)"](fs, fs),
      native: `${cubeNamespace}.cube(fs, fs)`,
    },
    {
      member: "routine:$extension:cube.cube(pg_catalog._float8)",
      kind: "cube",
      expression: api.sql.overloads["routine:$extension:cube.cube(pg_catalog._float8)"](fs),
      native: `${cubeNamespace}.cube(fs)`,
    },
    {
      member: "routine:$extension:cube.cube(pg_catalog.float8,pg_catalog.float8)",
      kind: "cube",
      expression: api.sql.overloads["routine:$extension:cube.cube(pg_catalog.float8,pg_catalog.float8)"](
        radius,
        radius,
      ),
      native: `${cubeNamespace}.cube(radius, radius)`,
    },
    {
      member: "routine:$extension:cube.cube(pg_catalog.float8)",
      kind: "cube",
      expression: api.sql.overloads["routine:$extension:cube.cube(pg_catalog.float8)"](radius),
      native: `${cubeNamespace}.cube(radius)`,
    },
    {
      member: "routine:$extension:cube.distance_chebyshev($extension:cube.cube,$extension:cube.cube)",
      kind: "float8",
      expression: api.sql.overloads[
        "routine:$extension:cube.distance_chebyshev($extension:cube.cube,$extension:cube.cube)"
      ](lhs, rhs),
      native: `${cubeNamespace}.distance_chebyshev(lhs, rhs)`,
    },
    {
      member: "routine:$extension:cube.distance_taxicab($extension:cube.cube,$extension:cube.cube)",
      kind: "float8",
      expression: api.sql.overloads[
        "routine:$extension:cube.distance_taxicab($extension:cube.cube,$extension:cube.cube)"
      ](lhs, rhs),
      native: `${cubeNamespace}.distance_taxicab(lhs, rhs)`,
    },
  ];
}
// Independent binary reader follows cube_send's network-order header and float8 payload, not the production text codec.
export function readCubeBinary(bytes: Buffer) {
  assert(bytes.length >= 4);
  const header = bytes.readUInt32BE(0),
    dimension = header & 0x7fffffff,
    pointStorage = (header & 0x80000000) !== 0;
  assert(dimension <= 100);
  assert.equal(bytes.length, 4 + 8 * dimension * (pointStorage ? 1 : 2));
  const coordinate = (offset: number): CubeCoordinate => {
    const number = bytes.readDoubleBE(offset);
    return Number.isFinite(number)
      ? number
      : { nonfinite: Number.isNaN(number) ? "NaN" : number > 0 ? "Infinity" : "-Infinity" };
  };
  const lower = Array.from({ length: dimension }, (_, i) => coordinate(4 + 8 * i));
  const upper = pointStorage ? lower : Array.from({ length: dimension }, (_, i) => coordinate(4 + 8 * (dimension + i)));
  return { dimension, pointStorage, lower, upper };
}
export async function nativeCube(
  client: pg.Client,
  expression: string,
  values: readonly unknown[] = [],
): Promise<CubeValue | null> {
  const result = await client.query<{
    bytes: Buffer | null;
    point: boolean | null;
    dimension: number | null;
  }>(
    `with input as (select ${expression} value) select ${cubeNamespace}.cube_send(value) bytes, ${cubeNamespace}.cube_is_point(value) point, ${cubeNamespace}.cube_dim(value) dimension from input`,
    [...values],
  );
  assert.equal(result.rows.length, 1);
  const row = result.rows[0]!;
  if (row.bytes === null) {
    assert.equal(row.point, null);
    return null;
  }
  const decoded = readCubeBinary(row.bytes);
  assert.equal(decoded.dimension, row.dimension);
  return row.point
    ? { kind: "point", coordinates: [...decoded.lower] }
    : { kind: "box", lower: [...decoded.lower], upper: [...decoded.upper] };
}
