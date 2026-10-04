import type { SQL } from "drizzle-orm";
import { expectTypeOf } from "vite-plus/test";
import {
  createPgHintPlan_1_8_0,
  type PgHintPlanHint,
  type PgHintPlanComposite,
} from "../../../apps/loom/src/core/extensions/adapters/pg_hint_plan";
import type { PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import type { JsonDocument } from "../../../apps/loom/src/core/extensions/native-json-codecs";
import {
  withPgHintPlan,
  type PgHintPlanSession,
  type PgHintPlanPrerequisites,
} from "../../../apps/loom/src/tooling/extensions/operations/pg_hint_plan";
import { pgHintPlanDescriptor } from "../../e2e/fixtures/pg_hint_plan";

const api = createPgHintPlan_1_8_0(pgHintPlanDescriptor);
expectTypeOf(api.version).toEqualTypeOf<"1.8.0">();
expectTypeOf(api.schema).toEqualTypeOf<"hint_plan">();
expectTypeOf<PgHintPlanHint>().toEqualTypeOf<{
  readonly id: number;
  readonly query_id: bigint;
  readonly application_name: string;
  readonly hints: string;
}>();
expectTypeOf<PgHintPlanComposite>().toEqualTypeOf<{
  readonly id: number | null;
  readonly query_id: bigint | null;
  readonly application_name: string | null;
  readonly hints: string | null;
}>();
expectTypeOf(api.hintTable()).toExtend<SQL<PgHintPlanHint>>();
expectTypeOf(api.hintRows("h").columns.query_id).toEqualTypeOf<SQL<bigint>>();
expectTypeOf(api.hintRows("h").columns.application_name).toEqualTypeOf<SQL<string>>();
expectTypeOf(api.rowCodec.decode("")).toEqualTypeOf<PgHintPlanHint>();
expectTypeOf(api.codec.decode("")).toEqualTypeOf<PgHintPlanComposite>();
expectTypeOf(api.arrayCodec.decode("")).toEqualTypeOf<PostgreSqlArray<PgHintPlanComposite>>();
expectTypeOf(api.upsertHint).toEqualTypeOf<{
  readonly member: 'table:"$extension:pg_hint_plan".hints';
  readonly authority: "operator" | "session";
}>();
expectTypeOf<PgHintPlanSession["queryId"]>().returns.toEqualTypeOf<Promise<bigint>>();
expectTypeOf<PgHintPlanSession["explain"]>().returns.toEqualTypeOf<Promise<JsonDocument>>();
expectTypeOf<PgHintPlanSession["deleteHint"]>().returns.toEqualTypeOf<Promise<PgHintPlanHint | null>>();
expectTypeOf<PgHintPlanPrerequisites["loaded"]>().toEqualTypeOf<boolean>();
expectTypeOf<PgHintPlanSession>().not.toHaveProperty("client");
expectTypeOf<PgHintPlanSession>().not.toHaveProperty("query");
function compileOnly() {
  // @ts-expect-error Hint writes are operator metadata, not callable application SQL.
  api.upsertHint({ queryId: 1n, applicationName: "", hints: "SeqScan(t)" });
  // @ts-expect-error The extension has no SQL-callable routines or operators.
  void api.sql.functions.hints;
  // @ts-expect-error Exact version only.
  createPgHintPlan_1_8_0({ ...pgHintPlanDescriptor, version: "1.7.1" });
  void withPgHintPlan("postgresql://operator@localhost/fixture", pgHintPlanDescriptor, async (session) => {
    expectTypeOf(
      await session.upsertHint({ queryId: 1n, applicationName: "", hints: "SeqScan(t)" }),
    ).toEqualTypeOf<PgHintPlanHint>();
    // @ts-expect-error Query identifiers are exact int8 bigint values, never rounded numbers.
    await session.upsertHint({ queryId: 1, applicationName: "", hints: "SeqScan(t)" });
    // @ts-expect-error Statements are typed SQL fragments, not raw text.
    await session.explain("select 1");
    // @ts-expect-error Settings are the five native pg_hint_plan names with their captured values.
    await session.configure({ debugPrint: "loud" });
    // @ts-expect-error Unknown settings are rejected.
    await session.configure({ hintsAnywhere: true });
    await session.configure({ enableHintTable: true, parseMessages: "error", messageLevel: "notice" });
  });
}
void compileOnly;
