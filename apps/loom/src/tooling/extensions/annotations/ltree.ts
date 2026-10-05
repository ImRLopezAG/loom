const evidence = [
  "apps/loom/src/tooling/extensions/manifests/ltree.json",
  "https://www.postgresql.org/docs/18/ltree.html",
  "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/ltree",
  "apps/loom/src/core/extensions/adapters/ltree.ts",
  "packages/tests/unit/extensions-ltree.test.ts: every captured member identity, operator overload SQL and index contracts",
  "packages/tests/types/extensions-ltree.test-d.ts: branded path/query inputs, nullable strict results and overload arity",
  "packages/e2e/integration/extensions-ltree.test.ts: every public routine and operator against native ltree 1.3 on local PostgreSQL 18",
  "packages/e2e/fixtures/ltree-native-characterization.json: direct native calls, including I/O and GiST support rejections",
] as const;
const storage = {
  authority: "query",
  observability: "tables",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
const common = { ...storage, nulls: "NULL for any NULL argument (every captured routine is strict)" } as const;

function query(id: string, reason: string, result: string) {
  return { id, disposition: "query", reason, evidence, semantics: { ...common, result } } as const;
}
function schema(id: string, reason: string) {
  return { id, disposition: "schema", reason, evidence, semantics: storage } as const;
}
function internal(id: string, parent: string) {
  return {
    id,
    disposition: "internal",
    reason:
      "Type I/O, GiST support, selectivity or access-method catalog wiring; reachable only through the owning type, operator or index.",
    evidence,
    semantics: { providerAcceptance: "pending", publicExportAcceptance: "pending", parent },
  } as const;
}

/** Exact ltree 1.3 dispositions for all 191 captured members; acceptance stays pending until host gates. */
export const ltreeAnnotations = [
  internal(
    'function of access method:function 1 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 1 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".hash_ltree_ops USING hash',
    '"$extension:ltree".hash_ltree_ops USING hash',
  ),
  internal(
    'function of access method:function 1 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".ltree_ops USING btree',
    '"$extension:ltree".ltree_ops USING btree',
  ),
  internal(
    'function of access method:function 1 ("$extension:ltree".ltree[], "$extension:ltree".ltree[]) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 10 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 10 ("$extension:ltree".ltree[], "$extension:ltree".ltree[]) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 2 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 2 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".hash_ltree_ops USING hash',
    '"$extension:ltree".hash_ltree_ops USING hash',
  ),
  internal(
    'function of access method:function 2 ("$extension:ltree".ltree[], "$extension:ltree".ltree[]) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 3 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 3 ("$extension:ltree".ltree[], "$extension:ltree".ltree[]) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 4 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 4 ("$extension:ltree".ltree[], "$extension:ltree".ltree[]) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 5 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 5 ("$extension:ltree".ltree[], "$extension:ltree".ltree[]) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 6 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 6 ("$extension:ltree".ltree[], "$extension:ltree".ltree[]) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 7 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'function of access method:function 7 ("$extension:ltree".ltree[], "$extension:ltree".ltree[]) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  schema(
    "opclass:$extension:ltree.gist__ltree_ops/gist",
    "indexes.arrayGist({ siglen }) declares the default gist operator class gist__ltree_ops.",
  ),
  schema(
    "opclass:$extension:ltree.gist_ltree_ops/gist",
    "indexes.gist({ siglen }) declares the default gist operator class gist_ltree_ops.",
  ),
  schema(
    "opclass:$extension:ltree.hash_ltree_ops/hash",
    "indexes.hash() declares the default hash operator class hash_ltree_ops.",
  ),
  schema(
    "opclass:$extension:ltree.ltree_ops/btree",
    "indexes.btree() declares the default btree operator class ltree_ops.",
  ),
  internal(
    'operator of access method:operator 1 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 1 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".hash_ltree_ops USING hash',
    '"$extension:ltree".hash_ltree_ops USING hash',
  ),
  internal(
    'operator of access method:operator 1 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".ltree_ops USING btree',
    '"$extension:ltree".ltree_ops USING btree',
  ),
  internal(
    'operator of access method:operator 10 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 10 ("$extension:ltree".ltree[], "$extension:ltree".ltree) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 11 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 11 ("$extension:ltree".ltree, "$extension:ltree".ltree[]) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 12 ("$extension:ltree".ltree, "$extension:ltree".lquery) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 12 ("$extension:ltree".ltree[], "$extension:ltree".lquery) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 13 ("$extension:ltree".lquery, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 13 ("$extension:ltree".lquery, "$extension:ltree".ltree[]) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 14 ("$extension:ltree".ltree, "$extension:ltree".ltxtquery) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 14 ("$extension:ltree".ltree[], "$extension:ltree".ltxtquery) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 15 ("$extension:ltree".ltxtquery, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 15 ("$extension:ltree".ltxtquery, "$extension:ltree".ltree[]) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 16 ("$extension:ltree".ltree, "$extension:ltree".lquery[]) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 16 ("$extension:ltree".ltree[], "$extension:ltree".lquery[]) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 17 ("$extension:ltree".lquery[], "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 17 ("$extension:ltree".lquery[], "$extension:ltree".ltree[]) of "$extension:ltree".gist__ltree_ops USING gist',
    '"$extension:ltree".gist__ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 2 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 2 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".ltree_ops USING btree',
    '"$extension:ltree".ltree_ops USING btree',
  ),
  internal(
    'operator of access method:operator 3 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 3 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".ltree_ops USING btree',
    '"$extension:ltree".ltree_ops USING btree',
  ),
  internal(
    'operator of access method:operator 4 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 4 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".ltree_ops USING btree',
    '"$extension:ltree".ltree_ops USING btree',
  ),
  internal(
    'operator of access method:operator 5 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".gist_ltree_ops USING gist',
    '"$extension:ltree".gist_ltree_ops USING gist',
  ),
  internal(
    'operator of access method:operator 5 ("$extension:ltree".ltree, "$extension:ltree".ltree) of "$extension:ltree".ltree_ops USING btree',
    '"$extension:ltree".ltree_ops USING btree',
  ),
  query(
    "operator:$extension:ltree.<($extension:ltree.ltree,$extension:ltree.ltree)",
    'sql.operators["<"] emits ltree < ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.<=($extension:ltree.ltree,$extension:ltree.ltree)",
    'sql.operators["<="] emits ltree <= ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.<>($extension:ltree.ltree,$extension:ltree.ltree)",
    'sql.operators["<>"] emits ltree <> ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.<@($extension:ltree._ltree,$extension:ltree.ltree)",
    'sql.operators["<@"]["_ltree,ltree"] emits _ltree <@ ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.<@($extension:ltree.ltree,$extension:ltree._ltree)",
    'sql.operators["<@"]["ltree,_ltree"] emits ltree <@ _ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.<@($extension:ltree.ltree,$extension:ltree.ltree)",
    'sql.operators["<@"]["ltree,ltree"] emits ltree <@ ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.=($extension:ltree.ltree,$extension:ltree.ltree)",
    'sql.operators["="] emits ltree = ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.>($extension:ltree.ltree,$extension:ltree.ltree)",
    'sql.operators[">"] emits ltree > ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.>=($extension:ltree.ltree,$extension:ltree.ltree)",
    'sql.operators[">="] emits ltree >= ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.?($extension:ltree._lquery,$extension:ltree._ltree)",
    'sql.operators["?"]["_lquery,_ltree"] emits _lquery ? _ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.?($extension:ltree._lquery,$extension:ltree.ltree)",
    'sql.operators["?"]["_lquery,ltree"] emits _lquery ? ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.?($extension:ltree._ltree,$extension:ltree._lquery)",
    'sql.operators["?"]["_ltree,_lquery"] emits _ltree ? _lquery schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.?($extension:ltree.ltree,$extension:ltree._lquery)",
    'sql.operators["?"]["ltree,_lquery"] emits ltree ? _lquery schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.?<@($extension:ltree._ltree,$extension:ltree.ltree)",
    'sql.operators["?<@"] emits _ltree ?<@ ltree schema-qualified.',
    "Ltree | null",
  ),
  query(
    "operator:$extension:ltree.?@($extension:ltree._ltree,$extension:ltree.ltxtquery)",
    'sql.operators["?@"] emits _ltree ?@ ltxtquery schema-qualified.',
    "Ltree | null",
  ),
  query(
    "operator:$extension:ltree.?@>($extension:ltree._ltree,$extension:ltree.ltree)",
    'sql.operators["?@>"] emits _ltree ?@> ltree schema-qualified.',
    "Ltree | null",
  ),
  query(
    "operator:$extension:ltree.?~($extension:ltree._ltree,$extension:ltree.lquery)",
    'sql.operators["?~"] emits _ltree ?~ lquery schema-qualified.',
    "Ltree | null",
  ),
  query(
    "operator:$extension:ltree.@($extension:ltree._ltree,$extension:ltree.ltxtquery)",
    'sql.operators["@"]["_ltree,ltxtquery"] emits _ltree @ ltxtquery schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.@($extension:ltree.ltree,$extension:ltree.ltxtquery)",
    'sql.operators["@"]["ltree,ltxtquery"] emits ltree @ ltxtquery schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.@($extension:ltree.ltxtquery,$extension:ltree._ltree)",
    'sql.operators["@"]["ltxtquery,_ltree"] emits ltxtquery @ _ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.@($extension:ltree.ltxtquery,$extension:ltree.ltree)",
    'sql.operators["@"]["ltxtquery,ltree"] emits ltxtquery @ ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.@>($extension:ltree._ltree,$extension:ltree.ltree)",
    'sql.operators["@>"]["_ltree,ltree"] emits _ltree @> ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.@>($extension:ltree.ltree,$extension:ltree._ltree)",
    'sql.operators["@>"]["ltree,_ltree"] emits ltree @> _ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.@>($extension:ltree.ltree,$extension:ltree.ltree)",
    'sql.operators["@>"]["ltree,ltree"] emits ltree @> ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^<@($extension:ltree._ltree,$extension:ltree.ltree)",
    'sql.operators["^<@"]["_ltree,ltree"] emits _ltree ^<@ ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^<@($extension:ltree.ltree,$extension:ltree._ltree)",
    'sql.operators["^<@"]["ltree,_ltree"] emits ltree ^<@ _ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^<@($extension:ltree.ltree,$extension:ltree.ltree)",
    'sql.operators["^<@"]["ltree,ltree"] emits ltree ^<@ ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^?($extension:ltree._lquery,$extension:ltree._ltree)",
    'sql.operators["^?"]["_lquery,_ltree"] emits _lquery ^? _ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^?($extension:ltree._lquery,$extension:ltree.ltree)",
    'sql.operators["^?"]["_lquery,ltree"] emits _lquery ^? ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^?($extension:ltree._ltree,$extension:ltree._lquery)",
    'sql.operators["^?"]["_ltree,_lquery"] emits _ltree ^? _lquery schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^?($extension:ltree.ltree,$extension:ltree._lquery)",
    'sql.operators["^?"]["ltree,_lquery"] emits ltree ^? _lquery schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^@($extension:ltree._ltree,$extension:ltree.ltxtquery)",
    'sql.operators["^@"]["_ltree,ltxtquery"] emits _ltree ^@ ltxtquery schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^@($extension:ltree.ltree,$extension:ltree.ltxtquery)",
    'sql.operators["^@"]["ltree,ltxtquery"] emits ltree ^@ ltxtquery schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^@($extension:ltree.ltxtquery,$extension:ltree._ltree)",
    'sql.operators["^@"]["ltxtquery,_ltree"] emits ltxtquery ^@ _ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^@($extension:ltree.ltxtquery,$extension:ltree.ltree)",
    'sql.operators["^@"]["ltxtquery,ltree"] emits ltxtquery ^@ ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^@>($extension:ltree._ltree,$extension:ltree.ltree)",
    'sql.operators["^@>"]["_ltree,ltree"] emits _ltree ^@> ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^@>($extension:ltree.ltree,$extension:ltree._ltree)",
    'sql.operators["^@>"]["ltree,_ltree"] emits ltree ^@> _ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^@>($extension:ltree.ltree,$extension:ltree.ltree)",
    'sql.operators["^@>"]["ltree,ltree"] emits ltree ^@> ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^~($extension:ltree._ltree,$extension:ltree.lquery)",
    'sql.operators["^~"]["_ltree,lquery"] emits _ltree ^~ lquery schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^~($extension:ltree.lquery,$extension:ltree._ltree)",
    'sql.operators["^~"]["lquery,_ltree"] emits lquery ^~ _ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^~($extension:ltree.lquery,$extension:ltree.ltree)",
    'sql.operators["^~"]["lquery,ltree"] emits lquery ^~ ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.^~($extension:ltree.ltree,$extension:ltree.lquery)",
    'sql.operators["^~"]["ltree,lquery"] emits ltree ^~ lquery schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.||($extension:ltree.ltree,$extension:ltree.ltree)",
    'sql.operators["||"]["ltree,ltree"] emits ltree || ltree schema-qualified.',
    "Ltree | null",
  ),
  query(
    "operator:$extension:ltree.||($extension:ltree.ltree,pg_catalog.text)",
    'sql.operators["||"]["ltree,text"] emits ltree || text schema-qualified.',
    "Ltree | null",
  ),
  query(
    "operator:$extension:ltree.||(pg_catalog.text,$extension:ltree.ltree)",
    'sql.operators["||"]["text,ltree"] emits text || ltree schema-qualified.',
    "Ltree | null",
  ),
  query(
    "operator:$extension:ltree.~($extension:ltree._ltree,$extension:ltree.lquery)",
    'sql.operators["~"]["_ltree,lquery"] emits _ltree ~ lquery schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.~($extension:ltree.lquery,$extension:ltree._ltree)",
    'sql.operators["~"]["lquery,_ltree"] emits lquery ~ _ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.~($extension:ltree.lquery,$extension:ltree.ltree)",
    'sql.operators["~"]["lquery,ltree"] emits lquery ~ ltree schema-qualified.',
    "boolean | null",
  ),
  query(
    "operator:$extension:ltree.~($extension:ltree.ltree,$extension:ltree.lquery)",
    'sql.operators["~"]["ltree,lquery"] emits ltree ~ lquery schema-qualified.',
    "boolean | null",
  ),
  internal("opfamily:$extension:ltree.gist__ltree_ops/gist", "gist__ltree_ops"),
  internal("opfamily:$extension:ltree.gist_ltree_ops/gist", "gist_ltree_ops"),
  internal("opfamily:$extension:ltree.hash_ltree_ops/hash", "hash_ltree_ops"),
  internal("opfamily:$extension:ltree.ltree_ops/btree", "ltree_ops"),
  query(
    "routine:$extension:ltree._lt_q_regex($extension:ltree._ltree,$extension:ltree._lquery)",
    "sql.functions._lt_q_regex calls _lt_q_regex(_ltree,_lquery).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree._lt_q_rregex($extension:ltree._lquery,$extension:ltree._ltree)",
    "sql.functions._lt_q_rregex calls _lt_q_rregex(_lquery,_ltree).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree._ltq_extract_regex($extension:ltree._ltree,$extension:ltree.lquery)",
    "sql.functions._ltq_extract_regex calls _ltq_extract_regex(_ltree,lquery).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree._ltq_regex($extension:ltree._ltree,$extension:ltree.lquery)",
    "sql.functions._ltq_regex calls _ltq_regex(_ltree,lquery).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree._ltq_rregex($extension:ltree.lquery,$extension:ltree._ltree)",
    "sql.functions._ltq_rregex calls _ltq_rregex(lquery,_ltree).",
    "boolean | null",
  ),
  internal("routine:$extension:ltree._ltree_compress(pg_catalog.internal)", "gist__ltree_ops"),
  internal(
    "routine:$extension:ltree._ltree_consistent(pg_catalog.internal,$extension:ltree._ltree,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
    "gist__ltree_ops",
  ),
  query(
    "routine:$extension:ltree._ltree_extract_isparent($extension:ltree._ltree,$extension:ltree.ltree)",
    "sql.functions._ltree_extract_isparent calls _ltree_extract_isparent(_ltree,ltree).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree._ltree_extract_risparent($extension:ltree._ltree,$extension:ltree.ltree)",
    "sql.functions._ltree_extract_risparent calls _ltree_extract_risparent(_ltree,ltree).",
    "Ltree | null",
  ),
  internal("routine:$extension:ltree._ltree_gist_options(pg_catalog.internal)", "gist__ltree_ops"),
  query(
    "routine:$extension:ltree._ltree_isparent($extension:ltree._ltree,$extension:ltree.ltree)",
    "sql.functions._ltree_isparent calls _ltree_isparent(_ltree,ltree).",
    "boolean | null",
  ),
  internal(
    "routine:$extension:ltree._ltree_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    "gist__ltree_ops",
  ),
  internal("routine:$extension:ltree._ltree_picksplit(pg_catalog.internal,pg_catalog.internal)", "gist__ltree_ops"),
  query(
    "routine:$extension:ltree._ltree_r_isparent($extension:ltree.ltree,$extension:ltree._ltree)",
    "sql.functions._ltree_r_isparent calls _ltree_r_isparent(ltree,_ltree).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree._ltree_r_risparent($extension:ltree.ltree,$extension:ltree._ltree)",
    "sql.functions._ltree_r_risparent calls _ltree_r_risparent(ltree,_ltree).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree._ltree_risparent($extension:ltree._ltree,$extension:ltree.ltree)",
    "sql.functions._ltree_risparent calls _ltree_risparent(_ltree,ltree).",
    "boolean | null",
  ),
  internal(
    "routine:$extension:ltree._ltree_same($extension:ltree.ltree_gist,$extension:ltree.ltree_gist,pg_catalog.internal)",
    "gist__ltree_ops",
  ),
  internal("routine:$extension:ltree._ltree_union(pg_catalog.internal,pg_catalog.internal)", "gist__ltree_ops"),
  query(
    "routine:$extension:ltree._ltxtq_exec($extension:ltree._ltree,$extension:ltree.ltxtquery)",
    "sql.functions._ltxtq_exec calls _ltxtq_exec(_ltree,ltxtquery).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree._ltxtq_extract_exec($extension:ltree._ltree,$extension:ltree.ltxtquery)",
    "sql.functions._ltxtq_extract_exec calls _ltxtq_extract_exec(_ltree,ltxtquery).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree._ltxtq_rexec($extension:ltree.ltxtquery,$extension:ltree._ltree)",
    "sql.functions._ltxtq_rexec calls _ltxtq_rexec(ltxtquery,_ltree).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree.hash_ltree($extension:ltree.ltree)",
    "sql.functions.hash_ltree (hash) calls hash_ltree(ltree).",
    "number | null",
  ),
  query(
    "routine:$extension:ltree.hash_ltree_extended($extension:ltree.ltree,pg_catalog.int8)",
    "sql.functions.hash_ltree_extended (hashExtended) calls hash_ltree_extended(ltree,int8).",
    "bigint | null",
  ),
  query(
    "routine:$extension:ltree.index($extension:ltree.ltree,$extension:ltree.ltree)",
    "index / sql.functions.index.path calls index(ltree,ltree).",
    "number | null",
  ),
  query(
    "routine:$extension:ltree.index($extension:ltree.ltree,$extension:ltree.ltree,pg_catalog.int4)",
    "index / sql.functions.index.offset calls index(ltree,ltree,int4).",
    "number | null",
  ),
  query(
    "routine:$extension:ltree.lca($extension:ltree._ltree)",
    "lcaArray / sql.functions.lca.array calls lca(_ltree).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree.lca($extension:ltree.ltree,$extension:ltree.ltree)",
    "lca / sql.functions.lca[2] calls lca(ltree,ltree).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree.lca($extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree)",
    "lca / sql.functions.lca[3] calls lca(ltree,ltree,ltree).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree.lca($extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree)",
    "lca / sql.functions.lca[4] calls lca(ltree,ltree,ltree,ltree).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree.lca($extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree)",
    "lca / sql.functions.lca[5] calls lca(ltree,ltree,ltree,ltree,ltree).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree.lca($extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree)",
    "lca / sql.functions.lca[6] calls lca(ltree,ltree,ltree,ltree,ltree,ltree).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree.lca($extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree)",
    "lca / sql.functions.lca[7] calls lca(ltree,ltree,ltree,ltree,ltree,ltree,ltree).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree.lca($extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree,$extension:ltree.ltree)",
    "lca / sql.functions.lca[8] calls lca(ltree,ltree,ltree,ltree,ltree,ltree,ltree,ltree).",
    "Ltree | null",
  ),
  internal("routine:$extension:ltree.lquery_in(pg_catalog.cstring)", "type I/O"),
  internal("routine:$extension:ltree.lquery_out($extension:ltree.lquery)", "type I/O"),
  internal("routine:$extension:ltree.lquery_recv(pg_catalog.internal)", "type I/O"),
  query(
    "routine:$extension:ltree.lquery_send($extension:ltree.lquery)",
    "SQL-callable native binary send function",
    "native bytea binary value",
  ),
  query(
    "routine:$extension:ltree.lt_q_regex($extension:ltree.ltree,$extension:ltree._lquery)",
    "sql.functions.lt_q_regex calls lt_q_regex(ltree,_lquery).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree.lt_q_rregex($extension:ltree._lquery,$extension:ltree.ltree)",
    "sql.functions.lt_q_rregex calls lt_q_rregex(_lquery,ltree).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree.ltq_regex($extension:ltree.ltree,$extension:ltree.lquery)",
    "sql.functions.ltq_regex calls ltq_regex(ltree,lquery).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree.ltq_rregex($extension:ltree.lquery,$extension:ltree.ltree)",
    "sql.functions.ltq_rregex calls ltq_rregex(lquery,ltree).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree.ltree2text($extension:ltree.ltree)",
    "sql.functions.ltree2text (toText) calls ltree2text(ltree).",
    "string | null",
  ),
  query(
    "routine:$extension:ltree.ltree_addltree($extension:ltree.ltree,$extension:ltree.ltree)",
    "sql.functions.ltree_addltree calls ltree_addltree(ltree,ltree).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree.ltree_addtext($extension:ltree.ltree,pg_catalog.text)",
    "sql.functions.ltree_addtext calls ltree_addtext(ltree,text).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree.ltree_cmp($extension:ltree.ltree,$extension:ltree.ltree)",
    "sql.functions.ltree_cmp (compare) calls ltree_cmp(ltree,ltree).",
    "number | null",
  ),
  internal("routine:$extension:ltree.ltree_compress(pg_catalog.internal)", "gist_ltree_ops"),
  internal(
    "routine:$extension:ltree.ltree_consistent(pg_catalog.internal,$extension:ltree.ltree,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
    "gist_ltree_ops",
  ),
  internal("routine:$extension:ltree.ltree_decompress(pg_catalog.internal)", "gist_ltree_ops"),
  query(
    "routine:$extension:ltree.ltree_eq($extension:ltree.ltree,$extension:ltree.ltree)",
    "sql.functions.ltree_eq calls ltree_eq(ltree,ltree).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree.ltree_ge($extension:ltree.ltree,$extension:ltree.ltree)",
    "sql.functions.ltree_ge calls ltree_ge(ltree,ltree).",
    "boolean | null",
  ),
  internal("routine:$extension:ltree.ltree_gist_in(pg_catalog.cstring)", "type I/O"),
  internal("routine:$extension:ltree.ltree_gist_options(pg_catalog.internal)", "gist_ltree_ops"),
  internal("routine:$extension:ltree.ltree_gist_out($extension:ltree.ltree_gist)", "type I/O"),
  query(
    "routine:$extension:ltree.ltree_gt($extension:ltree.ltree,$extension:ltree.ltree)",
    "sql.functions.ltree_gt calls ltree_gt(ltree,ltree).",
    "boolean | null",
  ),
  internal("routine:$extension:ltree.ltree_in(pg_catalog.cstring)", "type I/O"),
  query(
    "routine:$extension:ltree.ltree_isparent($extension:ltree.ltree,$extension:ltree.ltree)",
    "sql.functions.ltree_isparent calls ltree_isparent(ltree,ltree).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree.ltree_le($extension:ltree.ltree,$extension:ltree.ltree)",
    "sql.functions.ltree_le calls ltree_le(ltree,ltree).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree.ltree_lt($extension:ltree.ltree,$extension:ltree.ltree)",
    "sql.functions.ltree_lt calls ltree_lt(ltree,ltree).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree.ltree_ne($extension:ltree.ltree,$extension:ltree.ltree)",
    "sql.functions.ltree_ne calls ltree_ne(ltree,ltree).",
    "boolean | null",
  ),
  internal("routine:$extension:ltree.ltree_out($extension:ltree.ltree)", "type I/O"),
  internal(
    "routine:$extension:ltree.ltree_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    "gist_ltree_ops",
  ),
  internal("routine:$extension:ltree.ltree_picksplit(pg_catalog.internal,pg_catalog.internal)", "gist_ltree_ops"),
  internal("routine:$extension:ltree.ltree_recv(pg_catalog.internal)", "type I/O"),
  query(
    "routine:$extension:ltree.ltree_risparent($extension:ltree.ltree,$extension:ltree.ltree)",
    "sql.functions.ltree_risparent calls ltree_risparent(ltree,ltree).",
    "boolean | null",
  ),
  internal(
    "routine:$extension:ltree.ltree_same($extension:ltree.ltree_gist,$extension:ltree.ltree_gist,pg_catalog.internal)",
    "gist_ltree_ops",
  ),
  query(
    "routine:$extension:ltree.ltree_send($extension:ltree.ltree)",
    "SQL-callable native binary send function",
    "native bytea binary value",
  ),
  query(
    "routine:$extension:ltree.ltree_textadd(pg_catalog.text,$extension:ltree.ltree)",
    "sql.functions.ltree_textadd calls ltree_textadd(text,ltree).",
    "Ltree | null",
  ),
  internal("routine:$extension:ltree.ltree_union(pg_catalog.internal,pg_catalog.internal)", "gist_ltree_ops"),
  internal(
    "routine:$extension:ltree.ltreeparentsel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int4)",
    "operator selectivity",
  ),
  query(
    "routine:$extension:ltree.ltxtq_exec($extension:ltree.ltree,$extension:ltree.ltxtquery)",
    "sql.functions.ltxtq_exec calls ltxtq_exec(ltree,ltxtquery).",
    "boolean | null",
  ),
  internal("routine:$extension:ltree.ltxtq_in(pg_catalog.cstring)", "type I/O"),
  internal("routine:$extension:ltree.ltxtq_out($extension:ltree.ltxtquery)", "type I/O"),
  internal("routine:$extension:ltree.ltxtq_recv(pg_catalog.internal)", "type I/O"),
  query(
    "routine:$extension:ltree.ltxtq_rexec($extension:ltree.ltxtquery,$extension:ltree.ltree)",
    "sql.functions.ltxtq_rexec calls ltxtq_rexec(ltxtquery,ltree).",
    "boolean | null",
  ),
  query(
    "routine:$extension:ltree.ltxtq_send($extension:ltree.ltxtquery)",
    "SQL-callable native binary send function",
    "native bytea binary value",
  ),
  query(
    "routine:$extension:ltree.nlevel($extension:ltree.ltree)",
    "sql.functions.nlevel (nlevel) calls nlevel(ltree).",
    "number | null",
  ),
  query(
    "routine:$extension:ltree.subltree($extension:ltree.ltree,pg_catalog.int4,pg_catalog.int4)",
    "sql.functions.subltree (subltree) calls subltree(ltree,int4,int4).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree.subpath($extension:ltree.ltree,pg_catalog.int4)",
    "subpath / sql.functions.subpath.offset calls subpath(ltree,int4).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree.subpath($extension:ltree.ltree,pg_catalog.int4,pg_catalog.int4)",
    "subpath / sql.functions.subpath.length calls subpath(ltree,int4,int4).",
    "Ltree | null",
  ),
  query(
    "routine:$extension:ltree.text2ltree(pg_catalog.text)",
    "sql.functions.text2ltree (fromText) calls text2ltree(text).",
    "Ltree | null",
  ),
  schema(
    "type:$extension:ltree._lquery",
    "queryArrayField() declares native _lquery storage with its lossless text codec.",
  ),
  schema(
    "type:$extension:ltree._ltree",
    "arrayField() and pathSetField() declares native _ltree storage with its lossless text codec.",
  ),
  internal("type:$extension:ltree._ltree_gist", "GiST signature storage"),
  schema(
    "type:$extension:ltree._ltxtquery",
    "textQueryArrayField() declares native _ltxtquery storage with its lossless text codec.",
  ),
  schema("type:$extension:ltree.lquery", "queryField() declares native lquery storage with its lossless text codec."),
  schema("type:$extension:ltree.ltree", "field() declares native ltree storage with its lossless text codec."),
  internal("type:$extension:ltree.ltree_gist", "GiST signature storage"),
  schema(
    "type:$extension:ltree.ltxtquery",
    "textQueryField() declares native ltxtquery storage with its lossless text codec.",
  ),
] as const;
