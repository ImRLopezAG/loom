import * as v from "valibot";
import type { AnyColumn, SQL } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  booleanCodec,
  createExtensionCodec,
  nullableCodec,
  textCodec,
  type ExtensionCodec,
} from "../codecs";
import { float4Codec } from "../primitive-number-codecs";
import { createSqlFunction, createSqlOperator, type ExtensionSqlInput } from "../sql";
import type { ExtensionIndexContract } from "../fields";

const digest = "88e35b55b09e58d6a59847390006ca73483bdb4444346474beb644c63adcbe66";
type Descriptor = ExtensionDescriptor<"pg_trgm", { readonly version: "1.6"; readonly schema: string }>;
const bounded = v.pipe(v.number(), v.finite(), v.minValue(0), v.maxValue(1));
const scoreCodec = createExtensionCodec({
  id: "pg_trgm:float4:unit-interval:1",
  sqlType: { schema: "pg_catalog", name: "float4" },
  input: bounded,
  output: bounded,
  transport: "native",
  encode: (value) => float4Codec.encode(value),
  decode: (value) => float4Codec.decode(value),
});
const array = arrayCodec(textCodec);
const trigramsCodec = createExtensionCodec({
  id: "pg_trgm:show_trgm:text-array:1",
  sqlType: { schema: "pg_catalog", name: "text", array: true },
  input: v.array(v.string()),
  output: v.array(v.string()),
  transport: "text",
  encode: (value) =>
    array.encode({ dimensions: value.length ? [{ lowerBound: 1, length: value.length }] : [], values: value }),
  decode(value) {
    const result = array.decode(value);
    if (result.dimensions.length && (result.dimensions.length !== 1 || result.dimensions[0]?.lowerBound !== 1))
      throw new Error("show_trgm requires a one-dimensional text array with lower bound 1");
    return result.values;
  },
});
const nullableText = nullableCodec(textCodec);
type Text = string | SQL<string> | AnyColumn<{ data: string; notNull: true }>;
type NullableText = ExtensionSqlInput<typeof nullableText>;
interface StrictTextPair<Value> {
  (left: Text, right: Text): SQL<Value>;
  (left: NullableText, right: NullableText): SQL<Value | null>;
}
interface StrictText<Value> {
  (text: Text): SQL<Value>;
  (text: NullableText): SQL<Value | null>;
}

