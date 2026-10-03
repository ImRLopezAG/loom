import { Column, is, sql, SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  binaryCodec,
  booleanCodec,
  compositeCodec,
  createExtensionCodec,
  decodeFailure,
  nullableCodec,
  textCodec,
  type PostgreSqlArray,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { uuidCodec } from "../native-uuid-codec";
import { extensionRows } from "../rows";
import { createSqlFunction, extensionSqlType } from "../sql";

type TextInput =
  | string
  | null
  | SQL<string | null>
  | SQL.Aliased<string | null>
  | AnyPgColumn<{ dataType: "string"; data: string }>;
type ByteaInput =
  | { hex: string }
  | null
  | SQL<{ hex: string } | null>
  | SQL.Aliased<{ hex: string } | null>
  | AnyPgColumn<{ dataType: "object buffer"; data: Buffer }>;
type Int4Input =
  | number
  | null
  | SQL<number | null>
  | SQL.Aliased<number | null>
  | AnyPgColumn<{ dataType: "number int32"; data: number }>;
type TextArrayInput =
  | readonly (string | null)[]
  | PostgreSqlArray<string>
  | null
  | SQL<PostgreSqlArray<string> | readonly (string | null)[] | null>
  | SQL.Aliased<PostgreSqlArray<string> | readonly (string | null)[] | null>
  | AnyPgColumn<{ dataType: "string"; data: string[] }>;
const nullableText = nullableCodec(textCodec);
const nullableBinary = nullableCodec(binaryCodec);
const nullableInt4 = nullableCodec(int4Codec);
const nullableTextArray = nullableCodec(arrayCodec(textCodec));
const headerFields = Object.freeze({ key: textCodec, value: textCodec });
const armorHeadersCodec = compositeCodec("pgcrypto:armor-headers:1", headerFields);
const keyIdValue = v.pipe(v.string(), v.regex(/^(?:[0-9A-F]{16}|SYMKEY|ANYKEY)$/));
const nullableKeyId = nullableCodec(
  createExtensionCodec({
    id: "pgcrypto:key-id:1",
    sqlType: { schema: "pg_catalog", name: "text" },
    input: keyIdValue,
    output: keyIdValue,
    transport: "native",
    encode: (value) => value,
    decode: (value) => value,
  }),
);
const digest = "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8";

function aliasInput<Value>(value: SQL.Aliased<Value>): SQL {
  // Selected aliases are native references; an unselected alias still holds its original checked expression.
  return "isSelectionField" in value && value.isSelectionField === true ? sql`${value}` : value.sql;
}
function textInput(value: TextInput): SQL<string | null> {
  const source = is(value, SQL.Aliased)
    ? aliasInput(value)
    : is(value, SQL) || is(value, Column)
      ? sql`${value}`
      : sql`${sql.param(decodeFailure(() => nullableText.encode(value)))}`;
  return sql<string | null>`(${source})::${extensionSqlType("pg_catalog", "text")}`;
}
function byteaInput(value: ByteaInput): SQL<{ hex: string } | null> {
  const source = is(value, SQL.Aliased)
    ? aliasInput(value)
    : is(value, SQL) || is(value, Column)
      ? sql`${value}`
      : sql`${sql.param(decodeFailure(() => nullableBinary.encode(value)))}`;
  return sql<{ hex: string } | null>`(${source})::${extensionSqlType("pg_catalog", "bytea")}`;
}
function int4Input(value: Int4Input): SQL<number | null> {
  const source = is(value, SQL.Aliased)
    ? aliasInput(value)
    : is(value, SQL) || is(value, Column)
      ? sql`${value}`
      : sql`${sql.param(decodeFailure(() => nullableInt4.encode(value)))}`;
  return sql<number | null>`(${source})::${extensionSqlType("pg_catalog", "int4")}`;
}
function isTextArrayLiteral(value: TextArrayInput): value is readonly (string | null)[] {
  return Array.isArray(value);
}
function textArrayInput(value: TextArrayInput): SQL<PostgreSqlArray<string> | null> {
  const source = is(value, SQL.Aliased)
    ? aliasInput(value)
    : is(value, SQL) || is(value, Column)
      ? sql`${value}`
      : sql`${sql.param(
          decodeFailure(() =>
            nullableTextArray.encode(
              isTextArrayLiteral(value)
                ? { dimensions: value.length ? [{ lowerBound: 1, length: value.length }] : [], values: value }
                : value,
            ),
          ),
        )}`;
  return sql<PostgreSqlArray<string> | null>`(${source})::${extensionSqlType("pg_catalog", "text")}[]`;
}

/** Internal pgcrypto contracts. Algorithms, counts, header policy and crypto mode remain native. */
export function createPgcrypto_1_4<
  const Descriptor extends ExtensionDescriptor<"pgcrypto", { version: "1.4"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "pgcrypto" ||
    descriptor.version !== "1.4" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("pgcrypto 1.4 requires its exact verified contract");
  const base = {
    schema: descriptor.schema,
    dependencies: [],
    authority: "query",
    observability: "tables",
    result: nullableBinary,
  } as const;
  const digestTextCall = createSqlFunction({
    ...base,
    name: "digest",
    member: "routine:$extension:pgcrypto.digest(pg_catalog.text,pg_catalog.text)",
    arguments: [nullableText, nullableText] as const,
  });
  const digestByteaCall = createSqlFunction({
    ...base,
    name: "digest",
    member: "routine:$extension:pgcrypto.digest(pg_catalog.bytea,pg_catalog.text)",
    arguments: [nullableBinary, nullableText] as const,
  });
  const hmacTextCall = createSqlFunction({
    ...base,
    name: "hmac",
    member: "routine:$extension:pgcrypto.hmac(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [nullableText, nullableText, nullableText] as const,
  });
  const hmacByteaCall = createSqlFunction({
    ...base,
    name: "hmac",
    member: "routine:$extension:pgcrypto.hmac(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
    arguments: [nullableBinary, nullableBinary, nullableText] as const,
  });
  const encryptCall = createSqlFunction({
    ...base,
    name: "encrypt",
    member: "routine:$extension:pgcrypto.encrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
    arguments: [nullableBinary, nullableBinary, nullableText] as const,
  });
  const decryptCall = createSqlFunction({
    ...base,
    name: "decrypt",
    member: "routine:$extension:pgcrypto.decrypt(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
    arguments: [nullableBinary, nullableBinary, nullableText] as const,
  });
  const encryptIvCall = createSqlFunction({
    ...base,
    name: "encrypt_iv",
    member:
      "routine:$extension:pgcrypto.encrypt_iv(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
    arguments: [nullableBinary, nullableBinary, nullableBinary, nullableText] as const,
  });
  const decryptIvCall = createSqlFunction({
    ...base,
    name: "decrypt_iv",
    member:
      "routine:$extension:pgcrypto.decrypt_iv(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.bytea,pg_catalog.text)",
    arguments: [nullableBinary, nullableBinary, nullableBinary, nullableText] as const,
  });
  const cryptCall = createSqlFunction({
    ...base,
    name: "crypt",
    member: "routine:$extension:pgcrypto.crypt(pg_catalog.text,pg_catalog.text)",
    arguments: [nullableText, nullableText] as const,
    result: nullableText,
    observability: "external",
  });
  const genSaltCall = createSqlFunction({
    ...base,
    name: "gen_salt",
    member: "routine:$extension:pgcrypto.gen_salt(pg_catalog.text)",
    arguments: [nullableText] as const,
    result: nullableText,
    observability: "external",
  });
  const genSaltRoundsCall = createSqlFunction({
    ...base,
    name: "gen_salt",
    member: "routine:$extension:pgcrypto.gen_salt(pg_catalog.text,pg_catalog.int4)",
    arguments: [nullableText, nullableInt4] as const,
    result: nullableText,
    observability: "external",
  });
  const genRandomBytesCall = createSqlFunction({
    ...base,
    name: "gen_random_bytes",
    member: "routine:$extension:pgcrypto.gen_random_bytes(pg_catalog.int4)",
    arguments: [nullableInt4] as const,
    observability: "external",
  });
  const genRandomUuidCall = createSqlFunction({
    ...base,
    name: "gen_random_uuid",
    member: "routine:$extension:pgcrypto.gen_random_uuid()",
    arguments: [] as const,
    result: uuidCodec,
    observability: "external",
  });
  const fipsModeCall = createSqlFunction({
    ...base,
    name: "fips_mode",
    member: "routine:$extension:pgcrypto.fips_mode()",
    arguments: [] as const,
    result: booleanCodec,
    observability: "external",
  });
  const armorCall = createSqlFunction({
    ...base,
    name: "armor",
    member: "routine:$extension:pgcrypto.armor(pg_catalog.bytea)",
    arguments: [nullableBinary] as const,
    result: nullableText,
  });
  const armorWithHeadersCall = createSqlFunction({
    ...base,
    name: "armor",
    member: "routine:$extension:pgcrypto.armor(pg_catalog.bytea,pg_catalog._text,pg_catalog._text)",
    arguments: [nullableBinary, nullableTextArray, nullableTextArray] as const,
    result: nullableText,
  });
  const dearmorCall = createSqlFunction({
    ...base,
    name: "dearmor",
    member: "routine:$extension:pgcrypto.dearmor(pg_catalog.text)",
    arguments: [nullableText] as const,
  });
  const armorHeadersCall = createSqlFunction({
    ...base,
    name: "pgp_armor_headers",
    member: "routine:$extension:pgcrypto.pgp_armor_headers(pg_catalog.text)",
    arguments: [nullableText] as const,
    result: armorHeadersCodec,
  });
  const keyIdCall = createSqlFunction({
    ...base,
    name: "pgp_key_id",
    member: "routine:$extension:pgcrypto.pgp_key_id(pg_catalog.bytea)",
    arguments: [nullableBinary] as const,
    result: nullableKeyId,
  });
  const digestText = (data: TextInput, algorithm: TextInput) => digestTextCall(textInput(data), textInput(algorithm));
  const digestBytea = (data: ByteaInput, algorithm: TextInput) =>
    digestByteaCall(byteaInput(data), textInput(algorithm));
  const hmacText = (data: TextInput, key: TextInput, algorithm: TextInput) =>
    hmacTextCall(textInput(data), textInput(key), textInput(algorithm));
  const hmacBytea = (data: ByteaInput, key: ByteaInput, algorithm: TextInput) =>
    hmacByteaCall(byteaInput(data), byteaInput(key), textInput(algorithm));
  const encrypt = (data: ByteaInput, key: ByteaInput, algorithm: TextInput) =>
    encryptCall(byteaInput(data), byteaInput(key), textInput(algorithm));
  const decrypt = (data: ByteaInput, key: ByteaInput, algorithm: TextInput) =>
    decryptCall(byteaInput(data), byteaInput(key), textInput(algorithm));
  const encryptWithIv = (data: ByteaInput, key: ByteaInput, iv: ByteaInput, algorithm: TextInput) =>
    encryptIvCall(byteaInput(data), byteaInput(key), byteaInput(iv), textInput(algorithm));
  const decryptWithIv = (data: ByteaInput, key: ByteaInput, iv: ByteaInput, algorithm: TextInput) =>
    decryptIvCall(byteaInput(data), byteaInput(key), byteaInput(iv), textInput(algorithm));
  const crypt = (password: TextInput, salt: TextInput) => cryptCall(textInput(password), textInput(salt));
  const genSaltType = (type: TextInput) => genSaltCall(textInput(type));
  const genSaltRounds = (type: TextInput, rounds: Int4Input) => genSaltRoundsCall(textInput(type), int4Input(rounds));
  function genSalt(...args: [type: TextInput] | [type: TextInput, rounds: Int4Input]) {
    switch (args.length) {
      case 1:
        return genSaltType(args[0]);
      case 2:
        return genSaltRounds(args[0], args[1]);
      default:
        throw new Error("genSalt requires one or two arguments");
    }
  }
  const genRandomBytes = (count: Int4Input) => genRandomBytesCall(int4Input(count));
  const genRandomUuid = () => genRandomUuidCall();
  const fipsMode = () => fipsModeCall();
  const armorBytes = (data: ByteaInput) => armorCall(byteaInput(data));
  const armorWithHeaders = (data: ByteaInput, keys: TextArrayInput, values: TextArrayInput) =>
    armorWithHeadersCall(byteaInput(data), textArrayInput(keys), textArrayInput(values));
  function armor(...args: [data: ByteaInput] | [data: ByteaInput, keys: TextArrayInput, values: TextArrayInput]) {
    switch (args.length) {
      case 1:
        return armorBytes(args[0]);
      case 3:
        return armorWithHeaders(args[0], args[1], args[2]);
      default:
        throw new Error("armor requires one or three arguments");
    }
  }
  const dearmor = (data: TextInput) => dearmorCall(textInput(data));
  const keyId = (data: ByteaInput) => keyIdCall(byteaInput(data));
  const armorHeadersExpression = (data: TextInput) => armorHeadersCall(textInput(data));
  const armorHeaders = (data: TextInput, alias: string) => {
    const rows = extensionRows(armorHeadersExpression(data), alias, headerFields, "named");
    return { from: rows.from, key: rows.columns.key, value: rows.columns.value };
  };
  function digestExpression(
    ...args:
      | [data: TextInput, algorithm: TextInput, representation: "text"]
      | [data: ByteaInput, algorithm: TextInput, representation: "bytea"]
  ) {
    switch (args[2]) {
      case "text":
        return digestText(args[0], args[1]);
      case "bytea":
        return digestBytea(args[0], args[1]);
      default:
        throw new Error("Hash representation must be text or bytea");
    }
  }
  function hmacExpression(
    ...args:
      | [data: TextInput, key: TextInput, algorithm: TextInput, representation: "text"]
      | [data: ByteaInput, key: ByteaInput, algorithm: TextInput, representation: "bytea"]
  ) {
    switch (args[3]) {
      case "text":
        return hmacText(args[0], args[1], args[2]);
      case "bytea":
        return hmacBytea(args[0], args[1], args[2]);
      default:
        throw new Error("Hash representation must be text or bytea");
    }
  }
  return bindExtension(descriptor, {
    digest: digestExpression,
    hmac: hmacExpression,
    encrypt,
    decrypt,
    encryptWithIv,
    decryptWithIv,
    crypt,
    genSalt,
    genRandomBytes,
    genRandomUuid,
    fipsMode,
    armor,
    dearmor,
    keyId,
    armorHeaders,
    sql: Object.freeze({
      functions: Object.freeze({
        "digest(text,text)": digestText,
        "digest(bytea,text)": digestBytea,
        "hmac(text,text,text)": hmacText,
        "hmac(bytea,bytea,text)": hmacBytea,
        "encrypt(bytea,bytea,text)": encrypt,
        "decrypt(bytea,bytea,text)": decrypt,
        "encrypt_iv(bytea,bytea,bytea,text)": encryptWithIv,
        "decrypt_iv(bytea,bytea,bytea,text)": decryptWithIv,
        "crypt(text,text)": crypt,
        "gen_salt(text)": genSaltType,
        "gen_salt(text,int4)": genSaltRounds,
        "gen_random_bytes(int4)": genRandomBytes,
        "gen_random_uuid()": genRandomUuid,
        "fips_mode()": fipsMode,
        "armor(bytea)": armorBytes,
        "armor(bytea,text[],text[])": armorWithHeaders,
        "dearmor(text)": dearmor,
        "pgp_armor_headers(text)": armorHeadersExpression,
        "pgp_key_id(bytea)": keyId,
      }),
      operators: Object.freeze({}),
    }),
  });
}
