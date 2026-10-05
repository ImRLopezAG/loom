import type { SQL } from "drizzle-orm";
import { boolean, integer, pgTable, text } from "drizzle-orm/pg-core";
import {
  createIntarray_1_5,
  intarrayValues,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/intarray";
import type { ExtensionIndexContract } from "../../../apps/loom/src/core/extensions/fields";

const table = pgTable("documents", {
  tags: integer().array().notNull(),
  weight: integer(),
  label: text(),
  enabled: boolean(),
});
const api = createIntarray_1_5({
  name: "intarray",
  version: "1.5",
  schema: "custom",
  apiSupport: { status: "verified", digest: "c71054bd4b390e4e0457bb83bbaeaaef426319c14d6f0563fecfb8758d3224f2" },
});
const sorted: SQL<PostgreSqlArray<number> | null> = api.sort(table.tags);
const directed: SQL<PostgreSqlArray<number> | null> = api.sort(table.tags, "DESC");
const composed: SQL<boolean | null> = api.contains(api.union(table.tags, sorted), intarrayValues([1]));
const plain: SQL<boolean | null> = api.overlaps([1, 2], [null, 3]);
const matched: SQL<boolean | null> = api.matches(table.tags, "1 & !2");
const commuted: SQL<boolean | null> = api.matchedBy("1 | 2", table.tags);
const counted: SQL<number | null> = api.count(table.tags);
const position: SQL<number | null> = api.indexOf(table.tags, table.weight);
const slice: SQL<PostgreSqlArray<number> | null> = api.subarray(table.tags, -2, table.weight);
const canonical: SQL<PostgreSqlArray<number> | null> = api.sql.functions.intset(null);
const operator: SQL<PostgreSqlArray<number> | null> = api.sql.operators["-(_int4,int4)"](table.tags, 3);
const failing: SQL<string | null> = api.querytree("1");
const field = api.field().notNull().default([1, 2]);
const mixed: SQL<PostgreSqlArray<number> | null> = api.sort(table.tags, "aSc");
// @ts-expect-error Indexed native fields reject NULL elements.
field.default([null]);
// @ts-expect-error Indexed native fields are one-dimensional.
field.default([[1]]);
const gin: ExtensionIndexContract = api.indexes.gin();
const schema: "custom" = api.schema;
// @ts-expect-error Directions are only ASC or DESC.
api.sort(table.tags, "up");
// @ts-expect-error subarray has only 2- and 3-argument overloads.
api.subarray(table.tags);
// @ts-expect-error Text columns are not int4[] arguments.
api.uniq(table.label);
// @ts-expect-error A scalar int4 column is not an int4[] argument.
api.contains(table.weight, [1]);
// @ts-expect-error Boolean columns are not int4 elements.
api.append(table.tags, table.enabled);
// @ts-expect-error query_int is text, not a number.
api.matches(table.tags, 1);
// @ts-expect-error Results are not caller-selected casts.
api.icount<string>(table.tags);
// @ts-expect-error numranges is the GiST class option; siglen is the signature class option.
api.indexes.gistBig({ numranges: 4 });
createIntarray_1_5({
  name: "intarray",
  // @ts-expect-error The factory binds only the captured 1.5 version.
  version: "1.4",
  schema: "custom",
  apiSupport: { status: "verified", digest: "c71054bd4b390e4e0457bb83bbaeaaef426319c14d6f0563fecfb8758d3224f2" },
});
void [
  sorted,
  directed,
  composed,
  plain,
  matched,
  commuted,
  counted,
  position,
  slice,
  canonical,
  operator,
  failing,
  gin,
  field,
  mixed,
  schema,
];
