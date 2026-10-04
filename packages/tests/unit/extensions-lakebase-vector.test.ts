import { expect, test } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { lakebaseVectorUnitProofCase } from "../../e2e/fixtures/lakebase-vector-proof-cases";
import {
  createLakebaseVector_1_1_1,
  rabitqNativeText,
} from "../../../apps/loom/src/core/extensions/adapters/lakebase-vector";
import { lakebaseVectorAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/lakebase-vector";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/lakebase_vector.json";
import { extensionSqlDialect, extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { nodePgCodecs } from "drizzle-orm/node-postgres";

const digest = "bfa194865eaeda1069f2743247af32e0609848bdee87f1565e17cefc231fec20";
const descriptor = {
  name: "lakebase_vector",
  version: "1.1.1",
  schema: 'Lake"日本',
  apiSupport: { status: "verified", digest },
} as const;
const companion = {
  name: "vector",
  version: "0.8.6",
  schema: 'Vec"日本',
  apiSupport: { status: "verified", digest: "4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4" },
} as const;

function callableIds(members: typeof manifest.contract.members) {
  return members
    .filter((member) => {
      if (member.kind === "operator") return true;
      if (member.kind !== "routine") return false;
      const blocked = (member.arguments ?? []).some((argument) =>
        ["internal", "cstring", "_cstring"].includes(argument.type.name),
      );
      const result = member.returns?.name;
      return !blocked && !["cstring", "internal", "index_am_handler"].includes(result ?? "");
    })
    .map((member) => member.id);
}

extensionProofUnitTest(lakebaseVectorUnitProofCase, () => {
  expect(manifest.digest).toBe(digest);
  expect(manifest.contract.members).toHaveLength(212);
  const api = createLakebaseVector_1_1_1(descriptor, companion);
  const token = rabitqNativeText("[uncharacterized-native]");
  expect(api.codecs.rabitq4.decode(api.codecs.rabitq4.encode(token))).toEqual(token);
  // SAFETY: Intentionally violate the input type to exercise the codec's existing runtime parser.
  expect(() => api.codecs.rabitq4.encode([1, 2, 3] as never)).toThrow();
  const sphere = { center: token, radius: 0.5 };
  expect(api.codecs.sphereRabitq4.decode(api.codecs.sphereRabitq4.encode(sphere))).toEqual(sphere);
  expect(api.field.rabitq4().metadata.extension?.member).toBe("type:$extension:lakebase_vector.rabitq4");
  expect(api.indexes.ann.vector.l2().member).toBe("opclass:$extension:lakebase_vector.vector_l2_ops/lakebase_ann");
});

test("lakebase_vector exact membership, schema identity and canonical SQL", () => {
  const api = createLakebaseVector_1_1_1(descriptor, companion);
  expect(lakebaseVectorAnnotations.map((row) => row.id).sort()).toEqual(
    manifest.contract.members.map((row) => row.id).sort(),
  );
  expect(new Set(lakebaseVectorAnnotations.map((row) => row.id)).size).toBe(212);
  expect(Object.keys(api.sql.overloads).sort()).toEqual(callableIds(manifest.contract.members).sort());
  const vector = [3, 1, 2];
  const expression = api.withinCosine(vector, api.sphere.vector(vector, 0.5));
  expect(extensionExpressionContract(expression)?.member).toBe(
    "operator:$extension:lakebase_vector.<<=>>($extension:vector.vector,$extension:lakebase_vector.sphere_vector)",
  );
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);
  expect(query.sql).toContain('operator("Lake""日本".<<=>>)');
  expect(query.params[0]).toBe("[3,1,2]");
  expect(api.accessMethods.lakebase_ann.handler).toBe(
    "routine:$extension:lakebase_vector.lakebase_annv1_amhandler(pg_catalog.internal)",
  );
  expect(api.accessMethods.lakebase_annv0.handler).toBe(
    "routine:$extension:lakebase_vector.lakebase_annv0_amhandler(pg_catalog.internal)",
  );
  const classes = manifest.contract.members.filter((member) => member.kind === "opclass");
  expect(classes).toHaveLength(24);
  const declared = [
    api.indexes.ann.vector.l2(),
    api.indexes.annv0.vector.l2(),
    api.indexes.ann.vector.ip(),
    api.indexes.annv0.vector.ip(),
    api.indexes.ann.vector.cosine(),
    api.indexes.annv0.vector.cosine(),
    api.indexes.ann.halfvec.l2(),
    api.indexes.annv0.halfvec.l2(),
    api.indexes.ann.halfvec.ip(),
    api.indexes.annv0.halfvec.ip(),
    api.indexes.ann.halfvec.cosine(),
    api.indexes.annv0.halfvec.cosine(),
    api.indexes.ann.rabitq4.l2(),
    api.indexes.annv0.rabitq4.l2(),
    api.indexes.ann.rabitq4.ip(),
    api.indexes.annv0.rabitq4.ip(),
    api.indexes.ann.rabitq4.cosine(),
    api.indexes.annv0.rabitq4.cosine(),
    api.indexes.ann.rabitq8.l2(),
    api.indexes.annv0.rabitq8.l2(),
    api.indexes.ann.rabitq8.ip(),
    api.indexes.annv0.rabitq8.ip(),
    api.indexes.ann.rabitq8.cosine(),
    api.indexes.annv0.rabitq8.cosine(),
  ];
  expect(declared.map((entry) => entry.member).sort()).toEqual(classes.map((entry) => entry.id).sort());
  expect(api.storage({ buildMode: "quality", lists: "1000" })).toEqual({
    build_mode: "quality",
    lists: "1000",
  });
  // SAFETY: Intentionally invalid build mode exercises the storage contract's runtime parser.
  expect(() => api.storage({ buildMode: "slow" as never })).toThrow();
  expect(api.indexFormat.latest).toBe("_2");
  expect(api.indexFormat.rebuild.transactional).toBe(false);
  const setting = extensionSqlDialect(nodePgCodecs).sqlToQuery(api.settings.probes("10"));
  expect(setting.sql).toContain('"pg_catalog"."set_config"');
  expect(setting.params).toEqual(["lakebase_ann.probes", "10"]);
  expect(() =>
    createLakebaseVector_1_1_1({ ...descriptor, apiSupport: { status: "verified", digest: "wrong" } }, companion),
  ).toThrow();
  for (const row of lakebaseVectorAnnotations) {
    expect(row.semantics.providerAcceptance).toBe("pending");
    expect(row.semantics.publicExportAcceptance).toBe("pending");
  }
});

test("lakebase_vector binds the selected companion contract in a distinct schema", () => {
  const api = createLakebaseVector_1_1_1(descriptor, companion);
  const dialect = extensionSqlDialect(nodePgCodecs);
  const vector = [3, 1, 2];
  for (const expression of [api.quantize.rabitq4.fromVector(vector), api.sphere.vector(vector, 0.5)]) {
    const query = dialect.sqlToQuery(expression);
    expect(query.sql).toContain('"Vec""日本"."vector"');
    expect(query.sql).toContain('"Lake""日本".');
    expect(query.sql).not.toContain('"Lake""日本"."vector"');
  }
  expect(dialect.sqlToQuery(api.quantize.rabitq8.fromHalfvec(vector)).sql).toContain('"Vec""日本"."halfvec"');
  expect(api.companion).toEqual(companion);
  expect(Object.isFrozen(api.companion)).toBe(true);
  for (const family of [api.indexes.ann, api.indexes.annv0]) {
    for (const metric of ["l2", "ip", "cosine"] as const) {
      expect(family.vector[metric]().input.schema).toBe(companion.schema);
      expect(family.halfvec[metric]().input.schema).toBe(companion.schema);
      expect(family.vector[metric]().schema).toBe(descriptor.schema);
      expect(family.rabitq4[metric]().input.schema).toBe(descriptor.schema);
      expect(family.rabitq8[metric]().input.schema).toBe(descriptor.schema);
    }
  }
  expect(api.codecs.sphereVector.sqlType).toEqual({ schema: descriptor.schema, name: "sphere_vector" });
  expect(api.codecs.sphereHalfvec.sqlType).toEqual({ schema: descriptor.schema, name: "sphere_halfvec" });
  const sphere = { center: vector, radius: 0.5 };
  expect(api.codecs.sphereVector.decode(api.codecs.sphereVector.encode(sphere))).toEqual(sphere);
  for (const invalid of [
    { ...companion, version: "0.8.5" },
    { ...companion, name: "other" },
    { ...companion, apiSupport: { status: "unverified" } },
    { ...companion, apiSupport: { status: "verified", digest: "wrong" } },
  ]) {
    // SAFETY: Deliberately bypass the input type to prove the exact companion identity is checked at runtime.
    expect(() => createLakebaseVector_1_1_1(descriptor, invalid as never)).toThrow(/companion/);
  }
});
