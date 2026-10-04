import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { wave10CallbackUnitCases } from "../../e2e/fixtures/wave10-callback-unit-types-cases";
import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { integer, pgMaterializedView, pgTable, pgView } from "drizzle-orm/pg-core";
import { createTsmSystemRows_1_0 } from "../../../apps/loom/src/core/extensions/adapters/tsm-system-rows";
import {
  checkCompiledExtensionQuery,
  extensionSqlDialect,
  withExtensionSqlExecution,
  type ExtensionExpressionContract,
} from "../../../apps/loom/src/core/extensions/sql";
import { tsmSystemRowsAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/tsm-system-rows";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/tsm_system_rows.json";

const verified = {
  name: "tsm_system_rows",
  version: "1.0",
  schema: 'sample"s',
  apiSupport: { status: "verified", digest: "cb606ea0ec43b299ed4776aaeb12126165f751dbf9c5d40a974df6a8a7067eec" },
} as const;
const extension = createTsmSystemRows_1_0(verified);
const dialect = extensionSqlDialect(nodePgCodecs);
const items = pgTable("items", { id: integer("id") });

extensionProofUnitTest(
  wave10CallbackUnitCases.find((entry) => entry.id === "tsm_system_rows.unit-contracts")!,
  () => {
    expect(manifest.digest).toBe(verified.apiSupport.digest);
    for (const descriptor of [
      { ...verified, name: "tsm_system_other" },
      { ...verified, version: "1.1" },
      { ...verified, apiSupport: { status: "unverified" } },
      { ...verified, apiSupport: { status: "verified", digest: "wrong" } },
    ])
      // SAFETY: invalid JavaScript descriptors exercise admission beyond the static signature.
      expect(() => createTsmSystemRows_1_0(descriptor as never)).toThrow("requires its exact verified contract");
  },
);

test("tsm_system_rows renders a quoted, schema-qualified TABLESAMPLE source with an external contract", () => {
  const query = dialect.sqlToQuery(sql`select ${items.id} from ${extension.systemRows(items, 5n)}`);
  expect(query.sql).toBe(
    'select "items"."id" from "items" tablesample "sample""s"."system_rows"($1::"pg_catalog"."int8")',
  );
  expect(query.params).toEqual(["5"]);
  expect(dialect.sqlToQuery(sql`select 1 from ${extension.sample(items, 5)}`).params).toEqual(["5"]);

  const checked: [ExtensionExpressionContract, readonly string[] | undefined][] = [];
  withExtensionSqlExecution({ check: (contract, relations) => checked.push([contract, relations]) }, () =>
    checkCompiledExtensionQuery(query),
  );
  expect(checked).toEqual([
    [
      {
        member: manifest.contract.members[0]!.id,
        codec: "pg:tsm_handler:tablesample-clause:1",
        dependencies: [],
        observability: "external",
      },
      ["public.items"],
    ],
  ]);
});

test("tsm_system_rows rejects arguments and relations that native TABLESAMPLE rejects", () => {
  for (const value of [-1, 1.5, 2n ** 63n, -1n, Number.NaN, null, "5"])
    // SAFETY: invalid JavaScript values exercise runtime validation beyond the static signature.
    expect(() => extension.systemRows(items, value as never)).toThrow();
  const view = pgView("item_view", { id: integer("id") }).existing();
  // SAFETY: a view is statically excluded; the runtime guard mirrors the native error.
  expect(() => extension.systemRows(view as never, 1)).toThrow("TABLESAMPLE requires a table or materialized view");
  const materialized = pgMaterializedView("item_summary", { id: integer("id") }).existing();
  expect(dialect.sqlToQuery(sql`select 1 from ${extension.systemRows(materialized, 1)}`).sql).toContain(
    '"item_summary" tablesample',
  );
});

test("tsm_system_rows exposes no scalar helper and accounts for every captured member", () => {
  expect(extension.sql.functions).toEqual({});
  expect(Object.keys(extension.sql.sampling)).toEqual(["system_rows"]);
  expect(extension.sampling).toMatchObject({ repeatable: false, observability: "external" });
  expect(tsmSystemRowsAnnotations.map((entry) => [entry.id, entry.disposition])).toEqual(
    manifest.contract.members.map((member) => [member.id, "schema"]),
  );
});