/** Exact pg_trgm 1.6 query and native-text index APIs. Session writes live in operator tooling. */
export function createPgTrgm_1_6<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "pg_trgm" ||
    descriptor.version !== "1.6" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("pg_trgm 1.6 requires its exact verified contract");
  const common = { schema: descriptor.schema, dependencies: [], authority: "query" as const };
  function pair<Value>(
    name: string,
    result: ExtensionCodec<Value, Value>,
    observability: "tables" | "session",
  ): StrictTextPair<Value> {
    const call = createSqlFunction({
      ...common,
      name,
      member: `routine:$extension:pg_trgm.${name}(pg_catalog.text,pg_catalog.text)`,
      arguments: [nullableText, nullableText] as const,
      result: nullableCodec(result),
      observability,
    });
    // SAFETY: all captured public text-pair routines are strict and total for non-NULL text; nullable arguments keep nullable output.
    return call as StrictTextPair<Value>;
  }
  function operator<Value>(
    name: string,
    result: ExtensionCodec<Value, Value>,
    observability: "tables" | "session",
  ): StrictTextPair<Value> {
    const call = createSqlOperator({
      ...common,
      name,
      member: `operator:$extension:pg_trgm.${name}(pg_catalog.text,pg_catalog.text)`,
      left: nullableText,
      right: nullableText,
      result: nullableCodec(result),
      observability,
    });
    // SAFETY: each captured operator calls a strict, total public text-pair routine.
    return call as StrictTextPair<Value>;
  }
  const show = createSqlFunction({
    ...common,
    name: "show_trgm",
    member: "routine:$extension:pg_trgm.show_trgm(pg_catalog.text)",
    arguments: [nullableText] as const,
    result: nullableCodec(trigramsCodec),
    observability: "tables",
  });
  // SAFETY: show_trgm is strict and returns a non-NULL text array for every non-NULL text input, including empty text.
  const showTrigrams = show as StrictText<string[]>;
  const functions = Object.freeze({
    similarity: pair("similarity", scoreCodec, "tables"),
    word_similarity: pair("word_similarity", scoreCodec, "tables"),
    strict_word_similarity: pair("strict_word_similarity", scoreCodec, "tables"),
    similarity_dist: pair("similarity_dist", scoreCodec, "tables"),
    word_similarity_dist_op: pair("word_similarity_dist_op", scoreCodec, "tables"),
    word_similarity_dist_commutator_op: pair("word_similarity_dist_commutator_op", scoreCodec, "tables"),
    strict_word_similarity_dist_op: pair("strict_word_similarity_dist_op", scoreCodec, "tables"),
    strict_word_similarity_dist_commutator_op: pair("strict_word_similarity_dist_commutator_op", scoreCodec, "tables"),
    similarity_op: pair("similarity_op", booleanCodec, "session"),
    word_similarity_op: pair("word_similarity_op", booleanCodec, "session"),
    word_similarity_commutator_op: pair("word_similarity_commutator_op", booleanCodec, "session"),
    strict_word_similarity_op: pair("strict_word_similarity_op", booleanCodec, "session"),
    strict_word_similarity_commutator_op: pair("strict_word_similarity_commutator_op", booleanCodec, "session"),
    show_trgm: showTrigrams,
    show_limit: createSqlFunction({
      ...common,
      name: "show_limit",
      member: "routine:$extension:pg_trgm.show_limit()",
      arguments: [] as const,
      result: scoreCodec,
      observability: "session",
    }),
  });
  const operators = Object.freeze({
    "%": operator("%", booleanCodec, "session"),
    "<%": operator("<%", booleanCodec, "session"),
    "%>": operator("%>", booleanCodec, "session"),
    "<<%": operator("<<%", booleanCodec, "session"),
    "%>>": operator("%>>", booleanCodec, "session"),
    "<->": operator("<->", scoreCodec, "tables"),
    "<<->": operator("<<->", scoreCodec, "tables"),
    "<->>": operator("<->>", scoreCodec, "tables"),
    "<<<->": operator("<<<->", scoreCodec, "tables"),
    "<->>>": operator("<->>>", scoreCodec, "tables"),
  });
  function index(method: "gin" | "gist", opclass: "gin_trgm_ops" | "gist_trgm_ops"): ExtensionIndexContract {
    return Object.freeze({
      name: "pg_trgm",
      version: "1.6",
      schema: descriptor.schema,
      digest,
      member: `opclass:$extension:pg_trgm.${opclass}/${method}`,
      method,
      opclass,
      type: "text",
      input: Object.freeze({ schema: "pg_catalog", type: "text", dimensions: 0 }),
    });
  }
  return bindExtension(descriptor, {
    similarity: functions.similarity,
    wordSimilarity: functions.word_similarity,
    strictWordSimilarity: functions.strict_word_similarity,
    showTrigrams,
    distance: operators["<->"],
    wordDistance: operators["<<->"],
    strictWordDistance: operators["<<<->"],
    similar: operators["%"],
    wordSimilar: operators["<%"],
    strictWordSimilar: operators["<<%"],
    sql: Object.freeze({ functions, operators }),
    indexes: Object.freeze({
      gin: () => index("gin", "gin_trgm_ops"),
      gist: (options: { readonly siglen?: number } = {}): ExtensionIndexContract => {
        const checked = v.parse(
          v.strictObject({ siglen: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2024))) }),
          options,
        );
        const contract = index("gist", "gist_trgm_ops");
        return checked.siglen === undefined
          ? contract
          : Object.freeze({ ...contract, options: Object.freeze({ siglen: checked.siglen }) });
      },
    }),
  });
}
