import { sql, type SQL } from "drizzle-orm";
import { boolean, bytea, integer, json, pgTable, text } from "drizzle-orm/pg-core";
import { createPgJwt_0_2_0, type JwtAlgorithm } from "../../../apps/loom/src/core/extensions/adapters/pgjwt";
import { jsonDocument, type JsonDocument } from "../../../apps/loom/src/core/extensions/native-json-codecs";

const extension = createPgJwt_0_2_0({
  name: "pgjwt",
  version: "0.2.0",
  schema: "jwt",
  apiSupport: { status: "verified", digest: "a2d8b3ee4c390dd05716585a14c23acfebdb05bb3800a06cd72a48578dcabadd" },
});
const inputs = pgTable("jwt_inputs", {
  token: text(),
  secret: text(),
  payload: json(),
  bytes: bytea(),
  integer: integer(),
  flag: boolean(),
  algorithm: text().$type<JwtAlgorithm>(),
});
extension.sign(jsonDocument("null"), "secret");
extension.sign(inputs.payload, inputs.secret, inputs.algorithm);
extension.sign(null, null, null);
extension.urlEncode(inputs.bytes);
extension.urlEncode(null);
extension.urlDecode(inputs.token);
extension.algorithmSign(inputs.token, inputs.secret, "HS256");
extension.tryCastDouble(inputs.token);
const rows = extension.verify(inputs.token, inputs.secret, "jwt", "HS512");
const record = extension.sql.functions.verify(null, null);
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2 ? true : false;
type Assert<Condition extends true> = Condition;
type Result<Expression> = Expression extends SQL<infer Value> ? Value : never;
export type JwtResultsAreExact = [
  Assert<Equal<Result<ReturnType<typeof extension.sign>>, string | null>>,
  Assert<Equal<Result<ReturnType<typeof extension.urlDecode>>, { hex: string } | null>>,
  Assert<
    Equal<
      Result<ReturnType<typeof extension.tryCastDouble>>,
      number | { nonfinite: "NaN" | "Infinity" | "-Infinity" } | null
    >
  >,
  Assert<Equal<Result<typeof rows.header>, { type: "json"; text: string } | null>>,
  Assert<Equal<Result<typeof rows.payload>, { type: "json"; text: string } | null>>,
  Assert<Equal<Result<typeof rows.valid>, boolean | null>>,
  Assert<
    Equal<
      Result<typeof record>,
      {
        readonly header: { type: "json"; text: string } | null;
        readonly payload: { type: "json"; text: string } | null;
        readonly valid: boolean | null;
      }
    >
  >,
  Assert<Equal<keyof typeof rows, "from" | "header" | "payload" | "valid">>,
];
// @ts-expect-error Payloads require lossless JSON documents or native JSON columns.
extension.sign({ user: "name" }, "secret");
// @ts-expect-error Bytea is not JSON.
extension.sign(inputs.bytes, "secret");
// @ts-expect-error Numeric columns cannot be JWT token text.
extension.verify(inputs.integer, "secret", "jwt");
// @ts-expect-error Algorithms are verified HMAC choices.
extension.sign(null, "secret", "none");
// @ts-expect-error Dynamic algorithms require their semantic contract.
extension.sign(null, "secret", inputs.token);
// @ts-expect-error Bytea cannot be passed as unencoded text.
extension.urlEncode("bytes");
// @ts-expect-error Wrong native column type.
extension.urlEncode(inputs.flag);
// @ts-expect-error Optional SQL default is omitted rather than undefined.
extension.sign(null, "secret", undefined);
// @ts-expect-error The captured verify OUT fields are not call arguments.
extension.sql.functions.verify("token", "secret", "HS256", "header");
// @ts-expect-error Verify requires an explicit row alias.
extension.verify("token", "secret");
// @ts-expect-error Output types are fixed by captured codecs.
extension.sign<number>(null, "secret");
extension.sign(sql<JsonDocument | null>`null`.as("payload"), "secret");
const schema: "jwt" = extension.schema;
void [rows, record, schema];
