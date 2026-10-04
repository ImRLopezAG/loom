import { sql } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { withCodecSqlType } from "../codecs";
import { extensionRows } from "../rows";
import { checkedExtensionExpression, statefulSqlMember } from "../sql";
import {
  pgHintPlanHintFields,
  pgHintPlanHintCodec,
  pgHintPlanCompositeCodec,
  pgHintPlanHintArrayCodec,
} from "./pg_hint_plan-codecs";
export type { PgHintPlanHint, PgHintPlanComposite } from "./pg_hint_plan-codecs";

const digest = "925971596ead990ae9ce609d472072d944c6843361a47f0e97652e53f91a94b4";
const table = 'table:"$extension:pg_hint_plan".hints';

/**
 * The hint table is server-wide planner configuration, not application data: readers are PUBLIC SELECT queries that
 * automatic live queries reject, and writes are reachable only through explicit operator tooling.
 */
export function createPgHintPlan_1_8_0<
  const Descriptor extends ExtensionDescriptor<"pg_hint_plan", { version: "1.8.0"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "pg_hint_plan" ||
    descriptor.version !== "1.8.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("pg_hint_plan 1.8.0 requires its exact verified contract");
  if (descriptor.schema !== "hint_plan") throw new Error("pg_hint_plan 1.8.0 is fixed to the hint_plan schema");
  const hintTable = () =>
    checkedExtensionExpression(
      sql`${sql.identifier(descriptor.schema)}.${sql.identifier("hints")}`,
      pgHintPlanHintCodec,
      [],
      undefined,
      table,
      "external",
    );
  return bindExtension(descriptor, {
    hintTable,
    hintRows: (alias: string) => extensionRows(hintTable(), alias, pgHintPlanHintFields, "named"),
    rowCodec: pgHintPlanHintCodec,
    codec: withCodecSqlType(pgHintPlanCompositeCodec, { schema: descriptor.schema, name: "hints" }),
    arrayCodec: withCodecSqlType(pgHintPlanHintArrayCodec, { schema: descriptor.schema, name: "hints", array: true }),
    upsertHint: statefulSqlMember(table, "operator"),
    deleteHint: statefulSqlMember(table, "operator"),
    sql: Object.freeze({ functions: Object.freeze({}), operators: Object.freeze({}) }),
  });
}
