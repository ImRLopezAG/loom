import * as v from "valibot";
import { sql } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { nullableCodec, textCodec, withCodecSqlType } from "../codecs";
import { createExtensionField, type ExtensionIndexContract } from "../fields";
import {
  checkedExtensionExpression,
  createSqlFunction,
  createSqlOperator,
} from "../sql";
import {
  bm25QueryTsvectorArrayCodec,
  bm25QueryTsvectorArrayValue,
  bm25QueryTsvectorCodec,
  bm25QueryTsvectorValue,
  lakebaseTextFieldSearch,
  lakebaseTextFloat8Codec,
  lakebaseTextRegclassCodec,
  tsvectorCodec,
} from "./lakebase-text-codecs";

export {
  bm25QueryTsvectorArrayCodec,
  bm25QueryTsvectorCodec,
  lakebaseTextFloat8Codec,
  lakebaseTextRegclassCodec,
  tsvectorCodec,
} from "./lakebase-text-codecs";
export type { Bm25QueryTsvector } from "./lakebase-text-codecs";

const digest = "d565a607c3901c0b31f02d59f300ae0b3cf3b5c77bcdf7d06822489fc2d9f6fb";
type Descriptor = ExtensionDescriptor<"lakebase_text", { readonly version: "0.1.3"; readonly schema: string }>;
const storageParameters = v.strictObject({
  k1: v.optional(v.pipe(v.number(), v.finite(), v.minValue(1.2), v.maxValue(2))),
  b: v.optional(v.pipe(v.number(), v.finite(), v.minValue(0), v.maxValue(1))),
  default_limit: v.optional(v.pipe(v.number(), v.safeInteger(), v.minValue(1), v.maxValue(65535))),
  prefilter: v.optional(v.boolean()),
});
const defaultLimit = v.pipe(v.number(), v.safeInteger(), v.minValue(1), v.maxValue(65535));
export type LakebaseTextStorage = v.InferInput<typeof storageParameters>;

function sessionSql(member: string, statement: string) {
  return checkedExtensionExpression(sql.raw(statement), textCodec, [], undefined, member, "session");
}

