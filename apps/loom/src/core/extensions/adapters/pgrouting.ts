import { type SQL, type DriverValueEncoder } from "drizzle-orm";
import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  booleanCodec,
  compositeCodec,
  floatCodec,
  integerCodec,
  nullableCodec,
  numericCodec,
  textCodec,
  withCodecSqlType,
} from "../codecs";
import type { ExtensionCodec, NonfiniteNumber, PostgreSqlArray } from "../codecs";
import type { Geometry } from "./postgis-codecs";
import { int4Codec } from "../native-codecs";
import { nestedQueryText, type NestedQuery } from "../nested-query";
import { extensionRows } from "../rows";
import { createSqlFunction, defaultSqlArgument, extensionExpressionContract, type ExtensionSqlInput } from "../sql";
import { createPostgisGeometryCodec } from "./postgis-codecs";
import type {
  PgroutingGraphEdges,
  PgroutingCostEdges,
  PgroutingAstarEdges,
  PgroutingCapacityEdges,
  PgroutingCapacityCostEdges,
  PgroutingCombinations,
  PgroutingPoints,
  PgroutingRestrictions,
  PgroutingLegacyRestrictions,
  PgroutingGeometryEdges,
  PgroutingVertexEdges,
  PgroutingDegreeVertices,
  PgroutingCoordinates,
  PgroutingMatrix,
  PgroutingOrders,
  PgroutingEuclideanOrders,
  PgroutingVehicles,
  PgroutingEuclideanVehicles,
  PgroutingVrpOrders,
  PgroutingVrpVehicles,
  PgroutingVrpMatrix,
} from "./pgrouting-inputs";
export type * from "./pgrouting-inputs";
const digest = "853d0e847c740dc95f877297db1c3515a4ebac8f454a85b266ba20be7324ae4c";
const postgisDigest = "640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29";
type Descriptor = ExtensionDescriptor<"pgrouting", { readonly version: "3.8.0"; readonly schema: string }>;
type PostgisDescriptor = ExtensionDescriptor<"postgis", { readonly version: "3.6.4"; readonly schema: string }>;
function managed<Row extends object>(value: NestedQuery<Row> | null): SQL<string> | null;
function managed<Row extends object>(value: NestedQuery<Row> | null | undefined): SQL<string> | null | undefined;
function managed<Row extends object>(value: NestedQuery<Row> | null | undefined): SQL<string> | null | undefined {
  return value === null || value === undefined ? value : nestedQueryText(value);
}
function createPgroutingCodecs(schema: string) {
  const text = nullableCodec(textCodec),
    int4 = nullableCodec(int4Codec),
    int8 = nullableCodec(integerCodec),
    bool = nullableCodec(booleanCodec),
    float8 = nullableCodec(floatCodec),
    numeric = nullableCodec(numericCodec);
  const bpchar = nullableCodec(withCodecSqlType(textCodec, { schema: "pg_catalog", name: "bpchar" }));
  const geometry = nullableCodec(createPostgisGeometryCodec(schema));
  const geometryArray = nullableCodec(arrayCodec(createPostgisGeometryCodec(schema)));
  const int4Array = nullableCodec(arrayCodec(int4Codec)),
    int8Array = nullableCodec(arrayCodec(integerCodec)),
    float8Array = nullableCodec(arrayCodec(floatCodec)),
    textArray = nullableCodec(arrayCodec(textCodec));
  const idsElement: ExtensionCodec<number | bigint, bigint> = {
    ...integerCodec,
    encode(value) {
      if (v.is(v.number(), value)) {
        if (!Number.isSafeInteger(value)) throw new Error("Routing vertex IDs require exact integers");
        return integerCodec.encode(BigInt(value));
      }
      return integerCodec.encode(value);
    },
  };
  const idsArray = nullableCodec(arrayCodec(idsElement));
  return {
    text,
    int4,
    int8,
    bool,
    float8,
    numeric,
    bpchar,
    geometry,
    geometryArray,
    int4Array,
    int8Array,
    idsArray,
    float8Array,
    textArray,
  };
}
export type PgroutingCodecs = ReturnType<typeof createPgroutingCodecs>;
export interface PgroutingResult0 {
  readonly node: bigint | null;
}
export interface PgroutingResult1 {
  readonly seq: number | null;
  readonly path_seq: number | null;
  readonly start_vid: bigint | null;
  readonly end_vid: bigint | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult2 {
  readonly start_vid: bigint | null;
  readonly end_vid: bigint | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult3 {
  readonly seq: number | null;
  readonly path_seq: number | null;
  readonly start_vid: bigint | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult4 {
  readonly seq: number | null;
  readonly path_seq: number | null;
  readonly end_vid: bigint | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult5 {
  readonly seq: number | null;
  readonly path_seq: number | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult6 {
  readonly vid: bigint | null;
  readonly centrality: number | NonfiniteNumber | null;
}
export interface PgroutingResult7 {
  readonly seq: bigint | null;
  readonly component: bigint | null;
  readonly edge: bigint | null;
}
export interface PgroutingResult8 {
  readonly vertex_id: bigint | null;
  readonly color_id: bigint | null;
}
export interface PgroutingResult9 {
  readonly seq: number | null;
  readonly edge: bigint | null;
  readonly start_vid: bigint | null;
  readonly end_vid: bigint | null;
  readonly flow: bigint | null;
  readonly residual_capacity: bigint | null;
}
export interface PgroutingResult10 {
  readonly seq: bigint | null;
  readonly depth: bigint | null;
  readonly start_vid: bigint | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult11 {
  readonly edge: bigint | null;
}
export interface PgroutingResult12 {
  readonly seq: number | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult13 {
  readonly seq: bigint | null;
  readonly component: bigint | null;
  readonly node: bigint | null;
}
export interface PgroutingResult14 {
  readonly type: string | null;
  readonly id: bigint | null;
  readonly contracted_vertices: PostgreSqlArray<bigint> | null;
  readonly source: bigint | null;
  readonly target: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult15 {
  readonly type: string | null;
  readonly id: bigint | null;
  readonly contracted_vertices: PostgreSqlArray<bigint> | null;
  readonly source: bigint | null;
  readonly target: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly metric: bigint | null;
  readonly vertex_order: bigint | null;
}
export interface PgroutingResult16 {
  readonly seq: bigint | null;
  readonly node: bigint | null;
}
export interface PgroutingResult17 {
  readonly node: bigint | null;
  readonly degree: bigint | null;
}
export interface PgroutingResult18 {
  readonly seq: number | null;
  readonly path_id: number | null;
  readonly path_seq: number | null;
  readonly start_vid: bigint | null;
  readonly end_vid: bigint | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
  readonly route_agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult19 {
  readonly seq: bigint | null;
  readonly depth: bigint | null;
  readonly start_vid: bigint | null;
  readonly pred: bigint | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult20 {
  readonly edge_id: bigint | null;
  readonly color_id: bigint | null;
}
export interface PgroutingResult21 {
  readonly seq: number | null;
  readonly path_id: number | null;
  readonly path_seq: number | null;
  readonly start_vid: bigint | null;
  readonly end_vid: bigint | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult22 {
  readonly seq: number | null;
  readonly path_id: number | null;
  readonly path_seq: number | null;
  readonly start_vid: bigint | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult23 {
  readonly seq: number | null;
  readonly path_id: number | null;
  readonly path_seq: number | null;
  readonly end_vid: bigint | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult24 {
  readonly seq: number | null;
  readonly path_id: number | null;
  readonly path_seq: number | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult25 {
  readonly id: bigint | null;
  readonly in_edges: PostgreSqlArray<bigint> | null;
  readonly out_edges: PostgreSqlArray<bigint> | null;
  readonly x: number | NonfiniteNumber | null;
  readonly y: number | NonfiniteNumber | null;
  readonly geom: Geometry | null;
}
export interface PgroutingResult26 {
  readonly edge_id: bigint | null;
  readonly fraction: number | NonfiniteNumber | null;
  readonly side: string | null;
  readonly distance: number | NonfiniteNumber | null;
  readonly geom: Geometry | null;
  readonly edge: Geometry | null;
}
export interface PgroutingResult27 {
  readonly version: string | null;
  readonly build_type: string | null;
  readonly compile_date: string | null;
  readonly library: string | null;
  readonly system: string | null;
  readonly postgresql: string | null;
  readonly compiler: string | null;
  readonly boost: string | null;
  readonly hash: string | null;
}
export interface PgroutingResult28 {
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult29 {
  readonly seq: number | null;
  readonly vertex_id: bigint | null;
  readonly idom: bigint | null;
}
export interface PgroutingResult30 {
  readonly seq: number | null;
  readonly source: bigint | null;
  readonly target: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly reverse_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult31 {
  readonly seq: number | null;
  readonly source: bigint | null;
  readonly target: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly edge: bigint | null;
}
export interface PgroutingResult32 {
  readonly seq: bigint | null;
  readonly start_vid: bigint | null;
  readonly end_vid: bigint | null;
}
export interface PgroutingResult33 {
  readonly seq: number | null;
  readonly edge: bigint | null;
  readonly source: bigint | null;
  readonly target: bigint | null;
}
export interface PgroutingResult34 {
  readonly seq: number | null;
  readonly edge: bigint | null;
  readonly source: bigint | null;
  readonly target: bigint | null;
  readonly flow: bigint | null;
  readonly residual_capacity: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult35 {
  readonly seq: number | null;
  readonly vehicle_seq: number | null;
  readonly vehicle_id: bigint | null;
  readonly stop_seq: number | null;
  readonly stop_type: number | null;
  readonly stop_id: bigint | null;
  readonly order_id: bigint | null;
  readonly cargo: number | NonfiniteNumber | null;
  readonly travel_time: number | NonfiniteNumber | null;
  readonly arrival_time: number | NonfiniteNumber | null;
  readonly wait_time: number | NonfiniteNumber | null;
  readonly service_time: number | NonfiniteNumber | null;
  readonly departure_time: number | NonfiniteNumber | null;
}
export interface PgroutingResult36 {
  readonly seq: number | null;
  readonly vehicle_seq: number | null;
  readonly vehicle_id: bigint | null;
  readonly stop_seq: number | null;
  readonly stop_type: number | null;
  readonly order_id: bigint | null;
  readonly cargo: number | NonfiniteNumber | null;
  readonly travel_time: number | NonfiniteNumber | null;
  readonly arrival_time: number | NonfiniteNumber | null;
  readonly wait_time: number | NonfiniteNumber | null;
  readonly service_time: number | NonfiniteNumber | null;
  readonly departure_time: number | NonfiniteNumber | null;
}
export interface PgroutingResult37 {
  readonly seq: number | null;
  readonly id: bigint | null;
  readonly sub_id: number | null;
  readonly geom: Geometry | null;
}
export interface PgroutingResult38 {
  readonly seq: number | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly mincut: number | NonfiniteNumber | null;
}
export interface PgroutingResult39 {
  readonly seq: number | null;
  readonly sorted_v: bigint | null;
}
export interface PgroutingResult40 {
  readonly seq: number | null;
  readonly vid: bigint | null;
  readonly target_array: PostgreSqlArray<bigint> | null;
}
export interface PgroutingResult41 {
  readonly seq: number | null;
  readonly id1: number | null;
  readonly id2: number | null;
  readonly cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult42 {
  readonly seq: number | null;
  readonly id1: number | null;
  readonly id2: number | null;
  readonly id3: number | null;
  readonly cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult43 {
  readonly seq: number | null;
  readonly node: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult44 {
  readonly oid: number | null;
  readonly opos: number | null;
  readonly vid: number | null;
  readonly tarrival: number | null;
  readonly tdepart: number | null;
}
export interface PgroutingResult45 {
  readonly seq: number | null;
  readonly path_seq: number | null;
  readonly start_pid: bigint | null;
  readonly end_pid: bigint | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult46 {
  readonly seq: number | null;
  readonly path_seq: number | null;
  readonly start_pid: bigint | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult47 {
  readonly seq: number | null;
  readonly path_seq: number | null;
  readonly end_pid: bigint | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult48 {
  readonly start_pid: bigint | null;
  readonly end_pid: bigint | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingResult49 {
  readonly seq: number | null;
  readonly start_vid: bigint | null;
  readonly node: bigint | null;
  readonly edge: bigint | null;
  readonly cost: number | NonfiniteNumber | null;
  readonly agg_cost: number | NonfiniteNumber | null;
}
export interface PgroutingOverloads {
  readonly "routine:$extension:pgrouting.pgr_alphashape($extension:postgis.geometry,pg_catalog.float8)": (
    arg0: ExtensionSqlInput<PgroutingCodecs["geometry"]>,
    arg1?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<Geometry | null> & DriverValueEncoder<Geometry | null, unknown>;
  readonly "routine:$extension:pgrouting.pgr_articulationpoints(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
  ) => SQL<bigint | null>;
  readonly "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_astarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_bdastarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult3 | null>;
  readonly "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult4 | null>;
  readonly "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult5 | null>;
  readonly "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_bddijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult3 | null>;
  readonly "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult4 | null>;
  readonly "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult5 | null>;
  readonly "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_betweennesscentrality(pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult6 | null>;
  readonly "routine:$extension:pgrouting.pgr_biconnectedcomponents(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
  ) => SQL<PgroutingResult7 | null>;
  readonly "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult3 | null>;
  readonly "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult4 | null>;
  readonly "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult5 | null>;
  readonly "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_bipartite(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
  ) => SQL<PgroutingResult8 | null>;
  readonly "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult10 | null>;
  readonly "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult10 | null>;
  readonly "routine:$extension:pgrouting.pgr_bridges(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
  ) => SQL<bigint | null>;
  readonly "routine:$extension:pgrouting.pgr_chinesepostman(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
  ) => SQL<PgroutingResult12 | null>;
  readonly "routine:$extension:pgrouting.pgr_chinesepostmancost(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
  ) => SQL<number | NonfiniteNumber | null>;
  readonly "routine:$extension:pgrouting.pgr_connectedcomponents(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
  ) => SQL<PgroutingResult13 | null>;
  readonly "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog._int8,pg_catalog.int4,pg_catalog._int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8Array"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int8Array"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult14 | null>;
  readonly "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog.bool,pg_catalog._int4,pg_catalog.int4,pg_catalog._int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int4Array"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int8Array"]>,
  ) => SQL<PgroutingResult14 | null>;
  readonly "routine:$extension:pgrouting.pgr_contractiondeadend(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8Array"]>,
  ) => SQL<PgroutingResult14 | null>;
  readonly "routine:$extension:pgrouting.pgr_contractionhierarchies(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8Array"]>,
  ) => SQL<PgroutingResult15 | null>;
  readonly "routine:$extension:pgrouting.pgr_contractionlinear(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8Array"]>,
  ) => SQL<PgroutingResult14 | null>;
  readonly "routine:$extension:pgrouting.pgr_cuthillmckeeordering(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
  ) => SQL<PgroutingResult16 | null>;
  readonly "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
  ) => SQL<PgroutingResult5 | null>;
  readonly "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult5 | null>;
  readonly "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
  ) => SQL<PgroutingResult5 | null>;
  readonly "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult5 | null>;
  readonly "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
  ) => SQL<PgroutingResult5 | null>;
  readonly "routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
    arg1?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult17 | null>;
  readonly "routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
    arg1: NestedQuery<PgroutingDegreeVertices> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult17 | null>;
  readonly "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult10 | null>;
  readonly "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult10 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_dijkstravia(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult18 | null>;
  readonly "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_edgecoloring(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
  ) => SQL<PgroutingResult20 | null>;
  readonly "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult21 | null>;
  readonly "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult22 | null>;
  readonly "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult23 | null>;
  readonly "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult24 | null>;
  readonly "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult21 | null>;
  readonly "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult3 | null>;
  readonly "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult4 | null>;
  readonly "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult5 | null>;
  readonly "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_extractvertices(pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingVertexEdges> | null,
    arg1?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult25 | null>;
  readonly "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingGeometryEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["geometryArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult26 | null>;
  readonly "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingGeometryEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["geometryArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult26 | null>;
  readonly "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingGeometryEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["geometry"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult26 | null>;
  readonly "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingGeometryEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["geometry"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult26 | null>;
  readonly "routine:$extension:pgrouting.pgr_floydwarshall(pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_full_version()": () => SQL<PgroutingResult27 | null>;
  readonly "routine:$extension:pgrouting.pgr_hawickcircuits(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
  ) => SQL<PgroutingResult21 | null>;
  readonly "routine:$extension:pgrouting.pgr_isplanar(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
  ) => SQL<boolean | null>;
  readonly "routine:$extension:pgrouting.pgr_johnson(pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_kruskal(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
  ) => SQL<PgroutingResult28 | null>;
  readonly "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult21 | null>;
  readonly "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult21 | null>;
  readonly "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult21 | null>;
  readonly "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult21 | null>;
  readonly "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult21 | null>;
  readonly "routine:$extension:pgrouting.pgr_lengauertarjandominatortree(pg_catalog.text,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult29 | null>;
  readonly "routine:$extension:pgrouting.pgr_linegraph(pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult30 | null>;
  readonly "routine:$extension:pgrouting.pgr_linegraphfull(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
  ) => SQL<PgroutingResult31 | null>;
  readonly "routine:$extension:pgrouting.pgr_makeconnected(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
  ) => SQL<PgroutingResult32 | null>;
  readonly "routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult33 | null>;
  readonly "routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
  ) => SQL<bigint | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
  ) => SQL<bigint | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<bigint | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
  ) => SQL<bigint | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<bigint | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
  ) => SQL<bigint | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": (
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
  ) => SQL<number | NonfiniteNumber | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<number | NonfiniteNumber | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": (
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
  ) => SQL<number | NonfiniteNumber | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<number | NonfiniteNumber | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
  ) => SQL<number | NonfiniteNumber | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": (
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
  ) => SQL<PgroutingResult34 | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult34 | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": (
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
  ) => SQL<PgroutingResult34 | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult34 | null>;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
  ) => SQL<PgroutingResult34 | null>;
  readonly "routine:$extension:pgrouting.pgr_pickdeliver(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)": (
    arg0: NestedQuery<PgroutingOrders> | null,
    arg1: NestedQuery<PgroutingVehicles> | null,
    arg2: NestedQuery<PgroutingMatrix> | null,
    arg3?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
  ) => SQL<PgroutingResult35 | null>;
  readonly "routine:$extension:pgrouting.pgr_pickdelivereuclidean(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)": (
    arg0: NestedQuery<PgroutingEuclideanOrders> | null,
    arg1: NestedQuery<PgroutingEuclideanVehicles> | null,
    arg2?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
  ) => SQL<PgroutingResult36 | null>;
  readonly "routine:$extension:pgrouting.pgr_prim(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
  ) => SQL<PgroutingResult28 | null>;
  readonly "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["float8"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["numeric"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
  ) => SQL<PgroutingResult9 | null>;
  readonly "routine:$extension:pgrouting.pgr_separatecrossing(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingGeometryEdges> | null,
    arg1?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult37 | null>;
  readonly "routine:$extension:pgrouting.pgr_separatetouching(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingGeometryEdges> | null,
    arg1?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult37 | null>;
  readonly "routine:$extension:pgrouting.pgr_sequentialvertexcoloring(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
  ) => SQL<PgroutingResult8 | null>;
  readonly "routine:$extension:pgrouting.pgr_stoerwagner(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
  ) => SQL<PgroutingResult38 | null>;
  readonly "routine:$extension:pgrouting.pgr_strongcomponents(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
  ) => SQL<PgroutingResult13 | null>;
  readonly "routine:$extension:pgrouting.pgr_topologicalsort(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
  ) => SQL<PgroutingResult39 | null>;
  readonly "routine:$extension:pgrouting.pgr_transitiveclosure(pg_catalog.text)": (
    arg0: NestedQuery<PgroutingGraphEdges> | null,
  ) => SQL<PgroutingResult40 | null>;
  readonly "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: NestedQuery<PgroutingPoints> | null,
    arg3: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: NestedQuery<PgroutingPoints> | null,
    arg3: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: NestedQuery<PgroutingPoints> | null,
    arg3: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: NestedQuery<PgroutingPoints> | null,
    arg3: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: NestedQuery<PgroutingPoints> | null,
    arg3: NestedQuery<PgroutingCombinations> | null,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg5: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg6: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg7?: NestedQuery<PgroutingLegacyRestrictions> | null,
  ) => SQL<PgroutingResult41 | null>;
  readonly "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: NestedQuery<PgroutingLegacyRestrictions> | null,
  ) => SQL<PgroutingResult41 | null>;
  readonly "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: NestedQuery<PgroutingCombinations> | null,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult1 | null>;
  readonly "routine:$extension:pgrouting.pgr_trspvia_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: NestedQuery<PgroutingPoints> | null,
    arg3: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg8?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult18 | null>;
  readonly "routine:$extension:pgrouting.pgr_trspvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult18 | null>;
  readonly "routine:$extension:pgrouting.pgr_trspviaedges(pg_catalog.text,pg_catalog._int4,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["int4Array"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["float8Array"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: NestedQuery<PgroutingLegacyRestrictions> | null,
  ) => SQL<PgroutingResult42 | null>;
  readonly "routine:$extension:pgrouting.pgr_trspviavertices(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg2: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: NestedQuery<PgroutingLegacyRestrictions> | null,
  ) => SQL<PgroutingResult42 | null>;
  readonly "routine:$extension:pgrouting.pgr_tsp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingMatrix> | null,
    arg1?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg8?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg9?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg10?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult43 | null>;
  readonly "routine:$extension:pgrouting.pgr_tspeuclidean(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCoordinates> | null,
    arg1?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg2?: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg8?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg9?: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg10?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult43 | null>;
  readonly "routine:$extension:pgrouting.pgr_turnrestrictedpath(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg8?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult24 | null>;
  readonly "routine:$extension:pgrouting.pgr_version()": () => SQL<string | null>;
  readonly "routine:$extension:pgrouting.pgr_vrponedepot(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)": (
    arg0: NestedQuery<PgroutingVrpOrders> | null,
    arg1: NestedQuery<PgroutingVrpVehicles> | null,
    arg2: NestedQuery<PgroutingVrpMatrix> | null,
    arg3: ExtensionSqlInput<PgroutingCodecs["int4"]>,
  ) => SQL<PgroutingResult44 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult45 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult46 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult47 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult5 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: NestedQuery<PgroutingCombinations> | null,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult45 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
  ) => SQL<PgroutingResult48 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
  ) => SQL<PgroutingResult48 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
  ) => SQL<PgroutingResult48 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
  ) => SQL<PgroutingResult48 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: NestedQuery<PgroutingCombinations> | null,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
  ) => SQL<PgroutingResult48 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointscostmatrix(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
  ) => SQL<PgroutingResult2 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult49 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult12 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["float8"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult19 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg8?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult21 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg8?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult21 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg8?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult21 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg8?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult24 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg3: ExtensionSqlInput<PgroutingCodecs["int8"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg5: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg8?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult21 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: NestedQuery<PgroutingCombinations> | null,
    arg3: ExtensionSqlInput<PgroutingCodecs["int4"]>,
    arg4: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult21 | null>;
  readonly "routine:$extension:pgrouting.pgr_withpointsvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<PgroutingCodecs["idsArray"]>,
    arg3?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg4?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg5?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
    arg6?: ExtensionSqlInput<PgroutingCodecs["bpchar"]>,
    arg7?: ExtensionSqlInput<PgroutingCodecs["bool"]>,
  ) => SQL<PgroutingResult18 | null>;
}
export interface PgroutingFunctions {
  // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- Preserve the exact captured pgRouting alpha-shape routine name in the public native API.
  readonly pgr_alphashape: PgroutingOverloads["routine:$extension:pgrouting.pgr_alphashape($extension:postgis.geometry,pg_catalog.float8)"];
  readonly pgr_articulationpoints: PgroutingOverloads["routine:$extension:pgrouting.pgr_articulationpoints(pg_catalog.text)"];
  readonly pgr_astar: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
  };
  readonly pgr_astarcost: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
  };
  readonly pgr_astarcostmatrix: PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"];
  readonly pgr_bdastar: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"];
  };
  readonly pgr_bdastarcost: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"];
  };
  readonly pgr_bdastarcostmatrix: PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"];
  readonly pgr_bddijkstra: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"];
  };
  readonly pgr_bddijkstracost: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"];
  };
  readonly pgr_bddijkstracostmatrix: PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)"];
  readonly pgr_bellmanford: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"];
  };
  readonly pgr_betweennesscentrality: PgroutingOverloads["routine:$extension:pgrouting.pgr_betweennesscentrality(pg_catalog.text,pg_catalog.bool)"];
  readonly pgr_biconnectedcomponents: PgroutingOverloads["routine:$extension:pgrouting.pgr_biconnectedcomponents(pg_catalog.text)"];
  readonly pgr_binarybreadthfirstsearch: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"];
  };
  readonly pgr_bipartite: PgroutingOverloads["routine:$extension:pgrouting.pgr_bipartite(pg_catalog.text)"];
  readonly pgr_boykovkolmogorov: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.text)": PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.text)"];
  };
  readonly pgr_breadthfirstsearch: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"];
  };
  readonly pgr_bridges: PgroutingOverloads["routine:$extension:pgrouting.pgr_bridges(pg_catalog.text)"];
  readonly pgr_chinesepostman: PgroutingOverloads["routine:$extension:pgrouting.pgr_chinesepostman(pg_catalog.text)"];
  readonly pgr_chinesepostmancost: PgroutingOverloads["routine:$extension:pgrouting.pgr_chinesepostmancost(pg_catalog.text)"];
  readonly pgr_connectedcomponents: PgroutingOverloads["routine:$extension:pgrouting.pgr_connectedcomponents(pg_catalog.text)"];
  readonly pgr_contraction: {
    readonly "(pg_catalog.text,pg_catalog._int8,pg_catalog.int4,pg_catalog._int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog._int8,pg_catalog.int4,pg_catalog._int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.bool,pg_catalog._int4,pg_catalog.int4,pg_catalog._int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog.bool,pg_catalog._int4,pg_catalog.int4,pg_catalog._int8)"];
  };
  readonly pgr_contractiondeadend: PgroutingOverloads["routine:$extension:pgrouting.pgr_contractiondeadend(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)"];
  readonly pgr_contractionhierarchies: PgroutingOverloads["routine:$extension:pgrouting.pgr_contractionhierarchies(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)"];
  readonly pgr_contractionlinear: PgroutingOverloads["routine:$extension:pgrouting.pgr_contractionlinear(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)"];
  readonly pgr_cuthillmckeeordering: PgroutingOverloads["routine:$extension:pgrouting.pgr_cuthillmckeeordering(pg_catalog.text)"];
  readonly pgr_dagshortestpath: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.text)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.text)"];
  };
  readonly pgr_degree: {
    readonly "(pg_catalog.text,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"];
  };
  readonly pgr_depthfirstsearch: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)"];
  };
  readonly pgr_dijkstra: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"];
  };
  readonly pgr_dijkstracost: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"];
  };
  readonly pgr_dijkstracostmatrix: PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)"];
  readonly pgr_dijkstranear: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)"];
  };
  readonly pgr_dijkstranearcost: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)"];
  };
  readonly pgr_dijkstravia: PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstravia(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"];
  readonly pgr_drivingdistance: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool)"];
  };
  readonly pgr_edgecoloring: PgroutingOverloads["routine:$extension:pgrouting.pgr_edgecoloring(pg_catalog.text)"];
  readonly pgr_edgedisjointpaths: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"];
  };
  readonly pgr_edmondskarp: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.text)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.text)"];
  };
  readonly pgr_edwardmoore: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"];
  };
  readonly pgr_extractvertices: PgroutingOverloads["routine:$extension:pgrouting.pgr_extractvertices(pg_catalog.text,pg_catalog.bool)"];
  readonly pgr_findcloseedges: {
    readonly "(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"];
    readonly "(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)"];
    readonly "(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"];
    readonly "(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)"];
  };
  readonly pgr_floydwarshall: PgroutingOverloads["routine:$extension:pgrouting.pgr_floydwarshall(pg_catalog.text,pg_catalog.bool)"];
  readonly pgr_full_version: PgroutingOverloads["routine:$extension:pgrouting.pgr_full_version()"];
  readonly pgr_hawickcircuits: PgroutingOverloads["routine:$extension:pgrouting.pgr_hawickcircuits(pg_catalog.text)"];
  readonly pgr_isplanar: PgroutingOverloads["routine:$extension:pgrouting.pgr_isplanar(pg_catalog.text)"];
  readonly pgr_johnson: PgroutingOverloads["routine:$extension:pgrouting.pgr_johnson(pg_catalog.text,pg_catalog.bool)"];
  readonly pgr_kruskal: PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskal(pg_catalog.text)"];
  readonly pgr_kruskalbfs: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"];
  };
  readonly pgr_kruskaldd: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)": PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)": PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)"];
  };
  readonly pgr_kruskaldfs: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"];
  };
  readonly pgr_ksp: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"];
  };
  readonly pgr_lengauertarjandominatortree: PgroutingOverloads["routine:$extension:pgrouting.pgr_lengauertarjandominatortree(pg_catalog.text,pg_catalog.int8)"];
  readonly pgr_linegraph: PgroutingOverloads["routine:$extension:pgrouting.pgr_linegraph(pg_catalog.text,pg_catalog.bool)"];
  readonly pgr_linegraphfull: PgroutingOverloads["routine:$extension:pgrouting.pgr_linegraphfull(pg_catalog.text)"];
  readonly pgr_makeconnected: PgroutingOverloads["routine:$extension:pgrouting.pgr_makeconnected(pg_catalog.text)"];
  readonly pgr_maxcardinalitymatch: {
    readonly "(pg_catalog.text,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text,pg_catalog.bool)"];
    readonly "(pg_catalog.text)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text)"];
  };
  readonly pgr_maxflow: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.text)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.text)"];
  };
  readonly pgr_maxflowmincost_cost: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.text)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.text)"];
  };
  readonly pgr_maxflowmincost: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.text)": PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.text)"];
  };
  readonly pgr_pickdeliver: PgroutingOverloads["routine:$extension:pgrouting.pgr_pickdeliver(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)"];
  readonly pgr_pickdelivereuclidean: PgroutingOverloads["routine:$extension:pgrouting.pgr_pickdelivereuclidean(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)"];
  readonly pgr_prim: PgroutingOverloads["routine:$extension:pgrouting.pgr_prim(pg_catalog.text)"];
  readonly pgr_primbfs: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"];
  };
  readonly pgr_primdd: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)": PgroutingOverloads["routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)": PgroutingOverloads["routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)"];
  };
  readonly pgr_primdfs: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"];
  };
  readonly pgr_pushrelabel: {
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"];
    readonly "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"];
    readonly "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"];
    readonly "(pg_catalog.text,pg_catalog.text)": PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.text)"];
  };
  readonly pgr_separatecrossing: PgroutingOverloads["routine:$extension:pgrouting.pgr_separatecrossing(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)"];
  readonly pgr_separatetouching: PgroutingOverloads["routine:$extension:pgrouting.pgr_separatetouching(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)"];
  readonly pgr_sequentialvertexcoloring: PgroutingOverloads["routine:$extension:pgrouting.pgr_sequentialvertexcoloring(pg_catalog.text)"];
  readonly pgr_stoerwagner: PgroutingOverloads["routine:$extension:pgrouting.pgr_stoerwagner(pg_catalog.text)"];
  readonly pgr_strongcomponents: PgroutingOverloads["routine:$extension:pgrouting.pgr_strongcomponents(pg_catalog.text)"];
  readonly pgr_topologicalsort: PgroutingOverloads["routine:$extension:pgrouting.pgr_topologicalsort(pg_catalog.text)"];
  readonly pgr_transitiveclosure: PgroutingOverloads["routine:$extension:pgrouting.pgr_transitiveclosure(pg_catalog.text)"];
  readonly pgr_trsp_withpoints: {
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"];
  };
  readonly pgr_trsp: {
    readonly "(pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)": PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)"];
    readonly "(pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)": PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)"];
  };
  readonly pgr_trspvia_withpoints: PgroutingOverloads["routine:$extension:pgrouting.pgr_trspvia_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"];
  readonly pgr_trspvia: PgroutingOverloads["routine:$extension:pgrouting.pgr_trspvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"];
  readonly pgr_trspviaedges: PgroutingOverloads["routine:$extension:pgrouting.pgr_trspviaedges(pg_catalog.text,pg_catalog._int4,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)"];
  readonly pgr_trspviavertices: PgroutingOverloads["routine:$extension:pgrouting.pgr_trspviavertices(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)"];
  readonly pgr_tsp: PgroutingOverloads["routine:$extension:pgrouting.pgr_tsp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"];
  readonly pgr_tspeuclidean: PgroutingOverloads["routine:$extension:pgrouting.pgr_tspeuclidean(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"];
  readonly pgr_turnrestrictedpath: PgroutingOverloads["routine:$extension:pgrouting.pgr_turnrestrictedpath(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"];
  readonly pgr_version: PgroutingOverloads["routine:$extension:pgrouting.pgr_version()"];
  readonly pgr_vrponedepot: PgroutingOverloads["routine:$extension:pgrouting.pgr_vrponedepot(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)"];
  readonly pgr_withpoints: {
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"];
  };
  readonly pgr_withpointscost: {
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar)"];
  };
  readonly pgr_withpointscostmatrix: PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscostmatrix(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)"];
  readonly pgr_withpointsdd: {
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)"];
  };
  readonly pgr_withpointsksp: {
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"];
    readonly "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"];
  };
  readonly pgr_withpointsvia: PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"];
}
type PgroutingRowsFor<Output> = {
  readonly from: SQL;
  readonly columns: { readonly [Key in keyof NonNullable<Output>]: SQL<NonNullable<Output>[Key]> };
};
export interface PgroutingRows {
  readonly "routine:$extension:pgrouting.pgr_articulationpoints(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_articulationpoints(pg_catalog.text)"]>
  ) => PgroutingRowsFor<{ readonly node: bigint | null }>;
  readonly "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_astarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_astarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bdastarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bdastarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bddijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bddijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_betweennesscentrality(pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_betweennesscentrality(pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_betweennesscentrality(pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_biconnectedcomponents(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_biconnectedcomponents(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_biconnectedcomponents(pg_catalog.text)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bipartite(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_bipartite(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<PgroutingOverloads["routine:$extension:pgrouting.pgr_bipartite(pg_catalog.text)"]> extends SQL<
      infer Output
    >
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.text)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.text)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.text)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_bridges(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_bridges(pg_catalog.text)"]>
  ) => PgroutingRowsFor<{ readonly edge: bigint | null }>;
  readonly "routine:$extension:pgrouting.pgr_chinesepostman(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_chinesepostman(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<PgroutingOverloads["routine:$extension:pgrouting.pgr_chinesepostman(pg_catalog.text)"]> extends SQL<
      infer Output
    >
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_connectedcomponents(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_connectedcomponents(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<PgroutingOverloads["routine:$extension:pgrouting.pgr_connectedcomponents(pg_catalog.text)"]> extends SQL<
      infer Output
    >
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog._int8,pg_catalog.int4,pg_catalog._int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog._int8,pg_catalog.int4,pg_catalog._int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog._int8,pg_catalog.int4,pg_catalog._int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog.bool,pg_catalog._int4,pg_catalog.int4,pg_catalog._int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog.bool,pg_catalog._int4,pg_catalog.int4,pg_catalog._int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog.bool,pg_catalog._int4,pg_catalog.int4,pg_catalog._int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_contractiondeadend(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_contractiondeadend(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_contractiondeadend(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_contractionhierarchies(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_contractionhierarchies(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_contractionhierarchies(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_contractionlinear(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_contractionlinear(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_contractionlinear(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_cuthillmckeeordering(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_cuthillmckeeordering(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_cuthillmckeeordering(pg_catalog.text)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.text)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.text)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.text)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_dijkstravia(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstravia(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_dijkstravia(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edgecoloring(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_edgecoloring(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<PgroutingOverloads["routine:$extension:pgrouting.pgr_edgecoloring(pg_catalog.text)"]> extends SQL<
      infer Output
    >
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.text)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.text)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.text)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_extractvertices(pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_extractvertices(pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_extractvertices(pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_floydwarshall(pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_floydwarshall(pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_floydwarshall(pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_hawickcircuits(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_hawickcircuits(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<PgroutingOverloads["routine:$extension:pgrouting.pgr_hawickcircuits(pg_catalog.text)"]> extends SQL<
      infer Output
    >
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_johnson(pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_johnson(pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_johnson(pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_kruskal(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskal(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskal(pg_catalog.text)"]> extends SQL<
      infer Output
    >
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_lengauertarjandominatortree(pg_catalog.text,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_lengauertarjandominatortree(pg_catalog.text,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_lengauertarjandominatortree(pg_catalog.text,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_linegraph(pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_linegraph(pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_linegraph(pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_linegraphfull(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_linegraphfull(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<PgroutingOverloads["routine:$extension:pgrouting.pgr_linegraphfull(pg_catalog.text)"]> extends SQL<
      infer Output
    >
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_makeconnected(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_makeconnected(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<PgroutingOverloads["routine:$extension:pgrouting.pgr_makeconnected(pg_catalog.text)"]> extends SQL<
      infer Output
    >
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text)"]>
  ) => PgroutingRowsFor<{ readonly edge: bigint | null }>;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.text)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.text)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.text)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_pickdeliver(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_pickdeliver(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_pickdeliver(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_pickdelivereuclidean(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_pickdelivereuclidean(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_pickdelivereuclidean(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_prim(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_prim(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<PgroutingOverloads["routine:$extension:pgrouting.pgr_prim(pg_catalog.text)"]> extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.text)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.text)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.text)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_separatecrossing(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_separatecrossing(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_separatecrossing(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_separatetouching(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_separatetouching(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_separatetouching(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_sequentialvertexcoloring(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_sequentialvertexcoloring(pg_catalog.text)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_sequentialvertexcoloring(pg_catalog.text)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_stoerwagner(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_stoerwagner(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<PgroutingOverloads["routine:$extension:pgrouting.pgr_stoerwagner(pg_catalog.text)"]> extends SQL<
      infer Output
    >
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_strongcomponents(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_strongcomponents(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<PgroutingOverloads["routine:$extension:pgrouting.pgr_strongcomponents(pg_catalog.text)"]> extends SQL<
      infer Output
    >
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_topologicalsort(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_topologicalsort(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<PgroutingOverloads["routine:$extension:pgrouting.pgr_topologicalsort(pg_catalog.text)"]> extends SQL<
      infer Output
    >
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_transitiveclosure(pg_catalog.text)": (
    alias: string,
    ...values: Parameters<PgroutingOverloads["routine:$extension:pgrouting.pgr_transitiveclosure(pg_catalog.text)"]>
  ) => PgroutingRowsFor<
    ReturnType<PgroutingOverloads["routine:$extension:pgrouting.pgr_transitiveclosure(pg_catalog.text)"]> extends SQL<
      infer Output
    >
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trspvia_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trspvia_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trspvia_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trspvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trspvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trspvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trspviaedges(pg_catalog.text,pg_catalog._int4,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trspviaedges(pg_catalog.text,pg_catalog._int4,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trspviaedges(pg_catalog.text,pg_catalog._int4,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_trspviavertices(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trspviavertices(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_trspviavertices(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_tsp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_tsp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_tsp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_tspeuclidean(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_tspeuclidean(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_tspeuclidean(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_turnrestrictedpath(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_turnrestrictedpath(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_turnrestrictedpath(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_vrponedepot(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_vrponedepot(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_vrponedepot(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointscostmatrix(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscostmatrix(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointscostmatrix(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
  readonly "routine:$extension:pgrouting.pgr_withpointsvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": (
    alias: string,
    ...values: Parameters<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    >
  ) => PgroutingRowsFor<
    ReturnType<
      PgroutingOverloads["routine:$extension:pgrouting.pgr_withpointsvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)"]
    > extends SQL<infer Output>
      ? Output
      : never
  >;
}
export interface PgroutingAdapter {
  // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- Preserve the exact captured pgRouting alpha-shape routine name in the public native API.
  readonly pgrAlphashape: PgroutingFunctions["pgr_alphashape"];
  readonly pgrArticulationpoints: PgroutingFunctions["pgr_articulationpoints"];
  readonly pgrAstar: PgroutingFunctions["pgr_astar"];
  readonly pgrAstarcost: PgroutingFunctions["pgr_astarcost"];
  readonly pgrAstarcostmatrix: PgroutingFunctions["pgr_astarcostmatrix"];
  readonly pgrBdastar: PgroutingFunctions["pgr_bdastar"];
  readonly pgrBdastarcost: PgroutingFunctions["pgr_bdastarcost"];
  readonly pgrBdastarcostmatrix: PgroutingFunctions["pgr_bdastarcostmatrix"];
  readonly pgrBddijkstra: PgroutingFunctions["pgr_bddijkstra"];
  readonly pgrBddijkstracost: PgroutingFunctions["pgr_bddijkstracost"];
  readonly pgrBddijkstracostmatrix: PgroutingFunctions["pgr_bddijkstracostmatrix"];
  readonly pgrBellmanford: PgroutingFunctions["pgr_bellmanford"];
  readonly pgrBetweennesscentrality: PgroutingFunctions["pgr_betweennesscentrality"];
  readonly pgrBiconnectedcomponents: PgroutingFunctions["pgr_biconnectedcomponents"];
  readonly pgrBinarybreadthfirstsearch: PgroutingFunctions["pgr_binarybreadthfirstsearch"];
  readonly pgrBipartite: PgroutingFunctions["pgr_bipartite"];
  readonly pgrBoykovkolmogorov: PgroutingFunctions["pgr_boykovkolmogorov"];
  readonly pgrBreadthfirstsearch: PgroutingFunctions["pgr_breadthfirstsearch"];
  readonly pgrBridges: PgroutingFunctions["pgr_bridges"];
  readonly pgrChinesepostman: PgroutingFunctions["pgr_chinesepostman"];
  readonly pgrChinesepostmancost: PgroutingFunctions["pgr_chinesepostmancost"];
  readonly pgrConnectedcomponents: PgroutingFunctions["pgr_connectedcomponents"];
  readonly pgrContraction: PgroutingFunctions["pgr_contraction"];
  readonly pgrContractiondeadend: PgroutingFunctions["pgr_contractiondeadend"];
  readonly pgrContractionhierarchies: PgroutingFunctions["pgr_contractionhierarchies"];
  readonly pgrContractionlinear: PgroutingFunctions["pgr_contractionlinear"];
  readonly pgrCuthillmckeeordering: PgroutingFunctions["pgr_cuthillmckeeordering"];
  readonly pgrDagshortestpath: PgroutingFunctions["pgr_dagshortestpath"];
  readonly pgrDegree: PgroutingFunctions["pgr_degree"];
  readonly pgrDepthfirstsearch: PgroutingFunctions["pgr_depthfirstsearch"];
  readonly pgrDijkstra: PgroutingFunctions["pgr_dijkstra"];
  readonly pgrDijkstracost: PgroutingFunctions["pgr_dijkstracost"];
  readonly pgrDijkstracostmatrix: PgroutingFunctions["pgr_dijkstracostmatrix"];
  readonly pgrDijkstranear: PgroutingFunctions["pgr_dijkstranear"];
  readonly pgrDijkstranearcost: PgroutingFunctions["pgr_dijkstranearcost"];
  readonly pgrDijkstravia: PgroutingFunctions["pgr_dijkstravia"];
  readonly pgrDrivingdistance: PgroutingFunctions["pgr_drivingdistance"];
  readonly pgrEdgecoloring: PgroutingFunctions["pgr_edgecoloring"];
  readonly pgrEdgedisjointpaths: PgroutingFunctions["pgr_edgedisjointpaths"];
  readonly pgrEdmondskarp: PgroutingFunctions["pgr_edmondskarp"];
  readonly pgrEdwardmoore: PgroutingFunctions["pgr_edwardmoore"];
  readonly pgrExtractvertices: PgroutingFunctions["pgr_extractvertices"];
  readonly pgrFindcloseedges: PgroutingFunctions["pgr_findcloseedges"];
  readonly pgrFloydwarshall: PgroutingFunctions["pgr_floydwarshall"];
  readonly pgrFull_version: PgroutingFunctions["pgr_full_version"];
  readonly pgrHawickcircuits: PgroutingFunctions["pgr_hawickcircuits"];
  readonly pgrIsplanar: PgroutingFunctions["pgr_isplanar"];
  readonly pgrJohnson: PgroutingFunctions["pgr_johnson"];
  readonly pgrKruskal: PgroutingFunctions["pgr_kruskal"];
  readonly pgrKruskalbfs: PgroutingFunctions["pgr_kruskalbfs"];
  readonly pgrKruskaldd: PgroutingFunctions["pgr_kruskaldd"];
  readonly pgrKruskaldfs: PgroutingFunctions["pgr_kruskaldfs"];
  readonly pgrKsp: PgroutingFunctions["pgr_ksp"];
  readonly pgrLengauertarjandominatortree: PgroutingFunctions["pgr_lengauertarjandominatortree"];
  readonly pgrLinegraph: PgroutingFunctions["pgr_linegraph"];
  readonly pgrLinegraphfull: PgroutingFunctions["pgr_linegraphfull"];
  readonly pgrMakeconnected: PgroutingFunctions["pgr_makeconnected"];
  readonly pgrMaxcardinalitymatch: PgroutingFunctions["pgr_maxcardinalitymatch"];
  readonly pgrMaxflow: PgroutingFunctions["pgr_maxflow"];
  readonly pgrMaxflowmincost_cost: PgroutingFunctions["pgr_maxflowmincost_cost"];
  readonly pgrMaxflowmincost: PgroutingFunctions["pgr_maxflowmincost"];
  readonly pgrPickdeliver: PgroutingFunctions["pgr_pickdeliver"];
  readonly pgrPickdelivereuclidean: PgroutingFunctions["pgr_pickdelivereuclidean"];
  readonly pgrPrim: PgroutingFunctions["pgr_prim"];
  readonly pgrPrimbfs: PgroutingFunctions["pgr_primbfs"];
  readonly pgrPrimdd: PgroutingFunctions["pgr_primdd"];
  readonly pgrPrimdfs: PgroutingFunctions["pgr_primdfs"];
  readonly pgrPushrelabel: PgroutingFunctions["pgr_pushrelabel"];
  readonly pgrSeparatecrossing: PgroutingFunctions["pgr_separatecrossing"];
  readonly pgrSeparatetouching: PgroutingFunctions["pgr_separatetouching"];
  readonly pgrSequentialvertexcoloring: PgroutingFunctions["pgr_sequentialvertexcoloring"];
  readonly pgrStoerwagner: PgroutingFunctions["pgr_stoerwagner"];
  readonly pgrStrongcomponents: PgroutingFunctions["pgr_strongcomponents"];
  readonly pgrTopologicalsort: PgroutingFunctions["pgr_topologicalsort"];
  readonly pgrTransitiveclosure: PgroutingFunctions["pgr_transitiveclosure"];
  readonly pgrTrsp_withpoints: PgroutingFunctions["pgr_trsp_withpoints"];
  readonly pgrTrsp: PgroutingFunctions["pgr_trsp"];
  readonly pgrTrspvia_withpoints: PgroutingFunctions["pgr_trspvia_withpoints"];
  readonly pgrTrspvia: PgroutingFunctions["pgr_trspvia"];
  readonly pgrTrspviaedges: PgroutingFunctions["pgr_trspviaedges"];
  readonly pgrTrspviavertices: PgroutingFunctions["pgr_trspviavertices"];
  readonly pgrTsp: PgroutingFunctions["pgr_tsp"];
  readonly pgrTspeuclidean: PgroutingFunctions["pgr_tspeuclidean"];
  readonly pgrTurnrestrictedpath: PgroutingFunctions["pgr_turnrestrictedpath"];
  readonly pgrVersion: PgroutingFunctions["pgr_version"];
  readonly pgrVrponedepot: PgroutingFunctions["pgr_vrponedepot"];
  readonly pgrWithpoints: PgroutingFunctions["pgr_withpoints"];
  readonly pgrWithpointscost: PgroutingFunctions["pgr_withpointscost"];
  readonly pgrWithpointscostmatrix: PgroutingFunctions["pgr_withpointscostmatrix"];
  readonly pgrWithpointsdd: PgroutingFunctions["pgr_withpointsdd"];
  readonly pgrWithpointsksp: PgroutingFunctions["pgr_withpointsksp"];
  readonly pgrWithpointsvia: PgroutingFunctions["pgr_withpointsvia"];
  readonly codecs: PgroutingCodecs;
  readonly sql: {
    readonly functions: PgroutingFunctions;
    readonly overloads: PgroutingOverloads;
    readonly rows: PgroutingRows;
    readonly types: {};
  };
}
/** Exact native pgRouting routines. All graph work executes in PostgreSQL; no JS routing algorithms. */
export function createPgrouting_3_8_0<const Selected extends Descriptor>(
  descriptor: Selected,
  postgis: PostgisDescriptor,
): Readonly<Selected & PgroutingAdapter> {
  if (
    descriptor.name !== "pgrouting" ||
    descriptor.version !== "3.8.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("pgRouting 3.8.0 requires its exact verified contract");
  if (
    postgis.name !== "postgis" ||
    postgis.version !== "3.6.4" ||
    postgis.apiSupport.status !== "verified" ||
    postgis.apiSupport.digest !== postgisDigest
  )
    throw new Error("pgRouting requires the exact verified PostGIS 3.6.4 dependency");
  const schema = descriptor.schema;
  const base = { schema, authority: "query", observability: "tables" } as const;
  const {
    text,
    int4,
    int8,
    bool,
    float8,
    numeric,
    bpchar,
    geometry,
    geometryArray,
    int4Array,
    int8Array,
    idsArray,
    float8Array,
    textArray,
  } = createPgroutingCodecs(postgis.schema);

  // The selected native implementation has a confirmed backend SIGSEGV. Keep the
  // captured signature, but reject every exposed call until a native repair is verified.
  const member126: PgroutingOverloads["routine:$extension:pgrouting.pgr_alphashape($extension:postgis.geometry,pg_catalog.float8)"] =
    () => {
      throw new Error("pgRouting 3.8.0 pgr_alphashape is unavailable pending verified native repair");
    };
  const fields129 = { node: int8 } as const;
  function member129(arg0: NestedQuery<PgroutingGraphEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_articulationpoints",
      member: "routine:$extension:pgrouting.pgr_articulationpoints(pg_catalog.text)",
      arguments: [text] as const,
      result: int8,
    })(query0);
  }

  Object.assign(member129, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_articulationpoints(pg_catalog.text)"]),
  });
  const rows129 = (alias: string, ...values: Parameters<typeof member129>) =>
    extensionRows(member129(...values), alias, fields129, "named");
  const fields130 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member130(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof float8>,
    arg6?: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_astar",
      member:
        "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
      arguments: [
        text,
        idsArray,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(float8, "factor"),
        defaultSqlArgument(float8, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
          fields130,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member130, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    ]),
  });
  const rows130 = (alias: string, ...values: Parameters<typeof member130>) =>
    extensionRows(member130(...values), alias, fields130, "named");
  const fields131 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member131(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof float8>,
    arg6?: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_astar",
      member:
        "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
      arguments: [
        text,
        idsArray,
        int8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(float8, "factor"),
        defaultSqlArgument(float8, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
          fields131,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member131, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    ]),
  });
  const rows131 = (alias: string, ...values: Parameters<typeof member131>) =>
    extensionRows(member131(...values), alias, fields131, "named");
  const fields132 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member132(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof float8>,
    arg6?: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_astar",
      member:
        "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
      arguments: [
        text,
        int8,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(float8, "factor"),
        defaultSqlArgument(float8, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
          fields132,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member132, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    ]),
  });
  const rows132 = (alias: string, ...values: Parameters<typeof member132>) =>
    extensionRows(member132(...values), alias, fields132, "named");
  const fields133 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member133(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof float8>,
    arg6?: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_astar",
      member:
        "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
      arguments: [
        text,
        int8,
        int8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(float8, "factor"),
        defaultSqlArgument(float8, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
          fields133,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member133, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    ]),
  });
  const rows133 = (alias: string, ...values: Parameters<typeof member133>) =>
    extensionRows(member133(...values), alias, fields133, "named");
  const fields134 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member134(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
    arg3?: ExtensionSqlInput<typeof int4>,
    arg4?: ExtensionSqlInput<typeof float8>,
    arg5?: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_astar",
      member:
        "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
      arguments: [
        text,
        text,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(float8, "factor"),
        defaultSqlArgument(float8, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
          fields134,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member134, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    ]),
  });
  const rows134 = (alias: string, ...values: Parameters<typeof member134>) =>
    extensionRows(member134(...values), alias, fields134, "named");
  const fields135 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member135(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof float8>,
    arg6?: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_astarcost",
      member:
        "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
      arguments: [
        text,
        idsArray,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(float8, "factor"),
        defaultSqlArgument(float8, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
          fields135,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member135, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    ]),
  });
  const rows135 = (alias: string, ...values: Parameters<typeof member135>) =>
    extensionRows(member135(...values), alias, fields135, "named");
  const fields136 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member136(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof float8>,
    arg6?: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_astarcost",
      member:
        "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
      arguments: [
        text,
        idsArray,
        int8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(float8, "factor"),
        defaultSqlArgument(float8, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
          fields136,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member136, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    ]),
  });
  const rows136 = (alias: string, ...values: Parameters<typeof member136>) =>
    extensionRows(member136(...values), alias, fields136, "named");
  const fields137 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member137(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof float8>,
    arg6?: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_astarcost",
      member:
        "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
      arguments: [
        text,
        int8,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(float8, "factor"),
        defaultSqlArgument(float8, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
          fields137,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member137, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    ]),
  });
  const rows137 = (alias: string, ...values: Parameters<typeof member137>) =>
    extensionRows(member137(...values), alias, fields137, "named");
  const fields138 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member138(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof float8>,
    arg6?: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_astarcost",
      member:
        "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
      arguments: [
        text,
        int8,
        int8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(float8, "factor"),
        defaultSqlArgument(float8, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
          fields138,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member138, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    ]),
  });
  const rows138 = (alias: string, ...values: Parameters<typeof member138>) =>
    extensionRows(member138(...values), alias, fields138, "named");
  const fields139 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member139(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
    arg3?: ExtensionSqlInput<typeof int4>,
    arg4?: ExtensionSqlInput<typeof float8>,
    arg5?: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_astarcost",
      member:
        "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
      arguments: [
        text,
        text,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(float8, "factor"),
        defaultSqlArgument(float8, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
          fields139,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member139, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    ]),
  });
  const rows139 = (alias: string, ...values: Parameters<typeof member139>) =>
    extensionRows(member139(...values), alias, fields139, "named");
  const fields140 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member140(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2?: ExtensionSqlInput<typeof bool>,
    arg3?: ExtensionSqlInput<typeof int4>,
    arg4?: ExtensionSqlInput<typeof float8>,
    arg5?: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_astarcostmatrix",
      member:
        "routine:$extension:pgrouting.pgr_astarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
      arguments: [
        text,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(float8, "factor"),
        defaultSqlArgument(float8, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_astarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
          fields140,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member140, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_astarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    ]),
  });
  const rows140 = (alias: string, ...values: Parameters<typeof member140>) =>
    extensionRows(member140(...values), alias, fields140, "named");
  const fields141 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member141(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof numeric>,
    arg6?: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bdastar",
      member:
        "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
      arguments: [
        text,
        idsArray,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(numeric, "factor"),
        defaultSqlArgument(numeric, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
          fields141,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member141, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    ]),
  });
  const rows141 = (alias: string, ...values: Parameters<typeof member141>) =>
    extensionRows(member141(...values), alias, fields141, "named");
  const fields142 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member142(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof numeric>,
    arg6?: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bdastar",
      member:
        "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
      arguments: [
        text,
        idsArray,
        int8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(numeric, "factor"),
        defaultSqlArgument(numeric, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
          fields142,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member142, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    ]),
  });
  const rows142 = (alias: string, ...values: Parameters<typeof member142>) =>
    extensionRows(member142(...values), alias, fields142, "named");
  const fields143 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member143(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof numeric>,
    arg6?: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bdastar",
      member:
        "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
      arguments: [
        text,
        int8,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(numeric, "factor"),
        defaultSqlArgument(numeric, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
          fields143,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member143, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    ]),
  });
  const rows143 = (alias: string, ...values: Parameters<typeof member143>) =>
    extensionRows(member143(...values), alias, fields143, "named");
  const fields144 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member144(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof numeric>,
    arg6?: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bdastar",
      member:
        "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
      arguments: [
        text,
        int8,
        int8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(numeric, "factor"),
        defaultSqlArgument(numeric, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
          fields144,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member144, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    ]),
  });
  const rows144 = (alias: string, ...values: Parameters<typeof member144>) =>
    extensionRows(member144(...values), alias, fields144, "named");
  const fields145 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member145(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
    arg3?: ExtensionSqlInput<typeof int4>,
    arg4?: ExtensionSqlInput<typeof numeric>,
    arg5?: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bdastar",
      member:
        "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
      arguments: [
        text,
        text,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(numeric, "factor"),
        defaultSqlArgument(numeric, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
          fields145,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member145, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    ]),
  });
  const rows145 = (alias: string, ...values: Parameters<typeof member145>) =>
    extensionRows(member145(...values), alias, fields145, "named");
  const fields146 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member146(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof numeric>,
    arg6?: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bdastarcost",
      member:
        "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
      arguments: [
        text,
        idsArray,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(numeric, "factor"),
        defaultSqlArgument(numeric, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
          fields146,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member146, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    ]),
  });
  const rows146 = (alias: string, ...values: Parameters<typeof member146>) =>
    extensionRows(member146(...values), alias, fields146, "named");
  const fields147 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member147(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof numeric>,
    arg6?: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bdastarcost",
      member:
        "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
      arguments: [
        text,
        idsArray,
        int8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(numeric, "factor"),
        defaultSqlArgument(numeric, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
          fields147,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member147, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    ]),
  });
  const rows147 = (alias: string, ...values: Parameters<typeof member147>) =>
    extensionRows(member147(...values), alias, fields147, "named");
  const fields148 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member148(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof numeric>,
    arg6?: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bdastarcost",
      member:
        "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
      arguments: [
        text,
        int8,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(numeric, "factor"),
        defaultSqlArgument(numeric, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
          fields148,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member148, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    ]),
  });
  const rows148 = (alias: string, ...values: Parameters<typeof member148>) =>
    extensionRows(member148(...values), alias, fields148, "named");
  const fields149 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member149(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof numeric>,
    arg6?: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bdastarcost",
      member:
        "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
      arguments: [
        text,
        int8,
        int8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(numeric, "factor"),
        defaultSqlArgument(numeric, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
          fields149,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member149, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    ]),
  });
  const rows149 = (alias: string, ...values: Parameters<typeof member149>) =>
    extensionRows(member149(...values), alias, fields149, "named");
  const fields150 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member150(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
    arg3?: ExtensionSqlInput<typeof int4>,
    arg4?: ExtensionSqlInput<typeof numeric>,
    arg5?: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bdastarcost",
      member:
        "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
      arguments: [
        text,
        text,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(numeric, "factor"),
        defaultSqlArgument(numeric, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
          fields150,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member150, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    ]),
  });
  const rows150 = (alias: string, ...values: Parameters<typeof member150>) =>
    extensionRows(member150(...values), alias, fields150, "named");
  const fields151 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member151(
    arg0: NestedQuery<PgroutingAstarEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2?: ExtensionSqlInput<typeof bool>,
    arg3?: ExtensionSqlInput<typeof int4>,
    arg4?: ExtensionSqlInput<typeof numeric>,
    arg5?: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bdastarcostmatrix",
      member:
        "routine:$extension:pgrouting.pgr_bdastarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
      arguments: [
        text,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4, "heuristic"),
        defaultSqlArgument(numeric, "factor"),
        defaultSqlArgument(numeric, "epsilon"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bdastarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
          fields151,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member151, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bdastarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    ]),
  });
  const rows151 = (alias: string, ...values: Parameters<typeof member151>) =>
    extensionRows(member151(...values), alias, fields151, "named");
  const fields152 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member152(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bddijkstra",
      member:
        "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, idsArray, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
          fields152,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member152, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows152 = (alias: string, ...values: Parameters<typeof member152>) =>
    extensionRows(member152(...values), alias, fields152, "named");
  const fields153 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member153(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bddijkstra",
      member:
        "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, idsArray, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
          fields153,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member153, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows153 = (alias: string, ...values: Parameters<typeof member153>) =>
    extensionRows(member153(...values), alias, fields153, "named");
  const fields154 = {
    seq: int4,
    path_seq: int4,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member154(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bddijkstra",
      member:
        "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, int8, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
          fields154,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member154, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows154 = (alias: string, ...values: Parameters<typeof member154>) =>
    extensionRows(member154(...values), alias, fields154, "named");
  const fields155 = { seq: int4, path_seq: int4, node: int8, edge: int8, cost: float8, agg_cost: float8 } as const;
  function member155(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bddijkstra",
      member:
        "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, int8, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
          fields155,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member155, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows155 = (alias: string, ...values: Parameters<typeof member155>) =>
    extensionRows(member155(...values), alias, fields155, "named");
  const fields156 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member156(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bddijkstra",
      member: "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
      arguments: [text, text, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
          fields156,
        ),
      ),
    })(query0, query1, arg2);
  }

  Object.assign(member156, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    ]),
  });
  const rows156 = (alias: string, ...values: Parameters<typeof member156>) =>
    extensionRows(member156(...values), alias, fields156, "named");
  const fields157 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member157(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bddijkstracost",
      member:
        "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, idsArray, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
          fields157,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member157, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows157 = (alias: string, ...values: Parameters<typeof member157>) =>
    extensionRows(member157(...values), alias, fields157, "named");
  const fields158 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member158(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bddijkstracost",
      member:
        "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, idsArray, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
          fields158,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member158, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows158 = (alias: string, ...values: Parameters<typeof member158>) =>
    extensionRows(member158(...values), alias, fields158, "named");
  const fields159 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member159(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bddijkstracost",
      member:
        "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, int8, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
          fields159,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member159, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows159 = (alias: string, ...values: Parameters<typeof member159>) =>
    extensionRows(member159(...values), alias, fields159, "named");
  const fields160 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member160(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bddijkstracost",
      member:
        "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, int8, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
          fields160,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member160, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows160 = (alias: string, ...values: Parameters<typeof member160>) =>
    extensionRows(member160(...values), alias, fields160, "named");
  const fields161 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member161(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bddijkstracost",
      member: "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
      arguments: [text, text, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
          fields161,
        ),
      ),
    })(query0, query1, arg2);
  }

  Object.assign(member161, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    ]),
  });
  const rows161 = (alias: string, ...values: Parameters<typeof member161>) =>
    extensionRows(member161(...values), alias, fields161, "named");
  const fields162 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member162(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bddijkstracostmatrix",
      member:
        "routine:$extension:pgrouting.pgr_bddijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bddijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)",
          fields162,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member162, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bddijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows162 = (alias: string, ...values: Parameters<typeof member162>) =>
    extensionRows(member162(...values), alias, fields162, "named");
  const fields163 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member163(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bellmanford",
      member:
        "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, idsArray, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
          fields163,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member163, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows163 = (alias: string, ...values: Parameters<typeof member163>) =>
    extensionRows(member163(...values), alias, fields163, "named");
  const fields164 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member164(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bellmanford",
      member:
        "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, idsArray, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
          fields164,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member164, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows164 = (alias: string, ...values: Parameters<typeof member164>) =>
    extensionRows(member164(...values), alias, fields164, "named");
  const fields165 = {
    seq: int4,
    path_seq: int4,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member165(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bellmanford",
      member:
        "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, int8, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
          fields165,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member165, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows165 = (alias: string, ...values: Parameters<typeof member165>) =>
    extensionRows(member165(...values), alias, fields165, "named");
  const fields166 = { seq: int4, path_seq: int4, node: int8, edge: int8, cost: float8, agg_cost: float8 } as const;
  function member166(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bellmanford",
      member:
        "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, int8, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
          fields166,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member166, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows166 = (alias: string, ...values: Parameters<typeof member166>) =>
    extensionRows(member166(...values), alias, fields166, "named");
  const fields167 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member167(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bellmanford",
      member: "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
      arguments: [text, text, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
          fields167,
        ),
      ),
    })(query0, query1, arg2);
  }

  Object.assign(member167, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    ]),
  });
  const rows167 = (alias: string, ...values: Parameters<typeof member167>) =>
    extensionRows(member167(...values), alias, fields167, "named");
  const fields168 = { vid: int8, centrality: float8 } as const;
  function member168(arg0: NestedQuery<PgroutingCostEdges> | null, arg1?: ExtensionSqlInput<typeof bool>) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_betweennesscentrality",
      member: "routine:$extension:pgrouting.pgr_betweennesscentrality(pg_catalog.text,pg_catalog.bool)",
      arguments: [text, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_betweennesscentrality(pg_catalog.text,pg_catalog.bool)",
          fields168,
        ),
      ),
    })(query0, arg1);
  }

  Object.assign(member168, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_betweennesscentrality(pg_catalog.text,pg_catalog.bool)"]),
  });
  const rows168 = (alias: string, ...values: Parameters<typeof member168>) =>
    extensionRows(member168(...values), alias, fields168, "named");
  const fields169 = { seq: int8, component: int8, edge: int8 } as const;
  function member169(arg0: NestedQuery<PgroutingGraphEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_biconnectedcomponents",
      member: "routine:$extension:pgrouting.pgr_biconnectedcomponents(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_biconnectedcomponents(pg_catalog.text)", fields169),
      ),
    })(query0);
  }

  Object.assign(member169, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_biconnectedcomponents(pg_catalog.text)"]),
  });
  const rows169 = (alias: string, ...values: Parameters<typeof member169>) =>
    extensionRows(member169(...values), alias, fields169, "named");
  const fields170 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member170(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_binarybreadthfirstsearch",
      member:
        "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, idsArray, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
          fields170,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member170, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows170 = (alias: string, ...values: Parameters<typeof member170>) =>
    extensionRows(member170(...values), alias, fields170, "named");
  const fields171 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member171(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_binarybreadthfirstsearch",
      member:
        "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, idsArray, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
          fields171,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member171, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows171 = (alias: string, ...values: Parameters<typeof member171>) =>
    extensionRows(member171(...values), alias, fields171, "named");
  const fields172 = {
    seq: int4,
    path_seq: int4,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member172(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_binarybreadthfirstsearch",
      member:
        "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, int8, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
          fields172,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member172, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows172 = (alias: string, ...values: Parameters<typeof member172>) =>
    extensionRows(member172(...values), alias, fields172, "named");
  const fields173 = { seq: int4, path_seq: int4, node: int8, edge: int8, cost: float8, agg_cost: float8 } as const;
  function member173(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_binarybreadthfirstsearch",
      member:
        "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, int8, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
          fields173,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member173, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows173 = (alias: string, ...values: Parameters<typeof member173>) =>
    extensionRows(member173(...values), alias, fields173, "named");
  const fields174 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member174(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_binarybreadthfirstsearch",
      member:
        "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
      arguments: [text, text, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
          fields174,
        ),
      ),
    })(query0, query1, arg2);
  }

  Object.assign(member174, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    ]),
  });
  const rows174 = (alias: string, ...values: Parameters<typeof member174>) =>
    extensionRows(member174(...values), alias, fields174, "named");
  const fields175 = { vertex_id: int8, color_id: int8 } as const;
  function member175(arg0: NestedQuery<PgroutingGraphEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bipartite",
      member: "routine:$extension:pgrouting.pgr_bipartite(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(compositeCodec("routine:$extension:pgrouting.pgr_bipartite(pg_catalog.text)", fields175)),
    })(query0);
  }

  Object.assign(member175, { members: Object.freeze(["routine:$extension:pgrouting.pgr_bipartite(pg_catalog.text)"]) });
  const rows175 = (alias: string, ...values: Parameters<typeof member175>) =>
    extensionRows(member175(...values), alias, fields175, "named");
  const fields176 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member176(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_boykovkolmogorov",
      member:
        "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
      arguments: [text, idsArray, idsArray] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
          fields176,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member176, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
    ]),
  });
  const rows176 = (alias: string, ...values: Parameters<typeof member176>) =>
    extensionRows(member176(...values), alias, fields176, "named");
  const fields177 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member177(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_boykovkolmogorov",
      member: "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
      arguments: [text, idsArray, int8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
          fields177,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member177, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    ]),
  });
  const rows177 = (alias: string, ...values: Parameters<typeof member177>) =>
    extensionRows(member177(...values), alias, fields177, "named");
  const fields178 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member178(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_boykovkolmogorov",
      member: "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
      arguments: [text, int8, idsArray] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
          fields178,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member178, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
    ]),
  });
  const rows178 = (alias: string, ...values: Parameters<typeof member178>) =>
    extensionRows(member178(...values), alias, fields178, "named");
  const fields179 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member179(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_boykovkolmogorov",
      member: "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
      arguments: [text, int8, int8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
          fields179,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member179, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    ]),
  });
  const rows179 = (alias: string, ...values: Parameters<typeof member179>) =>
    extensionRows(member179(...values), alias, fields179, "named");
  const fields180 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member180(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_boykovkolmogorov",
      member: "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.text)",
      arguments: [text, text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.text)", fields180),
      ),
    })(query0, query1);
  }

  Object.assign(member180, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.text)"]),
  });
  const rows180 = (alias: string, ...values: Parameters<typeof member180>) =>
    extensionRows(member180(...values), alias, fields180, "named");
  const fields181 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member181(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2?: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_breadthfirstsearch",
      member:
        "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, idsArray, defaultSqlArgument(int8, "max_depth"), defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
          fields181,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member181, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows181 = (alias: string, ...values: Parameters<typeof member181>) =>
    extensionRows(member181(...values), alias, fields181, "named");
  const fields182 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member182(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2?: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_breadthfirstsearch",
      member:
        "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, int8, defaultSqlArgument(int8, "max_depth"), defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
          fields182,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member182, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows182 = (alias: string, ...values: Parameters<typeof member182>) =>
    extensionRows(member182(...values), alias, fields182, "named");
  const fields183 = { edge: int8 } as const;
  function member183(arg0: NestedQuery<PgroutingGraphEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_bridges",
      member: "routine:$extension:pgrouting.pgr_bridges(pg_catalog.text)",
      arguments: [text] as const,
      result: int8,
    })(query0);
  }

  Object.assign(member183, { members: Object.freeze(["routine:$extension:pgrouting.pgr_bridges(pg_catalog.text)"]) });
  const rows183 = (alias: string, ...values: Parameters<typeof member183>) =>
    extensionRows(member183(...values), alias, fields183, "named");
  const fields184 = { seq: int4, node: int8, edge: int8, cost: float8, agg_cost: float8 } as const;
  function member184(arg0: NestedQuery<PgroutingCostEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_chinesepostman",
      member: "routine:$extension:pgrouting.pgr_chinesepostman(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_chinesepostman(pg_catalog.text)", fields184),
      ),
    })(query0);
  }

  Object.assign(member184, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_chinesepostman(pg_catalog.text)"]),
  });
  const rows184 = (alias: string, ...values: Parameters<typeof member184>) =>
    extensionRows(member184(...values), alias, fields184, "named");
  function member185(arg0: NestedQuery<PgroutingCostEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_chinesepostmancost",
      member: "routine:$extension:pgrouting.pgr_chinesepostmancost(pg_catalog.text)",
      arguments: [text] as const,
      result: float8,
    })(query0);
  }

  Object.assign(member185, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_chinesepostmancost(pg_catalog.text)"]),
  });
  const fields186 = { seq: int8, component: int8, node: int8 } as const;
  function member186(arg0: NestedQuery<PgroutingGraphEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_connectedcomponents",
      member: "routine:$extension:pgrouting.pgr_connectedcomponents(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_connectedcomponents(pg_catalog.text)", fields186),
      ),
    })(query0);
  }

  Object.assign(member186, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_connectedcomponents(pg_catalog.text)"]),
  });
  const rows186 = (alias: string, ...values: Parameters<typeof member186>) =>
    extensionRows(member186(...values), alias, fields186, "named");
  const fields187 = {
    type: text,
    id: int8,
    contracted_vertices: int8Array,
    source: int8,
    target: int8,
    cost: float8,
  } as const;
  function member187(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8Array>,
    arg2?: ExtensionSqlInput<typeof int4>,
    arg3?: ExtensionSqlInput<typeof int8Array>,
    arg4?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_contraction",
      member:
        "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog._int8,pg_catalog.int4,pg_catalog._int8,pg_catalog.bool)",
      arguments: [
        text,
        int8Array,
        defaultSqlArgument(int4, "max_cycles"),
        defaultSqlArgument(int8Array, "forbidden_vertices"),
        defaultSqlArgument(bool, "directed"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog._int8,pg_catalog.int4,pg_catalog._int8,pg_catalog.bool)",
          fields187,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4);
  }

  Object.assign(member187, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog._int8,pg_catalog.int4,pg_catalog._int8,pg_catalog.bool)",
    ]),
  });
  const rows187 = (alias: string, ...values: Parameters<typeof member187>) =>
    extensionRows(member187(...values), alias, fields187, "named");
  const fields188 = {
    type: text,
    id: int8,
    contracted_vertices: int8Array,
    source: int8,
    target: int8,
    cost: float8,
  } as const;
  function member188(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1?: ExtensionSqlInput<typeof bool>,
    arg2?: ExtensionSqlInput<typeof int4Array>,
    arg3?: ExtensionSqlInput<typeof int4>,
    arg4?: ExtensionSqlInput<typeof int8Array>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_contraction",
      member:
        "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog.bool,pg_catalog._int4,pg_catalog.int4,pg_catalog._int8)",
      arguments: [
        text,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int4Array, "methods"),
        defaultSqlArgument(int4, "cycles"),
        defaultSqlArgument(int8Array, "forbidden"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog.bool,pg_catalog._int4,pg_catalog.int4,pg_catalog._int8)",
          fields188,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4);
  }

  Object.assign(member188, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog.bool,pg_catalog._int4,pg_catalog.int4,pg_catalog._int8)",
    ]),
  });
  const rows188 = (alias: string, ...values: Parameters<typeof member188>) =>
    extensionRows(member188(...values), alias, fields188, "named");
  const fields189 = {
    type: text,
    id: int8,
    contracted_vertices: int8Array,
    source: int8,
    target: int8,
    cost: float8,
  } as const;
  function member189(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1?: ExtensionSqlInput<typeof bool>,
    arg2?: ExtensionSqlInput<typeof int8Array>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_contractiondeadend",
      member: "routine:$extension:pgrouting.pgr_contractiondeadend(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)",
      arguments: [text, defaultSqlArgument(bool, "directed"), defaultSqlArgument(int8Array, "forbidden")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_contractiondeadend(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)",
          fields189,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member189, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_contractiondeadend(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)",
    ]),
  });
  const rows189 = (alias: string, ...values: Parameters<typeof member189>) =>
    extensionRows(member189(...values), alias, fields189, "named");
  const fields190 = {
    type: text,
    id: int8,
    contracted_vertices: int8Array,
    source: int8,
    target: int8,
    cost: float8,
    metric: int8,
    vertex_order: int8,
  } as const;
  function member190(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1?: ExtensionSqlInput<typeof bool>,
    arg2?: ExtensionSqlInput<typeof int8Array>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_contractionhierarchies",
      member:
        "routine:$extension:pgrouting.pgr_contractionhierarchies(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)",
      arguments: [text, defaultSqlArgument(bool, "directed"), defaultSqlArgument(int8Array, "forbidden")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_contractionhierarchies(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)",
          fields190,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member190, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_contractionhierarchies(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)",
    ]),
  });
  const rows190 = (alias: string, ...values: Parameters<typeof member190>) =>
    extensionRows(member190(...values), alias, fields190, "named");
  const fields191 = {
    type: text,
    id: int8,
    contracted_vertices: int8Array,
    source: int8,
    target: int8,
    cost: float8,
  } as const;
  function member191(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1?: ExtensionSqlInput<typeof bool>,
    arg2?: ExtensionSqlInput<typeof int8Array>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_contractionlinear",
      member: "routine:$extension:pgrouting.pgr_contractionlinear(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)",
      arguments: [text, defaultSqlArgument(bool, "directed"), defaultSqlArgument(int8Array, "forbidden")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_contractionlinear(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)",
          fields191,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member191, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_contractionlinear(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)",
    ]),
  });
  const rows191 = (alias: string, ...values: Parameters<typeof member191>) =>
    extensionRows(member191(...values), alias, fields191, "named");
  const fields194 = { seq: int8, node: int8 } as const;
  function member194(arg0: NestedQuery<PgroutingGraphEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_cuthillmckeeordering",
      member: "routine:$extension:pgrouting.pgr_cuthillmckeeordering(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_cuthillmckeeordering(pg_catalog.text)", fields194),
      ),
    })(query0);
  }

  Object.assign(member194, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_cuthillmckeeordering(pg_catalog.text)"]),
  });
  const rows194 = (alias: string, ...values: Parameters<typeof member194>) =>
    extensionRows(member194(...values), alias, fields194, "named");
  const fields195 = { seq: int4, path_seq: int4, node: int8, edge: int8, cost: float8, agg_cost: float8 } as const;
  function member195(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dagshortestpath",
      member:
        "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
      arguments: [text, idsArray, idsArray] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
          fields195,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member195, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
    ]),
  });
  const rows195 = (alias: string, ...values: Parameters<typeof member195>) =>
    extensionRows(member195(...values), alias, fields195, "named");
  const fields196 = { seq: int4, path_seq: int4, node: int8, edge: int8, cost: float8, agg_cost: float8 } as const;
  function member196(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dagshortestpath",
      member: "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
      arguments: [text, idsArray, int8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
          fields196,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member196, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    ]),
  });
  const rows196 = (alias: string, ...values: Parameters<typeof member196>) =>
    extensionRows(member196(...values), alias, fields196, "named");
  const fields197 = { seq: int4, path_seq: int4, node: int8, edge: int8, cost: float8, agg_cost: float8 } as const;
  function member197(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dagshortestpath",
      member: "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
      arguments: [text, int8, idsArray] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
          fields197,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member197, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
    ]),
  });
  const rows197 = (alias: string, ...values: Parameters<typeof member197>) =>
    extensionRows(member197(...values), alias, fields197, "named");
  const fields198 = { seq: int4, path_seq: int4, node: int8, edge: int8, cost: float8, agg_cost: float8 } as const;
  function member198(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dagshortestpath",
      member: "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
      arguments: [text, int8, int8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
          fields198,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member198, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    ]),
  });
  const rows198 = (alias: string, ...values: Parameters<typeof member198>) =>
    extensionRows(member198(...values), alias, fields198, "named");
  const fields199 = { seq: int4, path_seq: int4, node: int8, edge: int8, cost: float8, agg_cost: float8 } as const;
  function member199(arg0: NestedQuery<PgroutingCostEdges> | null, arg1: NestedQuery<PgroutingCombinations> | null) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dagshortestpath",
      member: "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.text)",
      arguments: [text, text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.text)", fields199),
      ),
    })(query0, query1);
  }

  Object.assign(member199, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.text)"]),
  });
  const rows199 = (alias: string, ...values: Parameters<typeof member199>) =>
    extensionRows(member199(...values), alias, fields199, "named");
  const fields200 = { node: int8, degree: int8 } as const;
  function member200(arg0: NestedQuery<PgroutingGraphEdges> | null, arg1?: ExtensionSqlInput<typeof bool>) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_degree",
      member: "routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.bool)",
      arguments: [text, defaultSqlArgument(bool, "dryrun")] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.bool)", fields200),
      ),
    })(query0, arg1);
  }

  Object.assign(member200, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.bool)"]),
  });
  const rows200 = (alias: string, ...values: Parameters<typeof member200>) =>
    extensionRows(member200(...values), alias, fields200, "named");
  const fields201 = { node: int8, degree: int8 } as const;
  function member201(
    arg0: NestedQuery<PgroutingGraphEdges> | null,
    arg1: NestedQuery<PgroutingDegreeVertices> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_degree",
      member: "routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
      arguments: [text, text, defaultSqlArgument(bool, "dryrun")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
          fields201,
        ),
      ),
    })(query0, query1, arg2);
  }

  Object.assign(member201, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    ]),
  });
  const rows201 = (alias: string, ...values: Parameters<typeof member201>) =>
    extensionRows(member201(...values), alias, fields201, "named");
  const fields202 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member202(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2?: ExtensionSqlInput<typeof bool>,
    arg3?: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_depthfirstsearch",
      member:
        "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)",
      arguments: [text, idsArray, defaultSqlArgument(bool, "directed"), defaultSqlArgument(int8, "max_depth")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)",
          fields202,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member202, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)",
    ]),
  });
  const rows202 = (alias: string, ...values: Parameters<typeof member202>) =>
    extensionRows(member202(...values), alias, fields202, "named");
  const fields203 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member203(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2?: ExtensionSqlInput<typeof bool>,
    arg3?: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_depthfirstsearch",
      member:
        "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)",
      arguments: [text, int8, defaultSqlArgument(bool, "directed"), defaultSqlArgument(int8, "max_depth")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)",
          fields203,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member203, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)",
    ]),
  });
  const rows203 = (alias: string, ...values: Parameters<typeof member203>) =>
    extensionRows(member203(...values), alias, fields203, "named");
  const fields204 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member204(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstra",
      member:
        "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, idsArray, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
          fields204,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member204, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows204 = (alias: string, ...values: Parameters<typeof member204>) =>
    extensionRows(member204(...values), alias, fields204, "named");
  const fields205 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member205(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstra",
      member:
        "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, idsArray, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
          fields205,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member205, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows205 = (alias: string, ...values: Parameters<typeof member205>) =>
    extensionRows(member205(...values), alias, fields205, "named");
  const fields206 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member206(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstra",
      member:
        "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, int8, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
          fields206,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member206, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows206 = (alias: string, ...values: Parameters<typeof member206>) =>
    extensionRows(member206(...values), alias, fields206, "named");
  const fields207 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member207(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstra",
      member:
        "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, int8, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
          fields207,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member207, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows207 = (alias: string, ...values: Parameters<typeof member207>) =>
    extensionRows(member207(...values), alias, fields207, "named");
  const fields208 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member208(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstra",
      member: "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
      arguments: [text, text, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
          fields208,
        ),
      ),
    })(query0, query1, arg2);
  }

  Object.assign(member208, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    ]),
  });
  const rows208 = (alias: string, ...values: Parameters<typeof member208>) =>
    extensionRows(member208(...values), alias, fields208, "named");
  const fields209 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member209(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstracost",
      member:
        "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, idsArray, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
          fields209,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member209, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows209 = (alias: string, ...values: Parameters<typeof member209>) =>
    extensionRows(member209(...values), alias, fields209, "named");
  const fields210 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member210(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstracost",
      member:
        "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, idsArray, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
          fields210,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member210, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows210 = (alias: string, ...values: Parameters<typeof member210>) =>
    extensionRows(member210(...values), alias, fields210, "named");
  const fields211 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member211(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstracost",
      member:
        "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, int8, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
          fields211,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member211, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows211 = (alias: string, ...values: Parameters<typeof member211>) =>
    extensionRows(member211(...values), alias, fields211, "named");
  const fields212 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member212(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstracost",
      member:
        "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, int8, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
          fields212,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member212, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows212 = (alias: string, ...values: Parameters<typeof member212>) =>
    extensionRows(member212(...values), alias, fields212, "named");
  const fields213 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member213(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstracost",
      member: "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
      arguments: [text, text, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
          fields213,
        ),
      ),
    })(query0, query1, arg2);
  }

  Object.assign(member213, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    ]),
  });
  const rows213 = (alias: string, ...values: Parameters<typeof member213>) =>
    extensionRows(member213(...values), alias, fields213, "named");
  const fields214 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member214(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstracostmatrix",
      member:
        "routine:$extension:pgrouting.pgr_dijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)",
          fields214,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member214, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows214 = (alias: string, ...values: Parameters<typeof member214>) =>
    extensionRows(member214(...values), alias, fields214, "named");
  const fields215 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member215(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int8>,
    arg5?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstranear",
      member:
        "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
      arguments: [
        text,
        idsArray,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int8, "cap"),
        defaultSqlArgument(bool, "global"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
          fields215,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member215, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows215 = (alias: string, ...values: Parameters<typeof member215>) =>
    extensionRows(member215(...values), alias, fields215, "named");
  const fields216 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member216(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstranear",
      member:
        "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)",
      arguments: [text, idsArray, int8, defaultSqlArgument(bool, "directed"), defaultSqlArgument(int8, "cap")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)",
          fields216,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4);
  }

  Object.assign(member216, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)",
    ]),
  });
  const rows216 = (alias: string, ...values: Parameters<typeof member216>) =>
    extensionRows(member216(...values), alias, fields216, "named");
  const fields217 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member217(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstranear",
      member:
        "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)",
      arguments: [text, int8, idsArray, defaultSqlArgument(bool, "directed"), defaultSqlArgument(int8, "cap")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)",
          fields217,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4);
  }

  Object.assign(member217, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)",
    ]),
  });
  const rows217 = (alias: string, ...values: Parameters<typeof member217>) =>
    extensionRows(member217(...values), alias, fields217, "named");
  const fields218 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member218(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
    arg3?: ExtensionSqlInput<typeof int8>,
    arg4?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstranear",
      member:
        "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
      arguments: [
        text,
        text,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int8, "cap"),
        defaultSqlArgument(bool, "global"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
          fields218,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4);
  }

  Object.assign(member218, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows218 = (alias: string, ...values: Parameters<typeof member218>) =>
    extensionRows(member218(...values), alias, fields218, "named");
  const fields219 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member219(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int8>,
    arg5?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstranearcost",
      member:
        "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
      arguments: [
        text,
        idsArray,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int8, "cap"),
        defaultSqlArgument(bool, "global"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
          fields219,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member219, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows219 = (alias: string, ...values: Parameters<typeof member219>) =>
    extensionRows(member219(...values), alias, fields219, "named");
  const fields220 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member220(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstranearcost",
      member:
        "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)",
      arguments: [text, idsArray, int8, defaultSqlArgument(bool, "directed"), defaultSqlArgument(int8, "cap")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)",
          fields220,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4);
  }

  Object.assign(member220, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)",
    ]),
  });
  const rows220 = (alias: string, ...values: Parameters<typeof member220>) =>
    extensionRows(member220(...values), alias, fields220, "named");
  const fields221 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member221(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstranearcost",
      member:
        "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)",
      arguments: [text, int8, idsArray, defaultSqlArgument(bool, "directed"), defaultSqlArgument(int8, "cap")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)",
          fields221,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4);
  }

  Object.assign(member221, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)",
    ]),
  });
  const rows221 = (alias: string, ...values: Parameters<typeof member221>) =>
    extensionRows(member221(...values), alias, fields221, "named");
  const fields222 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member222(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
    arg3?: ExtensionSqlInput<typeof int8>,
    arg4?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstranearcost",
      member:
        "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
      arguments: [
        text,
        text,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(int8, "cap"),
        defaultSqlArgument(bool, "global"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
          fields222,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4);
  }

  Object.assign(member222, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows222 = (alias: string, ...values: Parameters<typeof member222>) =>
    extensionRows(member222(...values), alias, fields222, "named");
  const fields223 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
    route_agg_cost: float8,
  } as const;
  function member223(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2?: ExtensionSqlInput<typeof bool>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_dijkstravia",
      member:
        "routine:$extension:pgrouting.pgr_dijkstravia(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "strict"),
        defaultSqlArgument(bool, "u_turn_on_edge"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_dijkstravia(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
          fields223,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4);
  }

  Object.assign(member223, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_dijkstravia(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows223 = (alias: string, ...values: Parameters<typeof member223>) =>
    extensionRows(member223(...values), alias, fields223, "named");
  const fields224 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member224(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof float8>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_drivingdistance",
      member:
        "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        idsArray,
        float8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "equicost"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)",
          fields224,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4);
  }

  Object.assign(member224, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows224 = (alias: string, ...values: Parameters<typeof member224>) =>
    extensionRows(member224(...values), alias, fields224, "named");
  const fields225 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member225(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof float8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_drivingdistance",
      member:
        "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool)",
      arguments: [text, int8, float8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool)",
          fields225,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member225, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool)",
    ]),
  });
  const rows225 = (alias: string, ...values: Parameters<typeof member225>) =>
    extensionRows(member225(...values), alias, fields225, "named");
  const fields226 = { edge_id: int8, color_id: int8 } as const;
  function member226(arg0: NestedQuery<PgroutingGraphEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edgecoloring",
      member: "routine:$extension:pgrouting.pgr_edgecoloring(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_edgecoloring(pg_catalog.text)", fields226),
      ),
    })(query0);
  }

  Object.assign(member226, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_edgecoloring(pg_catalog.text)"]),
  });
  const rows226 = (alias: string, ...values: Parameters<typeof member226>) =>
    extensionRows(member226(...values), alias, fields226, "named");
  const fields227 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member227(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edgedisjointpaths",
      member:
        "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, idsArray, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
          fields227,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member227, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows227 = (alias: string, ...values: Parameters<typeof member227>) =>
    extensionRows(member227(...values), alias, fields227, "named");
  const fields228 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member228(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edgedisjointpaths",
      member:
        "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, idsArray, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
          fields228,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member228, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows228 = (alias: string, ...values: Parameters<typeof member228>) =>
    extensionRows(member228(...values), alias, fields228, "named");
  const fields229 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member229(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edgedisjointpaths",
      member:
        "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, int8, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
          fields229,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member229, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows229 = (alias: string, ...values: Parameters<typeof member229>) =>
    extensionRows(member229(...values), alias, fields229, "named");
  const fields230 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member230(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edgedisjointpaths",
      member:
        "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, int8, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
          fields230,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member230, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows230 = (alias: string, ...values: Parameters<typeof member230>) =>
    extensionRows(member230(...values), alias, fields230, "named");
  const fields231 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member231(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edgedisjointpaths",
      member: "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
      arguments: [text, text, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
          fields231,
        ),
      ),
    })(query0, query1, arg2);
  }

  Object.assign(member231, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    ]),
  });
  const rows231 = (alias: string, ...values: Parameters<typeof member231>) =>
    extensionRows(member231(...values), alias, fields231, "named");
  const fields232 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member232(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edmondskarp",
      member: "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
      arguments: [text, idsArray, idsArray] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
          fields232,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member232, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
    ]),
  });
  const rows232 = (alias: string, ...values: Parameters<typeof member232>) =>
    extensionRows(member232(...values), alias, fields232, "named");
  const fields233 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member233(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edmondskarp",
      member: "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
      arguments: [text, idsArray, int8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
          fields233,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member233, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    ]),
  });
  const rows233 = (alias: string, ...values: Parameters<typeof member233>) =>
    extensionRows(member233(...values), alias, fields233, "named");
  const fields234 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member234(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edmondskarp",
      member: "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
      arguments: [text, int8, idsArray] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
          fields234,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member234, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
    ]),
  });
  const rows234 = (alias: string, ...values: Parameters<typeof member234>) =>
    extensionRows(member234(...values), alias, fields234, "named");
  const fields235 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member235(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edmondskarp",
      member: "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
      arguments: [text, int8, int8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
          fields235,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member235, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    ]),
  });
  const rows235 = (alias: string, ...values: Parameters<typeof member235>) =>
    extensionRows(member235(...values), alias, fields235, "named");
  const fields236 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member236(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edmondskarp",
      member: "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.text)",
      arguments: [text, text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.text)", fields236),
      ),
    })(query0, query1);
  }

  Object.assign(member236, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.text)"]),
  });
  const rows236 = (alias: string, ...values: Parameters<typeof member236>) =>
    extensionRows(member236(...values), alias, fields236, "named");
  const fields237 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member237(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edwardmoore",
      member:
        "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, idsArray, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
          fields237,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member237, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows237 = (alias: string, ...values: Parameters<typeof member237>) =>
    extensionRows(member237(...values), alias, fields237, "named");
  const fields238 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member238(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edwardmoore",
      member:
        "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, idsArray, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
          fields238,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member238, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows238 = (alias: string, ...values: Parameters<typeof member238>) =>
    extensionRows(member238(...values), alias, fields238, "named");
  const fields239 = {
    seq: int4,
    path_seq: int4,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member239(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edwardmoore",
      member:
        "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, int8, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
          fields239,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member239, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows239 = (alias: string, ...values: Parameters<typeof member239>) =>
    extensionRows(member239(...values), alias, fields239, "named");
  const fields240 = { seq: int4, path_seq: int4, node: int8, edge: int8, cost: float8, agg_cost: float8 } as const;
  function member240(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edwardmoore",
      member:
        "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, int8, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
          fields240,
        ),
      ),
    })(query0, arg1, arg2, arg3);
  }

  Object.assign(member240, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows240 = (alias: string, ...values: Parameters<typeof member240>) =>
    extensionRows(member240(...values), alias, fields240, "named");
  const fields241 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member241(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_edwardmoore",
      member: "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
      arguments: [text, text, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
          fields241,
        ),
      ),
    })(query0, query1, arg2);
  }

  Object.assign(member241, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    ]),
  });
  const rows241 = (alias: string, ...values: Parameters<typeof member241>) =>
    extensionRows(member241(...values), alias, fields241, "named");
  const fields242 = {
    id: int8,
    in_edges: int8Array,
    out_edges: int8Array,
    x: float8,
    y: float8,
    geom: geometry,
  } as const;
  function member242(arg0: NestedQuery<PgroutingVertexEdges> | null, arg1?: ExtensionSqlInput<typeof bool>) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_extractvertices",
      member: "routine:$extension:pgrouting.pgr_extractvertices(pg_catalog.text,pg_catalog.bool)",
      arguments: [text, defaultSqlArgument(bool, "dryrun")] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_extractvertices(pg_catalog.text,pg_catalog.bool)", fields242),
      ),
    })(query0, arg1);
  }

  Object.assign(member242, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_extractvertices(pg_catalog.text,pg_catalog.bool)"]),
  });
  const rows242 = (alias: string, ...values: Parameters<typeof member242>) =>
    extensionRows(member242(...values), alias, fields242, "named");
  const fields243 = {
    edge_id: int8,
    fraction: float8,
    side: bpchar,
    distance: float8,
    geom: geometry,
    edge: geometry,
  } as const;
  function member243(
    arg0: NestedQuery<PgroutingGeometryEdges> | null,
    arg1: ExtensionSqlInput<typeof geometryArray>,
    arg2: ExtensionSqlInput<typeof float8>,
    arg3: ExtensionSqlInput<typeof int4>,
    arg4: ExtensionSqlInput<typeof bool>,
    arg5: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_findcloseedges",
      member:
        "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
      arguments: [text, geometryArray, float8, int4, bool, bool] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
          fields243,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member243, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows243 = (alias: string, ...values: Parameters<typeof member243>) =>
    extensionRows(member243(...values), alias, fields243, "named");
  const fields244 = {
    edge_id: int8,
    fraction: float8,
    side: bpchar,
    distance: float8,
    geom: geometry,
    edge: geometry,
  } as const;
  function member244(
    arg0: NestedQuery<PgroutingGeometryEdges> | null,
    arg1: ExtensionSqlInput<typeof geometryArray>,
    arg2: ExtensionSqlInput<typeof float8>,
    arg3?: ExtensionSqlInput<typeof int4>,
    arg4?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_findcloseedges",
      member:
        "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
      arguments: [
        text,
        geometryArray,
        float8,
        defaultSqlArgument(int4, "cap"),
        defaultSqlArgument(bool, "dryrun"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
          fields244,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4);
  }

  Object.assign(member244, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
    ]),
  });
  const rows244 = (alias: string, ...values: Parameters<typeof member244>) =>
    extensionRows(member244(...values), alias, fields244, "named");
  const fields245 = {
    edge_id: int8,
    fraction: float8,
    side: bpchar,
    distance: float8,
    geom: geometry,
    edge: geometry,
  } as const;
  function member245(
    arg0: NestedQuery<PgroutingGeometryEdges> | null,
    arg1: ExtensionSqlInput<typeof geometry>,
    arg2: ExtensionSqlInput<typeof float8>,
    arg3: ExtensionSqlInput<typeof int4>,
    arg4: ExtensionSqlInput<typeof bool>,
    arg5: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_findcloseedges",
      member:
        "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
      arguments: [text, geometry, float8, int4, bool, bool] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
          fields245,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member245, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows245 = (alias: string, ...values: Parameters<typeof member245>) =>
    extensionRows(member245(...values), alias, fields245, "named");
  const fields246 = {
    edge_id: int8,
    fraction: float8,
    side: bpchar,
    distance: float8,
    geom: geometry,
    edge: geometry,
  } as const;
  function member246(
    arg0: NestedQuery<PgroutingGeometryEdges> | null,
    arg1: ExtensionSqlInput<typeof geometry>,
    arg2: ExtensionSqlInput<typeof float8>,
    arg3?: ExtensionSqlInput<typeof int4>,
    arg4?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_findcloseedges",
      member:
        "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
      arguments: [text, geometry, float8, defaultSqlArgument(int4, "cap"), defaultSqlArgument(bool, "dryrun")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
          fields246,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4);
  }

  Object.assign(member246, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
    ]),
  });
  const rows246 = (alias: string, ...values: Parameters<typeof member246>) =>
    extensionRows(member246(...values), alias, fields246, "named");
  const fields247 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member247(arg0: NestedQuery<PgroutingCostEdges> | null, arg1?: ExtensionSqlInput<typeof bool>) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_floydwarshall",
      member: "routine:$extension:pgrouting.pgr_floydwarshall(pg_catalog.text,pg_catalog.bool)",
      arguments: [text, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_floydwarshall(pg_catalog.text,pg_catalog.bool)", fields247),
      ),
    })(query0, arg1);
  }

  Object.assign(member247, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_floydwarshall(pg_catalog.text,pg_catalog.bool)"]),
  });
  const rows247 = (alias: string, ...values: Parameters<typeof member247>) =>
    extensionRows(member247(...values), alias, fields247, "named");
  const fields248 = {
    version: text,
    build_type: text,
    compile_date: text,
    library: text,
    system: text,
    postgresql: text,
    compiler: text,
    boost: text,
    hash: text,
  } as const;
  const member248 = createSqlFunction({
    ...base,
    dependencies: [],
    name: "pgr_full_version",
    member: "routine:$extension:pgrouting.pgr_full_version()",
    arguments: [] as const,
    result: nullableCodec(compositeCodec("routine:$extension:pgrouting.pgr_full_version()", fields248)),
  });
  const fields249 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member249(arg0: NestedQuery<PgroutingCostEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_hawickcircuits",
      member: "routine:$extension:pgrouting.pgr_hawickcircuits(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_hawickcircuits(pg_catalog.text)", fields249),
      ),
    })(query0);
  }

  Object.assign(member249, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_hawickcircuits(pg_catalog.text)"]),
  });
  const rows249 = (alias: string, ...values: Parameters<typeof member249>) =>
    extensionRows(member249(...values), alias, fields249, "named");
  function member250(arg0: NestedQuery<PgroutingGraphEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_isplanar",
      member: "routine:$extension:pgrouting.pgr_isplanar(pg_catalog.text)",
      arguments: [text] as const,
      result: bool,
    })(query0);
  }

  Object.assign(member250, { members: Object.freeze(["routine:$extension:pgrouting.pgr_isplanar(pg_catalog.text)"]) });
  const fields251 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member251(arg0: NestedQuery<PgroutingCostEdges> | null, arg1?: ExtensionSqlInput<typeof bool>) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_johnson",
      member: "routine:$extension:pgrouting.pgr_johnson(pg_catalog.text,pg_catalog.bool)",
      arguments: [text, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_johnson(pg_catalog.text,pg_catalog.bool)", fields251),
      ),
    })(query0, arg1);
  }

  Object.assign(member251, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_johnson(pg_catalog.text,pg_catalog.bool)"]),
  });
  const rows251 = (alias: string, ...values: Parameters<typeof member251>) =>
    extensionRows(member251(...values), alias, fields251, "named");
  const fields252 = { edge: int8, cost: float8 } as const;
  function member252(arg0: NestedQuery<PgroutingCostEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_kruskal",
      member: "routine:$extension:pgrouting.pgr_kruskal(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(compositeCodec("routine:$extension:pgrouting.pgr_kruskal(pg_catalog.text)", fields252)),
    })(query0);
  }

  Object.assign(member252, { members: Object.freeze(["routine:$extension:pgrouting.pgr_kruskal(pg_catalog.text)"]) });
  const rows252 = (alias: string, ...values: Parameters<typeof member252>) =>
    extensionRows(member252(...values), alias, fields252, "named");
  const fields253 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member253(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2?: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_kruskalbfs",
      member: "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
      arguments: [text, idsArray, defaultSqlArgument(int8, "max_depth")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
          fields253,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member253, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    ]),
  });
  const rows253 = (alias: string, ...values: Parameters<typeof member253>) =>
    extensionRows(member253(...values), alias, fields253, "named");
  const fields254 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member254(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2?: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_kruskalbfs",
      member: "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
      arguments: [text, int8, defaultSqlArgument(int8, "max_depth")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
          fields254,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member254, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    ]),
  });
  const rows254 = (alias: string, ...values: Parameters<typeof member254>) =>
    extensionRows(member254(...values), alias, fields254, "named");
  const fields255 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member255(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_kruskaldd",
      member: "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)",
      arguments: [text, idsArray, float8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)",
          fields255,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member255, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)",
    ]),
  });
  const rows255 = (alias: string, ...values: Parameters<typeof member255>) =>
    extensionRows(member255(...values), alias, fields255, "named");
  const fields256 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member256(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_kruskaldd",
      member: "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)",
      arguments: [text, idsArray, numeric] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)",
          fields256,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member256, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)",
    ]),
  });
  const rows256 = (alias: string, ...values: Parameters<typeof member256>) =>
    extensionRows(member256(...values), alias, fields256, "named");
  const fields257 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member257(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_kruskaldd",
      member: "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)",
      arguments: [text, int8, float8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)",
          fields257,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member257, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)",
    ]),
  });
  const rows257 = (alias: string, ...values: Parameters<typeof member257>) =>
    extensionRows(member257(...values), alias, fields257, "named");
  const fields258 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member258(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_kruskaldd",
      member: "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)",
      arguments: [text, int8, numeric] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)",
          fields258,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member258, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)",
    ]),
  });
  const rows258 = (alias: string, ...values: Parameters<typeof member258>) =>
    extensionRows(member258(...values), alias, fields258, "named");
  const fields259 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member259(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2?: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_kruskaldfs",
      member: "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
      arguments: [text, idsArray, defaultSqlArgument(int8, "max_depth")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
          fields259,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member259, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    ]),
  });
  const rows259 = (alias: string, ...values: Parameters<typeof member259>) =>
    extensionRows(member259(...values), alias, fields259, "named");
  const fields260 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member260(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2?: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_kruskaldfs",
      member: "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
      arguments: [text, int8, defaultSqlArgument(int8, "max_depth")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
          fields260,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member260, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    ]),
  });
  const rows260 = (alias: string, ...values: Parameters<typeof member260>) =>
    extensionRows(member260(...values), alias, fields260, "named");
  const fields261 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member261(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3: ExtensionSqlInput<typeof int4>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_ksp",
      member:
        "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        idsArray,
        idsArray,
        int4,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "heap_paths"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
          fields261,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member261, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows261 = (alias: string, ...values: Parameters<typeof member261>) =>
    extensionRows(member261(...values), alias, fields261, "named");
  const fields262 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member262(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3: ExtensionSqlInput<typeof int4>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_ksp",
      member:
        "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        idsArray,
        int8,
        int4,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "heap_paths"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
          fields262,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member262, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows262 = (alias: string, ...values: Parameters<typeof member262>) =>
    extensionRows(member262(...values), alias, fields262, "named");
  const fields263 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member263(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3: ExtensionSqlInput<typeof int4>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_ksp",
      member:
        "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        int8,
        idsArray,
        int4,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "heap_paths"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
          fields263,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member263, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows263 = (alias: string, ...values: Parameters<typeof member263>) =>
    extensionRows(member263(...values), alias, fields263, "named");
  const fields264 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member264(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3: ExtensionSqlInput<typeof int4>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_ksp",
      member:
        "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        int8,
        int8,
        int4,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "heap_paths"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
          fields264,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member264, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows264 = (alias: string, ...values: Parameters<typeof member264>) =>
    extensionRows(member264(...values), alias, fields264, "named");
  const fields265 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member265(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
    arg2: ExtensionSqlInput<typeof int4>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_ksp",
      member:
        "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        text,
        int4,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "heap_paths"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
          fields265,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4);
  }

  Object.assign(member265, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows265 = (alias: string, ...values: Parameters<typeof member265>) =>
    extensionRows(member265(...values), alias, fields265, "named");
  const fields266 = { seq: int4, vertex_id: int8, idom: int8 } as const;
  function member266(arg0: NestedQuery<PgroutingCostEdges> | null, arg1: ExtensionSqlInput<typeof int8>) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_lengauertarjandominatortree",
      member: "routine:$extension:pgrouting.pgr_lengauertarjandominatortree(pg_catalog.text,pg_catalog.int8)",
      arguments: [text, int8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_lengauertarjandominatortree(pg_catalog.text,pg_catalog.int8)",
          fields266,
        ),
      ),
    })(query0, arg1);
  }

  Object.assign(member266, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_lengauertarjandominatortree(pg_catalog.text,pg_catalog.int8)",
    ]),
  });
  const rows266 = (alias: string, ...values: Parameters<typeof member266>) =>
    extensionRows(member266(...values), alias, fields266, "named");
  const fields267 = { seq: int4, source: int8, target: int8, cost: float8, reverse_cost: float8 } as const;
  function member267(arg0: NestedQuery<PgroutingCostEdges> | null, arg1?: ExtensionSqlInput<typeof bool>) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_linegraph",
      member: "routine:$extension:pgrouting.pgr_linegraph(pg_catalog.text,pg_catalog.bool)",
      arguments: [text, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_linegraph(pg_catalog.text,pg_catalog.bool)", fields267),
      ),
    })(query0, arg1);
  }

  Object.assign(member267, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_linegraph(pg_catalog.text,pg_catalog.bool)"]),
  });
  const rows267 = (alias: string, ...values: Parameters<typeof member267>) =>
    extensionRows(member267(...values), alias, fields267, "named");
  const fields268 = { seq: int4, source: int8, target: int8, cost: float8, edge: int8 } as const;
  function member268(arg0: NestedQuery<PgroutingCostEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_linegraphfull",
      member: "routine:$extension:pgrouting.pgr_linegraphfull(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_linegraphfull(pg_catalog.text)", fields268),
      ),
    })(query0);
  }

  Object.assign(member268, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_linegraphfull(pg_catalog.text)"]),
  });
  const rows268 = (alias: string, ...values: Parameters<typeof member268>) =>
    extensionRows(member268(...values), alias, fields268, "named");
  const fields269 = { seq: int8, start_vid: int8, end_vid: int8 } as const;
  function member269(arg0: NestedQuery<PgroutingGraphEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_makeconnected",
      member: "routine:$extension:pgrouting.pgr_makeconnected(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_makeconnected(pg_catalog.text)", fields269),
      ),
    })(query0);
  }

  Object.assign(member269, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_makeconnected(pg_catalog.text)"]),
  });
  const rows269 = (alias: string, ...values: Parameters<typeof member269>) =>
    extensionRows(member269(...values), alias, fields269, "named");
  const fields270 = { seq: int4, edge: int8, source: int8, target: int8 } as const;
  function member270(arg0: NestedQuery<PgroutingGraphEdges> | null, arg1: ExtensionSqlInput<typeof bool>) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxcardinalitymatch",
      member: "routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text,pg_catalog.bool)",
      arguments: [text, bool] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text,pg_catalog.bool)",
          fields270,
        ),
      ),
    })(query0, arg1);
  }

  Object.assign(member270, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text,pg_catalog.bool)"]),
  });
  const rows270 = (alias: string, ...values: Parameters<typeof member270>) =>
    extensionRows(member270(...values), alias, fields270, "named");
  const fields271 = { edge: int8 } as const;
  function member271(arg0: NestedQuery<PgroutingGraphEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxcardinalitymatch",
      member: "routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text)",
      arguments: [text] as const,
      result: int8,
    })(query0);
  }

  Object.assign(member271, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text)"]),
  });
  const rows271 = (alias: string, ...values: Parameters<typeof member271>) =>
    extensionRows(member271(...values), alias, fields271, "named");
  function member272(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflow",
      member: "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
      arguments: [text, idsArray, idsArray] as const,
      result: int8,
    })(query0, arg1, arg2);
  }

  Object.assign(member272, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
    ]),
  });
  function member273(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflow",
      member: "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
      arguments: [text, idsArray, int8] as const,
      result: int8,
    })(query0, arg1, arg2);
  }

  Object.assign(member273, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    ]),
  });
  function member274(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflow",
      member: "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
      arguments: [text, int8, idsArray] as const,
      result: int8,
    })(query0, arg1, arg2);
  }

  Object.assign(member274, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
    ]),
  });
  function member275(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflow",
      member: "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
      arguments: [text, int8, int8] as const,
      result: int8,
    })(query0, arg1, arg2);
  }

  Object.assign(member275, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    ]),
  });
  function member276(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflow",
      member: "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.text)",
      arguments: [text, text] as const,
      result: int8,
    })(query0, query1);
  }

  Object.assign(member276, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.text)"]),
  });
  function member277(
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflowmincost_cost",
      member:
        "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
      arguments: [text, idsArray, idsArray] as const,
      result: float8,
    })(query0, arg1, arg2);
  }

  Object.assign(member277, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
    ]),
  });
  function member278(
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflowmincost_cost",
      member:
        "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
      arguments: [text, idsArray, int8] as const,
      result: float8,
    })(query0, arg1, arg2);
  }

  Object.assign(member278, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    ]),
  });
  function member279(
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflowmincost_cost",
      member:
        "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
      arguments: [text, int8, idsArray] as const,
      result: float8,
    })(query0, arg1, arg2);
  }

  Object.assign(member279, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
    ]),
  });
  function member280(
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflowmincost_cost",
      member: "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
      arguments: [text, int8, int8] as const,
      result: float8,
    })(query0, arg1, arg2);
  }

  Object.assign(member280, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    ]),
  });
  function member281(
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflowmincost_cost",
      member: "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.text)",
      arguments: [text, text] as const,
      result: float8,
    })(query0, query1);
  }

  Object.assign(member281, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.text)"]),
  });
  const fields282 = {
    seq: int4,
    edge: int8,
    source: int8,
    target: int8,
    flow: int8,
    residual_capacity: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member282(
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflowmincost",
      member:
        "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
      arguments: [text, idsArray, idsArray] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
          fields282,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member282, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
    ]),
  });
  const rows282 = (alias: string, ...values: Parameters<typeof member282>) =>
    extensionRows(member282(...values), alias, fields282, "named");
  const fields283 = {
    seq: int4,
    edge: int8,
    source: int8,
    target: int8,
    flow: int8,
    residual_capacity: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member283(
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflowmincost",
      member: "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
      arguments: [text, idsArray, int8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
          fields283,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member283, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    ]),
  });
  const rows283 = (alias: string, ...values: Parameters<typeof member283>) =>
    extensionRows(member283(...values), alias, fields283, "named");
  const fields284 = {
    seq: int4,
    edge: int8,
    source: int8,
    target: int8,
    flow: int8,
    residual_capacity: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member284(
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflowmincost",
      member: "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
      arguments: [text, int8, idsArray] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
          fields284,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member284, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
    ]),
  });
  const rows284 = (alias: string, ...values: Parameters<typeof member284>) =>
    extensionRows(member284(...values), alias, fields284, "named");
  const fields285 = {
    seq: int4,
    edge: int8,
    source: int8,
    target: int8,
    flow: int8,
    residual_capacity: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member285(
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflowmincost",
      member: "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
      arguments: [text, int8, int8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
          fields285,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member285, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    ]),
  });
  const rows285 = (alias: string, ...values: Parameters<typeof member285>) =>
    extensionRows(member285(...values), alias, fields285, "named");
  const fields286 = {
    seq: int4,
    edge: int8,
    source: int8,
    target: int8,
    flow: int8,
    residual_capacity: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member286(
    arg0: NestedQuery<PgroutingCapacityCostEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_maxflowmincost",
      member: "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.text)",
      arguments: [text, text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.text)", fields286),
      ),
    })(query0, query1);
  }

  Object.assign(member286, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.text)"]),
  });
  const rows286 = (alias: string, ...values: Parameters<typeof member286>) =>
    extensionRows(member286(...values), alias, fields286, "named");
  const fields288 = {
    seq: int4,
    vehicle_seq: int4,
    vehicle_id: int8,
    stop_seq: int4,
    stop_type: int4,
    stop_id: int8,
    order_id: int8,
    cargo: float8,
    travel_time: float8,
    arrival_time: float8,
    wait_time: float8,
    service_time: float8,
    departure_time: float8,
  } as const;
  function member288(
    arg0: NestedQuery<PgroutingOrders> | null,
    arg1: NestedQuery<PgroutingVehicles> | null,
    arg2: NestedQuery<PgroutingMatrix> | null,
    arg3?: ExtensionSqlInput<typeof float8>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof int4>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const query2 = managed(arg2);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
      ...(query2 ? (extensionExpressionContract(query2)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_pickdeliver",
      member:
        "routine:$extension:pgrouting.pgr_pickdeliver(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)",
      arguments: [
        text,
        text,
        text,
        defaultSqlArgument(float8, "factor"),
        defaultSqlArgument(int4, "max_cycles"),
        defaultSqlArgument(int4, "initial_sol"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_pickdeliver(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)",
          fields288,
        ),
      ),
    })(query0, query1, query2, arg3, arg4, arg5);
  }

  Object.assign(member288, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_pickdeliver(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)",
    ]),
  });
  const rows288 = (alias: string, ...values: Parameters<typeof member288>) =>
    extensionRows(member288(...values), alias, fields288, "named");
  const fields289 = {
    seq: int4,
    vehicle_seq: int4,
    vehicle_id: int8,
    stop_seq: int4,
    stop_type: int4,
    order_id: int8,
    cargo: float8,
    travel_time: float8,
    arrival_time: float8,
    wait_time: float8,
    service_time: float8,
    departure_time: float8,
  } as const;
  function member289(
    arg0: NestedQuery<PgroutingEuclideanOrders> | null,
    arg1: NestedQuery<PgroutingEuclideanVehicles> | null,
    arg2?: ExtensionSqlInput<typeof float8>,
    arg3?: ExtensionSqlInput<typeof int4>,
    arg4?: ExtensionSqlInput<typeof int4>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_pickdelivereuclidean",
      member:
        "routine:$extension:pgrouting.pgr_pickdelivereuclidean(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)",
      arguments: [
        text,
        text,
        defaultSqlArgument(float8, "factor"),
        defaultSqlArgument(int4, "max_cycles"),
        defaultSqlArgument(int4, "initial_sol"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_pickdelivereuclidean(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)",
          fields289,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4);
  }

  Object.assign(member289, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_pickdelivereuclidean(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)",
    ]),
  });
  const rows289 = (alias: string, ...values: Parameters<typeof member289>) =>
    extensionRows(member289(...values), alias, fields289, "named");
  const fields290 = { edge: int8, cost: float8 } as const;
  function member290(arg0: NestedQuery<PgroutingCostEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_prim",
      member: "routine:$extension:pgrouting.pgr_prim(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(compositeCodec("routine:$extension:pgrouting.pgr_prim(pg_catalog.text)", fields290)),
    })(query0);
  }

  Object.assign(member290, { members: Object.freeze(["routine:$extension:pgrouting.pgr_prim(pg_catalog.text)"]) });
  const rows290 = (alias: string, ...values: Parameters<typeof member290>) =>
    extensionRows(member290(...values), alias, fields290, "named");
  const fields291 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member291(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2?: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_primbfs",
      member: "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
      arguments: [text, idsArray, defaultSqlArgument(int8, "max_depth")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
          fields291,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member291, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    ]),
  });
  const rows291 = (alias: string, ...values: Parameters<typeof member291>) =>
    extensionRows(member291(...values), alias, fields291, "named");
  const fields292 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member292(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2?: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_primbfs",
      member: "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
      arguments: [text, int8, defaultSqlArgument(int8, "max_depth")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
          fields292,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member292, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    ]),
  });
  const rows292 = (alias: string, ...values: Parameters<typeof member292>) =>
    extensionRows(member292(...values), alias, fields292, "named");
  const fields293 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member293(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_primdd",
      member: "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)",
      arguments: [text, idsArray, float8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)",
          fields293,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member293, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)",
    ]),
  });
  const rows293 = (alias: string, ...values: Parameters<typeof member293>) =>
    extensionRows(member293(...values), alias, fields293, "named");
  const fields294 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member294(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_primdd",
      member: "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)",
      arguments: [text, idsArray, numeric] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)",
          fields294,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member294, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)",
    ]),
  });
  const rows294 = (alias: string, ...values: Parameters<typeof member294>) =>
    extensionRows(member294(...values), alias, fields294, "named");
  const fields295 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member295(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof float8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_primdd",
      member: "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)",
      arguments: [text, int8, float8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)",
          fields295,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member295, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)",
    ]),
  });
  const rows295 = (alias: string, ...values: Parameters<typeof member295>) =>
    extensionRows(member295(...values), alias, fields295, "named");
  const fields296 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member296(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof numeric>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_primdd",
      member: "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)",
      arguments: [text, int8, numeric] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)",
          fields296,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member296, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)",
    ]),
  });
  const rows296 = (alias: string, ...values: Parameters<typeof member296>) =>
    extensionRows(member296(...values), alias, fields296, "named");
  const fields297 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member297(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2?: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_primdfs",
      member: "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
      arguments: [text, idsArray, defaultSqlArgument(int8, "max_depth")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
          fields297,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member297, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    ]),
  });
  const rows297 = (alias: string, ...values: Parameters<typeof member297>) =>
    extensionRows(member297(...values), alias, fields297, "named");
  const fields298 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member298(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2?: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_primdfs",
      member: "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
      arguments: [text, int8, defaultSqlArgument(int8, "max_depth")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
          fields298,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member298, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    ]),
  });
  const rows298 = (alias: string, ...values: Parameters<typeof member298>) =>
    extensionRows(member298(...values), alias, fields298, "named");
  const fields299 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member299(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof idsArray>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_pushrelabel",
      member: "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
      arguments: [text, idsArray, idsArray] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
          fields299,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member299, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
    ]),
  });
  const rows299 = (alias: string, ...values: Parameters<typeof member299>) =>
    extensionRows(member299(...values), alias, fields299, "named");
  const fields300 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member300(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_pushrelabel",
      member: "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
      arguments: [text, idsArray, int8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
          fields300,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member300, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    ]),
  });
  const rows300 = (alias: string, ...values: Parameters<typeof member300>) =>
    extensionRows(member300(...values), alias, fields300, "named");
  const fields301 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member301(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof idsArray>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_pushrelabel",
      member: "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
      arguments: [text, int8, idsArray] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
          fields301,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member301, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
    ]),
  });
  const rows301 = (alias: string, ...values: Parameters<typeof member301>) =>
    extensionRows(member301(...values), alias, fields301, "named");
  const fields302 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member302(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: ExtensionSqlInput<typeof int8>,
    arg2: ExtensionSqlInput<typeof int8>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_pushrelabel",
      member: "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
      arguments: [text, int8, int8] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
          fields302,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member302, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    ]),
  });
  const rows302 = (alias: string, ...values: Parameters<typeof member302>) =>
    extensionRows(member302(...values), alias, fields302, "named");
  const fields303 = {
    seq: int4,
    edge: int8,
    start_vid: int8,
    end_vid: int8,
    flow: int8,
    residual_capacity: int8,
  } as const;
  function member303(
    arg0: NestedQuery<PgroutingCapacityEdges> | null,
    arg1: NestedQuery<PgroutingCombinations> | null,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_pushrelabel",
      member: "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.text)",
      arguments: [text, text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.text)", fields303),
      ),
    })(query0, query1);
  }

  Object.assign(member303, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.text)"]),
  });
  const rows303 = (alias: string, ...values: Parameters<typeof member303>) =>
    extensionRows(member303(...values), alias, fields303, "named");
  const fields304 = { seq: int4, id: int8, sub_id: int4, geom: geometry } as const;
  function member304(
    arg0: NestedQuery<PgroutingGeometryEdges> | null,
    arg1?: ExtensionSqlInput<typeof float8>,
    arg2?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_separatecrossing",
      member: "routine:$extension:pgrouting.pgr_separatecrossing(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)",
      arguments: [text, defaultSqlArgument(float8, "tolerance"), defaultSqlArgument(bool, "dryrun")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_separatecrossing(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)",
          fields304,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member304, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_separatecrossing(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)",
    ]),
  });
  const rows304 = (alias: string, ...values: Parameters<typeof member304>) =>
    extensionRows(member304(...values), alias, fields304, "named");
  const fields305 = { seq: int4, id: int8, sub_id: int4, geom: geometry } as const;
  function member305(
    arg0: NestedQuery<PgroutingGeometryEdges> | null,
    arg1?: ExtensionSqlInput<typeof float8>,
    arg2?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_separatetouching",
      member: "routine:$extension:pgrouting.pgr_separatetouching(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)",
      arguments: [text, defaultSqlArgument(float8, "tolerance"), defaultSqlArgument(bool, "dryrun")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_separatetouching(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)",
          fields305,
        ),
      ),
    })(query0, arg1, arg2);
  }

  Object.assign(member305, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_separatetouching(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)",
    ]),
  });
  const rows305 = (alias: string, ...values: Parameters<typeof member305>) =>
    extensionRows(member305(...values), alias, fields305, "named");
  const fields306 = { vertex_id: int8, color_id: int8 } as const;
  function member306(arg0: NestedQuery<PgroutingGraphEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_sequentialvertexcoloring",
      member: "routine:$extension:pgrouting.pgr_sequentialvertexcoloring(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_sequentialvertexcoloring(pg_catalog.text)", fields306),
      ),
    })(query0);
  }

  Object.assign(member306, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_sequentialvertexcoloring(pg_catalog.text)"]),
  });
  const rows306 = (alias: string, ...values: Parameters<typeof member306>) =>
    extensionRows(member306(...values), alias, fields306, "named");
  const fields307 = { seq: int4, edge: int8, cost: float8, mincut: float8 } as const;
  function member307(arg0: NestedQuery<PgroutingCapacityEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_stoerwagner",
      member: "routine:$extension:pgrouting.pgr_stoerwagner(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(compositeCodec("routine:$extension:pgrouting.pgr_stoerwagner(pg_catalog.text)", fields307)),
    })(query0);
  }

  Object.assign(member307, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_stoerwagner(pg_catalog.text)"]),
  });
  const rows307 = (alias: string, ...values: Parameters<typeof member307>) =>
    extensionRows(member307(...values), alias, fields307, "named");
  const fields308 = { seq: int8, component: int8, node: int8 } as const;
  function member308(arg0: NestedQuery<PgroutingGraphEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_strongcomponents",
      member: "routine:$extension:pgrouting.pgr_strongcomponents(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_strongcomponents(pg_catalog.text)", fields308),
      ),
    })(query0);
  }

  Object.assign(member308, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_strongcomponents(pg_catalog.text)"]),
  });
  const rows308 = (alias: string, ...values: Parameters<typeof member308>) =>
    extensionRows(member308(...values), alias, fields308, "named");
  const fields309 = { seq: int4, sorted_v: int8 } as const;
  function member309(arg0: NestedQuery<PgroutingGraphEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_topologicalsort",
      member: "routine:$extension:pgrouting.pgr_topologicalsort(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_topologicalsort(pg_catalog.text)", fields309),
      ),
    })(query0);
  }

  Object.assign(member309, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_topologicalsort(pg_catalog.text)"]),
  });
  const rows309 = (alias: string, ...values: Parameters<typeof member309>) =>
    extensionRows(member309(...values), alias, fields309, "named");
  const fields310 = { seq: int4, vid: int8, target_array: int8Array } as const;
  function member310(arg0: NestedQuery<PgroutingGraphEdges> | null) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_transitiveclosure",
      member: "routine:$extension:pgrouting.pgr_transitiveclosure(pg_catalog.text)",
      arguments: [text] as const,
      result: nullableCodec(
        compositeCodec("routine:$extension:pgrouting.pgr_transitiveclosure(pg_catalog.text)", fields310),
      ),
    })(query0);
  }

  Object.assign(member310, {
    members: Object.freeze(["routine:$extension:pgrouting.pgr_transitiveclosure(pg_catalog.text)"]),
  });
  const rows310 = (alias: string, ...values: Parameters<typeof member310>) =>
    extensionRows(member310(...values), alias, fields310, "named");
  const fields311 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member311(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: NestedQuery<PgroutingPoints> | null,
    arg3: ExtensionSqlInput<typeof idsArray>,
    arg4: ExtensionSqlInput<typeof idsArray>,
    arg5?: ExtensionSqlInput<typeof bool>,
    arg6?: ExtensionSqlInput<typeof bpchar>,
    arg7?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const query2 = managed(arg2);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
      ...(query2 ? (extensionExpressionContract(query2)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trsp_withpoints",
      member:
        "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
      arguments: [
        text,
        text,
        text,
        idsArray,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
          fields311,
        ),
      ),
    })(query0, query1, query2, arg3, arg4, arg5, arg6, arg7);
  }

  Object.assign(member311, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    ]),
  });
  const rows311 = (alias: string, ...values: Parameters<typeof member311>) =>
    extensionRows(member311(...values), alias, fields311, "named");
  const fields312 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member312(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: NestedQuery<PgroutingPoints> | null,
    arg3: ExtensionSqlInput<typeof idsArray>,
    arg4: ExtensionSqlInput<typeof int8>,
    arg5?: ExtensionSqlInput<typeof bool>,
    arg6?: ExtensionSqlInput<typeof bpchar>,
    arg7?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const query2 = managed(arg2);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
      ...(query2 ? (extensionExpressionContract(query2)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trsp_withpoints",
      member:
        "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
      arguments: [
        text,
        text,
        text,
        idsArray,
        int8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
          fields312,
        ),
      ),
    })(query0, query1, query2, arg3, arg4, arg5, arg6, arg7);
  }

  Object.assign(member312, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    ]),
  });
  const rows312 = (alias: string, ...values: Parameters<typeof member312>) =>
    extensionRows(member312(...values), alias, fields312, "named");
  const fields313 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member313(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: NestedQuery<PgroutingPoints> | null,
    arg3: ExtensionSqlInput<typeof int8>,
    arg4: ExtensionSqlInput<typeof idsArray>,
    arg5?: ExtensionSqlInput<typeof bool>,
    arg6?: ExtensionSqlInput<typeof bpchar>,
    arg7?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const query2 = managed(arg2);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
      ...(query2 ? (extensionExpressionContract(query2)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trsp_withpoints",
      member:
        "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
      arguments: [
        text,
        text,
        text,
        int8,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
          fields313,
        ),
      ),
    })(query0, query1, query2, arg3, arg4, arg5, arg6, arg7);
  }

  Object.assign(member313, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    ]),
  });
  const rows313 = (alias: string, ...values: Parameters<typeof member313>) =>
    extensionRows(member313(...values), alias, fields313, "named");
  const fields314 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member314(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: NestedQuery<PgroutingPoints> | null,
    arg3: ExtensionSqlInput<typeof int8>,
    arg4: ExtensionSqlInput<typeof int8>,
    arg5?: ExtensionSqlInput<typeof bool>,
    arg6?: ExtensionSqlInput<typeof bpchar>,
    arg7?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const query2 = managed(arg2);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
      ...(query2 ? (extensionExpressionContract(query2)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trsp_withpoints",
      member:
        "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
      arguments: [
        text,
        text,
        text,
        int8,
        int8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
          fields314,
        ),
      ),
    })(query0, query1, query2, arg3, arg4, arg5, arg6, arg7);
  }

  Object.assign(member314, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    ]),
  });
  const rows314 = (alias: string, ...values: Parameters<typeof member314>) =>
    extensionRows(member314(...values), alias, fields314, "named");
  const fields315 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member315(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: NestedQuery<PgroutingPoints> | null,
    arg3: NestedQuery<PgroutingCombinations> | null,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bpchar>,
    arg6?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const query2 = managed(arg2);
    const query3 = managed(arg3);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
      ...(query2 ? (extensionExpressionContract(query2)?.dependencies ?? []) : []),
      ...(query3 ? (extensionExpressionContract(query3)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trsp_withpoints",
      member:
        "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
      arguments: [
        text,
        text,
        text,
        text,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
          fields315,
        ),
      ),
    })(query0, query1, query2, query3, arg4, arg5, arg6);
  }

  Object.assign(member315, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    ]),
  });
  const rows315 = (alias: string, ...values: Parameters<typeof member315>) =>
    extensionRows(member315(...values), alias, fields315, "named");
  const fields316 = { seq: int4, id1: int4, id2: int4, cost: float8 } as const;
  function member316(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int4>,
    arg2: ExtensionSqlInput<typeof float8>,
    arg3: ExtensionSqlInput<typeof int4>,
    arg4: ExtensionSqlInput<typeof float8>,
    arg5: ExtensionSqlInput<typeof bool>,
    arg6: ExtensionSqlInput<typeof bool>,
    arg7?: NestedQuery<PgroutingLegacyRestrictions> | null,
  ) {
    const query0 = managed(arg0);
    const query7 = managed(arg7);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query7 ? (extensionExpressionContract(query7)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trsp",
      member:
        "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
      arguments: [text, int4, float8, int4, float8, bool, bool, defaultSqlArgument(text, "turn_restrict_sql")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
          fields316,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6, query7);
  }

  Object.assign(member316, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
    ]),
  });
  const rows316 = (alias: string, ...values: Parameters<typeof member316>) =>
    extensionRows(member316(...values), alias, fields316, "named");
  const fields317 = { seq: int4, id1: int4, id2: int4, cost: float8 } as const;
  function member317(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int4>,
    arg2: ExtensionSqlInput<typeof int4>,
    arg3: ExtensionSqlInput<typeof bool>,
    arg4: ExtensionSqlInput<typeof bool>,
    arg5?: NestedQuery<PgroutingLegacyRestrictions> | null,
  ) {
    const query0 = managed(arg0);
    const query5 = managed(arg5);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query5 ? (extensionExpressionContract(query5)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trsp",
      member:
        "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
      arguments: [text, int4, int4, bool, bool, defaultSqlArgument(text, "restrictions_sql")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
          fields317,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, query5);
  }

  Object.assign(member317, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
    ]),
  });
  const rows317 = (alias: string, ...values: Parameters<typeof member317>) =>
    extensionRows(member317(...values), alias, fields317, "named");
  const fields318 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member318(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3: ExtensionSqlInput<typeof idsArray>,
    arg4?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trsp",
      member:
        "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, text, idsArray, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
          fields318,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4);
  }

  Object.assign(member318, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows318 = (alias: string, ...values: Parameters<typeof member318>) =>
    extensionRows(member318(...values), alias, fields318, "named");
  const fields319 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member319(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3: ExtensionSqlInput<typeof int8>,
    arg4?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trsp",
      member:
        "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, text, idsArray, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
          fields319,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4);
  }

  Object.assign(member319, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows319 = (alias: string, ...values: Parameters<typeof member319>) =>
    extensionRows(member319(...values), alias, fields319, "named");
  const fields320 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member320(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3: ExtensionSqlInput<typeof idsArray>,
    arg4?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trsp",
      member:
        "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
      arguments: [text, text, int8, idsArray, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
          fields320,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4);
  }

  Object.assign(member320, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    ]),
  });
  const rows320 = (alias: string, ...values: Parameters<typeof member320>) =>
    extensionRows(member320(...values), alias, fields320, "named");
  const fields321 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member321(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3: ExtensionSqlInput<typeof int8>,
    arg4?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trsp",
      member:
        "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
      arguments: [text, text, int8, int8, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
          fields321,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4);
  }

  Object.assign(member321, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    ]),
  });
  const rows321 = (alias: string, ...values: Parameters<typeof member321>) =>
    extensionRows(member321(...values), alias, fields321, "named");
  const fields322 = {
    seq: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member322(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: NestedQuery<PgroutingCombinations> | null,
    arg3?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const query2 = managed(arg2);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
      ...(query2 ? (extensionExpressionContract(query2)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trsp",
      member: "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
      arguments: [text, text, text, defaultSqlArgument(bool, "directed")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
          fields322,
        ),
      ),
    })(query0, query1, query2, arg3);
  }

  Object.assign(member322, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    ]),
  });
  const rows322 = (alias: string, ...values: Parameters<typeof member322>) =>
    extensionRows(member322(...values), alias, fields322, "named");
  const fields323 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
    route_agg_cost: float8,
  } as const;
  function member323(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: NestedQuery<PgroutingPoints> | null,
    arg3: ExtensionSqlInput<typeof idsArray>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bool>,
    arg6?: ExtensionSqlInput<typeof bool>,
    arg7?: ExtensionSqlInput<typeof bpchar>,
    arg8?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const query2 = managed(arg2);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
      ...(query2 ? (extensionExpressionContract(query2)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trspvia_withpoints",
      member:
        "routine:$extension:pgrouting.pgr_trspvia_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
      arguments: [
        text,
        text,
        text,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "strict"),
        defaultSqlArgument(bool, "u_turn_on_edge"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trspvia_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
          fields323,
        ),
      ),
    })(query0, query1, query2, arg3, arg4, arg5, arg6, arg7, arg8);
  }

  Object.assign(member323, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trspvia_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    ]),
  });
  const rows323 = (alias: string, ...values: Parameters<typeof member323>) =>
    extensionRows(member323(...values), alias, fields323, "named");
  const fields324 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
    route_agg_cost: float8,
  } as const;
  function member324(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trspvia",
      member:
        "routine:$extension:pgrouting.pgr_trspvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        text,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "strict"),
        defaultSqlArgument(bool, "u_turn_on_edge"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trspvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
          fields324,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member324, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trspvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows324 = (alias: string, ...values: Parameters<typeof member324>) =>
    extensionRows(member324(...values), alias, fields324, "named");
  const fields325 = { seq: int4, id1: int4, id2: int4, id3: int4, cost: float8 } as const;
  function member325(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof int4Array>,
    arg2: ExtensionSqlInput<typeof float8Array>,
    arg3: ExtensionSqlInput<typeof bool>,
    arg4: ExtensionSqlInput<typeof bool>,
    arg5?: NestedQuery<PgroutingLegacyRestrictions> | null,
  ) {
    const query0 = managed(arg0);
    const query5 = managed(arg5);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query5 ? (extensionExpressionContract(query5)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trspviaedges",
      member:
        "routine:$extension:pgrouting.pgr_trspviaedges(pg_catalog.text,pg_catalog._int4,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
      arguments: [text, int4Array, float8Array, bool, bool, defaultSqlArgument(text, "turn_restrict_sql")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trspviaedges(pg_catalog.text,pg_catalog._int4,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
          fields325,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, query5);
  }

  Object.assign(member325, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trspviaedges(pg_catalog.text,pg_catalog._int4,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
    ]),
  });
  const rows325 = (alias: string, ...values: Parameters<typeof member325>) =>
    extensionRows(member325(...values), alias, fields325, "named");
  const fields326 = { seq: int4, id1: int4, id2: int4, id3: int4, cost: float8 } as const;
  function member326(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: ExtensionSqlInput<typeof idsArray>,
    arg2: ExtensionSqlInput<typeof bool>,
    arg3: ExtensionSqlInput<typeof bool>,
    arg4?: NestedQuery<PgroutingLegacyRestrictions> | null,
  ) {
    const query0 = managed(arg0);
    const query4 = managed(arg4);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query4 ? (extensionExpressionContract(query4)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_trspviavertices",
      member:
        "routine:$extension:pgrouting.pgr_trspviavertices(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
      arguments: [text, idsArray, bool, bool, defaultSqlArgument(text, "restrictions_sql")] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_trspviavertices(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
          fields326,
        ),
      ),
    })(query0, arg1, arg2, arg3, query4);
  }

  Object.assign(member326, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_trspviavertices(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
    ]),
  });
  const rows326 = (alias: string, ...values: Parameters<typeof member326>) =>
    extensionRows(member326(...values), alias, fields326, "named");
  const fields327 = { seq: int4, node: int8, cost: float8, agg_cost: float8 } as const;
  function member327(
    arg0: NestedQuery<PgroutingMatrix> | null,
    arg1?: ExtensionSqlInput<typeof int8>,
    arg2?: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof float8>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof int4>,
    arg6?: ExtensionSqlInput<typeof int4>,
    arg7?: ExtensionSqlInput<typeof float8>,
    arg8?: ExtensionSqlInput<typeof float8>,
    arg9?: ExtensionSqlInput<typeof float8>,
    arg10?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_tsp",
      member:
        "routine:$extension:pgrouting.pgr_tsp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
      arguments: [
        text,
        defaultSqlArgument(int8, "start_id"),
        defaultSqlArgument(int8, "end_id"),
        defaultSqlArgument(float8, "max_processing_time"),
        defaultSqlArgument(int4, "tries_per_temperature"),
        defaultSqlArgument(int4, "max_changes_per_temperature"),
        defaultSqlArgument(int4, "max_consecutive_non_changes"),
        defaultSqlArgument(float8, "initial_temperature"),
        defaultSqlArgument(float8, "final_temperature"),
        defaultSqlArgument(float8, "cooling_factor"),
        defaultSqlArgument(bool, "randomize"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_tsp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
          fields327,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
  }

  Object.assign(member327, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_tsp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    ]),
  });
  const rows327 = (alias: string, ...values: Parameters<typeof member327>) =>
    extensionRows(member327(...values), alias, fields327, "named");
  const fields328 = { seq: int4, node: int8, cost: float8, agg_cost: float8 } as const;
  function member328(
    arg0: NestedQuery<PgroutingCoordinates> | null,
    arg1?: ExtensionSqlInput<typeof int8>,
    arg2?: ExtensionSqlInput<typeof int8>,
    arg3?: ExtensionSqlInput<typeof float8>,
    arg4?: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof int4>,
    arg6?: ExtensionSqlInput<typeof int4>,
    arg7?: ExtensionSqlInput<typeof float8>,
    arg8?: ExtensionSqlInput<typeof float8>,
    arg9?: ExtensionSqlInput<typeof float8>,
    arg10?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const dependencies = [...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : [])];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_tspeuclidean",
      member:
        "routine:$extension:pgrouting.pgr_tspeuclidean(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
      arguments: [
        text,
        defaultSqlArgument(int8, "start_id"),
        defaultSqlArgument(int8, "end_id"),
        defaultSqlArgument(float8, "max_processing_time"),
        defaultSqlArgument(int4, "tries_per_temperature"),
        defaultSqlArgument(int4, "max_changes_per_temperature"),
        defaultSqlArgument(int4, "max_consecutive_non_changes"),
        defaultSqlArgument(float8, "initial_temperature"),
        defaultSqlArgument(float8, "final_temperature"),
        defaultSqlArgument(float8, "cooling_factor"),
        defaultSqlArgument(bool, "randomize"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_tspeuclidean(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
          fields328,
        ),
      ),
    })(query0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
  }

  Object.assign(member328, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_tspeuclidean(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    ]),
  });
  const rows328 = (alias: string, ...values: Parameters<typeof member328>) =>
    extensionRows(member328(...values), alias, fields328, "named");
  const fields329 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member329(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingRestrictions> | null,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3: ExtensionSqlInput<typeof int8>,
    arg4: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof bool>,
    arg6?: ExtensionSqlInput<typeof bool>,
    arg7?: ExtensionSqlInput<typeof bool>,
    arg8?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_turnrestrictedpath",
      member:
        "routine:$extension:pgrouting.pgr_turnrestrictedpath(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        text,
        int8,
        int8,
        int4,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "heap_paths"),
        defaultSqlArgument(bool, "stop_on_first"),
        defaultSqlArgument(bool, "strict"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_turnrestrictedpath(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
          fields329,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
  }

  Object.assign(member329, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_turnrestrictedpath(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows329 = (alias: string, ...values: Parameters<typeof member329>) =>
    extensionRows(member329(...values), alias, fields329, "named");
  const member330 = createSqlFunction({
    ...base,
    dependencies: [],
    name: "pgr_version",
    member: "routine:$extension:pgrouting.pgr_version()",
    arguments: [] as const,
    result: text,
  });
  const fields331 = { oid: int4, opos: int4, vid: int4, tarrival: int4, tdepart: int4 } as const;
  function member331(
    arg0: NestedQuery<PgroutingVrpOrders> | null,
    arg1: NestedQuery<PgroutingVrpVehicles> | null,
    arg2: NestedQuery<PgroutingVrpMatrix> | null,
    arg3: ExtensionSqlInput<typeof int4>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const query2 = managed(arg2);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
      ...(query2 ? (extensionExpressionContract(query2)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_vrponedepot",
      member:
        "routine:$extension:pgrouting.pgr_vrponedepot(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
      arguments: [text, text, text, int4] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_vrponedepot(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
          fields331,
        ),
      ),
    })(query0, query1, query2, arg3);
  }

  Object.assign(member331, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_vrponedepot(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
    ]),
  });
  const rows331 = (alias: string, ...values: Parameters<typeof member331>) =>
    extensionRows(member331(...values), alias, fields331, "named");
  const fields332 = {
    seq: int4,
    path_seq: int4,
    start_pid: int8,
    end_pid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member332(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3: ExtensionSqlInput<typeof idsArray>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bpchar>,
    arg6?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpoints",
      member:
        "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
      arguments: [
        text,
        text,
        idsArray,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
          fields332,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member332, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    ]),
  });
  const rows332 = (alias: string, ...values: Parameters<typeof member332>) =>
    extensionRows(member332(...values), alias, fields332, "named");
  const fields333 = {
    seq: int4,
    path_seq: int4,
    start_pid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member333(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3: ExtensionSqlInput<typeof int8>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bpchar>,
    arg6?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpoints",
      member:
        "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
      arguments: [
        text,
        text,
        idsArray,
        int8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
          fields333,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member333, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    ]),
  });
  const rows333 = (alias: string, ...values: Parameters<typeof member333>) =>
    extensionRows(member333(...values), alias, fields333, "named");
  const fields334 = {
    seq: int4,
    path_seq: int4,
    end_pid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member334(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3: ExtensionSqlInput<typeof idsArray>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bpchar>,
    arg6?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpoints",
      member:
        "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
      arguments: [
        text,
        text,
        int8,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
          fields334,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member334, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    ]),
  });
  const rows334 = (alias: string, ...values: Parameters<typeof member334>) =>
    extensionRows(member334(...values), alias, fields334, "named");
  const fields335 = { seq: int4, path_seq: int4, node: int8, edge: int8, cost: float8, agg_cost: float8 } as const;
  function member335(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3: ExtensionSqlInput<typeof int8>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bpchar>,
    arg6?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpoints",
      member:
        "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
      arguments: [
        text,
        text,
        int8,
        int8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
          fields335,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member335, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    ]),
  });
  const rows335 = (alias: string, ...values: Parameters<typeof member335>) =>
    extensionRows(member335(...values), alias, fields335, "named");
  const fields336 = {
    seq: int4,
    path_seq: int4,
    start_pid: int8,
    end_pid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member336(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: NestedQuery<PgroutingCombinations> | null,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof bpchar>,
    arg5?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const query2 = managed(arg2);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
      ...(query2 ? (extensionExpressionContract(query2)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpoints",
      member:
        "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
      arguments: [
        text,
        text,
        text,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
          fields336,
        ),
      ),
    })(query0, query1, query2, arg3, arg4, arg5);
  }

  Object.assign(member336, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    ]),
  });
  const rows336 = (alias: string, ...values: Parameters<typeof member336>) =>
    extensionRows(member336(...values), alias, fields336, "named");
  const fields337 = { start_pid: int8, end_pid: int8, agg_cost: float8 } as const;
  function member337(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3: ExtensionSqlInput<typeof idsArray>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bpchar>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointscost",
      member:
        "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)",
      arguments: [
        text,
        text,
        idsArray,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)",
          fields337,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member337, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)",
    ]),
  });
  const rows337 = (alias: string, ...values: Parameters<typeof member337>) =>
    extensionRows(member337(...values), alias, fields337, "named");
  const fields338 = { start_pid: int8, end_pid: int8, agg_cost: float8 } as const;
  function member338(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3: ExtensionSqlInput<typeof int8>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bpchar>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointscost",
      member:
        "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)",
      arguments: [
        text,
        text,
        idsArray,
        int8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)",
          fields338,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member338, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)",
    ]),
  });
  const rows338 = (alias: string, ...values: Parameters<typeof member338>) =>
    extensionRows(member338(...values), alias, fields338, "named");
  const fields339 = { start_pid: int8, end_pid: int8, agg_cost: float8 } as const;
  function member339(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3: ExtensionSqlInput<typeof idsArray>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bpchar>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointscost",
      member:
        "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)",
      arguments: [
        text,
        text,
        int8,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)",
          fields339,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member339, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)",
    ]),
  });
  const rows339 = (alias: string, ...values: Parameters<typeof member339>) =>
    extensionRows(member339(...values), alias, fields339, "named");
  const fields340 = { start_pid: int8, end_pid: int8, agg_cost: float8 } as const;
  function member340(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3: ExtensionSqlInput<typeof int8>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bpchar>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointscost",
      member:
        "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)",
      arguments: [
        text,
        text,
        int8,
        int8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)",
          fields340,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5);
  }

  Object.assign(member340, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)",
    ]),
  });
  const rows340 = (alias: string, ...values: Parameters<typeof member340>) =>
    extensionRows(member340(...values), alias, fields340, "named");
  const fields341 = { start_pid: int8, end_pid: int8, agg_cost: float8 } as const;
  function member341(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: NestedQuery<PgroutingCombinations> | null,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof bpchar>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const query2 = managed(arg2);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
      ...(query2 ? (extensionExpressionContract(query2)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointscost",
      member:
        "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar)",
      arguments: [
        text,
        text,
        text,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar)",
          fields341,
        ),
      ),
    })(query0, query1, query2, arg3, arg4);
  }

  Object.assign(member341, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar)",
    ]),
  });
  const rows341 = (alias: string, ...values: Parameters<typeof member341>) =>
    extensionRows(member341(...values), alias, fields341, "named");
  const fields342 = { start_vid: int8, end_vid: int8, agg_cost: float8 } as const;
  function member342(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof bpchar>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointscostmatrix",
      member:
        "routine:$extension:pgrouting.pgr_withpointscostmatrix(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)",
      arguments: [
        text,
        text,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointscostmatrix(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)",
          fields342,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4);
  }

  Object.assign(member342, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointscostmatrix(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)",
    ]),
  });
  const rows342 = (alias: string, ...values: Parameters<typeof member342>) =>
    extensionRows(member342(...values), alias, fields342, "named");
  const fields343 = { seq: int4, start_vid: int8, node: int8, edge: int8, cost: float8, agg_cost: float8 } as const;
  function member343(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3: ExtensionSqlInput<typeof float8>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bpchar>,
    arg6?: ExtensionSqlInput<typeof bool>,
    arg7?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointsdd",
      member:
        "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        text,
        idsArray,
        float8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
        defaultSqlArgument(bool, "equicost"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)",
          fields343,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6, arg7);
  }

  Object.assign(member343, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows343 = (alias: string, ...values: Parameters<typeof member343>) =>
    extensionRows(member343(...values), alias, fields343, "named");
  const fields344 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member344(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3: ExtensionSqlInput<typeof float8>,
    arg4: ExtensionSqlInput<typeof bpchar>,
    arg5?: ExtensionSqlInput<typeof bool>,
    arg6?: ExtensionSqlInput<typeof bool>,
    arg7?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointsdd",
      member:
        "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        text,
        idsArray,
        float8,
        bpchar,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "details"),
        defaultSqlArgument(bool, "equicost"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
          fields344,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6, arg7);
  }

  Object.assign(member344, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows344 = (alias: string, ...values: Parameters<typeof member344>) =>
    extensionRows(member344(...values), alias, fields344, "named");
  const fields345 = { seq: int4, node: int8, edge: int8, cost: float8, agg_cost: float8 } as const;
  function member345(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3: ExtensionSqlInput<typeof float8>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bpchar>,
    arg6?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointsdd",
      member:
        "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
      arguments: [
        text,
        text,
        int8,
        float8,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
          fields345,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member345, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    ]),
  });
  const rows345 = (alias: string, ...values: Parameters<typeof member345>) =>
    extensionRows(member345(...values), alias, fields345, "named");
  const fields346 = {
    seq: int8,
    depth: int8,
    start_vid: int8,
    pred: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member346(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3: ExtensionSqlInput<typeof float8>,
    arg4: ExtensionSqlInput<typeof bpchar>,
    arg5?: ExtensionSqlInput<typeof bool>,
    arg6?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointsdd",
      member:
        "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        text,
        int8,
        float8,
        bpchar,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)",
          fields346,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6);
  }

  Object.assign(member346, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows346 = (alias: string, ...values: Parameters<typeof member346>) =>
    extensionRows(member346(...values), alias, fields346, "named");
  const fields347 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member347(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3: ExtensionSqlInput<typeof idsArray>,
    arg4: ExtensionSqlInput<typeof int4>,
    arg5: ExtensionSqlInput<typeof bpchar>,
    arg6?: ExtensionSqlInput<typeof bool>,
    arg7?: ExtensionSqlInput<typeof bool>,
    arg8?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointsksp",
      member:
        "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        text,
        idsArray,
        idsArray,
        int4,
        bpchar,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "heap_paths"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
          fields347,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
  }

  Object.assign(member347, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows347 = (alias: string, ...values: Parameters<typeof member347>) =>
    extensionRows(member347(...values), alias, fields347, "named");
  const fields348 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member348(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3: ExtensionSqlInput<typeof int8>,
    arg4: ExtensionSqlInput<typeof int4>,
    arg5: ExtensionSqlInput<typeof bpchar>,
    arg6?: ExtensionSqlInput<typeof bool>,
    arg7?: ExtensionSqlInput<typeof bool>,
    arg8?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointsksp",
      member:
        "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        text,
        idsArray,
        int8,
        int4,
        bpchar,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "heap_paths"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
          fields348,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
  }

  Object.assign(member348, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows348 = (alias: string, ...values: Parameters<typeof member348>) =>
    extensionRows(member348(...values), alias, fields348, "named");
  const fields349 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member349(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3: ExtensionSqlInput<typeof idsArray>,
    arg4: ExtensionSqlInput<typeof int4>,
    arg5: ExtensionSqlInput<typeof bpchar>,
    arg6?: ExtensionSqlInput<typeof bool>,
    arg7?: ExtensionSqlInput<typeof bool>,
    arg8?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointsksp",
      member:
        "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        text,
        int8,
        idsArray,
        int4,
        bpchar,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "heap_paths"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
          fields349,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
  }

  Object.assign(member349, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows349 = (alias: string, ...values: Parameters<typeof member349>) =>
    extensionRows(member349(...values), alias, fields349, "named");
  const fields350 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member350(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3: ExtensionSqlInput<typeof int8>,
    arg4: ExtensionSqlInput<typeof int4>,
    arg5?: ExtensionSqlInput<typeof bool>,
    arg6?: ExtensionSqlInput<typeof bool>,
    arg7?: ExtensionSqlInput<typeof bpchar>,
    arg8?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointsksp",
      member:
        "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
      arguments: [
        text,
        text,
        int8,
        int8,
        int4,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "heap_paths"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
          fields350,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
  }

  Object.assign(member350, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    ]),
  });
  const rows350 = (alias: string, ...values: Parameters<typeof member350>) =>
    extensionRows(member350(...values), alias, fields350, "named");
  const fields351 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member351(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof int8>,
    arg3: ExtensionSqlInput<typeof int8>,
    arg4: ExtensionSqlInput<typeof int4>,
    arg5: ExtensionSqlInput<typeof bpchar>,
    arg6?: ExtensionSqlInput<typeof bool>,
    arg7?: ExtensionSqlInput<typeof bool>,
    arg8?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointsksp",
      member:
        "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        text,
        int8,
        int8,
        int4,
        bpchar,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "heap_paths"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
          fields351,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
  }

  Object.assign(member351, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows351 = (alias: string, ...values: Parameters<typeof member351>) =>
    extensionRows(member351(...values), alias, fields351, "named");
  const fields352 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
  } as const;
  function member352(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: NestedQuery<PgroutingCombinations> | null,
    arg3: ExtensionSqlInput<typeof int4>,
    arg4: ExtensionSqlInput<typeof bpchar>,
    arg5?: ExtensionSqlInput<typeof bool>,
    arg6?: ExtensionSqlInput<typeof bool>,
    arg7?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const query2 = managed(arg2);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
      ...(query2 ? (extensionExpressionContract(query2)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointsksp",
      member:
        "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
      arguments: [
        text,
        text,
        text,
        int4,
        bpchar,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "heap_paths"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
          fields352,
        ),
      ),
    })(query0, query1, query2, arg3, arg4, arg5, arg6, arg7);
  }

  Object.assign(member352, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    ]),
  });
  const rows352 = (alias: string, ...values: Parameters<typeof member352>) =>
    extensionRows(member352(...values), alias, fields352, "named");
  const fields353 = {
    seq: int4,
    path_id: int4,
    path_seq: int4,
    start_vid: int8,
    end_vid: int8,
    node: int8,
    edge: int8,
    cost: float8,
    agg_cost: float8,
    route_agg_cost: float8,
  } as const;
  function member353(
    arg0: NestedQuery<PgroutingCostEdges> | null,
    arg1: NestedQuery<PgroutingPoints> | null,
    arg2: ExtensionSqlInput<typeof idsArray>,
    arg3?: ExtensionSqlInput<typeof bool>,
    arg4?: ExtensionSqlInput<typeof bool>,
    arg5?: ExtensionSqlInput<typeof bool>,
    arg6?: ExtensionSqlInput<typeof bpchar>,
    arg7?: ExtensionSqlInput<typeof bool>,
  ) {
    const query0 = managed(arg0);
    const query1 = managed(arg1);
    const dependencies = [
      ...(query0 ? (extensionExpressionContract(query0)?.dependencies ?? []) : []),
      ...(query1 ? (extensionExpressionContract(query1)?.dependencies ?? []) : []),
    ];
    return createSqlFunction({
      ...base,
      dependencies,
      name: "pgr_withpointsvia",
      member:
        "routine:$extension:pgrouting.pgr_withpointsvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
      arguments: [
        text,
        text,
        idsArray,
        defaultSqlArgument(bool, "directed"),
        defaultSqlArgument(bool, "strict"),
        defaultSqlArgument(bool, "u_turn_on_edge"),
        defaultSqlArgument(bpchar, "driving_side"),
        defaultSqlArgument(bool, "details"),
      ] as const,
      result: nullableCodec(
        compositeCodec(
          "routine:$extension:pgrouting.pgr_withpointsvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
          fields353,
        ),
      ),
    })(query0, query1, arg2, arg3, arg4, arg5, arg6, arg7);
  }

  Object.assign(member353, {
    members: Object.freeze([
      "routine:$extension:pgrouting.pgr_withpointsvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    ]),
  });
  const rows353 = (alias: string, ...values: Parameters<typeof member353>) =>
    extensionRows(member353(...values), alias, fields353, "named");
  const functions = Object.freeze({
    // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- Preserve the exact captured pgRouting alpha-shape routine name in the public native API.
    pgr_alphashape: member126,
    pgr_articulationpoints: member129,
    pgr_astar: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
        member130,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
        member131,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
        member132,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
        member133,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
        member134,
    }),
    pgr_astarcost: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
        member135,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
        member136,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
        member137,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
        member138,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
        member139,
    }),
    pgr_astarcostmatrix: member140,
    pgr_bdastar: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
        member141,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
        member142,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
        member143,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
        member144,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
        member145,
    }),
    pgr_bdastarcost: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
        member146,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
        member147,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
        member148,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
        member149,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
        member150,
    }),
    pgr_bdastarcostmatrix: member151,
    pgr_bddijkstra: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": member152,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": member153,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": member154,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": member155,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member156,
    }),
    pgr_bddijkstracost: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": member157,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": member158,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": member159,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": member160,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member161,
    }),
    pgr_bddijkstracostmatrix: member162,
    pgr_bellmanford: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": member163,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": member164,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": member165,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": member166,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member167,
    }),
    pgr_betweennesscentrality: member168,
    pgr_biconnectedcomponents: member169,
    pgr_binarybreadthfirstsearch: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": member170,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": member171,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": member172,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": member173,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member174,
    }),
    pgr_bipartite: member175,
    pgr_boykovkolmogorov: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": member176,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member177,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": member178,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member179,
      "(pg_catalog.text,pg_catalog.text)": member180,
    }),
    pgr_breadthfirstsearch: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": member181,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": member182,
    }),
    pgr_bridges: member183,
    pgr_chinesepostman: member184,
    pgr_chinesepostmancost: member185,
    pgr_connectedcomponents: member186,
    pgr_contraction: Object.freeze({
      "(pg_catalog.text,pg_catalog._int8,pg_catalog.int4,pg_catalog._int8,pg_catalog.bool)": member187,
      "(pg_catalog.text,pg_catalog.bool,pg_catalog._int4,pg_catalog.int4,pg_catalog._int8)": member188,
    }),
    pgr_contractiondeadend: member189,
    pgr_contractionhierarchies: member190,
    pgr_contractionlinear: member191,
    pgr_cuthillmckeeordering: member194,
    pgr_dagshortestpath: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": member195,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member196,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": member197,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member198,
      "(pg_catalog.text,pg_catalog.text)": member199,
    }),
    pgr_degree: Object.freeze({
      "(pg_catalog.text,pg_catalog.bool)": member200,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member201,
    }),
    pgr_depthfirstsearch: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)": member202,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)": member203,
    }),
    pgr_dijkstra: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": member204,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": member205,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": member206,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": member207,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member208,
    }),
    pgr_dijkstracost: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": member209,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": member210,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": member211,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": member212,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member213,
    }),
    pgr_dijkstracostmatrix: member214,
    pgr_dijkstranear: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)":
        member215,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)": member216,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)": member217,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)": member218,
    }),
    pgr_dijkstranearcost: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)":
        member219,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)": member220,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)": member221,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)": member222,
    }),
    pgr_dijkstravia: member223,
    pgr_drivingdistance: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)": member224,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool)": member225,
    }),
    pgr_edgecoloring: member226,
    pgr_edgedisjointpaths: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": member227,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": member228,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": member229,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": member230,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member231,
    }),
    pgr_edmondskarp: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": member232,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member233,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": member234,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member235,
      "(pg_catalog.text,pg_catalog.text)": member236,
    }),
    pgr_edwardmoore: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": member237,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": member238,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": member239,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": member240,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member241,
    }),
    pgr_extractvertices: member242,
    pgr_findcloseedges: Object.freeze({
      "(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
        member243,
      "(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": member244,
      "(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
        member245,
      "(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)": member246,
    }),
    pgr_floydwarshall: member247,
    pgr_full_version: member248,
    pgr_hawickcircuits: member249,
    pgr_isplanar: member250,
    pgr_johnson: member251,
    pgr_kruskal: member252,
    pgr_kruskalbfs: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member253,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member254,
    }),
    pgr_kruskaldd: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)": member255,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)": member256,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)": member257,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)": member258,
    }),
    pgr_kruskaldfs: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member259,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member260,
    }),
    pgr_ksp: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
        member261,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
        member262,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
        member263,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": member264,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)": member265,
    }),
    pgr_lengauertarjandominatortree: member266,
    pgr_linegraph: member267,
    pgr_linegraphfull: member268,
    pgr_makeconnected: member269,
    pgr_maxcardinalitymatch: Object.freeze({
      "(pg_catalog.text,pg_catalog.bool)": member270,
      "(pg_catalog.text)": member271,
    }),
    pgr_maxflow: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": member272,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member273,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": member274,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member275,
      "(pg_catalog.text,pg_catalog.text)": member276,
    }),
    pgr_maxflowmincost_cost: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": member277,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member278,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": member279,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member280,
      "(pg_catalog.text,pg_catalog.text)": member281,
    }),
    pgr_maxflowmincost: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": member282,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member283,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": member284,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member285,
      "(pg_catalog.text,pg_catalog.text)": member286,
    }),
    pgr_pickdeliver: member288,
    pgr_pickdelivereuclidean: member289,
    pgr_prim: member290,
    pgr_primbfs: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member291,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member292,
    }),
    pgr_primdd: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)": member293,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)": member294,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)": member295,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)": member296,
    }),
    pgr_primdfs: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member297,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member298,
    }),
    pgr_pushrelabel: Object.freeze({
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": member299,
      "(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member300,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": member301,
      "(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member302,
      "(pg_catalog.text,pg_catalog.text)": member303,
    }),
    pgr_separatecrossing: member304,
    pgr_separatetouching: member305,
    pgr_sequentialvertexcoloring: member306,
    pgr_stoerwagner: member307,
    pgr_strongcomponents: member308,
    pgr_topologicalsort: member309,
    pgr_transitiveclosure: member310,
    pgr_trsp_withpoints: Object.freeze({
      "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
        member311,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
        member312,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
        member313,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
        member314,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
        member315,
    }),
    pgr_trsp: Object.freeze({
      "(pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)":
        member316,
      "(pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)": member317,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)": member318,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)": member319,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)": member320,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)": member321,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member322,
    }),
    pgr_trspvia_withpoints: member323,
    pgr_trspvia: member324,
    pgr_trspviaedges: member325,
    pgr_trspviavertices: member326,
    pgr_tsp: member327,
    pgr_tspeuclidean: member328,
    pgr_turnrestrictedpath: member329,
    pgr_version: member330,
    pgr_vrponedepot: member331,
    pgr_withpoints: Object.freeze({
      "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
        member332,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
        member333,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
        member334,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
        member335,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)": member336,
    }),
    pgr_withpointscost: Object.freeze({
      "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)":
        member337,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)":
        member338,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)":
        member339,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)": member340,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar)": member341,
    }),
    pgr_withpointscostmatrix: member342,
    pgr_withpointsdd: Object.freeze({
      "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)":
        member343,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
        member344,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
        member345,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)":
        member346,
    }),
    pgr_withpointsksp: Object.freeze({
      "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
        member347,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
        member348,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
        member349,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
        member350,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
        member351,
      "(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
        member352,
    }),
    pgr_withpointsvia: member353,
  });
  const overloads = Object.freeze({
    "routine:$extension:pgrouting.pgr_alphashape($extension:postgis.geometry,pg_catalog.float8)": member126,
    "routine:$extension:pgrouting.pgr_articulationpoints(pg_catalog.text)": member129,
    "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member130,
    "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member131,
    "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member132,
    "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member133,
    "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member134,
    "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member135,
    "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member136,
    "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member137,
    "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member138,
    "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member139,
    "routine:$extension:pgrouting.pgr_astarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
      member140,
    "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
      member141,
    "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
      member142,
    "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
      member143,
    "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
      member144,
    "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
      member145,
    "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
      member146,
    "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
      member147,
    "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
      member148,
    "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
      member149,
    "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
      member150,
    "routine:$extension:pgrouting.pgr_bdastarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
      member151,
    "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
      member152,
    "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
      member153,
    "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
      member154,
    "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
      member155,
    "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member156,
    "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
      member157,
    "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
      member158,
    "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
      member159,
    "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
      member160,
    "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member161,
    "routine:$extension:pgrouting.pgr_bddijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)":
      member162,
    "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
      member163,
    "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
      member164,
    "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
      member165,
    "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
      member166,
    "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member167,
    "routine:$extension:pgrouting.pgr_betweennesscentrality(pg_catalog.text,pg_catalog.bool)": member168,
    "routine:$extension:pgrouting.pgr_biconnectedcomponents(pg_catalog.text)": member169,
    "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
      member170,
    "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
      member171,
    "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
      member172,
    "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
      member173,
    "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.text,pg_catalog.bool)":
      member174,
    "routine:$extension:pgrouting.pgr_bipartite(pg_catalog.text)": member175,
    "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)":
      member176,
    "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member177,
    "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": member178,
    "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member179,
    "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.text)": member180,
    "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
      member181,
    "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
      member182,
    "routine:$extension:pgrouting.pgr_bridges(pg_catalog.text)": member183,
    "routine:$extension:pgrouting.pgr_chinesepostman(pg_catalog.text)": member184,
    "routine:$extension:pgrouting.pgr_chinesepostmancost(pg_catalog.text)": member185,
    "routine:$extension:pgrouting.pgr_connectedcomponents(pg_catalog.text)": member186,
    "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog._int8,pg_catalog.int4,pg_catalog._int8,pg_catalog.bool)":
      member187,
    "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog.bool,pg_catalog._int4,pg_catalog.int4,pg_catalog._int8)":
      member188,
    "routine:$extension:pgrouting.pgr_contractiondeadend(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)": member189,
    "routine:$extension:pgrouting.pgr_contractionhierarchies(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)":
      member190,
    "routine:$extension:pgrouting.pgr_contractionlinear(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)": member191,
    "routine:$extension:pgrouting.pgr_cuthillmckeeordering(pg_catalog.text)": member194,
    "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)":
      member195,
    "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member196,
    "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": member197,
    "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member198,
    "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.text)": member199,
    "routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.bool)": member200,
    "routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member201,
    "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)":
      member202,
    "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)":
      member203,
    "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
      member204,
    "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
      member205,
    "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
      member206,
    "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
      member207,
    "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member208,
    "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
      member209,
    "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
      member210,
    "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
      member211,
    "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
      member212,
    "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member213,
    "routine:$extension:pgrouting.pgr_dijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)":
      member214,
    "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)":
      member215,
    "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)":
      member216,
    "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)":
      member217,
    "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)":
      member218,
    "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)":
      member219,
    "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)":
      member220,
    "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)":
      member221,
    "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)":
      member222,
    "routine:$extension:pgrouting.pgr_dijkstravia(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
      member223,
    "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)":
      member224,
    "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool)":
      member225,
    "routine:$extension:pgrouting.pgr_edgecoloring(pg_catalog.text)": member226,
    "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
      member227,
    "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
      member228,
    "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
      member229,
    "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
      member230,
    "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member231,
    "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": member232,
    "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member233,
    "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": member234,
    "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member235,
    "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.text)": member236,
    "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
      member237,
    "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
      member238,
    "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
      member239,
    "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
      member240,
    "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member241,
    "routine:$extension:pgrouting.pgr_extractvertices(pg_catalog.text,pg_catalog.bool)": member242,
    "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
      member243,
    "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)":
      member244,
    "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
      member245,
    "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)":
      member246,
    "routine:$extension:pgrouting.pgr_floydwarshall(pg_catalog.text,pg_catalog.bool)": member247,
    "routine:$extension:pgrouting.pgr_full_version()": member248,
    "routine:$extension:pgrouting.pgr_hawickcircuits(pg_catalog.text)": member249,
    "routine:$extension:pgrouting.pgr_isplanar(pg_catalog.text)": member250,
    "routine:$extension:pgrouting.pgr_johnson(pg_catalog.text,pg_catalog.bool)": member251,
    "routine:$extension:pgrouting.pgr_kruskal(pg_catalog.text)": member252,
    "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member253,
    "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member254,
    "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)": member255,
    "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)": member256,
    "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)": member257,
    "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)": member258,
    "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member259,
    "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member260,
    "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
      member261,
    "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
      member262,
    "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
      member263,
    "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
      member264,
    "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
      member265,
    "routine:$extension:pgrouting.pgr_lengauertarjandominatortree(pg_catalog.text,pg_catalog.int8)": member266,
    "routine:$extension:pgrouting.pgr_linegraph(pg_catalog.text,pg_catalog.bool)": member267,
    "routine:$extension:pgrouting.pgr_linegraphfull(pg_catalog.text)": member268,
    "routine:$extension:pgrouting.pgr_makeconnected(pg_catalog.text)": member269,
    "routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text,pg_catalog.bool)": member270,
    "routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text)": member271,
    "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": member272,
    "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member273,
    "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": member274,
    "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member275,
    "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.text)": member276,
    "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)":
      member277,
    "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)":
      member278,
    "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)":
      member279,
    "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member280,
    "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.text)": member281,
    "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)":
      member282,
    "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member283,
    "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": member284,
    "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member285,
    "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.text)": member286,
    "routine:$extension:pgrouting.pgr_pickdeliver(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)":
      member288,
    "routine:$extension:pgrouting.pgr_pickdelivereuclidean(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)":
      member289,
    "routine:$extension:pgrouting.pgr_prim(pg_catalog.text)": member290,
    "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member291,
    "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member292,
    "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)": member293,
    "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)": member294,
    "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)": member295,
    "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)": member296,
    "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member297,
    "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member298,
    "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)": member299,
    "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": member300,
    "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": member301,
    "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": member302,
    "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.text)": member303,
    "routine:$extension:pgrouting.pgr_separatecrossing(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)": member304,
    "routine:$extension:pgrouting.pgr_separatetouching(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)": member305,
    "routine:$extension:pgrouting.pgr_sequentialvertexcoloring(pg_catalog.text)": member306,
    "routine:$extension:pgrouting.pgr_stoerwagner(pg_catalog.text)": member307,
    "routine:$extension:pgrouting.pgr_strongcomponents(pg_catalog.text)": member308,
    "routine:$extension:pgrouting.pgr_topologicalsort(pg_catalog.text)": member309,
    "routine:$extension:pgrouting.pgr_transitiveclosure(pg_catalog.text)": member310,
    "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
      member311,
    "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
      member312,
    "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
      member313,
    "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
      member314,
    "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
      member315,
    "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)":
      member316,
    "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)":
      member317,
    "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
      member318,
    "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
      member319,
    "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
      member320,
    "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
      member321,
    "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)": member322,
    "routine:$extension:pgrouting.pgr_trspvia_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
      member323,
    "routine:$extension:pgrouting.pgr_trspvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
      member324,
    "routine:$extension:pgrouting.pgr_trspviaedges(pg_catalog.text,pg_catalog._int4,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)":
      member325,
    "routine:$extension:pgrouting.pgr_trspviavertices(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)":
      member326,
    "routine:$extension:pgrouting.pgr_tsp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
      member327,
    "routine:$extension:pgrouting.pgr_tspeuclidean(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
      member328,
    "routine:$extension:pgrouting.pgr_turnrestrictedpath(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
      member329,
    "routine:$extension:pgrouting.pgr_version()": member330,
    "routine:$extension:pgrouting.pgr_vrponedepot(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)":
      member331,
    "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
      member332,
    "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
      member333,
    "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
      member334,
    "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
      member335,
    "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
      member336,
    "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)":
      member337,
    "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)":
      member338,
    "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)":
      member339,
    "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)":
      member340,
    "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar)":
      member341,
    "routine:$extension:pgrouting.pgr_withpointscostmatrix(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)":
      member342,
    "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)":
      member343,
    "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
      member344,
    "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
      member345,
    "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)":
      member346,
    "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
      member347,
    "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
      member348,
    "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
      member349,
    "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
      member350,
    "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
      member351,
    "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
      member352,
    "routine:$extension:pgrouting.pgr_withpointsvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
      member353,
  });
  return bindExtension(descriptor, {
    // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- Preserve the exact captured pgRouting alpha-shape routine name in the public native API.
    pgrAlphashape: functions["pgr_alphashape"],
    pgrArticulationpoints: functions["pgr_articulationpoints"],
    pgrAstar: functions["pgr_astar"],
    pgrAstarcost: functions["pgr_astarcost"],
    pgrAstarcostmatrix: functions["pgr_astarcostmatrix"],
    pgrBdastar: functions["pgr_bdastar"],
    pgrBdastarcost: functions["pgr_bdastarcost"],
    pgrBdastarcostmatrix: functions["pgr_bdastarcostmatrix"],
    pgrBddijkstra: functions["pgr_bddijkstra"],
    pgrBddijkstracost: functions["pgr_bddijkstracost"],
    pgrBddijkstracostmatrix: functions["pgr_bddijkstracostmatrix"],
    pgrBellmanford: functions["pgr_bellmanford"],
    pgrBetweennesscentrality: functions["pgr_betweennesscentrality"],
    pgrBiconnectedcomponents: functions["pgr_biconnectedcomponents"],
    pgrBinarybreadthfirstsearch: functions["pgr_binarybreadthfirstsearch"],
    pgrBipartite: functions["pgr_bipartite"],
    pgrBoykovkolmogorov: functions["pgr_boykovkolmogorov"],
    pgrBreadthfirstsearch: functions["pgr_breadthfirstsearch"],
    pgrBridges: functions["pgr_bridges"],
    pgrChinesepostman: functions["pgr_chinesepostman"],
    pgrChinesepostmancost: functions["pgr_chinesepostmancost"],
    pgrConnectedcomponents: functions["pgr_connectedcomponents"],
    pgrContraction: functions["pgr_contraction"],
    pgrContractiondeadend: functions["pgr_contractiondeadend"],
    pgrContractionhierarchies: functions["pgr_contractionhierarchies"],
    pgrContractionlinear: functions["pgr_contractionlinear"],
    pgrCuthillmckeeordering: functions["pgr_cuthillmckeeordering"],
    pgrDagshortestpath: functions["pgr_dagshortestpath"],
    pgrDegree: functions["pgr_degree"],
    pgrDepthfirstsearch: functions["pgr_depthfirstsearch"],
    pgrDijkstra: functions["pgr_dijkstra"],
    pgrDijkstracost: functions["pgr_dijkstracost"],
    pgrDijkstracostmatrix: functions["pgr_dijkstracostmatrix"],
    pgrDijkstranear: functions["pgr_dijkstranear"],
    pgrDijkstranearcost: functions["pgr_dijkstranearcost"],
    pgrDijkstravia: functions["pgr_dijkstravia"],
    pgrDrivingdistance: functions["pgr_drivingdistance"],
    pgrEdgecoloring: functions["pgr_edgecoloring"],
    pgrEdgedisjointpaths: functions["pgr_edgedisjointpaths"],
    pgrEdmondskarp: functions["pgr_edmondskarp"],
    pgrEdwardmoore: functions["pgr_edwardmoore"],
    pgrExtractvertices: functions["pgr_extractvertices"],
    pgrFindcloseedges: functions["pgr_findcloseedges"],
    pgrFloydwarshall: functions["pgr_floydwarshall"],
    pgrFull_version: functions["pgr_full_version"],
    pgrHawickcircuits: functions["pgr_hawickcircuits"],
    pgrIsplanar: functions["pgr_isplanar"],
    pgrJohnson: functions["pgr_johnson"],
    pgrKruskal: functions["pgr_kruskal"],
    pgrKruskalbfs: functions["pgr_kruskalbfs"],
    pgrKruskaldd: functions["pgr_kruskaldd"],
    pgrKruskaldfs: functions["pgr_kruskaldfs"],
    pgrKsp: functions["pgr_ksp"],
    pgrLengauertarjandominatortree: functions["pgr_lengauertarjandominatortree"],
    pgrLinegraph: functions["pgr_linegraph"],
    pgrLinegraphfull: functions["pgr_linegraphfull"],
    pgrMakeconnected: functions["pgr_makeconnected"],
    pgrMaxcardinalitymatch: functions["pgr_maxcardinalitymatch"],
    pgrMaxflow: functions["pgr_maxflow"],
    pgrMaxflowmincost_cost: functions["pgr_maxflowmincost_cost"],
    pgrMaxflowmincost: functions["pgr_maxflowmincost"],
    pgrPickdeliver: functions["pgr_pickdeliver"],
    pgrPickdelivereuclidean: functions["pgr_pickdelivereuclidean"],
    pgrPrim: functions["pgr_prim"],
    pgrPrimbfs: functions["pgr_primbfs"],
    pgrPrimdd: functions["pgr_primdd"],
    pgrPrimdfs: functions["pgr_primdfs"],
    pgrPushrelabel: functions["pgr_pushrelabel"],
    pgrSeparatecrossing: functions["pgr_separatecrossing"],
    pgrSeparatetouching: functions["pgr_separatetouching"],
    pgrSequentialvertexcoloring: functions["pgr_sequentialvertexcoloring"],
    pgrStoerwagner: functions["pgr_stoerwagner"],
    pgrStrongcomponents: functions["pgr_strongcomponents"],
    pgrTopologicalsort: functions["pgr_topologicalsort"],
    pgrTransitiveclosure: functions["pgr_transitiveclosure"],
    pgrTrsp_withpoints: functions["pgr_trsp_withpoints"],
    pgrTrsp: functions["pgr_trsp"],
    pgrTrspvia_withpoints: functions["pgr_trspvia_withpoints"],
    pgrTrspvia: functions["pgr_trspvia"],
    pgrTrspviaedges: functions["pgr_trspviaedges"],
    pgrTrspviavertices: functions["pgr_trspviavertices"],
    pgrTsp: functions["pgr_tsp"],
    pgrTspeuclidean: functions["pgr_tspeuclidean"],
    pgrTurnrestrictedpath: functions["pgr_turnrestrictedpath"],
    pgrVersion: functions["pgr_version"],
    pgrVrponedepot: functions["pgr_vrponedepot"],
    pgrWithpoints: functions["pgr_withpoints"],
    pgrWithpointscost: functions["pgr_withpointscost"],
    pgrWithpointscostmatrix: functions["pgr_withpointscostmatrix"],
    pgrWithpointsdd: functions["pgr_withpointsdd"],
    pgrWithpointsksp: functions["pgr_withpointsksp"],
    pgrWithpointsvia: functions["pgr_withpointsvia"],
    codecs: Object.freeze({
      text,
      int4,
      int8,
      bool,
      float8,
      numeric,
      bpchar,
      geometry,
      geometryArray,
      int4Array,
      int8Array,
      idsArray,
      float8Array,
      textArray,
    }),
    sql: Object.freeze({
      functions,
      overloads,
      rows: Object.freeze({
        "routine:$extension:pgrouting.pgr_articulationpoints(pg_catalog.text)": rows129,
        "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
          rows130,
        "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
          rows131,
        "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
          rows132,
        "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
          rows133,
        "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
          rows134,
        "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
          rows135,
        "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
          rows136,
        "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
          rows137,
        "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
          rows138,
        "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
          rows139,
        "routine:$extension:pgrouting.pgr_astarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
          rows140,
        "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
          rows141,
        "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
          rows142,
        "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
          rows143,
        "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
          rows144,
        "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
          rows145,
        "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
          rows146,
        "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
          rows147,
        "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
          rows148,
        "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
          rows149,
        "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
          rows150,
        "routine:$extension:pgrouting.pgr_bdastarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)":
          rows151,
        "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
          rows152,
        "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
          rows153,
        "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
          rows154,
        "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
          rows155,
        "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": rows156,
        "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
          rows157,
        "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
          rows158,
        "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
          rows159,
        "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
          rows160,
        "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": rows161,
        "routine:$extension:pgrouting.pgr_bddijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)":
          rows162,
        "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
          rows163,
        "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
          rows164,
        "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
          rows165,
        "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
          rows166,
        "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": rows167,
        "routine:$extension:pgrouting.pgr_betweennesscentrality(pg_catalog.text,pg_catalog.bool)": rows168,
        "routine:$extension:pgrouting.pgr_biconnectedcomponents(pg_catalog.text)": rows169,
        "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
          rows170,
        "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
          rows171,
        "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
          rows172,
        "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
          rows173,
        "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.text,pg_catalog.bool)":
          rows174,
        "routine:$extension:pgrouting.pgr_bipartite(pg_catalog.text)": rows175,
        "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)":
          rows176,
        "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)":
          rows177,
        "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)":
          rows178,
        "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": rows179,
        "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.text)": rows180,
        "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
          rows181,
        "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
          rows182,
        "routine:$extension:pgrouting.pgr_bridges(pg_catalog.text)": rows183,
        "routine:$extension:pgrouting.pgr_chinesepostman(pg_catalog.text)": rows184,
        "routine:$extension:pgrouting.pgr_connectedcomponents(pg_catalog.text)": rows186,
        "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog._int8,pg_catalog.int4,pg_catalog._int8,pg_catalog.bool)":
          rows187,
        "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog.bool,pg_catalog._int4,pg_catalog.int4,pg_catalog._int8)":
          rows188,
        "routine:$extension:pgrouting.pgr_contractiondeadend(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)":
          rows189,
        "routine:$extension:pgrouting.pgr_contractionhierarchies(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)":
          rows190,
        "routine:$extension:pgrouting.pgr_contractionlinear(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)": rows191,
        "routine:$extension:pgrouting.pgr_cuthillmckeeordering(pg_catalog.text)": rows194,
        "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)":
          rows195,
        "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)":
          rows196,
        "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)":
          rows197,
        "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": rows198,
        "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.text)": rows199,
        "routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.bool)": rows200,
        "routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": rows201,
        "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)":
          rows202,
        "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)":
          rows203,
        "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
          rows204,
        "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
          rows205,
        "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
          rows206,
        "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
          rows207,
        "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": rows208,
        "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
          rows209,
        "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
          rows210,
        "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
          rows211,
        "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
          rows212,
        "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": rows213,
        "routine:$extension:pgrouting.pgr_dijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)":
          rows214,
        "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)":
          rows215,
        "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)":
          rows216,
        "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)":
          rows217,
        "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)":
          rows218,
        "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)":
          rows219,
        "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)":
          rows220,
        "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)":
          rows221,
        "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)":
          rows222,
        "routine:$extension:pgrouting.pgr_dijkstravia(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
          rows223,
        "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)":
          rows224,
        "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool)":
          rows225,
        "routine:$extension:pgrouting.pgr_edgecoloring(pg_catalog.text)": rows226,
        "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
          rows227,
        "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
          rows228,
        "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
          rows229,
        "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
          rows230,
        "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": rows231,
        "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)":
          rows232,
        "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": rows233,
        "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": rows234,
        "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": rows235,
        "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.text)": rows236,
        "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
          rows237,
        "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
          rows238,
        "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
          rows239,
        "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
          rows240,
        "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": rows241,
        "routine:$extension:pgrouting.pgr_extractvertices(pg_catalog.text,pg_catalog.bool)": rows242,
        "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
          rows243,
        "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)":
          rows244,
        "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
          rows245,
        "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)":
          rows246,
        "routine:$extension:pgrouting.pgr_floydwarshall(pg_catalog.text,pg_catalog.bool)": rows247,
        "routine:$extension:pgrouting.pgr_hawickcircuits(pg_catalog.text)": rows249,
        "routine:$extension:pgrouting.pgr_johnson(pg_catalog.text,pg_catalog.bool)": rows251,
        "routine:$extension:pgrouting.pgr_kruskal(pg_catalog.text)": rows252,
        "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": rows253,
        "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": rows254,
        "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)": rows255,
        "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)": rows256,
        "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)": rows257,
        "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)": rows258,
        "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": rows259,
        "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": rows260,
        "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
          rows261,
        "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
          rows262,
        "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
          rows263,
        "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
          rows264,
        "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)":
          rows265,
        "routine:$extension:pgrouting.pgr_lengauertarjandominatortree(pg_catalog.text,pg_catalog.int8)": rows266,
        "routine:$extension:pgrouting.pgr_linegraph(pg_catalog.text,pg_catalog.bool)": rows267,
        "routine:$extension:pgrouting.pgr_linegraphfull(pg_catalog.text)": rows268,
        "routine:$extension:pgrouting.pgr_makeconnected(pg_catalog.text)": rows269,
        "routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text,pg_catalog.bool)": rows270,
        "routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text)": rows271,
        "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)":
          rows282,
        "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": rows283,
        "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": rows284,
        "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": rows285,
        "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.text)": rows286,
        "routine:$extension:pgrouting.pgr_pickdeliver(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)":
          rows288,
        "routine:$extension:pgrouting.pgr_pickdelivereuclidean(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)":
          rows289,
        "routine:$extension:pgrouting.pgr_prim(pg_catalog.text)": rows290,
        "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": rows291,
        "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": rows292,
        "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)": rows293,
        "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)": rows294,
        "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)": rows295,
        "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)": rows296,
        "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": rows297,
        "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": rows298,
        "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)":
          rows299,
        "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)": rows300,
        "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)": rows301,
        "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)": rows302,
        "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.text)": rows303,
        "routine:$extension:pgrouting.pgr_separatecrossing(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)": rows304,
        "routine:$extension:pgrouting.pgr_separatetouching(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)": rows305,
        "routine:$extension:pgrouting.pgr_sequentialvertexcoloring(pg_catalog.text)": rows306,
        "routine:$extension:pgrouting.pgr_stoerwagner(pg_catalog.text)": rows307,
        "routine:$extension:pgrouting.pgr_strongcomponents(pg_catalog.text)": rows308,
        "routine:$extension:pgrouting.pgr_topologicalsort(pg_catalog.text)": rows309,
        "routine:$extension:pgrouting.pgr_transitiveclosure(pg_catalog.text)": rows310,
        "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
          rows311,
        "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
          rows312,
        "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
          rows313,
        "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
          rows314,
        "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
          rows315,
        "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)":
          rows316,
        "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)":
          rows317,
        "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)":
          rows318,
        "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)":
          rows319,
        "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)":
          rows320,
        "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)":
          rows321,
        "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)":
          rows322,
        "routine:$extension:pgrouting.pgr_trspvia_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
          rows323,
        "routine:$extension:pgrouting.pgr_trspvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
          rows324,
        "routine:$extension:pgrouting.pgr_trspviaedges(pg_catalog.text,pg_catalog._int4,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)":
          rows325,
        "routine:$extension:pgrouting.pgr_trspviavertices(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)":
          rows326,
        "routine:$extension:pgrouting.pgr_tsp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
          rows327,
        "routine:$extension:pgrouting.pgr_tspeuclidean(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)":
          rows328,
        "routine:$extension:pgrouting.pgr_turnrestrictedpath(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
          rows329,
        "routine:$extension:pgrouting.pgr_vrponedepot(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)":
          rows331,
        "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
          rows332,
        "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
          rows333,
        "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
          rows334,
        "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
          rows335,
        "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
          rows336,
        "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)":
          rows337,
        "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)":
          rows338,
        "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)":
          rows339,
        "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)":
          rows340,
        "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar)":
          rows341,
        "routine:$extension:pgrouting.pgr_withpointscostmatrix(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)":
          rows342,
        "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)":
          rows343,
        "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
          rows344,
        "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
          rows345,
        "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)":
          rows346,
        "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
          rows347,
        "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
          rows348,
        "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
          rows349,
        "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
          rows350,
        "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
          rows351,
        "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)":
          rows352,
        "routine:$extension:pgrouting.pgr_withpointsvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)":
          rows353,
      }),
      types: Object.freeze({}),
    }),
  });
}
