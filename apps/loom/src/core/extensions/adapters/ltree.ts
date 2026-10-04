import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { binaryCodec, booleanCodec, integerCodec, nullableCodec, textCodec, type ExtensionCodec } from "../codecs";
import { int4Codec } from "../native-codecs";
import { createExtensionField, createExtensionIndex, type ExtensionValueSchema } from "../fields";
import { createSqlFunction, createSqlOperator } from "../sql";
import { createLtreeCodec } from "../ltree-codec";
import { createLqueryCodec, createLtxtqueryCodec } from "../ltree-query-codecs";
import { createLqueryArrayCodec, createLtreeArrayCodec, createLtxtqueryArrayCodec } from "../ltree-array-codecs";
export { ltree, type Ltree } from "../ltree-codec";
export { lquery, ltxtquery, type Lquery, type Ltxtquery } from "../ltree-query-codecs";
export type { PostgreSqlArray } from "../codecs";

type AnyCodec = ExtensionCodec<never, unknown>;
const digest = "f0d5b39c468e80a8748a7a35ed30af0e530da547c2c15ebcaee307e34090c82e";
type Descriptor = ExtensionDescriptor<"ltree", { readonly version: "1.3"; readonly schema: string }>;
const L = "$extension:ltree.ltree",
  LA = "$extension:ltree._ltree",
  Q = "$extension:ltree.lquery",
  QA = "$extension:ltree._lquery",
  T = "$extension:ltree.ltxtquery",
  TEXT = "pg_catalog.text",
  INT4 = "pg_catalog.int4";

/**
 * Exact ltree 1.3 paths, lquery and ltxtquery over the selected schema. PostgreSQL owns label grammar, locale-dependent
 * label characters, case folding of `@` modifiers, the 1000-character label and 65535-level limits, and array checks:
 * array operands must be one-dimensional and NULL-free, or the backend raises.
 */
