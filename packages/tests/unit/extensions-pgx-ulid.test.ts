import { expect, test } from "vite-plus/test";
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createPgxUlid_0_2_2, ulid } from "../../../apps/loom/src/core/extensions/adapters/pgx-ulid";
import {
  timestamp,
  timestamptz,
  type Timestamp,
  type Timestamptz,
} from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { pgxUlidAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pgx-ulid";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pgx_ulid.json";
import { extensionBindingsSource, resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { validateRequiredApiForTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import { pgxUlidUnitProofCase } from "../../e2e/fixtures/pgx-ulid-proof-cases";
import type { ExtensionProofEvent } from "../../e2e/fixtures/extension-proof";

const digest = "e2e491782b819b700106736a81ffa9922f24226e1d18ec02ce90931dcef0a60d";
const extension = createPgxUlid_0_2_2({
  name: "pgx_ulid",
  version: "0.2.2",
  schema: 'custom"ulid',
  apiSupport: { status: "verified", digest },
});
const dialect = extensionSqlDialect(nodePgCodecs);
const sorted = (values: readonly (string | undefined)[]) =>
  values.map((value) => value ?? "").sort((a, b) => a.localeCompare(b));
const sample = "01GV5PA9EQG7D82Q3Y4PKBZSYV";

// The host corroborates this callback's terminal event against Vitest's independent JSON result.
test(pgxUlidUnitProofCase.title, () => {
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  const output = process.env.LOOM_EXTENSION_PROOF_OUTPUT;
  assert.equal(Boolean(runId), Boolean(output));
  const identity = runId ?? "uncollected";
  function record(event: ExtensionProofEvent) {
    if (output) appendFileSync(output, JSON.stringify(event) + "\n", { mode: 0o600 });
  }
  record({ runId: identity, kind: "registered", definition: pgxUlidUnitProofCase });
  record({ runId: identity, kind: "started", caseId: pgxUlidUnitProofCase.id });
  let passed = false;
  try {
    const selection = { pgx_ulid: { version: "0.2.2", schema: 'unit"ulid' } } as const;
    const resolved = resolveSelectedExtension("pgx_ulid", selection.pgx_ulid);
    assert(resolved.manifest);
    expect(resolved.support).toEqual({ status: "verified", digest });
    const required = buildRequiredApi(selection);
    expect(validateRequiredApiForTarget(required)).toEqual(required);
    expect(required?.apis[0]?.manifest.digest).toBe(resolved.manifest.digest);
    const generated = extensionBindingsSource(selection);
    expect(generated).toContain(JSON.stringify(resolved.manifest.digest));
    expect(generated).toContain('import { createPgxUlid_0_2_2 } from "kello/extensions/pgx-ulid"');
    expect(generated).not.toContain("kello/tooling");
    expect(resolveSelectedExtension("pgx_ulid", { version: "0.2.1", schema: "extensions" }).adapter).toBeUndefined();
    expect(extensionBindingsSource(undefined)).not.toContain("kello/extensions/pgx-ulid");
    expect(extensionBindingsSource({})).not.toContain("kello/extensions/pgx-ulid");
    passed = true;
  } finally {
    record({
      runId: identity,
      kind: "terminal",
      caseId: pgxUlidUnitProofCase.id,
      status: passed ? "passed" : "failed",
      witnessFailures: 0,
    });
  }
});

test("pgx_ulid callable factory requires its exact verified manifest", () => {
  const verified = {
    name: "pgx_ulid",
    version: "0.2.2",
    schema: "identifiers",
    apiSupport: { status: "verified", digest },
  } as const;
  expect(Object.keys(createPgxUlid_0_2_2(verified).sql.functions)).toHaveLength(18);
  for (const descriptor of [
    { ...verified, name: "ulid" },
    { ...verified, version: "0.2.1" },
    { ...verified, apiSupport: { status: "unverified" } },
    { ...verified, apiSupport: { status: "verified" } },
    { ...verified, apiSupport: { status: "verified", digest: "wrong" } },
  ])
    // SAFETY: Invalid JavaScript descriptors exercise admission beyond the factory static signature.
    expect(() => createPgxUlid_0_2_2(descriptor as never)).toThrow(
      "pgx_ulid 0.2.2 requires its exact verified contract",
    );
});

test("pgx_ulid values accept only lossless Crockford text and encode canonical upper case", () => {
  expect(ulid(sample.toLowerCase())).toBe(sample);
  expect(ulid("00000000000000000000000000")).toBe("00000000000000000000000000");
  expect(ulid("7zzzzzzzzzzzzzzzzzzzzzzzzz")).toBe("7ZZZZZZZZZZZZZZZZZZZZZZZZZ");
  for (const invalid of [
    "01GV5PA9EQG7D82Q3Y4PKBZSY",
    "01GV5PA9EQG7D82Q3Y4PKBZSYVV",
    "01GV5PA9EQG7D82Q3Y4PKBZSYU",
    "01GV5PA9EQG7D82Q3Y4PKBZSYI",
    "01GV5PA9EQG7D82Q3Y4PKBZSYL",
    "01GV5PA9EQG7D82Q3Y4PKBZSYO",
    // pgx_ulid accepts and silently truncates these 130-bit values; Loom rejects them as non-roundtripping.
    "8ZZZZZZZZZZZZZZZZZZZZZZZZZ",
    "ZZZZZZZZZZZZZZZZZZZZZZZZZZ",
    " 01GV5PA9EQG7D82Q3Y4PKBZSYV",
    "01GV5PA9EQG7D82Q3Y4PKBZSYİ",
  ])
    expect(() => ulid(invalid)).toThrow();
  expect(extension.codec.encode(sample.toLowerCase())).toBe(sample);
  expect(extension.codec.decode(sample)).toBe(sample);
  // Native output is canonical upper case; anything else means a different type or DateStyle-like drift.
  expect(() => extension.codec.decode(sample.toLowerCase())).toThrow();
  expect(() => extension.codec.decode(42)).toThrow();
  expect(extension.arrayCodec.decode(`{${sample},NULL}`)).toEqual({
    dimensions: [{ lowerBound: 1, length: 2 }],
    values: [sample, null],
  });
  expect(() =>
    extension.arrayCodec.encode({ dimensions: [{ lowerBound: 2147483647, length: 1 }], values: [sample] }),
  ).toThrow("PostgreSQL array upper bound overflow");
});

test("pgx_ulid binds qualified functions, operators and casts with checked parameters", () => {
  const conversion = dialect.sqlToQuery(extension.fromTimestamp(timestamp("2023-03-10 12:00:49.111")));
  expect(conversion.params).toEqual(["2023-03-10 12:00:49.111000"]);
  expect(conversion.sql).toContain('"custom""ulid"."timestamp_to_ulid"');
  expect(conversion.sql).toContain('::"pg_catalog"."timestamp"');
  const uuid = dialect.sqlToQuery(extension.toUuid(sample.toLowerCase()));
  expect(uuid.params).toEqual([sample]);
  expect(uuid.sql).toContain('::"custom""ulid"."ulid"');
  const fromUuid = dialect.sqlToQuery(extension.fromUuid("0186CB65-25D7-81DA-815C-7E25A6BFE7DB"));
  expect(fromUuid.params).toEqual(["0186cb65-25d7-81da-815c-7e25a6bfe7db"]);
  const operator = dialect.sqlToQuery(extension.lessThan(sample, "7ZZZZZZZZZZZZZZZZZZZZZZZZZ"));
  expect(operator.sql).toContain('operator("custom""ulid".<)');
  expect(operator.params).toEqual([sample, "7ZZZZZZZZZZZZZZZZZZZZZZZZZ"]);
  const cast = dialect.sqlToQuery(extension.sql.casts.ulid_to_timestamptz(sample));
  expect(cast.sql).toContain('::"custom""ulid"."ulid")::"pg_catalog"."timestamptz"');
  const reverse = dialect.sqlToQuery(extension.sql.casts.uuid_to_ulid("00000000-0000-0000-0000-000000000000"));
  expect(reverse.sql).toContain('::"pg_catalog"."uuid")::"custom""ulid"."ulid"');
  expect(() => extension.toUuid("';drop table ids;--")).toThrow();
  expect(() => extension.fromUuid("not-a-uuid")).toThrow();
  expect(dialect.sqlToQuery(extension.toTimestamptz(extension.generate())).sql).not.toContain("::text");
  expect(Object.isFrozen(extension)).toBe(true);
  expect(extension.sql.functions.gen_ulid).toBe(extension.generate);
  expect(extension.sql.functions.gen_monotonic_ulid).toBe(extension.generateMonotonic);
  expect(extension.sql.functions.ulid_to_timestamp).toBe(extension.toTimestamp);
  expect(extension.sql.operators["="]).toBe(extension.equal);
});

test("pgx_ulid classifies random, session-dependent and deterministic expressions", () => {
  for (const value of [extension.generate(), extension.generateMonotonic()])
    expect(extensionExpressionContract(value)?.observability).toBe("external");
  // ulid_to_timestamp converts through PostgreSQL timestamptz_timestamp, so the session TimeZone selects its value.
  for (const value of [extension.toTimestamp(sample), extension.sql.casts.ulid_to_timestamp(sample)])
    expect(extensionExpressionContract(value)?.observability).toBe("session");
  for (const value of [
    extension.fromTimestamp(timestamp("1970-01-01 00:00:00")),
    extension.fromTimestamptz(timestamptz("1970-01-01 00:00:00Z")),
    extension.fromUuid("00000000-0000-0000-0000-000000000000"),
    extension.toTimestamptz(sample),
    extension.toUuid(sample),
    extension.toBytes(sample),
    extension.send(sample),
    extension.compare(sample, sample),
    extension.hash(sample),
    extension.equal(sample, sample),
    extension.sql.casts.ulid_to_bytea(sample),
    extension.sql.casts.timestamp_to_ulid(timestamp("1970-01-01 00:00:00")),
  ])
    expect(extensionExpressionContract(value)?.observability).toBe("tables");
});

test("all 48 pgx_ulid captured members reconcile with executable overloads, schema surfaces and annotations", () => {
  const captured = manifest.contract.members.map((member) => member.id);
  expect(captured).toHaveLength(48);
  const samples = new Map<string, string | Timestamp | Timestamptz>([
    ["$extension:pgx_ulid.ulid", sample],
    ["pg_catalog.timestamp", timestamp("1970-01-01 00:00:00")],
    ["pg_catalog.timestamptz", timestamptz("1970-01-01 00:00:00Z")],
    ["pg_catalog.uuid", "00000000-0000-0000-0000-000000000000"],
  ]);
  // Arguments follow each captured signature: cast source, operator operands or routine parameter list.
  const executable = Object.entries(extension.sql.overloads).map(([member, call]) => {
    const types = member.startsWith("cast:")
      ? [member.slice(5, member.indexOf("->"))]
      : member
          .slice(member.indexOf("(") + 1, -1)
          .split(",")
          .filter(Boolean);
    const values = types.map((name) => samples.get(name));
    expect(values).not.toContain(undefined);
    // SAFETY: each sample is the checked value of the captured argument type named by this overload's member identity.
    const value = (call as (...values: unknown[]) => Parameters<typeof extensionExpressionContract>[0])(...values);
    expect(extensionExpressionContract(value)?.member).toBe(member);
    return member;
  });
  const field = extension.field();
  const arrayField = extension.arrayField();
  const btree = extension.indexes.btree();
  const hash = extension.indexes.hash();
  const schemaMembers = [
    field.metadata.extension?.member,
    arrayField.metadata.extension?.member,
    btree.member,
    hash.member,
  ];
  expect(schemaMembers).toEqual([
    "type:$extension:pgx_ulid.ulid",
    "type:$extension:pgx_ulid._ulid",
    "opclass:$extension:pgx_ulid.ulid_btree_ops/btree",
    "opclass:$extension:pgx_ulid.ulid_hash_ops/hash",
  ]);
  const internal = pgxUlidAnnotations.filter((entry) => entry.disposition === "internal").map((entry) => entry.id);
  const schema = pgxUlidAnnotations.filter((entry) => entry.disposition === "schema").map((entry) => entry.id);
  expect(sorted([...executable, ...schema, ...internal])).toEqual(sorted(captured));
  expect(sorted(pgxUlidAnnotations.map((entry) => entry.id))).toEqual(sorted(captured));
  expect(sorted(schema)).toEqual(sorted(schemaMembers));
  expect(sorted(internal)).toEqual(
    sorted(
      captured.filter(
        (id) =>
          id.startsWith("function of access method:") ||
          id.startsWith("operator of access method:") ||
          id.startsWith("opfamily:") ||
          /\.ulid_(in|out|recv)\(/.test(id),
      ),
    ),
  );
  expect(
    pgxUlidAnnotations.every((entry) => entry.reason.length > 0 && entry.evidence.length >= 4 && entry.semantics),
  ).toBe(true);
  expect(Object.keys(extension.sql.overloads)).toHaveLength(31);
});

test("pgx_ulid fields and indexes bind the installation type, operators and opclasses", () => {
  const field = extension.field();
  expect(field.metadata.extension).toMatchObject({ type: "ulid", member: "type:$extension:pgx_ulid.ulid" });
  expect(field.metadata.extension?.search).toEqual({ filter: true, comparison: true, order: true, text: false });
  expect(field.metadata.extension?.operators?.eq?.member).toBe(
    "operator:$extension:pgx_ulid.=($extension:pgx_ulid.ulid,$extension:pgx_ulid.ulid)",
  );
  expect(field.metadata.extension?.operators?.lte?.name).toBe("<=");
  expect(field.metadata.extension?.operators?.lte?.schema).toBe('custom"ulid');
  expect(extension.indexes.btree()).toMatchObject({ method: "btree", opclass: "ulid_btree_ops", default: true });
  expect(extension.indexes.hash()).toMatchObject({ method: "hash", opclass: "ulid_hash_ops", default: true });
  expect(extension.indexes.btree().input).toEqual({ schema: 'custom"ulid', type: "ulid", dimensions: 0 });
  expect(dialect.sqlToQuery(sql`select ${extension.generate()}`).sql).toContain('"custom""ulid"."gen_ulid"()');
});
