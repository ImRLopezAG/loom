const evidence = [
  "apps/loom/src/tooling/extensions/manifests/semver.json",
  "https://github.com/theory/pg-semver/blob/v0.40.0/doc/semver.mmd",
  "https://github.com/theory/pg-semver/blob/v0.40.0/src/semver.c",
  "https://github.com/theory/pg-semver/blob/v0.40.0/sql/semver.sql",
  "apps/loom/src/core/extensions/adapters/semver.ts",
  "apps/loom/src/core/extensions/adapters/semver-codecs.ts",
  "packages/tests/unit/extensions-semver.test.ts: semver_out fixed-point grammar, every member identity, overload SQL and casts",
  "packages/tests/types/extensions-semver.test-d.ts: exact semver/range/multirange inputs, nullable strict results and overload arity",
  "packages/e2e/integration/extensions-semver.test.ts: every public routine, operator and cast against native semver 0.40.0 on PostgreSQL 18",
  "apps/loom/src/tooling/extensions/operations/semver.ts: owned operator session for the twelve numeric constructors and casts",
] as const;
const common = {
  authority: "query",
  observability: "tables",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
const version = "$extension:semver.semver";
const range = "$extension:semver.semverrange";
const multirange = "$extension:semver.semvermultirange";
const binary = `(${version},${version})`;
const strict = { nulls: "NULL for any NULL argument" } as const;
const precedence =
  "SemVer 2.0 precedence: numeric major/minor/patch, prerelease before release, build metadata ignored by equality, ordering and hashing.";

function query(id: string, reason: string, semantics: Readonly<Record<string, string>>) {
  return { id, disposition: "query", reason, evidence, semantics: { ...common, ...semantics } } as const;
}
function schema(id: string, reason: string, semantics: Readonly<Record<string, string>> = {}) {
  return { id, disposition: "schema", reason, evidence, semantics: { ...common, ...semantics } } as const;
}
function internal(id: string, parent: string) {
  return {
    id,
    disposition: "internal",
    reason:
      "Backend callback or access-method catalog wiring; exercised only through the owning native type or index path.",
    evidence,
    semantics: { providerAcceptance: "pending", publicExportAcceptance: "pending", parent },
  } as const;
}
const comparisons = [
  ["<", "lessThan"],
  ["<=", "lessOrEqual"],
  ["<>", "notEqual"],
  ["=", "equal"],
  [">", "greaterThan"],
  [">=", "greaterOrEqual"],
] as const;
const predicates = ["semver_eq", "semver_ge", "semver_gt", "semver_le", "semver_lt", "semver_ne"] as const;
const numericSources = [
  ["float4", "fromFloat4", "Shortest float4 decimal spelling"],
  ["float8", "fromFloat8", "Shortest float8 decimal spelling"],
  ["int2", "fromInt2", "Integer becomes major.0.0; native int2 conversion rejects -32768"],
  ["int4", "fromInt4", "Integer becomes major.0.0; negative values become 0.0.0-N"],
  ["int8", "fromInt8", "Integer becomes major.0.0; values beyond 31 bits are rejected"],
  ["numeric", "fromNumeric", "Decimal text is coerced by to_semver; NaN and negatives become 0.0.0 prereleases"],
] as const;
const searchPath =
  "SQL-language wrapper calls unqualified to_semver: an ordinary query resolves it only when the extension schema is already on the session search_path (as with a public placement); otherwise PostgreSQL raises 42883. withSemverSession runs it on an owned operator backend whose transaction-local search_path is exactly the extension schema and pg_catalog, and reports that setting before, during and after.";
const btreeFamily = '"$extension:semver".semver_ops USING btree';
const hashFamily = '"$extension:semver".semver_ops USING hash';
const amMember = (kind: "function" | "operator", strategy: number, family: string) =>
  `${kind} of access method:${kind} ${strategy} ("$extension:semver".semver, "$extension:semver".semver) of ${family}`;

/** Exact semver 0.40.0 dispositions; acceptance remains pending until host native and isolated-consumer proofs. */
export const semverAnnotations = [
  query(
    `cast:${version}->pg_catalog.text`,
    "sql.casts.semver_to_text emits the explicit qualified cast; text keeps build metadata exactly as semver_out prints it.",
    { ...strict, context: "explicit", method: "function", result: "string | null" },
  ),
  query(
    `cast:${range}->${multirange}`,
    "sql.casts.semverrange_to_semvermultirange wraps one range; empty ranges become the empty multirange.",
    { ...strict, context: "explicit", method: "function", result: "SemverMultirange | null" },
  ),
  ...numericSources.map(([type, alias, behavior]) =>
    query(
      `cast:pg_catalog.${type}->${version}`,
      `sql.casts.${type}_to_semver emits the explicit qualified cast through the captured semver(${type}) routine (${alias} is the routine alias).`,
      {
        ...strict,
        context: "explicit",
        method: "function",
        coercion: behavior,
        limitation: searchPath,
        result: "SemverText | null",
      },
    ),
  ),
  query(
    `cast:pg_catalog.text->${version}`,
    "sql.casts.text_to_semver emits the explicit qualified cast; strict semver input, leading whitespace is ignored natively.",
    { ...strict, context: "explicit", method: "function", result: "SemverText | null" },
  ),
  internal(amMember("function", 1, btreeFamily), btreeFamily),
  internal(amMember("function", 1, hashFamily), hashFamily),
  schema(
    "opclass:$extension:semver.semver_ops/btree",
    "indexes.btree() declares the default btree operator class for ordered semver lookups.",
  ),
  schema(
    "opclass:$extension:semver.semver_ops/hash",
    "indexes.hash() declares the default hash operator class; build metadata hashes equal to its release.",
  ),
  internal(amMember("operator", 1, btreeFamily), btreeFamily),
  internal(amMember("operator", 1, hashFamily), hashFamily),
  internal(amMember("operator", 2, btreeFamily), btreeFamily),
  internal(amMember("operator", 3, btreeFamily), btreeFamily),
  internal(amMember("operator", 4, btreeFamily), btreeFamily),
  internal(amMember("operator", 5, btreeFamily), btreeFamily),
  ...comparisons.map(([name, alias]) =>
    query(
      `operator:$extension:semver.${name}${binary}`,
      `${alias} / sql.operators["${name}"] emits the schema-qualified native operator.`,
      { ...strict, ordering: precedence, result: "boolean | null" },
    ),
  ),
  internal("opfamily:$extension:semver.semver_ops/btree", btreeFamily),
  internal("opfamily:$extension:semver.semver_ops/hash", hashFamily),
  ...(["major", "minor", "patch"] as const).map((part) =>
    query(
      `routine:$extension:semver.get_semver_${part}(${version})`,
      `${part} / sql.functions.get_semver_${part} returns the ${part} version number.`,
      { ...strict, result: "number | null", codec: "pg:int4:1:nullable" },
    ),
  ),
  query(
    `routine:$extension:semver.get_semver_prerelease(${version})`,
    "prerelease / sql.functions.get_semver_prerelease returns the prerelease text, or an empty string for a release.",
    { ...strict, result: "string | null" },
  ),
  query(
    `routine:$extension:semver.hash_semver(${version})`,
    "hash / sql.functions.hash_semver returns the native int4 hash; build metadata does not change it.",
    { ...strict, result: "number | null", codec: "pg:int4:1:nullable" },
  ),
  query(
    "routine:$extension:semver.is_semver(pg_catalog.text)",
    "isValid / sql.functions.is_semver reports whether text is strict semver input.",
    { ...strict, result: "boolean | null" },
  ),
  query(
    `routine:$extension:semver.max(${version})`,
    "max / sql.functions.max is the native aggregate, including distinct, filter and window forms.",
    { nulls: "Ignores NULL inputs; NULL for no non-NULL rows", ordering: precedence, result: "SemverText | null" },
  ),
  query(
    `routine:$extension:semver.min(${version})`,
    "min / sql.functions.min is the native aggregate, including distinct, filter and window forms.",
    { nulls: "Ignores NULL inputs; NULL for no non-NULL rows", ordering: precedence, result: "SemverText | null" },
  ),
  query(
    `routine:$extension:semver.semver_cmp${binary}`,
    "compare / sql.functions.semver_cmp returns -1, 0 or 1 by native precedence.",
    { ...strict, ordering: precedence, result: "number | null", codec: "pg:int4:1:nullable" },
  ),
  ...predicates.map((name) =>
    query(
      `routine:$extension:semver.${name}${binary}`,
      `sql.functions.${name} calls the native comparison routine behind its operator.`,
      { ...strict, ordering: precedence, result: "boolean | null" },
    ),
  ),
  internal(`routine:$extension:semver.semver_in(pg_catalog.cstring)`, "type:$extension:semver.semver"),
  query(
    `routine:$extension:semver.semver_larger${binary}`,
    "larger / sql.functions.semver_larger returns the greater value; on equal precedence it returns the first argument.",
    { ...strict, ordering: precedence, result: "SemverText | null" },
  ),
  internal(`routine:$extension:semver.semver_out(${version})`, "type:$extension:semver.semver"),
  internal("routine:$extension:semver.semver_recv(pg_catalog.internal)", "type:$extension:semver.semver"),
  query(`routine:$extension:semver.semver_send(${version})`, "SQL-callable native binary send function.", {
    ...strict,
    result: "{ hex: string } | null",
  }),
  query(
    `routine:$extension:semver.semver_smaller${binary}`,
    "smaller / sql.functions.semver_smaller returns the lesser value; on equal precedence it returns the first argument.",
    { ...strict, ordering: precedence, result: "SemverText | null" },
  ),
  ...numericSources.map(([type, alias, behavior]) =>
    query(
      `routine:$extension:semver.semver(pg_catalog.${type})`,
      `${alias} / sql.functions.semver.${type} binds an exact ${type} parameter to select this overload.`,
      { ...strict, coercion: behavior, limitation: searchPath, result: "SemverText | null" },
    ),
  ),
  query(
    "routine:$extension:semver.semver(pg_catalog.text)",
    "parse / sql.functions.semver.text parses strict semver text; invalid text raises a native error.",
    { ...strict, result: "SemverText | null" },
  ),
  query(
    "routine:$extension:semver.semvermultirange()",
    "multirange() / sql.functions.semvermultirange.empty returns the empty multirange.",
    { nulls: "Zero arguments; never NULL", result: "SemverMultirange" },
  ),
  query(
    "routine:$extension:semver.semvermultirange($extension:semver._semverrange)",
    "multirange(a, b, ...) / sql.functions.semvermultirange.variadic passes a typed VARIADIC array; PostgreSQL sorts and merges the ranges.",
    { nulls: "Elements must be non-NULL ranges", result: "SemverMultirange | null" },
  ),
  query(
    `routine:$extension:semver.semvermultirange(${range})`,
    "multirange(range) / sql.functions.semvermultirange.range wraps one range.",
    { ...strict, result: "SemverMultirange | null" },
  ),
  query(
    `routine:$extension:semver.semverrange(${version},${version},pg_catalog.text)`,
    "range(lower, upper, flags) / sql.functions.semverrange.flags takes the bound flags [), [], (] or ().",
    {
      nulls: "NULL bounds are infinite; NULL flags are rejected natively; never returns NULL",
      result: "SemverRange",
    },
  ),
  query(
    `routine:$extension:semver.semverrange${binary}`,
    "range(lower, upper) / sql.functions.semverrange.bounds builds a [) range.",
    { nulls: "NULL bounds are infinite; never returns NULL", result: "SemverRange" },
  ),
  query(
    `routine:$extension:semver.text(${version})`,
    "toText / sql.functions.text returns semver_out text, keeping build metadata.",
    { ...strict, result: "string | null" },
  ),
  query(
    "routine:$extension:semver.to_semver(pg_catalog.text)",
    "coerce / sql.functions.to_semver applies the native lenient coercion (1.2 becomes 1.2.0, v1 becomes 0.0.0-v1).",
    { ...strict, result: "SemverText | null" },
  ),
  schema("type:$extension:semver._semver", "arrayField() stores native semver arrays with their dimension bounds."),
  schema(
    "type:$extension:semver._semvermultirange",
    "multirangeArrayField() stores native semvermultirange arrays with their dimension bounds.",
  ),
  schema(
    "type:$extension:semver._semverrange",
    "rangeArrayField() stores native semverrange arrays; the same type is the VARIADIC multirange argument.",
  ),
  schema(
    "type:$extension:semver.semver",
    "field() stores semver text; filter, comparison and order use the qualified native operators.",
    { ordering: precedence },
  ),
  schema(
    "type:$extension:semver.semvermultirange",
    "multirangeField() stores normalized, sorted, merged semver multiranges.",
  ),
  schema("type:$extension:semver.semverrange", "rangeField() stores continuous semver ranges with both bound flags."),
] as const;
