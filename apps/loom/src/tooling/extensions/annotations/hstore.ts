const sources = [
  "https://www.postgresql.org/docs/18/hstore.html",
  "apps/loom/src/tooling/extensions/manifests/hstore.json",
] as const;
const queryEvidence = [
  ...sources,
  "apps/loom/src/core/extensions/adapters/hstore.ts",
  "packages/tests/unit/extensions-hstore.test.ts",
  "packages/tests/types/extensions-hstore.test-d.ts",
] as const;
const recordEvidence = [
  ...queryEvidence,
  "apps/loom/src/core/extensions/hstore-record.ts",
  "packages/tests/unit/extensions-hstore-record.test.ts",
] as const;
const pending = { providerAcceptance: "pending", publicExportAcceptance: "pending" } as const;
const querySemantics = {
  ...pending,
  authority: "query",
  observability:
    "Record witnesses propagate captured table dependencies and reject unmanaged or session-dependent live reads; ordinary portable calls observe their input tables.",
  nulls:
    "SQL NULL remains SQL NULL; missing and stored NULL are distinct from text NULL. PostgreSQL constructor and composite nonstrict behavior is preserved.",
  transport:
    "hstore entries; native bounded arrays; lossless json/jsonb text; signed bigint hash seeds; binary hex wrappers. Composite fields use their managed attribute decoders.",
} as const;
/** Exact member dispositions. Pending gates are not acceptance receipts. */
export const hstoreAnnotations = [
  {
    id: "cast:$extension:hstore.hstore->pg_catalog.json",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['cast:$extension:hstore.hstore->pg_catalog.json'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "cast:$extension:hstore.hstore->pg_catalog.jsonb",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['cast:$extension:hstore.hstore->pg_catalog.jsonb'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "cast:pg_catalog._text->$extension:hstore.hstore",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['cast:pg_catalog._text->$extension:hstore.hstore'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: 'function of access method:function 1 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".btree_hstore_ops USING btree',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 1 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".btree_hstore_ops USING btree; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'function of access method:function 1 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gin_hstore_ops USING gin',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 1 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gin_hstore_ops USING gin; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'function of access method:function 1 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 1 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'function of access method:function 1 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".hash_hstore_ops USING hash',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 1 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".hash_hstore_ops USING hash; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'function of access method:function 10 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 10 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'function of access method:function 2 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gin_hstore_ops USING gin',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 2 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gin_hstore_ops USING gin; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'function of access method:function 2 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 2 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'function of access method:function 2 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".hash_hstore_ops USING hash',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 2 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".hash_hstore_ops USING hash; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'function of access method:function 3 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gin_hstore_ops USING gin',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 3 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gin_hstore_ops USING gin; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'function of access method:function 3 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 3 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'function of access method:function 4 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gin_hstore_ops USING gin',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 4 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gin_hstore_ops USING gin; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'function of access method:function 4 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 4 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'function of access method:function 5 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 5 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'function of access method:function 6 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 6 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'function of access method:function 7 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment function of access method:function 7 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: "opclass:$extension:hstore.btree_hstore_ops/btree",
    disposition: "schema",
    reason:
      "Captured opclass opclass:$extension:hstore.btree_hstore_ops/btree; typed index integration and native attachment/index execution proof are still pending.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "opclass:$extension:hstore.gin_hstore_ops/gin",
    disposition: "schema",
    reason:
      "Captured opclass opclass:$extension:hstore.gin_hstore_ops/gin; typed index integration and native attachment/index execution proof are still pending.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "opclass:$extension:hstore.gist_hstore_ops/gist",
    disposition: "schema",
    reason:
      "Captured opclass opclass:$extension:hstore.gist_hstore_ops/gist; typed index integration and native attachment/index execution proof are still pending.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "opclass:$extension:hstore.hash_hstore_ops/hash",
    disposition: "schema",
    reason:
      "Captured opclass opclass:$extension:hstore.hash_hstore_ops/hash; typed index integration and native attachment/index execution proof are still pending.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'operator of access method:operator 1 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".btree_hstore_ops USING btree',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator of access method:operator 1 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".btree_hstore_ops USING btree; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'operator of access method:operator 1 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".hash_hstore_ops USING hash',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator of access method:operator 1 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".hash_hstore_ops USING hash; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'operator of access method:operator 10 ("$extension:hstore".hstore, pg_catalog.text[]) of "$extension:hstore".gin_hstore_ops USING gin',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator of access method:operator 10 ("$extension:hstore".hstore, pg_catalog.text[]) of "$extension:hstore".gin_hstore_ops USING gin; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'operator of access method:operator 10 ("$extension:hstore".hstore, pg_catalog.text[]) of "$extension:hstore".gist_hstore_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator of access method:operator 10 ("$extension:hstore".hstore, pg_catalog.text[]) of "$extension:hstore".gist_hstore_ops USING gist; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'operator of access method:operator 11 ("$extension:hstore".hstore, pg_catalog.text[]) of "$extension:hstore".gin_hstore_ops USING gin',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator of access method:operator 11 ("$extension:hstore".hstore, pg_catalog.text[]) of "$extension:hstore".gin_hstore_ops USING gin; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'operator of access method:operator 11 ("$extension:hstore".hstore, pg_catalog.text[]) of "$extension:hstore".gist_hstore_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator of access method:operator 11 ("$extension:hstore".hstore, pg_catalog.text[]) of "$extension:hstore".gist_hstore_ops USING gist; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'operator of access method:operator 2 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".btree_hstore_ops USING btree',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator of access method:operator 2 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".btree_hstore_ops USING btree; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'operator of access method:operator 3 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".btree_hstore_ops USING btree',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator of access method:operator 3 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".btree_hstore_ops USING btree; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'operator of access method:operator 4 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".btree_hstore_ops USING btree',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator of access method:operator 4 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".btree_hstore_ops USING btree; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'operator of access method:operator 5 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".btree_hstore_ops USING btree',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator of access method:operator 5 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".btree_hstore_ops USING btree; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'operator of access method:operator 7 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gin_hstore_ops USING gin',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator of access method:operator 7 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gin_hstore_ops USING gin; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'operator of access method:operator 7 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator of access method:operator 7 ("$extension:hstore".hstore, "$extension:hstore".hstore) of "$extension:hstore".gist_hstore_ops USING gist; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'operator of access method:operator 9 ("$extension:hstore".hstore, pg_catalog.text) of "$extension:hstore".gin_hstore_ops USING gin',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator of access method:operator 9 ("$extension:hstore".hstore, pg_catalog.text) of "$extension:hstore".gin_hstore_ops USING gin; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: 'operator of access method:operator 9 ("$extension:hstore".hstore, pg_catalog.text) of "$extension:hstore".gist_hstore_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator of access method:operator 9 ("$extension:hstore".hstore, pg_catalog.text) of "$extension:hstore".gist_hstore_ops USING gist; preserve its family/operator or support-procedure relationship. Native catalog and index execution proof are pending.',
    evidence: sources,
    semantics: pending,
  },
  {
    id: "operator:$extension:hstore.-($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.-($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog._text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog.text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog._text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog.text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.?($extension:hstore.hstore,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.?($extension:hstore.hstore,pg_catalog.text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.?&($extension:hstore.hstore,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.?&($extension:hstore.hstore,pg_catalog._text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.?|($extension:hstore.hstore,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.?|($extension:hstore.hstore,pg_catalog._text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.@>($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.@>($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.#<#($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.#<#($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.#<=#($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.#<=#($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.#=(pg_catalog.anyelement,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.#=(pg_catalog.anyelement,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs. Named managed table witnesses determine every nullable attribute decoder; arbitrary SQL and caller result shapes are rejected.",
    evidence: recordEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.#>#($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.#>#($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.#>=#($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.#>=#($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.%#(,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.%#(,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.%%(,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.%%(,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.<@($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.<@($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.<>($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.<>($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.=($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.=($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "operator:$extension:hstore.||($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['operator:$extension:hstore.||($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "opfamily:$extension:hstore.btree_hstore_ops/btree",
    disposition: "schema",
    reason:
      "Captured opfamily opfamily:$extension:hstore.btree_hstore_ops/btree; typed index integration and native attachment/index execution proof are still pending.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "opfamily:$extension:hstore.gin_hstore_ops/gin",
    disposition: "schema",
    reason:
      "Captured opfamily opfamily:$extension:hstore.gin_hstore_ops/gin; typed index integration and native attachment/index execution proof are still pending.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "opfamily:$extension:hstore.gist_hstore_ops/gist",
    disposition: "schema",
    reason:
      "Captured opfamily opfamily:$extension:hstore.gist_hstore_ops/gist; typed index integration and native attachment/index execution proof are still pending.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "opfamily:$extension:hstore.hash_hstore_ops/hash",
    disposition: "schema",
    reason:
      "Captured opfamily opfamily:$extension:hstore.hash_hstore_ops/hash; typed index integration and native attachment/index execution proof are still pending.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.akeys($extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.akeys($extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.avals($extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.avals($extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.defined($extension:hstore.hstore,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.defined($extension:hstore.hstore,pg_catalog.text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.delete($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.delete($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog._text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog.text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.each($extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.each($extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.exist($extension:hstore.hstore,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.exist($extension:hstore.hstore,pg_catalog.text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.exists_all($extension:hstore.hstore,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.exists_all($extension:hstore.hstore,pg_catalog._text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.exists_any($extension:hstore.hstore,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.exists_any($extension:hstore.hstore,pg_catalog._text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.fetchval($extension:hstore.hstore,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.fetchval($extension:hstore.hstore,pg_catalog.text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.ghstore_compress(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured support procedure 3 of opfamily:$extension:hstore.gist_hstore_ops/gist; native access-method execution requires attachment and index witnesses.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.ghstore_consistent(pg_catalog.internal,$extension:hstore.hstore,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured support procedure 1 of opfamily:$extension:hstore.gist_hstore_ops/gist; native access-method execution requires attachment and index witnesses.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.ghstore_decompress(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured support procedure 4 of opfamily:$extension:hstore.gist_hstore_ops/gist; native access-method execution requires attachment and index witnesses.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.ghstore_in(pg_catalog.cstring)",
    disposition: "internal",
    reason:
      "Captured input callback of type:$extension:hstore.ghstore; native type I/O is exercised through typed values, not supplied cstring/internal pointers.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.ghstore_options(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured support procedure 10 of opfamily:$extension:hstore.gist_hstore_ops/gist; native access-method execution requires attachment and index witnesses.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.ghstore_out($extension:hstore.ghstore)",
    disposition: "internal",
    reason:
      "Captured output callback of type:$extension:hstore.ghstore; native type I/O is exercised through typed values, not supplied cstring/internal pointers.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.ghstore_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured support procedure 5 of opfamily:$extension:hstore.gist_hstore_ops/gist; native access-method execution requires attachment and index witnesses.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.ghstore_picksplit(pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured support procedure 6 of opfamily:$extension:hstore.gist_hstore_ops/gist; native access-method execution requires attachment and index witnesses.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.ghstore_same($extension:hstore.ghstore,$extension:hstore.ghstore,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured support procedure 7 of opfamily:$extension:hstore.gist_hstore_ops/gist; native access-method execution requires attachment and index witnesses.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.ghstore_union(pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured support procedure 2 of opfamily:$extension:hstore.gist_hstore_ops/gist; native access-method execution requires attachment and index witnesses.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.gin_consistent_hstore(pg_catalog.internal,pg_catalog.int2,$extension:hstore.hstore,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured support procedure 4 of opfamily:$extension:hstore.gin_hstore_ops/gin; native access-method execution requires attachment and index witnesses.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.gin_extract_hstore_query($extension:hstore.hstore,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured support procedure 3 of opfamily:$extension:hstore.gin_hstore_ops/gin; native access-method execution requires attachment and index witnesses.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.gin_extract_hstore($extension:hstore.hstore,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured support procedure 2 of opfamily:$extension:hstore.gin_hstore_ops/gin; native access-method execution requires attachment and index witnesses.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.hs_concat($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hs_concat($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hs_contained($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hs_contained($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hs_contains($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hs_contains($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_cmp($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Ordinarily callable captured support routine sql.overloads['routine:$extension:hstore.hstore_cmp($extension:hstore.hstore,$extension:hstore.hstore)'] remains public despite its native operator-family role; exact checked inputs and result codec are preserved.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_eq($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore_eq($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_ge($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore_ge($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_gt($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore_gt($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_hash_extended($extension:hstore.hstore,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Ordinarily callable captured support routine sql.overloads['routine:$extension:hstore.hstore_hash_extended($extension:hstore.hstore,pg_catalog.int8)'] remains public despite its native operator-family role; exact checked inputs and result codec are preserved.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_hash($extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Ordinarily callable captured support routine sql.overloads['routine:$extension:hstore.hstore_hash($extension:hstore.hstore)'] remains public despite its native operator-family role; exact checked inputs and result codec are preserved.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_in(pg_catalog.cstring)",
    disposition: "internal",
    reason:
      "Captured input callback of type:$extension:hstore.hstore; native type I/O is exercised through typed values, not supplied cstring/internal pointers.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.hstore_le($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore_le($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_lt($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore_lt($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_ne($extension:hstore.hstore,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore_ne($extension:hstore.hstore,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_out($extension:hstore.hstore)",
    disposition: "internal",
    reason:
      "Captured output callback of type:$extension:hstore.hstore; native type I/O is exercised through typed values, not supplied cstring/internal pointers.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.hstore_recv(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured receive callback of type:$extension:hstore.hstore; native type I/O is exercised through typed values, not supplied cstring/internal pointers.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.hstore_send($extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore_send($extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_subscript_handler(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured backend callback routine:$extension:hstore.hstore_subscript_handler(pg_catalog.internal); its exact cstring/internal call shape requires native type, access-method or subscripting execution. No ordinary query signature is invented. Typed subscript read/write syntax and captured handler linkage remain pending; get/operator helpers do not count as subscripting proof.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "routine:$extension:hstore.hstore_to_array($extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore_to_array($extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_to_json_loose($extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore_to_json_loose($extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_to_json($extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore_to_json($extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_to_jsonb_loose($extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore_to_jsonb_loose($extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_to_jsonb($extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore_to_jsonb($extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_to_matrix($extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore_to_matrix($extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore_version_diag($extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore_version_diag($extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore(pg_catalog._text,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore(pg_catalog._text,pg_catalog._text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore(pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore(pg_catalog._text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore(pg_catalog.record)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore(pg_catalog.record)'] emits this captured identity with qualified schema and checked paired codecs. fromRecord requires a privately sealed anonymous or managed table witness.",
    evidence: recordEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.hstore(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.hstore(pg_catalog.text,pg_catalog.text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.isdefined($extension:hstore.hstore,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.isdefined($extension:hstore.hstore,pg_catalog.text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.isexists($extension:hstore.hstore,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.isexists($extension:hstore.hstore,pg_catalog.text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.populate_record(pg_catalog.anyelement,$extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.populate_record(pg_catalog.anyelement,$extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs. Named managed table witnesses determine every nullable attribute decoder; arbitrary SQL and caller result shapes are rejected.",
    evidence: recordEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.skeys($extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.skeys($extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.slice_array($extension:hstore.hstore,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.slice_array($extension:hstore.hstore,pg_catalog._text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.slice($extension:hstore.hstore,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.slice($extension:hstore.hstore,pg_catalog._text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.svals($extension:hstore.hstore)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.svals($extension:hstore.hstore)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "routine:$extension:hstore.tconvert(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact canonical sql.overloads['routine:$extension:hstore.tconvert(pg_catalog.text,pg_catalog.text)'] emits this captured identity with qualified schema and checked paired codecs.",
    evidence: queryEvidence,
    semantics: querySemantics,
  },
  {
    id: "type:$extension:hstore._ghstore",
    disposition: "internal",
    reason:
      "Captured native GiST storage array type:$extension:hstore._ghstore; tied to gist_hstore_ops storage and native type I/O. Not exposed as an arbitrary user value codec.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "type:$extension:hstore._hstore",
    disposition: "schema",
    reason:
      "arrayField exposes this captured type with its exact relocated codec and transport. Generic filter/order/search operators are disabled pending approval.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "type:$extension:hstore.ghstore",
    disposition: "internal",
    reason:
      "Captured native GiST storage type type:$extension:hstore.ghstore; tied to gist_hstore_ops storage and native type I/O. Not exposed as an arbitrary user value codec.",
    evidence: sources,
    semantics: pending,
  },
  {
    id: "type:$extension:hstore.hstore",
    disposition: "schema",
    reason:
      "field exposes this captured type with its exact relocated codec and transport. Generic filter/order/search operators are disabled pending approval.",
    evidence: sources,
    semantics: pending,
  },
] as const;