/** Exact lakebase_text 0.1.3 BM25 query, rank, index and transaction-local GUC APIs. */
export function createLakebaseText_0_1_3<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "lakebase_text" ||
    descriptor.version !== "0.1.3" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("lakebase_text 0.1.3 requires its exact verified contract");
  const queryCodec = withCodecSqlType(bm25QueryTsvectorCodec, {
    schema: descriptor.schema,
    name: "bm25query_tsvector",
  });
  const queryArrayCodec = withCodecSqlType(bm25QueryTsvectorArrayCodec, {
    schema: descriptor.schema,
    name: "bm25query_tsvector",
    array: true,
  });
  const common = { schema: descriptor.schema, dependencies: [], authority: "query" as const };
  const to_bm25query = createSqlFunction({
    ...common,
    name: "to_bm25query",
    member: "routine:$extension:lakebase_text.to_bm25query(pg_catalog.tsvector,pg_catalog.regclass)",
    arguments: [nullableCodec(tsvectorCodec), nullableCodec(lakebaseTextRegclassCodec)] as const,
    result: queryCodec,
    observability: "tables",
  });
  const rank = createSqlOperator({
    ...common,
    name: "<@>",
    member: "operator:$extension:lakebase_text.<@>(pg_catalog.tsvector,$extension:lakebase_text.bm25query_tsvector)",
    left: nullableCodec(tsvectorCodec),
    right: nullableCodec(queryCodec),
    result: nullableCodec(lakebaseTextFloat8Codec),
    observability: "tables",
  });
  const _lakebase_bm25_evaluate_tsvector = createSqlFunction({
    ...common,
    name: "_lakebase_bm25_evaluate_tsvector",
    member:
      "routine:$extension:lakebase_text._lakebase_bm25_evaluate_tsvector(pg_catalog.tsvector,$extension:lakebase_text.bm25query_tsvector)",
    arguments: [nullableCodec(tsvectorCodec), nullableCodec(queryCodec)] as const,
    result: nullableCodec(lakebaseTextFloat8Codec),
    observability: "tables",
  });
  const lakebase_bm25_index_info = createSqlFunction({
    ...common,
    name: "lakebase_bm25_index_info",
    member: "routine:$extension:lakebase_text.lakebase_bm25_index_info(pg_catalog.regclass)",
    arguments: [nullableCodec(lakebaseTextRegclassCodec)] as const,
    result: nullableCodec(textCodec),
    observability: "external",
  });
  const _lakebase_bm25_support_tsvector_bm25_ops = createSqlFunction({
    ...common,
    name: "_lakebase_bm25_support_tsvector_bm25_ops",
    member: "routine:$extension:lakebase_text._lakebase_bm25_support_tsvector_bm25_ops()",
    arguments: [] as const,
    result: nullableCodec(textCodec),
    observability: "tables",
  });
  function index(format: "current" | "v0" = "current"): ExtensionIndexContract {
    const method = format === "v0" ? "lakebase_bm25v0" : "lakebase_bm25";
    return Object.freeze({
      name: "lakebase_text",
      version: "0.1.3",
      schema: descriptor.schema,
      digest,
      member: `opclass:$extension:lakebase_text.tsvector_bm25_ops/${method}`,
      method,
      opclass: "tsvector_bm25_ops",
      type: "tsvector",
      default: true,
      input: Object.freeze({ schema: "pg_catalog", type: "tsvector", dimensions: 0 }),
    });
  }
  function storage(options: LakebaseTextStorage): Readonly<Record<string, string | number | boolean>> {
    const checked = v.parse(storageParameters, options);
    return Object.freeze({
      ...(checked.k1 !== undefined && { k1: checked.k1 }),
      ...(checked.b !== undefined && { b: checked.b }),
      ...(checked.default_limit !== undefined && { default_limit: checked.default_limit }),
      ...(checked.prefilter !== undefined && { prefilter: checked.prefilter }),
    });
  }
  const accessMethod = (name: "lakebase_bm25" | "lakebase_bm25v0", handler: string) =>
    Object.freeze({
      member: `access method:${name}`,
      name,
      handler,
      strategies: Object.freeze(["<@>"] as const),
    });
  return bindExtension(descriptor, {
    toBm25Query: to_bm25query,
    rank,
    evaluate: _lakebase_bm25_evaluate_tsvector,
    support: _lakebase_bm25_support_tsvector_bm25_ops,
    indexInfo: lakebase_bm25_index_info,
    sql: Object.freeze({
      functions: Object.freeze({
        to_bm25query,
        _lakebase_bm25_evaluate_tsvector,
        _lakebase_bm25_support_tsvector_bm25_ops,
        lakebase_bm25_index_info,
      }),
      operators: Object.freeze({ "<@>": rank }),
    }),
    fields: Object.freeze({
      bm25Query: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:lakebase_text.bm25query_tsvector",
          type: "bm25query_tsvector",
          codec: queryCodec,
          value: bm25QueryTsvectorValue,
          search: lakebaseTextFieldSearch,
        }),
      bm25QueryArray: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:lakebase_text._bm25query_tsvector",
          type: "bm25query_tsvector",
          codec: queryArrayCodec,
          array: true,
          value: bm25QueryTsvectorArrayValue,
          search: lakebaseTextFieldSearch,
        }),
    }),
    indexes: Object.freeze({
      tsvector: (options: { readonly format?: "current" | "v0" } = {}) => index(options.format ?? "current"),
    }),
    storage,
    accessMethods: Object.freeze({
      lakebase_bm25: accessMethod(
        "lakebase_bm25",
        "routine:$extension:lakebase_text.lakebase_bm25_amhandler(pg_catalog.internal)",
      ),
      lakebase_bm25v0: accessMethod(
        "lakebase_bm25v0",
        "routine:$extension:lakebase_text.lakebase_bm25v0_amhandler(pg_catalog.internal)",
      ),
    }),
    session: Object.freeze({
      defaultLimit: (limit: number) =>
        sessionSql("session:lakebase_bm25.default_limit", `set local lakebase_bm25.default_limit to ${v.parse(defaultLimit, limit)}`),
      prefilter: (enabled: boolean) =>
        sessionSql(
          "session:lakebase_bm25.prefilter",
          `set local lakebase_bm25.prefilter to ${v.parse(v.boolean(), enabled) ? "on" : "off"}`,
        ),
      enableScan: (enabled: boolean) =>
        sessionSql(
          "session:lakebase_bm25.enable_scan",
          `set local lakebase_bm25.enable_scan to ${v.parse(v.boolean(), enabled) ? "on" : "off"}`,
        ),
    }),
    tooling: Object.freeze({
      reindexConcurrently: Object.freeze({
        member: "tooling:REINDEX INDEX CONCURRENTLY",
        authority: "operator" as const,
      }),
      indexFormat: Object.freeze({
        current: "lakebase_bm25",
        legacy: "lakebase_bm25v0",
        upgrade: "REINDEX INDEX CONCURRENTLY",
        transactional: false,
      }),
    }),
  });
}
