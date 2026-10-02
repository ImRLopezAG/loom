import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { pgTable, boolean } from "drizzle-orm/pg-core";
import { createPgUuidv7_1_6 } from "../../../apps/loom/src/core/extensions/adapters/pg-uuidv7";
import { timestamp, timestamptz } from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { pgUuidv7Annotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg-uuidv7";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pg_uuidv7.json";

const extension = createPgUuidv7_1_6({
  name: "pg_uuidv7",
  version: "1.6",
  schema: 'custom"v7',
  apiSupport: { status: "verified" },
});
const dialect = extensionSqlDialect(nodePgCodecs);

test("pg_uuidv7 binds checked native temporal values, named defaults and qualified UUIDs", () => {
  const civil = timestamp("1970-01-01 00:00:00.123456");
  const instant = timestamptz("1970-01-01 05:30:00.123456+05:30");
  const query = dialect.sqlToQuery(extension.fromTimestamp(civil, true));
  expect(query.params).toEqual(["1970-01-01 00:00:00.123456", true]);
  expect(query.sql).toContain('"custom""v7"."uuid_timestamp_to_v7"');
  expect(query.sql).toContain('::"pg_catalog"."timestamp"');
  expect(query.sql).toContain('"zero" =>');
  expect(query.sql).toContain('::"pg_catalog"."bool"');
  expect(dialect.sqlToQuery(extension.fromTimestamptz(instant)).params).toEqual(["1970-01-01 00:00:00.123456+00"]);
  expect(dialect.sqlToQuery(extension.fromTimestamp(civil, undefined)).params).toEqual(["1970-01-01 00:00:00.123456"]);
  expect(dialect.sqlToQuery(extension.fromTimestamp(null, null)).params).toEqual([null, null]);
  expect(dialect.sqlToQuery(extension.toTimestamp("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF")).params).toEqual([
    "ffffffff-ffff-ffff-ffff-ffffffffffff",
  ]);
  expect(() => extension.toTimestamptz("';drop table temporal;--")).toThrow();
  expect(dialect.sqlToQuery(sql`select ${extension.toTimestamp(extension.v7())}`).sql).not.toContain("::text");
  expect(Object.isFrozen(extension)).toBe(true);
  expect(extension.sql.functions.uuid_generate_v7).toBe(extension.v7);
  expect(extension.sql.functions.uuid_timestamp_to_v7).toBe(extension.fromTimestamp);
  expect(extension.sql.functions.uuid_timestamptz_to_v7).toBe(extension.fromTimestamptz);
  expect(extension.sql.functions.uuid_v7_to_timestamp).toBe(extension.toTimestamp);
  expect(extension.sql.functions.uuid_v7_to_timestamptz).toBe(extension.toTimestamptz);
});

test("pg_uuidv7 randomness is external despite stable SQL metadata, explicit zero=true is table observable", () => {
  const civil = timestamp("1970-01-01 00:00:00.123456");
  const instant = timestamptz("1970-01-01 00:00:00.123456Z");
  const flags = pgTable("flags", { zero: boolean() });
  for (const value of [
    extension.v7(),
    extension.fromTimestamp(civil),
    extension.fromTimestamp(civil, undefined),
    extension.fromTimestamp(civil, false),
    extension.fromTimestamptz(instant, false),
    extension.fromTimestamp(civil, flags.zero),
    extension.fromTimestamptz(instant, sql<boolean>`true`),
  ])
    expect(extensionExpressionContract(value)?.observability).toBe("external");
  for (const value of [
    extension.fromTimestamp(civil, true),
    extension.fromTimestamptz(instant, true),
    extension.toTimestamp("00000000-0000-0000-0000-000000000000"),
    extension.toTimestamptz("ffffffff-ffff-ffff-ffff-ffffffffffff"),
  ])
    expect(extensionExpressionContract(value)?.observability).toBe("tables");
});

test("all five pg_uuidv7 captured members reconcile with complete annotations and native limitations", () => {
  const expressions = [
    extension.v7(),
    extension.fromTimestamp(timestamp("infinity"), true),
    extension.fromTimestamptz(timestamptz("-infinity"), true),
    extension.toTimestamp(null),
    extension.toTimestamptz(null),
  ];
  expect(
    expressions
      .map((value) => extensionExpressionContract(value)?.member)
      .sort((a, b) => (a ?? "").localeCompare(b ?? "")),
  ).toEqual(manifest.contract.members.map((member) => member.id).sort((a, b) => a.localeCompare(b)));
  expect(pgUuidv7Annotations.map((value) => value.id).sort((a, b) => a.localeCompare(b))).toEqual(
    manifest.contract.members.map((member) => member.id).sort((a, b) => a.localeCompare(b)),
  );
  expect(Object.keys(extension.sql.functions)).toHaveLength(5);
  expect(
    pgUuidv7Annotations.every(
      (member) => member.disposition === "query" && member.reason && member.evidence.length >= 4,
    ),
  ).toBe(true);
  expect(dialect.sqlToQuery(extension.fromTimestamp(timestamp("4714-11-24 00:00:00 BC"), true)).params[0]).toBe(
    "4714-11-24 00:00:00.000000 BC",
  );
  expect(
    dialect.sqlToQuery(extension.fromTimestamptz(timestamptz("294276-12-31 23:59:59.999999Z"), true)).params[0],
  ).toBe("294276-12-31 23:59:59.999999+00");
});
