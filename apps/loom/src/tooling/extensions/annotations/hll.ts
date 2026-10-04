const hll = "$extension:hll.hll",
  hashval = "$extension:hll.hll_hashval";
const sources = [
  "apps/loom/src/tooling/extensions/manifests/hll.json",
  "https://github.com/citusdata/postgresql-hll/blob/v2.21/README.md",
  "https://github.com/citusdata/postgresql-hll/blob/v2.21/src/hll.c",
  "https://github.com/citusdata/postgresql-hll/blob/v2.21/hll--2.20--2.21.sql",
] as const;
const adapter = "apps/loom/src/core/extensions/adapters/hll.ts";
const tooling = "apps/loom/src/tooling/extensions/hll.ts";
const unit = "packages/tests/unit/extensions-hll.test.ts";
const types = "packages/tests/types/extensions-hll.test-d.ts";
const database = "packages/e2e/integration/extensions-hll.test.ts";
const evidence = [...sources, adapter, unit, types, database] as const;
const pending = {
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  nativeAcceptance: "pending",
} as const;
const query = {
  ...pending,
  authority: "query",
  observability: "tables",
} as const;

function queried(id: string, binding: string, result: string, nulls: string) {
  return {
    id,
    disposition: "query",
    reason: `${binding} binds the captured member with exact qualified SQL; native hll owns hashing, storage and estimation.`,
    evidence,
    semantics: { ...query, result, nulls },
  } as const;
}
function aggregateSlot(id: string, parent: string, slot: "transition" | "final" | "combine" | "serial" | "deserial") {
  return {
    id,
    disposition: "internal",
    reason: `Captured aggregate.${slot} of ${parent}; its pg_catalog.internal state cannot be constructed by SQL and is exercised by the aggregate's native serial and parallel oracles.`,
    evidence,
    parents: [parent],
    proofTransfer: {
      from: [parent],
      relation: { kind: "aggregate-routine", slot },
      basis: "Exact captured pg_aggregate slot",
    },
    semantics: { ...query, parent, slot },
  } as const;
}
function typeSlot(id: string, parent: string, slot: "input" | "output" | "receive" | "typmodOutput") {
  return {
    id,
    disposition: "internal",
    reason: `Captured ${slot} routine of ${parent}; cstring/internal I/O is exercised through the type's native text, field and modifier oracles.`,
    evidence,
    parents: [parent],
    proofTransfer: {
      from: [parent],
      relation: { kind: "type-routine", slot },
      basis: "Exact captured pg_type routine slot",
    },
    semantics: { ...query, parent, slot },
  } as const;
}
const strict = "STRICT: any SQL NULL argument returns SQL NULL";
const addAgg = `routine:$extension:hll.hll_add_agg(${hashval})`;
const unionAgg = `routine:$extension:hll.hll_union_agg(${hll})`;
const aggregateNulls = "Not STRICT: NULL inputs are skipped; an empty or all-NULL group returns SQL NULL";
const unpacked = (name: string, result: string) =>
  ({
    id: `routine:$extension:hll.${name}(pg_catalog.internal)`,
    disposition: "internal",
    reason:
      "Legacy unpacked-cardinality finalizer that no captured aggregate, opfamily or type slot references. PostgreSQL forbids internal-returning routines without an internal argument, so no SQL expression can construct its sole pg_catalog.internal argument; it has no invocation and Kello exports no binding.",
    evidence: [...sources, database],
    semantics: {
      ...pending,
      authority: "none",
      observability: "none",
      result,
      invocation: "unconstructible pg_catalog.internal argument; never invoked natively",
    },
  }) as const;
const setter = (id: string, reason: string, result: string) =>
  ({
    id,
    disposition: "tooling",
    reason: `withHllSession ${reason} on one owned operator backend that is ended afterwards. The setting is process memory: transactions do not restore it and parallel workers ignore it.`,
    evidence: [...sources, tooling, database],
    semantics: {
      ...pending,
      authority: "operator",
      observability: "session",
      result,
      nulls: strict,
    },
  }) as const;

export const hllAnnotationContract = {
  extension: "hll",
  postgresMajor: 18,
  version: "2.21",
  provider: "neon",
  digest: "44f6623b1b7a463ea7cb26fcd02b434cb33c36a4bd9edfe0397e2536f66f6b19",
  providerAcceptance: "pending",
} as const;

