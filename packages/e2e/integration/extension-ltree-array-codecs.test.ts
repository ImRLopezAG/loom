import { test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import { defineRelations, eq, sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  createLtreeArrayCodec,
  createLqueryArrayCodec,
  createLtxtqueryArrayCodec,
} from "../../../apps/loom/src/core/extensions/ltree-array-codecs";
import { createLtreeCodec, type Ltree } from "../../../apps/loom/src/core/extensions/ltree-codec";
import {
  createLqueryCodec,
  type Lquery,
  type Ltxtquery,
} from "../../../apps/loom/src/core/extensions/ltree-query-codecs";
import {
  arrayCodec,
  booleanCodec,
  nullableCodec,
  type ExtensionCodec,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/codecs";
import {
  checkedExtensionExpression,
  createSqlOperator,
  extensionSqlDialect,
  extensionSqlType,
} from "../../../apps/loom/src/core/extensions/sql";
import { createExtensionField, type ExtensionValueSchema } from "../../../apps/loom/src/core/extensions/fields";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/ltree.json";

const schemaName = 'Ltree "Array_日本';
const qualifiedSchema = pg.escapeIdentifier(schemaName);
const paths = createLtreeArrayCodec(schemaName);
const queries = createLqueryArrayCodec(schemaName);
const searches = createLtxtqueryArrayCodec(schemaName);
const empty = { dimensions: [], values: [] };
const ranked = (rank: number, values: PostgreSqlArray<string>["values"]): PostgreSqlArray<string> => {
  const dimensions = [{ lowerBound: -2, length: values.length }];
  for (let depth = 1; depth < rank; depth++) {
    dimensions.unshift({ lowerBound: 0, length: 1 });
    values = [values];
  }
  return { dimensions, values };
};
const expression = (
  codec: ExtensionCodec<PostgreSqlArray<string>, PostgreSqlArray<string>>,
  input: PostgreSqlArray<string> | null,
) => {
  const nullable = nullableCodec(codec);
  return checkedExtensionExpression(
    sql`${sql.param(nullable.encode(input))}::${extensionSqlType(schemaName, codec.sqlType!.name)}[]`,
    nullable,
    [],
  );
};
async function withLtree(work: (client: pg.Client, url: string) => Promise<void>) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    try {
      await client.connect();
      assert.equal(
        (await client.query("select current_setting('server_version_num') version")).rows[0].version,
        "180006",
      );
      await client.query(
        `create schema ${qualifiedSchema}; create extension ltree schema ${qualifiedSchema} version '1.3'`,
      );
      assert.equal(
        (await client.query("select extversion from pg_extension where extname='ltree'")).rows[0].extversion,
        "1.3",
      );
      const [locale] = (
        await client.query("select datctype,datcollate from pg_database where datname=current_database()")
      ).rows;
      assert.ok(locale);
      assert.ok(
        (locale.datctype === "en_US.utf8" && locale.datcollate === "en_US.utf8") ||
          (locale.datctype === "C.UTF-8" && locale.datcollate === "C.UTF-8"),
      );
      await work(client, url);
    } finally {
      await client.end();
    }
  });
}

