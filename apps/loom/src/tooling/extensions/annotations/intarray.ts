/** Exact intarray 1.5 member dispositions. Provider and public-export acceptance stay pending until Neon and packed-consumer host proofs. */
const evidence = [
  "apps/loom/src/tooling/extensions/manifests/intarray.json",
  "https://www.postgresql.org/docs/18/intarray.html",
  "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/intarray",
  "apps/loom/src/core/extensions/adapters/intarray.ts",
  "packages/tests/unit/extensions-intarray.test.ts",
  "packages/tests/types/extensions-intarray.test-d.ts",
  "packages/e2e/integration/extensions-intarray.test.ts",
] as const;
const pending = {
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
const arrayLimit =
  'Exact PostgreSqlArray<number> | null codec; PostgreSQL raises "array must not contain nulls" for NULL elements in most members.';
export const intarrayAnnotations = [
  {
    id: 'function of access method:function 1 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin',
    disposition: "internal",
    reason:
      'Captured function of access method function 1 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 1 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 1 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 1 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 1 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 10 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 10 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 10 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 10 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 2 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin',
    disposition: "internal",
    reason:
      'Captured function of access method function 2 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 2 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 2 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 2 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 2 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 3 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin',
    disposition: "internal",
    reason:
      'Captured function of access method function 3 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 3 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 3 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 3 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 3 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 4 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin',
    disposition: "internal",
    reason:
      'Captured function of access method function 4 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 4 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 4 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 4 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 4 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 5 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 5 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 5 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 5 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 6 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 6 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 6 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 6 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 7 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 7 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'function of access method:function 7 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist',
    disposition: "internal",
    reason:
      'Captured function of access method function 7 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: "opclass:$extension:intarray.gin__int_ops/gin",
    disposition: "schema",
    reason: "indexes.gin() selects this non-default GIN class for null-free one-dimensional int4[] fields.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "opclass:$extension:intarray.gist__int_ops/gist",
    disposition: "schema",
    reason: "indexes.gist({ numranges }) selects this default GiST class; numranges is 1..252.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "opclass:$extension:intarray.gist__intbig_ops/gist",
    disposition: "schema",
    reason: "indexes.gistBig({ siglen }) selects this signature GiST class; siglen is 1..2024.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'operator of access method:operator 20 (integer[], "$extension:intarray".query_int) of "$extension:intarray".gin__int_ops USING gin',
    disposition: "internal",
    reason:
      'Captured operator of access method operator 20 (integer[], "$extension:intarray".query_int) of "$extension:intarray".gin__int_ops USING gin; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'operator of access method:operator 20 (integer[], "$extension:intarray".query_int) of "$extension:intarray".gist__int_ops USING gist',
    disposition: "internal",
    reason:
      'Captured operator of access method operator 20 (integer[], "$extension:intarray".query_int) of "$extension:intarray".gist__int_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'operator of access method:operator 20 (integer[], "$extension:intarray".query_int) of "$extension:intarray".gist__intbig_ops USING gist',
    disposition: "internal",
    reason:
      'Captured operator of access method operator 20 (integer[], "$extension:intarray".query_int) of "$extension:intarray".gist__intbig_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'operator of access method:operator 3 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin',
    disposition: "internal",
    reason:
      'Captured operator of access method operator 3 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'operator of access method:operator 3 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist',
    disposition: "internal",
    reason:
      'Captured operator of access method operator 3 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'operator of access method:operator 3 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist',
    disposition: "internal",
    reason:
      'Captured operator of access method operator 3 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'operator of access method:operator 6 (pg_catalog.anyarray, pg_catalog.anyarray) of "$extension:intarray".gin__int_ops USING gin',
    disposition: "internal",
    reason:
      'Captured operator of access method operator 6 (pg_catalog.anyarray, pg_catalog.anyarray) of "$extension:intarray".gin__int_ops USING gin; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'operator of access method:operator 6 (pg_catalog.anyarray, pg_catalog.anyarray) of "$extension:intarray".gist__int_ops USING gist',
    disposition: "internal",
    reason:
      'Captured operator of access method operator 6 (pg_catalog.anyarray, pg_catalog.anyarray) of "$extension:intarray".gist__int_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'operator of access method:operator 6 (pg_catalog.anyarray, pg_catalog.anyarray) of "$extension:intarray".gist__intbig_ops USING gist',
    disposition: "internal",
    reason:
      'Captured operator of access method operator 6 (pg_catalog.anyarray, pg_catalog.anyarray) of "$extension:intarray".gist__intbig_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'operator of access method:operator 7 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin',
    disposition: "internal",
    reason:
      'Captured operator of access method operator 7 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'operator of access method:operator 7 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist',
    disposition: "internal",
    reason:
      'Captured operator of access method operator 7 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'operator of access method:operator 7 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist',
    disposition: "internal",
    reason:
      'Captured operator of access method operator 7 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: 'operator of access method:operator 8 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin',
    disposition: "internal",
    reason:
      'Captured operator of access method operator 8 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.',
    evidence,
    semantics: { ...pending },
  },
  {
    id: "operator:$extension:intarray.#(,pg_catalog._int4)",
    disposition: "query",
    reason: 'count / sql.operators["#(_int4)"] is prefix element count over all dimensions.',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "operator:$extension:intarray.#(pg_catalog._int4,pg_catalog.int4)",
    disposition: "query",
    reason: 'indexOf / sql.operators["#(_int4,int4)"] returns the first one-based position, or 0.',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "operator:$extension:intarray.&&(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason: 'overlaps / sql.operators["&&(_int4,_int4)"] tests for a shared element; empty arrays never overlap.',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "operator:$extension:intarray.&(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason: 'intersection / sql.operators["&(_int4,_int4)"] returns the sorted distinct intersection.',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "operator:$extension:intarray.+(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason: 'concat / sql.operators["+(_int4,_int4)"] concatenates without sorting.',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "operator:$extension:intarray.+(pg_catalog._int4,pg_catalog.int4)",
    disposition: "query",
    reason: 'append / sql.operators["+(_int4,int4)"] pushes one element, flattening and rebasing to lower bound 1.',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "operator:$extension:intarray.-(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason:
      'subtract / sql.operators["-(_int4,_int4)"] removes every right-hand element; result is sorted and deduplicated.',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "operator:$extension:intarray.-(pg_catalog._int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      'removeElement / sql.operators["-(_int4,int4)"] removes every occurrence of the element, keeping order and the lower bound.',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "operator:$extension:intarray.<@(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason: 'containedBy / sql.operators["<@(_int4,_int4)"] tests reverse containment.',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "operator:$extension:intarray.@>(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason: 'contains / sql.operators["@>(_int4,_int4)"] tests set containment; empty right side is contained.',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "operator:$extension:intarray.@@(pg_catalog._int4,$extension:intarray.query_int)",
    disposition: "query",
    reason: 'matches / sql.operators["@@(_int4,query_int)"] evaluates a query_int against the array.',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "operator:$extension:intarray.|(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason: 'union / sql.operators["|(_int4,_int4)"] returns the sorted distinct union.',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "operator:$extension:intarray.|(pg_catalog._int4,pg_catalog.int4)",
    disposition: "query",
    reason: 'unionElement / sql.operators["|(_int4,int4)"] adds one element to the sorted distinct set.',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "operator:$extension:intarray.~~($extension:intarray.query_int,pg_catalog._int4)",
    disposition: "query",
    reason: 'matchedBy / sql.operators["~~(query_int,_int4)"] is the commutator of @@.',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "opfamily:$extension:intarray.gin__int_ops/gin",
    disposition: "internal",
    reason:
      "Captured opfamily gin__int_ops; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "opfamily:$extension:intarray.gist__int_ops/gist",
    disposition: "internal",
    reason:
      "Captured opfamily gist__int_ops; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "opfamily:$extension:intarray.gist__intbig_ops/gist",
    disposition: "internal",
    reason:
      "Captured opfamily gist__intbig_ops; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray._int_contained(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason: "sql.functions._int_contained is the <@ procedure.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray._int_contained_joinsel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured <@ operator join estimator pointer. PostgreSQL invokes _int_contained_joinsel during JOIN planning, witnessed by native EXPLAIN ANALYZE and matched pairs; it is not an application SQL helper.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray._int_contained_sel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Captured <@ operator restrict estimator pointer. PostgreSQL invokes _int_contained_sel during WHERE planning, witnessed by native EXPLAIN ANALYZE and filtered results; it is not an application SQL helper.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray._int_contains(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason: "sql.functions._int_contains is the @> procedure.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray._int_contains_joinsel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured @> operator join estimator pointer. PostgreSQL invokes _int_contains_joinsel during JOIN planning, witnessed by native EXPLAIN ANALYZE and matched pairs; it is not an application SQL helper.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray._int_contains_sel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Captured @> operator restrict estimator pointer. PostgreSQL invokes _int_contains_sel during WHERE planning, witnessed by native EXPLAIN ANALYZE and filtered results; it is not an application SQL helper.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray._int_different(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason: "sql.functions._int_different negates _int_same, so duplicate counts make arrays different.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray._int_inter(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason: "sql.functions._int_inter is the & procedure.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray._int_matchsel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Captured @@ and ~~ operator restrict estimator pointer. PostgreSQL invokes _int_matchsel during WHERE planning, witnessed through @@ by native EXPLAIN ANALYZE and filtered results; it is not an application SQL helper.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray._int_overlap(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason: "sql.functions._int_overlap is the && procedure.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray._int_overlap_joinsel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured && operator join estimator pointer. PostgreSQL invokes _int_overlap_joinsel during JOIN planning, witnessed by native EXPLAIN ANALYZE and matched pairs; it is not an application SQL helper.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray._int_overlap_sel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Captured && operator restrict estimator pointer. PostgreSQL invokes _int_overlap_sel during WHERE planning, witnessed by native EXPLAIN ANALYZE and filtered results; it is not an application SQL helper.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray._int_same(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason:
      "sql.functions._int_same compares order-insensitively but keeps duplicate counts: {2,1} equals {1,2}, {2,1,1} does not.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray._int_union(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason: "sql.functions._int_union is the | procedure.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray._intbig_in(pg_catalog.cstring)",
    disposition: "internal",
    reason:
      "Captured routine _intbig_in; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray._intbig_out($extension:intarray.intbig_gkey)",
    disposition: "internal",
    reason:
      "Captured routine _intbig_out; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.boolop(pg_catalog._int4,$extension:intarray.query_int)",
    disposition: "query",
    reason: "sql.functions.boolop is the @@ procedure.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.bqarr_in(pg_catalog.cstring)",
    disposition: "internal",
    reason:
      "Captured routine bqarr_in; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.bqarr_out($extension:intarray.query_int)",
    disposition: "internal",
    reason:
      "Captured routine bqarr_out; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_int_compress(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_int_compress; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_int_consistent(pg_catalog.internal,pg_catalog._int4,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_int_consistent; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_int_decompress(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_int_decompress; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_int_options(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_int_options; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_int_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_int_penalty; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_int_picksplit(pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_int_picksplit; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_int_same(pg_catalog._int4,pg_catalog._int4,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_int_same; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_int_union(pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_int_union; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_intbig_compress(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_intbig_compress; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_intbig_consistent(pg_catalog.internal,pg_catalog._int4,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_intbig_consistent; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_intbig_decompress(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_intbig_decompress; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_intbig_options(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_intbig_options; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_intbig_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_intbig_penalty; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_intbig_picksplit(pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_intbig_picksplit; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_intbig_same($extension:intarray.intbig_gkey,$extension:intarray.intbig_gkey,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_intbig_same; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.g_intbig_union(pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine g_intbig_union; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.ginint4_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog._int4,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine ginint4_consistent; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.ginint4_queryextract(pg_catalog._int4,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Captured routine ginint4_queryextract; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "routine:$extension:intarray.icount(pg_catalog._int4)",
    disposition: "query",
    reason: "icount / sql.functions.icount counts elements (NULL elements count).",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.idx(pg_catalog._int4,pg_catalog.int4)",
    disposition: "query",
    reason: "idx / sql.functions.idx returns the first one-based position, or 0.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.intarray_del_elem(pg_catalog._int4,pg_catalog.int4)",
    disposition: "query",
    reason: "sql.functions.intarray_del_elem is the - element procedure.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.intarray_push_array(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason: "sql.functions.intarray_push_array is the + array procedure.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.intarray_push_elem(pg_catalog._int4,pg_catalog.int4)",
    disposition: "query",
    reason: "sql.functions.intarray_push_elem is the + element procedure.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.intset(pg_catalog.int4)",
    disposition: "query",
    reason: "intset / sql.functions.intset builds a one-element array.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.intset_subtract(pg_catalog._int4,pg_catalog._int4)",
    disposition: "query",
    reason: "sql.functions.intset_subtract is the - array procedure.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.intset_union_elem(pg_catalog._int4,pg_catalog.int4)",
    disposition: "query",
    reason: "sql.functions.intset_union_elem is the | element procedure.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.querytree($extension:intarray.query_int)",
    disposition: "query",
    reason:
      'querytree / sql.functions.querytree is the captured PostgreSQL 18 member; it always raises "querytree is no longer implemented".',
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.rboolop($extension:intarray.query_int,pg_catalog._int4)",
    disposition: "query",
    reason: "sql.functions.rboolop is the ~~ procedure.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.sort(pg_catalog._int4)",
    disposition: "query",
    reason: "sort / sql.functions.sort selects the exact overload by arity; direction is ASC/DESC case-insensitively.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.sort(pg_catalog._int4,pg_catalog.text)",
    disposition: "query",
    reason: "sort / sql.functions.sort selects the exact overload by arity; direction is ASC/DESC case-insensitively.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.sort_asc(pg_catalog._int4)",
    disposition: "query",
    reason: "sortAsc / sql.functions.sort_asc sorts ascending.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.sort_desc(pg_catalog._int4)",
    disposition: "query",
    reason: "sortDesc / sql.functions.sort_desc sorts descending.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.subarray(pg_catalog._int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "subarray / sql.functions.subarray selects the exact overload by arity; negative start counts from the end and negative length drops trailing elements.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.subarray(pg_catalog._int4,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "subarray / sql.functions.subarray selects the exact overload by arity; negative start counts from the end and negative length drops trailing elements.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "routine:$extension:intarray.uniq(pg_catalog._int4)",
    disposition: "query",
    reason: "uniq / sql.functions.uniq removes adjacent duplicates only.",
    evidence,
    semantics: { ...pending, limitation: arrayLimit },
  },
  {
    id: "type:$extension:intarray._intbig_gkey",
    disposition: "internal",
    reason:
      "Captured type _intbig_gkey; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "type:$extension:intarray._query_int",
    disposition: "query",
    reason:
      "Public query_int[] text I/O is bound through queryArrayCodec with exact dimensions, lower bounds and NULL elements.",
    evidence,
    semantics: {
      ...pending,
      limitation: "PostgreSQL owns query_int parsing and normalization; no local parser or matcher.",
    },
  },
  {
    id: "type:$extension:intarray.intbig_gkey",
    disposition: "internal",
    reason:
      "Captured type intbig_gkey; index, selectivity, or type I/O support that PostgreSQL invokes itself. It is catalog wiring, not an ordinary SQL query member.",
    evidence,
    semantics: { ...pending },
  },
  {
    id: "type:$extension:intarray.query_int",
    disposition: "query",
    reason:
      "query_int is the public boolean query type bound as text through queryCodec, parsed and normalized by PostgreSQL 18 bqarr_in without a local parser.",
    evidence,
    semantics: { ...pending },
  },
] as const;
