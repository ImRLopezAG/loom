import { expect } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { pgRepackUnitProofCases, pgRepackMemberProofs, pgRepackNativeProofCase } from "../../e2e/fixtures/pg_repack-proof-cases";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import { createPgRepack_1_5_2, pgRepackSqlSchema } from "../../../apps/loom/src/core/extensions/adapters/pg_repack";
import { pgRepackAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_repack";
import { repackRequestValidator, withPgRepack } from "../../../apps/loom/src/tooling/extensions/operations/pg_repack";
import { pgRepackDescriptor, pgRepackDigest } from "../../e2e/fixtures/pg_repack";
import source from "../../../apps/loom/src/tooling/extensions/manifests/pg_repack.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import {
  extensionExpressionContract,
  extensionSqlDialect,
  checkCompiledExtensionQuery,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";

extensionProofUnitTest(pgRepackUnitProofCases[0]!, async () => {
  expect(validateExtensionManifest(v.parse(extensionManifestValidator, source)).digest).toBe(pgRepackDigest);
  expect(source.contract.members).toHaveLength(61);
  expect(pgRepackAnnotations.map((member) => member.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  expect(pgRepackMemberProofs.map((member) => member.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  expect(pgRepackNativeProofCase.claims.map((claim) => claim.member).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  for (const proof of pgRepackMemberProofs) {
    expect(proof.cases.length).toBeGreaterThan(0);
    expect(proof.transfers).toEqual([]);
  }
  const api = createPgRepack_1_5_2(pgRepackDescriptor);
  expect(Object.keys(api.sql.functions).sort()).toEqual(
    [
      "conflicted_triggers",
      "get_alter_col_storage",
      "get_assign",
      "get_columns_for_create_as",
      "get_compare_pkey",
      "get_create_index_type",
      "get_create_trigger",
      "get_drop_columns",
      "get_enable_trigger",
      "get_index_columns",
      "get_order_by",
      "get_storage_param",
      "get_table_and_inheritors",
      "oid2text",
      "repack_indexdef",
      "version",
      "version_sql",
    ].sort(),
  );
  expect(api.createTable).toEqual({
    member: "routine:repack.create_table(pg_catalog.oid,pg_catalog.name)",
    authority: "operator",
  });
  expect(api).not.toHaveProperty("repack");
  expect(() =>
    createPgRepack_1_5_2({ ...pgRepackDescriptor, apiSupport: { status: "verified", digest: "wrong" } }),
  ).toThrow(/exact verified contract/);
  await expect(
    withPgRepack(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...pgRepackDescriptor, apiSupport: { status: "unverified" } },
      async () => undefined,
    ),
  ).rejects.toThrow(/exact verified contract/);
});

extensionProofUnitTest(pgRepackUnitProofCases[1]!, () => {
  const api = createPgRepack_1_5_2({ ...pgRepackDescriptor, schema: "extensions" });
  const dialect = extensionSqlDialect(nodePgCodecs);
  expect(pgRepackSqlSchema).toBe("repack");
  for (const expression of [api.libraryVersion(), api.sqlVersion(), api.oid2text(1), api.getEnableTrigger(1)])
    expect(extensionExpressionContract(expression)?.observability).toBe("external");
  const compiled = dialect.sqlToQuery(sql`select ${api.libraryVersion()}, ${api.oid2text(42)}`);
  expect(compiled.sql).toContain('"repack"."version"');
  expect(compiled.sql).not.toContain('"extensions"."version"');
  expect(compiled.params).toEqual(["42"]);
  const checked: string[] = [];
  withExtensionSqlExecution({ check: (contract) => checked.push(contract.observability) }, () =>
    checkCompiledExtensionQuery(compiled),
  );
  expect(checked).toEqual(["external", "external"]);
  const keys = api.primaryKeys("k");
  const observed: string[] = [];
  const query = dialect.sqlToQuery(sql`select ${keys.columns.indrelid} from ${keys.from}`);
  expect(query.sql).toContain('"repack"."primary_keys"');
  withExtensionSqlExecution({ check: (contract) => observed.push(contract.observability) }, () =>
    checkCompiledExtensionQuery(query),
  );
  expect(observed).toContain("external");
});

extensionProofUnitTest(pgRepackUnitProofCases[2]!, () => {
  expect(
    v.parse(repackRequestValidator, { relation: { schema: "owned", name: "items" }, binary: "/usr/bin/pg_repack" }),
  ).toEqual({ relation: { schema: "owned", name: "items" }, binary: "/usr/bin/pg_repack" });
  for (const request of [
    { relation: { schema: "owned", name: "items" } },
    { relation: { schema: "", name: "items" }, binary: "pg_repack" },
    { relation: { schema: "owned", name: "items" }, binary: "" },
    { relation: { schema: "owned", name: "items" }, binary: "pg_repack", extra: true },
  ])
    expect(() => v.parse(repackRequestValidator, request)).toThrow();
});

extensionProofUnitTest(pgRepackUnitProofCases[3]!, async () => {
  const controller = new AbortController();
  const reason = new Error("Repack cancelled before connection acquisition");
  controller.abort(reason);
  let admitted = false;
  await expect(
    withPgRepack(
      "postgresql://operator@127.0.0.1:1/fixture",
      pgRepackDescriptor,
      async () => {
        admitted = true;
      },
      controller.signal,
    ),
  ).rejects.toBe(reason);
  expect(admitted).toBe(false);
});