test("ltree.arrays.nativeMetadataCanonicalTextAndFullStorageRanks", async () => {
  await withLtree(async (client) => {
    for (const { name, codec, first, second, canonicalSecond, malformed } of [
      { name: "ltree", codec: paths, first: "Top.Science", second: "", canonicalSecond: "", malformed: "a..b" },
      {
        name: "lquery",
        codec: queries,
        first: "Top.*",
        second: "*{0,2}.foo|bar",
        canonicalSecond: "*{,2}.foo|bar",
        malformed: "a..b",
      },
      {
        name: "ltxtquery",
        codec: searches,
        first: "Top & Science",
        second: "Top | (Science & !Math)",
        canonicalSecond: "Top | Science & !Math",
        malformed: "Top && Science",
      },
    ]) {
      const type = `${qualifiedSchema}.${pg.escapeIdentifier(name)}[]`;
      const observed = async (input: string | null) =>
        (
          await client.query(
            `select $1::${type}::text text,pg_catalog.array_dims($1::${type}) dimensions,pg_catalog.cardinality($1::${type}) cardinality,pg_catalog.array_ndims($1::${type}) rank,pg_catalog.pg_typeof($1::${type})=$2::regtype native`,
            [input, type],
          )
        ).rows[0];
      assert.deepEqual(await observed("{}"), {
        text: "{}",
        dimensions: null,
        cardinality: 0,
        rank: null,
        native: true,
      });
      assert.deepEqual(await observed(null), {
        text: null,
        dimensions: null,
        cardinality: null,
        rank: null,
        native: true,
      });
      assert.deepEqual(codec.decode("{}"), empty);
      assert.equal(nullableCodec<PostgreSqlArray<string>, PostgreSqlArray<string>>(codec).decode(null), null);
      for (const lowerBound of [-2147483648, -2, 0, 1, 2147483646]) {
        const input = { dimensions: [{ lowerBound, length: 1 }], values: [first] };
        const raw = await observed(String(codec.encode(input)));
        assert.equal(raw.dimensions, `[${lowerBound}:${lowerBound}]`);
        assert.equal(raw.rank, 1);
        assert.equal(raw.cardinality, 1);
        assert.equal(raw.native, true);
        assert.deepEqual(codec.decode(raw.text), input);
      }
      for (let rank = 1; rank <= 6; rank++) {
        const input = ranked(rank, [first, null, second]);
        const expected = ranked(rank, [first, null, canonicalSecond]);
        const raw = await observed(String(codec.encode(input)));
        assert.equal(raw.dimensions, "[0:0]".repeat(rank - 1) + "[-2:0]");
        assert.equal(raw.cardinality, 3);
        assert.equal(raw.rank, rank);
        assert.equal(raw.native, true);
        const decoded = codec.decode(raw.text);
        assert.deepEqual(decoded, expected);
        assert.deepEqual(await observed(String(codec.encode(decoded))), raw);
      }
      for (const [input, code] of [
        [`[2147483647:2147483647]={"${first}"}`, "54000"],
        [`{{{{{{{"${first}"}}}}}}}`, "54000"],
        [`{{"${first}"},{"${first}","${second}"}}`, "22P02"],
        [`{"${malformed}"}`, "42601"],
      ])
        await assert.rejects(observed(input!), { code });
      const overflow = { dimensions: [{ lowerBound: 2147483647, length: 1 }], values: [first] };
      assert.throws(() => codec.encode(overflow), /upper bound overflow/);
      assert.throws(() => codec.decode(`[2147483647:2147483647]={"${first}"}`), /upper bound overflow/);
    }
    // Reproduce the existing generic codec behavioral RED against this exact database.
    const overflow = arrayCodec(createLtreeCodec(schemaName)).encode({
      dimensions: [{ lowerBound: 2147483647, length: 1 }],
      values: ["Top.Science"],
    });
    await assert.rejects(client.query(`select $1::${qualifiedSchema}."ltree"[]`, [overflow]), { code: "54000" });
  });
});

const anyPathMatches = createSqlOperator({
  schema: schemaName,
  name: "~",
  member: "operator:$extension:ltree.~($extension:ltree._ltree,$extension:ltree.lquery)",
  left: nullableCodec(paths),
  right: nullableCodec(createLqueryCodec(schemaName)),
  result: nullableCodec(booleanCodec),
  dependencies: [],
  observability: "tables",
  authority: "query",
});
const firstPathMatches = createSqlOperator({
  schema: schemaName,
  name: "?~",
  member: "operator:$extension:ltree.?~($extension:ltree._ltree,$extension:ltree.lquery)",
  left: nullableCodec(paths),
  right: nullableCodec(createLqueryCodec(schemaName)),
  result: nullableCodec(createLtreeCodec(schemaName)),
  dependencies: [],
  observability: "tables",
  authority: "query",
});
const anyQueryMatches = createSqlOperator({
  schema: schemaName,
  name: "?",
  member: "operator:$extension:ltree.?($extension:ltree.ltree,$extension:ltree._lquery)",
  left: nullableCodec(createLtreeCodec(schemaName)),
  right: nullableCodec(queries),
  result: nullableCodec(booleanCodec),
  dependencies: [],
  observability: "tables",
  authority: "query",
});

