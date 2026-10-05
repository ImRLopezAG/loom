import type { SQL } from "drizzle-orm";
import { createTablefunc_1_0 } from "../../../apps/loom/src/core/extensions/adapters/tablefunc";
import { nullableCodec, textCodec, type NonfiniteNumber } from "../../../apps/loom/src/core/extensions/codecs";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import type { NestedQuery } from "../../../apps/loom/src/core/extensions/nested-query";

const descriptor = {
  name: "tablefunc",
  version: "1.0",
  schema: 'table"func',
  apiSupport: {
    status: "verified",
    digest: "08f54e73281a2592eddf0ac6f555ba1a0b3c0961fb7ab6eab05be90ab74b66d4",
  },
} as const;
const api = createTablefunc_1_0(descriptor);
declare const source: NestedQuery<{ name: string; cat: string; val: string }>;
declare const categories: NestedQuery<{ cat: string }>;
const text = nullableCodec(textCodec);

const pivot = api.crosstab({ source, fields: { name: text, a: text, n: int4Codec }, alias: "p" });
const pivotName: SQL<string | null> = pivot.columns.name;
const pivotNumber: SQL<number> = pivot.columns.n;
const hashed = api.crosstab({ source, categories, fields: { name: text, a: text }, alias: "p" });
const hashedValue: SQL<string | null> = hashed.columns.a;
const counted = api.crosstab({ source, count: 2, fields: { name: text, a: text }, alias: "p" });
const countedValue: SQL<string | null> = counted.columns.a;
// @ts-expect-error categories and count select different captured overloads.
api.crosstab({ source, categories, count: 2, fields: { name: text }, alias: "p" });
// @ts-expect-error raw SQL text is never a crosstab source.
api.crosstab({ source: "select 1", fields: { name: text }, alias: "p" });

const fixed = api.crosstab4({ source, alias: "p" });
const category4: SQL<string | null> = fixed.columns.category_4;
const rowName: SQL<string | null> = api.crosstab2({ source, alias: "p" }).columns.row_name;
// @ts-expect-error crosstab2 has only two category columns.
const noCategory3 = api.crosstab2({ source, alias: "p" }).columns.category_3;
// @ts-expect-error raw SQL text is never a crosstab2 source.
api.crosstab2({ source: "select 1", alias: "p" });

const plain = api.connectby({
  relation: { schema: "public", name: "tree" },
  key: "id",
  parent: "parent",
  start: "1",
  maxDepth: 0,
  keyCodec: int4Codec,
  alias: "t",
});
const keyid: SQL<number> = plain.columns.keyid;
const parentKey: SQL<number | null> = plain.columns.parent_keyid;
const level: SQL<number> = plain.columns.level;
// @ts-expect-error branch exists only when branchDelimiter is supplied.
const noBranch = plain.columns.branch;
// @ts-expect-error pos exists only when orderBy is supplied.
const noPos = plain.columns.pos;
const full = api.connectby({
  source,
  key: "name",
  parent: "cat",
  orderBy: "val",
  start: "1",
  maxDepth: 0,
  branchDelimiter: "~",
  keyCodec: textCodec,
  alias: "t",
});
const branch: SQL<string> = full.columns.branch;
const pos: SQL<number> = full.columns.pos;
api.connectby({
  // @ts-expect-error raw relation strings are not accepted; use a quoted identity or NestedQuery.
  relation: "tree; drop table x",
  key: "id",
  parent: "parent",
  start: "1",
  maxDepth: 0,
  keyCodec: textCodec,
  alias: "t",
});

const samples: SQL<number | NonfiniteNumber> = api.normalRand(3, 0, 1, "s").columns.value;
// @ts-expect-error normal_rand count is int4, not text.
api.normalRand("3", 0, 1, "s");
const row: {
  readonly row_name: string | null;
  readonly category_1: string | null;
  readonly category_2: string | null;
} = api.codecs.crosstab2.decode("(a,b,c)");
const schema: 'table"func' = api.schema;
const version: "1.0" = api.version;
// @ts-expect-error Exact factory only accepts 1.0.
createTablefunc_1_0({ ...descriptor, version: "1.1" });

export {
  noCategory3,
  noBranch,
  noPos,
  pivotName,
  pivotNumber,
  hashedValue,
  countedValue,
  category4,
  rowName,
  keyid,
  parentKey,
  level,
  branch,
  pos,
  samples,
  row,
  schema,
  version,
};
