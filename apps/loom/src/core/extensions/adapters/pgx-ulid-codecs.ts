import * as v from "valibot";
import { arrayCodec, createExtensionCodec, decodeFailure, type PostgreSqlArray } from "../codecs";

// pgx_ulid 0.2.2 (ulid 1.1) decodes 26 case-insensitive Crockford characters without I/L/O/U aliases and silently drops
// bits above 128, so a leading 8-Z would not round-trip. Native output is always canonical upper case.
const canonical = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/;
// Non-Unicode case-insensitive matching never folds non-ASCII characters onto ASCII letters.
const input = v.pipe(
  v.string(),
  v.regex(/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i, "Expected a 128-bit Crockford base32 ULID"),
  v.transform((text) => text.toUpperCase()),
);
const value = v.pipe(v.string(), v.regex(canonical, "Expected canonical upper-case ULID output"), v.brand("Ulid"));
export type Ulid = v.InferOutput<typeof value>;
/** Normalizes lossless ULID text to the canonical upper-case form PostgreSQL returns. */
export const ulid = (text: string): Ulid => v.parse(value, v.parse(input, text));
export function createUlidCodec(schema: string) {
  return createExtensionCodec({
    id: "pgx_ulid:ulid:crockford:1",
    sqlType: { schema, name: "ulid" },
    input,
    output: value,
    transport: "text",
    encode: (text) => text,
    decode: (text) => text,
  });
}
/** Full native dimensions, lower bounds, nested values and NULL elements. */
export function createUlidArrayCodec(schema: string) {
  const array = arrayCodec(createUlidCodec(schema));
  const dimensions = v.pipe(
    v.array(
      v.strictObject({
        lowerBound: v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647)),
        length: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2147483647)),
      }),
    ),
    v.maxLength(6),
  );
  const bounds = (checked: PostgreSqlArray<string>) => {
    if (v.parse(dimensions, checked.dimensions).some(({ lowerBound, length }) => lowerBound + length > 2147483647))
      throw new Error("PostgreSQL array upper bound overflow");
  };
  return Object.freeze({
    ...array,
    encode(values: PostgreSqlArray<string>) {
      bounds(values);
      return array.encode(values);
    },
    // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Driver array text is validated by the fixed native array codec.
    decode(driver: unknown) {
      return decodeFailure(() => {
        const result = array.decode(driver);
        bounds(result);
        return result;
      });
    },
  });
}
