const T = "$extension:roaringbitmap.roaringbitmap",
  T64 = "$extension:roaringbitmap.roaringbitmap64",
  I4 = "pg_catalog.int4",
  I8 = "pg_catalog.int8",
  internalType = "pg_catalog.internal";
const sources = [
  "apps/loom/src/tooling/extensions/manifests/roaringbitmap.json",
  "https://github.com/ChenHuajun/pg_roaringbitmap/blob/v1.2.0/README.md",
  "https://github.com/ChenHuajun/pg_roaringbitmap/blob/v1.2.0/roaringbitmap--1.2.sql",
  "https://github.com/ChenHuajun/pg_roaringbitmap/blob/v1.2.0/roaringbitmap.c",
  "https://github.com/ChenHuajun/pg_roaringbitmap/blob/v1.2.0/roaringbitmap64.c",
  "https://github.com/ChenHuajun/pg_roaringbitmap/blob/v1.2.0/roaring.c: CRoaring portable serialization (cookies 12346/12347, 64-bit bucket extension)",
] as const;
const adapter = "apps/loom/src/core/extensions/adapters/roaringbitmap.ts";
const codecs = "apps/loom/src/core/extensions/adapters/roaringbitmap-codecs.ts";
const unit = "packages/tests/unit/extensions-roaringbitmap.test.ts";
const types = "packages/tests/types/extensions-roaringbitmap.test-d.ts";
const database = "packages/e2e/integration/extensions-roaringbitmap.test.ts";
const session = "apps/loom/src/tooling/extensions/operations/roaringbitmap.ts";
const evidence = [...sources, adapter, codecs, session, unit, types, database] as const;
const pending = {
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  nativeAcceptance: "pending",
} as const;
const query = { ...pending, authority: "query", observability: "tables" } as const;
const strict = "STRICT: any SQL NULL argument returns SQL NULL";
const aggregateNulls =
  "Not STRICT: NULL inputs are skipped; an empty or all-NULL group returns SQL NULL; DISTINCT is unavailable because the bitmap types have no btree/hash opclass";
const buildNulls = "Not STRICT: NULL members are skipped; an empty or all-NULL group returns SQL NULL";
const order =
  "Members are produced in native unsigned order: non-negative values ascending, then negative two's-complement values ascending";

type Width = {
  readonly prefix: "rb" | "rb64";
  readonly type: string;
  readonly element: string;
  readonly elements: string;
  readonly value: string;
  readonly member: string;
  readonly ranges: string;
};
const widths: readonly Width[] = [
  {
    prefix: "rb",
    type: T,
    element: I4,
    elements: "pg_catalog._int4",
    value: "RoaringBitmap",
    member: "number",
    ranges:
      "int8 bounds are half-open [start,end); negative bounds clamp to 0 and end clamps to 4294967296, so negative int4 members (unsigned 2147483648..4294967295) are addressed by their unsigned position",
  },
  {
    prefix: "rb64",
    type: T64,
    element: I8,
    elements: "pg_catalog._int8",
    value: "RoaringBitmap64",
    member: "bigint",
    ranges:
      "int8 bounds are reinterpreted as uint64 and half-open [start,end); end 0 means the unbounded end 2^64, and negative bounds address the upper unsigned half",
  },
];

