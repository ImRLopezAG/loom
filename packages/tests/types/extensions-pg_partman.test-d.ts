import { createPgPartman_5_1_0, pgPartmanDigest } from "../../../apps/loom/src/core/extensions/adapters/pg_partman";
import type {
  PgPartmanSession,
  PgPartmanProcedureRequest,
} from "../../../apps/loom/src/tooling/extensions/operations/pg_partman";
const api = createPgPartman_5_1_0({
  name: "pg_partman",
  version: "5.1.0",
  schema: "extensions",
  apiSupport: { status: "verified", digest: pgPartmanDigest },
} as const);
api.check_name_length("name", undefined, true);
api.check_name_length(null);
api.calculate_time_partition_info("1 month", { type: "timestamptz", text: "2026-10-04 00:00:00.123456+00" });
// @ts-expect-error Exact numeric input, no timestamp Date coercion.
api.calculate_time_partition_info("1 month", new Date());
// @ts-expect-error Maintenance remains explicit tooling.
api.create_parent("schema.parent", "id", "10");
// @ts-expect-error Procedures cannot be SQL query expressions.
api.sql.functions.run_maintenance_proc();
// @ts-expect-error Captured boolean semantic parameter.
api.check_default("true");
async function check(session: PgPartmanSession) {
  const rows: readonly { partitions_undone: number | null; rows_undone: bigint | null }[] = [
    await session.undo_partition({ p_parent_table: "own.parent", p_target_table: "own.target" }),
  ];
  await session.create_parent({ p_parent_table: "own.parent", p_control: "id", p_interval: "10", p_premake: 1 });
  await session.create_partition_id({
    p_parent_table: "own.parent",
    p_partition_ids: { dimensions: [{ lowerBound: 0, length: 1 }], values: [9007199254740993n] },
  });
  // @ts-expect-error Native int8 arrays require lossless bigint.
  await session.create_partition_id({ p_parent_table: "own.parent", p_partition_ids: [1] });
  // @ts-expect-error No raw SQL / client escape.
  session.client.query("SELECT 1");
  void rows;
}
const procedure: PgPartmanProcedureRequest = { procedure: "run_analyze", arguments: {} };
void procedure;
void check;
