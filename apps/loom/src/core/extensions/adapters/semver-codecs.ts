import * as v from "valibot";
import {
  arrayCodec,
  createExtensionCodec,
  decodeFailure,
  rangeCodec,
  withCodecSqlType,
  type ExtensionCodec,
  type PostgreSqlArray,
  type PostgreSqlRange,
} from "../codecs";
export type { PostgreSqlArray, PostgreSqlRange } from "../codecs";

const version = "(0|[1-9]\\d*)";
const prerelease = "(?:0|[1-9]\\d*|\\d*[A-Za-z-][0-9A-Za-z-]*)";
const build = "[0-9A-Za-z-]+";
/**
 * Exact semver_out fixed points: every text semver 0.40.0 emits and accepts unchanged.
 * Native quirks retained: an identifier directly before "+" skips the leading-zero rule when the first build
 * identifier is not numeric, a prerelease may end with "." before "+", and build metadata may be empty.
 */
export const semverPattern = `^${version}\\.${version}\\.${version}(?:-(?:(?:${prerelease}\\.)*(?:${prerelease}|0\\d+(?=\\+[0-9]*[A-Za-z-]))(?=\\+)|(?:${prerelease}\\.)+(?=\\+)|${prerelease}(?:\\.${prerelease})*(?![^+])))?(?:\\+(?:${build}(?:\\.${build})*)?)?$`;
const expression = new RegExp(semverPattern);
function canonical(value: string): boolean {
  const match = expression.exec(value);
  return Boolean(match) && [match![1], match![2], match![3]].every((part) => Number(part) <= 2147483647);
}
/** Canonical semver text; build metadata is retained although native equality and ordering ignore it. */
export const semverText = v.pipe(
  v.string(),
  v.check(canonical, "Expected canonical semver 0.40.0 text with 31-bit version numbers"),
);
export type SemverText = v.InferOutput<typeof semverText>;
export function semver(value: string): SemverText {
  return v.parse(semverText, value);
}

export function createSemverCodec(schema: string) {
  return createExtensionCodec({
    id: "semver:semver:text:1",
    sqlType: { schema, name: "semver" },
    input: semverText,
    output: semverText,
    transport: "text",
    encode: (value) => value,
    decode: (value) => value,
  });
}
function checkedArray<Input, Output>(codec: ExtensionCodec<PostgreSqlArray<Input>, PostgreSqlArray<Output>>) {
  function bounds<Value>(value: PostgreSqlArray<Value>) {
    if (
      value.dimensions.length > 6 ||
      value.dimensions.some(
        ({ lowerBound, length }) =>
          !Number.isInteger(lowerBound) ||
          lowerBound < -2147483648 ||
          lowerBound > 2147483647 ||
          !Number.isInteger(length) ||
          length < 1 ||
          lowerBound + length - 1 > 2147483647,
      )
    )
      throw new Error("Invalid native semver array bounds");
  }
  return Object.freeze({
    ...codec,
    encode(value: PostgreSqlArray<Input>) {
      bounds(value);
      return codec.encode(value);
    },
    // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native array text is validated by the paired element decoder.
    decode(value: unknown) {
      return decodeFailure(() => {
        const parsed = codec.decode(value);
        bounds(parsed);
        return parsed;
      });
    },
  });
}
export function createSemverArrayCodec(schema: string) {
  return checkedArray(arrayCodec(createSemverCodec(schema)));
}

/** semverrange is continuous: PostgreSQL keeps both bound flags and normalizes empty ranges only. */
export function createSemverRangeCodec(schema: string) {
  return withCodecSqlType(rangeCodec(createSemverCodec(schema)), { schema, name: "semverrange" });
}
export function createSemverRangeArrayCodec(schema: string) {
  return checkedArray(arrayCodec(createSemverRangeCodec(schema)));
}
export type SemverRange = PostgreSqlRange<SemverText>;
export type SemverMultirange = readonly SemverRange[];

function multirangeEntries(source: string): string[] {
  if (!source.startsWith("{") || !source.endsWith("}")) throw new Error("Invalid native semver multirange");
  const entries: string[] = [];
  let cursor = 1;
  if (source[cursor] === "}" && source.length === 2) return entries;
  while (cursor < source.length - 1) {
    const start = cursor;
    if (source[cursor] !== "[" && source[cursor] !== "(") throw new Error("Invalid native semver multirange");
    let quoted = false;
    for (cursor++; cursor < source.length - 1; cursor++) {
      const character = source[cursor];
      if (character === "\\") cursor++;
      else if (character === '"') quoted = !quoted;
      else if (!quoted && (character === "]" || character === ")")) break;
    }
    if (cursor >= source.length - 1) throw new Error("Unterminated native semver multirange");
    entries.push(source.slice(start, ++cursor));
    if (cursor === source.length - 1) return entries;
    if (source[cursor++] !== ",") throw new Error("Invalid native semver multirange delimiter");
  }
  throw new Error("Invalid native semver multirange");
}
/** Native multiranges are sorted, merged and empty-free; inputs are normalized by PostgreSQL, not by Kello. */
export function createSemverMultirangeCodec(schema: string) {
  const range = createSemverRangeCodec(schema);
  const codec: ExtensionCodec<readonly SemverRange[], readonly SemverRange[]> = {
    id: "semver:semvermultirange:text:1",
    sqlType: Object.freeze({ schema, name: "semvermultirange" }),
    transport: "text",
    encode(value: readonly SemverRange[]) {
      return `{${v
        .parse(v.array(v.unknown()), value)
        .map((entry) => {
          // SAFETY: The array was validated above; the paired range codec validates each element before encoding.
          const encoded = range.encode(entry as SemverRange);
          if (encoded === "empty") throw new Error("Native semver multiranges cannot contain empty ranges");
          return encoded;
        })
        .join(",")}}`;
    },
    decode(value) {
      return decodeFailure(() =>
        Object.freeze(
          multirangeEntries(v.parse(v.string(), value)).map((entry) => {
            const decoded = range.decode(entry);
            if (decoded.empty) throw new Error("Native semver multiranges cannot contain empty ranges");
            return decoded;
          }),
        ),
      );
    },
  };
  return Object.freeze(codec);
}
export function createSemverMultirangeArrayCodec(schema: string) {
  return checkedArray(arrayCodec(createSemverMultirangeCodec(schema)));
}
