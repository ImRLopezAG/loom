const evidence = [
  "https://www.postgresql.org/docs/18/fuzzystrmatch.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/fuzzystrmatch/fuzzystrmatch.c: metaphone strlen input/output checks enforce bytes, despite docs saying characters",
  "packages/tests/types/extensions-fuzzy-token.test-d.ts: exact nullable text/int4 inputs and 2/5, 3/6 overload rejection",
  "packages/tests/unit/extensions-fuzzy-token.test.ts: fuzzy canonical functions expose every captured overload and parameterize exact int4 costs",
  "packages/e2e/integration/extensions-fuzzy-token.test.ts: fuzzy all eleven signatures decode and compose inside a Loom transaction (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-fuzzy-token.md)",
] as const;
const strictText = {
  authority: "query",
  observability: "tables",
  nulls: "NULL for any NULL argument",
  result: "string | null",
  codec: "pg:text:1:nullable",
} as const;
const strictInteger = { ...strictText, result: "number | null", codec: "pg:int4:1:nullable" } as const;

/** All captured functions are public queries; provider acceptance is separate from local evidence. */
export const fuzzystrmatchAnnotations = [
  {
    id: "routine:$extension:fuzzystrmatch.daitch_mokotoff(pg_catalog.text)",
    disposition: "query",
    evidence,
    reason:
      "daitchMokotoff / sql.functions.daitch_mokotoff returns all six-digit phonetic codes; supports UTF-8; empty/no-code input also returns NULL.",
    semantics: {
      ...strictText,
      result: "PostgreSqlArray<string> | null",
      codec: "pg:array:1:,:pg:text:1:nullable",
      limitation: "Preserve array dimensions, bounds and NULL elements; do not collapse to an unchecked string array.",
    },
  },
  {
    id: "routine:$extension:fuzzystrmatch.difference(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    evidence,
    reason:
      "difference / sql.functions.difference returns the number of matching Soundex code positions, from 0 through 4, with 4 most similar.",
    semantics: {
      ...strictInteger,
      limitation: "Soundex-based similarity works poorly for multibyte text; not an edit distance.",
    },
  },
  {
    id: "routine:$extension:fuzzystrmatch.dmetaphone_alt(pg_catalog.text)",
    disposition: "query",
    evidence,
    reason: "dmetaphoneAlt / sql.functions.dmetaphone_alt returns the alternate Double Metaphone code.",
    semantics: {
      ...strictText,
      limitation: "Documented poor multibyte behavior; primary and alternate codes may be equal.",
    },
  },
  {
    id: "routine:$extension:fuzzystrmatch.dmetaphone(pg_catalog.text)",
    disposition: "query",
    evidence,
    reason: "dmetaphone / sql.functions.dmetaphone returns the primary Double Metaphone code.",
    semantics: {
      ...strictText,
      limitation: "Documented poor multibyte behavior; primary and alternate codes may be equal.",
    },
  },
  {
    id: "routine:$extension:fuzzystrmatch.levenshtein_less_equal(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    evidence,
    reason:
      "levenshteinLessEqual / sql.functions.levenshtein_less_equal selects the exact six-argument cost overload; arguments are source, target, insertion, deletion, substitution, maxDistance.",
    semantics: {
      ...strictInteger,
      limitation:
        "UTF-8 character counting; at most 255 characters per input; above maxDistance the result is greater than the threshold but not necessarily exact; negative maxDistance computes exact distance.",
    },
  },
  {
    id: "routine:$extension:fuzzystrmatch.levenshtein_less_equal(pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
    disposition: "query",
    evidence,
    reason:
      "levenshteinLessEqual / sql.functions.levenshtein_less_equal selects the exact three-argument overload, with unit insertion/deletion/substitution costs.",
    semantics: {
      ...strictInteger,
      limitation:
        "UTF-8 character counting; at most 255 characters per input; above maxDistance the result is greater than the threshold but not necessarily exact; negative maxDistance computes exact distance.",
    },
  },
  {
    id: "routine:$extension:fuzzystrmatch.levenshtein(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    evidence,
    reason:
      "levenshtein / sql.functions.levenshtein selects the exact five-argument overload; arguments are source, target, insertion, deletion, substitution, preserving directional cost semantics.",
    semantics: {
      ...strictInteger,
      limitation:
        "UTF-8 character counting; at most 255 characters per input; PostgreSQL evaluates captured int4 costs.",
    },
  },
  {
    id: "routine:$extension:fuzzystrmatch.levenshtein(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    evidence,
    reason:
      "levenshtein / sql.functions.levenshtein selects the exact two-argument overload, with unit insertion/deletion/substitution costs.",
    semantics: { ...strictInteger, limitation: "UTF-8 character counting; at most 255 characters per input." },
  },
  {
    id: "routine:$extension:fuzzystrmatch.metaphone(pg_catalog.text,pg_catalog.int4)",
    disposition: "query",
    evidence,
    reason:
      "metaphone / sql.functions.metaphone takes text followed by int4 maximum output code length, with no invented one-argument overload.",
    semantics: {
      ...strictText,
      limitation:
        "Poor multibyte behavior. Actual PG18 source limits input to 255 bytes, not documented characters; nonempty input requires output length 1..255. Empty source returns empty text before output-length checks.",
    },
  },
  {
    id: "routine:$extension:fuzzystrmatch.soundex(pg_catalog.text)",
    disposition: "query",
    evidence,
    reason: "soundex / sql.functions.soundex returns the Soundex code using PostgreSQL's algorithm.",
    semantics: {
      ...strictText,
      limitation:
        "Documented poor multibyte behavior; code does not establish a collation-independent natural-language equivalence.",
    },
  },
  {
    id: "routine:$extension:fuzzystrmatch.text_soundex(pg_catalog.text)",
    disposition: "query",
    evidence,
    reason:
      "textSoundex / sql.functions.text_soundex exposes the captured public Soundex alias, without excluding it by implementation language.",
    semantics: { ...strictText, limitation: "Same Soundex multibyte caveats; exact captured name remains callable." },
  },
] as const;
