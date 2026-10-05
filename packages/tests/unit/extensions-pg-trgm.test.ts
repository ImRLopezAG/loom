import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/pg_trgm.json";
import {
  pgTrgmAnnotations,
  pgTrgmAnnotationContract,
} from "../../../apps/loom/src/tooling/extensions/annotations/pg-trgm";
import type { SQL } from "drizzle-orm";
import { expect } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { pgTrgmQueryMembers, pgTrgmUnitProofCases } from "../../e2e/fixtures/pg-trgm-proof-cases";
import { nodePgCodecs } from "drizzle-orm/node-postgres/codecs";
import { createPgTrgm_1_6 } from "../../../apps/loom/src/core/extensions/adapters/pg-trgm";
import { extensionSqlDialect, extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";

const descriptor = {
  name: "pg_trgm",
  version: "1.6",
  schema: "search",
  apiSupport: { status: "verified", digest: "88e35b55b09e58d6a59847390006ca73483bdb4444346474beb644c63adcbe66" },
} as const;
function unitCase(title: string) {
  const definition = pgTrgmUnitProofCases.find((entry) => entry.title === title);
  if (!definition) throw new Error(`Unregistered pg_trgm unit case: ${title}`);
  return definition;
}

extensionProofUnitTest(unitCase("pg_trgm.parametersAndObservability"), () => {
  const api = createPgTrgm_1_6(descriptor);
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(api.similarity("word", "two words"));
  expect(query.sql).toContain('"search"."similarity"');
  expect(query.sql).not.toContain("two words");
  expect(query.params).toEqual(["word", "two words"]);
  expect(extensionExpressionContract(api.similarity("a", "b"))?.observability).toBe("tables");
  expect(extensionExpressionContract(api.sql.operators["%"]("a", "b"))?.observability).toBe("session");
  expect(extensionExpressionContract(api.sql.functions.show_limit())?.observability).toBe("session");
  expect(api.sql.functions).not.toHaveProperty("set_limit");
  expect(api).not.toHaveProperty("setLimit");
});

extensionProofUnitTest(unitCase("pg_trgm.completeCanonicalSurface"), () => {
  const api = createPgTrgm_1_6(descriptor);
  expect(Object.keys(api.sql.functions)).toEqual([
    "similarity",
    "word_similarity",
    "strict_word_similarity",
    "similarity_dist",
    "word_similarity_dist_op",
    "word_similarity_dist_commutator_op",
    "strict_word_similarity_dist_op",
    "strict_word_similarity_dist_commutator_op",
    "similarity_op",
    "word_similarity_op",
    "word_similarity_commutator_op",
    "strict_word_similarity_op",
    "strict_word_similarity_commutator_op",
    "show_trgm",
    "show_limit",
  ]);
  expect(Object.keys(api.sql.operators)).toEqual([
    "%",
    "<%",
    "%>",
    "<<%",
    "%>>",
    "<->",
    "<<->",
    "<->>",
    "<<<->",
    "<->>>",
  ]);
  for (const [name, call] of Object.entries(api.sql.operators)) {
    const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(call(null, "word"));
    expect(query.sql).toContain(`operator("search".${name})`);
    expect(query.params).toEqual([null, "word"]);
  }
  for (const call of [api.similarity, api.wordSimilarity, api.strictWordSimilarity]) {
    // @ts-expect-error Wrong runtime input must fail before reaching PostgreSQL.
    expect(() => call(true, "text")).toThrow();
  }
});

extensionProofUnitTest(unitCase("pg_trgm.exactContractAndNativeIndexes"), () => {
  for (const apiSupport of [{ status: "verified" as const, digest: "wrong" }, { status: "unverified" as const }])
    expect(() => createPgTrgm_1_6({ ...descriptor, apiSupport })).toThrow("exact verified contract");
  const api = createPgTrgm_1_6(descriptor);
  expect(api.schema).toBe("search");
  for (const [method, index] of [
    ["gin", api.indexes.gin()],
    ["gist", api.indexes.gist()],
  ] as const) {
    expect(index).toMatchObject({
      name: "pg_trgm",
      version: "1.6",
      schema: "search",
      digest: descriptor.apiSupport.digest,
      method,
      type: "text",
      input: { schema: "pg_catalog", type: "text", dimensions: 0 },
    });
    expect(index.member).toBe(`opclass:$extension:pg_trgm.${method}_trgm_ops/${method}`);
  }
});

extensionProofUnitTest(unitCase("pg_trgm.gistSignatureOptions"), () => {
  const api = createPgTrgm_1_6(descriptor);
  expect(api.indexes.gist({ siglen: 32 })).toHaveProperty("options.siglen", 32);
  for (const siglen of [0, 2025, 1.5, NaN, Infinity]) expect(() => api.indexes.gist({ siglen })).toThrow();
  expect(api.indexes.gist({ siglen: 1 })).toHaveProperty("options.siglen", 1);
  expect(api.indexes.gist({ siglen: 2024 })).toHaveProperty("options.siglen", 2024);
});

extensionProofUnitTest(unitCase("pg_trgm.all80MemberDispositions"), () => {
  expect(pgTrgmAnnotationContract.digest).toBe(capture.digest);
  expect(pgTrgmAnnotationContract.providerAcceptance).toBe("pending");
  expect(pgTrgmAnnotationContract.publicExportAcceptance).toBe("pending");
  const ids = new Set(pgTrgmAnnotations.map((entry) => entry.id));
  expect(ids.size).toBe(80);
  expect([...ids].sort()).toEqual(capture.contract.members.map((member) => member.id).sort());
  for (const member of pgTrgmAnnotations) {
    expect(member.reason.length).toBeGreaterThan(20);
    expect(member.proofs.length).toBeGreaterThan(0);
    for (const parent of member.parents) expect(ids.has(parent)).toBe(true);
    if (member.disposition === "internal") expect(member.parents.length).toBeGreaterThan(0);
  }
});

extensionProofUnitTest(unitCase("pg_trgm.indexesRejectNonText"), () => {
  const api = createPgTrgm_1_6(descriptor);
  for (const contract of [api.indexes.gin(), api.indexes.gist()])
    for (const kind of ["boolean", "integer"] as const)
      expect(() =>
        defineSchema((fields) => ({
          documents: defineTable({ value: fields[kind]() }, { indexes: [{ fields: ["value"], extension: contract }] }),
        })),
      ).toThrow("incompatible");
});

extensionProofUnitTest(unitCase("pg_trgm.overloadsMatchCapturedQueryMembers"), () => {
  const api = createPgTrgm_1_6(descriptor);
  const dialect = extensionSqlDialect(nodePgCodecs);
  expect(Object.keys(api.sql.overloads).sort()).toEqual([...pgTrgmQueryMembers].sort());
  expect(pgTrgmQueryMembers).toHaveLength(25);
  const captured = new Map(capture.contract.members.map((member) => [member.id, member]));
  for (const [member, call] of Object.entries(api.sql.overloads)) {
    expect(captured.get(member)?.ownership).toBe("direct");
    const name = /\$extension:pg_trgm\.([^(]+)\(/.exec(member)?.[1];
    // SAFETY: show_limit is nullary, show_trgm is unary and every other captured routine or operator takes a text pair.
    const text = call as (...values: string[]) => SQL;
    const expression =
      name === "show_limit" ? api.sql.functions.show_limit() : name === "show_trgm" ? text("a") : text("a", "b");
    expect(extensionExpressionContract(expression)?.member).toBe(member);
    expect(dialect.sqlToQuery(expression).sql).toContain('"search".');
  }
  expect(api.sql.overloads["routine:$extension:pg_trgm.similarity(pg_catalog.text,pg_catalog.text)"]).toBe(
    api.similarity,
  );
  expect(api.sql.overloads["operator:$extension:pg_trgm.<->(pg_catalog.text,pg_catalog.text)"]).toBe(api.distance);
  expect(api.sql.overloads["routine:$extension:pg_trgm.show_trgm(pg_catalog.text)"]).toBe(api.showTrigrams);
  for (const absent of [
    "routine:$extension:pg_trgm.set_limit(pg_catalog.float4)",
    "routine:$extension:pg_trgm.gtrgm_in(pg_catalog.cstring)",
    "opclass:$extension:pg_trgm.gin_trgm_ops/gin",
  ])
    expect(Object.hasOwn(api.sql.overloads, absent)).toBe(false);
  expect(Object.isFrozen(api.sql.overloads)).toBe(true);
});
