import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { arrayCodec, nullableCodec, textCodec } from "../codecs";
import { int4Codec } from "../native-codecs";
import { createSqlFunction } from "../sql";

/** Immutable phonetic and edit-distance expressions; multibyte phonetic caveats remain PostgreSQL's. */
export function createFuzzystrmatch_1_2<
  const Descriptor extends ExtensionDescriptor<"fuzzystrmatch", { version: "1.2"; schema: string }>,
>(descriptor: Descriptor) {
  const text = nullableCodec(textCodec);
  const integer = nullableCodec(int4Codec);
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const unaryText = (name: "soundex" | "text_soundex" | "dmetaphone" | "dmetaphone_alt") =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:fuzzystrmatch.${name}(pg_catalog.text)`,
      arguments: [text] as const,
      result: text,
    });
  const soundex = unaryText("soundex");
  const textSoundex = unaryText("text_soundex");
  const dmetaphone = unaryText("dmetaphone");
  const dmetaphoneAlt = unaryText("dmetaphone_alt");
  const difference = createSqlFunction({
    ...base,
    name: "difference",
    member: "routine:$extension:fuzzystrmatch.difference(pg_catalog.text,pg_catalog.text)",
    arguments: [text, text] as const,
    result: integer,
  });
  const daitchMokotoff = createSqlFunction({
    ...base,
    name: "daitch_mokotoff",
    member: "routine:$extension:fuzzystrmatch.daitch_mokotoff(pg_catalog.text)",
    arguments: [text] as const,
    result: nullableCodec(arrayCodec(textCodec)),
  });
  const metaphone = createSqlFunction({
    ...base,
    name: "metaphone",
    member: "routine:$extension:fuzzystrmatch.metaphone(pg_catalog.text,pg_catalog.int4)",
    arguments: [text, integer] as const,
    result: text,
  });
  const distance = createSqlFunction({
    ...base,
    name: "levenshtein",
    member: "routine:$extension:fuzzystrmatch.levenshtein(pg_catalog.text,pg_catalog.text)",
    arguments: [text, text] as const,
    result: integer,
  });
  const costDistance = createSqlFunction({
    ...base,
    name: "levenshtein",
    member:
      "routine:$extension:fuzzystrmatch.levenshtein(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)",
    arguments: [text, text, integer, integer, integer] as const,
    result: integer,
  });
  /** Costs are insertion, deletion, substitution, in that order; inputs have PostgreSQL's 255-character limit. */
  const levenshtein = (...arguments_: Parameters<typeof distance> | Parameters<typeof costDistance>) =>
    arguments_.length === 2 ? distance(...arguments_) : costDistance(...arguments_);
  const bounded = createSqlFunction({
    ...base,
    name: "levenshtein_less_equal",
    member: "routine:$extension:fuzzystrmatch.levenshtein_less_equal(pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
    arguments: [text, text, integer] as const,
    result: integer,
  });
  const costBounded = createSqlFunction({
    ...base,
    name: "levenshtein_less_equal",
    member:
      "routine:$extension:fuzzystrmatch.levenshtein_less_equal(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)",
    arguments: [text, text, integer, integer, integer, integer] as const,
    result: integer,
  });
  /** Above maxDistance, PostgreSQL returns an unspecified value greater than the threshold. */
  const levenshteinLessEqual = (...arguments_: Parameters<typeof bounded> | Parameters<typeof costBounded>) =>
    arguments_.length === 3 ? bounded(...arguments_) : costBounded(...arguments_);
  const functions = Object.freeze({
    soundex,
    text_soundex: textSoundex,
    difference,
    daitch_mokotoff: daitchMokotoff,
    metaphone,
    dmetaphone,
    dmetaphone_alt: dmetaphoneAlt,
    levenshtein,
    levenshtein_less_equal: levenshteinLessEqual,
  });
  return bindExtension(descriptor, {
    soundex,
    textSoundex,
    difference,
    daitchMokotoff,
    metaphone,
    dmetaphone,
    dmetaphoneAlt,
    levenshtein,
    levenshteinLessEqual,
    sql: Object.freeze({ functions, operators: Object.freeze({}) }),
  });
}
