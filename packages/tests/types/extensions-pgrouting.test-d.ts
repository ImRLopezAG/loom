import type { SQL } from "drizzle-orm";
import type { NestedQuery } from "../../../apps/loom/src/core/extensions/nested-query";
import type { PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import {
  createPgrouting_3_8_0,
  type PgroutingCostEdges,
  type PgroutingCombinations,
} from "../../../apps/loom/src/core/extensions/adapters/pgrouting";
import type { PgroutingOperatorSession } from "../../../apps/loom/src/tooling/extensions/operations/pgrouting";

declare const api: ReturnType<
  typeof createPgrouting_3_8_0<{
    name: "pgrouting";
    version: "3.8.0";
    schema: "routing";
    apiSupport: { status: "verified"; digest: string };
  }>
>;
declare const edges: NestedQuery<PgroutingCostEdges>;
declare const combinations: NestedQuery<PgroutingCombinations>;
declare const ids: PostgreSqlArray<bigint>;
declare const wrongEdges: NestedQuery<{ id: string; source: string; target: string; cost: boolean }>;

const dijkstra =
  api.sql.overloads[
    "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"
  ];
dijkstra(edges, 1n, 3n);
dijkstra(edges, 1n, 3n, false);
// @ts-expect-error graph SQL is managed, never unrestricted text
dijkstra("select * from edges", 1n, 3n);
// @ts-expect-error managed provenance alone cannot give incompatible graph columns a routing contract
dijkstra(wrongEdges, 1n, 3n);
// @ts-expect-error int8 preserves precision through bigint
dijkstra(edges, 1, 3);
// @ts-expect-error end vertex has no default
dijkstra(edges, 1n);
api.sql.overloads[
  "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"
](edges, ids, ids);
api.sql.overloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"](
  edges,
  combinations,
);
const rows = api.sql.rows[
  "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"
]("route", edges, 1n, 3n);
const node: SQL<bigint | null> = rows.columns.node;
const cost: SQL<number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = rows.columns.cost;
void node;
void cost;
// @ts-expect-error captured OUT columns have bigint precision
const wrongNode: SQL<number> = rows.columns.node;
void wrongNode;
// @ts-expect-error administration is absent from query bindings
api.pgrCreatetopology("edges", 0.01);
// @ts-expect-error native support routines are absent from public application helpers
void api.sql.functions._pgr_dijkstra;
declare const operator: PgroutingOperatorSession;
const operation: Promise<string | null> = operator.pgrCreatetopology("app.edges", 0.01);
void operation;
const version: "3.8.0" = api.version;
const schema: "routing" = api.schema;
void version;
void schema;

const articulation: SQL<bigint | null> = api.pgrArticulationpoints(edges);
void articulation;
api.sql.overloads[
  "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"
](edges, { dimensions: [{ lowerBound: 1, length: 2 }], values: [1, 3] }, ids);