function queried(id: string, binding: string, result: string, nulls: string, semantics: string) {
  return {
    id,
    disposition: "query",
    reason: `${binding} binds the captured member with exact qualified SQL. ${semantics}`,
    evidence,
    semantics: { ...query, result, nulls },
  } as const;
}
function typed(id: string, binding: string, result: string, semantics: string) {
  return {
    id,
    disposition: "schema",
    reason: `${binding} declares the captured type with its exact native codec. ${semantics}`,
    evidence,
    semantics: { ...pending, authority: "schema", observability: "tables", result, nulls: "Nullable column value" },
  } as const;
}
function aggregateSlot(
  id: string,
  parent: string,
  slot: "transition" | "final" | "combine" | "serial" | "deserial",
) {
  return {
    id,
    disposition: "internal",
    reason: `Captured aggregate.${slot} of ${parent}; its pg_catalog.internal state cannot be constructed by SQL and is exercised by the aggregate's native oracle.`,
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
function typeSlot(id: string, parent: string, slot: "input" | "output" | "receive") {
  return {
    id,
    disposition: "internal",
    reason: `Captured ${slot} routine of ${parent}; native text input/output and native-send Buffer Bind parameters (including array_send/array_recv) exercise its cstring/internal I/O independently of adapter encoding.`,
    evidence,
    parents: [parent],
    proofTransfer: { from: [parent], relation: { kind: "type-routine", slot }, basis: "Exact captured pg_type routine slot" },
    semantics: { ...query, parent, slot },
  } as const;
}

function widthAnnotations({ prefix, type, element, elements, value, member, ranges }: Width) {
  const routine = (name: string, signature: string) => `routine:$extension:roaringbitmap.${prefix}_${name}(${signature})`;
  const binding = (name: string) => `sql.functions.${prefix}_${name}`;
  const pair = `${type},${type}`,
    range = `${type},${I8},${I8}`,
    withElement = `${type},${element}`;
  const nullable = `${value} | null`;
  const algebra = (name: string, operation: string) =>
    queried(routine(name, pair), binding(name), nullable, strict, `${operation}; ${order}.`);
  const cardinality = (name: string, operation: string) =>
    queried(routine(name, pair), binding(name), "bigint | null", strict, `Exact int8 cardinality of ${operation}.`);
  const predicate = (name: string, operation: string) =>
    queried(routine(name, pair), binding(name), "boolean | null", strict, operation);
  const aggregate = (name: string, result: string, operation: string) =>
    queried(routine(name, type), `${binding(name)} (no DISTINCT)`, result, aggregateNulls, operation);
  const ranged = (name: string, operation: string) =>
    queried(routine(name, range), binding(name), nullable, strict, `${operation}; ${ranges}.`);
  const op = (name: string, left: string, right: string, path: string, result: string, operation: string) =>
    queried(
      `operator:$extension:roaringbitmap.${name}(${left},${right})`,
      `sql.operators.${type === T ? "roaringbitmap" : "roaringbitmap64"}.${path}`,
      result,
      strict,
      operation,
    );
  const and = routine("and_agg", type),
    or = routine("or_agg", type),
    xor = routine("xor_agg", type),
    andCount = routine("and_cardinality_agg", type),
    build = routine("build_agg", element);
  const trans = (name: string) => routine(name, `${internalType},${type}`);
  const combine = (name: string) => routine(name, `${internalType},${internalType}`);
  return [
    queried(routine("add", withElement), `${binding("add")}.bitmapElement`, nullable, strict, "Adds one member."),
    queried(routine("add", `${element},${type}`), `${binding("add")}.elementBitmap`, nullable, strict, "Adds one member."),
    aggregate("and_agg", nullable, `Intersection of non-NULL group bitmaps; ${order}.`),
    aggregate("and_cardinality_agg", "bigint | null", "Exact int8 cardinality of the group intersection."),
    cardinality("and_cardinality", "the intersection"),
    aggregateSlot(combine("and_combine"), and, "combine"),
    aggregateSlot(trans("and_trans"), and, "transition"),
    algebra("and", "Intersection"),
    cardinality("andnot_cardinality", "the left difference"),
    algebra("andnot", "Left difference"),
    queried(build, `${binding("build_agg")} (DISTINCT allowed)`, nullable, buildNulls, `Builds a bitmap from ${member} members; ${order}.`),
    aggregateSlot(routine("build_trans", `${internalType},${element}`), build, "transition"),
    queried(
      routine("build", elements),
      binding("build"),
      nullable,
      strict,
      `Flattens a PostgreSqlArray of every dimension; NULL elements are rejected natively; ${order}.`,
    ),
    aggregateSlot(routine("cardinality_final", internalType), andCount, "final"),
    queried(routine("cardinality", type), binding("cardinality"), "bigint | null", strict, "Exact int8 member count."),
    ranged("clear", "Removes members in the range"),
    predicate("containedby", "Left is a subset of right."),
    queried(routine("containedby", `${element},${type}`), `${binding("containedby")}.element`, "boolean | null", strict, "Member is in the bitmap."),
    predicate("contains", "Left is a superset of right."),
    queried(routine("contains", withElement), `${binding("contains")}.element`, "boolean | null", strict, "Bitmap contains the member."),
    aggregateSlot(routine("deserialize", `pg_catalog.bytea,${internalType}`), and, "deserial"),
    predicate("equals", "Set equality."),
    ranged("fill", "Adds every member in the range"),
    aggregateSlot(routine("final", internalType), and, "final"),
    ranged("flip", "Toggles every member in the range"),
    queried(
      routine("index", withElement),
      binding("index"),
      "bigint | null",
      strict,
      "Zero-based native-order position of the member, or -1 when absent.",
    ),
    predicate("intersect", "Bitmaps share at least one member."),
    queried(routine("is_empty", type), binding("is_empty"), "boolean | null", strict, "Bitmap has no members."),
    queried(
      routine("iterate", type),
      binding("iterate"),
      `SETOF ${member}`,
      strict,
      `Set-returning: one row per member; ${order}.`,
    ),
    queried(
      routine("jaccard_dist", pair),
      binding("jaccard_dist"),
      "number | NonfiniteNumber | null",
      strict,
      "Native CRoaring Jaccard index |A∩B|/|A∪B| despite the name; two empty bitmaps yield NaN.",
    ),
    queried(routine("max", type), binding("max"), `${member} | null`, strict, "Last member in native unsigned order (so -1 outranks every non-negative member); empty bitmap returns NULL."),
    queried(routine("min", type), binding("min"), `${member} | null`, strict, "First member in native unsigned order; empty bitmap returns NULL."),
    predicate("not_equals", "Set inequality."),
    aggregate("or_agg", nullable, `Union of non-NULL group bitmaps; ${order}.`),
    aggregate("or_cardinality_agg", "bigint | null", "Exact int8 cardinality of the group union."),
    cardinality("or_cardinality", "the union"),
    aggregateSlot(combine("or_combine"), or, "combine"),
    aggregateSlot(trans("or_trans"), or, "transition"),
    algebra("or", "Union"),
    queried(routine("range_cardinality", range), binding("range_cardinality"), "bigint | null", strict, `Counts members in the range; ${ranges}.`),
    ranged("range", "Keeps members in the range"),
    queried(
      routine("rank", withElement),
      binding("rank"),
      "bigint | null",
      strict,
      "Number of members less than or equal to the argument in native unsigned order.",
    ),
    queried(routine("remove", withElement), binding("remove"), nullable, strict, "Removes one member."),
    queried(routine("runoptimize", type), binding("runoptimize"), nullable, strict, "Same members with run-container storage where smaller."),
    queried(
      routine("select", `${type},${I8},${I8},pg_catalog.bool,${I8},${I8}`),
      binding("select"),
      nullable,
      strict,
      `Arguments bitmap, bitset_limit, then named defaults bitset_offset 0, reverse false, range_start 0, range_end ${prefix === "rb" ? "4294967296" : "0 (unbounded)"}; non-positive limit returns an empty bitmap; ${ranges}.`,
    ),
    aggregateSlot(routine("serialize", internalType), and, "serial"),
    queried(
      routine("shiftleft", `${type},${I8}`),
      binding("shiftleft"),
      nullable,
      strict,
      "Subtracts the distance from every member, dropping members that leave the unsigned domain.",
    ),
    queried(
      routine("shiftright", `${type},${I8}`),
      binding("shiftright"),
      nullable,
      strict,
      "Adds the distance to every member, dropping members that leave the unsigned domain.",
    ),
    queried(
      routine("to_array", type),
      binding("to_array"),
      `PostgreSqlArray<${member}> | null`,
      strict,
      `One-dimensional, NULL-free, lower bound 1; ${order}.`,
    ),
    aggregate("xor_agg", nullable, `Symmetric difference of non-NULL group bitmaps; ${order}.`),
    aggregate("xor_cardinality_agg", "bigint | null", "Exact int8 cardinality of the group symmetric difference."),
    cardinality("xor_cardinality", "the symmetric difference"),
    aggregateSlot(combine("xor_combine"), xor, "combine"),
    aggregateSlot(trans("xor_trans"), xor, "transition"),
    algebra("xor", "Symmetric difference"),
    op("-", type, type, "andnot", nullable, "Left difference."),
    op("-", type, element, "remove", nullable, "Removes one member."),
    op("@>", type, type, "contains", "boolean | null", "Superset."),
    op("@>", type, element, "containsElement", "boolean | null", "Contains the member."),
    op("&", type, type, "and", nullable, "Intersection."),
    op("&&", type, type, "intersect", "boolean | null", "Bitmaps share at least one member."),
    op("#", type, type, "xor", nullable, "Symmetric difference."),
    op("<@", type, type, "containedBy", "boolean | null", "Subset."),
    op("<@", element, type, "elementContainedBy", "boolean | null", "Member is in the bitmap."),
    op("<<", type, I8, "shiftLeft", nullable, "rb_shiftleft: subtracts the distance."),
    op("<>", type, type, "notEqual", "boolean | null", "Set inequality."),
    op("=", type, type, "equal", "boolean | null", "Set equality."),
    op(">>", type, I8, "shiftRight", nullable, "rb_shiftright: adds the distance."),
    op("|", type, type, "or", nullable, "Union."),
    op("|", type, element, "add", nullable, "Adds one member."),
    op("|", element, type, "addReverse", nullable, "Adds one member."),
  ];
}

const bytes =
  "Exact CRoaring portable bytes as pg_roaringbitmap stores them; bytea output follows bytea_output (hex or escape) and decodes to lowercase hex.";
const io = (name: "roaringbitmap" | "roaringbitmap64", type: string, value: string) => [
  typeSlot(`routine:$extension:roaringbitmap.${name}_in(pg_catalog.cstring)`, `type:${type}`, "input"),
  typeSlot(`routine:$extension:roaringbitmap.${name}_out(${type})`, `type:${type}`, "output"),
  typeSlot(`routine:$extension:roaringbitmap.${name}_recv(${internalType})`, `type:${type}`, "receive"),
  queried(
    `routine:$extension:roaringbitmap.${name}_send(${type})`,
    `sql.functions.${name}_send`,
    "{ hex: string } | null",
    strict,
    `Binary send routine is SQL-callable with an ordinary bitmap argument. ${bytes}`,
  ),
  queried(
    `routine:$extension:roaringbitmap.${name}(pg_catalog.bytea)`,
    `sql.functions.${name}`,
    `${value} | null`,
    strict,
    "Validates portable bytes (CRoaring internal validation) and reserializes them; malformed bytes raise 'bitmap format is error'.",
  ),
];
const text =
  "Encoded as roaringbitmap_in array text. roaringbitmap.output_format defaults to bytea, so selected values arrive as portable bytes (bytea hex or escape) or, when a session selects array output, '{...}' text; both decode to the same members in native unsigned order.";

export const roaringbitmapAnnotationContract = {
  extension: "roaringbitmap",
  postgresMajor: 18,
  version: "1.2",
  provider: "neon",
  digest: "967ad98be988b37be7f198057e9f02bcbe325a0eab5364722ba4c6763cbc406a",
  providerAcceptance: "pending",
} as const;

const searchPath =
  "SQL-language member (or operator over one) whose body calls an unqualified rb_add, rb_contains or rb_shiftright: an ordinary query resolves it only when the extension schema is already on the session search_path; otherwise PostgreSQL raises 42883. withRoaringbitmapSession runs it on an owned operator backend whose transaction-local search_path is exactly the extension schema and pg_catalog, and reports that setting before, during and after.";
/** Captured LANGUAGE sql routines with empty configuration, and the operators whose procedure is one of them. */
export const roaringbitmapSearchPathMembers = new Set(
  widths.flatMap(({ prefix, type, element }) => [
    `routine:$extension:roaringbitmap.${prefix}_add(${element},${type})`,
    `routine:$extension:roaringbitmap.${prefix}_containedby(${element},${type})`,
    `routine:$extension:roaringbitmap.${prefix}_shiftleft(${type},${I8})`,
    `operator:$extension:roaringbitmap.|(${element},${type})`,
    `operator:$extension:roaringbitmap.<@(${element},${type})`,
    `operator:$extension:roaringbitmap.<<(${type},${I8})`,
  ]),
);

/** Exact roaringbitmap 1.2 dispositions; acceptance remains pending until host native and isolated-consumer proofs. */
export const roaringbitmapAnnotations = [
  queried(`cast:${T}->${T64}`, "sql.casts.roaringbitmap_to_roaringbitmap64", "RoaringBitmap64 | null", strict, "Explicit cast via rb64_from_roaringbitmap: each int4 member is sign-extended, so -1 becomes int8 -1 (uint64 2^64-1)."),
  queried(`cast:${T}->pg_catalog.bytea`, "sql.casts.roaringbitmap_to_bytea", "{ hex: string } | null", "Binary-coercible: NULL casts to NULL", `Explicit binary cast. ${bytes}`),
  queried(`cast:${T64}->${T}`, "sql.casts.roaringbitmap64_to_roaringbitmap", "RoaringBitmap | null", strict, "Explicit cast via rb64_to_roaringbitmap: each signed int8 member must fit int4 (so -1 stays -1); any other member raises 'out of range for type integer'."),
  queried(`cast:${T64}->pg_catalog.bytea`, "sql.casts.roaringbitmap64_to_bytea", "{ hex: string } | null", "Binary-coercible: NULL casts to NULL", `Explicit binary cast. ${bytes}`),
  queried(`cast:pg_catalog.bytea->${T}`, "sql.casts.bytea_to_roaringbitmap", "RoaringBitmap | null", strict, "Explicit cast via roaringbitmap(bytea), which validates the portable bytes."),
  queried(`cast:pg_catalog.bytea->${T64}`, "sql.casts.bytea_to_roaringbitmap64", "RoaringBitmap64 | null", strict, "Explicit cast via roaringbitmap64(bytea), which validates the portable bytes."),
  ...widths.flatMap(widthAnnotations),
  queried(`routine:$extension:roaringbitmap.rb64_from_roaringbitmap(${T})`, "sql.functions.rb64_from_roaringbitmap", "RoaringBitmap64 | null", strict, "Sign-extends each int4 member into int8."),
  queried(`routine:$extension:roaringbitmap.rb64_to_roaringbitmap(${T64})`, "sql.functions.rb64_to_roaringbitmap", "RoaringBitmap | null", strict, "Narrows each signed int8 member to int4 (so -1 stays -1); any member outside int4 raises 'out of range for type integer'."),
  ...io("roaringbitmap", T, "RoaringBitmap"),
  ...io("roaringbitmap64", T64, "RoaringBitmap64"),
  typed(`type:$extension:roaringbitmap._roaringbitmap`, "arrayField / arrayCodec", "PostgreSqlArray<RoaringBitmap>", "Bounded PostgreSQL array (at most 6 dimensions) with NULL elements preserved; no search operators."),
  typed(`type:$extension:roaringbitmap._roaringbitmap64`, "array64Field / array64Codec", "PostgreSqlArray<RoaringBitmap64>", "Bounded PostgreSQL array (at most 6 dimensions) with NULL elements preserved; no search operators."),
  typed(`type:${T}`, "field / codec", "RoaringBitmap", `Signed int4 members. ${text} Equality filters only; no ordering opclass.`),
  typed(`type:${T64}`, "field64 / codec64", "RoaringBitmap64", `Signed int8 members as PostgreSQL prints uint64 values. ${text} Equality filters only; no ordering opclass.`),
].map((annotation) =>
  roaringbitmapSearchPathMembers.has(annotation.id)
    ? {
        ...annotation,
        reason: `${annotation.reason} ${searchPath}`,
        semantics: { ...annotation.semantics, limitation: searchPath },
      }
    : annotation,
);