/** Exact hll 2.21 dispositions; acceptance remains pending until host native and isolated-consumer proofs. */
export const hllAnnotations = [
  queried(
    `cast:${hll}->${hll}`,
    "sql.casts.hll_to_hll",
    "HllSketch | null",
    "NULL casts to NULL; modifiers are checked by hll(hll,int4,bool)",
  ),
  queried(
    `cast:pg_catalog.bytea->${hll}`,
    "sql.casts.bytea_to_hll",
    "HllSketch | null",
    "Binary-coercible; hll_in-equivalent validation happens on use",
  ),
  queried(`cast:pg_catalog.int4->${hashval}`, "sql.casts.int4_to_hll_hashval", "HllHashval | null", strict),
  queried(`cast:pg_catalog.int8->${hashval}`, "sql.casts.int8_to_hll_hashval", "HllHashval | null", strict),
  queried(`operator:$extension:hll.#(,${hll})`, "sql.operators.cardinality", "number | NonfiniteNumber | null", strict),
  queried(
    `operator:$extension:hll.<>(${hashval},${hashval})`,
    "sql.operators.hashvalNotEqual",
    "boolean | null",
    strict,
  ),
  queried(`operator:$extension:hll.<>(${hll},${hll})`, "notEqual / sql.operators.notEqual", "boolean | null", strict),
  queried(`operator:$extension:hll.=(${hashval},${hashval})`, "sql.operators.hashvalEqual", "boolean | null", strict),
  queried(`operator:$extension:hll.=(${hll},${hll})`, "equal / sql.operators.equal", "boolean | null", strict),
  queried(`operator:$extension:hll.||(${hashval},${hll})`, "sql.operators.addReverse", "HllSketch | null", strict),
  queried(`operator:$extension:hll.||(${hll},${hashval})`, "sql.operators.add", "HllSketch | null", strict),
  queried(`operator:$extension:hll.||(${hll},${hll})`, "sql.operators.union", "HllSketch | null", strict),
  queried(
    `routine:$extension:hll.hll_add_agg(${hashval},pg_catalog.int4,pg_catalog.int4,pg_catalog.int8,pg_catalog.int4)`,
    "addAggregate.sparseon",
    "HllSketch | null",
    aggregateNulls,
  ),
  queried(
    `routine:$extension:hll.hll_add_agg(${hashval},pg_catalog.int4,pg_catalog.int4,pg_catalog.int8)`,
    "addAggregate.expthresh",
    "HllSketch | null",
    aggregateNulls,
  ),
  queried(
    `routine:$extension:hll.hll_add_agg(${hashval},pg_catalog.int4,pg_catalog.int4)`,
    "addAggregate.regwidth",
    "HllSketch | null",
    aggregateNulls,
  ),
  queried(
    `routine:$extension:hll.hll_add_agg(${hashval},pg_catalog.int4)`,
    "addAggregate.log2m",
    "HllSketch | null",
    aggregateNulls,
  ),
  queried(addAgg, "addAggregate.hashval", "HllSketch | null", aggregateNulls),
  queried(
    `routine:$extension:hll.hll_add_rev(${hashval},${hll})`,
    "sql.functions.hll_add_rev",
    "HllSketch | null",
    strict,
  ),
  aggregateSlot(`routine:$extension:hll.hll_add_trans0(pg_catalog.internal,${hashval})`, addAgg, "transition"),
  aggregateSlot(
    `routine:$extension:hll.hll_add_trans1(pg_catalog.internal,${hashval},pg_catalog.int4)`,
    `routine:$extension:hll.hll_add_agg(${hashval},pg_catalog.int4)`,
    "transition",
  ),
  aggregateSlot(
    `routine:$extension:hll.hll_add_trans2(pg_catalog.internal,${hashval},pg_catalog.int4,pg_catalog.int4)`,
    `routine:$extension:hll.hll_add_agg(${hashval},pg_catalog.int4,pg_catalog.int4)`,
    "transition",
  ),
  aggregateSlot(
    `routine:$extension:hll.hll_add_trans3(pg_catalog.internal,${hashval},pg_catalog.int4,pg_catalog.int4,pg_catalog.int8)`,
    `routine:$extension:hll.hll_add_agg(${hashval},pg_catalog.int4,pg_catalog.int4,pg_catalog.int8)`,
    "transition",
  ),
  aggregateSlot(
    `routine:$extension:hll.hll_add_trans4(pg_catalog.internal,${hashval},pg_catalog.int4,pg_catalog.int4,pg_catalog.int8,pg_catalog.int4)`,
    `routine:$extension:hll.hll_add_agg(${hashval},pg_catalog.int4,pg_catalog.int4,pg_catalog.int8,pg_catalog.int4)`,
    "transition",
  ),
  queried(
    `routine:$extension:hll.hll_add(${hll},${hashval})`,
    "add / sql.functions.hll_add",
    "HllSketch | null",
    strict,
  ),
  unpacked("hll_card_unpacked", "float8"),
  queried(
    `routine:$extension:hll.hll_cardinality(${hll})`,
    "cardinality / sql.functions.hll_cardinality",
    "number | NonfiniteNumber | null",
    strict,
  ),
  unpacked("hll_ceil_card_unpacked", "int8"),
  aggregateSlot("routine:$extension:hll.hll_deserialize(pg_catalog.bytea,pg_catalog.internal)", addAgg, "deserial"),
  queried(
    "routine:$extension:hll.hll_empty()",
    "empty.defaults",
    "HllSketch",
    "No arguments; uses the backend's built-in defaults",
  ),
  queried(
    "routine:$extension:hll.hll_empty(pg_catalog.int4,pg_catalog.int4,pg_catalog.int8,pg_catalog.int4)",
    "empty.sparseon",
    "HllSketch | null",
    strict,
  ),
  queried(
    "routine:$extension:hll.hll_empty(pg_catalog.int4,pg_catalog.int4,pg_catalog.int8)",
    "empty.expthresh",
    "HllSketch | null",
    strict,
  ),
  queried(
    "routine:$extension:hll.hll_empty(pg_catalog.int4,pg_catalog.int4)",
    "empty.regwidth",
    "HllSketch | null",
    strict,
  ),
  queried("routine:$extension:hll.hll_empty(pg_catalog.int4)", "empty.log2m", "HllSketch | null", strict),
  queried(`routine:$extension:hll.hll_eq(${hll},${hll})`, "sql.functions.hll_eq", "boolean | null", strict),
  queried(
    `routine:$extension:hll.hll_expthresh(${hll})`,
    "sql.functions.hll_expthresh",
    "{ specified: bigint; effective: bigint } | null",
    strict,
  ),
  unpacked("hll_floor_card_unpacked", "int8"),
  queried(
    "routine:$extension:hll.hll_hash_any(pg_catalog.anyelement,pg_catalog.int4)",
    "hash.any (SQL expressions only)",
    "HllHashval | null",
    strict,
  ),
  queried(
    "routine:$extension:hll.hll_hash_bigint(pg_catalog.int8,pg_catalog.int4)",
    "hash.bigint",
    "HllHashval | null",
    strict,
  ),
  queried(
    "routine:$extension:hll.hll_hash_boolean(pg_catalog.bool,pg_catalog.int4)",
    "hash.boolean",
    "HllHashval | null",
    strict,
  ),
  queried(
    "routine:$extension:hll.hll_hash_bytea(pg_catalog.bytea,pg_catalog.int4)",
    "hash.bytea",
    "HllHashval | null",
    strict,
  ),
  queried(
    "routine:$extension:hll.hll_hash_integer(pg_catalog.int4,pg_catalog.int4)",
    "hash.integer",
    "HllHashval | null",
    strict,
  ),
  queried(
    "routine:$extension:hll.hll_hash_smallint(pg_catalog.int2,pg_catalog.int4)",
    "hash.smallint",
    "HllHashval | null",
    strict,
  ),
  queried(
    "routine:$extension:hll.hll_hash_text(pg_catalog.text,pg_catalog.int4)",
    "hash.text",
    "HllHashval | null",
    strict,
  ),
  queried(
    `routine:$extension:hll.hll_hashval_eq(${hashval},${hashval})`,
    "sql.functions.hll_hashval_eq",
    "boolean | null",
    strict,
  ),
  typeSlot(
    "routine:$extension:hll.hll_hashval_in(pg_catalog.cstring,pg_catalog.oid,pg_catalog.int4)",
    `type:${hashval}`,
    "input",
  ),
  queried(
    "routine:$extension:hll.hll_hashval_int4(pg_catalog.int4)",
    "sql.functions.hll_hashval_int4",
    "HllHashval | null",
    strict,
  ),
  queried(
    `routine:$extension:hll.hll_hashval_ne(${hashval},${hashval})`,
    "sql.functions.hll_hashval_ne",
    "boolean | null",
    strict,
  ),
  typeSlot(`routine:$extension:hll.hll_hashval_out(${hashval})`, `type:${hashval}`, "output"),
  queried(
    "routine:$extension:hll.hll_hashval(pg_catalog.int8)",
    "sql.functions.hll_hashval",
    "HllHashval | null",
    strict,
  ),
  typeSlot("routine:$extension:hll.hll_in(pg_catalog.cstring,pg_catalog.oid,pg_catalog.int4)", `type:${hll}`, "input"),
  queried(`routine:$extension:hll.hll_log2m(${hll})`, "sql.functions.hll_log2m", "number | null", strict),
  queried(`routine:$extension:hll.hll_ne(${hll},${hll})`, "sql.functions.hll_ne", "boolean | null", strict),
  typeSlot(`routine:$extension:hll.hll_out(${hll})`, `type:${hll}`, "output"),
  aggregateSlot("routine:$extension:hll.hll_pack(pg_catalog.internal)", addAgg, "final"),
  queried(`routine:$extension:hll.hll_print(${hll})`, "sql.functions.hll_print", "string | null", strict),
  typeSlot("routine:$extension:hll.hll_recv(pg_catalog.internal)", `type:${hll}`, "receive"),
  queried(`routine:$extension:hll.hll_regwidth(${hll})`, "sql.functions.hll_regwidth", "number | null", strict),
  queried(
    `routine:$extension:hll.hll_schema_version(${hll})`,
    "sql.functions.hll_schema_version",
    "number | null",
    strict,
  ),
  queried(`routine:$extension:hll.hll_send(${hll})`, "sql.functions.hll_send", "{ hex: string } | null", strict),
  aggregateSlot("routine:$extension:hll.hll_serialize(pg_catalog.internal)", addAgg, "serial"),
  setter(
    "routine:$extension:hll.hll_set_defaults(pg_catalog.int4,pg_catalog.int4,pg_catalog.int8,pg_catalog.int4)",
    "setDefaults changes hll_empty() and modifier-less aggregate defaults",
    "previous HllDefaults",
  ),
  setter(
    "routine:$extension:hll.hll_set_max_sparse(pg_catalog.int4)",
    "setMaxSparse changes sparse promotion",
    "previous int4",
  ),
  setter(
    "routine:$extension:hll.hll_set_output_version(pg_catalog.int4)",
    "setOutputVersion accepts version 1 only",
    "previous int4",
  ),
  queried(`routine:$extension:hll.hll_sparseon(${hll})`, "sql.functions.hll_sparseon", "number | null", strict),
  queried(`routine:$extension:hll.hll_type(${hll})`, "sql.functions.hll_type", "number | null", strict),
  queried(
    "routine:$extension:hll.hll_typmod_in(pg_catalog._cstring)",
    "sql.functions.hll_typmod_in",
    "number | null",
    strict,
  ),
  typeSlot("routine:$extension:hll.hll_typmod_out(pg_catalog.int4)", `type:${hll}`, "typmodOutput"),
  queried(unionAgg, "unionAggregate / sql.functions.hll_union_agg", "HllSketch | null", aggregateNulls),
  aggregateSlot(
    "routine:$extension:hll.hll_union_internal(pg_catalog.internal,pg_catalog.internal)",
    addAgg,
    "combine",
  ),
  aggregateSlot(`routine:$extension:hll.hll_union_trans(pg_catalog.internal,${hll})`, unionAgg, "transition"),
  queried(
    `routine:$extension:hll.hll_union(${hll},${hll})`,
    "union / sql.functions.hll_union",
    "HllSketch | null",
    strict,
  ),
  queried(
    `routine:$extension:hll.hll(${hll},pg_catalog.int4,pg_catalog.bool)`,
    "sql.functions.hll",
    "HllSketch | null",
    strict,
  ),
  {
    id: "type:$extension:hll._hll",
    disposition: "schema",
    reason: "arrayField / arrayCodec map native hll[] with bounds, NULL elements and up to six dimensions.",
    evidence,
    semantics: { ...pending, codec: "pg:array:1,:,hll:hll:hex:1" },
  },
  {
    id: "type:$extension:hll._hll_hashval",
    disposition: "schema",
    reason: "hashvalArrayField / hashvalArrayCodec map native hll_hashval[] with bounds and NULL elements.",
    evidence,
    semantics: { ...pending, codec: "pg:array:1,:,hll:hll_hashval:int8:1" },
  },
  {
    id: `type:${hll}`,
    disposition: "schema",
    reason:
      "field(modifier?) / codec store opaque hll bytes as lowercase hex; typmods map to hll(log2m,regwidth,expthresh,sparseon).",
    evidence,
    semantics: { ...pending, codec: "hll:hll:hex:1" },
  },
  {
    id: `type:${hashval}`,
    disposition: "schema",
    reason: "hashvalField / hashvalCodec map hll_hashval to an exact signed 64-bit bigint.",
    evidence,
    semantics: { ...pending, codec: "hll:hll_hashval:int8:1" },
  },
] as const;
