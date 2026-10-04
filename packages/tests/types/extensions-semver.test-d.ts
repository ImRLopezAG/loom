import { sql, type SQL } from "drizzle-orm";
import { pgTable, text, integer, boolean, bigint } from "drizzle-orm/pg-core";
import {
  createSemver_0_40_0,
  type PostgreSqlArray,
  type SemverMultirange,
  type SemverRange,
} from "../../../apps/loom/src/core/extensions/adapters/semver";
const extension = createSemver_0_40_0({
  name: "semver",
  version: "0.40.0",
  schema: "custom",
  apiSupport: { status: "verified", digest: "5a21997dcf96a0af38e49bc1d9309905050a05f18e6afe15f37fb2a63722a86e" },
});
const table = pgTable("packages", {
  label: text(),
  number: integer(),
  large: bigint({ mode: "bigint" }),
  enabled: boolean(),
});
const range = { empty: false, lower: "1.0.0", upper: null, lowerInclusive: true, upperInclusive: false } as const;
const version: "0.40.0" = extension.version;
const schema: "custom" = extension.schema;
const name: "semver" = extension.name;
const sent: SQL<{ readonly hex: string } | null> = extension.sql.functions.semver_send("1.2.3+b");
// @ts-expect-error Native binary send preserves SQL NULL.
const requiredSent: SQL<{ readonly hex: string }> = sent;
void [sent, requiredSent];
const parsed: SQL<string | null> = extension.parse(table.label);
const coerced: SQL<string | null> = extension.coerce("1.2");
const valid: SQL<boolean | null> = extension.isValid(table.label);
const major: SQL<number | null> = extension.major(parsed);
const prerelease: SQL<string | null> = extension.prerelease("1.0.0-rc.1");
const order: SQL<number | null> = extension.compare(parsed, "1.0.0");
const less: SQL<boolean | null> = extension.lessThan(parsed, coerced);
const larger: SQL<string | null> = extension.larger("1.0.0", null);
const maximum: SQL<string | null> = extension.max(parsed);
const filtered: SQL<string | null> = extension.min.filter(sql<boolean>`true`, parsed);
const fromInteger: SQL<string | null> = extension.fromInt4(table.number);
const fromBigint: SQL<string | null> = extension.fromInt8(table.large);
const fromFloat: SQL<string | null> = extension.fromFloat8({ nonfinite: "NaN" });
const fromNumeric: SQL<string | null> = extension.fromNumeric("1.25");
const label: SQL<string | null> = extension.toText(parsed);
const bounds: SQL<SemverRange> = extension.range("1.0.0", null);
const flagged: SQL<SemverRange> = extension.range(null, parsed, "(]");
const empty: SQL<SemverMultirange> = extension.multirange();
const single: SQL<SemverMultirange | null> = extension.multirange(range);
const merged: SQL<SemverMultirange | null> = extension.multirange(range, bounds, flagged);
const cast: SQL<SemverMultirange | null> = extension.sql.casts.semverrange_to_semvermultirange(bounds);
const fromText: SQL<string | null> = extension.sql.casts.text_to_semver(table.label);
const textual: SQL<string | null> = extension.sql.casts.semver_to_text(parsed);
const overload: SQL<string | null> = extension.sql.functions.semver.int2(1);
const variadic: SQL<SemverMultirange | null> = extension.sql.functions.semvermultirange.variadic(range);
const decodedArray: PostgreSqlArray<string> = extension.arrayCodec.decode("{1.0.0}");
// @ts-expect-error SQL NULL remains part of strict routine results.
const required: SQL<string> = parsed;
// @ts-expect-error The range constructor never returns NULL.
const nullableRange: SQL<null> = bounds;
// @ts-expect-error Range bound flags are the four PostgreSQL literals.
extension.range("1.0.0", "2.0.0", "[x");
// @ts-expect-error NULL range flags are rejected natively.
extension.range("1.0.0", "2.0.0", null);
// @ts-expect-error Only captured two/three argument range overloads exist.
extension.range("1.0.0");
// @ts-expect-error Variadic multirange elements must be non-NULL ranges.
extension.multirange(range, null);
// @ts-expect-error Version comparison does not accept numbers.
extension.compare(1, "1.0.0");
// @ts-expect-error Version comparison rejects boolean columns.
extension.lessThan(table.enabled, "1.0.0");
// @ts-expect-error int4 constructors reject bigint columns.
extension.fromInt4(table.large);
// @ts-expect-error int8 constructors take bigint values, not numbers.
extension.fromInt8(1);
// @ts-expect-error Text routines reject integer columns.
extension.isValid(table.number);
// @ts-expect-error Fixed result decoders do not accept caller return casts.
extension.parse<number>("1.0.0");
// @ts-expect-error Positional undefined is not SQL NULL.
extension.major(undefined);
createSemver_0_40_0({
  name: "semver",
  // @ts-expect-error Exact captured version only.
  version: "0.41.0",
  schema: "custom",
  apiSupport: { status: "verified", digest: "5a21997dcf96a0af38e49bc1d9309905050a05f18e6afe15f37fb2a63722a86e" },
});
void [
  version,
  schema,
  name,
  parsed,
  coerced,
  valid,
  major,
  prerelease,
  order,
  less,
  larger,
  maximum,
  filtered,
  fromInteger,
  fromBigint,
  fromFloat,
  fromNumeric,
  label,
  bounds,
  flagged,
  empty,
  single,
  merged,
  cast,
  fromText,
  textual,
  overload,
  variadic,
  decodedArray,
  required,
  nullableRange,
];
