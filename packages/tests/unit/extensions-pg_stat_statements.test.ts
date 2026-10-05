import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import {
  pgStatStatementsUnitProofCases,
  pgStatStatementsMemberProofs,
  pgStatStatementsDatabaseProofCases,
} from "../../e2e/fixtures/pg_stat_statements-proof-cases";
import { expect } from "vite-plus/test";
import { createPgStatStatements_1_12 } from "../../../apps/loom/src/core/extensions/adapters/pg_stat_statements";
import {
  statementFields,
  statementCodec,
} from "../../../apps/loom/src/core/extensions/adapters/pg_stat_statements-codecs";
import source from "../../../apps/loom/src/tooling/extensions/manifests/pg_stat_statements.json";
import { pgStatStatementsAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_stat_statements";
import {
  statementResetValidator,
  withPgStatStatements,
} from "../../../apps/loom/src/tooling/extensions/operations/pg_stat_statements";
import { extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import * as v from "valibot";
const descriptor = {
  name: "pg_stat_statements",
  version: "1.12",
  schema: 'stats"schema',
  apiSupport: { status: "verified", digest: source.digest },
} as const;
extensionProofUnitTest(pgStatStatementsUnitProofCases[0]!, () => {
  const member = source.contract.members.find((m) => m.kind === "routine" && m.name === "pg_stat_statements")!;
  expect(Object.keys(statementFields)).toEqual(member.arguments!.filter((a) => a.mode === "out").map((a) => a.name));
  for (const argument of member.arguments!.filter((argument) => argument.mode === "out")) {
    const codec = Object.entries(statementFields).find(([name]) => name === argument.name)![1];
    expect(codec.sqlType).toEqual({ schema: argument.type.namespace, name: argument.type.name });
  }
  expect(statementFields.queryid.decode(null)).toBeNull();
  expect(statementFields.query.decode(null)).toBeNull();
  expect(statementFields.wal_bytes.decode("9007199254740993")).toBe("9007199254740993");
  expect(statementFields.stats_since.decode("2026-10-03 12:00:00.123456+00")).toEqual({
    type: "timestamptz",
    text: "2026-10-03 12:00:00.123456+00",
  });
  expect(() => statementCodec.decode({})).toThrow();
});
extensionProofUnitTest(pgStatStatementsUnitProofCases[1]!, () => {
  const binding = createPgStatStatements_1_12(descriptor);
  expect(Object.keys(binding.sql.functions)).toEqual(["pg_stat_statements", "pg_stat_statements_info"]);
  expect(binding).not.toHaveProperty("reset");
  expect(binding.sql.functions).not.toHaveProperty("pg_stat_statements_reset");
  expect(extensionExpressionContract(binding.statements(true))?.observability).toBe("external");
  expect(extensionExpressionContract(binding.info())?.observability).toBe("external");
});
extensionProofUnitTest(pgStatStatementsUnitProofCases[2]!, async () => {
  expect(pgStatStatementsAnnotations.map((annotation) => annotation.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  expect(pgStatStatementsMemberProofs.map((proof) => proof.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  for (const proof of pgStatStatementsMemberProofs) expect(proof.cases).toHaveLength(1);
  expect(
    pgStatStatementsDatabaseProofCases.flatMap((definition) => definition.claims.map((claim) => claim.member)).sort(),
  ).toEqual(source.contract.members.map((member) => member.id).sort());
  expect(pgStatStatementsAnnotations.filter((annotation) => annotation.disposition === "internal")).toHaveLength(2);
  expect(v.parse(statementResetValidator, { userId: 4294967295, queryId: -9223372036854775808n })).toEqual({
    userId: 4294967295,
    queryId: -9223372036854775808n,
  });
  for (const request of [
    { queryId: 1 },
    { userId: -1 },
    { queryId: 9223372036854775808n },
    { minmaxOnly: "true" },
    { raw: "SELECT 1" },
  ])
    expect(() => v.parse(statementResetValidator, request)).toThrow();
  await expect(
    withPgStatStatements(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...descriptor, apiSupport: { status: "unverified" } },
      async () => undefined,
    ),
  ).rejects.toThrow(/exact verified contract/);
});
