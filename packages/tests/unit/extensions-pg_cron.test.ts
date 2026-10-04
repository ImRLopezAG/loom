import { expect } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import {
  pgCronUnitProofCases,
  pgCronMemberProofs,
  pgCronDatabaseProofCase,
} from "../../e2e/fixtures/pg_cron-proof-cases";
import { pgCronDescriptor } from "../../e2e/fixtures/pg_cron";
import { createPgCron_1_6 } from "../../../apps/loom/src/core/extensions/adapters/pg_cron";
import {
  cronJobFields,
  cronRunDetailFields,
  cronJobCodec,
  cronRunDetailCodec,
  cronJobArrayCodec,
} from "../../../apps/loom/src/core/extensions/adapters/pg_cron-codecs";
import { pgCronAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_cron";
import { withPgCron } from "../../../apps/loom/src/tooling/extensions/operations/pg_cron";
import {
  checkCompiledExtensionQuery,
  withExtensionSqlExecution,
  extensionSqlDialect,
} from "../../../apps/loom/src/core/extensions/sql";
import source from "../../../apps/loom/src/tooling/extensions/manifests/pg_cron.json";

extensionProofUnitTest(pgCronUnitProofCases[0]!, () => {
  for (const [name, fields] of [
    ["job", cronJobFields],
    ["job_run_details", cronRunDetailFields],
  ] as const) {
    const member = source.contract.members.find((m) => m.kind === "type" && m.name === name)!;
    expect(Object.keys(fields)).toEqual(member.attributes!.map((a) => a.name));
    for (const field of member.attributes!)
      expect(Object.entries(fields).find(([key]) => key === field.name)![1].sqlType).toEqual({
        schema: field.type.namespace,
        name: field.type.name,
      });
  }
  const job = cronJobCodec.decode('(9007199254740993,"0 0 $ * *","SELECT 1",localhost,5432,postgres,operator,f,)');
  expect(job.jobid).toBe(9007199254740993n);
  expect(job.jobname).toBeNull();
  expect(job.nodeport).toBe(5432);
  expect(cronJobCodec.encode(job)).toContain("9007199254740993");
  const runs = cronRunDetailCodec.decode('(,9223372036854775807,,,,,,,"2026-10-04 01:02:03.123456+00",)');
  expect(runs.jobid).toBeNull();
  expect(runs.runid).toBe(9223372036854775807n);
  expect(runs.start_time).toEqual({ type: "timestamptz", text: "2026-10-04 01:02:03.123456+00" });
  expect(cronRunDetailCodec.decode(cronRunDetailCodec.encode(runs))).toEqual(runs);
  const value = { dimensions: [{ lowerBound: -2, length: 2 }], values: [job, null] };
  expect(cronJobArrayCodec.encode(value)).toMatch(/^\[-2:-1\]=/);
  expect(cronJobArrayCodec.decode('[1:2]={"(1,s,c,h,5432,db,u,t,)",NULL}')).toEqual({
    dimensions: [{ lowerBound: 1, length: 2 }],
    values: [
      { ...job, jobid: 1n, schedule: "s", command: "c", nodename: "h", database: "db", username: "u", active: true },
      null,
    ],
  });
  expect(() => cronJobCodec.decode("()")).toThrow();
});
extensionProofUnitTest(pgCronUnitProofCases[1]!, async () => {
  const adapter = createPgCron_1_6(pgCronDescriptor);
  expect(Object.keys(adapter.sql.functions)).toEqual([]);
  expect(adapter).not.toHaveProperty("schedule");
  const rows = adapter.jobRows('jobs"quoted');
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(rows.from);
  expect(query.sql).toContain('"cron"."job"');
  expect(checkCompiledExtensionQuery(query)[0]).toMatchObject({ member: "table:cron.job", observability: "external" });
  expect(() =>
    withExtensionSqlExecution(
      {
        check(contract) {
          if (contract.observability === "external")
            throw new Error("automatic live query rejects external scheduler state");
        },
      },
      () => extensionSqlDialect(nodePgCodecs).sqlToQuery(adapter.runDetailRows("runs").from),
    ),
  ).toThrow(/external scheduler/);
  expect(() => createPgCron_1_6({ ...pgCronDescriptor, schema: "extensions" })).toThrow(/pg_catalog contract/);
  await expect(
    withPgCron(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...pgCronDescriptor, apiSupport: { status: "unverified" } },
      async () => undefined,
    ),
  ).rejects.toThrow(/exact verified/);
});
extensionProofUnitTest(pgCronUnitProofCases[2]!, () => {
  const ids = source.contract.members.map((m) => m.id).sort();
  expect(pgCronAnnotations.map((m) => m.id).sort()).toEqual(ids);
  expect(pgCronMemberProofs.map((m) => m.id).sort()).toEqual(ids);
  expect(pgCronDatabaseProofCase.claims.map((m) => m.member).sort()).toEqual(ids);
  expect(ids).toHaveLength(70);
  expect(pgCronAnnotations.filter((m) => m.disposition === "tooling")).toHaveLength(6);
  expect(pgCronMemberProofs.every((m) => m.cases.length === 1 && m.citations.length > 0)).toBe(true);
});
