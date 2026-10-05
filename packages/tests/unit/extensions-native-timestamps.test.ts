import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { pgTable, timestamp as pgTimestamp, date, text, boolean } from "drizzle-orm/pg-core";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import {
  timestamp,
  timestamptz,
  timestampCodec,
  timestamptzCodec,
  timestampColumn,
  timestamptzColumn,
} from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";
import { createSqlFunction, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";

test("civil timestamps retain Gregorian calendar, full native range, era and six microseconds", () => {
  for (const [input, expected] of [
    ["2000-02-29T12:34:56.123456", "2000-02-29 12:34:56.123456"],
    ["2024-02-29 00:00:00.1", "2024-02-29 00:00:00.100000"],
    ["0001-02-29 00:00:00 BC", "0001-02-29 00:00:00.000000 BC"],
    ["4714-11-24 00:00:00 BC", "4714-11-24 00:00:00.000000 BC"],
    ["294276-12-31 23:59:59.999999", "294276-12-31 23:59:59.999999"],
    ["10000-01-01T00:00:00", "10000-01-01 00:00:00.000000"],
    ["0001-12-31 24:00:00 BC", "0001-01-01 00:00:00.000000"],
    ["infinity", "infinity"],
    ["-infinity", "-infinity"],
  ]) {
    const value = timestamp(input!);
    expect(value).toEqual({ type: "timestamp", text: expected });
    expect(Object.isFrozen(value)).toBe(true);
    expect(timestampCodec.encode(value)).toBe(expected);
    expect(timestampCodec.decode(input)).toEqual(value);
  }
  for (const invalid of [
    "1900-02-29 00:00:00",
    "2023-02-29 00:00:00",
    "0002-02-29 00:00:00 BC",
    "2024-04-31 00:00:00",
    "0000-01-01 00:00:00",
    "0000-01-01 00:00:00 BC",
    "4714-11-23 23:59:59.999999 BC",
    "294277-01-01 00:00:00",
    "2000-01-01 00:00:00.1234567",
    "2000-01-01 00:00:00Z",
    "2000-01-01 00:00:00+00",
    "now",
    "01/02/2024 00:00:00",
    "2024-01-01 25:00:00",
    "2024-01-01 00:60:00",
    "2024-01-01 24:00:00.000001",
  ])
    expect(() => timestamp(invalid)).toThrow();
});

test("instant timestamps normalize numeric offset seconds with exact day/year/BC rollover", () => {
  for (const [input, expected] of [
    ["2024-01-01T00:00:00.123456Z", "2024-01-01 00:00:00.123456+00"],
    ["2024-01-01 00:00:00+05:45", "2023-12-31 18:15:00.000000+00"],
    ["2024-01-01 23:59:59.999999-00:00:01", "2024-01-02 00:00:00.999999+00"],
    ["2024-01-01 00:00:00+00:00:01", "2023-12-31 23:59:59.000000+00"],
    ["0001-01-01 00:00:00+00:00:01", "0001-12-31 23:59:59.000000+00 BC"],
    ["0001-12-31 23:59:59-00:00:01 BC", "0001-01-01 00:00:00.000000+00"],
    ["1900-01-01 05:41:16+05:41:16", "1900-01-01 00:00:00.000000+00"],
    ["1900-01-01 05:41:16+054116", "1900-01-01 00:00:00.000000+00"],
    ["2024-01-01 00:00:00-15:59:59", "2024-01-01 15:59:59.000000+00"],
    ["4714-11-23 23:59:59-00:00:01 BC", "4714-11-24 00:00:00.000000+00 BC"],
    ["294277-01-01 00:00:00+00:00:01", "294276-12-31 23:59:59.000000+00"],
    ["infinity", "infinity"],
    ["-infinity", "-infinity"],
  ]) {
    const value = timestamptz(input!);
    expect(value).toEqual({ type: "timestamptz", text: expected });
    expect(Object.isFrozen(value)).toBe(true);
    expect(timestamptzCodec.encode(value)).toBe(expected);
    expect(timestamptzCodec.decode(input)).toEqual(value);
  }
  for (const invalid of [
    "2024-01-01 00:00:00",
    "2024-01-01 00:00:00 UTC",
    "2024-01-01 00:00:00 America/New_York",
    "2024-01-01 00:00:00+16",
    "2024-01-01 00:00:00+01:60",
    "2024-01-01 00:00:00+01:00:60",
    "2024-01-01 00:00:00.1234567Z",
    "4714-11-24 00:00:00+00:00:01 BC",
    "294276-12-31 23:59:59.999999-00:00:01",
    "today",
  ])
    expect(() => timestamptz(invalid)).toThrow();
});

test("timestamp codecs reject rounded driver values and unsupported DateStyle output", () => {
  for (const codec of [timestampCodec, timestamptzCodec]) {
    for (const invalid of [
      new Date("2000-01-01T00:00:00Z"),
      0,
      null,
      {},
      "01/02/2024 00:00:00",
      "Tue Jan 02 00:00:00 2024 UTC",
      "02.01.2024 00:00:00",
    ])
      expect(() => codec.decode(invalid)).toThrow();
    expect(codec.transport).toBe("text");
  }
  expect(timestampCodec.sqlType).toEqual({ schema: "pg_catalog", name: "timestamp" });
  expect(timestamptzCodec.sqlType).toEqual({ schema: "pg_catalog", name: "timestamptz" });
  expect(timestampCodec.id).toBe("pg:timestamp:1");
  expect(timestamptzCodec.id).toBe("pg:timestamptz:1");
});

test("native column bridges verify physical identity and leave scalar SQL native", () => {
  const columns = pgTable("events", {
    civil: pgTimestamp(),
    civilString: pgTimestamp({ mode: "string" }),
    instant: pgTimestamp({ withTimezone: true }),
    instantString: pgTimestamp({ withTimezone: true, mode: "string" }),
    date: date({ mode: "date" }),
    title: text(),
    flag: boolean(),
  });
  const dialect = extensionSqlDialect(nodePgCodecs);
  for (const column of [columns.civil, columns.civilString])
    expect(dialect.sqlToQuery(timestampColumn(column)).sql).toContain('"events"."civil');
  for (const column of [columns.instant, columns.instantString])
    expect(dialect.sqlToQuery(timestamptzColumn(column)).sql).not.toContain("::text");
  expect(() => timestampColumn(columns.instant)).toThrow();
  expect(() => timestamptzColumn(columns.civil)).toThrow();
  expect(() => timestampColumn(columns.date)).toThrow();
  const identity = createSqlFunction({
    schema: "public",
    name: "identity_timestamp",
    member: "fixture:identity_timestamp",
    arguments: [nullableCodec(timestampCodec)] as const,
    result: nullableCodec(timestampCodec),
    authority: "query",
    dependencies: [],
    observability: "tables",
  });
  const compiled = dialect.sqlToQuery(identity(timestamp("2024-01-01 00:00:00.123456")));
  expect(compiled.params).toEqual(["2024-01-01 00:00:00.123456"]);
  expect(compiled.sql).toContain('::"pg_catalog"."timestamp"');
  expect(dialect.sqlToQuery(sql`select ${timestampColumn(columns.civil)}`).sql).not.toContain("::text");
});
