import { sql, type SQL } from "drizzle-orm";
import {
  createEarthdistance_1_2,
  type EarthValue,
  type EarthPoint,
  type NonfiniteNumber,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/earthdistance";
import { cubePoint, type CubeValue } from "../../../apps/loom/src/core/extensions/adapters/cube";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
const api = createEarthdistance_1_2(
  {
    name: "earthdistance",
    version: "1.2",
    schema: 'Earth"日本',
    apiSupport: { status: "verified", digest: "13bae0f141ff6fb7a7e4253e02958e7b6dd18c82db9b51c03bf12605df99fcd6" },
  },
  {
    name: "cube",
    version: "1.5",
    schema: "Cube日本",
    apiSupport: { status: "verified", digest: "205421c1cacc198ba7088c60ec4f76b0a8e7adec18be87d17a8082dd7b0515e2" },
  },
);
const location: EarthValue = cubePoint([6378168]);
const point: EarthPoint = { longitude: -69.9, latitude: 18.4 };
const fieldSchema = defineSchema(() => ({ entries: { value: api.field(), tags: api.arrayField() } }));
const f = api.sql.functions;
const meters: SQL<number | NonfiniteNumber | null> = api.distanceMeters(fieldSchema.tables.entries.value, location);
const box: SQL<CubeValue | null> = f.earth_box(location, 1000);
const earth: SQL<EarthValue | null> = f.ll_to_earth(18.4, -69.9);
const radius: SQL<number | NonfiniteNumber | null> = f.earth();
const secant: SQL<number | NonfiniteNumber | null> = f.gc_to_sec(1000);
const arc: SQL<number | NonfiniteNumber | null> = f.sec_to_gc(1000);
const latitude: SQL<number | NonfiniteNumber | null> = f.latitude(earth.as("location"));
const longitude: SQL<number | NonfiniteNumber | null> = f.longitude(earth);
const miles: SQL<number | NonfiniteNumber | null> = f.geo_distance(point, point);
const operator: SQL<number | NonfiniteNumber | null> = api.sql.operators["<@>"](point, point);
const array: PostgreSqlArray<EarthValue> = { dimensions: [{ lowerBound: -2, length: 1 }], values: [location] };
api.arrayCodec.encode(array);
// @ts-expect-error Native point requires named longitude and latitude, not cube coordinates.
api.pointDistanceMiles(location, point);
// @ts-expect-error Point geography cannot substitute for the earth domain.
api.distanceMeters(point, location);
// @ts-expect-error Native domain text is never an EarthValue.
api.distanceMeters("(6378168)", location);
// @ts-expect-error A boolean expression cannot substitute for a domain expression.
api.distanceMeters(sql<boolean>`true`, location);
// @ts-expect-error Latitude is numeric, never a string.
api.fromDegrees("18.4", -69.9);
// @ts-expect-error Dependency descriptor is mandatory.
createEarthdistance_1_2(api);
// @ts-expect-error A caller cannot select a result type.
api.distanceMeters<string>(location, location);
// @ts-expect-error Domain receive is a backend transfer, not an ordinary public routine.
api.sql.functions.domain_recv();
createEarthdistance_1_2(
  // @ts-expect-error Wrong selected version is rejected statically.
  { ...api, version: "1.1" },
  { name: "cube", version: "1.5", schema: "extensions", apiSupport: { status: "verified" } },
);
void [meters, box, earth, radius, secant, arc, latitude, longitude, miles, operator, array];
