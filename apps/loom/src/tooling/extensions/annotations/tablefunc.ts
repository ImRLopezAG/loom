const sources = [
  "https://www.postgresql.org/docs/18/tablefunc.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/tablefunc/tablefunc.c",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/tablefunc/tablefunc--1.0.sql",
  "apps/loom/src/tooling/extensions/manifests/tablefunc.json",
  "apps/loom/src/core/extensions/adapters/tablefunc.ts",
] as const;
const unit =
  "packages/tests/unit/extensions-tablefunc.test.ts: exact contract, qualified SQL, cast managed query text, quoted connectby identities, row codecs";
const types =
  "packages/tests/types/extensions-tablefunc.test-d.ts: typed row columns, optional branch/pos columns, rejected raw SQL text, exact factory version";
const database =
  "packages/e2e/integration/extensions-tablefunc.test.ts: native oracle equality for all 20 members, STRICT NULL, native type checks, rollback visibility; source-bound member gates remain required";
const evidence = [...sources, unit, types, database] as const;
const query = {
  authority: "query",
  observability: "tables",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  nativeAcceptance: "pending",
} as const;
const managed = "NestedQuery only; caller SQL text is never accepted";
const crosstabNulls = "STRICT: a NULL argument yields no rows; NULL row names group; NULL values stay NULL";
const connectbyNested = "Quoted relation identity or NestedQuery as a parenthesized source; never caller SQL text";
const connectbyNulls =
  "STRICT: a NULL argument yields no rows; the start row is always emitted at level 0, even when absent from the source";
const connectbyType =
  "keyCodec must carry the source key's exact SQL type; PostgreSQL rejects mismatched return key types";
const fixedRow = (width: 2 | 3 | 4) =>
  ({
    disposition: "query",
    reason: `crosstab${width} rows and codecs.crosstab${width} / sql.types decode the captured row_name plus category_1..category_${width} text attributes in captured order.`,
    evidence,
    semantics: {
      ...query,
      result: `{ row_name: string | null; category_1..category_${width}: string | null }`,
      codec: `pg:composite:1:tablefunc_crosstab_${width} (all fields pg:text:1:nullable)`,
      nulls: "Composite NULL attributes decode as null",
    },
  }) as const;
const arrayRow = (width: 2 | 3 | 4) =>
  ({
    disposition: "query",
    reason: `codecs.crosstab${width}Array / sql.types decodes the captured array of tablefunc_crosstab_${width}, preserving dimensions and NULL elements.`,
    evidence,
    semantics: {
      ...query,
      result: `PostgreSqlArray<tablefunc_crosstab_${width} row>`,
      codec: `pg:array:1:,:pg:composite:1:tablefunc_crosstab_${width}`,
      nulls: "NULL elements are preserved",
    },
  }) as const;

/** Reviewed dispositions; final per-member acceptance requires source-bound native and provider receipts. */
export const tablefuncAnnotationContract = {
  extension: "tablefunc",
  postgresMajor: 18,
  version: "1.0",
  provider: "neon",
  digest: "08f54e73281a2592eddf0ac6f555ba1a0b3c0961fb7ab6eab05be90ab74b66d4",
  providerAcceptance: "pending",
} as const;

