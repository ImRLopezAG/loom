import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import {
  dblinkUnitProofCases,
  dblinkMemberProofs,
  dblinkDatabaseProofCases,
  dblinkDatabaseFixtureCount,
  dblinkDatabaseRoleCount,
} from "../../e2e/fixtures/dblink-proof-cases";
import { expect } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { createDblink_1_2 } from "../../../apps/loom/src/core/extensions/adapters/dblink";
import {
  dblinkInt2vectorCodec,
  dblinkNotifyCodec,
  dblinkNotifyFields,
  dblinkPkeyCodec,
  dblinkPkeyFields,
  dblinkTextArrayCodec,
} from "../../../apps/loom/src/core/extensions/adapters/dblink-codecs";
import {
  dblinkConnectValidator,
  dblinkSqlValidator,
  withDblink,
} from "../../../apps/loom/src/tooling/extensions/operations/dblink";
import { dblinkAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/dblink";
import {
  checkCompiledExtensionQuery,
  extensionExpressionContract,
  extensionSqlDialect,
} from "../../../apps/loom/src/core/extensions/sql";
import * as v from "valibot";
import source from "../../../apps/loom/src/tooling/extensions/manifests/dblink.json";

const descriptor = {
  name: "dblink",
  version: "1.2",
  schema: 'db"link',
  apiSupport: { status: "verified", digest: source.digest },
} as const;
const queryFunctions = [
  "dblink_build_sql_delete",
  "dblink_build_sql_insert",
  "dblink_build_sql_update",
  "dblink_current_query",
  "dblink_get_connections",
  "dblink_get_pkey",
] as const;
const remoteNames = [
  "dblink",
  "dblink_connect",
  "dblink_connect_u",
  "dblink_disconnect",
  "dblink_exec",
  "dblink_open",
  "dblink_fetch",
  "dblink_close",
  "dblink_send_query",
  "dblink_get_result",
  "dblink_is_busy",
  "dblink_cancel_query",
  "dblink_error_message",
  "dblink_get_notify",
  "dblink_fdw_validator",
] as const;

extensionProofUnitTest(dblinkUnitProofCases[0]!, () => {
  const binding = createDblink_1_2(descriptor);
  expect(Object.keys(binding.sql.functions).sort()).toEqual([...queryFunctions]);
  for (const name of remoteNames) expect(binding.sql.functions).not.toHaveProperty(name);
  expect(binding.connect.authority).toBe("session");
  expect(binding.connectUnnamed.authority).toBe("session");
  expect(binding.connectU.authority).toBe("session");
  expect(binding.exec.authority).toBe("session");
  expect(binding.query.authority).toBe("session");
  expect(binding.validator.authority).toBe("internal");
  expect(binding.foreignDataWrapper).toEqual({
    member: "foreign-data wrapper:dblink_fdw",
    name: "dblink_fdw",
    handler: null,
    validator: "routine:$extension:dblink.dblink_fdw_validator(pg_catalog._text,pg_catalog.oid)",
  });
  expect(extensionExpressionContract(binding.sql.functions.dblink_get_connections())?.observability).toBe("session");
  expect(extensionExpressionContract(binding.sql.functions.dblink_current_query())?.observability).toBe("session");
  expect(() => createDblink_1_2({ ...descriptor, apiSupport: { status: "unverified" } })).toThrow(
    /exact verified contract/,
  );
});

extensionProofUnitTest(dblinkUnitProofCases[1]!, async () => {
  expect(dblinkAnnotations.map((annotation) => annotation.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  expect(dblinkMemberProofs.map((proof) => proof.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  expect(dblinkAnnotations).toHaveLength(45);
  expect(Object.keys(createDblink_1_2(descriptor).sql.overloads).sort()).toEqual(
    source.contract.members.filter((member) => member.kind === "routine").map((member) => member.id).sort(),
  );
  for (const proof of dblinkMemberProofs) {
    expect(proof.cases.length).toBeGreaterThan(0);
    expect(proof.transfers).toEqual([]);
    expect(proof.cases[0]!.scenario).not.toBe("missing-scenario");
  }
  expect(
    [
      ...new Set(dblinkDatabaseProofCases.flatMap((definition) => definition.claims.map((claim) => claim.member))),
    ].sort(),
  ).toEqual(source.contract.members.map((member) => member.id).sort());
  expect(dblinkDatabaseProofCases.map((definition) => definition.id)).toEqual(["dblink.native"]);
  expect(dblinkDatabaseFixtureCount).toBe(2);
  expect(dblinkDatabaseRoleCount).toBe(0);
  await expect(
    withDblink(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...descriptor, apiSupport: { status: "unverified" } },
      async () => undefined,
    ),
  ).rejects.toThrow(/exact verified contract/);
});

extensionProofUnitTest(dblinkUnitProofCases[2]!, () => {
  expect(Object.keys(dblinkPkeyFields)).toEqual(["position", "colname"]);
  expect(Object.keys(dblinkNotifyFields)).toEqual(["notify_name", "be_pid", "extra"]);
  expect(dblinkPkeyCodec.decode("(1,id)")).toEqual({ position: 1, colname: "id" });
  expect(dblinkPkeyCodec.decode("(,)")).toEqual({ position: null, colname: null });
  expect(dblinkNotifyCodec.decode("(probe,42,extra)")).toEqual({
    notify_name: "probe",
    be_pid: 42,
    extra: "extra",
  });
  expect(dblinkInt2vectorCodec.encode("1")).toBe("1");
  expect(dblinkInt2vectorCodec.decode("1 2")).toBe("1 2");
  expect(dblinkTextArrayCodec.decode("{named}")).toEqual({
    dimensions: [{ lowerBound: 1, length: 1 }],
    values: ["named"],
  });
  expect(dblinkTextArrayCodec.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(v.parse(dblinkConnectValidator, { connection: "named", connstr: "host=local" })).toEqual({
    connection: "named",
    connstr: "host=local",
  });
  for (const request of [{ connstr: "" }, { connstr: "x\0y" }, { connection: "", connstr: "host=local" }, {}])
    expect(() => v.parse(dblinkConnectValidator, request)).toThrow();
  expect(() => v.parse(dblinkSqlValidator, { sql: "" })).toThrow();
  const dialect = extensionSqlDialect(nodePgCodecs);
  const binding = createDblink_1_2(descriptor);
  const compiled = dialect.sqlToQuery(sql`select ${binding.connections()}`);
  expect(compiled.sql).toContain('"db""link"."dblink_get_connections"');
  expect(checkCompiledExtensionQuery(compiled)[0]?.observability).toBe("session");
  const pkey = dialect.sqlToQuery(sql`select ${binding.getPkey("local_items")}`);
  expect(pkey.params).toEqual(["local_items"]);
  expect(checkCompiledExtensionQuery(pkey)[0]?.observability).toBe("tables");
  const quoted = dialect.sqlToQuery(sql`select ${binding.getPkey({ schema: "public", name: "local_items" })}`);
  expect(quoted.params).toEqual(['"public"."local_items"']);
});

extensionProofUnitTest(dblinkUnitProofCases[3]!, async () => {
  const controller = new AbortController();
  const reason = new Error("dblink cancelled before connection acquisition");
  controller.abort(reason);
  let admitted = false;
  await expect(
    withDblink(
      "postgresql://operator@127.0.0.1:1/fixture",
      descriptor,
      async () => {
        admitted = true;
      },
      controller.signal,
    ),
  ).rejects.toBe(reason);
  expect(admitted).toBe(false);
});
