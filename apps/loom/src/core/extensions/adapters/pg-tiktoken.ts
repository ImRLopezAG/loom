import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { arrayCodec, integerCodec, nullableCodec, textCodec } from "../codecs";
import { createSqlFunction } from "../sql";

/** Selectors are PostgreSQL text: available model aliases depend on the installed tokenizer build. */
export function createPgTiktoken_0_0_1<
  const Descriptor extends ExtensionDescriptor<"pg_tiktoken", { version: "0.0.1"; schema: string }>,
>(descriptor: Descriptor) {
  const text = nullableCodec(textCodec);
  // Upstream embeds encoder vocabularies and model mappings. The provider build's
  // source/encoding environment is not yet pinned, so subscriptions cannot infer
  // table-only determinism from its VOLATILE catalogue label or an upstream branch.
  const base = {
    schema: descriptor.schema,
    dependencies: [],
    observability: "external",
    authority: "query",
    arguments: [text, text] as const,
  } as const;
  const count = createSqlFunction({
    ...base,
    name: "tiktoken_count",
    member: "routine:$extension:pg_tiktoken.tiktoken_count(pg_catalog.text,pg_catalog.text)",
    result: nullableCodec(integerCodec),
  });
  const encode = createSqlFunction({
    ...base,
    name: "tiktoken_encode",
    member: "routine:$extension:pg_tiktoken.tiktoken_encode(pg_catalog.text,pg_catalog.text)",
    result: nullableCodec(arrayCodec(integerCodec)),
  });
  return bindExtension(descriptor, {
    count,
    encode,
    sql: Object.freeze({
      functions: Object.freeze({ tiktoken_count: count, tiktoken_encode: encode }),
      operators: Object.freeze({}),
    }),
  });
}
