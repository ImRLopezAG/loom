import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { uuidCodec } from "../../../apps/loom/src/core/extensions/native-uuid-codec";
import { createUuidOssp_1_1 } from "../../../apps/loom/src/core/extensions/adapters/uuid-ossp";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { uuidOsspAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/uuid-ossp";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/uuid-ossp.json";
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { uuidOsspUnitProofCase } from "../../e2e/fixtures/uuid-ossp-proof-cases";
import type { ExtensionProofEvent } from "../../e2e/fixtures/extension-proof";
import { extensionBindingsSource, resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { validateRequiredApiForTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";

const extension = createUuidOssp_1_1({
  name: "uuid-ossp",
  version: "1.1",
  schema: 'uuid"functions',
  apiSupport: { status: "verified", digest: "6961935a6844d9e8007d1d391a2deb0dc766e070e15ad0d4687134b46c4b7796" },
});
const dialect = extensionSqlDialect(nodePgCodecs);

test("native UUID codec accepts every 128-bit canonical identity and normalizes case", () => {
  for (const value of [
    "00000000-0000-0000-0000-000000000000",
    "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
    "a0eebc99-9c0b-0ef8-0b6d-6bb9bd380a11",
    "a0eebc99-9c0b-fef8-fb6d-6bb9bd380a11",
  ]) {
    expect(uuidCodec.encode(value)).toBe(value.toLowerCase());
    expect(uuidCodec.decode(value)).toBe(value.toLowerCase());
  }
  for (const value of ["", "not-a-uuid", "a0eebc999c0b4ef8bb6d6bb9bd380a11", "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFG"])
    expect(() => uuidCodec.encode(value)).toThrow();
  for (const value of [null, 123, {}, "not-a-uuid"]) expect(() => uuidCodec.decode(value)).toThrow();
  expect(uuidCodec.sqlType).toEqual({ schema: "pg_catalog", name: "uuid" });
  expect(uuidCodec.transport).toBe("native");
});

test("UUID-OSSP qualifies and parameterizes namespace/name while retaining native result semantics", () => {
  const value = extension.v3("6BA7B810-9DAD-11D1-80B4-00C04FD430C8", "'); drop table documents;--");
  const query = dialect.sqlToQuery(value);
  expect(query.params).toEqual(["6ba7b810-9dad-11d1-80b4-00c04fd430c8", "'); drop table documents;--"]);
  expect(query.sql).toContain('"uuid""functions"."uuid_generate_v3"');
  expect(query.sql).toContain('::"pg_catalog"."uuid"');
  expect(query.sql).not.toContain("drop table");
  expect(dialect.sqlToQuery(extension.v5(null, null)).params).toEqual([null, null]);
  expect(() => extension.v3("invalid", "name")).toThrow();
  expect(extension.sql.functions.uuid_generate_v5).toBe(extension.v5);
  expect(extension.sql.functions.uuid_nil).toBe(extension.nil);
  expect(Object.isFrozen(extension)).toBe(true);
  expect(dialect.sqlToQuery(sql`select ${extension.v4()}`).sql).not.toContain("::text");
});

test("all ten captured members have callable contracts and per-member observability annotations", () => {
  const expressions = [
    extension.v1(),
    extension.v1mc(),
    extension.v3(extension.namespaceDns(), "name"),
    extension.v4(),
    extension.v5(extension.namespaceDns(), "name"),
    extension.nil(),
    extension.namespaceDns(),
    extension.namespaceOid(),
    extension.namespaceUrl(),
    extension.namespaceX500(),
  ];
  expect(
    expressions
      .map((value) => extensionExpressionContract(value)?.member)
      .sort((a, b) => (a ?? "").localeCompare(b ?? "")),
  ).toEqual(manifest.contract.members.map((member) => member.id).sort((a, b) => a.localeCompare(b)));
  expect(uuidOsspAnnotations.map((member) => member.id).sort((a, b) => a.localeCompare(b))).toEqual(
    manifest.contract.members.map((member) => member.id).sort((a, b) => a.localeCompare(b)),
  );
  expect(Object.keys(extension.sql.functions)).toHaveLength(10);
  expect(extension.sql.operators).toEqual({});
  expect(Object.isFrozen(extension.sql)).toBe(true);
  expect(Object.isFrozen(extension.sql.functions)).toBe(true);
  for (const [alias, canonical] of [
    [extension.nil, extension.sql.functions.uuid_nil],
    [extension.namespaceDns, extension.sql.functions.uuid_ns_dns],
    [extension.namespaceUrl, extension.sql.functions.uuid_ns_url],
    [extension.namespaceOid, extension.sql.functions.uuid_ns_oid],
    [extension.namespaceX500, extension.sql.functions.uuid_ns_x500],
    [extension.v1, extension.sql.functions.uuid_generate_v1],
    [extension.v1mc, extension.sql.functions.uuid_generate_v1mc],
    [extension.v3, extension.sql.functions.uuid_generate_v3],
    [extension.v4, extension.sql.functions.uuid_generate_v4],
    [extension.v5, extension.sql.functions.uuid_generate_v5],
  ])
    expect(alias).toBe(canonical);
  for (const value of expressions) {
    expect(dialect.sqlToQuery(value).sql).toContain('"uuid""functions".');
    expect(extensionExpressionContract(value)?.codec).toMatch(/^pg:uuid:1(?::nullable)?$/);
  }
  expect(expressions.map((value) => extensionExpressionContract(value)?.observability)).toEqual([
    "external",
    "external",
    "tables",
    "external",
    "tables",
    "tables",
    "tables",
    "tables",
    "tables",
    "tables",
  ]);
  expect(
    uuidOsspAnnotations.every(
      (member) => member.disposition === "query" && member.reason && member.evidence.length >= 4,
    ),
  ).toBe(true);
});

test("UUID-OSSP named routines reject text that cannot preserve exact UTF8 identity", () => {
  for (const call of [extension.v3, extension.v5]) {
    for (const name of ["a\0b", "\ud800", "\udc00", "x\ud800y", "\ud800\ud800", "\udc00\ud800"])
      expect(() => call(extension.namespaceDns(), name)).toThrow(/lossless PostgreSQL UTF8 text/);
    for (const name of ["", "é", "e\u0301", "😀𐐀", "\ufffd"])
      expect(dialect.sqlToQuery(call(extension.namespaceDns(), name)).params).toEqual([name]);
    expect(dialect.sqlToQuery(call(extension.namespaceDns(), null)).params).toEqual([null]);
  }
});

// Vitest executes the callback; the proof host corroborates events against its independent JSON result.
test(uuidOsspUnitProofCase.title, () => {
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  const output = process.env.LOOM_EXTENSION_PROOF_OUTPUT;
  assert.equal(Boolean(runId), Boolean(output));
  const identity = runId ?? "uncollected";
  function record(event: ExtensionProofEvent) {
    if (output) appendFileSync(output, JSON.stringify(event) + "\n", { mode: 0o600 });
  }
  record({ runId: identity, kind: "registered", definition: uuidOsspUnitProofCase });
  record({ runId: identity, kind: "started", caseId: uuidOsspUnitProofCase.id });
  let passed = false;
  try {
    const selection = { "uuid-ossp": { version: "1.1", schema: 'unit"uuid' } } as const;
    const resolved = resolveSelectedExtension("uuid-ossp", selection["uuid-ossp"]);
    assert(resolved.manifest);
    const required = buildRequiredApi(selection);
    expect(validateRequiredApiForTarget(required)).toEqual(required);
    expect(required?.apis[0]?.manifest.digest).toBe(resolved.manifest.digest);
    expect(extensionBindingsSource(selection)).toContain(JSON.stringify(resolved.manifest.digest));
    expect(extensionBindingsSource(selection)).toContain('from "loom/extensions/uuid-ossp"');
    expect(extensionBindingsSource(selection)).not.toContain("loom/tooling");
    expect(resolveSelectedExtension("uuid-ossp", { version: "future", schema: "extensions" }).adapter).toBeUndefined();
    expect(() =>
      createUuidOssp_1_1({
        name: "uuid-ossp",
        version: "1.1",
        schema: "extensions",
        apiSupport: { status: "unverified" },
      }),
    ).toThrow();
    for (const descriptor of [
      { ...extension, apiSupport: { status: "verified" } },
      { ...extension, apiSupport: { status: "verified", digest: "wrong" } },
      { ...extension, name: "uuid_ossp" },
      { ...extension, version: "1.0" },
    ])
      // SAFETY: Deliberately invalid JavaScript descriptors exercise the runtime boundary beyond its static signature.
      expect(() => createUuidOssp_1_1(descriptor as never)).toThrow("requires its exact verified contract");
    passed = true;
  } finally {
    record({
      runId: identity,
      kind: "terminal",
      caseId: uuidOsspUnitProofCase.id,
      status: passed ? "passed" : "failed",
      witnessFailures: 0,
    });
  }
});
