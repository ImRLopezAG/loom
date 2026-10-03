import { sql, type SQL } from "drizzle-orm";
import { bytea, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";
import type { PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";

const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: "formatting",
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const inputs = pgTable("format_inputs", {
  bytes: bytea(),
  text: text(),
  keys: text().array(),
  values: text().array(),
  ints: integer().array(),
  matrix: text().array("[][]"),
  json: jsonb().$type<string[]>(),
});
const bytes = { hex: "ff5c" };
const native: PostgreSqlArray<string> = { dimensions: [{ lowerBound: 0, length: 1 }], values: ["Version"] };
extension.armor(bytes);
extension.armor(null);
extension.armor(inputs.bytes, inputs.keys, inputs.values);
extension.armor(bytes, ["Version", null] as const, ["Loom", ""] as const);
extension.armor(bytes, native, native);
extension.armor(bytes, null, null);
extension.armor(
  sql<{ hex: string } | null>`null`.as("bytes"),
  sql<PostgreSqlArray<string> | null>`null`.as("keys"),
  sql<PostgreSqlArray<string>>`array['Loom']`,
);
extension.dearmor(inputs.text);
extension.dearmor(null);
extension.keyId(inputs.bytes);
extension.keyId(null);
extension.keyId(sql<{ hex: string }>`'ff'`.as("bytes"));
extension.sql.functions["armor(bytea)"](bytes);
extension.sql.functions["armor(bytea,text[],text[])"](bytes, native, []);
extension.sql.functions["dearmor(text)"](sql<string | null>`null`);
extension.sql.functions["pgp_key_id(bytea)"](bytes);
const record = extension.sql.functions["pgp_armor_headers(text)"](null);
const headers = extension.armorHeaders(sql<string>`'armor'`.as("armored"), "headers");
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2 ? true : false;
type Assert<Condition extends true> = Condition;
type Result<Expression> = Expression extends SQL<infer Value> ? Value : never;
export type FormattingResultsAreExact = [
  Assert<Equal<Result<ReturnType<typeof extension.armor>>, string | null>>,
  Assert<Equal<Result<ReturnType<typeof extension.dearmor>>, { hex: string } | null>>,
  Assert<Equal<Result<ReturnType<typeof extension.keyId>>, string | null>>,
  Assert<Equal<Result<typeof record>, { readonly key: string; readonly value: string }>>,
  Assert<Equal<Result<typeof headers.key>, string>>,
  Assert<Equal<Result<typeof headers.value>, string>>,
  Assert<Equal<keyof typeof headers, "from" | "key" | "value">>,
];
// @ts-expect-error Only one and three armor arguments exist.
extension.armor(bytes, []);
// @ts-expect-error Armor requires bytea.
extension.armor("bytes");
// @ts-expect-error Whole SQL NULL must be explicit.
extension.armor(undefined);
// @ts-expect-error Undefined cannot select the one-argument overload.
extension.armor(bytes, undefined, []);
// @ts-expect-error Numeric elements are not text.
extension.armor(bytes, [1], []);
// @ts-expect-error JSON JS shape does not establish text-array storage.
extension.armor(bytes, inputs.json, []);
// @ts-expect-error Scalar text is not text-array storage.
extension.armor(bytes, inputs.text, []);
// @ts-expect-error Native int arrays are not text arrays.
extension.armor(bytes, inputs.ints, []);
// @ts-expect-error Native multidimensional text columns are not shallow text arrays.
extension.armor(bytes, inputs.matrix, []);
// @ts-expect-error Canonical one-argument member cannot accept headers.
extension.sql.functions["armor(bytea)"](bytes, [], []);
// @ts-expect-error Canonical three-argument member requires both arrays.
extension.sql.functions["armor(bytea,text[],text[])"](bytes, []);
// @ts-expect-error Dearmor requires text.
extension.dearmor(inputs.bytes);
// @ts-expect-error Dearmor requires one argument.
extension.dearmor();
// @ts-expect-error Key inspection requires bytea.
extension.keyId(inputs.text);
// @ts-expect-error Key inspection has no second argument.
extension.keyId(bytes, "options");
// @ts-expect-error Header convenience requires an explicit alias.
extension.armorHeaders("armor");
// @ts-expect-error Header fields have intrinsic codecs.
extension.armorHeaders("armor", "headers", {});
// @ts-expect-error OUT fields are not call arguments.
extension.sql.functions["pgp_armor_headers(text)"]("armor", "key", "value");
// @ts-expect-error The result decoder cannot be selected by a generic.
extension.armor<number>(bytes);
// @ts-expect-error The result decoder cannot be selected by a generic.
extension.dearmor<string>("armor");
// @ts-expect-error The result decoder cannot be selected by a generic.
extension.keyId<number>(bytes);
// @ts-expect-error Header rows are fixed, with no output generic.
extension.armorHeaders<{ key: number }>("armor", "headers");
const schema: "formatting" = extension.schema;
void [record, headers, schema];
