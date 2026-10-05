const evidence = [
  "https://github.com/iCyberon/pg_hashids/blob/v1.2.1/pg_hashids--1.2.1.sql",
  "https://github.com/iCyberon/pg_hashids/blob/v1.2.1/pg_hashids.c: non-STRICT C dereferences NULL text/array arguments, reads ARR_DIMS[0] and dense ARR_DATA_PTR, and returns INT64 for the int4 hash_decode declaration",
  "https://github.com/iCyberon/pg_hashids/blob/v1.2.1/hashids.c: hashids_init3 returns NULL for <16 unique or whitespace alphabets; unknown hash characters make numbers_count 0 before decode writes; minLength>0 trailing-guard decode reads past the hash NUL",
  "packages/e2e/fixtures/pg-hashids-native-provenance.json: exact published source allocation and decoder bounds defects; deployed binary patch status unknown",
  "packages/tests/unit/extensions-pg-hashids.test.ts: RED then GREEN rejection before SQL for all twenty friendly and canonical overloads",
  "packages/tests/types/extensions-pg-hashids.test-d.ts: SQL<bigint> is a caller claim, literal-only settings/arrays/hashes and fixed result identities",
  "packages/e2e/integration/extensions-pg-hashids.test.ts: pending independent native SQL oracle for all twenty routines; unsafe native execution is not authorized",
] as const;
const limitation =
  "Reversible obfuscation, not encryption, hashing, authentication or a secret identity; anyone with salt and alphabet can decode. All twenty members are safety-rejected pending verified repair of the exact native binary; catalogue digest verification is not memory-safety acceptance. Each call leaks malloc'd native buffers because pg_hashids frees after returning.";
const common = {
  authority: "query",
  observability: "tables",
  safetyDisposition: "safety-rejected",
  nativeRepairAcceptance: "pending",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  limitation,
} as const;
const settings = [
  ["", "default salt NULL (equivalent to empty), minimum length 0, default 62-character alphabet"],
  [",pg_catalog.text", "salt literal, minimum length 0, default alphabet"],
  [",pg_catalog.text,pg_catalog.int4", "salt and non-negative int4 minimum length literals, default alphabet"],
  [
    ",pg_catalog.text,pg_catalog.int4,pg_catalog.text",
    "salt, minimum length and printable-ASCII alphabet with at least 16 unique characters (duplicates are removed natively)",
  ],
] as const;
const encodeNulls =
  "Catalogue non-STRICT: SQL NULL int8/int4 read as 0 (same as encoding 0n → gY). SQL<bigint> cannot guarantee non-null at runtime. NULL text crashes. Literal null and nullable columns are rejected; settings are literals";
const decodeNulls =
  "No decode SQL is emitted while native repair is pending. Catalogue non-STRICT: NULL text crashes. admitHash requires a nonempty hash whose characters all belong to the original alphabet, which prevents numbers_count 0. minLength>0 hashes whose first effective guard is the last character still overflow natively and must not be executed";

/** Complete twenty-routine 1.2.1 family; native, generation and packed-consumer acceptance are host gates. */
export const pgHashidsAnnotations = [
  ...settings.map(
    ([tail, reason]) =>
      ({
        id: `routine:$extension:pg_hashids.id_encode(pg_catalog.int8${tail})`,
        disposition: "query",
        reason: `safety-rejected pending verified exact native binary repair; encode / sql.functions.id_encode: ${reason}.`,
        evidence,
        semantics: {
          ...common,
          nativeSymbol: "id_encode",
          nulls: encodeNulls,
          result: "string",
          codec: "pg:text:1",
          precision: "Full signed int8 range as decimal text; negative values encode their unsigned 64-bit pattern.",
        },
      }) as const,
  ),
  ...settings.map(
    ([tail, reason]) =>
      ({
        id: `routine:$extension:pg_hashids.id_encode(pg_catalog._int8${tail})`,
        disposition: "query",
        reason: `safety-rejected pending verified exact native binary repair; encodeArray / sql.functions.id_encode with a PostgreSqlArray: ${reason}.`,
        evidence,
        semantics: {
          ...common,
          nativeSymbol: "id_encode_array",
          nulls:
            "NULL array crashes; NULL elements desynchronise the dense data read, so literal arrays must be one-dimensional, non-empty and NULL-free",
          result: "string",
          codec: "pg:text:1",
          precision:
            "Each int8 element is preserved exactly; the explicit lower bound is transmitted but ignored natively, so [0:1]={1,2} and {1,2} share a hash.",
        },
      }) as const,
  ),
  ...settings.map(
    ([tail, reason]) =>
      ({
        id: `routine:$extension:pg_hashids.id_decode(pg_catalog.text${tail})`,
        disposition: "query",
        reason: `safety-rejected pending verified exact native binary repair; decode / sql.functions.id_decode: ${reason}.`,
        evidence,
        semantics: {
          ...common,
          nativeSymbol: "id_decode",
          nulls: `${decodeNulls}; result is never SQL NULL`,
          result: "PostgreSqlArray<bigint>",
          codec: "pg:array:1:,:pg:int8:1",
          precision:
            "Native result is one-dimensional with lower bound 1 and no NULL elements when the call returns. Decode is not canonical: separator-only hashes yield extra zeros, guard-only minLength-0 hashes yield {0}, and over-long working-alphabet input wraps modulo 2^64. Salt/alphabet bytes >= 0x80 follow Linux unsigned-char identity, which differs from Apple signed-char standalone hashids.c. Empty SQL arrays are not a successful native outcome.",
        },
      }) as const,
  ),
  ...settings.map(
    ([tail, reason]) =>
      ({
        id: `routine:$extension:pg_hashids.id_decode_once(pg_catalog.text${tail})`,
        disposition: "query",
        reason: `safety-rejected pending verified exact native binary repair; decodeOnce / sql.functions.id_decode_once returns only the first number: ${reason}.`,
        evidence,
        semantics: {
          ...common,
          nativeSymbol: "id_decode_once",
          nulls: `${decodeNulls}; result is never SQL NULL`,
          result: "bigint",
          codec: "pg:int8:1",
          precision: "First decoded unsigned 64-bit value reinterpreted as signed int8; same non-canonical decode.",
        },
      }) as const,
  ),
  ...settings.slice(0, 3).map(
    ([tail, reason]) =>
      ({
        id: `routine:$extension:pg_hashids.hash_encode(pg_catalog.int8${tail})`,
        disposition: "query",
        reason: `safety-rejected pending verified exact native binary repair; hashEncode / sql.functions.hash_encode is the legacy v1 alias of the id_encode C symbol: ${reason}.`,
        evidence,
        semantics: {
          ...common,
          nativeSymbol: "id_encode",
          nulls: encodeNulls,
          result: "string",
          codec: "pg:text:1",
          precision: "Byte-identical to id_encode for the same arguments.",
        },
      }) as const,
  ),
  {
    id: "routine:$extension:pg_hashids.hash_decode(pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
    disposition: "query",
    reason:
      "safety-rejected pending verified exact native binary repair; hashDecode / sql.functions.hash_decode is the legacy v1 alias of id_decode_once, requiring hash, salt and minimum length.",
    evidence,
    semantics: {
      ...common,
      nativeSymbol: "id_decode_once",
      nulls: `${decodeNulls}; result is never SQL NULL`,
      result: "number",
      codec: "pg:int4:1",
      precision:
        "Declared int4 over an INT64 Datum: only the low 32 bits of the first decoded number survive, as signed int4.",
    },
  },
] as const;
