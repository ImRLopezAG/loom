import type { SQL } from "drizzle-orm";
import { pgTable, text, boolean, integer, bigint } from "drizzle-orm/pg-core";
import type { PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import { createFuzzystrmatch_1_2 } from "../../../apps/loom/src/core/extensions/adapters/fuzzystrmatch";
import { createPgTiktoken_0_0_1 } from "../../../apps/loom/src/core/extensions/adapters/pg-tiktoken";
const table = pgTable("documents", {
  title: text(),
  enabled: boolean(),
  maximum: integer(),
  wide: bigint({ mode: "bigint" }),
});
const fuzzy = createFuzzystrmatch_1_2({
  name: "fuzzystrmatch",
  version: "1.2",
  schema: "custom",
  apiSupport: { status: "verified", digest: "0607e044d263e8999732df67f96cfb29479f6811db8b4df674acf3c9c9d16961" },
});
const token = createPgTiktoken_0_0_1({
  name: "pg_tiktoken",
  version: "0.0.1",
  schema: "tokens",
  apiSupport: { status: "verified" },
});
const score: SQL<number | null> = fuzzy.difference(table.title, "Robert");
const distance: SQL<number | null> = fuzzy.levenshtein(table.title, "a", 2, 3, 4);
const bounded: SQL<number | null> = fuzzy.levenshteinLessEqual(table.title, "a", 2, 3, 4, table.maximum);
const codes: SQL<PostgreSqlArray<string> | null> = fuzzy.daitchMokotoff(table.title);
const count: SQL<bigint | null> = token.count("cl100k_base", table.title);
const tokens: SQL<PostgreSqlArray<bigint> | null> = token.encode("cl100k_base", table.title);
const schema: "custom" = fuzzy.schema;
fuzzy.sql.functions.levenshtein("a", "b");
fuzzy.sql.functions.levenshtein_less_equal("a", "b", 1);
fuzzy.sql.functions.text_soundex(null);
fuzzy.sql.functions.metaphone("a", null);
token.sql.functions.tiktoken_count(null, null);
// @ts-expect-error Only captured 2/5 argument Levenshtein overloads exist.
fuzzy.levenshtein("a", "b", 2);
// @ts-expect-error Only captured 3/6 argument bounded overloads exist.
fuzzy.levenshteinLessEqual("a", "b", 2, 3);
// @ts-expect-error A positional hole is not a PostgreSQL overload.
fuzzy.levenshtein("a", "b", undefined, 3, 4);
// @ts-expect-error A text routine rejects boolean columns.
fuzzy.soundex(table.enabled);
// @ts-expect-error Exact int4 costs are numbers, not int8 columns.
fuzzy.metaphone("a", table.wide);
// @ts-expect-error Tokenizer text rejects numeric columns.
token.encode("cl100k_base", table.maximum);
// @ts-expect-error User-selected result generic casts do not exist.
token.count<number>("cl100k_base", "hello");
createFuzzystrmatch_1_2({
  name: "fuzzystrmatch",
  // @ts-expect-error Factories only bind the captured extension version.
  version: "1.1",
  schema: "custom",
  apiSupport: { status: "verified", digest: "0607e044d263e8999732df67f96cfb29479f6811db8b4df674acf3c9c9d16961" },
});
createPgTiktoken_0_0_1({
  // @ts-expect-error The tokenizer factory cannot bind a different extension identity.
  name: "fuzzystrmatch",
  version: "0.0.1",
  schema: "tokens",
  apiSupport: { status: "verified" },
});
void [score, distance, bounded, codes, count, tokens, schema];
