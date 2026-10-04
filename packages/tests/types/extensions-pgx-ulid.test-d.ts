import { sql, type SQL } from "drizzle-orm";
import { pgTable, timestamp as pgTimestamp, uuid, text, integer } from "drizzle-orm/pg-core";
import { createPgxUlid_0_2_2, ulid, type Ulid } from "../../../apps/loom/src/core/extensions/adapters/pgx-ulid";
import type { PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import {
  timestamp,
  timestamptz,
  timestampColumn,
  timestamptzColumn,
  type Timestamp,
  type Timestamptz,
} from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";

const digest = "e2e491782b819b700106736a81ffa9922f24226e1d18ec02ce90931dcef0a60d";
const table = pgTable("identifiers", {
  civil: pgTimestamp(),
  instant: pgTimestamp({ withTimezone: true, mode: "string" }),
  id: uuid(),
  title: text(),
  number: integer(),
});
const extension = createPgxUlid_0_2_2({
  name: "pgx_ulid",
  version: "0.2.2",
  schema: "custom",
  apiSupport: { status: "verified", digest },
});
const version: "0.2.2" = extension.version;
const schema: "custom" = extension.schema;
const name: "pgx_ulid" = extension.name;
const value: Ulid = ulid("01gv5pa9eqg7d82q3y4pkbzsyv");
const generated: SQL<Ulid> = extension.generate();
const monotonic: SQL<Ulid> = extension.generateMonotonic();
const fromCivil: SQL<Ulid | null> = extension.fromTimestamp(timestamp("2023-03-10 12:00:49.111"));
const fromInstant: SQL<Ulid | null> = extension.fromTimestamptz(timestamptzColumn(table.instant));
const fromUuid: SQL<Ulid | null> = extension.fromUuid(table.id);
const civil: SQL<Timestamp | null> = extension.toTimestamp(generated);
const instant: SQL<Timestamptz | null> = extension.toTimestamptz(value);
const asUuid: SQL<string | null> = extension.toUuid(fromUuid);
const bytes: SQL<{ hex: string } | null> = extension.toBytes("01GV5PA9EQG7D82Q3Y4PKBZSYV");
const sent: SQL<{ hex: string } | null> = extension.send(monotonic.as("id"));
const order: SQL<number | null> = extension.compare(value, generated);
const hash: SQL<number | null> = extension.hash(value);
const equal: SQL<boolean | null> = extension.equal(fromCivil, fromInstant);
const castCivil: SQL<Timestamp | null> = extension.sql.casts.ulid_to_timestamp(value);
const castBack: SQL<Ulid | null> = extension.sql.casts.timestamp_to_ulid(timestampColumn(table.civil));
const castUuid: SQL<Ulid | null> = extension.sql.casts.uuid_to_ulid(table.id);
const castBytes: SQL<{ hex: string } | null> = extension.sql.casts.ulid_to_bytea(null);
const predicate: SQL<boolean | null> = extension.sql.functions.ulid_ge(null, value);
const array: PostgreSqlArray<Ulid> = extension.arrayCodec.decode(`{${value}}`);
extension.lessThan(generated.as("left"), sql<Ulid>`${value}`);
extension.fromTimestamp(civil);
extension.fromTimestamptz(instant);
extension.fromTimestamp(null);
extension.indexes.btree();
extension.indexes.hash();
// @ts-expect-error Civil and instant native identities are distinct.
extension.fromTimestamp(timestamptz("1970-01-01 00:00:00Z"));
// @ts-expect-error An instant cannot infer the timezone of civil calendar text.
extension.fromTimestamptz(timestamp("1970-01-01 00:00:00"));
// @ts-expect-error Date has already lost native microseconds and identity.
extension.fromTimestamp(new Date());
// @ts-expect-error Native date-mode columns require an identity-checking bridge.
extension.fromTimestamp(table.civil);
// @ts-expect-error Raw strings cannot masquerade as native temporal documents.
extension.fromTimestamptz("1970-01-01 00:00:00Z");
// @ts-expect-error Text storage is not UUID storage.
extension.fromUuid(table.title);
// @ts-expect-error Numeric storage is not a ULID.
extension.toUuid(table.number);
// @ts-expect-error UUID SQL is not ULID SQL; use fromUuid or the captured cast.
extension.toTimestamp(sql<string>`gen_random_uuid()`);
// @ts-expect-error Text SQL cannot establish ULID identity.
extension.equal(sql<string>`'01GV5PA9EQG7D82Q3Y4PKBZSYV'`, value);
// @ts-expect-error A ULID is not a numeric epoch.
extension.toTimestamptz(0);
// @ts-expect-error Generators take no seed or timestamp argument.
extension.generate(value);
// @ts-expect-error Captured comparison takes exactly two operands.
extension.compare(value);
// @ts-expect-error Captured hash takes one ULID.
extension.hash(value, value);
// @ts-expect-error Decoders fix the native output, with no result generic.
extension.toTimestamp<Date>(value);
// @ts-expect-error Only captured casts exist; there is no text cast.
void extension.sql.casts.ulid_to_text;
// @ts-expect-error Native IO callbacks are not callable request helpers.
void extension.sql.functions.ulid_recv;
// @ts-expect-error Plain strings are not branded ULIDs.
const unbranded: Ulid = "01GV5PA9EQG7D82Q3Y4PKBZSYV";
createPgxUlid_0_2_2({
  name: "pgx_ulid",
  // @ts-expect-error Exact captured extension version only.
  version: "0.2.1",
  schema: "custom",
  apiSupport: { status: "verified", digest },
});
createPgxUlid_0_2_2({
  // @ts-expect-error The PG17/18 extension name is pgx_ulid, not the legacy ulid extension.
  name: "ulid",
  version: "0.2.2",
  schema: "custom",
  apiSupport: { status: "verified", digest },
});
void [
  version,
  schema,
  name,
  value,
  fromCivil,
  fromInstant,
  civil,
  instant,
  asUuid,
  bytes,
  sent,
  order,
  hash,
  equal,
  castCivil,
  castBack,
  castUuid,
  castBytes,
  predicate,
  array,
  unbranded,
];
