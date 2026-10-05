import * as v from "valibot";
import { Column, is, SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import type { ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  decodeFailure,
  integerCodec,
  textCodec,
  type ExtensionCodec,
  type PostgreSqlArray,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { createSqlFunction } from "../sql";

/**
 * Literal bigint and not-null int8 columns compose. `SQL<bigint>` is a TypeScript claim
 * only: native PG_GETARG_INT64 reads SQL NULL as 0 and encodes it as `gY`, same as 0n.
 */
export type HashidsInt8Input =
  | bigint
  | SQL<bigint>
  | SQL.Aliased<bigint>
  | AnyPgColumn<{ data: bigint; notNull: true }>;
type AnyCodec = ExtensionCodec<never, unknown>;
type LegacySettings = [] | [salt: string] | [salt: string, minLength: number];
type Settings =
  | []
  | [salt: string]
  | [salt: string, minLength: number]
  | [salt: string, minLength: number, alphabet: string];

type HashidsNativeSymbol = "id_encode" | "id_encode_array" | "id_decode" | "id_decode_once";

/** Catalogue identity does not prove a repaired native binary. No SQL is emitted on rejection. */
export class PgHashidsNativeSafetyError extends Error {
  readonly code = "PG_HASHIDS_NATIVE_REPAIR_REQUIRED";
  readonly disposition = "safety-rejected";
  readonly version = "1.2.1";
  readonly manifestDigest = "56a138e83f06ff23344a428d6486237eb9c875db35df970ceb4bcb60240a4041";

  constructor(
    readonly member: string,
    readonly nativeSymbol: HashidsNativeSymbol,
  ) {
    const defect =
      nativeSymbol === "id_encode" || nativeSymbol === "id_encode_array"
        ? "native text allocation omits VARHDRSZ"
        : "native decoder input bounds are not repaired";
    super(
      `pg_hashids 1.2.1 ${member} is safety-rejected: ${defect}; verified native repair of the exact binary is required`,
    );
    this.name = "PgHashidsNativeSafetyError";
  }
}

const defaultAlphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
const int8 = v.pipe(v.bigint(), v.minValue(-9223372036854775808n), v.maxValue(9223372036854775807n));
const salt = v.pipe(
  v.string(),
  v.check((value) => !value.includes("\0"), "PostgreSQL text cannot contain NUL"),
);
// hashids_estimate_encoded_size stores min_hash_length in a signed int and returns result_len+2.
// minLength 2147483646..2147483647 wrap that int and calloc a ~2^64 buffer.
const minLength = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483645));
// hashids_init3 returns NULL for these alphabets and pg_hashids then dereferences it; bytes, not characters, are shuffled.
// Bytes >= 0x80 follow the Linux/Neon unsigned-char ABI; Apple signed-char standalone hashids.c is not the native identity.
const alphabet = v.pipe(
  v.string(),
  v.regex(/^[\x21-\x7e]+$/, "pg_hashids alphabets must be printable ASCII without spaces"),
  v.check((value) => new Set(value.split("")).size >= 16, "pg_hashids alphabets need at least 16 unique characters"),
);
// Unknown characters make numbers_count 0, then hashids_decode writes past calloc(0).
// Alphabet membership prevents that write. It does not prevent minLength>0 trailing-guard
// reads past the hash NUL (pinned v1.2.1 hashids.c:705). Exact guard identity requires
// native salt-shuffled state; admission for that class remains an unresolved contract.
function admitHash(value: string, characters = defaultAlphabet) {
  if (!value || !value.split("").every((character) => characters.includes(character)))
    throw new Error("Invalid pg_hashids hash for its alphabet");
  return value;
}
const numbers = v.object({
  dimensions: v.tuple([v.object({ lowerBound: v.number(), length: v.pipe(v.number(), v.minValue(1)) })]),
  values: v.pipe(v.array(int8), v.minLength(1)),
});

/** Validates literal settings; NULL text or an invalid alphabet would dereference invalid native memory. */
function admitSettings<const Values extends Settings>(settings: Values): Values {
  if (settings.length > 0) v.parse(salt, settings[0]);
  if (settings.length > 1) v.parse(minLength, settings[1]);
  if (settings.length > 2) v.parse(alphabet, settings[2]);
  return settings;
}
const literalArray = v.object({ dimensions: v.array(v.unknown()), values: v.array(v.unknown()) });
const int8Input = v.union([
  int8,
  v.custom<Exclude<HashidsInt8Input, bigint>>(
    (value) =>
      is(value, SQL) ||
      is(value, SQL.Aliased) ||
      (is(value, Column) && value.notNull && value.dataType === "bigint int64"),
  ),
]);

