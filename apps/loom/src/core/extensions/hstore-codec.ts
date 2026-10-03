import * as v from "valibot";
import { arrayCodec, createExtensionCodec, decodeFailure, type PostgreSqlArray } from "./codecs";

/** A unique-key text mapping; stored NULL remains distinct from absent keys and the string NULL. */
export interface HstoreValue {
  readonly entries: readonly {
    readonly key: string;
    readonly value: string | null;
  }[];
}

function wellFormedUnicode(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(++index);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
    } else if (code >= 0xdc00 && code <= 0xdfff) return false;
  }
  return true;
}
const text = v.pipe(
  v.string(),
  v.check((value) => !value.includes("\0") && wellFormedUnicode(value), "Expected lossless PostgreSQL UTF8 text"),
);
const hstoreEntries = v.strictObject({
  entries: v.pipe(
    v.array(v.strictObject({ key: text, value: v.nullable(text) })),
    v.check((entries) => new Set(entries.map((entry) => entry.key)).size === entries.length, "Duplicate hstore key"),
  ),
});
// The strict schema validates runtime data while this fixed public type accepts readonly entries.
const value = v.custom<HstoreValue>(
  (input) => v.is(hstoreEntries, input),
  "Expected a unique-key hstore entries wrapper",
);
const quoted = (input: string) => `"${input.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;

/** Decode native hstore output, rather than emulate PostgreSQL's permissive input parser. */
function nativeOutput(source: string): HstoreValue {
  if (source === "") return { entries: [] };
  let cursor = 0;
  const whitespace = () => {
    while (cursor < source.length && /[ \t\n\r\v\f]/.test(source[cursor]!)) cursor++;
  };
  const token = () => {
    if (source[cursor++] !== '"') throw new Error("Expected quoted native hstore text");
    let result = "";
    while (cursor < source.length) {
      const character = source[cursor++]!;
      if (character === '"') return result;
      if (character === "\\") {
        if (source[cursor] !== '"' && source[cursor] !== "\\") throw new Error("Invalid native hstore escape");
        result += source[cursor++]!;
      } else result += character;
    }
    throw new Error("Unterminated native hstore text");
  };
  const entries: { key: string; value: string | null }[] = [];
  while (cursor < source.length) {
    whitespace();
    const key = token();
    whitespace();
    if (source.slice(cursor, cursor + 2) !== "=>") throw new Error("Expected native hstore arrow");
    cursor += 2;
    whitespace();
    let entryValue: string | null;
    if (source[cursor] === '"') entryValue = token();
    else {
      if (source.slice(cursor, cursor + 4) !== "NULL") throw new Error("Expected native hstore value");
      cursor += 4;
      entryValue = null;
    }
    entries.push({ key, value: entryValue });
    whitespace();
    if (cursor === source.length) return { entries };
    if (source[cursor++] !== ",") throw new Error("Expected native hstore separator");
    whitespace();
    if (cursor === source.length) throw new Error("Trailing native hstore separator");
  }
  throw new Error("Invalid native hstore output");
}

/** Parameterized text transport; installation schema is supplied by the selected capability. */
export function createHstoreCodec(schema: string) {
  return createExtensionCodec({
    id: "hstore:hstore:entries:utf8:1",
    sqlType: { schema, name: "hstore" },
    input: value,
    output: value,
    transport: "text",
    encode: (input) =>
      input.entries
        .map((entry) => `${quoted(entry.key)}=>${entry.value === null ? "NULL" : quoted(entry.value)}`)
        .join(", "),
    decode: (input) => nativeOutput(v.parse(text, input)),
  });
}

const dimensions = v.pipe(
  v.array(
    v.strictObject({
      lowerBound: v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647)),
      length: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2147483647)),
    }),
  ),
  v.maxLength(6),
);
const hstoreArray = v.strictObject({ dimensions, values: v.array(v.unknown()) });

function checkArray(input: PostgreSqlArray<HstoreValue>): void {
  const checked = v.parse(hstoreArray, input);
  if (checked.dimensions.some(({ lowerBound, length }) => lowerBound + length > 2147483647))
    throw new Error("PostgreSQL array upper bound overflow");
  if (checked.dimensions.length === 0) {
    if (checked.values.length !== 0) throw new Error("Empty hstore arrays require no values or dimensions");
    return;
  }
  const checkValues = (entries: readonly unknown[], depth: number): void => {
    const dimension = checked.dimensions[depth]!;
    if (entries.length !== dimension.length) throw new Error("Invalid hstore array cardinality");
    for (const entry of entries) {
      if (depth + 1 < checked.dimensions.length) checkValues(v.parse(v.array(v.unknown()), entry), depth + 1);
      else if (entry !== null) v.parse(value, entry);
    }
  };
  checkValues(checked.values, 0);
}

/** Full native ranks 0–6, lower bounds, rectangular nesting and nullable leaves. */
export function createHstoreArrayCodec(schema: string) {
  const array = arrayCodec(createHstoreCodec(schema));
  return Object.freeze({
    ...array,
    encode(input: PostgreSqlArray<HstoreValue>) {
      checkArray(input);
      return array.encode(input);
    },
    // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native driver text is validated by the scalar and array codecs.
    decode(input: unknown) {
      return decodeFailure(() => {
        const result = array.decode(input);
        checkArray(result);
        return result;
      });
    },
  });
}
