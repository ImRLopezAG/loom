import { expect, test } from "vite-plus/test";
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { ltreeUnitProofCase } from "../../e2e/fixtures/ltree-proof-cases";
import type { ExtensionProofEvent } from "../../e2e/fixtures/extension-proof";
import * as v from "valibot";
import { sql, type SQL, type SQLWrapper } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createLtree_1_3, ltree as path } from "../../../apps/loom/src/core/extensions/adapters/ltree";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { extensionIndexAcceptsField, extensionIndexOpclass } from "../../../apps/loom/src/core/extensions/fields";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { ltreeAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/ltree";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/ltree.json";
import { extensionBindingsSource, resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import { buildRequiredApi, validateRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { validateRequiredApiForTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";

const digest = "f0d5b39c468e80a8748a7a35ed30af0e530da547c2c15ebcaee307e34090c82e";
const schemaName = 'unit"Ltree_日本';
const descriptor = {
  name: "ltree",
  version: "1.3",
  schema: schemaName,
  apiSupport: { status: "verified", digest },
} as const;
const ltree = createLtree_1_3(descriptor);
const dialect = extensionSqlDialect(nodePgCodecs);
const render = (expression: SQLWrapper) => dialect.sqlToQuery(sql`select ${expression}`);
const qualified = '"unit""Ltree_日本"';

const builderTree = v.record(v.string(), v.union([v.function(), v.record(v.string(), v.function())]));
// Invoke each public SQL builder with typed sample operands chosen from its captured signature.
function invokeAll(): SQL[] {
  const p = "a.b",
    q = "a.*",
    t = "b",
    a = { dimensions: [{ lowerBound: 1, length: 1 }], values: ["a.b"] },
    qa = { dimensions: [{ lowerBound: 1, length: 1 }], values: ["a.*"] };
  const f = ltree.sql.functions,
    o = ltree.sql.operators;
  return [
    f._lt_q_regex(a, qa),
    f._lt_q_rregex(qa, a),
    f._ltq_extract_regex(a, q),
    f._ltq_regex(a, q),
    f._ltq_rregex(q, a),
    f._ltree_extract_isparent(a, p),
    f._ltree_extract_risparent(a, p),
    f._ltree_isparent(a, p),
    f._ltree_r_isparent(p, a),
    f._ltree_r_risparent(p, a),
    f._ltree_risparent(a, p),
    f._ltxtq_exec(a, t),
    f._ltxtq_extract_exec(a, t),
    f._ltxtq_rexec(t, a),
    f.lquery_send(q),
    f.ltree_send(p),
    f.ltxtq_send(t),
    f.hash_ltree(p),
    f.hash_ltree_extended(p, 1n),
    f.index.path(p, p),
    f.index.offset(p, p, 1),
    f.lca[2](p, p),
    f.lca[3](p, p, p),
    f.lca[4](p, p, p, p),
    f.lca[5](p, p, p, p, p),
    f.lca[6](p, p, p, p, p, p),
    f.lca[7](p, p, p, p, p, p, p),
    f.lca[8](p, p, p, p, p, p, p, p),
    f.lca.array(a),
    f.lt_q_regex(p, qa),
    f.lt_q_rregex(qa, p),
    f.ltq_regex(p, q),
    f.ltq_rregex(q, p),
    f.ltree2text(p),
    f.ltree_addltree(p, p),
    f.ltree_addtext(p, "c"),
    f.ltree_cmp(p, p),
    f.ltree_eq(p, p),
    f.ltree_ge(p, p),
    f.ltree_gt(p, p),
    f.ltree_isparent(p, p),
    f.ltree_le(p, p),
    f.ltree_lt(p, p),
    f.ltree_ne(p, p),
    f.ltree_risparent(p, p),
    f.ltree_textadd("c", p),
    f.ltxtq_exec(p, t),
    f.ltxtq_rexec(t, p),
    f.nlevel(p),
    f.subltree(p, 0, 1),
    f.subpath.offset(p, 1),
    f.subpath.length(p, 0, 1),
    f.text2ltree("a.b"),
    ...(["<", "<=", "<>", "=", ">", ">="] as const).map((name) => o[name](p, p)),
    ...(["@>", "<@", "^@>", "^<@"] as const).flatMap((name) => [
      o[name]["ltree,ltree"](p, p),
      o[name]["ltree,_ltree"](p, a),
      o[name]["_ltree,ltree"](a, p),
    ]),
    ...(["~", "^~"] as const).flatMap((name) => [
      o[name]["ltree,lquery"](p, q),
      o[name]["lquery,ltree"](q, p),
      o[name]["_ltree,lquery"](a, q),
      o[name]["lquery,_ltree"](q, a),
    ]),
    ...(["?", "^?"] as const).flatMap((name) => [
      o[name]["ltree,_lquery"](p, qa),
      o[name]["_lquery,ltree"](qa, p),
      o[name]["_ltree,_lquery"](a, qa),
      o[name]["_lquery,_ltree"](qa, a),
    ]),
    ...(["@", "^@"] as const).flatMap((name) => [
      o[name]["ltree,ltxtquery"](p, t),
      o[name]["ltxtquery,ltree"](t, p),
      o[name]["_ltree,ltxtquery"](a, t),
      o[name]["ltxtquery,_ltree"](t, a),
    ]),
    o["?@>"](a, p),
    o["?<@"](a, p),
    o["?~"](a, q),
    o["?@"](a, t),
    o["||"]["ltree,ltree"](p, p),
    o["||"]["ltree,text"](p, "c"),
    o["||"]["text,ltree"]("c", p),
  ];
}

test("ltree.factory.requiresExactVerifiedContract", () => {
  expect(() => createLtree_1_3({ ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } })).toThrow(
    "ltree 1.3 requires its exact verified contract",
  );
  // @ts-expect-error The selected version is fixed by the factory.
  expect(() => createLtree_1_3({ ...descriptor, version: "1.2" })).toThrow();
  expect(() =>
    // @ts-expect-error Pending support never binds.
    createLtree_1_3({ ...descriptor, apiSupport: { status: "pending", digest } }),
  ).toThrow();
  expect(Object.isFrozen(ltree)).toBe(true);
  expect(Object.isFrozen(ltree.sql.functions)).toBe(true);
  expect(Object.isFrozen(ltree.sql.operators["@>"])).toBe(true);
});

test("ltree.annotations.reconcileAll191CapturedMembers", () => {
  expect(manifest.digest).toBe(digest);
  expect(manifest.contract.version).toBe("1.3");
  const ids = ltreeAnnotations.map((annotation) => annotation.id);
  expect(new Set(ids).size).toBe(191);
  expect([...ids].sort()).toEqual(manifest.contract.members.map((member) => member.id).sort());
  const count = (disposition: string) => ltreeAnnotations.filter((entry) => entry.disposition === disposition).length;
  expect([count("query"), count("schema"), count("internal"), count("tooling")]).toEqual([102, 10, 79, 0]);
  const byId = new Map(manifest.contract.members.map((member) => [member.id, member]));
  for (const annotation of ltreeAnnotations) {
    const member = byId.get(annotation.id)!;
    if (annotation.disposition === "query") expect(["routine", "operator"]).toContain(member.kind);
    if (annotation.disposition === "schema") expect(["type", "opclass"]).toContain(member.kind);
    // Every routine with an `internal` argument or result, every pseudo-type I/O routine and the GiST storage types stay internal.
    if (member.kind === "routine" && annotation.disposition === "query") {
      expect(JSON.stringify(member.arguments)).not.toMatch(/internal|cstring|ltree_gist/);
      expect(member.strict).toBe(true);
    }
  }
});

test("ltree.sql.everyPublicMemberHasOneQualifiedBuilder", () => {
  const built = invokeAll();
  const members = built.map((expression) => extensionExpressionContract(expression)?.member);
  expect(new Set(members).size).toBe(built.length);
  const byCodeUnit = (left: string | undefined, right: string | undefined) =>
    String(left) < String(right) ? -1 : String(left) > String(right) ? 1 : 0;
  expect([...members].sort(byCodeUnit)).toEqual(
    ltreeAnnotations
      .filter((annotation) => annotation.disposition === "query")
      .map((annotation) => annotation.id)
      .sort(byCodeUnit),
  );
  for (const expression of built) expect(render(expression).sql).toContain(qualified);
  // The exported builder tree holds exactly 102 callables, so the invocations above are exhaustive.
  const callables = [ltree.sql.functions, ltree.sql.operators].flatMap((tree) =>
    Object.values(v.parse(builderTree, tree)).flatMap((entry) =>
      v.is(v.function(), entry) ? [entry] : Object.values(entry),
    ),
  );
  expect(callables).toHaveLength(102);
});

test("ltree.sql.operatorsAndOverloadsRenderNativeSignatures", () => {
  const ancestor = render(ltree.isAncestor("Top", "Top.Science"));
  expect(ancestor.sql).toBe(`select ($1::${qualified}."ltree" operator(${qualified}.@>) $2::${qualified}."ltree")`);
  expect(ancestor.params).toEqual(["Top", "Top.Science"]);
  const any = render(ltree.matchesAny("Top", { dimensions: [{ lowerBound: 1, length: 2 }], values: ["*.Top", "x"] }));
  expect(any.sql).toContain(`operator(${qualified}.?)`);
  expect(any.sql).toContain(`::${qualified}."lquery"[]`);
  expect(any.params).toEqual(["Top", '[1:2]={"*.Top","x"}']);
  expect(render(ltree.subpath("a.b", 1)).sql).toMatch(/subpath"\(\$1::.*, \$2::"pg_catalog"."int4"\)$/);
  expect(render(ltree.subpath("a.b", 0, 1)).params).toEqual(["a.b", 0, 1]);
  expect(render(ltree.index("a.b", "b")).params).toEqual(["a.b", "b"]);
  expect(render(ltree.index("a.b", "b", -1)).params).toEqual(["a.b", "b", -1]);
  for (let count = 2; count <= 8; count++) {
    const paths = Array.from({ length: count }, (_, index) => `a.${index}`);
    // @ts-expect-error A runtime tuple of 2-8 paths selects the exact captured lca arity.
    const contract = extensionExpressionContract(ltree.lca(...paths));
    expect(contract?.member).toBe(
      `routine:$extension:ltree.lca(${Array.from({ length: count }, () => "$extension:ltree.ltree").join(",")})`,
    );
  }
  // @ts-expect-error lca has no captured one-path or nine-path routine.
  expect(() => ltree.lca("a")).toThrow("ltree lca accepts 2 to 8 paths");
  expect(render(ltree.hashExtended("a", 42n)).params).toEqual(["a", "42"]);
  expect(render(ltree.isAncestor("Top", "'); drop table x;--")).sql).not.toContain("drop table");
});

test("ltree.schema.fieldsIndexesAndMigrationDdl", async () => {
  expect(extensionIndexOpclass(ltree.indexes.gist({ siglen: 100 }))).toBe(
    `${qualified}."gist_ltree_ops"("siglen"=100)`,
  );
  expect(extensionIndexOpclass(ltree.indexes.arrayGist())).toBe(`${qualified}."gist__ltree_ops"`);
  expect(ltree.indexes.arrayGist({ siglen: 1 })).toMatchObject({
    member: "opclass:$extension:ltree.gist__ltree_ops/gist",
    method: "gist",
    default: true,
    input: { schema: schemaName, type: "ltree", dimensions: 1 },
    nullFreeElements: true,
    options: { siglen: 1 },
  });
  for (const [index, method, opclass] of [
    [ltree.indexes.btree(), "btree", "ltree_ops"],
    [ltree.indexes.hash(), "hash", "hash_ltree_ops"],
    [ltree.indexes.gist(), "gist", "gist_ltree_ops"],
  ] as const) {
    expect(index).toMatchObject({
      method,
      opclass,
      default: true,
      digest,
      member: `opclass:$extension:ltree.${opclass}/${method}`,
    });
    expect(index.input).toEqual({ schema: schemaName, type: "ltree", dimensions: 0 });
    expect(extensionIndexAcceptsField(index, ltree.field().metadata)).toBe(true);
    expect(extensionIndexAcceptsField(index, ltree.arrayField().metadata)).toBe(false);
  }
  expect(extensionIndexAcceptsField(ltree.indexes.arrayGist(), ltree.pathSetField().metadata)).toBe(true);
  // A field admitting NULL elements or higher ranks would make native GiST inserts raise.
  expect(extensionIndexAcceptsField(ltree.indexes.arrayGist(), ltree.arrayField().metadata)).toBe(false);
  expect(extensionIndexAcceptsField(ltree.indexes.arrayGist(), ltree.queryArrayField().metadata)).toBe(false);
  expect(ltree.field().metadata.extension?.operators?.lt).toEqual({
    member: "operator:$extension:ltree.<($extension:ltree.ltree,$extension:ltree.ltree)",
    schema: schemaName,
    name: "<",
    operand: "field",
  });

  const schema = defineSchema(
    () => ({
      nodes: defineTable(
        {
          path: ltree.field().notNull().default(path("Top.Science")),
          tags: ltree
            .pathSetField()
            .notNull()
            .default({ dimensions: [{ lowerBound: 1, length: 1 }], values: [path("Top")] }),
          history: ltree.arrayField(),
          pattern: ltree.queryField(),
          patterns: ltree.queryArrayField(),
          search: ltree.textQueryField(),
          searches: ltree.textQueryArrayField(),
        },
        {
          indexes: [
            { fields: ["path"] as const, extension: ltree.indexes.btree() },
            { fields: ["path"] as const, extension: ltree.indexes.hash() },
            { fields: ["path"] as const, extension: ltree.indexes.gist({ siglen: 100 }) },
            { fields: ["tags"] as const, extension: ltree.indexes.arrayGist({ siglen: 4 }) },
          ],
        },
      ),
    }),
    { namespace: "app" },
  );
  const ddl = (await migrationStatements(await emptySnapshot("app"), await createSnapshot(schema))).join("\n");
  expect(ddl).toContain(`"path" ${qualified}."ltree" DEFAULT 'Top.Science'::${qualified}."ltree" NOT NULL`);
  expect(ddl).toContain(`"tags" ${qualified}."ltree"[] DEFAULT '[1:1]={"Top"}'::${qualified}."ltree"[] NOT NULL`);
  expect(ddl).toContain(`"patterns" ${qualified}."lquery"[]`);
  expect(ddl).toContain(`"searches" ${qualified}."ltxtquery"[]`);
  expect(ddl).toContain(`USING gist ("path" ${qualified}."gist_ltree_ops"("siglen"=100))`);
  expect(ddl).toContain(`USING gist ("tags" ${qualified}."gist__ltree_ops"("siglen"=4))`);
  // Default btree and hash classes resolve natively from the column's selected-schema type.
  expect(ddl).toContain(`CREATE INDEX "nodes_0_idx" ON "app"."nodes" ("path");`);
  expect(ddl).toContain(`CREATE INDEX "nodes_1_idx" ON "app"."nodes" USING hash ("path");`);
  const required = buildRequiredApi({ ltree: { version: "1.3", schema: schemaName } }, schema.metadata);
  assert(required);
  expect(validateRequiredApi(required)).toEqual(required);
  expect(() =>
    validateRequiredApi({
      ...required,
      indexes: required.indexes.map((index) =>
        index.declaration.extension.opclass === "gist__ltree_ops"
          ? {
              ...index,
              declaration: {
                ...index.declaration,
                extension: {
                  ...index.declaration.extension,
                  input: { ...index.declaration.extension.input, dimensions: 0 },
                },
              },
            }
          : index,
      ),
    }),
  ).toThrow(/Required index storage/);
});

// Red until the parent applies packages/e2e/fixtures/ltree-integration.patch to the shared registries.
// The host corroborates this callback's terminal event against Vitest's independent JSON result.
test(ltreeUnitProofCase.title, () => {
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  const output = process.env.LOOM_EXTENSION_PROOF_OUTPUT;
  assert.equal(Boolean(runId), Boolean(output));
  const identity = runId ?? "uncollected";
  function record(event: ExtensionProofEvent) {
    if (output) appendFileSync(output, JSON.stringify(event) + "\n", { mode: 0o600 });
  }
  record({ runId: identity, kind: "registered", definition: ltreeUnitProofCase });
  record({ runId: identity, kind: "started", caseId: ltreeUnitProofCase.id });
  let passed = false;
  try {
    const selection = { ltree: { version: "1.3", schema: 'unit"ltree' } } as const;
    const resolved = resolveSelectedExtension("ltree", selection.ltree);
    expect(resolved.manifest?.digest).toBe(digest);
    const required = buildRequiredApi(selection);
    expect(validateRequiredApiForTarget(required)).toEqual(required);
    expect(required?.apis[0]?.manifest.digest).toBe(digest);
    const generated = extensionBindingsSource(selection);
    expect(generated).toContain(JSON.stringify(digest));
    expect(generated).toContain('from "kello/extensions/ltree"');
    expect(generated).toContain("createLtree_1_3");
    passed = true;
  } finally {
    record({
      runId: identity,
      kind: "terminal",
      caseId: ltreeUnitProofCase.id,
      status: passed ? "passed" : "failed",
      witnessFailures: 0,
    });
  }
});
