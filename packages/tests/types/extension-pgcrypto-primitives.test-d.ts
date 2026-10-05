import { sql, type SQL } from "drizzle-orm";
import { bigint, boolean, bytea, doublePrecision, integer, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createPgcrypto_1_4 } from "../../../apps/loom/src/core/extensions/adapters/pgcrypto";

const extension = createPgcrypto_1_4({
  name: "pgcrypto",
  version: "1.4",
  schema: "primitives",
  apiSupport: { status: "verified", digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8" },
});
const inputs = pgTable("primitive_inputs", {
  password: text(),
  salt: text(),
  type: text(),
  count: integer(),
  double: doublePrecision(),
  wide: bigint({ mode: "number" }),
  binary: bytea(),
  flag: boolean(),
  json: jsonb().$type<number>(),
  id: uuid(),
});
const crypt: SQL<string | null> = extension.crypt(inputs.password, inputs.salt);
const salt: SQL<string | null> = extension.genSalt(inputs.type);
const rounds: SQL<string | null> = extension.genSalt(inputs.type, inputs.count);
const bytes: SQL<{ hex: string } | null> = extension.genRandomBytes(inputs.count);
const id: SQL<string> = extension.genRandomUuid();
const mode: SQL<boolean> = extension.fipsMode();
extension.crypt(sql<string>`'foox'`.as("password"), sql<string>`'$1$Szzz0yzz'`);
extension.genSalt(sql<string>`'bf'`.as("type"), sql<number>`4`.as("count"));
extension.genSalt(null);
extension.genSalt("bf", null);
extension.genRandomBytes(null);
extension.genRandomBytes(sql<number | null>`null`);
extension.sql.functions["crypt(text,text)"](null, null);
extension.sql.functions["gen_salt(text)"]("bf");
extension.sql.functions["gen_salt(text,int4)"]("bf", 4);
extension.sql.functions["gen_random_bytes(int4)"](1);
const canonicalId: SQL<string> = extension.sql.functions["gen_random_uuid()"]();
const canonicalMode: SQL<boolean> = extension.sql.functions["fips_mode()"]();
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2 ? true : false;
type Assert<Condition extends true> = Condition;
type Result<Expression> = Expression extends SQL<infer Value> ? Value : never;
export type PrimitiveResultsAreExact = [
  Assert<Equal<Result<ReturnType<typeof extension.crypt>>, string | null>>,
  Assert<Equal<Result<ReturnType<typeof extension.genSalt>>, string | null>>,
  Assert<Equal<Result<ReturnType<(typeof extension.sql.functions)["gen_salt(text)"]>>, string | null>>,
  Assert<Equal<Result<ReturnType<(typeof extension.sql.functions)["gen_salt(text,int4)"]>>, string | null>>,
  Assert<Equal<Result<ReturnType<typeof extension.genRandomBytes>>, { hex: string } | null>>,
  Assert<Equal<Result<ReturnType<typeof extension.genRandomUuid>>, string>>,
  Assert<Equal<Result<ReturnType<typeof extension.fipsMode>>, boolean>>,
];
// @ts-expect-error Password input is text.
extension.crypt(1, "salt");
// @ts-expect-error Salt input is text.
extension.crypt("password", true);
// @ts-expect-error Binary columns are not passwords.
extension.crypt(inputs.binary, "salt");
// @ts-expect-error UUID storage is not a text operand without conversion.
extension.crypt(inputs.id, "salt");
// @ts-expect-error Numeric SQL is not text SQL.
extension.crypt(sql<number>`1`, "salt");
// @ts-expect-error NULL is explicit; undefined is not text.
extension.crypt(undefined, "salt");
// @ts-expect-error Native crypt requires two arguments.
extension.crypt("password");
// @ts-expect-error Native crypt has no third argument.
extension.crypt("password", "salt", "extra");
// @ts-expect-error genSalt requires an algorithm.
extension.genSalt();
// @ts-expect-error The one-argument overload cannot receive undefined rounds.
extension.genSalt("bf", undefined);
// @ts-expect-error Only the two captured salt arities exist.
extension.genSalt("bf", 4, 5);
// @ts-expect-error Salt algorithm is text, not a boolean column.
extension.genSalt(inputs.flag);
// @ts-expect-error int4 input is a number, not bigint.
extension.genSalt("bf", 4n);
// @ts-expect-error int4 input is not a string.
extension.genSalt("bf", "4");
// @ts-expect-error Text columns are not numeric operands.
extension.genSalt("bf", inputs.type);
// @ts-expect-error JSON storage is not numeric storage even with a numeric JS shape.
extension.genRandomBytes(inputs.json);
// @ts-expect-error Boolean columns are not numeric operands.
extension.genRandomBytes(inputs.flag);
// @ts-expect-error Bytea columns are not numeric operands.
extension.genRandomBytes(inputs.binary);
// @ts-expect-error Text SQL is not numeric SQL.
extension.genRandomBytes(sql<string>`'1'`);
// @ts-expect-error Numeric JS shape does not make float8 storage a native int4 operand.
extension.genRandomBytes(inputs.double);
// @ts-expect-error Native int8 storage remains distinct even in number mode.
extension.genSalt("bf", inputs.wide);
// @ts-expect-error The native byte count is int4, not bigint.
extension.genRandomBytes(1n);
// @ts-expect-error Undefined is not SQL NULL.
extension.genRandomBytes(undefined);
// @ts-expect-error Byte count is required.
extension.genRandomBytes();
// @ts-expect-error Random bytes has one native argument.
extension.genRandomBytes(1, 2);
// @ts-expect-error UUID generator has no arguments.
extension.genRandomUuid(null);
// @ts-expect-error FIPS observation has no arguments.
extension.fipsMode(false);
// @ts-expect-error The one-argument canonical signature does not accept rounds.
extension.sql.functions["gen_salt(text)"]("bf", 4);
// @ts-expect-error The two-argument canonical signature requires rounds.
extension.sql.functions["gen_salt(text,int4)"]("bf");
// @ts-expect-error Canonical rounds cannot be undefined.
extension.sql.functions["gen_salt(text,int4)"]("bf", undefined);
// @ts-expect-error Canonical bytes has exactly one argument.
extension.sql.functions["gen_random_bytes(int4)"](1, 2);
// @ts-expect-error Results have fixed decoders and accept no caller generics.
extension.crypt<number>("foox", "$1$Szzz0yzz");
// @ts-expect-error Results have fixed decoders and accept no caller generics.
extension.genSalt<number>("bf");
// @ts-expect-error Results have fixed decoders and accept no caller generics.
extension.genRandomBytes<string>(1);
// @ts-expect-error Results have fixed decoders and accept no caller generics.
extension.genRandomUuid<number>();
// @ts-expect-error Results have fixed decoders and accept no caller generics.
extension.fipsMode<string>();
const version: "1.4" = extension.version;
const schema: "primitives" = extension.schema;
void [crypt, salt, rounds, bytes, id, mode, canonicalId, canonicalMode, version, schema];
