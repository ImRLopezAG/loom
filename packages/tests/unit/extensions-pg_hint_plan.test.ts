import { expect } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import {
  pgHintPlanUnitProofCases,
  pgHintPlanMemberProofs,
  pgHintPlanNativeProofCase,
} from "../../e2e/fixtures/pg_hint_plan-proof-cases";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import { createPgHintPlan_1_8_0 } from "../../../apps/loom/src/core/extensions/adapters/pg_hint_plan";
import {
  pgHintPlanHintCodec,
  pgHintPlanHintArrayCodec,
} from "../../../apps/loom/src/core/extensions/adapters/pg_hint_plan-codecs";
import { pgHintPlanAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_hint_plan";
import {
  withPgHintPlan,
  pgHintPlanSettingsValidator,
} from "../../../apps/loom/src/tooling/extensions/operations/pg_hint_plan";
import { pgHintPlanDescriptor, pgHintPlanDigest } from "../../e2e/fixtures/pg_hint_plan";
import source from "../../../apps/loom/src/tooling/extensions/manifests/pg_hint_plan.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";

const ids = source.contract.members.map((member) => member.id).sort();

extensionProofUnitTest(pgHintPlanUnitProofCases[0]!, async () => {
  expect(validateExtensionManifest(v.parse(extensionManifestValidator, source)).digest).toBe(pgHintPlanDigest);
  expect(source.contract.version).toBe("1.8.0");
  expect(source.contract.installation).toEqual({ relocatable: false, fixedSchema: "hint_plan" });
  expect(source.contract.members).toHaveLength(20);
  expect(pgHintPlanAnnotations.map((member) => member.id).sort()).toEqual(ids);
  expect(pgHintPlanMemberProofs.map((member) => member.id).sort()).toEqual(ids);
  expect(pgHintPlanNativeProofCase.claims.map((claim) => claim.member).sort()).toEqual(ids);
  const dispositions = Object.fromEntries(pgHintPlanAnnotations.map((member) => [member.id, member.disposition]));
  expect(dispositions['table:"$extension:pg_hint_plan".hints']).toBe("query");
  expect(dispositions["type:$extension:pg_hint_plan.hints"]).toBe("query");
  expect(dispositions["type:$extension:pg_hint_plan._hints"]).toBe("query");
  expect(dispositions['sequence:"$extension:pg_hint_plan".hints_id_seq']).toBe("internal");
  const api = createPgHintPlan_1_8_0(pgHintPlanDescriptor);
  expect(api.sql).toEqual({ functions: {}, operators: {} });
  expect(api.upsertHint).toEqual({ member: 'table:"$extension:pg_hint_plan".hints', authority: "operator" });
  expect(() =>
    createPgHintPlan_1_8_0({ ...pgHintPlanDescriptor, apiSupport: { status: "verified", digest: "wrong" } }),
  ).toThrow(/exact verified contract/);
  expect(() => createPgHintPlan_1_8_0({ ...pgHintPlanDescriptor, schema: "public" })).toThrow(/hint_plan/);
  await expect(
    withPgHintPlan(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...pgHintPlanDescriptor, apiSupport: { status: "unverified" } },
      async () => undefined,
    ),
  ).rejects.toThrow(/exact verified contract/);
  // Native enum values captured from pg_settings; anything else is rejected before reaching PostgreSQL.
  expect(
    v.parse(pgHintPlanSettingsValidator, { enableHintTable: true, debugPrint: "verbose", parseMessages: "error" }),
  ).toEqual({
    enableHintTable: true,
    debugPrint: "verbose",
    parseMessages: "error",
  });
  expect(() => v.parse(pgHintPlanSettingsValidator, { messageLevel: "fatal" })).toThrow();
  expect(() => v.parse(pgHintPlanSettingsValidator, { hintsAnywhere: true })).toThrow();
});

extensionProofUnitTest(pgHintPlanUnitProofCases[1]!, () => {
  const api = createPgHintPlan_1_8_0(pgHintPlanDescriptor);
  const rows = api.hintRows("h");
  for (const column of Object.values(rows.columns))
    expect(extensionExpressionContract(column)?.observability).toBe("tables");
  const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
    sql`select ${rows.columns.query_id}, ${rows.columns.hints} from ${rows.from}`,
  );
  expect(compiled.sql).toBe(
    'select "h"."query_id", "h"."hints" from "hint_plan"."hints" as "h"("id", "query_id", "application_name", "hints")',
  );
  expect(extensionExpressionContract(api.hintTable())).toMatchObject({
    member: 'table:"$extension:pg_hint_plan".hints',
    observability: "external",
  });
});

extensionProofUnitTest(pgHintPlanUnitProofCases[2]!, () => {
  // Native text captured from ROW(...)::hint_plan.hints::text and the array cast on PostgreSQL 18.
  const decoded = pgHintPlanHintCodec.decode('(1,3741799035262873629,"","SeqScan(t)")');
  expect(decoded).toEqual({ id: 1, query_id: 3741799035262873629n, application_name: "", hints: "SeqScan(t)" });
  expect(pgHintPlanHintCodec.decode(pgHintPlanHintCodec.encode(decoded))).toEqual(decoded);
  const negative = pgHintPlanHintCodec.decode('(2,-3200643014835763244,loom-app,"BitmapScan(t)")');
  expect(negative.query_id).toBe(-3200643014835763244n);
  const array = pgHintPlanHintArrayCodec.decode('{"(1,2,\\"a,\\"\\"b\\",\\"x y\\")",NULL}');
  expect(array.values).toEqual([{ id: 1, query_id: 2n, application_name: 'a,"b', hints: "x y" }, null]);
  expect(() => pgHintPlanHintCodec.encode({ ...decoded, id: 2147483648 })).toThrow();
});