export function createLtree_1_3<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "ltree" ||
    descriptor.version !== "1.3" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("ltree 1.3 requires its exact verified contract");
  const pathCodec = createLtreeCodec(descriptor.schema),
    queryCodec = createLqueryCodec(descriptor.schema),
    textQueryCodec = createLtxtqueryCodec(descriptor.schema),
    pathArrayCodec = createLtreeArrayCodec(descriptor.schema),
    queryArrayCodec = createLqueryArrayCodec(descriptor.schema),
    textQueryArrayCodec = createLtxtqueryArrayCodec(descriptor.schema);
  const path = nullableCodec(pathCodec),
    query = nullableCodec(queryCodec),
    textQuery = nullableCodec(textQueryCodec),
    paths = nullableCodec(pathArrayCodec),
    queries = nullableCodec(queryArrayCodec),
    bool = nullableCodec(booleanCodec),
    int4 = nullableCodec(int4Codec),
    int8 = nullableCodec(integerCodec),
    text = nullableCodec(textCodec),
    bytes = nullableCodec(binaryCodec);
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const routine = <const Arguments extends readonly AnyCodec[], Result extends AnyCodec>(
    name: string,
    signature: string,
    arguments_: Arguments,
    result: Result,
  ) =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:ltree.${name}(${signature})`,
      arguments: arguments_,
      result,
    });
  const operator = <Left extends AnyCodec, Right extends AnyCodec, Result extends AnyCodec>(
    name: string,
    signature: string,
    left: Left,
    right: Right,
    result: Result,
  ) =>
    createSqlOperator({
      ...base,
      name,
      member: `operator:$extension:ltree.${name}(${signature})`,
      left,
      right,
      result,
    });

  const pathPair = `${L},${L}`;
  const comparison = (name: "<" | "<=" | "<>" | "=" | ">" | ">=") => operator(name, pathPair, path, path, bool);
  /** `^`-prefixed spellings run the same procedures but are never index-assisted. */
  const ancestry = (name: "@>" | "<@" | "^@>" | "^<@") =>
    Object.freeze({
      [`ltree,ltree`]: operator(name, pathPair, path, path, bool),
      [`ltree,_ltree`]: operator(name, `${L},${LA}`, path, paths, bool),
      [`_ltree,ltree`]: operator(name, `${LA},${L}`, paths, path, bool),
    } as const);
  const lqueryMatch = (name: "~" | "^~") =>
    Object.freeze({
      [`ltree,lquery`]: operator(name, `${L},${Q}`, path, query, bool),
      [`lquery,ltree`]: operator(name, `${Q},${L}`, query, path, bool),
      [`_ltree,lquery`]: operator(name, `${LA},${Q}`, paths, query, bool),
      [`lquery,_ltree`]: operator(name, `${Q},${LA}`, query, paths, bool),
    } as const);
  const lqueryAny = (name: "?" | "^?") =>
    Object.freeze({
      [`ltree,_lquery`]: operator(name, `${L},${QA}`, path, queries, bool),
      [`_lquery,ltree`]: operator(name, `${QA},${L}`, queries, path, bool),
      [`_ltree,_lquery`]: operator(name, `${LA},${QA}`, paths, queries, bool),
      [`_lquery,_ltree`]: operator(name, `${QA},${LA}`, queries, paths, bool),
    } as const);
  const textSearch = (name: "@" | "^@") =>
    Object.freeze({
      [`ltree,ltxtquery`]: operator(name, `${L},${T}`, path, textQuery, bool),
      [`ltxtquery,ltree`]: operator(name, `${T},${L}`, textQuery, path, bool),
      [`_ltree,ltxtquery`]: operator(name, `${LA},${T}`, paths, textQuery, bool),
      [`ltxtquery,_ltree`]: operator(name, `${T},${LA}`, textQuery, paths, bool),
    } as const);
  const operators = Object.freeze({
    "<": comparison("<"),
    "<=": comparison("<="),
    "<>": comparison("<>"),
    "=": comparison("="),
    ">": comparison(">"),
    ">=": comparison(">="),
    "@>": ancestry("@>"),
    "<@": ancestry("<@"),
    "^@>": ancestry("^@>"),
    "^<@": ancestry("^<@"),
    "~": lqueryMatch("~"),
    "^~": lqueryMatch("^~"),
    "?": lqueryAny("?"),
    "^?": lqueryAny("^?"),
    "@": textSearch("@"),
    "^@": textSearch("^@"),
    /** First array element, in array order, that is an ancestor of the path; NULL when none. */
    "?@>": operator("?@>", `${LA},${L}`, paths, path, path),
    /** First array element that is a descendant of the path; NULL when none. */
    "?<@": operator("?<@", `${LA},${L}`, paths, path, path),
    /** First array element matching the lquery; NULL when none. */
    "?~": operator("?~", `${LA},${Q}`, paths, query, path),
    /** First array element matching the ltxtquery; NULL when none. */
    "?@": operator("?@", `${LA},${T}`, paths, textQuery, path),
    "||": Object.freeze({
      "ltree,ltree": operator("||", pathPair, path, path, path),
      "ltree,text": operator("||", `${L},${TEXT}`, path, text, path),
      "text,ltree": operator("||", `${TEXT},${L}`, text, path, path),
    }),
  });

  const ltreeEq = routine("ltree_eq", pathPair, [path, path] as const, bool),
    ltreeNe = routine("ltree_ne", pathPair, [path, path] as const, bool),
    ltreeLt = routine("ltree_lt", pathPair, [path, path] as const, bool),
    ltreeLe = routine("ltree_le", pathPair, [path, path] as const, bool),
    ltreeGt = routine("ltree_gt", pathPair, [path, path] as const, bool),
    ltreeGe = routine("ltree_ge", pathPair, [path, path] as const, bool);
  const ltreeCmp = routine("ltree_cmp", pathPair, [path, path] as const, int4);
  const ltreeIsparent = routine("ltree_isparent", pathPair, [path, path] as const, bool),
    ltreeRisparent = routine("ltree_risparent", pathPair, [path, path] as const, bool);
  const ltqRegex = routine("ltq_regex", `${L},${Q}`, [path, query] as const, bool),
    ltqRregex = routine("ltq_rregex", `${Q},${L}`, [query, path] as const, bool),
    ltQRegex = routine("lt_q_regex", `${L},${QA}`, [path, queries] as const, bool),
    ltQRregex = routine("lt_q_rregex", `${QA},${L}`, [queries, path] as const, bool),
    ltxtqExec = routine("ltxtq_exec", `${L},${T}`, [path, textQuery] as const, bool),
    ltxtqRexec = routine("ltxtq_rexec", `${T},${L}`, [textQuery, path] as const, bool);
  const arrayIsparent = routine("_ltree_isparent", `${LA},${L}`, [paths, path] as const, bool),
    arrayRisparent = routine("_ltree_risparent", `${LA},${L}`, [paths, path] as const, bool),
    arrayRIsparent = routine("_ltree_r_isparent", `${L},${LA}`, [path, paths] as const, bool),
    arrayRRisparent = routine("_ltree_r_risparent", `${L},${LA}`, [path, paths] as const, bool),
    arrayLtqRegex = routine("_ltq_regex", `${LA},${Q}`, [paths, query] as const, bool),
    arrayLtqRregex = routine("_ltq_rregex", `${Q},${LA}`, [query, paths] as const, bool),
    arrayLtQRegex = routine("_lt_q_regex", `${LA},${QA}`, [paths, queries] as const, bool),
    arrayLtQRregex = routine("_lt_q_rregex", `${QA},${LA}`, [queries, paths] as const, bool),
    arrayLtxtqExec = routine("_ltxtq_exec", `${LA},${T}`, [paths, textQuery] as const, bool),
    arrayLtxtqRexec = routine("_ltxtq_rexec", `${T},${LA}`, [textQuery, paths] as const, bool);
  const extractIsparent = routine("_ltree_extract_isparent", `${LA},${L}`, [paths, path] as const, path),
    extractRisparent = routine("_ltree_extract_risparent", `${LA},${L}`, [paths, path] as const, path),
    extractRegex = routine("_ltq_extract_regex", `${LA},${Q}`, [paths, query] as const, path),
    extractExec = routine("_ltxtq_extract_exec", `${LA},${T}`, [paths, textQuery] as const, path);
  const addltree = routine("ltree_addltree", pathPair, [path, path] as const, path),
    addtext = routine("ltree_addtext", `${L},${TEXT}`, [path, text] as const, path),
    textadd = routine("ltree_textadd", `${TEXT},${L}`, [text, path] as const, path);
  const nlevel = routine("nlevel", L, [path] as const, int4);
  /** Zero-based [start, end); PostgreSQL raises "invalid positions" outside the path. */
  const subltree = routine("subltree", `${L},${INT4},${INT4}`, [path, int4, int4] as const, path);
  const subpathFrom = routine("subpath", `${L},${INT4}`, [path, int4] as const, path),
    subpathLength = routine("subpath", `${L},${INT4},${INT4}`, [path, int4, int4] as const, path);
  /** Negative offset counts from the end, negative length leaves that many labels off the end. */
  const subpath = (...values: Parameters<typeof subpathFrom> | Parameters<typeof subpathLength>) =>
    values.length === 2 ? subpathFrom(...values) : subpathLength(...values);
  const indexOf = routine("index", pathPair, [path, path] as const, int4),
    indexFrom = routine("index", `${pathPair},${INT4}`, [path, path, int4] as const, int4);
  /** Position of the first occurrence, or -1; a negative offset starts that many labels from the end. */
  const index = (...values: Parameters<typeof indexOf> | Parameters<typeof indexFrom>) =>
    values.length === 2 ? indexOf(...values) : indexFrom(...values);
  const text2ltree = routine("text2ltree", TEXT, [text] as const, path),
    ltree2text = routine("ltree2text", L, [path] as const, text),
    hashLtree = routine("hash_ltree", L, [path] as const, int4),
    hashLtreeExtended = routine("hash_ltree_extended", `${L},pg_catalog.int8`, [path, int8] as const, int8);
  const lcaPaths = (count: number) => Array.from({ length: count }, () => L).join(",");
  const lca2 = routine("lca", lcaPaths(2), [path, path] as const, path),
    lca3 = routine("lca", lcaPaths(3), [path, path, path] as const, path),
    lca4 = routine("lca", lcaPaths(4), [path, path, path, path] as const, path),
    lca5 = routine("lca", lcaPaths(5), [path, path, path, path, path] as const, path),
    lca6 = routine("lca", lcaPaths(6), [path, path, path, path, path, path] as const, path),
    lca7 = routine("lca", lcaPaths(7), [path, path, path, path, path, path, path] as const, path),
    lca8 = routine("lca", lcaPaths(8), [path, path, path, path, path, path, path, path] as const, path),
    lcaArray = routine("lca", LA, [paths] as const, path);
  /** Longest common ancestor of 2-8 paths. A path is not its own ancestor, no shared label yields '', and all-empty paths yield NULL. */
  function lca(...values: Parameters<typeof lca2>): ReturnType<typeof lca2>;
  function lca(...values: Parameters<typeof lca3>): ReturnType<typeof lca3>;
  function lca(...values: Parameters<typeof lca4>): ReturnType<typeof lca4>;
  function lca(...values: Parameters<typeof lca5>): ReturnType<typeof lca5>;
  function lca(...values: Parameters<typeof lca6>): ReturnType<typeof lca6>;
  function lca(...values: Parameters<typeof lca7>): ReturnType<typeof lca7>;
  function lca(...values: Parameters<typeof lca8>): ReturnType<typeof lca8>;
  function lca(...values: Parameters<typeof lca2>[number][]) {
    const overloads = [lca2, lca3, lca4, lca5, lca6, lca7, lca8] as const;
    const selected = overloads[values.length - 2];
    if (!selected) throw new Error("ltree lca accepts 2 to 8 paths; use lcaArray for more");
    // SAFETY: The public overloads fix each arity to the matching captured routine signature.
    return (selected as (...input: typeof values) => ReturnType<typeof lca2>)(...values);
  }
  const functions = Object.freeze({
    lquery_send: routine("lquery_send", Q, [query] as const, bytes),
    ltree_send: routine("ltree_send", L, [path] as const, bytes),
    ltxtq_send: routine("ltxtq_send", T, [textQuery] as const, bytes),
    _lt_q_regex: arrayLtQRegex,
    _lt_q_rregex: arrayLtQRregex,
    _ltq_extract_regex: extractRegex,
    _ltq_regex: arrayLtqRegex,
    _ltq_rregex: arrayLtqRregex,
    _ltree_extract_isparent: extractIsparent,
    _ltree_extract_risparent: extractRisparent,
    _ltree_isparent: arrayIsparent,
    _ltree_r_isparent: arrayRIsparent,
    _ltree_r_risparent: arrayRRisparent,
    _ltree_risparent: arrayRisparent,
    _ltxtq_exec: arrayLtxtqExec,
    _ltxtq_extract_exec: extractExec,
    _ltxtq_rexec: arrayLtxtqRexec,
    hash_ltree: hashLtree,
    hash_ltree_extended: hashLtreeExtended,
    index: Object.freeze({ path: indexOf, offset: indexFrom }),
    lca: Object.freeze({ 2: lca2, 3: lca3, 4: lca4, 5: lca5, 6: lca6, 7: lca7, 8: lca8, array: lcaArray }),
    lt_q_regex: ltQRegex,
    lt_q_rregex: ltQRregex,
    ltq_regex: ltqRegex,
    ltq_rregex: ltqRregex,
    ltree2text,
    ltree_addltree: addltree,
    ltree_addtext: addtext,
    ltree_cmp: ltreeCmp,
    ltree_eq: ltreeEq,
    ltree_ge: ltreeGe,
    ltree_gt: ltreeGt,
    ltree_isparent: ltreeIsparent,
    ltree_le: ltreeLe,
    ltree_lt: ltreeLt,
    ltree_ne: ltreeNe,
    ltree_risparent: ltreeRisparent,
    ltree_textadd: textadd,
    ltxtq_exec: ltxtqExec,
    ltxtq_rexec: ltxtqRexec,
    nlevel,
    subltree,
    subpath: Object.freeze({ offset: subpathFrom, length: subpathLength }),
    text2ltree,
  });

  const pathValue: ExtensionValueSchema = { kind: "string" };
  const dimension: ExtensionValueSchema = {
    kind: "object",
    properties: {
      lowerBound: { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 },
      length: { kind: "number", integer: true, minimum: 1, maximum: 2147483647 },
    },
  };
  /** Native ranks 0-6 with NULL leaves, as stored by `ltree[]`, `lquery[]` and `ltxtquery[]` columns. */
  const nativeArrayValue: ExtensionValueSchema = (() => {
    let nested: ExtensionValueSchema = { kind: "union", variants: [pathValue, { kind: "null" }] };
    const depths: ExtensionValueSchema[] = [];
    for (let rank = 0; rank < 6; rank++) {
      nested = { kind: "array", items: nested };
      depths.push(nested);
    }
    return {
      kind: "object",
      properties: { dimensions: { kind: "array", items: dimension }, values: { kind: "union", variants: depths } },
    };
  })();
  /** Empty or one-dimensional NULL-free paths: the only arrays gist__ltree_ops and the array operators accept. */
  const pathSetValue: ExtensionValueSchema = {
    kind: "union",
    variants: [
      {
        kind: "object",
        properties: {
          dimensions: { kind: "array", items: dimension, length: 0 },
          values: { kind: "array", items: pathValue, length: 0 },
        },
      },
      {
        kind: "object",
        properties: {
          dimensions: { kind: "array", items: dimension, length: 1 },
          values: { kind: "array", items: pathValue },
        },
      },
    ],
  };
  const fieldOperator = (name: "<" | "<=" | "<>" | "=" | ">" | ">=") => ({
    member: `operator:$extension:ltree.${name}(${pathPair})`,
    schema: descriptor.schema,
    name,
    operand: "field" as const,
  });
  const unsearched = { filter: false, comparison: false, order: false, text: false } as const;
  /** Native `ltree` column; equality and ordering use ltree_ops (label-by-label, then shorter first). */
  const field = () =>
    createExtensionField({
      extension: descriptor,
      member: `type:${L}`,
      type: "ltree",
      codec: pathCodec,
      value: pathValue,
      search: { filter: true, comparison: true, order: true, text: false } as const,
      operators: {
        eq: fieldOperator("="),
        ne: fieldOperator("<>"),
        gt: fieldOperator(">"),
        gte: fieldOperator(">="),
        lt: fieldOperator("<"),
        lte: fieldOperator("<="),
      },
    });
  const arrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: `type:${LA}`,
      type: "ltree",
      array: true,
      codec: pathArrayCodec,
      value: nativeArrayValue,
      search: unsearched,
    });
  /** `ltree[]` declared one-dimensional and NULL-free so indexes.arrayGist() accepts it. */
  const pathSetField = () =>
    createExtensionField({
      extension: descriptor,
      member: `type:${LA}`,
      type: "ltree",
      array: true,
      codec: pathArrayCodec,
      value: pathSetValue,
      search: unsearched,
    });
  const queryField = () =>
    createExtensionField({
      extension: descriptor,
      member: `type:${Q}`,
      type: "lquery",
      codec: queryCodec,
      value: pathValue,
      search: unsearched,
    });
  const queryArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: `type:${QA}`,
      type: "lquery",
      array: true,
      codec: queryArrayCodec,
      value: nativeArrayValue,
      search: unsearched,
    });
  const textQueryField = () =>
    createExtensionField({
      extension: descriptor,
      member: `type:${T}`,
      type: "ltxtquery",
      codec: textQueryCodec,
      value: pathValue,
      search: unsearched,
    });
  const textQueryArrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:ltree._ltxtquery",
      type: "ltxtquery",
      array: true,
      codec: textQueryArrayCodec,
      value: nativeArrayValue,
      search: unsearched,
    });
  const operatorClass = (
    method: "btree" | "hash" | "gist",
    opclass: "ltree_ops" | "hash_ltree_ops" | "gist_ltree_ops" | "gist__ltree_ops",
    siglen?: number,
  ) =>
    Object.freeze({
      ...createExtensionIndex({
        extension: descriptor,
        member: `opclass:$extension:ltree.${opclass}/${method}`,
        method,
        opclass,
        type: "ltree",
        default: true,
        ...(siglen !== undefined && { options: { siglen } }),
      }),
      input: Object.freeze({
        schema: descriptor.schema,
        type: "ltree",
        dimensions: opclass === "gist__ltree_ops" ? 1 : 0,
      }),
      ...(opclass === "gist__ltree_ops" && { nullFreeElements: true }),
    });
  return bindExtension(descriptor, {
    codec: pathCodec,
    queryCodec,
    textQueryCodec,
    arrayCodec: pathArrayCodec,
    queryArrayCodec,
    textQueryArrayCodec,
    field,
    arrayField,
    pathSetField,
    queryField,
    queryArrayField,
    textQueryField,
    textQueryArrayField,
    equal: operators["="],
    notEqual: operators["<>"],
    lessThan: operators["<"],
    lessOrEqual: operators["<="],
    greaterThan: operators[">"],
    greaterOrEqual: operators[">="],
    compare: ltreeCmp,
    /** `left @> right`: left is an ancestor of, or equal to, right. */
    isAncestor: operators["@>"]["ltree,ltree"],
    /** `left <@ right`: left is a descendant of, or equal to, right. */
    isDescendant: operators["<@"]["ltree,ltree"],
    /** `paths @> path`: some element is an ancestor of path. Not in gist__ltree_ops, so never index-assisted. */
    anyAncestor: operators["@>"]["_ltree,ltree"],
    /** `paths <@ path`: some element is a descendant of path; index-assisted by indexes.arrayGist(). */
    anyDescendant: operators["<@"]["_ltree,ltree"],
    matches: operators["~"]["ltree,lquery"],
    anyMatches: operators["~"]["_ltree,lquery"],
    matchesAny: operators["?"]["ltree,_lquery"],
    anyMatchesAny: operators["?"]["_ltree,_lquery"],
    search: operators["@"]["ltree,ltxtquery"],
    anySearch: operators["@"]["_ltree,ltxtquery"],
    firstAncestor: operators["?@>"],
    firstDescendant: operators["?<@"],
    firstMatch: operators["?~"],
    firstSearch: operators["?@"],
    concat: operators["||"]["ltree,ltree"],
    append: operators["||"]["ltree,text"],
    prepend: operators["||"]["text,ltree"],
    nlevel,
    subltree,
    subpath,
    index,
    lca,
    lcaArray,
    fromText: text2ltree,
    toText: ltree2text,
    hash: hashLtree,
    hashExtended: hashLtreeExtended,
    sql: Object.freeze({ functions, operators }),
    indexes: Object.freeze({
      btree: () => operatorClass("btree", "ltree_ops"),
      hash: () => operatorClass("hash", "hash_ltree_ops"),
      /** siglen is the signature length in bytes; PostgreSQL accepts multiples of 4 from 4 to 2024. */
      gist: (options: { readonly siglen?: number } = {}) => operatorClass("gist", "gist_ltree_ops", options.siglen),
      /** For pathSetField(); siglen is 1 to 2024 bytes. */
      arrayGist: (options: { readonly siglen?: number } = {}) =>
        operatorClass("gist", "gist__ltree_ops", options.siglen),
    }),
  });
}
