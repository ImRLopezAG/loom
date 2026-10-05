import { expect, test } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createPgJsonschema_0_3_4 } from "../../../apps/loom/src/core/extensions/adapters/pg-jsonschema";
import {
  jsonCodec,
  jsonbCodec,
  jsonDocument,
  jsonbDocument,
  jsonValue,
  jsonbValue,
} from "../../../apps/loom/src/core/extensions/native-json-codecs";
import { nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { pgJsonschemaAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg-jsonschema";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pg_jsonschema.json";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";

import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { extensionBindingsSource, resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { validateRequiredApiForTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import { pgJsonschemaUnitProofCase } from "../../e2e/fixtures/pg-jsonschema-proof-cases";
import type { ExtensionProofEvent } from "../../e2e/fixtures/extension-proof";

// The host corroborates this callback's terminal event against Vitest's independent JSON result.
test(pgJsonschemaUnitProofCase.title, () => {
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  const output = process.env.LOOM_EXTENSION_PROOF_OUTPUT;
  assert.equal(Boolean(runId), Boolean(output));
  const identity = runId ?? "uncollected";
  function record(event: ExtensionProofEvent) {
    if (output) appendFileSync(output, JSON.stringify(event) + "\n", { mode: 0o600 });
  }
  record({ runId: identity, kind: "registered", definition: pgJsonschemaUnitProofCase });
  record({ runId: identity, kind: "started", caseId: pgJsonschemaUnitProofCase.id });
  let passed = false;
  try {
    const selection = { pg_jsonschema: { version: "0.3.4", schema: 'unit"json' } } as const;
    const resolved = resolveSelectedExtension("pg_jsonschema", selection.pg_jsonschema);
    assert(resolved.manifest);
    const required = buildRequiredApi(selection);
    expect(validateRequiredApiForTarget(required)).toEqual(required);
    expect(required?.apis[0]?.manifest.digest).toBe(resolved.manifest.digest);
    const generated = extensionBindingsSource(selection);
    expect(generated).toContain(JSON.stringify(resolved.manifest.digest));
    expect(generated).toContain('from "kello/extensions/pg-jsonschema"');
    expect(generated).not.toContain("kello/tooling");
    expect(
      resolveSelectedExtension("pg_jsonschema", { version: "future", schema: "extensions" }).adapter,
    ).toBeUndefined();
    expect(extensionBindingsSource(undefined)).not.toContain("kello/extensions/pg-jsonschema");
    expect(extensionBindingsSource({})).not.toContain("kello/extensions/pg-jsonschema");
    passed = true;
  } finally {
    record({
      runId: identity,
      kind: "terminal",
      caseId: pgJsonschemaUnitProofCase.id,
      status: passed ? "passed" : "failed",
      witnessFailures: 0,
    });
  }
});

const dialect = extensionSqlDialect(nodePgCodecs);
const adapter = createPgJsonschema_0_3_4({
  name: "pg_jsonschema",
  version: "0.3.4",
  schema: 'custom"json',
  apiSupport: { status: "verified", digest: "7a61cf1dd9bcb37e3704e5cb9c5cc92258815f6dddf6a869bd9c6434a66da138" },
});

test("pg_jsonschema callable factory requires its exact verified manifest", () => {
  const verified = {
    name: "pg_jsonschema",
    version: "0.3.4",
    schema: 'custom"json',
    apiSupport: { status: "verified", digest: "7a61cf1dd9bcb37e3704e5cb9c5cc92258815f6dddf6a869bd9c6434a66da138" },
  } as const;
  expect(Object.keys(createPgJsonschema_0_3_4(verified).sql.functions)).toHaveLength(4);
  for (const descriptor of [
    { ...verified, name: "pg_tiktoken" },
    { ...verified, version: "0.3.5" },
    { ...verified, apiSupport: { status: "unverified" } },
    { ...verified, apiSupport: { status: "verified" } },
    { ...verified, apiSupport: { status: "verified", digest: "wrong" } },
  ])
    // SAFETY: Invalid JavaScript descriptors exercise admission beyond the static signature.
    expect(() => createPgJsonschema_0_3_4(descriptor as never)).toThrow(
      "pg_jsonschema 0.3.4 requires its exact verified contract",
    );
});

test("JSON codecs retain document text, arbitrary numeric precision and SQL NULL distinction", () => {
  const text = '{ "z": 1, "a": 9223372036854775807.123456789, "z": 2 }';
  expect(jsonCodec.encode(jsonDocument(text))).toBe(text);
  expect(jsonCodec.decode(text)).toEqual({ type: "json", text });
  expect(jsonbCodec.encode(jsonbDocument(text))).toBe(text);
  expect(jsonbCodec.decode('{"a": 9223372036854775807.123456789, "z": 2}')).toEqual({
    type: "jsonb",
    text: '{"a": 9223372036854775807.123456789, "z": 2}',
  });
  expect(nullableCodec(jsonCodec).decode(null)).toBeNull();
  expect(nullableCodec(jsonCodec).decode("null")).toEqual(jsonValue(null));
  expect(jsonValue('{"a":1}')).toEqual(jsonDocument('"{\\"a\\":1}"'));
  expect(jsonbValue({ value: [true, 1, null] })).toEqual(jsonbDocument('{"value":[true,1,null]}'));
  expect(jsonDocument("1e9999").text).toBe("1e9999");
  expect(() => jsonCodec.decode({ rounded: Number("9223372036854775807") })).toThrow();
  expect(() => jsonCodec.decode(null)).toThrow();
  expect(() => jsonDocument('{"a":01}')).toThrow();
  expect(() => jsonValue(NaN)).toThrow();
  // @ts-expect-error Exercise runtime rejection as well as the JSONB type mismatch.
  expect(() => jsonCodec.encode(jsonbDocument("{}"))).toThrow();
});

test("four JSON Schema calls parameterize qualified JSON and JSONB overloads", () => {
  const schema = jsonValue({ type: "string" });
  const expressions = [
    adapter.jsonMatchesSchema(schema, jsonValue("foo")),
    adapter.jsonbMatchesSchema(schema, jsonbValue("foo")),
    adapter.isValid(schema),
    adapter.validationErrors(schema, jsonValue("foo")),
  ];
  expect(expressions.map((value) => dialect.sqlToQuery(value).params)).toEqual([
    ['{"type":"string"}', '"foo"'],
    ['{"type":"string"}', '"foo"'],
    ['{"type":"string"}'],
    ['{"type":"string"}', '"foo"'],
  ]);
  expect(dialect.sqlToQuery(expressions[0]!).sql).toContain('"custom""json"."json_matches_schema"');
  expect(dialect.sqlToQuery(expressions[0]!).sql).toContain('::"pg_catalog"."json"');
  expect(dialect.sqlToQuery(expressions[1]!).sql).toContain('::"pg_catalog"."jsonb"');
  expect(dialect.sqlToQuery(adapter.jsonMatchesSchema(null, jsonValue(null))).params).toEqual([null, "null"]);
  expect(adapter.sql.functions.json_matches_schema).toBe(adapter.jsonMatchesSchema);
  expect(adapter.sql.functions.jsonb_matches_schema).toBe(adapter.jsonbMatchesSchema);
  expect(adapter.sql.functions.jsonschema_is_valid).toBe(adapter.isValid);
  expect(adapter.sql.functions.jsonschema_validation_errors).toBe(adapter.validationErrors);
  expect(Object.isFrozen(adapter)).toBe(true);
  expect(
    expressions
      .map(extensionExpressionContract)
      .map((contract) => contract?.member)
      .sort((left, right) => (left ?? "").localeCompare(right ?? "")),
  ).toEqual(manifest.contract.members.map((member) => member.id).sort());
  expect(expressions.map(extensionExpressionContract).every((contract) => contract?.observability === "tables")).toBe(
    true,
  );
});

test("all captured JSON Schema members have executable proof dispositions", () => {
  expect(pgJsonschemaAnnotations.map((member) => member.id).sort()).toEqual(
    manifest.contract.members.map((member) => member.id).sort(),
  );
  expect(pgJsonschemaAnnotations.every((member) => member.disposition === "query" && member.evidence.length >= 4)).toBe(
    true,
  );
  expect(manifest.digest).toBe("7a61cf1dd9bcb37e3704e5cb9c5cc92258815f6dddf6a869bd9c6434a66da138");
});

test("ordinary Kello JSON fields stay SQL values with explicit qualified overload casts", () => {
  const schema = defineSchema((fields) => ({ documents: { body: fields.json() } }));
  const query = dialect.sqlToQuery(
    adapter.jsonbMatchesSchema(jsonValue({ type: "object" }), schema.tables.documents.body),
  );
  expect(query.sql).toContain('"documents"."body"::"pg_catalog"."jsonb"');
  expect(query.params).toEqual(['{"type":"object"}']);
});
