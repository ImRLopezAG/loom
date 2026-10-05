import { expectTypeOf } from "vite-plus/test";
import { sql, type SQL } from "drizzle-orm";
import { createLtreeCodec, ltree, type Ltree } from "../../../apps/loom/src/core/extensions/ltree-codec";
import { nullableCodec, type CodecInput, type CodecOutput } from "../../../apps/loom/src/core/extensions/codecs";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import { createSqlFunction } from "../../../apps/loom/src/core/extensions/sql";

const codec = createLtreeCodec("extensions");
const nullable = nullableCodec(codec);
expectTypeOf<CodecInput<typeof codec>>().toEqualTypeOf<string>();
expectTypeOf<CodecOutput<typeof codec>>().toEqualTypeOf<Ltree>();
expectTypeOf(codec.decode("Top.Science")).toEqualTypeOf<Ltree>();
expectTypeOf(ltree("")).toEqualTypeOf<Ltree>();
expectTypeOf<CodecInput<typeof nullable>>().toEqualTypeOf<string | null>();
expectTypeOf<CodecOutput<typeof nullable>>().toEqualTypeOf<Ltree | null>();
expectTypeOf(nullable.decode(null)).toEqualTypeOf<Ltree | null>();
expectTypeOf<Ltree>().toExtend<string>();
codec.encode("Top.Science");
codec.encode(ltree("Top.Science"));
nullable.encode(null);
// @ts-expect-error A plain string has no native ltree output brand.
const unbranded: Ltree = "Top.Science";
// @ts-expect-error Only string input is supported.
codec.encode(2);
// @ts-expect-error Only the nullable codec accepts SQL NULL.
codec.encode(null);
// @ts-expect-error Constructors only accept strings.
ltree(true);
// @ts-expect-error Decoder output is fixed, with no caller-selected generic.
codec.decode<string>("Top.Science");

const nlevel = createSqlFunction({
  schema: "extensions",
  name: "nlevel",
  member: "routine:$extension:ltree.nlevel($extension:ltree.ltree)",
  arguments: [nullable] as const,
  result: nullableCodec(int4Codec),
  dependencies: [],
  observability: "tables",
  authority: "query",
});
expectTypeOf(nlevel("Top.Science")).toEqualTypeOf<SQL<number | null>>();
nlevel(sql<Ltree>`native_path`);
nlevel(sql<Ltree>`native_path`.as("path"));
nlevel(null);
// @ts-expect-error SQL text is not a native ltree expression.
nlevel(sql<string>`text_path`);
// @ts-expect-error SQL boolean is not a native ltree expression.
nlevel(sql<boolean>`flag`);
// @ts-expect-error A plain SQL text value cannot be assigned a native ltree brand.
const textExpression: SQL<Ltree> = sql<string>`text_path`;
// @ts-expect-error A SQL boolean cannot be assigned a native ltree brand.
const booleanExpression: SQL<Ltree> = sql<boolean>`flag`;
// @ts-expect-error Function results are codec determined.
nlevel<string>("Top.Science");
