import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createFuzzystrmatch_1_2 } from "../../../apps/loom/src/core/extensions/adapters/fuzzystrmatch";
import { createPgTiktoken_0_0_1 } from "../../../apps/loom/src/core/extensions/adapters/pg-tiktoken";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { fuzzystrmatchAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/fuzzystrmatch";
import { pgTiktokenAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg-tiktoken";
import fuzzyManifest from "../../../apps/loom/src/tooling/extensions/manifests/fuzzystrmatch.json";
import tokenManifest from "../../../apps/loom/src/tooling/extensions/manifests/pg_tiktoken.json";
const dialect = extensionSqlDialect(nodePgCodecs);
const fuzzy = createFuzzystrmatch_1_2({
  name: "fuzzystrmatch",
  version: "1.2",
  schema: 'custom"text',
  apiSupport: { status: "verified" },
});
const token = createPgTiktoken_0_0_1({
  name: "pg_tiktoken",
  version: "0.0.1",
  schema: "tokens",
  apiSupport: { status: "verified" },
});

test("fuzzy canonical functions expose every captured overload and parameterize exact int4 costs", () => {
  expect(Object.keys(fuzzy.sql.functions).sort()).toEqual([
    "daitch_mokotoff",
    "difference",
    "dmetaphone",
    "dmetaphone_alt",
    "levenshtein",
    "levenshtein_less_equal",
    "metaphone",
    "soundex",
    "text_soundex",
  ]);
  const examples = [
    fuzzy.levenshtein("a", "b"),
    fuzzy.levenshtein("a", "b", 2, 3, 4),
    fuzzy.levenshteinLessEqual("a", "b", 5),
    fuzzy.levenshteinLessEqual("a", "b", 2, 3, 4, 5),
  ];
  expect(examples.map((value) => dialect.sqlToQuery(value).params)).toEqual([
    ["a", "b"],
    ["a", "b", 2, 3, 4],
    ["a", "b", 5],
    ["a", "b", 2, 3, 4, 5],
  ]);
  expect(dialect.sqlToQuery(examples[1]!).sql).toContain('"custom""text"."levenshtein"');
  expect(dialect.sqlToQuery(examples[1]!).sql).toContain('::"pg_catalog"."int4"');
  expect(() => fuzzy.metaphone("a", 2147483648)).toThrow();
  expect(() => fuzzy.levenshtein("a", "b", 1.5, 2, 3)).toThrow();
  expect(fuzzy.sql.functions.text_soundex).toBe(fuzzy.textSoundex);
  expect(extensionExpressionContract(examples[0]!)).toMatchObject({
    observability: "tables",
    dependencies: [],
    codec: "pg:int4:1:nullable",
  });
});

test("strict fuzzy and token parameters retain NULL and token signatures retain selector first", () => {
  expect(dialect.sqlToQuery(fuzzy.difference(null, "Robert")).params).toEqual([null, "Robert"]);
  expect(dialect.sqlToQuery(token.count("cl100k_base", "hello")).params).toEqual(["cl100k_base", "hello"]);
  expect(dialect.sqlToQuery(token.encode(null, null)).params).toEqual([null, null]);
  expect(token.sql.functions.tiktoken_count).toBe(token.count);
  expect(token.sql.functions.tiktoken_encode).toBe(token.encode);
  expect(extensionExpressionContract(token.count("cl100k_base", "hello"))).toMatchObject({
    observability: "external",
    dependencies: [],
  });
  expect(Object.isFrozen(fuzzy)).toBe(true);
  expect(Object.isFrozen(token)).toBe(true);
  expect(dialect.sqlToQuery(sql`select ${fuzzy.soundex("'); drop table x;--")}`).sql).not.toContain("drop table");
});

test("annotations reconcile all thirteen immutable captured public member IDs", () => {
  for (const [annotations, manifest] of [
    [fuzzystrmatchAnnotations, fuzzyManifest],
    [pgTiktokenAnnotations, tokenManifest],
  ] as const) {
    expect(annotations.map((member) => member.id).sort()).toEqual(
      manifest.contract.members.map((member) => member.id).sort(),
    );
    expect(
      annotations.every((member) => member.disposition === "query" && member.reason && member.evidence.length >= 4),
    ).toBe(true);
  }
  const expressions = [
    fuzzy.daitchMokotoff("a"),
    fuzzy.difference("a", "b"),
    fuzzy.dmetaphoneAlt("a"),
    fuzzy.dmetaphone("a"),
    fuzzy.levenshteinLessEqual("a", "b", 1, 1, 1, 1),
    fuzzy.levenshteinLessEqual("a", "b", 1),
    fuzzy.levenshtein("a", "b", 1, 1, 1),
    fuzzy.levenshtein("a", "b"),
    fuzzy.metaphone("a", 4),
    fuzzy.soundex("a"),
    fuzzy.textSoundex("a"),
    token.count("cl100k_base", "a"),
    token.encode("cl100k_base", "a"),
  ];
  expect(expressions.map((expression) => extensionExpressionContract(expression)?.member).sort()).toEqual(
    [...fuzzyManifest.contract.members, ...tokenManifest.contract.members].map((member) => member.id).sort(),
  );
});
