import { Column, is, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  binaryCodec,
  booleanCodec,
  compositeCodec,
  createExtensionCodec,
  floatCodec,
  nullableCodec,
  textCodec,
} from "../codecs";
import { jsonCodec, type JsonDocument } from "../native-json-codecs";
import { extensionRows } from "../rows";
import { createSqlFunction, defaultSqlArgument, type ExtensionSqlInput } from "../sql";

const algorithms = v.picklist(["HS256", "HS384", "HS512"]);
export type JwtAlgorithm = v.InferOutput<typeof algorithms>;
const algorithmCodec = nullableCodec(
  createExtensionCodec({
    id: "pgjwt:hmac-algorithm:1",
    sqlType: { schema: "pg_catalog", name: "text" },
    input: algorithms,
    output: algorithms,
    transport: "native",
    encode: (value) => value,
    decode: (value) => value,
  }),
);
type AlgorithmInput =
  | JwtAlgorithm
  | null
  | SQL<JwtAlgorithm | null>
  | SQL.Aliased<JwtAlgorithm | null>
  | AnyPgColumn<{ dataType: "string"; data: JwtAlgorithm }>;
type TextInput = ExtensionSqlInput<typeof nullableText>;
type JsonInput = ExtensionSqlInput<typeof nullableJson> | AnyPgColumn<{ dataType: "object json" }>;
type ByteaInput = ExtensionSqlInput<typeof nullableBinary> | AnyPgColumn<{ dataType: "object buffer"; data: Buffer }>;
const nullableText = nullableCodec(textCodec);
const nullableJson = nullableCodec(jsonCodec);
const nullableBinary = nullableCodec(binaryCodec);
const verifyFields = Object.freeze({
  header: nullableJson,
  payload: nullableJson,
  valid: nullableCodec(booleanCodec),
});
const verifyCodec = compositeCodec("pgjwt:verification:1", verifyFields);

function jsonInput(value: JsonInput): ExtensionSqlInput<typeof nullableJson> {
  return is(value, Column) ? sql<JsonDocument | null>`(${value})::"pg_catalog"."json"` : value;
}
function byteaInput(value: ByteaInput): ExtensionSqlInput<typeof nullableBinary> {
  return is(value, Column) ? sql<{ hex: string } | null>`(${value})::"pg_catalog"."bytea"` : value;
}

/** JWT data does not establish Kello identity. pgcrypto must be installed in the same namespace. */
export function createPgJwt_0_2_0<
  const Descriptor extends ExtensionDescriptor<"pgjwt", { version: "0.2.0"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "pgjwt" ||
    descriptor.version !== "0.2.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "a2d8b3ee4c390dd05716585a14c23acfebdb05bb3800a06cd72a48578dcabadd"
  )
    throw new Error("pgjwt 0.2.0 requires its exact verified contract");
  // PostgreSQL rejects these characters when substituting @extschema@ in this extension's script.
  if (!descriptor.schema || /["$'\\\0]/.test(descriptor.schema))
    throw new Error(
      "pgjwt installation schema cannot contain double quotes, dollar signs, single quotes or backslashes",
    );
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const algorithmSign = createSqlFunction({
    ...base,
    name: "algorithm_sign",
    member: "routine:$extension:pgjwt.algorithm_sign(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [nullableText, nullableText, algorithmCodec] as const,
    result: nullableText,
  });
  const signCall = createSqlFunction({
    ...base,
    name: "sign",
    member: "routine:$extension:pgjwt.sign(pg_catalog.json,pg_catalog.text,pg_catalog.text)",
    arguments: [nullableJson, nullableText, defaultSqlArgument(algorithmCodec)] as const,
    result: nullableText,
  });
  const tryCastDouble = createSqlFunction({
    ...base,
    name: "try_cast_double",
    member: "routine:$extension:pgjwt.try_cast_double(pg_catalog.text)",
    arguments: [nullableText] as const,
    result: nullableCodec(floatCodec),
  });
  const urlDecode = createSqlFunction({
    ...base,
    name: "url_decode",
    member: "routine:$extension:pgjwt.url_decode(pg_catalog.text)",
    arguments: [nullableText] as const,
    result: nullableBinary,
  });
  const urlEncodeCall = createSqlFunction({
    ...base,
    name: "url_encode",
    member: "routine:$extension:pgjwt.url_encode(pg_catalog.bytea)",
    arguments: [nullableBinary] as const,
    result: nullableText,
  });
  const verifyCall = createSqlFunction({
    ...base,
    observability: "session",
    name: "verify",
    member: "routine:$extension:pgjwt.verify(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [nullableText, nullableText, defaultSqlArgument(algorithmCodec)] as const,
    result: verifyCodec,
  });
  const sign = (payload: JsonInput, secret: TextInput, ...algorithm: [] | [AlgorithmInput]) =>
    signCall(jsonInput(payload), secret, ...algorithm);
  const urlEncode = (data: ByteaInput) => urlEncodeCall(byteaInput(data));
  const verify = (token: TextInput, secret: TextInput, alias: string, ...algorithm: [] | [AlgorithmInput]) => {
    // Keep the checked source in FROM: its clock dependency and leases survive named projections.
    const rows = extensionRows(verifyCall(token, secret, ...algorithm), alias, verifyFields, "named");
    return Object.freeze({ from: rows.from, ...rows.columns });
  };
  return bindExtension(descriptor, {
    algorithmSign,
    sign,
    tryCastDouble,
    urlDecode,
    urlEncode,
    verify,
    sql: Object.freeze({
      functions: Object.freeze({
        algorithm_sign: algorithmSign,
        sign,
        try_cast_double: tryCastDouble,
        url_decode: urlDecode,
        url_encode: urlEncode,
        verify: verifyCall,
      }),
      operators: Object.freeze({}),
    }),
  });
}
