import { expect, test } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createPgtap_1_3_3, pgtapRoutineSpecs } from "../../../apps/loom/src/core/extensions/adapters/pgtap";
import { pgtapCodecs } from "../../../apps/loom/src/core/extensions/adapters/pgtap-codecs";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { pgtapAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pgtap";
import source from "../../../apps/loom/src/tooling/extensions/manifests/pgtap.json";
import baseline from "../../e2e/fixtures/pgtap-native-characterization.json";
import { pgtapDescriptor } from "../../e2e/fixtures/pgtap";

test("exact manifest and exhaustive source-checked native member inventory", () => {
  expect(baseline.digest).toBe(source.digest);
  expect(baseline.members).toBe(1119);
  expect(Object.keys(pgtapRoutineSpecs)).toHaveLength(1079);
  expect(new Set(baseline.observations.map((entry) => entry.id))).toEqual(new Set(Object.keys(pgtapRoutineSpecs)));
  expect(new Set([...baseline.observations, ...baseline.nonRoutineObservations].map((entry) => entry.id))).toEqual(
    new Set(source.contract.members.map((entry) => entry.id)),
  );
  expect(
    baseline.observations.every(
      (entry) => entry.outcome === "returned" || entry.outcome === "captured-native-transfer",
    ),
  ).toBe(true);
  expect(new Set(pgtapAnnotations.map((entry) => entry.id))).toEqual(
    new Set(source.contract.members.map((entry) => entry.id)),
  );
  expect(pgtapAnnotations.filter((entry) => entry.disposition === "internal")).toHaveLength(31);
  expect(
    pgtapAnnotations.find((entry) => entry.id === "routine:$extension:pgtap.diag(pg_catalog.text)")?.disposition,
  ).toBe("query");
  expect(pgtapAnnotations.find((entry) => entry.id === 'view:"$extension:pgtap".tap_funky')?.disposition).toBe(
    "tooling",
  );
});
test("typed query functions qualify placements, bind values, and exclude native test state", () => {
  const api = createPgtap_1_3_3({ ...pgtapDescriptor, schema: 'tap"native' });
  const expression = api.diag("line\nvalue");
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);
  expect(query.sql).toContain('"tap""native"."diag"');
  expect(query.params).toEqual(["line\nvalue"]);
  expect(extensionExpressionContract(expression)).toMatchObject({
    member: "routine:$extension:pgtap.diag(pg_catalog.text)",
    observability: "external",
  });
  expect(Object.keys(api.sql.overloads)).toHaveLength(102);
  expect("routine:$extension:pgtap.ok(pg_catalog.bool)" in api.sql.overloads).toBe(false);
  expect(() => createPgtap_1_3_3({ ...pgtapDescriptor, apiSupport: { status: "verified", digest: "wrong" } })).toThrow(
    "exact verified manifest",
  );
});
test("packed VARIADIC calls retain native array bounds; sibling-resolving overloads remain operator calls", () => {
  const api = createPgtap_1_3_3(pgtapDescriptor);
  const dialect = extensionSqlDialect(nodePgCodecs);
  expect("routine:$extension:pgtap.diag(pg_catalog.anyelement)" in api.sql.overloads).toBe(false);
  const query = dialect.sqlToQuery(
    api.collectTap({ dimensions: [{ lowerBound: -2, length: 2 }], values: ["ok 1", null] }),
  );
  expect(query.sql).toContain("VARIADIC");
  expect(query.params).toEqual(['[-2:-1]={"ok 1",NULL}']);
});
test("all native result domains preserve nullable TAP, exact decimals, arrays, composite attributes", () => {
  const codecs = pgtapCodecs("tap");
  expect(codecs.text.decode("not ok 1 - failure\n# detail")).toBe("not ok 1 - failure\n# detail");
  expect(codecs.text.decode(null)).toBeNull();
  expect(codecs.numeric.decode("1.30000000000000000001")).toBe("1.30000000000000000001");
  expect(codecs._name.decode('[0:2]={"a,b",NULL,"NULL"}')).toEqual({
    dimensions: [{ lowerBound: 0, length: 3 }],
    values: ["a,b", null, "NULL"],
  });
  expect(codecs._time_trial_type.decode("(0.000001)")).toEqual({ a_time: "0.000001" });
  expect(codecs.__time_trial_type.decode('{"(1.1)",NULL,"()"}')).toEqual({
    dimensions: [{ lowerBound: 1, length: 3 }],
    values: [{ a_time: "1.1" }, null, { a_time: null }],
  });
  expect(() => codecs.oid.decode("4294967296")).toThrow();
  expect(() => codecs._time_trial_type.decode("(1,2)")).toThrow();
});