test("ltree.arrays.nativeOperatorsKeepTheirNarrowerRankAndNullLeafLimits", async () => {
  await withLtree(async (client, url) => {
    const dialect = extensionSqlDialect(nodePgCodecs);
    const cases = [
      { path: empty, query: empty, matches: false, first: null },
      {
        path: ranked(1, ["Top.Other", "Top.Science"]),
        query: ranked(1, ["Other.*", "Top.*"]),
        matches: true,
        first: "Top.Science",
      },
      { path: null, query: null, matches: null, first: null },
    ];
    for (const { path, query, matches, first } of cases) {
      for (const { value, expected } of [
        { value: anyPathMatches(path, "Top.Science"), expected: matches },
        { value: firstPathMatches(path, "Top.Science"), expected: first },
        { value: anyQueryMatches("Top.Science", query), expected: matches },
      ]) {
        const compiled = dialect.sqlToQuery(value);
        assert.ok(compiled.sql.includes(`operator(${qualifiedSchema}.`));
        assert.deepEqual((await client.query(`select ${compiled.sql} value`, compiled.params)).rows, [
          { value: expected },
        ]);
      }
    }
    for (const { rank, leaves, code } of [
      { rank: 1, leaves: [null, "Top.Science"], code: "22004" },
      { rank: 2, leaves: ["Top.Other", "Top.Science"], code: "2202E" },
    ]) {
      const path = ranked(rank, leaves);
      const query = ranked(
        rank,
        leaves.map((value) => (value === null ? null : "Top.*")),
      );
      // These are valid storage arrays. Only the native operators reject them.
      paths.encode(path);
      queries.encode(query);
      for (const expression of [
        anyPathMatches(path, "Top.Science"),
        firstPathMatches(path, "Top.Science"),
        anyQueryMatches("Top.Science", query),
      ]) {
        const compiled = dialect.sqlToQuery(expression);
        await assert.rejects(client.query(`select ${compiled.sql}`, compiled.params), { code });
      }
    }
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      const path = ranked(1, ["Top.Other", "Top.Science"]);
      const query = ranked(1, ["Other.*", "Top.*"]);
      assert.deepEqual(
        await connection.transaction((db) =>
          db
            .select({
              matches: anyPathMatches(path, "Top.Science"),
              first: firstPathMatches(path, "Top.Science"),
              queryMatches: anyQueryMatches("Top.Science", query),
            })
            .from(sql`(values (1)) fixture(id)`)
            .where(anyPathMatches(path, "Top.Science")),
        ),
        [{ matches: true, first: "Top.Science", queryMatches: true }],
      );
    } finally {
      await connection.close();
    }
  });
});

const noSearch = { filter: false, comparison: false, order: false, text: false } as const;
const leaf: ExtensionValueSchema = { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] };
let nestedValue: ExtensionValueSchema = leaf;
for (let rank = 1; rank < 6; rank++)
  nestedValue = { kind: "union", variants: [leaf, { kind: "array", items: nestedValue }] };
const portableArray: ExtensionValueSchema = {
  kind: "object",
  properties: {
    dimensions: {
      kind: "array",
      items: {
        kind: "object",
        properties: { lowerBound: { kind: "number", integer: true }, length: { kind: "number", integer: true } },
      },
    },
    values: { kind: "array", items: nestedValue },
  },
};
const pathField = () =>
  createExtensionField<PostgreSqlArray<Ltree>, typeof noSearch>({
    extension: {
      name: "ltree",
      version: "1.3",
      schema: schemaName,
      apiSupport: { status: "verified", digest: manifest.digest },
    },
    member: "type:$extension:ltree._ltree",
    type: "ltree",
    array: true,
    codec: paths,
    value: portableArray,
    search: noSearch,
  });
const queryField = () =>
  createExtensionField<PostgreSqlArray<Lquery>, typeof noSearch>({
    extension: {
      name: "ltree",
      version: "1.3",
      schema: schemaName,
      apiSupport: { status: "verified", digest: manifest.digest },
    },
    member: "type:$extension:ltree._lquery",
    type: "lquery",
    array: true,
    codec: queries,
    value: portableArray,
    search: noSearch,
  });
const searchField = () =>
  createExtensionField<PostgreSqlArray<Ltxtquery>, typeof noSearch>({
    extension: {
      name: "ltree",
      version: "1.3",
      schema: schemaName,
      apiSupport: { status: "verified", digest: manifest.digest },
    },
    member: "type:$extension:ltree._ltxtquery",
    type: "ltxtquery",
    array: true,
    codec: searches,
    value: portableArray,
    search: noSearch,
  });
const fieldSchema = defineSchema(
  (fields) => ({
    docs: {
      path: pathField(),
      query: queryField(),
      search: searchField(),
      fallback: queryField().notNull().default(queries.decode('[-2:-2]={"*{0,2}.foo|bar"}')),
    },
    children: {
      parentId: fields.reference("docs").notNull(),
      path: pathField(),
      query: queryField(),
      search: searchField(),
    },
  }),
  { namespace: "app" },
);
const { docs, children } = fieldSchema.tables;
const relations = defineRelations(fieldSchema.tables, (r) => ({
  docs: { children: r.many.children({ from: r.docs._id, to: r.children.parentId }) },
  children: { parent: r.one.docs({ from: r.children.parentId, to: r.docs._id }) },
}));

