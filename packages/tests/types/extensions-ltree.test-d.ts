import type { SQL } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";
import {
  createLtree_1_3,
  ltree,
  lquery,
  ltxtquery,
  type Lquery,
  type Ltree,
  type Ltxtquery,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/ltree";

const table = pgTable("nodes", { label: text() });
const tree = createLtree_1_3({
  name: "ltree",
  version: "1.3",
  schema: "custom",
  apiSupport: { status: "verified", digest: "f0d5b39c468e80a8748a7a35ed30af0e530da547c2c15ebcaee307e34090c82e" },
});
const pathBytes: SQL<{ readonly hex: string } | null> = tree.sql.functions.ltree_send("a.b");
const queryBytes: SQL<{ readonly hex: string } | null> = tree.sql.functions.lquery_send("a.*");
const textQueryBytes: SQL<{ readonly hex: string } | null> = tree.sql.functions.ltxtq_send("a & b");
void [pathBytes, queryBytes, textQueryBytes];
// @ts-expect-error Binary send results preserve SQL NULL.
const requiredBytes: SQL<{ readonly hex: string }> = pathBytes;
void requiredBytes;
const paths: PostgreSqlArray<string> = { dimensions: [{ lowerBound: 1, length: 1 }], values: ["a.b"] };

const schema: "custom" = tree.schema;
const ancestor: SQL<boolean | null> = tree.isAncestor(ltree("Top"), "Top.Science");
const matched: SQL<boolean | null> = tree.matches("Top.Science", lquery("*.Science"));
const searched: SQL<boolean | null> = tree.search("Top.Science", ltxtquery("science@"));
const any: SQL<boolean | null> = tree.matchesAny("Top", paths);
const first: SQL<Ltree | null> = tree.firstAncestor(paths, "a.b.c");
const joined: SQL<Ltree | null> = tree.append("a", table.label);
const prefixed: SQL<Ltree | null> = tree.prepend(table.label, "a");
const depth: SQL<number | null> = tree.nlevel(null);
const compare: SQL<number | null> = tree.compare("a", "b");
const hashed: SQL<bigint | null> = tree.hashExtended("a", 1n);
const text_: SQL<string | null> = tree.toText("a");
const parsed: SQL<Ltree | null> = tree.fromText(table.label);
const offset: SQL<Ltree | null> = tree.subpath("a.b", 1);
const sliced: SQL<Ltree | null> = tree.subpath("a.b", 0, 1);
const found: SQL<number | null> = tree.index("a.b", "b", -1);
const common: SQL<Ltree | null> = tree.lca("a", "b", "c", "d", "e", "f", "g", "h");
const many: SQL<Ltree | null> = tree.lcaArray(paths);
const reverse: SQL<boolean | null> = tree.sql.operators["~"]["lquery,ltree"]("*", "a");
const caret: SQL<boolean | null> = tree.sql.operators["^@"]["ltxtquery,_ltree"]("a", paths);
const value: Ltree = tree.codec.decode("a.b");
const queryValue: Lquery = tree.queryCodec.decode("a.*");
const textQueryValue: Ltxtquery = tree.textQueryCodec.decode("a & b");
const arrayValue: PostgreSqlArray<Ltree> = tree.arrayCodec.decode("{a}");
void [
  schema,
  ancestor,
  matched,
  searched,
  any,
  first,
  joined,
  prefixed,
  depth,
  compare,
  hashed,
  text_,
  parsed,
  offset,
  sliced,
  found,
  common,
  many,
  reverse,
  caret,
  value,
  queryValue,
  textQueryValue,
  arrayValue,
];

// @ts-expect-error lca has captured routines for 2 to 8 paths only.
tree.lca("a");
// @ts-expect-error lca has captured routines for 2 to 8 paths only.
tree.lca("a", "b", "c", "d", "e", "f", "g", "h", "i");
// @ts-expect-error subpath has 2 and 3 argument overloads only.
tree.subpath("a");
// @ts-expect-error index offsets are int4, not text.
tree.index("a", "b", "1");
// @ts-expect-error hash_ltree_extended seeds are int8 bigint.
tree.hashExtended("a", 1);
// @ts-expect-error Array operators take PostgreSqlArray, not a JavaScript string array.
tree.anyAncestor(["a"], "a");
// @ts-expect-error The ?@> operator exists only for ltree[] on the left.
tree.sql.operators["?@>"]("a", "a");
// @ts-expect-error A decoded path is not an lquery.
const wrong: Lquery = tree.codec.decode("a");
void wrong;
// @ts-expect-error Pending contracts never bind.
createLtree_1_3({ name: "ltree", version: "1.3", schema: "x", apiSupport: { status: "pending" } });
