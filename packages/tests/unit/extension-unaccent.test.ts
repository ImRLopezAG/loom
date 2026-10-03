import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createUnaccent_1_1, dictionaryReference } from "../../../apps/loom/src/core/extensions/adapters/unaccent";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { unaccentUnitProofCase } from "../../e2e/fixtures/unaccent-proof-cases";
import type { ExtensionProofEvent } from "../../e2e/fixtures/extension-proof";
import { resolveSelectedExtension, extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { validateRequiredApiForTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import { withUnaccentDictionaries, restoreUnaccentDictionary } from "../../../apps/loom/src/tooling/extensions/unaccent";

const dialect = extensionSqlDialect(nodePgCodecs);
const extension = createUnaccent_1_1({
  name: "unaccent",
  version: "1.1",
  schema: 'accent"schema',
  apiSupport: { status: "verified", digest: "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd" },
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

test("Unaccent requires the exact verified 1.1 manifest before minting query capabilities", () => {
  for (const apiSupport of [
    { status: "unverified" as const },
    { status: "verified" as const },
    { status: "verified" as const, digest: "0".repeat(64) },
  ])
    expect(() => createUnaccent_1_1({ name: "unaccent", version: "1.1", schema: "accents", apiSupport })).toThrow(
      /exact verified contract/,
    );
});

// Vitest owns this callback. Importing the Bun test wrapper would register in a different runner.
// The host corroborates these existing-schema events against Vitest's independent JSON result.
test(unaccentUnitProofCase.title, async () => {
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  const output = process.env.LOOM_EXTENSION_PROOF_OUTPUT;
  assert.equal(Boolean(runId), Boolean(output), "Proof collection needs both run ID and output path");
  function record(event: ExtensionProofEvent) {
    if (output) appendFileSync(output, JSON.stringify(event) + "\n", { mode: 0o600 });
  }
  const identity = runId ?? "uncollected";
  record({ runId: identity, kind: "registered", definition: unaccentUnitProofCase });
  record({ runId: identity, kind: "started", caseId: unaccentUnitProofCase.id });
  let passed = false;
  try {
    const schema = 'unit"accents';
    const resolution = resolveSelectedExtension("unaccent", { version: "1.1", schema });
    if (!resolution.manifest || !resolution.textSearch) throw new Error("Missing captured Unaccent contracts");
    const required = buildRequiredApi({ unaccent: { version: "1.1", schema } });
    expect(validateRequiredApiForTarget(required)).toEqual(required);
    expect(required?.apis[0]?.manifest.digest).toBe(resolution.manifest.digest);
    expect(required?.apis[0]?.textSearch?.digest).toBe(resolution.textSearch.digest);
    const descriptor = { name: "unaccent", version: "1.1", schema, apiSupport: resolution.support } as const;
    const binding = createUnaccent_1_1(descriptor);
    const hostile = "');select pg_sleep(60);--é";
    const query = dialect.sqlToQuery(binding.unaccent(binding.dictionary, hostile));
    expect(query.params).toEqual(['"unit""accents"."unaccent"', hostile]);
    expect(query.sql).not.toContain(hostile);
    expect(extensionExpressionContract(binding.unaccent(null))?.codec).toBe("pg:text:1:nullable");
    // SAFETY: copied public identity fields must not cross the private factory admission boundary.
    expect(() => binding.unaccent({ ...binding.dictionary } as never, hostile)).toThrow();
    const corrupt = { ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } } as const;
    expect(() => createUnaccent_1_1(corrupt)).toThrow(/exact verified contract/);
    let entered = false;
    // An unusable address makes accidental acquisition fail differently from the expected pin admission error.
    await expect(withUnaccentDictionaries("not-a-postgresql-address", corrupt, async () => {
      entered = true;
    })).rejects.toThrow(/exact verified contract/);
    await expect(restoreUnaccentDictionary("not-a-postgresql-address", corrupt)).rejects.toThrow(/exact verified contract/);
    expect(entered).toBe(false);
    const generated = extensionBindingsSource({ unaccent: { version: "1.1", schema } });
    expect(generated).toContain(JSON.stringify(resolution.manifest.digest));
    expect(generated).not.toContain("loom/tooling");
    expect(generated).not.toContain("withUnaccentDictionaries");
    const api = required!.apis[0]!;
    expect(() => validateRequiredApiForTarget({
      ...required!, apis: [{ ...api, textSearch: { ...api.textSearch!, digest: "0".repeat(64) } }],
    })).toThrow();
    expect(extensionBindingsSource({ unaccent: undefined })).toBe(extensionBindingsSource(undefined));
    expect(resolveSelectedExtension("unaccent", { version: "future", schema }).adapter).toBeUndefined();
    passed = true;
  } finally {
    record({ runId: identity, kind: "terminal", caseId: unaccentUnitProofCase.id,
      status: passed ? "passed" : "failed", witnessFailures: 0 });
  }
});
