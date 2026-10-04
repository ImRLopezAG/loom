import * as v from "valibot";
import baselineEvidence from "../../../docs/architecture/evidence/neon-extension-capability-map-2026-10-02.json";
import { validateExtensionSemanticProof } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { registerHllSemanticProof } from "../../e2e/fixtures/hll-semantic-proof";
import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { hllMemberProofs, hllUnitProofCase } from "../../e2e/fixtures/hll-proof-cases";
import { createHll_2_21, hllSketch } from "../../../apps/loom/src/core/extensions/adapters/hll";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/hll.json";
import { hllAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/hll";
import { withHllSession } from "../../../apps/loom/src/tooling/extensions/hll";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";

const digest = "44f6623b1b7a463ea7cb26fcd02b434cb33c36a4bd9edfe0397e2536f66f6b19";
const descriptor = {
  name: "hll",
  version: "2.21",
  schema: 'Hll"日本',
  apiSupport: { status: "verified", digest },
} as const;
const toQuery = (expression: Parameters<ReturnType<typeof extensionSqlDialect>["sqlToQuery"]>[0]) =>
  extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);

extensionProofUnitTest(hllUnitProofCase, async () => {
  expect(manifest.digest).toBe(digest);
  expect(hllAnnotations.map((entry) => entry.id).sort()).toEqual(
    manifest.contract.members.map((entry) => entry.id).sort(),
  );
  const counts = {
    query: hllAnnotations.filter((entry) => entry.disposition === "query"),
    internal: hllAnnotations.filter((entry) => entry.disposition === "internal"),
    tooling: hllAnnotations.filter((entry) => entry.disposition === "tooling"),
    schema: hllAnnotations.filter((entry) => entry.disposition === "schema"),
  };
  expect({
    query: counts.query.length,
    internal: counts.internal.length,
    tooling: counts.tooling.length,
    schema: counts.schema.length,
  }).toEqual({ query: 50, internal: 19, tooling: 3, schema: 4 });
  const api = createHll_2_21(descriptor);
  // Every query disposition, and nothing else, is bound by exact captured identity.
  expect(Object.keys(api.sql.overloads).sort()).toEqual(counts.query.map((entry) => entry.id).sort());
  for (const [member, binding] of Object.entries(api.sql.overloads)) expect(binding, member).toBeTypeOf("function");
  expect(
    hllMemberProofs
      .filter((proof) => proof.transfers.length)
      .map((proof) => proof.id)
      .sort(),
  ).toEqual(
    counts.internal
      .map((entry) => entry.id)
      .filter((id) => !id.includes("_unpacked("))
      .sort(),
  );
  expect(hllMemberProofs.filter((proof) => proof.cases.length).length).toBe(60);

  const sketch = hllSketch("118b7f");
  expect(api.codec.encode(sketch)).toBe("\\x118b7f");
  expect(api.codec.decode("\\x118b7f")).toEqual(sketch);
  for (const malformed of ["118b7f", "\\x", "\\x1", "\\x118B7F", "\\x11 8b"])
    expect(() => api.codec.decode(malformed)).toThrow();
  for (const malformed of ["", "1", "ABCD", "zz"]) expect(() => hllSketch(malformed)).toThrow();
  expect(api.hashvalCodec.encode(-9223372036854775808n)).toBe("-9223372036854775808");
  expect(api.hashvalCodec.decode("9223372036854775807")).toBe(9223372036854775807n);
  expect(() => api.hashvalCodec.encode(9223372036854775808n)).toThrow();
  expect(() => api.hashvalCodec.decode("1.5")).toThrow();
  const array = {
    dimensions: [{ lowerBound: -1, length: 2 }],
    values: [sketch, null],
  };
  expect(api.arrayCodec.encode(array)).toBe('[-1:0]={"\\\\x118b7f",NULL}');
  expect(api.arrayCodec.decode(api.arrayCodec.encode(array))).toEqual(array);
  expect(() =>
    api.arrayCodec.encode({
      dimensions: [{ lowerBound: 2147483647, length: 1 }],
      values: [sketch],
    }),
  ).toThrow();
  expect(api.hashvalArrayCodec.decode("{1,NULL}")).toEqual({
    dimensions: [{ lowerBound: 1, length: 2 }],
    values: [1n, null],
  });

  const add = api.add(sketch, 7n);
  expect(extensionExpressionContract(add)?.member).toBe(
    "routine:$extension:hll.hll_add($extension:hll.hll,$extension:hll.hll_hashval)",
  );
  const query = toQuery(add);
  expect(query.sql).toBe('"Hll""日本"."hll_add"($1::"Hll""日本"."hll", $2::"Hll""日本"."hll_hashval")');
  expect(query.params).toEqual(["\\x118b7f", "7"]);
  expect(toQuery(api.sql.operators.cardinality(sketch)).sql).toBe('(operator("Hll""日本".#) $1::"Hll""日本"."hll")');
  expect(toQuery(api.hash.integer(7)).sql).toBe('"Hll""日本"."hll_hash_integer"($1::"pg_catalog"."int4")');
  expect(toQuery(api.hash.any(sql`label`)).sql).toBe('"Hll""日本"."hll_hash_any"(label)');
  expect(toQuery(api.empty.expthresh(10, 4, -1n)).params).toEqual([10, 4, "-1"]);
  const modified = toQuery(
    api.sql.casts.hll_to_hll(sketch, {
      log2m: 12,
      regwidth: 5,
      expthresh: -1,
      sparseon: 1,
    }),
  );
  expect(modified.sql).toBe('(($1)::"Hll""日本"."hll")::"Hll""日本"."hll"(12,5,-1,1)');
  expect(() =>
    api.sql.casts.hll_to_hll(sketch, {
      log2m: 1.5,
      regwidth: 5,
      expthresh: -1,
      sparseon: 1,
    }),
  ).toThrow();
  expect(toQuery(api.sql.casts.int8_to_hll_hashval(5n)).sql).toBe(
    '(($1)::"pg_catalog"."int8")::"Hll""日本"."hll_hashval"',
  );
  expect(toQuery(api.sql.functions.hll_typmod_in(["12", "5"])).params).toEqual(['{"12","5"}']);
  // Native hll types have no equality opclass, so DISTINCT aggregates are not offered.
  for (const aggregate of [...Object.values(api.addAggregate), api.unionAggregate]) {
    expect("distinct" in aggregate).toBe(false);
    expect(aggregate.filter).toBeTypeOf("function");
    expect(aggregate.over).toBeTypeOf("function");
  }
  expect(toQuery(api.addAggregate.hashval.filter(sql<boolean>`ok`, sql<bigint>`hv`)).sql).toBe(
    '"Hll""日本"."hll_add_agg"(hv) filter (where ok)',
  );
  expect(api.field({ log2m: 10, regwidth: 4, expthresh: -1, sparseon: 1 }).metadata.extension).toMatchObject({
    type: "hll",
    schema: descriptor.schema,
    codec: "hll:hll:hex:1",
    typmods: [10, 4, -1, 1],
  });
  expect(api.hashvalArrayField().metadata.extension).toMatchObject({
    type: "hll_hashval",
    array: true,
    member: "type:$extension:hll._hll_hashval",
  });
  expect(() =>
    createHll_2_21({
      ...descriptor,
      apiSupport: { status: "verified", digest: "wrong" },
    }),
  ).toThrow();
  await expect(
    withHllSession(
      "postgres://unused/db",
      {
        ...descriptor,
        schema: "hll_ops",
        apiSupport: { status: "verified", digest: "wrong" },
      },
      async () => 1,
    ),
  ).rejects.toThrow("exact verified 2.21 contract");
  for (const annotation of hllAnnotations)
    expect(annotation.semantics).toMatchObject({
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    });
});

test("hll registration passes semantic-proof structure and stays pending without host receipts", () => {
  const baseline = baselineEvidence.entries.map((entry) => ({
    name: entry.name,
    version: entry.postgres18ListedVersion,
    disposition: v.parse(
      v.picklist(["eligible", "unavailable-pg18", "existing-only", "deprecated", "builtin", "decoder-plugin"]),
      entry.providerStatus === "listed-pg18" ? "eligible" : entry.providerStatus,
    ),
  }));
  const input = registerHllSemanticProof({
    baseline,
    manifests: [],
    cases: [],
    receipts: [],
    currentSources: [],
    artifact: null,
    declarations: baseline.map((entry) =>
      entry.disposition === "eligible"
        ? { extension: entry.name, state: "pending" as const, prerequisite: "Not implemented or accepted" }
        : { extension: entry.name, state: "excluded" as const, reason: entry.disposition },
    ),
  });
  // Throws on any disposition or transfer that disagrees with the pinned manifest's captured slots.
  const family = validateExtensionSemanticProof(input).families.find((entry) => entry.extension === "hll")!;
  expect(family.state).toBe("pending");
  expect(family.blockers.length).toBeGreaterThan(0);
});
