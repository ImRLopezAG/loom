import { sql, type SQL } from "drizzle-orm";
import { pgTable, timestamp as pgTimestamp, text, boolean } from "drizzle-orm/pg-core";
import {
  timestamp,
  timestamptz,
  timestampColumn,
  timestamptzColumn,
  timestampCodec,
  timestamptzCodec,
  type Timestamp,
  type Timestamptz,
} from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";
import { createSqlFunction } from "../../../apps/loom/src/core/extensions/sql";
import { nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";

const table = pgTable("temporal", {
  civilDate: pgTimestamp(),
  civilString: pgTimestamp({ mode: "string" }),
  instantDate: pgTimestamp({ withTimezone: true }),
  instantString: pgTimestamp({ mode: "string", withTimezone: true }),
  title: text(),
  enabled: boolean(),
});
const base = { schema: "public", dependencies: [], observability: "tables", authority: "query" } as const;
const civil = createSqlFunction({
  ...base,
  name: "identity_timestamp",
  member: "fixture:identity_timestamp",
  arguments: [nullableCodec(timestampCodec)] as const,
  result: nullableCodec(timestampCodec),
});
const instant = createSqlFunction({
  ...base,
  name: "identity_timestamptz",
  member: "fixture:identity_timestamptz",
  arguments: [nullableCodec(timestamptzCodec)] as const,
  result: nullableCodec(timestamptzCodec),
});
const civilResult: SQL<Timestamp | null> = civil(timestamp("2024-01-01 00:00:00.123456"));
const instantResult: SQL<Timestamptz | null> = instant(timestamptz("2024-01-01 00:00:00.123456Z"));
const civilBridge: SQL<Timestamp | null> = timestampColumn(table.civilDate);
const instantBridge: SQL<Timestamptz | null> = timestamptzColumn(table.instantString);
civil(timestampColumn(table.civilString));
instant(timestamptzColumn(table.instantDate));
civil(null);
instant(null);
// Pinned Drizzle erases withTimezone; wrong-kind raw columns are rejected at runtime by the bridge.
timestampColumn(table.instantDate);
// @ts-expect-error Civil and instant document tags are distinct SQL input contracts.
civil(timestamptz("2024-01-01 00:00:00Z"));
// @ts-expect-error Instant inputs cannot silently guess a timezone for civil values.
instant(timestamp("2024-01-01 00:00:00"));
// @ts-expect-error Typed SQL expressions also retain their civil/instant identity.
civil(instantBridge);
// @ts-expect-error Typed SQL expressions also retain their civil/instant identity.
instant(civilBridge);
// @ts-expect-error A Date has already lost native precision and identity.
civil(new Date());
// @ts-expect-error A text literal is not a checked timestamp document.
instant("2024-01-01 00:00:00Z");
// @ts-expect-error Generic string SQL cannot establish native timestamp identity.
civil(sql<string>`'2024-01-01 00:00:00'`);
// @ts-expect-error Date SQL cannot establish exact native timestamp identity.
civil(sql<Date>`now()`);
// @ts-expect-error Boolean SQL cannot establish native timestamp identity.
instant(sql<boolean>`true`);
// @ts-expect-error Native Date columns require the checked bridge.
instant(table.instantDate);
// @ts-expect-error Text storage cannot masquerade as timestamp storage.
timestampColumn(table.title);
// @ts-expect-error Boolean storage cannot masquerade as timestamp storage.
timestamptzColumn(table.enabled);
// @ts-expect-error The bridge accepts proven column objects, not raw SQL.
timestampColumn(sql<Date>`now()`);
// @ts-expect-error The bridge accepts proven column objects, not Date values.
timestamptzColumn(new Date());
// @ts-expect-error The checked bridge fixes its output, with no caller-selected result generic.
timestampColumn<string>(table.civilDate);
// @ts-expect-error The checked codec fixes its output, with no caller-selected result generic.
civil<Date>(timestamp("2024-01-01 00:00:00"));
void [civilResult, instantResult, civilBridge, instantBridge];
