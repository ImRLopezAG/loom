import type { SQL } from "drizzle-orm";
import { pgTable, text, boolean } from "drizzle-orm/pg-core";
import { createPgTrgm_1_6 } from "../../../apps/loom/src/core/extensions/adapters/pg-trgm";
import type { ExtensionIndexContract } from "../../../apps/loom/src/core/extensions/fields";

const descriptor = {
  name: "pg_trgm",
  version: "1.6",
  schema: "search",
  apiSupport: { status: "verified", digest: "88e35b55b09e58d6a59847390006ca73483bdb4444346474beb644c63adcbe66" },
} as const;
const api = createPgTrgm_1_6(descriptor);
const columns = pgTable("documents", { title: text().notNull(), nullable: text(), active: boolean().notNull() });
const score: SQL<number> = api.similarity(columns.title, "word");
const nullable: SQL<number | null> = api.similarity(columns.nullable, "word");
const missing: SQL<number | null> = api.distance(null, "word");
const trigrams: SQL<string[]> = api.showTrigrams(columns.title);
const nullableTrigrams: SQL<string[] | null> = api.sql.functions.show_trgm(columns.nullable);
const predicate: SQL<boolean> = api.sql.operators["%>"](columns.title, "word");
const schema: "search" = api.schema;
const version: "1.6" = api.version;
// pg_trgm.rejectsBooleanOperand
// @ts-expect-error Boolean columns are incompatible with captured text arguments.
api.similarity(columns.active, "word");
// @ts-expect-error Boolean literal arguments are incompatible with captured text arguments.
api.wordSimilarity(true, "word");
// @ts-expect-error Operators retain exact text argument facts.
api.sql.operators["<<%"](columns.active, "word");
// @ts-expect-error NULL completion does not promise a non-null score.
const nonnull: SQL<number> = api.similarity(columns.nullable, "word");
// @ts-expect-error No caller-selected result generic.
api.similarity<string>("word", "word");
// @ts-expect-error set_limit belongs to explicit operator tooling.
api.sql.functions.set_limit(0.5);
// @ts-expect-error Exact factory only accepts 1.6.
createPgTrgm_1_6({ ...descriptor, version: "1.5" });
// @ts-expect-error GIN has no opclass options.
api.indexes.gin({ siglen: 32 });
void [score, nullable, missing, trigrams, nullableTrigrams, predicate, schema, version, nonnull];
api.indexes.gist({ siglen: 32 });
// @ts-expect-error GiST options use numeric signature bytes.
api.indexes.gist({ siglen: "32" });
// @ts-expect-error No invented opclass options.
api.indexes.gist({ fillfactor: 80 });

// pg_trgm.canonicalTypes
const scores: SQL<number>[] = [
  api.sql.functions.similarity(columns.title, "word"),
  api.sql.functions.word_similarity(columns.title, "word"),
  api.sql.functions.strict_word_similarity(columns.title, "word"),
  api.sql.functions.similarity_dist(columns.title, "word"),
  api.sql.functions.word_similarity_dist_op(columns.title, "word"),
  api.sql.functions.word_similarity_dist_commutator_op(columns.title, "word"),
  api.sql.functions.strict_word_similarity_dist_op(columns.title, "word"),
  api.sql.functions.strict_word_similarity_dist_commutator_op(columns.title, "word"),
];
const predicates: SQL<boolean>[] = [
  api.sql.functions.similarity_op(columns.title, "word"),
  api.sql.functions.word_similarity_op(columns.title, "word"),
  api.sql.functions.word_similarity_commutator_op(columns.title, "word"),
  api.sql.functions.strict_word_similarity_op(columns.title, "word"),
  api.sql.functions.strict_word_similarity_commutator_op(columns.title, "word"),
];
const threshold: SQL<number> = api.sql.functions.show_limit();
const distances: SQL<number>[] = [
  api.sql.operators["<->"](columns.title, "word"),
  api.sql.operators["<<->"](columns.title, "word"),
  api.sql.operators["<->>"](columns.title, "word"),
  api.sql.operators["<<<->"](columns.title, "word"),
  api.sql.operators["<->>>"](columns.title, "word"),
];
void [scores, predicates, threshold, distances];

// pg_trgm.memberOverloads
const overloads: keyof typeof api.sql.overloads =
  "routine:$extension:pg_trgm.similarity(pg_catalog.text,pg_catalog.text)";
const canonicalScore: SQL<number> =
  api.sql.overloads["routine:$extension:pg_trgm.similarity(pg_catalog.text,pg_catalog.text)"]("left", "right");
const canonicalTrigrams: SQL<string[]> =
  api.sql.overloads["routine:$extension:pg_trgm.show_trgm(pg_catalog.text)"]("text");
const canonicalLimit: SQL<number> = api.sql.overloads["routine:$extension:pg_trgm.show_limit()"]();
// @ts-expect-error Canonical overload identities contain only captured public members.
api.sql.overloads["routine:$extension:pg_trgm.missing()"]();
// @ts-expect-error The captured show_limit overload takes no arguments.
api.sql.overloads["routine:$extension:pg_trgm.show_limit()"]("extra");
const indexes: [ExtensionIndexContract, ExtensionIndexContract] = [api.indexes.gin(), api.indexes.gist({ siglen: 1 })];
const nullableDistances: SQL<number | null>[] = [
  api.wordDistance(columns.nullable, "word"),
  api.strictWordDistance("word", null),
];
const nullablePredicates: SQL<boolean | null>[] = [
  api.similar(columns.nullable, "word"),
  api.wordSimilar(null, "word"),
  api.strictWordSimilar("word", columns.nullable),
];
// @ts-expect-error Legacy set_limit is operator tooling, never an RPC helper.
api.setLimit(0.5);
// @ts-expect-error show_trgm takes exactly one text argument.
api.showTrigrams(columns.title, "word");
// @ts-expect-error show_limit takes no arguments.
api.sql.functions.show_limit(0.5);
// @ts-expect-error Numeric literals are not captured text.
api.sql.operators["<->"](1, "word");
void [overloads, canonicalScore, canonicalTrigrams, canonicalLimit, indexes, nullableDistances, nullablePredicates];
