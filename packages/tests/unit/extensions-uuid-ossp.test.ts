import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { uuidCodec } from "../../../apps/loom/src/core/extensions/native-uuid-codec";
import { createUuidOssp_1_1 } from "../../../apps/loom/src/core/extensions/adapters/uuid-ossp";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { uuidOsspAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/uuid-ossp";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/uuid-ossp.json";

const extension = createUuidOssp_1_1({
  name: "uuid-ossp",
  version: "1.1",
  schema: 'uuid"functions',
  apiSupport: { status: "verified" },
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