test("ltree.arrays.storedDefaultsFieldsNestedBrandsAndRollback", async () => {
  await withLtree(async (client, url) => {
    assert.equal(pathField().metadata.extension?.value.kind, "object");
    for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(fieldSchema)))
      await client.query(statement);
    const connection = await connectDatabase({ schema: fieldSchema, relations, connectionString: url });
    try {
      const path = paths.decode(String(paths.encode(ranked(2, ["Top.Science", null, ""]))));
      const query = queries.decode(String(queries.encode(ranked(2, ["Top.*", null, "*{0,2}.foo|bar"]))));
      const search = searches.decode(
        String(searches.encode(ranked(6, ["Top & Science", null, "Top | (Science & !Math)"]))),
      );
      const expectedQuery = queries.decode(String(queries.encode(ranked(2, ["Top.*", null, "*{,2}.foo|bar"]))));
      const expectedSearch = searches.decode(
        String(searches.encode(ranked(6, ["Top & Science", null, "Top | Science & !Math"]))),
      );
      const [row] = await connection.transaction((db) => db.insert(docs).values({ path, query, search }).returning());
      assert.ok(row);
      assert.deepEqual(row.path, path);
      assert.deepEqual(row.query, expectedQuery);
      assert.deepEqual(row.search, expectedSearch);
      assert.deepEqual(row.fallback, queries.decode('[-2:-2]={"*{,2}.foo|bar"}'));
      assert.deepEqual(
        (
          await client.query(
            `select pg_typeof(path)=$1::regtype path,pg_typeof(query)=$2::regtype query,pg_typeof(search)=$3::regtype search from app.docs`,
            [`${qualifiedSchema}."ltree"[]`, `${qualifiedSchema}."lquery"[]`, `${qualifiedSchema}."ltxtquery"[]`],
          )
        ).rows,
        [{ path: true, query: true, search: true }],
      );
      const inserted = await connection.transaction((db) =>
        db
          .insert(children)
          .values([
            { parentId: row._id, path, query, search },
            { parentId: row._id, path: null, query: null, search: null },
            { parentId: row._id, path: paths.decode("{}"), query: queries.decode("{}"), search: searches.decode("{}") },
          ])
          .returning({ id: children._id, path: children.path, query: children.query, search: children.search }),
      );
      assert.deepEqual(
        await connection.transaction((db) =>
          db.select({ path: docs.path, query: docs.query, search: docs.search }).from(docs),
        ),
        [{ path, query: expectedQuery, search: expectedSearch }],
      );
      const parent = await connection.transaction((db) =>
        db.query.docs.findFirst({
          columns: { path: true, query: true, search: true },
          with: { children: { columns: { _id: true, path: true, query: true, search: true } } },
        }),
      );
      assert.ok(parent);
      const brandedPath: PostgreSqlArray<Ltree> | null = parent.path;
      const brandedQuery: PostgreSqlArray<Lquery> | null = parent.query;
      const brandedSearch: PostgreSqlArray<Ltxtquery> | null = parent.search;
      assert.deepEqual(brandedPath, path);
      assert.deepEqual(brandedQuery, expectedQuery);
      assert.deepEqual(brandedSearch, expectedSearch);
      assert.equal(parent.children.length, 3);
      for (const child of parent.children) {
        const expected = inserted.find((entry) => entry.id === child._id);
        assert.ok(expected);
        assert.deepEqual(
          { path: child.path, query: child.query, search: child.search },
          { path: expected.path, query: expected.query, search: expected.search },
        );
      }
      for (const malformed of [
        expression(paths, ranked(1, ["a..b"])),
        expression(queries, ranked(1, ["a..b"])),
        expression(searches, ranked(1, ["Top && Science"])),
      ]) {
        await assert.rejects(
          connection.transaction(async (db) => {
            await db
              .update(docs)
              .set({ path: paths.decode("{}"), query: queries.decode("{}"), search: searches.decode("{}") })
              .where(eq(docs._id, row._id));
            await db.select({ malformed }).from(docs);
          }),
        );
        assert.deepEqual(
          await connection.transaction((db) =>
            db.select({ path: docs.path, query: docs.query, search: docs.search }).from(docs),
          ),
          [{ path, query: expectedQuery, search: expectedSearch }],
        );
      }
      const dimensionsBefore = (
        await client.query(
          "select array_dims(path) path,array_dims(query) query,array_dims(search) search from app.docs",
        )
      ).rows;
      assert.deepEqual(dimensionsBefore, [
        { path: "[0:0][-2:0]", query: "[0:0][-2:0]", search: "[0:0][0:0][0:0][0:0][0:0][-2:0]" },
      ]);
    } finally {
      await connection.close();
    }
  });
});
