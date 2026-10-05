import * as v from "valibot";
import {
  arrayCodec,
  compositeCodec,
  createExtensionCodec,
  floatCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
  type CompositeOutput,
} from "../codecs";

/** Native tsvector text is stored and decoded as PostgreSQL's own textual form. */
export const tsvectorCodec = createExtensionCodec({
  id: "pg:tsvector:text:1",
  sqlType: { schema: "pg_catalog", name: "tsvector" },
  input: v.string(),
  output: v.string(),
  transport: "text",
  encode: (value) => value,
  decode: (value) => v.parse(v.string(), value),
});
/** Bound as qualified-name text; PostgreSQL's regclass input resolves it at execution. */
export const lakebaseTextRegclassCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "regclass" });
/** Captured <@> result is pg_catalog.float8; scoring stays in PostgreSQL. */
export const lakebaseTextFloat8Codec = floatCodec;
export const bm25QueryTsvectorFields = Object.freeze({
  query: nullableCodec(tsvectorCodec),
  index: nullableCodec(lakebaseTextRegclassCodec),
} as const);
export const bm25QueryTsvectorCodec = compositeCodec(
  "lakebase_text:0.1.3:bm25query_tsvector",
  bm25QueryTsvectorFields,
);
export type Bm25QueryTsvector = CompositeOutput<typeof bm25QueryTsvectorFields>;
export const bm25QueryTsvectorArrayCodec = arrayCodec(bm25QueryTsvectorCodec);
export const bm25QueryTsvectorValue = {
  kind: "object",
  properties: {
    query: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
    index: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
  },
} as const;
export const bm25QueryTsvectorArrayValue = { kind: "array", items: bm25QueryTsvectorValue } as const;
export const lakebaseTextFieldSearch = {
  filter: false,
  comparison: false,
  order: false,
  text: false,
} as const;
