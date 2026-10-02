import * as v from "valibot";

/** Canonical CREATE EXTENSION names for new Neon PostgreSQL 18 installations.
 * Excludes unavailable/blocked installations, the built-in plpgsql baseline,
 * and wal2json (a decoder plugin, not an installable extension).
 * Versions and installation privileges must be inspected on the target.
 */
export const neonExtensionNames = [
  "address_standardizer",
  "address_standardizer_data_us",
  "anon",
  "autoinc",
  "bloom",
  "btree_gin",
  "btree_gist",
  "citext",
  "cube",
  "dblink",
  "dict_int",
  "earthdistance",
  "fuzzystrmatch",
  "h3",
  "h3_postgis",
  "hll",
  "hstore",
  "hypopg",
  "insert_username",
  "intagg",
  "intarray",
  "ip4r",
  "isn",
  "lakebase_text",
  "lakebase_tokenizer",
  "lakebase_vector",
  "lo",
  "ltree",
  "moddatetime",
  "neon",
  "neon_utils",
  "pg_cron",
  "pg_graphql",
  "pg_hashids",
  "pg_hint_plan",
  "pg_jsonschema",
  "pg_partman",
  "pg_prewarm",
  "pg_repack",
  "roaringbitmap",
  "pg_session_jwt",
  "pg_stat_statements",
  "pg_tiktoken",
  "pg_trgm",
  "pg_uuidv7",
  "pgcrypto",
  "pgjwt",
  "pgrag",
  "pgrouting",
  "pgrowlocks",
  "pgstattuple",
  "pgtap",
  "vector",
  "pgx_ulid",
  "plpgsql_check",
  "postgis",
  "postgis_raster",
  "postgis_sfcgal",
  "postgis_tiger_geocoder",
  "postgis_topology",
  "postgres_fdw",
  "prefix",
  "rdkit",
  "refint",
  "seg",
  "semver",
  "tablefunc",
  "tcn",
  "timescaledb",
  "tsm_system_rows",
  "tsm_system_time",
  "unaccent",
  "uuid-ossp",
  "xml2",
] as const;

export type NeonExtensionName = (typeof neonExtensionNames)[number];
export type NeonExtensionPrerequisite =
  | "support-enable"
  | "paid-plan"
  | "compute-restart"
  | "active-compute"
  | "cron-database";

export const neonExtensionCatalogue = {
  postgresVersion: 18,
  checkedAt: "2026-10-01",
  source: "https://neon.com/docs/extensions/pg-extensions",
  names: neonExtensionNames,
  prerequisites: {
    pg_repack: ["paid-plan", "support-enable", "compute-restart"],
    pg_cron: ["active-compute", "cron-database"],
  } satisfies Partial<Record<NeonExtensionName, readonly NeonExtensionPrerequisite[]>>,
} as const;

export const extensionSchemaValidator = v.pipe(
  v.string(),
  v.regex(/^[a-z][a-z0-9_]{0,62}$/),
  v.check(
    (name) => !name.startsWith("pg_") && !name.startsWith("loom_") && name !== "information_schema",
    "Reserved extension schema",
  ),
);
const extensionEntryValidator = v.strictObject({
  version: v.pipe(
    v.string(),
    v.minLength(1),
    v.check((value) => !value.includes("\0"), "Invalid version token"),
  ),
  schema: v.optional(extensionSchemaValidator, "extensions"),
});
const optionalExtension = v.optional(extensionEntryValidator);
// pg_cron's provider control schema is pg_catalog; its callable routines live in cron.
const optionalCronExtension = v.optional(
  v.strictObject({
    ...extensionEntryValidator.entries,
    schema: v.optional(v.union([extensionSchemaValidator, v.literal("pg_catalog")]), "extensions"),
  }),
);
// SAFETY: Every catalogue key has the same entry shape; only pg_cron accepts its provider control schema.
const extensionMapValidator = v.strictObject(
  Object.fromEntries(
    neonExtensionNames.map((name) => [name, name === "pg_cron" ? optionalCronExtension : optionalExtension]),
  ) as Record<NeonExtensionName, typeof optionalExtension>,
);
/** Empty intent serializes exactly like legacy configuration. Sort names for stable identity. */
export const extensionsValidator = v.pipe(
  extensionMapValidator,
  v.transform((extensions) => {
    const entries = Object.entries(extensions).filter(([, entry]) => entry !== undefined);
    if (!entries.length) return undefined;
    // SAFETY: Sorting parsed entries changes only key order, preserving the validated map shape.
    return Object.fromEntries(entries.sort(([left], [right]) => left.localeCompare(right))) as v.InferOutput<
      typeof extensionMapValidator
    >;
  }),
);
export type LoomExtensionsInput = v.InferInput<typeof extensionsValidator>;
export type LoomExtensions = NonNullable<v.InferOutput<typeof extensionsValidator>>;
