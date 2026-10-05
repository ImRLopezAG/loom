import { expectTypeOf } from "vite-plus/test";
import { createPgStatStatements_1_12 } from "../../../apps/loom/src/core/extensions/adapters/pg_stat_statements";
import {
  withPgStatStatements,
  type StatementStatisticsSession,
  type StatementResetRequest,
} from "../../../apps/loom/src/tooling/extensions/operations/pg_stat_statements";
import type { StatementStatistics } from "../../../apps/loom/src/core/extensions/adapters/pg_stat_statements-codecs";
import type { Timestamptz } from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";
import type { NonfiniteNumber } from "../../../apps/loom/src/core/extensions/codecs";
import source from "../../../apps/loom/src/tooling/extensions/manifests/pg_stat_statements.json";
// Compiled by the matching pgStatStatementsTypesProofCase; this wrapper performs no runtime operator work.
function pgStatStatementsTypeContract(): void {
  const descriptor = {
    name: "pg_stat_statements",
    version: "1.12",
    schema: "extensions",
    apiSupport: { status: "verified", digest: source.digest },
  } as const;
  const binding = createPgStatStatements_1_12(descriptor);
  binding.statements(true);
  // @ts-expect-error Exact showtext overload is boolean.
  binding.statements("true");
  // @ts-expect-error Reset is an explicit tooling capability only.
  binding.sql.functions.pg_stat_statements_reset();
  expectTypeOf<StatementStatistics["queryid"]>().toEqualTypeOf<bigint | null>();
  expectTypeOf<StatementStatistics["query"]>().toEqualTypeOf<string | null>();
  expectTypeOf<StatementStatistics["wal_bytes"]>().toEqualTypeOf<string | NonfiniteNumber>();
  expectTypeOf<StatementStatistics["stats_since"]>().toEqualTypeOf<Timestamptz>();
  // @ts-expect-error Query IDs remain bigint, never rounded numeric selectors.
  const wrong: StatementResetRequest = { queryId: 1 };
  void wrong;
  void withPgStatStatements("postgresql://operator/fixture", descriptor, async (session) => {
    expectTypeOf(session).toEqualTypeOf<StatementStatisticsSession>();
    const result = await session.reset({ minmaxOnly: true, queryId: 1n });
    expectTypeOf(result.resetAt).toEqualTypeOf<Timestamptz>();
    expectTypeOf(result.rollback).toEqualTypeOf<"not-transactional">();
    // @ts-expect-error Raw operator authority never reaches callback.
    session.client;
    return result;
  });
}
void pgStatStatementsTypeContract;
