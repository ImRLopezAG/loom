import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createUnaccent_1_1, dictionaryReference } from "../../../apps/loom/src/core/extensions/adapters/unaccent";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";

const dialect = extensionSqlDialect(nodePgCodecs);
const extension = createUnaccent_1_1({
  name: "unaccent",
  version: "1.1",
  schema: 'accent"schema',
  apiSupport: { status: "verified" },
});

test("Unaccent binds both exact native overloads and exposes only shallow query capabilities", () => {
  const unary = extension.unaccent("Hôtel");
  const explicit = extension.unaccent(extension.dictionary, "Æther");
  expect(dialect.sqlToQuery(unary)).toMatchObject({
    sql: '"accent""schema"."unaccent"($1::"pg_catalog"."text")',
    params: ["Hôtel"],
  });
  expect(dialect.sqlToQuery(explicit)).toMatchObject({
    sql: '"accent""schema"."unaccent"($1::"pg_catalog"."regdictionary", $2::"pg_catalog"."text")',
    params: ['"accent""schema"."unaccent"', "Æther"],
  });
  expect(extensionExpressionContract(unary)).toEqual({
    member: "routine:$extension:unaccent.unaccent(pg_catalog.text)",
    codec: "pg:text:1:nullable",
    dependencies: [],
    observability: "external",
  });
  expect(extensionExpressionContract(explicit)?.member).toBe(
    "routine:$extension:unaccent.unaccent(pg_catalog.regdictionary,pg_catalog.text)",
  );
  expect(extension.sql.functions.unaccent).toBe(extension.unaccent);
  expect(Object.keys(extension.sql.functions)).toEqual(["unaccent"]);
  expect(extension.sql.operators).toEqual({});
  expect(Object.keys(extension).sort()).toEqual([
    "apiSupport",
    "dictionary",
    "name",
    "schema",
    "sql",
    "unaccent",
    "version",
  ]);
  expect(Object.isFrozen(extension)).toBe(true);
  expect(Object.isFrozen(extension.dictionary)).toBe(true);
});

test("qualified dictionary references quote identifiers individually and bind hostile data", () => {
  const reference = dictionaryReference({ schema: 'other"schema', name: 'dict"; drop schema public;--' });
  const hostile = "'); select pg_sleep(60);--\\é";
  const compiled = dialect.sqlToQuery(sql`select ${extension.unaccent(reference, hostile)}`);
  expect(compiled.params).toEqual(['"other""schema"."dict""; drop schema public;--"', hostile]);
  expect(compiled.sql).not.toContain("drop schema");
  expect(compiled.sql).not.toContain("pg_sleep");
  expect(dialect.sqlToQuery(extension.unaccent(null)).params).toEqual([null]);
  expect(dialect.sqlToQuery(extension.unaccent(null, "é")).params).toEqual([null, "é"]);
  expect(dialect.sqlToQuery(extension.unaccent(reference, null)).params).toEqual([
    '"other""schema"."dict""; drop schema public;--"',
    null,
  ]);
});

test("dictionary identity validation rejects raw OIDs, strings, fabricated or mutated references", () => {
  for (const invalid of [1, "unaccent", { schema: "extensions", name: "unaccent" }, { getSQL: () => sql`1` }]) {
    // SAFETY: wrong runtime inputs deliberately exercise the nominal reference boundary.
    expect(() => extension.unaccent(invalid as never, "é")).toThrow();
  }
  const reference = dictionaryReference({ schema: "extensions", name: "unaccent" });
  // SAFETY: copying public fields and even nominal symbol properties must not mint a factory reference.
  expect(() => extension.unaccent({ ...reference } as never, "é")).toThrow();
  for (const value of [
    { schema: "", name: "unaccent" },
    { schema: "extensions", name: "bad\u0000name" },
    { schema: "é".repeat(32), name: "unaccent" },
    { schema: "extensions", name: "a".repeat(64) },
    { schema: "extensions", name: "bad\ud800name" },
    { schema: "extensions", name: "unaccent", oid: 1 },
  ])
    expect(() => dictionaryReference(value)).toThrow();
  expect(dictionaryReference({ schema: "é".repeat(31), name: "a".repeat(63) }).schema).toBe("é".repeat(31));
  expect(dictionaryReference({ schema: "\ufeffaccents", name: "\ufeffdictionary" })).toMatchObject({
    schema: "\ufeffaccents",
    name: "\ufeffdictionary",
  });
  expect(() => {
    // @ts-expect-error Wrong arity deliberately exercises runtime argument validation.
    extension.unaccent();
  }).toThrow();
  expect(() => {
    // @ts-expect-error Extra arguments deliberately exercise runtime argument validation.
    extension.unaccent(reference, "é", "extra");
  }).toThrow();
});
