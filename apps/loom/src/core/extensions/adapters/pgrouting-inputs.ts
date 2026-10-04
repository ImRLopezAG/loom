import type { NonfiniteNumber, PostgreSqlArray } from "../codecs";
import type { Geometry } from "./postgis-codecs";

/** Native ANY-INTEGER / ANY-NUMERICAL columns; values retain their source codec's precision. */
export type PgroutingInteger = number | bigint;
export type PgroutingNumeric = number | bigint | string | NonfiniteNumber;
export interface PgroutingGraphEdges {
  readonly source: PgroutingInteger;
  readonly target: PgroutingInteger;
  readonly id?: PgroutingInteger;
}
export interface PgroutingCostEdges extends PgroutingGraphEdges {
  readonly id: PgroutingInteger;
  readonly cost: PgroutingNumeric;
  readonly reverse_cost?: PgroutingNumeric;
}
export interface PgroutingAstarEdges extends PgroutingCostEdges {
  readonly x1: PgroutingNumeric;
  readonly y1: PgroutingNumeric;
  readonly x2: PgroutingNumeric;
  readonly y2: PgroutingNumeric;
}
export interface PgroutingCapacityEdges extends PgroutingGraphEdges {
  readonly id: PgroutingInteger;
  readonly capacity: PgroutingInteger;
  readonly reverse_capacity?: PgroutingInteger;
  readonly cost?: PgroutingNumeric;
  readonly reverse_cost?: PgroutingNumeric;
}
export interface PgroutingCapacityCostEdges extends PgroutingCapacityEdges {
  readonly cost: PgroutingNumeric;
}
export interface PgroutingCombinations {
  readonly source: PgroutingInteger;
  readonly target: PgroutingInteger;
}
export interface PgroutingPoints {
  readonly edge_id: PgroutingInteger;
  readonly fraction: PgroutingNumeric;
  readonly pid?: PgroutingInteger;
  readonly side?: string;
}
export interface PgroutingRestrictions {
  readonly path: PostgreSqlArray<PgroutingInteger>;
  readonly cost: PgroutingNumeric;
}
export interface PgroutingLegacyRestrictions {
  readonly target_id: number;
  readonly via_path: string | null;
  readonly to_cost: number;
}
export interface PgroutingGeometryEdges {
  readonly id: PgroutingInteger;
  readonly geom: Geometry;
}
/** extractVertices accepts geometry or source/target, with optional coordinate columns. */
export type PgroutingVertexEdges =
  | PgroutingGeometryEdges
  | (PgroutingGraphEdges & {
      readonly id: PgroutingInteger;
      readonly x1?: PgroutingNumeric;
      readonly y1?: PgroutingNumeric;
      readonly x2?: PgroutingNumeric;
      readonly y2?: PgroutingNumeric;
    });
export type PgroutingDegreeVertices = { readonly id: PgroutingInteger } & (
  | {
      readonly in_edges: PostgreSqlArray<PgroutingInteger> | null;
      readonly out_edges?: PostgreSqlArray<PgroutingInteger> | null;
    }
  | {
      readonly in_edges?: PostgreSqlArray<PgroutingInteger> | null;
      readonly out_edges: PostgreSqlArray<PgroutingInteger> | null;
    }
);
export interface PgroutingCoordinates {
  readonly id: PgroutingInteger;
  readonly x: PgroutingNumeric;
  readonly y: PgroutingNumeric;
}
export interface PgroutingMatrix {
  readonly start_vid: PgroutingInteger;
  readonly end_vid: PgroutingInteger;
  readonly agg_cost: PgroutingNumeric;
}
export interface PgroutingOrderTimes {
  readonly id: PgroutingInteger;
  readonly demand: PgroutingNumeric;
  readonly p_open: PgroutingNumeric;
  readonly p_close: PgroutingNumeric;
  readonly p_service: PgroutingNumeric;
  readonly d_open: PgroutingNumeric;
  readonly d_close: PgroutingNumeric;
  readonly d_service: PgroutingNumeric;
}
export interface PgroutingOrders extends PgroutingOrderTimes {
  readonly p_node_id: PgroutingInteger;
  readonly d_node_id: PgroutingInteger;
}
export interface PgroutingEuclideanOrders extends PgroutingOrderTimes {
  readonly p_x: PgroutingNumeric;
  readonly p_y: PgroutingNumeric;
  readonly d_x: PgroutingNumeric;
  readonly d_y: PgroutingNumeric;
}
export interface PgroutingVehicleTimes {
  readonly id: PgroutingInteger;
  readonly capacity: PgroutingNumeric;
  readonly start_open: PgroutingNumeric;
  readonly start_close: PgroutingNumeric;
  readonly start_service?: PgroutingNumeric;
  readonly end_open?: PgroutingNumeric;
  readonly end_close?: PgroutingNumeric;
  readonly end_service?: PgroutingNumeric;
}
export interface PgroutingVehicles extends PgroutingVehicleTimes {
  readonly start_node_id: PgroutingInteger;
  readonly end_node_id?: PgroutingInteger;
}
export interface PgroutingEuclideanVehicles extends PgroutingVehicleTimes {
  readonly start_x: PgroutingNumeric;
  readonly start_y: PgroutingNumeric;
  readonly end_x?: PgroutingNumeric;
  readonly end_y?: PgroutingNumeric;
}
export interface PgroutingVrpOrders extends PgroutingCoordinates {
  readonly open_time: PgroutingNumeric;
  readonly close_time: PgroutingNumeric;
  readonly service_time: PgroutingNumeric;
  readonly order_unit: PgroutingNumeric;
}
export interface PgroutingVrpVehicles {
  readonly vehicle_id: PgroutingInteger;
  readonly capacity: PgroutingNumeric;
}
export interface PgroutingVrpMatrix {
  readonly src_id: PgroutingInteger;
  readonly dest_id: PgroutingInteger;
  readonly traveltime: PgroutingNumeric;
}
