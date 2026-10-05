import { expectTypeOf } from "vite-plus/test";
import { sql, type SQL } from "drizzle-orm";
import {
  createLtreeArrayCodec,
  createLqueryArrayCodec,
  createLtxtqueryArrayCodec,
} from "../../../apps/loom/src/core/extensions/ltree-array-codecs";
import { type Ltree } from "../../../apps/loom/src/core/extensions/ltree-codec";
import { type Lquery, type Ltxtquery } from "../../../apps/loom/src/core/extensions/ltree-query-codecs";
import {
  booleanCodec,
  nullableCodec,
  type CodecInput,
  type CodecOutput,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/codecs";
import { createSqlOperator } from "../../../apps/loom/src/core/extensions/sql";

const path = createLtreeArrayCodec("extensions");
const query = createLqueryArrayCodec("extensions");
const text = createLtxtqueryArrayCodec("extensions");
expectTypeOf<CodecInput<typeof path>>().toEqualTypeOf<PostgreSqlArray<string>>();
expectTypeOf<CodecInput<typeof query>>().toEqualTypeOf<PostgreSqlArray<string>>();
expectTypeOf<CodecInput<typeof text>>().toEqualTypeOf<PostgreSqlArray<string>>();
expectTypeOf<CodecOutput<typeof path>>().toEqualTypeOf<PostgreSqlArray<Ltree>>();
expectTypeOf<CodecOutput<typeof query>>().toEqualTypeOf<PostgreSqlArray<Lquery>>();
expectTypeOf<CodecOutput<typeof text>>().toEqualTypeOf<PostgreSqlArray<Ltxtquery>>();
const nullable = nullableCodec(path);
expectTypeOf<CodecInput<typeof nullable>>().toEqualTypeOf<PostgreSqlArray<string> | null>();
expectTypeOf<CodecOutput<typeof nullable>>().toEqualTypeOf<PostgreSqlArray<Ltree> | null>();
const input = { dimensions: [{ lowerBound: -2, length: 2 }], values: ["Top", null] };
path.encode(input);
query.encode(input);
text.encode(input);
// @ts-expect-error Input is a native dimensions-and-values record, not a JavaScript array.
path.encode(["Top"]);
// @ts-expect-error Nonstring scalar leaves are rejected.
query.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: [true] });
// @ts-expect-error SQL NULL needs an explicit nullable wrapper.
text.encode(null);
// @ts-expect-error Output brands cannot be chosen by the caller.
path.decode<PostgreSqlArray<string>>("{Top}");
// @ts-expect-error The three native array identities remain distinct.
const _wrong: PostgreSqlArray<Ltree> = query.decode("{Top}");
// @ts-expect-error The three native array identities remain distinct.
const _wrongText: PostgreSqlArray<Ltxtquery> = query.decode("{Top}");
const sameIdentity = createSqlOperator({
  schema: "extensions",
  name: "=",
  member: "private array identity test",
  left: path,
  right: path,
  result: booleanCodec,
  dependencies: [],
  observability: "tables",
  authority: "query",
});
expectTypeOf(sameIdentity(input, input)).toEqualTypeOf<SQL<boolean>>();
sameIdentity(sql<PostgreSqlArray<Ltree>>`paths`, input);
// @ts-expect-error SQL lquery[] does not have native ltree[] identity.
sameIdentity(sql<PostgreSqlArray<Lquery>>`queries`, input);
// @ts-expect-error SQL ltxtquery[] does not have native ltree[] identity.
sameIdentity(input, sql<PostgreSqlArray<Ltxtquery>>`queries`);
// @ts-expect-error SQL ordinary text arrays lack the native brand.
sameIdentity(sql<PostgreSqlArray<string>>`texts`, input);
// @ts-expect-error A caller-selected return generic cannot replace the result codec.
sameIdentity<string>(input, input);
