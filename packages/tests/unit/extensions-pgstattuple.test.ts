import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { pgSchema, pgTable, integer } from "drizzle-orm/pg-core";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createPgstattuple_1_5 } from "../../../apps/loom/src/core/extensions/adapters/pgstattuple";
import { createPgrowlocks_1_2 } from "../../../apps/loom/src/core/extensions/adapters/pgrowlocks";
import { relationCodec } from "../../../apps/loom/src/core/extensions/adapters/pgstattuple-codecs";
import {
  extensionExpressionContract,
  extensionSqlDialect,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";
import { pgstattupleAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pgstattuple";
import { pgrowlocksAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pgrowlocks";
import statManifest from "../../../apps/loom/src/tooling/extensions/manifests/pgstattuple.json";
import lockManifest from "../../../apps/loom/src/tooling/extensions/manifests/pgrowlocks.json";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { wave10CallbackUnitCases } from "../../e2e/fixtures/wave10-callback-unit-types-cases";

const dialect = extensionSqlDialect(nodePgCodecs);
const stat = createPgstattuple_1_5({
  name: "pgstattuple",
  version: "1.5",
  schema: 'stat"tuple',
  apiSupport: { status: "verified", digest: statManifest.digest },
});
const locks = createPgrowlocks_1_2({
  name: "pgrowlocks",
  version: "1.2",
  schema: "row locks",
  apiSupport: { status: "verified", digest: lockManifest.digest },
});
const app = pgSchema('app"x');
const documents = app.table("docs.v1", { id: integer().notNull() });
const plain = pgTable("plain", { id: integer() });
const compile = (expression: Parameters<typeof dialect.sqlToQuery>[0]) =>
  withExtensionSqlExecution({ check: () => undefined }, () => dialect.sqlToQuery(expression));

extensionProofUnitTest(
  wave10CallbackUnitCases.find((proof) => proof.families[0]!.extension === "pgstattuple")!,
  () => {
    expect(() =>
      // SAFETY: invalid descriptors exercise runtime admission beyond static types.
      createPgstattuple_1_5({ ...stat, apiSupport: { status: "verified", digest: "wrong" } } as never),
    ).toThrow("pgstattuple 1.5 requires its exact verified contract");
    expect(() =>
      // SAFETY: invalid descriptors exercise runtime admission beyond static types.
      createPgrowlocks_1_2({ ...locks, version: "1.1" } as never),
    ).toThrow("pgrowlocks 1.2 requires its exact verified contract");
  },
);

test("annotations account for every captured member exactly once", () => {
  for (const [manifest, annotations] of [
    [statManifest, pgstattupleAnnotations],
    [lockManifest, pgrowlocksAnnotations],
  ] as const) {
    expect(annotations.map((entry) => entry.id).sort()).toEqual(
      manifest.contract.members.map((member) => member.id).sort(),
    );
    for (const entry of annotations) {
      expect(entry.disposition).toBe("query");
      expect(entry.semantics.observability).toBe("external");
      expect(entry.semantics.providerAcceptance).toBe("pending");
    }
  }
});

test("relation inputs bind quoted qualified names as regclass parameters", () => {
  expect(relationCodec.encode({ schema: 'app"x', name: "docs.v1" })).toBe('"app""x"."docs.v1"');
  expect(() => relationCodec.encode({ schema: "", name: "t" })).toThrow();
  const query = compile(sql`select ${stat.relationPages(documents)}`);
  expect(query.sql).toBe('select "stat""tuple"."pg_relpages"($1::"pg_catalog"."regclass")');
  expect(query.params).toEqual(['"app""x"."docs.v1"']);
  expect(compile(sql`select ${stat.relationPages(plain)}`).params).toEqual(['"public"."plain"']);
  const text = compile(sql`select ${stat.sql.functions.pg_relpages("public.plain")}`);
  expect(text.sql).toContain('($1::"pg_catalog"."text")');
});

test("every overload compiles to its captured member and rejects live observation", () => {
  const expressions = [
    [stat.relationPages(documents), "pg_relpages(pg_catalog.regclass)"],
    [stat.sql.functions.pg_relpages("x"), "pg_relpages(pg_catalog.text)"],
    [stat.tuple(documents), "pgstattuple(pg_catalog.regclass)"],
    [stat.sql.functions.pgstattuple("x"), "pgstattuple(pg_catalog.text)"],
    [stat.tupleApprox(documents), "pgstattuple_approx(pg_catalog.regclass)"],
    [stat.btreeIndex({ schema: "app", name: "i" }), "pgstatindex(pg_catalog.regclass)"],
    [stat.sql.functions.pgstatindex("app.i"), "pgstatindex(pg_catalog.text)"],
    [stat.ginIndex({ schema: "app", name: "g" }), "pgstatginindex(pg_catalog.regclass)"],
    [stat.hashIndex({ schema: "app", name: "h" }), "pgstathashindex(pg_catalog.regclass)"],
  ] as const;
  for (const [expression, member] of expressions)
    expect(extensionExpressionContract(expression)).toMatchObject({
      member: `routine:$extension:pgstattuple.${member}`,
      observability: "external",
    });
  expect(extensionExpressionContract(stat.tuple(documents))?.dependencies).toEqual(['app"x.docs.v1']);
  expect(extensionExpressionContract(stat.sql.functions.pgstattuple("x"))?.dependencies).toEqual([]);
  const rows = locks.rows(documents);
  expect(extensionExpressionContract(locks.sql.functions.pgrowlocks("x"))).toMatchObject({
    member: "routine:$extension:pgrowlocks.pgrowlocks(pg_catalog.text)",
    observability: "external",
  });
  const query = compile(sql`select ${rows.columns.locked_row} from ${rows.from}`);
  expect(query.sql).toBe(
    'select "row_locks"."locked_row" from "row locks"."pgrowlocks"($1::"pg_catalog"."text") as "row_locks"("locked_row", "locker", "multi", "xids", "modes", "pids")',
  );
  expect(query.params).toEqual(['"app""x"."docs.v1"']);
  expect(() =>
    withExtensionSqlExecution(
      {
        check(contract) {
          if (contract.observability !== "tables") throw new Error("live rejected");
        },
      },
      () => dialect.sqlToQuery(sql`select ${stat.tuple(documents)}`),
    ),
  ).toThrow("live rejected");
});

test("record and observation codecs decode exact native text", () => {
  const row = stat.tupleCodec.decode("(8192,3,96,1.171875,1,32,0.390625,7988,97.509765625)");
  expect(row).toEqual({
    table_len: 8192n,
    tuple_count: 3n,
    tuple_len: 96n,
    tuple_percent: 1.171875,
    dead_tuple_count: 1n,
    dead_tuple_len: 32n,
    dead_tuple_percent: 0.390625,
    free_space: 7988n,
    free_percent: 97.509765625,
  });
  expect(stat.hashIndexCodec.decode("(4,1,0,1,0,0,0,NaN)").free_percent).toEqual({ nonfinite: "NaN" });
});

test("no administrative or session members are exposed", () => {
  expect(Object.keys(stat.sql.functions).sort()).toEqual([
    "pg_relpages",
    "pgstatginindex",
    "pgstathashindex",
    "pgstatindex",
    "pgstattuple",
    "pgstattuple_approx",
  ]);
  expect(Object.keys(locks.sql.functions)).toEqual(["pgrowlocks"]);
  expect(Object.keys(stat.sql.operators)).toEqual([]);
});
