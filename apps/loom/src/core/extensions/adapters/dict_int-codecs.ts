import * as v from "valibot";
import { createExtensionCodec } from "../codecs";

const maxlen = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2147483647));
export const dictIntOptionsValidator = v.strictObject({
  maxlen: v.optional(maxlen),
  rejectlong: v.optional(v.boolean()),
  absval: v.optional(v.boolean()),
});
export type DictIntOptions = v.InferOutput<typeof dictIntOptionsValidator>;
export const dictIntResolvedOptionsValidator = v.strictObject({
  maxlen,
  rejectlong: v.boolean(),
  absval: v.boolean(),
});
export type DictIntResolvedOptions = v.InferOutput<typeof dictIntResolvedOptionsValidator>;

/** PostgreSQL dict_int defaults when dictinitoption is NULL. */
export const dictIntDefaultOptions: DictIntResolvedOptions = Object.freeze({
  maxlen: 6,
  rejectlong: false,
  absval: false,
});

const booleanToken = v.union([
  v.literal("true"),
  v.literal("false"),
  v.literal("t"),
  v.literal("f"),
  v.literal("on"),
  v.literal("off"),
  v.literal("1"),
  v.literal("0"),
]);

function parseBoolean(value: string): boolean {
  const token = v.parse(booleanToken, value.toLowerCase());
  return token === "true" || token === "t" || token === "on" || token === "1";
}

function unquote(value: string): string {
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'"))
    return value.slice(1, -1).replaceAll("''", "'");
  return value;
}

/** Parse pg_ts_dict.dictinitoption (`key = 'value', ...`) without inventing keys. */
export function parseDictIntOptions(source: string | null): DictIntResolvedOptions {
  if (source === null || source.trim() === "") return dictIntDefaultOptions;
  const parsed: Partial<DictIntResolvedOptions> = {};
  for (const part of source.split(",")) {
    const match = /^\s*([A-Za-z]+)\s*=\s*(?:'((?:[^']|'')*)'|([^\s,]+))\s*$/.exec(part);
    if (!match) throw new Error("Invalid dict_int option list");
    const key = match[1]!.toLowerCase();
    const value = match[2] !== undefined ? match[2].replaceAll("''", "'") : unquote(match[3]!);
    if (key === "maxlen") {
      if (parsed.maxlen !== undefined) throw new Error("Duplicate dict_int maxlen");
      parsed.maxlen = v.parse(maxlen, Number(value));
    } else if (key === "rejectlong") {
      if (parsed.rejectlong !== undefined) throw new Error("Duplicate dict_int rejectlong");
      parsed.rejectlong = parseBoolean(value);
    } else if (key === "absval") {
      if (parsed.absval !== undefined) throw new Error("Duplicate dict_int absval");
      parsed.absval = parseBoolean(value);
    } else throw new Error("Unknown dict_int option");
  }
  return Object.freeze({ ...dictIntDefaultOptions, ...parsed });
}

export function encodeDictIntOptions(options: DictIntOptions): string | null {
  const checked = v.parse(dictIntOptionsValidator, options);
  const parts: string[] = [];
  if (checked.maxlen !== undefined) parts.push(`maxlen = '${checked.maxlen}'`);
  if (checked.rejectlong !== undefined) parts.push(`rejectlong = '${checked.rejectlong}'`);
  if (checked.absval !== undefined) parts.push(`absval = '${checked.absval}'`);
  return parts.length === 0 ? null : parts.join(", ");
}

export const dictIntOptionsCodec = createExtensionCodec({
  id: "dict_int:options:text:1",
  sqlType: { schema: "pg_catalog", name: "text" },
  input: v.nullable(v.string()),
  output: dictIntResolvedOptionsValidator,
  transport: "text",
  encode: (value) => value,
  decode: (value) => parseDictIntOptions(v.parse(v.nullable(v.string()), value)),
});
