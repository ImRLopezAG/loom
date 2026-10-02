import { sql, type SQL } from "drizzle-orm";
import { pgTable, timestamp as pgTimestamp, uuid, text, integer, boolean } from "drizzle-orm/pg-core";
import { createPgUuidv7_1_6 } from "../../../apps/loom/src/core/extensions/adapters/pg-uuidv7";
import {
  timestamp,
  timestamptz,
  timestampColumn,
  timestamptzColumn,
  type Timestamp,
  type Timestamptz,
} from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";

const table = pgTable("timestamps", {
  civil: pgTimestamp(),
  civilString: pgTimestamp({ mode: "string" }),
  instant: pgTimestamp({ withTimezone: true }),
  instantString: pgTimestamp({ withTimezone: true, mode: "string" }),
  id: uuid(),
  title: text(),
  number: integer(),
  zero: boolean(),
});
const extension = createPgUuidv7_1_6({
  name: "pg_uuidv7",
  version: "1.6",
  schema: "custom",
  apiSupport: { status: "verified" },
});
const version: "1.6" = extension.version;
const schema: "custom" = extension.schema;
const name: "pg_uuidv7" = extension.name;
const generated: SQL<string> = extension.v7();
const civil: SQL<Timestamp | null> = extension.toTimestamp(table.id);
const instant: SQL<Timestamptz | null> = extension.toTimestamptz(table.id);
const converted: SQL<string | null> = extension.fromTimestamp(timestamp("1970-01-01 00:00:00.123456"), true);
extension.fromTimestamp(timestampColumn(table.civil), table.zero);
extension.fromTimestamp(timestampColumn(table.civilString), undefined);
extension.fromTimestamptz(timestamptzColumn(table.instant), sql<boolean>`true`);
extension.fromTimestamptz(timestamptzColumn(table.instantString), null);
extension.fromTimestamp(civil.as("civil"), false);
extension.fromTimestamptz(instant.as("instant"), true);
extension.toTimestamp(generated.as("id"));
extension.toTimestamptz(converted);
extension.fromTimestamp(null, null);
extension.fromTimestamptz(timestamptz("infinity"));
extension.sql.functions.uuid_v7_to_timestamp(null);
// @ts-expect-error Civil and instant native identities are distinct.
extension.fromTimestamp(timestamptz("1970-01-01 00:00:00Z"));
// @ts-expect-error An instant cannot infer the timezone of civil calendar text.
extension.fromTimestamptz(timestamp("1970-01-01 00:00:00"));
// @ts-expect-error Native temporal SQL retains its distinct output tag.
extension.fromTimestamp(instant);
// @ts-expect-error Native temporal SQL retains its distinct output tag.
extension.fromTimestamptz(civil);
// @ts-expect-error Date has already lost native microseconds/identity.
extension.fromTimestamp(new Date());
// @ts-expect-error Native date-mode columns require an identity-checking bridge.
extension.fromTimestamp(table.civil);
// @ts-expect-error Native string-mode columns require an identity-checking bridge.
extension.fromTimestamptz(table.instantString);
// @ts-expect-error Raw strings cannot masquerade as exact native documents.
extension.fromTimestamptz("1970-01-01 00:00:00Z");
// @ts-expect-error Text SQL cannot establish native civil identity.
extension.fromTimestamp(sql<string>`'1970-01-01'`);
// @ts-expect-error Numeric epoch conversion is not this API's input contract.
extension.fromTimestamp(0);
// @ts-expect-error UUID storage identity differs from plain text storage.
extension.toTimestamp(table.title);
// @ts-expect-error Numeric storage is not UUID storage.
extension.toTimestamptz(table.number);
// @ts-expect-error Zero flag is a checked boolean, not text.
extension.fromTimestamp(timestamp("1970-01-01 00:00:00"), "true");
// @ts-expect-error Numeric flags are not booleans.
extension.fromTimestamptz(timestamptz("1970-01-01 00:00:00Z"), table.number);
// @ts-expect-error First captured timestamp argument is required.
extension.fromTimestamp();
// @ts-expect-error Captured conversion accepts at most two arguments.
extension.fromTimestamptz(null, true, false);
// @ts-expect-error Generators have no seed argument.
extension.v7(true);
// @ts-expect-error Decoder fixes the native output, with no result generic.
extension.toTimestamp<Date>(generated);
// @ts-expect-error Decoder fixes the native output, with no result generic.
extension.fromTimestamp<string>(timestamp("1970-01-01 00:00:00"));
createPgUuidv7_1_6({
  name: "pg_uuidv7",
  // @ts-expect-error Exact captured extension version only.
  version: "1.5",
  schema: "custom",
  apiSupport: { status: "verified" },
});
createPgUuidv7_1_6({
  // @ts-expect-error Exact underscore extension identity is preserved.
  name: "pg-uuidv7",
  version: "1.6",
  schema: "custom",
  apiSupport: { status: "verified" },
});
void [version, schema, name, generated, civil, instant, converted];
