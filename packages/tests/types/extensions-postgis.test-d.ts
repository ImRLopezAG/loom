import { type SQL } from "drizzle-orm";
import {
  createPostgis_3_6_4,
  geometryEwkt,
  geographyEwkt,
  type Geometry,
  type Geography,
} from "../../../apps/loom/src/core/extensions/adapters/postgis";
import type { NonfiniteNumber } from "../../../apps/loom/src/core/extensions/codecs";
const api = createPostgis_3_6_4({
  name: "postgis",
  version: "3.6.4",
  schema: "spatial",
  apiSupport: { status: "verified", digest: "640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29" },
});
const geom = geometryEwkt("SRID=3857;POINT(0 0)"),
  geog = geographyEwkt("SRID=4326;POINT(0 0)");
const result: SQL<number | NonfiniteNumber | null> = api.geometry.distance(geom, geom);
const geometry: SQL<Geometry | null> = api.sql.functions.st_makepoint["(pg_catalog.float8,pg_catalog.float8)"](1, 2);
const geography: SQL<Geography | null> =
  api.sql.overloads["cast:$extension:postgis.geometry->$extension:postgis.geography"](geom);
// @ts-expect-error Geometry accepts its exact public type, not a geography datum.
api.geometry.distance(geog, geom);
// @ts-expect-error Numeric overloads reject text.
api.sql.functions.st_makepoint["(pg_catalog.float8,pg_catalog.float8)"]("1", 2);
// @ts-expect-error Maintenance does not enter ordinary SQL or RPC contexts.
api.sql.functions.addgeometrycolumn;
// @ts-expect-error Exact selected version.
createPostgis_3_6_4({ name: "postgis", version: "3.7.0", schema: "spatial", apiSupport: { status: "verified" } });
void [result, geometry, geography];

import { postgisNullableWitnesses } from "../../e2e/fixtures/postgis-nullable-query-witnesses";
void postgisNullableWitnesses(api);
