import { expectTypeOf } from "vite-plus/test";
import { sql, type SQL } from "drizzle-orm";
import {
  createCitext_1_8,
  citext,
  bpchar,
  inet,
  type Citext,
} from "../../../apps/loom/src/core/extensions/adapters/citext";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import type { PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
const descriptor = {
  name: "citext",
  version: "1.8",
  schema: "case_text",
  apiSupport: { status: "verified", digest: "bf50ef209f828f5cbd517fe1a5f0b1ede7f1bbeac379b75c0b2bc02bf0a8eee3" },
} as const;
const api = createCitext_1_8(descriptor);
const schema = defineSchema((fields) => ({
  docs: {
    body: api.field().notNull(),
    tags: api.arrayField(),
    text: fields.text().notNull(),
    wrong: fields.boolean().notNull(),
  },
}));
expectTypeOf(api.schema).toEqualTypeOf<"case_text">();
expectTypeOf(api.version).toEqualTypeOf<"1.8">();
expectTypeOf(api.codec.decode("MiXeD")).toEqualTypeOf<Citext>();
expectTypeOf(api.equal(schema.tables.docs.body, "value")).toEqualTypeOf<SQL<boolean | null>>();
expectTypeOf(api.fromText(schema.tables.docs.text)).toEqualTypeOf<SQL<Citext | null>>();
expectTypeOf(api.min(schema.tables.docs.body)).toEqualTypeOf<SQL<Citext | null>>();
expectTypeOf(api.hashExtended(citext("A"), 1n)).toEqualTypeOf<SQL<bigint | null>>();
expectTypeOf(api.regexpMatch("A", "a")).toEqualTypeOf<SQL<PostgreSqlArray<string> | null>>();
expectTypeOf(api.sql.functions.citext.bpchar(bpchar("a  "))).toEqualTypeOf<SQL<Citext | null>>();
expectTypeOf(api.sql.functions.citext.inet(inet("192.0.2.1"))).toEqualTypeOf<SQL<Citext | null>>();
expectTypeOf(api.equal(api.fromText("A").as("alias"), "a")).toEqualTypeOf<SQL<boolean | null>>();
// @ts-expect-error native text requires actual captured conversion
api.equal(schema.tables.docs.text, "value");
// @ts-expect-error wrong native type
api.equal(schema.tables.docs.wrong, "value");
// @ts-expect-error no arbitrary result generic
api.equal<string>("a", "b");
// @ts-expect-error extended hash requires int8 bigint
api.hashExtended("a", 1);
// @ts-expect-error exact captured regex arity
api.regexpMatch("a");
// @ts-expect-error absent numeric cast edge
api.sql.casts.numeric_to_citext(1);
// @ts-expect-error incompatible native brand
api.equal(sql<ReturnType<typeof inet>>`'192.0.2.1'::inet`, "a");
// @ts-expect-error PostgreSQL array input retains dimensions, not a plain array
api.arrayCodec.encode(["A"]);
// @ts-expect-error wrong array element input
api.arrayCodec.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: [true] });
// @ts-expect-error exact version
createCitext_1_8({ ...descriptor, version: "1.7" });
// @ts-expect-error hash class accepts no caller override
api.indexes.hash("btree");
// @ts-expect-error pattern class has no guessed configuration options
api.indexes.pattern({ siglen: 1 });
