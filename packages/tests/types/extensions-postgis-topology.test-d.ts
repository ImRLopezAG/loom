import { type SQL, sql } from "drizzle-orm";
import {
  createPostgisTopology_3_6_4,
  type Topogeometry,
  type Topoelementarray,
} from "../../../apps/loom/src/core/extensions/adapters/postgis-topology";
import type { PostgisTopologyOperatorSession } from "../../../apps/loom/src/tooling/extensions/operations/postgis-topology";
import topology from "../../../apps/loom/src/tooling/extensions/manifests/postgis_topology.json";
import postgis from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";

const api = createPostgisTopology_3_6_4(
  {
    name: "postgis_topology",
    version: "3.6.4",
    schema: "topology",
    apiSupport: { status: "verified", digest: topology.digest },
  },
  {
    name: "postgis",
    version: "3.6.4",
    schema: "extensions",
    apiSupport: { status: "verified", digest: postgis.digest },
  },
);
const datum: Topogeometry = { topology_id: 1, layer_id: 2, id: 9223372036854775807n, type: 1 };
const node: SQL<bigint | null> = api.getnodebypoint("graph", api.geometry.ewkt("SRID=4326;POINT(1 2)"), 0);
const elements: SQL<Topoelementarray | null> =
  api.gettopogeomelementarray["($extension:postgis_topology.topogeometry)"](datum);
const kind: SQL<string | null> = api.geometrytype(datum);
// @ts-expect-error IDs are exact int8 bigint, never JS number.
api.getnodeedges("graph", 1);
// @ts-expect-error A geometry must carry the PostGIS representation.
api.getnodebypoint("graph", "POINT(1 2)", 0);
// @ts-expect-error Mutations do not enter ordinary application SQL.
api.sql.functions.createtopology;
const unsupportedDescriptor = {
  name: "postgis_topology",
  version: "3.6.3",
  schema: "topology",
  apiSupport: { status: "verified" },
} as const;
// @ts-expect-error Exact extension version.
createPostgisTopology_3_6_4(unsupportedDescriptor, {
  name: "postgis",
  version: "3.6.4",
  schema: "extensions",
  apiSupport: { status: "verified" },
});

async function operator(session: PostgisTopologyOperatorSession) {
  const created: number | null = await session.createtopology("graph", 4326, undefined, undefined, undefined, true);
  const point: bigint | null = await session.topogeo_addpoint("graph", api.geometry.ewkt("SRID=4326;POINT(1 2)"));
  const geometry: Topogeometry | null = await session.createtopogeom[
    "(pg_catalog.varchar,pg_catalog.int4,pg_catalog.int4)"
  ]("graph", 1, 1);
  // @ts-expect-error Operator routines accept values, never executable SQL expressions.
  await session.createtopology(sql`'graph'`);
  // @ts-expect-error No raw client or query escape.
  session.client.query("select 1");
  // @ts-expect-error Wrong native tolerance type.
  await session.topogeo_addpoint("graph", api.geometry.ewkt("POINT(1 2)"), "0");
  void [created, point, geometry];
}
void [node, elements, kind, operator];
