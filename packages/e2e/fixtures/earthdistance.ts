import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, sql, type SQL } from "drizzle-orm";
import {
  createEarthdistance_1_2,
  type EarthValue,
  type EarthPoint,
} from "../../../apps/loom/src/core/extensions/adapters/earthdistance";
import { type CubeValue } from "../../../apps/loom/src/core/extensions/adapters/cube";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase, type DatabaseConnection } from "../../../apps/loom/src/core/server/database/connection";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "./extension-database";
import { observeExtensionProofDatabase } from "./extension-proof-database";

export const earthdistanceDescriptor = {
  name: "earthdistance",
  version: "1.2",
  schema: "Earth日本",
  apiSupport: { status: "verified", digest: "13bae0f141ff6fb7a7e4253e02958e7b6dd18c82db9b51c03bf12605df99fcd6" },
} as const;
export const earthdistanceCubeDescriptor = {
  name: "cube",
  version: "1.5",
  schema: "Earth日本",
  apiSupport: { status: "verified", digest: "205421c1cacc198ba7088c60ec4f76b0a8e7adec18be87d17a8082dd7b0515e2" },
} as const;
export const earthdistanceNamespace = pg.escapeIdentifier(earthdistanceDescriptor.schema);
export const earthdistanceCubeNamespace = pg.escapeIdentifier(earthdistanceCubeDescriptor.schema);
export const earthdistanceType = `${earthdistanceNamespace}.earth`;
export const earthdistanceApi = createEarthdistance_1_2(earthdistanceDescriptor, earthdistanceCubeDescriptor);
export const earthdistanceManaged = defineSchema(
  () => ({ entries: { value: earthdistanceApi.field(), tags: earthdistanceApi.arrayField() } }),
  { namespace: "app" },
);
const relations = defineRelations(earthdistanceManaged.tables);
export async function withEarthdistanceApi(
  work: (fixture: {
    client: pg.Client;
    connection: DatabaseConnection<typeof relations>;
    api: typeof earthdistanceApi;
  }) => Promise<void>,
  proofCaseId?: string,
  cubeSchema: string = earthdistanceCubeDescriptor.schema,
) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const server = await client.query<{ version: number }>(
        "select current_setting('server_version_num')::int version",
      );
      assert.equal(Math.floor(server.rows[0]!.version / 10000), 18);
      const cubeNamespace = pg.escapeIdentifier(cubeSchema);
      await client.query(`create schema ${earthdistanceNamespace}`);
      if (cubeSchema !== earthdistanceDescriptor.schema) await client.query(`create schema ${cubeNamespace}`);
      await client.query(
        `create extension cube with schema ${cubeNamespace} version '1.5'; create extension earthdistance with schema ${earthdistanceNamespace} version '1.2'`,
      );
      if (proofCaseId) await observeExtensionProofDatabase(url, proofCaseId, "earthdistance");
      for (const statement of await migrationStatements(
        await emptySnapshot("app"),
        await createSnapshot(earthdistanceManaged),
      ))
        await client.query(statement);
      // Native constructors populate the oracle table. No adapter codec feeds these inputs.
      await client.query(
        `create table earthdistance_inputs as select ${earthdistanceNamespace}.ll_to_earth(0,0) lhs, ${earthdistanceNamespace}.ll_to_earth(0,90) rhs, point(0,0) p, point(90,0) q, 1000::float8 radius, 18.4::float8 lat, -69.9::float8 lon`,
      );
      const connection = await connectDatabase({ schema: earthdistanceManaged, relations, connectionString: url });
      const api = createEarthdistance_1_2(earthdistanceDescriptor, {
        ...earthdistanceCubeDescriptor,
        schema: cubeSchema,
      });
      try {
        await work({ client, connection, api });
      } finally {
        await connection.close();
      }
    } finally {
      await client.end();
    }
  });
}
export interface EarthdistanceCase {
  readonly member: string;
  readonly expression: SQL;
  readonly native: string;
  readonly kind: "float8" | "cube";
  readonly strict: boolean;
}
export function earthdistanceCases(api = earthdistanceApi): readonly EarthdistanceCase[] {
  const lhs = sql<EarthValue>`lhs`,
    rhs = sql<EarthValue>`rhs`,
    p = sql<EarthPoint>`p`,
    q = sql<EarthPoint>`q`;
  const radius = sql<number>`radius`,
    lat = sql<number>`lat`,
    lon = sql<number>`lon`;
  return [
    {
      member: "operator:$extension:earthdistance.<@>(pg_catalog.point,pg_catalog.point)",
      expression: api.pointDistanceMiles(p, q),
      native: `p operator(${earthdistanceNamespace}.<@>) q`,
      kind: "float8",
      strict: true,
    },
    {
      member: "routine:$extension:earthdistance.earth_box($extension:earthdistance.earth,pg_catalog.float8)",
      expression: api.boxMeters(lhs, radius),
      native: `${earthdistanceNamespace}.earth_box(lhs,radius)`,
      kind: "cube",
      strict: true,
    },
    {
      member:
        "routine:$extension:earthdistance.earth_distance($extension:earthdistance.earth,$extension:earthdistance.earth)",
      expression: api.distanceMeters(lhs, rhs),
      native: `${earthdistanceNamespace}.earth_distance(lhs,rhs)`,
      kind: "float8",
      strict: true,
    },
    {
      member: "routine:$extension:earthdistance.earth()",
      expression: api.radiusMeters(),
      native: `${earthdistanceNamespace}.earth()`,
      kind: "float8",
      strict: false,
    },
    {
      member: "routine:$extension:earthdistance.gc_to_sec(pg_catalog.float8)",
      expression: api.greatCircleToSecantMeters(radius),
      native: `${earthdistanceNamespace}.gc_to_sec(radius)`,
      kind: "float8",
      strict: true,
    },
    {
      member: "routine:$extension:earthdistance.geo_distance(pg_catalog.point,pg_catalog.point)",
      expression: api.geoDistanceMiles(p, q),
      native: `${earthdistanceNamespace}.geo_distance(p,q)`,
      kind: "float8",
      strict: true,
    },
    {
      member: "routine:$extension:earthdistance.latitude($extension:earthdistance.earth)",
      expression: api.latitudeDegrees(lhs),
      native: `${earthdistanceNamespace}.latitude(lhs)`,
      kind: "float8",
      strict: true,
    },
    {
      member: "routine:$extension:earthdistance.ll_to_earth(pg_catalog.float8,pg_catalog.float8)",
      expression: api.fromDegrees(lat, lon),
      native: `${earthdistanceNamespace}.ll_to_earth(lat,lon)`,
      kind: "cube",
      strict: true,
    },
    {
      member: "routine:$extension:earthdistance.longitude($extension:earthdistance.earth)",
      expression: api.longitudeDegrees(lhs),
      native: `${earthdistanceNamespace}.longitude(lhs)`,
      kind: "float8",
      strict: true,
    },
    {
      member: "routine:$extension:earthdistance.sec_to_gc(pg_catalog.float8)",
      expression: api.secantToGreatCircleMeters(radius),
      native: `${earthdistanceNamespace}.sec_to_gc(radius)`,
      kind: "float8",
      strict: true,
    },
  ];
}
/** Independent network-order reader for inherited cube_send. Earth stores compressed points. */
export function readEarthdistanceCubeBinary(bytes: Buffer): CubeValue {
  assert(bytes.length >= 4);
  const header = bytes.readUInt32BE(0),
    rank = header & 0x7fffffff,
    point = (header & 0x80000000) !== 0;
  assert(rank <= 100);
  assert.equal(bytes.length, 4 + 8 * rank * (point ? 1 : 2));
  const coordinates = (offset: number) =>
    Array.from({ length: rank }, (_, index) => {
      const value = bytes.readDoubleBE(4 + 8 * (offset + index));
      assert(Number.isFinite(value));
      return value;
    });
  return point
    ? { kind: "point", coordinates: coordinates(0) }
    : { kind: "box", lower: coordinates(0), upper: coordinates(rank) };
}
export async function nativeEarthdistanceCube(client: pg.Client, expression: string): Promise<CubeValue | null> {
  const row = (
    await client.query<{ bytes: Buffer | null }>(`select ${earthdistanceCubeNamespace}.cube_send(${expression}) bytes`)
  ).rows[0]!;
  return row.bytes === null ? null : readEarthdistanceCubeBinary(row.bytes);
}
