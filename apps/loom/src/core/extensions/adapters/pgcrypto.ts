import { Column, is, sql, SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { binaryCodec, nullableCodec, textCodec } from "../codecs";
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
const nullableText = nullableCodec(textCodec);
const nullableBinary = nullableCodec(binaryCodec);
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
      : sql`${sql.param(nullableText.encode(value))}`;
  return sql<string | null>`(${source})::${extensionSqlType("pg_catalog", "text")}`;
}
function byteaInput(value: ByteaInput): SQL<{ hex: string } | null> {
  const source = is(value, SQL.Aliased)
    ? aliasInput(value)
    : is(value, SQL) || is(value, Column)
      ? sql`${value}`
      : sql`${sql.param(nullableBinary.encode(value))}`;
  return sql<{ hex: string } | null>`(${source})::${extensionSqlType("pg_catalog", "bytea")}`;
}

/** Internal hash and raw cipher prerequisites. Algorithms, padding and key/IV sizing remain native contracts. */
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
      }),
      operators: Object.freeze({}),
    }),
  });
}
