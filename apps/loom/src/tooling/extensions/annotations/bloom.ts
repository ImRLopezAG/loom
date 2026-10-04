const evidence = [
  "apps/loom/src/tooling/extensions/manifests/bloom.json",
  "https://www.postgresql.org/docs/18/bloom.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/bloom/blutils.c: length 1..4096, col1..col32 1..4095 reloptions; amcanunique false",
  "apps/loom/src/core/extensions/adapters/bloom.ts",
  "packages/tests/unit/extensions-bloom.test.ts",
  "packages/tests/types/extensions-bloom.test-d.ts",
  "packages/e2e/integration/extensions-bloom.test.ts",
] as const;
const pending = { providerAcceptance: "pending", publicExportAcceptance: "pending" } as const;
const index = {
  authority: "schema",
  surface:
    "defineTable indexes: { fields, extension: bloom.indexes.int4() | bloom.indexes.text(), with: bloom.storage(...) }",
  strategies: "equality (=) only; the index is lossy and every candidate row is rechecked",
  nulls: "NULL keys are not indexed; IS NULL predicates fall back to other plans",
  ...pending,
} as const;

/** Exact member dispositions. Acceptance stays pending until native and isolated-consumer host proofs. */
export const bloomAnnotations = [
  {
    id: "access method:bloom",
    disposition: "schema",
    reason:
      "The bloom index access method is selected by every typed bloom index contract (method: bloom); it is not a query value, so it is exposed only as index DDL and accessMethod metadata.",
    evidence,
    semantics: {
      ...index,
      unique: "unsupported: native rejects unique bloom indexes",
      storage: "with: length 1..4096 and col<n> 1..4095 for n in 1..32, validated by bloom.storage",
    },
  },
  {
    id: 'function of access method:function 1 (integer, integer) of "$extension:bloom".int4_ops USING bloom',
    disposition: "internal",
    reason:
      'Captured access-method attachment function 1 (integer, integer) of "$extension:bloom".int4_ops USING bloom (pg_catalog.hashint4); catalog wiring of the int4 class, not a separate SQL routine.',
    evidence,
    semantics: { ...pending, parent: "opclass:$extension:bloom.int4_ops/bloom" },
  },
  {
    id: 'function of access method:function 1 (pg_catalog.text, pg_catalog.text) of "$extension:bloom".text_ops USING bloom',
    disposition: "internal",
    reason:
      'Captured access-method attachment function 1 (pg_catalog.text, pg_catalog.text) of "$extension:bloom".text_ops USING bloom (pg_catalog.hashtext); catalog wiring of the text class, not a separate SQL routine.',
    evidence,
    semantics: { ...pending, parent: "opclass:$extension:bloom.text_ops/bloom" },
  },
  {
    id: "opclass:$extension:bloom.int4_ops/bloom",
    disposition: "schema",
    reason:
      "bloom.indexes.int4() selects the captured default int4 class with its qualified installation schema for integer fields.",
    evidence,
    semantics: { ...index, input: "pg_catalog.int4 integer fields" },
  },
  {
    id: "opclass:$extension:bloom.text_ops/bloom",
    disposition: "schema",
    reason:
      "bloom.indexes.text() selects the captured default text class with its qualified installation schema for text and enum fields.",
    evidence,
    semantics: { ...index, input: "pg_catalog.text text and enum fields" },
  },
  {
    id: 'operator of access method:operator 1 (integer, integer) of "$extension:bloom".int4_ops USING bloom',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 1 (integer, integer) of "$extension:bloom".int4_ops USING bloom (pg_catalog.= search strategy); catalog wiring of the int4 class.',
    evidence,
    semantics: { ...pending, parent: "opclass:$extension:bloom.int4_ops/bloom" },
  },
  {
    id: 'operator of access method:operator 1 (pg_catalog.text, pg_catalog.text) of "$extension:bloom".text_ops USING bloom',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 1 (pg_catalog.text, pg_catalog.text) of "$extension:bloom".text_ops USING bloom (pg_catalog.= search strategy); catalog wiring of the text class.',
    evidence,
    semantics: { ...pending, parent: "opclass:$extension:bloom.text_ops/bloom" },
  },
  {
    id: "opfamily:$extension:bloom.int4_ops/bloom",
    disposition: "internal",
    reason:
      "Catalog linkage backing the int4 index class; not a separately callable query. Captured strategy and support procedure are preserved under the parent class.",
    evidence,
    semantics: { ...pending, parent: "opclass:$extension:bloom.int4_ops/bloom" },
  },
  {
    id: "opfamily:$extension:bloom.text_ops/bloom",
    disposition: "internal",
    reason:
      "Catalog linkage backing the text index class; not a separately callable query. Captured strategy and support procedure are preserved under the parent class.",
    evidence,
    semantics: { ...pending, parent: "opclass:$extension:bloom.text_ops/bloom" },
  },
  {
    id: "routine:$extension:bloom.blhandler(pg_catalog.internal)",
    disposition: "schema",
    reason:
      "The index_am_handler routine is the bloom access method's implementation: PostgreSQL resolves it only through pg_am when building and scanning bloom indexes, and its internal argument makes direct calls fail, so it is exposed as accessMethod.handler, never a scalar helper.",
    evidence,
    semantics: { ...index, surface: "accessMethod.handler; executed by native bloom index build, insert and scan" },
  },
] as const;
