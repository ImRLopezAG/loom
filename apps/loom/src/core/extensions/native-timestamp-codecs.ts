import * as v from "valibot";
import { is, sql } from "drizzle-orm";
import { PgTimestamp, PgTimestampString, type AnyPgColumn } from "drizzle-orm/pg-core";
import { createExtensionCodec, nullableCodec } from "./codecs";
import { checkedExtensionExpression } from "./sql";

/** Civil Gregorian time, with exact microseconds and no implicit timezone. */
export interface Timestamp {
  readonly type: "timestamp";
  readonly text: string;
}
/** An instant normalized to UTC; the original timezone is not retained. */
export interface Timestamptz {
  readonly type: "timestamptz";
  readonly text: string;
}

// PostgreSQL 18 timestamp.h: finite microseconds relative to 2000-01-01; infinity is separate.
const minimum = -211813488000000000n;
const end = 9223371331200000000n;
const epochJulianDay = 2451545n;
const dayMicroseconds = 86400000000n;
const secondMicroseconds = 1000000n;
const iso =
  /^(\d{4,6})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?(Z|[+-](?:\d{2}(?::\d{2}(?::\d{2})?)?|\d{4}|\d{6}))?( BC)?$/;

function floorDivision(value: bigint, divisor: bigint): bigint {
  const quotient = value / divisor;
  return value % divisor < 0n ? quotient - 1n : quotient;
}
/** Proleptic Gregorian date -> Julian day; all components are exact integers. */
function julianDay(year: bigint, month: bigint, day: bigint): bigint {
  const adjustment = (14n - month) / 12n;
  const y = year + 4800n - adjustment;
  const m = month + 12n * adjustment - 3n;
  return day + (153n * m + 2n) / 5n + 365n * y + y / 4n - y / 100n + y / 400n - 32045n;
}
/** Inverse Gregorian conversion on the finite native timestamp range (Julian day >= 0). */
function civilDate(julian: bigint) {
  const a = julian + 32044n;
  const b = (4n * a + 3n) / 146097n;
  const c = a - (146097n * b) / 4n;
  const d = (4n * c + 3n) / 1461n;
  const e = c - (1461n * d) / 4n;
  const m = (5n * e + 2n) / 153n;
  return { year: 100n * b + d - 4800n + m / 10n, month: m + 3n - 12n * (m / 10n), day: e - (153n * m + 2n) / 5n + 1n };
}
function numericOffset(source: string): bigint {
  if (source === "Z") return 0n;
  const parts = source.slice(1).includes(":") ? source.slice(1).split(":") : source.slice(1).match(/\d{2}/g)!;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] ?? 0);
  const seconds = Number(parts[2] ?? 0);
  if (hours > 15 || minutes > 59 || seconds > 59) throw new Error("Invalid timestamp numeric timezone offset");
  return BigInt(hours * 3600 + minutes * 60 + seconds) * (source[0] === "-" ? -1n : 1n);
}
function canonical(text: string, withTimezone: boolean): string {
  if (text === "infinity" || text === "-infinity") return text;
  const match = iso.exec(text);
  if (!match) throw new Error("Expected exact ISO timestamp text with at most six fractional digits");
  const year = BigInt(match[1]!);
  const bc = match[9] !== undefined;
  if (year === 0n || year > (bc ? 4714n : 294277n)) throw new Error("Timestamp year outside native range");
  const astronomicalYear = bc ? 1n - year : year;
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leap = astronomicalYear % 4n === 0n && (astronomicalYear % 100n !== 0n || astronomicalYear % 400n === 0n);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const fraction = BigInt((match[7] ?? "").padEnd(6, "0"));
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > monthDays[month - 1]! ||
    hour > 24 ||
    minute > 59 ||
    second > 59 ||
    (hour === 24 && (minute !== 0 || second !== 0 || fraction !== 0n))
  )
    throw new Error("Invalid Gregorian timestamp calendar or time");
  const offset = match[8];
  if (withTimezone !== (offset !== undefined))
    throw new Error(
      withTimezone
        ? "Timestamptz requires an explicit numeric offset or Z"
        : "Civil timestamp must not include a timezone",
    );
  const counter =
    (julianDay(astronomicalYear, BigInt(month), BigInt(day)) - epochJulianDay) * dayMicroseconds +
    BigInt(hour * 3600 + minute * 60 + second) * secondMicroseconds +
    fraction -
    (offset === undefined ? 0n : numericOffset(offset) * secondMicroseconds);
  if (counter < minimum || counter >= end) throw new Error("Timestamp outside finite PostgreSQL range");
  const days = floorDivision(counter, dayMicroseconds);
  const time = counter - days * dayMicroseconds;
  const date = civilDate(days + epochJulianDay);
  const eraYear = date.year <= 0n ? 1n - date.year : date.year;
  const formattedDate = `${String(eraYear).padStart(4, "0")}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
  const formattedTime = `${String(time / 3600000000n).padStart(2, "0")}:${String((time / 60000000n) % 60n).padStart(2, "0")}:${String((time / secondMicroseconds) % 60n).padStart(2, "0")}.${String(time % secondMicroseconds).padStart(6, "0")}`;
  return `${formattedDate} ${formattedTime}${withTimezone ? "+00" : ""}${date.year <= 0n ? " BC" : ""}`;
}
const timestampSchema = v.pipe(
  v.object({
    type: v.literal("timestamp"),
    text: v.pipe(
      v.string(),
      v.transform((text) => canonical(text, false)),
    ),
  }),
  v.transform((value) => Object.freeze(value)),
);
const timestamptzSchema = v.pipe(
  v.object({
    type: v.literal("timestamptz"),
    text: v.pipe(
      v.string(),
      v.transform((text) => canonical(text, true)),
    ),
  }),
  v.transform((value) => Object.freeze(value)),
);

/** Exact ISO civil text (space/T separator), BC and infinity. Relative/locale forms and year zero are rejected. */
export function timestamp(text: string): Timestamp {
  return v.parse(timestampSchema, { type: "timestamp", text });
}
/** Exact ISO instant text with numeric offset/Z, normalized to UTC without Date or floating-point epoch arithmetic. */
export function timestamptz(text: string): Timestamptz {
  return v.parse(timestamptzSchema, { type: "timestamptz", text });
}
/** Requires ISO DateStyle output; SQL/Postgres/German styles fail closed and invalidate a decoding invocation. */
export const timestampCodec = createExtensionCodec({
  id: "pg:timestamp:1",
  sqlType: { schema: "pg_catalog", name: "timestamp" },
  input: timestampSchema,
  output: timestampSchema,
  transport: "text",
  encode: (value) => value.text,
  decode: (value) => ({ type: "timestamp", text: v.parse(v.string(), value) }),
});
/** Requires ISO DateStyle and numeric-offset output; timezone abbreviations and already-rounded Date values are rejected. */
export const timestamptzCodec = createExtensionCodec({
  id: "pg:timestamptz:1",
  sqlType: { schema: "pg_catalog", name: "timestamptz" },
  input: timestamptzSchema,
  output: timestamptzSchema,
  transport: "text",
  encode: (value) => value.text,
  decode: (value) => ({ type: "timestamptz", text: v.parse(v.string(), value) }),
});
const nullableTimestampCodec = nullableCodec(timestampCodec);
const nullableTimestamptzCodec = nullableCodec(timestamptzCodec);
type NativeTimestampColumn = AnyPgColumn<{ dataType: "object date" | "string timestamp" }>;
function assertColumn(column: NativeTimestampColumn, withTimezone: boolean): void {
  if ((!is(column, PgTimestamp) && !is(column, PgTimestampString)) || column.withTimezone !== withTimezone)
    throw new Error(`Expected native ${withTimezone ? "timestamptz" : "timestamp"} column`);
}
/** Preserves native column SQL; timezone identity is checked at runtime because pinned Drizzle erases it from built-column types. */
export function timestampColumn(column: NativeTimestampColumn) {
  assertColumn(column, false);
  return checkedExtensionExpression(sql`${column}`, nullableTimestampCodec, [], undefined, "pg:timestamp:column");
}
/** Accepts only actual PgTimestamp/PgTimestampString columns with timezone; never selects and re-encodes a Date. */
export function timestamptzColumn(column: NativeTimestampColumn) {
  assertColumn(column, true);
  return checkedExtensionExpression(sql`${column}`, nullableTimestamptzCodec, [], undefined, "pg:timestamptz:column");
}