/** Exact captured API and codecs; all twenty native members are safety-rejected pending verified binary repair. */
export function createPgHashids_1_2_1<
  const Descriptor extends ExtensionDescriptor<"pg_hashids", { version: "1.2.1"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "pg_hashids" ||
    descriptor.version !== "1.2.1" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "56a138e83f06ff23344a428d6486237eb9c875db35df970ceb4bcb60240a4041"
  )
    throw new Error("pg_hashids 1.2.1 requires its exact verified contract");
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const int8Array = arrayCodec(integerCodec);
  const routine = <const Arguments extends readonly AnyCodec[], Result extends AnyCodec>(
    name: string,
    member: string,
    arguments_: Arguments,
    result: Result,
  ) => {
    const callable = createSqlFunction({ ...base, name, member, arguments: arguments_, result });
    const nativeSymbol: HashidsNativeSymbol =
      name === "hash_encode"
        ? "id_encode"
        : name === "hash_decode" || name === "id_decode_once"
          ? "id_decode_once"
          : name === "id_decode"
            ? "id_decode"
            : member.includes("pg_catalog._int8")
              ? "id_encode_array"
              : "id_encode";
    // All captured members reach one of these four affected C symbols. Input checks cannot
    // repair encoder allocation or establish the deployed binary's decoder bounds.
    // Preserve the codec-derived signature, and poison a caught rejection like codec failures.
    const rejected: typeof callable = () =>
      decodeFailure(() => {
        throw new PgHashidsNativeSafetyError(member, nativeSymbol);
      });
    return rejected;
  };
  const scalar = [
    routine(
      "id_encode",
      "routine:$extension:pg_hashids.id_encode(pg_catalog.int8)",
      [integerCodec] as const,
      textCodec,
    ),
    routine(
      "id_encode",
      "routine:$extension:pg_hashids.id_encode(pg_catalog.int8,pg_catalog.text)",
      [integerCodec, textCodec] as const,
      textCodec,
    ),
    routine(
      "id_encode",
      "routine:$extension:pg_hashids.id_encode(pg_catalog.int8,pg_catalog.text,pg_catalog.int4)",
      [integerCodec, textCodec, int4Codec] as const,
      textCodec,
    ),
    routine(
      "id_encode",
      "routine:$extension:pg_hashids.id_encode(pg_catalog.int8,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
      [integerCodec, textCodec, int4Codec, textCodec] as const,
      textCodec,
    ),
  ] as const;
  const vector = [
    routine("id_encode", "routine:$extension:pg_hashids.id_encode(pg_catalog._int8)", [int8Array] as const, textCodec),
    routine(
      "id_encode",
      "routine:$extension:pg_hashids.id_encode(pg_catalog._int8,pg_catalog.text)",
      [int8Array, textCodec] as const,
      textCodec,
    ),
    routine(
      "id_encode",
      "routine:$extension:pg_hashids.id_encode(pg_catalog._int8,pg_catalog.text,pg_catalog.int4)",
      [int8Array, textCodec, int4Codec] as const,
      textCodec,
    ),
    routine(
      "id_encode",
      "routine:$extension:pg_hashids.id_encode(pg_catalog._int8,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
      [int8Array, textCodec, int4Codec, textCodec] as const,
      textCodec,
    ),
  ] as const;
  const many = [
    routine("id_decode", "routine:$extension:pg_hashids.id_decode(pg_catalog.text)", [textCodec] as const, int8Array),
    routine(
      "id_decode",
      "routine:$extension:pg_hashids.id_decode(pg_catalog.text,pg_catalog.text)",
      [textCodec, textCodec] as const,
      int8Array,
    ),
    routine(
      "id_decode",
      "routine:$extension:pg_hashids.id_decode(pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
      [textCodec, textCodec, int4Codec] as const,
      int8Array,
    ),
    routine(
      "id_decode",
      "routine:$extension:pg_hashids.id_decode(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
      [textCodec, textCodec, int4Codec, textCodec] as const,
      int8Array,
    ),
  ] as const;
  const once = [
    routine(
      "id_decode_once",
      "routine:$extension:pg_hashids.id_decode_once(pg_catalog.text)",
      [textCodec] as const,
      integerCodec,
    ),
    routine(
      "id_decode_once",
      "routine:$extension:pg_hashids.id_decode_once(pg_catalog.text,pg_catalog.text)",
      [textCodec, textCodec] as const,
      integerCodec,
    ),
    routine(
      "id_decode_once",
      "routine:$extension:pg_hashids.id_decode_once(pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
      [textCodec, textCodec, int4Codec] as const,
      integerCodec,
    ),
    routine(
      "id_decode_once",
      "routine:$extension:pg_hashids.id_decode_once(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
      [textCodec, textCodec, int4Codec, textCodec] as const,
      integerCodec,
    ),
  ] as const;
  const legacy = [
    routine(
      "hash_encode",
      "routine:$extension:pg_hashids.hash_encode(pg_catalog.int8)",
      [integerCodec] as const,
      textCodec,
    ),
    routine(
      "hash_encode",
      "routine:$extension:pg_hashids.hash_encode(pg_catalog.int8,pg_catalog.text)",
      [integerCodec, textCodec] as const,
      textCodec,
    ),
    routine(
      "hash_encode",
      "routine:$extension:pg_hashids.hash_encode(pg_catalog.int8,pg_catalog.text,pg_catalog.int4)",
      [integerCodec, textCodec, int4Codec] as const,
      textCodec,
    ),
  ] as const;
  const legacyDecode = routine(
    "hash_decode",
    "routine:$extension:pg_hashids.hash_decode(pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
    [textCodec, textCodec, int4Codec] as const,
    int4Codec,
  );
  /** Negative int8 values encode their unsigned two's-complement bits and decode back to the same signed value. */
  function encode(value: HashidsInt8Input, ...settings: Settings) {
    const checked = admitSettings(settings);
    const input = v.parse(int8Input, value);
    if (checked.length === 0) return scalar[0](input);
    if (checked.length === 1) return scalar[1](input, ...checked);
    if (checked.length === 2) return scalar[2](input, ...checked);
    return scalar[3](input, ...checked);
  }
  /** One-dimensional, non-empty, NULL-free literal arrays only; the C routine ignores the lower bound. */
  function encodeArray(value: PostgreSqlArray<bigint>, ...settings: Settings) {
    const checked = admitSettings(settings);
    const input = v.parse(numbers, value);
    if (checked.length === 0) return vector[0](input);
    if (checked.length === 1) return vector[1](input, ...checked);
    if (checked.length === 2) return vector[2](input, ...checked);
    return vector[3](input, ...checked);
  }
  /** Captured decoding does not verify canonical input. Rejected until exact native binary repair is verified. */
  function decode(value: string, ...settings: Settings) {
    const checked = admitSettings(settings);
    if (checked.length === 0) return many[0](admitHash(value));
    if (checked.length === 1) return many[1](admitHash(value), ...checked);
    if (checked.length === 2) return many[2](admitHash(value), ...checked);
    return many[3](admitHash(value, checked[2]), ...checked);
  }
  /** Returns only the first decoded number. */
  function decodeOnce(value: string, ...settings: Settings) {
    const checked = admitSettings(settings);
    if (checked.length === 0) return once[0](admitHash(value));
    if (checked.length === 1) return once[1](admitHash(value), ...checked);
    if (checked.length === 2) return once[2](admitHash(value), ...checked);
    return once[3](admitHash(value, checked[2]), ...checked);
  }
  /** Legacy v1 alias of the scalar id_encode routines, with no alphabet overload. */
  function hashEncode(value: HashidsInt8Input, ...settings: LegacySettings) {
    const checked = admitSettings(settings);
    const input = v.parse(int8Input, value);
    if (checked.length === 0) return legacy[0](input);
    if (checked.length === 1) return legacy[1](input, ...checked);
    return legacy[2](input, ...checked);
  }
  /** Legacy int4 result: PostgreSQL keeps only the low 32 bits of the first decoded int8. */
  function hashDecode(value: string, salt: string, minLength: number) {
    return legacyDecode(admitHash(value), ...admitSettings([salt, minLength] as const));
  }
  /** Positional captured overload dispatch; literal array objects select the int8[] routines. */
  function idEncode(value: HashidsInt8Input | PostgreSqlArray<bigint>, ...settings: Settings) {
    return v.is(literalArray, value)
      ? encodeArray(v.parse(numbers, value), ...settings)
      : encode(v.parse(int8Input, value), ...settings);
  }
  const functions = Object.freeze({
    id_encode: idEncode,
    id_decode: decode,
    id_decode_once: decodeOnce,
    hash_encode: hashEncode,
    hash_decode: hashDecode,
  });
  // Descriptor metadata must never replace the native safety boundary with a supplied callable.
  return Object.freeze({
    ...descriptor,
    encode,
    encodeArray,
    decode,
    decodeOnce,
    hashEncode,
    hashDecode,
    sql: Object.freeze({ functions, operators: Object.freeze({}) }),
  });
}