export const tablefuncAnnotations = [
  { id: 'composite type:"$extension:tablefunc".tablefunc_crosstab_2', ...fixedRow(2) },
  { id: 'composite type:"$extension:tablefunc".tablefunc_crosstab_3', ...fixedRow(3) },
  { id: 'composite type:"$extension:tablefunc".tablefunc_crosstab_4', ...fixedRow(4) },
  {
    id: "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
    disposition: "query",
    reason:
      "connectby({ key, parent, start, maxDepth, branchDelimiter }) returns keyid, parent_keyid, level and branch. Identifiers are quoted before the native SPI splice.",
    evidence,
    semantics: {
      ...query,
      result: "setof { keyid; parent_keyid | null; level: number; branch: string }",
      codec: "anonymous record columns from keyCodec, pg:int4:1 and pg:text:1",
      nulls: connectbyNulls,
      nested: connectbyNested,
      limitation: connectbyType,
    },
  },
  {
    id: "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
    disposition: "query",
    reason:
      "connectby({ key, parent, start, maxDepth }) returns keyid, parent_keyid and level without a branch column.",
    evidence,
    semantics: {
      ...query,
      result: "setof { keyid; parent_keyid | null; level: number }",
      codec: "anonymous record columns from keyCodec and pg:int4:1",
      nulls: connectbyNulls,
      nested: connectbyNested,
      limitation: connectbyType,
    },
  },
  {
    id: "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
    disposition: "query",
    reason:
      "connectby({ orderBy, branchDelimiter, ... }) orders siblings by the quoted orderBy column and appends branch and serial pos columns.",
    evidence,
    semantics: {
      ...query,
      result: "setof { keyid; parent_keyid | null; level: number; branch: string; pos: number }",
      codec: "anonymous record columns from keyCodec, pg:int4:1 and pg:text:1",
      nulls: connectbyNulls,
      nested: connectbyNested,
      limitation: connectbyType,
    },
  },
  {
    id: "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
    disposition: "query",
    reason: "connectby({ orderBy, ... }) orders siblings by the quoted orderBy column and appends a serial pos column.",
    evidence,
    semantics: {
      ...query,
      result: "setof { keyid; parent_keyid | null; level: number; pos: number }",
      codec: "anonymous record columns from keyCodec and pg:int4:1",
      nulls: connectbyNulls,
      nested: connectbyNested,
      limitation: connectbyType,
    },
  },
  {
    id: "routine:$extension:tablefunc.crosstab(pg_catalog.text,pg_catalog.int4)",
    disposition: "query",
    reason:
      "crosstab({ source, count, fields }) binds the captured two-argument form. PostgreSQL ignores the int4 argument; the column definition list alone sets the width.",
    evidence,
    semantics: {
      ...query,
      result: "setof record with a caller row-name plus value column schema",
      codec: "anonymous record columns from caller codecs",
      nulls: crosstabNulls,
      nested: managed,
    },
  },
  {
    id: "routine:$extension:tablefunc.crosstab(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "crosstab({ source, categories, fields }) binds crosstab_hash: categories map values to columns; extra source columns between row name and category are copied from each group's first row.",
    evidence,
    semantics: {
      ...query,
      result: "setof record with row name, extra and one column per category",
      codec: "anonymous record columns from caller codecs",
      nulls: `${crosstabNulls}; categories must be non-empty, single-column, non-NULL and unique`,
      nested: managed,
    },
  },
  {
    id: "routine:$extension:tablefunc.crosstab(pg_catalog.text)",
    disposition: "query",
    reason:
      "crosstab({ source, fields }) fills value columns in source order within each row-name group; ordering comes from the nested query orderBy.",
    evidence,
    semantics: {
      ...query,
      result: "setof record with a caller row-name plus value column schema",
      codec: "anonymous record columns from caller codecs",
      nulls: crosstabNulls,
      nested: managed,
    },
  },
  ...([2, 3, 4] as const).map(
    (width) =>
      ({
        id: `routine:$extension:tablefunc.crosstab${width}(pg_catalog.text)`,
        disposition: "query",
        reason: `crosstab${width}({ source }) returns captured tablefunc_crosstab_${width} rows; source values must be text.`,
        evidence,
        semantics: {
          ...query,
          result: `setof tablefunc_crosstab_${width}`,
          codec: `pg:composite:1:tablefunc_crosstab_${width} named columns`,
          nulls: crosstabNulls,
          nested: managed,
        },
      }) as const,
  ),
  {
    id: "routine:$extension:tablefunc.normal_rand(pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "normalRand(count, mean, stddev, alias) returns count normally distributed float8 rows. Values are fresh per call and not controlled by setseed().",
    evidence,
    semantics: {
      ...query,
      observability: "external",
      result: "setof number | NonfiniteNumber",
      codec: "pg:float8:1",
      nulls: "STRICT: a NULL argument yields no rows; a negative count is an error",
    },
  },
  { id: "type:$extension:tablefunc._tablefunc_crosstab_2", ...arrayRow(2) },
  { id: "type:$extension:tablefunc._tablefunc_crosstab_3", ...arrayRow(3) },
  { id: "type:$extension:tablefunc._tablefunc_crosstab_4", ...arrayRow(4) },
  { id: "type:$extension:tablefunc.tablefunc_crosstab_2", ...fixedRow(2) },
  { id: "type:$extension:tablefunc.tablefunc_crosstab_3", ...fixedRow(3) },
  { id: "type:$extension:tablefunc.tablefunc_crosstab_4", ...fixedRow(4) },
] as const;
